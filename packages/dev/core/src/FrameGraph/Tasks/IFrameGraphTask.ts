import type { Nullable } from "core/types";
import type { FrameGraph } from "../frameGraph";
import type { Observable } from "core/Misc/observable";

export interface IFrameGraphInputData {}

export type FrameGraphTaskTexture = [Nullable<string>, string];

/**
 * Interface used to indicate support for a frame graph task
 */
export interface IFrameGraphTask {
    /**
     * Use this function to add content (render passes, ...) to the task
     * @param frameGraph The frame graph
     */
    addToFrameGraph(frameGraph: FrameGraph, inputData?: unknown): void;

    name: string;

    onBeforeTaskAddedToFrameGraphObservable?: Observable<FrameGraph>;

    onAfterTaskAddedToFrameGraphObservable?: Observable<FrameGraph>;

    executeCondition?: () => boolean;
}
