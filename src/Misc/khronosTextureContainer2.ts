import { InternalTexture } from "../Materials/Textures/internalTexture";
import { ThinEngine } from "../Engines/thinEngine";
import { Constants } from '../Engines/constants';
import { WorkerPool } from './workerPool';

declare var KTX2DECODER: any;

/**
 * Class for loading KTX2 files
 * @hidden
 */
export class KhronosTextureContainer2 {
    private static _WorkerPoolPromise?: Promise<WorkerPool>;
    private static _Initialized: boolean;
    private static _Ktx2Decoder: any; // used when no worker pool is used

    /**
     * URL to use when loading the KTX2 decoder module
     */
    public static JSModuleURL = "https://preview.babylonjs.com/ktx2Decoder/babylon.ktx2Decoder.js";

    /**
     * Default number of workers to create when creating the draco compression object.
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
                            jsPath: KhronosTextureContainer2.JSModuleURL
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
     * @param numWorkers The number of workers for async operations. Specify `0` to disable web workers and run synchronously in the current context.
     */
    public constructor(engine: ThinEngine, numWorkers = KhronosTextureContainer2.DefaultNumWorkers) {
        this._engine = engine;

        if (!KhronosTextureContainer2._Initialized) {
            KhronosTextureContainer2._CreateWorkerPool(numWorkers);
        }
    }

    public uploadAsync(data: ArrayBufferView, internalTexture: InternalTexture): Promise<void> {
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
                                        this._createTexture(message.data.decodedData, internalTexture);
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

                        worker.postMessage({ action: "decode", data, caps: compressedTexturesCaps }, [data.buffer]);
                    });
                });
            });
        }

        return new Promise((resolve, reject) => {
            if (!KhronosTextureContainer2._Ktx2Decoder) {
                KhronosTextureContainer2._Ktx2Decoder = new KTX2DECODER.KTX2Decoder();
            }

            try {
                KhronosTextureContainer2._Ktx2Decoder.decode(data, caps).then((data: any) => {
                    const buffers = [];
                    for (let mip = 0; mip < data.mipmaps.length; ++mip) {
                        const mipmap = data.mipmaps[mip];
                        if (mipmap) {
                            buffers.push(mipmap.data.buffer);
                        }
                    }
                    resolve();
                    this._createTexture(data, internalTexture);
                }).catch((reason: any) => {
                    reject({ message: reason });
                });
            } catch (err) {
                reject({ message: err });
            }
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

    protected _createTexture(data: any /* IEncodedData */, internalTexture: InternalTexture) {
        this._engine._bindTextureDirectly(this._engine._gl.TEXTURE_2D, internalTexture);

        if (data.transcodedFormat === 0x8058 /* RGBA8 */) {
            internalTexture.type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
            internalTexture.format = Constants.TEXTUREFORMAT_RGBA;
        } else {
            internalTexture.format = data.transcodedFormat;
        }

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
        internalTexture.generateMipMaps = data.mipmaps.length > 1;
        internalTexture.isReady = true;

        this._engine._bindTextureDirectly(this._engine._gl.TEXTURE_2D, null);
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

export function workerFunc(): void {
    let ktx2Decoder: any;

    onmessage = (event) => {
        switch (event.data.action) {
            case "init":
                importScripts(event.data.jsPath);
                ktx2Decoder = new KTX2DECODER.KTX2Decoder();
                postMessage({ action: "init" });
                break;
            case "decode":
                try {
                    ktx2Decoder.decode(event.data.data, event.data.caps).then((data: any) => {
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
                } catch (err) {
                    postMessage({ action: "decoded", success: false, msg: err });
                }
                break;
        }
    };
}
