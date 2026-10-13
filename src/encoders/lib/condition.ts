
/**
 *
 * @param registro Registro RUP a transformar a FHIR
 */


export function encode(patientReference: any, registro: any) {
    const estado = registro.valor?.estado;
    let clinicalStatusCode = 'active';
    if (estado === 'inactivo' || estado === 'inactive') {
        clinicalStatusCode = 'inactive';
    } else if (estado === 'resuelto' || estado === 'resolved') {
        clinicalStatusCode = 'resolved';
    }

    const condition: any = {
        resourceType: 'Condition',
        id: registro._id,
        meta: {
            profile: [
                'http://hl7.org/fhir/uv/ips/StructureDefinition/Condition-uv-ips'
            ]
        },
        category: [
            {
                coding: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                        code: 'problem-list-item',
                        display: 'Problem List Item'
                    },
                    {
                        system: 'http://loinc.org',
                        code: '75326-9'
                    }
                ]
            }
        ],
        subject: {
            reference: patientReference
        },
        onsetDateTime: registro.createdAt ? new Date(registro.createdAt).toISOString() : new Date().toISOString(),
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
                    code: clinicalStatusCode
                }
            ]
        },
        code: {
            coding: [
                {
                    system: 'http://snomed.info/sct',
                    code: String(registro.concepto.conceptId)
                }
            ],
            text: registro.concepto.term || registro.concepto.fsn
        },
        recordedDate: registro.createdAt ? new Date(registro.createdAt).toISOString() : undefined,
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: Problema: </p><p>${registro.nombre || registro.concepto?.term || ''}</p></div>`
        }
    };

    if (registro.valor?.evolucion) {
        condition.note = [
            {
                text: String(registro.valor.evolucion)
            }
        ];
    }

    return condition;
}

