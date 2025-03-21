// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphRenderContext, FrameGraphRenderPass } from "core/index";
import { ThinChromaticAberrationPostProcess } from "core/PostProcesses/thinChromaticAberrationPostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";

/**
 * Task which applies a chromatic aberration post process.
 */
export class FrameGraphChromaticAberrationTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinChromaticAberrationPostProcess;

    /**
     * Constructs a new chromatic aberration task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the chromatic aberration effect. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinChromaticAberrationPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinChromaticAberrationPostProcess(name, frameGraph.engine));
    }

    public override record(
        skipCreationOfDisabledPasses = false,
        additionalExecute?: (context: FrameGraphRenderContext) => void,
        additionalBindings?: (context: FrameGraphRenderContext) => void
    ): FrameGraphRenderPass {
        const pass = super.record(skipCreationOfDisabledPasses, additionalExecute, additionalBindings);

        this.postProcess.screenWidth = this._sourceWidth;
        this.postProcess.screenHeight = this._sourceHeight;

        return pass;
    }
}
