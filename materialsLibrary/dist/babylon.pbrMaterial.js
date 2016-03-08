/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var BABYLON;
(function (BABYLON) {
    var maxSimultaneousLights = 4;
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
            this.LIGHT0 = false;
            this.LIGHT1 = false;
            this.LIGHT2 = false;
            this.LIGHT3 = false;
            this.SPOTLIGHT0 = false;
            this.SPOTLIGHT1 = false;
            this.SPOTLIGHT2 = false;
            this.SPOTLIGHT3 = false;
            this.HEMILIGHT0 = false;
            this.HEMILIGHT1 = false;
            this.HEMILIGHT2 = false;
            this.HEMILIGHT3 = false;
            this.POINTLIGHT0 = false;
            this.POINTLIGHT1 = false;
            this.POINTLIGHT2 = false;
            this.POINTLIGHT3 = false;
            this.DIRLIGHT0 = false;
            this.DIRLIGHT1 = false;
            this.DIRLIGHT2 = false;
            this.DIRLIGHT3 = false;
            this.SPECULARTERM = false;
            this.SHADOW0 = false;
            this.SHADOW1 = false;
            this.SHADOW2 = false;
            this.SHADOW3 = false;
            this.SHADOWS = false;
            this.SHADOWVSM0 = false;
            this.SHADOWVSM1 = false;
            this.SHADOWVSM2 = false;
            this.SHADOWVSM3 = false;
            this.SHADOWPCF0 = false;
            this.SHADOWPCF1 = false;
            this.SHADOWPCF2 = false;
            this.SHADOWPCF3 = false;
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
            this._keys = Object.keys(this);
        }
        return PBRMaterialDefines;
    })(BABYLON.MaterialDefines);
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
            this.overloadedReflectivity = BABYLON.Color3.White();
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
            this.disableLighting = false;
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
        PBRMaterial.BindLights = function (scene, mesh, effect, defines, useScalarInLinearSpace) {
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
                this._lightRadiuses[lightIndex] = light.radius;
                BABYLON.MaterialHelper.BindLightProperties(light, effect, lightIndex);
                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(light.diffuse, PBRMaterial._scaledAlbedo, useScalarInLinearSpace);
                PBRMaterial._scaledAlbedo.scaleToRef(light.intensity, PBRMaterial._scaledAlbedo);
                effect.setColor4("vLightDiffuse" + lightIndex, PBRMaterial._scaledAlbedo, light.range);
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
            effect.setFloat4("vLightRadiuses", this._lightRadiuses[0], this._lightRadiuses[1], this._lightRadiuses[2], this._lightRadiuses[3]);
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
                needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines) || needNormals;
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
                BABYLON.MaterialHelper.HandleFallbacksForShadows(this._defines, fallbacks);
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
                this._effect = scene.getEngine().createEffect(shaderName, attribs, ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vAlbedoColor", "vReflectivityColor", "vEmissiveColor", "vReflectionColor",
                    "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                    "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                    "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                    "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vAlbedoInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vReflectivityInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                    "mBones",
                    "vClipPlane", "albedoMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "reflectivityMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                    "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3", "depthValues",
                    "opacityParts", "emissiveLeftColor", "emissiveRightColor",
                    "vLightingIntensity", "vOverloadedShadowIntensity", "vOverloadedIntensity", "vCameraInfos", "vOverloadedAlbedo", "vOverloadedReflection", "vOverloadedReflectivity", "vOverloadedEmissive", "vOverloadedMicroSurface",
                    "logarithmicDepthConstant",
                    "vSphericalX", "vSphericalY", "vSphericalZ",
                    "vSphericalXX", "vSphericalYY", "vSphericalZZ",
                    "vSphericalXY", "vSphericalYZ", "vSphericalZX",
                    "vMicrosurfaceTextureLods", "vLightRadiuses"
                ], ["albedoSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "reflectivitySampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler",
                    "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3"
                ], join, fallbacks, this.onCompiled, this.onError);
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
                        this._effect.setFloat2("vAmbientInfos", this.ambientTexture.coordinatesIndex, this.ambientTexture.level);
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
                    PBRMaterial.BindLights(this._myScene, mesh, this._effect, this._defines, this.useScalarInLinearSpace);
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
            return results;
        };
        PBRMaterial.prototype.dispose = function (forceDisposeEffect) {
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
            _super.prototype.dispose.call(this, forceDisposeEffect);
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
        PBRMaterial._lightRadiuses = [1, 1, 1, 1];
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "directIntensity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "emissiveIntensity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "environmentIntensity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "specularIntensity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "disableBumpMap");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedShadowIntensity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedShadeIntensity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "cameraExposure");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "cameraContrast");
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedAmbient");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedAmbientIntensity");
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedAlbedo");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedAlbedoIntensity");
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedReflectivity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedReflectivityIntensity");
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedEmissive");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedEmissiveIntensity");
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedReflection");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedReflectionIntensity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedMicroSurface");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedMicroSurfaceIntensity");
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "albedoTexture");
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "ambientTexture");
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "opacityTexture");
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "reflectionTexture");
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "emissiveTexture");
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "reflectivityTexture");
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "bumpTexture");
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "lightmapTexture");
        __decorate([
            BABYLON.serializeAsTexture()
        ], PBRMaterial.prototype, "refractionTexture");
        __decorate([
            BABYLON.serializeAsColor3("ambient")
        ], PBRMaterial.prototype, "ambientColor");
        __decorate([
            BABYLON.serializeAsColor3("albedo")
        ], PBRMaterial.prototype, "albedoColor");
        __decorate([
            BABYLON.serializeAsColor3("reflectivity")
        ], PBRMaterial.prototype, "reflectivityColor");
        __decorate([
            BABYLON.serializeAsColor3("reflection")
        ], PBRMaterial.prototype, "reflectionColor");
        __decorate([
            BABYLON.serializeAsColor3("emissivie")
        ], PBRMaterial.prototype, "emissiveColor");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "microSurface");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "indexOfRefraction");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "invertRefractionY");
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], PBRMaterial.prototype, "opacityFresnelParameters");
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], PBRMaterial.prototype, "emissiveFresnelParameters");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "linkRefractionWithTransparency");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "linkEmissiveWithAlbedo");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useLightmapAsShadowmap");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useEmissiveAsIllumination");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useAlphaFromAlbedoTexture");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useSpecularOverAlpha");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useMicroSurfaceFromReflectivityMapAlpha");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useAutoMicroSurfaceFromReflectivityMap");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useScalarInLinearSpace");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "usePhysicalLightFalloff");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useRadianceOverAlpha");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useParallax");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "useParallaxOcclusion");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "parallaxScaleBias");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "disableLighting");
        Object.defineProperty(PBRMaterial.prototype, "useLogarithmicDepth",
            __decorate([
                BABYLON.serialize()
            ], PBRMaterial.prototype, "useLogarithmicDepth", Object.getOwnPropertyDescriptor(PBRMaterial.prototype, "useLogarithmicDepth")));
        return PBRMaterial;
    })(BABYLON.Material);
    BABYLON.PBRMaterial = PBRMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['pbrVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform mat4 albedoMatrix;\nuniform vec2 vAlbedoInfos;\n#endif\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nvarying vec2 vOpacityUV;\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(REFLECTIVITY)\nvarying vec2 vReflectivityUV;\nuniform vec2 vReflectivityInfos;\nuniform mat4 reflectivityMatrix;\n#endif\n#ifdef BUMP\nvarying vec2 vBumpUV;\nuniform vec2 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<shadowsVertexDeclaration>\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=position;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED\nvDirectionW=normalize(vec3(finalWorld*vec4(position,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef ALBEDO\nif (vAlbedoInfos.x == 0.)\n{\nvAlbedoUV=vec2(albedoMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAlbedoUV=vec2(albedoMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef AMBIENT\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef OPACITY\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef EMISSIVE\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef LIGHTMAP\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(REFLECTIVITY)\nif (vReflectivityInfos.x == 0.)\n{\nvReflectivityUV=vec2(reflectivityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvReflectivityUV=vec2(reflectivityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef BUMP\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#include<shadowsVertex>\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['pbrPixelShader'] = "#ifdef BUMP\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LODBASEDMICROSFURACE\n#extension GL_EXT_shader_texture_lod : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\nprecision highp float;\n\n#define RECIPROCAL_PI2 0.15915494\n#define FRESNEL_MAXIMUM_ON_ROUGH 0.25\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\nuniform vec3 vReflectionColor;\nuniform vec4 vAlbedoColor;\nuniform vec4 vLightRadiuses;\n\nuniform vec4 vLightingIntensity;\nuniform vec4 vCameraInfos;\n#ifdef OVERLOADEDVALUES\nuniform vec4 vOverloadedIntensity;\nuniform vec3 vOverloadedAmbient;\nuniform vec3 vOverloadedAlbedo;\nuniform vec3 vOverloadedReflectivity;\nuniform vec3 vOverloadedEmissive;\nuniform vec3 vOverloadedReflection;\nuniform vec3 vOverloadedMicroSurface;\n#endif\n#ifdef OVERLOADEDSHADOWVALUES\nuniform vec4 vOverloadedShadowIntensity;\n#endif\n#ifdef USESPHERICALFROMREFLECTIONMAP\nuniform vec3 vSphericalX;\nuniform vec3 vSphericalY;\nuniform vec3 vSphericalZ;\nuniform vec3 vSphericalXX;\nuniform vec3 vSphericalYY;\nuniform vec3 vSphericalZZ;\nuniform vec3 vSphericalXY;\nuniform vec3 vSphericalYZ;\nuniform vec3 vSphericalZX;\nvec3 EnvironmentIrradiance(vec3 normal)\n{\n\n\n\nvec3 result =\nvSphericalX*normal.x +\nvSphericalY*normal.y +\nvSphericalZ*normal.z +\nvSphericalXX*normal.x*normal.x +\nvSphericalYY*normal.y*normal.y +\nvSphericalZZ*normal.z*normal.z +\nvSphericalYZ*normal.y*normal.z +\nvSphericalZX*normal.z*normal.x +\nvSphericalXY*normal.x*normal.y;\nreturn result.rgb;\n}\n#endif\n#if defined(REFLECTION) || defined(REFRACTION)\nuniform vec2 vMicrosurfaceTextureLods;\n#endif\n\nconst float kPi=3.1415926535897932384626433832795;\nconst float kRougnhessToAlphaScale=0.1;\nconst float kRougnhessToAlphaOffset=0.29248125;\n#include<helperFunctions>\n\nfloat getMipMapIndexFromAverageSlope(float maxMipLevel,float alpha)\n{\n\n\n\n\n\n\n\nfloat mip=kRougnhessToAlphaOffset+maxMipLevel+(maxMipLevel*kRougnhessToAlphaScale*log2(alpha));\nreturn clamp(mip,0.,maxMipLevel);\n}\nfloat getMipMapIndexFromAverageSlopeWithPMREM(float maxMipLevel,float alphaG)\n{\nfloat specularPower=clamp(2./alphaG-2.,0.000001,2048.);\n\nreturn clamp(- 0.5*log2(specularPower)+5.5,0.,maxMipLevel);\n}\n\nfloat smithVisibilityG1_TrowbridgeReitzGGX(float dot,float alphaG)\n{\nfloat tanSquared=(1.0-dot*dot)/(dot*dot);\nreturn 2.0/(1.0+sqrt(1.0+alphaG*alphaG*tanSquared));\n}\nfloat smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL,float NdotV,float alphaG)\n{\nreturn smithVisibilityG1_TrowbridgeReitzGGX(NdotL,alphaG)*smithVisibilityG1_TrowbridgeReitzGGX(NdotV,alphaG);\n}\n\n\nfloat normalDistributionFunction_TrowbridgeReitzGGX(float NdotH,float alphaG)\n{\n\n\n\nfloat a2=Square(alphaG);\nfloat d=NdotH*NdotH*(a2-1.0)+1.0;\nreturn a2/(kPi*d*d);\n}\nvec3 fresnelSchlickGGX(float VdotH,vec3 reflectance0,vec3 reflectance90)\n{\nreturn reflectance0+(reflectance90-reflectance0)*pow(clamp(1.0-VdotH,0.,1.),5.0);\n}\nvec3 FresnelSchlickEnvironmentGGX(float VdotN,vec3 reflectance0,vec3 reflectance90,float smoothness)\n{\n\nfloat weight=mix(FRESNEL_MAXIMUM_ON_ROUGH,1.0,smoothness);\nreturn reflectance0+weight*(reflectance90-reflectance0)*pow(clamp(1.0-VdotN,0.,1.),5.0);\n}\n\nvec3 computeSpecularTerm(float NdotH,float NdotL,float NdotV,float VdotH,float roughness,vec3 specularColor)\n{\nfloat alphaG=convertRoughnessToAverageSlope(roughness);\nfloat distribution=normalDistributionFunction_TrowbridgeReitzGGX(NdotH,alphaG);\nfloat visibility=smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL,NdotV,alphaG);\nvisibility/=(4.0*NdotL*NdotV); \nvec3 fresnel=fresnelSchlickGGX(VdotH,specularColor,vec3(1.,1.,1.));\nfloat specTerm=max(0.,visibility*distribution)*NdotL;\nreturn fresnel*specTerm*kPi; \n}\nfloat computeDiffuseTerm(float NdotL,float NdotV,float VdotH,float roughness)\n{\n\n\nfloat diffuseFresnelNV=pow(clamp(1.0-NdotL,0.000001,1.),5.0);\nfloat diffuseFresnelNL=pow(clamp(1.0-NdotV,0.000001,1.),5.0);\nfloat diffuseFresnel90=0.5+2.0*VdotH*VdotH*roughness;\nfloat diffuseFresnelTerm =\n(1.0+(diffuseFresnel90-1.0)*diffuseFresnelNL) *\n(1.0+(diffuseFresnel90-1.0)*diffuseFresnelNV);\nreturn diffuseFresnelTerm*NdotL;\n\n\n}\nfloat adjustRoughnessFromLightProperties(float roughness,float lightRadius,float lightDistance)\n{\n\nfloat lightRoughness=lightRadius/lightDistance;\n\nfloat totalRoughness=clamp(lightRoughness+roughness,0.,1.);\nreturn totalRoughness;\n}\nfloat computeDefaultMicroSurface(float microSurface,vec3 reflectivityColor)\n{\nfloat kReflectivityNoAlphaWorkflow_SmoothnessMax=0.95;\nfloat reflectivityLuminance=getLuminance(reflectivityColor);\nfloat reflectivityLuma=sqrt(reflectivityLuminance);\nmicroSurface=reflectivityLuma*kReflectivityNoAlphaWorkflow_SmoothnessMax;\nreturn microSurface;\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn vec3(pow(color.r,2.2),pow(color.g,2.2),pow(color.b,2.2));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn vec3(pow(color.r,1.0/2.2),pow(color.g,1.0/2.2),pow(color.b,1.0/2.2));\n}\nfloat computeLightFalloff(vec3 lightOffset,float lightDistanceSquared,float range)\n{\n#ifdef USEPHYSICALLIGHTFALLOFF\nfloat lightDistanceFalloff=1.0/((lightDistanceSquared+0.0001));\nreturn lightDistanceFalloff;\n#else\nfloat lightFalloff=max(0.,1.0-length(lightOffset)/range);\nreturn lightFalloff;\n#endif\n}\n#ifdef CAMERATONEMAP\nvec3 toneMaps(vec3 color)\n{\ncolor=max(color,0.0);\n\ncolor.rgb=color.rgb*vCameraInfos.x;\nfloat tuning=1.5; \n\n\nvec3 tonemapped=1.0-exp2(-color.rgb*tuning); \ncolor.rgb=mix(color.rgb,tonemapped,1.0);\nreturn color;\n}\n#endif\n#ifdef CAMERACONTRAST\nvec4 contrasts(vec4 color)\n{\ncolor=clamp(color,0.0,1.0);\nvec3 resultHighContrast=color.rgb*color.rgb*(3.0-2.0*color.rgb);\nfloat contrast=vCameraInfos.y;\nif (contrast<1.0)\n{\n\ncolor.rgb=mix(vec3(0.5,0.5,0.5),color.rgb,contrast);\n}\nelse\n{\n\ncolor.rgb=mix(color.rgb,resultHighContrast,contrast-1.0);\n}\nreturn color;\n}\n#endif\n\nuniform vec4 vReflectivityColor;\nuniform vec3 vEmissiveColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<lightFragmentDeclaration>[0]\n#include<lightFragmentDeclaration>[1]\n#include<lightFragmentDeclaration>[2]\n#include<lightFragmentDeclaration>[3]\n\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform sampler2D albedoSampler;\nuniform vec2 vAlbedoInfos;\n#endif\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform sampler2D ambientSampler;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nvarying vec2 vOpacityUV;\nuniform sampler2D opacitySampler;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform vec2 vEmissiveInfos;\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\nuniform vec2 vLightmapInfos;\nuniform sampler2D lightmapSampler;\n#endif\n#if defined(REFLECTIVITY)\nvarying vec2 vReflectivityUV;\nuniform vec2 vReflectivityInfos;\nuniform sampler2D reflectivitySampler;\n#endif\n\n#include<fresnelFunction>\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\nuniform mat4 refractionMatrix;\n#endif\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED\nvarying vec3 vDirectionW;\n#endif\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n\n#ifdef SHADOWS\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#if defined(POINTLIGHT0) || defined(POINTLIGHT1) || defined(POINTLIGHT2) || defined(POINTLIGHT3)\nuniform vec2 depthValues;\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float bias)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y =-directionToLight.y;\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight))+bias;\nif (depth>shadow)\n{\n#ifdef OVERLOADEDSHADOWVALUES\nreturn mix(1.0,darkness,vOverloadedShadowIntensity.x);\n#else\nreturn darkness;\n#endif\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float bias,float darkness)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth-depthValues.x)/(depthValues.y-depthValues.x);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\nfloat biasedDepth=depth-bias;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<biasedDepth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<biasedDepth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<biasedDepth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<biasedDepth) visibility-=0.25;\n#ifdef OVERLOADEDSHADOWVALUES\nreturn min(1.0,mix(1.0,visibility+darkness,vOverloadedShadowIntensity.x));\n#else\nreturn min(1.0,visibility+darkness);\n#endif\n}\n#endif\n#if defined(SPOTLIGHT0) || defined(SPOTLIGHT1) || defined(SPOTLIGHT2) || defined(SPOTLIGHT3) || defined(DIRLIGHT0) || defined(DIRLIGHT1) || defined(DIRLIGHT2) || defined(DIRLIGHT3)\nfloat computeShadow(vec4 vPositionFromLight,sampler2D shadowSampler,float darkness,float bias)\n{\nvec3 depth=vPositionFromLight.xyz/vPositionFromLight.w;\ndepth=0.5*depth+vec3(0.5);\nvec2 uv=depth.xy;\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadow=unpack(texture2D(shadowSampler,uv))+bias;\nif (depth.z>shadow)\n{\n#ifdef OVERLOADEDSHADOWVALUES\nreturn mix(1.0,darkness,vOverloadedShadowIntensity.x);\n#else\nreturn darkness;\n#endif\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,sampler2D shadowSampler,float mapSize,float bias,float darkness)\n{\nvec3 depth=vPositionFromLight.xyz/vPositionFromLight.w;\ndepth=0.5*depth+vec3(0.5);\nvec2 uv=depth.xy;\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\nfloat biasedDepth=depth.z-bias;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<biasedDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<biasedDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<biasedDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<biasedDepth) visibility-=0.25;\n#ifdef OVERLOADEDSHADOWVALUES\nreturn min(1.0,mix(1.0,visibility+darkness,vOverloadedShadowIntensity.x));\n#else\nreturn min(1.0,visibility+darkness);\n#endif\n}\n\nfloat unpackHalf(vec2 color)\n{\nreturn color.x+(color.y/255.0);\n}\nfloat linstep(float low,float high,float v) {\nreturn clamp((v-low)/(high-low),0.0,1.0);\n}\nfloat ChebychevInequality(vec2 moments,float compare,float bias)\n{\nfloat p=smoothstep(compare-bias,compare,moments.x);\nfloat variance=max(moments.y-moments.x*moments.x,0.02);\nfloat d=compare-moments.x;\nfloat p_max=linstep(0.2,1.0,variance/(variance+d*d));\nreturn clamp(max(p,p_max),0.0,1.0);\n}\nfloat computeShadowWithVSM(vec4 vPositionFromLight,sampler2D shadowSampler,float bias,float darkness)\n{\nvec3 depth=vPositionFromLight.xyz/vPositionFromLight.w;\ndepth=0.5*depth+vec3(0.5);\nvec2 uv=depth.xy;\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0 || depth.z>=1.0)\n{\nreturn 1.0;\n}\nvec4 texel=texture2D(shadowSampler,uv);\nvec2 moments=vec2(unpackHalf(texel.xy),unpackHalf(texel.zw));\n#ifdef OVERLOADEDSHADOWVALUES\nreturn min(1.0,mix(1.0,1.0-ChebychevInequality(moments,depth.z,bias)+darkness,vOverloadedShadowIntensity.x));\n#else\nreturn min(1.0,1.0-ChebychevInequality(moments,depth.z,bias)+darkness);\n#endif\n}\n#endif\n#endif\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n\n#include<fogFragmentDeclaration>\n\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float roughness,float NdotV,float lightRadius,out float NdotL) {\nlightingInfo result;\nvec3 lightDirection;\nfloat attenuation=1.0;\nfloat lightDistance;\n\nif (lightData.w == 0.)\n{\nvec3 lightOffset=lightData.xyz-vPositionW;\nfloat lightDistanceSquared=dot(lightOffset,lightOffset);\nattenuation=computeLightFalloff(lightOffset,lightDistanceSquared,range);\nlightDistance=sqrt(lightDistanceSquared);\nlightDirection=normalize(lightOffset);\n}\n\nelse\n{\nlightDistance=length(-lightData.xyz);\nlightDirection=normalize(-lightData.xyz);\n}\n\nroughness=adjustRoughnessFromLightProperties(roughness,lightRadius,lightDistance);\n\nvec3 H=normalize(viewDirectionW+lightDirection);\nNdotL=max(0.00000000001,dot(vNormal,lightDirection));\nfloat VdotH=clamp(0.00000000001,1.0,dot(viewDirectionW,H));\nfloat diffuseTerm=computeDiffuseTerm(NdotL,NdotV,VdotH,roughness);\nresult.diffuse=diffuseTerm*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nfloat NdotH=max(0.00000000001,dot(vNormal,H));\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,specularColor);\nresult.specular=specTerm*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float roughness,float NdotV,float lightRadius,out float NdotL) {\nlightingInfo result;\nvec3 lightOffset=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(lightOffset);\n\nfloat cosAngle=max(0.000000000000001,dot(-lightDirection.xyz,lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\n\nfloat lightDistanceSquared=dot(lightOffset,lightOffset);\nfloat attenuation=computeLightFalloff(lightOffset,lightDistanceSquared,range);\n\nattenuation*=cosAngle;\n\nfloat lightDistance=sqrt(lightDistanceSquared);\nroughness=adjustRoughnessFromLightProperties(roughness,lightRadius,lightDistance);\n\nvec3 H=normalize(viewDirectionW-lightDirection.xyz);\nNdotL=max(0.00000000001,dot(vNormal,-lightDirection.xyz));\nfloat VdotH=clamp(dot(viewDirectionW,H),0.00000000001,1.0);\nfloat diffuseTerm=computeDiffuseTerm(NdotL,NdotV,VdotH,roughness);\nresult.diffuse=diffuseTerm*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nfloat NdotH=max(0.00000000001,dot(vNormal,H));\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,specularColor);\nresult.specular=specTerm*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float roughness,float NdotV,float lightRadius,out float NdotL) {\nlightingInfo result;\n\n\n\nNdotL=dot(vNormal,lightData.xyz)*0.5+0.5;\nresult.diffuse=mix(groundColor,diffuseColor,NdotL);\n#ifdef SPECULARTERM\n\nvec3 lightVectorW=normalize(lightData.xyz);\nvec3 H=normalize(viewDirectionW+lightVectorW);\nfloat NdotH=max(0.00000000001,dot(vNormal,H));\nNdotL=max(0.00000000001,NdotL);\nfloat VdotH=clamp(0.00000000001,1.0,dot(viewDirectionW,H));\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,specularColor);\nresult.specular=specTerm;\n#endif\nreturn result;\n}\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 surfaceAlbedo=vec4(1.,1.,1.,1.);\nvec3 surfaceAlbedoContribution=vAlbedoColor.rgb;\n\nfloat alpha=vAlbedoColor.a;\n#ifdef ALBEDO\nsurfaceAlbedo=texture2D(albedoSampler,vAlbedoUV);\nsurfaceAlbedo=vec4(toLinearSpace(surfaceAlbedo.rgb),surfaceAlbedo.a);\n#ifndef LINKREFRACTIONTOTRANSPARENCY\n#ifdef ALPHATEST\nif (surfaceAlbedo.a<0.4)\ndiscard;\n#endif\n#endif\n#ifdef ALPHAFROMALBEDO\nalpha*=surfaceAlbedo.a;\n#endif\nsurfaceAlbedo.rgb*=vAlbedoInfos.y;\n#else\n\nsurfaceAlbedo.rgb=surfaceAlbedoContribution;\nsurfaceAlbedoContribution=vec3(1.,1.,1.);\n#endif\n#ifdef VERTEXCOLOR\nsurfaceAlbedo.rgb*=vColor.rgb;\n#endif\n#ifdef OVERLOADEDVALUES\nsurfaceAlbedo.rgb=mix(surfaceAlbedo.rgb,vOverloadedAlbedo,vOverloadedIntensity.y);\n#endif\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n#include<bumpFragment>\n\nvec3 ambientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nambientColor=texture2D(ambientSampler,vAmbientUV).rgb*vAmbientInfos.y;\n#ifdef OVERLOADEDVALUES\nambientColor.rgb=mix(ambientColor.rgb,vOverloadedAmbient,vOverloadedIntensity.x);\n#endif\n#endif\n\nfloat microSurface=vReflectivityColor.a;\nvec3 surfaceReflectivityColor=vReflectivityColor.rgb;\n#ifdef OVERLOADEDVALUES\nsurfaceReflectivityColor.rgb=mix(surfaceReflectivityColor.rgb,vOverloadedReflectivity,vOverloadedIntensity.z);\n#endif\n#ifdef REFLECTIVITY\nvec4 surfaceReflectivityColorMap=texture2D(reflectivitySampler,vReflectivityUV);\nsurfaceReflectivityColor=surfaceReflectivityColorMap.rgb;\nsurfaceReflectivityColor=toLinearSpace(surfaceReflectivityColor);\n#ifdef OVERLOADEDVALUES\nsurfaceReflectivityColor=mix(surfaceReflectivityColor,vOverloadedReflectivity,vOverloadedIntensity.z);\n#endif\n#ifdef MICROSURFACEFROMREFLECTIVITYMAP\nmicroSurface=surfaceReflectivityColorMap.a;\n#else\n#ifdef MICROSURFACEAUTOMATIC\nmicroSurface=computeDefaultMicroSurface(microSurface,surfaceReflectivityColor);\n#endif\n#endif\n#endif\n#ifdef OVERLOADEDVALUES\nmicroSurface=mix(microSurface,vOverloadedMicroSurface.x,vOverloadedMicroSurface.y);\n#endif\n\nfloat NdotV=max(0.00000000001,dot(normalW,viewDirectionW));\n\nmicroSurface=clamp(microSurface,0.,1.)*0.98;\n\nfloat roughness=clamp(1.-microSurface,0.000001,1.0);\n\nvec3 lightDiffuseContribution=vec3(0.,0.,0.);\n#ifdef OVERLOADEDSHADOWVALUES\nvec3 shadowedOnlyLightDiffuseContribution=vec3(1.,1.,1.);\n#endif\n#ifdef SPECULARTERM\nvec3 lightSpecularContribution= vec3(0.,0.,0.);\n#endif\nfloat notShadowLevel=1.; \nfloat NdotL=-1.;\n#ifdef LIGHT0\n#ifndef SPECULARTERM\nvec3 vLightSpecular0=vec3(0.0);\n#endif\n#ifdef SPOTLIGHT0\nlightingInfo info=computeSpotLighting(viewDirectionW,normalW,vLightData0,vLightDirection0,vLightDiffuse0.rgb,vLightSpecular0,vLightDiffuse0.a,roughness,NdotV,vLightRadiuses[0],NdotL);\n#endif\n#ifdef HEMILIGHT0\nlightingInfo info=computeHemisphericLighting(viewDirectionW,normalW,vLightData0,vLightDiffuse0.rgb,vLightSpecular0,vLightGround0,roughness,NdotV,vLightRadiuses[0],NdotL);\n#endif\n#if defined(POINTLIGHT0) || defined(DIRLIGHT0)\nlightingInfo info=computeLighting(viewDirectionW,normalW,vLightData0,vLightDiffuse0.rgb,vLightSpecular0,vLightDiffuse0.a,roughness,NdotV,vLightRadiuses[0],NdotL);\n#endif\n#ifdef SHADOW0\n#ifdef SHADOWVSM0\nnotShadowLevel=computeShadowWithVSM(vPositionFromLight0,shadowSampler0,shadowsInfo0.z,shadowsInfo0.x);\n#else\n#ifdef SHADOWPCF0\n#if defined(POINTLIGHT0)\nnotShadowLevel=computeShadowWithPCFCube(vLightData0.xyz,shadowSampler0,shadowsInfo0.y,shadowsInfo0.z,shadowsInfo0.x);\n#else\nnotShadowLevel=computeShadowWithPCF(vPositionFromLight0,shadowSampler0,shadowsInfo0.y,shadowsInfo0.z,shadowsInfo0.x);\n#endif\n#else\n#if defined(POINTLIGHT0)\nnotShadowLevel=computeShadowCube(vLightData0.xyz,shadowSampler0,shadowsInfo0.x,shadowsInfo0.z);\n#else\nnotShadowLevel=computeShadow(vPositionFromLight0,shadowSampler0,shadowsInfo0.x,shadowsInfo0.z);\n#endif\n#endif\n#endif\n#else\nnotShadowLevel=1.;\n#endif\nlightDiffuseContribution+=info.diffuse*notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\nif (NdotL<0.000000000011)\n{\nnotShadowLevel=1.;\n}\nshadowedOnlyLightDiffuseContribution*=notShadowLevel;\n#endif\n#ifdef SPECULARTERM\nlightSpecularContribution+=info.specular*notShadowLevel;\n#endif\n#endif\n#ifdef LIGHT1\n#ifndef SPECULARTERM\nvec3 vLightSpecular1=vec3(0.0);\n#endif\n#ifdef SPOTLIGHT1\ninfo=computeSpotLighting(viewDirectionW,normalW,vLightData1,vLightDirection1,vLightDiffuse1.rgb,vLightSpecular1,vLightDiffuse1.a,roughness,NdotV,vLightRadiuses[1],NdotL);\n#endif\n#ifdef HEMILIGHT1\ninfo=computeHemisphericLighting(viewDirectionW,normalW,vLightData1,vLightDiffuse1.rgb,vLightSpecular1,vLightGround1,roughness,NdotV,vLightRadiuses[1],NdotL);\n#endif\n#if defined(POINTLIGHT1) || defined(DIRLIGHT1)\ninfo=computeLighting(viewDirectionW,normalW,vLightData1,vLightDiffuse1.rgb,vLightSpecular1,vLightDiffuse1.a,roughness,NdotV,vLightRadiuses[1],NdotL);\n#endif\n#ifdef SHADOW1\n#ifdef SHADOWVSM1\nnotShadowLevel=computeShadowWithVSM(vPositionFromLight1,shadowSampler1,shadowsInfo1.z,shadowsInfo1.x);\n#else\n#ifdef SHADOWPCF1\n#if defined(POINTLIGHT1)\nnotShadowLevel=computeShadowWithPCFCube(vLightData1.xyz,shadowSampler1,shadowsInfo1.y,shadowsInfo1.z,shadowsInfo1.x);\n#else\nnotShadowLevel=computeShadowWithPCF(vPositionFromLight1,shadowSampler1,shadowsInfo1.y,shadowsInfo1.z,shadowsInfo1.x);\n#endif\n#else\n#if defined(POINTLIGHT1)\nnotShadowLevel=computeShadowCube(vLightData1.xyz,shadowSampler1,shadowsInfo1.x,shadowsInfo1.z);\n#else\nnotShadowLevel=computeShadow(vPositionFromLight1,shadowSampler1,shadowsInfo1.x,shadowsInfo1.z);\n#endif\n#endif\n#endif\n#else\nnotShadowLevel=1.;\n#endif\nlightDiffuseContribution+=info.diffuse*notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\nif (NdotL<0.000000000011)\n{\nnotShadowLevel=1.;\n}\nshadowedOnlyLightDiffuseContribution*=notShadowLevel;\n#endif\n#ifdef SPECULARTERM\nlightSpecularContribution+=info.specular*notShadowLevel;\n#endif\n#endif\n#ifdef LIGHT2\n#ifndef SPECULARTERM\nvec3 vLightSpecular2=vec3(0.0);\n#endif\n#ifdef SPOTLIGHT2\ninfo=computeSpotLighting(viewDirectionW,normalW,vLightData2,vLightDirection2,vLightDiffuse2.rgb,vLightSpecular2,vLightDiffuse2.a,roughness,NdotV,vLightRadiuses[2],NdotL);\n#endif\n#ifdef HEMILIGHT2\ninfo=computeHemisphericLighting(viewDirectionW,normalW,vLightData2,vLightDiffuse2.rgb,vLightSpecular2,vLightGround2,roughness,NdotV,vLightRadiuses[2],NdotL);\n#endif\n#if defined(POINTLIGHT2) || defined(DIRLIGHT2)\ninfo=computeLighting(viewDirectionW,normalW,vLightData2,vLightDiffuse2.rgb,vLightSpecular2,vLightDiffuse2.a,roughness,NdotV,vLightRadiuses[2],NdotL);\n#endif\n#ifdef SHADOW2\n#ifdef SHADOWVSM2\nnotShadowLevel=computeShadowWithVSM(vPositionFromLight2,shadowSampler2,shadowsInfo2.z,shadowsInfo2.x);\n#else\n#ifdef SHADOWPCF2\n#if defined(POINTLIGHT2)\nnotShadowLevel=computeShadowWithPCFCube(vLightData2.xyz,shadowSampler2,shadowsInfo2.y,shadowsInfo2.z,shadowsInfo2.x);\n#else\nnotShadowLevel=computeShadowWithPCF(vPositionFromLight2,shadowSampler2,shadowsInfo2.y,shadowsInfo2.z,shadowsInfo2.x);\n#endif\n#else\n#if defined(POINTLIGHT2)\nnotShadowLevel=computeShadowCube(vLightData2.xyz,shadowSampler2,shadowsInfo2.x,shadowsInfo2.z);\n#else\nnotShadowLevel=computeShadow(vPositionFromLight2,shadowSampler2,shadowsInfo2.x,shadowsInfo2.z);\n#endif\n#endif \n#endif \n#else\nnotShadowLevel=1.;\n#endif\nlightDiffuseContribution+=info.diffuse*notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\nif (NdotL<0.000000000011)\n{\nnotShadowLevel=1.;\n}\nshadowedOnlyLightDiffuseContribution*=notShadowLevel;\n#endif\n#ifdef SPECULARTERM\nlightSpecularContribution+=info.specular*notShadowLevel;\n#endif\n#endif\n#ifdef LIGHT3\n#ifndef SPECULARTERM\nvec3 vLightSpecular3=vec3(0.0);\n#endif\n#ifdef SPOTLIGHT3\ninfo=computeSpotLighting(viewDirectionW,normalW,vLightData3,vLightDirection3,vLightDiffuse3.rgb,vLightSpecular3,vLightDiffuse3.a,roughness,NdotV,vLightRadiuses[3],NdotL);\n#endif\n#ifdef HEMILIGHT3\ninfo=computeHemisphericLighting(viewDirectionW,normalW,vLightData3,vLightDiffuse3.rgb,vLightSpecular3,vLightGround3,roughness,NdotV,vLightRadiuses[3],NdotL);\n#endif\n#if defined(POINTLIGHT3) || defined(DIRLIGHT3)\ninfo=computeLighting(viewDirectionW,normalW,vLightData3,vLightDiffuse3.rgb,vLightSpecular3,vLightDiffuse3.a,roughness,NdotV,vLightRadiuses[3],NdotL);\n#endif\n#ifdef SHADOW3\n#ifdef SHADOWVSM3\nnotShadowLevel=computeShadowWithVSM(vPositionFromLight3,shadowSampler3,shadowsInfo3.z,shadowsInfo3.x);\n#else\n#ifdef SHADOWPCF3\n#if defined(POINTLIGHT3)\nnotShadowLevel=computeShadowWithPCFCube(vLightData3.xyz,shadowSampler3,shadowsInfo3.y,shadowsInfo3.z,shadowsInfo3.x);\n#else\nnotShadowLevel=computeShadowWithPCF(vPositionFromLight3,shadowSampler3,shadowsInfo3.y,shadowsInfo3.z,shadowsInfo3.x);\n#endif\n#else\n#if defined(POINTLIGHT3)\nnotShadowLevel=computeShadowCube(vLightData3.xyz,shadowSampler3,shadowsInfo3.x,shadowsInfo3.z);\n#else\nnotShadowLevel=computeShadow(vPositionFromLight3,shadowSampler3,shadowsInfo3.x,shadowsInfo3.z);\n#endif\n#endif \n#endif \n#else\nnotShadowLevel=1.;\n#endif\nlightDiffuseContribution+=info.diffuse*notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\nif (NdotL<0.000000000011)\n{\nnotShadowLevel=1.;\n}\nshadowedOnlyLightDiffuseContribution*=notShadowLevel;\n#endif\n#ifdef SPECULARTERM\nlightSpecularContribution+=info.specular*notShadowLevel;\n#endif\n#endif\n#ifdef SPECULARTERM\nlightSpecularContribution*=vLightingIntensity.w;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 surfaceRefractionColor=vec3(0.,0.,0.);\n\n#ifdef LODBASEDMICROSFURACE\nfloat alphaG=convertRoughnessToAverageSlope(roughness);\n#endif\n#ifdef REFRACTION\nvec3 refractionVector=refract(-viewDirectionW,normalW,vRefractionInfos.y);\n#ifdef LODBASEDMICROSFURACE\n#ifdef USEPMREMREFRACTION\nfloat lodRefraction=getMipMapIndexFromAverageSlopeWithPMREM(vMicrosurfaceTextureLods.y,alphaG);\n#else\nfloat lodRefraction=getMipMapIndexFromAverageSlope(vMicrosurfaceTextureLods.y,alphaG);\n#endif\n#else\nfloat biasRefraction=(vMicrosurfaceTextureLods.y+2.)*(1.0-microSurface);\n#endif\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\n#ifdef LODBASEDMICROSFURACE\n#ifdef USEPMREMREFRACTION\n\nif (microSurface>0.5)\n{\n\nfloat scaleRefraction=1.-exp2(lodRefraction)/exp2(vMicrosurfaceTextureLods.y); \nfloat maxRefraction=max(max(abs(refractionVector.x),abs(refractionVector.y)),abs(refractionVector.z));\nif (abs(refractionVector.x) != maxRefraction) refractionVector.x*=scaleRefraction;\nif (abs(refractionVector.y) != maxRefraction) refractionVector.y*=scaleRefraction;\nif (abs(refractionVector.z) != maxRefraction) refractionVector.z*=scaleRefraction;\n}\n#endif\nsurfaceRefractionColor=textureCubeLodEXT(refractionCubeSampler,refractionVector,lodRefraction).rgb*vRefractionInfos.x;\n#else\nsurfaceRefractionColor=textureCube(refractionCubeSampler,refractionVector,biasRefraction).rgb*vRefractionInfos.x;\n#endif\n}\n#ifndef REFRACTIONMAPINLINEARSPACE\nsurfaceRefractionColor=toLinearSpace(surfaceRefractionColor.rgb); \n#endif\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\n#ifdef LODBASEDMICROSFURACE\nsurfaceRefractionColor=texture2DLodEXT(refraction2DSampler,refractionCoords,lodRefraction).rgb*vRefractionInfos.x;\n#else\nsurfaceRefractionColor=texture2D(refraction2DSampler,refractionCoords,biasRefraction).rgb*vRefractionInfos.x;\n#endif \nsurfaceRefractionColor=toLinearSpace(surfaceRefractionColor.rgb); \n#endif\n#endif\n\nvec3 environmentRadiance=vReflectionColor.rgb;\nvec3 environmentIrradiance=vReflectionColor.rgb;\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef LODBASEDMICROSFURACE\n#ifdef USEPMREMREFLECTION\nfloat lodReflection=getMipMapIndexFromAverageSlopeWithPMREM(vMicrosurfaceTextureLods.x,alphaG);\n#else\nfloat lodReflection=getMipMapIndexFromAverageSlope(vMicrosurfaceTextureLods.x,alphaG);\n#endif\n#else\nfloat biasReflection=(vMicrosurfaceTextureLods.x+2.)*(1.0-microSurface);\n#endif\n#ifdef REFLECTIONMAP_3D\n#ifdef LODBASEDMICROSFURACE\n#ifdef USEPMREMREFLECTION\n\nif (microSurface>0.5)\n{\n\nfloat scaleReflection=1.-exp2(lodReflection)/exp2(vMicrosurfaceTextureLods.x); \nfloat maxReflection=max(max(abs(vReflectionUVW.x),abs(vReflectionUVW.y)),abs(vReflectionUVW.z));\nif (abs(vReflectionUVW.x) != maxReflection) vReflectionUVW.x*=scaleReflection;\nif (abs(vReflectionUVW.y) != maxReflection) vReflectionUVW.y*=scaleReflection;\nif (abs(vReflectionUVW.z) != maxReflection) vReflectionUVW.z*=scaleReflection;\n}\n#endif\nenvironmentRadiance=textureCubeLodEXT(reflectionCubeSampler,vReflectionUVW,lodReflection).rgb*vReflectionInfos.x;\n#else\nenvironmentRadiance=textureCube(reflectionCubeSampler,vReflectionUVW,biasReflection).rgb*vReflectionInfos.x;\n#endif\n#ifdef USESPHERICALFROMREFLECTIONMAP\n#ifndef REFLECTIONMAP_SKYBOX\nvec3 normalEnvironmentSpace=(reflectionMatrix*vec4(normalW,1)).xyz;\nenvironmentIrradiance=EnvironmentIrradiance(normalEnvironmentSpace);\n#endif\n#else\nenvironmentRadiance=toLinearSpace(environmentRadiance.rgb);\nenvironmentIrradiance=textureCube(reflectionCubeSampler,normalW,20.).rgb*vReflectionInfos.x;\nenvironmentIrradiance=toLinearSpace(environmentIrradiance.rgb);\nenvironmentIrradiance*=0.2; \n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\n#ifdef LODBASEDMICROSFURACE\nenvironmentRadiance=texture2DLodEXT(reflection2DSampler,coords,lodReflection).rgb*vReflectionInfos.x;\n#else\nenvironmentRadiance=texture2D(reflection2DSampler,coords,biasReflection).rgb*vReflectionInfos.x;\n#endif\nenvironmentRadiance=toLinearSpace(environmentRadiance.rgb);\nenvironmentIrradiance=texture2D(reflection2DSampler,coords,20.).rgb*vReflectionInfos.x;\nenvironmentIrradiance=toLinearSpace(environmentIrradiance.rgb);\n#endif\n#endif\n#ifdef OVERLOADEDVALUES\nenvironmentIrradiance=mix(environmentIrradiance,vOverloadedReflection,vOverloadedMicroSurface.z);\nenvironmentRadiance=mix(environmentRadiance,vOverloadedReflection,vOverloadedMicroSurface.z);\n#endif\nenvironmentRadiance*=vLightingIntensity.z;\nenvironmentIrradiance*=vLightingIntensity.z;\n\nvec3 specularEnvironmentR0=surfaceReflectivityColor.rgb;\nvec3 specularEnvironmentR90=vec3(1.0,1.0,1.0);\nvec3 specularEnvironmentReflectance=FresnelSchlickEnvironmentGGX(clamp(NdotV,0.,1.),specularEnvironmentR0,specularEnvironmentR90,sqrt(microSurface));\n\nvec3 refractance=vec3(0.0 ,0.0,0.0);\n#ifdef REFRACTION\nvec3 transmission=vec3(1.0 ,1.0,1.0);\n#ifdef LINKREFRACTIONTOTRANSPARENCY\n\ntransmission*=(1.0-alpha);\n\n\nvec3 mixedAlbedo=surfaceAlbedoContribution.rgb*surfaceAlbedo.rgb;\nfloat maxChannel=max(max(mixedAlbedo.r,mixedAlbedo.g),mixedAlbedo.b);\nvec3 tint=clamp(maxChannel*mixedAlbedo,0.0,1.0);\n\nsurfaceAlbedoContribution*=alpha;\n\nenvironmentIrradiance*=alpha;\n\nsurfaceRefractionColor*=tint;\n\nalpha=1.0;\n#endif\n\nvec3 bounceSpecularEnvironmentReflectance=(2.0*specularEnvironmentReflectance)/(1.0+specularEnvironmentReflectance);\nspecularEnvironmentReflectance=mix(bounceSpecularEnvironmentReflectance,specularEnvironmentReflectance,alpha);\n\ntransmission*=1.0-specularEnvironmentReflectance;\n\nrefractance=surfaceRefractionColor*transmission;\n#endif\n\nfloat reflectance=max(max(surfaceReflectivityColor.r,surfaceReflectivityColor.g),surfaceReflectivityColor.b);\nsurfaceAlbedo.rgb=(1.-reflectance)*surfaceAlbedo.rgb;\nrefractance*=vLightingIntensity.z;\nenvironmentRadiance*=specularEnvironmentReflectance;\n\nvec3 surfaceEmissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nvec3 emissiveColorTex=texture2D(emissiveSampler,vEmissiveUV).rgb;\nsurfaceEmissiveColor=toLinearSpace(emissiveColorTex.rgb)*surfaceEmissiveColor*vEmissiveInfos.y;\n#endif\n#ifdef OVERLOADEDVALUES\nsurfaceEmissiveColor=mix(surfaceEmissiveColor,vOverloadedEmissive,vOverloadedIntensity.w);\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nsurfaceEmissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=max(lightDiffuseContribution*surfaceAlbedoContribution+vAmbientColor,0.0)*surfaceAlbedo.rgb;\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution=max(shadowedOnlyLightDiffuseContribution*surfaceAlbedoContribution+vAmbientColor,0.0)*surfaceAlbedo.rgb;\n#endif\n#else\n#ifdef LINKEMISSIVEWITHALBEDO\nvec3 finalDiffuse=max((lightDiffuseContribution+surfaceEmissiveColor)*surfaceAlbedoContribution+vAmbientColor,0.0)*surfaceAlbedo.rgb;\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution=max((shadowedOnlyLightDiffuseContribution+surfaceEmissiveColor)*surfaceAlbedoContribution+vAmbientColor,0.0)*surfaceAlbedo.rgb;\n#endif\n#else\nvec3 finalDiffuse=max(lightDiffuseContribution*surfaceAlbedoContribution+surfaceEmissiveColor+vAmbientColor,0.0)*surfaceAlbedo.rgb;\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution=max(shadowedOnlyLightDiffuseContribution*surfaceAlbedoContribution+surfaceEmissiveColor+vAmbientColor,0.0)*surfaceAlbedo.rgb;\n#endif\n#endif\n#endif\n#ifdef OVERLOADEDSHADOWVALUES\nfinalDiffuse=mix(finalDiffuse,shadowedOnlyLightDiffuseContribution,(1.0-vOverloadedShadowIntensity.y));\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=lightSpecularContribution*surfaceReflectivityColor;\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+getLuminance(finalSpecular),0.,1.);\n#endif\n#ifdef RADIANCEOVERALPHA\nalpha=clamp(alpha+getLuminance(environmentRadiance),0.,1.);\n#endif\n\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 finalColor=vec4(finalDiffuse*ambientColor*vLightingIntensity.x+surfaceAlbedo.rgb*environmentIrradiance+finalSpecular*vLightingIntensity.x+environmentRadiance+surfaceEmissiveColor*vLightingIntensity.y+refractance,alpha);\n#else\nvec4 finalColor=vec4(finalDiffuse*ambientColor*vLightingIntensity.x+surfaceAlbedo.rgb*environmentIrradiance+finalSpecular*vLightingIntensity.x+environmentRadiance+refractance,alpha);\n#endif\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV).rgb*vLightmapInfos.y;\n#ifdef USELIGHTMAPASSHADOWMAP\nfinalColor.rgb*=lightmapColor;\n#else\nfinalColor.rgb+=lightmapColor;\n#endif\n#endif\nfinalColor=max(finalColor,0.0);\n#ifdef CAMERATONEMAP\nfinalColor.rgb=toneMaps(finalColor.rgb);\n#endif\nfinalColor.rgb=toGammaSpace(finalColor.rgb);\n#ifdef CAMERACONTRAST\nfinalColor=contrasts(finalColor);\n#endif\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n#include<logDepthFragment>\n#include<fogFragment>(color,finalColor)\ngl_FragColor=finalColor;\n}";
BABYLON.Effect.ShadersStore['legacypbrVertexShader'] = "precision mediump float;\n\nattribute vec3 position;\nattribute vec3 normal;\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\nuniform mat4 world;\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform mat4 albedoMatrix;\nuniform vec2 vAlbedoInfos;\n#endif\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nvarying vec2 vOpacityUV;\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#if defined(REFLECTIVITY)\nvarying vec2 vReflectivityUV;\nuniform vec2 vReflectivityInfos;\nuniform mat4 reflectivityMatrix;\n#endif\n\nvarying vec3 vPositionW;\nvarying vec3 vNormalW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\nvoid main(void) {\nmat4 finalWorld=world;\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef ALBEDO\nif (vAlbedoInfos.x == 0.)\n{\nvAlbedoUV=vec2(albedoMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAlbedoUV=vec2(albedoMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef AMBIENT\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef OPACITY\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef EMISSIVE\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(REFLECTIVITY)\nif (vReflectivityInfos.x == 0.)\n{\nvReflectivityUV=vec2(reflectivityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvReflectivityUV=vec2(reflectivityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<clipPlaneVertex>\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n}";
BABYLON.Effect.ShadersStore['legacypbrPixelShader'] = "precision mediump float;\n\n#define RECIPROCAL_PI2 0.15915494\n#define FRESNEL_MAXIMUM_ON_ROUGH 0.25\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\nuniform vec4 vAlbedoColor;\nuniform vec3 vReflectionColor;\nuniform vec4 vLightRadiuses;\n\nuniform vec4 vLightingIntensity;\nuniform vec4 vCameraInfos;\n#ifdef OVERLOADEDVALUES\nuniform vec4 vOverloadedIntensity;\nuniform vec3 vOverloadedAmbient;\nuniform vec3 vOverloadedAlbedo;\nuniform vec3 vOverloadedReflectivity;\nuniform vec3 vOverloadedEmissive;\nuniform vec3 vOverloadedReflection;\nuniform vec3 vOverloadedMicroSurface;\n#endif\n#ifdef OVERLOADEDSHADOWVALUES\nuniform vec4 vOverloadedShadowIntensity;\n#endif\n\nconst float kPi=3.1415926535897932384626433832795;\nconst float kRougnhessToAlphaScale=0.1;\nconst float kRougnhessToAlphaOffset=0.29248125;\n#include<helperFunctions>\n\nfloat getMipMapIndexFromAverageSlope(float maxMipLevel,float alpha)\n{\n\n\n\n\n\n\n\nfloat mip=kRougnhessToAlphaOffset+maxMipLevel+(maxMipLevel*kRougnhessToAlphaScale*log2(alpha));\nreturn clamp(mip,0.,maxMipLevel);\n}\nfloat getMipMapIndexFromAverageSlopeWithPMREM(float maxMipLevel,float alphaG)\n{\nfloat specularPower=clamp(2./alphaG-2.,0.000001,2048.);\n\nreturn clamp(- 0.5*log2(specularPower)+5.5,0.,maxMipLevel);\n}\n\nfloat smithVisibilityG1_TrowbridgeReitzGGX(float dot,float alphaG)\n{\nfloat tanSquared=(1.0-dot*dot)/(dot*dot);\nreturn 2.0/(1.0+sqrt(1.0+alphaG*alphaG*tanSquared));\n}\nfloat smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL,float NdotV,float alphaG)\n{\nreturn smithVisibilityG1_TrowbridgeReitzGGX(NdotL,alphaG)*smithVisibilityG1_TrowbridgeReitzGGX(NdotV,alphaG);\n}\n\n\nfloat normalDistributionFunction_TrowbridgeReitzGGX(float NdotH,float alphaG)\n{\n\n\n\nfloat a2=Square(alphaG);\nfloat d=NdotH*NdotH*(a2-1.0)+1.0;\nreturn a2/(kPi*d*d);\n}\nvec3 fresnelSchlickGGX(float VdotH,vec3 reflectance0,vec3 reflectance90)\n{\nreturn reflectance0+(reflectance90-reflectance0)*pow(clamp(1.0-VdotH,0.,1.),5.0);\n}\nvec3 FresnelSchlickEnvironmentGGX(float VdotN,vec3 reflectance0,vec3 reflectance90,float smoothness)\n{\n\nfloat weight=mix(FRESNEL_MAXIMUM_ON_ROUGH,1.0,smoothness);\nreturn reflectance0+weight*(reflectance90-reflectance0)*pow(clamp(1.0-VdotN,0.,1.),5.0);\n}\n\nvec3 computeSpecularTerm(float NdotH,float NdotL,float NdotV,float VdotH,float roughness,vec3 specularColor)\n{\nfloat alphaG=convertRoughnessToAverageSlope(roughness);\nfloat distribution=normalDistributionFunction_TrowbridgeReitzGGX(NdotH,alphaG);\nfloat visibility=smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL,NdotV,alphaG);\nvisibility/=(4.0*NdotL*NdotV); \nvec3 fresnel=fresnelSchlickGGX(VdotH,specularColor,vec3(1.,1.,1.));\nfloat specTerm=max(0.,visibility*distribution)*NdotL;\nreturn fresnel*specTerm*kPi; \n}\nfloat computeDiffuseTerm(float NdotL,float NdotV,float VdotH,float roughness)\n{\n\n\nfloat diffuseFresnelNV=pow(clamp(1.0-NdotL,0.000001,1.),5.0);\nfloat diffuseFresnelNL=pow(clamp(1.0-NdotV,0.000001,1.),5.0);\nfloat diffuseFresnel90=0.5+2.0*VdotH*VdotH*roughness;\nfloat diffuseFresnelTerm =\n(1.0+(diffuseFresnel90-1.0)*diffuseFresnelNL) *\n(1.0+(diffuseFresnel90-1.0)*diffuseFresnelNV);\nreturn diffuseFresnelTerm*NdotL;\n\n\n}\nfloat adjustRoughnessFromLightProperties(float roughness,float lightRadius,float lightDistance)\n{\n\nfloat lightRoughness=lightRadius/lightDistance;\n\nfloat totalRoughness=clamp(lightRoughness+roughness,0.,1.);\nreturn totalRoughness;\n}\nfloat computeDefaultMicroSurface(float microSurface,vec3 reflectivityColor)\n{\nfloat kReflectivityNoAlphaWorkflow_SmoothnessMax=0.95;\nfloat reflectivityLuminance=getLuminance(reflectivityColor);\nfloat reflectivityLuma=sqrt(reflectivityLuminance);\nmicroSurface=reflectivityLuma*kReflectivityNoAlphaWorkflow_SmoothnessMax;\nreturn microSurface;\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn vec3(pow(color.r,2.2),pow(color.g,2.2),pow(color.b,2.2));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn vec3(pow(color.r,1.0/2.2),pow(color.g,1.0/2.2),pow(color.b,1.0/2.2));\n}\nfloat computeLightFalloff(vec3 lightOffset,float lightDistanceSquared,float range)\n{\n#ifdef USEPHYSICALLIGHTFALLOFF\nfloat lightDistanceFalloff=1.0/((lightDistanceSquared+0.0001));\nreturn lightDistanceFalloff;\n#else\nfloat lightFalloff=max(0.,1.0-length(lightOffset)/range);\nreturn lightFalloff;\n#endif\n}\n#ifdef CAMERATONEMAP\nvec3 toneMaps(vec3 color)\n{\ncolor=max(color,0.0);\n\ncolor.rgb=color.rgb*vCameraInfos.x;\nfloat tuning=1.5; \n\n\nvec3 tonemapped=1.0-exp2(-color.rgb*tuning); \ncolor.rgb=mix(color.rgb,tonemapped,1.0);\nreturn color;\n}\n#endif\n#ifdef CAMERACONTRAST\nvec4 contrasts(vec4 color)\n{\ncolor=clamp(color,0.0,1.0);\nvec3 resultHighContrast=color.rgb*color.rgb*(3.0-2.0*color.rgb);\nfloat contrast=vCameraInfos.y;\nif (contrast<1.0)\n{\n\ncolor.rgb=mix(vec3(0.5,0.5,0.5),color.rgb,contrast);\n}\nelse\n{\n\ncolor.rgb=mix(color.rgb,resultHighContrast,contrast-1.0);\n}\nreturn color;\n}\n#endif\n\nuniform vec4 vReflectivityColor;\nuniform vec3 vEmissiveColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<lightFragmentDeclaration>[0]\n#include<lightFragmentDeclaration>[1]\n#include<lightFragmentDeclaration>[2]\n#include<lightFragmentDeclaration>[3]\n\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform sampler2D albedoSampler;\nuniform vec2 vAlbedoInfos;\n#endif\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform sampler2D ambientSampler;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nvarying vec2 vOpacityUV;\nuniform sampler2D opacitySampler;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform vec2 vEmissiveInfos;\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\nuniform vec2 vLightmapInfos;\nuniform sampler2D lightmapSampler;\n#endif\n#if defined(REFLECTIVITY)\nvarying vec2 vReflectivityUV;\nuniform vec2 vReflectivityInfos;\nuniform sampler2D reflectivitySampler;\n#endif\n#include<clipPlaneFragmentDeclaration>\n\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float roughness,float NdotV,float lightRadius,out float NdotL) {\nlightingInfo result;\nvec3 lightDirection;\nfloat attenuation=1.0;\nfloat lightDistance;\n\nif (lightData.w == 0.)\n{\nvec3 lightOffset=lightData.xyz-vPositionW;\nfloat lightDistanceSquared=dot(lightOffset,lightOffset);\nattenuation=computeLightFalloff(lightOffset,lightDistanceSquared,range);\nlightDistance=sqrt(lightDistanceSquared);\nlightDirection=normalize(lightOffset);\n}\n\nelse\n{\nlightDistance=length(-lightData.xyz);\nlightDirection=normalize(-lightData.xyz);\n}\n\nroughness=adjustRoughnessFromLightProperties(roughness,lightRadius,lightDistance);\n\nvec3 H=normalize(viewDirectionW+lightDirection);\nNdotL=max(0.00000000001,dot(vNormal,lightDirection));\nfloat VdotH=clamp(0.00000000001,1.0,dot(viewDirectionW,H));\nfloat diffuseTerm=computeDiffuseTerm(NdotL,NdotV,VdotH,roughness);\nresult.diffuse=diffuseTerm*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nfloat NdotH=max(0.00000000001,dot(vNormal,H));\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,specularColor);\nresult.specular=specTerm*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float roughness,float NdotV,float lightRadius,out float NdotL) {\nlightingInfo result;\nvec3 lightOffset=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(lightOffset);\n\nfloat cosAngle=max(0.000000000000001,dot(-lightDirection.xyz,lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\n\nfloat lightDistanceSquared=dot(lightOffset,lightOffset);\nfloat attenuation=computeLightFalloff(lightOffset,lightDistanceSquared,range);\n\nattenuation*=cosAngle;\n\nfloat lightDistance=sqrt(lightDistanceSquared);\nroughness=adjustRoughnessFromLightProperties(roughness,lightRadius,lightDistance);\n\nvec3 H=normalize(viewDirectionW-lightDirection.xyz);\nNdotL=max(0.00000000001,dot(vNormal,-lightDirection.xyz));\nfloat VdotH=clamp(dot(viewDirectionW,H),0.00000000001,1.0);\nfloat diffuseTerm=computeDiffuseTerm(NdotL,NdotV,VdotH,roughness);\nresult.diffuse=diffuseTerm*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nfloat NdotH=max(0.00000000001,dot(vNormal,H));\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,specularColor);\nresult.specular=specTerm*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float roughness,float NdotV,float lightRadius,out float NdotL) {\nlightingInfo result;\n\n\n\nNdotL=dot(vNormal,lightData.xyz)*0.5+0.5;\nresult.diffuse=mix(groundColor,diffuseColor,NdotL);\n#ifdef SPECULARTERM\n\nvec3 lightVectorW=normalize(lightData.xyz);\nvec3 H=normalize(viewDirectionW+lightVectorW);\nfloat NdotH=max(0.00000000001,dot(vNormal,H));\nNdotL=max(0.00000000001,NdotL);\nfloat VdotH=clamp(0.00000000001,1.0,dot(viewDirectionW,H));\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,specularColor);\nresult.specular=specTerm;\n#endif\nreturn result;\n}\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 surfaceAlbedo=vec4(1.,1.,1.,1.);\nvec3 surfaceAlbedoContribution=vAlbedoColor.rgb;\n\nfloat alpha=vAlbedoColor.a;\n#ifdef ALBEDO\nsurfaceAlbedo=texture2D(albedoSampler,vAlbedoUV);\nsurfaceAlbedo=vec4(toLinearSpace(surfaceAlbedo.rgb),surfaceAlbedo.a);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMALBEDO\nalpha*=surfaceAlbedo.a;\n#endif\nsurfaceAlbedo.rgb*=vAlbedoInfos.y;\n#else\n\nsurfaceAlbedo.rgb=surfaceAlbedoContribution;\nsurfaceAlbedoContribution=vec3(1.,1.,1.);\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n#ifdef OVERLOADEDVALUES\nsurfaceAlbedo.rgb=mix(surfaceAlbedo.rgb,vOverloadedAlbedo,vOverloadedIntensity.y);\n#endif\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n\nvec3 ambientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nambientColor=texture2D(ambientSampler,vAmbientUV).rgb*vAmbientInfos.y;\n#ifdef OVERLOADEDVALUES\nambientColor.rgb=mix(ambientColor.rgb,vOverloadedAmbient,vOverloadedIntensity.x);\n#endif\n#endif\n\nfloat microSurface=vReflectivityColor.a;\nvec3 surfaceReflectivityColor=vReflectivityColor.rgb;\n#ifdef OVERLOADEDVALUES\nsurfaceReflectivityColor.rgb=mix(surfaceReflectivityColor.rgb,vOverloadedReflectivity,vOverloadedIntensity.z);\n#endif\n#ifdef REFLECTIVITY\nvec4 surfaceReflectivityColorMap=texture2D(reflectivitySampler,vReflectivityUV);\nsurfaceReflectivityColor=surfaceReflectivityColorMap.rgb;\nsurfaceReflectivityColor=toLinearSpace(surfaceReflectivityColor);\n#ifdef OVERLOADEDVALUES\nsurfaceReflectivityColor=mix(surfaceReflectivityColor,vOverloadedReflectivity,vOverloadedIntensity.z);\n#endif\n#ifdef MICROSURFACEFROMREFLECTIVITYMAP\nmicroSurface=surfaceReflectivityColorMap.a;\n#else\n#ifdef MICROSURFACEAUTOMATIC\nmicroSurface=computeDefaultMicroSurface(microSurface,surfaceReflectivityColor);\n#endif\n#endif\n#endif\n#ifdef OVERLOADEDVALUES\nmicroSurface=mix(microSurface,vOverloadedMicroSurface.x,vOverloadedMicroSurface.y);\n#endif\n\nfloat NdotV=max(0.00000000001,dot(normalW,viewDirectionW));\n\nmicroSurface=clamp(microSurface,0.,1.)*0.98;\n\nfloat roughness=clamp(1.-microSurface,0.000001,1.0);\n\nvec3 lightDiffuseContribution=vec3(0.,0.,0.);\n#ifdef OVERLOADEDSHADOWVALUES\nvec3 shadowedOnlyLightDiffuseContribution=vec3(1.,1.,1.);\n#endif\n#ifdef SPECULARTERM\nvec3 lightSpecularContribution= vec3(0.,0.,0.);\n#endif\nfloat notShadowLevel=1.; \nfloat NdotL=-1.;\n#ifdef LIGHT0\n#ifndef SPECULARTERM\nvec3 vLightSpecular0=vec3(0.0);\n#endif\n#ifdef SPOTLIGHT0\nlightingInfo info=computeSpotLighting(viewDirectionW,normalW,vLightData0,vLightDirection0,vLightDiffuse0.rgb,vLightSpecular0,vLightDiffuse0.a,roughness,NdotV,vLightRadiuses[0],NdotL);\n#endif\n#ifdef HEMILIGHT0\nlightingInfo info=computeHemisphericLighting(viewDirectionW,normalW,vLightData0,vLightDiffuse0.rgb,vLightSpecular0,vLightGround0,roughness,NdotV,vLightRadiuses[0],NdotL);\n#endif\n#if defined(POINTLIGHT0) || defined(DIRLIGHT0)\nlightingInfo info=computeLighting(viewDirectionW,normalW,vLightData0,vLightDiffuse0.rgb,vLightSpecular0,vLightDiffuse0.a,roughness,NdotV,vLightRadiuses[0],NdotL);\n#endif\nnotShadowLevel=1.;\nlightDiffuseContribution+=info.diffuse*notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\nif (NdotL<0.000000000011)\n{\nnotShadowLevel=1.;\n}\nshadowedOnlyLightDiffuseContribution*=notShadowLevel;\n#endif\n#ifdef SPECULARTERM\nlightSpecularContribution+=info.specular*notShadowLevel;\n#endif\n#endif\n#ifdef LIGHT1\n#ifndef SPECULARTERM\nvec3 vLightSpecular1=vec3(0.0);\n#endif\n#ifdef SPOTLIGHT1\ninfo=computeSpotLighting(viewDirectionW,normalW,vLightData1,vLightDirection1,vLightDiffuse1.rgb,vLightSpecular1,vLightDiffuse1.a,roughness,NdotV,vLightRadiuses[1],NdotL);\n#endif\n#ifdef HEMILIGHT1\ninfo=computeHemisphericLighting(viewDirectionW,normalW,vLightData1,vLightDiffuse1.rgb,vLightSpecular1,vLightGround1,roughness,NdotV,vLightRadiuses[1],NdotL);\n#endif\n#if defined(POINTLIGHT1) || defined(DIRLIGHT1)\ninfo=computeLighting(viewDirectionW,normalW,vLightData1,vLightDiffuse1.rgb,vLightSpecular1,vLightDiffuse1.a,roughness,NdotV,vLightRadiuses[1],NdotL);\n#endif\nnotShadowLevel=1.;\nlightDiffuseContribution+=info.diffuse*notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\nif (NdotL<0.000000000011)\n{\nnotShadowLevel=1.;\n}\nshadowedOnlyLightDiffuseContribution*=notShadowLevel;\n#endif\n#ifdef SPECULARTERM\nlightSpecularContribution+=info.specular*notShadowLevel;\n#endif\n#endif\n#ifdef LIGHT2\n#ifndef SPECULARTERM\nvec3 vLightSpecular2=vec3(0.0);\n#endif\n#ifdef SPOTLIGHT2\ninfo=computeSpotLighting(viewDirectionW,normalW,vLightData2,vLightDirection2,vLightDiffuse2.rgb,vLightSpecular2,vLightDiffuse2.a,roughness,NdotV,vLightRadiuses[2],NdotL);\n#endif\n#ifdef HEMILIGHT2\ninfo=computeHemisphericLighting(viewDirectionW,normalW,vLightData2,vLightDiffuse2.rgb,vLightSpecular2,vLightGround2,roughness,NdotV,vLightRadiuses[2],NdotL);\n#endif\n#if defined(POINTLIGHT2) || defined(DIRLIGHT2)\ninfo=computeLighting(viewDirectionW,normalW,vLightData2,vLightDiffuse2.rgb,vLightSpecular2,vLightDiffuse2.a,roughness,NdotV,vLightRadiuses[2],NdotL);\n#endif\nnotShadowLevel=1.;\nlightDiffuseContribution+=info.diffuse*notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\nif (NdotL<0.000000000011)\n{\nnotShadowLevel=1.;\n}\nshadowedOnlyLightDiffuseContribution*=notShadowLevel;\n#endif\n#ifdef SPECULARTERM\nlightSpecularContribution+=info.specular*notShadowLevel;\n#endif\n#endif\n#ifdef LIGHT3\n#ifndef SPECULARTERM\nvec3 vLightSpecular3=vec3(0.0);\n#endif\n#ifdef SPOTLIGHT3\ninfo=computeSpotLighting(viewDirectionW,normalW,vLightData3,vLightDirection3,vLightDiffuse3.rgb,vLightSpecular3,vLightDiffuse3.a,roughness,NdotV,vLightRadiuses[3],NdotL);\n#endif\n#ifdef HEMILIGHT3\ninfo=computeHemisphericLighting(viewDirectionW,normalW,vLightData3,vLightDiffuse3.rgb,vLightSpecular3,vLightGround3,roughness,NdotV,vLightRadiuses[3],NdotL);\n#endif\n#if defined(POINTLIGHT3) || defined(DIRLIGHT3)\ninfo=computeLighting(viewDirectionW,normalW,vLightData3,vLightDiffuse3.rgb,vLightSpecular3,vLightDiffuse3.a,roughness,NdotV,vLightRadiuses[3],NdotL);\n#endif\nnotShadowLevel=1.;\nlightDiffuseContribution+=info.diffuse*notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\nif (NdotL<0.000000000011)\n{\nnotShadowLevel=1.;\n}\nshadowedOnlyLightDiffuseContribution*=notShadowLevel;\n#endif\n#ifdef SPECULARTERM\nlightSpecularContribution+=info.specular*notShadowLevel;\n#endif\n#endif\n#ifdef SPECULARTERM\nlightSpecularContribution*=vLightingIntensity.w;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n\nvec3 environmentRadiance=vReflectionColor.rgb;\nvec3 environmentIrradiance=vReflectionColor.rgb;\n#ifdef OVERLOADEDVALUES\nenvironmentIrradiance=mix(environmentIrradiance,vOverloadedReflection,vOverloadedMicroSurface.z);\nenvironmentRadiance=mix(environmentRadiance,vOverloadedReflection,vOverloadedMicroSurface.z);\n#endif\nenvironmentRadiance*=vLightingIntensity.z;\nenvironmentIrradiance*=vLightingIntensity.z;\n\nvec3 specularEnvironmentR0=surfaceReflectivityColor.rgb;\nvec3 specularEnvironmentR90=vec3(1.0,1.0,1.0);\nvec3 specularEnvironmentReflectance=FresnelSchlickEnvironmentGGX(clamp(NdotV,0.,1.),specularEnvironmentR0,specularEnvironmentR90,sqrt(microSurface));\n\nfloat reflectance=max(max(surfaceReflectivityColor.r,surfaceReflectivityColor.g),surfaceReflectivityColor.b);\nsurfaceAlbedo.rgb=(1.-reflectance)*surfaceAlbedo.rgb;\nenvironmentRadiance*=specularEnvironmentReflectance;\n\nvec3 surfaceEmissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nvec3 emissiveColorTex=texture2D(emissiveSampler,vEmissiveUV).rgb;\nsurfaceEmissiveColor=toLinearSpace(emissiveColorTex.rgb)*surfaceEmissiveColor*vEmissiveInfos.y;\n#endif\n#ifdef OVERLOADEDVALUES\nsurfaceEmissiveColor=mix(surfaceEmissiveColor,vOverloadedEmissive,vOverloadedIntensity.w);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=max(lightDiffuseContribution*surfaceAlbedoContribution+vAmbientColor,0.0)*surfaceAlbedo.rgb;\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution=max(shadowedOnlyLightDiffuseContribution*surfaceAlbedoContribution+vAmbientColor,0.0)*surfaceAlbedo.rgb;\n#endif\n#else\n#ifdef LINKEMISSIVEWITHALBEDO\nvec3 finalDiffuse=max((lightDiffuseContribution+surfaceEmissiveColor)*surfaceAlbedoContribution+vAmbientColor,0.0)*surfaceAlbedo.rgb;\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution=max((shadowedOnlyLightDiffuseContribution+surfaceEmissiveColor)*surfaceAlbedoContribution+vAmbientColor,0.0)*surfaceAlbedo.rgb;\n#endif\n#else\nvec3 finalDiffuse=max(lightDiffuseContribution*surfaceAlbedoContribution+surfaceEmissiveColor+vAmbientColor,0.0)*surfaceAlbedo.rgb;\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution=max(shadowedOnlyLightDiffuseContribution*surfaceAlbedoContribution+surfaceEmissiveColor+vAmbientColor,0.0)*surfaceAlbedo.rgb;\n#endif\n#endif\n#endif\n#ifdef OVERLOADEDSHADOWVALUES\nfinalDiffuse=mix(finalDiffuse,shadowedOnlyLightDiffuseContribution,(1.0-vOverloadedShadowIntensity.y));\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=lightSpecularContribution*surfaceReflectivityColor;\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+getLuminance(finalSpecular),0.,1.);\n#endif\n#ifdef RADIANCEOVERALPHA\nalpha=clamp(alpha+getLuminance(environmentRadiance),0.,1.);\n#endif\n\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 finalColor=vec4(finalDiffuse*ambientColor*vLightingIntensity.x+surfaceAlbedo.rgb*environmentIrradiance+finalSpecular*vLightingIntensity.x+environmentRadiance+surfaceEmissiveColor*vLightingIntensity.y,alpha);\n#else\nvec4 finalColor=vec4(finalDiffuse*ambientColor*vLightingIntensity.x+surfaceAlbedo.rgb*environmentIrradiance+finalSpecular*vLightingIntensity.x+environmentRadiance,alpha);\n#endif\nfinalColor=max(finalColor,0.0);\n#ifdef CAMERATONEMAP\nfinalColor.rgb=toneMaps(finalColor.rgb);\n#endif\nfinalColor.rgb=toGammaSpace(finalColor.rgb);\n#ifdef CAMERACONTRAST\nfinalColor=contrasts(finalColor);\n#endif\ngl_FragColor=finalColor;\n}";

BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "\nfloat Square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,vec3(0.2126,0.7152,0.0722)),0.,1.);\n}\nfloat convertRoughnessToAverageSlope(float roughness)\n{\n\nconst float kMinimumVariance=0.0005;\nfloat alphaG=Square(roughness)+kMinimumVariance;\nreturn alphaG;\n}";
