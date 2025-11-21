import type { FrameGraph, FrameGraphTextureHandle, FrameGraphRenderPass } from "core/index";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { ThinScreenSpaceCurvaturePostProcess } from "core/PostProcesses/thinScreenSpaceCurvaturePostProcess";

/**
 * Task which applies a screen space curvature post process.
 */
export class FrameGraphScreenSpaceCurvatureTask extends FrameGraphPostProcessTask {
    /**
     * The normal texture to use for the screen space curvature effect.
     * It must store normals in camera view space.
     */
    public normalTexture: FrameGraphTextureHandle;

    public override readonly postProcess: ThinScreenSpaceCurvaturePostProcess;

    /**
     * Constructs a new circle of confusion task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task belongs to.
     * @param thinPostProcess The thin post process to use for the task. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinScreenSpaceCurvaturePostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinScreenSpaceCurvaturePostProcess(name, frameGraph.engine));
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.normalTexture === undefined) {
            throw new Error(`FrameGraphScreenSpaceCurvatureTask "${this.name}": sourceTexture and normalTexture are required`);
        }

        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "normalSampler", this.normalTexture);
        });

        pass.addDependencies(this.normalTexture);

        return pass;
    }
}
