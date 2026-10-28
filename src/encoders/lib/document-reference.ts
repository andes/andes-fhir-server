import { makeUrl } from './config';

export function encode(ID: any, author: any, organization: any, patient: any, binaryURL: any) {
    return {
        resourceType: 'DocumentReference',
        id: ID,
        meta: {
            lastUpdated: new Date().toISOString()
        },
        contained: [
            {
                resourceType: author.resourceType || 'Device',
                id: author.id,
                identifier: [{
                    system: makeUrl(author.resourceType || 'Device'),
                    value: author.id
                }]
            },
            {
                resourceType: organization.resourceType || 'Organization',
                id: organization.id,
                identifier: [{
                    system: makeUrl(organization.resourceType || 'Organization'),
                    value: organization.id
                }]
            }
        ],
        custodian: {
            identifier: {
                system: 'https://federador.msal.gob.ar/uri',
                value: makeUrl('Organization', organization.id)
            }
        },
        masterIdentifier: {
            system: makeUrl('documentos_versiones'),
            value: ID
        },
        identifier: [{
            system: makeUrl('documentos'),
            value: ID
        }],
        status: 'current',
        type: {
            coding: [
                {
                    system: 'http://loinc.org',
                    code: '60591-5'
                }
            ]
        },
        subject: {
            reference: makeUrl('Patient', patient.id),
        },
        // author: [
        //     {
        //         reference: makeUrl('Device', author.id),
        //     },
        //     {
        //         reference: makeUrl('Organization', organization.id),
        //     }
        // ],
        securityLabel: [{
            coding: [{
                system: 'https://saludddigital.gob.ar/nivelesconfidencialidad',
                code: 'N'
            }]
        }],
        content: [{
            attachment: {
                id: 'PRINCIPAL',
                url: binaryURL
            }
        }],
        context: {
            event: [{
                coding: [{
                    system: 'https://saludddigital.gob.ar/tiposevento',
                    code: 'CIR'
                }]
            }],
            // period: {
            //     start: '2019-04-03T10:30:00+03:00',
            //     end: '2019-04-05T10:30:00+03:00'

            // },
            facilityType: {
                coding: [{
                    system: 'https://saludddigital.gob.ar/tipoprestador',
                    code: 'INI'
                }]
            },
            practiceSetting: {
                coding: [{
                    system: 'https://saludddigital.gob.ar/especialidades',
                    code: 'CLM'
                }]
            }
        }

    };
}
