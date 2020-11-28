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
const env = require('var');
class ApiAndes {
    constructor() {
        this.base = 'https://demo.andes.gob.ar/api'; // localhost:3002/api
        this.baseSnomed = '/core/term/snomed/'; // Por el momento hardcodeamos la api local
        this.basePatient = '/core/mpi/pacientes'; // Por el momento hardcodeamos la api local
    }
    getSnomedByConceptId(conceptId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = `${this.base}${this.baseSnomed}concepts/${conceptId}`;
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
                const url = `${this.base}${this.baseSnomed}concepts/${conceptId}/childs`;
                const response = yield got(url).json();
                return response;
            }
            catch (err) {
                return err;
            }
        });
    }
    /**
     * Patient section: Search by id, match, post, put
     */
    getPatient(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = `${this.base}${this.basePatient}/${id}`;
                const gotCustomizado = got.extend({
                    hooks: {
                        beforeError: [
                            // handler del error
                            error => {
                                const { response } = error;
                                if (response && response.body) {
                                    error.name = 'ANDES API';
                                    error.message = response.body.message;
                                    error.statusCode = response.statusCode;
                                }
                                return error;
                            }
                        ]
                    },
                    responseType: 'json',
                    headers: {
                        'Authorization': `jwt ${env.JWTDemo}`
                    }
                });
                const data = (() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const response = yield gotCustomizado(url);
                        return response.body;
                    }
                    catch (err) {
                        throw err = { message: err.message, system: err.name, code: err.statusCode }; // Este objeto debería estar estandarizado en todos los llamados a ANDES
                    }
                }))();
                return data;
            }
            catch (err) {
                throw err;
            }
        });
    }
}
exports.ApiAndes = ApiAndes;
//# sourceMappingURL=apiAndesQuery.js.map