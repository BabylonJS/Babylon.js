import type { FrameGraph, FrameGraphRenderContext, FrameGraphRenderPass } from "core/index";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { ThinConvolutionPostProcess } from "core/PostProcesses/thinConvolutionPostProcess";

/**
 * Task which applies a convolution post process.
 */
export class FrameGraphConvolutionTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinConvolutionPostProcess;

    /**
     * Constructs a new convolution task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task belongs to.
     * @param thinPostProcess The thin post process to use for the task. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinConvolutionPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinConvolutionPostProcess(name, frameGraph.engine, ThinConvolutionPostProcess.EmbossKernel));
    }

    public override record(
        skipCreationOfDisabledPasses = false,
        additionalExecute?: (context: FrameGraphRenderContext) => void,
        additionalBindings?: (context: FrameGraphRenderContext) => void
    ): FrameGraphRenderPass {
        const pass = super.record(skipCreationOfDisabledPasses, additionalExecute, additionalBindings);

        this.postProcess.textureWidth = this._sourceWidth;
        this.postProcess.textureHeight = this._sourceHeight;

        return pass;
    }
}
