/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getCompartmentDefinition = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.COMPARTMENTDEFINITION));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('CompartmentDefinition >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let code = args['code'];
	let date = args['date'];
	let description = args['description'];
	let jurisdiction = args['jurisdiction'];
	let name = args['name'];
	let publisher = args['publisher'];
	let resource = args['resource'];
	let status = args['status'];
	let title = args['title'];
	let url = args['url'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let CompartmentDefinition = getCompartmentDefinition(base_version);

	// Cast all results to CompartmentDefinition Class
	let compartmentdefinition_resource = new CompartmentDefinition();
	// TODO: Set data with constructor or setter methods
	compartmentdefinition_resource.id = 'test id';

	// Return Array
	resolve([compartmentdefinition_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('CompartmentDefinition >>> searchById');

	let { base_version, id } = args;

	let CompartmentDefinition = getCompartmentDefinition(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to CompartmentDefinition Class
	let compartmentdefinition_resource = new CompartmentDefinition();
	// TODO: Set data with constructor or setter methods
	compartmentdefinition_resource.id = 'test id';

	// Return resource class
	// resolve(compartmentdefinition_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('CompartmentDefinition >>> create');

	let { base_version, id, resource } = args;

	let CompartmentDefinition = getCompartmentDefinition(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to CompartmentDefinition Class
	let compartmentdefinition_resource = new CompartmentDefinition(resource);
	compartmentdefinition_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: compartmentdefinition_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('CompartmentDefinition >>> update');

	let { base_version, id, resource } = args;

	let CompartmentDefinition = getCompartmentDefinition(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to CompartmentDefinition Class
	let compartmentdefinition_resource = new CompartmentDefinition(resource);
	compartmentdefinition_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: compartmentdefinition_resource.id, created: false, resource_version: compartmentdefinition_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('CompartmentDefinition >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('CompartmentDefinition >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let CompartmentDefinition = getCompartmentDefinition(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to CompartmentDefinition Class
	let compartmentdefinition_resource = new CompartmentDefinition();

	// Return resource class
	resolve(compartmentdefinition_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('CompartmentDefinition >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let code = args['code'];
	let date = args['date'];
	let description = args['description'];
	let jurisdiction = args['jurisdiction'];
	let name = args['name'];
	let publisher = args['publisher'];
	let resource = args['resource'];
	let status = args['status'];
	let title = args['title'];
	let url = args['url'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let CompartmentDefinition = getCompartmentDefinition(base_version);

	// Cast all results to CompartmentDefinition Class
	let compartmentdefinition_resource = new CompartmentDefinition();

	// Return Array
	resolve([compartmentdefinition_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('CompartmentDefinition >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let code = args['code'];
	let date = args['date'];
	let description = args['description'];
	let jurisdiction = args['jurisdiction'];
	let name = args['name'];
	let publisher = args['publisher'];
	let resource = args['resource'];
	let status = args['status'];
	let title = args['title'];
	let url = args['url'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let CompartmentDefinition = getCompartmentDefinition(base_version);

	// Cast all results to CompartmentDefinition Class
	let compartmentdefinition_resource = new CompartmentDefinition();

	// Return Array
	resolve([compartmentdefinition_resource]);
});

