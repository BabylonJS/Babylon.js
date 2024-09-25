import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureId } from "../../frameGraphTypes";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import type { DepthOfFieldMergePostProcess } from "core/PostProcesses/depthOfFieldMergePostProcess";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";

export class FrameGraphDepthOfFieldMergeTask extends FrameGraphPostProcessTask {
    public circleOfConfusionTexture: FrameGraphTextureId;

    public blurSteps: FrameGraphTextureId[] = [];

    protected override _postProcess: DepthOfFieldMergePostProcess;

    constructor(name: string, depthOfFieldMergePostProcess: DepthOfFieldMergePostProcess) {
        super(name, depthOfFieldMergePostProcess);
    }

    public override record(frameGraph: FrameGraph, skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.circleOfConfusionTexture === undefined || this.blurSteps.length === 0) {
            throw new Error(`FrameGraphBloomMergeTask "${this.name}": sourceTexture, circleOfConfusionTexture and blurSteps are required`);
        }

        const circleOfConfusionTextureHandle = frameGraph.getTextureHandle(this.circleOfConfusionTexture);
        const blurStepsHandles = this.blurSteps.map((textureId) => frameGraph.getTextureHandle(textureId));

        const pass = super.record(frameGraph, skipCreationOfDisabledPasses, undefined, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "circleOfConfusionSampler", circleOfConfusionTextureHandle);
            blurStepsHandles.forEach((handle, index) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "blurStep" + (blurStepsHandles.length - index - 1), handle);
            });
        });

        pass.useTexture(circleOfConfusionTextureHandle);
        for (const handle of blurStepsHandles) {
            pass.useTexture(handle);
        }

        return pass;
    }
}
