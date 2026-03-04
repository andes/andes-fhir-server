import path from 'path';
const { VERSIONS } = require('@asymmetrik/node-fhir-server-core').constants;

export const mongoConfig = {
    connection: process.env.MONGO_HOSTNAME,
    db_name: process.env.MONGO_DB_NAME,
    options: {
        auto_reconnect: true,
        useUnifiedTopology: true
    }
};

const whitelist_env = process.env.WHITELIST && process.env.WHITELIST.split(',').map(host => host.trim()) || false;

const whitelist = whitelist_env && whitelist_env.length === 1
    ? whitelist_env[0]
    : whitelist_env;

const AUTH = process.env.SERVER_AUTH === 'true';

const servicesBase = path.join(__dirname, 'services');

export const fhirServerConfig = {
    auth: AUTH ? {
        strategy: {
            name: 'bearer',
            service: path.join(servicesBase, 'auth', 'auth.service.js')
        }
    } : undefined,
    server: {
        port: process.env.PORT || 3000,
        corsOptions: {
            maxAge: 86400,
            origin: whitelist
        }
    },
    logging: {
        level: process.env.LOGGING_LEVEL
    },
    profiles: {
        patient: {
            service: path.join(servicesBase, 'patient', 'patient.service.js'),
            versions: [VERSIONS['4_0_0'], VERSIONS['4_0_1']]
        },
        practitioner: {
            service: path.join(servicesBase, 'practitioner', 'practitioner.service.js'),
            versions: [VERSIONS['4_0_0']]
        },
        organization: {
            service: path.join(servicesBase, 'organization', 'organization.service.js'),
            versions: [VERSIONS['4_0_0']]
        },
        documentReference: {
            service: path.join(servicesBase, 'documentreference', 'documentreference.service.js'),
            versions: [VERSIONS['4_0_0']]
        },
        bundle: {
            service: path.join(servicesBase, 'bundle', 'bundle.service.js'),
            versions: [VERSIONS['4_0_0']]
        },
        basic: {
            service: path.join(servicesBase, 'basic', 'speciality.service.js'),
            versions: [VERSIONS['4_0_0']]
        }
    }
};
