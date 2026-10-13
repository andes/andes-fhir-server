/**
 * Encode de Medicamentos from ANDES to FHIR
 * @param {} medicationStatement
 */
// Muy incompleto hay que mejorarlo mucho todavía
export function encode(patientReference: any, medicationReference: any, prestacionMedicamento: any) {
    return {
        resourceType: 'MedicationStatement',
        status: (prestacionMedicamento.valor.estado === 'activo') ? 'active' : 'inactive',
        id: prestacionMedicamento._id,  // El código de la prestación donde está el registro del contexto de porque está consumiendo el medicamento
        effectiveDateTime: prestacionMedicamento.createdAt,
        medicationCodeableConcept: {
            coding: [
                {
                    system: 'http://snomed.info/sct',
                    code: prestacionMedicamento.concepto.conceptId,
                    display: prestacionMedicamento.concepto.term
                }
            ]
        },
        meta: {
            profile: [
                'http://hl7.org/fhir/uv/ips/StructureDefinition/MedicationStatement-uv-ips'
            ]
        },
        // extension: null,
        // identifier: '', // Business identifier, not a resource identifier
        subject: {
            reference: patientReference
        },
        medicationReference: {
            reference: medicationReference
        },
        // context: null, // Encounter | Episode of care (podría ser el informe del encuentro o lo que definamos que brinda más información sobre el por qué)
        dosage: [
            {
                text: prestacionMedicamento.valor, // indicación
                route: { coding: [{ system: 'http://standardterms.edqm.eu', code: prestacionMedicamento._id, display: prestacionMedicamento.nombre }] },
                timing: { coding: { system: 'http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation', code: 'QD', display: 'Diario' } }
            }
        ],
        // effectivePeriod: {     // Esta parte se podría calcular entre la fecha de la prestación y la cant. de tiempo que se indica, pero hay problemas
        // en este registro ya que no siempre está la unidad de tiempo (dias, mes, etc) hay q ver si no es un bug.
        //     start: '2015-03'
        // },
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: Medicacion </p><p><b>meta</b>: </p><p><b>text</b>: ${prestacionMedicamento.concepto.term}</p></div>`
        }
    };
}

