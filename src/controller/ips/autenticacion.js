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
exports.SaludDigitalClient = void 0;
const jwt = require("jsonwebtoken");
const requestHandler_1 = require("../../lib/requestHandler");
class SaludDigitalClient {
    constructor(dominio, host, secret) {
        this.expiresIn = 60 * 15 * 1000; /* 15 min */
        this.dominio = dominio;
        this.host = host;
        this.secret = secret;
    }
    getDominio() {
        return this.dominio;
    }
    generacionTokenAut({ name, role, ident, sub }) {
        const payload = {
            // jti: 'qwertyuiopasdfghjklzxcvbnm123457',
            name,
            role,
            ident,
            sub
        };
        return jwt.sign(payload, this.secret, {
            expiresIn: this.expiresIn,
            issuer: this.dominio,
            audience: 'www.bussalud.gov.ar/auth/v1'
        });
    }
    /**
     * Obtención de token de autenticacion
     */
    obtenerToken(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = this.generacionTokenAut(payload);
            const url = `${this.host}/bus-auth/auth`;
            const options = {
                url,
                method: 'POST',
                json: true,
                body: {
                    grantType: 'client_credentials',
                    scope: 'Patient/*.read,Patient/*.write',
                    clientAssertionType: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
                    clientAssertion: token
                },
            };
            const [status, body] = yield requestHandler_1.handleHttpRequest(options);
            const response = JSON.parse(body);
            this.token = response.accessToken;
            return this.token;
        });
    }
    /**
     * Valida un accessToken
     */
    validarToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.host}/bus-auth/tokeninfo`;
            const options = {
                url,
                method: 'POST',
                json: true,
                body: {
                    accessToken: token
                },
            };
            const [status, body] = yield requestHandler_1.handleHttpRequest(options);
            return status >= 200 && status <= 299;
        });
    }
    federar(patient) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.host}/masterfile-federacion-service/fhir/Patient/`;
            const options = {
                url,
                method: 'POST',
                json: true,
                body: patient,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const [status, body] = yield requestHandler_1.handleHttpRequest(options);
            return status >= 200 && status <= 299;
        });
    }
    search(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.host}/masterfile-federacion-service/fhir/Patient/`;
            const options = {
                url,
                method: 'GET',
                qs: params,
                json: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const [status, bundle] = yield requestHandler_1.handleHttpRequest(options);
            return (bundle.total > 0 ? bundle.entry.map(e => e.resource) : []);
        });
    }
    getDominios(idPaciente) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.host}/masterfile-federacion-service/fhir/Patient/$patient-location?identifier=${this.dominio}|${idPaciente}`;
            const options = {
                url,
                method: 'GET',
                headers: {
                    Authorization: ''
                }
            };
            // https://bus.msal.gov.ar/dominios
            const [status, body] = yield requestHandler_1.handleHttpRequest(options);
            if (status >= 200 && status <= 399) {
                const bundle = JSON.parse(body);
                if (bundle.total > 0) {
                    return bundle.entry.map((r) => {
                        return {
                            id: r.resource.id,
                            name: r.resource.name,
                            identifier: r.resource.identifier.find(iden => iden.system === 'https://federador.msal.gob.ar/uri')
                        };
                    });
                }
            }
            return [];
        });
    }
    solicitud({ custodian = null, fechaDesde = null, fechaHasta = null, patient, loinc }) {
        return __awaiter(this, void 0, void 0, function* () {
            // let url = `${this.host}/fhir/DocumentReference?subject:identifier=${this.dominio}|${patient}&class=https://loinc.org/|${loinc}`;
            let url = 'https://demo5647849.mockable.io/repositorio-documentos/fhir/DocumentReference%3Fsubject:Patient.identifier=http://www.hospitalitaliano.org.ar%7C540153&class=https://loinc.org/%7C60591-5';
            if (custodian) {
                url += `&custodian=${custodian}`;
            }
            if (fechaDesde) {
                url += `&date=ge${fechaDesde}`;
            }
            if (fechaHasta) {
                url += `&date=le${fechaHasta}`;
            }
            const options = {
                url,
                method: 'GET',
                headers: {
                    Authorization: ''
                }
            };
            const [status, body] = yield requestHandler_1.handleHttpRequest(options);
            if (status >= 200 && status <= 399) {
                const bundle = JSON.parse(body);
                if (bundle.total > 0) {
                    const resp = bundle.entry.map((r) => {
                        return {
                            id: r.resource.id,
                            identifier: r.resource.identifier,
                            custodian: r.custodian,
                            urlBinary: r.content[0].attachment.url
                        };
                    });
                    return resp;
                }
            }
            return [];
        });
    }
    getBinary(urlBinary) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${urlBinary}`;
            const options = {
                url,
                method: 'GET',
                headers: {
                    Authorization: ''
                }
            };
            const [status, body] = yield requestHandler_1.handleHttpRequest(options);
            if (status >= 200 && status <= 300) {
                return JSON.parse(body);
            }
        });
    }
}
exports.SaludDigitalClient = SaludDigitalClient;
SaludDigitalClient.SystemPatient = 'https://federador.msal.gob.ar/patient-id';
//# sourceMappingURL=autenticacion.js.map