import { ObjectId } from 'mongodb';
import { McodeService, flattenRegistrosFromPrestacion } from '../../src/services/mcode/mcode.service';
import PrestationRepository from '../../src/repositories/prestation.repository';
import PatientRepository from '../../src/repositories/patient.repository';
import PatientService from '../../src/services/patient/patient.service';
import ConditionService from '../../src/services/condition/condition.service';
import ObservationService from '../../src/services/observation/observation.service';
import ProcedureService from '../../src/services/procedure/procedure.service';
import { snowstormService } from '../../src/services/snomed/snowstorm.service';
import {
    Bundle,
    Condition,
    Observation,
    Patient,
    Procedure
} from '../../src/encoders';

describe('mCODE Encoders & McodeService', () => {
    const mockVersion = '4_0_1';
    const patientId = new ObjectId().toString();
    const mockPatient = {
        _id: new ObjectId(patientId),
        id: patientId,
        nombre: 'MARIA',
        apellido: 'LOPEZ',
        documento: '25678901',
        activo: true,
        sexo: 'femenino',
        genero: 'femenino',
        fechaNacimiento: new Date('1975-06-15')
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(snowstormService, 'getSnomedPrimaryCancers').mockResolvedValue([
            { conceptId: '254837009', term: 'neoplasia maligna de mama', fsn: 'neoplasia maligna de mama (trastorno)', semanticTag: 'trastorno' }
        ]);
        jest.spyOn(snowstormService, 'getSnomedSecondaryCancers').mockResolvedValue([
            { conceptId: '94222008', term: 'neoplasia maligna secundaria de hueso', fsn: 'neoplasia maligna secundaria de hueso (trastorno)', semanticTag: 'trastorno' }
        ]);
        jest.spyOn(snowstormService, 'getSnomedTnmStaging').mockResolvedValue([
            { conceptId: '261614003', term: 'estadio 2A', fsn: 'estadio 2A (calificador)', semanticTag: 'escala de estadificación' }
        ]);
        jest.spyOn(snowstormService, 'getSnomedRadiotherapyProcedures').mockResolvedValue([
            { conceptId: '33195004', term: 'radioterapia con haz externo', fsn: 'radioterapia con haz externo (procedimiento)', semanticTag: 'procedimiento' }
        ]);
        jest.spyOn(snowstormService, 'getSnomedSurgicalProcedures').mockResolvedValue([
            { conceptId: '172043006', term: 'mastectomía simple', fsn: 'mastectomía simple (procedimiento)', semanticTag: 'procedimiento' }
        ]);
    });

    describe('flattenRegistrosFromPrestacion', () => {
        it('should recursively extract nested records in molecules and sections while skipping section containers', () => {
            const prestacion = {
                _id: 'prest-1',
                ejecucion: {
                    fecha: new Date('2026-01-10T10:00:00Z'),
                    registros: [
                        {
                            _id: 'sec-container',
                            hasSections: true,
                            concepto: { conceptId: '111', term: 'Ficha oncológica', semanticTag: 'elemento de registro' },
                            registros: [
                                {
                                    _id: 'sec-1',
                                    isSection: true,
                                    concepto: { conceptId: '222', term: 'Sección Diagnóstico', semanticTag: 'elemento de registro' },
                                    registros: [
                                        {
                                            _id: 'reg-child-1',
                                            concepto: { conceptId: '254837009', term: 'neoplasia maligna de mama', semanticTag: 'trastorno' }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            };

            const flattened = flattenRegistrosFromPrestacion(prestacion);
            expect(flattened).toHaveLength(2);
            expect(flattened.map(f => f.registro._id)).toEqual(['sec-container', 'reg-child-1']);
            expect(flattened[1].parentRegistroId).toBe('sec-container');
        });
    });

    describe('mCODE Individual Encoders', () => {
        it('should encode CancerPatient, PrimaryCancerCondition, SecondaryCancerCondition, Observations and Procedures with mCODE profiles', () => {
            const cancerPatient = Patient.encodeCancerPatient(mockPatient as any);
            expect(cancerPatient?.meta?.profile).toContain(Patient.MCODE_CANCER_PATIENT_PROFILE);

            const primaryCond = Condition.encodePrimaryCancerCondition(
                'Patient/1',
                {
                    _id: 'cond-prim-1',
                    createdAt: '2026-02-01T10:00:00Z',
                    valor: { estado: 'remision', evolucion: 'Buena respuesta' },
                    concepto: { conceptId: '254837009', term: 'neoplasia maligna de mama' }
                },
                {
                    bodySiteConcepts: [{ conceptId: '80248007', term: 'estructura de mama izquierda' }],
                    histologyConcept: { conceptId: '82711006', term: 'carcinoma ductal infiltrante' },
                    stageAssessmentReferences: ['Observation/tnm-1']
                }
            );

            expect(primaryCond.meta.profile).toContain(Condition.MCODE_PRIMARY_CANCER_PROFILE);
            expect(primaryCond.clinicalStatus.coding[0].code).toBe('remission');
            expect(primaryCond.bodySite[0].coding[0].code).toBe('80248007');
            expect(primaryCond.stage[0].assessment[0].reference).toBe('Observation/tnm-1');
            expect(primaryCond.extension[0].url).toBe(Condition.MCODE_HISTOLOGY_EXTENSION_URL);

            const secondaryCond = Condition.encodeSecondaryCancerCondition(
                'Patient/1',
                {
                    _id: 'cond-sec-1',
                    createdAt: '2026-03-01T10:00:00Z',
                    concepto: { conceptId: '94222008', term: 'neoplasia maligna secundaria de hueso' }
                },
                {
                    relatedPrimaryCancerReferences: ['Condition/cond-prim-1']
                }
            );
            expect(secondaryCond.meta.profile).toContain(Condition.MCODE_SECONDARY_CANCER_PROFILE);
            expect(secondaryCond.extension[0].valueReference.reference).toBe('Condition/cond-prim-1');

            const ecogObs = Observation.encodeEcogPerformanceStatus(
                'Patient/1',
                {
                    _id: 'ecog-1',
                    valor: 1,
                    concepto: { conceptId: '423740007', term: 'ECOG' }
                }
            );
            expect(ecogObs.meta.profile).toContain(Observation.MCODE_ECOG_PERFORMANCE_STATUS_PROFILE);
            expect(ecogObs.valueInteger).toBe(1);

            const surgProc = Procedure.encodeSurgicalProcedure(
                'Patient/1',
                {
                    _id: 'proc-1',
                    concepto: { conceptId: '172043006', term: 'mastectomía simple' }
                },
                {
                    reasonReferences: ['Condition/cond-prim-1'],
                    intentConcept: { conceptId: '373808002', term: 'intención curativa' }
                }
            );
            expect(surgProc.meta.profile).toContain(Procedure.MCODE_SURGICAL_PROCEDURE_PROFILE);
            expect(surgProc.reasonReference[0].reference).toBe('Condition/cond-prim-1');
            expect(surgProc.extension[0].url).toBe(Procedure.MCODE_PROCEDURE_INTENT_EXTENSION_URL);
        });
    });

    describe('McodeService.build', () => {
        it('should build a complete mCODEPatientBundle linking primary cancer, TNM stage, secondary cancer, ECOG, disease status and procedures', async () => {
            const mockPrestaciones = [
                {
                    _id: new ObjectId(),
                    estados: [{ tipo: 'validada' }],
                    ejecucion: {
                        fecha: new Date('2026-04-10T12:00:00Z'),
                        registros: [
                            {
                                _id: 'prim-reg-1',
                                nombre: 'Cáncer de mama',
                                createdAt: new Date('2026-04-10T12:00:00Z'),
                                valor: {
                                    estado: 'remisión',
                                    evolucion: 'En remisión clínica luego de cirugía'
                                },
                                concepto: {
                                    conceptId: '254837009',
                                    term: 'neoplasia maligna de mama',
                                    semanticTag: 'trastorno'
                                },
                                registros: [
                                    {
                                        _id: 'site-reg-1',
                                        concepto: {
                                            conceptId: '80248007',
                                            term: 'estructura de mama izquierda',
                                            semanticTag: 'estructura corporal'
                                        }
                                    },
                                    {
                                        _id: 'tnm-reg-1',
                                        concepto: {
                                            conceptId: '261614003',
                                            term: 'estadio 2A',
                                            semanticTag: 'escala de estadificación'
                                        }
                                    }
                                ]
                            },
                            {
                                _id: 'sec-reg-1',
                                createdAt: new Date('2026-04-10T12:00:00Z'),
                                concepto: {
                                    conceptId: '94222008',
                                    term: 'neoplasia maligna secundaria de hueso',
                                    semanticTag: 'trastorno'
                                }
                            },
                            {
                                _id: 'ecog-reg-1',
                                createdAt: new Date('2026-04-10T12:00:00Z'),
                                valor: 0,
                                concepto: {
                                    conceptId: '423740007',
                                    term: 'estado funcional ECOG',
                                    semanticTag: 'hallazgo'
                                }
                            },
                            {
                                _id: 'surg-reg-1',
                                createdAt: new Date('2026-04-10T12:00:00Z'),
                                concepto: {
                                    conceptId: '172043006',
                                    term: 'mastectomía simple',
                                    semanticTag: 'procedimiento'
                                }
                            },
                            {
                                _id: 'radio-reg-1',
                                createdAt: new Date('2026-04-10T12:00:00Z'),
                                concepto: {
                                    conceptId: '33195004',
                                    term: 'radioterapia con haz externo',
                                    semanticTag: 'procedimiento'
                                }
                            }
                        ]
                    }
                }
            ];

            jest.spyOn(PrestationRepository, 'findByPatientId').mockResolvedValue(mockPrestaciones as any);

            const bundle = await McodeService.build(mockVersion, mockPatient);

            expect(bundle).toBeDefined();
            expect(bundle.resourceType).toBe('Bundle');
            expect(bundle.type).toBe('collection');
            expect(bundle.meta.profile).toContain(Bundle.MCODE_PATIENT_BUNDLE_PROFILE);

            const resources = bundle.entry.map((e: any) => e.resource);

            // 1. CancerPatient
            const patientRes = resources.find((r: any) => r.resourceType === 'Patient');
            expect(patientRes).toBeDefined();
            expect(patientRes.meta.profile).toContain(Patient.MCODE_CANCER_PATIENT_PROFILE);

            // 2. PrimaryCancerCondition
            const primaryCond = resources.find(
                (r: any) =>
                    r.resourceType === 'Condition' &&
                    r.meta?.profile?.includes(Condition.MCODE_PRIMARY_CANCER_PROFILE)
            );
            expect(primaryCond).toBeDefined();
            expect(primaryCond.code.coding[0].code).toBe('254837009');
            expect(primaryCond.bodySite[0].coding[0].code).toBe('80248007');
            expect(primaryCond.stage[0].assessment).toHaveLength(1);

            // 3. SecondaryCancerCondition linked to PrimaryCancerCondition
            const secondaryCond = resources.find(
                (r: any) =>
                    r.resourceType === 'Condition' &&
                    r.meta?.profile?.includes(Condition.MCODE_SECONDARY_CANCER_PROFILE)
            );
            expect(secondaryCond).toBeDefined();
            expect(secondaryCond.extension[0].valueReference.reference).toContain('Condition/prim-reg-1');

            // 4. TNMStageGroup Observation
            const tnmObs = resources.find(
                (r: any) =>
                    r.resourceType === 'Observation' &&
                    r.meta?.profile?.includes(Observation.MCODE_TNM_STAGE_GROUP_PROFILE)
            );
            expect(tnmObs).toBeDefined();
            expect(tnmObs.valueCodeableConcept.coding[0].code).toBe('261614003');
            expect(tnmObs.focus[0].reference).toContain('Condition/prim-reg-1');

            // 5. CancerDiseaseStatus Observation (derived from evolution/remission)
            const statusObs = resources.find(
                (r: any) =>
                    r.resourceType === 'Observation' &&
                    r.meta?.profile?.includes(Observation.MCODE_CANCER_DISEASE_STATUS_PROFILE)
            );
            expect(statusObs).toBeDefined();
            expect(statusObs.valueCodeableConcept.coding[0].code).toBe('268910001');

            // 6. ECOGPerformanceStatus Observation
            const ecogObs = resources.find(
                (r: any) =>
                    r.resourceType === 'Observation' &&
                    r.meta?.profile?.includes(Observation.MCODE_ECOG_PERFORMANCE_STATUS_PROFILE)
            );
            expect(ecogObs).toBeDefined();
            expect(ecogObs.valueInteger).toBe(0);

            // 7. Surgical and Radiotherapy Procedures
            const procedures = resources.filter((r: any) => r.resourceType === 'Procedure');
            expect(procedures).toHaveLength(2);
            expect(procedures[0].reasonReference[0].reference).toContain('Condition/prim-reg-1');
        });

        it('should support individual Condition, Observation, and Procedure search endpoints by patient and filters', async () => {
            const mockPrestaciones = [
                {
                    _id: new ObjectId(),
                    estados: [{ tipo: 'validada' }],
                    ejecucion: {
                        fecha: new Date('2026-04-10T12:00:00Z'),
                        registros: [
                            {
                                _id: 'prim-reg-1',
                                createdAt: new Date('2026-04-10T12:00:00Z'),
                                valor: { estado: 'activo' },
                                concepto: { conceptId: '254837009', term: 'neoplasia maligna de mama', semanticTag: 'trastorno' }
                            },
                            {
                                _id: 'ecog-reg-1',
                                createdAt: new Date('2026-04-10T12:00:00Z'),
                                valor: 1,
                                concepto: { conceptId: '423740007', term: 'ECOG', semanticTag: 'entidad observable' }
                            },
                            {
                                _id: 'surg-reg-1',
                                createdAt: new Date('2026-04-10T12:00:00Z'),
                                concepto: { conceptId: '172043006', term: 'mastectomía simple', semanticTag: 'procedimiento' }
                            }
                        ]
                    }
                }
            ];

            jest.spyOn(PatientRepository, 'findById').mockResolvedValue(mockPatient as any);
            jest.spyOn(PrestationRepository, 'findByPatientId').mockResolvedValue(mockPrestaciones as any);

            const condBundle = await ConditionService.search(
                { base_version: mockVersion, patient: `Patient/${patientId}` },
                {}
            );
            expect(condBundle.type).toBe('searchset');
            expect(condBundle.total).toBe(1);
            expect(condBundle.entry[0].resource.resourceType).toBe('Condition');

            const obsBundle = await ObservationService.search(
                { base_version: mockVersion, patient: patientId, _profile: Observation.MCODE_ECOG_PERFORMANCE_STATUS_PROFILE },
                {}
            );
            expect(obsBundle.type).toBe('searchset');
            expect(obsBundle.total).toBe(1);
            expect(obsBundle.entry[0].resource.valueInteger).toBe(1);

            const procBundle = await ProcedureService.search(
                { base_version: mockVersion, patient: patientId, code: '172043006' },
                {}
            );
            expect(procBundle.type).toBe('searchset');
            expect(procBundle.total).toBe(1);
            expect(procBundle.entry[0].resource.resourceType).toBe('Procedure');
        });

        it('should support PatientService.mcode and PatientService.mcodeByIdentifier operations', async () => {
            jest.spyOn(PatientRepository, 'findById').mockResolvedValue(mockPatient as any);
            jest.spyOn(PatientRepository, 'find').mockResolvedValue([mockPatient] as any);
            jest.spyOn(PrestationRepository, 'findByPatientId').mockResolvedValue([]);

            const byIdBundle = await (PatientService as any).mcode(
                { base_version: mockVersion, id: patientId },
                {}
            );
            expect(byIdBundle.resourceType).toBe('Bundle');
            expect(byIdBundle.type).toBe('collection');

            const byIdentifierBundle = await (PatientService as any).mcodeByIdentifier(
                { base_version: mockVersion, identifier: '25678901' },
                {}
            );
            expect(byIdentifierBundle.resourceType).toBe('Bundle');
            expect(byIdentifierBundle.meta.profile).toContain(Bundle.MCODE_PATIENT_BUNDLE_PROFILE);
        });
    });
});
