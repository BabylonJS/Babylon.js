// eslint-disable-next-line import/no-internal-modules
import type { AbstractEngine, FrameGraph, FrameGraphRenderContext, FrameGraphRenderPass, PostProcessCoreOptions, Vector2 } from "core/index";
import { FrameGraphPostProcessCoreTask } from "./postProcessCoreTask";
import { PostProcessCore } from "core/PostProcesses/postProcessCore";
import { BlurPostProcessImpl } from "core/PostProcesses/blurPostProcessImpl";

export class FrameGraphBlurTask extends FrameGraphPostProcessCoreTask {
    /** The direction in which to blur the image. */
    public get direction() {
        return this._impl.direction;
    }

    public set direction(value: Vector2) {
        this._impl.direction = value;
    }

    /**
     * Sets the length in pixels of the blur sample region
     */
    public set kernel(v: number) {
        this._impl.kernel = v;
    }

    /**
     * Gets the length in pixels of the blur sample region
     */
    public get kernel(): number {
        return this._impl.kernel;
    }

    /**
     * Sets whether or not the blur needs to unpack/repack floats
     */
    public set packedFloat(v: boolean) {
        this._impl.packedFloat = v;
    }

    /**
     * Gets whether or not the blur is unpacking/repacking floats
     */
    public get packedFloat(): boolean {
        return this._impl.packedFloat;
    }

    protected override _impl: BlurPostProcessImpl;

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
                extraInitializations: (useWebGPU, promises) => {
                    if (useWebGPU) {
                        promises.push(Promise.all([import("../../../ShadersWGSL/kernelBlur.fragment"), import("../../../ShadersWGSL/kernelBlur.vertex")]));
                    } else {
                        promises.push(Promise.all([import("../../../Shaders/kernelBlur.fragment"), import("../../../Shaders/kernelBlur.vertex")]));
                    }
                },
            })
        );

        this.direction = direction;
        this.kernel = kernel;
    }

    public override record(
        skipCreationOfDisabledPasses = false,
        additionalExecute?: (context: FrameGraphRenderContext) => void,
        additionalBindings?: (context: FrameGraphRenderContext) => void
    ): FrameGraphRenderPass {
        return super.record(skipCreationOfDisabledPasses, additionalExecute, (_context) => {
            this._impl.bind(this._outputWidth, this._outputHeight);
            additionalBindings?.(_context);
        });
    }
}
