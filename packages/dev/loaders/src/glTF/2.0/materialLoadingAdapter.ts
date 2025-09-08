import type { Material } from "core/Materials/material";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import type { Color3 } from "core/Maths/math.color";
import type { Vector2 } from "core/Maths/math.vector";
import { Constants } from "core/Engines/constants";
/**
 * Material Loading Adapter that provides a unified OpenPBR-like interface
 * for both OpenPBR and PBR materials, eliminating conditional branches in extensions.
 */
export class MaterialLoadingAdapter {
    private _material: Material;
    private _isOpenPBR: boolean;

    // Static cache to store adapters per material
    private static _AdapterCache = new WeakMap<Material, MaterialLoadingAdapter>();

    /**
     * Creates a new instance of the MaterialLoadingAdapter.
     * @param material - The material to adapt.
     * @param isOpenPBR - Whether this is using OpenPBR material type.
     */
    constructor(material: Material, isOpenPBR: boolean) {
        this._material = material;
        this._isOpenPBR = isOpenPBR;
    }

    /**
     * Gets or creates a MaterialLoadingAdapter for the given material.
     * This ensures that we have a single adapter instance per material.
     * @param material - The material to adapt.
     * @param isOpenPBR - Whether this is using OpenPBR material type.
     * @returns The MaterialLoadingAdapter instance.
     */
    public static GetOrCreate(material: Material, isOpenPBR: boolean): MaterialLoadingAdapter {
        let adapter = this._AdapterCache.get(material);
        if (!adapter) {
            adapter = new MaterialLoadingAdapter(material, isOpenPBR);
            this._AdapterCache.set(material, adapter);
        }
        return adapter;
    }

    /**
     * Gets the underlying material
     */
    public get material(): Material {
        return this._material;
    }

    /**
     * Gets whether this is using OpenPBR
     */
    public get isOpenPBR(): boolean {
        return this._isOpenPBR;
    }

    // ========================================
    // BASE PARAMETERS
    // ========================================

    /**
     * Sets the base color (OpenPBR: baseColor, PBR: albedoColor)
     */
    public set baseColor(value: Color3) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).baseColor = value;
        } else {
            (this._material as PBRMaterial).albedoColor = value;
        }
    }

    /**
     * Gets the base color
     */
    public get baseColor(): Color3 {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).baseColor;
        } else {
            return (this._material as PBRMaterial).albedoColor;
        }
    }

    /**
     * Sets the base color texture (OpenPBR: baseColorTexture, PBR: albedoTexture)
     */
    public set baseColorTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).baseColorTexture = value;
        } else {
            (this._material as PBRMaterial).albedoTexture = value;
        }
    }

    /**
     * Gets the base color texture
     */
    public get baseColorTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).baseColorTexture;
        } else {
            return (this._material as PBRMaterial).albedoTexture;
        }
    }

    /**
     * Sets the base diffuse roughness (OpenPBR: baseDiffuseRoughness, PBR: baseDiffuseRoughness)
     */
    public set baseDiffuseRoughness(value: number) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).baseDiffuseRoughness = value;
        } else {
            (this._material as PBRMaterial).baseDiffuseRoughness = value;
        }
    }

    /**
     * Gets the base diffuse roughness
     */
    public get baseDiffuseRoughness(): number {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).baseDiffuseRoughness;
        } else {
            return (this._material as PBRMaterial).baseDiffuseRoughness ?? 0;
        }
    }

    /**
     * Sets the base diffuse roughness texture (OpenPBR: baseDiffuseRoughnessTexture, PBR: baseDiffuseRoughnessTexture)
     */
    public set baseDiffuseRoughnessTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).baseDiffuseRoughnessTexture = value;
        } else {
            (this._material as PBRMaterial).baseDiffuseRoughnessTexture = value;
        }
    }

    /**
     * Gets the base diffuse roughness texture
     */
    public get baseDiffuseRoughnessTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).baseDiffuseRoughnessTexture;
        } else {
            return (this._material as PBRMaterial).baseDiffuseRoughnessTexture;
        }
    }

    /**
     * Sets the base metalness (OpenPBR: baseMetalness, PBR: metallic)
     */
    public set baseMetalness(value: number) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).baseMetalness = value;
        } else {
            (this._material as PBRMaterial).metallic = value;
        }
    }

    /**
     * Gets the base metalness
     */
    public get baseMetalness(): number {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).baseMetalness;
        } else {
            return (this._material as PBRMaterial).metallic ?? 1;
        }
    }

    /**
     * Sets the base metalness texture (OpenPBR: baseMetalnessTexture, PBR: metallicTexture)
     */
    public set baseMetalnessTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).baseMetalnessTexture = value;
        } else {
            (this._material as PBRMaterial).metallicTexture = value;
        }
    }

    /**
     * Gets the base metalness texture
     */
    public get baseMetalnessTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).baseMetalnessTexture;
        } else {
            return (this._material as PBRMaterial).metallicTexture;
        }
    }

    /**
     * Sets whether to use roughness from metallic texture green channel
     */
    public set useRoughnessFromMetallicTextureGreen(value: boolean) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial)._useRoughnessFromMetallicTextureGreen = value;
        } else {
            (this._material as PBRMaterial).useRoughnessFromMetallicTextureGreen = value;
            (this._material as PBRMaterial).useRoughnessFromMetallicTextureAlpha = !value;
        }
    }

    /**
     * Sets whether to use metallic from metallic texture blue channel
     */
    public set useMetallicFromMetallicTextureBlue(value: boolean) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial)._useMetallicFromMetallicTextureBlue = value;
        } else {
            (this._material as PBRMaterial).useMetallnessFromMetallicTextureBlue = value;
        }
    }

    // ========================================
    // SPECULAR PARAMETERS
    // ========================================

    /**
     * Configures specular properties and enables OpenPBR BRDF model for edge color support
     * @param enableEdgeColor - Whether to enable edge color support
     */
    public configureSpecular(enableEdgeColor: boolean = false) {
        if (!this._isOpenPBR && enableEdgeColor) {
            const material = this._material as PBRMaterial;
            material.brdf.dielectricSpecularModel = Constants.MATERIAL_DIELECTRIC_SPECULAR_MODEL_OPENPBR;
            material.brdf.conductorSpecularModel = Constants.MATERIAL_CONDUCTOR_SPECULAR_MODEL_OPENPBR;
        }
    }

    // ========================================
    // CULLING PROPERTIES
    // ========================================

    /**
     * Sets the back face culling
     */
    public set backFaceCulling(value: boolean) {
        this._material.backFaceCulling = value;
    }

    /**
     * Gets the back face culling
     */
    public get backFaceCulling(): boolean {
        return this._material.backFaceCulling;
    }

    /**
     * Sets the two sided lighting
     */
    public set twoSidedLighting(value: boolean) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).twoSidedLighting = value;
        } else {
            (this._material as PBRMaterial).twoSidedLighting = value;
        }
    }

    /**
     * Gets the two sided lighting
     */
    public get twoSidedLighting(): boolean {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).twoSidedLighting;
        } else {
            return (this._material as PBRMaterial).twoSidedLighting;
        }
    }

    // ========================================
    // ALPHA PROPERTIES
    // ========================================

    /**
     * Sets the alpha cutoff value (used for alpha test mode)
     */
    public set alphaCutOff(value: number) {
        if (!this._isOpenPBR) {
            (this._material as PBRMaterial).alphaCutOff = value;
        }
        // OpenPBR doesn't have a direct equivalent, but could be implemented if needed
    }

    /**
     * Gets the alpha cutoff value
     */
    public get alphaCutOff(): number {
        if (!this._isOpenPBR) {
            return (this._material as PBRMaterial).alphaCutOff;
        }
        return 0.5; // Default value
    }

    /**
     * Sets whether to use alpha from albedo/base color texture
     */
    public set useAlphaFromAlbedoTexture(value: boolean) {
        if (!this._isOpenPBR) {
            (this._material as PBRMaterial).useAlphaFromAlbedoTexture = value;
        }
        // For OpenPBR this is handled differently via baseColorTexture alpha channel
    }

    /**
     * Gets whether alpha is used from albedo/base color texture
     */
    public get useAlphaFromAlbedoTexture(): boolean {
        if (!this._isOpenPBR) {
            return (this._material as PBRMaterial).useAlphaFromAlbedoTexture;
        }
        return false;
    }

    /**
     * Sets the specular weight (OpenPBR: specularWeight, PBR: metallicF0Factor)
     */
    public set specularWeight(value: number) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).specularWeight = value;
        } else {
            (this._material as PBRMaterial).metallicF0Factor = value;
        }
    }

    /**
     * Gets the specular weight
     */
    public get specularWeight(): number {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).specularWeight;
        } else {
            return (this._material as PBRMaterial).metallicF0Factor ?? 1;
        }
    }

    /**
     * Sets the specular weight texture (OpenPBR: specularWeightTexture, PBR: metallicReflectanceTexture)
     */
    public set specularWeightTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            const mat = this._material as OpenPBRMaterial;
            if (mat.specularColorTexture === value) {
                mat.specularWeightTexture = null;
                mat._useSpecularWeightFromSpecularColorTexture = true;
                mat._useSpecularWeightFromAlpha = true;
            } else {
                mat.specularWeightTexture = value;
            }
        } else {
            const material = this._material as PBRMaterial;
            if (value) {
                material.metallicReflectanceTexture = value;
                material.useOnlyMetallicFromMetallicReflectanceTexture = true;
            } else {
                material.metallicReflectanceTexture = null;
                material.useOnlyMetallicFromMetallicReflectanceTexture = false;
            }
        }
    }

    /**
     * Gets the specular weight texture
     */
    public get specularWeightTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).specularWeightTexture;
        } else {
            return (this._material as PBRMaterial).metallicReflectanceTexture;
        }
    }

    /**
     * Sets the specular color (OpenPBR: specularColor, PBR: reflectance)
     */
    public set specularColor(value: Color3) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).specularColor = value;
        } else {
            (this._material as PBRMaterial).metallicReflectanceColor = value;
        }
    }

    /**
     * Gets the specular color
     */
    public get specularColor(): Color3 {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).specularColor;
        } else {
            return (this._material as PBRMaterial).metallicReflectanceColor;
        }
    }

    /**
     * Sets the specular color texture (OpenPBR: specularColorTexture, PBR: reflectanceTexture)
     */
    public set specularColorTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            const mat = this._material as OpenPBRMaterial;
            mat.specularColorTexture = value;
            if (mat.specularWeightTexture === mat.specularColorTexture) {
                mat.specularWeightTexture = null;
                mat._useSpecularWeightFromSpecularColorTexture = true;
                mat._useSpecularWeightFromAlpha = true;
            }
        } else {
            (this._material as PBRMaterial).reflectanceTexture = value;
        }
    }

    /**
     * Gets the specular color texture
     */
    public get specularColorTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).specularColorTexture;
        } else {
            return (this._material as PBRMaterial).reflectanceTexture;
        }
    }

    /**
     * Sets the specular roughness (OpenPBR: specularRoughness, PBR: roughness)
     */
    public set specularRoughness(value: number) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).specularRoughness = value;
        } else {
            (this._material as PBRMaterial).roughness = value;
        }
    }

    /**
     * Gets the specular roughness
     */
    public get specularRoughness(): number {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).specularRoughness;
        } else {
            return (this._material as PBRMaterial).roughness ?? 1;
        }
    }

    /**
     * Sets the specular roughness texture
     * For OpenPBR, this is a separate texture. For PBR, it shares with metallic texture.
     */
    public set specularRoughnessTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).specularRoughnessTexture = value;
        } else {
            // PBR uses the same texture for both metallic and roughness
            if (!this.baseMetalnessTexture) {
                (this._material as PBRMaterial).metallicTexture = value;
            }
        }
    }

    /**
     * Gets the specular roughness texture
     */
    public get specularRoughnessTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).specularRoughnessTexture;
        } else {
            return (this._material as PBRMaterial).metallicTexture;
        }
    }

    /**
     * Sets the specular IOR (OpenPBR: specularIor, PBR: indexOfRefraction)
     */
    public set specularIor(value: number) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).specularIor = value;
        } else {
            (this._material as PBRMaterial).indexOfRefraction = value;
        }
    }

    /**
     * Gets the specular IOR
     */
    public get specularIor(): number {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).specularIor;
        } else {
            return (this._material as PBRMaterial).indexOfRefraction;
        }
    }

    // ========================================
    // EMISSION PARAMETERS
    // ========================================

    /**
     * Sets the emissive color (OpenPBR: emissionColor, PBR: emissiveColor)
     */
    public set emissionColor(value: Color3) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).emissionColor = value;
        } else {
            (this._material as PBRMaterial).emissiveColor = value;
        }
    }

    /**
     * Gets the emissive color
     */
    public get emissionColor(): Color3 {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).emissionColor;
        } else {
            return (this._material as PBRMaterial).emissiveColor;
        }
    }

    /**
     * Sets the emissive luminance (OpenPBR: emissionLuminance, PBR: emissiveIntensity)
     */
    public set emissionLuminance(value: number) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).emissionLuminance = value;
        } else {
            (this._material as PBRMaterial).emissiveIntensity = value;
        }
    }

    /**
     * Gets the emissive luminance
     */
    public get emissionLuminance(): number {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).emissionLuminance;
        } else {
            return (this._material as PBRMaterial).emissiveIntensity;
        }
    }

    /**
     * Sets the emissive texture
     */
    public set emissionColorTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).emissionColorTexture = value;
        } else {
            (this._material as PBRMaterial).emissiveTexture = value;
        }
    }

    /**
     * Gets the emissive texture
     */
    public get emissionColorTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).emissionColorTexture;
        } else {
            return (this._material as PBRMaterial).emissiveTexture;
        }
    }

    // ========================================
    // AMBIENT OCCLUSION
    // ========================================

    /**
     * Sets the ambient occlusion texture (OpenPBR: ambientOcclusionTexture, PBR: ambientTexture)
     */
    public set ambientOcclusionTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).ambientOcclusionTexture = value;
        } else {
            const material = this._material as PBRMaterial;
            material.ambientTexture = value;
            if (value) {
                material.useAmbientInGrayScale = true;
            }
        }
    }

    /**
     * Gets the ambient occlusion texture
     */
    public get ambientOcclusionTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).ambientOcclusionTexture;
        } else {
            return (this._material as PBRMaterial).ambientTexture;
        }
    }

    /**
     * Sets the ambient occlusion texture strength/level
     */
    public set ambientOcclusionTextureStrength(value: number) {
        if (this._isOpenPBR) {
            const texture = (this._material as OpenPBRMaterial).ambientOcclusionTexture;
            if (texture) {
                texture.level = value;
            }
        } else {
            (this._material as PBRMaterial).ambientTextureStrength = value;
        }
    }

    /**
     * Gets the ambient occlusion texture strength/level
     */
    public get ambientOcclusionTextureStrength(): number {
        if (this._isOpenPBR) {
            const texture = (this._material as OpenPBRMaterial).ambientOcclusionTexture;
            return texture?.level ?? 1.0;
        } else {
            return (this._material as PBRMaterial).ambientTextureStrength ?? 1.0;
        }
    }

    // ========================================
    // COAT PARAMETERS
    // ========================================

    /**
     * Configures clear coat for PBR material
     */
    public configureCoat() {
        if (!this._isOpenPBR) {
            const material = this._material as PBRMaterial;
            material.clearCoat.isEnabled = true;
            material.clearCoat.useRoughnessFromMainTexture = false;
            material.clearCoat.remapF0OnInterfaceChange = false;
        }
    }

    /**
     * Sets the coat weight (OpenPBR: coatWeight, PBR: clearCoat.intensity)
     */
    public set coatWeight(value: number) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).coatWeight = value;
        } else {
            const material = this._material as PBRMaterial;
            material.clearCoat.isEnabled = true;
            material.clearCoat.intensity = value;
        }
    }

    /**
     * Gets the coat weight
     */
    public get coatWeight(): number {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).coatWeight;
        } else {
            return (this._material as PBRMaterial).clearCoat.intensity;
        }
    }

    /**
     * Sets the coat weight texture (OpenPBR: coatWeightTexture, PBR: clearCoat.texture)
     */
    public set coatWeightTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).coatWeightTexture = value;
        } else {
            const material = this._material as PBRMaterial;
            material.clearCoat.isEnabled = true;
            material.clearCoat.texture = value;
        }
    }

    /**
     * Gets the coat weight texture
     */
    public get coatWeightTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).coatWeightTexture;
        } else {
            return (this._material as PBRMaterial).clearCoat.texture;
        }
    }

    /**
     * Sets the coat color (OpenPBR: coatColor, no PBR equivalent)
     */
    public set coatColor(value: Color3) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).coatColor = value;
        } else {
            (this._material as PBRMaterial).clearCoat.tintColor = value;
        }
    }

    /**
     * Sets the coat color texture (OpenPBR: coatColorTexture, no PBR equivalent)
     */
    public set coatColorTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).coatColorTexture = value;
        } else {
            (this._material as PBRMaterial).clearCoat.tintTexture = value;
        }
    }

    /**
     * Sets the coat roughness (OpenPBR: coatRoughness, PBR: clearCoat.roughness)
     */
    public set coatRoughness(value: number) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).coatRoughness = value;
        } else {
            const material = this._material as PBRMaterial;
            material.clearCoat.isEnabled = true;
            material.clearCoat.roughness = value;
        }
    }

    /**
     * Gets the coat roughness
     */
    public get coatRoughness(): number {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).coatRoughness;
        } else {
            return (this._material as PBRMaterial).clearCoat.roughness ?? 0;
        }
    }

    /**
     * Sets the coat roughness texture (OpenPBR: coatRoughnessTexture, PBR: clearCoat.textureRoughness)
     */
    public set coatRoughnessTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).coatRoughnessTexture = value;
        } else {
            const material = this._material as PBRMaterial;
            material.clearCoat.isEnabled = true;
            material.clearCoat.useRoughnessFromMainTexture = false;
            material.clearCoat.textureRoughness = value;
        }
    }

    /**
     * Gets the coat roughness texture
     */
    public get coatRoughnessTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).coatRoughnessTexture;
        } else {
            return (this._material as PBRMaterial).clearCoat.textureRoughness;
        }
    }

    /**
     * Sets the coat darkening (OpenPBR: coatDarkening, no PBR equivalent)
     */
    public set coatDarkening(value: number) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).coatDarkening = value;
        }
        // PBR doesn't have a coat darkening property
    }

    // ========================================
    // TRANSMISSION LAYER (OpenPBR Section 4.3)
    // ========================================

    /**
     * Sets the transmission weight (OpenPBR: transmissionWeight, PBR: subSurface.refractionIntensity)
     */
    public set transmissionWeight(value: number) {
        if (this._isOpenPBR) {
            // TODO (this._material as OpenPBRMaterial).transmissionWeight = value;
        } else {
            const material = this._material as PBRMaterial;
            material.subSurface.isRefractionEnabled = value > 0;
            material.subSurface.refractionIntensity = value;
        }
    }

    /**
     * Sets the transmission weight texture (OpenPBR: transmissionWeightTexture, PBR: subSurface.refractionIntensityTexture)
     */
    public set transmissionWeightTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            // TODO (this._material as OpenPBRMaterial).transmissionWeightTexture = value;
        } else {
            const material = this._material as PBRMaterial;
            material.subSurface.isRefractionEnabled = true;
            material.subSurface.refractionIntensityTexture = value;
            material.subSurface.useGltfStyleTextures = true;
        }
    }

    /**
     * Gets the transmission weight
     */
    public get transmissionWeight(): number {
        if (this._isOpenPBR) {
            // TODO return (this._material as OpenPBRMaterial).transmissionWeight;
            return 0;
        } else {
            return (this._material as PBRMaterial).subSurface.refractionIntensity;
        }
    }

    /**
     * Checks if transmission/refraction is enabled
     */
    public get isTransmissionEnabled(): boolean {
        if (this._isOpenPBR) {
            // TODO return (this._material as OpenPBRMaterial).transmissionWeight > 0;
            return false;
        } else {
            return (this._material as PBRMaterial).subSurface.isRefractionEnabled;
        }
    }

    /**
     * Checks if translucency/diffuse transmission is enabled
     */
    public get isSubsurfaceEnabled(): boolean {
        if (this._isOpenPBR) {
            // TODO
            // return (this._material as OpenPBRMaterial).transmissionWeight > 0;
            return false;
        } else {
            return (this._material as PBRMaterial).subSurface.isTranslucencyEnabled;
        }
    }

    /**
     * Configures transmission for thin-surface transmission (KHR_materials_transmission)
     */
    public configureTransmission() {
        if (!this._isOpenPBR) {
            const material = this._material as PBRMaterial;
            // Since this extension models thin-surface transmission only, we must make IOR = 1.0
            material.subSurface.volumeIndexOfRefraction = 1.0;
            // Albedo colour will tint transmission.
            material.subSurface.useAlbedoToTintRefraction = true;
            material.subSurface.minimumThickness = 0.0;
            material.subSurface.maximumThickness = 0.0;
        }
    }

    // ========================================
    // VOLUME PROPERTIES (Subsurface Scattering)
    // ========================================

    /**
     * Sets the attenuation distance (OpenPBR: attenuationDistance, PBR: subSurface.volumeIndexOfRefraction)
     */
    public set attenuationDistance(value: number) {
        if (this._isOpenPBR) {
            // (this._material as OpenPBRMaterial).attenuationDistance = value;
        } else {
            const material = this._material as PBRMaterial;
            material.subSurface.isRefractionEnabled = true;
            // PBR uses an inverted representation for attenuation distance
            if (value === Number.POSITIVE_INFINITY || value === 0) {
                material.subSurface.volumeIndexOfRefraction = 1;
            } else {
                // This is an approximation to convert distance to a factor
                material.subSurface.volumeIndexOfRefraction = 1 + 1 / value;
            }
        }
    }

    /**
     * Sets the attenuation color (OpenPBR: attenuationColor, PBR: subSurface.tintColor)
     */
    public set attenuationColor(value: Color3) {
        if (this._isOpenPBR) {
            // (this._material as OpenPBRMaterial).attenuationColor = value;
        } else {
            const material = this._material as PBRMaterial;
            material.subSurface.isRefractionEnabled = true;
            material.subSurface.tintColor = value;
        }
    }

    /**
     * Sets the thickness texture (OpenPBR: thicknessTexture, PBR: subSurface.thicknessTexture)
     */
    public set thicknessTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            // (this._material as OpenPBRMaterial).thicknessTexture = value;
        } else {
            const material = this._material as PBRMaterial;
            material.subSurface.isRefractionEnabled = true;
            material.subSurface.thicknessTexture = value;
        }
    }

    /**
     * Sets the thickness factor (OpenPBR: thickness, PBR: subSurface.maximumThickness)
     */
    public set thickness(value: number) {
        if (this._isOpenPBR) {
            // (this._material as OpenPBRMaterial).thickness = value;
        } else {
            const material = this._material as PBRMaterial;
            material.subSurface.isRefractionEnabled = true;
            material.subSurface.maximumThickness = value;
        }
    }

    // ========================================
    // FUZZ LAYER (OpenPBR Section 4.6)
    // ========================================

    /**
     * Sets the sheen weight (OpenPBR: sheenWeight, PBR: sheen.intensity)
     */
    public set sheenWeight(value: number) {
        if (this._isOpenPBR) {
            // (this._material as OpenPBRMaterial).sheenWeight = value;
        } else {
            const material = this._material as PBRMaterial;
            material.sheen.isEnabled = true;
            material.sheen.intensity = value;
        }
    }

    /**
     * Sets the sheen color (OpenPBR: sheenColor, PBR: sheen.color)
     */
    public set sheenColor(value: Color3) {
        if (this._isOpenPBR) {
            // (this._material as OpenPBRMaterial).sheenColor = value;
        } else {
            const material = this._material as PBRMaterial;
            material.sheen.isEnabled = true;
            material.sheen.color = value;
        }
    }

    /**
     * Sets the sheen color texture (OpenPBR: sheenColorTexture, PBR: sheen.texture)
     */
    public set sheenColorTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            // (this._material as OpenPBRMaterial).sheenColorTexture = value;
        } else {
            const material = this._material as PBRMaterial;
            material.sheen.isEnabled = true;
            material.sheen.texture = value;
        }
    }

    /**
     * Sets the sheen roughness (OpenPBR: sheenRoughness, PBR: sheen.roughness)
     */
    public set sheenRoughness(value: number) {
        if (this._isOpenPBR) {
            // (this._material as OpenPBRMaterial).sheenRoughness = value;
        } else {
            const material = this._material as PBRMaterial;
            material.sheen.isEnabled = true;
            material.sheen.roughness = value;
        }
    }

    /**
     * Sets the sheen roughness texture (OpenPBR: sheenRoughnessTexture, PBR: sheen.textureRoughness)
     */
    public set sheenRoughnessTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            // (this._material as OpenPBRMaterial).sheenRoughnessTexture = value;
        } else {
            const material = this._material as PBRMaterial;
            material.sheen.isEnabled = true;
            material.sheen.textureRoughness = value;
        }
    }

    // ========================================
    // ANISOTROPY (OpenPBR Specular Layer)
    // ========================================

    /**
     * Sets the specular roughness anisotropy (OpenPBR: specularRoughnessAnisotropy, PBR: anisotropy.intensity)
     */
    public set specularRoughnessAnisotropy(value: number) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).specularRoughnessAnisotropy = value;
        } else {
            const material = this._material as PBRMaterial;
            material.anisotropy.isEnabled = true;
            material.anisotropy.intensity = value;
        }
    }

    /**
     * Gets the specular roughness anisotropy
     */
    public get specularRoughnessAnisotropy(): number {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).specularRoughnessAnisotropy;
        } else {
            return (this._material as PBRMaterial).anisotropy.intensity;
        }
    }

    /**
     * Sets the anisotropy rotation (OpenPBR: anisotropyRotation, PBR: anisotropy.angle)
     */
    public set anisotropyRotation(value: number) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).geometryTangentAngle = value;
        } else {
            const material = this._material as PBRMaterial;
            material.anisotropy.isEnabled = true;
            material.anisotropy.angle = value;
        }
    }

    /**
     * Sets the anisotropy texture (OpenPBR: geometryTangentTexture, PBR: anisotropy.texture)
     */
    public set geometryTangentTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            const material = this._material as OpenPBRMaterial;
            material.geometryTangentTexture = value;
            material._useSpecularRoughnessAnisotropyFromTangentTexture = true;
        } else {
            const material = this._material as PBRMaterial;
            material.anisotropy.isEnabled = true;
            material.anisotropy.texture = value;
        }
    }

    /**
     * Gets the geometry tangent texture
     */
    public get geometryTangentTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).geometryTangentTexture;
        } else {
            return (this._material as PBRMaterial).anisotropy.texture;
        }
    }

    /**
     * Sets the geometry tangent (OpenPBR: geometryTangent, calculated from anisotropy angle)
     */
    public set geometryTangent(value: Vector2) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).geometryTangent = value;
        }
        // PBR materials don't have a direct equivalent - the angle is handled separately
    }

    /**
     * Configures glTF-style anisotropy for OpenPBR materials
     * @param useGltfStyle - Whether to use glTF-style anisotropy (default: true)
     */
    public configureGltfStyleAnisotropy(useGltfStyle: boolean = true) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial)._useGltfStyleAnisotropy = useGltfStyle;
        }
    }

    // ========================================
    // THIN FILM IRIDESCENCE
    // ========================================

    /**
     * Sets the iridescence weight (OpenPBR: iridescenceWeight, PBR: iridescence.intensity)
     */
    public set iridescenceWeight(value: number) {
        if (this._isOpenPBR) {
            // TODO (this._material as OpenPBRMaterial).iridescenceWeight = value;
        } else {
            const material = this._material as PBRMaterial;
            material.iridescence.isEnabled = true;
            material.iridescence.intensity = value;
        }
    }

    /**
     * Sets the iridescence IOR (OpenPBR: iridescenceIor, PBR: iridescence.indexOfRefraction)
     */
    public set iridescenceIor(value: number) {
        if (this._isOpenPBR) {
            // TODO (this._material as OpenPBRMaterial).iridescenceIor = value;
        } else {
            const material = this._material as PBRMaterial;
            material.iridescence.isEnabled = true;
            material.iridescence.indexOfRefraction = value;
        }
    }

    /**
     * Sets the iridescence thickness minimum (OpenPBR: iridescenceThicknessMinimum, PBR: iridescence.minimumThickness)
     */
    public set iridescenceThicknessMinimum(value: number) {
        if (this._isOpenPBR) {
            // TODO (this._material as OpenPBRMaterial).iridescenceThicknessMinimum = value;
        } else {
            const material = this._material as PBRMaterial;
            material.iridescence.isEnabled = true;
            material.iridescence.minimumThickness = value;
        }
    }

    /**
     * Sets the iridescence thickness maximum (OpenPBR: iridescenceThicknessMaximum, PBR: iridescence.maximumThickness)
     */
    public set iridescenceThicknessMaximum(value: number) {
        if (this._isOpenPBR) {
            // TODO (this._material as OpenPBRMaterial).iridescenceThicknessMaximum = value;
        } else {
            const material = this._material as PBRMaterial;
            material.iridescence.isEnabled = true;
            material.iridescence.maximumThickness = value;
        }
    }

    /**
     * Sets the iridescence texture (OpenPBR: iridescenceTexture, PBR: iridescence.intensityTexture)
     */
    public set iridescenceTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            // TODO (this._material as OpenPBRMaterial).iridescenceTexture = value;
        } else {
            const material = this._material as PBRMaterial;
            material.iridescence.isEnabled = true;
            material.iridescence.texture = value;
        }
    }

    /**
     * Sets the iridescence thickness texture (OpenPBR: iridescenceThicknessTexture, PBR: iridescence.thicknessTexture)
     */
    public set iridescenceThicknessTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            // TODO (this._material as OpenPBRMaterial).iridescenceThicknessTexture = value;
        } else {
            const material = this._material as PBRMaterial;
            material.iridescence.isEnabled = true;
            material.iridescence.thicknessTexture = value;
        }
    }

    // ========================================
    // DISPERSION
    // ========================================

    /**
     * Sets the dispersion (OpenPBR: transmissionDispersion, PBR custom property)
     */
    public set transmissionDispersion(value: number) {
        if (this._isOpenPBR) {
            // TODO (this._material as OpenPBRMaterial).transmissionDispersion = value;
        } else {
            // PBR doesn't have a direct dispersion property, this would need custom shader modification
            // For now, we'll store it as metadata
            (this._material as any)._dispersion = value;
        }
    }

    // ========================================
    // UNLIT MATERIALS
    // ========================================

    /**
     * Sets the unlit flag (OpenPBR: unlit, PBR: unlit)
     */
    public set unlit(value: boolean) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).unlit = value;
        } else {
            (this._material as PBRMaterial).unlit = value;
        }
    }

    // ========================================
    // GEOMETRY PARAMETERS
    // ========================================

    /**
     * Sets the geometry opacity (OpenPBR: geometryOpacity, PBR: alpha)
     */
    public set geometryOpacity(value: number) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).geometryOpacity = value;
        } else {
            (this._material as PBRMaterial).alpha = value;
        }
    }

    /**
     * Gets the geometry opacity
     */
    public get geometryOpacity(): number {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).geometryOpacity;
        } else {
            return (this._material as PBRMaterial).alpha;
        }
    }

    /**
     * Sets the geometry normal texture (OpenPBR: geometryNormalTexture, PBR: bumpTexture)
     */
    public set geometryNormalTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).geometryNormalTexture = value;
        } else {
            (this._material as PBRMaterial).bumpTexture = value;
            (this._material as PBRMaterial).forceIrradianceInFragment = true;
        }
    }

    /**
     * Gets the geometry normal texture
     */
    public get geometryNormalTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).geometryNormalTexture;
        } else {
            return (this._material as PBRMaterial).bumpTexture;
        }
    }

    /**
     * Sets the normal map inversions for PBR material only
     * @param invertX - Whether to invert the normal map on the X axis
     * @param invertY - Whether to invert the normal map on the Y axis
     */
    public setNormalMapInversions(invertX: boolean, invertY: boolean) {
        if (!this._isOpenPBR) {
            (this._material as PBRMaterial).invertNormalMapX = invertX;
            (this._material as PBRMaterial).invertNormalMapY = invertY;
        }
    }

    /**
     * Sets the coat normal texture (OpenPBR: geometryCoatNormalTexture, PBR: clearCoat.bumpTexture)
     */
    public set geometryCoatNormalTexture(value: Nullable<BaseTexture>) {
        if (this._isOpenPBR) {
            (this._material as OpenPBRMaterial).geometryCoatNormalTexture = value;
        } else {
            const material = this._material as PBRMaterial;
            material.clearCoat.isEnabled = true;
            material.clearCoat.bumpTexture = value;
        }
    }

    /**
     * Gets the coat normal texture
     */
    public get geometryCoatNormalTexture(): Nullable<BaseTexture> {
        if (this._isOpenPBR) {
            return (this._material as OpenPBRMaterial).geometryCoatNormalTexture;
        } else {
            return (this._material as PBRMaterial).clearCoat.bumpTexture;
        }
    }

    /**
     * Sets the coat normal texture scale
     */
    public set geometryCoatNormalTextureScale(value: number) {
        if (this._isOpenPBR) {
            const material = this._material as OpenPBRMaterial;
            if (material.geometryCoatNormalTexture) {
                material.geometryCoatNormalTexture.level = value;
            }
        } else {
            const material = this._material as PBRMaterial;
            if (material.clearCoat.bumpTexture) {
                material.clearCoat.bumpTexture.level = value;
            }
        }
    }
}
