import { ComputeEffect, IComputeEffectCreationOptions } from "../../Compute/computeEffect";
import { IComputePipelineContext } from "../../Compute/IComputePipelineContext";
import { ThinEngine } from "../../Engines/thinEngine";
import { Nullable } from "../../types";

/**
 * Type used to locate a resource in a compute shader.
 * Note that for the time being the string variant does not work because reflection is not implemented in browsers yet
 */
export type ComputeBindingLocation = { group: number, binding: number } | string;

/** @hidden */
export enum ComputeBindingType {
    Texture = 0,
    StorageTexture = 1,
    UniformBuffer = 2,
    StorageBuffer = 3,
}

/** @hidden */
export type ComputeBindingList = { [key: string]: { location: ComputeBindingLocation, type: ComputeBindingType, object: any } };

/** @hidden */
export function BindingLocationToString(location: ComputeBindingLocation): string {
    return (location as any).group !== undefined ? (location as any).group + "_" + (location as any).binding : <string>location;
}

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Creates a new compute effect
         * @param baseName Name of the effect
         * @param options Options used to create the effect
         * @returns The new compute effect
         */
        createComputeEffect(baseName: any, options: IComputeEffectCreationOptions): ComputeEffect;

        /**
         * Creates a new compute pipeline context
         * @returns the new pipeline
         */
        createComputePipelineContext(): IComputePipelineContext;

        /**
         * Dispatches a compute shader
         * @param effect The compute effect
         * @param bindings The list of resources to bind to the shader
         * @param x The number of workgroups to execute on the X dimension
         * @param y The number of workgroups to execute on the Y dimension
         * @param z The number of workgroups to execute on the Z dimension
         */
        computeDispatch(effect: ComputeEffect, bindings: ComputeBindingList, x: number, y?: number, z?: number): void;

        /**
         * Gets a boolean indicating if all created compute effects are ready
         * @returns true if all effects are ready
         */
        areAllComputeEffectsReady(): boolean;

        /**
         * Forces the engine to release all cached compute effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
         */
        releaseComputeEffects(): void;

        /** @hidden */
        _prepareComputePipelineContext(pipelineContext: IComputePipelineContext, computeSourceCode: string, rawComputeSourceCode: string, defines: Nullable<string>): void;

        /** @hidden */
        _rebuildComputeEffects(): void;

        /** @hidden */
        _executeWhenComputeStateIsCompiled(pipelineContext: IComputePipelineContext, action: () => void): void;

        /** @hidden */
        _releaseComputeEffect(effect: ComputeEffect): void;

        /** @hidden */
        _deleteComputePipelineContext(pipelineContext: IComputePipelineContext): void;

        /** @hidden */
        _compiledComputeEffects: { [key: string]: ComputeEffect };
    }
}

ThinEngine.prototype._compiledComputeEffects = {};

ThinEngine.prototype.createComputeEffect = function(baseName: any, options: IComputeEffectCreationOptions): ComputeEffect {
    throw new Error("createComputeEffect: This engine does not support compute shaders!");
};

ThinEngine.prototype.createComputePipelineContext = function(): IComputePipelineContext {
    throw new Error("createComputePipelineContext: This engine does not support compute shaders!");
};

ThinEngine.prototype.computeDispatch = function(effect: ComputeEffect, bindings: ComputeBindingList, x: number, y?: number, z?: number): void {
    throw new Error("computeDispatch: This engine does not support compute shaders!");
};

ThinEngine.prototype.areAllComputeEffectsReady = function(): boolean {
    for (const key in this._compiledComputeEffects) {
        const effect = this._compiledComputeEffects[key];

        if (!effect.isReady()) {
            return false;
        }
    }

    return true;
};

ThinEngine.prototype.releaseComputeEffects = function(): void {
    this._compiledComputeEffects = {};
};

ThinEngine.prototype._prepareComputePipelineContext = function(pipelineContext: IComputePipelineContext, computeSourceCode: string, rawComputeSourceCode: string, defines: Nullable<string>): void {
};

ThinEngine.prototype._rebuildComputeEffects = function(): void {
    for (const key in this._compiledComputeEffects) {
        const effect = this._compiledComputeEffects[key];

        effect._pipelineContext = null;
        effect._wasPreviouslyReady = false;
        effect._prepareEffect();
    }
};

ThinEngine.prototype._executeWhenComputeStateIsCompiled = function(pipelineContext: IComputePipelineContext, action: () => void): void {
    action();
};

ThinEngine.prototype._releaseComputeEffect = function(effect: ComputeEffect): void {
};

ThinEngine.prototype._deleteComputePipelineContext = function(pipelineContext: IComputePipelineContext): void {
};
