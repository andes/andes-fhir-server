import { ips } from './../../controller/ips/ips';

// let getBundle = (base_version) => {
// 	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.BUNDLE));
// };

// let getMeta = (base_version) => {
// 	return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));
// };


export = {
	searchById: async (args) => {
		try {
			// verify token IPS
			let { base_version, id } = args;
			// let Bundle = getBundle(base_version);
			if (id) {
				return await ips(base_version, id);
			} else {
				return null;
			}
		} catch (err) {
			return err;
		}

	}
}

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


