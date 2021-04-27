import { ComputeEffect, IComputeEffectCreationOptions } from "../../Compute/computeEffect";
import { IComputePipelineContext } from "../../Compute/IComputePipelineContext";
import { ThinEngine } from "../../Engines/thinEngine";
import { Nullable } from "../../types";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * 
         * @param baseName 
         * @param options 
         */
        createComputeEffect(baseName: any, options: IComputeEffectCreationOptions): ComputeEffect;

        /**
         * Creates a new compute pipeline context
         * @returns the new pipeline
         */
        createComputePipelineContext(): IComputePipelineContext;

        /**
         * Gets a boolean indicating if all created compute effects are ready
         * @returns true if all effects are ready
         */
        areAllComputeEffectsReady(): boolean;

        /**
         * Force the engine to release all cached compute effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
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
