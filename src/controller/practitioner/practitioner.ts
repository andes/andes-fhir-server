import { Practitioner as fhirPractitioner } from '@andes/fhir';
import { resolveSchema, ServerError } from '@asymmetrik/node-fhir-server-core';
import { CONSTANTS } from '../../constants';
import { fullurl } from '../../utils/data.util';
import { pruneEmpty } from '../../utils/pruneFhir';
import { parsePaging, buildPagingLinks, buildEntryFullUrl } from '../../utils/fhirPaging';
import { ObjectId } from 'mongodb';
import globals from '../../globals';
import { tokenQueryBuilder, familyQueryBuilder } from '../../utils/querybuilder.util';
import { FhirIdentifierSystems } from '../../constants/identifier-systems';

const getPractitioner = (base_version: string) => {
    return resolveSchema(base_version, 'Practitioner');
};

const buildAndesSearchQuery = (args: any) => {
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
            case 'andes.gob.ar':
                query._id = new ObjectId(tokenBuilder.value);
                break;
            case 'andes.gob.ar/matriculaciones':
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
};

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildPractitionerNarrative(practitioner) {
    const family = practitioner?.name?.[0]?.family ?? '';
    const given = practitioner?.name?.[0]?.given?.join(' ') ?? '';
    const dni = practitioner?.identifier?.find(x => x.system === FhirIdentifierSystems.DNI)?.value ?? '';

    const summary = `Practitioner: ${family}, ${given}. DNI: ${dni}.`;

    return {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml">${escapeHtml(summary)}</div>`
    };
}
export async function buscarPractitioner(version: string, parameters: any, req: any) {
    try {
        const query = buildAndesSearchQuery(parameters);
        const db = globals.get(CONSTANTS.CLIENT_DB);
        const collection = db.collection(`${CONSTANTS.COLLECTION.PRACTITIONER}`);
        const Practitioner = getPractitioner(version);

        const paging = parsePaging(req.query, {
            defaultCount: 50,
            maxCount: 200
        });

        const total = await collection.countDocuments(query);
        const practitioners = await collection
            .find(query)
            .skip(paging.offset)
            .limit(paging.count)
            .toArray();

        const practitionersFhir = practitioners.map(prac => new Practitioner(fhirPractitioner.encode(prac)));

        const bundle: any = {
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            link: req ? buildPagingLinks(req, total, paging) : undefined,
            entry: practitionersFhir.length
                ? practitionersFhir.map(p => ({
                    fullUrl: req
                        ? buildEntryFullUrl(req, version, 'Practitioner', p.id)
                        : fullurl(p),
                    resource: {
                        ...p,
                        text: buildPractitionerNarrative(p)
                    },
                    search: {
                        mode: 'match'
                    }
                }))
                : undefined
        };

        return pruneEmpty(bundle);
    } catch (err) {
        let message;
        let code = '';
        if (typeof err === 'object') {
            message = (err as any).message;
            code = (err as any).code;
        } else {
            message = err;
        }
        throw new ServerError(message, {
            resourceType: 'OperationOutcome',
            issue: [
                {
                    severity: 'error',
                    code,
                    diagnostics: message
                }
            ]
        });
    }
}

export async function buscarPractitionerId(version: string, id: string) {
    try {
        const db = globals.get(CONSTANTS.CLIENT_DB);
        const collection = db.collection(`${CONSTANTS.COLLECTION.PRACTITIONER}`);
        const Practitioner = getPractitioner(version);

        const practitioner = await collection.findOne({ _id: new ObjectId(id) });

        if (!practitioner) { return null; }

        const encoded = fhirPractitioner.encode(practitioner);

        const resource = {
            ...encoded,
            text: buildPractitionerNarrative(encoded)
        };

        return new Practitioner(resource);

    } catch (err) {
        let message;
        let code = '';

        if (typeof err === 'object') {
            message = (err as any).message;
            code = (err as any).code;
        } else {
            message = err;
        }

        throw new ServerError(
            message,
            {
                resourceType: 'OperationOutcome',
                issue: [
                    {
                        severity: 'error',
                        code,
                        diagnostics: message
                    }
                ]
            }
        );
    }
}
