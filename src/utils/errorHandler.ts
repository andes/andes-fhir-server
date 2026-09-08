import { ServerError } from '@bluehalo/node-fhir-server-core';

export const fhirError = function (message, severity, code, diagnostics) {
    throw new ServerError(
        message,
        {
            resourceType: 'OperationOutcome',
            issue: [
                {
                    severity,
                    code,
                    diagnostics
                }
            ]
        }
    );
};
