import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureId } from "../../frameGraphTypes";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import { Constants } from "core/Engines/constants";
import type { DepthOfFieldBlurPostProcess } from "core/PostProcesses/depthOfFieldBlurPostProcess";

export class FrameGraphDepthOfFieldBlurTask extends FrameGraphPostProcessTask {
    public circleOfConfusionTexture: FrameGraphTextureId;

    public circleOfConfusionSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    protected override _postProcess: DepthOfFieldBlurPostProcess;

    constructor(name: string, depthOfFieldBlurPostProcess: DepthOfFieldBlurPostProcess) {
        super(name, depthOfFieldBlurPostProcess);
    }

    public override record(frameGraph: FrameGraph, skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.circleOfConfusionTexture === undefined) {
            throw new Error(`DepthOfFieldBlurPostProcess "${this.name}": sourceTexture and circleOfConfusionTexture are required`);
        }

        const cocTextureHandle = frameGraph.getTextureHandle(this.circleOfConfusionTexture);

        const pass = super.record(
            frameGraph,
            skipCreationOfDisabledPasses,
            (context) => {
                context.setTextureSamplingMode(cocTextureHandle, this.circleOfConfusionSamplingMode);
            },
            (context) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "circleOfConfusionSampler", cocTextureHandle);
            }
        );

        pass.useTexture(cocTextureHandle);

        return pass;
    }
}
