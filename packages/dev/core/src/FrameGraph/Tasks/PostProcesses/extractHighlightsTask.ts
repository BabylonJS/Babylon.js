import type { FrameGraph } from "core/FrameGraph/frameGraph";
import type { ThinExtractHighlightsPostProcess } from "core/PostProcesses/thinExtractHighlightsPostProcess";
import { FrameGraphThinPostProcessTask } from "./thinPostProcessTask";

export class FrameGraphExtractHighlightsTask extends FrameGraphThinPostProcessTask {
    public override readonly postProcess: ThinExtractHighlightsPostProcess;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess: ThinExtractHighlightsPostProcess) {
        super(name, frameGraph, thinPostProcess);
    }
}
