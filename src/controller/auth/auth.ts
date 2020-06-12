import * as jwt from 'jsonwebtoken';
const env = require('var');

export function verificar(token) {
    const tokenData = jwt.verify(token, env.TOKEN_PASS);
    return tokenData ? tokenData : null;
}