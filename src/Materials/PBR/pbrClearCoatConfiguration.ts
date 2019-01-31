import { Nullable } from "../../types";
import { IAnimatable } from "../../Misc/tools";
import { SerializationHelper, serialize, serializeAsTexture, expandToProperty } from "../../Misc/decorators";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { EffectFallbacks } from "../../Materials/effect";
import { MaterialFlags } from "../materialFlags";
import { UniformBuffer } from "../../Materials/uniformBuffer";
import { MaterialHelper } from "../../Materials/materialHelper";

declare type Engine = import("../../Engines/engine").Engine;
declare type Scene = import("../../scene").Scene;

/**
 * @hidden
 */
export interface IMaterialClearCoatDefines {
    CLEARCOAT: boolean;
    CLEARCOAT_TEXTURE: boolean;
    CLEARCOAT_TEXTUREDIRECTUV: number;
    CLEARCOAT_BUMP: boolean;
    CLEARCOAT_BUMPDIRECTUV: number;

    /** @hidden */
    _areTexturesDirty: boolean;
}

/**
 * Define the code related to the clear coat parameters of the pbr material.
 */
export class PBRClearCoatConfiguration {

    /**
     * Defines if the clear coat is enabled in the material.
     */
    @serialize()
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

    @serializeAsTexture()
    private _texture: Nullable<BaseTexture> = null;
    /**
     * Stores the clear coat values in a texture.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public texture: Nullable<BaseTexture> = null;

    @serializeAsTexture()
    private _bumpTexture: Nullable<BaseTexture> = null;
    /**
     * Define the clear coat specific bump texture.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public bumpTexture: Nullable<BaseTexture> = null;

    /** @hidden */
    private _internalMarkAllSubMeshesAsTexturesDirty: () => void;

    /** @hidden */
    public _markAllSubMeshesAsTexturesDirty(): void {
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }

    /**
     * Instantiate a new istance of clear coat configuration.
     * @param markAllSubMeshesAsTexturesDirty Callback to flag the material to dirty
     */
    constructor(markAllSubMeshesAsTexturesDirty: () => void) {
        this._internalMarkAllSubMeshesAsTexturesDirty = markAllSubMeshesAsTexturesDirty;
    }

    /**
     * Specifies that the submesh is ready to be used.
     * @param defines defines the Base texture to use.
     * @param scene defines the scene the material belongs to.
     * @param engine defines the engine the material belongs to.
     * @param disableBumpMap defines wether the material disables bump or not.
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

                if (engine.getCaps().standardDerivatives && this._bumpTexture && MaterialFlags.ClearCoatBumpTextureEnabled && !disableBumpMap) {
                    // Bump texture cannot be not blocking.
                    if (!this._bumpTexture.isReady()) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Checks to see if a texture is used in the material.
     * @param defines defines the Base texture to use.
     * @param scene defines the scene to the material belongs to.
     */
    public prepareDefines(defines: IMaterialClearCoatDefines, scene: Scene): void {
        if (this.isEnabled) {
            defines.CLEARCOAT = true;

            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (this._texture && MaterialFlags.ClearCoatTextureEnabled) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._texture, defines, "CLEARCOAT_TEXTURE");
                    } else {
                        defines.CLEARCOAT_TEXTURE = false;
                    }

                    if (this._bumpTexture && MaterialFlags.ClearCoatBumpTextureEnabled) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._bumpTexture, defines, "CLEARCOAT_BUMP");
                    } else {
                        defines.CLEARCOAT_BUMP = false;
                    }
                }
            }
        }
        else {
            defines.CLEARCOAT = false;
            defines.CLEARCOAT_TEXTURE = false;
            defines.CLEARCOAT_BUMP = false;
        }
    }

    /**
     * Binds the material data.
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param scene defines the scene the material belongs to.
     * @param engine defines the engine the material belongs to.
     * @param disableBumpMap defines wether the material disables bump or not.
     * @param isFrozen defines wether the material is frozen or not.
     * @param invertNormalMapX If sets to true, x component of normal map value will be inverted (x = 1.0 - x).
     * @param invertNormalMapY If sets to true, y component of normal map value will be inverted (y = 1.0 - y).
     */
    public bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, disableBumpMap: boolean, isFrozen: boolean, invertNormalMapX: boolean, invertNormalMapY: boolean): void {
        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if (this._texture && MaterialFlags.ClearCoatTextureEnabled) {
                uniformBuffer.updateFloat2("vClearCoatInfos", this._texture.coordinatesIndex, this._texture.level);
                MaterialHelper.BindTextureMatrix(this._texture, uniformBuffer, "clearCoat");
            }

            if (this._bumpTexture && engine.getCaps().standardDerivatives && MaterialFlags.ClearCoatTextureEnabled && !disableBumpMap) {
                uniformBuffer.updateFloat2("vClearCoatBumpInfos", this._bumpTexture.coordinatesIndex, 1.0 / this._bumpTexture.level);
                MaterialHelper.BindTextureMatrix(this._bumpTexture, uniformBuffer, "clearCoatBump");

                if (scene._mirroredCameraPosition) {
                    uniformBuffer.updateFloat2("vClearCoatTangentSpaceParams", invertNormalMapX ? 1.0 : -1.0, invertNormalMapY ? 1.0 : -1.0);
                } else {
                    uniformBuffer.updateFloat2("vClearCoatTangentSpaceParams", invertNormalMapX ? -1.0 : 1.0, invertNormalMapY ? -1.0 : 1.0);
                }
            }

            // Clear Coat
            uniformBuffer.updateFloat2("vClearCoatParams", this.intensity, this.roughness);
        }

        // Textures
        if (scene.texturesEnabled) {
            if (this._texture && MaterialFlags.ClearCoatTextureEnabled) {
                uniformBuffer.setTexture("clearCoatSampler", this._texture);
            }

            if (this._bumpTexture && engine.getCaps().standardDerivatives && MaterialFlags.ClearCoatBumpTextureEnabled && !disableBumpMap) {
                uniformBuffer.setTexture("clearCoatBumpSampler", this._bumpTexture);
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

        if (this._bumpTexture === texture) {
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

        if (this._bumpTexture) {
            activeTextures.push(this._bumpTexture);
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

        if (this._bumpTexture && this._bumpTexture.animations && this._bumpTexture.animations.length > 0) {
            animatables.push(this._bumpTexture);
        }
    }

    /**
     * Disposes the resources of the material.
     * @param forceDisposeTextures - Forces the disposal of all textures.
     */
    public dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            if (this._texture) {
                this._texture.dispose();
            }

            if (this._bumpTexture) {
                this._bumpTexture.dispose();
            }
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
     * Makes a duplicate of the current configuration into another one.
     * @param clearCoatconfiguration define the config where to copy the info
     */
    public copyTo(clearCoatconfiguration: PBRClearCoatConfiguration): void {
        SerializationHelper.Clone(() => clearCoatconfiguration, this);
    }

    /**
     * Serializes this clear coat configuration.
     * @returns - An object with the serialized config.
     */
    public serialize(): any {
        return SerializationHelper.Serialize(this);
    }

    /**
     * Parses a Clear Coat Configuration from a serialized object.
     * @param source - Serialized object.
     */
    public parse(source: any): void {
        SerializationHelper.Parse(() => this, source, null);
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
        uniforms.push("vClearCoatTangentSpaceParams", "vClearCoatParams",
            "clearCoatMatrix", "clearCoatBumpMatrix",
            "vClearCoatInfos", "vClearCoatBumpInfos");
    }

    /**
     * Add the required samplers to the current list.
     * @param samplers defines the current sampler list.
     */
    public static AddSamplers(samplers: string[]): void {
        samplers.push("clearCoatSampler", "clearCoatBumpSampler");
    }

    /**
     * Add the required uniforms to the current buffer.
     * @param uniformBuffer defines the current uniform buffer.
     */
    public static PrepareUniformBuffer(uniformBuffer: UniformBuffer): void {
        uniformBuffer.addUniform("vClearCoatParams", 2);
        uniformBuffer.addUniform("vClearCoatInfos", 2);
        uniformBuffer.addUniform("clearCoatMatrix", 16);
        uniformBuffer.addUniform("vClearCoatBumpInfos", 2);
        uniformBuffer.addUniform("vClearCoatTangentSpaceParams", 2);
        uniformBuffer.addUniform("clearCoatBumpMatrix", 16);
    }
}