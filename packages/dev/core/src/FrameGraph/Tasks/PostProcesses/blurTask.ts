// eslint-disable-next-line import/no-internal-modules
import type { AbstractEngine, FrameGraph, FrameGraphRenderContext, FrameGraphRenderPass, PostProcessCoreOptions, Vector2 } from "core/index";
import { FrameGraphPostProcessCoreTask } from "./postProcessCoreTask";
import { PostProcessCore } from "core/PostProcesses/postProcessCore";
import { BlurPostProcessImpl } from "core/PostProcesses/blurPostProcessImpl";

export class FrameGraphBlurTask extends FrameGraphPostProcessCoreTask {
    public override readonly properties: BlurPostProcessImpl;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, direction: Vector2, kernel: number, options?: PostProcessCoreOptions) {
        super(
            name,
            frameGraph,
            new PostProcessCore(name, BlurPostProcessImpl.FragmentUrl, engine, {
                uniforms: BlurPostProcessImpl.Uniforms,
                samplers: BlurPostProcessImpl.Samplers,
                vertexUrl: BlurPostProcessImpl.VertexUrl,
                implementation: options?.implementation ?? new BlurPostProcessImpl(),
                ...options,
                blockCompilation: true,
            })
        );

        this.properties.direction = direction;
        this.properties.kernel = kernel;
    }

    public override record(
        skipCreationOfDisabledPasses = false,
        additionalExecute?: (context: FrameGraphRenderContext) => void,
        additionalBindings?: (context: FrameGraphRenderContext) => void
    ): FrameGraphRenderPass {
        return super.record(skipCreationOfDisabledPasses, additionalExecute, (_context) => {
            this.properties.bind(this._outputWidth, this._outputHeight);
            additionalBindings?.(_context);
        });
    }
}
