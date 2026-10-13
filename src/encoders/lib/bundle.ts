import { makeUrl } from './config';

export function encode(ID: any, resources: any) {
    const now = new Date().toISOString();
    return {
        resourceType: 'Bundle',
        id: ID,
        meta: {
            lastUpdated: now
        },
        entry: resources,
        type: 'document',
        timestamp: now,
        identifier: {
            system: makeUrl('Bundle'),
            value: ID
        }
    };
}
