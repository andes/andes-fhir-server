/**
 * @deprecated Esta clase ha quedado obsoleta y sus métodos no deben ser utilizados.
 * - Para conceptos SNOMED y alergias, usar `SnowstormService` (`src/services/snomed/snowstorm.service.ts`).
 * - Para pacientes, consultar directamente MongoDB a través de `PatientRepository`.
 */
export class ApiAndes {
    /*
    base = process.env.ANDES_HOST;
    baseSnomed = '/core/term/snomed/';
    basePatient = '/core-v2/mpi/pacientes';

    /**
     * @deprecated Usar `snowstormService.getConcept(conceptId)` directamente.
     */
    /*
    async getSnomedByConceptId(conceptId: string | number) {
        try {
            const url = `${this.base}${this.baseSnomed}concepts/${conceptId}`;
            const response = await fetch(url);
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch (err) {
            return err;
        }
    }
    */

    /**
     * @deprecated Usar `snowstormService.getSnomedAllergies(conceptId)` directamente.
     */
    /*
    async getSnomedAllergies(conceptId: string | number) {
        try {
            const url = `${this.base}${this.baseSnomed}concepts/${conceptId}/childs`;
            const response = await fetch(url);
            if (!response.ok) {
                console.log('error al obtener los hijos del concepto: ', conceptId);
                return null;
            }
            console.log('url: ', url);
            return await response.json();
        } catch (err) {
            console.log('error al obtener los hijos del concepto: ', conceptId, 'error: ', err);
            return err;
        }
    }
    */

    /**
     * @deprecated El servidor FHIR ahora interactúa directamente con MongoDB a través de PatientRepository.
     */
    /*
    async getPatient(id: string) {
        const url = `${this.base}${this.basePatient}/${id}`;
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `jwt ${process.env.ANDES_TOKEN}`
                }
            });

            const body: any = await response.json();

            if (!response.ok) {
                throw {
                    message: body?.message || 'ANDES API Error',
                    system: 'ANDES API',
                    code: response.status
                };
            }

            return body;
        } catch (err: any) {
            if (err.system) {
                throw err;
            }
            throw {
                message: err.message,
                system: 'ANDES API',
                code: err.code || 500
            };
        }
    }
    */
}
