import { formatFHIRDateTime } from '../utils/fhirDate';
import { escapeHtml } from '../utils/escapeHtml';
import { SnomedCodingInput } from './condition';

export const MCODE_SURGICAL_PROCEDURE_PROFILE =
    'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-cancer-related-surgical-procedure';
export const MCODE_RADIOTHERAPY_COURSE_SUMMARY_PROFILE =
    'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-radiotherapy-course-summary';
export const MCODE_PROCEDURE_INTENT_EXTENSION_URL =
    'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-procedure-intent';

export interface ProcedureEncodeOptions {
    profile?: string;
    performedDate?: Date | string;
    reasonReferences?: string[];
    bodySiteConcepts?: SnomedCodingInput[];
    intentConcept?: SnomedCodingInput;
    asserterReference?: string;
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
 * Transforma un registro RUP de procedimiento a un recurso FHIR Procedure (general o mCODE).
 */
export function encode(
    patientReference: string,
    registro: any,
    options: ProcedureEncodeOptions = {}
) {
    const performedDateTime =
        formatFHIRDateTime(options.performedDate ?? registro?.createdAt) ??
        new Date().toISOString();

    const conceptId = String(registro?.concepto?.conceptId ?? '');
    const display = registro?.concepto?.term || registro?.concepto?.fsn || registro?.nombre || '';

    const procedure: any = {
        resourceType: 'Procedure',
        id: registro?._id ?? registro?.id,
        ...(options.profile && {
            meta: {
                profile: [options.profile]
            }
        }),
        status: 'completed',
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
        performedDateTime,
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Generated Narrative with Details</b></p><p><b>Procedimiento</b>: ${escapeHtml(display)}</p></div>`
        }
    };

    if (options.reasonReferences && options.reasonReferences.length > 0) {
        procedure.reasonReference = options.reasonReferences.filter(Boolean).map(ref => ({
            reference: ref
        }));
    }

    if (options.bodySiteConcepts && options.bodySiteConcepts.length > 0) {
        procedure.bodySite = options.bodySiteConcepts
            .filter(bs => !!bs?.conceptId)
            .map(toSnomedCodeableConcept);
    }

    if (options.intentConcept?.conceptId) {
        procedure.extension = [
            {
                url: MCODE_PROCEDURE_INTENT_EXTENSION_URL,
                valueCodeableConcept: toSnomedCodeableConcept(options.intentConcept)
            }
        ];
    }

    return procedure;
}

export function encodeSurgicalProcedure(
    patientReference: string,
    registro: any,
    options: Omit<ProcedureEncodeOptions, 'profile'> = {}
) {
    return encode(patientReference, registro, {
        ...options,
        profile: MCODE_SURGICAL_PROCEDURE_PROFILE
    });
}

export function encodeRadiotherapyCourseSummary(
    patientReference: string,
    registro: any,
    options: Omit<ProcedureEncodeOptions, 'profile'> = {}
) {
    return encode(patientReference, registro, {
        ...options,
        profile: MCODE_RADIOTHERAPY_COURSE_SUMMARY_PROFILE
    });
}
