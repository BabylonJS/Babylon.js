/* eslint-disable @typescript-eslint/naming-convention */
import { Tools } from "../../Misc/tools";
import { AutoReleaseWorkerPool } from "../../Misc/workerPool";
import type { Nullable } from "../../types";
import type { IDisposable, Scene } from "../../scene";
import { Geometry } from "../geometry";
import { VertexBuffer } from "../buffer";
import { VertexData } from "../mesh.vertexData";
import { DracoDecoderModule } from "draco3dgltf";
import type { DecoderModule, DecoderBuffer, Decoder, Mesh, PointCloud, Status } from "draco3dgltf";
import { Logger } from "../../Misc/logger";

declare let DracoDecoderModule: DracoDecoderModule;

interface AttributeData {
    kind: string;
    data: ArrayBufferView;
    size: number;
    byteOffset: number;
    byteStride: number;
    normalized: boolean;
}

interface MeshData {
    indices?: Uint16Array | Uint32Array;
    attributes: Array<AttributeData>;
    totalVertices: number;
}

interface InitDoneMessage {
    id: "initDone";
}

interface DecodeMeshDoneMessage {
    id: "decodeMeshDone";
    totalVertices: number;
}

interface IndicesMessage {
    id: "indices";
    data: Uint16Array | Uint32Array;
}

interface AttributeMessage extends AttributeData {
    id: "attribute";
}

type Message = InitDoneMessage | DecodeMeshDoneMessage | IndicesMessage | AttributeMessage;

// WorkerGlobalScope
declare function importScripts(...urls: string[]): void;
declare function postMessage(message: Message, transfer?: any[]): void;

function createDecoderAsync(wasmBinary?: ArrayBuffer): Promise<{ module: DecoderModule }> {
    return new Promise((resolve) => {
        DracoDecoderModule({ wasmBinary: wasmBinary }).then((module) => {
            resolve({ module: module });
        });
    });
}

function decodeMesh(
    decoderModule: DecoderModule,
    data: Int8Array,
    attributes: { [kind: string]: number } | undefined,
    onIndicesData: (indices: Uint16Array | Uint32Array) => void,
    onAttributeData: (kind: string, data: ArrayBufferView, size: number, offset: number, stride: number, normalized: boolean) => void
): number {
    let decoder: Nullable<Decoder> = null;
    let buffer: Nullable<DecoderBuffer> = null;
    let geometry: Nullable<Mesh | PointCloud> = null;

    try {
        decoder = new decoderModule.Decoder();

        buffer = new decoderModule.DecoderBuffer();
        buffer.Init(data, data.byteLength);

        let status: Status;
        const type = decoder.GetEncodedGeometryType(buffer);
        switch (type) {
            case decoderModule.TRIANGULAR_MESH: {
                const mesh = new decoderModule.Mesh();
                status = decoder.DecodeBufferToMesh(buffer, mesh);
                if (!status.ok() || mesh.ptr === 0) {
                    throw new Error(status.error_msg());
                }

                const numFaces = mesh.num_faces();
                const numIndices = numFaces * 3;
                const byteLength = numIndices * 4;

                const ptr = decoderModule._malloc(byteLength);
                try {
                    decoder.GetTrianglesUInt32Array(mesh, byteLength, ptr);
                    const indices = new Uint32Array(numIndices);
                    indices.set(new Uint32Array(decoderModule.HEAPF32.buffer, ptr, numIndices));
                    onIndicesData(indices);
                } finally {
                    decoderModule._free(ptr);
                }

                geometry = mesh;
                break;
            }
            case decoderModule.POINT_CLOUD: {
                const pointCloud = new decoderModule.PointCloud();
                status = decoder.DecodeBufferToPointCloud(buffer, pointCloud);
                if (!status.ok() || !pointCloud.ptr) {
                    throw new Error(status.error_msg());
                }

                geometry = pointCloud;
                break;
            }
            default: {
                throw new Error(`Invalid geometry type ${type}`);
            }
        }

        const numPoints = geometry.num_points();

        const processAttribute = (decoder: Decoder, geometry: Mesh | PointCloud, kind: string, attribute: any) => {
            const dataType = attribute.data_type();
            const numComponents = attribute.num_components();
            const normalized = attribute.normalized();
            const byteStride = attribute.byte_stride();
            const byteOffset = attribute.byte_offset();

            const dataTypeInfo = {
                [decoderModule.DT_FLOAT32]: { typedArrayConstructor: Float32Array, heap: decoderModule.HEAPF32 },
                [decoderModule.DT_INT8]: { typedArrayConstructor: Int8Array, heap: decoderModule.HEAP8 },
                [decoderModule.DT_INT16]: { typedArrayConstructor: Int16Array, heap: decoderModule.HEAP16 },
                [decoderModule.DT_INT32]: { typedArrayConstructor: Int32Array, heap: decoderModule.HEAP32 },
                [decoderModule.DT_UINT8]: { typedArrayConstructor: Uint8Array, heap: decoderModule.HEAPU8 },
                [decoderModule.DT_UINT16]: { typedArrayConstructor: Uint16Array, heap: decoderModule.HEAPU16 },
                [decoderModule.DT_UINT32]: { typedArrayConstructor: Uint32Array, heap: decoderModule.HEAPU32 },
            };

            const info = dataTypeInfo[dataType];
            if (!info) {
                throw new Error(`Invalid data type ${dataType}`);
            }

            const numValues = numPoints * numComponents;
            const byteLength = numValues * info.typedArrayConstructor.BYTES_PER_ELEMENT;

            const ptr = decoderModule._malloc(byteLength);
            try {
                decoder.GetAttributeDataArrayForAllPoints(geometry, attribute, dataType, byteLength, ptr);
                const data = new info.typedArrayConstructor(info.heap.buffer, ptr, numValues);
                onAttributeData(kind, data.slice(), numComponents, byteOffset, byteStride, normalized);
            } finally {
                decoderModule._free(ptr);
            }
        };

        if (attributes) {
            for (const kind in attributes) {
                const id = attributes[kind];
                const attribute = decoder.GetAttributeByUniqueId(geometry, id);
                processAttribute(decoder, geometry, kind, attribute);
            }
        } else {
            const dracoAttributeTypes: { [kind: string]: number } = {
                position: decoderModule.POSITION,
                normal: decoderModule.NORMAL,
                color: decoderModule.COLOR,
                uv: decoderModule.TEX_COORD,
            };

            for (const kind in dracoAttributeTypes) {
                const id = decoder.GetAttributeId(geometry, dracoAttributeTypes[kind]);
                if (id !== -1) {
                    const attribute = decoder.GetAttribute(geometry, id);
                    processAttribute(decoder, geometry, kind, attribute);
                }
            }
        }

        return numPoints;
    } finally {
        if (geometry) {
            decoderModule.destroy(geometry);
        }

        if (buffer) {
            decoderModule.destroy(buffer);
        }

        if (decoder) {
            decoderModule.destroy(decoder);
        }
    }
}

/**
 * The worker function that gets converted to a blob url to pass into a worker.
 */
function worker(): void {
    let decoderPromise: PromiseLike<any> | undefined;

    onmessage = (event) => {
        const message = event.data;
        switch (message.id) {
            case "init": {
                const decoder = message.decoder;
                if (decoder.url) {
                    importScripts(decoder.url);
                    decoderPromise = DracoDecoderModule({ wasmBinary: decoder.wasmBinary });
                }
                postMessage({ id: "initDone" });
                break;
            }
            case "decodeMesh": {
                if (!decoderPromise) {
                    throw new Error("Draco decoder module is not available");
                }
                decoderPromise.then((decoder) => {
                    const numPoints = decodeMesh(
                        decoder,
                        message.dataView,
                        message.attributes,
                        (indices) => {
                            postMessage({ id: "indices", data: indices }, [indices.buffer]);
                        },
                        (kind, data, size, offset, stride, normalized) => {
                            postMessage({ id: "attribute", kind, data, size, byteOffset: offset, byteStride: stride, normalized }, [data.buffer]);
                        }
                    );
                    postMessage({ id: "decodeMeshDone", totalVertices: numPoints });
                });
                break;
            }
        }
    };
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
    };
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
     * Constructor
     * @param numWorkers The number of workers for async operations. Specify `0` to disable web workers and run synchronously in the current context.
     */
    constructor(numWorkers = DracoCompression.DefaultNumWorkers) {
        const decoder = DracoCompression.Configuration.decoder;

        const decoderInfo: { url: string | undefined; wasmBinaryPromise: Promise<ArrayBuffer | undefined> } =
            decoder.wasmUrl && decoder.wasmBinaryUrl && typeof WebAssembly === "object"
                ? {
                      url: Tools.GetBabylonScriptURL(decoder.wasmUrl, true),
                      wasmBinaryPromise: Tools.LoadFileAsync(Tools.GetBabylonScriptURL(decoder.wasmBinaryUrl, true)),
                  }
                : {
                      url: Tools.GetBabylonScriptURL(decoder.fallbackUrl!),
                      wasmBinaryPromise: Promise.resolve(undefined),
                  };

        if (numWorkers && typeof Worker === "function" && typeof URL === "function") {
            this._workerPoolPromise = decoderInfo.wasmBinaryPromise.then((decoderWasmBinary) => {
                const workerContent = `${decodeMesh}(${worker})()`;
                const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));

                return new AutoReleaseWorkerPool(numWorkers, () => {
                    return new Promise((resolve, reject) => {
                        const worker = new Worker(workerBlobUrl);
                        const onError = (error: ErrorEvent) => {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            reject(error);
                        };

                        const onMessage = (event: MessageEvent<Message>) => {
                            if (event.data.id === "initDone") {
                                worker.removeEventListener("error", onError);
                                worker.removeEventListener("message", onMessage);
                                resolve(worker);
                            }
                        };

                        worker.addEventListener("error", onError);
                        worker.addEventListener("message", onMessage);

                        worker.postMessage({
                            id: "init",
                            decoder: {
                                url: decoderInfo.url,
                                wasmBinary: decoderWasmBinary,
                            },
                        });
                    });
                });
            });
        } else {
            this._decoderModulePromise = decoderInfo.wasmBinaryPromise.then((decoderWasmBinary) => {
                if (!decoderInfo.url) {
                    throw new Error("Draco decoder module is not available");
                }

                return Tools.LoadBabylonScriptAsync(decoderInfo.url).then(() => {
                    return createDecoderAsync(decoderWasmBinary as ArrayBuffer);
                });
            });
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
    public whenReadyAsync(): Promise<void> {
        if (this._workerPoolPromise) {
            return this._workerPoolPromise.then(() => {});
        }

        if (this._decoderModulePromise) {
            return this._decoderModulePromise.then(() => {});
        }

        return Promise.resolve();
    }

    private _decodeMeshAsync(
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
    public decodeMeshToGeometryAsync(name: string, scene: Scene, data: ArrayBuffer | ArrayBufferView, attributes?: { [kind: string]: number }): Promise<Geometry> {
        return this._decodeMeshAsync(data, attributes).then((meshData) => {
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
        });
    }

    /** @internal */
    public _decodeMeshToGeometryForGltfAsync(
        name: string,
        scene: Scene,
        data: ArrayBuffer | ArrayBufferView,
        attributes: { [kind: string]: number },
        gltfNormalizedOverride: { [kind: string]: boolean }
    ): Promise<Geometry> {
        return this._decodeMeshAsync(data, attributes, gltfNormalizedOverride).then((meshData) => {
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
        });
    }

    /**
     * Decode Draco compressed mesh data to Babylon vertex data.
     * @param data The ArrayBuffer or ArrayBufferView for the Draco compression data
     * @param attributes A map of attributes from vertex buffer kinds to Draco unique ids
     * @returns A promise that resolves with the decoded vertex data
     * @deprecated Use {@link decodeMeshToGeometryAsync} for better performance in some cases
     */
    public decodeMeshAsync(data: ArrayBuffer | ArrayBufferView, attributes?: { [kind: string]: number }): Promise<VertexData> {
        return this._decodeMeshAsync(data, attributes).then((meshData) => {
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
        });
    }
}
