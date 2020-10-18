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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buscarOrganizacionSisa = exports.buscarOrganizacion = void 0;
const fhir_1 = require("@andes/fhir");
const node_fhir_server_core_1 = require("@asymmetrik/node-fhir-server-core");
const constants_1 = require("./../../constants");
const globals = require('../../globals');
const { stringQueryBuilder, keyQueryBuilder } = require('../../utils/querybuilder.util');
let getOrganization = (base_version) => {
    return node_fhir_server_core_1.resolveSchema(base_version, 'organization');
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
function buscarOrganizacion(version, parameters) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let query = buildAndesSearchQuery(parameters);
            const db = globals.get(constants_1.CONSTANTS.CLIENT_DB);
            let collection = db.collection(`${constants_1.CONSTANTS.COLLECTION.ORGANIZATION}`);
            let Organization = getOrganization(version);
            let organizations = yield collection.find(query).toArray();
            return organizations.map(org => new Organization(fhir_1.Organization.encode(org)));
        }
        catch (err) {
            return err;
        }
    });
}
exports.buscarOrganizacion = buscarOrganizacion;
// Vermos como generalizar más adelante
function buscarOrganizacionSisa(version, codigoSisa) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = globals.get(constants_1.CONSTANTS.CLIENT_DB);
            let collection = db.collection(`${constants_1.CONSTANTS.COLLECTION.ORGANIZATION}`);
            let organization = yield collection.findOne({ 'codigo.sisa': codigoSisa });
            organization.id = organization._id; // Agrego el id ya que no estoy usando mongoose.
            return organization;
        }
        catch (err) {
            return err;
        }
    });
}
exports.buscarOrganizacionSisa = buscarOrganizacionSisa;
//# sourceMappingURL=organization.js.map