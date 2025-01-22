import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Tools } from "core/Misc/tools";
import type { Tuple } from "core/types";

/**
 * Linearly transformed cosine textures that are used in the Area Lights shaders.
 */
export type ILTCTextures = {
    /**
     * Linearly transformed cosine texture BRDF Approximation.
     */
    LTC1: BaseTexture;

    /**
     * Linearly transformed cosine texture Fresnel Approximation.
     */
    LTC2: BaseTexture;
};

/**
 * Loads LTC texture data from Babylon.js CDN.
 * @returns Promise with data for LTC1 and LTC2 textures for area lights.
 */
export async function DecodeLTCTextureDataAsync(): Promise<Tuple<Uint16Array, 2>> {
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
