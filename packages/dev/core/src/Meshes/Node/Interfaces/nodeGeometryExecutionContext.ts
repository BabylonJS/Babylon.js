import type { NodeGeometryContextualSources } from "../Enums/nodeGeometryContextualSources";

/**
 * Interface used to convey context through execution nodes
 */
export interface INodeGeometryExecutionContext {
    /**
     * Gets the current index in the current flow
     * @returns the current index
     */
    getExecutionIndex(): number;
    /**
     * Gets the current face index in the current flow
     * @returns the current face index
     */
    getExecutionFaceIndex(): number;

    /**
     * Gets the value associated with a contextual source
     * @param source Source of the contextual value
     * @returns the value associated with the source
     */
    getOverrideContextualValue?(source: NodeGeometryContextualSources): any;
}
