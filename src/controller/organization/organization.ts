import { Organization as fhirOrganization } from '@andes/fhir';
import { resolveSchema } from '@bluehalo/node-fhir-server-core';
import { fullurl } from '../../utils/data.util';
import { pruneEmpty } from '../../utils/pruneFhir';
import { parsePaging, buildPagingLinks, buildEntryFullUrl } from '../../utils/fhirPaging';
import OrganizationRepository, { buildAndesSearchQuery } from '../../repositories/organization.repository';

export { buildAndesSearchQuery };

let getOrganization = (base_version: string) => {
    return resolveSchema(base_version, 'organization');
};

export async function buscarOrganizacion(version: string, parameters: any, req: any) {
    try {
        const query = OrganizationRepository.buildQuery(parameters);
        const Organization = getOrganization(version);

        const paging = parsePaging(req?.query, {
            defaultCount: 50,
            maxCount: 200
        });

        const total = await OrganizationRepository.count(query);
        const organizations = await OrganizationRepository.find(query, {
            skip: paging.offset,
            limit: paging.count
        });

        const organizationsFhir = organizations.map(org => new Organization(fhirOrganization.encode(org)));

        const bundle = {
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            link: req?.originalUrl ? buildPagingLinks(req, total, paging) : undefined,
            entry: organizationsFhir.length
                ? organizationsFhir.map(p => ({
                    fullUrl: req?.originalUrl
                        ? buildEntryFullUrl(req, version, 'Organization', p.id)
                        : fullurl(p),
                    resource: p,
                    search: {
                        mode: "match"
                    }
                }))
                : undefined
        };

        return pruneEmpty(bundle);
    } catch (err) {
        return err;
    }
}

export async function buscarOrganizacionId(version: string, id: string) {
    try {
        const Organization = getOrganization(version);
        const org = await OrganizationRepository.findById(id);
        return org ? new Organization(fhirOrganization.encode(org)) : null;
    } catch (err) {
        return err;
    }
}

// Vermos como generalizar más adelante
export async function buscarOrganizacionSisa(version: string, codigoSisa: string) {
    try {
        const Organization = getOrganization(version);
        const org = await OrganizationRepository.findBySisa(codigoSisa);
        if (!org) {
            return null;
        }
        org.id = org._id;
        return new Organization(fhirOrganization.encode(org));
    } catch (err) {
        return err;
    }
}