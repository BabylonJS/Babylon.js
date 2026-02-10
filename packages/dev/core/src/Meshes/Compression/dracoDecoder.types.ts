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
    /** @internal */
    kind: string;
    /** @internal */
    data: ArrayBufferView;
    /** @internal */
    size: number;
    /** @internal */
    byteOffset: number;
    /** @internal */
    byteStride: number;
    /** @internal */
    normalized: boolean;
}

/**
 * @internal
 */
export interface IDecodeMeshDoneMessage {
    /** @internal */
    id: "decodeMeshDone";
    /** @internal */
    totalVertices: number;
}

/**
 * @internal
 */
export interface IIndicesMessage {
    /** @internal */
    id: "indices";
    /** @internal */
    data: Uint16Array | Uint32Array;
}

/**
 * @internal
 */
export interface IAttributeMessage extends IAttributeData {
    /** @internal */
    id: "attribute";
}

/**
 * @internal
 */
export type DecoderMessage = IDecodeMeshDoneMessage | IIndicesMessage | IAttributeMessage;
