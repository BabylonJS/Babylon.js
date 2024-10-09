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

    /**
     * Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. (default: 50) The diameter of the resulting aperture can be computed by lensSize/fStop.
     */
    public get lensSize() {
        return this._impl.lensSize;
    }

    public set lensSize(value: number) {
        this._impl.lensSize = value;
    }

    /**
     * F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop. (default: 1.4)
     */
    public get fStop() {
        return this._impl.fStop;
    }

    public set fStop(value: number) {
        this._impl.fStop = value;
    }

    /**
     * Distance away from the camera to focus on in scene units/1000 (eg. millimeter). (default: 2000)
     */
    public get focusDistance() {
        return this._impl.focusDistance;
    }

    public set focusDistance(value: number) {
        this._impl.focusDistance = value;
    }

    /**
     * Focal length of the effect's camera in scene units/1000 (eg. millimeter). (default: 50)
     */
    public get focalLength() {
        return this._impl.focalLength;
    }

    public set focalLength(value: number) {
        this._impl.focalLength = value;
    }

    protected override _impl: CircleOfConfusionPostProcessImpl;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, options?: CircleOfConfusionPostProcessOptions) {
        super(
            name,
            frameGraph,
            new CircleOfConfusionPostProcessImpl(
                new PostProcessCore(name, CircleOfConfusionPostProcessImpl.FragmentUrl, engine, {
                    uniforms: CircleOfConfusionPostProcessImpl.Uniforms,
                    samplers: CircleOfConfusionPostProcessImpl.Samplers,
                    defines: CircleOfConfusionPostProcessImpl.DefinesDepthNotNormalized,
                    depthNotNormalized: true,
                    ...options,
                    extraInitializations: (useWebGPU, promises) => {
                        if (useWebGPU) {
                            promises.push(import("../../../ShadersWGSL/circleOfConfusion.fragment"));
                        } else {
                            promises.push(import("../../../Shaders/circleOfConfusion.fragment"));
                        }
                    },
                } as CircleOfConfusionPostProcessOptions)
            )
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
                this._impl.bind(this.camera);
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "depthSampler", this.depthTexture);
            }
        );

        pass.useTexture(this.depthTexture);

        return pass;
    }
}
