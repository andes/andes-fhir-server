import { makeUrl } from './config';

export function encode() {
    /**
 * HARDCODE DEVICE
 */

    return {
        resourceType: 'Device',
        id: 'device-01',
        text: {
            status: 'generated',
            div: '<div xmlns="http://www.w3.org/1999/xhtml"><p>Sistema de Aplicaciones Neuquinas de Salud (ANDES)</p></div>'
        },
        identifier: [
            {
                system: makeUrl('Device'),
                value: 'device-01'
            }
        ],
        type: {
            coding: [
                {
                    system: 'http://snomed.info/sct',
                    code: '462894001'
                }
            ],
            text: 'software de aplicación de sistema de información de historias clínicas de pacientes (objeto físico)'
        },
        owner: {
            reference: 'http://argentina.gob.ar/salud/refes/14999912399913'
        },
        deviceName: [
            {
                name: 'Sistema de Aplicaciones Neuquinas de Salud (ANDES)',
                type: 'manufacturer-name'
            }
        ]
    };
}
