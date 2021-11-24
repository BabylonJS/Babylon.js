import { Nullable } from "../types";
import { Material } from './material';
import { serialize, expandToProperty, serializeAsTexture } from '../Misc/decorators';
import { MaterialFlags } from './materialFlags';
import { MaterialHelper } from './materialHelper';
import { BaseTexture } from './Textures/baseTexture';
import { UniformBuffer } from './uniformBuffer';
import { IAnimatable } from '../Animations/animatable.interface';
import { MaterialDefines } from "./materialDefines";
import { MaterialPluginBase } from "./materialPluginBase";
import { Constants } from "../Engines/constants";
import { PBRBaseMaterial } from "./PBR/pbrBaseMaterial";
import { StandardMaterial } from "./standardMaterial";

declare type Engine = import("../Engines/engine").Engine;
declare type Scene = import("../scene").Scene;
declare type AbstractMesh = import("../Meshes/abstractMesh").AbstractMesh;

/**
 * Creates an instance of the detail map plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
 export function createDetailMapPlugin(material: Material): Nullable<MaterialPluginBase> {
    if ((material instanceof PBRBaseMaterial) || (material instanceof StandardMaterial)) {
        return new DetailMapConfiguration(material);
    }
    return null;
}

/**
 * @hidden
 */
 class MaterialDetailMapDefines extends MaterialDefines {
    DETAIL = false;
    DETAILDIRECTUV = 0;
    DETAIL_NORMALBLENDMETHOD = 0;
}

/**
 * Define the code related to the detail map parameters of a material
 *
 * Inspired from:
 *   Unity: https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@9.0/manual/Mask-Map-and-Detail-Map.html and https://docs.unity3d.com/Manual/StandardShaderMaterialParameterDetail.html
 *   Unreal: https://docs.unrealengine.com/en-US/Engine/Rendering/Materials/HowTo/DetailTexturing/index.html
 *   Cryengine: https://docs.cryengine.com/display/SDKDOC2/Detail+Maps
 */
export class DetailMapConfiguration extends MaterialPluginBase {
    private _material: PBRBaseMaterial | StandardMaterial;

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

    /** @hidden */
    private _internalMarkAllSubMeshesAsTexturesDirty: () => void;

    /** @hidden */
    public _markAllSubMeshesAsTexturesDirty(): void {
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }

    /**
     * Instantiate a new detail map
     * @param material The material implementing this plugin.
     */
    constructor(material: PBRBaseMaterial | StandardMaterial) {
        super(material, new MaterialDetailMapDefines());

        this.name = "DetailMap";
        this.priority = 140;
        this._material = material;

        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[Constants.MATERIAL_TextureDirtyFlag];
    }

    public isReadyForSubMesh(defines: MaterialDetailMapDefines, scene: Scene, engine: Engine): boolean {
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

    public prepareDefines(defines: MaterialDetailMapDefines, scene: Scene, mesh: AbstractMesh): void {
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

    public bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene): void {
        if (!this._isEnabled) {
            return;
        }

        const isFrozen = this._material.isFrozen;

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

    public hasTexture(texture: BaseTexture): boolean {
        if (this._texture === texture) {
            return true;
        }

        return false;
    }

    public getActiveTextures(activeTextures: BaseTexture[]): void {
        if (this._texture) {
            activeTextures.push(this._texture);
        }
    }

    public getAnimatables(animatables: IAnimatable[]): void {
        if (this._texture && this._texture.animations && this._texture.animations.length > 0) {
            animatables.push(this._texture);
        }
    }

    public dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            this._texture?.dispose();
        }
    }

    public getClassName(): string {
        return "DetailMapConfiguration";
    }

    public addUniformsAndSamplers(uniforms: string[], samplers: string[]): void {
        uniforms.push("vDetailInfos");
        uniforms.push("detailMatrix");
        samplers.push("detailSampler");
    }

    public prepareUniformBuffer(uniformBuffer: UniformBuffer): void {
        uniformBuffer.addUniform("vDetailInfos", 4);
        uniformBuffer.addUniform("detailMatrix", 16);
    }
}
