const { Strategy } = require('passport-http-bearer');
import * as core from '@asymmetrik/node-fhir-server-core';
import { verifyToken, searchToken } from './../../controller/auth/auth';

// TODO GRAL revisar los handling de errores del core de Asymmetrik
export const strategy = new Strategy(async (token, done) => {
    try {
        // Decodificamos el token con la clave privada
        const data = verifyToken(token);
        if (data) {
            // Lo buscamos a ver si todavía existe y está activo
            let t: any = await searchToken(data.app.id);
            if (t && t.activo) {
                // TODO revisar tema array permisos
                return done(null, {});
            } else {
                return done(new Error('Token dado de baja'));
            }
        } else {
            return done(new Error('Token no autorizado'))
        }
    } catch (err) {
        return done(new Error('Error interno'));
    }
});