import type { AbstractEngine } from "core/Engines/abstractEngine";
import { ThinEngine } from "core/Engines/thinEngine";
import type { Effect } from "core/Materials/effect";
import { Vector3 } from "core/Maths/math.vector";
import { TmpColors } from "core/Maths/math.color";
import type { Scene } from "core/scene";

import { Light } from "./light";
import { PointLight } from "./pointLight";
import { SpotLight } from "./spotLight";

export class ClusteredLight extends Light {
    private static _GetEngineMaxLights(engine: AbstractEngine): number {
        const caps = engine._caps;
        if (!engine.supportsUniformBuffers) {
            return 0;
        } else if (engine.isWebGPU) {
            // On WebGPU we use atomic writes to storage textures
            return 32;
        } else if (engine instanceof ThinEngine && engine._webGLVersion > 1) {
            // On WebGL 2 we use additive float blending as the light mask
            if (!caps.colorBufferFloat || !caps.blendFloat) {
                return 0;
            }
            // Due to the use of floats we want to limit lights to the precision of floats
            const gl = engine._gl;
            const format = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, caps.highPrecisionShaderSupported ? gl.HIGH_FLOAT : gl.MEDIUM_FLOAT);
            return format?.precision ?? 0;
        } else {
            // WebGL 1 is not supported due to lack of dynamic for loops
            return 0;
        }
    }

    public static IsLightSupported(light: Light): boolean {
        if (ClusteredLight._GetEngineMaxLights(light.getEngine()) === 0) {
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

    public readonly maxLights: number;

    public get isSupported(): boolean {
        return this.maxLights > 0;
    }

    constructor(name: string, lights: Light[] = [], scene?: Scene) {
        super(name, scene);
        this.maxLights = ClusteredLight._GetEngineMaxLights(this.getEngine());
        if (this.maxLights > 0) {
            for (const light of lights) {
                this.addLight(light);
            }
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
        // We can't use `this.maxLights` since this will get called during construction
        const maxLights = ClusteredLight._GetEngineMaxLights(this.getEngine());

        this._uniformBuffer.addUniform("vLightData", 4);
        this._uniformBuffer.addUniform("vLightDiffuse", 4);
        this._uniformBuffer.addUniform("vLightSpecular", 4);
        for (let i = 0; i < maxLights; i += 1) {
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
        const len = Math.min(this._lights.length, this.maxLights);
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
            this._uniformBuffer.updateFloat4(struct + "direction", direction.x, direction.y, direction.z, spotLight?._cosHalfAngle ?? -1, lightIndex);

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
        defines["CLUSTLIGHT_MAX"] = this.maxLights;
    }
}
