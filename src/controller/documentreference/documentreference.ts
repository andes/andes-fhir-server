import { Device, DocumentReference, Bundle } from '@andes/fhir';
import { buscarPacienteId } from './../../controller/patient/patient';
import { buscarOrganizacionSisa } from './../../controller/organization/organization';
import { createResource } from './../../utils/data.util';
import { ServerError, resolveSchema }  from '@asymmetrik/node-fhir-server-core'; 
import * as JSONSchemaValidator from '@asymmetrik/fhir-json-schema-validator';
const { ObjectID } = require('mongodb').ObjectID;
const env = require('var');

let getDocReference = (base_version) => {
    return resolveSchema(base_version, 'documentreference');
};
let getBundle = (base_version) => {
    return resolveSchema(base_version, 'bundle')    
};

let getDevice = (base_version) => {
    return resolveSchema(base_version, 'device');
}

function validateResource(resource) {
    let validator = new JSONSchemaValidator();
    let errors = validator.validate(resource);
    if (errors && errors.length > 0) {
        throw errors;
    } else {
        return true
    }
}

export async function getDocumentReference(version, pacienteID) {
    try {
        const FHIRPatient = await buscarPacienteId(version, pacienteID);
        if (FHIRPatient) {
            const DocumentReferenceSchema = getDocReference(version);
            const BundleSchema = getBundle(version);
            const DeviceSchema = getDevice(version);
            const FHIRCustodian = await buscarOrganizacionSisa(version, '0');
            // validateResource(FHIRCustodian);
            const FHIRDevice = new DeviceSchema(Device.encode());
            // validateResource(FHIRDevice);
            const binaryURL = `${env.FHIR_SERVER}/${version}/Bundle/${pacienteID}`;
            const documentReferenceID = new ObjectID;
            const docRefFHIR = new DocumentReferenceSchema(DocumentReference.encode(documentReferenceID, FHIRDevice, FHIRCustodian, FHIRPatient, binaryURL));
            // validateResource(docRefFHIR);
            const BundleID = new ObjectID;
            const FHIRBundle = new BundleSchema(Bundle.encode(BundleID, [
                createResource(docRefFHIR)
            ]));
            // validateResource(FHIRBundle);
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