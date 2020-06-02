import { resolveFromVersion } from '@asymmetrik/node-fhir-server-core';
import { Practitioner as fhirPractitioner } from '@andes/fhir';
const { COLLECTION, CLIENT_DB } = require('./../../constants');
const globals = require('../../globals');

let getPractitioner = (base_version) => {
	return require(resolveFromVersion(base_version, 'practitioner'));
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


export = {
	search: async (args) => {
		try {
			let { base_version } = args;
			let query = buildAndesSearchQuery(args);
			const db = globals.get(CLIENT_DB);
			let collection = db.collection(`${COLLECTION.PRACTITIONER}`)
			let Practitioner = getPractitioner(base_version);
			// let practitioner = new Practitioner();
			let practitioners = await collection.find(query).toArray();
			return practitioners.map(prac => new Practitioner(fhirPractitioner.encode(prac)));
		} catch (err) {
			return err;
		}
	},
	searchById: async (args) => {

		// TODO

	}
};




