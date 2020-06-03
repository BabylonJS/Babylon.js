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

/**
 * Define the code related to the detail map parameters of a material
 *
 * Inspired from:
 *   Unity: https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@9.0/manual/Mask-Map-and-Detail-Map.html and https://docs.unity3d.com/Manual/StandardShaderMaterialParameterDetail.html
 *   Unreal: https://docs.unrealengine.com/en-US/Engine/Rendering/Materials/HowTo/DetailTexturing/index.html
 *   Cryengine: https://docs.cryengine.com/display/SDKDOC2/Detail+Maps
 */
export class DetailMapConfiguration {

    private _texture: Nullable<BaseTexture> = null;
    /**
     * The detail texture of the material.
     */
    @serializeAsTexture("detailTexture")
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public texture: Nullable<BaseTexture>;

    /**
     * Defines how strongly the detail diffuse/albedo channel is blended with the regular diffuse/albedo texture
     * Bigger values mean stronger blending
     */
    @serialize()
    public diffuseBlendLevel = 0.5;

    /**
     * Defines how strongly the detail roughness channel is blended with the regular roughness value
     * Bigger values mean stronger blending. Only used with PBR materials
     */
    @serialize()
    public roughnessBlendLevel = 0.5;

    /**
     * Defines how strong the bump effect from the detail map is
     * Bigger values mean stronger effect
     */
    @serialize()
    public bumpLevel = 1;

    private _normalBlendMethod = Material.MATERIAL_NORMALBLENDMETHOD_WHITEOUT;
    /**
     * The method used to blend the bump and detail normals together
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public normalBlendMethod: number;

    private _isEnabled = false;
    /**
     * Enable or disable the detail map on this material
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isEnabled = false;

    /** @hidden */
    private _internalMarkAllSubMeshesAsTexturesDirty: () => void;

    /** @hidden */
    public _markAllSubMeshesAsTexturesDirty(): void {
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }

    /**
     * Instantiate a new detail map
     * @param markAllSubMeshesAsTexturesDirty Callback to flag the material to dirty
     */
    constructor(markAllSubMeshesAsTexturesDirty: () => void) {
        this._internalMarkAllSubMeshesAsTexturesDirty = markAllSubMeshesAsTexturesDirty;
    }

    /**
     * Gets whether the submesh is ready to be used or not.
     * @param defines the list of "defines" to update.
     * @param scene defines the scene the material belongs to.
     * @returns - boolean indicating that the submesh is ready or not.
     */
    public isReadyForSubMesh(defines: IMaterialDetailMapDefines, scene: Scene): boolean {
        const engine = scene.getEngine();

        if (defines._areTexturesDirty && scene.texturesEnabled) {
            if (engine.getCaps().standardDerivatives && this._texture && MaterialFlags.DetailTextureEnabled) {
                // Detail texture cannot be not blocking.
                if (!this._texture.isReady()) {
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
    public prepareDefines(defines: IMaterialDetailMapDefines, scene: Scene): void {
        if (this._isEnabled) {
            defines.DETAIL_NORMALBLENDMETHOD = this._normalBlendMethod;

            const engine = scene.getEngine();

            if (defines._areTexturesDirty) {
                if (engine.getCaps().standardDerivatives && this._texture && MaterialFlags.DetailTextureEnabled && this._isEnabled) {
                    MaterialHelper.PrepareDefinesForMergedUV(this._texture, defines, "DETAIL");
                    defines.DETAIL_NORMALBLENDMETHOD = this._normalBlendMethod;
                } else {
                    defines.DETAIL = false;
                }
            }
        } else {
            defines.DETAIL = false;
        }
    }

    /**
     * Binds the material data.
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param scene defines the scene the material belongs to.
     * @param isFrozen defines whether the material is frozen or not.
     */
    public bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, isFrozen: boolean): void {
        if (!this._isEnabled) {
            return;
        }

        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if (this._texture && MaterialFlags.DetailTextureEnabled) {
                uniformBuffer.updateFloat4("vDetailInfos", this._texture.coordinatesIndex, this.diffuseBlendLevel, this.bumpLevel, this.roughnessBlendLevel);
                MaterialHelper.BindTextureMatrix(this._texture, uniformBuffer, "detail");
            }
        }

        // Textures
        if (scene.texturesEnabled) {
            if (this._texture && MaterialFlags.DetailTextureEnabled) {
                uniformBuffer.setTexture("detailSampler", this._texture);
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
    }

    /**
     * Returns the animatable textures.
     * @param animatables Array of animatable textures.
     */
    public getAnimatables(animatables: IAnimatable[]): void {
        if (this._texture && this._texture.animations && this._texture.animations.length > 0) {
            animatables.push(this._texture);
        }
    }

    /**
     * Disposes the resources of the material.
     * @param forceDisposeTextures - Forces the disposal of all textures.
     */
    public dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            this._texture?.dispose();
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
    public copyTo(detailMap: DetailMapConfiguration): void {
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
