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
const uid_util_1 = require("./../../utils/uid.util");
const { COLLECTION, CLIENT_DB } = require('./../../constants');
const globals = require('../../globals');
const { stringQueryBuilder, tokenQueryBuilder } = require('../../utils/querybuilder.util');
let getPatient = (base_version) => {
    return require(node_fhir_server_core_1.resolveSchema(base_version, 'Patient'));
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
            let query = {};
            query = buildAndesSearchQuery(args);
            const db = globals.get(CLIENT_DB);
            let collection = db.collection(`${COLLECTION.PATIENT}`);
            let Patient = getPatient(base_version);
            let patients = yield collection.find(query).toArray();
            return patients.map(pac => new Patient(fhir_1.Patient.encode(pac)));
        }
        catch (err) {
            return err;
        }
    }),
    searchById: (args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let { base_version, id } = args;
            let Patient = getPatient(base_version);
            let db = globals.get(CLIENT_DB);
            let collection = db.collection(`${COLLECTION.PATIENT}`);
            let patient = yield collection.findOne({ _id: uid_util_1.setObjectId(id) });
            return patient ? new Patient(fhir_1.Patient.encode(patient)) : null;
        }
        catch (err) {
            return err;
        }
    })
};
//# sourceMappingURL=patient.service.js.map