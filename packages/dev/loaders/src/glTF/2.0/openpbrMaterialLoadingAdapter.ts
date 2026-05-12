import { type OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { type Material } from "core/Materials/material";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type Nullable } from "core/types";
import { Color3, Color4 } from "core/Maths/math.color";
import { type IMaterialLoadingAdapter } from "./materialLoadingAdapter";
import {
    MultiplyTexturesAsync,
    LerpTexturesAsync,
    CreateTextureWithFactorOperand,
    TextureChannel,
    TextureColorSpace,
    InvertTextureAsync,
    ExtractChannelAsync,
    ChannelMask,
    ExtractMaxChannelAsync,
} from "core/Materials/Textures/textureProcessor";

/**
 * Material Loading Adapter for OpenPBR materials that provides a unified OpenPBR-like interface.
 */
export class OpenPBRMaterialLoadingAdapter implements IMaterialLoadingAdapter {
    private _material: OpenPBRMaterial;
    private _specWorkflow: boolean = false;
    /**
     * Creates a new instance of the OpenPBRMaterialLoadingAdapter.
     * @param material - The OpenPBR material to adapt.
     */
    constructor(material: Material) {
        this._material = material as OpenPBRMaterial;
    }

    /**
     * Gets the underlying material
     */
    public get material(): OpenPBRMaterial {
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
     * Note: OpenPBR doesn't have a direct equivalent, so this is a no-op.
     * @param value The alpha cutoff threshold (ignored for OpenPBR)
     */
    public set alphaCutOff(value: number) {
        // OpenPBR doesn't have a direct equivalent, but could be implemented if needed
    }

    /**
     * Gets the alpha cutoff value.
     * @returns Default value of 0.5 (OpenPBR doesn't support this directly)
     */
    public get alphaCutOff(): number {
        return 0.5; // Default value
    }

    /**
     * Sets whether to use alpha from the base color texture.
     * Note: OpenPBR handles this differently through the baseColorTexture alpha channel.
     * @param value True to use alpha from base color texture (handled automatically in OpenPBR)
     */
    public set useAlphaFromBaseColorTexture(value: boolean) {
        this._material._useAlphaFromBaseColorTexture = value;
    }

    /**
     * Gets whether alpha is used from the base color texture.
     * @returns Always false for OpenPBR as it's handled automatically
     */
    public get useAlphaFromBaseColorTexture(): boolean {
        return false;
    }

    /**
     * Gets whether the transparency is treated as alpha coverage.
     */
    public get transparencyAsAlphaCoverage(): boolean {
        // OpenPBR doesn't support treating transparency as alpha coverage.
        return false;
    }

    /**
     * Sets/Gets whether the transparency is treated as alpha coverage
     */
    public set transparencyAsAlphaCoverage(value: boolean) {
        // OpenPBR doesn't support treating transparency as alpha coverage.
    }

    // ========================================
    // BASE PARAMETERS
    // ========================================

    /**
     * Sets the base color of the OpenPBR material.
     * @param value The base color as a Color3
     */
    public set baseColor(value: Color3) {
        this._material.baseColor = value;
    }

    /**
     * Gets the base color of the OpenPBR material.
     * @returns The base color as a Color3
     */
    public get baseColor(): Color3 {
        return this._material.baseColor;
    }

    /**
     * Sets the base color texture of the OpenPBR material.
     * @param value The base color texture or null
     */
    public set baseColorTexture(value: Nullable<BaseTexture>) {
        this._material.baseColorTexture = value;
    }

    /**
     * Gets the base color texture of the OpenPBR material.
     * @returns The base color texture or null
     */
    public get baseColorTexture(): Nullable<BaseTexture> {
        return this._material.baseColorTexture;
    }

    /**
     * Sets the base diffuse roughness of the OpenPBR material.
     * @param value The diffuse roughness value (0-1)
     */
    public set baseDiffuseRoughness(value: number) {
        this._material.baseDiffuseRoughness = value;
    }

    /**
     * Gets the base diffuse roughness of the OpenPBR material.
     * @returns The diffuse roughness value (0-1)
     */
    public get baseDiffuseRoughness(): number {
        return this._material.baseDiffuseRoughness;
    }

    /**
     * Sets the base diffuse roughness texture of the OpenPBR material.
     * @param value The diffuse roughness texture or null
     */
    public set baseDiffuseRoughnessTexture(value: Nullable<BaseTexture>) {
        this._material.baseDiffuseRoughnessTexture = value;
    }

    /**
     * Gets the base diffuse roughness texture of the OpenPBR material.
     * @returns The diffuse roughness texture or null
     */
    public get baseDiffuseRoughnessTexture(): Nullable<BaseTexture> {
        return this._material.baseDiffuseRoughnessTexture;
    }

    /**
     * Sets the base metalness value of the OpenPBR material.
     * @param value The metalness value (0-1)
     */
    public set baseMetalness(value: number) {
        this._material.baseMetalness = value;
    }

    /**
     * Gets the base metalness value of the OpenPBR material.
     * @returns The metalness value (0-1)
     */
    public get baseMetalness(): number {
        return this._material.baseMetalness;
    }

    /**
     * Sets the base metalness texture of the OpenPBR material.
     * @param value The metalness texture or null
     */
    public set baseMetalnessTexture(value: Nullable<BaseTexture>) {
        this._material.baseMetalnessTexture = value;
    }

    /**
     * Gets the base metalness texture of the OpenPBR material.
     * @returns The metalness texture or null
     */
    public get baseMetalnessTexture(): Nullable<BaseTexture> {
        return this._material.baseMetalnessTexture;
    }

    /**
     * Sets whether to use roughness from the metallic texture's green channel.
     * @param value True to use green channel for roughness
     */
    public set useRoughnessFromMetallicTextureGreen(value: boolean) {
        this._material._useRoughnessFromMetallicTextureGreen = value;
    }

    /**
     * Sets whether to use metalness from the metallic texture's blue channel.
     * @param value True to use blue channel for metalness
     */
    public set useMetallicFromMetallicTextureBlue(value: boolean) {
        this._material._useMetallicFromMetallicTextureBlue = value;
    }

    // ========================================
    // SPECULAR PARAMETERS
    // ========================================

    /**
     * Configures specular properties for OpenPBR material.
     * @param _enableEdgeColor Whether to enable edge color support (ignored for OpenPBR)
     */
    public enableSpecularEdgeColor(_enableEdgeColor: boolean = false): void {
        // OpenPBR already supports edge color natively, no configuration needed
    }

    public configureSpecularGlossiness(): void {
        this._specWorkflow = true;
    }

    /**
     * Sets the specular weight of the OpenPBR material.
     * @param value The specular weight value (0-1)
     */
    public set specularWeight(value: number) {
        this._material.specularWeight = value;
    }

    /**
     * Gets the specular weight of the OpenPBR material.
     * @returns The specular weight value (0-1)
     */
    public get specularWeight(): number {
        return this._material.specularWeight;
    }

    /**
     * Sets the specular weight texture of the OpenPBR material.
     * If the same texture is used for specular color, optimizes by using alpha channel for weight.
     * @param value The specular weight texture or null
     */
    public set specularWeightTexture(value: Nullable<BaseTexture>) {
        if (this._material.specularColorTexture === value) {
            this._material.specularWeightTexture = null;
            this._material._useSpecularWeightFromSpecularColorTexture = true;
            this._material._useSpecularWeightFromAlpha = true;
        } else {
            this._material.specularWeightTexture = value;
        }
    }

    /**
     * Gets the specular weight texture of the OpenPBR material.
     * @returns The specular weight texture or null
     */
    public get specularWeightTexture(): Nullable<BaseTexture> {
        return this._material.specularWeightTexture;
    }

    /**
     * Sets the specular color of the OpenPBR material.
     * @param value The specular color as a Color3
     */
    public set specularColor(value: Color3) {
        this._material.specularColor = value;
    }

    /**
     * Gets the specular color of the OpenPBR material.
     * @returns The specular color as a Color3
     */
    public get specularColor(): Color3 {
        return this._material.specularColor;
    }

    /**
     * Sets the specular color texture of the OpenPBR material.
     * If the same texture is used for specular weight, optimizes by using alpha channel for weight.
     * @param value The specular color texture or null
     */
    public set specularColorTexture(value: Nullable<BaseTexture>) {
        this._material.specularColorTexture = value;
        if (this._material.specularWeightTexture === this._material.specularColorTexture) {
            this._material.specularWeightTexture = null;
            this._material._useSpecularWeightFromSpecularColorTexture = true;
            this._material._useSpecularWeightFromAlpha = true;
        }
    }

    /**
     * Gets the specular color texture of the OpenPBR material.
     * @returns The specular color texture or null
     */
    public get specularColorTexture(): Nullable<BaseTexture> {
        return this._material.specularColorTexture;
    }

    /**
     * Sets the specular roughness of the OpenPBR material.
     * @param value The roughness value (0-1)
     */
    public set specularRoughness(value: number) {
        this._material.specularRoughness = value;
    }

    /**
     * Gets the specular roughness of the OpenPBR material.
     * @returns The roughness value (0-1)
     */
    public get specularRoughness(): number {
        return this._material.specularRoughness;
    }

    /**
     * Sets the specular roughness texture of the OpenPBR material.
     * @param value The roughness texture or null
     */
    public set specularRoughnessTexture(value: Nullable<BaseTexture>) {
        this._material.specularRoughnessTexture = value;
    }

    /**
     * Gets the specular roughness texture of the OpenPBR material.
     * @returns The roughness texture or null
     */
    public get specularRoughnessTexture(): Nullable<BaseTexture> {
        return this._material.specularRoughnessTexture;
    }

    /**
     * Sets the specular index of refraction (IOR) of the OpenPBR material.
     * @param value The IOR value
     */
    public set specularIor(value: number) {
        this._material.specularIor = value;
    }

    /**
     * Gets the specular index of refraction (IOR) of the OpenPBR material.
     * @returns The IOR value
     */
    public get specularIor(): number {
        return this._material.specularIor;
    }

    /**
     * Sets the glossiness (inverted roughness) of the OpenPBR material.
     */
    public set glossiness(value: number) {
        this._material.specularRoughness = Math.max(1.0 - value, 0.0);
    }

    public get glossiness(): number {
        return 1.0 - this._material.specularRoughness;
    }

    // ========================================
    // EMISSION PARAMETERS
    // ========================================

    /**
     * Sets the emission color of the OpenPBR material.
     * @param value The emission color as a Color3
     */
    public set emissionColor(value: Color3) {
        this._material.emissionColor = value;
    }

    /**
     * Gets the emission color of the OpenPBR material.
     * @returns The emission color as a Color3
     */
    public get emissionColor(): Color3 {
        return this._material.emissionColor;
    }

    /**
     * Sets the emission luminance of the OpenPBR material.
     * @param value The emission luminance value
     */
    public set emissionLuminance(value: number) {
        this._material.emissionLuminance = value;
    }

    /**
     * Gets the emission luminance of the OpenPBR material.
     * @returns The emission luminance value
     */
    public get emissionLuminance(): number {
        return this._material.emissionLuminance;
    }

    /**
     * Sets the emission color texture of the OpenPBR material.
     * @param value The emission texture or null
     */
    public set emissionColorTexture(value: Nullable<BaseTexture>) {
        this._material.emissionColorTexture = value;
    }

    /**
     * Gets the emission color texture of the OpenPBR material.
     * @returns The emission texture or null
     */
    public get emissionColorTexture(): Nullable<BaseTexture> {
        return this._material.emissionColorTexture;
    }

    // ========================================
    // AMBIENT OCCLUSION
    // ========================================

    /**
     * Sets the ambient occlusion texture of the OpenPBR material.
     * @param value The ambient occlusion texture or null
     */
    public set ambientOcclusionTexture(value: Nullable<BaseTexture>) {
        this._material.ambientOcclusionTexture = value;
    }

    /**
     * Gets the ambient occlusion texture of the OpenPBR material.
     * @returns The ambient occlusion texture or null
     */
    public get ambientOcclusionTexture(): Nullable<BaseTexture> {
        return this._material.ambientOcclusionTexture;
    }

    /**
     * Sets the ambient occlusion texture strength by modifying the texture's level.
     * @param value The strength value (typically 0-1)
     */
    public set ambientOcclusionTextureStrength(value: number) {
        const texture = this._material.ambientOcclusionTexture;
        if (texture) {
            texture.level = value;
        }
    }

    /**
     * Gets the ambient occlusion texture strength from the texture's level property.
     * @returns The strength value, defaults to 1.0 if no texture or level is set
     */
    public get ambientOcclusionTextureStrength(): number {
        const texture = this._material.ambientOcclusionTexture;
        return texture?.level ?? 1.0;
    }

    // ========================================
    // COAT PARAMETERS
    // ========================================

    /**
     * Configures coat parameters for OpenPBR material.
     * OpenPBR coat is already built-in, so no configuration is needed.
     */
    public configureCoat(): void {
        // OpenPBR coat is already built-in, no configuration needed
    }

    /**
     * Sets the coat weight of the OpenPBR material.
     * @param value The coat weight value (0-1)
     */
    public set coatWeight(value: number) {
        this._material.coatWeight = value;
    }

    /**
     * Gets the coat weight of the OpenPBR material.
     * @returns The coat weight value (0-1)
     */
    public get coatWeight(): number {
        return this._material.coatWeight;
    }

    /**
     * Sets the coat weight texture of the OpenPBR material.
     * @param value The coat weight texture or null
     */
    public set coatWeightTexture(value: Nullable<BaseTexture>) {
        this._material.coatWeightTexture = value;
    }

    /**
     * Gets the coat weight texture of the OpenPBR material.
     * @returns The coat weight texture or null
     */
    public get coatWeightTexture(): Nullable<BaseTexture> {
        return this._material.coatWeightTexture;
    }

    /**
     * Sets the coat color of the OpenPBR material.
     * @param value The coat color as a Color3
     */
    public set coatColor(value: Color3) {
        this._material.coatColor = value;
    }

    /**
     * Gets the coat color of the OpenPBR material.
     */
    public get coatColor(): Color3 {
        return this._material.coatColor;
    }

    /**
     * Sets the coat color texture of the OpenPBR material.
     * @param value The coat color texture or null
     */
    public set coatColorTexture(value: Nullable<BaseTexture>) {
        this._material.coatColorTexture = value;
    }

    /**
     * Sets the coat roughness of the OpenPBR material.
     * @param value The coat roughness value (0-1)
     */
    public set coatRoughness(value: number) {
        this._material.coatRoughness = value;
    }

    /**
     * Gets the coat roughness of the OpenPBR material.
     * @returns The coat roughness value (0-1)
     */
    public get coatRoughness(): number {
        return this._material.coatRoughness;
    }

    /**
     * Sets the coat roughness texture of the OpenPBR material.
     * @param value The coat roughness texture or null
     */
    public set coatRoughnessTexture(value: Nullable<BaseTexture>) {
        this._material.coatRoughnessTexture = value;
        if (value) {
            this._material._useCoatRoughnessFromGreenChannel = true;
        }
    }

    /**
     * Gets the coat roughness texture of the OpenPBR material.
     * @returns The coat roughness texture or null
     */
    public get coatRoughnessTexture(): Nullable<BaseTexture> {
        return this._material.coatRoughnessTexture;
    }

    /**
     * Sets the coat index of refraction (IOR) of the OpenPBR material.
     */
    public set coatIor(value: number) {
        this._material.coatIor = value;
    }

    public get coatIor(): number {
        return this._material.coatIor;
    }

    /**
     * Sets the coat darkening value of the OpenPBR material.
     * @param value The coat darkening value
     */
    public set coatDarkening(value: number) {
        this._material.coatDarkening = value;
    }

    public get coatDarkening(): number {
        return this._material.coatDarkening;
    }

    /**
     * Sets the coat darkening texture (OpenPBR: coatDarkeningTexture, no PBR equivalent)
     */
    public set coatDarkeningTexture(value: Nullable<BaseTexture>) {
        this._material.coatDarkeningTexture = value;
    }

    /**
     * Sets the coat roughness anisotropy.
     * TODO: Implementation pending OpenPBR coat anisotropy feature availability.
     * @param value The coat anisotropy intensity value
     */
    public set coatRoughnessAnisotropy(value: number) {
        this._material.coatRoughnessAnisotropy = value;
    }

    /**
     * Gets the coat roughness anisotropy.
     * TODO: Implementation pending OpenPBR coat anisotropy feature availability.
     * @returns Currently returns 0 as coat anisotropy is not yet available
     */
    public get coatRoughnessAnisotropy(): number {
        return this._material.coatRoughnessAnisotropy;
    }

    /**
     * Sets the coat tangent angle for anisotropy.
     * TODO: Implementation pending OpenPBR coat anisotropy feature availability.
     * @param value The coat anisotropy rotation angle in radians
     */
    public set geometryCoatTangentAngle(value: number) {
        this._material.geometryCoatTangentAngle = value;
    }

    /**
     * Sets the coat tangent texture for anisotropy.
     * TODO: Implementation pending OpenPBR coat anisotropy feature availability.
     * @param value The coat anisotropy texture or null
     */
    public set geometryCoatTangentTexture(value: Nullable<BaseTexture>) {
        this._material.geometryCoatTangentTexture = value;
        if (value) {
            this._material._useCoatRoughnessAnisotropyFromTangentTexture = true;
        }
    }

    /**
     * Gets the coat tangent texture for anisotropy.
     * TODO: Implementation pending OpenPBR coat anisotropy feature availability.
     * @returns Currently returns null as coat anisotropy is not yet available
     */
    public get geometryCoatTangentTexture(): Nullable<BaseTexture> {
        return this._material.geometryCoatTangentTexture;
    }

    // ========================================
    // TRANSMISSION LAYER
    // ========================================

    /**
     * Configures transmission for OpenPBR material.
     */
    public configureTransmission(): void {
        // Material is thin-walled until otherwise specified by the glTF volume extension.
        this._material.geometryThinWalled = 1.0;
        this._material.transmissionDepth = 0.0;
    }

    /**
     * Sets the transmission weight.
     * @param value The transmission weight value (0-1)
     */
    public set transmissionWeight(value: number) {
        this._material.transmissionWeight = value;
    }

    /**
     * Sets the transmission weight texture.
     * @param value The transmission weight texture or null
     */
    public set transmissionWeightTexture(value: Nullable<BaseTexture>) {
        this._material.transmissionWeightTexture = value;
    }

    public get transmissionWeightTexture(): Nullable<BaseTexture> {
        return this._material.transmissionWeightTexture;
    }

    /**
     * Gets the transmission weight.
     * @returns Currently returns 0 as transmission is not yet available
     */
    public get transmissionWeight(): number {
        return this._material.transmissionWeight;
    }

    /**
     * Sets the transmission scatter coefficient.
     * @param value The scatter coefficient as a Vector3
     */
    public set transmissionScatter(value: Color3) {
        this._material.transmissionScatter = value;
    }

    /**
     * Gets the transmission scatter coefficient.
     * @returns The scatter coefficient as a Vector3
     */
    public get transmissionScatter(): Color3 {
        return this._material.transmissionScatter;
    }

    /**
     * Sets the transmission scatter texture.
     * @param value The transmission scatter texture or null
     */
    public set transmissionScatterTexture(value: Nullable<BaseTexture>) {
        this._material.transmissionScatterTexture = value;
    }

    /**
     * Gets the transmission scatter texture.
     * @returns The transmission scatter texture or null
     */
    public get transmissionScatterTexture(): Nullable<BaseTexture> {
        return this._material.transmissionScatterTexture;
    }

    /**
     * Sets the transmission scattering anisotropy.
     * @param value The anisotropy intensity value (-1 to 1)
     */
    public set transmissionScatterAnisotropy(value: number) {
        this._material.transmissionScatterAnisotropy = value;
    }

    /**
     * Sets the transmission dispersion Abbe number.
     * @param value The Abbe number value
     */
    public set transmissionDispersionAbbeNumber(value: number) {
        this._material.transmissionDispersionAbbeNumber = value;
    }

    /**
     * Sets the transmission dispersion scale.
     * @param value The dispersion scale value
     */
    public set transmissionDispersionScale(value: number) {
        this._material.transmissionDispersionScale = value;
    }

    /**
     * Sets the attenuation distance.
     * @param value The attenuation distance value
     */
    public set transmissionDepth(value: number) {
        // If the value is being set to the default max value, and the current transmission depth is 0,
        // we assume that attenuation color isn't used and keep it at 0 to allow
        // us to use constant transmission color to handle glTF's surface tint from base color.
        if (value !== Number.MAX_VALUE || this._material.transmissionDepth !== 0) {
            this._material.transmissionDepth = value;
        } else {
            this._material.transmissionDepth = 0;
        }
    }

    /**
     * Gets the attenuation distance.
     */
    public get transmissionDepth(): number {
        return this._material.transmissionDepth;
    }

    /**
     * Sets the attenuation color.
     * @param value The attenuation color as a Color3
     */
    public set transmissionColor(value: Color3) {
        // Only set the transmission color if it's not white (default)
        // This allows us to retain the base color as the transmission color,
        // if that was previously set.
        if (!value.equals(Color3.White())) {
            this._material.transmissionColor = value;
        }
    }

    /**
     * Gets the attenuation color.
     */
    public get transmissionColor(): Color3 {
        return this._material.transmissionColor;
    }

    /**
     * Gets the refraction background texture
     * @returns The refraction background texture or null
     */
    public get refractionBackgroundTexture(): Nullable<BaseTexture> {
        return this._material.backgroundRefractionTexture;
    }

    /**
     * Sets the refraction background texture
     * @param value The refraction background texture or null
     */
    public set refractionBackgroundTexture(value: Nullable<BaseTexture>) {
        this._material.backgroundRefractionTexture = value;
    }

    // ========================================
    // VOLUME PROPERTIES
    // ========================================

    /**
     * Configures volume properties for OpenPBR material.
     */
    public configureVolume(): void {
        // If we're configuring volume, we assume the material is not thin-walled (i.e. it's volumetric).
        this._material.geometryThinWalled = 0.0;
    }

    /**
     * Sets whether the material is thin-walled (i.e. non-volumetric) or not.
     */
    public set geometryThinWalled(value: boolean) {
        this._material.geometryThinWalled = value ? 1.0 : 0.0;
    }

    /**
     * Gets whether the material is thin-walled (i.e. non-volumetric) or not.
     */
    public get geometryThinWalled(): boolean {
        return this._material.geometryThinWalled ? true : false;
    }

    /**
     * Sets the thickness texture.
     * @param value The thickness texture or null
     */
    public set volumeThicknessTexture(value: Nullable<BaseTexture>) {
        this._material.geometryThicknessTexture = value;
        this._material._useGeometryThicknessFromGreenChannel = true;
    }

    /**
     * Sets the thickness factor.
     * @param value The thickness value
     */
    public set volumeThickness(value: number) {
        this._material.geometryThickness = value;
    }

    // ========================================
    // SUBSURFACE PROPERTIES (Subsurface Scattering)
    // ========================================

    /**
     * Configures subsurface properties for PBR material
     */
    public configureSubsurface(): void {
        // glTF diffuse transmission is thin-walled (before volume extension is applied) will map to the subsurface slab and, without a
        this._material.geometryThinWalled = 1.0;
        this._material.subsurfaceScatterAnisotropy = 1.0;
    }

    /**
     * Sets the subsurface weight
     */
    public set subsurfaceWeight(value: number) {
        this._material.subsurfaceWeight = value;
    }

    public get subsurfaceWeight(): number {
        return this._material.subsurfaceWeight;
    }

    /**
     * Sets the subsurface weight texture
     */
    public set subsurfaceWeightTexture(value: Nullable<BaseTexture>) {
        this._material.subsurfaceWeightTexture = value;
        this._material._useSubsurfaceWeightFromTextureAlpha = true;
    }

    public get subsurfaceWeightTexture(): Nullable<BaseTexture> {
        return this._material.subsurfaceWeightTexture;
    }

    /**
     * Sets the subsurface color.
     * @param value The subsurface tint color as a Color3
     */
    public set subsurfaceColor(value: Color3) {
        this._material.subsurfaceColor = value;
    }

    /**
     * Sets the subsurface color texture.
     * @param value The subsurface tint texture or null
     */
    public set subsurfaceColorTexture(value: Nullable<BaseTexture>) {
        this._material.subsurfaceColorTexture = value;
    }

    private _diffuseTransmissionTint: Color3 = Color3.White();
    private _diffuseTransmissionTintTexture: Nullable<BaseTexture> = null;

    /**
     * Sets the diffuse transmission tint of the material
     */
    public set diffuseTransmissionTint(value: Color3) {
        this._diffuseTransmissionTint = value;
    }

    /**
     * Gets the diffuse transmission tint of the material
     */
    public get diffuseTransmissionTint(): Color3 {
        return this._diffuseTransmissionTint;
    }

    /**
     * Sets the diffuse transmission tint texture of the material
     */
    public set diffuseTransmissionTintTexture(value: Nullable<BaseTexture>) {
        this._diffuseTransmissionTintTexture = value;
    }

    /**
     * Gets the subsurface radius for subsurface scattering.
     * subsurfaceRadiusScale * subsurfaceRadius gives the mean free path per color channel.
     */
    public get subsurfaceRadius(): number {
        return this._material.subsurfaceRadius;
    }

    /**
     * Sets the subsurface radius for subsurface scattering.
     * subsurfaceRadiusScale * subsurfaceRadius gives the mean free path per color channel.
     * @param value The subsurface radius value
     */
    public set subsurfaceRadius(value: number) {
        this._material.subsurfaceRadius = value;
    }

    /**
     * Gets the subsurface radius scale for subsurface scattering.
     * subsurfaceRadiusScale * subsurfaceRadius gives the mean free path per color channel.
     */
    public get subsurfaceRadiusScale(): Color3 {
        return this._material.subsurfaceRadiusScale;
    }

    /**
     * Sets the subsurface radius scale for subsurface scattering.
     * subsurfaceRadiusScale * subsurfaceRadius gives the mean free path per color channel.
     * @param value The subsurface radius scale as a Color3
     */
    public set subsurfaceRadiusScale(value: Color3) {
        this._material.subsurfaceRadiusScale = value;
    }

    /**
     * Sets the subsurface scattering anisotropy.
     * @param value The anisotropy intensity value
     */
    public set subsurfaceScatterAnisotropy(value: number) {
        this._material.subsurfaceScatterAnisotropy = value;
    }

    /**
     * Does this material have a translucent surface (i.e. either transmission or subsurface)?
     * @returns True if the material is translucent, false otherwise
     */
    public isTranslucent(): boolean {
        return this.transmissionWeight > 0 || this.subsurfaceWeight > 0;
    }

    // ========================================
    // FUZZ LAYER (Sheen)
    // ========================================

    /**
     * Configures fuzz for OpenPBR.
     * Enables fuzz and sets up proper configuration.
     */
    public configureFuzz(): void {
        // Currently no setup to do for OpenPBR
    }

    /**
     * Sets the fuzz weight.
     * @param value The fuzz weight value
     */
    public set fuzzWeight(value: number) {
        this._material.fuzzWeight = value;
    }

    /**
     * Sets the fuzz weight texture.
     * @param value The fuzz weight texture or null
     */
    public set fuzzWeightTexture(value: Nullable<BaseTexture>) {
        this._material.fuzzWeightTexture = value;
    }

    /**
     * Sets the fuzz color.
     * @param value The fuzz color as a Color3
     */
    public set fuzzColor(value: Color3) {
        this._material.fuzzColor = value;
    }

    /**
     * Sets the fuzz color texture.
     * @param value The fuzz color texture or null
     */
    public set fuzzColorTexture(value: Nullable<BaseTexture>) {
        this._material.fuzzColorTexture = value;
    }

    /**
     * Sets the fuzz roughness.
     * @param value The fuzz roughness value (0-1)
     */
    public set fuzzRoughness(value: number) {
        this._material.fuzzRoughness = value;
    }

    /**
     * Sets the fuzz roughness texture.
     * @param value The fuzz roughness texture or null
     */
    public set fuzzRoughnessTexture(value: Nullable<BaseTexture>) {
        this._material.fuzzRoughnessTexture = value;
        this._material._useFuzzRoughnessFromTextureAlpha = true;
    }

    // ========================================
    // ANISOTROPY
    // ========================================

    /**
     * Sets the specular roughness anisotropy of the OpenPBR material.
     * @param value The anisotropy intensity value
     */
    public set specularRoughnessAnisotropy(value: number) {
        this._material.specularRoughnessAnisotropy = value;
    }

    /**
     * Gets the specular roughness anisotropy of the OpenPBR material.
     * @returns The anisotropy intensity value
     */
    public get specularRoughnessAnisotropy(): number {
        return this._material.specularRoughnessAnisotropy;
    }

    /**
     * Sets the anisotropy rotation angle.
     * @param value The anisotropy rotation angle in radians
     */
    public set geometryTangentAngle(value: number) {
        this._material.geometryTangentAngle = value;
    }

    /**
     * Sets the geometry tangent texture for anisotropy.
     * Automatically enables using anisotropy from the tangent texture.
     * @param value The anisotropy texture or null
     */
    public set geometryTangentTexture(value: Nullable<BaseTexture>) {
        this._material.geometryTangentTexture = value;
        this._material._useSpecularRoughnessAnisotropyFromTangentTexture = true;
    }

    /**
     * Gets the geometry tangent texture for anisotropy.
     * @returns The anisotropy texture or null
     */
    public get geometryTangentTexture(): Nullable<BaseTexture> {
        return this._material.geometryTangentTexture;
    }

    /**
     * Configures glTF-style anisotropy for the OpenPBR material.
     * @param useGltfStyle Whether to use glTF-style anisotropy
     */
    public configureGltfStyleAnisotropy(useGltfStyle: boolean = true): void {
        this._material._useGltfStyleAnisotropy = useGltfStyle;
    }

    // ========================================
    // THIN FILM IRIDESCENCE
    // ========================================

    /**
     * Sets the thin film weight.
     * @param value The thin film weight value
     */
    public set thinFilmWeight(value: number) {
        this._material.thinFilmWeight = value;
    }

    /**
     * Sets the thin film IOR.
     * @param value The thin film IOR value
     */
    public set thinFilmIor(value: number) {
        this._material.thinFilmIor = value;
    }

    /**
     * Sets the thin film thickness minimum.
     * @param value The minimum thickness value in nanometers
     */
    public set thinFilmThicknessMinimum(value: number) {
        this._material.thinFilmThicknessMin = value / 1000.0; // Convert to micrometers for OpenPBR
    }

    /**
     * Sets the thin film thickness maximum.
     * @param value The maximum thickness value in nanometers
     */
    public set thinFilmThicknessMaximum(value: number) {
        this._material.thinFilmThickness = value / 1000.0; // Convert to micrometers for OpenPBR
    }

    /**
     * Sets the thin film weight texture.
     * @param value The thin film weight texture or null
     */
    public set thinFilmWeightTexture(value: Nullable<BaseTexture>) {
        this._material.thinFilmWeightTexture = value;
    }

    /**
     * Sets the thin film thickness texture.
     * @param value The thin film thickness texture or null
     */
    public set thinFilmThicknessTexture(value: Nullable<BaseTexture>) {
        this._material.thinFilmThicknessTexture = value;
        this._material._useThinFilmThicknessFromTextureGreen = true;
    }

    // ========================================
    // UNLIT MATERIALS
    // ========================================

    /**
     * Sets whether the OpenPBR material is unlit.
     * @param value True to make the material unlit
     */
    public set unlit(value: boolean) {
        this._material.unlit = value;
    }

    // ========================================
    // GEOMETRY PARAMETERS
    // ========================================

    /**
     * Sets the geometry opacity of the OpenPBR material.
     * @param value The opacity value (0-1)
     */
    public set geometryOpacity(value: number) {
        this._material.geometryOpacity = value;
    }

    /**
     * Gets the geometry opacity of the OpenPBR material.
     * @returns The opacity value (0-1)
     */
    public get geometryOpacity(): number {
        return this._material.geometryOpacity;
    }

    /**
     * Sets the geometry normal texture of the OpenPBR material.
     * @param value The normal texture or null
     */
    public set geometryNormalTexture(value: Nullable<BaseTexture>) {
        this._material.geometryNormalTexture = value;
    }

    /**
     * Gets the geometry normal texture of the OpenPBR material.
     * @returns The normal texture or null
     */
    public get geometryNormalTexture(): Nullable<BaseTexture> {
        return this._material.geometryNormalTexture;
    }

    /**
     * Sets the normal map inversions for the OpenPBR material.
     * Note: OpenPBR may handle normal map inversions differently or may not need them.
     * @param invertX Whether to invert the normal map on the X axis (may be ignored)
     * @param invertY Whether to invert the normal map on the Y axis (may be ignored)
     */
    public setNormalMapInversions(invertX: boolean, invertY: boolean): void {
        // OpenPBR handles normal map inversions differently or may not need them
    }

    /**
     * Sets the geometry coat normal texture of the OpenPBR material.
     * @param value The coat normal texture or null
     */
    public set geometryCoatNormalTexture(value: Nullable<BaseTexture>) {
        this._material.geometryCoatNormalTexture = value;
    }

    /**
     * Gets the geometry coat normal texture of the OpenPBR material.
     * @returns The coat normal texture or null
     */
    public get geometryCoatNormalTexture(): Nullable<BaseTexture> {
        return this._material.geometryCoatNormalTexture;
    }

    /**
     * Sets the geometry coat normal texture scale.
     * @param value The scale value for the coat normal texture
     */
    public set geometryCoatNormalTextureScale(value: number) {
        if (this._material.geometryCoatNormalTexture) {
            this._material.geometryCoatNormalTexture.level = value;
        }
    }

    /**
     * Finalizes material properties after all loading is complete.
     * @param signal An AbortSignal that fires when the loader is disposed. Intermediate
     *   textures are disposed and the method returns early when aborted.
     */
    public async finalizeAsync(signal: AbortSignal): Promise<void> {
        // Do final configuration for the material to handle any interactions/dependencies between properties that we had to defer until all properties were loaded.

        // If the material is volumetric, we may need to create a coat layer to handle the surface tint.
        if ((this._diffuseTransmissionTint && !this._diffuseTransmissionTint.equals(Color3.White())) || this._diffuseTransmissionTintTexture) {
            if (this._material.geometryThinWalled) {
                // Use the subsurface slab for surface tinting.
                this.subsurfaceColor = this._diffuseTransmissionTint;
                this.subsurfaceColorTexture = this._diffuseTransmissionTintTexture;
            } else {
                // Otherwise, we have volumetric attenuation so we need to use the coat layer to preserve the base color tinting of glTF.
                await this.copySurfaceToCoatAsync(
                    this.subsurfaceWeight,
                    this.subsurfaceWeightTexture,
                    TextureChannel.A,
                    this._diffuseTransmissionTint,
                    this._diffuseTransmissionTintTexture,
                    true,
                    signal
                );
                if (signal.aborted) {
                    return;
                }
            }
        }
        // If the material has transmission, we need to use the base color to tint the transmission.
        if (this.transmissionWeight > 0) {
            if (this._material.geometryThinWalled || this._material.transmissionDepth === 0) {
                // If the material is thin-walled or has no attenuation depth, we can use the base color as the transmission color directly.
                this._material.transmissionColor = this._material.baseColor;
                this._material.transmissionColorTexture = this._material.baseColorTexture;
            } else if (!this.baseColor.equals(Color3.White()) || this.baseColorTexture !== null) {
                // Otherwise, we have volumetric attenuation so we need to use the coat layer to preserve the base color tinting of glTF.
                await this.copySurfaceToCoatAsync(this.transmissionWeight, this.transmissionWeightTexture, TextureChannel.R, this.baseColor, this.baseColorTexture, false, signal);
                if (signal.aborted) {
                    return;
                }
            }
        }

        if (this._specWorkflow) {
            // To convert from spec-gloss to OpenPBR, we'll grab the specular color's alpha channel (which contains glossiness) and
            // invert it to get roughness.
            const newRoughnessTexture = await InvertTextureAsync(
                "newRoughnessTexture (" + this._material.name + ")",
                await ExtractChannelAsync(
                    "glossiness (" + this._material.name + ")",
                    CreateTextureWithFactorOperand(
                        this.specularColorTexture,
                        new Color4(this.specularColor.r, this.specularColor.g, this.specularColor.b, this.glossiness),
                        TextureChannel.A,
                        TextureColorSpace.Linear
                    ),
                    TextureChannel.A,
                    this._material.getScene(),
                    TextureColorSpace.Linear,
                    ChannelMask.R
                ),
                this._material.getScene(),
                ChannelMask.R,
                TextureColorSpace.Linear,
                ChannelMask.R
            );
            if (signal.aborted) {
                newRoughnessTexture.texture?.dispose();
                return;
            }
            this.specularRoughnessTexture = newRoughnessTexture.texture;
            this.specularRoughness = newRoughnessTexture.factor ? newRoughnessTexture.factor.r : 1.0;

            // Metallic = max(linearize(specular).rgb). The specular texture is sRGB so we must
            // linearize it first (TextureColorSpace.SRGB). The factor is already linear per convention.
            // We store metallic as linear (no outputColorSpace) because it is a data/scalar value;
            // encoding it as sRGB would corrupt it when it is used as the lerp t below.
            const newMetallic = await ExtractMaxChannelAsync(
                "metallicTexture (" + this._material.name + ")",
                CreateTextureWithFactorOperand(this.specularColorTexture, this.specularColor.toColor4(), TextureChannel.RGBA, TextureColorSpace.Linear),
                this._material.getScene(),
                false,
                TextureColorSpace.SRGB,
                ChannelMask.RGB
            );
            if (signal.aborted) {
                newMetallic.texture?.dispose();
                return;
            }
            this.baseMetalnessTexture = newMetallic.texture;
            this.baseMetalness = newMetallic.factor ? newMetallic.factor.r : 1.0;

            // base_color = lerp(diffuse, specular, metallic).
            // Strip dispose before passing newMetallic as t — its texture is already owned by the
            // material (baseMetalnessTexture) and must not be released after the lerp pass.
            const newBaseColor = await LerpTexturesAsync(
                "newBaseColor (" + this._material.name + ")",
                CreateTextureWithFactorOperand(this.baseColorTexture, this.baseColor.toColor4(), TextureChannel.RGBA, TextureColorSpace.Linear),
                CreateTextureWithFactorOperand(this.specularColorTexture, this.specularColor.toColor4(), TextureChannel.RGBA, TextureColorSpace.Linear),
                { ...newMetallic, dispose: undefined, colorSpace: TextureColorSpace.Linear },
                this._material.getScene(),
                TextureColorSpace.SRGB,
                ChannelMask.RGB
            );
            if (signal.aborted) {
                newBaseColor.texture?.dispose();
                return;
            }
            const oldBaseColorTexture = this.baseColorTexture;
            oldBaseColorTexture?.dispose();
            this.baseColorTexture = newBaseColor.texture;
            this.baseColor = newBaseColor.factor ? new Color3(newBaseColor.factor.r, newBaseColor.factor.g, newBaseColor.factor.b) : Color3.White();

            const oldSpecularColorTexture = this.specularColorTexture;
            oldSpecularColorTexture?.dispose();
            this.specularColorTexture = null;
        }
    }

    private async copySurfaceToCoatAsync(
        weight: number,
        weightTexture: Nullable<BaseTexture>,
        weightTextureChannel: TextureChannel,
        color: Color3,
        colorTexture: Nullable<BaseTexture>,
        diffuseTransmission: boolean = false,
        signal: AbortSignal = new AbortController().signal
    ): Promise<void> {
        // Blend coat properties using:
        // New coat will cover all areas that previously had coat or transmission.
        //   new_coat_weight = max(weight, existing_coat_weight)
        // New coat color is the multiplication of the base color tint and the existing coat tint, each blended by their respective weights:
        //   new_coat_color  = lerp(white, existing_coat_color, existing_coat_weight)
        //                   * lerp(white, color, weight)
        // Snapshot the original coat properties before mutating them, so both lerps
        // use the pre-merge values (the first lerp blends the *existing* coat color
        // by the *existing* coat weight; we must not use the merged weight here).
        const origCoatWeight = this._material.coatWeight;
        const origCoatWeightTexture = this._material.coatWeightTexture;
        const origCoatColor = this._material.coatColor.clone();
        const origCoatColorTexture = this._material.coatColorTexture;
        const origCoatNormalTexture = this._material.geometryCoatNormalTexture;

        const origCoatWeightCol4 = new Color4(origCoatWeight, origCoatWeight, origCoatWeight, origCoatWeight);
        const weightCol4 = new Color4(weight, weight, weight, weight);

        this.coatWeightTexture = null;
        this.coatWeight = 1.0;

        const [lerpCoatColor, lerpSurfaceColor] = await Promise.all([
            LerpTexturesAsync(
                "lerpExistingCoat",
                CreateTextureWithFactorOperand(null, new Color4(1, 1, 1, 1)),
                CreateTextureWithFactorOperand(origCoatColorTexture, origCoatColor.toColor4(), TextureChannel.RGBA, TextureColorSpace.SRGB),
                CreateTextureWithFactorOperand(origCoatWeightTexture, origCoatWeightCol4, TextureChannel.R),
                this._material.getScene(),
                TextureColorSpace.SRGB
            ),
            LerpTexturesAsync(
                "lerpSurfaceColor",
                CreateTextureWithFactorOperand(null, new Color4(1, 1, 1, 1)),
                CreateTextureWithFactorOperand(colorTexture, color.toColor4(), TextureChannel.RGBA, TextureColorSpace.SRGB),
                CreateTextureWithFactorOperand(weightTexture, weightCol4, weightTextureChannel),
                this._material.getScene(),
                TextureColorSpace.SRGB
            ),
        ]);
        if (signal.aborted) {
            lerpCoatColor.texture?.dispose();
            lerpSurfaceColor.texture?.dispose();
            return;
        }

        const newCoatColor = await MultiplyTexturesAsync(
            "newCoatColor (" + this._material.name + ")",
            lerpCoatColor,
            lerpSurfaceColor,
            this._material.getScene(),
            TextureColorSpace.SRGB
        );
        if (signal.aborted) {
            newCoatColor.texture?.dispose();
            return;
        }

        if (newCoatColor.texture) {
            this.coatColorTexture = newCoatColor.texture;
            this.coatColor = Color3.White();
        } else if (newCoatColor.factor) {
            this.coatColorTexture = null;
            this.coatColor.fromArray([newCoatColor.factor.r, newCoatColor.factor.g, newCoatColor.factor.b]);
        }

        const newCoatIor = await LerpTexturesAsync(
            "newCoatIor (" + this._material.name + ")",
            CreateTextureWithFactorOperand(null, new Color4(this._material.specularIor, this._material.specularIor, this._material.specularIor, 1.0), TextureChannel.R),
            CreateTextureWithFactorOperand(null, new Color4(this.coatIor, this.coatIor, this.coatIor, 1.0), TextureChannel.R),
            CreateTextureWithFactorOperand(origCoatWeightTexture, origCoatWeightCol4, TextureChannel.R),
            this._material.getScene()
        );
        if (signal.aborted) {
            newCoatIor.texture?.dispose();
            return;
        }
        this.coatIor = newCoatIor.factor ? newCoatIor.factor.r : this.coatIor;

        const newCoatRoughness = await LerpTexturesAsync(
            "newCoatRoughness (" + this._material.name + ")",
            CreateTextureWithFactorOperand(
                this.specularRoughnessTexture,
                new Color4(this.specularRoughness, this.specularRoughness, this.specularRoughness, 1.0),
                TextureChannel.G
            ),
            CreateTextureWithFactorOperand(this.coatRoughnessTexture, new Color4(this.coatRoughness, this.coatRoughness, this.coatRoughness, 1.0), TextureChannel.G),
            CreateTextureWithFactorOperand(origCoatWeightTexture, origCoatWeightCol4, TextureChannel.R),
            this._material.getScene()
        );
        if (signal.aborted) {
            newCoatRoughness.texture?.dispose();
            return;
        }
        this.coatRoughness = newCoatRoughness.factor ? newCoatRoughness.factor.r : 1.0;
        this.coatRoughnessTexture = newCoatRoughness.texture;

        const newCoatDarkening = await LerpTexturesAsync(
            "newCoatDarkening (" + this._material.name + ")",
            CreateTextureWithFactorOperand(null, new Color4(0, 0, 0, 1.0), TextureChannel.R),
            CreateTextureWithFactorOperand(null, new Color4(this.coatDarkening, this.coatDarkening, this.coatDarkening, 1.0), TextureChannel.R),
            CreateTextureWithFactorOperand(origCoatWeightTexture, origCoatWeightCol4, TextureChannel.R),
            this._material.getScene()
        );
        if (signal.aborted) {
            newCoatDarkening.texture?.dispose();
            return;
        }
        this.coatDarkening = newCoatDarkening.factor ? newCoatDarkening.factor.r : this.coatDarkening;

        if (diffuseTransmission) {
            const newSpecularRoughness = await LerpTexturesAsync(
                "newSpecularRoughness (" + this._material.name + ")",
                CreateTextureWithFactorOperand(
                    this.specularRoughnessTexture,
                    new Color4(this._material.specularRoughness, this._material.specularRoughness, this._material.specularRoughness, 1.0),
                    TextureChannel.G
                ),
                CreateTextureWithFactorOperand(null, new Color4(1, 1, 1, 1.0), TextureChannel.R),
                CreateTextureWithFactorOperand(weightTexture, weightCol4, weightTextureChannel),
                this._material.getScene()
            );
            if (signal.aborted) {
                newSpecularRoughness.texture?.dispose();
                return;
            }
            this.specularRoughness = newSpecularRoughness.factor ? newSpecularRoughness.factor.r : 1.0;
            this.specularRoughnessTexture = newSpecularRoughness.texture;
        }

        if (origCoatNormalTexture || this.geometryNormalTexture) {
            const newCoatNormal = await LerpTexturesAsync(
                "newCoatNormal (" + this._material.name + ")",
                CreateTextureWithFactorOperand(
                    this.geometryNormalTexture,
                    this.geometryNormalTexture ? new Color4(1, 1, 1, 1) : new Color4(0.5, 0.5, 1.0, 1.0),
                    TextureChannel.RGBA
                ),
                CreateTextureWithFactorOperand(origCoatNormalTexture, origCoatNormalTexture ? new Color4(1, 1, 1, 1) : new Color4(0.5, 0.5, 1.0, 1.0), TextureChannel.RGBA),
                CreateTextureWithFactorOperand(origCoatWeightTexture, origCoatWeightCol4, TextureChannel.R),
                this._material.getScene()
            );
            if (signal.aborted) {
                newCoatNormal.texture?.dispose();
                return;
            }
            if (newCoatNormal.texture) {
                this.geometryCoatNormalTexture = newCoatNormal.texture;
            }
        }
    }
}
