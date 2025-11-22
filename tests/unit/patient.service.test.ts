import PatientService from '../../src/services/patient/patient.service';

describe('Patient Service', () => {
    it('should be defined', () => {
        const service = new PatientService();
        expect(service).toBeDefined();
    });

    it('should expose correct methods', () => {
        const service = new PatientService();

        expect(typeof service.search).toBe('function');
        expect(typeof service.searchById).toBe('function');
        expect(typeof service.create).toBe('function');
    });
});
