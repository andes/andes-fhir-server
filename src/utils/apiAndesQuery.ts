const got = require('got');

export class ApiAndes {
    private base = 'http://localhost:3002/api/core/term/snomed/';  // Por el momento hardcodeamos la api local
    
    constructor() {}
    async getSnomedByConceptId(conceptId) {
        try {
            const url = `${this.base}concepts/${conceptId}`;
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
            const url = `${this.base}concepts/${conceptId}/childs`;
            const response = await got(url).json();
            return response;
        } catch (err) {
            return err
        }
    }
    
}
