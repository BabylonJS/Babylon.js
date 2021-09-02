import { ExternalTexture } from "../../Materials/Textures/externalTexture";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { Nullable } from "../../types";
import { IMaterialContext } from "../IMaterialContext";
import { WebGPUCacheBindGroups } from "./webgpuCacheBindGroups";

/** @hidden */
interface IWebGPUMaterialContextSamplerCache {
    firstTextureName: string;
}

/** @hidden */
interface IWebGPUMaterialContextTextureCache {
    texture: InternalTexture | ExternalTexture;
    isExternal: boolean;
    wrapU?: Nullable<number>;
    wrapV?: Nullable<number>;
    wrapR?: Nullable<number>;
    anisotropicFilteringLevel?: Nullable<number>;
    samplingMode?: Nullable<number>;
}

/** @hidden */
export class WebGPUMaterialContext implements IMaterialContext {
    private static _Counter = 0;

    public uniqueId: number;
    public samplers: { [name: string]: Nullable<IWebGPUMaterialContextSamplerCache> };
    public textures: { [name: string]: Nullable<IWebGPUMaterialContextTextureCache> };

    private _cacheBindGroups: WebGPUCacheBindGroups;

    constructor(cachBindGroups: WebGPUCacheBindGroups) {
        this._cacheBindGroups = cachBindGroups;
        this.samplers = {};
        this.textures = {};
        this.uniqueId = WebGPUMaterialContext._Counter++;
    }

    public setTexture(name: string, texture: Nullable<InternalTexture | ExternalTexture>): boolean {
        const textureCache = this.textures[name];
        if (!textureCache) {
            return false;
        }

        const curTexture = textureCache.texture;
        if (!!texture) {
            if (ExternalTexture.IsExternalTexture(texture)) {
                textureCache.isExternal = true;
                /*if (curTexture === texture &&
                    (textureCache.wrapU !== texture.wrapU || textureCache.wrapV !== texture.wrapV || textureCache.wrapR !== texture.wrapR ||
                        textureCache.anisotropicFilteringLevel !== texture.anisotropicFilteringLevel || textureCache.samplingMode !== texture.samplingMode)) {
                    // the sampler used to sample the texture must be updated, so we need to clear the bind group cache entries that are using
                    // this texture so that the bind groups are re-created with the right sampler
                    textureCache.wrapU = texture.wrapU;
                    textureCache.wrapV = texture.wrapV;
                    textureCache.wrapR = texture.wrapR;
                    textureCache.anisotropicFilteringLevel = texture.anisotropicFilteringLevel;
                    textureCache.samplingMode = texture.samplingMode;
                    this._cacheBindGroups.clearTextureEntries(curTexture.uniqueId);
                }*/
            } else {
                textureCache.isExternal = false;
                if (curTexture === texture &&
                    (textureCache.wrapU !== texture._cachedWrapU || textureCache.wrapV !== texture._cachedWrapV || textureCache.wrapR !== texture._cachedWrapR ||
                        textureCache.anisotropicFilteringLevel !== texture._cachedAnisotropicFilteringLevel || textureCache.samplingMode !== texture.samplingMode)) {
                    // the sampler used to sample the texture must be updated, so we need to clear the bind group cache entries that are using
                    // this texture so that the bind groups are re-created with the right sampler
                    textureCache.wrapU = texture._cachedWrapU;
                    textureCache.wrapV = texture._cachedWrapV;
                    textureCache.wrapR = texture._cachedWrapR;
                    textureCache.anisotropicFilteringLevel = texture._cachedAnisotropicFilteringLevel;
                    textureCache.samplingMode = texture.samplingMode;
                    this._cacheBindGroups.clearTextureEntries(curTexture.uniqueId);
                }
            }
        }

        textureCache.texture = texture!;

        return true;
    }
}
