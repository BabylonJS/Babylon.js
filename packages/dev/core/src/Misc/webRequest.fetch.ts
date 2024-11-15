import { WebRequest } from "./webRequest";

/**
 * Fetches a resource from the network
 * @param url defines the url to fetch the resource from
 * @param options defines the options to use when fetching the resource
 * @returns a promise that resolves when the resource is fetched
 * @internal
 */
export function _FetchAsync(
    url: string,
    options: Partial<{ method: string; responseHeaders?: string[] }>
): Promise<{ response: Response; headerValues: { [key: string]: string } }> {
    const method = options.method || "GET";
    return new Promise((resolve, reject) => {
        const request = new WebRequest();
        request.addEventListener("readystatechange", () => {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    const headerValues: { [key: string]: string } = {};
                    if (options.responseHeaders) {
                        for (const header of options.responseHeaders) {
                            headerValues[header] = request.getResponseHeader(header) || "";
                        }
                    }

                    resolve({ response: request.response, headerValues: headerValues });
                } else {
                    reject(`Unable to fetch data from ${url}. Error code: ${request.status}`);
                }
            }
        });

        request.open(method, url);
        request.send();
    });
}
