import type { FrameGraph } from "core/FrameGraph/frameGraph";
import { ThinColorCorrectionPostProcess } from "core/PostProcesses/thinColorCorrectionPostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";

/**
 * Task which applies a color correction post process.
 */
export class FrameGraphColorCorrectionTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinColorCorrectionPostProcess;

    /**
     * Constructs a new color correction task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param colorTableUrl The URL of the color table to use for the color correction effect.
     * @param thinPostProcess The thin post process to use for the color correction effect. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, colorTableUrl: string, thinPostProcess?: ThinColorCorrectionPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinColorCorrectionPostProcess(name, frameGraph.scene, colorTableUrl));
    }
}
