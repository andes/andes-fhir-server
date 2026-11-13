import { formatFHIRDateTime } from '../utils/fhirDate';
import { escapeHtml } from '../utils/escapeHtml';

export const IPS_ALLERGY_INTOLERANCE_PROFILE =
    'http://hl7.org/fhir/uv/ips/StructureDefinition/AllergyIntolerance-uv-ips';

function mapClinicalStatus(estado?: string): string {
    const normalized = String(estado || '').trim().toLowerCase();
    if (normalized === 'inactivo' || normalized === 'inactive') {
        return 'inactive';
    }
    if (normalized === 'resuelto' || normalized === 'resolved') {
        return 'resolved';
    }
    return 'active';
}

function resolveAllergyType(alergiaIntolerancia: any): 'allergy' | 'intolerance' {
    const text = `${alergiaIntolerancia?.concepto?.term || ''} ${alergiaIntolerancia?.concepto?.fsn || ''} ${alergiaIntolerancia?.nombre || ''}`.toLowerCase();
    if (text.includes('intolerancia') || text.includes('intolerance')) {
        return 'intolerance';
    }
    return 'allergy';
}

/**
 * Encode de Alergias e Intolerancias from ANDES to FHIR
 * @param {} AllergyIntolerance
 */
export function encode(patientReference: any, alergiaIntolerancia: any) {
    const display =
        alergiaIntolerancia?.concepto?.term ||
        alergiaIntolerancia?.concepto?.fsn ||
        alergiaIntolerancia?.nombre;
    const clinicalStatusCode = mapClinicalStatus(alergiaIntolerancia?.valor?.estado);

    return {
        category: [
            'medication'
        ],
        criticality: 'high',
        patient: {
            reference: patientReference
        },
        id: alergiaIntolerancia?._id ?? alergiaIntolerancia?.id,
        code: {
            coding: [
                {
                    system: 'http://snomed.info/sct',
                    display: alergiaIntolerancia?.concepto?.term,
                    code: alergiaIntolerancia?.concepto?.conceptId
                        ? String(alergiaIntolerancia.concepto.conceptId)
                        : undefined,
                }
            ],
            ...(display && { text: display })
        },
        meta: {
            profile: [IPS_ALLERGY_INTOLERANCE_PROFILE]
        },
        clinicalStatus: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                    code: clinicalStatusCode
                }
            ]
        },
        verificationStatus: {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
                    code: 'confirmed'
                }
            ]
        },
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: Alergia </p><p><b>meta</b>: </p><p><b>text</b>: ${escapeHtml(alergiaIntolerancia?.concepto?.semanticTag ?? '')}</p></div>`
        },
        resourceType: 'AllergyIntolerance',
        type: resolveAllergyType(alergiaIntolerancia),
        onsetDateTime: formatFHIRDateTime(alergiaIntolerancia?.valor?.fechaInicio ?? alergiaIntolerancia?.createdAt)
    };
}

