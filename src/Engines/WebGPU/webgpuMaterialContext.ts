import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { Nullable } from "../../types";
import { IMaterialContext } from "../IMaterialContext";

/** @hidden */
export class WebGPUMaterialContextBindGroupCacheNode {
    public values: { [id: number]: WebGPUMaterialContextBindGroupCacheNode };
    public bindGroups: GPUBindGroup[];

    constructor() {
        this.values = {};
    }
}

/** @hidden */
interface IWebGPUMaterialContextSamplerCache {
    samplerBinding: number;
    firstTextureName: string;
}

/** @hidden */
interface IWebGPUMaterialContextTextureCache {
    textureBinding: number;
    texture: InternalTexture;
    wrapU?: Nullable<number>;
    wrapV?: Nullable<number>;
    wrapR?: Nullable<number>;
    anisotropicFilteringLevel?: Nullable<number>;
    samplingMode?: Nullable<number>;
}

/** @hidden */
export class WebGPUMaterialContext implements IMaterialContext {
    public samplers: { [name: string]: Nullable<IWebGPUMaterialContextSamplerCache> };

    public textures: { [name: string]: Nullable<IWebGPUMaterialContextTextureCache> };

    public bindGroupsCache: WebGPUMaterialContextBindGroupCacheNode;

    constructor() {
        this.samplers = {};
        this.textures = {};
        this.bindGroupsCache = new WebGPUMaterialContextBindGroupCacheNode();
    }

    public reset(): void {
        this.samplers = {};
        this.textures = {};
        this._clearBindGroupsCache();
    }

    public textureCheckDirty(name: string, internalTexture: Nullable<InternalTexture>): boolean {
        const textureCache = this.textures[name];
        if (!textureCache) {
            return false;
        }

        const curTexture = textureCache.texture;
        if (curTexture !== internalTexture || (curTexture !== null && curTexture === internalTexture && 
            (textureCache.wrapU !== internalTexture._cachedWrapU || textureCache.wrapV !== internalTexture._cachedWrapV || textureCache.wrapR !== internalTexture._cachedWrapR ||
                textureCache.anisotropicFilteringLevel !== internalTexture._cachedAnisotropicFilteringLevel || textureCache.samplingMode !== internalTexture.samplingMode)))
        {
            if (internalTexture) {
                textureCache.wrapU = internalTexture._cachedWrapU;
                textureCache.wrapV = internalTexture._cachedWrapV;
                textureCache.wrapR = internalTexture._cachedWrapR;
                textureCache.anisotropicFilteringLevel = internalTexture._cachedAnisotropicFilteringLevel;
                textureCache.samplingMode = internalTexture.samplingMode;
            }
            this._clearBindGroupsCache();
        }

        textureCache.texture = internalTexture!;

        return true;
    }

    private _clearBindGroupsCache(): void {
        this.bindGroupsCache.values = {};
    }
}
