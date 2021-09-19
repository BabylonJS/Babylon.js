import { StorageBuffer } from "../../Buffers/storageBuffer";
import { IComputeContext } from "../../Compute/IComputeContext";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { TextureSampler } from "../../Materials/Textures/textureSampler";
import { UniformBuffer } from "../../Materials/uniformBuffer";
import { Logger } from "../../Misc/logger";
import { ComputeBindingList, ComputeBindingMapping, ComputeBindingType } from "../Extensions/engine.computeShader";
import { WebGPUCacheSampler } from "./webgpuCacheSampler";
import * as WebGPUConstants from './webgpuConstants';
import { WebGPUHardwareTexture } from "./webgpuHardwareTexture";

/** @hidden */
export class WebGPUComputeContext implements IComputeContext {
    private static _Counter = 0;

    public readonly uniqueId: number;

    private _device: GPUDevice;
    private _cacheSampler: WebGPUCacheSampler;
    private _bindGroups: GPUBindGroup[];
    private _bindGroupEntries: GPUBindGroupEntry[][];

    public getBindGroups(bindings: ComputeBindingList, computePipeline: GPUComputePipeline, bindingsMapping?: ComputeBindingMapping): GPUBindGroup[] {
        if (!bindingsMapping) {
            throw new Error("WebGPUComputeContext.getBindGroups: bindingsMapping is required until browsers support reflection for wgsl shaders!");
        }
        if (this._bindGroups.length === 0) {
            const bindGroupEntriesExist = this._bindGroupEntries.length > 0;
            for (const key in bindings) {
                const binding = bindings[key],
                    location = bindingsMapping[key],
                    group = location.group,
                    index = location.binding,
                    type = binding.type,
                    object = binding.object;
                let indexInGroupEntries = binding.indexInGroupEntries;

                let entries = this._bindGroupEntries[group];
                if (!entries) {
                    entries = this._bindGroupEntries[group] = [];
                }

                switch (type) {
                    case ComputeBindingType.Sampler: {
                        const sampler = object as TextureSampler;
                        if (indexInGroupEntries !== undefined && bindGroupEntriesExist) {
                            entries[indexInGroupEntries].resource = this._cacheSampler.getSampler(sampler);
                        } else {
                            binding.indexInGroupEntries = entries.length;
                            entries.push({
                                binding: index,
                                resource: this._cacheSampler.getSampler(sampler),
                            });
                        }
                        break;
                    }

                    case ComputeBindingType.Texture:
                    case ComputeBindingType.TextureWithoutSampler: {
                        const texture = object as BaseTexture;
                        const hardwareTexture = texture._texture!._hardwareTexture as WebGPUHardwareTexture;
                        if (indexInGroupEntries !== undefined && bindGroupEntriesExist) {
                            if (type === ComputeBindingType.Texture) {
                                entries[indexInGroupEntries++].resource = this._cacheSampler.getSampler(texture._texture!);
                            }
                            entries[indexInGroupEntries].resource = hardwareTexture.view!;
                        } else {
                            binding.indexInGroupEntries = entries.length;
                            if (type === ComputeBindingType.Texture) {
                                entries.push({
                                    binding: index - 1,
                                    resource: this._cacheSampler.getSampler(texture._texture!),
                                });
                            }
                            entries.push({
                                binding: index,
                                resource: hardwareTexture.view!,
                            });
                        }
                        break;
                    }

                    case ComputeBindingType.StorageTexture: {
                        const texture = object as BaseTexture;
                        const hardwareTexture = texture._texture!._hardwareTexture as WebGPUHardwareTexture;
                        if ((hardwareTexture.textureAdditionalUsages & WebGPUConstants.TextureUsage.StorageBinding) === 0) {
                            Logger.Error(`computeDispatch: The texture (name=${texture.name}, uniqueId=${texture.uniqueId}) is not a storage texture!`, 50);
                        }
                        if (indexInGroupEntries !== undefined && bindGroupEntriesExist) {
                            entries[indexInGroupEntries].resource = hardwareTexture.view!;
                        } else {
                            binding.indexInGroupEntries = entries.length;
                            entries.push({
                                binding: index,
                                resource: hardwareTexture.view!,
                            });
                        }
                        break;
                    }

                    case ComputeBindingType.UniformBuffer:
                    case ComputeBindingType.StorageBuffer: {
                        const buffer = type === ComputeBindingType.UniformBuffer ? object as UniformBuffer : object as StorageBuffer;
                        const dataBuffer = buffer.getBuffer()!;
                        const webgpuBuffer = dataBuffer.underlyingResource as GPUBuffer;
                        if (indexInGroupEntries !== undefined && bindGroupEntriesExist) {
                            (entries[indexInGroupEntries].resource as GPUBufferBinding).buffer = webgpuBuffer;
                            (entries[indexInGroupEntries].resource as GPUBufferBinding).size = dataBuffer.capacity;
                        } else {
                            binding.indexInGroupEntries = entries.length;
                            entries.push({
                                binding: index,
                                resource: {
                                    buffer: webgpuBuffer,
                                    offset: 0,
                                    size: dataBuffer.capacity,
                                }
                            });
                        }
                        break;
                    }
                }
            }

            for (let i = 0; i < this._bindGroupEntries.length; ++i) {
                const entries = this._bindGroupEntries[i];
                if (!entries) {
                    this._bindGroups[i] = undefined as any;
                    continue;
                }
                this._bindGroups[i] = this._device.createBindGroup({
                    layout: computePipeline.getBindGroupLayout(i),
                    entries,
                });
            }

            this._bindGroups.length = this._bindGroupEntries.length;
        }

        return this._bindGroups;
    }

    constructor(device: GPUDevice, cacheSampler: WebGPUCacheSampler) {
        this._device = device;
        this._cacheSampler = cacheSampler;
        this.uniqueId = WebGPUComputeContext._Counter++;
        this._bindGroupEntries = [];
        this.clear();
    }

    public clear(): void {
        this._bindGroups = [];
        // Don't reset _bindGroupEntries if they have already been created, they are still ok even if we have to clear _bindGroups (the layout of the compute shader can't change once created)
    }
}