import { InternalTexture } from "../Materials/Textures/internalTexture";
import { ThinEngine } from "../Engines/thinEngine";
import { Constants } from '../Engines/constants';
import { WorkerPool } from './workerPool';

declare var KTX2DECODER: any;

/**
 * Class for loading KTX2 files
 */
export class KhronosTextureContainer2 {
    private static _WorkerPoolPromise?: Promise<WorkerPool>;
    private static _Initialized: boolean;
    private static _Ktx2Decoder: any; // used when no worker pool is used

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
     *     URLConfig.jsMSCTranscoder
     *     URLConfig.wasmMSCTranscoder
     *     URLConfig.wasmZSTDDecoder
     * You can see their default values in this PG: https://playground.babylonjs.com/#EIJH8L#29
     */
    public static URLConfig = {
        jsDecoderModule: "https://preview.babylonjs.com/babylon.ktx2Decoder.js",
        wasmUASTCToASTC: null,
        wasmUASTCToBC7: null,
        wasmUASTCToRGBA_UNORM: null,
        wasmUASTCToRGBA_SRGB: null,
        jsMSCTranscoder: null,
        wasmMSCTranscoder: null,
        wasmZSTDDecoder: null,
    };

    /**
     * Default number of workers used to handle data decoding
     */
    public static DefaultNumWorkers = KhronosTextureContainer2.GetDefaultNumWorkers();

    private static GetDefaultNumWorkers(): number {
        if (typeof navigator !== "object" || !navigator.hardwareConcurrency) {
            return 1;
        }

        // Use 50% of the available logical processors but capped at 4.
        return Math.min(Math.floor(navigator.hardwareConcurrency * 0.5), 4);
    }

    private _engine: ThinEngine;

    private static _CreateWorkerPool(numWorkers: number) {
        this._Initialized = true;

        if (numWorkers && typeof Worker === "function") {
            KhronosTextureContainer2._WorkerPoolPromise = new Promise((resolve) => {
                const workerContent = `(${workerFunc})()`;
                const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));
                const workerPromises = new Array<Promise<Worker>>(numWorkers);
                for (let i = 0; i < workerPromises.length; i++) {
                    workerPromises[i] = new Promise((resolve, reject) => {
                        const worker = new Worker(workerBlobUrl);

                        const onError = (error: ErrorEvent) => {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            reject(error);
                        };

                        const onMessage = (message: MessageEvent) => {
                            if (message.data.action === "init") {
                                worker.removeEventListener("error", onError);
                                worker.removeEventListener("message", onMessage);
                                resolve(worker);
                            }
                        };

                        worker.addEventListener("error", onError);
                        worker.addEventListener("message", onMessage);

                        worker.postMessage({
                            action: "init",
                            urls: KhronosTextureContainer2.URLConfig
                        });
                    });
                }

                Promise.all(workerPromises).then((workers) => {
                    resolve(new WorkerPool(workers));
                });
            });
        } else {
            KTX2DECODER.MSCTranscoder.UseFromWorkerThread = false;
            KTX2DECODER.WASMMemoryManager.LoadBinariesFromCurrentThread = true;
        }
    }

    /**
     * Constructor
     * @param engine The engine to use
     * @param numWorkers The number of workers for async operations. Specify `0` to disable web workers and run synchronously in the current context.
     */
    public constructor(engine: ThinEngine, numWorkers = KhronosTextureContainer2.DefaultNumWorkers) {
        this._engine = engine;

        if (!KhronosTextureContainer2._Initialized) {
            KhronosTextureContainer2._CreateWorkerPool(numWorkers);
        }
    }

    /** @hidden */
    public uploadAsync(data: ArrayBufferView, internalTexture: InternalTexture, options?: any): Promise<void> {
        const caps = this._engine.getCaps();

        const compressedTexturesCaps = {
            astc: !!caps.astc,
            bptc: !!caps.bptc,
            s3tc: !!caps.s3tc,
            pvrtc: !!caps.pvrtc,
            etc2: !!caps.etc2,
            etc1: !!caps.etc1,
        };

        if (KhronosTextureContainer2._WorkerPoolPromise) {
            return KhronosTextureContainer2._WorkerPoolPromise.then((workerPool) => {
                return new Promise((resolve, reject) => {
                    workerPool.push((worker, onComplete) => {
                        const onError = (error: ErrorEvent) => {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            reject(error);
                            onComplete();
                        };

                        const onMessage = (message: MessageEvent) => {
                            if (message.data.action === "decoded") {
                                worker.removeEventListener("error", onError);
                                worker.removeEventListener("message", onMessage);
                                if (!message.data.success) {
                                    reject({ message: message.data.msg });
                                } else {
                                    try {
                                        this._createTexture(message.data.decodedData, internalTexture, options);
                                        resolve();
                                    } catch (err) {
                                        reject({ message: err });
                                    }
                                }
                                onComplete();
                            }
                        };

                        worker.addEventListener("error", onError);
                        worker.addEventListener("message", onMessage);

                        // note: we can't transfer the ownership of data.buffer because if using a fallback texture the data.buffer buffer will be used by the current thread
                        worker.postMessage({ action: "decode", data, caps: compressedTexturesCaps, options }/*, [data.buffer]*/);
                    });
                });
            });
        }

        return new Promise((resolve, reject) => {
            if (!KhronosTextureContainer2._Ktx2Decoder) {
                KhronosTextureContainer2._Ktx2Decoder = new KTX2DECODER.KTX2Decoder();
            }

            KhronosTextureContainer2._Ktx2Decoder.decode(data, caps).then((data: any) => {
                this._createTexture(data, internalTexture);
                resolve();
            }).catch((reason: any) => {
                reject({ message: reason });
            });
        });
    }

    /**
     * Stop all async operations and release resources.
     */
    public dispose(): void {
        if (KhronosTextureContainer2._WorkerPoolPromise) {
            KhronosTextureContainer2._WorkerPoolPromise.then((workerPool) => {
                workerPool.dispose();
            });
        }

        delete KhronosTextureContainer2._WorkerPoolPromise;
    }

    protected _createTexture(data: any /* IEncodedData */, internalTexture: InternalTexture, options?: any) {
        const oglTexture2D = 3553; // gl.TEXTURE_2D

        this._engine._bindTextureDirectly(oglTexture2D, internalTexture);

        if (options) {
            // return back some information about the decoded data
            options.transcodedFormat = data.transcodedFormat;
            options.isInGammaSpace = data.isInGammaSpace;
            options.hasAlpha = data.hasAlpha;
            options.transcoderName = data.transcoderName;
        }

        if (data.transcodedFormat === 0x8058 /* RGBA8 */) {
            internalTexture.type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
            internalTexture.format = Constants.TEXTUREFORMAT_RGBA;
        } else {
            internalTexture.format = data.transcodedFormat;
        }

        internalTexture._gammaSpace = data.isInGammaSpace;
        internalTexture.generateMipMaps = data.mipmaps.length > 1;

        if (data.errors) {
            throw new Error("KTX2 container - could not transcode the data. " + data.errors);
        }

        for (let t = 0; t < data.mipmaps.length; ++t) {
            let mipmap = data.mipmaps[t];

            if (!mipmap || !mipmap.data) {
                throw new Error("KTX2 container - could not transcode one of the image");
            }

            if (data.transcodedFormat === 0x8058 /* RGBA8 */) {
                // uncompressed RGBA
                internalTexture.width = mipmap.width; // need to set width/height so that the call to _uploadDataToTextureDirectly uses the right dimensions
                internalTexture.height = mipmap.height;

                this._engine._uploadDataToTextureDirectly(internalTexture, mipmap.data, 0, t, undefined, true);
            } else {
                this._engine._uploadCompressedDataToTextureDirectly(internalTexture, data.transcodedFormat, mipmap.width, mipmap.height, mipmap.data, 0, t);
            }
        }

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
            if (identifier[0] === 0xAB && identifier[1] === 0x4B && identifier[2] === 0x54 && identifier[3] === 0x58 && identifier[4] === 0x20 && identifier[5] === 0x32 &&
                identifier[6] === 0x30 && identifier[7] === 0xBB && identifier[8] === 0x0D && identifier[9] === 0x0A && identifier[10] === 0x1A && identifier[11] === 0x0A) {
                return true;
            }
        }

        return false;
    }
}

declare function importScripts(...urls: string[]): void;
declare function postMessage(message: any, transfer?: any[]): void;

declare var KTX2DECODER: any;

function workerFunc(): void {
    let ktx2Decoder: any;

    onmessage = (event) => {
        if (!event.data) {
            return;
        }
        switch (event.data.action) {
            case "init":
                const urls = event.data.urls;
                importScripts(urls.jsDecoderModule);
                if (urls.wasmUASTCToASTC !== null) {
                    KTX2DECODER.LiteTranscoder_UASTC_ASTC.WasmModuleURL = urls.wasmUASTCToASTC;
                }
                if (urls.wasmUASTCToBC7 !== null) {
                    KTX2DECODER.LiteTranscoder_UASTC_BC7.WasmModuleURL = urls.wasmUASTCToBC7;
                }
                if (urls.wasmUASTCToRGBA_UNORM !== null) {
                    KTX2DECODER.LiteTranscoder_UASTC_RGBA_UNORM.WasmModuleURL = urls.wasmUASTCToRGBA_UNORM;
                }
                if (urls.wasmUASTCToRGBA_SRGB !== null) {
                    KTX2DECODER.LiteTranscoder_UASTC_RGBA_SRGB.WasmModuleURL = urls.wasmUASTCToRGBA_SRGB;
                }
                if (urls.jsMSCTranscoder !== null) {
                    KTX2DECODER.MSCTranscoder.JSModuleURL = urls.jsMSCTranscoder;
                }
                if (urls.wasmMSCTranscoder !== null) {
                    KTX2DECODER.MSCTranscoder.WasmModuleURL = urls.wasmMSCTranscoder;
                }
                if (urls.wasmZSTDDecoder !== null) {
                    KTX2DECODER.ZSTDDecoder.WasmModuleURL = urls.wasmZSTDDecoder;
                }
                ktx2Decoder = new KTX2DECODER.KTX2Decoder();
                postMessage({ action: "init" });
                break;
            case "decode":
                ktx2Decoder.decode(event.data.data, event.data.caps, event.data.options).then((data: any) => {
                    const buffers = [];
                    for (let mip = 0; mip < data.mipmaps.length; ++mip) {
                        const mipmap = data.mipmaps[mip];
                        if (mipmap && mipmap.data) {
                            buffers.push(mipmap.data.buffer);
                        }
                    }
                    postMessage({ action: "decoded", success: true, decodedData: data }, buffers);
                }).catch((reason: any) => {
                    postMessage({ action: "decoded", success: false, msg: reason });
                });
                break;
        }
    };
}
