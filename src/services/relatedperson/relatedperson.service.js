/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getRelatedPerson = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.RELATEDPERSON));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RelatedPerson >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let active = args['active'];
	let address = args['address'];
	let address_city = args['address-city'];
	let address_country = args['address-country'];
	let address_postalcode = args['address-postalcode'];
	let address_state = args['address-state'];
	let address_use = args['address-use'];
	let birthdate = args['birthdate'];
	let email = args['email'];
	let gender = args['gender'];
	let identifier = args['identifier'];
	let name = args['name'];
	let patient = args['patient'];
	let phone = args['phone'];
	let phonetic = args['phonetic'];
	let telecom = args['telecom'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let RelatedPerson = getRelatedPerson(base_version);

	// Cast all results to RelatedPerson Class
	let relatedperson_resource = new RelatedPerson();
	// TODO: Set data with constructor or setter methods
	relatedperson_resource.id = 'test id';

	// Return Array
	resolve([relatedperson_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RelatedPerson >>> searchById');

	let { base_version, id } = args;

	let RelatedPerson = getRelatedPerson(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to RelatedPerson Class
	let relatedperson_resource = new RelatedPerson();
	// TODO: Set data with constructor or setter methods
	relatedperson_resource.id = 'test id';

	// Return resource class
	// resolve(relatedperson_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RelatedPerson >>> create');

	let { base_version, id, resource } = args;

	let RelatedPerson = getRelatedPerson(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to RelatedPerson Class
	let relatedperson_resource = new RelatedPerson(resource);
	relatedperson_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: relatedperson_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RelatedPerson >>> update');

	let { base_version, id, resource } = args;

	let RelatedPerson = getRelatedPerson(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to RelatedPerson Class
	let relatedperson_resource = new RelatedPerson(resource);
	relatedperson_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: relatedperson_resource.id, created: false, resource_version: relatedperson_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RelatedPerson >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RelatedPerson >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let RelatedPerson = getRelatedPerson(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to RelatedPerson Class
	let relatedperson_resource = new RelatedPerson();

	// Return resource class
	resolve(relatedperson_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RelatedPerson >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let active = args['active'];
	let address = args['address'];
	let address_city = args['address-city'];
	let address_country = args['address-country'];
	let address_postalcode = args['address-postalcode'];
	let address_state = args['address-state'];
	let address_use = args['address-use'];
	let birthdate = args['birthdate'];
	let email = args['email'];
	let gender = args['gender'];
	let identifier = args['identifier'];
	let name = args['name'];
	let patient = args['patient'];
	let phone = args['phone'];
	let phonetic = args['phonetic'];
	let telecom = args['telecom'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let RelatedPerson = getRelatedPerson(base_version);

	// Cast all results to RelatedPerson Class
	let relatedperson_resource = new RelatedPerson();

	// Return Array
	resolve([relatedperson_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RelatedPerson >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let active = args['active'];
	let address = args['address'];
	let address_city = args['address-city'];
	let address_country = args['address-country'];
	let address_postalcode = args['address-postalcode'];
	let address_state = args['address-state'];
	let address_use = args['address-use'];
	let birthdate = args['birthdate'];
	let email = args['email'];
	let gender = args['gender'];
	let identifier = args['identifier'];
	let name = args['name'];
	let patient = args['patient'];
	let phone = args['phone'];
	let phonetic = args['phonetic'];
	let telecom = args['telecom'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let RelatedPerson = getRelatedPerson(base_version);

	// Cast all results to RelatedPerson Class
	let relatedperson_resource = new RelatedPerson();

	// Return Array
	resolve([relatedperson_resource]);
});

