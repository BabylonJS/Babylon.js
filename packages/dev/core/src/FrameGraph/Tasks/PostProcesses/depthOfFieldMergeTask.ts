// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphTextureHandle, FrameGraphRenderPass } from "core/index";
import { ThinDepthOfFieldMergePostProcess } from "core/PostProcesses/thinDepthOfFieldMergePostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { Constants } from "../../../Engines/constants";

/**
 * @internal
 */
export class FrameGraphDepthOfFieldMergeTask extends FrameGraphPostProcessTask {
    public circleOfConfusionTexture: FrameGraphTextureHandle;

    public blurSteps: FrameGraphTextureHandle[] = [];

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinDepthOfFieldMergePostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinDepthOfFieldMergePostProcess(name, frameGraph.engine));

        this.onTexturesAllocatedObservable.add((context) => {
            context.setTextureSamplingMode(this.blurSteps[this.blurSteps.length - 1], Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
        });
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.circleOfConfusionTexture === undefined || this.blurSteps.length === 0) {
            throw new Error(`FrameGraphBloomMergeTask "${this.name}": sourceTexture, circleOfConfusionTexture and blurSteps are required`);
        }

        this.postProcess.updateEffect("#define BLUR_LEVEL " + (this.blurSteps.length - 1) + "\n");

        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "circleOfConfusionSampler", this.circleOfConfusionTexture);
            this.blurSteps.forEach((handle, index) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "blurStep" + (this.blurSteps.length - index - 1), handle);
            });
        });

        this._internalDependencies.push(this.circleOfConfusionTexture);
        for (const handle of this.blurSteps) {
            this._internalDependencies.push(handle);
        }

        return pass;
    }
}
