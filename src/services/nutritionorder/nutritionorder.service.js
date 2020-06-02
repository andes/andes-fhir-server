/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getNutritionOrder = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.NUTRITIONORDER));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('NutritionOrder >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let additive = args['additive'];
	let datetime = args['datetime'];
	let encounter = args['encounter'];
	let formula = args['formula'];
	let identifier = args['identifier'];
	let oraldiet = args['oraldiet'];
	let patient = args['patient'];
	let provider = args['provider'];
	let status = args['status'];
	let supplement = args['supplement'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let NutritionOrder = getNutritionOrder(base_version);

	// Cast all results to NutritionOrder Class
	let nutritionorder_resource = new NutritionOrder();
	// TODO: Set data with constructor or setter methods
	nutritionorder_resource.id = 'test id';

	// Return Array
	resolve([nutritionorder_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('NutritionOrder >>> searchById');

	let { base_version, id } = args;

	let NutritionOrder = getNutritionOrder(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to NutritionOrder Class
	let nutritionorder_resource = new NutritionOrder();
	// TODO: Set data with constructor or setter methods
	nutritionorder_resource.id = 'test id';

	// Return resource class
	// resolve(nutritionorder_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('NutritionOrder >>> create');

	let { base_version, id, resource } = args;

	let NutritionOrder = getNutritionOrder(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to NutritionOrder Class
	let nutritionorder_resource = new NutritionOrder(resource);
	nutritionorder_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: nutritionorder_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('NutritionOrder >>> update');

	let { base_version, id, resource } = args;

	let NutritionOrder = getNutritionOrder(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to NutritionOrder Class
	let nutritionorder_resource = new NutritionOrder(resource);
	nutritionorder_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: nutritionorder_resource.id, created: false, resource_version: nutritionorder_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('NutritionOrder >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('NutritionOrder >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let NutritionOrder = getNutritionOrder(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to NutritionOrder Class
	let nutritionorder_resource = new NutritionOrder();

	// Return resource class
	resolve(nutritionorder_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('NutritionOrder >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let additive = args['additive'];
	let datetime = args['datetime'];
	let encounter = args['encounter'];
	let formula = args['formula'];
	let identifier = args['identifier'];
	let oraldiet = args['oraldiet'];
	let patient = args['patient'];
	let provider = args['provider'];
	let status = args['status'];
	let supplement = args['supplement'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let NutritionOrder = getNutritionOrder(base_version);

	// Cast all results to NutritionOrder Class
	let nutritionorder_resource = new NutritionOrder();

	// Return Array
	resolve([nutritionorder_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('NutritionOrder >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let additive = args['additive'];
	let datetime = args['datetime'];
	let encounter = args['encounter'];
	let formula = args['formula'];
	let identifier = args['identifier'];
	let oraldiet = args['oraldiet'];
	let patient = args['patient'];
	let provider = args['provider'];
	let status = args['status'];
	let supplement = args['supplement'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let NutritionOrder = getNutritionOrder(base_version);

	// Cast all results to NutritionOrder Class
	let nutritionorder_resource = new NutritionOrder();

	// Return Array
	resolve([nutritionorder_resource]);
});

