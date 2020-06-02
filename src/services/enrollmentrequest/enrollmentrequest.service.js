/*eslint no-unused-vars: "warn"*/

const { RESOURCES } = require('@asymmetrik/node-fhir-server-core').constants;
const FHIRServer = require('@asymmetrik/node-fhir-server-core');

let getEnrollmentRequest = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.ENROLLMENTREQUEST));};

let getMeta = (base_version) => {
	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));};

module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('EnrollmentRequest >>> search');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let identifier = args['identifier'];
	let organization = args['organization'];
	let patient = args['patient'];
	let subject = args['subject'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let EnrollmentRequest = getEnrollmentRequest(base_version);

	// Cast all results to EnrollmentRequest Class
	let enrollmentrequest_resource = new EnrollmentRequest();
	// TODO: Set data with constructor or setter methods
	enrollmentrequest_resource.id = 'test id';

	// Return Array
	resolve([enrollmentrequest_resource]);
});

module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('EnrollmentRequest >>> searchById');

	let { base_version, id } = args;

	let EnrollmentRequest = getEnrollmentRequest(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to EnrollmentRequest Class
	let enrollmentrequest_resource = new EnrollmentRequest();
	// TODO: Set data with constructor or setter methods
	enrollmentrequest_resource.id = 'test id';

	// Return resource class
	// resolve(enrollmentrequest_resource);
	resolve();
});

module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('EnrollmentRequest >>> create');

	let { base_version, id, resource } = args;

	let EnrollmentRequest = getEnrollmentRequest(base_version);
	let Meta = getMeta(base_version);

	// TODO: determine if client/server sets ID

	// Cast resource to EnrollmentRequest Class
	let enrollmentrequest_resource = new EnrollmentRequest(resource);
	enrollmentrequest_resource.meta = new Meta();
	// TODO: set meta info

	// TODO: save record to database

	// Return Id
	resolve({ id: enrollmentrequest_resource.id });
});

module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('EnrollmentRequest >>> update');

	let { base_version, id, resource } = args;

	let EnrollmentRequest = getEnrollmentRequest(base_version);
	let Meta = getMeta(base_version);

	// Cast resource to EnrollmentRequest Class
	let enrollmentrequest_resource = new EnrollmentRequest(resource);
	enrollmentrequest_resource.meta = new Meta();
	// TODO: set meta info, increment meta ID

	// TODO: save record to database

	// Return id, if recorded was created or updated, new meta version id
	resolve({ id: enrollmentrequest_resource.id, created: false, resource_version: enrollmentrequest_resource.meta.versionId });
});

module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('EnrollmentRequest >>> remove');

	let { id } = args;

	// TODO: delete record in database (soft/hard)

	// Return number of records deleted
	resolve({ deleted: 0 });
});

module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('EnrollmentRequest >>> searchByVersionId');

	let { base_version, id, version_id } = args;

	let EnrollmentRequest = getEnrollmentRequest(base_version);

	// TODO: Build query from Parameters

	// TODO: Query database

	// Cast result to EnrollmentRequest Class
	let enrollmentrequest_resource = new EnrollmentRequest();

	// Return resource class
	resolve(enrollmentrequest_resource);
});

module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('EnrollmentRequest >>> history');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let identifier = args['identifier'];
	let organization = args['organization'];
	let patient = args['patient'];
	let subject = args['subject'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let EnrollmentRequest = getEnrollmentRequest(base_version);

	// Cast all results to EnrollmentRequest Class
	let enrollmentrequest_resource = new EnrollmentRequest();

	// Return Array
	resolve([enrollmentrequest_resource]);
});

module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
	logger.info('EnrollmentRequest >>> historyById');

	// Common search params
	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

	// Search Result params
	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;

	// Resource Specific params
	let identifier = args['identifier'];
	let organization = args['organization'];
	let patient = args['patient'];
	let subject = args['subject'];

	// TODO: Build query from Parameters

	// TODO: Query database

	let EnrollmentRequest = getEnrollmentRequest(base_version);

	// Cast all results to EnrollmentRequest Class
	let enrollmentrequest_resource = new EnrollmentRequest();

	// Return Array
	resolve([enrollmentrequest_resource]);
});

