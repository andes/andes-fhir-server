import { Patient as fhirPac } from '@andes/fhir';
import { resolveSchema, ServerError } from '@asymmetrik/node-fhir-server-core';
import { CONSTANTS } from './../../constants';
import { ApiAndes } from './../../utils/apiAndesQuery';

const ObjectID = require('mongodb').ObjectID
const globals = require('../../globals');
const { stringQueryBuilder, tokenQueryBuilder, familyQueryBuilder } = require('../../utils/querybuilder.util');


let getPatient = (base_version) => {
    return resolveSchema(base_version, 'Patient');
};

let buildAndesSearchQuery = (args) => {
    // Filtros de búsqueda para pacientes
    let id = args['id'];
    let family = args['family'] ? args['family'] : '';
    let given = args['given'] ? args['given'] : '';
    let identifier = args['identifier'];
    let query: any = { activo: true };
    if (id) {
        query.id = id;
    }
    // Filtros especiales para paciente
    if (identifier) {
        const queryBuilder: any = tokenQueryBuilder(identifier, 'value', 'identifier', false);
        switch (queryBuilder.system) {
            case 'andes.gob.ar':
                query._id = new ObjectID(queryBuilder.value);
                break;
            case 'http://www.renaper.gob.ar/cuil':
                query.cuit = queryBuilder.value;
                break;
            case 'http://www.renaper.gob.ar/dni':
                query.documento = queryBuilder.value;
                break;
            default:
                query.documento = queryBuilder.value;
                break;
        }
    }

    if (family || given) {
        query = {
            ...query,
            $and: familyQueryBuilder(family + ' ' + given)

        }
    }
    return query;
};


export async function buscarPacienteId(version, id) {
    try {
        const andes = new ApiAndes();
        let Patient = getPatient(version);
        let patient = await andes.getPatient(id);
        return patient ? new Patient(fhirPac.encode(patient)) : null;
    } catch (err) {
        let message, system, code = '';
        if (typeof err === 'object') {
            message = err.message;
            system = err.system;
            code = err.code
        } else {
            message = err
        }
        throw new ServerError(
            message,
            {
                resourceType: "OperationOutcome",
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

export async function crearPaciente(base_version: string, resource: any) {
    try {
        const andes = new ApiAndes();
        const db = globals.get(CONSTANTS.CLIENT_DB);
        let collection = db.collection(`${CONSTANTS.COLLECTION.PATIENT}`);
        const Patient = getPatient(base_version);
        let identifier = resource.identifier && resource.identifier.length ? resource.identifier[0].value : null;
        let gender = resource.gender;
        if (identifier) {
            try {
                const pacientesAndes = await buscarPaciente(base_version, { base_version, active: 'false', identifier , gender });
                const pacienteExistente = pacientesAndes[0];
                const plainPatient = pacienteExistente? JSON.parse(JSON.stringify(pacienteExistente)):null;
                if (plainPatient) {
                    return {
                        existingPatient: true,
                        patientId: plainPatient.identifier?.find(id => id.system == 'andes.gob.ar' && id.value)?.value,
                        patientData: plainPatient,
                        operationOutcome: {
                            resourceType: "OperationOutcome",
                            issue: [
                                {
                                    severity: "information",
                                    code: "informational",
                                    diagnostics: `El paciente ya existe. ID: ${plainPatient._id ? plainPatient._id.toString() : plainPatient.id}`
                                }
                            ],
                        data:plainPatient.identifier?.find(id => id.system == 'andes.gob.ar')
                        }
                };
                }
            } catch (err) {
                console.log('Error buscando paciente existente:', err);
            }
        }

        const paciente = fhirPac.decode(resource);
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
                resourceType: "OperationOutcome",
                issue: [
                    {
                        severity: 'error',
                        code: 'exception',
                        diagnostics: error.message || error
                    }
                ]
            }
        );
    }
}

// Pronto va a deprecar por cambio a llamada a la api
export async function buscarPaciente(version, parameters) {
    try {
        let query = buildAndesSearchQuery(parameters);
        if (parameters.gender) {
            const gender = parameters.gender.toLowerCase();
            if (gender === 'male'|| gender === 'masculino') {
                query.genero = 'masculino';
            } else if (gender === 'female'|| gender === 'femenino') {
                query.genero = 'femenino';
            } 
        }
        const db = globals.get(CONSTANTS.CLIENT_DB);
        let collection = db.collection(`${CONSTANTS.COLLECTION.PATIENT}`);
        let Patient = getPatient(version);
        let patients = await collection.find(query).toArray();
        return patients.map(pac => new Patient(fhirPac.encode(pac)));
    } catch (err) {
        let message, system, code = '';
        if (typeof err === 'object') {
            message = err.message;
            system = err.system;
            code = err.code
        } else {
            message = err
        }
        throw new ServerError(message, {
            resourceType: "OperationOutcome",
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
