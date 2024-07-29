import type { FrameGraphBuilder } from "./frameGraphBuilder";

/**
 * Interface used to define the support for the frame graph
 */
export interface IFrameGraphSupport {
    /**
     * Function called when the frame graph is built
     * @param builder The frame graph builder
     * @param buildData The data passed to the build function
     */
    frameGraphBuild(builder: FrameGraphBuilder, buildData?: unknown): void;

    /**
     * The function called by the frame graph during rendering
     * @param builder The frame graph builder
     */
    frameGraphRender(builder: FrameGraphBuilder): void;
}
