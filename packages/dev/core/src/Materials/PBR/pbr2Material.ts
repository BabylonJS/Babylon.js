/* eslint-disable @typescript-eslint/naming-convention */
import { serialize, serializeAsColor3, expandToProperty, serializeAsTexture } from "../../Misc/decorators";
import { GetEnvironmentBRDFTexture } from "../../Misc/brdfTextureTools";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Color3, Color4 } from "../../Maths/math.color";
import { ImageProcessingConfiguration } from "../imageProcessingConfiguration";
import type { BaseTexture } from "../Textures/baseTexture";
import { PBRBaseMaterial } from "./pbrBaseMaterial";
import { RegisterClass } from "../../Misc/typeStore";
import { Material } from "../material";
import { SerializationHelper } from "../../Misc/decorators.serialization";

import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Effect, IEffectCreationOptions } from "../../Materials/effect";
import { MaterialDefines } from "../materialDefines";
import { ImageProcessingDefinesMixin } from "../imageProcessingConfiguration.defines";
import { EffectFallbacks } from "../effectFallbacks";
import { AddClipPlaneUniforms } from "../clipPlaneMaterialHelper";
import {
    // BindBonesParameters,
    // BindFogParameters,
    // BindLights,
    // BindLogDepth,
    // BindMorphTargetParameters,
    // BindTextureMatrix,
    HandleFallbacksForShadows,
    PrepareAttributesForBakedVertexAnimation,
    PrepareAttributesForBones,
    PrepareAttributesForInstances,
    PrepareAttributesForMorphTargets,
    PrepareDefinesForAttributes,
    PrepareDefinesForFrameBoundValues,
    PrepareDefinesForLights,
    PrepareDefinesForIBL,
    PrepareDefinesForMergedUV,
    PrepareDefinesForMisc,
    PrepareDefinesForMultiview,
    PrepareDefinesForOIT,
    PrepareDefinesForPrePass,
    PrepareUniformsAndSamplersList,
    PrepareUniformsAndSamplersForIBL,
} from "../materialHelper.functions";
import { Constants } from "../../Engines/constants";
import { VertexBuffer } from "../../Buffers/buffer";
import { MaterialPluginEvent } from "../materialPluginEvent";
import { MaterialHelperGeometryRendering } from "../materialHelper.geometryrendering";
import { PrePassConfiguration } from "../prePassConfiguration";
import type { IMaterialCompilationOptions, ICustomShaderNameResolveOptions } from "../../Materials/material";
import { ShaderLanguage } from "../shaderLanguage";
import { MaterialFlags } from "../materialFlags";
import type { SubMesh } from "../../Meshes/subMesh";
import { Logger } from "core/Misc/logger";
import { UVDefinesMixin } from "../uv.defines";
import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";

const onCreatedEffectParameters = { effect: null as unknown as Effect, subMesh: null as unknown as Nullable<SubMesh> };

/**
 * Defines a property for the PBR2Material.
 */
class Property<T> {
    /**
     * Creates a new Property instance.
     * @param name The name of the property in the shader
     * @param defaultValue The default value of the property
     * @param value The current value of the property, defaults to defaultValue
     */
    constructor(
        public name: string,
        public defaultValue: T,
        public value: T = defaultValue
    ) {}

    /**
     * Returns the number of components of the property based on its type.
     */
    public get numComponents(): number {
        if (typeof this.defaultValue === "number") {
            return 1; // Single float
        } else if (this.defaultValue instanceof Color3) {
            return 3;
        } else if (this.defaultValue instanceof Color4) {
            return 4;
        } else if (this.defaultValue instanceof Vector2) {
            return 2;
        } else if (this.defaultValue instanceof Vector3) {
            return 3;
        } else if (this.defaultValue instanceof Vector4) {
            return 4;
        }
        return 0; // Default size for unsupported types
    }
}

class Sampler {
    constructor(
        public name: string, // Name in the shader
        public value: Nullable<BaseTexture> = null // Texture value, default to null
    ) {}
}

class PBR2MaterialDefinesBase extends UVDefinesMixin(MaterialDefines) {}
/**
 * Manages the defines for the PBR Material.
 * @internal
 */
export class PBR2MaterialDefines extends ImageProcessingDefinesMixin(PBR2MaterialDefinesBase) {
    public PBR = true;

    public NUM_SAMPLES = "0";
    public REALTIME_FILTERING = false;
    public IBL_CDF_FILTERING = false;

    public ALBEDO = false;
    public GAMMAALBEDO = false;
    public ALBEDODIRECTUV = 0;
    public VERTEXCOLOR = false;

    public BASE_WEIGHT = false;
    public BASE_DIFFUSE_ROUGHNESS = false;

    public BAKED_VERTEX_ANIMATION_TEXTURE = false;

    public AMBIENT = false;
    public AMBIENTDIRECTUV = 0;
    public AMBIENTINGRAYSCALE = false;

    public OPACITY = false;
    public VERTEXALPHA = false;
    public OPACITYDIRECTUV = 0;
    public OPACITYRGB = false;
    public ALPHATEST = false;
    public DEPTHPREPASS = false;
    public ALPHABLEND = false;
    public ALPHAFROMALBEDO = false;
    public ALPHATESTVALUE = "0.5";
    public SPECULAROVERALPHA = false;
    public RADIANCEOVERALPHA = false;
    public ALPHAFRESNEL = false;
    public LINEARALPHAFRESNEL = false;
    public PREMULTIPLYALPHA = false;

    public EMISSIVE = false;
    public EMISSIVEDIRECTUV = 0;
    public GAMMAEMISSIVE = false;

    public REFLECTIVITY = false;
    public REFLECTIVITY_GAMMA = false;
    public REFLECTIVITYDIRECTUV = 0;
    public SPECULARTERM = false;

    public MICROSURFACEFROMREFLECTIVITYMAP = false;
    public MICROSURFACEAUTOMATIC = false;
    public LODBASEDMICROSFURACE = false;
    public MICROSURFACEMAP = false;
    public MICROSURFACEMAPDIRECTUV = 0;

    public METALLICWORKFLOW = false;
    public ROUGHNESSSTOREINMETALMAPALPHA = false;
    public ROUGHNESSSTOREINMETALMAPGREEN = false;
    public METALLNESSSTOREINMETALMAPBLUE = false;
    public AOSTOREINMETALMAPRED = false;
    public METALLIC_REFLECTANCE = false;
    public METALLIC_REFLECTANCE_GAMMA = false;
    public METALLIC_REFLECTANCEDIRECTUV = 0;
    public METALLIC_REFLECTANCE_USE_ALPHA_ONLY = false;
    public REFLECTANCE = false;
    public REFLECTANCE_GAMMA = false;
    public REFLECTANCEDIRECTUV = 0;

    public ENVIRONMENTBRDF = false;
    public ENVIRONMENTBRDF_RGBD = false;

    public NORMAL = false;
    public TANGENT = false;
    public BUMP = false;
    public BUMPDIRECTUV = 0;
    public OBJECTSPACE_NORMALMAP = false;
    public PARALLAX = false;
    public PARALLAX_RHS = false;
    public PARALLAXOCCLUSION = false;
    public NORMALXYSCALE = true;

    public LIGHTMAP = false;
    public LIGHTMAPDIRECTUV = 0;
    public USELIGHTMAPASSHADOWMAP = false;
    public GAMMALIGHTMAP = false;
    public RGBDLIGHTMAP = false;

    public REFLECTION = false;
    public REFLECTIONMAP_3D = false;
    public REFLECTIONMAP_SPHERICAL = false;
    public REFLECTIONMAP_PLANAR = false;
    public REFLECTIONMAP_CUBIC = false;
    public USE_LOCAL_REFLECTIONMAP_CUBIC = false;
    public REFLECTIONMAP_PROJECTION = false;
    public REFLECTIONMAP_SKYBOX = false;
    public REFLECTIONMAP_EXPLICIT = false;
    public REFLECTIONMAP_EQUIRECTANGULAR = false;
    public REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
    public REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
    public INVERTCUBICMAP = false;
    public USESPHERICALFROMREFLECTIONMAP = false;
    public USEIRRADIANCEMAP = false;
    public USE_IRRADIANCE_DOMINANT_DIRECTION = false;
    public USESPHERICALINVERTEX = false;
    public REFLECTIONMAP_OPPOSITEZ = false;
    public LODINREFLECTIONALPHA = false;
    public GAMMAREFLECTION = false;
    public RGBDREFLECTION = false;
    public LINEARSPECULARREFLECTION = false;
    public RADIANCEOCCLUSION = false;
    public HORIZONOCCLUSION = false;

    public INSTANCES = false;
    public THIN_INSTANCES = false;
    public INSTANCESCOLOR = false;

    public PREPASS = false;
    public PREPASS_COLOR = false;
    public PREPASS_COLOR_INDEX = -1;
    public PREPASS_IRRADIANCE = false;
    public PREPASS_IRRADIANCE_INDEX = -1;
    public PREPASS_ALBEDO = false;
    public PREPASS_ALBEDO_INDEX = -1;
    public PREPASS_ALBEDO_SQRT = false;
    public PREPASS_ALBEDO_SQRT_INDEX = -1;
    public PREPASS_DEPTH = false;
    public PREPASS_DEPTH_INDEX = -1;
    public PREPASS_SCREENSPACE_DEPTH = false;
    public PREPASS_SCREENSPACE_DEPTH_INDEX = -1;
    public PREPASS_NORMALIZED_VIEW_DEPTH = false;
    public PREPASS_NORMALIZED_VIEW_DEPTH_INDEX = -1;
    public PREPASS_NORMAL = false;
    public PREPASS_NORMAL_INDEX = -1;
    public PREPASS_NORMAL_WORLDSPACE = false;
    public PREPASS_WORLD_NORMAL = false;
    public PREPASS_WORLD_NORMAL_INDEX = -1;
    public PREPASS_POSITION = false;
    public PREPASS_POSITION_INDEX = -1;
    public PREPASS_LOCAL_POSITION = false;
    public PREPASS_LOCAL_POSITION_INDEX = -1;
    public PREPASS_VELOCITY = false;
    public PREPASS_VELOCITY_INDEX = -1;
    public PREPASS_VELOCITY_LINEAR = false;
    public PREPASS_VELOCITY_LINEAR_INDEX = -1;
    public PREPASS_REFLECTIVITY = false;
    public PREPASS_REFLECTIVITY_INDEX = -1;
    public SCENE_MRT_COUNT = 0;

    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public BONETEXTURE = false;
    public BONES_VELOCITY_ENABLED = false;

    public NONUNIFORMSCALING = false;

    public MORPHTARGETS = false;
    public MORPHTARGETS_POSITION = false;
    public MORPHTARGETS_NORMAL = false;
    public MORPHTARGETS_TANGENT = false;
    public MORPHTARGETS_UV = false;
    public MORPHTARGETS_UV2 = false;
    public MORPHTARGETS_COLOR = false;
    public MORPHTARGETTEXTURE_HASPOSITIONS = false;
    public MORPHTARGETTEXTURE_HASNORMALS = false;
    public MORPHTARGETTEXTURE_HASTANGENTS = false;
    public MORPHTARGETTEXTURE_HASUVS = false;
    public MORPHTARGETTEXTURE_HASUV2S = false;
    public MORPHTARGETTEXTURE_HASCOLORS = false;
    public NUM_MORPH_INFLUENCERS = 0;
    public MORPHTARGETS_TEXTURE = false;

    public USEPHYSICALLIGHTFALLOFF = false;
    public USEGLTFLIGHTFALLOFF = false;
    public TWOSIDEDLIGHTING = false;
    public MIRRORED = false;
    public SHADOWFLOAT = false;
    public CLIPPLANE = false;
    public CLIPPLANE2 = false;
    public CLIPPLANE3 = false;
    public CLIPPLANE4 = false;
    public CLIPPLANE5 = false;
    public CLIPPLANE6 = false;
    public POINTSIZE = false;
    public FOG = false;
    public LOGARITHMICDEPTH = false;
    public CAMERA_ORTHOGRAPHIC = false;
    public CAMERA_PERSPECTIVE = false;
    public AREALIGHTSUPPORTED = true;

    public FORCENORMALFORWARD = false;

    public SPECULARAA = false;

    public UNLIT = false;

    public DECAL_AFTER_DETAIL = false;

    public DEBUGMODE = 0;

    /**
     * Initializes the PBR Material defines.
     * @param externalProperties The external properties
     */
    constructor(externalProperties?: { [name: string]: { type: string; default: any } }) {
        super(externalProperties);
        this.rebuild();
    }

    /**
     * Resets the PBR Material defines.
     */
    public override reset(): void {
        super.reset();
        this.ALPHATESTVALUE = "0.5";
        this.PBR = true;
        this.NORMALXYSCALE = true;
    }
}

// class PBR2MaterialBase extends ImageProcessingMixin(PBRBaseMaterial) {}
/**
 * The Physically based material of BJS.
 *
 * This offers the main features of a standard PBR material.
 * For more information, please refer to the documentation :
 * https://doc.babylonjs.com/features/featuresDeepDive/materials/using/introToPBR
 */
export class PBR2Material extends PBRBaseMaterial {
    /**
     * PBR2MaterialTransparencyMode: No transparency mode, Alpha channel is not use.
     */
    public static override readonly PBRMATERIAL_OPAQUE = PBRBaseMaterial.PBRMATERIAL_OPAQUE;

    /**
     * PBR2MaterialTransparencyMode: Alpha Test mode, pixel are discarded below a certain threshold defined by the alpha cutoff value.
     */
    public static override readonly PBRMATERIAL_ALPHATEST = PBRBaseMaterial.PBRMATERIAL_ALPHATEST;

    /**
     * PBR2MaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
     */
    public static override readonly PBRMATERIAL_ALPHABLEND = PBRBaseMaterial.PBRMATERIAL_ALPHABLEND;

    /**
     * PBR2MaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
     * They are also discarded below the alpha cutoff threshold to improve performances.
     */
    public static override readonly PBRMATERIAL_ALPHATESTANDBLEND = PBRBaseMaterial.PBRMATERIAL_ALPHATESTANDBLEND;

    /**
     * Defines the default value of how much AO map is occluding the analytical lights
     * (point spot...).
     */
    public static override DEFAULT_AO_ON_ANALYTICAL_LIGHTS = PBRBaseMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS;

    /**
     * Base Color uniform property.
     */
    get baseColor(): Color3 {
        return this._baseColor.value;
    }
    set baseColor(color: Color3) {
        this._baseColor.value = color;
    }
    private _baseColor: Property<Color3> = new Property<Color3>("baseColor", Color3.White());

    /**
     * Base Color Texture property.
     */
    get baseColorTexture(): Nullable<BaseTexture> {
        return this._baseColorTexture.value;
    }
    set baseColorTexture(texture: Nullable<BaseTexture>) {
        this._baseColorTexture.value = texture;
    }
    private _baseColorTexture: Sampler = new Sampler("baseColor");

    /**
     * Intensity of the direct lights e.g. the four lights available in your scene.
     * This impacts both the direct diffuse and specular highlights.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public directIntensity: number = 1.0;

    /**
     * Intensity of the emissive part of the material.
     * This helps controlling the emissive effect without modifying the emissive color.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public emissiveIntensity: number = 1.0;

    /**
     * Intensity of the environment e.g. how much the environment will light the object
     * either through harmonics for rough material or through the reflection for shiny ones.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public environmentIntensity: number = 1.0;

    /**
     * This is a special control allowing the reduction of the specular highlights coming from the
     * four lights of the scene. Those highlights may not be needed in full environment lighting.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public specularIntensity: number = 1.0;

    /**
     * Debug Control allowing disabling the bump map on this material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public disableBumpMap: boolean = false;

    /**
     * AKA Diffuse Texture in standard nomenclature.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public albedoTexture: Nullable<BaseTexture>;

    /**
     * OpenPBR Base Weight texture (multiplier to the diffuse and metal lobes).
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public baseWeightTexture: Nullable<BaseTexture>;

    /**
     * OpenPBR Base Diffuse Roughness texture (roughness of the diffuse lobe).
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public baseDiffuseRoughnessTexture: Nullable<BaseTexture>;

    /**
     * AKA Occlusion Texture in other nomenclature.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public ambientTexture: Nullable<BaseTexture>;

    /**
     * AKA Occlusion Texture Intensity in other nomenclature.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public ambientTextureStrength: number = 1.0;

    /**
     * Defines how much the AO map is occluding the analytical lights (point spot...).
     * 1 means it completely occludes it
     * 0 mean it has no impact
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public ambientTextureImpactOnAnalyticalLights: number = PBR2Material.DEFAULT_AO_ON_ANALYTICAL_LIGHTS;

    /**
     * Stores the alpha values in a texture. Use luminance if texture.getAlphaFromRGB is true.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
    public opacityTexture: Nullable<BaseTexture>;

    /**
     * Stores the reflection values in a texture.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectionTexture: Nullable<BaseTexture>;

    /**
     * Stores the emissive values in a texture.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public emissiveTexture: Nullable<BaseTexture>;

    /**
     * AKA Specular texture in other nomenclature.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectivityTexture: Nullable<BaseTexture>;

    /**
     * Used to switch from specular/glossiness to metallic/roughness workflow.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public metallicTexture: Nullable<BaseTexture>;

    /**
     * Specifies the metallic scalar of the metallic/roughness workflow.
     * Can also be used to scale the metalness values of the metallic texture.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public metallic: Nullable<number>;

    /**
     * Specifies the roughness scalar of the metallic/roughness workflow.
     * Can also be used to scale the roughness values of the metallic texture.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public roughness: Nullable<number>;

    /**
     * In metallic workflow, specifies an F0 factor to help configuring the material F0.
     * By default the indexOfrefraction is used to compute F0;
     *
     * This is used as a factor against the default reflectance at normal incidence to tweak it.
     *
     * F0 = defaultF0 * metallicF0Factor * metallicReflectanceColor;
     * F90 = metallicReflectanceColor;
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public metallicF0Factor = 1;

    /**
     * In metallic workflow, specifies an F0 color.
     * By default the F90 is always 1;
     *
     * Please note that this factor is also used as a factor against the default reflectance at normal incidence.
     *
     * F0 = defaultF0_from_IOR * metallicF0Factor * metallicReflectanceColor
     * F90 = metallicF0Factor;
     */
    @serializeAsColor3()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public metallicReflectanceColor = Color3.White();

    /**
     * Specifies that only the A channel from metallicReflectanceTexture should be used.
     * If false, both RGB and A channels will be used
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useOnlyMetallicFromMetallicReflectanceTexture = false;

    /**
     * Defines to store metallicReflectanceColor in RGB and metallicF0Factor in A
     * This is multiplied against the scalar values defined in the material.
     * If useOnlyMetallicFromMetallicReflectanceTexture is true, don't use the RGB channels, only A
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public metallicReflectanceTexture: Nullable<BaseTexture>;

    /**
     * Defines to store reflectanceColor in RGB
     * This is multiplied against the scalar values defined in the material.
     * If both reflectanceTexture and metallicReflectanceTexture textures are provided and useOnlyMetallicFromMetallicReflectanceTexture
     * is false, metallicReflectanceTexture takes priority and reflectanceTexture is not used
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectanceTexture: Nullable<BaseTexture>;

    /**
     * Used to enable roughness/glossiness fetch from a separate channel depending on the current mode.
     * Gray Scale represents roughness in metallic mode and glossiness in specular mode.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public microSurfaceTexture: Nullable<BaseTexture>;

    /**
     * Stores surface normal data used to displace a mesh in a texture.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public bumpTexture: Nullable<BaseTexture>;

    /**
     * Stores the pre-calculated light information of a mesh in a texture.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty", null)
    public lightmapTexture: Nullable<BaseTexture>;

    /**
     * Stores the refracted light information in a texture.
     */
    public get refractionTexture(): Nullable<BaseTexture> {
        return this.subSurface.refractionTexture;
    }
    public set refractionTexture(value: Nullable<BaseTexture>) {
        this.subSurface.refractionTexture = value;
        if (value) {
            this.subSurface.isRefractionEnabled = true;
        } else if (!this.subSurface.linkRefractionWithTransparency) {
            this.subSurface.isRefractionEnabled = false;
        }
    }

    /**
     * The color of a material in ambient lighting.
     */
    @serializeAsColor3("ambient")
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public ambientColor = new Color3(0, 0, 0);

    /**
     * AKA Diffuse Color in other nomenclature.
     */
    @serializeAsColor3("albedo")
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public albedoColor = new Color3(1, 1, 1);

    /**
     * OpenPBR Base Weight (multiplier to the diffuse and metal lobes).
     */
    @serialize("baseWeight")
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public baseWeight = 1;

    /**
     * OpenPBR Base Diffuse Roughness (roughness of the diffuse lobe).
     */
    @serialize("baseDiffuseRoughness")
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public baseDiffuseRoughness: Nullable<number>;

    /**
     * AKA Specular Color in other nomenclature.
     */
    @serializeAsColor3("reflectivity")
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectivityColor = new Color3(1, 1, 1);

    /**
     * The color reflected from the material.
     */
    @serializeAsColor3("reflection")
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectionColor = new Color3(1.0, 1.0, 1.0);

    /**
     * The color emitted from the material.
     */
    @serializeAsColor3("emissive")
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public emissiveColor = new Color3(0, 0, 0);

    /**
     * AKA Glossiness in other nomenclature.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public microSurface = 1.0;

    /**
     * Index of refraction of the material base layer.
     * https://en.wikipedia.org/wiki/List_of_refractive_indices
     *
     * This does not only impact refraction but also the Base F0 of Dielectric Materials.
     *
     * From dielectric fresnel rules: F0 = square((iorT - iorI) / (iorT + iorI))
     */
    public get indexOfRefraction(): number {
        return this.subSurface.indexOfRefraction;
    }
    public set indexOfRefraction(value: number) {
        this.subSurface.indexOfRefraction = value;
    }

    /**
     * Controls if refraction needs to be inverted on Y. This could be useful for procedural texture.
     */
    public get invertRefractionY(): boolean {
        return this.subSurface.invertRefractionY;
    }
    public set invertRefractionY(value: boolean) {
        this.subSurface.invertRefractionY = value;
    }

    /**
     * This parameters will make the material used its opacity to control how much it is refracting against not.
     * Materials half opaque for instance using refraction could benefit from this control.
     */
    public get linkRefractionWithTransparency(): boolean {
        return this.subSurface.linkRefractionWithTransparency;
    }
    public set linkRefractionWithTransparency(value: boolean) {
        this.subSurface.linkRefractionWithTransparency = value;
        if (value) {
            this.subSurface.isRefractionEnabled = true;
        }
    }

    /**
     * If true, the light map contains occlusion information instead of lighting info.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useLightmapAsShadowmap = false;

    /**
     * Specifies that the alpha is coming form the albedo channel alpha channel for alpha blending.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
    public useAlphaFromAlbedoTexture = false;

    /**
     * Enforces alpha test in opaque or blend mode in order to improve the performances of some situations.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
    public forceAlphaTest = false;

    /**
     * Defines the alpha limits in alpha test mode.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
    public alphaCutOff = 0.4;

    /**
     * Specifies that the material will keep the specular highlights over a transparent surface (only the most luminous ones).
     * A car glass is a good example of that. When sun reflects on it you can not see what is behind.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useSpecularOverAlpha = true;

    /**
     * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useMicroSurfaceFromReflectivityMapAlpha = false;

    /**
     * Specifies if the metallic texture contains the roughness information in its alpha channel.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useRoughnessFromMetallicTextureAlpha = true;

    /**
     * Specifies if the metallic texture contains the roughness information in its green channel.
     * Needs useRoughnessFromMetallicTextureAlpha to be false.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useRoughnessFromMetallicTextureGreen = false;

    /**
     * Specifies if the metallic texture contains the metallness information in its blue channel.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useMetallnessFromMetallicTextureBlue = false;

    /**
     * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useAmbientOcclusionFromMetallicTextureRed = false;

    /**
     * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useAmbientInGrayScale = false;

    /**
     * In case the reflectivity map does not contain the microsurface information in its alpha channel,
     * The material will try to infer what glossiness each pixel should be.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useAutoMicroSurfaceFromReflectivityMap = false;

    /**
     * BJS is using an hardcoded light falloff based on a manually sets up range.
     * In PBR, one way to represents the falloff is to use the inverse squared root algorithm.
     * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
     */
    @serialize()
    public get usePhysicalLightFalloff(): boolean {
        return this._lightFalloff === PBRBaseMaterial.LIGHTFALLOFF_PHYSICAL;
    }

    /**
     * BJS is using an hardcoded light falloff based on a manually sets up range.
     * In PBR, one way to represents the falloff is to use the inverse squared root algorithm.
     * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
     */
    public set usePhysicalLightFalloff(value: boolean) {
        if (value !== this.usePhysicalLightFalloff) {
            // Ensure the effect will be rebuilt.
            this._markAllSubMeshesAsTexturesDirty();

            if (value) {
                this._lightFalloff = PBRBaseMaterial.LIGHTFALLOFF_PHYSICAL;
            } else {
                this._lightFalloff = PBRBaseMaterial.LIGHTFALLOFF_STANDARD;
            }
        }
    }

    /**
     * In order to support the falloff compatibility with gltf, a special mode has been added
     * to reproduce the gltf light falloff.
     */
    @serialize()
    public get useGLTFLightFalloff(): boolean {
        return this._lightFalloff === PBRBaseMaterial.LIGHTFALLOFF_GLTF;
    }

    /**
     * In order to support the falloff compatibility with gltf, a special mode has been added
     * to reproduce the gltf light falloff.
     */
    public set useGLTFLightFalloff(value: boolean) {
        if (value !== this.useGLTFLightFalloff) {
            // Ensure the effect will be rebuilt.
            this._markAllSubMeshesAsTexturesDirty();

            if (value) {
                this._lightFalloff = PBRBaseMaterial.LIGHTFALLOFF_GLTF;
            } else {
                this._lightFalloff = PBRBaseMaterial.LIGHTFALLOFF_STANDARD;
            }
        }
    }

    /**
     * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most luminous ones).
     * A car glass is a good example of that. When the street lights reflects on it you can not see what is behind.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useRadianceOverAlpha = true;

    /**
     * Allows using an object space normal map (instead of tangent space).
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useObjectSpaceNormalMap = false;

    /**
     * Allows using the bump map in parallax mode.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useParallax = false;

    /**
     * Allows using the bump map in parallax occlusion mode.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useParallaxOcclusion = false;

    /**
     * Controls the scale bias of the parallax mode.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public parallaxScaleBias = 0.05;

    /**
     * If sets to true, disables all the lights affecting the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsLightsDirty")
    public disableLighting = false;

    /**
     * Force the shader to compute irradiance in the fragment shader in order to take bump in account.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public forceIrradianceInFragment = false;

    /**
     * Number of Simultaneous lights allowed on the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsLightsDirty")
    public maxSimultaneousLights = 4;

    /**
     * If sets to true, x component of normal map value will invert (x = 1.0 - x).
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public invertNormalMapX = false;

    /**
     * If sets to true, y component of normal map value will invert (y = 1.0 - y).
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public invertNormalMapY = false;

    /**
     * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public twoSidedLighting = false;

    /**
     * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
     * And/Or occlude the blended part. (alpha is converted to gamma to compute the fresnel)
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useAlphaFresnel = false;

    /**
     * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
     * And/Or occlude the blended part. (alpha stays linear to compute the fresnel)
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useLinearAlphaFresnel = false;

    /**
     * Let user defines the brdf lookup texture used for IBL.
     * A default 8bit version is embedded but you could point at :
     * * Default texture: https://assets.babylonjs.com/environments/correlatedMSBRDF_RGBD.png
     * * Default 16bit pixel depth texture: https://assets.babylonjs.com/environments/correlatedMSBRDF.dds
     * * LEGACY Default None correlated https://assets.babylonjs.com/environments/uncorrelatedBRDF_RGBD.png
     * * LEGACY Default None correlated 16bit pixel depth https://assets.babylonjs.com/environments/uncorrelatedBRDF.dds
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public environmentBRDFTexture: Nullable<BaseTexture> = null;

    /**
     * Force normal to face away from face.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public forceNormalForward = false;

    /**
     * Enables specular anti aliasing in the PBR shader.
     * It will both interacts on the Geometry for analytical and IBL lighting.
     * It also prefilter the roughness map based on the bump values.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public enableSpecularAntiAliasing = false;

    /**
     * This parameters will enable/disable Horizon occlusion to prevent normal maps to look shiny when the normal
     * makes the reflect vector face the model (under horizon).
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useHorizonOcclusion = true;

    /**
     * This parameters will enable/disable radiance occlusion by preventing the radiance to lit
     * too much the area relying on ambient texture to define their ambient occlusion.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useRadianceOcclusion = true;

    /**
     * If set to true, no lighting calculations will be applied.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public unlit = false;

    /**
     * If sets to true, the decal map will be applied after the detail map. Else, it is applied before (default: false)
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public applyDecalMapAfterDetailMap = false;

    /**
     * Instantiates a new PBR2Material instance.
     *
     * @param name The material name
     * @param scene The scene the material will be use in.
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name: string, scene?: Scene, forceGLSL = false) {
        super(name, scene, forceGLSL);
        this._environmentBRDFTexture = GetEnvironmentBRDFTexture(this.getScene());
    }

    /**
     * @returns the name of this material class.
     */
    public override getClassName(): string {
        return "gi";
    }

    /**
     * Makes a duplicate of the current material.
     * @param name - name to use for the new material.
     * @param cloneTexturesOnlyOnce - if a texture is used in more than one channel (e.g diffuse and opacity), only clone it once and reuse it on the other channels. Default false.
     * @param rootUrl defines the root URL to use to load textures
     * @returns cloned material instance
     */
    public override clone(name: string, cloneTexturesOnlyOnce: boolean = true, rootUrl = ""): PBR2Material {
        const clone = SerializationHelper.Clone(() => new PBR2Material(name, this.getScene()), this, { cloneTexturesOnlyOnce });

        clone.id = name;
        clone.name = name;

        this.stencil.copyTo(clone.stencil);

        this._clonePlugins(clone, rootUrl);

        return clone;
    }

    /**
     * Serializes this PBR Material.
     * @returns - An object with the serialized material.
     */
    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.PBR2Material";

        return serializationObject;
    }

    // Statics
    /**
     * Parses a PBR Material from a serialized object.
     * @param source - Serialized object.
     * @param scene - BJS scene instance.
     * @param rootUrl - url for the scene object
     * @returns - PBR2Material
     */
    public static override Parse(source: any, scene: Scene, rootUrl: string): PBR2Material {
        const material = SerializationHelper.Parse(() => new PBR2Material(source.name, scene), source, scene, rootUrl);

        if (source.stencil) {
            material.stencil.parse(source.stencil, scene, rootUrl);
        }

        Material._ParsePlugins(source, material, scene, rootUrl);

        // The code block below ensures backward compatibility with serialized materials before plugins are automatically serialized.
        if (source.clearCoat) {
            material.clearCoat.parse(source.clearCoat, scene, rootUrl);
        }
        if (source.anisotropy) {
            material.anisotropy.parse(source.anisotropy, scene, rootUrl);
        }
        if (source.brdf) {
            material.brdf.parse(source.brdf, scene, rootUrl);
        }
        if (source.sheen) {
            material.sheen.parse(source.sheen, scene, rootUrl);
        }
        if (source.subSurface) {
            material.subSurface.parse(source.subSurface, scene, rootUrl);
        }
        if (source.iridescence) {
            material.iridescence.parse(source.iridescence, scene, rootUrl);
        }

        return material;
    }

    /**
     * Force shader compilation
     * @param mesh - Define the mesh we want to force the compilation for
     * @param onCompiled - Define a callback triggered when the compilation completes
     * @param options - Define the options used to create the compilation
     */
    public override forceCompilation(mesh: AbstractMesh, onCompiled?: (material: Material) => void, options?: Partial<IMaterialCompilationOptions>): void {
        const localOptions = {
            clipPlane: false,
            useInstances: false,
            ...options,
        };

        if (!this._uniformBufferLayoutBuilt) {
            this.buildUniformLayout();
        }

        this._callbackPluginEventGeneric(MaterialPluginEvent.GetDefineNames, this._eventInfo);
        const checkReady = () => {
            if (this._breakShaderLoadedCheck2) {
                return;
            }
            const defines = new PBR2MaterialDefines(this._eventInfo.defineNames);
            const effect = this._prepareEffect2(mesh, defines, undefined, undefined, localOptions.useInstances, localOptions.clipPlane, mesh.hasThinInstances)!;
            if (this._onEffectCreatedObservable) {
                onCreatedEffectParameters.effect = effect;
                onCreatedEffectParameters.subMesh = null;
                this._onEffectCreatedObservable.notifyObservers(onCreatedEffectParameters);
            }
            if (effect.isReady()) {
                if (onCompiled) {
                    onCompiled(this);
                }
            } else {
                effect.onCompileObservable.add(() => {
                    if (onCompiled) {
                        onCompiled(this);
                    }
                });
            }
        };
        checkReady();
    }

    /**
     * Specifies that the submesh is ready to be used.
     * @param mesh - BJS mesh.
     * @param subMesh - A submesh of the BJS mesh.  Used to check if it is ready.
     * @param useInstances - Specifies that instances should be used.
     * @returns - boolean indicating that the submesh is ready or not.
     */
    public override isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        if (!this._uniformBufferLayoutBuilt) {
            this.buildUniformLayout();
        }

        const drawWrapper = subMesh._drawWrapper;

        if (drawWrapper.effect && this.isFrozen) {
            if (drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            this._callbackPluginEventGeneric(MaterialPluginEvent.GetDefineNames, this._eventInfo);
            subMesh.materialDefines = new PBR2MaterialDefines(this._eventInfo.defineNames);
        }

        const defines = <PBR2MaterialDefines>subMesh.materialDefines;
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const scene = this.getScene();
        const engine = scene.getEngine();

        if (defines._areTexturesDirty) {
            this._eventInfo.hasRenderTargetTextures = false;
            this._callbackPluginEventHasRenderTargetTextures(this._eventInfo);
            this._cacheHasRenderTargetTextures = this._eventInfo.hasRenderTargetTextures;
            if (scene.texturesEnabled) {
                if (this._albedoTexture && MaterialFlags.DiffuseTextureEnabled) {
                    if (!this._albedoTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }

                if (this._baseWeightTexture && MaterialFlags.BaseWeightTextureEnabled) {
                    if (!this._baseWeightTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }

                if (this._baseDiffuseRoughnessTexture && MaterialFlags.BaseDiffuseRoughnessTextureEnabled) {
                    if (!this._baseDiffuseRoughnessTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }

                if (this._ambientTexture && MaterialFlags.AmbientTextureEnabled) {
                    if (!this._ambientTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }

                if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                    if (!this._opacityTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }

                const reflectionTexture = this._getReflectionTexture2();
                if (reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
                    if (!reflectionTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                    if (reflectionTexture.irradianceTexture) {
                        if (!reflectionTexture.irradianceTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                    } else {
                        // Not ready until spherical are ready too.
                        if (!reflectionTexture.sphericalPolynomial && reflectionTexture.getInternalTexture()?._sphericalPolynomialPromise) {
                            return false;
                        }
                    }
                }

                if (this._lightmapTexture && MaterialFlags.LightmapTextureEnabled) {
                    if (!this._lightmapTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }

                if (this._emissiveTexture && MaterialFlags.EmissiveTextureEnabled) {
                    if (!this._emissiveTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }

                if (MaterialFlags.SpecularTextureEnabled) {
                    if (this._metallicTexture) {
                        if (!this._metallicTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                    } else if (this._reflectivityTexture) {
                        if (!this._reflectivityTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                    }

                    if (this._metallicReflectanceTexture) {
                        if (!this._metallicReflectanceTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                    }

                    if (this._reflectanceTexture) {
                        if (!this._reflectanceTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                    }

                    if (this._microSurfaceTexture) {
                        if (!this._microSurfaceTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                    }
                }

                if (engine.getCaps().standardDerivatives && this._bumpTexture && MaterialFlags.BumpTextureEnabled && !this._disableBumpMap) {
                    // Bump texture cannot be not blocking.
                    if (!this._bumpTexture.isReady()) {
                        return false;
                    }
                }

                if (this._environmentBRDFTexture && MaterialFlags.ReflectionTextureEnabled) {
                    // This is blocking.
                    if (!this._environmentBRDFTexture.isReady()) {
                        return false;
                    }
                }
            }
        }

        this._eventInfo.isReadyForSubMesh = true;
        this._eventInfo.defines = defines;
        this._eventInfo.subMesh = subMesh;
        this._callbackPluginEventIsReadyForSubMesh(this._eventInfo);

        if (!this._eventInfo.isReadyForSubMesh) {
            return false;
        }

        if (defines._areImageProcessingDirty && this._imageProcessingConfiguration) {
            if (!this._imageProcessingConfiguration.isReady()) {
                return false;
            }
        }

        // Check if Area Lights have LTC texture.
        if (defines["AREALIGHTUSED"]) {
            for (let index = 0; index < mesh.lightSources.length; index++) {
                if (!mesh.lightSources[index]._isReady()) {
                    return false;
                }
            }
        }

        if (!engine.getCaps().standardDerivatives && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
            mesh.createNormals(true);
            Logger.Warn("PBR2Material: Normals have been created for the mesh: " + mesh.name);
        }

        const previousEffect = subMesh.effect;
        const lightDisposed = defines._areLightsDisposed;
        let effect = this._prepareEffect2(mesh, defines, this.onCompiled, this.onError, useInstances, null, subMesh.getRenderingMesh().hasThinInstances);

        let forceWasNotReadyPreviously = false;

        if (effect) {
            if (this._onEffectCreatedObservable) {
                onCreatedEffectParameters.effect = effect;
                onCreatedEffectParameters.subMesh = subMesh;
                this._onEffectCreatedObservable.notifyObservers(onCreatedEffectParameters);
            }

            // Use previous effect while new one is compiling
            if (this.allowShaderHotSwapping && previousEffect && !effect.isReady()) {
                effect = previousEffect;
                defines.markAsUnprocessed();

                forceWasNotReadyPreviously = this.isFrozen;

                if (lightDisposed) {
                    // re register in case it takes more than one frame.
                    defines._areLightsDisposed = true;
                    return false;
                }
            } else {
                scene.resetCachedMaterial();
                subMesh.setEffect(effect, defines, this._materialContext);
            }
        }

        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = forceWasNotReadyPreviously ? false : true;
        drawWrapper._wasPreviouslyUsingInstances = !!useInstances;

        this._checkScenePerformancePriority();

        return true;
    }

    private _prepareEffect2(
        mesh: AbstractMesh,
        defines: PBR2MaterialDefines,
        onCompiled: Nullable<(effect: Effect) => void> = null,
        onError: Nullable<(effect: Effect, errors: string) => void> = null,
        useInstances: Nullable<boolean> = null,
        useClipPlane: Nullable<boolean> = null,
        useThinInstances: boolean
    ): Nullable<Effect> {
        this._prepareDefines2(mesh, defines, useInstances, useClipPlane, useThinInstances);

        if (!defines.isDirty) {
            return null;
        }

        defines.markAsProcessed();

        const scene = this.getScene();
        const engine = scene.getEngine();

        // Fallbacks
        const fallbacks = new EffectFallbacks();
        let fallbackRank = 0;
        if (defines.USESPHERICALINVERTEX) {
            fallbacks.addFallback(fallbackRank++, "USESPHERICALINVERTEX");
        }

        if (defines.FOG) {
            fallbacks.addFallback(fallbackRank, "FOG");
        }
        if (defines.SPECULARAA) {
            fallbacks.addFallback(fallbackRank, "SPECULARAA");
        }
        if (defines.POINTSIZE) {
            fallbacks.addFallback(fallbackRank, "POINTSIZE");
        }
        if (defines.LOGARITHMICDEPTH) {
            fallbacks.addFallback(fallbackRank, "LOGARITHMICDEPTH");
        }
        if (defines.PARALLAX) {
            fallbacks.addFallback(fallbackRank, "PARALLAX");
        }
        if (defines.PARALLAX_RHS) {
            fallbacks.addFallback(fallbackRank, "PARALLAX_RHS");
        }
        if (defines.PARALLAXOCCLUSION) {
            fallbacks.addFallback(fallbackRank++, "PARALLAXOCCLUSION");
        }

        if (defines.ENVIRONMENTBRDF) {
            fallbacks.addFallback(fallbackRank++, "ENVIRONMENTBRDF");
        }

        if (defines.TANGENT) {
            fallbacks.addFallback(fallbackRank++, "TANGENT");
        }

        if (defines.BUMP) {
            fallbacks.addFallback(fallbackRank++, "BUMP");
        }

        fallbackRank = HandleFallbacksForShadows(defines, fallbacks, this._maxSimultaneousLights, fallbackRank++);

        if (defines.SPECULARTERM) {
            fallbacks.addFallback(fallbackRank++, "SPECULARTERM");
        }

        if (defines.USESPHERICALFROMREFLECTIONMAP) {
            fallbacks.addFallback(fallbackRank++, "USESPHERICALFROMREFLECTIONMAP");
        }

        if (defines.USEIRRADIANCEMAP) {
            fallbacks.addFallback(fallbackRank++, "USEIRRADIANCEMAP");
        }

        if (defines.LIGHTMAP) {
            fallbacks.addFallback(fallbackRank++, "LIGHTMAP");
        }

        if (defines.NORMAL) {
            fallbacks.addFallback(fallbackRank++, "NORMAL");
        }

        if (defines.AMBIENT) {
            fallbacks.addFallback(fallbackRank++, "AMBIENT");
        }

        if (defines.EMISSIVE) {
            fallbacks.addFallback(fallbackRank++, "EMISSIVE");
        }

        if (defines.VERTEXCOLOR) {
            fallbacks.addFallback(fallbackRank++, "VERTEXCOLOR");
        }

        if (defines.MORPHTARGETS) {
            fallbacks.addFallback(fallbackRank++, "MORPHTARGETS");
        }

        if (defines.MULTIVIEW) {
            fallbacks.addFallback(0, "MULTIVIEW");
        }

        //Attributes
        const attribs = [VertexBuffer.PositionKind];

        if (defines.NORMAL) {
            attribs.push(VertexBuffer.NormalKind);
        }

        if (defines.TANGENT) {
            attribs.push(VertexBuffer.TangentKind);
        }

        for (let i = 1; i <= Constants.MAX_SUPPORTED_UV_SETS; ++i) {
            if (defines["UV" + i]) {
                attribs.push(`uv${i === 1 ? "" : i}`);
            }
        }

        if (defines.VERTEXCOLOR) {
            attribs.push(VertexBuffer.ColorKind);
        }

        PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
        PrepareAttributesForInstances(attribs, defines);
        PrepareAttributesForMorphTargets(attribs, mesh, defines);
        PrepareAttributesForBakedVertexAnimation(attribs, mesh, defines);

        let shaderName = "pbr2";

        const uniforms = [
            "world",
            "view",
            "viewProjection",
            "vEyePosition",
            "vLightsType",
            "vAmbientColor",
            "vAlbedoColor",
            "baseWeight",
            "baseDiffuseRoughness",
            "vReflectivityColor",
            "vMetallicReflectanceFactors",
            "vEmissiveColor",
            "visibility",
            "vFogInfos",
            "vFogColor",
            "pointSize",
            "vAlbedoInfos",
            "vBaseWeightInfos",
            "vBaseDiffuseRoughnessInfos",
            "vAmbientInfos",
            "vOpacityInfos",
            "vEmissiveInfos",
            "vReflectivityInfos",
            "vMetallicReflectanceInfos",
            "vReflectanceInfos",
            "vMicroSurfaceSamplerInfos",
            "vBumpInfos",
            "vLightmapInfos",
            "mBones",
            "albedoMatrix",
            "baseWeightMatrix",
            "baseDiffuseRoughnessMatrix",
            "ambientMatrix",
            "opacityMatrix",
            "emissiveMatrix",
            "reflectivityMatrix",
            "normalMatrix",
            "microSurfaceSamplerMatrix",
            "bumpMatrix",
            "lightmapMatrix",
            "metallicReflectanceMatrix",
            "reflectanceMatrix",
            "vLightingIntensity",
            "logarithmicDepthConstant",
            "vTangentSpaceParams",
            "boneTextureWidth",
            "vDebugMode",
            "morphTargetTextureInfo",
            "morphTargetTextureIndices",
            "cameraInfo",
        ];

        const samplers = [
            "albedoSampler",
            "baseWeightSampler",
            "baseDiffuseRoughnessSampler",
            "reflectivitySampler",
            "ambientSampler",
            "emissiveSampler",
            "bumpSampler",
            "lightmapSampler",
            "opacitySampler",
            "microSurfaceSampler",
            "environmentBrdfSampler",
            "boneSampler",
            "metallicReflectanceSampler",
            "reflectanceSampler",
            "morphTargets",
            "oitDepthSampler",
            "oitFrontColorSampler",
            "areaLightsLTC1Sampler",
            "areaLightsLTC2Sampler",
        ];

        PrepareUniformsAndSamplersForIBL(uniforms, samplers, true);

        const uniformBuffers = ["Material", "Scene", "Mesh"];

        const indexParameters = { maxSimultaneousLights: this._maxSimultaneousLights, maxSimultaneousMorphTargets: defines.NUM_MORPH_INFLUENCERS };

        this._eventInfo.fallbacks = fallbacks;
        this._eventInfo.fallbackRank = fallbackRank;
        this._eventInfo.defines = defines;
        this._eventInfo.uniforms = uniforms;
        this._eventInfo.attributes = attribs;
        this._eventInfo.samplers = samplers;
        this._eventInfo.uniformBuffersNames = uniformBuffers;
        this._eventInfo.customCode = undefined;
        this._eventInfo.mesh = mesh;
        this._eventInfo.indexParameters = indexParameters;
        this._callbackPluginEventGeneric(MaterialPluginEvent.PrepareEffect, this._eventInfo);

        MaterialHelperGeometryRendering.AddUniformsAndSamplers(uniforms, samplers);

        PrePassConfiguration.AddUniforms(uniforms);
        PrePassConfiguration.AddSamplers(samplers);
        AddClipPlaneUniforms(uniforms);

        if (ImageProcessingConfiguration) {
            ImageProcessingConfiguration.PrepareUniforms(uniforms, defines);
            ImageProcessingConfiguration.PrepareSamplers(samplers, defines);
        }

        PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
            uniformsNames: uniforms,
            uniformBuffersNames: uniformBuffers,
            samplers: samplers,
            defines: defines,
            maxSimultaneousLights: this._maxSimultaneousLights,
        });

        const csnrOptions: ICustomShaderNameResolveOptions = {};

        if (this.customShaderNameResolve) {
            shaderName = this.customShaderNameResolve(shaderName, uniforms, uniformBuffers, samplers, defines, attribs, csnrOptions);
        }

        const join = defines.toString();
        const effect = engine.createEffect(
            shaderName,
            <IEffectCreationOptions>{
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: join,
                fallbacks: fallbacks,
                onCompiled: onCompiled,
                onError: onError,
                indexParameters,
                processFinalCode: csnrOptions.processFinalCode,
                processCodeAfterIncludes: this._eventInfo.customCode,
                multiTarget: defines.PREPASS,
                shaderLanguage: this._shaderLanguage,
                extraInitializationsAsync: this._shadersLoaded2
                    ? undefined
                    : async () => {
                          if (this.shaderLanguage === ShaderLanguage.WGSL) {
                              await Promise.all([import("../../ShadersWGSL/pbr2.vertex"), import("../../ShadersWGSL/pbr2.fragment")]);
                          } else {
                              await Promise.all([import("../../Shaders/pbr2.vertex"), import("../../Shaders/pbr2.fragment")]);
                          }

                          this._shadersLoaded2 = true;
                      },
            },
            engine
        );

        this._eventInfo.customCode = undefined;

        return effect;
    }

    private _prepareDefines2(
        mesh: AbstractMesh,
        defines: PBR2MaterialDefines,
        useInstances: Nullable<boolean> = null,
        useClipPlane: Nullable<boolean> = null,
        useThinInstances: boolean = false
    ): void {
        const scene = this.getScene();
        const engine = scene.getEngine();

        // Lights
        PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
        defines._needNormals = true;

        // Multiview
        PrepareDefinesForMultiview(scene, defines);

        // PrePass
        const oit = this.needAlphaBlendingForMesh(mesh) && this.getScene().useOrderIndependentTransparency;
        PrepareDefinesForPrePass(scene, defines, this.canRenderToMRT && !oit);

        // Order independant transparency
        PrepareDefinesForOIT(scene, defines, oit);

        MaterialHelperGeometryRendering.PrepareDefines(engine.currentRenderPassId, mesh, defines);

        // Textures
        defines.METALLICWORKFLOW = this.isMetallicWorkflow();
        if (defines._areTexturesDirty) {
            defines._needUVs = false;
            for (let i = 1; i <= Constants.MAX_SUPPORTED_UV_SETS; ++i) {
                defines["MAINUV" + i] = false;
            }
            if (scene.texturesEnabled) {
                defines.ALBEDODIRECTUV = 0;
                defines.AMBIENTDIRECTUV = 0;
                defines.OPACITYDIRECTUV = 0;
                defines.EMISSIVEDIRECTUV = 0;
                defines.REFLECTIVITYDIRECTUV = 0;
                defines.MICROSURFACEMAPDIRECTUV = 0;
                defines.METALLIC_REFLECTANCEDIRECTUV = 0;
                defines.REFLECTANCEDIRECTUV = 0;
                defines.BUMPDIRECTUV = 0;
                defines.LIGHTMAPDIRECTUV = 0;

                if (engine.getCaps().textureLOD) {
                    defines.LODBASEDMICROSFURACE = true;
                }

                if (this._albedoTexture && MaterialFlags.DiffuseTextureEnabled) {
                    PrepareDefinesForMergedUV(this._albedoTexture, defines, "ALBEDO");
                    defines.GAMMAALBEDO = this._albedoTexture.gammaSpace;
                } else {
                    defines.ALBEDO = false;
                }

                if (this._baseWeightTexture && MaterialFlags.BaseWeightTextureEnabled) {
                    PrepareDefinesForMergedUV(this._baseWeightTexture, defines, "BASE_WEIGHT");
                } else {
                    defines.BASE_WEIGHT = false;
                }

                if (this._baseDiffuseRoughnessTexture && MaterialFlags.BaseDiffuseRoughnessTextureEnabled) {
                    PrepareDefinesForMergedUV(this._baseDiffuseRoughnessTexture, defines, "BASE_DIFFUSE_ROUGHNESS");
                } else {
                    defines.BASE_DIFFUSE_ROUGHNESS = false;
                }

                if (this._ambientTexture && MaterialFlags.AmbientTextureEnabled) {
                    PrepareDefinesForMergedUV(this._ambientTexture, defines, "AMBIENT");
                    defines.AMBIENTINGRAYSCALE = this._useAmbientInGrayScale;
                } else {
                    defines.AMBIENT = false;
                }

                if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                    PrepareDefinesForMergedUV(this._opacityTexture, defines, "OPACITY");
                    defines.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
                } else {
                    defines.OPACITY = false;
                }

                const reflectionTexture = this._getReflectionTexture2();
                const useSHInFragment: boolean =
                    this._forceIrradianceInFragment ||
                    this.realTimeFiltering ||
                    this._twoSidedLighting ||
                    engine.getCaps().maxVaryingVectors <= 8 ||
                    this._baseDiffuseRoughnessTexture != null;
                PrepareDefinesForIBL(scene, reflectionTexture, defines, this.realTimeFiltering, this.realTimeFilteringQuality, !useSHInFragment);

                if (this._lightmapTexture && MaterialFlags.LightmapTextureEnabled) {
                    PrepareDefinesForMergedUV(this._lightmapTexture, defines, "LIGHTMAP");
                    defines.USELIGHTMAPASSHADOWMAP = this._useLightmapAsShadowmap;
                    defines.GAMMALIGHTMAP = this._lightmapTexture.gammaSpace;
                    defines.RGBDLIGHTMAP = this._lightmapTexture.isRGBD;
                } else {
                    defines.LIGHTMAP = false;
                }

                if (this._emissiveTexture && MaterialFlags.EmissiveTextureEnabled) {
                    PrepareDefinesForMergedUV(this._emissiveTexture, defines, "EMISSIVE");
                    defines.GAMMAEMISSIVE = this._emissiveTexture.gammaSpace;
                } else {
                    defines.EMISSIVE = false;
                }

                if (MaterialFlags.SpecularTextureEnabled) {
                    if (this._metallicTexture) {
                        PrepareDefinesForMergedUV(this._metallicTexture, defines, "REFLECTIVITY");
                        defines.ROUGHNESSSTOREINMETALMAPALPHA = this._useRoughnessFromMetallicTextureAlpha;
                        defines.ROUGHNESSSTOREINMETALMAPGREEN = !this._useRoughnessFromMetallicTextureAlpha && this._useRoughnessFromMetallicTextureGreen;
                        defines.METALLNESSSTOREINMETALMAPBLUE = this._useMetallnessFromMetallicTextureBlue;
                        defines.AOSTOREINMETALMAPRED = this._useAmbientOcclusionFromMetallicTextureRed;
                        defines.REFLECTIVITY_GAMMA = false;
                    } else if (this._reflectivityTexture) {
                        PrepareDefinesForMergedUV(this._reflectivityTexture, defines, "REFLECTIVITY");
                        defines.MICROSURFACEFROMREFLECTIVITYMAP = this._useMicroSurfaceFromReflectivityMapAlpha;
                        defines.MICROSURFACEAUTOMATIC = this._useAutoMicroSurfaceFromReflectivityMap;
                        defines.REFLECTIVITY_GAMMA = this._reflectivityTexture.gammaSpace;
                    } else {
                        defines.REFLECTIVITY = false;
                    }

                    if (this._metallicReflectanceTexture || this._reflectanceTexture) {
                        defines.METALLIC_REFLECTANCE_USE_ALPHA_ONLY = this._useOnlyMetallicFromMetallicReflectanceTexture;
                        if (this._metallicReflectanceTexture) {
                            PrepareDefinesForMergedUV(this._metallicReflectanceTexture, defines, "METALLIC_REFLECTANCE");
                            defines.METALLIC_REFLECTANCE_GAMMA = this._metallicReflectanceTexture.gammaSpace;
                        } else {
                            defines.METALLIC_REFLECTANCE = false;
                        }
                        if (
                            this._reflectanceTexture &&
                            (!this._metallicReflectanceTexture || (this._metallicReflectanceTexture && this._useOnlyMetallicFromMetallicReflectanceTexture))
                        ) {
                            PrepareDefinesForMergedUV(this._reflectanceTexture, defines, "REFLECTANCE");
                            defines.REFLECTANCE_GAMMA = this._reflectanceTexture.gammaSpace;
                        } else {
                            defines.REFLECTANCE = false;
                        }
                    } else {
                        defines.METALLIC_REFLECTANCE = false;
                        defines.REFLECTANCE = false;
                    }

                    if (this._microSurfaceTexture) {
                        PrepareDefinesForMergedUV(this._microSurfaceTexture, defines, "MICROSURFACEMAP");
                    } else {
                        defines.MICROSURFACEMAP = false;
                    }
                } else {
                    defines.REFLECTIVITY = false;
                    defines.MICROSURFACEMAP = false;
                }

                if (engine.getCaps().standardDerivatives && this._bumpTexture && MaterialFlags.BumpTextureEnabled && !this._disableBumpMap) {
                    PrepareDefinesForMergedUV(this._bumpTexture, defines, "BUMP");

                    if (this._useParallax && this._albedoTexture && MaterialFlags.DiffuseTextureEnabled) {
                        defines.PARALLAX = true;
                        defines.PARALLAX_RHS = scene.useRightHandedSystem;
                        defines.PARALLAXOCCLUSION = !!this._useParallaxOcclusion;
                    } else {
                        defines.PARALLAX = false;
                    }

                    defines.OBJECTSPACE_NORMALMAP = this._useObjectSpaceNormalMap;
                } else {
                    defines.BUMP = false;
                    defines.PARALLAX = false;
                    defines.PARALLAX_RHS = false;
                    defines.PARALLAXOCCLUSION = false;
                    defines.OBJECTSPACE_NORMALMAP = false;
                }

                if (this._environmentBRDFTexture && MaterialFlags.ReflectionTextureEnabled) {
                    defines.ENVIRONMENTBRDF = true;
                    defines.ENVIRONMENTBRDF_RGBD = this._environmentBRDFTexture.isRGBD;
                } else {
                    defines.ENVIRONMENTBRDF = false;
                    defines.ENVIRONMENTBRDF_RGBD = false;
                }

                if (this._shouldUseAlphaFromAlbedoTexture()) {
                    defines.ALPHAFROMALBEDO = true;
                } else {
                    defines.ALPHAFROMALBEDO = false;
                }
            }

            defines.SPECULAROVERALPHA = this._useSpecularOverAlpha;

            if (this._lightFalloff === PBRBaseMaterial.LIGHTFALLOFF_STANDARD) {
                defines.USEPHYSICALLIGHTFALLOFF = false;
                defines.USEGLTFLIGHTFALLOFF = false;
            } else if (this._lightFalloff === PBRBaseMaterial.LIGHTFALLOFF_GLTF) {
                defines.USEPHYSICALLIGHTFALLOFF = false;
                defines.USEGLTFLIGHTFALLOFF = true;
            } else {
                defines.USEPHYSICALLIGHTFALLOFF = true;
                defines.USEGLTFLIGHTFALLOFF = false;
            }

            defines.RADIANCEOVERALPHA = this._useRadianceOverAlpha;

            if (!this.backFaceCulling && this._twoSidedLighting) {
                defines.TWOSIDEDLIGHTING = true;
            } else {
                defines.TWOSIDEDLIGHTING = false;
            }

            // We need it to not invert normals in two sided lighting mode (based on the winding of the face)
            defines.MIRRORED = !!scene._mirroredCameraPosition;

            defines.SPECULARAA = engine.getCaps().standardDerivatives && this._enableSpecularAntiAliasing;
        }

        if (defines._areTexturesDirty || defines._areMiscDirty) {
            defines.ALPHATESTVALUE = `${this._alphaCutOff}${this._alphaCutOff % 1 === 0 ? "." : ""}`;
            defines.PREMULTIPLYALPHA = this.alphaMode === Constants.ALPHA_PREMULTIPLIED || this.alphaMode === Constants.ALPHA_PREMULTIPLIED_PORTERDUFF;
            defines.ALPHABLEND = this.needAlphaBlendingForMesh(mesh);
            defines.ALPHAFRESNEL = this._useAlphaFresnel || this._useLinearAlphaFresnel;
            defines.LINEARALPHAFRESNEL = this._useLinearAlphaFresnel;
        }

        if (defines._areImageProcessingDirty && this._imageProcessingConfiguration) {
            this._imageProcessingConfiguration.prepareDefines(defines);
        }

        defines.FORCENORMALFORWARD = this._forceNormalForward;

        defines.RADIANCEOCCLUSION = this._useRadianceOcclusion;

        defines.HORIZONOCCLUSION = this._useHorizonOcclusion;

        // Misc.
        if (defines._areMiscDirty) {
            PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this.needAlphaTestingForMesh(mesh), defines, false);
            defines.UNLIT = this._unlit2 || ((this.pointsCloud || this.wireframe) && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind));
            defines.DEBUGMODE = this._debugMode2;
        }

        // Values that need to be evaluated on every frame
        PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances ? true : false, useClipPlane, useThinInstances);

        // External config
        this._eventInfo.defines = defines;
        this._eventInfo.mesh = mesh;
        this._callbackPluginEventPrepareDefinesBeforeAttributes(this._eventInfo);

        // Attribs
        PrepareDefinesForAttributes(mesh, defines, true, true, true, this._transparencyMode !== PBRBaseMaterial.PBRMATERIAL_OPAQUE);

        // External config
        this._callbackPluginEventPrepareDefines(this._eventInfo);
    }

    /**
     * Returns the texture used for reflections.
     * @returns - Reflection texture if present.  Otherwise, returns the environment texture.
     */
    private _getReflectionTexture2(): Nullable<BaseTexture> {
        if (this._reflectionTexture) {
            return this._reflectionTexture;
        }

        return this.getScene().environmentTexture;
    }

    private _shadersLoaded2 = false;

    /**
     * If set to true, no lighting calculations will be applied.
     */
    private _unlit2 = false;

    private _debugMode2 = 0;

    private _breakShaderLoadedCheck2 = false;
}

RegisterClass("BABYLON.PBR2Material", PBR2Material);
