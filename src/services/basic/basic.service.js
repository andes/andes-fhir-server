/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getBasic = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.BASIC));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Basic >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let author = args['author'];
	let code = args['code'];
	let created = args['created'];
	let identifier = args['identifier'];
	let patient = args['patient'];
	let subject = args['subject'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let Basic = getBasic(base_version);

	// Cast all results to Basic Class
	let basic_resource = new Basic();
	// TODO: Set data with constructor or setter methods
	basic_resource.id = 'test id';

	// Return Array
	resolve([basic_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Basic >>> searchById');

	let { base_version, id } = args;

	let Basic = getBasic(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to Basic Class
	let basic_resource = new Basic();
	// TODO: Set data with constructor or setter methods
	basic_resource.id = 'test id';

	// Return resource class
	// resolve(basic_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Basic >>> create');

	let { base_version, id, resource } = args;

	let Basic = getBasic(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to Basic Class
	let basic_resource = new Basic(resource);
	basic_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: basic_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Basic >>> update');

	let { base_version, id, resource } = args;

	let Basic = getBasic(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to Basic Class
	let basic_resource = new Basic(resource);
	basic_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: basic_resource.id, created: false, resource_version: basic_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Basic >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Basic >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let Basic = getBasic(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to Basic Class
	let basic_resource = new Basic();

	// Return resource class
	resolve(basic_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Basic >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let author = args['author'];
	let code = args['code'];
	let created = args['created'];
	let identifier = args['identifier'];
	let patient = args['patient'];
	let subject = args['subject'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let Basic = getBasic(base_version);

	// Cast all results to Basic Class
	let basic_resource = new Basic();

	// Return Array
	resolve([basic_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Basic >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let author = args['author'];
	let code = args['code'];
	let created = args['created'];
	let identifier = args['identifier'];
	let patient = args['patient'];
	let subject = args['subject'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let Basic = getBasic(base_version);

	// Cast all results to Basic Class
	let basic_resource = new Basic();

	// Return Array
	resolve([basic_resource]);
});

