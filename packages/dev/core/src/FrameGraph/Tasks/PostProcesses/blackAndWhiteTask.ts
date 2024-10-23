import type { FrameGraph } from "core/FrameGraph/frameGraph";
import { ThinBlackAndWhitePostProcess } from "core/PostProcesses/thinBlackAndWhitePostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";

/**
 * Task which applies a black and white post process.
 */
export class FrameGraphBlackAndWhiteTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinBlackAndWhitePostProcess;

    /**
     * Constructs a new black and white task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the black and white effect. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinBlackAndWhitePostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinBlackAndWhitePostProcess(name, frameGraph.engine));
    }
}
