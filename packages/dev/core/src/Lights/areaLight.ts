import type { Vector3 } from "../Maths/math.vector";
import { Light } from "./light";
import type { Effect } from "core/Materials/effect";
import { DefaultAreaLightLTCProvider } from "core/Lights/LTC/ltcTextureTool";
import type { IAreaLightLTCProvider } from "core/Lights/LTC/ltcTextureTool";
import type { Scene } from "core/scene";

declare module "../scene" {
    export interface Scene {
        /**
         * Object capable of providing LTC textures for Area Lights.
         */
        areaLightLTCProvider: IAreaLightLTCProvider;
    }
}

function AreAreaLightsReady(scene: Scene): boolean {
    if (scene.areaLightLTCProvider.ltc1Texture && scene.areaLightLTCProvider.ltc2Texture) {
        return scene.areaLightLTCProvider.ltc1Texture.isReady() && scene.areaLightLTCProvider.ltc2Texture.isReady();
    }

    return false;
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
     */
    constructor(name: string, position: Vector3, scene?: Scene) {
        super(name, scene);
        this.position = position;

        this._scene.areaLightLTCProvider ||= new DefaultAreaLightLTCProvider(this._scene);
    }

    public override transferTexturesToEffect(effect: Effect): Light {
        effect.setTexture("areaLightsLTC1Sampler", this._scene.areaLightLTCProvider.ltc1Texture);
        effect.setTexture("areaLightsLTC2Sampler", this._scene.areaLightLTCProvider.ltc1Texture);
        return this;
    }

    /**
     * Prepares the list of defines specific to the light type.
     * @param defines the list of defines
     * @param lightIndex defines the index of the light for the effect
     */
    public prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        defines["AREALIGHT" + lightIndex] = AreAreaLightsReady(this._scene);
        defines["AREALIGHTUSED"] = AreAreaLightsReady(this._scene);
    }
}
