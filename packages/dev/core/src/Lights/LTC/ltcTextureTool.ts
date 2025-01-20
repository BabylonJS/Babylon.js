import { RawTexture } from "core/Materials/Textures/rawTexture";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Texture } from "core/Materials/Textures/texture";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools";
import type { Tuple } from "core/types";
import type { Scene } from "core/scene";

/**
 * Linearly transformed cosine textures that are used in the Area Lights shaders.
 */
export interface ILTCTextures {
    /**
     * Linearly transformed cosine texture BRDF Approximation.
     */
    LTC1: BaseTexture;

    /**
     * Linearly transformed cosine texture Fresnel Approximation.
     */
    LTC2: BaseTexture;
}

/**
 * Interface that can provide LTC textures used by area Lights. Users can override the default ones to provide their own LTC textures.
 */
export interface IAreaLightLTCProvider {
    /**
     * Returns the LTC textures used by area lights.
     */
    getTexturesAsync(): Promise<ILTCTextures>;
}

/**
 * Default provider for LTC textures. This provider will load the LTC data from the Babylon CDN.
 */
export class DefaultAreaLightLTCProvider implements IAreaLightLTCProvider {
    private _scene: Scene;

    /**
     * Default provider for LTC textures. This provider will load the LTC data from the Babylon CDN.
     * @param scene Target scene.
     */
    public constructor(scene: Scene) {
        this._scene = scene;
    }

    public async getTexturesAsync(): Promise<ILTCTextures> {
        const textureData = await this._decodeLTCTextureDataAsync();
        const _ltc1Texture = this._createLTCTextureFromArray(textureData[0], this._scene);
        const _ltc2Texture = this._createLTCTextureFromArray(textureData[1], this._scene);
        return { LTC1: _ltc1Texture, LTC2: _ltc2Texture };
    }

    // Loads raw binary data from CDN and assigns to the correct texture array data.
    private async _decodeLTCTextureDataAsync(): Promise<Tuple<Uint16Array, 2>> {
        const ltc1 = new Uint16Array(64 * 64 * 4);
        const ltc2 = new Uint16Array(64 * 64 * 4);
        const file = await Tools.LoadFileAsync(Tools.GetAssetUrl("https://assets.babylonjs.com/core/areaLights/areaLightsLTC.bin"));
        const ltcEncoded = new Uint16Array(file);

        const pixelCount = ltcEncoded.length / 8;

        for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
            ltc1[pixelIndex * 4] = ltcEncoded[pixelIndex * 8];
            ltc1[pixelIndex * 4 + 1] = ltcEncoded[pixelIndex * 8 + 1];
            ltc1[pixelIndex * 4 + 2] = ltcEncoded[pixelIndex * 8 + 2];
            ltc1[pixelIndex * 4 + 3] = ltcEncoded[pixelIndex * 8 + 3];

            ltc2[pixelIndex * 4] = ltcEncoded[pixelIndex * 8 + 4];
            ltc2[pixelIndex * 4 + 1] = ltcEncoded[pixelIndex * 8 + 5];
            ltc2[pixelIndex * 4 + 2] = ltcEncoded[pixelIndex * 8 + 6];
            ltc2[pixelIndex * 4 + 3] = ltcEncoded[pixelIndex * 8 + 7];
        }

        return [ltc1, ltc2];
    }

    // Uses raw binary data to build LTC half float textures.
    private _createLTCTextureFromArray(ltc: ArrayBufferView, scene: Scene): BaseTexture {
        const useDelayedTextureLoading = scene.useDelayedTextureLoading;
        scene.useDelayedTextureLoading = false;

        const previousState = scene._blockEntityCollection;
        scene._blockEntityCollection = false;

        let ltcTexture = null;
        ltcTexture = RawTexture.CreateRGBATexture(ltc, 64, 64, scene.getEngine(), false, false, Constants.TEXTURE_LINEAR_LINEAR, Constants.TEXTURETYPE_HALF_FLOAT);

        scene._blockEntityCollection = previousState;

        ltcTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        ltcTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
        scene.useDelayedTextureLoading = useDelayedTextureLoading;
        return ltcTexture;
    }
}
