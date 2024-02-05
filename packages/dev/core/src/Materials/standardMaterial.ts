/* eslint-disable @typescript-eslint/naming-convention */
import { serialize, SerializationHelper, serializeAsColor3, expandToProperty, serializeAsFresnelParameters, serializeAsTexture } from "../Misc/decorators";
import type { Observer } from "../Misc/observable";
import { SmartArray } from "../Misc/smartArray";
import type { IAnimatable } from "../Animations/animatable.interface";

import type { Nullable } from "../types";
import { Scene } from "../scene";
import { Matrix } from "../Maths/math.vector";
import { Color3 } from "../Maths/math.color";
import { VertexBuffer } from "../Buffers/buffer";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Mesh } from "../Meshes/mesh";
import { PrePassConfiguration } from "./prePassConfiguration";

import type { IImageProcessingConfigurationDefines } from "./imageProcessingConfiguration";
import { ImageProcessingConfiguration } from "./imageProcessingConfiguration";
import type { ColorCurves } from "./colorCurves";
import type { FresnelParameters } from "./fresnelParameters";
import type { ICustomShaderNameResolveOptions } from "../Materials/material";
import { Material } from "../Materials/material";
import { MaterialPluginEvent } from "./materialPluginEvent";
import { MaterialDefines } from "../Materials/materialDefines";
import { PushMaterial } from "./pushMaterial";
import { MaterialHelper } from "./materialHelper";

import type { BaseTexture } from "../Materials/Textures/baseTexture";
import { Texture } from "../Materials/Textures/texture";
import type { CubeTexture } from "../Materials/Textures/cubeTexture";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { RegisterClass } from "../Misc/typeStore";
import { MaterialFlags } from "./materialFlags";

import "../Shaders/default.fragment";
import "../Shaders/default.vertex";
import { Constants } from "../Engines/constants";
import { EffectFallbacks } from "./effectFallbacks";
import type { Effect, IEffectCreationOptions } from "./effect";
import { DetailMapConfiguration } from "./material.detailMapConfiguration";
import { addClipPlaneUniforms, bindClipPlane } from "./clipPlaneMaterialHelper";

const onCreatedEffectParameters = { effect: null as unknown as Effect, subMesh: null as unknown as Nullable<SubMesh> };

/** @internal */
export class StandardMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
    public MAINUV1 = false;
    public MAINUV2 = false;
    public MAINUV3 = false;
    public MAINUV4 = false;
    public MAINUV5 = false;
    public MAINUV6 = false;
    public DIFFUSE = false;
    public DIFFUSEDIRECTUV = 0;
    public BAKED_VERTEX_ANIMATION_TEXTURE = false;
    public AMBIENT = false;
    public AMBIENTDIRECTUV = 0;
    public OPACITY = false;
    public OPACITYDIRECTUV = 0;
    public OPACITYRGB = false;
    public REFLECTION = false;
    public EMISSIVE = false;
    public EMISSIVEDIRECTUV = 0;
    public SPECULAR = false;
    public SPECULARDIRECTUV = 0;
    public BUMP = false;
    public BUMPDIRECTUV = 0;
    public PARALLAX = false;
    public PARALLAX_RHS = false;
    public PARALLAXOCCLUSION = false;
    public SPECULAROVERALPHA = false;
    public CLIPPLANE = false;
    public CLIPPLANE2 = false;
    public CLIPPLANE3 = false;
    public CLIPPLANE4 = false;
    public CLIPPLANE5 = false;
    public CLIPPLANE6 = false;
    public ALPHATEST = false;
    public DEPTHPREPASS = false;
    public ALPHAFROMDIFFUSE = false;
    public POINTSIZE = false;
    public FOG = false;
    public SPECULARTERM = false;
    public DIFFUSEFRESNEL = false;
    public OPACITYFRESNEL = false;
    public REFLECTIONFRESNEL = false;
    public REFRACTIONFRESNEL = false;
    public EMISSIVEFRESNEL = false;
    public FRESNEL = false;
    public NORMAL = false;
    public TANGENT = false;
    public UV1 = false;
    public UV2 = false;
    public UV3 = false;
    public UV4 = false;
    public UV5 = false;
    public UV6 = false;
    public VERTEXCOLOR = false;
    public VERTEXALPHA = false;
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public BONETEXTURE = false;
    public BONES_VELOCITY_ENABLED = false;
    public INSTANCES = false;
    public THIN_INSTANCES = false;
    public INSTANCESCOLOR = false;
    public GLOSSINESS = false;
    public ROUGHNESS = false;
    public EMISSIVEASILLUMINATION = false;
    public LINKEMISSIVEWITHDIFFUSE = false;
    public REFLECTIONFRESNELFROMSPECULAR = false;
    public LIGHTMAP = false;
    public LIGHTMAPDIRECTUV = 0;
    public OBJECTSPACE_NORMALMAP = false;
    public USELIGHTMAPASSHADOWMAP = false;
    public REFLECTIONMAP_3D = false;
    public REFLECTIONMAP_SPHERICAL = false;
    public REFLECTIONMAP_PLANAR = false;
    public REFLECTIONMAP_CUBIC = false;
    public USE_LOCAL_REFLECTIONMAP_CUBIC = false;
    public USE_LOCAL_REFRACTIONMAP_CUBIC = false;
    public REFLECTIONMAP_PROJECTION = false;
    public REFLECTIONMAP_SKYBOX = false;
    public REFLECTIONMAP_EXPLICIT = false;
    public REFLECTIONMAP_EQUIRECTANGULAR = false;
    public REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
    public REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
    public REFLECTIONMAP_OPPOSITEZ = false;
    public INVERTCUBICMAP = false;
    public LOGARITHMICDEPTH = false;
    public REFRACTION = false;
    public REFRACTIONMAP_3D = false;
    public REFLECTIONOVERALPHA = false;
    public TWOSIDEDLIGHTING = false;
    public SHADOWFLOAT = false;
    public MORPHTARGETS = false;
    public MORPHTARGETS_NORMAL = false;
    public MORPHTARGETS_TANGENT = false;
    public MORPHTARGETS_UV = false;
    public NUM_MORPH_INFLUENCERS = 0;
    public MORPHTARGETS_TEXTURE = false;
    public NONUNIFORMSCALING = false; // https://playground.babylonjs.com#V6DWIH
    public PREMULTIPLYALPHA = false; // https://playground.babylonjs.com#LNVJJ7
    public ALPHATEST_AFTERALLALPHACOMPUTATIONS = false;
    public ALPHABLEND = true;

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

    public RGBDLIGHTMAP = false;
    public RGBDREFLECTION = false;
    public RGBDREFRACTION = false;

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
    public MULTIVIEW = false;
    public ORDER_INDEPENDENT_TRANSPARENCY = false;
    public ORDER_INDEPENDENT_TRANSPARENCY_16BITS = false;
    public CAMERA_ORTHOGRAPHIC = false;
    public CAMERA_PERSPECTIVE = false;

    /**
     * If the reflection texture on this material is in linear color space
     * @internal
     */
    public IS_REFLECTION_LINEAR = false;
    /**
     * If the refraction texture on this material is in linear color space
     * @internal
     */
    public IS_REFRACTION_LINEAR = false;
    public EXPOSURE = false;

    public DECAL_AFTER_DETAIL = false;

    /**
     * Initializes the Standard Material defines.
     * @param externalProperties The external properties
     */
    constructor(externalProperties?: { [name: string]: { type: string; default: any } }) {
        super(externalProperties);
        this.rebuild();
    }

    public setReflectionMode(modeToEnable: string) {
        const modes = [
            "REFLECTIONMAP_CUBIC",
            "REFLECTIONMAP_EXPLICIT",
            "REFLECTIONMAP_PLANAR",
            "REFLECTIONMAP_PROJECTION",
            "REFLECTIONMAP_PROJECTION",
            "REFLECTIONMAP_SKYBOX",
            "REFLECTIONMAP_SPHERICAL",
            "REFLECTIONMAP_EQUIRECTANGULAR",
            "REFLECTIONMAP_EQUIRECTANGULAR_FIXED",
            "REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED",
        ];

        for (const mode of modes) {
            (<any>this)[mode] = mode === modeToEnable;
        }
    }
}

/**
 * This is the default material used in Babylon. It is the best trade off between quality
 * and performances.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction
 */
export class StandardMaterial extends PushMaterial {
    @serializeAsTexture("diffuseTexture")
    private _diffuseTexture: Nullable<BaseTexture> = null;
    /**
     * The basic texture of the material as viewed under a light.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
    public diffuseTexture: Nullable<BaseTexture>;

    @serializeAsTexture("ambientTexture")
    private _ambientTexture: Nullable<BaseTexture> = null;
    /**
     * AKA Occlusion Texture in other nomenclature, it helps adding baked shadows into your material.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public ambientTexture: Nullable<BaseTexture>;

    @serializeAsTexture("opacityTexture")
    private _opacityTexture: Nullable<BaseTexture> = null;
    /**
     * Define the transparency of the material from a texture.
     * The final alpha value can be read either from the red channel (if texture.getAlphaFromRGB is false)
     * or from the luminance or the current texel (if texture.getAlphaFromRGB is true)
     */
    @expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
    public opacityTexture: Nullable<BaseTexture>;

    @serializeAsTexture("reflectionTexture")
    private _reflectionTexture: Nullable<BaseTexture> = null;
    /**
     * Define the texture used to display the reflection.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#how-to-obtain-reflections-and-refractions
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectionTexture: Nullable<BaseTexture>;

    @serializeAsTexture("emissiveTexture")
    private _emissiveTexture: Nullable<BaseTexture> = null;
    /**
     * Define texture of the material as if self lit.
     * This will be mixed in the final result even in the absence of light.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public emissiveTexture: Nullable<BaseTexture>;

    @serializeAsTexture("specularTexture")
    private _specularTexture: Nullable<BaseTexture> = null;
    /**
     * Define how the color and intensity of the highlight given by the light in the material.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public specularTexture: Nullable<BaseTexture>;

    @serializeAsTexture("bumpTexture")
    private _bumpTexture: Nullable<BaseTexture> = null;
    /**
     * Bump mapping is a technique to simulate bump and dents on a rendered surface.
     * These are made by creating a normal map from an image. The means to do this can be found on the web, a search for 'normal map generator' will bring up free and paid for methods of doing this.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/moreMaterials#bump-map
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public bumpTexture: Nullable<BaseTexture>;

    @serializeAsTexture("lightmapTexture")
    private _lightmapTexture: Nullable<BaseTexture> = null;
    /**
     * Complex lighting can be computationally expensive to compute at runtime.
     * To save on computation, lightmaps may be used to store calculated lighting in a texture which will be applied to a given mesh.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction#lightmaps
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public lightmapTexture: Nullable<BaseTexture>;

    @serializeAsTexture("refractionTexture")
    private _refractionTexture: Nullable<BaseTexture> = null;
    /**
     * Define the texture used to display the refraction.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#how-to-obtain-reflections-and-refractions
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public refractionTexture: Nullable<BaseTexture>;

    /**
     * The color of the material lit by the environmental background lighting.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction#ambient-color-example
     */
    @serializeAsColor3("ambient")
    public ambientColor = new Color3(0, 0, 0);

    /**
     * The basic color of the material as viewed under a light.
     */
    @serializeAsColor3("diffuse")
    public diffuseColor = new Color3(1, 1, 1);

    /**
     * Define how the color and intensity of the highlight given by the light in the material.
     */
    @serializeAsColor3("specular")
    public specularColor = new Color3(1, 1, 1);

    /**
     * Define the color of the material as if self lit.
     * This will be mixed in the final result even in the absence of light.
     */
    @serializeAsColor3("emissive")
    public emissiveColor = new Color3(0, 0, 0);

    /**
     * Defines how sharp are the highlights in the material.
     * The bigger the value the sharper giving a more glossy feeling to the result.
     * Reversely, the smaller the value the blurrier giving a more rough feeling to the result.
     */
    @serialize()
    public specularPower = 64;

    @serialize("useAlphaFromDiffuseTexture")
    private _useAlphaFromDiffuseTexture = false;
    /**
     * Does the transparency come from the diffuse texture alpha channel.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
    public useAlphaFromDiffuseTexture: boolean;

    @serialize("useEmissiveAsIllumination")
    private _useEmissiveAsIllumination = false;
    /**
     * If true, the emissive value is added into the end result, otherwise it is multiplied in.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useEmissiveAsIllumination: boolean;

    @serialize("linkEmissiveWithDiffuse")
    private _linkEmissiveWithDiffuse = false;
    /**
     * If true, some kind of energy conservation will prevent the end result to be more than 1 by reducing
     * the emissive level when the final color is close to one.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public linkEmissiveWithDiffuse: boolean;

    @serialize("useSpecularOverAlpha")
    private _useSpecularOverAlpha = false;
    /**
     * Specifies that the material will keep the specular highlights over a transparent surface (only the most luminous ones).
     * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useSpecularOverAlpha: boolean;

    @serialize("useReflectionOverAlpha")
    private _useReflectionOverAlpha = false;
    /**
     * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most luminous ones).
     * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useReflectionOverAlpha: boolean;

    @serialize("disableLighting")
    private _disableLighting = false;
    /**
     * Does lights from the scene impacts this material.
     * It can be a nice trick for performance to disable lighting on a fully emissive material.
     */
    @expandToProperty("_markAllSubMeshesAsLightsDirty")
    public disableLighting: boolean;

    @serialize("useObjectSpaceNormalMap")
    private _useObjectSpaceNormalMap = false;
    /**
     * Allows using an object space normal map (instead of tangent space).
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useObjectSpaceNormalMap: boolean;

    @serialize("useParallax")
    private _useParallax = false;
    /**
     * Is parallax enabled or not.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/parallaxMapping
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useParallax: boolean;

    @serialize("useParallaxOcclusion")
    private _useParallaxOcclusion = false;
    /**
     * Is parallax occlusion enabled or not.
     * If true, the outcome is way more realistic than traditional Parallax but you can expect a performance hit that worthes consideration.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/parallaxMapping
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useParallaxOcclusion: boolean;

    /**
     * Apply a scaling factor that determine which "depth" the height map should reprensent. A value between 0.05 and 0.1 is reasonnable in Parallax, you can reach 0.2 using Parallax Occlusion.
     */
    @serialize()
    public parallaxScaleBias = 0.05;

    @serialize("roughness")
    private _roughness = 0;
    /**
     * Helps to define how blurry the reflections should appears in the material.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public roughness: number;

    /**
     * In case of refraction, define the value of the index of refraction.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#how-to-obtain-reflections-and-refractions
     */
    @serialize()
    public indexOfRefraction = 0.98;

    /**
     * Invert the refraction texture alongside the y axis.
     * It can be useful with procedural textures or probe for instance.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#how-to-obtain-reflections-and-refractions
     */
    @serialize()
    public invertRefractionY = true;

    /**
     * Defines the alpha limits in alpha test mode.
     */
    @serialize()
    public alphaCutOff = 0.4;

    @serialize("useLightmapAsShadowmap")
    private _useLightmapAsShadowmap = false;
    /**
     * In case of light mapping, define whether the map contains light or shadow informations.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useLightmapAsShadowmap: boolean;

    // Fresnel
    @serializeAsFresnelParameters("diffuseFresnelParameters")
    private _diffuseFresnelParameters: FresnelParameters;
    /**
     * Define the diffuse fresnel parameters of the material.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
     */
    @expandToProperty("_markAllSubMeshesAsFresnelDirty")
    public diffuseFresnelParameters: FresnelParameters;

    @serializeAsFresnelParameters("opacityFresnelParameters")
    private _opacityFresnelParameters: FresnelParameters;
    /**
     * Define the opacity fresnel parameters of the material.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
     */
    @expandToProperty("_markAllSubMeshesAsFresnelAndMiscDirty")
    public opacityFresnelParameters: FresnelParameters;

    @serializeAsFresnelParameters("reflectionFresnelParameters")
    private _reflectionFresnelParameters: FresnelParameters;
    /**
     * Define the reflection fresnel parameters of the material.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
     */
    @expandToProperty("_markAllSubMeshesAsFresnelDirty")
    public reflectionFresnelParameters: FresnelParameters;

    @serializeAsFresnelParameters("refractionFresnelParameters")
    private _refractionFresnelParameters: FresnelParameters;
    /**
     * Define the refraction fresnel parameters of the material.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
     */
    @expandToProperty("_markAllSubMeshesAsFresnelDirty")
    public refractionFresnelParameters: FresnelParameters;

    @serializeAsFresnelParameters("emissiveFresnelParameters")
    private _emissiveFresnelParameters: FresnelParameters;
    /**
     * Define the emissive fresnel parameters of the material.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
     */
    @expandToProperty("_markAllSubMeshesAsFresnelDirty")
    public emissiveFresnelParameters: FresnelParameters;

    @serialize("useReflectionFresnelFromSpecular")
    private _useReflectionFresnelFromSpecular = false;
    /**
     * If true automatically deducts the fresnels values from the material specularity.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
     */
    @expandToProperty("_markAllSubMeshesAsFresnelDirty")
    public useReflectionFresnelFromSpecular: boolean;

    @serialize("useGlossinessFromSpecularMapAlpha")
    private _useGlossinessFromSpecularMapAlpha = false;
    /**
     * Defines if the glossiness/roughness of the material should be read from the specular map alpha channel
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useGlossinessFromSpecularMapAlpha: boolean;

    @serialize("maxSimultaneousLights")
    private _maxSimultaneousLights = 4;
    /**
     * Defines the maximum number of lights that can be used in the material
     */
    @expandToProperty("_markAllSubMeshesAsLightsDirty")
    public maxSimultaneousLights: number;

    @serialize("invertNormalMapX")
    private _invertNormalMapX = false;
    /**
     * If sets to true, x component of normal map value will invert (x = 1.0 - x).
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public invertNormalMapX: boolean;

    @serialize("invertNormalMapY")
    private _invertNormalMapY = false;
    /**
     * If sets to true, y component of normal map value will invert (y = 1.0 - y).
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public invertNormalMapY: boolean;

    @serialize("twoSidedLighting")
    private _twoSidedLighting = false;
    /**
     * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public twoSidedLighting: boolean;

    @serialize("applyDecalMapAfterDetailMap")
    private _applyDecalMapAfterDetailMap = false;
    /**
     * If sets to true, the decal map will be applied after the detail map. Else, it is applied before (default: false)
     */
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public applyDecalMapAfterDetailMap: boolean;

    /**
     * Default configuration related to image processing available in the standard Material.
     */
    protected _imageProcessingConfiguration: ImageProcessingConfiguration;

    /**
     * Gets the image processing configuration used either in this material.
     */
    public get imageProcessingConfiguration(): ImageProcessingConfiguration {
        return this._imageProcessingConfiguration;
    }

    /**
     * Sets the Default image processing configuration used either in the this material.
     *
     * If sets to null, the scene one is in use.
     */
    public set imageProcessingConfiguration(value: ImageProcessingConfiguration) {
        this._attachImageProcessingConfiguration(value);

        // Ensure the effect will be rebuilt.
        this._markAllSubMeshesAsTexturesDirty();
    }

    /**
     * Keep track of the image processing observer to allow dispose and replace.
     */
    private _imageProcessingObserver: Nullable<Observer<ImageProcessingConfiguration>>;

    /**
     * Attaches a new image processing configuration to the Standard Material.
     * @param configuration
     */
    protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void {
        if (configuration === this._imageProcessingConfiguration) {
            return;
        }

        // Detaches observer
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }

        // Pick the scene configuration if needed
        if (!configuration) {
            this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration;
        } else {
            this._imageProcessingConfiguration = configuration;
        }

        // Attaches observer
        if (this._imageProcessingConfiguration) {
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
                this._markAllSubMeshesAsImageProcessingDirty();
            });
        }
    }

    /**
     * Defines additional PrePass parameters for the material.
     */
    public readonly prePassConfiguration: PrePassConfiguration;

    /**
     * Can this material render to prepass
     */
    public get isPrePassCapable(): boolean {
        return !this.disableDepthWrite;
    }

    /**
     * Gets whether the color curves effect is enabled.
     */
    public get cameraColorCurvesEnabled(): boolean {
        return this.imageProcessingConfiguration.colorCurvesEnabled;
    }
    /**
     * Sets whether the color curves effect is enabled.
     */
    public set cameraColorCurvesEnabled(value: boolean) {
        this.imageProcessingConfiguration.colorCurvesEnabled = value;
    }

    /**
     * Gets whether the color grading effect is enabled.
     */
    public get cameraColorGradingEnabled(): boolean {
        return this.imageProcessingConfiguration.colorGradingEnabled;
    }
    /**
     * Gets whether the color grading effect is enabled.
     */
    public set cameraColorGradingEnabled(value: boolean) {
        this.imageProcessingConfiguration.colorGradingEnabled = value;
    }

    /**
     * Gets whether tonemapping is enabled or not.
     */
    public get cameraToneMappingEnabled(): boolean {
        return this._imageProcessingConfiguration.toneMappingEnabled;
    }
    /**
     * Sets whether tonemapping is enabled or not
     */
    public set cameraToneMappingEnabled(value: boolean) {
        this._imageProcessingConfiguration.toneMappingEnabled = value;
    }

    /**
     * The camera exposure used on this material.
     * This property is here and not in the camera to allow controlling exposure without full screen post process.
     * This corresponds to a photographic exposure.
     */
    public get cameraExposure(): number {
        return this._imageProcessingConfiguration.exposure;
    }
    /**
     * The camera exposure used on this material.
     * This property is here and not in the camera to allow controlling exposure without full screen post process.
     * This corresponds to a photographic exposure.
     */
    public set cameraExposure(value: number) {
        this._imageProcessingConfiguration.exposure = value;
    }

    /**
     * Gets The camera contrast used on this material.
     */
    public get cameraContrast(): number {
        return this._imageProcessingConfiguration.contrast;
    }

    /**
     * Sets The camera contrast used on this material.
     */
    public set cameraContrast(value: number) {
        this._imageProcessingConfiguration.contrast = value;
    }

    /**
     * Gets the Color Grading 2D Lookup Texture.
     */
    public get cameraColorGradingTexture(): Nullable<BaseTexture> {
        return this._imageProcessingConfiguration.colorGradingTexture;
    }
    /**
     * Sets the Color Grading 2D Lookup Texture.
     */
    public set cameraColorGradingTexture(value: Nullable<BaseTexture>) {
        this._imageProcessingConfiguration.colorGradingTexture = value;
    }

    /**
     * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
     * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
     * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
     * corresponding to low luminance, medium luminance, and high luminance areas respectively.
     */
    public get cameraColorCurves(): Nullable<ColorCurves> {
        return this._imageProcessingConfiguration.colorCurves;
    }
    /**
     * The color grading curves provide additional color adjustment that is applied after any color grading transform (3D LUT).
     * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
     * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
     * corresponding to low luminance, medium luminance, and high luminance areas respectively.
     */
    public set cameraColorCurves(value: Nullable<ColorCurves>) {
        this._imageProcessingConfiguration.colorCurves = value;
    }

    /**
     * Can this material render to several textures at once
     */
    public get canRenderToMRT() {
        return true;
    }

    /**
     * Defines the detail map parameters for the material.
     */
    public readonly detailMap: DetailMapConfiguration;

    protected _renderTargets = new SmartArray<RenderTargetTexture>(16);
    protected _worldViewProjectionMatrix = Matrix.Zero();
    protected _globalAmbientColor = new Color3(0, 0, 0);
    protected _cacheHasRenderTargetTextures = false;

    /**
     * Instantiates a new standard material.
     * This is the default material used in Babylon. It is the best trade off between quality
     * and performances.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction
     * @param name Define the name of the material in the scene
     * @param scene Define the scene the material belong to
     */
    constructor(name: string, scene?: Scene) {
        super(name, scene);

        this.detailMap = new DetailMapConfiguration(this);

        // Setup the default processing configuration to the scene.
        this._attachImageProcessingConfiguration(null);
        this.prePassConfiguration = new PrePassConfiguration();

        this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
            this._renderTargets.reset();

            if (StandardMaterial.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                this._renderTargets.push(<RenderTargetTexture>this._reflectionTexture);
            }

            if (StandardMaterial.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget) {
                this._renderTargets.push(<RenderTargetTexture>this._refractionTexture);
            }

            this._eventInfo.renderTargets = this._renderTargets;
            this._callbackPluginEventFillRenderTargetTextures(this._eventInfo);

            return this._renderTargets;
        };
    }

    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    public get hasRenderTargetTextures(): boolean {
        if (StandardMaterial.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
            return true;
        }

        if (StandardMaterial.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget) {
            return true;
        }

        return this._cacheHasRenderTargetTextures;
    }

    /**
     * Gets the current class name of the material e.g. "StandardMaterial"
     * Mainly use in serialization.
     * @returns the class name
     */
    public getClassName(): string {
        return "StandardMaterial";
    }

    /**
     * Specifies if the material will require alpha blending
     * @returns a boolean specifying if alpha blending is needed
     */
    public needAlphaBlending(): boolean {
        if (this._disableAlphaBlending) {
            return false;
        }

        return (
            this.alpha < 1.0 ||
            this._opacityTexture != null ||
            this._shouldUseAlphaFromDiffuseTexture() ||
            (this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled)
        );
    }

    /**
     * Specifies if this material should be rendered in alpha test mode
     * @returns a boolean specifying if an alpha test is needed.
     */
    public needAlphaTesting(): boolean {
        if (this._forceAlphaTest) {
            return true;
        }

        return this._hasAlphaChannel() && (this._transparencyMode == null || this._transparencyMode === Material.MATERIAL_ALPHATEST);
    }

    /**
     * @returns whether or not the alpha value of the diffuse texture should be used for alpha blending.
     */
    protected _shouldUseAlphaFromDiffuseTexture(): boolean {
        return this._diffuseTexture != null && this._diffuseTexture.hasAlpha && this._useAlphaFromDiffuseTexture && this._transparencyMode !== Material.MATERIAL_OPAQUE;
    }

    /**
     * @returns whether or not there is a usable alpha channel for transparency.
     */
    protected _hasAlphaChannel(): boolean {
        return (this._diffuseTexture != null && this._diffuseTexture.hasAlpha) || this._opacityTexture != null;
    }

    /**
     * Get the texture used for alpha test purpose.
     * @returns the diffuse texture in case of the standard material.
     */
    public getAlphaTestTexture(): Nullable<BaseTexture> {
        return this._diffuseTexture;
    }

    /**
     * Get if the submesh is ready to be used and all its information available.
     * Child classes can use it to update shaders
     * @param mesh defines the mesh to check
     * @param subMesh defines which submesh to check
     * @param useInstances specifies that instances should be used
     * @returns a boolean indicating that the submesh is ready or not
     */
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances: boolean = false): boolean {
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
            subMesh.materialDefines = new StandardMaterialDefines(this._eventInfo.defineNames);
        }

        const scene = this.getScene();
        const defines = <StandardMaterialDefines>subMesh.materialDefines;
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const engine = scene.getEngine();

        // Lights
        defines._needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);

        // Multiview
        MaterialHelper.PrepareDefinesForMultiview(scene, defines);

        // PrePass
        const oit = this.needAlphaBlendingForMesh(mesh) && this.getScene().useOrderIndependentTransparency;
        MaterialHelper.PrepareDefinesForPrePass(scene, defines, this.canRenderToMRT && !oit);

        // Order independant transparency
        MaterialHelper.PrepareDefinesForOIT(scene, defines, oit);

        // Textures
        if (defines._areTexturesDirty) {
            this._eventInfo.hasRenderTargetTextures = false;
            this._callbackPluginEventHasRenderTargetTextures(this._eventInfo);
            this._cacheHasRenderTargetTextures = this._eventInfo.hasRenderTargetTextures;
            defines._needUVs = false;
            for (let i = 1; i <= Constants.MAX_SUPPORTED_UV_SETS; ++i) {
                defines["MAINUV" + i] = false;
            }
            if (scene.texturesEnabled) {
                defines.DIFFUSEDIRECTUV = 0;
                defines.BUMPDIRECTUV = 0;
                defines.AMBIENTDIRECTUV = 0;
                defines.OPACITYDIRECTUV = 0;
                defines.EMISSIVEDIRECTUV = 0;
                defines.SPECULARDIRECTUV = 0;
                defines.LIGHTMAPDIRECTUV = 0;

                if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    if (!this._diffuseTexture.isReadyOrNotBlocking()) {
                        return false;
                    } else {
                        MaterialHelper.PrepareDefinesForMergedUV(this._diffuseTexture, defines, "DIFFUSE");
                    }
                } else {
                    defines.DIFFUSE = false;
                }

                if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                    if (!this._ambientTexture.isReadyOrNotBlocking()) {
                        return false;
                    } else {
                        MaterialHelper.PrepareDefinesForMergedUV(this._ambientTexture, defines, "AMBIENT");
                    }
                } else {
                    defines.AMBIENT = false;
                }

                if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                    if (!this._opacityTexture.isReadyOrNotBlocking()) {
                        return false;
                    } else {
                        MaterialHelper.PrepareDefinesForMergedUV(this._opacityTexture, defines, "OPACITY");
                        defines.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
                    }
                } else {
                    defines.OPACITY = false;
                }

                if (this._reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                    if (!this._reflectionTexture.isReadyOrNotBlocking()) {
                        return false;
                    } else {
                        defines._needNormals = true;
                        defines.REFLECTION = true;

                        defines.ROUGHNESS = this._roughness > 0;
                        defines.REFLECTIONOVERALPHA = this._useReflectionOverAlpha;
                        defines.INVERTCUBICMAP = this._reflectionTexture.coordinatesMode === Texture.INVCUBIC_MODE;
                        defines.REFLECTIONMAP_3D = this._reflectionTexture.isCube;
                        defines.REFLECTIONMAP_OPPOSITEZ =
                            defines.REFLECTIONMAP_3D && this.getScene().useRightHandedSystem ? !this._reflectionTexture.invertZ : this._reflectionTexture.invertZ;
                        defines.RGBDREFLECTION = this._reflectionTexture.isRGBD;

                        switch (this._reflectionTexture.coordinatesMode) {
                            case Texture.EXPLICIT_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_EXPLICIT");
                                break;
                            case Texture.PLANAR_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_PLANAR");
                                break;
                            case Texture.PROJECTION_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_PROJECTION");
                                break;
                            case Texture.SKYBOX_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_SKYBOX");
                                break;
                            case Texture.SPHERICAL_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_SPHERICAL");
                                break;
                            case Texture.EQUIRECTANGULAR_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR");
                                break;
                            case Texture.FIXED_EQUIRECTANGULAR_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR_FIXED");
                                break;
                            case Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED");
                                break;
                            case Texture.CUBIC_MODE:
                            case Texture.INVCUBIC_MODE:
                            default:
                                defines.setReflectionMode("REFLECTIONMAP_CUBIC");
                                break;
                        }

                        defines.USE_LOCAL_REFLECTIONMAP_CUBIC = (<any>this._reflectionTexture).boundingBoxSize ? true : false;
                    }
                } else {
                    defines.REFLECTION = false;
                    defines.REFLECTIONMAP_OPPOSITEZ = false;
                }

                if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                    if (!this._emissiveTexture.isReadyOrNotBlocking()) {
                        return false;
                    } else {
                        MaterialHelper.PrepareDefinesForMergedUV(this._emissiveTexture, defines, "EMISSIVE");
                    }
                } else {
                    defines.EMISSIVE = false;
                }

                if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                    if (!this._lightmapTexture.isReadyOrNotBlocking()) {
                        return false;
                    } else {
                        MaterialHelper.PrepareDefinesForMergedUV(this._lightmapTexture, defines, "LIGHTMAP");
                        defines.USELIGHTMAPASSHADOWMAP = this._useLightmapAsShadowmap;
                        defines.RGBDLIGHTMAP = this._lightmapTexture.isRGBD;
                    }
                } else {
                    defines.LIGHTMAP = false;
                }

                if (this._specularTexture && StandardMaterial.SpecularTextureEnabled) {
                    if (!this._specularTexture.isReadyOrNotBlocking()) {
                        return false;
                    } else {
                        MaterialHelper.PrepareDefinesForMergedUV(this._specularTexture, defines, "SPECULAR");
                        defines.GLOSSINESS = this._useGlossinessFromSpecularMapAlpha;
                    }
                } else {
                    defines.SPECULAR = false;
                }

                if (scene.getEngine().getCaps().standardDerivatives && this._bumpTexture && StandardMaterial.BumpTextureEnabled) {
                    // Bump texture can not be not blocking.
                    if (!this._bumpTexture.isReady()) {
                        return false;
                    } else {
                        MaterialHelper.PrepareDefinesForMergedUV(this._bumpTexture, defines, "BUMP");

                        defines.PARALLAX = this._useParallax;
                        defines.PARALLAX_RHS = scene.useRightHandedSystem;
                        defines.PARALLAXOCCLUSION = this._useParallaxOcclusion;
                    }

                    defines.OBJECTSPACE_NORMALMAP = this._useObjectSpaceNormalMap;
                } else {
                    defines.BUMP = false;
                    defines.PARALLAX = false;
                    defines.PARALLAX_RHS = false;
                    defines.PARALLAXOCCLUSION = false;
                }

                if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                    if (!this._refractionTexture.isReadyOrNotBlocking()) {
                        return false;
                    } else {
                        defines._needUVs = true;
                        defines.REFRACTION = true;

                        defines.REFRACTIONMAP_3D = this._refractionTexture.isCube;
                        defines.RGBDREFRACTION = this._refractionTexture.isRGBD;
                        defines.USE_LOCAL_REFRACTIONMAP_CUBIC = (<any>this._refractionTexture).boundingBoxSize ? true : false;
                    }
                } else {
                    defines.REFRACTION = false;
                }

                defines.TWOSIDEDLIGHTING = !this._backFaceCulling && this._twoSidedLighting;
            } else {
                defines.DIFFUSE = false;
                defines.AMBIENT = false;
                defines.OPACITY = false;
                defines.REFLECTION = false;
                defines.EMISSIVE = false;
                defines.LIGHTMAP = false;
                defines.BUMP = false;
                defines.REFRACTION = false;
            }

            defines.ALPHAFROMDIFFUSE = this._shouldUseAlphaFromDiffuseTexture();

            defines.EMISSIVEASILLUMINATION = this._useEmissiveAsIllumination;

            defines.LINKEMISSIVEWITHDIFFUSE = this._linkEmissiveWithDiffuse;

            defines.SPECULAROVERALPHA = this._useSpecularOverAlpha;

            defines.PREMULTIPLYALPHA = this.alphaMode === Constants.ALPHA_PREMULTIPLIED || this.alphaMode === Constants.ALPHA_PREMULTIPLIED_PORTERDUFF;

            defines.ALPHATEST_AFTERALLALPHACOMPUTATIONS = this.transparencyMode !== null;

            defines.ALPHABLEND = this.transparencyMode === null || this.needAlphaBlendingForMesh(mesh); // check on null for backward compatibility
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

            this._imageProcessingConfiguration.prepareDefines(defines);

            defines.IS_REFLECTION_LINEAR = this.reflectionTexture != null && !this.reflectionTexture.gammaSpace;
            defines.IS_REFRACTION_LINEAR = this.refractionTexture != null && !this.refractionTexture.gammaSpace;
        }

        if (defines._areFresnelDirty) {
            if (StandardMaterial.FresnelEnabled) {
                // Fresnel
                if (
                    this._diffuseFresnelParameters ||
                    this._opacityFresnelParameters ||
                    this._emissiveFresnelParameters ||
                    this._refractionFresnelParameters ||
                    this._reflectionFresnelParameters
                ) {
                    defines.DIFFUSEFRESNEL = this._diffuseFresnelParameters && this._diffuseFresnelParameters.isEnabled;

                    defines.OPACITYFRESNEL = this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled;

                    defines.REFLECTIONFRESNEL = this._reflectionFresnelParameters && this._reflectionFresnelParameters.isEnabled;

                    defines.REFLECTIONFRESNELFROMSPECULAR = this._useReflectionFresnelFromSpecular;

                    defines.REFRACTIONFRESNEL = this._refractionFresnelParameters && this._refractionFresnelParameters.isEnabled;

                    defines.EMISSIVEFRESNEL = this._emissiveFresnelParameters && this._emissiveFresnelParameters.isEnabled;

                    defines._needNormals = true;
                    defines.FRESNEL = true;
                }
            } else {
                defines.FRESNEL = false;
            }
        }

        // Misc.
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

        // Values that need to be evaluated on every frame
        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances, null, subMesh.getRenderingMesh().hasThinInstances);

        // External config
        this._eventInfo.defines = defines;
        this._eventInfo.mesh = mesh;
        this._callbackPluginEventPrepareDefinesBeforeAttributes(this._eventInfo);

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true, true);

        // External config
        this._callbackPluginEventPrepareDefines(this._eventInfo);

        // Get correct effect
        let forceWasNotReadyPreviously = false;

        if (defines.isDirty) {
            const lightDisposed = defines._areLightsDisposed;
            defines.markAsProcessed();

            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.REFLECTION) {
                fallbacks.addFallback(0, "REFLECTION");
            }

            if (defines.SPECULAR) {
                fallbacks.addFallback(0, "SPECULAR");
            }

            if (defines.BUMP) {
                fallbacks.addFallback(0, "BUMP");
            }

            if (defines.PARALLAX) {
                fallbacks.addFallback(1, "PARALLAX");
            }

            if (defines.PARALLAX_RHS) {
                fallbacks.addFallback(1, "PARALLAX_RHS");
            }

            if (defines.PARALLAXOCCLUSION) {
                fallbacks.addFallback(0, "PARALLAXOCCLUSION");
            }

            if (defines.SPECULAROVERALPHA) {
                fallbacks.addFallback(0, "SPECULAROVERALPHA");
            }

            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }

            if (defines.POINTSIZE) {
                fallbacks.addFallback(0, "POINTSIZE");
            }

            if (defines.LOGARITHMICDEPTH) {
                fallbacks.addFallback(0, "LOGARITHMICDEPTH");
            }

            MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this._maxSimultaneousLights);

            if (defines.SPECULARTERM) {
                fallbacks.addFallback(0, "SPECULARTERM");
            }

            if (defines.DIFFUSEFRESNEL) {
                fallbacks.addFallback(1, "DIFFUSEFRESNEL");
            }

            if (defines.OPACITYFRESNEL) {
                fallbacks.addFallback(2, "OPACITYFRESNEL");
            }

            if (defines.REFLECTIONFRESNEL) {
                fallbacks.addFallback(3, "REFLECTIONFRESNEL");
            }

            if (defines.EMISSIVEFRESNEL) {
                fallbacks.addFallback(4, "EMISSIVEFRESNEL");
            }

            if (defines.FRESNEL) {
                fallbacks.addFallback(4, "FRESNEL");
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

            let shaderName = "default";

            const uniforms = [
                "world",
                "view",
                "viewProjection",
                "vEyePosition",
                "vLightsType",
                "vAmbientColor",
                "vDiffuseColor",
                "vSpecularColor",
                "vEmissiveColor",
                "visibility",
                "vFogInfos",
                "vFogColor",
                "pointSize",
                "vDiffuseInfos",
                "vAmbientInfos",
                "vOpacityInfos",
                "vReflectionInfos",
                "vEmissiveInfos",
                "vSpecularInfos",
                "vBumpInfos",
                "vLightmapInfos",
                "vRefractionInfos",
                "mBones",
                "diffuseMatrix",
                "ambientMatrix",
                "opacityMatrix",
                "reflectionMatrix",
                "emissiveMatrix",
                "specularMatrix",
                "bumpMatrix",
                "normalMatrix",
                "lightmapMatrix",
                "refractionMatrix",
                "diffuseLeftColor",
                "diffuseRightColor",
                "opacityParts",
                "reflectionLeftColor",
                "reflectionRightColor",
                "emissiveLeftColor",
                "emissiveRightColor",
                "refractionLeftColor",
                "refractionRightColor",
                "vReflectionPosition",
                "vReflectionSize",
                "vRefractionPosition",
                "vRefractionSize",
                "logarithmicDepthConstant",
                "vTangentSpaceParams",
                "alphaCutOff",
                "boneTextureWidth",
                "morphTargetTextureInfo",
                "morphTargetTextureIndices",
            ];

            const samplers = [
                "diffuseSampler",
                "ambientSampler",
                "opacitySampler",
                "reflectionCubeSampler",
                "reflection2DSampler",
                "emissiveSampler",
                "specularSampler",
                "bumpSampler",
                "lightmapSampler",
                "refractionCubeSampler",
                "refraction2DSampler",
                "boneSampler",
                "morphTargets",
                "oitDepthSampler",
                "oitFrontColorSampler",
            ];

            const uniformBuffers = ["Material", "Scene", "Mesh"];

            const indexParameters = { maxSimultaneousLights: this._maxSimultaneousLights, maxSimultaneousMorphTargets: defines.NUM_MORPH_INFLUENCERS };

            this._eventInfo.fallbacks = fallbacks;
            this._eventInfo.fallbackRank = 0;
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

            addClipPlaneUniforms(uniforms);

            const csnrOptions: ICustomShaderNameResolveOptions = {};

            if (this.customShaderNameResolve) {
                shaderName = this.customShaderNameResolve(shaderName, uniforms, uniformBuffers, samplers, defines, attribs, csnrOptions);
            }

            const join = defines.toString();

            const previousEffect = subMesh.effect;
            let effect = scene.getEngine().createEffect(
                shaderName,
                <IEffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
                    onError: this.onError,
                    indexParameters,
                    processFinalCode: csnrOptions.processFinalCode,
                    processCodeAfterIncludes: this._eventInfo.customCode,
                    multiTarget: defines.PREPASS,
                },
                engine
            );

            this._eventInfo.customCode = undefined;

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
        }

        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = forceWasNotReadyPreviously ? false : true;
        drawWrapper._wasPreviouslyUsingInstances = useInstances;

        this._checkScenePerformancePriority();

        return true;
    }

    /**
     * Builds the material UBO layouts.
     * Used internally during the effect preparation.
     */
    public buildUniformLayout(): void {
        // Order is important !
        const ubo = this._uniformBuffer;
        ubo.addUniform("diffuseLeftColor", 4);
        ubo.addUniform("diffuseRightColor", 4);
        ubo.addUniform("opacityParts", 4);
        ubo.addUniform("reflectionLeftColor", 4);
        ubo.addUniform("reflectionRightColor", 4);
        ubo.addUniform("refractionLeftColor", 4);
        ubo.addUniform("refractionRightColor", 4);
        ubo.addUniform("emissiveLeftColor", 4);
        ubo.addUniform("emissiveRightColor", 4);

        ubo.addUniform("vDiffuseInfos", 2);
        ubo.addUniform("vAmbientInfos", 2);
        ubo.addUniform("vOpacityInfos", 2);
        ubo.addUniform("vReflectionInfos", 2);
        ubo.addUniform("vReflectionPosition", 3);
        ubo.addUniform("vReflectionSize", 3);
        ubo.addUniform("vEmissiveInfos", 2);
        ubo.addUniform("vLightmapInfos", 2);
        ubo.addUniform("vSpecularInfos", 2);
        ubo.addUniform("vBumpInfos", 3);

        ubo.addUniform("diffuseMatrix", 16);
        ubo.addUniform("ambientMatrix", 16);
        ubo.addUniform("opacityMatrix", 16);
        ubo.addUniform("reflectionMatrix", 16);
        ubo.addUniform("emissiveMatrix", 16);
        ubo.addUniform("lightmapMatrix", 16);
        ubo.addUniform("specularMatrix", 16);
        ubo.addUniform("bumpMatrix", 16);
        ubo.addUniform("vTangentSpaceParams", 2);
        ubo.addUniform("pointSize", 1);
        ubo.addUniform("alphaCutOff", 1);
        ubo.addUniform("refractionMatrix", 16);
        ubo.addUniform("vRefractionInfos", 4);
        ubo.addUniform("vRefractionPosition", 3);
        ubo.addUniform("vRefractionSize", 3);
        ubo.addUniform("vSpecularColor", 4);
        ubo.addUniform("vEmissiveColor", 3);
        ubo.addUniform("vDiffuseColor", 4);
        ubo.addUniform("vAmbientColor", 3);

        super.buildUniformLayout();
    }

    /**
     * Binds the submesh to this material by preparing the effect and shader to draw
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh containing the submesh
     * @param subMesh defines the submesh to bind the material to
     */
    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        const scene = this.getScene();

        const defines = <StandardMaterialDefines>subMesh.materialDefines;
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
        MaterialHelper.BindBonesParameters(mesh, effect);
        const ubo = this._uniformBuffer;
        if (mustRebind) {
            this.bindViewProjection(effect);
            if (!ubo.useUbo || !this.isFrozen || !ubo.isSync || subMesh._drawWrapper._forceRebindOnNextCall) {
                if (StandardMaterial.FresnelEnabled && defines.FRESNEL) {
                    // Fresnel
                    if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled) {
                        ubo.updateColor4("diffuseLeftColor", this.diffuseFresnelParameters.leftColor, this.diffuseFresnelParameters.power);
                        ubo.updateColor4("diffuseRightColor", this.diffuseFresnelParameters.rightColor, this.diffuseFresnelParameters.bias);
                    }

                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        ubo.updateColor4(
                            "opacityParts",
                            new Color3(
                                this.opacityFresnelParameters.leftColor.toLuminance(),
                                this.opacityFresnelParameters.rightColor.toLuminance(),
                                this.opacityFresnelParameters.bias
                            ),
                            this.opacityFresnelParameters.power
                        );
                    }

                    if (this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
                        ubo.updateColor4("reflectionLeftColor", this.reflectionFresnelParameters.leftColor, this.reflectionFresnelParameters.power);
                        ubo.updateColor4("reflectionRightColor", this.reflectionFresnelParameters.rightColor, this.reflectionFresnelParameters.bias);
                    }

                    if (this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled) {
                        ubo.updateColor4("refractionLeftColor", this.refractionFresnelParameters.leftColor, this.refractionFresnelParameters.power);
                        ubo.updateColor4("refractionRightColor", this.refractionFresnelParameters.rightColor, this.refractionFresnelParameters.bias);
                    }

                    if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                        ubo.updateColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                        ubo.updateColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                    }
                }

                // Textures
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                        ubo.updateFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                        MaterialHelper.BindTextureMatrix(this._diffuseTexture, ubo, "diffuse");
                    }

                    if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                        ubo.updateFloat2("vAmbientInfos", this._ambientTexture.coordinatesIndex, this._ambientTexture.level);
                        MaterialHelper.BindTextureMatrix(this._ambientTexture, ubo, "ambient");
                    }

                    if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                        ubo.updateFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                        MaterialHelper.BindTextureMatrix(this._opacityTexture, ubo, "opacity");
                    }

                    if (this._hasAlphaChannel()) {
                        ubo.updateFloat("alphaCutOff", this.alphaCutOff);
                    }

                    if (this._reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                        ubo.updateFloat2("vReflectionInfos", this._reflectionTexture.level, this.roughness);
                        ubo.updateMatrix("reflectionMatrix", this._reflectionTexture.getReflectionTextureMatrix());

                        if ((<any>this._reflectionTexture).boundingBoxSize) {
                            const cubeTexture = <CubeTexture>this._reflectionTexture;

                            ubo.updateVector3("vReflectionPosition", cubeTexture.boundingBoxPosition);
                            ubo.updateVector3("vReflectionSize", cubeTexture.boundingBoxSize);
                        }
                    }

                    if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                        ubo.updateFloat2("vEmissiveInfos", this._emissiveTexture.coordinatesIndex, this._emissiveTexture.level);
                        MaterialHelper.BindTextureMatrix(this._emissiveTexture, ubo, "emissive");
                    }

                    if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                        ubo.updateFloat2("vLightmapInfos", this._lightmapTexture.coordinatesIndex, this._lightmapTexture.level);
                        MaterialHelper.BindTextureMatrix(this._lightmapTexture, ubo, "lightmap");
                    }

                    if (this._specularTexture && StandardMaterial.SpecularTextureEnabled) {
                        ubo.updateFloat2("vSpecularInfos", this._specularTexture.coordinatesIndex, this._specularTexture.level);
                        MaterialHelper.BindTextureMatrix(this._specularTexture, ubo, "specular");
                    }

                    if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled) {
                        ubo.updateFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, 1.0 / this._bumpTexture.level, this.parallaxScaleBias);
                        MaterialHelper.BindTextureMatrix(this._bumpTexture, ubo, "bump");

                        if (scene._mirroredCameraPosition) {
                            ubo.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? 1.0 : -1.0, this._invertNormalMapY ? 1.0 : -1.0);
                        } else {
                            ubo.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? -1.0 : 1.0, this._invertNormalMapY ? -1.0 : 1.0);
                        }
                    }

                    if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        let depth = 1.0;
                        if (!this._refractionTexture.isCube) {
                            ubo.updateMatrix("refractionMatrix", this._refractionTexture.getReflectionTextureMatrix());

                            if ((<any>this._refractionTexture).depth) {
                                depth = (<any>this._refractionTexture).depth;
                            }
                        }
                        ubo.updateFloat4("vRefractionInfos", this._refractionTexture.level, this.indexOfRefraction, depth, this.invertRefractionY ? -1 : 1);

                        if ((<any>this._refractionTexture).boundingBoxSize) {
                            const cubeTexture = <CubeTexture>this._refractionTexture;

                            ubo.updateVector3("vRefractionPosition", cubeTexture.boundingBoxPosition);
                            ubo.updateVector3("vRefractionSize", cubeTexture.boundingBoxSize);
                        }
                    }
                }

                // Point size
                if (this.pointsCloud) {
                    ubo.updateFloat("pointSize", this.pointSize);
                }

                if (defines.SPECULARTERM) {
                    ubo.updateColor4("vSpecularColor", this.specularColor, this.specularPower);
                }

                ubo.updateColor3("vEmissiveColor", StandardMaterial.EmissiveTextureEnabled ? this.emissiveColor : Color3.BlackReadOnly);
                ubo.updateColor4("vDiffuseColor", this.diffuseColor, this.alpha);

                scene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);
                ubo.updateColor3("vAmbientColor", this._globalAmbientColor);
            }

            // Textures
            if (scene.texturesEnabled) {
                if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    effect.setTexture("diffuseSampler", this._diffuseTexture);
                }

                if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                    effect.setTexture("ambientSampler", this._ambientTexture);
                }

                if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                    effect.setTexture("opacitySampler", this._opacityTexture);
                }

                if (this._reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                    if (this._reflectionTexture.isCube) {
                        effect.setTexture("reflectionCubeSampler", this._reflectionTexture);
                    } else {
                        effect.setTexture("reflection2DSampler", this._reflectionTexture);
                    }
                }

                if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                    effect.setTexture("emissiveSampler", this._emissiveTexture);
                }

                if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                    effect.setTexture("lightmapSampler", this._lightmapTexture);
                }

                if (this._specularTexture && StandardMaterial.SpecularTextureEnabled) {
                    effect.setTexture("specularSampler", this._specularTexture);
                }

                if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled) {
                    effect.setTexture("bumpSampler", this._bumpTexture);
                }

                if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                    if (this._refractionTexture.isCube) {
                        effect.setTexture("refractionCubeSampler", this._refractionTexture);
                    } else {
                        effect.setTexture("refraction2DSampler", this._refractionTexture);
                    }
                }
            }

            // OIT with depth peeling
            if (this.getScene().useOrderIndependentTransparency && this.needAlphaBlendingForMesh(mesh)) {
                this.getScene().depthPeelingRenderer!.bind(effect);
            }

            this._eventInfo.subMesh = subMesh;
            this._callbackPluginEventBindForSubMesh(this._eventInfo);

            // Clip plane
            bindClipPlane(effect, this, scene);

            // Colors
            this.bindEyePosition(effect);
        } else if (scene.getEngine()._features.needToAlwaysBindUniformBuffers) {
            this._needToBindSceneUbo = true;
        }

        if (mustRebind || !this.isFrozen) {
            // Lights
            if (scene.lightsEnabled && !this._disableLighting) {
                MaterialHelper.BindLights(scene, mesh, effect, defines, this._maxSimultaneousLights);
            }

            // View
            if (
                (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) ||
                this._reflectionTexture ||
                this._refractionTexture ||
                mesh.receiveShadows ||
                defines.PREPASS
            ) {
                this.bindView(effect);
            }

            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, effect);

            // Morph targets
            if (defines.NUM_MORPH_INFLUENCERS) {
                MaterialHelper.BindMorphTargetParameters(mesh, effect);
            }

            if (defines.BAKED_VERTEX_ANIMATION_TEXTURE) {
                mesh.bakedVertexAnimationManager?.bind(effect, defines.INSTANCES);
            }

            // Log. depth
            if (this.useLogarithmicDepth) {
                MaterialHelper.BindLogDepth(defines, effect, scene);
            }

            // image processing
            if (this._imageProcessingConfiguration && !this._imageProcessingConfiguration.applyByPostProcess) {
                this._imageProcessingConfiguration.bind(this._activeEffect);
            }
        }

        this._afterBind(mesh, this._activeEffect, subMesh);
        ubo.update();
    }

    /**
     * Get the list of animatables in the material.
     * @returns the list of animatables object used in the material
     */
    public getAnimatables(): IAnimatable[] {
        const results = super.getAnimatables();

        if (this._diffuseTexture && this._diffuseTexture.animations && this._diffuseTexture.animations.length > 0) {
            results.push(this._diffuseTexture);
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

        if (this._specularTexture && this._specularTexture.animations && this._specularTexture.animations.length > 0) {
            results.push(this._specularTexture);
        }

        if (this._bumpTexture && this._bumpTexture.animations && this._bumpTexture.animations.length > 0) {
            results.push(this._bumpTexture);
        }

        if (this._lightmapTexture && this._lightmapTexture.animations && this._lightmapTexture.animations.length > 0) {
            results.push(this._lightmapTexture);
        }

        if (this._refractionTexture && this._refractionTexture.animations && this._refractionTexture.animations.length > 0) {
            results.push(this._refractionTexture);
        }

        return results;
    }

    /**
     * Gets the active textures from the material
     * @returns an array of textures
     */
    public getActiveTextures(): BaseTexture[] {
        const activeTextures = super.getActiveTextures();

        if (this._diffuseTexture) {
            activeTextures.push(this._diffuseTexture);
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

        if (this._specularTexture) {
            activeTextures.push(this._specularTexture);
        }

        if (this._bumpTexture) {
            activeTextures.push(this._bumpTexture);
        }

        if (this._lightmapTexture) {
            activeTextures.push(this._lightmapTexture);
        }

        if (this._refractionTexture) {
            activeTextures.push(this._refractionTexture);
        }

        return activeTextures;
    }

    /**
     * Specifies if the material uses a texture
     * @param texture defines the texture to check against the material
     * @returns a boolean specifying if the material uses the texture
     */
    public hasTexture(texture: BaseTexture): boolean {
        if (super.hasTexture(texture)) {
            return true;
        }

        if (this._diffuseTexture === texture) {
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

        if (this._specularTexture === texture) {
            return true;
        }

        if (this._bumpTexture === texture) {
            return true;
        }

        if (this._lightmapTexture === texture) {
            return true;
        }

        if (this._refractionTexture === texture) {
            return true;
        }

        return false;
    }

    /**
     * Disposes the material
     * @param forceDisposeEffect specifies if effects should be forcefully disposed
     * @param forceDisposeTextures specifies if textures should be forcefully disposed
     */
    public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            this._diffuseTexture?.dispose();
            this._ambientTexture?.dispose();
            this._opacityTexture?.dispose();
            this._reflectionTexture?.dispose();
            this._emissiveTexture?.dispose();
            this._specularTexture?.dispose();
            this._bumpTexture?.dispose();
            this._lightmapTexture?.dispose();
            this._refractionTexture?.dispose();
        }

        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }

        super.dispose(forceDisposeEffect, forceDisposeTextures);
    }

    /**
     * Makes a duplicate of the material, and gives it a new name
     * @param name defines the new name for the duplicated material
     * @param cloneTexturesOnlyOnce - if a texture is used in more than one channel (e.g diffuse and opacity), only clone it once and reuse it on the other channels. Default false.
     * @param rootUrl defines the root URL to use to load textures
     * @returns the cloned material
     */
    public clone(name: string, cloneTexturesOnlyOnce: boolean = true, rootUrl = ""): StandardMaterial {
        const result = SerializationHelper.Clone(() => new StandardMaterial(name, this.getScene()), this, { cloneTexturesOnlyOnce });

        result.name = name;
        result.id = name;

        this.stencil.copyTo(result.stencil);

        this._clonePlugins(result, rootUrl);

        return result;
    }

    /**
     * Creates a standard material from parsed material data
     * @param source defines the JSON representation of the material
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a new standard material
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): StandardMaterial {
        const material = SerializationHelper.Parse(() => new StandardMaterial(source.name, scene), source, scene, rootUrl);

        if (source.stencil) {
            material.stencil.parse(source.stencil, scene, rootUrl);
        }

        Material._ParsePlugins(source, material, scene, rootUrl);

        return material;
    }

    // Flags used to enable or disable a type of texture for all Standard Materials
    /**
     * Are diffuse textures enabled in the application.
     */
    public static get DiffuseTextureEnabled(): boolean {
        return MaterialFlags.DiffuseTextureEnabled;
    }
    public static set DiffuseTextureEnabled(value: boolean) {
        MaterialFlags.DiffuseTextureEnabled = value;
    }

    /**
     * Are detail textures enabled in the application.
     */
    public static get DetailTextureEnabled(): boolean {
        return MaterialFlags.DetailTextureEnabled;
    }
    public static set DetailTextureEnabled(value: boolean) {
        MaterialFlags.DetailTextureEnabled = value;
    }

    /**
     * Are ambient textures enabled in the application.
     */
    public static get AmbientTextureEnabled(): boolean {
        return MaterialFlags.AmbientTextureEnabled;
    }
    public static set AmbientTextureEnabled(value: boolean) {
        MaterialFlags.AmbientTextureEnabled = value;
    }

    /**
     * Are opacity textures enabled in the application.
     */
    public static get OpacityTextureEnabled(): boolean {
        return MaterialFlags.OpacityTextureEnabled;
    }
    public static set OpacityTextureEnabled(value: boolean) {
        MaterialFlags.OpacityTextureEnabled = value;
    }

    /**
     * Are reflection textures enabled in the application.
     */
    public static get ReflectionTextureEnabled(): boolean {
        return MaterialFlags.ReflectionTextureEnabled;
    }
    public static set ReflectionTextureEnabled(value: boolean) {
        MaterialFlags.ReflectionTextureEnabled = value;
    }

    /**
     * Are emissive textures enabled in the application.
     */
    public static get EmissiveTextureEnabled(): boolean {
        return MaterialFlags.EmissiveTextureEnabled;
    }
    public static set EmissiveTextureEnabled(value: boolean) {
        MaterialFlags.EmissiveTextureEnabled = value;
    }

    /**
     * Are specular textures enabled in the application.
     */
    public static get SpecularTextureEnabled(): boolean {
        return MaterialFlags.SpecularTextureEnabled;
    }
    public static set SpecularTextureEnabled(value: boolean) {
        MaterialFlags.SpecularTextureEnabled = value;
    }

    /**
     * Are bump textures enabled in the application.
     */
    public static get BumpTextureEnabled(): boolean {
        return MaterialFlags.BumpTextureEnabled;
    }
    public static set BumpTextureEnabled(value: boolean) {
        MaterialFlags.BumpTextureEnabled = value;
    }

    /**
     * Are lightmap textures enabled in the application.
     */
    public static get LightmapTextureEnabled(): boolean {
        return MaterialFlags.LightmapTextureEnabled;
    }
    public static set LightmapTextureEnabled(value: boolean) {
        MaterialFlags.LightmapTextureEnabled = value;
    }

    /**
     * Are refraction textures enabled in the application.
     */
    public static get RefractionTextureEnabled(): boolean {
        return MaterialFlags.RefractionTextureEnabled;
    }
    public static set RefractionTextureEnabled(value: boolean) {
        MaterialFlags.RefractionTextureEnabled = value;
    }

    /**
     * Are color grading textures enabled in the application.
     */
    public static get ColorGradingTextureEnabled(): boolean {
        return MaterialFlags.ColorGradingTextureEnabled;
    }
    public static set ColorGradingTextureEnabled(value: boolean) {
        MaterialFlags.ColorGradingTextureEnabled = value;
    }

    /**
     * Are fresnels enabled in the application.
     */
    public static get FresnelEnabled(): boolean {
        return MaterialFlags.FresnelEnabled;
    }
    public static set FresnelEnabled(value: boolean) {
        MaterialFlags.FresnelEnabled = value;
    }
}

RegisterClass("BABYLON.StandardMaterial", StandardMaterial);

Scene.DefaultMaterialFactory = (scene: Scene) => {
    return new StandardMaterial("default material", scene);
};
