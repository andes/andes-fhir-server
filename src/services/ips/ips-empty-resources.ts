export function EmptyAllergyIntolerance(patientReference: string) {
    return {
        resourceType: 'AllergyIntolerance',
        id: 'empty-allergy',
        meta: {
            profile: ['http://hl7.org/fhir/uv/ips/StructureDefinition/AllergyIntolerance-uv-ips']
        },
        text: {
            status: 'generated',
            div: '<div xmlns="http://www.w3.org/1999/xhtml">No information about allergies</div>'
        },
        clinicalStatus: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                    code: 'active'
                }
            ]
        },
        verificationStatus: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
                    code: 'confirmed'
                }
            ]
        },
        code: {
            coding: [
                {
                    system: 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips',
                    code: 'no-allergy-info',
                    display: 'No information about allergies'
                }
            ]
        },
        patient: {
            reference: patientReference
        }
    };
}

export function EmptyImmunization(patientReference: string) {
    return {
        resourceType: 'Immunization',
        id: 'empty-immunization',
        meta: {
            profile: ['http://hl7.org/fhir/uv/ips/StructureDefinition/Immunization-uv-ips']
        },
        text: {
            status: 'generated',
            div: '<div xmlns="http://www.w3.org/1999/xhtml">No information about immunizations</div>'
        },
        status: 'completed',
        vaccineCode: {
            coding: [
                {
                    system: 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips',
                    code: 'no-immunization-info',
                    display: 'No information about immunizations'
                }
            ]
        },
        patient: {
            reference: patientReference
        },
        occurrenceDateTime: new Date().toISOString()
    };
}

export function EmptyMedicationStatement(patientReference: string) {
    return {
        resourceType: 'MedicationStatement',
        id: 'empty-medication',
        meta: {
            profile: [
                'http://hl7.org/fhir/uv/ips/StructureDefinition/MedicationStatement-uv-ips'
            ]
        },
        text: {
            status: 'generated',
            div: '<div xmlns="http://www.w3.org/1999/xhtml">No information about medications</div>'
        },
        status: 'active',
        medicationCodeableConcept: {
            coding: [
                {
                    system: 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips',
                    code: 'no-medication-info',
                    display: 'No information about medications'
                }
            ]
        },
        subject: {
            reference: patientReference
        },
        effectiveDateTime: new Date().toISOString()
    };
}

export function EmptyCondition(patientReference: string) {
    return {
        resourceType: 'Condition',
        id: 'empty-condition',
        meta: {
            profile: ['http://hl7.org/fhir/uv/ips/StructureDefinition/Condition-uv-ips']
        },
        text: {
            status: 'generated',
            div: '<div xmlns="http://www.w3.org/1999/xhtml">No information about problems</div>'
        },
        category: [
            {
                coding: [
                    {
                        system: 'http://loinc.org',
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
        clinicalStatus: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                    code: 'active'
                }
            ]
        },
        code: {
            coding: [
                {
                    system: 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips',
                    code: 'no-problem-info',
                    display: 'No information about problems'
                }
            ]
        },
        subject: {
            reference: patientReference
        },
        onsetDateTime: new Date().toISOString()
    };
}
