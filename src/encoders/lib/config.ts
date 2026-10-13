import { FhirIdentifierSystems } from "../constants/identifier-systems";

let DOMINIO: string = FhirIdentifierSystems.ANDES_ID;

export function initialize(config: { dominio: string }): void {
    DOMINIO = config.dominio;
}

export function getDominio(): string {
    return DOMINIO;
}

export function makeUrl(resource: string, id?: string | null): string {
    let url = `${DOMINIO}/${resource}`;
    if (id) {
        url += `/${id}`;
    }
    return url;
}

/**
 * Reseteo explícito para tests
 */
export function __reset(): void {
    DOMINIO = FhirIdentifierSystems.ANDES_ID;
}