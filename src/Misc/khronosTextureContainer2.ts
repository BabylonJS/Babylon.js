import { InternalTexture } from "../Materials/Textures/internalTexture";
import { ThinEngine } from "../Engines/thinEngine";
import { Nullable } from '../types';
import { Tools } from './tools';
import { Constants } from '../Engines/constants';

declare var KTX2DECODER: any;

/**
 * Class for loading KTX2 files
 * @hidden
 */
export class KhronosTextureContainer2 {
    /**
     * URL to use when loading the KTX2 decoder module
     */
    public static JSModuleURL = "https://preview.babylonjs.com/ktx2Decoder/babylon.ktx2Decoder.js";

    private _engine: ThinEngine;

    private static _WorkerPromise: Nullable<Promise<Worker>> = null;
    private static _Worker: Nullable<Worker> = null;
    private static _actionId = 0;
    private static _CreateWorkerAsync() {
        if (!this._WorkerPromise) {
            this._WorkerPromise = new Promise((res) => {
                if (this._Worker) {
                    res(this._Worker);
                } else {
                    const workerBlobUrl = URL.createObjectURL(new Blob([`(${workerFunc})()`], { type: "application/javascript" }));
                    this._Worker = new Worker(workerBlobUrl);
                    URL.revokeObjectURL(workerBlobUrl);

                    const initHandler = (msg: any) => {
                        if (msg.data.action === "init") {
                            this._Worker!.removeEventListener("message", initHandler);
                            res(this._Worker!);
                        }
                    };

                    const loadWASMHandler = (msg: any) => {
                        const cache: { [path: string]: Promise<ArrayBuffer | string> } = {};
                        if (msg.data.action === "loadWASM") {
                            let promise = cache[msg.data.path];
                            if (!promise) {
                                promise = Tools.LoadFileAsync(msg.data.path);
                                cache[msg.data.path] = promise;
                            }
                            promise.then((wasmBinary) => {
                                this._Worker!.postMessage({ action: "wasmLoaded", wasmBinary: wasmBinary, id: msg.data.id });
                                return wasmBinary;
                            });
                        }
                    };

                    this._Worker.addEventListener("message", initHandler);
                    this._Worker.addEventListener("message", loadWASMHandler);
                    this._Worker.postMessage({ action: "init", jsPath: KhronosTextureContainer2.JSModuleURL });
                }
            });
        }
        return this._WorkerPromise;
    }

    public constructor(engine: ThinEngine) {
        this._engine = engine;
    }

    public uploadAsync(data: ArrayBufferView, internalTexture: InternalTexture): Promise<void> {
        return new Promise((res, rej) => {
            KhronosTextureContainer2._CreateWorkerAsync().then(() => {
                const actionId = KhronosTextureContainer2._actionId++;
                const messageHandler = (msg: any) => {
                    if (msg.data.action === "decoded" && msg.data.id === actionId) {
                        KhronosTextureContainer2._Worker!.removeEventListener("message", messageHandler);
                        if (!msg.data.success) {
                            rej({ message: msg.data.msg });
                        } else {
                            this._createTexture(msg.data.decodedData, internalTexture);
                            res();
                        }
                    }
                };

                KhronosTextureContainer2._Worker!.addEventListener("message", messageHandler);

                const caps = this._engine.getCaps();

                const compressedTexturesCaps = {
                    astc: !!caps.astc,
                    bptc: !!caps.bptc,
                    s3tc: !!caps.s3tc,
                    pvrtc: !!caps.pvrtc,
                    etc2: !!caps.etc2,
                    etc1: !!caps.etc1,
                };

                KhronosTextureContainer2._Worker!.postMessage({
                    action: "decode",
                    id: actionId,
                    data: data,
                    caps: compressedTexturesCaps,
                }, [data.buffer]);
            });
        });
    }

    protected _createTexture(data: any /* IEncodedData */, internalTexture: InternalTexture) {
        this._engine._bindTextureDirectly(this._engine._gl.TEXTURE_2D, internalTexture);

        if (data.transcodedFormat === 0x8058 /* RGBA8 */) {
            internalTexture.type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
            internalTexture.format = Constants.TEXTUREFORMAT_RGBA;
        } else {
            internalTexture.format = data.transcodedFormat;
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
                            if (mipmap) {
                                buffers.push(mipmap.data.buffer);
                            }
                        }
                        postMessage({ action: "decoded", success: true, id: event.data.id, decodedData: data }, buffers);
                    }).catch((reason: any) => {
                        postMessage({ action: "decoded", success: false, id: event.data.id, msg: reason });
                    });
                } catch (err) {
                    postMessage({ action: "decoded", success: false, id: event.data.id, msg: err });
                }
                break;
        }
    };
}
