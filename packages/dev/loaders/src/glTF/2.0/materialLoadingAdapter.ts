import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import type { Color3 } from "core/Maths/math.color";
import type { Vector3 } from "core/Maths/math.vector";

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
     * Sets/gets the base color
     */
    baseColor: Color3;

    /**
     * Sets/gets the base color texture
     */
    baseColorTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the base diffuse roughness
     */
    baseDiffuseRoughness: number;

    /**
     * Sets/gets the base diffuse roughness texture
     */
    baseDiffuseRoughnessTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the base metalness
     */
    baseMetalness: number;

    /**
     * Sets/gets the base metalness texture
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
     * Sets/gets the specular weight
     */
    specularWeight: number;

    /**
     * Sets/gets the specular weight texture
     */
    specularWeightTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the specular color
     */
    specularColor: Color3;

    /**
     * Sets/gets the specular color texture
     */
    specularColorTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the specular roughness
     */
    specularRoughness: number;

    /**
     * Sets/gets the specular roughness texture
     */
    specularRoughnessTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the specular IOR
     */
    specularIor: number;

    // ========================================
    // EMISSION PARAMETERS
    // ========================================

    /**
     * Sets/gets the emissive color
     */
    emissionColor: Color3;

    /**
     * Sets/gets the emissive luminance
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
     * Sets/gets the ambient occlusion texture
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
     * Sets/gets the coat weight
     */
    coatWeight: number;

    /**
     * Sets/gets the coat weight texture
     */
    coatWeightTexture: Nullable<BaseTexture>;

    /**
     * Sets the coat color
     */
    coatColor: Color3;

    /**
     * Sets the coat color texture
     */
    coatColorTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the coat roughness
     */
    coatRoughness: number;

    /**
     * Sets/gets the coat roughness texture
     */
    coatRoughnessTexture: Nullable<BaseTexture>;

    /**
     * Sets the coat index of refraction (IOR)
     */
    coatIor: number;

    /**
     * Sets the coat darkening
     */
    coatDarkening: number;

    /**
     * Sets the coat darkening texture
     */
    coatDarkeningTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the coat roughness anisotropy
     */
    coatRoughnessAnisotropy: number;

    /**
     * Sets the coat tangent angle for anisotropy
     */
    geometryCoatTangentAngle: number;

    /**
     * Sets the coat tangent texture for anisotropy
     */
    geometryCoatTangentTexture: Nullable<BaseTexture>;

    // ========================================
    // TRANSMISSION LAYER
    // ========================================

    /**
     * Sets the transmission weight
     */
    transmissionWeight: number;

    /**
     * Sets the transmission weight texture
     */
    transmissionWeightTexture: Nullable<BaseTexture>;

    /**
     * Sets the attenuation distance
     */
    transmissionDepth: number;

    /**
     * Sets the attenuation color
     */
    transmissionColor: Color3;

    /**
     * Sets the scattering coefficient
     */
    transmissionScatter: Color3;

    /**
     * Sets the scattering anisotropy (-1 to 1)
     */
    transmissionScatterAnisotropy: number;

    /**
     * Sets the dispersion Abbe number
     */
    transmissionDispersionAbbeNumber: number;

    /**
     * Sets the dispersion scale
     */
    transmissionDispersionScale: number;

    /**
     * The refraction background texture
     */
    refractionBackgroundTexture: Nullable<BaseTexture>;

    /**
     * Configures transmission for thin-surface transmission (KHR_materials_transmission)
     */
    configureTransmission(): void;

    // ========================================
    // VOLUME PROPERTIES
    // ========================================

    /**
     * Sets the thickness texture
     */
    volumeThicknessTexture: Nullable<BaseTexture>;

    /**
     * Sets the thickness factor
     */
    volumeThickness: number;

    // ========================================
    // SUBSURFACE PROPERTIES (Subsurface Scattering)
    // ========================================

    /**
     * Configures subsurface properties
     */
    configureSubsurface(): void;

    /**
     * @internal
     * Sets/gets the extinction coefficient
     */
    extinctionCoefficient: Vector3;

    /**
     * Sets/gets the subsurface weight
     */
    subsurfaceWeight: number;

    /**
     * Sets/gets the subsurface weight texture
     */
    subsurfaceWeightTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the subsurface color
     */
    subsurfaceColor: Color3;

    /**
     * Sets/gets the subsurface color texture
     */
    subsurfaceColorTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the surface tint of the material (when using subsurface scattering)
     */
    subsurfaceConstantTint: Color3;

    /**
     * Sets/gets the surface tint texture of the material (when using subsurface scattering)
     */
    subsurfaceConstantTintTexture: Nullable<BaseTexture>;

    /**
     * Sets/gets the subsurface radius (used for subsurface scattering)
     */
    subsurfaceRadius: number;

    /**
     * Sets/gets the subsurface radius scale (used for subsurface scattering)
     */
    subsurfaceRadiusScale: Color3;

    /**
     * Sets/gets the subsurface scattering anisotropy
     */
    subsurfaceScatterAnisotropy: number;

    // ========================================
    // FUZZ LAYER (Sheen)
    // ========================================

    /**
     * Configures initial settings for fuzz for material.
     */
    configureFuzz(): void;

    /**
     * Sets the fuzz weight
     */
    fuzzWeight: number;

    /**
     * Sets the fuzz weight texture
     */
    fuzzWeightTexture: Nullable<BaseTexture>;

    /**
     * Sets the fuzz color
     */
    fuzzColor: Color3;

    /**
     * Sets the fuzz color texture
     */
    fuzzColorTexture: Nullable<BaseTexture>;

    /**
     * Sets the fuzz roughness
     */
    fuzzRoughness: number;

    /**
     * Sets the fuzz roughness texture
     */
    fuzzRoughnessTexture: Nullable<BaseTexture>;

    // ========================================
    // ANISOTROPY
    // ========================================

    /**
     * Sets/gets the specular roughness anisotropy
     */
    specularRoughnessAnisotropy: number;

    /**
     * Sets the anisotropy rotation
     */
    geometryTangentAngle: number;

    /**
     * Sets/gets the anisotropy texture
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
     * Sets the unlit flag
     */
    unlit: boolean;

    // ========================================
    // GEOMETRY PARAMETERS
    // ========================================

    /**
     * Sets/gets the geometry opacity
     */
    geometryOpacity: number;

    /**
     * Sets/gets the geometry normal texture
     */
    geometryNormalTexture: Nullable<BaseTexture>;

    /**
     * Sets the normal map inversions for PBR material only
     * @param invertX - Whether to invert the normal map on the X axis
     * @param invertY - Whether to invert the normal map on the Y axis
     */
    setNormalMapInversions(invertX: boolean, invertY: boolean): void;

    /**
     * Sets/gets the coat normal texture
     */
    geometryCoatNormalTexture: Nullable<BaseTexture>;

    /**
     * Sets the coat normal texture scale
     */
    geometryCoatNormalTextureScale: number;
}
