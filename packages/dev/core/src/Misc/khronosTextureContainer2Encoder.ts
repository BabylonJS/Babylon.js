/* eslint-disable @typescript-eslint/naming-convention */
import { Tools } from "./tools.pure";
import { type BaseTexture } from "../Materials/Textures/baseTexture.pure";
import { Constants } from "../Engines/constants";
import { GetTextureDataAsync, IsCompressedTextureFormat, WhenTextureReadyAsync } from "./textureTools";
import { AsyncLock } from "./asyncLock";
import { AutoReleaseWorkerPool } from "./workerPool";
import { _ValidateKTX2EncoderDimensions, type IKTX2EncoderOptions } from "../Materials/Textures/ktx2encoderTypes";
import {
    KTX2EncoderWorkerFunction,
    type IKTX2EncoderInstance,
    type IKTX2EncoderModule,
    type KTX2EncoderWorkerReply,
    type KTX2EncoderWorkerRequest,
} from "./khronosTextureContainer2EncoderWorker";

export type { IKTX2EncoderOptions, KTX2EncoderUsage } from "../Materials/Textures/ktx2encoderTypes";

/**
 * Resource locations and worker count for an encoder-owned pool.
 * @experimental
 */
export interface IKhronosTextureContainer2EncoderConfiguration {
    /** URL of the agnostic encoder's UMD bundle. */
    jsEncoderModuleUrl: string;
    /** URL of the Basis Universal v2_50 JavaScript factory. */
    basisJsUrl: string;
    /** URL of the Basis Universal v2_50 WASM binary. */
    basisWasmUrl: string;
    /** Inject the WASM binary instead of fetching it. The binary is not detached. */
    wasmBinary?: ArrayBuffer;
    /** Number of workers. Zero runs synchronously on the calling thread after initialization. */
    numWorkers: number;
}

/**
 * Options for encoding a Babylon texture. Usage is explicit and never inferred from gammaSpace.
 * @experimental
 */
export interface IEncodeTextureToKTX2Options extends Omit<IKTX2EncoderOptions, "generateMipmaps" | "flipY"> {
    /** Generate mipmaps. Defaults to the source texture's mipmap setting. */
    generateMipmaps?: boolean;
    /** Abort readiness, readback waiting, or encoding. */
    signal?: AbortSignal;
}

interface IEncodeJob {
    id: number;
    rgba: Uint8Array;
    width: number;
    height: number;
    options: IKTX2EncoderOptions;
    resolve: (data: Uint8Array) => void;
    reject: (error: Error) => void;
    signal?: AbortSignal;
    onAbort?: () => void;
}

interface IEncoderWorker {
    worker: Worker;
    initId: number;
    ready: boolean;
    job?: IEncodeJob;
}

declare const KTX2ENCODER: IKTX2EncoderModule;

function AbortError(): DOMException {
    return new DOMException("KTX2 encoding was aborted.", "AbortError");
}

function ToError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}

function DisposedError(): Error {
    return new Error("KTX2 encoder has been disposed.");
}

function ValidateTexture(texture: BaseTexture, allowUninitialized: boolean): void {
    const internalTexture = texture.getInternalTexture();
    if (texture.isCube || texture.is3D || texture.is2DArray || internalTexture?.isCube || internalTexture?.is3D || internalTexture?.is2DArray) {
        throw new Error("KTX2 encoding supports only 2D textures, not cube, 3D, or array textures.");
    }
    const hasKnownType = internalTexture?.type !== -1;
    if (texture.textureType !== Constants.TEXTURETYPE_UNSIGNED_BYTE && (!allowUninitialized || hasKnownType)) {
        throw new Error("KTX2 encoding requires an unsigned byte texture.");
    }
    if (internalTexture?._premulAlpha) {
        throw new Error("KTX2 encoding does not support premultiplied alpha.");
    }
    if (IsCompressedTextureFormat(texture.textureFormat) && !texture.getScene()) {
        throw new Error("KTX2 encoding compressed textures requires a scene for GPU readback.");
    }
    const { width, height } = texture.getSize();
    if (!allowUninitialized || width > 0 || height > 0) {
        _ValidateKTX2EncoderDimensions(width, height);
    }
}

async function WithAbortAsync<T>(operation: (signal: AbortSignal) => Promise<T>, signal: AbortSignal | undefined, disposeSignal: AbortSignal): Promise<T> {
    return await new Promise<T>((resolve, reject) => {
        const controller = new AbortController();
        const cleanup = () => {
            signal?.removeEventListener("abort", onAbort);
            disposeSignal.removeEventListener("abort", onEncoderDispose);
        };
        const fail = (error: Error) => {
            controller.abort(error);
            cleanup();
            reject(error);
        };
        const onAbort = () => fail(AbortError());
        const onEncoderDispose = () => fail(DisposedError());
        signal?.addEventListener("abort", onAbort, { once: true });
        disposeSignal.addEventListener("abort", onEncoderDispose, { once: true });
        if (signal?.aborted) {
            onAbort();
            return;
        } else if (disposeSignal.aborted) {
            onEncoderDispose();
            return;
        }
        void (async () => {
            try {
                resolve(await operation(controller.signal));
            } catch (error) {
                reject(ToError(error));
            } finally {
                cleanup();
            }
        })();
    });
}

/**
 * Determines the Basis row flip without modifying pixels.
 * GetTextureDataAsync's direct and LOD RTT paths preserve texture texel row order:
 * WebGL reads bottom-first; WebGPU's Y-flipped RTT draw compensates its top-left origin.
 * Uploaded images undo their upload flip. Compressed uploads cannot apply that flip;
 * KTX1 compensates with _invertVScale, while compressed KTX2 and DDS retain their source rows.
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
    if (internalTexture?._extension !== ".ktx" && IsCompressedTextureFormat(texture.textureFormat)) {
        return false;
    }
    return !!internalTexture?.invertY && !internalTexture._invertVScale;
}

/**
 * Encodes level zero of a 2D unsigned byte texture to a top-down KTX2 image.
 * Texture UV transforms are not baked into the image. GPU readback may convert compressed source pixels.
 * Each pending call holds its full RGBA buffer, so batch callers should limit concurrency.
 * @param texture Source texture. Width and height must be positive multiples of 4, with at most 12,582,912 pixels.
 * @param options Explicit usage, optional mipmap override, and cancellation signal.
 * @param encoder Encoder to use. Defaults to KhronosTextureContainer2Encoder.Default.
 * @returns KTX2 file bytes.
 * @experimental
 */
export async function EncodeTextureToKTX2Async(texture: BaseTexture, options: IEncodeTextureToKTX2Options, encoder?: KhronosTextureContainer2Encoder): Promise<Uint8Array> {
    if (options.signal?.aborted) {
        throw AbortError();
    }
    ValidateTexture(texture, true);
    const activeEncoder = encoder ?? KhronosTextureContainer2Encoder.Default;
    await WithAbortAsync(async (signal) => await WhenTextureReadyAsync(texture, signal), options.signal, activeEncoder._disposeSignal);
    ValidateTexture(texture, false);
    const { width, height } = texture.getSize();
    const pixels = await WithAbortAsync(async () => await GetTextureDataAsync(texture, width, height, 0, 0, false, 0, false), options.signal, activeEncoder._disposeSignal);
    return await activeEncoder.encodeAsync(pixels, width, height, {
        ...options,
        generateMipmaps: options.generateMipmaps ?? (!texture.noMipmap && (texture.getInternalTexture()?.generateMipMaps ?? true)),
        flipY: _GetKTX2TextureFlipY(texture),
    });
}

/**
 * Encodes RGBA8 pixels through an owned, cancellable pool of Basis Universal workers.
 * Each worker starts with approximately 128 MiB of WASM memory.
 * The official Basis v2_50 factory requires CSP 'unsafe-eval' for Embind.
 * @experimental
 */
export class KhronosTextureContainer2Encoder {
    /**
     * Default resource URLs and worker count. Override before accessing Default.
     * @experimental
     */
    public static DefaultConfiguration: IKhronosTextureContainer2EncoderConfiguration = {
        jsEncoderModuleUrl: `${Tools._DefaultCdnUrl}/babylon.ktx2Encoder.js`,
        basisJsUrl: `${Tools._DefaultCdnUrl}/basisEncoder/v2_50/basis_encoder.js`,
        basisWasmUrl: `${Tools._DefaultCdnUrl}/basisEncoder/v2_50/basis_encoder.wasm`,
        numWorkers: typeof navigator === "object" && navigator.hardwareConcurrency ? Math.max(1, Math.min(2, Math.floor(navigator.hardwareConcurrency / 2))) : 1,
    };

    private static _Default?: KhronosTextureContainer2Encoder;

    /**
     * Lazily creates the default encoder.
     * @experimental
     */
    public static get Default(): KhronosTextureContainer2Encoder {
        return (this._Default ??= new KhronosTextureContainer2Encoder());
    }

    /**
     * Disposes and clears the default encoder.
     * @experimental
     */
    public static ResetDefault(): void {
        this._Default?.dispose();
        this._Default = undefined;
    }

    private readonly _configuration: IKhronosTextureContainer2EncoderConfiguration;
    private readonly _useWorkers: boolean;
    private readonly _disposeController = new AbortController();
    private _disposed = false;
    private _nextId = 0;
    private _queue: IEncodeJob[] = [];
    private _jobs = new Set<IEncodeJob>();
    private _workers: IEncoderWorker[] = [];
    private _blobUrl?: string;
    private _resourcesPromise?: Promise<void>;
    private _wasmBinary?: ArrayBuffer;
    private _encoder?: IKTX2EncoderInstance;
    private _idleTimer?: ReturnType<typeof setTimeout>;
    private readonly _mainThreadLock = new AsyncLock();

    /** @internal */
    public get _disposeSignal(): AbortSignal {
        return this._disposeController.signal;
    }

    /**
     * Creates an encoder without loading scripts or allocating workers.
     * @param configuration Overrides of DefaultConfiguration.
     * @experimental
     */
    constructor(configuration: Partial<IKhronosTextureContainer2EncoderConfiguration> = {}) {
        this._configuration = { ...KhronosTextureContainer2Encoder.DefaultConfiguration, ...configuration };
        const numWorkers = this._configuration.numWorkers;
        if (!Number.isInteger(numWorkers) || numWorkers < 0) {
            throw new Error("KTX2 encoder numWorkers must be a non-negative integer.");
        }
        this._useWorkers = numWorkers > 0 && typeof Worker === "function";
    }

    /**
     * Encodes pixels. In worker mode the entire input ArrayBuffer is transferred and detached.
     * Cancellation on the main thread is cooperative; synchronous Basis encoding cannot be interrupted.
     * @param rgba RGBA8 pixels. Dimensions must be positive multiples of 4, with at most 12,582,912 pixels.
     * @param width Image width.
     * @param height Image height.
     * @param options Encoding options and optional cancellation signal.
     * @returns KTX2 file bytes.
     * @experimental
     */
    public async encodeAsync(rgba: Uint8Array, width: number, height: number, options: IKTX2EncoderOptions & { signal?: AbortSignal }): Promise<Uint8Array> {
        if (options.signal?.aborted) {
            throw AbortError();
        }
        if (this._disposed) {
            throw DisposedError();
        }
        if (this._useWorkers && !(rgba.buffer instanceof ArrayBuffer)) {
            throw new Error("KTX2 worker encoding requires transferable ArrayBuffer pixels.");
        }
        const { signal, ...encodingOptions } = options;
        if (!this._useWorkers) {
            return await WithAbortAsync(
                async (signal) => {
                    await (this._resourcesPromise ??= this._loadResourcesAsync());
                    return await this._mainThreadLock.lockAsync(async () => {
                        await new Promise<void>((resolve) => setTimeout(resolve, 0));
                        signal.throwIfAborted();
                        return this._encoder!.encode(rgba, width, height, encodingOptions);
                    }, signal);
                },
                signal,
                this._disposeSignal
            );
        }
        return await new Promise<Uint8Array>((resolve, reject) => {
            const job: IEncodeJob = { id: this._nextId++, rgba, width, height, options: encodingOptions, resolve, reject, signal };
            job.onAbort = () => {
                const slot = this._workers.find((worker) => worker.job === job);
                if (slot) {
                    this._removeWorker(slot);
                }
                this._settle(job, undefined, AbortError());
                this._dispatch();
            };
            signal?.addEventListener("abort", job.onAbort, { once: true });
            this._jobs.add(job);
            this._queue.push(job);
            void this._scheduleAsync();
        });
    }

    private async _loadResourcesAsync(): Promise<void> {
        this._wasmBinary = this._configuration.wasmBinary ?? (await Tools.LoadFileAsync(Tools.GetBabylonScriptURL(this._configuration.basisWasmUrl, true)));
        if (this._disposed) {
            return;
        }
        if (this._useWorkers) {
            this._blobUrl = URL.createObjectURL(new Blob([`(${KTX2EncoderWorkerFunction.toString()})()`], { type: "application/javascript" }));
        } else {
            await Tools.LoadBabylonScriptAsync(this._configuration.jsEncoderModuleUrl);
            if (this._disposed) {
                return;
            }
            const encoder = await KTX2ENCODER.KTX2Encoder.CreateAsync({
                jsModuleUrl: Tools.GetBabylonScriptURL(this._configuration.basisJsUrl, true),
                wasmBinary: this._wasmBinary,
            });
            if (!this._disposed) {
                this._encoder = encoder;
            }
        }
    }

    private async _scheduleAsync(): Promise<void> {
        try {
            await (this._resourcesPromise ??= this._loadResourcesAsync());
            this._dispatch();
        } catch (error) {
            for (const job of this._jobs) {
                this._settle(job, undefined, ToError(error));
            }
        }
    }

    private _dispatch(): void {
        clearTimeout(this._idleTimer);
        this._idleTimer = undefined;
        if (this._disposed || !this._wasmBinary) {
            return;
        }
        while (this._queue.length) {
            const job = this._queue[0];
            let slot = this._workers.find((worker) => worker.ready && !worker.job);
            if (!slot && this._workers.length >= this._configuration.numWorkers) {
                return;
            }
            this._queue.shift();
            try {
                if (!slot) {
                    slot = this._createWorker(job);
                } else {
                    slot.job = job;
                    this._postEncode(slot);
                }
            } catch (error) {
                this._settle(job, undefined, ToError(error));
            }
        }
        if (!this._jobs.size && this._workers.length && this._idleTimer === undefined) {
            this._idleTimer = setTimeout(() => {
                this._idleTimer = undefined;
                for (const slot of this._workers) {
                    this._removeWorker(slot);
                }
            }, AutoReleaseWorkerPool.DefaultOptions.idleTimeElapsedBeforeRelease);
        }
    }

    private _createWorker(job: IEncodeJob): IEncoderWorker {
        const worker = new Worker(this._blobUrl!);
        const slot: IEncoderWorker = {
            worker,
            initId: this._nextId++,
            ready: false,
            job,
        };
        this._workers.push(slot);
        worker.onmessage = (event: MessageEvent<KTX2EncoderWorkerReply>) => this._onMessage(slot, event.data);
        worker.onerror = (event) => this._workerFailed(slot, new Error(event.message || "KTX2 encoder worker failed."));
        worker.onmessageerror = () => this._workerFailed(slot, new Error("KTX2 encoder worker message could not be deserialized."));
        this._postMessage(slot, {
            action: "init",
            id: slot.initId,
            jsEncoderModuleUrl: Tools.GetBabylonScriptURL(this._configuration.jsEncoderModuleUrl, true),
            basisJsUrl: Tools.GetBabylonScriptURL(this._configuration.basisJsUrl, true),
            wasmBinary: this._wasmBinary!,
        });
        return slot;
    }

    private _postMessage(slot: IEncoderWorker, request: KTX2EncoderWorkerRequest, transfer: Transferable[] = []): void {
        try {
            slot.worker.postMessage(request, transfer);
        } catch (error) {
            this._workerFailed(slot, ToError(error));
        }
    }

    private _postEncode(slot: IEncoderWorker): void {
        const job = slot.job!;
        this._postMessage(slot, { action: "encode", id: job.id, rgba: job.rgba, width: job.width, height: job.height, options: job.options }, [job.rgba.buffer as ArrayBuffer]);
    }

    private _onMessage(slot: IEncoderWorker, reply: KTX2EncoderWorkerReply): void {
        if (!this._workers.includes(slot)) {
            return;
        }
        if (reply.id === slot.initId && !slot.ready) {
            if (reply.action === "error") {
                this._workerFailed(slot, new Error(reply.message));
            } else if (reply.action === "init") {
                slot.ready = true;
                if (slot.job) {
                    this._postEncode(slot);
                }
            }
        } else if (slot.job && reply.id === slot.job.id) {
            if (reply.action === "encoded" || reply.action === "error") {
                this._settle(slot.job, reply.action === "encoded" ? reply.data : undefined, reply.action === "error" ? new Error(reply.message) : undefined);
                slot.job = undefined;
                this._dispatch();
            }
        }
    }

    private _workerFailed(slot: IEncoderWorker, error: Error): void {
        const job = slot.job;
        this._removeWorker(slot);
        if (job) {
            this._settle(job, undefined, error);
        }
        this._dispatch();
    }

    private _removeWorker(slot: IEncoderWorker): void {
        slot.worker.onmessage = null;
        slot.worker.onerror = null;
        slot.worker.onmessageerror = null;
        slot.worker.terminate();
        this._workers = this._workers.filter((worker) => worker !== slot);
    }

    private _settle(job: IEncodeJob, data?: Uint8Array, error?: Error): void {
        if (!this._jobs.delete(job)) {
            return;
        }
        if (job.onAbort) {
            job.signal?.removeEventListener("abort", job.onAbort);
        }
        this._queue = this._queue.filter((queued) => queued !== job);
        if (error) {
            job.reject(error);
        } else {
            job.resolve(data!);
        }
    }

    /**
     * Terminates workers, rejects pending jobs, and releases the worker Blob URL.
     * Calling dispose more than once has no effect.
     * @experimental
     */
    public dispose(): void {
        this._disposed = true;
        clearTimeout(this._idleTimer);
        this._idleTimer = undefined;
        for (const slot of [...this._workers]) {
            this._removeWorker(slot);
        }
        for (const job of this._jobs) {
            this._settle(job, undefined, DisposedError());
        }
        this._disposeController.abort();
        if (this._blobUrl) {
            URL.revokeObjectURL(this._blobUrl);
            this._blobUrl = undefined;
        }
        this._encoder = undefined;
    }
}
