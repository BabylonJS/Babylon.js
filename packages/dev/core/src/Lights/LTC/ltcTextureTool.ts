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
     * Linearly transformed cosine texture for BRDF.
     */
    ltc1Texture: BaseTexture;

    /**
     * Linearly transformed cosine texture Fresnel Approximation.
     */
    ltc2Texture: BaseTexture;

    /**
     * Promise to wait for Area Lights are ready.
     */
    whenAreaLightsReady: Promise<void>;
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

    /**
     * Promise to wait for Area Lights are ready.
     */
    public whenAreaLightsReady: Promise<void>;

    public constructor(scene: Scene) {
        this.whenAreaLightsReady = this._buildSceneLTCTextures(scene);
    }

    // Loads LTC textures from CDN and assigns them to ltc1Texture and ltc2Texture textures.
    private async _buildSceneLTCTextures(scene: Scene): Promise<void> {
        const textureData = await this._decodeLTCTextureDataAsync();
        this.ltc1Texture = this._createLTCTextureFromArray(textureData[0], scene);
        this.ltc2Texture = this._createLTCTextureFromArray(textureData[1], scene);
        for (const mesh of scene.meshes) {
            if (mesh.lightSources.some((a) => a.getClassName() === "RectAreaLight")) {
                mesh._markSubMeshesAsLightDirty();
                await scene.whenReadyAsync();
            }
        }

        scene.onDisposeObservable.addOnce(() => {
            this.ltc1Texture.dispose();
            this.ltc2Texture.dispose();
        });
    }

    // Loads raw binary data from CDN and assigns to the correct texture array data.
    private async _decodeLTCTextureDataAsync(): Promise<Tuple<Uint16Array, 2>> {
        const ltc1 = new Uint16Array(64 * 64 * 4);
        const ltc2 = new Uint16Array(64 * 64 * 4);

        const ltcPath = Tools.GetBabylonScriptURL("https://assets.babylonjs.com/areaLights/areaLightsLTC.bin", true);
        const file = await Tools.LoadFileAsync(ltcPath);
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
