import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import { Color3 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { Constants } from "core/Engines/constants";
import type { IMaterialLoadingAdapter } from "./materialLoadingAdapter";

/**
 * Material Loading Adapter for PBR materials that provides a unified OpenPBR-like interface.
 */
export class PBRMaterialLoadingAdapter implements IMaterialLoadingAdapter {
    private _material: PBRMaterial;
    private _extinctionCoefficient: Vector3 = Vector3.Zero();

    /**
     * Creates a new instance of the PBRMaterialLoadingAdapter.
     * @param material - The PBR material to adapt.
     */
    constructor(material: Material) {
        this._material = material as PBRMaterial;
        this._material.enableSpecularAntiAliasing = true;
    }

    /**
     * Gets the underlying material
     */
    public get material(): PBRMaterial {
        return this._material;
    }

    /**
     * Whether the material should be treated as unlit
     */
    public get isUnlit(): boolean {
        return this._material.unlit;
    }

    /**
     * Sets whether the material should be treated as unlit
     */
    public set isUnlit(value: boolean) {
        this._material.unlit = value;
    }

    // ========================================
    // CULLING PROPERTIES
    // ========================================

    /**
     * Sets whether back face culling is enabled.
     * @param value True to enable back face culling
     */
    public set backFaceCulling(value: boolean) {
        this._material.backFaceCulling = value;
    }

    /**
     * Gets whether back face culling is enabled.
     * @returns True if back face culling is enabled
     */
    public get backFaceCulling(): boolean {
        return this._material.backFaceCulling;
    }

    /**
     * Sets whether two-sided lighting is enabled.
     * @param value True to enable two-sided lighting
     */
    public set twoSidedLighting(value: boolean) {
        this._material.twoSidedLighting = value;
    }

    /**
     * Gets whether two-sided lighting is enabled.
     * @returns True if two-sided lighting is enabled
     */
    public get twoSidedLighting(): boolean {
        return this._material.twoSidedLighting;
    }

    // ========================================
    // ALPHA PROPERTIES
    // ========================================

    /**
     * Sets the alpha cutoff value for alpha testing.
     * @param value The alpha cutoff threshold (0-1)
     */
    public set alphaCutOff(value: number) {
        this._material.alphaCutOff = value;
    }

    /**
     * Gets the alpha cutoff value.
     * @returns The alpha cutoff threshold (0-1)
     */
    public get alphaCutOff(): number {
        return this._material.alphaCutOff;
    }

    /**
     * Sets whether to use alpha from the albedo texture.
     * @param value True to use alpha from albedo texture
     */
    public set useAlphaFromBaseColorTexture(value: boolean) {
        this._material.useAlphaFromAlbedoTexture = value;
    }

    /**
     * Gets whether alpha is used from the albedo texture.
     * @returns True if using alpha from albedo texture
     */
    public get useAlphaFromBaseColorTexture(): boolean {
        return this._material.useAlphaFromAlbedoTexture;
    }

    /**
     * Gets whether the transparency is treated as alpha coverage.
     */
    public get transparencyAsAlphaCoverage(): boolean {
        return this._material.useRadianceOverAlpha || this._material.useSpecularOverAlpha;
    }

    /**
     * Sets/Gets whether the transparency is treated as alpha coverage
     */
    public set transparencyAsAlphaCoverage(value: boolean) {
        this._material.useRadianceOverAlpha = !value;
        this._material.useSpecularOverAlpha = !value;
    }

    // ========================================
    // BASE PARAMETERS
    // ========================================

    /**
     * Sets the base color of the material (mapped to PBR albedoColor).
     * @param value The base color as a Color3
     */
    public set baseColor(value: Color3) {
        this._material.albedoColor = value;
    }

    /**
     * Gets the base color of the material.
     * @returns The base color as a Color3
     */
    public get baseColor(): Color3 {
        return this._material.albedoColor;
    }

    /**
     * Sets the base color texture of the material (mapped to PBR albedoTexture).
     * @param value The base color texture or null
     */
    public set baseColorTexture(value: Nullable<BaseTexture>) {
        this._material.albedoTexture = value;
    }

    /**
     * Gets the base color texture of the material.
     * @returns The base color texture or null
     */
    public get baseColorTexture(): Nullable<BaseTexture> {
        return this._material.albedoTexture;
    }

    /**
     * Sets the base diffuse roughness of the material.
     * @param value The diffuse roughness value (0-1)
     */
    public set baseDiffuseRoughness(value: number) {
        this._material.baseDiffuseRoughness = value;
        if (value > 0) {
            this._material.brdf.baseDiffuseModel = Constants.MATERIAL_DIFFUSE_MODEL_E_OREN_NAYAR;
        }
    }

    /**
     * Gets the base diffuse roughness of the material.
     * @returns The diffuse roughness value (0-1), defaults to 0 if not set
     */
    public get baseDiffuseRoughness(): number {
        return this._material.baseDiffuseRoughness ?? 0;
    }

    /**
     * Sets the base diffuse roughness texture of the material.
     * @param value The diffuse roughness texture or null
     */
    public set baseDiffuseRoughnessTexture(value: Nullable<BaseTexture>) {
        this._material.baseDiffuseRoughnessTexture = value;
    }

    /**
     * Gets the base diffuse roughness texture of the material.
     * @returns The diffuse roughness texture or null
     */
    public get baseDiffuseRoughnessTexture(): Nullable<BaseTexture> {
        return this._material.baseDiffuseRoughnessTexture;
    }

    /**
     * Sets the base metalness value of the material (mapped to PBR metallic).
     * @param value The metalness value (0-1)
     */
    public set baseMetalness(value: number) {
        this._material.metallic = value;
    }

    /**
     * Gets the base metalness value of the material.
     * @returns The metalness value (0-1), defaults to 1 if not set
     */
    public get baseMetalness(): number {
        return this._material.metallic ?? 1;
    }

    /**
     * Sets the base metalness texture of the material (mapped to PBR metallicTexture).
     * @param value The metalness texture or null
     */
    public set baseMetalnessTexture(value: Nullable<BaseTexture>) {
        this._material.metallicTexture = value;
    }

    /**
     * Gets the base metalness texture of the material.
     * @returns The metalness texture or null
     */
    public get baseMetalnessTexture(): Nullable<BaseTexture> {
        return this._material.metallicTexture;
    }

    /**
     * Sets whether to use roughness from the metallic texture's green channel.
     * Also disables using roughness from the alpha channel when enabled.
     * @param value True to use green channel for roughness
     */
    public set useRoughnessFromMetallicTextureGreen(value: boolean) {
        this._material.useRoughnessFromMetallicTextureGreen = value;
        this._material.useRoughnessFromMetallicTextureAlpha = !value;
    }

    /**
     * Sets whether to use metalness from the metallic texture's blue channel.
     * @param value True to use blue channel for metalness
     */
    public set useMetallicFromMetallicTextureBlue(value: boolean) {
        this._material.useMetallnessFromMetallicTextureBlue = value;
    }

    // ========================================
    // SPECULAR PARAMETERS
    // ========================================

    /**
     * Configures specular properties and optionally enables OpenPBR BRDF model for edge color support.
     * @param enableEdgeColor Whether to enable OpenPBR BRDF models for edge color support
     */
    public enableSpecularEdgeColor(enableEdgeColor: boolean = false): void {
        if (enableEdgeColor) {
            this._material.brdf.dielectricSpecularModel = Constants.MATERIAL_DIELECTRIC_SPECULAR_MODEL_OPENPBR;
            this._material.brdf.conductorSpecularModel = Constants.MATERIAL_CONDUCTOR_SPECULAR_MODEL_OPENPBR;
        }
    }

    /**
     * Sets the specular weight (mapped to PBR metallicF0Factor).
     * @param value The specular weight value
     */
    public set specularWeight(value: number) {
        this._material.metallicF0Factor = value;
    }

    /**
     * Gets the specular weight.
     * @returns The specular weight value, defaults to 1 if not set
     */
    public get specularWeight(): number {
        return this._material.metallicF0Factor ?? 1;
    }

    /**
     * Sets the specular weight texture (mapped to PBR metallicReflectanceTexture).
     * Configures the material to use only metalness from this texture when set.
     * @param value The specular weight texture or null
     */
    public set specularWeightTexture(value: Nullable<BaseTexture>) {
        if (value) {
            this._material.metallicReflectanceTexture = value;
            this._material.useOnlyMetallicFromMetallicReflectanceTexture = true;
        } else {
            this._material.metallicReflectanceTexture = null;
            this._material.useOnlyMetallicFromMetallicReflectanceTexture = false;
        }
    }

    /**
     * Gets the specular weight texture.
     * @returns The specular weight texture or null
     */
    public get specularWeightTexture(): Nullable<BaseTexture> {
        return this._material.metallicReflectanceTexture;
    }

    /**
     * Sets the specular color (mapped to PBR metallicReflectanceColor).
     * @param value The specular color as a Color3
     */
    public set specularColor(value: Color3) {
        this._material.metallicReflectanceColor = value;
    }

    /**
     * Gets the specular color.
     * @returns The specular color as a Color3
     */
    public get specularColor(): Color3 {
        return this._material.metallicReflectanceColor;
    }

    /**
     * Sets the specular color texture (mapped to PBR reflectanceTexture).
     * @param value The specular color texture or null
     */
    public set specularColorTexture(value: Nullable<BaseTexture>) {
        this._material.reflectanceTexture = value;
    }

    /**
     * Gets the specular color texture.
     * @returns The specular color texture or null
     */
    public get specularColorTexture(): Nullable<BaseTexture> {
        return this._material.reflectanceTexture;
    }

    /**
     * Sets the specular roughness (mapped to PBR roughness).
     * @param value The roughness value (0-1)
     */
    public set specularRoughness(value: number) {
        this._material.roughness = value;
    }

    /**
     * Gets the specular roughness.
     * @returns The roughness value (0-1), defaults to 1 if not set
     */
    public get specularRoughness(): number {
        return this._material.roughness ?? 1;
    }

    /**
     * Sets the specular roughness texture.
     * Note: PBR uses the same texture for both metallic and roughness,
     * so this only sets the texture if no base metalness texture exists.
     * @param value The roughness texture or null
     */
    public set specularRoughnessTexture(value: Nullable<BaseTexture>) {
        // PBR uses the same texture for both metallic and roughness
        if (!this.baseMetalnessTexture) {
            this._material.metallicTexture = value;
        }
    }

    /**
     * Gets the specular roughness texture.
     * @returns The roughness texture (same as metallic texture for PBR) or null
     */
    public get specularRoughnessTexture(): Nullable<BaseTexture> {
        return this._material.metallicTexture;
    }

    /**
     * Sets the specular index of refraction (mapped to PBR indexOfRefraction).
     * @param value The IOR value
     */
    public set specularIor(value: number) {
        this._material.indexOfRefraction = value;
    }

    /**
     * Gets the specular index of refraction.
     * @returns The IOR value
     */
    public get specularIor(): number {
        return this._material.indexOfRefraction;
    }

    // ========================================
    // EMISSION PARAMETERS
    // ========================================

    /**
     * Sets the emission color (mapped to PBR emissiveColor).
     * @param value The emission color as a Color3
     */
    public set emissionColor(value: Color3) {
        this._material.emissiveColor = value;
    }

    /**
     * Gets the emission color.
     * @returns The emission color as a Color3
     */
    public get emissionColor(): Color3 {
        return this._material.emissiveColor;
    }

    /**
     * Sets the emission luminance/intensity (mapped to PBR emissiveIntensity).
     * @param value The emission intensity value
     */
    public set emissionLuminance(value: number) {
        this._material.emissiveIntensity = value;
    }

    /**
     * Gets the emission luminance/intensity.
     * @returns The emission intensity value
     */
    public get emissionLuminance(): number {
        return this._material.emissiveIntensity;
    }

    /**
     * Sets the emission color texture (mapped to PBR emissiveTexture).
     * @param value The emission texture or null
     */
    public set emissionColorTexture(value: Nullable<BaseTexture>) {
        this._material.emissiveTexture = value;
    }

    /**
     * Gets the emission color texture.
     * @returns The emission texture or null
     */
    public get emissionColorTexture(): Nullable<BaseTexture> {
        return this._material.emissiveTexture;
    }

    // ========================================
    // AMBIENT OCCLUSION
    // ========================================

    /**
     * Sets the ambient occlusion texture (mapped to PBR ambientTexture).
     * Automatically enables grayscale mode when set.
     * @param value The ambient occlusion texture or null
     */
    public set ambientOcclusionTexture(value: Nullable<BaseTexture>) {
        this._material.ambientTexture = value;
        if (value) {
            this._material.useAmbientInGrayScale = true;
        }
    }

    /**
     * Gets the ambient occlusion texture.
     * @returns The ambient occlusion texture or null
     */
    public get ambientOcclusionTexture(): Nullable<BaseTexture> {
        return this._material.ambientTexture;
    }

    /**
     * Sets the ambient occlusion texture strength.
     * @param value The strength value (typically 0-1)
     */
    public set ambientOcclusionTextureStrength(value: number) {
        this._material.ambientTextureStrength = value;
    }

    /**
     * Gets the ambient occlusion texture strength.
     * @returns The strength value, defaults to 1.0 if not set
     */
    public get ambientOcclusionTextureStrength(): number {
        return this._material.ambientTextureStrength ?? 1.0;
    }

    // ========================================
    // COAT PARAMETERS
    // ========================================

    /**
     * Configures clear coat for PBR material.
     * Enables clear coat and sets up proper configuration.
     */
    public configureCoat(): void {
        this._material.clearCoat.isEnabled = true;
        this._material.clearCoat.useRoughnessFromMainTexture = false;
        this._material.clearCoat.remapF0OnInterfaceChange = false;
    }

    /**
     * Sets the coat weight (mapped to PBR clearCoat.intensity).
     * Automatically enables clear coat.
     * @param value The coat weight value (0-1)
     */
    public set coatWeight(value: number) {
        this._material.clearCoat.isEnabled = true;
        this._material.clearCoat.intensity = value;
    }

    /**
     * Gets the coat weight.
     * @returns The coat weight value
     */
    public get coatWeight(): number {
        return this._material.clearCoat.intensity;
    }

    /**
     * Sets the coat weight texture (mapped to PBR clearCoat.texture).
     * Automatically enables clear coat.
     * @param value The coat weight texture or null
     */
    public set coatWeightTexture(value: Nullable<BaseTexture>) {
        this._material.clearCoat.isEnabled = true;
        this._material.clearCoat.texture = value;
    }

    /**
     * Gets the coat weight texture.
     * @returns The coat weight texture or null
     */
    public get coatWeightTexture(): Nullable<BaseTexture> {
        return this._material.clearCoat.texture;
    }

    /**
     * Sets the coat color (mapped to PBR clearCoat.tintColor).
     * @param value The coat tint color as a Color3
     */
    public set coatColor(value: Color3) {
        this._material.clearCoat.isTintEnabled = value != Color3.White();
        this._material.clearCoat.tintColor = value;
    }

    /**
     * Sets the coat color texture (mapped to PBR clearCoat.tintTexture).
     * @param value The coat color texture or null
     */
    public set coatColorTexture(value: Nullable<BaseTexture>) {
        this._material.clearCoat.tintTexture = value;
    }

    /**
     * Sets the coat roughness (mapped to PBR clearCoat.roughness).
     * Automatically enables clear coat.
     * @param value The coat roughness value (0-1)
     */
    public set coatRoughness(value: number) {
        this._material.clearCoat.isEnabled = true;
        this._material.clearCoat.roughness = value;
    }

    /**
     * Gets the coat roughness.
     * @returns The coat roughness value, defaults to 0 if not set
     */
    public get coatRoughness(): number {
        return this._material.clearCoat.roughness ?? 0;
    }

    /**
     * Sets the coat roughness texture (mapped to PBR clearCoat.textureRoughness).
     * Automatically enables clear coat and disables using roughness from main texture.
     * @param value The coat roughness texture or null
     */
    public set coatRoughnessTexture(value: Nullable<BaseTexture>) {
        this._material.clearCoat.isEnabled = true;
        this._material.clearCoat.useRoughnessFromMainTexture = false;
        this._material.clearCoat.textureRoughness = value;
    }

    /**
     * Gets the coat roughness texture.
     * @returns The coat roughness texture or null
     */
    public get coatRoughnessTexture(): Nullable<BaseTexture> {
        return this._material.clearCoat.textureRoughness;
    }

    /**
     * Sets the coat index of refraction (IOR).
     */
    public set coatIor(value: number) {
        this._material.clearCoat.indexOfRefraction = value;
    }

    /**
     * Sets the coat darkening value.
     * Note: PBR doesn't have a direct coat darkening property, so this is a no-op.
     * @param value The coat darkening value (ignored for PBR)
     */
    public set coatDarkening(value: number) {
        // PBR doesn't have a coat darkening property
    }

    /**
     * Sets the coat darkening texture
     * @param value The coat darkening texture or null
     */
    public set coatDarkeningTexture(value: Nullable<BaseTexture>) {
        // PBR doesn't have a coat darkening property
    }

    /**
     * Sets the coat roughness anisotropy.
     * Note: PBR clearCoat doesn't support anisotropy yet, so this is a placeholder.
     * @param value The coat anisotropy intensity value (currently ignored)
     */
    public set coatRoughnessAnisotropy(value: number) {
        // TODO: Implement when PBR clearCoat anisotropy becomes available
        // this._material.clearCoat.anisotropy = value;
    }

    /**
     * Gets the coat roughness anisotropy.
     * Note: PBR clearCoat doesn't support anisotropy yet, so this returns 0.
     * @returns Currently returns 0 as clearCoat anisotropy is not yet available
     */
    public get coatRoughnessAnisotropy(): number {
        // TODO: Implement when PBR clearCoat anisotropy becomes available
        // return this._material.clearCoat.anisotropy ?? 0;
        return 0;
    }

    /**
     * Sets the coat tangent angle for anisotropy.
     * Note: PBR clearCoat doesn't support anisotropy yet, so this is a placeholder.
     * @param value The coat anisotropy rotation angle in radians (currently ignored)
     */
    public set geometryCoatTangentAngle(value: number) {
        // TODO: Implement when PBR clearCoat anisotropy becomes available
        // this._material.clearCoat.anisotropyAngle = value;
    }

    /**
     * Sets the coat tangent texture for anisotropy.
     * Note: PBR clearCoat doesn't support anisotropy textures yet, so this is a placeholder.
     * @param value The coat anisotropy texture (currently ignored)
     */
    public set geometryCoatTangentTexture(value: Nullable<BaseTexture>) {
        // TODO: Implement when PBR clearCoat anisotropy becomes available
        // this._material.clearCoat.anisotropyTangentTexture = value;
    }

    /**
     * Gets the coat tangent texture for anisotropy.
     * Note: PBR clearCoat doesn't support anisotropy textures yet, so this returns null.
     * @returns Currently returns null as clearCoat anisotropy is not yet available
     */
    public get geometryCoatTangentTexture(): Nullable<BaseTexture> {
        // TODO: Implement when PBR clearCoat anisotropy becomes available
        // return this._material.clearCoat.anisotropyTangentTexture;
        return null;
    }

    // ========================================
    // TRANSMISSION LAYER
    // ========================================

    /**
     * Sets the transmission weight (mapped to PBR subSurface.refractionIntensity).
     * Enables refraction when value \> 0.
     * @param value The transmission weight value (0-1)
     */
    public set transmissionWeight(value: number) {
        this._material.subSurface.isRefractionEnabled = value > 0;
        this._material.subSurface.refractionIntensity = value;
    }

    /**
     * Gets the transmission weight.
     * @returns The transmission weight value
     */
    public get transmissionWeight(): number {
        return this._material.subSurface.isRefractionEnabled ? this._material.subSurface.refractionIntensity : 0;
    }

    /**
     * Sets the transmission weight texture (mapped to PBR subSurface.refractionIntensityTexture).
     * Automatically enables refraction and glTF-style textures.
     * @param value The transmission weight texture or null
     */
    public set transmissionWeightTexture(value: Nullable<BaseTexture>) {
        this._material.subSurface.isRefractionEnabled = true;
        this._material.subSurface.refractionIntensityTexture = value;
        this._material.subSurface.useGltfStyleTextures = true;
    }

    /**
     * Sets the attenuation distance for volume.
     * @param value The attenuation distance value
     */
    public set transmissionDepth(value: number) {
        if (this.transmissionWeight > 0) {
            this._material.subSurface.tintColorAtDistance = value;
        } else if (this.subsurfaceWeight > 0) {
            this._material.subSurface.diffusionDistance.multiplyInPlace(new Color3(value, value, value));
        }
    }

    /**
     * Gets the attenuation distance for volume.
     * @returns The attenuation distance value
     */
    public get transmissionDepth(): number {
        if (this.transmissionWeight > 0) {
            return this._material.subSurface.tintColorAtDistance;
        }
        return 0;
    }

    /**
     * Sets the attenuation color (mapped to PBR subSurface.tintColor).
     * @param value The attenuation color as a Color3
     */
    public set transmissionColor(value: Color3) {
        if (this.transmissionWeight > 0) {
            this._material.subSurface.tintColor = value;
        } else if (this.subsurfaceWeight > 0) {
            this._material.subSurface.diffusionDistance.multiplyInPlace(value);
        }
    }

    /**
     * Sets the attenuation color (mapped to PBR subSurface.tintColor).
     * @returns The attenuation color as a Color3
     */
    public get transmissionColor(): Color3 {
        if (this.transmissionWeight > 0) {
            return this._material.subSurface.tintColor;
        } else if (this.subsurfaceWeight > 0) {
            return this._material.subSurface.diffusionDistance;
        }
        return new Color3(0, 0, 0);
    }

    /**
     * Sets the transmission scatter coefficient.
     * @param value The scatter coefficient as a Color3
     */
    public set transmissionScatter(value: Color3) {
        // TODO convert from scatter coefficient to diffusion distance
        this._material.subSurface.diffusionDistance = value;
    }

    /**
     * Sets the transmission scatter coefficient.
     * @returns The scatter coefficient as a Color3
     */
    public get transmissionScatter(): Color3 {
        // TODO convert from diffusion distance to scatter coefficient
        return this._material.subSurface.diffusionDistance;
    }

    /**
     * Sets the transmission scattering anisotropy.
     * @param value The anisotropy intensity value (-1 to 1)
     */
    public set transmissionScatterAnisotropy(value: number) {
        // No direct mapping in PBRMaterial
    }

    /**
     * Sets the transmission dispersion Abbe number.
     * @param value The Abbe number value
     */
    public set transmissionDispersionAbbeNumber(value: number) {
        // PBRMaterial assumes a fixed Abbe number of 20.0 for dispersion calculations.
    }

    /**
     * Sets the transmission dispersion scale.
     * @param value The dispersion scale value
     */
    public set transmissionDispersionScale(value: number) {
        if (value > 0) {
            this._material.subSurface.isDispersionEnabled = true;
            this._material.subSurface.dispersion = 20.0 / value;
        } else {
            this._material.subSurface.isDispersionEnabled = false;
            this._material.subSurface.dispersion = 0;
        }
    }

    /**
     * Gets the refraction background texture
     * @returns The refraction background texture or null
     */
    public get refractionBackgroundTexture(): Nullable<BaseTexture> {
        return this._material.subSurface.refractionTexture;
    }

    /**
     * Sets the refraction background texture
     * @param value The refraction background texture or null
     */
    public set refractionBackgroundTexture(value: Nullable<BaseTexture>) {
        this._material.subSurface.refractionTexture = value;
    }

    /**
     * Configures transmission for thin-surface transmission (KHR_materials_transmission).
     * Sets up the material for proper thin-surface transmission behavior.
     */
    public configureTransmission(): void {
        // Since this extension models thin-surface transmission only, we must make IOR = 1.0
        this._material.subSurface.volumeIndexOfRefraction = 1.0;
        // Albedo colour will tint transmission.
        this._material.subSurface.useAlbedoToTintRefraction = true;
        this._material.subSurface.minimumThickness = 0.0;
        this._material.subSurface.maximumThickness = 0.0;
    }

    // ========================================
    // VOLUME PROPERTIES
    // ========================================

    /**
     * Sets the thickness texture (mapped to PBR subSurface.thicknessTexture).
     * Automatically enables refraction.
     * @param value The thickness texture or null
     */
    public set volumeThicknessTexture(value: Nullable<BaseTexture>) {
        this._material.subSurface.thicknessTexture = value;
        this._material.subSurface.useGltfStyleTextures = true;
    }

    /**
     * Sets the thickness factor (mapped to PBR subSurface.maximumThickness).
     * Automatically enables refraction.
     * @param value The thickness value
     */
    public set volumeThickness(value: number) {
        this._material.subSurface.minimumThickness = 0.0;
        this._material.subSurface.maximumThickness = value;
        this._material.subSurface.useThicknessAsDepth = true;
        if (value > 0) {
            this._material.subSurface.volumeIndexOfRefraction = this._material.indexOfRefraction;
        }
    }

    // ========================================
    // SUBSURFACE PROPERTIES (Subsurface Scattering)
    // ========================================

    /**
     * Configures subsurface properties for PBR material
     */
    public configureSubsurface(): void {
        this._material.subSurface.useGltfStyleTextures = true;

        // Since this extension models thin-surface transmission only, we must make the
        // internal IOR == 1.0 and set the thickness to 0.
        this._material.subSurface.volumeIndexOfRefraction = 1.0;
        this._material.subSurface.minimumThickness = 0.0;
        this._material.subSurface.maximumThickness = 0.0;

        // Tint color will be used for transmission.
        this._material.subSurface.useAlbedoToTintTranslucency = false;
    }

    /**
     * Sets the extinction coefficient of the volume.
     * @param value The extinction coefficient as a Vector3
     */
    public set extinctionCoefficient(value: Vector3) {
        this._extinctionCoefficient = value;
    }

    /**
     * Gets the extinction coefficient of the volume.
     */
    public get extinctionCoefficient(): Vector3 {
        return this._extinctionCoefficient;
    }

    /**
     * Sets the subsurface weight
     */
    public set subsurfaceWeight(value: number) {
        this._material.subSurface.isTranslucencyEnabled = value > 0;
        this._material.subSurface.translucencyIntensity = value;
    }

    /**
     * Gets the subsurface weight
     * @returns The subsurface weight value
     */
    public get subsurfaceWeight(): number {
        return this._material.subSurface.isTranslucencyEnabled ? this._material.subSurface.translucencyIntensity : 0;
    }

    /**
     * Sets the subsurface weight texture
     */
    public set subsurfaceWeightTexture(value: Nullable<BaseTexture>) {
        this._material.subSurface.translucencyIntensityTexture = value;
    }

    /**
     * Sets the subsurface color.
     * @param value The subsurface tint color as a Color3
     */
    public set subsurfaceColor(value: Color3) {
        // PBRMaterial does not have a direct equivalent for subsurface color,
        // We could set the base color to this value, wherever subsurfaceWeight > 0
        // When scatterAnisotropy is 1, I believe we can approximate the subsurface effect quite well with
        // Translucency and a diffusion distance

        const absorptionCoeff = this.extinctionCoefficient;
        const maxChannel = Math.max(absorptionCoeff.x, Math.max(absorptionCoeff.y, absorptionCoeff.z));
        const attenuationDistance = maxChannel > 0 ? 1.0 / maxChannel : 1;
        this._material.subSurface.diffusionDistance = new Color3(
            Math.exp(-absorptionCoeff.x * attenuationDistance),
            Math.exp(-absorptionCoeff.y * attenuationDistance),
            Math.exp(-absorptionCoeff.z * attenuationDistance)
        );
    }

    /**
     * Sets the subsurface color texture.
     * @param value The subsurface tint texture or null
     */
    public set subsurfaceColorTexture(value: Nullable<BaseTexture>) {
        // PBRMaterial does not have a direct equivalent for subsurface color texture,
    }

    /**
     * Sets the surface tint of the material (when using subsurface scattering)
     */
    public set subsurfaceConstantTint(value: Color3) {
        this._material.subSurface.tintColor = value;
    }

    /**
     * Gets the subsurface constant tint (when using subsurface scattering)
     * @returns The subsurface constant tint as a Color3
     */
    public get subsurfaceConstantTint(): Color3 {
        return this._material.subSurface.tintColor;
    }

    /**
     * Sets the subsurface constant tint texture (when using subsurface scattering)
     * @param value The subsurface constant tint texture or null
     */
    public set subsurfaceConstantTintTexture(value: Nullable<BaseTexture>) {
        this._material.subSurface.translucencyColorTexture = value;
    }

    /**
     * Gets the subsurface radius (used for subsurface scattering)
     * subsurfaceRadiusScale * subsurfaceRadius gives the mean free path per color channel.
     * @returns The subsurface radius as a Color3
     */
    public get subsurfaceRadius(): number {
        return 1.0;
    }

    /**
     * Sets the subsurface radius (used for subsurface scattering)
     * subsurfaceRadiusScale * subsurfaceRadius gives the mean free path per color channel.
     * @param value The subsurface radius as a number
     */
    public set subsurfaceRadius(value: number) {
        //
    }

    /**
     * Gets the subsurface radius scale (used for subsurface scattering)
     * subsurfaceRadiusScale * subsurfaceRadius gives the mean free path per color channel.
     * @returns The subsurface radius scale as a Color3
     */
    public get subsurfaceRadiusScale(): Color3 {
        return this._material.subSurface.scatteringDiffusionProfile ?? Color3.White();
    }

    /**
     * Sets the subsurface radius scale (used for subsurface scattering)
     * subsurfaceRadiusScale * subsurfaceRadius gives the mean free path per color channel.
     * @param value The subsurface radius scale as a Color3
     */
    public set subsurfaceRadiusScale(value: Color3) {
        this._material.subSurface.scatteringDiffusionProfile = value;
    }

    /**
     * Sets the subsurface scattering anisotropy.
     * Note: PBRMaterial does not have a direct equivalent, so this is a no-op.
     * @param value The anisotropy intensity value (ignored for PBR)
     */
    public set subsurfaceScatterAnisotropy(value: number) {
        // No equivalent in PBRMaterial
    }

    // ========================================
    // FUZZ LAYER (Sheen)
    // ========================================

    /**
     * Configures sheen for PBR material.
     * Enables sheen and sets up proper configuration.
     */
    public configureFuzz(): void {
        this._material.sheen.isEnabled = true;
        this._material.sheen.useRoughnessFromMainTexture = false;
        this._material.sheen.albedoScaling = true;
    }

    /**
     * Sets the sheen weight (mapped to PBR sheen.intensity).
     * Automatically enables sheen.
     * @param value The sheen weight value
     */
    public set fuzzWeight(value: number) {
        this._material.sheen.isEnabled = true;
        this._material.sheen.intensity = value;
    }

    /**
     * Sets the fuzz weight texture.
     * @param value The fuzz weight texture or null
     */
    public set fuzzWeightTexture(value: Nullable<BaseTexture>) {
        // PBRMaterial sheen supports glTF-style sheen which doesn't
        // use a separate texture for intensity. So we'll only set the
        // weight texture if none is already assigned. If one's already
        // assigned, we assume it contains the sheen color data.
        if (!this._material.sheen.texture) {
            this._material.sheen.texture = value;
        }
    }

    /**
     * Sets the sheen color (mapped to PBR sheen.color).
     * Automatically enables sheen.
     * @param value The sheen color as a Color3
     */
    public set fuzzColor(value: Color3) {
        this._material.sheen.isEnabled = true;
        this._material.sheen.color = value;
    }

    /**
     * Sets the sheen color texture (mapped to PBR sheen.texture).
     * Automatically enables sheen.
     * @param value The sheen color texture or null
     */
    public set fuzzColorTexture(value: Nullable<BaseTexture>) {
        this._material.sheen.texture = value;
    }

    /**
     * Sets the sheen roughness (mapped to PBR sheen.roughness).
     * Automatically enables sheen.
     * @param value The sheen roughness value (0-1)
     */
    public set fuzzRoughness(value: number) {
        this._material.sheen.isEnabled = true;
        this._material.sheen.roughness = value;
    }

    /**
     * Sets the sheen roughness texture (mapped to PBR sheen.textureRoughness).
     * Automatically enables sheen.
     * @param value The sheen roughness texture or null
     */
    public set fuzzRoughnessTexture(value: Nullable<BaseTexture>) {
        this._material.sheen.isEnabled = true;
        this._material.sheen.textureRoughness = value;
    }

    // ========================================
    // ANISOTROPY
    // ========================================

    /**
     * Sets the specular roughness anisotropy (mapped to PBR anisotropy.intensity).
     * Automatically enables anisotropy.
     * @param value The anisotropy intensity value
     */
    public set specularRoughnessAnisotropy(value: number) {
        this._material.anisotropy.isEnabled = true;
        this._material.anisotropy.intensity = value;
    }

    /**
     * Gets the specular roughness anisotropy.
     * @returns The anisotropy intensity value
     */
    public get specularRoughnessAnisotropy(): number {
        return this._material.anisotropy.intensity;
    }

    /**
     * Sets the anisotropy rotation (mapped to PBR anisotropy.angle).
     * Automatically enables anisotropy.
     * @param value The anisotropy rotation angle in radians
     */
    public set geometryTangentAngle(value: number) {
        this._material.anisotropy.isEnabled = true;
        this._material.anisotropy.angle = value;
    }

    /**
     * Sets the geometry tangent texture (mapped to PBR anisotropy.texture).
     * Automatically enables anisotropy.
     * @param value The anisotropy texture or null
     */
    public set geometryTangentTexture(value: Nullable<BaseTexture>) {
        this._material.anisotropy.isEnabled = true;
        this._material.anisotropy.texture = value;
    }

    /**
     * Gets the geometry tangent texture.
     * @returns The anisotropy texture or null
     */
    public get geometryTangentTexture(): Nullable<BaseTexture> {
        return this._material.anisotropy.texture;
    }

    /**
     * Configures glTF-style anisotropy for the material.
     * Note: PBR materials don't need this configuration, so this is a no-op.
     * @param useGltfStyle Whether to use glTF-style anisotropy (ignored for PBR)
     */
    public configureGltfStyleAnisotropy(useGltfStyle: boolean = true): void {
        // PBR materials don't need this configuration
    }

    // ========================================
    // THIN FILM IRIDESCENCE
    // ========================================

    /**
     * Sets the iridescence weight (mapped to PBR iridescence.intensity).
     * Automatically enables iridescence.
     * @param value The iridescence intensity value
     */
    public set thinFilmWeight(value: number) {
        this._material.iridescence.isEnabled = value > 0;
        this._material.iridescence.intensity = value;
    }

    /**
     * Sets the iridescence IOR (mapped to PBR iridescence.indexOfRefraction).
     * @param value The iridescence IOR value
     */
    public set thinFilmIor(value: number) {
        this._material.iridescence.indexOfRefraction = value;
    }

    /**
     * Sets the iridescence thickness minimum (mapped to PBR iridescence.minimumThickness).
     * @param value The minimum thickness value in nanometers
     */
    public set thinFilmThicknessMinimum(value: number) {
        this._material.iridescence.minimumThickness = value;
    }

    /**
     * Sets the iridescence thickness maximum (mapped to PBR iridescence.maximumThickness).
     * @param value The maximum thickness value in nanometers
     */
    public set thinFilmThicknessMaximum(value: number) {
        this._material.iridescence.maximumThickness = value;
    }

    /**
     * Sets the thin film weight texture (mapped to PBR iridescence.texture).
     * @param value The thin film weight texture or null
     */
    public set thinFilmWeightTexture(value: Nullable<BaseTexture>) {
        this._material.iridescence.texture = value;
    }

    /**
     * Sets the iridescence thickness texture (mapped to PBR iridescence.thicknessTexture).
     * @param value The iridescence thickness texture or null
     */
    public set thinFilmThicknessTexture(value: Nullable<BaseTexture>) {
        this._material.iridescence.thicknessTexture = value;
    }

    // ========================================
    // UNLIT MATERIALS
    // ========================================

    /**
     * Sets whether the material is unlit.
     * @param value True to make the material unlit
     */
    public set unlit(value: boolean) {
        this._material.unlit = value;
    }

    // ========================================
    // GEOMETRY PARAMETERS
    // ========================================

    /**
     * Sets the geometry opacity (mapped to PBR alpha).
     * @param value The opacity value (0-1)
     */
    public set geometryOpacity(value: number) {
        this._material.alpha = value;
    }

    /**
     * Gets the geometry opacity.
     * @returns The opacity value (0-1)
     */
    public get geometryOpacity(): number {
        return this._material.alpha;
    }

    /**
     * Sets the geometry normal texture (mapped to PBR bumpTexture).
     * Also forces irradiance computation in fragment shader for better lighting.
     * @param value The normal texture or null
     */
    public set geometryNormalTexture(value: Nullable<BaseTexture>) {
        this._material.bumpTexture = value;
        this._material.forceIrradianceInFragment = true;
    }

    /**
     * Gets the geometry normal texture.
     * @returns The normal texture or null
     */
    public get geometryNormalTexture(): Nullable<BaseTexture> {
        return this._material.bumpTexture;
    }

    /**
     * Sets the normal map inversions for the material.
     * @param invertX Whether to invert the normal map on the X axis
     * @param invertY Whether to invert the normal map on the Y axis
     */
    public setNormalMapInversions(invertX: boolean, invertY: boolean): void {
        this._material.invertNormalMapX = invertX;
        this._material.invertNormalMapY = invertY;
    }

    /**
     * Sets the geometry coat normal texture (mapped to PBR clearCoat.bumpTexture).
     * Automatically enables clear coat.
     * @param value The coat normal texture or null
     */
    public set geometryCoatNormalTexture(value: Nullable<BaseTexture>) {
        this._material.clearCoat.isEnabled = true;
        this._material.clearCoat.bumpTexture = value;
    }

    /**
     * Gets the geometry coat normal texture.
     * @returns The coat normal texture or null
     */
    public get geometryCoatNormalTexture(): Nullable<BaseTexture> {
        return this._material.clearCoat.bumpTexture;
    }

    /**
     * Sets the geometry coat normal texture scale.
     * @param value The scale value for the coat normal texture
     */
    public set geometryCoatNormalTextureScale(value: number) {
        if (this._material.clearCoat.bumpTexture) {
            this._material.clearCoat.bumpTexture.level = value;
        }
    }
}
