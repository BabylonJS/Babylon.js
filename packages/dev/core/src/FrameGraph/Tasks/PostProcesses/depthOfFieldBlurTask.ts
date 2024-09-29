import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import { Constants } from "core/Engines/constants";
import type { DepthOfFieldBlurPostProcess } from "core/PostProcesses/depthOfFieldBlurPostProcess";

export class FrameGraphDepthOfFieldBlurTask extends FrameGraphPostProcessTask {
    public circleOfConfusionTexture: FrameGraphTextureHandle;

    public circleOfConfusionSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    protected override _postProcess: DepthOfFieldBlurPostProcess;

    constructor(name: string, frameGraph: FrameGraph, depthOfFieldBlurPostProcess: DepthOfFieldBlurPostProcess) {
        super(name, frameGraph, depthOfFieldBlurPostProcess);
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.circleOfConfusionTexture === undefined) {
            throw new Error(`FrameGraphDepthOfFieldBlurTask "${this.name}": sourceTexture and circleOfConfusionTexture are required`);
        }

        const pass = super.record(
            skipCreationOfDisabledPasses,
            (context) => {
                context.setTextureSamplingMode(this.circleOfConfusionTexture, this.circleOfConfusionSamplingMode);
            },
            (context) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "circleOfConfusionSampler", this.circleOfConfusionTexture);
            }
        );

        pass.useTexture(this.circleOfConfusionTexture);

        return pass;
    }
}
