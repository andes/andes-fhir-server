import fs from 'fs';
import path from 'path';
import { resolveSchema } from '@bluehalo/node-fhir-server-core';

const SUPPORTED_SEARCH_PARAMS: Record<string, string[]> = {
    Patient: ['_id', 'identifier', 'family', 'given', 'gender'],
    RelatedPerson: ['_id', 'patient', 'identifier', 'name', 'relationship', 'gender', 'active'],
    Practitioner: ['_id', 'active', 'family', 'given', 'identifier'],
    Organization: ['_id', 'active', 'identifier', 'name'],
    DocumentReference: ['subject', 'type', 'custodian'],
    Bundle: [],
    Basic: ['_id', 'code', 'identifier'],
};

const SUPPORTED_REV_INCLUDES: Record<string, string[]> = {
    Patient: ['RelatedPerson:patient', 'Patient:link'],
};

function getServerVersion(): string {
    try {
        const pkgPath = path.resolve(__dirname, '../../package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        return pkg.version || '1.0.1';
    } catch {
        return '1.0.1';
    }
}

export function getEnvironmentConfig(env: Record<string, string | undefined> = process.env): {
    experimental: boolean;
    description: string;
} {
    const rawEnv = (env.FHIR_ENV || env.NODE_ENV || 'development').trim().toLowerCase();
    const customDescription = env.FHIR_IMPLEMENTATION_DESCRIPTION?.trim();

    if (rawEnv === 'production' || rawEnv === 'prod') {
        return {
            experimental: false,
            description: customDescription || 'ANDES FHIR Server (R4) - Producción',
        };
    }

    if (rawEnv === 'testing' || rawEnv === 'staging' || rawEnv === 'test' || rawEnv === 'qa') {
        return {
            experimental: true,
            description: customDescription || 'ANDES FHIR Server (R4) - Testing',
        };
    }

    return {
        experimental: true,
        description: customDescription || 'ANDES FHIR Server (R4) - Desarrollo Local',
    };
}

function formatArgentinaIsoDate(date: Date = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
    const hour = get('hour') === '24' ? '00' : get('hour');
    return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}:${get('second')}-03:00`;
}

function filterResourceCapabilities(resource: any): any {
    if (!resource || !resource.type) {
        return resource;
    }

    const updated = { ...resource };
    const allowedParams = SUPPORTED_SEARCH_PARAMS[resource.type];

    if (Array.isArray(allowedParams)) {
        if (allowedParams.length === 0) {
            delete updated.searchParam;
        } else if (Array.isArray(resource.searchParam)) {
            const allowedSet = new Set(allowedParams);
            updated.searchParam = resource.searchParam.filter((param: any) =>
                allowedSet.has(param.name)
            );
        }
    }

    const revIncludes = SUPPORTED_REV_INCLUDES[resource.type];
    if (revIncludes && revIncludes.length > 0) {
        updated.searchRevInclude = revIncludes;
    }

    return updated;
}

export function securityStatement(securityUrls: any) {
    return {
        cors: true,
        service: [
            {
                coding: [
                    {
                        system: 'http://hl7.org/fhir/restful-security-service',
                        code: 'SMART-on-FHIR',
                    },
                ],
                text: 'Custom OAuth2 using SMART-on-FHIR profile (see http://docs.smarthealthit.org)',
            },
        ],
        extension: [
            {
                url: 'http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris',
                extension: securityUrls,
            },
        ],
    };
}

export function makeStatement(serverStatement: any) {
    const CapabilityStatement = resolveSchema('4_0_1', 'capabilitystatement');
    const { experimental, description } = getEnvironmentConfig();

    const filteredServerStatement = {
        ...serverStatement,
        resource: Array.isArray(serverStatement?.resource)
            ? serverStatement.resource.map(filterResourceCapabilities)
            : serverStatement?.resource,
    };

    return new CapabilityStatement({
        status: 'active',
        experimental,
        date: formatArgentinaIsoDate(),
        publisher: 'Ministerio de Salud de la Provincia del Neuquén',
        kind: 'instance',
        software: {
            name: 'ANDES FHIR Server',
            version: getServerVersion(),
        },
        implementation: {
            description,
            ...(process.env.FHIR_SERVER_URL && { url: process.env.FHIR_SERVER_URL }),
        },
        fhirVersion: '4.0.1',
        format: ['application/fhir+json'],
        rest: [filteredServerStatement],
    });
}

export function statementGenerator(_fhirVersion?: string) {
    return {
        makeStatement,
        securityStatement,
    };
}

export default statementGenerator;
