import { Bundle, Device, DocumentReference, Organization as fhirOrganization } from '../../encoders';
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

const getOrganizationSchema = (base_version) => {
    return resolveSchema(base_version, 'organization');
};

export async function getDocumentReference(version, pacienteID) {
    try {
        const FHIRPatient = await buscarPacienteId(version, pacienteID);
        if (FHIRPatient) {
            const DocumentReferenceSchema = getDocReference(version);
            const BundleSchema = getBundle(version);
            const DeviceSchema = getDevice(version);
            let FHIRCustodian = await buscarOrganizacionSisa(version, '0');
            if (!FHIRCustodian || FHIRCustodian instanceof Error) {
                const OrganizationSchema = getOrganizationSchema(version);
                FHIRCustodian = new OrganizationSchema(fhirOrganization.encode({
                    _id: '0',
                    id: '0',
                    nombre: 'Subsecretaría de Salud de la Provincia del Neuquén',
                    activo: true,
                    codigo: { sisa: '0' }
                }));
            }
            const FHIRDevice = new DeviceSchema(Device.encode());
            const binaryURL = `Bundle/${pacienteID}`;
            const documentReferenceID = new ObjectId();
            const docRefFHIR = new DocumentReferenceSchema(DocumentReference.encode(documentReferenceID, FHIRDevice, FHIRCustodian, FHIRPatient, binaryURL));
            const BundleID = new ObjectId();
            const FHIRBundle = new BundleSchema(
                Bundle.encode(BundleID, [
                    createResource(docRefFHIR)
                ])
            );
            return FHIRBundle;
        } else {
            const message = 'patient not found';
            throw new ServerError(
                message,
                {
                    statusCode: 404,
                    resourceType: 'OperationOutcome',
                    issue: [
                        {
                            severity: 'error',
                            code: 'not-found',
                            diagnostics: message
                        }
                    ]
                }
            );
        }
    } catch (err: any) {
        if (err instanceof ServerError) {
            throw err;
        }
        throw new ServerError(
            err?.message || String(err),
            {
                resourceType: 'OperationOutcome',
                issue: [
                    {
                        severity: 'error',
                        code: 'exception',
                        diagnostics: err?.message || String(err)
                    }
                ]
            }
        );
    }
}
