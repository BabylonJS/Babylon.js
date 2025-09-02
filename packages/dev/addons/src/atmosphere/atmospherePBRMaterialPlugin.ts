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
    public USE_AERIAL_PERSPECTIVE_LUT;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public APPLY_AERIAL_PERSPECTIVE_INTENSITY;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS;

    /**
     * Constructs the {@link AtmospherePBRMaterialDefines}.
     * @param useAerialPerspectiveLut - Whether to use the aerial perspective LUT.
     */
    constructor(useAerialPerspectiveLut: boolean) {
        super();
        this.USE_AERIAL_PERSPECTIVE_LUT = useAerialPerspectiveLut;
        this.APPLY_AERIAL_PERSPECTIVE_INTENSITY = false;
        this.APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS = false;
    }
}

/**
 * Adds shading logic to a PBRMaterial that provides radiance, diffuse sky irradiance, and aerial perspective from the atmosphere.
 */
export class AtmospherePBRMaterialPlugin extends MaterialPluginBase {
    private readonly _atmosphere: Atmosphere;
    private readonly _isAerialPerspectiveEnabled: boolean;

    /**
     * Constructs the {@link AtmospherePBRMaterialPlugin}.
     * @param material - The material to apply the plugin to.
     * @param atmosphere - The atmosphere to use for shading.
     * @param isAerialPerspectiveEnabled - Whether to apply aerial perspective.
     */
    constructor(material: Material, atmosphere: Atmosphere, isAerialPerspectiveEnabled = false) {
        super(
            material,
            "AtmospherePBRMaterialPlugin",
            600,
            {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                USE_CUSTOM_REFLECTION: atmosphere.diffuseSkyIrradianceLut !== null,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_BEFORE_FOG: isAerialPerspectiveEnabled,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                USE_AERIAL_PERSPECTIVE_LUT: isAerialPerspectiveEnabled && atmosphere.isAerialPerspectiveLutEnabled,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                APPLY_AERIAL_PERSPECTIVE_INTENSITY: isAerialPerspectiveEnabled && atmosphere.aerialPerspectiveIntensity !== 1.0,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS: isAerialPerspectiveEnabled && atmosphere.aerialPerspectiveRadianceBias !== 0.0,
            },
            false, // addPluginToList -- false because we need to control when this is added to the list
            true, // enable
            true // resolveIncludes
        );
        this._atmosphere = atmosphere;
        this._isAerialPerspectiveEnabled = isAerialPerspectiveEnabled;

        // This calls `getCode` so we need to do this after having initialized the class fields.
        this._pluginManager._addPlugin(this);
    }

    /**
     * @override
     */
    public override getUniformBuffersNames(_ubos: string[]): void {
        _ubos.push(this._atmosphere.uniformBuffer.name);
    }

    /**
     * @override
     */
    public override getUniforms(): { ubo?: { name: string; size: number; type: string }[]; vertex?: string; fragment?: string } {
        return {
            ubo: [{ name: "inverseViewportSize", size: 2, type: "vec2" }],
        };
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
        const engine = atmosphere.getScene().getEngine();

        // Bind the atmosphere's uniform buffer to the effect.
        const effect = uniformBuffer.currentEffect;
        if (effect) {
            const atmosphereUbo = atmosphere.uniformBuffer;
            const atmosphereUboName = atmosphere.uniformBuffer.name;
            atmosphereUbo.bindToEffect(effect, atmosphereUboName);
            engine.bindUniformBufferBase(atmosphereUbo.getBuffer()!, effect._uniformBuffersNames[atmosphereUboName], atmosphereUboName);
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

        return {
            CUSTOM_FRAGMENT_DEFINITIONS:
                this._isAerialPerspectiveEnabled && this._atmosphere.isAerialPerspectiveLutEnabled
                    ? "uniform sampler2D transmittanceLut;\r\nprecision highp sampler2DArray;\r\nuniform sampler2DArray aerialPerspectiveLut;\r\n#include<atmosphereUbo>\r\n#include<atmosphereFunctions>"
                    : "uniform sampler2D transmittanceLut;\r\n#include<atmosphereUbo>\r\n#include<atmosphereFunctions>",
            CUSTOM_LIGHT0_COLOR: `
            {
                vec3 positionGlobal = vPositionW / 1000. + vec3(0., planetRadius, 0.);
                float positionRadius = length(positionGlobal);
                vec3 geocentricNormal = positionGlobal / positionRadius;
                float cosAngleLightToZenith = dot(-light0.vLightData.xyz, geocentricNormal);
                diffuse0 = lightIntensity * sampleTransmittanceLut(transmittanceLut, positionRadius, cosAngleLightToZenith);
            }
            `,
            CUSTOM_REFLECTION: `
            {
                vec3 positionGlobal =  0.001 * vPositionW + vec3(0., planetRadius, 0.);
                float positionRadius = length(positionGlobal);
                vec3 geocentricNormal = positionGlobal / positionRadius;

                vec3 directionToLight = -light0.vLightData.xyz;
                float cosAngleLightToZenith = dot(directionToLight, geocentricNormal);

                vec2 uv = vec2(0.5 + 0.5 * cosAngleLightToZenith, (positionRadius - planetRadius) / atmosphereThickness);
                vec3 environmentIrradiance = lightIntensity * sampleReflection(irradianceSampler, uv).rgb;

                // Add a contribution here to estimate indirect lighting.
                const float r = 0.3;
                float nDotGeoN = dot(normalW, geocentricNormal);
                float bounceWeight = 0.5 * nDotGeoN + 0.5;
                float bounceScale =  0.1 + 0.9 * max(0., cosAngleLightToZenith);
                float indirect = bounceScale * bounceWeight * getLuminance(environmentIrradiance) / max(0.00001, 1. - r);

                environmentIrradiance += additionalDiffuseSkyIrradiance;

                environmentIrradiance += indirect;

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
                            AerialPerspectiveLutKmPerSlice,
                            AerialPerspectiveLutRangeKm,
                            aerialPerspective)) {
                        finalColor = aerialPerspective + (1. - aerialPerspective.a) * finalColor;
                    }
            }
            #endif
            `,
        };
    }
}
