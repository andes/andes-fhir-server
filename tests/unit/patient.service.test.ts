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

    describe('search with _revinclude=RelatedPerson:patient and _revinclude:iterate=Patient:link', () => {
        it('should return mother Patient, RelatedPerson entries and temporal baby Patient with link', async () => {
            const madreId = new ObjectId().toString();
            const bebeId = new ObjectId().toString();
            const relBebeId = new ObjectId().toString();
            const relAbueloId = new ObjectId().toString();

            const madreDoc = {
                _id: new ObjectId(madreId),
                id: madreId,
                nombre: 'MARIA',
                apellido: 'GOMEZ',
                documento: '28123456',
                sexo: 'femenino',
                genero: 'femenino',
                estado: 'validado',
                activo: true,
                fechaNacimiento: '1992-05-10',
                relaciones: [
                    {
                        _id: new ObjectId(relBebeId),
                        relacion: { nombre: 'hijo/a', opuesto: 'progenitor/a' },
                        referencia: new ObjectId(bebeId),
                        nombre: 'MATEO',
                        apellido: 'GOMEZ'
                    },
                    {
                        _id: new ObjectId(relAbueloId),
                        relacion: { nombre: 'progenitor/a', opuesto: 'hijo/a' },
                        nombre: 'CARLOS',
                        apellido: 'GOMEZ',
                        documento: '12333444'
                    }
                ]
            };

            const bebeTemporalDoc = {
                _id: new ObjectId(bebeId),
                id: bebeId,
                nombre: 'MATEO',
                apellido: 'GOMEZ',
                sexo: 'masculino',
                genero: 'masculino',
                estado: 'temporal',
                activo: true,
                fechaNacimiento: '2026-10-15'
            };

            jest.spyOn(PatientRepository, 'count').mockResolvedValue(1);
            jest.spyOn(PatientRepository, 'find').mockResolvedValue([madreDoc] as any);
            jest.spyOn(PatientRepository, 'findByIds').mockResolvedValue([bebeTemporalDoc] as any);

            const args = {
                base_version: mockVersion,
                identifier: 'http://renaper.gob.ar/dni|28123456'
            };
            const context = {
                req: {
                    query: {
                        identifier: 'http://renaper.gob.ar/dni|28123456',
                        _revinclude: 'RelatedPerson:patient',
                        '_revinclude:iterate': 'Patient:link'
                    },
                    protocol: 'http',
                    get: () => 'localhost:3000',
                    baseUrl: '/4_0_1/Patient',
                    path: '',
                    originalUrl: '/4_0_1/Patient?identifier=http://renaper.gob.ar/dni|28123456&_revinclude=RelatedPerson:patient&_revinclude:iterate=Patient:link'
                }
            };

            const bundle = await PatientService.search(args, context);

            expect(bundle.resourceType).toBe('Bundle');
            expect(bundle.total).toBe(1);
            expect(bundle.entry).toHaveLength(4);

            // 1. Mother Patient (match)
            const motherEntry = bundle.entry.find((e: any) => e.resource.resourceType === 'Patient' && e.resource.id === madreId);
            expect(motherEntry).toBeDefined();
            expect(motherEntry.search.mode).toBe('match');

            // 2. Two RelatedPerson resources (include)
            const relatedEntries = bundle.entry.filter((e: any) => e.resource.resourceType === 'RelatedPerson');
            expect(relatedEntries).toHaveLength(2);
            expect(relatedEntries.every((e: any) => e.search.mode === 'include')).toBe(true);

            const bebeRelEntry = relatedEntries.find((e: any) => e.resource.id === relBebeId);
            expect(bebeRelEntry).toBeDefined();
            expect(bebeRelEntry.resource.patient.reference).toBe(`Patient/${madreId}`);
            expect(bebeRelEntry.resource.birthDate).toBe('2026-10-15');
            expect(bebeRelEntry.resource.relationship[0].coding[0].code).toBe('CHILD');

            // 3. Baby temporal Patient (include via _revinclude:iterate=Patient:link)
            const bebePatientEntry = bundle.entry.find((e: any) => e.resource.resourceType === 'Patient' && e.resource.id === bebeId);
            expect(bebePatientEntry).toBeDefined();
            expect(bebePatientEntry.search.mode).toBe('include');
            expect(bebePatientEntry.resource.link).toEqual([
                {
                    other: { reference: `RelatedPerson/${relBebeId}` },
                    type: 'seealso'
                }
            ]);
        });
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
