// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphTextureHandle, FrameGraphRenderPass, AbstractEngine, PostProcessCoreOptions } from "core/index";
import { FrameGraphPostProcessCoreTask } from "./postProcessCoreTask";
import { BloomMergePostProcessImpl } from "core/PostProcesses/bloomMergePostProcessImpl";
import { PostProcessCore } from "core/PostProcesses/postProcessCore";

export class FrameGraphBloomMergeTask extends FrameGraphPostProcessCoreTask {
    public blurTexture: FrameGraphTextureHandle;

    public override readonly properties: BloomMergePostProcessImpl;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, options?: PostProcessCoreOptions) {
        super(
            name,
            frameGraph,
            new PostProcessCore(name, BloomMergePostProcessImpl.FragmentUrl, engine, {
                uniforms: BloomMergePostProcessImpl.Uniforms,
                samplers: BloomMergePostProcessImpl.Samplers,
                implementation: options?.implementation ?? new BloomMergePostProcessImpl(),
                ...options,
            })
        );
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.blurTexture === undefined) {
            throw new Error(`FrameGraphBloomMergeTask "${this.name}": sourceTexture and blurTexture are required`);
        }

        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            this.properties.bind();
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "bloomBlur", this.blurTexture);
        });

        pass.useTexture(this.blurTexture);

        return pass;
    }
}
