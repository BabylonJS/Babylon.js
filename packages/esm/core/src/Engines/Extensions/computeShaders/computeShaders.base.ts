import type { Nullable } from "@babylonjs/core/types";
import type { ComputeEffect, IComputeEffectCreationOptions } from "@babylonjs/core/Compute/computeEffect";
import type { IComputeContext } from "@babylonjs/core/Compute/IComputeContext";
import type { IComputePipelineContext } from "@babylonjs/core/Compute/IComputePipelineContext";
import type { IBaseEnginePublic } from "../../engine.base";

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

/** @internal */
export enum ComputeBindingType {
    Texture = 0,
    StorageTexture = 1,
    UniformBuffer = 2,
    StorageBuffer = 3,
    TextureWithoutSampler = 4,
    Sampler = 5,
    ExternalTexture = 6,
}

/** @internal */
export type ComputeBindingList = { [key: string]: { type: ComputeBindingType; object: any; indexInGroupEntries?: number } };

export interface IComputerShaderEngineExtension {
    /**
     * Creates a new compute effect
     * @param baseName Name of the effect
     * @param options Options used to create the effect
     * @returns The new compute effect
     */
    createComputeEffect(engineState: IBaseEnginePublic, baseName: any, options: IComputeEffectCreationOptions): ComputeEffect;

    /**
     * Creates a new compute pipeline context
     * @returns the new pipeline
     */
    createComputePipelineContext(engineState: IBaseEnginePublic): IComputePipelineContext;

    /**
     * Creates a new compute context
     * @returns the new context
     */
    createComputeContext(engineState: IBaseEnginePublic): IComputeContext | undefined;

    /**
     * Dispatches a compute shader
     * @param effect The compute effect
     * @param context The compute context
     * @param bindings The list of resources to bind to the shader
     * @param x The number of workgroups to execute on the X dimension
     * @param y The number of workgroups to execute on the Y dimension
     * @param z The number of workgroups to execute on the Z dimension
     * @param bindingsMapping list of bindings mapping (key is property name, value is binding location)
     */
    computeDispatch(
        engineState: IBaseEnginePublic,
        effect: ComputeEffect,
        context: IComputeContext,
        bindings: ComputeBindingList,
        x: number,
        y?: number,
        z?: number,
        bindingsMapping?: ComputeBindingMapping
    ): void;

    /**
     * Gets a boolean indicating if all created compute effects are ready
     * @returns true if all effects are ready
     */
    areAllComputeEffectsReady(engineState: IBaseEnginePublic): boolean;

    /**
     * Forces the engine to release all cached compute effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
     */
    releaseComputeEffects(engineState: IBaseEnginePublic): void;

    /** @internal */
    _prepareComputePipelineContext(
        engineState: IBaseEnginePublic,
        pipelineContext: IComputePipelineContext,
        computeSourceCode: string,
        rawComputeSourceCode: string,
        defines: Nullable<string>,
        entryPoint: string
    ): void;

    /** @internal */
    _rebuildComputeEffects(engineState: IBaseEnginePublic): void;

    /** @internal */
    _executeWhenComputeStateIsCompiled(engineState: IBaseEnginePublic, pipelineContext: IComputePipelineContext, action: () => void): void;

    /** @internal */
    _releaseComputeEffect(engineState: IBaseEnginePublic, effect: ComputeEffect): void;

    /** @internal */
    _deleteComputePipelineContext(engineState: IBaseEnginePublic, pipelineContext: IComputePipelineContext): void;
}
