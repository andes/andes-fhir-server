import { Collection, ObjectId } from 'mongodb';
import globals from '../globals';
import { CONSTANTS } from '../constants';

function getCollection(): Collection {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    return db.collection(CONSTANTS.COLLECTION.VACCINES);
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseFhirDateFilter(rawDate: string | string[]): Record<string, any> | null {
    const values = Array.isArray(rawDate) ? rawDate : [rawDate];
    const mongoCond: Record<string, any> = {};

    for (const item of values) {
        const str = String(item ?? '').trim();
        if (!str) {
            continue;
        }
        const match = str.match(/^(eq|ne|gt|lt|ge|le|sa|eb)?(.+)$/i);
        if (!match) {
            continue;
        }
        const prefix = (match[1] || 'eq').toLowerCase();
        const dateStr = match[2].trim();
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) {
            continue;
        }

        switch (prefix) {
            case 'ge':
            case 'sa':
                mongoCond.$gte = parsed;
                break;
            case 'gt':
                mongoCond.$gt = parsed;
                break;
            case 'le':
            case 'eb':
                mongoCond.$lte = parsed;
                break;
            case 'lt':
                mongoCond.$lt = parsed;
                break;
            case 'ne':
                mongoCond.$ne = parsed;
                break;
            case 'eq':
            default:
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    const start = new Date(`${dateStr}T00:00:00.000Z`);
                    const end = new Date(`${dateStr}T23:59:59.999Z`);
                    mongoCond.$gte = start;
                    mongoCond.$lte = end;
                } else {
                    mongoCond.$eq = parsed;
                }
                break;
        }
    }

    return Object.keys(mongoCond).length > 0 ? mongoCond : null;
}

export class VaccineRepository {
    static getCollection = getCollection;

    /**
     * Busca las vacunas registradas para un paciente dado su número de documento.
     * Ordena por fecha de aplicación descendente.
     */
    static async findByDocument(documento: string) {
        const collection = getCollection();
        const conditions = { documento: String(documento).trim() };
        const sort = { fechaAplicacion: -1 as const };
        return await collection.find(conditions).sort(sort).toArray();
    }

    /**
     * Busca las vacunas registradas para múltiples números de documento en una sola consulta.
     */
    static async findByDocuments(documentos: string[]) {
        const uniqueDocs = Array.from(
            new Set(documentos.map(d => String(d ?? '').trim()).filter(Boolean))
        );
        if (uniqueDocs.length === 0) {
            return [];
        }
        const collection = getCollection();
        const sort = { fechaAplicacion: -1 as const };
        return await collection
            .find({ documento: { $in: uniqueDocs } })
            .sort(sort)
            .toArray();
    }

    /**
     * Busca un registro de vacuna por su _id de Mongo o por su idvacuna numérico.
     */
    static async findById(id: string) {
        if (!id) {
            return null;
        }
        const cleanId = String(id).trim();
        const collection = getCollection();

        if (/^[a-f\d]{24}$/i.test(cleanId) && ObjectId.isValid(cleanId)) {
            const byObjectId = await collection.findOne({ _id: new ObjectId(cleanId) });
            if (byObjectId) {
                return byObjectId;
            }
        }

        if (/^\d+$/.test(cleanId)) {
            return await collection.findOne({ idvacuna: Number(cleanId) });
        }

        return null;
    }

    /**
     * Construye la consulta de MongoDB para búsqueda de vacunas en la colección nomivac.
     */
    static buildQuery(params: {
        _id?: string;
        documento?: string;
        date?: string | string[];
        vaccineCode?: string;
    }): Record<string, any> {
        const query: Record<string, any> = {};

        if (params._id) {
            const cleanId = String(params._id).trim();
            if (/^[a-f\d]{24}$/i.test(cleanId) && ObjectId.isValid(cleanId)) {
                query._id = new ObjectId(cleanId);
            } else if (/^\d+$/.test(cleanId)) {
                query.idvacuna = Number(cleanId);
            } else {
                query._id = null;
            }
        }

        if (params.documento) {
            query.documento = String(params.documento).trim();
        }

        if (params.date) {
            const dateFilter = parseFhirDateFilter(params.date);
            if (dateFilter) {
                query.fechaAplicacion = dateFilter;
            }
        }

        if (params.vaccineCode) {
            const rawCode = String(params.vaccineCode).trim();
            const codePart = rawCode.includes('|') ? rawCode.split('|')[1].trim() : rawCode;
            if (codePart) {
                const orConditions: any[] = [
                    { codigo: codePart },
                    { vacuna: { $regex: new RegExp(escapeRegex(codePart), 'i') } }
                ];
                if (/^\d+$/.test(codePart)) {
                    orConditions.push({ idvacuna: Number(codePart) });
                }
                query.$or = orConditions;
            }
        }

        return query;
    }

    static async count(query: Record<string, any>): Promise<number> {
        const collection = getCollection() as any;
        return await collection.countDocuments(query);
    }

    static async find(
        query: Record<string, any>,
        options: { skip?: number; limit?: number } = {}
    ): Promise<any[]> {
        const collection = getCollection() as any;
        let cursor = collection.find(query).sort({ fechaAplicacion: -1 });
        if (options.skip !== undefined) {
            cursor = cursor.skip(options.skip);
        }
        if (options.limit !== undefined) {
            cursor = cursor.limit(options.limit);
        }
        return await cursor.toArray();
    }
}

export default VaccineRepository;
