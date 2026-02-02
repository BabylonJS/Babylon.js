import type { VertexDataTypedArray } from "core/Buffers/bufferUtils";

/**
 * The available Draco attribute names.
 */
export type DracoAttributeName = "POSITION" | "NORMAL" | "COLOR" | "TEX_COORD" | "GENERIC";

/**
 * Draco encoding method (from EncoderMethod enum in `draco_encoder.ts`).
 */
export type DracoEncoderMethod = "MESH_SEQUENTIAL_ENCODING" | "MESH_EDGEBREAKER_ENCODING";

/**
 * Options for a particular encoding.
 */
export interface IDracoEncoderOptions {
    /**
     * Tune how fast decoding should be (0 = fastest but least compressed, 10 = slowest but most compressed).
     */
    decodeSpeed?: number;
    /**
     * Tune how fast encoding should be (0 = fastest but least compressed, 10 = slowest but most compressed).
     */
    encodeSpeed?: number;
    /**
     * The method to use for encoding the data (EDGEBREAKER or SEQUENTIAL). Defaults to EDGEBREAKER, if possible.
     */
    method?: DracoEncoderMethod;
    /**
     * The number of bits to use for each DRACO attribute kind.
     */
    quantizationBits?: Record<DracoAttributeName, number>;
    /**
     * The list of BABYLON attribute kinds to skip exporting, if present. Defaults to none.
     */
    excludedAttributes?: string[];
}

/**
 * Encoder parameter carrying Babylon attribute data.
 * @internal
 */
export interface IDracoAttributeData {
    /**
     * The kind of the attribute.
     */
    kind: string;
    /**
     * The Draco name for the kind of the attribute.
     */
    dracoName: DracoAttributeName;
    /**
     * The size of the attribute.
     */
    size: number;
    /**
     * The buffer view of the attribute.
     */
    data: VertexDataTypedArray;
}

/**
 * Encoded Draco mesh data.
 * @internal
 */
export interface IDracoEncodedMeshData {
    /**
     * The encoded data.
     */
    data: Int8Array;
    /**
     * A map of Babylon vertex attributes to their Draco unique ids in the encoded data.
     */
    attributeIds: Record<string, number>;
}

interface IEncodeSuccessMessage {
    id: "encodeMeshSuccess";
    encodedMeshData: IDracoEncodedMeshData;
}

interface IEncodeErrorMessage {
    id: "encodeMeshError";
    errorMessage: string;
}

/**
 * @internal
 */
export type EncoderMessage = IEncodeSuccessMessage | IEncodeErrorMessage;
