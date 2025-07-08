import type { Effect } from "core/Materials/effect";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

import { Light } from "./light";
import { SpotLight } from "./spotLight";

const MAX_CLUSTERED_LIGHTS = 32;

export class ClusteredLight extends Light {
    private static _GetUnsupportedReason(light: Light): Nullable<string> {
        // light.getEngine()._alphaMode
        if (!(light instanceof SpotLight)) {
            return "light is not a spot light";
        }
        // TODO: don't allow lights with shadows
        return null;
    }

    public static IsLightSupported(light: Light): boolean {
        return this._GetUnsupportedReason(light) === null;
    }

    private _lights: Light[] = [];
    public get lights(): readonly Light[] {
        return this._lights;
    }

    private get _clusteredLights(): number {
        return Math.min(this._lights.length, MAX_CLUSTERED_LIGHTS);
    }

    constructor(name: string, lights: Light[] = [], scene?: Scene) {
        super(name, scene);
        for (const light of lights) {
            this.addLight(light);
        }
    }

    public override getClassName(): string {
        return "ClusteredLight";
    }

    public addLight(light: Light): void {
        const reason = ClusteredLight._GetUnsupportedReason(light);
        if (reason !== null) {
            throw new Error(`Cannot cluster light: ${reason}`);
        }
        this._scene.removeLight(light);
        this._lights.push(light);
        this._markMeshesAsLightDirty();
    }

    protected _buildUniformLayout(): void {
        for (let i = 0; i < MAX_CLUSTERED_LIGHTS; i += 1) {
            const iAsString = i.toString();
            this._uniformBuffer.addUniform("vLightData" + iAsString, 4);
            this._uniformBuffer.addUniform("vLightDiffuse" + iAsString, 4);
            this._uniformBuffer.addUniform("vLightSpecular" + iAsString, 4);
            this._uniformBuffer.addUniform("vLightDirection" + iAsString, 4);
            this._uniformBuffer.addUniform("vLightFalloff" + iAsString, 4);
        }
        this._uniformBuffer.create(true);
    }

    /**
     * Binds the lights information from the scene to the effect for the given mesh.
     * @param lightIndex Light index
     * @param scene The scene where the light belongs to
     * @param effect The effect we are binding the data to
     * @param useSpecular Defines if specular is supported
     */
    public override _bindLight(lightIndex: number, scene: Scene, effect: Effect, useSpecular: boolean): void {
        let needUpdate = false;

        this._uniformBuffer.bindToEffect(effect, "Light" + lightIndex.toString());

        for (let i = 0; i < this._clusteredLights; i += 1) {
            if (this._lights[i]._bindLightToUniform(i, scene, effect, this._uniformBuffer, useSpecular, false)) {
                needUpdate = true;
            }
        }

        if (needUpdate) {
            this._uniformBuffer.update();
        } else {
            this._uniformBuffer.bindUniformBuffer();
        }
    }

    public transferToEffect(): Light {
        return this;
    }

    public transferToNodeMaterialEffect(): Light {
        // TODO: ????
        return this;
    }

    public prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        defines["CLUSTLIGHT" + lightIndex] = true;
        // We're just using a define for now until we add proper light clustering
        defines["CLUSTLIGHT_COUNT" + lightIndex] = this._clusteredLights;
        defines["CLUSTLIGHTSUPPORTED"] = true;
    }
}
