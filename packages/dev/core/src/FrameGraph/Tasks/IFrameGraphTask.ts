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
     */
    recordFrameGraph(frameGraph: FrameGraph): void;

    isReadyFrameGraph(): boolean;

    disposeFrameGraph(): void;

    name: string;

    disabled: boolean;

    /** @internal */
    _fgInternals?: FrameGraphTaskInternals;
}
