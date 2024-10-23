import type { FrameGraph } from "core/FrameGraph/frameGraph";
import { ThinBlackAndWhitePostProcess } from "core/PostProcesses/thinBlackAndWhitePostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";

export class FrameGraphBlackAndWhiteTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinBlackAndWhitePostProcess;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinBlackAndWhitePostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinBlackAndWhitePostProcess(name, frameGraph.engine));
    }
}
