const { Strategy, authentication } = require('passport-http-bearer');
import { verificar } from './../../controller/auth/auth';

// Validación muy sencilla, voy directo a buscar el token en ANDES, si existe lo dejo pasar
export const strategy = new Strategy(async (token, done) => {
    try {
        const data = verificar(token);
        if (data) {
            // TODO revisar tema array permisos
            return done(null, {}) // Todo ok
        } else {
            return done(new Error('Token no autorizado'))
        }
    } catch (err) {
        return done(new Error('Error interno'));
    }
});