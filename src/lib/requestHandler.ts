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
        method = "GET",
        headers = {},
        body,
        json,
        ...rest
    } = params;

    const url = paramUrl || `${host}${port ? `:${port}` : ""}${path || ""}`;

    const requestHeaders: Record<string, string> = { ...headers };
    let requestBody: any = body;

    if (body && typeof body === 'object' && !(body instanceof Uint8Array)) {
        requestHeaders['content-type'] = requestHeaders['content-type'] || requestHeaders['Content-Type'] || 'application/json';
        requestBody = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD' ? requestBody : undefined,
            ...rest
        });

        const text = await response.text();
        return [response.status, text];
    } catch (error: any) {
        throw error;
    }
}

