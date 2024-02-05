import type { IWebRequest } from "./interfaces/iWebRequest";
import type { Nullable } from "../types";
import type { INative } from "../Engines/Native/nativeInterfaces";

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
    public static CustomRequestModifiers = new Array<(request: XMLHttpRequest, url: string) => void>();

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

    private _requestURL: string = "";

    private _injectCustomRequestHeaders(): void {
        if (this._shouldSkipRequestModifications(this._requestURL)) {
            return;
        }
        for (const key in WebRequest.CustomRequestHeaders) {
            const val = WebRequest.CustomRequestHeaders[key];
            if (val) {
                this._xhr.setRequestHeader(key, val);
            }
        }
    }

    private _shouldSkipRequestModifications(url: string): boolean {
        return WebRequest.SkipRequestModificationForBabylonCDN && (url.includes("preview.babylonjs.com") || url.includes("cdn.babylonjs.com"));
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
        if (WebRequest.CustomRequestHeaders) {
            this._injectCustomRequestHeaders();
        }

        this._xhr.send(body);
    }

    /**
     * Sets the request method, request URL
     * @param method defines the method to use (GET, POST, etc..)
     * @param url defines the url to connect with
     */
    public open(method: string, url: string): void {
        for (const update of WebRequest.CustomRequestModifiers) {
            if (this._shouldSkipRequestModifications(url)) {
                return;
            }
            update(this._xhr, url);
        }

        // Clean url
        url = url.replace("file:http:", "http:");
        url = url.replace("file:https:", "https:");

        this._requestURL = url;

        this._xhr.open(method, url, true);
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
