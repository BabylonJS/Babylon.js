import type { IComputePipelineContext } from "../../Compute/IComputePipelineContext";
import type { Nullable } from "../../types";
import type { WebGPUEngine } from "../webgpuEngine";

/** @internal */
export class WebGPUComputePipelineContext implements IComputePipelineContext {
    public engine: WebGPUEngine;

    public sources: {
        compute: string;
        rawCompute: string;
    };

    public stage: Nullable<GPUProgrammableStage>;

    public computePipeline: GPUComputePipeline;

    public get isAsync() {
        return false;
    }

    public get isReady(): boolean {
        if (this.isAsync) {
            // When async mode is implemented, this should return true if the pipeline is ready
            return false;
        }

        // In synchronous mode, we return false, the readiness being determined by ComputeEffect
        return false;
    }

    /** @internal */
    public _name: string;

    constructor(engine: WebGPUEngine) {
        this._name = "unnamed";
        this.engine = engine;
    }

    public _getComputeShaderCode(): string | null {
        return this.sources?.compute;
    }

    public dispose(): void {}
}
