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
exports.ApiAndes = void 0;
const got = require('got');
class ApiAndes {
    constructor() {
        this.base = 'http://localhost:3002/api/core/term/snomed/'; // Por el momento hardcodeamos la api local
    }
    getSnomedByConceptId(conceptId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = `${this.base}concepts/${conceptId}`;
                const response = yield got(url).json();
                return response;
            }
            catch (err) {
                return err;
            }
        });
    }
    /**
     * Obtengo todos los hijos de algún concepto
     */
    getSnomedAllergies(conceptId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = `${this.base}concepts/${conceptId}/childs`;
                const response = yield got(url).json();
                return response;
            }
            catch (err) {
                return err;
            }
        });
    }
}
exports.ApiAndes = ApiAndes;
//# sourceMappingURL=apiAndesQuery.js.map