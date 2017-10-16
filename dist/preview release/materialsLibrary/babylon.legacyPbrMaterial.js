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
    var LegacyPBRMaterialDefines = /** @class */ (function (_super) {
        __extends(LegacyPBRMaterialDefines, _super);
        function LegacyPBRMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.ALBEDO = false;
            _this.AMBIENT = false;
            _this.AMBIENTINGRAYSCALE = false;
            _this.OPACITY = false;
            _this.OPACITYRGB = false;
            _this.REFLECTION = false;
            _this.EMISSIVE = false;
            _this.REFLECTIVITY = false;
            _this.BUMP = false;
            _this.PARALLAX = false;
            _this.PARALLAXOCCLUSION = false;
            _this.SPECULAROVERALPHA = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.ALPHAFROMALBEDO = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.SPECULARTERM = false;
            _this.OPACITYFRESNEL = false;
            _this.EMISSIVEFRESNEL = false;
            _this.FRESNEL = false;
            _this.NORMAL = false;
            _this.TANGENT = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.MICROSURFACEFROMREFLECTIVITYMAP = false;
            _this.MICROSURFACEAUTOMATIC = false;
            _this.EMISSIVEASILLUMINATION = false;
            _this.LINKEMISSIVEWITHALBEDO = false;
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
            _this.CAMERATONEMAP = false;
            _this.CAMERACONTRAST = false;
            _this.CAMERACOLORGRADING = false;
            _this.CAMERACOLORCURVES = false;
            _this.OVERLOADEDVALUES = false;
            _this.OVERLOADEDSHADOWVALUES = false;
            _this.USESPHERICALFROMREFLECTIONMAP = false;
            _this.REFRACTION = false;
            _this.REFRACTIONMAP_3D = false;
            _this.LINKREFRACTIONTOTRANSPARENCY = false;
            _this.REFRACTIONMAPINLINEARSPACE = false;
            _this.LODBASEDMICROSFURACE = false;
            _this.USEPHYSICALLIGHTFALLOFF = false;
            _this.RADIANCEOVERALPHA = false;
            _this.USEPMREMREFLECTION = false;
            _this.USEPMREMREFRACTION = false;
            _this.TWOSIDEDLIGHTING = false;
            _this.SHADOWFLOAT = false;
            _this.METALLICWORKFLOW = false;
            _this.METALLICMAP = false;
            _this.ROUGHNESSSTOREINMETALMAPALPHA = false;
            _this.ROUGHNESSSTOREINMETALMAPGREEN = false;
            _this.METALLNESSSTOREINMETALMAPBLUE = false;
            _this.AOSTOREINMETALMAPRED = false;
            _this.MICROSURFACEMAP = false;
            _this.MORPHTARGETS = false;
            _this.MORPHTARGETS_NORMAL = false;
            _this.MORPHTARGETS_TANGENT = false;
            _this.NUM_MORPH_INFLUENCERS = 0;
            _this.rebuild();
            return _this;
        }
        return LegacyPBRMaterialDefines;
    }(BABYLON.MaterialDefines));
    /**
     * The Physically based material of BJS.
     *
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation :
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    var LegacyPBRMaterial = /** @class */ (function (_super) {
        __extends(LegacyPBRMaterial, _super);
        /**
         * Instantiates a new PBRMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        function LegacyPBRMaterial(name, scene) {
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
            _this._lightingInfos = new BABYLON.Vector4(_this.directIntensity, _this.emissiveIntensity, _this.environmentIntensity, _this.specularIntensity);
            /**
             * Debug Control allowing disabling the bump map on this material.
             */
            _this.disableBumpMap = false;
            /**
             * Debug Control helping enforcing or dropping the darkness of shadows.
             * 1.0 means the shadows have their normal darkness, 0.0 means the shadows are not visible.
             */
            _this.overloadedShadowIntensity = 1.0;
            /**
             * Debug Control helping dropping the shading effect coming from the diffuse lighting.
             * 1.0 means the shade have their normal impact, 0.0 means no shading at all.
             */
            _this.overloadedShadeIntensity = 1.0;
            _this._overloadedShadowInfos = new BABYLON.Vector4(_this.overloadedShadowIntensity, _this.overloadedShadeIntensity, 0.0, 0.0);
            /**
             * The camera exposure used on this material.
             * This property is here and not in the camera to allow controlling exposure without full screen post process.
             * This corresponds to a photographic exposure.
             */
            _this.cameraExposure = 1.0;
            /**
             * The camera contrast used on this material.
             * This property is here and not in the camera to allow controlling contrast without full screen post process.
             */
            _this.cameraContrast = 1.0;
            /**
             * Color Grading 2D Lookup Texture.
             * This allows special effects like sepia, black and white to sixties rendering style.
             */
            _this.cameraColorGradingTexture = null;
            /**
             * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
             * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
             * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
             * corresponding to low luminance, medium luminance, and high luminance areas respectively.
             */
            _this.cameraColorCurves = null;
            _this._cameraInfos = new BABYLON.Vector4(1.0, 1.0, 0.0, 0.0);
            _this._microsurfaceTextureLods = new BABYLON.Vector2(0.0, 0.0);
            /**
             * Debug Control allowing to overload the ambient color.
             * This as to be use with the overloadedAmbientIntensity parameter.
             */
            _this.overloadedAmbient = BABYLON.Color3.White();
            /**
             * Debug Control indicating how much the overloaded ambient color is used against the default one.
             */
            _this.overloadedAmbientIntensity = 0.0;
            /**
             * Debug Control allowing to overload the albedo color.
             * This as to be use with the overloadedAlbedoIntensity parameter.
             */
            _this.overloadedAlbedo = BABYLON.Color3.White();
            /**
             * Debug Control indicating how much the overloaded albedo color is used against the default one.
             */
            _this.overloadedAlbedoIntensity = 0.0;
            /**
             * Debug Control allowing to overload the reflectivity color.
             * This as to be use with the overloadedReflectivityIntensity parameter.
             */
            _this.overloadedReflectivity = new BABYLON.Color3(0.0, 0.0, 0.0);
            /**
             * Debug Control indicating how much the overloaded reflectivity color is used against the default one.
             */
            _this.overloadedReflectivityIntensity = 0.0;
            /**
             * Debug Control allowing to overload the emissive color.
             * This as to be use with the overloadedEmissiveIntensity parameter.
             */
            _this.overloadedEmissive = BABYLON.Color3.White();
            /**
             * Debug Control indicating how much the overloaded emissive color is used against the default one.
             */
            _this.overloadedEmissiveIntensity = 0.0;
            _this._overloadedIntensity = new BABYLON.Vector4(_this.overloadedAmbientIntensity, _this.overloadedAlbedoIntensity, _this.overloadedReflectivityIntensity, _this.overloadedEmissiveIntensity);
            /**
             * Debug Control allowing to overload the reflection color.
             * This as to be use with the overloadedReflectionIntensity parameter.
             */
            _this.overloadedReflection = BABYLON.Color3.White();
            /**
             * Debug Control indicating how much the overloaded reflection color is used against the default one.
             */
            _this.overloadedReflectionIntensity = 0.0;
            /**
             * Debug Control allowing to overload the microsurface.
             * This as to be use with the overloadedMicroSurfaceIntensity parameter.
             */
            _this.overloadedMicroSurface = 0.0;
            /**
             * Debug Control indicating how much the overloaded microsurface is used against the default one.
             */
            _this.overloadedMicroSurfaceIntensity = 0.0;
            _this._overloadedMicroSurface = new BABYLON.Vector3(_this.overloadedMicroSurface, _this.overloadedMicroSurfaceIntensity, _this.overloadedReflectionIntensity);
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
            _this.reflectionColor = new BABYLON.Color3(0.0, 0.0, 0.0);
            _this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            /**
             * AKA Glossiness in other nomenclature.
             */
            _this.microSurface = 0.9;
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
            /**
             * The emissive and albedo are linked to never be more than one (Energy conservation).
             */
            _this.linkEmissiveWithAlbedo = false;
            _this.useLightmapAsShadowmap = false;
            /**
             * In this mode, the emissive informtaion will always be added to the lighting once.
             * A light for instance can be thought as emissive.
             */
            _this.useEmissiveAsIllumination = false;
            /**
             * Secifies that the alpha is coming form the albedo channel alpha channel.
             */
            _this.useAlphaFromAlbedoTexture = false;
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
             * Allows to work with scalar in linear mode. This is definitely a matter of preferences and tools used during
             * the creation of the material.
             */
            _this.useScalarInLinearSpace = false;
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
            _this._renderTargets = new BABYLON.SmartArray(16);
            _this._globalAmbientColor = new BABYLON.Color3(0, 0, 0);
            _this._tempColor = new BABYLON.Color3();
            _this._defines = new LegacyPBRMaterialDefines();
            _this._cachedDefines = new LegacyPBRMaterialDefines();
            _this._myScene = null;
            _this._cachedDefines.BonesPerMesh = -1;
            _this.getRenderTargetTextures = function () {
                _this._renderTargets.reset();
                if (BABYLON.StandardMaterial.ReflectionTextureEnabled && _this.reflectionTexture && _this.reflectionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this.reflectionTexture);
                }
                if (BABYLON.StandardMaterial.RefractionTextureEnabled && _this.refractionTexture && _this.refractionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this.refractionTexture);
                }
                return _this._renderTargets;
            };
            return _this;
        }
        LegacyPBRMaterial.prototype.getClassName = function () {
            return "LegacyPBRMaterial";
        };
        Object.defineProperty(LegacyPBRMaterial.prototype, "useLogarithmicDepth", {
            get: function () {
                return this._useLogarithmicDepth;
            },
            set: function (value) {
                this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
            },
            enumerable: true,
            configurable: true
        });
        LegacyPBRMaterial.prototype.needAlphaBlending = function () {
            if (this.linkRefractionWithTransparency) {
                return false;
            }
            return (this.alpha < 1.0) || (this.opacityTexture != null) || this._shouldUseAlphaFromAlbedoTexture() || this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled;
        };
        LegacyPBRMaterial.prototype.needAlphaTesting = function () {
            if (this.linkRefractionWithTransparency) {
                return false;
            }
            return this.albedoTexture != null && this.albedoTexture.hasAlpha;
        };
        LegacyPBRMaterial.prototype._shouldUseAlphaFromAlbedoTexture = function () {
            return this.albedoTexture != null && this.albedoTexture.hasAlpha && this.useAlphaFromAlbedoTexture;
        };
        LegacyPBRMaterial.prototype.getAlphaTestTexture = function () {
            return this.albedoTexture;
        };
        LegacyPBRMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
            if (!mesh) {
                return true;
            }
            if (this._defines.INSTANCES !== useInstances) {
                return false;
            }
            return false;
        };
        LegacyPBRMaterial.prototype.convertColorToLinearSpaceToRef = function (color, ref) {
            LegacyPBRMaterial.convertColorToLinearSpaceToRef(color, ref, this.useScalarInLinearSpace);
        };
        LegacyPBRMaterial.convertColorToLinearSpaceToRef = function (color, ref, useScalarInLinear) {
            if (!useScalarInLinear) {
                color.toLinearSpaceToRef(ref);
            }
            else {
                ref.r = color.r;
                ref.g = color.g;
                ref.b = color.b;
            }
        };
        LegacyPBRMaterial.BindLights = function (scene, mesh, effect, defines, useScalarInLinearSpace, maxSimultaneousLights, usePhysicalLightFalloff) {
            var lightIndex = 0;
            for (var _i = 0, _a = mesh._lightSources; _i < _a.length; _i++) {
                var light = _a[_i];
                var useUbo = light._uniformBuffer.useUbo;
                light._uniformBuffer.bindToEffect(effect, "Light" + lightIndex);
                BABYLON.MaterialHelper.BindLightProperties(light, effect, lightIndex);
                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(light.diffuse, LegacyPBRMaterial._scaledAlbedo, useScalarInLinearSpace);
                LegacyPBRMaterial._scaledAlbedo.scaleToRef(light.intensity, LegacyPBRMaterial._scaledAlbedo);
                light._uniformBuffer.updateColor4(useUbo ? "vLightDiffuse" : "vLightDiffuse" + lightIndex, LegacyPBRMaterial._scaledAlbedo, usePhysicalLightFalloff ? light.radius : light.range);
                if (defines["SPECULARTERM"]) {
                    this.convertColorToLinearSpaceToRef(light.specular, LegacyPBRMaterial._scaledReflectivity, useScalarInLinearSpace);
                    LegacyPBRMaterial._scaledReflectivity.scaleToRef(light.intensity, LegacyPBRMaterial._scaledReflectivity);
                    light._uniformBuffer.updateColor3(useUbo ? "vLightSpecular" : "vLightSpecular" + lightIndex, LegacyPBRMaterial._scaledReflectivity);
                }
                // Shadows
                if (scene.shadowsEnabled) {
                    BABYLON.MaterialHelper.BindLightShadow(light, scene, mesh, lightIndex + "", effect);
                }
                light._uniformBuffer.update();
                lightIndex++;
                if (lightIndex === maxSimultaneousLights)
                    break;
            }
        };
        LegacyPBRMaterial.prototype.isReady = function (mesh, useInstances) {
            var _this = this;
            if (this.isFrozen) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }
            var scene = this.getScene();
            var engine = scene.getEngine();
            var needUVs = false;
            this._defines.reset();
            if (scene.lightsEnabled && !this.disableLighting) {
                BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines, true, this.maxSimultaneousLights);
            }
            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                    if (this._checkCache(scene, mesh, useInstances)) {
                        return true;
                    }
                }
            }
            if (scene.texturesEnabled) {
                if (scene.getEngine().getCaps().textureLOD) {
                    this._defines.LODBASEDMICROSFURACE = true;
                }
                if (this.albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.albedoTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.ALBEDO = true;
                }
                if (this.ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                    if (!this.ambientTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.AMBIENT = true;
                    this._defines.AMBIENTINGRAYSCALE = this.useAmbientInGrayScale;
                }
                if (this.opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                    if (!this.opacityTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.OPACITY = true;
                    if (this.opacityTexture.getAlphaFromRGB) {
                        this._defines.OPACITYRGB = true;
                    }
                }
                if (this.reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                    if (!this.reflectionTexture.isReady()) {
                        return false;
                    }
                    this._defines.REFLECTION = true;
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
                        case BABYLON.Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                            this._defines.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = true;
                            break;
                    }
                    if (this.reflectionTexture instanceof BABYLON.HDRCubeTexture && this.reflectionTexture) {
                        this._defines.USESPHERICALFROMREFLECTIONMAP = true;
                        if (this.reflectionTexture.isPMREM) {
                            this._defines.USEPMREMREFLECTION = true;
                        }
                    }
                }
                if (this.lightmapTexture && BABYLON.StandardMaterial.LightmapTextureEnabled) {
                    if (!this.lightmapTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.LIGHTMAP = true;
                    this._defines.USELIGHTMAPASSHADOWMAP = this.useLightmapAsShadowmap;
                }
                if (this.emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                    if (!this.emissiveTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.EMISSIVE = true;
                }
                if (BABYLON.StandardMaterial.SpecularTextureEnabled) {
                    if (this.metallicTexture) {
                        if (!this.metallicTexture.isReady()) {
                            return false;
                        }
                        needUVs = true;
                        this._defines.METALLICWORKFLOW = true;
                        this._defines.METALLICMAP = true;
                        this._defines.ROUGHNESSSTOREINMETALMAPALPHA = this.useRoughnessFromMetallicTextureAlpha;
                        this._defines.ROUGHNESSSTOREINMETALMAPGREEN = !this.useRoughnessFromMetallicTextureAlpha && this.useRoughnessFromMetallicTextureGreen;
                        this._defines.METALLNESSSTOREINMETALMAPBLUE = this.useMetallnessFromMetallicTextureBlue;
                        this._defines.AOSTOREINMETALMAPRED = this.useAmbientOcclusionFromMetallicTextureRed;
                    }
                    else if (this.reflectivityTexture) {
                        if (!this.reflectivityTexture.isReady()) {
                            return false;
                        }
                        needUVs = true;
                        this._defines.REFLECTIVITY = true;
                        this._defines.MICROSURFACEFROMREFLECTIVITYMAP = this.useMicroSurfaceFromReflectivityMapAlpha;
                        this._defines.MICROSURFACEAUTOMATIC = this.useAutoMicroSurfaceFromReflectivityMap;
                    }
                    if (this.microSurfaceTexture) {
                        if (!this.microSurfaceTexture.isReady()) {
                            return false;
                        }
                        needUVs = true;
                        this._defines.MICROSURFACEMAP = true;
                    }
                }
                if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                    if (!this.bumpTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.BUMP = true;
                    if (this.useParallax && this.albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        this._defines.PARALLAX = true;
                        if (this.useParallaxOcclusion) {
                            this._defines.PARALLAXOCCLUSION = true;
                        }
                    }
                }
                if (this.refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                    if (!this.refractionTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.REFRACTION = true;
                    this._defines.REFRACTIONMAP_3D = this.refractionTexture.isCube;
                    if (this.linkRefractionWithTransparency) {
                        this._defines.LINKREFRACTIONTOTRANSPARENCY = true;
                    }
                    if (this.refractionTexture instanceof BABYLON.HDRCubeTexture) {
                        this._defines.REFRACTIONMAPINLINEARSPACE = true;
                        if (this.refractionTexture.isPMREM) {
                            this._defines.USEPMREMREFRACTION = true;
                        }
                    }
                }
                if (this.cameraColorGradingTexture && BABYLON.StandardMaterial.ColorGradingTextureEnabled) {
                    if (!this.cameraColorGradingTexture.isReady()) {
                        return false;
                    }
                    this._defines.CAMERACOLORGRADING = true;
                }
                if (!this.backFaceCulling && this.twoSidedLighting) {
                    this._defines.TWOSIDEDLIGHTING = true;
                }
            }
            // Effect
            if (scene.clipPlane) {
                this._defines.CLIPPLANE = true;
            }
            if (engine.getAlphaTesting()) {
                this._defines.ALPHATEST = true;
            }
            if (this._shouldUseAlphaFromAlbedoTexture()) {
                this._defines.ALPHAFROMALBEDO = true;
            }
            if (this.useEmissiveAsIllumination) {
                this._defines.EMISSIVEASILLUMINATION = true;
            }
            if (this.linkEmissiveWithAlbedo) {
                this._defines.LINKEMISSIVEWITHALBEDO = true;
            }
            if (this.useLogarithmicDepth) {
                this._defines.LOGARITHMICDEPTH = true;
            }
            if (this.cameraContrast != 1) {
                this._defines.CAMERACONTRAST = true;
            }
            if (this.cameraExposure != 1) {
                this._defines.CAMERATONEMAP = true;
            }
            if (this.cameraColorCurves) {
                this._defines.CAMERACOLORCURVES = true;
            }
            if (this.overloadedShadeIntensity != 1 ||
                this.overloadedShadowIntensity != 1) {
                this._defines.OVERLOADEDSHADOWVALUES = true;
            }
            if (this.overloadedMicroSurfaceIntensity > 0 ||
                this.overloadedEmissiveIntensity > 0 ||
                this.overloadedReflectivityIntensity > 0 ||
                this.overloadedAlbedoIntensity > 0 ||
                this.overloadedAmbientIntensity > 0 ||
                this.overloadedReflectionIntensity > 0) {
                this._defines.OVERLOADEDVALUES = true;
            }
            // Point size
            if (this.pointsCloud || scene.forcePointsCloud) {
                this._defines.POINTSIZE = true;
            }
            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }
            if (BABYLON.StandardMaterial.FresnelEnabled) {
                // Fresnel
                if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled ||
                    this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        this._defines.OPACITYFRESNEL = true;
                    }
                    if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                        this._defines.EMISSIVEFRESNEL = true;
                    }
                    this._defines.FRESNEL = true;
                }
            }
            if (this._defines.SPECULARTERM && this.useSpecularOverAlpha) {
                this._defines.SPECULAROVERALPHA = true;
            }
            if (this.usePhysicalLightFalloff) {
                this._defines.USEPHYSICALLIGHTFALLOFF = true;
            }
            if (this.useRadianceOverAlpha) {
                this._defines.RADIANCEOVERALPHA = true;
            }
            if ((this.metallic !== undefined && this.metallic !== null) || (this.roughness !== undefined && this.roughness !== null)) {
                this._defines.METALLICWORKFLOW = true;
            }
            // Attribs
            if (mesh) {
                if (!scene.getEngine().getCaps().standardDerivatives && !mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                    mesh.createNormals(true);
                    BABYLON.Tools.Warn("PBRMaterial: Normals have been created for the mesh: " + mesh.name);
                }
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.TangentKind)) {
                        this._defines.TANGENT = true;
                    }
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
                if (mesh.morphTargetManager) {
                    var manager = mesh.morphTargetManager;
                    this._defines.MORPHTARGETS_TANGENT = manager.supportsTangents && this._defines.TANGENT;
                    this._defines.MORPHTARGETS_NORMAL = manager.supportsNormals && this._defines.NORMAL;
                    this._defines.MORPHTARGETS = (manager.numInfluencers > 0);
                    this._defines.NUM_MORPH_INFLUENCERS = manager.numInfluencers;
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
                if (this._defines.REFRACTION) {
                    fallbacks.addFallback(0, "REFRACTION");
                }
                if (this._defines.REFLECTIVITY) {
                    fallbacks.addFallback(0, "REFLECTIVITY");
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
                if (this._defines.OPACITYFRESNEL) {
                    fallbacks.addFallback(1, "OPACITYFRESNEL");
                }
                if (this._defines.EMISSIVEFRESNEL) {
                    fallbacks.addFallback(2, "EMISSIVEFRESNEL");
                }
                if (this._defines.FRESNEL) {
                    fallbacks.addFallback(3, "FRESNEL");
                }
                if (this._defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (this._defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (this._defines.TANGENT) {
                    attribs.push(BABYLON.VertexBuffer.TangentKind);
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
                BABYLON.MaterialHelper.PrepareAttributesForMorphTargets(attribs, mesh, this._defines);
                // Legacy browser patch
                var join = this._defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vAlbedoColor", "vReflectivityColor", "vEmissiveColor", "vReflectionColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vAlbedoInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vReflectivityInfos", "vMicroSurfaceSamplerInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                    "mBones",
                    "vClipPlane", "albedoMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "reflectivityMatrix", "microSurfaceSamplerMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                    "opacityParts", "emissiveLeftColor", "emissiveRightColor",
                    "vLightingIntensity", "vOverloadedShadowIntensity", "vOverloadedIntensity", "vOverloadedAlbedo", "vOverloadedReflection", "vOverloadedReflectivity", "vOverloadedEmissive", "vOverloadedMicroSurface",
                    "logarithmicDepthConstant",
                    "vSphericalX", "vSphericalY", "vSphericalZ",
                    "vSphericalXX", "vSphericalYY", "vSphericalZZ",
                    "vSphericalXY", "vSphericalYZ", "vSphericalZX",
                    "vMicrosurfaceTextureLods",
                    "vCameraInfos", "vTangentSpaceParams"
                ];
                var samplers = ["albedoSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "reflectivitySampler", "microSurfaceSampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler"];
                var uniformBuffers = ["Material", "Scene"];
                if (this._defines.CAMERACOLORCURVES) {
                    BABYLON.ColorCurves.PrepareUniforms(uniforms);
                }
                if (this._defines.CAMERACOLORGRADING) {
                    uniforms.push("vCameraColorGradingInfos", "vCameraColorGradingScaleOffset");
                    samplers.push("cameraColorGrading2DSampler");
                }
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList({
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: this._defines,
                    maxSimultaneousLights: this.maxSimultaneousLights
                });
                var onCompiled = function (effect) {
                    if (_this.onCompiled) {
                        _this.onCompiled(effect);
                    }
                    _this.bindSceneUniformBuffer(effect, scene.getSceneUniformBuffer());
                };
                this._effect = scene.getEngine().createEffect("legacyPbr", {
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights, maxSimultaneousMorphTargets: this._defines.NUM_MORPH_INFLUENCERS }
                }, engine);
                this.buildUniformLayout();
            }
            if (!this._effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        LegacyPBRMaterial.prototype.buildUniformLayout = function () {
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
            this._uniformBuffer.addUniform("vMicrosurfaceTextureLods", 2);
            this._uniformBuffer.addUniform("vReflectivityColor", 4);
            this._uniformBuffer.addUniform("vEmissiveColor", 3);
            this._uniformBuffer.addUniform("opacityParts", 4);
            this._uniformBuffer.addUniform("emissiveLeftColor", 4);
            this._uniformBuffer.addUniform("emissiveRightColor", 4);
            this._uniformBuffer.addUniform("vOverloadedIntensity", 4);
            this._uniformBuffer.addUniform("vOverloadedAmbient", 3);
            this._uniformBuffer.addUniform("vOverloadedAlbedo", 3);
            this._uniformBuffer.addUniform("vOverloadedReflectivity", 3);
            this._uniformBuffer.addUniform("vOverloadedEmissive", 3);
            this._uniformBuffer.addUniform("vOverloadedReflection", 3);
            this._uniformBuffer.addUniform("vOverloadedMicroSurface", 3);
            this._uniformBuffer.addUniform("vOverloadedShadowIntensity", 4);
            this._uniformBuffer.addUniform("pointSize", 1);
            this._uniformBuffer.create();
        };
        LegacyPBRMaterial.prototype.unbind = function () {
            if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("reflection2DSampler", null);
            }
            if (this.refractionTexture && this.refractionTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("refraction2DSampler", null);
            }
            _super.prototype.unbind.call(this);
        };
        LegacyPBRMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        LegacyPBRMaterial.prototype.bind = function (world, mesh) {
            this._myScene = this.getScene();
            var effect = this._effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._effect);
            if (this._myScene.getCachedMaterial() !== this) {
                this._uniformBuffer.bindToEffect(effect, "Material");
                this.bindViewProjection(effect);
                if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync) {
                    // Fresnel
                    if (BABYLON.StandardMaterial.FresnelEnabled) {
                        if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("opacityParts", new BABYLON.Color3(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power);
                        }
                        if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                            this._uniformBuffer.updateColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                        }
                    }
                    // Texture uniforms      
                    if (this._myScene.texturesEnabled) {
                        if (this.albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vAlbedoInfos", this.albedoTexture.coordinatesIndex, this.albedoTexture.level);
                            this._uniformBuffer.updateMatrix("albedoMatrix", this.albedoTexture.getTextureMatrix());
                        }
                        if (this.ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                            this._uniformBuffer.updateFloat3("vAmbientInfos", this.ambientTexture.coordinatesIndex, this.ambientTexture.level, this.ambientTextureStrength);
                            this._uniformBuffer.updateMatrix("ambientMatrix", this.ambientTexture.getTextureMatrix());
                        }
                        if (this.opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vOpacityInfos", this.opacityTexture.coordinatesIndex, this.opacityTexture.level);
                            this._uniformBuffer.updateMatrix("opacityMatrix", this.opacityTexture.getTextureMatrix());
                        }
                        if (this.reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                            this._microsurfaceTextureLods.x = Math.round(Math.log(this.reflectionTexture.getSize().width) * Math.LOG2E);
                            this._uniformBuffer.updateMatrix("reflectionMatrix", this.reflectionTexture.getReflectionTextureMatrix());
                            this._uniformBuffer.updateFloat2("vReflectionInfos", this.reflectionTexture.level, 0);
                            if (this._defines.USESPHERICALFROMREFLECTIONMAP) {
                                var polynomials = this.reflectionTexture.sphericalPolynomial;
                                this._effect.setFloat3("vSphericalX", polynomials.x.x, polynomials.x.y, polynomials.x.z);
                                this._effect.setFloat3("vSphericalY", polynomials.y.x, polynomials.y.y, polynomials.y.z);
                                this._effect.setFloat3("vSphericalZ", polynomials.z.x, polynomials.z.y, polynomials.z.z);
                                this._effect.setFloat3("vSphericalXX_ZZ", polynomials.xx.x - polynomials.zz.x, polynomials.xx.y - polynomials.zz.y, polynomials.xx.z - polynomials.zz.z);
                                this._effect.setFloat3("vSphericalYY_ZZ", polynomials.yy.x - polynomials.zz.x, polynomials.yy.y - polynomials.zz.y, polynomials.yy.z - polynomials.zz.z);
                                this._effect.setFloat3("vSphericalZZ", polynomials.zz.x, polynomials.zz.y, polynomials.zz.z);
                                this._effect.setFloat3("vSphericalXY", polynomials.xy.x, polynomials.xy.y, polynomials.xy.z);
                                this._effect.setFloat3("vSphericalYZ", polynomials.yz.x, polynomials.yz.y, polynomials.yz.z);
                                this._effect.setFloat3("vSphericalZX", polynomials.zx.x, polynomials.zx.y, polynomials.zx.z);
                            }
                        }
                        if (this.emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
                            this._uniformBuffer.updateMatrix("emissiveMatrix", this.emissiveTexture.getTextureMatrix());
                        }
                        if (this.lightmapTexture && BABYLON.StandardMaterial.LightmapTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vLightmapInfos", this.lightmapTexture.coordinatesIndex, this.lightmapTexture.level);
                            this._uniformBuffer.updateMatrix("lightmapMatrix", this.lightmapTexture.getTextureMatrix());
                        }
                        if (BABYLON.StandardMaterial.SpecularTextureEnabled) {
                            if (this.metallicTexture) {
                                this._uniformBuffer.updateFloat3("vReflectivityInfos", this.metallicTexture.coordinatesIndex, this.metallicTexture.level, this.ambientTextureStrength);
                                this._uniformBuffer.updateMatrix("reflectivityMatrix", this.metallicTexture.getTextureMatrix());
                            }
                            else if (this.reflectivityTexture) {
                                this._uniformBuffer.updateFloat3("vReflectivityInfos", this.reflectivityTexture.coordinatesIndex, this.reflectivityTexture.level, 1.0);
                                this._uniformBuffer.updateMatrix("reflectivityMatrix", this.reflectivityTexture.getTextureMatrix());
                            }
                            if (this.microSurfaceTexture) {
                                this._uniformBuffer.updateFloat2("vMicroSurfaceSamplerInfos", this.microSurfaceTexture.coordinatesIndex, this.microSurfaceTexture.level);
                                this._uniformBuffer.updateMatrix("microSurfaceSamplerMatrix", this.microSurfaceTexture.getTextureMatrix());
                            }
                        }
                        if (this.bumpTexture && this._myScene.getEngine().getCaps().standardDerivatives && BABYLON.StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                            this._uniformBuffer.updateFloat3("vBumpInfos", this.bumpTexture.coordinatesIndex, 1.0 / this.bumpTexture.level, this.parallaxScaleBias);
                            this._uniformBuffer.updateMatrix("bumpMatrix", this.bumpTexture.getTextureMatrix());
                            if (this._myScene._mirroredCameraPosition) {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this.invertNormalMapX ? 1.0 : -1.0, this.invertNormalMapY ? 1.0 : -1.0);
                            }
                            else {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this.invertNormalMapX ? -1.0 : 1.0, this.invertNormalMapY ? -1.0 : 1.0);
                            }
                        }
                        if (this.refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                            this._microsurfaceTextureLods.y = Math.round(Math.log(this.refractionTexture.getSize().width) * Math.LOG2E);
                            var depth = 1.0;
                            if (!this.refractionTexture.isCube) {
                                this._uniformBuffer.updateMatrix("refractionMatrix", this.refractionTexture.getReflectionTextureMatrix());
                                if (this.refractionTexture.depth) {
                                    depth = this.refractionTexture.depth;
                                }
                            }
                            this._uniformBuffer.updateFloat4("vRefractionInfos", this.refractionTexture.level, this.indexOfRefraction, depth, this.invertRefractionY ? -1 : 1);
                        }
                        if ((this.reflectionTexture || this.refractionTexture)) {
                            this._uniformBuffer.updateFloat2("vMicrosurfaceTextureLods", this._microsurfaceTextureLods.x, this._microsurfaceTextureLods.y);
                        }
                    }
                    // Point size
                    if (this.pointsCloud) {
                        this._uniformBuffer.updateFloat("pointSize", this.pointSize);
                    }
                    // Colors
                    if (this._defines.METALLICWORKFLOW) {
                        LegacyPBRMaterial._scaledReflectivity.r = (this.metallic === undefined || this.metallic === null) ? 1 : this.metallic;
                        LegacyPBRMaterial._scaledReflectivity.g = (this.roughness === undefined || this.roughness === null) ? 1 : this.roughness;
                        this._uniformBuffer.updateColor4("vReflectivityColor", LegacyPBRMaterial._scaledReflectivity, 0);
                    }
                    else {
                        // GAMMA CORRECTION.
                        this.convertColorToLinearSpaceToRef(this.reflectivityColor, LegacyPBRMaterial._scaledReflectivity);
                        this._uniformBuffer.updateColor4("vReflectivityColor", LegacyPBRMaterial._scaledReflectivity, this.microSurface);
                    }
                    // GAMMA CORRECTION.
                    this.convertColorToLinearSpaceToRef(this.emissiveColor, LegacyPBRMaterial._scaledEmissive);
                    this._uniformBuffer.updateColor3("vEmissiveColor", LegacyPBRMaterial._scaledEmissive);
                    // GAMMA CORRECTION.
                    this.convertColorToLinearSpaceToRef(this.reflectionColor, LegacyPBRMaterial._scaledReflection);
                    this._uniformBuffer.updateColor3("vReflectionColor", LegacyPBRMaterial._scaledReflection);
                    // GAMMA CORRECTION.
                    this.convertColorToLinearSpaceToRef(this.albedoColor, LegacyPBRMaterial._scaledAlbedo);
                    this._uniformBuffer.updateColor4("vAlbedoColor", LegacyPBRMaterial._scaledAlbedo, this.alpha * mesh.visibility);
                    // Misc
                    this._lightingInfos.x = this.directIntensity;
                    this._lightingInfos.y = this.emissiveIntensity;
                    this._lightingInfos.z = this.environmentIntensity;
                    this._lightingInfos.w = this.specularIntensity;
                    this._uniformBuffer.updateVector4("vLightingIntensity", this._lightingInfos);
                    // Overloaded params
                    this._overloadedShadowInfos.x = this.overloadedShadowIntensity;
                    this._overloadedShadowInfos.y = this.overloadedShadeIntensity;
                    this._uniformBuffer.updateVector4("vOverloadedShadowIntensity", this._overloadedShadowInfos);
                    this._overloadedIntensity.x = this.overloadedAmbientIntensity;
                    this._overloadedIntensity.y = this.overloadedAlbedoIntensity;
                    this._overloadedIntensity.z = this.overloadedReflectivityIntensity;
                    this._overloadedIntensity.w = this.overloadedEmissiveIntensity;
                    this._uniformBuffer.updateVector4("vOverloadedIntensity", this._overloadedIntensity);
                    this._uniformBuffer.updateColor3("vOverloadedAmbient", this.overloadedAmbient);
                    this.convertColorToLinearSpaceToRef(this.overloadedAlbedo, this._tempColor);
                    this._uniformBuffer.updateColor3("vOverloadedAlbedo", this._tempColor);
                    this.convertColorToLinearSpaceToRef(this.overloadedReflectivity, this._tempColor);
                    this._uniformBuffer.updateColor3("vOverloadedReflectivity", this._tempColor);
                    this.convertColorToLinearSpaceToRef(this.overloadedEmissive, this._tempColor);
                    this._uniformBuffer.updateColor3("vOverloadedEmissive", this._tempColor);
                    this.convertColorToLinearSpaceToRef(this.overloadedReflection, this._tempColor);
                    this._uniformBuffer.updateColor3("vOverloadedReflection", this._tempColor);
                    this._overloadedMicroSurface.x = this.overloadedMicroSurface;
                    this._overloadedMicroSurface.y = this.overloadedMicroSurfaceIntensity;
                    this._overloadedMicroSurface.z = this.overloadedReflectionIntensity;
                    this._uniformBuffer.updateVector3("vOverloadedMicroSurface", this._overloadedMicroSurface);
                }
                // Textures        
                if (this._myScene.texturesEnabled) {
                    if (this.albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        this._uniformBuffer.setTexture("albedoSampler", this.albedoTexture);
                    }
                    if (this.ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                        this._uniformBuffer.setTexture("ambientSampler", this.ambientTexture);
                    }
                    if (this.opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                        this._uniformBuffer.setTexture("opacitySampler", this.opacityTexture);
                    }
                    if (this.reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                        if (this.reflectionTexture.isCube) {
                            this._uniformBuffer.setTexture("reflectionCubeSampler", this.reflectionTexture);
                        }
                        else {
                            this._uniformBuffer.setTexture("reflection2DSampler", this.reflectionTexture);
                        }
                    }
                    if (this.emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                        this._uniformBuffer.setTexture("emissiveSampler", this.emissiveTexture);
                    }
                    if (this.lightmapTexture && BABYLON.StandardMaterial.LightmapTextureEnabled) {
                        this._uniformBuffer.setTexture("lightmapSampler", this.lightmapTexture);
                    }
                    if (BABYLON.StandardMaterial.SpecularTextureEnabled) {
                        if (this.metallicTexture) {
                            this._uniformBuffer.setTexture("reflectivitySampler", this.metallicTexture);
                        }
                        else if (this.reflectivityTexture) {
                            this._uniformBuffer.setTexture("reflectivitySampler", this.reflectivityTexture);
                        }
                        if (this.microSurfaceTexture) {
                            this._uniformBuffer.setTexture("microSurfaceSampler", this.microSurfaceTexture);
                        }
                    }
                    if (this.bumpTexture && this._myScene.getEngine().getCaps().standardDerivatives && BABYLON.StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                        this._uniformBuffer.setTexture("bumpSampler", this.bumpTexture);
                    }
                    if (this.refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                        if (this.refractionTexture.isCube) {
                            this._uniformBuffer.setTexture("refractionCubeSampler", this.refractionTexture);
                        }
                        else {
                            this._uniformBuffer.setTexture("refraction2DSampler", this.refractionTexture);
                        }
                    }
                    if (this.cameraColorGradingTexture && BABYLON.StandardMaterial.ColorGradingTextureEnabled) {
                        this._effect.setTexture("cameraColorGrading2DSampler", this.cameraColorGradingTexture);
                        var x = this.cameraColorGradingTexture.level; // Texture Level
                        var y = this.cameraColorGradingTexture.getSize().height; // Texture Size example with 8
                        var z = y - 1.0; // SizeMinusOne 8 - 1
                        var w = 1 / y; // Space of 1 slice 1 / 8
                        this._effect.setFloat4("vCameraColorGradingInfos", x, y, z, w);
                        var slicePixelSizeU = w / y; // Space of 1 pixel in U direction, e.g. 1/64
                        var slicePixelSizeV = w; // Space of 1 pixel in V direction, e.g. 1/8					    // Space of 1 pixel in V direction, e.g. 1/8
                        var x2 = z * slicePixelSizeU; // Extent of lookup range in U for a single slice so that range corresponds to (size-1) texels, for example 7/64
                        var y2 = z / y; // Extent of lookup range in V for a single slice so that range corresponds to (size-1) texels, for example 7/8
                        var z2 = 0.5 * slicePixelSizeU; // Offset of lookup range in U to align sample position with texel centre, for example 0.5/64 
                        var w2 = 0.5 * slicePixelSizeV; // Offset of lookup range in V to align sample position with texel centre, for example 0.5/8
                        this._effect.setFloat4("vCameraColorGradingScaleOffset", x2, y2, z2, w2);
                    }
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._effect, this._myScene);
                // Colors
                this._myScene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);
                effect.setVector3("vEyePosition", this._myScene._mirroredCameraPosition ? this._myScene._mirroredCameraPosition : this._myScene.activeCamera.position);
                effect.setColor3("vAmbientColor", this._globalAmbientColor);
            }
            if (this._myScene.getCachedMaterial() !== this || !this.isFrozen) {
                // Lights
                if (this._myScene.lightsEnabled && !this.disableLighting) {
                    LegacyPBRMaterial.BindLights(this._myScene, mesh, this._effect, this._defines, this.useScalarInLinearSpace, this.maxSimultaneousLights, this.usePhysicalLightFalloff);
                }
                // View
                if (this._myScene.fogEnabled && mesh.applyFog && this._myScene.fogMode !== BABYLON.Scene.FOGMODE_NONE || this.reflectionTexture) {
                    this.bindView(effect);
                }
                // Fog
                BABYLON.MaterialHelper.BindFogParameters(this._myScene, mesh, this._effect);
                // Morph targets
                if (this._defines.NUM_MORPH_INFLUENCERS) {
                    BABYLON.MaterialHelper.BindMorphTargetParameters(mesh, this._effect);
                }
                this._cameraInfos.x = this.cameraExposure;
                this._cameraInfos.y = this.cameraContrast;
                effect.setVector4("vCameraInfos", this._cameraInfos);
                if (this.cameraColorCurves) {
                    BABYLON.ColorCurves.Bind(this.cameraColorCurves, this._effect);
                }
                // Log. depth
                BABYLON.MaterialHelper.BindLogDepth(this._defines, this._effect, this._myScene);
            }
            this._uniformBuffer.update();
            this._afterBind(mesh);
            this._myScene = null;
        };
        LegacyPBRMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.albedoTexture && this.albedoTexture.animations && this.albedoTexture.animations.length > 0) {
                results.push(this.albedoTexture);
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
            if (this.metallicTexture && this.metallicTexture.animations && this.metallicTexture.animations.length > 0) {
                results.push(this.metallicTexture);
            }
            else if (this.reflectivityTexture && this.reflectivityTexture.animations && this.reflectivityTexture.animations.length > 0) {
                results.push(this.reflectivityTexture);
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
        LegacyPBRMaterial.prototype.dispose = function (forceDisposeEffect, forceDisposeTextures) {
            if (forceDisposeTextures) {
                if (this.albedoTexture) {
                    this.albedoTexture.dispose();
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
                if (this.metallicTexture) {
                    this.metallicTexture.dispose();
                }
                if (this.reflectivityTexture) {
                    this.reflectivityTexture.dispose();
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
            this._renderTargets.dispose();
            _super.prototype.dispose.call(this, forceDisposeEffect, forceDisposeTextures);
        };
        LegacyPBRMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new LegacyPBRMaterial(name, _this.getScene()); }, this);
        };
        LegacyPBRMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.LegacyPBRMaterial";
            return serializationObject;
        };
        // Statics
        LegacyPBRMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new LegacyPBRMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        LegacyPBRMaterial._scaledAlbedo = new BABYLON.Color3();
        LegacyPBRMaterial._scaledReflectivity = new BABYLON.Color3();
        LegacyPBRMaterial._scaledEmissive = new BABYLON.Color3();
        LegacyPBRMaterial._scaledReflection = new BABYLON.Color3();
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "directIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "emissiveIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "environmentIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "specularIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "disableBumpMap", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedShadowIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedShadeIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "cameraExposure", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "cameraContrast", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "cameraColorGradingTexture", void 0);
        __decorate([
            BABYLON.serializeAsColorCurves()
        ], LegacyPBRMaterial.prototype, "cameraColorCurves", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], LegacyPBRMaterial.prototype, "overloadedAmbient", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedAmbientIntensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], LegacyPBRMaterial.prototype, "overloadedAlbedo", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedAlbedoIntensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], LegacyPBRMaterial.prototype, "overloadedReflectivity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedReflectivityIntensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], LegacyPBRMaterial.prototype, "overloadedEmissive", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedEmissiveIntensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], LegacyPBRMaterial.prototype, "overloadedReflection", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedReflectionIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedMicroSurface", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedMicroSurfaceIntensity", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "albedoTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "ambientTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "ambientTextureStrength", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "opacityTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "reflectionTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "emissiveTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "reflectivityTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "metallicTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "metallic", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "roughness", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "microSurfaceTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "bumpTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "lightmapTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "refractionTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3("ambient")
        ], LegacyPBRMaterial.prototype, "ambientColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("albedo")
        ], LegacyPBRMaterial.prototype, "albedoColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("reflectivity")
        ], LegacyPBRMaterial.prototype, "reflectivityColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("reflection")
        ], LegacyPBRMaterial.prototype, "reflectionColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("emissive")
        ], LegacyPBRMaterial.prototype, "emissiveColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "microSurface", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "indexOfRefraction", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "invertRefractionY", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], LegacyPBRMaterial.prototype, "opacityFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], LegacyPBRMaterial.prototype, "emissiveFresnelParameters", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "linkRefractionWithTransparency", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "linkEmissiveWithAlbedo", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useLightmapAsShadowmap", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useEmissiveAsIllumination", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useAlphaFromAlbedoTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useSpecularOverAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useMicroSurfaceFromReflectivityMapAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useRoughnessFromMetallicTextureAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useRoughnessFromMetallicTextureGreen", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useMetallnessFromMetallicTextureBlue", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useAmbientOcclusionFromMetallicTextureRed", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useAmbientInGrayScale", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useAutoMicroSurfaceFromReflectivityMap", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useScalarInLinearSpace", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "usePhysicalLightFalloff", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useRadianceOverAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useParallax", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useParallaxOcclusion", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "parallaxScaleBias", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "invertNormalMapX", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "invertNormalMapY", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "twoSidedLighting", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useLogarithmicDepth", null);
        return LegacyPBRMaterial;
    }(BABYLON.Material));
    BABYLON.LegacyPBRMaterial = LegacyPBRMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.legacyPBRMaterial.js.map

BABYLON.Effect.ShadersStore['legacyPbrVertexShader'] = "precision highp float;\n#include<__decl__legacyPbrVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\n#endif\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\n#endif\n#ifdef OPACITY\nvarying vec2 vOpacityUV;\n#endif\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\n#endif\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\n#endif\n#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) \nvarying vec2 vReflectivityUV;\n#endif\n#ifdef MICROSURFACEMAP\nvarying vec2 vMicroSurfaceSamplerUV;\n#endif\n#ifdef BUMP\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL\nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normalUpdated,0.0)));\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef ALBEDO\nif (vAlbedoInfos.x == 0.)\n{\nvAlbedoUV=vec2(albedoMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAlbedoUV=vec2(albedoMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef AMBIENT\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef OPACITY\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef EMISSIVE\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef LIGHTMAP\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) \nif (vReflectivityInfos.x == 0.)\n{\nvReflectivityUV=vec2(reflectivityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvReflectivityUV=vec2(reflectivityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef MICROSURFACEMAP\nif (vMicroSurfaceSamplerInfos.x == 0.)\n{\nvMicroSurfaceSamplerUV=vec2(microSurfaceSamplerMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvMicroSurfaceSamplerUV=vec2(microSurfaceSamplerMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef BUMP\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#include<bumpVertex>\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['legacyPbrPixelShader'] = "#if defined(BUMP)|| !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LODBASEDMICROSFURACE\n#extension GL_EXT_shader_texture_lod : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\nprecision highp float;\n#include<__decl__legacyPbrFragment>\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\nuniform vec4 vCameraInfos;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform sampler2D albedoSampler;\n#endif\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \nvarying vec2 vOpacityUV;\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\nuniform sampler2D lightmapSampler;\n#endif\n#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) \nvarying vec2 vReflectivityUV;\nuniform sampler2D reflectivitySampler;\n#endif\n#ifdef MICROSURFACEMAP\nvarying vec2 vMicroSurfaceSamplerUV;\nuniform sampler2D microSurfaceSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#ifdef CAMERACOLORGRADING\n#include<legacyColorGradingDefinition>\n#endif\n#ifdef CAMERACOLORCURVES\n#include<legacyColorCurvesDefinition>\n#endif\n\n#include<shadowsFragmentFunctions>\n#include<legacyPbrFunctions>\n#ifdef CAMERACOLORGRADING\n#include<legacyColorGrading>\n#endif\n#ifdef CAMERACOLORCURVES\n#include<legacyColorCurves>\n#endif\n#include<legacyPbrLightFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n\nvec4 surfaceAlbedo=vec4(1.,1.,1.,1.);\nvec3 surfaceAlbedoContribution=vAlbedoColor.rgb;\n\nfloat alpha=vAlbedoColor.a;\n#ifdef ALBEDO\nsurfaceAlbedo=texture2D(albedoSampler,vAlbedoUV+uvOffset);\nsurfaceAlbedo=vec4(toLinearSpace(surfaceAlbedo.rgb),surfaceAlbedo.a);\n#ifndef LINKREFRACTIONTOTRANSPARENCY\n#ifdef ALPHATEST\nif (surfaceAlbedo.a<0.4)\ndiscard;\n#endif\n#endif\n#ifdef ALPHAFROMALBEDO\nalpha*=surfaceAlbedo.a;\n#endif\nsurfaceAlbedo.rgb*=vAlbedoInfos.y;\n#else\n\nsurfaceAlbedo.rgb=surfaceAlbedoContribution;\nsurfaceAlbedoContribution=vec3(1.,1.,1.);\n#endif\n#ifdef VERTEXCOLOR\nsurfaceAlbedo.rgb*=vColor.rgb;\n#endif\n#ifdef OVERLOADEDVALUES\nsurfaceAlbedo.rgb=mix(surfaceAlbedo.rgb,vOverloadedAlbedo,vOverloadedIntensity.y);\n#endif\n\nvec3 ambientOcclusionColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nvec3 ambientOcclusionColorMap=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#ifdef AMBIENTINGRAYSCALE \nambientOcclusionColorMap=vec3(ambientOcclusionColorMap.r,ambientOcclusionColorMap.r,ambientOcclusionColorMap.r);\n#endif\nambientOcclusionColor=mix(ambientOcclusionColor,ambientOcclusionColorMap,vAmbientInfos.z);\n#ifdef OVERLOADEDVALUES\nambientOcclusionColor.rgb=mix(ambientOcclusionColor.rgb,vOverloadedAmbient,vOverloadedIntensity.x);\n#endif\n#endif\n\nfloat microSurface=vReflectivityColor.a;\nvec3 surfaceReflectivityColor=vReflectivityColor.rgb;\n#ifdef REFLECTIVITY\nvec4 surfaceReflectivityColorMap=texture2D(reflectivitySampler,vReflectivityUV+uvOffset);\nsurfaceReflectivityColor=surfaceReflectivityColorMap.rgb;\nsurfaceReflectivityColor=toLinearSpace(surfaceReflectivityColor);\nsurfaceReflectivityColor*=vReflectivityInfos.y;\n#ifdef OVERLOADEDVALUES\nsurfaceReflectivityColor=mix(surfaceReflectivityColor,vOverloadedReflectivity,vOverloadedIntensity.z);\n#endif\n#ifdef MICROSURFACEFROMREFLECTIVITYMAP\nmicroSurface=surfaceReflectivityColorMap.a*vReflectivityInfos.z;\n#else\n#ifdef MICROSURFACEAUTOMATIC\nmicroSurface=computeDefaultMicroSurface(microSurface,surfaceReflectivityColor);\n#endif\n#endif\n#else\n#ifdef OVERLOADEDVALUES\nsurfaceReflectivityColor=mix(surfaceReflectivityColor,vOverloadedReflectivity,vOverloadedIntensity.z);\n#endif\n#endif\n#ifdef METALLICWORKFLOW\nvec2 metallicRoughness=surfaceReflectivityColor.rg;\n#ifdef METALLICMAP\nvec4 surfaceMetallicColorMap=texture2D(reflectivitySampler,vReflectivityUV+uvOffset);\n#ifdef AOSTOREINMETALMAPRED \nvec3 aoStoreInMetalMap=vec3(surfaceMetallicColorMap.r,surfaceMetallicColorMap.r,surfaceMetallicColorMap.r);\nambientOcclusionColor=mix(ambientOcclusionColor,aoStoreInMetalMap,vReflectivityInfos.z);\n#endif\n#ifdef METALLNESSSTOREINMETALMAPBLUE\nmetallicRoughness.r*=surfaceMetallicColorMap.b;\n#else\nmetallicRoughness.r*=surfaceMetallicColorMap.r;\n#endif\n#ifdef ROUGHNESSSTOREINMETALMAPALPHA\nmetallicRoughness.g*=surfaceMetallicColorMap.a;\n#else\n#ifdef ROUGHNESSSTOREINMETALMAPGREEN\nmetallicRoughness.g*=surfaceMetallicColorMap.g;\n#endif\n#endif\n#endif\n#ifdef MICROSURFACEMAP\nvec4 microSurfaceTexel=texture2D(microSurfaceSampler,vMicroSurfaceSamplerUV+uvOffset)*vMicroSurfaceSamplerInfos.y;\nmetallicRoughness.g*=microSurfaceTexel.r;\n#endif\n\nmicroSurface=1.0-metallicRoughness.g;\n\nvec3 baseColor=surfaceAlbedo.rgb;\n\n\nconst vec3 DefaultSpecularReflectanceDielectric=vec3(0.04,0.04,0.04);\n\nsurfaceAlbedo.rgb=mix(baseColor.rgb*(1.0-DefaultSpecularReflectanceDielectric.r),vec3(0.,0.,0.),metallicRoughness.r);\n\nsurfaceReflectivityColor=mix(DefaultSpecularReflectanceDielectric,baseColor,metallicRoughness.r);\n#ifdef OVERLOADEDVALUES\nsurfaceReflectivityColor=mix(surfaceReflectivityColor,vOverloadedReflectivity,vOverloadedIntensity.z);\n#endif\n#else\n#ifdef MICROSURFACEMAP\nvec4 microSurfaceTexel=texture2D(microSurfaceSampler,vMicroSurfaceSamplerUV+uvOffset)*vMicroSurfaceSamplerInfos.y;\nmicroSurface=microSurfaceTexel.r;\n#endif\n#endif\n#ifdef OVERLOADEDVALUES\nmicroSurface=mix(microSurface,vOverloadedMicroSurface.x,vOverloadedMicroSurface.y);\n#endif\n\nfloat NdotV=max(0.00000000001,dot(normalW,viewDirectionW));\n\nmicroSurface=clamp(microSurface,0.,1.)*0.98;\n\nfloat roughness=clamp(1.-microSurface,0.000001,1.0);\n\nvec3 lightDiffuseContribution=vec3(0.,0.,0.);\n#ifdef OVERLOADEDSHADOWVALUES\nvec3 shadowedOnlyLightDiffuseContribution=vec3(1.,1.,1.);\n#endif\n#ifdef SPECULARTERM\nvec3 lightSpecularContribution=vec3(0.,0.,0.);\n#endif\nfloat notShadowLevel=1.; \n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\nfloat NdotL=-1.;\nlightingInfo info;\n\nfloat reflectance=max(max(surfaceReflectivityColor.r,surfaceReflectivityColor.g),surfaceReflectivityColor.b);\n\n\nfloat reflectance90=clamp(reflectance*25.0,0.0,1.0);\nvec3 specularEnvironmentR0=surfaceReflectivityColor.rgb;\nvec3 specularEnvironmentR90=vec3(1.0,1.0,1.0)*reflectance90;\n#include<legacyPbrLightFunctionsCall>[0..maxSimultaneousLights]\n#ifdef SPECULARTERM\nlightSpecularContribution*=vLightingIntensity.w;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 surfaceRefractionColor=vec3(0.,0.,0.);\n\n#ifdef LODBASEDMICROSFURACE\nfloat alphaG=convertRoughnessToAverageSlope(roughness);\n#endif\n#ifdef REFRACTION\nvec3 refractionVector=refract(-viewDirectionW,normalW,vRefractionInfos.y);\n#ifdef LODBASEDMICROSFURACE\n#ifdef USEPMREMREFRACTION\nfloat lodRefraction=getMipMapIndexFromAverageSlopeWithPMREM(vMicrosurfaceTextureLods.y,alphaG);\n#else\nfloat lodRefraction=getMipMapIndexFromAverageSlope(vMicrosurfaceTextureLods.y,alphaG);\n#endif\n#else\nfloat biasRefraction=(vMicrosurfaceTextureLods.y+2.)*(1.0-microSurface);\n#endif\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\n#ifdef LODBASEDMICROSFURACE\n#ifdef USEPMREMREFRACTION\n\nif ((vMicrosurfaceTextureLods.y-lodRefraction)>4.0)\n{\n\nfloat scaleRefraction=1.-exp2(lodRefraction)/exp2(vMicrosurfaceTextureLods.y); \nfloat maxRefraction=max(max(abs(refractionVector.x),abs(refractionVector.y)),abs(refractionVector.z));\nif (abs(refractionVector.x) != maxRefraction) refractionVector.x*=scaleRefraction;\nif (abs(refractionVector.y) != maxRefraction) refractionVector.y*=scaleRefraction;\nif (abs(refractionVector.z) != maxRefraction) refractionVector.z*=scaleRefraction;\n}\n#endif\nsurfaceRefractionColor=textureCubeLodEXT(refractionCubeSampler,refractionVector,lodRefraction).rgb*vRefractionInfos.x;\n#else\nsurfaceRefractionColor=textureCube(refractionCubeSampler,refractionVector,biasRefraction).rgb*vRefractionInfos.x;\n#endif\n}\n#ifndef REFRACTIONMAPINLINEARSPACE\nsurfaceRefractionColor=toLinearSpace(surfaceRefractionColor.rgb);\n#endif\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\n#ifdef LODBASEDMICROSFURACE\nsurfaceRefractionColor=texture2DLodEXT(refraction2DSampler,refractionCoords,lodRefraction).rgb*vRefractionInfos.x;\n#else\nsurfaceRefractionColor=texture2D(refraction2DSampler,refractionCoords,biasRefraction).rgb*vRefractionInfos.x;\n#endif \nsurfaceRefractionColor=toLinearSpace(surfaceRefractionColor.rgb);\n#endif\n#endif\n\nvec3 environmentRadiance=vReflectionColor.rgb;\nvec3 environmentIrradiance=vReflectionColor.rgb;\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef LODBASEDMICROSFURACE\n#ifdef USEPMREMREFLECTION\nfloat lodReflection=getMipMapIndexFromAverageSlopeWithPMREM(vMicrosurfaceTextureLods.x,alphaG);\n#else\nfloat lodReflection=getMipMapIndexFromAverageSlope(vMicrosurfaceTextureLods.x,alphaG);\n#endif\n#else\nfloat biasReflection=(vMicrosurfaceTextureLods.x+2.)*(1.0-microSurface);\n#endif\n#ifdef REFLECTIONMAP_3D\n#ifdef LODBASEDMICROSFURACE\n#ifdef USEPMREMREFLECTION\n\nif ((vMicrosurfaceTextureLods.y-lodReflection)>4.0)\n{\n\nfloat scaleReflection=1.-exp2(lodReflection)/exp2(vMicrosurfaceTextureLods.x); \nfloat maxReflection=max(max(abs(vReflectionUVW.x),abs(vReflectionUVW.y)),abs(vReflectionUVW.z));\nif (abs(vReflectionUVW.x) != maxReflection) vReflectionUVW.x*=scaleReflection;\nif (abs(vReflectionUVW.y) != maxReflection) vReflectionUVW.y*=scaleReflection;\nif (abs(vReflectionUVW.z) != maxReflection) vReflectionUVW.z*=scaleReflection;\n}\n#endif\nenvironmentRadiance=textureCubeLodEXT(reflectionCubeSampler,vReflectionUVW,lodReflection).rgb*vReflectionInfos.x;\n#else\nenvironmentRadiance=textureCube(reflectionCubeSampler,vReflectionUVW,biasReflection).rgb*vReflectionInfos.x;\n#endif\n#ifdef USESPHERICALFROMREFLECTIONMAP\n#ifndef REFLECTIONMAP_SKYBOX\nvec3 normalEnvironmentSpace=(reflectionMatrix*vec4(normalW,1)).xyz;\nenvironmentIrradiance=EnvironmentIrradiance(normalEnvironmentSpace);\n#endif\n#else\nenvironmentRadiance=toLinearSpace(environmentRadiance.rgb);\nenvironmentIrradiance=textureCube(reflectionCubeSampler,normalW,20.).rgb*vReflectionInfos.x;\nenvironmentIrradiance=toLinearSpace(environmentIrradiance.rgb);\nenvironmentIrradiance*=0.2; \n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\n#ifdef LODBASEDMICROSFURACE\nenvironmentRadiance=texture2DLodEXT(reflection2DSampler,coords,lodReflection).rgb*vReflectionInfos.x;\n#else\nenvironmentRadiance=texture2D(reflection2DSampler,coords,biasReflection).rgb*vReflectionInfos.x;\n#endif\nenvironmentRadiance=toLinearSpace(environmentRadiance.rgb);\nenvironmentIrradiance=texture2D(reflection2DSampler,coords,20.).rgb*vReflectionInfos.x;\nenvironmentIrradiance=toLinearSpace(environmentIrradiance.rgb);\n#endif\n#endif\n#ifdef OVERLOADEDVALUES\nenvironmentIrradiance=mix(environmentIrradiance,vOverloadedReflection,vOverloadedMicroSurface.z);\nenvironmentRadiance=mix(environmentRadiance,vOverloadedReflection,vOverloadedMicroSurface.z);\n#endif\nenvironmentRadiance*=vLightingIntensity.z;\nenvironmentIrradiance*=vLightingIntensity.z;\n\nvec3 specularEnvironmentReflectance=FresnelSchlickEnvironmentGGX(clamp(NdotV,0.,1.),specularEnvironmentR0,specularEnvironmentR90,sqrt(microSurface));\n\nvec3 refractance=vec3(0.0,0.0,0.0);\n#ifdef REFRACTION\nvec3 transmission=vec3(1.0,1.0,1.0);\n#ifdef LINKREFRACTIONTOTRANSPARENCY\n\ntransmission*=(1.0-alpha);\n\n\nvec3 mixedAlbedo=surfaceAlbedoContribution.rgb*surfaceAlbedo.rgb;\nfloat maxChannel=max(max(mixedAlbedo.r,mixedAlbedo.g),mixedAlbedo.b);\nvec3 tint=clamp(maxChannel*mixedAlbedo,0.0,1.0);\n\nsurfaceAlbedoContribution*=alpha;\n\nenvironmentIrradiance*=alpha;\n\nsurfaceRefractionColor*=tint;\n\nalpha=1.0;\n#endif\n\nvec3 bounceSpecularEnvironmentReflectance=(2.0*specularEnvironmentReflectance)/(1.0+specularEnvironmentReflectance);\nspecularEnvironmentReflectance=mix(bounceSpecularEnvironmentReflectance,specularEnvironmentReflectance,alpha);\n\ntransmission*=1.0-specularEnvironmentReflectance;\n\nrefractance=surfaceRefractionColor*transmission;\n#endif\n\nsurfaceAlbedo.rgb=(1.-reflectance)*surfaceAlbedo.rgb;\nrefractance*=vLightingIntensity.z;\nenvironmentRadiance*=specularEnvironmentReflectance;\n\nvec3 surfaceEmissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nvec3 emissiveColorTex=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb;\nsurfaceEmissiveColor=toLinearSpace(emissiveColorTex.rgb)*surfaceEmissiveColor*vEmissiveInfos.y;\n#endif\n#ifdef OVERLOADEDVALUES\nsurfaceEmissiveColor=mix(surfaceEmissiveColor,vOverloadedEmissive,vOverloadedIntensity.w);\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nsurfaceEmissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=lightDiffuseContribution*surfaceAlbedoContribution;\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution=shadowedOnlyLightDiffuseContribution*surfaceAlbedoContribution;\n#endif\n#else\n#ifdef LINKEMISSIVEWITHALBEDO\nvec3 finalDiffuse=(lightDiffuseContribution+surfaceEmissiveColor)*surfaceAlbedoContribution;\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution=(shadowedOnlyLightDiffuseContribution+surfaceEmissiveColor)*surfaceAlbedoContribution;\n#endif\n#else\nvec3 finalDiffuse=lightDiffuseContribution*surfaceAlbedoContribution+surfaceEmissiveColor;\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution=shadowedOnlyLightDiffuseContribution*surfaceAlbedoContribution+surfaceEmissiveColor;\n#endif\n#endif\n#endif\nfinalDiffuse.rgb+=vAmbientColor;\nfinalDiffuse*=surfaceAlbedo.rgb;\nfinalDiffuse=max(finalDiffuse,0.0);\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution+=vAmbientColor;\nshadowedOnlyLightDiffuseContribution*=surfaceAlbedo.rgb;\nshadowedOnlyLightDiffuseContribution=max(shadowedOnlyLightDiffuseContribution,0.0);\nfinalDiffuse=mix(finalDiffuse,shadowedOnlyLightDiffuseContribution,(1.0-vOverloadedShadowIntensity.y));\n#endif\nfinalDiffuse=(finalDiffuse*vLightingIntensity.x+surfaceAlbedo.rgb*environmentIrradiance)*ambientOcclusionColor;\n#ifdef SPECULARTERM\nvec3 finalSpecular=lightSpecularContribution*surfaceReflectivityColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+getLuminance(finalSpecular),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef RADIANCEOVERALPHA\nalpha=clamp(alpha+getLuminance(environmentRadiance),0.,1.);\n#endif\n\n\nvec4 finalColor=vec4(finalDiffuse+finalSpecular*vLightingIntensity.x+environmentRadiance+refractance,alpha);\n#ifdef EMISSIVEASILLUMINATION\nfinalColor.rgb+=(surfaceEmissiveColor*vLightingIntensity.y);\n#endif\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\nfinalColor.rgb*=lightmapColor;\n#else\nfinalColor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\nfinalColor=max(finalColor,0.0);\n#ifdef CAMERATONEMAP\nfinalColor.rgb=toneMaps(finalColor.rgb);\n#endif\nfinalColor.rgb=toGammaSpace(finalColor.rgb);\n#include<logDepthFragment>\n#include<fogFragment>(color,finalColor)\n#ifdef CAMERACONTRAST\nfinalColor=contrasts(finalColor);\n#endif\nfinalColor.rgb=clamp(finalColor.rgb,0.,1.);\n#ifdef CAMERACOLORGRADING\nfinalColor=colorGrades(finalColor);\n#endif\n#ifdef CAMERACOLORCURVES\nfinalColor.rgb=applyColorCurves(finalColor.rgb);\n#endif\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\ngl_FragColor=finalColor;\n}";

BABYLON.Effect.IncludesShadersStore['legacyPbrFragmentDeclaration'] = "uniform vec3 vReflectionColor;\nuniform vec4 vAlbedoColor;\n\nuniform vec4 vLightingIntensity;\n#ifdef OVERLOADEDVALUES\nuniform vec4 vOverloadedIntensity;\nuniform vec3 vOverloadedAmbient;\nuniform vec3 vOverloadedAlbedo;\nuniform vec3 vOverloadedReflectivity;\nuniform vec3 vOverloadedEmissive;\nuniform vec3 vOverloadedReflection;\nuniform vec3 vOverloadedMicroSurface;\n#endif\n#ifdef OVERLOADEDSHADOWVALUES\nuniform vec4 vOverloadedShadowIntensity;\n#endif\n#if defined(REFLECTION) || defined(REFRACTION)\nuniform vec2 vMicrosurfaceTextureLods;\n#endif\nuniform vec4 vReflectivityColor;\nuniform vec3 vEmissiveColor;\n\n#ifdef ALBEDO\nuniform vec2 vAlbedoInfos;\n#endif\n#ifdef AMBIENT\nuniform vec3 vAmbientInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) \nuniform vec3 vReflectivityInfos;\n#endif\n#ifdef MICROSURFACEMAP\nuniform vec2 vMicroSurfaceSamplerInfos;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifdef REFRACTIONMAP_3D\n#else\nuniform mat4 refractionMatrix;\n#endif\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['legacyPbrFunctions'] = "\n#define RECIPROCAL_PI2 0.15915494\n#define FRESNEL_MAXIMUM_ON_ROUGH 0.25\n\nconst float kPi=3.1415926535897932384626433832795;\nconst float kRougnhessToAlphaScale=0.1;\nconst float kRougnhessToAlphaOffset=0.29248125;\nfloat Square(float value)\n{\nreturn value*value;\n}\nfloat convertRoughnessToAverageSlope(float roughness)\n{\n\nconst float kMinimumVariance=0.0005;\nfloat alphaG=Square(roughness)+kMinimumVariance;\nreturn alphaG;\n}\n\nfloat getMipMapIndexFromAverageSlope(float maxMipLevel,float alpha)\n{\n\n\n\n\n\n\n\nfloat mip=kRougnhessToAlphaOffset+maxMipLevel+(maxMipLevel*kRougnhessToAlphaScale*log2(alpha));\nreturn clamp(mip,0.,maxMipLevel);\n}\nfloat getMipMapIndexFromAverageSlopeWithPMREM(float maxMipLevel,float alphaG)\n{\nfloat specularPower=clamp(2./alphaG-2.,0.000001,2048.);\n\nreturn clamp(- 0.5*log2(specularPower)+5.5,0.,maxMipLevel);\n}\n\nfloat smithVisibilityG1_TrowbridgeReitzGGX(float dot,float alphaG)\n{\nfloat tanSquared=(1.0-dot*dot)/(dot*dot);\nreturn 2.0/(1.0+sqrt(1.0+alphaG*alphaG*tanSquared));\n}\nfloat smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL,float NdotV,float alphaG)\n{\nreturn smithVisibilityG1_TrowbridgeReitzGGX(NdotL,alphaG)*smithVisibilityG1_TrowbridgeReitzGGX(NdotV,alphaG);\n}\n\n\nfloat normalDistributionFunction_TrowbridgeReitzGGX(float NdotH,float alphaG)\n{\n\n\n\nfloat a2=Square(alphaG);\nfloat d=NdotH*NdotH*(a2-1.0)+1.0;\nreturn a2/(kPi*d*d);\n}\nvec3 fresnelSchlickGGX(float VdotH,vec3 reflectance0,vec3 reflectance90)\n{\nreturn reflectance0+(reflectance90-reflectance0)*pow(clamp(1.0-VdotH,0.,1.),5.0);\n}\nvec3 FresnelSchlickEnvironmentGGX(float VdotN,vec3 reflectance0,vec3 reflectance90,float smoothness)\n{\n\nfloat weight=mix(FRESNEL_MAXIMUM_ON_ROUGH,1.0,smoothness);\nreturn reflectance0+weight*(reflectance90-reflectance0)*pow(clamp(1.0-VdotN,0.,1.),5.0);\n}\n\nvec3 computeSpecularTerm(float NdotH,float NdotL,float NdotV,float VdotH,float roughness,vec3 specularColor,vec3 reflectance90)\n{\nfloat alphaG=convertRoughnessToAverageSlope(roughness);\nfloat distribution=normalDistributionFunction_TrowbridgeReitzGGX(NdotH,alphaG);\nfloat visibility=smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL,NdotV,alphaG);\nvisibility/=(4.0*NdotL*NdotV); \nvec3 fresnel=fresnelSchlickGGX(VdotH,specularColor,reflectance90);\nfloat specTerm=max(0.,visibility*distribution)*NdotL;\nreturn fresnel*specTerm*kPi; \n}\nfloat computeDiffuseTerm(float NdotL,float NdotV,float VdotH,float roughness)\n{\n\n\nfloat diffuseFresnelNV=pow(clamp(1.0-NdotL,0.000001,1.),5.0);\nfloat diffuseFresnelNL=pow(clamp(1.0-NdotV,0.000001,1.),5.0);\nfloat diffuseFresnel90=0.5+2.0*VdotH*VdotH*roughness;\nfloat diffuseFresnelTerm =\n(1.0+(diffuseFresnel90-1.0)*diffuseFresnelNL) *\n(1.0+(diffuseFresnel90-1.0)*diffuseFresnelNV);\nreturn diffuseFresnelTerm*NdotL;\n\n\n}\nfloat adjustRoughnessFromLightProperties(float roughness,float lightRadius,float lightDistance)\n{\n#ifdef USEPHYSICALLIGHTFALLOFF\n\nfloat lightRoughness=lightRadius/lightDistance;\n\nfloat totalRoughness=clamp(lightRoughness+roughness,0.,1.);\nreturn totalRoughness;\n#else\nreturn roughness;\n#endif\n}\nfloat computeDefaultMicroSurface(float microSurface,vec3 reflectivityColor)\n{\nfloat kReflectivityNoAlphaWorkflow_SmoothnessMax=0.95;\nfloat reflectivityLuminance=getLuminance(reflectivityColor);\nfloat reflectivityLuma=sqrt(reflectivityLuminance);\nmicroSurface=reflectivityLuma*kReflectivityNoAlphaWorkflow_SmoothnessMax;\nreturn microSurface;\n}\n#ifdef CAMERATONEMAP\nvec3 toneMaps(vec3 color)\n{\ncolor=max(color,0.0);\n\ncolor.rgb=color.rgb*vCameraInfos.x;\nfloat tuning=1.5; \n\n\nvec3 tonemapped=1.0-exp2(-color.rgb*tuning); \ncolor.rgb=mix(color.rgb,tonemapped,1.0);\nreturn color;\n}\n#endif\n#ifdef CAMERACONTRAST\nvec4 contrasts(vec4 color)\n{\ncolor=clamp(color,0.0,1.0);\nvec3 resultHighContrast=color.rgb*color.rgb*(3.0-2.0*color.rgb);\nfloat contrast=vCameraInfos.y;\nif (contrast<1.0)\n{\n\ncolor.rgb=mix(vec3(0.5,0.5,0.5),color.rgb,contrast);\n}\nelse\n{\n\ncolor.rgb=mix(color.rgb,resultHighContrast,contrast-1.0);\n}\nreturn color;\n}\n#endif\n#ifdef USESPHERICALFROMREFLECTIONMAP\nuniform vec3 vSphericalX;\nuniform vec3 vSphericalY;\nuniform vec3 vSphericalZ;\nuniform vec3 vSphericalXX;\nuniform vec3 vSphericalYY;\nuniform vec3 vSphericalZZ;\nuniform vec3 vSphericalXY;\nuniform vec3 vSphericalYZ;\nuniform vec3 vSphericalZX;\nvec3 EnvironmentIrradiance(vec3 normal)\n{\n\n\n\nvec3 result =\nvSphericalX*normal.x +\nvSphericalY*normal.y +\nvSphericalZ*normal.z +\nvSphericalXX*normal.x*normal.x +\nvSphericalYY*normal.y*normal.y +\nvSphericalZZ*normal.z*normal.z +\nvSphericalYZ*normal.y*normal.z +\nvSphericalZX*normal.z*normal.x +\nvSphericalXY*normal.x*normal.y;\nreturn result.rgb;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['legacyPbrLightFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n};\nfloat computeDistanceLightFalloff(vec3 lightOffset,float lightDistanceSquared,float range)\n{ \n#ifdef USEPHYSICALLIGHTFALLOFF\nfloat lightDistanceFalloff=1.0/((lightDistanceSquared+0.0001));\n#else\nfloat lightDistanceFalloff=max(0.,1.0-length(lightOffset)/range);\n#endif\nreturn lightDistanceFalloff;\n}\nfloat computeDirectionalLightFalloff(vec3 lightDirection,vec3 directionToLightCenterW,float lightAngle,float exponent)\n{\nfloat falloff=0.0;\n#ifdef USEPHYSICALLIGHTFALLOFF\nfloat cosHalfAngle=cos(lightAngle*0.5);\nconst float kMinusLog2ConeAngleIntensityRatio=6.64385618977; \n\n\n\n\n\nfloat concentrationKappa=kMinusLog2ConeAngleIntensityRatio/(1.0-cosHalfAngle);\n\n\nvec4 lightDirectionSpreadSG=vec4(-lightDirection*concentrationKappa,-concentrationKappa);\nfalloff=exp2(dot(vec4(directionToLightCenterW,1.0),lightDirectionSpreadSG));\n#else\nfloat cosAngle=max(0.000000000000001,dot(-lightDirection,directionToLightCenterW));\nif (cosAngle>=lightAngle)\n{\nfalloff=max(0.,pow(cosAngle,exponent));\n}\n#endif\nreturn falloff;\n}\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float rangeRadius,float roughness,float NdotV,vec3 reflectance90,out float NdotL) {\nlightingInfo result;\nvec3 lightDirection;\nfloat attenuation=1.0;\nfloat lightDistance;\n\nif (lightData.w == 0.)\n{\nvec3 lightOffset=lightData.xyz-vPositionW;\nfloat lightDistanceSquared=dot(lightOffset,lightOffset);\nattenuation=computeDistanceLightFalloff(lightOffset,lightDistanceSquared,rangeRadius);\nlightDistance=sqrt(lightDistanceSquared);\nlightDirection=normalize(lightOffset);\n}\n\nelse\n{\nlightDistance=length(-lightData.xyz);\nlightDirection=normalize(-lightData.xyz);\n}\n\nroughness=adjustRoughnessFromLightProperties(roughness,rangeRadius,lightDistance);\n\nvec3 H=normalize(viewDirectionW+lightDirection);\nNdotL=max(0.00000000001,dot(vNormal,lightDirection));\nfloat VdotH=clamp(0.00000000001,1.0,dot(viewDirectionW,H));\nfloat diffuseTerm=computeDiffuseTerm(NdotL,NdotV,VdotH,roughness);\nresult.diffuse=diffuseTerm*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nfloat NdotH=max(0.00000000001,dot(vNormal,H));\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,specularColor,reflectance90);\nresult.specular=specTerm*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float rangeRadius,float roughness,float NdotV,vec3 reflectance90,out float NdotL) {\nlightingInfo result;\nvec3 lightOffset=lightData.xyz-vPositionW;\nvec3 directionToLightCenterW=normalize(lightOffset);\n\nfloat lightDistanceSquared=dot(lightOffset,lightOffset);\nfloat attenuation=computeDistanceLightFalloff(lightOffset,lightDistanceSquared,rangeRadius);\n\nfloat directionalAttenuation=computeDirectionalLightFalloff(lightDirection.xyz,directionToLightCenterW,lightDirection.w,lightData.w);\nattenuation*=directionalAttenuation;\n\nfloat lightDistance=sqrt(lightDistanceSquared);\nroughness=adjustRoughnessFromLightProperties(roughness,rangeRadius,lightDistance);\n\nvec3 H=normalize(viewDirectionW+directionToLightCenterW);\nNdotL=max(0.00000000001,dot(vNormal,directionToLightCenterW));\nfloat VdotH=clamp(dot(viewDirectionW,H),0.00000000001,1.0);\nfloat diffuseTerm=computeDiffuseTerm(NdotL,NdotV,VdotH,roughness);\nresult.diffuse=diffuseTerm*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nfloat NdotH=max(0.00000000001,dot(vNormal,H));\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,specularColor,reflectance90);\nresult.specular=specTerm*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float roughness,float NdotV,vec3 reflectance90,out float NdotL) {\nlightingInfo result;\n\n\n\nNdotL=dot(vNormal,lightData.xyz)*0.5+0.5;\nresult.diffuse=mix(groundColor,diffuseColor,NdotL);\n#ifdef SPECULARTERM\n\nvec3 lightVectorW=normalize(lightData.xyz);\nvec3 H=normalize(viewDirectionW+lightVectorW);\nfloat NdotH=max(0.00000000001,dot(vNormal,H));\nNdotL=max(0.00000000001,NdotL);\nfloat VdotH=clamp(0.00000000001,1.0,dot(viewDirectionW,H));\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,specularColor,reflectance90);\nresult.specular=specTerm;\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['legacyPbrLightFunctionsCall'] = "#ifdef LIGHT{X}\n#if defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X})\n\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR90,NdotL);\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nnotShadowLevel=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nnotShadowLevel=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,0.0);\n#endif\n#else\n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nnotShadowLevel=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nnotShadowLevel=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,0.0);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nnotShadowLevel=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nnotShadowLevel=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,0.0);\n#endif\n#endif\n#endif\n#else\nnotShadowLevel=1.;\n#endif\n#if defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\nlightDiffuseContribution+=lightmapColor*notShadowLevel;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nlightSpecularContribution+=info.specular*notShadowLevel*lightmapColor;\n#endif\n#endif\n#else\nlightDiffuseContribution+=info.diffuse*notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\nif (NdotL<0.000000000011)\n{\nnotShadowLevel=1.;\n}\nshadowedOnlyLightDiffuseContribution*=notShadowLevel;\n#endif\n#ifdef SPECULARTERM\nlightSpecularContribution+=info.specular*notShadowLevel;\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['legacyPbrUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nuniform vec2 vAlbedoInfos;\nuniform vec3 vAmbientInfos;\nuniform vec2 vOpacityInfos;\nuniform vec2 vEmissiveInfos;\nuniform vec2 vLightmapInfos;\nuniform vec3 vReflectivityInfos;\nuniform vec2 vMicroSurfaceSamplerInfos;\nuniform vec4 vRefractionInfos;\nuniform vec2 vReflectionInfos;\nuniform vec3 vBumpInfos;\nuniform mat4 albedoMatrix;\nuniform mat4 ambientMatrix;\nuniform mat4 opacityMatrix;\nuniform mat4 emissiveMatrix;\nuniform mat4 lightmapMatrix;\nuniform mat4 reflectivityMatrix;\nuniform mat4 microSurfaceSamplerMatrix;\nuniform mat4 bumpMatrix;\nuniform vec2 vTangentSpaceParams;\nuniform mat4 refractionMatrix;\nuniform mat4 reflectionMatrix;\nuniform vec3 vReflectionColor;\nuniform vec4 vAlbedoColor;\nuniform vec4 vLightingIntensity;\nuniform vec2 vMicrosurfaceTextureLods;\nuniform vec4 vReflectivityColor;\nuniform vec3 vEmissiveColor;\nuniform vec4 opacityParts;\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\nuniform vec4 vOverloadedIntensity;\nuniform vec3 vOverloadedAmbient;\nuniform vec3 vOverloadedAlbedo;\nuniform vec3 vOverloadedReflectivity;\nuniform vec3 vOverloadedEmissive;\nuniform vec3 vOverloadedReflection;\nuniform vec3 vOverloadedMicroSurface;\nuniform vec4 vOverloadedShadowIntensity;\nuniform float pointSize;\n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['legacyPbrVertexDeclaration'] = "uniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef ALBEDO\nuniform mat4 albedoMatrix;\nuniform vec2 vAlbedoInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec3 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) \nuniform vec3 vReflectivityInfos;\nuniform mat4 reflectivityMatrix;\n#endif\n#ifdef MICROSURFACEMAP\nuniform vec2 vMicroSurfaceSamplerInfos;\nuniform mat4 microSurfaceSamplerMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['legacyColorCurves'] = "const vec3 HDTVRec709_RGBLuminanceCoefficients=vec3(0.2126,0.7152,0.0722);\nvec3 applyColorCurves(vec3 original) {\nvec3 result=original;\n\n\n\nfloat luma=dot(result.rgb,HDTVRec709_RGBLuminanceCoefficients);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0,0.0),vec2(1.0,1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma,luma,luma),result.rgb,colorCurve.a);\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['legacyColorCurvesDefinition'] = "uniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\nuniform vec4 vCameraColorCurveNegative;";
BABYLON.Effect.IncludesShadersStore['legacyColorGrading'] = "vec4 colorGrades(vec4 color) \n{ \n\nfloat sliceContinuous=color.z*vCameraColorGradingInfos.z;\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger; \n\nvec2 sliceUV=color.xy*vCameraColorGradingScaleOffset.xy+vCameraColorGradingScaleOffset.zw;\n\n\nsliceUV.x+=sliceInteger*vCameraColorGradingInfos.w;\nvec4 slice0Color=texture2D(cameraColorGrading2DSampler,sliceUV);\nsliceUV.x+=vCameraColorGradingInfos.w;\nvec4 slice1Color=texture2D(cameraColorGrading2DSampler,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\ncolor.rgb=mix(color.rgb,result,vCameraColorGradingInfos.x);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['legacyColorGradingDefinition'] = "uniform sampler2D cameraColorGrading2DSampler;\nuniform vec4 vCameraColorGradingInfos;\nuniform vec4 vCameraColorGradingScaleOffset;";
