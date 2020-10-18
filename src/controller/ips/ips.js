"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ips = void 0;
const fhir_1 = require("@andes/fhir");
const patient_1 = require("./../../controller/patient/patient");
const organization_1 = require("./../../controller/organization/organization");
const data_util_1 = require("./../../utils/data.util");
const prestaciones_1 = require("./../../controller/ips/prestaciones");
const vacunas_1 = require("./../../controller/ips/vacunas");
const apiAndesQuery_1 = require("./../../utils/apiAndesQuery");
const node_fhir_server_core_1 = require("@asymmetrik/node-fhir-server-core");
const { ObjectID } = require('mongodb').ObjectID;
function prestMedicamentos(prestacionMedicamentos, FHIRPatient) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiAndes = new apiAndesQuery_1.ApiAndes();
        let FHIRMedication;
        let FHIRMedicationStatement = [];
        for (const pm of prestacionMedicamentos) {
            const medicamento = yield apiAndes.getSnomedByConceptId(pm.concepto.conceptId);
            FHIRMedication = fhir_1.Medication.encode(medicamento);
            FHIRMedicationStatement.push(fhir_1.MedicationStatement.encode(data_util_1.fullurl(FHIRPatient), data_util_1.fullurl(FHIRMedication), pm));
        }
        return { FHIRMedicationStatement, FHIRMedication };
    });
}
function ips(version, pacienteID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const apiAndes = new apiAndesQuery_1.ApiAndes();
            const snomedAlergias = yield apiAndes.getSnomedAllergies(419199007); // código de alergia a sustancias
            const patient = yield patient_1.buscarPacienteIdAndes(pacienteID);
            if (patient) {
                // Recuperar datos de la historia clinica
                const organizacion = yield organization_1.buscarOrganizacionSisa(version, '0'); //Siempre enviaremos los recursos como de la Subsecretaría de salud
                const prestaciones = yield prestaciones_1.getPrestaciones(patient, {});
                const semanticTags = ['trastorno', 'producto', 'fármaco de uso clínico',]; // [TODO] Revisar listado de semtags con el equipo
                const { registrosMedicos, prestacionMedicamentos, registrosAlergias } = prestaciones_1.filtrarRegistros(prestaciones, { semanticTags }, snomedAlergias);
                const vacunas = yield vacunas_1.getVacunas(patient);
                // Armar documento
                const FHIRDevice = fhir_1.Device.encode();
                const FHIRPatient = fhir_1.Patient.encode(patient);
                const { FHIRMedicationStatement, FHIRMedication } = yield prestMedicamentos(prestacionMedicamentos, FHIRPatient);
                const FHIRAllergyIntolerance = registrosAlergias.map((registro) => {
                    return fhir_1.AllergyIntolerance.encode(data_util_1.fullurl(FHIRPatient), registro);
                });
                const FHIRImmunization = vacunas.map((vacuna) => {
                    return fhir_1.Immunization.encode(data_util_1.fullurl(FHIRPatient), vacuna);
                });
                const FHIRCustodian = fhir_1.Organization.encode(organizacion);
                const FHIRCondition = registrosMedicos.map((registro) => {
                    return fhir_1.Condition.encode(data_util_1.fullurl(FHIRPatient), registro);
                });
                const CompositionID = new ObjectID;
                // TERMINAR CON AMBOS REGISTROS DE MEDICAMENTOS..............
                const FHIRComposition = fhir_1.Composition.encode(CompositionID, data_util_1.fullurl(FHIRPatient), data_util_1.fullurl(FHIRCustodian), data_util_1.fullurl(FHIRDevice), FHIRMedicationStatement.map(data_util_1.fullurl), FHIRImmunization.map(data_util_1.fullurl), FHIRAllergyIntolerance.map(data_util_1.fullurl), FHIRCondition.map(data_util_1.fullurl));
                const BundleID = new ObjectID;
                const FHIRBundle = fhir_1.Bundle.encode(BundleID, [
                    data_util_1.createResource(FHIRComposition),
                    data_util_1.createResource(FHIRPatient),
                    ...FHIRMedicationStatement.map(data_util_1.createResource),
                    ...FHIRAllergyIntolerance.map(data_util_1.createResource),
                    ...FHIRCondition.map(data_util_1.createResource),
                    ...FHIRImmunization.map(data_util_1.createResource),
                    data_util_1.createResource(FHIRMedication),
                    data_util_1.createResource(FHIRDevice),
                    data_util_1.createResource(FHIRCustodian)
                ]);
                return FHIRBundle;
            }
            else {
                const message = 'patient not found';
                throw new node_fhir_server_core_1.ServerError(message, {
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
        }
        catch (err) {
            const message = err;
            throw new node_fhir_server_core_1.ServerError(message, {
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
    });
}
exports.ips = ips;
//# sourceMappingURL=ips.js.map