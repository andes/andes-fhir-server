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
            if (!prestacion.estados || !prestacion.estados.length) {
                return false;
            }
            const ultimoEstado = prestacion.estados[prestacion.estados.length - 1];
            return ultimoEstado && ultimoEstado.tipo === estado;
        });
    }
}

export default PrestationRepository;
