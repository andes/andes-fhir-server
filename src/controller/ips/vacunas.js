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
exports.getVacunas = void 0;
const { COLLECTION, CLIENT_DB } = require('./../../constants');
const globals = require('../../globals');
function getVacunas(paciente) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = globals.get(CLIENT_DB);
        let collection = db.collection(`${COLLECTION.VACCINES}`);
        const conditions = {
            documento: paciente.documento
        };
        const sort = { fechaAplicacion: -1 };
        console.log('query: ', conditions);
        return yield collection.find(conditions).sort(sort).toArray();
    });
}
exports.getVacunas = getVacunas;
;
//# sourceMappingURL=vacunas.js.map