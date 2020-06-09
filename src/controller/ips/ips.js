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
const env = require('var');
const { ObjectID } = require('mongodb').ObjectID;
function ips(version, pacienteID) {
    return __awaiter(this, void 0, void 0, function* () {
        const patient = yield patient_1.buscarPacienteIdAndes(pacienteID);
        if (patient) {
            // Recuperar datos de la historia clinica
            const organizacion = yield organization_1.buscarOrganizacionSisa(version, '0');
            const prestaciones = yield prestaciones_1.getPrestaciones(patient, {});
            const semanticTags = ['trastorno',]; // [TODO] Revisar listado de semtags
            const registros = prestaciones_1.filtrarRegistros(prestaciones, { semanticTags });
            const vacunas = yield vacunas_1.getVacunas(patient);
            // Armar documento
            const FHIRDevice = fhir_1.Device.encode();
            const FHIRPatient = fhir_1.Patient.encode(patient);
            const FHIRImmunization = vacunas.map((vacuna) => {
                return fhir_1.Immunization.encode(data_util_1.fullurl(FHIRPatient), vacuna);
            });
            const FHIRCustodian = fhir_1.Organization.encode(organizacion);
            const FHIRCondition = registros.map((registro) => {
                return fhir_1.Condition.encode(data_util_1.fullurl(FHIRPatient), registro);
            });
            const CompositionID = new ObjectID;
            const FHIRComposition = fhir_1.Composition.encode(CompositionID, data_util_1.fullurl(FHIRPatient), data_util_1.fullurl(FHIRCustodian), data_util_1.fullurl(FHIRDevice), FHIRImmunization.map(data_util_1.fullurl), FHIRCondition.map(data_util_1.fullurl));
            const BundleID = new ObjectID;
            const FHIRBundle = fhir_1.Bundle.encode(BundleID, [
                data_util_1.createResource(FHIRComposition),
                data_util_1.createResource(FHIRPatient),
                ...FHIRCondition.map(data_util_1.createResource),
                ...FHIRImmunization.map(data_util_1.createResource),
                data_util_1.createResource(FHIRDevice),
                data_util_1.createResource(FHIRCustodian)
            ]);
            return FHIRBundle;
        }
        return null;
    });
}
exports.ips = ips;
//# sourceMappingURL=ips.js.map