import PatientService from '../../src/services/patient/patient.service';

describe('Patient Service', () => {
    it('should be defined', () => {
        expect(PatientService).toBeDefined();
    });

    it('should expose correct methods', () => {

        expect(typeof PatientService.search).toBe('function');
        expect(typeof PatientService.searchById).toBe('function');
        expect(typeof PatientService.create).toBe('function');
    });
});
