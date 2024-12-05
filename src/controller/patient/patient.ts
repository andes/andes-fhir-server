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

// Pronto va a deprecar por cambio a llamada a la api
export async function buscarPaciente(version, parameters) {
    try {
        let query = buildAndesSearchQuery(parameters);
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

// export async function buscarPaciente(version, parameters) {
//     try {
//         console.log('entra aca...');
//         let query = buildAndesSearchQuery(parameters);
//         const andes = new ApiAndes();
//         let Patient = getPatient(version);
//         console.log('anes de llamar a la api, ', query);
//         let patients = await andes.getPatients(query);
//         return patients.map(pac => new Patient(fhirPac.encode(pac)));
//     } catch (err) {
//         return err

//     }
// }