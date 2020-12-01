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
exports.searchToken = exports.verifyToken = void 0;
const jwt = require("jsonwebtoken");
const uid_util_1 = require("./../../utils/uid.util");
const env = require('var');
const constants_1 = require("./../../constants");
const globals = require('../../globals');
function verifyToken(token) {
    try {
        return jwt.verify(token, env.TOKEN_PASS);
    }
    catch (err) {
        return null;
    }
}
exports.verifyToken = verifyToken;
function searchToken(id) {
    return __awaiter(this, void 0, void 0, function* () {
        let db = globals.get(constants_1.CONSTANTS.CLIENT_DB);
        let collection = db.collection(`${constants_1.CONSTANTS.COLLECTION.AUTHAPPS}`);
        let registroDelToken = yield collection.findOne({ _id: uid_util_1.setObjectId(id) });
        return registroDelToken;
    });
}
exports.searchToken = searchToken;
//# sourceMappingURL=auth.js.map