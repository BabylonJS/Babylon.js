/* eslint-disable @typescript-eslint/naming-convention */
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { Constants } from "../Engines/constants";
import { AutoReleaseWorkerPool } from "./workerPool";
import { Tools } from "./tools";
import type { Nullable } from "../types";
import type { ICompressedFormatCapabilities, IDecodedData, IKTX2DecoderOptions } from "core/Materials/Textures/ktx2decoderTypes";
import { EngineFormat, TranscodeTarget } from "core/Materials/Textures/ktx2decoderTypes";
import type { AllowedKeys } from "./khronosTextureContainer2Worker";
import { applyConfig, initializeWebWorker, workerFunction } from "./khronosTextureContainer2Worker";

declare let KTX2DECODER: any;

/**
 * Class that defines the default KTX2 decoder options.
 *
 * This class is useful for providing options to the KTX2 decoder to control how the source data is transcoded.
 */
export class DefaultKTX2DecoderOptions {
    private _isDirty = true;

    /**
     * Gets the dirty flag
     */
    public get isDirty() {
        return this._isDirty;
    }

    private _useRGBAIfASTCBC7NotAvailableWhenUASTC?: boolean;
    /**
     * force a (uncompressed) RGBA transcoded format if transcoding a UASTC source format and ASTC + BC7 are not available as a compressed transcoded format
     */
    public get useRGBAIfASTCBC7NotAvailableWhenUASTC() {
        return this._useRGBAIfASTCBC7NotAvailableWhenUASTC;
    }

    public set useRGBAIfASTCBC7NotAvailableWhenUASTC(value: boolean | undefined) {
        if (this._useRGBAIfASTCBC7NotAvailableWhenUASTC === value) {
            return;
        }
        this._useRGBAIfASTCBC7NotAvailableWhenUASTC = value;
        this._isDirty = true;
    }

    private _useRGBAIfOnlyBC1BC3AvailableWhenUASTC?: boolean = true;
    /**
     * force a (uncompressed) RGBA transcoded format if transcoding a UASTC source format and only BC1 or BC3 are available as a compressed transcoded format.
     * This property is true by default to favor speed over memory, because currently transcoding from UASTC to BC1/3 is slow because the transcoder transcodes
     * to uncompressed and then recompresses the texture
     */
    public get useRGBAIfOnlyBC1BC3AvailableWhenUASTC() {
        return this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC;
    }

    public set useRGBAIfOnlyBC1BC3AvailableWhenUASTC(value: boolean | undefined) {
        if (this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC === value) {
            return;
        }
        this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC = value;
        this._isDirty = true;
    }

    private _forceRGBA?: boolean;
    /**
     * force to always use (uncompressed) RGBA for transcoded format
     */
    public get forceRGBA() {
        return this._forceRGBA;
    }

    public set forceRGBA(value: boolean | undefined) {
        if (this._forceRGBA === value) {
            return;
        }
        this._forceRGBA = value;
        this._isDirty = true;
    }

    private _forceR8?: boolean;
    /**
     * force to always use (uncompressed) R8 for transcoded format
     */
    public get forceR8() {
        return this._forceR8;
    }

    public set forceR8(value: boolean | undefined) {
        if (this._forceR8 === value) {
            return;
        }
        this._forceR8 = value;
        this._isDirty = true;
    }

    private _forceRG8?: boolean;
    /**
     * force to always use (uncompressed) RG8 for transcoded format
     */
    public get forceRG8() {
        return this._forceRG8;
    }

    public set forceRG8(value: boolean | undefined) {
        if (this._forceRG8 === value) {
            return;
        }
        this._forceRG8 = value;
        this._isDirty = true;
    }

    private _bypassTranscoders?: string[];
    /**
     * list of transcoders to bypass when looking for a suitable transcoder. The available transcoders are:
     *      UniversalTranscoder_UASTC_ASTC
     *      UniversalTranscoder_UASTC_BC7
     *      UniversalTranscoder_UASTC_RGBA_UNORM
     *      UniversalTranscoder_UASTC_RGBA_SRGB
     *      UniversalTranscoder_UASTC_R8_UNORM
     *      UniversalTranscoder_UASTC_RG8_UNORM
     *      MSCTranscoder
     */
    public get bypassTranscoders() {
        return this._bypassTranscoders;
    }

    public set bypassTranscoders(value: string[] | undefined) {
        if (this._bypassTranscoders === value) {
            return;
        }
        this._bypassTranscoders = value;
        this._isDirty = true;
    }

    private _ktx2DecoderOptions: IKTX2DecoderOptions = {};

    /** @internal */
    public _getKTX2DecoderOptions(): IKTX2DecoderOptions {
        if (!this._isDirty) {
            return this._ktx2DecoderOptions;
        }

        this._isDirty = false;

        const options: IKTX2DecoderOptions = {
            useRGBAIfASTCBC7NotAvailableWhenUASTC: this._useRGBAIfASTCBC7NotAvailableWhenUASTC,
            forceRGBA: this._forceRGBA,
            forceR8: this._forceR8,
            forceRG8: this._forceRG8,
            bypassTranscoders: this._bypassTranscoders,
        };

        if (this.useRGBAIfOnlyBC1BC3AvailableWhenUASTC) {
            options.transcodeFormatDecisionTree = {
                UASTC: {
                    transcodeFormat: [TranscodeTarget.BC1_RGB, TranscodeTarget.BC3_RGBA],
                    yes: {
                        transcodeFormat: TranscodeTarget.RGBA32,
                        engineFormat: EngineFormat.RGBA8Format,
                        roundToMultiple4: false,
                    },
                },
            };
        }

        this._ktx2DecoderOptions = options;

        return options;
    }
}

/**
 * Options for the KTX2 decoder
 */
export interface IKhronosTextureContainer2Options {
    /**
     * Number of workers to use for async operations. Specify `0` to disable web workers and run synchronously in the current context.
     */
    numWorkers?: number;
    /**
     * Worker pool to use for async operations. If set, `numWorkers` will be ignored.
     */
    workerPool?: AutoReleaseWorkerPool;
    /**
     * Optional container for the KTX2 decoder module and its dependencies. If set, the module will be used from this container and the URLs will be ignored.
     */
    // No need for | any here
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    binariesAndModulesContainer?: { [key in AllowedKeys]?: ArrayBuffer | any };
}

/**
 * Class for loading KTX2 files
 */
export class KhronosTextureContainer2 {
    private static _WorkerPoolPromise?: Promise<AutoReleaseWorkerPool>;
    private static _DecoderModulePromise?: Promise<any>;
    private static _KTX2DecoderModule?: any;

    /**
     * URLs to use when loading the KTX2 decoder module as well as its dependencies
     * If a url is null, the default url is used (pointing to https://preview.babylonjs.com)
     * Note that jsDecoderModule can't be null and that the other dependencies will only be loaded if necessary
     * Urls you can change:
     *     URLConfig.jsDecoderModule
     *     URLConfig.wasmUASTCToASTC
     *     URLConfig.wasmUASTCToBC7
     *     URLConfig.wasmUASTCToRGBA_UNORM
     *     URLConfig.wasmUASTCToRGBA_SRGB
     *     URLConfig.wasmUASTCToR8_UNORM
     *     URLConfig.wasmUASTCToRG8_UNORM
     *     URLConfig.jsMSCTranscoder
     *     URLConfig.wasmMSCTranscoder
     *     URLConfig.wasmZSTDDecoder
     * You can see their default values in this PG: https://playground.babylonjs.com/#EIJH8L#29
     */
    public static URLConfig: {
        jsDecoderModule: string;
        wasmUASTCToASTC: Nullable<string>;
        wasmUASTCToBC7: Nullable<string>;
        wasmUASTCToRGBA_UNORM: Nullable<string>;
        wasmUASTCToRGBA_SRGB: Nullable<string>;
        wasmUASTCToR8_UNORM: Nullable<string>;
        wasmUASTCToRG8_UNORM: Nullable<string>;
        jsMSCTranscoder: Nullable<string>;
        wasmMSCTranscoder: Nullable<string>;
        wasmZSTDDecoder: Nullable<string>;
    } = {
        jsDecoderModule: "https://cdn.babylonjs.com/babylon.ktx2Decoder.js",
        wasmUASTCToASTC: null,
        wasmUASTCToBC7: null,
        wasmUASTCToRGBA_UNORM: null,
        wasmUASTCToRGBA_SRGB: null,
        wasmUASTCToR8_UNORM: null,
        wasmUASTCToRG8_UNORM: null,
        jsMSCTranscoder: null,
        wasmMSCTranscoder: null,
        wasmZSTDDecoder: null,
    };

    /**
     * If provided, this worker pool will be used instead of creating a new one.
     * This is useful when loading the WASM and the js modules on your own and
     * you want to use the ktxTextureLoader and not construct this class directly.
     */
    public static WorkerPool?: AutoReleaseWorkerPool;

    /**
     * Default number of workers used to handle data decoding
     */
    public static DefaultNumWorkers = KhronosTextureContainer2.GetDefaultNumWorkers();

    /**
     * Default configuration for the KTX2 decoder.
     * The options defined in this way have priority over those passed when creating a KTX2 texture with new Texture(...).
     */
    public static DefaultDecoderOptions = new DefaultKTX2DecoderOptions();

    private static GetDefaultNumWorkers(): number {
        if (typeof navigator !== "object" || !navigator.hardwareConcurrency) {
            return 1;
        }

        // Use 50% of the available logical processors but capped at 4.
        return Math.min(Math.floor(navigator.hardwareConcurrency * 0.5), 4);
    }

    private _engine: AbstractEngine;

    private static _Initialize(numWorkers: number): void {
        if (KhronosTextureContainer2._WorkerPoolPromise || KhronosTextureContainer2._DecoderModulePromise) {
            return;
        }

        const urls = {
            jsDecoderModule: Tools.GetBabylonScriptURL(this.URLConfig.jsDecoderModule, true),
            wasmUASTCToASTC: Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToASTC, true),
            wasmUASTCToBC7: Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToBC7, true),
            wasmUASTCToRGBA_UNORM: Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToRGBA_UNORM, true),
            wasmUASTCToRGBA_SRGB: Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToRGBA_SRGB, true),
            wasmUASTCToR8_UNORM: Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToR8_UNORM, true),
            wasmUASTCToRG8_UNORM: Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToRG8_UNORM, true),
            jsMSCTranscoder: Tools.GetBabylonScriptURL(this.URLConfig.jsMSCTranscoder, true),
            wasmMSCTranscoder: Tools.GetBabylonScriptURL(this.URLConfig.wasmMSCTranscoder, true),
            wasmZSTDDecoder: Tools.GetBabylonScriptURL(this.URLConfig.wasmZSTDDecoder, true),
        };

        if (numWorkers && typeof Worker === "function" && typeof URL !== "undefined") {
            KhronosTextureContainer2._WorkerPoolPromise = new Promise((resolve) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                const workerContent = `${applyConfig}(${workerFunction})()`;
                const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));
                resolve(new AutoReleaseWorkerPool(numWorkers, async () => await initializeWebWorker(new Worker(workerBlobUrl), undefined, urls)));
            });
        } else {
            if (typeof KhronosTextureContainer2._KTX2DecoderModule === "undefined") {
                // eslint-disable-next-line github/no-then
                KhronosTextureContainer2._DecoderModulePromise = Tools.LoadBabylonScriptAsync(urls.jsDecoderModule).then(() => {
                    KhronosTextureContainer2._KTX2DecoderModule = KTX2DECODER;
                    KhronosTextureContainer2._KTX2DecoderModule.MSCTranscoder.UseFromWorkerThread = false;
                    KhronosTextureContainer2._KTX2DecoderModule.WASMMemoryManager.LoadBinariesFromCurrentThread = true;
                    applyConfig(urls, KhronosTextureContainer2._KTX2DecoderModule);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return new KhronosTextureContainer2._KTX2DecoderModule.KTX2Decoder();
                });
            } else {
                KhronosTextureContainer2._KTX2DecoderModule.MSCTranscoder.UseFromWorkerThread = false;
                KhronosTextureContainer2._KTX2DecoderModule.WASMMemoryManager.LoadBinariesFromCurrentThread = true;
                KhronosTextureContainer2._DecoderModulePromise = Promise.resolve(new KhronosTextureContainer2._KTX2DecoderModule.KTX2Decoder());
            }
        }
    }

    /**
     * Constructor
     * @param engine The engine to use
     * @param numWorkersOrOptions The number of workers for async operations. Specify `0` to disable web workers and run synchronously in the current context.
     */
    public constructor(engine: AbstractEngine, numWorkersOrOptions: number | IKhronosTextureContainer2Options = KhronosTextureContainer2.DefaultNumWorkers) {
        this._engine = engine;
        const workerPoolOption = (typeof numWorkersOrOptions === "object" && numWorkersOrOptions.workerPool) || KhronosTextureContainer2.WorkerPool;
        if (workerPoolOption) {
            KhronosTextureContainer2._WorkerPoolPromise = Promise.resolve(workerPoolOption);
        } else {
            // set the KTX2 decoder module
            if (typeof numWorkersOrOptions === "object") {
                KhronosTextureContainer2._KTX2DecoderModule = numWorkersOrOptions?.binariesAndModulesContainer?.jsDecoderModule;
            } else if (typeof KTX2DECODER !== "undefined") {
                KhronosTextureContainer2._KTX2DecoderModule = KTX2DECODER;
            }
            const numberOfWorkers = typeof numWorkersOrOptions === "number" ? numWorkersOrOptions : (numWorkersOrOptions.numWorkers ?? KhronosTextureContainer2.DefaultNumWorkers);
            KhronosTextureContainer2._Initialize(numberOfWorkers);
        }
    }

    /**
     * @internal
     */
    public async _uploadAsync(data: ArrayBufferView, internalTexture: InternalTexture, options?: IKTX2DecoderOptions & IDecodedData): Promise<void> {
        const caps = this._engine.getCaps();

        const compressedTexturesCaps: ICompressedFormatCapabilities = {
            astc: !!caps.astc,
            bptc: !!caps.bptc,
            s3tc: !!caps.s3tc,
            pvrtc: !!caps.pvrtc,
            etc2: !!caps.etc2,
            etc1: !!caps.etc1,
        };

        if (KhronosTextureContainer2._WorkerPoolPromise) {
            const workerPool = await KhronosTextureContainer2._WorkerPoolPromise;
            return await new Promise((resolve, reject) => {
                workerPool.push((worker, onComplete) => {
                    const onError = (error: ErrorEvent) => {
                        worker.removeEventListener("error", onError);
                        worker.removeEventListener("message", onMessage);
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject(error);
                        onComplete();
                    };

                    const onMessage = (message: MessageEvent) => {
                        if (message.data.action === "decoded") {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            if (!message.data.success) {
                                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                                reject({ message: message.data.msg });
                            } else {
                                try {
                                    this._createTexture(message.data.decodedData, internalTexture, options);
                                    resolve();
                                } catch (err) {
                                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                                    reject({ message: err });
                                }
                            }
                            onComplete();
                        }
                    };

                    worker.addEventListener("error", onError);
                    worker.addEventListener("message", onMessage);
                    worker.postMessage({ action: "setDefaultDecoderOptions", options: KhronosTextureContainer2.DefaultDecoderOptions._getKTX2DecoderOptions() });

                    const dataCopy = new Uint8Array(data.byteLength);
                    dataCopy.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));

                    worker.postMessage({ action: "decode", data: dataCopy, caps: compressedTexturesCaps, options }, [dataCopy.buffer]);
                });
            });
        } else if (KhronosTextureContainer2._DecoderModulePromise) {
            const decoder = await KhronosTextureContainer2._DecoderModulePromise;
            if (KhronosTextureContainer2.DefaultDecoderOptions.isDirty) {
                KhronosTextureContainer2._KTX2DecoderModule.KTX2Decoder.DefaultDecoderOptions = KhronosTextureContainer2.DefaultDecoderOptions._getKTX2DecoderOptions();
            }
            return await new Promise((resolve, reject) => {
                decoder
                    .decode(data, caps)
                    // eslint-disable-next-line github/no-then
                    .then((data: IDecodedData) => {
                        this._createTexture(data, internalTexture);
                        resolve();
                    })
                    // eslint-disable-next-line github/no-then
                    .catch((reason: any) => {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject({ message: reason });
                    });
            });
        }

        throw new Error("KTX2 decoder module is not available");
    }

    protected _createTexture(data: IDecodedData, internalTexture: InternalTexture, options?: IKTX2DecoderOptions & IDecodedData): void {
        const oglTexture2D = 3553; // gl.TEXTURE_2D

        this._engine._bindTextureDirectly(oglTexture2D, internalTexture);

        if (options) {
            // return back some information about the decoded data
            options.transcodedFormat = data.transcodedFormat;
            options.isInGammaSpace = data.isInGammaSpace;
            options.hasAlpha = data.hasAlpha;
            options.transcoderName = data.transcoderName;
        }

        let isUncompressedFormat = true;

        switch (data.transcodedFormat) {
            case 0x8058 /* RGBA8 */:
                internalTexture.type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
                internalTexture.format = Constants.TEXTUREFORMAT_RGBA;
                break;
            case 0x8229 /* R8 */:
                internalTexture.type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
                internalTexture.format = Constants.TEXTUREFORMAT_R;
                break;
            case 0x822b /* RG8 */:
                internalTexture.type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
                internalTexture.format = Constants.TEXTUREFORMAT_RG;
                break;
            default:
                internalTexture.format = data.transcodedFormat;
                isUncompressedFormat = false;
                break;
        }

        internalTexture._gammaSpace = data.isInGammaSpace;
        internalTexture.generateMipMaps = data.mipmaps.length > 1;

        if (data.errors) {
            throw new Error("KTX2 container - could not transcode the data. " + data.errors);
        }

        for (let t = 0; t < data.mipmaps.length; ++t) {
            const mipmap = data.mipmaps[t];

            if (!mipmap || !mipmap.data) {
                throw new Error("KTX2 container - could not transcode one of the image");
            }

            if (isUncompressedFormat) {
                // uncompressed RGBA / R8 / RG8
                internalTexture.width = mipmap.width; // need to set width/height so that the call to _uploadDataToTextureDirectly uses the right dimensions
                internalTexture.height = mipmap.height;

                this._engine._uploadDataToTextureDirectly(internalTexture, mipmap.data, 0, t, undefined, true);
            } else {
                this._engine._uploadCompressedDataToTextureDirectly(internalTexture, data.transcodedFormat, mipmap.width, mipmap.height, mipmap.data, 0, t);
            }
        }

        internalTexture._extension = ".ktx2";
        internalTexture.width = data.mipmaps[0].width;
        internalTexture.height = data.mipmaps[0].height;
        internalTexture.isReady = true;

        this._engine._bindTextureDirectly(oglTexture2D, null);
    }

    /**
     * Checks if the given data starts with a KTX2 file identifier.
     * @param data the data to check
     * @returns true if the data is a KTX2 file or false otherwise
     */
    public static IsValid(data: ArrayBufferView): boolean {
        if (data.byteLength >= 12) {
            // '«', 'K', 'T', 'X', ' ', '2', '0', '»', '\r', '\n', '\x1A', '\n'
            const identifier = new Uint8Array(data.buffer, data.byteOffset, 12);
            if (
                identifier[0] === 0xab &&
                identifier[1] === 0x4b &&
                identifier[2] === 0x54 &&
                identifier[3] === 0x58 &&
                identifier[4] === 0x20 &&
                identifier[5] === 0x32 &&
                identifier[6] === 0x30 &&
                identifier[7] === 0xbb &&
                identifier[8] === 0x0d &&
                identifier[9] === 0x0a &&
                identifier[10] === 0x1a &&
                identifier[11] === 0x0a
            ) {
                return true;
            }
        }

        return false;
    }
}
