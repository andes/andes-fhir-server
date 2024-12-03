import { ServerError } from '@asymmetrik/node-fhir-server-core';
import { stringQueryBuilder } from './../../utils/querybuilder.util';
import { setObjectId as objectId } from './../../utils/uid.util';

const ObjectID = require('mongodb').ObjectID
const { CONSTANTS } = require('./../../constants');
const globals = require('../../globals');


let getSpecialityEncode = (specility) => {
    return {
        identifier: specility._id,
        code: {
            "system": "https://sisa.msal.gov.ar/sisa/#sisa",
            "code": specility.codigo.sisa,
            "display": specility.codigo.sisa
        },
        text: specility.nombre,
        author: "https://sisa.msal.gov.ar/sisa/#sisa"
    }
};



let buildAndesSearchQuery = (args) => {
    // Filtros de búsqueda para especialidades
    let nombre = args['nombre'];
    let codigo = args['codigo'];

    let query: any = {};

    if (nombre) {
        query.nombre = stringQueryBuilder(nombre);
    }
    if (codigo) {
        query.sisa.codigo = parseInt(codigo);
    }

    return query;
};

export = {
    search: async (args, context) => {
        try {
            let query = {};
            if (Object.keys(args).length > 1) {
                query = buildAndesSearchQuery(args);
            }
            const db = globals.get(CONSTANTS.CLIENT_DB);
            const collection = db.collection(`${CONSTANTS.COLLECTION.SPECILITY}`);
            let specialities = await collection.find(query).toArray();
            if (specialities.length) {
                return specialities.map(speciality => getSpecialityEncode(speciality));
            } else {
                return []
            }
        } catch (err) {
            let message, system, code = '';
            if (typeof err === 'object') {
                message = err.message;
                system = err.system;
                code = err.code
            } else {
                message = err
            }
            throw new ServerError(message, {
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
    },
    searchById: async (args, context) => {
        try {
            let { base_version, id } = args;
            let db = globals.get(CONSTANTS.CLIENT_DB);
            let collection = db.collection(`${CONSTANTS.COLLECTION.SPECILITY}`);
            let speciality = await collection.findOne({ _id: objectId(id) });
            return speciality ? speciality : { notFound: 404 };
        } catch (err) {
            let message, system, code = '';
            if (typeof err === 'object') {
                message = err.message;
                system = err.system;
                code = err.code
            } else {
                message = err
            }
            throw new ServerError(message, {
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
    }

};
