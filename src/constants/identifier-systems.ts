export const FhirIdentifierSystems = {
    ANDES_ID: 'https://andes.gob.ar',
    MATRICULACIONES: 'https://andes.gob.ar/matriculaciones',
    DNI: 'https://www.renaper.gob.ar/dni',
    CUIL: 'https://www.anses.gob.ar/cuil',
    CUIT: 'https://seti.afip.gob.ar/padron-puc-constancia-internet/ConsultaConstanciaAction.do',
    PASSPORT: 'https://andes.gob.ar/sid/passport',
    FOREIGN_ID: 'https://andes.gob.ar/sid/foreign-id',
    PRESCRIPTIONS: 'https://app.andes.gob.ar/prescriptions',
    SISA: 'https://andes.gob.ar/sisa',
    CUIE: 'https://andes.gob.ar/cuie',
    REMEDIAR: 'https://andes.gob.ar/remediar',
    SIPS: 'https://andes.gob.ar/sips',
} as const;

function toCanonicalKey(uri: string): string {
    return uri
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\/(www\.)?/, '')
        .replace(/\/+$/, '');
}

const CANONICAL_SYSTEM_MAP = new Map<string, string>(
    Object.values(FhirIdentifierSystems).map(uri => [toCanonicalKey(uri), uri])
);

/**
 * Normaliza un URI de identifier system ignorando diferencias de protocolo (http/https),
 * subdominio 'www.' y barras finales, devolviendo la constante oficial de FhirIdentifierSystems
 * si coincide con alguno de los sistemas registrados.
 */
export function resolveIdentifierSystem(system?: string): string {
    if (!system) {
        return '';
    }
    const canonical = toCanonicalKey(String(system));
    return CANONICAL_SYSTEM_MAP.get(canonical) ?? String(system).trim();
}
