// Copyright (c) Microsoft Corporation.
// MIT License

import type { Atmosphere } from "./atmosphere";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Material } from "core/Materials/material";
import { MaterialDefines } from "core/Materials/materialDefines";
import { MaterialPluginBase } from "core/Materials/materialPluginBase";
import type { Nullable } from "core/types";
import type { UniformBuffer } from "core/Materials/uniformBuffer";

class AtmospherePBRMaterialDefines extends MaterialDefines {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public USE_AERIAL_PERSPECTIVE_LUT: boolean;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public APPLY_AERIAL_PERSPECTIVE_INTENSITY = false;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS = false;

    /**
     * Constructs the {@link AtmospherePBRMaterialDefines}.
     * @param useAerialPerspectiveLut - Whether to use the aerial perspective LUT.
     */
    constructor(useAerialPerspectiveLut: boolean) {
        super();
        this.USE_AERIAL_PERSPECTIVE_LUT = useAerialPerspectiveLut;
    }
}

const UboArray = [{ name: "inverseViewportSize", size: 2, type: "vec2" }];
const MakeUniforms = (atmosphere: Atmosphere) => ({
    ubo: UboArray,
    fragment: "uniform vec2 inverseViewportSize;\n",
    externalUniforms: atmosphere.uniformBuffer.getUniformNames(),
});

const PluginName = "AtmospherePBRMaterialPlugin";
const PluginPriority = 600;

/**
 * Adds shading logic to a PBRMaterial that provides radiance, diffuse sky irradiance, and aerial perspective from the atmosphere.
 */
export class AtmospherePBRMaterialPlugin extends MaterialPluginBase {
    /**
     * Constructs the {@link AtmospherePBRMaterialPlugin}.
     * @param material - The material to apply the plugin to.
     * @param _atmosphere - The atmosphere to use for shading.
     * @param _isAerialPerspectiveEnabled - Whether to apply aerial perspective.
     */
    constructor(
        material: Material,
        private readonly _atmosphere: Atmosphere,
        private readonly _isAerialPerspectiveEnabled = false
    ) {
        super(
            material,
            PluginName,
            PluginPriority,
            {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                USE_CUSTOM_REFLECTION: _atmosphere.diffuseSkyIrradianceLut !== null,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_BEFORE_FOG: _isAerialPerspectiveEnabled,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                USE_AERIAL_PERSPECTIVE_LUT: _isAerialPerspectiveEnabled && _atmosphere.isAerialPerspectiveLutEnabled,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                APPLY_AERIAL_PERSPECTIVE_INTENSITY: _isAerialPerspectiveEnabled && _atmosphere.aerialPerspectiveIntensity !== 1.0,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS: _isAerialPerspectiveEnabled && _atmosphere.aerialPerspectiveRadianceBias !== 0.0,
            },
            false, // addPluginToList -- false because we need to control when this is added to the list
            true, // enable
            true // resolveIncludes
        );

        this.doNotSerialize = true;

        // This calls `getCode` so we need to do this after having initialized the class fields.
        this._pluginManager._addPlugin(this);
    }

    /**
     * @override
     */
    public override getUniformBuffersNames(_ubos: string[]): void {
        const uniformBuffer = this._atmosphere.uniformBuffer;
        if (uniformBuffer.useUbo) {
            _ubos.push(uniformBuffer.name);
        }
    }

    /**
     * @override
     */
    public override getUniforms() {
        return MakeUniforms(this._atmosphere);
    }

    /**
     * @override
     */
    public override isReadyForSubMesh(): boolean {
        let isReady = true;
        const atmosphere = this._atmosphere;
        if (this._isAerialPerspectiveEnabled && atmosphere.isAerialPerspectiveLutEnabled) {
            const aerialPerspectiveLutRenderTarget = atmosphere.aerialPerspectiveLutRenderTarget;
            isReady = isReady && !!aerialPerspectiveLutRenderTarget?.isReady();
        }
        const transmittanceLutRenderTarget = atmosphere.transmittanceLut?.renderTarget ?? null;
        isReady = isReady && !!transmittanceLutRenderTarget?.isReady();
        return isReady;
    }

    /**
     * @override
     */
    public override getActiveTextures(_activeTextures: BaseTexture[]): void {
        const atmosphere = this._atmosphere;
        if (this._isAerialPerspectiveEnabled && atmosphere.isAerialPerspectiveLutEnabled) {
            const aerialPerspectiveLutRenderTarget = atmosphere.aerialPerspectiveLutRenderTarget;
            if (aerialPerspectiveLutRenderTarget) {
                _activeTextures.push(aerialPerspectiveLutRenderTarget);
            }
        }

        const transmittanceLutRenderTarget = atmosphere.transmittanceLut?.renderTarget ?? null;
        if (transmittanceLutRenderTarget) {
            _activeTextures.push(transmittanceLutRenderTarget);
        }
    }

    /**
     * @override
     */
    public override bindForSubMesh(uniformBuffer: UniformBuffer): void {
        const atmosphere = this._atmosphere;
        const engine = atmosphere.scene.getEngine();

        // Bind the atmosphere's uniform buffer to the effect.
        const effect = uniformBuffer.currentEffect;
        if (effect) {
            this._atmosphere.bindUniformBufferToEffect(effect);
        }

        const width = engine.getRenderWidth();
        const height = engine.getRenderHeight();
        uniformBuffer.updateFloat2("inverseViewportSize", 1.0 / width, 1.0 / height);

        if (this._isAerialPerspectiveEnabled && atmosphere.isAerialPerspectiveLutEnabled) {
            const aerialPerspectiveLutRenderTarget = atmosphere.aerialPerspectiveLutRenderTarget;
            uniformBuffer.setTexture("aerialPerspectiveLut", aerialPerspectiveLutRenderTarget);
        }
        const transmittanceLutRenderTarget = atmosphere.transmittanceLut?.renderTarget ?? null;
        uniformBuffer.setTexture("transmittanceLut", transmittanceLutRenderTarget);
    }

    /**
     * @override
     */
    public override prepareDefines(defines: AtmospherePBRMaterialDefines): void {
        const lastUseAerialPerspectiveLut = defines.USE_AERIAL_PERSPECTIVE_LUT;
        const lastApplyAerialPerspectiveIntensity = defines.APPLY_AERIAL_PERSPECTIVE_INTENSITY;
        const lastApplyAerialPerspectiveRadianceBias = defines.APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS;
        defines.USE_AERIAL_PERSPECTIVE_LUT = this._isAerialPerspectiveEnabled && this._atmosphere.isAerialPerspectiveLutEnabled;
        defines.APPLY_AERIAL_PERSPECTIVE_INTENSITY = this._isAerialPerspectiveEnabled && this._atmosphere.aerialPerspectiveIntensity !== 1.0;
        defines.APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS = this._isAerialPerspectiveEnabled && this._atmosphere.aerialPerspectiveRadianceBias !== 0.0;
        if (
            lastUseAerialPerspectiveLut !== defines.USE_AERIAL_PERSPECTIVE_LUT ||
            lastApplyAerialPerspectiveIntensity !== defines.APPLY_AERIAL_PERSPECTIVE_INTENSITY ||
            lastApplyAerialPerspectiveRadianceBias !== defines.APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS
        ) {
            defines.markAllAsDirty();
        }
    }

    /**
     * @override
     */
    public override getSamplers(samplers: string[]): void {
        samplers.push("transmittanceLut");
        if (this._isAerialPerspectiveEnabled && this._atmosphere.isAerialPerspectiveLutEnabled) {
            samplers.push("aerialPerspectiveLut");
        }
    }

    /**
     * @override
     */
    public override getCustomCode(shaderType: string): Nullable<Record<string, string>> {
        // Assumed inputs are light0, vPositionW, normalW.
        // Only works for directional lights.
        if (shaderType !== "fragment") {
            return null;
        }

        const useUbo = this._atmosphere.scene.getEngine().supportsUniformBuffers;
        const directionToLightSnippet = useUbo ? "-light0.vLightData.xyz" : "-vLightData0.xyz";

        const useAtmosphereUbo = this._atmosphere.uniformBuffer.useUbo;
        const atmosphereImportSnippet = useAtmosphereUbo ? "#include<atmosphereUboDeclaration>" : "#include<atmosphereFragmentDeclaration>";

        return {
            CUSTOM_FRAGMENT_DEFINITIONS:
                this._isAerialPerspectiveEnabled && this._atmosphere.isAerialPerspectiveLutEnabled
                    ? `uniform sampler2D transmittanceLut;\r\nprecision highp sampler2DArray;\r\nuniform sampler2DArray aerialPerspectiveLut;\r\n${atmosphereImportSnippet}\r\n#include<atmosphereFunctions>`
                    : `uniform sampler2D transmittanceLut;\r\n${atmosphereImportSnippet}\r\n#include<atmosphereFunctions>`,
            CUSTOM_LIGHT0_COLOR: `
            {
                vec3 positionGlobal = 0.001 * vPositionW + vec3(0., planetRadius, 0.);
                float positionRadius = length(positionGlobal);
                vec3 geocentricNormal = positionGlobal / positionRadius;
                vec3 directionToLight = ${directionToLightSnippet};
                float cosAngleLightToZenith = dot(directionToLight, geocentricNormal);
                diffuse0 = lightIntensity * sampleTransmittanceLut(transmittanceLut, positionRadius, cosAngleLightToZenith);
            }
`,
            CUSTOM_REFLECTION: `
            {
                vec3 positionGlobal =  0.001 * vPositionW + vec3(0., planetRadius, 0.);
                float positionRadius = length(positionGlobal);
                vec3 geocentricNormal = positionGlobal / positionRadius;

                vec3 directionToLight = ${directionToLightSnippet};
                float cosAngleLightToZenith = dot(directionToLight, geocentricNormal);

                vec2 uv = vec2(0.5 + 0.5 * cosAngleLightToZenith, (positionRadius - planetRadius) / atmosphereThickness);
                float irradianceScaleT = 0.5 * dot(normalW, geocentricNormal) + 0.5;
                float irradianceScale = ((-0.6652 * irradianceScaleT) + 1.5927) * irradianceScaleT + 0.1023;
                vec3 environmentIrradiance = lightIntensity * sampleReflection(irradianceSampler, uv).rgb;

                // Add a contribution here to estimate indirect lighting.
                const float r = 0.2;
                float indirect = getLuminance(environmentIrradiance) / max(0.00001, 1. - r);
                environmentIrradiance *= irradianceScale;
                environmentIrradiance += indirect;

                environmentIrradiance += additionalDiffuseSkyIrradiance;

                const float diffuseBrdf = 1. / PI;
                environmentIrradiance *= diffuseBrdf * diffuseSkyIrradianceIntensity;

                reflectionOut.environmentIrradiance = environmentIrradiance;
                reflectionOut.environmentRadiance.rgb = reflectionOut.environmentIrradiance;
            }
`,
            // TODO: Support full ray marching if USE_AERIAL_PERSPECTIVE_LUT is disabled.
            CUSTOM_FRAGMENT_BEFORE_FOG: `
            #if USE_AERIAL_PERSPECTIVE_LUT
            {
                vec3 positionGlobal = 0.001 * vPositionW + vec3(0., planetRadius, 0.);
                float distanceFromCamera = distance(positionGlobal, cameraPositionGlobal);

                vec4 aerialPerspective = vec4(0.);
                if (sampleAerialPerspectiveLut(
                        gl_FragCoord.xy * inverseViewportSize,
                        true,
                        distanceFromCamera,
                        NumAerialPerspectiveLutLayers,
                        AerialPerspectiveLutKMPerSlice,
                        AerialPerspectiveLutRangeKM,
                        aerialPerspective)) {
                    finalColor = aerialPerspective + (1. - aerialPerspective.a) * finalColor;
                }
            }
            #endif
`,
        };
    }
}
