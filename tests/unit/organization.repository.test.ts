import { ObjectId } from 'mongodb';
import OrganizationRepository from '../../src/repositories/organization.repository';
import globals from '../../src/globals';
import { CONSTANTS } from '../../src/constants';

describe('Organization Repository - buildQuery', () => {
    it('should build query with id', () => {
        const query = OrganizationRepository.buildQuery({ id: 'org-123' });
        expect(query.id).toBe('org-123');
    });

    it('should build query with active: true when boolean true or string "true"', () => {
        const query1 = OrganizationRepository.buildQuery({ active: true });
        expect(query1.activo).toBe(true);

        const query2 = OrganizationRepository.buildQuery({ active: 'true' });
        expect(query2.activo).toBe(true);
    });

    it('should build query with active: false when boolean false', () => {
        const query = OrganizationRepository.buildQuery({ active: false });
        expect(query.activo).toBe(false);
    });

    it('should build query with name using stringQueryBuilder on nombre', () => {
        const query = OrganizationRepository.buildQuery({ name: 'Castro Rendon' });
        expect(query.nombre).toBeDefined();
        expect(query.nombre.$regex).toBeDefined();
        expect(query.nombre.$regex.flags).toBe('i');
    });

    it('should build query with identifier for SISA code', () => {
        const query = OrganizationRepository.buildQuery({ identifier: '10580352367779' });
        expect(query['codigo.sisa']).toBe('10580352367779');
    });

    it('should build combined query with multiple parameters', () => {
        const query = OrganizationRepository.buildQuery({
            name: 'Hospital',
            active: true,
            identifier: '9999'
        });
        expect(query.nombre).toBeDefined();
        expect(query.activo).toBe(true);
        expect(query['codigo.sisa']).toBe('9999');
    });
});

describe('Organization Repository - Database Operations', () => {
    const fakeId = new ObjectId('507f1f77bcf86cd799439011');
    const fakeOrg = {
        _id: fakeId,
        nombre: 'HOSPITAL PROVINCIAL NEUQUEN',
        activo: true,
        codigo: { sisa: '10580352367779' }
    };

    afterEach(() => {
        globals.delete(CONSTANTS.CLIENT_DB);
    });

    it('should findById and return organization document', async () => {
        const findOne = jest.fn().mockResolvedValue(fakeOrg);
        const fakeDb = { collection: jest.fn().mockReturnValue({ findOne }) };
        globals.set(CONSTANTS.CLIENT_DB, fakeDb);

        const result = await OrganizationRepository.findById(fakeId.toString());
        expect(findOne).toHaveBeenCalledWith({ _id: fakeId });
        expect(result).toEqual(fakeOrg);
    });

    it('should findBySisa and return organization document', async () => {
        const findOne = jest.fn().mockResolvedValue(fakeOrg);
        const fakeDb = { collection: jest.fn().mockReturnValue({ findOne }) };
        globals.set(CONSTANTS.CLIENT_DB, fakeDb);

        const result = await OrganizationRepository.findBySisa('10580352367779');
        expect(findOne).toHaveBeenCalledWith({ 'codigo.sisa': '10580352367779' });
        expect(result).toEqual(fakeOrg);
    });

    it('should count documents matching query', async () => {
        const countDocuments = jest.fn().mockResolvedValue(5);
        const fakeDb = { collection: jest.fn().mockReturnValue({ countDocuments }) };
        globals.set(CONSTANTS.CLIENT_DB, fakeDb);

        const result = await OrganizationRepository.count({ activo: true });
        expect(countDocuments).toHaveBeenCalledWith({ activo: true });
        expect(result).toBe(5);
    });

    it('should find documents with paging options', async () => {
        const toArray = jest.fn().mockResolvedValue([fakeOrg]);
        const limit = jest.fn().mockReturnValue({ toArray });
        const skip = jest.fn().mockReturnValue({ limit });
        const find = jest.fn().mockReturnValue({ skip });
        const fakeDb = { collection: jest.fn().mockReturnValue({ find }) };
        globals.set(CONSTANTS.CLIENT_DB, fakeDb);

        const result = await OrganizationRepository.find({ activo: true }, { skip: 10, limit: 5 });
        expect(find).toHaveBeenCalledWith({ activo: true });
        expect(skip).toHaveBeenCalledWith(10);
        expect(limit).toHaveBeenCalledWith(5);
        expect(result).toEqual([fakeOrg]);
    });
});
