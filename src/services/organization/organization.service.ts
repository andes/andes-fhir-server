import { resolveSchema } from '@asymmetrik/node-fhir-server-core';
import { Organization as fhirOrganization } from '@andes/fhir';
import { setObjectId as objectId } from './../../utils/uid.util';
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

export = {
	search: async (args) => {
		try {
			let { base_version } = args;
			let query = buildAndesSearchQuery(args);
			const db = globals.get(CLIENT_DB);
			let collection = db.collection(`${COLLECTION.ORGANIZATION}`);
			let Organization = getOrganization(base_version);
			let organizations = await collection.find(query).toArray();
			return organizations.map(org => new Organization(fhirOrganization.encode(org)));
		} catch (err) {
			console.log('palo: ', err);
			return err
		}
	}
}

// module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
// 		logger.info('Organization >>> searchById');

// 		let { base_version, id } = args;

// 		let Organization = getOrganization(base_version);

// 		// TODO: Build query from Parameters

// 		// TODO: Query database

// 		// Cast result to Organization Class
// 		let organization_resource = new Organization();
// 		// TODO: Set data with constructor or setter methods
// 		organization_resource.id = 'test id';

// 		// Return resource class
// 		// resolve(organization_resource);
// 		resolve();
// 	});