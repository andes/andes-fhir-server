import { resolveSchema, ServerError } from '@bluehalo/node-fhir-server-core';
import { Immunization as fhirImmunization, getDominio } from '../../encoders';
import { FhirIdentifierSystems, resolveIdentifierSystem } from '../../constants';
import PatientRepository from '../../repositories/patient.repository';
import VaccineRepository from '../../repositories/vaccine.repository';
import { fullurl } from '../../utils/data.util';
import { pruneEmpty } from '../../utils/pruneFhir';
import { parsePaging, buildPagingLinks, buildEntryFullUrl } from '../../utils/fhirPaging';

const getImmunizationSchema = (base_version: string) => {
    return resolveSchema(base_version, 'Immunization');
};

function cleanPatientReference(ref?: string): string {
    if (!ref) {
        return '';
    }
    return String(ref).trim().replace(/^(?:.*\/)?Patient\//, '');
}

function buildPatientRefObject(patientDoc: any | null, vacunaDoc: any) {
    if (patientDoc && (patientDoc._id || patientDoc.id)) {
        const patId = String(patientDoc._id ?? patientDoc.id);
        const display = `${patientDoc.nombre || ''} ${patientDoc.apellido || ''}`.trim();
        return {
            reference: `Patient/${patId}`,
            ...(display && { display })
        };
    }

    const fallbackDisplay = `${vacunaDoc?.nombre || ''} ${vacunaDoc?.apellido || ''}`.trim();
    return {
        ...(fallbackDisplay && { display: fallbackDisplay }),
        ...(vacunaDoc?.documento && {
            identifier: {
                system: FhirIdentifierSystems.DNI,
                value: String(vacunaDoc.documento)
            }
        })
    };
}

/**
 * GET /4_0_1/Immunization
 * Soporta filtros: patient, patient.identifier / patient:identifier / identifier, _id, date, vaccine-code, status
 */
async function search(args: any, context: any) {
    try {
        const { base_version } = args;
        const req = context?.req;
        const rawQuery = req?.query || {};

        const patientParam = args['patient'] ?? rawQuery['patient'];
        const identifierParam =
            args['patient.identifier'] ??
            args['patient:identifier'] ??
            args['identifier'] ??
            rawQuery['patient.identifier'] ??
            rawQuery['patient:identifier'] ??
            rawQuery['identifier'];
        const idParam = args['_id'] ?? args['id'] ?? rawQuery['_id'] ?? rawQuery['id'];
        const dateParam = args['date'] ?? rawQuery['date'];
        const vaccineCodeParam =
            args['vaccine-code'] ??
            args['vaccine_code'] ??
            rawQuery['vaccine-code'];
        const statusParam = args['status'] ?? rawQuery['status'];

        const hasAnyFilter = [
            patientParam,
            identifierParam,
            idParam,
            dateParam,
            vaccineCodeParam,
            statusParam
        ].some(v => v !== undefined && v !== '');

        if (!hasAnyFilter) {
            throw new ServerError('Se requiere enviar al menos un parámetro de búsqueda', {
                statusCode: 400,
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'warning',
                    code: 'required',
                    diagnostics: 'Se requiere enviar al menos un parámetro de búsqueda (ej. patient, identifier, _id, date, vaccine-code)'
                }]
            });
        }

        const paging = parsePaging(rawQuery, {
            defaultCount: 50,
            maxCount: 200
        });

        // En nomivac todas las vacunas aplicadas tienen status 'completed'
        if (statusParam && String(statusParam).trim().toLowerCase() !== 'completed') {
            return pruneEmpty({
                resourceType: 'Bundle',
                type: 'searchset',
                total: 0,
                link: req ? buildPagingLinks(req, 0, paging) : undefined
            });
        }

        let documentoFilter: string | undefined;
        let matchedPatient: any = null;

        if (patientParam) {
            const cleanPatId = cleanPatientReference(patientParam);
            matchedPatient = await PatientRepository.findById(cleanPatId);
            if (!matchedPatient || !matchedPatient.documento) {
                return pruneEmpty({
                    resourceType: 'Bundle',
                    type: 'searchset',
                    total: 0,
                    link: req ? buildPagingLinks(req, 0, paging) : undefined
                });
            }
            documentoFilter = String(matchedPatient.documento).trim();
        } else if (identifierParam) {
            const rawIdent = String(identifierParam).trim();
            const [sysPart, valPart] = rawIdent.includes('|')
                ? rawIdent.split('|')
                : ['', rawIdent];
            const canonicalSys = resolveIdentifierSystem(sysPart);

            if (
                canonicalSys === FhirIdentifierSystems.ANDES_ID ||
                (sysPart && canonicalSys === resolveIdentifierSystem(getDominio()))
            ) {
                matchedPatient = await PatientRepository.findById(valPart.trim());
                if (!matchedPatient || !matchedPatient.documento) {
                    return pruneEmpty({
                        resourceType: 'Bundle',
                        type: 'searchset',
                        total: 0,
                        link: req ? buildPagingLinks(req, 0, paging) : undefined
                    });
                }
                documentoFilter = String(matchedPatient.documento).trim();
            } else {
                documentoFilter = valPart.trim();
                matchedPatient = await PatientRepository.findOne({
                    documento: documentoFilter,
                    activo: true
                });
            }
        }

        const query = VaccineRepository.buildQuery({
            _id: idParam,
            documento: documentoFilter,
            date: dateParam,
            vaccineCode: vaccineCodeParam
        });

        const total = await VaccineRepository.count(query);
        const vacunas = await VaccineRepository.find(query, {
            skip: paging.offset,
            limit: paging.count
        });

        const patientsByDoc = new Map<string, any>();
        if (matchedPatient && matchedPatient.documento) {
            patientsByDoc.set(String(matchedPatient.documento).trim(), matchedPatient);
        } else if (vacunas.length > 0) {
            const uniqueDocs = Array.from(
                new Set(vacunas.map((v: any) => String(v.documento ?? '').trim()).filter(Boolean))
            );
            for (const docNro of uniqueDocs) {
                const pat = await PatientRepository.findOne({ documento: docNro, activo: true });
                if (pat) {
                    patientsByDoc.set(docNro, pat);
                }
            }
        }

        const ImmunizationSchema = getImmunizationSchema(base_version);
        const entries = vacunas.map((vacuna: any) => {
            const patDoc = patientsByDoc.get(String(vacuna.documento ?? '').trim()) ?? matchedPatient;
            const patientRef = buildPatientRefObject(patDoc, vacuna);
            const encoded = fhirImmunization.encode(patientRef, vacuna);
            const resource = new ImmunizationSchema(pruneEmpty(encoded));
            return {
                fullUrl: req
                    ? buildEntryFullUrl(req, base_version, 'Immunization', resource.id)
                    : fullurl(resource),
                resource,
                search: { mode: 'match' }
            };
        });

        const bundle: any = {
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            link: req ? buildPagingLinks(req, total, paging) : undefined,
            entry: entries.length ? entries : undefined
        };

        return pruneEmpty(bundle);
    } catch (err: any) {
        if (err instanceof ServerError) {
            throw err;
        }
        throw new ServerError(err.message || String(err), {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: err.code || 'exception',
                diagnostics: err.message || String(err)
            }]
        });
    }
}

/**
 * GET /4_0_1/Immunization/:id
 */
async function searchById(args: any, _context?: any) {
    try {
        const { base_version, id } = args;
        const vacuna = await VaccineRepository.findById(id);
        if (!vacuna) {
            throw new ServerError('Immunization not found', {
                statusCode: 404,
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'not-found',
                    diagnostics: 'Immunization not found'
                }]
            });
        }

        const patDoc = vacuna.documento
            ? await PatientRepository.findOne({ documento: String(vacuna.documento).trim(), activo: true })
            : null;
        const patientRef = buildPatientRefObject(patDoc, vacuna);

        const ImmunizationSchema = getImmunizationSchema(base_version);
        const encoded = fhirImmunization.encode(patientRef, vacuna);
        return new ImmunizationSchema(pruneEmpty(encoded));
    } catch (err: any) {
        if (err instanceof ServerError) {
            throw err;
        }
        throw new ServerError(err.message || String(err), {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: err.code || 'exception',
                diagnostics: err.message || String(err)
            }]
        });
    }
}

export = {
    search,
    searchById
};
