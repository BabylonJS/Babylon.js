import type { NodeGeometryContextualSources } from "../Enums/nodeGeometryContextualSources";

/**
 * Interface used to convey context through execution nodes
 */
export interface INodeGeometryExecutionContext {
    /**
     * Gets the value associated with a contextual source
     * @param source Source of the contextual value
     * @returns the value associated with the source
     */
    getContextualValue(source: NodeGeometryContextualSources): any;
}