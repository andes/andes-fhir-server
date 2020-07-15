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
const env = require('var');
// TODO GRAL revisar los handling de errores del core de Asymmetrik
exports.strategy = new Strategy((token, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // En esta sección se analiza el token para saber si la consulta viene del federador o de un cliente
        // de ANDES con un token app para poder consultar determinados recursos.
        // ***********************************************************************************************//
        // Decodificamos el token con la clave privada, para ver si es un cliente de ANDES
        const data = auth_1.verifyToken(token);
        if (data) {
            // Lo buscamos a ver si todavía existe y está activo
            let t = yield auth_1.searchToken(data.app.id);
            if (t && t.activo) {
                let user = {
                    name: t.nombre,
                    scope: t.permisos
                };
                return done(null, user, { scope: t });
            }
            else {
                return done(new Error('Token dado de baja'));
            }
        }
        else {
            // Validamos que sea un token del FEDERADOR NACIONAL
            let busClient = new autenticacion_1.SaludDigitalClient(env.FHIR_DOMAIN, env.IPS_HOST, env.IPS_SECRET);
            const data = yield busClient.validarToken(token);
            if (data && data.valid) {
                // Por el momento dejamos el scope hardcodeado: Que la organización (en este caso nación) puede leer todos los recursos fhir
                let user = {
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