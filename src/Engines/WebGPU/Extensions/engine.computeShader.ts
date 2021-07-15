import { ComputeEffect, IComputeEffectCreationOptions } from "../../../Compute/computeEffect";
import { IComputeContext } from "../../../Compute/IComputeContext";
import { IComputePipelineContext } from "../../../Compute/IComputePipelineContext";
import { Nullable } from "../../../types";
import { ComputeBindingList, ComputeBindingMapping } from "../../Extensions/engine.computeShader";
import { WebGPUEngine } from "../../webgpuEngine";
import { WebGPUComputeContext } from "../webgpuComputeContext";
import { WebGPUComputePipelineContext } from "../webgpuComputePipelineContext";

declare module "../../webgpuEngine" {
    export interface WebGPUEngine {
        /** @hidden */
        _createComputePipelineStageDescriptor(computeShader: string, defines: Nullable<string>): GPUProgrammableStage;
    }
}

WebGPUEngine.prototype.createComputeContext = function(): IComputeContext | undefined {
    return new WebGPUComputeContext(this._device, this._cacheSampler);
};

WebGPUEngine.prototype.createComputeEffect = function(baseName: any, options: IComputeEffectCreationOptions): ComputeEffect {
    const compute = baseName.computeElement || baseName.compute || baseName.computeToken || baseName.computeSource || baseName;

    const name = compute + "@" + options.defines;
    if (this._compiledComputeEffects[name]) {
        var compiledEffect = <ComputeEffect>this._compiledComputeEffects[name];
        if (options.onCompiled && compiledEffect.isReady()) {
            options.onCompiled(compiledEffect);
        }

        return compiledEffect;
    }
    const effect = new ComputeEffect(baseName, options, this, name);
    this._compiledComputeEffects[name] = effect;

    return effect;
};

WebGPUEngine.prototype.createComputePipelineContext = function(): IComputePipelineContext {
    return new WebGPUComputePipelineContext(this);
};

WebGPUEngine.prototype.areAllComputeEffectsReady = function(): boolean {
    for (const key in this._compiledComputeEffects) {
        const effect = this._compiledComputeEffects[key];

        if (!effect.isReady()) {
            return false;
        }
    }

    return true;
};

WebGPUEngine.prototype.computeDispatch = function(effect: ComputeEffect, context: IComputeContext, bindings: ComputeBindingList, x: number, y?: number, z?: number, bindingsMapping?: ComputeBindingMapping): void {
    if (this._currentRenderTarget) {
        // A render target pass is currently in effect (meaning beingRenderPass has been called on the command encoder this._renderTargetEncoder): we are not allowed to open
        // another pass on this command encoder (even if it's a compute pass) until endPass has been called, so we need to defer the compute pass for after the current render target pass is closed
        this._onAfterUnbindFrameBufferObservable.addOnce(() => {
            this.computeDispatch(effect, context, bindings, x, y, z, bindingsMapping);
        });
        return;
    }

    const contextPipeline = effect._pipelineContext as WebGPUComputePipelineContext;
    const computeContext = context as WebGPUComputeContext;

    if (!contextPipeline.computePipeline) {
        contextPipeline.computePipeline = this._device.createComputePipeline({
            compute: contextPipeline.stage!
        });
    }

    const commandEncoder = this._renderTargetEncoder;
    const computePass = commandEncoder.beginComputePass();

    computePass.setPipeline(contextPipeline.computePipeline);

    const bindGroups = computeContext.getBindGroups(bindings, contextPipeline.computePipeline, bindingsMapping);
    for (let i = 0; i < bindGroups.length; ++i) {
        const bindGroup = bindGroups[i];
        if (!bindGroup) {
            continue;
        }
        computePass.setBindGroup(i, bindGroup);
    }

    computePass.dispatch(x, y, z);
    computePass.endPass();
};

WebGPUEngine.prototype.releaseComputeEffects = function() {
    for (const name in this._compiledComputeEffects) {
        const webGPUPipelineContextCompute = this._compiledComputeEffects[name].getPipelineContext() as WebGPUComputePipelineContext;
        this._deleteComputePipelineContext(webGPUPipelineContextCompute);
    }

    this._compiledComputeEffects = {};
};

WebGPUEngine.prototype._prepareComputePipelineContext = function(pipelineContext: IComputePipelineContext, computeSourceCode: string, rawComputeSourceCode: string, defines: Nullable<string>): void {
    const webGpuContext = pipelineContext as WebGPUComputePipelineContext;

    if (this.dbgShowShaderCode) {
        console.log(defines);
        console.log(computeSourceCode);
    }

    webGpuContext.sources = {
        compute: computeSourceCode,
        rawCompute: rawComputeSourceCode,
    };

    webGpuContext.stage = this._createComputePipelineStageDescriptor(computeSourceCode, defines);
};

WebGPUEngine.prototype._releaseComputeEffect = function(effect: ComputeEffect): void {
    if (this._compiledComputeEffects[effect._key]) {
        delete this._compiledComputeEffects[effect._key];

        this._deleteComputePipelineContext(effect.getPipelineContext() as WebGPUComputePipelineContext);
    }
};

WebGPUEngine.prototype._rebuildComputeEffects = function(): void {
    for (const key in this._compiledComputeEffects) {
        const effect = this._compiledComputeEffects[key];

        effect._pipelineContext = null;
        effect._wasPreviouslyReady = false;
        effect._prepareEffect();
    }
};

WebGPUEngine.prototype._deleteComputePipelineContext = function(pipelineContext: IComputePipelineContext): void {
    const webgpuPipelineContext = pipelineContext as WebGPUComputePipelineContext;
    if (webgpuPipelineContext) {
        pipelineContext.dispose();
    }
};

WebGPUEngine.prototype._createComputePipelineStageDescriptor = function(computeShader: string, defines: Nullable<string>): GPUProgrammableStage {
    if (defines) {
        defines = "//" + defines.split("\n").join("\n//") + "\n";
    } else {
        defines = "";
    }
    return {
        module: this._device.createShaderModule({
            code: defines + computeShader,
        }),
        entryPoint: "main",
    };
};
