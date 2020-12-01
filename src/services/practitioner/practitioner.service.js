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
const querybuilder_util_1 = require("./../../utils/querybuilder.util");
const uid_util_1 = require("./../../utils/uid.util");
const ObjectID = require('mongodb').ObjectID;
const { CONSTANTS } = require('./../../constants');
const globals = require('../../globals');
let getPractitioner = (base_version) => {
    return node_fhir_server_core_1.resolveSchema(base_version, 'Practitioner');
};
let buildAndesSearchQuery = (args) => {
    // Filtros de búsqueda para profesionales
    let id = args['id'];
    let active = args['active'];
    let family = args['family'];
    let given = args['given'];
    let identifier = args['identifier'];
    // Con este filtro evitamos las búsquedas de los que no son matriculados y están en la misma colección
    let query = { profesionalMatriculado: { $eq: true } };
    if (id) {
        query.id = id;
    }
    if (active) {
        query.activo = active === true ? true : false;
    }
    if (family) {
        query.apellido = querybuilder_util_1.stringQueryBuilder(family);
    }
    if (given) {
        query.nombre = querybuilder_util_1.stringQueryBuilder(given);
    }
    // controles de identifier de profesional
    if (identifier) {
        let tokenBuilder = querybuilder_util_1.tokenQueryBuilder(identifier, 'value', 'identifier', false);
        switch (tokenBuilder.system) {
            case 'andes.gob.ar':
                query._id = new ObjectID(tokenBuilder.value);
                break;
            case 'https://seti.afip.gob.ar/padron-puc-constancia-internet/ConsultaConstanciaAction.do':
                query.cuit = tokenBuilder.value;
                break;
            case 'http://www.renaper.gob.ar/dni':
                query.documento = tokenBuilder.value;
                break;
            default:
                query.documento = tokenBuilder.value;
        }
    }
    return query;
};
module.exports = {
    search: (args, context) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let { base_version } = args;
            if (Object.keys(args).length > 1) {
                let query = buildAndesSearchQuery(args);
                const db = globals.get(CONSTANTS.CLIENT_DB);
                let collection = db.collection(`${CONSTANTS.COLLECTION.PRACTITIONER}`);
                let Practitioner = getPractitioner(base_version);
                let practitioners = yield collection.find(query).toArray();
                return practitioners.map(prac => new Practitioner(fhir_1.Practitioner.encode(prac)));
            }
            else {
                throw { warning: 'You will need to add the search parameters' };
            }
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
    }),
    searchById: (args, context) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let { base_version, id } = args;
            let Practitioner = getPractitioner(base_version);
            let db = globals.get(CONSTANTS.CLIENT_DB);
            let collection = db.collection(`${CONSTANTS.COLLECTION.PRACTITIONER}`);
            let practitioner = yield collection.findOne({ _id: uid_util_1.setObjectId(id) });
            return practitioner ? new Practitioner(fhir_1.Practitioner.encode(practitioner)) : { notFound: 404 };
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
    })
};
//# sourceMappingURL=practitioner.service.js.map