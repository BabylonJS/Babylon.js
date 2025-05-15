import { Logger } from "core/Misc/logger";
import type { IComputeEffectCreationOptions, IComputeShaderPath } from "../../../Compute/computeEffect";
import { ComputeEffect } from "../../../Compute/computeEffect";
import type { IComputeContext } from "../../../Compute/IComputeContext";
import type { IComputePipelineContext } from "../../../Compute/IComputePipelineContext";
import type { Nullable } from "../../../types";
import type { ComputeBindingList, ComputeBindingMapping, ComputeCompilationMessages } from "../../Extensions/engine.computeShader";
import { WebGPUEngine } from "../../webgpuEngine";
import { WebGPUComputeContext } from "../webgpuComputeContext";
import { WebGPUComputePipelineContext } from "../webgpuComputePipelineContext";
import * as WebGPUConstants from "../webgpuConstants";
import type { WebGPUPerfCounter } from "../webgpuPerfCounter";
import type { DataBuffer } from "../../../Buffers/dataBuffer";

declare module "../../webgpuEngine" {
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

const ComputePassDescriptor: GPUComputePassDescriptor = {};

WebGPUEngine.prototype.createComputeContext = function (): IComputeContext | undefined {
    return new WebGPUComputeContext(this._device, this._cacheSampler);
};

WebGPUEngine.prototype.createComputeEffect = function (baseName: string | (IComputeShaderPath & { computeToken?: string }), options: IComputeEffectCreationOptions): ComputeEffect {
    const compute = typeof baseName === "string" ? baseName : baseName.computeToken || baseName.computeSource || baseName.computeElement || baseName.compute;

    const name = compute + "@" + options.defines;
    if (this._compiledComputeEffects[name]) {
        const compiledEffect = this._compiledComputeEffects[name];
        if (options.onCompiled && compiledEffect.isReady()) {
            options.onCompiled(compiledEffect);
        }

        return compiledEffect;
    }
    const effect = new ComputeEffect(baseName, options, this, name);
    this._compiledComputeEffects[name] = effect;

    return effect;
};

WebGPUEngine.prototype.createComputePipelineContext = function (): IComputePipelineContext {
    return new WebGPUComputePipelineContext(this);
};

WebGPUEngine.prototype.areAllComputeEffectsReady = function (): boolean {
    for (const key in this._compiledComputeEffects) {
        const effect = this._compiledComputeEffects[key];

        if (!effect.isReady()) {
            return false;
        }
    }

    return true;
};

WebGPUEngine.prototype.computeDispatch = function (
    effect: ComputeEffect,
    context: IComputeContext,
    bindings: ComputeBindingList,
    x: number,
    y = 1,
    z = 1,
    bindingsMapping?: ComputeBindingMapping,
    gpuPerfCounter?: WebGPUPerfCounter
): void {
    this._computeDispatch(effect, context, bindings, x, y, z, undefined, undefined, bindingsMapping, gpuPerfCounter);
};

WebGPUEngine.prototype.computeDispatchIndirect = function (
    effect: ComputeEffect,
    context: IComputeContext,
    bindings: ComputeBindingList,
    buffer: DataBuffer,
    offset: number = 0,
    bindingsMapping?: ComputeBindingMapping,
    gpuPerfCounter?: WebGPUPerfCounter
): void {
    this._computeDispatch(effect, context, bindings, undefined, undefined, undefined, buffer, offset, bindingsMapping, gpuPerfCounter);
};

WebGPUEngine.prototype._computeDispatch = function (
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
): void {
    this._endCurrentRenderPass();

    const contextPipeline = effect._pipelineContext as WebGPUComputePipelineContext;
    const computeContext = context as WebGPUComputeContext;

    if (!contextPipeline.computePipeline) {
        contextPipeline.computePipeline = this._device.createComputePipeline({
            layout: WebGPUConstants.AutoLayoutMode.Auto,
            compute: contextPipeline.stage!,
        });
    }

    if (gpuPerfCounter) {
        this._timestampQuery.startPass(ComputePassDescriptor, this._timestampIndex);
    }

    const computePass = this._renderEncoder.beginComputePass(ComputePassDescriptor);

    computePass.setPipeline(contextPipeline.computePipeline);

    const bindGroups = computeContext.getBindGroups(bindings, contextPipeline.computePipeline, bindingsMapping);
    for (let i = 0; i < bindGroups.length; ++i) {
        const bindGroup = bindGroups[i];
        if (!bindGroup) {
            continue;
        }
        computePass.setBindGroup(i, bindGroup);
    }

    if (buffer !== undefined) {
        computePass.dispatchWorkgroupsIndirect(buffer.underlyingResource, <number>offset);
    } else {
        if (<number>x + <number>y + <number>z > 0) {
            computePass.dispatchWorkgroups(<number>x, <number>y, <number>z);
        }
    }
    computePass.end();

    if (gpuPerfCounter) {
        this._timestampQuery.endPass(this._timestampIndex, gpuPerfCounter);
        this._timestampIndex += 2;
    }
};

WebGPUEngine.prototype.releaseComputeEffects = function () {
    for (const name in this._compiledComputeEffects) {
        const webGPUPipelineContextCompute = this._compiledComputeEffects[name].getPipelineContext() as WebGPUComputePipelineContext;
        this._deleteComputePipelineContext(webGPUPipelineContextCompute);
    }

    this._compiledComputeEffects = {};
};

WebGPUEngine.prototype._prepareComputePipelineContext = function (
    pipelineContext: IComputePipelineContext,
    computeSourceCode: string,
    rawComputeSourceCode: string,
    defines: Nullable<string>,
    entryPoint: string
): void {
    const webGpuContext = pipelineContext as WebGPUComputePipelineContext;

    if (this.dbgShowShaderCode) {
        Logger.Log(defines!);
        Logger.Log(computeSourceCode);
    }

    webGpuContext.sources = {
        compute: computeSourceCode,
        rawCompute: rawComputeSourceCode,
    };

    webGpuContext.stage = this._createComputePipelineStageDescriptor(computeSourceCode, defines, entryPoint);
};

WebGPUEngine.prototype._releaseComputeEffect = function (effect: ComputeEffect): void {
    if (this._compiledComputeEffects[effect._key]) {
        delete this._compiledComputeEffects[effect._key];

        this._deleteComputePipelineContext(effect.getPipelineContext() as WebGPUComputePipelineContext);
    }
};

WebGPUEngine.prototype._rebuildComputeEffects = function (): void {
    for (const key in this._compiledComputeEffects) {
        const effect = this._compiledComputeEffects[key];

        effect._pipelineContext = null;
        effect._wasPreviouslyReady = false;
        effect._prepareEffect();
    }
};

WebGPUEngine.prototype._executeWhenComputeStateIsCompiled = function (
    pipelineContext: WebGPUComputePipelineContext,
    action: (messages: Nullable<ComputeCompilationMessages>) => void
): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
    pipelineContext.stage!.module.getCompilationInfo().then((info) => {
        const compilationMessages: ComputeCompilationMessages = {
            numErrors: 0,
            messages: [],
        };
        for (const message of info.messages) {
            if (message.type === "error") {
                compilationMessages.numErrors++;
            }
            compilationMessages.messages.push({
                type: message.type,
                text: message.message,
                line: message.lineNum,
                column: message.linePos,
                length: message.length,
                offset: message.offset,
            });
        }
        action(compilationMessages);
    });
};

WebGPUEngine.prototype._deleteComputePipelineContext = function (pipelineContext: IComputePipelineContext): void {
    const webgpuPipelineContext = pipelineContext as WebGPUComputePipelineContext;
    if (webgpuPipelineContext) {
        pipelineContext.dispose();
    }
};

WebGPUEngine.prototype._createComputePipelineStageDescriptor = function (computeShader: string, defines: Nullable<string>, entryPoint: string): GPUProgrammableStage {
    if (defines) {
        defines = "//" + defines.split("\n").join("\n//") + "\n";
    } else {
        defines = "";
    }
    return {
        module: this._device.createShaderModule({
            code: defines + computeShader,
        }),
        entryPoint,
    };
};
