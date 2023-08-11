/**
 * Interface used to convey context through execution nodes
 */
export interface INodeGeometryExecutionContext {
    /**
     * Gets the current vertex index in the current flow
     * @returns the current index
     */
    getExecutionIndex(): number;
    /**
     * Gets the current face index in the current flow
     * @returns the current face index
     */
    getExecutionFaceIndex(): number;

    /**
     * Gets the value associated with a contextual positions
     * @returns the value associated with the source
     */
    getOverridePositionsContextualValue?(): any;

    /**
     * Gets the value associated with a contextual normals
     * @returns the value associated with the source
     */
    getOverrideNormalsContextualValue?(): any;
}
