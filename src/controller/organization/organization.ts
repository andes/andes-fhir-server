import { Organization as fhirOrganization, Patient } from '@andes/fhir';
import { resolveSchema } from '@asymmetrik/node-fhir-server-core';
import { CONSTANTS } from '../../constants';
import { fullurl } from '../../utils/data.util';
import { pruneEmpty } from '../../utils/pruneFhir';
import { parsePaging, buildPagingLinks, buildEntryFullUrl } from '../../utils/fhirPaging';
import globals from '../../globals';
import { stringQueryBuilder, keyQueryBuilder } from '../../utils/querybuilder.util';
import { ObjectId } from 'mongodb';


let getOrganization = (base_version: string) => {
    return resolveSchema(base_version, 'organization');
};

let buildAndesSearchQuery = (args: any) => {

    // Filtros de búsqueda para organizaciones
    let id = args['id'];
    let active = args['active'];
    let identifier = args['identifier']; // codigo
    let name = args['name'];
    let query: any = {};

    if (id) {
        query.id = id;
    }
    if (active) {
        query.activo = active === true ? true : false;
    }
    if (name) {
        query.nombre = stringQueryBuilder(name, true);
    }
    if (identifier) {
        let queryBuilder = keyQueryBuilder(identifier, 'codigo.sisa');
        for (let i in queryBuilder) {
            query[i] = queryBuilder[i];
        }
    }
    return query;
};


export async function buscarOrganizacion(version: string, parameters: any, req: any) {
    try {
        const query = buildAndesSearchQuery(parameters);
        const db = globals.get(CONSTANTS.CLIENT_DB);
        const collection = db.collection(`${CONSTANTS.COLLECTION.ORGANIZATION}`);
        const Organization = getOrganization(version);

        const paging = parsePaging(req.query, {
            defaultCount: 50,
            maxCount: 200
        });

        const total = await collection.countDocuments(query);
        const organizations = await collection
            .find(query)
            .skip(paging.offset)
            .limit(paging.count)
            .toArray();

        const organizationsFhir = organizations.map(org => new Organization(fhirOrganization.encode(org)));

        const bundle = {
            resourceType: 'Bundle',
            type: 'searchset',
            total,
            link: req ? buildPagingLinks(req, total, paging) : undefined,
            entry: organizationsFhir.length
                ? organizationsFhir.map(p => ({
                    fullUrl: req
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
        return err
    }
}

export async function buscarOrganizacionId(version: string, id: string) {
    try {
        const db = globals.get(CONSTANTS.CLIENT_DB);
        let collection = db.collection(`${CONSTANTS.COLLECTION.ORGANIZATION}`);
        let Organization = getOrganization(version);
        let org = await collection.findOne({ _id: new ObjectId(id) });
        return org ? new Organization(fhirOrganization.encode(org)) : null;
    } catch (err) {
        return err
    }
}

// Vermos como generalizar más adelante
export async function buscarOrganizacionSisa(version: string, codigoSisa: string) {
    try {
        const db = globals.get(CONSTANTS.CLIENT_DB);
        let collection = db.collection(`${CONSTANTS.COLLECTION.ORGANIZATION}`);
        let Organization = getOrganization(version);
        let org = await collection.findOne({ 'codigo.sisa': codigoSisa });
        org.id = org._id;
        return new Organization(fhirOrganization.encode(org))
    } catch (err) {
        return err
    }
}