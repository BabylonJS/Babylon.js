import { SerializationHelper, serialize, serializeAsColor3, expandToProperty, serializeAsTexture, serializeAsVector3, serializeAsImageProcessingConfiguration } from "../../Misc/decorators";
import { SmartArray } from "../../Misc/smartArray";
import { Observer } from "../../Misc/observable";
import { Logger } from "../../Misc/logger";
import { Nullable, int, float } from "../../types";
import { Scene } from "../../scene";
import { Matrix, Vector3, Vector4 } from "../../Maths/math.vector";
import { VertexBuffer } from "../../Meshes/buffer";
import { SubMesh } from "../../Meshes/subMesh";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";
import { Effect, IEffectCreationOptions } from "../../Materials/effect";
import { MaterialHelper } from "../../Materials/materialHelper";
import { MaterialDefines } from "../../Materials/materialDefines";
import { PushMaterial } from "../../Materials/pushMaterial";
import { ColorCurves } from "../../Materials/colorCurves";
import { ImageProcessingConfiguration, IImageProcessingConfigurationDefines } from "../../Materials/imageProcessingConfiguration";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Texture } from "../../Materials/Textures/texture";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { IShadowLight } from "../../Lights/shadowLight";
import { Constants } from "../../Engines/constants";
import { _TypeStore } from "../../Misc/typeStore";
import { MaterialFlags } from "../materialFlags";
import { Color3 } from '../../Maths/math.color';

import "../../Shaders/background.fragment";
import "../../Shaders/background.vertex";
import { EffectFallbacks } from '../effectFallbacks';

/**
 * Background material defines definition.
 * @hidden Mainly internal Use
 */
class BackgroundMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
    /**
     * True if the diffuse texture is in use.
     */
    public DIFFUSE = false;

    /**
     * The direct UV channel to use.
     */
    public DIFFUSEDIRECTUV = 0;

    /**
     * True if the diffuse texture is in gamma space.
     */
    public GAMMADIFFUSE = false;

    /**
     * True if the diffuse texture has opacity in the alpha channel.
     */
    public DIFFUSEHASALPHA = false;

    /**
     * True if you want the material to fade to transparent at grazing angle.
     */
    public OPACITYFRESNEL = false;

    /**
     * True if an extra blur needs to be added in the reflection.
     */
    public REFLECTIONBLUR = false;

    /**
     * True if you want the material to fade to reflection at grazing angle.
     */
    public REFLECTIONFRESNEL = false;

    /**
     * True if you want the material to falloff as far as you move away from the scene center.
     */
    public REFLECTIONFALLOFF = false;

    /**
     * False if the current Webgl implementation does not support the texture lod extension.
     */
    public TEXTURELODSUPPORT = false;

    /**
     * True to ensure the data are premultiplied.
     */
    public PREMULTIPLYALPHA = false;

    /**
     * True if the texture contains cooked RGB values and not gray scaled multipliers.
     */
    public USERGBCOLOR = false;

    /**
     * True if highlight and shadow levels have been specified. It can help ensuring the main perceived color
     * stays aligned with the desired configuration.
     */
    public USEHIGHLIGHTANDSHADOWCOLORS = false;

    /**
     * True to add noise in order to reduce the banding effect.
     */
    public NOISE = false;

    /**
     * is the reflection texture in BGR color scheme?
     * Mainly used to solve a bug in ios10 video tag
     */
    public REFLECTIONBGR = false;

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

    // Reflection.
    public REFLECTION = false;
    public REFLECTIONMAP_3D = false;
    public REFLECTIONMAP_SPHERICAL = false;
    public REFLECTIONMAP_PLANAR = false;
    public REFLECTIONMAP_CUBIC = false;
    public REFLECTIONMAP_PROJECTION = false;
    public REFLECTIONMAP_SKYBOX = false;
    public REFLECTIONMAP_EXPLICIT = false;
    public REFLECTIONMAP_EQUIRECTANGULAR = false;
    public REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
    public REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
    public INVERTCUBICMAP = false;
    public REFLECTIONMAP_OPPOSITEZ = false;
    public LODINREFLECTIONALPHA = false;
    public GAMMAREFLECTION = false;
    public RGBDREFLECTION = false;
    public EQUIRECTANGULAR_RELFECTION_FOV = false;

    // Default BJS.
    public MAINUV1 = false;
    public MAINUV2 = false;
    public UV1 = false;
    public UV2 = false;
    public CLIPPLANE = false;
    public CLIPPLANE2 = false;
    public CLIPPLANE3 = false;
    public CLIPPLANE4 = false;
    public CLIPPLANE5 = false;
    public CLIPPLANE6 = false;
    public POINTSIZE = false;
    public FOG = false;
    public NORMAL = false;
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public INSTANCES = false;
    public SHADOWFLOAT = false;

    /**
     * Constructor of the defines.
     */
    constructor() {
        super();
        this.rebuild();
    }
}

/**
 * Background material used to create an efficient environement around your scene.
 */
export class BackgroundMaterial extends PushMaterial {

    /**
     * Standard reflectance value at parallel view angle.
     */
    public static StandardReflectance0 = 0.05;

    /**
     * Standard reflectance value at grazing angle.
     */
    public static StandardReflectance90 = 0.5;

    @serializeAsColor3()
    protected _primaryColor: Color3;
    /**
     * Key light Color (multiply against the environement texture)
     */
    @expandToProperty("_markAllSubMeshesAsLightsDirty")
    public primaryColor = Color3.White();

    @serializeAsColor3()
    protected __perceptualColor: Nullable<Color3>;
    /**
     * Experimental Internal Use Only.
     *
     * Key light Color in "perceptual value" meaning the color you would like to see on screen.
     * This acts as a helper to set the primary color to a more "human friendly" value.
     * Conversion to linear space as well as exposure and tone mapping correction will be applied to keep the
     * output color as close as possible from the chosen value.
     * (This does not account for contrast color grading and color curves as they are considered post effect and not directly
     * part of lighting setup.)
     */
    public get _perceptualColor(): Nullable<Color3> {
        return this.__perceptualColor;
    }
    public set _perceptualColor(value: Nullable<Color3>) {
        this.__perceptualColor = value;
        this._computePrimaryColorFromPerceptualColor();
        this._markAllSubMeshesAsLightsDirty();
    }

    @serialize()
    protected _primaryColorShadowLevel: float = 0;
    /**
     * Defines the level of the shadows (dark area of the reflection map) in order to help scaling the colors.
     * The color opposite to the primary color is used at the level chosen to define what the black area would look.
     */
    public get primaryColorShadowLevel(): float {
        return this._primaryColorShadowLevel;
    }
    public set primaryColorShadowLevel(value: float) {
        this._primaryColorShadowLevel = value;
        this._computePrimaryColors();
        this._markAllSubMeshesAsLightsDirty();
    }

    @serialize()
    protected _primaryColorHighlightLevel: float = 0;
    /**
     * Defines the level of the highliights (highlight area of the reflection map) in order to help scaling the colors.
     * The primary color is used at the level chosen to define what the white area would look.
     */
    @expandToProperty("_markAllSubMeshesAsLightsDirty")
    public get primaryColorHighlightLevel(): float {
        return this._primaryColorHighlightLevel;
    }
    public set primaryColorHighlightLevel(value: float) {
        this._primaryColorHighlightLevel = value;
        this._computePrimaryColors();
        this._markAllSubMeshesAsLightsDirty();
    }

    @serializeAsTexture()
    protected _reflectionTexture: Nullable<BaseTexture>;
    /**
     * Reflection Texture used in the material.
     * Should be author in a specific way for the best result (refer to the documentation).
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectionTexture: Nullable<BaseTexture> = null;

    @serialize()
    protected _reflectionBlur: float;
    /**
     * Reflection Texture level of blur.
     *
     * Can be use to reuse an existing HDR Texture and target a specific LOD to prevent authoring the
     * texture twice.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectionBlur: float = 0;

    @serializeAsTexture()
    protected _diffuseTexture: Nullable<BaseTexture>;
    /**
     * Diffuse Texture used in the material.
     * Should be author in a specific way for the best result (refer to the documentation).
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTexture: Nullable<BaseTexture> = null;

    protected _shadowLights: Nullable<IShadowLight[]> = null;
    /**
     * Specify the list of lights casting shadow on the material.
     * All scene shadow lights will be included if null.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public shadowLights: Nullable<IShadowLight[]> = null;

    @serialize()
    protected _shadowLevel: float;
    /**
     * Helps adjusting the shadow to a softer level if required.
     * 0 means black shadows and 1 means no shadows.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public shadowLevel: float = 0;

    @serializeAsVector3()
    protected _sceneCenter: Vector3;
    /**
     * In case of opacity Fresnel or reflection falloff, this is use as a scene center.
     * It is usually zero but might be interesting to modify according to your setup.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public sceneCenter: Vector3 = Vector3.Zero();

    @serialize()
    protected _opacityFresnel: boolean;
    /**
     * This helps specifying that the material is falling off to the sky box at grazing angle.
     * This helps ensuring a nice transition when the camera goes under the ground.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public opacityFresnel: boolean = true;

    @serialize()
    protected _reflectionFresnel: boolean;
    /**
     * This helps specifying that the material is falling off from diffuse to the reflection texture at grazing angle.
     * This helps adding a mirror texture on the ground.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectionFresnel: boolean = false;

    @serialize()
    protected _reflectionFalloffDistance: number;
    /**
     * This helps specifying the falloff radius off the reflection texture from the sceneCenter.
     * This helps adding a nice falloff effect to the reflection if used as a mirror for instance.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectionFalloffDistance: number = 0.0;

    @serialize()
    protected _reflectionAmount: number;
    /**
     * This specifies the weight of the reflection against the background in case of reflection Fresnel.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectionAmount: number = 1.0;

    @serialize()
    protected _reflectionReflectance0: number;
    /**
     * This specifies the weight of the reflection at grazing angle.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectionReflectance0: number = 0.05;

    @serialize()
    protected _reflectionReflectance90: number;
    /**
     * This specifies the weight of the reflection at a perpendicular point of view.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectionReflectance90: number = 0.5;

    /**
     * Sets the reflection reflectance fresnel values according to the default standard
     * empirically know to work well :-)
     */
    public set reflectionStandardFresnelWeight(value: number) {
        let reflectionWeight = value;

        if (reflectionWeight < 0.5) {
            reflectionWeight = reflectionWeight * 2.0;
            this.reflectionReflectance0 = BackgroundMaterial.StandardReflectance0 * reflectionWeight;
            this.reflectionReflectance90 = BackgroundMaterial.StandardReflectance90 * reflectionWeight;
        } else {
            reflectionWeight = reflectionWeight * 2.0 - 1.0;
            this.reflectionReflectance0 = BackgroundMaterial.StandardReflectance0 + (1.0 - BackgroundMaterial.StandardReflectance0) * reflectionWeight;
            this.reflectionReflectance90 = BackgroundMaterial.StandardReflectance90 + (1.0 - BackgroundMaterial.StandardReflectance90) * reflectionWeight;
        }
    }

    @serialize()
    protected _useRGBColor: boolean;
    /**
     * Helps to directly use the maps channels instead of their level.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public useRGBColor: boolean = true;

    @serialize()
    protected _enableNoise: boolean;
    /**
     * This helps reducing the banding effect that could occur on the background.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public enableNoise: boolean = false;

    /**
     * The current fov(field of view) multiplier, 0.0 - 2.0. Defaults to 1.0. Lower values "zoom in" and higher values "zoom out".
     * Best used when trying to implement visual zoom effects like fish-eye or binoculars while not adjusting camera fov.
     * Recommended to be keep at 1.0 except for special cases.
     */
    public get fovMultiplier(): number {
        return this._fovMultiplier;
    }
    public set fovMultiplier(value: number) {
        if (isNaN(value)) {
            value = 1.0;
        }
        this._fovMultiplier = Math.max(0.0, Math.min(2.0, value));
    }
    private _fovMultiplier: float = 1.0;

    /**
     * Enable the FOV adjustment feature controlled by fovMultiplier.
     */
    public useEquirectangularFOV: boolean = false;

    @serialize()
    private _maxSimultaneousLights: int = 4;
    /**
     * Number of Simultaneous lights allowed on the material.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public maxSimultaneousLights: int = 4;

    /**
     * Default configuration related to image processing available in the Background Material.
     */
    @serializeAsImageProcessingConfiguration()
    protected _imageProcessingConfiguration: ImageProcessingConfiguration;

    /**
     * Keep track of the image processing observer to allow dispose and replace.
     */
    private _imageProcessingObserver: Nullable<Observer<ImageProcessingConfiguration>> = null;

    /**
     * Attaches a new image processing configuration to the PBR Material.
     * @param configuration (if null the scene configuration will be use)
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
                this._computePrimaryColorFromPerceptualColor();
                this._markAllSubMeshesAsImageProcessingDirty();
            });
        }
    }

    /**
     * Gets the image processing configuration used either in this material.
     */
    public get imageProcessingConfiguration(): Nullable<ImageProcessingConfiguration> {
        return this._imageProcessingConfiguration;
    }

    /**
     * Sets the Default image processing configuration used either in the this material.
     *
     * If sets to null, the scene one is in use.
     */
    public set imageProcessingConfiguration(value: Nullable<ImageProcessingConfiguration>) {
        this._attachImageProcessingConfiguration(value);

        // Ensure the effect will be rebuilt.
        this._markAllSubMeshesAsTexturesDirty();
    }

    /**
     * Gets wether the color curves effect is enabled.
     */
    public get cameraColorCurvesEnabled(): boolean {
        return (<ImageProcessingConfiguration>this.imageProcessingConfiguration).colorCurvesEnabled;
    }
    /**
     * Sets wether the color curves effect is enabled.
     */
    public set cameraColorCurvesEnabled(value: boolean) {
        (<ImageProcessingConfiguration>this.imageProcessingConfiguration).colorCurvesEnabled = value;
    }

    /**
     * Gets wether the color grading effect is enabled.
     */
    public get cameraColorGradingEnabled(): boolean {
        return (<ImageProcessingConfiguration>this.imageProcessingConfiguration).colorGradingEnabled;
    }
    /**
     * Gets wether the color grading effect is enabled.
     */
    public set cameraColorGradingEnabled(value: boolean) {
        (<ImageProcessingConfiguration>this.imageProcessingConfiguration).colorGradingEnabled = value;
    }

    /**
     * Gets wether tonemapping is enabled or not.
     */
    public get cameraToneMappingEnabled(): boolean {
        return this._imageProcessingConfiguration.toneMappingEnabled;
    }
    /**
     * Sets wether tonemapping is enabled or not
     */
    public set cameraToneMappingEnabled(value: boolean) {
        this._imageProcessingConfiguration.toneMappingEnabled = value;
    }

    /**
     * The camera exposure used on this material.
     * This property is here and not in the camera to allow controlling exposure without full screen post process.
     * This corresponds to a photographic exposure.
     */
    public get cameraExposure(): float {
        return this._imageProcessingConfiguration.exposure;
    }
    /**
     * The camera exposure used on this material.
     * This property is here and not in the camera to allow controlling exposure without full screen post process.
     * This corresponds to a photographic exposure.
     */
    public set cameraExposure(value: float) {
        this._imageProcessingConfiguration.exposure = value;
    }

    /**
     * Gets The camera contrast used on this material.
     */
    public get cameraContrast(): float {
        return this._imageProcessingConfiguration.contrast;
    }

    /**
     * Sets The camera contrast used on this material.
     */
    public set cameraContrast(value: float) {
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
        (<ImageProcessingConfiguration>this.imageProcessingConfiguration).colorGradingTexture = value;
    }

    /**
     * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
     * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
     * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
     * corresponding to low luminance, medium luminance, and high luminance areas respectively.
     */
    public get cameraColorCurves(): Nullable<ColorCurves> {
        return (<ImageProcessingConfiguration>this.imageProcessingConfiguration).colorCurves;
    }
    /**
     * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
     * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
     * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
     * corresponding to low luminance, medium luminance, and high luminance areas respectively.
     */
    public set cameraColorCurves(value: Nullable<ColorCurves>) {
        (<ImageProcessingConfiguration>this.imageProcessingConfiguration).colorCurves = value;
    }

    /**
     * Due to a bug in iOS10, video tags (which are using the background material) are in BGR and not RGB.
     * Setting this flag to true (not done automatically!) will convert it back to RGB.
     */
    public switchToBGR: boolean = false;

    // Temp values kept as cache in the material.
    private _renderTargets = new SmartArray<RenderTargetTexture>(16);
    private _reflectionControls = Vector4.Zero();
    private _white = Color3.White();
    private _primaryShadowColor = Color3.Black();
    private _primaryHighlightColor = Color3.Black();

    /**
     * Instantiates a Background Material in the given scene
     * @param name The friendly name of the material
     * @param scene The scene to add the material to
     */
    constructor(name: string, scene: Scene) {
        super(name, scene);

        // Setup the default processing configuration to the scene.
        this._attachImageProcessingConfiguration(null);

        this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
            this._renderTargets.reset();

            if (this._diffuseTexture && this._diffuseTexture.isRenderTarget) {
                this._renderTargets.push(this._diffuseTexture as RenderTargetTexture);
            }

            if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                this._renderTargets.push(this._reflectionTexture as RenderTargetTexture);
            }

            return this._renderTargets;
        };
    }

    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    public get hasRenderTargetTextures(): boolean {
        if (this._diffuseTexture && this._diffuseTexture.isRenderTarget) {
            return true;
        }

        if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
            return true;
        }

        return false;
    }

    /**
     * The entire material has been created in order to prevent overdraw.
     * @returns false
     */
    public needAlphaTesting(): boolean {
        return true;
    }

    /**
     * The entire material has been created in order to prevent overdraw.
     * @returns true if blending is enable
     */
    public needAlphaBlending(): boolean {
        return ((this.alpha < 0) || (this._diffuseTexture != null && this._diffuseTexture.hasAlpha));
    }

    /**
     * Checks wether the material is ready to be rendered for a given mesh.
     * @param mesh The mesh to render
     * @param subMesh The submesh to check against
     * @param useInstances Specify wether or not the material is used with instances
     * @returns true if all the dependencies are ready (Textures, Effects...)
     */
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances: boolean = false): boolean {
        if (subMesh.effect && this.isFrozen) {
            if (subMesh.effect._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh._materialDefines) {
            subMesh._materialDefines = new BackgroundMaterialDefines();
        }

        var scene = this.getScene();
        var defines = <BackgroundMaterialDefines>subMesh._materialDefines;

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        var engine = scene.getEngine();

        // Lights
        MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights);
        defines._needNormals = true;

        // Multiview
        MaterialHelper.PrepareDefinesForMultiview(scene, defines);

        // Textures
        if (defines._areTexturesDirty) {
            defines._needUVs = false;
            if (scene.texturesEnabled) {
                if (scene.getEngine().getCaps().textureLOD) {
                    defines.TEXTURELODSUPPORT = true;
                }

                if (this._diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                    if (!this._diffuseTexture.isReadyOrNotBlocking()) {
                        return false;
                    }

                    MaterialHelper.PrepareDefinesForMergedUV(this._diffuseTexture, defines, "DIFFUSE");
                    defines.DIFFUSEHASALPHA = this._diffuseTexture.hasAlpha;
                    defines.GAMMADIFFUSE = this._diffuseTexture.gammaSpace;
                    defines.OPACITYFRESNEL = this._opacityFresnel;
                } else {
                    defines.DIFFUSE = false;
                    defines.DIFFUSEHASALPHA = false;
                    defines.GAMMADIFFUSE = false;
                    defines.OPACITYFRESNEL = false;
                }

                var reflectionTexture = this._reflectionTexture;
                if (reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
                    if (!reflectionTexture.isReadyOrNotBlocking()) {
                        return false;
                    }

                    defines.REFLECTION = true;
                    defines.GAMMAREFLECTION = reflectionTexture.gammaSpace;
                    defines.RGBDREFLECTION = reflectionTexture.isRGBD;
                    defines.REFLECTIONBLUR = this._reflectionBlur > 0;
                    defines.REFLECTIONMAP_OPPOSITEZ = this.getScene().useRightHandedSystem ? !reflectionTexture.invertZ : reflectionTexture.invertZ;
                    defines.LODINREFLECTIONALPHA = reflectionTexture.lodLevelInAlpha;
                    defines.EQUIRECTANGULAR_RELFECTION_FOV = this.useEquirectangularFOV;
                    defines.REFLECTIONBGR = this.switchToBGR;

                    if (reflectionTexture.coordinatesMode === Texture.INVCUBIC_MODE) {
                        defines.INVERTCUBICMAP = true;
                    }

                    defines.REFLECTIONMAP_3D = reflectionTexture.isCube;

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
                            break;
                    }

                    if (this.reflectionFresnel) {
                        defines.REFLECTIONFRESNEL = true;
                        defines.REFLECTIONFALLOFF = this.reflectionFalloffDistance > 0;

                        this._reflectionControls.x = this.reflectionAmount;
                        this._reflectionControls.y = this.reflectionReflectance0;
                        this._reflectionControls.z = this.reflectionReflectance90;
                        this._reflectionControls.w = 1 / this.reflectionFalloffDistance;
                    }
                    else {
                        defines.REFLECTIONFRESNEL = false;
                        defines.REFLECTIONFALLOFF = false;
                    }
                } else {
                    defines.REFLECTION = false;
                    defines.REFLECTIONFRESNEL = false;
                    defines.REFLECTIONFALLOFF = false;
                    defines.REFLECTIONBLUR = false;
                    defines.REFLECTIONMAP_3D = false;
                    defines.REFLECTIONMAP_SPHERICAL = false;
                    defines.REFLECTIONMAP_PLANAR = false;
                    defines.REFLECTIONMAP_CUBIC = false;
                    defines.REFLECTIONMAP_PROJECTION = false;
                    defines.REFLECTIONMAP_SKYBOX = false;
                    defines.REFLECTIONMAP_EXPLICIT = false;
                    defines.REFLECTIONMAP_EQUIRECTANGULAR = false;
                    defines.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
                    defines.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
                    defines.INVERTCUBICMAP = false;
                    defines.REFLECTIONMAP_OPPOSITEZ = false;
                    defines.LODINREFLECTIONALPHA = false;
                    defines.GAMMAREFLECTION = false;
                    defines.RGBDREFLECTION = false;
                }
            }

            defines.PREMULTIPLYALPHA = (this.alphaMode === Constants.ALPHA_PREMULTIPLIED || this.alphaMode === Constants.ALPHA_PREMULTIPLIED_PORTERDUFF);
            defines.USERGBCOLOR = this._useRGBColor;
            defines.NOISE = this._enableNoise;
        }

        if (defines._areLightsDirty) {
            defines.USEHIGHLIGHTANDSHADOWCOLORS = !this._useRGBColor && (this._primaryColorShadowLevel !== 0 || this._primaryColorHighlightLevel !== 0);
        }

        if (defines._areImageProcessingDirty && this._imageProcessingConfiguration) {
            if (!this._imageProcessingConfiguration.isReady()) {
                return false;
            }

            this._imageProcessingConfiguration.prepareDefines(defines);
        }

        // Misc.
        MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);

        // Values that need to be evaluated on every frame
        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);

        // Attribs
        if (MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, true, false)) {
            if (mesh) {
                if (!scene.getEngine().getCaps().standardDerivatives && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                    mesh.createNormals(true);
                    Logger.Warn("BackgroundMaterial: Normals have been created for the mesh: " + mesh.name);
                }
            }
        }

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();

            // Fallbacks
            var fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(0, "FOG");
            }

            if (defines.POINTSIZE) {
                fallbacks.addFallback(1, "POINTSIZE");
            }

            if (defines.MULTIVIEW) {
                fallbacks.addFallback(0, "MULTIVIEW");
            }

            MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this._maxSimultaneousLights);

            //Attributes
            var attribs = [VertexBuffer.PositionKind];

            if (defines.NORMAL) {
                attribs.push(VertexBuffer.NormalKind);
            }

            if (defines.UV1) {
                attribs.push(VertexBuffer.UVKind);
            }

            if (defines.UV2) {
                attribs.push(VertexBuffer.UV2Kind);
            }

            MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            MaterialHelper.PrepareAttributesForInstances(attribs, defines);

            var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType",
                "vFogInfos", "vFogColor", "pointSize",
                "vClipPlane", "vClipPlane2", "vClipPlane3", "vClipPlane4", "vClipPlane5", "vClipPlane6", "mBones",

                "vPrimaryColor", "vPrimaryColorShadow",
                "vReflectionInfos", "reflectionMatrix", "vReflectionMicrosurfaceInfos", "fFovMultiplier",

                "shadowLevel", "alpha",

                "vBackgroundCenter", "vReflectionControl",

                "vDiffuseInfos", "diffuseMatrix",
            ];

            var samplers = ["diffuseSampler", "reflectionSampler", "reflectionSamplerLow", "reflectionSamplerHigh"];
            var uniformBuffers = ["Material", "Scene"];

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

            var onCompiled = (effect: Effect) => {
                if (this.onCompiled) {
                    this.onCompiled(effect);
                }

                this.bindSceneUniformBuffer(effect, scene.getSceneUniformBuffer());
            };

            var join = defines.toString();
            subMesh.setEffect(scene.getEngine().createEffect("background", <IEffectCreationOptions>{
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: join,
                fallbacks: fallbacks,
                onCompiled: onCompiled,
                onError: this.onError,
                indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights }
            }, engine), defines);

            this.buildUniformLayout();
        }

        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        subMesh.effect._wasPreviouslyReady = true;

        return true;
    }

    /**
     * Compute the primary color according to the chosen perceptual color.
     */
    private _computePrimaryColorFromPerceptualColor(): void {
        if (!this.__perceptualColor) {
            return;
        }

        this._primaryColor.copyFrom(this.__perceptualColor);

        // Revert gamma space.
        this._primaryColor.toLinearSpaceToRef(this._primaryColor);

        // Revert image processing configuration.
        if (this._imageProcessingConfiguration) {
            // Revert Exposure.
            this._primaryColor.scaleToRef(1 / this._imageProcessingConfiguration.exposure, this._primaryColor);
        }

        this._computePrimaryColors();
    }

    /**
     * Compute the highlights and shadow colors according to their chosen levels.
     */
    private _computePrimaryColors(): void {
        if (this._primaryColorShadowLevel === 0 && this._primaryColorHighlightLevel === 0) {
            return;
        }

        // Find the highlight color based on the configuration.
        this._primaryColor.scaleToRef(this._primaryColorShadowLevel, this._primaryShadowColor);
        this._primaryColor.subtractToRef(this._primaryShadowColor, this._primaryShadowColor);

        // Find the shadow color based on the configuration.
        this._white.subtractToRef(this._primaryColor, this._primaryHighlightColor);
        this._primaryHighlightColor.scaleToRef(this._primaryColorHighlightLevel, this._primaryHighlightColor);
        this._primaryColor.addToRef(this._primaryHighlightColor, this._primaryHighlightColor);
    }

    /**
     * Build the uniform buffer used in the material.
     */
    public buildUniformLayout(): void {
        // Order is important !
        this._uniformBuffer.addUniform("vPrimaryColor", 4);
        this._uniformBuffer.addUniform("vPrimaryColorShadow", 4);
        this._uniformBuffer.addUniform("vDiffuseInfos", 2);
        this._uniformBuffer.addUniform("vReflectionInfos", 2);
        this._uniformBuffer.addUniform("diffuseMatrix", 16);
        this._uniformBuffer.addUniform("reflectionMatrix", 16);
        this._uniformBuffer.addUniform("vReflectionMicrosurfaceInfos", 3);
        this._uniformBuffer.addUniform("fFovMultiplier", 1);
        this._uniformBuffer.addUniform("pointSize", 1);
        this._uniformBuffer.addUniform("shadowLevel", 1);
        this._uniformBuffer.addUniform("alpha", 1);
        this._uniformBuffer.addUniform("vBackgroundCenter", 3);
        this._uniformBuffer.addUniform("vReflectionControl", 4);

        this._uniformBuffer.create();
    }

    /**
     * Unbind the material.
     */
    public unbind(): void {
        if (this._diffuseTexture && this._diffuseTexture.isRenderTarget) {
            this._uniformBuffer.setTexture("diffuseSampler", null);
        }

        if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
            this._uniformBuffer.setTexture("reflectionSampler", null);
        }

        super.unbind();
    }

    /**
     * Bind only the world matrix to the material.
     * @param world The world matrix to bind.
     */
    public bindOnlyWorldMatrix(world: Matrix): void {
        this._activeEffect.setMatrix("world", world);
    }

    /**
     * Bind the material for a dedicated submeh (every used meshes will be considered opaque).
     * @param world The world matrix to bind.
     * @param subMesh The submesh to bind for.
     */
    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        var scene = this.getScene();

        var defines = <BackgroundMaterialDefines>subMesh._materialDefines;
        if (!defines) {
            return;
        }

        var effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;

        // Matrices
        this.bindOnlyWorldMatrix(world);

        // Bones
        MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

        let mustRebind = this._mustRebind(scene, effect, mesh.visibility);
        if (mustRebind) {
            this._uniformBuffer.bindToEffect(effect, "Material");

            this.bindViewProjection(effect);

            let reflectionTexture = this._reflectionTexture;
            if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync) {

                // Texture uniforms
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                        this._uniformBuffer.updateFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                        MaterialHelper.BindTextureMatrix(this._diffuseTexture, this._uniformBuffer, "diffuse");
                    }

                    if (reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
                        this._uniformBuffer.updateMatrix("reflectionMatrix", reflectionTexture.getReflectionTextureMatrix());
                        this._uniformBuffer.updateFloat2("vReflectionInfos", reflectionTexture.level, this._reflectionBlur);

                        this._uniformBuffer.updateFloat3("vReflectionMicrosurfaceInfos",
                            reflectionTexture.getSize().width,
                            reflectionTexture.lodGenerationScale,
                            reflectionTexture.lodGenerationOffset);
                    }
                }

                if (this.shadowLevel > 0) {
                    this._uniformBuffer.updateFloat("shadowLevel", this.shadowLevel);
                }
                this._uniformBuffer.updateFloat("alpha", this.alpha);

                // Point size
                if (this.pointsCloud) {
                    this._uniformBuffer.updateFloat("pointSize", this.pointSize);
                }

                if (defines.USEHIGHLIGHTANDSHADOWCOLORS) {
                    this._uniformBuffer.updateColor4("vPrimaryColor", this._primaryHighlightColor, 1.0);
                    this._uniformBuffer.updateColor4("vPrimaryColorShadow", this._primaryShadowColor, 1.0);
                }
                else {
                    this._uniformBuffer.updateColor4("vPrimaryColor", this._primaryColor, 1.0);
                }
            }

            this._uniformBuffer.updateFloat("fFovMultiplier", this._fovMultiplier);

            // Textures
            if (scene.texturesEnabled) {
                if (this._diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                    this._uniformBuffer.setTexture("diffuseSampler", this._diffuseTexture);
                }

                if (reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
                    if (defines.REFLECTIONBLUR && defines.TEXTURELODSUPPORT) {
                        this._uniformBuffer.setTexture("reflectionSampler", reflectionTexture);
                    }
                    else if (!defines.REFLECTIONBLUR) {
                        this._uniformBuffer.setTexture("reflectionSampler", reflectionTexture);
                    }
                    else {
                        this._uniformBuffer.setTexture("reflectionSampler", reflectionTexture._lodTextureMid || reflectionTexture);
                        this._uniformBuffer.setTexture("reflectionSamplerLow", reflectionTexture._lodTextureLow || reflectionTexture);
                        this._uniformBuffer.setTexture("reflectionSamplerHigh", reflectionTexture._lodTextureHigh || reflectionTexture);
                    }

                    if (defines.REFLECTIONFRESNEL) {
                        this._uniformBuffer.updateFloat3("vBackgroundCenter", this.sceneCenter.x, this.sceneCenter.y, this.sceneCenter.z);
                        this._uniformBuffer.updateFloat4("vReflectionControl", this._reflectionControls.x, this._reflectionControls.y, this._reflectionControls.z, this._reflectionControls.w);
                    }
                }
            }

            // Clip plane
            MaterialHelper.BindClipPlane(this._activeEffect, scene);

            MaterialHelper.BindEyePosition(effect, scene);
        }

        if (mustRebind || !this.isFrozen) {
            if (scene.lightsEnabled) {
                MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this._maxSimultaneousLights, false);
            }

            // View
            this.bindView(effect);

            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect, true);

            // image processing
            if (this._imageProcessingConfiguration) {
                this._imageProcessingConfiguration.bind(this._activeEffect);
            }
        }

        this._uniformBuffer.update();

        this._afterBind(mesh, this._activeEffect);
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

        if (this._reflectionTexture === texture) {
            return true;
        }

        if (this._diffuseTexture === texture) {
            return true;
        }

        return false;
    }

    /**
     * Dispose the material.
     * @param forceDisposeEffect Force disposal of the associated effect.
     * @param forceDisposeTextures Force disposal of the associated textures.
     */
    public dispose(forceDisposeEffect: boolean = false, forceDisposeTextures: boolean = false): void {
        if (forceDisposeTextures) {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }
            if (this.reflectionTexture) {
                this.reflectionTexture.dispose();
            }
        }

        this._renderTargets.dispose();

        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }

        super.dispose(forceDisposeEffect);
    }

    /**
     * Clones the material.
     * @param name The cloned name.
     * @returns The cloned material.
     */
    public clone(name: string): BackgroundMaterial {
        return SerializationHelper.Clone(() => new BackgroundMaterial(name, this.getScene()), this);
    }

    /**
     * Serializes the current material to its JSON representation.
     * @returns The JSON representation.
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.BackgroundMaterial";
        return serializationObject;
    }

    /**
     * Gets the class name of the material
     * @returns "BackgroundMaterial"
     */
    public getClassName(): string {
        return "BackgroundMaterial";
    }

    /**
     * Parse a JSON input to create back a background material.
     * @param source The JSON data to parse
     * @param scene The scene to create the parsed material in
     * @param rootUrl The root url of the assets the material depends upon
     * @returns the instantiated BackgroundMaterial.
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): BackgroundMaterial {
        return SerializationHelper.Parse(() => new BackgroundMaterial(source.name, scene), source, scene, rootUrl);
    }
}

_TypeStore.RegisteredTypes["BABYLON.BackgroundMaterial"] = BackgroundMaterial;
