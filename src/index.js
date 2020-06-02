"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const FHIRServer = require("@asymmetrik/node-fhir-server-core");
const mongo_1 = require("./lib/mongo");
const asyncHandler = require('./lib/async-handler');
const Config = require('./config');
const globals = require('./globals');
const { CLIENT, CLIENT_DB } = require('./constants');
let main = function () {
    return __awaiter(this, void 0, void 0, function* () {
        // Inicializa la base de datos mongo.
        let [mongoErr, client] = yield asyncHandler(mongo_1.mongoConnect(Config.mongoConfig.connection));
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
    });
};
main();
//# sourceMappingURL=index.js.map