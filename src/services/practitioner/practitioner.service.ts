import { Practitioner as fhirPractitioner } from '../../encoders';
import { resolveSchema, ServerError } from '@bluehalo/node-fhir-server-core';
import { fullurl } from '../../utils/data.util';
import { pruneEmpty } from '../../utils/pruneFhir';
import { parsePaging, buildPagingLinks, buildEntryFullUrl } from '../../utils/fhirPaging';
import PractitionerRepository from '../../repositories/practitioner.repository';

const getPractitionerSchema = (base_version: string) => {
    return resolveSchema(base_version, 'Practitioner');
};

/**
 * Busca profesionales aplicando filtros y paginación.
 */
async function search(args: any, context: any) {
    try {
        const { base_version } = args;
        const req = context.req;

        if (Object.keys(args).length === 0) {
            throw new ServerError('Se requiere enviar al menos un parámetro de búsqueda', {
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'warning', code: 'required', diagnostics: 'Se requiere enviar al menos un parámetro de búsqueda' }]
            });
        }

        const query = PractitionerRepository.buildQuery(args);
        const paging = parsePaging(req?.query || {}, {
            defaultCount: 50,
            maxCount: 200
        });

        const total = await PractitionerRepository.count(query);
        const practitioners = await PractitionerRepository.find(query, {
            skip: paging.offset,
            limit: paging.count
        });

        const Practitioner = getPractitionerSchema(base_version);
        const practitionersFhir = practitioners.map((prac, index) => {
            try {
                return new Practitioner(fhirPractitioner.encode(prac));
            } catch (e) {
                console.error(`Error encoding practitioner ID: ${prac._id} at index ${index + paging.offset}:`, e.message);
                return null;
            }
        }).filter(p => p !== null);

        const bundle: any = {
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            link: req ? buildPagingLinks(req, total, paging) : undefined,
            entry: practitionersFhir.length
                ? practitionersFhir.map(p => ({
                    fullUrl: req
                        ? buildEntryFullUrl(req, base_version, 'Practitioner', p.id)
                        : fullurl(p),
                    resource: p,
                    search: { mode: 'match' }
                }))
                : undefined
        };

        return pruneEmpty(bundle);
    } catch (err) {
        if (err instanceof ServerError) {
            throw err;
        }
        throw new ServerError(err.message || err, {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: (err as any).code || 'exception', diagnostics: err.message || err }]
        });
    }
}

/**
 * Busca un profesional por su ID.
 */
async function searchById(args: any, _context: any) {
    try {
        const { base_version, id } = args;
        const Practitioner = getPractitionerSchema(base_version);
        const practitioner = await PractitionerRepository.findById(id);

        if (!practitioner) {
            return null;
        }

        try {
            return new Practitioner(fhirPractitioner.encode(practitioner));
        } catch (e) {
            console.error(`Error encoding practitioner ID: ${id}:`, e.message);
            throw new ServerError(`Error de datos en el profesional con ID: ${id}`, {
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'invariant', diagnostics: e.message }]
            });
        }
    } catch (err) {
        if (err instanceof ServerError) {
            throw err;
        }
        throw new ServerError(err.message || err, {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: (err as any).code || 'exception', diagnostics: err.message || err }]
        });
    }
}

const PractitionerService = {
    search,
    searchById
};

export = PractitionerService;
