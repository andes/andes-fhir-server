"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const documentreference_1 = require("../../controller/documentreference/documentreference");
module.exports = {
    search: (args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // verify token IPS
            let { base_version } = args;
            const subjIdentifier = args['subject:identifier'].split('|');
            if (subjIdentifier.length > 0) {
                const patientID = subjIdentifier[1];
                const documentReference = yield documentreference_1.getDocumentReference(base_version, patientID);
                return documentReference;
            }
            else {
                return null;
            }
        }
        catch (err) {
            return err;
        }
        // Cast all results to DocumentReference Class
        // let documentreference_resource = new DocumentReference();
        // Common search params
        // let { base_version } = args;
        // Resource Specific params
        // let authenticator = args['authenticator'];
        // let author = args['author'];
        // let _class = args['_class'];
        // let created = args['created'];
        // let custodian = args['custodian'];
        // let description = args['description'];
        // let encounter = args['encounter'];
        // let event = args['event'];
        // let facility = args['facility'];
        // let format = args['format'];
        // let identifier = args['identifier'];
        // let indexed = args['indexed'];
        // let language = args['language'];
        // let location = args['location'];
        // let patient = args['patient'];
        // let period = args['period'];
        // let related_id = args['related-id'];
        // let related_ref = args['related-ref'];
        // let relatesto = args['relatesto'];
        // let relation = args['relation'];
        // let relationship = args['relationship'];
        // let securitylabel = args['securitylabel'];
        // let setting = args['setting'];
        // let status = args['status'];
        // let subject = args['subject'];
        // let type = args['type'];
    })
};
// module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
// 	logger.info('DocumentReference >>> searchById');
// 	let { base_version, id } = args;
// 	let DocumentReference = getDocumentReference(base_version);
// 	// TODO: Build query from Parameters
// 	// TODO: Query database
// 	// Cast result to DocumentReference Class
// 	let documentreference_resource = new DocumentReference();
// 	// TODO: Set data with constructor or setter methods
// 	documentreference_resource.id = 'test id';
// 	// Return resource class
// 	// resolve(documentreference_resource);
// 	resolve();
// });
// module.exports.create = (args, context, logger) => new Promise((resolve, reject) => {
// 	logger.info('DocumentReference >>> create');
// 	let { base_version, id, resource } = args;
// 	let DocumentReference = getDocumentReference(base_version);
// 	let Meta = getMeta(base_version);
// 	// TODO: determine if client/server sets ID
// 	// Cast resource to DocumentReference Class
// 	let documentreference_resource = new DocumentReference(resource);
// 	documentreference_resource.meta = new Meta();
// 	// TODO: set meta info
// 	// TODO: save record to database
// 	// Return Id
// 	resolve({ id: documentreference_resource.id });
// });
// module.exports.update = (args, context, logger) => new Promise((resolve, reject) => {
// 	logger.info('DocumentReference >>> update');
// 	let { base_version, id, resource } = args;
// 	let DocumentReference = getDocumentReference(base_version);
// 	let Meta = getMeta(base_version);
// 	// Cast resource to DocumentReference Class
// 	let documentreference_resource = new DocumentReference(resource);
// 	documentreference_resource.meta = new Meta();
// 	// TODO: set meta info, increment meta ID
// 	// TODO: save record to database
// 	// Return id, if recorded was created or updated, new meta version id
// 	resolve({ id: documentreference_resource.id, created: false, resource_version: documentreference_resource.meta.versionId });
// });
// module.exports.remove = (args, context, logger) => new Promise((resolve, reject) => {
// 	logger.info('DocumentReference >>> remove');
// 	let { id } = args;
// 	// TODO: delete record in database (soft/hard)
// 	// Return number of records deleted
// 	resolve({ deleted: 0 });
// });
// module.exports.searchByVersionId = (args, context, logger) => new Promise((resolve, reject) => {
// 	logger.info('DocumentReference >>> searchByVersionId');
// 	let { base_version, id, version_id } = args;
// 	let DocumentReference = getDocumentReference(base_version);
// 	// TODO: Build query from Parameters
// 	// TODO: Query database
// 	// Cast result to DocumentReference Class
// 	let documentreference_resource = new DocumentReference();
// 	// Return resource class
// 	resolve(documentreference_resource);
// });
// module.exports.history = (args, context, logger) => new Promise((resolve, reject) => {
// 	logger.info('DocumentReference >>> history');
// 	// Common search params
// 	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;
// 	// Search Result params
// 	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;
// 	// Resource Specific params
// 	let authenticator = args['authenticator'];
// 	let author = args['author'];
// 	let _class = args['_class'];
// 	let created = args['created'];
// 	let custodian = args['custodian'];
// 	let description = args['description'];
// 	let encounter = args['encounter'];
// 	let event = args['event'];
// 	let facility = args['facility'];
// 	let format = args['format'];
// 	let identifier = args['identifier'];
// 	let indexed = args['indexed'];
// 	let language = args['language'];
// 	let location = args['location'];
// 	let patient = args['patient'];
// 	let period = args['period'];
// 	let related_id = args['related-id'];
// 	let related_ref = args['related-ref'];
// 	let relatesto = args['relatesto'];
// 	let relation = args['relation'];
// 	let relationship = args['relationship'];
// 	let securitylabel = args['securitylabel'];
// 	let setting = args['setting'];
// 	let status = args['status'];
// 	let subject = args['subject'];
// 	let type = args['type'];
// 	// TODO: Build query from Parameters
// 	// TODO: Query database
// 	let DocumentReference = getDocumentReference(base_version);
// 	// Cast all results to DocumentReference Class
// 	let documentreference_resource = new DocumentReference();
// 	// Return Array
// 	resolve([documentreference_resource]);
// });
// module.exports.historyById = (args, context, logger) => new Promise((resolve, reject) => {
// 	logger.info('DocumentReference >>> historyById');
// 	// Common search params
// 	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;
// 	// Search Result params
// 	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;
// 	// Resource Specific params
// 	let authenticator = args['authenticator'];
// 	let author = args['author'];
// 	let _class = args['_class'];
// 	let created = args['created'];
// 	let custodian = args['custodian'];
// 	let description = args['description'];
// 	let encounter = args['encounter'];
// 	let event = args['event'];
// 	let facility = args['facility'];
// 	let format = args['format'];
// 	let identifier = args['identifier'];
// 	let indexed = args['indexed'];
// 	let language = args['language'];
// 	let location = args['location'];
// 	let patient = args['patient'];
// 	let period = args['period'];
// 	let related_id = args['related-id'];
// 	let related_ref = args['related-ref'];
// 	let relatesto = args['relatesto'];
// 	let relation = args['relation'];
// 	let relationship = args['relationship'];
// 	let securitylabel = args['securitylabel'];
// 	let setting = args['setting'];
// 	let status = args['status'];
// 	let subject = args['subject'];
// 	let type = args['type'];
// 	// TODO: Build query from Parameters
// 	// TODO: Query database
// 	let DocumentReference = getDocumentReference(base_version);
// 	// Cast all results to DocumentReference Class
// 	let documentreference_resource = new DocumentReference();
// 	// Return Array
// 	resolve([documentreference_resource]);
// });
//# sourceMappingURL=documentreference.service.js.map