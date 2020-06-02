/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getSchedule = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.SCHEDULE));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Schedule >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let active = args['active'];
	let actor = args['actor'];
	let date = args['date'];
	let identifier = args['identifier'];
	let type = args['type'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let Schedule = getSchedule(base_version);

	// Cast all results to Schedule Class
	let schedule_resource = new Schedule();
	// TODO: Set data with constructor or setter methods
	schedule_resource.id = 'test id';

	// Return Array
	resolve([schedule_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Schedule >>> searchById');

	let { base_version, id } = args;

	let Schedule = getSchedule(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to Schedule Class
	let schedule_resource = new Schedule();
	// TODO: Set data with constructor or setter methods
	schedule_resource.id = 'test id';

	// Return resource class
	// resolve(schedule_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Schedule >>> create');

	let { base_version, id, resource } = args;

	let Schedule = getSchedule(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to Schedule Class
	let schedule_resource = new Schedule(resource);
	schedule_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: schedule_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Schedule >>> update');

	let { base_version, id, resource } = args;

	let Schedule = getSchedule(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to Schedule Class
	let schedule_resource = new Schedule(resource);
	schedule_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: schedule_resource.id, created: false, resource_version: schedule_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Schedule >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Schedule >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let Schedule = getSchedule(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to Schedule Class
	let schedule_resource = new Schedule();

	// Return resource class
	resolve(schedule_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Schedule >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let active = args['active'];
	let actor = args['actor'];
	let date = args['date'];
	let identifier = args['identifier'];
	let type = args['type'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let Schedule = getSchedule(base_version);

	// Cast all results to Schedule Class
	let schedule_resource = new Schedule();

	// Return Array
	resolve([schedule_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('Schedule >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let active = args['active'];
	let actor = args['actor'];
	let date = args['date'];
	let identifier = args['identifier'];
	let type = args['type'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let Schedule = getSchedule(base_version);

	// Cast all results to Schedule Class
	let schedule_resource = new Schedule();

	// Return Array
	resolve([schedule_resource]);
});

