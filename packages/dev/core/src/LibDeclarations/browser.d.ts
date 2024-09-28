/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/naming-convention */
// Mixins
interface Window {
    CANNON: any;
    DracoDecoderModule: any;
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

    knownSources: ReadonlyArray<PressureSource>;
};
