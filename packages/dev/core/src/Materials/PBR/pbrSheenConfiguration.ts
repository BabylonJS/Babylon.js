/* eslint-disable @typescript-eslint/naming-convention */
import { serialize, expandToProperty, serializeAsColor3, serializeAsTexture } from "../../Misc/decorators";
import type { UniformBuffer } from "../../Materials/uniformBuffer";
import { Color3 } from "../../Maths/math.color";
import { MaterialFlags } from "../../Materials/materialFlags";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import type { Nullable } from "../../types";
import type { IAnimatable } from "../../Animations/animatable.interface";
import type { EffectFallbacks } from "../effectFallbacks";
import type { SubMesh } from "../../Meshes/subMesh";
import { Constants } from "../../Engines/constants";
import { MaterialPluginBase } from "../materialPluginBase";
import { MaterialDefines } from "../materialDefines";

import type { Engine } from "../../Engines/engine";
import type { Scene } from "../../scene";
import type { PBRBaseMaterial } from "./pbrBaseMaterial";
import { BindTextureMatrix, PrepareDefinesForMergedUV } from "../materialHelper.functions";

/**
 * @internal
 */
export class MaterialSheenDefines extends MaterialDefines {
    public SHEEN = false;
    public SHEEN_TEXTURE = false;
    public SHEEN_GAMMATEXTURE = false;
    public SHEEN_TEXTURE_ROUGHNESS = false;
    public SHEEN_TEXTUREDIRECTUV = 0;
    public SHEEN_TEXTURE_ROUGHNESSDIRECTUV = 0;
    public SHEEN_LINKWITHALBEDO = false;
    public SHEEN_ROUGHNESS = false;
    public SHEEN_ALBEDOSCALING = false;
    public SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE = false;
}

/**
 * Plugin that implements the sheen component of the PBR material.
 */
export class PBRSheenConfiguration extends MaterialPluginBase {
    private _isEnabled = false;
    /**
     * Defines if the material uses sheen.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isEnabled = false;

    private _linkSheenWithAlbedo = false;
    /**
     * Defines if the sheen is linked to the sheen color.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public linkSheenWithAlbedo = false;

    /**
     * Defines the sheen intensity.
     */
    @serialize()
    public intensity = 1;

    /**
     * Defines the sheen color.
     */
    @serializeAsColor3()
    public color = Color3.White();

    private _texture: Nullable<BaseTexture> = null;
    /**
     * Stores the sheen tint values in a texture.
     * rgb is tint
     * a is a intensity or roughness if the roughness property has been defined and useRoughnessFromTexture is true (in that case, textureRoughness won't be used)
     * If the roughness property has been defined and useRoughnessFromTexture is false then the alpha channel is not used to modulate roughness
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public texture: Nullable<BaseTexture> = null;

    private _useRoughnessFromMainTexture = true;
    /**
     * Indicates that the alpha channel of the texture property will be used for roughness.
     * Has no effect if the roughness (and texture!) property is not defined
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useRoughnessFromMainTexture = true;

    private _roughness: Nullable<number> = null;
    /**
     * Defines the sheen roughness.
     * It is not taken into account if linkSheenWithAlbedo is true.
     * To stay backward compatible, material roughness is used instead if sheen roughness = null
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public roughness: Nullable<number> = null;

    private _textureRoughness: Nullable<BaseTexture> = null;
    /**
     * Stores the sheen roughness in a texture.
     * alpha channel is the roughness. This texture won't be used if the texture property is not empty and useRoughnessFromTexture is true
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public textureRoughness: Nullable<BaseTexture> = null;

    private _albedoScaling = false;
    /**
     * If true, the sheen effect is layered above the base BRDF with the albedo-scaling technique.
     * It allows the strength of the sheen effect to not depend on the base color of the material,
     * making it easier to setup and tweak the effect
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public albedoScaling = false;

    /** @internal */
    private _internalMarkAllSubMeshesAsTexturesDirty: () => void;

    /** @internal */
    public _markAllSubMeshesAsTexturesDirty(): void {
        this._enable(this._isEnabled);
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }

    /**
     * Gets a boolean indicating that the plugin is compatible with a given shader language.
     * @returns true if the plugin is compatible with the shader language
     */
    public override isCompatible(): boolean {
        return true;
    }

    constructor(material: PBRBaseMaterial, addToPluginList = true) {
        super(material, "Sheen", 120, new MaterialSheenDefines(), addToPluginList);

        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[Constants.MATERIAL_TextureDirtyFlag];
    }

    public override isReadyForSubMesh(defines: MaterialSheenDefines, scene: Scene): boolean {
        if (!this._isEnabled) {
            return true;
        }

        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (this._texture && MaterialFlags.SheenTextureEnabled) {
                    if (!this._texture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }

                if (this._textureRoughness && MaterialFlags.SheenTextureEnabled) {
                    if (!this._textureRoughness.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    public override prepareDefinesBeforeAttributes(defines: MaterialSheenDefines, scene: Scene): void {
        if (this._isEnabled) {
            defines.SHEEN = true;
            defines.SHEEN_LINKWITHALBEDO = this._linkSheenWithAlbedo;
            defines.SHEEN_ROUGHNESS = this._roughness !== null;
            defines.SHEEN_ALBEDOSCALING = this._albedoScaling;
            defines.SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE = this._useRoughnessFromMainTexture;

            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (this._texture && MaterialFlags.SheenTextureEnabled) {
                        PrepareDefinesForMergedUV(this._texture, defines, "SHEEN_TEXTURE");
                        defines.SHEEN_GAMMATEXTURE = this._texture.gammaSpace;
                    } else {
                        defines.SHEEN_TEXTURE = false;
                    }

                    if (this._textureRoughness && MaterialFlags.SheenTextureEnabled) {
                        PrepareDefinesForMergedUV(this._textureRoughness, defines, "SHEEN_TEXTURE_ROUGHNESS");
                    } else {
                        defines.SHEEN_TEXTURE_ROUGHNESS = false;
                    }
                }
            }
        } else {
            defines.SHEEN = false;
            defines.SHEEN_TEXTURE = false;
            defines.SHEEN_TEXTURE_ROUGHNESS = false;
            defines.SHEEN_LINKWITHALBEDO = false;
            defines.SHEEN_ROUGHNESS = false;
            defines.SHEEN_ALBEDOSCALING = false;
            defines.SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE = false;
            defines.SHEEN_GAMMATEXTURE = false;
            defines.SHEEN_TEXTUREDIRECTUV = 0;
            defines.SHEEN_TEXTURE_ROUGHNESSDIRECTUV = 0;
        }
    }

    public override bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {
        if (!this._isEnabled) {
            return;
        }

        const defines = subMesh!.materialDefines as unknown as MaterialSheenDefines;

        const isFrozen = this._material.isFrozen;

        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if ((this._texture || this._textureRoughness) && MaterialFlags.SheenTextureEnabled) {
                uniformBuffer.updateFloat4(
                    "vSheenInfos",
                    this._texture?.coordinatesIndex ?? 0,
                    this._texture?.level ?? 0,
                    this._textureRoughness?.coordinatesIndex ?? 0,
                    this._textureRoughness?.level ?? 0
                );
                if (this._texture) {
                    BindTextureMatrix(this._texture, uniformBuffer, "sheen");
                }
                if (this._textureRoughness && !defines.SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE) {
                    BindTextureMatrix(this._textureRoughness, uniformBuffer, "sheenRoughness");
                }
            }

            // Sheen
            uniformBuffer.updateFloat4("vSheenColor", this.color.r, this.color.g, this.color.b, this.intensity);

            if (this._roughness !== null) {
                uniformBuffer.updateFloat("vSheenRoughness", this._roughness);
            }
        }

        // Textures
        if (scene.texturesEnabled) {
            if (this._texture && MaterialFlags.SheenTextureEnabled) {
                uniformBuffer.setTexture("sheenSampler", this._texture);
            }

            if (this._textureRoughness && !defines.SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE && MaterialFlags.SheenTextureEnabled) {
                uniformBuffer.setTexture("sheenRoughnessSampler", this._textureRoughness);
            }
        }
    }

    public override hasTexture(texture: BaseTexture): boolean {
        if (this._texture === texture) {
            return true;
        }

        if (this._textureRoughness === texture) {
            return true;
        }

        return false;
    }

    public override getActiveTextures(activeTextures: BaseTexture[]): void {
        if (this._texture) {
            activeTextures.push(this._texture);
        }

        if (this._textureRoughness) {
            activeTextures.push(this._textureRoughness);
        }
    }

    public override getAnimatables(animatables: IAnimatable[]): void {
        if (this._texture && this._texture.animations && this._texture.animations.length > 0) {
            animatables.push(this._texture);
        }

        if (this._textureRoughness && this._textureRoughness.animations && this._textureRoughness.animations.length > 0) {
            animatables.push(this._textureRoughness);
        }
    }

    public override dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            this._texture?.dispose();
            this._textureRoughness?.dispose();
        }
    }

    public override getClassName(): string {
        return "PBRSheenConfiguration";
    }

    public override addFallbacks(defines: MaterialSheenDefines, fallbacks: EffectFallbacks, currentRank: number): number {
        if (defines.SHEEN) {
            fallbacks.addFallback(currentRank++, "SHEEN");
        }
        return currentRank;
    }

    public override getSamplers(samplers: string[]): void {
        samplers.push("sheenSampler", "sheenRoughnessSampler");
    }

    public override getUniforms(): { ubo?: Array<{ name: string; size: number; type: string }>; vertex?: string; fragment?: string } {
        return {
            ubo: [
                { name: "vSheenColor", size: 4, type: "vec4" },
                { name: "vSheenRoughness", size: 1, type: "float" },
                { name: "vSheenInfos", size: 4, type: "vec4" },
                { name: "sheenMatrix", size: 16, type: "mat4" },
                { name: "sheenRoughnessMatrix", size: 16, type: "mat4" },
            ],
        };
    }
}
