import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import type { Color3 } from "core/Maths/math.color";

/**
 * Interface for material loading adapters that provides a unified OpenPBR-like interface
 * for both OpenPBR and PBR materials, eliminating conditional branches in extensions.
 */
export interface IMaterialLoadingAdapter {
    /**
     * Gets the underlying material
     */
    readonly material: Material;

    /**
     * Whether the material should be treated as unlit
     */
    isUnlit: boolean;

    // ========================================
    // CULLING PROPERTIES
    // ========================================

    /**
     * Sets/gets the back face culling
     */
    backFaceCulling: boolean;

    /**
     * Sets/gets the two sided lighting
     */
    twoSidedLighting: boolean;

    // ========================================
    // ALPHA PROPERTIES
    // ========================================

    /**
     * Sets/gets the alpha cutoff value (used for alpha test mode)
     */
    alphaCutOff: number;

    /**
     * Sets/gets whether to use alpha from albedo/base color texture
     */
    useAlphaFromBaseColorTexture: boolean;

    /**
     * Sets/Gets whether the transparency is treated as alpha coverage
     */
    transparencyAsAlphaCoverage: boolean;

    // ========================================
    // BASE PARAMETERS
    // ========================================

    /**
     * Sets/gets the base color (OpenPBR: baseColor, PBR: albedoColor)
     */
    baseColor: Color3;

    /**
     * Sets/gets the base color texture (OpenPBR: baseColorTexture, PBR: albedoTexture)
     */
    baseColorTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the base diffuse roughness (OpenPBR: baseDiffuseRoughness, PBR: baseDiffuseRoughness)
     */
    baseDiffuseRoughness: number;

    /**
     * Sets/gets the base diffuse roughness texture (OpenPBR: baseDiffuseRoughnessTexture, PBR: baseDiffuseRoughnessTexture)
     */
    baseDiffuseRoughnessTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the base metalness (OpenPBR: baseMetalness, PBR: metallic)
     */
    baseMetalness: number;

    /**
     * Sets/gets the base metalness texture (OpenPBR: baseMetalnessTexture, PBR: metallicTexture)
     */
    baseMetalnessTexture: Nullable<BaseTexture>;

    /**
     * Sets whether to use roughness from metallic texture green channel
     */
    useRoughnessFromMetallicTextureGreen: boolean;

    /**
     * Sets whether to use metallic from metallic texture blue channel
     */
    useMetallicFromMetallicTextureBlue: boolean;

    // ========================================
    // SPECULAR PARAMETERS
    // ========================================

    /**
     * Configures specular properties and enables OpenPBR BRDF model for edge color support
     * @param enableEdgeColor - Whether to enable edge color support
     */
    enableSpecularEdgeColor(enableEdgeColor?: boolean): void;

    /**
     * Sets/gets the specular weight (OpenPBR: specularWeight, PBR: metallicF0Factor)
     */
    specularWeight: number;

    /**
     * Sets/gets the specular weight texture (OpenPBR: specularWeightTexture, PBR: metallicReflectanceTexture)
     */
    specularWeightTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the specular color (OpenPBR: specularColor, PBR: reflectance)
     */
    specularColor: Color3;

    /**
     * Sets/gets the specular color texture (OpenPBR: specularColorTexture, PBR: reflectanceTexture)
     */
    specularColorTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the specular roughness (OpenPBR: specularRoughness, PBR: roughness)
     */
    specularRoughness: number;

    /**
     * Sets/gets the specular roughness texture
     */
    specularRoughnessTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the specular IOR (OpenPBR: specularIor, PBR: indexOfRefraction)
     */
    specularIor: number;

    // ========================================
    // EMISSION PARAMETERS
    // ========================================

    /**
     * Sets/gets the emissive color (OpenPBR: emissionColor, PBR: emissiveColor)
     */
    emissionColor: Color3;

    /**
     * Sets/gets the emissive luminance (OpenPBR: emissionLuminance, PBR: emissiveIntensity)
     */
    emissionLuminance: number;

    /**
     * Sets/gets the emissive texture
     */
    emissionColorTexture: Nullable<BaseTexture>;

    // ========================================
    // AMBIENT OCCLUSION
    // ========================================

    /**
     * Sets/gets the ambient occlusion texture (OpenPBR: ambientOcclusionTexture, PBR: ambientTexture)
     */
    ambientOcclusionTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the ambient occlusion texture strength/level
     */
    ambientOcclusionTextureStrength: number;

    // ========================================
    // COAT PARAMETERS
    // ========================================

    /**
     * Configures clear coat for PBR material
     */
    configureCoat(): void;

    /**
     * Sets/gets the coat weight (OpenPBR: coatWeight, PBR: clearCoat.intensity)
     */
    coatWeight: number;

    /**
     * Sets/gets the coat weight texture (OpenPBR: coatWeightTexture, PBR: clearCoat.texture)
     */
    coatWeightTexture: Nullable<BaseTexture>;

    /**
     * Sets the coat color (OpenPBR: coatColor, no PBR equivalent)
     */
    coatColor: Color3;

    /**
     * Sets the coat color texture (OpenPBR: coatColorTexture, no PBR equivalent)
     */
    coatColorTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the coat roughness (OpenPBR: coatRoughness, PBR: clearCoat.roughness)
     */
    coatRoughness: number;

    /**
     * Sets/gets the coat roughness texture (OpenPBR: coatRoughnessTexture, PBR: clearCoat.textureRoughness)
     */
    coatRoughnessTexture: Nullable<BaseTexture>;

    /**
     * Sets the coat index of refraction (IOR)
     */
    coatIor: number;

    /**
     * Sets the coat darkening (OpenPBR: coatDarkening, no PBR equivalent)
     */
    coatDarkening: number;

    /**
     * Sets the coat darkening texture (OpenPBR: coatDarkeningTexture, no PBR equivalent)
     */
    coatDarkeningTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the coat roughness anisotropy (OpenPBR: coatRoughnessAnisotropy, PBR: clearCoat.anisotropy.intensity)
     */
    coatRoughnessAnisotropy: number;

    /**
     * Sets the coat tangent angle for anisotropy (OpenPBR: geometryCoatTangentAngle, PBR: clearCoat.anisotropy.angle)
     */
    geometryCoatTangentAngle: number;

    /**
     * Sets the coat tangent texture for anisotropy (OpenPBR: geometryCoatTangentTexture, PBR: clearCoat.anisotropy.texture)
     */
    geometryCoatTangentTexture: Nullable<BaseTexture>;

    // ========================================
    // TRANSMISSION LAYER
    // ========================================

    /**
     * Sets the transmission weight (OpenPBR: transmissionWeight, PBR: subSurface.refractionIntensity)
     */
    transmissionWeight: number;

    /**
     * Sets the transmission weight texture (OpenPBR: transmissionWeightTexture, PBR: subSurface.refractionIntensityTexture)
     */
    transmissionWeightTexture: Nullable<BaseTexture>;

    /**
     * Sets the attenuation distance (OpenPBR: attenuationDistance, PBR: subSurface.volumeIndexOfRefraction)
     */
    transmissionDepth: number;

    /**
     * Sets the attenuation color (OpenPBR: attenuationColor, PBR: subSurface.tintColor)
     */
    transmissionColor: Color3;

    /**
     * Sets the dispersion Abbe number
     */
    transmissionDispersionAbbeNumber: number;

    /**
     * Configures transmission for thin-surface transmission (KHR_materials_transmission)
     */
    configureTransmission(): void;

    // ========================================
    // VOLUME PROPERTIES
    // ========================================

    /**
     * Sets the thickness texture (OpenPBR: thicknessTexture, PBR: subSurface.thicknessTexture)
     */
    volumeThicknessTexture: Nullable<BaseTexture>;

    /**
     * Sets the thickness factor (OpenPBR: thickness, PBR: subSurface.maximumThickness)
     */
    volumeThickness: number;

    // ========================================
    // SUBSURFACE PROPERTIES (Subsurface Scattering)
    // ========================================

    /**
     * Configures subsurface properties for PBR material
     */
    configureSubsurface(): void;

    /**
     * Sets/gets the subsurface weight
     */
    subsurfaceWeight: number;

    /**
     * Sets/gets the subsurface weight texture
     */
    subsurfaceWeightTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the subsurface color (OpenPBR: subsurfaceColor, PBR: subSurface.tintColor)
     */
    subsurfaceColor: Color3;

    /**
     * Sets/gets the subsurface color texture (OpenPBR: subsurfaceColorTexture, PBR: subSurface.tintColorTexture)
     */
    subsurfaceColorTexture: Nullable<BaseTexture>;

    // ========================================
    // FUZZ LAYER (Sheen)
    // ========================================

    /**
     * Configures initial settings for fuzz for material.
     */
    configureFuzz(): void;

    /**
     * Sets the fuzz weight (OpenPBR: fuzzWeight, PBR: fuzz.intensity)
     */
    fuzzWeight: number;

    /**
     * Sets the fuzz color (OpenPBR: fuzzColor, PBR: fuzz.color)
     */
    fuzzColor: Color3;

    /**
     * Sets the fuzz color texture (OpenPBR: fuzzColorTexture, PBR: fuzz.texture)
     */
    fuzzColorTexture: Nullable<BaseTexture>;

    /**
     * Sets the fuzz roughness (OpenPBR: fuzzRoughness, PBR: fuzz.roughness)
     */
    fuzzRoughness: number;

    /**
     * Sets the fuzz roughness texture (OpenPBR: fuzzRoughnessTexture, PBR: fuzz.textureRoughness)
     */
    fuzzRoughnessTexture: Nullable<BaseTexture>;

    // ========================================
    // ANISOTROPY
    // ========================================

    /**
     * Sets/gets the specular roughness anisotropy (OpenPBR: specularRoughnessAnisotropy, PBR: anisotropy.intensity)
     */
    specularRoughnessAnisotropy: number;

    /**
     * Sets the anisotropy rotation (OpenPBR: anisotropyRotation, PBR: anisotropy.angle)
     */
    geometryTangentAngle: number;

    /**
     * Sets/gets the anisotropy texture (OpenPBR: geometryTangentTexture, PBR: anisotropy.texture)
     */
    geometryTangentTexture: Nullable<BaseTexture>;

    /**
     * Configures glTF-style anisotropy for OpenPBR materials
     * @param useGltfStyle - Whether to use glTF-style anisotropy (default: true)
     */
    configureGltfStyleAnisotropy(useGltfStyle?: boolean): void;

    // ========================================
    // THIN FILM IRIDESCENCE
    // ========================================

    /**
     * Sets the thin film weight
     */
    thinFilmWeight: number;

    /**
     * Sets the thin film IOR
     */
    thinFilmIor: number;

    /**
     * Sets the thin film thickness minimum
     */
    thinFilmThicknessMinimum: number;

    /**
     * Sets the thin film thickness maximum
     */
    thinFilmThicknessMaximum: number;

    /**
     * Sets the thin film iridescence texture
     */
    thinFilmWeightTexture: Nullable<BaseTexture>;

    /**
     * Sets the thin film thickness texture
     */
    thinFilmThicknessTexture: Nullable<BaseTexture>;

    // ========================================
    // UNLIT MATERIALS
    // ========================================

    /**
     * Sets the unlit flag (OpenPBR: unlit, PBR: unlit)
     */
    unlit: boolean;

    // ========================================
    // GEOMETRY PARAMETERS
    // ========================================

    /**
     * Sets/gets the geometry opacity (OpenPBR: geometryOpacity, PBR: alpha)
     */
    geometryOpacity: number;

    /**
     * Sets/gets the geometry normal texture (OpenPBR: geometryNormalTexture, PBR: bumpTexture)
     */
    geometryNormalTexture: Nullable<BaseTexture>;

    /**
     * Sets the normal map inversions for PBR material only
     * @param invertX - Whether to invert the normal map on the X axis
     * @param invertY - Whether to invert the normal map on the Y axis
     */
    setNormalMapInversions(invertX: boolean, invertY: boolean): void;

    /**
     * Sets/gets the coat normal texture (OpenPBR: geometryCoatNormalTexture, PBR: clearCoat.bumpTexture)
     */
    geometryCoatNormalTexture: Nullable<BaseTexture>;

    /**
     * Sets the coat normal texture scale
     */
    geometryCoatNormalTextureScale: number;
}
