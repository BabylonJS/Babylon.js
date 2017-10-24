module BABYLON {
    class PBRMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
        public PBR = true;

        public MAINUV1 = false;
        public MAINUV2 = false;
        public UV1 = false;
        public UV2 = false;

        public ALBEDO = false;
        public ALBEDODIRECTUV = 0;
        public VERTEXCOLOR = false;

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
        public ALPHATESTVALUE = 0.5;
        public SPECULAROVERALPHA = false;
        public RADIANCEOVERALPHA = false;
        public ALPHAFRESNEL = false;
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
        public ENVIRONMENTBRDF = false;

        public NORMAL = false;
        public TANGENT = false;
        public BUMP = false;
        public BUMPDIRECTUV = 0;
        public PARALLAX = false;
        public PARALLAXOCCLUSION = false;
        public NORMALXYSCALE = true;

        public LIGHTMAP = false;
        public LIGHTMAPDIRECTUV = 0;
        public USELIGHTMAPASSHADOWMAP = false;

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
        public USESPHERICALFROMREFLECTIONMAP = false;
        public USESPHERICALINFRAGMENT = false;
        public REFLECTIONMAP_OPPOSITEZ = false;
        public LODINREFLECTIONALPHA = false;
        public GAMMAREFLECTION = false;

        public REFRACTION = false;
        public REFRACTIONMAP_3D = false;
        public REFRACTIONMAP_OPPOSITEZ = false;
        public LODINREFRACTIONALPHA = false;
        public GAMMAREFRACTION = false;
        public LINKREFRACTIONTOTRANSPARENCY = false;

        public INSTANCES = false;
        
        public NUM_BONE_INFLUENCERS = 0;
        public BonesPerMesh = 0;
        
        public NONUNIFORMSCALING = false;

        public MORPHTARGETS = false;
        public MORPHTARGETS_NORMAL = false;
        public MORPHTARGETS_TANGENT = false;
        public NUM_MORPH_INFLUENCERS = 0;

        public IMAGEPROCESSING = false;
        public VIGNETTE = false;
        public VIGNETTEBLENDMODEMULTIPLY = false;
        public VIGNETTEBLENDMODEOPAQUE = false;
        public TONEMAPPING = false;
        public CONTRAST = false;
        public COLORCURVES = false;
        public COLORGRADING = false;
        public COLORGRADING3D = false;
        public SAMPLER3DGREENDEPTH = false;
        public SAMPLER3DBGRMAP = false;
        public IMAGEPROCESSINGPOSTPROCESS = false;
        public EXPOSURE = false;

        public USEPHYSICALLIGHTFALLOFF = false;
        public TWOSIDEDLIGHTING = false;
        public SHADOWFLOAT = false;
        public CLIPPLANE = false;
        public POINTSIZE = false;
        public FOG = false;
        public LOGARITHMICDEPTH = false;

        public FORCENORMALFORWARD = false;

        constructor() {
            super();
            this.rebuild();
        }

        public reset(): void {
            super.reset();
            this.ALPHATESTVALUE = 0.5;
            this.PBR = true;
        }
    }

    /**
     * The Physically based material base class of BJS.
     * 
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation : 
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    export abstract class PBRBaseMaterial extends PushMaterial {

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

        private _lightingInfos: Vector4 = new Vector4(this._directIntensity, this._emissiveIntensity, this._environmentIntensity, this._specularIntensity);
        
        /**
         * Debug Control allowing disabling the bump map on this material.
         */
        protected _disableBumpMap: boolean = false;

        /**
         * AKA Diffuse Texture in standard nomenclature.
         */
        protected _albedoTexture: BaseTexture;
        
        /**
         * AKA Occlusion Texture in other nomenclature.
         */
        protected _ambientTexture: BaseTexture;

        /**
         * AKA Occlusion Texture Intensity in other nomenclature.
         */
        protected _ambientTextureStrength: number = 1.0;

        protected _opacityTexture: BaseTexture;

        protected _reflectionTexture: BaseTexture;

        protected _refractionTexture: BaseTexture;

        protected _emissiveTexture: BaseTexture;
        
        /**
         * AKA Specular texture in other nomenclature.
         */
        protected _reflectivityTexture: BaseTexture;

        /**
         * Used to switch from specular/glossiness to metallic/roughness workflow.
         */
        protected _metallicTexture: BaseTexture;

        /**
         * Specifies the metallic scalar of the metallic/roughness workflow.
         * Can also be used to scale the metalness values of the metallic texture.
         */
        protected _metallic: number;

        /**
         * Specifies the roughness scalar of the metallic/roughness workflow.
         * Can also be used to scale the roughness values of the metallic texture.
         */
        protected _roughness: number;

        /**
         * Used to enable roughness/glossiness fetch from a separate chanel depending on the current mode.
         * Gray Scale represents roughness in metallic mode and glossiness in specular mode.
         */
        protected _microSurfaceTexture: BaseTexture;

        protected _bumpTexture: BaseTexture;

        protected _lightmapTexture: BaseTexture;

        protected _ambientColor = new Color3(0, 0, 0);

        /**
         * AKA Diffuse Color in other nomenclature.
         */
        protected _albedoColor = new Color3(1, 1, 1);
        
        /**
         * AKA Specular Color in other nomenclature.
         */
        protected _reflectivityColor = new Color3(1, 1, 1);

        protected _reflectionColor = new Color3(1, 1, 1);

        protected _emissiveColor = new Color3(0, 0, 0);
        
        /**
         * AKA Glossiness in other nomenclature.
         */
        protected _microSurface = 0.9;

        /**
         * source material index of refraction (IOR)' / 'destination material IOR.
         */
        protected _indexOfRefraction = 0.66;
        
        /**
         * Controls if refraction needs to be inverted on Y. This could be usefull for procedural texture.
         */
        protected _invertRefractionY = false;

        /**
         * This parameters will make the material used its opacity to control how much it is refracting aginst not.
         * Materials half opaque for instance using refraction could benefit from this control.
         */
        protected _linkRefractionWithTransparency = false;

        protected _useLightmapAsShadowmap = false;
        
        /**
         * Specifies that the alpha is coming form the albedo channel alpha channel.
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
         * BJS is using an harcoded light falloff based on a manually sets up range.
         * In PBR, one way to represents the fallof is to use the inverse squared root algorythm.
         * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
         */
        protected _usePhysicalLightFalloff = true;
        
        /**
         * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most limunous ones).
         * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
         */
        protected _useRadianceOverAlpha = true;
        
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
         * And/Or occlude the blended part.
         */
        protected _useAlphaFresnel = false;

        /**
         * Specifies the environment BRDF texture used to comput the scale and offset roughness values
         * from cos thetav and roughness: 
         * http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
         */
        protected _environmentBRDFTexture: BaseTexture = null;

        /**
         * Force the shader to compute irradiance in the fragment shader in order to take bump in account.
         */
        protected _forceIrradianceInFragment = false;

        /**
         * Force normal to face away from face.
         * (Temporary internal fix to remove before 3.1)
         */
        protected _forceNormalForward = false;

        /**
         * Default configuration related to image processing available in the PBR Material.
         */
        @serializeAsImageProcessingConfiguration()
        protected _imageProcessingConfiguration: ImageProcessingConfiguration;

        /**
         * Keep track of the image processing observer to allow dispose and replace.
         */
        private _imageProcessingObserver: Observer<ImageProcessingConfiguration>;

        /**
         * Attaches a new image processing configuration to the PBR Material.
         * @param configuration 
         */
        protected _attachImageProcessingConfiguration(configuration: ImageProcessingConfiguration): void {
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
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(conf => {
                this._markAllSubMeshesAsImageProcessingDirty();
            });
        }

        private _renderTargets = new SmartArray<RenderTargetTexture>(16);
        private _globalAmbientColor = new Color3(0, 0, 0);
        private _useLogarithmicDepth: boolean;

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

                if (StandardMaterial.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                    this._renderTargets.push(<RenderTargetTexture>this._reflectionTexture);
                }

                if (StandardMaterial.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget) {
                    this._renderTargets.push(<RenderTargetTexture>this._refractionTexture);
                }

                return this._renderTargets;
            }

            this._environmentBRDFTexture = TextureTools.GetEnvironmentBRDFTexture(scene);
        }

        public getClassName(): string {
            return "PBRBaseMaterial";
        }  

        @serialize()
        public get useLogarithmicDepth(): boolean {
            return this._useLogarithmicDepth;
        }

        public set useLogarithmicDepth(value: boolean) {
            this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
        }

        public needAlphaBlending(): boolean {
            if (this._linkRefractionWithTransparency) {
                return false;
            }
            return (this.alpha < 1.0) || (this._opacityTexture != null) || this._shouldUseAlphaFromAlbedoTexture();
        }

        public needAlphaTesting(): boolean {
            if (this._forceAlphaTest) {
                return true;
            }

            if (this._linkRefractionWithTransparency) {
                return false;
            }
            return this._albedoTexture != null && this._albedoTexture.hasAlpha;
        }

        protected _shouldUseAlphaFromAlbedoTexture(): boolean {
            return this._albedoTexture != null && this._albedoTexture.hasAlpha && this._useAlphaFromAlbedoTexture;
        }

        public getAlphaTestTexture(): BaseTexture {
            return this._albedoTexture;
        }

        private static _scaledReflectivity = new Color3();

        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean { 
            if (subMesh.effect && this.isFrozen) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }

            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new PBRMaterialDefines();
            }

            var scene = this.getScene();
            var defines = <PBRMaterialDefines>subMesh._materialDefines;
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (defines._renderId === scene.getRenderId()) {
                    return true;
                }
            }

            var engine = scene.getEngine();
            
            // Lights
            MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
            defines._needNormals = true;

            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (scene.getEngine().getCaps().textureLOD) {
                        defines.LODBASEDMICROSFURACE = true;
                    }

                    if (this._albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                        if (!this._albedoTexture.isReadyOrNotBlocking()) {
                            return false;
                        }

                        MaterialHelper.PrepareDefinesForMergedUV(this._albedoTexture, defines, "ALBEDO");
                    } else {
                        defines.ALBEDO = false;
                    }

                    if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                        if (!this._ambientTexture.isReadyOrNotBlocking()) {
                            return false;
                        }

                        MaterialHelper.PrepareDefinesForMergedUV(this._ambientTexture, defines, "AMBIENT"); 
                        defines.AMBIENTINGRAYSCALE = this._useAmbientInGrayScale;
                    } else {
                        defines.AMBIENT = false;
                    }

                    if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                        if (!this._opacityTexture.isReadyOrNotBlocking()) {
                            return false;
                        }

                        MaterialHelper.PrepareDefinesForMergedUV(this._opacityTexture, defines, "OPACITY"); 
                        defines.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
                    } else {
                        defines.OPACITY = false;
                    }

                    var reflectionTexture = this._getReflectionTexture();
                    if (reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                        if (!reflectionTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        
                        defines.REFLECTION = true;
                        defines.GAMMAREFLECTION = reflectionTexture.gammaSpace;
                        defines.REFLECTIONMAP_OPPOSITEZ = this.getScene().useRightHandedSystem ? !reflectionTexture.invertZ : reflectionTexture.invertZ;
                        defines.LODINREFLECTIONALPHA = reflectionTexture.lodLevelInAlpha;

                        if (reflectionTexture.coordinatesMode === Texture.INVCUBIC_MODE) {
                            defines.INVERTCUBICMAP = true;
                        }

                        defines.REFLECTIONMAP_3D = reflectionTexture.isCube;

                        switch (reflectionTexture.coordinatesMode) {
                            case Texture.CUBIC_MODE:
                            case Texture.INVCUBIC_MODE:
                                defines.REFLECTIONMAP_CUBIC = true;
                                break;
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
                        }

                        if (reflectionTexture.coordinatesMode !== BABYLON.Texture.SKYBOX_MODE) {
                            if (reflectionTexture.sphericalPolynomial) {
                                defines.USESPHERICALFROMREFLECTIONMAP = true;
                                if (this._forceIrradianceInFragment || scene.getEngine().getCaps().maxVaryingVectors <= 8) {
                                    defines.USESPHERICALINFRAGMENT = true;
                                }
                            }
                        }
                    } else {
                        defines.REFLECTION = false;
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
                        defines.USESPHERICALFROMREFLECTIONMAP = false;
                        defines.USESPHERICALINFRAGMENT = false;
                        defines.REFLECTIONMAP_OPPOSITEZ = false;
                        defines.LODINREFLECTIONALPHA = false;
                        defines.GAMMAREFLECTION = false;
                    }

                    if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                        if (!this._lightmapTexture.isReadyOrNotBlocking()) {
                            return false;
                        }

                        MaterialHelper.PrepareDefinesForMergedUV(this._lightmapTexture, defines, "LIGHTMAP"); 
                        defines.USELIGHTMAPASSHADOWMAP = this._useLightmapAsShadowmap;
                    } else {
                        defines.LIGHTMAP = false;
                    }

                    if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                        if (!this._emissiveTexture.isReadyOrNotBlocking()) {
                            return false;
                        }

                        MaterialHelper.PrepareDefinesForMergedUV(this._emissiveTexture, defines, "EMISSIVE");
                    } else {
                        defines.EMISSIVE = false;
                    }

                    if (StandardMaterial.SpecularTextureEnabled) {
                        if (this._metallicTexture) {
                            if (!this._metallicTexture.isReadyOrNotBlocking()) {
                                return false;
                            }

                            MaterialHelper.PrepareDefinesForMergedUV(this._metallicTexture, defines, "REFLECTIVITY");
                            defines.METALLICWORKFLOW = true;
                            defines.ROUGHNESSSTOREINMETALMAPALPHA = this._useRoughnessFromMetallicTextureAlpha;
                            defines.ROUGHNESSSTOREINMETALMAPGREEN = !this._useRoughnessFromMetallicTextureAlpha && this._useRoughnessFromMetallicTextureGreen;
                            defines.METALLNESSSTOREINMETALMAPBLUE = this._useMetallnessFromMetallicTextureBlue;
                            defines.AOSTOREINMETALMAPRED = this._useAmbientOcclusionFromMetallicTextureRed;
                        }
                        else if (this._reflectivityTexture) {
                            if (!this._reflectivityTexture.isReadyOrNotBlocking()) {
                                return false;
                            }

                            defines.METALLICWORKFLOW = false;
                            MaterialHelper.PrepareDefinesForMergedUV(this._reflectivityTexture, defines, "REFLECTIVITY");
                            defines.MICROSURFACEFROMREFLECTIVITYMAP = this._useMicroSurfaceFromReflectivityMapAlpha;
                            defines.MICROSURFACEAUTOMATIC = this._useAutoMicroSurfaceFromReflectivityMap;
                        } else {
                            defines.METALLICWORKFLOW = false;
                            defines.REFLECTIVITY = false;
                        }

                        if (this._microSurfaceTexture) {
                            if (!this._microSurfaceTexture.isReadyOrNotBlocking()) {
                                return false;
                            }

                            MaterialHelper.PrepareDefinesForMergedUV(this._microSurfaceTexture, defines, "MICROSURFACEMAP");
                        } else {
                            defines.MICROSURFACEMAP = false;
                        }
                    } else {
                        defines.REFLECTIVITY = false;
                        defines.MICROSURFACEMAP = false;
                    }
	
                    if (scene.getEngine().getCaps().standardDerivatives && this._bumpTexture && StandardMaterial.BumpTextureEnabled && !this._disableBumpMap) {
                        // Bump texure can not be none blocking.
                        if (!this._bumpTexture.isReady()) {
                            return false;
                        }

                        MaterialHelper.PrepareDefinesForMergedUV(this._bumpTexture, defines, "BUMP");

                        if (this._useParallax && this._albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                            defines.PARALLAX = true;
                            defines.PARALLAXOCCLUSION = !!this._useParallaxOcclusion;
                        }
                        else {
                            defines.PARALLAX = false;
                        }
                    } else {
                        defines.BUMP = false;
                    }

                    var refractionTexture = this._getRefractionTexture();
                    if (refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        if (!refractionTexture.isReadyOrNotBlocking()) {
                            return false;
                        }

                        defines.REFRACTION = true;
                        defines.REFRACTIONMAP_3D = refractionTexture.isCube;
                        defines.GAMMAREFRACTION = refractionTexture.gammaSpace;
                        defines.REFRACTIONMAP_OPPOSITEZ = reflectionTexture.invertZ;
                        defines.LODINREFRACTIONALPHA = reflectionTexture.lodLevelInAlpha;

                        if (this._linkRefractionWithTransparency) {
                            defines.LINKREFRACTIONTOTRANSPARENCY = true;
                        }
                    } else {
                        defines.REFRACTION = false;
                    }

                    if (this._environmentBRDFTexture && StandardMaterial.ReflectionTextureEnabled) {
                        // This is blocking.
                        if (!this._environmentBRDFTexture.isReady()) {
                            return false;
                        }
                        defines.ENVIRONMENTBRDF = true;
                    } else {
                        defines.ENVIRONMENTBRDF = false;
                    }

                    if (this._shouldUseAlphaFromAlbedoTexture()) {
                        defines.ALPHAFROMALBEDO = true;
                    } else {
                        defines.ALPHAFROMALBEDO = false;
                    }

                }

                defines.SPECULAROVERALPHA = this._useSpecularOverAlpha;

                defines.USEPHYSICALLIGHTFALLOFF = this._usePhysicalLightFalloff;

                defines.RADIANCEOVERALPHA = this._useRadianceOverAlpha;

                if ((this._metallic !== undefined && this._metallic !== null) || (this._roughness !== undefined && this._roughness !== null)) {
                    defines.METALLICWORKFLOW = true;
                } else {
                    defines.METALLICWORKFLOW = false;
                }

                if (!this.backFaceCulling && this._twoSidedLighting) {
                    defines.TWOSIDEDLIGHTING = true;
                } else {
                    defines.TWOSIDEDLIGHTING = false;
                }

                defines.ALPHATESTVALUE = this._alphaCutOff;
                defines.PREMULTIPLYALPHA = (this.alphaMode === Engine.ALPHA_PREMULTIPLIED || this.alphaMode === Engine.ALPHA_PREMULTIPLIED_PORTERDUFF);
                defines.ALPHABLEND = this.needAlphaBlending();
                defines.ALPHAFRESNEL = this._useAlphaFresnel;
            }

            if (defines._areImageProcessingDirty) {
                if (!this._imageProcessingConfiguration.isReady()) {
                    return false;
                }

                this._imageProcessingConfiguration.prepareDefines(defines);
            }

            defines.FORCENORMALFORWARD = this._forceNormalForward;

            // Misc.
            MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, defines);

            // Values that need to be evaluated on every frame
            MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances, this._forceAlphaTest);

             // Attribs
            if (MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true, true)) {
                if (mesh) {
                    if (!scene.getEngine().getCaps().standardDerivatives && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                        mesh.createNormals(true);
                        Tools.Warn("PBRMaterial: Normals have been created for the mesh: " + mesh.name);
                    }
                }
            }

            // Get correct effect
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();

                // Fallbacks
                var fallbacks = new EffectFallbacks();
                if (defines.ENVIRONMENTBRDF) {
                    fallbacks.addFallback(0, "ENVIRONMENTBRDF");
                }

                if (defines.REFLECTION) {
                    fallbacks.addFallback(0, "REFLECTION");
                }

                if (defines.REFRACTION) {
                    fallbacks.addFallback(0, "REFRACTION");
                }

                if (defines.REFLECTIVITY) {
                    fallbacks.addFallback(0, "REFLECTIVITY");
                }

                if (defines.BUMP) {
                    fallbacks.addFallback(0, "BUMP");
                }

                if (defines.PARALLAX) {
                    fallbacks.addFallback(1, "PARALLAX");
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

                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
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

                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vAlbedoColor", "vReflectivityColor", "vEmissiveColor", "vReflectionColor",
                        "vFogInfos", "vFogColor", "pointSize",
                        "vAlbedoInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vReflectivityInfos", "vMicroSurfaceSamplerInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                        "mBones",
                        "vClipPlane", "albedoMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "reflectivityMatrix", "microSurfaceSamplerMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                        "vLightingIntensity",
                        "logarithmicDepthConstant",
                        "vSphericalX", "vSphericalY", "vSphericalZ",
                        "vSphericalXX", "vSphericalYY", "vSphericalZZ",
                        "vSphericalXY", "vSphericalYZ", "vSphericalZX",
                        "vReflectionMicrosurfaceInfos", "vRefractionMicrosurfaceInfos",
                        "vTangentSpaceParams"
                ];

                var samplers = ["albedoSampler", "reflectivitySampler", "ambientSampler", "emissiveSampler", 
                    "bumpSampler", "lightmapSampler", "opacitySampler",
                    "refractionSampler", "refractionSamplerLow", "refractionSamplerHigh",
                    "reflectionSampler", "reflectionSamplerLow", "reflectionSamplerHigh",
                    "microSurfaceSampler", "environmentBrdfSampler"];
                var uniformBuffers = ["Material", "Scene"];

                ImageProcessingConfiguration.PrepareUniforms(uniforms, defines);
                ImageProcessingConfiguration.PrepareSamplers(samplers, defines);

                MaterialHelper.PrepareUniformsAndSamplersList(<EffectCreationOptions>{
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
                subMesh.setEffect(scene.getEngine().createEffect("pbr", <EffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights, maxSimultaneousMorphTargets: defines.NUM_MORPH_INFLUENCERS }
                }, engine), defines);
                
                this.buildUniformLayout();
            }

            if (!subMesh.effect.isReady()) {
                return false;
            }

            defines._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }

        public buildUniformLayout(): void {
            // Order is important !
            this._uniformBuffer.addUniform("vAlbedoInfos", 2);
            this._uniformBuffer.addUniform("vAmbientInfos", 3);
            this._uniformBuffer.addUniform("vOpacityInfos", 2);
            this._uniformBuffer.addUniform("vEmissiveInfos", 2);
            this._uniformBuffer.addUniform("vLightmapInfos", 2);
            this._uniformBuffer.addUniform("vReflectivityInfos", 3);
            this._uniformBuffer.addUniform("vMicroSurfaceSamplerInfos", 2);
            this._uniformBuffer.addUniform("vRefractionInfos", 4);
            this._uniformBuffer.addUniform("vReflectionInfos", 2);
            this._uniformBuffer.addUniform("vBumpInfos", 3);
            this._uniformBuffer.addUniform("albedoMatrix", 16);
            this._uniformBuffer.addUniform("ambientMatrix", 16);
            this._uniformBuffer.addUniform("opacityMatrix", 16);
            this._uniformBuffer.addUniform("emissiveMatrix", 16);
            this._uniformBuffer.addUniform("lightmapMatrix", 16);
            this._uniformBuffer.addUniform("reflectivityMatrix", 16);
            this._uniformBuffer.addUniform("microSurfaceSamplerMatrix", 16);
            this._uniformBuffer.addUniform("bumpMatrix", 16);
            this._uniformBuffer.addUniform("vTangentSpaceParams", 2);
            this._uniformBuffer.addUniform("refractionMatrix", 16);
            this._uniformBuffer.addUniform("reflectionMatrix", 16);

            this._uniformBuffer.addUniform("vReflectionColor", 3);
            this._uniformBuffer.addUniform("vAlbedoColor", 4);
            this._uniformBuffer.addUniform("vLightingIntensity", 4);

            this._uniformBuffer.addUniform("vRefractionMicrosurfaceInfos", 3);
            this._uniformBuffer.addUniform("vReflectionMicrosurfaceInfos", 3);
            this._uniformBuffer.addUniform("vReflectivityColor", 4);
            this._uniformBuffer.addUniform("vEmissiveColor", 3);

            this._uniformBuffer.addUniform("pointSize", 1);
            this._uniformBuffer.create();
        }


        public unbind(): void {
            if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("reflectionSampler", null);
            }

            if (this._refractionTexture && this._refractionTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("refractionSampler", null);
            }

            super.unbind();
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
            this._activeEffect.setMatrix("world", world);
        }

        public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
            var scene = this.getScene();

            var defines = <PBRMaterialDefines>subMesh._materialDefines;
            if (!defines) {
                return;
            }

            var effect = subMesh.effect;
            this._activeEffect = effect;

            // Matrices
            this.bindOnlyWorldMatrix(world);

            let mustRebind = this._mustRebind(scene, effect, mesh.visibility);

            // Bones
            MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

            if (mustRebind) {
                this._uniformBuffer.bindToEffect(effect, "Material");

                this.bindViewProjection(effect);
                var reflectionTexture = this._getReflectionTexture();
                var refractionTexture = this._getRefractionTexture();
                               
                if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync) {

                    // Texture uniforms
                    if (scene.texturesEnabled) {
                        if (this._albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vAlbedoInfos", this._albedoTexture.coordinatesIndex, this._albedoTexture.level);
                            MaterialHelper.BindTextureMatrix(this._albedoTexture, this._uniformBuffer, "albedo");
                        }

                        if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                            this._uniformBuffer.updateFloat3("vAmbientInfos", this._ambientTexture.coordinatesIndex, this._ambientTexture.level, this._ambientTextureStrength);
                            MaterialHelper.BindTextureMatrix(this._ambientTexture, this._uniformBuffer, "ambient");
                        }

                        if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                            MaterialHelper.BindTextureMatrix(this._opacityTexture, this._uniformBuffer, "opacity");
                        }

                        if (reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                            this._uniformBuffer.updateMatrix("reflectionMatrix", reflectionTexture.getReflectionTextureMatrix());
                            this._uniformBuffer.updateFloat2("vReflectionInfos", reflectionTexture.level, 0);

                            if (defines.USESPHERICALFROMREFLECTIONMAP) {
                                var polynomials = reflectionTexture.sphericalPolynomial;
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

                            this._uniformBuffer.updateFloat3("vReflectionMicrosurfaceInfos", 
                                reflectionTexture.getSize().width, 
                                reflectionTexture.lodGenerationScale,
                                reflectionTexture.lodGenerationOffset);
                        }

                        if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vEmissiveInfos", this._emissiveTexture.coordinatesIndex, this._emissiveTexture.level);
                            MaterialHelper.BindTextureMatrix(this._emissiveTexture, this._uniformBuffer, "emissive");
                        }

                        if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vLightmapInfos", this._lightmapTexture.coordinatesIndex, this._lightmapTexture.level);
                            MaterialHelper.BindTextureMatrix(this._lightmapTexture, this._uniformBuffer, "lightmap");
                        }

                        if (StandardMaterial.SpecularTextureEnabled) {
                            if (this._metallicTexture) {
                                this._uniformBuffer.updateFloat3("vReflectivityInfos", this._metallicTexture.coordinatesIndex, this._metallicTexture.level, this._ambientTextureStrength);
                                MaterialHelper.BindTextureMatrix(this._metallicTexture, this._uniformBuffer, "reflectivity");
                            }
                            else if (this._reflectivityTexture) {
                                this._uniformBuffer.updateFloat3("vReflectivityInfos", this._reflectivityTexture.coordinatesIndex, this._reflectivityTexture.level, 1.0);
                                MaterialHelper.BindTextureMatrix(this._reflectivityTexture, this._uniformBuffer, "reflectivity");
                            }

                            if (this._microSurfaceTexture) {
                                this._uniformBuffer.updateFloat2("vMicroSurfaceSamplerInfos", this._microSurfaceTexture.coordinatesIndex, this._microSurfaceTexture.level);
                                MaterialHelper.BindTextureMatrix(this._microSurfaceTexture, this._uniformBuffer, "microSurfaceSampler");
                            }
                        }

                        if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled && !this._disableBumpMap) {
                            this._uniformBuffer.updateFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, this._bumpTexture.level, this._parallaxScaleBias);
                            MaterialHelper.BindTextureMatrix(this._bumpTexture, this._uniformBuffer, "bump");

                            if (scene._mirroredCameraPosition) {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? 1.0 : -1.0, this._invertNormalMapY ? 1.0 : -1.0);
                            } else {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? -1.0 : 1.0, this._invertNormalMapY ? -1.0 : 1.0);
                            }
                        }

                        if (refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                            this._uniformBuffer.updateMatrix("refractionMatrix", refractionTexture.getReflectionTextureMatrix());

                            var depth = 1.0;
                            if (!refractionTexture.isCube) {
                                if ((<any>refractionTexture).depth) {
                                    depth = (<any>refractionTexture).depth;
                                }
                            }
                            this._uniformBuffer.updateFloat4("vRefractionInfos", refractionTexture.level, this._indexOfRefraction, depth, this._invertRefractionY ? -1 : 1);
                            this._uniformBuffer.updateFloat3("vRefractionMicrosurfaceInfos", 
                                refractionTexture.getSize().width, 
                                refractionTexture.lodGenerationScale,
                                refractionTexture.lodGenerationOffset);
                        }
                    }

                    // Point size
                    if (this.pointsCloud) {
                        this._uniformBuffer.updateFloat("pointSize", this.pointSize);
                    }

                    // Colors
                    if (defines.METALLICWORKFLOW) {
                        PBRMaterial._scaledReflectivity.r = (this._metallic === undefined || this._metallic === null) ? 1 : this._metallic;
                        PBRMaterial._scaledReflectivity.g = (this._roughness === undefined || this._roughness === null) ? 1 : this._roughness;
                        this._uniformBuffer.updateColor4("vReflectivityColor", PBRMaterial._scaledReflectivity, 0);
                    }
                    else {
                        this._uniformBuffer.updateColor4("vReflectivityColor", this._reflectivityColor, this._microSurface);
                    }

                    this._uniformBuffer.updateColor3("vEmissiveColor", this._emissiveColor);
                    this._uniformBuffer.updateColor3("vReflectionColor", this._reflectionColor);
                    this._uniformBuffer.updateColor4("vAlbedoColor", this._albedoColor, this.alpha * mesh.visibility);


                    // Misc
                    this._lightingInfos.x = this._directIntensity;
                    this._lightingInfos.y = this._emissiveIntensity;
                    this._lightingInfos.z = this._environmentIntensity;
                    this._lightingInfos.w = this._specularIntensity;

                    this._uniformBuffer.updateVector4("vLightingIntensity", this._lightingInfos);
                }

                // Textures
                if (scene.texturesEnabled) {
                    if (this._albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                        this._uniformBuffer.setTexture("albedoSampler", this._albedoTexture);
                    }

                    if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                        this._uniformBuffer.setTexture("ambientSampler", this._ambientTexture);
                    }

                    if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                        this._uniformBuffer.setTexture("opacitySampler", this._opacityTexture);
                    }

                    if (reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                        if (defines.LODBASEDMICROSFURACE) {
                            this._uniformBuffer.setTexture("reflectionSampler", reflectionTexture);
                        }
                        else {
                            this._uniformBuffer.setTexture("reflectionSampler", reflectionTexture._lodTextureMid || reflectionTexture);
                            this._uniformBuffer.setTexture("reflectionSamplerLow", reflectionTexture._lodTextureLow || reflectionTexture);
                            this._uniformBuffer.setTexture("reflectionSamplerHigh", reflectionTexture._lodTextureHigh || reflectionTexture);
                        }
                    }

                    if (defines.ENVIRONMENTBRDF) {
                        this._uniformBuffer.setTexture("environmentBrdfSampler", this._environmentBRDFTexture);
                    }

                    if (refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        if (defines.LODBASEDMICROSFURACE) {
                            this._uniformBuffer.setTexture("refractionSampler", refractionTexture);
                        }
                        else {
                            this._uniformBuffer.setTexture("refractionSampler", refractionTexture._lodTextureMid || refractionTexture);
                            this._uniformBuffer.setTexture("refractionSamplerLow", refractionTexture._lodTextureLow || refractionTexture);
                            this._uniformBuffer.setTexture("refractionSamplerHigh", refractionTexture._lodTextureHigh || refractionTexture);
                        }
                    }

                    if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                        this._uniformBuffer.setTexture("emissiveSampler", this._emissiveTexture);
                    }

                    if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                        this._uniformBuffer.setTexture("lightmapSampler", this._lightmapTexture);
                    }

                    if (StandardMaterial.SpecularTextureEnabled) {
                        if (this._metallicTexture) {
                            this._uniformBuffer.setTexture("reflectivitySampler", this._metallicTexture);
                        }
                        else if (this._reflectivityTexture) {
                            this._uniformBuffer.setTexture("reflectivitySampler", this._reflectivityTexture);
                        }

                        if (this._microSurfaceTexture) {
                            this._uniformBuffer.setTexture("microSurfaceSampler", this._microSurfaceTexture);
                        }
                    }

                    if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled && !this._disableBumpMap) {
                        this._uniformBuffer.setTexture("bumpSampler", this._bumpTexture);
                    }
                }

                // Clip plane
                MaterialHelper.BindClipPlane(this._activeEffect, scene);

                // Colors
                scene.ambientColor.multiplyToRef(this._ambientColor, this._globalAmbientColor);

                var eyePosition = scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.globalPosition;
                var invertNormal = (scene.useRightHandedSystem === (scene._mirroredCameraPosition != null));
                effect.setFloat4("vEyePosition",
                    eyePosition.x,
                    eyePosition.y,
                    eyePosition.z,
                    invertNormal ? -1 : 1);
                effect.setColor3("vAmbientColor", this._globalAmbientColor);
            }

            if (mustRebind || !this.isFrozen) {
                // Lights
                if (scene.lightsEnabled && !this._disableLighting) {
                    MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this._maxSimultaneousLights, this._usePhysicalLightFalloff);
                }

                // View
                if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE || reflectionTexture) {
                    this.bindView(effect);
                }

                // Fog
                MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

                // Morph targets
                if (defines.NUM_MORPH_INFLUENCERS) {
                    MaterialHelper.BindMorphTargetParameters(mesh, this._activeEffect);
                }

                // image processing
                this._imageProcessingConfiguration.bind(this._activeEffect);

                // Log. depth
                MaterialHelper.BindLogDepth(defines, this._activeEffect, scene);
            }

            this._uniformBuffer.update();

            this._afterBind(mesh);

            scene = null;
        }

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

            if (this._refractionTexture && this._refractionTexture.animations && this._refractionTexture.animations.length > 0) {
                results.push(this._refractionTexture);
            }

            return results;
        }

        private _getReflectionTexture(): BaseTexture {
            if (this._reflectionTexture) {
                return this._reflectionTexture;
            }

            return this.getScene().environmentTexture;
        }

        private _getRefractionTexture(): BaseTexture {
            if (this._refractionTexture) {
                return this._refractionTexture;
            }

            if (this._linkRefractionWithTransparency) {
                return this.getScene().environmentTexture;
            }

            return null;
        }

        public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void {
            if (forceDisposeTextures) {
                if (this._albedoTexture) {
                    this._albedoTexture.dispose();
                }

                if (this._ambientTexture) {
                    this._ambientTexture.dispose();
                }

                if (this._opacityTexture) {
                    this._opacityTexture.dispose();
                }

                if (this._reflectionTexture) {
                    this._reflectionTexture.dispose();
                }

                if (this._environmentBRDFTexture) {
                    this._environmentBRDFTexture.dispose();
                }

                if (this._emissiveTexture) {
                    this._emissiveTexture.dispose();
                }

                if (this._metallicTexture) {
                    this._metallicTexture.dispose();
                }

                if (this._reflectivityTexture) {
                    this._reflectivityTexture.dispose();
                }

                if (this._bumpTexture) {
                    this._bumpTexture.dispose();
                }

                if (this._lightmapTexture) {
                    this._lightmapTexture.dispose();
                }

                if (this._refractionTexture) {
                    this._refractionTexture.dispose();
                }
            }

            this._renderTargets.dispose();

            if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
                this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
            }

            super.dispose(forceDisposeEffect, forceDisposeTextures);
        }
    }
}