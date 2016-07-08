var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var StandardMaterialDefines = (function (_super) {
        __extends(StandardMaterialDefines, _super);
        function StandardMaterialDefines() {
            _super.call(this);
            this.DIFFUSE = false;
            this.AMBIENT = false;
            this.OPACITY = false;
            this.OPACITYRGB = false;
            this.REFLECTION = false;
            this.EMISSIVE = false;
            this.SPECULAR = false;
            this.BUMP = false;
            this.PARALLAX = false;
            this.PARALLAXOCCLUSION = false;
            this.SPECULAROVERALPHA = false;
            this.CLIPPLANE = false;
            this.ALPHATEST = false;
            this.ALPHAFROMDIFFUSE = false;
            this.POINTSIZE = false;
            this.FOG = false;
            this.SPECULARTERM = false;
            this.DIFFUSEFRESNEL = false;
            this.OPACITYFRESNEL = false;
            this.REFLECTIONFRESNEL = false;
            this.REFRACTIONFRESNEL = false;
            this.EMISSIVEFRESNEL = false;
            this.FRESNEL = false;
            this.NORMAL = false;
            this.UV1 = false;
            this.UV2 = false;
            this.VERTEXCOLOR = false;
            this.VERTEXALPHA = false;
            this.NUM_BONE_INFLUENCERS = 0;
            this.BonesPerMesh = 0;
            this.INSTANCES = false;
            this.GLOSSINESS = false;
            this.ROUGHNESS = false;
            this.EMISSIVEASILLUMINATION = false;
            this.LINKEMISSIVEWITHDIFFUSE = false;
            this.REFLECTIONFRESNELFROMSPECULAR = false;
            this.LIGHTMAP = false;
            this.USELIGHTMAPASSHADOWMAP = false;
            this.REFLECTIONMAP_3D = false;
            this.REFLECTIONMAP_SPHERICAL = false;
            this.REFLECTIONMAP_PLANAR = false;
            this.REFLECTIONMAP_CUBIC = false;
            this.REFLECTIONMAP_PROJECTION = false;
            this.REFLECTIONMAP_SKYBOX = false;
            this.REFLECTIONMAP_EXPLICIT = false;
            this.REFLECTIONMAP_EQUIRECTANGULAR = false;
            this.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
            this.INVERTCUBICMAP = false;
            this.LOGARITHMICDEPTH = false;
            this.REFRACTION = false;
            this.REFRACTIONMAP_3D = false;
            this.REFLECTIONOVERALPHA = false;
            this.INVERTNORMALMAPX = false;
            this.INVERTNORMALMAPY = false;
            this.SHADOWFULLFLOAT = false;
            this.CAMERACOLORGRADING = false;
            this.CAMERACOLORCURVES = false;
            this.rebuild();
        }
        return StandardMaterialDefines;
    }(BABYLON.MaterialDefines));
    var StandardMaterial = (function (_super) {
        __extends(StandardMaterial, _super);
        function StandardMaterial(name, scene) {
            var _this = this;
            _super.call(this, name, scene);
            this.ambientColor = new BABYLON.Color3(0, 0, 0);
            this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            this.specularColor = new BABYLON.Color3(1, 1, 1);
            this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            this.specularPower = 64;
            this.useAlphaFromDiffuseTexture = false;
            this.useEmissiveAsIllumination = false;
            this.linkEmissiveWithDiffuse = false;
            this.useReflectionFresnelFromSpecular = false;
            this.useSpecularOverAlpha = false;
            this.useReflectionOverAlpha = false;
            this.disableLighting = false;
            this.useParallax = false;
            this.useParallaxOcclusion = false;
            this.parallaxScaleBias = 0.05;
            this.roughness = 0;
            this.indexOfRefraction = 0.98;
            this.invertRefractionY = true;
            this.useLightmapAsShadowmap = false;
            this.useGlossinessFromSpecularMapAlpha = false;
            this.maxSimultaneousLights = 4;
            /**
             * If sets to true, x component of normal map value will invert (x = 1.0 - x).
             */
            this.invertNormalMapX = false;
            /**
             * If sets to true, y component of normal map value will invert (y = 1.0 - y).
             */
            this.invertNormalMapY = false;
            /**
             * Color Grading 2D Lookup Texture.
             * This allows special effects like sepia, black and white to sixties rendering style.
             */
            this.cameraColorGradingTexture = null;
            /**
             * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
             * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
             * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
             * corresponding to low luminance, medium luminance, and high luminance areas respectively.
             */
            this.cameraColorCurves = null;
            this._renderTargets = new BABYLON.SmartArray(16);
            this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
            this._globalAmbientColor = new BABYLON.Color3(0, 0, 0);
            this._defines = new StandardMaterialDefines();
            this._cachedDefines = new StandardMaterialDefines();
            this._cachedDefines.BonesPerMesh = -1;
            this.getRenderTargetTextures = function () {
                _this._renderTargets.reset();
                if (_this.reflectionTexture && _this.reflectionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this.reflectionTexture);
                }
                if (_this.refractionTexture && _this.refractionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this.refractionTexture);
                }
                return _this._renderTargets;
            };
        }
        Object.defineProperty(StandardMaterial.prototype, "useLogarithmicDepth", {
            get: function () {
                return this._useLogarithmicDepth;
            },
            set: function (value) {
                this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
            },
            enumerable: true,
            configurable: true
        });
        StandardMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0) || (this.opacityTexture != null) || this._shouldUseAlphaFromDiffuseTexture() || this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled;
        };
        StandardMaterial.prototype.needAlphaTesting = function () {
            return this.diffuseTexture != null && this.diffuseTexture.hasAlpha;
        };
        StandardMaterial.prototype._shouldUseAlphaFromDiffuseTexture = function () {
            return this.diffuseTexture != null && this.diffuseTexture.hasAlpha && this.useAlphaFromDiffuseTexture;
        };
        StandardMaterial.prototype.getAlphaTestTexture = function () {
            return this.diffuseTexture;
        };
        // Methods   
        StandardMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
            if (!mesh) {
                return true;
            }
            if (this._defines.INSTANCES !== useInstances) {
                return false;
            }
            if (mesh._materialDefines && mesh._materialDefines.isEqual(this._defines)) {
                return true;
            }
            return false;
        };
        StandardMaterial.prototype.isReady = function (mesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }
            var scene = this.getScene();
            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                    if (this._checkCache(scene, mesh, useInstances)) {
                        return true;
                    }
                }
            }
            var engine = scene.getEngine();
            var needNormals = false;
            var needUVs = false;
            this._defines.reset();
            // Textures
            if (scene.texturesEnabled) {
                if (this.diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.diffuseTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.DIFFUSE = true;
                    }
                }
                if (this.ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                    if (!this.ambientTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.AMBIENT = true;
                    }
                }
                if (this.opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                    if (!this.opacityTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.OPACITY = true;
                        if (this.opacityTexture.getAlphaFromRGB) {
                            this._defines.OPACITYRGB = true;
                        }
                    }
                }
                if (this.reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                    if (!this.reflectionTexture.isReady()) {
                        return false;
                    }
                    else {
                        needNormals = true;
                        this._defines.REFLECTION = true;
                        if (this.roughness > 0) {
                            this._defines.ROUGHNESS = true;
                        }
                        if (this.useReflectionOverAlpha) {
                            this._defines.REFLECTIONOVERALPHA = true;
                        }
                        if (this.reflectionTexture.coordinatesMode === BABYLON.Texture.INVCUBIC_MODE) {
                            this._defines.INVERTCUBICMAP = true;
                        }
                        this._defines.REFLECTIONMAP_3D = this.reflectionTexture.isCube;
                        switch (this.reflectionTexture.coordinatesMode) {
                            case BABYLON.Texture.CUBIC_MODE:
                            case BABYLON.Texture.INVCUBIC_MODE:
                                this._defines.REFLECTIONMAP_CUBIC = true;
                                break;
                            case BABYLON.Texture.EXPLICIT_MODE:
                                this._defines.REFLECTIONMAP_EXPLICIT = true;
                                break;
                            case BABYLON.Texture.PLANAR_MODE:
                                this._defines.REFLECTIONMAP_PLANAR = true;
                                break;
                            case BABYLON.Texture.PROJECTION_MODE:
                                this._defines.REFLECTIONMAP_PROJECTION = true;
                                break;
                            case BABYLON.Texture.SKYBOX_MODE:
                                this._defines.REFLECTIONMAP_SKYBOX = true;
                                break;
                            case BABYLON.Texture.SPHERICAL_MODE:
                                this._defines.REFLECTIONMAP_SPHERICAL = true;
                                break;
                            case BABYLON.Texture.EQUIRECTANGULAR_MODE:
                                this._defines.REFLECTIONMAP_EQUIRECTANGULAR = true;
                                break;
                            case BABYLON.Texture.FIXED_EQUIRECTANGULAR_MODE:
                                this._defines.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = true;
                                break;
                        }
                    }
                }
                if (this.emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                    if (!this.emissiveTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.EMISSIVE = true;
                    }
                }
                if (this.lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                    if (!this.lightmapTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.LIGHTMAP = true;
                        this._defines.USELIGHTMAPASSHADOWMAP = this.useLightmapAsShadowmap;
                    }
                }
                if (this.specularTexture && StandardMaterial.SpecularTextureEnabled) {
                    if (!this.specularTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.SPECULAR = true;
                        this._defines.GLOSSINESS = this.useGlossinessFromSpecularMapAlpha;
                    }
                }
                if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && StandardMaterial.BumpTextureEnabled) {
                    if (!this.bumpTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.BUMP = true;
                        if (this.useParallax) {
                            this._defines.PARALLAX = true;
                            if (this.useParallaxOcclusion) {
                                this._defines.PARALLAXOCCLUSION = true;
                            }
                        }
                        if (this.invertNormalMapX) {
                            this._defines.INVERTNORMALMAPX = true;
                        }
                        if (this.invertNormalMapY) {
                            this._defines.INVERTNORMALMAPY = true;
                        }
                    }
                }
                if (this.refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                    if (!this.refractionTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.REFRACTION = true;
                        this._defines.REFRACTIONMAP_3D = this.refractionTexture.isCube;
                    }
                }
                if (this.cameraColorGradingTexture && StandardMaterial.ColorGradingTextureEnabled) {
                    if (!this.cameraColorGradingTexture.isReady()) {
                        return false;
                    }
                    else {
                        this._defines.CAMERACOLORGRADING = true;
                    }
                }
            }
            // Effect
            if (scene.clipPlane) {
                this._defines.CLIPPLANE = true;
            }
            if (engine.getAlphaTesting()) {
                this._defines.ALPHATEST = true;
            }
            if (this._shouldUseAlphaFromDiffuseTexture()) {
                this._defines.ALPHAFROMDIFFUSE = true;
            }
            if (this.useEmissiveAsIllumination) {
                this._defines.EMISSIVEASILLUMINATION = true;
            }
            if (this.linkEmissiveWithDiffuse) {
                this._defines.LINKEMISSIVEWITHDIFFUSE = true;
            }
            if (this.useLogarithmicDepth) {
                this._defines.LOGARITHMICDEPTH = true;
            }
            if (this.cameraColorCurves) {
                this._defines.CAMERACOLORCURVES = true;
            }
            // Point size
            if (this.pointsCloud || scene.forcePointsCloud) {
                this._defines.POINTSIZE = true;
            }
            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }
            if (scene.lightsEnabled && !this.disableLighting) {
                needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines, this.maxSimultaneousLights);
            }
            if (StandardMaterial.FresnelEnabled) {
                // Fresnel
                if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled ||
                    this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled ||
                    this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled ||
                    this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled ||
                    this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
                    if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled) {
                        this._defines.DIFFUSEFRESNEL = true;
                    }
                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        this._defines.OPACITYFRESNEL = true;
                    }
                    if (this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
                        this._defines.REFLECTIONFRESNEL = true;
                        if (this.useReflectionFresnelFromSpecular) {
                            this._defines.REFLECTIONFRESNELFROMSPECULAR = true;
                        }
                    }
                    if (this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled) {
                        this._defines.REFRACTIONFRESNEL = true;
                    }
                    if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                        this._defines.EMISSIVEFRESNEL = true;
                    }
                    needNormals = true;
                    this._defines.FRESNEL = true;
                }
            }
            if (this._defines.SPECULARTERM && this.useSpecularOverAlpha) {
                this._defines.SPECULAROVERALPHA = true;
            }
            // Attribs
            if (mesh) {
                if (needNormals && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                }
                if (needUVs) {
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                        this._defines.UV1 = true;
                    }
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                        this._defines.UV2 = true;
                    }
                }
                if (mesh.useVertexColors && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                    this._defines.VERTEXCOLOR = true;
                    if (mesh.hasVertexAlpha) {
                        this._defines.VERTEXALPHA = true;
                    }
                }
                if (mesh.useBones && mesh.computeBonesUsingShaders) {
                    this._defines.NUM_BONE_INFLUENCERS = mesh.numBoneInfluencers;
                    this._defines.BonesPerMesh = (mesh.skeleton.bones.length + 1);
                }
                // Instances
                if (useInstances) {
                    this._defines.INSTANCES = true;
                }
            }
            // Get correct effect      
            if (!this._defines.isEqual(this._cachedDefines)) {
                this._defines.cloneTo(this._cachedDefines);
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
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
                BABYLON.MaterialHelper.HandleFallbacksForShadows(this._defines, fallbacks, this.maxSimultaneousLights);
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
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (this._defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (this._defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (this._defines.UV2) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
                }
                if (this._defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, this._defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, this._defines);
                // Legacy browser patch
                var shaderName = "default";
                if (!scene.getEngine().getCaps().standardDerivatives) {
                    shaderName = "legacydefault";
                }
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
                var samplers = ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler"];
                BABYLON.ColorCurves.PrepareUniforms(uniforms);
                BABYLON.ColorGradingTexture.PrepareUniformsAndSamplers(uniforms, samplers);
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList(uniforms, samplers, this._defines, this.maxSimultaneousLights);
                this._effect = scene.getEngine().createEffect(shaderName, attribs, uniforms, samplers, join, fallbacks, this.onCompiled, this.onError, { maxSimultaneousLights: this.maxSimultaneousLights - 1 });
            }
            if (!this._effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new StandardMaterialDefines();
                }
                this._defines.cloneTo(mesh._materialDefines);
            }
            return true;
        };
        StandardMaterial.prototype.unbind = function () {
            if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
                this._effect.setTexture("reflection2DSampler", null);
            }
            if (this.refractionTexture && this.refractionTexture.isRenderTarget) {
                this._effect.setTexture("refraction2DSampler", null);
            }
            _super.prototype.unbind.call(this);
        };
        StandardMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        StandardMaterial.prototype.bind = function (world, mesh) {
            var scene = this.getScene();
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._effect);
            if (scene.getCachedMaterial() !== this) {
                this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
                if (StandardMaterial.FresnelEnabled) {
                    // Fresnel
                    if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled) {
                        this._effect.setColor4("diffuseLeftColor", this.diffuseFresnelParameters.leftColor, this.diffuseFresnelParameters.power);
                        this._effect.setColor4("diffuseRightColor", this.diffuseFresnelParameters.rightColor, this.diffuseFresnelParameters.bias);
                    }
                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        this._effect.setColor4("opacityParts", new BABYLON.Color3(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power);
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
                    if (this.diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                        this._effect.setTexture("diffuseSampler", this.diffuseTexture);
                        this._effect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                        this._effect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
                    }
                    if (this.ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                        this._effect.setTexture("ambientSampler", this.ambientTexture);
                        this._effect.setFloat2("vAmbientInfos", this.ambientTexture.coordinatesIndex, this.ambientTexture.level);
                        this._effect.setMatrix("ambientMatrix", this.ambientTexture.getTextureMatrix());
                    }
                    if (this.opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                        this._effect.setTexture("opacitySampler", this.opacityTexture);
                        this._effect.setFloat2("vOpacityInfos", this.opacityTexture.coordinatesIndex, this.opacityTexture.level);
                        this._effect.setMatrix("opacityMatrix", this.opacityTexture.getTextureMatrix());
                    }
                    if (this.reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                        if (this.reflectionTexture.isCube) {
                            this._effect.setTexture("reflectionCubeSampler", this.reflectionTexture);
                        }
                        else {
                            this._effect.setTexture("reflection2DSampler", this.reflectionTexture);
                        }
                        this._effect.setMatrix("reflectionMatrix", this.reflectionTexture.getReflectionTextureMatrix());
                        this._effect.setFloat2("vReflectionInfos", this.reflectionTexture.level, this.roughness);
                    }
                    if (this.emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                        this._effect.setTexture("emissiveSampler", this.emissiveTexture);
                        this._effect.setFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
                        this._effect.setMatrix("emissiveMatrix", this.emissiveTexture.getTextureMatrix());
                    }
                    if (this.lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                        this._effect.setTexture("lightmapSampler", this.lightmapTexture);
                        this._effect.setFloat2("vLightmapInfos", this.lightmapTexture.coordinatesIndex, this.lightmapTexture.level);
                        this._effect.setMatrix("lightmapMatrix", this.lightmapTexture.getTextureMatrix());
                    }
                    if (this.specularTexture && StandardMaterial.SpecularTextureEnabled) {
                        this._effect.setTexture("specularSampler", this.specularTexture);
                        this._effect.setFloat2("vSpecularInfos", this.specularTexture.coordinatesIndex, this.specularTexture.level);
                        this._effect.setMatrix("specularMatrix", this.specularTexture.getTextureMatrix());
                    }
                    if (this.bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled) {
                        this._effect.setTexture("bumpSampler", this.bumpTexture);
                        this._effect.setFloat3("vBumpInfos", this.bumpTexture.coordinatesIndex, 1.0 / this.bumpTexture.level, this.parallaxScaleBias);
                        this._effect.setMatrix("bumpMatrix", this.bumpTexture.getTextureMatrix());
                    }
                    if (this.refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        var depth = 1.0;
                        if (this.refractionTexture.isCube) {
                            this._effect.setTexture("refractionCubeSampler", this.refractionTexture);
                        }
                        else {
                            this._effect.setTexture("refraction2DSampler", this.refractionTexture);
                            this._effect.setMatrix("refractionMatrix", this.refractionTexture.getReflectionTextureMatrix());
                            if (this.refractionTexture.depth) {
                                depth = this.refractionTexture.depth;
                            }
                        }
                        this._effect.setFloat4("vRefractionInfos", this.refractionTexture.level, this.indexOfRefraction, depth, this.invertRefractionY ? -1 : 1);
                    }
                    if (this.cameraColorGradingTexture && StandardMaterial.ColorGradingTextureEnabled) {
                        BABYLON.ColorGradingTexture.Bind(this.cameraColorGradingTexture, this._effect);
                    }
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._effect, scene);
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
                    BABYLON.MaterialHelper.BindLights(scene, mesh, this._effect, this._defines, this.maxSimultaneousLights);
                }
                // View
                if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE || this.reflectionTexture || this.refractionTexture) {
                    this._effect.setMatrix("view", scene.getViewMatrix());
                }
                // Fog
                BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._effect);
                // Log. depth
                BABYLON.MaterialHelper.BindLogDepth(this._defines, this._effect, scene);
                // Color Curves
                if (this.cameraColorCurves) {
                    BABYLON.ColorCurves.Bind(this.cameraColorCurves, this._effect);
                }
            }
            _super.prototype.bind.call(this, world, mesh);
        };
        StandardMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }
            if (this.ambientTexture && this.ambientTexture.animations && this.ambientTexture.animations.length > 0) {
                results.push(this.ambientTexture);
            }
            if (this.opacityTexture && this.opacityTexture.animations && this.opacityTexture.animations.length > 0) {
                results.push(this.opacityTexture);
            }
            if (this.reflectionTexture && this.reflectionTexture.animations && this.reflectionTexture.animations.length > 0) {
                results.push(this.reflectionTexture);
            }
            if (this.emissiveTexture && this.emissiveTexture.animations && this.emissiveTexture.animations.length > 0) {
                results.push(this.emissiveTexture);
            }
            if (this.specularTexture && this.specularTexture.animations && this.specularTexture.animations.length > 0) {
                results.push(this.specularTexture);
            }
            if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
                results.push(this.bumpTexture);
            }
            if (this.lightmapTexture && this.lightmapTexture.animations && this.lightmapTexture.animations.length > 0) {
                results.push(this.lightmapTexture);
            }
            if (this.refractionTexture && this.refractionTexture.animations && this.refractionTexture.animations.length > 0) {
                results.push(this.refractionTexture);
            }
            if (this.cameraColorGradingTexture && this.cameraColorGradingTexture.animations && this.cameraColorGradingTexture.animations.length > 0) {
                results.push(this.cameraColorGradingTexture);
            }
            return results;
        };
        StandardMaterial.prototype.dispose = function (forceDisposeEffect, forceDisposeTextures) {
            if (forceDisposeTextures) {
                if (this.diffuseTexture) {
                    this.diffuseTexture.dispose();
                }
                if (this.ambientTexture) {
                    this.ambientTexture.dispose();
                }
                if (this.opacityTexture) {
                    this.opacityTexture.dispose();
                }
                if (this.reflectionTexture) {
                    this.reflectionTexture.dispose();
                }
                if (this.emissiveTexture) {
                    this.emissiveTexture.dispose();
                }
                if (this.specularTexture) {
                    this.specularTexture.dispose();
                }
                if (this.bumpTexture) {
                    this.bumpTexture.dispose();
                }
                if (this.lightmapTexture) {
                    this.lightmapTexture.dispose();
                }
                if (this.refractionTexture) {
                    this.refractionTexture.dispose();
                }
                if (this.cameraColorGradingTexture) {
                    this.cameraColorGradingTexture.dispose();
                }
            }
            _super.prototype.dispose.call(this, forceDisposeEffect, forceDisposeTextures);
        };
        StandardMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new StandardMaterial(name, _this.getScene()); }, this);
        };
        StandardMaterial.prototype.serialize = function () {
            return BABYLON.SerializationHelper.Serialize(this);
        };
        // Statics
        StandardMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new StandardMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        // Flags used to enable or disable a type of texture for all Standard Materials
        StandardMaterial.DiffuseTextureEnabled = true;
        StandardMaterial.AmbientTextureEnabled = true;
        StandardMaterial.OpacityTextureEnabled = true;
        StandardMaterial.ReflectionTextureEnabled = true;
        StandardMaterial.EmissiveTextureEnabled = true;
        StandardMaterial.SpecularTextureEnabled = true;
        StandardMaterial.BumpTextureEnabled = true;
        StandardMaterial.FresnelEnabled = true;
        StandardMaterial.LightmapTextureEnabled = true;
        StandardMaterial.RefractionTextureEnabled = true;
        StandardMaterial.ColorGradingTextureEnabled = true;
        __decorate([
            BABYLON.serializeAsTexture()
        ], StandardMaterial.prototype, "diffuseTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], StandardMaterial.prototype, "ambientTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], StandardMaterial.prototype, "opacityTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], StandardMaterial.prototype, "reflectionTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], StandardMaterial.prototype, "emissiveTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], StandardMaterial.prototype, "specularTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], StandardMaterial.prototype, "bumpTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], StandardMaterial.prototype, "lightmapTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], StandardMaterial.prototype, "refractionTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3("ambient")
        ], StandardMaterial.prototype, "ambientColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("diffuse")
        ], StandardMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("specular")
        ], StandardMaterial.prototype, "specularColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("emissive")
        ], StandardMaterial.prototype, "emissiveColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "specularPower", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "useAlphaFromDiffuseTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "useEmissiveAsIllumination", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "linkEmissiveWithDiffuse", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "useReflectionFresnelFromSpecular", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "useSpecularOverAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "useReflectionOverAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "useParallax", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "useParallaxOcclusion", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "parallaxScaleBias", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "roughness", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "indexOfRefraction", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "invertRefractionY", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "useLightmapAsShadowmap", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], StandardMaterial.prototype, "diffuseFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], StandardMaterial.prototype, "opacityFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], StandardMaterial.prototype, "reflectionFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], StandardMaterial.prototype, "refractionFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], StandardMaterial.prototype, "emissiveFresnelParameters", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "useGlossinessFromSpecularMapAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "invertNormalMapX", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "invertNormalMapY", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], StandardMaterial.prototype, "cameraColorGradingTexture", void 0);
        __decorate([
            BABYLON.serializeAsColorCurves()
        ], StandardMaterial.prototype, "cameraColorCurves", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial.prototype, "useLogarithmicDepth", null);
        return StandardMaterial;
    }(BABYLON.Material));
    BABYLON.StandardMaterial = StandardMaterial;
})(BABYLON || (BABYLON = {}));
