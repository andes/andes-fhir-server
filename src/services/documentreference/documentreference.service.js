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
const console = require("console");
const documentreference_1 = require("../../controller/documentreference/documentreference");
const constants_1 = require("./../../constants");
const errorHandler_1 = require("./../../utils/errorHandler");
module.exports = {
    search: (args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log(args);
            let { base_version } = args;
            let subjIdentifier = args['subject:identifier'] || args['subject'];
            let type = args['type'];
            let custodian = args['custodian'];
            subjIdentifier = subjIdentifier ? subjIdentifier.split('|') : [];
            type = type ? type.split('|') : [];
            if (subjIdentifier.length > 0 && type.length > 0 && custodian) {
                if (type[1] === constants_1.CONSTANTS.LOINC.DOCUMENT_REFERENCE && custodian === process.env.RESOURCE_SERVER) {
                    const patientID = subjIdentifier[1];
                    const documentReference = yield documentreference_1.getDocumentReference(base_version, patientID);
                    return documentReference;
                }
                else {
                    if (type[1] !== constants_1.CONSTANTS.LOINC.DOCUMENT_REFERENCE) {
                        const message = 'This server dont support this lonic code';
                        errorHandler_1.fhirError(message, 'Error', 500, 'El código Loinc enviado no es soportado para este Document Reference.');
                    }
                    if (custodian[0] !== process.env.RESOURCE_SERVER) {
                        const message = 'This custodian is not valid';
                        errorHandler_1.fhirError(message, 'Error', 500, 'El custodian enviado no es válido para este servidor.');
                    }
                }
            }
            else {
                const message = 'Invalid parametes for processing';
                errorHandler_1.fhirError(message, 'Error', 500, 'Los parámetros enviados no son válidos');
            }
        }
        catch (err) {
            return err;
        }
    })
};
//# sourceMappingURL=documentreference.service.js.map