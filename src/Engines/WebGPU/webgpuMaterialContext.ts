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
    texture: InternalTexture;
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

    public setTexture(name: string, internalTexture: Nullable<InternalTexture>): boolean {
        const textureCache = this.textures[name];
        if (!textureCache) {
            return false;
        }

        const curTexture = textureCache.texture;
        if (curTexture !== null && curTexture === internalTexture &&
            (textureCache.wrapU !== internalTexture._cachedWrapU || textureCache.wrapV !== internalTexture._cachedWrapV || textureCache.wrapR !== internalTexture._cachedWrapR ||
                textureCache.anisotropicFilteringLevel !== internalTexture._cachedAnisotropicFilteringLevel || textureCache.samplingMode !== internalTexture.samplingMode))
        {
            // the sampler used to sample the texture must be updated, so we need to clear the bind group cache entries that are using
            // this texture so that the bind groups are re-created with the right sampler
            textureCache.wrapU = internalTexture._cachedWrapU;
            textureCache.wrapV = internalTexture._cachedWrapV;
            textureCache.wrapR = internalTexture._cachedWrapR;
            textureCache.anisotropicFilteringLevel = internalTexture._cachedAnisotropicFilteringLevel;
            textureCache.samplingMode = internalTexture.samplingMode;
            this._cacheBindGroups.clearTextureEntries(curTexture.uniqueId);
        }

        textureCache.texture = internalTexture!;

        return true;
    }
}
