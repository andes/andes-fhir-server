import { buscarOrganizacion } from './../../controller/organization/organization';

export = {
	search: async (args) => {
		try {
			let { base_version } = args;
			return await buscarOrganizacion(base_version, args);
		} catch (err) {
			return err
		}
	}
}


// Ver si necesitamos algo de esto más adelante

// module.exports.searchById = (args, context, logger) => new Promise((resolve, reject) => {
// 		logger.info('Organization >>> searchById');

// 		let { base_version, id } = args;

// 		let Organization = getOrganization(base_version);

// 		// TODO: Build query from Parameters

// 		// TODO: Query database

// 		// Cast result to Organization Class
// 		let organization_resource = new Organization();
// 		// TODO: Set data with constructor or setter methods
// 		organization_resource.id = 'test id';

// 		// Return resource class
// 		// resolve(organization_resource);
// 		resolve();
// 	});