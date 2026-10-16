import {
    AllergyIntolerance,
    Condition,
    Immunization,
    Medication,
    MedicationRequest,
    MedicationStatement,
    Organization,
    Practitioner,
    FhirIdentifierSystems
} from '../../../src/encoders';
import { pruneEmpty } from '../../../src/utils/pruneFhir';

describe('Clinical and Organizational Encoders', () => {
    describe('MedicationStatement.encode', () => {
        it('should extract string dosage text when valor is an object and use medicationReference when provided', () => {
            const prestacionMed = {
                _id: 'med-stmt-1',
                nombre: 'Oral',
                createdAt: '2025-05-10T10:00:00.000Z',
                valor: {
                    estado: 'activo',
                    indicacion: '1 comprimido cada 8 horas'
                },
                concepto: {
                    conceptId: '372897005',
                    term: 'salbutamol'
                }
            };

            const encoded = MedicationStatement.encode(
                'https://andes.gob.ar/Patient/pat-1',
                'https://andes.gob.ar/Medication/372897005',
                prestacionMed
            );

            expect(encoded.resourceType).toBe('MedicationStatement');
            expect(encoded.status).toBe('active');
            expect(encoded.dosage[0].text).toBe('1 comprimido cada 8 horas');
            expect((encoded as any).medicationReference).toEqual({
                reference: 'https://andes.gob.ar/Medication/372897005'
            });
            expect((encoded as any).medicationCodeableConcept).toBeUndefined();
        });

        it('should fallback to medicationCodeableConcept when medicationReference is null/empty and handle missing valor safely', () => {
            const prestacionMed = {
                _id: 'med-stmt-2',
                nombre: 'Oral',
                createdAt: 'invalid-date',
                valor: null,
                concepto: {
                    conceptId: '372897005',
                    term: 'salbutamol'
                }
            };

            const encoded = MedicationStatement.encode(
                'https://andes.gob.ar/Patient/pat-1',
                null,
                prestacionMed
            );

            expect(encoded.status).toBe('inactive');
            expect(encoded.dosage[0].text).toBe('salbutamol');
            expect((encoded as any).medicationCodeableConcept.coding[0].code).toBe('372897005');
            expect((encoded as any).medicationReference).toBeUndefined();
        });
    });

    describe('AllergyIntolerance.encode', () => {
        it('should not throw when valor is undefined and should format onsetDateTime as ISO string', () => {
            const alergia = {
                _id: 'alg-1',
                createdAt: new Date('2024-03-15T12:00:00.000Z'),
                concepto: {
                    conceptId: '300916003',
                    term: 'alergia a penicilina',
                    semanticTag: 'hallazgo'
                }
            };

            const encoded = AllergyIntolerance.encode('https://andes.gob.ar/Patient/pat-1', alergia);

            expect(encoded.resourceType).toBe('AllergyIntolerance');
            expect(encoded.onsetDateTime).toBe('2024-03-15T12:00:00.000Z');
        });
    });

    describe('Medication.encode', () => {
        it('should encode identifier as an array and handle missing pt object', () => {
            const med = {
                conceptId: '372897005',
                moduleId: '900000000000207008',
                term: 'salbutamol',
                fsn: 'salbutamol (sustancia)',
                active: true
            };

            const encoded = Medication.encode(med);

            expect(encoded.resourceType).toBe('Medication');
            expect(Array.isArray(encoded.identifier)).toBe(true);
            expect(encoded.identifier?.[0].value).toBe('900000000000207008');
            expect(encoded.text.div).toContain('salbutamol');
        });
    });

    describe('Condition, Immunization & MedicationRequest safe dates', () => {
        it('should not throw RangeError when dates are invalid', () => {
            const condition = Condition.encode('Patient/1', {
                _id: 'cond-1',
                createdAt: 'fecha-invalida',
                concepto: { conceptId: '195967001', term: 'asma' }
            });
            expect(condition.recordedDate).toBeUndefined();
            expect(typeof condition.onsetDateTime).toBe('string');

            const imm = Immunization.encode('Patient/1', {
                idvacuna: 'vac-1',
                vacuna: ' Antigripal',
                fechaAplicacion: 'fecha-invalida'
            });
            expect(typeof imm.occurrenceDateTime).toBe('string');

            const medReq = MedicationRequest.encode('Patient/1', 'Practitioner/1', { id: 'med-1', code: { text: 'Med' } }, {
                registro: { _id: 'reg-1', id: 'reg-1', createdAt: 'fecha-invalida' },
                prestacion: { id: 'prest-1', estadoActual: { tipo: 'validada' } }
            });
            expect(medReq.authoredOn).toBeUndefined();
        });
    });

    describe('Organization and Practitioner ANDES_ID identifier system', () => {
        it('should use FhirIdentifierSystems.ANDES_ID for local ID in Organization and Practitioner', () => {
            const org = Organization.encode({
                _id: 'org-1',
                nombre: 'Hospital Test',
                codigo: { sisa: '1234' }
            });
            expect(org?.identifier).toContainEqual({
                system: FhirIdentifierSystems.ANDES_ID,
                value: 'org-1'
            });

            const prac = Practitioner.encode({
                _id: 'prac-1',
                nombre: 'Maria',
                apellido: 'Gomez',
                documento: '22333444'
            });
            expect(prac?.identifier).toContainEqual({
                system: FhirIdentifierSystems.ANDES_ID,
                value: 'prac-1'
            });
        });
    });

    describe('pruneEmpty with IPS and DocumentReference resource types', () => {
        it('should preserve resourceType for Composition, AllergyIntolerance, Immunization, Device, DocumentReference', () => {
            const bundle = {
                resourceType: 'Bundle',
                type: 'document',
                entry: [
                    { resource: { resourceType: 'Composition', id: 'comp-1' } },
                    { resource: { resourceType: 'AllergyIntolerance', id: 'alg-1' } },
                    { resource: { resourceType: 'Immunization', id: 'imm-1' } },
                    { resource: { resourceType: 'MedicationStatement', id: 'ms-1' } },
                    { resource: { resourceType: 'Device', id: 'dev-1' } },
                    { resource: { resourceType: 'DocumentReference', id: 'doc-1' } }
                ]
            };

            const pruned = pruneEmpty(bundle);
            expect(pruned.entry[0].resource.resourceType).toBe('Composition');
            expect(pruned.entry[1].resource.resourceType).toBe('AllergyIntolerance');
            expect(pruned.entry[2].resource.resourceType).toBe('Immunization');
            expect(pruned.entry[3].resource.resourceType).toBe('MedicationStatement');
            expect(pruned.entry[4].resource.resourceType).toBe('Device');
            expect(pruned.entry[5].resource.resourceType).toBe('DocumentReference');
        });
    });
});
