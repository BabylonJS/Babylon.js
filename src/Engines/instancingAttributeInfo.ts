/**
 * Interface for attribute information associated with buffer instanciation
 */
export interface InstancingAttributeInfo {
    /**
     * Name of the GLSL attribute
     * if attribute index is not specified, this is used to retrieve the index from the effect
     */
    attributeName: string;

    /**
     * Index/offset of the attribute in the vertex shader
     * if not specified, this will be computes from the name.
     */
    index?: number;

    /**
     * size of the attribute, 1, 2, 3 or 4
     */
    attributeSize: number;

    /**
     * Offset of the data in the Vertex Buffer acting as the instancing buffer
     */
    offset: number;

    /**
     * Modifies the rate at which generic vertex attributes advance when rendering multiple instances
     * default to 1
     */
    divisor?: number;

    /**
     * type of the attribute, gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.FIXED, gl.FLOAT.
     * default is FLOAT
     */
    attributeType?: number;

    /**
     * normalization of fixed-point data. behavior unclear, use FALSE, default is FALSE
     */
    normalized?: boolean;
}