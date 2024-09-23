import { FrameGraphPostProcessTask } from "./postProcessTask";
import { BlackAndWhitePostProcess } from "core/PostProcesses/blackAndWhitePostProcess";
import type { AbstractEngine } from "core/Engines/abstractEngine";

export class FrameGraphBlackAndWhiteTask extends FrameGraphPostProcessTask {
    protected override _postProcess: BlackAndWhitePostProcess;

    constructor(name: string, engine: AbstractEngine) {
        super(
            name,
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
