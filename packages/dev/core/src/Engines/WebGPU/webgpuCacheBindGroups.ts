/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
import { Logger } from "../../Misc/logger";
import type { WebGPUCacheSampler } from "./webgpuCacheSampler";
import type { WebGPUMaterialContext } from "./webgpuMaterialContext";
import type { WebGPUPipelineContext } from "./webgpuPipelineContext";
import type { WebGPUEngine } from "../webgpuEngine";
import type { WebGPUHardwareTexture } from "./webgpuHardwareTexture";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { ExternalTexture } from "../../Materials/Textures/externalTexture";
import type { WebGPUDrawContext } from "./webgpuDrawContext";

class WebGPUBindGroupCacheNode {
    public values: { [id: number]: WebGPUBindGroupCacheNode };
    public bindGroups: GPUBindGroup[];

    constructor() {
        this.values = {};
    }
}

/** @internal */
export class WebGPUCacheBindGroups {
    public static NumBindGroupsCreatedTotal = 0;
    public static NumBindGroupsCreatedLastFrame = 0;
    public static NumBindGroupsLookupLastFrame = 0;
    public static NumBindGroupsNoLookupLastFrame = 0;

    private static _Cache: WebGPUBindGroupCacheNode = new WebGPUBindGroupCacheNode();

    private static _NumBindGroupsCreatedCurrentFrame = 0;
    private static _NumBindGroupsLookupCurrentFrame = 0;
    private static _NumBindGroupsNoLookupCurrentFrame = 0;

    private _device: GPUDevice;
    private _cacheSampler: WebGPUCacheSampler;
    private _engine: WebGPUEngine;

    public disabled = false;

    public static get Statistics() {
        return {
            totalCreated: WebGPUCacheBindGroups.NumBindGroupsCreatedTotal,
            lastFrameCreated: WebGPUCacheBindGroups.NumBindGroupsCreatedLastFrame,
            lookupLastFrame: WebGPUCacheBindGroups.NumBindGroupsLookupLastFrame,
            noLookupLastFrame: WebGPUCacheBindGroups.NumBindGroupsNoLookupLastFrame,
        };
    }

    public static ResetCache() {
        WebGPUCacheBindGroups._Cache = new WebGPUBindGroupCacheNode();
        WebGPUCacheBindGroups.NumBindGroupsCreatedTotal = 0;
        WebGPUCacheBindGroups.NumBindGroupsCreatedLastFrame = 0;
        WebGPUCacheBindGroups.NumBindGroupsLookupLastFrame = 0;
        WebGPUCacheBindGroups.NumBindGroupsNoLookupLastFrame = 0;
        WebGPUCacheBindGroups._NumBindGroupsCreatedCurrentFrame = 0;
        WebGPUCacheBindGroups._NumBindGroupsLookupCurrentFrame = 0;
        WebGPUCacheBindGroups._NumBindGroupsNoLookupCurrentFrame = 0;
    }

    constructor(device: GPUDevice, cacheSampler: WebGPUCacheSampler, engine: WebGPUEngine) {
        this._device = device;
        this._cacheSampler = cacheSampler;
        this._engine = engine;
    }

    public endFrame(): void {
        WebGPUCacheBindGroups.NumBindGroupsCreatedLastFrame = WebGPUCacheBindGroups._NumBindGroupsCreatedCurrentFrame;
        WebGPUCacheBindGroups.NumBindGroupsLookupLastFrame = WebGPUCacheBindGroups._NumBindGroupsLookupCurrentFrame;
        WebGPUCacheBindGroups.NumBindGroupsNoLookupLastFrame = WebGPUCacheBindGroups._NumBindGroupsNoLookupCurrentFrame;
        WebGPUCacheBindGroups._NumBindGroupsCreatedCurrentFrame = 0;
        WebGPUCacheBindGroups._NumBindGroupsLookupCurrentFrame = 0;
        WebGPUCacheBindGroups._NumBindGroupsNoLookupCurrentFrame = 0;
    }

    /**
     * Cache is currently based on the uniform/storage buffers, samplers and textures used by the binding groups.
     * Note that all uniform buffers have an offset of 0 in Babylon and we don't have a use case where we would have the same buffer used with different capacity values:
     * that means we don't need to factor in the offset/size of the buffer in the cache, only the id
     * @param webgpuPipelineContext
     * @param drawContext
     * @param materialContext
     * @returns a bind group array
     */
    public getBindGroups(webgpuPipelineContext: WebGPUPipelineContext, drawContext: WebGPUDrawContext, materialContext: WebGPUMaterialContext): GPUBindGroup[] {
        let bindGroups: GPUBindGroup[] | undefined = undefined;
        let node = WebGPUCacheBindGroups._Cache;

        const cacheIsDisabled = this.disabled || materialContext.forceBindGroupCreation;
        if (!cacheIsDisabled) {
            if (!drawContext.isDirty(materialContext.updateId) && !materialContext.isDirty) {
                WebGPUCacheBindGroups._NumBindGroupsNoLookupCurrentFrame++;
                return drawContext.bindGroups!;
            }

            for (const bufferName of webgpuPipelineContext.shaderProcessingContext.bufferNames) {
                const uboId = drawContext.buffers[bufferName]?.uniqueId ?? 0;
                let nextNode = node.values[uboId];
                if (!nextNode) {
                    nextNode = new WebGPUBindGroupCacheNode();
                    node.values[uboId] = nextNode;
                }
                node = nextNode;
            }

            for (const samplerName of webgpuPipelineContext.shaderProcessingContext.samplerNames) {
                const samplerHashCode = materialContext.samplers[samplerName]?.hashCode ?? 0;
                let nextNode = node.values[samplerHashCode];
                if (!nextNode) {
                    nextNode = new WebGPUBindGroupCacheNode();
                    node.values[samplerHashCode] = nextNode;
                }
                node = nextNode;
            }

            for (const textureName of webgpuPipelineContext.shaderProcessingContext.textureNames) {
                const textureId = materialContext.textures[textureName]?.texture?.uniqueId ?? 0;
                let nextNode = node.values[textureId];
                if (!nextNode) {
                    nextNode = new WebGPUBindGroupCacheNode();
                    node.values[textureId] = nextNode;
                }
                node = nextNode;
            }

            bindGroups = node.bindGroups;
        }

        drawContext.resetIsDirty(materialContext.updateId);
        materialContext.isDirty = false;

        if (bindGroups) {
            drawContext.bindGroups = bindGroups;
            WebGPUCacheBindGroups._NumBindGroupsLookupCurrentFrame++;
            return bindGroups;
        }

        bindGroups = [];
        drawContext.bindGroups = bindGroups;

        if (!cacheIsDisabled) {
            node.bindGroups = bindGroups;
        }

        WebGPUCacheBindGroups.NumBindGroupsCreatedTotal++;
        WebGPUCacheBindGroups._NumBindGroupsCreatedCurrentFrame++;

        const bindGroupLayouts = webgpuPipelineContext.bindGroupLayouts[materialContext.textureState];
        for (let i = 0; i < webgpuPipelineContext.shaderProcessingContext.bindGroupLayoutEntries.length; i++) {
            const setDefinition = webgpuPipelineContext.shaderProcessingContext.bindGroupLayoutEntries[i];

            const entries = webgpuPipelineContext.shaderProcessingContext.bindGroupEntries[i];
            for (let j = 0; j < setDefinition.length; j++) {
                const entry = webgpuPipelineContext.shaderProcessingContext.bindGroupLayoutEntries[i][j];
                const entryInfo = webgpuPipelineContext.shaderProcessingContext.bindGroupLayoutEntryInfo[i][entry.binding];
                const name = entryInfo.nameInArrayOfTexture ?? entryInfo.name;

                if (entry.sampler) {
                    const bindingInfo = materialContext.samplers[name];
                    if (bindingInfo) {
                        const sampler = bindingInfo.sampler;
                        if (!sampler) {
                            if (this._engine.dbgSanityChecks) {
                                Logger.Error(
                                    `Trying to bind a null sampler! entry=${JSON.stringify(entry)}, name=${name}, bindingInfo=${JSON.stringify(
                                        bindingInfo,
                                        (key: string, value: any) => (key === "texture" ? "<no dump>" : value)
                                    )}, materialContext.uniqueId=${materialContext.uniqueId}`,
                                    50
                                );
                            }
                            continue;
                        }
                        entries[j].resource = this._cacheSampler.getSampler(sampler, false, bindingInfo.hashCode, sampler.label);
                    } else {
                        Logger.Error(
                            `Sampler "${name}" could not be bound. entry=${JSON.stringify(entry)}, materialContext=${JSON.stringify(materialContext, (key: string, value: any) =>
                                key === "texture" || key === "sampler" ? "<no dump>" : value
                            )}`,
                            50
                        );
                    }
                } else if (entry.texture || entry.storageTexture) {
                    const bindingInfo = materialContext.textures[name];
                    if (bindingInfo) {
                        if (this._engine.dbgSanityChecks && bindingInfo.texture === null) {
                            Logger.Error(
                                `Trying to bind a null texture! entry=${JSON.stringify(entry)}, bindingInfo=${JSON.stringify(bindingInfo, (key: string, value: any) =>
                                    key === "texture" ? "<no dump>" : value
                                )}, materialContext.uniqueId=${materialContext.uniqueId}`,
                                50
                            );
                            continue;
                        }
                        const hardwareTexture = (bindingInfo.texture as InternalTexture)._hardwareTexture as WebGPUHardwareTexture;

                        if (
                            this._engine.dbgSanityChecks &&
                            (!hardwareTexture || (entry.texture && !hardwareTexture.view) || (entry.storageTexture && !hardwareTexture.viewForWriting))
                        ) {
                            Logger.Error(
                                `Trying to bind a null gpu texture or view! entry=${JSON.stringify(entry)}, name=${name}, bindingInfo=${JSON.stringify(
                                    bindingInfo,
                                    (key: string, value: any) => (key === "texture" ? "<no dump>" : value)
                                )}, isReady=${bindingInfo.texture?.isReady}, materialContext.uniqueId=${materialContext.uniqueId}`,
                                50
                            );
                            continue;
                        }

                        entries[j].resource = entry.storageTexture ? hardwareTexture.viewForWriting! : hardwareTexture.view!;
                    } else {
                        Logger.Error(
                            `Texture "${name}" could not be bound. entry=${JSON.stringify(entry)}, materialContext=${JSON.stringify(materialContext, (key: string, value: any) =>
                                key === "texture" || key === "sampler" ? "<no dump>" : value
                            )}`,
                            50
                        );
                    }
                } else if (entry.externalTexture) {
                    const bindingInfo = materialContext.textures[name];
                    if (bindingInfo) {
                        if (this._engine.dbgSanityChecks && bindingInfo.texture === null) {
                            Logger.Error(
                                `Trying to bind a null external texture! entry=${JSON.stringify(entry)}, name=${name}, bindingInfo=${JSON.stringify(
                                    bindingInfo,
                                    (key: string, value: any) => (key === "texture" ? "<no dump>" : value)
                                )}, materialContext.uniqueId=${materialContext.uniqueId}`,
                                50
                            );
                            continue;
                        }
                        const externalTexture = (bindingInfo.texture as ExternalTexture).underlyingResource;

                        if (this._engine.dbgSanityChecks && !externalTexture) {
                            Logger.Error(
                                `Trying to bind a null gpu external texture! entry=${JSON.stringify(entry)}, name=${name}, bindingInfo=${JSON.stringify(
                                    bindingInfo,
                                    (key: string, value: any) => (key === "texture" ? "<no dump>" : value)
                                )}, isReady=${bindingInfo.texture?.isReady}, materialContext.uniqueId=${materialContext.uniqueId}`,
                                50
                            );
                            continue;
                        }

                        entries[j].resource = this._device.importExternalTexture({ source: externalTexture });
                    } else {
                        Logger.Error(
                            `Texture "${name}" could not be bound. entry=${JSON.stringify(entry)}, materialContext=${JSON.stringify(materialContext, (key: string, value: any) =>
                                key === "texture" || key === "sampler" ? "<no dump>" : value
                            )}`,
                            50
                        );
                    }
                } else if (entry.buffer) {
                    const dataBuffer = drawContext.buffers[name];
                    if (dataBuffer) {
                        const webgpuBuffer = dataBuffer.underlyingResource as GPUBuffer;
                        (entries[j].resource as GPUBufferBinding).buffer = webgpuBuffer;
                        (entries[j].resource as GPUBufferBinding).size = dataBuffer.capacity;
                    } else {
                        Logger.Error(
                            `Can't find buffer "${name}". entry=${JSON.stringify(entry)}, buffers=${JSON.stringify(drawContext.buffers)}, drawContext.uniqueId=${
                                drawContext.uniqueId
                            }`,
                            50
                        );
                    }
                }
            }

            const groupLayout = bindGroupLayouts[i];
            bindGroups[i] = this._device.createBindGroup({
                layout: groupLayout,
                entries,
            });
        }

        return bindGroups;
    }
}
