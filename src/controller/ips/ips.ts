import { Device, Bundle, Immunization, Condition, Composition, Patient } from '@andes/fhir';
import { buscarPacienteIdAndes } from './../../controller/patient/patient';
import { buscarOrganizacionSisa } from './../../controller/organization/organization';
import { createResource, fullurl } from './../../utils/data.util';
import { getPrestaciones, filtrarRegistros } from './../../controller/ips/prestaciones';
import { getVacunas } from './../../controller/ips/vacunas';

const { ObjectID } = require('mongodb').ObjectID;
const env = require('var');

export async function ips(version, id) {
    const patient = await buscarPacienteIdAndes(id);
    if (patient) {
        // Recuperar datos de la historia clinica
        const FHIRCustodian = await buscarOrganizacionSisa(version, '0');
        const prestaciones = await getPrestaciones(patient, {});
        const semanticTags = ['trastorno', /* 'hallazgo', 'evento', 'situacion' */]; // [TODO] Revisar listado de semtags
        const registros: any = filtrarRegistros(prestaciones, { semanticTags });
        const vacunas: any = await getVacunas(patient);
        // Armar documento
        const FHIRDevice = Device.encode(); // [TODO] ver que hacer
        const FHIRPatient = Patient.encode(patient);
        const FHIRImmunization = vacunas.map((vacuna) => {
            return Immunization.encode(fullurl(FHIRPatient), vacuna);
        });
        const FHIRCondition = registros.map((registro) => {
            return Condition.encode(fullurl(FHIRPatient), registro);
        });
        const CompositionID = new ObjectID;
        const FHIRComposition = Composition.encode(CompositionID, fullurl(FHIRPatient), fullurl(FHIRCustodian), fullurl(FHIRDevice), FHIRImmunization.map(fullurl), FHIRCondition.map(fullurl));
        const BundleID = new ObjectID;
        const FHIRBundle = Bundle.encode(BundleID, [
            createResource(FHIRComposition),
            createResource(FHIRPatient),
            ...FHIRCondition.map(createResource),
            ...FHIRImmunization.map(createResource),
            createResource(FHIRDevice),
            createResource(FHIRCustodian)
        ]);
        return FHIRBundle;

    }
    return null;
}