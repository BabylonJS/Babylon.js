import type { FrameGraph } from "./frameGraph";

/**
 * Interface used to indicate support for the frame graph pass
 */
export interface IFrameGraphPass {
    /**
     * Use this function to add content (render passes, ...) to the pass
     * @param frameGraph The frame graph
     * @param buildData The data passed to the build function
     */
    addToFrameGraph(frameGraph: FrameGraph, buildData?: unknown): void;

    /**
     * The function called when executing this pass in the frame graph
     * @param frameGraph The frame graph
     */
    executeFrameGraphPass(frameGraph: FrameGraph): void;
}
