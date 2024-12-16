import { RawTexture } from "core/Materials/Textures/rawTexture";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Texture } from "core/Materials/Textures/texture";
import type { Scene } from "core/scene";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools";

const _ltc1 = new Uint16Array(64 * 64 * 4);
const _ltc2 = new Uint16Array(64 * 64 * 4);
let _ltcTextureDecoded = false;

async function decodeLTCTextures() {
    if (_ltcTextureDecoded) {
        return;
    }

    _ltcTextureDecoded = true;

    const file = await Tools.LoadFileAsync("");
    const ltcEncoded = new Uint16Array(file);

    const pixelCount = ltcEncoded.length / 8;

    for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
        _ltc1[pixelIndex * 4] = ltcEncoded[pixelIndex * 8];
        _ltc1[pixelIndex * 4 + 1] = ltcEncoded[pixelIndex * 8 + 1];
        _ltc1[pixelIndex * 4 + 2] = ltcEncoded[pixelIndex * 8 + 2];
        _ltc1[pixelIndex * 4 + 3] = ltcEncoded[pixelIndex * 8 + 3];

        _ltc2[pixelIndex * 4] = ltcEncoded[pixelIndex * 8 + 4];
        _ltc2[pixelIndex * 4 + 1] = ltcEncoded[pixelIndex * 8 + 5];
        _ltc2[pixelIndex * 4 + 2] = ltcEncoded[pixelIndex * 8 + 6];
        _ltc2[pixelIndex * 4 + 3] = ltcEncoded[pixelIndex * 8 + 7];
    }
}

function getLTCTextureFromArray(ltc: ArrayBufferView, scene: Scene): BaseTexture {
    const useDelayedTextureLoading = scene.useDelayedTextureLoading;
    scene.useDelayedTextureLoading = false;

    const previousState = scene._blockEntityCollection;
    scene._blockEntityCollection = false;

    let ltcTexture = null;
    ltcTexture = RawTexture.CreateRGBATexture(ltc, 64, 64, scene.getEngine(), false, false, Constants.TEXTURE_LINEAR_LINEAR, Constants.TEXTURETYPE_HALF_FLOAT);

    scene._blockEntityCollection = previousState;

    const texturesCache = scene.getEngine().getLoadedTexturesCache();
    const index1 = texturesCache.indexOf(ltcTexture.getInternalTexture()!);
    if (index1 !== -1) {
        texturesCache.splice(index1, 1);
    }

    ltcTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
    ltcTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
    scene.useDelayedTextureLoading = useDelayedTextureLoading;
    return ltcTexture;
}

/**
 * Gets a default environment BRDF for MS-BRDF Height Correlated BRDF
 * @param scene defines the hosting scene
 * @returns the environment BRDF texture
 */
export const getAreaLightsLTC1Texture = (scene: Scene): BaseTexture => {
    if (!scene.ltc1Texture) {
        decodeLTCTextures();
        scene.ltc1Texture = getLTCTextureFromArray(_ltc1, scene);
    }

    return scene.ltc1Texture;
};

/**
 * Gets a default environment BRDF for MS-BRDF Height Correlated BRDF
 * @param scene defines the hosting scene
 * @returns the environment BRDF texture
 */
export const getAreaLightsLTC2Texture = (scene: Scene): BaseTexture => {
    if (!scene.ltc2Texture) {
        decodeLTCTextures();
        scene.ltc2Texture = getLTCTextureFromArray(_ltc2, scene);
    }
    return scene.ltc2Texture;
};

/**
 * Class used to host texture specific utilities
 */
export const LTC1TextureTools = {
    /**
     * Gets a default environment BRDF for MS-BRDF Height Correlated BRDF
     * @param scene defines the hosting scene
     * @returns the environment BRDF texture
     */
    getAreaLightsLTC1Texture,
    getAreaLightsLTC2Texture,
};
