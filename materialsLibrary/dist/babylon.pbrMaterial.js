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
            this._keys = Object.keys(this);
        }
        return PBRMaterialDefines;
    })(BABYLON.MaterialDefines);
    var PBRMaterial = (function (_super) {
        __extends(PBRMaterial, _super);
        function PBRMaterial(name, scene) {
            var _this = this;
            _super.call(this, name, scene);
            this.directIntensity = 1.0;
            this.emissiveIntensity = 1.0;
            this.environmentIntensity = 1.0;
            this.specularIntensity = 1.0;
            this._lightingInfos = new BABYLON.Vector4(this.directIntensity, this.emissiveIntensity, this.environmentIntensity, this.specularIntensity);
            this.overloadedShadowIntensity = 1.0;
            this.overloadedShadeIntensity = 1.0;
            this._overloadedShadowInfos = new BABYLON.Vector4(this.overloadedShadowIntensity, this.overloadedShadeIntensity, 0.0, 0.0);
            this.cameraExposure = 1.0;
            this.cameraContrast = 1.0;
            this._cameraInfos = new BABYLON.Vector4(1.0, 1.0, 0.0, 0.0);
            this._microsurfaceTextureLods = new BABYLON.Vector2(0.0, 0.0);
            this.overloadedAmbientIntensity = 0.0;
            this.overloadedAlbedoIntensity = 0.0;
            this.overloadedReflectivityIntensity = 0.0;
            this.overloadedEmissiveIntensity = 0.0;
            this._overloadedIntensity = new BABYLON.Vector4(this.overloadedAmbientIntensity, this.overloadedAlbedoIntensity, this.overloadedReflectivityIntensity, this.overloadedEmissiveIntensity);
            this.overloadedAmbient = BABYLON.Color3.White();
            this.overloadedAlbedo = BABYLON.Color3.White();
            this.overloadedReflectivity = BABYLON.Color3.White();
            this.overloadedEmissive = BABYLON.Color3.White();
            this.overloadedReflection = BABYLON.Color3.White();
            this.overloadedMicroSurface = 0.0;
            this.overloadedMicroSurfaceIntensity = 0.0;
            this.overloadedReflectionIntensity = 0.0;
            this._overloadedMicroSurface = new BABYLON.Vector3(this.overloadedMicroSurface, this.overloadedMicroSurfaceIntensity, this.overloadedReflectionIntensity);
            this.disableBumpMap = false;
            this.ambientColor = new BABYLON.Color3(0, 0, 0);
            this.albedoColor = new BABYLON.Color3(1, 1, 1);
            this.reflectivityColor = new BABYLON.Color3(1, 1, 1);
            this.reflectionColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            this.microSurface = 0.5;
            this.indexOfRefraction = 0.66;
            this.invertRefractionY = false;
            this.linkRefractionWithTransparency = false;
            this.linkEmissiveWithAlbedo = false;
            this.useLightmapAsShadowmap = false;
            this.useEmissiveAsIllumination = false;
            this.useAlphaFromAlbedoTexture = false;
            this.useSpecularOverAlpha = true;
            this.useMicroSurfaceFromReflectivityMapAlpha = false;
            this.useAutoMicroSurfaceFromReflectivityMap = false;
            this.useScalarInLinearSpace = false;
            this.usePhysicalLightFalloff = true;
            this.useRadianceOverAlpha = true;
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
                if (this._defines.REFLECTIVITY) {
                    fallbacks.addFallback(0, "REFLECTIVITY");
                }
                if (this._defines.BUMP) {
                    fallbacks.addFallback(0, "BUMP");
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
                        this._microsurfaceTextureLods.x = Math.log(this.reflectionTexture.getSize().width) * Math.LOG2E;
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
                        this._effect.setFloat2("vBumpInfos", this.bumpTexture.coordinatesIndex, 1.0 / this.bumpTexture.level);
                        this._effect.setMatrix("bumpMatrix", this.bumpTexture.getTextureMatrix());
                    }
                    if (this.refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                        this._microsurfaceTextureLods.y = Math.log(this.refractionTexture.getSize().width) * Math.LOG2E;
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
                    if ((this.reflectionTexture || this.refractionTexture) && this._myScene.getEngine().getCaps().textureLOD) {
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
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedAmbientIntensity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedAlbedoIntensity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedReflectivityIntensity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedEmissiveIntensity");
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedAmbient");
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedAlbedo");
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedReflectivity");
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedEmissive");
        __decorate([
            BABYLON.serializeAsColor3()
        ], PBRMaterial.prototype, "overloadedReflection");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedMicroSurface");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedMicroSurfaceIntensity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "overloadedReflectionIntensity");
        __decorate([
            BABYLON.serialize()
        ], PBRMaterial.prototype, "disableBumpMap");
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
        ], PBRMaterial.prototype, "disableLighting");
        Object.defineProperty(PBRMaterial.prototype, "useLogarithmicDepth",
            __decorate([
                BABYLON.serialize()
            ], PBRMaterial.prototype, "useLogarithmicDepth", Object.getOwnPropertyDescriptor(PBRMaterial.prototype, "useLogarithmicDepth")));
        return PBRMaterial;
    })(BABYLON.Material);
    BABYLON.PBRMaterial = PBRMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['pbrVertexShader'] = "precision highp float;\n\n// Attributes\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n\n#include<bonesDeclaration>\n\n// Uniforms\n#include<instancesDeclaration>\n\nuniform mat4 view;\nuniform mat4 viewProjection;\n\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform mat4 albedoMatrix;\nuniform vec2 vAlbedoInfos;\n#endif\n\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n\n#ifdef OPACITY\nvarying vec2 vOpacityUV;\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n\n#if defined(REFLECTIVITY)\nvarying vec2 vReflectivityUV;\nuniform vec2 vReflectivityInfos;\nuniform mat4 reflectivityMatrix;\n#endif\n\n#ifdef BUMP\nvarying vec2 vBumpUV;\nuniform vec2 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\n// Output\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<shadowsVertexDeclaration>\n\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED\nvarying vec3 vDirectionW;\n#endif\n\n#include<logDepthDeclaration>\n\nvoid main(void) {\n#ifdef REFLECTIONMAP_SKYBOX\n    vPositionUVW = position;\n#endif \n\n#include<instancesVertex>\n#include<bonesVertex>\n\n    gl_Position = viewProjection * finalWorld * vec4(position, 1.0);\n\n    vec4 worldPos = finalWorld * vec4(position, 1.0);\n    vPositionW = vec3(worldPos);\n\n#ifdef NORMAL\n    vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));\n#endif\n\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED\n    vDirectionW = normalize(vec3(finalWorld * vec4(position, 0.0)));\n#endif\n\n    // Texture coordinates\n#ifndef UV1\n    vec2 uv = vec2(0., 0.);\n#endif\n#ifndef UV2\n    vec2 uv2 = vec2(0., 0.);\n#endif\n\n#ifdef ALBEDO\n    if (vAlbedoInfos.x == 0.)\n    {\n        vAlbedoUV = vec2(albedoMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vAlbedoUV = vec2(albedoMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n#ifdef AMBIENT\n    if (vAmbientInfos.x == 0.)\n    {\n        vAmbientUV = vec2(ambientMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vAmbientUV = vec2(ambientMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n#ifdef OPACITY\n    if (vOpacityInfos.x == 0.)\n    {\n        vOpacityUV = vec2(opacityMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n#ifdef EMISSIVE\n    if (vEmissiveInfos.x == 0.)\n    {\n        vEmissiveUV = vec2(emissiveMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vEmissiveUV = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n#ifdef LIGHTMAP\n    if (vLightmapInfos.x == 0.)\n    {\n        vLightmapUV = vec2(lightmapMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vLightmapUV = vec2(lightmapMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n#if defined(REFLECTIVITY)\n    if (vReflectivityInfos.x == 0.)\n    {\n        vReflectivityUV = vec2(reflectivityMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vReflectivityUV = vec2(reflectivityMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n#ifdef BUMP\n    if (vBumpInfos.x == 0.)\n    {\n        vBumpUV = vec2(bumpMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vBumpUV = vec2(bumpMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n    // Clip plane\n#include<clipPlaneVertex>\n\n    // Fog\n#include<fogVertex>\n\n    // Shadows\n#include<shadowsVertex>\n\n    // Vertex color\n#ifdef VERTEXCOLOR\n    vColor = color;\n#endif\n\n    // Point size\n#ifdef POINTSIZE\n    gl_PointSize = pointSize;\n#endif\n\n    // Log. depth\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['pbrPixelShader'] = "#ifdef BUMP\n#extension GL_OES_standard_derivatives : enable\n#endif\n\n#ifdef LODBASEDMICROSFURACE\n#extension GL_EXT_shader_texture_lod : enable\n#endif\n\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\nprecision highp float;\n\n// Constants\n#define RECIPROCAL_PI2 0.15915494\n#define FRESNEL_MAXIMUM_ON_ROUGH 0.25\n\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\nuniform vec3 vReflectionColor;\nuniform vec4 vAlbedoColor;\nuniform vec4 vLightRadiuses;\n\n// CUSTOM CONTROLS\nuniform vec4 vLightingIntensity;\nuniform vec4 vCameraInfos;\n\n#ifdef OVERLOADEDVALUES\n    uniform vec4 vOverloadedIntensity;\n    uniform vec3 vOverloadedAmbient;\n    uniform vec3 vOverloadedAlbedo;\n    uniform vec3 vOverloadedReflectivity;\n    uniform vec3 vOverloadedEmissive;\n    uniform vec3 vOverloadedReflection;\n    uniform vec3 vOverloadedMicroSurface;\n#endif\n\n#ifdef OVERLOADEDSHADOWVALUES\n    uniform vec4 vOverloadedShadowIntensity;\n#endif\n\n#ifdef USESPHERICALFROMREFLECTIONMAP\n    uniform vec3 vSphericalX;\n    uniform vec3 vSphericalY;\n    uniform vec3 vSphericalZ;\n    uniform vec3 vSphericalXX;\n    uniform vec3 vSphericalYY;\n    uniform vec3 vSphericalZZ;\n    uniform vec3 vSphericalXY;\n    uniform vec3 vSphericalYZ;\n    uniform vec3 vSphericalZX;\n\n    vec3 EnvironmentIrradiance(vec3 normal)\n    {\n        // Note: 'normal' is assumed to be normalised (or near normalised)\n        // This isn't as critical as it is with other calculations (e.g. specular highlight), but the result will be incorrect nonetheless.\n\n        // TODO: switch to optimal implementation\n        vec3 result =\n            vSphericalX * normal.x +\n            vSphericalY * normal.y +\n            vSphericalZ * normal.z +\n            vSphericalXX * normal.x * normal.x +\n            vSphericalYY * normal.y * normal.y +\n            vSphericalZZ * normal.z * normal.z +\n            vSphericalYZ * normal.y * normal.z +\n            vSphericalZX * normal.z * normal.x +\n            vSphericalXY * normal.x * normal.y;\n\n        return result.rgb;\n    }\n#endif\n\n#ifdef LODBASEDMICROSFURACE\n    uniform vec2 vMicrosurfaceTextureLods;\n#endif\n\n// PBR CUSTOM CONSTANTS\nconst float kPi = 3.1415926535897932384626433832795;\nconst float kRougnhessToAlphaScale = 0.1;\nconst float kRougnhessToAlphaOffset = 0.29248125;\n\n#ifdef PoissonSamplingEnvironment\n    const int poissonSphereSamplersCount = 32;\n    vec3 poissonSphereSamplers[poissonSphereSamplersCount];\n\n    void initSamplers()\n    {\n        poissonSphereSamplers[0] = vec3( -0.552198926093, 0.801049753814, -0.0322487480415 );\n        poissonSphereSamplers[1] = vec3( 0.344874796559, -0.650989584719, 0.283038477033 ); \n        poissonSphereSamplers[2] = vec3( -0.0710183703467, 0.163770497767, -0.95022416734 ); \n        poissonSphereSamplers[3] = vec3( 0.422221832073, 0.576613638193, 0.519157625948 ); \n        poissonSphereSamplers[4] = vec3( -0.561872200916, -0.665581249881, -0.131630473211 ); \n        poissonSphereSamplers[5] = vec3( -0.409905973809, 0.0250731510778, 0.674676954809 ); \n        poissonSphereSamplers[6] = vec3( 0.206829570551, -0.190199352704, 0.919073906156 ); \n        poissonSphereSamplers[7] = vec3( -0.857514664463, 0.0274425010091, -0.475068738967 ); \n        poissonSphereSamplers[8] = vec3( -0.816275009951, -0.0432916479141, 0.40394579291 ); \n        poissonSphereSamplers[9] = vec3( 0.397976181928, -0.633227519667, -0.617794410447 ); \n        poissonSphereSamplers[10] = vec3( -0.181484199014, 0.0155418272003, -0.34675720703 ); \n        poissonSphereSamplers[11] = vec3( 0.591734926919, 0.489930882201, -0.51675303188 ); \n        poissonSphereSamplers[12] = vec3( -0.264514973057, 0.834248662136, 0.464624235985 ); \n        poissonSphereSamplers[13] = vec3( -0.125845223505, 0.812029586099, -0.46213797731 ); \n        poissonSphereSamplers[14] = vec3( 0.0345715424639, 0.349983742938, 0.855109899027 ); \n        poissonSphereSamplers[15] = vec3( 0.694340492749, -0.281052190209, -0.379600605543 ); \n        poissonSphereSamplers[16] = vec3( -0.241055518078, -0.580199280578, 0.435381168431 );\n        poissonSphereSamplers[17] = vec3( 0.126313722289, 0.715113642744, 0.124385788055 ); \n        poissonSphereSamplers[18] = vec3( 0.752862552387, 0.277075021888, 0.275059597549 );\n        poissonSphereSamplers[19] = vec3( -0.400896300918, -0.309374534321, -0.74285782627 ); \n        poissonSphereSamplers[20] = vec3( 0.121843331941, -0.00381197918195, 0.322441835258 ); \n        poissonSphereSamplers[21] = vec3( 0.741656771351, -0.472083016745, 0.14589173819 ); \n        poissonSphereSamplers[22] = vec3( -0.120347565985, -0.397252703556, -0.00153836114051 ); \n        poissonSphereSamplers[23] = vec3( -0.846258835203, -0.433763808754, 0.168732209784 ); \n        poissonSphereSamplers[24] = vec3( 0.257765618362, -0.546470581239, -0.242234375624 ); \n        poissonSphereSamplers[25] = vec3( -0.640343473361, 0.51920903395, 0.549310644325 ); \n        poissonSphereSamplers[26] = vec3( -0.894309984621, 0.297394061018, 0.0884583225292 ); \n        poissonSphereSamplers[27] = vec3( -0.126241933628, -0.535151016335, -0.440093659672 ); \n        poissonSphereSamplers[28] = vec3( -0.158176440297, -0.393125021578, 0.890727226039 ); \n        poissonSphereSamplers[29] = vec3( 0.896024272938, 0.203068725821, -0.11198597748 ); \n        poissonSphereSamplers[30] = vec3( 0.568671758933, -0.314144243629, 0.509070768816 ); \n        poissonSphereSamplers[31] = vec3( 0.289665332178, 0.104356977462, -0.348379247171 );\n    }\n\n    vec3 environmentSampler(samplerCube cubeMapSampler, vec3 centralDirection, float microsurfaceAverageSlope)\n    {\n        vec3 result = vec3(0., 0., 0.);\n        for(int i = 0; i < poissonSphereSamplersCount; i++)\n        {\n            vec3 offset = poissonSphereSamplers[i];\n            vec3 direction = centralDirection + microsurfaceAverageSlope * offset;\n            result += textureCube(cubeMapSampler, direction, 0.).rgb;\n        }\n\n        result /= 32.0;\n        return result;\n    }\n\n#endif\n\n// PBR HELPER METHODS\nfloat Square(float value)\n{\n    return value * value;\n}\n\nfloat getLuminance(vec3 color)\n{\n    return clamp(dot(color, vec3(0.2126, 0.7152, 0.0722)), 0., 1.);\n}\n\nfloat convertRoughnessToAverageSlope(float roughness)\n{\n    // Calculate AlphaG as square of roughness; add epsilon to avoid numerical issues\n    const float kMinimumVariance = 0.0005;\n    float alphaG = Square(roughness) + kMinimumVariance;\n    return alphaG;\n}\n\n// Based on Beckamm roughness to Blinn exponent + http://casual-effects.blogspot.ca/2011/08/plausible-environment-lighting-in-two.html \nfloat getMipMapIndexFromAverageSlope(float maxMipLevel, float alpha)\n{\n    // do not take in account lower mips hence -1... and wait from proper preprocess.\n    // formula comes from approximation of the mathematical solution.\n    //float mip = maxMipLevel + kRougnhessToAlphaOffset + 0.5 * log2(alpha);\n    \n    // In the mean time \n    // Always [0..1] goes from max mip to min mip in a log2 way.  \n    // Change 5 to nummip below.\n    // http://www.wolframalpha.com/input/?i=x+in+0..1+plot+(+5+%2B+0.3+%2B+0.1+*+5+*+log2(+(1+-+x)+*+(1+-+x)+%2B+0.0005))\n    float mip = kRougnhessToAlphaOffset + maxMipLevel + (maxMipLevel * kRougnhessToAlphaScale * log2(alpha));\n    \n    return clamp(mip, 0., maxMipLevel);\n}\n\n// From Microfacet Models for Refraction through Rough Surfaces, Walter et al. 2007\nfloat smithVisibilityG1_TrowbridgeReitzGGX(float dot, float alphaG)\n{\n    float tanSquared = (1.0 - dot * dot) / (dot * dot);\n    return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));\n}\n\nfloat smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL, float NdotV, float alphaG)\n{\n    return smithVisibilityG1_TrowbridgeReitzGGX(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGX(NdotV, alphaG);\n}\n\n// Trowbridge-Reitz (GGX)\n// Generalised Trowbridge-Reitz with gamma power=2.0\nfloat normalDistributionFunction_TrowbridgeReitzGGX(float NdotH, float alphaG)\n{\n    // Note: alphaG is average slope (gradient) of the normals in slope-space.\n    // It is also the (trigonometric) tangent of the median distribution value, i.e. 50% of normals have\n    // a tangent (gradient) closer to the macrosurface than this slope.\n    float a2 = Square(alphaG);\n    float d = NdotH * NdotH * (a2 - 1.0) + 1.0;\n    return a2 / (kPi * d * d);\n}\n\nvec3 fresnelSchlickGGX(float VdotH, vec3 reflectance0, vec3 reflectance90)\n{\n    return reflectance0 + (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotH, 0., 1.), 5.0);\n}\n\nvec3 FresnelSchlickEnvironmentGGX(float VdotN, vec3 reflectance0, vec3 reflectance90, float smoothness)\n{\n    // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle\n    float weight = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);\n    return reflectance0 + weight * (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotN, 0., 1.), 5.0);\n}\n\n// Cook Torance Specular computation.\nvec3 computeSpecularTerm(float NdotH, float NdotL, float NdotV, float VdotH, float roughness, vec3 specularColor)\n{\n    float alphaG = convertRoughnessToAverageSlope(roughness);\n    float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);\n    float visibility = smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL, NdotV, alphaG);\n    visibility /= (4.0 * NdotL * NdotV); // Cook Torance Denominator  integated in viibility to avoid issues when visibility function changes.\n\n    vec3 fresnel = fresnelSchlickGGX(VdotH, specularColor, vec3(1., 1., 1.));\n\n    float specTerm = max(0., visibility * distribution) * NdotL;\n    return fresnel * specTerm * kPi; // TODO: audit pi constants\n}\n\nfloat computeDiffuseTerm(float NdotL, float NdotV, float VdotH, float roughness)\n{\n    // Diffuse fresnel falloff as per Disney principled BRDF, and in the spirit of\n    // of general coupled diffuse/specular models e.g. Ashikhmin Shirley.\n    float diffuseFresnelNV = pow(clamp(1.0 - NdotL, 0.000001, 1.), 5.0);\n    float diffuseFresnelNL = pow(clamp(1.0 - NdotV, 0.000001, 1.), 5.0);\n    float diffuseFresnel90 = 0.5 + 2.0 * VdotH * VdotH * roughness;\n    float diffuseFresnelTerm =\n        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNL) *\n        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNV);\n\n\n    return diffuseFresnelTerm * NdotL;\n    // PI Test\n    // diffuseFresnelTerm /= kPi;\n}\n\nfloat adjustRoughnessFromLightProperties(float roughness, float lightRadius, float lightDistance)\n{\n    // At small angle this approximation works. \n    float lightRoughness = lightRadius / lightDistance;\n    // Distribution can sum.\n    float totalRoughness = clamp(lightRoughness + roughness, 0., 1.);\n    return totalRoughness;\n}\n\nfloat computeDefaultMicroSurface(float microSurface, vec3 reflectivityColor)\n{\n    float kReflectivityNoAlphaWorkflow_SmoothnessMax = 0.95;\n\n    float reflectivityLuminance = getLuminance(reflectivityColor);\n    float reflectivityLuma = sqrt(reflectivityLuminance);\n    microSurface = reflectivityLuma * kReflectivityNoAlphaWorkflow_SmoothnessMax;\n\n    return microSurface;\n}\n\nvec3 toLinearSpace(vec3 color)\n{\n    return vec3(pow(color.r, 2.2), pow(color.g, 2.2), pow(color.b, 2.2));\n}\n\nvec3 toGammaSpace(vec3 color)\n{\n    return vec3(pow(color.r, 1.0 / 2.2), pow(color.g, 1.0 / 2.2), pow(color.b, 1.0 / 2.2));\n}\n\nfloat computeLightFalloff(vec3 lightOffset, float lightDistanceSquared, float range)\n{\n    #ifdef USEPHYSICALLIGHTFALLOFF\n        float lightDistanceFalloff = 1.0 / ((lightDistanceSquared + 0.0001));\n        return lightDistanceFalloff;\n    #else\n        float lightFalloff = max(0., 1.0 - length(lightOffset) / range);\n        return lightFalloff;\n    #endif\n}\n\n#ifdef CAMERATONEMAP\n    vec3 toneMaps(vec3 color)\n    {\n        color = max(color, 0.0);\n\n        // TONE MAPPING / EXPOSURE\n        color.rgb = color.rgb * vCameraInfos.x;\n\n        float tuning = 1.5; // TODO: sync up so e.g. 18% greys are matched to exposure appropriately\n        // PI Test\n        // tuning *=  kPi;\n        vec3 tonemapped = 1.0 - exp2(-color.rgb * tuning); // simple local photographic tonemapper\n        color.rgb = mix(color.rgb, tonemapped, 1.0);\n        return color;\n    }\n#endif\n\n#ifdef CAMERACONTRAST\n    vec4 contrasts(vec4 color)\n    {\n        color = clamp(color, 0.0, 1.0);\n\n        vec3 resultHighContrast = color.rgb * color.rgb * (3.0 - 2.0 * color.rgb);\n        float contrast = vCameraInfos.y;\n        if (contrast < 1.0)\n        {\n            // Decrease contrast: interpolate towards zero-contrast image (flat grey)\n            color.rgb = mix(vec3(0.5, 0.5, 0.5), color.rgb, contrast);\n        }\n        else\n        {\n            // Increase contrast: apply simple shoulder-toe high contrast curve\n            color.rgb = mix(color.rgb, resultHighContrast, contrast - 1.0);\n        }\n\n        return color;\n    }\n#endif\n// END PBR HELPER METHODS\n\n    uniform vec4 vReflectivityColor;\n    uniform vec3 vEmissiveColor;\n\n// Input\nvarying vec3 vPositionW;\n\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n// Lights\n#include<light0FragmentDeclaration>\n#include<light1FragmentDeclaration>\n#include<light2FragmentDeclaration>\n#include<light3FragmentDeclaration>\n\n// Samplers\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform sampler2D albedoSampler;\nuniform vec2 vAlbedoInfos;\n#endif\n\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform sampler2D ambientSampler;\nuniform vec2 vAmbientInfos;\n#endif\n\n#ifdef OPACITY\t\nvarying vec2 vOpacityUV;\nuniform sampler2D opacitySampler;\nuniform vec2 vOpacityInfos;\n#endif\n\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform vec2 vEmissiveInfos;\nuniform sampler2D emissiveSampler;\n#endif\n\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\nuniform vec2 vLightmapInfos;\nuniform sampler2D lightmapSampler;\n#endif\n\n#if defined(REFLECTIVITY)\nvarying vec2 vReflectivityUV;\nuniform vec2 vReflectivityInfos;\nuniform sampler2D reflectivitySampler;\n#endif\n\n// Fresnel\n#include<fresnelFunction>\n\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n// Refraction Reflection\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\n    uniform mat4 view;\n#endif\n\n// Refraction\n#ifdef REFRACTION\n    uniform vec4 vRefractionInfos;\n\n    #ifdef REFRACTIONMAP_3D\n        uniform samplerCube refractionCubeSampler;\n    #else\n        uniform sampler2D refraction2DSampler;\n        uniform mat4 refractionMatrix;\n    #endif\n#endif\n\n// Reflection\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n    #ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED\n    varying vec3 vDirectionW;\n    #endif\n\n    #if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\n    uniform mat4 reflectionMatrix;\n    #endif\n#endif\n\n#include<reflectionFunction>\n\n#endif\n\n// Shadows\n#ifdef SHADOWS\n\nfloat unpack(vec4 color)\n{\n    const vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);\n    return dot(color, bit_shift);\n}\n\n#if defined(POINTLIGHT0) || defined(POINTLIGHT1) || defined(POINTLIGHT2) || defined(POINTLIGHT3)\nuniform vec2 depthValues;\n\nfloat computeShadowCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float bias)\n{\n\tvec3 directionToLight = vPositionW - lightPosition;\n\tfloat depth = length(directionToLight);\n\tdepth = clamp(depth, 0., 1.0);\n\n\tdirectionToLight = normalize(directionToLight);\n\tdirectionToLight.y = - directionToLight.y;\n\n\tfloat shadow = unpack(textureCube(shadowSampler, directionToLight)) + bias;\n\n    if (depth > shadow)\n    {\n#ifdef OVERLOADEDSHADOWVALUES\n        return mix(1.0, darkness, vOverloadedShadowIntensity.x);\n#else\n        return darkness;\n#endif\n    }\n    return 1.0;\n}\n\nfloat computeShadowWithPCFCube(vec3 lightPosition, samplerCube shadowSampler, float mapSize, float bias, float darkness)\n{\n    vec3 directionToLight = vPositionW - lightPosition;\n    float depth = length(directionToLight);\n\n    depth = (depth - depthValues.x) / (depthValues.y - depthValues.x);\n    depth = clamp(depth, 0., 1.0);\n\n    directionToLight = normalize(directionToLight);\n    directionToLight.y = -directionToLight.y;\n\n    float visibility = 1.;\n\n    vec3 poissonDisk[4];\n    poissonDisk[0] = vec3(-1.0, 1.0, -1.0);\n    poissonDisk[1] = vec3(1.0, -1.0, -1.0);\n    poissonDisk[2] = vec3(-1.0, -1.0, -1.0);\n    poissonDisk[3] = vec3(1.0, -1.0, 1.0);\n\n    // Poisson Sampling\n    float biasedDepth = depth - bias;\n\n    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[0] * mapSize)) < biasedDepth) visibility -= 0.25;\n    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[1] * mapSize)) < biasedDepth) visibility -= 0.25;\n    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[2] * mapSize)) < biasedDepth) visibility -= 0.25;\n    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[3] * mapSize)) < biasedDepth) visibility -= 0.25;\n\n#ifdef OVERLOADEDSHADOWVALUES\n    return  min(1.0, mix(1.0, visibility + darkness, vOverloadedShadowIntensity.x));\n#else\n    return  min(1.0, visibility + darkness);\n#endif\n}\n#endif\n\n#if defined(SPOTLIGHT0) || defined(SPOTLIGHT1) || defined(SPOTLIGHT2) || defined(SPOTLIGHT3) ||  defined(DIRLIGHT0) || defined(DIRLIGHT1) || defined(DIRLIGHT2) || defined(DIRLIGHT3)\nfloat computeShadow(vec4 vPositionFromLight, sampler2D shadowSampler, float darkness, float bias)\n{\n    vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\n    depth = 0.5 * depth + vec3(0.5);\n    vec2 uv = depth.xy;\n\n    if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)\n    {\n        return 1.0;\n    }\n\n    float shadow = unpack(texture2D(shadowSampler, uv)) + bias;\n\n    if (depth.z > shadow)\n    {\n#ifdef OVERLOADEDSHADOWVALUES\n        return mix(1.0, darkness, vOverloadedShadowIntensity.x);\n#else\n        return darkness;\n#endif\n    }\n    return 1.;\n}\n\nfloat computeShadowWithPCF(vec4 vPositionFromLight, sampler2D shadowSampler, float mapSize, float bias, float darkness)\n{\n    vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\n    depth = 0.5 * depth + vec3(0.5);\n    vec2 uv = depth.xy;\n\n    if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)\n    {\n        return 1.0;\n    }\n\n    float visibility = 1.;\n\n    vec2 poissonDisk[4];\n    poissonDisk[0] = vec2(-0.94201624, -0.39906216);\n    poissonDisk[1] = vec2(0.94558609, -0.76890725);\n    poissonDisk[2] = vec2(-0.094184101, -0.92938870);\n    poissonDisk[3] = vec2(0.34495938, 0.29387760);\n\n    // Poisson Sampling\n    float biasedDepth = depth.z - bias;\n\n    if (unpack(texture2D(shadowSampler, uv + poissonDisk[0] * mapSize)) < biasedDepth) visibility -= 0.25;\n    if (unpack(texture2D(shadowSampler, uv + poissonDisk[1] * mapSize)) < biasedDepth) visibility -= 0.25;\n    if (unpack(texture2D(shadowSampler, uv + poissonDisk[2] * mapSize)) < biasedDepth) visibility -= 0.25;\n    if (unpack(texture2D(shadowSampler, uv + poissonDisk[3] * mapSize)) < biasedDepth) visibility -= 0.25;\n\n#ifdef OVERLOADEDSHADOWVALUES\n    return  min(1.0, mix(1.0, visibility + darkness, vOverloadedShadowIntensity.x));\n#else\n    return  min(1.0, visibility + darkness);\n#endif\n}\n\n// Thanks to http://devmaster.net/\nfloat unpackHalf(vec2 color)\n{\n    return color.x + (color.y / 255.0);\n}\n\nfloat linstep(float low, float high, float v) {\n    return clamp((v - low) / (high - low), 0.0, 1.0);\n}\n\nfloat ChebychevInequality(vec2 moments, float compare, float bias)\n{\n    float p = smoothstep(compare - bias, compare, moments.x);\n    float variance = max(moments.y - moments.x * moments.x, 0.02);\n    float d = compare - moments.x;\n    float p_max = linstep(0.2, 1.0, variance / (variance + d * d));\n\n    return clamp(max(p, p_max), 0.0, 1.0);\n}\n\nfloat computeShadowWithVSM(vec4 vPositionFromLight, sampler2D shadowSampler, float bias, float darkness)\n{\n    vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\n    depth = 0.5 * depth + vec3(0.5);\n    vec2 uv = depth.xy;\n\n    if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0 || depth.z >= 1.0)\n    {\n        return 1.0;\n    }\n\n    vec4 texel = texture2D(shadowSampler, uv);\n\n    vec2 moments = vec2(unpackHalf(texel.xy), unpackHalf(texel.zw));\n#ifdef OVERLOADEDSHADOWVALUES\n    return min(1.0, mix(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness, vOverloadedShadowIntensity.x));\n#else\n    return min(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness);\n#endif\n}\n#endif\n\n#endif\n\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n\n// Fog\n#include<fogFragmentDeclaration>\n\n// Light Computing\nstruct lightingInfo\n{\n    vec3 diffuse;\n#ifdef SPECULARTERM\n    vec3 specular;\n#endif\n};\n\nlightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV, float lightRadius) {\n    lightingInfo result;\n\n    vec3 lightDirection;\n    float attenuation = 1.0;\n    float lightDistance;\n    \n    // Point\n    if (lightData.w == 0.)\n    {\n        vec3 lightOffset = lightData.xyz - vPositionW;\n        float lightDistanceSquared = dot(lightOffset, lightOffset);\n        attenuation = computeLightFalloff(lightOffset, lightDistanceSquared, range);\n        \n        lightDistance = sqrt(lightDistanceSquared);\n        lightDirection = normalize(lightOffset);\n    }\n    // Directional\n    else\n    {\n        lightDistance = length(-lightData.xyz);\n        lightDirection = normalize(-lightData.xyz);\n    }\n    \n    // Roughness\n    roughness = adjustRoughnessFromLightProperties(roughness, lightRadius, lightDistance);\n    \n    // diffuse\n    vec3 H = normalize(viewDirectionW + lightDirection);\n    float NdotL = max(0.00000000001, dot(vNormal, lightDirection));\n    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));\n\n    float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);\n    result.diffuse = diffuseTerm * diffuseColor * attenuation;\n\n#ifdef SPECULARTERM\n    // Specular\n    float NdotH = max(0.00000000001, dot(vNormal, H));\n\n    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\n    result.specular = specTerm * attenuation;\n#endif\n\n    return result;\n}\n\nlightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV, float lightRadius) {\n    lightingInfo result;\n\n    vec3 lightOffset = lightData.xyz - vPositionW;\n    vec3 lightVectorW = normalize(lightOffset);\n\n    // diffuse\n    float cosAngle = max(0.000000000000001, dot(-lightDirection.xyz, lightVectorW));\n    \n    if (cosAngle >= lightDirection.w)\n    {\n        cosAngle = max(0., pow(cosAngle, lightData.w));\n        \n        // Inverse squared falloff.\n        float lightDistanceSquared = dot(lightOffset, lightOffset);\n        float attenuation = computeLightFalloff(lightOffset, lightDistanceSquared, range);\n        \n        // Directional falloff.\n        attenuation *= cosAngle;\n        \n        // Roughness.\n        float lightDistance = sqrt(lightDistanceSquared);\n        roughness = adjustRoughnessFromLightProperties(roughness, lightRadius, lightDistance);\n        \n        // Diffuse\n        vec3 H = normalize(viewDirectionW - lightDirection.xyz);\n        float NdotL = max(0.00000000001, dot(vNormal, -lightDirection.xyz));\n        float VdotH = clamp(dot(viewDirectionW, H), 0.00000000001, 1.0);\n\n        float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);\n        result.diffuse = diffuseTerm * diffuseColor * attenuation;\n\n#ifdef SPECULARTERM\n        // Specular\n        float NdotH = max(0.00000000001, dot(vNormal, H));\n\n        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\n        result.specular = specTerm  * attenuation;\n#endif\n\n        return result;\n    }\n\n    result.diffuse = vec3(0.);\n#ifdef SPECULARTERM\n    result.specular = vec3(0.);\n#endif\n\n    return result;\n}\n\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float roughness, float NdotV, float lightRadius) {\n    lightingInfo result;\n\n    // Roughness\n    // Do not touch roughness on hemispheric.\n\n    // Diffuse\n    float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;\n    result.diffuse = mix(groundColor, diffuseColor, ndl);\n\n#ifdef SPECULARTERM\n    // Specular\n    vec3 lightVectorW = normalize(lightData.xyz);\n    vec3 H = normalize(viewDirectionW + lightVectorW);\n    float NdotH = max(0.00000000001, dot(vNormal, H));\n    float NdotL = max(0.00000000001, ndl);\n    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));\n\n    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\n    result.specular = specTerm;\n#endif\n\n    return result;\n}\n\nvoid main(void) {\n#include<clipPlaneFragment>\n\n    #ifdef PoissonSamplingEnvironment\n        initSamplers();\n    #endif\n\n    vec3 viewDirectionW = normalize(vEyePosition - vPositionW);\n\n    // Albedo\n    vec4 surfaceAlbedo = vec4(1., 1., 1., 1.);\n    vec3 surfaceAlbedoContribution = vAlbedoColor.rgb;\n    \n    // Alpha\n    float alpha = vAlbedoColor.a;\n\n    #ifdef ALBEDO\n        surfaceAlbedo = texture2D(albedoSampler, vAlbedoUV);\n        surfaceAlbedo = vec4(toLinearSpace(surfaceAlbedo.rgb), surfaceAlbedo.a);\n\n        #ifndef LINKREFRACTIONTOTRANSPARENCY\n            #ifdef ALPHATEST\n                if (surfaceAlbedo.a < 0.4)\n                    discard;\n            #endif\n        #endif\n\n        #ifdef ALPHAFROMALBEDO\n            alpha *= surfaceAlbedo.a;\n        #endif\n\n        surfaceAlbedo.rgb *= vAlbedoInfos.y;\n    #else\n        // No Albedo texture.\n        surfaceAlbedo.rgb = surfaceAlbedoContribution;\n        surfaceAlbedoContribution = vec3(1., 1., 1.);\n    #endif\n\n    #ifdef VERTEXCOLOR\n        surfaceAlbedo.rgb *= vColor.rgb;\n    #endif\n\n    #ifdef OVERLOADEDVALUES\n        surfaceAlbedo.rgb = mix(surfaceAlbedo.rgb, vOverloadedAlbedo, vOverloadedIntensity.y);\n    #endif\n\n    // Bump\n    #ifdef NORMAL\n        vec3 normalW = normalize(vNormalW);\n    #else\n        vec3 normalW = vec3(1.0, 1.0, 1.0);\n    #endif\n\n\n    #ifdef BUMP\n        normalW = perturbNormal(viewDirectionW);\n    #endif\n\n    // Ambient color\n    vec3 ambientColor = vec3(1., 1., 1.);\n\n    #ifdef AMBIENT\n        ambientColor = texture2D(ambientSampler, vAmbientUV).rgb * vAmbientInfos.y;\n        \n        #ifdef OVERLOADEDVALUES\n            ambientColor.rgb = mix(ambientColor.rgb, vOverloadedAmbient, vOverloadedIntensity.x);\n        #endif\n    #endif\n\n    // Specular map\n    float microSurface = vReflectivityColor.a;\n    vec3 surfaceReflectivityColor = vReflectivityColor.rgb;\n    \n    #ifdef OVERLOADEDVALUES\n        surfaceReflectivityColor.rgb = mix(surfaceReflectivityColor.rgb, vOverloadedReflectivity, vOverloadedIntensity.z);\n    #endif\n\n    #ifdef REFLECTIVITY\n        vec4 surfaceReflectivityColorMap = texture2D(reflectivitySampler, vReflectivityUV);\n        surfaceReflectivityColor = surfaceReflectivityColorMap.rgb;\n        surfaceReflectivityColor = toLinearSpace(surfaceReflectivityColor);\n\n        #ifdef OVERLOADEDVALUES\n                surfaceReflectivityColor = mix(surfaceReflectivityColor, vOverloadedReflectivity, vOverloadedIntensity.z);\n        #endif\n\n        #ifdef MICROSURFACEFROMREFLECTIVITYMAP\n            microSurface = surfaceReflectivityColorMap.a;\n        #else\n            #ifdef MICROSURFACEAUTOMATIC\n                microSurface = computeDefaultMicroSurface(microSurface, surfaceReflectivityColor);\n            #endif\n        #endif\n    #endif\n\n    #ifdef OVERLOADEDVALUES\n        microSurface = mix(microSurface, vOverloadedMicroSurface.x, vOverloadedMicroSurface.y);\n    #endif\n\n    // Compute N dot V.\n    float NdotV = max(0.00000000001, dot(normalW, viewDirectionW));\n\n    // Adapt microSurface.\n    microSurface = clamp(microSurface, 0., 1.) * 0.98;\n\n    // Compute roughness.\n    float roughness = clamp(1. - microSurface, 0.000001, 1.0);\n    \n    // Lighting\n    vec3 lightDiffuseContribution = vec3(0., 0., 0.);\n    \n#ifdef OVERLOADEDSHADOWVALUES\n    vec3 shadowedOnlyLightDiffuseContribution = vec3(1., 1., 1.);\n#endif\n\n#ifdef SPECULARTERM\n    vec3 lightSpecularContribution= vec3(0., 0., 0.);\n#endif\n    float notShadowLevel = 1.; // 1 - shadowLevel\n\n#ifdef LIGHT0\n#ifndef SPECULARTERM\n    vec3 vLightSpecular0 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT0\n    lightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, roughness, NdotV, vLightRadiuses[0]);\n#endif\n#ifdef HEMILIGHT0\n    lightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightGround0, roughness, NdotV, vLightRadiuses[0]);\n#endif\n#if defined(POINTLIGHT0) || defined(DIRLIGHT0)\n    lightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, roughness, NdotV, vLightRadiuses[0]);\n#endif\n#ifdef SHADOW0\n#ifdef SHADOWVSM0\n    notShadowLevel = computeShadowWithVSM(vPositionFromLight0, shadowSampler0, shadowsInfo0.z, shadowsInfo0.x);\n#else\n#ifdef SHADOWPCF0\n#if defined(POINTLIGHT0)\n    notShadowLevel = computeShadowWithPCFCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);\n#else\n    notShadowLevel = computeShadowWithPCF(vPositionFromLight0, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);\n#endif\n#else\n#if defined(POINTLIGHT0)\n    notShadowLevel = computeShadowCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);\n#else\n    notShadowLevel = computeShadow(vPositionFromLight0, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);\n#endif\n#endif\n#endif\n#else\n    notShadowLevel = 1.;\n#endif\n    lightDiffuseContribution += info.diffuse * notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyLightDiffuseContribution *= notShadowLevel;\n#endif\n\n#ifdef SPECULARTERM\n    lightSpecularContribution += info.specular * notShadowLevel;\n#endif\n#endif\n\n#ifdef LIGHT1\n#ifndef SPECULARTERM\n    vec3 vLightSpecular1 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT1\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, roughness, NdotV, vLightRadiuses[1]);\n#endif\n#ifdef HEMILIGHT1\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightGround1, roughness, NdotV, vLightRadiuses[1]);\n#endif\n#if defined(POINTLIGHT1) || defined(DIRLIGHT1)\n    info = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, roughness, NdotV, vLightRadiuses[1]);\n#endif\n#ifdef SHADOW1\n#ifdef SHADOWVSM1\n    notShadowLevel = computeShadowWithVSM(vPositionFromLight1, shadowSampler1, shadowsInfo1.z, shadowsInfo1.x);\n#else\n#ifdef SHADOWPCF1\n#if defined(POINTLIGHT1)\n    notShadowLevel = computeShadowWithPCFCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);\n#else\n    notShadowLevel = computeShadowWithPCF(vPositionFromLight1, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);\n#endif\n#else\n#if defined(POINTLIGHT1)\n    notShadowLevel = computeShadowCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);\n#else\n    notShadowLevel = computeShadow(vPositionFromLight1, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);\n#endif\n#endif\n#endif\n#else\n    notShadowLevel = 1.;\n#endif\n\n    lightDiffuseContribution += info.diffuse * notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyLightDiffuseContribution *= notShadowLevel;\n#endif\n\n#ifdef SPECULARTERM\n    lightSpecularContribution += info.specular * notShadowLevel;\n#endif\n#endif\n\n#ifdef LIGHT2\n#ifndef SPECULARTERM\n    vec3 vLightSpecular2 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT2\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, roughness, NdotV, vLightRadiuses[2]);\n#endif\n#ifdef HEMILIGHT2\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightGround2, roughness, NdotV, vLightRadiuses[2]);\n#endif\n#if defined(POINTLIGHT2) || defined(DIRLIGHT2)\n    info = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, roughness, NdotV, vLightRadiuses[2]);\n#endif\n#ifdef SHADOW2\n#ifdef SHADOWVSM2\n    notShadowLevel = computeShadowWithVSM(vPositionFromLight2, shadowSampler2, shadowsInfo2.z, shadowsInfo2.x);\n#else\n#ifdef SHADOWPCF2\n#if defined(POINTLIGHT2)\n    notShadowLevel = computeShadowWithPCFCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);\n#else\n    notShadowLevel = computeShadowWithPCF(vPositionFromLight2, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);\n#endif\n#else\n#if defined(POINTLIGHT2)\n    notShadowLevel = computeShadowCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);\n#else\n    notShadowLevel = computeShadow(vPositionFromLight2, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);\n#endif\n#endif\t\n#endif\t\n#else\n    notShadowLevel = 1.;\n#endif\n\n    lightDiffuseContribution += info.diffuse * notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyLightDiffuseContribution *= notShadowLevel;\n#endif\n\n#ifdef SPECULARTERM\n    lightSpecularContribution += info.specular * notShadowLevel;\n#endif\n#endif\n\n#ifdef LIGHT3\n#ifndef SPECULARTERM\n    vec3 vLightSpecular3 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT3\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, roughness, NdotV, vLightRadiuses[3]);\n#endif\n#ifdef HEMILIGHT3\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightGround3, roughness, NdotV, vLightRadiuses[3]);\n#endif\n#if defined(POINTLIGHT3) || defined(DIRLIGHT3)\n    info = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, roughness, NdotV, vLightRadiuses[3]);\n#endif\n#ifdef SHADOW3\n#ifdef SHADOWVSM3\n    notShadowLevel = computeShadowWithVSM(vPositionFromLight3, shadowSampler3, shadowsInfo3.z, shadowsInfo3.x);\n#else\n#ifdef SHADOWPCF3\n#if defined(POINTLIGHT3)\n    notShadowLevel = computeShadowWithPCFCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);\n#else\n    notShadowLevel = computeShadowWithPCF(vPositionFromLight3, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);\n#endif\n#else\n#if defined(POINTLIGHT3)\n    notShadowLevel = computeShadowCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);\n#else\n    notShadowLevel = computeShadow(vPositionFromLight3, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);\n#endif\n#endif\t\n#endif\t\n#else\n    notShadowLevel = 1.;\n#endif\n\n    lightDiffuseContribution += info.diffuse * notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyLightDiffuseContribution *= notShadowLevel;\n#endif\n\n#ifdef SPECULARTERM\n    lightSpecularContribution += info.specular * notShadowLevel;\n#endif\n#endif\n\n#ifdef SPECULARTERM\n    lightSpecularContribution *= vLightingIntensity.w;\n#endif\n\n#ifdef OPACITY\n    vec4 opacityMap = texture2D(opacitySampler, vOpacityUV);\n\n    #ifdef OPACITYRGB\n        opacityMap.rgb = opacityMap.rgb * vec3(0.3, 0.59, 0.11);\n        alpha *= (opacityMap.x + opacityMap.y + opacityMap.z)* vOpacityInfos.y;\n    #else\n        alpha *= opacityMap.a * vOpacityInfos.y;\n    #endif\n\n#endif\n\n#ifdef VERTEXALPHA\n    alpha *= vColor.a;\n#endif\n\n#ifdef OPACITYFRESNEL\n    float opacityFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, opacityParts.z, opacityParts.w);\n\n    alpha += opacityParts.x * (1.0 - opacityFresnelTerm) + opacityFresnelTerm * opacityParts.y;\n#endif\n\n// Refraction\nvec3 surfaceRefractionColor = vec3(0., 0., 0.);\n\n// Go mat -> blurry reflexion according to microSurface\n#ifdef LODBASEDMICROSFURACE\n    float alphaG = convertRoughnessToAverageSlope(roughness);\n#else\n    float bias = 20. * (1.0 - microSurface);\n#endif\n        \n#ifdef REFRACTION\n\tvec3 refractionVector = normalize(refract(-viewDirectionW, normalW, vRefractionInfos.y));\n    \n    #ifdef LODBASEDMICROSFURACE\n        float lodRefraction = getMipMapIndexFromAverageSlope(vMicrosurfaceTextureLods.y, alphaG);\n    #endif\n    \n    #ifdef REFRACTIONMAP_3D\n        refractionVector.y = refractionVector.y * vRefractionInfos.w;\n\n        if (dot(refractionVector, viewDirectionW) < 1.0)\n        {\n            #ifdef LODBASEDMICROSFURACE\n                surfaceRefractionColor = textureCubeLodEXT(refractionCubeSampler, refractionVector, lodRefraction).rgb * vRefractionInfos.x;\n            #else\n                surfaceRefractionColor = textureCube(refractionCubeSampler, refractionVector, bias).rgb * vRefractionInfos.x;\n            #endif\n        }\n        \n        #ifndef REFRACTIONMAPINLINEARSPACE\n            surfaceRefractionColor = toLinearSpace(surfaceRefractionColor.rgb); \n        #endif\n    #else\n        vec3 vRefractionUVW = vec3(refractionMatrix * (view * vec4(vPositionW + refractionVector * vRefractionInfos.z, 1.0)));\n\n        vec2 refractionCoords = vRefractionUVW.xy / vRefractionUVW.z;\n\n        refractionCoords.y = 1.0 - refractionCoords.y;\n\n        #ifdef LODBASEDMICROSFURACE\n            surfaceRefractionColor = texture2DLodEXT(refraction2DSampler, refractionCoords, lodRefraction).rgb * vRefractionInfos.x;\n        #else\n            surfaceRefractionColor = texture2D(refraction2DSampler, refractionCoords, bias).rgb * vRefractionInfos.x;\n        #endif    \n        \n        surfaceRefractionColor = toLinearSpace(surfaceRefractionColor.rgb); \n    #endif\n#endif\n\n// Reflection\nvec3 environmentRadiance = vReflectionColor.rgb;\nvec3 environmentIrradiance = vReflectionColor.rgb;\n\n#ifdef REFLECTION\n    vec3 vReflectionUVW = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);\n\n    #ifdef LODBASEDMICROSFURACE\n        float lodReflection = getMipMapIndexFromAverageSlope(vMicrosurfaceTextureLods.x, alphaG);\n    #endif\n    \n    #ifdef REFLECTIONMAP_3D\n        \n        #ifdef LODBASEDMICROSFURACE\n            environmentRadiance = textureCubeLodEXT(reflectionCubeSampler, vReflectionUVW, lodReflection).rgb * vReflectionInfos.x;\n        #else\n            environmentRadiance = textureCube(reflectionCubeSampler, vReflectionUVW, bias).rgb * vReflectionInfos.x;\n        #endif\n        \n        #ifdef PoissonSamplingEnvironment\n            environmentRadiance = environmentSampler(reflectionCubeSampler, vReflectionUVW, alphaG) * vReflectionInfos.x;\n        #endif\n\n        #ifdef USESPHERICALFROMREFLECTIONMAP\n            #ifndef REFLECTIONMAP_SKYBOX\n                vec3 normalEnvironmentSpace = (reflectionMatrix * vec4(normalW, 1)).xyz;\n                environmentIrradiance = EnvironmentIrradiance(normalEnvironmentSpace);\n            #endif\n        #else\n            environmentRadiance = toLinearSpace(environmentRadiance.rgb);\n            \n            environmentIrradiance = textureCube(reflectionCubeSampler, normalW, 20.).rgb * vReflectionInfos.x;\n            environmentIrradiance = toLinearSpace(environmentIrradiance.rgb);\n            environmentIrradiance *= 0.2; // Hack in case of no hdr cube map use for environment.\n        #endif\n    #else\n        vec2 coords = vReflectionUVW.xy;\n\n        #ifdef REFLECTIONMAP_PROJECTION\n            coords /= vReflectionUVW.z;\n        #endif\n\n        coords.y = 1.0 - coords.y;\n        #ifdef LODBASEDMICROSFURACE\n            environmentRadiance = texture2DLodEXT(reflection2DSampler, coords, lodReflection).rgb * vReflectionInfos.x;\n        #else\n            environmentRadiance = texture2D(reflection2DSampler, coords, bias).rgb * vReflectionInfos.x;\n        #endif\n    \n        environmentRadiance = toLinearSpace(environmentRadiance.rgb);\n\n        environmentIrradiance = texture2D(reflection2DSampler, coords, 20.).rgb * vReflectionInfos.x;\n        environmentIrradiance = toLinearSpace(environmentIrradiance.rgb);\n    #endif\n#endif\n\n#ifdef OVERLOADEDVALUES\n    environmentIrradiance = mix(environmentIrradiance, vOverloadedReflection, vOverloadedMicroSurface.z);\n    environmentRadiance = mix(environmentRadiance, vOverloadedReflection, vOverloadedMicroSurface.z);\n#endif\n\nenvironmentRadiance *= vLightingIntensity.z;\nenvironmentIrradiance *= vLightingIntensity.z;\n\n// Compute reflection specular fresnel\nvec3 specularEnvironmentR0 = surfaceReflectivityColor.rgb;\nvec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0);\nvec3 specularEnvironmentReflectance = FresnelSchlickEnvironmentGGX(clamp(NdotV, 0., 1.), specularEnvironmentR0, specularEnvironmentR90, sqrt(microSurface));\n\n// Compute refractance\nvec3 refractance = vec3(0.0 , 0.0, 0.0);\n#ifdef REFRACTION\n    vec3 transmission = vec3(1.0 , 1.0, 1.0);\n    #ifdef LINKREFRACTIONTOTRANSPARENCY\n        // Transmission based on alpha.\n        transmission *= (1.0 - alpha);\n        \n        // Tint the material with albedo.\n        // TODO. PBR Tinting.\n        vec3 mixedAlbedo = surfaceAlbedoContribution.rgb * surfaceAlbedo.rgb;\n        float maxChannel = max(max(mixedAlbedo.r, mixedAlbedo.g), mixedAlbedo.b);\n        vec3 tint = clamp(maxChannel * mixedAlbedo, 0.0, 1.0);\n        \n        // Decrease Albedo Contribution\n        surfaceAlbedoContribution *= alpha;\n        \n        // Decrease irradiance Contribution\n        environmentIrradiance *= alpha;\n        \n        // Tint reflectance\n        surfaceRefractionColor *= tint;\n        \n        // Put alpha back to 1;\n        alpha = 1.0;\n    #endif\n    \n    // Add Multiple internal bounces.\n    vec3 bounceSpecularEnvironmentReflectance = (2.0 * specularEnvironmentReflectance) / (1.0 + specularEnvironmentReflectance);\n    specularEnvironmentReflectance = mix(bounceSpecularEnvironmentReflectance, specularEnvironmentReflectance, alpha);\n    \n    // In theory T = 1 - R.\n    transmission *= 1.0 - specularEnvironmentReflectance;\n    \n    // Should baked in diffuse.\n    refractance = surfaceRefractionColor * transmission;\n#endif\n\n// Apply Energy Conservation taking in account the environment level only if the environment is present.\nfloat reflectance = max(max(surfaceReflectivityColor.r, surfaceReflectivityColor.g), surfaceReflectivityColor.b);\nsurfaceAlbedo.rgb = (1. - reflectance) * surfaceAlbedo.rgb;\n\nrefractance *= vLightingIntensity.z;\nenvironmentRadiance *= specularEnvironmentReflectance;\n\n// Emissive\nvec3 surfaceEmissiveColor = vEmissiveColor;\n#ifdef EMISSIVE\n    vec3 emissiveColorTex = texture2D(emissiveSampler, vEmissiveUV).rgb;\n    surfaceEmissiveColor = toLinearSpace(emissiveColorTex.rgb) * surfaceEmissiveColor * vEmissiveInfos.y;\n#endif\n\n#ifdef OVERLOADEDVALUES\n    surfaceEmissiveColor = mix(surfaceEmissiveColor, vOverloadedEmissive, vOverloadedIntensity.w);\n#endif\n\n#ifdef EMISSIVEFRESNEL\n    float emissiveFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, emissiveRightColor.a, emissiveLeftColor.a);\n\n    surfaceEmissiveColor *= emissiveLeftColor.rgb * (1.0 - emissiveFresnelTerm) + emissiveFresnelTerm * emissiveRightColor.rgb;\n#endif\n\n// Composition\n#ifdef EMISSIVEASILLUMINATION\n    vec3 finalDiffuse = max(lightDiffuseContribution * surfaceAlbedoContribution + vAmbientColor, 0.0) * surfaceAlbedo.rgb;\n    \n    #ifdef OVERLOADEDSHADOWVALUES\n        shadowedOnlyLightDiffuseContribution = max(shadowedOnlyLightDiffuseContribution * surfaceAlbedoContribution + vAmbientColor, 0.0) * surfaceAlbedo.rgb;\n    #endif\n#else\n    #ifdef LINKEMISSIVEWITHALBEDO\n        vec3 finalDiffuse = max((lightDiffuseContribution + surfaceEmissiveColor) * surfaceAlbedoContribution + vAmbientColor, 0.0) * surfaceAlbedo.rgb;\n\n        #ifdef OVERLOADEDSHADOWVALUES\n            shadowedOnlyLightDiffuseContribution = max((shadowedOnlyLightDiffuseContribution + surfaceEmissiveColor) * surfaceAlbedoContribution + vAmbientColor, 0.0) * surfaceAlbedo.rgb;\n        #endif\n    #else\n        vec3 finalDiffuse = max(lightDiffuseContribution * surfaceAlbedoContribution + surfaceEmissiveColor + vAmbientColor, 0.0) * surfaceAlbedo.rgb;\n\n        #ifdef OVERLOADEDSHADOWVALUES\n            shadowedOnlyLightDiffuseContribution = max(shadowedOnlyLightDiffuseContribution * surfaceAlbedoContribution + surfaceEmissiveColor + vAmbientColor, 0.0) * surfaceAlbedo.rgb;\n        #endif\n    #endif\n#endif\n\n#ifdef OVERLOADEDSHADOWVALUES\n    finalDiffuse = mix(finalDiffuse, shadowedOnlyLightDiffuseContribution, (1.0 - vOverloadedShadowIntensity.y));\n#endif\n\n#ifdef SPECULARTERM\n    vec3 finalSpecular = lightSpecularContribution * surfaceReflectivityColor;\n#else\n    vec3 finalSpecular = vec3(0.0);\n#endif\n\n#ifdef SPECULAROVERALPHA\n    alpha = clamp(alpha + getLuminance(finalSpecular), 0., 1.);\n#endif\n\n#ifdef RADIANCEOVERALPHA\n    alpha = clamp(alpha + getLuminance(environmentRadiance), 0., 1.);\n#endif\n\n// Composition\n// Reflection already includes the environment intensity.\n#ifdef EMISSIVEASILLUMINATION\n    vec4 finalColor = vec4(finalDiffuse * ambientColor * vLightingIntensity.x + surfaceAlbedo.rgb * environmentIrradiance + finalSpecular * vLightingIntensity.x + environmentRadiance + surfaceEmissiveColor * vLightingIntensity.y + refractance, alpha);\n#else\n    vec4 finalColor = vec4(finalDiffuse * ambientColor * vLightingIntensity.x + surfaceAlbedo.rgb * environmentIrradiance + finalSpecular * vLightingIntensity.x + environmentRadiance + refractance, alpha);\n#endif\n\n#ifdef LIGHTMAP\n    vec3 lightmapColor = texture2D(lightmapSampler, vLightmapUV).rgb * vLightmapInfos.y;\n\n    #ifdef USELIGHTMAPASSHADOWMAP\n        finalColor.rgb *= lightmapColor;\n    #else\n        finalColor.rgb += lightmapColor;\n    #endif\n#endif\n\n    finalColor = max(finalColor, 0.0);\n\n#ifdef CAMERATONEMAP\n    finalColor.rgb = toneMaps(finalColor.rgb);\n#endif\n\n    finalColor.rgb = toGammaSpace(finalColor.rgb);\n\n#ifdef CAMERACONTRAST\n    finalColor = contrasts(finalColor);\n#endif\n\n    // Normal Display.\n    // gl_FragColor = vec4(normalW * 0.5 + 0.5, 1.0);\n\n    // Ambient reflection color.\n    // gl_FragColor = vec4(ambientReflectionColor, 1.0);\n\n    // Reflection color.\n    // gl_FragColor = vec4(reflectionColor, 1.0);\n\n    // Base color.\n    // gl_FragColor = vec4(surfaceAlbedo.rgb, 1.0);\n\n    // Specular color.\n    // gl_FragColor = vec4(surfaceReflectivityColor.rgb, 1.0);\n\n    // MicroSurface color.\n    // gl_FragColor = vec4(microSurface, microSurface, microSurface, 1.0);\n\n    // Specular Map\n    // gl_FragColor = vec4(reflectivityMapColor.rgb, 1.0);\n    \n    // Refractance\n    // gl_FragColor = vec4(refractance.rgb, 1.0);\n\n    //// Emissive Color\n    //vec2 test = vEmissiveUV * 0.5 + 0.5;\n    //gl_FragColor = vec4(test.x, test.y, 1.0, 1.0);\n\n#include<logDepthFragment>\n#include<fogFragment>(color, finalColor)\n\n    gl_FragColor = finalColor;\n}";
BABYLON.Effect.ShadersStore['legacypbrVertexShader'] = "precision mediump float;\n\n// Attributes\nattribute vec3 position;\nattribute vec3 normal;\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n\n#include<bonesDeclaration>\n\n// Uniforms\nuniform mat4 world;\nuniform mat4 view;\nuniform mat4 viewProjection;\n\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform mat4 albedoMatrix;\nuniform vec2 vAlbedoInfos;\n#endif\n\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n\n#ifdef OPACITY\nvarying vec2 vOpacityUV;\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n\n#if defined(REFLECTIVITY)\nvarying vec2 vReflectivityUV;\nuniform vec2 vReflectivityInfos;\nuniform mat4 reflectivityMatrix;\n#endif\n\n// Output\nvarying vec3 vPositionW;\nvarying vec3 vNormalW;\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<clipPlaneVertexDeclaration>\n\nvoid main(void) {\n    mat4 finalWorld = world;\n\n#include<bonesVertex>\n\n    finalWorld = finalWorld * influence;\n#endif\n\n\tgl_Position = viewProjection * finalWorld * vec4(position, 1.0);\n\n\tvec4 worldPos = finalWorld * vec4(position, 1.0);\n\tvPositionW = vec3(worldPos);\n\tvNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));\n\n\t// Texture coordinates\n#ifndef UV1\n\tvec2 uv = vec2(0., 0.);\n#endif\n#ifndef UV2\n\tvec2 uv2 = vec2(0., 0.);\n#endif\n\n#ifdef ALBEDO\n\tif (vAlbedoInfos.x == 0.)\n\t{\n\t\tvAlbedoUV = vec2(albedoMatrix * vec4(uv, 1.0, 0.0));\n\t}\n\telse\n\t{\n\t\tvAlbedoUV = vec2(albedoMatrix * vec4(uv2, 1.0, 0.0));\n\t}\n#endif\n\n#ifdef AMBIENT\n\tif (vAmbientInfos.x == 0.)\n\t{\n\t\tvAmbientUV = vec2(ambientMatrix * vec4(uv, 1.0, 0.0));\n\t}\n\telse\n\t{\n\t\tvAmbientUV = vec2(ambientMatrix * vec4(uv2, 1.0, 0.0));\n\t}\n#endif\n\n#ifdef OPACITY\n\tif (vOpacityInfos.x == 0.)\n\t{\n\t\tvOpacityUV = vec2(opacityMatrix * vec4(uv, 1.0, 0.0));\n\t}\n\telse\n\t{\n\t\tvOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));\n\t}\n#endif\n\n#ifdef EMISSIVE\n\tif (vEmissiveInfos.x == 0.)\n\t{\n\t\tvEmissiveUV = vec2(emissiveMatrix * vec4(uv, 1.0, 0.0));\n\t}\n\telse\n\t{\n\t\tvEmissiveUV = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));\n\t}\n#endif\n\n#if defined(REFLECTIVITY)\n\tif (vReflectivityInfos.x == 0.)\n\t{\n\t\tvReflectivityUV = vec2(reflectivityMatrix * vec4(uv, 1.0, 0.0));\n\t}\n\telse\n\t{\n\t\tvReflectivityUV = vec2(reflectivityMatrix * vec4(uv2, 1.0, 0.0));\n\t}\n#endif\n\n#include<clipPlaneVertex>\n\n\t// Vertex color\n#ifdef VERTEXCOLOR\n\tvColor = color;\n#endif\n}";
BABYLON.Effect.ShadersStore['legacypbrPixelShader'] = "precision mediump float;\n\n// Constants\n#define RECIPROCAL_PI2 0.15915494\n#define FRESNEL_MAXIMUM_ON_ROUGH 0.25\n\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\nuniform vec4 vAlbedoColor;\nuniform vec3 vReflectionColor;\n\n// CUSTOM CONTROLS\nuniform vec4 vLightingIntensity;\nuniform vec4 vCameraInfos;\n\n#ifdef OVERLOADEDVALUES\nuniform vec4 vOverloadedIntensity;\nuniform vec3 vOverloadedAmbient;\nuniform vec3 vOverloadedAlbedo;\nuniform vec3 vOverloadedReflectivity;\nuniform vec3 vOverloadedEmissive;\nuniform vec3 vOverloadedReflection;\nuniform vec3 vOverloadedMicroSurface;\n#endif\n\n#ifdef OVERLOADEDSHADOWVALUES\nuniform vec4 vOverloadedShadowIntensity;\n#endif\n\n// PBR CUSTOM CONSTANTS\nconst float kPi = 3.1415926535897932384626433832795;\n\n// PBR HELPER METHODS\nfloat Square(float value)\n{\n    return value * value;\n}\n\nfloat getLuminance(vec3 color)\n{\n    return clamp(dot(color, vec3(0.2126, 0.7152, 0.0722)), 0., 1.);\n}\n\nfloat convertRoughnessToAverageSlope(float roughness)\n{\n    // Calculate AlphaG as square of roughness; add epsilon to avoid numerical issues\n    const float kMinimumVariance = 0.0005;\n    float alphaG = Square(roughness) + kMinimumVariance;\n    return alphaG;\n}\n\n// From Microfacet Models for Refraction through Rough Surfaces, Walter et al. 2007\nfloat smithVisibilityG1_TrowbridgeReitzGGX(float dot, float alphaG)\n{\n    float tanSquared = (1.0 - dot * dot) / (dot * dot);\n    return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));\n}\n\nfloat smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL, float NdotV, float alphaG)\n{\n    return smithVisibilityG1_TrowbridgeReitzGGX(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGX(NdotV, alphaG);\n}\n\n// Trowbridge-Reitz (GGX)\n// Generalised Trowbridge-Reitz with gamma power=2.0\nfloat normalDistributionFunction_TrowbridgeReitzGGX(float NdotH, float alphaG)\n{\n    // Note: alphaG is average slope (gradient) of the normals in slope-space.\n    // It is also the (trigonometric) tangent of the median distribution value, i.e. 50% of normals have\n    // a tangent (gradient) closer to the macrosurface than this slope.\n    float a2 = Square(alphaG);\n    float d = NdotH * NdotH * (a2 - 1.0) + 1.0;\n    return a2 / (kPi * d * d);\n}\n\nvec3 fresnelSchlickGGX(float VdotH, vec3 reflectance0, vec3 reflectance90)\n{\n    return reflectance0 + (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotH, 0., 1.), 5.0);\n}\n\nvec3 FresnelSchlickEnvironmentGGX(float VdotN, vec3 reflectance0, vec3 reflectance90, float smoothness)\n{\n    // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle\n    float weight = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);\n    return reflectance0 + weight * (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotN, 0., 1.), 5.0);\n}\n\n// Cook Torance Specular computation.\nvec3 computeSpecularTerm(float NdotH, float NdotL, float NdotV, float VdotH, float roughness, vec3 specularColor)\n{\n    float alphaG = convertRoughnessToAverageSlope(roughness);\n    float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);\n    float visibility = smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL, NdotV, alphaG);\n    visibility /= (4.0 * NdotL * NdotV); // Cook Torance Denominator  integated in viibility to avoid issues when visibility function changes.\n\n    vec3 fresnel = fresnelSchlickGGX(VdotH, specularColor, vec3(1., 1., 1.));\n\n    float specTerm = max(0., visibility * distribution) * NdotL;\n    return fresnel * specTerm;\n}\n\nfloat computeDiffuseTerm(float NdotL, float NdotV, float VdotH, float roughness)\n{\n    // Diffuse fresnel falloff as per Disney principled BRDF, and in the spirit of\n    // of general coupled diffuse/specular models e.g. Ashikhmin Shirley.\n    float diffuseFresnelNV = pow(clamp(1.0 - NdotL, 0.000001, 1.), 5.0);\n    float diffuseFresnelNL = pow(clamp(1.0 - NdotV, 0.000001, 1.), 5.0);\n    float diffuseFresnel90 = 0.5 + 2.0 * VdotH * VdotH * roughness;\n    float diffuseFresnelTerm =\n        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNL) *\n        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNV);\n\n    return diffuseFresnelTerm * NdotL;\n}\n\nfloat computeDefaultMicroSurface(float microSurface, vec3 reflectivityColor)\n{\n    if (microSurface == 0.)\n    {\n        float kReflectivityNoAlphaWorkflow_SmoothnessMax = 0.95;\n\n        float reflectivityLuminance = getLuminance(reflectivityColor);\n        float reflectivityLuma = sqrt(reflectivityLuminance);\n        microSurface = reflectivityLuma * kReflectivityNoAlphaWorkflow_SmoothnessMax;\n    }\n    return microSurface;\n}\n\nvec3 toLinearSpace(vec3 color)\n{\n    return vec3(pow(color.r, 2.2), pow(color.g, 2.2), pow(color.b, 2.2));\n}\n\nvec3 toGammaSpace(vec3 color)\n{\n    return vec3(pow(color.r, 1.0 / 2.2), pow(color.g, 1.0 / 2.2), pow(color.b, 1.0 / 2.2));\n}\n\n#ifdef CAMERATONEMAP\n    vec3 toneMaps(vec3 color)\n    {\n        color = max(color, 0.0);\n\n        // TONE MAPPING / EXPOSURE\n        color.rgb = color.rgb * vCameraInfos.x;\n\n        float tuning = 1.5; // TODO: sync up so e.g. 18% greys are matched to exposure appropriately\n        vec3 tonemapped = 1.0 - exp2(-color.rgb * tuning); // simple local photographic tonemapper\n        color.rgb = mix(color.rgb, tonemapped, 1.0);\n        return color;\n    }\n#endif\n\n#ifdef CAMERACONTRAST\n    vec4 contrasts(vec4 color)\n    {\n        color = clamp(color, 0.0, 1.0);\n\n        vec3 resultHighContrast = color.rgb * color.rgb * (3.0 - 2.0 * color.rgb);\n        float contrast = vCameraInfos.y;\n        if (contrast < 1.0)\n        {\n            // Decrease contrast: interpolate towards zero-contrast image (flat grey)\n            color.rgb = mix(vec3(0.5, 0.5, 0.5), color.rgb, contrast);\n        }\n        else\n        {\n            // Increase contrast: apply simple shoulder-toe high contrast curve\n            color.rgb = mix(color.rgb, resultHighContrast, contrast - 1.0);\n        }\n\n        return color;\n    }\n#endif\n// END PBR HELPER METHODS\n\nuniform vec4 vReflectivityColor;\nuniform vec3 vEmissiveColor;\n\n// Input\nvarying vec3 vPositionW;\n\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n// Lights\n#include<light0FragmentDeclaration>\n#include<light1FragmentDeclaration>\n#include<light2FragmentDeclaration>\n#include<light3FragmentDeclaration>\n\n// Samplers\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform sampler2D albedoSampler;\nuniform vec2 vAlbedoInfos;\n#endif\n\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform sampler2D ambientSampler;\nuniform vec2 vAmbientInfos;\n#endif\n\n#ifdef OPACITY\t\nvarying vec2 vOpacityUV;\nuniform sampler2D opacitySampler;\nuniform vec2 vOpacityInfos;\n#endif\n\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform vec2 vEmissiveInfos;\nuniform sampler2D emissiveSampler;\n#endif\n\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\nuniform vec2 vLightmapInfos;\nuniform sampler2D lightmapSampler;\n#endif\n\n#if defined(REFLECTIVITY)\nvarying vec2 vReflectivityUV;\nuniform vec2 vReflectivityInfos;\nuniform sampler2D reflectivitySampler;\n#endif\n\n#include<clipPlaneFragmentDeclaration>\n\n// Light Computing\nstruct lightingInfo\n{\n    vec3 diffuse;\n#ifdef SPECULARTERM\n    vec3 specular;\n#endif\n};\n\nlightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV) {\n    lightingInfo result;\n\n    vec3 lightVectorW;\n    float attenuation = 1.0;\n    if (lightData.w == 0.)\n    {\n        vec3 direction = lightData.xyz - vPositionW;\n\n        attenuation = max(0., 1.0 - length(direction) / range);\n        lightVectorW = normalize(direction);\n    }\n    else\n    {\n        lightVectorW = normalize(-lightData.xyz);\n    }\n\n    // diffuse\n    vec3 H = normalize(viewDirectionW + lightVectorW);\n    float NdotL = max(0.00000000001, dot(vNormal, lightVectorW));\n    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));\n\n    float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);\n    result.diffuse = diffuseTerm * diffuseColor * attenuation;\n\n#ifdef SPECULARTERM\n    // Specular\n    float NdotH = max(0.00000000001, dot(vNormal, H));\n\n    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\n    result.specular = specTerm * specularColor * attenuation;\n#endif\n\n    return result;\n}\n\nlightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV) {\n    lightingInfo result;\n\n    vec3 direction = lightData.xyz - vPositionW;\n    vec3 lightVectorW = normalize(direction);\n    float attenuation = max(0., 1.0 - length(direction) / range);\n\n    // diffuse\n    float cosAngle = max(0.0000001, dot(-lightDirection.xyz, lightVectorW));\n    float spotAtten = 0.0;\n\n    if (cosAngle >= lightDirection.w)\n    {\n        cosAngle = max(0., pow(cosAngle, lightData.w));\n        spotAtten = clamp((cosAngle - lightDirection.w) / (1. - cosAngle), 0.0, 1.0);\n\n        // Diffuse\n        vec3 H = normalize(viewDirectionW - lightDirection.xyz);\n        float NdotL = max(0.00000000001, dot(vNormal, -lightDirection.xyz));\n        float VdotH = clamp(dot(viewDirectionW, H), 0.00000000001, 1.0);\n\n        float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);\n        result.diffuse = diffuseTerm * diffuseColor * attenuation * spotAtten;\n\n#ifdef SPECULARTERM\n        // Specular\n        float NdotH = max(0.00000000001, dot(vNormal, H));\n\n        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\n        result.specular = specTerm * specularColor * attenuation * spotAtten;\n#endif\n\n        return result;\n    }\n\n    result.diffuse = vec3(0.);\n#ifdef SPECULARTERM\n    result.specular = vec3(0.);\n#endif\n\n    return result;\n}\n\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float roughness, float NdotV) {\n    lightingInfo result;\n\n    vec3 lightVectorW = normalize(lightData.xyz);\n\n    // Diffuse\n    float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;\n    result.diffuse = mix(groundColor, diffuseColor, ndl);\n\n#ifdef SPECULARTERM\n    // Specular\n    vec3 H = normalize(viewDirectionW + lightVectorW);\n    float NdotH = max(0.00000000001, dot(vNormal, H));\n    float NdotL = max(0.00000000001, ndl);\n    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));\n\n    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\n    result.specular = specTerm * specularColor;\n#endif\n\n    return result;\n}\n\nvoid main(void) {\n#include<clipPlaneFragment>\n\n    vec3 viewDirectionW = normalize(vEyePosition - vPositionW);\n\n    // Base color\n    vec4 baseColor = vec4(1., 1., 1., 1.);\n    vec3 diffuseColor = vAlbedoColor.rgb;\n    \n    // Alpha\n    float alpha = vAlbedoColor.a;\n\n#ifdef ALBEDO\n    baseColor = texture2D(diffuseSampler, vAlbedoUV);\n    baseColor = vec4(toLinearSpace(baseColor.rgb), baseColor.a);\n\n#ifdef ALPHATEST\n    if (baseColor.a < 0.4)\n        discard;\n#endif\n\n#ifdef ALPHAFROMALBEDO\n    alpha *= baseColor.a;\n#endif\n\n    baseColor.rgb *= vAlbedoInfos.y;\n#endif\n\n#ifdef VERTEXCOLOR\n    baseColor.rgb *= vColor.rgb;\n#endif\n\n#ifdef OVERLOADEDVALUES\n    baseColor.rgb = mix(baseColor.rgb, vOverloadedAlbedo, vOverloadedIntensity.y);\n    albedoColor.rgb = mix(albedoColor.rgb, vOverloadedAlbedo, vOverloadedIntensity.y);\n#endif\n\n    // Bump\n#ifdef NORMAL\n    vec3 normalW = normalize(vNormalW);\n#else\n    vec3 normalW = vec3(1.0, 1.0, 1.0);\n#endif\n\n    // Ambient color\n    vec3 baseAmbientColor = vec3(1., 1., 1.);\n\n#ifdef AMBIENT\n    baseAmbientColor = texture2D(ambientSampler, vAmbientUV).rgb * vAmbientInfos.y;\n    #ifdef OVERLOADEDVALUES\n        baseAmbientColor.rgb = mix(baseAmbientColor.rgb, vOverloadedAmbient, vOverloadedIntensity.x);\n    #endif\n#endif\n\n    // Reflectivity map\n    float microSurface = vReflectivityColor.a;\n    vec3 reflectivityColor = vReflectivityColor.rgb;\n\n    #ifdef OVERLOADEDVALUES\n        reflectivityColor.rgb = mix(reflectivityColor.rgb, vOverloadedReflectivity, vOverloadedIntensity.z);\n    #endif\n\n    #ifdef REFLECTIVITY\n            vec4 reflectivityMapColor = texture2D(reflectivitySampler, vReflectivityUV);\n            reflectivityColor = toLinearSpace(reflectivityMapColor.rgb);\n\n        #ifdef OVERLOADEDVALUES\n                reflectivityColor.rgb = mix(reflectivityColor.rgb, vOverloadedReflectivity, vOverloadedIntensity.z);\n        #endif\n\n        #ifdef MICROSURFACEFROMREFLECTIVITYMAP\n            microSurface = reflectivityMapColor.a;\n        #else\n            microSurface = computeDefaultMicroSurface(microSurface, reflectivityColor);\n        #endif\n    #endif\n\n    #ifdef OVERLOADEDVALUES\n        microSurface = mix(microSurface, vOverloadedMicroSurface.x, vOverloadedMicroSurface.y);\n    #endif\n\n    // Apply Energy Conservation taking in account the environment level only if the environment is present.\n    float reflectance = max(max(reflectivityColor.r, reflectivityColor.g), reflectivityColor.b);\n    baseColor.rgb = (1. - reflectance) * baseColor.rgb;\n\n    // Compute Specular Fresnel + Reflectance.\n    float NdotV = max(0.00000000001, dot(normalW, viewDirectionW));\n\n    // Adapt microSurface.\n    microSurface = clamp(microSurface, 0., 1.) * 0.98;\n\n    // Call rough to not conflict with previous one.\n    float rough = clamp(1. - microSurface, 0.000001, 1.0);\n\n    // Lighting\n    vec3 diffuseBase = vec3(0., 0., 0.);\n\n#ifdef OVERLOADEDSHADOWVALUES\n    vec3 shadowedOnlyDiffuseBase = vec3(1., 1., 1.);\n#endif\n\n#ifdef SPECULARTERM\n    vec3 specularBase = vec3(0., 0., 0.);\n#endif\n    float shadow = 1.;\n\n#ifdef LIGHT0\n#ifndef SPECULARTERM\n    vec3 vLightSpecular0 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT0\n    lightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, rough, NdotV);\n#endif\n#ifdef HEMILIGHT0\n    lightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightGround0, rough, NdotV);\n#endif\n#if defined(POINTLIGHT0) || defined(DIRLIGHT0)\n    lightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, rough, NdotV);\n#endif\n\n    shadow = 1.;\n    diffuseBase += info.diffuse * shadow;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyDiffuseBase *= shadow;\n#endif\n\n#ifdef SPECULARTERM\n    specularBase += info.specular * shadow;\n#endif\n#endif\n\n#ifdef LIGHT1\n#ifndef SPECULARTERM\n    vec3 vLightSpecular1 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT1\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, rough, NdotV);\n#endif\n#ifdef HEMILIGHT1\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightGround1, rough, NdotV);\n#endif\n#if defined(POINTLIGHT1) || defined(DIRLIGHT1)\n    info = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, rough, NdotV);\n#endif\n\n    shadow = 1.;\n    diffuseBase += info.diffuse * shadow;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyDiffuseBase *= shadow;\n#endif\n\n#ifdef SPECULARTERM\n    specularBase += info.specular * shadow;\n#endif\n#endif\n\n#ifdef LIGHT2\n#ifndef SPECULARTERM\n    vec3 vLightSpecular2 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT2\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, rough, NdotV);\n#endif\n#ifdef HEMILIGHT2\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightGround2, rough, NdotV);\n#endif\n#if defined(POINTLIGHT2) || defined(DIRLIGHT2)\n    info = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, rough, NdotV);\n#endif\n\n    shadow = 1.;\n    diffuseBase += info.diffuse * shadow;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyDiffuseBase *= shadow;\n#endif\n\n#ifdef SPECULARTERM\n    specularBase += info.specular * shadow;\n#endif\n#endif\n\n#ifdef LIGHT3\n#ifndef SPECULARTERM\n    vec3 vLightSpecular3 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT3\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, rough, NdotV);\n#endif\n#ifdef HEMILIGHT3\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightGround3, rough, NdotV);\n#endif\n#if defined(POINTLIGHT3) || defined(DIRLIGHT3)\n    info = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, rough, NdotV);\n#endif\n\n    shadow = 1.;\n    diffuseBase += info.diffuse * shadow;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyDiffuseBase *= shadow;\n#endif\n\n#ifdef SPECULARTERM\n    specularBase += info.specular * shadow;\n#endif\n#endif\n\n// Reflection\nvec3 reflectionColor = vReflectionColor.rgb;\nvec3 ambientReflectionColor = vReflectionColor.rgb;\n\nreflectionColor *= vLightingIntensity.z;\nambientReflectionColor *= vLightingIntensity.z;\n\n// Compute reflection reflectivity fresnel\nvec3 reflectivityEnvironmentR0 = reflectivityColor.rgb;\nvec3 reflectivityEnvironmentR90 = vec3(1.0, 1.0, 1.0);\nvec3 reflectivityEnvironmentReflectanceViewer = FresnelSchlickEnvironmentGGX(clamp(NdotV, 0., 1.), reflectivityEnvironmentR0, reflectivityEnvironmentR90, sqrt(microSurface));\nreflectionColor *= reflectivityEnvironmentReflectanceViewer;\n\n#ifdef OVERLOADEDVALUES\n    ambientReflectionColor = mix(ambientReflectionColor, vOverloadedReflection, vOverloadedMicroSurface.z);\n    reflectionColor = mix(reflectionColor, vOverloadedReflection, vOverloadedMicroSurface.z);\n#endif\n\n#ifdef OPACITY\n    vec4 opacityMap = texture2D(opacitySampler, vOpacityUV);\n\n#ifdef OPACITYRGB\n    opacityMap.rgb = opacityMap.rgb * vec3(0.3, 0.59, 0.11);\n    alpha *= (opacityMap.x + opacityMap.y + opacityMap.z)* vOpacityInfos.y;\n#else\n    alpha *= opacityMap.a * vOpacityInfos.y;\n#endif\n\n#endif\n\n#ifdef VERTEXALPHA\n    alpha *= vColor.a;\n#endif\n\n    // Emissive\n    vec3 emissiveColor = vEmissiveColor;\n#ifdef EMISSIVE\n    vec3 emissiveColorTex = texture2D(emissiveSampler, vEmissiveUV).rgb;\n    emissiveColor = toLinearSpace(emissiveColorTex.rgb) * emissiveColor * vEmissiveInfos.y;\n#endif\n\n#ifdef OVERLOADEDVALUES\n    emissiveColor = mix(emissiveColor, vOverloadedEmissive, vOverloadedIntensity.w);\n#endif\n\n    // Composition\n#ifdef EMISSIVEASILLUMINATION\n    vec3 finalDiffuse = max(diffuseBase * albedoColor + vAmbientColor, 0.0) * baseColor.rgb;\n\n    #ifdef OVERLOADEDSHADOWVALUES\n        shadowedOnlyDiffuseBase = max(shadowedOnlyDiffuseBase * albedoColor + vAmbientColor, 0.0) * baseColor.rgb;\n    #endif\n#else\n    #ifdef LINKEMISSIVEWITHALBEDO\n        vec3 finalDiffuse = max((diffuseBase + emissiveColor) * albedoColor + vAmbientColor, 0.0) * baseColor.rgb;\n        #ifdef OVERLOADEDSHADOWVALUES\n                shadowedOnlyDiffuseBase = max((shadowedOnlyDiffuseBase + emissiveColor) * albedoColor + vAmbientColor, 0.0) * baseColor.rgb;\n        #endif\n    #else\n        vec3 finalDiffuse = max(diffuseBase * albedoColor + emissiveColor + vAmbientColor, 0.0) * baseColor.rgb;\n        #ifdef OVERLOADEDSHADOWVALUES\n            shadowedOnlyDiffuseBase = max(shadowedOnlyDiffuseBase * albedoColor + emissiveColor + vAmbientColor, 0.0) * baseColor.rgb;\n        #endif\n    #endif\n#endif\n\n#ifdef OVERLOADEDSHADOWVALUES\n      finalDiffuse = mix(finalDiffuse, shadowedOnlyDiffuseBase, (1.0 - vOverloadedShadowIntensity.y));\n#endif\n\n// diffuse lighting from environment 0.2 replaces Harmonic...\n// Ambient Reflection already includes the environment intensity.\nfinalDiffuse += baseColor.rgb * ambientReflectionColor * 0.2;\n\n#ifdef SPECULARTERM\n    vec3 finalSpecular = specularBase * reflectivityColor * vLightingIntensity.w;\n#else\n    vec3 finalSpecular = vec3(0.0);\n#endif\n\n#ifdef SPECULAROVERALPHA\n    alpha = clamp(alpha + dot(finalSpecular, vec3(0.3, 0.59, 0.11)), 0., 1.);\n#endif\n\n// Composition\n// Reflection already includes the environment intensity.\n#ifdef EMISSIVEASILLUMINATION\n    vec4 color = vec4(finalDiffuse * baseAmbientColor * vLightingIntensity.x + finalSpecular * vLightingIntensity.x + reflectionColor + emissiveColor * vLightingIntensity.y, alpha);\n#else\n    vec4 color = vec4(finalDiffuse * baseAmbientColor * vLightingIntensity.x + finalSpecular * vLightingIntensity.x + reflectionColor, alpha);\n#endif\n\n    color = max(color, 0.0);\n\n#ifdef CAMERATONEMAP\n    color.rgb = toneMaps(color.rgb);\n#endif\n\n    color.rgb = toGammaSpace(color.rgb);\n\n#ifdef CAMERACONTRAST\n    color = contrasts(color);\n#endif\n\n    gl_FragColor = color;\n}";
