import { Tools } from "../../Misc/tools";
import { AutoReleaseWorkerPool } from "../../Misc/workerPool";
import type { WorkerPool } from "../../Misc/workerPool";
import type { IDisposable } from "../../scene";
import { initializeWebWorker } from "./dracoCompressionWorker";

/**
 * Configuration for using a Draco codec.
 */
export interface IDracoCodecConfiguration {
    /**
     * The url to the WebAssembly module.
     */
    wasmUrl?: string;

    /**
     * The url to the WebAssembly binary.
     */
    wasmBinaryUrl?: string;

    /**
     * The url to the fallback JavaScript module.
     */
    fallbackUrl?: string;

    /**
     * The number of workers for async operations. Specify `0` to disable web workers and run synchronously in the current context.
     */
    numWorkers?: number;

    /**
     * Optional worker pool to use for async encoding/decoding.
     * If provided, the worker pool will be used as is: no Draco scripts will be loaded, and numWorkers will be ignored.
     */
    workerPool?: WorkerPool;

    /**
     * Optional ArrayBuffer of the WebAssembly binary.
     * If provided it will be used instead of loading the binary from wasmBinaryUrl.
     */
    wasmBinary?: ArrayBuffer;

    /**
     * The codec module if already available.
     */
    jsModule?: unknown /* DracoDecoderModule | DracoEncoderModule */;
}

/**
 * @internal
 */
export function _GetDefaultNumWorkers(): number {
    if (typeof navigator !== "object" || !navigator.hardwareConcurrency) {
        return 1;
    }

    // Use 50% of the available logical processors but capped at 4.
    return Math.min(Math.floor(navigator.hardwareConcurrency * 0.5), 4);
}

/**
 * @internal
 */
export function _IsConfigurationAvailable(config: IDracoCodecConfiguration): boolean {
    return !!((config.wasmUrl && (config.wasmBinary || config.wasmBinaryUrl) && typeof WebAssembly === "object") || config.fallbackUrl);
    // TODO: Account for jsModule
}

/**
 * Base class for a Draco codec.
 * @internal
 */
export abstract class DracoCodec implements IDisposable {
    protected _workerPoolPromise?: Promise<WorkerPool>;
    protected _modulePromise?: Promise<{ module: unknown /** DecoderModule | EncoderModule */ }>;

    /**
     * Checks if the default codec JS module is in scope.
     */
    protected abstract _isModuleAvailable(): boolean;

    /**
     * Creates the JS Module for the corresponding wasm.
     */
    protected abstract _createModuleAsync(
        wasmBinary?: ArrayBuffer,
        jsModule?: unknown /** DracoDecoderModule | DracoEncoderModule */
    ): Promise<{ module: unknown /** DecoderModule | EncoderModule */ }>;

    /**
     * Returns the worker content.
     */
    protected abstract _getWorkerContent(): string;

    /**
     * Constructor
     * @param configuration The configuration for the DracoCodec instance.
     */
    constructor(configuration: IDracoCodecConfiguration) {
        // check if the codec binary and worker pool was injected
        // Note - it is expected that the developer checked if WebWorker, WebAssembly and the URL object are available
        if (configuration.workerPool) {
            // Set the promise accordingly
            this._workerPoolPromise = Promise.resolve(configuration.workerPool);
            return;
        }

        // to avoid making big changes to the code here, if wasmBinary is provided use it in the wasmBinaryPromise
        const wasmBinaryProvided = configuration.wasmBinary;
        const numberOfWorkers = configuration.numWorkers ?? _GetDefaultNumWorkers();
        const useWorkers = numberOfWorkers && typeof Worker === "function" && typeof URL === "function";
        const urlNeeded = useWorkers || !configuration.jsModule;
        // code maintained here for back-compat with no changes

        const codecInfo: { url: string | undefined; wasmBinaryPromise: Promise<ArrayBuffer | undefined> } =
            configuration.wasmUrl && configuration.wasmBinaryUrl && typeof WebAssembly === "object"
                ? {
                      url: urlNeeded ? Tools.GetBabylonScriptURL(configuration.wasmUrl, true) : "",
                      wasmBinaryPromise: wasmBinaryProvided
                          ? Promise.resolve(wasmBinaryProvided)
                          : Tools.LoadFileAsync(Tools.GetBabylonScriptURL(configuration.wasmBinaryUrl, true)),
                  }
                : {
                      url: urlNeeded ? Tools.GetBabylonScriptURL(configuration.fallbackUrl!) : "",
                      wasmBinaryPromise: Promise.resolve(undefined),
                  };
        // If using workers, initialize a worker pool with either the wasm or url?
        if (useWorkers) {
            this._workerPoolPromise = codecInfo.wasmBinaryPromise.then((wasmBinary) => {
                const workerContent = this._getWorkerContent();
                const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));

                return new AutoReleaseWorkerPool(numberOfWorkers as number, () => {
                    const worker = new Worker(workerBlobUrl);
                    return initializeWebWorker(worker, wasmBinary, codecInfo.url);
                });
            });
        } else {
            this._modulePromise = codecInfo.wasmBinaryPromise.then(async (wasmBinary) => {
                if (!this._isModuleAvailable()) {
                    if (!configuration.jsModule) {
                        if (!codecInfo.url) {
                            throw new Error("Draco codec module is not available");
                        }
                        await Tools.LoadBabylonScriptAsync(codecInfo.url);
                    }
                }
                return this._createModuleAsync(wasmBinary as ArrayBuffer, configuration.jsModule);
            });
        }
    }

    /**
     * Returns a promise that resolves when ready. Call this manually to ensure the draco codec is ready before use.
     * @returns a promise that resolves when ready
     */
    public async whenReadyAsync(): Promise<void> {
        if (this._workerPoolPromise) {
            await this._workerPoolPromise;
            return;
        }

        if (this._modulePromise) {
            await this._modulePromise;
            return;
        }
    }

    /**
     * Stop all async operations and release resources.
     */
    public dispose(): void {
        if (this._workerPoolPromise) {
            this._workerPoolPromise.then((workerPool) => {
                workerPool.dispose();
            });
        }

        delete this._workerPoolPromise;
        delete this._modulePromise;
    }
}
