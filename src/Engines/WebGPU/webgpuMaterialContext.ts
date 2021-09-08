import { ExternalTexture } from "../../Materials/Textures/externalTexture";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { Sampler } from "../../Materials/Textures/sampler";
import { Nullable } from "../../types";
import { IMaterialContext } from "../IMaterialContext";
import { WebGPUCacheSampler } from "./webgpuCacheSampler";

/** @hidden */
interface IWebGPUMaterialContextSamplerCache {
    sampler: Nullable<Sampler>;
    hashCode: number;
}

/** @hidden */
interface IWebGPUMaterialContextTextureCache {
    texture: Nullable<InternalTexture | ExternalTexture>;
    isExternalTexture: boolean;
}

/** @hidden */
export class WebGPUMaterialContext implements IMaterialContext {
    private static _Counter = 0;

    public uniqueId: number;
    public numExternalTextures: number;
    public samplers: { [name: string]: Nullable<IWebGPUMaterialContextSamplerCache> };
    public textures: { [name: string]: Nullable<IWebGPUMaterialContextTextureCache> };

    constructor() {
        this.samplers = {};
        this.textures = {};
        this.uniqueId = WebGPUMaterialContext._Counter++;
        this.numExternalTextures = 0;
    }

    public setSampler(name: string, sampler: Nullable<Sampler>): void {
        let samplerCache = this.samplers[name];
        if (!samplerCache) {
            this.samplers[name] = samplerCache = { sampler, hashCode: 0 };
        }

        samplerCache.sampler = sampler;
        samplerCache.hashCode = sampler ? WebGPUCacheSampler.GetSamplerHashCode(sampler) : 0;
    }

    public setTexture(name: string, texture: Nullable<InternalTexture | ExternalTexture>): void {
        let textureCache = this.textures[name];
        if (!textureCache) {
            this.textures[name] = textureCache = { texture, isExternalTexture: false };
        }

        if (texture) {
            textureCache.isExternalTexture = ExternalTexture.IsExternalTexture(texture);
            if (textureCache.isExternalTexture) {
                this.numExternalTextures++;
            }
        } else if (textureCache.isExternalTexture) {
            this.numExternalTextures--;
        }

        textureCache.texture = texture;
    }
}
