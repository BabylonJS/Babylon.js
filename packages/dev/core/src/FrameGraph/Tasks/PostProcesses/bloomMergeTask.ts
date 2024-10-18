// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphTextureHandle, FrameGraphRenderPass } from "core/index";
import type { ThinBloomMergePostProcess } from "core/PostProcesses/thinBloomMergePostProcess";
import { FrameGraphThinPostProcessTask } from "./thinPostProcessTask";

export class FrameGraphBloomMergeTask extends FrameGraphThinPostProcessTask {
    public blurTexture: FrameGraphTextureHandle;

    public override readonly postProcess: ThinBloomMergePostProcess;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess: ThinBloomMergePostProcess) {
        super(name, frameGraph, thinPostProcess);
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.blurTexture === undefined) {
            throw new Error(`FrameGraphBloomMergeTask "${this.name}": sourceTexture and blurTexture are required`);
        }

        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "bloomBlur", this.blurTexture);
        });

        pass.useTexture(this.blurTexture);

        return pass;
    }
}
