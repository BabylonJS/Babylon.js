import { FrameGraphPostProcessCoreTask } from "./postProcessCoreTask";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { FrameGraph } from "core/FrameGraph/frameGraph";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import type { PostProcessCoreOptions } from "core/PostProcesses/postProcessCore";
import { PostProcessCore } from "core/PostProcesses/postProcessCore";
import { ExtractHighlightsPostProcessImpl } from "core/PostProcesses/extractHighlightsPostProcessImpl";

export class FrameGraphExtractHighlightsTask extends FrameGraphPostProcessCoreTask {
    public override readonly properties: ExtractHighlightsPostProcessImpl;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, options?: PostProcessCoreOptions) {
        super(
            name,
            frameGraph,
            new PostProcessCore(name, ExtractHighlightsPostProcessImpl.FragmentUrl, engine, {
                uniforms: ExtractHighlightsPostProcessImpl.Uniforms,
                implementation: options?.implementation ?? new ExtractHighlightsPostProcessImpl(),
                ...options,
            })
        );
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        return super.record(skipCreationOfDisabledPasses, undefined, (_context) => {
            this.properties.bind();
        });
    }
}
