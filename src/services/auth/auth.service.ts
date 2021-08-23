const { Strategy } = require('passport-http-bearer');
import { searchToken } from './../../controller/auth/auth';
import { SaludDigitalClient } from './../../controller/ips/autenticacion';

// TODO GRAL revisar los handling de errores del core de Asymmetrik
export const strategy = new Strategy(async (token, done) => {
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
        const app: any = await searchToken(token);
        if (app) {
            // Lo buscamos a ver si todavía existe y está activo
            if (app.activo) {
                const user: any = {
                    name: app.nombre,
                    scope: 'patient/*.read'
                };
                return done(null, user, {});
            } else {
                return done(new Error('Token dado de baja'));
            }
        } else {
            // Validamos que sea un token del FEDERADOR NACIONAL
            const busClient = new SaludDigitalClient(process.env.FHIR_DOMAIN, process.env.IPS_HOST, process.env.IPS_SECRET);
            const data: any = await busClient.validarToken(token);
            if (data && data.valid) {
                const user: any = {
                    name: data.name,
                    scope: 'patient/*.read'
                }
                return done(null, user, {});
            } else {
                return done(new Error('Token no autorizado'))
            }
        }
    } catch (err) {
        return done(new Error('Error interno'));
    }
});
