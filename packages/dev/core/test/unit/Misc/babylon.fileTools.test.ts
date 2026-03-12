import { FileToolsOptions, RequestFile, RequestFileError } from "core/Misc/fileTools";

class FakeXMLHttpRequest {
    public static readonly DONE = 4;
    public static Instances: FakeXMLHttpRequest[] = [];

    public readyState = 0;
    public status = 0;
    public statusText = "";
    public response: unknown = null;
    public responseText = "";
    public responseType = "";
    public timeout = 0;
    public responseURL = "";
    public onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;

    private _timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    private readonly _listeners = new Map<string, Set<any>>();

    public constructor() {
        FakeXMLHttpRequest.Instances.push(this);
    }

    public open(_method: string, url: string): void {
        this.responseURL = url;
        this.readyState = 1;
    }

    public send(): void {
        if (this.timeout > 0) {
            this._timeoutHandle = setTimeout(() => {
                this.readyState = FakeXMLHttpRequest.DONE;
                this.status = 0;
                this.statusText = "Request Timeout";
                this._emit("timeout");
                this._emit("loadend");
            }, this.timeout);
        }
    }

    public completeWithText(status: number, statusText: string, responseText: string): void {
        this._clearTimeout();
        this.readyState = FakeXMLHttpRequest.DONE;
        this.status = status;
        this.statusText = statusText;
        this.responseText = responseText;
        this.response = responseText;
        this._emit("readystatechange");
        this._emit("loadend");
    }

    public abort(): void {
        this._clearTimeout();
    }

    public addEventListener(type: string, listener: any): void {
        if (!this._listeners.has(type)) {
            this._listeners.set(type, new Set());
        }
        this._listeners.get(type)!.add(listener);
    }

    public removeEventListener(type: string, listener: any): void {
        this._listeners.get(type)?.delete(listener);
    }

    public setRequestHeader(_name: string, _value: string): void {}

    public getResponseHeader(_name: string): string | null {
        return null;
    }

    private _clearTimeout(): void {
        if (this._timeoutHandle !== null) {
            clearTimeout(this._timeoutHandle);
            this._timeoutHandle = null;
        }
    }

    private _emit(type: string): void {
        const event = { type, target: this } as unknown as Event;
        for (const listener of this._listeners.get(type) ?? []) {
            if (typeof listener === "function") {
                listener.call(this, event);
            } else {
                listener.handleEvent(event);
            }
        }
        if (type === "progress") {
            this.onprogress?.call(this as unknown as XMLHttpRequest, event as unknown as ProgressEvent);
        }
    }
}

describe("RequestFile", () => {
    const originalRetryStrategy = FileToolsOptions.DefaultRetryStrategy;
    const originalRequestTimeout = FileToolsOptions.RequestTimeout;
    const originalXMLHttpRequest = globalThis.XMLHttpRequest;

    beforeEach(() => {
        jest.useFakeTimers();
        FakeXMLHttpRequest.Instances.length = 0;
        FileToolsOptions.DefaultRetryStrategy = () => -1;
        FileToolsOptions.RequestTimeout = 100;
        globalThis.XMLHttpRequest = FakeXMLHttpRequest as unknown as typeof XMLHttpRequest;
    });

    afterEach(() => {
        jest.useRealTimers();
        FileToolsOptions.DefaultRetryStrategy = originalRetryStrategy;
        FileToolsOptions.RequestTimeout = originalRequestTimeout;
        globalThis.XMLHttpRequest = originalXMLHttpRequest;
    });

    it("fails stalled requests when the request timeout is reached", () => {
        const onSuccess = jest.fn();
        const onError = jest.fn();
        const onComplete = jest.fn();

        const fileRequest = RequestFile("https://example.com/stalled.glb", onSuccess, undefined, undefined, true, onError);
        fileRequest.onCompleteObservable.add(onComplete);

        jest.advanceTimersByTime(FileToolsOptions.RequestTimeout);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledTimes(1);

        const error = onError.mock.calls[0][0];
        expect(error).toBeInstanceOf(RequestFileError);
        expect(error.message).toBe("Request timed out after 100 ms - Unable to load https://example.com/stalled.glb");
    });

    it("preserves the existing successful request flow when request timeouts are disabled", () => {
        const onSuccess = jest.fn();
        const onError = jest.fn();
        const onComplete = jest.fn();

        FileToolsOptions.RequestTimeout = 0;

        const fileRequest = RequestFile("https://example.com/scene.babylon", onSuccess, undefined, undefined, false, onError);
        fileRequest.onCompleteObservable.add(onComplete);

        expect(FakeXMLHttpRequest.Instances[0].timeout).toBe(0);

        jest.advanceTimersByTime(1000);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();

        FakeXMLHttpRequest.Instances[0].completeWithText(200, "OK", "scene-data");

        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onSuccess.mock.calls[0][0]).toBe("scene-data");
        expect(onError).not.toHaveBeenCalled();
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("preserves the existing retry flow for HTTP status failures", () => {
        const onSuccess = jest.fn();
        const onError = jest.fn();
        const onComplete = jest.fn();

        FileToolsOptions.RequestTimeout = 0;
        FileToolsOptions.DefaultRetryStrategy = (_url, _request, retryIndex) => {
            return retryIndex === 0 ? 50 : -1;
        };

        const fileRequest = RequestFile("https://example.com/retriable.babylon", onSuccess, undefined, undefined, false, onError);
        fileRequest.onCompleteObservable.add(onComplete);

        FakeXMLHttpRequest.Instances[0].completeWithText(503, "Service Unavailable", "");
        expect(FakeXMLHttpRequest.Instances).toHaveLength(2);

        jest.advanceTimersByTime(50);
        expect(FakeXMLHttpRequest.Instances).toHaveLength(2);

        FakeXMLHttpRequest.Instances[1].completeWithText(200, "OK", "recovered-data");

        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onSuccess.mock.calls[0][0]).toBe("recovered-data");
        expect(onError).not.toHaveBeenCalled();
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("does not surface a timeout error after an existing request is aborted", () => {
        const onSuccess = jest.fn();
        const onError = jest.fn();
        const onComplete = jest.fn();

        const fileRequest = RequestFile("https://example.com/abort.glb", onSuccess, undefined, undefined, true, onError);
        fileRequest.onCompleteObservable.add(onComplete);

        fileRequest.abort();
        jest.advanceTimersByTime(FileToolsOptions.RequestTimeout + 1000);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("routes timed out requests through the retry strategy before failing", () => {
        const onError = jest.fn();

        FileToolsOptions.DefaultRetryStrategy = (_url, _request, retryIndex) => {
            return retryIndex === 0 ? 50 : -1;
        };

        RequestFile("https://example.com/retry.glb", undefined, undefined, undefined, true, onError);

        jest.advanceTimersByTime(FileToolsOptions.RequestTimeout + 50 + FileToolsOptions.RequestTimeout);

        expect(FakeXMLHttpRequest.Instances).toHaveLength(2);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0].message).toBe("Request timed out after 100 ms - Unable to load https://example.com/retry.glb");
    });
});
