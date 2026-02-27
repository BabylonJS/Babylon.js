/** Alias type for number array or Float32Array */
export type ThreeMfFloatArray = number[] | Float32Array;
/** Alias type for number array or Float32Array or Int32Array or Uint32Array or Uint16Array */
export type ThreeMfIndicesArray = number[] | Int32Array | Uint32Array | Uint16Array;

/**
 * Interface used to define object data independaly of framework
 */
export interface I3mfVertexData {
    /**
     * An array of the x, y, z position of each vertex  [...., x, y, z, .....]
     */
    positions: ThreeMfFloatArray | null;
    /**
     * An array of i, j, k the three vertex indices required for each triangular facet  [...., i, j, k .....]
     */
    indices: ThreeMfIndicesArray | null;
    /**
     * An array of the x, y, z normal vector of each vertex  [...., x, y, z, .....]
     */
    normals?: ThreeMfFloatArray | null;
    /**
     * An array of the r, g, b, a, color of each vertex  [...., r, g, b, a, .....]
     */
    colors?: ThreeMfFloatArray | null;
}

/**
 * interface used to abstact rgb colors from any framework.
 */
export interface I3mfRGBAColor {
    /**
     *
     */
    r: number;
    /**
     *
     */
    g: number;
    /**
     *
     */
    b: number;
    /**
     *
     */
    a?: number;
}
