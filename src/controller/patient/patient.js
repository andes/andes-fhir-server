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
exports.buscarPaciente = exports.buscarPacienteId = void 0;
const fhir_1 = require("@andes/fhir");
const node_fhir_server_core_1 = require("@asymmetrik/node-fhir-server-core");
const constants_1 = require("./../../constants");
const apiAndesQuery_1 = require("./../../utils/apiAndesQuery");
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
            default:
                query.documento = queryBuilder.value;
                break;
        }
    }
    return query;
};
function buscarPacienteId(version, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const andes = new apiAndesQuery_1.ApiAndes();
            let Patient = getPatient(version);
            let patient = yield andes.getPatient(id);
            return patient ? new Patient(fhir_1.Patient.encode(patient)) : null;
        }
        catch (err) {
            let message, system, code = '';
            if (typeof err === 'object') {
                message = err.message;
                system = err.system;
                code = err.code;
            }
            else {
                message = err;
            }
            throw new node_fhir_server_core_1.ServerError(message, {
                resourceType: "OperationOutcome",
                issue: [
                    {
                        severity: 'error',
                        code,
                        diagnostics: message
                    }
                ]
            });
        }
    });
}
exports.buscarPacienteId = buscarPacienteId;
// Pronto va a deprecar por cambio a llamada a la api
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
            let message, system, code = '';
            if (typeof err === 'object') {
                message = err.message;
                system = err.system;
                code = err.code;
            }
            else {
                message = err;
            }
            throw new node_fhir_server_core_1.ServerError(message, {
                resourceType: "OperationOutcome",
                issue: [
                    {
                        severity: 'error',
                        code,
                        diagnostics: message
                    }
                ]
            });
        }
    });
}
exports.buscarPaciente = buscarPaciente;
// export async function buscarPaciente(version, parameters) {
//     try {
//         console.log('entra aca...');
//         let query = buildAndesSearchQuery(parameters);
//         const andes = new ApiAndes();
//         let Patient = getPatient(version);
//         console.log('anes de llamar a la api, ', query);
//         let patients = await andes.getPatients(query);
//         return patients.map(pac => new Patient(fhirPac.encode(pac)));
//     } catch (err) {
//         return err
//     }
// }
//# sourceMappingURL=patient.js.map