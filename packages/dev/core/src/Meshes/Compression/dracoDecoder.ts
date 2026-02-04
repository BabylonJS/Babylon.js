import { DracoDecoderModule } from "draco3dgltf";
import { _IsConfigurationAvailable, DracoCodec, type IDracoCodecConfiguration } from "./dracoCodec";
import { Tools } from "../../Misc/tools";
import { Geometry } from "../geometry";
import { VertexBuffer } from "../buffer";
import { Logger } from "../../Misc/logger";
import type { BoundingInfo } from "../../Culling/boundingInfo";
import type { Scene } from "../../scene";
import type { Nullable } from "../../types";
import { DecodeMesh, DecoderWorkerFunction } from "./dracoCompressionWorker";
import type { IAttributeData, MeshData, DecoderMessage } from "./dracoDecoder.types";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let DracoDecoderModule: DracoDecoderModule;

/**
 * @experimental This class is an experimental version of `DracoCompression` and is subject to change.
 *
 * Draco Decoder (https://google.github.io/draco/)
 *
 * This class wraps the Draco decoder module.
 *
 * By default, the configuration points to a copy of the Draco decoder files for glTF from the Babylon.js cdn https://cdn.babylonjs.com/draco_wasm_wrapper_gltf.js.
 *
 * To update the configuration, use the following code:
 * ```javascript
 *     DracoDecoder.DefaultConfiguration = {
 *          wasmUrl: "<url to the WebAssembly library>",
 *          wasmBinaryUrl: "<url to the WebAssembly binary>",
 *          fallbackUrl: "<url to the fallback JavaScript library>",
 *     };
 * ```
 *
 * Draco has two versions, one for WebAssembly and one for JavaScript. The decoder configuration can be set to only support WebAssembly or only support the JavaScript version.
 * Decoding will automatically fallback to the JavaScript version if WebAssembly version is not configured or if WebAssembly is not supported by the browser.
 * Use `DracoDecoder.DefaultAvailable` to determine if the decoder configuration is available for the current context.
 *
 * To decode Draco compressed data, get the default DracoDecoder object and call decodeMeshToGeometryAsync:
 * ```javascript
 *     var geometry = await DracoDecoder.Default.decodeMeshToGeometryAsync(data);
 * ```
 */
export class DracoDecoder extends DracoCodec {
    /**
     * Default configuration for the DracoDecoder. Defaults to the following:
     * - numWorkers: 50% of the available logical processors, capped to 4. If no logical processors are available, defaults to 1.
     * - wasmUrl: `"https://cdn.babylonjs.com/draco_wasm_wrapper_gltf.js"`
     * - wasmBinaryUrl: `"https://cdn.babylonjs.com/draco_decoder_gltf.wasm"`
     * - fallbackUrl: `"https://cdn.babylonjs.com/draco_decoder_gltf.js"`
     */
    public static DefaultConfiguration: IDracoCodecConfiguration = {
        wasmUrl: `${Tools._DefaultCdnUrl}/draco_wasm_wrapper_gltf.js`,
        wasmBinaryUrl: `${Tools._DefaultCdnUrl}/draco_decoder_gltf.wasm`,
        fallbackUrl: `${Tools._DefaultCdnUrl}/draco_decoder_gltf.js`,
    };

    /**
     * Returns true if the decoder's `DefaultConfiguration` is available.
     */
    public static get DefaultAvailable(): boolean {
        return _IsConfigurationAvailable(DracoDecoder.DefaultConfiguration);
    }

    protected static _Default: Nullable<DracoDecoder> = null;
    /**
     * Default instance for the DracoDecoder.
     */
    public static get Default(): DracoDecoder {
        DracoDecoder._Default ??= new DracoDecoder();
        return DracoDecoder._Default;
    }

    /**
     * Reset the default DracoDecoder object to null and disposing the removed default instance.
     * Note that if the workerPool is a member of the static DefaultConfiguration object it is recommended not to run dispose,
     * unless the static worker pool is no longer needed.
     * @param skipDispose set to true to not dispose the removed default instance
     */
    public static ResetDefault(skipDispose?: boolean): void {
        if (DracoDecoder._Default) {
            if (!skipDispose) {
                DracoDecoder._Default.dispose();
            }
            DracoDecoder._Default = null;
        }
    }

    protected override _isModuleAvailable(): boolean {
        return typeof DracoDecoderModule !== "undefined";
    }

    protected override async _createModuleAsync(wasmBinary?: ArrayBuffer, jsModule?: unknown /** DracoDecoderModule */): Promise<{ module: unknown /** DecoderModule */ }> {
        const module = await ((jsModule as DracoDecoderModule) || DracoDecoderModule)({ wasmBinary });
        return { module };
    }

    protected override _getWorkerContent(): string {
        return `${DecodeMesh}(${DecoderWorkerFunction})()`;
    }

    /**
     * Creates a new Draco decoder.
     * @param configuration Optional override of the configuration for the DracoDecoder. If not provided, defaults to {@link DracoDecoder.DefaultConfiguration}.
     */
    constructor(configuration: IDracoCodecConfiguration = DracoDecoder.DefaultConfiguration) {
        super(configuration);
    }

    /**
     * Decode Draco compressed mesh data to mesh data.
     * @param data The ArrayBuffer or ArrayBufferView of the compressed Draco data
     * @param attributes A map of attributes from vertex buffer kinds to Draco unique ids
     * @param gltfNormalizedOverride A map of attributes from vertex buffer kinds to normalized flags to override the Draco normalization
     * @returns A promise that resolves with the decoded mesh data
     */
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
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
            // eslint-disable-next-line github/no-then
            return this._workerPoolPromise.then(async (workerPool) => {
                return await new Promise<MeshData>((resolve, reject) => {
                    workerPool.push((worker, onComplete) => {
                        let resultIndices: Nullable<Uint16Array | Uint32Array> = null;
                        const resultAttributes: Array<IAttributeData> = [];

                        const onError = (error: ErrorEvent) => {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject(error);
                            onComplete();
                        };

                        const onMessage = (event: MessageEvent<DecoderMessage>) => {
                            const message = event.data;
                            switch (message.id) {
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
                                case "decodeMeshDone": {
                                    worker.removeEventListener("error", onError);
                                    worker.removeEventListener("message", onMessage);
                                    resolve({ indices: resultIndices!, attributes: resultAttributes, totalVertices: message.totalVertices });
                                    onComplete();
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

        if (this._modulePromise) {
            // eslint-disable-next-line github/no-then
            return this._modulePromise.then((decoder) => {
                let resultIndices: Nullable<Uint16Array | Uint32Array> = null;
                const resultAttributes: Array<IAttributeData> = [];

                const numPoints = DecodeMesh(
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

        throw new Error("Draco: Decoder module is not available");
    }

    /**
     * Decode Draco compressed mesh data to Babylon geometry.
     * @param name The name to use when creating the geometry
     * @param scene The scene to use when creating the geometry
     * @param data The ArrayBuffer or ArrayBufferView of the Draco compressed data
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
}
