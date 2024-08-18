/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "../../types";
import { serialize, serializeAsTexture, expandToProperty, serializeAsColor3 } from "../../Misc/decorators";
import { Color3 } from "../../Maths/math.color";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import { MaterialFlags } from "../materialFlags";
import type { UniformBuffer } from "../../Materials/uniformBuffer";
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
export class MaterialClearCoatDefines extends MaterialDefines {
    public CLEARCOAT = false;
    public CLEARCOAT_DEFAULTIOR = false;
    public CLEARCOAT_TEXTURE = false;
    public CLEARCOAT_TEXTURE_ROUGHNESS = false;
    public CLEARCOAT_TEXTUREDIRECTUV = 0;
    public CLEARCOAT_TEXTURE_ROUGHNESSDIRECTUV = 0;
    public CLEARCOAT_BUMP = false;
    public CLEARCOAT_BUMPDIRECTUV = 0;
    public CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE = false;
    public CLEARCOAT_REMAP_F0 = false;

    public CLEARCOAT_TINT = false;
    public CLEARCOAT_TINT_TEXTURE = false;
    public CLEARCOAT_TINT_TEXTUREDIRECTUV = 0;
    public CLEARCOAT_TINT_GAMMATEXTURE = false;
}

/**
 * Plugin that implements the clear coat component of the PBR material
 */
export class PBRClearCoatConfiguration extends MaterialPluginBase {
    protected override _material: PBRBaseMaterial;

    /**
     * This defaults to 1.5 corresponding to a 0.04 f0 or a 4% reflectance at normal incidence
     * The default fits with a polyurethane material.
     * @internal
     */
    public static readonly _DefaultIndexOfRefraction = 1.5;

    private _isEnabled = false;
    /**
     * Defines if the clear coat is enabled in the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isEnabled = false;

    /**
     * Defines the clear coat layer strength (between 0 and 1) it defaults to 1.
     */
    @serialize()
    public intensity: number = 1;

    /**
     * Defines the clear coat layer roughness.
     */
    @serialize()
    public roughness: number = 0;

    private _indexOfRefraction = PBRClearCoatConfiguration._DefaultIndexOfRefraction;
    /**
     * Defines the index of refraction of the clear coat.
     * This defaults to 1.5 corresponding to a 0.04 f0 or a 4% reflectance at normal incidence
     * The default fits with a polyurethane material.
     * Changing the default value is more performance intensive.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public indexOfRefraction = PBRClearCoatConfiguration._DefaultIndexOfRefraction;

    private _texture: Nullable<BaseTexture> = null;
    /**
     * Stores the clear coat values in a texture (red channel is intensity and green channel is roughness)
     * If useRoughnessFromMainTexture is false, the green channel of texture is not used and the green channel of textureRoughness is used instead
     * if textureRoughness is not empty, else no texture roughness is used
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public texture: Nullable<BaseTexture> = null;

    private _useRoughnessFromMainTexture = true;
    /**
     * Indicates that the green channel of the texture property will be used for roughness (default: true)
     * If false, the green channel from textureRoughness is used for roughness
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useRoughnessFromMainTexture = true;

    private _textureRoughness: Nullable<BaseTexture> = null;
    /**
     * Stores the clear coat roughness in a texture (green channel)
     * Not used if useRoughnessFromMainTexture is true
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public textureRoughness: Nullable<BaseTexture> = null;

    private _remapF0OnInterfaceChange = true;
    /**
     * Defines if the F0 value should be remapped to account for the interface change in the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public remapF0OnInterfaceChange = true;

    private _bumpTexture: Nullable<BaseTexture> = null;
    /**
     * Define the clear coat specific bump texture.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public bumpTexture: Nullable<BaseTexture> = null;

    private _isTintEnabled = false;
    /**
     * Defines if the clear coat tint is enabled in the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isTintEnabled = false;

    /**
     * Defines the clear coat tint of the material.
     * This is only use if tint is enabled
     */
    @serializeAsColor3()
    public tintColor = Color3.White();

    /**
     * Defines the distance at which the tint color should be found in the
     * clear coat media.
     * This is only use if tint is enabled
     */
    @serialize()
    public tintColorAtDistance = 1;

    /**
     * Defines the clear coat layer thickness.
     * This is only use if tint is enabled
     */
    @serialize()
    public tintThickness: number = 1;

    private _tintTexture: Nullable<BaseTexture> = null;
    /**
     * Stores the clear tint values in a texture.
     * rgb is tint
     * a is a thickness factor
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public tintTexture: Nullable<BaseTexture> = null;

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
        super(material, "PBRClearCoat", 100, new MaterialClearCoatDefines(), addToPluginList);

        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[Constants.MATERIAL_TextureDirtyFlag];
    }

    public override isReadyForSubMesh(defines: MaterialClearCoatDefines, scene: Scene, engine: Engine): boolean {
        if (!this._isEnabled) {
            return true;
        }

        const disableBumpMap = this._material._disableBumpMap;
        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (this._texture && MaterialFlags.ClearCoatTextureEnabled) {
                    if (!this._texture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }

                if (this._textureRoughness && MaterialFlags.ClearCoatTextureEnabled) {
                    if (!this._textureRoughness.isReadyOrNotBlocking()) {
                        return false;
                    }
                }

                if (engine.getCaps().standardDerivatives && this._bumpTexture && MaterialFlags.ClearCoatBumpTextureEnabled && !disableBumpMap) {
                    // Bump texture cannot be not blocking.
                    if (!this._bumpTexture.isReady()) {
                        return false;
                    }
                }

                if (this._isTintEnabled && this._tintTexture && MaterialFlags.ClearCoatTintTextureEnabled) {
                    if (!this._tintTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    public override prepareDefinesBeforeAttributes(defines: MaterialClearCoatDefines, scene: Scene): void {
        if (this._isEnabled) {
            defines.CLEARCOAT = true;
            defines.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE = this._useRoughnessFromMainTexture;
            defines.CLEARCOAT_REMAP_F0 = this._remapF0OnInterfaceChange;

            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (this._texture && MaterialFlags.ClearCoatTextureEnabled) {
                        PrepareDefinesForMergedUV(this._texture, defines, "CLEARCOAT_TEXTURE");
                    } else {
                        defines.CLEARCOAT_TEXTURE = false;
                    }

                    if (this._textureRoughness && MaterialFlags.ClearCoatTextureEnabled) {
                        PrepareDefinesForMergedUV(this._textureRoughness, defines, "CLEARCOAT_TEXTURE_ROUGHNESS");
                    } else {
                        defines.CLEARCOAT_TEXTURE_ROUGHNESS = false;
                    }

                    if (this._bumpTexture && MaterialFlags.ClearCoatBumpTextureEnabled) {
                        PrepareDefinesForMergedUV(this._bumpTexture, defines, "CLEARCOAT_BUMP");
                    } else {
                        defines.CLEARCOAT_BUMP = false;
                    }

                    defines.CLEARCOAT_DEFAULTIOR = this._indexOfRefraction === PBRClearCoatConfiguration._DefaultIndexOfRefraction;

                    if (this._isTintEnabled) {
                        defines.CLEARCOAT_TINT = true;
                        if (this._tintTexture && MaterialFlags.ClearCoatTintTextureEnabled) {
                            PrepareDefinesForMergedUV(this._tintTexture, defines, "CLEARCOAT_TINT_TEXTURE");
                            defines.CLEARCOAT_TINT_GAMMATEXTURE = this._tintTexture.gammaSpace;
                        } else {
                            defines.CLEARCOAT_TINT_TEXTURE = false;
                        }
                    } else {
                        defines.CLEARCOAT_TINT = false;
                        defines.CLEARCOAT_TINT_TEXTURE = false;
                    }
                }
            }
        } else {
            defines.CLEARCOAT = false;
            defines.CLEARCOAT_TEXTURE = false;
            defines.CLEARCOAT_TEXTURE_ROUGHNESS = false;
            defines.CLEARCOAT_BUMP = false;
            defines.CLEARCOAT_TINT = false;
            defines.CLEARCOAT_TINT_TEXTURE = false;
            defines.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE = false;
            defines.CLEARCOAT_DEFAULTIOR = false;
            defines.CLEARCOAT_TEXTUREDIRECTUV = 0;
            defines.CLEARCOAT_TEXTURE_ROUGHNESSDIRECTUV = 0;
            defines.CLEARCOAT_BUMPDIRECTUV = 0;
            defines.CLEARCOAT_REMAP_F0 = false;
            defines.CLEARCOAT_TINT_TEXTUREDIRECTUV = 0;
            defines.CLEARCOAT_TINT_GAMMATEXTURE = false;
        }
    }

    public override bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {
        if (!this._isEnabled) {
            return;
        }

        const defines = subMesh!.materialDefines as unknown as MaterialClearCoatDefines;

        const isFrozen = this._material.isFrozen;

        const disableBumpMap = this._material._disableBumpMap;
        const invertNormalMapX = this._material._invertNormalMapX;
        const invertNormalMapY = this._material._invertNormalMapY;

        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if ((this._texture || this._textureRoughness) && MaterialFlags.ClearCoatTextureEnabled) {
                uniformBuffer.updateFloat4(
                    "vClearCoatInfos",
                    this._texture?.coordinatesIndex ?? 0,
                    this._texture?.level ?? 0,
                    this._textureRoughness?.coordinatesIndex ?? 0,
                    this._textureRoughness?.level ?? 0
                );
                if (this._texture) {
                    BindTextureMatrix(this._texture, uniformBuffer, "clearCoat");
                }
                if (this._textureRoughness && !defines.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE) {
                    BindTextureMatrix(this._textureRoughness, uniformBuffer, "clearCoatRoughness");
                }
            }

            if (this._bumpTexture && engine.getCaps().standardDerivatives && MaterialFlags.ClearCoatTextureEnabled && !disableBumpMap) {
                uniformBuffer.updateFloat2("vClearCoatBumpInfos", this._bumpTexture.coordinatesIndex, this._bumpTexture.level);
                BindTextureMatrix(this._bumpTexture, uniformBuffer, "clearCoatBump");

                if (scene._mirroredCameraPosition) {
                    uniformBuffer.updateFloat2("vClearCoatTangentSpaceParams", invertNormalMapX ? 1.0 : -1.0, invertNormalMapY ? 1.0 : -1.0);
                } else {
                    uniformBuffer.updateFloat2("vClearCoatTangentSpaceParams", invertNormalMapX ? -1.0 : 1.0, invertNormalMapY ? -1.0 : 1.0);
                }
            }

            if (this._tintTexture && MaterialFlags.ClearCoatTintTextureEnabled) {
                uniformBuffer.updateFloat2("vClearCoatTintInfos", this._tintTexture.coordinatesIndex, this._tintTexture.level);
                BindTextureMatrix(this._tintTexture, uniformBuffer, "clearCoatTint");
            }

            // Clear Coat General params
            uniformBuffer.updateFloat2("vClearCoatParams", this.intensity, this.roughness);

            // Clear Coat Refraction params
            const a = 1 - this._indexOfRefraction;
            const b = 1 + this._indexOfRefraction;
            const f0 = Math.pow(-a / b, 2); // Schlicks approx: (ior1 - ior2) / (ior1 + ior2) where ior2 for air is close to vacuum = 1.
            const eta = 1 / this._indexOfRefraction;
            uniformBuffer.updateFloat4("vClearCoatRefractionParams", f0, eta, a, b);

            if (this._isTintEnabled) {
                uniformBuffer.updateFloat4("vClearCoatTintParams", this.tintColor.r, this.tintColor.g, this.tintColor.b, Math.max(0.00001, this.tintThickness));
                uniformBuffer.updateFloat("clearCoatColorAtDistance", Math.max(0.00001, this.tintColorAtDistance));
            }
        }

        // Textures
        if (scene.texturesEnabled) {
            if (this._texture && MaterialFlags.ClearCoatTextureEnabled) {
                uniformBuffer.setTexture("clearCoatSampler", this._texture);
            }

            if (this._textureRoughness && !defines.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE && MaterialFlags.ClearCoatTextureEnabled) {
                uniformBuffer.setTexture("clearCoatRoughnessSampler", this._textureRoughness);
            }

            if (this._bumpTexture && engine.getCaps().standardDerivatives && MaterialFlags.ClearCoatBumpTextureEnabled && !disableBumpMap) {
                uniformBuffer.setTexture("clearCoatBumpSampler", this._bumpTexture);
            }

            if (this._isTintEnabled && this._tintTexture && MaterialFlags.ClearCoatTintTextureEnabled) {
                uniformBuffer.setTexture("clearCoatTintSampler", this._tintTexture);
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

        if (this._bumpTexture === texture) {
            return true;
        }

        if (this._tintTexture === texture) {
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

        if (this._bumpTexture) {
            activeTextures.push(this._bumpTexture);
        }

        if (this._tintTexture) {
            activeTextures.push(this._tintTexture);
        }
    }

    public override getAnimatables(animatables: IAnimatable[]): void {
        if (this._texture && this._texture.animations && this._texture.animations.length > 0) {
            animatables.push(this._texture);
        }

        if (this._textureRoughness && this._textureRoughness.animations && this._textureRoughness.animations.length > 0) {
            animatables.push(this._textureRoughness);
        }

        if (this._bumpTexture && this._bumpTexture.animations && this._bumpTexture.animations.length > 0) {
            animatables.push(this._bumpTexture);
        }

        if (this._tintTexture && this._tintTexture.animations && this._tintTexture.animations.length > 0) {
            animatables.push(this._tintTexture);
        }
    }

    public override dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            this._texture?.dispose();
            this._textureRoughness?.dispose();
            this._bumpTexture?.dispose();
            this._tintTexture?.dispose();
        }
    }

    public override getClassName(): string {
        return "PBRClearCoatConfiguration";
    }

    public override addFallbacks(defines: MaterialClearCoatDefines, fallbacks: EffectFallbacks, currentRank: number): number {
        if (defines.CLEARCOAT_BUMP) {
            fallbacks.addFallback(currentRank++, "CLEARCOAT_BUMP");
        }
        if (defines.CLEARCOAT_TINT) {
            fallbacks.addFallback(currentRank++, "CLEARCOAT_TINT");
        }
        if (defines.CLEARCOAT) {
            fallbacks.addFallback(currentRank++, "CLEARCOAT");
        }
        return currentRank;
    }

    public override getSamplers(samplers: string[]): void {
        samplers.push("clearCoatSampler", "clearCoatRoughnessSampler", "clearCoatBumpSampler", "clearCoatTintSampler");
    }

    public override getUniforms(): { ubo?: Array<{ name: string; size: number; type: string }>; vertex?: string; fragment?: string } {
        return {
            ubo: [
                { name: "vClearCoatParams", size: 2, type: "vec2" },
                { name: "vClearCoatRefractionParams", size: 4, type: "vec4" },
                { name: "vClearCoatInfos", size: 4, type: "vec4" },
                { name: "clearCoatMatrix", size: 16, type: "mat4" },
                { name: "clearCoatRoughnessMatrix", size: 16, type: "mat4" },
                { name: "vClearCoatBumpInfos", size: 2, type: "vec2" },
                { name: "vClearCoatTangentSpaceParams", size: 2, type: "vec2" },
                { name: "clearCoatBumpMatrix", size: 16, type: "mat4" },
                { name: "vClearCoatTintParams", size: 4, type: "vec4" },
                { name: "clearCoatColorAtDistance", size: 1, type: "float" },
                { name: "vClearCoatTintInfos", size: 2, type: "vec2" },
                { name: "clearCoatTintMatrix", size: 16, type: "mat4" },
            ],
        };
    }
}
