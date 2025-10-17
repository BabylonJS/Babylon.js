import type { FrameGraph, FrameGraphRenderPass, Camera, FrameGraphTextureHandle } from "core/index";
import { Constants } from "core/Engines/constants";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { ThinSSAO2PostProcess } from "core/PostProcesses/thinSSAO2PostProcess";

/**
 * @internal
 */
export class FrameGraphSSAO2Task extends FrameGraphPostProcessTask {
    public depthTexture: FrameGraphTextureHandle;

    public normalTexture: FrameGraphTextureHandle;

    public camera: Camera;

    public override readonly postProcess: ThinSSAO2PostProcess;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinSSAO2PostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinSSAO2PostProcess(name, frameGraph.scene));
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.normalTexture === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphSSAO2Task "${this.name}": sourceTexture, depthTexture, normalTexture and camera are required`);
        }

        const pass = super.record(
            skipCreationOfDisabledPasses,
            (context) => {
                this.postProcess.camera = this.camera;

                context.setTextureSamplingMode(this.depthTexture, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
                context.setTextureSamplingMode(this.normalTexture, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
            },
            (context) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "depthSampler", this.depthTexture);
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "normalSampler", this.normalTexture);
            }
        );

        pass.addDependencies([this.depthTexture]);

        this.postProcess.textureWidth = this._sourceWidth;
        this.postProcess.textureHeight = this._sourceHeight;

        return pass;
    }
}
