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
exports.strategy = void 0;
const { Strategy } = require('passport-http-bearer');
const auth_1 = require("./../../controller/auth/auth");
const autenticacion_1 = require("./../../controller/ips/autenticacion");
// TODO GRAL revisar los handling de errores del core de Asymmetrik
exports.strategy = new Strategy((token, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // En esta sección se analiza el token para saber si la consulta viene del federador o de un cliente
        // de ANDES con un token app para poder consultar determinados recursos.
        // ***********************************************************************************************//
        if (process.env.SERVER_AUTH !== 'true') {
            return done(null, {
                name: 'TEST',
                scope: 'patient/*.read'
            }, {});
        }
        // Decodificamos el token con la clave privada, para ver si es un cliente de ANDES 
        const app = yield auth_1.searchToken(token);
        if (app) {
            // Lo buscamos a ver si todavía existe y está activo
            if (app.activo) {
                const user = {
                    name: app.nombre,
                    scope: 'patient/*.read'
                };
                return done(null, user, {});
            }
            else {
                return done(new Error('Token dado de baja'));
            }
        }
        else {
            // Validamos que sea un token del FEDERADOR NACIONAL
            const busClient = new autenticacion_1.SaludDigitalClient(process.env.FHIR_DOMAIN, process.env.IPS_HOST, process.env.IPS_SECRET);
            const data = yield busClient.validarToken(token);
            if (data && data.valid) {
                const user = {
                    name: data.name,
                    scope: 'patient/*.read'
                };
                return done(null, user, {});
            }
            else {
                return done(new Error('Token no autorizado'));
            }
        }
    }
    catch (err) {
        return done(new Error('Error interno'));
    }
}));
//# sourceMappingURL=auth.service.js.map