/**
 * @param params {
 *   host,
 *   port,
 *   path,
 *   method,
 *   rejectUnauthorized
 * }
 * @returns Promise<[status, body]>
 */
export async function handleHttpRequest(params: any): Promise<[number, any]> {

    const got = (await import("got")).default;

    const {
        host,
        port,
        path,
        method = "GET",
        rejectUnauthorized = true,
        ...rest
    } = params;

    const url = `${host}${port ? `:${port}` : ""}${path || ""}`;

    try {
        const response = await got(url, {
            method,
            https: { rejectUnauthorized },
            ...rest
        });

        return [response.statusCode, response.body];

    } catch (error: any) {

        if (error.response) {
            return [error.response.statusCode, error.response.body];
        }

        throw error;
    }
}
