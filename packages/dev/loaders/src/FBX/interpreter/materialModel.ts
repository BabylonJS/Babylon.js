/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
/**
 * Unified material model.
 *
 * FBX materials come in many vendor flavours: the classic FbxSurfaceLambert / FbxSurfacePhong, Autodesk Standard
 * Surface (OSL), Arnold aiStandardSurface, 3ds Max Physical Material, 3ds Max PBR (metal/rough and spec/gloss),
 * the 3ds Max glTF material, OpenPBR, and Maya's Stingray PBS ShaderFX graph. Each stores its parameters under
 * different property names, sometimes behind a shader binding table.
 *
 * This module resolves any of them into two parameter sets, mirroring how the FBX SDK / ufbx expose materials:
 * `fbx` (the classic Lambert/Phong parameters) and `pbr` (a physically based parameter set), plus feature flags.
 */
import { type FBXPropertyValue } from "../types/fbxTypes";

export type FBXShaderType =
    | "unknown"
    | "fbxLambert"
    | "fbxPhong"
    | "oslStandardSurface"
    | "arnoldStandardSurface"
    | "3dsMaxPhysicalMaterial"
    | "3dsMaxPbrMetalRough"
    | "3dsMaxPbrSpecGloss"
    | "gltfMaterial"
    | "openPbrMaterial"
    | "shaderFxGraph"
    | "blenderPhong";

/** One resolved material parameter: a constant value and/or a texture. */
export interface FBXMaterialMap<TTexture> {
    /** Constant value (r,g,b,a for colours, x for scalars) */
    value?: number[];
    /** Number of meaningful components in `value` (1 for scalars, 3 or 4 for colours) */
    valueComponents: number;
    /** Texture bound to the parameter */
    texture?: TTexture;
    /** Whether the texture is enabled (some vendors carry an explicit toggle) */
    textureEnabled: boolean;
}

export type FBXFbxMapName =
    | "diffuseFactor"
    | "diffuseColor"
    | "specularFactor"
    | "specularColor"
    | "specularExponent"
    | "reflectionFactor"
    | "reflectionColor"
    | "transparencyFactor"
    | "transparencyColor"
    | "emissionFactor"
    | "emissionColor"
    | "ambientFactor"
    | "ambientColor"
    | "normalMap"
    | "bump"
    | "bumpFactor"
    | "displacement"
    | "displacementFactor"
    | "vectorDisplacement"
    | "vectorDisplacementFactor";

export type FBXPbrMapName =
    | "baseFactor"
    | "baseColor"
    | "roughness"
    | "metalness"
    | "diffuseRoughness"
    | "specularFactor"
    | "specularColor"
    | "specularIor"
    | "specularAnisotropy"
    | "specularRotation"
    | "transmissionFactor"
    | "transmissionColor"
    | "transmissionDepth"
    | "transmissionScatter"
    | "transmissionScatterAnisotropy"
    | "transmissionDispersion"
    | "transmissionRoughness"
    | "transmissionExtraRoughness"
    | "transmissionPriority"
    | "transmissionEnableInAov"
    | "subsurfaceFactor"
    | "subsurfaceColor"
    | "subsurfaceRadius"
    | "subsurfaceScale"
    | "subsurfaceAnisotropy"
    | "subsurfaceTintColor"
    | "subsurfaceType"
    | "sheenFactor"
    | "sheenColor"
    | "sheenRoughness"
    | "coatFactor"
    | "coatColor"
    | "coatRoughness"
    | "coatIor"
    | "coatAnisotropy"
    | "coatRotation"
    | "coatNormal"
    | "coatAffectBaseColor"
    | "coatAffectBaseRoughness"
    | "thinFilmFactor"
    | "thinFilmThickness"
    | "thinFilmIor"
    | "emissionFactor"
    | "emissionColor"
    | "opacity"
    | "indirectDiffuse"
    | "indirectSpecular"
    | "normalMap"
    | "tangentMap"
    | "displacementMap"
    | "matteFactor"
    | "matteColor"
    | "ambientOcclusion"
    | "glossiness"
    | "coatGlossiness"
    | "transmissionGlossiness";

export type FBXMaterialFeatureName =
    | "pbr"
    | "metalness"
    | "diffuse"
    | "specular"
    | "emission"
    | "transmission"
    | "coat"
    | "sheen"
    | "opacity"
    | "ambientOcclusion"
    | "matte"
    | "unlit"
    | "ior"
    | "diffuseRoughness"
    | "transmissionRoughness"
    | "thinWalled"
    | "caustics"
    | "exitToBackground"
    | "internalReflections"
    | "doubleSided"
    | "roughnessAsGlossiness"
    | "coatRoughnessAsGlossiness"
    | "transmissionRoughnessAsGlossiness";

export interface FBXMaterialModel<TTexture> {
    shaderType: FBXShaderType;
    /** Prefix material property names carry for this shader (e.g. "3dsMax|Parameters|") */
    shaderPropPrefix: string;
    fbx: Partial<Record<FBXFbxMapName, FBXMaterialMap<TTexture>>>;
    pbr: Partial<Record<FBXPbrMapName, FBXMaterialMap<TTexture>>>;
    features: Partial<Record<FBXMaterialFeatureName, { enabled: boolean; explicit: boolean }>>;
}

/** Inputs needed to resolve a material, independent of the parse representation. */
export interface FBXMaterialSource<TTexture> {
    /** "lambert", "phong", "unknown", ... as written in the file */
    shadingModelName: string;
    /** Property values by full property name (e.g. "DiffuseColor", "Maya|baseColor", "3dsMax|Parameters|roughness") */
    props: Map<string, { type: string; values: FBXPropertyValue[] }>;
    /** Textures connected to the material by property name (OP connection property) */
    texturesByProp: Map<string, TTexture>;
    /** Connected shader implementation, when any */
    shader?: {
        renderApi: string;
        /** shader semantic name -> material property names */
        bindings: Map<string, string[]>;
    };
    /** True when the file was written by Blender 4.12+ (Blender "Phong" carries PBR-ish semantics) */
    blenderPbr?: boolean;
}

const enum Flag {
    DefaultW1 = 1,
    WidenToRgb = 2,
    MultiplyValue = 4,
}
const enum Transform {
    None = 0,
    InvertX = 1,
    UnknownShininess = 2,
    BlenderOpacity = 3,
    BlenderShininess = 4,
}
const enum FeatureFlag {
    Inverted = 1,
    IfExists = 2,
    IfTexture = 4,
    IfAround1 = 8,
}

type MapEntry = [FBXPbrMapName | FBXFbxMapName, number, number, string];
type FeatureEntry = [FBXMaterialFeatureName, number, string];

const BASE_FBX: MapEntry[] = [
    ["diffuseColor", Flag.DefaultW1, 0, "Diffuse"],
    ["diffuseColor", Flag.DefaultW1, 0, "DiffuseColor"],
    ["diffuseFactor", 0, 0, "DiffuseFactor"],
    ["specularColor", Flag.DefaultW1, 0, "Specular"],
    ["specularColor", Flag.DefaultW1, 0, "SpecularColor"],
    ["specularFactor", 0, 0, "SpecularFactor"],
    ["specularExponent", 0, 0, "Shininess"],
    ["specularExponent", 0, 0, "ShininessExponent"],
    ["reflectionColor", Flag.DefaultW1, 0, "Reflection"],
    ["reflectionColor", Flag.DefaultW1, 0, "ReflectionColor"],
    ["reflectionFactor", 0, 0, "ReflectionFactor"],
    ["transparencyColor", Flag.DefaultW1, 0, "Transparent"],
    ["transparencyColor", Flag.DefaultW1, 0, "TransparentColor"],
    ["transparencyFactor", 0, 0, "TransparentFactor"],
    ["transparencyFactor", 0, 0, "TransparencyFactor"],
    ["emissionColor", Flag.DefaultW1, 0, "Emissive"],
    ["emissionColor", Flag.DefaultW1, 0, "EmissiveColor"],
    ["emissionFactor", 0, 0, "EmissiveFactor"],
    ["ambientColor", Flag.DefaultW1, 0, "Ambient"],
    ["ambientColor", Flag.DefaultW1, 0, "AmbientColor"],
    ["ambientFactor", 0, 0, "AmbientFactor"],
    ["normalMap", 0, 0, "NormalMap"],
    ["bump", 0, 0, "Bump"],
    ["bumpFactor", 0, 0, "BumpFactor"],
    ["displacement", 0, 0, "Displacement"],
    ["displacementFactor", 0, 0, "DisplacementFactor"],
    ["vectorDisplacement", 0, 0, "VectorDisplacement"],
    ["vectorDisplacementFactor", 0, 0, "VectorDisplacementFactor"],
];

const LAMBERT_PBR: MapEntry[] = [
    ["baseColor", Flag.DefaultW1, 0, "Diffuse"],
    ["baseColor", Flag.DefaultW1, 0, "DiffuseColor"],
    ["baseFactor", 0, 0, "DiffuseFactor"],
    ["transmissionColor", Flag.DefaultW1, 0, "Transparent"],
    ["transmissionColor", Flag.DefaultW1, 0, "TransparentColor"],
    ["transmissionFactor", 0, 0, "TransparentFactor"],
    ["transmissionFactor", 0, 0, "TransparencyFactor"],
    ["emissionColor", Flag.DefaultW1, 0, "Emissive"],
    ["emissionColor", Flag.DefaultW1, 0, "EmissiveColor"],
    ["emissionFactor", 0, 0, "EmissiveFactor"],
    ["normalMap", 0, 0, "NormalMap"],
];

const PHONG_PBR: MapEntry[] = [
    ["baseColor", Flag.DefaultW1, 0, "Diffuse"],
    ["baseColor", Flag.DefaultW1, 0, "DiffuseColor"],
    ["baseFactor", 0, 0, "DiffuseFactor"],
    ["specularColor", Flag.DefaultW1, 0, "Specular"],
    ["specularColor", Flag.DefaultW1, 0, "SpecularColor"],
    ["specularFactor", 0, 0, "SpecularFactor"],
    ["roughness", 0, Transform.UnknownShininess, "Shininess"],
    ["roughness", 0, Transform.UnknownShininess, "ShininessExponent"],
    ["transmissionColor", Flag.DefaultW1, 0, "Transparent"],
    ["transmissionColor", Flag.DefaultW1, 0, "TransparentColor"],
    ["transmissionFactor", 0, 0, "TransparentFactor"],
    ["transmissionFactor", 0, 0, "TransparencyFactor"],
    ["emissionColor", Flag.DefaultW1, 0, "Emissive"],
    ["emissionColor", Flag.DefaultW1, 0, "EmissiveColor"],
    ["emissionFactor", 0, 0, "EmissiveFactor"],
    ["normalMap", 0, 0, "NormalMap"],
];

const OSL_PBR: MapEntry[] = [
    ["baseFactor", 0, 0, "base"],
    ["baseColor", Flag.DefaultW1, 0, "base_color"],
    ["roughness", 0, 0, "specular_roughness"],
    ["diffuseRoughness", 0, 0, "diffuse_roughness"],
    ["metalness", 0, 0, "metalness"],
    ["specularFactor", 0, 0, "specular"],
    ["specularColor", Flag.DefaultW1, 0, "specular_color"],
    ["specularIor", 0, 0, "specular_IOR"],
    ["specularAnisotropy", 0, 0, "specular_anisotropy"],
    ["specularRotation", 0, 0, "specular_rotation"],
    ["transmissionFactor", 0, 0, "transmission"],
    ["transmissionColor", Flag.DefaultW1, 0, "transmission_color"],
    ["transmissionDepth", 0, 0, "transmission_depth"],
    ["transmissionScatter", Flag.WidenToRgb, 0, "transmission_scatter"],
    ["transmissionScatterAnisotropy", 0, 0, "transmission_scatter_anisotropy"],
    ["transmissionDispersion", 0, 0, "transmission_dispersion"],
    ["transmissionExtraRoughness", 0, 0, "transmission_extra_roughness"],
    ["subsurfaceFactor", 0, 0, "subsurface"],
    ["subsurfaceColor", Flag.DefaultW1, 0, "subsurface_color"],
    ["subsurfaceRadius", Flag.WidenToRgb, 0, "subsurface_radius"],
    ["subsurfaceScale", 0, 0, "subsurface_scale"],
    ["subsurfaceAnisotropy", 0, 0, "subsurface_anisotropy"],
    ["sheenFactor", 0, 0, "sheen"],
    ["sheenColor", Flag.DefaultW1, 0, "sheen_color"],
    ["sheenRoughness", 0, 0, "sheen_roughness"],
    ["coatFactor", 0, 0, "coat"],
    ["coatColor", Flag.DefaultW1, 0, "coat_color"],
    ["coatRoughness", 0, 0, "coat_roughness"],
    ["coatIor", 0, 0, "coat_IOR"],
    ["coatAnisotropy", 0, 0, "coat_anisotropy"],
    ["coatRotation", 0, 0, "coat_rotation"],
    ["coatNormal", 0, 0, "coat_normal"],
    ["coatAffectBaseColor", Flag.DefaultW1, 0, "coat_affect_color"],
    ["coatAffectBaseRoughness", 0, 0, "coat_affect_roughness"],
    ["thinFilmThickness", 0, 0, "thin_film_thickness"],
    ["thinFilmIor", 0, 0, "thin_film_IOR"],
    ["emissionFactor", 0, 0, "emission"],
    ["emissionColor", Flag.DefaultW1, 0, "emission_color"],
    ["opacity", Flag.WidenToRgb, 0, "opacity"],
    ["normalMap", 0, 0, "NormalMap"],
    ["normalMap", 0, 0, "normalCamera"],
    ["tangentMap", 0, 0, "tangent"],
];
const OSL_FEATURES: FeatureEntry[] = [["thinWalled", 0, "thin_walled"]];

const ARNOLD_PBR: MapEntry[] = [
    ["baseFactor", 0, 0, "base"],
    ["baseColor", Flag.DefaultW1, 0, "baseColor"],
    ["roughness", 0, 0, "specularRoughness"],
    ["diffuseRoughness", 0, 0, "diffuseRoughness"],
    ["metalness", 0, 0, "metalness"],
    ["specularFactor", 0, 0, "specular"],
    ["specularColor", Flag.DefaultW1, 0, "specularColor"],
    ["specularIor", 0, 0, "specularIOR"],
    ["specularAnisotropy", 0, 0, "specularAnisotropy"],
    ["specularRotation", 0, 0, "specularRotation"],
    ["transmissionFactor", 0, 0, "transmission"],
    ["transmissionColor", Flag.DefaultW1, 0, "transmissionColor"],
    ["transmissionDepth", 0, 0, "transmissionDepth"],
    ["transmissionScatter", Flag.WidenToRgb, 0, "transmissionScatter"],
    ["transmissionScatterAnisotropy", 0, 0, "transmissionScatterAnisotropy"],
    ["transmissionDispersion", 0, 0, "transmissionDispersion"],
    ["transmissionExtraRoughness", 0, 0, "transmissionExtraRoughness"],
    ["subsurfaceFactor", 0, 0, "subsurface"],
    ["subsurfaceColor", Flag.DefaultW1, 0, "subsurfaceColor"],
    ["subsurfaceRadius", Flag.WidenToRgb, 0, "subsurfaceRadius"],
    ["subsurfaceScale", 0, 0, "subsurfaceScale"],
    ["subsurfaceAnisotropy", 0, 0, "subsurfaceAnisotropy"],
    ["sheenFactor", 0, 0, "sheen"],
    ["sheenColor", Flag.DefaultW1, 0, "sheenColor"],
    ["sheenRoughness", 0, 0, "sheenRoughness"],
    ["coatFactor", 0, 0, "coat"],
    ["coatColor", Flag.DefaultW1, 0, "coatColor"],
    ["coatRoughness", 0, 0, "coatRoughness"],
    ["coatIor", 0, 0, "coatIOR"],
    ["coatAnisotropy", 0, 0, "coatAnisotropy"],
    ["coatRotation", 0, 0, "coatRotation"],
    ["coatNormal", 0, 0, "coatNormal"],
    ["thinFilmThickness", 0, 0, "thinFilmThickness"],
    ["thinFilmIor", 0, 0, "thinFilmIOR"],
    ["emissionFactor", 0, 0, "emission"],
    ["emissionColor", Flag.DefaultW1, 0, "emissionColor"],
    ["opacity", Flag.WidenToRgb, 0, "opacity"],
    ["indirectDiffuse", 0, 0, "indirectDiffuse"],
    ["indirectSpecular", 0, 0, "indirectSpecular"],
    ["normalMap", 0, 0, "NormalMap"],
    ["normalMap", 0, 0, "normalCamera"],
    ["tangentMap", 0, 0, "tangent"],
    ["matteColor", Flag.DefaultW1, 0, "aiMatteColor"],
    ["matteFactor", 0, 0, "aiMatteColorA"],
    ["subsurfaceType", 0, 0, "subsurfaceType"],
    ["transmissionPriority", 0, 0, "dielectricPriority"],
    ["transmissionEnableInAov", 0, 0, "transmitAovs"],
];
const ARNOLD_FEATURES: FeatureEntry[] = [
    ["matte", 0, "aiEnableMatte"],
    ["thinWalled", 0, "thinWalled"],
    ["caustics", 0, "caustics"],
    ["internalReflections", 0, "internalReflections"],
    ["exitToBackground", 0, "exitToBackground"],
];

const MAX_PHYSICAL_PBR: MapEntry[] = [
    ["baseFactor", 0, 0, "base_weight"],
    ["baseColor", Flag.DefaultW1, 0, "base_color"],
    ["roughness", 0, 0, "roughness"],
    ["diffuseRoughness", 0, 0, "diff_rough"],
    ["diffuseRoughness", 0, 0, "diff_roughness"],
    ["metalness", 0, 0, "metalness"],
    ["specularFactor", 0, 0, "reflectivity"],
    ["specularColor", Flag.DefaultW1, 0, "refl_color"],
    ["specularAnisotropy", 0, 0, "anisotropy"],
    ["specularRotation", 0, 0, "aniso_angle"],
    ["specularRotation", 0, 0, "anisoangle"],
    ["specularIor", 0, 0, "trans_ior"],
    ["transmissionFactor", 0, 0, "transparency"],
    ["transmissionColor", Flag.DefaultW1, 0, "trans_color"],
    ["transmissionDepth", 0, 0, "trans_depth"],
    ["transmissionRoughness", 0, 0, "trans_rough"],
    ["transmissionRoughness", 0, 0, "trans_roughness"],
    ["subsurfaceFactor", 0, 0, "scattering"],
    ["subsurfaceTintColor", Flag.DefaultW1, 0, "sss_color"],
    ["subsurfaceColor", Flag.DefaultW1, 0, "sss_scatter_color"],
    ["subsurfaceRadius", Flag.WidenToRgb, 0, "sss_depth"],
    ["subsurfaceScale", 0, 0, "sss_scale"],
    ["coatFactor", 0, 0, "coat"],
    ["coatFactor", 0, 0, "coating"],
    ["coatColor", Flag.DefaultW1, 0, "coat_color"],
    ["coatRoughness", 0, 0, "coat_rough"],
    ["coatRoughness", 0, 0, "coat_roughness"],
    ["coatIor", 0, 0, "coat_ior"],
    ["coatNormal", 0, 0, "coat_bump"],
    ["coatNormal", 0, 0, "clearcoat_bump_map_amt"],
    ["coatAffectBaseColor", Flag.DefaultW1, 0, "coat_affect_color"],
    ["coatAffectBaseRoughness", 0, 0, "coat_affect_roughness"],
    ["emissionFactor", 0, 0, "emission"],
    ["emissionColor", Flag.DefaultW1, 0, "emit_color"],
    ["opacity", Flag.WidenToRgb, 0, "cutout"],
    ["normalMap", 0, 0, "bump"],
    ["normalMap", 0, 0, "bump_map_amt"],
    ["displacementMap", 0, 0, "displacement"],
    ["displacementMap", 0, 0, "displacement_map_amt"],
    ["subsurfaceType", 0, 0, "subsurfaceType"],
];
const MAX_PHYSICAL_FEATURES: FeatureEntry[] = [
    ["thinWalled", 0, "thin_walled"],
    ["specular", 0, "material_mode"],
    ["diffuseRoughness", 0, "material_mode"],
    ["transmissionRoughness", FeatureFlag.Inverted, "trans_roughness_lock"],
    ["roughnessAsGlossiness", 0, "roughness_inv"],
    ["transmissionRoughnessAsGlossiness", 0, "trans_roughness_inv"],
    ["coatRoughnessAsGlossiness", 0, "coat_roughness_inv"],
];

const GLTF_PBR: MapEntry[] = [
    ["baseColor", Flag.DefaultW1, 0, "main|baseColor"],
    ["roughness", 0, 0, "main|roughness"],
    ["metalness", 0, 0, "main|metalness"],
    ["normalMap", 0, 0, "main|normal"],
    ["ambientOcclusion", 0, 0, "main|ambientOcclusion"],
    ["emissionColor", Flag.DefaultW1, 0, "main|emission"],
    ["emissionColor", Flag.DefaultW1, 0, "main|emissionColor"],
    ["opacity", Flag.WidenToRgb, 0, "main|Alpha"],
    ["coatFactor", 0, 0, "extension|clearcoat"],
    ["coatRoughness", 0, 0, "extension|clearcoatRoughness"],
    ["coatNormal", 0, 0, "extension|clearcoatNormal"],
    ["sheenColor", Flag.DefaultW1, 0, "extension|sheenColor"],
    ["sheenRoughness", 0, 0, "extension|sheenRoughness"],
    ["specularFactor", 0, 0, "extension|specular"],
    ["specularFactor", 0, 0, "extension|Specular"],
    ["specularColor", Flag.DefaultW1, 0, "extension|specularcolor"],
    ["specularColor", Flag.DefaultW1, 0, "extension|specularColor"],
    ["transmissionFactor", 0, 0, "extension|transmission"],
    ["specularIor", 0, 0, "extension|indexOfRefraction"],
];
const GLTF_FEATURES: FeatureEntry[] = [
    ["doubleSided", 0, "main|DoubleSided"],
    ["sheen", 0, "extension|enableSheen"],
    ["coat", 0, "extension|enableClearCoat"],
    ["transmission", 0, "extension|enableTransmission"],
    ["ior", 0, "extension|enableIndexOfRefraction"],
    ["specular", 0, "extension|enableSpecular"],
    ["unlit", 0, "extension|unlit"],
];

const OPENPBR_PBR: MapEntry[] = [
    ["baseFactor", 0, 0, "base_weight"],
    ["baseColor", Flag.DefaultW1, 0, "base_color"],
    ["roughness", 0, 0, "specular_roughness"],
    ["diffuseRoughness", 0, 0, "base_diffuse_roughness"],
    ["metalness", 0, 0, "base_metalness"],
    ["specularFactor", 0, 0, "specular_weight"],
    ["specularColor", Flag.DefaultW1, 0, "specular_color"],
    ["specularAnisotropy", 0, 0, "specular_roughness_anisotropy"],
    ["specularIor", 0, 0, "specular_ior"],
    ["transmissionFactor", 0, 0, "transmission_weight"],
    ["transmissionColor", Flag.DefaultW1, 0, "transmission_color"],
    ["transmissionDepth", 0, 0, "transmission_depth"],
    ["transmissionScatter", Flag.WidenToRgb, 0, "transmission_scatter"],
    ["transmissionScatterAnisotropy", 0, 0, "transmission_scatter_anisotropy"],
    ["transmissionDispersion", 0, 0, "transmission_dispersion_scale"],
    ["subsurfaceFactor", 0, 0, "subsurface_weight"],
    ["subsurfaceColor", Flag.DefaultW1, 0, "subsurface_color"],
    ["subsurfaceRadius", Flag.WidenToRgb, 0, "subsurface_radius_scale"],
    ["subsurfaceScale", 0, 0, "subsurface_radius"],
    ["subsurfaceAnisotropy", 0, 0, "subsurface_scatter_anisotropy"],
    ["coatFactor", 0, 0, "coat_weight"],
    ["coatColor", Flag.DefaultW1, 0, "coat_color"],
    ["coatRoughness", 0, 0, "coat_roughness"],
    ["coatAnisotropy", 0, 0, "coat_roughness_anisotropy"],
    ["coatIor", 0, 0, "coat_ior"],
    ["coatNormal", 0, 0, "coat_normal_map"],
    ["sheenFactor", 0, 0, "fuzz_weight"],
    ["sheenColor", Flag.DefaultW1, 0, "fuzz_color"],
    ["sheenRoughness", 0, 0, "fuzz_roughness"],
    ["emissionFactor", 0, 0, "emission_weight"],
    ["emissionFactor", Flag.MultiplyValue, 0, "emission_luminance"],
    ["emissionColor", Flag.DefaultW1, 0, "emission_color"],
    ["thinFilmFactor", 0, 0, "thin_film_weight"],
    ["thinFilmThickness", 0, 0, "thin_film_thickness"],
    ["thinFilmIor", 0, 0, "thin_film_ior"],
    ["normalMap", 0, 0, "bump"],
    ["normalMap", 0, 0, "bump_map_amt"],
    ["displacementMap", 0, 0, "displacement"],
    ["displacementMap", 0, 0, "displacement_map_amt"],
    ["coatNormal", 0, 0, "coat_bump"],
    ["coatNormal", 0, 0, "coat_bump_map_amt"],
    ["tangentMap", 0, 0, "geometry_tangent_map"],
    ["opacity", Flag.WidenToRgb, 0, "geometry_opacity"],
];
const OPENPBR_FEATURES: FeatureEntry[] = [["thinWalled", 0, "geometry_thin_walled"]];

const MAX_METAL_ROUGH_PBR: MapEntry[] = [
    ["baseColor", Flag.DefaultW1, 0, "base_color"],
    ["baseColor", Flag.DefaultW1, 0, "baseColor"],
    ["roughness", 0, 0, "roughness"],
    ["roughness", 0, 0, "Roughness_Map"],
    ["metalness", 0, 0, "metalness"],
    ["ambientOcclusion", 0, 0, "ao"],
    ["normalMap", 0, 0, "norm"],
    ["emissionColor", Flag.DefaultW1, 0, "emit_color"],
    ["displacementMap", 0, 0, "displacement"],
    ["displacementMap", 0, 0, "displacement_amt"],
    ["opacity", Flag.WidenToRgb, 0, "opacity"],
];
const MAX_SPEC_GLOSS_PBR: MapEntry[] = [
    ["baseColor", Flag.DefaultW1, 0, "base_color"],
    ["baseColor", Flag.DefaultW1, 0, "baseColor"],
    ["specularColor", Flag.DefaultW1, 0, "Specular"],
    ["specularColor", Flag.DefaultW1, 0, "specular"],
    ["roughness", 0, 0, "glossiness"],
    ["ambientOcclusion", 0, 0, "ao"],
    ["normalMap", 0, 0, "norm"],
    ["emissionColor", Flag.DefaultW1, 0, "emit_color"],
    ["displacementMap", 0, 0, "displacement"],
    ["displacementMap", 0, 0, "displacement_amt"],
    ["opacity", Flag.WidenToRgb, 0, "opacity"],
];
const MAX_PBR_FEATURES: FeatureEntry[] = [["roughnessAsGlossiness", FeatureFlag.IfAround1, "useGlossiness"]];

const SHADERFX_PBR: MapEntry[] = [
    ["baseColor", Flag.DefaultW1, 0, "color"],
    ["baseColor", Flag.DefaultW1, 0, "base_color"],
    ["roughness", 0, 0, "roughness"],
    ["metalness", 0, 0, "metallic"],
    ["normalMap", 0, 0, "normal"],
    ["emissionFactor", 0, 0, "emissive_intensity"],
    ["emissionColor", Flag.DefaultW1, 0, "emissive"],
    ["ambientOcclusion", 0, 0, "ao"],
];

const BLENDER_PHONG_PBR: MapEntry[] = [
    ["baseColor", Flag.DefaultW1, 0, "DiffuseColor"],
    ["opacity", Flag.WidenToRgb, Transform.BlenderOpacity, "TransparencyFactor"],
    ["emissionFactor", 0, 0, "EmissiveFactor"],
    ["emissionColor", Flag.DefaultW1, 0, "EmissiveColor"],
    ["roughness", 0, Transform.BlenderShininess, "Shininess"],
    ["roughness", 0, Transform.BlenderShininess, "ShininessExponent"],
    ["metalness", 0, 0, "ReflectionFactor"],
    ["normalMap", 0, 0, "NormalMap"],
];

interface ShaderTable {
    maps: MapEntry[];
    features: FeatureEntry[];
    defaultFeatures: FBXMaterialFeatureName[];
    texturePrefix?: string;
    textureSuffix?: string;
    textureEnabledPrefix?: string;
    textureEnabledSuffix?: string;
}

const PBR_COMMON: FBXMaterialFeatureName[] = ["pbr", "metalness", "diffuse", "specular", "coat", "sheen", "transmission", "opacity", "ior", "diffuseRoughness"];

const SHADER_TABLES: Record<FBXShaderType, ShaderTable> = {
    unknown: { maps: PHONG_PBR, features: [], defaultFeatures: ["diffuse", "specular", "emission", "transmission"] },
    fbxLambert: { maps: LAMBERT_PBR, features: [], defaultFeatures: ["diffuse", "emission", "transmission"] },
    fbxPhong: { maps: PHONG_PBR, features: [], defaultFeatures: ["diffuse", "specular", "emission", "transmission"] },
    oslStandardSurface: { maps: OSL_PBR, features: OSL_FEATURES, defaultFeatures: PBR_COMMON },
    arnoldStandardSurface: { maps: ARNOLD_PBR, features: ARNOLD_FEATURES, defaultFeatures: PBR_COMMON },
    "3dsMaxPhysicalMaterial": {
        maps: MAX_PHYSICAL_PBR,
        features: MAX_PHYSICAL_FEATURES,
        defaultFeatures: ["pbr", "metalness", "diffuse", "coat", "sheen", "transmission", "opacity", "ior"],
        textureSuffix: "_map",
        textureEnabledSuffix: "_map_on",
    },
    "3dsMaxPbrMetalRough": { maps: MAX_METAL_ROUGH_PBR, features: MAX_PBR_FEATURES, defaultFeatures: ["pbr", "metalness", "diffuse", "opacity"], textureSuffix: "_map" },
    "3dsMaxPbrSpecGloss": { maps: MAX_SPEC_GLOSS_PBR, features: MAX_PBR_FEATURES, defaultFeatures: ["pbr", "specular", "diffuse", "opacity"], textureSuffix: "_map" },
    gltfMaterial: {
        maps: GLTF_PBR,
        features: GLTF_FEATURES,
        defaultFeatures: ["pbr", "metalness", "diffuse", "emission", "opacity", "ambientOcclusion"],
        textureSuffix: "Map",
    },
    openPbrMaterial: { maps: OPENPBR_PBR, features: OPENPBR_FEATURES, defaultFeatures: PBR_COMMON, textureSuffix: "_map", textureEnabledSuffix: "_map_on" },
    shaderFxGraph: {
        maps: SHADERFX_PBR,
        features: [],
        defaultFeatures: ["pbr", "metalness", "diffuse", "emission", "ambientOcclusion"],
        texturePrefix: "TEX_",
        textureSuffix: "_map",
        textureEnabledPrefix: "use_",
        textureEnabledSuffix: "_map",
    },
    blenderPhong: { maps: BLENDER_PHONG_PBR, features: [], defaultFeatures: ["pbr", "metalness", "diffuse", "emission"] },
};

/** Shader types whose parameters are physically based; the loader emits PBR materials for them by default. */
export function isPbrShaderType(type: FBXShaderType): boolean {
    return type !== "unknown" && type !== "fbxLambert" && type !== "fbxPhong";
}

function applyTransform(transform: number, v: number[]): void {
    switch (transform) {
        case Transform.InvertX:
            v[0] = 1 - v[0];
            break;
        case Transform.UnknownShininess:
            // Roughness from a Phong exponent, the same heuristic the FBX SDK / ufbx uses.
            if (v[0] >= 0) {
                v[0] = 1 - Math.sqrt(v[0]) * 0.1;
                if (v[0] < 0) {
                    v[0] = 0;
                }
            }
            break;
        case Transform.BlenderOpacity:
            v[0] = 1 - v[0];
            break;
        case Transform.BlenderShininess:
            // Blender writes shininess = (1 - roughness)^2 * 1000
            v[0] = v[0] >= 0 ? 1 - Math.sqrt(v[0] / 1000) : 1;
            break;
        default:
            break;
    }
}

function numericValues(values: FBXPropertyValue[]): number[] {
    const out: number[] = [];
    for (const v of values) {
        if (typeof v === "number") {
            out.push(v);
        } else if (typeof v === "boolean") {
            out.push(v ? 1 : 0);
        } else {
            break;
        }
    }
    return out;
}

/** Detects the shader flavour of a material from its shading model name, connected shader and 3ds Max class ids. */
export function detectShaderType<T>(source: FBXMaterialSource<T>): { shaderType: FBXShaderType; shaderPropPrefix: string } {
    let shaderType: FBXShaderType = "unknown";
    const model = source.shadingModelName.toLowerCase();
    if (model === "lambert") {
        shaderType = "fbxLambert";
    } else if (model === "phong") {
        shaderType = "fbxPhong";
    }
    if (source.shader) {
        switch (source.shader.renderApi) {
            case "ARNOLD_SHADER_ID":
                return { shaderType: "arnoldStandardSurface", shaderPropPrefix: "" };
            case "OSL":
                return { shaderType: "oslStandardSurface", shaderPropPrefix: "" };
            case "SFX_PBS_SHADER":
                return { shaderType: "shaderFxGraph", shaderPropPrefix: "" };
            default:
                return { shaderType: "unknown", shaderPropPrefix: "" };
        }
    }
    if (shaderType === "unknown") {
        const a = (numericValues(source.props.get("3dsMax|ClassIDa")?.values ?? [])[0] ?? 0) >>> 0;
        const b = (numericValues(source.props.get("3dsMax|ClassIDb")?.values ?? [])[0] ?? 0) >>> 0;
        if (a === 0x3d6b1cec && b === 0xdeadc001) {
            return { shaderType: "3dsMaxPhysicalMaterial", shaderPropPrefix: "3dsMax|Parameters|" };
        }
        if (a === 0xf1551e33 && b === 0x37fb1337) {
            return { shaderType: "openPbrMaterial", shaderPropPrefix: "3dsMax|Parameters|" };
        }
        if (a === 0x38420192 && b === 0x45fe4e1b) {
            return { shaderType: "gltfMaterial", shaderPropPrefix: "3dsMax|" };
        }
        if (a === 0xd00f1e00 && b === 0xbe77e500) {
            return { shaderType: "3dsMaxPbrMetalRough", shaderPropPrefix: "3dsMax|main|" };
        }
        if (a === 0xd00f1e00 && b === 0x01dbad33) {
            return { shaderType: "3dsMaxPbrSpecGloss", shaderPropPrefix: "3dsMax|main|" };
        }
        if (source.blenderPbr) {
            return { shaderType: "blenderPhong", shaderPropPrefix: "" };
        }
    }
    return { shaderType, shaderPropPrefix: "" };
}

/**
 * Resolves the unified material model from raw material data.
 */
export function resolveMaterialModel<T>(source: FBXMaterialSource<T>): FBXMaterialModel<T> {
    const { shaderType, shaderPropPrefix } = detectShaderType(source);
    const table = SHADER_TABLES[shaderType];
    const model: FBXMaterialModel<T> = { shaderType, shaderPropPrefix, fbx: {}, pbr: {}, features: {} };

    for (const f of table.defaultFeatures) {
        model.features[f] = { enabled: true, explicit: false };
    }

    const materialPropsFor = (semantic: string): string[] => {
        const bound = source.shader?.bindings.get(semantic);
        return bound && bound.length > 0 ? bound : [semantic];
    };
    const prefix = source.shader ? "" : shaderPropPrefix;

    const fetch = (
        entries: MapEntry[],
        target: Partial<Record<string, FBXMaterialMap<T>>>,
        prefix2: string,
        suffix: string,
        wantValue: boolean,
        wantTexture: boolean,
        wantEnabled: boolean
    ) => {
        for (const [mapName, flags, transform, prop] of entries) {
            const semantic = prefix + prefix2 + prop + suffix;
            for (const name of materialPropsFor(semantic)) {
                const entry = source.props.get(name);
                const map = (target[mapName] ??= { valueComponents: 0, textureEnabled: false });
                if (wantValue && entry && entry.type !== "Reference") {
                    const nums = numericValues(entry.values);
                    if (nums.length > 0) {
                        const v = nums.slice(0, 4);
                        if (flags & Flag.MultiplyValue) {
                            v[0] *= map.value?.[0] ?? 1;
                            map.value = [v[0], ...(map.value?.slice(1) ?? [])];
                        } else {
                            map.value = v;
                        }
                        applyTransform(transform, map.value);
                        const components = nums.length >= 4 ? 4 : nums.length === 3 ? 3 : nums.length === 2 ? 2 : 1;
                        if (flags & Flag.DefaultW1 && components < 4) {
                            map.value[3] = 1;
                        }
                        if (flags & Flag.WidenToRgb && components === 1) {
                            map.value[1] = map.value[0];
                            map.value[2] = map.value[0];
                        }
                        map.valueComponents = components;
                    }
                }
                if (wantTexture) {
                    const texture = source.texturesByProp.get(name);
                    if (texture) {
                        map.texture = texture;
                        map.textureEnabled = true;
                    }
                }
                if (wantEnabled && entry) {
                    const nums = numericValues(entry.values);
                    if (nums.length > 0) {
                        map.textureEnabled = nums[0] !== 0;
                    }
                }
            }
        }
    };

    // Classic Lambert/Phong parameters are always read.
    fetch(BASE_FBX, model.fbx, "", "", true, true, false);
    // Shader specific parameters, textures with vendor prefix/suffix, and texture toggles.
    if (table.texturePrefix || table.textureSuffix) {
        fetch(table.maps, model.pbr, table.texturePrefix ?? "", table.textureSuffix ?? "", false, true, false);
    }
    fetch(table.maps, model.pbr, "", "", true, true, false);
    if (table.textureEnabledPrefix || table.textureEnabledSuffix) {
        fetch(table.maps, model.pbr, table.textureEnabledPrefix ?? "", table.textureEnabledSuffix ?? "", false, false, true);
    }
    // Feature toggles
    for (const [feature, flags, prop] of table.features) {
        const semantic = prefix + prop;
        for (const name of materialPropsFor(semantic)) {
            const entry = source.props.get(name);
            const info = (model.features[feature] ??= { enabled: false, explicit: false });
            if (entry && entry.type !== "Reference") {
                const nums = numericValues(entry.values);
                if (nums.length > 0) {
                    info.enabled = nums[0] !== 0;
                    info.explicit = true;
                    if (flags & FeatureFlag.IfAround1) {
                        info.enabled = nums[0] >= 0.5 && nums[0] <= 1.5;
                    }
                    if (flags & FeatureFlag.Inverted) {
                        info.enabled = !info.enabled;
                    }
                    if (flags & FeatureFlag.IfExists) {
                        info.enabled = true;
                    }
                }
            }
            if (flags & FeatureFlag.IfTexture && source.texturesByProp.has(name)) {
                info.enabled = true;
            }
        }
    }

    // Factors default to 1 when the matching colour is set and non-zero, 0 otherwise.
    const updateFactor = (target: Partial<Record<string, FBXMaterialMap<T>>>, factorName: string, colorName: string) => {
        const factor = (target[factorName] ??= { valueComponents: 0, textureEnabled: false });
        if (factor.value) {
            return;
        }
        const color = target[colorName];
        const nonZero = color?.value && color.value.some((c) => c !== 0);
        factor.value = [nonZero ? 1 : 0];
        factor.valueComponents = 1;
    };
    updateFactor(model.fbx, "diffuseFactor", "diffuseColor");
    updateFactor(model.fbx, "specularFactor", "specularColor");
    updateFactor(model.fbx, "reflectionFactor", "reflectionColor");
    updateFactor(model.fbx, "transparencyFactor", "transparencyColor");
    updateFactor(model.fbx, "emissionFactor", "emissionColor");
    updateFactor(model.fbx, "ambientFactor", "ambientColor");
    updateFactor(model.pbr, "baseFactor", "baseColor");
    updateFactor(model.pbr, "specularFactor", "specularColor");
    updateFactor(model.pbr, "emissionFactor", "emissionColor");
    updateFactor(model.pbr, "sheenFactor", "sheenColor");
    updateFactor(model.pbr, "thinFilmFactor", "thinFilmThickness");
    updateFactor(model.pbr, "transmissionFactor", "transmissionColor");

    if (!model.pbr.transmissionRoughness?.value && model.pbr.roughness?.value && model.pbr.transmissionExtraRoughness?.value) {
        model.pbr.transmissionRoughness = {
            value: [model.pbr.roughness.value[0] + model.pbr.transmissionExtraRoughness.value[0]],
            valueComponents: 1,
            textureEnabled: false,
        };
    }

    // Roughness <-> glossiness
    const remaps: [FBXMaterialFeatureName, FBXPbrMapName, FBXPbrMapName][] = [
        ["roughnessAsGlossiness", "roughness", "glossiness"],
        ["coatRoughnessAsGlossiness", "coatRoughness", "coatGlossiness"],
        ["transmissionRoughnessAsGlossiness", "transmissionRoughness", "transmissionGlossiness"],
    ];
    for (const [feature, roughName, glossName] of remaps) {
        const rough = model.pbr[roughName];
        if (model.features[feature]?.enabled) {
            if (rough) {
                model.pbr[glossName] = rough;
                model.pbr[roughName] = rough.value ? { value: [1 - rough.value[0]], valueComponents: 1, textureEnabled: false } : { valueComponents: 0, textureEnabled: false };
            }
        } else if (rough?.value) {
            model.pbr[glossName] = { value: [1 - rough.value[0]], valueComponents: 1, textureEnabled: false };
        }
    }

    return model;
}

/** Colour (first three components) of a map, or undefined. */
export function mapColor<T>(map: FBXMaterialMap<T> | undefined): [number, number, number] | undefined {
    if (!map?.value) {
        return undefined;
    }
    const v = map.value;
    if (map.valueComponents === 1) {
        return [v[0], v[0], v[0]];
    }
    return [v[0], v[1] ?? v[0], v[2] ?? v[0]];
}

/** Scalar (first component) of a map, or undefined. */
export function mapScalar<T>(map: FBXMaterialMap<T> | undefined): number | undefined {
    return map?.value ? map.value[0] : undefined;
}
