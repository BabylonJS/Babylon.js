/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "../../types";
import { serialize, serializeAsTexture, expandToProperty } from "../../Misc/decorators";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import { MaterialFlags } from "../materialFlags";
import type { UniformBuffer } from "../../Materials/uniformBuffer";
import type { IAnimatable } from "../../Animations/animatable.interface";
import type { EffectFallbacks } from "../effectFallbacks";
import { Constants } from "../../Engines/constants";
import { MaterialPluginBase } from "../materialPluginBase";
import { MaterialDefines } from "../materialDefines";

import type { Scene } from "../../scene";
import type { PBRBaseMaterial } from "./pbrBaseMaterial";
import { BindTextureMatrix, PrepareDefinesForMergedUV } from "../materialHelper.functions";

/**
 * @internal
 */
export class MaterialIridescenceDefines extends MaterialDefines {
    public IRIDESCENCE = false;
    public IRIDESCENCE_TEXTURE = false;
    public IRIDESCENCE_TEXTUREDIRECTUV = 0;
    public IRIDESCENCE_THICKNESS_TEXTURE = false;
    public IRIDESCENCE_THICKNESS_TEXTUREDIRECTUV = 0;
}

/**
 * Plugin that implements the iridescence (thin film) component of the PBR material
 */
export class PBRIridescenceConfiguration extends MaterialPluginBase {
    protected override _material: PBRBaseMaterial;

    /**
     * The default minimum thickness of the thin-film layer given in nanometers (nm).
     * Defaults to 100 nm.
     * @internal
     */
    public static readonly _DefaultMinimumThickness = 100;

    /**
     * The default maximum thickness of the thin-film layer given in nanometers (nm).
     * Defaults to 400 nm.
     * @internal
     */
    public static readonly _DefaultMaximumThickness = 400;

    /**
     * The default index of refraction of the thin-film layer.
     * Defaults to 1.3
     * @internal
     */
    public static readonly _DefaultIndexOfRefraction = 1.3;

    private _isEnabled = false;
    /**
     * Defines if the iridescence is enabled in the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isEnabled = false;

    /**
     * Defines the iridescence layer strength (between 0 and 1) it defaults to 1.
     */
    @serialize()
    public intensity: number = 1;

    /**
     * Defines the minimum thickness of the thin-film layer given in nanometers (nm).
     */
    @serialize()
    public minimumThickness: number = PBRIridescenceConfiguration._DefaultMinimumThickness;

    /**
     * Defines the maximum thickness of the thin-film layer given in nanometers (nm). This will be the thickness used if not thickness texture has been set.
     */
    @serialize()
    public maximumThickness: number = PBRIridescenceConfiguration._DefaultMaximumThickness;

    /**
     * Defines the maximum thickness of the thin-film layer given in nanometers (nm).
     */
    @serialize()
    public indexOfRefraction: number = PBRIridescenceConfiguration._DefaultIndexOfRefraction;

    private _texture: Nullable<BaseTexture> = null;
    /**
     * Stores the iridescence intensity in a texture (red channel)
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public texture: Nullable<BaseTexture> = null;

    private _thicknessTexture: Nullable<BaseTexture> = null;
    /**
     * Stores the iridescence thickness in a texture (green channel)
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public thicknessTexture: Nullable<BaseTexture> = null;

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
        super(material, "PBRIridescence", 110, new MaterialIridescenceDefines(), addToPluginList);

        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[Constants.MATERIAL_TextureDirtyFlag];
    }

    public override isReadyForSubMesh(defines: MaterialIridescenceDefines, scene: Scene): boolean {
        if (!this._isEnabled) {
            return true;
        }

        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (this._texture && MaterialFlags.IridescenceTextureEnabled) {
                    if (!this._texture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }

                if (this._thicknessTexture && MaterialFlags.IridescenceTextureEnabled) {
                    if (!this._thicknessTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    public override prepareDefinesBeforeAttributes(defines: MaterialIridescenceDefines, scene: Scene): void {
        if (this._isEnabled) {
            defines.IRIDESCENCE = true;

            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (this._texture && MaterialFlags.IridescenceTextureEnabled) {
                        PrepareDefinesForMergedUV(this._texture, defines, "IRIDESCENCE_TEXTURE");
                    } else {
                        defines.IRIDESCENCE_TEXTURE = false;
                    }

                    if (this._thicknessTexture && MaterialFlags.IridescenceTextureEnabled) {
                        PrepareDefinesForMergedUV(this._thicknessTexture, defines, "IRIDESCENCE_THICKNESS_TEXTURE");
                    } else {
                        defines.IRIDESCENCE_THICKNESS_TEXTURE = false;
                    }
                }
            }
        } else {
            defines.IRIDESCENCE = false;
            defines.IRIDESCENCE_TEXTURE = false;
            defines.IRIDESCENCE_THICKNESS_TEXTURE = false;
            defines.IRIDESCENCE_TEXTUREDIRECTUV = 0;
            defines.IRIDESCENCE_THICKNESS_TEXTUREDIRECTUV = 0;
        }
    }

    public override bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene): void {
        if (!this._isEnabled) {
            return;
        }

        const isFrozen = this._material.isFrozen;

        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if ((this._texture || this._thicknessTexture) && MaterialFlags.IridescenceTextureEnabled) {
                uniformBuffer.updateFloat4(
                    "vIridescenceInfos",
                    this._texture?.coordinatesIndex ?? 0,
                    this._texture?.level ?? 0,
                    this._thicknessTexture?.coordinatesIndex ?? 0,
                    this._thicknessTexture?.level ?? 0
                );
                if (this._texture) {
                    BindTextureMatrix(this._texture, uniformBuffer, "iridescence");
                }
                if (this._thicknessTexture) {
                    BindTextureMatrix(this._thicknessTexture, uniformBuffer, "iridescenceThickness");
                }
            }

            // Clear Coat General params
            uniformBuffer.updateFloat4("vIridescenceParams", this.intensity, this.indexOfRefraction, this.minimumThickness, this.maximumThickness);
        }

        // Textures
        if (scene.texturesEnabled) {
            if (this._texture && MaterialFlags.IridescenceTextureEnabled) {
                uniformBuffer.setTexture("iridescenceSampler", this._texture);
            }

            if (this._thicknessTexture && MaterialFlags.IridescenceTextureEnabled) {
                uniformBuffer.setTexture("iridescenceThicknessSampler", this._thicknessTexture);
            }
        }
    }

    public override hasTexture(texture: BaseTexture): boolean {
        if (this._texture === texture) {
            return true;
        }

        if (this._thicknessTexture === texture) {
            return true;
        }

        return false;
    }

    public override getActiveTextures(activeTextures: BaseTexture[]): void {
        if (this._texture) {
            activeTextures.push(this._texture);
        }

        if (this._thicknessTexture) {
            activeTextures.push(this._thicknessTexture);
        }
    }

    public override getAnimatables(animatables: IAnimatable[]): void {
        if (this._texture && this._texture.animations && this._texture.animations.length > 0) {
            animatables.push(this._texture);
        }

        if (this._thicknessTexture && this._thicknessTexture.animations && this._thicknessTexture.animations.length > 0) {
            animatables.push(this._thicknessTexture);
        }
    }

    public override dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            this._texture?.dispose();
            this._thicknessTexture?.dispose();
        }
    }

    public override getClassName(): string {
        return "PBRIridescenceConfiguration";
    }

    public override addFallbacks(defines: MaterialIridescenceDefines, fallbacks: EffectFallbacks, currentRank: number): number {
        if (defines.IRIDESCENCE) {
            fallbacks.addFallback(currentRank++, "IRIDESCENCE");
        }
        return currentRank;
    }

    public override getSamplers(samplers: string[]): void {
        samplers.push("iridescenceSampler", "iridescenceThicknessSampler");
    }

    public override getUniforms(): { ubo?: Array<{ name: string; size: number; type: string }>; vertex?: string; fragment?: string } {
        return {
            ubo: [
                { name: "vIridescenceParams", size: 4, type: "vec4" },
                { name: "vIridescenceInfos", size: 4, type: "vec4" },
                { name: "iridescenceMatrix", size: 16, type: "mat4" },
                { name: "iridescenceThicknessMatrix", size: 16, type: "mat4" },
            ],
        };
    }
}
