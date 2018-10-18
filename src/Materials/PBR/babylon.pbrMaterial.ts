module BABYLON {
    /**
     * The Physically based material of BJS.
     *
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation :
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    export class PBRMaterial extends PBRBaseMaterial {
        /**
         * PBRMaterialTransparencyMode: No transparency mode, Alpha channel is not use.
         */
        public static readonly PBRMATERIAL_OPAQUE = 0;

        /**
         * PBRMaterialTransparencyMode: Alpha Test mode, pixel are discarded below a certain threshold defined by the alpha cutoff value.
         */
        public static readonly PBRMATERIAL_ALPHATEST = 1;

        /**
         * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
         */
        public static readonly PBRMATERIAL_ALPHABLEND = 2;

        /**
         * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
         * They are also discarded below the alpha cutoff threshold to improve performances.
         */
        public static readonly PBRMATERIAL_ALPHATESTANDBLEND = 3;

        /**
         * Defines the default value of how much AO map is occluding the analytical lights
         * (point spot...).
         */
        public static DEFAULT_AO_ON_ANALYTICAL_LIGHTS = 1;

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
         * Stores the alpha values in a texture.
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
        @serializeAsTexture()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public refractionTexture: BaseTexture;

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
         * source material index of refraction (IOR)' / 'destination material IOR.
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public indexOfRefraction = 0.66;

        /**
         * Controls if refraction needs to be inverted on Y. This could be usefull for procedural texture.
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public invertRefractionY = false;

        /**
         * This parameters will make the material used its opacity to control how much it is refracting aginst not.
         * Materials half opaque for instance using refraction could benefit from this control.
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public linkRefractionWithTransparency = false;

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
         * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
         * And/Or occlude the blended part.
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

            this._environmentBRDFTexture = TextureTools.GetEnvironmentBRDFTexture(scene);
        }

        /**
         * Returns the name of this material class.
         */
        public getClassName(): string {
            return "PBRMaterial";
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

            if (this._microSurfaceTexture) {
                activeTextures.push(this._microSurfaceTexture);
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

            if (this._microSurfaceTexture === texture) {
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
         * Makes a duplicate of the current material.
         * @param name - name to use for the new material.
         */
        public clone(name: string): PBRMaterial {
            var clone = SerializationHelper.Clone(() => new PBRMaterial(name, this.getScene()), this);

            clone.id = name;
            clone.name = name;

            return clone;
        }

        /**
         * Serializes this PBR Material.
         * @returns - An object with the serialized material.
         */
        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.PBRMaterial";
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
            return SerializationHelper.Parse(() => new PBRMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
}