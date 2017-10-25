/// <reference path="../../../dist/preview release/babylon.d.ts"/>

namespace BABYLON {
    /**
     * Background material defines definition.
     */
    class BackgroundMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
        /**
         * True if the opacity texture is in use.
         */
        public OPACITY = false;

        /**
         * The direct UV channel to use.
         */
        public OPACITYDIRECTUV = 0;

        /**
         * True if the opacity texture is used in gray scale.
         */
        public OPACITYRGB = false;

        /**
         * True if the environment texture is in use.
         */
        public ENVIRONMENT = false;

        /**
         * True if the environment is defined in gamma space.
         */
        public GAMMAENVIRONMENT = false;

        /**
         * True if the environment texture does not contain background dedicated data.
         * The material will fallback to use the luminance of the background.
         */
        public RGBENVIRONMENT = false;

        /**
         * True if an extra blur needs to be added in the environment.
         */
        public ENVIRONMENTBLUR = false;

        /**
         * False if the current Webgl implementation does not support the texture lod extension.
         */
        public TEXTURELODSUPPORT = false;

        /**
         * True if you want the material to fade to the environment color at grazing angle.
         */
        public OPACITYFRESNEL = false;

        /**
         * True if you want the shadow being generated from the diffuse color of the light.
         * It is actually using 1 - diffuse to adpat the color to the color not reflected
         * by the target.
         */
        public SHADOWFROMLIGHTCOLOR = false;

        // Image Processing Configuration.
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

        // Default BJS.
        public MAINUV1 = false;
        public MAINUV2 = false;
        public UV1 = false;
        public UV2 = false;
        public CLIPPLANE = false;
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
     * Background material 
     */
    export class BackgroundMaterial extends BABYLON.PushMaterial {

        /**
         * Key light Color (multiply against the R channel of the environement texture)
         */
        @serializeAsColor3()
        protected _primaryColor: Color3;
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public primaryColor = BABYLON.Color3.White();

        /**
         * Key light Level (allowing HDR output of the background)
         */
        @serialize()
        protected _primaryLevel: float;
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public primaryLevel: float = 1;
        /**
         * Secondary light Color (multiply against the G channel of the environement texture)
         */
        @serializeAsColor3()
        protected _secondaryColor: Color3;
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public secondaryColor = BABYLON.Color3.Gray();

        /**
         * Secondary light Level (allowing HDR output of the background)
         */
        @serialize()
        protected _secondaryLevel: float;
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public secondaryLevel: float = 1;

        /**
         * Third light Color (multiply against the B channel of the environement texture)
         */
        @serializeAsColor3()
        protected _thirdColor: Color3;
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public thirdColor = BABYLON.Color3.Black();

        /**
         * Third light Level (allowing HDR output of the background)
         */
        @serialize()
        protected _thirdLevel: float;
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public thirdLevel: float = 1;

        /**
         * Environment Texture used in the material.
         * Should be author in a specific way for the best result (refer to the documentation).
         */
        @serializeAsTexture()
        protected _environmentTexture: Nullable<BaseTexture>;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public environmentTexture: Nullable<BaseTexture> = null;

        /**
         * Opacity Texture used in the material.
         * If present, the environment will be seen as a reflection when the luminance is close to 1 and a skybox
         * where close from 0.
         * This helps achieving a nice grounding effect by simulating a reflection on the ground but not the skybox.
         * If not present only the skybox mode is used.
         */
        @serializeAsTexture()
        protected _opacityTexture: Nullable<BaseTexture>;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public opacityTexture: Nullable<BaseTexture> = null;

        /**
         * Environment Texture level of blur.
         * 
         * Can be use to reuse an existing HDR Texture and target a specific LOD to prevent authoring the 
         * texture twice.
         */
        @serialize()
        protected _environmentBlur: float;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public environmentBlur: float = 0;

        /**
         * Specify wether or not the different channels of the environment represents background lighting information.
         * If no, the lumiance will be use equally on each channels.
         */
        @serialize()
        protected _lightChannelsInTexture: boolean;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public lightChannelsInTexture: boolean = false;

        /**
         * Specify the list of lights casting shadow on the material.
         * All scene shadow lights will be included if null.
         */
        protected _shadowLights: Nullable<IShadowLight[]> = null;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public shadowLights: Nullable<IShadowLight[]> = null;

        /**
         * For the lights having a blurred shadow generator, this can add a second blur pass in order to reach
         * soft lighting on the background.
         */
        @serialize()
        protected _shadowBlurScale: int;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public shadowBlurScale: int = 1;

        /**
         * Helps adjusting the shadow to a softer level if required.
         * 0 means black shadows and 1 means no shadows.
         */
        @serialize()
        protected _shadowLevel: float;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public shadowLevel: float = 0;

        /**
         * This helps specifying that the material is falling off to the sky box at grazing angle.
         * This helps ensuring a nice transition when the camera goes under the ground.
         */
        @serialize()
        protected _opacityFresnel: boolean;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public opacityFresnel: boolean = true;

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
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(conf => {
                this._markAllSubMeshesAsImageProcessingDirty();
            });
        }

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
        public set imageProcessingConfiguration(value: Nullable<ImageProcessingConfiguration>) {
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
        public get cameraExposure(): float {
            return this._imageProcessingConfiguration.exposure;
        };
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        public set cameraExposure(value: float) {
            this._imageProcessingConfiguration.exposure = value;
        };
        
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
         * Number of Simultaneous lights allowed on the material.
         */
        private _maxSimultaneousLights: int = 4;

        // Temp values kept as cache in the material.
        private _renderTargets = new SmartArray<RenderTargetTexture>(16);

        /**
         * constructor
         * @param name The name of the material
         * @param scene The scene to add the material to
         */
        constructor(name: string, scene: BABYLON.Scene) {
            super(name, scene);

            // Setup the default processing configuration to the scene.
            this._attachImageProcessingConfiguration(null);

            this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
                this._renderTargets.reset();

                if (this._opacityTexture && this._opacityTexture.isRenderTarget) {
                    this._renderTargets.push(this._opacityTexture as RenderTargetTexture);
                }

                if (this._environmentTexture && this._environmentTexture.isRenderTarget) {
                    this._renderTargets.push(this._environmentTexture as RenderTargetTexture);
                }

                return this._renderTargets;
            }
        }

        /**
         * The entire material has been created in order to prevent overdraw.
         * @returns false
         */
        public needAlphaTesting(): boolean {
            return false;
        }

        /**
         * The entire material has been created in order to prevent overdraw.
         * @returns false
         */
        public needAlphaBlending(): boolean {
            return false;
        }

        /**
         * Gets the environment texture to use in the material.
         * @returns the texture
         */
        private _getEnvironmentTexture(): Nullable<BaseTexture> {
            if (this._environmentTexture) {
                return this._environmentTexture;
            }

            return this.getScene().environmentTexture;
        }

        /**
         * Checks wether the material is ready to be rendered for a given mesh.
         * @param mesh The mesh to render
         * @param subMesh The submesh to check against
         * @param useInstances Specify wether or not the material is used with instances
         */
        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances: boolean = false): boolean { 
            if (subMesh.effect && this.isFrozen) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }

            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new BackgroundMaterialDefines();
            }

            var scene = this.getScene();
            var defines = <BackgroundMaterialDefines>subMesh._materialDefines;
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (defines._renderId === scene.getRenderId()) {
                    return true;
                }
            }

            var engine = scene.getEngine();
            
            // Lights
            MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights);
            defines._needNormals = true;
            
            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (scene.getEngine().getCaps().textureLOD) {
                        defines.TEXTURELODSUPPORT = true;
                    }

                    if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                        if (!this._opacityTexture.isReadyOrNotBlocking()) {
                            return false;
                        }

                        MaterialHelper.PrepareDefinesForMergedUV(this._opacityTexture, defines, "OPACITY");
                        defines.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
                        defines.OPACITYFRESNEL = this._opacityFresnel;
                    } else {
                        defines.OPACITY = false;
                        defines.OPACITYRGB = false;
                        defines.OPACITYFRESNEL = false;
                    }

                    var environmentTexture = this._getEnvironmentTexture();
                    if (environmentTexture && StandardMaterial.ReflectionTextureEnabled) {
                        if (!environmentTexture.isReadyOrNotBlocking()) {
                            return false;
                        }

                        MaterialHelper.PrepareDefinesForMergedUV(environmentTexture, defines, "ENVIRONMENT"); 
                        defines.GAMMAENVIRONMENT = environmentTexture.gammaSpace;
                        defines.ENVIRONMENTBLUR = this._environmentBlur > 0;
                        defines.RGBENVIRONMENT = !this.lightChannelsInTexture;
                    } else {
                        defines.ENVIRONMENT = false;
                        defines.GAMMAENVIRONMENT = false;
                        defines.RGBENVIRONMENT = false;
                    }
                }
            }

            if (defines._areImageProcessingDirty) {
                if (!this._imageProcessingConfiguration.isReady()) {
                    return false;
                }

                this._imageProcessingConfiguration.prepareDefines(defines);
            }

            // Misc.
            MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);

            // Values that need to be evaluated on every frame
            MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances, false);

             // Attribs
            if (MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, true, false)) {
                if (mesh) {
                    if (!scene.getEngine().getCaps().standardDerivatives && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                        mesh.createNormals(true);
                        Tools.Warn("BackgroundMaterial: Normals have been created for the mesh: " + mesh.name);
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

                MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this._maxSimultaneousLights);

                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
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

                MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                MaterialHelper.PrepareAttributesForInstances(attribs, defines);

                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", 
                        "vFogInfos", "vFogColor", "pointSize",
                        "vClipPlane", "mBones", 

                        "vPrimaryColor", "vSecondaryColor", "vThirdColor",
                        "vEnvironmentInfo", "environmentMatrix", "vEnvironmentMicrosurfaceInfos",

                        "shadowLevel",

                        "vOpacityInfo", "opacityMatrix",
                ];

                var samplers = ["opacitySampler", "environmentSampler", "environmentSamplerLow", "environmentSamplerHigh"];
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
                subMesh.setEffect(scene.getEngine().createEffect("background", <EffectCreationOptions>{
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

            if (!subMesh.effect.isReady()) {
                return false;
            }

            defines._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }

        /**
         * Build the uniform buffer used in the material.
         */
        public buildUniformLayout(): void {
            // Order is important !
            this._uniformBuffer.addUniform("vPrimaryColor", 4);
            this._uniformBuffer.addUniform("vSecondaryColor", 4);
            this._uniformBuffer.addUniform("vThirdColor", 4);
            this._uniformBuffer.addUniform("vOpacityInfo", 2);
            this._uniformBuffer.addUniform("vEnvironmentInfo", 2);
            this._uniformBuffer.addUniform("opacityMatrix", 16);
            this._uniformBuffer.addUniform("environmentMatrix", 16);
            this._uniformBuffer.addUniform("vEnvironmentMicrosurfaceInfos", 3);
            this._uniformBuffer.addUniform("pointSize", 1);
            this._uniformBuffer.addUniform("shadowLevel", 1);
            this._uniformBuffer.create();
        }

        /**
         * Unbind the material.
         */
        public unbind(): void {
            if (this._opacityTexture && this._opacityTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("opacitySampler", null);
            }

            if (this._environmentTexture && this._environmentTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("environmentSampler", null);
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
            this._activeEffect = effect;

            // Matrices
            this.bindOnlyWorldMatrix(world);

            // Bones
            MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

            let mustRebind = this._mustRebind(scene, effect, mesh.visibility);
            if (mustRebind) {
                this._uniformBuffer.bindToEffect(effect, "Material");

                this.bindViewProjection(effect);

                var environmentTexture = this._getEnvironmentTexture();
                if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync) {

                    // Texture uniforms
                    if (scene.texturesEnabled) {
                        if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vOpacityInfo", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                            MaterialHelper.BindTextureMatrix(this._opacityTexture, this._uniformBuffer, "opacity");
                        }

                        if (environmentTexture && StandardMaterial.ReflectionTextureEnabled) {
                            this._uniformBuffer.updateMatrix("environmentMatrix", environmentTexture.getReflectionTextureMatrix());
                            this._uniformBuffer.updateFloat2("vEnvironmentInfo", environmentTexture.level, this._environmentBlur);
                            this._uniformBuffer.updateFloat3("vEnvironmentMicrosurfaceInfos", 
                                environmentTexture.getSize().width, 
                                environmentTexture.lodGenerationScale,
                                environmentTexture.lodGenerationOffset);
                        }
                    }

                    if (this.shadowLevel > 0) {
                        this._uniformBuffer.updateFloat("shadowLevel", this.shadowLevel);
                    }

                    // Point size
                    if (this.pointsCloud) {
                        this._uniformBuffer.updateFloat("pointSize", this.pointSize);
                    }

                    this._uniformBuffer.updateColor4("vPrimaryColor", this._primaryColor, this._primaryLevel);
                    this._uniformBuffer.updateColor4("vSecondaryColor", this._secondaryColor, this._secondaryLevel);
                    this._uniformBuffer.updateColor4("vThirdColor", this._thirdColor, this._thirdLevel);
                }

                // Textures
                if (scene.texturesEnabled) {
                    if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                        this._uniformBuffer.setTexture("opacitySampler", this._opacityTexture);
                    }

                    if (environmentTexture && StandardMaterial.ReflectionTextureEnabled) {
                        if (defines.ENVIRONMENTBLUR && defines.TEXTURELODSUPPORT) {
                            this._uniformBuffer.setTexture("environmentSampler", environmentTexture);
                        }
                        else if (!defines.ENVIRONMENTBLUR) {
                            this._uniformBuffer.setTexture("environmentSampler", environmentTexture);
                        }
                        else {
                            this._uniformBuffer.setTexture("environmentSampler", environmentTexture._lodTextureMid || environmentTexture);
                            this._uniformBuffer.setTexture("environmentSamplerLow", environmentTexture._lodTextureLow || environmentTexture);
                            this._uniformBuffer.setTexture("environmentSamplerHigh", environmentTexture._lodTextureHigh || environmentTexture);
                        }
                    }
                }

                // Clip plane
                MaterialHelper.BindClipPlane(this._activeEffect, scene);

                var eyePosition = scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.globalPosition;
                // var invertNormal = (scene.useRightHandedSystem === (scene._mirroredCameraPosition != null));
                effect.setFloat3("vEyePosition",
                    eyePosition.x,
                    eyePosition.y,
                    eyePosition.z);
            }

            if (mustRebind || !this.isFrozen) {
                if (scene.lightsEnabled) {
                    MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this._maxSimultaneousLights, false);
                }

                // View
                this.bindView(effect);

                // Fog
                MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

                // image processing
                this._imageProcessingConfiguration.bind(this._activeEffect);
            }

            this._uniformBuffer.update();

            this._afterBind(mesh);

            scene = null;
        }

        /**
         * Dispose the material.
         * @forceDisposeEffect Force disposal of the associated effect.
         * @forceDisposeTextures Force disposal of the associated textures.
         */
        public dispose(forceDisposeEffect: boolean = false, forceDisposeTextures: boolean = false): void {
            if (forceDisposeTextures) {
                if (this.opacityTexture) {
                    this.opacityTexture.dispose();
                }
                if (this.environmentTexture) {
                    this.environmentTexture.dispose();
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
         * @name The cloned name.
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
            serializationObject.customType = "BABYLON.GridMaterial";
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
         * @param source 
         * @param scene 
         * @param rootUrl 
         * @returns the instantiated BackgroundMaterial.
         */
        public static Parse(source: any, scene: Scene, rootUrl: string): BackgroundMaterial {
            return SerializationHelper.Parse(() => new BackgroundMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
}