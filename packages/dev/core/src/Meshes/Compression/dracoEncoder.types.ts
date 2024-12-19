import type { Nullable } from "core/types";

/**
 * The available Draco attribute names.
 */
export enum DracoAttributeName {
    POSITION = "POSITION",
    NORMAL = "NORMAL",
    COLOR = "COLOR",
    TEX_COORD = "TEX_COORD",
    GENERIC = "GENERIC",
}

/**
 * Draco encoding method (from EncoderMethod enum in `draco_encoder.ts`).
 */
export enum DracoEncoderMethod {
    /**
     * Lower compression, but preserves the order of vertices.
     */
    SEQUENTIAL = "MESH_SEQUENTIAL_ENCODING",
    /**
     * Higher compression, but changes the order of vertices.
     * NOTE: This will not work with morph targets.
     */
    EDGEBREAKER = "MESH_EDGEBREAKER_ENCODING",
}

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
    quantizationBits?: { [key: string /**DracoAttributeName*/]: number };
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
     * The Babylon kind of the attribute.
     */
    babylonAttribute: string;
    /**
     * The Draco kind to use for the attribute.
     */
    dracoAttribute: DracoAttributeName;
    /**
     * The size of the attribute.
     */
    size: number;
    /**
     * The buffer view of the attribute.
     */
    data: Float32Array;
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
    attributeIDs: { [kind: string]: number };
}

/**
 * @internal
 */
interface EncodeDoneMessage {
    id: "encodeMeshDone";
    encodedMeshData: Nullable<IDracoEncodedMeshData>;
}

/**
 * @internal
 */
export type EncoderMessage = EncodeDoneMessage;
