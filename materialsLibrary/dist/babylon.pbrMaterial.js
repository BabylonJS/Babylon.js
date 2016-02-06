/// <reference path="../../../dist/preview release/babylon.d.ts"/>

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
            this.microSurface = 0.5;
            this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            this.useAlphaFromAlbedoTexture = false;
            this.useEmissiveAsIllumination = false;
            this.linkEmissiveWithAlbedo = false;
            this.useSpecularOverAlpha = true;
            this.disableLighting = false;
            this.useLightmapAsShadowmap = false;
            this.useMicroSurfaceFromReflectivityMapAlpha = false;
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
            return (this.alpha < 1.0) || (this.opacityTexture != null) || this._shouldUseAlphaFromAlbedoTexture() || this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled;
        };
        PBRMaterial.prototype.needAlphaTesting = function () {
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
        PBRMaterial.PrepareDefinesForLights = function (scene, mesh, defines) {
            var lightIndex = 0;
            var needNormals = false;
            for (var index = 0; index < scene.lights.length; index++) {
                var light = scene.lights[index];
                if (!light.isEnabled()) {
                    continue;
                }
                // Excluded check
                if (light._excludedMeshesIds.length > 0) {
                    for (var excludedIndex = 0; excludedIndex < light._excludedMeshesIds.length; excludedIndex++) {
                        var excludedMesh = scene.getMeshByID(light._excludedMeshesIds[excludedIndex]);
                        if (excludedMesh) {
                            light.excludedMeshes.push(excludedMesh);
                        }
                    }
                    light._excludedMeshesIds = [];
                }
                // Included check
                if (light._includedOnlyMeshesIds.length > 0) {
                    for (var includedOnlyIndex = 0; includedOnlyIndex < light._includedOnlyMeshesIds.length; includedOnlyIndex++) {
                        var includedOnlyMesh = scene.getMeshByID(light._includedOnlyMeshesIds[includedOnlyIndex]);
                        if (includedOnlyMesh) {
                            light.includedOnlyMeshes.push(includedOnlyMesh);
                        }
                    }
                    light._includedOnlyMeshesIds = [];
                }
                if (!light.canAffectMesh(mesh)) {
                    continue;
                }
                needNormals = true;
                defines["LIGHT" + lightIndex] = true;
                var type;
                if (light instanceof BABYLON.SpotLight) {
                    type = "SPOTLIGHT" + lightIndex;
                }
                else if (light instanceof BABYLON.HemisphericLight) {
                    type = "HEMILIGHT" + lightIndex;
                }
                else if (light instanceof BABYLON.PointLight) {
                    type = "POINTLIGHT" + lightIndex;
                }
                else {
                    type = "DIRLIGHT" + lightIndex;
                }
                defines[type] = true;
                // Specular
                if (!light.specular.equalsFloats(0, 0, 0)) {
                    defines["SPECULARTERM"] = true;
                }
                // Shadows
                if (scene.shadowsEnabled) {
                    var shadowGenerator = light.getShadowGenerator();
                    if (mesh && mesh.receiveShadows && shadowGenerator) {
                        defines["SHADOW" + lightIndex] = true;
                        defines["SHADOWS"] = true;
                        if (shadowGenerator.useVarianceShadowMap || shadowGenerator.useBlurVarianceShadowMap) {
                            defines["SHADOWVSM" + lightIndex] = true;
                        }
                        if (shadowGenerator.usePoissonSampling) {
                            defines["SHADOWPCF" + lightIndex] = true;
                        }
                    }
                }
                lightIndex++;
                if (lightIndex === maxSimultaneousLights)
                    break;
            }
            return needNormals;
        };
        PBRMaterial.BindLights = function (scene, mesh, effect, defines) {
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
                if (light instanceof BABYLON.PointLight) {
                    // Point Light
                    light.transferToEffect(effect, "vLightData" + lightIndex);
                }
                else if (light instanceof BABYLON.DirectionalLight) {
                    // Directional Light
                    light.transferToEffect(effect, "vLightData" + lightIndex);
                }
                else if (light instanceof BABYLON.SpotLight) {
                    // Spot Light
                    light.transferToEffect(effect, "vLightData" + lightIndex, "vLightDirection" + lightIndex);
                }
                else if (light instanceof BABYLON.HemisphericLight) {
                    // Hemispheric Light
                    light.transferToEffect(effect, "vLightData" + lightIndex, "vLightGround" + lightIndex);
                }
                // GAMMA CORRECTION.
                light.diffuse.toLinearSpaceToRef(PBRMaterial._scaledAlbedo);
                PBRMaterial._scaledAlbedo.scaleToRef(light.intensity, PBRMaterial._scaledAlbedo);
                light.diffuse.scaleToRef(light.intensity, PBRMaterial._scaledAlbedo);
                effect.setColor4("vLightDiffuse" + lightIndex, PBRMaterial._scaledAlbedo, light.range);
                if (defines["SPECULARTERM"]) {
                    light.specular.toLinearSpaceToRef(PBRMaterial._scaledReflectivity);
                    PBRMaterial._scaledReflectivity.scaleToRef(light.intensity, PBRMaterial._scaledReflectivity);
                    effect.setColor3("vLightSpecular" + lightIndex, PBRMaterial._scaledReflectivity);
                }
                // Shadows
                if (scene.shadowsEnabled) {
                    var shadowGenerator = light.getShadowGenerator();
                    if (mesh.receiveShadows && shadowGenerator) {
                        if (!light.needCube()) {
                            effect.setMatrix("lightMatrix" + lightIndex, shadowGenerator.getTransformMatrix());
                        }
                        else {
                            if (!depthValuesAlreadySet) {
                                depthValuesAlreadySet = true;
                                effect.setFloat2("depthValues", scene.activeCamera.minZ, scene.activeCamera.maxZ);
                            }
                        }
                        effect.setTexture("shadowSampler" + lightIndex, shadowGenerator.getShadowMapForRendering());
                        effect.setFloat3("shadowsInfo" + lightIndex, shadowGenerator.getDarkness(), shadowGenerator.getShadowMap().getSize().width, shadowGenerator.bias);
                    }
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
            // Textures
            if (scene.texturesEnabled) {
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
                    }
                }
                if (this.lightmapTexture && BABYLON.StandardMaterial.LightmapEnabled) {
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
                needNormals = PBRMaterial.PrepareDefinesForLights(scene, mesh, this._defines);
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
                for (var lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
                    if (!this._defines["LIGHT" + lightIndex]) {
                        continue;
                    }
                    if (lightIndex > 0) {
                        fallbacks.addFallback(lightIndex, "LIGHT" + lightIndex);
                    }
                    if (this._defines["SHADOW" + lightIndex]) {
                        fallbacks.addFallback(0, "SHADOW" + lightIndex);
                    }
                    if (this._defines["SHADOWPCF" + lightIndex]) {
                        fallbacks.addFallback(0, "SHADOWPCF" + lightIndex);
                    }
                    if (this._defines["SHADOWVSM" + lightIndex]) {
                        fallbacks.addFallback(0, "SHADOWVSM" + lightIndex);
                    }
                }
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
                if (this._defines.NUM_BONE_INFLUENCERS > 0) {
                    attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                    attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                    if (this._defines.NUM_BONE_INFLUENCERS > 4) {
                        attribs.push(BABYLON.VertexBuffer.MatricesIndicesExtraKind);
                        attribs.push(BABYLON.VertexBuffer.MatricesWeightsExtraKind);
                    }
                }
                if (this._defines.INSTANCES) {
                    attribs.push("world0");
                    attribs.push("world1");
                    attribs.push("world2");
                    attribs.push("world3");
                }
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
                    "vAlbedoInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vReflectivityInfos", "vBumpInfos", "vLightmapInfos",
                    "mBones",
                    "vClipPlane", "albedoMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "reflectivityMatrix", "bumpMatrix", "lightmapMatrix",
                    "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3", "depthValues",
                    "opacityParts", "emissiveLeftColor", "emissiveRightColor",
                    "vLightingIntensity", "vOverloadedShadowIntensity", "vOverloadedIntensity", "vCameraInfos", "vOverloadedAlbedo", "vOverloadedReflection", "vOverloadedReflectivity", "vOverloadedEmissive", "vOverloadedMicroSurface",
                    "logarithmicDepthConstant"
                ], ["albedoSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "reflectivitySampler", "bumpSampler", "lightmapSampler",
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
            _super.prototype.unbind.call(this);
        };
        PBRMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        PBRMaterial.prototype.bind = function (world, mesh) {
            this._myScene = this.getScene();
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", this._myScene.getTransformMatrix());
            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
            }
            if (this._myScene.getCachedMaterial() !== this) {
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
                    if (this.reflectionTexture.isCube) {
                        this._effect.setTexture("reflectionCubeSampler", this.reflectionTexture);
                    }
                    else {
                        this._effect.setTexture("reflection2DSampler", this.reflectionTexture);
                    }
                    this._effect.setMatrix("reflectionMatrix", this.reflectionTexture.getReflectionTextureMatrix());
                    this._effect.setFloat2("vReflectionInfos", this.reflectionTexture.level, 0);
                }
                if (this.emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                    this._effect.setTexture("emissiveSampler", this.emissiveTexture);
                    this._effect.setFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
                    this._effect.setMatrix("emissiveMatrix", this.emissiveTexture.getTextureMatrix());
                }
                if (this.lightmapTexture && BABYLON.StandardMaterial.LightmapEnabled) {
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
                // Clip plane
                if (this._myScene.clipPlane) {
                    this._effect.setFloat4("vClipPlane", this._myScene.clipPlane.normal.x, this._myScene.clipPlane.normal.y, this._myScene.clipPlane.normal.z, this._myScene.clipPlane.d);
                }
                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }
                // Colors
                this._myScene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);
                // GAMMA CORRECTION.
                this.reflectivityColor.toLinearSpaceToRef(PBRMaterial._scaledReflectivity);
                this._effect.setVector3("vEyePosition", this._myScene._mirroredCameraPosition ? this._myScene._mirroredCameraPosition : this._myScene.activeCamera.position);
                this._effect.setColor3("vAmbientColor", this._globalAmbientColor);
                this._effect.setColor4("vReflectivityColor", PBRMaterial._scaledReflectivity, this.microSurface);
                // GAMMA CORRECTION.
                this.emissiveColor.toLinearSpaceToRef(PBRMaterial._scaledEmissive);
                this._effect.setColor3("vEmissiveColor", PBRMaterial._scaledEmissive);
                // GAMMA CORRECTION.
                this.reflectionColor.toLinearSpaceToRef(PBRMaterial._scaledReflection);
                this._effect.setColor3("vReflectionColor", PBRMaterial._scaledReflection);
            }
            // GAMMA CORRECTION.
            this.albedoColor.toLinearSpaceToRef(PBRMaterial._scaledAlbedo);
            this._effect.setColor4("vAlbedoColor", PBRMaterial._scaledAlbedo, this.alpha * mesh.visibility);
            // Lights
            if (this._myScene.lightsEnabled && !this.disableLighting) {
                PBRMaterial.BindLights(this._myScene, mesh, this._effect, this._defines);
            }
            // View
            if (this._myScene.fogEnabled && mesh.applyFog && this._myScene.fogMode !== BABYLON.Scene.FOGMODE_NONE || this.reflectionTexture) {
                this._effect.setMatrix("view", this._myScene.getViewMatrix());
            }
            // Fog
            if (this._myScene.fogEnabled && mesh.applyFog && this._myScene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._effect.setFloat4("vFogInfos", this._myScene.fogMode, this._myScene.fogStart, this._myScene.fogEnd, this._myScene.fogDensity);
                this._effect.setColor3("vFogColor", this._myScene.fogColor);
            }
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
            this.overloadedAmbient.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedAmbient", this._tempColor);
            this.overloadedAlbedo.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedAlbedo", this._tempColor);
            this.overloadedReflectivity.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedReflectivity", this._tempColor);
            this.overloadedEmissive.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedEmissive", this._tempColor);
            this.overloadedReflection.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedReflection", this._tempColor);
            this._overloadedMicroSurface.x = this.overloadedMicroSurface;
            this._overloadedMicroSurface.y = this.overloadedMicroSurfaceIntensity;
            this._overloadedMicroSurface.z = this.overloadedReflectionIntensity;
            this._effect.setVector3("vOverloadedMicroSurface", this._overloadedMicroSurface);
            // Log. depth
            if (this._defines.LOGARITHMICDEPTH) {
                this._effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(this._myScene.activeCamera.maxZ + 1.0) / Math.LN2));
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
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        PBRMaterial.prototype.clone = function (name) {
            var newPBRMaterial = new PBRMaterial(name, this.getScene());
            // Base material
            this.copyTo(newPBRMaterial);
            newPBRMaterial.directIntensity = this.directIntensity;
            newPBRMaterial.emissiveIntensity = this.emissiveIntensity;
            newPBRMaterial.environmentIntensity = this.environmentIntensity;
            newPBRMaterial.specularIntensity = this.specularIntensity;
            newPBRMaterial.cameraExposure = this.cameraExposure;
            newPBRMaterial.cameraContrast = this.cameraContrast;
            newPBRMaterial.overloadedShadowIntensity = this.overloadedShadowIntensity;
            newPBRMaterial.overloadedShadeIntensity = this.overloadedShadeIntensity;
            newPBRMaterial.overloadedAmbientIntensity = this.overloadedAmbientIntensity;
            newPBRMaterial.overloadedAlbedoIntensity = this.overloadedAlbedoIntensity;
            newPBRMaterial.overloadedReflectivityIntensity = this.overloadedReflectivityIntensity;
            newPBRMaterial.overloadedEmissiveIntensity = this.overloadedEmissiveIntensity;
            newPBRMaterial.overloadedAmbient = this.overloadedAmbient;
            newPBRMaterial.overloadedAlbedo = this.overloadedAlbedo;
            newPBRMaterial.overloadedReflectivity = this.overloadedReflectivity;
            newPBRMaterial.overloadedEmissive = this.overloadedEmissive;
            newPBRMaterial.overloadedReflection = this.overloadedReflection;
            newPBRMaterial.overloadedMicroSurface = this.overloadedMicroSurface;
            newPBRMaterial.overloadedMicroSurfaceIntensity = this.overloadedMicroSurfaceIntensity;
            newPBRMaterial.overloadedReflectionIntensity = this.overloadedReflectionIntensity;
            newPBRMaterial.disableBumpMap = this.disableBumpMap;
            // Standard material
            if (this.albedoTexture && this.albedoTexture.clone) {
                newPBRMaterial.albedoTexture = this.albedoTexture.clone();
            }
            if (this.ambientTexture && this.ambientTexture.clone) {
                newPBRMaterial.ambientTexture = this.ambientTexture.clone();
            }
            if (this.opacityTexture && this.opacityTexture.clone) {
                newPBRMaterial.opacityTexture = this.opacityTexture.clone();
            }
            if (this.reflectionTexture && this.reflectionTexture.clone) {
                newPBRMaterial.reflectionTexture = this.reflectionTexture.clone();
            }
            if (this.emissiveTexture && this.emissiveTexture.clone) {
                newPBRMaterial.emissiveTexture = this.emissiveTexture.clone();
            }
            if (this.reflectivityTexture && this.reflectivityTexture.clone) {
                newPBRMaterial.reflectivityTexture = this.reflectivityTexture.clone();
            }
            if (this.bumpTexture && this.bumpTexture.clone) {
                newPBRMaterial.bumpTexture = this.bumpTexture.clone();
            }
            if (this.lightmapTexture && this.lightmapTexture.clone) {
                newPBRMaterial.lightmapTexture = this.lightmapTexture.clone();
                newPBRMaterial.useLightmapAsShadowmap = this.useLightmapAsShadowmap;
            }
            newPBRMaterial.ambientColor = this.ambientColor.clone();
            newPBRMaterial.albedoColor = this.albedoColor.clone();
            newPBRMaterial.reflectivityColor = this.reflectivityColor.clone();
            newPBRMaterial.reflectionColor = this.reflectionColor.clone();
            newPBRMaterial.microSurface = this.microSurface;
            newPBRMaterial.emissiveColor = this.emissiveColor.clone();
            newPBRMaterial.useAlphaFromAlbedoTexture = this.useAlphaFromAlbedoTexture;
            newPBRMaterial.useEmissiveAsIllumination = this.useEmissiveAsIllumination;
            newPBRMaterial.useMicroSurfaceFromReflectivityMapAlpha = this.useMicroSurfaceFromReflectivityMapAlpha;
            newPBRMaterial.useSpecularOverAlpha = this.useSpecularOverAlpha;
            newPBRMaterial.emissiveFresnelParameters = this.emissiveFresnelParameters.clone();
            newPBRMaterial.opacityFresnelParameters = this.opacityFresnelParameters.clone();
            return newPBRMaterial;
        };
        PBRMaterial.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.customType = "BABYLON.PBRMaterial";
            serializationObject.directIntensity = this.directIntensity;
            serializationObject.emissiveIntensity = this.emissiveIntensity;
            serializationObject.environmentIntensity = this.environmentIntensity;
            serializationObject.specularIntensity = this.specularIntensity;
            serializationObject.cameraExposure = this.cameraExposure;
            serializationObject.cameraContrast = this.cameraContrast;
            serializationObject.overloadedShadowIntensity = this.overloadedShadowIntensity;
            serializationObject.overloadedShadeIntensity = this.overloadedShadeIntensity;
            serializationObject.overloadedAmbientIntensity = this.overloadedAmbientIntensity;
            serializationObject.overloadedAlbedoIntensity = this.overloadedAlbedoIntensity;
            serializationObject.overloadedReflectivityIntensity = this.overloadedReflectivityIntensity;
            serializationObject.overloadedEmissiveIntensity = this.overloadedEmissiveIntensity;
            serializationObject.overloadedAmbient = this.overloadedAmbient.asArray();
            serializationObject.overloadedAlbedo = this.overloadedAlbedo.asArray();
            serializationObject.overloadedReflectivity = this.overloadedReflectivity.asArray();
            serializationObject.overloadedEmissive = this.overloadedEmissive.asArray();
            serializationObject.overloadedReflection = this.overloadedReflection.asArray();
            serializationObject.overloadedMicroSurface = this.overloadedMicroSurface;
            serializationObject.overloadedMicroSurfaceIntensity = this.overloadedMicroSurfaceIntensity;
            serializationObject.overloadedReflectionIntensity = this.overloadedReflectionIntensity;
            serializationObject.disableBumpMap = this.disableBumpMap;
            // Standard material
            if (this.albedoTexture) {
                serializationObject.albedoTexture = this.albedoTexture.serialize();
            }
            if (this.ambientTexture) {
                serializationObject.ambientTexture = this.ambientTexture.serialize();
            }
            if (this.opacityTexture) {
                serializationObject.opacityTexture = this.opacityTexture.serialize();
            }
            if (this.reflectionTexture) {
                serializationObject.reflectionTexture = this.reflectionTexture.serialize();
            }
            if (this.emissiveTexture) {
                serializationObject.emissiveTexture = this.emissiveTexture.serialize();
            }
            if (this.reflectivityTexture) {
                serializationObject.reflectivityTexture = this.reflectivityTexture.serialize();
            }
            if (this.bumpTexture) {
                serializationObject.bumpTexture = this.bumpTexture.serialize();
            }
            if (this.lightmapTexture) {
                serializationObject.lightmapTexture = this.lightmapTexture.serialize();
                serializationObject.useLightmapAsShadowmap = this.useLightmapAsShadowmap;
            }
            serializationObject.ambientColor = this.ambientColor.asArray();
            serializationObject.albedoColor = this.albedoColor.asArray();
            serializationObject.reflectivityColor = this.reflectivityColor.asArray();
            serializationObject.reflectionColor = this.reflectionColor.asArray();
            serializationObject.microSurface = this.microSurface;
            serializationObject.emissiveColor = this.emissiveColor.asArray();
            serializationObject.useAlphaFromAlbedoTexture = this.useAlphaFromAlbedoTexture;
            serializationObject.useEmissiveAsIllumination = this.useEmissiveAsIllumination;
            serializationObject.useMicroSurfaceFromReflectivityMapAlpha = this.useMicroSurfaceFromReflectivityMapAlpha;
            serializationObject.useSpecularOverAlpha = this.useSpecularOverAlpha;
            serializationObject.emissiveFresnelParameters = this.emissiveFresnelParameters.serialize();
            serializationObject.opacityFresnelParameters = this.opacityFresnelParameters.serialize();
            return serializationObject;
        };
        PBRMaterial.Parse = function (source, scene, rootUrl) {
            var material = new PBRMaterial(source.name, scene);
            material.alpha = source.alpha;
            material.id = source.id;
            if (source.disableDepthWrite) {
                material.disableDepthWrite = source.disableDepthWrite;
            }
            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }
            BABYLON.Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;
            material.directIntensity = source.directIntensity;
            material.emissiveIntensity = source.emissiveIntensity;
            material.environmentIntensity = source.environmentIntensity;
            material.specularIntensity = source.specularIntensity;
            material.cameraExposure = source.cameraExposure;
            material.cameraContrast = source.cameraContrast;
            material.overloadedShadowIntensity = source.overloadedShadowIntensity;
            material.overloadedShadeIntensity = source.overloadedShadeIntensity;
            material.overloadedAmbientIntensity = source.overloadedAmbientIntensity;
            material.overloadedAlbedoIntensity = source.overloadedAlbedoIntensity;
            material.overloadedReflectivityIntensity = source.overloadedReflectivityIntensity;
            material.overloadedEmissiveIntensity = source.overloadedEmissiveIntensity;
            material.overloadedAmbient = BABYLON.Color3.FromArray(source.overloadedAmbient);
            material.overloadedAlbedo = BABYLON.Color3.FromArray(source.overloadedAlbedo);
            material.overloadedReflectivity = BABYLON.Color3.FromArray(source.overloadedReflectivity);
            material.overloadedEmissive = BABYLON.Color3.FromArray(source.overloadedEmissive);
            material.overloadedReflection = BABYLON.Color3.FromArray(source.overloadedReflection);
            material.overloadedMicroSurface = source.overloadedMicroSurface;
            material.overloadedMicroSurfaceIntensity = source.overloadedMicroSurfaceIntensity;
            material.overloadedReflectionIntensity = source.overloadedReflectionIntensity;
            material.disableBumpMap = source.disableBumpMap;
            // Standard material
            if (source.albedoTexture) {
                material.albedoTexture = BABYLON.Texture.Parse(source.albedoTexture, scene, rootUrl);
            }
            if (source.ambientTexture) {
                material.ambientTexture = BABYLON.Texture.Parse(source.ambientTexture, scene, rootUrl);
            }
            if (source.opacityTexture) {
                material.opacityTexture = BABYLON.Texture.Parse(source.opacityTexture, scene, rootUrl);
            }
            if (source.reflectionTexture) {
                material.reflectionTexture = BABYLON.Texture.Parse(source.reflectionTexture, scene, rootUrl);
            }
            if (source.emissiveTexture) {
                material.emissiveTexture = BABYLON.Texture.Parse(source.emissiveTexture, scene, rootUrl);
            }
            if (source.reflectivityTexture) {
                material.reflectivityTexture = BABYLON.Texture.Parse(source.reflectivityTexture, scene, rootUrl);
            }
            if (source.bumpTexture) {
                material.bumpTexture = BABYLON.Texture.Parse(source.bumpTexture, scene, rootUrl);
            }
            if (source.lightmapTexture) {
                material.lightmapTexture = BABYLON.Texture.Parse(source.lightmapTexture, scene, rootUrl);
                material.useLightmapAsShadowmap = source.useLightmapAsShadowmap;
            }
            material.ambientColor = BABYLON.Color3.FromArray(source.ambient);
            material.albedoColor = BABYLON.Color3.FromArray(source.albedo);
            material.reflectivityColor = BABYLON.Color3.FromArray(source.reflectivity);
            material.reflectionColor = BABYLON.Color3.FromArray(source.reflectionColor);
            material.microSurface = source.microSurface;
            material.emissiveColor = BABYLON.Color3.FromArray(source.emissive);
            material.useAlphaFromAlbedoTexture = source.useAlphaFromAlbedoTexture;
            material.useEmissiveAsIllumination = source.useEmissiveAsIllumination;
            material.useMicroSurfaceFromReflectivityMapAlpha = source.useMicroSurfaceFromReflectivityMapAlpha;
            material.useSpecularOverAlpha = source.useSpecularOverAlpha;
            material.emissiveFresnelParameters = BABYLON.FresnelParameters.Parse(source.emissiveFresnelParameters);
            material.opacityFresnelParameters = BABYLON.FresnelParameters.Parse(source.opacityFresnelParameters);
            return material;
        };
        PBRMaterial._scaledAlbedo = new BABYLON.Color3();
        PBRMaterial._scaledReflectivity = new BABYLON.Color3();
        PBRMaterial._scaledEmissive = new BABYLON.Color3();
        PBRMaterial._scaledReflection = new BABYLON.Color3();
        return PBRMaterial;
    })(BABYLON.Material);
    BABYLON.PBRMaterial = PBRMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['pbrVertexShader'] = "precision highp float;\n\n// Attributes\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#if NUM_BONE_INFLUENCERS > 0\nuniform mat4 mBones[BonesPerMesh];\n\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS > 4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif\n\n// Uniforms\n\n#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif\n\nuniform mat4 view;\nuniform mat4 viewProjection;\n\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform mat4 albedoMatrix;\nuniform vec2 vAlbedoInfos;\n#endif\n\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n\n#ifdef OPACITY\nvarying vec2 vOpacityUV;\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n\n#if defined(REFLECTIVITY)\nvarying vec2 vReflectivityUV;\nuniform vec2 vReflectivityInfos;\nuniform mat4 reflectivityMatrix;\n#endif\n\n#ifdef BUMP\nvarying vec2 vBumpUV;\nuniform vec2 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\n// Output\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif\n\n#ifdef FOG\nvarying float fFogDistance;\n#endif\n\n#ifdef SHADOWS\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\nuniform mat4 lightMatrix0;\nvarying vec4 vPositionFromLight0;\n#endif\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\nuniform mat4 lightMatrix1;\nvarying vec4 vPositionFromLight1;\n#endif\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\nuniform mat4 lightMatrix2;\nvarying vec4 vPositionFromLight2;\n#endif\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\nuniform mat4 lightMatrix3;\nvarying vec4 vPositionFromLight3;\n#endif\n#endif\n\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvarying vec3 vDirectionW;\n#endif\n\n#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif\n\nvoid main(void) {\n\n#ifdef REFLECTIONMAP_SKYBOX\n    vPositionUVW = position;\n#endif \n\n#ifdef INSTANCES\n    mat4 finalWorld = mat4(world0, world1, world2, world3);\n#else\n    mat4 finalWorld = world;\n#endif\n\n#if NUM_BONE_INFLUENCERS > 0\n    mat4 influence;\n    influence = mBones[int(matricesIndices[0])] * matricesWeights[0];\n\n#if NUM_BONE_INFLUENCERS > 1\n    influence += mBones[int(matricesIndices[1])] * matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS > 2\n    influence += mBones[int(matricesIndices[2])] * matricesWeights[2];\n#endif\t\n#if NUM_BONE_INFLUENCERS > 3\n    influence += mBones[int(matricesIndices[3])] * matricesWeights[3];\n#endif\t\n\n#if NUM_BONE_INFLUENCERS > 4\n    influence += mBones[int(matricesIndicesExtra[0])] * matricesWeightsExtra[0];\n#endif\n#if NUM_BONE_INFLUENCERS > 5\n    influence += mBones[int(matricesIndicesExtra[1])] * matricesWeightsExtra[1];\n#endif\t\n#if NUM_BONE_INFLUENCERS > 6\n    influence += mBones[int(matricesIndicesExtra[2])] * matricesWeightsExtra[2];\n#endif\t\n#if NUM_BONE_INFLUENCERS > 7\n    influence += mBones[int(matricesIndicesExtra[3])] * matricesWeightsExtra[3];\n#endif\t\n\n    finalWorld = finalWorld * influence;\n#endif\n\n    gl_Position = viewProjection * finalWorld * vec4(position, 1.0);\n\n    vec4 worldPos = finalWorld * vec4(position, 1.0);\n    vPositionW = vec3(worldPos);\n\n#ifdef NORMAL\n    vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));\n#endif\n\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\n    vDirectionW = normalize(vec3(finalWorld * vec4(position, 0.0)));\n#endif\n\n    // Texture coordinates\n#ifndef UV1\n    vec2 uv = vec2(0., 0.);\n#endif\n#ifndef UV2\n    vec2 uv2 = vec2(0., 0.);\n#endif\n\n#ifdef ALBEDO\n    if (vAlbedoInfos.x == 0.)\n    {\n        vAlbedoUV = vec2(albedoMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vAlbedoUV = vec2(albedoMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n#ifdef AMBIENT\n    if (vAmbientInfos.x == 0.)\n    {\n        vAmbientUV = vec2(ambientMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vAmbientUV = vec2(ambientMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n#ifdef OPACITY\n    if (vOpacityInfos.x == 0.)\n    {\n        vOpacityUV = vec2(opacityMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n#ifdef EMISSIVE\n    if (vEmissiveInfos.x == 0.)\n    {\n        vEmissiveUV = vec2(emissiveMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vEmissiveUV = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n#ifdef LIGHTMAP\n    if (vLightmapInfos.x == 0.)\n    {\n        vLightmapUV = vec2(lightmapMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vLightmapUV = vec2(lightmapMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n#if defined(REFLECTIVITY)\n    if (vReflectivityInfos.x == 0.)\n    {\n        vReflectivityUV = vec2(reflectivityMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vReflectivityUV = vec2(reflectivityMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n#ifdef BUMP\n    if (vBumpInfos.x == 0.)\n    {\n        vBumpUV = vec2(bumpMatrix * vec4(uv, 1.0, 0.0));\n    }\n    else\n    {\n        vBumpUV = vec2(bumpMatrix * vec4(uv2, 1.0, 0.0));\n    }\n#endif\n\n    // Clip plane\n#ifdef CLIPPLANE\n    fClipDistance = dot(worldPos, vClipPlane);\n#endif\n\n    // Fog\n#ifdef FOG\n    fFogDistance = (view * worldPos).z;\n#endif\n\n    // Shadows\n#ifdef SHADOWS\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\n    vPositionFromLight0 = lightMatrix0 * worldPos;\n#endif\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\n    vPositionFromLight1 = lightMatrix1 * worldPos;\n#endif\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\n    vPositionFromLight2 = lightMatrix2 * worldPos;\n#endif\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\n    vPositionFromLight3 = lightMatrix3 * worldPos;\n#endif\n#endif\n\n    // Vertex color\n#ifdef VERTEXCOLOR\n    vColor = color;\n#endif\n\n    // Point size\n#ifdef POINTSIZE\n    gl_PointSize = pointSize;\n#endif\n\n    // Log. depth\n#ifdef LOGARITHMICDEPTH\n    vFragmentDepth = 1.0 + gl_Position.w;\n    gl_Position.z = log2(max(0.000001, vFragmentDepth)) * logarithmicDepthConstant;\n#endif\n}";
BABYLON.Effect.ShadersStore['pbrPixelShader'] = "#ifdef BUMP\n#extension GL_OES_standard_derivatives : enable\n#endif\n\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\nprecision highp float;\n\n// Constants\n#define RECIPROCAL_PI2 0.15915494\n#define FRESNEL_MAXIMUM_ON_ROUGH 0.25\n\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\nuniform vec3 vReflectionColor;\nuniform vec4 vAlbedoColor;\n\n// CUSTOM CONTROLS\nuniform vec4 vLightingIntensity;\nuniform vec4 vCameraInfos;\n\n#ifdef OVERLOADEDVALUES\n    uniform vec4 vOverloadedIntensity;\n    uniform vec3 vOverloadedAmbient;\n    uniform vec3 vOverloadedAlbedo;\n    uniform vec3 vOverloadedReflectivity;\n    uniform vec3 vOverloadedEmissive;\n    uniform vec3 vOverloadedReflection;\n    uniform vec3 vOverloadedMicroSurface;\n#endif\n\n#ifdef OVERLOADEDSHADOWVALUES\n    uniform vec4 vOverloadedShadowIntensity;\n#endif\n\n// PBR CUSTOM CONSTANTS\nconst float kPi = 3.1415926535897932384626433832795;\n\n// PBR HELPER METHODS\nfloat Square(float value)\n{\n    return value * value;\n}\n\nfloat getLuminance(vec3 color)\n{\n    return clamp(dot(color, vec3(0.2126, 0.7152, 0.0722)), 0., 1.);\n}\n\nfloat convertRoughnessToAverageSlope(float roughness)\n{\n    // Calculate AlphaG as square of roughness; add epsilon to avoid numerical issues\n    const float kMinimumVariance = 0.0005;\n    float alphaG = Square(roughness) + kMinimumVariance;\n    return alphaG;\n}\n\n// From Microfacet Models for Refraction through Rough Surfaces, Walter et al. 2007\nfloat smithVisibilityG1_TrowbridgeReitzGGX(float dot, float alphaG)\n{\n    float tanSquared = (1.0 - dot * dot) / (dot * dot);\n    return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));\n}\n\nfloat smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL, float NdotV, float alphaG)\n{\n    return smithVisibilityG1_TrowbridgeReitzGGX(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGX(NdotV, alphaG);\n}\n\n// Trowbridge-Reitz (GGX)\n// Generalised Trowbridge-Reitz with gamma power=2.0\nfloat normalDistributionFunction_TrowbridgeReitzGGX(float NdotH, float alphaG)\n{\n    // Note: alphaG is average slope (gradient) of the normals in slope-space.\n    // It is also the (trigonometric) tangent of the median distribution value, i.e. 50% of normals have\n    // a tangent (gradient) closer to the macrosurface than this slope.\n    float a2 = Square(alphaG);\n    float d = NdotH * NdotH * (a2 - 1.0) + 1.0;\n    return a2 / (kPi * d * d);\n}\n\nvec3 fresnelSchlickGGX(float VdotH, vec3 reflectance0, vec3 reflectance90)\n{\n    return reflectance0 + (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotH, 0., 1.), 5.0);\n}\n\nvec3 FresnelSchlickEnvironmentGGX(float VdotN, vec3 reflectance0, vec3 reflectance90, float smoothness)\n{\n    // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle\n    float weight = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);\n    return reflectance0 + weight * (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotN, 0., 1.), 5.0);\n}\n\n// Cook Torance Specular computation.\nvec3 computeSpecularTerm(float NdotH, float NdotL, float NdotV, float VdotH, float roughness, vec3 specularColor)\n{\n    float alphaG = convertRoughnessToAverageSlope(roughness);\n    float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);\n    float visibility = smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL, NdotV, alphaG);\n    visibility /= (4.0 * NdotL * NdotV); // Cook Torance Denominator  integated in viibility to avoid issues when visibility function changes.\n\n    vec3 fresnel = fresnelSchlickGGX(VdotH, specularColor, vec3(1., 1., 1.));\n\n    float specTerm = max(0., visibility * distribution) * NdotL;\n    return fresnel * specTerm * kPi; // TODO: audit pi constants\n}\n\nfloat computeDiffuseTerm(float NdotL, float NdotV, float VdotH, float roughness)\n{\n    // Diffuse fresnel falloff as per Disney principled BRDF, and in the spirit of\n    // of general coupled diffuse/specular models e.g. Ashikhmin Shirley.\n    float diffuseFresnelNV = pow(clamp(1.0 - NdotL, 0.000001, 1.), 5.0);\n    float diffuseFresnelNL = pow(clamp(1.0 - NdotV, 0.000001, 1.), 5.0);\n    float diffuseFresnel90 = 0.5 + 2.0 * VdotH * VdotH * roughness;\n    float diffuseFresnelTerm =\n        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNL) *\n        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNV);\n\n\n    return diffuseFresnelTerm * NdotL;\n    // PI Test\n    // diffuseFresnelTerm /= kPi;\n}\n\nfloat computeDefaultMicroSurface(float microSurface, vec3 reflectivityColor)\n{\n    float kReflectivityNoAlphaWorkflow_SmoothnessMax = 0.95;\n\n    float reflectivityLuminance = getLuminance(reflectivityColor);\n    float reflectivityLuma = sqrt(reflectivityLuminance);\n    microSurface = reflectivityLuma * kReflectivityNoAlphaWorkflow_SmoothnessMax;\n\n    return microSurface;\n}\n\nvec3 toLinearSpace(vec3 color)\n{\n    return vec3(pow(color.r, 2.2), pow(color.g, 2.2), pow(color.b, 2.2));\n}\n\nvec3 toGammaSpace(vec3 color)\n{\n    return vec3(pow(color.r, 1.0 / 2.2), pow(color.g, 1.0 / 2.2), pow(color.b, 1.0 / 2.2));\n}\n\n#ifdef CAMERATONEMAP\n    vec3 toneMaps(vec3 color)\n    {\n        color = max(color, 0.0);\n\n        // TONE MAPPING / EXPOSURE\n        color.rgb = color.rgb * vCameraInfos.x;\n\n        float tuning = 1.5; // TODO: sync up so e.g. 18% greys are matched to exposure appropriately\n        // PI Test\n        // tuning *=  kPi;\n        vec3 tonemapped = 1.0 - exp2(-color.rgb * tuning); // simple local photographic tonemapper\n        color.rgb = mix(color.rgb, tonemapped, 1.0);\n        return color;\n    }\n#endif\n\n#ifdef CAMERACONTRAST\n    vec4 contrasts(vec4 color)\n    {\n        color = clamp(color, 0.0, 1.0);\n\n        vec3 resultHighContrast = color.rgb * color.rgb * (3.0 - 2.0 * color.rgb);\n        float contrast = vCameraInfos.y;\n        if (contrast < 1.0)\n        {\n            // Decrease contrast: interpolate towards zero-contrast image (flat grey)\n            color.rgb = mix(vec3(0.5, 0.5, 0.5), color.rgb, contrast);\n        }\n        else\n        {\n            // Increase contrast: apply simple shoulder-toe high contrast curve\n            color.rgb = mix(color.rgb, resultHighContrast, contrast - 1.0);\n        }\n\n        return color;\n    }\n#endif\n// END PBR HELPER METHODS\n\n    uniform vec4 vReflectivityColor;\n    uniform vec3 vEmissiveColor;\n\n// Input\nvarying vec3 vPositionW;\n\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n// Lights\n#ifdef LIGHT0\nuniform vec4 vLightData0;\nuniform vec4 vLightDiffuse0;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular0;\n#endif\n#ifdef SHADOW0\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\nvarying vec4 vPositionFromLight0;\nuniform sampler2D shadowSampler0;\n#else\nuniform samplerCube shadowSampler0;\n#endif\nuniform vec3 shadowsInfo0;\n#endif\n#ifdef SPOTLIGHT0\nuniform vec4 vLightDirection0;\n#endif\n#ifdef HEMILIGHT0\nuniform vec3 vLightGround0;\n#endif\n#endif\n\n#ifdef LIGHT1\nuniform vec4 vLightData1;\nuniform vec4 vLightDiffuse1;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular1;\n#endif\n#ifdef SHADOW1\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\nvarying vec4 vPositionFromLight1;\nuniform sampler2D shadowSampler1;\n#else\nuniform samplerCube shadowSampler1;\n#endif\nuniform vec3 shadowsInfo1;\n#endif\n#ifdef SPOTLIGHT1\nuniform vec4 vLightDirection1;\n#endif\n#ifdef HEMILIGHT1\nuniform vec3 vLightGround1;\n#endif\n#endif\n\n#ifdef LIGHT2\nuniform vec4 vLightData2;\nuniform vec4 vLightDiffuse2;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular2;\n#endif\n#ifdef SHADOW2\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\nvarying vec4 vPositionFromLight2;\nuniform sampler2D shadowSampler2;\n#else\nuniform samplerCube shadowSampler2;\n#endif\nuniform vec3 shadowsInfo2;\n#endif\n#ifdef SPOTLIGHT2\nuniform vec4 vLightDirection2;\n#endif\n#ifdef HEMILIGHT2\nuniform vec3 vLightGround2;\n#endif\n#endif\n\n#ifdef LIGHT3\nuniform vec4 vLightData3;\nuniform vec4 vLightDiffuse3;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular3;\n#endif\n#ifdef SHADOW3\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\nvarying vec4 vPositionFromLight3;\nuniform sampler2D shadowSampler3;\n#else\nuniform samplerCube shadowSampler3;\n#endif\nuniform vec3 shadowsInfo3;\n#endif\n#ifdef SPOTLIGHT3\nuniform vec4 vLightDirection3;\n#endif\n#ifdef HEMILIGHT3\nuniform vec3 vLightGround3;\n#endif\n#endif\n\n// Samplers\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform sampler2D albedoSampler;\nuniform vec2 vAlbedoInfos;\n#endif\n\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform sampler2D ambientSampler;\nuniform vec2 vAmbientInfos;\n#endif\n\n#ifdef OPACITY\t\nvarying vec2 vOpacityUV;\nuniform sampler2D opacitySampler;\nuniform vec2 vOpacityInfos;\n#endif\n\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform vec2 vEmissiveInfos;\nuniform sampler2D emissiveSampler;\n#endif\n\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\nuniform vec2 vLightmapInfos;\nuniform sampler2D lightmapSampler;\n#endif\n\n#if defined(REFLECTIVITY)\nvarying vec2 vReflectivityUV;\nuniform vec2 vReflectivityInfos;\nuniform sampler2D reflectivitySampler;\n#endif\n\n// Fresnel\n#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection, vec3 worldNormal, float bias, float power)\n{\n    float fresnelTerm = pow(bias + abs(dot(viewDirection, worldNormal)), power);\n    return clamp(fresnelTerm, 0., 1.);\n}\n#endif\n\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n// Reflection\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvarying vec3 vDirectionW;\n#endif\n\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 view;\n#endif\n#endif\n\nvec3 computeReflectionCoords(vec4 worldPos, vec3 worldNormal)\n{\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\n    vec3 direction = normalize(vDirectionW);\n\n    float t = clamp(direction.y * -0.5 + 0.5, 0., 1.0);\n    float s = atan(direction.z, direction.x) * RECIPROCAL_PI2 + 0.5;\n\n    return vec3(s, t, 0);\n#endif\n\n#ifdef REFLECTIONMAP_SPHERICAL\n    vec3 viewDir = normalize(vec3(view * worldPos));\n    vec3 viewNormal = normalize(vec3(view * vec4(worldNormal, 0.0)));\n\n    vec3 r = reflect(viewDir, viewNormal);\n    r.z = r.z - 1.0;\n\n    float m = 2.0 * length(r);\n\n    return vec3(r.x / m + 0.5, 1.0 - r.y / m - 0.5, 0);\n#endif\n\n#ifdef REFLECTIONMAP_PLANAR\n    vec3 viewDir = worldPos.xyz - vEyePosition;\n    vec3 coords = normalize(reflect(viewDir, worldNormal));\n\n    return vec3(reflectionMatrix * vec4(coords, 1));\n#endif\n\n#ifdef REFLECTIONMAP_CUBIC\n    vec3 viewDir = worldPos.xyz - vEyePosition;\n    vec3 coords = reflect(viewDir, worldNormal);\n#ifdef INVERTCUBICMAP\n    coords.y = 1.0 - coords.y;\n#endif\n    return vec3(reflectionMatrix * vec4(coords, 0));\n#endif\n\n#ifdef REFLECTIONMAP_PROJECTION\n    return vec3(reflectionMatrix * (view * worldPos));\n#endif\n\n#ifdef REFLECTIONMAP_SKYBOX\n    return vPositionUVW;\n#endif\n\n#ifdef REFLECTIONMAP_EXPLICIT\n    return vec3(0, 0, 0);\n#endif\n}\n\n#endif\n\n// Shadows\n#ifdef SHADOWS\n\nfloat unpack(vec4 color)\n{\n    const vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);\n    return dot(color, bit_shift);\n}\n\n#if defined(POINTLIGHT0) || defined(POINTLIGHT1) || defined(POINTLIGHT2) || defined(POINTLIGHT3)\nuniform vec2 depthValues;\n\nfloat computeShadowCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float bias)\n{\n\tvec3 directionToLight = vPositionW - lightPosition;\n\tfloat depth = length(directionToLight);\n\tdepth = clamp(depth, 0., 1.0);\n\n\tdirectionToLight = normalize(directionToLight);\n\tdirectionToLight.y = - directionToLight.y;\n\n\tfloat shadow = unpack(textureCube(shadowSampler, directionToLight)) + bias;\n\n    if (depth > shadow)\n    {\n#ifdef OVERLOADEDSHADOWVALUES\n        return mix(1.0, darkness, vOverloadedShadowIntensity.x);\n#else\n        return darkness;\n#endif\n    }\n    return 1.0;\n}\n\nfloat computeShadowWithPCFCube(vec3 lightPosition, samplerCube shadowSampler, float mapSize, float bias, float darkness)\n{\n\tvec3 directionToLight = vPositionW - lightPosition;\n\tfloat depth = length(directionToLight);\n\n\tdepth = clamp(depth, 0., 1.0);\n\tfloat diskScale = 2.0 / mapSize;\n\n\tdirectionToLight = normalize(directionToLight);\n\tdirectionToLight.y = -directionToLight.y;\n\n    float visibility = 1.;\n\n    vec3 poissonDisk[4];\n    poissonDisk[0] = vec3(-1.0, 1.0, -1.0);\n    poissonDisk[1] = vec3(1.0, -1.0, -1.0);\n    poissonDisk[2] = vec3(-1.0, -1.0, -1.0);\n    poissonDisk[3] = vec3(1.0, -1.0, 1.0);\n\n    // Poisson Sampling\n    float biasedDepth = depth - bias;\n\n    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[0] * diskScale)) < biasedDepth) visibility -= 0.25;\n    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[1] * diskScale)) < biasedDepth) visibility -= 0.25;\n    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[2] * diskScale)) < biasedDepth) visibility -= 0.25;\n    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[3] * diskScale)) < biasedDepth) visibility -= 0.25;\n\n#ifdef OVERLOADEDSHADOWVALUES\n    return  min(1.0, mix(1.0, visibility + darkness, vOverloadedShadowIntensity.x));\n#else\n    return  min(1.0, visibility + darkness);\n#endif\n}\n#endif\n\n#if defined(SPOTLIGHT0) || defined(SPOTLIGHT1) || defined(SPOTLIGHT2) || defined(SPOTLIGHT3) ||  defined(DIRLIGHT0) || defined(DIRLIGHT1) || defined(DIRLIGHT2) || defined(DIRLIGHT3)\nfloat computeShadow(vec4 vPositionFromLight, sampler2D shadowSampler, float darkness, float bias)\n{\n    vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\n    depth = 0.5 * depth + vec3(0.5);\n    vec2 uv = depth.xy;\n\n    if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)\n    {\n        return 1.0;\n    }\n\n    float shadow = unpack(texture2D(shadowSampler, uv)) + bias;\n\n    if (depth.z > shadow)\n    {\n#ifdef OVERLOADEDSHADOWVALUES\n        return mix(1.0, darkness, vOverloadedShadowIntensity.x);\n#else\n        return darkness;\n#endif\n    }\n    return 1.;\n}\n\nfloat computeShadowWithPCF(vec4 vPositionFromLight, sampler2D shadowSampler, float mapSize, float bias, float darkness)\n{\n    vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\n    depth = 0.5 * depth + vec3(0.5);\n    vec2 uv = depth.xy;\n\n    if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)\n    {\n        return 1.0;\n    }\n\n    float visibility = 1.;\n\n    vec2 poissonDisk[4];\n    poissonDisk[0] = vec2(-0.94201624, -0.39906216);\n    poissonDisk[1] = vec2(0.94558609, -0.76890725);\n    poissonDisk[2] = vec2(-0.094184101, -0.92938870);\n    poissonDisk[3] = vec2(0.34495938, 0.29387760);\n\n    // Poisson Sampling\n    float biasedDepth = depth.z - bias;\n\n    if (unpack(texture2D(shadowSampler, uv + poissonDisk[0] / mapSize)) < biasedDepth) visibility -= 0.25;\n    if (unpack(texture2D(shadowSampler, uv + poissonDisk[1] / mapSize)) < biasedDepth) visibility -= 0.25;\n    if (unpack(texture2D(shadowSampler, uv + poissonDisk[2] / mapSize)) < biasedDepth) visibility -= 0.25;\n    if (unpack(texture2D(shadowSampler, uv + poissonDisk[3] / mapSize)) < biasedDepth) visibility -= 0.25;\n\n#ifdef OVERLOADEDSHADOWVALUES\n    return  min(1.0, mix(1.0, visibility + darkness, vOverloadedShadowIntensity.x));\n#else\n    return  min(1.0, visibility + darkness);\n#endif\n}\n\n// Thanks to http://devmaster.net/\nfloat unpackHalf(vec2 color)\n{\n    return color.x + (color.y / 255.0);\n}\n\nfloat linstep(float low, float high, float v) {\n    return clamp((v - low) / (high - low), 0.0, 1.0);\n}\n\nfloat ChebychevInequality(vec2 moments, float compare, float bias)\n{\n    float p = smoothstep(compare - bias, compare, moments.x);\n    float variance = max(moments.y - moments.x * moments.x, 0.02);\n    float d = compare - moments.x;\n    float p_max = linstep(0.2, 1.0, variance / (variance + d * d));\n\n    return clamp(max(p, p_max), 0.0, 1.0);\n}\n\nfloat computeShadowWithVSM(vec4 vPositionFromLight, sampler2D shadowSampler, float bias, float darkness)\n{\n    vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\n    depth = 0.5 * depth + vec3(0.5);\n    vec2 uv = depth.xy;\n\n    if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0 || depth.z >= 1.0)\n    {\n        return 1.0;\n    }\n\n    vec4 texel = texture2D(shadowSampler, uv);\n\n    vec2 moments = vec2(unpackHalf(texel.xy), unpackHalf(texel.zw));\n#ifdef OVERLOADEDSHADOWVALUES\n    return min(1.0, mix(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness, vOverloadedShadowIntensity.x));\n#else\n    return min(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness);\n#endif\n}\n#endif\n\n#endif\n\n// Bump\n#ifdef BUMP\nvarying vec2 vBumpUV;\nuniform vec2 vBumpInfos;\nuniform sampler2D bumpSampler;\n\n// Thanks to http://www.thetenthplanet.de/archives/1180\nmat3 cotangent_frame(vec3 normal, vec3 p, vec2 uv)\n{\n    // get edge vectors of the pixel triangle\n    vec3 dp1 = dFdx(p);\n    vec3 dp2 = dFdy(p);\n    vec2 duv1 = dFdx(uv);\n    vec2 duv2 = dFdy(uv);\n\n    // solve the linear system\n    vec3 dp2perp = cross(dp2, normal);\n    vec3 dp1perp = cross(normal, dp1);\n    vec3 tangent = dp2perp * duv1.x + dp1perp * duv2.x;\n    vec3 binormal = dp2perp * duv1.y + dp1perp * duv2.y;\n\n    // construct a scale-invariant frame \n    float invmax = inversesqrt(max(dot(tangent, tangent), dot(binormal, binormal)));\n    return mat3(tangent * invmax, binormal * invmax, normal);\n}\n\nvec3 perturbNormal(vec3 viewDir)\n{\n    vec3 map = texture2D(bumpSampler, vBumpUV).xyz;\n    map = map * 255. / 127. - 128. / 127.;\n    mat3 TBN = cotangent_frame(vNormalW * vBumpInfos.y, -viewDir, vBumpUV);\n    return normalize(TBN * map);\n}\n#endif\n\n#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif\n\n#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif\n\n// Fog\n#ifdef FOG\n\n#define FOGMODE_NONE    0.\n#define FOGMODE_EXP     1.\n#define FOGMODE_EXP2    2.\n#define FOGMODE_LINEAR  3.\n#define E 2.71828\n\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying float fFogDistance;\n\nfloat CalcFogFactor()\n{\n    float fogCoeff = 1.0;\n    float fogStart = vFogInfos.y;\n    float fogEnd = vFogInfos.z;\n    float fogDensity = vFogInfos.w;\n\n    if (FOGMODE_LINEAR == vFogInfos.x)\n    {\n        fogCoeff = (fogEnd - fFogDistance) / (fogEnd - fogStart);\n    }\n    else if (FOGMODE_EXP == vFogInfos.x)\n    {\n        fogCoeff = 1.0 / pow(E, fFogDistance * fogDensity);\n    }\n    else if (FOGMODE_EXP2 == vFogInfos.x)\n    {\n        fogCoeff = 1.0 / pow(E, fFogDistance * fFogDistance * fogDensity * fogDensity);\n    }\n\n    return clamp(fogCoeff, 0.0, 1.0);\n}\n#endif\n\n// Light Computing\nstruct lightingInfo\n{\n    vec3 diffuse;\n#ifdef SPECULARTERM\n    vec3 specular;\n#endif\n};\n\nlightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV) {\n    lightingInfo result;\n\n    vec3 lightVectorW;\n    float attenuation = 1.0;\n    if (lightData.w == 0.)\n    {\n        vec3 direction = lightData.xyz - vPositionW;\n\n        attenuation = max(0., 1.0 - length(direction) / range);\n        lightVectorW = normalize(direction);\n    }\n    else\n    {\n        lightVectorW = normalize(-lightData.xyz);\n    }\n\n    // diffuse\n    vec3 H = normalize(viewDirectionW + lightVectorW);\n    float NdotL = max(0.00000000001, dot(vNormal, lightVectorW));\n    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));\n\n    float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);\n    result.diffuse = diffuseTerm * diffuseColor * attenuation;\n\n#ifdef SPECULARTERM\n    // Specular\n    float NdotH = max(0.00000000001, dot(vNormal, H));\n\n    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\n    result.specular = specTerm * attenuation;\n#endif\n\n    return result;\n}\n\nlightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV) {\n    lightingInfo result;\n\n    vec3 direction = lightData.xyz - vPositionW;\n    vec3 lightVectorW = normalize(direction);\n    float attenuation = max(0., 1.0 - length(direction) / range);\n\n    // diffuse\n    float cosAngle = max(0.0000001, dot(-lightDirection.xyz, lightVectorW));\n    float spotAtten = 0.0;\n\n    if (cosAngle >= lightDirection.w)\n    {\n        cosAngle = max(0., pow(cosAngle, lightData.w));\n        spotAtten = clamp((cosAngle - lightDirection.w) / (1. - cosAngle), 0.0, 1.0);\n\n        // Diffuse\n        vec3 H = normalize(viewDirectionW - lightDirection.xyz);\n        float NdotL = max(0.00000000001, dot(vNormal, -lightDirection.xyz));\n        float VdotH = clamp(dot(viewDirectionW, H), 0.00000000001, 1.0);\n\n        float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);\n        result.diffuse = diffuseTerm * diffuseColor * attenuation * spotAtten;\n\n#ifdef SPECULARTERM\n        // Specular\n        float NdotH = max(0.00000000001, dot(vNormal, H));\n\n        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\n        result.specular = specTerm  * attenuation * spotAtten;\n#endif\n\n        return result;\n    }\n\n    result.diffuse = vec3(0.);\n#ifdef SPECULARTERM\n    result.specular = vec3(0.);\n#endif\n\n    return result;\n}\n\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float roughness, float NdotV) {\n    lightingInfo result;\n\n    vec3 lightVectorW = normalize(lightData.xyz);\n\n    // Diffuse\n    float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;\n    result.diffuse = mix(groundColor, diffuseColor, ndl);\n\n#ifdef SPECULARTERM\n    // Specular\n    vec3 H = normalize(viewDirectionW + lightVectorW);\n    float NdotH = max(0.00000000001, dot(vNormal, H));\n    float NdotL = max(0.00000000001, ndl);\n    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));\n\n    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\n    result.specular = specTerm;\n#endif\n\n    return result;\n}\n\nvoid main(void) {\n    // Clip plane\n#ifdef CLIPPLANE\n    if (fClipDistance > 0.0)\n        discard;\n#endif\n\n    vec3 viewDirectionW = normalize(vEyePosition - vPositionW);\n\n    // Base color\n    vec4 baseColor = vec4(1., 1., 1., 1.);\n    vec3 albedoColor = vAlbedoColor.rgb;\n    \n    // Alpha\n    float alpha = vAlbedoColor.a;\n\n#ifdef ALBEDO\n    baseColor = texture2D(albedoSampler, vAlbedoUV);\n    baseColor = vec4(toLinearSpace(baseColor.rgb), baseColor.a);\n\n#ifdef ALPHATEST\n    if (baseColor.a < 0.4)\n        discard;\n#endif\n\n#ifdef ALPHAFROMALBEDO\n    alpha *= baseColor.a;\n#endif\n\n    baseColor.rgb *= vAlbedoInfos.y;\n#endif\n\n#ifdef VERTEXCOLOR\n    baseColor.rgb *= vColor.rgb;\n#endif\n\n#ifdef OVERLOADEDVALUES\n    baseColor.rgb = mix(baseColor.rgb, vOverloadedAlbedo, vOverloadedIntensity.y);\n    albedoColor.rgb = mix(albedoColor.rgb, vOverloadedAlbedo, vOverloadedIntensity.y);\n#endif\n\n    // Bump\n#ifdef NORMAL\n    vec3 normalW = normalize(vNormalW);\n#else\n    vec3 normalW = vec3(1.0, 1.0, 1.0);\n#endif\n\n\n#ifdef BUMP\n    normalW = perturbNormal(viewDirectionW);\n#endif\n\n    // Ambient color\n    vec3 baseAmbientColor = vec3(1., 1., 1.);\n\n#ifdef AMBIENT\n    baseAmbientColor = texture2D(ambientSampler, vAmbientUV).rgb * vAmbientInfos.y;\n    \n    #ifdef OVERLOADEDVALUES\n        baseAmbientColor.rgb = mix(baseAmbientColor.rgb, vOverloadedAmbient, vOverloadedIntensity.x);\n    #endif\n#endif\n\n    // Specular map\n    float microSurface = vReflectivityColor.a;\n    vec3 reflectivityColor = vReflectivityColor.rgb;\n    \n    #ifdef OVERLOADEDVALUES\n        reflectivityColor.rgb = mix(reflectivityColor.rgb, vOverloadedReflectivity, vOverloadedIntensity.z);\n    #endif\n\n    #ifdef REFLECTIVITY\n        vec4 reflectivityMapColor = texture2D(reflectivitySampler, vReflectivityUV);\n        reflectivityColor = toLinearSpace(reflectivityMapColor.rgb);\n\n        #ifdef OVERLOADEDVALUES\n                reflectivityColor.rgb = mix(reflectivityColor.rgb, vOverloadedReflectivity, vOverloadedIntensity.z);\n        #endif\n\n        #ifdef MICROSURFACEFROMREFLECTIVITYMAP\n            microSurface = reflectivityMapColor.a;\n        #else\n            microSurface = computeDefaultMicroSurface(microSurface, reflectivityColor);\n        #endif\n    #endif\n\n    #ifdef OVERLOADEDVALUES\n        microSurface = mix(microSurface, vOverloadedMicroSurface.x, vOverloadedMicroSurface.y);\n    #endif\n\n    // Apply Energy Conservation taking in account the environment level only if the environment is present.\n    float reflectance = max(max(reflectivityColor.r, reflectivityColor.g), reflectivityColor.b);\n    baseColor.rgb = (1. - reflectance) * baseColor.rgb;\n\n    // Compute Specular Fresnel + Reflectance.\n    float NdotV = max(0.00000000001, dot(normalW, viewDirectionW));\n\n    // Adapt microSurface.\n    microSurface = clamp(microSurface, 0., 1.) * 0.98;\n\n    // Call rough to not conflict with previous one.\n    float rough = clamp(1. - microSurface, 0.000001, 1.0);\n\n    // Lighting\n    vec3 diffuseBase = vec3(0., 0., 0.);\n    \n#ifdef OVERLOADEDSHADOWVALUES\n    vec3 shadowedOnlyDiffuseBase = vec3(1., 1., 1.);\n#endif\n\n#ifdef SPECULARTERM\n    vec3 specularBase = vec3(0., 0., 0.);\n#endif\n    float shadow = 1.;\n\n#ifdef LIGHT0\n#ifndef SPECULARTERM\n    vec3 vLightSpecular0 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT0\n    lightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, rough, NdotV);\n#endif\n#ifdef HEMILIGHT0\n    lightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightGround0, rough, NdotV);\n#endif\n#if defined(POINTLIGHT0) || defined(DIRLIGHT0)\n    lightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, rough, NdotV);\n#endif\n#ifdef SHADOW0\n#ifdef SHADOWVSM0\n    shadow = computeShadowWithVSM(vPositionFromLight0, shadowSampler0, shadowsInfo0.z, shadowsInfo0.x);\n#else\n#ifdef SHADOWPCF0\n#if defined(POINTLIGHT0)\n    shadow = computeShadowWithPCFCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);\n#else\n    shadow = computeShadowWithPCF(vPositionFromLight0, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);\n#endif\n#else\n#if defined(POINTLIGHT0)\n    shadow = computeShadowCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);\n#else\n    shadow = computeShadow(vPositionFromLight0, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);\n#endif\n#endif\n#endif\n#else\n    shadow = 1.;\n#endif\n    diffuseBase += info.diffuse * shadow;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyDiffuseBase *= shadow;\n#endif\n\n#ifdef SPECULARTERM\n    specularBase += info.specular * shadow;\n#endif\n#endif\n\n#ifdef LIGHT1\n#ifndef SPECULARTERM\n    vec3 vLightSpecular1 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT1\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, rough, NdotV);\n#endif\n#ifdef HEMILIGHT1\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightGround1, rough, NdotV);\n#endif\n#if defined(POINTLIGHT1) || defined(DIRLIGHT1)\n    info = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, rough, NdotV);\n#endif\n#ifdef SHADOW1\n#ifdef SHADOWVSM1\n    shadow = computeShadowWithVSM(vPositionFromLight1, shadowSampler1, shadowsInfo1.z, shadowsInfo1.x);\n#else\n#ifdef SHADOWPCF1\n#if defined(POINTLIGHT1)\n    shadow = computeShadowWithPCFCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);\n#else\n    shadow = computeShadowWithPCF(vPositionFromLight1, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);\n#endif\n#else\n#if defined(POINTLIGHT1)\n    shadow = computeShadowCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);\n#else\n    shadow = computeShadow(vPositionFromLight1, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);\n#endif\n#endif\n#endif\n#else\n    shadow = 1.;\n#endif\n\n    diffuseBase += info.diffuse * shadow;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyDiffuseBase *= shadow;\n#endif\n\n#ifdef SPECULARTERM\n    specularBase += info.specular * shadow;\n#endif\n#endif\n\n#ifdef LIGHT2\n#ifndef SPECULARTERM\n    vec3 vLightSpecular2 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT2\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, rough, NdotV);\n#endif\n#ifdef HEMILIGHT2\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightGround2, rough, NdotV);\n#endif\n#if defined(POINTLIGHT2) || defined(DIRLIGHT2)\n    info = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, rough, NdotV);\n#endif\n#ifdef SHADOW2\n#ifdef SHADOWVSM2\n    shadow = computeShadowWithVSM(vPositionFromLight2, shadowSampler2, shadowsInfo2.z, shadowsInfo2.x);\n#else\n#ifdef SHADOWPCF2\n#if defined(POINTLIGHT2)\n    shadow = computeShadowWithPCFCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);\n#else\n    shadow = computeShadowWithPCF(vPositionFromLight2, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);\n#endif\n#else\n#if defined(POINTLIGHT2)\n    shadow = computeShadowCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);\n#else\n    shadow = computeShadow(vPositionFromLight2, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);\n#endif\n#endif\t\n#endif\t\n#else\n    shadow = 1.;\n#endif\n\n    diffuseBase += info.diffuse * shadow;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyDiffuseBase *= shadow;\n#endif\n\n#ifdef SPECULARTERM\n    specularBase += info.specular * shadow;\n#endif\n#endif\n\n#ifdef LIGHT3\n#ifndef SPECULARTERM\n    vec3 vLightSpecular3 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT3\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, rough, NdotV);\n#endif\n#ifdef HEMILIGHT3\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightGround3, rough, NdotV);\n#endif\n#if defined(POINTLIGHT3) || defined(DIRLIGHT3)\n    info = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, rough, NdotV);\n#endif\n#ifdef SHADOW3\n#ifdef SHADOWVSM3\n    shadow = computeShadowWithVSM(vPositionFromLight3, shadowSampler3, shadowsInfo3.z, shadowsInfo3.x);\n#else\n#ifdef SHADOWPCF3\n#if defined(POINTLIGHT3)\n    shadow = computeShadowWithPCFCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);\n#else\n    shadow = computeShadowWithPCF(vPositionFromLight3, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);\n#endif\n#else\n#if defined(POINTLIGHT3)\n    shadow = computeShadowCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);\n#else\n    shadow = computeShadow(vPositionFromLight3, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);\n#endif\n#endif\t\n#endif\t\n#else\n    shadow = 1.;\n#endif\n\n    diffuseBase += info.diffuse * shadow;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyDiffuseBase *= shadow;\n#endif\n\n#ifdef SPECULARTERM\n    specularBase += info.specular * shadow;\n#endif\n#endif\n\n// Reflection\nvec3 reflectionColor = vReflectionColor.rgb;\nvec3 ambientReflectionColor = vReflectionColor.rgb;\n\n#ifdef REFLECTION\n    vec3 vReflectionUVW = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);\n\n    #ifdef REFLECTIONMAP_3D\n        // Go mat -> blurry reflexion according to microSurface\n        float bias = 20. * (1.0 - microSurface);\n\n        reflectionColor = textureCube(reflectionCubeSampler, vReflectionUVW, bias).rgb * vReflectionInfos.x;\n        reflectionColor = toLinearSpace(reflectionColor.rgb);\n\n        ambientReflectionColor = textureCube(reflectionCubeSampler, normalW, 20.).rgb * vReflectionInfos.x;\n        ambientReflectionColor = toLinearSpace(ambientReflectionColor.rgb);\n    #else\n        vec2 coords = vReflectionUVW.xy;\n\n        #ifdef REFLECTIONMAP_PROJECTION\n            coords /= vReflectionUVW.z;\n        #endif\n\n        coords.y = 1.0 - coords.y;\n\n        reflectionColor = texture2D(reflection2DSampler, coords).rgb * vReflectionInfos.x;\n        reflectionColor = toLinearSpace(reflectionColor.rgb);\n\n        ambientReflectionColor = texture2D(reflection2DSampler, coords, 20.).rgb * vReflectionInfos.x;\n        ambientReflectionColor = toLinearSpace(ambientReflectionColor.rgb);\n    #endif\n#endif\n\n#ifdef OVERLOADEDVALUES\n    ambientReflectionColor = mix(ambientReflectionColor, vOverloadedReflection, vOverloadedMicroSurface.z);\n    reflectionColor = mix(reflectionColor, vOverloadedReflection, vOverloadedMicroSurface.z);\n#endif\n\nreflectionColor *= vLightingIntensity.z;\nambientReflectionColor *= vLightingIntensity.z;\n\n// Compute reflection specular fresnel\nvec3 specularEnvironmentR0 = reflectivityColor.rgb;\nvec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0);\nvec3 specularEnvironmentReflectanceViewer = FresnelSchlickEnvironmentGGX(clamp(NdotV, 0., 1.), specularEnvironmentR0, specularEnvironmentR90, sqrt(microSurface));\nreflectionColor *= specularEnvironmentReflectanceViewer;\n\n#ifdef OPACITY\n    vec4 opacityMap = texture2D(opacitySampler, vOpacityUV);\n\n    #ifdef OPACITYRGB\n        opacityMap.rgb = opacityMap.rgb * vec3(0.3, 0.59, 0.11);\n        alpha *= (opacityMap.x + opacityMap.y + opacityMap.z)* vOpacityInfos.y;\n    #else\n        alpha *= opacityMap.a * vOpacityInfos.y;\n    #endif\n\n#endif\n\n#ifdef VERTEXALPHA\n    alpha *= vColor.a;\n#endif\n\n#ifdef OPACITYFRESNEL\n    float opacityFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, opacityParts.z, opacityParts.w);\n\n    alpha += opacityParts.x * (1.0 - opacityFresnelTerm) + opacityFresnelTerm * opacityParts.y;\n#endif\n\n    // Emissive\n    vec3 emissiveColor = vEmissiveColor;\n#ifdef EMISSIVE\n    vec3 emissiveColorTex = texture2D(emissiveSampler, vEmissiveUV).rgb;\n    emissiveColor = toLinearSpace(emissiveColorTex.rgb) * emissiveColor * vEmissiveInfos.y;\n#endif\n\n#ifdef OVERLOADEDVALUES\n    emissiveColor = mix(emissiveColor, vOverloadedEmissive, vOverloadedIntensity.w);\n#endif\n\n#ifdef EMISSIVEFRESNEL\n    float emissiveFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, emissiveRightColor.a, emissiveLeftColor.a);\n\n    emissiveColor *= emissiveLeftColor.rgb * (1.0 - emissiveFresnelTerm) + emissiveFresnelTerm * emissiveRightColor.rgb;\n#endif\n\n    // Composition\n#ifdef EMISSIVEASILLUMINATION\n    vec3 finalDiffuse = max(diffuseBase * albedoColor + vAmbientColor, 0.0) * baseColor.rgb;\n    \n    #ifdef OVERLOADEDSHADOWVALUES\n        shadowedOnlyDiffuseBase = max(shadowedOnlyDiffuseBase * albedoColor + vAmbientColor, 0.0) * baseColor.rgb;\n    #endif\n#else\n    #ifdef LINKEMISSIVEWITHALBEDO\n        vec3 finalDiffuse = max((diffuseBase + emissiveColor) * albedoColor + vAmbientColor, 0.0) * baseColor.rgb;\n\n        #ifdef OVERLOADEDSHADOWVALUES\n            shadowedOnlyDiffuseBase = max((shadowedOnlyDiffuseBase + emissiveColor) * albedoColor + vAmbientColor, 0.0) * baseColor.rgb;\n        #endif\n    #else\n        vec3 finalDiffuse = max(diffuseBase * albedoColor + emissiveColor + vAmbientColor, 0.0) * baseColor.rgb;\n\n        #ifdef OVERLOADEDSHADOWVALUES\n            shadowedOnlyDiffuseBase = max(shadowedOnlyDiffuseBase * albedoColor + emissiveColor + vAmbientColor, 0.0) * baseColor.rgb;\n        #endif\n    #endif\n#endif\n\n#ifdef OVERLOADEDSHADOWVALUES\n    finalDiffuse = mix(finalDiffuse, shadowedOnlyDiffuseBase, (1.0 - vOverloadedShadowIntensity.y));\n#endif\n\n// diffuse lighting from environment 0.2 replaces Harmonic...\n// Ambient Reflection already includes the environment intensity.\nfinalDiffuse += baseColor.rgb * ambientReflectionColor * 0.2;\n\n#ifdef SPECULARTERM\n    vec3 finalSpecular = specularBase * reflectivityColor * vLightingIntensity.w;\n#else\n    vec3 finalSpecular = vec3(0.0);\n#endif\n\n#ifdef OVERLOADEDSHADOWVALUES\n    finalSpecular = mix(finalSpecular, vec3(0.0), (1.0 - vOverloadedShadowIntensity.y));\n#endif\n\n#ifdef SPECULAROVERALPHA\n    alpha = clamp(alpha + dot(finalSpecular, vec3(0.3, 0.59, 0.11)), 0., 1.);\n#endif\n\n// Composition\n// Reflection already includes the environment intensity.\n#ifdef EMISSIVEASILLUMINATION\n    vec4 color = vec4(finalDiffuse * baseAmbientColor * vLightingIntensity.x + finalSpecular * vLightingIntensity.x + reflectionColor + emissiveColor * vLightingIntensity.y, alpha);\n#else\n    vec4 color = vec4(finalDiffuse * baseAmbientColor * vLightingIntensity.x + finalSpecular * vLightingIntensity.x + reflectionColor, alpha);\n#endif\n\n#ifdef LIGHTMAP\n    vec3 lightmapColor = texture2D(lightmapSampler, vLightmapUV).rgb * vLightmapInfos.y;\n\n    #ifdef USELIGHTMAPASSHADOWMAP\n        color.rgb *= lightmapColor;\n    #else\n        color.rgb += lightmapColor;\n    #endif\n#endif\n\n#ifdef FOG\n    float fog = CalcFogFactor();\n    color.rgb = fog * color.rgb + (1.0 - fog) * vFogColor;\n#endif\n\n    color = max(color, 0.0);\n\n#ifdef CAMERATONEMAP\n    color.rgb = toneMaps(color.rgb);\n#endif\n\n    color.rgb = toGammaSpace(color.rgb);\n\n#ifdef CAMERACONTRAST\n    color = contrasts(color);\n#endif\n\n    // Normal Display.\n    // gl_FragColor = vec4(normalW * 0.5 + 0.5, 1.0);\n\n    // Ambient reflection color.\n    // gl_FragColor = vec4(ambientReflectionColor, 1.0);\n\n    // Reflection color.\n    // gl_FragColor = vec4(reflectionColor, 1.0);\n\n    // Base color.\n    // gl_FragColor = vec4(baseColor.rgb, 1.0);\n\n    // Specular color.\n    // gl_FragColor = vec4(reflectivityColor.rgb, 1.0);\n\n    // MicroSurface color.\n    // gl_FragColor = vec4(microSurface, microSurface, microSurface, 1.0);\n\n    // Specular Map\n    // gl_FragColor = vec4(reflectivityMapColor.rgb, 1.0);\n\n    //// Emissive Color\n    //vec2 test = vEmissiveUV * 0.5 + 0.5;\n    //gl_FragColor = vec4(test.x, test.y, 1.0, 1.0);\n\n    gl_FragColor = color;\n}";
BABYLON.Effect.ShadersStore['legacypbrVertexShader'] = "precision mediump float;\n\n// Attributes\nattribute vec3 position;\nattribute vec3 normal;\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n\n#if NUM_BONE_INFLUENCERS > 0\nuniform mat4 mBones[BonesPerMesh];\n\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS > 4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif\n\n// Uniforms\nuniform mat4 world;\nuniform mat4 view;\nuniform mat4 viewProjection;\n\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform mat4 albedoMatrix;\nuniform vec2 vAlbedoInfos;\n#endif\n\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n\n#ifdef OPACITY\nvarying vec2 vOpacityUV;\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n\n#if defined(REFLECTIVITY)\nvarying vec2 vReflectivityUV;\nuniform vec2 vReflectivityInfos;\nuniform mat4 reflectivityMatrix;\n#endif\n\n// Output\nvarying vec3 vPositionW;\nvarying vec3 vNormalW;\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif\n\nvoid main(void) {\n    mat4 finalWorld = world;\n\n#if NUM_BONE_INFLUENCERS > 0\n    mat4 influence;\n    influence = mBones[int(matricesIndices[0])] * matricesWeights[0];\n\n#if NUM_BONE_INFLUENCERS > 1\n    influence += mBones[int(matricesIndices[1])] * matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS > 2\n    influence += mBones[int(matricesIndices[2])] * matricesWeights[2];\n#endif\t\n#if NUM_BONE_INFLUENCERS > 3\n    influence += mBones[int(matricesIndices[3])] * matricesWeights[3];\n#endif\t\n\n#if NUM_BONE_INFLUENCERS > 4\n    influence += mBones[int(matricesIndicesExtra[0])] * matricesWeightsExtra[0];\n#endif\n#if NUM_BONE_INFLUENCERS > 5\n    influence += mBones[int(matricesIndicesExtra[1])] * matricesWeightsExtra[1];\n#endif\t\n#if NUM_BONE_INFLUENCERS > 6\n    influence += mBones[int(matricesIndicesExtra[2])] * matricesWeightsExtra[2];\n#endif\t\n#if NUM_BONE_INFLUENCERS > 7\n    influence += mBones[int(matricesIndicesExtra[3])] * matricesWeightsExtra[3];\n#endif\t\n\n    finalWorld = finalWorld * influence;\n#endif\n\n\tgl_Position = viewProjection * finalWorld * vec4(position, 1.0);\n\n\tvec4 worldPos = finalWorld * vec4(position, 1.0);\n\tvPositionW = vec3(worldPos);\n\tvNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));\n\n\t// Texture coordinates\n#ifndef UV1\n\tvec2 uv = vec2(0., 0.);\n#endif\n#ifndef UV2\n\tvec2 uv2 = vec2(0., 0.);\n#endif\n\n#ifdef ALBEDO\n\tif (vAlbedoInfos.x == 0.)\n\t{\n\t\tvAlbedoUV = vec2(albedoMatrix * vec4(uv, 1.0, 0.0));\n\t}\n\telse\n\t{\n\t\tvAlbedoUV = vec2(albedoMatrix * vec4(uv2, 1.0, 0.0));\n\t}\n#endif\n\n#ifdef AMBIENT\n\tif (vAmbientInfos.x == 0.)\n\t{\n\t\tvAmbientUV = vec2(ambientMatrix * vec4(uv, 1.0, 0.0));\n\t}\n\telse\n\t{\n\t\tvAmbientUV = vec2(ambientMatrix * vec4(uv2, 1.0, 0.0));\n\t}\n#endif\n\n#ifdef OPACITY\n\tif (vOpacityInfos.x == 0.)\n\t{\n\t\tvOpacityUV = vec2(opacityMatrix * vec4(uv, 1.0, 0.0));\n\t}\n\telse\n\t{\n\t\tvOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));\n\t}\n#endif\n\n#ifdef EMISSIVE\n\tif (vEmissiveInfos.x == 0.)\n\t{\n\t\tvEmissiveUV = vec2(emissiveMatrix * vec4(uv, 1.0, 0.0));\n\t}\n\telse\n\t{\n\t\tvEmissiveUV = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));\n\t}\n#endif\n\n#if defined(REFLECTIVITY)\n\tif (vReflectivityInfos.x == 0.)\n\t{\n\t\tvReflectivityUV = vec2(reflectivityMatrix * vec4(uv, 1.0, 0.0));\n\t}\n\telse\n\t{\n\t\tvReflectivityUV = vec2(reflectivityMatrix * vec4(uv2, 1.0, 0.0));\n\t}\n#endif\n\n\t// Clip plane\n#ifdef CLIPPLANE\n\tfClipDistance = dot(worldPos, vClipPlane);\n#endif\n\n\t// Vertex color\n#ifdef VERTEXCOLOR\n\tvColor = color;\n#endif\n}";
BABYLON.Effect.ShadersStore['legacypbrPixelShader'] = "precision mediump float;\n\n// Constants\n#define RECIPROCAL_PI2 0.15915494\n#define FRESNEL_MAXIMUM_ON_ROUGH 0.25\n\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\nuniform vec4 vAlbedoColor;\nuniform vec3 vReflectionColor;\n\n// CUSTOM CONTROLS\nuniform vec4 vLightingIntensity;\nuniform vec4 vCameraInfos;\n\n#ifdef OVERLOADEDVALUES\nuniform vec4 vOverloadedIntensity;\nuniform vec3 vOverloadedAmbient;\nuniform vec3 vOverloadedAlbedo;\nuniform vec3 vOverloadedReflectivity;\nuniform vec3 vOverloadedEmissive;\nuniform vec3 vOverloadedReflection;\nuniform vec3 vOverloadedMicroSurface;\n#endif\n\n#ifdef OVERLOADEDSHADOWVALUES\nuniform vec4 vOverloadedShadowIntensity;\n#endif\n\n// PBR CUSTOM CONSTANTS\nconst float kPi = 3.1415926535897932384626433832795;\n\n// PBR HELPER METHODS\nfloat Square(float value)\n{\n    return value * value;\n}\n\nfloat getLuminance(vec3 color)\n{\n    return clamp(dot(color, vec3(0.2126, 0.7152, 0.0722)), 0., 1.);\n}\n\nfloat convertRoughnessToAverageSlope(float roughness)\n{\n    // Calculate AlphaG as square of roughness; add epsilon to avoid numerical issues\n    const float kMinimumVariance = 0.0005;\n    float alphaG = Square(roughness) + kMinimumVariance;\n    return alphaG;\n}\n\n// From Microfacet Models for Refraction through Rough Surfaces, Walter et al. 2007\nfloat smithVisibilityG1_TrowbridgeReitzGGX(float dot, float alphaG)\n{\n    float tanSquared = (1.0 - dot * dot) / (dot * dot);\n    return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));\n}\n\nfloat smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL, float NdotV, float alphaG)\n{\n    return smithVisibilityG1_TrowbridgeReitzGGX(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGX(NdotV, alphaG);\n}\n\n// Trowbridge-Reitz (GGX)\n// Generalised Trowbridge-Reitz with gamma power=2.0\nfloat normalDistributionFunction_TrowbridgeReitzGGX(float NdotH, float alphaG)\n{\n    // Note: alphaG is average slope (gradient) of the normals in slope-space.\n    // It is also the (trigonometric) tangent of the median distribution value, i.e. 50% of normals have\n    // a tangent (gradient) closer to the macrosurface than this slope.\n    float a2 = Square(alphaG);\n    float d = NdotH * NdotH * (a2 - 1.0) + 1.0;\n    return a2 / (kPi * d * d);\n}\n\nvec3 fresnelSchlickGGX(float VdotH, vec3 reflectance0, vec3 reflectance90)\n{\n    return reflectance0 + (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotH, 0., 1.), 5.0);\n}\n\nvec3 FresnelSchlickEnvironmentGGX(float VdotN, vec3 reflectance0, vec3 reflectance90, float smoothness)\n{\n    // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle\n    float weight = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);\n    return reflectance0 + weight * (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotN, 0., 1.), 5.0);\n}\n\n// Cook Torance Specular computation.\nvec3 computeSpecularTerm(float NdotH, float NdotL, float NdotV, float VdotH, float roughness, vec3 specularColor)\n{\n    float alphaG = convertRoughnessToAverageSlope(roughness);\n    float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);\n    float visibility = smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL, NdotV, alphaG);\n    visibility /= (4.0 * NdotL * NdotV); // Cook Torance Denominator  integated in viibility to avoid issues when visibility function changes.\n\n    vec3 fresnel = fresnelSchlickGGX(VdotH, specularColor, vec3(1., 1., 1.));\n\n    float specTerm = max(0., visibility * distribution) * NdotL;\n    return fresnel * specTerm;\n}\n\nfloat computeDiffuseTerm(float NdotL, float NdotV, float VdotH, float roughness)\n{\n    // Diffuse fresnel falloff as per Disney principled BRDF, and in the spirit of\n    // of general coupled diffuse/specular models e.g. Ashikhmin Shirley.\n    float diffuseFresnelNV = pow(clamp(1.0 - NdotL, 0.000001, 1.), 5.0);\n    float diffuseFresnelNL = pow(clamp(1.0 - NdotV, 0.000001, 1.), 5.0);\n    float diffuseFresnel90 = 0.5 + 2.0 * VdotH * VdotH * roughness;\n    float diffuseFresnelTerm =\n        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNL) *\n        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNV);\n\n    return diffuseFresnelTerm * NdotL;\n}\n\nfloat computeDefaultMicroSurface(float microSurface, vec3 reflectivityColor)\n{\n    if (microSurface == 0.)\n    {\n        float kReflectivityNoAlphaWorkflow_SmoothnessMax = 0.95;\n\n        float reflectivityLuminance = getLuminance(reflectivityColor);\n        float reflectivityLuma = sqrt(reflectivityLuminance);\n        microSurface = reflectivityLuma * kReflectivityNoAlphaWorkflow_SmoothnessMax;\n    }\n    return microSurface;\n}\n\nvec3 toLinearSpace(vec3 color)\n{\n    return vec3(pow(color.r, 2.2), pow(color.g, 2.2), pow(color.b, 2.2));\n}\n\nvec3 toGammaSpace(vec3 color)\n{\n    return vec3(pow(color.r, 1.0 / 2.2), pow(color.g, 1.0 / 2.2), pow(color.b, 1.0 / 2.2));\n}\n\n#ifdef CAMERATONEMAP\n    vec3 toneMaps(vec3 color)\n    {\n        color = max(color, 0.0);\n\n        // TONE MAPPING / EXPOSURE\n        color.rgb = color.rgb * vCameraInfos.x;\n\n        float tuning = 1.5; // TODO: sync up so e.g. 18% greys are matched to exposure appropriately\n        vec3 tonemapped = 1.0 - exp2(-color.rgb * tuning); // simple local photographic tonemapper\n        color.rgb = mix(color.rgb, tonemapped, 1.0);\n        return color;\n    }\n#endif\n\n#ifdef CAMERACONTRAST\n    vec4 contrasts(vec4 color)\n    {\n        color = clamp(color, 0.0, 1.0);\n\n        vec3 resultHighContrast = color.rgb * color.rgb * (3.0 - 2.0 * color.rgb);\n        float contrast = vCameraInfos.y;\n        if (contrast < 1.0)\n        {\n            // Decrease contrast: interpolate towards zero-contrast image (flat grey)\n            color.rgb = mix(vec3(0.5, 0.5, 0.5), color.rgb, contrast);\n        }\n        else\n        {\n            // Increase contrast: apply simple shoulder-toe high contrast curve\n            color.rgb = mix(color.rgb, resultHighContrast, contrast - 1.0);\n        }\n\n        return color;\n    }\n#endif\n// END PBR HELPER METHODS\n\nuniform vec4 vReflectivityColor;\nuniform vec3 vEmissiveColor;\n\n// Input\nvarying vec3 vPositionW;\n\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n// Lights\n#ifdef LIGHT0\nuniform vec4 vLightData0;\nuniform vec4 vLightDiffuse0;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular0;\n#endif\n#ifdef SHADOW0\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\nvarying vec4 vPositionFromLight0;\nuniform sampler2D shadowSampler0;\n#else\nuniform samplerCube shadowSampler0;\n#endif\nuniform vec3 shadowsInfo0;\n#endif\n#ifdef SPOTLIGHT0\nuniform vec4 vLightDirection0;\n#endif\n#ifdef HEMILIGHT0\nuniform vec3 vLightGround0;\n#endif\n#endif\n\n#ifdef LIGHT1\nuniform vec4 vLightData1;\nuniform vec4 vLightDiffuse1;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular1;\n#endif\n#ifdef SHADOW1\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\nvarying vec4 vPositionFromLight1;\nuniform sampler2D shadowSampler1;\n#else\nuniform samplerCube shadowSampler1;\n#endif\nuniform vec3 shadowsInfo1;\n#endif\n#ifdef SPOTLIGHT1\nuniform vec4 vLightDirection1;\n#endif\n#ifdef HEMILIGHT1\nuniform vec3 vLightGround1;\n#endif\n#endif\n\n#ifdef LIGHT2\nuniform vec4 vLightData2;\nuniform vec4 vLightDiffuse2;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular2;\n#endif\n#ifdef SHADOW2\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\nvarying vec4 vPositionFromLight2;\nuniform sampler2D shadowSampler2;\n#else\nuniform samplerCube shadowSampler2;\n#endif\nuniform vec3 shadowsInfo2;\n#endif\n#ifdef SPOTLIGHT2\nuniform vec4 vLightDirection2;\n#endif\n#ifdef HEMILIGHT2\nuniform vec3 vLightGround2;\n#endif\n#endif\n\n#ifdef LIGHT3\nuniform vec4 vLightData3;\nuniform vec4 vLightDiffuse3;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular3;\n#endif\n#ifdef SHADOW3\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\nvarying vec4 vPositionFromLight3;\nuniform sampler2D shadowSampler3;\n#else\nuniform samplerCube shadowSampler3;\n#endif\nuniform vec3 shadowsInfo3;\n#endif\n#ifdef SPOTLIGHT3\nuniform vec4 vLightDirection3;\n#endif\n#ifdef HEMILIGHT3\nuniform vec3 vLightGround3;\n#endif\n#endif\n\n// Samplers\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform sampler2D albedoSampler;\nuniform vec2 vAlbedoInfos;\n#endif\n\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform sampler2D ambientSampler;\nuniform vec2 vAmbientInfos;\n#endif\n\n#ifdef OPACITY\t\nvarying vec2 vOpacityUV;\nuniform sampler2D opacitySampler;\nuniform vec2 vOpacityInfos;\n#endif\n\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform vec2 vEmissiveInfos;\nuniform sampler2D emissiveSampler;\n#endif\n\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\nuniform vec2 vLightmapInfos;\nuniform sampler2D lightmapSampler;\n#endif\n\n#if defined(REFLECTIVITY)\nvarying vec2 vReflectivityUV;\nuniform vec2 vReflectivityInfos;\nuniform sampler2D reflectivitySampler;\n#endif\n\n#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif\n\n// Light Computing\nstruct lightingInfo\n{\n    vec3 diffuse;\n#ifdef SPECULARTERM\n    vec3 specular;\n#endif\n};\n\nlightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV) {\n    lightingInfo result;\n\n    vec3 lightVectorW;\n    float attenuation = 1.0;\n    if (lightData.w == 0.)\n    {\n        vec3 direction = lightData.xyz - vPositionW;\n\n        attenuation = max(0., 1.0 - length(direction) / range);\n        lightVectorW = normalize(direction);\n    }\n    else\n    {\n        lightVectorW = normalize(-lightData.xyz);\n    }\n\n    // diffuse\n    vec3 H = normalize(viewDirectionW + lightVectorW);\n    float NdotL = max(0.00000000001, dot(vNormal, lightVectorW));\n    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));\n\n    float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);\n    result.diffuse = diffuseTerm * diffuseColor * attenuation;\n\n#ifdef SPECULARTERM\n    // Specular\n    float NdotH = max(0.00000000001, dot(vNormal, H));\n\n    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\n    result.specular = specTerm * specularColor * attenuation;\n#endif\n\n    return result;\n}\n\nlightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV) {\n    lightingInfo result;\n\n    vec3 direction = lightData.xyz - vPositionW;\n    vec3 lightVectorW = normalize(direction);\n    float attenuation = max(0., 1.0 - length(direction) / range);\n\n    // diffuse\n    float cosAngle = max(0.0000001, dot(-lightDirection.xyz, lightVectorW));\n    float spotAtten = 0.0;\n\n    if (cosAngle >= lightDirection.w)\n    {\n        cosAngle = max(0., pow(cosAngle, lightData.w));\n        spotAtten = clamp((cosAngle - lightDirection.w) / (1. - cosAngle), 0.0, 1.0);\n\n        // Diffuse\n        vec3 H = normalize(viewDirectionW - lightDirection.xyz);\n        float NdotL = max(0.00000000001, dot(vNormal, -lightDirection.xyz));\n        float VdotH = clamp(dot(viewDirectionW, H), 0.00000000001, 1.0);\n\n        float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);\n        result.diffuse = diffuseTerm * diffuseColor * attenuation * spotAtten;\n\n#ifdef SPECULARTERM\n        // Specular\n        float NdotH = max(0.00000000001, dot(vNormal, H));\n\n        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\n        result.specular = specTerm * specularColor * attenuation * spotAtten;\n#endif\n\n        return result;\n    }\n\n    result.diffuse = vec3(0.);\n#ifdef SPECULARTERM\n    result.specular = vec3(0.);\n#endif\n\n    return result;\n}\n\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float roughness, float NdotV) {\n    lightingInfo result;\n\n    vec3 lightVectorW = normalize(lightData.xyz);\n\n    // Diffuse\n    float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;\n    result.diffuse = mix(groundColor, diffuseColor, ndl);\n\n#ifdef SPECULARTERM\n    // Specular\n    vec3 H = normalize(viewDirectionW + lightVectorW);\n    float NdotH = max(0.00000000001, dot(vNormal, H));\n    float NdotL = max(0.00000000001, ndl);\n    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));\n\n    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\n    result.specular = specTerm * specularColor;\n#endif\n\n    return result;\n}\n\nvoid main(void) {\n    // Clip plane\n#ifdef CLIPPLANE\n    if (fClipDistance > 0.0)\n        discard;\n#endif\n\n    vec3 viewDirectionW = normalize(vEyePosition - vPositionW);\n\n    // Base color\n    vec4 baseColor = vec4(1., 1., 1., 1.);\n    vec3 diffuseColor = vAlbedoColor.rgb;\n    \n    // Alpha\n    float alpha = vAlbedoColor.a;\n\n#ifdef ALBEDO\n    baseColor = texture2D(diffuseSampler, vAlbedoUV);\n    baseColor = vec4(toLinearSpace(baseColor.rgb), baseColor.a);\n\n#ifdef ALPHATEST\n    if (baseColor.a < 0.4)\n        discard;\n#endif\n\n#ifdef ALPHAFROMALBEDO\n    alpha *= baseColor.a;\n#endif\n\n    baseColor.rgb *= vAlbedoInfos.y;\n#endif\n\n#ifdef VERTEXCOLOR\n    baseColor.rgb *= vColor.rgb;\n#endif\n\n#ifdef OVERLOADEDVALUES\n    baseColor.rgb = mix(baseColor.rgb, vOverloadedAlbedo, vOverloadedIntensity.y);\n    albedoColor.rgb = mix(albedoColor.rgb, vOverloadedAlbedo, vOverloadedIntensity.y);\n#endif\n\n    // Bump\n#ifdef NORMAL\n    vec3 normalW = normalize(vNormalW);\n#else\n    vec3 normalW = vec3(1.0, 1.0, 1.0);\n#endif\n\n    // Ambient color\n    vec3 baseAmbientColor = vec3(1., 1., 1.);\n\n#ifdef AMBIENT\n    baseAmbientColor = texture2D(ambientSampler, vAmbientUV).rgb * vAmbientInfos.y;\n    #ifdef OVERLOADEDVALUES\n        baseAmbientColor.rgb = mix(baseAmbientColor.rgb, vOverloadedAmbient, vOverloadedIntensity.x);\n    #endif\n#endif\n\n    // Reflectivity map\n    float microSurface = vReflectivityColor.a;\n    vec3 reflectivityColor = vReflectivityColor.rgb;\n\n    #ifdef OVERLOADEDVALUES\n        reflectivityColor.rgb = mix(reflectivityColor.rgb, vOverloadedReflectivity, vOverloadedIntensity.z);\n    #endif\n\n    #ifdef REFLECTIVITY\n            vec4 reflectivityMapColor = texture2D(reflectivitySampler, vReflectivityUV);\n            reflectivityColor = toLinearSpace(reflectivityMapColor.rgb);\n\n        #ifdef OVERLOADEDVALUES\n                reflectivityColor.rgb = mix(reflectivityColor.rgb, vOverloadedReflectivity, vOverloadedIntensity.z);\n        #endif\n\n        #ifdef MICROSURFACEFROMREFLECTIVITYMAP\n            microSurface = reflectivityMapColor.a;\n        #else\n            microSurface = computeDefaultMicroSurface(microSurface, reflectivityColor);\n        #endif\n    #endif\n\n    #ifdef OVERLOADEDVALUES\n        microSurface = mix(microSurface, vOverloadedMicroSurface.x, vOverloadedMicroSurface.y);\n    #endif\n\n    // Apply Energy Conservation taking in account the environment level only if the environment is present.\n    float reflectance = max(max(reflectivityColor.r, reflectivityColor.g), reflectivityColor.b);\n    baseColor.rgb = (1. - reflectance) * baseColor.rgb;\n\n    // Compute Specular Fresnel + Reflectance.\n    float NdotV = max(0.00000000001, dot(normalW, viewDirectionW));\n\n    // Adapt microSurface.\n    microSurface = clamp(microSurface, 0., 1.) * 0.98;\n\n    // Call rough to not conflict with previous one.\n    float rough = clamp(1. - microSurface, 0.000001, 1.0);\n\n    // Lighting\n    vec3 diffuseBase = vec3(0., 0., 0.);\n\n#ifdef OVERLOADEDSHADOWVALUES\n    vec3 shadowedOnlyDiffuseBase = vec3(1., 1., 1.);\n#endif\n\n#ifdef SPECULARTERM\n    vec3 specularBase = vec3(0., 0., 0.);\n#endif\n    float shadow = 1.;\n\n#ifdef LIGHT0\n#ifndef SPECULARTERM\n    vec3 vLightSpecular0 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT0\n    lightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, rough, NdotV);\n#endif\n#ifdef HEMILIGHT0\n    lightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightGround0, rough, NdotV);\n#endif\n#if defined(POINTLIGHT0) || defined(DIRLIGHT0)\n    lightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, rough, NdotV);\n#endif\n\n    shadow = 1.;\n    diffuseBase += info.diffuse * shadow;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyDiffuseBase *= shadow;\n#endif\n\n#ifdef SPECULARTERM\n    specularBase += info.specular * shadow;\n#endif\n#endif\n\n#ifdef LIGHT1\n#ifndef SPECULARTERM\n    vec3 vLightSpecular1 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT1\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, rough, NdotV);\n#endif\n#ifdef HEMILIGHT1\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightGround1, rough, NdotV);\n#endif\n#if defined(POINTLIGHT1) || defined(DIRLIGHT1)\n    info = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, rough, NdotV);\n#endif\n\n    shadow = 1.;\n    diffuseBase += info.diffuse * shadow;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyDiffuseBase *= shadow;\n#endif\n\n#ifdef SPECULARTERM\n    specularBase += info.specular * shadow;\n#endif\n#endif\n\n#ifdef LIGHT2\n#ifndef SPECULARTERM\n    vec3 vLightSpecular2 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT2\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, rough, NdotV);\n#endif\n#ifdef HEMILIGHT2\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightGround2, rough, NdotV);\n#endif\n#if defined(POINTLIGHT2) || defined(DIRLIGHT2)\n    info = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, rough, NdotV);\n#endif\n\n    shadow = 1.;\n    diffuseBase += info.diffuse * shadow;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyDiffuseBase *= shadow;\n#endif\n\n#ifdef SPECULARTERM\n    specularBase += info.specular * shadow;\n#endif\n#endif\n\n#ifdef LIGHT3\n#ifndef SPECULARTERM\n    vec3 vLightSpecular3 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT3\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, rough, NdotV);\n#endif\n#ifdef HEMILIGHT3\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightGround3, rough, NdotV);\n#endif\n#if defined(POINTLIGHT3) || defined(DIRLIGHT3)\n    info = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, rough, NdotV);\n#endif\n\n    shadow = 1.;\n    diffuseBase += info.diffuse * shadow;\n#ifdef OVERLOADEDSHADOWVALUES\n    shadowedOnlyDiffuseBase *= shadow;\n#endif\n\n#ifdef SPECULARTERM\n    specularBase += info.specular * shadow;\n#endif\n#endif\n\n// Reflection\nvec3 reflectionColor = vReflectionColor.rgb;\nvec3 ambientReflectionColor = vReflectionColor.rgb;\n\nreflectionColor *= vLightingIntensity.z;\nambientReflectionColor *= vLightingIntensity.z;\n\n// Compute reflection reflectivity fresnel\nvec3 reflectivityEnvironmentR0 = reflectivityColor.rgb;\nvec3 reflectivityEnvironmentR90 = vec3(1.0, 1.0, 1.0);\nvec3 reflectivityEnvironmentReflectanceViewer = FresnelSchlickEnvironmentGGX(clamp(NdotV, 0., 1.), reflectivityEnvironmentR0, reflectivityEnvironmentR90, sqrt(microSurface));\nreflectionColor *= reflectivityEnvironmentReflectanceViewer;\n\n#ifdef OVERLOADEDVALUES\n    ambientReflectionColor = mix(ambientReflectionColor, vOverloadedReflection, vOverloadedMicroSurface.z);\n    reflectionColor = mix(reflectionColor, vOverloadedReflection, vOverloadedMicroSurface.z);\n#endif\n\n#ifdef OPACITY\n    vec4 opacityMap = texture2D(opacitySampler, vOpacityUV);\n\n#ifdef OPACITYRGB\n    opacityMap.rgb = opacityMap.rgb * vec3(0.3, 0.59, 0.11);\n    alpha *= (opacityMap.x + opacityMap.y + opacityMap.z)* vOpacityInfos.y;\n#else\n    alpha *= opacityMap.a * vOpacityInfos.y;\n#endif\n\n#endif\n\n#ifdef VERTEXALPHA\n    alpha *= vColor.a;\n#endif\n\n    // Emissive\n    vec3 emissiveColor = vEmissiveColor;\n#ifdef EMISSIVE\n    vec3 emissiveColorTex = texture2D(emissiveSampler, vEmissiveUV).rgb;\n    emissiveColor = toLinearSpace(emissiveColorTex.rgb) * emissiveColor * vEmissiveInfos.y;\n#endif\n\n#ifdef OVERLOADEDVALUES\n    emissiveColor = mix(emissiveColor, vOverloadedEmissive, vOverloadedIntensity.w);\n#endif\n\n    // Composition\n#ifdef EMISSIVEASILLUMINATION\n    vec3 finalDiffuse = max(diffuseBase * albedoColor + vAmbientColor, 0.0) * baseColor.rgb;\n\n    #ifdef OVERLOADEDSHADOWVALUES\n        shadowedOnlyDiffuseBase = max(shadowedOnlyDiffuseBase * albedoColor + vAmbientColor, 0.0) * baseColor.rgb;\n    #endif\n#else\n    #ifdef LINKEMISSIVEWITHALBEDO\n        vec3 finalDiffuse = max((diffuseBase + emissiveColor) * albedoColor + vAmbientColor, 0.0) * baseColor.rgb;\n        #ifdef OVERLOADEDSHADOWVALUES\n                shadowedOnlyDiffuseBase = max((shadowedOnlyDiffuseBase + emissiveColor) * albedoColor + vAmbientColor, 0.0) * baseColor.rgb;\n        #endif\n    #else\n        vec3 finalDiffuse = max(diffuseBase * albedoColor + emissiveColor + vAmbientColor, 0.0) * baseColor.rgb;\n        #ifdef OVERLOADEDSHADOWVALUES\n            shadowedOnlyDiffuseBase = max(shadowedOnlyDiffuseBase * albedoColor + emissiveColor + vAmbientColor, 0.0) * baseColor.rgb;\n        #endif\n    #endif\n#endif\n\n#ifdef OVERLOADEDSHADOWVALUES\n      finalDiffuse = mix(finalDiffuse, shadowedOnlyDiffuseBase, (1.0 - vOverloadedShadowIntensity.y));\n#endif\n\n// diffuse lighting from environment 0.2 replaces Harmonic...\n// Ambient Reflection already includes the environment intensity.\nfinalDiffuse += baseColor.rgb * ambientReflectionColor * 0.2;\n\n#ifdef SPECULARTERM\n    vec3 finalSpecular = specularBase * reflectivityColor * vLightingIntensity.w;\n#else\n    vec3 finalSpecular = vec3(0.0);\n#endif\n\n#ifdef SPECULAROVERALPHA\n    alpha = clamp(alpha + dot(finalSpecular, vec3(0.3, 0.59, 0.11)), 0., 1.);\n#endif\n\n// Composition\n// Reflection already includes the environment intensity.\n#ifdef EMISSIVEASILLUMINATION\n    vec4 color = vec4(finalDiffuse * baseAmbientColor * vLightingIntensity.x + finalSpecular * vLightingIntensity.x + reflectionColor + emissiveColor * vLightingIntensity.y, alpha);\n#else\n    vec4 color = vec4(finalDiffuse * baseAmbientColor * vLightingIntensity.x + finalSpecular * vLightingIntensity.x + reflectionColor, alpha);\n#endif\n\n    color = max(color, 0.0);\n\n#ifdef CAMERATONEMAP\n    color.rgb = toneMaps(color.rgb);\n#endif\n\n    color.rgb = toGammaSpace(color.rgb);\n\n#ifdef CAMERACONTRAST\n    color = contrasts(color);\n#endif\n\n    gl_FragColor = color;\n}";
