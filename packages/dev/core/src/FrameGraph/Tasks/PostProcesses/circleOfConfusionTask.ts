import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { CircleOfConfusionPostProcess } from "core/PostProcesses/circleOfConfusionPostProcess";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import type { Camera } from "core/Cameras/camera";
import { Constants } from "core/Engines/constants";
import type { AbstractEngine } from "core/Engines/abstractEngine";

export class FrameGraphCircleOfConfusionTask extends FrameGraphPostProcessTask {
    public depthTexture: FrameGraphTextureHandle; // should store camera space depth (Z coordinate)

    public depthSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public camera: Camera;

    protected override _postProcess: CircleOfConfusionPostProcess;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine) {
        super(
            name,
            frameGraph,
            new CircleOfConfusionPostProcess(
                name,
                null,
                {
                    useAsFrameGraphTask: true,
                    depthNotNormalized: true,
                },
                null,
                undefined,
                engine
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
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "depthSampler", this.depthTexture);
                this._postProcessDrawWrapper.effect!.setFloat2("cameraMinMaxZ", this.camera.minZ, this.camera.maxZ / (this.camera.maxZ - this.camera.minZ));
            }
        );

        pass.useTexture(this.depthTexture);

        return pass;
    }
}
