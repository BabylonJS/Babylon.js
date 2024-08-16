import type { FrameGraph } from "../frameGraph";
import type { FrameGraphTaskInternals } from "./taskInternals";

export type FrameGraphTaskTexture = string;

/**
 * Interface used to indicate that the class can be used as a task in a frame graph.
 */
export interface IFrameGraphTask {
    /**
     * Use this function to add content (render passes, ...) to the task
     * @param frameGraph The frame graph
     * @param inputData The input data for the task, used to configure the task
     */
    recordFrameGraph(frameGraph: FrameGraph): void;

    isReadyFrameGraph(): boolean;

    name: string;

    disabled: boolean;

    /** @internal */
    _fgInternals?: FrameGraphTaskInternals;
}
