import { ObjectId } from 'mongodb';
import PatientRepository from '../../src/repositories/patient.repository';
import { FhirIdentifierSystems } from '../../src/constants';
import { ServerError } from '@asymmetrik/node-fhir-server-core';
import globals from '../../src/globals';
import { CONSTANTS } from '../../src/constants';

describe('Patient Repository - findById', () => {
    afterEach(() => {
        globals.delete(CONSTANTS.CLIENT_DB);
    });

    it('should filter by activo:true, consistent with buildAndesSearchQuery', async () => {
        const findOne = jest.fn().mockResolvedValue(null);
        const fakeDb = { collection: jest.fn().mockReturnValue({ findOne }) };
        globals.set(CONSTANTS.CLIENT_DB, fakeDb);

        const id = new ObjectId().toString();
        await PatientRepository.findById(id);

        expect(findOne).toHaveBeenCalledTimes(1);
        const calledQuery = findOne.mock.calls[0][0];
        expect(calledQuery.activo).toBe(true);
        expect(calledQuery._id).toBeInstanceOf(ObjectId);
        expect(calledQuery._id.toString()).toBe(id);
    });

    it('should NOT return an inactive (logically deleted) patient by id', async () => {
        // Simula el comportamiento real de Mongo: el filtro activo:true
        // hace que findOne no devuelva un documento con activo:false.
        const findOne = jest.fn().mockImplementation((query: any) => {
            const doc = { _id: new ObjectId(id), activo: false, apellido: 'Baja logica' };
            const matches = (!('activo' in query) || query.activo === doc.activo);
            return Promise.resolve(matches ? doc : null);
        });
        const fakeDb = { collection: jest.fn().mockReturnValue({ findOne }) };
        globals.set(CONSTANTS.CLIENT_DB, fakeDb);

        const id = new ObjectId().toString();
        const result = await PatientRepository.findById(id);

        expect(result).toBeNull();
    });
});

describe('Patient Repository - buildQuery', () => {
    it('should query id case-insensitively and escape regex characters', () => {
        const query = PatientRepository.buildQuery({ id: 'abc.123*+?' });
        expect(query.id).toBeDefined();
        expect(query.id.$regex).toBeDefined();
        // Escaped: abc\.123\*\+\?
        expect(query.id.$regex.source).toBe('^abc\\.123\\*\\+\\?');
        expect(query.id.$regex.flags).toBe('i');
    });

    it('should query family and given names correctly using familyQueryBuilder', () => {
        const query = PatientRepository.buildQuery({ family: 'Pérez', given: 'Juan' });
        expect(query.$and).toEqual([
            { tokens: /^perez/ },
            { tokens: /^juan/ }
        ]);
    });

    it('should safely coerce object injection in id to a string', () => {
        const query = PatientRepository.buildQuery({ id: { $ne: 'something' } });
        expect(query.id).toBeDefined();
        expect(query.id.$regex.source).toBe('^\\[object Object\\]');
    });

    it('should query identifier without system case-insensitively across multiple fields', () => {
        const query = PatientRepository.buildQuery({ identifier: '123-abc' });
        expect(query.$or).toBeDefined();
        expect(query.$or).toHaveLength(3);
        expect(query.$or[0].documento.$regex.source).toBe('^123-abc');
        expect(query.$or[0].documento.$regex.flags).toBe('i');
        expect(query.$or[1].cuit.$regex.source).toBe('^123-abc');
        expect(query.$or[2].numeroIdentificacion.$regex.source).toBe('^123-abc');
    });

    it('should query identifier with DNI system case-insensitively', () => {
        const query = PatientRepository.buildQuery({ identifier: `${FhirIdentifierSystems.DNI}|23a-bcd` });
        expect(query.documento).toBeDefined();
        expect(query.documento.$regex.source).toBe('^23a-bcd');
        expect(query.documento.$regex.flags).toBe('i');
    });

    it('should query identifier with CUIL system case-insensitively', () => {
        const query = PatientRepository.buildQuery({ identifier: `${FhirIdentifierSystems.CUIL}|20-12345678-9` });
        expect(query.cuil).toBeDefined();
        expect(query.cuil.$regex.source).toBe('^20-12345678-9');
        expect(query.cuil.$regex.flags).toBe('i');
    });

    it('should query identifier with PASSPORT system case-insensitively', () => {
        const query = PatientRepository.buildQuery({ identifier: `${FhirIdentifierSystems.PASSPORT}|arg123xyz` });
        expect(query.numeroIdentificacion).toBeDefined();
        expect(query.numeroIdentificacion.$regex.source).toBe('^arg123xyz');
        expect(query.numeroIdentificacion.$regex.flags).toBe('i');
        expect(query.tipoIdentificacion).toBe('pasaporte');
    });

    it('should query identifier with FOREIGN_ID system case-insensitively', () => {
        const query = PatientRepository.buildQuery({ identifier: `${FhirIdentifierSystems.FOREIGN_ID}|f123-abc` });
        expect(query.numeroIdentificacion).toBeDefined();
        expect(query.numeroIdentificacion.$regex.source).toBe('^f123-abc');
        expect(query.numeroIdentificacion.$regex.flags).toBe('i');
        expect(query.tipoIdentificacion).toBe('dni extranjero');
    });

    it('should successfully build query with valid ObjectId for ANDES_ID system', () => {
        const validId = '507f1f77bcf86cd799439011';
        const query = PatientRepository.buildQuery({ identifier: `${FhirIdentifierSystems.ANDES_ID}|${validId}` });
        expect(query._id).toBeDefined();
        expect(query._id.toString()).toBe(validId);
    });

    it('should throw ServerError for invalid ObjectId under ANDES_ID system', () => {
        expect(() => {
            PatientRepository.buildQuery({ identifier: `${FhirIdentifierSystems.ANDES_ID}|invalid_id` });
        }).toThrow(ServerError);
    });

    it('should safely coerce object injection in identifier value', () => {
        const query = PatientRepository.buildQuery({ identifier: { system: FhirIdentifierSystems.DNI, value: { $ne: 'test' } } });
        expect(query.documento).toBeDefined();
        expect(query.documento.$regex.source).toBe('^\\[object Object\\]');
    });
});