import { initialize } from '@bluehalo/node-fhir-server-core';
import path from 'path';

describe('FHIR Server - /metadata', () => {
    let fhirServer: any;
    const testPort = 3123;
    const baseUrl = `http://localhost:${testPort}/4_0_1`;

    beforeAll((done) => {
        const config = require(path.join(process.cwd(), 'dist', 'config.js'));
        fhirServer = initialize(config.fhirServerConfig);
        fhirServer.listen(testPort, () => {
            done();
        });
    });

    afterAll((done) => {
        if (fhirServer && fhirServer.app && typeof fhirServer.app.close === 'function') {
            fhirServer.app.close(done);
        } else {
            done();
        }
    });

    it('should return a valid CapabilityStatement', async () => {
        const response = await fetch(`${baseUrl}/metadata`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.resourceType).toBe('CapabilityStatement');
        expect(data.fhirVersion).toBe('4.0.1');
    });
});
