const { Strategy, authentication } = require('passport-http-bearer');
import { buscarToken } from './../../controller/auth/auth';

// Validación muy sencilla, voy directo a buscar el token en ANDES, si existe lo dejo pasar
export const strategy = new Strategy(async (token, done) => {
    try {
        const resultado = await buscarToken(token);
        if (resultado) {
            return done(null, {}) // Todo ok
        } else {
            return done(new Error('Token no autorizado'))
        }
    } catch (err) {
        return done(new Error('Error interno'));
    }
});