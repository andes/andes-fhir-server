import { ObjectId, Collection } from 'mongodb';
import globals from '../globals';
import { CONSTANTS, FhirIdentifierSystems } from '../constants';
import { tokenQueryBuilder, familyQueryBuilder } from '../utils/querybuilder.util';

/**
 * Obtiene la colección de profesionales de la base de datos.
 */
function getCollection(): Collection {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    return db.collection(CONSTANTS.COLLECTION.PRACTITIONER);
}

/**
 * Construye la query de búsqueda para Andes basada en los argumentos de FHIR.
 */
function buildAndesSearchQuery(args: any) {
    // Filtros de búsqueda para profesionales
    const active = args['active'] ? args['active'] : true;
    const family = args['family'] ? args['family'] : '';
    const given = args['given'] ? args['given'] : '';
    const identifier = args['identifier'];
    const query: any = {};

    query.$and = [];
    query.$and.push({ profesionalMatriculado: true });
    if (active === true || active === 'true') {
        query.$and.push({
            $or: [
                { habilitado: true },
                { habilitado: { $exists: false } }
            ]
        });
    } else {
        query.$and.push({ habilitado: false });
    }

    // Si hay filtros de nombre
    if (family || given) {
        query.$and.push(...familyQueryBuilder(family + ' ' + given));
    }

    // Controles de identifier de profesional
    if (identifier) {
        const tokenBuilder: any = tokenQueryBuilder(identifier, 'value', 'identifier', false);
        switch (tokenBuilder.system) {
            case FhirIdentifierSystems.ANDES_ID:
                query._id = new ObjectId(tokenBuilder.value);
                break;
            case FhirIdentifierSystems.MATRICULACIONES:
                if (tokenBuilder.value.includes('@')) {
                    /*  Consulta por profesional. Dado un nro de matricula y codigo de carrera de grado o posgrado,
                        retorna un profesional siempre que esté activo.
                    */
                    const [nroMatricula, tipoProfesion] = tokenBuilder.value.split('@');
                    query['$or'] = [];
                    query['$or'].push({ 'formacionGrado.matriculacion.matriculaNumero': parseInt(nroMatricula || 0, 10), 'formacionGrado.profesion.codigo': parseInt(tipoProfesion || 0, 10) });
                    query['$or'].push({ 'formacionPosgrado.matriculacion.matriculaNumero': parseInt(nroMatricula || 0, 10), 'formacionPosgrado.especialidad.codigo.sisa': parseInt(tipoProfesion || 0, 10) });
                } else {
                    if (parseInt(tokenBuilder.value)) {
                        query['$or'] = [];
                        query['$or'].push({ 'formacionGrado.matriculacion.matriculaNumero': parseInt(tokenBuilder.value || 0, 10) });
                        query['$or'].push({ 'formacionPosgrado.matriculacion.matriculaNumero': parseInt(tokenBuilder.value || 0, 10) });
                    }
                }
                break;
            case 'https://seti.afip.gob.ar/padron-puc-constancia-internet/ConsultaConstanciaAction.do':
                query.cuit = tokenBuilder.value;
                break;
            case FhirIdentifierSystems.DNI:
                query.documento = tokenBuilder.value;
                break;
            default:
                query.documento = tokenBuilder.value;
        }
    }
    return query;
}

const PractitionerRepository = {
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
    }
};

export default PractitionerRepository;
