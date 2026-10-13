
import { makeUrl } from './config';

function getReference(url: any) {
    return {
        reference: url
    };
}

export function encode(ID: any, patientReference: any, custodianReference: any, deviceReference: any, medicationStatementReference: any, ImmunizationReferences: any, AllergyIntoleranceReferences: any, ConditionReferences: any) {
    const now = new Date();
    const nowIso = now.toISOString();
    let Immunization: any = [];
    let conditions: any = [];
    let medications: any = [];
    let allergyIntolerance = [];

    if (ImmunizationReferences && ImmunizationReferences.length > 0) {
        Immunization = [{
            title: 'Vacunas',
            text: {
                status: 'generated',
                div: '<div xmlns="http://www.w3.org/1999/xhtml">Sección referida a la vacunación del paciente </div>'
            },
            code: {
                coding: [
                    {
                        system: 'http://loinc.org',
                        code: '60484-3'
                    }
                ]
            },
            entry: ImmunizationReferences.map(getReference)
        }];
    } else {
        Immunization = [{
            title: 'Vacunas',
            text: {
                status: 'generated',
                div: '<div xmlns="http://www.w3.org/1999/xhtml">No hay vacunas registradas</div>'
            },
            code: {
                coding: [
                    {
                        system: 'http://loinc.org',
                        code: '60484-3'
                    }
                ]
            },
            emptyReason: {
                coding: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason',
                        code: 'nilknown',
                        display: 'Nil Known'
                    }
                ]
            }
        }];
    }

    if (medicationStatementReference && medicationStatementReference.length > 0) {
        medications = [{
            title: 'Medicamentos',
            text: {
                status: 'generated',
                div: '<div xmlns="http://www.w3.org/1999/xhtml">Registro de medicamentos</div>'
            },
            code: {
                coding: [
                    {
                        system: 'http://loinc.org',
                        code: '10160-0'
                    }
                ]
            },
            entry: medicationStatementReference.map(getReference)
        }];
    } else {
        medications = [{
            title: 'Medicamentos',
            text: {
                status: 'generated',
                div: '<div xmlns="http://www.w3.org/1999/xhtml">No hay medicamentos registrados</div>'
            },
            code: {
                coding: [
                    {
                        system: 'http://loinc.org',
                        code: '10160-0'
                    }
                ]
            },
            emptyReason: {
                coding: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason',
                        code: 'nilknown',
                        display: 'Nil Known'
                    }
                ]
            }
        }];
    }

    if (AllergyIntoleranceReferences && AllergyIntoleranceReferences.length > 0) {
        allergyIntolerance = [{
            title: 'Alergias o Intolerancias',
            text: {
                status: 'generated',
                div: '<div xmlns="http://www.w3.org/1999/xhtml">Registro de Alergias</div>'
            },
            code: {
                coding: [
                    {
                        system: 'http://loinc.org',
                        code: '48765-2'
                    }
                ]
            },
            entry: AllergyIntoleranceReferences.map(getReference)
        }];
    } else {
        allergyIntolerance = [{
            title: 'Alergias o Intolerancias',
            text: {
                status: 'generated',
                div: '<div xmlns="http://www.w3.org/1999/xhtml">No hay registro de alergias</div>'
            },
            code: {
                coding: [
                    {
                        system: 'http://loinc.org',
                        code: '48765-2'
                    }
                ]
            },
            emptyReason: {
                coding: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason',
                        code: 'nilknown',
                        display: 'Nil Known'
                    }
                ]
            }
        }];
    }

    if (ConditionReferences && ConditionReferences.length > 0) {
        conditions = [{
            code: {
                coding: [
                    {
                        system: 'http://loinc.org',
                        code: '11450-4'
                    }
                ]
            },
            entry: ConditionReferences.map(getReference),
            title: 'Problemas activos',
            text: {
                status: 'generated',
                div: '<div xmlns="http://www.w3.org/1999/xhtml">Lista de problemas activos (trastornos)</div>'
            }
        }];
    } else {
        conditions = [{
            code: {
                coding: [
                    {
                        system: 'http://loinc.org',
                        code: '11450-4'
                    }
                ]
            },
            title: 'Problemas activos',
            text: {
                status: 'generated',
                div: '<div xmlns="http://www.w3.org/1999/xhtml">No hay problemas activos registrados</div>'
            },
            emptyReason: {
                coding: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason',
                        code: 'nilknown',
                        display: 'Nil Known'
                    }
                ]
            }
        }];
    }

    return {
        id: ID,
        subject: {
            reference: patientReference
        },
        section: [
            ...conditions,
            ...medications,
            ...Immunization,
            ...allergyIntolerance

        ],
        resourceType: 'Composition',
        author: [
            {
                reference: deviceReference
            }
        ],
        confidentiality: 'N',
        type: {
            coding: [
                {
                    system: 'http://loinc.org',
                    code: '60591-5'
                }
            ]
        },
        title: 'Resumen del paciente al ' + now.toLocaleDateString('es-AR') + ', ' + now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        identifier: {
            system: makeUrl('Composition'),
            value: ID
        },
        date: nowIso,
        meta: {
            profile: [
                'http://hl7.org/fhir/uv/ips/StructureDefinition/Composition-uv-ips'
            ]
        },
        text: {
            status: 'generated',
            div: '<div xmlns="http://www.w3.org/1999/xhtml">IPS Neuquen</div>'
        },
        custodian: {
            reference: custodianReference
        },
        attester: [
            {
                mode: 'legal',
                time: nowIso,
                party: {
                    reference: custodianReference
                }
            }
        ],
        status: 'final'
    };
}
