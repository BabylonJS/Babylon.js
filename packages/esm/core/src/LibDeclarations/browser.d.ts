/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/naming-convention */
// Mixins
interface Window {
    mozIndexedDB: IDBFactory;
    webkitIndexedDB: IDBFactory;
    msIndexedDB: IDBFactory;
    webkitURL: typeof URL;
    mozRequestAnimationFrame(callback: FrameRequestCallback): number;
    oRequestAnimationFrame(callback: FrameRequestCallback): number;
    WebGLRenderingContext: WebGLRenderingContext;
    CANNON: any;
    AudioContext: AudioContext;
    webkitAudioContext: AudioContext;
    PointerEvent: any;
    Math: Math;
    Uint8Array: Uint8ArrayConstructor;
    Float32Array: Float32ArrayConstructor;
    mozURL: typeof URL;
    msURL: typeof URL;
    DracoDecoderModule: any;
    setImmediate(handler: (...args: any[]) => void): number;
}

interface WorkerGlobalScope {
    importScripts: (...args: string[]) => void;
}

type WorkerSelf = WindowOrWorkerGlobalScope & WorkerGlobalScope;

interface HTMLCanvasElement {
    requestPointerLock(): void;
    msRequestPointerLock?(): void;
    mozRequestPointerLock?(): void;
    webkitRequestPointerLock?(): void;

    /** Track whether a record is in progress */
    isRecording: boolean;
    /** Capture Stream method defined by some browsers */
    captureStream(fps?: number): MediaStream;
}

interface CanvasRenderingContext2D {
    msImageSmoothingEnabled: boolean;
}

// Babylon Extension to enable UIEvents to work with our IUIEvents
interface UIEvent {
    inputIndex: number;
}

interface MouseEvent {
    mozMovementX: number;
    mozMovementY: number;
    webkitMovementX: number;
    webkitMovementY: number;
    msMovementX: number;
    msMovementY: number;
}

interface Navigator {
    mozGetVRDevices: (any: any) => any;
    webkitGetUserMedia(constraints: MediaStreamConstraints, successCallback: any, errorCallback: any): void;
    mozGetUserMedia(constraints: MediaStreamConstraints, successCallback: any, errorCallback: any): void;
    msGetUserMedia(constraints: MediaStreamConstraints, successCallback: any, errorCallback: any): void;

    webkitGetGamepads(): Gamepad[];
    msGetGamepads(): Gamepad[];
    webkitGamepads(): Gamepad[];
}

interface HTMLVideoElement {
    mozSrcObject: any;
}

interface Math {
    fround(x: number): number;
    imul(a: number, b: number): number;
    log2(x: number): number;
}

interface OffscreenCanvas extends EventTarget {
    width: number;
    height: number;
}

declare var OffscreenCanvas: {
    prototype: OffscreenCanvas;
    new (width: number, height: number): OffscreenCanvas;
};

// Experimental Pressure API https://wicg.github.io/compute-pressure/
type PressureSource = "cpu";

type PressureState = "nominal" | "fair" | "serious" | "critical";

type PressureFactor = "thermal" | "power-supply";

interface PressureRecord {
    source: PressureSource;
    state: PressureState;
    factors: ReadonlyArray<PressureFactor>;
    time: number;
}

interface PressureObserver {
    observe(source: PressureSource): void;
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

    supportedSources: ReadonlyArray<PressureSource>;
};
