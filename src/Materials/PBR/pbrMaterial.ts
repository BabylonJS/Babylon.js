import { serialize, SerializationHelper, serializeAsColor3, expandToProperty, serializeAsTexture } from "../../Misc/decorators";
import { BRDFTextureTools } from "../../Misc/brdfTextureTools";
import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Color3 } from "../../Maths/math.color";
import { ImageProcessingConfiguration } from "../../Materials/imageProcessingConfiguration";
import { ColorCurves } from "../../Materials/colorCurves";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { PBRBaseMaterial } from "./pbrBaseMaterial";
import { _TypeStore } from '../../Misc/typeStore';

/**
 * The Physically based material of BJS.
 *
 * This offers the main features of a standard PBR material.
 * For more information, please refer to the documentation :
 * https://doc.babylonjs.com/how_to/physically_based_rendering
 */
export class PBRMaterial extends PBRBaseMaterial {
    /**
     * PBRMaterialTransparencyMode: No transparency mode, Alpha channel is not use.
     */
    public static readonly PBRMATERIAL_OPAQUE = PBRBaseMaterial.PBRMATERIAL_OPAQUE;

    /**
     * PBRMaterialTransparencyMode: Alpha Test mode, pixel are discarded below a certain threshold defined by the alpha cutoff value.
     */
    public static readonly PBRMATERIAL_ALPHATEST = PBRBaseMaterial.PBRMATERIAL_ALPHATEST;

    /**
     * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
     */
    public static readonly PBRMATERIAL_ALPHABLEND = PBRBaseMaterial.PBRMATERIAL_ALPHABLEND;

    /**
     * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
     * They are also discarded below the alpha cutoff threshold to improve performances.
     */
    public static readonly PBRMATERIAL_ALPHATESTANDBLEND = PBRBaseMaterial.PBRMATERIAL_ALPHATESTANDBLEND;

    /**
     * Defines the default value of how much AO map is occluding the analytical lights
     * (point spot...).
     */
    public static DEFAULT_AO_ON_ANALYTICAL_LIGHTS = PBRBaseMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS;

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
     * either through harmonics for rough material or through the refelction for shiny ones.
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
    public albedoTexture: BaseTexture;

    /**
     * AKA Occlusion Texture in other nomenclature.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public ambientTexture: BaseTexture;

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
    public ambientTextureImpactOnAnalyticalLights: number = PBRMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS;

    /**
     * Stores the alpha values in a texture. Use luminance if texture.getAlphaFromRGB is true.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
    public opacityTexture: BaseTexture;

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
    public emissiveTexture: BaseTexture;

    /**
     * AKA Specular texture in other nomenclature.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public reflectivityTexture: BaseTexture;

    /**
     * Used to switch from specular/glossiness to metallic/roughness workflow.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public metallicTexture: BaseTexture;

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
     * In metallic workflow, specifies an F90 color to help configuring the material F90.
     * By default the F90 is always 1;
     *
     * Please note that this factor is also used as a factor against the default reflectance at normal incidence.
     *
     * F0 = defaultF0 * metallicF0Factor * metallicReflectanceColor
     * F90 = metallicReflectanceColor;
     */
    @serializeAsColor3()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public metallicReflectanceColor = Color3.White();

    /**
     * Defines to store metallicReflectanceColor in RGB and metallicF0Factor in A
     * This is multiply against the scalar values defined in the material.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public metallicReflectanceTexture: Nullable<BaseTexture>;

    /**
     * Used to enable roughness/glossiness fetch from a separate channel depending on the current mode.
     * Gray Scale represents roughness in metallic mode and glossiness in specular mode.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public microSurfaceTexture: BaseTexture;

    /**
     * Stores surface normal data used to displace a mesh in a texture.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public bumpTexture: BaseTexture;

    /**
     * Stores the pre-calculated light information of a mesh in a texture.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty", null)
    public lightmapTexture: BaseTexture;

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
        }
        else if (!this.subSurface.linkRefractionWithTransparency) {
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
     * This parameters will make the material used its opacity to control how much it is refracting aginst not.
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
     * Specifies that the material will keep the specular highlights over a transparent surface (only the most limunous ones).
     * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
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
     * BJS is using an harcoded light falloff based on a manually sets up range.
     * In PBR, one way to represents the fallof is to use the inverse squared root algorythm.
     * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
     */
    @serialize()
    public get usePhysicalLightFalloff(): boolean {
        return this._lightFalloff === PBRBaseMaterial.LIGHTFALLOFF_PHYSICAL;
    }

    /**
     * BJS is using an harcoded light falloff based on a manually sets up range.
     * In PBR, one way to represents the fallof is to use the inverse squared root algorythm.
     * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
     */
    public set usePhysicalLightFalloff(value: boolean) {
        if (value !== this.usePhysicalLightFalloff) {
            // Ensure the effect will be rebuilt.
            this._markAllSubMeshesAsTexturesDirty();

            if (value) {
                this._lightFalloff = PBRBaseMaterial.LIGHTFALLOFF_PHYSICAL;
            }
            else {
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
            }
            else {
                this._lightFalloff = PBRBaseMaterial.LIGHTFALLOFF_STANDARD;
            }
        }
    }

    /**
     * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most limunous ones).
     * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
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
    @serializeAsTexture()
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
     * Gets wether the color curves effect is enabled.
     */
    public get cameraColorCurvesEnabled(): boolean {
        return this.imageProcessingConfiguration.colorCurvesEnabled;
    }
    /**
     * Sets wether the color curves effect is enabled.
     */
    public set cameraColorCurvesEnabled(value: boolean) {
        this.imageProcessingConfiguration.colorCurvesEnabled = value;
    }

    /**
     * Gets wether the color grading effect is enabled.
     */
    public get cameraColorGradingEnabled(): boolean {
        return this.imageProcessingConfiguration.colorGradingEnabled;
    }
    /**
     * Gets wether the color grading effect is enabled.
     */
    public set cameraColorGradingEnabled(value: boolean) {
        this.imageProcessingConfiguration.colorGradingEnabled = value;
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
     * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
     * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
     * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
     * corresponding to low luminance, medium luminance, and high luminance areas respectively.
     */
    public set cameraColorCurves(value: Nullable<ColorCurves>) {
        this._imageProcessingConfiguration.colorCurves = value;
    }

    /**
     * Instantiates a new PBRMaterial instance.
     *
     * @param name The material name
     * @param scene The scene the material will be use in.
     */
    constructor(name: string, scene: Scene) {
        super(name, scene);

        this._environmentBRDFTexture = BRDFTextureTools.GetEnvironmentBRDFTexture(scene);
    }

    /**
     * Returns the name of this material class.
     */
    public getClassName(): string {
        return "PBRMaterial";
    }

    /**
     * Makes a duplicate of the current material.
     * @param name - name to use for the new material.
     */
    public clone(name: string): PBRMaterial {
        var clone = SerializationHelper.Clone(() => new PBRMaterial(name, this.getScene()), this);

        clone.id = name;
        clone.name = name;

        this.clearCoat.copyTo(clone.clearCoat);
        this.anisotropy.copyTo(clone.anisotropy);
        this.brdf.copyTo(clone.brdf);
        this.sheen.copyTo(clone.sheen);
        this.subSurface.copyTo(clone.subSurface);

        return clone;
    }

    /**
     * Serializes this PBR Material.
     * @returns - An object with the serialized material.
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.PBRMaterial";

        serializationObject.clearCoat = this.clearCoat.serialize();
        serializationObject.anisotropy = this.anisotropy.serialize();
        serializationObject.brdf = this.brdf.serialize();
        serializationObject.sheen = this.sheen.serialize();
        serializationObject.subSurface = this.subSurface.serialize();

        return serializationObject;
    }

    // Statics
    /**
     * Parses a PBR Material from a serialized object.
     * @param source - Serialized object.
     * @param scene - BJS scene instance.
     * @param rootUrl - url for the scene object
     * @returns - PBRMaterial
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): PBRMaterial {
        const material = SerializationHelper.Parse(() => new PBRMaterial(source.name, scene), source, scene, rootUrl);
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
        return material;
    }
}

_TypeStore.RegisteredTypes["BABYLON.PBRMaterial"] = PBRMaterial;
