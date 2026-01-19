type Json =
    | null
    | boolean
    | number
    | string
    | Json[]
    | { [key: string]: Json };

export interface PruneOptions {
    trimStrings?: boolean;        // default: true
    removeEmptyStrings?: boolean; // default: true
    removeNull?: boolean;         // default: true
    removeUndefined?: boolean;    // default: true
    removeEmptyArrays?: boolean;  // default: true
    removeEmptyObjects?: boolean; // default: true
    removeNestedResourceType?: boolean; // default: true - elimina resourceType de objetos anidados
}

const DEFAULT_OPTS: Required<PruneOptions> = {
    trimStrings: true,
    removeEmptyStrings: true,
    removeNull: true,
    removeUndefined: true,
    removeEmptyArrays: true,
    removeEmptyObjects: true,
    removeNestedResourceType: true,
};

/**
 * Detecta si un valor es un ObjectID de MongoDB/BSON
 */
function isObjectId(value: any): boolean {
    return (
        value &&
        typeof value === "object" &&
        value._bsontype === "ObjectID" &&
        typeof value.toString === "function"
    );
}

/**
 * Recursos FHIR que SÍ deben tener resourceType en el nivel superior
 */
const VALID_RESOURCE_TYPES = new Set([
    'Patient', 'Bundle', 'Observation', 'Encounter', 'Practitioner',
    'Organization', 'Location', 'Medication', 'Procedure', 'Condition',
    // Agrega otros tipos de recursos FHIR que uses
]);

/**
 * Elimina claves/valores "vacíos" del JSON de manera recursiva.
 * Importante: NO elimina false ni 0.
 * Convierte ObjectIDs de MongoDB a strings.
 * Elimina resourceType de objetos anidados que no deberían tenerlo.
 */
export function pruneEmpty<T>(input: T, options: PruneOptions = {}): T {
    const opts = { ...DEFAULT_OPTS, ...options };

    const prune = (value: any, isTopLevel = false): any => {
        // undefined / null
        if (value === undefined) return opts.removeUndefined ? undefined : value;
        if (value === null) return opts.removeNull ? undefined : value;

        // ObjectID de MongoDB -> convertir a string
        if (isObjectId(value)) {
            return value.toString();
        }

        // strings
        if (typeof value === "string") {
            const s = opts.trimStrings ? value.trim() : value;
            if (opts.removeEmptyStrings && s === "") return undefined;
            return s;
        }

        // arrays
        if (Array.isArray(value)) {
            const cleaned = value
                .map(item => prune(item, false))
                .filter((v) => v !== undefined);

            if (opts.removeEmptyArrays && cleaned.length === 0) return undefined;
            return cleaned;
        }

        // objects
        if (typeof value === "object") {
            const out: any = {};
            const isValidResource = isTopLevel || VALID_RESOURCE_TYPES.has(value.resourceType);

            for (const [k, v] of Object.entries(value)) {
                // Eliminar resourceType de objetos anidados que no son recursos válidos
                if (k === 'resourceType' && opts.removeNestedResourceType && !isValidResource) {
                    continue;
                }

                const pv = prune(v, false);
                if (pv !== undefined) out[k] = pv;
            }

            if (opts.removeEmptyObjects && Object.keys(out).length === 0) return undefined;
            return out;
        }

        // booleans / numbers (incluye false y 0)
        return value;
    };

    const result = prune(input, true);
    return (result === undefined ? input : result) as T;
}