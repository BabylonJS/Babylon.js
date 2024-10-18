import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import { FrameGraphThinPostProcessTask } from "./thinPostProcessTask";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import type { Camera } from "core/Cameras/camera";
import { Constants } from "core/Engines/constants";
import type { ThinCircleOfConfusionPostProcess } from "core/PostProcesses/thinCircleOfConfusionPostProcess";

export class FrameGraphCircleOfConfusionTask extends FrameGraphThinPostProcessTask {
    public depthTexture: FrameGraphTextureHandle; // should store camera space depth (Z coordinate)

    public depthSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public camera: Camera;

    public override readonly postProcess: ThinCircleOfConfusionPostProcess;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess: ThinCircleOfConfusionPostProcess) {
        super(name, frameGraph, thinPostProcess);
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphCircleOfConfusionTask "${this.name}": sourceTexture, depthTexture and camera are required`);
        }

        const pass = super.record(
            skipCreationOfDisabledPasses,
            (context) => {
                context.setTextureSamplingMode(this.depthTexture, this.depthSamplingMode);
            },
            (context) => {
                this.postProcess.camera = this.camera;
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "depthSampler", this.depthTexture);
            }
        );

        pass.useTexture(this.depthTexture);

        return pass;
    }
}
