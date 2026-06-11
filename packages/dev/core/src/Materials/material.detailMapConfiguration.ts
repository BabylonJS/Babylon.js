/* eslint-disable @typescript-eslint/naming-convention */
import { type Nullable } from "../types";
import { Material } from "./material";
import { serialize, expandToProperty, serializeAsTexture } from "../Misc/decorators";
import { MaterialFlags } from "./materialFlags";
import { type BaseTexture } from "./Textures/baseTexture";
import { type UniformBuffer } from "./uniformBuffer";
import { type IAnimatable } from "../Animations/animatable.interface";
import { MaterialDefines } from "./materialDefines";
import { MaterialPluginBase } from "./materialPluginBase.pure";
import { Constants } from "../Engines/constants";

import { type Scene } from "../scene";
import { type StandardMaterial } from "./standardMaterial";
import { type PBRBaseMaterial } from "./PBR/pbrBaseMaterial";
import { BindTextureMatrix, PrepareDefinesForMergedUV } from "./materialHelper.functions";
import { type AbstractEngine } from "core/Engines/abstractEngine";

/**
 * @internal
 */
export class MaterialDetailMapDefines extends MaterialDefines {
    DETAIL = false;
    DETAILDIRECTUV = 0;
    DETAIL_NORMALBLENDMETHOD = 0;
}

/**
 * Plugin that implements the detail map component of a material
 *
 * Inspired from:
 *   Unity: https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@9.0/manual/Mask-Map-and-Detail-Map.html and https://docs.unity3d.com/Manual/StandardShaderMaterialParameterDetail.html
 *   Unreal: https://docs.unrealengine.com/en-US/Engine/Rendering/Materials/HowTo/DetailTexturing/index.html
 *   Cryengine: https://docs.cryengine.com/display/SDKDOC2/Detail+Maps
 */
export class DetailMapConfiguration extends MaterialPluginBase {
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
    public diffuseBlendLevel = 1;

    /**
     * Defines how strongly the detail roughness channel is blended with the regular roughness value
     * Bigger values mean stronger blending. Only used with PBR materials
     */
    @serialize()
    public roughnessBlendLevel = 1;

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

    constructor(material: PBRBaseMaterial | StandardMaterial, addToPluginList = true) {
        super(material, "DetailMap", 140, new MaterialDetailMapDefines(), addToPluginList);

        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[Constants.MATERIAL_TextureDirtyFlag];
    }

    /**
     * Checks whether the detail map textures are ready for the sub mesh.
     * @param defines defines the material defines to inspect
     * @param scene defines the scene to use for readiness checks
     * @param engine defines the engine to use for readiness checks
     * @returns true if the detail map is ready
     */
    public override isReadyForSubMesh(defines: MaterialDetailMapDefines, scene: Scene, engine: AbstractEngine): boolean {
        if (!this._isEnabled) {
            return true;
        }

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
     * Updates the material defines for the detail map.
     * @param defines defines the material defines to update
     * @param scene defines the scene to use for texture checks
     */
    public override prepareDefines(defines: MaterialDetailMapDefines, scene: Scene): void {
        if (this._isEnabled) {
            defines.DETAIL_NORMALBLENDMETHOD = this._normalBlendMethod;

            const engine = scene.getEngine();

            if (defines._areTexturesDirty) {
                if (engine.getCaps().standardDerivatives && this._texture && MaterialFlags.DetailTextureEnabled && this._isEnabled) {
                    PrepareDefinesForMergedUV(this._texture, defines, "DETAIL");
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
     * Binds the detail map data for a sub mesh.
     * @param uniformBuffer defines the uniform buffer to update
     * @param scene defines the scene to use for texture binding
     */
    public override bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene): void {
        if (!this._isEnabled) {
            return;
        }

        const isFrozen = this._material.isFrozen;

        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if (this._texture && MaterialFlags.DetailTextureEnabled) {
                uniformBuffer.updateFloat4("vDetailInfos", this._texture.coordinatesIndex, this.diffuseBlendLevel, this.bumpLevel, this.roughnessBlendLevel);
                BindTextureMatrix(this._texture, uniformBuffer, "detail");
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
     * Checks whether the detail map uses a texture.
     * @param texture defines the texture to check
     * @returns true if the texture is used by the detail map
     */
    public override hasTexture(texture: BaseTexture): boolean {
        if (this._texture === texture) {
            return true;
        }

        return false;
    }

    /**
     * Adds the active detail map textures.
     * @param activeTextures defines the list of active textures to update
     */
    public override getActiveTextures(activeTextures: BaseTexture[]): void {
        if (this._texture) {
            activeTextures.push(this._texture);
        }
    }

    /**
     * Adds the animatable detail map textures.
     * @param animatables defines the list of animatables to update
     */
    public override getAnimatables(animatables: IAnimatable[]): void {
        if (this._texture && this._texture.animations && this._texture.animations.length > 0) {
            animatables.push(this._texture);
        }
    }

    /**
     * Disposes the detail map textures.
     * @param forceDisposeTextures defines whether to dispose the textures
     */
    public override dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            this._texture?.dispose();
        }
    }

    public override getClassName(): string {
        return "DetailMapConfiguration";
    }

    /**
     * Adds the detail map sampler names.
     * @param samplers defines the list of sampler names to update
     */
    public override getSamplers(samplers: string[]): void {
        samplers.push("detailSampler");
    }

    public override getUniforms(): { ubo?: Array<{ name: string; size: number; type: string }>; vertex?: string; fragment?: string } {
        return {
            ubo: [
                { name: "vDetailInfos", size: 4, type: "vec4" },
                { name: "detailMatrix", size: 16, type: "mat4" },
            ],
        };
    }
}
