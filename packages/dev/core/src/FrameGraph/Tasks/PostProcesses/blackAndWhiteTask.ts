import { FrameGraphPostProcessCoreTask } from "./postProcessCoreTask";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { FrameGraph } from "core/FrameGraph/frameGraph";
import type { PostProcessCoreOptions } from "core/PostProcesses/postProcessCore";
import { PostProcessCore } from "core/PostProcesses/postProcessCore";
import { BlackAndWhitePostProcessImpl } from "core/PostProcesses/blackAndWhitePostProcessImpl";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";

export class FrameGraphBlackAndWhiteTask extends FrameGraphPostProcessCoreTask {
    public override readonly properties: BlackAndWhitePostProcessImpl;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, options?: PostProcessCoreOptions) {
        super(
            name,
            frameGraph,
            new PostProcessCore(name, BlackAndWhitePostProcessImpl.FragmentUrl, engine, {
                uniforms: BlackAndWhitePostProcessImpl.Uniforms,
                implementation: options?.implementation ?? new BlackAndWhitePostProcessImpl(),
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
