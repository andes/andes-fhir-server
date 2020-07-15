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
const patient_1 = require("./../../controller/patient/patient");
const permissions_1 = require("./../../lib/permissions");
const p = permissions_1.Permissions;
module.exports = {
    search: (args, context) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let { base_version } = args;
            return yield patient_1.buscarPaciente(base_version, args);
        }
        catch (err) {
            return err;
        }
    }),
    searchById: (args, context) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let { base_version, id } = args;
            return yield patient_1.buscarPacienteId(base_version, id);
        }
        catch (err) {
            return err;
        }
    })
};
//# sourceMappingURL=patient.service.js.map