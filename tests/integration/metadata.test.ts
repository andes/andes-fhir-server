import fetch from 'node-fetch';

describe('FHIR Server - /metadata', () => {

    const baseUrl = 'http://localhost:3000/4_0_1';

    it('should return a valid CapabilityStatement', async () => {
        const response = await fetch(`${baseUrl}/metadata`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.resourceType).toBe('CapabilityStatement');
        expect(data.fhirVersion).toBe('4.0.1');
    });

});
