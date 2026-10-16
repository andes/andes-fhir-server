/**
 * @param params {
 *   url,
 *   host,
 *   port,
 *   path,
 *   method,
 *   headers,
 *   body,
 *   json
 * }
 * @returns Promise<[status, body]>
 */
export async function handleHttpRequest(params: any): Promise<[number, any]> {
    const {
        url: paramUrl,
        host,
        port,
        path,
        method = 'GET',
        headers = {},
        body,
        qs,
        json: _json,
        ...rest
    } = params;

    let url = paramUrl || `${host}${port ? `:${port}` : ''}${path || ''}`;

    if (qs && typeof qs === 'object' && Object.keys(qs).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(qs).forEach(([k, v]) => {
            if (v !== undefined && v !== null) {
                searchParams.append(k, String(v));
            }
        });
        const queryString = searchParams.toString();
        if (queryString) {
            url += (url.includes('?') ? '&' : '?') + queryString;
        }
    }

    const requestHeaders: Record<string, string> = { ...headers };
    let requestBody: any = body;

    if (body && typeof body === 'object' && !(body instanceof Uint8Array)) {
        requestHeaders['content-type'] = requestHeaders['content-type'] || requestHeaders['Content-Type'] || 'application/json';
        requestBody = JSON.stringify(body);
    }

    const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD' ? requestBody : undefined,
        ...rest
    });

    const text = await response.text();
    return [response.status, text];
}

