/**
 * Interface used to convey context through execution nodes
 */
export interface INodeGeometryExecutionContext {
    /**
     * Gets the current index in the current flow
     * @returns the current index
     */
    getExecutionIndex(): number;
}
