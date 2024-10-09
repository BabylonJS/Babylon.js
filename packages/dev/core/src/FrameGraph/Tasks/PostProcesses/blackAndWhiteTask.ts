import { FrameGraphPostProcessCoreTask } from "./postProcessCoreTask";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { FrameGraph } from "core/FrameGraph/frameGraph";
import type { PostProcessCoreOptions } from "core/PostProcesses/postProcessCore";
import { PostProcessCore } from "core/PostProcesses/postProcessCore";
import { BlackAndWhitePostProcessImpl } from "core/PostProcesses/blackAndWhitePostProcessImpl";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";

export class FrameGraphBlackAndWhiteTask extends FrameGraphPostProcessCoreTask {
    /**
     * Linear about to convert he result to black and white (default: 1)
     */
    public get degree() {
        return this._impl.degree;
    }

    public set degree(value: number) {
        this._impl.degree = value;
    }

    protected override _impl: BlackAndWhitePostProcessImpl;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, options?: PostProcessCoreOptions) {
        super(
            name,
            frameGraph,
            new PostProcessCore(name, BlackAndWhitePostProcessImpl.FragmentUrl, engine, {
                uniforms: BlackAndWhitePostProcessImpl.Uniforms,
                implementation: options?.implementation ?? new BlackAndWhitePostProcessImpl(),
                ...options,
                extraInitializations: (useWebGPU, promises) => {
                    if (useWebGPU) {
                        promises.push(import("../../../ShadersWGSL/blackAndWhite.fragment"));
                    } else {
                        promises.push(import("../../../Shaders/blackAndWhite.fragment"));
                    }
                },
            })
        );
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        return super.record(skipCreationOfDisabledPasses, undefined, (_context) => {
            this._impl.bind();
        });
    }
}
