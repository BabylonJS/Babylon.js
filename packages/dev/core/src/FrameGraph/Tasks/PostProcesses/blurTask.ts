import { FrameGraphPostProcessTask } from "./postProcessTask";
import { BlurPostProcess } from "core/PostProcesses/blurPostProcess";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Vector2 } from "core/Maths/math.vector";
import type { FrameGraph } from "core/FrameGraph/frameGraph";

export class FrameGraphBlurTask extends FrameGraphPostProcessTask {
    protected override _postProcess: BlurPostProcess;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, direction: Vector2, kernel: number) {
        super(
            name,
            frameGraph,
            new BlurPostProcess(
                name,
                new Vector2(0, 0),
                1,
                {
                    useAsFrameGraphTask: true,
                },
                null,
                undefined,
                engine
            )
        );

        this._postProcess.direction = direction;
        this._postProcess.kernel = kernel;
    }
}
