import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureId } from "../../frameGraphTypes";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { CircleOfConfusionPostProcess } from "core/PostProcesses/circleOfConfusionPostProcess";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import type { Camera } from "core/Cameras/camera";
import { Constants } from "core/Engines/constants";
import type { AbstractEngine } from "core/Engines/abstractEngine";

export class FrameGraphCircleOfConfusionTask extends FrameGraphPostProcessTask {
    public depthTexture: FrameGraphTextureId; // should store camera space depth (Z coordinate)

    public depthSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public camera: Camera;

    protected override _postProcess: CircleOfConfusionPostProcess;

    constructor(name: string, engine: AbstractEngine) {
        super(
            name,
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

    public override record(frameGraph: FrameGraph, skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphCircleOfConfusionTask "${this.name}": sourceTexture, depthTexture and camera are required`);
        }

        const depthTextureHandle = frameGraph.getTextureHandle(this.depthTexture);

        const pass = super.record(
            frameGraph,
            skipCreationOfDisabledPasses,
            (context) => {
                context.setTextureSamplingMode(depthTextureHandle, this.depthSamplingMode);
            },
            (context) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "depthSampler", depthTextureHandle);
                this._postProcessDrawWrapper.effect!.setFloat2("cameraMinMaxZ", this.camera.minZ, this.camera.maxZ / (this.camera.maxZ - this.camera.minZ));
            }
        );

        pass.useTexture(depthTextureHandle);

        return pass;
    }
}
