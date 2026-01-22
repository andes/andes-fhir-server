export type FhirLink = { relation: string; url: string };

export type PagingConfig = {
  defaultCount?: number; // por defecto 50
  maxCount?: number; // por defecto 200
};

export type PagingParams = {
  count: number;
  offset: number;
};

const DEFAULT_COUNT = 50;
const MAX_COUNT = 200;

function parsePositiveInt(v: unknown, fallback: number): number {
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Construye base URL robusta para escenarios con reverse proxy.
 * Express: req.protocol + req.get('host') funciona solo si trust proxy está bien seteado.
 */
export function getBaseUrl(req: any): string {
  const xfProto = String(req.headers['x-forwarded-proto'] ?? '')
    .split(',')[0]
    .trim();
  const xfHost = String(req.headers['x-forwarded-host'] ?? '')
    .split(',')[0]
    .trim();

  const proto = xfProto || req.protocol || 'http';
  const host = xfHost || (req.get?.('host') ?? req.headers.host);

  return `${proto}://${host}`;
}

/**
 * Lee _count/_offset desde querystring y aplica límites.
 */
export function parsePaging(
  query: Record<string, any>,
  config?: PagingConfig,
): PagingParams {
  const defaultCount = config?.defaultCount ?? DEFAULT_COUNT;
  const maxCount = config?.maxCount ?? MAX_COUNT;

  const rawCount = parsePositiveInt(query?._count, defaultCount);
  const rawOffset = parsePositiveInt(query?._offset, 0);

  // Si mandan _count=0, lo tratamos como "no me mandaste count": usar default
  const count = clamp(rawCount === 0 ? defaultCount : rawCount, 1, maxCount);
  const offset = rawOffset;

  return { count, offset };
}

/**
 * Devuelve Bundle.link con self obligatorio y next/previous si corresponde.
 * Preserva la URL original de la búsqueda, pero fuerza _count/_offset a los usados.
 */
export function buildPagingLinks(
  req: any,
  total: number,
  paging: PagingParams,
): FhirLink[] {
  const base = getBaseUrl(req);
  const u = new URL(req.originalUrl, base);

  u.searchParams.set('_count', String(paging.count));
  u.searchParams.set('_offset', String(paging.offset));

  const links: FhirLink[] = [{ relation: 'self', url: u.toString() }];

  if (paging.offset > 0) {
    const prev = new URL(u.toString());
    prev.searchParams.set(
      '_offset',
      String(Math.max(0, paging.offset - paging.count)),
    );
    links.push({ relation: 'previous', url: prev.toString() });
  }

  if (paging.offset + paging.count < total) {
    const next = new URL(u.toString());
    next.searchParams.set('_offset', String(paging.offset + paging.count));
    links.push({ relation: 'next', url: next.toString() });
  }

  return links;
}

/**
 * Arma fullUrl estándar para Bundle.entry en modo absoluto.
 * Si preferís relativo, podés devolver `Patient/${id}` o `/${version}/Patient/${id}`.
 */
export function buildEntryFullUrl(
  req: any,
  version: string,
  resourceType: string,
  id: string,
): string {
  return `${getBaseUrl(req)}/${version}/${resourceType}/${id}`;
}
