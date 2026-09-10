import { ServerError } from '@bluehalo/node-fhir-server-core';
import { buscarPacienteId } from '../../controller/patient/patient';
import IpsService from '../../services/ips/ips.service';

/**
 * @deprecated Utilizar IpsService.build o PatientService.summary directamente.
 */
export async function ips(version: string, pacienteID: string) {
    const patient = await buscarPacienteId(version, pacienteID);
    if (!patient) {
        const message = 'patient not found';
        throw new ServerError(message, {
            statusCode: 404,
            resourceType: 'OperationOutcome',
            issue: [
                {
                    severity: 'error',
                    code: 'not-found',
                    diagnostics: message
                }
            ]
        });
    }
    return await IpsService.build(version, patient);
}
