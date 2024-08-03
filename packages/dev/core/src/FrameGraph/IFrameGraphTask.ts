import type { FrameGraph } from "./frameGraph";

/**
 * Interface used to indicate support for a frame graph task
 */
export interface IFrameGraphTask {
    /**
     * Use this function to add content (render passes, ...) to the task
     * @param frameGraph The frame graph
     * @param buildData The data passed to the build function
     */
    addToFrameGraph(frameGraph: FrameGraph, buildData?: unknown): void;

    /**
     * The function called when executing this task in the frame graph
     * @param frameGraph The frame graph
     */
    executeFrameGraphTask(frameGraph: FrameGraph): void;
}
