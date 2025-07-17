/* eslint-disable @typescript-eslint/naming-convention */
import { serialize, serializeAsColor3, expandToProperty, serializeAsTexture, addAccessorsForMaterialProperty } from "../../Misc/decorators";
import { GetEnvironmentBRDFTexture } from "../../Misc/brdfTextureTools";
import type { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Color3, Color4 } from "../../Maths/math.color";
import { ImageProcessingConfiguration } from "../imageProcessingConfiguration";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import { PBRBaseMaterial } from "./pbrBaseMaterial";
import { RegisterClass } from "../../Misc/typeStore";
import { Material } from "../material";
import { SerializationHelper } from "../../Misc/decorators.serialization";

import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Effect, IEffectCreationOptions } from "../../Materials/effect";
import { MaterialDefines } from "../materialDefines";
import { ImageProcessingDefinesMixin } from "../imageProcessingConfiguration.defines";
import { EffectFallbacks } from "../effectFallbacks";
import { AddClipPlaneUniforms, BindClipPlane } from "../clipPlaneMaterialHelper";
import {
    BindBonesParameters,
    BindFogParameters,
    BindLights,
    BindLogDepth,
    BindMorphTargetParameters,
    BindTextureMatrix,
    BindIBLParameters,
    BindIBLSamplers,
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
    PrepareUniformLayoutForIBL,
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
import { Vector2, Vector3, Vector4, TmpVectors } from "core/Maths/math.vector";
import type { Matrix } from "core/Maths/math.vector";
import type { Mesh } from "../../Meshes/mesh";
import { ImageProcessingMixin } from "../imageProcessing";
import { PushMaterial } from "../pushMaterial";
import { SmartArray } from "../../Misc/smartArray";
import type { RenderTargetTexture } from "../Textures/renderTargetTexture";
import type { IAnimatable } from "../../Animations/animatable.interface";

const onCreatedEffectParameters = { effect: null as unknown as Effect, subMesh: null as unknown as Nullable<SubMesh> };

class Uniform {
    public name: string;
    public numComponents: number;
    public linkedProperties: { [name: string]: Property<any> } = {};
    public populateVectorFromLinkedProperties(vector: Vector4 | Vector3 | Vector2): void {
        const destinationSize = vector instanceof Vector4 ? 4 : vector instanceof Vector3 ? 3 : vector instanceof Vector2 ? 2 : 1;
        for (const propKey in this.linkedProperties) {
            const prop = this.linkedProperties[propKey];
            const sourceSize = prop.numComponents;
            if (destinationSize < sourceSize || prop.targetUniformComponentOffset > destinationSize - sourceSize) {
                if (sourceSize == 1) {
                    Logger.Error(`Float property ${prop.name} has an offset that is too large.`);
                } else {
                    Logger.Error(`Vector${sourceSize} property ${prop.name} won't fit in Vector${destinationSize} or has an offset that is too large.`);
                }
                return;
            }
            if (typeof prop.value === "number") {
                Uniform._tmpArray[prop.targetUniformComponentOffset] = prop.value;
            } else {
                prop.value.toArray(Uniform._tmpArray, prop.targetUniformComponentOffset);
            }
        }
        vector.fromArray(Uniform._tmpArray);
    }
    public constructor(name: string, componentNum: number) {
        this.name = name;
        this.numComponents = componentNum;
    }
    private static _tmpArray: number[] = [0, 0, 0, 0];
}

/**
 * Defines a property for the OpenPBRMaterial.
 */
class Property<T> {
    public name: string;
    public targetUniformName: string;
    public defaultValue: T;
    public value: T;
    // public includeAlphaFromProp: string = "";

    /**
     * If not given a type, there will be no uniform defined for this property and
     * it will be assumed that the value will be packed into the already existing "uniformName" uniform.
     */
    public targetUniformComponentNum: number = 4; // Default to vec4
    public targetUniformComponentOffset: number = 0;

    /**
     * Creates a new Property instance.
     * @param name The name of the property in the shader
     * @param defaultValue The default value of the property
     * @param targetUniformName The name of the property in the shader uniform block
     * @param targetUniformComponentNum The number of components in the target uniform. All properties that are
     * packed into the same uniform must agree on the size of the target uniform.
     * @param targetUniformComponentOffset The offset in the uniform where this property will be packed.
     */
    constructor(name: string, defaultValue: T, targetUniformName: string, targetUniformComponentNum: number, targetUniformComponentOffset: number = 0) {
        this.name = name;
        this.targetUniformName = targetUniformName;
        this.defaultValue = defaultValue;
        this.value = defaultValue;
        this.targetUniformComponentNum = targetUniformComponentNum;
        this.targetUniformComponentOffset = targetUniformComponentOffset;
    }

    /**
     * Returns the number of components of the property based on its default value type.
     */
    public get numComponents(): number {
        if (typeof this.defaultValue === "number") {
            return 1;
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
    public name: string;
    public value: Nullable<BaseTexture> = null; // Texture value, default to null
    public samplerPrefix: string = ""; // The name of the sampler in the shader
    public textureDefine: string = ""; // The define used in the shader for this sampler

    /**
     * The name of the sampler used in the shader.
     * If this naming changes, we'll also need to change:
     * - samplerFragmentDeclaration.fx
     * - openpbr.fragment.fx
     */
    public get samplerName(): string {
        return this.samplerPrefix + "Sampler";
    }
    /**
     * The name of the sampler info used in the shader.
     * If this naming changes, we'll also need to change:
     * - openpbr.vertex.fx
     * - openpbr.fragment.fx
     */
    public get samplerInfoName(): string {
        return "v" + this.samplerPrefix.charAt(0).toUpperCase() + this.samplerPrefix.slice(1) + "Infos";
    }
    /**
     * The name of the matrix used for this sampler in the shader.
     * If this naming changes, we'll also need to change:
     * - materialHelper.functions.BindTextureMatrix
     * - samplerVertexImplementation.fx
     * - openpbr.fragment.fx
     */
    public get samplerMatrixName(): string {
        return this.samplerPrefix + "Matrix";
    }
    /**
     * Creates a new Sampler instance.
     * @param name The name of the texture property
     * @param samplerPrefix The prefix used for the name of the sampler in the shader
     * @param textureDefine The define used in the shader for this sampler
     */
    constructor(name: string, samplerPrefix: string, textureDefine: string) {
        this.name = name;
        this.samplerPrefix = samplerPrefix;
        this.textureDefine = textureDefine;
    }
}

class OpenPBRMaterialDefinesBase extends UVDefinesMixin(MaterialDefines) {}
/**
 * Manages the defines for the PBR Material.
 * @internal
 */
export class OpenPBRMaterialDefines extends ImageProcessingDefinesMixin(OpenPBRMaterialDefinesBase) {
    public PBR = true;

    public NUM_SAMPLES = "0";
    public REALTIME_FILTERING = false;
    public IBL_CDF_FILTERING = false;

    public VERTEXCOLOR = false;

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
    public PREMULTIPLYALPHA = false;

    public EMISSIVE = false;
    public EMISSIVEDIRECTUV = 0;
    public GAMMAEMISSIVE = false;

    public REFLECTIVITY_GAMMA = false;
    public REFLECTIVITYDIRECTUV = 0;
    public SPECULARTERM = false;

    public MICROSURFACEFROMREFLECTIVITYMAP = false;
    public MICROSURFACEAUTOMATIC = false;
    public LODBASEDMICROSFURACE = false;

    public METALLICWORKFLOW = true;
    public ROUGHNESSSTOREINMETALMAPALPHA = false;
    public ROUGHNESSSTOREINMETALMAPGREEN = false;
    public METALLNESSSTOREINMETALMAPBLUE = false;
    public AOSTOREINMETALMAPRED = false;
    public SPECULAR_WEIGHT_USE_ALPHA_ONLY = false;

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

    // BRDF defines
    BRDF_V_HEIGHT_CORRELATED = true;
    MS_BRDF_ENERGY_CONSERVATION = true;
    SPHERICAL_HARMONICS = true;
    SPECULAR_GLOSSINESS_ENERGY_CONSERVATION = true;
    MIX_IBL_RADIANCE_WITH_IRRADIANCE = true;
    LEGACY_SPECULAR_ENERGY_CONSERVATION = false;
    BASE_DIFFUSE_MODEL = Constants.MATERIAL_DIFFUSE_MODEL_E_OREN_NAYAR;
    DIELECTRIC_SPECULAR_MODEL = Constants.MATERIAL_DIELECTRIC_SPECULAR_MODEL_OPENPBR;
    CONDUCTOR_SPECULAR_MODEL = Constants.MATERIAL_CONDUCTOR_SPECULAR_MODEL_OPENPBR;

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

class OpenPBRMaterialBase extends ImageProcessingMixin(PushMaterial) {}
/**
 * The Physically based material of BJS.
 *
 * This offers the main features of a standard PBR material.
 * For more information, please refer to the documentation :
 * https://doc.babylonjs.com/features/featuresDeepDive/materials/using/introToPBR
 */
export class OpenPBRMaterial extends OpenPBRMaterialBase {
    /**
     * OpenPBRMaterialTransparencyMode: No transparency mode, Alpha channel is not use.
     */
    public static readonly PBRMATERIAL_OPAQUE = PBRBaseMaterial.PBRMATERIAL_OPAQUE;

    /**
     * OpenPBRMaterialTransparencyMode: Alpha Test mode, pixel are discarded below a certain threshold defined by the alpha cutoff value.
     */
    public static readonly PBRMATERIAL_ALPHATEST = PBRBaseMaterial.PBRMATERIAL_ALPHATEST;

    /**
     * OpenPBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
     */
    public static readonly PBRMATERIAL_ALPHABLEND = PBRBaseMaterial.PBRMATERIAL_ALPHABLEND;

    /**
     * OpenPBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
     * They are also discarded below the alpha cutoff threshold to improve performances.
     */
    public static readonly PBRMATERIAL_ALPHATESTANDBLEND = PBRBaseMaterial.PBRMATERIAL_ALPHATESTANDBLEND;

    /**
     * Defines the default value of how much AO map is occluding the analytical lights
     * (point spot...).
     */
    public static DEFAULT_AO_ON_ANALYTICAL_LIGHTS = PBRBaseMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS;

    /**
     * Base Weight is a multiplier on the diffuse and metal lobes.
     * See OpenPBR's specs for base_weight
     */
    public baseWeight: number;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "baseWeight")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _baseWeight: Property<number> = new Property<number>("base_weight", 1, "baseWeight", 1);

    /**
     * Base Weight is a multiplier on the diffuse and metal lobes.
     * See OpenPBR's specs for base_weight
     */
    public baseWeightTexture: BaseTexture;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "baseColorTexture")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _baseWeightTexture: Sampler = new Sampler("base_weight", "baseWeight", "BASE_WEIGHT");

    /**
     * Color of the base diffuse lobe.
     * See OpenPBR's specs for base_color
     */
    public baseColor: Color3;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "baseColor")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _baseColor: Property<Color3> = new Property<Color3>("base_color", Color3.White(), "vBaseColor", 4);

    /**
     * Base Color Texture property.
     * See OpenPBR's specs for base_color
     */
    public baseColorTexture: BaseTexture;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "baseColorTexture")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _baseColorTexture: Sampler = new Sampler("base_color", "baseColor", "ALBEDO");

    /**
     * Roughness of the diffuse lobe.
     * See OpenPBR's specs for base_diffuse_roughness
     */
    public baseDiffuseRoughness: number;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "baseDiffuseRoughness")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _baseDiffuseRoughness: Property<number> = new Property<number>("base_diffuse_roughness", 0, "vBaseDiffuseRoughness", 1);

    /**
     * Roughness of the diffuse lobe.
     * See OpenPBR's specs for base_diffuse_roughness
     */
    public baseDiffuseRoughnessTexture: BaseTexture;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "baseDiffuseRoughnessTexture")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _baseDiffuseRoughnessTexture: Sampler = new Sampler("base_diffuse_roughness", "baseDiffuseRoughness", "BASE_DIFFUSE_ROUGHNESS");

    /**
     * Metalness of the base lobe.
     * See OpenPBR's specs for base_metalness
     */
    public baseMetalness: number;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "baseMetalness")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _baseMetalness: Property<number> = new Property<number>("base_metalness", 0, "vReflectanceInfo", 4, 0);

    /**
     * Weight of the specular lobe.
     * See OpenPBR's specs for specular_weight
     */
    public specularWeight: number;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "specularWeight")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _specularWeight: Property<number> = new Property<number>("specular_weight", 1, "vReflectanceInfo", 4, 3);

    /**
     * Roughness of the diffuse lobe.
     * See OpenPBR's specs for base_diffuse_roughness
     */
    public specularWeightTexture: BaseTexture;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "specularWeightTexture")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _specularWeightTexture: Sampler = new Sampler("specular_weight", "specularWeight", "SPECULAR_WEIGHT");

    /**
     * Color of the specular lobe.
     * See OpenPBR's specs for specular_color
     */
    public specularColor: Color3;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "specularColor")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _specularColor: Property<Color3> = new Property<Color3>("specular_color", Color3.White(), "vSpecularColor", 4);

    /**
     * Specular Color Texture property.
     * See OpenPBR's specs for specular_color
     */
    public specularColorTexture: BaseTexture;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "specularColorTexture")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _specularColorTexture: Sampler = new Sampler("specular_color", "specularColor", "SPECULAR_COLOR");

    /**
     * Roughness of the specular lobe.
     * See OpenPBR's specs for specular_roughness
     */
    public specularRoughness: number;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "specularRoughness")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _specularRoughness: Property<number> = new Property<number>("specular_roughness", 0, "vReflectanceInfo", 4, 1);

    /**
     * IOR of the specular lobe.
     * See OpenPBR's specs for specular_roughness
     */
    public specularIor: number;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "specularIor")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _specularIor: Property<number> = new Property<number>("specular_ior", 1.5, "vReflectanceInfo", 4, 2);

    /**
     * Metalness and Roughness texture.
     * See OpenPBR's specs for base_metalness and specular_roughness
     */
    public baseMetalRoughTexture: BaseTexture;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "baseMetalRoughTexture")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _baseMetalRoughTexture: Sampler = new Sampler("base_metalness_specular_roughness", "baseMetalRough", "METALLIC_ROUGHNESS");

    /**
     * Defines the opacity of the material's geometry. See OpenPBR's specs for geometry_opacity
     */
    public geometryOpacity: number;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "geometryOpacity")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _geometryOpacity: Property<number> = new Property<number>("geometry_opacity", 1.0, "vBaseColor", 4, 3);

    /**
     * Defines the color of the material's emission. See OpenPBR's specs for emission_color
     */
    public emissionColor: Color3;
    @addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty", "emissionColor")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _emissionColor: Property<Color3> = new Property<Color3>("emission_color", Color3.Black(), "vEmissiveColor", 3);

    private _propertyList: { [name: string]: Property<any> };
    private _uniformsList: { [name: string]: Uniform } = {};
    private _samplersList: { [name: string]: Sampler } = {};
    private _samplerDefines: { [name: string]: { type: string; default: any } } = {};

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
     * Debug Control allowing disabling the bump map on this material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public disableBumpMap: boolean = false;

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
    public ambientTextureImpactOnAnalyticalLights: number = OpenPBRMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS;

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
     * Specifies that the specular weight is stored in the alpha channel of the specular weight texture.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useSpecularWeightFromTextureAlpha = false;

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
     * The color of a material in ambient lighting.
     */
    @serializeAsColor3("ambient")
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public ambientColor = new Color3(0, 0, 0);

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
     * PBRMaterialLightFalloff Physical: light is falling off following the inverse squared distance law.
     */
    public static readonly LIGHTFALLOFF_PHYSICAL = 0;

    /**
     * PBRMaterialLightFalloff gltf: light is falling off as described in the gltf moving to PBR document
     * to enhance interoperability with other engines.
     */
    public static readonly LIGHTFALLOFF_GLTF = 1;

    /**
     * PBRMaterialLightFalloff Standard: light is falling off like in the standard material
     * to enhance interoperability with other materials.
     */
    public static readonly LIGHTFALLOFF_STANDARD = 2;

    /**
     * Force all the PBR materials to compile to glsl even on WebGPU engines.
     * False by default. This is mostly meant for backward compatibility.
     */
    public static ForceGLSL = false;

    /**
     * Intensity of the direct lights e.g. the four lights available in your scene.
     * This impacts both the direct diffuse and specular highlights.
     * @internal
     */
    public _directIntensity: number = 1.0;

    /**
     * Intensity of the emissive part of the material.
     * This helps controlling the emissive effect without modifying the emissive color.
     * @internal
     */
    public _emissiveIntensity: number = 1.0;

    /**
     * Intensity of the environment e.g. how much the environment will light the object
     * either through harmonics for rough material or through the reflection for shiny ones.
     * @internal
     */
    public _environmentIntensity: number = 1.0;

    /**
     * This stores the direct, emissive, environment, and specular light intensities into a Vector4.
     */
    private _lightingInfos: Vector4 = new Vector4(this._directIntensity, this._emissiveIntensity, this._environmentIntensity, 1.0);

    /**
     * Debug Control allowing disabling the bump map on this material.
     * @internal
     */
    public _disableBumpMap: boolean = false;

    /**
     * AKA Occlusion Texture in other nomenclature.
     * @internal
     */
    public _ambientTexture: Nullable<BaseTexture> = null;

    /**
     * AKA Occlusion Texture Intensity in other nomenclature.
     * @internal
     */
    public _ambientTextureStrength: number = 1.0;

    /**
     * Defines how much the AO map is occluding the analytical lights (point spot...).
     * 1 means it completely occludes it
     * 0 mean it has no impact
     * @internal
     */
    public _ambientTextureImpactOnAnalyticalLights: number = PBRBaseMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS;

    /**
     * Stores the alpha values in a texture.
     * @internal
     */
    public _opacityTexture: Nullable<BaseTexture> = null;

    /**
     * Stores the reflection values in a texture.
     * @internal
     */
    public _reflectionTexture: Nullable<BaseTexture> = null;

    /**
     * Stores the emissive values in a texture.
     * @internal
     */
    public _emissiveTexture: Nullable<BaseTexture> = null;

    /**
     * Specifies that only the A channel from _metallicReflectanceTexture should be used.
     * If false, both RGB and A channels will be used
     * @internal
     */
    public _useSpecularWeightFromTextureAlpha = false;

    /**
     * Stores surface normal data used to displace a mesh in a texture.
     * @internal
     */
    public _bumpTexture: Nullable<BaseTexture> = null;

    /**
     * Stores the pre-calculated light information of a mesh in a texture.
     * @internal
     */
    public _lightmapTexture: Nullable<BaseTexture> = null;

    /**
     * The color of a material in ambient lighting.
     * @internal
     */
    public _ambientColor = new Color3(0, 0, 0);

    /**
     * AKA Specular Color in other nomenclature.
     * @internal
     */
    public _reflectivityColor = new Color3(1, 1, 1);

    /**
     * The color applied when light is reflected from a material.
     * @internal
     */
    public _reflectionColor = new Color3(1, 1, 1);

    /**
     * Specifies that the material will use the light map as a show map.
     * @internal
     */
    public _useLightmapAsShadowmap = false;

    /**
     * This parameters will enable/disable Horizon occlusion to prevent normal maps to look shiny when the normal
     * makes the reflect vector face the model (under horizon).
     * @internal
     */
    public _useHorizonOcclusion = true;

    /**
     * This parameters will enable/disable radiance occlusion by preventing the radiance to lit
     * too much the area relying on ambient texture to define their ambient occlusion.
     * @internal
     */
    public _useRadianceOcclusion = true;

    /**
     * Specifies that the alpha is coming form the albedo channel alpha channel for alpha blending.
     * @internal
     */
    public _useAlphaFromAlbedoTexture = false;

    /**
     * Specifies that the material will keeps the specular highlights over a transparent surface (only the most luminous ones).
     * A car glass is a good example of that. When sun reflects on it you can not see what is behind.
     * @internal
     */
    public _useSpecularOverAlpha = true;

    /**
     * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
     * @internal
     */
    public _useMicroSurfaceFromReflectivityMapAlpha = false;

    /**
     * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
     * @internal
     */
    public _useAmbientOcclusionFromMetallicTextureRed = false;

    /**
     * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
     * @internal
     */
    public _useAmbientInGrayScale = false;

    /**
     * In case the reflectivity map does not contain the microsurface information in its alpha channel,
     * The material will try to infer what glossiness each pixel should be.
     * @internal
     */
    public _useAutoMicroSurfaceFromReflectivityMap = false;

    /**
     * Defines the  falloff type used in this material.
     * It by default is Physical.
     * @internal
     */
    public _lightFalloff = PBRBaseMaterial.LIGHTFALLOFF_PHYSICAL;

    /**
     * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most luminous ones).
     * A car glass is a good example of that. When the street lights reflects on it you can not see what is behind.
     * @internal
     */
    public _useRadianceOverAlpha = true;

    /**
     * Allows using an object space normal map (instead of tangent space).
     * @internal
     */
    public _useObjectSpaceNormalMap = false;

    /**
     * Allows using the bump map in parallax mode.
     * @internal
     */
    public _useParallax = false;

    /**
     * Allows using the bump map in parallax occlusion mode.
     * @internal
     */
    public _useParallaxOcclusion = false;

    /**
     * Controls the scale bias of the parallax mode.
     * @internal
     */
    public _parallaxScaleBias = 0.05;

    /**
     * If sets to true, disables all the lights affecting the material.
     * @internal
     */
    public _disableLighting = false;

    /**
     * Number of Simultaneous lights allowed on the material.
     * @internal
     */
    public _maxSimultaneousLights = 4;

    /**
     * If sets to true, x component of normal map value will be inverted (x = 1.0 - x).
     * @internal
     */
    public _invertNormalMapX = false;

    /**
     * If sets to true, y component of normal map value will be inverted (y = 1.0 - y).
     * @internal
     */
    public _invertNormalMapY = false;

    /**
     * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
     * @internal
     */
    public _twoSidedLighting = false;

    /**
     * Defines the alpha limits in alpha test mode.
     * @internal
     */
    public _alphaCutOff = 0.4;

    /**
     * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
     * And/Or occlude the blended part. (alpha is converted to gamma to compute the fresnel)
     * @internal
     */
    public _useAlphaFresnel = false;

    /**
     * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
     * And/Or occlude the blended part. (alpha stays linear to compute the fresnel)
     * @internal
     */
    public _useLinearAlphaFresnel = false;

    /**
     * Specifies the environment BRDF texture used to compute the scale and offset roughness values
     * from cos theta and roughness:
     * http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
     * @internal
     */
    public _environmentBRDFTexture: Nullable<BaseTexture> = null;

    /**
     * Force the shader to compute irradiance in the fragment shader in order to take bump in account.
     * @internal
     */
    public _forceIrradianceInFragment = false;

    private _realTimeFiltering: boolean = false;
    /**
     * Enables realtime filtering on the texture.
     */
    public get realTimeFiltering() {
        return this._realTimeFiltering;
    }
    public set realTimeFiltering(b: boolean) {
        this._realTimeFiltering = b;
        this.markAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private _realTimeFilteringQuality: number = Constants.TEXTURE_FILTERING_QUALITY_LOW;
    /**
     * Quality switch for realtime filtering
     */
    public get realTimeFilteringQuality(): number {
        return this._realTimeFilteringQuality;
    }
    public set realTimeFilteringQuality(n: number) {
        this._realTimeFilteringQuality = n;
        this.markAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    /**
     * Can this material render to several textures at once
     */
    public override get canRenderToMRT() {
        return true;
    }

    /**
     * Force normal to face away from face.
     * @internal
     */
    public _forceNormalForward = false;

    /**
     * Enables specular anti aliasing in the PBR shader.
     * It will both interacts on the Geometry for analytical and IBL lighting.
     * It also prefilter the roughness map based on the bump values.
     * @internal
     */
    public _enableSpecularAntiAliasing = false;

    /**
     * Stores the available render targets.
     */
    private _renderTargets = new SmartArray<RenderTargetTexture>(16);

    /**
     * Sets the global ambient color for the material used in lighting calculations.
     */
    private _globalAmbientColor = new Color3(0, 0, 0);

    /**
     * If set to true, no lighting calculations will be applied.
     */
    private _unlit = false;

    /**
     * If sets to true, the decal map will be applied after the detail map. Else, it is applied before (default: false)
     */
    private _applyDecalMapAfterDetailMap = false;

    private _debugMode = 0;

    private _shadersLoaded = false;
    private _breakShaderLoadedCheck = false;

    /**
     * @internal
     * This is reserved for the inspector.
     * Defines the material debug mode.
     * It helps seeing only some components of the material while troubleshooting.
     */
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public debugMode = 0;

    /**
     * @internal
     * This is reserved for the inspector.
     * Specify from where on screen the debug mode should start.
     * The value goes from -1 (full screen) to 1 (not visible)
     * It helps with side by side comparison against the final render
     * This defaults to -1
     */
    public debugLimit = -1;

    /**
     * @internal
     * This is reserved for the inspector.
     * As the default viewing range might not be enough (if the ambient is really small for instance)
     * You can use the factor to better multiply the final value.
     */
    public debugFactor = 1;

    /**
     * Defines additional PrePass parameters for the material.
     */
    public readonly prePassConfiguration: PrePassConfiguration;

    protected _cacheHasRenderTargetTextures = false;

    /**
     * Instantiates a new OpenPBRMaterial instance.
     *
     * @param name The material name
     * @param scene The scene the material will be use in.
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name: string, scene?: Scene, forceGLSL = false) {
        super(name, scene, undefined, forceGLSL || PBRBaseMaterial.ForceGLSL);

        // Setup the default processing configuration to the scene.
        this._attachImageProcessingConfiguration(null);

        this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
            this._renderTargets.reset();

            if (MaterialFlags.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                this._renderTargets.push(<RenderTargetTexture>this._reflectionTexture);
            }

            this._eventInfo.renderTargets = this._renderTargets;
            this._callbackPluginEventFillRenderTargetTextures(this._eventInfo);

            return this._renderTargets;
        };

        this._environmentBRDFTexture = GetEnvironmentBRDFTexture(this.getScene());
        this.prePassConfiguration = new PrePassConfiguration();
        this._environmentBRDFTexture = GetEnvironmentBRDFTexture(this.getScene());

        // Build the internal property list that can be used to generate and update the uniform buffer
        this._propertyList = {};
        for (const key of Object.getOwnPropertyNames(this)) {
            const value = (this as any)[key];
            if (value instanceof Property) {
                this._propertyList[key] = value;
            }
        }
        // Build the internal uniforms list that is used for combining and updating
        // property values in the uniform buffer
        const propertyKeys = Object.keys(this._propertyList);
        propertyKeys.forEach((key) => {
            const prop = this._propertyList[key];
            let uniform = this._uniformsList[prop.targetUniformName];
            if (!uniform) {
                uniform = new Uniform(prop.targetUniformName, prop.targetUniformComponentNum);
                this._uniformsList[prop.targetUniformName] = uniform;
            } else if (uniform.numComponents !== prop.targetUniformComponentNum) {
                Logger.Error(`Uniform ${prop.targetUniformName} already exists of size ${uniform.numComponents}, but trying to set it to ${prop.targetUniformComponentNum}.`);
            }
            uniform.linkedProperties[prop.name] = prop;
        });

        // Build the internal list of samplers
        this._samplersList = {};
        for (const key of Object.getOwnPropertyNames(this)) {
            const value = (this as any)[key];
            if (value instanceof Sampler) {
                this._samplersList[key] = value;
            }
        }

        // For each sampler in _samplersList, add defines to be added to OpenPBRMaterialDefines
        for (const samplerKey in this._samplersList) {
            const sampler = this._samplersList[samplerKey];
            const defineName = sampler.textureDefine;
            this._samplerDefines[defineName] = { type: "boolean", default: false };
            this._samplerDefines[defineName + "DIRECTUV"] = { type: "number", default: 0 };
            this._samplerDefines[defineName + "_GAMMA"] = { type: "boolean", default: false };
        }

        // Arg. Why do I have to add these references to get rid of the linting errors?
        this._baseWeight;
        this._baseWeightTexture;
        this._baseColor;
        this._baseColorTexture;
        this._baseDiffuseRoughness;
        this._baseDiffuseRoughnessTexture;
        this._baseMetalness;
        this._specularWeight;
        this._specularWeightTexture;
        this._specularColor;
        this._specularColorTexture;
        this._specularRoughness;
        this._specularIor;
        this._baseMetalRoughTexture;
        this._geometryOpacity;
        this._emissionColor;
    }

    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    public override get hasRenderTargetTextures(): boolean {
        if (MaterialFlags.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
            return true;
        }

        return this._cacheHasRenderTargetTextures;
    }

    /**
     * Can this material render to prepass
     */
    public override get isPrePassCapable(): boolean {
        return !this.disableDepthWrite;
    }

    /**
     * @returns the name of the material class.
     */
    public override getClassName(): string {
        return "OpenPBRMaterial";
    }

    /**
     * Returns true if alpha blending should be disabled.
     */
    protected override get _disableAlphaBlending(): boolean {
        return this._transparencyMode === PBRBaseMaterial.PBRMATERIAL_OPAQUE || this._transparencyMode === PBRBaseMaterial.PBRMATERIAL_ALPHATEST;
    }

    /**
     * @returns whether or not this material should be rendered in alpha blend mode.
     */
    public override needAlphaBlending(): boolean {
        if (this._hasTransparencyMode) {
            return this._transparencyModeIsBlend;
        }

        if (this._disableAlphaBlending) {
            return false;
        }

        return this.geometryOpacity < 1.0 || this._opacityTexture != null || this._shouldUseAlphaFromAlbedoTexture();
    }

    /**
     * @returns whether or not this material should be rendered in alpha test mode.
     */
    public override needAlphaTesting(): boolean {
        if (this._hasTransparencyMode) {
            return this._transparencyModeIsTest;
        }

        return this._hasAlphaChannel() && (this._transparencyMode == null || this._transparencyMode === PBRBaseMaterial.PBRMATERIAL_ALPHATEST);
    }

    /**
     * @returns whether or not the alpha value of the albedo texture should be used for alpha blending.
     */
    protected _shouldUseAlphaFromAlbedoTexture(): boolean {
        return this.baseColorTexture != null && this.baseColorTexture.hasAlpha && this._useAlphaFromAlbedoTexture && this._transparencyMode !== PBRBaseMaterial.PBRMATERIAL_OPAQUE;
    }

    /**
     * @returns whether or not there is a usable alpha channel for transparency.
     */
    protected _hasAlphaChannel(): boolean {
        return this._opacityTexture != null;
    }

    /**
     * Makes a duplicate of the current material.
     * @param name - name to use for the new material.
     * @param cloneTexturesOnlyOnce - if a texture is used in more than one channel (e.g diffuse and opacity), only clone it once and reuse it on the other channels. Default false.
     * @param rootUrl defines the root URL to use to load textures
     * @returns cloned material instance
     */
    public override clone(name: string, cloneTexturesOnlyOnce: boolean = true, rootUrl = ""): OpenPBRMaterial {
        const clone = SerializationHelper.Clone(() => new OpenPBRMaterial(name, this.getScene()), this, { cloneTexturesOnlyOnce });

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
        serializationObject.customType = "BABYLON.OpenPBRMaterial";

        return serializationObject;
    }

    // Statics
    /**
     * Parses a PBR Material from a serialized object.
     * @param source - Serialized object.
     * @param scene - BJS scene instance.
     * @param rootUrl - url for the scene object
     * @returns - OpenPBRMaterial
     */
    public static override Parse(source: any, scene: Scene, rootUrl: string): OpenPBRMaterial {
        const material = SerializationHelper.Parse(() => new OpenPBRMaterial(source.name, scene), source, scene, rootUrl);

        if (source.stencil) {
            material.stencil.parse(source.stencil, scene, rootUrl);
        }

        Material._ParsePlugins(source, material, scene, rootUrl);

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
            if (this._breakShaderLoadedCheck) {
                return;
            }

            const defines = new OpenPBRMaterialDefines({
                ...(this._eventInfo.defineNames || {}),
                ...(this._samplerDefines || {}),
            });
            const effect = this._prepareEffect(mesh, defines, undefined, undefined, localOptions.useInstances, localOptions.clipPlane, mesh.hasThinInstances)!;
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
            subMesh.materialDefines = new OpenPBRMaterialDefines({
                ...(this._eventInfo.defineNames || {}),
                ...(this._samplerDefines || {}),
            });
        }

        const defines = <OpenPBRMaterialDefines>subMesh.materialDefines;
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
                // Loop through samplers, check MaterialFlag and whether the texture is ready or not.
                for (const key in this._samplersList) {
                    const sampler = this._samplersList[key];
                    if (sampler.value) {
                        if (!sampler.value.isReadyOrNotBlocking()) {
                            return false;
                        }
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

                const reflectionTexture = this._getReflectionTexture();
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
            Logger.Warn("OpenPBRMaterial: Normals have been created for the mesh: " + mesh.name);
        }

        const previousEffect = subMesh.effect;
        const lightDisposed = defines._areLightsDisposed;
        let effect = this._prepareEffect(mesh, defines, this.onCompiled, this.onError, useInstances, null, subMesh.getRenderingMesh().hasThinInstances);

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

    /**
     * Initializes the uniform buffer layout for the shader.
     */
    public override buildUniformLayout(): void {
        // Order is important !
        const ubo = this._uniformBuffer;
        ubo.addUniform("vAmbientInfos", 4);
        ubo.addUniform("vOpacityInfos", 2);
        ubo.addUniform("vEmissiveInfos", 2);
        ubo.addUniform("vLightmapInfos", 2);
        ubo.addUniform("vBumpInfos", 3);
        ubo.addUniform("ambientMatrix", 16);
        ubo.addUniform("opacityMatrix", 16);
        ubo.addUniform("emissiveMatrix", 16);
        ubo.addUniform("lightmapMatrix", 16);
        ubo.addUniform("bumpMatrix", 16);
        ubo.addUniform("vTangentSpaceParams", 2);
        ubo.addUniform("vLightingIntensity", 4);

        ubo.addUniform("pointSize", 1);
        // ubo.addUniform("vEmissiveColor", 3);
        ubo.addUniform("vAmbientColor", 3);

        ubo.addUniform("vDebugMode", 2);

        ubo.addUniform("cameraInfo", 4);
        PrepareUniformLayoutForIBL(ubo, true, true, true, true, true);

        Object.values(this._uniformsList).forEach((uniform) => {
            ubo.addUniform(uniform.name, uniform.numComponents);
        });

        Object.values(this._samplersList).forEach((sampler) => {
            ubo.addUniform(sampler.samplerInfoName, 2);
            ubo.addUniform(sampler.samplerMatrixName, 16);
        });

        super.buildUniformLayout();
    }

    /**
     * Binds the submesh data.
     * @param world - The world matrix.
     * @param mesh - The BJS mesh.
     * @param subMesh - A submesh of the BJS mesh.
     */
    public override bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        const scene = this.getScene();

        const defines = <OpenPBRMaterialDefines>subMesh.materialDefines;
        if (!defines) {
            return;
        }

        const effect = subMesh.effect;

        if (!effect) {
            return;
        }

        this._activeEffect = effect;

        // Matrices Mesh.
        mesh.getMeshUniformBuffer().bindToEffect(effect, "Mesh");
        mesh.transferToEffect(world);

        const engine = scene.getEngine();

        // Binding unconditionally
        this._uniformBuffer.bindToEffect(effect, "Material");

        this.prePassConfiguration.bindForSubMesh(this._activeEffect, scene, mesh, world, this.isFrozen);

        MaterialHelperGeometryRendering.Bind(engine.currentRenderPassId, this._activeEffect, mesh, world, this);

        const camera = scene.activeCamera;
        if (camera) {
            this._uniformBuffer.updateFloat4("cameraInfo", camera.minZ, camera.maxZ, 0, 0);
        } else {
            this._uniformBuffer.updateFloat4("cameraInfo", 0, 0, 0, 0);
        }

        this._eventInfo.subMesh = subMesh;
        this._callbackPluginEventHardBindForSubMesh(this._eventInfo);

        // Normal Matrix
        if (defines.OBJECTSPACE_NORMALMAP) {
            world.toNormalMatrix(this._normalMatrix);
            this.bindOnlyNormalMatrix(this._normalMatrix);
        }

        const mustRebind = this._mustRebind(scene, effect, subMesh, mesh.visibility);

        // Bones
        BindBonesParameters(mesh, this._activeEffect, this.prePassConfiguration);

        let reflectionTexture: Nullable<BaseTexture> = null;
        const ubo = this._uniformBuffer;
        if (mustRebind) {
            this.bindViewProjection(effect);
            reflectionTexture = this._getReflectionTexture();

            if (!ubo.useUbo || !this.isFrozen || !ubo.isSync || subMesh._drawWrapper._forceRebindOnNextCall) {
                // Texture uniforms
                if (scene.texturesEnabled) {
                    // Loop through samplers and bind info and matrix for each texture.
                    for (const key in this._samplersList) {
                        const sampler = this._samplersList[key];
                        if (sampler.value) {
                            ubo.updateFloat2(sampler.samplerInfoName, sampler.value.coordinatesIndex, sampler.value.level);
                            BindTextureMatrix(sampler.value, ubo, sampler.samplerPrefix);
                        }
                    }

                    if (this._ambientTexture && MaterialFlags.AmbientTextureEnabled) {
                        ubo.updateFloat4(
                            "vAmbientInfos",
                            this._ambientTexture.coordinatesIndex,
                            this._ambientTexture.level,
                            this._ambientTextureStrength,
                            this._ambientTextureImpactOnAnalyticalLights
                        );
                        BindTextureMatrix(this._ambientTexture, ubo, "ambient");
                    }

                    if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                        ubo.updateFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                        BindTextureMatrix(this._opacityTexture, ubo, "opacity");
                    }

                    if (this._emissiveTexture && MaterialFlags.EmissiveTextureEnabled) {
                        ubo.updateFloat2("vEmissiveInfos", this._emissiveTexture.coordinatesIndex, this._emissiveTexture.level);
                        BindTextureMatrix(this._emissiveTexture, ubo, "emissive");
                    }

                    if (this._lightmapTexture && MaterialFlags.LightmapTextureEnabled) {
                        ubo.updateFloat2("vLightmapInfos", this._lightmapTexture.coordinatesIndex, this._lightmapTexture.level);
                        BindTextureMatrix(this._lightmapTexture, ubo, "lightmap");
                    }

                    if (this._bumpTexture && engine.getCaps().standardDerivatives && MaterialFlags.BumpTextureEnabled && !this._disableBumpMap) {
                        ubo.updateFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, this._bumpTexture.level, this._parallaxScaleBias);
                        BindTextureMatrix(this._bumpTexture, ubo, "bump");

                        if (scene._mirroredCameraPosition) {
                            ubo.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? 1.0 : -1.0, this._invertNormalMapY ? 1.0 : -1.0);
                        } else {
                            ubo.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? -1.0 : 1.0, this._invertNormalMapY ? -1.0 : 1.0);
                        }
                    }
                }

                BindIBLParameters(scene, defines, ubo, reflectionTexture, this.realTimeFiltering, true, true, true, true, true, this._reflectionColor);

                // Point size
                if (this.pointsCloud) {
                    ubo.updateFloat("pointSize", this.pointSize);
                }

                // ubo.updateColor3("vEmissiveColor", MaterialFlags.EmissiveTextureEnabled ? this._emissiveColor : Color3.BlackReadOnly);

                Object.values(this._uniformsList).forEach((uniform) => {
                    // If the property actually defines a uniform, update it.
                    if (uniform.numComponents === 4) {
                        uniform.populateVectorFromLinkedProperties(TmpVectors.Vector4[0]);
                        ubo.updateVector4(uniform.name, TmpVectors.Vector4[0]);
                    } else if (uniform.numComponents === 3) {
                        uniform.populateVectorFromLinkedProperties(TmpVectors.Vector3[0]);
                        ubo.updateVector3(uniform.name, TmpVectors.Vector3[0]);
                    } else if (uniform.numComponents === 2) {
                        uniform.populateVectorFromLinkedProperties(TmpVectors.Vector2[0]);
                        ubo.updateFloat2(uniform.name, TmpVectors.Vector2[0].x, TmpVectors.Vector2[0].y);
                    } else if (uniform.numComponents === 1) {
                        ubo.updateFloat(uniform.name, uniform.linkedProperties[Object.keys(uniform.linkedProperties)[0]].value);
                    }
                });

                // Misc
                this._lightingInfos.x = this._directIntensity;
                this._lightingInfos.y = this._emissiveIntensity;
                this._lightingInfos.z = this._environmentIntensity * scene.environmentIntensity;
                this._lightingInfos.w = 1.0; // This is used to be _specularIntensity.

                ubo.updateVector4("vLightingIntensity", this._lightingInfos);

                // Colors
                scene.ambientColor.multiplyToRef(this._ambientColor, this._globalAmbientColor);

                ubo.updateColor3("vAmbientColor", this._globalAmbientColor);

                ubo.updateFloat2("vDebugMode", this.debugLimit, this.debugFactor);
            }

            // Textures
            if (scene.texturesEnabled) {
                // Loop through samplers and set textures
                for (const key in this._samplersList) {
                    const sampler = this._samplersList[key];
                    if (sampler.value) {
                        ubo.setTexture(sampler.samplerName, sampler.value);
                    }
                }

                if (this._ambientTexture && MaterialFlags.AmbientTextureEnabled) {
                    ubo.setTexture("ambientSampler", this._ambientTexture);
                }

                if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                    ubo.setTexture("opacitySampler", this._opacityTexture);
                }

                BindIBLSamplers(scene, defines, ubo, reflectionTexture, this.realTimeFiltering);

                if (defines.ENVIRONMENTBRDF) {
                    ubo.setTexture("environmentBrdfSampler", this._environmentBRDFTexture);
                }

                if (this._emissiveTexture && MaterialFlags.EmissiveTextureEnabled) {
                    ubo.setTexture("emissiveSampler", this._emissiveTexture);
                }

                if (this._lightmapTexture && MaterialFlags.LightmapTextureEnabled) {
                    ubo.setTexture("lightmapSampler", this._lightmapTexture);
                }

                if (this._bumpTexture && engine.getCaps().standardDerivatives && MaterialFlags.BumpTextureEnabled && !this._disableBumpMap) {
                    ubo.setTexture("bumpSampler", this._bumpTexture);
                }
            }

            // OIT with depth peeling
            if (this.getScene().useOrderIndependentTransparency && this.needAlphaBlendingForMesh(mesh)) {
                this.getScene().depthPeelingRenderer!.bind(effect);
            }

            this._eventInfo.subMesh = subMesh;
            this._callbackPluginEventBindForSubMesh(this._eventInfo);

            // Clip plane
            BindClipPlane(this._activeEffect, this, scene);

            this.bindEyePosition(effect);
        } else if (scene.getEngine()._features.needToAlwaysBindUniformBuffers) {
            this._needToBindSceneUbo = true;
        }

        if (mustRebind || !this.isFrozen) {
            // Lights
            if (scene.lightsEnabled && !this._disableLighting) {
                BindLights(scene, mesh, this._activeEffect, defines, this._maxSimultaneousLights);
            }

            // View
            if ((scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) || reflectionTexture || mesh.receiveShadows || defines.PREPASS) {
                this.bindView(effect);
            }

            // Fog
            BindFogParameters(scene, mesh, this._activeEffect, true);

            // Morph targets
            if (defines.NUM_MORPH_INFLUENCERS) {
                BindMorphTargetParameters(mesh, this._activeEffect);
            }

            if (defines.BAKED_VERTEX_ANIMATION_TEXTURE) {
                mesh.bakedVertexAnimationManager?.bind(effect, defines.INSTANCES);
            }

            // image processing
            this._imageProcessingConfiguration.bind(this._activeEffect);

            // Log. depth
            BindLogDepth(defines, this._activeEffect, scene);
        }

        this._afterBind(mesh, this._activeEffect, subMesh);

        ubo.update();
    }

    /**
     * Returns the animatable textures.
     * If material have animatable metallic texture, then reflectivity texture will not be returned, even if it has animations.
     * @returns - Array of animatable textures.
     */
    public override getAnimatables(): IAnimatable[] {
        const results = super.getAnimatables();

        // Loop through samplers and push animated textures to list.
        for (const key in this._samplersList) {
            const sampler = this._samplersList[key];
            if (sampler.value && sampler.value.animations && sampler.value.animations.length > 0) {
                results.push(sampler.value);
            }
        }

        if (this._ambientTexture && this._ambientTexture.animations && this._ambientTexture.animations.length > 0) {
            results.push(this._ambientTexture);
        }

        if (this._opacityTexture && this._opacityTexture.animations && this._opacityTexture.animations.length > 0) {
            results.push(this._opacityTexture);
        }

        if (this._reflectionTexture && this._reflectionTexture.animations && this._reflectionTexture.animations.length > 0) {
            results.push(this._reflectionTexture);
        }

        if (this._emissiveTexture && this._emissiveTexture.animations && this._emissiveTexture.animations.length > 0) {
            results.push(this._emissiveTexture);
        }

        if (this._bumpTexture && this._bumpTexture.animations && this._bumpTexture.animations.length > 0) {
            results.push(this._bumpTexture);
        }

        if (this._lightmapTexture && this._lightmapTexture.animations && this._lightmapTexture.animations.length > 0) {
            results.push(this._lightmapTexture);
        }

        return results;
    }

    /**
     * Returns an array of the actively used textures.
     * @returns - Array of BaseTextures
     */
    public override getActiveTextures(): BaseTexture[] {
        const activeTextures = super.getActiveTextures();

        // Loop through samplers and push active textures
        for (const key in this._samplersList) {
            const sampler = this._samplersList[key];
            if (sampler.value) {
                activeTextures.push(sampler.value);
            }
        }

        if (this._ambientTexture) {
            activeTextures.push(this._ambientTexture);
        }

        if (this._opacityTexture) {
            activeTextures.push(this._opacityTexture);
        }

        if (this._reflectionTexture) {
            activeTextures.push(this._reflectionTexture);
        }

        if (this._emissiveTexture) {
            activeTextures.push(this._emissiveTexture);
        }

        if (this._bumpTexture) {
            activeTextures.push(this._bumpTexture);
        }

        if (this._lightmapTexture) {
            activeTextures.push(this._lightmapTexture);
        }

        return activeTextures;
    }

    /**
     * Checks to see if a texture is used in the material.
     * @param texture - Base texture to use.
     * @returns - Boolean specifying if a texture is used in the material.
     */
    public override hasTexture(texture: BaseTexture): boolean {
        if (super.hasTexture(texture)) {
            return true;
        }

        // Loop through samplers and check each texture for equality
        for (const key in this._samplersList) {
            const sampler = this._samplersList[key];
            if (sampler.value === texture) {
                return true;
            }
        }

        if (this._ambientTexture === texture) {
            return true;
        }

        if (this._opacityTexture === texture) {
            return true;
        }

        if (this._reflectionTexture === texture) {
            return true;
        }

        if (this._emissiveTexture === texture) {
            return true;
        }

        if (this._bumpTexture === texture) {
            return true;
        }

        if (this._lightmapTexture === texture) {
            return true;
        }

        return false;
    }

    /**
     * Sets the required values to the prepass renderer.
     * It can't be sets when subsurface scattering of this material is disabled.
     * When scene have ability to enable subsurface prepass effect, it will enable.
     * @returns - If prepass is enabled or not.
     */
    public override setPrePassRenderer(): boolean {
        return false;
    }

    /**
     * Disposes the resources of the material.
     * @param forceDisposeEffect - Forces the disposal of effects.
     * @param forceDisposeTextures - Forces the disposal of all textures.
     */
    public override dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void {
        this._breakShaderLoadedCheck = true;
        if (forceDisposeTextures) {
            if (this._environmentBRDFTexture && this.getScene().environmentBRDFTexture !== this._environmentBRDFTexture) {
                this._environmentBRDFTexture.dispose();
            }

            // Loop through samplers and dispose the textures
            for (const key in this._samplersList) {
                const sampler = this._samplersList[key];
                sampler.value?.dispose();
            }

            this._ambientTexture?.dispose();
            this._opacityTexture?.dispose();
            this._reflectionTexture?.dispose();
            this._emissiveTexture?.dispose();
            this._bumpTexture?.dispose();
            this._lightmapTexture?.dispose();
        }

        this._renderTargets.dispose();

        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }

        super.dispose(forceDisposeEffect, forceDisposeTextures);
    }

    /**
     * Returns the texture used for reflections.
     * @returns - Reflection texture if present.  Otherwise, returns the environment texture.
     */
    private _getReflectionTexture(): Nullable<BaseTexture> {
        if (this._reflectionTexture) {
            return this._reflectionTexture;
        }

        return this.getScene().environmentTexture;
    }

    private _prepareEffect(
        mesh: AbstractMesh,
        defines: OpenPBRMaterialDefines,
        onCompiled: Nullable<(effect: Effect) => void> = null,
        onError: Nullable<(effect: Effect, errors: string) => void> = null,
        useInstances: Nullable<boolean> = null,
        useClipPlane: Nullable<boolean> = null,
        useThinInstances: boolean
    ): Nullable<Effect> {
        this._prepareDefines(mesh, defines, useInstances, useClipPlane, useThinInstances);

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

        let shaderName = "openpbr";

        const uniforms = [
            "world",
            "view",
            "viewProjection",
            "vEyePosition",
            "vLightsType",
            "vAmbientColor",
            "vMetallicReflectanceFactors",
            "visibility",
            "vFogInfos",
            "vFogColor",
            "pointSize",
            "vAlbedoInfos",
            "vAmbientInfos",
            "vOpacityInfos",
            "vEmissiveInfos",
            "vMetallicReflectanceInfos",
            "vReflectanceInfos",
            "vBumpInfos",
            "vLightmapInfos",
            "mBones",
            "albedoMatrix",
            "ambientMatrix",
            "opacityMatrix",
            "emissiveMatrix",
            "normalMatrix",
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

        for (const uniformName in Object.keys(this._uniformsList)) {
            uniforms.push(uniformName);
        }

        const samplers = [
            "reflectivitySampler",
            "ambientSampler",
            "emissiveSampler",
            "bumpSampler",
            "lightmapSampler",
            "opacitySampler",
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

        for (const key in this._samplersList) {
            const sampler = this._samplersList[key];
            samplers.push(sampler.samplerName);
        }

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
                extraInitializationsAsync: this._shadersLoaded
                    ? undefined
                    : async () => {
                          if (this.shaderLanguage === ShaderLanguage.WGSL) {
                              await Promise.all([import("../../ShadersWGSL/openpbr.vertex"), import("../../ShadersWGSL/openpbr.fragment")]);
                          } else {
                              await Promise.all([import("../../Shaders/openpbr.vertex"), import("../../Shaders/openpbr.fragment")]);
                          }

                          this._shadersLoaded = true;
                      },
            },
            engine
        );

        this._eventInfo.customCode = undefined;

        return effect;
    }

    private _prepareDefines(
        mesh: AbstractMesh,
        defines: OpenPBRMaterialDefines,
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
        defines.METALLICWORKFLOW = true;
        if (defines._areTexturesDirty) {
            defines._needUVs = false;
            for (let i = 1; i <= Constants.MAX_SUPPORTED_UV_SETS; ++i) {
                defines["MAINUV" + i] = false;
            }
            if (scene.texturesEnabled) {
                defines.AMBIENTDIRECTUV = 0;
                defines.OPACITYDIRECTUV = 0;
                defines.EMISSIVEDIRECTUV = 0;
                defines.REFLECTIVITYDIRECTUV = 0;
                defines.METALLIC_REFLECTANCEDIRECTUV = 0;
                defines.REFLECTANCEDIRECTUV = 0;
                defines.BUMPDIRECTUV = 0;
                defines.LIGHTMAPDIRECTUV = 0;

                if (engine.getCaps().textureLOD) {
                    defines.LODBASEDMICROSFURACE = true;
                }

                // TODO - loop through samplers and prepare defines for each texture
                for (const key in this._samplersList) {
                    const sampler = this._samplersList[key];
                    if (sampler.value) {
                        PrepareDefinesForMergedUV(sampler.value, defines, sampler.textureDefine);
                        defines[sampler.textureDefine + "_GAMMA"] = sampler.value.gammaSpace;
                    } else {
                        defines[sampler.textureDefine] = false;
                    }
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

                const reflectionTexture = this._getReflectionTexture();
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
                    if (this._baseMetalRoughTexture) {
                        defines.AOSTOREINMETALMAPRED = this._useAmbientOcclusionFromMetallicTextureRed;
                    }

                    defines.SPECULAR_WEIGHT_USE_ALPHA_ONLY = this._useSpecularWeightFromTextureAlpha;
                }

                if (engine.getCaps().standardDerivatives && this._bumpTexture && MaterialFlags.BumpTextureEnabled && !this._disableBumpMap) {
                    PrepareDefinesForMergedUV(this._bumpTexture, defines, "BUMP");

                    if (this._useParallax && this.baseColorTexture && MaterialFlags.DiffuseTextureEnabled) {
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
        }

        if (defines._areImageProcessingDirty && this._imageProcessingConfiguration) {
            this._imageProcessingConfiguration.prepareDefines(defines);
        }

        defines.FORCENORMALFORWARD = this._forceNormalForward;

        defines.RADIANCEOCCLUSION = this._useRadianceOcclusion;

        defines.HORIZONOCCLUSION = this._useHorizonOcclusion;

        // Misc.
        if (defines._areMiscDirty) {
            PrepareDefinesForMisc(
                mesh,
                scene,
                this._useLogarithmicDepth,
                this.pointsCloud,
                this.fogEnabled,
                this.needAlphaTestingForMesh(mesh),
                defines,
                this._applyDecalMapAfterDetailMap
            );
            defines.UNLIT = this._unlit || ((this.pointsCloud || this.wireframe) && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind));
            defines.DEBUGMODE = this._debugMode;
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
}

RegisterClass("BABYLON.OpenPBRMaterial", OpenPBRMaterial);
