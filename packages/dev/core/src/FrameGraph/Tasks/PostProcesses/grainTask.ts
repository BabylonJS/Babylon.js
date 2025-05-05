import type { FrameGraph } from "core/FrameGraph/frameGraph";
import { ThinGrainPostProcess } from "core/PostProcesses/thinGrainPostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";

/**
 * Task which applies a grain post process.
 */
export class FrameGraphGrainTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinGrainPostProcess;

    /**
     * Constructs a new grain task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the grain effect. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinGrainPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinGrainPostProcess(name, frameGraph.engine));
    }
}
