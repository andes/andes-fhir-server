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
const node_fhir_server_core_1 = require("@asymmetrik/node-fhir-server-core");
const fhir_1 = require("@andes/fhir");
const { COLLECTION, CLIENT_DB } = require('./../../constants');
const globals = require('../../globals');
const { stringQueryBuilder, keyQueryBuilder } = require('../../utils/querybuilder.util');
let getOrganization = (base_version) => {
    return require(node_fhir_server_core_1.resolveSchema(base_version, 'organization'));
};
let buildAndesSearchQuery = (args) => {
    // Filtros de búsqueda para organizaciones
    let id = args['id'];
    let active = args['active'];
    let identifier = args['identifier']; // codigo
    let name = args['name'];
    let query = {};
    if (id) {
        query.id = id;
    }
    if (active) {
        query.activo = active === true ? true : false;
    }
    if (name) {
        query.nombre = stringQueryBuilder(name);
    }
    if (identifier) {
        let queryBuilder = keyQueryBuilder(identifier, 'codigo');
        for (let i in queryBuilder) {
            query[i] = queryBuilder[i];
        }
    }
    return query;
};
module.exports = {
    search: (args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let { base_version } = args;
            let query = buildAndesSearchQuery(args);
            const db = globals.get(CLIENT_DB);
            let collection = db.collection(`${COLLECTION.ORGANIZATION}`);
            let Organization = getOrganization(base_version);
            let organizations = yield collection.find(query).toArray();
            return organizations.map(org => new Organization(fhir_1.Organization.encode(org)));
        }
        catch (err) {
            console.log('palo: ', err);
            return err;
        }
    })
};
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