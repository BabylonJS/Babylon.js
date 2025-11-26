import type { FrameGraph } from "core/FrameGraph/frameGraph";
import { ThinFilterPostProcess } from "core/PostProcesses/thinFilterPostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";

/**
 * Task which applies a kernel filter post process.
 */
export class FrameGraphFilterTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinFilterPostProcess;

    /**
     * Constructs a new filter task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the filter effect. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinFilterPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinFilterPostProcess(name, frameGraph.engine));
    }
}
