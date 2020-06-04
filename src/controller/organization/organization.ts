import { Organization as fhirOrganization } from '@andes/fhir';
import { resolveSchema } from '@asymmetrik/node-fhir-server-core';
const { COLLECTION, CLIENT_DB } = require('./../../constants');
const globals = require('../../globals');
const { stringQueryBuilder, keyQueryBuilder } = require('../../utils/querybuilder.util');


let getOrganization = (base_version) => {
    return require(resolveSchema(base_version, 'organization'));
};

let buildAndesSearchQuery = (args) => {

    // Filtros de búsqueda para organizaciones
    let id = args['id'];
    let active = args['active'];
    let identifier = args['identifier']; // codigo
    let name = args['name'];
    let query: any = {};

    if (id) {
        query.id = id;
    }
    if (active) {
        query.activo = active === true ? true : false;
    }
    if (name) {
        query.nombre = stringQueryBuilder(name);
    }
    if (identifier) {
        let queryBuilder = keyQueryBuilder(identifier, 'codigo');
        for (let i in queryBuilder) {
            query[i] = queryBuilder[i];
        }
    }
    return query;
};


export async function buscarOrganizacion(version, parameters) {
    try {
        let query = buildAndesSearchQuery(parameters);
        const db = globals.get(CLIENT_DB);
        let collection = db.collection(`${COLLECTION.ORGANIZATION}`);
        let Organization = getOrganization(version);
        let organizations = await collection.find(query).toArray();
        return organizations.map(org => new Organization(fhirOrganization.encode(org)));
    } catch (err) {
        return err
    }
}

// Vermos como generalizar más adelante
export async function buscarOrganizacionSisa(version, codigoSisa) {
    try {
        const db = globals.get(CLIENT_DB);
        let collection = db.collection(`${COLLECTION.ORGANIZATION}`);
        let Organization = getOrganization(version);
        let organizations = await collection.find({ 'codigo.sisa': codigoSisa }).toArray();
        return organizations.map(org => new Organization(fhirOrganization.encode(org)));
    } catch (err) {
        return err
    }
}