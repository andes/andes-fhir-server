require('dotenv').config();

import { initialize } from '@andes/fhir';
import * as FHIRServer from '@asymmetrik/node-fhir-server-core';
import './apm';
import { fhirServerConfig, mongoConfig } from './config';
import { CONSTANTS } from './constants';
import { mongoConnect } from './lib/mongo';

const asyncHandler = require('./lib/async-handler');
const globals = require('./globals');


const main = async function () {

    initialize({ dominio: process.env.IPS_DOMINIO });
    // Inicializa la base de datos mongo.
    const [mongoErr, client] = await asyncHandler(mongoConnect(mongoConfig.connection));
    if (mongoErr) {
        console.error(mongoErr.message);
        console.error(mongoConfig.connection);
        process.exit(1);
    }
    // Save the client in another module so I can use it in my services
    globals.set(CONSTANTS.CLIENT, client);
    globals.set(CONSTANTS.CLIENT_DB, client.db(mongoConfig.db_name));
    // inicializa el servidor Fhir
    let server = FHIRServer.initialize(fhirServerConfig);
    server.listen(
        fhirServerConfig.server.port,
        () => server.logger.verbose('Servidor Fhir online...')
    );
};

main();
