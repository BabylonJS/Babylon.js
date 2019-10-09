/**
 * Interface for attribute information associated with buffer instanciation
 */
export interface InstancingAttributeInfo {
    /**
     * Index/offset of the attribute in the vertex shader
     */
    index: number;

    /**
     * size of the attribute, 1, 2, 3 or 4
     */
    attributeSize: number;

    /**
     * type of the attribute, gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.FIXED, gl.FLOAT.
     * default is FLOAT
     */
    attributeType: number;

    /**
     * normalization of fixed-point data. behavior unclear, use FALSE, default is FALSE
     */
    normalized: boolean;

    /**
     * Offset of the data in the Vertex Buffer acting as the instancing buffer
     */
    offset: number;

    /**
     * Name of the GLSL attribute, for debugging purpose only
     */
    attributeName: string;
}