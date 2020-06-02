/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getFlag = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.FLAG));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Flag >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let author = args['author'];
	let date = args['date'];
	let encounter = args['encounter'];
	let identifier = args['identifier'];
	let patient = args['patient'];
	let subject = args['subject'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let Flag = getFlag(base_version);

	// Cast all results to Flag Class
	let flag_resource = new Flag();
	// TODO: Set data with constructor or setter methods
	flag_resource.id = 'test id';

	// Return Array
	resolve([flag_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Flag >>> searchById');

	let { base_version, id } = args;

	let Flag = getFlag(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to Flag Class
	let flag_resource = new Flag();
	// TODO: Set data with constructor or setter methods
	flag_resource.id = 'test id';

	// Return resource class
	// resolve(flag_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Flag >>> create');

	let { base_version, id, resource } = args;

	let Flag = getFlag(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to Flag Class
	let flag_resource = new Flag(resource);
	flag_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: flag_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Flag >>> update');

	let { base_version, id, resource } = args;

	let Flag = getFlag(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to Flag Class
	let flag_resource = new Flag(resource);
	flag_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: flag_resource.id, created: false, resource_version: flag_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Flag >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Flag >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let Flag = getFlag(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to Flag Class
	let flag_resource = new Flag();

	// Return resource class
	resolve(flag_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Flag >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let author = args['author'];
	let date = args['date'];
	let encounter = args['encounter'];
	let identifier = args['identifier'];
	let patient = args['patient'];
	let subject = args['subject'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let Flag = getFlag(base_version);

	// Cast all results to Flag Class
	let flag_resource = new Flag();

	// Return Array
	resolve([flag_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Flag >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let author = args['author'];
	let date = args['date'];
	let encounter = args['encounter'];
	let identifier = args['identifier'];
	let patient = args['patient'];
	let subject = args['subject'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let Flag = getFlag(base_version);

	// Cast all results to Flag Class
	let flag_resource = new Flag();

	// Return Array
	resolve([flag_resource]);
});

