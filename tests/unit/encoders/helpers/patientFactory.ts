import * as basePatient from '../data/patient.json';
import { AndesPatient } from '../../../../src/encoders/types/andes/patient.types';

export type PartialDeep<T> = {
    [K in keyof T]?: T[K] extends object ? PartialDeep<T[K]> : T[K];
};

export const createPatient = (overrides: PartialDeep<AndesPatient> = {}) => {
    const clone: AndesPatient = JSON.parse(JSON.stringify(basePatient));
    return {
        ...clone,
        ...overrides,
    };
};
