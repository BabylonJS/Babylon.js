import type { FrameGraph, FrameGraphRenderContext, FrameGraphRenderPass } from "core/index";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { ThinSharpenPostProcess } from "core/PostProcesses/thinSharpenPostProcess";

/**
 * Task which applies a sharpen post process.
 */
export class FrameGraphSharpenTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinSharpenPostProcess;

    /**
     * Constructs a new sharpen task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task belongs to.
     * @param thinPostProcess The thin post process to use for the task. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinSharpenPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinSharpenPostProcess(name, frameGraph.engine));
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
