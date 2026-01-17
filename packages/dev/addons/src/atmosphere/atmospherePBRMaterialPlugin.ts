// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Atmosphere } from "./atmosphere";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Material } from "core/Materials/material";
import { MaterialDefines } from "core/Materials/materialDefines";
import { MaterialPluginBase } from "core/Materials/materialPluginBase";
import type { Nullable } from "core/types";
import type { UniformBuffer } from "core/Materials/uniformBuffer";
import { Vector3FromFloatsToRef, Vector3ScaleToRef } from "core/Maths/math.vector.functions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import "./ShadersWGSL/ShadersInclude/atmosphereFunctions";
import "./ShadersWGSL/ShadersInclude/atmosphereUboDeclaration";

class AtmospherePBRMaterialDefines extends MaterialDefines {
    public USE_AERIAL_PERSPECTIVE_LUT: boolean;
    public APPLY_AERIAL_PERSPECTIVE_INTENSITY = false;
    public APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS = false;
    public SAMPLE_TRANSMITTANCE_LUT = true;
    public EXCLUDE_RAY_MARCHING_FUNCTIONS = true;

    /**
     * Constructs the {@link AtmospherePBRMaterialDefines}.
     * @param useAerialPerspectiveLut - Whether to use the aerial perspective LUT.
     */
    constructor(useAerialPerspectiveLut: boolean) {
        super();
        this.USE_AERIAL_PERSPECTIVE_LUT = useAerialPerspectiveLut;
    }
}

const OriginOffsetUniformName = "originOffsetKm";
const InverseViewportSizeUniformName = "inverseViewportSize";

const UboArray = [
    { name: OriginOffsetUniformName, size: 3, type: "vec3" },
    { name: "_atmoPbrPadding1", size: 1, type: "float" },
    { name: InverseViewportSizeUniformName, size: 2, type: "vec2" },
];
const MakeUniforms = (atmosphere: Atmosphere) => ({
    ubo: UboArray,
    fragment: `uniform vec2 ${InverseViewportSizeUniformName};\nuniform vec3 ${OriginOffsetUniformName};\n`,
    externalUniforms: atmosphere.uniformBuffer.getUniformNames(),
});

const PluginName = "AtmospherePBRMaterialPlugin";
const PluginPriority = 600;
const OriginOffsetKm = { x: 0, y: 0, z: 0 };

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
                USE_CUSTOM_REFLECTION: _atmosphere.diffuseSkyIrradianceLut !== null,
                CUSTOM_FRAGMENT_BEFORE_FOG: _isAerialPerspectiveEnabled,
                USE_AERIAL_PERSPECTIVE_LUT: _isAerialPerspectiveEnabled && _atmosphere.isAerialPerspectiveLutEnabled,
                APPLY_AERIAL_PERSPECTIVE_INTENSITY: _isAerialPerspectiveEnabled && _atmosphere.aerialPerspectiveIntensity !== 1.0,
                APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS: _isAerialPerspectiveEnabled && _atmosphere.aerialPerspectiveRadianceBias !== 0.0,
                SAMPLE_TRANSMITTANCE_LUT: true,
                EXCLUDE_RAY_MARCHING_FUNCTIONS: true,
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
    public override isCompatible(): boolean {
        return true;
    }

    /**
     * @override
     */
    public override getUniformBuffersNames(_ubos: string[]): void {
        const uniformBuffer = this._atmosphere.uniformBuffer;
        if (uniformBuffer.useUbo) {
            const uboName = this._material.shaderLanguage === ShaderLanguage.WGSL ? "atmosphere" : uniformBuffer.name;
            _ubos.push(uboName);
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
        const scene = atmosphere.scene;
        const engine = scene.getEngine();

        // Bind the atmosphere's uniform buffer to the effect.
        const effect = uniformBuffer.currentEffect;
        if (effect) {
            this._atmosphere.bindUniformBufferToEffect(effect);
        }

        // Need the offset to apply which will take a world space position and convert it to a global space position in the atmosphere.
        // If floating origin mode is enabled, that offset is the floating origin offset.
        // If not, it's an offset up the Y-axis by the planet radius.
        uniformBuffer.updateVector3(
            OriginOffsetUniformName,
            scene.floatingOriginMode
                ? Vector3ScaleToRef(scene.floatingOriginOffset, 0.001, OriginOffsetKm) // Convert to kilometers
                : Vector3FromFloatsToRef(0, atmosphere.physicalProperties.planetRadius, 0, OriginOffsetKm) // planetRadius is already in kilometers
        );

        const width = engine.getRenderWidth();
        const height = engine.getRenderHeight();
        uniformBuffer.updateFloat2(InverseViewportSizeUniformName, 1.0 / width, 1.0 / height);

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
    public override getCustomCode(shaderType: string, shaderLanguage: ShaderLanguage): Nullable<Record<string, string>> {
        // Assumed inputs are light0, vPositionW, normalW.
        // Only works for directional lights.
        if (shaderType !== "fragment") {
            return null;
        }

        const useUbo = this._atmosphere.scene.getEngine().supportsUniformBuffers;
        const directionToLightSnippet = useUbo ? "-light0.vLightData.xyz" : "-vLightData0.xyz";

        const useAtmosphereUbo = shaderLanguage === ShaderLanguage.WGSL || this._atmosphere.uniformBuffer.useUbo;
        const atmosphereImportSnippet = useAtmosphereUbo ? "#include<atmosphereUboDeclaration>" : "#include<atmosphereFragmentDeclaration>";

        if (shaderLanguage === ShaderLanguage.GLSL) {
            return {
                CUSTOM_FRAGMENT_DEFINITIONS:
                    this._isAerialPerspectiveEnabled && this._atmosphere.isAerialPerspectiveLutEnabled
                        ? `uniform sampler2D transmittanceLut;\r\nprecision highp sampler2DArray;\r\nuniform sampler2DArray aerialPerspectiveLut;\r\n${atmosphereImportSnippet}\r\n#include<atmosphereFunctions>`
                        : `uniform sampler2D transmittanceLut;\r\n${atmosphereImportSnippet}\r\n#include<atmosphereFunctions>`,
                CUSTOM_LIGHT0_COLOR: `
            {
                vec3 positionGlobal = 0.001 * vPositionW + ${OriginOffsetUniformName};
                float positionRadius = length(positionGlobal);
                vec3 geocentricNormal = positionGlobal / positionRadius;
                vec3 directionToLight = ${directionToLightSnippet};
                float cosAngleLightToZenith = dot(directionToLight, geocentricNormal);
                diffuse0 = lightIntensity * sampleTransmittanceLut(transmittanceLut, positionRadius, cosAngleLightToZenith);
            }
`,
                CUSTOM_REFLECTION: `
            {
                vec3 positionGlobal =  0.001 * vPositionW + ${OriginOffsetUniformName};
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
                float distanceFromCameraKm = 0.001 * distance(vEyePosition.xyz, vPositionW);
                vec4 aerialPerspective = vec4(0.);
                if (sampleAerialPerspectiveLut(
                        gl_FragCoord.xy * ${InverseViewportSizeUniformName},
                        true,
                        distanceFromCameraKm,
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
        } else {
            // WGSL
            return {
                CUSTOM_FRAGMENT_DEFINITIONS:
                    this._isAerialPerspectiveEnabled && this._atmosphere.isAerialPerspectiveLutEnabled
                        ? `var transmittanceLutSampler: sampler;\r\nvar transmittanceLut: texture_2d<f32>;\r\nvar aerialPerspectiveLutSampler: sampler;\r\nvar aerialPerspectiveLut: texture_2d_array<f32>;\r\n${atmosphereImportSnippet}\r\n#include<atmosphereFunctions>`
                        : `var transmittanceLutSampler: sampler;\r\nvar transmittanceLut: texture_2d<f32>;\r\n${atmosphereImportSnippet}\r\n#include<atmosphereFunctions>`,
                CUSTOM_LIGHT0_COLOR: `
            {
                var positionGlobal = 0.001 * fragmentInputs.vPositionW + uniforms.${OriginOffsetUniformName};
                var positionRadius = length(positionGlobal);
                var geocentricNormal = positionGlobal / positionRadius;
                var directionToLight = ${directionToLightSnippet};
                var cosAngleLightToZenith = dot(directionToLight, geocentricNormal);
                diffuse0 = atmosphere.lightIntensity * sampleTransmittanceLut(transmittanceLut, positionRadius, cosAngleLightToZenith);
            }
`,
                CUSTOM_REFLECTION: `
            {
                var positionGlobal =  0.001 * fragmentInputs.vPositionW + uniforms.${OriginOffsetUniformName};
                var positionRadius = length(positionGlobal);
                var geocentricNormal = positionGlobal / positionRadius;

                var directionToLight = ${directionToLightSnippet};
                var cosAngleLightToZenith = dot(directionToLight, geocentricNormal);

                var uv = vec2f(0.5 + 0.5 * cosAngleLightToZenith, (positionRadius - atmosphere.planetRadius) / atmosphere.atmosphereThickness);
                var irradianceScaleT = 0.5 * dot(normalW, geocentricNormal) + 0.5;
                var irradianceScale = ((-0.6652 * irradianceScaleT) + 1.5927) * irradianceScaleT + 0.1023;
                var environmentIrradiance = atmosphere.lightIntensity * textureSample(irradianceSampler, irradianceSamplerSampler, uv).rgb;

                // Add a contribution here to estimate indirect lighting.
                const r = 0.2;
                var indirect = getLuminance(environmentIrradiance) / max(0.00001, 1.0 - r);
                environmentIrradiance *= irradianceScale;
                environmentIrradiance += indirect;

                environmentIrradiance += atmosphere.additionalDiffuseSkyIrradiance;

                const diffuseBrdf = 1.0 / PI;
                environmentIrradiance *= diffuseBrdf * atmosphere.diffuseSkyIrradianceIntensity;

                reflectionOut.environmentIrradiance = environmentIrradiance;
                reflectionOut.environmentRadiance = vec4f(reflectionOut.environmentIrradiance, reflectionOut.environmentRadiance.a);
            }
`,
                // TODO: Support full ray marching if USE_AERIAL_PERSPECTIVE_LUT is disabled.
                CUSTOM_FRAGMENT_BEFORE_FOG: `
            #if USE_AERIAL_PERSPECTIVE_LUT
            {
                var distanceFromCameraKm = 0.001 * distance(scene.vEyePosition.xyz, fragmentInputs.vPositionW);
                var aerialPerspective = vec4f(0.);
                if (sampleAerialPerspectiveLut(
                        fragmentInputs.position.xy * uniforms.${InverseViewportSizeUniformName},
                        true,
                        distanceFromCameraKm,
                        NumAerialPerspectiveLutLayers,
                        AerialPerspectiveLutKMPerSlice,
                        AerialPerspectiveLutRangeKM,
                        &aerialPerspective)) {
                    finalColor = aerialPerspective + (1. - aerialPerspective.a) * finalColor;
                }
            }
            #endif
`,
            };
        }
    }
}
