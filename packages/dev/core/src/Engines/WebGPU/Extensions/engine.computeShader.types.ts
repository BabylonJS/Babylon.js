import { type ComputeEffect } from "../../../Compute/computeEffect";
import { type IComputeContext } from "../../../Compute/IComputeContext";
import { type Nullable } from "../../../types";
import { type ComputeBindingList, type ComputeBindingMapping } from "../../Extensions/engine.computeShader";
import { type WebGPUPerfCounter } from "../webgpuPerfCounter";
import { type DataBuffer } from "../../../Buffers/dataBuffer";
declare module "../../webgpuEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface WebGPUEngine {
        /** @internal */
        _createComputePipelineStageDescriptor(computeShader: string, defines: Nullable<string>, entryPoint: string): GPUProgrammableStage;
        /** @internal
         * Either all of x,y,z or buffer and offset should be defined.
         */
        _computeDispatch(
            effect: ComputeEffect,
            context: IComputeContext,
            bindings: ComputeBindingList,
            x?: number,
            y?: number,
            z?: number,
            buffer?: DataBuffer,
            offset?: number,
            bindingsMapping?: ComputeBindingMapping,
            gpuPerfCounter?: WebGPUPerfCounter
        ): void;
    }
}
