import { Device, Bundle, Immunization, Condition, Composition, Patient, Organization, Medication, MedicationStatement } from '@andes/fhir';
import { buscarPacienteIdAndes } from './../../controller/patient/patient';
import { buscarOrganizacionSisa } from './../../controller/organization/organization';
import { createResource, fullurl } from './../../utils/data.util';
import { getPrestaciones, filtrarRegistros } from './../../controller/ips/prestaciones';
import { getVacunas } from './../../controller/ips/vacunas';

const { ObjectID } = require('mongodb').ObjectID;

export async function ips(version, pacienteID) {
    const patient = await buscarPacienteIdAndes(pacienteID);
    try {
        if (patient) {
            // Recuperar datos de la historia clinica
            const organizacion = await buscarOrganizacionSisa(version, '0'); //Siempre enviaremos los recursos como de la Subsecretaría de salud
            const prestaciones = await getPrestaciones(patient, {});
            const semanticTags = ['trastorno', 'producto', 'fármaco de uso clínico' /* 'hallazgo', 'evento', 'situacion' */]; // [TODO] Revisar listado de semtags con el equipo
            const { registrosMedicos, prestacionMedicamentos } = filtrarRegistros(prestaciones, { semanticTags });
            const vacunas: any = await getVacunas(patient);
            // Armar documento
            const FHIRDevice = Device.encode();
            const FHIRPatient = Patient.encode(patient);
            const FHIRMedication = prestacionMedicamentos.map((prestacionMedicamento) => {
                return Medication.encode(prestacionMedicamento);
            });
            // Prueba hasta definir bien que es el medicationStatement
            const FHIRMedicationStatement = prestacionMedicamentos.map((prestacionMedicamento) => {
                const medicationFhir = Medication.encode(prestacionMedicamento);
                return MedicationStatement.encode(fullurl(FHIRPatient), fullurl(medicationFhir), prestacionMedicamento);
            });
            const FHIRImmunization = vacunas.map((vacuna) => {
                return Immunization.encode(fullurl(FHIRPatient), vacuna);
            });
            const FHIRCustodian = Organization.encode(organizacion);
            const FHIRCondition = registrosMedicos.map((registro) => {
                return Condition.encode(fullurl(FHIRPatient), registro);
            });
            const CompositionID = new ObjectID;
            // TERMINAR CON AMBOS REGISTROS DE MEDICAMENTOS..............
            const FHIRComposition = Composition.encode(CompositionID, fullurl(FHIRPatient), fullurl(FHIRCustodian), fullurl(FHIRDevice), FHIRMedicationStatement.map(fullurl), FHIRImmunization.map(fullurl), FHIRCondition.map(fullurl));
            const BundleID = new ObjectID;
            const FHIRBundle = Bundle.encode(BundleID, [
                createResource(FHIRComposition),
                createResource(FHIRPatient),
                ...FHIRMedicationStatement.map(createResource),
                ...FHIRMedication.map(createResource),
                ...FHIRCondition.map(createResource),
                ...FHIRImmunization.map(createResource),
                createResource(FHIRDevice),
                createResource(FHIRCustodian)
            ]);
            return FHIRBundle;

        }
        return null;
    } catch (err) {
        return err
    }
}

