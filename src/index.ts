import * as FHIRServer from '@asymmetrik/node-fhir-server-core';
import { mongoConnect } from './lib/mongo';
import { fhirServerConfig, mongoConfig } from './config';
import { CONSTANTS } from './constants';

const asyncHandler = require('./lib/async-handler');
const globals = require('./globals');


let main = async function () {

    // Inicializa la base de datos mongo.
    let [mongoErr, client] = await asyncHandler(mongoConnect(mongoConfig.connection));
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
    server.listen(fhirServerConfig.server.port, () => server.logger.verbose('Servidor Fhir online...'));
};

main();
