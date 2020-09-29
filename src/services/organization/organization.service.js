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
const organization_1 = require("./../../controller/organization/organization");
const permissions_1 = require("./../../lib/permissions");
const p = permissions_1.Permissions;
module.exports = {
    search: (args, context) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let { base_version } = args;
            if (Object.keys(args).length > 1) {
                return yield organization_1.buscarOrganizacion(base_version, args);
            }
            else {
                throw { warning: 'You will need to add the search parameters' };
            }
        }
        catch (err) {
            return err;
        }
    })
};
// TODO: Implementar más adelante el byID pero por ahora no lo necesitamos
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
//# sourceMappingURL=organization.service.js.map