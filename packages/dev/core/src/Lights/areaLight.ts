import type { Vector3 } from "../Maths/math.vector";
import { Light } from "./light";
import type { Effect } from "core/Materials/effect";
import { DefaultAreaLightLTCProvider } from "core/Lights/LTC/ltcTextureTool";
import type { IAreaLightLTCProvider, ILTCTextures } from "core/Lights/LTC/ltcTextureTool";
import type { Scene } from "core/scene";
import { Logger } from "core/Misc";

declare module "../scene" {
    export interface Scene {
        /**
         * Object capable of providing LTC textures for Area Lights.
         */
        areaLightLTCProvider?: IAreaLightLTCProvider;

        /**
         * @internal
         */
        _ltcTexturesPromise?: Promise<ILTCTextures>;

        /**
         * @internal
         */
        _ltcTextures?: ILTCTextures;
    }
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

        if (!this._scene._ltcTextures) {
            this._scene.areaLightLTCProvider ||= new DefaultAreaLightLTCProvider(this._scene);

            if (!this._scene._ltcTexturesPromise) {
                this._scene._ltcTexturesPromise = this._scene.areaLightLTCProvider.getTexturesAsync();
                this._scene.addPendingData(this);
                this._scene._ltcTexturesPromise
                    .then((ltcTextures) => {
                        this._scene._ltcTextures = ltcTextures;
                        for (const mesh of this._scene.meshes) {
                            if (mesh.lightSources.some((a) => a.getClassName() === "RectAreaLight")) {
                                mesh._markSubMeshesAsLightDirty();
                            }
                        }
                        this._scene.removePendingData(this);
                        this._scene.onDisposeObservable.addOnce(() => {
                            this._scene._ltcTextures?.LTC1.dispose();
                            this._scene._ltcTextures?.LTC2.dispose();
                        });
                    })
                    .catch((error) => {
                        Logger.Error(`Area Light fail to get LTC textures. Check IAreaLightLTCProvider implementation. Error: ${error}`);
                    });
            }
        }
    }

    public override transferTexturesToEffect(effect: Effect): Light {
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
        defines["AREALIGHT" + lightIndex] = !!this._scene._ltcTextures;
        defines["AREALIGHTUSED"] = !!this._scene._ltcTextures;
    }
}
