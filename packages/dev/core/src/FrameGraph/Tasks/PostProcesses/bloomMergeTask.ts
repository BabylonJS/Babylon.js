// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphTextureHandle, FrameGraphRenderPass, AbstractEngine, PostProcessCoreOptions } from "core/index";
import { FrameGraphPostProcessCoreTask } from "./postProcessCoreTask";
import { BloomMergePostProcessImpl } from "core/PostProcesses/bloomMergePostProcessImpl";
import { PostProcessCore } from "core/PostProcesses/postProcessCore";

export class FrameGraphBloomMergeTask extends FrameGraphPostProcessCoreTask {
    public blurTexture: FrameGraphTextureHandle;

    /** Weight of the bloom to be added to the original input. */
    public get weight() {
        return this._impl.weight;
    }

    public set weight(value: number) {
        this._impl.weight = value;
    }

    protected override _impl: BloomMergePostProcessImpl;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, options?: PostProcessCoreOptions) {
        super(
            name,
            frameGraph,
            new BloomMergePostProcessImpl(
                new PostProcessCore(name, BloomMergePostProcessImpl.FragmentUrl, engine, {
                    uniforms: BloomMergePostProcessImpl.Uniforms,
                    samplers: BloomMergePostProcessImpl.Samplers,
                    blockCompilation: true,
                    ...options,
                    extraInitializations: (useWebGPU, promises) => {
                        if (useWebGPU) {
                            promises.push(import("../../../ShadersWGSL/bloomMerge.fragment"));
                        } else {
                            promises.push(import("../../../Shaders/bloomMerge.fragment"));
                        }
                    },
                })
            )
        );
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.blurTexture === undefined) {
            throw new Error(`FrameGraphBloomMergeTask "${this.name}": sourceTexture and blurTexture are required`);
        }

        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            this._impl.bind();
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "bloomBlur", this.blurTexture);
        });

        pass.useTexture(this.blurTexture);

        return pass;
    }
}
