import { _GetDefaultNumWorkers, _IsConfigurationAvailable } from "./dracoCodec";
import type { IDracoCodecConfiguration } from "./dracoCodec";
import { DracoDecoder } from "./dracoDecoder";
import type { MeshData } from "./dracoDecoder.types";
import { VertexBuffer } from "../buffer";
import { VertexData } from "../mesh.vertexData";
import type { Nullable } from "core/types";
import type { Geometry } from "../geometry";
import type { BoundingInfo } from "../../Culling/boundingInfo";
import type { Scene } from "../../scene";

/**
 * Configuration for Draco compression
 */
export interface IDracoCompressionConfiguration {
    /**
     * Configuration for the decoder.
     */
    decoder: IDracoCodecConfiguration;
}

/**
 * Options for Draco compression
 */
export interface IDracoCompressionOptions extends Pick<IDracoCodecConfiguration, "numWorkers" | "wasmBinary" | "workerPool"> {}

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
 * By default, the configuration points to a copy of the Draco decoder files for glTF from the babylon.js cdn https://cdn.babylonjs.com/draco_wasm_wrapper_gltf.js.
 * The configuration is shared with the DracoDecoder class.
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
export class DracoCompression {
    private _decoder: DracoDecoder;

    /**
     * The configuration. Defaults to the following urls:
     * - wasmUrl: "https://cdn.babylonjs.com/draco_wasm_wrapper_gltf.js"
     * - wasmBinaryUrl: "https://cdn.babylonjs.com/draco_decoder_gltf.wasm"
     * - fallbackUrl: "https://cdn.babylonjs.com/draco_decoder_gltf.js"
     */
    public static get Configuration(): IDracoCompressionConfiguration {
        return {
            get decoder() {
                return DracoDecoder.DefaultConfiguration;
            },
            set decoder(value: IDracoCodecConfiguration) {
                DracoDecoder.DefaultConfiguration = value;
            },
        };
    }
    public static set Configuration(value: IDracoCompressionConfiguration) {
        DracoDecoder.DefaultConfiguration = value.decoder;
    }

    /**
     * Returns true if the decoder configuration is available.
     */
    public static get DecoderAvailable(): boolean {
        return _IsConfigurationAvailable(DracoDecoder.DefaultConfiguration);
    }

    /**
     * Default number of workers to create when creating the draco compression object.
     */
    public static DefaultNumWorkers = _GetDefaultNumWorkers();

    protected static _Default: Nullable<DracoCompression> = null;
    /**
     * Default instance for the DracoCompression.
     */
    public static get Default(): DracoCompression {
        DracoCompression._Default ??= new DracoCompression();
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
     * Creates a new DracoCompression object.
     * @param numWorkersOrOptions Overrides for the Configuration. Either:
     * - The number of workers for async operations or a config object. Specify `0` to disable web workers and run synchronously in the current context.
     * - An options object
     */
    constructor(numWorkersOrOptions: number | IDracoCompressionOptions = DracoCompression.DefaultNumWorkers) {
        const configuration =
            typeof numWorkersOrOptions === "number"
                ? { ...DracoDecoder.DefaultConfiguration, numWorkers: numWorkersOrOptions }
                : { ...DracoDecoder.DefaultConfiguration, ...numWorkersOrOptions };
        this._decoder = new DracoDecoder(configuration);
    }

    /**
     * Stop all async operations and release resources.
     */
    public dispose(): void {
        this._decoder.dispose();
    }

    /**
     * Returns a promise that resolves when ready. Call this manually to ensure draco compression is ready before use.
     * @returns a promise that resolves when ready
     */
    public async whenReadyAsync(): Promise<void> {
        return await this._decoder.whenReadyAsync();
    }

    /**
     * Decode Draco compressed mesh data to mesh data.
     * @param data The ArrayBuffer or ArrayBufferView for the Draco compression data
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
        return this._decoder.decodeMeshToMeshDataAsync(data, attributes, gltfNormalizedOverride);
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
        return await this._decoder.decodeMeshToGeometryAsync(name, scene, data, attributes);
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
        return await this._decoder._decodeMeshToGeometryForGltfAsync(name, scene, data, attributes, gltfNormalizedOverride, boundingInfo);
    }

    /**
     * Decode Draco compressed mesh data to Babylon vertex data.
     * @param data The ArrayBuffer or ArrayBufferView for the Draco compression data
     * @param attributes A map of attributes from vertex buffer kinds to Draco unique ids
     * @returns A promise that resolves with the decoded vertex data
     * @deprecated Use {@link decodeMeshToGeometryAsync} for better performance in some cases
     */
    public async decodeMeshAsync(data: ArrayBuffer | ArrayBufferView, attributes?: { [kind: string]: number }): Promise<VertexData> {
        const meshData = await this._decoder.decodeMeshToMeshDataAsync(data, attributes);
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
