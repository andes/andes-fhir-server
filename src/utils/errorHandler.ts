import { ServerError } from '@asymmetrik/node-fhir-server-core';

export const fhirError = function (message, severity, code, diagnostics) {
    throw new ServerError(
        message,
        {
            resourceType: "OperationOutcome",
            issue: [
                {
                    severity,
                    code,
                    diagnostics
                }
            ]
        }
    );
}
