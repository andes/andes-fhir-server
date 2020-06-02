/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getSubstance = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.SUBSTANCE));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Substance >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let category = args['category'];
	let code = args['code'];
	let container_identifier = args['container-identifier'];
	let expiry = args['expiry'];
	let identifier = args['identifier'];
	let quantity = args['quantity'];
	let status = args['status'];
	let substance_reference = args['substance-reference'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let Substance = getSubstance(base_version);

	// Cast all results to Substance Class
	let substance_resource = new Substance();
	// TODO: Set data with constructor or setter methods
	substance_resource.id = 'test id';

	// Return Array
	resolve([substance_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Substance >>> searchById');

	let { base_version, id } = args;

	let Substance = getSubstance(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to Substance Class
	let substance_resource = new Substance();
	// TODO: Set data with constructor or setter methods
	substance_resource.id = 'test id';

	// Return resource class
	// resolve(substance_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Substance >>> create');

	let { base_version, id, resource } = args;

	let Substance = getSubstance(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to Substance Class
	let substance_resource = new Substance(resource);
	substance_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: substance_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Substance >>> update');

	let { base_version, id, resource } = args;

	let Substance = getSubstance(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to Substance Class
	let substance_resource = new Substance(resource);
	substance_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: substance_resource.id, created: false, resource_version: substance_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Substance >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Substance >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let Substance = getSubstance(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to Substance Class
	let substance_resource = new Substance();

	// Return resource class
	resolve(substance_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Substance >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let category = args['category'];
	let code = args['code'];
	let container_identifier = args['container-identifier'];
	let expiry = args['expiry'];
	let identifier = args['identifier'];
	let quantity = args['quantity'];
	let status = args['status'];
	let substance_reference = args['substance-reference'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let Substance = getSubstance(base_version);

	// Cast all results to Substance Class
	let substance_resource = new Substance();

	// Return Array
	resolve([substance_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Substance >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let category = args['category'];
	let code = args['code'];
	let container_identifier = args['container-identifier'];
	let expiry = args['expiry'];
	let identifier = args['identifier'];
	let quantity = args['quantity'];
	let status = args['status'];
	let substance_reference = args['substance-reference'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let Substance = getSubstance(base_version);

	// Cast all results to Substance Class
	let substance_resource = new Substance();

	// Return Array
	resolve([substance_resource]);
});

