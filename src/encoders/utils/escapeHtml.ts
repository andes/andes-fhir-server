/**
 * Escapa caracteres especiales para contenido seguro dentro de bloques XHTML de FHIR Narrative.
 */
export function escapeHtml(value: unknown = ''): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
