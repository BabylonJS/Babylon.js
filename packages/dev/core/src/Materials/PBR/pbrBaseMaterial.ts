/* eslint-disable @typescript-eslint/naming-convention */
import { serializeAsImageProcessingConfiguration, expandToProperty } from "../../Misc/decorators";
import type { Observer } from "../../Misc/observable";
import { Logger } from "../../Misc/logger";
import { SmartArray } from "../../Misc/smartArray";
import { GetEnvironmentBRDFTexture } from "../../Misc/brdfTextureTools";
import type { Nullable } from "../../types";
import { Scene } from "../../scene";
import type { Matrix } from "../../Maths/math.vector";
import { Vector4 } from "../../Maths/math.vector";
import { VertexBuffer } from "../../Buffers/buffer";
import type { SubMesh } from "../../Meshes/subMesh";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Mesh } from "../../Meshes/mesh";
import { PBRBRDFConfiguration } from "./pbrBRDFConfiguration";
import { PrePassConfiguration } from "../prePassConfiguration";
import { Color3, TmpColors } from "../../Maths/math.color";
import { Scalar } from "../../Maths/math.scalar";

import type { IImageProcessingConfigurationDefines } from "../../Materials/imageProcessingConfiguration";
import { ImageProcessingConfiguration } from "../../Materials/imageProcessingConfiguration";
import type { Effect, IEffectCreationOptions } from "../../Materials/effect";
import type { IMaterialCompilationOptions, ICustomShaderNameResolveOptions } from "../../Materials/material";
import { Material } from "../../Materials/material";
import { MaterialPluginEvent } from "../materialPluginEvent";
import { MaterialDefines } from "../../Materials/materialDefines";
import { PushMaterial } from "../../Materials/pushMaterial";
import { MaterialHelper } from "../../Materials/materialHelper";

import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Texture } from "../../Materials/Textures/texture";
import type { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import type { CubeTexture } from "../../Materials/Textures/cubeTexture";

import { MaterialFlags } from "../materialFlags";
import { Constants } from "../../Engines/constants";
import type { IAnimatable } from "../../Animations/animatable.interface";

import "../../Materials/Textures/baseTexture.polynomial";
import "../../Shaders/pbr.fragment";
import "../../Shaders/pbr.vertex";

import { EffectFallbacks } from "../effectFallbacks";
import { PBRClearCoatConfiguration } from "./pbrClearCoatConfiguration";
import { PBRIridescenceConfiguration } from "./pbrIridescenceConfiguration";
import { PBRAnisotropicConfiguration } from "./pbrAnisotropicConfiguration";
import { PBRSheenConfiguration } from "./pbrSheenConfiguration";
import { PBRSubSurfaceConfiguration } from "./pbrSubSurfaceConfiguration";
import { DetailMapConfiguration } from "../material.detailMapConfiguration";
import { addClipPlaneUniforms, bindClipPlane } from "../clipPlaneMaterialHelper";

const onCreatedEffectParameters = { effect: null as unknown as Effect, subMesh: null as unknown as Nullable<SubMesh> };

/**
 * Manages the defines for the PBR Material.
 * @internal
 */
export class PBRMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
    public PBR = true;

    public NUM_SAMPLES = "0";
    public REALTIME_FILTERING = false;

    public MAINUV1 = false;
    public MAINUV2 = false;
    public MAINUV3 = false;
    public MAINUV4 = false;
    public MAINUV5 = false;
    public MAINUV6 = false;
    public UV1 = false;
    public UV2 = false;
    public UV3 = false;
    public UV4 = false;
    public UV5 = false;
    public UV6 = false;

    public ALBEDO = false;
    public GAMMAALBEDO = false;
    public ALBEDODIRECTUV = 0;
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
    public PREPASS_IRRADIANCE = false;
    public PREPASS_IRRADIANCE_INDEX = -1;
    public PREPASS_ALBEDO_SQRT = false;
    public PREPASS_ALBEDO_SQRT_INDEX = -1;
    public PREPASS_DEPTH = false;
    public PREPASS_DEPTH_INDEX = -1;
    public PREPASS_NORMAL = false;
    public PREPASS_NORMAL_INDEX = -1;
    public PREPASS_NORMAL_WORLDSPACE = false;
    public PREPASS_POSITION = false;
    public PREPASS_POSITION_INDEX = -1;
    public PREPASS_VELOCITY = false;
    public PREPASS_VELOCITY_INDEX = -1;
    public PREPASS_REFLECTIVITY = false;
    public PREPASS_REFLECTIVITY_INDEX = -1;
    public SCENE_MRT_COUNT = 0;

    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public BONETEXTURE = false;
    public BONES_VELOCITY_ENABLED = false;

    public NONUNIFORMSCALING = false;

    public MORPHTARGETS = false;
    public MORPHTARGETS_NORMAL = false;
    public MORPHTARGETS_TANGENT = false;
    public MORPHTARGETS_UV = false;
    public NUM_MORPH_INFLUENCERS = 0;
    public MORPHTARGETS_TEXTURE = false;

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
    public DITHER = false;
    public IMAGEPROCESSINGPOSTPROCESS = false;
    public SKIPFINALCOLORCLAMP = false;
    public EXPOSURE = false;
    public MULTIVIEW = false;
    public ORDER_INDEPENDENT_TRANSPARENCY = false;
    public ORDER_INDEPENDENT_TRANSPARENCY_16BITS = false;

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
    public CAMERA_ORTHOGRAPHIC = false;
    public CAMERA_PERSPECTIVE = false;

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
    public reset(): void {
        super.reset();
        this.ALPHATESTVALUE = "0.5";
        this.PBR = true;
        this.NORMALXYSCALE = true;
    }
}

/**
 * The Physically based material base class of BJS.
 *
 * This offers the main features of a standard PBR material.
 * For more information, please refer to the documentation :
 * https://doc.babylonjs.com/features/featuresDeepDive/materials/using/introToPBR
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
     * This is a special control allowing the reduction of the specular highlights coming from the
     * four lights of the scene. Those highlights may not be needed in full environment lighting.
     * @internal
     */
    public _specularIntensity: number = 1.0;

    /**
     * This stores the direct, emissive, environment, and specular light intensities into a Vector4.
     */
    private _lightingInfos: Vector4 = new Vector4(this._directIntensity, this._emissiveIntensity, this._environmentIntensity, this._specularIntensity);

    /**
     * Debug Control allowing disabling the bump map on this material.
     * @internal
     */
    public _disableBumpMap: boolean = false;

    /**
     * AKA Diffuse Texture in standard nomenclature.
     * @internal
     */
    public _albedoTexture: Nullable<BaseTexture> = null;

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
     * AKA Specular texture in other nomenclature.
     * @internal
     */
    public _reflectivityTexture: Nullable<BaseTexture> = null;

    /**
     * Used to switch from specular/glossiness to metallic/roughness workflow.
     * @internal
     */
    public _metallicTexture: Nullable<BaseTexture> = null;

    /**
     * Specifies the metallic scalar of the metallic/roughness workflow.
     * Can also be used to scale the metalness values of the metallic texture.
     * @internal
     */
    public _metallic: Nullable<number> = null;

    /**
     * Specifies the roughness scalar of the metallic/roughness workflow.
     * Can also be used to scale the roughness values of the metallic texture.
     * @internal
     */
    public _roughness: Nullable<number> = null;

    /**
     * In metallic workflow, specifies an F0 factor to help configuring the material F0.
     * By default the indexOfrefraction is used to compute F0;
     *
     * This is used as a factor against the default reflectance at normal incidence to tweak it.
     *
     * F0 = defaultF0 * metallicF0Factor * metallicReflectanceColor;
     * F90 = metallicReflectanceColor;
     * @internal
     */
    public _metallicF0Factor = 1;

    /**
     * In metallic workflow, specifies an F0 color.
     * By default the F90 is always 1;
     *
     * Please note that this factor is also used as a factor against the default reflectance at normal incidence.
     *
     * F0 = defaultF0_from_IOR * metallicF0Factor * metallicReflectanceColor
     * F90 = metallicF0Factor;
     * @internal
     */
    public _metallicReflectanceColor = Color3.White();

    /**
     * Specifies that only the A channel from _metallicReflectanceTexture should be used.
     * If false, both RGB and A channels will be used
     * @internal
     */
    public _useOnlyMetallicFromMetallicReflectanceTexture = false;

    /**
     * Defines to store metallicReflectanceColor in RGB and metallicF0Factor in A
     * This is multiply against the scalar values defined in the material.
     * @internal
     */
    public _metallicReflectanceTexture: Nullable<BaseTexture> = null;

    /**
     * Defines to store reflectanceColor in RGB
     * This is multiplied against the scalar values defined in the material.
     * If both _reflectanceTexture and _metallicReflectanceTexture textures are provided and _useOnlyMetallicFromMetallicReflectanceTexture
     * is false, _metallicReflectanceTexture takes precedence and _reflectanceTexture is not used
     * @internal
     */
    public _reflectanceTexture: Nullable<BaseTexture> = null;

    /**
     * Used to enable roughness/glossiness fetch from a separate channel depending on the current mode.
     * Gray Scale represents roughness in metallic mode and glossiness in specular mode.
     * @internal
     */
    public _microSurfaceTexture: Nullable<BaseTexture> = null;

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
     * AKA Diffuse Color in other nomenclature.
     * @internal
     */
    public _albedoColor = new Color3(1, 1, 1);

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
     * The color applied when light is emitted from a material.
     * @internal
     */
    public _emissiveColor = new Color3(0, 0, 0);

    /**
     * AKA Glossiness in other nomenclature.
     * @internal
     */
    public _microSurface = 0.9;

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
     * Specifies if the metallic texture contains the roughness information in its alpha channel.
     * @internal
     */
    public _useRoughnessFromMetallicTextureAlpha = true;

    /**
     * Specifies if the metallic texture contains the roughness information in its green channel.
     * @internal
     */
    public _useRoughnessFromMetallicTextureGreen = false;

    /**
     * Specifies if the metallic texture contains the metallness information in its blue channel.
     * @internal
     */
    public _useMetallnessFromMetallicTextureBlue = false;

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
     * Enforces alpha test in opaque or blend mode in order to improve the performances of some situations.
     * @internal
     */
    public _forceAlphaTest = false;

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
    public get canRenderToMRT() {
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
        } else {
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
     * If set to true, no lighting calculations will be applied.
     */
    private _unlit = false;

    /**
     * If sets to true, the decal map will be applied after the detail map. Else, it is applied before (default: false)
     */
    private _applyDecalMapAfterDetailMap = false;

    private _debugMode = 0;
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
     * Defines the clear coat layer parameters for the material.
     */
    public readonly clearCoat: PBRClearCoatConfiguration;

    /**
     * Defines the iridescence layer parameters for the material.
     */
    public readonly iridescence: PBRIridescenceConfiguration;

    /**
     * Defines the anisotropic parameters for the material.
     */
    public readonly anisotropy: PBRAnisotropicConfiguration;

    /**
     * Defines the BRDF parameters for the material.
     */
    public readonly brdf: PBRBRDFConfiguration;

    /**
     * Defines the Sheen parameters for the material.
     */
    public readonly sheen: PBRSheenConfiguration;

    /**
     * Defines the SubSurface parameters for the material.
     */
    public readonly subSurface: PBRSubSurfaceConfiguration;

    /**
     * Defines additional PrePass parameters for the material.
     */
    public readonly prePassConfiguration: PrePassConfiguration;

    /**
     * Defines the detail map parameters for the material.
     */
    public readonly detailMap: DetailMapConfiguration;

    protected _cacheHasRenderTargetTextures = false;

    /**
     * Instantiates a new PBRMaterial instance.
     *
     * @param name The material name
     * @param scene The scene the material will be use in.
     */
    constructor(name: string, scene?: Scene) {
        super(name, scene);

        this.brdf = new PBRBRDFConfiguration(this);
        this.clearCoat = new PBRClearCoatConfiguration(this);
        this.iridescence = new PBRIridescenceConfiguration(this);
        this.anisotropy = new PBRAnisotropicConfiguration(this);
        this.sheen = new PBRSheenConfiguration(this);
        this.subSurface = new PBRSubSurfaceConfiguration(this);
        this.detailMap = new DetailMapConfiguration(this);

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
    }

    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    public get hasRenderTargetTextures(): boolean {
        if (MaterialFlags.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
            return true;
        }

        return this._cacheHasRenderTargetTextures;
    }

    /**
     * Can this material render to prepass
     */
    public get isPrePassCapable(): boolean {
        return !this.disableDepthWrite;
    }

    /**
     * @returns the name of the material class.
     */
    public getClassName(): string {
        return "PBRBaseMaterial";
    }

    /**
     * Returns true if alpha blending should be disabled.
     */
    protected get _disableAlphaBlending(): boolean {
        return (
            this._transparencyMode === PBRBaseMaterial.PBRMATERIAL_OPAQUE ||
            this._transparencyMode === PBRBaseMaterial.PBRMATERIAL_ALPHATEST ||
            this.subSurface?.disableAlphaBlending
        );
    }

    /**
     * @returns whether or not this material should be rendered in alpha blend mode.
     */
    public needAlphaBlending(): boolean {
        if (this._disableAlphaBlending) {
            return false;
        }

        return this.alpha < 1.0 || this._opacityTexture != null || this._shouldUseAlphaFromAlbedoTexture();
    }

    /**
     * @returns whether or not this material should be rendered in alpha test mode.
     */
    public needAlphaTesting(): boolean {
        if (this._forceAlphaTest) {
            return true;
        }

        if (this.subSurface?.disableAlphaBlending) {
            return false;
        }

        return this._hasAlphaChannel() && (this._transparencyMode == null || this._transparencyMode === PBRBaseMaterial.PBRMATERIAL_ALPHATEST);
    }

    /**
     * @returns whether or not the alpha value of the albedo texture should be used for alpha blending.
     */
    protected _shouldUseAlphaFromAlbedoTexture(): boolean {
        return this._albedoTexture != null && this._albedoTexture.hasAlpha && this._useAlphaFromAlbedoTexture && this._transparencyMode !== PBRBaseMaterial.PBRMATERIAL_OPAQUE;
    }

    /**
     * @returns whether or not there is a usable alpha channel for transparency.
     */
    protected _hasAlphaChannel(): boolean {
        return (this._albedoTexture != null && this._albedoTexture.hasAlpha) || this._opacityTexture != null;
    }

    /**
     * @returns the texture used for the alpha test.
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
            subMesh.materialDefines = new PBRMaterialDefines(this._eventInfo.defineNames);
        }

        const defines = <PBRMaterialDefines>subMesh.materialDefines;
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

        if (!engine.getCaps().standardDerivatives && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
            mesh.createNormals(true);
            Logger.Warn("PBRMaterial: Normals have been created for the mesh: " + mesh.name);
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
     * Specifies if the material uses metallic roughness workflow.
     * @returns boolean specifying if the material uses metallic roughness workflow.
     */
    public isMetallicWorkflow(): boolean {
        if (this._metallic != null || this._roughness != null || this._metallicTexture) {
            return true;
        }

        return false;
    }

    private _prepareEffect(
        mesh: AbstractMesh,
        defines: PBRMaterialDefines,
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

        MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
        MaterialHelper.PrepareAttributesForInstances(attribs, defines);
        MaterialHelper.PrepareAttributesForMorphTargets(attribs, mesh, defines);
        MaterialHelper.PrepareAttributesForBakedVertexAnimation(attribs, mesh, defines);

        let shaderName = "pbr";

        const uniforms = [
            "world",
            "view",
            "viewProjection",
            "vEyePosition",
            "vLightsType",
            "vAmbientColor",
            "vAlbedoColor",
            "vReflectivityColor",
            "vMetallicReflectanceFactors",
            "vEmissiveColor",
            "visibility",
            "vReflectionColor",
            "vFogInfos",
            "vFogColor",
            "pointSize",
            "vAlbedoInfos",
            "vAmbientInfos",
            "vOpacityInfos",
            "vReflectionInfos",
            "vReflectionPosition",
            "vReflectionSize",
            "vEmissiveInfos",
            "vReflectivityInfos",
            "vReflectionFilteringInfo",
            "vMetallicReflectanceInfos",
            "vReflectanceInfos",
            "vMicroSurfaceSamplerInfos",
            "vBumpInfos",
            "vLightmapInfos",
            "mBones",
            "albedoMatrix",
            "ambientMatrix",
            "opacityMatrix",
            "reflectionMatrix",
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
            "vSphericalX",
            "vSphericalY",
            "vSphericalZ",
            "vSphericalXX_ZZ",
            "vSphericalYY_ZZ",
            "vSphericalZZ",
            "vSphericalXY",
            "vSphericalYZ",
            "vSphericalZX",
            "vSphericalL00",
            "vSphericalL1_1",
            "vSphericalL10",
            "vSphericalL11",
            "vSphericalL2_2",
            "vSphericalL2_1",
            "vSphericalL20",
            "vSphericalL21",
            "vSphericalL22",
            "vReflectionMicrosurfaceInfos",
            "vTangentSpaceParams",
            "boneTextureWidth",
            "vDebugMode",
            "morphTargetTextureInfo",
            "morphTargetTextureIndices",
        ];

        const samplers = [
            "albedoSampler",
            "reflectivitySampler",
            "ambientSampler",
            "emissiveSampler",
            "bumpSampler",
            "lightmapSampler",
            "opacitySampler",
            "reflectionSampler",
            "reflectionSamplerLow",
            "reflectionSamplerHigh",
            "irradianceSampler",
            "microSurfaceSampler",
            "environmentBrdfSampler",
            "boneSampler",
            "metallicReflectanceSampler",
            "reflectanceSampler",
            "morphTargets",
            "oitDepthSampler",
            "oitFrontColorSampler",
        ];

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

        PrePassConfiguration.AddUniforms(uniforms);
        PrePassConfiguration.AddSamplers(samplers);
        addClipPlaneUniforms(uniforms);

        if (ImageProcessingConfiguration) {
            ImageProcessingConfiguration.PrepareUniforms(uniforms, defines);
            ImageProcessingConfiguration.PrepareSamplers(samplers, defines);
        }

        MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
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
            },
            engine
        );

        this._eventInfo.customCode = undefined;

        return effect;
    }

    private _prepareDefines(
        mesh: AbstractMesh,
        defines: PBRMaterialDefines,
        useInstances: Nullable<boolean> = null,
        useClipPlane: Nullable<boolean> = null,
        useThinInstances: boolean = false
    ): void {
        const scene = this.getScene();
        const engine = scene.getEngine();

        // Lights
        MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
        defines._needNormals = true;

        // Multiview
        MaterialHelper.PrepareDefinesForMultiview(scene, defines);

        // PrePass
        const oit = this.needAlphaBlendingForMesh(mesh) && this.getScene().useOrderIndependentTransparency;
        MaterialHelper.PrepareDefinesForPrePass(scene, defines, this.canRenderToMRT && !oit);

        // Order independant transparency
        MaterialHelper.PrepareDefinesForOIT(scene, defines, oit);

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

                const reflectionTexture = this._getReflectionTexture();
                if (reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
                    defines.REFLECTION = true;
                    defines.GAMMAREFLECTION = reflectionTexture.gammaSpace;
                    defines.RGBDREFLECTION = reflectionTexture.isRGBD;
                    defines.LODINREFLECTIONALPHA = reflectionTexture.lodLevelInAlpha;
                    defines.LINEARSPECULARREFLECTION = reflectionTexture.linearSpecularLOD;

                    if (this.realTimeFiltering && this.realTimeFilteringQuality > 0) {
                        defines.NUM_SAMPLES = "" + this.realTimeFilteringQuality;
                        if (engine._features.needTypeSuffixInShaderConstants) {
                            defines.NUM_SAMPLES = defines.NUM_SAMPLES + "u";
                        }

                        defines.REALTIME_FILTERING = true;
                    } else {
                        defines.REALTIME_FILTERING = false;
                    }

                    defines.INVERTCUBICMAP = reflectionTexture.coordinatesMode === Texture.INVCUBIC_MODE;
                    defines.REFLECTIONMAP_3D = reflectionTexture.isCube;
                    defines.REFLECTIONMAP_OPPOSITEZ = defines.REFLECTIONMAP_3D && this.getScene().useRightHandedSystem ? !reflectionTexture.invertZ : reflectionTexture.invertZ;

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
                            if (this._forceIrradianceInFragment || this.realTimeFiltering || this._twoSidedLighting || engine.getCaps().maxVaryingVectors <= 8) {
                                defines.USESPHERICALINVERTEX = false;
                            } else {
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
                    defines.GAMMAEMISSIVE = this._emissiveTexture.gammaSpace;
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
                        defines.REFLECTIVITY_GAMMA = false;
                    } else if (this._reflectivityTexture) {
                        MaterialHelper.PrepareDefinesForMergedUV(this._reflectivityTexture, defines, "REFLECTIVITY");
                        defines.MICROSURFACEFROMREFLECTIVITYMAP = this._useMicroSurfaceFromReflectivityMapAlpha;
                        defines.MICROSURFACEAUTOMATIC = this._useAutoMicroSurfaceFromReflectivityMap;
                        defines.REFLECTIVITY_GAMMA = this._reflectivityTexture.gammaSpace;
                    } else {
                        defines.REFLECTIVITY = false;
                    }

                    if (this._metallicReflectanceTexture || this._reflectanceTexture) {
                        const identicalTextures =
                            this._metallicReflectanceTexture !== null &&
                            this._metallicReflectanceTexture._texture === this._reflectanceTexture?._texture &&
                            this._metallicReflectanceTexture.checkTransformsAreIdentical(this._reflectanceTexture);

                        defines.METALLIC_REFLECTANCE_USE_ALPHA_ONLY = this._useOnlyMetallicFromMetallicReflectanceTexture && !identicalTextures;
                        if (this._metallicReflectanceTexture) {
                            MaterialHelper.PrepareDefinesForMergedUV(this._metallicReflectanceTexture, defines, "METALLIC_REFLECTANCE");
                            defines.METALLIC_REFLECTANCE_GAMMA = this._metallicReflectanceTexture.gammaSpace;
                        } else {
                            defines.METALLIC_REFLECTANCE = false;
                        }
                        if (
                            this._reflectanceTexture &&
                            !identicalTextures &&
                            (!this._metallicReflectanceTexture || (this._metallicReflectanceTexture && this._useOnlyMetallicFromMetallicReflectanceTexture))
                        ) {
                            MaterialHelper.PrepareDefinesForMergedUV(this._reflectanceTexture, defines, "REFLECTANCE");
                            defines.REFLECTANCE_GAMMA = this._reflectanceTexture.gammaSpace;
                        } else {
                            defines.REFLECTANCE = false;
                        }
                    } else {
                        defines.METALLIC_REFLECTANCE = false;
                        defines.REFLECTANCE = false;
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

                if (engine.getCaps().standardDerivatives && this._bumpTexture && MaterialFlags.BumpTextureEnabled && !this._disableBumpMap) {
                    MaterialHelper.PrepareDefinesForMergedUV(this._bumpTexture, defines, "BUMP");

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
            MaterialHelper.PrepareDefinesForMisc(
                mesh,
                scene,
                this._useLogarithmicDepth,
                this.pointsCloud,
                this.fogEnabled,
                this._shouldTurnAlphaTestOn(mesh) || this._forceAlphaTest,
                defines,
                this._applyDecalMapAfterDetailMap
            );
            defines.UNLIT = this._unlit || ((this.pointsCloud || this.wireframe) && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind));
            defines.DEBUGMODE = this._debugMode;
        }

        // Values that need to be evaluated on every frame
        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances ? true : false, useClipPlane, useThinInstances);

        // External config
        this._eventInfo.defines = defines;
        this._eventInfo.mesh = mesh;
        this._callbackPluginEventPrepareDefinesBeforeAttributes(this._eventInfo);

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true, true, this._transparencyMode !== PBRBaseMaterial.PBRMATERIAL_OPAQUE);

        // External config
        this._callbackPluginEventPrepareDefines(this._eventInfo);
    }

    /**
     * Force shader compilation
     * @param mesh - Define the mesh we want to force the compilation for
     * @param onCompiled - Define a callback triggered when the compilation completes
     * @param options - Define the options used to create the compilation
     */
    public forceCompilation(mesh: AbstractMesh, onCompiled?: (material: Material) => void, options?: Partial<IMaterialCompilationOptions>): void {
        const localOptions = {
            clipPlane: false,
            useInstances: false,
            ...options,
        };

        if (!this._uniformBufferLayoutBuilt) {
            this.buildUniformLayout();
        }

        this._callbackPluginEventGeneric(MaterialPluginEvent.GetDefineNames, this._eventInfo);
        const defines = new PBRMaterialDefines(this._eventInfo.defineNames);
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
    }

    /**
     * Initializes the uniform buffer layout for the shader.
     */
    public buildUniformLayout(): void {
        // Order is important !
        const ubo = this._uniformBuffer;
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
        ubo.addUniform("vAmbientColor", 3);

        ubo.addUniform("vDebugMode", 2);

        ubo.addUniform("vMetallicReflectanceFactors", 4);
        ubo.addUniform("vMetallicReflectanceInfos", 2);
        ubo.addUniform("metallicReflectanceMatrix", 16);
        ubo.addUniform("vReflectanceInfos", 2);
        ubo.addUniform("reflectanceMatrix", 16);

        ubo.addUniform("vSphericalL00", 3);
        ubo.addUniform("vSphericalL1_1", 3);
        ubo.addUniform("vSphericalL10", 3);
        ubo.addUniform("vSphericalL11", 3);
        ubo.addUniform("vSphericalL2_2", 3);
        ubo.addUniform("vSphericalL2_1", 3);
        ubo.addUniform("vSphericalL20", 3);
        ubo.addUniform("vSphericalL21", 3);
        ubo.addUniform("vSphericalL22", 3);

        ubo.addUniform("vSphericalX", 3);
        ubo.addUniform("vSphericalY", 3);
        ubo.addUniform("vSphericalZ", 3);
        ubo.addUniform("vSphericalXX_ZZ", 3);
        ubo.addUniform("vSphericalYY_ZZ", 3);
        ubo.addUniform("vSphericalZZ", 3);
        ubo.addUniform("vSphericalXY", 3);
        ubo.addUniform("vSphericalYZ", 3);
        ubo.addUniform("vSphericalZX", 3);

        super.buildUniformLayout();
    }

    /**
     * Binds the submesh data.
     * @param world - The world matrix.
     * @param mesh - The BJS mesh.
     * @param subMesh - A submesh of the BJS mesh.
     */
    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        const scene = this.getScene();

        const defines = <PBRMaterialDefines>subMesh.materialDefines;
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

        this._eventInfo.subMesh = subMesh;
        this._callbackPluginEventHardBindForSubMesh(this._eventInfo);

        // Normal Matrix
        if (defines.OBJECTSPACE_NORMALMAP) {
            world.toNormalMatrix(this._normalMatrix);
            this.bindOnlyNormalMatrix(this._normalMatrix);
        }

        const mustRebind = this._mustRebind(scene, effect, subMesh, mesh.visibility);

        // Bones
        MaterialHelper.BindBonesParameters(mesh, this._activeEffect, this.prePassConfiguration);

        let reflectionTexture: Nullable<BaseTexture> = null;
        const ubo = this._uniformBuffer;
        if (mustRebind) {
            this.bindViewProjection(effect);
            reflectionTexture = this._getReflectionTexture();

            if (!ubo.useUbo || !this.isFrozen || !ubo.isSync || subMesh._drawWrapper._forceRebindOnNextCall) {
                // Texture uniforms
                if (scene.texturesEnabled) {
                    if (this._albedoTexture && MaterialFlags.DiffuseTextureEnabled) {
                        ubo.updateFloat2("vAlbedoInfos", this._albedoTexture.coordinatesIndex, this._albedoTexture.level);
                        MaterialHelper.BindTextureMatrix(this._albedoTexture, ubo, "albedo");
                    }

                    if (this._ambientTexture && MaterialFlags.AmbientTextureEnabled) {
                        ubo.updateFloat4(
                            "vAmbientInfos",
                            this._ambientTexture.coordinatesIndex,
                            this._ambientTexture.level,
                            this._ambientTextureStrength,
                            this._ambientTextureImpactOnAnalyticalLights
                        );
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
                            const cubeTexture = <CubeTexture>reflectionTexture;

                            ubo.updateVector3("vReflectionPosition", cubeTexture.boundingBoxPosition);
                            ubo.updateVector3("vReflectionSize", cubeTexture.boundingBoxSize);
                        }

                        if (this.realTimeFiltering) {
                            const width = reflectionTexture.getSize().width;
                            ubo.updateFloat2("vReflectionFilteringInfo", width, Scalar.Log2(width));
                        }

                        if (!defines.USEIRRADIANCEMAP) {
                            const polynomials = reflectionTexture.sphericalPolynomial;
                            if (defines.USESPHERICALFROMREFLECTIONMAP && polynomials) {
                                if (defines.SPHERICAL_HARMONICS) {
                                    const preScaledHarmonics = polynomials.preScaledHarmonics;
                                    ubo.updateVector3("vSphericalL00", preScaledHarmonics.l00);
                                    ubo.updateVector3("vSphericalL1_1", preScaledHarmonics.l1_1);
                                    ubo.updateVector3("vSphericalL10", preScaledHarmonics.l10);
                                    ubo.updateVector3("vSphericalL11", preScaledHarmonics.l11);
                                    ubo.updateVector3("vSphericalL2_2", preScaledHarmonics.l2_2);
                                    ubo.updateVector3("vSphericalL2_1", preScaledHarmonics.l2_1);
                                    ubo.updateVector3("vSphericalL20", preScaledHarmonics.l20);
                                    ubo.updateVector3("vSphericalL21", preScaledHarmonics.l21);
                                    ubo.updateVector3("vSphericalL22", preScaledHarmonics.l22);
                                } else {
                                    ubo.updateFloat3("vSphericalX", polynomials.x.x, polynomials.x.y, polynomials.x.z);
                                    ubo.updateFloat3("vSphericalY", polynomials.y.x, polynomials.y.y, polynomials.y.z);
                                    ubo.updateFloat3("vSphericalZ", polynomials.z.x, polynomials.z.y, polynomials.z.z);
                                    ubo.updateFloat3(
                                        "vSphericalXX_ZZ",
                                        polynomials.xx.x - polynomials.zz.x,
                                        polynomials.xx.y - polynomials.zz.y,
                                        polynomials.xx.z - polynomials.zz.z
                                    );
                                    ubo.updateFloat3(
                                        "vSphericalYY_ZZ",
                                        polynomials.yy.x - polynomials.zz.x,
                                        polynomials.yy.y - polynomials.zz.y,
                                        polynomials.yy.z - polynomials.zz.z
                                    );
                                    ubo.updateFloat3("vSphericalZZ", polynomials.zz.x, polynomials.zz.y, polynomials.zz.z);
                                    ubo.updateFloat3("vSphericalXY", polynomials.xy.x, polynomials.xy.y, polynomials.xy.z);
                                    ubo.updateFloat3("vSphericalYZ", polynomials.yz.x, polynomials.yz.y, polynomials.yz.z);
                                    ubo.updateFloat3("vSphericalZX", polynomials.zx.x, polynomials.zx.y, polynomials.zx.z);
                                }
                            }
                        }

                        ubo.updateFloat3(
                            "vReflectionMicrosurfaceInfos",
                            reflectionTexture.getSize().width,
                            reflectionTexture.lodGenerationScale,
                            reflectionTexture.lodGenerationOffset
                        );
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
                        } else if (this._reflectivityTexture) {
                            ubo.updateFloat3("vReflectivityInfos", this._reflectivityTexture.coordinatesIndex, this._reflectivityTexture.level, 1.0);
                            MaterialHelper.BindTextureMatrix(this._reflectivityTexture, ubo, "reflectivity");
                        }

                        if (this._metallicReflectanceTexture) {
                            ubo.updateFloat2("vMetallicReflectanceInfos", this._metallicReflectanceTexture.coordinatesIndex, this._metallicReflectanceTexture.level);
                            MaterialHelper.BindTextureMatrix(this._metallicReflectanceTexture, ubo, "metallicReflectance");
                        }

                        if (this._reflectanceTexture && defines.REFLECTANCE) {
                            ubo.updateFloat2("vReflectanceInfos", this._reflectanceTexture.coordinatesIndex, this._reflectanceTexture.level);
                            MaterialHelper.BindTextureMatrix(this._reflectanceTexture, ubo, "reflectance");
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
                    TmpColors.Color3[0].r = this._metallic === undefined || this._metallic === null ? 1 : this._metallic;
                    TmpColors.Color3[0].g = this._roughness === undefined || this._roughness === null ? 1 : this._roughness;
                    ubo.updateColor4("vReflectivityColor", TmpColors.Color3[0], 1);

                    const ior = this.subSurface?._indexOfRefraction ?? 1.5;
                    const outsideIOR = 1; // consider air as clear coat and other layers would remap in the shader.

                    // We are here deriving our default reflectance from a common value for none metallic surface.
                    // Based of the schlick fresnel approximation model
                    // for dielectrics.
                    const f0 = Math.pow((ior - outsideIOR) / (ior + outsideIOR), 2);

                    // Tweak the default F0 and F90 based on our given setup
                    this._metallicReflectanceColor.scaleToRef(f0 * this._metallicF0Factor, TmpColors.Color3[0]);
                    const metallicF90 = this._metallicF0Factor;

                    ubo.updateColor4("vMetallicReflectanceFactors", TmpColors.Color3[0], metallicF90);
                } else {
                    ubo.updateColor4("vReflectivityColor", this._reflectivityColor, this._microSurface);
                }

                ubo.updateColor3("vEmissiveColor", MaterialFlags.EmissiveTextureEnabled ? this._emissiveColor : Color3.BlackReadOnly);
                ubo.updateColor3("vReflectionColor", this._reflectionColor);
                if (!defines.SS_REFRACTION && this.subSurface?._linkRefractionWithTransparency) {
                    ubo.updateColor4("vAlbedoColor", this._albedoColor, 1);
                } else {
                    ubo.updateColor4("vAlbedoColor", this._albedoColor, this.alpha);
                }

                // Misc
                this._lightingInfos.x = this._directIntensity;
                this._lightingInfos.y = this._emissiveIntensity;
                this._lightingInfos.z = this._environmentIntensity * scene.environmentIntensity;
                this._lightingInfos.w = this._specularIntensity;

                ubo.updateVector4("vLightingIntensity", this._lightingInfos);

                // Colors
                scene.ambientColor.multiplyToRef(this._ambientColor, this._globalAmbientColor);

                ubo.updateColor3("vAmbientColor", this._globalAmbientColor);

                ubo.updateFloat2("vDebugMode", this.debugLimit, this.debugFactor);
            }

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
                    } else {
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
                    } else if (this._reflectivityTexture) {
                        ubo.setTexture("reflectivitySampler", this._reflectivityTexture);
                    }

                    if (this._metallicReflectanceTexture) {
                        ubo.setTexture("metallicReflectanceSampler", this._metallicReflectanceTexture);
                    }

                    if (this._reflectanceTexture && defines.REFLECTANCE) {
                        ubo.setTexture("reflectanceSampler", this._reflectanceTexture);
                    }

                    if (this._microSurfaceTexture) {
                        ubo.setTexture("microSurfaceSampler", this._microSurfaceTexture);
                    }
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
            bindClipPlane(this._activeEffect, this, scene);

            this.bindEyePosition(effect);
        } else if (scene.getEngine()._features.needToAlwaysBindUniformBuffers) {
            this._needToBindSceneUbo = true;
        }

        if (mustRebind || !this.isFrozen) {
            // Lights
            if (scene.lightsEnabled && !this._disableLighting) {
                MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this._maxSimultaneousLights);
            }

            // View
            if (
                (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) ||
                reflectionTexture ||
                this.subSurface.refractionTexture ||
                mesh.receiveShadows ||
                defines.PREPASS
            ) {
                this.bindView(effect);
            }

            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect, true);

            // Morph targets
            if (defines.NUM_MORPH_INFLUENCERS) {
                MaterialHelper.BindMorphTargetParameters(mesh, this._activeEffect);
            }

            if (defines.BAKED_VERTEX_ANIMATION_TEXTURE) {
                mesh.bakedVertexAnimationManager?.bind(effect, defines.INSTANCES);
            }

            // image processing
            this._imageProcessingConfiguration!.bind(this._activeEffect);

            // Log. depth
            MaterialHelper.BindLogDepth(defines, this._activeEffect, scene);
        }

        this._afterBind(mesh, this._activeEffect, subMesh);

        ubo.update();
    }

    /**
     * Returns the animatable textures.
     * If material have animatable metallic texture, then reflectivity texture will not be returned, even if it has animations.
     * @returns - Array of animatable textures.
     */
    public getAnimatables(): IAnimatable[] {
        const results = super.getAnimatables();

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
        } else if (this._reflectivityTexture && this._reflectivityTexture.animations && this._reflectivityTexture.animations.length > 0) {
            results.push(this._reflectivityTexture);
        }

        if (this._bumpTexture && this._bumpTexture.animations && this._bumpTexture.animations.length > 0) {
            results.push(this._bumpTexture);
        }

        if (this._lightmapTexture && this._lightmapTexture.animations && this._lightmapTexture.animations.length > 0) {
            results.push(this._lightmapTexture);
        }

        if (this._metallicReflectanceTexture && this._metallicReflectanceTexture.animations && this._metallicReflectanceTexture.animations.length > 0) {
            results.push(this._metallicReflectanceTexture);
        }

        if (this._reflectanceTexture && this._reflectanceTexture.animations && this._reflectanceTexture.animations.length > 0) {
            results.push(this._reflectanceTexture);
        }

        if (this._microSurfaceTexture && this._microSurfaceTexture.animations && this._microSurfaceTexture.animations.length > 0) {
            results.push(this._microSurfaceTexture);
        }

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
        const activeTextures = super.getActiveTextures();

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

        if (this._reflectanceTexture) {
            activeTextures.push(this._reflectanceTexture);
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

        if (this._emissiveTexture === texture) {
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

        if (this._reflectanceTexture === texture) {
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

        return false;
    }

    /**
     * Sets the required values to the prepass renderer.
     * It can't be sets when subsurface scattering of this material is disabled.
     * When scene have ability to enable subsurface prepass effect, it will enable.
     * @returns - If prepass is enabled or not.
     */
    public setPrePassRenderer(): boolean {
        if (!this.subSurface?.isScatteringEnabled) {
            return false;
        }

        const subSurfaceConfiguration = this.getScene().enableSubSurfaceForPrePass();
        if (subSurfaceConfiguration) {
            subSurfaceConfiguration.enabled = true;
        }

        return true;
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
            this._reflectanceTexture?.dispose();
            this._microSurfaceTexture?.dispose();
        }

        this._renderTargets.dispose();

        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }

        super.dispose(forceDisposeEffect, forceDisposeTextures);
    }
}
