"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fhirServerConfig = exports.mongoConfig = void 0;
const { VERSIONS } = require('@asymmetrik/node-fhir-server-core').constants;
const env = require('var');
/**
 * @name mongoConfig
 * @summary Configurations for our Mongo instance
 */
exports.mongoConfig = {
    connection: env.MONGO_HOSTNAME,
    db_name: env.MONGO_DB_NAME,
    options: {
        auto_reconnect: true,
        useUnifiedTopology: true
    }
};
// Set up whitelist
let whitelist_env = env.WHITELIST && env.WHITELIST.split(',').map(host => host.trim()) || false;
// If no whitelist is present, disable cors
// If it's length is 1, set it to a string, so * works
// If there are multiple, keep them as an array
let whitelist = whitelist_env && whitelist_env.length === 1
    ? whitelist_env[0]
    : whitelist_env;
/**
 * @name fhirServerConfig
 * @summary @asymmetrik/node-fhir-server-core configurations.
 */
exports.fhirServerConfig = {
    auth: {
        // En este caso estoy poniendo esto para que me lea el scope automáticamente.
        type: 'smart',
        // This servers URI
        resourceServer: env.RESOURCE_SERVER
        // strategy: {
        // 	name: 'bearer',
        // 	// Queda para implementar a futuro
        // 	// service: './src/strategies/bearer.strategy.js'
        // 	// Vamos con estrategia propia :-)
        // 	service: './src/services/auth/auth.service.js'
        // }
    },
    server: {
        // support various ENV that uses PORT vs SERVER_PORT
        port: env.PORT || env.SERVER_PORT,
        // allow Access-Control-Allow-Origin
        corsOptions: {
            maxAge: 86400,
            origin: whitelist
        }
    },
    logging: {
        level: env.LOGGING_LEVEL
    },
    security: [
        {
            url: 'authorize',
            valueUri: `${env.AUTH_SERVER_URI}/authorize`
        },
        {
            url: 'token',
            valueUri: `${env.AUTH_SERVER_URI}/token`
        }
    ],
    profiles: {
        patient: {
            service: './src/services/patient/patient.service.js',
            versions: [VERSIONS['4_0_0']]
        },
        practitioner: {
            service: './src/services/practitioner/practitioner.service.js',
            versions: [VERSIONS['4_0_0']]
        },
        organization: {
            service: './src/services/organization/organization.service.js',
            versions: [VERSIONS['4_0_0']]
        },
        documentReference: {
            service: './src/services/documentreference/documentreference.service.js',
            versions: [VERSIONS['4_0_0']]
        },
        bundle: {
            service: './src/services/bundle/bundle.service.js',
            versions: [VERSIONS['4_0_0']]
        }
    }
};
//# sourceMappingURL=config.js.map