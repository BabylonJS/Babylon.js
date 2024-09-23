import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureId } from "../../frameGraphTypes";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import type { CircleOfConfusionPostProcess } from "core/PostProcesses/circleOfConfusionPostProcess";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import type { Camera } from "core/Cameras/camera";

export class FrameGraphCircleOfConfusionTask extends FrameGraphPostProcessTask {
    public sourceDepthTexture: FrameGraphTextureId;

    public camera: Camera;

    protected override _postProcess: CircleOfConfusionPostProcess;

    constructor(name: string, cocPostProcess: CircleOfConfusionPostProcess) {
        super(name, cocPostProcess);
    }

    public override recordFrameGraph(frameGraph: FrameGraph, skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.sourceDepthTexture === undefined || this.camera === undefined) {
            throw new Error(`CircleOfConfusionPostProcess "${this.name}": sourceTexture, sourceDepthTexture and camera are required`);
        }

        const sourceDepthTextureHandle = frameGraph.getTextureHandle(this.sourceDepthTexture);

        const pass = super.recordFrameGraph(frameGraph, skipCreationOfDisabledPasses, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "depthSampler", sourceDepthTextureHandle);
            this._postProcessDrawWrapper.effect!.setFloat2("cameraMinMaxZ", this.camera.minZ, this.camera.maxZ / (this.camera.maxZ - this.camera.minZ));
        });

        pass.useTexture(sourceDepthTextureHandle);

        return pass;
    }
}
