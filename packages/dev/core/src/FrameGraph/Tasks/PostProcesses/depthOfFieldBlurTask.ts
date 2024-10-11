import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import { Constants } from "core/Engines/constants";
import { FrameGraphBlurTask } from "./blurTask";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { Vector2 } from "core/Maths/math.vector";
import type { PostProcessCoreOptions } from "core/PostProcesses/postProcessCore";

export class FrameGraphDepthOfFieldBlurTask extends FrameGraphBlurTask {
    public circleOfConfusionTexture: FrameGraphTextureHandle;

    public circleOfConfusionSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, direction: Vector2, kernel: number, options?: PostProcessCoreOptions) {
        super(name, frameGraph, engine, direction, kernel, {
            ...options,
            defines: "#define DOF 1\n",
        });
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
