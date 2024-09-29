import { FrameGraphPostProcessTask } from "./postProcessTask";
import { BlackAndWhitePostProcess } from "core/PostProcesses/blackAndWhitePostProcess";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { FrameGraph } from "core/FrameGraph/frameGraph";

export class FrameGraphBlackAndWhiteTask extends FrameGraphPostProcessTask {
    protected override _postProcess: BlackAndWhitePostProcess;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine) {
        super(
            name,
            frameGraph,
            new BlackAndWhitePostProcess(
                name,
                {
                    useAsFrameGraphTask: true,
                },
                null,
                undefined,
                engine
            )
        );
    }
}
