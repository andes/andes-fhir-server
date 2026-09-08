import SpecialityService from '../../src/services/basic/speciality.service';
import SpecialityRepository from '../../src/repositories/speciality.repository';
import { ObjectId } from 'mongodb';

describe('Speciality Service', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('search', () => {
        it('should return encoded specialities when matches exist', async () => {
            const fakeId = new ObjectId('507f1f77bcf86cd799439011');
            const mockData = [
                {
                    _id: fakeId,
                    nombre: 'Cardiologia',
                    codigo: { sisa: 10 }
                }
            ];

            jest.spyOn(SpecialityRepository, 'find').mockResolvedValueOnce(mockData);

            const result = await SpecialityService.search(
                { base_version: '4_0_1' },
                { req: { query: { nombre: 'Cardio' } } }
            );

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                identifier: fakeId,
                code: {
                    system: 'https://sisa.msal.gov.ar/sisa/#sisa',
                    code: 10,
                    display: 10
                },
                text: 'Cardiologia',
                author: 'https://sisa.msal.gov.ar/sisa/#sisa'
            });
        });

        it('should return empty array when no specialities match', async () => {
            jest.spyOn(SpecialityRepository, 'find').mockResolvedValueOnce([]);

            const result = await SpecialityService.search(
                { base_version: '4_0_1' },
                { req: { query: {} } }
            );

            expect(result).toEqual([]);
        });

        it('should throw ServerError when repository fails', async () => {
            jest.spyOn(SpecialityRepository, 'find').mockRejectedValueOnce(new Error('DB Error'));

            await expect(
                SpecialityService.search({ base_version: '4_0_1' }, { req: { query: {} } })
            ).rejects.toThrow('DB Error');
        });
    });

    describe('searchById', () => {
        it('should return speciality when found', async () => {
            const fakeId = new ObjectId('507f1f77bcf86cd799439011');
            const fakeDoc = { _id: fakeId, nombre: 'Pediatria' };
            jest.spyOn(SpecialityRepository, 'findById').mockResolvedValueOnce(fakeDoc);

            const result = await SpecialityService.searchById({ base_version: '4_0_1', id: fakeId.toString() });
            expect(result).toEqual(fakeDoc);
        });

        it('should return notFound object when not found', async () => {
            jest.spyOn(SpecialityRepository, 'findById').mockResolvedValueOnce(null);

            const result = await SpecialityService.searchById({ base_version: '4_0_1', id: '507f1f77bcf86cd799439011' });
            expect(result).toEqual({ notFound: 404 });
        });

        it('should throw ServerError when findById throws', async () => {
            jest.spyOn(SpecialityRepository, 'findById').mockRejectedValueOnce(new Error('Invalid ID'));

            await expect(
                SpecialityService.searchById({ base_version: '4_0_1', id: 'bad-id' })
            ).rejects.toThrow('Invalid ID');
        });
    });
});
