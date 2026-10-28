import { ObjectId, Collection } from 'mongodb';
import { ServerError } from '@bluehalo/node-fhir-server-core';
import globals from '../globals';
import { CONSTANTS, FhirIdentifierSystems, resolveIdentifierSystem } from '../constants';
import { getDominio } from '../encoders';
import { stringQueryBuilder, tokenQueryBuilder } from '../utils/querybuilder.util';

/**
 * Obtiene la colección de organizaciones de la base de datos.
 */
function getCollection(): Collection {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    return db.collection(CONSTANTS.COLLECTION.ORGANIZATION);
}

/**
 * Construye la query de búsqueda para Andes basada en los argumentos de FHIR.
 */
export function buildAndesSearchQuery(args: any): Record<string, any> {
    const id = args['id'];
    const active = args['active'];
    const identifier = args['identifier']; // código
    const name = args['name'];
    const query: Record<string, any> = {};

    if (id) {
        query.id = id;
    }
    if (active !== undefined && active !== null) {
        query.activo = active === true || active === 'true';
    }
    if (name) {
        query.nombre = stringQueryBuilder(name, true);
    }
    if (identifier) {
        const queryBuilder = tokenQueryBuilder(identifier, 'value', 'identifier', false) as any;
        if (!queryBuilder.system) {
            query['codigo.sisa'] = queryBuilder.value;
        } else {
            switch (resolveIdentifierSystem(queryBuilder.system)) {
                case FhirIdentifierSystems.SISA:
                case 'sisa':
                    query['codigo.sisa'] = queryBuilder.value;
                    break;
                case FhirIdentifierSystems.CUIE:
                case 'cuie':
                    query['codigo.cuie'] = queryBuilder.value;
                    break;
                case FhirIdentifierSystems.REMEDIAR:
                case 'remediar':
                    query['codigo.remediar'] = queryBuilder.value;
                    break;
                case FhirIdentifierSystems.SIPS:
                case 'sips':
                    query['codigo.sips'] = queryBuilder.value;
                    break;
                case FhirIdentifierSystems.CUIT:
                case 'cuit':
                    query['codigo.cuit'] = queryBuilder.value;
                    break;
                case FhirIdentifierSystems.ANDES_ID:
                case resolveIdentifierSystem(getDominio()):
                    if (typeof queryBuilder.value === 'string' && ObjectId.isValid(queryBuilder.value)) {
                        query._id = new ObjectId(queryBuilder.value);
                    } else {
                        throw new ServerError('ID de Andes incorrecto o inválido');
                    }
                    break;
                default:
                    throw new ServerError('System incorrecto');
            }
        }
    }
    return query;
}

const OrganizationRepository = {
    buildQuery: buildAndesSearchQuery,

    async find(query: any, options: { skip?: number; limit?: number } = {}): Promise<any[]> {
        const collection = getCollection() as any;
        let cursor = collection.find(query);
        if (options.skip !== undefined) {
            cursor = cursor.skip(options.skip);
        }
        if (options.limit !== undefined) {
            cursor = cursor.limit(options.limit);
        }
        return cursor.toArray();
    },

    async count(query: any): Promise<number> {
        const collection = getCollection() as any;
        return collection.countDocuments(query);
    },

    async findOne(query: any): Promise<any> {
        const collection = getCollection() as any;
        return collection.findOne(query);
    },

    async findById(id: string): Promise<any> {
        if (!id || !ObjectId.isValid(id)) {
            return null;
        }
        const collection = getCollection() as any;
        return collection.findOne({ _id: new ObjectId(id) });
    },

    async findBySisa(codigoSisa: string): Promise<any> {
        const collection = getCollection() as any;
        return collection.findOne({ 'codigo.sisa': codigoSisa });
    }
};

export default OrganizationRepository;
