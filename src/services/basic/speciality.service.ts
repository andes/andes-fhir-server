import { ServerError } from '@asymmetrik/node-fhir-server-core';
import { stringQueryBuilder } from './../../utils/querybuilder.util';
import { setObjectId as objectId } from './../../utils/uid.util';
import { CONSTANTS } from './../../constants';
import globals from '../../globals';


let getSpecialityEncode = (speciality) => {
    return {
        identifier: speciality._id,
        code: {
            "system": "https://sisa.msal.gov.ar/sisa/#sisa",
            "code": speciality.codigo.sisa,
            "display": speciality.codigo.sisa
        },
        text: speciality.nombre,
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
        query.codigo = {};
        query.codigo.sisa = parseInt(codigo);
    }
    return query;
};

export = {
    search: async (args, context) => {
        try {
            const { base_version } = args;
            const params = context.req.query;
            let query = {};
            if (Object.keys(params).length > 0) {
                query = buildAndesSearchQuery(params);
            }
            const db = globals.get(CONSTANTS.CLIENT_DB);
            const collection = db.collection(`${CONSTANTS.COLLECTION.SPECIALITY}`);
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
            let collection = db.collection(`${CONSTANTS.COLLECTION.SPECIALITY}`);
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
