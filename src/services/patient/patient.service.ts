import { Patient as fhirPac, RelatedPerson as fhirRelatedPerson, Immunization as fhirImmunization, getDominio } from '../../encoders';
import { resolveSchema, ServerError } from '@bluehalo/node-fhir-server-core';
import { fullurl } from '../../utils/data.util';
import { pruneEmpty } from '../../utils/pruneFhir';
import { parsePaging, buildPagingLinks, buildEntryFullUrl } from '../../utils/fhirPaging';
import PatientRepository from '../../repositories/patient.repository';
import VaccineRepository from '../../repositories/vaccine.repository';
import { FhirIdentifierSystems } from '../../constants';
import IpsService from '../ips/ips.service';

const getPatientSchema = (base_version: string) => {
    return resolveSchema(base_version, 'Patient');
};

const getRelatedPersonSchema = (base_version: string) => {
    return resolveSchema(base_version, 'RelatedPerson');
};

const getImmunizationSchema = (base_version: string) => {
    return resolveSchema(base_version, 'Immunization');
};

function normalizeQueryValues(val: any): string[] {
    if (!val) {
        return [];
    }
    if (Array.isArray(val)) {
        return val.map(v => String(v).trim());
    }
    return [String(val).trim()];
}

/**
 * Busca pacientes aplicando filtros y paginación.
 * Soporta _revinclude=RelatedPerson:patient y _revinclude:iterate=Patient:link.
 */
async function search(args: any, context: any) {
    try {
        const { base_version } = args;
        const req = context.req;

        const ignoredKeys = new Set([
            'base_version',
            '_revinclude',
            '_revinclude:iterate',
            '_revinclude:recurse',
            '_include',
            '_include:iterate',
            '_count',
            '_offset'
        ]);
        const searchParams = Object.keys(args).filter(
            key => !ignoredKeys.has(key) && args[key] !== undefined && args[key] !== ''
        );
        if (searchParams.length === 0) {
            throw new ServerError('Se requiere enviar al menos un parámetro de búsqueda', {
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'warning', code: 'required', diagnostics: 'Se requiere enviar al menos un parámetro de búsqueda' }]
            });
        }
        const query = PatientRepository.buildQuery(args);

        const rawQuery = req?.query || {};
        const paging = parsePaging(rawQuery, {
            defaultCount: 50,
            maxCount: 200
        });

        const total = await PatientRepository.count(query);
        const pacientes = await PatientRepository.find(query, {
            skip: paging.offset,
            limit: paging.count
        });

        const Patient = getPatientSchema(base_version);
        const pacientesFhir = pacientes.map(pac => new Patient(fhirPac.encode(pac)));

        const matchEntries = pacientesFhir.map(p => ({
            fullUrl: req
                ? buildEntryFullUrl(req, base_version, 'Patient', p.id)
                : fullurl(p),
            resource: p,
            search: { mode: 'match' }
        }));

        const revIncludeValues = [
            ...normalizeQueryValues(rawQuery['_revinclude']),
            ...normalizeQueryValues(args['_revinclude'])
        ];
        const revIncludeIterateValues = [
            ...normalizeQueryValues(rawQuery['_revinclude:iterate']),
            ...normalizeQueryValues(rawQuery['_revinclude:recurse']),
            ...normalizeQueryValues(args['_revinclude:iterate']),
            ...normalizeQueryValues(args['_revinclude:recurse'])
        ];

        const includeRelatedPerson = revIncludeValues.some(v => v.toLowerCase() === 'relatedperson:patient');
        const includeImmunization = revIncludeValues.some(v => v.toLowerCase() === 'immunization:patient');
        const includeLinkedPatients = revIncludeIterateValues.some(v => v.toLowerCase() === 'patient:link');

        const includedEntries: any[] = [];
        if (includeRelatedPerson && pacientes.length > 0) {
            const RelatedPerson = getRelatedPersonSchema(base_version);
            const referenciaIds: string[] = [];

            for (const pac of pacientes) {
                for (const rel of pac.relaciones ?? []) {
                    if (rel?.referencia) {
                        referenciaIds.push(String(rel.referencia));
                    }
                }
            }

            const relatedDocs = referenciaIds.length > 0
                ? await PatientRepository.findByIds(referenciaIds)
                : [];
            const relatedDocsMap = new Map<string, any>(
                relatedDocs.map(doc => [String(doc._id ?? doc.id), doc])
            );

            const seenResourceKeys = new Set<string>(
                pacientesFhir.map(p => `Patient/${p.id}`)
            );

            for (const pac of pacientes) {
                for (const rel of pac.relaciones ?? []) {
                    const relatedDoc = rel?.referencia
                        ? relatedDocsMap.get(String(rel.referencia)) ?? null
                        : null;

                    const encodedRel = fhirRelatedPerson.encode(pac, rel, relatedDoc);
                    if (!encodedRel) {
                        continue;
                    }

                    const rpResource = new RelatedPerson(encodedRel);
                    const rpKey = `RelatedPerson/${rpResource.id}`;
                    if (!seenResourceKeys.has(rpKey)) {
                        seenResourceKeys.add(rpKey);
                        includedEntries.push({
                            fullUrl: req
                                ? buildEntryFullUrl(req, base_version, 'RelatedPerson', rpResource.id)
                                : fullurl(rpResource),
                            resource: rpResource,
                            search: { mode: 'include' }
                        });
                    }

                    if (includeLinkedPatients && relatedDoc) {
                        const encodedLinkedPat = fhirPac.encode(relatedDoc);
                        if (encodedLinkedPat) {
                            encodedLinkedPat.link = [
                                ...(encodedLinkedPat.link ?? []),
                                {
                                    other: { reference: `RelatedPerson/${rpResource.id}` },
                                    type: 'seealso'
                                }
                            ];
                            const linkedPatientResource = new Patient(encodedLinkedPat);
                            const patKey = `Patient/${linkedPatientResource.id}`;
                            if (!seenResourceKeys.has(patKey)) {
                                seenResourceKeys.add(patKey);
                                includedEntries.push({
                                    fullUrl: req
                                        ? buildEntryFullUrl(req, base_version, 'Patient', linkedPatientResource.id)
                                        : fullurl(linkedPatientResource),
                                    resource: linkedPatientResource,
                                    search: { mode: 'include' }
                                });
                            }
                        }
                    }
                }
            }
        }

        if (includeImmunization && pacientes.length > 0) {
            const Immunization = getImmunizationSchema(base_version);
            const documentos = pacientes
                .map(pac => String(pac.documento ?? '').trim())
                .filter(Boolean);

            const vacunas = documentos.length > 0
                ? await VaccineRepository.findByDocuments(documentos)
                : [];

            const seenImmKeys = new Set<string>();
            for (const pac of pacientes) {
                const docPac = String(pac.documento ?? '').trim();
                if (!docPac) {
                    continue;
                }
                const patId = String(pac._id ?? pac.id);
                const patDisplay = `${pac.nombre || ''} ${pac.apellido || ''}`.trim();
                const patRef = {
                    reference: `Patient/${patId}`,
                    ...(patDisplay && { display: patDisplay })
                };

                const vacunasPac = vacunas.filter(
                    (v: any) => String(v.documento ?? '').trim() === docPac
                );

                for (const vac of vacunasPac) {
                    const encodedImm = fhirImmunization.encode(patRef, vac);
                    const immResource = new Immunization(pruneEmpty(encodedImm));
                    const immKey = `Immunization/${immResource.id}`;
                    if (!seenImmKeys.has(immKey)) {
                        seenImmKeys.add(immKey);
                        includedEntries.push({
                            fullUrl: req
                                ? buildEntryFullUrl(req, base_version, 'Immunization', immResource.id)
                                : fullurl(immResource),
                            resource: immResource,
                            search: { mode: 'include' }
                        });
                    }
                }
            }
        }

        const allEntries = [...matchEntries, ...includedEntries];

        const bundle: any = {
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            link: req ? buildPagingLinks(req, total, paging) : undefined,
            entry: allEntries.length ? allEntries : undefined
        };

        return pruneEmpty(bundle);
    } catch (err) {
        if (err instanceof ServerError) {
            throw err;
        }
        throw new ServerError(err.message || err, {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: (err as any).code || 'exception', diagnostics: err.message || err }]
        });
    }
}

/**
 * Busca un paciente por su ID.
 */
async function searchById(args: any, _context: any) {
    try {
        const { base_version, id } = args;
        const Patient = getPatientSchema(base_version);
        const patient = await PatientRepository.findById(id);
        return patient ? new Patient(fhirPac.encode(patient)) : null;
    } catch (err) {
        throw new ServerError(err.message || err, {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: (err as any).code || 'exception', diagnostics: err.message || err }]
        });
    }
}

/**
 * Crea un nuevo paciente o informa si ya existe.
 */
async function create(args: any, context: any) {
    try {
        const { base_version, resource } = args;
        const req = context.req;
        const body = resource || req.body; // Soporte para ambos flujos

        const identifier = body.identifier && body.identifier.length ? body.identifier : null;
        const gender = body.gender;

        if (identifier) {
            // Buscamos si ya existe
            const bundleResult = await search({ base_version, identifier, gender }, context);
            const pacienteExistente = bundleResult.entry && bundleResult.entry.length > 0 ? bundleResult.entry[0].resource : null;

            if (pacienteExistente) {
                const plainPatient = JSON.parse(JSON.stringify(pacienteExistente));
                throw new ServerError(`El paciente ya existe. ID: ${plainPatient.id}`, {
                    statusCode: 200,
                    resourceType: 'OperationOutcome',
                    issue: [{
                        severity: 'information',
                        code: 'informational',
                        diagnostics: `El paciente ya existe. ID: ${plainPatient.id}`
                    }],
                    data: plainPatient.identifier?.find((id: any) => id.system === FhirIdentifierSystems.ANDES_ID)
                });
            }
        }

        const paciente = fhirPac.decode(body as any);
        const result = await PatientRepository.insert(paciente);

        // En FHIR Create exitoso usualmente devuelve el recurso.
        // Pero el servidor a veces espera OperationOutcome vía ServerError para casos especiales.
        // Si queremos devolver 201 Created estándar, simplemente retornamos el recurso.
        // El código original tiraba un ServerError con status 201.
        throw new ServerError(`El paciente fue creado. ID: ${result.insertedId}`, {
            statusCode: 201,
            resourceType: 'OperationOutcome',
            issue: [],
            data: {
                system: getDominio(),
                value: result.insertedId.toString()
            }
        });

    } catch (error) {
        if (error instanceof ServerError) {
            throw error;
        }
        throw new ServerError('No se pudo crear el paciente', {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: 'exception', diagnostics: (error as any).message || error }]
        });
    }
}

/**
 * Devuelve el International Patient Summary (IPS) para un paciente dado su ID de Andes.
 * FHIR Operation: GET /Patient/:id/$summary
 */
async function summary(args: any, context: any, _logger?: any) {
    try {
        const { base_version, id } = args;
        const patientId = id || context?.req?.params?.id;

        if (!patientId) {
            throw new ServerError('Se requiere el ID del paciente para generar el IPS', {
                statusCode: 400,
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'required', diagnostics: 'Se requiere el ID del paciente' }]
            });
        }

        const patient = await PatientRepository.findById(patientId);
        if (!patient) {
            throw new ServerError(`Paciente con ID ${patientId} no encontrado`, {
                statusCode: 404,
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'not-found', diagnostics: `Paciente con ID ${patientId} no encontrado` }]
            });
        }

        return await IpsService.build(base_version, patient);
    } catch (err: any) {
        if (err instanceof ServerError) {
            throw err;
        }
        throw new ServerError(err.message || 'Error al generar el resumen IPS', {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: err.code || 'exception', diagnostics: err.message || err }]
        });
    }
}

/**
 * Devuelve el International Patient Summary (IPS) buscando al paciente por su identificador.
 * FHIR Operation: GET /Patient/$summary?identifier=...
 */
async function summaryByIdentifier(args: any, context: any, _logger?: any) {
    try {
        const { base_version, identifier } = args;
        const rawIdentifier = identifier || context?.req?.query?.identifier;

        if (!rawIdentifier) {
            throw new ServerError('Se requiere el parámetro identifier para generar el IPS', {
                statusCode: 400,
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'required', diagnostics: 'Se requiere el parámetro identifier' }]
            });
        }

        const query = PatientRepository.buildQuery({ identifier: rawIdentifier });
        const patients = await PatientRepository.find(query);

        if (!patients || patients.length === 0) {
            throw new ServerError(`No se encontró paciente con identificador ${rawIdentifier}`, {
                statusCode: 404,
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'not-found', diagnostics: `No se encontró paciente con identificador ${rawIdentifier}` }]
            });
        }

        if (patients.length > 1) {
            throw new ServerError(`Se encontró más de un paciente con el identificador ${rawIdentifier}`, {
                statusCode: 400,
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'warning', code: 'multiple-matches', diagnostics: 'Múltiples pacientes encontrados para el identificador suministrado' }]
            });
        }

        return await IpsService.build(base_version, patients[0]);
    } catch (err: any) {
        if (err instanceof ServerError) {
            throw err;
        }
        throw new ServerError(err.message || 'Error al generar el resumen IPS por identificador', {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: err.code || 'exception', diagnostics: err.message || err }]
        });
    }
}

const PatientService = {
    search,
    searchById,
    create,
    summary,
    summaryByIdentifier
};

export = PatientService;
