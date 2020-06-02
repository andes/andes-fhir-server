/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getDeviceComponent = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.DEVICECOMPONENT));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('DeviceComponent >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let identifier = args['identifier'];
	let parent = args['parent'];
	let source = args['source'];
	let type = args['type'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let DeviceComponent = getDeviceComponent(base_version);

	// Cast all results to DeviceComponent Class
	let devicecomponent_resource = new DeviceComponent();
	// TODO: Set data with constructor or setter methods
	devicecomponent_resource.id = 'test id';

	// Return Array
	resolve([devicecomponent_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('DeviceComponent >>> searchById');

	let { base_version, id } = args;

	let DeviceComponent = getDeviceComponent(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to DeviceComponent Class
	let devicecomponent_resource = new DeviceComponent();
	// TODO: Set data with constructor or setter methods
	devicecomponent_resource.id = 'test id';

	// Return resource class
	// resolve(devicecomponent_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('DeviceComponent >>> create');

	let { base_version, id, resource } = args;

	let DeviceComponent = getDeviceComponent(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to DeviceComponent Class
	let devicecomponent_resource = new DeviceComponent(resource);
	devicecomponent_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: devicecomponent_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('DeviceComponent >>> update');

	let { base_version, id, resource } = args;

	let DeviceComponent = getDeviceComponent(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to DeviceComponent Class
	let devicecomponent_resource = new DeviceComponent(resource);
	devicecomponent_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: devicecomponent_resource.id, created: false, resource_version: devicecomponent_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('DeviceComponent >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('DeviceComponent >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let DeviceComponent = getDeviceComponent(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to DeviceComponent Class
	let devicecomponent_resource = new DeviceComponent();

	// Return resource class
	resolve(devicecomponent_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('DeviceComponent >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let identifier = args['identifier'];
	let parent = args['parent'];
	let source = args['source'];
	let type = args['type'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let DeviceComponent = getDeviceComponent(base_version);

	// Cast all results to DeviceComponent Class
	let devicecomponent_resource = new DeviceComponent();

	// Return Array
	resolve([devicecomponent_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('DeviceComponent >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let identifier = args['identifier'];
	let parent = args['parent'];
	let source = args['source'];
	let type = args['type'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let DeviceComponent = getDeviceComponent(base_version);

	// Cast all results to DeviceComponent Class
	let devicecomponent_resource = new DeviceComponent();

	// Return Array
	resolve([devicecomponent_resource]);
});

