import { ObjectId, Collection } from 'mongodb';
import { ServerError } from '@bluehalo/node-fhir-server-core';
import globals from '../globals';
import { CONSTANTS, FhirIdentifierSystems } from '../constants';
import { tokenQueryBuilder, familyQueryBuilder, stringQueryBuilder } from '../utils/querybuilder.util';

/**
 * Obtiene la colección de pacientes de la base de datos.
 */
function getCollection(): Collection {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    return db.collection(CONSTANTS.COLLECTION.PATIENT);
}

/**
 * Construye la query de búsqueda para Andes basada en los argumentos de FHIR.
 */
function buildAndesSearchQuery(args: any) {
    const id = args['id'];
    const family = args['family'] ? args['family'] : '';
    const given = args['given'] ? args['given'] : '';
    const identifier = args['identifier'];
    let query: Record<string, any> = { activo: true };

    if (id) {
        query.id = stringQueryBuilder(id);
    }
    if (identifier) {
        const queryBuilder = tokenQueryBuilder(identifier, 'value', 'identifier', false) as any;
        if (!queryBuilder.system) {
            query.$or = [
                { documento: stringQueryBuilder(queryBuilder.value), estado: 'validado' },
                { cuit: stringQueryBuilder(queryBuilder.value), estado: 'validado' },
                { numeroIdentificacion: stringQueryBuilder(queryBuilder.value) }
            ];
        } else {
            switch (queryBuilder.system) {
                case FhirIdentifierSystems.ANDES_ID:
                    if (typeof queryBuilder.value === 'string' && ObjectId.isValid(queryBuilder.value)) {
                        query._id = new ObjectId(queryBuilder.value);
                    } else {
                        throw new ServerError('ID de Andes incorrecto o inválido');
                    }
                    break;
                case FhirIdentifierSystems.CUIL:
                    query.cuil = stringQueryBuilder(queryBuilder.value);
                    break;
                case FhirIdentifierSystems.DNI:
                    query.documento = stringQueryBuilder(queryBuilder.value);
                    break;
                case FhirIdentifierSystems.FOREIGN_ID:
                    query.numeroIdentificacion = stringQueryBuilder(queryBuilder.value);
                    query.tipoIdentificacion = 'dni extranjero';
                    break;
                case FhirIdentifierSystems.PASSPORT:
                    query.numeroIdentificacion = stringQueryBuilder(queryBuilder.value);
                    query.tipoIdentificacion = 'pasaporte';
                    break;
                default:
                    throw new ServerError('System incorrecto');
            }
        }
    }

    if (family || given) {
        query = {
            ...query,
            $and: familyQueryBuilder(family + ' ' + given)
        };
    }
    return query;
}

const PatientRepository = {
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
        // Consistente con buildAndesSearchQuery: no exponer pacientes dados de
        // baja lógicamente (activo: false) a través del acceso directo por ID.
        return collection.findOne({ _id: new ObjectId(id), activo: true });
    },

    async insert(doc: any): Promise<any> {
        const collection = getCollection() as any;
        return collection.insertOne(doc);
    }
};

export default PatientRepository;
