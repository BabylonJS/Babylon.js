/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    /**
     * Background material defines definition.
     */
    var BackgroundMaterialDefines = (function (_super) {
        __extends(BackgroundMaterialDefines, _super);
        /**
         * Constructor of the defines.
         */
        function BackgroundMaterialDefines() {
            var _this = _super.call(this) || this;
            /**
             * True if the opacity texture is in use.
             */
            _this.OPACITY = false;
            /**
             * The direct UV channel to use.
             */
            _this.OPACITYDIRECTUV = 0;
            /**
             * True if the opacity texture is used in gray scale.
             */
            _this.OPACITYRGB = false;
            /**
             * True if the environment texture is in use.
             */
            _this.ENVIRONMENT = false;
            /**
             * True if the environment is defined in gamma space.
             */
            _this.GAMMAENVIRONMENT = false;
            /**
             * True if the environment texture does not contain background dedicated data.
             * The material will fallback to use the luminance of the background.
             */
            _this.RGBENVIRONMENT = false;
            /**
             * True if an extra blur needs to be added in the environment.
             */
            _this.ENVIRONMENTBLUR = false;
            /**
             * False if the current Webgl implementation does not support the texture lod extension.
             */
            _this.TEXTURELODSUPPORT = false;
            /**
             * True if you want the material to fade to the environment color at grazing angle.
             */
            _this.OPACITYFRESNEL = false;
            /**
             * True if you want the shadow being generated from the diffuse color of the light.
             * It is actually using 1 - diffuse to adpat the color to the color not reflected
             * by the target.
             */
            _this.SHADOWFROMLIGHTCOLOR = false;
            // Image Processing Configuration.
            _this.IMAGEPROCESSING = false;
            _this.VIGNETTE = false;
            _this.VIGNETTEBLENDMODEMULTIPLY = false;
            _this.VIGNETTEBLENDMODEOPAQUE = false;
            _this.TONEMAPPING = false;
            _this.CONTRAST = false;
            _this.COLORCURVES = false;
            _this.COLORGRADING = false;
            _this.COLORGRADING3D = false;
            _this.SAMPLER3DGREENDEPTH = false;
            _this.SAMPLER3DBGRMAP = false;
            _this.IMAGEPROCESSINGPOSTPROCESS = false;
            _this.EXPOSURE = false;
            // Default BJS.
            _this.MAINUV1 = false;
            _this.MAINUV2 = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.CLIPPLANE = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.NORMAL = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.SHADOWFLOAT = false;
            _this.rebuild();
            return _this;
        }
        return BackgroundMaterialDefines;
    }(BABYLON.MaterialDefines));
    /**
     * Background material
     */
    var BackgroundMaterial = (function (_super) {
        __extends(BackgroundMaterial, _super);
        /**
         * constructor
         * @param name The name of the material
         * @param scene The scene to add the material to
         */
        function BackgroundMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.primaryColor = BABYLON.Color3.White();
            _this.primaryLevel = 1;
            _this.secondaryColor = BABYLON.Color3.Gray();
            _this.secondaryLevel = 1;
            _this.thirdColor = BABYLON.Color3.Black();
            _this.thirdLevel = 1;
            _this.environmentTexture = null;
            _this.opacityTexture = null;
            _this.environmentBlur = 0;
            _this.lightChannelsInTexture = false;
            /**
             * Specify the list of lights casting shadow on the material.
             * All scene shadow lights will be included if null.
             */
            _this._shadowLights = null;
            _this.shadowLights = null;
            _this.shadowBlurScale = 1;
            _this.shadowLevel = 0;
            _this.opacityFresnel = true;
            /**
             * Keep track of the image processing observer to allow dispose and replace.
             */
            _this._imageProcessingObserver = null;
            /**
             * Number of Simultaneous lights allowed on the material.
             */
            _this._maxSimultaneousLights = 4;
            // Temp values kept as cache in the material.
            _this._renderTargets = new BABYLON.SmartArray(16);
            // Setup the default processing configuration to the scene.
            _this._attachImageProcessingConfiguration(null);
            _this.getRenderTargetTextures = function () {
                _this._renderTargets.reset();
                if (_this._opacityTexture && _this._opacityTexture.isRenderTarget) {
                    _this._renderTargets.push(_this._opacityTexture);
                }
                if (_this._environmentTexture && _this._environmentTexture.isRenderTarget) {
                    _this._renderTargets.push(_this._environmentTexture);
                }
                return _this._renderTargets;
            };
            return _this;
        }
        /**
         * Attaches a new image processing configuration to the PBR Material.
         * @param configuration (if null the scene configuration will be use)
         */
        BackgroundMaterial.prototype._attachImageProcessingConfiguration = function (configuration) {
            var _this = this;
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
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(function (conf) {
                _this._markAllSubMeshesAsImageProcessingDirty();
            });
        };
        Object.defineProperty(BackgroundMaterial.prototype, "imageProcessingConfiguration", {
            /**
             * Gets the image processing configuration used either in this material.
             */
            get: function () {
                return this._imageProcessingConfiguration;
            },
            /**
             * Sets the Default image processing configuration used either in the this material.
             *
             * If sets to null, the scene one is in use.
             */
            set: function (value) {
                this._attachImageProcessingConfiguration(value);
                // Ensure the effect will be rebuilt.
                this._markAllSubMeshesAsTexturesDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BackgroundMaterial.prototype, "cameraColorCurvesEnabled", {
            /**
             * Gets wether the color curves effect is enabled.
             */
            get: function () {
                return this.imageProcessingConfiguration.colorCurvesEnabled;
            },
            /**
             * Sets wether the color curves effect is enabled.
             */
            set: function (value) {
                this.imageProcessingConfiguration.colorCurvesEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BackgroundMaterial.prototype, "cameraColorGradingEnabled", {
            /**
             * Gets wether the color grading effect is enabled.
             */
            get: function () {
                return this.imageProcessingConfiguration.colorGradingEnabled;
            },
            /**
             * Gets wether the color grading effect is enabled.
             */
            set: function (value) {
                this.imageProcessingConfiguration.colorGradingEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BackgroundMaterial.prototype, "cameraToneMappingEnabled", {
            /**
             * Gets wether tonemapping is enabled or not.
             */
            get: function () {
                return this._imageProcessingConfiguration.toneMappingEnabled;
            },
            /**
             * Sets wether tonemapping is enabled or not
             */
            set: function (value) {
                this._imageProcessingConfiguration.toneMappingEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(BackgroundMaterial.prototype, "cameraExposure", {
            /**
             * The camera exposure used on this material.
             * This property is here and not in the camera to allow controlling exposure without full screen post process.
             * This corresponds to a photographic exposure.
             */
            get: function () {
                return this._imageProcessingConfiguration.exposure;
            },
            /**
             * The camera exposure used on this material.
             * This property is here and not in the camera to allow controlling exposure without full screen post process.
             * This corresponds to a photographic exposure.
             */
            set: function (value) {
                this._imageProcessingConfiguration.exposure = value;
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(BackgroundMaterial.prototype, "cameraContrast", {
            /**
             * Gets The camera contrast used on this material.
             */
            get: function () {
                return this._imageProcessingConfiguration.contrast;
            },
            /**
             * Sets The camera contrast used on this material.
             */
            set: function (value) {
                this._imageProcessingConfiguration.contrast = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BackgroundMaterial.prototype, "cameraColorGradingTexture", {
            /**
             * Gets the Color Grading 2D Lookup Texture.
             */
            get: function () {
                return this._imageProcessingConfiguration.colorGradingTexture;
            },
            /**
             * Sets the Color Grading 2D Lookup Texture.
             */
            set: function (value) {
                this._imageProcessingConfiguration.colorGradingTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BackgroundMaterial.prototype, "cameraColorCurves", {
            /**
             * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
             * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
             * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
             * corresponding to low luminance, medium luminance, and high luminance areas respectively.
             */
            get: function () {
                return this._imageProcessingConfiguration.colorCurves;
            },
            /**
             * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
             * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
             * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
             * corresponding to low luminance, medium luminance, and high luminance areas respectively.
             */
            set: function (value) {
                this._imageProcessingConfiguration.colorCurves = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * The entire material has been created in order to prevent overdraw.
         * @returns false
         */
        BackgroundMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        /**
         * The entire material has been created in order to prevent overdraw.
         * @returns false
         */
        BackgroundMaterial.prototype.needAlphaBlending = function () {
            return false;
        };
        /**
         * Gets the environment texture to use in the material.
         * @returns the texture
         */
        BackgroundMaterial.prototype._getEnvironmentTexture = function () {
            if (this._environmentTexture) {
                return this._environmentTexture;
            }
            return this.getScene().environmentTexture;
        };
        /**
         * Checks wether the material is ready to be rendered for a given mesh.
         * @param mesh The mesh to render
         * @param subMesh The submesh to check against
         * @param useInstances Specify wether or not the material is used with instances
         */
        BackgroundMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            var _this = this;
            if (useInstances === void 0) { useInstances = false; }
            if (subMesh.effect && this.isFrozen) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new BackgroundMaterialDefines();
            }
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (defines._renderId === scene.getRenderId()) {
                    return true;
                }
            }
            var engine = scene.getEngine();
            // Lights
            BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights);
            defines._needNormals = true;
            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (scene.getEngine().getCaps().textureLOD) {
                        defines.TEXTURELODSUPPORT = true;
                    }
                    if (this._opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                        if (!this._opacityTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        BABYLON.MaterialHelper.PrepareDefinesForMergedUV(this._opacityTexture, defines, "OPACITY");
                        defines.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
                        defines.OPACITYFRESNEL = this._opacityFresnel;
                    }
                    else {
                        defines.OPACITY = false;
                        defines.OPACITYRGB = false;
                        defines.OPACITYFRESNEL = false;
                    }
                    var environmentTexture = this._getEnvironmentTexture();
                    if (environmentTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                        if (!environmentTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        BABYLON.MaterialHelper.PrepareDefinesForMergedUV(environmentTexture, defines, "ENVIRONMENT");
                        defines.GAMMAENVIRONMENT = environmentTexture.gammaSpace;
                        defines.ENVIRONMENTBLUR = this._environmentBlur > 0;
                        defines.RGBENVIRONMENT = !this.lightChannelsInTexture;
                    }
                    else {
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
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances, false);
            // Attribs
            if (BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, true, false)) {
                if (mesh) {
                    if (!scene.getEngine().getCaps().standardDerivatives && !mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                        mesh.createNormals(true);
                        BABYLON.Tools.Warn("BackgroundMaterial: Normals have been created for the mesh: " + mesh.name);
                    }
                }
            }
            // Get correct effect
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (defines.FOG) {
                    fallbacks.addFallback(0, "FOG");
                }
                if (defines.POINTSIZE) {
                    fallbacks.addFallback(1, "POINTSIZE");
                }
                BABYLON.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this._maxSimultaneousLights);
                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (defines.UV2) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, defines);
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
                BABYLON.ImageProcessingConfiguration.PrepareUniforms(uniforms, defines);
                BABYLON.ImageProcessingConfiguration.PrepareSamplers(samplers, defines);
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList({
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: defines,
                    maxSimultaneousLights: this._maxSimultaneousLights
                });
                var onCompiled = function (effect) {
                    if (_this.onCompiled) {
                        _this.onCompiled(effect);
                    }
                    _this.bindSceneUniformBuffer(effect, scene.getSceneUniformBuffer());
                };
                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect("background", {
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
        };
        /**
         * Build the uniform buffer used in the material.
         */
        BackgroundMaterial.prototype.buildUniformLayout = function () {
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
        };
        /**
         * Unbind the material.
         */
        BackgroundMaterial.prototype.unbind = function () {
            if (this._opacityTexture && this._opacityTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("opacitySampler", null);
            }
            if (this._environmentTexture && this._environmentTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("environmentSampler", null);
            }
            _super.prototype.unbind.call(this);
        };
        /**
         * Bind only the world matrix to the material.
         * @param world The world matrix to bind.
         */
        BackgroundMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._activeEffect.setMatrix("world", world);
        };
        /**
         * Bind the material for a dedicated submeh (every used meshes will be considered opaque).
         * @param world The world matrix to bind.
         * @param subMesh The submesh to bind for.
         */
        BackgroundMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices
            this.bindOnlyWorldMatrix(world);
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            var mustRebind = this._mustRebind(scene, effect, mesh.visibility);
            if (mustRebind) {
                this._uniformBuffer.bindToEffect(effect, "Material");
                this.bindViewProjection(effect);
                var environmentTexture = this._getEnvironmentTexture();
                if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync) {
                    // Texture uniforms
                    if (scene.texturesEnabled) {
                        if (this._opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vOpacityInfo", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                            BABYLON.MaterialHelper.BindTextureMatrix(this._opacityTexture, this._uniformBuffer, "opacity");
                        }
                        if (environmentTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                            this._uniformBuffer.updateMatrix("environmentMatrix", environmentTexture.getReflectionTextureMatrix());
                            this._uniformBuffer.updateFloat2("vEnvironmentInfo", environmentTexture.level, this._environmentBlur);
                            this._uniformBuffer.updateFloat3("vEnvironmentMicrosurfaceInfos", environmentTexture.getSize().width, environmentTexture.lodGenerationScale, environmentTexture.lodGenerationOffset);
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
                    if (this._opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                        this._uniformBuffer.setTexture("opacitySampler", this._opacityTexture);
                    }
                    if (environmentTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
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
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                var eyePosition = scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.globalPosition;
                // var invertNormal = (scene.useRightHandedSystem === (scene._mirroredCameraPosition != null));
                effect.setFloat3("vEyePosition", eyePosition.x, eyePosition.y, eyePosition.z);
            }
            if (mustRebind || !this.isFrozen) {
                if (scene.lightsEnabled) {
                    BABYLON.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this._maxSimultaneousLights, false);
                }
                // View
                this.bindView(effect);
                // Fog
                BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
                // image processing
                this._imageProcessingConfiguration.bind(this._activeEffect);
            }
            this._uniformBuffer.update();
            this._afterBind(mesh);
            scene = null;
        };
        /**
         * Dispose the material.
         * @forceDisposeEffect Force disposal of the associated effect.
         * @forceDisposeTextures Force disposal of the associated textures.
         */
        BackgroundMaterial.prototype.dispose = function (forceDisposeEffect, forceDisposeTextures) {
            if (forceDisposeEffect === void 0) { forceDisposeEffect = false; }
            if (forceDisposeTextures === void 0) { forceDisposeTextures = false; }
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
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        /**
         * Clones the material.
         * @name The cloned name.
         * @returns The cloned material.
         */
        BackgroundMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new BackgroundMaterial(name, _this.getScene()); }, this);
        };
        /**
         * Serializes the current material to its JSON representation.
         * @returns The JSON representation.
         */
        BackgroundMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.BackgroundMaterial";
            return serializationObject;
        };
        /**
         * Gets the class name of the material
         * @returns "BackgroundMaterial"
         */
        BackgroundMaterial.prototype.getClassName = function () {
            return "BackgroundMaterial";
        };
        /**
         * Parse a JSON input to create back a background material.
         * @param source
         * @param scene
         * @param rootUrl
         * @returns the instantiated BackgroundMaterial.
         */
        BackgroundMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new BackgroundMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsColor3()
        ], BackgroundMaterial.prototype, "_primaryColor", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], BackgroundMaterial.prototype, "primaryColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], BackgroundMaterial.prototype, "_primaryLevel", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], BackgroundMaterial.prototype, "primaryLevel", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], BackgroundMaterial.prototype, "_secondaryColor", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], BackgroundMaterial.prototype, "secondaryColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], BackgroundMaterial.prototype, "_secondaryLevel", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], BackgroundMaterial.prototype, "secondaryLevel", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], BackgroundMaterial.prototype, "_thirdColor", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], BackgroundMaterial.prototype, "thirdColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], BackgroundMaterial.prototype, "_thirdLevel", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], BackgroundMaterial.prototype, "thirdLevel", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], BackgroundMaterial.prototype, "_environmentTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], BackgroundMaterial.prototype, "environmentTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], BackgroundMaterial.prototype, "_opacityTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], BackgroundMaterial.prototype, "opacityTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], BackgroundMaterial.prototype, "_environmentBlur", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], BackgroundMaterial.prototype, "environmentBlur", void 0);
        __decorate([
            BABYLON.serialize()
        ], BackgroundMaterial.prototype, "_lightChannelsInTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], BackgroundMaterial.prototype, "lightChannelsInTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], BackgroundMaterial.prototype, "shadowLights", void 0);
        __decorate([
            BABYLON.serialize()
        ], BackgroundMaterial.prototype, "_shadowBlurScale", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], BackgroundMaterial.prototype, "shadowBlurScale", void 0);
        __decorate([
            BABYLON.serialize()
        ], BackgroundMaterial.prototype, "_shadowLevel", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], BackgroundMaterial.prototype, "shadowLevel", void 0);
        __decorate([
            BABYLON.serialize()
        ], BackgroundMaterial.prototype, "_opacityFresnel", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], BackgroundMaterial.prototype, "opacityFresnel", void 0);
        __decorate([
            BABYLON.serializeAsImageProcessingConfiguration()
        ], BackgroundMaterial.prototype, "_imageProcessingConfiguration", void 0);
        return BackgroundMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.BackgroundMaterial = BackgroundMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.backgroundMaterial.js.map

BABYLON.Effect.ShadersStore['backgroundVertexShader'] = "precision highp float;\n#include<__decl__backgroundVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2; \n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normal);\n#endif\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif \n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0 \nif (vOpacityInfo.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['backgroundPixelShader'] = "#ifdef TEXTURELODSUPPORT\n#extension GL_EXT_shader_texture_lod : enable\n#endif\nprecision highp float;\n#include<__decl__backgroundFragment>\n\nuniform vec3 vEyePosition;\n\nvarying vec3 vPositionW;\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif \n#ifdef MAINUV2 \nvarying vec2 vMainUV2; \n#endif \n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef OPACITY\n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n\n#ifdef ENVIRONMENT\n#define sampleEnvironment(s,c) textureCube(s,c)\nuniform samplerCube environmentSampler;\n#ifdef ENVIRONMENTBLUR\n#ifdef TEXTURELODSUPPORT\n#define sampleEnvironmentLod(s,c,l) textureCubeLodEXT(s,c,l)\n#else\nuniform samplerCube environmentSamplerLow;\nuniform samplerCube environmentSamplerHigh;\n#endif\n#endif\n#endif\n\n#ifndef FROMLINEARSPACE\n#define FROMLINEARSPACE;\n#endif\n\n#ifndef SHADOWONLY\n#define SHADOWONLY;\n#endif\n#include<imageProcessingDeclaration>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<helperFunctions>\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n#include<imageProcessingFunctions>\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(0.0,1.0,0.0);\n#endif\n\nfloat shadow=1.;\n#include<lightFragment>[0..maxSimultaneousLights]\n\n#ifdef ENVIRONMENT\nvec3 environmentColor=vec3(0.,0.,0.);\n\nvec3 environmentCoords=(vPositionW.xyz-vEyePosition.xyz);\n#ifdef INVERTCUBICMAP\nenvironmentCoords.y=1.0-environmentCoords.y;\n#endif\n\nenvironmentCoords=vec3(environmentMatrix*vec4(environmentCoords,0));\n#ifdef ENVIRONMENTBLUR\nfloat environmentLOD=vEnvironmentInfo.y;\n#ifdef TEXTURELODSUPPORT\n\nenvironmentLOD=environmentLOD*log2(vEnvironmentMicrosurfaceInfos.x)*vEnvironmentMicrosurfaceInfos.y+vEnvironmentMicrosurfaceInfos.z;\nenvironmentColor=sampleEnvironmentLod(environmentSampler,environmentCoords,environmentLOD).rgb;\n#else\nfloat lodEnvironmentNormalized=clamp(environmentLOD,0.,1.);\nfloat lodEnvironmentNormalizedDoubled=lodEnvironmentNormalized*2.0;\nvec3 environmentSpecularMid=sampleEnvironment(environmentSampler,environmentCoords).rgb;\nif(lodEnvironmentNormalizedDoubled<1.0){\nenvironmentColor=mix(\nsampleEnvironment(environmentSamplerHigh,environmentCoords).rgb,\nenvironmentSpecularMid,\nlodEnvironmentNormalizedDoubled\n);\n} else {\nenvironmentColor=mix(\nenvironmentSpecularMid,\nsampleEnvironment(environmentSamplerLow,environmentCoords).rgb,\nlodEnvironmentNormalizedDoubled-1.0\n);\n}\n#endif\n#else\nenvironmentColor=sampleEnvironment(environmentSampler,environmentCoords).rgb;\n#endif\n#ifdef GAMMAENVIRONMENT\nenvironmentColor=toLinearSpace(environmentColor.rgb);\n#endif\n\nenvironmentColor*=vEnvironmentInfo.x;\n\n#ifdef OPACITY\nvec3 reflectEnvironmentColor=vec3(0.,0.,0.);\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV);\n#ifdef OPACITYRGB\nfloat environmentMix=getLuminance(opacityMap.rgb);\n#else\nfloat environmentMix=opacityMap.a;\n#endif\nenvironmentMix*=vOpacityInfo.y;\n#ifdef OPACITYFRESNEL\n\nfloat viewAngleToFloor=dot(normalW,normalize(vEyePosition));\n\nconst float startAngle=0.1;\nfloat fadeFactor=clamp(viewAngleToFloor/startAngle,0.0,1.0);\nenvironmentMix*=fadeFactor*fadeFactor;\nshadow=mix(1.,shadow,environmentMix);\n#endif\n\nvec3 viewDir=vPositionW.xyz-vEyePosition.xyz;\nvec3 reflectEnvironmentCoords=reflect(viewDir,normalW);\n#ifdef INVERTCUBICMAP\nreflectEnvironmentCoords.y=1.0-reflectEnvironmentCoords.y;\n#endif\n\nreflectEnvironmentCoords=vec3(environmentMatrix*vec4(reflectEnvironmentCoords,0));\n#ifdef ENVIRONMENTBLUR\n#ifdef TEXTURELODSUPPORT\n\nreflectEnvironmentColor=sampleEnvironmentLod(environmentSampler,reflectEnvironmentCoords,environmentLOD).rgb;\n#else\nvec3 reflectEnvironmentSpecularMid=sampleEnvironment(environmentSampler,reflectEnvironmentCoords).rgb;\nif(lodEnvironmentNormalizedDoubled<1.0){\nreflectEnvironmentColor=mix(\nsampleEnvironment(environmentSamplerHigh,reflectEnvironmentCoords).rgb,\nenvironmentSpecularMid,\nlodEnvironmentNormalizedDoubled\n);\n} else {\nreflectEnvironmentColor=mix(\nenvironmentSpecularMid,\nsampleEnvironment(environmentSamplerLow,reflectEnvironmentCoords).rgb,\nlodEnvironmentNormalizedDoubled-1.0\n);\n}\n#endif\n#else\nreflectEnvironmentColor=sampleEnvironment(environmentSampler,reflectEnvironmentCoords).rgb;\n#endif\n#ifdef GAMMAENVIRONMENT\nreflectEnvironmentColor=toLinearSpace(reflectEnvironmentColor.rgb);\n#endif\n\nreflectEnvironmentColor*=vEnvironmentInfo.x;\n\nenvironmentColor=mix(environmentColor,reflectEnvironmentColor,environmentMix);\n#endif\n#else\nvec3 environmentColor=vec3(1.,1.,1.);\n#endif\n\n#ifdef RGBENVIRONMENT\nenvironmentColor=vec3(1.,1.,1.)*getLuminance(environmentColor);\n#endif\n\nvec3 colorBase=environmentColor.r*vPrimaryColor.rgb*vPrimaryColor.a;\ncolorBase+=environmentColor.g*vSecondaryColor.rgb*vSecondaryColor.a;\ncolorBase+=environmentColor.b*vThirdColor.rgb*vThirdColor.a;\ncolorBase=mix(colorBase*shadowLevel,colorBase,shadow);\nvec4 color=vec4(colorBase,1.0);\n#include<fogFragment>\n#ifdef IMAGEPROCESSINGPOSTPROCESS\n\n\ncolor.rgb=clamp(color.rgb,0.,30.0);\n#else\n\ncolor=applyImageProcessing(color);\n#endif\ngl_FragColor=color;\n}";

BABYLON.Effect.IncludesShadersStore['backgroundFragmentDeclaration'] = " uniform vec4 vPrimaryColor;\nuniform vec4 vSecondaryColor;\nuniform vec4 vThirdColor;\nuniform float shadowLevel;\n#ifdef OPACITY\nuniform vec2 vOpacityInfo;\n#endif\n#ifdef ENVIRONMENT\nuniform vec2 vEnvironmentInfo;\nuniform mat4 environmentMatrix;\nuniform vec3 vEnvironmentMicrosurfaceInfos;\n#endif";
BABYLON.Effect.IncludesShadersStore['backgroundUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nuniform vec4 vPrimaryColor;\nuniform vec4 vSecondaryColor;\nuniform vec4 vThirdColor;\nuniform vec2 vOpacityInfo;\nuniform vec2 vEnvironmentInfo;\nuniform mat4 opacityMatrix;\nuniform mat4 environmentMatrix;\nuniform vec3 vEnvironmentMicrosurfaceInfos;\nuniform float pointSize;\nuniform float shadowLevel;\n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['backgroundVertexDeclaration'] = "uniform mat4 view;\nuniform mat4 viewProjection;\nuniform float shadowLevel;\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfo;\n#endif\n#ifdef ENVIRONMENT\nuniform vec2 vEnvironmentInfo;\nuniform mat4 environmentMatrix;\nuniform vec3 vEnvionmentMicrosurfaceInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
