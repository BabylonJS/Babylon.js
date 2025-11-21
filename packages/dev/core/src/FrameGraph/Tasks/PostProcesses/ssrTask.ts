import type { FrameGraph, FrameGraphRenderPass, Camera, FrameGraphTextureHandle } from "core/index";
import { Constants } from "core/Engines/constants";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { ThinSSRPostProcess } from "core/PostProcesses/thinSSRPostProcess";

/**
 * @internal
 */
export class FrameGraphSSRTask extends FrameGraphPostProcessTask {
    public normalTexture: FrameGraphTextureHandle;

    public depthTexture: FrameGraphTextureHandle;

    public reflectivityTexture: FrameGraphTextureHandle;

    public backDepthTexture?: FrameGraphTextureHandle;

    public camera: Camera;

    public override readonly postProcess: ThinSSRPostProcess;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinSSRPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinSSRPostProcess(name, frameGraph.scene));
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (
            this.sourceTexture === undefined ||
            this.normalTexture === undefined ||
            this.depthTexture === undefined ||
            this.reflectivityTexture === undefined ||
            this.camera === undefined
        ) {
            throw new Error(`FrameGraphSSRTask "${this.name}": sourceTexture, normalTexture, depthTexture, reflectivityTexture and camera are required`);
        }

        const pass = super.record(
            skipCreationOfDisabledPasses,
            (context) => {
                this.postProcess.camera = this.camera;

                context.setTextureSamplingMode(this.normalTexture, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
                context.setTextureSamplingMode(this.depthTexture, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
                context.setTextureSamplingMode(this.reflectivityTexture, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
                if (this.backDepthTexture) {
                    context.setTextureSamplingMode(this.backDepthTexture, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
                }
            },
            (context) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "normalSampler", this.normalTexture);
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "depthSampler", this.depthTexture);
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "reflectivitySampler", this.reflectivityTexture);
                if (this.backDepthTexture) {
                    context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "backDepthSampler", this.backDepthTexture);
                }
                if (this.postProcess.enableAutomaticThicknessComputation) {
                    this._postProcessDrawWrapper.effect!.setFloat("backSizeFactor", 1);
                }
            }
        );

        pass.addDependencies([this.normalTexture, this.depthTexture, this.reflectivityTexture]);

        this.postProcess.textureWidth = this._sourceWidth;
        this.postProcess.textureHeight = this._sourceHeight;

        return pass;
    }
}
