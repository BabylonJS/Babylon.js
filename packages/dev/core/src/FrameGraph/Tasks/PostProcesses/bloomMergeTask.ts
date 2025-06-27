import type { FrameGraph, FrameGraphTextureHandle, FrameGraphRenderPass } from "core/index";
import { ThinBloomMergePostProcess } from "core/PostProcesses/thinBloomMergePostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";

/**
 * @internal
 */
export class FrameGraphBloomMergeTask extends FrameGraphPostProcessTask {
    public blurTexture: FrameGraphTextureHandle;

    public override readonly postProcess: ThinBloomMergePostProcess;

    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinBloomMergePostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinBloomMergePostProcess(name, frameGraph.engine));
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.blurTexture === undefined) {
            throw new Error(`FrameGraphBloomMergeTask "${this.name}": sourceTexture and blurTexture are required`);
        }

        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "bloomBlur", this.blurTexture);
        });

        pass.addDependencies(this.blurTexture);

        return pass;
    }
}
