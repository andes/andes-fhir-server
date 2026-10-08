import { Collection } from 'mongodb';
import globals from '../globals';
import { CONSTANTS } from '../constants';

function getCollection(): Collection {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    return db.collection(CONSTANTS.COLLECTION.VACCINES);
}

export class VaccineRepository {
    static getCollection = getCollection;

    /**
     * Busca las vacunas registradas para un paciente dado su número de documento.
     * Ordena por fecha de aplicación descendente.
     */
    static async findByDocument(documento: string) {
        const collection = getCollection();
        const conditions = { documento };
        const sort = { fechaAplicacion: -1 as const };
        return await collection.find(conditions).sort(sort).toArray();
    }
}

export default VaccineRepository;
