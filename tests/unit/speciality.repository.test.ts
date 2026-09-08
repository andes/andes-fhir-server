import { ObjectId } from 'mongodb';
import SpecialityRepository from '../../src/repositories/speciality.repository';
import globals from '../../src/globals';
import { CONSTANTS } from '../../src/constants';

describe('Speciality Repository - buildQuery', () => {
    it('should build empty query when no params provided', () => {
        const query = SpecialityRepository.buildQuery({});
        expect(query).toEqual({});
    });

    it('should build query with name using stringQueryBuilder', () => {
        const query = SpecialityRepository.buildQuery({ nombre: 'Cardiologia' });
        expect(query.nombre).toBeDefined();
        expect(query.nombre.$regex).toBeDefined();
        expect(query.nombre.$regex.source).toBe('^Cardiologia');
    });

    it('should build query with SISA code as integer', () => {
        const query = SpecialityRepository.buildQuery({ codigo: '123' });
        expect(query.codigo).toEqual({ sisa: 123 });
    });

    it('should combine name and code in query', () => {
        const query = SpecialityRepository.buildQuery({ nombre: 'Pediatria', codigo: '456' });
        expect(query.nombre).toBeDefined();
        expect(query.codigo).toEqual({ sisa: 456 });
    });
});

describe('Speciality Repository - Database Operations', () => {
    const fakeId = new ObjectId('507f1f77bcf86cd799439011');
    const fakeSpeciality = {
        _id: fakeId,
        nombre: 'CARDIOLOGÍA',
        codigo: { sisa: 12 }
    };

    afterEach(() => {
        globals.delete(CONSTANTS.CLIENT_DB);
    });

    it('should findById and return speciality document', async () => {
        const findOne = jest.fn().mockResolvedValue(fakeSpeciality);
        const fakeDb = { collection: jest.fn().mockReturnValue({ findOne }) };
        globals.set(CONSTANTS.CLIENT_DB, fakeDb);

        const result = await SpecialityRepository.findById(fakeId.toString());
        expect(findOne).toHaveBeenCalledWith({ _id: fakeId });
        expect(result).toEqual(fakeSpeciality);
    });

    it('should find documents matching query', async () => {
        const toArray = jest.fn().mockResolvedValue([fakeSpeciality]);
        const limit = jest.fn().mockReturnValue({ toArray });
        const skip = jest.fn().mockReturnValue({ limit });
        const find = jest.fn().mockReturnValue({ skip });
        const fakeDb = { collection: jest.fn().mockReturnValue({ find }) };
        globals.set(CONSTANTS.CLIENT_DB, fakeDb);

        const result = await SpecialityRepository.find({ 'codigo.sisa': 12 }, { skip: 0, limit: 10 });
        expect(find).toHaveBeenCalledWith({ 'codigo.sisa': 12 });
        expect(skip).toHaveBeenCalledWith(0);
        expect(limit).toHaveBeenCalledWith(10);
        expect(result).toEqual([fakeSpeciality]);
    });

    it('should count documents matching query', async () => {
        const countDocuments = jest.fn().mockResolvedValue(3);
        const fakeDb = { collection: jest.fn().mockReturnValue({ countDocuments }) };
        globals.set(CONSTANTS.CLIENT_DB, fakeDb);

        const result = await SpecialityRepository.count({ 'codigo.sisa': 12 });
        expect(countDocuments).toHaveBeenCalledWith({ 'codigo.sisa': 12 });
        expect(result).toBe(3);
    });
});
