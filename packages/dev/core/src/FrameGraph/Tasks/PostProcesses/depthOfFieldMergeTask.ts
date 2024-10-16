import { DepthOfFieldMergePostProcessImpl } from "core/PostProcesses/depthOfFieldMergePostProcessImpl";
import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import type { PostProcessCoreOptions } from "core/PostProcesses/postProcessCore";
import { PostProcessCore } from "core/PostProcesses/postProcessCore";
import { FrameGraphPostProcessCoreTask } from "./postProcessCoreTask";
import type { AbstractEngine } from "core/Engines/abstractEngine";

export class FrameGraphDepthOfFieldMergeTask extends FrameGraphPostProcessCoreTask {
    public circleOfConfusionTexture: FrameGraphTextureHandle;

    public blurSteps: FrameGraphTextureHandle[] = [];

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, options?: PostProcessCoreOptions) {
        super(
            name,
            frameGraph,
            new PostProcessCore(name, DepthOfFieldMergePostProcessImpl.FragmentUrl, engine, {
                samplers: DepthOfFieldMergePostProcessImpl.Samplers,
                implementation: options?.implementation ?? new DepthOfFieldMergePostProcessImpl(),
                ...options,
            })
        );
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.circleOfConfusionTexture === undefined || this.blurSteps.length === 0) {
            throw new Error(`FrameGraphBloomMergeTask "${this.name}": sourceTexture, circleOfConfusionTexture and blurSteps are required`);
        }

        this._postProcess.updateEffect("#define BLUR_LEVEL " + (this.blurSteps.length - 1) + "\n");

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
