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
/**
 * @internal
 */
class MaterialIBLShadowsRenderDefines extends MaterialDefines {
    public RENDER_WITH_IBL_SHADOWS = false;
    public RSMCREATE_PROJTEXTURE = false;
}

/**
 * Plugin used to render the global illumination contribution.
 */
export class IBLShadowsPluginMaterial extends MaterialPluginBase {
    private _isPBR: boolean;

    /**
     * Defines the name of the plugin.
     */
    public static readonly Name = "IBLShadowsPluginMaterial";

    /**
     * The texture containing the global illumination contribution.
     */
    @serialize()
    public iblShadowsTexture: InternalTexture;

    /**
     * The width of the output texture.
     */
    @serialize()
    public outputTextureWidth: number;

    /**
     * The height of the output texture.
     */
    @serialize()
    public outputTextureHeight: number;

    /**
     * The opacity of the shadows.
     */
    @serialize()
    public shadowOpacity: number = 1.0;

    private _isEnabled = false;
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

    constructor(material: Material | StandardMaterial | PBRBaseMaterial) {
        super(material, IBLShadowsPluginMaterial.Name, 310, new MaterialIBLShadowsRenderDefines());

        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[Constants.MATERIAL_TextureDirtyFlag];

        this._isPBR = material instanceof PBRBaseMaterial;
    }

    public override prepareDefines(defines: MaterialIBLShadowsRenderDefines) {
        defines.RENDER_WITH_IBL_SHADOWS = this._isEnabled;
    }

    public override getClassName() {
        return "IBLShadowsPluginMaterial";
    }

    public override getUniforms() {
        return {
            ubo: [
                { name: "iblShadowsTextureSize", size: 2, type: "vec2" },
                { name: "shadowOpacity", size: 1, type: "float" },
            ],
            fragment: `#ifdef RENDER_WITH_IBL_SHADOWS
                    uniform vec2 iblShadowsTextureSize;
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
            uniformBuffer.updateFloat2("iblShadowsTextureSize", this.outputTextureWidth, this.outputTextureHeight);
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

                    fn computeIndirectShadow() -> float {
                        var uv = fragmentInputs.position.xy / uniforms.iblShadowsTextureSize;
                        return mix(textureSample(iblShadowsTexture, iblShadowsTextureSampler, uv).r, 1.0, 1.0 - uniforms.shadowOpacity);
                    }
                #endif
            `,

                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION: `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    float shadowValue = computeIndirectShadow();
                    finalIrradiance *= shadowValue;
                    finalRadianceScaled *= mix(1.0, shadowValue, roughness);
                #endif
            `,
            };

            if (!this._isPBR) {
                frag["CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR"] = `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    color = vec4f(color.rgb + computeIndirectShadow() * baseColor.rgb, color.a);
                #endif
            `;
            }
        } else {
            frag = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_DEFINITIONS: `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    uniform sampler2D iblShadowsTexture;

                    float computeIndirectShadow() {
                        vec2 uv = gl_FragCoord.xy / iblShadowsTextureSize;
                        return mix(texture2D(iblShadowsTexture, uv).r, 1.0, 1.0 - shadowOpacity);
                    }
                #endif
            `,

                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION: `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    float shadowValue = computeIndirectShadow();
                    finalIrradiance *= shadowValue;
                    finalRadianceScaled *= mix(1.0, shadowValue, roughness);
                #endif
            `,
            };

            if (!this._isPBR) {
                frag["CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR"] = `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    color.rgb += computeIndirectShadow() * baseColor.rgb;
                #endif
            `;
            }
        }

        return shaderType === "vertex" ? null : frag;
    }
}

RegisterClass(`BABYLON.IBLShadowsPluginMaterial`, IBLShadowsPluginMaterial);
