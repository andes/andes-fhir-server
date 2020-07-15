const { Strategy } = require('passport-http-bearer');
import { verifyToken, searchToken } from './../../controller/auth/auth';
import { SaludDigitalClient } from './../../controller/ips/autenticacion';
const env = require('var');

// TODO GRAL revisar los handling de errores del core de Asymmetrik
export const strategy = new Strategy(async (token, done) => {
    try {
        // En esta sección se analiza el token para saber si la consulta viene del federador o de un cliente
        // de ANDES con un token app para poder consultar determinados recursos.
        // ***********************************************************************************************//

        // Decodificamos el token con la clave privada, para ver si es un cliente de ANDES
        const data = verifyToken(token);
        if (data) {
            // Lo buscamos a ver si todavía existe y está activo
            let t: any = await searchToken(data.app.id);
            if (t && t.activo) {
                let user: any = {
                    name: t.nombre,
                    scope: t.permisos
                };
                return done(null, user, { scope: t });
            } else {
                return done(new Error('Token dado de baja'));
            }
        } else {
            // Validamos que sea un token del FEDERADOR NACIONAL
            let busClient = new SaludDigitalClient(env.FHIR_DOMAIN, env.IPS_HOST, env.IPS_SECRET);
            const data: any = await busClient.validarToken(token);
            if (data && data.valid) {
                // Por el momento dejamos el scope hardcodeado: Que la organización (en este caso nación) puede leer todos los recursos fhir
                let user: any = {
                    name: data.name,
                    scope: 'organization/*.read'
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
