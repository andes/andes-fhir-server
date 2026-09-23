import { snomedConfig } from '../../config';

export interface SnomedConceptSummary {
    conceptId: string;
    term: string;
    fsn: string;
    semanticTag: string;
}

export interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

export function getSemanticTagFromFsn(fsn: string): string {
    if (!fsn) {
        return '';
    }
    const startAt = fsn.lastIndexOf('(');
    const endAt = fsn.lastIndexOf(')');
    if (startAt === -1 || endAt === -1 || startAt >= endAt) {
        return '';
    }
    return fsn.substring(startAt + 1, endAt);
}

export class SnowstormService {
    public host: string;
    public branch: string;
    public config = snomedConfig;
    public defaultTtlMs: number;
    private cache = new Map<string, CacheEntry<any>>();

    constructor(
        host = snomedConfig.snowstormHost,
        branch = snomedConfig.snowstormBranch,
        defaultTtlMs = 60 * 60 * 1000 // 1 hora por defecto
    ) {
        this.host = host.replace(/\/+$/, '');
        this.branch = branch.replace(/^\/+|\/+$/g, '');
        this.defaultTtlMs = defaultTtlMs;
    }

    /**
     * Limpia toda la caché en memoria.
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Obtiene el tamaño actual de elementos en caché.
     */
    getCacheSize(): number {
        return this.cache.size;
    }

    /**
     * Realiza peticiones GET directas al servidor Snowstorm con timeout y lenguaje configurado.
     */
    async httpGetSnowstorm(endpoint: string, qs: Record<string, any> = {}, languageCode = 'es'): Promise<any> {
        try {
            const cleanEndpoint = endpoint.replace(/^\/+/, '');
            const url = new URL(`${this.host}/${cleanEndpoint}`);

            Object.entries(qs).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => url.searchParams.append(key, String(v)));
                    } else {
                        url.searchParams.append(key, String(value));
                    }
                }
            });

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept-Language': languageCode,
                    'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(15000)
            });

            if (response.ok) {
                return await response.json();
            }

            console.error(`[SnowstormService] Error HTTP ${response.status} en ${url.toString()}`);
            return null;
        } catch (error) {
            console.error(`[SnowstormService] Fallo al consultar Snowstorm (${endpoint}):`, error);
            return null;
        }
    }

    /**
     * Obtiene un concepto completo o normalizado por su conceptId (SCTID), con soporte de caché.
     */
    async getConcept(sctid: string | number, format: 'full' | 'summary' = 'full', bypassCache = false): Promise<any> {
        const cacheKey = `concept:${sctid}:${format}`;
        if (!bypassCache) {
            const cached = this.cache.get(cacheKey);
            if (cached && cached.expiresAt > Date.now()) {
                return cached.data;
            }
        }

        const concept = await this.httpGetSnowstorm(`browser/${this.branch}/concepts/${sctid}`);
        if (!concept) {
            return null;
        }

        const term = concept.pt?.term || concept.term || '';
        const fsn = concept.fsn?.term || concept.fsn || '';
        const semanticTag = getSemanticTagFromFsn(fsn);

        const result = format === 'full'
            ? {
                ...concept,
                term,
                fsn,
                semanticTag
            }
            : {
                conceptId: concept.conceptId,
                term,
                fsn,
                semanticTag
            };

        this.cache.set(cacheKey, {
            data: result,
            expiresAt: Date.now() + this.defaultTtlMs
        });

        return result;
    }

    /**
     * Obtiene los hijos o descendientes directos de un concepto.
     */
    async getChildren(
        sctid: string | number,
        options: { all?: boolean; leaf?: boolean; completed?: boolean } = {}
    ): Promise<any[] | null> {
        const { all = false, completed = true } = options;
        let concepts: any[] | null = null;

        if (all) {
            const response = await this.httpGetSnowstorm(
                `${this.branch}/concepts/${sctid}/descendants`,
                { limit: 1000, stated: false }
            );
            if (response) {
                concepts = Array.isArray(response) ? response : (response.items || []);
            }
        } else {
            const response = await this.httpGetSnowstorm(
                `browser/${this.branch}/concepts/${sctid}/children`,
                { limit: 1000, form: 'inferred' }
            );
            if (response) {
                concepts = Array.isArray(response) ? response : (response.items || []);
            }
        }

        if (concepts) {
            const result: any[] = [];
            concepts.forEach((cpt: any) => {
                if (cpt.active === true) {
                    if (completed) {
                        const term = cpt.pt?.term || cpt.term || '';
                        const fsn = cpt.fsn?.term || cpt.fsn || '';
                        result.push({
                            conceptId: cpt.conceptId,
                            term,
                            fsn,
                            semanticTag: getSemanticTagFromFsn(fsn)
                        });
                    } else {
                        result.push(cpt.conceptId);
                    }
                }
            });
            return result;
        }

        return null;
    }

    /**
     * Obtiene conceptos hijos para alergias (por defecto conceptId: 419199007 "alergia a sustancia"),
     * almacenándolos en caché en memoria para optimizar sucesivas consultas.
     */
    async getSnomedAllergies(conceptId: string | number = 419199007, bypassCache = false): Promise<SnomedConceptSummary[]> {
        const cacheKey = `allergies:${conceptId}`;
        if (!bypassCache) {
            const cached = this.cache.get(cacheKey);
            if (cached && cached.expiresAt > Date.now()) {
                return cached.data;
            }
        }

        const childs = await this.getChildren(conceptId, { all: false, completed: true });
        const result = (childs || []) as SnomedConceptSummary[];

        if (result.length > 0) {
            this.cache.set(cacheKey, {
                data: result,
                expiresAt: Date.now() + this.defaultTtlMs
            });
        }

        return result;
    }

    /**
     * Obtiene múltiples conceptos por su ID en lote.
     */
    async getConcepts(conceptIds: (string | number)[]): Promise<any[]> {
        const response = await this.httpGetSnowstorm(`${this.branch}/concepts`, {
            limit: 1000,
            conceptIds
        });
        if (response?.items) {
            return response.items.map((concept: any) => {
                const term = concept.pt?.term || concept.term || '';
                const fsn = concept.fsn?.term || concept.fsn || '';
                return {
                    conceptId: concept.conceptId,
                    term,
                    fsn,
                    semanticTag: getSemanticTagFromFsn(fsn),
                    active: concept.active
                };
            });
        }
        return [];
    }
}

export const snowstormService = new SnowstormService();
