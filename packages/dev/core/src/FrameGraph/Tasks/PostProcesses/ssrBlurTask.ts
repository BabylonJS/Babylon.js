// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphRenderPass, FrameGraphRenderContext } from "core/index";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { ThinSSRBlurPostProcess } from "core/PostProcesses/thinSSRBlurPostProcess";
import { Vector2 } from "core/Maths/math.vector";

/**
 * @internal
 */
export class FrameGraphSSRBlurTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinSSRBlurPostProcess;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinSSRBlurPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinSSRBlurPostProcess(name, frameGraph.engine, new Vector2(1, 0), 0.03));
    }

    public override record(
        skipCreationOfDisabledPasses = false,
        additionalExecute?: (context: FrameGraphRenderContext) => void,
        additionalBindings?: (context: FrameGraphRenderContext) => void
    ): FrameGraphRenderPass {
        const pass = super.record(skipCreationOfDisabledPasses, additionalExecute, additionalBindings);

        this.postProcess.textureWidth = this._sourceWidth;
        this.postProcess.textureHeight = this._sourceHeight;

        return pass;
    }
}
