import { Bundle, Device, DocumentReference } from '@andes/fhir';
import * as JSONSchemaValidator from '@bluehalo/fhir-json-schema-validator';
import { resolveSchema, ServerError } from '@bluehalo/node-fhir-server-core';
import { buscarOrganizacionSisa } from '../../controller/organization/organization';
import { buscarPacienteId } from '../../controller/patient/patient';
import { createResource } from '../../utils/data.util';
import { ObjectId } from 'mongodb';

const getDocReference = (base_version) => {
    return resolveSchema(base_version, 'documentreference');
};
const getBundle = (base_version) => {
    return resolveSchema(base_version, 'bundle');
};

const getDevice = (base_version) => {
    return resolveSchema(base_version, 'device');
};

function validateResource(resource) {
    const validator = new JSONSchemaValidator();
    const errors = validator.validate(resource);
    if (errors && errors.length > 0) {
        throw errors;
    } else {
        return true;
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
            const binaryURL = `Bundle/${pacienteID}`;
            const documentReferenceID = new ObjectId();
            const docRefFHIR = new DocumentReferenceSchema(DocumentReference.encode(documentReferenceID, FHIRDevice, FHIRCustodian, FHIRPatient, binaryURL));
            // validateResource(docRefFHIR);
            const BundleID = new ObjectId();
            const FHIRBundle = new BundleSchema(
                Bundle.encode(BundleID, [
                    createResource(docRefFHIR)
                ])
            );
            // validateResource(FHIRBundle);
            return FHIRBundle;
        } else {
            const message = 'patient not found';
            throw new ServerError(
                message,
                {
                    resourceType: 'OperationOutcome',
                    issue: [
                        {
                            severity: 'error',
                            code: 404,
                            diagnostics: message
                        }
                    ]
                }
            );
        }
    } catch (err) {
        throw new ServerError(
            err,
            {
                resourceType: 'OperationOutcome',
                issue: [
                    {
                        severity: 'error',
                        code: 404,
                        diagnostics: err
                    }
                ]
            }
        );
    }
}
