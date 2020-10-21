import { Device, DocumentReference, Bundle } from '@andes/fhir';
import { buscarPacienteId } from './../../controller/patient/patient';
import { buscarOrganizacionSisa } from './../../controller/organization/organization';
import { createResource } from './../../utils/data.util';
import {ServerError}  from '@asymmetrik/node-fhir-server-core'; 
const { ObjectID } = require('mongodb').ObjectID;
const env = require('var');

export async function getDocumentReference(version, pacienteID) {
    try {
        const FHIRPatient = await buscarPacienteId(version, pacienteID);
        if (FHIRPatient) {
            //Este caso es muy puntual (los doc-ref salen del custodian subsecretaria de salud)... ver de generalizar.
            const FHIRCustodian = await buscarOrganizacionSisa(version, '0')
            const FHIRDevice = Device.encode();
            // const binaryURL = `${env.FHIR_SERVER}/${version}/Bundle/${pacienteID}`;
            const binaryURL = `/Bundle/${pacienteID}`;
            const documentReferenceID = new ObjectID;
            const docRefFHIR = DocumentReference.encode(documentReferenceID, FHIRDevice, FHIRCustodian, FHIRPatient, binaryURL);
            const BundleID = new ObjectID;
            const FHIRBundle = Bundle.encode(BundleID, [
                createResource(docRefFHIR)
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
        throw new ServerError(err, {
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
}