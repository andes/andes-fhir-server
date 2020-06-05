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
const ips_1 = require("./../../controller/ips/ips");
module.exports = {
    searchById: (args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // verify token IPS
            let { base_version, id } = args;
            // let Bundle = getBundle(base_version);
            if (id) {
                return yield ips_1.ips(base_version, id);
            }
            else {
                return null;
            }
        }
        catch (err) {
            return err;
        }
    })
};
// module.exports.search = (args, context, logger) => new Promise((resolve, reject) => {
// 	logger.info('Bundle >>> search');
// 	// Common search params
// 	let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;
// 	// Search Result params
// 	let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } = args;
// 	// Resource Specific params
// 	let composition = args['composition'];
// 	let identifier = args['identifier'];
// 	let message = args['message'];
// 	let type = args['type'];
// 	// TODO: Build query from Parameters
// 	// TODO: Query database
// 	let Bundle = getBundle(base_version);
// 	// Cast all results to Bundle Class
// 	let bundle_resource = new Bundle();
// 	// TODO: Set data with constructor or setter methods
// 	bundle_resource.id = 'test id';
// 	// Return Array
// 	resolve([bundle_resource]);
// });
//# sourceMappingURL=bundle.service.js.map