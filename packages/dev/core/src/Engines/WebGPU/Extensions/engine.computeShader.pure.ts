/** This file must only contain pure code and pure imports */

import * as WebGPUConstants from "../webgpuConstants";
import { Logger } from "core/Misc/logger";
import { type IComputeEffectCreationOptions, type IComputeShaderPath, ComputeEffect } from "../../../Compute/computeEffect";
import { type IComputeContext } from "../../../Compute/IComputeContext";
import { type IComputePipelineContext } from "../../../Compute/IComputePipelineContext";
import { type Nullable } from "../../../types";
import { ComputeBindingType, type ComputeBindingList, type ComputeBindingMapping, type ComputeCompilationMessages } from "../../Extensions/engine.computeShader.pure";
import { Constants } from "../../constants";
import { WebGPUComputeContext } from "../webgpuComputeContext";
import { WebGPUComputePipelineContext } from "../webgpuComputePipelineContext";
import { type WebGPUPerfCounter } from "../webgpuPerfCounter";
import { type DataBuffer } from "../../../Buffers/dataBuffer";
import { WebGPUEngine } from "../../webgpuEngine.pure";
import { type InternalTexture } from "../../../Materials/Textures/internalTexture";
import { type BaseTexture } from "../../../Materials/Textures/baseTexture.pure";

let _Registered = false;

const _GetComputeStorageBufferType = (source: string, group: number, binding: number): WebGPUConstants.BufferBindingType => {
    const bindingPattern = `@binding\\(${binding}\\)\\s*@group\\(${group}\\)`;
    const groupPattern = `@group\\(${group}\\)\\s*@binding\\(${binding}\\)`;
    const declarationPattern = `(?:${bindingPattern}|${groupPattern})\\s*var<storage\\s*,\\s*(read|read_write)>`;
    const access = source.match(new RegExp(declarationPattern))?.[1];

    return access === "read" ? WebGPUConstants.BufferBindingType.ReadOnlyStorage : WebGPUConstants.BufferBindingType.Storage;
};

const _GetComputeTextureViewDimension = (source: string, group: number, binding: number): WebGPUConstants.TextureViewDimension => {
    const bindingPattern = `@binding\\(${binding}\\)\\s*@group\\(${group}\\)`;
    const groupPattern = `@group\\(${group}\\)\\s*@binding\\(${binding}\\)`;
    const declaration = source.match(new RegExp(`(?:${bindingPattern}|${groupPattern})\\s*var\\s+\\w+\\s*:\\s*(texture_\\w+)`))?.[1];

    switch (declaration) {
        case "texture_2d_array":
        case "texture_depth_2d_array":
            return WebGPUConstants.TextureViewDimension.E2dArray;
        case "texture_cube":
            return WebGPUConstants.TextureViewDimension.Cube;
        case "texture_cube_array":
            return WebGPUConstants.TextureViewDimension.CubeArray;
        case "texture_3d":
            return WebGPUConstants.TextureViewDimension.E3d;
        default:
            return WebGPUConstants.TextureViewDimension.E2d;
    }
};

const _GetInternalTexture = (texture: BaseTexture | InternalTexture): Nullable<InternalTexture> => {
    const internalTexture = texture as InternalTexture;
    if (internalTexture._hardwareTexture !== undefined) {
        return internalTexture;
    }

    return (texture as BaseTexture)._texture;
};

const _GetComputeTextureSampleType = (texture: BaseTexture | InternalTexture, textureFloatLinearFiltering: boolean): WebGPUConstants.TextureSampleType => {
    const internalTexture = _GetInternalTexture(texture);

    if (!internalTexture) {
        return WebGPUConstants.TextureSampleType.Float;
    }

    const textureIsDepth = internalTexture.format >= Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 && internalTexture.format <= Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8;
    if (textureIsDepth) {
        return WebGPUConstants.TextureSampleType.Depth;
    }

    if (internalTexture.type === Constants.TEXTURETYPE_FLOAT && !textureFloatLinearFiltering) {
        return WebGPUConstants.TextureSampleType.UnfilterableFloat;
    }

    return WebGPUConstants.TextureSampleType.Float;
};

const _GetComputePipelineLayout = (
    device: GPUDevice,
    bindings: ComputeBindingList,
    bindingsMapping: ComputeBindingMapping | undefined,
    shaderSource: string,
    textureFloatLinearFiltering: boolean
): Nullable<GPUPipelineLayout> => {
    if (!bindingsMapping) {
        return null;
    }

    const bindGroupLayoutEntries: GPUBindGroupLayoutEntry[][] = [];

    const addEntry = (group: number, entry: GPUBindGroupLayoutEntry) => {
        const entries = (bindGroupLayoutEntries[group] ??= []);
        const existingIndex = entries.findIndex((item) => item.binding === entry.binding);
        if (existingIndex >= 0) {
            entries[existingIndex] = entry;
        } else {
            entries.push(entry);
        }
    };

    for (const key in bindings) {
        const binding = bindings[key];
        const location = bindingsMapping[key];
        if (!location) {
            continue;
        }

        const group = location.group;
        const bindingIndex = location.binding;

        switch (binding.type) {
            case ComputeBindingType.Texture:
            case ComputeBindingType.TextureWithoutSampler:
            case ComputeBindingType.InternalTexture: {
                const sampleType = _GetComputeTextureSampleType(binding.object as BaseTexture | InternalTexture, textureFloatLinearFiltering);

                if (binding.type === ComputeBindingType.Texture) {
                    addEntry(group, {
                        binding: bindingIndex - 1,
                        visibility: WebGPUConstants.ShaderStage.Compute,
                        sampler: {
                            type:
                                sampleType === WebGPUConstants.TextureSampleType.UnfilterableFloat
                                    ? WebGPUConstants.SamplerBindingType.NonFiltering
                                    : WebGPUConstants.SamplerBindingType.Filtering,
                        },
                    });
                }

                addEntry(group, {
                    binding: bindingIndex,
                    visibility: WebGPUConstants.ShaderStage.Compute,
                    texture: {
                        sampleType,
                        viewDimension: _GetComputeTextureViewDimension(shaderSource, group, bindingIndex),
                        multisampled: false,
                    },
                });
                break;
            }
            case ComputeBindingType.StorageTexture: {
                addEntry(group, {
                    binding: bindingIndex,
                    visibility: WebGPUConstants.ShaderStage.Compute,
                    storageTexture: {
                        access: WebGPUConstants.StorageTextureAccess.WriteOnly,
                        format: ((binding.object as BaseTexture)._texture!._hardwareTexture as any).format,
                        viewDimension: _GetComputeTextureViewDimension(shaderSource, group, bindingIndex),
                    },
                });
                break;
            }
            case ComputeBindingType.UniformBuffer:
                addEntry(group, {
                    binding: bindingIndex,
                    visibility: WebGPUConstants.ShaderStage.Compute,
                    buffer: { type: WebGPUConstants.BufferBindingType.Uniform },
                });
                break;
            case ComputeBindingType.StorageBuffer:
            case ComputeBindingType.DataBuffer:
                addEntry(group, {
                    binding: bindingIndex,
                    visibility: WebGPUConstants.ShaderStage.Compute,
                    buffer: { type: _GetComputeStorageBufferType(shaderSource, group, bindingIndex) },
                });
                break;
            case ComputeBindingType.Sampler:
                addEntry(group, {
                    binding: bindingIndex,
                    visibility: WebGPUConstants.ShaderStage.Compute,
                    sampler: { type: WebGPUConstants.SamplerBindingType.Filtering },
                });
                break;
            case ComputeBindingType.ExternalTexture:
                addEntry(group, {
                    binding: bindingIndex,
                    visibility: WebGPUConstants.ShaderStage.Compute,
                    externalTexture: {},
                });
                break;
        }
    }

    const bindGroupLayouts: GPUBindGroupLayout[] = [];
    for (let i = 0; i < bindGroupLayoutEntries.length; i++) {
        const entries = bindGroupLayoutEntries[i] ?? [];
        entries.sort((a, b) => a.binding - b.binding);
        bindGroupLayouts[i] = device.createBindGroupLayout({ entries });
    }

    return device.createPipelineLayout({ bindGroupLayouts });
};

/**
 * Register side effects for enginesWebGPUExtensionsEngineComputeShader.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesWebGPUExtensionsEngineComputeShader(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const ComputePassDescriptor: GPUComputePassDescriptor = {};

    WebGPUEngine.prototype.createComputeContext = function (): IComputeContext | undefined {
        return new WebGPUComputeContext(this._device, this._cacheSampler);
    };

    WebGPUEngine.prototype.createComputeEffect = function (
        baseName: string | (IComputeShaderPath & { computeToken?: string }),
        options: IComputeEffectCreationOptions
    ): ComputeEffect {
        const compute = typeof baseName === "string" ? baseName : baseName.computeToken || baseName.computeSource || baseName.computeElement || baseName.compute;

        const name = compute + "@" + options.defines + (options.useExplicitComputePipelineLayout ? "@explicitComputePipelineLayout" : "");
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
            const explicitLayout = effect._useExplicitComputePipelineLayout
                ? _GetComputePipelineLayout(this._device, bindings, bindingsMapping, contextPipeline.sources?.compute ?? "", this._caps.textureFloatLinearFiltering)
                : null;
            computeContext.clear();
            contextPipeline.computePipeline = this._device.createComputePipeline({
                layout: explicitLayout ?? WebGPUConstants.AutoLayoutMode.Auto,
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
}
