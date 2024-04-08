/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ComputeEffect, IComputeEffectCreationOptions, IComputeShaderPath } from "../../Compute/computeEffect";
import type { IComputeContext } from "../../Compute/IComputeContext";
import type { IComputePipelineContext } from "../../Compute/IComputePipelineContext";
import { ThinEngine } from "../../Engines/thinEngine";
import type { Nullable } from "../../types";
import type { WebGPUPerfCounter } from "../WebGPU/webgpuPerfCounter";

/**
 * Type used to locate a resource in a compute shader.
 * TODO: remove this when browsers support reflection for wgsl shaders
 */
export type ComputeBindingLocation = { group: number; binding: number };

/**
 * Type used to lookup a resource and retrieve its binding location
 * TODO: remove this when browsers support reflection for wgsl shaders
 */
export type ComputeBindingMapping = { [key: string]: ComputeBindingLocation };

/**
 * Types of messages that can be generated during compilation
 */
export type ComputeCompilationMessageType = "error" | "warning" | "info";

/**
 * Messages generated during compilation
 */
export interface ComputeCompilationMessages {
    /**
     * Number of errors generated during compilation
     */
    numErrors: number;
    /**
     * List of messages generated during compilation
     */
    messages: {
        type: ComputeCompilationMessageType;
        text: string;
        line?: number;
        column?: number;
        length?: number;
        offset?: number;
    }[];
}

/** @internal */
export enum ComputeBindingType {
    Texture = 0,
    StorageTexture = 1,
    UniformBuffer = 2,
    StorageBuffer = 3,
    TextureWithoutSampler = 4,
    Sampler = 5,
    ExternalTexture = 6,
    DataBuffer = 7,
}

/** @internal */
export type ComputeBindingList = { [key: string]: { type: ComputeBindingType; object: any; indexInGroupEntries?: number } };

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
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

ThinEngine.prototype.createComputeEffect = function (baseName: IComputeShaderPath & { computeToken?: string }, options: IComputeEffectCreationOptions): ComputeEffect {
    throw new Error("createComputeEffect: This engine does not support compute shaders!");
};

ThinEngine.prototype.createComputePipelineContext = function (): IComputePipelineContext {
    throw new Error("createComputePipelineContext: This engine does not support compute shaders!");
};

ThinEngine.prototype.createComputeContext = function (): IComputeContext | undefined {
    return undefined;
};

ThinEngine.prototype.computeDispatch = function (
    effect: ComputeEffect,
    context: IComputeContext,
    bindings: ComputeBindingList,
    x: number,
    y?: number,
    z?: number,
    bindingsMapping?: ComputeBindingMapping
): void {
    throw new Error("computeDispatch: This engine does not support compute shaders!");
};

ThinEngine.prototype.areAllComputeEffectsReady = function (): boolean {
    return true;
};

ThinEngine.prototype.releaseComputeEffects = function (): void {};

ThinEngine.prototype._prepareComputePipelineContext = function (
    pipelineContext: IComputePipelineContext,
    computeSourceCode: string,
    rawComputeSourceCode: string,
    defines: Nullable<string>,
    entryPoint: string
): void {};

ThinEngine.prototype._rebuildComputeEffects = function (): void {};

ThinEngine.prototype._executeWhenComputeStateIsCompiled = function (
    pipelineContext: IComputePipelineContext,
    action: (messages: Nullable<ComputeCompilationMessages>) => void
): void {
    action(null);
};

ThinEngine.prototype._releaseComputeEffect = function (effect: ComputeEffect): void {};

ThinEngine.prototype._deleteComputePipelineContext = function (pipelineContext: IComputePipelineContext): void {};
