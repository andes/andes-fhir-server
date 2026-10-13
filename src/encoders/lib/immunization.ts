
/**
 * Encode de Vacunas Nomivac from ANDES to FHIR
 * @param {} nomivac
 * [ASK] El code de extension puede ir en vaccineCode?
 * [ASk] Location no se sabe. Solo esta el texto
 */
export function encode(patientReference: any, nomivac: any) {
    const occurrenceDate = nomivac.fechaAplicacion
        ? new Date(nomivac.fechaAplicacion).toISOString()
        : new Date().toISOString();

    const immunization: any = {
        resourceType: 'Immunization',
        id: String(nomivac.idvacuna),
        meta: {
            profile: [
                'http://hl7.org/fhir/uv/ips/StructureDefinition/Immunization-uv-ips'
            ]
        },
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${nomivac.vacuna || 'Vacuna'}</p></div>`
        },
        status: 'completed',
        vaccineCode: {
            coding: [
                {
                    system: 'https://snomed.info/sct/11000221109/id/228100022110',
                    code: String(nomivac.idvacuna),
                    display: nomivac.vacuna
                }
            ],
            text: nomivac.vacuna
        },
        patient: {
            reference: patientReference
        },
        occurrenceDateTime: occurrenceDate,
        primarySource: false
    };

    if (nomivac.vacuna || nomivac.condicion) {
        immunization.extension = [];
        if (nomivac.vacuna) {
            immunization.extension.push({
                url: 'http://sisa/fhir/esquema',
                valueCoding: {
                    system: 'http://argentina.gob.ar/salud/NOMIVAC-esquemas',
                    code: '0',
                    display: nomivac.vacuna
                }
            });
        }
        if (nomivac.condicion) {
            immunization.extension.push({
                url: 'http://sisa/fhir/condicionAplicacion',
                valueCoding: {
                    system: 'http://argentina.gob.ar/salud/NOMIVAC-condicion',
                    code: '17',
                    display: 'Personal de Salud'
                }
            });
        }
    }

    if (nomivac.location) {
        immunization.location = {
            reference: 'http://argentina.gob.ar/salud/refes/14999912399913'
        };
    }

    if (nomivac.dosis) {
        immunization.protocolApplied = [
            {
                doseNumberString: String(nomivac.dosis)
            }
        ];
    }

    return immunization;
}
