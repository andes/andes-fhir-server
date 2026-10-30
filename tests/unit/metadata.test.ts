import { statementGenerator, getEnvironmentConfig } from '../../src/metadata/statementGenerator';

describe('CapabilityStatement Metadata Generator', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.FHIR_ENV;
        delete process.env.FHIR_IMPLEMENTATION_DESCRIPTION;
        delete process.env.FHIR_DOMAIN;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should return correct environment config for production, testing and local', () => {
        expect(getEnvironmentConfig({ NODE_ENV: 'production' })).toEqual({
            experimental: false,
            description: 'ANDES FHIR Server (R4) - Producción',
        });

        expect(getEnvironmentConfig({ NODE_ENV: 'testing' })).toEqual({
            experimental: true,
            description: 'ANDES FHIR Server (R4) - Testing',
        });

        expect(getEnvironmentConfig({ NODE_ENV: 'development' })).toEqual({
            experimental: true,
            description: 'ANDES FHIR Server (R4) - Desarrollo Local',
        });

        expect(
            getEnvironmentConfig({
                NODE_ENV: 'production',
                FHIR_IMPLEMENTATION_DESCRIPTION: 'Servidor Central Neuquén',
            })
        ).toEqual({
            experimental: false,
            description: 'Servidor Central Neuquén',
        });
    });

    it('should generate CapabilityStatement with ANDES metadata, filtered searchParams and searchRevInclude', () => {
        process.env.NODE_ENV = 'development';

        const { makeStatement } = statementGenerator('4_0_1');
        const rawServerStatement = {
            mode: 'server',
            resource: [
                {
                    type: 'Patient',
                    interaction: [{ code: 'search-type' }, { code: 'read' }, { code: 'create' }],
                    searchParam: [
                        { name: '_id', type: 'token' },
                        { name: 'identifier', type: 'token' },
                        { name: 'family', type: 'string' },
                        { name: 'given', type: 'string' },
                        { name: 'gender', type: 'token' },
                        { name: 'death-date', type: 'date' },
                        { name: 'phonetic', type: 'string' },
                    ],
                },
                {
                    type: 'RelatedPerson',
                    interaction: [{ code: 'search-type' }, { code: 'read' }, { code: 'create' }],
                    searchParam: [
                        { name: '_id', type: 'token' },
                        { name: 'patient', type: 'reference' },
                        { name: 'identifier', type: 'token' },
                        { name: 'name', type: 'string' },
                        { name: 'relationship', type: 'token' },
                        { name: 'gender', type: 'token' },
                        { name: 'active', type: 'token' },
                        { name: 'address-postalcode', type: 'string' },
                    ],
                },
                {
                    type: 'Bundle',
                    interaction: [{ code: 'read' }],
                    searchParam: [
                        { name: 'composition', type: 'reference' },
                    ],
                },
            ],
        };

        const capability = makeStatement(rawServerStatement).toJSON();

        expect(capability.resourceType).toBe('CapabilityStatement');
        expect(capability.publisher).toBe('Ministerio de Salud de la Provincia del Neuquén');
        expect(capability.experimental).toBe(true);
        expect(capability.software).toEqual({
            name: 'ANDES FHIR Server',
            version: '1.0.1',
        });
        expect(capability.implementation).toEqual({
            description: 'ANDES FHIR Server (R4) - Desarrollo Local',
        });
        expect(capability.date).toMatch(/-03:00$/);

        const patientRes = capability.rest[0].resource.find((r: any) => r.type === 'Patient');
        expect(patientRes.searchParam.map((p: any) => p.name)).toEqual([
            '_id',
            'identifier',
            'family',
            'given',
            'gender',
        ]);
        expect(patientRes.searchRevInclude).toEqual([
            'RelatedPerson:patient',
            'Patient:link',
            'Immunization:patient',
        ]);

        const relatedPersonRes = capability.rest[0].resource.find((r: any) => r.type === 'RelatedPerson');
        expect(relatedPersonRes.searchParam.map((p: any) => p.name)).toEqual([
            '_id',
            'patient',
            'identifier',
            'name',
            'relationship',
            'gender',
            'active',
        ]);

        const bundleRes = capability.rest[0].resource.find((r: any) => r.type === 'Bundle');
        expect(bundleRes.searchParam).toBeUndefined();
    });
});
