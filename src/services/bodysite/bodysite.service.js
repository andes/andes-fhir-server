/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getBodySite = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.BODYSITE));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('BodySite >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let code = args['code'];
	let identifier = args['identifier'];
	let patient = args['patient'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let BodySite = getBodySite(base_version);

	// Cast all results to BodySite Class
	let bodysite_resource = new BodySite();
	// TODO: Set data with constructor or setter methods
	bodysite_resource.id = 'test id';

	// Return Array
	resolve([bodysite_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('BodySite >>> searchById');

	let { base_version, id } = args;

	let BodySite = getBodySite(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to BodySite Class
	let bodysite_resource = new BodySite();
	// TODO: Set data with constructor or setter methods
	bodysite_resource.id = 'test id';

	// Return resource class
	// resolve(bodysite_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('BodySite >>> create');

	let { base_version, id, resource } = args;

	let BodySite = getBodySite(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to BodySite Class
	let bodysite_resource = new BodySite(resource);
	bodysite_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: bodysite_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('BodySite >>> update');

	let { base_version, id, resource } = args;

	let BodySite = getBodySite(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to BodySite Class
	let bodysite_resource = new BodySite(resource);
	bodysite_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: bodysite_resource.id, created: false, resource_version: bodysite_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('BodySite >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('BodySite >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let BodySite = getBodySite(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to BodySite Class
	let bodysite_resource = new BodySite();

	// Return resource class
	resolve(bodysite_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('BodySite >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let code = args['code'];
	let identifier = args['identifier'];
	let patient = args['patient'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let BodySite = getBodySite(base_version);

	// Cast all results to BodySite Class
	let bodysite_resource = new BodySite();

	// Return Array
	resolve([bodysite_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('BodySite >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let code = args['code'];
	let identifier = args['identifier'];
	let patient = args['patient'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let BodySite = getBodySite(base_version);

	// Cast all results to BodySite Class
	let bodysite_resource = new BodySite();

	// Return Array
	resolve([bodysite_resource]);
});

