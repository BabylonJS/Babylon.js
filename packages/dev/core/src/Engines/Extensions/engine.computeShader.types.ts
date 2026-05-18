import { type WebGPUPerfCounter } from "../WebGPU/webgpuPerfCounter";
import { type ComputeEffect, type IComputeEffectCreationOptions, type IComputeShaderPath } from "../../Compute/computeEffect";
import { type IComputeContext } from "../../Compute/IComputeContext";
import { type IComputePipelineContext } from "../../Compute/IComputePipelineContext";
import { type Nullable } from "../../types";
import { type DataBuffer } from "../../Buffers/dataBuffer";
import { type ComputeBindingMapping, type ComputeCompilationMessages, type ComputeBindingList } from "./engine.computeShader.pure";
declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Creates a new compute effect
         * @param baseName Name of the effect
         * @param options Options used to create the effect
         * @returns The new compute effect
         */
        createComputeEffect(
            baseName:
                | string
                | (IComputeShaderPath & {
                      /**
                       * @internal
                       */
                      computeToken?: string;
                  }),
            options: IComputeEffectCreationOptions
        ): ComputeEffect;

        /**
         * Creates a new compute pipeline context
         * @returns the new pipeline
         */
        createComputePipelineContext(): IComputePipelineContext;

        /**
         * Creates a new compute context
         * @returns the new context
         */
        createComputeContext(): IComputeContext | undefined;

        /**
         * Dispatches a compute shader
         * @param effect The compute effect
         * @param context The compute context
         * @param bindings The list of resources to bind to the shader
         * @param x The number of workgroups to execute on the X dimension
         * @param y The number of workgroups to execute on the Y dimension
         * @param z The number of workgroups to execute on the Z dimension
         * @param bindingsMapping list of bindings mapping (key is property name, value is binding location)
         * @param gpuPerfCounter GPU time computed for the compute shader will be assigned to this object
         */
        computeDispatch(
            effect: ComputeEffect,
            context: IComputeContext,
            bindings: ComputeBindingList,
            x: number,
            y?: number,
            z?: number,
            bindingsMapping?: ComputeBindingMapping,
            gpuPerfCounter?: WebGPUPerfCounter
        ): void;

        /**
         * Dispatches a compute shader
         * @param effect The compute effect
         * @param context The compute context
         * @param bindings The list of resources to bind to the shader
         * @param buffer The buffer containing the dispatch parameters
         * @param offset The offset in the buffer where the dispatch parameters start
         * @param bindingsMapping list of bindings mapping (key is property name, value is binding location)
         * @param gpuPerfCounter GPU time computed for the compute shader will be assigned to this object
         */
        computeDispatchIndirect(
            effect: ComputeEffect,
            context: IComputeContext,
            bindings: ComputeBindingList,
            buffer: DataBuffer,
            offset?: number,
            bindingsMapping?: ComputeBindingMapping,
            gpuPerfCounter?: WebGPUPerfCounter
        ): void;

        /**
         * Gets a boolean indicating if all created compute effects are ready
         * @returns true if all effects are ready
         */
        areAllComputeEffectsReady(): boolean;

        /**
         * Forces the engine to release all cached compute effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
         */
        releaseComputeEffects(): void;

        /** @internal */
        _prepareComputePipelineContext(
            pipelineContext: IComputePipelineContext,
            computeSourceCode: string,
            rawComputeSourceCode: string,
            defines: Nullable<string>,
            entryPoint: string
        ): void;

        /** @internal */
        _rebuildComputeEffects(): void;

        /** @internal */
        _executeWhenComputeStateIsCompiled(pipelineContext: IComputePipelineContext, action: (messages: Nullable<ComputeCompilationMessages>) => void): void;

        /** @internal */
        _releaseComputeEffect(effect: ComputeEffect): void;

        /** @internal */
        _deleteComputePipelineContext(pipelineContext: IComputePipelineContext): void;
    }
}
