import { Collection, ObjectId } from 'mongodb';
import globals from '../globals';
import { CONSTANTS } from '../constants';

export interface PrestationFilterOptions {
    estado?: string;
    desde?: Date | string;
    hasta?: Date | string;
}

function startOfDay(date: string | Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date: string | Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function getCollection(): Collection {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    return db.collection(CONSTANTS.COLLECTION.PRESTATIONS);
}

export class PrestationRepository {
    static getCollection = getCollection;

    /**
     * Busca prestaciones asociadas a un paciente.
     * Reemplaza el uso de $where por consultas estructuradas en MongoDB.
     */
    static async findByPatientId(pacienteId: string | ObjectId, options: PrestationFilterOptions = {}) {
        const collection = getCollection();
        const patientObjectId = typeof pacienteId === 'string' && ObjectId.isValid(pacienteId)
            ? new ObjectId(pacienteId)
            : pacienteId;

        const estado = options.estado || 'validada';
        const query: Record<string, any> = {
            'paciente.id': patientObjectId
        };

        if (options.desde || options.hasta) {
            query['ejecucion.fecha'] = {};
            if (options.desde) {
                query['ejecucion.fecha']['$gte'] = startOfDay(options.desde);
            }
            if (options.hasta) {
                query['ejecucion.fecha']['$lte'] = endOfDay(options.hasta);
            }
        }

        // Consultamos las prestaciones del paciente
        const prestaciones = await collection.find(query).toArray();

        // Filtramos en memoria el último estado para asegurar consistencia sin recurrir a $where en MongoDB
        return prestaciones.filter(prestacion => {
            if (prestacion.estadoActual?.tipo) {
                return prestacion.estadoActual.tipo === estado;
            }
            if (!prestacion.estados || !prestacion.estados.length) {
                return false;
            }
            const ultimoEstado = prestacion.estados[prestacion.estados.length - 1];
            return ultimoEstado && ultimoEstado.tipo === estado;
        });
    }

    /**
     * Busca la prestación validada que contiene un registro RUP específico por su _id o id
     * (incluyendo registros anidados en moléculas o secciones).
     */
    static async findByRegistroId(registroId: string, options: PrestationFilterOptions = {}) {
        if (!registroId) {
            return null;
        }
        const cleanId = String(registroId).trim().replace(/-status$/, '');
        if (!cleanId) {
            return null;
        }

        const candidateValues: (string | ObjectId)[] = [cleanId];
        if (ObjectId.isValid(cleanId)) {
            candidateValues.push(new ObjectId(cleanId));
        }

        const paths = [
            'ejecucion.registros._id',
            'ejecucion.registros.id',
            'ejecucion.registros.registros._id',
            'ejecucion.registros.registros.id',
            'ejecucion.registros.registros.registros._id',
            'ejecucion.registros.registros.registros.id'
        ];

        const orConditions = paths.map(path => ({
            [path]: { $in: candidateValues }
        }));

        const estado = options.estado || 'validada';
        const collection = getCollection();
        const prestaciones = await collection.find({ $or: orConditions }).toArray();

        const validPrestaciones = prestaciones.filter(prestacion => {
            if (prestacion.estadoActual?.tipo) {
                return prestacion.estadoActual.tipo === estado;
            }
            if (!prestacion.estados || !prestacion.estados.length) {
                return false;
            }
            const ultimoEstado = prestacion.estados[prestacion.estados.length - 1];
            return ultimoEstado && ultimoEstado.tipo === estado;
        });

        return validPrestaciones[0] ?? null;
    }
}

export default PrestationRepository;
