import { RawTexture } from "core/Materials/Textures/rawTexture";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Texture } from "core/Materials/Textures/texture";
import type { Scene } from "core/scene";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools";
import type { Tuple } from "core/types";

/**
 * Interface that can provide LTC textures used by area Lights. Users can override the default ones to provide their own LTC textures.
 */
export interface IAreaLightLTCProvider {
    /**
     * Linearly trasnformed cossine texture for BRDF.
     */
    ltc1Texture: BaseTexture;

    /**
     * Linearly trasnformed cossine texture for BRDF.
     */
    ltc2Texture: BaseTexture;
}

/**
 * Default provider for LTC textures. This provider will load the LTC data from the Babylon CDN.
 */
export class DefaultAreaLightLTCProvider implements IAreaLightLTCProvider {
    /**
     * LTC Texture 1 loaded from the Babylon.js CDN.
     */
    public ltc1Texture: BaseTexture;

    /**
     * LTC Texture 2 loaded from the Babylon.js CDN.
     */
    public ltc2Texture: BaseTexture;

    constructor(scene: Scene) {
        this._buildSceneLTCTextures(scene);
    }

    // Loads LTC textures from CDN and assigns them to ltc1Texture and ltc2Texture textures.
    private async _buildSceneLTCTextures(scene: Scene): Promise<void> {
        const textureData = await this._decodeLTCTextureData();
        this.ltc1Texture = this._createLTCTextureFromArray(textureData[0], scene);
        this.ltc2Texture = this._createLTCTextureFromArray(textureData[1], scene);
        for (const mesh of scene.meshes) {
            if (mesh.lightSources.filter((a) => a.getClassName() === "RectAreaLight")) {
                mesh._markSubMeshesAsLightDirty();
            }
        }

        scene.onDisposeObservable.addOnce(() => {
            this.ltc1Texture.dispose();
            this.ltc2Texture.dispose();
        });
    }

    // Loads raw binary data from CDN and assigns to the correct texture array data.
    private async _decodeLTCTextureData(): Promise<Tuple<Uint16Array, 2>> {
        const _ltc1 = new Uint16Array(64 * 64 * 4);
        const _ltc2 = new Uint16Array(64 * 64 * 4);

        const ltcPath = Tools.GetBabylonScriptURL("https://assets.babylonjs.com/areaLights/areaLightsLTC.bin", true);
        const file = await Tools.LoadFileAsync(ltcPath);
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

        return [_ltc1, _ltc2];
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
}
