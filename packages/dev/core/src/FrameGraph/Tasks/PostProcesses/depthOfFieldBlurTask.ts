import type { FrameGraph, FrameGraphTextureHandle, FrameGraphRenderPass } from "core/index";
import { Constants } from "core/Engines/constants";
import { FrameGraphBlurTask } from "./blurTask";
import { ThinDepthOfFieldBlurPostProcess } from "core/PostProcesses/thinDepthOfFieldBlurPostProcess";
import { Vector2 } from "core/Maths/math.vector";

/**
 * @internal
 */
export class FrameGraphDepthOfFieldBlurTask extends FrameGraphBlurTask {
    public circleOfConfusionTexture: FrameGraphTextureHandle;

    public circleOfConfusionSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinDepthOfFieldBlurPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinDepthOfFieldBlurPostProcess(name, frameGraph.engine, new Vector2(1, 0), 10));
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

        pass.addDependencies(this.circleOfConfusionTexture);

        return pass;
    }
}
