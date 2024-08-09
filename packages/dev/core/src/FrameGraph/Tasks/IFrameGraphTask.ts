import type { FrameGraph } from "../frameGraph";
import type { Observable } from "core/Misc/observable";
import type { IFrameGraphPass } from "../Passes/IFrameGraphPass";

export interface IFrameGraphInputData {}

export type FrameGraphTaskTexture = [string, string];

/**
 * Interface used to indicate that the class can be used as a task in a frame graph.
 */
export interface IFrameGraphTask {
    /**
     * Use this function to add content (render passes, ...) to the task
     * @param frameGraph The frame graph
     * @param inputData The input data for the task, used to configure the task
     */
    recordFrameGraph(frameGraph: FrameGraph, inputData?: unknown): void;

    name: string;

    onBeforeTaskRecordFrameGraphObservable?: Observable<FrameGraph>;

    onAfterTaskRecordFrameGraphObservable?: Observable<FrameGraph>;

    disabledFromGraph?: boolean;

    /** @internal */
    _passes?: IFrameGraphPass[];
}
