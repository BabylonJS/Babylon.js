import type { FrameGraph } from "core/FrameGraph/frameGraph";
import type { ThinBlackAndWhitePostProcess } from "core/PostProcesses/thinBlackAndWhitePostProcess";
import { FrameGraphThinPostProcessTask } from "./thinPostProcessTask";

export class FrameGraphBlackAndWhiteTask extends FrameGraphThinPostProcessTask {
    public override readonly postProcess: ThinBlackAndWhitePostProcess;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess: ThinBlackAndWhitePostProcess) {
        super(name, frameGraph, thinPostProcess);
    }
}
