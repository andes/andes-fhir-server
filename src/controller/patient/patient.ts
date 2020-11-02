import { Patient as fhirPac } from '@andes/fhir';
import { setObjectId as objectId } from './../../utils/uid.util';
import { resolveSchema } from '@asymmetrik/node-fhir-server-core';
import { CONSTANTS } from './../../constants';

const ObjectID = require('mongodb').ObjectID

const globals = require('../../globals');
const { stringQueryBuilder, tokenQueryBuilder } = require('../../utils/querybuilder.util');


let getPatient = (base_version) => {
    return resolveSchema(base_version, 'Patient');
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
    // Filtros especiales para paciente
    if (identifier) {
        let queryBuilder: any = tokenQueryBuilder(identifier, 'value', 'identifier', false);
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
        }  
    }
    return query;
};


// Esta función la vamos a deprecar....
export async function buscarPacienteIdAndes(id) {
    try {
        let db = globals.get(CONSTANTS.CLIENT_DB);
        let collection = db.collection(`${CONSTANTS.COLLECTION.PATIENT}`);
        let pac = await collection.findOne({ _id: objectId(id) });
        if (!pac) {
            return null
        }
        pac.id = pac._id; // Agrego el id ya que no estoy usando mongoose   
        return pac
    } catch (err) {
        return err
    }
}

export async function buscarPacienteId(version, id) {
    try {
        let Patient = getPatient(version);
        let db = globals.get(CONSTANTS.CLIENT_DB);
        let collection = db.collection(`${CONSTANTS.COLLECTION.PATIENT}`);
        let patient = await collection.findOne({ _id: objectId(id) });
        return patient ? new Patient(fhirPac.encode(patient)) : null;
    } catch (err) {
        return err
    }
}

export async function buscarPaciente(version, parameters) {
    try {
        let query = buildAndesSearchQuery(parameters);
        const db = globals.get(CONSTANTS.CLIENT_DB);
        let collection = db.collection(`${CONSTANTS.COLLECTION.PATIENT}`);
        let Patient = getPatient(version);
        let patients = await collection.find(query).toArray();
        return patients.map(pac => new Patient(fhirPac.encode(pac)));
    } catch (err) {
        return err

    }
}