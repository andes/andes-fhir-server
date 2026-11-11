import { makeUrl } from './config';

export const MCODE_PATIENT_BUNDLE_PROFILE =
    'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-patient-bundle';

export interface BundleEncodeOptions {
    type?: 'document' | 'collection' | 'searchset';
    profile?: string;
}

export function encode(ID: any, resources: any, options: BundleEncodeOptions = {}) {
    const now = new Date().toISOString();
    const bundleType = options.type || 'document';
    const meta: Record<string, any> = {
        lastUpdated: now
    };
    if (options.profile) {
        meta.profile = [options.profile];
    }

    return {
        resourceType: 'Bundle',
        id: ID,
        meta,
        entry: resources,
        type: bundleType,
        timestamp: now,
        identifier: {
            system: makeUrl('Bundle'),
            value: ID
        }
    };
}

export function encodeMcodePatientBundle(ID: any, resources: any) {
    return encode(ID, resources, {
        type: 'collection',
        profile: MCODE_PATIENT_BUNDLE_PROFILE
    });
}
