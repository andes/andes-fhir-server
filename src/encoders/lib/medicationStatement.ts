import { formatFHIRDateTime } from '../utils/fhirDate';
import { escapeHtml } from '../utils/escapeHtml';

/**
 * Encode de Medicamentos from ANDES to FHIR
 * @param {} medicationStatement
 */
// Muy incompleto hay que mejorarlo mucho todavía
export function encode(patientReference: any, medicationReference: any, prestacionMedicamento: any) {
    const dosageText = typeof prestacionMedicamento.valor === 'string'
        ? prestacionMedicamento.valor
        : (prestacionMedicamento.valor?.indicacion ?? prestacionMedicamento.concepto?.term ?? '');

    const medicationChoice = medicationReference
        ? {
            medicationReference: {
                reference: medicationReference
            }
        }
        : {
            medicationCodeableConcept: {
                coding: [
                    {
                        system: 'http://snomed.info/sct',
                        code: prestacionMedicamento.concepto?.conceptId,
                        display: prestacionMedicamento.concepto?.term
                    }
                ]
            }
        };

    return {
        resourceType: 'MedicationStatement',
        status: (prestacionMedicamento.valor?.estado === 'activo') ? 'active' : 'inactive',
        id: prestacionMedicamento._id,  // El código de la prestación donde está el registro del contexto de porque está consumiendo el medicamento
        effectiveDateTime: formatFHIRDateTime(prestacionMedicamento.createdAt) ?? new Date().toISOString(),
        ...medicationChoice,
        meta: {
            profile: [
                'http://hl7.org/fhir/uv/ips/StructureDefinition/MedicationStatement-uv-ips'
            ]
        },
        subject: {
            reference: patientReference
        },
        dosage: [
            {
                text: dosageText, // indicación
                route: { coding: [{ system: 'http://standardterms.edqm.eu', code: prestacionMedicamento._id, display: prestacionMedicamento.nombre }] },
                timing: { coding: { system: 'http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation', code: 'QD', display: 'Diario' } }
            }
        ],
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: Medicacion </p><p><b>meta</b>: </p><p><b>text</b>: ${escapeHtml(prestacionMedicamento.concepto?.term ?? '')}</p></div>`
        }
    };
}

