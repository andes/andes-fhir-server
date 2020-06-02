/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getRiskAssessment = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.RISKASSESSMENT));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RiskAssessment >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let condition = args['condition'];
	let date = args['date'];
	let encounter = args['encounter'];
	let identifier = args['identifier'];
	let method = args['method'];
	let patient = args['patient'];
	let performer = args['performer'];
	let probability = args['probability'];
	let risk = args['risk'];
	let subject = args['subject'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let RiskAssessment = getRiskAssessment(base_version);

	// Cast all results to RiskAssessment Class
	let riskassessment_resource = new RiskAssessment();
	// TODO: Set data with constructor or setter methods
	riskassessment_resource.id = 'test id';

	// Return Array
	resolve([riskassessment_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RiskAssessment >>> searchById');

	let { base_version, id } = args;

	let RiskAssessment = getRiskAssessment(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to RiskAssessment Class
	let riskassessment_resource = new RiskAssessment();
	// TODO: Set data with constructor or setter methods
	riskassessment_resource.id = 'test id';

	// Return resource class
	// resolve(riskassessment_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RiskAssessment >>> create');

	let { base_version, id, resource } = args;

	let RiskAssessment = getRiskAssessment(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to RiskAssessment Class
	let riskassessment_resource = new RiskAssessment(resource);
	riskassessment_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: riskassessment_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RiskAssessment >>> update');

	let { base_version, id, resource } = args;

	let RiskAssessment = getRiskAssessment(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to RiskAssessment Class
	let riskassessment_resource = new RiskAssessment(resource);
	riskassessment_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: riskassessment_resource.id, created: false, resource_version: riskassessment_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RiskAssessment >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RiskAssessment >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let RiskAssessment = getRiskAssessment(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to RiskAssessment Class
	let riskassessment_resource = new RiskAssessment();

	// Return resource class
	resolve(riskassessment_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RiskAssessment >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let condition = args['condition'];
	let date = args['date'];
	let encounter = args['encounter'];
	let identifier = args['identifier'];
	let method = args['method'];
	let patient = args['patient'];
	let performer = args['performer'];
	let probability = args['probability'];
	let risk = args['risk'];
	let subject = args['subject'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let RiskAssessment = getRiskAssessment(base_version);

	// Cast all results to RiskAssessment Class
	let riskassessment_resource = new RiskAssessment();

	// Return Array
	resolve([riskassessment_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('RiskAssessment >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let condition = args['condition'];
	let date = args['date'];
	let encounter = args['encounter'];
	let identifier = args['identifier'];
	let method = args['method'];
	let patient = args['patient'];
	let performer = args['performer'];
	let probability = args['probability'];
	let risk = args['risk'];
	let subject = args['subject'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let RiskAssessment = getRiskAssessment(base_version);

	// Cast all results to RiskAssessment Class
	let riskassessment_resource = new RiskAssessment();

	// Return Array
	resolve([riskassessment_resource]);
});

