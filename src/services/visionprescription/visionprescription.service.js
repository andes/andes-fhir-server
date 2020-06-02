/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getVisionPrescription = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.VISIONPRESCRIPTION));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('VisionPrescription >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let datewritten = args['datewritten'];
	let encounter = args['encounter'];
	let identifier = args['identifier'];
	let patient = args['patient'];
	let prescriber = args['prescriber'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let VisionPrescription = getVisionPrescription(base_version);

	// Cast all results to VisionPrescription Class
	let visionprescription_resource = new VisionPrescription();
	// TODO: Set data with constructor or setter methods
	visionprescription_resource.id = 'test id';

	// Return Array
	resolve([visionprescription_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('VisionPrescription >>> searchById');

	let { base_version, id } = args;

	let VisionPrescription = getVisionPrescription(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to VisionPrescription Class
	let visionprescription_resource = new VisionPrescription();
	// TODO: Set data with constructor or setter methods
	visionprescription_resource.id = 'test id';

	// Return resource class
	// resolve(visionprescription_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('VisionPrescription >>> create');

	let { base_version, id, resource } = args;

	let VisionPrescription = getVisionPrescription(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to VisionPrescription Class
	let visionprescription_resource = new VisionPrescription(resource);
	visionprescription_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: visionprescription_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('VisionPrescription >>> update');

	let { base_version, id, resource } = args;

	let VisionPrescription = getVisionPrescription(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to VisionPrescription Class
	let visionprescription_resource = new VisionPrescription(resource);
	visionprescription_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: visionprescription_resource.id, created: false, resource_version: visionprescription_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('VisionPrescription >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('VisionPrescription >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let VisionPrescription = getVisionPrescription(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to VisionPrescription Class
	let visionprescription_resource = new VisionPrescription();

	// Return resource class
	resolve(visionprescription_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('VisionPrescription >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let datewritten = args['datewritten'];
	let encounter = args['encounter'];
	let identifier = args['identifier'];
	let patient = args['patient'];
	let prescriber = args['prescriber'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let VisionPrescription = getVisionPrescription(base_version);

	// Cast all results to VisionPrescription Class
	let visionprescription_resource = new VisionPrescription();

	// Return Array
	resolve([visionprescription_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('VisionPrescription >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let datewritten = args['datewritten'];
	let encounter = args['encounter'];
	let identifier = args['identifier'];
	let patient = args['patient'];
	let prescriber = args['prescriber'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let VisionPrescription = getVisionPrescription(base_version);

	// Cast all results to VisionPrescription Class
	let visionprescription_resource = new VisionPrescription();

	// Return Array
	resolve([visionprescription_resource]);
});

