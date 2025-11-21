export { };  // <-- importante para que ESLint trate el archivo como TS
// GOT es ESM only, no se puede usar require directamente.
// Hacemos import dinámico compatible con CJS.

let gotInstance = null;

async function getGot() {
    if (!gotInstance) {
        const mod = await import('got');
        gotInstance = mod.default;
    }
    return gotInstance;
}

export class ApiAndes {
    base = process.env.ANDES_HOST;
    baseSnomed = '/core/term/snomed/';
    basePatient = '/core-v2/mpi/pacientes';

    constructor() { }

    async getSnomedByConceptId(conceptId) {
        try {
            const got = await getGot();
            const url = `${this.base}${this.baseSnomed}concepts/${conceptId}`;
            const response = await got(url).json();
            return response;
        } catch (err) {
            return err;
        }
    }

    async getSnomedAllergies(conceptId) {
        try {
            const got = await getGot();
            const url = `${this.base}${this.baseSnomed}concepts/${conceptId}/childs`;
            const response = await got(url).json();
            return response;
        } catch (err) {
            return err;
        }
    }

    async getPatient(id) {
        try {
            const got = await getGot();
            const url = `${this.base}${this.basePatient}/${id}`;

            const gotCustomizado = got.extend({
                hooks: {
                    beforeError: [
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
                    'Authorization': `jwt ${process.env.ANDES_TOKEN}`
                }
            });

            try {
                const response = await gotCustomizado(url);
                return response.body;
            } catch (err) {
                throw {
                    message: err.message,
                    system: err.name,
                    code: err.statusCode
                };
            }

        } catch (err) {
            throw err;
        }
    }
}
