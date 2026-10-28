import { ObjectId, Collection } from 'mongodb';
import { ServerError } from '@bluehalo/node-fhir-server-core';
import globals from '../globals';
import { CONSTANTS, FhirIdentifierSystems, resolveIdentifierSystem } from '../constants';
import { getDominio } from '../encoders';
import { tokenQueryBuilder, familyQueryBuilder, stringQueryBuilder, stringEscape, stringInsensitive } from '../utils/querybuilder.util';

/**
 * Obtiene la colección de pacientes de la base de datos.
 */
function getCollection(): Collection {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    return db.collection(CONSTANTS.COLLECTION.PATIENT);
}

/**
 * Obtiene la colección de parentescos de la base de datos si está disponible.
 */
function getParentescoCollection(): Collection | null {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    if (!db || typeof db.collection !== 'function') {
        return null;
    }
    return db.collection(CONSTANTS.COLLECTION.PARENTESCO);
}

/**
 * Construye la query de búsqueda para Andes basada en los argumentos de FHIR.
 */
function buildAndesSearchQuery(args: any) {
    const id = args['id'];
    const family = args['family'] ? args['family'] : '';
    const given = args['given'] ? args['given'] : '';
    const identifier = args['identifier'];
    const genderParam = args['gender'];
    const query: Record<string, any> = { activo: true };
    const andConditions: Record<string, any>[] = [];

    if (id) {
        query.id = stringQueryBuilder(id);
    }

    if (identifier) {
        const queryBuilder = tokenQueryBuilder(identifier, 'value', 'identifier', false) as any;
        if (!queryBuilder.system) {
            query.$or = [
                { documento: stringEscape(identifier), estado: 'validado' },
                { cuil: identifier, estado: 'validado' },
                { numeroIdentificacion: stringEscape(identifier) }
            ];
        } else {
            const identificador = stringInsensitive(stringEscape(queryBuilder.value));
            switch (resolveIdentifierSystem(queryBuilder.system)) {
                case FhirIdentifierSystems.ANDES_ID:
                case resolveIdentifierSystem(getDominio()):
                    if (typeof queryBuilder.value === 'string' && ObjectId.isValid(queryBuilder.value)) {
                        query._id = new ObjectId(queryBuilder.value);
                    } else {
                        throw new ServerError('ID de Andes incorrecto o inválido');
                    }
                    break;
                case FhirIdentifierSystems.CUIL:
                    query.cuil = identificador;
                    break;
                case FhirIdentifierSystems.DNI:
                    query.documento = identificador;
                    break;
                case FhirIdentifierSystems.FOREIGN_ID:
                    query.numeroIdentificacion = identificador;
                    query.tipoIdentificacion = 'dni extranjero';
                    break;
                case FhirIdentifierSystems.PASSPORT:
                    query.numeroIdentificacion = identificador;
                    query.tipoIdentificacion = 'pasaporte';
                    break;
                default:
                    throw new ServerError('System incorrecto');
            }
        }
    }

    if (family || given) {
        andConditions.push(...familyQueryBuilder(family, given));
    }

    if (genderParam) {
        const gender = String(genderParam).toLowerCase();
        let generoAndes: string;
        if (gender === 'male' || gender === 'masculino') {
            generoAndes = 'masculino';
        } else if (gender === 'female' || gender === 'femenino') {
            generoAndes = 'femenino';
        } else if (gender === 'other' || gender === 'otro') {
            generoAndes = 'otro';
        } else {
            throw new ServerError('Género incorrecto');
        }
        andConditions.push({
            $or: [
                { sexo: generoAndes },
                { genero: generoAndes }
            ]
        });
    }

    if (andConditions.length > 0) {
        query.$and = andConditions;
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
        if (!id || !ObjectId.isValid(id)) {
            return null;
        }
        const collection = getCollection() as any;
        // Consistente con buildAndesSearchQuery: no exponer pacientes dados de
        // baja lógicamente (activo: false) a través del acceso directo por ID.
        return collection.findOne({ _id: new ObjectId(id), activo: true });
    },

    /**
     * Obtiene múltiples documentos de la colección paciente por su _id,
     * incluyendo pacientes en estado 'temporal' (ej. bebés recién nacidos sin DNI)
     * siempre que no estén dados de baja lógicamente (activo !== false).
     */
    async findByIds(ids: string[]): Promise<any[]> {
        if (!ids || ids.length === 0) {
            return [];
        }
        const validIds = Array.from(new Set(ids.filter(id => id && ObjectId.isValid(String(id))))).map(id => new ObjectId(String(id)));
        if (validIds.length === 0) {
            return [];
        }
        const collection = getCollection() as any;
        return collection.find({
            _id: { $in: validIds },
            activo: { $ne: false }
        }).toArray();
    },

    /**
     * Busca el paciente que contiene una relación específica (por relaciones._id o relaciones.referencia).
     */
    async findByRelatedId(relatedId: string): Promise<any> {
        if (!relatedId) {
            return null;
        }
        const orConditions: any[] = [
            { 'relaciones._id': relatedId },
            { 'relaciones.referencia': relatedId }
        ];
        if (ObjectId.isValid(relatedId)) {
            const objId = new ObjectId(relatedId);
            orConditions.push(
                { 'relaciones._id': objId },
                { 'relaciones.referencia': objId }
            );
        }
        const collection = getCollection() as any;
        return collection.findOne({
            activo: true,
            $or: orConditions
        });
    },

    /**
     * Agrega una nueva relación al array relaciones de un paciente en Andes,
     * ajustándose a PacienteSchema ({ relacion: ParentescoSchema, referencia: ObjectId }).
     * Si no se envía referencia, busca o crea el paciente relacionado en estado 'temporal'.
     */
    async addRelation(patientId: string, relacion: any): Promise<{ existing: boolean; relationId: string } | null> {
        const patient = await this.findById(patientId);
        if (!patient) {
            return null;
        }

        const collection = getCollection() as any;
        let targetRefId: string | undefined = relacion.referencia ? String(relacion.referencia) : undefined;

        // Si no viene referencia explícita pero viene documento, verificamos si ya existe en paciente
        if (!targetRefId && relacion.documento) {
            const escapedDoc = stringEscape(String(relacion.documento));
            const existingRelated = await collection.findOne({
                documento: new RegExp(`^${escapedDoc}$`, 'i'),
                activo: { $ne: false }
            });
            if (existingRelated?._id) {
                targetRefId = String(existingRelated._id);
            }
        }

        const existingRelaciones: any[] = Array.isArray(patient.relaciones) ? patient.relaciones : [];
        const match = existingRelaciones.find(rel => {
            if (targetRefId && rel.referencia && String(rel.referencia) === targetRefId) {
                return true;
            }
            if (relacion.documento && rel.documento && String(rel.documento) === String(relacion.documento)) {
                return true;
            }
            if (
                relacion.nombre &&
                relacion.apellido &&
                rel.nombre &&
                rel.apellido &&
                String(rel.nombre).trim().toLowerCase() === String(relacion.nombre).trim().toLowerCase() &&
                String(rel.apellido).trim().toLowerCase() === String(relacion.apellido).trim().toLowerCase()
            ) {
                return true;
            }
            return false;
        });

        if (match) {
            return {
                existing: true,
                relationId: String(match._id ?? match.referencia ?? '')
            };
        }

        // Si aún no existe como documento en paciente, lo creamos como paciente temporal
        if (!targetRefId && (relacion.nombre || relacion.apellido || relacion.documento)) {
            const newTemporalPatient: Record<string, any> = {
                nombre: String(relacion.nombre || '').toUpperCase(),
                apellido: String(relacion.apellido || '').toUpperCase(),
                ...(relacion.documento && { documento: String(relacion.documento) }),
                ...(relacion.tipoIdentificacion && { tipoIdentificacion: relacion.tipoIdentificacion }),
                ...(relacion.numeroIdentificacion && { numeroIdentificacion: relacion.numeroIdentificacion }),
                ...(relacion.fechaNacimiento && { fechaNacimiento: new Date(relacion.fechaNacimiento) }),
                ...(relacion.sexo && { sexo: relacion.sexo }),
                ...(relacion.genero && { genero: relacion.genero }),
                estado: 'temporal',
                activo: true
            };
            const inserted = await collection.insertOne(newTemporalPatient);
            if (inserted?.insertedId) {
                targetRefId = String(inserted.insertedId);
            }
        }

        // Intentar resolver el documento de Parentesco desde la colección 'parentesco'
        let parentescoObj: Record<string, any> = {
            nombre: relacion.relacion?.nombre ?? 'otro',
            opuesto: relacion.relacion?.opuesto ?? 'otro',
            esConviviente: Boolean(relacion.relacion?.esConviviente)
        };
        const parentescoCol = getParentescoCollection() as any;
        if (parentescoCol && typeof parentescoCol.findOne === 'function' && parentescoObj.nombre) {
            const foundParentesco = await parentescoCol.findOne({
                nombre: new RegExp(`^${stringEscape(String(parentescoObj.nombre))}$`, 'i')
            });
            if (foundParentesco) {
                parentescoObj = {
                    _id: foundParentesco._id,
                    nombre: foundParentesco.nombre,
                    opuesto: foundParentesco.opuesto,
                    esConviviente: Boolean(foundParentesco.esConviviente)
                };
            }
        }

        const relObjectId = relacion._id && ObjectId.isValid(String(relacion._id))
            ? new ObjectId(String(relacion._id))
            : new ObjectId();

        const refObjectId = targetRefId && ObjectId.isValid(targetRefId)
            ? new ObjectId(targetRefId)
            : undefined;

        const toInsert: Record<string, any> = {
            _id: relObjectId,
            relacion: parentescoObj,
            ...(refObjectId && { referencia: refObjectId })
        };

        await collection.updateOne(
            { _id: new ObjectId(patientId) },
            { $push: { relaciones: toInsert } }
        );

        return {
            existing: false,
            relationId: relObjectId.toString()
        };
    },

    async insert(doc: any): Promise<any> {
        const collection = getCollection() as any;
        return collection.insertOne(doc);
    }
};

export default PatientRepository;
