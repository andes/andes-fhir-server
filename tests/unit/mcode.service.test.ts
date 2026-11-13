import { ObjectId } from 'mongodb';
import { McodeService, flattenRegistrosFromPrestacion } from '../../src/services/mcode/mcode.service';
import PrestationRepository from '../../src/repositories/prestation.repository';
import PatientRepository from '../../src/repositories/patient.repository';
import PatientService from '../../src/services/patient/patient.service';
import ConditionService from '../../src/services/condition/condition.service';
import ObservationService from '../../src/services/observation/observation.service';
import ProcedureService from '../../src/services/procedure/procedure.service';
import AllergyIntoleranceService from '../../src/services/allergyintolerance/allergyintolerance.service';
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
        jest.spyOn(snowstormService, 'getSnomedAllergiesAndIntolerances').mockResolvedValue([
            { conceptId: '300916003', term: 'alergia a penicilina', fsn: 'alergia a penicilina (hallazgo)', semanticTag: 'hallazgo' },
            { conceptId: '235719003', term: 'intolerancia a la lactosa', fsn: 'intolerancia a la lactosa (trastorno)', semanticTag: 'trastorno' }
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

        it('should return all clinical resources by semanticTag without filter, deduplicate keeping the most recent, and filter by _profile=mcode when requested', async () => {
            const mockPrestaciones = [
                {
                    _id: new ObjectId(),
                    paciente: { id: new ObjectId(patientId), nombre: 'MARIA', apellido: 'LOPEZ', documento: '25678901' },
                    estadoActual: { tipo: 'validada' },
                    estados: [{ tipo: 'validada' }],
                    ejecucion: {
                        fecha: new Date('2026-01-10T10:00:00Z'),
                        registros: [
                            // Trastorno general antiguo (será reemplazado por la evolución más reciente)
                            {
                                _id: 'asma-old',
                                createdAt: new Date('2026-01-10T10:00:00Z'),
                                valor: { estado: 'activo', evolucion: 'Crisis leve' },
                                concepto: { conceptId: '195967001', term: 'asma', semanticTag: 'trastorno' }
                            },
                            // Signo vital antiguo (será reemplazado por el control más reciente)
                            {
                                _id: 'peso-old',
                                createdAt: new Date('2026-01-10T10:00:00Z'),
                                valor: 68.5,
                                params: { unit: 'kg' },
                                concepto: { conceptId: '27113001', term: 'peso corporal', semanticTag: 'entidad observable' }
                            }
                        ]
                    }
                },
                {
                    _id: new ObjectId(),
                    paciente: { id: new ObjectId(patientId), nombre: 'MARIA', apellido: 'LOPEZ', documento: '25678901' },
                    estadoActual: { tipo: 'validada' },
                    estados: [{ tipo: 'validada' }],
                    ejecucion: {
                        fecha: new Date('2026-05-15T12:00:00Z'),
                        registros: [
                            // Trastorno general más reciente
                            {
                                _id: 'asma-new',
                                createdAt: new Date('2026-05-15T12:00:00Z'),
                                valor: { estado: 'resuelto', evolucion: 'Controlada sin medicación' },
                                concepto: { conceptId: '195967001', term: 'asma', semanticTag: 'trastorno' }
                            },
                            // Condición oncológica primaria
                            {
                                _id: 'prim-reg-1',
                                createdAt: new Date('2026-05-15T12:00:00Z'),
                                valor: { estado: 'activo' },
                                concepto: { conceptId: '254837009', term: 'neoplasia maligna de mama', semanticTag: 'trastorno' }
                            },
                            // Alergia e intolerancia (no deben filtrarse hacia Condition u Observation)
                            {
                                _id: 'alg-penicilina',
                                createdAt: new Date('2026-05-15T12:00:00Z'),
                                concepto: { conceptId: '300916003', term: 'alergia a penicilina', semanticTag: 'hallazgo' }
                            },
                            {
                                _id: 'intol-lactosa',
                                createdAt: new Date('2026-05-15T12:00:00Z'),
                                concepto: { conceptId: '235719003', term: 'intolerancia a la lactosa', semanticTag: 'trastorno' }
                            },
                            // Molécula contenedora de signos vitales (no debe listarse como Observation vacía)
                            {
                                _id: 'mol-signos-vitales',
                                hasSections: true,
                                concepto: { conceptId: '46680005', term: 'signos vitales', semanticTag: 'elemento de registro' },
                                registros: [
                                    {
                                        _id: 'peso-new',
                                        createdAt: new Date('2026-05-15T12:00:00Z'),
                                        valor: 71.2,
                                        params: { unit: 'kg' },
                                        concepto: { conceptId: '27113001', term: 'peso corporal', semanticTag: 'entidad observable' }
                                    },
                                    {
                                        _id: 'ecog-reg-1',
                                        createdAt: new Date('2026-05-15T12:00:00Z'),
                                        valor: 1,
                                        concepto: { conceptId: '423740007', term: 'ECOG', semanticTag: 'entidad observable' }
                                    }
                                ]
                            },
                            // Procedimiento general (no oncológico)
                            {
                                _id: 'proc-nebulizacion',
                                createdAt: new Date('2026-05-15T12:00:00Z'),
                                concepto: { conceptId: '56251003', term: 'terapia con nebulizador', semanticTag: 'procedimiento' }
                            },
                            // Procedimiento oncológico
                            {
                                _id: 'radio-reg-1',
                                createdAt: new Date('2026-05-15T12:00:00Z'),
                                concepto: { conceptId: '33195004', term: 'radioterapia con haz externo', semanticTag: 'procedimiento' }
                            }
                        ]
                    }
                }
            ];

            jest.spyOn(PatientRepository, 'findById').mockResolvedValue(mockPatient as any);
            jest.spyOn(PrestationRepository, 'findByPatientId').mockResolvedValue(mockPrestaciones as any);

            // 1. Condition sin filtro: devuelve tanto Asma (el más reciente) como Cáncer de mama, sin alergias
            const allCondBundle = await ConditionService.search(
                { base_version: mockVersion, patient: patientId },
                {}
            );
            expect(allCondBundle.total).toBe(2);
            const condIds = allCondBundle.entry.map((e: any) => e.resource.id);
            expect(condIds).toContain('prim-reg-1');
            expect(condIds).toContain('asma-new');
            expect(condIds).not.toContain('asma-old');
            const asmaRes = allCondBundle.entry.find((e: any) => e.resource.id === 'asma-new').resource;
            expect(asmaRes.clinicalStatus.coding[0].code).toBe('resolved');

            // Condition con _profile=mcode: solo devuelve Cáncer de mama
            const mcodeCondBundle = await ConditionService.search(
                { base_version: mockVersion, patient: patientId, _profile: 'mcode' },
                {}
            );
            expect(mcodeCondBundle.total).toBe(1);
            expect(mcodeCondBundle.entry[0].resource.id).toBe('prim-reg-1');

            // 2. Observation sin filtro: devuelve Peso (más reciente, con valueQuantity), ECOG y CancerDiseaseStatus
            const allObsBundle = await ObservationService.search(
                { base_version: mockVersion, patient: patientId },
                {}
            );
            expect(allObsBundle.total).toBe(3);
            const pesoObs = allObsBundle.entry.find((e: any) => e.resource.id === 'peso-new')?.resource;
            expect(pesoObs).toBeDefined();
            expect(pesoObs.valueQuantity).toEqual({ value: 71.2, unit: 'kg' });
            expect(allObsBundle.entry.some((e: any) => e.resource.id === 'peso-old')).toBe(false);
            expect(allObsBundle.entry.some((e: any) => e.resource.id === 'mol-signos-vitales')).toBe(false);

            // Observation con _profile=mcode: solo devuelve las 2 observaciones mCODE (ECOG y DiseaseStatus)
            const mcodeObsBundle = await ObservationService.search(
                { base_version: mockVersion, patient: patientId, _profile: 'mcode' },
                {}
            );
            expect(mcodeObsBundle.total).toBe(2);

            // 3. Procedure sin filtro: devuelve tanto la nebulización general como la radioterapia mCODE
            const allProcBundle = await ProcedureService.search(
                { base_version: mockVersion, patient: patientId },
                {}
            );
            expect(allProcBundle.total).toBe(2);
            expect(allProcBundle.entry.map((e: any) => e.resource.id)).toEqual(
                expect.arrayContaining(['proc-nebulizacion', 'radio-reg-1'])
            );

            // Procedure con _profile=mcode: solo devuelve la radioterapia
            const mcodeProcBundle = await ProcedureService.search(
                { base_version: mockVersion, patient: patientId, _profile: 'mcode' },
                {}
            );
            expect(mcodeProcBundle.total).toBe(1);
            expect(mcodeProcBundle.entry[0].resource.id).toBe('radio-reg-1');

            // 4. AllergyIntolerance: devuelve alergia a penicilina (allergy) e intolerancia a la lactosa (intolerance)
            const allergyBundle = await AllergyIntoleranceService.search(
                { base_version: mockVersion, patient: patientId },
                {}
            );
            expect(allergyBundle.total).toBe(2);
            const intolRes = allergyBundle.entry.find((e: any) => e.resource.id === 'intol-lactosa')?.resource;
            expect(intolRes.type).toBe('intolerance');

            // 5. Operación $mcode (McodeService.build): solo incluye recursos mCODE en el bundle oncológico
            const mcodePatientBundle = await McodeService.build(mockVersion, mockPatient);
            const mcodeIds = mcodePatientBundle.entry.map((e: any) => e.resource.id);
            expect(mcodeIds).toContain('prim-reg-1');
            expect(mcodeIds).toContain('ecog-reg-1');
            expect(mcodeIds).toContain('radio-reg-1');
            expect(mcodeIds).not.toContain('asma-new');
            expect(mcodeIds).not.toContain('peso-new');
            expect(mcodeIds).not.toContain('proc-nebulizacion');
            expect(mcodeIds).not.toContain('alg-penicilina');

            // 6. searchById en Condition, Observation, Procedure y AllergyIntolerance
            jest.spyOn(PrestationRepository, 'findByRegistroId').mockResolvedValue(mockPrestaciones[1] as any);

            const singleCond = await ConditionService.searchById({ base_version: mockVersion, id: 'asma-new' });
            expect(singleCond.resourceType).toBe('Condition');
            expect(singleCond.id).toBe('asma-new');

            const singleObs = await ObservationService.searchById({ base_version: mockVersion, id: 'peso-new' });
            expect(singleObs.resourceType).toBe('Observation');
            expect(singleObs.id).toBe('peso-new');

            const singleProc = await ProcedureService.searchById({ base_version: mockVersion, id: 'proc-nebulizacion' });
            expect(singleProc.resourceType).toBe('Procedure');
            expect(singleProc.id).toBe('proc-nebulizacion');

            const singleAllergy = await AllergyIntoleranceService.searchById({ base_version: mockVersion, id: 'alg-penicilina' });
            expect(singleAllergy.resourceType).toBe('AllergyIntolerance');
            expect(singleAllergy.id).toBe('alg-penicilina');
        });
    });
});
