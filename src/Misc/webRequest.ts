/**
 * Extended version of XMLHttpRequest with support for customizations (headers, ...)
 */
export class WebRequest extends XMLHttpRequest {

    /**
     * Custom HTTP Request Headers to be sent with XMLHttpRequests
     * i.e. when loading files, where the server/service expects an Authorization header
     */
    public static CustomRequestHeaders: { [key: string]: string } = {};

    /**
     * Add callback functions in this array to update all the requests before they get sent to the network
     */
    public static CustomRequestModifiers = new Array<(request: WebRequest) => void>();

    private _injectCustomRequestHeaders(): void {
        for (let key in WebRequest.CustomRequestHeaders) {
            const val = WebRequest.CustomRequestHeaders[key];
            if (val) {
                this.setRequestHeader(key, val);
            }
        }
    }

    open(method: string, url: string): void;
    open(method: string, url: string, async: boolean = true, username?: string | null, password?: string | null): void {

        if (WebRequest.CustomRequestHeaders) {
            this._injectCustomRequestHeaders();
        }

        for (var update of WebRequest.CustomRequestModifiers) {
            update(this);
        }

        return super.open(method, url, async, username, password);
    }
}