import { type IWebRequest } from "./interfaces/iWebRequest";
import { type Nullable } from "../types";
import { type INative } from "../Engines/Native/nativeInterfaces";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const _native: INative;

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
function createXMLHttpRequest(): XMLHttpRequest {
    // If running in Babylon Native, then defer to the native XMLHttpRequest, which has the same public contract
    if (typeof _native !== "undefined" && _native.XMLHttpRequest) {
        return new _native.XMLHttpRequest();
    } else {
        return new XMLHttpRequest();
    }
}

/**
 * Extended version of XMLHttpRequest with support for customizations (headers, ...)
 */
export class WebRequest implements IWebRequest {
    private readonly _xhr = createXMLHttpRequest();

    /**
     * Custom HTTP Request Headers to be sent with XMLHttpRequests
     * i.e. when loading files, where the server/service expects an Authorization header
     */
    public static CustomRequestHeaders: { [key: string]: string } = {};

    /**
     * Add callback functions in this array to update all the requests before they get sent to the network
     */
    public static CustomRequestModifiers = new Array<(request: XMLHttpRequest, url: string) => string | void>();

    /**
     * If set to true, requests to Babylon.js CDN requests will not be modified
     */
    public static SkipRequestModificationForBabylonCDN = true;

    /**
     * This function can be called to check if there are request modifiers for network requests
     * @returns true if there are any custom requests available
     */
    public static get IsCustomRequestAvailable(): boolean {
        return Object.keys(WebRequest.CustomRequestHeaders).length > 0 || WebRequest.CustomRequestModifiers.length > 0;
    }

    private static _CleanUrl(url: string): string {
        url = url.replace("file:http:", "http:");
        url = url.replace("file:https:", "https:");
        return url;
    }

    private static _ShouldSkipRequestModifications(url: string): boolean {
        return WebRequest.SkipRequestModificationForBabylonCDN && (url.includes("preview.babylonjs.com") || url.includes("cdn.babylonjs.com"));
    }

    /**
     * Merges `CustomRequestHeaders` and `CustomRequestModifiers` into a plain headers record and returns the
     * (possibly rewritten) URL. Can be used to apply URL and header customizations without making a network
     * request (e.g. for streaming media where the download is handled by the browser natively).
     * @param url - The initial URL to modify.
     * @param baseHeaders - An optional set of headers to start with (e.g. from the caller's options) that modifiers can further modify.
     * @returns An object containing the final URL and the merged headers after applying all modifiers and header customizations.
     * @internal
     */
    public static _CollectCustomizations(url: string, baseHeaders: Record<string, string> = {}): { url: string; headers: Record<string, string> } {
        const headers: Record<string, string> = { ...baseHeaders };

        if (WebRequest._ShouldSkipRequestModifications(url)) {
            return { url, headers };
        }

        for (const key in WebRequest.CustomRequestHeaders) {
            const val = WebRequest.CustomRequestHeaders[key];
            if (val) {
                headers[key] = val;
            }
        }

        // Provide a minimal proxy so modifiers can call setRequestHeader as they would on a real XHR.
        const xhrProxy = {
            setRequestHeader: (name: string, value: string) => {
                headers[name] = value;
            },
        } as unknown as XMLHttpRequest;

        for (const modifier of WebRequest.CustomRequestModifiers) {
            if (WebRequest._ShouldSkipRequestModifications(url)) {
                break;
            }
            const newUrl = modifier(xhrProxy, url);
            if (typeof newUrl === "string") {
                url = newUrl;
            }
        }

        return { url, headers };
    }

    /**
     * Performs a network request using the Fetch API when available on the platform, falling back to XMLHttpRequest.
     * `WebRequest.CustomRequestHeaders` and `WebRequest.CustomRequestModifiers` are applied in both cases.
     *
     * For `CustomRequestModifiers`, a minimal proxy XHR is provided to each modifier so that calls to
     * `setRequestHeader` on it are captured and forwarded to the underlying request. The URL returned by a
     * modifier (if any) replaces the current URL before the next modifier runs.
     *
     * @param url - The URL to request.
     * @param options - Optional request options (method, headers, body).
     * @returns A Promise that resolves to a `Response`.
     */
    public static async FetchAsync(url: string, options: { method?: string; headers?: Record<string, string>; body?: BodyInit | null } = {}): Promise<Response> {
        const method = options.method ?? "GET";

        if (typeof fetch !== "undefined") {
            // Use the Fetch API. Collect all customizations into a plain headers object first, since the
            // Fetch API does not share the XHR instance that WebRequest.open/send work with.
            const { url: resolvedUrl, headers } = WebRequest._CollectCustomizations(WebRequest._CleanUrl(url), options.headers ?? {});
            return await fetch(resolvedUrl, { method, headers, body: options.body ?? undefined });
        }

        // Fallback: use a WebRequest instance, which handles _CleanUrl, CustomRequestModifiers and
        // CustomRequestHeaders (via open()) internally — wrapping the response in a Promise<Response>.
        return await new Promise<Response>((resolve, reject) => {
            const request = new WebRequest();
            request.responseType = "arraybuffer";
            request.addEventListener("readystatechange", () => {
                if (request.readyState === 4) {
                    if (request.status >= 200 && request.status < 300) {
                        const responseHeaders = typeof Headers !== "undefined" ? new Headers() : undefined;
                        const contentType = request.getResponseHeader("Content-Type");
                        if (contentType && responseHeaders) {
                            responseHeaders.set("Content-Type", contentType);
                        }
                        if (typeof Response !== "undefined") {
                            resolve(new Response(request.response as ArrayBuffer, { status: request.status, statusText: request.statusText, headers: responseHeaders }));
                        } else {
                            // Minimal Response-like object for environments lacking the Fetch API globals.
                            resolve({
                                ok: true,
                                status: request.status,
                                statusText: request.statusText,
                                headers: { get: (name: string) => request.getResponseHeader(name) },
                                // eslint-disable-next-line @typescript-eslint/naming-convention
                                arrayBuffer: async () => await Promise.resolve(request.response as ArrayBuffer),
                            } as unknown as Response);
                        }
                    } else {
                        reject(new Error(`HTTP ${request.status} loading '${request.requestURL}': ${request.statusText}`));
                    }
                }
            });
            request.open(method, url, options.headers);
            request.send((options.body as Document | XMLHttpRequestBodyInit | null | undefined) ?? null);
        });
    }

    private _requestURL: string = "";

    /**
     * Returns the requested URL once open has been called
     */
    public get requestURL(): string {
        return this._requestURL;
    }

    /**
     * Gets or sets a function to be called when loading progress changes
     */
    public get onprogress(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
        return this._xhr.onprogress;
    }

    public set onprogress(value: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
        this._xhr.onprogress = value;
    }

    /**
     * Returns client's state
     */
    public get readyState(): number {
        return this._xhr.readyState;
    }

    /**
     * Returns client's status
     */
    public get status(): number {
        return this._xhr.status;
    }

    /**
     * Returns client's status as a text
     */
    public get statusText(): string {
        return this._xhr.statusText;
    }

    /**
     * Returns client's response
     */
    public get response(): any {
        return this._xhr.response;
    }

    /**
     * Returns client's response url
     */
    public get responseURL(): string {
        return this._xhr.responseURL;
    }

    /**
     * Returns client's response as text
     */
    public get responseText(): string {
        return this._xhr.responseText;
    }

    /**
     * Gets or sets the expected response type
     */
    public get responseType(): XMLHttpRequestResponseType {
        return this._xhr.responseType;
    }

    public set responseType(value: XMLHttpRequestResponseType) {
        this._xhr.responseType = value;
    }

    /**
     * Gets or sets the timeout value in milliseconds
     */
    public get timeout(): number {
        return this._xhr.timeout;
    }

    public set timeout(value: number) {
        this._xhr.timeout = value;
    }

    /** @internal */
    public addEventListener<K extends keyof XMLHttpRequestEventMap>(
        type: K,
        listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;
    public addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
        this._xhr.addEventListener(type, listener, options);
    }

    /** @internal */
    public removeEventListener<K extends keyof XMLHttpRequestEventMap>(
        type: K,
        listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any,
        options?: boolean | EventListenerOptions
    ): void;
    public removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
        this._xhr.removeEventListener(type, listener, options);
    }

    /**
     * Cancels any network activity
     */
    public abort() {
        this._xhr.abort();
    }

    /**
     * Initiates the request. The optional argument provides the request body. The argument is ignored if request method is GET or HEAD
     * @param body defines an optional request body
     */
    public send(body?: Document | XMLHttpRequestBodyInit | null): void {
        this._xhr.send(body);
    }

    /**
     * Sets the request method, request URL
     * @param method defines the method to use (GET, POST, etc..)
     * @param url defines the url to connect with
     * @param baseHeaders optional headers to include as a base before applying CustomRequestHeaders and modifiers
     */
    public open(method: string, url: string, baseHeaders?: Record<string, string>): void {
        const { url: modifiedUrl, headers } = WebRequest._CollectCustomizations(url, baseHeaders);

        this._requestURL = WebRequest._CleanUrl(modifiedUrl);

        this._xhr.open(method, this._requestURL, true);

        // Apply the collected headers (CustomRequestHeaders + modifier-set headers) to the XHR.
        // Must happen after open() and before send().
        for (const key in headers) {
            this._xhr.setRequestHeader(key, headers[key]);
        }
    }

    /**
     * Sets the value of a request header.
     * @param name The name of the header whose value is to be set
     * @param value The value to set as the body of the header
     */
    setRequestHeader(name: string, value: string): void {
        this._xhr.setRequestHeader(name, value);
    }

    /**
     * Get the string containing the text of a particular header's value.
     * @param name The name of the header
     * @returns The string containing the text of the given header name
     */
    getResponseHeader(name: string): Nullable<string> {
        return this._xhr.getResponseHeader(name);
    }
}
