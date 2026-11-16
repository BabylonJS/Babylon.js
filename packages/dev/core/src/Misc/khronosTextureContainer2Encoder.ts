/* eslint-disable @typescript-eslint/naming-convention */
import { Tools } from "./tools.pure";
import { type BaseTexture } from "../Materials/Textures/baseTexture.pure";
import { Constants } from "../Engines/constants";
import { GetTextureDataAsync, _IsCompressedTextureFormat, WhenTextureReadyAsync } from "./textureTools";
import { AsyncLock } from "./asyncLock";
import { AutoReleaseWorkerPool } from "./workerPool";
import { type _IKTX2EncoderDefaultOptions, type IKTX2EncoderOptions } from "../Materials/Textures/ktx2encoderTypes";
import {
    KTX2EncoderWorkerFunction,
    type _KTX2EncoderBasisFactory,
    type IKTX2EncoderInstance,
    type IKTX2EncoderModule,
    type KTX2EncoderWorkerReply,
    type KTX2EncoderWorkerRequest,
} from "./khronosTextureContainer2EncoderWorker";

export type { IKTX2EncoderOptions, KTX2EncoderUsage } from "../Materials/Textures/ktx2encoderTypes";

declare const KTX2ENCODER: IKTX2EncoderModule;

/**
 * Encoder-wide KTX2 encoding options. Defined values override per-call options, as KhronosTextureContainer2.DefaultDecoderOptions does.
 * ETC1S fields apply only to color usage; uastcQualityLevel and zstandard apply only to data and normal usage.
 * @experimental
 */
export class DefaultKTX2EncoderOptions {
    private _isDirty = true;

    /**
     * Gets the dirty flag
     * @experimental
     */
    public get isDirty() {
        return this._isDirty;
    }

    private _etc1sQualityLevel?: number;
    /**
     * Integer ETC1S quality for color usage, from 1 to 255.
     * @experimental
     */
    public get etc1sQualityLevel() {
        return this._etc1sQualityLevel;
    }

    public set etc1sQualityLevel(value: number | undefined) {
        if (this._etc1sQualityLevel === value) {
            return;
        }
        this._etc1sQualityLevel = value;
        this._isDirty = true;
    }

    private _etc1sCompressionLevel?: number;
    /**
     * Integer ETC1S compression effort for color usage, from 0 to 6.
     * @experimental
     */
    public get etc1sCompressionLevel() {
        return this._etc1sCompressionLevel;
    }

    public set etc1sCompressionLevel(value: number | undefined) {
        if (this._etc1sCompressionLevel === value) {
            return;
        }
        this._etc1sCompressionLevel = value;
        this._isDirty = true;
    }

    private _uastcQualityLevel?: number;
    /**
     * Integer UASTC quality for data and normal usage, from 0 to 4.
     * @experimental
     */
    public get uastcQualityLevel() {
        return this._uastcQualityLevel;
    }

    public set uastcQualityLevel(value: number | undefined) {
        if (this._uastcQualityLevel === value) {
            return;
        }
        this._uastcQualityLevel = value;
        this._isDirty = true;
    }

    private _zstandard?: boolean;
    /**
     * Use Zstandard with UASTC for data and normal usage.
     * @experimental
     */
    public get zstandard() {
        return this._zstandard;
    }

    public set zstandard(value: boolean | undefined) {
        if (this._zstandard === value) {
            return;
        }
        this._zstandard = value;
        this._isDirty = true;
    }

    private _ktx2EncoderOptions: _IKTX2EncoderDefaultOptions = {};

    /** @internal */
    public _getKTX2EncoderOptions(): _IKTX2EncoderDefaultOptions {
        if (!this._isDirty) {
            return this._ktx2EncoderOptions;
        }
        this._isDirty = false;
        const options: _IKTX2EncoderDefaultOptions = {};
        if (this._etc1sQualityLevel !== undefined) {
            options.etc1sQualityLevel = this._etc1sQualityLevel;
        }
        if (this._etc1sCompressionLevel !== undefined) {
            options.etc1sCompressionLevel = this._etc1sCompressionLevel;
        }
        if (this._uastcQualityLevel !== undefined) {
            options.uastcQualityLevel = this._uastcQualityLevel;
        }
        if (this._zstandard !== undefined) {
            options.zstandard = this._zstandard;
        }
        this._ktx2EncoderOptions = options;
        return options;
    }
}

/**
 * Options for the KTX2 encoder.
 * @experimental
 */
export interface IKhronosTextureContainer2EncoderOptions {
    /**
     * Number of workers for the shared automatic pool. Specify `0` to encode on the main thread.
     * @experimental
     */
    numWorkers?: number;
    /**
     * Worker pool captured by this instance, whose workers are already initialized with the encoder worker protocol. If set, `numWorkers` is ignored.
     * This release has no public worker bootstrap.
     * @experimental
     */
    workerPool?: AutoReleaseWorkerPool;
    /**
     * Dependencies that replace their URLConfig entries.
     * JavaScript modules cannot be sent to automatic workers; use them with `numWorkers: 0`.
     * The WASM binary is copied to automatic workers and is not detached.
     * @experimental
     */
    binariesAndModulesContainer?: {
        /**
         * The Babylon KTX2 encoder module, such as the KTX2ENCODER global.
         * @experimental
         */
        jsEncoderModule?: IKTX2EncoderModule;
        /**
         * The Basis Universal v2_50 encoder factory, such as the BASIS global.
         * @experimental
         */
        jsBasisEncoder?: _KTX2EncoderBasisFactory;
        /**
         * The Basis Universal v2_50 encoder WASM binary.
         * @experimental
         */
        wasmBasisEncoder?: ArrayBuffer;
    };
}

type EncoderDependencies = NonNullable<IKhronosTextureContainer2EncoderOptions["binariesAndModulesContainer"]>;

interface IEncoderSettings {
    jsEncoderModuleUrl: string;
    basisJsUrl: string;
    basisWasmUrl: string;
    dependencies?: EncoderDependencies;
}

interface IMainThreadEncoder {
    module: IKTX2EncoderModule;
    encoder: IKTX2EncoderInstance;
}

interface IAutomaticWorkerState {
    initialize: (worker: Worker) => Promise<void>;
    ready?: Promise<void>;
    failure: AbortController;
    fail: (error: Error) => void;
    used: boolean;
}

const AutomaticWorkers = new WeakMap<Worker, IAutomaticWorkerState>();
let NextRequestId = 0;

function AbortError(): DOMException {
    return new DOMException("KTX2 encoding was aborted.", "AbortError");
}

function ToError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}

function UsesWorkers(numWorkers: number): boolean {
    return numWorkers > 0 && typeof Worker === "function" && typeof URL !== "undefined";
}

function ValidateTexture(texture: BaseTexture, allowUninitialized: boolean): void {
    const internalTexture = texture.getInternalTexture();
    const engine = internalTexture?.getEngine();
    if (texture.isCube || texture.is3D || texture.is2DArray || internalTexture?.isCube || internalTexture?.is3D || internalTexture?.is2DArray) {
        throw new Error("KTX2 encoding supports only 2D textures, not cube, 3D, or array textures.");
    }
    const hasKnownType = internalTexture?.type !== -1;
    if (texture.textureType !== Constants.TEXTURETYPE_UNSIGNED_BYTE && (!allowUninitialized || hasKnownType)) {
        throw new Error("KTX2 encoding requires an unsigned byte texture.");
    }
    switch (texture.textureFormat) {
        case Constants.TEXTUREFORMAT_ALPHA:
        case Constants.TEXTUREFORMAT_LUMINANCE:
        case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
            if (engine && "webGLVersion" in engine) {
                throw new Error("KTX2 encoding does not support alpha or luminance texture formats on WebGL.");
            }
            break;
        case Constants.TEXTUREFORMAT_R_INTEGER:
        case Constants.TEXTUREFORMAT_RG_INTEGER:
        case Constants.TEXTUREFORMAT_RGB_INTEGER:
        case Constants.TEXTUREFORMAT_RGBA_INTEGER:
            throw new Error("KTX2 encoding does not support integer texture formats.");
    }
    if (internalTexture?._premulAlpha) {
        throw new Error("KTX2 encoding does not support premultiplied alpha.");
    }
    if (_IsCompressedTextureFormat(texture.textureFormat) && !texture.getScene()) {
        throw new Error("KTX2 encoding compressed textures requires a scene for GPU readback.");
    }
}

async function WithAbortAsync<T>(operation: (signal: AbortSignal) => Promise<T>, signal: AbortSignal | undefined, abortError: () => Error = AbortError): Promise<T> {
    return await new Promise<T>((resolve, reject) => {
        const controller = new AbortController();
        const onAbort = () => {
            const error = abortError();
            controller.abort(error);
            reject(error);
        };
        if (signal?.aborted) {
            onAbort();
            return;
        }
        signal?.addEventListener("abort", onAbort, { once: true });
        void (async () => {
            try {
                resolve(await operation(controller.signal));
            } catch (error) {
                reject(ToError(error));
            } finally {
                signal?.removeEventListener("abort", onAbort);
            }
        })();
    });
}

async function PostRequestAsync(worker: Worker, request: KTX2EncoderWorkerRequest & { id: number }, transfer: Transferable[] = []): Promise<KTX2EncoderWorkerReply> {
    return await new Promise((resolve, reject) => {
        const failureSignal = AutomaticWorkers.get(worker)?.failure.signal;
        const cleanup = () => {
            worker.removeEventListener("message", onMessage);
            worker.removeEventListener("error", onError);
            worker.removeEventListener("messageerror", onMessageError);
            failureSignal?.removeEventListener("abort", onFailure);
        };
        const fail = (error: Error) => {
            cleanup();
            reject(error);
        };
        const onMessage = (event: MessageEvent<KTX2EncoderWorkerReply>) => {
            const reply = event.data;
            if (reply?.id !== request.id) {
                return;
            }
            if (reply.action === "error") {
                const error = new Error(reply.message);
                fail(error);
                if (reply.fatal) {
                    AutomaticWorkers.get(worker)?.fail(error);
                }
            } else {
                cleanup();
                resolve(reply);
            }
        };
        const onError = (event: ErrorEvent) => fail(new Error(event.message || "KTX2 encoder worker failed."));
        const onMessageError = () => fail(new Error("KTX2 encoder worker message could not be deserialized."));
        const onFailure = () => fail(ToError(failureSignal?.reason));
        if (failureSignal?.aborted) {
            onFailure();
            return;
        }
        worker.addEventListener("message", onMessage);
        worker.addEventListener("error", onError);
        worker.addEventListener("messageerror", onMessageError);
        failureSignal?.addEventListener("abort", onFailure);
        try {
            worker.postMessage(request, transfer);
        } catch (error) {
            const failure = ToError(error);
            AutomaticWorkers.get(worker)?.fail(failure);
            fail(failure);
        }
    });
}

function CreateAutomaticWorker(workerUrl: string, initialize: (worker: Worker) => Promise<void>): Worker {
    const failure = new AbortController();
    let worker: Worker;
    try {
        worker = new Worker(workerUrl);
    } catch (error) {
        // A rejected factory promise never reaches a pool action. Report construction failure to this job, then replace the slot.
        const placeholder = { postMessage: () => {}, terminate: () => {}, addEventListener: () => {}, removeEventListener: () => {} } as unknown as Worker;
        failure.abort(ToError(error));
        AutomaticWorkers.set(placeholder, { initialize, failure, fail: (error) => failure.abort(error), used: false });
        return placeholder;
    }
    const fail = (error: Error) => {
        if (!failure.signal.aborted) {
            worker.removeEventListener("error", onError);
            worker.removeEventListener("messageerror", onMessageError);
            failure.abort(error);
            worker.terminate();
        }
    };
    const onError = (event: ErrorEvent) => fail(new Error(event.message || "KTX2 encoder worker failed."));
    const onMessageError = () => fail(new Error("KTX2 encoder worker message could not be deserialized."));
    AutomaticWorkers.set(worker, { initialize, failure, fail, used: false });
    // Keep fatal-error listeners between jobs and while initialization is waiting for the WASM.
    worker.addEventListener("error", onError);
    worker.addEventListener("messageerror", onMessageError);
    return worker;
}

class KTX2EncoderWorkerPool extends AutoReleaseWorkerPool {
    private readonly _createEncoderWorker: () => Worker;

    constructor(numWorkers: number, workerUrl: string, initialize: (worker: Worker) => Promise<void>) {
        const createWorker = () => CreateAutomaticWorker(workerUrl, initialize);
        super(numWorkers, async () => createWorker());
        this._createEncoderWorker = createWorker;
    }

    protected override _execute(workerInfo: KTX2EncoderWorkerPool["_workerInfos"][number], action: (worker: Worker, onComplete: () => void) => void): void {
        super._execute(workerInfo, (worker, onComplete) => {
            let currentWorker = worker;
            let state = AutomaticWorkers.get(currentWorker);
            if (state?.used && state.failure.signal.aborted) {
                currentWorker = this._createEncoderWorker();
                workerInfo.workerPromise = Promise.resolve(currentWorker);
                state = AutomaticWorkers.get(currentWorker);
            }
            if (state) {
                state.used = true;
            }
            action(currentWorker, onComplete);
        });
    }
}

async function EnsureWorkerReadyAsync(worker: Worker): Promise<void> {
    const state = AutomaticWorkers.get(worker);
    if (!state) {
        return;
    }
    state.failure.signal.throwIfAborted();
    state.ready ??= WithAbortAsync(
        async () => await state.initialize(worker),
        state.failure.signal,
        () => ToError(state.failure.signal.reason)
    );
    try {
        await state.ready;
    } catch (error) {
        state.fail(ToError(error));
        state.ready = undefined;
        throw error;
    }
}

/**
 * Determines the Basis row flip without modifying pixels.
 * GetTextureDataAsync's direct and LOD RTT paths preserve texture texel row order:
 * WebGL reads bottom-first; WebGPU's Y-flipped RTT draw compensates its top-left origin.
 * Uploaded images undo their upload flip. Compressed uploads retain their source rows;
 * loader UV compensation does not change readback pixels.
 * KTX2's uncompressed fallback uses the regular upload flip.
 * Render targets need a flip on WebGL and on WebGPU, whose render-target draws are Y-flipped.
 * @internal
 */
export function _GetKTX2TextureFlipY(texture: BaseTexture): boolean {
    const internalTexture = texture.getInternalTexture();
    const engine = internalTexture?.getEngine() ?? texture.getScene()?.getEngine();
    if (texture.isRenderTarget) {
        return !!engine && (engine.hasOriginBottomLeft || engine.isWebGPU);
    }
    if (_IsCompressedTextureFormat(texture.textureFormat)) {
        return false;
    }
    return !!internalTexture?.invertY && !internalTexture._invertVScale;
}

/**
 * Encodes Babylon textures to KTX2 through a shared pool of Basis Universal workers.
 * This is groundwork for future glTF export; encoding is internal for now.
 * Configure URLConfig, WorkerPool, and constructor options before the first construction, which fixes the automatic configuration.
 * Fatally failed automatic workers are terminated and replaced for the next job.
 * Normal encode-error replies and cancellation do not terminate healthy workers. Caller-provided pools remain caller-owned.
 * Each worker starts with approximately 128 MiB of WASM memory.
 * The official Basis v2_50 factory requires CSP 'unsafe-eval' for Embind.
 * @experimental
 */
export class KhronosTextureContainer2Encoder {
    /**
     * URLs of the Babylon encoder module and its Basis Universal v2_50 dependencies.
     * Each URL is resolved with Tools.GetBabylonScriptURL. Configure before the first construction.
     * @experimental
     */
    public static URLConfig: {
        jsEncoderModule: string;
        jsBasisEncoder: string;
        wasmBasisEncoder: string;
    } = {
        jsEncoderModule: `${Tools._DefaultCdnUrl}/babylon.ktx2Encoder.js`,
        jsBasisEncoder: `${Tools._DefaultCdnUrl}/basisEncoder/v2_50/basis_encoder.js`,
        wasmBasisEncoder: `${Tools._DefaultCdnUrl}/basisEncoder/v2_50/basis_encoder.wasm`,
    };

    /**
     * Worker pool to use instead of creating one. Its workers must already be initialized with the encoder worker protocol;
     * this release has no public worker bootstrap. Each instance captures this setting at construction and never disposes the pool.
     * @experimental
     */
    public static WorkerPool?: AutoReleaseWorkerPool;

    /**
     * Default number of workers: half the logical processors, from 1 to 2.
     * @experimental
     */
    public static DefaultNumWorkers = typeof navigator === "object" && navigator.hardwareConcurrency ? Math.max(1, Math.min(2, Math.floor(navigator.hardwareConcurrency / 2))) : 1;

    /**
     * Encoder-wide options. Defined values override per-call options for the usages they apply to.
     * @experimental
     */
    public static DefaultEncoderOptions = new DefaultKTX2EncoderOptions();

    private static _WorkerPoolPromise?: Promise<AutoReleaseWorkerPool>;
    private static _MainThreadSettings?: IEncoderSettings;
    private static _MainThreadEncoderPromise?: Promise<IMainThreadEncoder>;
    private static readonly _MainThreadLock = new AsyncLock();
    private readonly _workerPool?: AutoReleaseWorkerPool;

    private static _Initialize(numWorkers: number, dependencies: EncoderDependencies | undefined): void {
        if (KhronosTextureContainer2Encoder._WorkerPoolPromise || KhronosTextureContainer2Encoder._MainThreadSettings) {
            return;
        }
        const urls = KhronosTextureContainer2Encoder.URLConfig;
        const settings: IEncoderSettings = {
            jsEncoderModuleUrl: Tools.GetBabylonScriptURL(urls.jsEncoderModule, true),
            basisJsUrl: Tools.GetBabylonScriptURL(urls.jsBasisEncoder, true),
            basisWasmUrl: Tools.GetBabylonScriptURL(urls.wasmBasisEncoder, true),
            dependencies: dependencies ? { ...dependencies } : undefined,
        };
        if (!UsesWorkers(numWorkers)) {
            KhronosTextureContainer2Encoder._MainThreadSettings = settings;
            return;
        }
        const injectedWasm = dependencies?.wasmBasisEncoder?.slice(0);
        let wasmPromise: Promise<ArrayBuffer> | undefined;
        const loadWasmAsync = async (): Promise<ArrayBuffer> => {
            if (injectedWasm) {
                return injectedWasm;
            }
            wasmPromise ??= Tools.LoadFileAsync(settings.basisWasmUrl);
            try {
                return await wasmPromise;
            } catch (error) {
                wasmPromise = undefined;
                throw error;
            }
        };
        const initializeAsync = async (worker: Worker) => {
            const wasmBinary = await loadWasmAsync();
            await PostRequestAsync(worker, { action: "init", id: NextRequestId++, jsEncoderModuleUrl: settings.jsEncoderModuleUrl, basisJsUrl: settings.basisJsUrl, wasmBinary });
        };
        const workerUrl = URL.createObjectURL(new Blob([`(${KTX2EncoderWorkerFunction.toString()})()`], { type: "application/javascript" }));
        KhronosTextureContainer2Encoder._WorkerPoolPromise = Promise.resolve(new KTX2EncoderWorkerPool(numWorkers, workerUrl, initializeAsync));
    }

    private static async _CreateMainThreadEncoderAsync(settings: IEncoderSettings): Promise<IMainThreadEncoder> {
        const dependencies = settings.dependencies;
        let module = dependencies?.jsEncoderModule;
        if (!module) {
            if (typeof KTX2ENCODER === "undefined") {
                await Tools.LoadBabylonScriptAsync(settings.jsEncoderModuleUrl);
            }
            module = KTX2ENCODER;
        }
        const wasmBinary = dependencies?.wasmBasisEncoder ?? (await Tools.LoadFileAsync(settings.basisWasmUrl));
        const constructor = module.KTX2Encoder;
        const { JSModule, WasmBinary, JSModuleURL, WasmModuleURL } = constructor;
        let encoder: IKTX2EncoderInstance;
        try {
            constructor.JSModule = dependencies?.jsBasisEncoder ?? null;
            constructor.WasmBinary = wasmBinary;
            constructor.JSModuleURL = settings.basisJsUrl;
            constructor.WasmModuleURL = settings.basisWasmUrl;
            encoder = new constructor();
        } finally {
            constructor.JSModule = JSModule;
            constructor.WasmBinary = WasmBinary;
            constructor.JSModuleURL = JSModuleURL;
            constructor.WasmModuleURL = WasmModuleURL;
        }
        await encoder._initializeAsync();
        return { module, encoder };
    }

    /**
     * Configures the shared encoder without loading scripts or creating workers.
     * The first construction without a worker pool fixes the automatic worker count, URLs, and dependencies.
     * @param numWorkersOrOptions The number of workers, or encoder options. Specify `0` to encode on the main thread.
     * @experimental
     */
    public constructor(numWorkersOrOptions: number | IKhronosTextureContainer2EncoderOptions = KhronosTextureContainer2Encoder.DefaultNumWorkers) {
        const options = typeof numWorkersOrOptions === "number" ? { numWorkers: numWorkersOrOptions } : numWorkersOrOptions;
        this._workerPool = options.workerPool ?? KhronosTextureContainer2Encoder.WorkerPool;
        if (this._workerPool) {
            return;
        }
        const numWorkers = options.numWorkers ?? KhronosTextureContainer2Encoder.DefaultNumWorkers;
        if (!Number.isInteger(numWorkers) || numWorkers < 0) {
            throw new Error("KTX2 encoder numWorkers must be a non-negative integer.");
        }
        const dependencies = options.binariesAndModulesContainer;
        if (UsesWorkers(numWorkers) && (dependencies?.jsEncoderModule || dependencies?.jsBasisEncoder)) {
            throw new Error("KTX2 encoder JavaScript modules cannot be sent to automatic workers. Use numWorkers: 0 or a prepared workerPool.");
        }
        KhronosTextureContainer2Encoder._Initialize(numWorkers, dependencies);
    }

    /**
     * Encodes level zero of a 2D unsigned byte texture to a top-down KTX2 image.
     * flipY and mipmap generation are derived from the texture. Texture UV transforms are not baked into the image.
     * Cancellation rejects promptly; an active worker finishes its encode before taking more work, and main-thread encoding is cooperative.
     * @param texture Source texture. Dimensions must be multiples of 4 from 4 through 16,384, with at most 12,582,912 pixels.
     * @param options Encoding options and an optional cancellation signal.
     * @returns KTX2 file bytes.
     * @internal
     */
    public async _encodeAsync(texture: BaseTexture, options: Omit<IKTX2EncoderOptions, "flipY" | "generateMipmaps"> & { signal?: AbortSignal }): Promise<Uint8Array> {
        const { signal, ...requestedOptions } = options;
        if (signal?.aborted) {
            throw AbortError();
        }
        const workerPoolPromise = this._workerPool ? Promise.resolve(this._workerPool) : KhronosTextureContainer2Encoder._WorkerPoolPromise;
        const settings = KhronosTextureContainer2Encoder._MainThreadSettings;
        if (!workerPoolPromise && !settings) {
            throw new Error("KTX2 encoder is not initialized.");
        }
        ValidateTexture(texture, true);
        await WithAbortAsync(async (abortSignal) => await WhenTextureReadyAsync(texture, abortSignal), signal);
        ValidateTexture(texture, false);
        const { width, height } = texture.getSize();
        const readback = await WithAbortAsync(async () => await GetTextureDataAsync(texture, width, height, 0, 0, false, 0, false), signal);
        const rgba = readback.buffer instanceof ArrayBuffer ? readback : readback.slice();
        // WebGPU reads BGRA textures back in storage order.
        if (texture.textureFormat === Constants.TEXTUREFORMAT_BGRA && texture.getInternalTexture()?.getEngine().isWebGPU) {
            for (let index = 0; index < rgba.length; index += 4) {
                const blue = rgba[index];
                rgba[index] = rgba[index + 2];
                rgba[index + 2] = blue;
            }
        }
        const encodingOptions: IKTX2EncoderOptions = {
            ...requestedOptions,
            generateMipmaps: !texture.noMipmap && (texture.getInternalTexture()?.generateMipMaps ?? true),
            flipY: _GetKTX2TextureFlipY(texture),
        };
        if (workerPoolPromise) {
            return await KhronosTextureContainer2Encoder._EncodeOnWorkerAsync(await workerPoolPromise, rgba, width, height, encodingOptions, signal);
        }
        return await KhronosTextureContainer2Encoder._EncodeOnMainThreadAsync(settings!, rgba, width, height, encodingOptions, signal);
    }

    private static async _EncodeOnWorkerAsync(
        workerPool: AutoReleaseWorkerPool,
        rgba: Uint8Array,
        width: number,
        height: number,
        options: IKTX2EncoderOptions,
        signal: AbortSignal | undefined
    ): Promise<Uint8Array> {
        return await new Promise<Uint8Array>((resolve, reject) => {
            let settled = false;
            const onAbort = () => settle(() => reject(AbortError()));
            const settle = (complete: () => void) => {
                if (!settled) {
                    settled = true;
                    signal?.removeEventListener("abort", onAbort);
                    complete();
                }
            };
            if (signal?.aborted) {
                onAbort();
                return;
            }
            signal?.addEventListener("abort", onAbort, { once: true });
            workerPool.push((worker, onComplete) => {
                if (settled) {
                    onComplete();
                    return;
                }
                void (async () => {
                    try {
                        await EnsureWorkerReadyAsync(worker);
                        if (!settled) {
                            const defaults = KhronosTextureContainer2Encoder.DefaultEncoderOptions._getKTX2EncoderOptions();
                            try {
                                AutomaticWorkers.get(worker)?.failure.signal.throwIfAborted();
                                worker.postMessage({ action: "setDefaultEncoderOptions", options: defaults });
                            } catch (error) {
                                AutomaticWorkers.get(worker)?.fail(ToError(error));
                                throw error;
                            }
                            const reply = await PostRequestAsync(worker, { action: "encode", id: NextRequestId++, rgba, width, height, options }, [rgba.buffer as ArrayBuffer]);
                            if (reply.action !== "encoded") {
                                throw new Error("KTX2 encoder worker sent an unexpected reply.");
                            }
                            settle(() => resolve(reply.data));
                        }
                    } catch (error) {
                        settle(() => reject(ToError(error)));
                    } finally {
                        onComplete();
                    }
                })();
            });
        });
    }

    private static async _EncodeOnMainThreadAsync(
        settings: IEncoderSettings,
        rgba: Uint8Array,
        width: number,
        height: number,
        options: IKTX2EncoderOptions,
        signal: AbortSignal | undefined
    ): Promise<Uint8Array> {
        const { module, encoder } = await WithAbortAsync(async () => {
            const initialization = (KhronosTextureContainer2Encoder._MainThreadEncoderPromise ??= KhronosTextureContainer2Encoder._CreateMainThreadEncoderAsync(settings));
            try {
                return await initialization;
            } catch (error) {
                if (KhronosTextureContainer2Encoder._MainThreadEncoderPromise === initialization) {
                    KhronosTextureContainer2Encoder._MainThreadEncoderPromise = undefined;
                }
                throw error;
            }
        }, signal);
        return await WithAbortAsync(async (abortSignal) => {
            return await KhronosTextureContainer2Encoder._MainThreadLock.lockAsync(async () => {
                await new Promise<void>((resolve) => setTimeout(resolve, 0));
                abortSignal.throwIfAborted();
                const defaults = module.KTX2Encoder.DefaultEncoderOptions;
                let encoding: Promise<Uint8Array>;
                try {
                    module.KTX2Encoder.DefaultEncoderOptions = KhronosTextureContainer2Encoder.DefaultEncoderOptions._getKTX2EncoderOptions();
                    encoding = encoder.encode(rgba, width, height, options);
                } finally {
                    module.KTX2Encoder.DefaultEncoderOptions = defaults;
                }
                return await encoding;
            }, abortSignal);
        }, signal);
    }
}
