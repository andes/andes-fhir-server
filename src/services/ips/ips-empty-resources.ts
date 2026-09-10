export function EmptyAllergyIntolerance(patientReference: string) {
    return {
        category: ['medication'],
        criticality: 'high',
        patient: {
            reference: patientReference
        },
        id: 'empty-allergy',
        code: {
            coding: [
                {
                    system: 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips',
                    display: 'No hay registro de alergías',
                    code: 'no-allergy-info'
                }
            ]
        },
        meta: {
            profile: ['http://hl7.org/fhir/uv/ips/StructureDefinition/allergyintolerance-uv-ips']
        },
        text: {
            status: 'generated',
            div: '<div xmlns="http://www.w3.org/1999/xhtml">No hay registro de alergías</div>'
        },
        resourceType: 'AllergyIntolerance',
        type: 'allergy'
    };
}

export function EmptyImmunization(patientReference: string) {
    return {
        status: 'completed',
        patient: {
            reference: patientReference
        },
        id: 'empty-immunization',
        vaccineCode: {
            coding: [
                {
                    system: 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips',
                    code: 'no-immunization-info',
                    display: 'No hay información sobre vacunas aplicadas'
                }
            ]
        },
        resourceType: 'Immunization',
        occurrenceDateTime: {
            url: 'http://build.fhir.org/extension-data-absent-reason.html',
            valueCode: 'unknown'
        }
    };
}

export function EmptyMedicationStatement(patientReference: string) {
    return {
        status: 'active',
        text: '',
        medicationCodeableConcept: {
            coding: [
                {
                    system: 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips'
                }
            ]
        },
        patient: {
            reference: patientReference
        },
        id: 'empty-medication',
        code: {
            coding: [
                {
                    system: 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips',
                    display: 'No information about current medications',
                    code: 'no-medication-info'
                }
            ]
        },
        meta: {
            profile: [
                'http://hl7.org/fhir/uv/ips/StructureDefinition/medication-ips'
            ]
        },
        resourceType: 'MedicationStatement'
    };
}

export function EmptyCondition(patientReference: string) {
    return {
        resourceType: 'Condition',
        id: 'empty-condition',
        category: [
            {
                coding: [
                    {
                        system: 'http://loinc.org',
                        display: 'Problem',
                        code: '75326-9'
                    }
                ]
            }
        ],
        verificationStatus: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                    code: 'confirmed'
                }
            ]
        },
        code: {
            coding: [
                {
                    code: 'no-problem-info',
                    system: 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips',
                    display: 'No information about current problems'
                }
            ]
        },
        subject: {
            reference: patientReference
        },
        onsetDateTime: {
            url: 'http://hl7.org/fhir/StructureDefinition/data-absent-reason',
            valueCode: 'unknown'
        },
        clinicalStatus: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                    code: 'active'
                }
            ]
        }
    };
}
