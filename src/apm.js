"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APMIsActive = exports.APM = void 0;
exports.APMIsActive = process.env.APM_SERVER && process.env.APM_APP_NAME;
if (exports.APMIsActive) {
    exports.APM = require('elastic-apm-node').start({
        serviceName: process.env.APM_APP_NAME,
        serverUrl: process.env.APM_SERVER,
    });
}
//# sourceMappingURL=apm.js.map