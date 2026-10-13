import { getDominio, makeUrl, initialize, __reset } from '../../../src/encoders/lib/config';

beforeEach(() => {
    __reset(); // Resetea el dominio antes de cada test
});

test('Get default domain', () => {
    expect(getDominio()).toBe('http://andes.gob.ar');
});

test('Get default URL without id', () => {
    expect(makeUrl('patient')).toBe('http://andes.gob.ar/patient');
});

test('Get default URL with id', () => {
    expect(makeUrl('patient', '123456')).toBe('http://andes.gob.ar/patient/123456');
});

test('Initialize domain modifies getDominio', () => {
    initialize({ dominio: 'http://nuevo-dominio.com' });
    expect(getDominio()).toBe('http://nuevo-dominio.com');
});
