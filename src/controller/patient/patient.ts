import { Patient as fhirPac } from '@andes/fhir';
import { resolveSchema, ServerError } from '@asymmetrik/node-fhir-server-core';
import { CONSTANTS } from '../../constants';
import { fullurl } from '../../utils/data.util';
import { pruneEmpty } from '../../utils/pruneFhir';
import { parsePaging, buildPagingLinks, buildEntryFullUrl } from '../../utils/fhirPaging';
import { ObjectId } from 'mongodb';
import globals from '../../globals';
import { tokenQueryBuilder, familyQueryBuilder } from '../../utils/querybuilder.util';
import { FhirIdentifierSystems } from '../../constants/identifier-systems';

const getPatient = (base_version: string) => {
    return resolveSchema(base_version, 'Patient');
};

const buildAndesSearchQuery = (args: any) => {
    // Filtros de búsqueda para pacientes
    const id = args['id'];
    const family = args['family'] ? args['family'] : '';
    const given = args['given'] ? args['given'] : '';
    const identifier = args['identifier'];
    let query: Record<string, any> = { activo: true };
    if (id) {
        query.id = id;
    }
    // Filtros especiales para paciente
    if (identifier) {
        const queryBuilder = tokenQueryBuilder(identifier, 'value', 'identifier', false) as any;
        if (!queryBuilder.system) {
            query.$or = [
                { documento: queryBuilder.value, estado: 'validado' },
                { cuit: queryBuilder.value, estado: 'validado' },
                { numeroIdentificacion: queryBuilder.value }
            ];
        } else {
            switch (queryBuilder.system) {
                case FhirIdentifierSystems.ANDES_ID:
                    query._id = new ObjectId(queryBuilder.value);
                    break;
                case FhirIdentifierSystems.CUIL:
                    query.cuit = queryBuilder.value;
                    break;
                case FhirIdentifierSystems.DNI:
                    query.documento = queryBuilder.value;
                    break;
                case FhirIdentifierSystems.FOREIGN_ID:
                    query.numeroIdentificacion = queryBuilder.value;
                    query.tipoIdentificacion = 'dni extranjero';
                    break;
                case FhirIdentifierSystems.PASSPORT:
                    query.numeroIdentificacion = queryBuilder.value;
                    query.tipoIdentificacion = 'pasaporte';
                    break;
                default:
                    throw new ServerError('System incorrecto');
            }
        }
    }

    if (family || given) {
        query = {
            ...query,
            $and: familyQueryBuilder(family + ' ' + given)
        };
    }
    return query;
};

export async function buscarPaciente(version: string, parameters: any, req: any) {
    try {
        const query = buildAndesSearchQuery(parameters);
        if (parameters.gender) {
            const gender = parameters.gender.toLowerCase();
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

        const db = globals.get(CONSTANTS.CLIENT_DB);
        const collection = db.collection(`${CONSTANTS.COLLECTION.PATIENT}`);

        const total = await collection.countDocuments(query);

        const pacientes = await collection
            .find(query)
            .skip(paging.offset)
            .limit(paging.count)
            .toArray();

        const Patient = getPatient(version);
        const pacientesFhir = pacientes.map(pac => new Patient(fhirPac.encode(pac)));

        const bundle: any = {
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            link: req ? buildPagingLinks(req, total, paging) : undefined,
            entry: pacientesFhir.length
                ? pacientesFhir.map(p => ({
                    fullUrl: req
                        ? buildEntryFullUrl(req, version, 'Patient', p.id)
                        : fullurl(p),
                    resource: p,
                    search: {
                        mode: 'match'
                    }
                }))
                : undefined
        };

        return pruneEmpty(bundle);
    } catch (err) {
        let message;
        let code = '';
        if (typeof err === 'object') {
            message = (err as any).message;
            code = (err as any).code;
        } else {
            message = err;
        }
        throw new ServerError(message, {
            resourceType: 'OperationOutcome',
            issue: [
                {
                    severity: 'error',
                    code,
                    diagnostics: message
                }
            ]
        });
    }
}

export async function buscarPacienteId(version: string, id: string) {
    try {
        const db = globals.get(CONSTANTS.CLIENT_DB);
        const collection = db.collection(`${CONSTANTS.COLLECTION.PATIENT}`);
        const Patient = getPatient(version);
        const patient = await collection.findOne({ _id: new ObjectId(id) });
        return patient ? new Patient(fhirPac.encode(patient)) : null;
    } catch (err) {
        let message;
        let code = '';
        if (typeof err === 'object') {
            message = (err as any).message;
            code = (err as any).code;
        } else {
            message = err;
        }
        throw new ServerError(
            message,
            {
                resourceType: 'OperationOutcome',
                issue: [
                    {
                        severity: 'error',
                        code,
                        diagnostics: message
                    }
                ]
            }
        );
    }
}

export async function crearPaciente(base_version: string, resource: Record<string, any>) {
    try {
        const db = globals.get(CONSTANTS.CLIENT_DB);
        const collection = db.collection(`${CONSTANTS.COLLECTION.PATIENT}`);
        const Patient = getPatient(base_version);
        const identifier = resource.identifier && resource.identifier.length ? resource.identifier : null;
        const gender = resource.gender;
        if (identifier) {
            try {
                const bundleResult = await buscarPaciente(base_version, { base_version, identifier, gender }, undefined);
                const pacienteExistente = bundleResult.entry && bundleResult.entry.length > 0 ? bundleResult.entry[0].resource : null;
                const plainPatient = pacienteExistente ? JSON.parse(JSON.stringify(pacienteExistente)) : null;
                if (plainPatient) {
                    return {
                        existingPatient: true,
                        patientId: plainPatient.id,
                        patientData: plainPatient,
                        operationOutcome: {
                            resourceType: 'OperationOutcome',
                            issue: [
                                {
                                    severity: 'information',
                                    code: 'informational',
                                    diagnostics: `El paciente ya existe. ID: ${plainPatient.id ? plainPatient.id.toString() : plainPatient.id}`
                                }
                            ],
                            data: plainPatient.identifier?.find((id: any) => id.system === FhirIdentifierSystems.ANDES_ID)
                        }
                    };
                }
            } catch (err) {
                console.log('Error buscando paciente existente:', err);
            }
        }

        const paciente = fhirPac.decode(resource as any);
        const result = await collection.insertOne(paciente);

        const newPatient = new Patient({
            ...resource,
            id: result.insertedId.toString()
        });

        return {
            existingPatient: false,
            patientId: result.insertedId.toString(),
            patientData: newPatient
        };

    } catch (error) {
        throw new ServerError(
            'No se pudo crear el paciente',
            {
                resourceType: 'OperationOutcome',
                issue: [
                    {
                        severity: 'error',
                        code: 'exception',
                        diagnostics: (error as any).message || error
                    }
                ]
            }
        );
    }
}
