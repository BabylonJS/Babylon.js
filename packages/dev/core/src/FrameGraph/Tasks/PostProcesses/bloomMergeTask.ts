import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureId } from "../../frameGraphTypes";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import type { BloomMergePostProcess } from "../../../PostProcesses/bloomMergePostProcess";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";

export class FrameGraphBloomMergeTask extends FrameGraphPostProcessTask {
    public blurTexture: FrameGraphTextureId;

    protected override _postProcess: BloomMergePostProcess;

    constructor(name: string, bloomMergePostProcess: BloomMergePostProcess) {
        super(name, bloomMergePostProcess);
    }

    public override recordFrameGraph(frameGraph: FrameGraph, skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.blurTexture === undefined) {
            throw new Error(`BloomMergePostProcess "${this.name}": sourceTexture and blurTexture are required`);
        }

        const blurTextureHandle = frameGraph.getTextureHandle(this.blurTexture);

        const pass = super.recordFrameGraph(frameGraph, skipCreationOfDisabledPasses, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "bloomBlur", blurTextureHandle);
            this._postProcessDrawWrapper.effect!.setFloat("bloomWeight", this._postProcess.weight);
        });

        pass.useTexture(blurTextureHandle);

        return pass;
    }
}
