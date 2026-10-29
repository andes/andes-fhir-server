import { RelatedPerson, FhirIdentifierSystems } from '../../../src/encoders';
import { AndesPatient, AndesRelacion } from '../../../src/encoders/types/andes/patient.types';

describe('RelatedPerson Encoder (encode & decode)', () => {
    const madrePatient: AndesPatient = {
        _id: '60a1b2c3d4e5f60001112222',
        nombre: 'MARIA LAURA',
        apellido: 'GOMEZ',
        documento: '28123456',
        sexo: 'femenino',
        genero: 'femenino',
        fechaNacimiento: '1992-04-10',
        estado: 'validado',
        activo: true
    };

    it('should encode an embedded relation (not registered as a separate patient)', () => {
        const relacion: AndesRelacion = {
            _id: '60a1b2c3d4e5f60001112233',
            relacion: {
                nombre: 'progenitor/a',
                opuesto: 'hijo/a',
                esConviviente: false
            },
            nombre: 'ROBERTO',
            apellido: 'GOMEZ',
            documento: '14555666'
        };

        const encoded = RelatedPerson.encode(madrePatient, relacion, null);
        expect(encoded).not.toBeNull();
        expect(encoded!.resourceType).toBe('RelatedPerson');
        expect(encoded!.id).toBe('60a1b2c3d4e5f60001112233');
        expect(encoded!.patient).toEqual({
            reference: 'Patient/60a1b2c3d4e5f60001112222',
            display: 'MARIA LAURA GOMEZ'
        });
        expect(encoded!.relationship?.[0].coding?.[0]).toEqual({
            system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
            code: 'PRN',
            display: 'parent'
        });
        expect(encoded!.relationship?.[0].text).toBe('progenitor/a');
        expect(encoded!.name?.[0].family).toBe('GOMEZ');
        expect(encoded!.name?.[0].given).toEqual(['ROBERTO']);
        expect(encoded!.identifier).toContainEqual({
            system: FhirIdentifierSystems.DNI,
            value: '14555666'
        });
    });

    it('should enrich RelatedPerson when relacion follows PacienteSchema (only relacion and referencia, no embedded name/doc)', () => {
        const relacionBebe: AndesRelacion = {
            _id: '60a1b2c3d4e5f60001112244',
            relacion: {
                _id: '59247c391ebf0273353b23c0',
                nombre: 'hijo/a',
                opuesto: 'progenitor/a',
                esConviviente: false
            },
            referencia: '60a1b2c3d4e5f60009998888'
        };

        const bebeTemporalPatient: AndesPatient = {
            _id: '60a1b2c3d4e5f60009998888',
            nombre: 'MATEO',
            apellido: 'GOMEZ',
            estado: 'temporal',
            activo: true,
            sexo: 'masculino',
            fechaNacimiento: '2026-10-15T08:00:00.000Z',
            contacto: [
                { tipo: 'celular', valor: '2995551234', ranking: 0 }
            ],
            direccion: [
                {
                    valor: 'Av. Argentina 100',
                    codigoPostal: '8300',
                    ubicacion: {
                        localidad: { nombre: 'NEUQUEN' },
                        provincia: { nombre: 'Neuquén' },
                        pais: { nombre: 'Argentina' }
                    }
                }
            ]
        };

        const encoded = RelatedPerson.encode(madrePatient, relacionBebe, bebeTemporalPatient);
        expect(encoded).not.toBeNull();
        expect(encoded!.id).toBe('60a1b2c3d4e5f60001112244');
        expect(encoded!.identifier).toContainEqual({
            system: FhirIdentifierSystems.ANDES_ID,
            value: '60a1b2c3d4e5f60009998888'
        });
        expect(encoded!.identifier?.find(i => i.system === FhirIdentifierSystems.DNI)).toBeUndefined();
        expect(encoded!.relationship?.[0].coding?.[0].code).toBe('CHILD');
        expect(encoded!.relationship?.[0].text).toBe('hijo/a');
        expect(encoded!.name?.[0].family).toBe('GOMEZ');
        expect(encoded!.name?.[0].given).toEqual(['MATEO']);
        expect(encoded!.gender).toBe('male');
        expect(encoded!.birthDate).toBe('2026-10-15');
        expect(encoded!.telecom?.[0].value).toBe('2995551234');
        expect(encoded!.address?.[0].city).toBe('NEUQUEN');
    });

    it('should decode a FHIR RelatedPerson into patientId and AndesRelacion with esConviviente', () => {
        const fhirResource: any = {
            resourceType: 'RelatedPerson',
            patient: {
                reference: 'https://andes.gob.ar/Patient/60a1b2c3d4e5f60001112222'
            },
            identifier: [
                {
                    system: FhirIdentifierSystems.ANDES_ID,
                    value: '60a1b2c3d4e5f60009998888'
                }
            ],
            relationship: [
                {
                    coding: [
                        {
                            system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
                            code: 'CHILD'
                        }
                    ]
                }
            ],
            name: [
                {
                    family: 'GOMEZ',
                    given: ['MATEO']
                }
            ],
            gender: 'male',
            birthDate: '2026-10-15',
            active: true
        };

        const decoded = RelatedPerson.decode(fhirResource);
        expect(decoded.patientId).toBe('60a1b2c3d4e5f60001112222');
        expect(decoded.relacion.referencia).toBe('60a1b2c3d4e5f60009998888');
        expect(decoded.relacion.relacion).toEqual({
            nombre: 'hijo/a',
            opuesto: 'progenitor/a',
            esConviviente: false
        });
        expect(decoded.relacion.nombre).toBe('MATEO');
        expect(decoded.relacion.apellido).toBe('GOMEZ');
        expect(decoded.relacion.sexo).toBe('masculino');
        expect(decoded.relacion.fechaNacimiento).toBe('2026-10-15');
    });
});
