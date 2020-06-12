"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificar = void 0;
const jwt = require("jsonwebtoken");
const env = require('var');
function verificar(token) {
    const tokenData = jwt.verify(token, env.TOKEN_PASS);
    return tokenData ? tokenData : null;
}
exports.verificar = verificar;
//# sourceMappingURL=auth.js.map