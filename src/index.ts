import * as FHIRServer from '@asymmetrik/node-fhir-server-core';
import { mongoConnect } from './lib/mongo';
const asyncHandler = require('./lib/async-handler');
const Config = require('./config');
const globals = require('./globals');

const {
    CLIENT,
    CLIENT_DB
} = require('./constants');

let main = async function () {

    // Inicializa la base de datos mongo.
    let [mongoErr, client] = await asyncHandler(mongoConnect(Config.mongoConfig.connection));
    if (mongoErr) {
        console.error(mongoErr.message);
        console.error(Config.mongoConfig.connection);
        process.exit(1);
    }
    // Save the client in another module so I can use it in my services
    globals.set(CLIENT, client);
    globals.set(CLIENT_DB, client.db(Config.mongoConfig.db_name));
    // inicializa el servidor Fhir
    let server = FHIRServer.initialize(Config.fhirServerConfig);
    server.listen(Config.fhirServerConfig.server.port, () => server.logger.verbose('Servidor Fhir online...'));
};

main();
