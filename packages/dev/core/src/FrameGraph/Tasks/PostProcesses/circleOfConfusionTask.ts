import type { FrameGraph, FrameGraphTextureHandle, FrameGraphRenderPass, Camera } from "core/index";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { Constants } from "core/Engines/constants";
import { ThinCircleOfConfusionPostProcess } from "core/PostProcesses/thinCircleOfConfusionPostProcess";

/**
 * Task which applies a circle of confusion post process.
 */
export class FrameGraphCircleOfConfusionTask extends FrameGraphPostProcessTask {
    /**
     * The depth texture to use for the circle of confusion effect.
     * It must store camera space depth (Z coordinate)
     */
    public depthTexture: FrameGraphTextureHandle;

    /**
     * The sampling mode to use for the depth texture.
     */
    public depthSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    /**
     * The camera to use for the circle of confusion effect.
     */
    public camera: Camera;

    public override readonly postProcess: ThinCircleOfConfusionPostProcess;

    /**
     * Constructs a new circle of confusion task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task belongs to.
     * @param thinPostProcess The thin post process to use for the task. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinCircleOfConfusionPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinCircleOfConfusionPostProcess(name, frameGraph.engine));
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphCircleOfConfusionTask "${this.name}": sourceTexture, depthTexture and camera are required`);
        }

        const pass = super.record(
            skipCreationOfDisabledPasses,
            (context) => {
                this.postProcess.camera = this.camera;
                context.setTextureSamplingMode(this.depthTexture, this.depthSamplingMode);
            },
            (context) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "depthSampler", this.depthTexture);
            }
        );

        pass.addDependencies(this.depthTexture);

        return pass;
    }
}
