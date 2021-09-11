import { ExternalTexture } from "../../Materials/Textures/externalTexture";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { Sampler } from "../../Materials/Textures/sampler";
import { WebGPUDataBuffer } from "../../Meshes/WebGPU/webgpuDataBuffer";
import { Nullable } from "../../types";
import { Constants } from "../constants";
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
    isFloatTexture: boolean;
    isExternalTexture: boolean;
}

/** @hidden */
export class WebGPUMaterialContext implements IMaterialContext {
    private static _Counter = 0;

    public uniqueId: number;
    public numFloatTextures: number;
    public numExternalTextures: number;
    public samplers: { [name: string]: Nullable<IWebGPUMaterialContextSamplerCache> };
    public textures: { [name: string]: Nullable<IWebGPUMaterialContextTextureCache> };
    public uniformBuffers: { [name: string]: WebGPUDataBuffer };

    constructor() {
        this.samplers = {};
        this.textures = {};
        this.uniformBuffers = {};
        this.uniqueId = WebGPUMaterialContext._Counter++;
        this.numFloatTextures = 0;
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
            this.textures[name] = textureCache = { texture, isFloatTexture: false, isExternalTexture: false };
        }

        if (textureCache.isExternalTexture) {
            this.numExternalTextures--;
        }
        if (textureCache.isFloatTexture) {
            this.numFloatTextures--;
        }

        if (texture) {
            textureCache.isFloatTexture = texture.type === Constants.TEXTURETYPE_FLOAT;
            textureCache.isExternalTexture = ExternalTexture.IsExternalTexture(texture);
            if (textureCache.isFloatTexture) {
                this.numFloatTextures++;
            }
            if (textureCache.isExternalTexture) {
                this.numExternalTextures++;
            }
        } else {
            textureCache.isFloatTexture = false;
            textureCache.isExternalTexture = false;
        }

        textureCache.texture = texture;
    }

    public setUniformBuffer(name: string, buffer: WebGPUDataBuffer): void {
        this.uniformBuffers[name] = buffer;
    }
}
