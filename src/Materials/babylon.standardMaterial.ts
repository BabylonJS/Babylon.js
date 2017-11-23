module BABYLON {
   export class StandardMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
        public MAINUV1 = false;
        public MAINUV2 = false;
        public DIFFUSE = false;
        public DIFFUSEDIRECTUV = 0;
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
        public PARALLAXOCCLUSION = false;
        public SPECULAROVERALPHA = false;
        public CLIPPLANE = false;
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
        public UV1 = false;
        public UV2 = false;
        public VERTEXCOLOR = false;
        public VERTEXALPHA = false;
        public NUM_BONE_INFLUENCERS = 0;
        public BonesPerMesh = 0;
        public INSTANCES = false;
        public GLOSSINESS = false;
        public ROUGHNESS = false;
        public EMISSIVEASILLUMINATION = false;
        public LINKEMISSIVEWITHDIFFUSE = false;
        public REFLECTIONFRESNELFROMSPECULAR = false;
        public LIGHTMAP = false;
        public LIGHTMAPDIRECTUV = 0;
        public USELIGHTMAPASSHADOWMAP = false;
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
        public LOGARITHMICDEPTH = false;
        public REFRACTION = false;
        public REFRACTIONMAP_3D = false;
        public REFLECTIONOVERALPHA = false;
        public TWOSIDEDLIGHTING = false;
        public SHADOWFLOAT = false;
        public MORPHTARGETS = false;
        public MORPHTARGETS_NORMAL = false;
        public MORPHTARGETS_TANGENT = false;
        public NUM_MORPH_INFLUENCERS = 0;
        public NONUNIFORMSCALING = false; // https://playground.babylonjs.com#V6DWIH
        public PREMULTIPLYALPHA = false; // https://playground.babylonjs.com#LNVJJ7

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

        constructor() {
            super();
            this.rebuild();
        }

        public setReflectionMode(modeToEnable: string) {
            var modes = [
                            "REFLECTIONMAP_CUBIC", "REFLECTIONMAP_EXPLICIT", "REFLECTIONMAP_PLANAR",
                            "REFLECTIONMAP_PROJECTION", "REFLECTIONMAP_PROJECTION", "REFLECTIONMAP_SKYBOX",
                            "REFLECTIONMAP_SPHERICAL", "REFLECTIONMAP_EQUIRECTANGULAR", "REFLECTIONMAP_EQUIRECTANGULAR_FIXED",
                            "REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED"
                        ];

            for (var mode of modes) {
                (<any>this)[mode] = (mode === modeToEnable);
            }
        }
    }

    export class StandardMaterial extends PushMaterial {
        @serializeAsTexture("diffuseTexture")
        private _diffuseTexture: Nullable<BaseTexture>;;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public diffuseTexture: Nullable<BaseTexture>;;

        @serializeAsTexture("ambientTexture")
        private _ambientTexture: Nullable<BaseTexture>;;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public ambientTexture: Nullable<BaseTexture>;;

        @serializeAsTexture("opacityTexture")
        private _opacityTexture: Nullable<BaseTexture>;;        
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public opacityTexture: Nullable<BaseTexture>;;    

        @serializeAsTexture("reflectionTexture")
        private _reflectionTexture: Nullable<BaseTexture>;;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public reflectionTexture: Nullable<BaseTexture>;        

        @serializeAsTexture("emissiveTexture")
        private _emissiveTexture: Nullable<BaseTexture>;;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public emissiveTexture: Nullable<BaseTexture>;;     

        @serializeAsTexture("specularTexture")
        private _specularTexture: Nullable<BaseTexture>;;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public specularTexture: Nullable<BaseTexture>;;             

        @serializeAsTexture("bumpTexture")
        private _bumpTexture: Nullable<BaseTexture>;;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public bumpTexture: Nullable<BaseTexture>;;         

        @serializeAsTexture("lightmapTexture")
        private _lightmapTexture: Nullable<BaseTexture>;;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public lightmapTexture: Nullable<BaseTexture>;;            

        @serializeAsTexture("refractionTexture")
        private _refractionTexture: Nullable<BaseTexture>;;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public refractionTexture: Nullable<BaseTexture>;;   

        @serializeAsColor3("ambient")
        public ambientColor = new Color3(0, 0, 0);

        @serializeAsColor3("diffuse")
        public diffuseColor = new Color3(1, 1, 1);

        @serializeAsColor3("specular")
        public specularColor = new Color3(1, 1, 1);

        @serializeAsColor3("emissive")
        public emissiveColor = new Color3(0, 0, 0);

        @serialize()
        public specularPower = 64;

        @serialize("useAlphaFromDiffuseTexture")
        private _useAlphaFromDiffuseTexture = false;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public useAlphaFromDiffuseTexture: boolean;      

        @serialize("useEmissiveAsIllumination")
        private _useEmissiveAsIllumination = false;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public useEmissiveAsIllumination: boolean;           
      
        @serialize("linkEmissiveWithDiffuse")
        private _linkEmissiveWithDiffuse = false;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public linkEmissiveWithDiffuse: boolean;                    

        @serialize("useSpecularOverAlpha")
        private _useSpecularOverAlpha = false;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public useSpecularOverAlpha: boolean;               

        @serialize("useReflectionOverAlpha")
        private _useReflectionOverAlpha = false;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public useReflectionOverAlpha: boolean;               

        @serialize("disableLighting")
        private _disableLighting = false;
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public disableLighting: boolean;

        @serialize("useParallax")
        private _useParallax = false;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public useParallax: boolean;            

        @serialize("useParallaxOcclusion")
        private _useParallaxOcclusion = false;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public useParallaxOcclusion: boolean;                  

        @serialize()
        public parallaxScaleBias = 0.05;

        @serialize("roughness")
        private _roughness = 0;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public roughness: number;            

        @serialize()
        public indexOfRefraction = 0.98;

        @serialize()
        public invertRefractionY = true;

        @serialize("useLightmapAsShadowmap")
        private _useLightmapAsShadowmap = false;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public useLightmapAsShadowmap: boolean;             

        // Fresnel
        @serializeAsFresnelParameters("diffuseFresnelParameters")
        private _diffuseFresnelParameters: FresnelParameters;
        @expandToProperty("_markAllSubMeshesAsFresnelDirty")
        public diffuseFresnelParameters: FresnelParameters;            

        @serializeAsFresnelParameters("opacityFresnelParameters")
        private _opacityFresnelParameters: FresnelParameters;
        @expandToProperty("_markAllSubMeshesAsFresnelDirty")
        public opacityFresnelParameters: FresnelParameters;            
           

        @serializeAsFresnelParameters("reflectionFresnelParameters")
        private _reflectionFresnelParameters: FresnelParameters;
        @expandToProperty("_markAllSubMeshesAsFresnelDirty")
        public reflectionFresnelParameters: FresnelParameters;             

        @serializeAsFresnelParameters("refractionFresnelParameters")
        private _refractionFresnelParameters: FresnelParameters;
        @expandToProperty("_markAllSubMeshesAsFresnelDirty")
        public refractionFresnelParameters: FresnelParameters;           

        @serializeAsFresnelParameters("emissiveFresnelParameters")
        private _emissiveFresnelParameters: FresnelParameters;
        @expandToProperty("_markAllSubMeshesAsFresnelDirty")
        public emissiveFresnelParameters: FresnelParameters;            

        @serialize("useReflectionFresnelFromSpecular")
        private _useReflectionFresnelFromSpecular = false;    
        @expandToProperty("_markAllSubMeshesAsFresnelDirty")
        public useReflectionFresnelFromSpecular: boolean;                 

        @serialize("useGlossinessFromSpecularMapAlpha")
        private _useGlossinessFromSpecularMapAlpha = false;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public useGlossinessFromSpecularMapAlpha: boolean;           
  
        @serialize("maxSimultaneousLights")
        private _maxSimultaneousLights = 4;
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public maxSimultaneousLights: number;                   

        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        @serialize("invertNormalMapX")
        private _invertNormalMapX = false;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public invertNormalMapX: boolean;

        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        @serialize("invertNormalMapY")
        private _invertNormalMapY = false;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public invertNormalMapY: boolean;

        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        @serialize("twoSidedLighting")
        private _twoSidedLighting = false;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public twoSidedLighting: boolean;     

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
        };
        /**
         * Sets wether tonemapping is enabled or not
         */
        public set cameraToneMappingEnabled(value: boolean) {
            this._imageProcessingConfiguration.toneMappingEnabled = value;
        };

        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        public get cameraExposure(): number {
            return this._imageProcessingConfiguration.exposure;
        };
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        public set cameraExposure(value: number) {
            this._imageProcessingConfiguration.exposure = value;
        };
        
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
        public set cameraColorGradingTexture(value: Nullable<BaseTexture> ) {
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

        public customShaderNameResolve: (shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: StandardMaterialDefines) => string;

        protected _renderTargets = new SmartArray<RenderTargetTexture>(16);
        protected _worldViewProjectionMatrix = Matrix.Zero();
        protected _globalAmbientColor = new Color3(0, 0, 0);

        protected _useLogarithmicDepth: boolean;

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
        }

        public getClassName(): string {
            return "StandardMaterial";
        }        

        @serialize()
        public get useLogarithmicDepth(): boolean {
            return this._useLogarithmicDepth;
        }

        public set useLogarithmicDepth(value: boolean) {
            this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;

            this._markAllSubMeshesAsMiscDirty();
        }

        public needAlphaBlending(): boolean {
            return (this.alpha < 1.0) || (this._opacityTexture != null) || this._shouldUseAlphaFromDiffuseTexture() || this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled;
        }

        public needAlphaTesting(): boolean {
            return this._diffuseTexture != null && this._diffuseTexture.hasAlpha;
        }

        protected _shouldUseAlphaFromDiffuseTexture(): boolean {
            return this._diffuseTexture != null && this._diffuseTexture.hasAlpha && this._useAlphaFromDiffuseTexture;
        }

        public getAlphaTestTexture(): Nullable<BaseTexture> {
            return this._diffuseTexture;
        }

        /**
         * Child classes can use it to update shaders
         */
        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances: boolean = false): boolean {            
            if (subMesh.effect && this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }

            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new StandardMaterialDefines();
            }

            var scene = this.getScene();
            var defines = <StandardMaterialDefines>subMesh._materialDefines;
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (defines._renderId === scene.getRenderId()) {
                    return true;
                }
            }

            var engine = scene.getEngine();

            // Lights
            defines._needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);

            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                defines.MAINUV1 = false;
                defines.MAINUV2 = false;
                if (scene.texturesEnabled) {
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

                            defines.ROUGHNESS = (this._roughness > 0);
                            defines.REFLECTIONOVERALPHA = this._useReflectionOverAlpha;
                            defines.INVERTCUBICMAP = (this._reflectionTexture.coordinatesMode === Texture.INVCUBIC_MODE);
                            defines.REFLECTIONMAP_3D = this._reflectionTexture.isCube;

                            switch (this._reflectionTexture.coordinatesMode) {
                                case Texture.CUBIC_MODE:
                                case Texture.INVCUBIC_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_CUBIC");
                                    break;
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
                            }
                        }
                    } else {
                        defines.REFLECTION = false;
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
                        // Bump texure can not be not blocking.
                        if (!this._bumpTexture.isReady()) {
                            return false;
                        } else {
                            MaterialHelper.PrepareDefinesForMergedUV(this._bumpTexture, defines, "BUMP");

                            defines.PARALLAX = this._useParallax;
                            defines.PARALLAXOCCLUSION = this._useParallaxOcclusion;
                        }
                    } else {
                        defines.BUMP = false;
                    }

                    if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        if (!this._refractionTexture.isReadyOrNotBlocking()) {
                            return false;
                        } else {
                            defines._needUVs = true;
                            defines.REFRACTION = true;

                            defines.REFRACTIONMAP_3D = this._refractionTexture.isCube;
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

                defines.PREMULTIPLYALPHA = (this.alphaMode === Engine.ALPHA_PREMULTIPLIED || this.alphaMode === Engine.ALPHA_PREMULTIPLIED_PORTERDUFF);
            }

            if (defines._areImageProcessingDirty) {
                if (!this._imageProcessingConfiguration.isReady()) {
                    return false;
                }

                this._imageProcessingConfiguration.prepareDefines(defines);
            }

            if (defines._areFresnelDirty) {
                if (StandardMaterial.FresnelEnabled) {
                    // Fresnel
                    if (this._diffuseFresnelParameters || this._opacityFresnelParameters ||
                        this._emissiveFresnelParameters || this._refractionFresnelParameters ||
                        this._reflectionFresnelParameters) {

                        defines.DIFFUSEFRESNEL = (this._diffuseFresnelParameters && this._diffuseFresnelParameters.isEnabled);

                        defines.OPACITYFRESNEL = (this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled);

                        defines.REFLECTIONFRESNEL = (this._reflectionFresnelParameters && this._reflectionFresnelParameters.isEnabled);

                        defines.REFLECTIONFRESNELFROMSPECULAR = this._useReflectionFresnelFromSpecular;

                        defines.REFRACTIONFRESNEL = (this._refractionFresnelParameters && this._refractionFresnelParameters.isEnabled) ;

                        defines.EMISSIVEFRESNEL = (this._emissiveFresnelParameters && this._emissiveFresnelParameters.isEnabled) ;

                        defines._needNormals = true;
                        defines.FRESNEL = true;
                    }
                } else {
                    defines.FRESNEL = false;
                }
            }

            // Misc.
            MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, defines);

            // Attribs
            MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true, true);

            // Values that need to be evaluated on every frame
            MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);

            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();

                // Fallbacks
                var fallbacks = new EffectFallbacks();
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

                if (defines.VERTEXCOLOR) {
                    attribs.push(VertexBuffer.ColorKind);
                }

                MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                MaterialHelper.PrepareAttributesForInstances(attribs, defines);
                MaterialHelper.PrepareAttributesForMorphTargets(attribs, mesh, defines);
                
                var shaderName = "default";
                
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                    "diffuseLeftColor", "diffuseRightColor", "opacityParts", "reflectionLeftColor", "reflectionRightColor", "emissiveLeftColor", "emissiveRightColor", "refractionLeftColor", "refractionRightColor",
                    "logarithmicDepthConstant", "vTangentSpaceParams"
                ];

                var samplers = ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler"]

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

                if (this.customShaderNameResolve) {
                    shaderName = this.customShaderNameResolve(shaderName, uniforms, uniformBuffers, samplers, defines);
                }

                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect(shaderName, <EffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights, maxSimultaneousMorphTargets: defines.NUM_MORPH_INFLUENCERS }
                }, engine), defines);
                
                this.buildUniformLayout();
            }

            if (!subMesh.effect || !subMesh.effect.isReady()) {
                return false;
            }

            defines._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }

        public buildUniformLayout(): void {
            // Order is important !
            this._uniformBuffer.addUniform("diffuseLeftColor", 4);
            this._uniformBuffer.addUniform("diffuseRightColor", 4);
            this._uniformBuffer.addUniform("opacityParts", 4);
            this._uniformBuffer.addUniform("reflectionLeftColor", 4);
            this._uniformBuffer.addUniform("reflectionRightColor", 4);
            this._uniformBuffer.addUniform("refractionLeftColor", 4);
            this._uniformBuffer.addUniform("refractionRightColor", 4);
            this._uniformBuffer.addUniform("emissiveLeftColor", 4);
            this._uniformBuffer.addUniform("emissiveRightColor", 4);

            this._uniformBuffer.addUniform("vDiffuseInfos", 2);
            this._uniformBuffer.addUniform("vAmbientInfos", 2);
            this._uniformBuffer.addUniform("vOpacityInfos", 2);
            this._uniformBuffer.addUniform("vReflectionInfos", 2);
            this._uniformBuffer.addUniform("vEmissiveInfos", 2);
            this._uniformBuffer.addUniform("vLightmapInfos", 2);
            this._uniformBuffer.addUniform("vSpecularInfos", 2);
            this._uniformBuffer.addUniform("vBumpInfos", 3);

            this._uniformBuffer.addUniform("diffuseMatrix", 16);
            this._uniformBuffer.addUniform("ambientMatrix", 16);
            this._uniformBuffer.addUniform("opacityMatrix", 16);
            this._uniformBuffer.addUniform("reflectionMatrix", 16);
            this._uniformBuffer.addUniform("emissiveMatrix", 16);
            this._uniformBuffer.addUniform("lightmapMatrix", 16);
            this._uniformBuffer.addUniform("specularMatrix", 16);
            this._uniformBuffer.addUniform("bumpMatrix", 16);
            this._uniformBuffer.addUniform("vTangentSpaceParams", 2);
            this._uniformBuffer.addUniform("refractionMatrix", 16);
            this._uniformBuffer.addUniform("vRefractionInfos", 4);
            this._uniformBuffer.addUniform("vSpecularColor", 4);
            this._uniformBuffer.addUniform("vEmissiveColor", 3);
            this._uniformBuffer.addUniform("vDiffuseColor", 4);
            this._uniformBuffer.addUniform("pointSize", 1);

            this._uniformBuffer.create();
        }

        public unbind(): void {
            if (this._activeEffect) {
                if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                    this._activeEffect.setTexture("reflection2DSampler", null);
                }

                if (this._refractionTexture && this._refractionTexture.isRenderTarget) {
                    this._activeEffect.setTexture("refraction2DSampler", null);
                }
            }

            super.unbind();
        }

        public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
            var scene = this.getScene();

            var defines = <StandardMaterialDefines>subMesh._materialDefines;
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

            let mustRebind = this._mustRebind(scene, effect, mesh.visibility);
            
            // Bones
            MaterialHelper.BindBonesParameters(mesh, effect);
            
            if (mustRebind) {
                this._uniformBuffer.bindToEffect(effect, "Material");
                
                this.bindViewProjection(effect);
                if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync) {

                    if (StandardMaterial.FresnelEnabled && defines.FRESNEL) {
                        // Fresnel
                        if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("diffuseLeftColor", this.diffuseFresnelParameters.leftColor, this.diffuseFresnelParameters.power);
                            this._uniformBuffer.updateColor4("diffuseRightColor", this.diffuseFresnelParameters.rightColor, this.diffuseFresnelParameters.bias);
                        }

                        if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("opacityParts", new Color3(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power);
                        }

                        if (this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("reflectionLeftColor", this.reflectionFresnelParameters.leftColor, this.reflectionFresnelParameters.power);
                            this._uniformBuffer.updateColor4("reflectionRightColor", this.reflectionFresnelParameters.rightColor, this.reflectionFresnelParameters.bias);
                        }

                        if (this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("refractionLeftColor", this.refractionFresnelParameters.leftColor, this.refractionFresnelParameters.power);
                            this._uniformBuffer.updateColor4("refractionRightColor", this.refractionFresnelParameters.rightColor, this.refractionFresnelParameters.bias);
                        }

                        if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                            this._uniformBuffer.updateColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                        }
                    }

                    // Textures     
                    if (scene.texturesEnabled) {
                        if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                            MaterialHelper.BindTextureMatrix(this._diffuseTexture, this._uniformBuffer, "diffuse");
                        }

                        if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vAmbientInfos", this._ambientTexture.coordinatesIndex, this._ambientTexture.level);
                            MaterialHelper.BindTextureMatrix(this._ambientTexture, this._uniformBuffer, "ambient");
                        }

                        if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                            MaterialHelper.BindTextureMatrix(this._opacityTexture, this._uniformBuffer, "opacity");
                        }

                        if (this._reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vReflectionInfos", this._reflectionTexture.level, this.roughness);
                            this._uniformBuffer.updateMatrix("reflectionMatrix", this._reflectionTexture.getReflectionTextureMatrix());
                        }

                        if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vEmissiveInfos", this._emissiveTexture.coordinatesIndex, this._emissiveTexture.level);
                            MaterialHelper.BindTextureMatrix(this._emissiveTexture, this._uniformBuffer, "emissive");
                        }

                        if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vLightmapInfos", this._lightmapTexture.coordinatesIndex, this._lightmapTexture.level);
                            MaterialHelper.BindTextureMatrix(this._lightmapTexture, this._uniformBuffer, "lightmap");
                        }

                        if (this._specularTexture && StandardMaterial.SpecularTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vSpecularInfos", this._specularTexture.coordinatesIndex, this._specularTexture.level);
                            MaterialHelper.BindTextureMatrix(this._specularTexture, this._uniformBuffer, "specular");
                        }

                        if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled) {
                            this._uniformBuffer.updateFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, 1.0 / this._bumpTexture.level, this.parallaxScaleBias);
                            MaterialHelper.BindTextureMatrix(this._bumpTexture, this._uniformBuffer, "bump");

                            if (scene._mirroredCameraPosition) {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? 1.0 : -1.0, this._invertNormalMapY ? 1.0 : -1.0);
                            } else {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? -1.0 : 1.0, this._invertNormalMapY ? -1.0 : 1.0);
                            }
                        }

                        if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                            var depth = 1.0;
                            if (!this._refractionTexture.isCube) {
                                this._uniformBuffer.updateMatrix("refractionMatrix", this._refractionTexture.getReflectionTextureMatrix());

                                if ((<any>this._refractionTexture).depth) {
                                    depth = (<any>this._refractionTexture).depth;
                                }
                            }
                            this._uniformBuffer.updateFloat4("vRefractionInfos", this._refractionTexture.level, this.indexOfRefraction, depth, this.invertRefractionY ? -1 : 1);
                        }                    
                    }

                    // Point size
                    if (this.pointsCloud) {
                        this._uniformBuffer.updateFloat("pointSize", this.pointSize);
                    }

                    if (defines.SPECULARTERM) {
                        this._uniformBuffer.updateColor4("vSpecularColor", this.specularColor, this.specularPower);
                    }
                    this._uniformBuffer.updateColor3("vEmissiveColor", this.emissiveColor);

                    // Diffuse
                    this._uniformBuffer.updateColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
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
                        var depth = 1.0;
                        if (this._refractionTexture.isCube) {
                            effect.setTexture("refractionCubeSampler", this._refractionTexture);
                        } else {
                            effect.setTexture("refraction2DSampler", this._refractionTexture);
                        }
                    }
                }

                // Clip plane
                MaterialHelper.BindClipPlane(effect, scene);

                // Colors
                scene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);

                MaterialHelper.BindEyePosition(effect, scene);
                effect.setColor3("vAmbientColor", this._globalAmbientColor);
            }

            if (mustRebind || !this.isFrozen) {
                // Lights
                if (scene.lightsEnabled && !this._disableLighting) {
                    MaterialHelper.BindLights(scene, mesh, effect, defines, this._maxSimultaneousLights);
                }

                // View
                if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE || this._reflectionTexture || this._refractionTexture) {
                    this.bindView(effect);
                }
                
                // Fog
                MaterialHelper.BindFogParameters(scene, mesh, effect);

                // Morph targets
                if (defines.NUM_MORPH_INFLUENCERS) {
                    MaterialHelper.BindMorphTargetParameters(mesh, effect);
                }

                // Log. depth
                MaterialHelper.BindLogDepth(defines, effect, scene);

                // image processing
                if (!this._imageProcessingConfiguration.applyByPostProcess) {
                    this._imageProcessingConfiguration.bind(this._activeEffect);
                }
            }

            this._uniformBuffer.update();
            this._afterBind(mesh, this._activeEffect);
        }

        public getAnimatables(): IAnimatable[] {
            var results = [];

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

        public getActiveTextures(): BaseTexture[] {
            var activeTextures = super.getActiveTextures();

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

        public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void {
            if (forceDisposeTextures) {
                if (this._diffuseTexture) {
                    this._diffuseTexture.dispose();
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

                if (this._emissiveTexture) {
                    this._emissiveTexture.dispose();
                }

                if (this._specularTexture) {
                    this._specularTexture.dispose();
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

            if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
                this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
            }

            super.dispose(forceDisposeEffect, forceDisposeTextures);
        }

        public clone(name: string): StandardMaterial {
            var result = SerializationHelper.Clone(() => new StandardMaterial(name, this.getScene()), this);

            result.name = name;
            result.id = name;

            return result;
        }

        public serialize(): any {
            return SerializationHelper.Serialize(this);
        }

        // Statics
        public static Parse(source: any, scene: Scene, rootUrl: string): StandardMaterial {
            return SerializationHelper.Parse(() => new StandardMaterial(source.name, scene), source, scene, rootUrl);
        }

        // Flags used to enable or disable a type of texture for all Standard Materials
        static _DiffuseTextureEnabled = true;
        public static get DiffuseTextureEnabled(): boolean {
            return StandardMaterial._DiffuseTextureEnabled;
        }
        public static set DiffuseTextureEnabled(value: boolean) {
            if (StandardMaterial._DiffuseTextureEnabled === value) {
                return;
            }

            StandardMaterial._DiffuseTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }


        static _AmbientTextureEnabled = true;
        public static get AmbientTextureEnabled(): boolean {
            return StandardMaterial._AmbientTextureEnabled;
        }
        public static set AmbientTextureEnabled(value: boolean) {
            if (StandardMaterial._AmbientTextureEnabled === value) {
                return;
            }

            StandardMaterial._AmbientTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }

        static _OpacityTextureEnabled = true;
        public static get OpacityTextureEnabled(): boolean {
            return StandardMaterial._OpacityTextureEnabled;
        }
        public static set OpacityTextureEnabled(value: boolean) {
            if (StandardMaterial._OpacityTextureEnabled === value) {
                return;
            }

            StandardMaterial._OpacityTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }

        static _ReflectionTextureEnabled = true;
        public static get ReflectionTextureEnabled(): boolean {
            return StandardMaterial._ReflectionTextureEnabled;
        }
        public static set ReflectionTextureEnabled(value: boolean) {
            if (StandardMaterial._ReflectionTextureEnabled === value) {
                return;
            }

            StandardMaterial._ReflectionTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }        
        
        static _EmissiveTextureEnabled = true;
        public static get EmissiveTextureEnabled(): boolean {
            return StandardMaterial._EmissiveTextureEnabled;
        }
        public static set EmissiveTextureEnabled(value: boolean) {
            if (StandardMaterial._EmissiveTextureEnabled === value) {
                return;
            }

            StandardMaterial._EmissiveTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }       

        static _SpecularTextureEnabled = true;
        public static get SpecularTextureEnabled(): boolean {
            return StandardMaterial._SpecularTextureEnabled;
        }
        public static set SpecularTextureEnabled(value: boolean) {
            if (StandardMaterial._SpecularTextureEnabled === value) {
                return;
            }

            StandardMaterial._SpecularTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }     

        static _BumpTextureEnabled = true;
        public static get BumpTextureEnabled(): boolean {
            return StandardMaterial._BumpTextureEnabled;
        }
        public static set BumpTextureEnabled(value: boolean) {
            if (StandardMaterial._BumpTextureEnabled === value) {
                return;
            }

            StandardMaterial._BumpTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }         

        static _LightmapTextureEnabled = true;
        public static get LightmapTextureEnabled(): boolean {
            return StandardMaterial._LightmapTextureEnabled;
        }
        public static set LightmapTextureEnabled(value: boolean) {
            if (StandardMaterial._LightmapTextureEnabled === value) {
                return;
            }

            StandardMaterial._LightmapTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }           

        static _RefractionTextureEnabled = true;    
        public static get RefractionTextureEnabled(): boolean {
            return StandardMaterial._RefractionTextureEnabled;
        }
        public static set RefractionTextureEnabled(value: boolean) {
            if (StandardMaterial._RefractionTextureEnabled === value) {
                return;
            }

            StandardMaterial._RefractionTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }    

        static _ColorGradingTextureEnabled = true;
        public static get ColorGradingTextureEnabled(): boolean {
            return StandardMaterial._ColorGradingTextureEnabled;
        }
        public static set ColorGradingTextureEnabled(value: boolean) {
            if (StandardMaterial._ColorGradingTextureEnabled === value) {
                return;
            }

            StandardMaterial._ColorGradingTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }           

        static _FresnelEnabled = true;
        public static get FresnelEnabled(): boolean {
            return StandardMaterial._FresnelEnabled;
        }
        public static set FresnelEnabled(value: boolean) {
            if (StandardMaterial._FresnelEnabled === value) {
                return;
            }

            StandardMaterial._FresnelEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.FresnelDirtyFlag);
        }          
    }
} 
