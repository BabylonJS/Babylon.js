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
    var PBRMaterialDefines = (function (_super) {
        __extends(PBRMaterialDefines, _super);
        function PBRMaterialDefines() {
            _super.call(this);
            this.ALBEDO = false;
            this.AMBIENT = false;
            this.OPACITY = false;
            this.OPACITYRGB = false;
            this.REFLECTION = false;
            this.EMISSIVE = false;
            this.REFLECTIVITY = false;
            this.BUMP = false;
            this.PARALLAX = false;
            this.PARALLAXOCCLUSION = false;
            this.SPECULAROVERALPHA = false;
            this.CLIPPLANE = false;
            this.ALPHATEST = false;
            this.ALPHAFROMALBEDO = false;
            this.POINTSIZE = false;
            this.FOG = false;
            this.SPECULARTERM = false;
            this.OPACITYFRESNEL = false;
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
            this.MICROSURFACEFROMREFLECTIVITYMAP = false;
            this.MICROSURFACEAUTOMATIC = false;
            this.EMISSIVEASILLUMINATION = false;
            this.LINKEMISSIVEWITHALBEDO = false;
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
            this.INVERTCUBICMAP = false;
            this.LOGARITHMICDEPTH = false;
            this.CAMERATONEMAP = false;
            this.CAMERACONTRAST = false;
            this.CAMERACOLORGRADING = false;
            this.CAMERACOLORCURVES = false;
            this.OVERLOADEDVALUES = false;
            this.OVERLOADEDSHADOWVALUES = false;
            this.USESPHERICALFROMREFLECTIONMAP = false;
            this.REFRACTION = false;
            this.REFRACTIONMAP_3D = false;
            this.LINKREFRACTIONTOTRANSPARENCY = false;
            this.REFRACTIONMAPINLINEARSPACE = false;
            this.LODBASEDMICROSFURACE = false;
            this.USEPHYSICALLIGHTFALLOFF = false;
            this.RADIANCEOVERALPHA = false;
            this.USEPMREMREFLECTION = false;
            this.USEPMREMREFRACTION = false;
            this.OPENGLNORMALMAP = false;
            this.INVERTNORMALMAPX = false;
            this.INVERTNORMALMAPY = false;
            this.SHADOWFULLFLOAT = false;
            this.rebuild();
        }
        return PBRMaterialDefines;
    }(BABYLON.MaterialDefines));
    /**
     * The Physically based material of BJS.
     *
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation :
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    var PBRMaterial = (function (_super) {
        __extends(PBRMaterial, _super);
        /**
         * Instantiates a new PBRMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        function PBRMaterial(name, scene) {
            var _this = this;
            _super.call(this, name, scene);
            /**
             * Intensity of the direct lights e.g. the four lights available in your scene.
             * This impacts both the direct diffuse and specular highlights.
             */
            this.directIntensity = 1.0;
            /**
             * Intensity of the emissive part of the material.
             * This helps controlling the emissive effect without modifying the emissive color.
             */
            this.emissiveIntensity = 1.0;
            /**
             * Intensity of the environment e.g. how much the environment will light the object
             * either through harmonics for rough material or through the refelction for shiny ones.
             */
            this.environmentIntensity = 1.0;
            /**
             * This is a special control allowing the reduction of the specular highlights coming from the
             * four lights of the scene. Those highlights may not be needed in full environment lighting.
             */
            this.specularIntensity = 1.0;
            this._lightingInfos = new BABYLON.Vector4(this.directIntensity, this.emissiveIntensity, this.environmentIntensity, this.specularIntensity);
            /**
             * Debug Control allowing disabling the bump map on this material.
             */
            this.disableBumpMap = false;
            /**
             * Debug Control helping enforcing or dropping the darkness of shadows.
             * 1.0 means the shadows have their normal darkness, 0.0 means the shadows are not visible.
             */
            this.overloadedShadowIntensity = 1.0;
            /**
             * Debug Control helping dropping the shading effect coming from the diffuse lighting.
             * 1.0 means the shade have their normal impact, 0.0 means no shading at all.
             */
            this.overloadedShadeIntensity = 1.0;
            this._overloadedShadowInfos = new BABYLON.Vector4(this.overloadedShadowIntensity, this.overloadedShadeIntensity, 0.0, 0.0);
            /**
             * The camera exposure used on this material.
             * This property is here and not in the camera to allow controlling exposure without full screen post process.
             * This corresponds to a photographic exposure.
             */
            this.cameraExposure = 1.0;
            /**
             * The camera contrast used on this material.
             * This property is here and not in the camera to allow controlling contrast without full screen post process.
             */
            this.cameraContrast = 1.0;
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
            this._cameraInfos = new BABYLON.Vector4(1.0, 1.0, 0.0, 0.0);
            this._microsurfaceTextureLods = new BABYLON.Vector2(0.0, 0.0);
            /**
             * Debug Control allowing to overload the ambient color.
             * This as to be use with the overloadedAmbientIntensity parameter.
             */
            this.overloadedAmbient = BABYLON.Color3.White();
            /**
             * Debug Control indicating how much the overloaded ambient color is used against the default one.
             */
            this.overloadedAmbientIntensity = 0.0;
            /**
             * Debug Control allowing to overload the albedo color.
             * This as to be use with the overloadedAlbedoIntensity parameter.
             */
            this.overloadedAlbedo = BABYLON.Color3.White();
            /**
             * Debug Control indicating how much the overloaded albedo color is used against the default one.
             */
            this.overloadedAlbedoIntensity = 0.0;
            /**
             * Debug Control allowing to overload the reflectivity color.
             * This as to be use with the overloadedReflectivityIntensity parameter.
             */
            this.overloadedReflectivity = new BABYLON.Color3(0.3, 0.3, 0.3);
            /**
             * Debug Control indicating how much the overloaded reflectivity color is used against the default one.
             */
            this.overloadedReflectivityIntensity = 0.0;
            /**
             * Debug Control allowing to overload the emissive color.
             * This as to be use with the overloadedEmissiveIntensity parameter.
             */
            this.overloadedEmissive = BABYLON.Color3.White();
            /**
             * Debug Control indicating how much the overloaded emissive color is used against the default one.
             */
            this.overloadedEmissiveIntensity = 0.0;
            this._overloadedIntensity = new BABYLON.Vector4(this.overloadedAmbientIntensity, this.overloadedAlbedoIntensity, this.overloadedReflectivityIntensity, this.overloadedEmissiveIntensity);
            /**
             * Debug Control allowing to overload the reflection color.
             * This as to be use with the overloadedReflectionIntensity parameter.
             */
            this.overloadedReflection = BABYLON.Color3.White();
            /**
             * Debug Control indicating how much the overloaded reflection color is used against the default one.
             */
            this.overloadedReflectionIntensity = 0.0;
            /**
             * Debug Control allowing to overload the microsurface.
             * This as to be use with the overloadedMicroSurfaceIntensity parameter.
             */
            this.overloadedMicroSurface = 0.0;
            /**
             * Debug Control indicating how much the overloaded microsurface is used against the default one.
             */
            this.overloadedMicroSurfaceIntensity = 0.0;
            this._overloadedMicroSurface = new BABYLON.Vector3(this.overloadedMicroSurface, this.overloadedMicroSurfaceIntensity, this.overloadedReflectionIntensity);
            /**
             * AKA Occlusion Texture Intensity in other nomenclature.
             */
            this.ambientTextureStrength = 1.0;
            this.ambientColor = new BABYLON.Color3(0, 0, 0);
            /**
             * AKA Diffuse Color in other nomenclature.
             */
            this.albedoColor = new BABYLON.Color3(1, 1, 1);
            /**
             * AKA Specular Color in other nomenclature.
             */
            this.reflectivityColor = new BABYLON.Color3(1, 1, 1);
            this.reflectionColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            /**
    
             * AKA Glossiness in other nomenclature.
             */
            this.microSurface = 0.9;
            /**
             * source material index of refraction (IOR)' / 'destination material IOR.
             */
            this.indexOfRefraction = 0.66;
            /**
             * Controls if refraction needs to be inverted on Y. This could be usefull for procedural texture.
             */
            this.invertRefractionY = false;
            /**
             * This parameters will make the material used its opacity to control how much it is refracting aginst not.
             * Materials half opaque for instance using refraction could benefit from this control.
             */
            this.linkRefractionWithTransparency = false;
            /**
             * The emissive and albedo are linked to never be more than one (Energy conservation).
             */
            this.linkEmissiveWithAlbedo = false;
            this.useLightmapAsShadowmap = false;
            /**
             * In this mode, the emissive informtaion will always be added to the lighting once.
             * A light for instance can be thought as emissive.
             */
            this.useEmissiveAsIllumination = false;
            /**
             * Secifies that the alpha is coming form the albedo channel alpha channel.
             */
            this.useAlphaFromAlbedoTexture = false;
            /**
             * Specifies that the material will keeps the specular highlights over a transparent surface (only the most limunous ones).
             * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
             */
            this.useSpecularOverAlpha = true;
            /**
             * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
             */
            this.useMicroSurfaceFromReflectivityMapAlpha = false;
            /**
             * In case the reflectivity map does not contain the microsurface information in its alpha channel,
             * The material will try to infer what glossiness each pixel should be.
             */
            this.useAutoMicroSurfaceFromReflectivityMap = false;
            /**
             * Allows to work with scalar in linear mode. This is definitely a matter of preferences and tools used during
             * the creation of the material.
             */
            this.useScalarInLinearSpace = false;
            /**
             * BJS is using an harcoded light falloff based on a manually sets up range.
             * In PBR, one way to represents the fallof is to use the inverse squared root algorythm.
             * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
             */
            this.usePhysicalLightFalloff = true;
            /**
             * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most limunous ones).
             * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
             */
            this.useRadianceOverAlpha = true;
            /**
             * Allows using the bump map in parallax mode.
             */
            this.useParallax = false;
            /**
             * Allows using the bump map in parallax occlusion mode.
             */
            this.useParallaxOcclusion = false;
            /**
             * Controls the scale bias of the parallax mode.
             */
            this.parallaxScaleBias = 0.05;
            /**
             * If sets to true, disables all the lights affecting the material.
             */
            this.disableLighting = false;
            /**
             * Number of Simultaneous lights allowed on the material.
             */
            this.maxSimultaneousLights = 4;
            /**
             * If sets to true, x component of normal map value will invert (x = 1.0 - x).
             */
            this.invertNormalMapX = false;
            /**
             * If sets to true, y component of normal map value will invert (y = 1.0 - y).
             */
            this.invertNormalMapY = false;
            this._renderTargets = new BABYLON.SmartArray(16);
            this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
            this._globalAmbientColor = new BABYLON.Color3(0, 0, 0);
            this._tempColor = new BABYLON.Color3();
            this._defines = new PBRMaterialDefines();
            this._cachedDefines = new PBRMaterialDefines();
            this._myScene = null;
            this._myShadowGenerator = null;
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
        Object.defineProperty(PBRMaterial.prototype, "useLogarithmicDepth", {
            get: function () {
                return this._useLogarithmicDepth;
            },
            set: function (value) {
                this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
            },
            enumerable: true,
            configurable: true
        });
        PBRMaterial.prototype.needAlphaBlending = function () {
            if (this.linkRefractionWithTransparency) {
                return false;
            }
            return (this.alpha < 1.0) || (this.opacityTexture != null) || this._shouldUseAlphaFromAlbedoTexture() || this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled;
        };
        PBRMaterial.prototype.needAlphaTesting = function () {
            if (this.linkRefractionWithTransparency) {
                return false;
            }
            return this.albedoTexture != null && this.albedoTexture.hasAlpha;
        };
        PBRMaterial.prototype._shouldUseAlphaFromAlbedoTexture = function () {
            return this.albedoTexture != null && this.albedoTexture.hasAlpha && this.useAlphaFromAlbedoTexture;
        };
        PBRMaterial.prototype.getAlphaTestTexture = function () {
            return this.albedoTexture;
        };
        PBRMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
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
        PBRMaterial.prototype.convertColorToLinearSpaceToRef = function (color, ref) {
            PBRMaterial.convertColorToLinearSpaceToRef(color, ref, this.useScalarInLinearSpace);
        };
        PBRMaterial.convertColorToLinearSpaceToRef = function (color, ref, useScalarInLinear) {
            if (!useScalarInLinear) {
                color.toLinearSpaceToRef(ref);
            }
            else {
                ref.r = color.r;
                ref.g = color.g;
                ref.b = color.b;
            }
        };
        PBRMaterial.BindLights = function (scene, mesh, effect, defines, useScalarInLinearSpace, maxSimultaneousLights, usePhysicalLightFalloff) {
            var lightIndex = 0;
            var depthValuesAlreadySet = false;
            for (var index = 0; index < scene.lights.length; index++) {
                var light = scene.lights[index];
                if (!light.isEnabled()) {
                    continue;
                }
                if (!light.canAffectMesh(mesh)) {
                    continue;
                }
                BABYLON.MaterialHelper.BindLightProperties(light, effect, lightIndex);
                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(light.diffuse, PBRMaterial._scaledAlbedo, useScalarInLinearSpace);
                PBRMaterial._scaledAlbedo.scaleToRef(light.intensity, PBRMaterial._scaledAlbedo);
                effect.setColor4("vLightDiffuse" + lightIndex, PBRMaterial._scaledAlbedo, usePhysicalLightFalloff ? light.radius : light.range);
                if (defines["SPECULARTERM"]) {
                    this.convertColorToLinearSpaceToRef(light.specular, PBRMaterial._scaledReflectivity, useScalarInLinearSpace);
                    PBRMaterial._scaledReflectivity.scaleToRef(light.intensity, PBRMaterial._scaledReflectivity);
                    effect.setColor3("vLightSpecular" + lightIndex, PBRMaterial._scaledReflectivity);
                }
                // Shadows
                if (scene.shadowsEnabled) {
                    depthValuesAlreadySet = BABYLON.MaterialHelper.BindLightShadow(light, scene, mesh, lightIndex, effect, depthValuesAlreadySet);
                }
                lightIndex++;
                if (lightIndex === maxSimultaneousLights)
                    break;
            }
        };
        PBRMaterial.prototype.isReady = function (mesh, useInstances) {
            if (this.checkReadyOnlyOnce) {
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
            if (scene.texturesEnabled) {
                // Textures
                if (scene.texturesEnabled) {
                    if (scene.getEngine().getCaps().textureLOD) {
                        this._defines.LODBASEDMICROSFURACE = true;
                    }
                    if (this.albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        if (!this.albedoTexture.isReady()) {
                            return false;
                        }
                        else {
                            needUVs = true;
                            this._defines.ALBEDO = true;
                        }
                    }
                    if (this.ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                        if (!this.ambientTexture.isReady()) {
                            return false;
                        }
                        else {
                            needUVs = true;
                            this._defines.AMBIENT = true;
                        }
                    }
                    if (this.opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
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
                    if (this.reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                        if (!this.reflectionTexture.isReady()) {
                            return false;
                        }
                        else {
                            needNormals = true;
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
                            }
                            if (this.reflectionTexture instanceof BABYLON.HDRCubeTexture && this.reflectionTexture) {
                                this._defines.USESPHERICALFROMREFLECTIONMAP = true;
                                needNormals = true;
                                if (this.reflectionTexture.isPMREM) {
                                    this._defines.USEPMREMREFLECTION = true;
                                }
                            }
                        }
                    }
                    if (this.lightmapTexture && BABYLON.StandardMaterial.LightmapTextureEnabled) {
                        if (!this.lightmapTexture.isReady()) {
                            return false;
                        }
                        else {
                            needUVs = true;
                            this._defines.LIGHTMAP = true;
                            this._defines.USELIGHTMAPASSHADOWMAP = this.useLightmapAsShadowmap;
                        }
                    }
                    if (this.emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                        if (!this.emissiveTexture.isReady()) {
                            return false;
                        }
                        else {
                            needUVs = true;
                            this._defines.EMISSIVE = true;
                        }
                    }
                    if (this.reflectivityTexture && BABYLON.StandardMaterial.SpecularTextureEnabled) {
                        if (!this.reflectivityTexture.isReady()) {
                            return false;
                        }
                        else {
                            needUVs = true;
                            this._defines.REFLECTIVITY = true;
                            this._defines.MICROSURFACEFROMREFLECTIVITYMAP = this.useMicroSurfaceFromReflectivityMapAlpha;
                            this._defines.MICROSURFACEAUTOMATIC = this.useAutoMicroSurfaceFromReflectivityMap;
                        }
                    }
                }
                if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
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
                if (this.refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                    if (!this.refractionTexture.isReady()) {
                        return false;
                    }
                    else {
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
                }
                if (this.cameraColorGradingTexture && BABYLON.StandardMaterial.ColorGradingTextureEnabled) {
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
            if (scene.lightsEnabled && !this.disableLighting) {
                needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines, this.maxSimultaneousLights) || needNormals;
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
                    needNormals = true;
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
                var shaderName = "pbr";
                if (!scene.getEngine().getCaps().standardDerivatives) {
                    shaderName = "legacypbr";
                }
                var join = this._defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vAlbedoColor", "vReflectivityColor", "vEmissiveColor", "vReflectionColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vAlbedoInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vReflectivityInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                    "mBones",
                    "vClipPlane", "albedoMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "reflectivityMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                    "depthValues",
                    "opacityParts", "emissiveLeftColor", "emissiveRightColor",
                    "vLightingIntensity", "vOverloadedShadowIntensity", "vOverloadedIntensity", "vOverloadedAlbedo", "vOverloadedReflection", "vOverloadedReflectivity", "vOverloadedEmissive", "vOverloadedMicroSurface",
                    "logarithmicDepthConstant",
                    "vSphericalX", "vSphericalY", "vSphericalZ",
                    "vSphericalXX", "vSphericalYY", "vSphericalZZ",
                    "vSphericalXY", "vSphericalYZ", "vSphericalZX",
                    "vMicrosurfaceTextureLods",
                    "vCameraInfos"
                ];
                var samplers = ["albedoSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "reflectivitySampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler"];
                BABYLON.ColorCurves.PrepareUniforms(uniforms);
                BABYLON.ColorGradingTexture.PrepareUniformsAndSamplers(uniforms, samplers);
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList(uniforms, samplers, this._defines, this.maxSimultaneousLights);
                this._effect = scene.getEngine().createEffect(shaderName, attribs, uniforms, samplers, join, fallbacks, this.onCompiled, this.onError, { maxSimultaneousLights: this.maxSimultaneousLights });
            }
            if (!this._effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new PBRMaterialDefines();
                }
                this._defines.cloneTo(mesh._materialDefines);
            }
            return true;
        };
        PBRMaterial.prototype.unbind = function () {
            if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
                this._effect.setTexture("reflection2DSampler", null);
            }
            if (this.refractionTexture && this.refractionTexture.isRenderTarget) {
                this._effect.setTexture("refraction2DSampler", null);
            }
            _super.prototype.unbind.call(this);
        };
        PBRMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        PBRMaterial.prototype.bind = function (world, mesh) {
            this._myScene = this.getScene();
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._effect);
            if (this._myScene.getCachedMaterial() !== this) {
                this._effect.setMatrix("viewProjection", this._myScene.getTransformMatrix());
                if (BABYLON.StandardMaterial.FresnelEnabled) {
                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        this._effect.setColor4("opacityParts", new BABYLON.Color3(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power);
                    }
                    if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                        this._effect.setColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                        this._effect.setColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                    }
                }
                // Textures        
                if (this._myScene.texturesEnabled) {
                    if (this.albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        this._effect.setTexture("albedoSampler", this.albedoTexture);
                        this._effect.setFloat2("vAlbedoInfos", this.albedoTexture.coordinatesIndex, this.albedoTexture.level);
                        this._effect.setMatrix("albedoMatrix", this.albedoTexture.getTextureMatrix());
                    }
                    if (this.ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                        this._effect.setTexture("ambientSampler", this.ambientTexture);
                        this._effect.setFloat3("vAmbientInfos", this.ambientTexture.coordinatesIndex, this.ambientTexture.level, this.ambientTextureStrength);
                        this._effect.setMatrix("ambientMatrix", this.ambientTexture.getTextureMatrix());
                    }
                    if (this.opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                        this._effect.setTexture("opacitySampler", this.opacityTexture);
                        this._effect.setFloat2("vOpacityInfos", this.opacityTexture.coordinatesIndex, this.opacityTexture.level);
                        this._effect.setMatrix("opacityMatrix", this.opacityTexture.getTextureMatrix());
                    }
                    if (this.reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                        this._microsurfaceTextureLods.x = Math.round(Math.log(this.reflectionTexture.getSize().width) * Math.LOG2E);
                        if (this.reflectionTexture.isCube) {
                            this._effect.setTexture("reflectionCubeSampler", this.reflectionTexture);
                        }
                        else {
                            this._effect.setTexture("reflection2DSampler", this.reflectionTexture);
                        }
                        this._effect.setMatrix("reflectionMatrix", this.reflectionTexture.getReflectionTextureMatrix());
                        this._effect.setFloat2("vReflectionInfos", this.reflectionTexture.level, 0);
                        if (this._defines.USESPHERICALFROMREFLECTIONMAP) {
                            this._effect.setFloat3("vSphericalX", this.reflectionTexture.sphericalPolynomial.x.x, this.reflectionTexture.sphericalPolynomial.x.y, this.reflectionTexture.sphericalPolynomial.x.z);
                            this._effect.setFloat3("vSphericalY", this.reflectionTexture.sphericalPolynomial.y.x, this.reflectionTexture.sphericalPolynomial.y.y, this.reflectionTexture.sphericalPolynomial.y.z);
                            this._effect.setFloat3("vSphericalZ", this.reflectionTexture.sphericalPolynomial.z.x, this.reflectionTexture.sphericalPolynomial.z.y, this.reflectionTexture.sphericalPolynomial.z.z);
                            this._effect.setFloat3("vSphericalXX", this.reflectionTexture.sphericalPolynomial.xx.x, this.reflectionTexture.sphericalPolynomial.xx.y, this.reflectionTexture.sphericalPolynomial.xx.z);
                            this._effect.setFloat3("vSphericalYY", this.reflectionTexture.sphericalPolynomial.yy.x, this.reflectionTexture.sphericalPolynomial.yy.y, this.reflectionTexture.sphericalPolynomial.yy.z);
                            this._effect.setFloat3("vSphericalZZ", this.reflectionTexture.sphericalPolynomial.zz.x, this.reflectionTexture.sphericalPolynomial.zz.y, this.reflectionTexture.sphericalPolynomial.zz.z);
                            this._effect.setFloat3("vSphericalXY", this.reflectionTexture.sphericalPolynomial.xy.x, this.reflectionTexture.sphericalPolynomial.xy.y, this.reflectionTexture.sphericalPolynomial.xy.z);
                            this._effect.setFloat3("vSphericalYZ", this.reflectionTexture.sphericalPolynomial.yz.x, this.reflectionTexture.sphericalPolynomial.yz.y, this.reflectionTexture.sphericalPolynomial.yz.z);
                            this._effect.setFloat3("vSphericalZX", this.reflectionTexture.sphericalPolynomial.zx.x, this.reflectionTexture.sphericalPolynomial.zx.y, this.reflectionTexture.sphericalPolynomial.zx.z);
                        }
                    }
                    if (this.emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                        this._effect.setTexture("emissiveSampler", this.emissiveTexture);
                        this._effect.setFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
                        this._effect.setMatrix("emissiveMatrix", this.emissiveTexture.getTextureMatrix());
                    }
                    if (this.lightmapTexture && BABYLON.StandardMaterial.LightmapTextureEnabled) {
                        this._effect.setTexture("lightmapSampler", this.lightmapTexture);
                        this._effect.setFloat2("vLightmapInfos", this.lightmapTexture.coordinatesIndex, this.lightmapTexture.level);
                        this._effect.setMatrix("lightmapMatrix", this.lightmapTexture.getTextureMatrix());
                    }
                    if (this.reflectivityTexture && BABYLON.StandardMaterial.SpecularTextureEnabled) {
                        this._effect.setTexture("reflectivitySampler", this.reflectivityTexture);
                        this._effect.setFloat2("vReflectivityInfos", this.reflectivityTexture.coordinatesIndex, this.reflectivityTexture.level);
                        this._effect.setMatrix("reflectivityMatrix", this.reflectivityTexture.getTextureMatrix());
                    }
                    if (this.bumpTexture && this._myScene.getEngine().getCaps().standardDerivatives && BABYLON.StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                        this._effect.setTexture("bumpSampler", this.bumpTexture);
                        this._effect.setFloat3("vBumpInfos", this.bumpTexture.coordinatesIndex, 1.0 / this.bumpTexture.level, this.parallaxScaleBias);
                        this._effect.setMatrix("bumpMatrix", this.bumpTexture.getTextureMatrix());
                    }
                    if (this.refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                        this._microsurfaceTextureLods.y = Math.round(Math.log(this.refractionTexture.getSize().width) * Math.LOG2E);
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
                    if ((this.reflectionTexture || this.refractionTexture)) {
                        this._effect.setFloat2("vMicrosurfaceTextureLods", this._microsurfaceTextureLods.x, this._microsurfaceTextureLods.y);
                    }
                    if (this.cameraColorGradingTexture && BABYLON.StandardMaterial.ColorGradingTextureEnabled) {
                        BABYLON.ColorGradingTexture.Bind(this.cameraColorGradingTexture, this._effect);
                    }
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._effect, this._myScene);
                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }
                // Colors
                this._myScene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);
                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(this.reflectivityColor, PBRMaterial._scaledReflectivity);
                this._effect.setVector3("vEyePosition", this._myScene._mirroredCameraPosition ? this._myScene._mirroredCameraPosition : this._myScene.activeCamera.position);
                this._effect.setColor3("vAmbientColor", this._globalAmbientColor);
                this._effect.setColor4("vReflectivityColor", PBRMaterial._scaledReflectivity, this.microSurface);
                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(this.emissiveColor, PBRMaterial._scaledEmissive);
                this._effect.setColor3("vEmissiveColor", PBRMaterial._scaledEmissive);
                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(this.reflectionColor, PBRMaterial._scaledReflection);
                this._effect.setColor3("vReflectionColor", PBRMaterial._scaledReflection);
            }
            if (this._myScene.getCachedMaterial() !== this || !this.isFrozen) {
                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(this.albedoColor, PBRMaterial._scaledAlbedo);
                this._effect.setColor4("vAlbedoColor", PBRMaterial._scaledAlbedo, this.alpha * mesh.visibility);
                // Lights
                if (this._myScene.lightsEnabled && !this.disableLighting) {
                    PBRMaterial.BindLights(this._myScene, mesh, this._effect, this._defines, this.useScalarInLinearSpace, this.maxSimultaneousLights, this.usePhysicalLightFalloff);
                }
                // View
                if (this._myScene.fogEnabled && mesh.applyFog && this._myScene.fogMode !== BABYLON.Scene.FOGMODE_NONE || this.reflectionTexture) {
                    this._effect.setMatrix("view", this._myScene.getViewMatrix());
                }
                // Fog
                BABYLON.MaterialHelper.BindFogParameters(this._myScene, mesh, this._effect);
                this._lightingInfos.x = this.directIntensity;
                this._lightingInfos.y = this.emissiveIntensity;
                this._lightingInfos.z = this.environmentIntensity;
                this._lightingInfos.w = this.specularIntensity;
                this._effect.setVector4("vLightingIntensity", this._lightingInfos);
                this._overloadedShadowInfos.x = this.overloadedShadowIntensity;
                this._overloadedShadowInfos.y = this.overloadedShadeIntensity;
                this._effect.setVector4("vOverloadedShadowIntensity", this._overloadedShadowInfos);
                this._cameraInfos.x = this.cameraExposure;
                this._cameraInfos.y = this.cameraContrast;
                this._effect.setVector4("vCameraInfos", this._cameraInfos);
                if (this.cameraColorCurves) {
                    BABYLON.ColorCurves.Bind(this.cameraColorCurves, this._effect);
                }
                this._overloadedIntensity.x = this.overloadedAmbientIntensity;
                this._overloadedIntensity.y = this.overloadedAlbedoIntensity;
                this._overloadedIntensity.z = this.overloadedReflectivityIntensity;
                this._overloadedIntensity.w = this.overloadedEmissiveIntensity;
                this._effect.setVector4("vOverloadedIntensity", this._overloadedIntensity);
                this.convertColorToLinearSpaceToRef(this.overloadedAmbient, this._tempColor);
                this._effect.setColor3("vOverloadedAmbient", this._tempColor);
                this.convertColorToLinearSpaceToRef(this.overloadedAlbedo, this._tempColor);
                this._effect.setColor3("vOverloadedAlbedo", this._tempColor);
                this.convertColorToLinearSpaceToRef(this.overloadedReflectivity, this._tempColor);
                this._effect.setColor3("vOverloadedReflectivity", this._tempColor);
                this.convertColorToLinearSpaceToRef(this.overloadedEmissive, this._tempColor);
                this._effect.setColor3("vOverloadedEmissive", this._tempColor);
                this.convertColorToLinearSpaceToRef(this.overloadedReflection, this._tempColor);
                this._effect.setColor3("vOverloadedReflection", this._tempColor);
                this._overloadedMicroSurface.x = this.overloadedMicroSurface;
                this._overloadedMicroSurface.y = this.overloadedMicroSurfaceIntensity;
                this._overloadedMicroSurface.z = this.overloadedReflectionIntensity;
                this._effect.setVector3("vOverloadedMicroSurface", this._overloadedMicroSurface);
                // Log. depth
                BABYLON.MaterialHelper.BindLogDepth(this._defines, this._effect, this._myScene);
            }
            _super.prototype.bind.call(this, world, mesh);
            this._myScene = null;
        };
        PBRMaterial.prototype.getAnimatables = function () {
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
            if (this.reflectivityTexture && this.reflectivityTexture.animations && this.reflectivityTexture.animations.length > 0) {
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
        PBRMaterial.prototype.dispose = function (forceDisposeEffect, forceDisposeTextures) {
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
            _super.prototype.dispose.call(this, forceDisposeEffect, forceDisposeTextures);
        };
        PBRMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new PBRMaterial(name, _this.getScene()); }, this);
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
        PBRMaterial._scaledAlbedo = new BABYLON.Color3();
        PBRMaterial._scaledReflectivity = new BABYLON.Color3();
        PBRMaterial._scaledEmissive = new BABYLON.Color3();
        PBRMaterial._scaledReflection = new BABYLON.Color3();
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "directIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "emissiveIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "environmentIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "specularIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "disableBumpMap", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedShadowIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedShadeIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "cameraExposure", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "cameraContrast", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "cameraColorGradingTexture", void 0);
        __decorate([
            BABYLON.serializeAsColorCurves()
        ], PBRMaterial.prototype, "cameraColorCurves", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedAmbient", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedAmbientIntensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedAlbedo", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedAlbedoIntensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedReflectivity", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedReflectivityIntensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedEmissive", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedEmissiveIntensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedReflection", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedReflectionIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedMicroSurface", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedMicroSurfaceIntensity", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "albedoTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "ambientTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "ambientTextureStrength", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "opacityTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "reflectionTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "emissiveTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "reflectivityTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "bumpTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "lightmapTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "refractionTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3("ambient")
        ], PBRMaterial.prototype, "ambientColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("albedo")
        ], PBRMaterial.prototype, "albedoColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("reflectivity")
        ], PBRMaterial.prototype, "reflectivityColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("reflection")
        ], PBRMaterial.prototype, "reflectionColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("emissive")
        ], PBRMaterial.prototype, "emissiveColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "microSurface", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "indexOfRefraction", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "invertRefractionY", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], PBRMaterial.prototype, "opacityFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], PBRMaterial.prototype, "emissiveFresnelParameters", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "linkRefractionWithTransparency", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "linkEmissiveWithAlbedo", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useLightmapAsShadowmap", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useEmissiveAsIllumination", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useAlphaFromAlbedoTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useSpecularOverAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useMicroSurfaceFromReflectivityMapAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useAutoMicroSurfaceFromReflectivityMap", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useScalarInLinearSpace", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "usePhysicalLightFalloff", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useRadianceOverAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useParallax", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useParallaxOcclusion", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "parallaxScaleBias", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "invertNormalMapX", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "invertNormalMapY", void 0);
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useLogarithmicDepth", null);
        return PBRMaterial;
    }(BABYLON.Material));
    BABYLON.PBRMaterial = PBRMaterial;
})(BABYLON || (BABYLON = {}));
