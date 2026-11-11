import { formatFHIRDateTime } from '../utils/fhirDate';
import { escapeHtml } from '../utils/escapeHtml';

export interface AndesNomivac {
    _id?: any;
    id?: string;
    idvacuna?: number | string;
    codigo?: string | number;
    vacuna?: string;
    esquema?: string;
    condicion?: string;
    dosis?: string;
    ordenDosis?: number;
    fechaAplicacion?: Date | string;
    documento?: string;
    apellido?: string;
    nombre?: string;
    fechaNacimiento?: Date | string;
    sexo?: string;
    codigoEsquema?: number | string;
    codigoCondicion?: number | string;
    efector?: string;
    location?: any;
}

/**
 * Encode de Vacunas Nomivac from ANDES to FHIR R4 Immunization
 */
export function encode(patientReference: any, nomivac: AndesNomivac) {
    const occurrenceDate = formatFHIRDateTime(nomivac.fechaAplicacion) ?? new Date().toISOString();
    const resourceId = String(nomivac._id ?? nomivac.id ?? nomivac.idvacuna ?? '');
    const vaccineCodeValue = String(nomivac.codigo ?? nomivac.idvacuna ?? '');
    const vaccineDisplay = (nomivac.vacuna ?? '').trim();

    const patientRef =
        typeof patientReference === 'object' && patientReference !== null
            ? patientReference
            : { reference: patientReference };

    const immunization: any = {
        resourceType: 'Immunization',
        id: resourceId,
        meta: {
            profile: [
                'http://hl7.org/fhir/uv/ips/StructureDefinition/Immunization-uv-ips'
            ]
        },
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${escapeHtml(vaccineDisplay || 'Vacuna')}</p></div>`
        },
        status: 'completed',
        vaccineCode: {
            coding: [
                {
                    system: 'https://snomed.info/sct/11000221109/id/228100022110',
                    code: vaccineCodeValue,
                    display: nomivac.vacuna
                }
            ],
            text: nomivac.vacuna
        },
        patient: patientRef,
        occurrenceDateTime: occurrenceDate,
        primarySource: false
    };

    const hasEsquema = Boolean(nomivac.esquema || nomivac.codigoEsquema !== undefined || nomivac.vacuna);
    const hasCondicion = Boolean(nomivac.condicion || nomivac.codigoCondicion !== undefined);

    if (hasEsquema || hasCondicion) {
        immunization.extension = [];
        if (hasEsquema) {
            immunization.extension.push({
                url: 'http://sisa/fhir/esquema',
                valueCoding: {
                    system: 'http://argentina.gob.ar/salud/NOMIVAC-esquemas',
                    code: String(nomivac.codigoEsquema ?? '0'),
                    display: nomivac.esquema || nomivac.vacuna
                }
            });
        }
        if (hasCondicion) {
            immunization.extension.push({
                url: 'http://sisa/fhir/condicionAplicacion',
                valueCoding: {
                    system: 'http://argentina.gob.ar/salud/NOMIVAC-condicion',
                    ...(nomivac.codigoCondicion !== undefined && {
                        code: String(nomivac.codigoCondicion)
                    }),
                    display: nomivac.condicion
                }
            });
        }
    }

    if (nomivac.efector && String(nomivac.efector).trim()) {
        immunization.location = {
            display: String(nomivac.efector).trim()
        };
    } else if (nomivac.location) {
        immunization.location = {
            reference: typeof nomivac.location === 'string'
                ? nomivac.location
                : 'http://argentina.gob.ar/salud/refes/14999912399913'
        };
    }

    if (nomivac.dosis || nomivac.ordenDosis !== undefined || nomivac.esquema) {
        immunization.protocolApplied = [
            {
                ...(nomivac.esquema && { series: nomivac.esquema }),
                ...((nomivac.dosis || nomivac.ordenDosis !== undefined) && {
                    doseNumberString: String(nomivac.dosis ?? nomivac.ordenDosis)
                })
            }
        ];
    }

    return immunization;
}
