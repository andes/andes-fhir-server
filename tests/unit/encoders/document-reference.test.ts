import { encode } from '../../../src/encoders/lib/document-reference';

describe('DocumentReference encoder', () => {
    const authorDevice = {
        resourceType: 'Device',
        id: 'device-01'
    };
    const organization = {
        resourceType: 'Organization',
        id: 'org-123'
    };
    const patient = {
        id: 'pat-456'
    };
    const binaryURL = 'https://andes.gob.ar/Binary/bin-789';

    test('Encodes DocumentReference with Device author in contained', () => {
        const docRef = encode('doc-1', authorDevice, organization, patient, binaryURL);

        expect(docRef.resourceType).toBe('DocumentReference');
        expect(docRef.id).toBe('doc-1');
        expect(docRef.contained[0].resourceType).toBe('Device');
        expect(docRef.contained[0].identifier[0].system).toBe('https://andes.gob.ar/Device');
        expect(docRef.contained[0].identifier[0].value).toBe('device-01');
        expect(docRef.contained[1].resourceType).toBe('Organization');
        expect(docRef.contained[1].identifier[0].system).toBe('https://andes.gob.ar/Organization');
    });

    test('Encodes DocumentReference with Practitioner author if provided', () => {
        const authorPractitioner = {
            resourceType: 'Practitioner',
            id: 'prac-999'
        };
        const docRef = encode('doc-2', authorPractitioner, organization, patient, binaryURL);

        expect(docRef.contained[0].resourceType).toBe('Practitioner');
        expect(docRef.contained[0].identifier[0].system).toBe('https://andes.gob.ar/Practitioner');
        expect(docRef.contained[0].identifier[0].value).toBe('prac-999');
    });
});
