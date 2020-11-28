"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fhirError = void 0;
const node_fhir_server_core_1 = require("@asymmetrik/node-fhir-server-core");
exports.fhirError = function (message, severity, code, diagnostics) {
    throw new node_fhir_server_core_1.ServerError(message, {
        resourceType: "OperationOutcome",
        issue: [
            {
                severity,
                code,
                diagnostics
            }
        ]
    });
};
//# sourceMappingURL=errorHandler.js.map