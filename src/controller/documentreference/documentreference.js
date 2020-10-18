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
exports.getDocumentReference = void 0;
const fhir_1 = require("@andes/fhir");
const patient_1 = require("./../../controller/patient/patient");
const organization_1 = require("./../../controller/organization/organization");
const data_util_1 = require("./../../utils/data.util");
const node_fhir_server_core_1 = require("@asymmetrik/node-fhir-server-core");
const { ObjectID } = require('mongodb').ObjectID;
const env = require('var');
function getDocumentReference(version, pacienteID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const FHIRPatient = yield patient_1.buscarPacienteId(version, pacienteID);
            if (FHIRPatient) {
                //Este caso es muy puntual (los doc-ref salen del custodian subsecretaria de salud)... ver de generalizar.
                const FHIRCustodian = yield organization_1.buscarOrganizacionSisa(version, '0');
                const FHIRDevice = fhir_1.Device.encode();
                const binaryURL = `${env.FHIR_SERVER}/${version}/Bundle/${pacienteID}`;
                const documentReferenceID = new ObjectID;
                const docRefFHIR = fhir_1.DocumentReference.encode(documentReferenceID, FHIRDevice, FHIRCustodian, FHIRPatient, binaryURL);
                const BundleID = new ObjectID;
                const FHIRBundle = fhir_1.Bundle.encode(BundleID, [
                    data_util_1.createResource(docRefFHIR)
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
            throw new node_fhir_server_core_1.ServerError(err, {
                resourceType: "OperationOutcome",
                issue: [
                    {
                        severity: 'error',
                        code: 404,
                        diagnostics: err
                    }
                ]
            });
        }
    });
}
exports.getDocumentReference = getDocumentReference;
//# sourceMappingURL=documentreference.js.map