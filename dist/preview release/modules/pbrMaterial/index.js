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

if(typeof require !== 'undefined'){
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    var BABYLON = globalObject["BABYLON"] || {}; 
var BABYLON0 = require('babylonjs/core');
if(BABYLON !== BABYLON0) __extends(BABYLON, BABYLON0);


var BABYLON;
(function (BABYLON) {
    var PBRMaterialDefines = /** @class */ (function (_super) {
        __extends(PBRMaterialDefines, _super);
        function PBRMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.PBR = true;
            _this.MAINUV1 = false;
            _this.MAINUV2 = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.ALBEDO = false;
            _this.ALBEDODIRECTUV = 0;
            _this.VERTEXCOLOR = false;
            _this.AMBIENT = false;
            _this.AMBIENTDIRECTUV = 0;
            _this.AMBIENTINGRAYSCALE = false;
            _this.OPACITY = false;
            _this.VERTEXALPHA = false;
            _this.OPACITYDIRECTUV = 0;
            _this.OPACITYRGB = false;
            _this.ALPHATEST = false;
            _this.DEPTHPREPASS = false;
            _this.ALPHABLEND = false;
            _this.ALPHAFROMALBEDO = false;
            _this.ALPHATESTVALUE = 0.5;
            _this.SPECULAROVERALPHA = false;
            _this.RADIANCEOVERALPHA = false;
            _this.ALPHAFRESNEL = false;
            _this.LINEARALPHAFRESNEL = false;
            _this.PREMULTIPLYALPHA = false;
            _this.EMISSIVE = false;
            _this.EMISSIVEDIRECTUV = 0;
            _this.REFLECTIVITY = false;
            _this.REFLECTIVITYDIRECTUV = 0;
            _this.SPECULARTERM = false;
            _this.MICROSURFACEFROMREFLECTIVITYMAP = false;
            _this.MICROSURFACEAUTOMATIC = false;
            _this.LODBASEDMICROSFURACE = false;
            _this.MICROSURFACEMAP = false;
            _this.MICROSURFACEMAPDIRECTUV = 0;
            _this.METALLICWORKFLOW = false;
            _this.ROUGHNESSSTOREINMETALMAPALPHA = false;
            _this.ROUGHNESSSTOREINMETALMAPGREEN = false;
            _this.METALLNESSSTOREINMETALMAPBLUE = false;
            _this.AOSTOREINMETALMAPRED = false;
            _this.ENVIRONMENTBRDF = false;
            _this.NORMAL = false;
            _this.TANGENT = false;
            _this.BUMP = false;
            _this.BUMPDIRECTUV = 0;
            _this.PARALLAX = false;
            _this.PARALLAXOCCLUSION = false;
            _this.NORMALXYSCALE = true;
            _this.LIGHTMAP = false;
            _this.LIGHTMAPDIRECTUV = 0;
            _this.USELIGHTMAPASSHADOWMAP = false;
            _this.REFLECTION = false;
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
            _this.USESPHERICALFROMREFLECTIONMAP = false;
            _this.USESPHERICALINVERTEX = false;
            _this.REFLECTIONMAP_OPPOSITEZ = false;
            _this.LODINREFLECTIONALPHA = false;
            _this.GAMMAREFLECTION = false;
            _this.RADIANCEOCCLUSION = false;
            _this.HORIZONOCCLUSION = false;
            _this.REFRACTION = false;
            _this.REFRACTIONMAP_3D = false;
            _this.REFRACTIONMAP_OPPOSITEZ = false;
            _this.LODINREFRACTIONALPHA = false;
            _this.GAMMAREFRACTION = false;
            _this.LINKREFRACTIONTOTRANSPARENCY = false;
            _this.INSTANCES = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.NONUNIFORMSCALING = false;
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
            _this.USEPHYSICALLIGHTFALLOFF = false;
            _this.TWOSIDEDLIGHTING = false;
            _this.SHADOWFLOAT = false;
            _this.CLIPPLANE = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.LOGARITHMICDEPTH = false;
            _this.FORCENORMALFORWARD = false;
            _this.rebuild();
            return _this;
        }
        PBRMaterialDefines.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this.ALPHATESTVALUE = 0.5;
            this.PBR = true;
        };
        return PBRMaterialDefines;
    }(BABYLON.MaterialDefines));
    /**
     * The Physically based material base class of BJS.
     *
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation :
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    var PBRBaseMaterial = /** @class */ (function (_super) {
        __extends(PBRBaseMaterial, _super);
        /**
         * Instantiates a new PBRMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        function PBRBaseMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            /**
             * Intensity of the direct lights e.g. the four lights available in your scene.
             * This impacts both the direct diffuse and specular highlights.
             */
            _this._directIntensity = 1.0;
            /**
             * Intensity of the emissive part of the material.
             * This helps controlling the emissive effect without modifying the emissive color.
             */
            _this._emissiveIntensity = 1.0;
            /**
             * Intensity of the environment e.g. how much the environment will light the object
             * either through harmonics for rough material or through the refelction for shiny ones.
             */
            _this._environmentIntensity = 1.0;
            /**
             * This is a special control allowing the reduction of the specular highlights coming from the
             * four lights of the scene. Those highlights may not be needed in full environment lighting.
             */
            _this._specularIntensity = 1.0;
            _this._lightingInfos = new BABYLON.Vector4(_this._directIntensity, _this._emissiveIntensity, _this._environmentIntensity, _this._specularIntensity);
            /**
             * Debug Control allowing disabling the bump map on this material.
             */
            _this._disableBumpMap = false;
            /**
             * AKA Occlusion Texture Intensity in other nomenclature.
             */
            _this._ambientTextureStrength = 1.0;
            _this._ambientColor = new BABYLON.Color3(0, 0, 0);
            /**
             * AKA Diffuse Color in other nomenclature.
             */
            _this._albedoColor = new BABYLON.Color3(1, 1, 1);
            /**
             * AKA Specular Color in other nomenclature.
             */
            _this._reflectivityColor = new BABYLON.Color3(1, 1, 1);
            _this._reflectionColor = new BABYLON.Color3(1, 1, 1);
            _this._emissiveColor = new BABYLON.Color3(0, 0, 0);
            /**
             * AKA Glossiness in other nomenclature.
             */
            _this._microSurface = 0.9;
            /**
             * source material index of refraction (IOR)' / 'destination material IOR.
             */
            _this._indexOfRefraction = 0.66;
            /**
             * Controls if refraction needs to be inverted on Y. This could be usefull for procedural texture.
             */
            _this._invertRefractionY = false;
            /**
             * This parameters will make the material used its opacity to control how much it is refracting aginst not.
             * Materials half opaque for instance using refraction could benefit from this control.
             */
            _this._linkRefractionWithTransparency = false;
            _this._useLightmapAsShadowmap = false;
            /**
             * This parameters will enable/disable Horizon occlusion to prevent normal maps to look shiny when the normal
             * makes the reflect vector face the model (under horizon).
             */
            _this._useHorizonOcclusion = true;
            /**
             * This parameters will enable/disable radiance occlusion by preventing the radiance to lit
             * too much the area relying on ambient texture to define their ambient occlusion.
             */
            _this._useRadianceOcclusion = true;
            /**
             * Specifies that the alpha is coming form the albedo channel alpha channel for alpha blending.
             */
            _this._useAlphaFromAlbedoTexture = false;
            /**
             * Specifies that the material will keeps the specular highlights over a transparent surface (only the most limunous ones).
             * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
             */
            _this._useSpecularOverAlpha = true;
            /**
             * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
             */
            _this._useMicroSurfaceFromReflectivityMapAlpha = false;
            /**
             * Specifies if the metallic texture contains the roughness information in its alpha channel.
             */
            _this._useRoughnessFromMetallicTextureAlpha = true;
            /**
             * Specifies if the metallic texture contains the roughness information in its green channel.
             */
            _this._useRoughnessFromMetallicTextureGreen = false;
            /**
             * Specifies if the metallic texture contains the metallness information in its blue channel.
             */
            _this._useMetallnessFromMetallicTextureBlue = false;
            /**
             * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
             */
            _this._useAmbientOcclusionFromMetallicTextureRed = false;
            /**
             * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
             */
            _this._useAmbientInGrayScale = false;
            /**
             * In case the reflectivity map does not contain the microsurface information in its alpha channel,
             * The material will try to infer what glossiness each pixel should be.
             */
            _this._useAutoMicroSurfaceFromReflectivityMap = false;
            /**
             * BJS is using an harcoded light falloff based on a manually sets up range.
             * In PBR, one way to represents the fallof is to use the inverse squared root algorythm.
             * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
             */
            _this._usePhysicalLightFalloff = true;
            /**
             * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most limunous ones).
             * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
             */
            _this._useRadianceOverAlpha = true;
            /**
             * Allows using the bump map in parallax mode.
             */
            _this._useParallax = false;
            /**
             * Allows using the bump map in parallax occlusion mode.
             */
            _this._useParallaxOcclusion = false;
            /**
             * Controls the scale bias of the parallax mode.
             */
            _this._parallaxScaleBias = 0.05;
            /**
             * If sets to true, disables all the lights affecting the material.
             */
            _this._disableLighting = false;
            /**
             * Number of Simultaneous lights allowed on the material.
             */
            _this._maxSimultaneousLights = 4;
            /**
             * If sets to true, x component of normal map value will be inverted (x = 1.0 - x).
             */
            _this._invertNormalMapX = false;
            /**
             * If sets to true, y component of normal map value will be inverted (y = 1.0 - y).
             */
            _this._invertNormalMapY = false;
            /**
             * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
             */
            _this._twoSidedLighting = false;
            /**
             * Defines the alpha limits in alpha test mode.
             */
            _this._alphaCutOff = 0.4;
            /**
             * Enforces alpha test in opaque or blend mode in order to improve the performances of some situations.
             */
            _this._forceAlphaTest = false;
            /**
             * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
             * And/Or occlude the blended part. (alpha is converted to gamma to compute the fresnel)
             */
            _this._useAlphaFresnel = false;
            /**
             * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
             * And/Or occlude the blended part. (alpha stays linear to compute the fresnel)
             */
            _this._useLinearAlphaFresnel = false;
            /**
             * The transparency mode of the material.
             */
            _this._transparencyMode = null;
            /**
             * Specifies the environment BRDF texture used to comput the scale and offset roughness values
             * from cos thetav and roughness:
             * http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
             */
            _this._environmentBRDFTexture = null;
            /**
             * Force the shader to compute irradiance in the fragment shader in order to take bump in account.
             */
            _this._forceIrradianceInFragment = false;
            /**
             * Force normal to face away from face.
             */
            _this._forceNormalForward = false;
            _this._renderTargets = new BABYLON.SmartArray(16);
            _this._globalAmbientColor = new BABYLON.Color3(0, 0, 0);
            // Setup the default processing configuration to the scene.
            _this._attachImageProcessingConfiguration(null);
            _this.getRenderTargetTextures = function () {
                _this._renderTargets.reset();
                if (BABYLON.StandardMaterial.ReflectionTextureEnabled && _this._reflectionTexture && _this._reflectionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this._reflectionTexture);
                }
                if (BABYLON.StandardMaterial.RefractionTextureEnabled && _this._refractionTexture && _this._refractionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this._refractionTexture);
                }
                return _this._renderTargets;
            };
            _this._environmentBRDFTexture = BABYLON.TextureTools.GetEnvironmentBRDFTexture(scene);
            return _this;
        }
        /**
         * Attaches a new image processing configuration to the PBR Material.
         * @param configuration
         */
        PBRBaseMaterial.prototype._attachImageProcessingConfiguration = function (configuration) {
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
        PBRBaseMaterial.prototype.getClassName = function () {
            return "PBRBaseMaterial";
        };
        Object.defineProperty(PBRBaseMaterial.prototype, "useLogarithmicDepth", {
            get: function () {
                return this._useLogarithmicDepth;
            },
            set: function (value) {
                this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PBRBaseMaterial.prototype, "transparencyMode", {
            /**
             * Gets the current transparency mode.
             */
            get: function () {
                return this._transparencyMode;
            },
            /**
             * Sets the transparency mode of the material.
             */
            set: function (value) {
                if (this._transparencyMode === value) {
                    return;
                }
                this._transparencyMode = value;
                this._forceAlphaTest = (value === BABYLON.PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND);
                this._markAllSubMeshesAsTexturesDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PBRBaseMaterial.prototype, "_disableAlphaBlending", {
            /**
             * Returns true if alpha blending should be disabled.
             */
            get: function () {
                return (this._linkRefractionWithTransparency ||
                    this._transparencyMode === BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE ||
                    this._transparencyMode === BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Specifies whether or not this material should be rendered in alpha blend mode.
         */
        PBRBaseMaterial.prototype.needAlphaBlending = function () {
            if (this._disableAlphaBlending) {
                return false;
            }
            return (this.alpha < 1.0) || (this._opacityTexture != null) || this._shouldUseAlphaFromAlbedoTexture();
        };
        /**
         * Specifies whether or not this material should be rendered in alpha blend mode for the given mesh.
         */
        PBRBaseMaterial.prototype.needAlphaBlendingForMesh = function (mesh) {
            if (this._disableAlphaBlending) {
                return false;
            }
            return _super.prototype.needAlphaBlendingForMesh.call(this, mesh);
        };
        /**
         * Specifies whether or not this material should be rendered in alpha test mode.
         */
        PBRBaseMaterial.prototype.needAlphaTesting = function () {
            if (this._forceAlphaTest) {
                return true;
            }
            if (this._linkRefractionWithTransparency) {
                return false;
            }
            return this._albedoTexture != null && this._albedoTexture.hasAlpha && (this._transparencyMode == null || this._transparencyMode === BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST);
        };
        /**
         * Specifies whether or not the alpha value of the albedo texture should be used for alpha blending.
         */
        PBRBaseMaterial.prototype._shouldUseAlphaFromAlbedoTexture = function () {
            return this._albedoTexture != null && this._albedoTexture.hasAlpha && this._useAlphaFromAlbedoTexture && this._transparencyMode !== BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE;
        };
        PBRBaseMaterial.prototype.getAlphaTestTexture = function () {
            return this._albedoTexture;
        };
        PBRBaseMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            var _this = this;
            if (subMesh.effect && this.isFrozen) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new PBRMaterialDefines();
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
            BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
            defines._needNormals = true;
            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (scene.getEngine().getCaps().textureLOD) {
                        defines.LODBASEDMICROSFURACE = true;
                    }
                    if (this._albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        if (!this._albedoTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        BABYLON.MaterialHelper.PrepareDefinesForMergedUV(this._albedoTexture, defines, "ALBEDO");
                    }
                    else {
                        defines.ALBEDO = false;
                    }
                    if (this._ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                        if (!this._ambientTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        BABYLON.MaterialHelper.PrepareDefinesForMergedUV(this._ambientTexture, defines, "AMBIENT");
                        defines.AMBIENTINGRAYSCALE = this._useAmbientInGrayScale;
                    }
                    else {
                        defines.AMBIENT = false;
                    }
                    if (this._opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                        if (!this._opacityTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        BABYLON.MaterialHelper.PrepareDefinesForMergedUV(this._opacityTexture, defines, "OPACITY");
                        defines.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
                    }
                    else {
                        defines.OPACITY = false;
                    }
                    var reflectionTexture = this._getReflectionTexture();
                    if (reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                        if (!reflectionTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        defines.REFLECTION = true;
                        defines.GAMMAREFLECTION = reflectionTexture.gammaSpace;
                        defines.REFLECTIONMAP_OPPOSITEZ = this.getScene().useRightHandedSystem ? !reflectionTexture.invertZ : reflectionTexture.invertZ;
                        defines.LODINREFLECTIONALPHA = reflectionTexture.lodLevelInAlpha;
                        if (reflectionTexture.coordinatesMode === BABYLON.Texture.INVCUBIC_MODE) {
                            defines.INVERTCUBICMAP = true;
                        }
                        defines.REFLECTIONMAP_3D = reflectionTexture.isCube;
                        switch (reflectionTexture.coordinatesMode) {
                            case BABYLON.Texture.CUBIC_MODE:
                            case BABYLON.Texture.INVCUBIC_MODE:
                                defines.REFLECTIONMAP_CUBIC = true;
                                break;
                            case BABYLON.Texture.EXPLICIT_MODE:
                                defines.REFLECTIONMAP_EXPLICIT = true;
                                break;
                            case BABYLON.Texture.PLANAR_MODE:
                                defines.REFLECTIONMAP_PLANAR = true;
                                break;
                            case BABYLON.Texture.PROJECTION_MODE:
                                defines.REFLECTIONMAP_PROJECTION = true;
                                break;
                            case BABYLON.Texture.SKYBOX_MODE:
                                defines.REFLECTIONMAP_SKYBOX = true;
                                break;
                            case BABYLON.Texture.SPHERICAL_MODE:
                                defines.REFLECTIONMAP_SPHERICAL = true;
                                break;
                            case BABYLON.Texture.EQUIRECTANGULAR_MODE:
                                defines.REFLECTIONMAP_EQUIRECTANGULAR = true;
                                break;
                            case BABYLON.Texture.FIXED_EQUIRECTANGULAR_MODE:
                                defines.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = true;
                                break;
                            case BABYLON.Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                                defines.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = true;
                                break;
                        }
                        if (reflectionTexture.coordinatesMode !== BABYLON.Texture.SKYBOX_MODE) {
                            if (reflectionTexture.sphericalPolynomial) {
                                defines.USESPHERICALFROMREFLECTIONMAP = true;
                                if (this._forceIrradianceInFragment || scene.getEngine().getCaps().maxVaryingVectors <= 8) {
                                    defines.USESPHERICALINVERTEX = false;
                                }
                                else {
                                    defines.USESPHERICALINVERTEX = true;
                                }
                            }
                        }
                    }
                    else {
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
                        defines.USESPHERICALINVERTEX = false;
                        defines.REFLECTIONMAP_OPPOSITEZ = false;
                        defines.LODINREFLECTIONALPHA = false;
                        defines.GAMMAREFLECTION = false;
                    }
                    if (this._lightmapTexture && BABYLON.StandardMaterial.LightmapTextureEnabled) {
                        if (!this._lightmapTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        BABYLON.MaterialHelper.PrepareDefinesForMergedUV(this._lightmapTexture, defines, "LIGHTMAP");
                        defines.USELIGHTMAPASSHADOWMAP = this._useLightmapAsShadowmap;
                    }
                    else {
                        defines.LIGHTMAP = false;
                    }
                    if (this._emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                        if (!this._emissiveTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        BABYLON.MaterialHelper.PrepareDefinesForMergedUV(this._emissiveTexture, defines, "EMISSIVE");
                    }
                    else {
                        defines.EMISSIVE = false;
                    }
                    if (BABYLON.StandardMaterial.SpecularTextureEnabled) {
                        if (this._metallicTexture) {
                            if (!this._metallicTexture.isReadyOrNotBlocking()) {
                                return false;
                            }
                            BABYLON.MaterialHelper.PrepareDefinesForMergedUV(this._metallicTexture, defines, "REFLECTIVITY");
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
                            BABYLON.MaterialHelper.PrepareDefinesForMergedUV(this._reflectivityTexture, defines, "REFLECTIVITY");
                            defines.MICROSURFACEFROMREFLECTIVITYMAP = this._useMicroSurfaceFromReflectivityMapAlpha;
                            defines.MICROSURFACEAUTOMATIC = this._useAutoMicroSurfaceFromReflectivityMap;
                        }
                        else {
                            defines.METALLICWORKFLOW = false;
                            defines.REFLECTIVITY = false;
                        }
                        if (this._microSurfaceTexture) {
                            if (!this._microSurfaceTexture.isReadyOrNotBlocking()) {
                                return false;
                            }
                            BABYLON.MaterialHelper.PrepareDefinesForMergedUV(this._microSurfaceTexture, defines, "MICROSURFACEMAP");
                        }
                        else {
                            defines.MICROSURFACEMAP = false;
                        }
                    }
                    else {
                        defines.REFLECTIVITY = false;
                        defines.MICROSURFACEMAP = false;
                    }
                    if (scene.getEngine().getCaps().standardDerivatives && this._bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled && !this._disableBumpMap) {
                        // Bump texure can not be none blocking.
                        if (!this._bumpTexture.isReady()) {
                            return false;
                        }
                        BABYLON.MaterialHelper.PrepareDefinesForMergedUV(this._bumpTexture, defines, "BUMP");
                        if (this._useParallax && this._albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                            defines.PARALLAX = true;
                            defines.PARALLAXOCCLUSION = !!this._useParallaxOcclusion;
                        }
                        else {
                            defines.PARALLAX = false;
                        }
                    }
                    else {
                        defines.BUMP = false;
                    }
                    var refractionTexture = this._getRefractionTexture();
                    if (refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                        if (!refractionTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        defines.REFRACTION = true;
                        defines.REFRACTIONMAP_3D = refractionTexture.isCube;
                        defines.GAMMAREFRACTION = refractionTexture.gammaSpace;
                        defines.REFRACTIONMAP_OPPOSITEZ = refractionTexture.invertZ;
                        defines.LODINREFRACTIONALPHA = refractionTexture.lodLevelInAlpha;
                        if (this._linkRefractionWithTransparency) {
                            defines.LINKREFRACTIONTOTRANSPARENCY = true;
                        }
                    }
                    else {
                        defines.REFRACTION = false;
                    }
                    if (this._environmentBRDFTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                        // This is blocking.
                        if (!this._environmentBRDFTexture.isReady()) {
                            return false;
                        }
                        defines.ENVIRONMENTBRDF = true;
                    }
                    else {
                        defines.ENVIRONMENTBRDF = false;
                    }
                    if (this._shouldUseAlphaFromAlbedoTexture()) {
                        defines.ALPHAFROMALBEDO = true;
                    }
                    else {
                        defines.ALPHAFROMALBEDO = false;
                    }
                }
                defines.SPECULAROVERALPHA = this._useSpecularOverAlpha;
                defines.USEPHYSICALLIGHTFALLOFF = this._usePhysicalLightFalloff;
                defines.RADIANCEOVERALPHA = this._useRadianceOverAlpha;
                if ((this._metallic !== undefined && this._metallic !== null) || (this._roughness !== undefined && this._roughness !== null)) {
                    defines.METALLICWORKFLOW = true;
                }
                else {
                    defines.METALLICWORKFLOW = false;
                }
                if (!this.backFaceCulling && this._twoSidedLighting) {
                    defines.TWOSIDEDLIGHTING = true;
                }
                else {
                    defines.TWOSIDEDLIGHTING = false;
                }
                defines.ALPHATESTVALUE = this._alphaCutOff;
                defines.PREMULTIPLYALPHA = (this.alphaMode === BABYLON.Engine.ALPHA_PREMULTIPLIED || this.alphaMode === BABYLON.Engine.ALPHA_PREMULTIPLIED_PORTERDUFF);
                defines.ALPHABLEND = this.needAlphaBlendingForMesh(mesh);
                defines.ALPHAFRESNEL = this._useAlphaFresnel || this._useLinearAlphaFresnel;
                defines.LINEARALPHAFRESNEL = this._useLinearAlphaFresnel;
            }
            if (defines._areImageProcessingDirty) {
                if (!this._imageProcessingConfiguration.isReady()) {
                    return false;
                }
                this._imageProcessingConfiguration.prepareDefines(defines);
            }
            defines.FORCENORMALFORWARD = this._forceNormalForward;
            defines.RADIANCEOCCLUSION = this._useRadianceOcclusion;
            defines.HORIZONOCCLUSION = this._useHorizonOcclusion;
            // Misc.
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, defines);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false, this._forceAlphaTest);
            // Attribs
            if (BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true, true, this._transparencyMode !== BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE) && mesh) {
                var bufferMesh = null;
                if (mesh instanceof BABYLON.InstancedMesh) {
                    bufferMesh = mesh.sourceMesh;
                }
                else if (mesh instanceof BABYLON.Mesh) {
                    bufferMesh = mesh;
                }
                if (bufferMesh) {
                    if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                        // If the first normal's components is the zero vector in one of the submeshes, we have invalid normals
                        var normalVertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.NormalKind);
                        var normals = normalVertexBuffer.getData();
                        var vertexBufferOffset = normalVertexBuffer.getOffset();
                        var strideSize = normalVertexBuffer.getStrideSize();
                        var offset = vertexBufferOffset + subMesh.indexStart * strideSize;
                        if (normals[offset] === 0 && normals[offset + 1] === 0 && normals[offset + 2] === 0) {
                            defines.NORMAL = false;
                        }
                        if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.TangentKind)) {
                            // If the first tangent's components is the zero vector in one of the submeshes, we have invalid tangents
                            var tangentVertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.TangentKind);
                            var tangents = tangentVertexBuffer.getData();
                            var vertexBufferOffset_1 = tangentVertexBuffer.getOffset();
                            var strideSize_1 = tangentVertexBuffer.getStrideSize();
                            var offset_1 = vertexBufferOffset_1 + subMesh.indexStart * strideSize_1;
                            if (tangents[offset_1] === 0 && tangents[offset_1 + 1] === 0 && tangents[offset_1 + 2] === 0) {
                                defines.TANGENT = false;
                            }
                        }
                    }
                    else {
                        if (!scene.getEngine().getCaps().standardDerivatives) {
                            bufferMesh.createNormals(true);
                            BABYLON.Tools.Warn("PBRMaterial: Normals have been created for the mesh: " + bufferMesh.name);
                        }
                    }
                }
            }
            // Get correct effect
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                var fallbackRank = 0;
                if (defines.USESPHERICALINVERTEX) {
                    fallbacks.addFallback(fallbackRank++, "USESPHERICALINVERTEX");
                }
                if (defines.FOG) {
                    fallbacks.addFallback(fallbackRank, "FOG");
                }
                if (defines.POINTSIZE) {
                    fallbacks.addFallback(fallbackRank, "POINTSIZE");
                }
                if (defines.LOGARITHMICDEPTH) {
                    fallbacks.addFallback(fallbackRank, "LOGARITHMICDEPTH");
                }
                if (defines.PARALLAX) {
                    fallbacks.addFallback(fallbackRank, "PARALLAX");
                }
                if (defines.PARALLAXOCCLUSION) {
                    fallbacks.addFallback(fallbackRank++, "PARALLAXOCCLUSION");
                }
                if (defines.ENVIRONMENTBRDF) {
                    fallbacks.addFallback(fallbackRank++, "ENVIRONMENTBRDF");
                }
                if (defines.TANGENT) {
                    fallbacks.addFallback(fallbackRank++, "TANGENT");
                }
                if (defines.BUMP) {
                    fallbacks.addFallback(fallbackRank++, "BUMP");
                }
                fallbackRank = BABYLON.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this._maxSimultaneousLights, fallbackRank++);
                if (defines.SPECULARTERM) {
                    fallbacks.addFallback(fallbackRank++, "SPECULARTERM");
                }
                if (defines.USESPHERICALFROMREFLECTIONMAP) {
                    fallbacks.addFallback(fallbackRank++, "USESPHERICALFROMREFLECTIONMAP");
                }
                if (defines.LIGHTMAP) {
                    fallbacks.addFallback(fallbackRank++, "LIGHTMAP");
                }
                if (defines.NORMAL) {
                    fallbacks.addFallback(fallbackRank++, "NORMAL");
                }
                if (defines.AMBIENT) {
                    fallbacks.addFallback(fallbackRank++, "AMBIENT");
                }
                if (defines.EMISSIVE) {
                    fallbacks.addFallback(fallbackRank++, "EMISSIVE");
                }
                if (defines.VERTEXCOLOR) {
                    fallbacks.addFallback(fallbackRank++, "VERTEXCOLOR");
                }
                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(fallbackRank++, mesh);
                }
                if (defines.MORPHTARGETS) {
                    fallbacks.addFallback(fallbackRank++, "MORPHTARGETS");
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (defines.TANGENT) {
                    attribs.push(BABYLON.VertexBuffer.TangentKind);
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
                subMesh.setEffect(scene.getEngine().createEffect("pbr", {
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
            if (!subMesh.effect || !subMesh.effect.isReady()) {
                return false;
            }
            defines._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        PBRBaseMaterial.prototype.buildUniformLayout = function () {
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
        };
        PBRBaseMaterial.prototype.unbind = function () {
            if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("reflectionSampler", null);
            }
            if (this._refractionTexture && this._refractionTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("refractionSampler", null);
            }
            _super.prototype.unbind.call(this);
        };
        PBRBaseMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._activeEffect.setMatrix("world", world);
        };
        PBRBaseMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
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
            var mustRebind = this._mustRebind(scene, effect, mesh.visibility);
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            var reflectionTexture = null;
            if (mustRebind) {
                this._uniformBuffer.bindToEffect(effect, "Material");
                this.bindViewProjection(effect);
                reflectionTexture = this._getReflectionTexture();
                var refractionTexture = this._getRefractionTexture();
                if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync) {
                    // Texture uniforms
                    if (scene.texturesEnabled) {
                        if (this._albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vAlbedoInfos", this._albedoTexture.coordinatesIndex, this._albedoTexture.level);
                            BABYLON.MaterialHelper.BindTextureMatrix(this._albedoTexture, this._uniformBuffer, "albedo");
                        }
                        if (this._ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                            this._uniformBuffer.updateFloat3("vAmbientInfos", this._ambientTexture.coordinatesIndex, this._ambientTexture.level, this._ambientTextureStrength);
                            BABYLON.MaterialHelper.BindTextureMatrix(this._ambientTexture, this._uniformBuffer, "ambient");
                        }
                        if (this._opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                            BABYLON.MaterialHelper.BindTextureMatrix(this._opacityTexture, this._uniformBuffer, "opacity");
                        }
                        if (reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                            this._uniformBuffer.updateMatrix("reflectionMatrix", reflectionTexture.getReflectionTextureMatrix());
                            this._uniformBuffer.updateFloat2("vReflectionInfos", reflectionTexture.level, 0);
                            var polynomials = reflectionTexture.sphericalPolynomial;
                            if (defines.USESPHERICALFROMREFLECTIONMAP && polynomials) {
                                this._activeEffect.setFloat3("vSphericalX", polynomials.x.x, polynomials.x.y, polynomials.x.z);
                                this._activeEffect.setFloat3("vSphericalY", polynomials.y.x, polynomials.y.y, polynomials.y.z);
                                this._activeEffect.setFloat3("vSphericalZ", polynomials.z.x, polynomials.z.y, polynomials.z.z);
                                this._activeEffect.setFloat3("vSphericalXX_ZZ", polynomials.xx.x - polynomials.zz.x, polynomials.xx.y - polynomials.zz.y, polynomials.xx.z - polynomials.zz.z);
                                this._activeEffect.setFloat3("vSphericalYY_ZZ", polynomials.yy.x - polynomials.zz.x, polynomials.yy.y - polynomials.zz.y, polynomials.yy.z - polynomials.zz.z);
                                this._activeEffect.setFloat3("vSphericalZZ", polynomials.zz.x, polynomials.zz.y, polynomials.zz.z);
                                this._activeEffect.setFloat3("vSphericalXY", polynomials.xy.x, polynomials.xy.y, polynomials.xy.z);
                                this._activeEffect.setFloat3("vSphericalYZ", polynomials.yz.x, polynomials.yz.y, polynomials.yz.z);
                                this._activeEffect.setFloat3("vSphericalZX", polynomials.zx.x, polynomials.zx.y, polynomials.zx.z);
                            }
                            this._uniformBuffer.updateFloat3("vReflectionMicrosurfaceInfos", reflectionTexture.getSize().width, reflectionTexture.lodGenerationScale, reflectionTexture.lodGenerationOffset);
                        }
                        if (this._emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vEmissiveInfos", this._emissiveTexture.coordinatesIndex, this._emissiveTexture.level);
                            BABYLON.MaterialHelper.BindTextureMatrix(this._emissiveTexture, this._uniformBuffer, "emissive");
                        }
                        if (this._lightmapTexture && BABYLON.StandardMaterial.LightmapTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vLightmapInfos", this._lightmapTexture.coordinatesIndex, this._lightmapTexture.level);
                            BABYLON.MaterialHelper.BindTextureMatrix(this._lightmapTexture, this._uniformBuffer, "lightmap");
                        }
                        if (BABYLON.StandardMaterial.SpecularTextureEnabled) {
                            if (this._metallicTexture) {
                                this._uniformBuffer.updateFloat3("vReflectivityInfos", this._metallicTexture.coordinatesIndex, this._metallicTexture.level, this._ambientTextureStrength);
                                BABYLON.MaterialHelper.BindTextureMatrix(this._metallicTexture, this._uniformBuffer, "reflectivity");
                            }
                            else if (this._reflectivityTexture) {
                                this._uniformBuffer.updateFloat3("vReflectivityInfos", this._reflectivityTexture.coordinatesIndex, this._reflectivityTexture.level, 1.0);
                                BABYLON.MaterialHelper.BindTextureMatrix(this._reflectivityTexture, this._uniformBuffer, "reflectivity");
                            }
                            if (this._microSurfaceTexture) {
                                this._uniformBuffer.updateFloat2("vMicroSurfaceSamplerInfos", this._microSurfaceTexture.coordinatesIndex, this._microSurfaceTexture.level);
                                BABYLON.MaterialHelper.BindTextureMatrix(this._microSurfaceTexture, this._uniformBuffer, "microSurfaceSampler");
                            }
                        }
                        if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && BABYLON.StandardMaterial.BumpTextureEnabled && !this._disableBumpMap) {
                            this._uniformBuffer.updateFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, this._bumpTexture.level, this._parallaxScaleBias);
                            BABYLON.MaterialHelper.BindTextureMatrix(this._bumpTexture, this._uniformBuffer, "bump");
                            if (scene._mirroredCameraPosition) {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? 1.0 : -1.0, this._invertNormalMapY ? 1.0 : -1.0);
                            }
                            else {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? -1.0 : 1.0, this._invertNormalMapY ? -1.0 : 1.0);
                            }
                        }
                        if (refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                            this._uniformBuffer.updateMatrix("refractionMatrix", refractionTexture.getReflectionTextureMatrix());
                            var depth = 1.0;
                            if (!refractionTexture.isCube) {
                                if (refractionTexture.depth) {
                                    depth = refractionTexture.depth;
                                }
                            }
                            this._uniformBuffer.updateFloat4("vRefractionInfos", refractionTexture.level, this._indexOfRefraction, depth, this._invertRefractionY ? -1 : 1);
                            this._uniformBuffer.updateFloat3("vRefractionMicrosurfaceInfos", refractionTexture.getSize().width, refractionTexture.lodGenerationScale, refractionTexture.lodGenerationOffset);
                        }
                    }
                    // Point size
                    if (this.pointsCloud) {
                        this._uniformBuffer.updateFloat("pointSize", this.pointSize);
                    }
                    // Colors
                    if (defines.METALLICWORKFLOW) {
                        BABYLON.PBRMaterial._scaledReflectivity.r = (this._metallic === undefined || this._metallic === null) ? 1 : this._metallic;
                        BABYLON.PBRMaterial._scaledReflectivity.g = (this._roughness === undefined || this._roughness === null) ? 1 : this._roughness;
                        this._uniformBuffer.updateColor4("vReflectivityColor", BABYLON.PBRMaterial._scaledReflectivity, 0);
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
                    if (this._albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        this._uniformBuffer.setTexture("albedoSampler", this._albedoTexture);
                    }
                    if (this._ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                        this._uniformBuffer.setTexture("ambientSampler", this._ambientTexture);
                    }
                    if (this._opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                        this._uniformBuffer.setTexture("opacitySampler", this._opacityTexture);
                    }
                    if (reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
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
                    if (refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                        if (defines.LODBASEDMICROSFURACE) {
                            this._uniformBuffer.setTexture("refractionSampler", refractionTexture);
                        }
                        else {
                            this._uniformBuffer.setTexture("refractionSampler", refractionTexture._lodTextureMid || refractionTexture);
                            this._uniformBuffer.setTexture("refractionSamplerLow", refractionTexture._lodTextureLow || refractionTexture);
                            this._uniformBuffer.setTexture("refractionSamplerHigh", refractionTexture._lodTextureHigh || refractionTexture);
                        }
                    }
                    if (this._emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                        this._uniformBuffer.setTexture("emissiveSampler", this._emissiveTexture);
                    }
                    if (this._lightmapTexture && BABYLON.StandardMaterial.LightmapTextureEnabled) {
                        this._uniformBuffer.setTexture("lightmapSampler", this._lightmapTexture);
                    }
                    if (BABYLON.StandardMaterial.SpecularTextureEnabled) {
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
                    if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && BABYLON.StandardMaterial.BumpTextureEnabled && !this._disableBumpMap) {
                        this._uniformBuffer.setTexture("bumpSampler", this._bumpTexture);
                    }
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Colors
                scene.ambientColor.multiplyToRef(this._ambientColor, this._globalAmbientColor);
                var eyePosition = scene._forcedViewPosition ? scene._forcedViewPosition : (scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.globalPosition);
                var invertNormal = (scene.useRightHandedSystem === (scene._mirroredCameraPosition != null));
                effect.setFloat4("vEyePosition", eyePosition.x, eyePosition.y, eyePosition.z, invertNormal ? -1 : 1);
                effect.setColor3("vAmbientColor", this._globalAmbientColor);
            }
            if (mustRebind || !this.isFrozen) {
                // Lights
                if (scene.lightsEnabled && !this._disableLighting) {
                    BABYLON.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this._maxSimultaneousLights, this._usePhysicalLightFalloff);
                }
                // View
                if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE || reflectionTexture) {
                    this.bindView(effect);
                }
                // Fog
                BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
                // Morph targets
                if (defines.NUM_MORPH_INFLUENCERS) {
                    BABYLON.MaterialHelper.BindMorphTargetParameters(mesh, this._activeEffect);
                }
                // image processing
                this._imageProcessingConfiguration.bind(this._activeEffect);
                // Log. depth
                BABYLON.MaterialHelper.BindLogDepth(defines, this._activeEffect, scene);
            }
            this._uniformBuffer.update();
            this._afterBind(mesh);
        };
        PBRBaseMaterial.prototype.getAnimatables = function () {
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
        };
        PBRBaseMaterial.prototype._getReflectionTexture = function () {
            if (this._reflectionTexture) {
                return this._reflectionTexture;
            }
            return this.getScene().environmentTexture;
        };
        PBRBaseMaterial.prototype._getRefractionTexture = function () {
            if (this._refractionTexture) {
                return this._refractionTexture;
            }
            if (this._linkRefractionWithTransparency) {
                return this.getScene().environmentTexture;
            }
            return null;
        };
        PBRBaseMaterial.prototype.dispose = function (forceDisposeEffect, forceDisposeTextures) {
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
                if (this._environmentBRDFTexture && this.getScene()._environmentBRDFTexture !== this._environmentBRDFTexture) {
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
            _super.prototype.dispose.call(this, forceDisposeEffect, forceDisposeTextures);
        };
        PBRBaseMaterial._scaledReflectivity = new BABYLON.Color3();
        __decorate([
            BABYLON.serializeAsImageProcessingConfiguration()
        ], PBRBaseMaterial.prototype, "_imageProcessingConfiguration", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRBaseMaterial.prototype, "useLogarithmicDepth", null);
        __decorate([
            BABYLON.serialize()
        ], PBRBaseMaterial.prototype, "transparencyMode", null);
        return PBRBaseMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.PBRBaseMaterial = PBRBaseMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.pbrBaseMaterial.js.map



var BABYLON;
(function (BABYLON) {
    /**
     * The Physically based simple base material of BJS.
     *
     * This enables better naming and convention enforcements on top of the pbrMaterial.
     * It is used as the base class for both the specGloss and metalRough conventions.
     */
    var PBRBaseSimpleMaterial = /** @class */ (function (_super) {
        __extends(PBRBaseSimpleMaterial, _super);
        /**
         * Instantiates a new PBRMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        function PBRBaseSimpleMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            /**
             * Number of Simultaneous lights allowed on the material.
             */
            _this.maxSimultaneousLights = 4;
            /**
             * If sets to true, disables all the lights affecting the material.
             */
            _this.disableLighting = false;
            /**
             * If sets to true, x component of normal map value will invert (x = 1.0 - x).
             */
            _this.invertNormalMapX = false;
            /**
             * If sets to true, y component of normal map value will invert (y = 1.0 - y).
             */
            _this.invertNormalMapY = false;
            /**
             * Emissivie color used to self-illuminate the model.
             */
            _this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            /**
             * Occlusion Channel Strenght.
             */
            _this.occlusionStrength = 1.0;
            _this.useLightmapAsShadowmap = false;
            _this._useAlphaFromAlbedoTexture = true;
            _this._useAmbientInGrayScale = true;
            return _this;
        }
        Object.defineProperty(PBRBaseSimpleMaterial.prototype, "doubleSided", {
            /**
             * Gets the current double sided mode.
             */
            get: function () {
                return this._twoSidedLighting;
            },
            /**
             * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
             */
            set: function (value) {
                if (this._twoSidedLighting === value) {
                    return;
                }
                this._twoSidedLighting = value;
                this.backFaceCulling = !value;
                this._markAllSubMeshesAsTexturesDirty();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Return the active textures of the material.
         */
        PBRBaseSimpleMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this.environmentTexture) {
                activeTextures.push(this.environmentTexture);
            }
            if (this.normalTexture) {
                activeTextures.push(this.normalTexture);
            }
            if (this.emissiveTexture) {
                activeTextures.push(this.emissiveTexture);
            }
            if (this.occlusionTexture) {
                activeTextures.push(this.occlusionTexture);
            }
            if (this.lightmapTexture) {
                activeTextures.push(this.lightmapTexture);
            }
            return activeTextures;
        };
        PBRBaseSimpleMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this.lightmapTexture === texture) {
                return true;
            }
            return false;
        };
        PBRBaseSimpleMaterial.prototype.getClassName = function () {
            return "PBRBaseSimpleMaterial";
        };
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], PBRBaseSimpleMaterial.prototype, "maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], PBRBaseSimpleMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_reflectionTexture")
        ], PBRBaseSimpleMaterial.prototype, "environmentTexture", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRBaseSimpleMaterial.prototype, "invertNormalMapX", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRBaseSimpleMaterial.prototype, "invertNormalMapY", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_bumpTexture")
        ], PBRBaseSimpleMaterial.prototype, "normalTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3("emissive"),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRBaseSimpleMaterial.prototype, "emissiveColor", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRBaseSimpleMaterial.prototype, "emissiveTexture", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_ambientTextureStrength")
        ], PBRBaseSimpleMaterial.prototype, "occlusionStrength", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_ambientTexture")
        ], PBRBaseSimpleMaterial.prototype, "occlusionTexture", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_alphaCutOff")
        ], PBRBaseSimpleMaterial.prototype, "alphaCutOff", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRBaseSimpleMaterial.prototype, "doubleSided", null);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", null)
        ], PBRBaseSimpleMaterial.prototype, "lightmapTexture", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRBaseSimpleMaterial.prototype, "useLightmapAsShadowmap", void 0);
        return PBRBaseSimpleMaterial;
    }(BABYLON.PBRBaseMaterial));
    BABYLON.PBRBaseSimpleMaterial = PBRBaseSimpleMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.pbrBaseSimpleMaterial.js.map



var BABYLON;
(function (BABYLON) {
    /**
     * The Physically based material of BJS.
     *
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation :
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    var PBRMaterial = /** @class */ (function (_super) {
        __extends(PBRMaterial, _super);
        /**
         * Instantiates a new PBRMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        function PBRMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            /**
             * Intensity of the direct lights e.g. the four lights available in your scene.
             * This impacts both the direct diffuse and specular highlights.
             */
            _this.directIntensity = 1.0;
            /**
             * Intensity of the emissive part of the material.
             * This helps controlling the emissive effect without modifying the emissive color.
             */
            _this.emissiveIntensity = 1.0;
            /**
             * Intensity of the environment e.g. how much the environment will light the object
             * either through harmonics for rough material or through the refelction for shiny ones.
             */
            _this.environmentIntensity = 1.0;
            /**
             * This is a special control allowing the reduction of the specular highlights coming from the
             * four lights of the scene. Those highlights may not be needed in full environment lighting.
             */
            _this.specularIntensity = 1.0;
            /**
             * Debug Control allowing disabling the bump map on this material.
             */
            _this.disableBumpMap = false;
            /**
             * AKA Occlusion Texture Intensity in other nomenclature.
             */
            _this.ambientTextureStrength = 1.0;
            _this.ambientColor = new BABYLON.Color3(0, 0, 0);
            /**
             * AKA Diffuse Color in other nomenclature.
             */
            _this.albedoColor = new BABYLON.Color3(1, 1, 1);
            /**
             * AKA Specular Color in other nomenclature.
             */
            _this.reflectivityColor = new BABYLON.Color3(1, 1, 1);
            _this.reflectionColor = new BABYLON.Color3(1.0, 1.0, 1.0);
            _this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            /**
             * AKA Glossiness in other nomenclature.
             */
            _this.microSurface = 1.0;
            /**
             * source material index of refraction (IOR)' / 'destination material IOR.
             */
            _this.indexOfRefraction = 0.66;
            /**
             * Controls if refraction needs to be inverted on Y. This could be usefull for procedural texture.
             */
            _this.invertRefractionY = false;
            /**
             * This parameters will make the material used its opacity to control how much it is refracting aginst not.
             * Materials half opaque for instance using refraction could benefit from this control.
             */
            _this.linkRefractionWithTransparency = false;
            _this.useLightmapAsShadowmap = false;
            /**
             * Specifies that the alpha is coming form the albedo channel alpha channel for alpha blending.
             */
            _this.useAlphaFromAlbedoTexture = false;
            /**
             * Enforces alpha test in opaque or blend mode in order to improve the performances of some situations.
             */
            _this.forceAlphaTest = false;
            /**
             * Defines the alpha limits in alpha test mode.
             */
            _this.alphaCutOff = 0.4;
            /**
             * Specifies that the material will keeps the specular highlights over a transparent surface (only the most limunous ones).
             * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
             */
            _this.useSpecularOverAlpha = true;
            /**
             * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
             */
            _this.useMicroSurfaceFromReflectivityMapAlpha = false;
            /**
             * Specifies if the metallic texture contains the roughness information in its alpha channel.
             */
            _this.useRoughnessFromMetallicTextureAlpha = true;
            /**
             * Specifies if the metallic texture contains the roughness information in its green channel.
             */
            _this.useRoughnessFromMetallicTextureGreen = false;
            /**
             * Specifies if the metallic texture contains the metallness information in its blue channel.
             */
            _this.useMetallnessFromMetallicTextureBlue = false;
            /**
             * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
             */
            _this.useAmbientOcclusionFromMetallicTextureRed = false;
            /**
             * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
             */
            _this.useAmbientInGrayScale = false;
            /**
             * In case the reflectivity map does not contain the microsurface information in its alpha channel,
             * The material will try to infer what glossiness each pixel should be.
             */
            _this.useAutoMicroSurfaceFromReflectivityMap = false;
            /**
             * BJS is using an harcoded light falloff based on a manually sets up range.
             * In PBR, one way to represents the fallof is to use the inverse squared root algorythm.
             * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
             */
            _this.usePhysicalLightFalloff = true;
            /**
             * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most limunous ones).
             * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
             */
            _this.useRadianceOverAlpha = true;
            /**
             * Allows using the bump map in parallax mode.
             */
            _this.useParallax = false;
            /**
             * Allows using the bump map in parallax occlusion mode.
             */
            _this.useParallaxOcclusion = false;
            /**
             * Controls the scale bias of the parallax mode.
             */
            _this.parallaxScaleBias = 0.05;
            /**
             * If sets to true, disables all the lights affecting the material.
             */
            _this.disableLighting = false;
            /**
             * Force the shader to compute irradiance in the fragment shader in order to take bump in account.
             */
            _this.forceIrradianceInFragment = false;
            /**
             * Number of Simultaneous lights allowed on the material.
             */
            _this.maxSimultaneousLights = 4;
            /**
             * If sets to true, x component of normal map value will invert (x = 1.0 - x).
             */
            _this.invertNormalMapX = false;
            /**
             * If sets to true, y component of normal map value will invert (y = 1.0 - y).
             */
            _this.invertNormalMapY = false;
            /**
             * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
             */
            _this.twoSidedLighting = false;
            /**
             * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
             * And/Or occlude the blended part. (alpha is converted to gamma to compute the fresnel)
             */
            _this.useAlphaFresnel = false;
            /**
             * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
             * And/Or occlude the blended part. (alpha stays linear to compute the fresnel)
             */
            _this.useLinearAlphaFresnel = false;
            /**
             * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
             * And/Or occlude the blended part.
             */
            _this.environmentBRDFTexture = null;
            /**
             * Force normal to face away from face.
             */
            _this.forceNormalForward = false;
            /**
             * This parameters will enable/disable Horizon occlusion to prevent normal maps to look shiny when the normal
             * makes the reflect vector face the model (under horizon).
             */
            _this.useHorizonOcclusion = true;
            /**
             * This parameters will enable/disable radiance occlusion by preventing the radiance to lit
             * too much the area relying on ambient texture to define their ambient occlusion.
             */
            _this.useRadianceOcclusion = true;
            _this._environmentBRDFTexture = BABYLON.TextureTools.GetEnvironmentBRDFTexture(scene);
            return _this;
        }
        Object.defineProperty(PBRMaterial, "PBRMATERIAL_OPAQUE", {
            /**
             * PBRMaterialTransparencyMode: No transparency mode, Alpha channel is not use.
             */
            get: function () {
                return this._PBRMATERIAL_OPAQUE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PBRMaterial, "PBRMATERIAL_ALPHATEST", {
            /**
             * PBRMaterialTransparencyMode: Alpha Test mode, pixel are discarded below a certain threshold defined by the alpha cutoff value.
             */
            get: function () {
                return this._PBRMATERIAL_ALPHATEST;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PBRMaterial, "PBRMATERIAL_ALPHABLEND", {
            /**
             * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
             */
            get: function () {
                return this._PBRMATERIAL_ALPHABLEND;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PBRMaterial, "PBRMATERIAL_ALPHATESTANDBLEND", {
            /**
             * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
             * They are also discarded below the alpha cutoff threshold to improve performances.
             */
            get: function () {
                return this._PBRMATERIAL_ALPHATESTANDBLEND;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PBRMaterial.prototype, "imageProcessingConfiguration", {
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
        Object.defineProperty(PBRMaterial.prototype, "cameraColorCurvesEnabled", {
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
        Object.defineProperty(PBRMaterial.prototype, "cameraColorGradingEnabled", {
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
        Object.defineProperty(PBRMaterial.prototype, "cameraToneMappingEnabled", {
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
        Object.defineProperty(PBRMaterial.prototype, "cameraExposure", {
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
        Object.defineProperty(PBRMaterial.prototype, "cameraContrast", {
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
        Object.defineProperty(PBRMaterial.prototype, "cameraColorGradingTexture", {
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
        Object.defineProperty(PBRMaterial.prototype, "cameraColorCurves", {
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
        PBRMaterial.prototype.getClassName = function () {
            return "PBRMaterial";
        };
        PBRMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
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
        };
        PBRMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
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
        };
        PBRMaterial.prototype.clone = function (name) {
            var _this = this;
            var clone = BABYLON.SerializationHelper.Clone(function () { return new PBRMaterial(name, _this.getScene()); }, this);
            clone.id = name;
            clone.name = name;
            return clone;
        };
        PBRMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.PBRMaterial";
            return serializationObject;
        };
        // Statics
        PBRMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new PBRMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        PBRMaterial._PBRMATERIAL_OPAQUE = 0;
        PBRMaterial._PBRMATERIAL_ALPHATEST = 1;
        PBRMaterial._PBRMATERIAL_ALPHABLEND = 2;
        PBRMaterial._PBRMATERIAL_ALPHATESTANDBLEND = 3;
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "directIntensity", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "emissiveIntensity", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "environmentIntensity", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "specularIntensity", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "disableBumpMap", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "albedoTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "ambientTexture", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "ambientTextureStrength", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "opacityTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "reflectionTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "emissiveTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "reflectivityTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "metallicTexture", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "metallic", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "roughness", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "microSurfaceTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "bumpTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", null)
        ], PBRMaterial.prototype, "lightmapTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "refractionTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3("ambient"),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "ambientColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("albedo"),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "albedoColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("reflectivity"),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "reflectivityColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("reflection"),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "reflectionColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("emissive"),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "emissiveColor", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "microSurface", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "indexOfRefraction", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "invertRefractionY", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "linkRefractionWithTransparency", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useLightmapAsShadowmap", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useAlphaFromAlbedoTexture", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "forceAlphaTest", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "alphaCutOff", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useSpecularOverAlpha", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useMicroSurfaceFromReflectivityMapAlpha", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useRoughnessFromMetallicTextureAlpha", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useRoughnessFromMetallicTextureGreen", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useMetallnessFromMetallicTextureBlue", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useAmbientOcclusionFromMetallicTextureRed", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useAmbientInGrayScale", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useAutoMicroSurfaceFromReflectivityMap", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "usePhysicalLightFalloff", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useRadianceOverAlpha", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useParallax", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useParallaxOcclusion", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "parallaxScaleBias", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], PBRMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "forceIrradianceInFragment", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], PBRMaterial.prototype, "maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "invertNormalMapX", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "invertNormalMapY", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "twoSidedLighting", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useAlphaFresnel", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useLinearAlphaFresnel", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "environmentBRDFTexture", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "forceNormalForward", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useHorizonOcclusion", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMaterial.prototype, "useRadianceOcclusion", void 0);
        return PBRMaterial;
    }(BABYLON.PBRBaseMaterial));
    BABYLON.PBRMaterial = PBRMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.pbrMaterial.js.map



var BABYLON;
(function (BABYLON) {
    /**
     * The PBR material of BJS following the metal roughness convention.
     *
     * This fits to the PBR convention in the GLTF definition:
     * https://github.com/KhronosGroup/glTF/tree/2.0/specification/2.0
     */
    var PBRMetallicRoughnessMaterial = /** @class */ (function (_super) {
        __extends(PBRMetallicRoughnessMaterial, _super);
        /**
         * Instantiates a new PBRMetalRoughnessMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        function PBRMetallicRoughnessMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this._useRoughnessFromMetallicTextureAlpha = false;
            _this._useRoughnessFromMetallicTextureGreen = true;
            _this._useMetallnessFromMetallicTextureBlue = true;
            return _this;
        }
        /**
         * Return the currrent class name of the material.
         */
        PBRMetallicRoughnessMaterial.prototype.getClassName = function () {
            return "PBRMetallicRoughnessMaterial";
        };
        /**
         * Return the active textures of the material.
         */
        PBRMetallicRoughnessMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this.baseTexture) {
                activeTextures.push(this.baseTexture);
            }
            if (this.metallicRoughnessTexture) {
                activeTextures.push(this.metallicRoughnessTexture);
            }
            return activeTextures;
        };
        PBRMetallicRoughnessMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this.baseTexture === texture) {
                return true;
            }
            if (this.metallicRoughnessTexture === texture) {
                return true;
            }
            return false;
        };
        PBRMetallicRoughnessMaterial.prototype.clone = function (name) {
            var _this = this;
            var clone = BABYLON.SerializationHelper.Clone(function () { return new PBRMetallicRoughnessMaterial(name, _this.getScene()); }, this);
            clone.id = name;
            clone.name = name;
            return clone;
        };
        /**
         * Serialize the material to a parsable JSON object.
         */
        PBRMetallicRoughnessMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.PBRMetallicRoughnessMaterial";
            return serializationObject;
        };
        /**
         * Parses a JSON object correponding to the serialize function.
         */
        PBRMetallicRoughnessMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new PBRMetallicRoughnessMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsColor3(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_albedoColor")
        ], PBRMetallicRoughnessMaterial.prototype, "baseColor", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_albedoTexture")
        ], PBRMetallicRoughnessMaterial.prototype, "baseTexture", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMetallicRoughnessMaterial.prototype, "metallic", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], PBRMetallicRoughnessMaterial.prototype, "roughness", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_metallicTexture")
        ], PBRMetallicRoughnessMaterial.prototype, "metallicRoughnessTexture", void 0);
        return PBRMetallicRoughnessMaterial;
    }(BABYLON.PBRBaseSimpleMaterial));
    BABYLON.PBRMetallicRoughnessMaterial = PBRMetallicRoughnessMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.pbrMetallicRoughnessMaterial.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";
BABYLON.Effect.ShadersStore['pbrVertexShader'] = "precision highp float;\n#include<__decl__pbrVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2; \n#endif \n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#if defined(ALBEDO) && ALBEDODIRECTUV == 0\nvarying vec2 vAlbedoUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(REFLECTIVITY) && REFLECTIVITYDIRECTUV == 0\nvarying vec2 vReflectivityUV;\n#endif\n#if defined(MICROSURFACEMAP) && MICROSURFACEMAPDIRECTUV == 0\nvarying vec2 vMicroSurfaceSamplerUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)\nvarying vec3 vEnvironmentIrradiance;\n#include<harmonicsFunctions>\n#endif\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL\nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)\nvec3 reflectionVector=vec3(reflectionMatrix*vec4(vNormalW,0)).xyz;\n#ifdef REFLECTIONMAP_OPPOSITEZ\nreflectionVector.z*=-1.0;\n#endif\nvEnvironmentIrradiance=environmentIrradianceJones(reflectionVector);\n#endif\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif \n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif \n#if defined(ALBEDO) && ALBEDODIRECTUV == 0 \nif (vAlbedoInfos.x == 0.)\n{\nvAlbedoUV=vec2(albedoMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAlbedoUV=vec2(albedoMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0 \nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0 \nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0 \nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0 \nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(REFLECTIVITY) && REFLECTIVITYDIRECTUV == 0 \nif (vReflectivityInfos.x == 0.)\n{\nvReflectivityUV=vec2(reflectivityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvReflectivityUV=vec2(reflectivityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(MICROSURFACEMAP) && MICROSURFACEMAPDIRECTUV == 0 \nif (vMicroSurfaceSamplerInfos.x == 0.)\n{\nvMicroSurfaceSamplerUV=vec2(microSurfaceSamplerMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvMicroSurfaceSamplerUV=vec2(microSurfaceSamplerMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0 \nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#include<bumpVertex>\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['pbrPixelShader'] = "#if defined(BUMP) || !defined(NORMAL) || defined(FORCENORMALFORWARD)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LODBASEDMICROSFURACE\n#extension GL_EXT_shader_texture_lod : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\nprecision highp float;\n#include<__decl__pbrFragment>\nuniform vec4 vEyePosition;\nuniform vec3 vAmbientColor;\nuniform vec4 vCameraInfos;\n\nvarying vec3 vPositionW;\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif \n#ifdef MAINUV2 \nvarying vec2 vMainUV2;\n#endif \n#ifdef NORMAL\nvarying vec3 vNormalW;\n#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)\nvarying vec3 vEnvironmentIrradiance;\n#endif\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\n#ifdef ALBEDO\n#if ALBEDODIRECTUV == 1\n#define vAlbedoUV vMainUV1\n#elif ALBEDODIRECTUV == 2\n#define vAlbedoUV vMainUV2\n#else\nvarying vec2 vAlbedoUV;\n#endif\nuniform sampler2D albedoSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY\n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFLECTIVITY\n#if REFLECTIVITYDIRECTUV == 1\n#define vReflectivityUV vMainUV1\n#elif REFLECTIVITYDIRECTUV == 2\n#define vReflectivityUV vMainUV2\n#else\nvarying vec2 vReflectivityUV;\n#endif\nuniform sampler2D reflectivitySampler;\n#endif\n#ifdef MICROSURFACEMAP\n#if MICROSURFACEMAPDIRECTUV == 1\n#define vMicroSurfaceSamplerUV vMainUV1\n#elif MICROSURFACEMAPDIRECTUV == 2\n#define vMicroSurfaceSamplerUV vMainUV2\n#else\nvarying vec2 vMicroSurfaceSamplerUV;\n#endif\nuniform sampler2D microSurfaceSampler;\n#endif\n\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\n#define sampleRefraction(s,c) textureCube(s,c)\nuniform samplerCube refractionSampler;\n#ifdef LODBASEDMICROSFURACE\n#define sampleRefractionLod(s,c,l) textureCubeLodEXT(s,c,l)\n#else\nuniform samplerCube refractionSamplerLow;\nuniform samplerCube refractionSamplerHigh;\n#endif\n#else\n#define sampleRefraction(s,c) texture2D(s,c)\nuniform sampler2D refractionSampler;\n#ifdef LODBASEDMICROSFURACE\n#define sampleRefractionLod(s,c,l) texture2DLodEXT(s,c,l)\n#else\nuniform samplerCube refractionSamplerLow;\nuniform samplerCube refractionSamplerHigh;\n#endif\n#endif\n#endif\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\n#define sampleReflection(s,c) textureCube(s,c)\nuniform samplerCube reflectionSampler;\n#ifdef LODBASEDMICROSFURACE\n#define sampleReflectionLod(s,c,l) textureCubeLodEXT(s,c,l)\n#else\nuniform samplerCube reflectionSamplerLow;\nuniform samplerCube reflectionSamplerHigh;\n#endif\n#else\n#define sampleReflection(s,c) texture2D(s,c)\nuniform sampler2D reflectionSampler;\n#ifdef LODBASEDMICROSFURACE\n#define sampleReflectionLod(s,c,l) texture2DLodEXT(s,c,l)\n#else\nuniform samplerCube reflectionSamplerLow;\nuniform samplerCube reflectionSamplerHigh;\n#endif\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#ifdef ENVIRONMENTBRDF\nuniform sampler2D environmentBrdfSampler;\n#endif\n\n#ifndef FROMLINEARSPACE\n#define FROMLINEARSPACE;\n#endif\n#include<imageProcessingDeclaration>\n#include<helperFunctions>\n#include<imageProcessingFunctions>\n\n#include<shadowsFragmentFunctions>\n#include<pbrFunctions>\n#include<harmonicsFunctions>\n#include<pbrLightFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\n\n\nvec3 viewDirectionW=normalize(vEyePosition.xyz-vPositionW);\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(cross(dFdx(vPositionW),dFdy(vPositionW)))*vEyePosition.w;\n#endif\n#include<bumpFragment>\n#if defined(FORCENORMALFORWARD) && defined(NORMAL)\nvec3 faceNormal=normalize(cross(dFdx(vPositionW),dFdy(vPositionW)))*vEyePosition.w;\n#if defined(TWOSIDEDLIGHTING)\nfaceNormal=gl_FrontFacing ? faceNormal : -faceNormal;\n#endif\nnormalW*=sign(dot(normalW,faceNormal));\n#endif\n#if defined(TWOSIDEDLIGHTING) && defined(NORMAL)\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n\n\nvec3 surfaceAlbedo=vAlbedoColor.rgb;\n\nfloat alpha=vAlbedoColor.a;\n#ifdef ALBEDO\nvec4 albedoTexture=texture2D(albedoSampler,vAlbedoUV+uvOffset);\n#if defined(ALPHAFROMALBEDO) || defined(ALPHATEST)\nalpha*=albedoTexture.a;\n#endif\nsurfaceAlbedo*=toLinearSpace(albedoTexture.rgb);\nsurfaceAlbedo*=vAlbedoInfos.y;\n#endif\n\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nalpha=getLuminance(opacityMap.rgb);\n#else\nalpha*=opacityMap.a;\n#endif\nalpha*=vOpacityInfos.y;\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#if !defined(LINKREFRACTIONTOTRANSPARENCY) && !defined(ALPHAFRESNEL)\n#ifdef ALPHATEST\nif (alpha<=ALPHATESTVALUE)\ndiscard;\n#ifndef ALPHABLEND\n\nalpha=1.0;\n#endif\n#endif\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nsurfaceAlbedo*=vColor.rgb;\n#endif\n\nvec3 ambientOcclusionColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nvec3 ambientOcclusionColorMap=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#ifdef AMBIENTINGRAYSCALE\nambientOcclusionColorMap=vec3(ambientOcclusionColorMap.r,ambientOcclusionColorMap.r,ambientOcclusionColorMap.r);\n#endif\nambientOcclusionColor=mix(ambientOcclusionColor,ambientOcclusionColorMap,vAmbientInfos.z);\n#endif\n\nfloat microSurface=vReflectivityColor.a;\nvec3 surfaceReflectivityColor=vReflectivityColor.rgb;\n#ifdef METALLICWORKFLOW\nvec2 metallicRoughness=surfaceReflectivityColor.rg;\n#ifdef REFLECTIVITY\nvec4 surfaceMetallicColorMap=texture2D(reflectivitySampler,vReflectivityUV+uvOffset);\n#ifdef AOSTOREINMETALMAPRED\nvec3 aoStoreInMetalMap=vec3(surfaceMetallicColorMap.r,surfaceMetallicColorMap.r,surfaceMetallicColorMap.r);\nambientOcclusionColor=mix(ambientOcclusionColor,aoStoreInMetalMap,vReflectivityInfos.z);\n#endif\n#ifdef METALLNESSSTOREINMETALMAPBLUE\nmetallicRoughness.r*=surfaceMetallicColorMap.b;\n#else\nmetallicRoughness.r*=surfaceMetallicColorMap.r;\n#endif\n#ifdef ROUGHNESSSTOREINMETALMAPALPHA\nmetallicRoughness.g*=surfaceMetallicColorMap.a;\n#else\n#ifdef ROUGHNESSSTOREINMETALMAPGREEN\nmetallicRoughness.g*=surfaceMetallicColorMap.g;\n#endif\n#endif\n#endif\n#ifdef MICROSURFACEMAP\nvec4 microSurfaceTexel=texture2D(microSurfaceSampler,vMicroSurfaceSamplerUV+uvOffset)*vMicroSurfaceSamplerInfos.y;\nmetallicRoughness.g*=microSurfaceTexel.r;\n#endif\n\nmicroSurface=1.0-metallicRoughness.g;\n\nvec3 baseColor=surfaceAlbedo;\n\n\nconst vec3 DefaultSpecularReflectanceDielectric=vec3(0.04,0.04,0.04);\n\nsurfaceAlbedo=mix(baseColor.rgb*(1.0-DefaultSpecularReflectanceDielectric.r),vec3(0.,0.,0.),metallicRoughness.r);\n\nsurfaceReflectivityColor=mix(DefaultSpecularReflectanceDielectric,baseColor,metallicRoughness.r);\n#else\n#ifdef REFLECTIVITY\nvec4 surfaceReflectivityColorMap=texture2D(reflectivitySampler,vReflectivityUV+uvOffset);\nsurfaceReflectivityColor*=toLinearSpace(surfaceReflectivityColorMap.rgb);\nsurfaceReflectivityColor*=vReflectivityInfos.y;\n#ifdef MICROSURFACEFROMREFLECTIVITYMAP\nmicroSurface*=surfaceReflectivityColorMap.a;\nmicroSurface*=vReflectivityInfos.z;\n#else\n#ifdef MICROSURFACEAUTOMATIC\nmicroSurface*=computeDefaultMicroSurface(microSurface,surfaceReflectivityColor);\n#endif\n#ifdef MICROSURFACEMAP\nvec4 microSurfaceTexel=texture2D(microSurfaceSampler,vMicroSurfaceSamplerUV+uvOffset)*vMicroSurfaceSamplerInfos.y;\nmicroSurface*=microSurfaceTexel.r;\n#endif\n#endif\n#endif\n#endif\n\nmicroSurface=clamp(microSurface,0.,1.);\n\nfloat roughness=1.-microSurface;\n\n#ifdef ALPHAFRESNEL\n#if defined(ALPHATEST) || defined(ALPHABLEND)\n\n\n\nfloat opacityPerceptual=alpha;\n#ifdef LINEARALPHAFRESNEL\nfloat opacity0=opacityPerceptual;\n#else\nfloat opacity0=opacityPerceptual*opacityPerceptual;\n#endif\nfloat opacity90=fresnelGrazingReflectance(opacity0);\nvec3 normalForward=faceforward(normalW,-viewDirectionW,normalW);\n\nalpha=fresnelSchlickEnvironmentGGX(clamp(dot(viewDirectionW,normalForward),0.0,1.0),vec3(opacity0),vec3(opacity90),sqrt(microSurface)).x;\n#ifdef ALPHATEST\nif (alpha<=ALPHATESTVALUE)\ndiscard;\n#ifndef ALPHABLEND\n\nalpha=1.0;\n#endif\n#endif\n#endif\n#endif\n\n\nfloat NdotVUnclamped=dot(normalW,viewDirectionW);\nfloat NdotV=clamp(NdotVUnclamped,0.,1.)+0.00001;\nfloat alphaG=convertRoughnessToAverageSlope(roughness);\n\n#ifdef REFRACTION\nvec3 environmentRefraction=vec3(0.,0.,0.);\nvec3 refractionVector=refract(-viewDirectionW,normalW,vRefractionInfos.y);\n#ifdef REFRACTIONMAP_OPPOSITEZ\nrefractionVector.z*=-1.0;\n#endif\n\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nvec3 refractionCoords=refractionVector;\nrefractionCoords=vec3(refractionMatrix*vec4(refractionCoords,0));\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\n#endif\n#ifdef LODINREFRACTIONALPHA\nfloat refractionLOD=getLodFromAlphaG(vRefractionMicrosurfaceInfos.x,alphaG,NdotVUnclamped);\n#else\nfloat refractionLOD=getLodFromAlphaG(vRefractionMicrosurfaceInfos.x,alphaG,1.0);\n#endif\n#ifdef LODBASEDMICROSFURACE\n\nrefractionLOD=refractionLOD*vRefractionMicrosurfaceInfos.y+vRefractionMicrosurfaceInfos.z;\n#ifdef LODINREFRACTIONALPHA\n\n\n\n\n\n\n\n\n\nfloat automaticRefractionLOD=UNPACK_LOD(sampleRefraction(refractionSampler,refractionCoords).a);\nfloat requestedRefractionLOD=max(automaticRefractionLOD,refractionLOD);\n#else\nfloat requestedRefractionLOD=refractionLOD;\n#endif\nenvironmentRefraction=sampleRefractionLod(refractionSampler,refractionCoords,requestedRefractionLOD).rgb;\n#else\nfloat lodRefractionNormalized=clamp(refractionLOD/log2(vRefractionMicrosurfaceInfos.x),0.,1.);\nfloat lodRefractionNormalizedDoubled=lodRefractionNormalized*2.0;\nvec3 environmentRefractionMid=sampleRefraction(refractionSampler,refractionCoords).rgb;\nif(lodRefractionNormalizedDoubled<1.0){\nenvironmentRefraction=mix(\nsampleRefraction(refractionSamplerHigh,refractionCoords).rgb,\nenvironmentRefractionMid,\nlodRefractionNormalizedDoubled\n);\n}else{\nenvironmentRefraction=mix(\nenvironmentRefractionMid,\nsampleRefraction(refractionSamplerLow,refractionCoords).rgb,\nlodRefractionNormalizedDoubled-1.0\n);\n}\n#endif\n#ifdef GAMMAREFRACTION\nenvironmentRefraction=toLinearSpace(environmentRefraction.rgb);\n#endif\n\nenvironmentRefraction*=vRefractionInfos.x;\n#endif\n\n#ifdef REFLECTION\nvec3 environmentRadiance=vec3(0.,0.,0.);\nvec3 environmentIrradiance=vec3(0.,0.,0.);\nvec3 reflectionVector=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_OPPOSITEZ\nreflectionVector.z*=-1.0;\n#endif\n\n#ifdef REFLECTIONMAP_3D\nvec3 reflectionCoords=reflectionVector;\n#else\nvec2 reflectionCoords=reflectionVector.xy;\n#ifdef REFLECTIONMAP_PROJECTION\nreflectionCoords/=reflectionVector.z;\n#endif\nreflectionCoords.y=1.0-reflectionCoords.y;\n#endif\n#if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)\nfloat reflectionLOD=getLodFromAlphaG(vReflectionMicrosurfaceInfos.x,alphaG,NdotVUnclamped);\n#else\nfloat reflectionLOD=getLodFromAlphaG(vReflectionMicrosurfaceInfos.x,alphaG,1.);\n#endif\n#ifdef LODBASEDMICROSFURACE\n\nreflectionLOD=reflectionLOD*vReflectionMicrosurfaceInfos.y+vReflectionMicrosurfaceInfos.z;\n#ifdef LODINREFLECTIONALPHA\n\n\n\n\n\n\n\n\n\nfloat automaticReflectionLOD=UNPACK_LOD(sampleReflection(reflectionSampler,reflectionCoords).a);\nfloat requestedReflectionLOD=max(automaticReflectionLOD,reflectionLOD);\n#else\nfloat requestedReflectionLOD=reflectionLOD;\n#endif\nenvironmentRadiance=sampleReflectionLod(reflectionSampler,reflectionCoords,requestedReflectionLOD).rgb;\n#else\nfloat lodReflectionNormalized=clamp(reflectionLOD/log2(vReflectionMicrosurfaceInfos.x),0.,1.);\nfloat lodReflectionNormalizedDoubled=lodReflectionNormalized*2.0;\nvec3 environmentSpecularMid=sampleReflection(reflectionSampler,reflectionCoords).rgb;\nif(lodReflectionNormalizedDoubled<1.0){\nenvironmentRadiance=mix(\nsampleReflection(reflectionSamplerHigh,reflectionCoords).rgb,\nenvironmentSpecularMid,\nlodReflectionNormalizedDoubled\n);\n}else{\nenvironmentRadiance=mix(\nenvironmentSpecularMid,\nsampleReflection(reflectionSamplerLow,reflectionCoords).rgb,\nlodReflectionNormalizedDoubled-1.0\n);\n}\n#endif\n#ifdef GAMMAREFLECTION\nenvironmentRadiance=toLinearSpace(environmentRadiance.rgb);\n#endif\n\n#ifdef USESPHERICALFROMREFLECTIONMAP\n#if defined(NORMAL) && defined(USESPHERICALINVERTEX)\nenvironmentIrradiance=vEnvironmentIrradiance;\n#else\nvec3 irradianceVector=vec3(reflectionMatrix*vec4(normalW,0)).xyz;\n#ifdef REFLECTIONMAP_OPPOSITEZ\nirradianceVector.z*=-1.0;\n#endif\nenvironmentIrradiance=environmentIrradianceJones(irradianceVector);\n#endif\n#endif\n\nenvironmentRadiance*=vReflectionInfos.x;\nenvironmentRadiance*=vReflectionColor.rgb;\nenvironmentIrradiance*=vReflectionColor.rgb;\n#endif\n\n\n\nfloat reflectance=max(max(surfaceReflectivityColor.r,surfaceReflectivityColor.g),surfaceReflectivityColor.b);\nfloat reflectance90=fresnelGrazingReflectance(reflectance);\nvec3 specularEnvironmentR0=surfaceReflectivityColor.rgb;\nvec3 specularEnvironmentR90=vec3(1.0,1.0,1.0)*reflectance90;\n\nvec3 diffuseBase=vec3(0.,0.,0.);\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\nlightingInfo info;\nfloat shadow=1.; \nfloat NdotL=-1.;\n#include<lightFragment>[0..maxSimultaneousLights]\n\n#if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)\n\nvec2 brdfSamplerUV=vec2(NdotV,roughness);\n\nvec4 environmentBrdf=texture2D(environmentBrdfSampler,brdfSamplerUV);\nvec3 specularEnvironmentReflectance=specularEnvironmentR0*environmentBrdf.x+environmentBrdf.y;\n#ifdef RADIANCEOCCLUSION\n#ifdef AMBIENTINGRAYSCALE\nfloat ambientMonochrome=ambientOcclusionColor.r;\n#else\nfloat ambientMonochrome=getLuminance(ambientOcclusionColor);\n#endif\nfloat seo=environmentRadianceOcclusion(ambientMonochrome,NdotVUnclamped);\nspecularEnvironmentReflectance*=seo;\n#endif\n#ifdef HORIZONOCCLUSION\n#ifdef BUMP\n#ifdef REFLECTIONMAP_3D\nfloat eho=environmentHorizonOcclusion(reflectionCoords,normalW);\nspecularEnvironmentReflectance*=eho;\n#endif\n#endif\n#endif\n#else\n\nvec3 specularEnvironmentReflectance=fresnelSchlickEnvironmentGGX(NdotV,specularEnvironmentR0,specularEnvironmentR90,sqrt(microSurface));\n#endif\n\n#ifdef REFRACTION\nvec3 refractance=vec3(0.0,0.0,0.0);\nvec3 transmission=vec3(1.0,1.0,1.0);\n#ifdef LINKREFRACTIONTOTRANSPARENCY\n\ntransmission*=(1.0-alpha);\n\n\nvec3 mixedAlbedo=surfaceAlbedo;\nfloat maxChannel=max(max(mixedAlbedo.r,mixedAlbedo.g),mixedAlbedo.b);\nvec3 tint=clamp(maxChannel*mixedAlbedo,0.0,1.0);\n\nsurfaceAlbedo*=alpha;\n\nenvironmentIrradiance*=alpha;\n\nenvironmentRefraction*=tint;\n\nalpha=1.0;\n#endif\n\nvec3 bounceSpecularEnvironmentReflectance=(2.0*specularEnvironmentReflectance)/(1.0+specularEnvironmentReflectance);\nspecularEnvironmentReflectance=mix(bounceSpecularEnvironmentReflectance,specularEnvironmentReflectance,alpha);\n\ntransmission*=1.0-specularEnvironmentReflectance;\n\nrefractance=transmission;\n#endif\n\n\n\n\nsurfaceAlbedo.rgb=(1.-reflectance)*surfaceAlbedo.rgb;\n\nvec3 finalDiffuse=diffuseBase;\nfinalDiffuse.rgb+=vAmbientColor;\nfinalDiffuse*=surfaceAlbedo.rgb;\nfinalDiffuse=max(finalDiffuse,0.0);\n\n#ifdef REFLECTION\nvec3 finalIrradiance=environmentIrradiance;\nfinalIrradiance*=surfaceAlbedo.rgb;\n#endif\n\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase;\nfinalSpecular=max(finalSpecular,0.0);\n\nvec3 finalSpecularScaled=finalSpecular*vLightingIntensity.x*vLightingIntensity.w;\n#endif\n\n#ifdef REFLECTION\nvec3 finalRadiance=environmentRadiance;\nfinalRadiance*=specularEnvironmentReflectance;\n\nvec3 finalRadianceScaled=finalRadiance*vLightingIntensity.z;\n#endif\n\n#ifdef REFRACTION\nvec3 finalRefraction=environmentRefraction;\nfinalRefraction*=refractance;\n#endif\n\nvec3 finalEmissive=vEmissiveColor;\n#ifdef EMISSIVE\nvec3 emissiveColorTex=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb;\nfinalEmissive*=toLinearSpace(emissiveColorTex.rgb);\nfinalEmissive*=vEmissiveInfos.y;\n#endif\n\n#ifdef ALPHABLEND\nfloat luminanceOverAlpha=0.0;\n#if defined(REFLECTION) && defined(RADIANCEOVERALPHA)\nluminanceOverAlpha+=getLuminance(finalRadianceScaled);\n#endif\n#if defined(SPECULARTERM) && defined(SPECULAROVERALPHA)\nluminanceOverAlpha+=getLuminance(finalSpecularScaled);\n#endif\n#if defined(RADIANCEOVERALPHA) || defined(SPECULAROVERALPHA)\nalpha=clamp(alpha+luminanceOverAlpha*luminanceOverAlpha,0.,1.);\n#endif\n#endif\n\n\n\nvec4 finalColor=vec4(finalDiffuse*ambientOcclusionColor*vLightingIntensity.x +\n#ifdef REFLECTION\nfinalIrradiance*ambientOcclusionColor*vLightingIntensity.z +\n#endif\n#ifdef SPECULARTERM\n\n\nfinalSpecularScaled +\n#endif\n#ifdef REFLECTION\n\n\nfinalRadianceScaled +\n#endif\n#ifdef REFRACTION\nfinalRefraction*vLightingIntensity.z +\n#endif\nfinalEmissive*vLightingIntensity.y,\nalpha);\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\nfinalColor.rgb*=lightmapColor;\n#else\nfinalColor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n\nfinalColor=max(finalColor,0.0);\n#include<logDepthFragment>\n#include<fogFragment>(color,finalColor)\n#ifdef IMAGEPROCESSINGPOSTPROCESS\n\n\nfinalColor.rgb=clamp(finalColor.rgb,0.,30.0);\n#else\n\nfinalColor=applyImageProcessing(finalColor);\n#endif\n#ifdef PREMULTIPLYALPHA\n\nfinalColor.rgb*=finalColor.a;\n#endif\ngl_FragColor=finalColor;\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n}";



var BABYLON;
(function (BABYLON) {
    /**
     * The PBR material of BJS following the specular glossiness convention.
     *
     * This fits to the PBR convention in the GLTF definition:
     * https://github.com/KhronosGroup/glTF/tree/2.0/extensions/Khronos/KHR_materials_pbrSpecularGlossiness
     */
    var PBRSpecularGlossinessMaterial = /** @class */ (function (_super) {
        __extends(PBRSpecularGlossinessMaterial, _super);
        /**
         * Instantiates a new PBRSpecularGlossinessMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        function PBRSpecularGlossinessMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this._useMicroSurfaceFromReflectivityMapAlpha = true;
            return _this;
        }
        /**
         * Return the currrent class name of the material.
         */
        PBRSpecularGlossinessMaterial.prototype.getClassName = function () {
            return "PBRSpecularGlossinessMaterial";
        };
        /**
         * Return the active textures of the material.
         */
        PBRSpecularGlossinessMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this.diffuseTexture) {
                activeTextures.push(this.diffuseTexture);
            }
            if (this.specularGlossinessTexture) {
                activeTextures.push(this.specularGlossinessTexture);
            }
            return activeTextures;
        };
        PBRSpecularGlossinessMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this.diffuseTexture === texture) {
                return true;
            }
            if (this.specularGlossinessTexture === texture) {
                return true;
            }
            return false;
        };
        PBRSpecularGlossinessMaterial.prototype.clone = function (name) {
            var _this = this;
            var clone = BABYLON.SerializationHelper.Clone(function () { return new PBRSpecularGlossinessMaterial(name, _this.getScene()); }, this);
            clone.id = name;
            clone.name = name;
            return clone;
        };
        /**
         * Serialize the material to a parsable JSON object.
         */
        PBRSpecularGlossinessMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.PBRSpecularGlossinessMaterial";
            return serializationObject;
        };
        /**
         * Parses a JSON object correponding to the serialize function.
         */
        PBRSpecularGlossinessMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new PBRSpecularGlossinessMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsColor3("diffuse"),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_albedoColor")
        ], PBRSpecularGlossinessMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_albedoTexture")
        ], PBRSpecularGlossinessMaterial.prototype, "diffuseTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3("specular"),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_reflectivityColor")
        ], PBRSpecularGlossinessMaterial.prototype, "specularColor", void 0);
        __decorate([
            BABYLON.serialize(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_microSurface")
        ], PBRSpecularGlossinessMaterial.prototype, "glossiness", void 0);
        __decorate([
            BABYLON.serializeAsTexture(),
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty", "_reflectivityTexture")
        ], PBRSpecularGlossinessMaterial.prototype, "specularGlossinessTexture", void 0);
        return PBRSpecularGlossinessMaterial;
    }(BABYLON.PBRBaseSimpleMaterial));
    BABYLON.PBRSpecularGlossinessMaterial = PBRSpecularGlossinessMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.pbrSpecularGlossinessMaterial.js.map

BABYLON.Effect.IncludesShadersStore['depthPrePass'] = "#ifdef DEPTHPREPASS\ngl_FragColor=vec4(0.,0.,0.,1.0);\nreturn;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesDeclaration'] = "#if NUM_BONE_INFLUENCERS>0\nuniform mat4 mBones[BonesPerMesh];\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS>4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesDeclaration'] = "#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertexDeclaration'] = "#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertexDeclaration'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n#endif\n";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertexDeclaration'] = "#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertexDeclaration'] = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexGlobalDeclaration'] = "#ifdef MORPHTARGETS\nuniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexDeclaration'] = "#ifdef MORPHTARGETS\nattribute vec3 position{X};\n#ifdef MORPHTARGETS_NORMAL\nattribute vec3 normal{X};\n#endif\n#ifdef MORPHTARGETS_TANGENT\nattribute vec3 tangent{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthDeclaration'] = "#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertex'] = "#ifdef MORPHTARGETS\npositionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];\n#ifdef MORPHTARGETS_NORMAL\nnormalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];\n#endif\n#ifdef MORPHTARGETS_TANGENT\ntangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesVertex'] = "#ifdef INSTANCES\nmat4 finalWorld=mat4(world0,world1,world2,world3);\n#else\nmat4 finalWorld=world;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesVertex'] = "#if NUM_BONE_INFLUENCERS>0\nmat4 influence;\ninfluence=mBones[int(matricesIndices[0])]*matricesWeights[0];\n#if NUM_BONE_INFLUENCERS>1\ninfluence+=mBones[int(matricesIndices[1])]*matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS>2\ninfluence+=mBones[int(matricesIndices[2])]*matricesWeights[2];\n#endif \n#if NUM_BONE_INFLUENCERS>3\ninfluence+=mBones[int(matricesIndices[3])]*matricesWeights[3];\n#endif \n#if NUM_BONE_INFLUENCERS>4\ninfluence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];\n#endif \n#if NUM_BONE_INFLUENCERS>5\ninfluence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];\n#endif \n#if NUM_BONE_INFLUENCERS>6\ninfluence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];\n#endif \n#if NUM_BONE_INFLUENCERS>7\ninfluence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];\n#endif \nfinalWorld=finalWorld*influence;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertex'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL)\nvec3 tbnNormal=normalize(normalUpdated);\nvec3 tbnTangent=normalize(tangentUpdated.xyz);\nvec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;\nvTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertex'] = "#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertex'] = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif";
BABYLON.Effect.IncludesShadersStore['shadowsVertex'] = "#ifdef SHADOWS\n#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})\nvPositionFromLight{X}=lightMatrix{X}*worldPos;\nvDepthMetric{X}=((vPositionFromLight{X}.z+light{X}.depthValues.x)/(light{X}.depthValues.y));\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertex'] = "#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthVertex'] = "#ifdef LOGARITHMICDEPTH\nvFragmentDepth=1.0+gl_Position.w;\ngl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;\n#endif";
BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "const float PI=3.1415926535897932384626433832795;\nconst float LinearEncodePowerApprox=2.2;\nconst float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;\nconst vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);\nmat3 transposeMat3(mat3 inMatrix) {\nvec3 i0=inMatrix[0];\nvec3 i1=inMatrix[1];\nvec3 i2=inMatrix[2];\nmat3 outMatrix=mat3(\nvec3(i0.x,i1.x,i2.x),\nvec3(i0.y,i1.y,i2.y),\nvec3(i0.z,i1.z,i2.z)\n);\nreturn outMatrix;\n}\n\nmat3 inverseMat3(mat3 inMatrix) {\nfloat a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];\nfloat a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];\nfloat a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];\nfloat b01=a22*a11-a12*a21;\nfloat b11=-a22*a10+a12*a20;\nfloat b21=a21*a10-a11*a20;\nfloat det=a00*b01+a01*b11+a02*b21;\nreturn mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),\nb11,(a22*a00-a02*a20),(-a12*a00+a02*a10),\nb21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;\n}\nfloat computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)\n{\nfloat mask=smoothstep(1.0-frustumEdgeFalloff,1.0,clamp(dot(clipSpace,clipSpace),0.,1.));\nreturn mix(value,1.0,mask);\n}\nvec3 applyEaseInOut(vec3 x){\nreturn x*x*(3.0-2.0*x);\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn pow(color,vec3(LinearEncodePowerApprox));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn pow(color,vec3(GammaEncodePowerApprox));\n}\nfloat square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,LuminanceEncodeApprox),0.,1.);\n}\n\nfloat getRand(vec2 seed) {\nreturn fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);\n}\nvec3 dither(vec2 seed,vec3 color) {\nfloat rand=getRand(seed);\ncolor+=mix(-0.5/255.0,0.5/255.0,rand);\ncolor=max(color,0.0);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['lightFragmentDeclaration'] = "#ifdef LIGHT{X}\nuniform vec4 vLightData{X};\nuniform vec4 vLightDiffuse{X};\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular{X};\n#else\nvec3 vLightSpecular{X}=vec3(0.);\n#endif\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\nuniform vec4 shadowsInfo{X};\nuniform vec2 depthValues{X};\n#endif\n#ifdef SPOTLIGHT{X}\nuniform vec4 vLightDirection{X};\n#endif\n#ifdef HEMILIGHT{X}\nuniform vec3 vLightGround{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['lightsFragmentFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n#ifdef NDOTL\nfloat ndl;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nattenuation*=cosAngle;\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\n#ifdef NDOTL\nresult.ndl=0.;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor;\n#endif\nreturn result;\n}\n";
BABYLON.Effect.IncludesShadersStore['lightUboDeclaration'] = "#ifdef LIGHT{X}\nuniform Light{X}\n{\nvec4 vLightData;\nvec4 vLightDiffuse;\nvec3 vLightSpecular;\n#ifdef SPOTLIGHT{X}\nvec4 vLightDirection;\n#endif\n#ifdef HEMILIGHT{X}\nvec3 vLightGround;\n#endif\nvec4 shadowsInfo;\nvec2 depthValues;\n} light{X};\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultVertexDeclaration'] = "\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\nuniform mat4 specularMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['defaultFragmentDeclaration'] = "uniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\nuniform vec3 vEmissiveColor;\n\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifndef REFRACTIONMAP_3D\nuniform mat4 refractionMatrix;\n#endif\n#ifdef REFRACTIONFRESNEL\nuniform vec4 refractionLeftColor;\nuniform vec4 refractionRightColor;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\n#endif\n#ifdef DIFFUSEFRESNEL\nuniform vec4 diffuseLeftColor;\nuniform vec4 diffuseRightColor;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#ifdef REFLECTIONFRESNEL\nuniform vec4 reflectionLeftColor;\nuniform vec4 reflectionRightColor;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nvec4 diffuseLeftColor;\nvec4 diffuseRightColor;\nvec4 opacityParts;\nvec4 reflectionLeftColor;\nvec4 reflectionRightColor;\nvec4 refractionLeftColor;\nvec4 refractionRightColor;\nvec4 emissiveLeftColor; \nvec4 emissiveRightColor;\nvec2 vDiffuseInfos;\nvec2 vAmbientInfos;\nvec2 vOpacityInfos;\nvec2 vReflectionInfos;\nvec2 vEmissiveInfos;\nvec2 vLightmapInfos;\nvec2 vSpecularInfos;\nvec3 vBumpInfos;\nmat4 diffuseMatrix;\nmat4 ambientMatrix;\nmat4 opacityMatrix;\nmat4 reflectionMatrix;\nmat4 emissiveMatrix;\nmat4 lightmapMatrix;\nmat4 specularMatrix;\nmat4 bumpMatrix; \nvec4 vTangentSpaceParams;\nmat4 refractionMatrix;\nvec4 vRefractionInfos;\nvec4 vSpecularColor;\nvec3 vEmissiveColor;\nvec4 vDiffuseColor;\nfloat pointSize; \n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['shadowsFragmentFunctions'] = "#ifdef SHADOWS\n#ifndef SHADOWFLOAT\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#endif\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadow=textureCube(shadowSampler,directionToLight).x;\n#endif\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\n#ifndef SHADOWFLOAT\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;\n#else\nif (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;\n#endif\nreturn min(1.0,visibility+darkness);\n}\nfloat computeShadowWithESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness); \nreturn esm;\n}\nfloat computeShadowWithCloseESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn esm;\n}\nfloat computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadow=texture2D(shadowSampler,uv).x;\n#endif\nif (shadowPixelDepth>shadow)\n{\nreturn computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff);\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\n#ifndef SHADOWFLOAT\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<shadowPixelDepth) visibility-=0.25;\n#else\nif (texture2D(shadowSampler,uv+poissonDisk[0]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[1]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[2]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[3]*mapSize).x<shadowPixelDepth) visibility-=0.25;\n#endif\nreturn computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0); \n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\n#endif\n";
BABYLON.Effect.IncludesShadersStore['fresnelFunction'] = "#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)\n{\nfloat fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);\nreturn clamp(fresnelTerm,0.,1.);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['reflectionFunction'] = "vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)\n{\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvec3 direction=normalize(vDirectionW);\nfloat t=clamp(direction.y*-0.5+0.5,0.,1.0);\nfloat s=atan(direction.z,direction.x)*RECIPROCAL_PI2+0.5;\n#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED\nreturn vec3(1.0-s,t,0);\n#else\nreturn vec3(s,t,0);\n#endif\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvec3 cameraToVertex=normalize(worldPos.xyz-vEyePosition.xyz);\nvec3 r=reflect(cameraToVertex,worldNormal);\nfloat t=clamp(r.y*-0.5+0.5,0.,1.0);\nfloat s=atan(r.z,r.x)*RECIPROCAL_PI2+0.5;\nreturn vec3(s,t,0);\n#endif\n#ifdef REFLECTIONMAP_SPHERICAL\nvec3 viewDir=normalize(vec3(view*worldPos));\nvec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));\nvec3 r=reflect(viewDir,viewNormal);\nr.z=r.z-1.0;\nfloat m=2.0*length(r);\nreturn vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);\n#endif\n#ifdef REFLECTIONMAP_PLANAR\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=normalize(reflect(viewDir,worldNormal));\nreturn vec3(reflectionMatrix*vec4(coords,1));\n#endif\n#ifdef REFLECTIONMAP_CUBIC\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=reflect(viewDir,worldNormal);\n#ifdef INVERTCUBICMAP\ncoords.y=1.0-coords.y;\n#endif\nreturn vec3(reflectionMatrix*vec4(coords,0));\n#endif\n#ifdef REFLECTIONMAP_PROJECTION\nreturn vec3(reflectionMatrix*(view*worldPos));\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nreturn vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EXPLICIT\nreturn vec3(0,0,0);\n#endif\n}";
BABYLON.Effect.IncludesShadersStore['imageProcessingDeclaration'] = "#ifdef EXPOSURE\nuniform float exposureLinear;\n#endif\n#ifdef CONTRAST\nuniform float contrast;\n#endif\n#ifdef VIGNETTE\nuniform vec2 vInverseScreenSize;\nuniform vec4 vignetteSettings1;\nuniform vec4 vignetteSettings2;\n#endif\n#ifdef COLORCURVES\nuniform vec4 vCameraColorCurveNegative;\nuniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\n#endif\n#ifdef COLORGRADING\n#ifdef COLORGRADING3D\nuniform highp sampler3D txColorTransform;\n#else\nuniform sampler2D txColorTransform;\n#endif\nuniform vec4 colorTransformSettings;\n#endif";
BABYLON.Effect.IncludesShadersStore['imageProcessingFunctions'] = "#if defined(COLORGRADING) && !defined(COLORGRADING3D)\n\nvec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)\n{\nfloat sliceSize=2.0*sampler3dSetting.x; \n#ifdef SAMPLER3DGREENDEPTH\nfloat sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;\n#else\nfloat sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;\n#endif\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger;\n#ifdef SAMPLER3DGREENDEPTH\nvec2 sliceUV=color.rb;\n#else\nvec2 sliceUV=color.rg;\n#endif\nsliceUV.x*=sliceSize;\nsliceUV.x+=sliceInteger*sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice0Color=texture2D(colorTransform,sliceUV);\nsliceUV.x+=sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice1Color=texture2D(colorTransform,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\n#ifdef SAMPLER3DBGRMAP\ncolor.rgb=result.rgb;\n#else\ncolor.rgb=result.bgr;\n#endif\nreturn color;\n}\n#endif\nvec4 applyImageProcessing(vec4 result) {\n#ifdef EXPOSURE\nresult.rgb*=exposureLinear;\n#endif\n#ifdef VIGNETTE\n\nvec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;\nviewportXY=viewportXY*2.0-1.0;\nvec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);\nfloat vignetteTerm=dot(vignetteXY1,vignetteXY1);\nfloat vignette=pow(vignetteTerm,vignetteSettings2.w);\n\nvec3 vignetteColor=vignetteSettings2.rgb;\n#ifdef VIGNETTEBLENDMODEMULTIPLY\nvec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);\nresult.rgb*=vignetteColorMultiplier;\n#endif\n#ifdef VIGNETTEBLENDMODEOPAQUE\nresult.rgb=mix(vignetteColor,result.rgb,vignette);\n#endif\n#endif\n#ifdef TONEMAPPING\nconst float tonemappingCalibration=1.590579;\nresult.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);\n#endif\n\nresult.rgb=toGammaSpace(result.rgb);\nresult.rgb=clamp(result.rgb,0.0,1.0);\n#ifdef CONTRAST\n\nvec3 resultHighContrast=applyEaseInOut(result.rgb);\nif (contrast<1.0) {\n\nresult.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);\n} else {\n\nresult.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);\n}\n#endif\n\n#ifdef COLORGRADING\nvec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;\n#ifdef COLORGRADING3D\nvec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;\n#else\nvec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;\n#endif\nresult.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);\n#endif\n#ifdef COLORCURVES\n\nfloat luma=getLuminance(result.rgb);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma),result.rgb,colorCurve.a);\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['bumpFragmentFunctions'] = "#ifdef BUMP\n#if BUMPDIRECTUV == 1\n#define vBumpUV vMainUV1\n#elif BUMPDIRECTUV == 2\n#define vBumpUV vMainUV2\n#else\nvarying vec2 vBumpUV;\n#endif\nuniform sampler2D bumpSampler;\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nuv=gl_FrontFacing ? uv : -uv;\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;\n\ntangent*=vTangentSpaceParams.x;\nbitangent*=vTangentSpaceParams.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(bitangent,bitangent)));\nreturn mat3(tangent*invmax,bitangent*invmax,normal);\n}\nvec3 perturbNormal(mat3 cotangentFrame,vec2 uv)\n{\nvec3 map=texture2D(bumpSampler,uv).xyz;\nmap=map*2.0-1.0;\n#ifdef NORMALXYSCALE\nmap=normalize(map*vec3(vBumpInfos.y,vBumpInfos.y,1.0));\n#endif\nreturn normalize(cotangentFrame*map);\n}\n#ifdef PARALLAX\nconst float minSamples=4.;\nconst float maxSamples=15.;\nconst int iMaxSamples=15;\n\nvec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {\nfloat parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;\nparallaxLimit*=parallaxScale;\nvec2 vOffsetDir=normalize(vViewDirCoT.xy);\nvec2 vMaxOffset=vOffsetDir*parallaxLimit;\nfloat numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));\nfloat stepSize=1.0/numSamples;\n\nfloat currRayHeight=1.0;\nvec2 vCurrOffset=vec2(0,0);\nvec2 vLastOffset=vec2(0,0);\nfloat lastSampledHeight=1.0;\nfloat currSampledHeight=1.0;\nfor (int i=0; i<iMaxSamples; i++)\n{\ncurrSampledHeight=texture2D(bumpSampler,vBumpUV+vCurrOffset).w;\n\nif (currSampledHeight>currRayHeight)\n{\nfloat delta1=currSampledHeight-currRayHeight;\nfloat delta2=(currRayHeight+stepSize)-lastSampledHeight;\nfloat ratio=delta1/(delta1+delta2);\nvCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;\n\nbreak;\n}\nelse\n{\ncurrRayHeight-=stepSize;\nvLastOffset=vCurrOffset;\nvCurrOffset+=stepSize*vMaxOffset;\nlastSampledHeight=currSampledHeight;\n}\n}\nreturn vCurrOffset;\n}\nvec2 parallaxOffset(vec3 viewDir,float heightScale)\n{\n\nfloat height=texture2D(bumpSampler,vBumpUV).w;\nvec2 texCoordOffset=heightScale*viewDir.xy*height;\nreturn -texCoordOffset;\n}\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragmentDeclaration'] = "#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragmentDeclaration'] = "#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying vec3 vFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nfloat fogDistance=length(vFogDistance);\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragment'] = "#ifdef CLIPPLANE\nif (fClipDistance>0.0)\n{\ndiscard;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpFragment'] = "vec2 uvOffset=vec2(0.0,0.0);\n#if defined(BUMP) || defined(PARALLAX)\n#ifdef NORMALXYSCALE\nfloat normalScale=1.0;\n#else \nfloat normalScale=vBumpInfos.y;\n#endif\n#if defined(TANGENT) && defined(NORMAL)\nmat3 TBN=vTBN;\n#else\nmat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,vBumpUV);\n#endif\n#endif\n#ifdef PARALLAX\nmat3 invTBN=transposeMat3(TBN);\n#ifdef PARALLAXOCCLUSION\nuvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);\n#else\nuvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);\n#endif\n#endif\n#ifdef BUMP\nnormalW=perturbNormal(TBN,vBumpUV+uvOffset);\n#endif";
BABYLON.Effect.IncludesShadersStore['lightFragment'] = "#ifdef LIGHT{X}\n#if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))\n\n#else\n#ifdef PBR\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,glossiness);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWCLOSEESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithCloseESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else \n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#endif\n#endif\n#endif\n#ifdef SHADOWONLY\n#ifndef SHADOWINUSE\n#define SHADOWINUSE\n#endif\nglobalShadow+=shadow;\nshadowLightCount+=1.0;\n#endif\n#else\nshadow=1.;\n#endif\n#ifndef SHADOWONLY\n#ifdef CUSTOMUSERLIGHTING\ndiffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);\n#ifdef SPECULARTERM\nspecularBase+=computeCustomSpecularLighting(info,specularBase,shadow);\n#endif\n#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\ndiffuseBase+=lightmapColor*shadow;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nspecularBase+=info.specular*shadow*lightmapColor;\n#endif\n#endif\n#else\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthFragment'] = "#ifdef LOGARITHMICDEPTH\ngl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragment'] = "#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif";
BABYLON.Effect.IncludesShadersStore['pbrVertexDeclaration'] = "uniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef ALBEDO\nuniform mat4 albedoMatrix;\nuniform vec2 vAlbedoInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec3 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#ifdef REFLECTIVITY \nuniform vec3 vReflectivityInfos;\nuniform mat4 reflectivityMatrix;\n#endif\n#ifdef MICROSURFACEMAP\nuniform vec2 vMicroSurfaceSamplerInfos;\nuniform mat4 microSurfaceSamplerMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\nuniform mat4 refractionMatrix;\nuniform vec3 vRefractionMicrosurfaceInfos;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\nuniform mat4 reflectionMatrix;\nuniform vec3 vReflectionMicrosurfaceInfos;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['pbrFragmentDeclaration'] = "uniform vec3 vReflectionColor;\nuniform vec4 vAlbedoColor;\n\nuniform vec4 vLightingIntensity;\nuniform vec4 vReflectivityColor;\nuniform vec3 vEmissiveColor;\n\n#ifdef ALBEDO\nuniform vec2 vAlbedoInfos;\n#endif\n#ifdef AMBIENT\nuniform vec3 vAmbientInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef REFLECTIVITY\nuniform vec3 vReflectivityInfos;\n#endif\n#ifdef MICROSURFACEMAP\nuniform vec2 vMicroSurfaceSamplerInfos;\n#endif\n\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\nuniform mat4 refractionMatrix;\nuniform vec3 vRefractionMicrosurfaceInfos;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\nuniform mat4 reflectionMatrix;\nuniform vec3 vReflectionMicrosurfaceInfos;\n#endif";
BABYLON.Effect.IncludesShadersStore['pbrUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nuniform vec2 vAlbedoInfos;\nuniform vec3 vAmbientInfos;\nuniform vec2 vOpacityInfos;\nuniform vec2 vEmissiveInfos;\nuniform vec2 vLightmapInfos;\nuniform vec3 vReflectivityInfos;\nuniform vec2 vMicroSurfaceSamplerInfos;\nuniform vec4 vRefractionInfos;\nuniform vec2 vReflectionInfos;\nuniform vec3 vBumpInfos;\nuniform mat4 albedoMatrix;\nuniform mat4 ambientMatrix;\nuniform mat4 opacityMatrix;\nuniform mat4 emissiveMatrix;\nuniform mat4 lightmapMatrix;\nuniform mat4 reflectivityMatrix;\nuniform mat4 microSurfaceSamplerMatrix;\nuniform mat4 bumpMatrix;\nuniform vec2 vTangentSpaceParams;\nuniform mat4 refractionMatrix;\nuniform mat4 reflectionMatrix;\nuniform vec3 vReflectionColor;\nuniform vec4 vAlbedoColor;\nuniform vec4 vLightingIntensity;\nuniform vec3 vRefractionMicrosurfaceInfos;\nuniform vec3 vReflectionMicrosurfaceInfos;\nuniform vec4 vReflectivityColor;\nuniform vec3 vEmissiveColor;\nuniform float pointSize;\n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['pbrFunctions'] = "\n#define RECIPROCAL_PI2 0.15915494\n#define FRESNEL_MAXIMUM_ON_ROUGH 0.25\n\nconst float kRougnhessToAlphaScale=0.1;\nconst float kRougnhessToAlphaOffset=0.29248125;\nfloat convertRoughnessToAverageSlope(float roughness)\n{\n\nconst float kMinimumVariance=0.0005;\nfloat alphaG=square(roughness)+kMinimumVariance;\nreturn alphaG;\n}\n\nfloat smithVisibilityG1_TrowbridgeReitzGGX(float dot,float alphaG)\n{\nfloat tanSquared=(1.0-dot*dot)/(dot*dot);\nreturn 2.0/(1.0+sqrt(1.0+alphaG*alphaG*tanSquared));\n}\nfloat smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL,float NdotV,float alphaG)\n{\nreturn smithVisibilityG1_TrowbridgeReitzGGX(NdotL,alphaG)*smithVisibilityG1_TrowbridgeReitzGGX(NdotV,alphaG);\n}\n\n\nfloat normalDistributionFunction_TrowbridgeReitzGGX(float NdotH,float alphaG)\n{\n\n\n\nfloat a2=square(alphaG);\nfloat d=NdotH*NdotH*(a2-1.0)+1.0;\nreturn a2/(PI*d*d);\n}\nvec3 fresnelSchlickGGX(float VdotH,vec3 reflectance0,vec3 reflectance90)\n{\nreturn reflectance0+(reflectance90-reflectance0)*pow(clamp(1.0-VdotH,0.,1.),5.0);\n}\nvec3 fresnelSchlickEnvironmentGGX(float VdotN,vec3 reflectance0,vec3 reflectance90,float smoothness)\n{\n\nfloat weight=mix(FRESNEL_MAXIMUM_ON_ROUGH,1.0,smoothness);\nreturn reflectance0+weight*(reflectance90-reflectance0)*pow(clamp(1.0-VdotN,0.,1.),5.0);\n}\n\nvec3 computeSpecularTerm(float NdotH,float NdotL,float NdotV,float VdotH,float roughness,vec3 reflectance0,vec3 reflectance90)\n{\nfloat alphaG=convertRoughnessToAverageSlope(roughness);\nfloat distribution=normalDistributionFunction_TrowbridgeReitzGGX(NdotH,alphaG);\nfloat visibility=smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL,NdotV,alphaG);\nvisibility/=(4.0*NdotL*NdotV); \nfloat specTerm=max(0.,visibility*distribution)*NdotL;\nvec3 fresnel=fresnelSchlickGGX(VdotH,reflectance0,reflectance90);\nreturn fresnel*specTerm;\n}\nfloat computeDiffuseTerm(float NdotL,float NdotV,float VdotH,float roughness)\n{\n\n\nfloat diffuseFresnelNV=pow(clamp(1.0-NdotL,0.000001,1.),5.0);\nfloat diffuseFresnelNL=pow(clamp(1.0-NdotV,0.000001,1.),5.0);\nfloat diffuseFresnel90=0.5+2.0*VdotH*VdotH*roughness;\nfloat fresnel =\n(1.0+(diffuseFresnel90-1.0)*diffuseFresnelNL) *\n(1.0+(diffuseFresnel90-1.0)*diffuseFresnelNV);\nreturn fresnel*NdotL/PI;\n}\nfloat adjustRoughnessFromLightProperties(float roughness,float lightRadius,float lightDistance)\n{\n#ifdef USEPHYSICALLIGHTFALLOFF\n\nfloat lightRoughness=lightRadius/lightDistance;\n\nfloat totalRoughness=clamp(lightRoughness+roughness,0.,1.);\nreturn totalRoughness;\n#else\nreturn roughness;\n#endif\n}\nfloat computeDefaultMicroSurface(float microSurface,vec3 reflectivityColor)\n{\nconst float kReflectivityNoAlphaWorkflow_SmoothnessMax=0.95;\nfloat reflectivityLuminance=getLuminance(reflectivityColor);\nfloat reflectivityLuma=sqrt(reflectivityLuminance);\nmicroSurface=reflectivityLuma*kReflectivityNoAlphaWorkflow_SmoothnessMax;\nreturn microSurface;\n}\n\n\nfloat fresnelGrazingReflectance(float reflectance0) {\nfloat reflectance90=clamp(reflectance0*25.0,0.0,1.0);\nreturn reflectance90;\n}\n\n\n#define UNPACK_LOD(x) (1.0-x)*255.0\nfloat getLodFromAlphaG(float cubeMapDimensionPixels,float alphaG,float NdotV) {\nfloat microsurfaceAverageSlope=alphaG;\n\n\n\n\n\n\nmicrosurfaceAverageSlope*=sqrt(abs(NdotV));\nfloat microsurfaceAverageSlopeTexels=microsurfaceAverageSlope*cubeMapDimensionPixels;\nfloat lod=log2(microsurfaceAverageSlopeTexels);\nreturn lod;\n}\nfloat environmentRadianceOcclusion(float ambientOcclusion,float NdotVUnclamped) {\n\n\nfloat temp=NdotVUnclamped+ambientOcclusion;\nreturn clamp(square(temp)-1.0+ambientOcclusion,0.0,1.0);\n}\nfloat environmentHorizonOcclusion(vec3 reflection,vec3 normal) {\n\n#ifdef REFLECTIONMAP_OPPOSITEZ\nreflection.z*=-1.0;\n#endif\nfloat temp=clamp( 1.0+1.1*dot(reflection,normal),0.0,1.0);\nreturn square(temp);\n}";
BABYLON.Effect.IncludesShadersStore['harmonicsFunctions'] = "#ifdef USESPHERICALFROMREFLECTIONMAP\nuniform vec3 vSphericalX;\nuniform vec3 vSphericalY;\nuniform vec3 vSphericalZ;\nuniform vec3 vSphericalXX_ZZ;\nuniform vec3 vSphericalYY_ZZ;\nuniform vec3 vSphericalZZ;\nuniform vec3 vSphericalXY;\nuniform vec3 vSphericalYZ;\nuniform vec3 vSphericalZX;\nvec3 quaternionVectorRotation_ScaledSqrtTwo(vec4 Q,vec3 V){\nvec3 T=cross(Q.xyz,V);\nT+=Q.www*V;\nreturn cross(Q.xyz,T)+V;\n}\nvec3 environmentIrradianceJones(vec3 normal)\n{\n\n\n\n\n\n\n\n\n\nfloat Nx=normal.x;\nfloat Ny=normal.y;\nfloat Nz=normal.z;\nvec3 C1=vSphericalZZ.rgb;\nvec3 Cx=vSphericalX.rgb;\nvec3 Cy=vSphericalY.rgb;\nvec3 Cz=vSphericalZ.rgb;\nvec3 Cxx_zz=vSphericalXX_ZZ.rgb;\nvec3 Cyy_zz=vSphericalYY_ZZ.rgb;\nvec3 Cxy=vSphericalXY.rgb;\nvec3 Cyz=vSphericalYZ.rgb;\nvec3 Czx=vSphericalZX.rgb;\nvec3 a1=Cyy_zz*Ny+Cy;\nvec3 a2=Cyz*Nz+a1;\nvec3 b1=Czx*Nz+Cx;\nvec3 b2=Cxy*Ny+b1;\nvec3 b3=Cxx_zz*Nx+b2;\nvec3 t1=Cz*Nz+C1;\nvec3 t2=a2*Ny+t1;\nvec3 t3=b3*Nx+t2;\nreturn t3;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['pbrLightFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n};\nfloat computeDistanceLightFalloff(vec3 lightOffset,float lightDistanceSquared,float range)\n{ \n#ifdef USEPHYSICALLIGHTFALLOFF\nfloat lightDistanceFalloff=1.0/((lightDistanceSquared+0.001));\n#else\nfloat lightDistanceFalloff=max(0.,1.0-length(lightOffset)/range);\n#endif\nreturn lightDistanceFalloff;\n}\nfloat computeDirectionalLightFalloff(vec3 lightDirection,vec3 directionToLightCenterW,float cosHalfAngle,float exponent)\n{\nfloat falloff=0.0;\n#ifdef USEPHYSICALLIGHTFALLOFF\nconst float kMinusLog2ConeAngleIntensityRatio=6.64385618977; \n\n\n\n\n\nfloat concentrationKappa=kMinusLog2ConeAngleIntensityRatio/(1.0-cosHalfAngle);\n\n\nvec4 lightDirectionSpreadSG=vec4(-lightDirection*concentrationKappa,-concentrationKappa);\nfalloff=exp2(dot(vec4(directionToLightCenterW,1.0),lightDirectionSpreadSG));\n#else\nfloat cosAngle=max(0.000000000000001,dot(-lightDirection,directionToLightCenterW));\nif (cosAngle>=cosHalfAngle)\n{\nfalloff=max(0.,pow(cosAngle,exponent));\n}\n#endif\nreturn falloff;\n}\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float rangeRadius,float roughness,float NdotV,vec3 reflectance0,vec3 reflectance90,out float NdotL) {\nlightingInfo result;\nvec3 lightDirection;\nfloat attenuation=1.0;\nfloat lightDistance;\n\nif (lightData.w == 0.)\n{\nvec3 lightOffset=lightData.xyz-vPositionW;\nfloat lightDistanceSquared=dot(lightOffset,lightOffset);\nattenuation=computeDistanceLightFalloff(lightOffset,lightDistanceSquared,rangeRadius);\nlightDistance=sqrt(lightDistanceSquared);\nlightDirection=normalize(lightOffset);\n}\n\nelse\n{\nlightDistance=length(-lightData.xyz);\nlightDirection=normalize(-lightData.xyz);\n}\n\nroughness=adjustRoughnessFromLightProperties(roughness,rangeRadius,lightDistance);\n\nvec3 H=normalize(viewDirectionW+lightDirection);\nNdotL=clamp(dot(vNormal,lightDirection),0.00000000001,1.0);\nfloat VdotH=clamp(dot(viewDirectionW,H),0.0,1.0);\nfloat diffuseTerm=computeDiffuseTerm(NdotL,NdotV,VdotH,roughness);\nresult.diffuse=diffuseTerm*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nfloat NdotH=clamp(dot(vNormal,H),0.000000000001,1.0);\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,reflectance0,reflectance90);\nresult.specular=specTerm*diffuseColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float rangeRadius,float roughness,float NdotV,vec3 reflectance0,vec3 reflectance90,out float NdotL) {\nlightingInfo result;\nvec3 lightOffset=lightData.xyz-vPositionW;\nvec3 directionToLightCenterW=normalize(lightOffset);\n\nfloat lightDistanceSquared=dot(lightOffset,lightOffset);\nfloat attenuation=computeDistanceLightFalloff(lightOffset,lightDistanceSquared,rangeRadius);\n\nfloat directionalAttenuation=computeDirectionalLightFalloff(lightDirection.xyz,directionToLightCenterW,lightDirection.w,lightData.w);\nattenuation*=directionalAttenuation;\n\nfloat lightDistance=sqrt(lightDistanceSquared);\nroughness=adjustRoughnessFromLightProperties(roughness,rangeRadius,lightDistance);\n\nvec3 H=normalize(viewDirectionW+directionToLightCenterW);\nNdotL=clamp(dot(vNormal,directionToLightCenterW),0.000000000001,1.0);\nfloat VdotH=clamp(dot(viewDirectionW,H),0.0,1.0);\nfloat diffuseTerm=computeDiffuseTerm(NdotL,NdotV,VdotH,roughness);\nresult.diffuse=diffuseTerm*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nfloat NdotH=clamp(dot(vNormal,H),0.000000000001,1.0);\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,reflectance0,reflectance90);\nresult.specular=specTerm*diffuseColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float roughness,float NdotV,vec3 reflectance0,vec3 reflectance90,out float NdotL) {\nlightingInfo result;\n\n\n\nNdotL=dot(vNormal,lightData.xyz)*0.5+0.5;\nresult.diffuse=mix(groundColor,diffuseColor,NdotL);\n#ifdef SPECULARTERM\n\nvec3 lightVectorW=normalize(lightData.xyz);\nvec3 H=normalize(viewDirectionW+lightVectorW);\nfloat NdotH=clamp(dot(vNormal,H),0.000000000001,1.0);\nNdotL=clamp(NdotL,0.000000000001,1.0);\nfloat VdotH=clamp(dot(viewDirectionW,H),0.0,1.0);\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,reflectance0,reflectance90);\nresult.specular=specTerm*diffuseColor;\n#endif\nreturn result;\n}";
(function() {
var EXPORTS = {};EXPORTS['PBRBaseMaterial'] = BABYLON['PBRBaseMaterial'];EXPORTS['PBRBaseSimpleMaterial'] = BABYLON['PBRBaseSimpleMaterial'];EXPORTS['PBRMaterial'] = BABYLON['PBRMaterial'];EXPORTS['PBRMetallicRoughnessMaterial'] = BABYLON['PBRMetallicRoughnessMaterial'];EXPORTS['PBRSpecularGlossinessMaterial'] = BABYLON['PBRSpecularGlossinessMaterial'];
    globalObject["BABYLON"] = globalObject["BABYLON"] || BABYLON;
    module.exports = EXPORTS;
    })();
}