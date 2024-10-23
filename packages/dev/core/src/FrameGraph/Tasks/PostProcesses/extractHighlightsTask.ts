import type { FrameGraph } from "core/FrameGraph/frameGraph";
import { ThinExtractHighlightsPostProcess } from "core/PostProcesses/thinExtractHighlightsPostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";

export class FrameGraphExtractHighlightsTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinExtractHighlightsPostProcess;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinExtractHighlightsPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinExtractHighlightsPostProcess(name, frameGraph.engine));
    }
}
