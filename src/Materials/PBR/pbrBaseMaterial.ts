import { serialize, serializeAsImageProcessingConfiguration, expandToProperty } from "../../Misc/decorators";
import { Observer } from "../../Misc/observable";
import { Logger } from "../../Misc/logger";
import { SmartArray } from "../../Misc/smartArray";
import { BRDFTextureTools } from "../../Misc/brdfTextureTools";
import { Nullable } from "../../types";
import { Camera } from "../../Cameras/camera";
import { Scene } from "../../scene";
import { Matrix, Vector4 } from "../../Maths/math.vector";
import { VertexBuffer } from "../../Meshes/buffer";
import { SubMesh } from "../../Meshes/subMesh";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";
import { IMaterialClearCoatDefines, PBRClearCoatConfiguration } from "./pbrClearCoatConfiguration";
import { IMaterialAnisotropicDefines, PBRAnisotropicConfiguration } from "./pbrAnisotropicConfiguration";
import { IMaterialBRDFDefines, PBRBRDFConfiguration } from "./pbrBRDFConfiguration";
import { IMaterialSheenDefines, PBRSheenConfiguration } from "./pbrSheenConfiguration";
import { IMaterialSubSurfaceDefines, PBRSubSurfaceConfiguration } from "./pbrSubSurfaceConfiguration";
import { Color3, TmpColors } from '../../Maths/math.color';
import { Scalar } from "../../Maths/math.scalar";

import { ImageProcessingConfiguration, IImageProcessingConfigurationDefines } from "../../Materials/imageProcessingConfiguration";
import { Effect, IEffectCreationOptions } from "../../Materials/effect";
import { Material, IMaterialCompilationOptions, ICustomShaderNameResolveOptions } from "../../Materials/material";
import { MaterialDefines } from "../../Materials/materialDefines";
import { PushMaterial } from "../../Materials/pushMaterial";
import { MaterialHelper } from "../../Materials/materialHelper";

import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Texture } from "../../Materials/Textures/texture";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { CubeTexture } from "../../Materials/Textures/cubeTexture";

import { MaterialFlags } from "../materialFlags";
import { Constants } from "../../Engines/constants";
import { IAnimatable } from '../../Animations/animatable.interface';

import "../../Materials/Textures/baseTexture.polynomial";
import "../../Shaders/pbr.fragment";
import "../../Shaders/pbr.vertex";

import { EffectFallbacks } from '../effectFallbacks';
import { IMaterialDetailMapDefines, DetailMapConfiguration } from '../material.detailMapConfiguration';

const onCreatedEffectParameters = { effect: null as unknown as Effect, subMesh: null as unknown as Nullable<SubMesh> };

/**
 * Manages the defines for the PBR Material.
 * @hidden
 */
export class PBRMaterialDefines extends MaterialDefines
    implements IImageProcessingConfigurationDefines,
    IMaterialClearCoatDefines,
    IMaterialAnisotropicDefines,
    IMaterialBRDFDefines,
    IMaterialSheenDefines,
    IMaterialSubSurfaceDefines,
    IMaterialDetailMapDefines {
    public PBR = true;

    public NUM_SAMPLES = "0";
    public REALTIME_FILTERING = false;

    public MAINUV1 = false;
    public MAINUV2 = false;
    public UV1 = false;
    public UV2 = false;

    public ALBEDO = false;
    public GAMMAALBEDO = false;
    public ALBEDODIRECTUV = 0;
    public VERTEXCOLOR = false;

    public DETAIL = false;
    public DETAILDIRECTUV = 0;
    public DETAIL_NORMALBLENDMETHOD = 0;

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

    public REFLECTIVITY = false;
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
    public METALLIC_REFLECTANCEDIRECTUV = 0;

    public ENVIRONMENTBRDF = false;
    public ENVIRONMENTBRDF_RGBD = false;

    public NORMAL = false;
    public TANGENT = false;
    public BUMP = false;
    public BUMPDIRECTUV = 0;
    public OBJECTSPACE_NORMALMAP = false;
    public PARALLAX = false;
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
    public SPHERICAL_HARMONICS = false;
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

    public HIGH_DEFINITION_PIPELINE = false;
    public SCENE_MRT_COUNT = 0;

    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public BONETEXTURE = false;

    public NONUNIFORMSCALING = false;

    public MORPHTARGETS = false;
    public MORPHTARGETS_NORMAL = false;
    public MORPHTARGETS_TANGENT = false;
    public MORPHTARGETS_UV = false;
    public NUM_MORPH_INFLUENCERS = 0;

    public IMAGEPROCESSING = false;
    public VIGNETTE = false;
    public VIGNETTEBLENDMODEMULTIPLY = false;
    public VIGNETTEBLENDMODEOPAQUE = false;
    public TONEMAPPING = false;
    public TONEMAPPING_ACES = false;
    public CONTRAST = false;
    public COLORCURVES = false;
    public COLORGRADING = false;
    public COLORGRADING3D = false;
    public SAMPLER3DGREENDEPTH = false;
    public SAMPLER3DBGRMAP = false;
    public IMAGEPROCESSINGPOSTPROCESS = false;
    public EXPOSURE = false;
    public MULTIVIEW = false;

    public USEPHYSICALLIGHTFALLOFF = false;
    public USEGLTFLIGHTFALLOFF = false;
    public TWOSIDEDLIGHTING = false;
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

    public FORCENORMALFORWARD = false;

    public SPECULARAA = false;

    public CLEARCOAT = false;
    public CLEARCOAT_DEFAULTIOR = false;
    public CLEARCOAT_TEXTURE = false;
    public CLEARCOAT_TEXTUREDIRECTUV = 0;
    public CLEARCOAT_BUMP = false;
    public CLEARCOAT_BUMPDIRECTUV = 0;
    public CLEARCOAT_TINT = false;
    public CLEARCOAT_TINT_TEXTURE = false;
    public CLEARCOAT_TINT_TEXTUREDIRECTUV = 0;

    public ANISOTROPIC = false;
    public ANISOTROPIC_TEXTURE = false;
    public ANISOTROPIC_TEXTUREDIRECTUV = 0;

    public BRDF_V_HEIGHT_CORRELATED = false;
    public MS_BRDF_ENERGY_CONSERVATION = false;
    public SPECULAR_GLOSSINESS_ENERGY_CONSERVATION = false;

    public SHEEN = false;
    public SHEEN_TEXTURE = false;
    public SHEEN_TEXTUREDIRECTUV = 0;
    public SHEEN_LINKWITHALBEDO = false;
    public SHEEN_ROUGHNESS = false;
    public SHEEN_ALBEDOSCALING = false;

    public SUBSURFACE = false;

    public SS_REFRACTION = false;
    public SS_TRANSLUCENCY = false;
    public SS_SCATTERING = false;

    public SS_THICKNESSANDMASK_TEXTURE = false;
    public SS_THICKNESSANDMASK_TEXTUREDIRECTUV = 0;

    public SS_REFRACTIONMAP_3D = false;
    public SS_REFRACTIONMAP_OPPOSITEZ = false;
    public SS_LODINREFRACTIONALPHA = false;
    public SS_GAMMAREFRACTION = false;
    public SS_RGBDREFRACTION = false;
    public SS_LINEARSPECULARREFRACTION = false;
    public SS_LINKREFRACTIONTOTRANSPARENCY = false;
    public SS_ALBEDOFORREFRACTIONTINT = false;

    public SS_MASK_FROM_THICKNESS_TEXTURE = false;

    public UNLIT = false;

    public DEBUGMODE = 0;

    /**
     * Initializes the PBR Material defines.
     */
    constructor() {
        super();
        this.rebuild();
    }

    /**
     * Resets the PBR Material defines.
     */
    public reset(): void {
        super.reset();
        this.ALPHATESTVALUE = "0.5";
        this.PBR = true;
    }
}

/**
 * The Physically based material base class of BJS.
 *
 * This offers the main features of a standard PBR material.
 * For more information, please refer to the documentation :
 * https://doc.babylonjs.com/how_to/physically_based_rendering
 */
export abstract class PBRBaseMaterial extends PushMaterial {
    /**
     * PBRMaterialTransparencyMode: No transparency mode, Alpha channel is not use.
     */
    public static readonly PBRMATERIAL_OPAQUE = Material.MATERIAL_OPAQUE;

    /**
     * PBRMaterialTransparencyMode: Alpha Test mode, pixel are discarded below a certain threshold defined by the alpha cutoff value.
     */
    public static readonly PBRMATERIAL_ALPHATEST = Material.MATERIAL_ALPHATEST;

    /**
     * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
     */
    public static readonly PBRMATERIAL_ALPHABLEND = Material.MATERIAL_ALPHABLEND;

    /**
     * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
     * They are also discarded below the alpha cutoff threshold to improve performances.
     */
    public static readonly PBRMATERIAL_ALPHATESTANDBLEND = Material.MATERIAL_ALPHATESTANDBLEND;

    /**
     * Defines the default value of how much AO map is occluding the analytical lights
     * (point spot...).
     */
    public static DEFAULT_AO_ON_ANALYTICAL_LIGHTS = 0;

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
     * Intensity of the direct lights e.g. the four lights available in your scene.
     * This impacts both the direct diffuse and specular highlights.
     */
    protected _directIntensity: number = 1.0;

    /**
     * Intensity of the emissive part of the material.
     * This helps controlling the emissive effect without modifying the emissive color.
     */
    protected _emissiveIntensity: number = 1.0;

    /**
     * Intensity of the environment e.g. how much the environment will light the object
     * either through harmonics for rough material or through the refelction for shiny ones.
     */
    protected _environmentIntensity: number = 1.0;

    /**
     * This is a special control allowing the reduction of the specular highlights coming from the
     * four lights of the scene. Those highlights may not be needed in full environment lighting.
     */
    protected _specularIntensity: number = 1.0;

    /**
     * This stores the direct, emissive, environment, and specular light intensities into a Vector4.
     */
    private _lightingInfos: Vector4 = new Vector4(this._directIntensity, this._emissiveIntensity, this._environmentIntensity, this._specularIntensity);

    /**
     * Debug Control allowing disabling the bump map on this material.
     */
    protected _disableBumpMap: boolean = false;

    /**
     * AKA Diffuse Texture in standard nomenclature.
     */
    protected _albedoTexture: Nullable<BaseTexture> = null;

    /**
     * AKA Occlusion Texture in other nomenclature.
     */
    protected _ambientTexture: Nullable<BaseTexture> = null;

    /**
     * AKA Occlusion Texture Intensity in other nomenclature.
     */
    protected _ambientTextureStrength: number = 1.0;

    /**
     * Defines how much the AO map is occluding the analytical lights (point spot...).
     * 1 means it completely occludes it
     * 0 mean it has no impact
     */
    protected _ambientTextureImpactOnAnalyticalLights: number = PBRBaseMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS;

    /**
     * Stores the alpha values in a texture.
     */
    protected _opacityTexture: Nullable<BaseTexture> = null;

    /**
     * Stores the reflection values in a texture.
     */
    protected _reflectionTexture: Nullable<BaseTexture> = null;

    /**
     * Stores the emissive values in a texture.
     */
    protected _emissiveTexture: Nullable<BaseTexture> = null;

    /**
     * AKA Specular texture in other nomenclature.
     */
    protected _reflectivityTexture: Nullable<BaseTexture> = null;

    /**
     * Used to switch from specular/glossiness to metallic/roughness workflow.
     */
    protected _metallicTexture: Nullable<BaseTexture> = null;

    /**
     * Specifies the metallic scalar of the metallic/roughness workflow.
     * Can also be used to scale the metalness values of the metallic texture.
     */
    protected _metallic: Nullable<number> = null;

    /**
     * Specifies the roughness scalar of the metallic/roughness workflow.
     * Can also be used to scale the roughness values of the metallic texture.
     */
    protected _roughness: Nullable<number> = null;

    /**
     * In metallic workflow, specifies an F0 factor to help configuring the material F0.
     * By default the indexOfrefraction is used to compute F0;
     *
     * This is used as a factor against the default reflectance at normal incidence to tweak it.
     *
     * F0 = defaultF0 * metallicF0Factor * metallicReflectanceColor;
     * F90 = metallicReflectanceColor;
     */
    protected _metallicF0Factor = 1;

    /**
     * In metallic workflow, specifies an F90 color to help configuring the material F90.
     * By default the F90 is always 1;
     *
     * Please note that this factor is also used as a factor against the default reflectance at normal incidence.
     *
     * F0 = defaultF0 * metallicF0Factor * metallicReflectanceColor
     * F90 = metallicReflectanceColor;
     */
    protected _metallicReflectanceColor = Color3.White();

    /**
     * Defines to store metallicReflectanceColor in RGB and metallicF0Factor in A
     * This is multiply against the scalar values defined in the material.
     */
    protected _metallicReflectanceTexture: Nullable<BaseTexture> = null;

    /**
     * Used to enable roughness/glossiness fetch from a separate channel depending on the current mode.
     * Gray Scale represents roughness in metallic mode and glossiness in specular mode.
     */
    protected _microSurfaceTexture: Nullable<BaseTexture> = null;

    /**
     * Stores surface normal data used to displace a mesh in a texture.
     */
    protected _bumpTexture: Nullable<BaseTexture> = null;

    /**
     * Stores the pre-calculated light information of a mesh in a texture.
     */
    protected _lightmapTexture: Nullable<BaseTexture> = null;

    /**
     * The color of a material in ambient lighting.
     */
    protected _ambientColor = new Color3(0, 0, 0);

    /**
     * AKA Diffuse Color in other nomenclature.
     */
    protected _albedoColor = new Color3(1, 1, 1);

    /**
     * AKA Specular Color in other nomenclature.
     */
    protected _reflectivityColor = new Color3(1, 1, 1);

    /**
     * The color applied when light is reflected from a material.
     */
    protected _reflectionColor = new Color3(1, 1, 1);

    /**
     * The color applied when light is emitted from a material.
     */
    protected _emissiveColor = new Color3(0, 0, 0);

    /**
     * AKA Glossiness in other nomenclature.
     */
    protected _microSurface = 0.9;

    /**
     * Specifies that the material will use the light map as a show map.
     */
    protected _useLightmapAsShadowmap = false;

    /**
     * This parameters will enable/disable Horizon occlusion to prevent normal maps to look shiny when the normal
     * makes the reflect vector face the model (under horizon).
     */
    protected _useHorizonOcclusion = true;

    /**
     * This parameters will enable/disable radiance occlusion by preventing the radiance to lit
     * too much the area relying on ambient texture to define their ambient occlusion.
     */
    protected _useRadianceOcclusion = true;

    /**
     * Specifies that the alpha is coming form the albedo channel alpha channel for alpha blending.
     */
    protected _useAlphaFromAlbedoTexture = false;

    /**
     * Specifies that the material will keeps the specular highlights over a transparent surface (only the most limunous ones).
     * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
     */
    protected _useSpecularOverAlpha = true;

    /**
     * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
     */
    protected _useMicroSurfaceFromReflectivityMapAlpha = false;

    /**
     * Specifies if the metallic texture contains the roughness information in its alpha channel.
     */
    protected _useRoughnessFromMetallicTextureAlpha = true;

    /**
     * Specifies if the metallic texture contains the roughness information in its green channel.
     */
    protected _useRoughnessFromMetallicTextureGreen = false;

    /**
     * Specifies if the metallic texture contains the metallness information in its blue channel.
     */
    protected _useMetallnessFromMetallicTextureBlue = false;

    /**
     * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
     */
    protected _useAmbientOcclusionFromMetallicTextureRed = false;

    /**
     * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
     */
    protected _useAmbientInGrayScale = false;

    /**
     * In case the reflectivity map does not contain the microsurface information in its alpha channel,
     * The material will try to infer what glossiness each pixel should be.
     */
    protected _useAutoMicroSurfaceFromReflectivityMap = false;

    /**
     * Defines the  falloff type used in this material.
     * It by default is Physical.
     */
    protected _lightFalloff = PBRBaseMaterial.LIGHTFALLOFF_PHYSICAL;

    /**
     * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most limunous ones).
     * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
     */
    protected _useRadianceOverAlpha = true;

    /**
     * Allows using an object space normal map (instead of tangent space).
     */
    protected _useObjectSpaceNormalMap = false;

    /**
     * Allows using the bump map in parallax mode.
     */
    protected _useParallax = false;

    /**
     * Allows using the bump map in parallax occlusion mode.
     */
    protected _useParallaxOcclusion = false;

    /**
     * Controls the scale bias of the parallax mode.
     */
    protected _parallaxScaleBias = 0.05;

    /**
     * If sets to true, disables all the lights affecting the material.
     */
    protected _disableLighting = false;

    /**
     * Number of Simultaneous lights allowed on the material.
     */
    protected _maxSimultaneousLights = 4;

    /**
     * If sets to true, x component of normal map value will be inverted (x = 1.0 - x).
     */
    protected _invertNormalMapX = false;

    /**
     * If sets to true, y component of normal map value will be inverted (y = 1.0 - y).
     */
    protected _invertNormalMapY = false;

    /**
     * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
     */
    protected _twoSidedLighting = false;

    /**
     * Defines the alpha limits in alpha test mode.
     */
    protected _alphaCutOff = 0.4;

    /**
     * Enforces alpha test in opaque or blend mode in order to improve the performances of some situations.
     */
    protected _forceAlphaTest = false;

    /**
     * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
     * And/Or occlude the blended part. (alpha is converted to gamma to compute the fresnel)
     */
    protected _useAlphaFresnel = false;

    /**
     * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
     * And/Or occlude the blended part. (alpha stays linear to compute the fresnel)
     */
    protected _useLinearAlphaFresnel = false;

    /**
     * Specifies the environment BRDF texture used to comput the scale and offset roughness values
     * from cos thetav and roughness:
     * http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
     */
    protected _environmentBRDFTexture: Nullable<BaseTexture> = null;

    /**
     * Force the shader to compute irradiance in the fragment shader in order to take bump in account.
     */
    protected _forceIrradianceInFragment = false;

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
    public get realTimeFilteringQuality() : number {
        return this._realTimeFilteringQuality;
    }
    public set realTimeFilteringQuality(n: number) {
        this._realTimeFilteringQuality = n;
        this.markAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    public get shouldRenderToMRT() {
        return true;
    }

    /**
     * Force normal to face away from face.
     */
    protected _forceNormalForward = false;

    /**
     * Enables specular anti aliasing in the PBR shader.
     * It will both interacts on the Geometry for analytical and IBL lighting.
     * It also prefilter the roughness map based on the bump values.
     */
    protected _enableSpecularAntiAliasing = false;

    /**
     * Default configuration related to image processing available in the PBR Material.
     */
    @serializeAsImageProcessingConfiguration()
    protected _imageProcessingConfiguration: ImageProcessingConfiguration;

    /**
     * Keep track of the image processing observer to allow dispose and replace.
     */
    private _imageProcessingObserver: Nullable<Observer<ImageProcessingConfiguration>> = null;

    /**
     * Attaches a new image processing configuration to the PBR Material.
     * @param configuration
     */
    protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void {
        if (configuration === this._imageProcessingConfiguration) {
            return;
        }

        // Detaches observer.
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }

        // Pick the scene configuration if needed.
        if (!configuration) {
            this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration;
        }
        else {
            this._imageProcessingConfiguration = configuration;
        }

        // Attaches observer.
        if (this._imageProcessingConfiguration) {
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
                this._markAllSubMeshesAsImageProcessingDirty();
            });
        }
    }

    /**
     * Stores the available render targets.
     */
    private _renderTargets = new SmartArray<RenderTargetTexture>(16);

    /**
     * Sets the global ambient color for the material used in lighting calculations.
     */
    private _globalAmbientColor = new Color3(0, 0, 0);

    /**
     * Enables the use of logarithmic depth buffers, which is good for wide depth buffers.
     */
    private _useLogarithmicDepth: boolean = false;

    /**
     * If set to true, no lighting calculations will be applied.
     */
    private _unlit = false;

    private _debugMode = 0;
    /**
     * @hidden
     * This is reserved for the inspector.
     * Defines the material debug mode.
     * It helps seeing only some components of the material while troubleshooting.
     */
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public debugMode = 0;

    /**
     * @hidden
     * This is reserved for the inspector.
     * Specify from where on screen the debug mode should start.
     * The value goes from -1 (full screen) to 1 (not visible)
     * It helps with side by side comparison against the final render
     * This defaults to -1
     */
    private debugLimit = -1;

    /**
     * @hidden
     * This is reserved for the inspector.
     * As the default viewing range might not be enough (if the ambient is really small for instance)
     * You can use the factor to better multiply the final value.
     */
    private debugFactor = 1;

    /**
     * Defines the clear coat layer parameters for the material.
     */
    public readonly clearCoat = new PBRClearCoatConfiguration(this._markAllSubMeshesAsTexturesDirty.bind(this));

    /**
     * Defines the anisotropic parameters for the material.
     */
    public readonly anisotropy = new PBRAnisotropicConfiguration(this._markAllSubMeshesAsTexturesDirty.bind(this));

    /**
     * Defines the BRDF parameters for the material.
     */
    public readonly brdf = new PBRBRDFConfiguration(this._markAllSubMeshesAsMiscDirty.bind(this));

    /**
     * Defines the Sheen parameters for the material.
     */
    public readonly sheen = new PBRSheenConfiguration(this._markAllSubMeshesAsTexturesDirty.bind(this));

    /**
     * Defines the SubSurface parameters for the material.
     */
    public readonly subSurface = new PBRSubSurfaceConfiguration(this._markAllSubMeshesAsTexturesDirty.bind(this), this._markSceneDeferredDirty.bind(this));

    /**
     * Defines the detail map parameters for the material.
     */
    public readonly detailMap = new DetailMapConfiguration(this._markAllSubMeshesAsTexturesDirty.bind(this));

    protected _rebuildInParallel = false;

    /**
     * Instantiates a new PBRMaterial instance.
     *
     * @param name The material name
     * @param scene The scene the material will be use in.
     */
    constructor(name: string, scene: Scene) {
        super(name, scene);

        // Setup the default processing configuration to the scene.
        this._attachImageProcessingConfiguration(null);

        this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
            this._renderTargets.reset();

            if (MaterialFlags.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                this._renderTargets.push(<RenderTargetTexture>this._reflectionTexture);
            }

            this.subSurface.fillRenderTargetTextures(this._renderTargets);

            return this._renderTargets;
        };

        this._environmentBRDFTexture = BRDFTextureTools.GetEnvironmentBRDFTexture(scene);
    }

    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    public get hasRenderTargetTextures(): boolean {
        if (MaterialFlags.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
            return true;
        }

        return this.subSurface.hasRenderTargetTextures();
    }

    /**
     * Gets the name of the material class.
     */
    public getClassName(): string {
        return "PBRBaseMaterial";
    }

    /**
     * Enabled the use of logarithmic depth buffers, which is good for wide depth buffers.
     */
    @serialize()
    public get useLogarithmicDepth(): boolean {
        return this._useLogarithmicDepth;
    }

    /**
     * Enabled the use of logarithmic depth buffers, which is good for wide depth buffers.
     */
    public set useLogarithmicDepth(value: boolean) {
        this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
    }

    /**
     * Returns true if alpha blending should be disabled.
     */
    protected get _disableAlphaBlending(): boolean {
        return (this.subSurface.disableAlphaBlending ||
            this._transparencyMode === PBRBaseMaterial.PBRMATERIAL_OPAQUE ||
            this._transparencyMode === PBRBaseMaterial.PBRMATERIAL_ALPHATEST);
    }

    /**
     * Specifies whether or not this material should be rendered in alpha blend mode.
     */
    public needAlphaBlending(): boolean {
        if (this._disableAlphaBlending) {
            return false;
        }

        return (this.alpha < 1.0) || (this._opacityTexture != null) || this._shouldUseAlphaFromAlbedoTexture();
    }

    /**
     * Specifies whether or not this material should be rendered in alpha test mode.
     */
    public needAlphaTesting(): boolean {
        if (this._forceAlphaTest) {
            return true;
        }

        if (this.subSurface.disableAlphaBlending) {
            return false;
        }

        return this._albedoTexture != null && this._albedoTexture.hasAlpha && (this._transparencyMode == null || this._transparencyMode === PBRBaseMaterial.PBRMATERIAL_ALPHATEST);
    }

    /**
     * Specifies whether or not the alpha value of the albedo texture should be used for alpha blending.
     */
    protected _shouldUseAlphaFromAlbedoTexture(): boolean {
        return this._albedoTexture != null && this._albedoTexture.hasAlpha && this._useAlphaFromAlbedoTexture && this._transparencyMode !== PBRBaseMaterial.PBRMATERIAL_OPAQUE;
    }

    /**
     * Gets the texture used for the alpha test.
     */
    public getAlphaTestTexture(): Nullable<BaseTexture> {
        return this._albedoTexture;
    }

    /**
     * Specifies that the submesh is ready to be used.
     * @param mesh - BJS mesh.
     * @param subMesh - A submesh of the BJS mesh.  Used to check if it is ready.
     * @param useInstances - Specifies that instances should be used.
     * @returns - boolean indicating that the submesh is ready or not.
     */
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        if (subMesh.effect && this.isFrozen) {
            if (subMesh.effect._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh._materialDefines) {
            subMesh._materialDefines = new PBRMaterialDefines();
        }

        const defines = <PBRMaterialDefines>subMesh._materialDefines;
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const scene = this.getScene();
        const engine = scene.getEngine();

        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (this._albedoTexture && MaterialFlags.DiffuseTextureEnabled) {
                    if (!this._albedoTexture.isReadyOrNotBlocking()) {
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

                var reflectionTexture = this._getReflectionTexture();
                if (reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
                    if (!reflectionTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                    if (reflectionTexture.irradianceTexture && !reflectionTexture.irradianceTexture.isReadyOrNotBlocking()) {
                        return false;
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
                    }
                    else if (this._reflectivityTexture) {
                        if (!this._reflectivityTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                    }

                    if (this._metallicReflectanceTexture) {
                        if (!this._metallicReflectanceTexture.isReadyOrNotBlocking()) {
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

        if (!this.subSurface.isReadyForSubMesh(defines, scene) ||
            !this.clearCoat.isReadyForSubMesh(defines, scene, engine, this._disableBumpMap) ||
            !this.sheen.isReadyForSubMesh(defines, scene) ||
            !this.anisotropy.isReadyForSubMesh(defines, scene) ||
            !this.detailMap.isReadyForSubMesh(defines, scene)) {
            return false;
        }

        if (defines._areImageProcessingDirty && this._imageProcessingConfiguration) {
            if (!this._imageProcessingConfiguration.isReady()) {
                return false;
            }
        }

        if (!engine.getCaps().standardDerivatives && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
            mesh.createNormals(true);
            Logger.Warn("PBRMaterial: Normals have been created for the mesh: " + mesh.name);
        }

        const previousEffect = subMesh.effect;
        const lightDisposed = defines._areLightsDisposed;
        let effect = this._prepareEffect(mesh, defines, this.onCompiled, this.onError, useInstances, null, subMesh.getRenderingMesh().hasThinInstances);

        if (effect) {
            if (this._onEffectCreatedObservable) {
                onCreatedEffectParameters.effect = effect;
                onCreatedEffectParameters.subMesh = subMesh;
                this._onEffectCreatedObservable.notifyObservers(onCreatedEffectParameters);
            }

            // Use previous effect while new one is compiling
            if (this.allowShaderHotSwapping && previousEffect && !effect.isReady()) {
                effect = previousEffect;
                this._rebuildInParallel = true;
                defines.markAsUnprocessed();

                if (lightDisposed) {
                    // re register in case it takes more than one frame.
                    defines._areLightsDisposed = true;
                    return false;
                }
            } else {
                this._rebuildInParallel = false;
                scene.resetCachedMaterial();
                subMesh.setEffect(effect, defines);
                this.buildUniformLayout();
            }
        }

        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        subMesh.effect._wasPreviouslyReady = true;

        return true;
    }

    /**
     * Specifies if the material uses metallic roughness workflow.
     * @returns boolean specifiying if the material uses metallic roughness workflow.
    */
    public isMetallicWorkflow(): boolean {
        if (this._metallic != null || this._roughness != null || this._metallicTexture) {
            return true;
        }

        return false;
    }

    private _prepareEffect(mesh: AbstractMesh, defines: PBRMaterialDefines, onCompiled: Nullable<(effect: Effect) => void> = null, onError: Nullable<(effect: Effect, errors: string) => void> = null,
                useInstances: Nullable<boolean> = null, useClipPlane: Nullable<boolean> = null, useThinInstances: boolean): Nullable<Effect> {
        this._prepareDefines(mesh, defines, useInstances, useClipPlane, useThinInstances);

        if (!defines.isDirty) {
            return null;
        }

        defines.markAsProcessed();

        const scene = this.getScene();
        const engine = scene.getEngine();

        // Fallbacks
        var fallbacks = new EffectFallbacks();
        var fallbackRank = 0;
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
        if (defines.PARALLAXOCCLUSION) {
            fallbacks.addFallback(fallbackRank++, "PARALLAXOCCLUSION");
        }

        fallbackRank = PBRAnisotropicConfiguration.AddFallbacks(defines, fallbacks, fallbackRank);
        fallbackRank = PBRAnisotropicConfiguration.AddFallbacks(defines, fallbacks, fallbackRank);
        fallbackRank = PBRSubSurfaceConfiguration.AddFallbacks(defines, fallbacks, fallbackRank);
        fallbackRank = PBRSheenConfiguration.AddFallbacks(defines, fallbacks, fallbackRank);

        if (defines.ENVIRONMENTBRDF) {
            fallbacks.addFallback(fallbackRank++, "ENVIRONMENTBRDF");
        }

        if (defines.TANGENT) {
            fallbacks.addFallback(fallbackRank++, "TANGENT");
        }

        if (defines.BUMP) {
            fallbacks.addFallback(fallbackRank++, "BUMP");
        }

        fallbackRank = MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this._maxSimultaneousLights, fallbackRank++);

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
        var attribs = [VertexBuffer.PositionKind];

        if (defines.NORMAL) {
            attribs.push(VertexBuffer.NormalKind);
        }

        if (defines.TANGENT) {
            attribs.push(VertexBuffer.TangentKind);
        }

        if (defines.UV1) {
            attribs.push(VertexBuffer.UVKind);
        }

        if (defines.UV2) {
            attribs.push(VertexBuffer.UV2Kind);
        }

        if (defines.VERTEXCOLOR) {
            attribs.push(VertexBuffer.ColorKind);
        }

        MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
        MaterialHelper.PrepareAttributesForInstances(attribs, defines);
        MaterialHelper.PrepareAttributesForMorphTargets(attribs, mesh, defines);

        var shaderName = "pbr";

        var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vAlbedoColor", "vReflectivityColor", "vMetallicReflectanceFactors", "vEmissiveColor", "visibility", "vReflectionColor",
            "vFogInfos", "vFogColor", "pointSize",
            "vAlbedoInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vReflectionPosition", "vReflectionSize", "vEmissiveInfos", "vReflectivityInfos", "vReflectionFilteringInfo", "vMetallicReflectanceInfos",
            "vMicroSurfaceSamplerInfos", "vBumpInfos", "vLightmapInfos",
            "mBones",
            "vClipPlane", "vClipPlane2", "vClipPlane3", "vClipPlane4", "vClipPlane5", "vClipPlane6", "albedoMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "reflectivityMatrix", "normalMatrix", "microSurfaceSamplerMatrix", "bumpMatrix", "lightmapMatrix", "metallicReflectanceMatrix",
            "vLightingIntensity",
            "logarithmicDepthConstant",
            "vSphericalX", "vSphericalY", "vSphericalZ",
            "vSphericalXX_ZZ", "vSphericalYY_ZZ", "vSphericalZZ",
            "vSphericalXY", "vSphericalYZ", "vSphericalZX",
            "vSphericalL00",
            "vSphericalL1_1", "vSphericalL10", "vSphericalL11",
            "vSphericalL2_2", "vSphericalL2_1", "vSphericalL20", "vSphericalL21", "vSphericalL22",
            "vReflectionMicrosurfaceInfos",
            "vTangentSpaceParams", "boneTextureWidth",
            "vDebugMode"
        ];

        var samplers = ["albedoSampler", "reflectivitySampler", "ambientSampler", "emissiveSampler",
            "bumpSampler", "lightmapSampler", "opacitySampler",
            "reflectionSampler", "reflectionSamplerLow", "reflectionSamplerHigh", "irradianceSampler",
            "microSurfaceSampler", "environmentBrdfSampler", "boneSampler", "metallicReflectanceSampler"];

        var uniformBuffers = ["Material", "Scene"];

        DetailMapConfiguration.AddUniforms(uniforms);
        DetailMapConfiguration.AddSamplers(samplers);

        PBRSubSurfaceConfiguration.AddUniforms(uniforms);
        PBRSubSurfaceConfiguration.AddSamplers(samplers);

        PBRClearCoatConfiguration.AddUniforms(uniforms);
        PBRClearCoatConfiguration.AddSamplers(samplers);

        PBRAnisotropicConfiguration.AddUniforms(uniforms);
        PBRAnisotropicConfiguration.AddSamplers(samplers);

        PBRSheenConfiguration.AddUniforms(uniforms);
        PBRSheenConfiguration.AddSamplers(samplers);

        if (ImageProcessingConfiguration) {
            ImageProcessingConfiguration.PrepareUniforms(uniforms, defines);
            ImageProcessingConfiguration.PrepareSamplers(samplers, defines);
        }

        MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
            uniformsNames: uniforms,
            uniformBuffersNames: uniformBuffers,
            samplers: samplers,
            defines: defines,
            maxSimultaneousLights: this._maxSimultaneousLights
        });

        const csnrOptions: ICustomShaderNameResolveOptions = {};

        if (this.customShaderNameResolve) {
            shaderName = this.customShaderNameResolve(shaderName, uniforms, uniformBuffers, samplers, defines, attribs, csnrOptions);
        }

        var join = defines.toString();
        return engine.createEffect(shaderName, <IEffectCreationOptions>{
            attributes: attribs,
            uniformsNames: uniforms,
            uniformBuffersNames: uniformBuffers,
            samplers: samplers,
            defines: join,
            fallbacks: fallbacks,
            onCompiled: onCompiled,
            onError: onError,
            indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights, maxSimultaneousMorphTargets: defines.NUM_MORPH_INFLUENCERS },
            processFinalCode: csnrOptions.processFinalCode,
        }, engine);
    }

    private _prepareDefines(mesh: AbstractMesh, defines: PBRMaterialDefines, useInstances: Nullable<boolean> = null, useClipPlane: Nullable<boolean> = null, useThinInstances: boolean = false): void {
        const scene = this.getScene();
        const engine = scene.getEngine();

        // Lights
        MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
        defines._needNormals = true;

        // Multiview
        MaterialHelper.PrepareDefinesForMultiview(scene, defines);

        // Deferred
        if (this.shouldRenderToMRT) {
            MaterialHelper.PrepareDefinesForDeferred(scene, defines);
        }

        // Textures
        defines.METALLICWORKFLOW = this.isMetallicWorkflow();
        if (defines._areTexturesDirty) {
            defines._needUVs = false;
            if (scene.texturesEnabled) {
                if (scene.getEngine().getCaps().textureLOD) {
                    defines.LODBASEDMICROSFURACE = true;
                }

                if (this._albedoTexture && MaterialFlags.DiffuseTextureEnabled) {
                    MaterialHelper.PrepareDefinesForMergedUV(this._albedoTexture, defines, "ALBEDO");
                    defines.GAMMAALBEDO = this._albedoTexture.gammaSpace;
                } else {
                    defines.ALBEDO = false;
                }

                if (this._ambientTexture && MaterialFlags.AmbientTextureEnabled) {
                    MaterialHelper.PrepareDefinesForMergedUV(this._ambientTexture, defines, "AMBIENT");
                    defines.AMBIENTINGRAYSCALE = this._useAmbientInGrayScale;
                } else {
                    defines.AMBIENT = false;
                }

                if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                    MaterialHelper.PrepareDefinesForMergedUV(this._opacityTexture, defines, "OPACITY");
                    defines.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
                } else {
                    defines.OPACITY = false;
                }

                var reflectionTexture = this._getReflectionTexture();
                if (reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
                    defines.REFLECTION = true;
                    defines.GAMMAREFLECTION = reflectionTexture.gammaSpace;
                    defines.RGBDREFLECTION = reflectionTexture.isRGBD;
                    defines.REFLECTIONMAP_OPPOSITEZ = this.getScene().useRightHandedSystem ? !reflectionTexture.invertZ : reflectionTexture.invertZ;
                    defines.LODINREFLECTIONALPHA = reflectionTexture.lodLevelInAlpha;
                    defines.LINEARSPECULARREFLECTION = reflectionTexture.linearSpecularLOD;

                    if (this.realTimeFiltering && this.realTimeFilteringQuality > 0) {
                        defines.NUM_SAMPLES = "" + this.realTimeFilteringQuality;
                        if (engine.webGLVersion > 1) {
                            defines.NUM_SAMPLES = defines.NUM_SAMPLES + "u";
                        }

                        defines.REALTIME_FILTERING = true;
                    } else {
                        defines.REALTIME_FILTERING = false;
                    }

                    if (reflectionTexture.coordinatesMode === Texture.INVCUBIC_MODE) {
                        defines.INVERTCUBICMAP = true;
                    }

                    defines.REFLECTIONMAP_3D = reflectionTexture.isCube;

                    defines.REFLECTIONMAP_CUBIC = false;
                    defines.REFLECTIONMAP_EXPLICIT = false;
                    defines.REFLECTIONMAP_PLANAR = false;
                    defines.REFLECTIONMAP_PROJECTION = false;
                    defines.REFLECTIONMAP_SKYBOX = false;
                    defines.REFLECTIONMAP_SPHERICAL = false;
                    defines.REFLECTIONMAP_EQUIRECTANGULAR = false;
                    defines.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
                    defines.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;

                    switch (reflectionTexture.coordinatesMode) {
                        case Texture.EXPLICIT_MODE:
                            defines.REFLECTIONMAP_EXPLICIT = true;
                            break;
                        case Texture.PLANAR_MODE:
                            defines.REFLECTIONMAP_PLANAR = true;
                            break;
                        case Texture.PROJECTION_MODE:
                            defines.REFLECTIONMAP_PROJECTION = true;
                            break;
                        case Texture.SKYBOX_MODE:
                            defines.REFLECTIONMAP_SKYBOX = true;
                            break;
                        case Texture.SPHERICAL_MODE:
                            defines.REFLECTIONMAP_SPHERICAL = true;
                            break;
                        case Texture.EQUIRECTANGULAR_MODE:
                            defines.REFLECTIONMAP_EQUIRECTANGULAR = true;
                            break;
                        case Texture.FIXED_EQUIRECTANGULAR_MODE:
                            defines.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = true;
                            break;
                        case Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                            defines.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = true;
                            break;
                        case Texture.CUBIC_MODE:
                        case Texture.INVCUBIC_MODE:
                        default:
                            defines.REFLECTIONMAP_CUBIC = true;
                            defines.USE_LOCAL_REFLECTIONMAP_CUBIC = (<any>reflectionTexture).boundingBoxSize ? true : false;
                            break;
                    }

                    if (reflectionTexture.coordinatesMode !== Texture.SKYBOX_MODE) {
                        if (reflectionTexture.irradianceTexture) {
                            defines.USEIRRADIANCEMAP = true;
                            defines.USESPHERICALFROMREFLECTIONMAP = false;
                        }
                        // Assume using spherical polynomial if the reflection texture is a cube map
                        else if (reflectionTexture.isCube) {
                            defines.USESPHERICALFROMREFLECTIONMAP = true;
                            defines.USEIRRADIANCEMAP = false;
                            if (this._forceIrradianceInFragment || this.realTimeFiltering || scene.getEngine().getCaps().maxVaryingVectors <= 8) {
                                defines.USESPHERICALINVERTEX = false;
                            }
                            else {
                                defines.USESPHERICALINVERTEX = true;
                            }
                        }
                    }
                } else {
                    defines.REFLECTION = false;
                    defines.REFLECTIONMAP_3D = false;
                    defines.REFLECTIONMAP_SPHERICAL = false;
                    defines.REFLECTIONMAP_PLANAR = false;
                    defines.REFLECTIONMAP_CUBIC = false;
                    defines.USE_LOCAL_REFLECTIONMAP_CUBIC = false;
                    defines.REFLECTIONMAP_PROJECTION = false;
                    defines.REFLECTIONMAP_SKYBOX = false;
                    defines.REFLECTIONMAP_EXPLICIT = false;
                    defines.REFLECTIONMAP_EQUIRECTANGULAR = false;
                    defines.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
                    defines.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
                    defines.INVERTCUBICMAP = false;
                    defines.USESPHERICALFROMREFLECTIONMAP = false;
                    defines.USEIRRADIANCEMAP = false;
                    defines.USESPHERICALINVERTEX = false;
                    defines.REFLECTIONMAP_OPPOSITEZ = false;
                    defines.LODINREFLECTIONALPHA = false;
                    defines.GAMMAREFLECTION = false;
                    defines.RGBDREFLECTION = false;
                    defines.LINEARSPECULARREFLECTION = false;
                }

                if (this._lightmapTexture && MaterialFlags.LightmapTextureEnabled) {
                    MaterialHelper.PrepareDefinesForMergedUV(this._lightmapTexture, defines, "LIGHTMAP");
                    defines.USELIGHTMAPASSHADOWMAP = this._useLightmapAsShadowmap;
                    defines.GAMMALIGHTMAP = this._lightmapTexture.gammaSpace;
                    defines.RGBDLIGHTMAP = this._lightmapTexture.isRGBD;
                } else {
                    defines.LIGHTMAP = false;
                }

                if (this._emissiveTexture && MaterialFlags.EmissiveTextureEnabled) {
                    MaterialHelper.PrepareDefinesForMergedUV(this._emissiveTexture, defines, "EMISSIVE");
                } else {
                    defines.EMISSIVE = false;
                }

                if (MaterialFlags.SpecularTextureEnabled) {
                    if (this._metallicTexture) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._metallicTexture, defines, "REFLECTIVITY");
                        defines.ROUGHNESSSTOREINMETALMAPALPHA = this._useRoughnessFromMetallicTextureAlpha;
                        defines.ROUGHNESSSTOREINMETALMAPGREEN = !this._useRoughnessFromMetallicTextureAlpha && this._useRoughnessFromMetallicTextureGreen;
                        defines.METALLNESSSTOREINMETALMAPBLUE = this._useMetallnessFromMetallicTextureBlue;
                        defines.AOSTOREINMETALMAPRED = this._useAmbientOcclusionFromMetallicTextureRed;
                    }
                    else if (this._reflectivityTexture) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._reflectivityTexture, defines, "REFLECTIVITY");
                        defines.MICROSURFACEFROMREFLECTIVITYMAP = this._useMicroSurfaceFromReflectivityMapAlpha;
                        defines.MICROSURFACEAUTOMATIC = this._useAutoMicroSurfaceFromReflectivityMap;
                    } else {
                        defines.REFLECTIVITY = false;
                    }

                    if (this._metallicReflectanceTexture) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._metallicReflectanceTexture, defines, "METALLIC_REFLECTANCE");
                    } else {
                        defines.METALLIC_REFLECTANCE = false;
                    }

                    if (this._microSurfaceTexture) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._microSurfaceTexture, defines, "MICROSURFACEMAP");
                    } else {
                        defines.MICROSURFACEMAP = false;
                    }
                } else {
                    defines.REFLECTIVITY = false;
                    defines.MICROSURFACEMAP = false;
                }

                if (scene.getEngine().getCaps().standardDerivatives && this._bumpTexture && MaterialFlags.BumpTextureEnabled && !this._disableBumpMap) {
                    MaterialHelper.PrepareDefinesForMergedUV(this._bumpTexture, defines, "BUMP");

                    if (this._useParallax && this._albedoTexture && MaterialFlags.DiffuseTextureEnabled) {
                        defines.PARALLAX = true;
                        defines.PARALLAXOCCLUSION = !!this._useParallaxOcclusion;
                    }
                    else {
                        defines.PARALLAX = false;
                    }

                    defines.OBJECTSPACE_NORMALMAP = this._useObjectSpaceNormalMap;
                } else {
                    defines.BUMP = false;
                }

                if (this._environmentBRDFTexture && MaterialFlags.ReflectionTextureEnabled) {
                    defines.ENVIRONMENTBRDF = true;
                    // Not actual true RGBD, only the B chanel is encoded as RGBD for sheen.
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
            }
            else if (this._lightFalloff === PBRBaseMaterial.LIGHTFALLOFF_GLTF) {
                defines.USEPHYSICALLIGHTFALLOFF = false;
                defines.USEGLTFLIGHTFALLOFF = true;
            }
            else {
                defines.USEPHYSICALLIGHTFALLOFF = true;
                defines.USEGLTFLIGHTFALLOFF = false;
            }

            defines.RADIANCEOVERALPHA = this._useRadianceOverAlpha;

            if (!this.backFaceCulling && this._twoSidedLighting) {
                defines.TWOSIDEDLIGHTING = true;
            } else {
                defines.TWOSIDEDLIGHTING = false;
            }

            defines.SPECULARAA = scene.getEngine().getCaps().standardDerivatives && this._enableSpecularAntiAliasing;
        }

        if (defines._areTexturesDirty || defines._areMiscDirty) {
            defines.ALPHATESTVALUE = `${this._alphaCutOff}${this._alphaCutOff % 1 === 0 ? "." : ""}`;
            defines.PREMULTIPLYALPHA = (this.alphaMode === Constants.ALPHA_PREMULTIPLIED || this.alphaMode === Constants.ALPHA_PREMULTIPLIED_PORTERDUFF);
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
            MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh) || this._forceAlphaTest, defines);
            defines.UNLIT = this._unlit || ((this.pointsCloud || this.wireframe) && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind));
            defines.DEBUGMODE = this._debugMode;
        }

        // External config
        this.detailMap.prepareDefines(defines, scene);
        this.subSurface.prepareDefines(defines, scene);
        this.clearCoat.prepareDefines(defines, scene);
        this.anisotropy.prepareDefines(defines, mesh, scene);
        this.brdf.prepareDefines(defines);
        this.sheen.prepareDefines(defines, scene);

        // Values that need to be evaluated on every frame
        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false, useClipPlane, useThinInstances);

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true, true, this._transparencyMode !== PBRBaseMaterial.PBRMATERIAL_OPAQUE);
    }

    /**
     * Force shader compilation
     */
    public forceCompilation(mesh: AbstractMesh, onCompiled?: (material: Material) => void, options?: Partial<IMaterialCompilationOptions>): void {
        const localOptions = {
            clipPlane: false,
            useInstances: false,
            ...options
        };

        const defines = new PBRMaterialDefines();
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
        }
        else {
            effect.onCompileObservable.add(() => {
                if (onCompiled) {
                    onCompiled(this);
                }
            });
        }
    }

    /**
     * Initializes the uniform buffer layout for the shader.
     */
    public buildUniformLayout(): void {
        // Order is important !
        let ubo = this._uniformBuffer;
        ubo.addUniform("vAlbedoInfos", 2);
        ubo.addUniform("vAmbientInfos", 4);
        ubo.addUniform("vOpacityInfos", 2);
        ubo.addUniform("vEmissiveInfos", 2);
        ubo.addUniform("vLightmapInfos", 2);
        ubo.addUniform("vReflectivityInfos", 3);
        ubo.addUniform("vMicroSurfaceSamplerInfos", 2);
        ubo.addUniform("vReflectionInfos", 2);
        ubo.addUniform("vReflectionFilteringInfo", 2);
        ubo.addUniform("vReflectionPosition", 3);
        ubo.addUniform("vReflectionSize", 3);
        ubo.addUniform("vBumpInfos", 3);
        ubo.addUniform("albedoMatrix", 16);
        ubo.addUniform("ambientMatrix", 16);
        ubo.addUniform("opacityMatrix", 16);
        ubo.addUniform("emissiveMatrix", 16);
        ubo.addUniform("lightmapMatrix", 16);
        ubo.addUniform("reflectivityMatrix", 16);
        ubo.addUniform("microSurfaceSamplerMatrix", 16);
        ubo.addUniform("bumpMatrix", 16);
        ubo.addUniform("vTangentSpaceParams", 2);
        ubo.addUniform("reflectionMatrix", 16);

        ubo.addUniform("vReflectionColor", 3);
        ubo.addUniform("vAlbedoColor", 4);
        ubo.addUniform("vLightingIntensity", 4);

        ubo.addUniform("vReflectionMicrosurfaceInfos", 3);
        ubo.addUniform("pointSize", 1);
        ubo.addUniform("vReflectivityColor", 4);
        ubo.addUniform("vEmissiveColor", 3);
        ubo.addUniform("visibility", 1);
        ubo.addUniform("vMetallicReflectanceFactors", 4);
        ubo.addUniform("vMetallicReflectanceInfos", 2);
        ubo.addUniform("metallicReflectanceMatrix", 16);

        PBRClearCoatConfiguration.PrepareUniformBuffer(ubo);
        PBRAnisotropicConfiguration.PrepareUniformBuffer(ubo);
        PBRSheenConfiguration.PrepareUniformBuffer(ubo);
        PBRSubSurfaceConfiguration.PrepareUniformBuffer(ubo);
        DetailMapConfiguration.PrepareUniformBuffer(ubo);

        ubo.create();
    }

    /**
     * Unbinds the material from the mesh
     */
    public unbind(): void {
        if (this._activeEffect) {
            let needFlag = false;
            if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                this._activeEffect.setTexture("reflection2DSampler", null);
                needFlag = true;
            }

            if (this.subSurface.unbind(this._activeEffect)) {
                needFlag = true;
            }

            if (needFlag) {
                this._markAllSubMeshesAsTexturesDirty();
            }
        }

        super.unbind();
    }

    /**
     * Binds the submesh data.
     * @param world - The world matrix.
     * @param mesh - The BJS mesh.
     * @param subMesh - A submesh of the BJS mesh.
     */
    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        var scene = this.getScene();

        var defines = <PBRMaterialDefines>subMesh._materialDefines;
        if (!defines) {
            return;
        }

        var effect = subMesh.effect;

        if (!effect) {
            return;
        }

        this._activeEffect = effect;

        // Matrices
        if (!defines.INSTANCES || defines.THIN_INSTANCES) {
            this.bindOnlyWorldMatrix(world);
        }

        // Normal Matrix
        if (defines.OBJECTSPACE_NORMALMAP) {
            world.toNormalMatrix(this._normalMatrix);
            this.bindOnlyNormalMatrix(this._normalMatrix);
        }

        let mustRebind = this._mustRebind(scene, effect, mesh.visibility);

        // Bones
        MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

        let reflectionTexture: Nullable<BaseTexture> = null;
        let ubo = this._uniformBuffer;
        if (mustRebind) {
            var engine = scene.getEngine();
            ubo.bindToEffect(effect, "Material");

            this.bindViewProjection(effect);
            reflectionTexture = this._getReflectionTexture();

            if (!ubo.useUbo || !this.isFrozen || !ubo.isSync) {

                // Texture uniforms
                if (scene.texturesEnabled) {
                    if (this._albedoTexture && MaterialFlags.DiffuseTextureEnabled) {
                        ubo.updateFloat2("vAlbedoInfos", this._albedoTexture.coordinatesIndex, this._albedoTexture.level);
                        MaterialHelper.BindTextureMatrix(this._albedoTexture, ubo, "albedo");
                    }

                    if (this._ambientTexture && MaterialFlags.AmbientTextureEnabled) {
                        ubo.updateFloat4("vAmbientInfos", this._ambientTexture.coordinatesIndex, this._ambientTexture.level, this._ambientTextureStrength, this._ambientTextureImpactOnAnalyticalLights);
                        MaterialHelper.BindTextureMatrix(this._ambientTexture, ubo, "ambient");
                    }

                    if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                        ubo.updateFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                        MaterialHelper.BindTextureMatrix(this._opacityTexture, ubo, "opacity");
                    }

                    if (reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
                        ubo.updateMatrix("reflectionMatrix", reflectionTexture.getReflectionTextureMatrix());
                        ubo.updateFloat2("vReflectionInfos", reflectionTexture.level, 0);

                        if ((<any>reflectionTexture).boundingBoxSize) {
                            let cubeTexture = <CubeTexture>reflectionTexture;

                            ubo.updateVector3("vReflectionPosition", cubeTexture.boundingBoxPosition);
                            ubo.updateVector3("vReflectionSize", cubeTexture.boundingBoxSize);
                        }

                        if (this.realTimeFiltering) {
                            const width = reflectionTexture.getSize().width;
                            ubo.updateFloat2("vReflectionFilteringInfo", width, Scalar.Log2(width));
                        }

                        if (!defines.USEIRRADIANCEMAP) {
                            var polynomials = reflectionTexture.sphericalPolynomial;
                            if (defines.USESPHERICALFROMREFLECTIONMAP && polynomials) {
                                if (defines.SPHERICAL_HARMONICS) {
                                    const preScaledHarmonics = polynomials.preScaledHarmonics;
                                    this._activeEffect.setVector3("vSphericalL00", preScaledHarmonics.l00);
                                    this._activeEffect.setVector3("vSphericalL1_1", preScaledHarmonics.l1_1);
                                    this._activeEffect.setVector3("vSphericalL10", preScaledHarmonics.l10);
                                    this._activeEffect.setVector3("vSphericalL11", preScaledHarmonics.l11);
                                    this._activeEffect.setVector3("vSphericalL2_2", preScaledHarmonics.l2_2);
                                    this._activeEffect.setVector3("vSphericalL2_1", preScaledHarmonics.l2_1);
                                    this._activeEffect.setVector3("vSphericalL20", preScaledHarmonics.l20);
                                    this._activeEffect.setVector3("vSphericalL21", preScaledHarmonics.l21);
                                    this._activeEffect.setVector3("vSphericalL22", preScaledHarmonics.l22);
                                }
                                else {
                                    this._activeEffect.setFloat3("vSphericalX", polynomials.x.x, polynomials.x.y, polynomials.x.z);
                                    this._activeEffect.setFloat3("vSphericalY", polynomials.y.x, polynomials.y.y, polynomials.y.z);
                                    this._activeEffect.setFloat3("vSphericalZ", polynomials.z.x, polynomials.z.y, polynomials.z.z);
                                    this._activeEffect.setFloat3("vSphericalXX_ZZ", polynomials.xx.x - polynomials.zz.x,
                                        polynomials.xx.y - polynomials.zz.y,
                                        polynomials.xx.z - polynomials.zz.z);
                                    this._activeEffect.setFloat3("vSphericalYY_ZZ", polynomials.yy.x - polynomials.zz.x,
                                        polynomials.yy.y - polynomials.zz.y,
                                        polynomials.yy.z - polynomials.zz.z);
                                    this._activeEffect.setFloat3("vSphericalZZ", polynomials.zz.x, polynomials.zz.y, polynomials.zz.z);
                                    this._activeEffect.setFloat3("vSphericalXY", polynomials.xy.x, polynomials.xy.y, polynomials.xy.z);
                                    this._activeEffect.setFloat3("vSphericalYZ", polynomials.yz.x, polynomials.yz.y, polynomials.yz.z);
                                    this._activeEffect.setFloat3("vSphericalZX", polynomials.zx.x, polynomials.zx.y, polynomials.zx.z);
                                }
                            }
                        }

                        ubo.updateFloat3("vReflectionMicrosurfaceInfos",
                            reflectionTexture.getSize().width,
                            reflectionTexture.lodGenerationScale,
                            reflectionTexture.lodGenerationOffset);
                    }

                    if (this._emissiveTexture && MaterialFlags.EmissiveTextureEnabled) {
                        ubo.updateFloat2("vEmissiveInfos", this._emissiveTexture.coordinatesIndex, this._emissiveTexture.level);
                        MaterialHelper.BindTextureMatrix(this._emissiveTexture, ubo, "emissive");
                    }

                    if (this._lightmapTexture && MaterialFlags.LightmapTextureEnabled) {
                        ubo.updateFloat2("vLightmapInfos", this._lightmapTexture.coordinatesIndex, this._lightmapTexture.level);
                        MaterialHelper.BindTextureMatrix(this._lightmapTexture, ubo, "lightmap");
                    }

                    if (MaterialFlags.SpecularTextureEnabled) {
                        if (this._metallicTexture) {
                            ubo.updateFloat3("vReflectivityInfos", this._metallicTexture.coordinatesIndex, this._metallicTexture.level, this._ambientTextureStrength);
                            MaterialHelper.BindTextureMatrix(this._metallicTexture, ubo, "reflectivity");
                        }
                        else if (this._reflectivityTexture) {
                            ubo.updateFloat3("vReflectivityInfos", this._reflectivityTexture.coordinatesIndex, this._reflectivityTexture.level, 1.0);
                            MaterialHelper.BindTextureMatrix(this._reflectivityTexture, ubo, "reflectivity");
                        }

                        if (this._metallicReflectanceTexture) {
                            ubo.updateFloat2("vMetallicReflectanceInfos", this._metallicReflectanceTexture.coordinatesIndex, this._metallicReflectanceTexture.level);
                            MaterialHelper.BindTextureMatrix(this._metallicReflectanceTexture, ubo, "metallicReflectance");
                        }

                        if (this._microSurfaceTexture) {
                            ubo.updateFloat2("vMicroSurfaceSamplerInfos", this._microSurfaceTexture.coordinatesIndex, this._microSurfaceTexture.level);
                            MaterialHelper.BindTextureMatrix(this._microSurfaceTexture, ubo, "microSurfaceSampler");
                        }
                    }

                    if (this._bumpTexture && engine.getCaps().standardDerivatives && MaterialFlags.BumpTextureEnabled && !this._disableBumpMap) {
                        ubo.updateFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, this._bumpTexture.level, this._parallaxScaleBias);
                        MaterialHelper.BindTextureMatrix(this._bumpTexture, ubo, "bump");

                        if (scene._mirroredCameraPosition) {
                            ubo.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? 1.0 : -1.0, this._invertNormalMapY ? 1.0 : -1.0);
                        } else {
                            ubo.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? -1.0 : 1.0, this._invertNormalMapY ? -1.0 : 1.0);
                        }
                    }
                }

                // Point size
                if (this.pointsCloud) {
                    ubo.updateFloat("pointSize", this.pointSize);
                }

                // Colors
                if (defines.METALLICWORKFLOW) {
                    TmpColors.Color3[0].r = (this._metallic === undefined || this._metallic === null) ? 1 : this._metallic;
                    TmpColors.Color3[0].g = (this._roughness === undefined || this._roughness === null) ? 1 : this._roughness;
                    ubo.updateColor4("vReflectivityColor", TmpColors.Color3[0], 1);

                    const ior = this.subSurface.indexOfRefraction;
                    const outside_ior = 1; // consider air as clear coat and other layaers would remap in the shader.

                    // We are here deriving our default reflectance from a common value for none metallic surface.
                    // Based of the schlick fresnel approximation model
                    // for dielectrics.
                    const f0 = Math.pow((ior - outside_ior) / (ior + outside_ior), 2);

                    // Tweak the default F0 and F90 based on our given setup
                    this._metallicReflectanceColor.scaleToRef(f0 * this._metallicF0Factor, TmpColors.Color3[0]);
                    const metallicF90 = this._metallicF0Factor;

                    ubo.updateColor4("vMetallicReflectanceFactors", TmpColors.Color3[0], metallicF90);
                }
                else {
                    ubo.updateColor4("vReflectivityColor", this._reflectivityColor, this._microSurface);
                }

                ubo.updateColor3("vEmissiveColor", MaterialFlags.EmissiveTextureEnabled ? this._emissiveColor : Color3.BlackReadOnly);
                ubo.updateColor3("vReflectionColor", this._reflectionColor);
                if (!defines.SS_REFRACTION && this.subSurface.linkRefractionWithTransparency) {
                    ubo.updateColor4("vAlbedoColor", this._albedoColor, 1);
                }
                else {
                    ubo.updateColor4("vAlbedoColor", this._albedoColor, this.alpha);
                }

                // Misc
                this._lightingInfos.x = this._directIntensity;
                this._lightingInfos.y = this._emissiveIntensity;
                this._lightingInfos.z = this._environmentIntensity * scene.environmentIntensity;
                this._lightingInfos.w = this._specularIntensity;

                ubo.updateVector4("vLightingIntensity", this._lightingInfos);
            }

            // Visibility
            ubo.updateFloat("visibility", mesh.visibility);

            // Textures
            if (scene.texturesEnabled) {
                if (this._albedoTexture && MaterialFlags.DiffuseTextureEnabled) {
                    ubo.setTexture("albedoSampler", this._albedoTexture);
                }

                if (this._ambientTexture && MaterialFlags.AmbientTextureEnabled) {
                    ubo.setTexture("ambientSampler", this._ambientTexture);
                }

                if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                    ubo.setTexture("opacitySampler", this._opacityTexture);
                }

                if (reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
                    if (defines.LODBASEDMICROSFURACE) {
                        ubo.setTexture("reflectionSampler", reflectionTexture);
                    }
                    else {
                        ubo.setTexture("reflectionSampler", reflectionTexture._lodTextureMid || reflectionTexture);
                        ubo.setTexture("reflectionSamplerLow", reflectionTexture._lodTextureLow || reflectionTexture);
                        ubo.setTexture("reflectionSamplerHigh", reflectionTexture._lodTextureHigh || reflectionTexture);
                    }

                    if (defines.USEIRRADIANCEMAP) {
                        ubo.setTexture("irradianceSampler", reflectionTexture.irradianceTexture);
                    }
                }

                if (defines.ENVIRONMENTBRDF) {
                    ubo.setTexture("environmentBrdfSampler", this._environmentBRDFTexture);
                }

                if (this._emissiveTexture && MaterialFlags.EmissiveTextureEnabled) {
                    ubo.setTexture("emissiveSampler", this._emissiveTexture);
                }

                if (this._lightmapTexture && MaterialFlags.LightmapTextureEnabled) {
                    ubo.setTexture("lightmapSampler", this._lightmapTexture);
                }

                if (MaterialFlags.SpecularTextureEnabled) {
                    if (this._metallicTexture) {
                        ubo.setTexture("reflectivitySampler", this._metallicTexture);
                    }
                    else if (this._reflectivityTexture) {
                        ubo.setTexture("reflectivitySampler", this._reflectivityTexture);
                    }

                    if (this._metallicReflectanceTexture) {
                        ubo.setTexture("metallicReflectanceSampler", this._metallicReflectanceTexture);
                    }

                    if (this._microSurfaceTexture) {
                        ubo.setTexture("microSurfaceSampler", this._microSurfaceTexture);
                    }
                }

                if (this._bumpTexture && engine.getCaps().standardDerivatives && MaterialFlags.BumpTextureEnabled && !this._disableBumpMap) {
                    ubo.setTexture("bumpSampler", this._bumpTexture);
                }
            }

            this.detailMap.bindForSubMesh(ubo, scene, this.isFrozen);
            this.subSurface.bindForSubMesh(ubo, scene, engine, this.isFrozen, defines.LODBASEDMICROSFURACE, this.realTimeFiltering);
            this.clearCoat.bindForSubMesh(ubo, scene, engine, this._disableBumpMap, this.isFrozen, this._invertNormalMapX, this._invertNormalMapY);
            this.anisotropy.bindForSubMesh(ubo, scene, this.isFrozen);
            this.sheen.bindForSubMesh(ubo, scene, this.isFrozen);

            // Clip plane
            MaterialHelper.BindClipPlane(this._activeEffect, scene);

            // Colors
            scene.ambientColor.multiplyToRef(this._ambientColor, this._globalAmbientColor);

            var eyePosition = scene._forcedViewPosition ? scene._forcedViewPosition : (scene._mirroredCameraPosition ? scene._mirroredCameraPosition : (<Camera>scene.activeCamera).globalPosition);
            var invertNormal = (scene.useRightHandedSystem === (scene._mirroredCameraPosition != null));
            effect.setFloat4("vEyePosition",
                eyePosition.x,
                eyePosition.y,
                eyePosition.z,
                invertNormal ? -1 : 1);
            effect.setColor3("vAmbientColor", this._globalAmbientColor);

            effect.setFloat2("vDebugMode", this.debugLimit, this.debugFactor);
        }

        if (mustRebind || !this.isFrozen) {
            // Lights
            if (scene.lightsEnabled && !this._disableLighting) {
                MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this._maxSimultaneousLights, this._rebuildInParallel);
            }

            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE || reflectionTexture) {
                this.bindView(effect);
            }

            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect, true);

            // Morph targets
            if (defines.NUM_MORPH_INFLUENCERS) {
                MaterialHelper.BindMorphTargetParameters(mesh, this._activeEffect);
            }

            // image processing
            this._imageProcessingConfiguration!.bind(this._activeEffect);

            // Log. depth
            MaterialHelper.BindLogDepth(defines, this._activeEffect, scene);
        }

        ubo.update();

        this._afterBind(mesh, this._activeEffect);
    }

    /**
     * Returns the animatable textures.
     * @returns - Array of animatable textures.
     */
    public getAnimatables(): IAnimatable[] {
        var results = [];

        if (this._albedoTexture && this._albedoTexture.animations && this._albedoTexture.animations.length > 0) {
            results.push(this._albedoTexture);
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

        if (this._metallicTexture && this._metallicTexture.animations && this._metallicTexture.animations.length > 0) {
            results.push(this._metallicTexture);
        }
        else if (this._reflectivityTexture && this._reflectivityTexture.animations && this._reflectivityTexture.animations.length > 0) {
            results.push(this._reflectivityTexture);
        }

        if (this._bumpTexture && this._bumpTexture.animations && this._bumpTexture.animations.length > 0) {
            results.push(this._bumpTexture);
        }

        if (this._lightmapTexture && this._lightmapTexture.animations && this._lightmapTexture.animations.length > 0) {
            results.push(this._lightmapTexture);
        }

        this.detailMap.getAnimatables(results);
        this.subSurface.getAnimatables(results);
        this.clearCoat.getAnimatables(results);
        this.sheen.getAnimatables(results);
        this.anisotropy.getAnimatables(results);

        return results;
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

    /**
     * Returns an array of the actively used textures.
     * @returns - Array of BaseTextures
     */
    public getActiveTextures(): BaseTexture[] {
        var activeTextures = super.getActiveTextures();

        if (this._albedoTexture) {
            activeTextures.push(this._albedoTexture);
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

        if (this._reflectivityTexture) {
            activeTextures.push(this._reflectivityTexture);
        }

        if (this._metallicTexture) {
            activeTextures.push(this._metallicTexture);
        }

        if (this._metallicReflectanceTexture) {
            activeTextures.push(this._metallicReflectanceTexture);
        }

        if (this._microSurfaceTexture) {
            activeTextures.push(this._microSurfaceTexture);
        }

        if (this._bumpTexture) {
            activeTextures.push(this._bumpTexture);
        }

        if (this._lightmapTexture) {
            activeTextures.push(this._lightmapTexture);
        }

        this.detailMap.getActiveTextures(activeTextures);
        this.subSurface.getActiveTextures(activeTextures);
        this.clearCoat.getActiveTextures(activeTextures);
        this.sheen.getActiveTextures(activeTextures);
        this.anisotropy.getActiveTextures(activeTextures);

        return activeTextures;
    }

    /**
     * Checks to see if a texture is used in the material.
     * @param texture - Base texture to use.
     * @returns - Boolean specifying if a texture is used in the material.
     */
    public hasTexture(texture: BaseTexture): boolean {
        if (super.hasTexture(texture)) {
            return true;
        }

        if (this._albedoTexture === texture) {
            return true;
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

        if (this._reflectivityTexture === texture) {
            return true;
        }

        if (this._metallicTexture === texture) {
            return true;
        }

        if (this._metallicReflectanceTexture === texture) {
            return true;
        }

        if (this._microSurfaceTexture === texture) {
            return true;
        }

        if (this._bumpTexture === texture) {
            return true;
        }

        if (this._lightmapTexture === texture) {
            return true;
        }

        return this.detailMap.hasTexture(texture) ||
            this.subSurface.hasTexture(texture) ||
            this.clearCoat.hasTexture(texture) ||
            this.sheen.hasTexture(texture) ||
            this.anisotropy.hasTexture(texture);
    }

    /**
     * Disposes the resources of the material.
     * @param forceDisposeEffect - Forces the disposal of effects.
     * @param forceDisposeTextures - Forces the disposal of all textures.
     */
    public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            if (this._environmentBRDFTexture && this.getScene().environmentBRDFTexture !== this._environmentBRDFTexture) {
                this._environmentBRDFTexture.dispose();
            }

            this._albedoTexture?.dispose();
            this._ambientTexture?.dispose();
            this._opacityTexture?.dispose();
            this._reflectionTexture?.dispose();
            this._emissiveTexture?.dispose();
            this._metallicTexture?.dispose();
            this._reflectivityTexture?.dispose();
            this._bumpTexture?.dispose();
            this._lightmapTexture?.dispose();
            this._metallicReflectanceTexture?.dispose();
            this._microSurfaceTexture?.dispose();
        }

        this.detailMap.dispose(forceDisposeTextures);
        this.subSurface.dispose(forceDisposeTextures);
        this.clearCoat.dispose(forceDisposeTextures);
        this.sheen.dispose(forceDisposeTextures);
        this.anisotropy.dispose(forceDisposeTextures);

        this._renderTargets.dispose();

        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }

        super.dispose(forceDisposeEffect, forceDisposeTextures);
    }
}