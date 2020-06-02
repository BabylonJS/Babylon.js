import { Nullable } from "../types";
import { Scene } from "../scene";
import { Material } from "./material";
import { _TypeStore } from "../Misc/typeStore";
import { serialize, expandToProperty, serializeAsTexture, SerializationHelper } from '../Misc/decorators';
import { MaterialFlags } from './materialFlags';
import { MaterialHelper } from './materialHelper';
import { BaseTexture } from './Textures/baseTexture';
import { UniformBuffer } from './uniformBuffer';
import { IAnimatable } from '../Animations/animatable.interface';

/**
 * @hidden
 */
export interface IMaterialDetailMapDefines {
    DETAIL: boolean;
    DETAILDIRECTUV : number;
    DETAIL_NORMALBLENDMETHOD: number;

    /** @hidden */
    _areTexturesDirty: boolean;
}

export class DetailMap {

    @serializeAsTexture("detailTexture")
    private _detailTexture: Nullable<BaseTexture> = null;
    /**
     * The detail texture of the material.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public detailTexture: Nullable<BaseTexture>;

    /**
     * Defines how strongly the detail diffuse/albedo channel is blended with the regular diffuse/albedo texture
     * Bigger values mean stronger blending
     */
    @serialize()
    public detailDiffuseBlendLevel = 0.5;

    /**
     * Defines how strongly the detail roughness channel is blended with the regular roughness value
     * Bigger values mean stronger blending. Only used with PBR materials
     */
    @serialize()
    public detailRoughnessBlendLevel = 0.5;

    /**
     * Defines how strong the bump effect from the detail map is
     * Bigger values mean stronger effect
     */
    @serialize()
    public detailBumpLevel = 1;

    @serialize()
    private _detailNormalBlendMethod = Material.MATERIAL_NORMALBLENDMETHOD_WHITEOUT;
    /**
     * The method used to blend the bump and detail normals together
     */
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public detailNormalBlendMethod: number;

    /**
     * Enable or disable the detail map on this material
     */
    @serialize()
    public disableDetailMap: boolean = false;

    /**
     * Gets whether the submesh is ready to be used or not.
     * @param defines the list of "defines" to update.
     * @param scene defines the scene the material belongs to.
     * @returns - boolean indicating that the submesh is ready or not.
     */
    public isReadyForSubMesh(defines: IMaterialDetailMapDefines, scene: Scene): boolean {
        const engine = scene.getEngine();

        if (defines._areTexturesDirty && scene.texturesEnabled) {
            if (engine.getCaps().standardDerivatives && this._detailTexture && MaterialFlags.DetailTextureEnabled) {
                // Detail texture cannot be not blocking.
                if (!this._detailTexture.isReady()) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Update the defines for detail map usage
     * @param defines the list of "defines" to update.
     * @param scene defines the scene the material belongs to.
     */
    public prepareDefines(defines: IMaterialDetailMapDefines, scene: Scene): boolean {
        if (!this.disableDetailMap) {
            defines.DETAIL_NORMALBLENDMETHOD = this._detailNormalBlendMethod;

            const engine = scene.getEngine();

            if (defines._areTexturesDirty) {
                if (engine.getCaps().standardDerivatives && this._detailTexture && MaterialFlags.DetailTextureEnabled && !this.disableDetailMap) {
                    MaterialHelper.PrepareDefinesForMergedUV(this._detailTexture, defines, "DETAIL");
                    defines.DETAIL_NORMALBLENDMETHOD = this._detailNormalBlendMethod;
                } else {
                    defines.DETAIL = false;
                }
            }
        } else {
            defines.DETAIL = false;
        }

        return true;
    }

    /**
     * Binds the material data.
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param scene defines the scene the material belongs to.
     * @param isFrozen defines whether the material is frozen or not.
     */
    public bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, isFrozen: boolean): void {
        if (this.disableDetailMap) {
            return;
        }

        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if (this._detailTexture && MaterialFlags.DetailTextureEnabled) {
                uniformBuffer.updateFloat4("vDetailInfos", this._detailTexture.coordinatesIndex, this.detailDiffuseBlendLevel, this.detailBumpLevel, this.detailRoughnessBlendLevel);
                MaterialHelper.BindTextureMatrix(this._detailTexture, uniformBuffer, "detail");
            }
        }

        // Textures
        if (scene.texturesEnabled) {
            if (this._detailTexture && MaterialFlags.DetailTextureEnabled) {
                uniformBuffer.setTexture("detailSampler", this._detailTexture);
            }
        }
    }

    /**
     * Checks to see if a texture is used in the material.
     * @param texture - Base texture to use.
     * @returns - Boolean specifying if a texture is used in the material.
     */
    public hasTexture(texture: BaseTexture): boolean {
        if (this._detailTexture === texture) {
            return true;
        }

        return false;
    }

    /**
     * Returns an array of the actively used textures.
     * @param activeTextures Array of BaseTextures
     */
    public getActiveTextures(activeTextures: BaseTexture[]): void {
        if (this._detailTexture) {
            activeTextures.push(this._detailTexture);
        }
    }

    /**
     * Returns the animatable textures.
     * @param animatables Array of animatable textures.
     */
    public getAnimatables(animatables: IAnimatable[]): void {
        if (this._detailTexture && this._detailTexture.animations && this._detailTexture.animations.length > 0) {
            animatables.push(this._detailTexture);
        }
    }

    /**
     * Disposes the resources of the material.
     * @param forceDisposeTextures - Forces the disposal of all textures.
     */
    public dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            this._detailTexture?.dispose();
        }
    }

    /**
    * Get the current class name useful for serialization or dynamic coding.
    * @returns "DetailMap"
    */
    public getClassName(): string {
        return "DetailMap";
    }

    /**
     * Add the required uniforms to the current list.
     * @param uniforms defines the current uniform list.
     */
    public static AddUniforms(uniforms: string[]): void {
        uniforms.push("vDetailInfos");
    }

    /**
     * Add the required samplers to the current list.
     * @param samplers defines the current sampler list.
     */
    public static AddSamplers(samplers: string[]): void {
        samplers.push("detailSampler");
    }

    /**
     * Add the required uniforms to the current buffer.
     * @param uniformBuffer defines the current uniform buffer.
     */
    public static PrepareUniformBuffer(uniformBuffer: UniformBuffer): void {
        uniformBuffer.addUniform("vDetailInfos", 4);
        uniformBuffer.addUniform("detailMatrix", 16);
    }

    /**
     * Makes a duplicate of the current instance into another one.
     * @param detailMap define the instance where to copy the info
     */
    public copyTo(detailMap: DetailMap): void {
        SerializationHelper.Clone(() => detailMap, this);
    }

    /**
     * Serializes this detail map instance
     * @returns - An object with the serialized instance.
     */
    public serialize(): any {
        return SerializationHelper.Serialize(this);
    }

    /**
     * Parses a detail map setting from a serialized object.
     * @param source - Serialized object.
     * @param scene Defines the scene we are parsing for
     * @param rootUrl Defines the rootUrl to load from
     */
    public parse(source: any, scene: Scene, rootUrl: string): void {
        SerializationHelper.Parse(() => this, source, scene, rootUrl);
    }
}
