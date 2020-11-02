import { Device, Bundle, Immunization, Condition, Composition, Patient, Organization, Medication, MedicationStatement, AllergyIntolerance } from '@andes/fhir';
import { buscarPacienteIdAndes } from './../../controller/patient/patient';
import { buscarOrganizacionSisa } from './../../controller/organization/organization';
import { createResource, fullurl } from './../../utils/data.util';
import { getPrestaciones, filtrarRegistros } from './../../controller/ips/prestaciones';
import { getVacunas } from './../../controller/ips/vacunas';
import { ApiAndes } from './../../utils/apiAndesQuery';
import {ServerError, resolveSchema}  from '@asymmetrik/node-fhir-server-core'; 

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

async function prestMedicamentos(version, prestacionMedicamentos, FHIRPatient) {
    const apiAndes = new ApiAndes();
    let FHIRMedication;
    let FHIRMedicationStatement = [];
    const medicationSchema = getMedication(version);
    const medicationStatementSchema = getMedicationStatement(version);
    for (const pm of prestacionMedicamentos) {
        const medicamento = await apiAndes.getSnomedByConceptId(pm.concepto.conceptId);
        FHIRMedication = new medicationSchema(Medication.encode(medicamento));
        FHIRMedicationStatement.push(new medicationStatementSchema(MedicationStatement.encode(fullurl(FHIRPatient), fullurl(FHIRMedication), pm)));

    }
    return {FHIRMedicationStatement, FHIRMedication};
}

export async function ips(version, pacienteID) {
    try {
        const apiAndes = new ApiAndes();
        const snomedAlergias = await apiAndes.getSnomedAllergies(419199007); // código de alergia a sustancias
        const patient = await buscarPacienteIdAndes(pacienteID);
        if (patient) {
            // Recuperar datos de la historia clinica
            const FHIRCustodian = await buscarOrganizacionSisa(version, '0'); //Siempre enviaremos los recursos como de la Subsecretaría de salud
            const prestaciones = await getPrestaciones(patient, {});
            const semanticTags = ['trastorno', 'producto', 'fármaco de uso clínico', /*  'hallazgo'  , 'evento', 'situacion' */]; // [TODO] Revisar listado de semtags con el equipo
            const { registrosMedicos, prestacionMedicamentos, registrosAlergias } = filtrarRegistros(prestaciones, { semanticTags }, snomedAlergias);
            const vacunas: any = await getVacunas(patient);
            
            // Armar documento
            const FHIRDevice = Device.encode();
            const PatientSchema = getPatient(version);
            const FHIRPatient = new PatientSchema(Patient.encode(patient));
            const {FHIRMedicationStatement, FHIRMedication } = await prestMedicamentos(version, prestacionMedicamentos, FHIRPatient);
            const AllergyIntoleranceSchema = getAllergyIntolerance(version);
            const FHIRAllergyIntolerance = registrosAlergias.map((registro)=>{
                return new AllergyIntoleranceSchema(AllergyIntolerance.encode(fullurl(FHIRPatient), registro));
            });
            const FHIRImmunization = vacunas.map((vacuna) => {
                return Immunization.encode(fullurl(FHIRPatient), vacuna);
            });
            const FHIRCondition = registrosMedicos.map((registro) => {
                return Condition.encode(fullurl(FHIRPatient), registro);
            });
            const CompositionID = new ObjectID;
            const FHIRComposition = Composition.encode(CompositionID, fullurl(FHIRPatient), fullurl(FHIRCustodian), fullurl(FHIRDevice), FHIRMedicationStatement.map(fullurl), FHIRImmunization.map(fullurl),FHIRAllergyIntolerance.map(fullurl) ,FHIRCondition.map(fullurl));
            const BundleID = new ObjectID;
            const FHIRBundle = Bundle.encode(BundleID, [
                createResource(FHIRComposition),
                createResource(FHIRPatient),
                ...FHIRMedicationStatement.map(createResource),
                ...FHIRAllergyIntolerance.map(createResource),
                ...FHIRCondition.map(createResource),
                ...FHIRImmunization.map(createResource),
                createResource(FHIRMedication),
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

