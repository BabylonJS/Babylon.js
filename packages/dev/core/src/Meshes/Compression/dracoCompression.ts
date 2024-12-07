import { _GetDefaultNumWorkers } from "./dracoCodec";
import type { IDracoCodecConfiguration } from "./dracoCodec";
import { DracoDecoder } from "./dracoDecoder";
import { VertexBuffer } from "../buffer";
import { VertexData } from "../mesh.vertexData";

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
export class DracoCompression extends DracoDecoder {
    /**
     * The configuration. Defaults to the following urls:
     * - wasmUrl: "https://cdn.babylonjs.com/draco_wasm_wrapper_gltf.js"
     * - wasmBinaryUrl: "https://cdn.babylonjs.com/draco_decoder_gltf.wasm"
     * - fallbackUrl: "https://cdn.babylonjs.com/draco_decoder_gltf.js"
     */
    public static Configuration: IDracoCompressionConfiguration = {
        decoder: DracoDecoder.Config, // TODO: Remove this reference or update the JSDoc with warning.
    };

    /**
     * Returns true if the decoder configuration is available.
     */
    public static get DecoderAvailable(): boolean {
        return DracoDecoder.Available; // TODO: Remove this reference or update the JSDoc with warning.
    }

    /**
     * Default number of workers to create when creating the draco compression object.
     */
    public static DefaultNumWorkers = _GetDefaultNumWorkers();

    /**
     * Constructor
     * @param numWorkersOrConfig The number of workers for async operations or a config object. Specify `0` to disable web workers and run synchronously in the current context.
     */
    constructor(numWorkersOrConfig: number | IDracoCompressionOptions = DracoCompression.DefaultNumWorkers) {
        const config = typeof numWorkersOrConfig === "number" ? { ...DracoDecoder.Config, numWorkers: numWorkersOrConfig } : { ...DracoDecoder.Config, ...numWorkersOrConfig };
        super(config);
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
