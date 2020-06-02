/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getValueSet = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.VALUESET));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('ValueSet >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let date = args['date'];
	let description = args['description'];
	let expansion = args['expansion'];
	let identifier = args['identifier'];
	let jurisdiction = args['jurisdiction'];
	let name = args['name'];
	let publisher = args['publisher'];
	let reference = args['reference'];
	let status = args['status'];
	let title = args['title'];
	let url = args['url'];
	let version = args['version'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let ValueSet = getValueSet(base_version);

	// Cast all results to ValueSet Class
	let valueset_resource = new ValueSet();
	// TODO: Set data with constructor or setter methods
	valueset_resource.id = 'test id';

	// Return Array
	resolve([valueset_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('ValueSet >>> searchById');

	let { base_version, id } = args;

	let ValueSet = getValueSet(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to ValueSet Class
	let valueset_resource = new ValueSet();
	// TODO: Set data with constructor or setter methods
	valueset_resource.id = 'test id';

	// Return resource class
	// resolve(valueset_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('ValueSet >>> create');

	let { base_version, id, resource } = args;

	let ValueSet = getValueSet(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to ValueSet Class
	let valueset_resource = new ValueSet(resource);
	valueset_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: valueset_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('ValueSet >>> update');

	let { base_version, id, resource } = args;

	let ValueSet = getValueSet(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to ValueSet Class
	let valueset_resource = new ValueSet(resource);
	valueset_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: valueset_resource.id, created: false, resource_version: valueset_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('ValueSet >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('ValueSet >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let ValueSet = getValueSet(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to ValueSet Class
	let valueset_resource = new ValueSet();

	// Return resource class
	resolve(valueset_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('ValueSet >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let date = args['date'];
	let description = args['description'];
	let expansion = args['expansion'];
	let identifier = args['identifier'];
	let jurisdiction = args['jurisdiction'];
	let name = args['name'];
	let publisher = args['publisher'];
	let reference = args['reference'];
	let status = args['status'];
	let title = args['title'];
	let url = args['url'];
	let version = args['version'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let ValueSet = getValueSet(base_version);

	// Cast all results to ValueSet Class
	let valueset_resource = new ValueSet();

	// Return Array
	resolve([valueset_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('ValueSet >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let date = args['date'];
	let description = args['description'];
	let expansion = args['expansion'];
	let identifier = args['identifier'];
	let jurisdiction = args['jurisdiction'];
	let name = args['name'];
	let publisher = args['publisher'];
	let reference = args['reference'];
	let status = args['status'];
	let title = args['title'];
	let url = args['url'];
	let version = args['version'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let ValueSet = getValueSet(base_version);

	// Cast all results to ValueSet Class
	let valueset_resource = new ValueSet();

	// Return Array
	resolve([valueset_resource]);
});

