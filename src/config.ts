const { VERSIONS } = require('@asymmetrik/node-fhir-server-core').constants;

/**
 * @name mongoConfig
 * @summary Configurations for our Mongo instance
 */
export const mongoConfig = {
    connection: process.env.MONGO_HOSTNAME,
    db_name: process.env.MONGO_DB_NAME,
    options: {
        auto_reconnect: true,
        useUnifiedTopology: true
    }
};

// Set up whitelist
let whitelist_env = process.env.WHITELIST && process.env.WHITELIST.split(',').map(host => host.trim()) || false;

// If no whitelist is present, disable cors
// If it's length is 1, set it to a string, so * works
// If there are multiple, keep them as an array
let whitelist = whitelist_env && whitelist_env.length === 1
    ? whitelist_env[0]
    : whitelist_env;

const AUTH = process.env.SERVER_AUTH === 'true';

/**
 * @name fhirServerConfig
 * @summary @asymmetrik/node-fhir-server-core configurations.
 */
export const fhirServerConfig = {
    auth: AUTH ? {
        // En este caso estoy poniendo esto para que me lea el scope automáticamente.
        // type: 'smart',
        // resourceServer: 'http://localhost:3000',
        strategy: {
            name: 'bearer',
            service: './src/services/auth/auth.service.js'
        }
    } : undefined,
    server: {
        // support various ENV that uses PORT vs SERVER_PORT
        port: process.env.PORT || 3000,
        // allow Access-Control-Allow-Origin
        corsOptions: {
            maxAge: 86400,
            origin: whitelist
        }
    },
    logging: {
        level: process.env.LOGGING_LEVEL
    },
    // security: [
    // 	{
    // 		url: 'authorize',
    // 		valueUri: `${env.AUTH_SERVER_URI}/authorize`
    // 	},
    // 	{
    // 		url: 'token',
    // 		valueUri: `${env.AUTH_SERVER_URI}/token`
    // 	}
    // ],
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
        },
        basic: {
            service: './src/services/basic/speciality.service.js',
            versions: [VERSIONS['4_0_0']]
        },
    }
};
