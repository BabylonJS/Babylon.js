import type { FrameGraph, FrameGraphRenderPass, FrameGraphTextureHandle } from "core/index";
import { Constants } from "core/Engines/constants";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { ThinSSAO2BlurPostProcess } from "core/PostProcesses/thinSSAO2BlurPostProcess";

/**
 * @internal
 */
export class FrameGraphSSAO2BlurTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinSSAO2BlurPostProcess;

    public depthTexture: FrameGraphTextureHandle;

    constructor(
        name: string,
        frameGraph: FrameGraph,
        private _isHorizontal: boolean,
        thinPostProcess?: ThinSSAO2BlurPostProcess
    ) {
        super(name, frameGraph, thinPostProcess || new ThinSSAO2BlurPostProcess(name, frameGraph.engine, _isHorizontal));
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.depthTexture === undefined) {
            throw new Error(`FrameGraphSSAO2BlurTask "${this.name}": sourceTexture and depthTexture are required`);
        }

        const pass = super.record(
            skipCreationOfDisabledPasses,
            (context) => {
                context.setTextureSamplingMode(this.depthTexture, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
            },
            (context) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "depthSampler", this.depthTexture);
            }
        );

        this.postProcess.textureSize = this._isHorizontal ? this._outputWidth : this._outputHeight;

        return pass;
    }
}
