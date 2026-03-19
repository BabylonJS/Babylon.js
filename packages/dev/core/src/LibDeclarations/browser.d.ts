/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/naming-convention */
// Mixins
interface Window {
    CANNON: any;
    DracoDecoderModule: any;
}

interface Uint8Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike> {
    /**
     * Converts the `Uint8Array` to a base64-encoded string.
     * @param options If provided, sets the alphabet and padding behavior used.
     * @returns A base64-encoded string.
     */
    toBase64?(options?: { alphabet?: "base64" | "base64url" | undefined; omitPadding?: boolean | undefined }): string;
}

interface Int8ArrayConstructor {
    new (data: number | ArrayLike<number> | ArrayBufferLike): Int8Array<ArrayBuffer>;
}

interface Uint8ArrayConstructor {
    new (data: number | ArrayLike<number> | ArrayBufferLike): Uint8Array<ArrayBuffer>;

    /**
     * Creates a new `Uint8Array` from a base64-encoded string.
     * @param string The base64-encoded string.
     * @param options If provided, specifies the alphabet and handling of the last chunk.
     * @returns A new `Uint8Array` instance.
     * @throws {SyntaxError} If the input string contains characters outside the specified alphabet, or if the last
     * chunk is inconsistent with the `lastChunkHandling` option.
     */
    fromBase64?(
        string: string,
        options?: {
            alphabet?: "base64" | "base64url" | undefined;
            lastChunkHandling?: "loose" | "strict" | "stop-before-partial" | undefined;
        }
    ): Uint8Array<ArrayBuffer>;
}

interface Float32ArrayConstructor {
    new (data: number | ArrayLike<number> | ArrayBufferLike): Float32Array<ArrayBuffer>;
}

interface WorkerGlobalScope {
    importScripts: (...args: string[]) => void;
}

type WorkerSelf = WindowOrWorkerGlobalScope & WorkerGlobalScope;

// Babylon Extension to enable UIEvents to work with our IUIEvents
interface UIEvent {
    inputIndex: number;
}

// Experimental Pressure API https://wicg.github.io/compute-pressure/
type PressureSource = "cpu";

type PressureState = "nominal" | "fair" | "serious" | "critical";

type PressureFactor = "thermal" | "power-supply";

// Not available in Firefox, Safari, Not baseline.
interface PressureRecord {
    source: PressureSource;
    state: PressureState;
    factors: ReadonlyArray<PressureFactor>;
    time: number;
}

// Not available in Firefox, Safari
interface PressureObserver {
    observe(source: PressureSource): Promise<void>;
    unobserve(source: PressureSource): void;
    disconnect(): void;
    takeRecords(): Array<PressureRecord>;
}

interface PressureObserverOptions {
    sampleRate?: number;
}

type PressureUpdateCallback = (changes: Array<PressureRecord>, observer: PressureObserver) => void;

declare const PressureObserver: {
    prototype: PressureObserver;
    new (callback: PressureUpdateCallback, options?: PressureObserverOptions): PressureObserver;

    knownSources: ReadonlyArray<PressureSource>;
};
