import type { FrameGraph } from "core/FrameGraph/frameGraph";
import { ThinTonemapPostProcess } from "core/PostProcesses/thinTonemapPostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";

/**
 * Task which applies a tonemap post process.
 */
export class FrameGraphTonemapTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinTonemapPostProcess;

    /**
     * Constructs a new tonemap task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the tonemap effect. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinTonemapPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinTonemapPostProcess(name, frameGraph.engine));
    }
}
