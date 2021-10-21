import { ExternalTexture } from "../../Materials/Textures/externalTexture";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { TextureSampler } from "../../Materials/Textures/textureSampler";
import { Nullable } from "../../types";
import { Constants } from "../constants";
import { IMaterialContext } from "../IMaterialContext";
import { WebGPUCacheSampler } from "./webgpuCacheSampler";

/** @hidden */
interface IWebGPUMaterialContextSamplerCache {
    sampler: Nullable<TextureSampler>;
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
    public isDirty: boolean;
    public samplers: { [name: string]: Nullable<IWebGPUMaterialContextSamplerCache> };
    public textures: { [name: string]: Nullable<IWebGPUMaterialContextTextureCache> };

    public get forceBindGroupCreation() {
        // If there is at least one external texture to bind, we must recreate the bind groups each time
        // because we need to retrieve a new texture each frame (by calling device.importExternalTexture)
        return this._numExternalTextures > 0;
    }

    public get hasFloatTextures() {
        return this._numFloatTextures > 0;
    }

    protected _numFloatTextures: number;
    protected _numExternalTextures: number;

    constructor() {
        this.uniqueId = WebGPUMaterialContext._Counter++;
        this.reset();
    }

    public reset(): void {
        this.samplers = {};
        this.textures = {};
        this.isDirty = true;
        this._numFloatTextures = 0;
        this._numExternalTextures = 0;
    }

    public setSampler(name: string, sampler: Nullable<TextureSampler>): void {
        let samplerCache = this.samplers[name];
        let currentHashCode = -1;
        if (!samplerCache) {
            this.samplers[name] = samplerCache = { sampler, hashCode: 0 };
        } else {
            currentHashCode = samplerCache.hashCode;
        }

        samplerCache.sampler = sampler;
        samplerCache.hashCode = sampler ? WebGPUCacheSampler.GetSamplerHashCode(sampler) : 0;

        this.isDirty ||= currentHashCode !== samplerCache.hashCode;
    }

    public setTexture(name: string, texture: Nullable<InternalTexture | ExternalTexture>): void {
        let textureCache = this.textures[name];
        let currentTextureId = -1;
        if (!textureCache) {
            this.textures[name] = textureCache = { texture, isFloatTexture: false, isExternalTexture: false };
        } else {
            currentTextureId = textureCache.texture?.uniqueId ?? -1;
        }

        if (textureCache.isExternalTexture) {
            this._numExternalTextures--;
        }
        if (textureCache.isFloatTexture) {
            this._numFloatTextures--;
        }

        if (texture) {
            textureCache.isFloatTexture = texture.type === Constants.TEXTURETYPE_FLOAT;
            textureCache.isExternalTexture = ExternalTexture.IsExternalTexture(texture);
            if (textureCache.isFloatTexture) {
                this._numFloatTextures++;
            }
            if (textureCache.isExternalTexture) {
                this._numExternalTextures++;
            }
        } else {
            textureCache.isFloatTexture = false;
            textureCache.isExternalTexture = false;
        }

        textureCache.texture = texture;

        this.isDirty ||= currentTextureId !== (texture?.uniqueId ?? -1);
    }
}
