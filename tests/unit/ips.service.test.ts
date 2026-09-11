import { ObjectId } from 'mongodb';
import { IpsService } from '../../src/services/ips/ips.service';
import PrestationRepository from '../../src/repositories/prestation.repository';
import VaccineRepository from '../../src/repositories/vaccine.repository';
import * as orgController from '../../src/controller/organization/organization';
import { ApiAndes } from '../../src/utils/apiAndesQuery';

describe('IpsService', () => {
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
        // Mock Organization Custodian (SISA '0')
        jest.spyOn(orgController, 'buscarOrganizacionSisa').mockResolvedValue({
            resourceType: 'Organization',
            id: 'org-subsecretaria',
            name: 'Subsecretaría de Salud'
        } as any);

        // Mock ApiAndes calls
        jest.spyOn(ApiAndes.prototype, 'getSnomedAllergies').mockResolvedValue([]);
        jest.spyOn(ApiAndes.prototype, 'getSnomedByConceptId').mockResolvedValue(null);
    });

    it('should generate an IPS document Bundle with empty sections when patient has no records', async () => {
        jest.spyOn(PrestationRepository, 'findByPatientId').mockResolvedValue([]);
        jest.spyOn(VaccineRepository, 'findByDocument').mockResolvedValue([]);

        const bundle = await IpsService.build(mockVersion, mockPatient);

        expect(bundle).toBeDefined();
        expect(bundle.resourceType).toBe('Bundle');
        expect(bundle.type).toBe('document');
        expect(Array.isArray(bundle.entry)).toBe(true);

        // First resource must be Composition
        const compositionEntry = bundle.entry[0];
        expect(compositionEntry.resource.resourceType).toBe('Composition');

        // Patient resource should be in entries
        const patientEntry = bundle.entry.find((e: any) => e.resource.resourceType === 'Patient');
        expect(patientEntry).toBeDefined();

        // Empty sections should use emptyReason with 'nilknown'
        const composition = compositionEntry.resource;
        const medSection = composition.section.find((s: any) => s.title.includes('Medicamentos'));
        expect(medSection).toBeDefined();
        expect(medSection.emptyReason?.coding[0].code).toBe('nilknown');

        const allergySection = composition.section.find((s: any) => s.title.includes('Alergias'));
        expect(allergySection).toBeDefined();
        expect(allergySection.emptyReason?.coding[0].code).toBe('nilknown');
    });

    it('should include clinical conditions, allergies and vaccines when patient has records', async () => {
        const mockPrestaciones = [
            {
                _id: new ObjectId(),
                estados: [{ tipo: 'validada' }],
                ejecucion: {
                    registros: [
                        {
                            concepto: {
                                conceptId: '195967001',
                                term: 'asma',
                                semanticTag: 'trastorno'
                            },
                            createdAt: new Date()
                        },
                        {
                            concepto: {
                                conceptId: '300916003',
                                term: 'alergia a penicilina',
                                semanticTag: 'hallazgo'
                            },
                            createdAt: new Date()
                        }
                    ]
                }
            }
        ];

        const mockVacunas = [
            {
                _id: new ObjectId(),
                vacuna: 'COVID-19',
                codigo: 'COV19',
                fechaAplicacion: new Date('2021-05-10')
            }
        ];

        jest.spyOn(ApiAndes.prototype, 'getSnomedAllergies').mockResolvedValue([
            { conceptId: '300916003', term: 'alergia a penicilina' }
        ] as any);
        jest.spyOn(PrestationRepository, 'findByPatientId').mockResolvedValue(mockPrestaciones as any);
        jest.spyOn(VaccineRepository, 'findByDocument').mockResolvedValue(mockVacunas as any);

        const bundle = await IpsService.build(mockVersion, mockPatient);

        expect(bundle).toBeDefined();
        expect(bundle.resourceType).toBe('Bundle');

        // Condition should match mock data
        const condEntry = bundle.entry.find((e: any) => e.resource.resourceType === 'Condition');
        expect(condEntry).toBeDefined();
        expect(condEntry.resource.code.coding[0].code).toBe('195967001');

        // Allergy should match mock data
        const allergyEntry = bundle.entry.find((e: any) => e.resource.resourceType === 'AllergyIntolerance');
        expect(allergyEntry).toBeDefined();

        // Immunization should match mock data
        const immEntry = bundle.entry.find((e: any) => e.resource.resourceType === 'Immunization');
        expect(immEntry).toBeDefined();
    });

    it('should throw ServerError when patient is null or undefined', async () => {
        await expect(IpsService.build(mockVersion, null)).rejects.toThrow('Patient not found');
    });
});
