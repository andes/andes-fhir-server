import { Patient as fhirPac } from '@andes/fhir';
import { setObjectId as objectId } from './../../utils/uid.util';
import { resolveSchema } from '@asymmetrik/node-fhir-server-core';

const { COLLECTION, CLIENT_DB } = require('./../../constants');
const globals = require('../../globals');
const { stringQueryBuilder, tokenQueryBuilder } = require('../../utils/querybuilder.util');


let getPatient = (base_version) => {
    return require(resolveSchema(base_version, 'Patient'));
};

let buildAndesSearchQuery = (args) => {

    // Filtros de búsqueda para pacientes
    let id = args['id'];
    let active = args['active'];
    let family = args['family'];
    let given = args['given'];
    let identifier = args['identifier'];
    let query: any = {};
    if (id) {
        query.id = id;
    }
    if (active) {
        query.activo = active === true ? true : false;
    }
    if (family) {
        query.apellido = stringQueryBuilder(family);
    }
    if (given) {
        query.nombre = stringQueryBuilder(given);
    }
    if (identifier) {
        let queryBuilder = tokenQueryBuilder(identifier, '', 'identificadores', '');
        for (let i in queryBuilder) {
            query[i] = queryBuilder[i];
        }
    }
    return query;
};


// Esta función la vamos a deprecar....
export async function buscarPacienteIdAndes(id) {
    try {
        let db = globals.get(CLIENT_DB);
        let collection = db.collection(`${COLLECTION.PATIENT}`);
        return await collection.findOne({ _id: objectId(id) });
    } catch (err) {
        return err
    }
}

export async function buscarPacienteId(version, id) {
    try {
        let Patient = getPatient(version);
        let db = globals.get(CLIENT_DB);
        let collection = db.collection(`${COLLECTION.PATIENT}`);
        let patient = await collection.findOne({ _id: objectId(id) });
        return patient ? new Patient(fhirPac.encode(patient)) : null;
    } catch (err) {
        return err
    }
}

export async function buscarPaciente(version, parameters) {
    try {
        let query = buildAndesSearchQuery(parameters);
        const db = globals.get(CLIENT_DB);
        let collection = db.collection(`${COLLECTION.PATIENT}`);
        let Patient = getPatient(version);
        let patients = await collection.find(query).toArray();
        return patients.map(pac => new Patient(fhirPac.encode(pac)));
    } catch (err) {
        return err
    }
}