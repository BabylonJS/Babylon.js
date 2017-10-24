/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON { 
	
   // old version of standard material updated every 3 months
	 export class StandardMaterialDefines_OldVer extends MaterialDefines implements IImageProcessingConfigurationDefines {
        public DIFFUSE = false;
        public AMBIENT = false;
        public OPACITY = false;
        public OPACITYRGB = false;
        public REFLECTION = false;
        public EMISSIVE = false;
        public SPECULAR = false;
        public BUMP = false;
        public PARALLAX = false;
        public PARALLAXOCCLUSION = false;
        public SPECULAROVERALPHA = false;
        public CLIPPLANE = false;
        public ALPHATEST = false;
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

    export class StandardMaterial_OldVer extends PushMaterial {
        @serializeAsTexture("diffuseTexture")
        private _diffuseTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public diffuseTexture: BaseTexture;

        @serializeAsTexture("ambientTexture")
        private _ambientTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public ambientTexture: BaseTexture;

        @serializeAsTexture("opacityTexture")
        private _opacityTexture: BaseTexture;        
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public opacityTexture: BaseTexture;    

        @serializeAsTexture("reflectionTexture")
        private _reflectionTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public reflectionTexture: BaseTexture;        

        @serializeAsTexture("emissiveTexture")
        private _emissiveTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public emissiveTexture: BaseTexture;     

        @serializeAsTexture("specularTexture")
        private _specularTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public specularTexture: BaseTexture;             

        @serializeAsTexture("bumpTexture")
        private _bumpTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public bumpTexture: BaseTexture;         

        @serializeAsTexture("lightmapTexture")
        private _lightmapTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public lightmapTexture: BaseTexture;            

        @serializeAsTexture("refractionTexture")
        private _refractionTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public refractionTexture: BaseTexture;   

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
        private _imageProcessingObserver: Observer<ImageProcessingConfiguration>;

        /**
         * Attaches a new image processing configuration to the Standard Material.
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
        public get cameraColorGradingTexture(): BaseTexture {
            return this._imageProcessingConfiguration.colorGradingTexture;
        }
        /**
         * Sets the Color Grading 2D Lookup Texture.
         */
        public set cameraColorGradingTexture(value: BaseTexture) {
            this._imageProcessingConfiguration.colorGradingTexture = value;
        }

        public customShaderNameResolve: (shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: StandardMaterialDefines_OldVer) => string;

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

                if (StandardMaterial_OldVer.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                    this._renderTargets.push(<RenderTargetTexture>this._reflectionTexture);
                }

                if (StandardMaterial_OldVer.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget) {
                    this._renderTargets.push(<RenderTargetTexture>this._refractionTexture);
                }

                return this._renderTargets;
            }
        }

        public getClassName(): string {
            return "StandardMaterial_OldVer";
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

        public getAlphaTestTexture(): BaseTexture {
            return this._diffuseTexture;
        }

        /**
         * Child classes can use it to update shaders
         */
        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {            
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }

            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new StandardMaterialDefines_OldVer();
            }

            var scene = this.getScene();
            var defines = <StandardMaterialDefines_OldVer>subMesh._materialDefines;
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
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && StandardMaterial_OldVer.DiffuseTextureEnabled) {
                        if (!this._diffuseTexture.isReadyOrNotBlocking()) {
                            return false;
                        } else {
                            defines._needUVs = true;
                            defines.DIFFUSE = true;
                        }
                    } else {
                        defines.DIFFUSE = false;
                    }

                    if (this._ambientTexture && StandardMaterial_OldVer.AmbientTextureEnabled) {
                        if (!this._ambientTexture.isReadyOrNotBlocking()) {
                            return false;
                        } else {
                            defines._needUVs = true;
                            defines.AMBIENT = true;
                        }
                    } else {
                        defines.AMBIENT = false;
                    }

                    if (this._opacityTexture && StandardMaterial_OldVer.OpacityTextureEnabled) {
                        if (!this._opacityTexture.isReadyOrNotBlocking()) {
                            return false;
                        } else {
                            defines._needUVs = true;
                            defines.OPACITY = true;
                            defines.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
                        }
                    } else {
                        defines.OPACITY = false;
                    }

                    if (this._reflectionTexture && StandardMaterial_OldVer.ReflectionTextureEnabled) {
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

                    if (this._emissiveTexture && StandardMaterial_OldVer.EmissiveTextureEnabled) {
                        if (!this._emissiveTexture.isReadyOrNotBlocking()) {
                            return false;
                        } else {
                            defines._needUVs = true;
                            defines.EMISSIVE = true;
                        }
                    } else {
                        defines.EMISSIVE = false;
                    }

                    if (this._lightmapTexture && StandardMaterial_OldVer.LightmapTextureEnabled) {
                        if (!this._lightmapTexture.isReadyOrNotBlocking()) {
                            return false;
                        } else {
                            defines._needUVs = true;
                            defines.LIGHTMAP = true;
                            defines.USELIGHTMAPASSHADOWMAP = this._useLightmapAsShadowmap;
                        }
                    } else {
                        defines.LIGHTMAP = false;
                    }

                    if (this._specularTexture && StandardMaterial_OldVer.SpecularTextureEnabled) {
                        if (!this._specularTexture.isReadyOrNotBlocking()) {
                            return false;
                        } else {
                            defines._needUVs = true;
                            defines.SPECULAR = true;
                            defines.GLOSSINESS = this._useGlossinessFromSpecularMapAlpha;
                        }
                    } else {
                        defines.SPECULAR = false;
                    }

                    if (scene.getEngine().getCaps().standardDerivatives && this._bumpTexture && StandardMaterial_OldVer.BumpTextureEnabled) {
                        // Bump texure can not be not blocking.
                        if (!this._bumpTexture.isReady()) {
                            return false;
                        } else {
                            defines._needUVs = true;
                            defines.BUMP = true;

                            defines.PARALLAX = this._useParallax;
                            defines.PARALLAXOCCLUSION = this._useParallaxOcclusion;
                        }
                    } else {
                        defines.BUMP = false;
                    }

                    if (this._refractionTexture && StandardMaterial_OldVer.RefractionTextureEnabled) {
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
            }

            if (defines._areImageProcessingDirty) {
                if (!this._imageProcessingConfiguration.isReady()) {
                    return false;
                }

                this._imageProcessingConfiguration.prepareDefines(defines);
            }

            if (defines._areFresnelDirty) {
                if (StandardMaterial_OldVer.FresnelEnabled) {
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

            if (!subMesh.effect.isReady()) {
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

            var defines = <StandardMaterialDefines_OldVer>subMesh._materialDefines;
            if (!defines) {
                return;
            }

            var effect = subMesh.effect;
            this._activeEffect = effect;

            // Matrices        
            this.bindOnlyWorldMatrix(world);

            // Bones
            MaterialHelper.BindBonesParameters(mesh, effect);
            if (this._mustRebind(scene, effect, mesh.visibility)) {
                this._uniformBuffer.bindToEffect(effect, "Material");
                
                this.bindViewProjection(effect);
                if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync) {

                    if (StandardMaterial_OldVer.FresnelEnabled && defines.FRESNEL) {
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
                        if (this._diffuseTexture && StandardMaterial_OldVer.DiffuseTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                            this._uniformBuffer.updateMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
                        }

                        if (this._ambientTexture && StandardMaterial_OldVer.AmbientTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vAmbientInfos", this._ambientTexture.coordinatesIndex, this._ambientTexture.level);
                            this._uniformBuffer.updateMatrix("ambientMatrix", this._ambientTexture.getTextureMatrix());
                        }

                        if (this._opacityTexture && StandardMaterial_OldVer.OpacityTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                            this._uniformBuffer.updateMatrix("opacityMatrix", this._opacityTexture.getTextureMatrix());
                        }

                        if (this._reflectionTexture && StandardMaterial_OldVer.ReflectionTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vReflectionInfos", this._reflectionTexture.level, this.roughness);
                            this._uniformBuffer.updateMatrix("reflectionMatrix", this._reflectionTexture.getReflectionTextureMatrix());
                        }

                        if (this._emissiveTexture && StandardMaterial_OldVer.EmissiveTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vEmissiveInfos", this._emissiveTexture.coordinatesIndex, this._emissiveTexture.level);
                            this._uniformBuffer.updateMatrix("emissiveMatrix", this._emissiveTexture.getTextureMatrix());
                        }

                        if (this._lightmapTexture && StandardMaterial_OldVer.LightmapTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vLightmapInfos", this._lightmapTexture.coordinatesIndex, this._lightmapTexture.level);
                            this._uniformBuffer.updateMatrix("lightmapMatrix", this._lightmapTexture.getTextureMatrix());
                        }

                        if (this._specularTexture && StandardMaterial_OldVer.SpecularTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vSpecularInfos", this._specularTexture.coordinatesIndex, this._specularTexture.level);
                            this._uniformBuffer.updateMatrix("specularMatrix", this._specularTexture.getTextureMatrix());
                        }

                        if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial_OldVer.BumpTextureEnabled) {
                            this._uniformBuffer.updateFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, 1.0 / this._bumpTexture.level, this.parallaxScaleBias);
                            this._uniformBuffer.updateMatrix("bumpMatrix", this._bumpTexture.getTextureMatrix());

                            if (scene._mirroredCameraPosition) {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? 1.0 : -1.0, this._invertNormalMapY ? 1.0 : -1.0);
                            } else {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? -1.0 : 1.0, this._invertNormalMapY ? -1.0 : 1.0);
                            }
                        }

                        if (this._refractionTexture && StandardMaterial_OldVer.RefractionTextureEnabled) {
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
                    if (this._diffuseTexture && StandardMaterial_OldVer.DiffuseTextureEnabled) {
                        effect.setTexture("diffuseSampler", this._diffuseTexture);
                    }

                    if (this._ambientTexture && StandardMaterial_OldVer.AmbientTextureEnabled) {
                        effect.setTexture("ambientSampler", this._ambientTexture);
                    }

                    if (this._opacityTexture && StandardMaterial_OldVer.OpacityTextureEnabled) {
                        effect.setTexture("opacitySampler", this._opacityTexture);
                    }

                    if (this._reflectionTexture && StandardMaterial_OldVer.ReflectionTextureEnabled) {
                        if (this._reflectionTexture.isCube) {
                            effect.setTexture("reflectionCubeSampler", this._reflectionTexture);
                        } else {
                            effect.setTexture("reflection2DSampler", this._reflectionTexture);
                        }
                    }

                    if (this._emissiveTexture && StandardMaterial_OldVer.EmissiveTextureEnabled) {
                        effect.setTexture("emissiveSampler", this._emissiveTexture);
                    }

                    if (this._lightmapTexture && StandardMaterial_OldVer.LightmapTextureEnabled) {
                        effect.setTexture("lightmapSampler", this._lightmapTexture);
                    }

                    if (this._specularTexture && StandardMaterial_OldVer.SpecularTextureEnabled) {
                        effect.setTexture("specularSampler", this._specularTexture);
                    }

                    if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial_OldVer.BumpTextureEnabled) {
                        effect.setTexture("bumpSampler", this._bumpTexture);
                    }

                    if (this._refractionTexture && StandardMaterial_OldVer.RefractionTextureEnabled) {
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

                effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
                effect.setColor3("vAmbientColor", this._globalAmbientColor);
            }

            if (this._mustRebind(scene, effect) || !this.isFrozen) {
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
                this._imageProcessingConfiguration.bind(this._activeEffect);
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

        public clone(name: string): StandardMaterial_OldVer {
            var result = SerializationHelper.Clone(() => new StandardMaterial_OldVer(name, this.getScene()), this);

            result.name = name;
            result.id = name;

            return result;
        }

        public serialize(): any {
            return SerializationHelper.Serialize(this);
        }

        // Statics
        public static Parse(source: any, scene: Scene, rootUrl: string): StandardMaterial_OldVer {
            return SerializationHelper.Parse(() => new StandardMaterial_OldVer(source.name, scene), source, scene, rootUrl);
        }

        // Flags used to enable or disable a type of texture for all Standard Materials
        static _DiffuseTextureEnabled = true;
        public static get DiffuseTextureEnabled(): boolean {
            return StandardMaterial_OldVer._DiffuseTextureEnabled;
        }
        public static set DiffuseTextureEnabled(value: boolean) {
            if (StandardMaterial_OldVer._DiffuseTextureEnabled === value) {
                return;
            }

            StandardMaterial_OldVer._DiffuseTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }


        static _AmbientTextureEnabled = true;
        public static get AmbientTextureEnabled(): boolean {
            return StandardMaterial_OldVer._AmbientTextureEnabled;
        }
        public static set AmbientTextureEnabled(value: boolean) {
            if (StandardMaterial_OldVer._AmbientTextureEnabled === value) {
                return;
            }

            StandardMaterial_OldVer._AmbientTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }

        static _OpacityTextureEnabled = true;
        public static get OpacityTextureEnabled(): boolean {
            return StandardMaterial_OldVer._OpacityTextureEnabled;
        }
        public static set OpacityTextureEnabled(value: boolean) {
            if (StandardMaterial_OldVer._OpacityTextureEnabled === value) {
                return;
            }

            StandardMaterial_OldVer._OpacityTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }

        static _ReflectionTextureEnabled = true;
        public static get ReflectionTextureEnabled(): boolean {
            return StandardMaterial_OldVer._ReflectionTextureEnabled;
        }
        public static set ReflectionTextureEnabled(value: boolean) {
            if (StandardMaterial_OldVer._ReflectionTextureEnabled === value) {
                return;
            }

            StandardMaterial_OldVer._ReflectionTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }        
        
        static _EmissiveTextureEnabled = true;
        public static get EmissiveTextureEnabled(): boolean {
            return StandardMaterial_OldVer._EmissiveTextureEnabled;
        }
        public static set EmissiveTextureEnabled(value: boolean) {
            if (StandardMaterial_OldVer._EmissiveTextureEnabled === value) {
                return;
            }

            StandardMaterial_OldVer._EmissiveTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }       

        static _SpecularTextureEnabled = true;
        public static get SpecularTextureEnabled(): boolean {
            return StandardMaterial_OldVer._SpecularTextureEnabled;
        }
        public static set SpecularTextureEnabled(value: boolean) {
            if (StandardMaterial_OldVer._SpecularTextureEnabled === value) {
                return;
            }

            StandardMaterial_OldVer._SpecularTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }     

        static _BumpTextureEnabled = true;
        public static get BumpTextureEnabled(): boolean {
            return StandardMaterial_OldVer._BumpTextureEnabled;
        }
        public static set BumpTextureEnabled(value: boolean) {
            if (StandardMaterial_OldVer._BumpTextureEnabled === value) {
                return;
            }

            StandardMaterial_OldVer._BumpTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }         

        static _LightmapTextureEnabled = true;
        public static get LightmapTextureEnabled(): boolean {
            return StandardMaterial_OldVer._LightmapTextureEnabled;
        }
        public static set LightmapTextureEnabled(value: boolean) {
            if (StandardMaterial_OldVer._LightmapTextureEnabled === value) {
                return;
            }

            StandardMaterial_OldVer._LightmapTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }           

        static _RefractionTextureEnabled = true;    
        public static get RefractionTextureEnabled(): boolean {
            return StandardMaterial_OldVer._RefractionTextureEnabled;
        }
        public static set RefractionTextureEnabled(value: boolean) {
            if (StandardMaterial_OldVer._RefractionTextureEnabled === value) {
                return;
            }

            StandardMaterial_OldVer._RefractionTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }    

        static _ColorGradingTextureEnabled = true;
        public static get ColorGradingTextureEnabled(): boolean {
            return StandardMaterial_OldVer._ColorGradingTextureEnabled;
        }
        public static set ColorGradingTextureEnabled(value: boolean) {
            if (StandardMaterial_OldVer._ColorGradingTextureEnabled === value) {
                return;
            }

            StandardMaterial_OldVer._ColorGradingTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }           

        static _FresnelEnabled = true;
        public static get FresnelEnabled(): boolean {
            return StandardMaterial_OldVer._FresnelEnabled;
        }
        public static set FresnelEnabled(value: boolean) {
            if (StandardMaterial_OldVer._FresnelEnabled === value) {
                return;
            }

            StandardMaterial_OldVer._FresnelEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.FresnelDirtyFlag);
        }          
    }

   
  export class CustomShaderStructure {
      
       public FragmentStore : string; 
       public VertexStore : string; 

       constructor(){

       }  
  }

  export class  ShaderSpecialParts{
 
    constructor(){}

    public Fragment_Begin:string;
    public Fragment_Definitions:string;
    public Fragment_MainBegin: string;
    
    // diffuseColor
    public Fragment_Custom_Diffuse: string;
    
    // alpha
    public Fragment_Custom_Alpha : string;

    public Fragment_Before_FragColor: string;

    public Vertex_Begin:string;
    public Vertex_Definitions:string;
    public Vertex_MainBegin: string;
    
    // positionUpdated
    public Vertex_Before_PositionUpdated:string;

    // normalUpdated
    public Vertex_Before_NormalUpdated : string;
  }

  export class ShaderForVer3_0 extends CustomShaderStructure {

       constructor() {
            super();
            
            this.VertexStore = "";
            
            this.FragmentStore = "#include<__decl__defaultFragment>\n\
#[Fragment_Begin]\n\
#extension GL_OES_standard_derivatives : enable\n\
#ifdef LOGARITHMICDEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define RECIPROCAL_PI2 0.15915494\n\
uniform vec3 vEyePosition;\n\
uniform vec3 vAmbientColor;\n\
\n\
varying vec3 vPositionW;\n\
#ifdef NORMAL\n\
varying vec3 vNormalW_helper;\n\
varying vec3 localNormal;\n\
varying vec3 localPosition;\n\
vec3 vNormalW;\n\
#endif\n\
#ifdef VERTEXCOLOR\n\
varying vec4 vColor;\n\
#endif\n\
\n\
#include<helperFunctions>\n\
\n\
#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\
#include<lightsFragmentFunctions>\n\
#include<shadowsFragmentFunctions>\n\
\n\
#ifdef DIFFUSE\n\
varying vec2 vDiffuseUV;\n\
uniform sampler2D diffuseSampler;\n\
#endif\n\
#ifdef AMBIENT\n\
varying vec2 vAmbientUV;\n\
uniform sampler2D ambientSampler;\n\
#endif\n\
#ifdef OPACITY\n\
varying vec2 vOpacityUV;\n\
uniform sampler2D opacitySampler;\n\
#endif\n\
#ifdef EMISSIVE\n\
varying vec2 vEmissiveUV;\n\
uniform sampler2D emissiveSampler;\n\
#endif\n\
#ifdef LIGHTMAP\n\
varying vec2 vLightmapUV;\n\
uniform sampler2D lightmapSampler;\n\
#endif\n\
#ifdef REFRACTION\n\
#ifdef REFRACTIONMAP_3D\n\
uniform samplerCube refractionCubeSampler;\n\
#else\n\
uniform sampler2D refraction2DSampler;\n\
#endif\n\
#endif\n\
#if defined(SPECULAR) && defined(SPECULARTERM)\n\
varying vec2 vSpecularUV;\n\
uniform sampler2D specularSampler;\n\
#endif\n\
\n\
#include<fresnelFunction>\n\
\n\
#ifdef REFLECTION\n\
#ifdef REFLECTIONMAP_3D\n\
uniform samplerCube reflectionCubeSampler;\n\
#else\n\
uniform sampler2D reflection2DSampler;\n\
#endif\n\
#ifdef REFLECTIONMAP_SKYBOX\n\
varying vec3 vPositionUVW;\n\
#else\n\
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\n\
varying vec3 vDirectionW;\n\
#endif\n\
#endif\n\
#include<reflectionFunction>\n\
#endif\n\
#include<imageProcessingDeclaration>\n\
#include<imageProcessingFunctions>\n\
\n\
#include<bumpFragmentFunctions>\n\
#include<clipPlaneFragmentDeclaration>\n\
#include<logDepthDeclaration>\n\
#include<fogFragmentDeclaration>\n\
\n\
#[Fragment_Definitions]\n\
\n\
void main(void) {\n\
\n\
vNormalW = vNormalW_helper;\n\
#[Fragment_MainBegin]\n\
\n\
#include<clipPlaneFragment>\n\
vec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\
\n\
vec4 baseColor=vec4(1.,1.,1.,1.);\n\
vec3 diffuseColor=vDiffuseColor.rgb;\n\
#[Fragment_Custom_Diffuse]\n\
\n\
float alpha=vDiffuseColor.a;\n\
#[Fragment_Custom_Alpha]\n\
\n\
#ifdef NORMAL\n\
vec3 normalW=normalize(vNormalW);\n\
#else\n\
vec3 normalW=vec3(1.0,1.0,1.0);\n\
#endif\n\
#include<bumpFragment>\n\
#ifdef TWOSIDEDLIGHTING\n\
normalW=gl_FrontFacing ? normalW : -normalW;\n\
#endif\n\
#ifdef DIFFUSE\n\
baseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n\
#ifdef ALPHATEST\n\
if (baseColor.a<0.4)\n\
discard;\n\
#endif\n\
#ifdef ALPHAFROMDIFFUSE\n\
alpha*=baseColor.a;\n\
#endif\n\
baseColor.rgb*=vDiffuseInfos.y;\n\
#endif\n\
#ifdef VERTEXCOLOR\n\
baseColor.rgb*=vColor.rgb;\n\
#endif\n\
\n\
vec3 baseAmbientColor=vec3(1.,1.,1.);\n\
#ifdef AMBIENT\n\
baseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n\
#endif\n\
\n\
#ifdef SPECULARTERM\n\
float glossiness=vSpecularColor.a;\n\
vec3 specularColor=vSpecularColor.rgb;\n\
#ifdef SPECULAR\n\
vec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\n\
specularColor=specularMapColor.rgb;\n\
#ifdef GLOSSINESS\n\
glossiness=glossiness*specularMapColor.a;\n\
#endif\n\
#endif\n\
#else\n\
float glossiness=0.;\n\
#endif\n\
\n\
vec3 diffuseBase=vec3(0.,0.,0.);\n\
lightingInfo info;\n\
#ifdef SPECULARTERM\n\
vec3 specularBase=vec3(0.,0.,0.);\n\
#endif\n\
float shadow=1.;\n\
#ifdef LIGHTMAP\n\
vec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n\
#endif\n\
#include<lightFragment>[0..maxSimultaneousLights]\n\
\n\
vec3 refractionColor=vec3(0.,0.,0.);\n\
#ifdef REFRACTION\n\
vec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n\
#ifdef REFRACTIONMAP_3D\n\
refractionVector.y=refractionVector.y*vRefractionInfos.w;\n\
if (dot(refractionVector,viewDirectionW)<1.0)\n\
{\n\
refractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n\
}\n\
#else\n\
vec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\n\
vec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\n\
refractionCoords.y=1.0-refractionCoords.y;\n\
refractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n\
#endif\n\
#endif\n\
\n\
vec3 reflectionColor=vec3(0.,0.,0.);\n\
#ifdef REFLECTION\n\
vec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n\
#ifdef REFLECTIONMAP_3D\n\
#ifdef ROUGHNESS\n\
float bias=vReflectionInfos.y;\n\
#ifdef SPECULARTERM\n\
#ifdef SPECULAR\n\
#ifdef GLOSSINESS\n\
bias*=(1.0-specularMapColor.a);\n\
#endif\n\
#endif\n\
#endif\n\
reflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n\
#else\n\
reflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n\
#endif\n\
#else\n\
vec2 coords=vReflectionUVW.xy;\n\
#ifdef REFLECTIONMAP_PROJECTION\n\
coords/=vReflectionUVW.z;\n\
#endif\n\
coords.y=1.0-coords.y;\n\
reflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n\
#endif\n\
#ifdef REFLECTIONFRESNEL\n\
float reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n\
#ifdef REFLECTIONFRESNELFROMSPECULAR\n\
#ifdef SPECULARTERM\n\
reflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n\
#else\n\
reflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n\
#endif\n\
#else\n\
reflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n\
#endif\n\
#endif\n\
#endif\n\
#ifdef REFRACTIONFRESNEL\n\
float refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\n\
refractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n\
#endif\n\
#ifdef OPACITY\n\
vec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n\
#ifdef OPACITYRGB\n\
opacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\n\
alpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n\
#else\n\
alpha*=opacityMap.a*vOpacityInfos.y;\n\
#endif\n\
#endif\n\
#ifdef VERTEXALPHA\n\
alpha*=vColor.a;\n\
#endif\n\
#ifdef OPACITYFRESNEL\n\
float opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\n\
alpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n\
#endif\n\
\n\
vec3 emissiveColor=vEmissiveColor;\n\
#ifdef EMISSIVE\n\
emissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n\
#endif\n\
#ifdef EMISSIVEFRESNEL\n\
float emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\n\
emissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n\
#endif\n\
\n\
#ifdef DIFFUSEFRESNEL\n\
float diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\n\
diffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n\
#endif\n\
\n\
#ifdef EMISSIVEASILLUMINATION\n\
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n\
#else\n\
#ifdef LINKEMISSIVEWITHDIFFUSE\n\
vec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n\
#else\n\
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n\
#endif\n\
#endif\n\
#ifdef SPECULARTERM\n\
vec3 finalSpecular=specularBase*specularColor;\n\
#ifdef SPECULAROVERALPHA\n\
alpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n\
#endif\n\
#else\n\
vec3 finalSpecular=vec3(0.0);\n\
#endif\n\
#ifdef REFLECTIONOVERALPHA\n\
alpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n\
#endif\n\
\n\
#ifdef EMISSIVEASILLUMINATION\n\
vec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n\
#else\n\
vec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n\
#endif\n\
\n\
#ifdef LIGHTMAP\n\
#ifndef LIGHTMAPEXCLUDED\n\
#ifdef USELIGHTMAPASSHADOWMAP\n\
color.rgb*=lightmapColor;\n\
#else\n\
color.rgb+=lightmapColor;\n\
#endif\n\
#endif\n\
#endif\n\
#include<logDepthFragment>\n\
#include<fogFragment>\n\
\n\
// Apply image processing if relevant. As this applies in linear space, \n\
// We first move from gamma to linear.\n\
#ifdef IMAGEPROCESSINGPOSTPROCESS\n\
	color.rgb = toLinearSpace(color.rgb);\n\
#else\n\
	#ifdef IMAGEPROCESSING\n\
		color.rgb = toLinearSpace(color.rgb);\n\
		color = applyImageProcessing(color);\n\
	#endif\n\
#endif\n\
\n\
#[Fragment_Before_FragColor]\n\
gl_FragColor=color;\n\
}";


this.VertexStore = "#include<__decl__defaultVertex>\n\
\n\
#[Vertex_Begin]\n\
\n\
attribute vec3 position;\n\
#ifdef NORMAL\n\
attribute vec3 normal;\n\
#endif\n\
#ifdef TANGENT\n\
attribute vec4 tangent;\n\
#endif\n\
#ifdef UV1\n\
attribute vec2 uv;\n\
#endif\n\
#ifdef UV2\n\
attribute vec2 uv2;\n\
#endif\n\
#ifdef VERTEXCOLOR\n\
attribute vec4 color;\n\
#endif\n\
#include<bonesDeclaration>\n\
\n\
#include<instancesDeclaration>\n\
#ifdef DIFFUSE\n\
varying vec2 vDiffuseUV;\n\
#endif\n\
#ifdef AMBIENT\n\
varying vec2 vAmbientUV;\n\
#endif\n\
#ifdef OPACITY\n\
varying vec2 vOpacityUV;\n\
#endif\n\
#ifdef EMISSIVE\n\
varying vec2 vEmissiveUV;\n\
#endif\n\
#ifdef LIGHTMAP\n\
varying vec2 vLightmapUV;\n\
#endif\n\
#if defined(SPECULAR) && defined(SPECULARTERM)\n\
varying vec2 vSpecularUV;\n\
#endif\n\
#ifdef BUMP\n\
varying vec2 vBumpUV;\n\
#endif\n\
\n\
varying vec3 localPosition;\n\
varying vec3 vPositionW;\n\
#ifdef NORMAL\n\
varying vec3 vNormalW_helper;\n\
varying vec3 localNormal;\n\
#endif\n\
#ifdef VERTEXCOLOR\n\
varying vec4 vColor;\n\
#endif\n\
#include<bumpVertexDeclaration>\n\
#include<clipPlaneVertexDeclaration>\n\
#include<fogVertexDeclaration>\n\
#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\
#include<morphTargetsVertexGlobalDeclaration>\n\
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n\
#ifdef REFLECTIONMAP_SKYBOX\n\
varying vec3 vPositionUVW;\n\
#endif\n\
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\n\
varying vec3 vDirectionW;\n\
#endif\n\
#include<logDepthDeclaration>\n\
\n\
#[Vertex_Definitions]\n\
\n\
void main(void) {\n\
    \n\
    #[Vertex_MainBegin]\n\
    \n\
vec3 positionUpdated=position;\n\
#ifdef NORMAL \n\
vec3 normalUpdated=normal;\n\
#endif\n\
#ifdef TANGENT\n\
vec4 tangentUpdated=tangent;\n\
#endif\n\
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n\
#ifdef REFLECTIONMAP_SKYBOX\n\
vPositionUVW=positionUpdated;\n\
#endif \n\
#include<instancesVertex>\n\
#include<bonesVertex>\n\
\n\
localPosition = positionUpdated;\n\
#[Vertex_Before_PositionUpdated]\n\
\n\
gl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\n\
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\n\
vPositionW=vec3(worldPos);\n\
#ifdef NORMAL\n\
\n\
#[Vertex_Before_NormalUpdated]\n\
\n\
localNormal = normalUpdated;\n\
vNormalW_helper=normalize(vec3(finalWorld*vec4(normalUpdated,0.0)));\n\
#endif\n\
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\n\
vDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n\
#endif\n\
\n\
#ifndef UV1\n\
vec2 uv=vec2(0.,0.);\n\
#endif\n\
#ifndef UV2\n\
vec2 uv2=vec2(0.,0.);\n\
#endif\n\
#ifdef DIFFUSE\n\
if (vDiffuseInfos.x == 0.)\n\
{\n\
vDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef AMBIENT\n\
if (vAmbientInfos.x == 0.)\n\
{\n\
vAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef OPACITY\n\
if (vOpacityInfos.x == 0.)\n\
{\n\
vOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef EMISSIVE\n\
if (vEmissiveInfos.x == 0.)\n\
{\n\
vEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef LIGHTMAP\n\
if (vLightmapInfos.x == 0.)\n\
{\n\
vLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#if defined(SPECULAR) && defined(SPECULARTERM)\n\
if (vSpecularInfos.x == 0.)\n\
{\n\
vSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef BUMP\n\
if (vBumpInfos.x == 0.)\n\
{\n\
vBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#include<bumpVertex>\n\
#include<clipPlaneVertex>\n\
#include<fogVertex>\n\
#include<shadowsVertex>[0..maxSimultaneousLights]\n\
#ifdef VERTEXCOLOR\n\
\n\
vColor=color;\n\
#endif\n\
#include<pointCloudVertex>\n\
#include<logDepthVertex>\n\
}";


       }

  }

 
   export class StandardShaderVersions{

        public static Ver3_0 = "3.0.0";

   } 

    export class CustomMaterial  extends StandardMaterial_OldVer {
         public static ShaderIndexer = 1;
         public CustomParts :  ShaderSpecialParts;
         public ShaderVersion : CustomShaderStructure ;
         _isCreatedShader : boolean;
         _createdShaderName : string;
         _customUniform : string[];
         _newUniforms : string[];
         _newUniformInstances : any[];
         _newSamplerInstances : Texture[];

         public AttachAfterBind(mesh:Mesh,effect:Effect){ 
             for(var el in this._newUniformInstances){
                 var ea = el.toString().split('-');
                 if(ea[0] == 'vec2') effect.setVector2(ea[1],this._newUniformInstances[el]);
                 else if(ea[0] == 'vec3') effect.setVector3(ea[1],this._newUniformInstances[el]);
                 else if(ea[0] == 'vec4') effect.setVector4(ea[1],this._newUniformInstances[el]);
                 else if(ea[0] == 'mat4') effect.setMatrix(ea[1],this._newUniformInstances[el]);
                 else if(ea[0] == 'float') effect.setFloat(ea[1],this._newUniformInstances[el]); 
             }

              for(var el in this._newSamplerInstances){ 
                 var ea = el.toString().split('-'); 
                if(ea[0] == 'sampler2D' && this._newSamplerInstances[el].isReady && this._newSamplerInstances[el].isReady())
                     effect.setTexture(ea[1],this._newSamplerInstances[el]); 
              }
         }

         public ReviewUniform(name:string, arr : string[] ) : string[]{
             if(name == "uniform")
              {
                  for(var ind in this._newUniforms)
                    if(this._customUniform[ind].indexOf('sampler')== -1) 
                        arr.push(this._newUniforms[ind]);
              }

                 if(name == "sampler")
              {
                   for(var ind in this._newUniforms)
                    if(this._customUniform[ind].indexOf('sampler')!= -1) 
                        arr.push(this._newUniforms[ind]);
              }

             return arr;
         }
         public Builder(shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: StandardMaterialDefines_OldVer) : string {
            
            if(this._isCreatedShader) return this._createdShaderName;
              this._isCreatedShader  = false;
            
            CustomMaterial.ShaderIndexer++;
            var name: string = name + "custom_" + CustomMaterial.ShaderIndexer;

            this.ReviewUniform("uniform",uniforms);
            this.ReviewUniform("sampler",samplers);
            

            var fn_afterBind = this._afterBind;
            this._afterBind = (m,e) => { 
                this.AttachAfterBind(m,e);
                try{fn_afterBind(m,e);}catch(e){};
            } ;

            BABYLON.Effect.ShadersStore[name+"VertexShader"] = this.ShaderVersion.VertexStore
            .replace('#[Vertex_Begin]',(this.CustomParts.Vertex_Begin ? this.CustomParts.Vertex_Begin : ""))
            .replace('#[Vertex_Definitions]',(this._customUniform? this._customUniform.join("\n"):"")+ (this.CustomParts.Vertex_Definitions ? this.CustomParts.Vertex_Definitions : ""))
            .replace('#[Vertex_MainBegin]',(this.CustomParts.Vertex_MainBegin ? this.CustomParts.Vertex_MainBegin : ""))
            .replace('#[Vertex_Before_PositionUpdated]',(this.CustomParts.Vertex_Before_PositionUpdated ? this.CustomParts.Vertex_Before_PositionUpdated : ""))
            .replace('#[Vertex_Before_NormalUpdated]',(this.CustomParts.Vertex_Before_NormalUpdated ? this.CustomParts.Vertex_Before_NormalUpdated : "")) ;

            BABYLON.Effect.ShadersStore[name+"PixelShader"] = this.ShaderVersion.FragmentStore
            .replace('#[Fragment_Begin]',(this.CustomParts.Fragment_Begin ? this.CustomParts.Fragment_Begin : ""))
            .replace('#[Fragment_MainBegin]',(this.CustomParts.Fragment_MainBegin  ? this.CustomParts.Fragment_MainBegin : ""))
            .replace('#[Fragment_Definitions]',(this._customUniform? this._customUniform.join("\n"):"")+(this.CustomParts.Fragment_Definitions ? this.CustomParts.Fragment_Definitions : ""))
            .replace('#[Fragment_Custom_Diffuse]',(this.CustomParts.Fragment_Custom_Diffuse ? this.CustomParts.Fragment_Custom_Diffuse : ""))
            .replace('#[Fragment_Custom_Alpha]',(this.CustomParts.Fragment_Custom_Alpha ? this.CustomParts.Fragment_Custom_Alpha : ""))
            .replace('#[Fragment_Before_FragColor]',(this.CustomParts.Fragment_Before_FragColor ? this.CustomParts.Fragment_Before_FragColor : "")) ;
 
             this._isCreatedShader  = true;
              this._createdShaderName = name;
           
             return name ;
         }

      

         public SelectVersion(ver:string){
            switch(ver){
                case "3.0.0" : this.ShaderVersion = new ShaderForVer3_0();break;
            }
         }
        
         constructor(name:string,scene:Scene ){
            super(name,scene);
            this.CustomParts = new ShaderSpecialParts();
            this.customShaderNameResolve = this.Builder;  
            this.SelectVersion("3.0.0"); 
         } 
         public AddUniform(name:string,kind:string,param:any):CustomMaterial{
             if(!this._customUniform)
              {  
                  this._customUniform = new Array();
                  this._newUniforms = new Array();
                  this._newSamplerInstances = new Array();
                  this._newUniformInstances = new Array();
              }
              if(param){
              if(kind.indexOf("sampler") == -1) {
                    (<any>this._newUniformInstances)[kind+"-"+name] = param;
              }
              else{
                (<any>this._newUniformInstances)[kind+"-"+name] = param;
              }
             }

            this._customUniform.push("uniform "+kind+" "+name+";");
            this._newUniforms.push(name);
             
            return this;
         }
         public Fragment_Begin(shaderPart:string):CustomMaterial{            
            this.CustomParts.Fragment_Begin = shaderPart;
            return this;
         }

         public Fragment_Definitions(shaderPart:string):CustomMaterial{            
            this.CustomParts.Fragment_Definitions = shaderPart;
            return this;
         }

         public Fragment_MainBegin(shaderPart:string):CustomMaterial{            
            this.CustomParts.Fragment_MainBegin = shaderPart;
            return this;
         }
         public Fragment_Custom_Diffuse(shaderPart:string):CustomMaterial{            
            this.CustomParts.Fragment_Custom_Diffuse = shaderPart.replace("result","diffuseColor");
            return this;
         }
         public Fragment_Custom_Alpha(shaderPart:string):CustomMaterial{            
            this.CustomParts.Fragment_Custom_Alpha = shaderPart.replace("result","alpha");
            return this;
         }
         public Fragment_Before_FragColor(shaderPart:string):CustomMaterial{            
            this.CustomParts.Fragment_Before_FragColor = shaderPart.replace("result","color");
            return this;
         }
         public Vertex_Begin(shaderPart:string):CustomMaterial{            
            this.CustomParts.Vertex_Begin = shaderPart;
            return this;
         }
         public Vertex_Definitions(shaderPart:string):CustomMaterial{            
            this.CustomParts.Vertex_Definitions = shaderPart;
            return this;
         }
         public Vertex_MainBegin(shaderPart:string):CustomMaterial{            
            this.CustomParts.Vertex_MainBegin = shaderPart;
            return this;
         }
         public Vertex_Before_PositionUpdated(shaderPart:string):CustomMaterial{            
            this.CustomParts.Vertex_Before_PositionUpdated = shaderPart.replace("result","positionUpdated");
            return this;
         } 
         
          public Vertex_Before_NormalUpdated(shaderPart:string):CustomMaterial{            
            this.CustomParts.Vertex_Before_NormalUpdated = shaderPart.replace("result","normalUpdated");
            return this;
         } 
          
    }
}
     
