import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import type { DepthOfFieldMergePostProcess } from "core/PostProcesses/depthOfFieldMergePostProcess";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";

export class FrameGraphDepthOfFieldMergeTask extends FrameGraphPostProcessTask {
    public circleOfConfusionTexture: FrameGraphTextureHandle;

    public blurSteps: FrameGraphTextureHandle[] = [];

    protected override _postProcess: DepthOfFieldMergePostProcess;

    constructor(name: string, frameGraph: FrameGraph, depthOfFieldMergePostProcess: DepthOfFieldMergePostProcess) {
        super(name, frameGraph, depthOfFieldMergePostProcess);
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.circleOfConfusionTexture === undefined || this.blurSteps.length === 0) {
            throw new Error(`FrameGraphBloomMergeTask "${this.name}": sourceTexture, circleOfConfusionTexture and blurSteps are required`);
        }

        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "circleOfConfusionSampler", this.circleOfConfusionTexture);
            this.blurSteps.forEach((handle, index) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "blurStep" + (this.blurSteps.length - index - 1), handle);
            });
        });

        pass.useTexture(this.circleOfConfusionTexture);
        for (const handle of this.blurSteps) {
            pass.useTexture(handle);
        }

        return pass;
    }
}
