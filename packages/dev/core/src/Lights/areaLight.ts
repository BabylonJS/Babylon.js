import type { Vector3 } from "core/Maths/math.vector";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Texture } from "core/Materials/Textures/texture";
import { Constants } from "core/Engines/constants";
import { Light } from "core/Lights/light";
import type { Effect } from "core/Materials/effect";
import type { ILTCTextures } from "core/Lights/LTC/ltcTextureTool";
import { DecodeLTCTextureDataAsync } from "core/Lights/LTC/ltcTextureTool";
import type { Scene } from "core/scene";
import { Logger } from "core/Misc/logger";

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * @internal
         */
        _ltcTextures?: ILTCTextures;
    }
}

function CreateSceneLTCTextures(scene: Scene): void {
    const useDelayedTextureLoading = scene.useDelayedTextureLoading;
    scene.useDelayedTextureLoading = false;

    const previousState = scene._blockEntityCollection;
    scene._blockEntityCollection = false;

    scene._ltcTextures = {
        LTC1: RawTexture.CreateRGBATexture(null, 64, 64, scene.getEngine(), false, false, Constants.TEXTURE_LINEAR_LINEAR, Constants.TEXTURETYPE_HALF_FLOAT, 0, false, true),
        LTC2: RawTexture.CreateRGBATexture(null, 64, 64, scene.getEngine(), false, false, Constants.TEXTURE_LINEAR_LINEAR, Constants.TEXTURETYPE_HALF_FLOAT, 0, false, true),
    };

    scene._blockEntityCollection = previousState;

    scene._ltcTextures.LTC1.wrapU = Texture.CLAMP_ADDRESSMODE;
    scene._ltcTextures.LTC1.wrapV = Texture.CLAMP_ADDRESSMODE;

    scene._ltcTextures.LTC2.wrapU = Texture.CLAMP_ADDRESSMODE;
    scene._ltcTextures.LTC2.wrapV = Texture.CLAMP_ADDRESSMODE;

    scene.useDelayedTextureLoading = useDelayedTextureLoading;

    DecodeLTCTextureDataAsync()
        // eslint-disable-next-line github/no-then
        .then((textureData) => {
            if (scene._ltcTextures) {
                const ltc1 = scene._ltcTextures?.LTC1 as RawTexture;
                ltc1.update(textureData[0]);

                const ltc2 = scene._ltcTextures?.LTC2 as RawTexture;
                ltc2.update(textureData[1]);

                scene.onDisposeObservable.addOnce(() => {
                    scene._ltcTextures?.LTC1.dispose();
                    scene._ltcTextures?.LTC2.dispose();
                });
            }
        })
        // eslint-disable-next-line github/no-then
        .catch((error) => {
            Logger.Error(`Area Light fail to get LTC textures data. Error: ${error}`);
        });
}

/**
 * Abstract Area Light class that servers as parent for all Area Lights implementations.
 * The light is emitted from the area in the -Z direction.
 */
export abstract class AreaLight extends Light {
    /**
     * Area Light position.
     */
    public position: Vector3;

    /**
     * Creates a area light object.
     * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
     * @param name The friendly name of the light
     * @param position The position of the area light.
     * @param scene The scene the light belongs to
     * @param dontAddToScene True to not add the light to the scene
     */
    constructor(name: string, position: Vector3, scene?: Scene, dontAddToScene?: boolean) {
        super(name, scene, dontAddToScene);
        this.position = position;

        if (!this._scene._ltcTextures) {
            CreateSceneLTCTextures(this._scene);
        }
    }

    public override transferTexturesToEffect(effect: Effect, lightIndex: string): Light {
        if (this._scene._ltcTextures) {
            effect.setTexture("areaLightsLTC1Sampler", this._scene._ltcTextures.LTC1);
            effect.setTexture("areaLightsLTC2Sampler", this._scene._ltcTextures.LTC2);
        }
        return this;
    }

    /**
     * Prepares the list of defines specific to the light type.
     * @param defines the list of defines
     * @param lightIndex defines the index of the light for the effect
     */
    public prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        defines["AREALIGHT" + lightIndex] = true;
        defines["AREALIGHTUSED"] = true;
    }

    public override _isReady(): boolean {
        if (this._scene._ltcTextures) {
            return this._scene._ltcTextures.LTC1.isReady() && this._scene._ltcTextures.LTC2.isReady();
        }

        return false;
    }
}
