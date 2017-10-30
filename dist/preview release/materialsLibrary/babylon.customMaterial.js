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
    // old version of standard material updated every 3 months
    var StandardMaterialDefines_OldVer = /** @class */ (function (_super) {
        __extends(StandardMaterialDefines_OldVer, _super);
        function StandardMaterialDefines_OldVer() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.AMBIENT = false;
            _this.OPACITY = false;
            _this.OPACITYRGB = false;
            _this.REFLECTION = false;
            _this.EMISSIVE = false;
            _this.SPECULAR = false;
            _this.BUMP = false;
            _this.PARALLAX = false;
            _this.PARALLAXOCCLUSION = false;
            _this.SPECULAROVERALPHA = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.ALPHAFROMDIFFUSE = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.SPECULARTERM = false;
            _this.DIFFUSEFRESNEL = false;
            _this.OPACITYFRESNEL = false;
            _this.REFLECTIONFRESNEL = false;
            _this.REFRACTIONFRESNEL = false;
            _this.EMISSIVEFRESNEL = false;
            _this.FRESNEL = false;
            _this.NORMAL = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.GLOSSINESS = false;
            _this.ROUGHNESS = false;
            _this.EMISSIVEASILLUMINATION = false;
            _this.LINKEMISSIVEWITHDIFFUSE = false;
            _this.REFLECTIONFRESNELFROMSPECULAR = false;
            _this.LIGHTMAP = false;
            _this.USELIGHTMAPASSHADOWMAP = false;
            _this.REFLECTIONMAP_3D = false;
            _this.REFLECTIONMAP_SPHERICAL = false;
            _this.REFLECTIONMAP_PLANAR = false;
            _this.REFLECTIONMAP_CUBIC = false;
            _this.REFLECTIONMAP_PROJECTION = false;
            _this.REFLECTIONMAP_SKYBOX = false;
            _this.REFLECTIONMAP_EXPLICIT = false;
            _this.REFLECTIONMAP_EQUIRECTANGULAR = false;
            _this.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
            _this.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
            _this.INVERTCUBICMAP = false;
            _this.LOGARITHMICDEPTH = false;
            _this.REFRACTION = false;
            _this.REFRACTIONMAP_3D = false;
            _this.REFLECTIONOVERALPHA = false;
            _this.TWOSIDEDLIGHTING = false;
            _this.SHADOWFLOAT = false;
            _this.MORPHTARGETS = false;
            _this.MORPHTARGETS_NORMAL = false;
            _this.MORPHTARGETS_TANGENT = false;
            _this.NUM_MORPH_INFLUENCERS = 0;
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
            _this.rebuild();
            return _this;
        }
        StandardMaterialDefines_OldVer.prototype.setReflectionMode = function (modeToEnable) {
            var modes = [
                "REFLECTIONMAP_CUBIC", "REFLECTIONMAP_EXPLICIT", "REFLECTIONMAP_PLANAR",
                "REFLECTIONMAP_PROJECTION", "REFLECTIONMAP_PROJECTION", "REFLECTIONMAP_SKYBOX",
                "REFLECTIONMAP_SPHERICAL", "REFLECTIONMAP_EQUIRECTANGULAR", "REFLECTIONMAP_EQUIRECTANGULAR_FIXED",
                "REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED"
            ];
            for (var _i = 0, modes_1 = modes; _i < modes_1.length; _i++) {
                var mode = modes_1[_i];
                this[mode] = (mode === modeToEnable);
            }
        };
        return StandardMaterialDefines_OldVer;
    }(BABYLON.MaterialDefines));
    BABYLON.StandardMaterialDefines_OldVer = StandardMaterialDefines_OldVer;
    var StandardMaterial_OldVer = /** @class */ (function (_super) {
        __extends(StandardMaterial_OldVer, _super);
        function StandardMaterial_OldVer(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.ambientColor = new BABYLON.Color3(0, 0, 0);
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this.specularColor = new BABYLON.Color3(1, 1, 1);
            _this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            _this.specularPower = 64;
            _this._useAlphaFromDiffuseTexture = false;
            _this._useEmissiveAsIllumination = false;
            _this._linkEmissiveWithDiffuse = false;
            _this._useSpecularOverAlpha = false;
            _this._useReflectionOverAlpha = false;
            _this._disableLighting = false;
            _this._useParallax = false;
            _this._useParallaxOcclusion = false;
            _this.parallaxScaleBias = 0.05;
            _this._roughness = 0;
            _this.indexOfRefraction = 0.98;
            _this.invertRefractionY = true;
            _this._useLightmapAsShadowmap = false;
            _this._useReflectionFresnelFromSpecular = false;
            _this._useGlossinessFromSpecularMapAlpha = false;
            _this._maxSimultaneousLights = 4;
            /**
             * If sets to true, x component of normal map value will invert (x = 1.0 - x).
             */
            _this._invertNormalMapX = false;
            /**
             * If sets to true, y component of normal map value will invert (y = 1.0 - y).
             */
            _this._invertNormalMapY = false;
            /**
             * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
             */
            _this._twoSidedLighting = false;
            _this._renderTargets = new BABYLON.SmartArray(16);
            _this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
            _this._globalAmbientColor = new BABYLON.Color3(0, 0, 0);
            // Setup the default processing configuration to the scene.
            _this._attachImageProcessingConfiguration(null);
            _this.getRenderTargetTextures = function () {
                _this._renderTargets.reset();
                if (StandardMaterial_OldVer.ReflectionTextureEnabled && _this._reflectionTexture && _this._reflectionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this._reflectionTexture);
                }
                if (StandardMaterial_OldVer.RefractionTextureEnabled && _this._refractionTexture && _this._refractionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this._refractionTexture);
                }
                return _this._renderTargets;
            };
            return _this;
        }
        Object.defineProperty(StandardMaterial_OldVer.prototype, "imageProcessingConfiguration", {
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
        /**
         * Attaches a new image processing configuration to the Standard Material.
         * @param configuration
         */
        StandardMaterial_OldVer.prototype._attachImageProcessingConfiguration = function (configuration) {
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
        Object.defineProperty(StandardMaterial_OldVer.prototype, "cameraColorCurvesEnabled", {
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
        Object.defineProperty(StandardMaterial_OldVer.prototype, "cameraColorGradingEnabled", {
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
        Object.defineProperty(StandardMaterial_OldVer.prototype, "cameraToneMappingEnabled", {
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
        Object.defineProperty(StandardMaterial_OldVer.prototype, "cameraExposure", {
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
        Object.defineProperty(StandardMaterial_OldVer.prototype, "cameraContrast", {
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
        Object.defineProperty(StandardMaterial_OldVer.prototype, "cameraColorGradingTexture", {
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
        StandardMaterial_OldVer.prototype.getClassName = function () {
            return "StandardMaterial_OldVer";
        };
        Object.defineProperty(StandardMaterial_OldVer.prototype, "useLogarithmicDepth", {
            get: function () {
                return this._useLogarithmicDepth;
            },
            set: function (value) {
                this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
                this._markAllSubMeshesAsMiscDirty();
            },
            enumerable: true,
            configurable: true
        });
        StandardMaterial_OldVer.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0) || (this._opacityTexture != null) || this._shouldUseAlphaFromDiffuseTexture() || this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled;
        };
        StandardMaterial_OldVer.prototype.needAlphaTesting = function () {
            return this._diffuseTexture != null && this._diffuseTexture.hasAlpha;
        };
        StandardMaterial_OldVer.prototype._shouldUseAlphaFromDiffuseTexture = function () {
            return this._diffuseTexture != null && this._diffuseTexture.hasAlpha && this._useAlphaFromDiffuseTexture;
        };
        StandardMaterial_OldVer.prototype.getAlphaTestTexture = function () {
            return this._diffuseTexture;
        };
        /**
         * Child classes can use it to update shaders
         */
        StandardMaterial_OldVer.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new StandardMaterialDefines_OldVer();
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
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && StandardMaterial_OldVer.DiffuseTextureEnabled) {
                        if (!this._diffuseTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.DIFFUSE = true;
                        }
                    }
                    else {
                        defines.DIFFUSE = false;
                    }
                    if (this._ambientTexture && StandardMaterial_OldVer.AmbientTextureEnabled) {
                        if (!this._ambientTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.AMBIENT = true;
                        }
                    }
                    else {
                        defines.AMBIENT = false;
                    }
                    if (this._opacityTexture && StandardMaterial_OldVer.OpacityTextureEnabled) {
                        if (!this._opacityTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.OPACITY = true;
                            defines.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
                        }
                    }
                    else {
                        defines.OPACITY = false;
                    }
                    if (this._reflectionTexture && StandardMaterial_OldVer.ReflectionTextureEnabled) {
                        if (!this._reflectionTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needNormals = true;
                            defines.REFLECTION = true;
                            defines.ROUGHNESS = (this._roughness > 0);
                            defines.REFLECTIONOVERALPHA = this._useReflectionOverAlpha;
                            defines.INVERTCUBICMAP = (this._reflectionTexture.coordinatesMode === BABYLON.Texture.INVCUBIC_MODE);
                            defines.REFLECTIONMAP_3D = this._reflectionTexture.isCube;
                            switch (this._reflectionTexture.coordinatesMode) {
                                case BABYLON.Texture.CUBIC_MODE:
                                case BABYLON.Texture.INVCUBIC_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_CUBIC");
                                    break;
                                case BABYLON.Texture.EXPLICIT_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_EXPLICIT");
                                    break;
                                case BABYLON.Texture.PLANAR_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_PLANAR");
                                    break;
                                case BABYLON.Texture.PROJECTION_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_PROJECTION");
                                    break;
                                case BABYLON.Texture.SKYBOX_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_SKYBOX");
                                    break;
                                case BABYLON.Texture.SPHERICAL_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_SPHERICAL");
                                    break;
                                case BABYLON.Texture.EQUIRECTANGULAR_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR");
                                    break;
                                case BABYLON.Texture.FIXED_EQUIRECTANGULAR_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR_FIXED");
                                    break;
                                case BABYLON.Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED");
                                    break;
                            }
                        }
                    }
                    else {
                        defines.REFLECTION = false;
                    }
                    if (this._emissiveTexture && StandardMaterial_OldVer.EmissiveTextureEnabled) {
                        if (!this._emissiveTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.EMISSIVE = true;
                        }
                    }
                    else {
                        defines.EMISSIVE = false;
                    }
                    if (this._lightmapTexture && StandardMaterial_OldVer.LightmapTextureEnabled) {
                        if (!this._lightmapTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.LIGHTMAP = true;
                            defines.USELIGHTMAPASSHADOWMAP = this._useLightmapAsShadowmap;
                        }
                    }
                    else {
                        defines.LIGHTMAP = false;
                    }
                    if (this._specularTexture && StandardMaterial_OldVer.SpecularTextureEnabled) {
                        if (!this._specularTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.SPECULAR = true;
                            defines.GLOSSINESS = this._useGlossinessFromSpecularMapAlpha;
                        }
                    }
                    else {
                        defines.SPECULAR = false;
                    }
                    if (scene.getEngine().getCaps().standardDerivatives && this._bumpTexture && StandardMaterial_OldVer.BumpTextureEnabled) {
                        // Bump texure can not be not blocking.
                        if (!this._bumpTexture.isReady()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.BUMP = true;
                            defines.PARALLAX = this._useParallax;
                            defines.PARALLAXOCCLUSION = this._useParallaxOcclusion;
                        }
                    }
                    else {
                        defines.BUMP = false;
                    }
                    if (this._refractionTexture && StandardMaterial_OldVer.RefractionTextureEnabled) {
                        if (!this._refractionTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.REFRACTION = true;
                            defines.REFRACTIONMAP_3D = this._refractionTexture.isCube;
                        }
                    }
                    else {
                        defines.REFRACTION = false;
                    }
                    defines.TWOSIDEDLIGHTING = !this._backFaceCulling && this._twoSidedLighting;
                }
                else {
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
                        defines.REFRACTIONFRESNEL = (this._refractionFresnelParameters && this._refractionFresnelParameters.isEnabled);
                        defines.EMISSIVEFRESNEL = (this._emissiveFresnelParameters && this._emissiveFresnelParameters.isEnabled);
                        defines._needNormals = true;
                        defines.FRESNEL = true;
                    }
                }
                else {
                    defines.FRESNEL = false;
                }
            }
            // Misc.
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, defines);
            // Attribs
            BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true, true);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false);
            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
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
                BABYLON.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this._maxSimultaneousLights);
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
                if (defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, defines);
                BABYLON.MaterialHelper.PrepareAttributesForMorphTargets(attribs, mesh, defines);
                var shaderName = "default";
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                    "diffuseLeftColor", "diffuseRightColor", "opacityParts", "reflectionLeftColor", "reflectionRightColor", "emissiveLeftColor", "emissiveRightColor", "refractionLeftColor", "refractionRightColor",
                    "logarithmicDepthConstant", "vTangentSpaceParams"
                ];
                var samplers = ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler"];
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
                if (this.customShaderNameResolve) {
                    shaderName = this.customShaderNameResolve(shaderName, uniforms, uniformBuffers, samplers, defines);
                }
                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect(shaderName, {
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
        };
        StandardMaterial_OldVer.prototype.buildUniformLayout = function () {
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
        };
        StandardMaterial_OldVer.prototype.unbind = function () {
            if (this._activeEffect) {
                if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                    this._activeEffect.setTexture("reflection2DSampler", null);
                }
                if (this._refractionTexture && this._refractionTexture.isRenderTarget) {
                    this._activeEffect.setTexture("refraction2DSampler", null);
                }
            }
            _super.prototype.unbind.call(this);
        };
        StandardMaterial_OldVer.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
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
            BABYLON.MaterialHelper.BindBonesParameters(mesh, effect);
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
                            this._uniformBuffer.updateColor4("opacityParts", new BABYLON.Color3(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power);
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
                            }
                            else {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? -1.0 : 1.0, this._invertNormalMapY ? -1.0 : 1.0);
                            }
                        }
                        if (this._refractionTexture && StandardMaterial_OldVer.RefractionTextureEnabled) {
                            var depth = 1.0;
                            if (!this._refractionTexture.isCube) {
                                this._uniformBuffer.updateMatrix("refractionMatrix", this._refractionTexture.getReflectionTextureMatrix());
                                if (this._refractionTexture.depth) {
                                    depth = this._refractionTexture.depth;
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
                        }
                        else {
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
                        }
                        else {
                            effect.setTexture("refraction2DSampler", this._refractionTexture);
                        }
                    }
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(effect, scene);
                // Colors
                scene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);
                BABYLON.MaterialHelper.BindEyePosition(effect, scene);
                effect.setColor3("vAmbientColor", this._globalAmbientColor);
            }
            if (this._mustRebind(scene, effect) || !this.isFrozen) {
                // Lights
                if (scene.lightsEnabled && !this._disableLighting) {
                    BABYLON.MaterialHelper.BindLights(scene, mesh, effect, defines, this._maxSimultaneousLights);
                }
                // View
                if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE || this._reflectionTexture || this._refractionTexture) {
                    this.bindView(effect);
                }
                // Fog
                BABYLON.MaterialHelper.BindFogParameters(scene, mesh, effect);
                // Morph targets
                if (defines.NUM_MORPH_INFLUENCERS) {
                    BABYLON.MaterialHelper.BindMorphTargetParameters(mesh, effect);
                }
                // Log. depth
                BABYLON.MaterialHelper.BindLogDepth(defines, effect, scene);
                // image processing
                this._imageProcessingConfiguration.bind(this._activeEffect);
            }
            this._uniformBuffer.update();
            this._afterBind(mesh, this._activeEffect);
        };
        StandardMaterial_OldVer.prototype.getAnimatables = function () {
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
        };
        StandardMaterial_OldVer.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
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
        };
        StandardMaterial_OldVer.prototype.dispose = function (forceDisposeEffect, forceDisposeTextures) {
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
            _super.prototype.dispose.call(this, forceDisposeEffect, forceDisposeTextures);
        };
        StandardMaterial_OldVer.prototype.clone = function (name) {
            var _this = this;
            var result = BABYLON.SerializationHelper.Clone(function () { return new StandardMaterial_OldVer(name, _this.getScene()); }, this);
            result.name = name;
            result.id = name;
            return result;
        };
        StandardMaterial_OldVer.prototype.serialize = function () {
            return BABYLON.SerializationHelper.Serialize(this);
        };
        // Statics
        StandardMaterial_OldVer.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new StandardMaterial_OldVer(source.name, scene); }, source, scene, rootUrl);
        };
        Object.defineProperty(StandardMaterial_OldVer, "DiffuseTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._DiffuseTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._DiffuseTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._DiffuseTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "AmbientTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._AmbientTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._AmbientTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._AmbientTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "OpacityTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._OpacityTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._OpacityTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._OpacityTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "ReflectionTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._ReflectionTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._ReflectionTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._ReflectionTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "EmissiveTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._EmissiveTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._EmissiveTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._EmissiveTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "SpecularTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._SpecularTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._SpecularTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._SpecularTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "BumpTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._BumpTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._BumpTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._BumpTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "LightmapTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._LightmapTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._LightmapTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._LightmapTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "RefractionTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._RefractionTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._RefractionTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._RefractionTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "ColorGradingTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._ColorGradingTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._ColorGradingTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._ColorGradingTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "FresnelEnabled", {
            get: function () {
                return StandardMaterial_OldVer._FresnelEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._FresnelEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._FresnelEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.FresnelDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        // Flags used to enable or disable a type of texture for all Standard Materials
        StandardMaterial_OldVer._DiffuseTextureEnabled = true;
        StandardMaterial_OldVer._AmbientTextureEnabled = true;
        StandardMaterial_OldVer._OpacityTextureEnabled = true;
        StandardMaterial_OldVer._ReflectionTextureEnabled = true;
        StandardMaterial_OldVer._EmissiveTextureEnabled = true;
        StandardMaterial_OldVer._SpecularTextureEnabled = true;
        StandardMaterial_OldVer._BumpTextureEnabled = true;
        StandardMaterial_OldVer._LightmapTextureEnabled = true;
        StandardMaterial_OldVer._RefractionTextureEnabled = true;
        StandardMaterial_OldVer._ColorGradingTextureEnabled = true;
        StandardMaterial_OldVer._FresnelEnabled = true;
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture")
        ], StandardMaterial_OldVer.prototype, "_diffuseTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "diffuseTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("ambientTexture")
        ], StandardMaterial_OldVer.prototype, "_ambientTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "ambientTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("opacityTexture")
        ], StandardMaterial_OldVer.prototype, "_opacityTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "opacityTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("reflectionTexture")
        ], StandardMaterial_OldVer.prototype, "_reflectionTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "reflectionTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("emissiveTexture")
        ], StandardMaterial_OldVer.prototype, "_emissiveTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "emissiveTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("specularTexture")
        ], StandardMaterial_OldVer.prototype, "_specularTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "specularTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("bumpTexture")
        ], StandardMaterial_OldVer.prototype, "_bumpTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "bumpTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("lightmapTexture")
        ], StandardMaterial_OldVer.prototype, "_lightmapTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "lightmapTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("refractionTexture")
        ], StandardMaterial_OldVer.prototype, "_refractionTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "refractionTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3("ambient")
        ], StandardMaterial_OldVer.prototype, "ambientColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("diffuse")
        ], StandardMaterial_OldVer.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("specular")
        ], StandardMaterial_OldVer.prototype, "specularColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("emissive")
        ], StandardMaterial_OldVer.prototype, "emissiveColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial_OldVer.prototype, "specularPower", void 0);
        __decorate([
            BABYLON.serialize("useAlphaFromDiffuseTexture")
        ], StandardMaterial_OldVer.prototype, "_useAlphaFromDiffuseTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useAlphaFromDiffuseTexture", void 0);
        __decorate([
            BABYLON.serialize("useEmissiveAsIllumination")
        ], StandardMaterial_OldVer.prototype, "_useEmissiveAsIllumination", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useEmissiveAsIllumination", void 0);
        __decorate([
            BABYLON.serialize("linkEmissiveWithDiffuse")
        ], StandardMaterial_OldVer.prototype, "_linkEmissiveWithDiffuse", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "linkEmissiveWithDiffuse", void 0);
        __decorate([
            BABYLON.serialize("useSpecularOverAlpha")
        ], StandardMaterial_OldVer.prototype, "_useSpecularOverAlpha", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useSpecularOverAlpha", void 0);
        __decorate([
            BABYLON.serialize("useReflectionOverAlpha")
        ], StandardMaterial_OldVer.prototype, "_useReflectionOverAlpha", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useReflectionOverAlpha", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], StandardMaterial_OldVer.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], StandardMaterial_OldVer.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize("useParallax")
        ], StandardMaterial_OldVer.prototype, "_useParallax", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useParallax", void 0);
        __decorate([
            BABYLON.serialize("useParallaxOcclusion")
        ], StandardMaterial_OldVer.prototype, "_useParallaxOcclusion", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useParallaxOcclusion", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial_OldVer.prototype, "parallaxScaleBias", void 0);
        __decorate([
            BABYLON.serialize("roughness")
        ], StandardMaterial_OldVer.prototype, "_roughness", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "roughness", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial_OldVer.prototype, "indexOfRefraction", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial_OldVer.prototype, "invertRefractionY", void 0);
        __decorate([
            BABYLON.serialize("useLightmapAsShadowmap")
        ], StandardMaterial_OldVer.prototype, "_useLightmapAsShadowmap", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useLightmapAsShadowmap", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters("diffuseFresnelParameters")
        ], StandardMaterial_OldVer.prototype, "_diffuseFresnelParameters", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsFresnelDirty")
        ], StandardMaterial_OldVer.prototype, "diffuseFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters("opacityFresnelParameters")
        ], StandardMaterial_OldVer.prototype, "_opacityFresnelParameters", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsFresnelDirty")
        ], StandardMaterial_OldVer.prototype, "opacityFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters("reflectionFresnelParameters")
        ], StandardMaterial_OldVer.prototype, "_reflectionFresnelParameters", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsFresnelDirty")
        ], StandardMaterial_OldVer.prototype, "reflectionFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters("refractionFresnelParameters")
        ], StandardMaterial_OldVer.prototype, "_refractionFresnelParameters", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsFresnelDirty")
        ], StandardMaterial_OldVer.prototype, "refractionFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters("emissiveFresnelParameters")
        ], StandardMaterial_OldVer.prototype, "_emissiveFresnelParameters", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsFresnelDirty")
        ], StandardMaterial_OldVer.prototype, "emissiveFresnelParameters", void 0);
        __decorate([
            BABYLON.serialize("useReflectionFresnelFromSpecular")
        ], StandardMaterial_OldVer.prototype, "_useReflectionFresnelFromSpecular", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsFresnelDirty")
        ], StandardMaterial_OldVer.prototype, "useReflectionFresnelFromSpecular", void 0);
        __decorate([
            BABYLON.serialize("useGlossinessFromSpecularMapAlpha")
        ], StandardMaterial_OldVer.prototype, "_useGlossinessFromSpecularMapAlpha", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useGlossinessFromSpecularMapAlpha", void 0);
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], StandardMaterial_OldVer.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], StandardMaterial_OldVer.prototype, "maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.serialize("invertNormalMapX")
        ], StandardMaterial_OldVer.prototype, "_invertNormalMapX", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "invertNormalMapX", void 0);
        __decorate([
            BABYLON.serialize("invertNormalMapY")
        ], StandardMaterial_OldVer.prototype, "_invertNormalMapY", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "invertNormalMapY", void 0);
        __decorate([
            BABYLON.serialize("twoSidedLighting")
        ], StandardMaterial_OldVer.prototype, "_twoSidedLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "twoSidedLighting", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial_OldVer.prototype, "useLogarithmicDepth", null);
        return StandardMaterial_OldVer;
    }(BABYLON.PushMaterial));
    BABYLON.StandardMaterial_OldVer = StandardMaterial_OldVer;
    var CustomShaderStructure = /** @class */ (function () {
        function CustomShaderStructure() {
        }
        return CustomShaderStructure;
    }());
    BABYLON.CustomShaderStructure = CustomShaderStructure;
    var ShaderSpecialParts = /** @class */ (function () {
        function ShaderSpecialParts() {
        }
        return ShaderSpecialParts;
    }());
    BABYLON.ShaderSpecialParts = ShaderSpecialParts;
    var ShaderForVer3_0 = /** @class */ (function (_super) {
        __extends(ShaderForVer3_0, _super);
        function ShaderForVer3_0() {
            var _this = _super.call(this) || this;
            _this.VertexStore = "";
            _this.FragmentStore = "#include<__decl__defaultFragment>\n\
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
            _this.VertexStore = "#include<__decl__defaultVertex>\n\
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
            return _this;
        }
        return ShaderForVer3_0;
    }(CustomShaderStructure));
    BABYLON.ShaderForVer3_0 = ShaderForVer3_0;
    var StandardShaderVersions = /** @class */ (function () {
        function StandardShaderVersions() {
        }
        StandardShaderVersions.Ver3_0 = "3.0.0";
        return StandardShaderVersions;
    }());
    BABYLON.StandardShaderVersions = StandardShaderVersions;
    var CustomMaterial = /** @class */ (function (_super) {
        __extends(CustomMaterial, _super);
        function CustomMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.CustomParts = new ShaderSpecialParts();
            _this.customShaderNameResolve = _this.Builder;
            _this.SelectVersion("3.0.0");
            return _this;
        }
        CustomMaterial.prototype.AttachAfterBind = function (mesh, effect) {
            for (var el in this._newUniformInstances) {
                var ea = el.toString().split('-');
                if (ea[0] == 'vec2')
                    effect.setVector2(ea[1], this._newUniformInstances[el]);
                else if (ea[0] == 'vec3')
                    effect.setVector3(ea[1], this._newUniformInstances[el]);
                else if (ea[0] == 'vec4')
                    effect.setVector4(ea[1], this._newUniformInstances[el]);
                else if (ea[0] == 'mat4')
                    effect.setMatrix(ea[1], this._newUniformInstances[el]);
                else if (ea[0] == 'float')
                    effect.setFloat(ea[1], this._newUniformInstances[el]);
            }
            for (var el in this._newSamplerInstances) {
                var ea = el.toString().split('-');
                if (ea[0] == 'sampler2D' && this._newSamplerInstances[el].isReady && this._newSamplerInstances[el].isReady())
                    effect.setTexture(ea[1], this._newSamplerInstances[el]);
            }
        };
        CustomMaterial.prototype.ReviewUniform = function (name, arr) {
            if (name == "uniform") {
                for (var ind in this._newUniforms)
                    if (this._customUniform[ind].indexOf('sampler') == -1)
                        arr.push(this._newUniforms[ind]);
            }
            if (name == "sampler") {
                for (var ind in this._newUniforms)
                    if (this._customUniform[ind].indexOf('sampler') != -1)
                        arr.push(this._newUniforms[ind]);
            }
            return arr;
        };
        CustomMaterial.prototype.Builder = function (shaderName, uniforms, uniformBuffers, samplers, defines) {
            var _this = this;
            if (this._isCreatedShader)
                return this._createdShaderName;
            this._isCreatedShader = false;
            CustomMaterial.ShaderIndexer++;
            var name = "custom_" + CustomMaterial.ShaderIndexer;
            this.ReviewUniform("uniform", uniforms);
            this.ReviewUniform("sampler", samplers);
            var fn_afterBind = this._afterBind;
            this._afterBind = function (m, e) {
                if (!e) {
                    return;
                }
                _this.AttachAfterBind(m, e);
                try {
                    fn_afterBind(m, e);
                }
                catch (e) { }
                ;
            };
            BABYLON.Effect.ShadersStore[name + "VertexShader"] = this.ShaderVersion.VertexStore
                .replace('#[Vertex_Begin]', (this.CustomParts.Vertex_Begin ? this.CustomParts.Vertex_Begin : ""))
                .replace('#[Vertex_Definitions]', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Vertex_Definitions ? this.CustomParts.Vertex_Definitions : ""))
                .replace('#[Vertex_MainBegin]', (this.CustomParts.Vertex_MainBegin ? this.CustomParts.Vertex_MainBegin : ""))
                .replace('#[Vertex_Before_PositionUpdated]', (this.CustomParts.Vertex_Before_PositionUpdated ? this.CustomParts.Vertex_Before_PositionUpdated : ""))
                .replace('#[Vertex_Before_NormalUpdated]', (this.CustomParts.Vertex_Before_NormalUpdated ? this.CustomParts.Vertex_Before_NormalUpdated : ""));
            BABYLON.Effect.ShadersStore[name + "PixelShader"] = this.ShaderVersion.FragmentStore
                .replace('#[Fragment_Begin]', (this.CustomParts.Fragment_Begin ? this.CustomParts.Fragment_Begin : ""))
                .replace('#[Fragment_MainBegin]', (this.CustomParts.Fragment_MainBegin ? this.CustomParts.Fragment_MainBegin : ""))
                .replace('#[Fragment_Definitions]', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Fragment_Definitions ? this.CustomParts.Fragment_Definitions : ""))
                .replace('#[Fragment_Custom_Diffuse]', (this.CustomParts.Fragment_Custom_Diffuse ? this.CustomParts.Fragment_Custom_Diffuse : ""))
                .replace('#[Fragment_Custom_Alpha]', (this.CustomParts.Fragment_Custom_Alpha ? this.CustomParts.Fragment_Custom_Alpha : ""))
                .replace('#[Fragment_Before_FragColor]', (this.CustomParts.Fragment_Before_FragColor ? this.CustomParts.Fragment_Before_FragColor : ""));
            this._isCreatedShader = true;
            this._createdShaderName = name;
            return name;
        };
        CustomMaterial.prototype.SelectVersion = function (ver) {
            switch (ver) {
                case "3.0.0":
                    this.ShaderVersion = new ShaderForVer3_0();
                    break;
            }
        };
        CustomMaterial.prototype.AddUniform = function (name, kind, param) {
            if (!this._customUniform) {
                this._customUniform = new Array();
                this._newUniforms = new Array();
                this._newSamplerInstances = new Array();
                this._newUniformInstances = new Array();
            }
            if (param) {
                if (kind.indexOf("sampler") == -1) {
                    this._newUniformInstances[kind + "-" + name] = param;
                }
                else {
                    this._newUniformInstances[kind + "-" + name] = param;
                }
            }
            this._customUniform.push("uniform " + kind + " " + name + ";");
            this._newUniforms.push(name);
            return this;
        };
        CustomMaterial.prototype.Fragment_Begin = function (shaderPart) {
            this.CustomParts.Fragment_Begin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_Definitions = function (shaderPart) {
            this.CustomParts.Fragment_Definitions = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_MainBegin = function (shaderPart) {
            this.CustomParts.Fragment_MainBegin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_Custom_Diffuse = function (shaderPart) {
            this.CustomParts.Fragment_Custom_Diffuse = shaderPart.replace("result", "diffuseColor");
            return this;
        };
        CustomMaterial.prototype.Fragment_Custom_Alpha = function (shaderPart) {
            this.CustomParts.Fragment_Custom_Alpha = shaderPart.replace("result", "alpha");
            return this;
        };
        CustomMaterial.prototype.Fragment_Before_FragColor = function (shaderPart) {
            this.CustomParts.Fragment_Before_FragColor = shaderPart.replace("result", "color");
            return this;
        };
        CustomMaterial.prototype.Vertex_Begin = function (shaderPart) {
            this.CustomParts.Vertex_Begin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_Definitions = function (shaderPart) {
            this.CustomParts.Vertex_Definitions = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_MainBegin = function (shaderPart) {
            this.CustomParts.Vertex_MainBegin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_Before_PositionUpdated = function (shaderPart) {
            this.CustomParts.Vertex_Before_PositionUpdated = shaderPart.replace("result", "positionUpdated");
            return this;
        };
        CustomMaterial.prototype.Vertex_Before_NormalUpdated = function (shaderPart) {
            this.CustomParts.Vertex_Before_NormalUpdated = shaderPart.replace("result", "normalUpdated");
            return this;
        };
        CustomMaterial.ShaderIndexer = 1;
        return CustomMaterial;
    }(StandardMaterial_OldVer));
    BABYLON.CustomMaterial = CustomMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.customMaterial.js.map
