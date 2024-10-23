// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphRenderContext, FrameGraphRenderPass } from "core/index";
import { ThinBlurPostProcess } from "core/PostProcesses/thinBlurPostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { Vector2 } from "core/Maths/math.vector";

export class FrameGraphBlurTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinBlurPostProcess;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinBlurPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinBlurPostProcess(name, frameGraph.engine, new Vector2(1, 0), 10));
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
