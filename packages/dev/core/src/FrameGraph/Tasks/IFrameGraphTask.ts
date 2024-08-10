import type { FrameGraph } from "../frameGraph";
import type { Observable } from "core/Misc/observable";
import type { IFrameGraphPass } from "../Passes/IFrameGraphPass";
import type { TextureHandle } from "../frameGraphTextureManager";

export interface IFrameGraphInputData {}

export type FrameGraphTaskTexture = [string, string];

/** @internal */
export interface IFrameGraphTaskInternals {
    passes: IFrameGraphPass[];
    passesDisabled: IFrameGraphPass[];
    inputData?: IFrameGraphInputData;
    outputTexture?: TextureHandle;
    outputTextureWhenEnabled?: TextureHandle;
    outputTextureWhenDisabled?: TextureHandle;
    wasDisabled: boolean;
}

/**
 * Interface used to indicate that the class can be used as a task in a frame graph.
 */
export interface IFrameGraphTask {
    /**
     * Use this function to add content (render passes, ...) to the task
     * @param frameGraph The frame graph
     * @param inputData The input data for the task, used to configure the task
     */
    recordFrameGraph(frameGraph: FrameGraph, inputData?: IFrameGraphInputData): void;

    name: string;

    disabledFromGraph: boolean;

    onBeforeTaskRecordFrameGraphObservable?: Observable<FrameGraph>;

    onAfterTaskRecordFrameGraphObservable?: Observable<FrameGraph>;

    /** @internal */
    _frameGraphInternals?: IFrameGraphTaskInternals;
}
