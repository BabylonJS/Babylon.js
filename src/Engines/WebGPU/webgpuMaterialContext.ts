import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { Nullable } from "../../types";
import { IMaterialContext } from "../IMaterialContext";

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
    public samplers: { [name: string]: Nullable<IWebGPUMaterialContextSamplerCache> };

    public textures: { [name: string]: Nullable<IWebGPUMaterialContextTextureCache> };

    public readonly _uniqueId: number;

    constructor() {
        this.samplers = {};
        this.textures = {};
    }

    public setTexture(name: string, internalTexture: Nullable<InternalTexture>): boolean {
        const textureCache = this.textures[name];
        if (!textureCache) {
            return false;
        }

        textureCache.texture = internalTexture!;

        return true;
    }
}
