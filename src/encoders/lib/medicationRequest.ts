/**
 * Encode medicationRequest from ANDES to FHIR
 * @param {} medicationRequest
 */

import { FhirIdentifierSystems } from '../constants/identifier-systems';

// Muy incompleto hay que mejorarlo mucho todavía

export function encode(patientReference: any, practitionerReference: any, medicationFHIR: any, data: any) {
    return {
        resourceType: 'MedicationRequest',
        id: data.registro._id, // id de la prescripción completa
        text: {
            status: 'generated',
            // div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: Medicacion </p><p><b>meta</b>: </p><p><b>text</b>: ${'DEFINIR'}</p></div>`
        },
        contained: [
            medicationFHIR
        ],
        identifier: [  // Ver bien que sería el array de identifiers
            {
                use: 'official',
                system: FhirIdentifierSystems.PRESCRIPTIONS,  // Es el id de la prestación completa
                value: data.registro.id
            }
        ],
        // active | on-hold | cancelled | completed | entered-in-error | stopped | draft | unknown
        status: (data.prestacion.estadoActual.tipo === 'validada') ? 'active' : 'on-hold',  // Lo mejor sería enviar el estado de la receta desde la prestación
        // intent: proposal | plan | order | original-order | reflex-order | filler-order | instance-order | option
        intent: 'order', // Ya que no tenemos este dato, ver como sería en caso de recetas prolongadas si puede ir como plan
        // category: {
        //     coding: [
        //         {
        //             system: '',
        //             display: '',
        //             code: ''
        //         }
        //     ]
        // },
        // priority: routine | urgent | asap | stat
        priority: 'routine',
        doNotPerform: false,
        // Se puede usar medicationCodeableConcept o medicationReference, vamos a usar esta última.
        medicationReference: {
            reference: medicationFHIR.id,
            display: medicationFHIR.code.text
        },
        subject: {
            reference: patientReference  // podría ser una reference a un group también
        },
        // encounter: Por ahora lo dejo pendiente. Podría ponerse una referencia a otra prestación o al informe del encuentro.
        authoredOn: data.registro?.createdAt ? new Date(data.registro.createdAt).toISOString().slice(0, 10) : undefined,
        // requester & performer: pueden ser  Reference(Practitioner|PractitionerRole|Organization|Patient|Device|RelatedPerson|CareTeam)
        // por el momento vamos a tomar al profesional porque no tenemos otra info en la prestación
        requester: {
            reference: practitionerReference
        },
        // performer: {
        //     reference: practitionerReference
        // },
        // performerType: Lo dejamos pendiente
        // recorder: {
        //     reference: practitionerReference
        // },
        // instantiatesCanonical: null, // ["<canonical>"], // Instantiates FHIR protocol or definition
        // instantiatesUri: null, // ["<uri>"], // Instantiates external protocol or definition
        basedOn: data.prestacion.id, // Vamos a usar el id de la prestación donde esta todo [{ Reference(CarePlan|MedicationRequest|ServiceRequest| ImmunizationRecommendation) }], // What request fulfills
        // groupIdentifier: null, // { Identifier }, // Composite request this is part of
        // courseOfTherapyType: null, // { CodeableConcept }, // Overall pattern of medication administration
        // insurance: null, // [{ Reference(Coverage|ClaimResponse) }], // Associated insurance coverage
        note: null, // De donde sacamos las notas? [{ Annotation }], // Information about the prescription
        dosageInstruction: null, // [{ Dosage }], // How the medication should be taken
        // Medication supply authorization: Hay que ver esta parte
        /*
        dispenseRequest: { // Medication supply authorization
            initialFill: { // First fill details
                quantity: { Quantity(SimpleQuantity) }, // First fill quantity
                duration: { Duration } // First fill duration
            },
            dispenseInterval: { Duration }, // Minimum period of time between dispenses
            validityPeriod: { Period }, // Time period supply is authorized for
            numberOfRepeatsAllowed: "<unsignedInt>", // Number of refills authorized
            quantity: { Quantity(SimpleQuantity) }, // Amount of medication to supply per dispense
            expectedSupplyDuration: { Duration }, // Number of days supply per dispense
            performer: { Reference(Organization) } // Intended dispenser
        },
        */
        substitution: { // Any restrictions on medication substitution
            // allowed[x]: Whether substitution is allowed or not. One of these 2:
            allowedBoolean: true, // <boolean>,
            // "allowedCodeableConcept" : { CodeableConcept },
            reason: null // { CodeableConcept } // Why should (not) substitution be made
        },
        priorPrescription: null, // { Reference(MedicationRequest) }, // An order/prescription that is being replaced
        detectedIssue: null, // [{ Reference(DetectedIssue) }], // Clinical Issue with action
        eventHistory: null// [{ Reference(Provenance) }]
    };
}

