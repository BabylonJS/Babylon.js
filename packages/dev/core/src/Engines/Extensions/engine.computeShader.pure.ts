/** This file must only contain pure code and pure imports */

import { type ComputeEffect, type IComputeEffectCreationOptions, type IComputeShaderPath } from "../../Compute/computeEffect";
import { type IComputeContext } from "../../Compute/IComputeContext";
import { type IComputePipelineContext } from "../../Compute/IComputePipelineContext";
import { ThinEngine } from "../../Engines/thinEngine.pure";
import { type Nullable } from "../../types";
import { type DataBuffer } from "../../Buffers/dataBuffer";
import { AbstractEngine } from "../abstractEngine.pure";

/* eslint-disable @typescript-eslint/no-unused-vars */

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
// eslint-disable-next-line @typescript-eslint/naming-convention
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
export const enum ComputeBindingType {
    Texture = 0,
    StorageTexture = 1,
    UniformBuffer = 2,
    StorageBuffer = 3,
    TextureWithoutSampler = 4,
    Sampler = 5,
    ExternalTexture = 6,
    DataBuffer = 7,
    InternalTexture = 8,
}

/** @internal */
export type ComputeBindingList = { [key: string]: { type: ComputeBindingType; object: any; indexInGroupEntries?: number } };

let _Registered = false;
/**
 * Register side effects for enginesExtensionsEngineComputeShader.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesExtensionsEngineComputeShader(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

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

    ThinEngine.prototype.computeDispatchIndirect = function (
        effect: ComputeEffect,
        context: IComputeContext,
        bindings: ComputeBindingList,
        buffer: DataBuffer,
        offset?: number,
        bindingsMapping?: ComputeBindingMapping
    ): void {
        throw new Error("computeDispatchIndirect: This engine does not support compute shaders!");
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

    AbstractEngine.prototype._executeWhenComputeStateIsCompiled = function (
        pipelineContext: IComputePipelineContext,
        action: (messages: Nullable<ComputeCompilationMessages>) => void
    ): void {
        action(null);
    };

    ThinEngine.prototype._releaseComputeEffect = function (effect: ComputeEffect): void {};

    ThinEngine.prototype._deleteComputePipelineContext = function (pipelineContext: IComputePipelineContext): void {};
}
