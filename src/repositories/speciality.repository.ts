import { ObjectId, Collection } from 'mongodb';
import globals from '../globals';
import { CONSTANTS } from '../constants';
import { stringQueryBuilder } from '../utils/querybuilder.util';

/**
 * Obtiene la colección de especialidades de la base de datos.
 */
function getCollection(): Collection {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    return db.collection(CONSTANTS.COLLECTION.SPECIALITY);
}

/**
 * Construye la query de búsqueda para especialidades en Andes.
 */
export function buildAndesSearchQuery(args: any): Record<string, any> {
    const nombre = args['nombre'];
    const codigo = args['codigo'];

    const query: Record<string, any> = {};
    if (nombre) {
        query.nombre = stringQueryBuilder(nombre);
    }
    if (codigo) {
        query.codigo = {
            sisa: parseInt(codigo, 10)
        };
    }
    return query;
}

const SpecialityRepository = {
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

    async findById(id: string): Promise<any> {
        const collection = getCollection() as any;
        return collection.findOne({ _id: new ObjectId(id) });
    },

    async findOne(query: any): Promise<any> {
        const collection = getCollection() as any;
        return collection.findOne(query);
    },

    async count(query: any): Promise<number> {
        const collection = getCollection() as any;
        return collection.countDocuments(query);
    }
};

export default SpecialityRepository;
