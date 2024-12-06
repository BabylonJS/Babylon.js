import { GetDefaultNumWorkers, type IDracoCodecConfiguration } from "./dracoCodec";
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
 * @deprecated Use {@link DracoDecoder} instead.
 */
export class DracoCompression extends DracoDecoder {
    /**
     * The configuration for the Draco compression.
     * WARNING: This is a reference to `DracoDecoder.Config`.
     */
    public static Configuration: IDracoCompressionConfiguration = {
        decoder: DracoDecoder.Config,
    };

    /**
     * Returns true if the decoder configuration is available.
     * WARNING: This is a reference to `DracoDecoder.Available`.
     */
    public static get DecoderAvailable(): boolean {
        return DracoDecoder.Available;
    }

    /**
     * Default number of workers to create when creating the draco compression object.
     */
    public static DefaultNumWorkers = GetDefaultNumWorkers();

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
