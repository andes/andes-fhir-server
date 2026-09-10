import { ObjectId } from 'mongodb';
import PatientService from '../../src/services/patient/patient.service';
import PatientRepository from '../../src/repositories/patient.repository';
import IpsService from '../../src/services/ips/ips.service';

describe('Patient Service', () => {
    const mockVersion = '4_0_1';
    const patientId = new ObjectId().toString();
    const mockPatient = {
        _id: new ObjectId(patientId),
        id: patientId,
        nombre: 'JUAN',
        apellido: 'PEREZ',
        documento: '12345678',
        activo: true,
        genero: 'masculino',
        fechaNacimiento: new Date('1990-01-01')
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(PatientService).toBeDefined();
    });

    it('should expose correct methods', () => {
        expect(typeof PatientService.search).toBe('function');
        expect(typeof PatientService.searchById).toBe('function');
        expect(typeof PatientService.create).toBe('function');
        expect(typeof PatientService.summary).toBe('function');
        expect(typeof PatientService.summaryByIdentifier).toBe('function');
    });

    describe('summary', () => {
        it('should throw error when id is missing', async () => {
            await expect(PatientService.summary({ base_version: mockVersion }, {}))
                .rejects.toThrow('Se requiere el ID del paciente para generar el IPS');
        });

        it('should throw 404 when patient is not found in database', async () => {
            jest.spyOn(PatientRepository, 'findById').mockResolvedValue(null);

            await expect(PatientService.summary({ base_version: mockVersion, id: patientId }, {}))
                .rejects.toThrow(`Paciente con ID ${patientId} no encontrado`);
        });

        it('should call IpsService.build and return IPS Bundle when patient exists', async () => {
            const mockBundle = { resourceType: 'Bundle', type: 'document', entry: [] };
            jest.spyOn(PatientRepository, 'findById').mockResolvedValue(mockPatient as any);
            jest.spyOn(IpsService, 'build').mockResolvedValue(mockBundle as any);

            const result = await PatientService.summary({ base_version: mockVersion, id: patientId }, {});

            expect(PatientRepository.findById).toHaveBeenCalledWith(patientId);
            expect(IpsService.build).toHaveBeenCalledWith(mockVersion, mockPatient);
            expect(result).toBe(mockBundle);
        });
    });

    describe('summaryByIdentifier', () => {
        it('should throw error when identifier is missing', async () => {
            await expect(PatientService.summaryByIdentifier({ base_version: mockVersion }, {}))
                .rejects.toThrow('Se requiere el parámetro identifier para generar el IPS');
        });

        it('should throw 404 when no patient matches identifier', async () => {
            jest.spyOn(PatientRepository, 'find').mockResolvedValue([]);

            await expect(PatientService.summaryByIdentifier({ base_version: mockVersion, identifier: '12345678' }, {}))
                .rejects.toThrow('No se encontró paciente con identificador 12345678');
        });

        it('should throw 400 when multiple patients match identifier', async () => {
            jest.spyOn(PatientRepository, 'find').mockResolvedValue([mockPatient, { ...mockPatient, _id: new ObjectId() }] as any);

            await expect(PatientService.summaryByIdentifier({ base_version: mockVersion, identifier: '12345678' }, {}))
                .rejects.toThrow('Se encontró más de un paciente con el identificador 12345678');
        });

        it('should call IpsService.build and return IPS Bundle when unique patient is matched', async () => {
            const mockBundle = { resourceType: 'Bundle', type: 'document', entry: [] };
            jest.spyOn(PatientRepository, 'find').mockResolvedValue([mockPatient] as any);
            jest.spyOn(IpsService, 'build').mockResolvedValue(mockBundle as any);

            const result = await PatientService.summaryByIdentifier({ base_version: mockVersion, identifier: '12345678' }, {});

            expect(IpsService.build).toHaveBeenCalledWith(mockVersion, mockPatient);
            expect(result).toBe(mockBundle);
        });
    });
});
