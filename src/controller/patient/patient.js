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
exports.buscarPaciente = exports.buscarPacienteId = exports.buscarPacienteIdAndes = void 0;
const fhir_1 = require("@andes/fhir");
const uid_util_1 = require("./../../utils/uid.util");
const node_fhir_server_core_1 = require("@asymmetrik/node-fhir-server-core");
const constants_1 = require("./../../constants");
const ObjectID = require('mongodb').ObjectID;
const globals = require('../../globals');
const { stringQueryBuilder, tokenQueryBuilder } = require('../../utils/querybuilder.util');
let getPatient = (base_version) => {
    return node_fhir_server_core_1.resolveSchema(base_version, 'Patient');
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
    // Filtros especiales para paciente
    if (identifier) {
        let queryBuilder = tokenQueryBuilder(identifier, 'value', 'identifier', false);
        switch (queryBuilder.system) {
            case 'andes.gob.ar':
                query._id = new ObjectID(queryBuilder.value);
                break;
            case 'http://www.renaper.gob.ar/cuil':
                query.cuit = queryBuilder.value;
                break;
            case 'http://www.renaper.gob.ar/dni':
                query.documento = queryBuilder.value;
                break;
        }
    }
    return query;
};
// Esta función la vamos a deprecar....
function buscarPacienteIdAndes(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let db = globals.get(constants_1.CONSTANTS.CLIENT_DB);
            let collection = db.collection(`${constants_1.CONSTANTS.COLLECTION.PATIENT}`);
            let pac = yield collection.findOne({ _id: uid_util_1.setObjectId(id) });
            if (!pac) {
                return null;
            }
            pac.id = pac._id; // Agrego el id ya que no estoy usando mongoose   
            return pac;
        }
        catch (err) {
            return err;
        }
    });
}
exports.buscarPacienteIdAndes = buscarPacienteIdAndes;
function buscarPacienteId(version, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let Patient = getPatient(version);
            let db = globals.get(constants_1.CONSTANTS.CLIENT_DB);
            let collection = db.collection(`${constants_1.CONSTANTS.COLLECTION.PATIENT}`);
            let patient = yield collection.findOne({ _id: uid_util_1.setObjectId(id) });
            return patient ? new Patient(fhir_1.Patient.encode(patient)) : null;
        }
        catch (err) {
            return err;
        }
    });
}
exports.buscarPacienteId = buscarPacienteId;
function buscarPaciente(version, parameters) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let query = buildAndesSearchQuery(parameters);
            const db = globals.get(constants_1.CONSTANTS.CLIENT_DB);
            let collection = db.collection(`${constants_1.CONSTANTS.COLLECTION.PATIENT}`);
            let Patient = getPatient(version);
            let patients = yield collection.find(query).toArray();
            return patients.map(pac => new Patient(fhir_1.Patient.encode(pac)));
        }
        catch (err) {
            return err;
        }
    });
}
exports.buscarPaciente = buscarPaciente;
//# sourceMappingURL=patient.js.map