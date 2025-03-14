// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphRenderPass, FrameGraphTextureHandle } from "core/index";
import { ThinAnaglyphPostProcess } from "core/PostProcesses/thinAnaglyphPostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";

/**
 * Task which applies an anaglyph post process.
 */
export class FrameGraphAnaglyphTask extends FrameGraphPostProcessTask {
    /**
     * The texture to use as the left texture.
     */
    public leftTexture: FrameGraphTextureHandle;

    public override readonly postProcess: ThinAnaglyphPostProcess;

    /**
     * Constructs a new anaglyph task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the anaglyph effect. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinAnaglyphPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinAnaglyphPostProcess(name, frameGraph.engine));
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.leftTexture === undefined) {
            throw new Error(`FrameGraphAnaglyphTask "${this.name}": sourceTexture and leftTexture are required`);
        }

        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "leftSampler", this.leftTexture);
        });

        pass.addDependencies(this.leftTexture);

        return pass;
    }
}
