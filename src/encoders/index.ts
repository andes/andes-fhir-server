import * as AllergyIntolerance from './lib/allergyIntolerance';
import * as Bundle from './lib/bundle';
import * as Composition from './lib/composition';
import * as Condition from './lib/condition';
import * as Device from './lib/device';
import * as DocumentReference from './lib/document-reference';
import * as Immunization from './lib/immunization';
import * as Medication from './lib/medication';
import * as MedicationRequest from './lib/medicationRequest';
import * as MedicationStatement from './lib/medicationStatement';
import * as Organization from './lib/organization';
import * as Patient from './lib/patient';
import * as Practitioner from './lib/practitioner';

export { getDominio, initialize } from './lib/config';
export {
    Patient,
    Practitioner,
    Organization,
    Immunization,
    Condition,
    Composition,
    Bundle,
    DocumentReference,
    Device,
    Medication,
    MedicationStatement,
    MedicationRequest,
    AllergyIntolerance
};
