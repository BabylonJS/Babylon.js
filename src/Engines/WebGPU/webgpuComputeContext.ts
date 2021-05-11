import { StorageBuffer } from "../../Buffers/storageBuffer";
import { IComputeContext } from "../../Compute/IComputeContext";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
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

    public getBindGroups(bindings: ComputeBindingList, computePipeline: GPUComputePipeline, bindingsMapping?: ComputeBindingMapping): GPUBindGroup[] {
        if (!bindingsMapping) {
            throw new Error("WebGPUComputeContext.getBindGroups: bindingsMapping is required until browsers support reflection for wgsl shaders!");
        }
        if (this._bindGroups.length === 0) {
            const bindGroupEntries: GPUBindGroupEntry[][] = [];
            for (const key in bindings) {
                const binding = bindings[key],
                      location = bindingsMapping[key],
                      group = location.group,
                      index = location.binding,
                      type = binding.type,
                      object = binding.object;

                let entries = bindGroupEntries[group];
                if (!entries) {
                    entries = bindGroupEntries[group] = [];
                }

                switch (type) {
                    case ComputeBindingType.Texture: {
                        const texture = object as BaseTexture;
                        const hardwareTexture = texture._texture!._hardwareTexture as WebGPUHardwareTexture;
                        entries.push({
                            binding: index - 1,
                            resource: this._cacheSampler.getSampler(texture._texture!),
                        });
                        entries.push({
                            binding: index,
                            resource: hardwareTexture.view!,
                        });
                        break;
                    }

                    case ComputeBindingType.StorageTexture: {
                        const texture = object as BaseTexture;
                        const hardwareTexture = texture._texture!._hardwareTexture as WebGPUHardwareTexture;
                        if ((hardwareTexture.textureAdditionalUsages & WebGPUConstants.TextureUsage.Storage) === 0) {
                            Logger.Error(`computeDispatch: The texture (name=${texture.name}, uniqueId=${texture.uniqueId}) is not a storage texture!`, 50);
                        }
                        entries.push({
                            binding: index,
                            resource: hardwareTexture.view!,
                        });
                        break;
                    }

                    case ComputeBindingType.UniformBuffer: {
                        const buffer = object as UniformBuffer;
                        const dataBuffer = buffer.getBuffer()!;
                        const webgpuBuffer = dataBuffer.underlyingResource as GPUBuffer;
                        entries.push({
                            binding: index,
                            resource: {
                                buffer: webgpuBuffer,
                                offset: 0,
                                size: dataBuffer.capacity,
                            }
                        });
                        break;
                    }

                    case ComputeBindingType.StorageBuffer: {
                        const buffer = object as StorageBuffer;
                        const dataBuffer = buffer.getBuffer();
                        const webgpuBuffer = dataBuffer.underlyingResource as GPUBuffer;
                        entries.push({
                            binding: index,
                            resource: {
                                buffer: webgpuBuffer,
                                offset: 0,
                                size: dataBuffer.capacity,
                            }
                        });
                        break;
                    }
                }
            }

            for (let i = 0; i < bindGroupEntries.length; ++i) {
                const entries = bindGroupEntries[i];
                if (!entries) {
                    this._bindGroups[i] = undefined as any;
                    continue;
                }
                this._bindGroups[i] = this._device.createBindGroup({
                    layout: computePipeline.getBindGroupLayout(i),
                    entries,
                });
            }

            this._bindGroups.length = bindGroupEntries.length;
        }

        return this._bindGroups;
    }

    constructor(device: GPUDevice, cacheSampler: WebGPUCacheSampler) {
        this._device = device;
        this._cacheSampler = cacheSampler;
        this.uniqueId = WebGPUComputeContext._Counter++;
        this.clear();
    }

    public clear(): void {
        this._bindGroups = [];
    }
}