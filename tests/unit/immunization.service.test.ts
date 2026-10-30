import { ObjectId } from 'mongodb';
import { ServerError } from '@bluehalo/node-fhir-server-core';
import ImmunizationService from '../../src/services/immunization/immunization.service';
import PatientService from '../../src/services/patient/patient.service';
import PatientRepository from '../../src/repositories/patient.repository';
import VaccineRepository from '../../src/repositories/vaccine.repository';
import { Immunization as fhirImmunization } from '../../src/encoders';

describe('Immunization Encoder & Service (nomivac schema)', () => {
    const mockPatientId = new ObjectId('6a981ed00df7912aded7b0ec');
    const mockVacunaId1 = new ObjectId('650000000000000000000001');
    const mockVacunaId2 = new ObjectId('650000000000000000000002');

    const mockPatientDoc = {
        _id: mockPatientId,
        id: mockPatientId.toString(),
        documento: '71270006',
        nombre: 'MILENA TIZIANA',
        apellido: 'CUEVAS',
        sexo: 'femenino',
        genero: 'mujer',
        fechaNacimiento: new Date('2026-09-02T00:00:00.000Z'),
        estado: 'validado',
        activo: true,
    };

    const mockNomivacDocs = [
        {
            _id: mockVacunaId1,
            idvacuna: 129,
            codigo: '129',
            vacuna: 'BCG',
            esquema: 'Esquema Regular BCG',
            codigoEsquema: 101,
            condicion: 'Calendario Nacional',
            codigoCondicion: 1,
            dosis: 'Única Dosis',
            ordenDosis: 1,
            fechaAplicacion: new Date('2026-09-03T10:00:00.000Z'),
            documento: '71270006',
            apellido: 'CUEVAS',
            nombre: 'MILENA TIZIANA',
            sexo: 'femenino',
            efector: 'HTAL SAN MARTIN DE LOS ANDES',
        },
        {
            _id: mockVacunaId2,
            idvacuna: 132,
            codigo: '132',
            vacuna: 'Hepatitis B',
            esquema: 'Recién Nacido',
            codigoEsquema: 105,
            condicion: 'Calendario Nacional',
            codigoCondicion: 1,
            dosis: '1ra Dosis',
            ordenDosis: 1,
            fechaAplicacion: new Date('2026-09-02T14:00:00.000Z'),
            documento: '71270006',
            apellido: 'CUEVAS',
            nombre: 'MILENA TIZIANA',
            sexo: 'femenino',
            efector: 'HTAL SAN MARTIN DE LOS ANDES',
        },
    ];

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should encode nomivac document using real schema fields without hardcoded values', () => {
        const encoded = fhirImmunization.encode(
            { reference: `Patient/${mockPatientId.toString()}`, display: 'MILENA TIZIANA CUEVAS' },
            mockNomivacDocs[0]
        );

        expect(encoded.resourceType).toBe('Immunization');
        expect(encoded.id).toBe(mockVacunaId1.toString());
        expect(encoded.vaccineCode.coding[0].code).toBe('129');
        expect(encoded.vaccineCode.coding[0].display).toBe('BCG');
        expect(encoded.patient).toEqual({
            reference: `Patient/${mockPatientId.toString()}`,
            display: 'MILENA TIZIANA CUEVAS',
        });
        expect(encoded.extension).toEqual([
            {
                url: 'http://sisa/fhir/esquema',
                valueCoding: {
                    system: 'http://argentina.gob.ar/salud/NOMIVAC-esquemas',
                    code: '101',
                    display: 'Esquema Regular BCG',
                },
            },
            {
                url: 'http://sisa/fhir/condicionAplicacion',
                valueCoding: {
                    system: 'http://argentina.gob.ar/salud/NOMIVAC-condicion',
                    code: '1',
                    display: 'Calendario Nacional',
                },
            },
        ]);
        expect(encoded.location).toEqual({
            display: 'HTAL SAN MARTIN DE LOS ANDES',
        });
        expect(encoded.protocolApplied).toEqual([
            {
                series: 'Esquema Regular BCG',
                doseNumberString: 'Única Dosis',
            },
        ]);
    });

    it('should search immunizations by patient ID (GET /4_0_1/Immunization?patient=...)', async () => {
        jest.spyOn(PatientRepository, 'findById').mockResolvedValue(mockPatientDoc as any);
        jest.spyOn(VaccineRepository, 'count').mockResolvedValue(2);
        jest.spyOn(VaccineRepository, 'find').mockResolvedValue(mockNomivacDocs as any);

        const bundle = await ImmunizationService.search(
            { base_version: '4_0_1', patient: `Patient/${mockPatientId.toString()}` },
            { req: { query: { patient: `Patient/${mockPatientId.toString()}` }, headers: { host: 'localhost:3000' } } }
        );

        expect(bundle.resourceType).toBe('Bundle');
        expect(bundle.total).toBe(2);
        expect(bundle.entry).toHaveLength(2);
        expect(bundle.entry[0].resource.id).toBe(mockVacunaId1.toString());
        expect(bundle.entry[0].resource.patient.reference).toBe(`Patient/${mockPatientId.toString()}`);
    });

    it('should searchById and return Immunization or throw 404 when not found', async () => {
        jest.spyOn(VaccineRepository, 'findById').mockResolvedValueOnce(mockNomivacDocs[0] as any);
        jest.spyOn(PatientRepository, 'findOne').mockResolvedValueOnce(mockPatientDoc as any);

        const result = await ImmunizationService.searchById({
            base_version: '4_0_1',
            id: mockVacunaId1.toString(),
        });
        const json = result.toJSON ? result.toJSON() : result;
        expect(json.id).toBe(mockVacunaId1.toString());
        expect(json.vaccineCode.text).toBe('BCG');

        jest.spyOn(VaccineRepository, 'findById').mockResolvedValueOnce(null);
        await expect(
            ImmunizationService.searchById({ base_version: '4_0_1', id: 'nonexistent' })
        ).rejects.toThrow(ServerError);
    });

    it('should include Patient immunizations when _revinclude=Immunization:patient is requested on /Patient', async () => {
        jest.spyOn(PatientRepository, 'count').mockResolvedValue(1);
        jest.spyOn(PatientRepository, 'find').mockResolvedValue([mockPatientDoc] as any);
        jest.spyOn(VaccineRepository, 'findByDocuments').mockResolvedValue(mockNomivacDocs as any);

        const bundle = await PatientService.search(
            {
                base_version: '4_0_1',
                identifier: 'http://renaper.gob.ar/dni|71270006',
                _revinclude: 'Immunization:patient',
            },
            {
                req: {
                    query: {
                        identifier: 'http://renaper.gob.ar/dni|71270006',
                        _revinclude: 'Immunization:patient',
                    },
                    headers: { host: 'localhost:3000' },
                    originalUrl: '/4_0_1/Patient?identifier=http://renaper.gob.ar/dni|71270006&_revinclude=Immunization:patient',
                },
            }
        );

        expect(bundle.total).toBe(1);
        expect(bundle.entry).toHaveLength(3); // 1 Patient (match) + 2 Immunization (include)
        expect(bundle.entry[0].search.mode).toBe('match');
        expect(bundle.entry[0].resource.resourceType).toBe('Patient');

        expect(bundle.entry[1].search.mode).toBe('include');
        expect(bundle.entry[1].resource.resourceType).toBe('Immunization');
        expect(bundle.entry[1].resource.id).toBe(mockVacunaId1.toString());

        expect(bundle.entry[2].search.mode).toBe('include');
        expect(bundle.entry[2].resource.resourceType).toBe('Immunization');
        expect(bundle.entry[2].resource.id).toBe(mockVacunaId2.toString());
    });
});
