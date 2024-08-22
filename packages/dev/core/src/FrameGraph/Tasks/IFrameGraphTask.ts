import type { FrameGraph } from "../frameGraph";
import type { FrameGraphTaskInternals } from "./taskInternals";

export type FrameGraphTaskOutputReference = [IFrameGraphTask, string];

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

    /**
     * Indicates whether the task should execute the disabled or normal path passes.
     * If disabled is undefined (default), this indicates that the task is always enabled and cannot be disabled, which will allow better management of GPU memory at build time.
     * If you wish to activate/deactivate a task at will without having to rebuild the entire frame graph, set disabled to false before building the graph.
     */
    disabled?: boolean;

    /** @internal */
    _fgInternals?: FrameGraphTaskInternals;
}
