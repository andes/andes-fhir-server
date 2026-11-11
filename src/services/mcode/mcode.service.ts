import { ObjectId } from 'mongodb';
import {
    Bundle,
    Condition,
    Observation,
    Patient as fhirPac,
    Procedure,
    getDominio
} from '../../encoders';
import { resolveSchema, ServerError } from '@bluehalo/node-fhir-server-core';
import { snowstormService } from '../snomed/snowstorm.service';
import { createResource, fullurl } from '../../utils/data.util';
import { pruneEmpty } from '../../utils/pruneFhir';
import PrestationRepository from '../../repositories/prestation.repository';
import PatientRepository from '../../repositories/patient.repository';
import { FhirIdentifierSystems, resolveIdentifierSystem } from '../../constants';
import { SnomedCodingInput } from '../../encoders/lib/condition';

const getPatientSchema = (base_version: string) => resolveSchema(base_version, 'Patient');

export interface FlattenedRupRecord {
    registro: any;
    prestacionId: string;
    ejecucionFecha?: Date | string;
    parentRegistroId?: string;
}

export interface ExtractedMcodeResources {
    patient: any;
    conditions: any[];
    observations: any[];
    procedures: any[];
}

const PRIMARY_CANCER_TERM_REGEX =
    /neoplasia|carcinoma|adenocarcinoma|sarcoma|melanoma|linfoma|leucemia|mieloma|blastoma|tumor maligno|cáncer|cancer/i;
const SECONDARY_CANCER_TERM_REGEX =
    /metástasis|metastasis|metastásic|metastasic|neoplasia maligna secundaria/i;
const BENIGN_TERM_REGEX = /\bbenign[oa]\b/i;
const RADIOTHERAPY_TERM_REGEX =
    /radioterapia|teleterapia|braquiterapia|terapia de radiación|irradiación/i;
const SURGICAL_OR_ONCO_PROC_TERM_REGEX =
    /biopsia|escisión|resección|mastectomía|colectomía|extirpación|ablación|cirugía|quirúrgic|ectomía|ectomia|ostomía|ostomia/i;

function getRecordText(registro: any): string {
    return `${registro?.concepto?.term || ''} ${registro?.concepto?.fsn || ''} ${registro?.nombre || ''}`.trim();
}

function isPrimaryCancerByTerm(registro: any): boolean {
    const semTag = String(registro?.concepto?.semanticTag ?? '').toLowerCase();
    if (semTag !== 'trastorno' && semTag !== 'hallazgo') {
        return false;
    }
    const text = getRecordText(registro);
    return (
        PRIMARY_CANCER_TERM_REGEX.test(text) &&
        !SECONDARY_CANCER_TERM_REGEX.test(text) &&
        !BENIGN_TERM_REGEX.test(text)
    );
}

function isSecondaryCancerByTerm(registro: any): boolean {
    const semTag = String(registro?.concepto?.semanticTag ?? '').toLowerCase();
    if (semTag !== 'trastorno' && semTag !== 'hallazgo') {
        return false;
    }
    const text = getRecordText(registro);
    return SECONDARY_CANCER_TERM_REGEX.test(text);
}

function isRadiotherapyByTerm(registro: any): boolean {
    const semTag = String(registro?.concepto?.semanticTag ?? '').toLowerCase();
    if (semTag !== 'procedimiento' && semTag !== 'régimen/tratamiento') {
        return false;
    }
    return RADIOTHERAPY_TERM_REGEX.test(getRecordText(registro));
}

function isSurgicalOrBiopsyByTerm(registro: any): boolean {
    const semTag = String(registro?.concepto?.semanticTag ?? '').toLowerCase();
    if (semTag !== 'procedimiento') {
        return false;
    }
    return SURGICAL_OR_ONCO_PROC_TERM_REGEX.test(getRecordText(registro));
}

/**
 * Limpia referencias del estilo "Patient/123" o "https://.../Patient/123" devolviendo solo el ID.
 */
export function cleanPatientReference(ref?: string): string {
    if (!ref) {
        return '';
    }
    return String(ref).trim().replace(/^(?:.*\/)?Patient\//, '');
}

/**
 * Resuelve un documento de paciente en MongoDB a partir de los parámetros de búsqueda
 * estándar en recursos clínicos (patient, subject, patient.identifier, identifier).
 */
export async function resolvePatientFromClinicalSearch(
    args: Record<string, any> = {},
    rawQuery: Record<string, any> = {}
): Promise<any | null> {
    const patientParam =
        args['patient'] ??
        args['subject'] ??
        rawQuery['patient'] ??
        rawQuery['subject'];

    const identifierParam =
        args['patient.identifier'] ??
        args['patient:identifier'] ??
        args['subject.identifier'] ??
        args['subject:identifier'] ??
        args['identifier'] ??
        rawQuery['patient.identifier'] ??
        rawQuery['patient:identifier'] ??
        rawQuery['subject.identifier'] ??
        rawQuery['subject:identifier'] ??
        rawQuery['identifier'];

    if (patientParam) {
        const cleanPatId = cleanPatientReference(patientParam);
        return await PatientRepository.findById(cleanPatId);
    }

    if (identifierParam) {
        const rawIdent = String(identifierParam).trim();
        const [sysPart, valPart] = rawIdent.includes('|')
            ? rawIdent.split('|')
            : ['', rawIdent];
        const canonicalSys = resolveIdentifierSystem(sysPart);

        if (
            canonicalSys === FhirIdentifierSystems.ANDES_ID ||
            (sysPart && canonicalSys === resolveIdentifierSystem(getDominio()))
        ) {
            return await PatientRepository.findById(valPart.trim());
        }

        const query = PatientRepository.buildQuery({ identifier: rawIdent });
        const patients = await PatientRepository.find(query, { limit: 1 });
        return patients?.[0] ?? null;
    }

    return null;
}

/**
 * Filtra recursos FHIR en memoria según parámetros comunes (_id, code, category, status, clinical-status, _profile).
 */
export function filterClinicalResources(
    resources: any[],
    args: Record<string, any> = {},
    rawQuery: Record<string, any> = {}
): any[] {
    const idParam = args['_id'] ?? args['id'] ?? rawQuery['_id'] ?? rawQuery['id'];
    const codeParam = args['code'] ?? rawQuery['code'];
    const categoryParam = args['category'] ?? rawQuery['category'];
    const statusParam = args['status'] ?? rawQuery['status'];
    const clinicalStatusParam =
        args['clinical-status'] ??
        args['clinical_status'] ??
        rawQuery['clinical-status'];
    const profileParam = args['_profile'] ?? rawQuery['_profile'];

    return resources.filter(res => {
        if (idParam) {
            const targetId = String(idParam).trim();
            if (String(res.id) !== targetId) {
                return false;
            }
        }

        if (profileParam) {
            const targetProfile = String(profileParam).trim();
            const profiles: string[] = res.meta?.profile || [];
            if (!profiles.some(p => p === targetProfile || p.endsWith(targetProfile))) {
                return false;
            }
        }

        if (statusParam) {
            const targetStatus = String(statusParam).trim().toLowerCase();
            if (String(res.status || '').toLowerCase() !== targetStatus) {
                return false;
            }
        }

        if (clinicalStatusParam) {
            const targetClinStatus = String(clinicalStatusParam).includes('|')
                ? String(clinicalStatusParam).split('|').pop()!.trim().toLowerCase()
                : String(clinicalStatusParam).trim().toLowerCase();
            const codes: any[] = res.clinicalStatus?.coding || [];
            if (!codes.some(c => String(c.code || '').toLowerCase() === targetClinStatus)) {
                return false;
            }
        }

        if (codeParam) {
            const targetCode = String(codeParam).includes('|')
                ? String(codeParam).split('|').pop()!.trim()
                : String(codeParam).trim();
            const codings: any[] = res.code?.coding || [];
            if (!codings.some(c => String(c.code) === targetCode)) {
                return false;
            }
        }

        if (categoryParam) {
            const targetCat = String(categoryParam).includes('|')
                ? String(categoryParam).split('|').pop()!.trim().toLowerCase()
                : String(categoryParam).trim().toLowerCase();
            const categories: any[] = Array.isArray(res.category) ? res.category : [];
            const matchedCat = categories.some(cat =>
                (cat.coding || []).some(
                    (c: any) => String(c.code || '').toLowerCase() === targetCat
                )
            );
            if (!matchedCat) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Recorre recursivamente los registros de una prestación (incluyendo moléculas y secciones)
 * tal como define PrestacionSchema.methods.getRegistros(true) en ANDES RUP.
 */
export function flattenRegistrosFromPrestacion(prestacion: any): FlattenedRupRecord[] {
    const result: FlattenedRupRecord[] = [];
    const prestacionId = String(prestacion?._id ?? prestacion?.id ?? '');
    const ejecucionFecha = prestacion?.ejecucion?.fecha ?? prestacion?.createdAt;
    const baseRegistros = prestacion?.ejecucion?.registros;

    if (!Array.isArray(baseRegistros)) {
        return result;
    }

    const traverse = (registros: any[], parentId?: string) => {
        for (const reg of registros) {
            if (!reg) {
                continue;
            }
            const regId = String(
                reg._id ?? reg.id ?? reg.concepto?._id ?? reg.concepto?.id ?? ''
            );
            if (!reg.isSection) {
                result.push({
                    registro: reg,
                    prestacionId,
                    ejecucionFecha,
                    parentRegistroId: parentId
                });
            }
            if (Array.isArray(reg.registros) && reg.registros.length > 0) {
                traverse(reg.registros, reg.isSection ? parentId : (regId || parentId));
            }
        }
    };

    traverse(baseRegistros);
    return result;
}

function deduplicateByConceptId(items: FlattenedRupRecord[]): FlattenedRupRecord[] {
    const mapping: Record<string, FlattenedRupRecord> = {};
    const sorted = [...items].sort((a, b) => {
        const dateA = new Date(a.registro?.createdAt ?? a.ejecucionFecha ?? 0).getTime();
        const dateB = new Date(b.registro?.createdAt ?? b.ejecucionFecha ?? 0).getTime();
        return dateB - dateA;
    });

    for (const item of sorted) {
        const conceptId = String(item.registro?.concepto?.conceptId ?? '');
        if (conceptId && !mapping[conceptId]) {
            mapping[conceptId] = item;
        }
    }
    return Object.values(mapping);
}

function extractBodySitesForRecord(
    record: any,
    allRecordsInPrestacion: FlattenedRupRecord[]
): SnomedCodingInput[] {
    const bodySites: SnomedCodingInput[] = [];
    const seen = new Set<string>();

    const addIfBodyStructure = (concept: any) => {
        if (!concept?.conceptId) {
            return;
        }
        const semTag = String(concept.semanticTag ?? '').toLowerCase();
        if (semTag === 'estructura corporal' && !seen.has(String(concept.conceptId))) {
            seen.add(String(concept.conceptId));
            bodySites.push({
                conceptId: String(concept.conceptId),
                term: concept.term,
                fsn: concept.fsn
            });
        }
    };

    if (Array.isArray(record?.registros)) {
        for (const child of record.registros) {
            addIfBodyStructure(child?.concepto);
        }
    }

    if (Array.isArray(record?.relacionadoCon)) {
        for (const rel of record.relacionadoCon) {
            if (rel && typeof rel === 'object') {
                addIfBodyStructure(rel.concepto ?? rel);
                const relId = String(rel._id ?? rel.id ?? '');
                if (relId) {
                    const matched = allRecordsInPrestacion.find(
                        r => String(r.registro?._id ?? r.registro?.id) === relId
                    );
                    if (matched) {
                        addIfBodyStructure(matched.registro?.concepto);
                    }
                }
            }
        }
    }

    return bodySites;
}

function isEcogRecord(registro: any): boolean {
    const conceptId = String(registro?.concepto?.conceptId ?? '');
    const term = String(registro?.concepto?.term ?? registro?.nombre ?? '').toLowerCase();
    return (
        conceptId === '423740007' ||
        conceptId === '424122007' ||
        conceptId === '89247-1' ||
        term.includes('ecog')
    );
}

function isDiseaseStatusRecord(registro: any): boolean {
    const conceptId = String(registro?.concepto?.conceptId ?? '');
    return (
        conceptId === '268910001' ||
        conceptId === '359746009' ||
        conceptId === '271299001' ||
        conceptId === '709137006' ||
        conceptId === '97509-4'
    );
}

function resolveRecordId(registro: any, fallbackPrefix: string, index: number): string {
    return String(
        registro?._id ??
        registro?.id ??
        registro?.concepto?._id ??
        registro?.concepto?.id ??
        `${fallbackPrefix}-${index + 1}`
    );
}

export class McodeService {
    /**
     * Extrae todos los recursos mCODE (CancerPatient, Condition, Observation, Procedure)
     * asociados a un paciente a partir de sus prestaciones RUP validadas.
     */
    static async extractResources(
        version: string,
        patientRaw: any
    ): Promise<ExtractedMcodeResources> {
        if (!patientRaw) {
            throw new ServerError('Patient not found', {
                statusCode: 404,
                resourceType: 'OperationOutcome',
                issue: [
                    {
                        severity: 'error',
                        code: 'not-found',
                        diagnostics: 'Patient not found'
                    }
                ]
            });
        }

        const pacienteId = patientRaw._id?.toString() || patientRaw.id;

        // 1. Obtener prestaciones validadas de la historia clínica del paciente
        const prestaciones = await PrestationRepository.findByPatientId(pacienteId);

        // 2. Aplanar todos los registros RUP (incluyendo moléculas y secciones)
        const allFlattened: FlattenedRupRecord[] = [];
        for (const prestacion of prestaciones) {
            allFlattened.push(...flattenRegistrosFromPrestacion(prestacion));
        }

        const candidateConceptIds = Array.from(
            new Set(
                allFlattened
                    .map(item => String(item.registro?.concepto?.conceptId ?? '').trim())
                    .filter(Boolean)
            )
        );

        const [
            primaryCancerConcepts,
            secondaryCancerConcepts,
            tnmStagingConcepts,
            radiotherapyConcepts,
            surgicalConcepts
        ] = candidateConceptIds.length > 0
            ? await Promise.all([
                snowstormService.getSnomedPrimaryCancers(false, candidateConceptIds),
                snowstormService.getSnomedSecondaryCancers(false, candidateConceptIds),
                snowstormService.getSnomedTnmStaging(false, candidateConceptIds),
                snowstormService.getSnomedRadiotherapyProcedures(false, candidateConceptIds),
                snowstormService.getSnomedSurgicalProcedures(false, candidateConceptIds)
            ])
            : [[], [], [], [], []];

        const primaryCancerSet = new Set(
            (primaryCancerConcepts || []).map(c => String(c.conceptId))
        );
        const secondaryCancerSet = new Set(
            (secondaryCancerConcepts || []).map(c => String(c.conceptId))
        );
        const tnmStagingSet = new Set(
            (tnmStagingConcepts || []).map(c => String(c.conceptId))
        );
        const radiotherapySet = new Set(
            (radiotherapyConcepts || []).map(c => String(c.conceptId))
        );
        const surgicalSet = new Set(
            (surgicalConcepts || []).map(c => String(c.conceptId))
        );

        const primaryCancerRecords: FlattenedRupRecord[] = [];
        const secondaryCancerRecords: FlattenedRupRecord[] = [];
        const tnmRecords: FlattenedRupRecord[] = [];
        const ecogRecords: FlattenedRupRecord[] = [];
        const diseaseStatusRecords: FlattenedRupRecord[] = [];
        const radiotherapyRecords: FlattenedRupRecord[] = [];
        const surgicalRecords: FlattenedRupRecord[] = [];

        for (const item of allFlattened) {
            const reg = item.registro;
            const conceptId = String(reg?.concepto?.conceptId ?? '');
            const semTag = String(reg?.concepto?.semanticTag ?? '').toLowerCase();

            if (!conceptId) {
                continue;
            }

            if (secondaryCancerSet.has(conceptId) || isSecondaryCancerByTerm(reg)) {
                secondaryCancerRecords.push(item);
            } else if (primaryCancerSet.has(conceptId) || isPrimaryCancerByTerm(reg)) {
                primaryCancerRecords.push(item);
            } else if (
                tnmStagingSet.has(conceptId) ||
                semTag === 'escala de estadificación'
            ) {
                tnmRecords.push(item);
            } else if (isEcogRecord(reg)) {
                ecogRecords.push(item);
            } else if (isDiseaseStatusRecord(reg)) {
                diseaseStatusRecords.push(item);
            } else if (radiotherapySet.has(conceptId) || isRadiotherapyByTerm(reg)) {
                radiotherapyRecords.push(item);
            } else if (surgicalSet.has(conceptId) || isSurgicalOrBiopsyByTerm(reg)) {
                surgicalRecords.push(item);
            }
        }

        const PatientSchema = getPatientSchema(version);
        const encodedCancerPatient = patientRaw.resourceType === 'Patient'
            ? {
                ...patientRaw,
                meta: {
                    ...patientRaw.meta,
                    profile: [fhirPac.MCODE_CANCER_PATIENT_PROFILE]
                }
            }
            : fhirPac.encodeCancerPatient(patientRaw);
        const FHIRPatient = new PatientSchema(encodedCancerPatient);
        const patientUrl = fullurl(FHIRPatient);

        const uniquePrimaryRecords = deduplicateByConceptId(primaryCancerRecords);
        const uniqueSecondaryRecords = deduplicateByConceptId(secondaryCancerRecords);
        const uniqueTnmRecords = deduplicateByConceptId(tnmRecords);

        const primaryConditionIdByRecordId = new Map<string, string>();
        const primaryConditionFullUrls: string[] = [];

        uniquePrimaryRecords.forEach((item, index) => {
            const condId = resolveRecordId(item.registro, 'primary-cancer', index);
            item.registro._id = condId;
            const condUrl = fullurl({ resourceType: 'Condition', id: condId });
            primaryConditionIdByRecordId.set(condId, condUrl);
            primaryConditionFullUrls.push(condUrl);
        });

        const stageAssessmentUrlsByPrimaryUrl = new Map<string, string[]>();
        const FHIRObservations: any[] = [];

        uniqueTnmRecords.forEach((item, index) => {
            const obsId = resolveRecordId(item.registro, 'tnm-stage', index);
            const normalizedReg = { ...item.registro, _id: obsId };

            let focusUrls: string[] = [];
            if (item.parentRegistroId && primaryConditionIdByRecordId.has(item.parentRegistroId)) {
                focusUrls = [primaryConditionIdByRecordId.get(item.parentRegistroId)!];
            } else if (primaryConditionFullUrls.length > 0) {
                focusUrls = [primaryConditionFullUrls[0]];
            }

            const tnmObs = Observation.encodeTnmStageGroup(patientUrl, normalizedReg, {
                effectiveDate: item.ejecucionFecha,
                focusReferences: focusUrls
            });
            const tnmObsUrl = fullurl(tnmObs);

            focusUrls.forEach(pUrl => {
                const list = stageAssessmentUrlsByPrimaryUrl.get(pUrl) || [];
                list.push(tnmObsUrl);
                stageAssessmentUrlsByPrimaryUrl.set(pUrl, list);
            });

            FHIRObservations.push(tnmObs);
        });

        const FHIRConditions: any[] = [];

        for (const item of uniquePrimaryRecords) {
            const condId = String(item.registro._id);
            const condUrl = primaryConditionIdByRecordId.get(condId)!;
            const bodySiteConcepts = extractBodySitesForRecord(item.registro, allFlattened);
            const stageAssessmentReferences = stageAssessmentUrlsByPrimaryUrl.get(condUrl) || [];

            const registroNormalizado = {
                ...item.registro,
                createdAt: item.registro.createdAt ?? item.ejecucionFecha,
                valor: {
                    estado: item.registro.valor?.estado || 'active',
                    evolucion: item.registro.valor?.evolucion || '',
                    ...item.registro.valor
                }
            };

            const primaryCond = Condition.encodePrimaryCancerCondition(
                patientUrl,
                registroNormalizado,
                {
                    bodySiteConcepts,
                    stageAssessmentReferences
                }
            );
            FHIRConditions.push(primaryCond);

            // Reflejamos siempre el estado evolutivo (CancerDiseaseStatus) de cada condición primaria
            const statusObs = Observation.encodeCancerDiseaseStatus(
                patientUrl,
                {
                    ...registroNormalizado,
                    _id: `${condId}-status`
                },
                {
                    effectiveDate: item.ejecucionFecha,
                    focusReferences: [condUrl]
                }
            );
            FHIRObservations.push(statusObs);
        }

        uniqueSecondaryRecords.forEach((item, index) => {
            const condId = resolveRecordId(item.registro, 'secondary-cancer', index);
            const bodySiteConcepts = extractBodySitesForRecord(item.registro, allFlattened);
            const registroNormalizado = {
                ...item.registro,
                _id: condId,
                createdAt: item.registro.createdAt ?? item.ejecucionFecha,
                valor: {
                    estado: item.registro.valor?.estado || 'active',
                    evolucion: item.registro.valor?.evolucion || '',
                    ...item.registro.valor
                }
            };

            const secondaryCond = Condition.encodeSecondaryCancerCondition(
                patientUrl,
                registroNormalizado,
                {
                    bodySiteConcepts,
                    relatedPrimaryCancerReferences: primaryConditionFullUrls
                }
            );
            FHIRConditions.push(secondaryCond);
        });

        deduplicateByConceptId(diseaseStatusRecords).forEach((item, index) => {
            const obsId = resolveRecordId(item.registro, 'disease-status', index);
            const obs = Observation.encodeCancerDiseaseStatus(
                patientUrl,
                { ...item.registro, _id: obsId },
                {
                    effectiveDate: item.ejecucionFecha,
                    focusReferences: primaryConditionFullUrls
                }
            );
            FHIRObservations.push(obs);
        });

        deduplicateByConceptId(ecogRecords).forEach((item, index) => {
            const obsId = resolveRecordId(item.registro, 'ecog', index);
            const obs = Observation.encodeEcogPerformanceStatus(
                patientUrl,
                { ...item.registro, _id: obsId },
                {
                    effectiveDate: item.ejecucionFecha
                }
            );
            FHIRObservations.push(obs);
        });

        const FHIRProcedures: any[] = [];
        const hasCancerContext = primaryConditionFullUrls.length > 0 || uniqueSecondaryRecords.length > 0;

        if (hasCancerContext) {
            deduplicateByConceptId(surgicalRecords).forEach((item, index) => {
                const procId = resolveRecordId(item.registro, 'surg-proc', index);
                const bodySiteConcepts = extractBodySitesForRecord(item.registro, allFlattened);
                const proc = Procedure.encodeSurgicalProcedure(
                    patientUrl,
                    { ...item.registro, _id: procId },
                    {
                        performedDate: item.ejecucionFecha,
                        reasonReferences: primaryConditionFullUrls,
                        bodySiteConcepts
                    }
                );
                FHIRProcedures.push(proc);
            });
        }

        deduplicateByConceptId(radiotherapyRecords).forEach((item, index) => {
            const procId = resolveRecordId(item.registro, 'radio-proc', index);
            const bodySiteConcepts = extractBodySitesForRecord(item.registro, allFlattened);
            const proc = Procedure.encodeRadiotherapyCourseSummary(
                patientUrl,
                { ...item.registro, _id: procId },
                {
                    performedDate: item.ejecucionFecha,
                    reasonReferences: primaryConditionFullUrls,
                    bodySiteConcepts
                }
            );
            FHIRProcedures.push(proc);
        });

        return {
            patient: FHIRPatient,
            conditions: FHIRConditions,
            observations: FHIRObservations,
            procedures: FHIRProcedures
        };
    }

    /**
     * Construye un mCODE Patient Bundle (collection) con los recursos oncológicos
     * del paciente extraídos de sus prestaciones RUP validadas.
     */
    static async build(version: string, patientRaw: any): Promise<any> {
        const { patient, conditions, observations, procedures } =
            await McodeService.extractResources(version, patientRaw);

        const BundleID = new ObjectId();
        const rawResources = [
            createResource(patient),
            ...conditions.map(createResource),
            ...observations.map(createResource),
            ...procedures.map(createResource)
        ];

        const mcodeBundle = Bundle.encodeMcodePatientBundle(
            BundleID,
            rawResources.filter(Boolean)
        );

        return pruneEmpty(mcodeBundle);
    }
}

export default McodeService;
