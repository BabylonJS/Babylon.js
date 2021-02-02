import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { Nullable } from "../../types";

/** @hidden */
export class WebGPUBindGroupCacheNode {
    public values: { [id: number]: WebGPUBindGroupCacheNode };
    public bindGroups: GPUBindGroup[];

    constructor() {
        this.values = {};
    }
}

/** @hidden */
interface IWebGPUEffectContextSamplerCache {
    samplerBinding: number;
    firstTextureName: string;
}

/** @hidden */
interface IWebGPUEffectContextTextureCache {
    textureBinding: number;
    texture: InternalTexture;
}

/** @hidden */
export interface WebGPUEffectContext {
    samplers: { [name: string]: Nullable<IWebGPUEffectContextSamplerCache> };
    textures: { [name: string]: Nullable<IWebGPUEffectContextTextureCache> };
    bindGroupsCache: WebGPUBindGroupCacheNode;
}
