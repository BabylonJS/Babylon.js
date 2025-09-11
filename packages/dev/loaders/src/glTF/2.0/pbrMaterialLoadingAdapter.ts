import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import type { Color3 } from "core/Maths/math.color";
import type { Vector2 } from "core/Maths/math.vector";
import { Constants } from "core/Engines/constants";
import type { IMaterialLoadingAdapter } from "./iMaterialLoadingAdapter";

/**
 * Material Loading Adapter for PBR materials that provides a unified OpenPBR-like interface.
 */
export class PBRMaterialLoadingAdapter implements IMaterialLoadingAdapter {
    private _material: PBRMaterial;

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
    public set useAlphaFromAlbedoTexture(value: boolean) {
        this._material.useAlphaFromAlbedoTexture = value;
    }

    /**
     * Gets whether alpha is used from the albedo texture.
     * @returns True if using alpha from albedo texture
     */
    public get useAlphaFromAlbedoTexture(): boolean {
        return this._material.useAlphaFromAlbedoTexture;
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
     * Sets the coat darkening value.
     * Note: PBR doesn't have a direct coat darkening property, so this is a no-op.
     * @param value The coat darkening value (ignored for PBR)
     */
    public set coatDarkening(value: number) {
        // PBR doesn't have a coat darkening property
    }

    // ========================================
    // TRANSMISSION LAYER
    // ========================================

    /**
     * Sets the transmission weight (mapped to PBR subSurface.refractionIntensity).
     * Enables refraction when value > 0.
     * @param value The transmission weight value (0-1)
     */
    public set transmissionWeight(value: number) {
        this._material.subSurface.isRefractionEnabled = value > 0;
        this._material.subSurface.refractionIntensity = value;
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
     * Gets the transmission weight.
     * @returns The transmission weight value
     */
    public get transmissionWeight(): number {
        return this._material.subSurface.refractionIntensity;
    }

    /**
     * Gets whether transmission is enabled.
     * @returns True if transmission is enabled
     */
    public get isTransmissionEnabled(): boolean {
        return this._material.subSurface.isRefractionEnabled;
    }

    /**
     * Gets whether subsurface scattering is enabled.
     * @returns True if subsurface scattering is enabled
     */
    public get isSubsurfaceEnabled(): boolean {
        return this._material.subSurface.isTranslucencyEnabled;
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
    // VOLUME PROPERTIES (Subsurface Scattering)
    // ========================================

    /**
     * Sets the attenuation distance for volume scattering.
     * Note: PBR uses an inverted representation, so this converts the distance to a volume IOR approximation.
     * @param value The attenuation distance value
     */
    public set attenuationDistance(value: number) {
        this._material.subSurface.isRefractionEnabled = true;
        // PBR uses an inverted representation for attenuation distance
        if (value === Number.POSITIVE_INFINITY || value === 0) {
            this._material.subSurface.volumeIndexOfRefraction = 1;
        } else {
            // This is an approximation to convert distance to a factor
            this._material.subSurface.volumeIndexOfRefraction = 1 + 1 / value;
        }
    }

    /**
     * Sets the attenuation color (mapped to PBR subSurface.tintColor).
     * Automatically enables refraction.
     * @param value The attenuation color as a Color3
     */
    public set attenuationColor(value: Color3) {
        this._material.subSurface.isRefractionEnabled = true;
        this._material.subSurface.tintColor = value;
    }

    /**
     * Sets the thickness texture (mapped to PBR subSurface.thicknessTexture).
     * Automatically enables refraction.
     * @param value The thickness texture or null
     */
    public set thicknessTexture(value: Nullable<BaseTexture>) {
        this._material.subSurface.isRefractionEnabled = true;
        this._material.subSurface.thicknessTexture = value;
    }

    /**
     * Sets the thickness factor (mapped to PBR subSurface.maximumThickness).
     * Automatically enables refraction.
     * @param value The thickness value
     */
    public set thickness(value: number) {
        this._material.subSurface.isRefractionEnabled = true;
        this._material.subSurface.maximumThickness = value;
    }

    // ========================================
    // FUZZ LAYER (Sheen)
    // ========================================

    /**
     * Sets the sheen weight (mapped to PBR sheen.intensity).
     * Automatically enables sheen.
     * @param value The sheen weight value
     */
    public set sheenWeight(value: number) {
        this._material.sheen.isEnabled = true;
        this._material.sheen.intensity = value;
    }

    /**
     * Sets the sheen color (mapped to PBR sheen.color).
     * Automatically enables sheen.
     * @param value The sheen color as a Color3
     */
    public set sheenColor(value: Color3) {
        this._material.sheen.isEnabled = true;
        this._material.sheen.color = value;
    }

    /**
     * Sets the sheen color texture (mapped to PBR sheen.texture).
     * Automatically enables sheen.
     * @param value The sheen color texture or null
     */
    public set sheenColorTexture(value: Nullable<BaseTexture>) {
        this._material.sheen.isEnabled = true;
        this._material.sheen.texture = value;
    }

    /**
     * Sets the sheen roughness (mapped to PBR sheen.roughness).
     * Automatically enables sheen.
     * @param value The sheen roughness value (0-1)
     */
    public set sheenRoughness(value: number) {
        this._material.sheen.isEnabled = true;
        this._material.sheen.roughness = value;
    }

    /**
     * Sets the sheen roughness texture (mapped to PBR sheen.textureRoughness).
     * Automatically enables sheen.
     * @param value The sheen roughness texture or null
     */
    public set sheenRoughnessTexture(value: Nullable<BaseTexture>) {
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
    public set anisotropyRotation(value: number) {
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
     * Sets the geometry tangent vector.
     * Note: PBR materials handle this through the angle property, so this is a no-op.
     * @param value The tangent vector (ignored for PBR)
     */
    public set geometryTangent(value: Vector2) {
        // PBR materials don't have a direct equivalent - the angle is handled separately
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
    public set iridescenceWeight(value: number) {
        this._material.iridescence.isEnabled = true;
        this._material.iridescence.intensity = value;
    }

    /**
     * Sets the iridescence IOR (mapped to PBR iridescence.indexOfRefraction).
     * Automatically enables iridescence.
     * @param value The iridescence IOR value
     */
    public set iridescenceIor(value: number) {
        this._material.iridescence.isEnabled = true;
        this._material.iridescence.indexOfRefraction = value;
    }

    /**
     * Sets the iridescence thickness minimum (mapped to PBR iridescence.minimumThickness).
     * Automatically enables iridescence.
     * @param value The minimum thickness value in nanometers
     */
    public set iridescenceThicknessMinimum(value: number) {
        this._material.iridescence.isEnabled = true;
        this._material.iridescence.minimumThickness = value;
    }

    /**
     * Sets the iridescence thickness maximum (mapped to PBR iridescence.maximumThickness).
     * Automatically enables iridescence.
     * @param value The maximum thickness value in nanometers
     */
    public set iridescenceThicknessMaximum(value: number) {
        this._material.iridescence.isEnabled = true;
        this._material.iridescence.maximumThickness = value;
    }

    /**
     * Sets the iridescence texture (mapped to PBR iridescence.texture).
     * Automatically enables iridescence.
     * @param value The iridescence intensity texture or null
     */
    public set iridescenceTexture(value: Nullable<BaseTexture>) {
        this._material.iridescence.isEnabled = true;
        this._material.iridescence.texture = value;
    }

    /**
     * Sets the iridescence thickness texture (mapped to PBR iridescence.thicknessTexture).
     * Automatically enables iridescence.
     * @param value The iridescence thickness texture or null
     */
    public set iridescenceThicknessTexture(value: Nullable<BaseTexture>) {
        this._material.iridescence.isEnabled = true;
        this._material.iridescence.thicknessTexture = value;
    }

    // ========================================
    // DISPERSION
    // ========================================

    /**
     * Sets the transmission dispersion value.
     * Note: PBR doesn't have direct dispersion support, so this stores it as metadata.
     * @param value The dispersion value (stored as metadata)
     */
    public set transmissionDispersion(value: number) {
        // PBR doesn't have a direct dispersion property, this would need custom shader modification
        // For now, we'll store it as metadata
        (this._material as any)._dispersion = value;
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
