import type { AbstractEngine } from "core/Engines/abstractEngine";
import { ThinEngine } from "core/Engines/thinEngine";
import type { Effect } from "core/Materials/effect";
import { Vector3 } from "core/Maths/math.vector";
import { TmpColors } from "core/Maths/math.color";
import type { Scene } from "core/scene";

import { Light } from "./light";
import { PointLight } from "./pointLight";
import { SpotLight } from "./spotLight";

const MAX_CLUSTERED_LIGHTS = 32;

export class ClusteredLight extends Light {
    private static _IsEngineSupported(engine: AbstractEngine): boolean {
        if (engine.isWebGPU) {
            return true;
        } else if (engine instanceof ThinEngine && engine.version > 1) {
            // On WebGL 2 we use additive float blending as the light mask
            return engine._caps.colorBufferFloat && engine._caps.blendFloat;
        } else {
            // WebGL 1 is not supported due to lack of dynamic for loops
            return false;
        }
    }

    public static IsLightSupported(light: Light): boolean {
        if (!ClusteredLight._IsEngineSupported(light.getEngine())) {
            return false;
        } else if (light.shadowEnabled && light._scene.shadowsEnabled && light.getShadowGenerators()) {
            // Shadows are not supported
            return false;
        } else if (light instanceof PointLight) {
            return true;
        } else if (light instanceof SpotLight) {
            // Extra texture bindings per light are not supported
            return !(light.projectionTexture || light.iesProfileTexture);
        } else {
            // Currently only point and spot lights are supported
            return false;
        }
    }

    private _lights: (PointLight | SpotLight)[] = [];
    public get lights(): readonly Light[] {
        return this._lights;
    }

    public get isSupported(): boolean {
        return ClusteredLight._IsEngineSupported(this.getEngine());
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
        if (ClusteredLight.IsLightSupported(light)) {
            this._scene.removeLight(light);
            this._lights.push(<PointLight | SpotLight>light);
        }
    }

    protected _buildUniformLayout(): void {
        this._uniformBuffer.addUniform("vLightData", 4);
        this._uniformBuffer.addUniform("vLightDiffuse", 4);
        this._uniformBuffer.addUniform("vLightSpecular", 4);
        for (let i = 0; i < MAX_CLUSTERED_LIGHTS; i += 1) {
            // These technically don't have to match the field name but also why not
            const struct = `vLights[${i}].`;
            this._uniformBuffer.addUniform(struct + "position", 4);
            this._uniformBuffer.addUniform(struct + "direction", 4);
            this._uniformBuffer.addUniform(struct + "diffuse", 4);
            this._uniformBuffer.addUniform(struct + "specular", 4);
            this._uniformBuffer.addUniform(struct + "falloff", 4);
        }
        this._uniformBuffer.addUniform("shadowsInfo", 3);
        this._uniformBuffer.addUniform("depthValues", 2);
        this._uniformBuffer.create();
    }

    public transferToEffect(effect: Effect, lightIndex: string): Light {
        const len = Math.min(this._lights.length, MAX_CLUSTERED_LIGHTS);
        this._uniformBuffer.updateFloat4("vLightData", len, 0, 0, 0, lightIndex);

        for (let i = 0; i < len; i += 1) {
            const light = this._lights[i];
            const spotLight = light instanceof SpotLight ? light : null;
            const struct = `vLights[${i}].`;

            let position: Vector3;
            let direction: Vector3;
            if (light.computeTransformedInformation()) {
                position = light.transformedPosition;
                direction = Vector3.Normalize(light.transformedDirection);
            } else {
                position = light.position;
                direction = Vector3.Normalize(light.direction);
            }
            this._uniformBuffer.updateFloat4(struct + "position", position.x, position.y, position.z, spotLight?.exponent ?? 0, lightIndex);
            this._uniformBuffer.updateFloat4(struct + "direction", direction.x, direction.y, direction.z, spotLight?._cosHalfAngle ?? 0, lightIndex);

            const scaledIntensity = light.getScaledIntensity();
            light.diffuse.scaleToRef(scaledIntensity, TmpColors.Color3[0]);
            this._uniformBuffer.updateColor4(struct + "diffuse", TmpColors.Color3[0], light.range, lightIndex);
            light.specular.scaleToRef(scaledIntensity, TmpColors.Color3[1]);
            this._uniformBuffer.updateColor4(struct + "specular", TmpColors.Color3[1], light.radius, lightIndex);

            this._uniformBuffer.updateFloat4(
                struct + "falloff",
                light.range,
                light._inverseSquaredRange,
                spotLight?._lightAngleScale ?? 0,
                spotLight?._lightAngleOffset ?? 0,
                lightIndex
            );
        }
        return this;
    }

    public transferToNodeMaterialEffect(): Light {
        // TODO: ????
        return this;
    }

    public prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        defines["CLUSTLIGHT" + lightIndex] = true;
        defines["CLUSTLIGHTSUPPORTED"] = this.isSupported;
    }
}
