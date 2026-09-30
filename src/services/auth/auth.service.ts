import { Strategy } from 'passport-strategy';
import { Request } from 'express';
import { searchToken } from '../../controller/auth/auth';
import { SaludDigitalClient } from '../../controller/ips/autenticacion';

export interface AuthUser {
    name: string;
    clientId?: string;
    authType: 'x-road' | 'andes-app' | 'federador' | 'bypass';
    scope?: string;
    [key: string]: any;
}

function formatChallenge(error?: string, description?: string): string {
    let challenge = 'Bearer realm="FHIR"';
    if (error) {
        challenge += `, error="${error}"`;
    }
    if (description) {
        challenge += `, error_description="${description}"`;
    }
    return challenge;
}

/**
 * Estrategia de autenticación híbrida:
 * 1. Soporta clientes autorizados por el perímetro X-Road mediante cabecera X-ROAD-CLIENT.
 * 2. Soporta clientes directos mediante token Bearer (tokens locales ANDES en authApps o JWT federados).
 * 3. Mantiene bypass de desarrollo cuando SERVER_AUTH !== 'true'.
 */
export class HybridAuthStrategy extends Strategy {
    name = 'bearer';

    constructor() {
        super();
    }

    async authenticate(req: Request, _options?: any): Promise<void> {
        // 1. Bypass si la autenticación de servidor está deshabilitada
        if (process.env.SERVER_AUTH !== 'true') {
            const bypassUser: AuthUser = {
                name: 'TEST',
                authType: 'bypass',
                scope: 'patient/*.read practitioner/*.read organization/*.read bundle/*.read documentreference/*.read basic/*.read'
            };
            return (this as any).success(bypassUser, { scope: bypassUser.scope });
        }

        // 2. Autenticación perimetral vía X-ROAD (cabecera X-ROAD-CLIENT o x-road-client)
        const xRoadClientHeader = req.headers['x-road-client'] || req.headers['X-ROAD-CLIENT'];
        const xRoadClient = Array.isArray(xRoadClientHeader) ? xRoadClientHeader[0] : xRoadClientHeader;

        if (xRoadClient && typeof xRoadClient === 'string' && xRoadClient.trim().length > 0) {
            const clientName = xRoadClient.trim();

            // Verificación contra lista permitida si está configurada en variables de entorno
            if (process.env.XROAD_ALLOWED_CLIENTS) {
                const allowed = process.env.XROAD_ALLOWED_CLIENTS.split(',').map(c => c.trim().toLowerCase());
                if (!allowed.includes(clientName.toLowerCase())) {
                    return (this as any).fail(formatChallenge('forbidden', 'Cliente X-Road no autorizado'), 403);
                }
            }

            const xRoadUser: AuthUser = {
                name: clientName,
                clientId: clientName,
                authType: 'x-road',
                scope: process.env.XROAD_DEFAULT_SCOPE || 'patient/*.read practitioner/*.read organization/*.read bundle/*.read documentreference/*.read basic/*.read'
            };
            return (this as any).success(xRoadUser, { scope: xRoadUser.scope });
        }

        // 3. Autenticación vía Bearer Token
        let token: string | undefined;
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
                token = parts[1];
            } else {
                return (this as any).fail(400);
            }
        } else if (req.query?.access_token) {
            token = String(req.query.access_token);
        }

        if (!token) {
            return (this as any).fail(formatChallenge(undefined, 'Se requiere header X-ROAD-CLIENT o Authorization Bearer'));
        }

        // 4. Validación del Token
        try {
            // A. Buscar en tokens locales de aplicaciones ANDES (authApps)
            const app = await searchToken(token);
            if (app) {
                if (app.activo) {
                    const appUser: AuthUser = {
                        name: app.nombre || 'ANDES App',
                        clientId: app.nombre,
                        authType: 'andes-app',
                        scope: app.scope || 'patient/*.read practitioner/*.read organization/*.read bundle/*.read documentreference/*.read basic/*.read'
                    };
                    return (this as any).success(appUser, { scope: appUser.scope });
                } else {
                    return (this as any).fail(formatChallenge('invalid_token', 'Token dado de baja'));
                }
            }

            // B. Si tiene formato JWT (3 partes base64url)
            if (token.includes('.') && token.split('.').length === 3) {
                if (process.env.IPS_HOST && process.env.FHIR_DOMAIN && process.env.IPS_SECRET) {
                    const busClient = new SaludDigitalClient(
                        process.env.FHIR_DOMAIN,
                        process.env.IPS_HOST,
                        process.env.IPS_SECRET
                    );
                    const data = await busClient.validarToken(token);
                    if (data && data.valid) {
                        const federadorUser: AuthUser = {
                            name: data.name || 'Federador Nacional',
                            authType: 'federador',
                            scope: 'patient/*.read practitioner/*.read organization/*.read bundle/*.read documentreference/*.read basic/*.read'
                        };
                        return (this as any).success(federadorUser, { scope: federadorUser.scope });
                    }
                }
            }

            return (this as any).fail(formatChallenge('invalid_token', 'Token no autorizado'));
        } catch (err: any) {
            return (this as any).error(err);
        }
    }
}

export const strategy = new HybridAuthStrategy();
