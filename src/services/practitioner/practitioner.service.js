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
let getPractitioner = (base_version) => {
    return require(node_fhir_server_core_1.resolveFromVersion(base_version, 'practitioner'));
};
let buildAndesSearchQuery = (args) => {
    // Filtros de búsqueda para pacientes
    let id = args['id'];
    let active = args['active'];
    let family = args['family'];
    let given = args['given'];
    let identifier = args['identifier'];
    let query = {};
    if (id) {
        query.id = id;
    }
    if (active) {
        query.activo = active === true ? true : false;
    }
    if (family) {
        query.apellido = stringQueryBuilder(family);
    }
    if (given) {
        query.nombre = stringQueryBuilder(given);
    }
    if (identifier) {
        let queryBuilder = tokenQueryBuilder(identifier, '', 'identificadores', '');
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
            let collection = db.collection(`${COLLECTION.PRACTITIONER}`);
            let Practitioner = getPractitioner(base_version);
            // let practitioner = new Practitioner();
            let practitioners = yield collection.find(query).toArray();
            return practitioners.map(prac => new Practitioner(fhir_1.Practitioner.encode(prac)));
        }
        catch (err) {
            return err;
        }
    }),
    searchById: (args) => __awaiter(void 0, void 0, void 0, function* () {
        // TODO
    })
};
//# sourceMappingURL=practitioner.service.js.map