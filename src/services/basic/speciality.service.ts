import { ServerError } from '@bluehalo/node-fhir-server-core';
import SpecialityRepository from '../../repositories/speciality.repository';

let getSpecialityEncode = (speciality: any) => {
    return {
        identifier: speciality._id,
        code: {
            "system": "https://sisa.msal.gov.ar/sisa/#sisa",
            "code": speciality.codigo?.sisa,
            "display": speciality.codigo?.sisa
        },
        text: speciality.nombre,
        author: "https://sisa.msal.gov.ar/sisa/#sisa"
    };
};

const SpecialityService = {
    search: async (args: any, context: any) => {
        try {
            const params = context?.req?.query || {};
            let query = {};
            if (Object.keys(params).length > 0) {
                query = SpecialityRepository.buildQuery(params);
            }
            const specialities = await SpecialityRepository.find(query);
            if (specialities.length) {
                return specialities.map(speciality => getSpecialityEncode(speciality));
            } else {
                return [];
            }
        } catch (err: any) {
            let message = '';
            let system = '';
            let code = '';
            if (typeof err === 'object' && err !== null) {
                message = err.message || '';
                system = err.system || '';
                code = err.code || '';
            } else {
                message = String(err);
            }
            throw new ServerError(message, {
                resourceType: "OperationOutcome",
                issue: [
                    {
                        severity: 'error',
                        code,
                        diagnostics: message
                    }
                ]
            });
        }
    },

    searchById: async (args: any, _context?: any) => {
        try {
            const { id } = args;
            const speciality = await SpecialityRepository.findById(id);
            return speciality ? speciality : { notFound: 404 };
        } catch (err: any) {
            let message = '';
            let system = '';
            let code = '';
            if (typeof err === 'object' && err !== null) {
                message = err.message || '';
                system = err.system || '';
                code = err.code || '';
            } else {
                message = String(err);
            }
            throw new ServerError(message, {
                resourceType: "OperationOutcome",
                issue: [
                    {
                        severity: 'error',
                        code,
                        diagnostics: message
                    }
                ]
            });
        }
    }
};

export = SpecialityService;
