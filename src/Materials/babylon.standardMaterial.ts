module BABYLON {
   export class StandardMaterialDefines extends MaterialDefines {
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
        public INVERTNORMALMAPX = false;
        public INVERTNORMALMAPY = false;
        public TWOSIDEDLIGHTING = false;
        public SHADOWFULLFLOAT = false;
        public CAMERACOLORGRADING = false;
        public CAMERACOLORCURVES = false;

        constructor() {
            super(true);
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
                this[mode] = (mode === modeToEnable);
            }
        }
    }

    export class StandardMaterial extends Material {
        @serializeAsTexture("diffuseTexture")
        private _diffuseTexture: BaseTexture;

        public set diffuseTexture(value : BaseTexture) {
            if (this._diffuseTexture === value) {
                return;
            }
            this._diffuseTexture = value;
            this._areTexturesDirty = true;
        }

        public get diffuseTexture(): BaseTexture {
            return this._diffuseTexture;
        }

        @serializeAsTexture("ambientTexture")
        private _ambientTexture: BaseTexture;

        public set ambientTexture(value : BaseTexture) {
            if (this._ambientTexture === value) {
                return;
            }
            this._ambientTexture = value;
            this._areTexturesDirty = true;
        }

        public get ambientTexture(): BaseTexture {
            return this._ambientTexture;
        }

        @serializeAsTexture("opacityTexture")
        private _opacityTexture: BaseTexture;

        public set opacityTexture(value : BaseTexture) {
            if (this._opacityTexture === value) {
                return;
            }
            this._opacityTexture = value;
            this._areTexturesDirty = true;
        }

        public get opacityTexture(): BaseTexture {
            return this._opacityTexture;
        }        

        @serializeAsTexture("reflectionTexture")
        private _reflectionTexture: BaseTexture;

        public set reflectionTexture(value : BaseTexture) {
            if (this._reflectionTexture === value) {
                return;
            }
            this._reflectionTexture = value;
            this._areTexturesDirty = true;
        }

        public get reflectionTexture(): BaseTexture {
            return this._reflectionTexture;
        }           

        @serializeAsTexture("emissiveTexture")
        private _emissiveTexture: BaseTexture;

        public set emissiveTexture(value : BaseTexture) {
            if (this._emissiveTexture === value) {
                return;
            }
            this._emissiveTexture = value;
            this._areTexturesDirty = true;
        }

        public get emissiveTexture(): BaseTexture {
            return this._emissiveTexture;
        }  

        @serializeAsTexture("specularTexture")
        private _specularTexture: BaseTexture;

        public set specularTexture(value : BaseTexture) {
            if (this._specularTexture === value) {
                return;
            }
            this._specularTexture = value;
            this._areTexturesDirty = true;
        }

        public get specularTexture(): BaseTexture {
            return this._specularTexture;
        }          

        @serializeAsTexture("bumpTexture")
        private _bumpTexture: BaseTexture;

        public set bumpTexture(value : BaseTexture) {
            if (this._bumpTexture === value) {
                return;
            }
            this._bumpTexture = value;
            this._areTexturesDirty = true;
        }

        public get bumpTexture(): BaseTexture {
            return this._bumpTexture;
        }          

        @serializeAsTexture("lightmapTexture")
        private _lightmapTexture: BaseTexture;

        public set lightmapTexture(value : BaseTexture) {
            if (this._lightmapTexture === value) {
                return;
            }
            this._lightmapTexture = value;
            this._areTexturesDirty = true;
        }

        public get lightmapTexture(): BaseTexture {
            return this._lightmapTexture;
        }             

        @serializeAsTexture("refractionTexture")
        private _refractionTexture: BaseTexture;

        public set refractionTexture(value : BaseTexture) {
            if (this._refractionTexture === value) {
                return;
            }
            this._refractionTexture = value;
            this._areTexturesDirty = true;
        }

        public get refractionTexture(): BaseTexture {
            return this._refractionTexture;
        }          

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

        @serialize()
        public useAlphaFromDiffuseTexture = false;

        @serialize()
        public useEmissiveAsIllumination = false;

        @serialize()
        public linkEmissiveWithDiffuse = false;

        @serialize()
        public useReflectionFresnelFromSpecular = false;

        @serialize()
        public useSpecularOverAlpha = false;

        @serialize()
        public useReflectionOverAlpha = false;

        @serialize()
        public disableLighting = false;

        @serialize()
        public useParallax = false;

        @serialize()
        public useParallaxOcclusion = false;

        @serialize()
        public parallaxScaleBias = 0.05;

        @serialize()
        public roughness = 0;

        @serialize()
        public indexOfRefraction = 0.98;

        @serialize()
        public invertRefractionY = true;

        @serialize()
        public useLightmapAsShadowmap = false;

        @serializeAsFresnelParameters()
        public diffuseFresnelParameters: FresnelParameters;

        @serializeAsFresnelParameters()
        public opacityFresnelParameters: FresnelParameters;

        @serializeAsFresnelParameters()
        public reflectionFresnelParameters: FresnelParameters;

        @serializeAsFresnelParameters()
        public refractionFresnelParameters: FresnelParameters;

        @serializeAsFresnelParameters()
        public emissiveFresnelParameters: FresnelParameters;

        @serialize()
        public useGlossinessFromSpecularMapAlpha = false;

        @serialize()
        public maxSimultaneousLights = 4;

        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        @serialize()
        public invertNormalMapX = false;

        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        @serialize()
        public invertNormalMapY = false;

        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        @serialize()
        public twoSidedLighting = false;

        /**
         * Color Grading 2D Lookup Texture.
         * This allows special effects like sepia, black and white to sixties rendering style. 
         */
        @serializeAsTexture()
        private _cameraColorGradingTexture: BaseTexture;

        public set cameraColorGradingTexture(value : BaseTexture) {
            if (this._cameraColorGradingTexture === value) {
                return;
            }
            this._cameraColorGradingTexture = value;
            this._areTexturesDirty = true;
        }

        public get cameraColorGradingTexture(): BaseTexture {
            return this._cameraColorGradingTexture;
        }           
        
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT). 
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image; 
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        @serializeAsColorCurves()
        public cameraColorCurves: ColorCurves = null;

        protected _renderTargets = new SmartArray<RenderTargetTexture>(16);
        protected _worldViewProjectionMatrix = Matrix.Zero();
        protected _globalAmbientColor = new Color3(0, 0, 0);
        protected _renderId: number;

        protected _defines = new StandardMaterialDefines();

        protected _useLogarithmicDepth: boolean;

        protected _areTexturesDirty = false;
        protected _needUVs = false;

        constructor(name: string, scene: Scene) {
            super(name, scene);

            this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
                this._renderTargets.reset();

                if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                    this._renderTargets.push(this._reflectionTexture);
                }

                if (this._refractionTexture && this._refractionTexture.isRenderTarget) {
                    this._renderTargets.push(this._refractionTexture);
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
        }

        public needAlphaBlending(): boolean {
            return (this.alpha < 1.0) || (this._opacityTexture != null) || this._shouldUseAlphaFromDiffuseTexture() || this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled;
        }

        public needAlphaTesting(): boolean {
            return this.diffuseTexture != null && this.diffuseTexture.hasAlpha;
        }

        protected _shouldUseAlphaFromDiffuseTexture(): boolean {
            return this.diffuseTexture != null && this.diffuseTexture.hasAlpha && this.useAlphaFromDiffuseTexture;
        }

        public getAlphaTestTexture(): BaseTexture {
            return this.diffuseTexture;
        }

        // Methods   
        protected _checkCache(scene: Scene, mesh?: AbstractMesh, useInstances?: boolean): boolean {
            if (!mesh) {
                return true;
            }

            if (this._defines.INSTANCES !== useInstances) {
                return false;
            }

            return false;
        }

        /**
         * Child classes can use it to update shaders
         */
        public markAsDirty() {
            this._areTexturesDirty = true;
        }

        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }

            var scene = this.getScene();
            var engine = scene.getEngine();
            var needNormals = false;

            // Lights
            if (scene.lightsEnabled && !this.disableLighting) {
                needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines, this.maxSimultaneousLights);
            }

            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                    if (this._checkCache(scene, mesh, useInstances)) {
                        return true;
                    }
                }
            }

            // Textures
            if (this._areTexturesDirty) {
                this._needUVs = false;
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                        if (!this._diffuseTexture.isReady()) {
                            return false;
                        } else {
                            this._needUVs = true;
                            this._defines.DIFFUSE = true;
                        }
                    } else {
                        this._defines.DIFFUSE = false;
                    }

                    if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                        if (!this._ambientTexture.isReady()) {
                            return false;
                        } else {
                            this._needUVs = true;
                            this._defines.AMBIENT = true;
                        }
                    } else {
                        this._defines.AMBIENT = false;
                    }

                    if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                        if (!this._opacityTexture.isReady()) {
                            return false;
                        } else {
                            this._needUVs = true;
                            this._defines.OPACITY = true;
                            this._defines.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
                        }
                    } else {
                        this._defines.OPACITY = false;
                    }

                    if (this._reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                        if (!this._reflectionTexture.isReady()) {
                            return false;
                        } else {
                            needNormals = true;
                            this._defines.REFLECTION = true;

                            this._defines.ROUGHNESS = (this.roughness > 0);
                            this._defines.REFLECTIONOVERALPHA = this.useReflectionOverAlpha;
                            this._defines.INVERTCUBICMAP = (this._reflectionTexture.coordinatesMode === Texture.INVCUBIC_MODE);
                            this._defines.REFLECTIONMAP_3D = this._reflectionTexture.isCube;

                            switch (this._reflectionTexture.coordinatesMode) {
                                case Texture.CUBIC_MODE:
                                case Texture.INVCUBIC_MODE:
                                    this._defines.setReflectionMode("REFLECTIONMAP_CUBIC");
                                    break;
                                case Texture.EXPLICIT_MODE:
                                    this._defines.setReflectionMode("REFLECTIONMAP_EXPLICIT");
                                    break;
                                case Texture.PLANAR_MODE:
                                    this._defines.setReflectionMode("REFLECTIONMAP_PLANAR");
                                    break;
                                case Texture.PROJECTION_MODE:
                                    this._defines.setReflectionMode("REFLECTIONMAP_PROJECTION");
                                    break;
                                case Texture.SKYBOX_MODE:
                                    this._defines.setReflectionMode("REFLECTIONMAP_SKYBOX");
                                    break;
                                case Texture.SPHERICAL_MODE:
                                    this._defines.setReflectionMode("REFLECTIONMAP_SPHERICAL");
                                    break;
                                case Texture.EQUIRECTANGULAR_MODE:
                                    this._defines.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR");
                                    break;
                                case Texture.FIXED_EQUIRECTANGULAR_MODE:
                                    this._defines.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR_FIXED");
                                    break;
                                case Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                                    this._defines.setReflectionMode("REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED");
                                    break;
                            }
                        }
                    } else {
                        this._defines.REFLECTION = false;
                    }

                    if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                        if (!this._emissiveTexture.isReady()) {
                            return false;
                        } else {
                            this._needUVs = true;
                            this._defines.EMISSIVE = true;
                        }
                    } else {
                        this._defines.EMISSIVE = false;
                    }

                    if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                        if (!this._lightmapTexture.isReady()) {
                            return false;
                        } else {
                            this._needUVs = true;
                            this._defines.LIGHTMAP = true;
                            this._defines.USELIGHTMAPASSHADOWMAP = this.useLightmapAsShadowmap;
                        }
                    } else {
                        this._defines.LIGHTMAP = false;
                    }

                    if (this._specularTexture && StandardMaterial.SpecularTextureEnabled) {
                        if (!this._specularTexture.isReady()) {
                            return false;
                        } else {
                            this._needUVs = true;
                            this._defines.SPECULAR = true;
                            this._defines.GLOSSINESS = this.useGlossinessFromSpecularMapAlpha;
                        }
                    } else {
                        this._defines.SPECULAR = false;
                    }

                    if (scene.getEngine().getCaps().standardDerivatives && this._bumpTexture && StandardMaterial.BumpTextureEnabled) {
                        if (!this._bumpTexture.isReady()) {
                            return false;
                        } else {
                            this._needUVs = true;
                            this._defines.BUMP = true;

                            this._defines.PARALLAX = this.useParallax;
                            this._defines.PARALLAXOCCLUSION = this.useParallaxOcclusion;

                            this._defines.INVERTNORMALMAPX = this.invertNormalMapX;
                            this._defines.INVERTNORMALMAPY = this.invertNormalMapY;

                            if (scene._mirroredCameraPosition) {
                                this._defines.INVERTNORMALMAPX = !this._defines.INVERTNORMALMAPX;
                                this._defines.INVERTNORMALMAPY = !this._defines.INVERTNORMALMAPY;
                            }
                        }
                    } else {
                        this._defines.BUMP = false;
                    }

                    if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        if (!this._refractionTexture.isReady()) {
                            return false;
                        } else {
                            this._needUVs = true;
                            this._defines.REFRACTION = true;

                            this._defines.REFRACTIONMAP_3D = this._refractionTexture.isCube;
                        }
                    } else {
                        this._defines.REFRACTION = false;
                    }

                    if (this._cameraColorGradingTexture && StandardMaterial.ColorGradingTextureEnabled) {
                        if (!this._cameraColorGradingTexture.isReady()) {
                            return false;
                        } else {
                            this._defines.CAMERACOLORGRADING = true;
                        }
                    } else {
                        this._defines.CAMERACOLORGRADING = false;
                    }

                    if (!this.backFaceCulling && this.twoSidedLighting) {
                        this._defines.TWOSIDEDLIGHTING = true;
                    } else {
                        this._defines.TWOSIDEDLIGHTING = false;
                    }
                }
                this._areTexturesDirty = false;
            }

            // Effect
            this._defines.CLIPPLANE = (scene.clipPlane !== undefined && scene.clipPlane !== null);

            this._defines.ALPHATEST = engine.getAlphaTesting();

            this._defines.ALPHAFROMDIFFUSE = this._shouldUseAlphaFromDiffuseTexture();

            this._defines.EMISSIVEASILLUMINATION = this.useEmissiveAsIllumination;

            this._defines.LINKEMISSIVEWITHDIFFUSE = this.linkEmissiveWithDiffuse;

            this._defines.LOGARITHMICDEPTH = this.useLogarithmicDepth;

            this._defines.CAMERACOLORCURVES = (this.cameraColorCurves !== undefined && this.cameraColorCurves !== null);

            // Point size
            this._defines.POINTSIZE = (this.pointsCloud || scene.forcePointsCloud);

            // Fog
            this._defines.FOG = (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled);

            if (StandardMaterial.FresnelEnabled) {
                // Fresnel
                if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled ||
                    this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled ||
                    this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled ||
                    this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled ||
                    this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {

                    this._defines.DIFFUSEFRESNEL = (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled);

                    this._defines.OPACITYFRESNEL = (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled);

                    this._defines.REFLECTIONFRESNEL = (this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled);

                    this._defines.REFLECTIONFRESNELFROMSPECULAR = this.useReflectionFresnelFromSpecular;

                    this._defines.REFRACTIONFRESNEL = (this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled) ;

                    this._defines.EMISSIVEFRESNEL = (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) ;

                    needNormals = true;
                    this._defines.FRESNEL = true;
                }
            } else {
                this._defines.FRESNEL = false;
            }

            this._defines.SPECULAROVERALPHA = (this._defines.SPECULARTERM && this.useSpecularOverAlpha);

            // Attribs
            if (mesh) {
                this._defines.NORMAL = (needNormals && mesh.isVerticesDataPresent(VertexBuffer.NormalKind));

                if (this._needUVs) {
                    this._defines.UV1 = mesh.isVerticesDataPresent(VertexBuffer.UVKind);
                    this._defines.UV2 = mesh.isVerticesDataPresent(VertexBuffer.UV2Kind);
                } else {
                    this._defines.UV1 = false;
                    this._defines.UV2 = false;
                }

                this._defines.VERTEXCOLOR = mesh.useVertexColors && mesh.isVerticesDataPresent(VertexBuffer.ColorKind);

                this._defines.VERTEXALPHA = mesh.hasVertexAlpha;

                if (mesh.useBones && mesh.computeBonesUsingShaders) {
                    this._defines.NUM_BONE_INFLUENCERS = mesh.numBoneInfluencers;
                    this._defines.BonesPerMesh = (mesh.skeleton.bones.length + 1);
                } else {
                    this._defines.NUM_BONE_INFLUENCERS = 0;
                    this._defines.BonesPerMesh = 0;
                }

                // Instances
                this._defines.INSTANCES = useInstances;
            }

            // Get correct effect      
            if (this._defines._isDirty) {
                this._defines._isDirty = false;
                scene.resetCachedMaterial();

                // Fallbacks
                var fallbacks = new EffectFallbacks();
                if (this._defines.REFLECTION) {
                    fallbacks.addFallback(0, "REFLECTION");
                }

                if (this._defines.SPECULAR) {
                    fallbacks.addFallback(0, "SPECULAR");
                }

                if (this._defines.BUMP) {
                    fallbacks.addFallback(0, "BUMP");
                }

                if (this._defines.PARALLAX) {
                    fallbacks.addFallback(1, "PARALLAX");
                }

                if (this._defines.PARALLAXOCCLUSION) {
                    fallbacks.addFallback(0, "PARALLAXOCCLUSION");
                }

                if (this._defines.SPECULAROVERALPHA) {
                    fallbacks.addFallback(0, "SPECULAROVERALPHA");
                }

                if (this._defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }

                if (this._defines.POINTSIZE) {
                    fallbacks.addFallback(0, "POINTSIZE");
                }

                if (this._defines.LOGARITHMICDEPTH) {
                    fallbacks.addFallback(0, "LOGARITHMICDEPTH");
                }

                MaterialHelper.HandleFallbacksForShadows(this._defines, fallbacks, this.maxSimultaneousLights);

                if (this._defines.SPECULARTERM) {
                    fallbacks.addFallback(0, "SPECULARTERM");
                }

                if (this._defines.DIFFUSEFRESNEL) {
                    fallbacks.addFallback(1, "DIFFUSEFRESNEL");
                }

                if (this._defines.OPACITYFRESNEL) {
                    fallbacks.addFallback(2, "OPACITYFRESNEL");
                }

                if (this._defines.REFLECTIONFRESNEL) {
                    fallbacks.addFallback(3, "REFLECTIONFRESNEL");
                }

                if (this._defines.EMISSIVEFRESNEL) {
                    fallbacks.addFallback(4, "EMISSIVEFRESNEL");
                }

                if (this._defines.FRESNEL) {
                    fallbacks.addFallback(4, "FRESNEL");
                }

                //Attributes
                var attribs = [VertexBuffer.PositionKind];

                if (this._defines.NORMAL) {
                    attribs.push(VertexBuffer.NormalKind);
                }

                if (this._defines.UV1) {
                    attribs.push(VertexBuffer.UVKind);
                }

                if (this._defines.UV2) {
                    attribs.push(VertexBuffer.UV2Kind);
                }

                if (this._defines.VERTEXCOLOR) {
                    attribs.push(VertexBuffer.ColorKind);
                }

                MaterialHelper.PrepareAttributesForBones(attribs, mesh, this._defines, fallbacks);
                MaterialHelper.PrepareAttributesForInstances(attribs, this._defines);
                
                var shaderName = "default";

                var join = this._defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                    "depthValues",
                    "diffuseLeftColor", "diffuseRightColor", "opacityParts", "reflectionLeftColor", "reflectionRightColor", "emissiveLeftColor", "emissiveRightColor", "refractionLeftColor", "refractionRightColor",
                    "logarithmicDepthConstant"
                ];

                var samplers = ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler"]

                if (this._defines.CAMERACOLORCURVES) {
                    ColorCurves.PrepareUniforms(uniforms);
                }
                if (this._defines.CAMERACOLORGRADING) {
                    ColorGradingTexture.PrepareUniformsAndSamplers(uniforms, samplers);
                }
                MaterialHelper.PrepareUniformsAndSamplersList(uniforms, samplers, this._defines, this.maxSimultaneousLights);

                this._effect = scene.getEngine().createEffect(shaderName,
                    attribs, uniforms, samplers,
                    join, fallbacks, this.onCompiled, this.onError, { maxSimultaneousLights: this.maxSimultaneousLights - 1 });
            }

            if (!this._effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }


        public unbind(): void {
            if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                this._effect.setTexture("reflection2DSampler", null);
            }

            if (this._refractionTexture && this._refractionTexture.isRenderTarget) {
                this._effect.setTexture("refraction2DSampler", null);
            }

            super.unbind();
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
            this._effect.setMatrix("world", world);
        }

        public bind(world: Matrix, mesh?: Mesh): void {
            var scene = this.getScene();

            // Matrices        
            this.bindOnlyWorldMatrix(world);

            // Bones
            MaterialHelper.BindBonesParameters(mesh, this._effect);

            if (scene.getCachedMaterial() !== this) {
                this._effect.setMatrix("viewProjection", scene.getTransformMatrix());

                if (StandardMaterial.FresnelEnabled) {
                    // Fresnel
                    if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled) {
                        this._effect.setColor4("diffuseLeftColor", this.diffuseFresnelParameters.leftColor, this.diffuseFresnelParameters.power);
                        this._effect.setColor4("diffuseRightColor", this.diffuseFresnelParameters.rightColor, this.diffuseFresnelParameters.bias);
                    }

                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        this._effect.setColor4("opacityParts", new Color3(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power);
                    }

                    if (this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
                        this._effect.setColor4("reflectionLeftColor", this.reflectionFresnelParameters.leftColor, this.reflectionFresnelParameters.power);
                        this._effect.setColor4("reflectionRightColor", this.reflectionFresnelParameters.rightColor, this.reflectionFresnelParameters.bias);
                    }

                    if (this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled) {
                        this._effect.setColor4("refractionLeftColor", this.refractionFresnelParameters.leftColor, this.refractionFresnelParameters.power);
                        this._effect.setColor4("refractionRightColor", this.refractionFresnelParameters.rightColor, this.refractionFresnelParameters.bias);
                    }

                    if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                        this._effect.setColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                        this._effect.setColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                    }
                }

                // Textures     
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                        this._effect.setTexture("diffuseSampler", this._diffuseTexture);

                        this._effect.setFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                        this._effect.setMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
                    }

                    if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                        this._effect.setTexture("ambientSampler", this._ambientTexture);

                        this._effect.setFloat2("vAmbientInfos", this._ambientTexture.coordinatesIndex, this._ambientTexture.level);
                        this._effect.setMatrix("ambientMatrix", this._ambientTexture.getTextureMatrix());
                    }

                    if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                        this._effect.setTexture("opacitySampler", this._opacityTexture);

                        this._effect.setFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                        this._effect.setMatrix("opacityMatrix", this._opacityTexture.getTextureMatrix());
                    }

                    if (this._reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                        if (this._reflectionTexture.isCube) {
                            this._effect.setTexture("reflectionCubeSampler", this._reflectionTexture);
                        } else {
                            this._effect.setTexture("reflection2DSampler", this._reflectionTexture);
                        }

                        this._effect.setMatrix("reflectionMatrix", this._reflectionTexture.getReflectionTextureMatrix());
                        this._effect.setFloat2("vReflectionInfos", this._reflectionTexture.level, this.roughness);
                    }

                    if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                        this._effect.setTexture("emissiveSampler", this._emissiveTexture);

                        this._effect.setFloat2("vEmissiveInfos", this._emissiveTexture.coordinatesIndex, this._emissiveTexture.level);
                        this._effect.setMatrix("emissiveMatrix", this._emissiveTexture.getTextureMatrix());
                    }

                    if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                        this._effect.setTexture("lightmapSampler", this._lightmapTexture);

                        this._effect.setFloat2("vLightmapInfos", this._lightmapTexture.coordinatesIndex, this._lightmapTexture.level);
                        this._effect.setMatrix("lightmapMatrix", this._lightmapTexture.getTextureMatrix());
                    }

                    if (this._specularTexture && StandardMaterial.SpecularTextureEnabled) {
                        this._effect.setTexture("specularSampler", this._specularTexture);

                        this._effect.setFloat2("vSpecularInfos", this._specularTexture.coordinatesIndex, this._specularTexture.level);
                        this._effect.setMatrix("specularMatrix", this._specularTexture.getTextureMatrix());
                    }

                    if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled) {
                        this._effect.setTexture("bumpSampler", this._bumpTexture);

                        this._effect.setFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, 1.0 / this._bumpTexture.level, this.parallaxScaleBias);
                        this._effect.setMatrix("bumpMatrix", this._bumpTexture.getTextureMatrix());
                    }

                    if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        var depth = 1.0;
                        if (this._refractionTexture.isCube) {
                            this._effect.setTexture("refractionCubeSampler", this._refractionTexture);
                        } else {
                            this._effect.setTexture("refraction2DSampler", this._refractionTexture);
                            this._effect.setMatrix("refractionMatrix", this._refractionTexture.getReflectionTextureMatrix());

                            if ((<any>this._refractionTexture).depth) {
                                depth = (<any>this._refractionTexture).depth;
                            }
                        }
                        this._effect.setFloat4("vRefractionInfos", this._refractionTexture.level, this.indexOfRefraction, depth, this.invertRefractionY ? -1 : 1);
                    }
                    
                    if (this._cameraColorGradingTexture && StandardMaterial.ColorGradingTextureEnabled) {
                        ColorGradingTexture.Bind(this._cameraColorGradingTexture, this._effect);
                    }
                }

                // Clip plane
                MaterialHelper.BindClipPlane(this._effect, scene);

                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }

                // Colors
                scene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);

                this._effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
                this._effect.setColor3("vAmbientColor", this._globalAmbientColor);

                if (this._defines.SPECULARTERM) {
                    this._effect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
                }
                this._effect.setColor3("vEmissiveColor", this.emissiveColor);
            }

            if (scene.getCachedMaterial() !== this || !this.isFrozen) {
                // Diffuse
                this._effect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);

                // Lights
                if (scene.lightsEnabled && !this.disableLighting) {
                    MaterialHelper.BindLights(scene, mesh, this._effect, this._defines, this.maxSimultaneousLights);
                }

                // View
                if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE || this._reflectionTexture || this._refractionTexture) {
                    this._effect.setMatrix("view", scene.getViewMatrix());
                }

                // Fog
                MaterialHelper.BindFogParameters(scene, mesh, this._effect);

                // Log. depth
                MaterialHelper.BindLogDepth(this._defines, this._effect, scene);

                // Color Curves
                if (this.cameraColorCurves) {
                    ColorCurves.Bind(this.cameraColorCurves, this._effect);
                }
            }

            super.bind(world, mesh);
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
            
            if (this._cameraColorGradingTexture && this._cameraColorGradingTexture.animations && this._cameraColorGradingTexture.animations.length > 0) {
                results.push(this._cameraColorGradingTexture);
            }

            return results;
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
                
                if (this._cameraColorGradingTexture) {
                    this._cameraColorGradingTexture.dispose();
                }
            }

            super.dispose(forceDisposeEffect, forceDisposeTextures);
        }

        public clone(name: string): StandardMaterial {
            return SerializationHelper.Clone(() => new StandardMaterial(name, this.getScene()), this);
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
            Engine.MarkAllMaterialsAsDirty();
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
            Engine.MarkAllMaterialsAsDirty();
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
            Engine.MarkAllMaterialsAsDirty();
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
            Engine.MarkAllMaterialsAsDirty();
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
            Engine.MarkAllMaterialsAsDirty();
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
            Engine.MarkAllMaterialsAsDirty();
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
            Engine.MarkAllMaterialsAsDirty();
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
            Engine.MarkAllMaterialsAsDirty();
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
            Engine.MarkAllMaterialsAsDirty();
        }    

        public static _ColorGradingTextureEnabled = true;
        public static get ColorGradingTextureEnabled(): boolean {
            return StandardMaterial._ColorGradingTextureEnabled;
        }
        public static set ColorGradingTextureEnabled(value: boolean) {
            if (StandardMaterial._ColorGradingTextureEnabled === value) {
                return;
            }

            StandardMaterial._ColorGradingTextureEnabled = value;
            Engine.MarkAllMaterialsAsDirty();
        }           

        public static FresnelEnabled = true;
    }
} 
