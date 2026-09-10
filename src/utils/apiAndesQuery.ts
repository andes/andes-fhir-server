export class ApiAndes {
    base = process.env.ANDES_HOST;
    baseSnomed = '/core/term/snomed/';
    basePatient = '/core-v2/mpi/pacientes';

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
}

