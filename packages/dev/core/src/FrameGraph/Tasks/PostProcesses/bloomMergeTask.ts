import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import type { BloomMergePostProcess } from "../../../PostProcesses/bloomMergePostProcess";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";

export class FrameGraphBloomMergeTask extends FrameGraphPostProcessTask {
    public blurTexture: FrameGraphTextureHandle;

    protected override _postProcess: BloomMergePostProcess;

    constructor(name: string, frameGraph: FrameGraph, bloomMergePostProcess: BloomMergePostProcess) {
        super(name, frameGraph, bloomMergePostProcess);
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.blurTexture === undefined) {
            throw new Error(`FrameGraphBloomMergeTask "${this.name}": sourceTexture and blurTexture are required`);
        }

        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "bloomBlur", this.blurTexture);
            this._postProcessDrawWrapper.effect!.setFloat("bloomWeight", this._postProcess.weight);
        });

        pass.useTexture(this.blurTexture);

        return pass;
    }
}
