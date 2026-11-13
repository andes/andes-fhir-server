import { resolveSchema, ServerError } from '@bluehalo/node-fhir-server-core';
import McodeService, {
    resolvePatientFromClinicalSearch,
    filterClinicalResources
} from '../mcode/mcode.service';
import { fullurl } from '../../utils/data.util';
import { pruneEmpty } from '../../utils/pruneFhir';
import { parsePaging, buildPagingLinks, buildEntryFullUrl } from '../../utils/fhirPaging';

const getObservationSchema = (base_version: string) => {
    return resolveSchema(base_version, 'Observation');
};

/**
 * GET /4_0_1/Observation
 * Soporta filtros: patient, subject, patient.identifier / identifier, _id, code, category, status, _profile
 */
async function search(args: any, context: any) {
    try {
        const { base_version } = args;
        const req = context?.req;
        const rawQuery = req?.query || {};

        const hasPatientOrIdFilter = [
            args['patient'],
            args['subject'],
            args['patient.identifier'],
            args['patient:identifier'],
            args['subject.identifier'],
            args['subject:identifier'],
            args['identifier'],
            rawQuery['patient'],
            rawQuery['subject'],
            rawQuery['patient.identifier'],
            rawQuery['patient:identifier'],
            rawQuery['subject.identifier'],
            rawQuery['subject:identifier'],
            rawQuery['identifier']
        ].some(v => v !== undefined && v !== '');

        if (!hasPatientOrIdFilter) {
            throw new ServerError(
                'Se requiere enviar el parámetro patient, subject o identifier para consultar Observation',
                {
                    statusCode: 400,
                    resourceType: 'OperationOutcome',
                    issue: [
                        {
                            severity: 'warning',
                            code: 'required',
                            diagnostics:
                                'Se requiere enviar el parámetro patient, subject o identifier para consultar Observation'
                        }
                    ]
                }
            );
        }

        const paging = parsePaging(rawQuery, {
            defaultCount: 50,
            maxCount: 200
        });

        const matchedPatient = await resolvePatientFromClinicalSearch(args, rawQuery);
        if (!matchedPatient) {
            return pruneEmpty({
                resourceType: 'Bundle',
                type: 'searchset',
                total: 0,
                link: req ? buildPagingLinks(req, 0, paging) : undefined
            });
        }

        const { observations } = await McodeService.extractResources(base_version, matchedPatient);
        const filtered = filterClinicalResources(observations, args, rawQuery);
        const total = filtered.length;
        const paged = filtered.slice(paging.offset, paging.offset + paging.count);

        const ObservationSchema = getObservationSchema(base_version);
        const entries = paged.map((obs: any) => {
            const resource = new ObservationSchema(pruneEmpty(obs));
            return {
                fullUrl: req
                    ? buildEntryFullUrl(req, base_version, 'Observation', resource.id)
                    : fullurl(resource),
                resource,
                search: { mode: 'match' }
            };
        });

        return pruneEmpty({
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            link: req ? buildPagingLinks(req, total, paging) : undefined,
            entry: entries.length ? entries : undefined
        });
    } catch (err: any) {
        if (err instanceof ServerError) {
            throw err;
        }
        throw new ServerError(err.message || String(err), {
            resourceType: 'OperationOutcome',
            issue: [
                {
                    severity: 'error',
                    code: err.code || 'exception',
                    diagnostics: err.message || String(err)
                }
            ]
        });
    }
}

/**
 * GET /4_0_1/Observation/:id
 */
async function searchById(args: any, _context?: any) {
    try {
        const { base_version, id } = args;
        const found = await McodeService.findClinicalResourceById(base_version, 'observations', id);
        if (!found) {
            throw new ServerError('Observation not found', {
                statusCode: 404,
                resourceType: 'OperationOutcome',
                issue: [
                    {
                        severity: 'error',
                        code: 'not-found',
                        diagnostics: 'Observation not found'
                    }
                ]
            });
        }

        const ObservationSchema = getObservationSchema(base_version);
        return new ObservationSchema(pruneEmpty(found));
    } catch (err: any) {
        if (err instanceof ServerError) {
            throw err;
        }
        throw new ServerError(err.message || String(err), {
            resourceType: 'OperationOutcome',
            issue: [
                {
                    severity: 'error',
                    code: err.code || 'exception',
                    diagnostics: err.message || String(err)
                }
            ]
        });
    }
}

export = {
    search,
    searchById
};
