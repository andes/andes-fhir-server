const { resolveSchema } = require('@asymmetrik/node-fhir-server-core');
const { COLLECTION, CLIENT_DB } = require('./../../constants');
const globals = require('../../globals');
const logger = require('@asymmetrik/node-fhir-server-core').loggers.get();
const fhirPac = require('@andes/fhir').Patient;
const objectId = require('./../../utils/uid.util').setObjectId;

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
	let query = {};
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
/**
 *
 * @param {*} args
 * @param {*} context
 * @param {*} logger
 */
module.exports = {
	search: async (args) => {
		logger.info('Patient >>> search');
		try {
			let { base_version } = args;
			let query = {};
			query = buildAndesSearchQuery(args);
			const db = globals.get(CLIENT_DB);
			let collection = db.collection(`${COLLECTION.PACIENTE}`);
			let Patient = getPatient(base_version);
			let patients = await collection.find(query).toArray();
			return patients.map(pac => new Patient(fhirPac.encode(pac)));
		} catch (err) {
			return err;
		}

	},
	searchById: async (args) => {
		logger.info('Patient >>> searchById');
		try {
			let { base_version, id } = args;
			let Patient = getPatient(base_version);
			let db = globals.get(CLIENT_DB);
			let collection = db.collection(`${COLLECTION.PACIENTE}`);
			let patient = await collection.findOne({ _id: objectId(id) });
			return patient ? new Patient(fhirPac.encode(patient)) : null;
		} catch (err) {
			return err;
		}
	}
};







