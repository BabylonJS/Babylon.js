import { _IsConfigurationAvailable, DracoCodec, type IDracoCodecConfiguration } from "./dracoCodec";
import type { EncoderMessage, IDracoAttributeData, IDracoEncodedMeshData, IDracoEncoderOptions, DracoAttributeName } from "./dracoEncoder.types";
import { EncodeMesh, EncoderWorkerFunction } from "./dracoCompressionWorker";
import { Tools } from "../../Misc/tools";
import { VertexBuffer } from "../buffer";
import type { Nullable } from "../../types";
import { Mesh } from "../mesh";
import type { Geometry } from "../geometry";
import { Logger } from "../../Misc/logger";
import { deepMerge } from "../../Misc/deepMerger";
import type { EncoderModule } from "draco3d";
import { AreIndices32Bits, GetTypedArrayData } from "core/Buffers/bufferUtils";

// Missing type from types/draco3d. Do not use in public scope; UMD tests will fail because of EncoderModule.
type DracoEncoderModule = (props: { wasmBinary?: ArrayBuffer }) => Promise<EncoderModule>;

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let DracoEncoderModule: DracoEncoderModule;

/**
 * Map the Babylon.js attribute kind to the Draco attribute kind, defined by the `GeometryAttributeType` enum.
 * @internal
 */
function GetDracoAttributeName(kind: string): DracoAttributeName {
    if (kind === VertexBuffer.PositionKind) {
        return "POSITION";
    } else if (kind === VertexBuffer.NormalKind) {
        return "NORMAL";
    } else if (kind === VertexBuffer.ColorKind) {
        return "COLOR";
    } else if (kind.startsWith(VertexBuffer.UVKind)) {
        return "TEX_COORD";
    }
    return "GENERIC";
}

/**
 * Get the indices for the geometry, if present. Eventually used as
 * `AddFacesToMesh(mesh: Mesh, numFaces: number, faces: Uint16Array | Uint32Array)`;
 * where `numFaces = indices.length / 3` and `faces = indices`.
 * @internal
 */
function PrepareIndicesForDraco(input: Mesh | Geometry): Nullable<Uint32Array | Uint16Array> {
    let indices = input.getIndices(undefined, true);

    // Convert number[] and Int32Array types, if needed
    if (indices && !(indices instanceof Uint32Array) && !(indices instanceof Uint16Array)) {
        indices = (AreIndices32Bits(indices, indices.length) ? Uint32Array : Uint16Array).from(indices);
    }

    return indices;
}

/**
 * Get relevant information about the geometry's vertex attributes for Draco encoding. Eventually used for each attribute as
 * `AddFloatAttribute(mesh: Mesh, attribute: number, count: number, itemSize: number, array: TypedArray)`
 * where `attribute = EncoderModule[<dracoAttribute>]`, `itemSize = <size>`, `array = <data>`, and count is the number of position vertices.
 * @internal
 */
function PrepareAttributesForDraco(input: Mesh | Geometry, excludedAttributes?: string[]): Array<IDracoAttributeData> {
    const attributes: Array<IDracoAttributeData> = [];

    for (const kind of input.getVerticesDataKinds()) {
        if (excludedAttributes?.includes(kind)) {
            if (kind === VertexBuffer.PositionKind) {
                throw new Error("Cannot exclude position attribute from Draco encoding.");
            }
            continue;
        }

        // Convert number[] to typed array, if needed.
        const vertexBuffer = input.getVertexBuffer(kind)!;
        const size = vertexBuffer.getSize();
        const data = GetTypedArrayData(
            vertexBuffer.getData()!,
            size,
            vertexBuffer.type,
            vertexBuffer.byteOffset,
            vertexBuffer.byteStride,
            vertexBuffer.normalized,
            input.getTotalVertices(),
            true
        );
        attributes.push({ kind: kind, dracoName: GetDracoAttributeName(kind), size: size, data: data });
    }

    return attributes;
}

const DefaultEncoderOptions: IDracoEncoderOptions = {
    decodeSpeed: 5,
    encodeSpeed: 5,
    method: "MESH_EDGEBREAKER_ENCODING",
    quantizationBits: {
        POSITION: 14,
        NORMAL: 10,
        COLOR: 8,
        TEX_COORD: 12,
        GENERIC: 12,
    },
};

/**
 * @experimental This class is subject to change.
 *
 * Draco Encoder (https://google.github.io/draco/)
 *
 * This class wraps the Draco encoder module.
 *
 * By default, the configuration points to a copy of the Draco encoder files from the Babylon.js cdn https://cdn.babylonjs.com/draco_encoder_wasm_wrapper.js.
 *
 * To update the configuration, use the following code:
 * ```javascript
 *     DracoEncoder.DefaultConfiguration = {
 *          wasmUrl: "<url to the WebAssembly library>",
 *          wasmBinaryUrl: "<url to the WebAssembly binary>",
 *          fallbackUrl: "<url to the fallback JavaScript library>",
 *     };
 * ```
 *
 * Draco has two versions, one for WebAssembly and one for JavaScript. The encoder configuration can be set to only support WebAssembly or only support the JavaScript version.
 * Decoding will automatically fallback to the JavaScript version if WebAssembly version is not configured or if WebAssembly is not supported by the browser.
 * Use `DracoEncoder.DefaultAvailable` to determine if the encoder configuration is available for the current context.
 *
 * To encode Draco compressed data, get the default DracoEncoder object and call encodeMeshAsync:
 * ```javascript
 *     var dracoData = await DracoEncoder.Default.encodeMeshAsync(mesh);
 * ```
 *
 * Currently, DracoEncoder only encodes to meshes. Encoding to point clouds is not yet supported.
 *
 * Only position, normal, color, and UV attributes are supported natively by the encoder. All other attributes are treated as generic. This means that,
 * when decoding these generic attributes later, additional information about their original Babylon types will be needed to interpret the data correctly.
 * You can use the return value of `encodeMeshAsync` to source this information, specifically the `attributes` field. E.g.,
 * ```javascript
 *    var dracoData = await DracoEncoder.Default.encodeMeshAsync(mesh);
 *    var meshData = await DracoDecoder.Default.decodeMeshToMeshDataAsync(dracoData.data, dracoData.attributes);
 * ```
 *
 * By default, DracoEncoder will encode all available attributes of the mesh. To exclude specific attributes, use the following code:
 * ```javascript
 *    var options = { excludedAttributes: [VertexBuffer.MatricesIndicesKind, VertexBuffer.MatricesWeightsKind] };
 *    var dracoData = await DracoDecoder.Default.encodeMeshAsync(mesh, options);
 * ```
 */
export class DracoEncoder extends DracoCodec {
    /**
     * Default configuration for the DracoEncoder. Defaults to the following:
     * - numWorkers: 50% of the available logical processors, capped to 4. If no logical processors are available, defaults to 1.
     * - wasmUrl: `"https://cdn.babylonjs.com/draco_encoder_wasm_wrapper.js"`
     * - wasmBinaryUrl: `"https://cdn.babylonjs.com/draco_encoder.wasm"`
     * - fallbackUrl: `"https://cdn.babylonjs.com/draco_encoder.js"`
     */
    public static DefaultConfiguration: IDracoCodecConfiguration = {
        wasmUrl: `${Tools._DefaultCdnUrl}/draco_encoder_wasm_wrapper.js`,
        wasmBinaryUrl: `${Tools._DefaultCdnUrl}/draco_encoder.wasm`,
        fallbackUrl: `${Tools._DefaultCdnUrl}/draco_encoder.js`,
    };

    /**
     * Returns true if the encoder's `DefaultConfiguration` is available.
     */
    public static get DefaultAvailable(): boolean {
        return _IsConfigurationAvailable(DracoEncoder.DefaultConfiguration);
    }

    protected static _Default: Nullable<DracoEncoder> = null;
    /**
     * Default instance for the DracoEncoder.
     */
    public static get Default(): DracoEncoder {
        DracoEncoder._Default ??= new DracoEncoder();
        return DracoEncoder._Default;
    }

    /**
     * Reset the default DracoEncoder object to null and disposing the removed default instance.
     * Note that if the workerPool is a member of the static DefaultConfiguration object it is recommended not to run dispose,
     * unless the static worker pool is no longer needed.
     * @param skipDispose set to true to not dispose the removed default instance
     */
    public static ResetDefault(skipDispose?: boolean): void {
        if (DracoEncoder._Default) {
            if (!skipDispose) {
                DracoEncoder._Default.dispose();
            }
            DracoEncoder._Default = null;
        }
    }

    protected override _isModuleAvailable(): boolean {
        return typeof DracoEncoderModule !== "undefined";
    }

    protected override async _createModuleAsync(wasmBinary?: ArrayBuffer, jsModule?: unknown /** DracoEncoderModule */): Promise<{ module: unknown /** EncoderModule */ }> {
        const module = await ((jsModule as DracoEncoderModule) || DracoEncoderModule)({ wasmBinary });
        return { module };
    }

    protected override _getWorkerContent(): string {
        return `${EncodeMesh}(${EncoderWorkerFunction})()`;
    }

    /**
     * Creates a new Draco encoder.
     * @param configuration Optional override of the configuration for the DracoEncoder. If not provided, defaults to {@link DracoEncoder.DefaultConfiguration}.
     */
    constructor(configuration: IDracoCodecConfiguration = DracoEncoder.DefaultConfiguration) {
        super(configuration);
    }

    /**
     * @internal
     */
    public async _encodeAsync(
        attributes: Array<IDracoAttributeData>,
        indices: Nullable<Uint16Array | Uint32Array>,
        options?: IDracoEncoderOptions
    ): Promise<Nullable<IDracoEncodedMeshData>> {
        const mergedOptions = options ? deepMerge(DefaultEncoderOptions, options) : DefaultEncoderOptions;

        if (this._workerPoolPromise) {
            const workerPool = await this._workerPoolPromise;
            return new Promise<Nullable<IDracoEncodedMeshData>>((resolve, reject) => {
                workerPool.push((worker, onComplete) => {
                    const onError = (error: ErrorEvent) => {
                        worker.removeEventListener("error", onError);
                        worker.removeEventListener("message", onMessage);
                        reject(error);
                        onComplete();
                    };

                    const onMessage = (message: MessageEvent<EncoderMessage>) => {
                        if (message.data.id === "encodeMeshDone") {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            resolve(message.data.encodedMeshData);
                            onComplete();
                        }
                    };

                    worker.addEventListener("error", onError);
                    worker.addEventListener("message", onMessage);

                    // Build the transfer list. No need to copy, as the data was copied in previous steps.
                    const transferList = [];
                    for (const attribute of attributes) {
                        transferList.push(attribute.data.buffer);
                    }
                    if (indices) {
                        transferList.push(indices.buffer);
                    }

                    worker.postMessage({ id: "encodeMesh", attributes: attributes, indices: indices, options: mergedOptions }, transferList);
                });
            });
        }

        if (this._modulePromise) {
            const encoder = await this._modulePromise;
            return EncodeMesh(encoder.module, attributes, indices, mergedOptions);
        }

        throw new Error("Draco encoder module is not available");
    }

    /**
     * Encodes a mesh or geometry into a Draco-encoded mesh data.
     * @param input the mesh or geometry to encode
     * @param options options for the encoding
     * @returns a promise that resolves to the newly-encoded data
     */
    public async encodeMeshAsync(input: Mesh | Geometry, options?: IDracoEncoderOptions): Promise<Nullable<IDracoEncodedMeshData>> {
        const verticesCount = input.getTotalVertices();
        if (verticesCount == 0) {
            throw new Error("Cannot compress geometry with Draco. There are no vertices.");
        }

        // Prepare parameters for encoding
        if (input instanceof Mesh && input.morphTargetManager && options?.method === "MESH_EDGEBREAKER_ENCODING") {
            Logger.Warn("Cannot use Draco EDGEBREAKER method with morph targets. Falling back to SEQUENTIAL method.");
            options.method = "MESH_SEQUENTIAL_ENCODING";
        }

        const indices = PrepareIndicesForDraco(input);
        const attributes = PrepareAttributesForDraco(input, options?.excludedAttributes);

        return this._encodeAsync(attributes, indices, options);
    }
}
