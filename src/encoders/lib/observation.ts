import { formatFHIRDateTime } from '../utils/fhirDate';
import { escapeHtml } from '../utils/escapeHtml';
import { SnomedCodingInput } from './condition';

export const MCODE_TNM_STAGE_GROUP_PROFILE =
    'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tnm-stage-group';
export const MCODE_CANCER_DISEASE_STATUS_PROFILE =
    'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-cancer-disease-status';
export const MCODE_ECOG_PERFORMANCE_STATUS_PROFILE =
    'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-ecog-performance-status';

export interface ObservationEncodeOptions {
    profile?: string;
    focusReferences?: string[];
    hasMemberReferences?: string[];
    effectiveDate?: Date | string;
    performerReferences?: string[];
}

function extractValueConcept(registro: any): SnomedCodingInput | null {
    const val = registro?.valor;
    if (val && typeof val === 'object') {
        if (val.conceptId) {
            return {
                conceptId: val.conceptId,
                term: val.term,
                fsn: val.fsn
            };
        }
        if (val.concepto?.conceptId) {
            return {
                conceptId: val.concepto.conceptId,
                term: val.concepto.term,
                fsn: val.concepto.fsn
            };
        }
    }
    if (registro?.concepto?.conceptId) {
        return {
            conceptId: registro.concepto.conceptId,
            term: registro.concepto.term,
            fsn: registro.concepto.fsn
        };
    }
    return null;
}

/**
 * Codifica un registro RUP como un recurso FHIR Observation general o perfilado para mCODE.
 */
export function encode(
    patientReference: string,
    registro: any,
    options: ObservationEncodeOptions = {}
) {
    const effectiveDateTime =
        formatFHIRDateTime(options.effectiveDate ?? registro?.createdAt) ??
        new Date().toISOString();

    const conceptId = String(registro?.concepto?.conceptId ?? '');
    const display = registro?.concepto?.term || registro?.concepto?.fsn || registro?.nombre || '';

    const observation: any = {
        resourceType: 'Observation',
        id: registro?._id ?? registro?.id,
        ...(options.profile && {
            meta: {
                profile: [options.profile]
            }
        }),
        status: 'final',
        code: {
            coding: [
                {
                    system: 'http://snomed.info/sct',
                    code: conceptId,
                    ...(display && { display })
                }
            ],
            ...(display && { text: display })
        },
        subject: {
            reference: patientReference
        },
        effectiveDateTime,
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Generated Narrative with Details</b></p><p><b>Observación</b>: ${escapeHtml(display)}</p></div>`
        }
    };

    if (options.focusReferences && options.focusReferences.length > 0) {
        observation.focus = options.focusReferences.filter(Boolean).map(ref => ({
            reference: ref
        }));
    }

    if (options.hasMemberReferences && options.hasMemberReferences.length > 0) {
        observation.hasMember = options.hasMemberReferences.filter(Boolean).map(ref => ({
            reference: ref
        }));
    }

    if (options.performerReferences && options.performerReferences.length > 0) {
        observation.performer = options.performerReferences.filter(Boolean).map(ref => ({
            reference: ref
        }));
    }

    const valueConcept = extractValueConcept(registro);
    const unit = registro?.valor?.unidad ?? registro?.params?.unit;

    if (typeof registro?.valor === 'boolean') {
        observation.valueBoolean = registro.valor;
    } else if (typeof registro?.valor === 'number') {
        if (unit) {
            observation.valueQuantity = {
                value: registro.valor,
                unit: String(unit)
            };
        } else if (Number.isInteger(registro.valor)) {
            observation.valueInteger = registro.valor;
        } else {
            observation.valueQuantity = {
                value: registro.valor
            };
        }
    } else if (typeof registro?.valor === 'string' && registro.valor.trim() !== '') {
        observation.valueString = registro.valor.trim();
    } else if (
        registro?.valor &&
        typeof registro.valor === 'object' &&
        registro.valor.valor !== undefined &&
        registro.valor.valor !== null
    ) {
        const innerVal = registro.valor.valor;
        if (typeof innerVal === 'boolean') {
            observation.valueBoolean = innerVal;
        } else if (typeof innerVal === 'number') {
            if (unit) {
                observation.valueQuantity = {
                    value: innerVal,
                    unit: String(unit)
                };
            } else if (Number.isInteger(innerVal)) {
                observation.valueInteger = innerVal;
            } else {
                observation.valueQuantity = {
                    value: innerVal
                };
            }
        } else if (typeof innerVal === 'string' && innerVal.trim() !== '') {
            observation.valueString = innerVal.trim();
        }
    } else if (valueConcept) {
        const valDisplay = valueConcept.term || valueConcept.fsn;
        observation.valueCodeableConcept = {
            coding: [
                {
                    system: 'http://snomed.info/sct',
                    code: String(valueConcept.conceptId),
                    ...(valDisplay && { display: valDisplay })
                }
            ],
            ...(valDisplay && { text: valDisplay })
        };
    }

    return observation;
}

/**
 * Codifica una observación de estadificación TNM según el perfil mCODE TNMStageGroup.
 */
export function encodeTnmStageGroup(
    patientReference: string,
    registro: any,
    options: Omit<ObservationEncodeOptions, 'profile'> = {}
) {
    const obs = encode(patientReference, registro, {
        ...options,
        profile: MCODE_TNM_STAGE_GROUP_PROFILE
    });

    obs.category = [
        {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                    code: 'exam',
                    display: 'Exam'
                }
            ]
        }
    ];

    // En mCODE TNMStageGroup el code representa el tipo de estadificación (ej. 399566009 / LOINC 21908-9)
    // y valueCodeableConcept el estadio concreto (ej. Stage IIA).
    const valueConcept = extractValueConcept(registro);
    if (valueConcept) {
        const valDisplay = valueConcept.term || valueConcept.fsn;
        obs.valueCodeableConcept = {
            coding: [
                {
                    system: 'http://snomed.info/sct',
                    code: String(valueConcept.conceptId),
                    ...(valDisplay && { display: valDisplay })
                }
            ],
            ...(valDisplay && { text: valDisplay })
        };
        delete obs.valueString;
        delete obs.valueInteger;
        delete obs.valueQuantity;
        delete obs.valueBoolean;
    }

    obs.code = {
        coding: [
            {
                system: 'http://snomed.info/sct',
                code: '399566009',
                display: 'Tumor-node-metastasis (TNM) category (observable entity)'
            },
            {
                system: 'http://loinc.org',
                code: '21908-9',
                display: 'Stage group.clinical Cancer'
            }
        ],
        text: registro?.concepto?.term || 'TNM Stage Group'
    };

    return obs;
}

function mapDiseaseStatusConcept(registro: any): { code: string; display: string } {
    const valConceptId = String(
        registro?.valor?.conceptId ??
        registro?.valor?.concepto?.conceptId ??
        registro?.concepto?.conceptId ??
        ''
    );

    if (
        valConceptId === '268910001' ||
        valConceptId === '359746009' ||
        valConceptId === '271299001' ||
        valConceptId === '709137006'
    ) {
        const defaultDisplays: Record<string, string> = {
            '268910001': "Patient's condition improved (finding)",
            '359746009': "Patient's condition stable (finding)",
            '271299001': "Patient's condition worsened (finding)",
            '709137006': "Patient's condition undetermined (finding)"
        };
        return {
            code: valConceptId,
            display:
                registro?.valor?.term ||
                registro?.concepto?.term ||
                defaultDisplays[valConceptId]
        };
    }

    const rawText = String(
        registro?.valor?.estado ?? registro?.valor?.evolucion ?? registro?.valor ?? ''
    )
        .trim()
        .toLowerCase();

    if (rawText.includes('mejor') || rawText.includes('remis') || rawText.includes('resuel')) {
        return { code: '268910001', display: "Patient's condition improved (finding)" };
    }
    if (rawText.includes('peor') || rawText.includes('progres') || rawText.includes('reca')) {
        return { code: '271299001', display: "Patient's condition worsened (finding)" };
    }
    if (rawText.includes('establ') || rawText.includes('activ')) {
        return { code: '359746009', display: "Patient's condition stable (finding)" };
    }

    return { code: '709137006', display: "Patient's condition undetermined (finding)" };
}

/**
 * Codifica el estado evolutivo de la enfermedad oncológica según mCODE CancerDiseaseStatus.
 */
export function encodeCancerDiseaseStatus(
    patientReference: string,
    registro: any,
    options: Omit<ObservationEncodeOptions, 'profile'> = {}
) {
    const obs = encode(patientReference, registro, {
        ...options,
        profile: MCODE_CANCER_DISEASE_STATUS_PROFILE
    });

    obs.category = [
        {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                    code: 'therapy',
                    display: 'Therapy'
                }
            ]
        }
    ];

    obs.code = {
        coding: [
            {
                system: 'http://loinc.org',
                code: '97509-4',
                display: 'Cancer disease progression'
            }
        ],
        text: 'Cancer disease progression'
    };

    const statusMapped = mapDiseaseStatusConcept(registro);
    obs.valueCodeableConcept = {
        coding: [
            {
                system: 'http://snomed.info/sct',
                code: statusMapped.code,
                display: statusMapped.display
            }
        ],
        text: statusMapped.display
    };
    delete obs.valueString;
    delete obs.valueInteger;

    return obs;
}

/**
 * Codifica la escala funcional ECOG según el perfil mCODE ECOGPerformanceStatus.
 */
export function encodeEcogPerformanceStatus(
    patientReference: string,
    registro: any,
    options: Omit<ObservationEncodeOptions, 'profile'> = {}
) {
    const obs = encode(patientReference, registro, {
        ...options,
        profile: MCODE_ECOG_PERFORMANCE_STATUS_PROFILE
    });

    obs.category = [
        {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                    code: 'survey',
                    display: 'Survey'
                }
            ]
        }
    ];

    obs.code = {
        coding: [
            {
                system: 'http://loinc.org',
                code: '89247-1',
                display: 'ECOG Performance Status score'
            }
        ],
        text: 'ECOG Performance Status score'
    };

    const rawVal = registro?.valor?.valor ?? registro?.valor;
    const parsedScore = typeof rawVal === 'number' ? rawVal : parseInt(String(rawVal), 10);
    if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 5) {
        obs.valueInteger = parsedScore;
        delete obs.valueCodeableConcept;
        delete obs.valueString;
    }

    return obs;
}
