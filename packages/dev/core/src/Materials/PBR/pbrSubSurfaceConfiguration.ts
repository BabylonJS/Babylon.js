/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "../../types";
import type { IAnimatable } from "../../Animations/animatable.interface";
import { serialize, serializeAsTexture, expandToProperty, serializeAsColor3 } from "../../Misc/decorators";
import { Color3 } from "../../Maths/math.color";
import type { SmartArray } from "../../Misc/smartArray";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import type { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { MaterialFlags } from "../materialFlags";
import type { UniformBuffer } from "../../Materials/uniformBuffer";
import { MaterialHelper } from "../../Materials/materialHelper";
import type { EffectFallbacks } from "../effectFallbacks";
import { Scalar } from "../../Maths/math.scalar";
import type { CubeTexture } from "../Textures/cubeTexture";
import { TmpVectors } from "../../Maths/math.vector";
import type { SubMesh } from "../../Meshes/subMesh";
import { MaterialPluginBase } from "../materialPluginBase";
import { Constants } from "../../Engines/constants";
import { MaterialDefines } from "../materialDefines";

import type { Engine } from "../../Engines/engine";
import type { Scene } from "../../scene";
import type { PBRBaseMaterial } from "./pbrBaseMaterial";

/**
 * @internal
 */
export class MaterialSubSurfaceDefines extends MaterialDefines {
    public SUBSURFACE = false;

    public SS_REFRACTION = false;
    public SS_REFRACTION_USE_INTENSITY_FROM_TEXTURE = false;
    public SS_TRANSLUCENCY = false;
    public SS_TRANSLUCENCY_USE_INTENSITY_FROM_TEXTURE = false;
    public SS_SCATTERING = false;
    public SS_DISPERSION = false;

    public SS_THICKNESSANDMASK_TEXTURE = false;
    public SS_THICKNESSANDMASK_TEXTUREDIRECTUV = 0;
    public SS_HAS_THICKNESS = false;
    public SS_REFRACTIONINTENSITY_TEXTURE = false;
    public SS_REFRACTIONINTENSITY_TEXTUREDIRECTUV = 0;
    public SS_TRANSLUCENCYINTENSITY_TEXTURE = false;
    public SS_TRANSLUCENCYINTENSITY_TEXTUREDIRECTUV = 0;

    public SS_REFRACTIONMAP_3D = false;
    public SS_REFRACTIONMAP_OPPOSITEZ = false;
    public SS_LODINREFRACTIONALPHA = false;
    public SS_GAMMAREFRACTION = false;
    public SS_RGBDREFRACTION = false;
    public SS_LINEARSPECULARREFRACTION = false;
    public SS_LINKREFRACTIONTOTRANSPARENCY = false;
    public SS_ALBEDOFORREFRACTIONTINT = false;
    public SS_ALBEDOFORTRANSLUCENCYTINT = false;
    public SS_USE_LOCAL_REFRACTIONMAP_CUBIC = false;
    public SS_USE_THICKNESS_AS_DEPTH = false;

    public SS_MASK_FROM_THICKNESS_TEXTURE = false;
    public SS_USE_GLTF_TEXTURES = false;
}

/**
 * Plugin that implements the sub surface component of the PBR material
 */
export class PBRSubSurfaceConfiguration extends MaterialPluginBase {
    protected _material: PBRBaseMaterial;

    private _isRefractionEnabled = false;
    /**
     * Defines if the refraction is enabled in the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isRefractionEnabled = false;

    private _isTranslucencyEnabled = false;
    /**
     * Defines if the translucency is enabled in the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isTranslucencyEnabled = false;

    private _isDispersionEnabled = false;
    /**
     * Defines if dispersion is enabled in the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isDispersionEnabled = false;

    private _isScatteringEnabled = false;
    /**
     * Defines if the sub surface scattering is enabled in the material.
     */
    @serialize()
    @expandToProperty("_markScenePrePassDirty")
    public isScatteringEnabled = false;

    @serialize()
    private _scatteringDiffusionProfileIndex = 0;

    /**
     * Diffusion profile for subsurface scattering.
     * Useful for better scattering in the skins or foliages.
     */
    public get scatteringDiffusionProfile(): Nullable<Color3> {
        if (!this._scene.subSurfaceConfiguration) {
            return null;
        }

        return this._scene.subSurfaceConfiguration.ssDiffusionProfileColors[this._scatteringDiffusionProfileIndex];
    }

    public set scatteringDiffusionProfile(c: Nullable<Color3>) {
        if (!this._scene.enableSubSurfaceForPrePass()) {
            // Not supported
            return;
        }

        // addDiffusionProfile automatically checks for doubles
        if (c) {
            this._scatteringDiffusionProfileIndex = this._scene.subSurfaceConfiguration!.addDiffusionProfile(c);
        }
    }

    /**
     * Defines the refraction intensity of the material.
     * The refraction when enabled replaces the Diffuse part of the material.
     * The intensity helps transitioning between diffuse and refraction.
     */
    @serialize()
    public refractionIntensity: number = 1;

    /**
     * Defines the translucency intensity of the material.
     * When translucency has been enabled, this defines how much of the "translucency"
     * is added to the diffuse part of the material.
     */
    @serialize()
    public translucencyIntensity: number = 1;

    /**
     * When enabled, transparent surfaces will be tinted with the albedo colour (independent of thickness)
     */
    @serialize()
    public useAlbedoToTintRefraction: boolean = false;

    /**
     * When enabled, translucent surfaces will be tinted with the albedo colour (independent of thickness)
     */
    @serialize()
    public useAlbedoToTintTranslucency: boolean = false;

    private _thicknessTexture: Nullable<BaseTexture> = null;
    /**
     * Stores the average thickness of a mesh in a texture (The texture is holding the values linearly).
     * The red (or green if useGltfStyleTextures=true) channel of the texture should contain the thickness remapped between 0 and 1.
     * 0 would mean minimumThickness
     * 1 would mean maximumThickness
     * The other channels might be use as a mask to vary the different effects intensity.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public thicknessTexture: Nullable<BaseTexture> = null;

    private _refractionTexture: Nullable<BaseTexture> = null;
    /**
     * Defines the texture to use for refraction.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public refractionTexture: Nullable<BaseTexture> = null;

    /** @internal */
    public _indexOfRefraction = 1.5;
    /**
     * Index of refraction of the material base layer.
     * https://en.wikipedia.org/wiki/List_of_refractive_indices
     *
     * This does not only impact refraction but also the Base F0 of Dielectric Materials.
     *
     * From dielectric fresnel rules: F0 = square((iorT - iorI) / (iorT + iorI))
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public indexOfRefraction = 1.5;

    @serialize()
    private _volumeIndexOfRefraction = -1.0;

    /**
     * Index of refraction of the material's volume.
     * https://en.wikipedia.org/wiki/List_of_refractive_indices
     *
     * This ONLY impacts refraction. If not provided or given a non-valid value,
     * the volume will use the same IOR as the surface.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public get volumeIndexOfRefraction(): number {
        if (this._volumeIndexOfRefraction >= 1.0) {
            return this._volumeIndexOfRefraction;
        }
        return this._indexOfRefraction;
    }
    public set volumeIndexOfRefraction(value: number) {
        if (value >= 1.0) {
            this._volumeIndexOfRefraction = value;
        } else {
            this._volumeIndexOfRefraction = -1.0;
        }
    }

    private _invertRefractionY = false;
    /**
     * Controls if refraction needs to be inverted on Y. This could be useful for procedural texture.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public invertRefractionY = false;

    /** @internal */
    public _linkRefractionWithTransparency = false;
    /**
     * This parameters will make the material used its opacity to control how much it is refracting against not.
     * Materials half opaque for instance using refraction could benefit from this control.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public linkRefractionWithTransparency = false;

    /**
     * Defines the minimum thickness stored in the thickness map.
     * If no thickness map is defined, this value will be used to simulate thickness.
     */
    @serialize()
    public minimumThickness: number = 0;

    /**
     * Defines the maximum thickness stored in the thickness map.
     */
    @serialize()
    public maximumThickness: number = 1;

    /**
     * Defines that the thickness should be used as a measure of the depth volume.
     */
    @serialize()
    public useThicknessAsDepth = false;

    /**
     * Defines the volume tint of the material.
     * This is used for both translucency and scattering.
     */
    @serializeAsColor3()
    public tintColor = Color3.White();

    /**
     * Defines the distance at which the tint color should be found in the media.
     * This is used for refraction only.
     */
    @serialize()
    public tintColorAtDistance = 1;

    /**
     * Defines the Abbe number for the volume.
     */
    @serialize()
    public dispersion = 0;

    /**
     * Defines how far each channel transmit through the media.
     * It is defined as a color to simplify it selection.
     */
    @serializeAsColor3()
    public diffusionDistance = Color3.White();

    private _useMaskFromThicknessTexture = false;
    /**
     * Stores the intensity of the different subsurface effects in the thickness texture.
     * Note that if refractionIntensityTexture and/or translucencyIntensityTexture is provided it takes precedence over thicknessTexture + useMaskFromThicknessTexture
     * * the green (red if useGltfStyleTextures = true) channel is the refraction intensity.
     * * the blue channel is the translucency intensity.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useMaskFromThicknessTexture: boolean = false;

    private _refractionIntensityTexture: Nullable<BaseTexture> = null;
    /**
     * Stores the intensity of the refraction. If provided, it takes precedence over thicknessTexture + useMaskFromThicknessTexture
     * * the green (red if useGltfStyleTextures = true) channel is the refraction intensity.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public refractionIntensityTexture: Nullable<BaseTexture> = null;

    private _translucencyIntensityTexture: Nullable<BaseTexture> = null;
    /**
     * Stores the intensity of the translucency. If provided, it takes precedence over thicknessTexture + useMaskFromThicknessTexture
     * * the blue channel is the translucency intensity.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public translucencyIntensityTexture: Nullable<BaseTexture> = null;

    private _scene: Scene;
    private _useGltfStyleTextures = false;
    /**
     * Use channels layout used by glTF:
     * * thicknessTexture: the green (instead of red) channel is the thickness
     * * thicknessTexture/refractionIntensityTexture: the red (instead of green) channel is the refraction intensity
     * * thicknessTexture/translucencyIntensityTexture: no change, use the blue channel for the translucency intensity
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useGltfStyleTextures: boolean = false;

    /** @internal */
    private _internalMarkAllSubMeshesAsTexturesDirty: () => void;
    private _internalMarkScenePrePassDirty: () => void;

    /** @internal */
    public _markAllSubMeshesAsTexturesDirty(): void {
        this._enable(this._isRefractionEnabled || this._isTranslucencyEnabled || this._isScatteringEnabled);
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }
    /** @internal */
    public _markScenePrePassDirty(): void {
        this._internalMarkAllSubMeshesAsTexturesDirty();
        this._internalMarkScenePrePassDirty();
    }

    constructor(material: PBRBaseMaterial, addToPluginList = true) {
        super(material, "PBRSubSurface", 130, new MaterialSubSurfaceDefines(), addToPluginList);

        this._scene = material.getScene();
        this.registerForExtraEvents = true;

        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[Constants.MATERIAL_TextureDirtyFlag];
        this._internalMarkScenePrePassDirty = material._dirtyCallbacks[Constants.MATERIAL_PrePassDirtyFlag];
    }

    public isReadyForSubMesh(defines: MaterialSubSurfaceDefines, scene: Scene): boolean {
        if (!this._isRefractionEnabled && !this._isTranslucencyEnabled && !this._isScatteringEnabled) {
            return true;
        }

        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (this._thicknessTexture && MaterialFlags.ThicknessTextureEnabled) {
                    if (!this._thicknessTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }

                const refractionTexture = this._getRefractionTexture(scene);
                if (refractionTexture && MaterialFlags.RefractionTextureEnabled) {
                    if (!refractionTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    public prepareDefinesBeforeAttributes(defines: MaterialSubSurfaceDefines, scene: Scene): void {
        if (!this._isRefractionEnabled && !this._isTranslucencyEnabled && !this._isScatteringEnabled) {
            defines.SUBSURFACE = false;
            defines.SS_DISPERSION = false;
            defines.SS_TRANSLUCENCY = false;
            defines.SS_SCATTERING = false;
            defines.SS_REFRACTION = false;
            defines.SS_REFRACTION_USE_INTENSITY_FROM_TEXTURE = false;
            defines.SS_TRANSLUCENCY_USE_INTENSITY_FROM_TEXTURE = false;
            defines.SS_THICKNESSANDMASK_TEXTURE = false;
            defines.SS_THICKNESSANDMASK_TEXTUREDIRECTUV = 0;
            defines.SS_HAS_THICKNESS = false;
            defines.SS_REFRACTIONINTENSITY_TEXTURE = false;
            defines.SS_REFRACTIONINTENSITY_TEXTUREDIRECTUV = 0;
            defines.SS_TRANSLUCENCYINTENSITY_TEXTURE = false;
            defines.SS_TRANSLUCENCYINTENSITY_TEXTUREDIRECTUV = 0;
            defines.SS_REFRACTIONMAP_3D = false;
            defines.SS_REFRACTIONMAP_OPPOSITEZ = false;
            defines.SS_LODINREFRACTIONALPHA = false;
            defines.SS_GAMMAREFRACTION = false;
            defines.SS_RGBDREFRACTION = false;
            defines.SS_LINEARSPECULARREFRACTION = false;
            defines.SS_LINKREFRACTIONTOTRANSPARENCY = false;
            defines.SS_ALBEDOFORREFRACTIONTINT = false;
            defines.SS_ALBEDOFORTRANSLUCENCYTINT = false;
            defines.SS_USE_LOCAL_REFRACTIONMAP_CUBIC = false;
            defines.SS_USE_THICKNESS_AS_DEPTH = false;
            defines.SS_MASK_FROM_THICKNESS_TEXTURE = false;
            defines.SS_USE_GLTF_TEXTURES = false;
            return;
        }

        if (defines._areTexturesDirty) {
            defines.SUBSURFACE = true;

            defines.SS_DISPERSION = this._isDispersionEnabled;
            defines.SS_TRANSLUCENCY = this._isTranslucencyEnabled;
            defines.SS_TRANSLUCENCY_USE_INTENSITY_FROM_TEXTURE = false;
            defines.SS_SCATTERING = this._isScatteringEnabled;
            defines.SS_THICKNESSANDMASK_TEXTURE = false;
            defines.SS_REFRACTIONINTENSITY_TEXTURE = false;
            defines.SS_TRANSLUCENCYINTENSITY_TEXTURE = false;
            defines.SS_HAS_THICKNESS = false;
            defines.SS_MASK_FROM_THICKNESS_TEXTURE = false;
            defines.SS_USE_GLTF_TEXTURES = false;
            defines.SS_REFRACTION = false;
            defines.SS_REFRACTION_USE_INTENSITY_FROM_TEXTURE = false;
            defines.SS_REFRACTIONMAP_3D = false;
            defines.SS_GAMMAREFRACTION = false;
            defines.SS_RGBDREFRACTION = false;
            defines.SS_LINEARSPECULARREFRACTION = false;
            defines.SS_REFRACTIONMAP_OPPOSITEZ = false;
            defines.SS_LODINREFRACTIONALPHA = false;
            defines.SS_LINKREFRACTIONTOTRANSPARENCY = false;
            defines.SS_ALBEDOFORREFRACTIONTINT = false;
            defines.SS_ALBEDOFORTRANSLUCENCYTINT = false;
            defines.SS_USE_LOCAL_REFRACTIONMAP_CUBIC = false;
            defines.SS_USE_THICKNESS_AS_DEPTH = false;

            const refractionIntensityTextureIsThicknessTexture =
                !!this._thicknessTexture &&
                !!this._refractionIntensityTexture &&
                this._refractionIntensityTexture.checkTransformsAreIdentical(this._thicknessTexture) &&
                this._refractionIntensityTexture._texture === this._thicknessTexture._texture;

            const translucencyIntensityTextureIsThicknessTexture =
                !!this._thicknessTexture &&
                !!this._translucencyIntensityTexture &&
                this._translucencyIntensityTexture.checkTransformsAreIdentical(this._thicknessTexture) &&
                this._translucencyIntensityTexture._texture === this._thicknessTexture._texture;

            // if true, it means the refraction/translucency textures are the same than the thickness texture so there's no need to pass them to the shader, only thicknessTexture
            const useOnlyThicknessTexture =
                (refractionIntensityTextureIsThicknessTexture || !this._refractionIntensityTexture) &&
                (translucencyIntensityTextureIsThicknessTexture || !this._translucencyIntensityTexture);

            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (this._thicknessTexture && MaterialFlags.ThicknessTextureEnabled) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._thicknessTexture, defines, "SS_THICKNESSANDMASK_TEXTURE");
                    }

                    if (this._refractionIntensityTexture && MaterialFlags.RefractionIntensityTextureEnabled && !useOnlyThicknessTexture) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._refractionIntensityTexture, defines, "SS_REFRACTIONINTENSITY_TEXTURE");
                    }

                    if (this._translucencyIntensityTexture && MaterialFlags.TranslucencyIntensityTextureEnabled && !useOnlyThicknessTexture) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._translucencyIntensityTexture, defines, "SS_TRANSLUCENCYINTENSITY_TEXTURE");
                    }
                }
            }

            defines.SS_HAS_THICKNESS = this.maximumThickness - this.minimumThickness !== 0.0;
            defines.SS_MASK_FROM_THICKNESS_TEXTURE =
                (this._useMaskFromThicknessTexture || !!this._refractionIntensityTexture || !!this._translucencyIntensityTexture) && useOnlyThicknessTexture;
            defines.SS_USE_GLTF_TEXTURES = this._useGltfStyleTextures;
            defines.SS_REFRACTION_USE_INTENSITY_FROM_TEXTURE = (this._useMaskFromThicknessTexture || !!this._refractionIntensityTexture) && useOnlyThicknessTexture;
            defines.SS_TRANSLUCENCY_USE_INTENSITY_FROM_TEXTURE = (this._useMaskFromThicknessTexture || !!this._translucencyIntensityTexture) && useOnlyThicknessTexture;

            if (this._isRefractionEnabled) {
                if (scene.texturesEnabled) {
                    const refractionTexture = this._getRefractionTexture(scene);
                    if (refractionTexture && MaterialFlags.RefractionTextureEnabled) {
                        defines.SS_REFRACTION = true;
                        defines.SS_REFRACTIONMAP_3D = refractionTexture.isCube;
                        defines.SS_GAMMAREFRACTION = refractionTexture.gammaSpace;
                        defines.SS_RGBDREFRACTION = refractionTexture.isRGBD;
                        defines.SS_LINEARSPECULARREFRACTION = refractionTexture.linearSpecularLOD;
                        defines.SS_REFRACTIONMAP_OPPOSITEZ = this._scene.useRightHandedSystem && refractionTexture.isCube ? !refractionTexture.invertZ : refractionTexture.invertZ;
                        defines.SS_LODINREFRACTIONALPHA = refractionTexture.lodLevelInAlpha;
                        defines.SS_LINKREFRACTIONTOTRANSPARENCY = this._linkRefractionWithTransparency;
                        defines.SS_ALBEDOFORREFRACTIONTINT = this.useAlbedoToTintRefraction;
                        defines.SS_USE_LOCAL_REFRACTIONMAP_CUBIC = refractionTexture.isCube && (<any>refractionTexture).boundingBoxSize;
                        defines.SS_USE_THICKNESS_AS_DEPTH = this.useThicknessAsDepth;
                    }
                }
            }

            if (this._isTranslucencyEnabled) {
                defines.SS_ALBEDOFORTRANSLUCENCYTINT = this.useAlbedoToTintTranslucency;
            }
        }
    }

    /**
     * Binds the material data (this function is called even if mustRebind() returns false)
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param scene defines the scene the material belongs to.
     * @param engine defines the engine the material belongs to.
     * @param subMesh the submesh to bind data for
     */
    public hardBindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {
        if (!this._isRefractionEnabled && !this._isTranslucencyEnabled && !this._isScatteringEnabled) {
            return;
        }

        subMesh.getRenderingMesh().getWorldMatrix().decompose(TmpVectors.Vector3[0]);

        const thicknessScale = Math.max(Math.abs(TmpVectors.Vector3[0].x), Math.abs(TmpVectors.Vector3[0].y), Math.abs(TmpVectors.Vector3[0].z));

        uniformBuffer.updateFloat2("vThicknessParam", this.minimumThickness * thicknessScale, (this.maximumThickness - this.minimumThickness) * thicknessScale);
    }

    public bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh): void {
        if (!this._isRefractionEnabled && !this._isTranslucencyEnabled && !this._isScatteringEnabled) {
            return;
        }

        const defines = subMesh!.materialDefines as unknown as MaterialSubSurfaceDefines;

        const isFrozen = this._material.isFrozen;
        const realTimeFiltering = this._material.realTimeFiltering;
        const lodBasedMicrosurface = defines.LODBASEDMICROSFURACE;

        const refractionTexture = this._getRefractionTexture(scene);

        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if (this._thicknessTexture && MaterialFlags.ThicknessTextureEnabled) {
                uniformBuffer.updateFloat2("vThicknessInfos", this._thicknessTexture.coordinatesIndex, this._thicknessTexture.level);
                MaterialHelper.BindTextureMatrix(this._thicknessTexture, uniformBuffer, "thickness");
            }

            if (this._refractionIntensityTexture && MaterialFlags.RefractionIntensityTextureEnabled && defines.SS_REFRACTIONINTENSITY_TEXTURE) {
                uniformBuffer.updateFloat2("vRefractionIntensityInfos", this._refractionIntensityTexture.coordinatesIndex, this._refractionIntensityTexture.level);
                MaterialHelper.BindTextureMatrix(this._refractionIntensityTexture, uniformBuffer, "refractionIntensity");
            }

            if (this._translucencyIntensityTexture && MaterialFlags.TranslucencyIntensityTextureEnabled && defines.SS_TRANSLUCENCYINTENSITY_TEXTURE) {
                uniformBuffer.updateFloat2("vTranslucencyIntensityInfos", this._translucencyIntensityTexture.coordinatesIndex, this._translucencyIntensityTexture.level);
                MaterialHelper.BindTextureMatrix(this._translucencyIntensityTexture, uniformBuffer, "translucencyIntensity");
            }

            if (refractionTexture && MaterialFlags.RefractionTextureEnabled) {
                uniformBuffer.updateMatrix("refractionMatrix", refractionTexture.getRefractionTextureMatrix());

                let depth = 1.0;
                if (!refractionTexture.isCube) {
                    if ((<any>refractionTexture).depth) {
                        depth = (<any>refractionTexture).depth;
                    }
                }

                const width = refractionTexture.getSize().width;
                const refractionIor = this.volumeIndexOfRefraction;
                uniformBuffer.updateFloat4("vRefractionInfos", refractionTexture.level, 1 / refractionIor, depth, this._invertRefractionY ? -1 : 1);
                uniformBuffer.updateFloat4(
                    "vRefractionMicrosurfaceInfos",
                    width,
                    refractionTexture.lodGenerationScale,
                    refractionTexture.lodGenerationOffset,
                    1.0 / this.indexOfRefraction
                );

                if (realTimeFiltering) {
                    uniformBuffer.updateFloat2("vRefractionFilteringInfo", width, Scalar.Log2(width));
                }

                if ((<any>refractionTexture).boundingBoxSize) {
                    const cubeTexture = <CubeTexture>refractionTexture;

                    uniformBuffer.updateVector3("vRefractionPosition", cubeTexture.boundingBoxPosition);
                    uniformBuffer.updateVector3("vRefractionSize", cubeTexture.boundingBoxSize);
                }
            }

            if (this._isScatteringEnabled) {
                uniformBuffer.updateFloat("scatteringDiffusionProfile", this._scatteringDiffusionProfileIndex);
            }
            uniformBuffer.updateColor3("vDiffusionDistance", this.diffusionDistance);

            uniformBuffer.updateFloat4("vTintColor", this.tintColor.r, this.tintColor.g, this.tintColor.b, Math.max(0.00001, this.tintColorAtDistance));

            uniformBuffer.updateFloat3("vSubSurfaceIntensity", this.refractionIntensity, this.translucencyIntensity, 0);

            uniformBuffer.updateFloat("dispersion", this.dispersion);
        }

        // Textures
        if (scene.texturesEnabled) {
            if (this._thicknessTexture && MaterialFlags.ThicknessTextureEnabled) {
                uniformBuffer.setTexture("thicknessSampler", this._thicknessTexture);
            }

            if (this._refractionIntensityTexture && MaterialFlags.RefractionIntensityTextureEnabled && defines.SS_REFRACTIONINTENSITY_TEXTURE) {
                uniformBuffer.setTexture("refractionIntensitySampler", this._refractionIntensityTexture);
            }

            if (this._translucencyIntensityTexture && MaterialFlags.TranslucencyIntensityTextureEnabled && defines.SS_TRANSLUCENCYINTENSITY_TEXTURE) {
                uniformBuffer.setTexture("translucencyIntensitySampler", this._translucencyIntensityTexture);
            }

            if (refractionTexture && MaterialFlags.RefractionTextureEnabled) {
                if (lodBasedMicrosurface) {
                    uniformBuffer.setTexture("refractionSampler", refractionTexture);
                } else {
                    uniformBuffer.setTexture("refractionSampler", refractionTexture._lodTextureMid || refractionTexture);
                    uniformBuffer.setTexture("refractionSamplerLow", refractionTexture._lodTextureLow || refractionTexture);
                    uniformBuffer.setTexture("refractionSamplerHigh", refractionTexture._lodTextureHigh || refractionTexture);
                }
            }
        }
    }

    /**
     * Returns the texture used for refraction or null if none is used.
     * @param scene defines the scene the material belongs to.
     * @returns - Refraction texture if present.  If no refraction texture and refraction
     * is linked with transparency, returns environment texture.  Otherwise, returns null.
     */
    private _getRefractionTexture(scene: Scene): Nullable<BaseTexture> {
        if (this._refractionTexture) {
            return this._refractionTexture;
        }

        if (this._isRefractionEnabled) {
            return scene.environmentTexture;
        }

        return null;
    }

    /**
     * Returns true if alpha blending should be disabled.
     */
    public get disableAlphaBlending(): boolean {
        return this._isRefractionEnabled && this._linkRefractionWithTransparency;
    }

    /**
     * Fills the list of render target textures.
     * @param renderTargets the list of render targets to update
     */
    public fillRenderTargetTextures(renderTargets: SmartArray<RenderTargetTexture>): void {
        if (MaterialFlags.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget) {
            renderTargets.push(<RenderTargetTexture>this._refractionTexture);
        }
    }

    public hasTexture(texture: BaseTexture): boolean {
        if (this._thicknessTexture === texture) {
            return true;
        }

        if (this._refractionTexture === texture) {
            return true;
        }

        return false;
    }

    public hasRenderTargetTextures(): boolean {
        if (MaterialFlags.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget) {
            return true;
        }

        return false;
    }

    public getActiveTextures(activeTextures: BaseTexture[]): void {
        if (this._thicknessTexture) {
            activeTextures.push(this._thicknessTexture);
        }

        if (this._refractionTexture) {
            activeTextures.push(this._refractionTexture);
        }
    }

    public getAnimatables(animatables: IAnimatable[]): void {
        if (this._thicknessTexture && this._thicknessTexture.animations && this._thicknessTexture.animations.length > 0) {
            animatables.push(this._thicknessTexture);
        }

        if (this._refractionTexture && this._refractionTexture.animations && this._refractionTexture.animations.length > 0) {
            animatables.push(this._refractionTexture);
        }
    }

    public dispose(forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            if (this._thicknessTexture) {
                this._thicknessTexture.dispose();
            }

            if (this._refractionTexture) {
                this._refractionTexture.dispose();
            }
        }
    }

    public getClassName(): string {
        return "PBRSubSurfaceConfiguration";
    }

    public addFallbacks(defines: MaterialSubSurfaceDefines, fallbacks: EffectFallbacks, currentRank: number): number {
        if (defines.SS_SCATTERING) {
            fallbacks.addFallback(currentRank++, "SS_SCATTERING");
        }
        if (defines.SS_TRANSLUCENCY) {
            fallbacks.addFallback(currentRank++, "SS_TRANSLUCENCY");
        }
        return currentRank;
    }

    public getSamplers(samplers: string[]): void {
        samplers.push("thicknessSampler", "refractionIntensitySampler", "translucencyIntensitySampler", "refractionSampler", "refractionSamplerLow", "refractionSamplerHigh");
    }

    public getUniforms(): { ubo?: Array<{ name: string; size: number; type: string }>; vertex?: string; fragment?: string } {
        return {
            ubo: [
                { name: "vRefractionMicrosurfaceInfos", size: 4, type: "vec4" },
                { name: "vRefractionFilteringInfo", size: 2, type: "vec2" },
                { name: "vTranslucencyIntensityInfos", size: 2, type: "vec2" },
                { name: "vRefractionInfos", size: 4, type: "vec4" },
                { name: "refractionMatrix", size: 16, type: "mat4" },
                { name: "vThicknessInfos", size: 2, type: "vec2" },
                { name: "vRefractionIntensityInfos", size: 2, type: "vec2" },
                { name: "thicknessMatrix", size: 16, type: "mat4" },
                { name: "refractionIntensityMatrix", size: 16, type: "mat4" },
                { name: "translucencyIntensityMatrix", size: 16, type: "mat4" },
                { name: "vThicknessParam", size: 2, type: "vec2" },
                { name: "vDiffusionDistance", size: 3, type: "vec3" },
                { name: "vTintColor", size: 4, type: "vec4" },
                { name: "vSubSurfaceIntensity", size: 3, type: "vec3" },
                { name: "vRefractionPosition", size: 3, type: "vec3" },
                { name: "vRefractionSize", size: 3, type: "vec3" },
                { name: "scatteringDiffusionProfile", size: 1, type: "float" },
                { name: "dispersion", size: 1, type: "float" },
            ],
        };
    }
}
