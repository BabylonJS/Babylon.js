import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import { Constants } from "core/Engines/constants";
import { FrameGraphBlurTask } from "./blurTask";
import type { ThinDepthOfFieldBlurPostProcess } from "core/PostProcesses/thinDepthOfFieldBlurPostProcess";

export class FrameGraphDepthOfFieldBlurTask extends FrameGraphBlurTask {
    public circleOfConfusionTexture: FrameGraphTextureHandle;

    public circleOfConfusionSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess: ThinDepthOfFieldBlurPostProcess) {
        super(name, frameGraph, thinPostProcess);
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
