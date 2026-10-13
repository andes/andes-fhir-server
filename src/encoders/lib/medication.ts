/**
 * Encode de Medicamentos from ANDES to FHIR
 * @param {} medication
 */
export function encode(medication: any) {
    // Falta completar con más detalle
    return {
        resourceType: 'Medication',
        id: medication.conceptId, // Es el id del medicamento, en este caso usamos el código de snomed (ver si sería correcto)
        meta: {
            profile: [
                'http://hl7.org/fhir/uv/ips/StructureDefinition/medication-ips'
            ]
        },
        identifier: medication.moduleId, // Acá va el serial number del medicamento.
        code: {
            coding: [
                {
                    system: 'http://snomed.info/sct',
                    display: medication.term,
                    code: medication.conceptId
                }
            ],
            text: medication.fsn
        },
        status: medication.active === true ? 'active' : 'inactive',
        // manufacturer: null,
        // form: null,
        // amount: null,
        // ingredient: null,
        // ingredient: [ // ejemplo
        //     {
        //         code: {
        //             coding: [
        //                 {
        //                     system: "http://snomed.info/sct",
        //                     display: "salbutamol (sustancia)",
        //                     code: "372897005"
        //                 }
        //             ]
        //         },
        //         isActive: true,
        //         strength: {
        //             numerator: {
        //                 value: 200,
        //                 unit: "mcg"
        //             },
        //             denominator: {
        //                 value: 1,
        //                 unit: "disparo"
        //             }
        //         }
        //     }
        // ],
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: Medicacion</p><p><b>meta</b>: </p><p><b>text</b>: ${medication.pt.term}</p></div>`
        }
    };
}

