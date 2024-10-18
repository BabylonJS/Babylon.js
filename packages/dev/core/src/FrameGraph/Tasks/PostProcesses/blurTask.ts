// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphRenderContext, FrameGraphRenderPass } from "core/index";
import type { ThinBlurPostProcess } from "core/PostProcesses/thinBlurPostProcess";
import { FrameGraphThinPostProcessTask } from "./thinPostProcessTask";

export class FrameGraphBlurTask extends FrameGraphThinPostProcessTask {
    public override readonly postProcess: ThinBlurPostProcess;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess: ThinBlurPostProcess) {
        super(name, frameGraph, thinPostProcess);
    }

    public override record(
        skipCreationOfDisabledPasses = false,
        additionalExecute?: (context: FrameGraphRenderContext) => void,
        additionalBindings?: (context: FrameGraphRenderContext) => void
    ): FrameGraphRenderPass {
        const pass = super.record(skipCreationOfDisabledPasses, additionalExecute, additionalBindings);

        this.postProcess.textureWidth = this._outputWidth;
        this.postProcess.textureHeight = this._outputHeight;

        return pass;
    }
}
