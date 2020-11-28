const got = require('got');
const env = require('var');

export class ApiAndes {
    private base = 'https://demo.andes.gob.ar/api'; // localhost:3002/api
    private baseSnomed = '/core/term/snomed/';  // Por el momento hardcodeamos la api local
    private basePatient = '/core/mpi/pacientes';  // Por el momento hardcodeamos la api local
    
    constructor() {}
    async getSnomedByConceptId(conceptId) {
        try {
            const url = `${this.base}${this.baseSnomed}concepts/${conceptId}`;
            const response = await got(url).json();
            return response;
        } catch (err) {
            return err
        }
    }

    /**
     * Obtengo todos los hijos de algún concepto
     */
    async getSnomedAllergies(conceptId) {
        try {
            const url = `${this.base}${this.baseSnomed}concepts/${conceptId}/childs`;
            const response = await got(url).json();
            return response;
        } catch (err) {
            return err
        }
    }
    

    /**
     * Patient section: Search by id, match, post, put
     */
    async getPatient(id) {
        try {
            const url = `${this.base}${this.basePatient}/${id}`;
            const gotCustomizado = got.extend({
                hooks: {
                    beforeError: [ // handler del error
                        error => {
                            const {response} = error;
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
                    'Authorization' : `jwt ${env.JWTDemo}`
                }
            });
            const data = (async () => {
                try {
                    const response = await gotCustomizado(url);
                    return response.body
                } catch (err) {
                    throw err = {message: err.message, system: err.name, code: err.statusCode};  // Este objeto debería estar estandarizado en todos los llamados a ANDES
                }
            })();
            return data;
        } catch (err) {
            throw err;
        }
    }

    // ver como interactuar con la api para este caso.
    // async getPatients(query) {  
    //     try {
    //         // Vamos a usar suggest
    //         query['type'] = 'suggest';
    //         const url = this.base + this.basePatient;
    //         console.log('la url: ', url);
    //         const searchParams = new URLSearchParams(query);
    //         const gotCustomizado = got.extend({
    //             hooks: {
    //                 beforeError: [ // handler del error
    //                     error => {
    //                         const {response} = error;
    //                         if (response && response.body) {
    //                             error.name = 'ANDES API';
    //                             error.message = response.body.message;
    //                             error.statusCode = response.statusCode;
    //                         }
    //                         return error;
    //                     }
    //                 ]
    //             },
    //             searchParams,
    //             responseType: 'json',
    //             headers: {
    //                 'Authorization' : `jwt ${env.JWTDemo}`
    //             }
    //         });
    //         console.log('customizado: ', gotCustomizado);
    //         const data = (async () => {
    //             try {
    //                 const response = await gotCustomizado(url);
    //                 return response.body
    //             } catch (err) {
    //                 console.log('palo 1: ', err);
    //                 throw err = {message: err.message, system: err.name, code: err.statusCode};  // Este objeto debería estar estandarizado en todos los llamados a ANDES
    //             }
    //         })();
    //         return data;
    //     } catch (err) {
    //         console.log('palo 2: ', err);
    //         throw err;
    //     }
    // }

}
