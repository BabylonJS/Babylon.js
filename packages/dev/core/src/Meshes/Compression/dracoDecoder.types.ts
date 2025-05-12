/**
 * Decoded Draco mesh data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface MeshData {
    /**
     * The indices of the mesh. Point clouds will not have indices.
     */
    indices?: Uint16Array | Uint32Array;
    /**
     * The attributes of the mesh.
     */
    attributes: Array<IAttributeData>;
    /**
     * The total number of vertices in the mesh.
     */
    totalVertices: number;
}

/**
 * @internal
 */
export interface IAttributeData {
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
export interface IDecodeMeshDoneMessage {
    id: "decodeMeshDone";
    totalVertices: number;
}

/**
 * @internal
 */
export interface IIndicesMessage {
    id: "indices";
    data: Uint16Array | Uint32Array;
}

/**
 * @internal
 */
export interface IAttributeMessage extends IAttributeData {
    id: "attribute";
}

/**
 * @internal
 */
export type DecoderMessage = IDecodeMeshDoneMessage | IIndicesMessage | IAttributeMessage;
