import { ObjectId, Collection } from 'mongodb';
import globals from '../globals';
import { CONSTANTS } from '../constants';
import { stringQueryBuilder, keyQueryBuilder } from '../utils/querybuilder.util';

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
        const queryBuilder = keyQueryBuilder(identifier, 'codigo.sisa');
        for (const i in queryBuilder) {
            query[i] = queryBuilder[i];
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
        const collection = getCollection() as any;
        return collection.findOne({ _id: new ObjectId(id) });
    },

    async findBySisa(codigoSisa: string): Promise<any> {
        const collection = getCollection() as any;
        return collection.findOne({ 'codigo.sisa': codigoSisa });
    }
};

export default OrganizationRepository;
