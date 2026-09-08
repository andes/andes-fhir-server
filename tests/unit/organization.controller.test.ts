import { ObjectId } from 'mongodb';
import {
    buildAndesSearchQuery,
    buscarOrganizacion,
    buscarOrganizacionId,
    buscarOrganizacionSisa
} from '../../src/controller/organization/organization';
import globals from '../../src/globals';
import { CONSTANTS } from '../../src/constants';

describe('Organization Controller - buildAndesSearchQuery', () => {
    it('should build query with id', () => {
        const query = buildAndesSearchQuery({ id: 'org-123' });
        expect(query.id).toBe('org-123');
    });

    it('should build query with active: true when boolean true or string "true"', () => {
        const query1 = buildAndesSearchQuery({ active: true });
        expect(query1.activo).toBe(true);

        const query2 = buildAndesSearchQuery({ active: 'true' });
        expect(query2.activo).toBe(true);
    });

    it('should build query with active: false when boolean false', () => {
        const query = buildAndesSearchQuery({ active: false });
        expect(query.activo).toBe(false);
    });

    it('should build query with name using stringQueryBuilder on nombre', () => {
        const query = buildAndesSearchQuery({ name: 'Castro Rendon' });
        expect(query.nombre).toBeDefined();
        expect(query.nombre.$regex).toBeDefined();
        expect(query.nombre.$regex.flags).toBe('i');
    });

    it('should build query with identifier for SISA code', () => {
        const query = buildAndesSearchQuery({ identifier: '10580352367779' });
        expect(query['codigo.sisa']).toBe('10580352367779');
    });

    it('should build combined query with multiple parameters', () => {
        const query = buildAndesSearchQuery({
            name: 'Hospital',
            active: true,
            identifier: '9999'
        });
        expect(query.nombre).toBeDefined();
        expect(query.activo).toBe(true);
        expect(query['codigo.sisa']).toBe('9999');
    });
});

describe('Organization Controller - Database Operations', () => {
    const fakeId = new ObjectId('507f1f77bcf86cd799439011');
    const fakeAndesOrg = {
        _id: fakeId,
        nombre: 'HOSPITAL PROVINCIAL NEUQUEN',
        activo: true,
        codigo: {
            sisa: '10580352367779'
        },
        contacto: [
            {
                tipo: 'telefono',
                valor: '0299-4490800'
            }
        ],
        direccion: {
            valor: 'Buenos Aires 450',
            codigoPostal: '8300'
        }
    };

    afterEach(() => {
        globals.delete(CONSTANTS.CLIENT_DB);
    });

    describe('buscarOrganizacionId', () => {
        it('should return a FHIR Organization when found in DB', async () => {
            const findOne = jest.fn().mockResolvedValue(fakeAndesOrg);
            const fakeDb = { collection: jest.fn().mockReturnValue({ findOne }) };
            globals.set(CONSTANTS.CLIENT_DB, fakeDb);

            const result = await buscarOrganizacionId('4_0_1', fakeId.toString());

            expect(fakeDb.collection).toHaveBeenCalledWith(CONSTANTS.COLLECTION.ORGANIZATION);
            expect(findOne).toHaveBeenCalledWith({ _id: fakeId });
            expect(result).toBeDefined();
            expect(result.resourceType).toBe('Organization');
            expect(result.name).toBe('HOSPITAL PROVINCIAL NEUQUEN');
        });

        it('should return null when organization is not found', async () => {
            const findOne = jest.fn().mockResolvedValue(null);
            const fakeDb = { collection: jest.fn().mockReturnValue({ findOne }) };
            globals.set(CONSTANTS.CLIENT_DB, fakeDb);

            const result = await buscarOrganizacionId('4_0_1', fakeId.toString());

            expect(result).toBeNull();
        });

        it('should return error when id is invalid ObjectId format', async () => {
            const fakeDb = { collection: jest.fn().mockReturnValue({ findOne: jest.fn() }) };
            globals.set(CONSTANTS.CLIENT_DB, fakeDb);

            const result = await buscarOrganizacionId('4_0_1', 'invalid-id');

            expect(result).toBeInstanceOf(Error);
        });
    });

    describe('buscarOrganizacionSisa', () => {
        it('should query by codigo.sisa and return FHIR Organization', async () => {
            const findOne = jest.fn().mockResolvedValue(fakeAndesOrg);
            const fakeDb = { collection: jest.fn().mockReturnValue({ findOne }) };
            globals.set(CONSTANTS.CLIENT_DB, fakeDb);

            const result = await buscarOrganizacionSisa('4_0_1', '10580352367779');

            expect(findOne).toHaveBeenCalledWith({ 'codigo.sisa': '10580352367779' });
            expect(result).toBeDefined();
            expect(result.resourceType).toBe('Organization');
        });
    });

    describe('buscarOrganizacion', () => {
        it('should return a searchset Bundle with results and total count', async () => {
            const toArray = jest.fn().mockResolvedValue([fakeAndesOrg]);
            const limit = jest.fn().mockReturnValue({ toArray });
            const skip = jest.fn().mockReturnValue({ limit });
            const find = jest.fn().mockReturnValue({ skip });
            const countDocuments = jest.fn().mockResolvedValue(1);

            const fakeDb = {
                collection: jest.fn().mockReturnValue({ countDocuments, find })
            };
            globals.set(CONSTANTS.CLIENT_DB, fakeDb);

            const req = {
                query: { _count: '10', _offset: '0' },
                protocol: 'http',
                get: () => 'localhost:3000',
                baseUrl: '/4_0_1/Organization',
                path: ''
            };

            const result = await buscarOrganizacion('4_0_1', { name: 'Hospital' }, req);

            expect(result).toBeDefined();
            expect(result.resourceType).toBe('Bundle');
            expect(result.type).toBe('searchset');
            expect(result.total).toBe(1);
            expect(result.entry).toBeDefined();
            expect(result.entry.length).toBe(1);
            expect(result.entry[0].resource.resourceType).toBe('Organization');
        });

        it('should return Bundle with total 0 and no entries when no matches found', async () => {
            const toArray = jest.fn().mockResolvedValue([]);
            const limit = jest.fn().mockReturnValue({ toArray });
            const skip = jest.fn().mockReturnValue({ limit });
            const find = jest.fn().mockReturnValue({ skip });
            const countDocuments = jest.fn().mockResolvedValue(0);

            const fakeDb = {
                collection: jest.fn().mockReturnValue({ countDocuments, find })
            };
            globals.set(CONSTANTS.CLIENT_DB, fakeDb);

            const result = await buscarOrganizacion('4_0_1', { name: 'Nonexistent' }, { query: {} });

            expect(result).toBeDefined();
            expect(result.resourceType).toBe('Bundle');
            expect(result.total).toBe(0);
            expect(result.entry).toBeUndefined();
        });
    });
});
