// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph } from "core/index";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { ThinPassCubePostProcess, ThinPassPostProcess } from "core/PostProcesses/thinPassPostProcess";

/**
 * Task which applies a pass post process.
 */
export class FrameGraphPassTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinPassPostProcess;

    /**
     * Constructs a new pass task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the pass effect. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinPassPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinPassPostProcess(name, frameGraph.engine));
    }
}

/**
 * Task which applies a pass cube post process.
 */
export class FrameGraphPassCubeTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinPassCubePostProcess;

    /**
     * Constructs a new pass cube task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the pass cube effect. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinPassCubePostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinPassCubePostProcess(name, frameGraph.engine));
    }
}
