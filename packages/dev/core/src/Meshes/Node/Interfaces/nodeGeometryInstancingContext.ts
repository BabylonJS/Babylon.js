/**
 * Interface used to convey instancing context through execution nodes
 */
export interface INodeGeometryInstancingContext {
    /**
     * Gets the current instance index in the current flow
     * @returns the current index
     */
    getInstanceIndex(): number;
}
