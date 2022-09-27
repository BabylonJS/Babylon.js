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
        if (this.stage) {
            return true;
        }

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
