import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import { FrameGraphPostProcessCoreTask } from "./postProcessCoreTask";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import type { Camera } from "core/Cameras/camera";
import { Constants } from "core/Engines/constants";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { CircleOfConfusionPostProcessImpl } from "core/PostProcesses/circleOfConfusionPostProcessImpl";
import type { CircleOfConfusionPostProcessOptions } from "core/PostProcesses/circleOfConfusionPostProcess";
import { PostProcessCore } from "core/PostProcesses/postProcessCore";

export class FrameGraphCircleOfConfusionTask extends FrameGraphPostProcessCoreTask {
    public depthTexture: FrameGraphTextureHandle; // should store camera space depth (Z coordinate)

    public depthSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public camera: Camera;

    public override readonly properties: CircleOfConfusionPostProcessImpl;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, options?: CircleOfConfusionPostProcessOptions) {
        super(
            name,
            frameGraph,
            new PostProcessCore(name, CircleOfConfusionPostProcessImpl.FragmentUrl, engine, {
                uniforms: CircleOfConfusionPostProcessImpl.Uniforms,
                samplers: CircleOfConfusionPostProcessImpl.Samplers,
                defines: CircleOfConfusionPostProcessImpl.DefinesDepthNotNormalized,
                depthNotNormalized: true,
                implementation: options?.implementation ?? new CircleOfConfusionPostProcessImpl(),
                ...options,
            } as CircleOfConfusionPostProcessOptions)
        );
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphCircleOfConfusionTask "${this.name}": sourceTexture, depthTexture and camera are required`);
        }

        const pass = super.record(
            skipCreationOfDisabledPasses,
            (context) => {
                context.setTextureSamplingMode(this.depthTexture, this.depthSamplingMode);
            },
            (context) => {
                this.properties.bind(this.camera);
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "depthSampler", this.depthTexture);
            }
        );

        pass.useTexture(this.depthTexture);

        return pass;
    }
}
