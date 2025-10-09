import type { FrameGraph, EffectWrapperCreationOptions, Observable, Effect } from "core/index";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { ThinCustomPostProcess } from "../../../PostProcesses/thinCustomPostProcess";

/**
 * Task which applies a custom post process.
 */
export class FrameGraphCustomPostProcessTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinCustomPostProcess;

    /**
     * Observable triggered when bind is called for the post process.
     * Use this to set custom uniforms.
     */
    public onApplyObservable: Observable<Effect>;

    /**
     * Constructs a new custom post process task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param options Options to configure the post process
     */
    constructor(name: string, frameGraph: FrameGraph, options: EffectWrapperCreationOptions) {
        super(name, frameGraph, new ThinCustomPostProcess(name, frameGraph.engine, options));

        this.onApplyObservable = this.postProcess.onBindObservable;
    }
}
