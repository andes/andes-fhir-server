import { ObjectId } from 'mongodb';
import { resolveSchema, ServerError } from '@bluehalo/node-fhir-server-core';
import { RelatedPerson as fhirRelatedPerson, getDominio } from '../../encoders';
import { matchesRelationshipFilter } from '../../encoders/lib/relatedPerson';
import { fullurl } from '../../utils/data.util';
import { pruneEmpty } from '../../utils/pruneFhir';
import { parsePaging, buildPagingLinks, buildEntryFullUrl } from '../../utils/fhirPaging';
import { tokenQueryBuilder, stringEscape } from '../../utils/querybuilder.util';
import PatientRepository from '../../repositories/patient.repository';

const getRelatedPersonSchema = (base_version: string) => {
    return resolveSchema(base_version, 'RelatedPerson');
};

function extractPatientId(patientParam: string): string {
    return String(patientParam).replace(/^(?:.*\/)?Patient\//, '').trim();
}

function matchesBirthdate(birthDateStr: string | undefined, filterParam: string): boolean {
    if (!filterParam) {
        return true;
    }
    if (!birthDateStr) {
        return false;
    }
    const raw = String(filterParam).trim();
    const prefixMatch = raw.match(/^(eq|ne|gt|lt|ge|le|sa|eb|ap)(.+)$/i);
    const prefix = prefixMatch ? prefixMatch[1].toLowerCase() : 'eq';
    const targetDate = prefixMatch ? prefixMatch[2].trim() : raw;

    switch (prefix) {
        case 'eq':
            return birthDateStr.startsWith(targetDate);
        case 'ne':
            return !birthDateStr.startsWith(targetDate);
        case 'gt':
        case 'sa':
            return birthDateStr > targetDate;
        case 'ge':
            return birthDateStr >= targetDate || birthDateStr.startsWith(targetDate);
        case 'lt':
        case 'eb':
            return birthDateStr < targetDate;
        case 'le':
            return birthDateStr <= targetDate || birthDateStr.startsWith(targetDate);
        default:
            return birthDateStr.startsWith(targetDate);
    }
}

function matchesGender(resourceGender: string | undefined, genderParam: string): boolean {
    if (!genderParam) {
        return true;
    }
    if (!resourceGender) {
        return false;
    }
    const g = String(genderParam).trim().toLowerCase();
    let expected: string;
    if (g === 'male' || g === 'masculino') {
        expected = 'male';
    } else if (g === 'female' || g === 'femenino') {
        expected = 'female';
    } else if (g === 'other' || g === 'otro') {
        expected = 'other';
    } else {
        throw new ServerError('Género incorrecto');
    }
    return resourceGender.toLowerCase() === expected;
}

function matchesTelecom(
    telecomList: { system?: string; value?: string }[] | undefined,
    valueParam: string,
    expectedSystem?: 'phone' | 'email'
): boolean {
    if (!valueParam) {
        return true;
    }
    if (!telecomList || telecomList.length === 0) {
        return false;
    }
    const target = String(valueParam).trim().toLowerCase();
    return telecomList.some(t => {
        if (expectedSystem && t.system !== expectedSystem) {
            return false;
        }
        return String(t.value ?? '').toLowerCase().includes(target);
    });
}

/**
 * Busca recursos RelatedPerson aplicando filtros y paginación.
 */
async function search(args: any, context: any) {
    try {
        const { base_version } = args;
        const req = context?.req;

        const ignoredKeys = new Set(['base_version', '_count', '_offset']);
        const searchParams = Object.keys(args).filter(
            key => !ignoredKeys.has(key) && args[key] !== undefined && args[key] !== ''
        );

        if (searchParams.length === 0) {
            throw new ServerError('Se requiere enviar al menos un parámetro de búsqueda', {
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'warning', code: 'required', diagnostics: 'Se requiere enviar al menos un parámetro de búsqueda' }]
            });
        }

        const patientParam = args['patient'];
        const idParam = args['_id'] || args['id'];
        const identifierParam = args['identifier'];
        const nameParam = args['name'];
        const relationshipParam = args['relationship'];
        const birthdateParam = args['birthdate'];
        const genderParam = args['gender'];
        const activeParam = args['active'];
        const telecomParam = args['telecom'];
        const phoneParam = args['phone'];
        const emailParam = args['email'];

        const mongoQuery: Record<string, any> = {
            activo: true,
            'relaciones.0': { $exists: true }
        };

        if (patientParam) {
            const patientId = extractPatientId(patientParam);
            if (!ObjectId.isValid(patientId)) {
                mongoQuery._id = null;
            } else {
                mongoQuery._id = new ObjectId(patientId);
            }
        }

        if (idParam) {
            const orConds: any[] = [
                { 'relaciones._id': idParam },
                { 'relaciones.referencia': idParam }
            ];
            if (ObjectId.isValid(String(idParam))) {
                const objId = new ObjectId(String(idParam));
                orConds.push({ 'relaciones._id': objId }, { 'relaciones.referencia': objId });
            }
            mongoQuery.$or = orConds;
        }

        let targetIdentifierValue: string | undefined;
        if (identifierParam) {
            const parsedToken = tokenQueryBuilder(identifierParam, 'value', 'identifier', false) as any;
            targetIdentifierValue = String(parsedToken.value ?? '').trim();
            if (!patientParam && !idParam && targetIdentifierValue) {
                const escapedVal = stringEscape(targetIdentifierValue);
                const docRegex = new RegExp(`^${escapedVal}$`, 'i');
                const orConds: any[] = [
                    { 'relaciones.documento': docRegex },
                    { 'relaciones.referencia': targetIdentifierValue }
                ];
                if (ObjectId.isValid(targetIdentifierValue)) {
                    orConds.push({ 'relaciones.referencia': new ObjectId(targetIdentifierValue) });
                }

                // Como en PacienteSchema el documento de la persona relacionada vive en el documento
                // referenciado por relaciones.referencia, buscamos primero esos pacientes en la colección.
                const matchedPatientsByDoc = await PatientRepository.find({
                    activo: { $ne: false },
                    $or: [
                        { documento: docRegex },
                        { cuil: docRegex },
                        { numeroIdentificacion: docRegex }
                    ]
                });
                const matchedRefObjectIds: ObjectId[] = [];
                const matchedRefStrings: string[] = [];
                for (const mp of matchedPatientsByDoc ?? []) {
                    const mpId = String(mp._id ?? mp.id ?? '');
                    if (mpId) {
                        matchedRefStrings.push(mpId);
                        if (ObjectId.isValid(mpId)) {
                            matchedRefObjectIds.push(new ObjectId(mpId));
                        }
                    }
                }
                if (matchedRefObjectIds.length > 0) {
                    orConds.push({ 'relaciones.referencia': { $in: matchedRefObjectIds } });
                }
                if (matchedRefStrings.length > 0) {
                    orConds.push({ 'relaciones.referencia': { $in: matchedRefStrings } });
                }

                mongoQuery.$or = orConds;
            }
        }

        const patients = mongoQuery._id === null
            ? []
            : await PatientRepository.find(mongoQuery);

        const referenciaIds: string[] = [];
        for (const pat of patients) {
            for (const rel of pat.relaciones ?? []) {
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

        const RelatedPerson = getRelatedPersonSchema(base_version);
        const matchedRelatedPersons: any[] = [];

        for (const pat of patients) {
            for (const rel of pat.relaciones ?? []) {
                if (!rel?.relacion) {
                    continue;
                }

                const relIdStr = String(rel._id ?? '');
                const refIdStr = String(rel.referencia ?? '');

                if (idParam && relIdStr !== String(idParam) && refIdStr !== String(idParam)) {
                    continue;
                }

                const relatedDoc = rel.referencia ? relatedDocsMap.get(refIdStr) ?? null : null;
                const encoded = fhirRelatedPerson.encode(pat, rel, relatedDoc);
                if (!encoded) {
                    continue;
                }

                if (targetIdentifierValue) {
                    const hasMatchingId = (encoded.identifier ?? []).some(
                        idObj => String(idObj.value ?? '').toLowerCase() === targetIdentifierValue!.toLowerCase()
                    );
                    if (!hasMatchingId) {
                        continue;
                    }
                }

                if (nameParam) {
                    const nameNeedle = String(nameParam).trim().toLowerCase();
                    const fullText = (encoded.name?.[0]?.text ?? '').toLowerCase();
                    if (!fullText.includes(nameNeedle)) {
                        continue;
                    }
                }

                if (relationshipParam && !matchesRelationshipFilter(rel.relacion?.nombre, String(relationshipParam))) {
                    continue;
                }

                if (birthdateParam && !matchesBirthdate(encoded.birthDate, String(birthdateParam))) {
                    continue;
                }

                if (genderParam && !matchesGender(encoded.gender, String(genderParam))) {
                    continue;
                }

                if (activeParam !== undefined && activeParam !== null && activeParam !== '') {
                    const expectedActive = activeParam === true || String(activeParam).toLowerCase() === 'true';
                    if (Boolean(encoded.active) !== expectedActive) {
                        continue;
                    }
                }

                if (telecomParam && !matchesTelecom(encoded.telecom, String(telecomParam))) {
                    continue;
                }

                if (phoneParam && !matchesTelecom(encoded.telecom, String(phoneParam), 'phone')) {
                    continue;
                }

                if (emailParam && !matchesTelecom(encoded.telecom, String(emailParam), 'email')) {
                    continue;
                }

                matchedRelatedPersons.push(new RelatedPerson(encoded));
            }
        }

        const paging = parsePaging(req?.query || {}, {
            defaultCount: 50,
            maxCount: 200
        });

        const total = matchedRelatedPersons.length;
        const pagedResources = matchedRelatedPersons.slice(paging.offset, paging.offset + paging.count);

        const bundle: any = {
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            link: req ? buildPagingLinks(req, total, paging) : undefined,
            entry: pagedResources.length
                ? pagedResources.map(rp => ({
                    fullUrl: req
                        ? buildEntryFullUrl(req, base_version, 'RelatedPerson', rp.id)
                        : fullurl(rp),
                    resource: rp,
                    search: { mode: 'match' }
                }))
                : undefined
        };

        return pruneEmpty(bundle);
    } catch (err: any) {
        if (err instanceof ServerError) {
            throw err;
        }
        throw new ServerError(err.message || err, {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: err.code || 'exception', diagnostics: err.message || err }]
        });
    }
}

/**
 * Busca un recurso RelatedPerson por su ID (relaciones._id o relaciones.referencia).
 */
async function searchById(args: any, _context: any) {
    try {
        const { base_version, id } = args;
        if (!id) {
            return null;
        }

        const patient = await PatientRepository.findByRelatedId(String(id));
        if (!patient || !Array.isArray(patient.relaciones)) {
            return null;
        }

        const rel = patient.relaciones.find(
            (r: any) => String(r._id) === String(id) || String(r.referencia) === String(id)
        );
        if (!rel) {
            return null;
        }

        let relatedDoc = null;
        if (rel.referencia) {
            const docs = await PatientRepository.findByIds([String(rel.referencia)]);
            relatedDoc = docs[0] ?? null;
        }

        const RelatedPerson = getRelatedPersonSchema(base_version);
        const encoded = fhirRelatedPerson.encode(patient, rel, relatedDoc);
        return encoded ? new RelatedPerson(encoded) : null;
    } catch (err: any) {
        if (err instanceof ServerError) {
            throw err;
        }
        throw new ServerError(err.message || err, {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: err.code || 'exception', diagnostics: err.message || err }]
        });
    }
}

/**
 * Crea un nuevo vínculo RelatedPerson en el array relaciones del paciente en Andes.
 */
async function create(args: any, context: any) {
    try {
        const { resource } = args;
        const req = context?.req;
        const body = resource || req?.body;

        if (!body || !body.patient?.reference) {
            throw new ServerError('Se requiere la referencia al paciente (patient.reference)', {
                statusCode: 400,
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'required', diagnostics: 'Se requiere la referencia al paciente (patient.reference)' }]
            });
        }

        const { patientId, relacion } = fhirRelatedPerson.decode(body);
        if (!patientId || !ObjectId.isValid(patientId)) {
            throw new ServerError('El ID del paciente referenciado es inválido', {
                statusCode: 400,
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'invalid', diagnostics: 'El ID del paciente referenciado es inválido' }]
            });
        }

        const result = await PatientRepository.addRelation(patientId, relacion);
        if (!result) {
            throw new ServerError(`Paciente con ID ${patientId} no encontrado`, {
                statusCode: 404,
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'not-found', diagnostics: `Paciente con ID ${patientId} no encontrado` }]
            });
        }

        if (result.existing) {
            throw new ServerError(`La persona relacionada ya existe. ID: ${result.relationId}`, {
                statusCode: 200,
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'information',
                    code: 'informational',
                    diagnostics: `La persona relacionada ya existe. ID: ${result.relationId}`
                }],
                data: {
                    system: getDominio(),
                    value: result.relationId
                }
            });
        }

        throw new ServerError(`La persona relacionada fue creada. ID: ${result.relationId}`, {
            statusCode: 201,
            resourceType: 'OperationOutcome',
            issue: [],
            data: {
                system: getDominio(),
                value: result.relationId
            }
        });
    } catch (error: any) {
        if (error instanceof ServerError) {
            throw error;
        }
        throw new ServerError('No se pudo crear la persona relacionada', {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: 'exception', diagnostics: error.message || error }]
        });
    }
}

const RelatedPersonService = {
    search,
    searchById,
    create
};

export = RelatedPersonService;
