/**
 * Interface representing a draw context at the GPU level (draw call)
 */
export interface IDrawContext {
    /**
     * Unique identifier for the draw context.
     */
    uniqueId: number;
    /**
     * True if instances are used in the draw calls
     */
    useInstancing: boolean;
    /**
     * Indicates if the draw should be an indirect draw.
     */
    enableIndirectDraw: boolean;
    /**
     * Buffer used for the indirect draw call when enableIndirectDraw is true.
     */
    indirectDrawBuffer?: GPUBuffer;

    /**
     * Data for the indirect draw call (only used when enableIndirectDraw is true).
     * @param indexOrVertexCount - The number of indices (if indexed draw) or vertices (if non-indexed draw).
     * @param instanceCount - The number of instances to draw.
     * @param firstIndexOrVertex - The index (if indexed draw) or vertex (if non-indexed draw) offset to start drawing from.
     * @param forceUpdate - If true, forces the update of the indirect draw data even if instanceCount is the same as in the previous call.
     */
    setIndirectData(indexOrVertexCount: number, instanceCount: number, firstIndexOrVertex: number, forceUpdate?: boolean): void;
    /**
     * Resets the draw context to its initial state.
     */
    reset(): void;
    /**
     * Disposes the draw context and its resources.
     */
    dispose(): void;
}
