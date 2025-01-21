/**
 * Decoded Draco mesh data.
 */
export interface MeshData {
    /**
     * The indices of the mesh. Point clouds will not have indices.
     */
    indices?: Uint16Array | Uint32Array;
    /**
     * The attributes of the mesh.
     */
    attributes: Array<AttributeData>;
    /**
     * The total number of vertices in the mesh.
     */
    totalVertices: number;
}

/**
 * @internal
 */
export interface AttributeData {
    kind: string;
    data: ArrayBufferView;
    size: number;
    byteOffset: number;
    byteStride: number;
    normalized: boolean;
}

/**
 * @internal
 */
export interface DecodeMeshDoneMessage {
    id: "decodeMeshDone";
    totalVertices: number;
}

/**
 * @internal
 */
export interface IndicesMessage {
    id: "indices";
    data: Uint16Array | Uint32Array;
}

/**
 * @internal
 */
export interface AttributeMessage extends AttributeData {
    id: "attribute";
}

/**
 * @internal
 */
export type DecoderMessage = DecodeMeshDoneMessage | IndicesMessage | AttributeMessage;
