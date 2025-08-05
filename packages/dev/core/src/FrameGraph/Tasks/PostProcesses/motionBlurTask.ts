import type { FrameGraph, FrameGraphTextureHandle, FrameGraphRenderPass } from "core/index";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { ThinMotionBlurPostProcess } from "core/PostProcesses/thinMotionBlurPostProcess";

/**
 * Task which applies a motion blur post process.
 */
export class FrameGraphMotionBlurTask extends FrameGraphPostProcessTask {
    /**
     * The velocity texture to use for the motion blur effect.
     * Needed for object-based motion blur.
     */
    public velocityTexture?: FrameGraphTextureHandle;

    /**
     * The (view) depth texture to use for the motion blur effect.
     * Needed for screen-based motion blur.
     */
    public depthTexture?: FrameGraphTextureHandle;

    public override readonly postProcess: ThinMotionBlurPostProcess;

    /**
     * Constructs a new motion blur task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task belongs to.
     * @param thinPostProcess The thin post process to use for the task. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinMotionBlurPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinMotionBlurPostProcess(name, frameGraph.scene));
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined) {
            throw new Error(`FrameGraphMotionBlurTask "${this.name}": sourceTexture is required`);
        }

        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            if (this.velocityTexture) {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "velocitySampler", this.velocityTexture);
            } else if (this.postProcess.isObjectBased) {
                throw new Error(`FrameGraphMotionBlurTask "${this.name}": velocityTexture is required for object-based motion blur`);
            }

            if (this.depthTexture) {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "depthSampler", this.depthTexture);
            } else if (!this.postProcess.isObjectBased) {
                throw new Error(`FrameGraphMotionBlurTask "${this.name}": depthTexture is required for screen-based motion blur`);
            }
        });

        pass.addDependencies(this.velocityTexture);
        pass.addDependencies(this.depthTexture);

        this.postProcess.textureWidth = this._sourceWidth;
        this.postProcess.textureHeight = this._sourceHeight;

        return pass;
    }
}
