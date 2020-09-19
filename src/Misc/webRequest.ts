import { IWebRequest } from './interfaces/iWebRequest';
import { Nullable } from '../types';

/**
 * Extended version of XMLHttpRequest with support for customizations (headers, ...)
 */
export class WebRequest implements IWebRequest {
    private _xhr = new XMLHttpRequest();

    /**
     * Custom HTTP Request Headers to be sent with XMLHttpRequests
     * i.e. when loading files, where the server/service expects an Authorization header
     */
    public static CustomRequestHeaders: { [key: string]: string } = {};

    /**
     * Add callback functions in this array to update all the requests before they get sent to the network
     */
    public static CustomRequestModifiers = new Array<(request: XMLHttpRequest, url: string) => void>();

    private _injectCustomRequestHeaders(): void {
        for (let key in WebRequest.CustomRequestHeaders) {
            const val = WebRequest.CustomRequestHeaders[key];
            if (val) {
                this._xhr.setRequestHeader(key, val);
            }
        }
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

    /** @hidden */
    public addEventListener<K extends keyof XMLHttpRequestEventMap>(type: K, listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    public addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
        this._xhr.addEventListener(type, listener, options);
    }

    /** @hidden */
    public removeEventListener<K extends keyof XMLHttpRequestEventMap>(type: K, listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
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
    public send(body?: Document | BodyInit | null): void {
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
        for (var update of WebRequest.CustomRequestModifiers) {
            update(this._xhr, url);
        }

        // Clean url
        url = url.replace("file:http:", "http:");
        url = url.replace("file:https:", "https:");

        return this._xhr.open(method, url, true);
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