import { MaterialDefines } from "core/Materials/materialDefines";
import { MaterialPluginBase } from "core/Materials/materialPluginBase";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import type { Material } from "core/Materials/material";
import { Constants } from "core/Engines/constants";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import type { UniformBuffer } from "core/Materials/uniformBuffer";
import { expandToProperty, serialize } from "core/Misc/decorators";
import { RegisterClass } from "core/Misc/typeStore";

import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
/**
 * @internal
 */
class MaterialIBLShadowsRenderDefines extends MaterialDefines {
    public RENDER_WITH_IBL_SHADOWS = false;
    public COLORED_IBL_SHADOWS = false;
}

/**
 * Plugin used to render the contribution from IBL shadows.
 */
export class IBLShadowsPluginMaterial extends MaterialPluginBase {
    /**
     * Defines the name of the plugin.
     */
    public static readonly Name = "IBLShadowsPluginMaterial";

    /**
     * The texture containing the contribution from IBL shadows.
     */
    public iblShadowsTexture: InternalTexture;

    /**
     * The opacity of the shadows.
     */
    @serialize()
    public shadowOpacity: number = 1.0;

    private _isEnabled = false;
    private _isColored = false;
    public get isColored(): boolean {
        return this._isColored;
    }
    public set isColored(value: boolean) {
        if (this._isColored === value) {
            return;
        }
        this._isColored = value;
        this._markAllSubMeshesAsTexturesDirty();
    }
    /**
     * Defines if the plugin is enabled in the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isEnabled = false;

    protected _markAllSubMeshesAsTexturesDirty(): void {
        this._enable(this._isEnabled);
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }

    private _internalMarkAllSubMeshesAsTexturesDirty: () => void;

    /**
     * Gets a boolean indicating that the plugin is compatible with a give shader language.
     * @returns true if the plugin is compatible with the shader language
     */
    public override isCompatible(): boolean {
        return true;
    }

    constructor(material: Material | StandardMaterial | PBRBaseMaterial | OpenPBRMaterial) {
        super(material, IBLShadowsPluginMaterial.Name, 310, new MaterialIBLShadowsRenderDefines());
        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[Constants.MATERIAL_TextureDirtyFlag];
    }

    public override prepareDefines(defines: MaterialIBLShadowsRenderDefines) {
        defines.RENDER_WITH_IBL_SHADOWS = this._isEnabled;
        defines.COLORED_IBL_SHADOWS = this.isColored;
    }

    public override getClassName() {
        return "IBLShadowsPluginMaterial";
    }

    public override getUniforms() {
        return {
            ubo: [
                { name: "renderTargetSize", size: 2, type: "vec2" },
                { name: "shadowOpacity", size: 1, type: "float" },
            ],
            fragment: `#ifdef RENDER_WITH_IBL_SHADOWS
                    uniform vec2 renderTargetSize;
                    uniform float shadowOpacity;
                #endif`,
        };
    }

    public override getSamplers(samplers: string[]) {
        samplers.push("iblShadowsTexture");
    }

    public override bindForSubMesh(uniformBuffer: UniformBuffer) {
        if (this._isEnabled) {
            uniformBuffer.bindTexture("iblShadowsTexture", this.iblShadowsTexture);
            uniformBuffer.updateFloat2("renderTargetSize", this._material.getScene().getEngine().getRenderWidth(), this._material.getScene().getEngine().getRenderHeight());
            uniformBuffer.updateFloat("shadowOpacity", this.shadowOpacity);
        }
    }

    public override getCustomCode(shaderType: string, shaderLanguage: ShaderLanguage) {
        let frag: { [name: string]: string };

        if (shaderLanguage === ShaderLanguage.WGSL) {
            frag = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_DEFINITIONS: `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    var iblShadowsTextureSampler: sampler;
                    var iblShadowsTexture: texture_2d<f32>;

                    #ifdef COLORED_IBL_SHADOWS
                        fn computeIndirectShadow() -> vec3f {
                            var uv = fragmentInputs.position.xy / uniforms.renderTargetSize;
                            var shadowValue: vec3f = textureSample(iblShadowsTexture, iblShadowsTextureSampler, uv).rgb;
                            return mix(shadowValue, vec3f(1.0), 1.0 - uniforms.shadowOpacity);
                        }
                    #else
                        fn computeIndirectShadow() -> vec2f {
                            var uv = fragmentInputs.position.xy / uniforms.renderTargetSize;
                            var shadowValue: vec2f = textureSample(iblShadowsTexture, iblShadowsTextureSampler, uv).rg;
                            return mix(shadowValue, vec2f(1.0), 1.0 - uniforms.shadowOpacity);
                        }
                    #endif
                #endif
            `,
            };

            if (this._material instanceof PBRBaseMaterial) {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                frag["CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION"] = `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    #ifndef UNLIT
                        #ifdef REFLECTION
                            #ifdef COLORED_IBL_SHADOWS
                                var shadowValue: vec3f = computeIndirectShadow();
                                finalIrradiance *= shadowValue;
                                finalRadianceScaled *= mix(vec3f(1.0), shadowValue, roughness);
                            #else
                                var shadowValue: vec2f = computeIndirectShadow();
                                finalIrradiance *= vec3f(shadowValue.x);
                                finalRadianceScaled *= vec3f(mix(pow(shadowValue.y, 4.0), shadowValue.x, roughness));
                            #endif
                        #endif
                    #else
                        finalDiffuse *= computeIndirectShadow().x;
                    #endif
                #endif
            `;
            } else if (this._material instanceof OpenPBRMaterial) {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                frag["CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION"] = `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    #ifndef UNLIT
                        #ifdef REFLECTION
                            #ifdef COLORED_IBL_SHADOWS
                                var shadowValue: vec3f = computeIndirectShadow();
                                finalIrradiance *= shadowValue;
                                finalRadianceScaled *= mix(vec3f(1.0), shadowValue, roughness);
                            #else
                                var shadowValue: vec2f = computeIndirectShadow();
                                finalIrradiance *= vec3f(shadowValue.x);
                                finalRadianceScaled *= vec3f(mix(pow(shadowValue.y, 4.0), shadowValue.x, roughness));
                            #endif
                        #endif
                    #else
                        finalDiffuse *= computeIndirectShadow().x;
                    #endif
                #endif
            `;
            } else {
                frag["CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR"] = `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    #ifdef COLORED_IBL_SHADOWS
                        var shadowValue: vec3f = computeIndirectShadow();
                        color *= toGammaSpace(vec4f(shadowValue, 1.0f));
                    #else
                        var shadowValue: vec2f = computeIndirectShadow();
                        color *= toGammaSpace(vec4f(shadowValue.x, shadowValue.x, shadowValue.x, 1.0f));
                    #endif
                #endif
            `;
            }
        } else {
            frag = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_DEFINITIONS: `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    uniform sampler2D iblShadowsTexture;
                #ifdef COLORED_IBL_SHADOWS
                    vec3 computeIndirectShadow() {
                        vec2 uv = gl_FragCoord.xy / renderTargetSize;
                        vec3 shadowValue = texture2D(iblShadowsTexture, uv).rgb;
                        return mix(shadowValue.rgb, vec3(1.0), 1.0 - shadowOpacity);
                    }
                #else
                    vec2 computeIndirectShadow() {
                        vec2 uv = gl_FragCoord.xy / renderTargetSize;
                        vec2 shadowValue = texture2D(iblShadowsTexture, uv).rg;
                        return mix(shadowValue.rg, vec2(1.0), 1.0 - shadowOpacity);
                    }
                #endif
                #endif
            `,
            };

            if (this._material instanceof PBRBaseMaterial) {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                frag["CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION"] = `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    #ifndef UNLIT
                        #ifdef REFLECTION
                            #ifdef COLORED_IBL_SHADOWS
                                vec3 shadowValue = computeIndirectShadow();
                                finalIrradiance.rgb *= shadowValue.rgb;
                                finalRadianceScaled *= mix(vec3(1.0), shadowValue.rgb, roughness);
                            #else
                                vec2 shadowValue = computeIndirectShadow();
                                finalIrradiance *= shadowValue.x;
                                finalRadianceScaled *= mix(pow(shadowValue.y, 4.0), shadowValue.x, roughness);
                            #endif
                        #endif
                    #else
                        finalDiffuse *= computeIndirectShadow().x;
                    #endif
                #endif
            `;
            } else if (this._material instanceof OpenPBRMaterial) {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                frag["CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION"] = `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    #ifndef UNLIT
                        #ifdef REFLECTION
                            #ifdef COLORED_IBL_SHADOWS
                                vec3 shadowValue = computeIndirectShadow();
                                finalIrradiance.rgb *= shadowValue.rgb;
                                finalRadianceScaled *= mix(vec3(1.0), shadowValue.rgb, roughness);
                            #else
                                vec2 shadowValue = computeIndirectShadow();
                                finalIrradiance *= shadowValue.x;
                                finalRadianceScaled *= mix(pow(shadowValue.y, 4.0), shadowValue.x, roughness);
                            #endif
                        #endif
                    #else
                        finalDiffuse *= computeIndirectShadow().x;
                    #endif
                #endif
            `;
            } else {
                frag["CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR"] = `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    #ifdef COLORED_IBL_SHADOWS
                        vec3 shadowValue = computeIndirectShadow();
                        color.rgb *= toGammaSpace(shadowValue.rgb);
                    #else
                        vec2 shadowValue = computeIndirectShadow();
                        color.rgb *= toGammaSpace(shadowValue.x);
                    #endif
                #endif
            `;
            }
        }

        return shaderType === "vertex" ? null : frag;
    }
}

RegisterClass(`BABYLON.IBLShadowsPluginMaterial`, IBLShadowsPluginMaterial);
