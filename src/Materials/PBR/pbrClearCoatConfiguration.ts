import { Nullable } from "../../types";
import { SerializationHelper, serialize, serializeAsTexture, expandToProperty, serializeAsColor3 } from "../../Misc/decorators";
import { Color3 } from '../../Maths/math.color';
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { MaterialFlags } from "../materialFlags";
import { UniformBuffer } from "../../Materials/uniformBuffer";
import { MaterialHelper } from "../../Materials/materialHelper";
import { IAnimatable } from '../../Animations/animatable.interface';
import { EffectFallbacks } from '../effectFallbacks';
import { SubMesh } from '../../Meshes/subMesh';

declare type Engine = import("../../Engines/engine").Engine;
declare type Scene = import("../../scene").Scene;

/**
 * @hidden
 */
export interface IMaterialClearCoatDefines {
    CLEARCOAT: boolean;
    CLEARCOAT_DEFAULTIOR: boolean;
    CLEARCOAT_TEXTURE: boolean;
    CLEARCOAT_TEXTURE_ROUGHNESS: boolean;
    CLEARCOAT_TEXTUREDIRECTUV: number;
    CLEARCOAT_TEXTURE_ROUGHNESSDIRECTUV: number;
    CLEARCOAT_BUMP: boolean;
    CLEARCOAT_BUMPDIRECTUV: number;
    CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE: boolean;
    CLEARCOAT_TEXTURE_ROUGHNESS_IDENTICAL: boolean;
    CLEARCOAT_REMAP_F0: boolean;

    CLEARCOAT_TINT: boolean;
    CLEARCOAT_TINT_TEXTURE: boolean;
    CLEARCOAT_TINT_TEXTUREDIRECTUV: number;

    /** @hidden */
    _areTexturesDirty: boolean;
}

/**
 * Define the code related to the clear coat parameters of the pbr material.
 */
export class PBRClearCoatConfiguration {
    /**
     * This defaults to 1.5 corresponding to a 0.04 f0 or a 4% reflectance at normal incidence
     * The default fits with a polyurethane material.
     * @hidden
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

    /** @hidden */
    private _internalMarkAllSubMeshesAsTexturesDirty: () => void;

    /** @hidden */
    public _markAllSubMeshesAsTexturesDirty(): void {
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }

    /**
     * Instantiate a new instance of clear coat configuration.
     * @param markAllSubMeshesAsTexturesDirty Callback to flag the material to dirty
     */
    constructor(markAllSubMeshesAsTexturesDirty: () => void) {
        this._internalMarkAllSubMeshesAsTexturesDirty = markAllSubMeshesAsTexturesDirty;
    }

    /**
     * Gets whether the submesh is ready to be used or not.
     * @param defines the list of "defines" to update.
     * @param scene defines the scene the material belongs to.
     * @param engine defines the engine the material belongs to.
     * @param disableBumpMap defines whether the material disables bump or not.
     * @returns - boolean indicating that the submesh is ready or not.
     */
    public isReadyForSubMesh(defines: IMaterialClearCoatDefines, scene: Scene, engine: Engine, disableBumpMap: boolean): boolean {
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

    /**
     * Checks to see if a texture is used in the material.
     * @param defines the list of "defines" to update.
     * @param scene defines the scene to the material belongs to.
     */
    public prepareDefines(defines: IMaterialClearCoatDefines, scene: Scene): void {
        if (this._isEnabled) {
            defines.CLEARCOAT = true;
            defines.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE = this._useRoughnessFromMainTexture;
            defines.CLEARCOAT_TEXTURE_ROUGHNESS_IDENTICAL = this._texture !== null && this._texture._texture === this._textureRoughness?._texture && this._texture.checkTransformsAreIdentical(this._textureRoughness);
            defines.CLEARCOAT_REMAP_F0 = this._remapF0OnInterfaceChange;

            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (this._texture && MaterialFlags.ClearCoatTextureEnabled) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._texture, defines, "CLEARCOAT_TEXTURE");
                    } else {
                        defines.CLEARCOAT_TEXTURE = false;
                    }

                    if (this._textureRoughness && MaterialFlags.ClearCoatTextureEnabled) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._textureRoughness, defines, "CLEARCOAT_TEXTURE_ROUGHNESS");
                    } else {
                        defines.CLEARCOAT_TEXTURE_ROUGHNESS = false;
                    }

                    if (this._bumpTexture && MaterialFlags.ClearCoatBumpTextureEnabled) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._bumpTexture, defines, "CLEARCOAT_BUMP");
                    } else {
                        defines.CLEARCOAT_BUMP = false;
                    }

                    defines.CLEARCOAT_DEFAULTIOR = this._indexOfRefraction === PBRClearCoatConfiguration._DefaultIndexOfRefraction;

                    if (this._isTintEnabled) {
                        defines.CLEARCOAT_TINT = true;
                        if (this._tintTexture && MaterialFlags.ClearCoatTintTextureEnabled) {
                            MaterialHelper.PrepareDefinesForMergedUV(this._tintTexture, defines, "CLEARCOAT_TINT_TEXTURE");
                        }
                        else {
                            defines.CLEARCOAT_TINT_TEXTURE = false;
                        }
                    }
                    else {
                        defines.CLEARCOAT_TINT = false;
                        defines.CLEARCOAT_TINT_TEXTURE = false;
                    }
                }
            }
        }
        else {
            defines.CLEARCOAT = false;
            defines.CLEARCOAT_TEXTURE = false;
            defines.CLEARCOAT_TEXTURE_ROUGHNESS = false;
            defines.CLEARCOAT_BUMP = false;
            defines.CLEARCOAT_TINT = false;
            defines.CLEARCOAT_TINT_TEXTURE = false;
            defines.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE = false;
            defines.CLEARCOAT_TEXTURE_ROUGHNESS_IDENTICAL = false;
        }
    }

    /**
     * Binds the material data.
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param scene defines the scene the material belongs to.
     * @param engine defines the engine the material belongs to.
     * @param disableBumpMap defines whether the material disables bump or not.
     * @param isFrozen defines whether the material is frozen or not.
     * @param invertNormalMapX If sets to true, x component of normal map value will be inverted (x = 1.0 - x).
     * @param invertNormalMapY If sets to true, y component of normal map value will be inverted (y = 1.0 - y).
     * @param subMesh the submesh to bind data for
     */
    public bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, disableBumpMap: boolean, isFrozen: boolean, invertNormalMapX: boolean, invertNormalMapY: boolean, subMesh?: SubMesh): void {
        const defines = subMesh!._materialDefines as unknown as IMaterialClearCoatDefines;

        const identicalTextures = defines.CLEARCOAT_TEXTURE_ROUGHNESS_IDENTICAL;

        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if (identicalTextures && MaterialFlags.ClearCoatTextureEnabled) {
                uniformBuffer.updateFloat4("vClearCoatInfos", this._texture!.coordinatesIndex, this._texture!.level, -1, -1);
                MaterialHelper.BindTextureMatrix(this._texture!, uniformBuffer, "clearCoat");
            } else  if ((this._texture || this._textureRoughness) && MaterialFlags.ClearCoatTextureEnabled) {
                uniformBuffer.updateFloat4("vClearCoatInfos", this._texture?.coordinatesIndex ?? 0, this._texture?.level ?? 0, this._textureRoughness?.coordinatesIndex ?? 0, this._textureRoughness?.level ?? 0);
                if (this._texture) {
                    MaterialHelper.BindTextureMatrix(this._texture, uniformBuffer, "clearCoat");
                }
                if (this._textureRoughness && !identicalTextures && !defines.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE) {
                    MaterialHelper.BindTextureMatrix(this._textureRoughness, uniformBuffer, "clearCoatRoughness");
                }
            }

            if (this._bumpTexture && engine.getCaps().standardDerivatives && MaterialFlags.ClearCoatTextureEnabled && !disableBumpMap) {
                uniformBuffer.updateFloat2("vClearCoatBumpInfos", this._bumpTexture.coordinatesIndex, this._bumpTexture.level);
                MaterialHelper.BindTextureMatrix(this._bumpTexture, uniformBuffer, "clearCoatBump");

                if (scene._mirroredCameraPosition) {
                    uniformBuffer.updateFloat2("vClearCoatTangentSpaceParams", invertNormalMapX ? 1.0 : -1.0, invertNormalMapY ? 1.0 : -1.0);
                } else {
                    uniformBuffer.updateFloat2("vClearCoatTangentSpaceParams", invertNormalMapX ? -1.0 : 1.0, invertNormalMapY ? -1.0 : 1.0);
                }
            }

            if (this._tintTexture && MaterialFlags.ClearCoatTintTextureEnabled) {
                uniformBuffer.updateFloat2("vClearCoatTintInfos", this._tintTexture.coordinatesIndex, this._tintTexture.level);
                MaterialHelper.BindTextureMatrix(this._tintTexture, uniformBuffer, "clearCoatTint");
            }

            // Clear Coat General params
            uniformBuffer.updateFloat2("vClearCoatParams", this.intensity, this.roughness);

            // Clear Coat Refraction params
            const a = 1 - this._indexOfRefraction;
            const b = 1 + this._indexOfRefraction;
            const f0 = Math.pow((-a / b), 2); // Schlicks approx: (ior1 - ior2) / (ior1 + ior2) where ior2 for air is close to vacuum = 1.
            const eta = 1 / this._indexOfRefraction;
            uniformBuffer.updateFloat4("vClearCoatRefractionParams", f0, eta, a, b);

            if (this._isTintEnabled) {
                uniformBuffer.updateFloat4("vClearCoatTintParams",
                    this.tintColor.r,
                    this.tintColor.g,
                    this.tintColor.b,
                    Math.max(0.00001, this.tintThickness));
                uniformBuffer.updateFloat("clearCoatColorAtDistance", Math.max(0.00001, this.tintColorAtDistance));
            }
        }

        // Textures
        if (scene.texturesEnabled) {
            if (this._texture && MaterialFlags.ClearCoatTextureEnabled) {
                uniformBuffer.setTexture("clearCoatSampler", this._texture);
            }

            if (this._textureRoughness && !identicalTextures && !defines.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE && MaterialFlags.ClearCoatTextureEnabled) {
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

    /**
     * Checks to see if a texture is used in the material.
     * @param texture - Base texture to use.
     * @returns - Boolean specifying if a texture is used in the material.
     */
    public hasTexture(texture: BaseTexture): boolean {
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

    /**
     * Returns an array of the actively used textures.
     * @param activeTextures Array of BaseTextures
     */
    public getActiveTextures(activeTextures: BaseTexture[]): void {
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

    /**
     * Returns the animatable textures.
     * @param animatables Array of animatable textures.
     */
    public getAnimatables(animatables: IAnimatable[]): void {
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

    /**
     * Disposes the resources of the material.
     * @param forceDisposeTextures - Forces the disposal of all textures.
     */
    public dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            this._texture?.dispose();
            this._textureRoughness?.dispose();
            this._bumpTexture?.dispose();
            this._tintTexture?.dispose();
        }
    }

    /**
    * Get the current class name of the texture useful for serialization or dynamic coding.
    * @returns "PBRClearCoatConfiguration"
    */
    public getClassName(): string {
        return "PBRClearCoatConfiguration";
    }

    /**
     * Add fallbacks to the effect fallbacks list.
     * @param defines defines the Base texture to use.
     * @param fallbacks defines the current fallback list.
     * @param currentRank defines the current fallback rank.
     * @returns the new fallback rank.
     */
    public static AddFallbacks(defines: IMaterialClearCoatDefines, fallbacks: EffectFallbacks, currentRank: number): number {
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

    /**
     * Add the required uniforms to the current list.
     * @param uniforms defines the current uniform list.
     */
    public static AddUniforms(uniforms: string[]): void {
        uniforms.push("vClearCoatTangentSpaceParams", "vClearCoatParams", "vClearCoatRefractionParams",
            "vClearCoatTintParams", "clearCoatColorAtDistance",
            "clearCoatMatrix", "clearCoatRoughnessMatrix", "clearCoatBumpMatrix", "clearCoatTintMatrix",
            "vClearCoatInfos", "vClearCoatBumpInfos", "vClearCoatTintInfos");
    }

    /**
     * Add the required samplers to the current list.
     * @param samplers defines the current sampler list.
     */
    public static AddSamplers(samplers: string[]): void {
        samplers.push("clearCoatSampler", "clearCoatRoughnessSampler", "clearCoatBumpSampler", "clearCoatTintSampler");
    }

    /**
     * Add the required uniforms to the current buffer.
     * @param uniformBuffer defines the current uniform buffer.
     */
    public static PrepareUniformBuffer(uniformBuffer: UniformBuffer): void {
        uniformBuffer.addUniform("vClearCoatParams", 2);
        uniformBuffer.addUniform("vClearCoatRefractionParams", 4);
        uniformBuffer.addUniform("vClearCoatInfos", 4);
        uniformBuffer.addUniform("clearCoatMatrix", 16);
        uniformBuffer.addUniform("clearCoatRoughnessMatrix", 16);
        uniformBuffer.addUniform("vClearCoatBumpInfos", 2);
        uniformBuffer.addUniform("vClearCoatTangentSpaceParams", 2);
        uniformBuffer.addUniform("clearCoatBumpMatrix", 16);
        uniformBuffer.addUniform("vClearCoatTintParams", 4);
        uniformBuffer.addUniform("clearCoatColorAtDistance", 1);
        uniformBuffer.addUniform("vClearCoatTintInfos", 2);
        uniformBuffer.addUniform("clearCoatTintMatrix", 16);
    }

    /**
     * Makes a duplicate of the current configuration into another one.
     * @param clearCoatConfiguration define the config where to copy the info
     */
    public copyTo(clearCoatConfiguration: PBRClearCoatConfiguration): void {
        SerializationHelper.Clone(() => clearCoatConfiguration, this);
    }

    /**
     * Serializes this clear coat configuration.
     * @returns - An object with the serialized config.
     */
    public serialize(): any {
        return SerializationHelper.Serialize(this);
    }

    /**
     * Parses a anisotropy Configuration from a serialized object.
     * @param source - Serialized object.
     * @param scene Defines the scene we are parsing for
     * @param rootUrl Defines the rootUrl to load from
     */
    public parse(source: any, scene: Scene, rootUrl: string): void {
        SerializationHelper.Parse(() => this, source, scene, rootUrl);
    }
}