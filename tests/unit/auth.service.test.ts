import { HybridAuthStrategy } from '../../src/services/auth/auth.service';
import * as authController from '../../src/controller/auth/auth';
import { SaludDigitalClient } from '../../src/controller/ips/autenticacion';
import { ObjectId } from 'mongodb';

jest.mock('../../src/controller/auth/auth');
jest.mock('../../src/controller/ips/autenticacion');

describe('HybridAuthStrategy & Auth Controller', () => {
    let strategy: HybridAuthStrategy;
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        strategy = new HybridAuthStrategy();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    function createMockRequest(headers: Record<string, string> = {}, query: Record<string, string> = {}) {
        return {
            headers,
            query
        } as any;
    }

    describe('Development Bypass (SERVER_AUTH !== "true")', () => {
        it('should authenticate successfully with TEST user when SERVER_AUTH is not set or false', async () => {
            delete process.env.SERVER_AUTH;
            const req = createMockRequest();

            const successMock = jest.fn();
            (strategy as any).success = successMock;

            await strategy.authenticate(req);

            expect(successMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'TEST',
                    authType: 'bypass'
                }),
                expect.any(Object)
            );
        });
    });

    describe('X-Road Authentication', () => {
        beforeEach(() => {
            process.env.SERVER_AUTH = 'true';
        });

        it('should authenticate successfully when x-road-client header is present (lowercase)', async () => {
            const req = createMockRequest({
                'x-road-client': 'AR/GOB/MSAL/FEDERADOR'
            });

            const successMock = jest.fn();
            (strategy as any).success = successMock;

            await strategy.authenticate(req);

            expect(successMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'AR/GOB/MSAL/FEDERADOR',
                    authType: 'x-road'
                }),
                expect.objectContaining({
                    scope: expect.stringContaining('patient/*.read')
                })
            );
        });

        it('should authenticate successfully when X-ROAD-CLIENT header is present (uppercase)', async () => {
            const req = createMockRequest({
                'X-ROAD-CLIENT': 'AR/PROV/NEUQUEN/ANDES'
            });

            const successMock = jest.fn();
            (strategy as any).success = successMock;

            await strategy.authenticate(req);

            expect(successMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'AR/PROV/NEUQUEN/ANDES',
                    authType: 'x-road'
                }),
                expect.any(Object)
            );
        });

        it('should reject when XROAD_ALLOWED_CLIENTS is configured and client is not in list', async () => {
            process.env.XROAD_ALLOWED_CLIENTS = 'AR/GOB/MSAL/FEDERADOR, AR/PROV/RIO-NEGRO/HOSPITAL';
            const req = createMockRequest({
                'x-road-client': 'AR/UNKNOWN/CLIENT'
            });

            const failMock = jest.fn();
            (strategy as any).fail = failMock;

            await strategy.authenticate(req);

            expect(failMock).toHaveBeenCalledWith(
                expect.stringContaining('Cliente X-Road no autorizado'),
                403
            );
        });
    });

    describe('Bearer Token Authentication', () => {
        const validObjectId = new ObjectId().toHexString();

        beforeEach(() => {
            process.env.SERVER_AUTH = 'true';
        });

        it('should fail with 401 when no X-Road header and no Bearer token are provided', async () => {
            const req = createMockRequest();

            const failMock = jest.fn();
            (strategy as any).fail = failMock;

            await strategy.authenticate(req);

            expect(failMock).toHaveBeenCalledWith(
                expect.stringContaining('Se requiere header X-ROAD-CLIENT o Authorization Bearer')
            );
        });

        it('should fail with 400 when authorization header format is invalid', async () => {
            const req = createMockRequest({
                authorization: 'Basic dXNlcjpwYXNz'
            });

            const failMock = jest.fn();
            (strategy as any).fail = failMock;

            await strategy.authenticate(req);

            expect(failMock).toHaveBeenCalledWith(400);
        });

        it('should authenticate local active ANDES app by valid ObjectId token', async () => {
            const mockApp = {
                nombre: 'Portal Paciente',
                activo: true,
                scope: 'patient/*.read practitioner/*.read'
            };
            (authController.searchToken as jest.Mock).mockResolvedValue(mockApp);

            const req = createMockRequest({
                authorization: `Bearer ${validObjectId}`
            });

            const successMock = jest.fn();
            (strategy as any).success = successMock;

            await strategy.authenticate(req);

            expect(authController.searchToken).toHaveBeenCalledWith(validObjectId);
            expect(successMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Portal Paciente',
                    authType: 'andes-app',
                    scope: 'patient/*.read practitioner/*.read'
                }),
                expect.any(Object)
            );
        });

        it('should reject local inactive ANDES app with "Token dado de baja"', async () => {
            const mockApp = {
                nombre: 'App Antigua',
                activo: false
            };
            (authController.searchToken as jest.Mock).mockResolvedValue(mockApp);

            const req = createMockRequest({
                authorization: `Bearer ${validObjectId}`
            });

            const failMock = jest.fn();
            (strategy as any).fail = failMock;

            await strategy.authenticate(req);

            expect(failMock).toHaveBeenCalledWith(
                expect.stringContaining('Token dado de baja')
            );
        });

        it('should validate JWT with Federador Nacional (SaludDigitalClient) without throwing BSONError', async () => {
            process.env.IPS_HOST = 'https://federador.test';
            process.env.FHIR_DOMAIN = 'https://andes.gob.ar';
            process.env.IPS_SECRET = 'secret123';

            const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.signature';
            (authController.searchToken as jest.Mock).mockResolvedValue(null);

            const mockValidarToken = jest.fn().mockResolvedValue({
                valid: true,
                name: 'Federador Nacional MSAL'
            });
            (SaludDigitalClient as jest.Mock).mockImplementation(() => ({
                validarToken: mockValidarToken
            }));

            const req = createMockRequest({
                authorization: `Bearer ${jwtToken}`
            });

            const successMock = jest.fn();
            (strategy as any).success = successMock;

            await strategy.authenticate(req);

            expect(authController.searchToken).toHaveBeenCalledWith(jwtToken);
            expect(mockValidarToken).toHaveBeenCalledWith(jwtToken);
            expect(successMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Federador Nacional MSAL',
                    authType: 'federador'
                }),
                expect.any(Object)
            );
        });

        it('should reject invalid JWT token with "Token no autorizado"', async () => {
            process.env.IPS_HOST = 'https://federador.test';
            process.env.FHIR_DOMAIN = 'https://andes.gob.ar';
            process.env.IPS_SECRET = 'secret123';

            const jwtToken = 'header.payload.invalid';
            (authController.searchToken as jest.Mock).mockResolvedValue(null);

            const mockValidarToken = jest.fn().mockResolvedValue({ valid: false });
            (SaludDigitalClient as jest.Mock).mockImplementation(() => ({
                validarToken: mockValidarToken
            }));

            const req = createMockRequest({
                authorization: `Bearer ${jwtToken}`
            });

            const failMock = jest.fn();
            (strategy as any).fail = failMock;

            await strategy.authenticate(req);

            expect(failMock).toHaveBeenCalledWith(
                expect.stringContaining('Token no autorizado')
            );
        });
    });

    describe('searchToken safe ObjectId verification', () => {
        it('should return null when token is not a valid 24-hex string and never throw BSONError', async () => {
            const actualAuthController = jest.requireActual('../../src/controller/auth/auth');
            
            // Testing non-hex strings / JWT tokens
            const resultJwt = await actualAuthController.searchToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid');
            expect(resultJwt).toBeNull();

            const resultEmpty = await actualAuthController.searchToken('');
            expect(resultEmpty).toBeNull();

            const resultUndefined = await actualAuthController.searchToken(undefined as any);
            expect(resultUndefined).toBeNull();
        });
    });
});
