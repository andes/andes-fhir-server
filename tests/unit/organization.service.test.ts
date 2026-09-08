import OrganizationService from '../../src/services/organization/organization.service';
import * as organizationController from '../../src/controller/organization/organization';

describe('Organization Service', () => {
    it('should be defined and expose correct methods', () => {
        expect(OrganizationService).toBeDefined();
        expect(typeof OrganizationService.search).toBe('function');
        expect(typeof OrganizationService.searchById).toBe('function');
    });

    describe('search', () => {
        it('should return warning if only base_version is provided (no search criteria)', async () => {
            const result = await OrganizationService.search({ base_version: '4_0_1' }, { req: {} });
            expect(result).toEqual({ warning: 'Se requiere enviar al menos un parámetro de búsqueda' });
        });

        it('should call buscarOrganizacion when search criteria is provided', async () => {
            const mockResult = { resourceType: 'Bundle', type: 'searchset', total: 1 };
            const buscarSpy = jest.spyOn(organizationController, 'buscarOrganizacion').mockResolvedValueOnce(mockResult as any);

            const args = { base_version: '4_0_1', name: 'Hospital' };
            const mockReq = { query: {} };
            const context = { req: mockReq };

            const result = await OrganizationService.search(args, context);

            expect(buscarSpy).toHaveBeenCalledWith('4_0_1', args, mockReq);
            expect(result).toBe(mockResult);

            buscarSpy.mockRestore();
        });

        it('should catch and return error when buscarOrganizacion throws', async () => {
            const error = new Error('Database failure');
            const buscarSpy = jest.spyOn(organizationController, 'buscarOrganizacion').mockRejectedValueOnce(error);

            const args = { base_version: '4_0_1', name: 'Hospital' };
            const result = await OrganizationService.search(args, { req: {} });

            expect(result).toBe(error);

            buscarSpy.mockRestore();
        });
    });

    describe('searchById', () => {
        it('should call buscarOrganizacionId with base_version and id', async () => {
            const mockOrg = { resourceType: 'Organization', id: '123' };
            const buscarIdSpy = jest.spyOn(organizationController, 'buscarOrganizacionId').mockResolvedValueOnce(mockOrg as any);

            const args = { base_version: '4_0_1', id: '507f1f77bcf86cd799439011' };
            const result = await OrganizationService.searchById(args, {});

            expect(buscarIdSpy).toHaveBeenCalledWith('4_0_1', '507f1f77bcf86cd799439011');
            expect(result).toBe(mockOrg);

            buscarIdSpy.mockRestore();
        });

        it('should catch and return error when buscarOrganizacionId throws', async () => {
            const error = new Error('ID error');
            const buscarIdSpy = jest.spyOn(organizationController, 'buscarOrganizacionId').mockRejectedValueOnce(error);

            const args = { base_version: '4_0_1', id: 'invalid-id' };
            const result = await OrganizationService.searchById(args, {});

            expect(result).toBe(error);

            buscarIdSpy.mockRestore();
        });
    });
});
