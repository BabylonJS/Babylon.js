/* eslint-disable @typescript-eslint/naming-convention */
import type { BoundingInfo } from "../../Culling/boundingInfo";
import { Tools } from "../../Misc/tools";
import { AutoReleaseWorkerPool } from "../../Misc/workerPool";
import type { Nullable } from "../../types";
import type { IDisposable, Scene } from "../../scene";
import { Geometry } from "../geometry";
import { VertexBuffer } from "../buffer";
import { VertexData } from "../mesh.vertexData";
import type { DecoderModule } from "draco3dgltf";
import { Logger } from "../../Misc/logger";
import { decodeMesh, type AttributeData, type Message, workerFunction, initializeWebWorker } from "./dracoCompressionWorker";
import { DracoDecoderModule } from "draco3dgltf";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let DracoDecoderModule: DracoDecoderModule;

interface MeshData {
    indices?: Uint16Array | Uint32Array;
    attributes: Array<AttributeData>;
    totalVertices: number;
}

function createDecoderAsync(wasmBinary?: ArrayBuffer, jsModule?: DracoDecoderModule): Promise<{ module: DecoderModule }> {
    return new Promise((resolve) => {
        (jsModule || DracoDecoderModule)({ wasmBinary }).then((module) => {
            resolve({ module });
        });
    });
}

/**
 * Configuration for Draco compression
 */
export interface IDracoCompressionConfiguration {
    /**
     * Configuration for the decoder.
     */
    decoder: {
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
         * Optional worker pool to use for async decoding instead of creating a new worker pool.
         */
        workerPool?: AutoReleaseWorkerPool;
        /**
         * Optional ArrayBuffer of the WebAssembly binary
         */
        wasmBinary?: ArrayBuffer;

        /**
         * The decoder module if already available.
         */
        jsModule?: any /* DecoderModule */;
    };
}

/**
 * Options for Draco compression
 */
export interface IDracoCompressionOptions {
    /**
     * The number of workers for async operations. Specify `0` to disable web workers and run synchronously in the current context.
     */
    numWorkers?: number;
    /**
     * Optional ArrayBuffer of the WebAssembly binary.
     * If provided it will be used instead of loading the binary from wasmBinaryUrl.
     */
    wasmBinary?: ArrayBuffer;
    /**
     * Optional worker pool to use for async decoding.
     * If provided, numWorkers will be ignored and the worker pool will be used instead.
     * If provided the draco script will not be loaded from the DracoConfiguration.
     */
    workerPool?: AutoReleaseWorkerPool;
}

/**
 * Draco compression (https://google.github.io/draco/)
 *
 * This class wraps the Draco module.
 *
 * **Encoder**
 *
 * The encoder is not currently implemented.
 *
 * **Decoder**
 *
 * By default, the configuration points to a copy of the Draco decoder files for glTF from the babylon.js preview cdn https://preview.babylonjs.com/draco_wasm_wrapper_gltf.js.
 *
 * To update the configuration, use the following code:
 * ```javascript
 *     DracoCompression.Configuration = {
 *         decoder: {
 *             wasmUrl: "<url to the WebAssembly library>",
 *             wasmBinaryUrl: "<url to the WebAssembly binary>",
 *             fallbackUrl: "<url to the fallback JavaScript library>",
 *         }
 *     };
 * ```
 *
 * Draco has two versions, one for WebAssembly and one for JavaScript. The decoder configuration can be set to only support WebAssembly or only support the JavaScript version.
 * Decoding will automatically fallback to the JavaScript version if WebAssembly version is not configured or if WebAssembly is not supported by the browser.
 * Use `DracoCompression.DecoderAvailable` to determine if the decoder configuration is available for the current context.
 *
 * To decode Draco compressed data, get the default DracoCompression object and call decodeMeshToGeometryAsync:
 * ```javascript
 *     var geometry = await DracoCompression.Default.decodeMeshToGeometryAsync(data);
 * ```
 *
 * @see https://playground.babylonjs.com/#DMZIBD#0
 */
export class DracoCompression implements IDisposable {
    private _workerPoolPromise?: Promise<AutoReleaseWorkerPool>;
    private _decoderModulePromise?: Promise<{ module: DecoderModule }>;

    /**
     * The configuration. Defaults to the following urls:
     * - wasmUrl: "https://cdn.babylonjs.com/draco_wasm_wrapper_gltf.js"
     * - wasmBinaryUrl: "https://cdn.babylonjs.com/draco_decoder_gltf.wasm"
     * - fallbackUrl: "https://cdn.babylonjs.com/draco_decoder_gltf.js"
     */
    public static Configuration: IDracoCompressionConfiguration = {
        decoder: {
            wasmUrl: `${Tools._DefaultCdnUrl}/draco_wasm_wrapper_gltf.js`,
            wasmBinaryUrl: `${Tools._DefaultCdnUrl}/draco_decoder_gltf.wasm`,
            fallbackUrl: `${Tools._DefaultCdnUrl}/draco_decoder_gltf.js`,
        },
    };

    /**
     * Returns true if the decoder configuration is available.
     */
    public static get DecoderAvailable(): boolean {
        const decoder = DracoCompression.Configuration.decoder;
        return !!((decoder.wasmUrl && decoder.wasmBinaryUrl && typeof WebAssembly === "object") || decoder.fallbackUrl);
    }

    /**
     * Default number of workers to create when creating the draco compression object.
     */
    public static DefaultNumWorkers = DracoCompression.GetDefaultNumWorkers();

    private static GetDefaultNumWorkers(): number {
        if (typeof navigator !== "object" || !navigator.hardwareConcurrency) {
            return 1;
        }

        // Use 50% of the available logical processors but capped at 4.
        return Math.min(Math.floor(navigator.hardwareConcurrency * 0.5), 4);
    }

    private static _Default: Nullable<DracoCompression> = null;

    /**
     * Default instance for the draco compression object.
     */
    public static get Default(): DracoCompression {
        if (!DracoCompression._Default) {
            DracoCompression._Default = new DracoCompression();
        }

        return DracoCompression._Default;
    }

    /**
     * Reset the default draco compression object to null and disposing the removed default instance.
     * Note that if the workerPool is a member of the static Configuration object it is recommended not to run dispose,
     * unless the static worker pool is no longer needed.
     * @param skipDispose set to true to not dispose the removed default instance
     */
    public static ResetDefault(skipDispose?: boolean): void {
        if (DracoCompression._Default) {
            if (!skipDispose) {
                DracoCompression._Default.dispose();
            }
            DracoCompression._Default = null;
        }
    }

    /**
     * Constructor
     * @param numWorkers The number of workers for async operations Or an options object. Specify `0` to disable web workers and run synchronously in the current context.
     */
    constructor(numWorkers: number | IDracoCompressionOptions = DracoCompression.DefaultNumWorkers) {
        const decoder = DracoCompression.Configuration.decoder;
        // check if the decoder binary and worker pool was injected
        // Note - it is expected that the developer checked if WebWorker, WebAssembly and the URL object are available
        if (decoder.workerPool || (typeof numWorkers === "object" && numWorkers.workerPool)) {
            // set the promise accordingly
            this._workerPoolPromise = Promise.resolve(decoder.workerPool || (numWorkers as IDracoCompressionOptions).workerPool!);
        } else {
            // to avoid making big changes to the decider, if wasmBinary is provided use it in the wasmBinaryPromise
            const wasmBinaryProvided = decoder.wasmBinary || (typeof numWorkers === "object" && numWorkers.wasmBinary);
            const numberOfWorkers = typeof numWorkers === "number" ? numWorkers : numWorkers.numWorkers;
            const useWorkers = numberOfWorkers && typeof Worker === "function" && typeof URL === "function";
            const urlNeeded = useWorkers || (!useWorkers && !decoder.jsModule);
            // code maintained here for back-compat with no changes

            const decoderInfo: { url: string | undefined; wasmBinaryPromise: Promise<ArrayBuffer | undefined> } =
                decoder.wasmUrl && decoder.wasmBinaryUrl && typeof WebAssembly === "object"
                    ? {
                          url: urlNeeded ? Tools.GetBabylonScriptURL(decoder.wasmUrl, true) : "",
                          wasmBinaryPromise: wasmBinaryProvided ? Promise.resolve(wasmBinaryProvided) : Tools.LoadFileAsync(Tools.GetBabylonScriptURL(decoder.wasmBinaryUrl, true)),
                      }
                    : {
                          url: urlNeeded ? Tools.GetBabylonScriptURL(decoder.fallbackUrl!) : "",
                          wasmBinaryPromise: Promise.resolve(undefined),
                      };
            if (useWorkers) {
                this._workerPoolPromise = decoderInfo.wasmBinaryPromise.then((decoderWasmBinary) => {
                    const workerContent = `${decodeMesh}(${workerFunction})()`;
                    const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));

                    return new AutoReleaseWorkerPool(numberOfWorkers as number, () => {
                        const worker = new Worker(workerBlobUrl);
                        return initializeWebWorker(worker, decoderWasmBinary, decoderInfo.url);
                    });
                });
            } else {
                this._decoderModulePromise = decoderInfo.wasmBinaryPromise.then(async (decoderWasmBinary) => {
                    if (typeof DracoDecoderModule === "undefined") {
                        if (!decoder.jsModule) {
                            if (!decoderInfo.url) {
                                throw new Error("Draco decoder module is not available");
                            }
                            await Tools.LoadBabylonScriptAsync(decoderInfo.url);
                        }
                    }
                    return await createDecoderAsync(decoderWasmBinary as ArrayBuffer, decoder.jsModule);
                });
            }
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
        delete this._decoderModulePromise;
    }

    /**
     * Returns a promise that resolves when ready. Call this manually to ensure draco compression is ready before use.
     * @returns a promise that resolves when ready
     */
    public async whenReadyAsync(): Promise<void> {
        if (this._workerPoolPromise) {
            await this._workerPoolPromise;
            return;
        }

        if (this._decoderModulePromise) {
            await this._decoderModulePromise;
            return;
        }
    }

    /**
     * Decode Draco compressed mesh data to mesh data.
     * @param data The ArrayBuffer or ArrayBufferView for the Draco compression data
     * @param attributes A map of attributes from vertex buffer kinds to Draco unique ids
     * @param gltfNormalizedOverride A map of attributes from vertex buffer kinds to normalized flags to override the Draco normalization
     * @returns A promise that resolves with the decoded mesh data
     */
    public decodeMeshToMeshDataAsync(
        data: ArrayBuffer | ArrayBufferView,
        attributes?: { [kind: string]: number },
        gltfNormalizedOverride?: { [kind: string]: boolean }
    ): Promise<MeshData> {
        const dataView = data instanceof ArrayBuffer ? new Int8Array(data) : new Int8Array(data.buffer, data.byteOffset, data.byteLength);

        const applyGltfNormalizedOverride = (kind: string, normalized: boolean): boolean => {
            if (gltfNormalizedOverride && gltfNormalizedOverride[kind] !== undefined) {
                if (normalized !== gltfNormalizedOverride[kind]) {
                    Logger.Warn(
                        `Normalized flag from Draco data (${normalized}) does not match normalized flag from glTF accessor (${gltfNormalizedOverride[kind]}). Using flag from glTF accessor.`
                    );
                }

                return gltfNormalizedOverride[kind];
            } else {
                return normalized;
            }
        };

        if (this._workerPoolPromise) {
            return this._workerPoolPromise.then((workerPool) => {
                return new Promise<MeshData>((resolve, reject) => {
                    workerPool.push((worker, onComplete) => {
                        let resultIndices: Nullable<Uint16Array | Uint32Array> = null;
                        const resultAttributes: Array<AttributeData> = [];

                        const onError = (error: ErrorEvent) => {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            reject(error);
                            onComplete();
                        };

                        const onMessage = (event: MessageEvent<Message>) => {
                            const message = event.data;
                            switch (message.id) {
                                case "decodeMeshDone": {
                                    worker.removeEventListener("error", onError);
                                    worker.removeEventListener("message", onMessage);
                                    resolve({ indices: resultIndices!, attributes: resultAttributes, totalVertices: message.totalVertices });
                                    onComplete();
                                    break;
                                }
                                case "indices": {
                                    resultIndices = message.data;
                                    break;
                                }
                                case "attribute": {
                                    resultAttributes.push({
                                        kind: message.kind,
                                        data: message.data,
                                        size: message.size,
                                        byteOffset: message.byteOffset,
                                        byteStride: message.byteStride,
                                        normalized: applyGltfNormalizedOverride(message.kind, message.normalized),
                                    });
                                    break;
                                }
                            }
                        };

                        worker.addEventListener("error", onError);
                        worker.addEventListener("message", onMessage);

                        const dataViewCopy = dataView.slice();
                        worker.postMessage({ id: "decodeMesh", dataView: dataViewCopy, attributes: attributes }, [dataViewCopy.buffer]);
                    });
                });
            });
        }

        if (this._decoderModulePromise) {
            return this._decoderModulePromise.then((decoder) => {
                let resultIndices: Nullable<Uint16Array | Uint32Array> = null;
                const resultAttributes: Array<AttributeData> = [];

                const numPoints = decodeMesh(
                    decoder.module,
                    dataView,
                    attributes,
                    (indices) => {
                        resultIndices = indices;
                    },
                    (kind, data, size, byteOffset, byteStride, normalized) => {
                        resultAttributes.push({
                            kind,
                            data,
                            size,
                            byteOffset,
                            byteStride,
                            normalized,
                        });
                    }
                );

                return { indices: resultIndices!, attributes: resultAttributes, totalVertices: numPoints };
            });
        }

        throw new Error("Draco decoder module is not available");
    }

    /**
     * Decode Draco compressed mesh data to Babylon geometry.
     * @param name The name to use when creating the geometry
     * @param scene The scene to use when creating the geometry
     * @param data The ArrayBuffer or ArrayBufferView for the Draco compression data
     * @param attributes A map of attributes from vertex buffer kinds to Draco unique ids
     * @returns A promise that resolves with the decoded geometry
     */
    public async decodeMeshToGeometryAsync(name: string, scene: Scene, data: ArrayBuffer | ArrayBufferView, attributes?: { [kind: string]: number }): Promise<Geometry> {
        const meshData = await this.decodeMeshToMeshDataAsync(data, attributes);
        const geometry = new Geometry(name, scene);
        if (meshData.indices) {
            geometry.setIndices(meshData.indices);
        }
        for (const attribute of meshData.attributes) {
            geometry.setVerticesBuffer(
                new VertexBuffer(
                    scene.getEngine(),
                    attribute.data,
                    attribute.kind,
                    false,
                    undefined,
                    attribute.byteStride,
                    undefined,
                    attribute.byteOffset,
                    attribute.size,
                    undefined,
                    attribute.normalized,
                    true
                ),
                meshData.totalVertices
            );
        }
        return geometry;
    }

    /** @internal */
    public async _decodeMeshToGeometryForGltfAsync(
        name: string,
        scene: Scene,
        data: ArrayBuffer | ArrayBufferView,
        attributes: { [kind: string]: number },
        gltfNormalizedOverride: { [kind: string]: boolean },
        boundingInfo: Nullable<BoundingInfo>
    ): Promise<Geometry> {
        const meshData = await this.decodeMeshToMeshDataAsync(data, attributes, gltfNormalizedOverride);
        const geometry = new Geometry(name, scene);
        if (boundingInfo) {
            geometry._boundingInfo = boundingInfo;
            geometry.useBoundingInfoFromGeometry = true;
        }
        if (meshData.indices) {
            geometry.setIndices(meshData.indices);
        }
        for (const attribute of meshData.attributes) {
            geometry.setVerticesBuffer(
                new VertexBuffer(
                    scene.getEngine(),
                    attribute.data,
                    attribute.kind,
                    false,
                    undefined,
                    attribute.byteStride,
                    undefined,
                    attribute.byteOffset,
                    attribute.size,
                    undefined,
                    attribute.normalized,
                    true
                ),
                meshData.totalVertices
            );
        }
        return geometry;
    }

    /**
     * Decode Draco compressed mesh data to Babylon vertex data.
     * @param data The ArrayBuffer or ArrayBufferView for the Draco compression data
     * @param attributes A map of attributes from vertex buffer kinds to Draco unique ids
     * @returns A promise that resolves with the decoded vertex data
     * @deprecated Use {@link decodeMeshToGeometryAsync} for better performance in some cases
     */
    public async decodeMeshAsync(data: ArrayBuffer | ArrayBufferView, attributes?: { [kind: string]: number }): Promise<VertexData> {
        const meshData = await this.decodeMeshToMeshDataAsync(data, attributes);
        const vertexData = new VertexData();
        if (meshData.indices) {
            vertexData.indices = meshData.indices;
        }
        for (const attribute of meshData.attributes) {
            const floatData = VertexBuffer.GetFloatData(
                attribute.data,
                attribute.size,
                VertexBuffer.GetDataType(attribute.data),
                attribute.byteOffset,
                attribute.byteStride,
                attribute.normalized,
                meshData.totalVertices
            );

            vertexData.set(floatData, attribute.kind);
        }
        return vertexData;
    }
}
