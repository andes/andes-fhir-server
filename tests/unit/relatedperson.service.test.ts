import { ObjectId } from 'mongodb';
import { ServerError } from '@bluehalo/node-fhir-server-core';
import RelatedPersonService from '../../src/services/relatedperson/relatedperson.service';
import PatientRepository from '../../src/repositories/patient.repository';

describe('RelatedPerson Service', () => {
    const base_version = '4_0_1';
    const madreId = new ObjectId().toString();
    const bebeId = new ObjectId().toString();
    const hermanaId = new ObjectId().toString();
    const relBebeId = new ObjectId().toString();
    const relHermanaId = new ObjectId().toString();

    // Documentos ajustados a PacienteSchema: relaciones solo tiene relacion (ParentescoSchema) y referencia (ObjectId)
    const madreDoc = {
        _id: new ObjectId(madreId),
        id: madreId,
        nombre: 'MARIA',
        apellido: 'GOMEZ',
        documento: '28123456',
        activo: true,
        relaciones: [
            {
                _id: new ObjectId(relBebeId),
                relacion: { nombre: 'hijo/a', opuesto: 'progenitor/a', esConviviente: false },
                referencia: new ObjectId(bebeId)
            },
            {
                _id: new ObjectId(relHermanaId),
                relacion: { nombre: 'hermano/a', opuesto: 'hermano/a', esConviviente: false },
                referencia: new ObjectId(hermanaId)
            }
        ]
    };

    const bebeDoc = {
        _id: new ObjectId(bebeId),
        id: bebeId,
        nombre: 'MATEO',
        apellido: 'GOMEZ',
        sexo: 'masculino',
        estado: 'temporal',
        activo: true,
        fechaNacimiento: '2026-10-15',
        contacto: [{ tipo: 'celular', valor: '2994445566' }]
    };

    const hermanaDoc = {
        _id: new ObjectId(hermanaId),
        id: hermanaId,
        nombre: 'LUCIA',
        apellido: 'GOMEZ',
        documento: '30999888',
        sexo: 'femenino',
        estado: 'validado',
        activo: true,
        fechaNacimiento: '1995-03-20'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('search', () => {
        it('should throw ServerError when no search parameters are provided', async () => {
            await expect(RelatedPersonService.search({ base_version }, { req: {} }))
                .rejects.toThrow(ServerError);
        });

        it('should return all RelatedPerson entries for a given patient resolving referencias', async () => {
            jest.spyOn(PatientRepository, 'find').mockResolvedValue([madreDoc] as any);
            jest.spyOn(PatientRepository, 'findByIds').mockResolvedValue([bebeDoc, hermanaDoc] as any);

            const bundle = await RelatedPersonService.search(
                { base_version, patient: `Patient/${madreId}` },
                { req: { query: {} } }
            );

            expect(bundle.resourceType).toBe('Bundle');
            expect(bundle.total).toBe(2);
            expect(bundle.entry).toHaveLength(2);
        });

        it('should search by identifier resolving the referenced patient document first', async () => {
            const findSpy = jest.spyOn(PatientRepository, 'find')
                .mockResolvedValueOnce([hermanaDoc] as any)
                .mockResolvedValueOnce([madreDoc] as any);
            jest.spyOn(PatientRepository, 'findByIds').mockResolvedValue([bebeDoc, hermanaDoc] as any);

            const bundle = await RelatedPersonService.search(
                { base_version, identifier: 'https://www.renaper.gob.ar/dni|30999888' },
                { req: { query: {} } }
            );

            expect(findSpy).toHaveBeenCalledTimes(2);
            expect(bundle.total).toBe(1);
            expect(bundle.entry[0].resource.id).toBe(relHermanaId);
            expect(bundle.entry[0].resource.name[0].given).toEqual(['LUCIA']);
        });

        it('should filter by birthdate, gender, relationship, name and phone', async () => {
            jest.spyOn(PatientRepository, 'find').mockResolvedValue([madreDoc] as any);
            jest.spyOn(PatientRepository, 'findByIds').mockResolvedValue([bebeDoc, hermanaDoc] as any);

            const bundle = await RelatedPersonService.search(
                {
                    base_version,
                    patient: madreId,
                    birthdate: 'ge2026-01-01',
                    gender: 'male',
                    relationship: 'CHILD',
                    name: 'MATEO',
                    phone: '299444'
                },
                { req: { query: {} } }
            );

            expect(bundle.total).toBe(1);
            expect(bundle.entry[0].resource.id).toBe(relBebeId);
        });
    });

    describe('searchById', () => {
        it('should return enriched RelatedPerson when found by relation id', async () => {
            jest.spyOn(PatientRepository, 'findByRelatedId').mockResolvedValue(madreDoc as any);
            jest.spyOn(PatientRepository, 'findByIds').mockResolvedValue([bebeDoc] as any);

            const rp = await RelatedPersonService.searchById({ base_version, id: relBebeId }, {});
            expect(rp).toBeDefined();
            expect(rp.resourceType).toBe('RelatedPerson');
            expect(rp.id).toBe(relBebeId);
            expect(rp.birthDate).toBe('2026-10-15');
        });

        it('should return null when relation is not found', async () => {
            jest.spyOn(PatientRepository, 'findByRelatedId').mockResolvedValue(null);

            const rp = await RelatedPersonService.searchById({ base_version, id: new ObjectId().toString() }, {});
            expect(rp).toBeNull();
        });
    });

    describe('create', () => {
        it('should throw 201 ServerError with created ID when new relation is added', async () => {
            const newRelId = new ObjectId().toString();
            jest.spyOn(PatientRepository, 'addRelation').mockResolvedValue({
                existing: false,
                relationId: newRelId
            });

            const resource = {
                resourceType: 'RelatedPerson',
                patient: { reference: `Patient/${madreId}` },
                relationship: [{ coding: [{ code: 'CHILD' }] }],
                name: [{ family: 'GOMEZ', given: ['SOFIA'] }],
                gender: 'female',
                birthDate: '2026-10-20'
            };

            await expect(
                RelatedPersonService.create({ base_version, resource }, { req: { body: resource } })
            ).rejects.toMatchObject({
                statusCode: 201,
                message: `La persona relacionada fue creada. ID: ${newRelId}`
            });
        });

        it('should throw 200 ServerError when relation already exists', async () => {
            jest.spyOn(PatientRepository, 'addRelation').mockResolvedValue({
                existing: true,
                relationId: relBebeId
            });

            const resource = {
                resourceType: 'RelatedPerson',
                patient: { reference: `Patient/${madreId}` },
                relationship: [{ coding: [{ code: 'CHILD' }] }],
                name: [{ family: 'GOMEZ', given: ['MATEO'] }]
            };

            await expect(
                RelatedPersonService.create({ base_version, resource }, { req: { body: resource } })
            ).rejects.toMatchObject({
                statusCode: 200,
                message: `La persona relacionada ya existe. ID: ${relBebeId}`
            });
        });
    });
});
