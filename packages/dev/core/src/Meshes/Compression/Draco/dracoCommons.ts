import { VertexData, IGetSetVerticesData } from "../../mesh.vertexData";
import type { Nullable } from "../../../types";
import { Tools } from "../../../Misc/tools";
import type { IDisposable } from "../../../scene";
import { AutoReleaseWorkerPool } from "../../../Misc/workerPool";

export enum DracoEncoderMethod {
    EDGEBREAKER = 1,
    SEQUENTIAL = 0,
}

export const enum DracoGeometryType {
    TRIANGULAR_MESH,
    POINT_CLOUD,
}

export enum DracoAttribute {
    INVALID = -1,
    // Named attributes start here. The difference between named and generic
    // attributes is that for named attributes we know their purpose and we
    // can apply some special methods when dealing with them (e.g. during
    // encoding).
    POSITION = 0,
    NORMAL = 1,
    COLOR = 2,
    TEX_COORD = 3,
    // A special id used to mark attributes that are not assigned to any known
    // predefined use case. Such attributes are often used for a shader specific
    // data.
    GENERIC = 4,
    // NOT implemented
    TANGENT = 5,
    MATERIAL = 6,
    JOINTS = 7,
    WEIGHTS = 8,
    NAMED_ATTRIBUTES_COUNT,
}

export enum DracoAttributeName {
    INVALID = "INVALID",
    POSITION = "POSITION",
    NORMAL = "NORMAL",
    COLOR = "COLOR",
    TEX_COORD = "TEX_COORD",
    GENERIC = "GENERIC",
    // NOT implemented
    TANGENT = "TANGENT",
    MATERIAL = "MATERIAL",
    JOINTS = "JOINT",
    WEIGHTS = "WEIGHT",
}

export interface IDracoEncodedPrimitive {
    data: Uint8Array;
    attributes: { [kind: string]: number };
}

export interface IDracoEncoderOptions {
    // indicates how to tune the encoder regarding decode speed (0 gives better speed but worst quality)
    decodeSpeed?: number;
    // indicates how to tune the encoder parameters (0 gives better speed but worst quality)
    encodeSpeed?: number;
    method?: DracoEncoderMethod;
    // indicates the presision of each type of data stored in the draco file
    quantizationBits?: { [key: string]: number };
    // indicate we should export normals if present
    exportNormals?: boolean;
    // indicate we should export tangents if present
    exportTangents?: boolean;
    // indicate we should export texture coordinates if present
    exportUvs?: boolean;
    // indicate we should export colors if present
    exportColors?: boolean;
    // indicate we should export weights if present
    exportWeights?: boolean;
}

export interface IDracoEncoder {
    encodeMeshAsync(input: IGetSetVerticesData, options?: IDracoEncoderOptions): Promise<Nullable<IDracoEncodedPrimitive>>;
}

export interface IDracoDecoder {
    decodeMeshAsync(data: ArrayBuffer | ArrayBufferView, attributes?: { [kind: string]: number }, dividers?: { [kind: string]: number }): Promise<VertexData>;
}

/**
 * Configuration for Draco codecs - either encoder or decoder
 */
export interface IDracoCompressionEngineConfiguration {
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
}

class DracoEngineInfo {
    static FromConfiguration(config: IDracoCompressionEngineConfiguration): DracoEngineInfo {
        return config.wasmUrl && config.wasmBinaryUrl && typeof WebAssembly === "object"
            ? {
                  url: Tools.GetAbsoluteUrl(config.wasmUrl),
                  wasmBinaryPromise: Tools.LoadFileAsync(Tools.GetAbsoluteUrl(config.wasmBinaryUrl)),
              }
            : {
                  url: Tools.GetAbsoluteUrl(config.fallbackUrl!),
                  wasmBinaryPromise: Promise.resolve(undefined),
              };
    }

    url: string | undefined;
    wasmBinaryPromise: Promise<ArrayBuffer | string | undefined>;
}

/**
 * This is the base class for the Draco Encoder and Decoder.
 */
export abstract class DracoCompressionBase implements IDisposable {
    private static _GetDefaultNumWorkers(): number {
        if (typeof navigator !== "object" || !navigator.hardwareConcurrency) {
            return 1;
        }

        // Use 50% of the available logical processors but capped at 4.
        return Math.min(Math.floor(navigator.hardwareConcurrency * 0.5), 4);
    }

    public static WasmBaseUrl: string = "https://preview.babylonjs.com/";

    protected static _isCodecAvailable(codec: IDracoCompressionEngineConfiguration) {
        return !!((codec.wasmUrl && codec.wasmBinaryUrl && typeof WebAssembly === "object") || codec.fallbackUrl);
    }

    /**
     * Default number of workers to create when creating the draco compression object.
     */
    public static DefaultNumWorkers = DracoCompressionBase._GetDefaultNumWorkers();

    protected _modulePromise?: Promise<any>;
    protected _workerPoolPromise?: Promise<AutoReleaseWorkerPool>;

    constructor(configuration: IDracoCompressionEngineConfiguration, numWorkers: number) {
        const infos = DracoEngineInfo.FromConfiguration(configuration);

        if (numWorkers && typeof Worker === "function") {
            // push the infos into an array to process a single worker initialization
            const codecInfos: { url: string | undefined; wasmBinaryPromise: Promise<ArrayBuffer | string | undefined> } = {
                url: infos.url,
                wasmBinaryPromise: infos.wasmBinaryPromise,
            };

            this._workerPoolPromise = codecInfos.wasmBinaryPromise.then((binary) => {
                const workerContent = this.getWorkerContent();
                const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));

                return new AutoReleaseWorkerPool(numWorkers, () => {
                    return new Promise((resolve, reject) => {
                        const worker = new Worker(workerBlobUrl);
                        const onError = (error: ErrorEvent) => {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            reject(error);
                        };

                        const onMessage = (message: MessageEvent) => {
                            if (message.data === "done") {
                                worker.removeEventListener("error", onError);
                                worker.removeEventListener("message", onMessage);
                                resolve(worker);
                            }
                        };

                        worker.addEventListener("error", onError);
                        worker.addEventListener("message", onMessage);

                        // we post initialization message with the array of url and wasm binary
                        worker.postMessage({
                            id: "init",
                            codec: {
                                url: codecInfos.url,
                                wasmBinary: binary,
                            },
                        });
                    });
                });
            });
        } else {
            this._modulePromise = infos.wasmBinaryPromise.then((wasmBinary) => {
                if (!infos.url) {
                    throw new Error("Draco module is not available");
                }
                return Tools.LoadScriptAsync(infos.url).then(() => {
                    return this.createModuleAsync(wasmBinary as ArrayBuffer);
                });
            });
        }
    }

    dispose(): void {
        if (this._workerPoolPromise) {
            this._workerPoolPromise.then((workerPool) => {
                workerPool.dispose();
            });
        }

        delete this._workerPoolPromise;
        delete this._modulePromise;
    }

    abstract createModuleAsync(wasmBinary?: ArrayBuffer): Promise<any>;
    abstract getWorkerContent(): string;
}
