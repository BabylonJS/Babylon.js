import { Logger } from "../../Misc/logger";
import { WebGPUDataBuffer } from "../../Meshes/WebGPU/webgpuDataBuffer";
import { WebGPUCacheSampler } from "./webgpuCacheSampler";
import { WebGPUMaterialContext } from "./webgpuMaterialContext";
import { WebGPUPipelineContext } from "./webgpuPipelineContext";
import { WebGPUEngine } from "../webgpuEngine";
import { WebGPUHardwareTexture } from "./webgpuHardwareTexture";

class WebGPUBindGroupCacheNode {
    public values: { [id: number]: WebGPUBindGroupCacheNode };
    public bindGroups: GPUBindGroup[];

    constructor() {
        this.values = {};
    }
}

/** @hidden */
export class WebGPUCacheBindGroups {

    public static NumBindGroupsCreatedTotal = 0;
    public static NumBindGroupsCreatedLastFrame = 0;

    private static _Cache: WebGPUBindGroupCacheNode = new WebGPUBindGroupCacheNode();
    private static _CacheTextures: { [id: number]: WebGPUBindGroupCacheNode[] } = {};

    private static _NumBindGroupsCreatedCurrentFrame = 0;

    private _device: GPUDevice;
    private _cacheSampler: WebGPUCacheSampler;
    private _engine: WebGPUEngine;

    public disabled = false;

    constructor(device: GPUDevice, cacheSampler: WebGPUCacheSampler, engine: WebGPUEngine) {
        this._device = device;
        this._cacheSampler = cacheSampler;
        this._engine = engine;
    }

    public endFrame(): void {
        WebGPUCacheBindGroups.NumBindGroupsCreatedLastFrame = WebGPUCacheBindGroups._NumBindGroupsCreatedCurrentFrame;
        WebGPUCacheBindGroups._NumBindGroupsCreatedCurrentFrame = 0;
    }

    /**
     * Cache is currently based on the uniform buffers and textures used by the binding groups.
     * In Babylon we don't have a separate standalone sampler object, the sampler properties (wrapU, wrapV, samplingMode, ...) are held by the (internal) texture itself.
     * When one of these properties change for a texture (which normally does not happen often), we remove the corresponding entries from the cache (that is, all the entries
     * that reference this texture, hence the need for _CacheTextures - see WebGPUCacheBindGroups.clearTextureEntries and WebGPUMaterialContext.setTexture)
     * Note also that all uniform buffers have an offset of 0 in Babylon and we don't have a use case where we would have the same buffer used with different capacity values:
     * that means we don't need to factor in the offset/size of the buffer in the cache, only the id
     */
    public getBindGroups(webgpuPipelineContext: WebGPUPipelineContext, materialContext: WebGPUMaterialContext, uniformsBuffers: { [name: string]: WebGPUDataBuffer }): GPUBindGroup[] {
        let bindGroups: GPUBindGroup[] | undefined = undefined;
        let node = WebGPUCacheBindGroups._Cache;

        if (!this.disabled) {
            for (const bufferName of webgpuPipelineContext.shaderProcessingContext.uniformBufferNames) {
                const uboId = uniformsBuffers[bufferName].uniqueId;
                let nextNode = node.values[uboId];
                if (!nextNode) {
                    nextNode = new WebGPUBindGroupCacheNode();
                    node.values[uboId] = nextNode;
                }
                node = nextNode;
            }

            for (const samplerName of webgpuPipelineContext.shaderProcessingContext.samplerNames) {
                const textureId = materialContext.textures[samplerName]?.texture?.uniqueId ?? 0;
                let nextNode = node.values[textureId];
                if (!nextNode) {
                    nextNode = new WebGPUBindGroupCacheNode();
                    node.values[textureId] = nextNode;
                    let textureEntries = WebGPUCacheBindGroups._CacheTextures[textureId];
                    if (!textureEntries) {
                        textureEntries = WebGPUCacheBindGroups._CacheTextures[textureId] = [];
                    }
                    textureEntries.push(node);
                }
                node = nextNode;
            }

            bindGroups = node.bindGroups;
        }

        if (bindGroups) {
            return bindGroups;
        }

        bindGroups = [];

        if (!this.disabled) {
            node.bindGroups = bindGroups;
        }

        WebGPUCacheBindGroups.NumBindGroupsCreatedTotal++;
        WebGPUCacheBindGroups._NumBindGroupsCreatedCurrentFrame++;

        const bindGroupLayouts = webgpuPipelineContext.bindGroupLayouts;

        for (let i = 0; i < webgpuPipelineContext.shaderProcessingContext.orderedUBOsAndSamplers.length; i++) {
            const setDefinition = webgpuPipelineContext.shaderProcessingContext.orderedUBOsAndSamplers[i];
            if (setDefinition === undefined) {
                let groupLayout = bindGroupLayouts[i];
                bindGroups[i] = this._device.createBindGroup({
                    layout: groupLayout,
                    entries: [],
                });
                continue;
            }

            const entries: GPUBindGroupEntry[] = [];
            for (let j = 0; j < setDefinition.length; j++) {
                const bindingDefinition = webgpuPipelineContext.shaderProcessingContext.orderedUBOsAndSamplers[i][j];
                if (bindingDefinition === undefined) {
                    continue;
                }

                if (bindingDefinition.isSampler) {
                    const bindingInfo = materialContext.samplers[bindingDefinition.name];
                    if (bindingInfo) {
                        const texture = materialContext.textures[bindingInfo.firstTextureName]?.texture;
                        if (!texture) {
                            Logger.Error(`Could not create the gpu sampler "${bindingDefinition.name}" because no texture can be looked up for the name "${bindingInfo.firstTextureName}". bindingInfo=${JSON.stringify(bindingInfo)}, materialContext=${JSON.stringify(materialContext, (key: string, value: any) => key === 'texture' || key === '_cacheBindGroups' ? '<no dump>' : value)}`, 50);
                            continue;
                        }
                        entries.push({
                            binding: j,
                            resource: this._cacheSampler.getSampler(texture),
                        });
                    } else {
                        Logger.Error(`Sampler "${bindingDefinition.name}" could not be bound. bindingDefinition=${JSON.stringify(bindingDefinition)}, materialContext=${JSON.stringify(materialContext, (key: string, value: any) => key === 'texture' || key === '_cacheBindGroups' ? '<no dump>' : value)}`, 50);
                    }
                } else if (bindingDefinition.isTexture) {
                    const bindingInfo = materialContext.textures[bindingDefinition.name];
                    if (bindingInfo) {
                        if (this._engine.dbgSanityChecks && bindingInfo.texture === null) {
                            Logger.Error(`Trying to bind a null texture! bindingDefinition=${JSON.stringify(bindingDefinition)}, bindingInfo=${JSON.stringify(bindingInfo, (key: string, value: any) => key === 'texture' ? '<no dump>' : value)}`, 50);
                            continue;
                        }
                        const hardwareTexture = bindingInfo.texture._hardwareTexture as WebGPUHardwareTexture;

                        if (this._engine.dbgSanityChecks && !hardwareTexture.view) {
                            Logger.Error(`Trying to bind a null gpu texture! bindingDefinition=${JSON.stringify(bindingDefinition)}, bindingInfo=${JSON.stringify(bindingInfo, (key: string, value: any) => key === 'texture' ? '<no dump>' : value)}, isReady=${bindingInfo.texture.isReady}`, 50);
                            continue;
                        }

                        entries.push({
                            binding: j,
                            resource: hardwareTexture.view!,
                        });
                    } else {
                        Logger.Error(`Texture "${bindingDefinition.name}" could not be bound. bindingDefinition=${JSON.stringify(bindingDefinition)}, materialContext=${JSON.stringify(materialContext, (key: string, value: any) => key === 'texture' || key === '_cacheBindGroups' ? '<no dump>' : value)}`, 50);
                    }
                } else {
                    const dataBuffer = uniformsBuffers[bindingDefinition.name];
                    if (dataBuffer) {
                        const webgpuBuffer = dataBuffer.underlyingResource as GPUBuffer;
                        entries.push({
                            binding: j,
                            resource: {
                                buffer: webgpuBuffer,
                                offset: 0,
                                size: dataBuffer.capacity,
                            },
                        });
                    } else {
                        Logger.Error(`Can't find UBO "${bindingDefinition.name}". bindingDefinition=${JSON.stringify(bindingDefinition)}, _uniformsBuffers=${JSON.stringify(uniformsBuffers)}`, 50);
                    }
                }
            }

            if (entries.length > 0) {
                let groupLayout = bindGroupLayouts[i];
                bindGroups[i] = this._device.createBindGroup({
                    layout: groupLayout,
                    entries,
                });
            }
        }

        return bindGroups;
    }

    public clearTextureEntries(textureId: number): void {
        let textureEntries = WebGPUCacheBindGroups._CacheTextures[textureId];
        if (textureEntries) {
            for (let i = 0; i < textureEntries.length; ++i) {
                const node = textureEntries[i];
                this._clearTextureNode(node, textureId.toString());
                delete textureEntries[i].values[textureId];
            }
            delete WebGPUCacheBindGroups._CacheTextures[textureId];
        }
    }

    private _clearTextureNode(node: WebGPUBindGroupCacheNode, excludedId: string): void {
        for (const id in node.values) {
            if (id !== excludedId) {
                this._clearTextureNode(node.values[id], excludedId);
                const entries = WebGPUCacheBindGroups._CacheTextures[id];
                if (entries) {
                    for (let i = 0; i < entries.length; ++i) {
                        if (entries[i] === node) {
                            entries.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }
    }
}
