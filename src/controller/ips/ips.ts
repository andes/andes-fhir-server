import { AllergyIntolerance, Bundle, Composition, Condition, Device, Immunization, Medication, MedicationStatement } from '@andes/fhir';
import { resolveSchema, ServerError } from '@asymmetrik/node-fhir-server-core';
import { filtrarRegistros, getPrestaciones } from './../../controller/ips/prestaciones';
import { getVacunas } from './../../controller/ips/vacunas';
import { buscarOrganizacionSisa } from './../../controller/organization/organization';
import { buscarPacienteId } from './../../controller/patient/patient';
import { ApiAndes } from './../../utils/apiAndesQuery';
import { createResource, fullurl } from './../../utils/data.util';

const { ObjectID } = require('mongodb').ObjectID;

let getPatient = (base_version) => {
    return resolveSchema(base_version, 'patient');
}
let getMedication = (base_version) => {
    return resolveSchema(base_version, 'medication');
}
let getMedicationStatement = (base_version) => {
    return resolveSchema(base_version, 'medicationstatement');
}
let getAllergyIntolerance = (base_version) => {
    return resolveSchema(base_version, 'allergyintolerance');
}

async function prestMedicamentos(version, prestacionMedicamentos, FHIRPatient): Promise<any> {
    const apiAndes = new ApiAndes();
    let FHIRMedication;
    let FHIRMedicationStatement = [];
    const medicationSchema = getMedication(version);
    const medicationStatementSchema = getMedicationStatement(version);
    if (prestacionMedicamentos.length) {
        for (const pm of prestacionMedicamentos) {
            const medicamento = await apiAndes.getSnomedByConceptId(pm.concepto.conceptId);
            FHIRMedication = new medicationSchema(Medication.encode(medicamento));
            FHIRMedicationStatement.push(new medicationStatementSchema(MedicationStatement.encode(fullurl(FHIRPatient), fullurl(FHIRMedication), pm)));
        }
        return FHIRMedicationStatement
    } else {
        return [EmptyMedicationStatement(fullurl(FHIRPatient))]

    }
}

export async function ips(version, pacienteID) {
    try {
        const apiAndes = new ApiAndes();
        const snomedAlergias = await apiAndes.getSnomedAllergies(419199007); // código de alergia a sustancias
        const patient = await buscarPacienteId(version, pacienteID);
        if (patient) {
            // Recuperar datos de la historia clinica
            const FHIRCustodian = await buscarOrganizacionSisa(version, '0'); //Siempre enviaremos los recursos como de la Subsecretaría de salud
            const prestaciones = await getPrestaciones(
                { _id: new ObjectID(pacienteID) },
                {}
            );
            const semanticTags = ['trastorno', 'producto', 'fármaco de uso clínico', /*  'hallazgo'  , 'evento', 'situacion' */]; // [TODO] Revisar listado de semtags con el equipo
            const { registrosMedicos, prestacionMedicamentos, registrosAlergias } = filtrarRegistros(prestaciones, { semanticTags }, snomedAlergias);

            const documento = patient.identifier.find(i => i.system === 'http://www.renaper.gob.ar/dni').value;
            const vacunas: any = await getVacunas(documento);

            // Armar documento
            const FHIRDevice = Device.encode();
            const PatientSchema = getPatient(version);

            const FHIRPatient = patient; // new PatientSchema(Patient.encode(patient));
            const FHIRMedicationStatement = await prestMedicamentos(version, prestacionMedicamentos, FHIRPatient);


            const AllergyIntoleranceSchema = getAllergyIntolerance(version);

            const FHIRAllergyIntolerance = registrosAlergias.length ? registrosAlergias.map((registro) => {
                return new AllergyIntoleranceSchema(AllergyIntolerance.encode(fullurl(FHIRPatient), registro));
            }) : [EmptyAllergyIntolerance(fullurl(FHIRPatient))];

            const FHIRImmunization = vacunas.length ? vacunas.map((vacuna) => {
                return Immunization.encode(fullurl(FHIRPatient), vacuna);
            }) : [EmptyImmunization(fullurl(FHIRPatient))];

            const rs = filtrarDuplicados(registrosMedicos);
            const FHIRCondition: any = rs.length ? rs.map((registro) => {
                return Condition.encode(fullurl(FHIRPatient), registro);
            }) : [EmptyCondition(fullurl(FHIRPatient))];

            const CompositionID = new ObjectID();

            const FHIRComposition = Composition.encode(
                CompositionID,
                fullurl(FHIRPatient),
                fullurl(FHIRCustodian),
                fullurl(FHIRDevice),
                FHIRMedicationStatement.map(fullurl),
                FHIRImmunization.map(fullurl),
                FHIRAllergyIntolerance.map(fullurl),
                FHIRCondition.map(fullurl)
            );

            const BundleID = new ObjectID();
            const FHIRBundle = Bundle.encode(BundleID, [
                createResource(FHIRComposition),
                createResource(FHIRPatient),
                ...FHIRMedicationStatement.map(createResource),
                ...FHIRAllergyIntolerance.map(createResource),
                ...FHIRCondition.map(createResource),
                ...FHIRImmunization.map(createResource),
                // createResource(FHIRMedication),
                createResource(FHIRDevice),
                createResource(FHIRCustodian)
            ]);
            return FHIRBundle;

        } else {
            const message = 'patient not found'
            throw new ServerError(message, {
                resourceType: "OperationOutcome",
                issue: [
                    {
                        severity: 'error',
                        code: 404,
                        diagnostics: message
                    }
                ]
            });
        }
    } catch (err) {
        console.log(err)
        const message = err
        throw new ServerError(message, {
            resourceType: "OperationOutcome",
            issue: [
                {
                    severity: 'error',
                    code: 500,
                    diagnostics: message
                }
            ]
        });
    }
}

function filtrarDuplicados(registros: any[]): any[] {
    const mapping = {};

    registros.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).forEach((registro) => {
        if (!mapping[registro.concepto.conceptId]) {
            mapping[registro.concepto.conceptId] = registro;
        }
    });

    return Object.values(mapping);

}


function EmptyAllergyIntolerance(patientReference) {
    return {

        category: [
            'medication'
        ],
        criticality: 'high',
        patient: {
            reference: patientReference
        },
        id: '1234',
        code: {
            coding: [
                {
                    system: 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips',
                    display: "No hay registro de alergías",
                    code: "no-allergy-info",
                }
            ]
        },
        meta: {
            profile: ['http://hl7.org/fhir/uv/ips/StructureDefinition/allergyintolerance-uv-ips']
        },
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">No hay registro de alergías</div>`
        },
        resourceType: 'AllergyIntolerance',
        type: 'allergy'
    }
}


function EmptyImmunization(patientReference) {
    return {
        status: 'completed',

        patient: {
            reference: patientReference
        },
        id: '1234',
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
    }
}


function EmptyMedicationStatement(patientReference) {
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
        id: '1234',
        code: {
            coding: [
                {
                    system: 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips',
                    display: "No information about current medications",
                    code: "no-medication-info",
                }
            ]
        },
        meta: {
            profile: [
                'http://hl7.org/fhir/uv/ips/StructureDefinition/medication-ips'
            ]
        },
        resourceType: 'MedicationStatement'
    }
}

function EmptyCondition(patientReference) {
    return {

        resourceType: 'Condition',
        id: '1234',
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
                    system: 'http://terminology.hl7.org//CodeSystem//condition-ver-status',
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
                },
            ]
        }
    }
}