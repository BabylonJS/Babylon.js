import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { ThinEngine } from "../../Engines/thinEngine";
//import { EngineCapabilities } from '../../Engines/engineCapabilities';
//import { Tools } from '../tools';
import { Nullable } from '../../types';

import { IMipmap } from "./KTX2WorkerThread";
import { workerFunc } from "./KTX2WorkerThreadJS";
import { KTX2FileReader } from './KTX2FileReader';
import { Tools } from '../tools';

//const RGB_S3TC_DXT1_Format = 33776;
//const RGBA_S3TC_DXT5_Format = 33779;

/**
 * Class for loading KTX2 files
 * @hidden
 */
export class KhronosTextureContainer2 {

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
                    this._Worker.postMessage({ action: "init" });
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
                    if (msg.data.action === "mipmapsCreated" && msg.data.id === actionId) {
                        KhronosTextureContainer2._Worker!.removeEventListener("message", messageHandler);
                        if (!msg.data.success) {
                            rej({ message: msg.data.msg });
                        }else {
                            this._createTexture(msg.data.mipmaps, internalTexture);
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
                    action: "createMipmaps",
                    id: actionId,
                    data: data,
                    caps: compressedTexturesCaps,
                }, [data.buffer]);
            });
        });
    }

    protected _createTexture(mipmaps: Array<IMipmap>, internalTexture: InternalTexture) {
        for (let t = 0; t < mipmaps.length; ++t) {
            let mipmap = mipmaps[t];

            if (!mipmap || !mipmap.data) {
                throw new Error("KTX2 container - could not transcode one of the image");
            }

            console.log(`mipmap #${t} byte length=`, mipmap.data.byteLength);

            internalTexture.width = internalTexture.baseWidth = mipmap.width;
            internalTexture.height = internalTexture.baseHeight = mipmap.height;
            internalTexture.generateMipMaps = false;
            internalTexture.invertY = false;

            this._engine._bindTextureDirectly(this._engine._gl.TEXTURE_2D, internalTexture);
            this._engine._uploadCompressedDataToTextureDirectly(internalTexture, mipmap.transcodedFormat, mipmap.width, mipmap.height, mipmap.data, 0, 0);

            internalTexture.isReady = true;
            break;
        }
    }

    /**
     * Checks if the given data starts with a KTX2 file identifier.
     * @param data the data to check
     * @returns true if the data is a KTX2 file or false otherwise
     */
    public static IsValid(data: ArrayBufferView): boolean {
        return KTX2FileReader.IsValid(data);
    }
}
