/* eslint-disable @typescript-eslint/naming-convention */
import { serialize, expandToProperty, serializeAsVector2, serializeAsTexture } from "../../Misc/decorators";
import type { UniformBuffer } from "../../Materials/uniformBuffer";
import { VertexBuffer } from "../../Buffers/buffer";
import { Vector2 } from "../../Maths/math.vector";
import { MaterialFlags } from "../../Materials/materialFlags";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import type { Nullable } from "../../types";
import type { IAnimatable } from "../../Animations/animatable.interface";
import type { EffectFallbacks } from "../effectFallbacks";
import { MaterialPluginBase } from "../materialPluginBase";
import { Constants } from "../../Engines/constants";
import { MaterialDefines } from "../materialDefines";

import type { Scene } from "../../scene";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { PBRBaseMaterial } from "./pbrBaseMaterial";
import { BindTextureMatrix, PrepareDefinesForMergedUV } from "../materialHelper.functions";

/**
 * @internal
 */
export class MaterialAnisotropicDefines extends MaterialDefines {
    public ANISOTROPIC = false;
    public ANISOTROPIC_TEXTURE = false;
    public ANISOTROPIC_TEXTUREDIRECTUV = 0;
    public ANISOTROPIC_LEGACY = false;
    public MAINUV1 = false;
}

/**
 * Plugin that implements the anisotropic component of the PBR material
 */
export class PBRAnisotropicConfiguration extends MaterialPluginBase {
    private _isEnabled = false;
    /**
     * Defines if the anisotropy is enabled in the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isEnabled = false;

    /**
     * Defines the anisotropy strength (between 0 and 1) it defaults to 1.
     */
    @serialize()
    public intensity: number = 1;

    /**
     * Defines if the effect is along the tangents, bitangents or in between.
     * By default, the effect is "stretching" the highlights along the tangents.
     */
    @serializeAsVector2()
    public direction = new Vector2(1, 0);

    /**
     * Sets the anisotropy direction as an angle.
     */
    public set angle(value: number) {
        this.direction.x = Math.cos(value);
        this.direction.y = Math.sin(value);
    }

    /**
     * Gets the anisotropy angle value in radians.
     * @returns the anisotropy angle value in radians.
     */
    public get angle(): number {
        return Math.atan2(this.direction.y, this.direction.x);
    }

    private _texture: Nullable<BaseTexture> = null;
    /**
     * Stores the anisotropy values in a texture.
     * rg is direction (like normal from -1 to 1)
     * b is a intensity
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public texture: Nullable<BaseTexture> = null;

    private _legacy = false;
    /**
     * Defines if the anisotropy is in legacy mode for backwards compatibility before 6.4.0.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public legacy: boolean = false;

    /** @internal */
    private _internalMarkAllSubMeshesAsTexturesDirty: () => void;

    /** @internal */
    public _markAllSubMeshesAsTexturesDirty(): void {
        this._enable(this._isEnabled);
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }

    /** @internal */
    private _internalMarkAllSubMeshesAsMiscDirty: () => void;

    /** @internal */
    public _markAllSubMeshesAsMiscDirty(): void {
        this._enable(this._isEnabled);
        this._internalMarkAllSubMeshesAsMiscDirty();
    }

    /**
     * Gets a boolean indicating that the plugin is compatible with a given shader language.
     * @returns true if the plugin is compatible with the shader language
     */
    public override isCompatible(): boolean {
        return true;
    }

    constructor(material: PBRBaseMaterial, addToPluginList = true) {
        super(material, "PBRAnisotropic", 110, new MaterialAnisotropicDefines(), addToPluginList);

        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[Constants.MATERIAL_TextureDirtyFlag];
        this._internalMarkAllSubMeshesAsMiscDirty = material._dirtyCallbacks[Constants.MATERIAL_MiscDirtyFlag];
    }

    public override isReadyForSubMesh(defines: MaterialAnisotropicDefines, scene: Scene): boolean {
        if (!this._isEnabled) {
            return true;
        }

        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (this._texture && MaterialFlags.AnisotropicTextureEnabled) {
                    if (!this._texture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    public override prepareDefinesBeforeAttributes(defines: MaterialAnisotropicDefines, scene: Scene, mesh: AbstractMesh): void {
        if (this._isEnabled) {
            defines.ANISOTROPIC = this._isEnabled;
            if (this._isEnabled && !mesh.isVerticesDataPresent(VertexBuffer.TangentKind)) {
                defines._needUVs = true;
                defines.MAINUV1 = true;
            }

            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (this._texture && MaterialFlags.AnisotropicTextureEnabled) {
                        PrepareDefinesForMergedUV(this._texture, defines, "ANISOTROPIC_TEXTURE");
                    } else {
                        defines.ANISOTROPIC_TEXTURE = false;
                    }
                }
            }

            if (defines._areMiscDirty) {
                defines.ANISOTROPIC_LEGACY = this._legacy;
            }
        } else {
            defines.ANISOTROPIC = false;
            defines.ANISOTROPIC_TEXTURE = false;
            defines.ANISOTROPIC_TEXTUREDIRECTUV = 0;
            defines.ANISOTROPIC_LEGACY = false;
        }
    }

    public override bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene): void {
        if (!this._isEnabled) {
            return;
        }

        const isFrozen = this._material.isFrozen;

        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if (this._texture && MaterialFlags.AnisotropicTextureEnabled) {
                uniformBuffer.updateFloat2("vAnisotropyInfos", this._texture.coordinatesIndex, this._texture.level);
                BindTextureMatrix(this._texture, uniformBuffer, "anisotropy");
            }

            // Anisotropy
            uniformBuffer.updateFloat3("vAnisotropy", this.direction.x, this.direction.y, this.intensity);
        }

        // Textures
        if (scene.texturesEnabled) {
            if (this._texture && MaterialFlags.AnisotropicTextureEnabled) {
                uniformBuffer.setTexture("anisotropySampler", this._texture);
            }
        }
    }

    public override hasTexture(texture: BaseTexture): boolean {
        if (this._texture === texture) {
            return true;
        }

        return false;
    }

    public override getActiveTextures(activeTextures: BaseTexture[]): void {
        if (this._texture) {
            activeTextures.push(this._texture);
        }
    }

    public override getAnimatables(animatables: IAnimatable[]): void {
        if (this._texture && this._texture.animations && this._texture.animations.length > 0) {
            animatables.push(this._texture);
        }
    }

    public override dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            if (this._texture) {
                this._texture.dispose();
            }
        }
    }

    public override getClassName(): string {
        return "PBRAnisotropicConfiguration";
    }

    public override addFallbacks(defines: MaterialAnisotropicDefines, fallbacks: EffectFallbacks, currentRank: number): number {
        if (defines.ANISOTROPIC) {
            fallbacks.addFallback(currentRank++, "ANISOTROPIC");
        }
        return currentRank;
    }

    public override getSamplers(samplers: string[]): void {
        samplers.push("anisotropySampler");
    }

    public override getUniforms(): { ubo?: Array<{ name: string; size: number; type: string }>; vertex?: string; fragment?: string } {
        return {
            ubo: [
                { name: "vAnisotropy", size: 3, type: "vec3" },
                { name: "vAnisotropyInfos", size: 2, type: "vec2" },
                { name: "anisotropyMatrix", size: 16, type: "mat4" },
            ],
        };
    }

    /**
     * Parses a anisotropy Configuration from a serialized object.
     * @param source - Serialized object.
     * @param scene Defines the scene we are parsing for
     * @param rootUrl Defines the rootUrl to load from
     */
    public override parse(source: any, scene: Scene, rootUrl: string): void {
        super.parse(source, scene, rootUrl);

        // Backward compatibility
        if (source.legacy === undefined) {
            this.legacy = true;
        }
    }
}
