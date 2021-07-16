import { SerializationHelper, serialize, expandToProperty, serializeAsTexture } from "../../Misc/decorators";
import { UniformBuffer } from "../uniformBuffer";
import { Scene } from "../../scene";
import { MaterialFlags } from "../materialFlags";
import { BaseTexture } from "../Textures/baseTexture";
import { IAnimatable } from '../../Animations/animatable.interface';
import { Nullable } from "../../types";

/**
 * @hidden
 */
export interface IMaterialDepthPeelingDefines {
    DEPTH_PEELING: boolean;
    DEPTH_PEELING_FRONT: boolean;
    DEPTH_PEELING_FRONT_INVERSE: boolean;
    DEPTH_PEELING_BACK: boolean;
    /** @hidden */
    _areTexturesDirty: boolean;
}

/**
 * Define the code related to the depth peeling parameters of the pbr material.
 */
export class PBRDepthPeelingConfiguration {

    @serialize()
    private _isEnabled = false;
    /**
     * Defines if the material uses transparency.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isEnabled = false;

    /**
     * Defines the transparency factor.
     */
    @serialize()
    public factor = 0;

    @serializeAsTexture()
    private _backDepthTexture: Nullable<BaseTexture> = null;
    /**
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public backDepthTexture: Nullable<BaseTexture> = null;

    @serializeAsTexture()
    private _frontDepthTexture: Nullable<BaseTexture> = null;
    /**
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public frontDepthTexture: Nullable<BaseTexture> = null;

    @serialize()
    public frontDepthTextureIsInverse = false;

    /** @hidden */
    private _internalMarkAllSubMeshesAsTexturesDirty: () => void;

    /** @hidden */
    public _markAllSubMeshesAsTexturesDirty(): void {
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }

    /**
     * Instantiate a new instance of transparency configuration.
     * @param markAllSubMeshesAsTexturesDirty Callback to flag the material to dirty
     */
    constructor(markAllSubMeshesAsTexturesDirty: () => void) {
        this._internalMarkAllSubMeshesAsTexturesDirty = markAllSubMeshesAsTexturesDirty;
    }

    /**
     * Specifies that the submesh is ready to be used.
     * @param defines the list of "defines" to update.
     * @param scene defines the scene the material belongs to.
     * @returns - boolean indicating that the submesh is ready or not.
     */
    public isReadyForSubMesh(defines: IMaterialDepthPeelingDefines, scene: Scene): boolean {
        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (this._frontDepthTexture && MaterialFlags.DepthPeelingFrontTextureEnabled) {
                    if (!this._frontDepthTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
                if (this._backDepthTexture && MaterialFlags.DepthPeelingBackTextureEnabled) {
                    if (!this._backDepthTexture.isReadyOrNotBlocking()) {
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
     * @param scene defines the scene the material belongs to.
     */
    public prepareDefines(defines: IMaterialDepthPeelingDefines, scene: Scene): void {
        if (this._isEnabled) {
            defines.DEPTH_PEELING = this._isEnabled;
            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (this._frontDepthTexture && MaterialFlags.DepthPeelingFrontTextureEnabled) {
                        defines.DEPTH_PEELING_FRONT = true;
                        defines.DEPTH_PEELING_FRONT_INVERSE = this.frontDepthTextureIsInverse;
                    } else {
                        defines.DEPTH_PEELING_FRONT = false;
                    }
                    if (this._backDepthTexture && MaterialFlags.DepthPeelingBackTextureEnabled) {
                        defines.DEPTH_PEELING_BACK = true;
                    } else {
                        defines.DEPTH_PEELING_BACK = false;
                    }
                }
            }
        }
        else {
            defines.DEPTH_PEELING = false;
            defines.DEPTH_PEELING_FRONT = false;
            defines.DEPTH_PEELING_FRONT_INVERSE = false;
            defines.DEPTH_PEELING_BACK = false;
        }
    }

    /**
     * Binds the material data.
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param scene defines the scene the material belongs to.
     * @param isFrozen defines wether the material is frozen or not.
     */
    public bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, isFrozen: boolean): void {
        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            //     const camera = scene.activeCamera;
            //     if (camera) {
            //         uniformBuffer.updateFloat4("depthPeelValues", camera.minZ, camera.minZ + camera.maxZ, 0, 0);
            //     }
            // }
            const depthTextureHeight = scene.getEngine().getRenderHeight();
            const depthTextureWidth = scene.getEngine().getRenderWidth();

            const camera = scene.activeCamera;
            if (camera) {
                uniformBuffer.updateFloat4("depthPeelValues", camera.minZ, camera.minZ + camera.maxZ, depthTextureWidth, depthTextureHeight);
            } else {
                uniformBuffer.updateFloat4("depthPeelValues", 0, 1, 0, 1);
            }
        }

        // Textures
        if (scene.texturesEnabled) {
            
            if (this._backDepthTexture && MaterialFlags.DepthPeelingBackTextureEnabled) {
                uniformBuffer.setTexture("backDepthTexture", this._backDepthTexture);
            }

            if (this._frontDepthTexture && MaterialFlags.DepthPeelingFrontTextureEnabled) {
                uniformBuffer.setTexture("frontDepthTexture", this._frontDepthTexture);
            }
        }
    }

    /**
     * Checks to see if a texture is used in the material.
     * @param texture - Base texture to use.
     * @returns - Boolean specifying if a texture is used in the material.
     */
    public hasTexture(texture: BaseTexture): boolean {
        if (this._frontDepthTexture === texture || this._backDepthTexture === texture) {
            return true;
        }

        return false;
    }

    /**
     * Returns an array of the actively used textures.
     * @param activeTextures Array of BaseTextures
     */
    public getActiveTextures(activeTextures: BaseTexture[]): void {
        if (this._frontDepthTexture) {
            activeTextures.push(this._frontDepthTexture);
        }
        if (this._backDepthTexture) {
            activeTextures.push(this._backDepthTexture);
        }
    }

    /**
     * Returns the animatable textures.
     * @param animatables Array of animatable textures.
     */
    public getAnimatables(animatables: IAnimatable[]): void {
        if (this._frontDepthTexture && this._frontDepthTexture.animations && this._frontDepthTexture.animations.length > 0) {
            animatables.push(this._frontDepthTexture);
        }
        if (this._backDepthTexture && this._backDepthTexture.animations && this._backDepthTexture.animations.length > 0) {
            animatables.push(this._backDepthTexture);
        }
    }

    /**
     * Disposes the resources of the material.
     * @param forceDisposeTextures - Forces the disposal of all textures.
     */
    public dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            if (this._frontDepthTexture) {
                this._frontDepthTexture.dispose();
            }
            if (this._backDepthTexture) {
                this._backDepthTexture.dispose();
            }
        }
    }

    /**
    * Get the current class name of the texture useful for serialization or dynamic coding.
    * @returns "PBRDepthPeelingConfiguration"
    */
    public getClassName(): string {
        return "PBRDepthPeelingConfiguration";
    }

    /**
     * Add the required uniforms to the current list.
     * @param uniforms defines the current uniform list.
     */
    public static AddUniforms(uniforms: string[]): void {
        uniforms.push("depthPeelValues");
    }

    /**
     * Add the required uniforms to the current buffer.
     * @param uniformBuffer defines the current uniform buffer.
     */
    public static PrepareUniformBuffer(uniformBuffer: UniformBuffer): void {
        uniformBuffer.addUniform("depthPeelValues", 4);
    }

    /**
     * Add the required samplers to the current list.
     * @param samplers defines the current sampler list.
     */
    public static AddSamplers(samplers: string[]): void {
        samplers.push("frontDepthTexture");
        samplers.push("backDepthTexture");
    }

    /**
     * Makes a duplicate of the current configuration into another one.
     * @param depthPeelingConfiguration define the config where to copy the info
     */
    public copyTo(depthPeelingConfiguration: PBRDepthPeelingConfiguration): void {
        SerializationHelper.Clone(() => depthPeelingConfiguration, this);
    }

    /**
     * Serializes this BRDF configuration.
     * @returns - An object with the serialized config.
     */
    public serialize(): any {
        return SerializationHelper.Serialize(this);
    }

    /**
     * Parses a Depth Peeling Configuration from a serialized object.
     * @param source - Serialized object.
     */
    public parse(source: any): void {
        SerializationHelper.Parse(() => this, source, null);
    }
}