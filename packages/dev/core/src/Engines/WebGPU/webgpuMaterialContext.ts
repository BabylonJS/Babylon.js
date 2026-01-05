/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
import { ExternalTexture } from "../../Materials/Textures/externalTexture";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { TextureSampler } from "../../Materials/Textures/textureSampler";
import type { Nullable } from "../../types";
import { Constants } from "../constants";
import type { IMaterialContext } from "../IMaterialContext";
import { WebGPUCacheSampler } from "./webgpuCacheSampler";

/** @internal */
interface IWebGPUMaterialContextSamplerCache {
    sampler: Nullable<TextureSampler>;
    hashCode: number;
}

/** @internal */
interface IWebGPUMaterialContextTextureCache {
    texture: Nullable<InternalTexture | ExternalTexture>;
    isFloatOrDepthTexture: boolean;
    isExternalTexture: boolean;
}

/** @internal */
export class WebGPUMaterialContext implements IMaterialContext {
    private static _Counter = 0;

    public uniqueId: number;
    public updateId: number;
    public isDirty: boolean;
    public samplers: { [name: string]: Nullable<IWebGPUMaterialContextSamplerCache> };
    public textures: { [name: string]: Nullable<IWebGPUMaterialContextTextureCache> };

    // The texture state is a bitfield where each bit is set if the texture is a float32 texture (calculated in @WebGPUEngine._draw).
    // Float32 textures must be handled differently because float filtering may not be supported by the underlying browser implementation.
    // In this case, we must configure the sampler as "non filtering", as well as set the texture sample type to "unfilterable-float" when creating the bind group layout.
    // When that happens, we end up with different bind group layouts (depending on which type of textures have been set in the material), that we must all store
    // in the WebGPUPipelineContext (see @WebGPUPipelineContext.bindGroupLayouts) for later retrieval in the bind group cache implementation (see @WebGPUCacheBindGroups.getBindGroups), thanks to this property.
    // There's the same problem with depth textures, where "float" filtering is not supported either.
    public textureState: number;

    public useVertexPulling = false;

    public get forceBindGroupCreation() {
        // If there is at least one external texture to bind, we must recreate the bind groups each time
        // because we need to retrieve a new texture each frame (by calling device.importExternalTexture)
        return this._numExternalTextures > 0;
    }

    public get hasFloatOrDepthTextures() {
        return this._numFloatOrDepthTextures > 0;
    }

    protected _numFloatOrDepthTextures: number;
    protected _numExternalTextures: number;

    constructor() {
        this.uniqueId = WebGPUMaterialContext._Counter++;
        this.updateId = 0;
        this.textureState = 0;
        this.reset();
    }

    public reset(): void {
        this.samplers = {};
        this.textures = {};
        this.isDirty = true;
        this._numFloatOrDepthTextures = 0;
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

        const isDirty = currentHashCode !== samplerCache.hashCode;
        if (isDirty) {
            this.updateId++;
        }

        this.isDirty ||= isDirty;
    }

    public setTexture(name: string, texture: Nullable<InternalTexture | ExternalTexture>): void {
        let textureCache = this.textures[name];
        let currentTextureId = -1;
        if (!textureCache) {
            this.textures[name] = textureCache = { texture, isFloatOrDepthTexture: false, isExternalTexture: false };
        } else {
            currentTextureId = textureCache.texture?.uniqueId ?? -1;
        }

        if (textureCache.isExternalTexture) {
            this._numExternalTextures--;
        }
        if (textureCache.isFloatOrDepthTexture) {
            this._numFloatOrDepthTextures--;
        }

        if (texture) {
            textureCache.isFloatOrDepthTexture =
                texture.type === Constants.TEXTURETYPE_FLOAT ||
                (texture.format >= Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 && texture.format <= Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8);
            textureCache.isExternalTexture = ExternalTexture.IsExternalTexture(texture);
            if (textureCache.isFloatOrDepthTexture) {
                this._numFloatOrDepthTextures++;
            }
            if (textureCache.isExternalTexture) {
                this._numExternalTextures++;
            }
        } else {
            textureCache.isFloatOrDepthTexture = false;
            textureCache.isExternalTexture = false;
        }

        textureCache.texture = texture;

        const isDirty = currentTextureId !== (texture?.uniqueId ?? -1);
        if (isDirty) {
            this.updateId++;
        }

        this.isDirty ||= isDirty;
    }
}
