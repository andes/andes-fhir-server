import { initialize } from '@asymmetrik/node-fhir-server-core';
import path from 'path';

const config = require(path.join(process.cwd(), 'dist', 'config.js'));

describe('FHIR Server Initialization', () => {
    it('should initialize server without throwing', () => {
        expect(() => initialize(config.fhirServerConfig)).not.toThrow();
    });
});
