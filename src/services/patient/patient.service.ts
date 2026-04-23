import { Patient as fhirPac } from '@andes/fhir';
import { resolveSchema, ServerError } from '@asymmetrik/node-fhir-server-core';
import { fullurl } from '../../utils/data.util';
import { pruneEmpty } from '../../utils/pruneFhir';
import { parsePaging, buildPagingLinks, buildEntryFullUrl } from '../../utils/fhirPaging';
import PatientRepository from '../../repositories/patient.repository';
import { FhirIdentifierSystems } from '../../constants';

const getPatientSchema = (base_version: string) => {
    return resolveSchema(base_version, 'Patient');
};

/**
 * Busca pacientes aplicando filtros y paginación.
 */
async function search(args: any, context: any) {
    try {
        const { base_version } = args;
        const req = context.req;

        if (Object.keys(args).length === 0) {
            throw new ServerError('Se requiere enviar al menos un parámetro de búsqueda', {
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'warning', code: 'required', diagnostics: 'Se requiere enviar al menos un parámetro de búsqueda' }]
            });
        }

        const query = PatientRepository.buildQuery(args);
        if (args.gender) {
            const gender = args.gender.toLowerCase();
            if (gender === 'male' || gender === 'masculino') {
                query.genero = 'masculino';
            } else if (gender === 'female' || gender === 'femenino') {
                query.genero = 'femenino';
            } else if (gender === 'other' || gender === 'otro') {
                query.genero = 'otro';
            } else {
                throw new ServerError('Género incorrecto');
            }
        }

        const paging = parsePaging(req?.query || {}, {
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

        const bundle: any = {
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            link: req ? buildPagingLinks(req, total, paging) : undefined,
            entry: pacientesFhir.length
                ? pacientesFhir.map(p => ({
                    fullUrl: req
                        ? buildEntryFullUrl(req, base_version, 'Patient', p.id)
                        : fullurl(p),
                    resource: p,
                    search: { mode: 'match' }
                }))
                : undefined
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

        const Patient = getPatientSchema(base_version);
        const newPatient = new Patient({
            ...body,
            id: result.insertedId.toString()
        });

        // En FHIR Create exitoso usualmente devuelve el recurso.
        // Pero el servidor asymmetrik a veces espera OperationOutcome vía ServerError para casos especiales.
        // Si queremos devolver 201 Created estándar, simplemente retornamos el recurso.
        // El código original tiraba un ServerError con status 201.
        throw new ServerError(`El paciente fue creado. ID: ${result.insertedId}`, {
            statusCode: 201,
            resourceType: 'OperationOutcome',
            issue: [],
            data: {
                system: process.env.IPS_DOMINIO,
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

const PatientService = {
    search,
    searchById,
    create
};

export = PatientService;
