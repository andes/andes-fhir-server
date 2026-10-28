import { ServerError } from '@bluehalo/node-fhir-server-core';
import OrganizationService from '../../src/services/organization/organization.service';
import * as organizationController from '../../src/controller/organization/organization';

describe('Organization Service', () => {
    it('should be defined and expose correct methods', () => {
        expect(OrganizationService).toBeDefined();
        expect(typeof OrganizationService.search).toBe('function');
        expect(typeof OrganizationService.searchById).toBe('function');
    });

    describe('search', () => {
        it('should throw ServerError if only base_version is provided (no search criteria)', async () => {
            await expect(OrganizationService.search({ base_version: '4_0_1' }, { req: {} }))
                .rejects.toThrow(ServerError);
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

        it('should throw ServerError when buscarOrganizacion throws', async () => {
            const error = new Error('Database failure');
            const buscarSpy = jest.spyOn(organizationController, 'buscarOrganizacion').mockRejectedValueOnce(error);

            const args = { base_version: '4_0_1', name: 'Hospital' };
            await expect(OrganizationService.search(args, { req: {} }))
                .rejects.toThrow('Database failure');

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

        it('should throw ServerError when buscarOrganizacionId throws', async () => {
            const error = new Error('ID error');
            const buscarIdSpy = jest.spyOn(organizationController, 'buscarOrganizacionId').mockRejectedValueOnce(error);

            const args = { base_version: '4_0_1', id: 'invalid-id' };
            await expect(OrganizationService.searchById(args, {}))
                .rejects.toThrow('ID error');

            buscarIdSpy.mockRestore();
        });
    });
});
