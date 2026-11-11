import { formatFHIRDateTime } from '../utils/fhirDate';
import { escapeHtml } from '../utils/escapeHtml';

export const MCODE_PRIMARY_CANCER_PROFILE =
    'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition';
export const MCODE_SECONDARY_CANCER_PROFILE =
    'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-secondary-cancer-condition';
export const IPS_CONDITION_PROFILE =
    'http://hl7.org/fhir/uv/ips/StructureDefinition/Condition-uv-ips';

export const MCODE_HISTOLOGY_EXTENSION_URL =
    'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-histology-morphology-behavior';
export const CONDITION_RELATED_EXTENSION_URL =
    'http://hl7.org/fhir/StructureDefinition/condition-related';

export interface SnomedCodingInput {
    conceptId: string | number;
    term?: string;
    fsn?: string;
}

export interface ConditionEncodeOptions {
    profile?: string;
    bodySiteConcepts?: SnomedCodingInput[];
    stageAssessmentReferences?: string[];
    stageSummaryConcept?: SnomedCodingInput;
    histologyConcept?: SnomedCodingInput;
    relatedPrimaryCancerReferences?: string[];
}

function mapClinicalStatus(estado?: string): string {
    const normalized = String(estado || '').trim().toLowerCase();
    if (normalized === 'inactivo' || normalized === 'inactive') {
        return 'inactive';
    }
    if (normalized === 'resuelto' || normalized === 'resolved') {
        return 'resolved';
    }
    if (normalized === 'remision' || normalized === 'remisión' || normalized === 'remission') {
        return 'remission';
    }
    if (normalized === 'recaida' || normalized === 'recaída' || normalized === 'relapse') {
        return 'relapse';
    }
    if (normalized === 'recurrencia' || normalized === 'recurrence') {
        return 'recurrence';
    }
    return 'active';
}

function toSnomedCodeableConcept(concept: SnomedCodingInput) {
    const display = concept.term || concept.fsn;
    return {
        coding: [
            {
                system: 'http://snomed.info/sct',
                code: String(concept.conceptId),
                ...(display && { display })
            }
        ],
        ...(display && { text: display })
    };
}

/**
 * Transforma un registro RUP de trastorno/diagnóstico a un recurso FHIR Condition (IPS o mCODE).
 * @param patientReference Referencia al paciente (fullUrl o Patient/:id)
 * @param registro Registro RUP a transformar a FHIR
 * @param options Opciones adicionales para perfiles como mCODE Primary/Secondary Cancer Condition
 */
export function encode(
    patientReference: any,
    registro: any,
    options: ConditionEncodeOptions = {}
) {
    const clinicalStatusCode = mapClinicalStatus(registro?.valor?.estado);
    const createdAtIso = formatFHIRDateTime(
        registro?.valor?.fechaInicio ?? registro?.createdAt
    );
    const recordedAtIso = formatFHIRDateTime(registro?.createdAt);
    const profileUrl = options.profile || IPS_CONDITION_PROFILE;

    const condition: any = {
        resourceType: 'Condition',
        id: registro._id ?? registro.id,
        meta: {
            profile: [profileUrl]
        },
        category: [
            {
                coding: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                        code: 'problem-list-item',
                        display: 'Problem List Item'
                    },
                    {
                        system: 'http://loinc.org',
                        code: '75326-9'
                    }
                ]
            }
        ],
        subject: {
            reference: patientReference
        },
        onsetDateTime: createdAtIso ?? new Date().toISOString(),
        verificationStatus: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                    code: 'confirmed'
                }
            ]
        },
        clinicalStatus: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                    code: clinicalStatusCode
                }
            ]
        },
        code: {
            coding: [
                {
                    system: 'http://snomed.info/sct',
                    code: String(registro.concepto?.conceptId ?? '')
                }
            ],
            text: registro.concepto?.term || registro.concepto?.fsn
        },
        recordedDate: recordedAtIso,
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: Problema: </p><p>${escapeHtml(registro.nombre || registro.concepto?.term || '')}</p></div>`
        }
    };

    if (registro.valor?.evolucion) {
        condition.note = [
            {
                text: String(registro.valor.evolucion)
            }
        ];
    }

    const extensions: any[] = [];
    if (options.histologyConcept?.conceptId) {
        extensions.push({
            url: MCODE_HISTOLOGY_EXTENSION_URL,
            valueCodeableConcept: toSnomedCodeableConcept(options.histologyConcept)
        });
    }

    if (options.relatedPrimaryCancerReferences && options.relatedPrimaryCancerReferences.length > 0) {
        options.relatedPrimaryCancerReferences.forEach(ref => {
            if (ref) {
                extensions.push({
                    url: CONDITION_RELATED_EXTENSION_URL,
                    valueReference: { reference: ref }
                });
            }
        });
    }

    if (extensions.length > 0) {
        condition.extension = extensions;
    }

    if (options.bodySiteConcepts && options.bodySiteConcepts.length > 0) {
        condition.bodySite = options.bodySiteConcepts
            .filter(bs => !!bs?.conceptId)
            .map(toSnomedCodeableConcept);
    }

    if (
        (options.stageAssessmentReferences && options.stageAssessmentReferences.length > 0) ||
        options.stageSummaryConcept?.conceptId
    ) {
        const stageEntry: any = {};
        if (options.stageSummaryConcept?.conceptId) {
            stageEntry.summary = toSnomedCodeableConcept(options.stageSummaryConcept);
        }
        if (options.stageAssessmentReferences && options.stageAssessmentReferences.length > 0) {
            stageEntry.assessment = options.stageAssessmentReferences.map(ref => ({
                reference: ref
            }));
        }
        condition.stage = [stageEntry];
    }

    return condition;
}

export function encodePrimaryCancerCondition(
    patientReference: any,
    registro: any,
    options: Omit<ConditionEncodeOptions, 'profile'> = {}
) {
    return encode(patientReference, registro, {
        ...options,
        profile: MCODE_PRIMARY_CANCER_PROFILE
    });
}

export function encodeSecondaryCancerCondition(
    patientReference: any,
    registro: any,
    options: Omit<ConditionEncodeOptions, 'profile'> = {}
) {
    return encode(patientReference, registro, {
        ...options,
        profile: MCODE_SECONDARY_CANCER_PROFILE
    });
}
