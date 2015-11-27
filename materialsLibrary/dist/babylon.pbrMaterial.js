/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var maxSimultaneousLights = 4;
    var PBRMaterialDefines = (function (_super) {
        __extends(PBRMaterialDefines, _super);
        function PBRMaterialDefines() {
            _super.call(this);
            this.DIFFUSE = false;
            this.AMBIENT = false;
            this.OPACITY = false;
            this.OPACITYRGB = false;
            this.REFLECTION = false;
            this.EMISSIVE = false;
            this.SPECULAR = false;
            this.BUMP = false;
            this.SPECULAROVERALPHA = false;
            this.CLIPPLANE = false;
            this.ALPHATEST = false;
            this.ALPHAFROMDIFFUSE = false;
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
            this.GLOSSINESSFROMSPECULARMAP = false;
            this.EMISSIVEASILLUMINATION = false;
            this.LINKEMISSIVEWITHDIFFUSE = false;
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
            this._lightingInfos = new BABYLON.Vector4(this.directIntensity, this.emissiveIntensity, this.environmentIntensity, 0.0);
            this.overloadedShadowIntensity = 1.0;
            this.overloadedShadeIntensity = 1.0;
            this._overloadedShadowInfos = new BABYLON.Vector4(this.overloadedShadowIntensity, this.overloadedShadeIntensity, 0.0, 0.0);
            this.cameraExposure = 1.0;
            this.cameraContrast = 1.0;
            this._cameraInfos = new BABYLON.Vector4(1.0, 1.0, 0.0, 0.0);
            this.overloadedAmbientIntensity = 0.0;
            this.overloadedDiffuseIntensity = 0.0;
            this.overloadedSpecularIntensity = 0.0;
            this.overloadedEmissiveIntensity = 0.0;
            this._overloadedIntensity = new BABYLON.Vector4(this.overloadedAmbientIntensity, this.overloadedDiffuseIntensity, this.overloadedSpecularIntensity, this.overloadedEmissiveIntensity);
            this.overloadedAmbient = BABYLON.Color3.White();
            this.overloadedDiffuse = BABYLON.Color3.White();
            this.overloadedSpecular = BABYLON.Color3.White();
            this.overloadedEmissive = BABYLON.Color3.White();
            this.overloadedReflection = BABYLON.Color3.White();
            this.overloadedGlossiness = 0.0;
            this.overloadedGlossinessIntensity = 0.0;
            this.overloadedReflectionIntensity = 0.0;
            this._overloadedGlossiness = new BABYLON.Vector3(this.overloadedGlossiness, this.overloadedGlossinessIntensity, this.overloadedReflectionIntensity);
            this.disableBumpMap = false;
            this.ambientColor = new BABYLON.Color3(0, 0, 0);
            this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            this.specularColor = new BABYLON.Color3(1, 1, 1);
            this.reflectionColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            this.glossiness = 0.5;
            this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            this.useAlphaFromDiffuseTexture = false;
            this.useEmissiveAsIllumination = false;
            this.linkEmissiveWithDiffuse = false;
            this.useSpecularOverAlpha = true;
            this.disableLighting = false;
            this.useLightmapAsShadowmap = false;
            this.useGlossinessFromSpecularMapAlpha = false;
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
            return (this.alpha < 1.0) || (this.opacityTexture != null) || this._shouldUseAlphaFromDiffuseTexture() || this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled;
        };
        PBRMaterial.prototype.needAlphaTesting = function () {
            return this.diffuseTexture != null && this.diffuseTexture.hasAlpha;
        };
        PBRMaterial.prototype._shouldUseAlphaFromDiffuseTexture = function () {
            return this.diffuseTexture != null && this.diffuseTexture.hasAlpha && this.useAlphaFromDiffuseTexture;
        };
        PBRMaterial.prototype.getAlphaTestTexture = function () {
            return this.diffuseTexture;
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
                light.diffuse.toLinearSpaceToRef(PBRMaterial._scaledDiffuse);
                PBRMaterial._scaledDiffuse.scaleToRef(light.intensity, PBRMaterial._scaledDiffuse);
                light.diffuse.scaleToRef(light.intensity, PBRMaterial._scaledDiffuse);
                effect.setColor4("vLightDiffuse" + lightIndex, PBRMaterial._scaledDiffuse, light.range);
                if (defines["SPECULARTERM"]) {
                    light.specular.toLinearSpaceToRef(PBRMaterial._scaledSpecular);
                    PBRMaterial._scaledSpecular.scaleToRef(light.intensity, PBRMaterial._scaledSpecular);
                    effect.setColor3("vLightSpecular" + lightIndex, PBRMaterial._scaledSpecular);
                }
                // Shadows
                if (scene.shadowsEnabled) {
                    var shadowGenerator = light.getShadowGenerator();
                    if (mesh.receiveShadows && shadowGenerator) {
                        if (!light.needCube()) {
                            effect.setMatrix("lightMatrix" + lightIndex, shadowGenerator.getTransformMatrix());
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
                if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.diffuseTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.DIFFUSE = true;
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
                if (this.specularTexture && BABYLON.StandardMaterial.SpecularTextureEnabled) {
                    if (!this.specularTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.SPECULAR = true;
                        this._defines.GLOSSINESSFROMSPECULARMAP = this.useGlossinessFromSpecularMapAlpha;
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
            if (this.overloadedGlossinessIntensity > 0 ||
                this.overloadedEmissiveIntensity > 0 ||
                this.overloadedSpecularIntensity > 0 ||
                this.overloadedDiffuseIntensity > 0 ||
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
                if (this._defines.SPECULAR) {
                    fallbacks.addFallback(0, "SPECULAR");
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
                this._effect = scene.getEngine().createEffect(shaderName, attribs, ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor", "vReflectionColor",
                    "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                    "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                    "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                    "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos", "vLightmapInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix", "lightmapMatrix",
                    "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3",
                    "opacityParts", "emissiveLeftColor", "emissiveRightColor",
                    "vLightingIntensity", "vOverloadedShadowIntensity", "vOverloadedIntensity", "vCameraInfos", "vOverloadedDiffuse", "vOverloadedReflection", "vOverloadedSpecular", "vOverloadedEmissive", "vOverloadedGlossiness",
                    "logarithmicDepthConstant"
                ], ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler", "lightmapSampler",
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
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
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
                if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._effect.setTexture("diffuseSampler", this.diffuseTexture);
                    this._effect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                    this._effect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
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
                if (this.specularTexture && BABYLON.StandardMaterial.SpecularTextureEnabled) {
                    this._effect.setTexture("specularSampler", this.specularTexture);
                    this._effect.setFloat2("vSpecularInfos", this.specularTexture.coordinatesIndex, this.specularTexture.level);
                    this._effect.setMatrix("specularMatrix", this.specularTexture.getTextureMatrix());
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
                this.specularColor.toLinearSpaceToRef(PBRMaterial._scaledSpecular);
                this._effect.setVector3("vEyePosition", this._myScene._mirroredCameraPosition ? this._myScene._mirroredCameraPosition : this._myScene.activeCamera.position);
                this._effect.setColor3("vAmbientColor", this._globalAmbientColor);
                if (this._defines.SPECULARTERM) {
                    this._effect.setColor4("vSpecularColor", PBRMaterial._scaledSpecular, this.glossiness);
                }
                // GAMMA CORRECTION.
                this.emissiveColor.toLinearSpaceToRef(PBRMaterial._scaledEmissive);
                this._effect.setColor3("vEmissiveColor", PBRMaterial._scaledEmissive);
                // GAMMA CORRECTION.
                this.reflectionColor.toLinearSpaceToRef(PBRMaterial._scaledReflection);
                this._effect.setColor3("vReflectionColor", PBRMaterial._scaledReflection);
            }
            // GAMMA CORRECTION.
            this.diffuseColor.toLinearSpaceToRef(PBRMaterial._scaledDiffuse);
            this._effect.setColor4("vDiffuseColor", PBRMaterial._scaledDiffuse, this.alpha * mesh.visibility);
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
            this._effect.setVector4("vLightingIntensity", this._lightingInfos);
            this._overloadedShadowInfos.x = this.overloadedShadowIntensity;
            this._overloadedShadowInfos.y = this.overloadedShadeIntensity;
            this._effect.setVector4("vOverloadedShadowIntensity", this._overloadedShadowInfos);
            this._cameraInfos.x = this.cameraExposure;
            this._cameraInfos.y = this.cameraContrast;
            this._effect.setVector4("vCameraInfos", this._cameraInfos);
            this._overloadedIntensity.x = this.overloadedAmbientIntensity;
            this._overloadedIntensity.y = this.overloadedDiffuseIntensity;
            this._overloadedIntensity.z = this.overloadedSpecularIntensity;
            this._overloadedIntensity.w = this.overloadedEmissiveIntensity;
            this._effect.setVector4("vOverloadedIntensity", this._overloadedIntensity);
            this.overloadedAmbient.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedAmbient", this._tempColor);
            this.overloadedDiffuse.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedDiffuse", this._tempColor);
            this.overloadedSpecular.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedSpecular", this._tempColor);
            this.overloadedEmissive.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedEmissive", this._tempColor);
            this.overloadedReflection.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedReflection", this._tempColor);
            this._overloadedGlossiness.x = this.overloadedGlossiness;
            this._overloadedGlossiness.y = this.overloadedGlossinessIntensity;
            this._overloadedGlossiness.z = this.overloadedReflectionIntensity;
            this._effect.setVector3("vOverloadedGlossiness", this._overloadedGlossiness);
            // Log. depth
            if (this._defines.LOGARITHMICDEPTH) {
                this._effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(this._myScene.activeCamera.maxZ + 1.0) / Math.LN2));
            }
            _super.prototype.bind.call(this, world, mesh);
            this._myScene = null;
        };
        PBRMaterial.prototype.getAnimatables = function () {
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
            return results;
        };
        PBRMaterial.prototype.dispose = function (forceDisposeEffect) {
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
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        PBRMaterial.prototype.clone = function (name) {
            var newPBRMaterial = new PBRMaterial(name, this.getScene());
            // Base material
            this.copyTo(newPBRMaterial);
            newPBRMaterial.directIntensity = this.directIntensity;
            newPBRMaterial.emissiveIntensity = this.emissiveIntensity;
            newPBRMaterial.environmentIntensity = this.environmentIntensity;
            newPBRMaterial.cameraExposure = this.cameraExposure;
            newPBRMaterial.cameraContrast = this.cameraContrast;
            newPBRMaterial.overloadedShadowIntensity = this.overloadedShadowIntensity;
            newPBRMaterial.overloadedShadeIntensity = this.overloadedShadeIntensity;
            newPBRMaterial.overloadedAmbientIntensity = this.overloadedAmbientIntensity;
            newPBRMaterial.overloadedDiffuseIntensity = this.overloadedDiffuseIntensity;
            newPBRMaterial.overloadedSpecularIntensity = this.overloadedSpecularIntensity;
            newPBRMaterial.overloadedEmissiveIntensity = this.overloadedEmissiveIntensity;
            newPBRMaterial.overloadedAmbient = this.overloadedAmbient;
            newPBRMaterial.overloadedDiffuse = this.overloadedDiffuse;
            newPBRMaterial.overloadedSpecular = this.overloadedSpecular;
            newPBRMaterial.overloadedEmissive = this.overloadedEmissive;
            newPBRMaterial.overloadedReflection = this.overloadedReflection;
            newPBRMaterial.overloadedGlossiness = this.overloadedGlossiness;
            newPBRMaterial.overloadedGlossinessIntensity = this.overloadedGlossinessIntensity;
            newPBRMaterial.overloadedReflectionIntensity = this.overloadedReflectionIntensity;
            newPBRMaterial.disableBumpMap = this.disableBumpMap;
            // Standard material
            if (this.diffuseTexture && this.diffuseTexture.clone) {
                newPBRMaterial.diffuseTexture = this.diffuseTexture.clone();
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
            if (this.specularTexture && this.specularTexture.clone) {
                newPBRMaterial.specularTexture = this.specularTexture.clone();
            }
            if (this.bumpTexture && this.bumpTexture.clone) {
                newPBRMaterial.bumpTexture = this.bumpTexture.clone();
            }
            if (this.lightmapTexture && this.lightmapTexture.clone) {
                newPBRMaterial.lightmapTexture = this.lightmapTexture.clone();
                newPBRMaterial.useLightmapAsShadowmap = this.useLightmapAsShadowmap;
            }
            newPBRMaterial.ambientColor = this.ambientColor.clone();
            newPBRMaterial.diffuseColor = this.diffuseColor.clone();
            newPBRMaterial.specularColor = this.specularColor.clone();
            newPBRMaterial.reflectionColor = this.reflectionColor.clone();
            newPBRMaterial.glossiness = this.glossiness;
            newPBRMaterial.emissiveColor = this.emissiveColor.clone();
            newPBRMaterial.useAlphaFromDiffuseTexture = this.useAlphaFromDiffuseTexture;
            newPBRMaterial.useEmissiveAsIllumination = this.useEmissiveAsIllumination;
            newPBRMaterial.useGlossinessFromSpecularMapAlpha = this.useGlossinessFromSpecularMapAlpha;
            newPBRMaterial.useSpecularOverAlpha = this.useSpecularOverAlpha;
            newPBRMaterial.emissiveFresnelParameters = this.emissiveFresnelParameters.clone();
            newPBRMaterial.opacityFresnelParameters = this.opacityFresnelParameters.clone();
            return newPBRMaterial;
        };
        PBRMaterial.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.directIntensity = this.directIntensity;
            serializationObject.emissiveIntensity = this.emissiveIntensity;
            serializationObject.environmentIntensity = this.environmentIntensity;
            serializationObject.cameraExposure = this.cameraExposure;
            serializationObject.cameraContrast = this.cameraContrast;
            serializationObject.overloadedShadowIntensity = this.overloadedShadowIntensity;
            serializationObject.overloadedShadeIntensity = this.overloadedShadeIntensity;
            serializationObject.overloadedAmbientIntensity = this.overloadedAmbientIntensity;
            serializationObject.overloadedDiffuseIntensity = this.overloadedDiffuseIntensity;
            serializationObject.overloadedSpecularIntensity = this.overloadedSpecularIntensity;
            serializationObject.overloadedEmissiveIntensity = this.overloadedEmissiveIntensity;
            serializationObject.overloadedAmbient = this.overloadedAmbient.asArray();
            serializationObject.overloadedDiffuse = this.overloadedDiffuse.asArray();
            serializationObject.overloadedSpecular = this.overloadedSpecular.asArray();
            serializationObject.overloadedEmissive = this.overloadedEmissive.asArray();
            serializationObject.overloadedReflection = this.overloadedReflection.asArray();
            serializationObject.overloadedGlossiness = this.overloadedGlossiness;
            serializationObject.overloadedGlossinessIntensity = this.overloadedGlossinessIntensity;
            serializationObject.overloadedReflectionIntensity = this.overloadedReflectionIntensity;
            serializationObject.disableBumpMap = this.disableBumpMap;
            // Standard material
            if (this.diffuseTexture) {
                serializationObject.diffuseTexture = this.diffuseTexture.serialize();
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
            if (this.specularTexture) {
                serializationObject.specularTexture = this.specularTexture.serialize();
            }
            if (this.bumpTexture) {
                serializationObject.bumpTexture = this.bumpTexture.serialize();
            }
            if (this.lightmapTexture) {
                serializationObject.lightmapTexture = this.lightmapTexture.serialize();
                serializationObject.useLightmapAsShadowmap = this.useLightmapAsShadowmap;
            }
            serializationObject.ambientColor = this.ambientColor.asArray();
            serializationObject.diffuseColor = this.diffuseColor.asArray();
            serializationObject.specularColor = this.specularColor.asArray();
            serializationObject.reflectionColor = this.reflectionColor.asArray();
            serializationObject.glossiness = this.glossiness;
            serializationObject.emissiveColor = this.emissiveColor.asArray();
            serializationObject.useAlphaFromDiffuseTexture = this.useAlphaFromDiffuseTexture;
            serializationObject.useEmissiveAsIllumination = this.useEmissiveAsIllumination;
            serializationObject.useGlossinessFromSpecularMapAlpha = this.useGlossinessFromSpecularMapAlpha;
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
            material.cameraExposure = source.cameraExposure;
            material.cameraContrast = source.cameraContrast;
            material.overloadedShadowIntensity = source.overloadedShadowIntensity;
            material.overloadedShadeIntensity = source.overloadedShadeIntensity;
            material.overloadedAmbientIntensity = source.overloadedAmbientIntensity;
            material.overloadedDiffuseIntensity = source.overloadedDiffuseIntensity;
            material.overloadedSpecularIntensity = source.overloadedSpecularIntensity;
            material.overloadedEmissiveIntensity = source.overloadedEmissiveIntensity;
            material.overloadedAmbient = BABYLON.Color3.FromArray(source.overloadedAmbient);
            material.overloadedDiffuse = BABYLON.Color3.FromArray(source.overloadedDiffuse);
            material.overloadedSpecular = BABYLON.Color3.FromArray(source.overloadedSpecular);
            material.overloadedEmissive = BABYLON.Color3.FromArray(source.overloadedEmissive);
            material.overloadedReflection = BABYLON.Color3.FromArray(source.overloadedReflection);
            material.overloadedGlossiness = source.overloadedGlossiness;
            material.overloadedGlossinessIntensity = source.overloadedGlossinessIntensity;
            material.overloadedReflectionIntensity = source.overloadedReflectionIntensity;
            material.disableBumpMap = source.disableBumpMap;
            // Standard material
            if (source.diffuseTexture) {
                material.diffuseTexture = BABYLON.Texture.Parse(source.diffuseTexture, scene, rootUrl);
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
            if (source.specularTexture) {
                material.specularTexture = BABYLON.Texture.Parse(source.specularTexture, scene, rootUrl);
            }
            if (source.bumpTexture) {
                material.bumpTexture = BABYLON.Texture.Parse(source.bumpTexture, scene, rootUrl);
            }
            if (source.lightmapTexture) {
                material.lightmapTexture = BABYLON.Texture.Parse(source.lightmapTexture, scene, rootUrl);
                material.useLightmapAsShadowmap = source.useLightmapAsShadowmap;
            }
            material.ambientColor = BABYLON.Color3.FromArray(source.ambient);
            material.diffuseColor = BABYLON.Color3.FromArray(source.diffuse);
            material.specularColor = BABYLON.Color3.FromArray(source.specular);
            material.reflectionColor = BABYLON.Color3.FromArray(source.reflectionColor);
            material.glossiness = source.glossiness;
            material.emissiveColor = BABYLON.Color3.FromArray(source.emissive);
            material.useAlphaFromDiffuseTexture = source.useAlphaFromDiffuseTexture;
            material.useEmissiveAsIllumination = source.useEmissiveAsIllumination;
            material.useGlossinessFromSpecularMapAlpha = source.useGlossinessFromSpecularMapAlpha;
            material.useSpecularOverAlpha = source.useSpecularOverAlpha;
            material.emissiveFresnelParameters = BABYLON.FresnelParameters.Parse(source.emissiveFresnelParameters);
            material.opacityFresnelParameters = BABYLON.FresnelParameters.Parse(source.opacityFresnelParameters);
            return material;
        };
        PBRMaterial._scaledDiffuse = new BABYLON.Color3();
        PBRMaterial._scaledSpecular = new BABYLON.Color3();
        PBRMaterial._scaledEmissive = new BABYLON.Color3();
        PBRMaterial._scaledReflection = new BABYLON.Color3();
        return PBRMaterial;
    })(BABYLON.Material);
    BABYLON.PBRMaterial = PBRMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['pbrVertexShader'] = "precision highp float;\r\n\r\n// Attributes\r\nattribute vec3 position;\r\n#ifdef NORMAL\r\nattribute vec3 normal;\r\n#endif\r\n#ifdef UV1\r\nattribute vec2 uv;\r\n#endif\r\n#ifdef UV2\r\nattribute vec2 uv2;\r\n#endif\r\n#ifdef VERTEXCOLOR\r\nattribute vec4 color;\r\n#endif\r\n#if NUM_BONE_INFLUENCERS > 0\r\nuniform mat4 mBones[BonesPerMesh];\r\n\r\nattribute vec4 matricesIndices;\r\nattribute vec4 matricesWeights;\r\n#if NUM_BONE_INFLUENCERS > 4\r\nattribute vec4 matricesIndicesExtra;\r\nattribute vec4 matricesWeightsExtra;\r\n#endif\r\n#endif\r\n\r\n// Uniforms\r\n\r\n#ifdef INSTANCES\r\nattribute vec4 world0;\r\nattribute vec4 world1;\r\nattribute vec4 world2;\r\nattribute vec4 world3;\r\n#else\r\nuniform mat4 world;\r\n#endif\r\n\r\nuniform mat4 view;\r\nuniform mat4 viewProjection;\r\n\r\n#ifdef DIFFUSE\r\nvarying vec2 vDiffuseUV;\r\nuniform mat4 diffuseMatrix;\r\nuniform vec2 vDiffuseInfos;\r\n#endif\r\n\r\n#ifdef AMBIENT\r\nvarying vec2 vAmbientUV;\r\nuniform mat4 ambientMatrix;\r\nuniform vec2 vAmbientInfos;\r\n#endif\r\n\r\n#ifdef OPACITY\r\nvarying vec2 vOpacityUV;\r\nuniform mat4 opacityMatrix;\r\nuniform vec2 vOpacityInfos;\r\n#endif\r\n\r\n#ifdef EMISSIVE\r\nvarying vec2 vEmissiveUV;\r\nuniform vec2 vEmissiveInfos;\r\nuniform mat4 emissiveMatrix;\r\n#endif\r\n\r\n#ifdef LIGHTMAP\r\nvarying vec2 vLightmapUV;\r\nuniform vec2 vLightmapInfos;\r\nuniform mat4 lightmapMatrix;\r\n#endif\r\n\r\n#if defined(SPECULAR) && defined(SPECULARTERM)\r\nvarying vec2 vSpecularUV;\r\nuniform vec2 vSpecularInfos;\r\nuniform mat4 specularMatrix;\r\n#endif\r\n\r\n#ifdef BUMP\r\nvarying vec2 vBumpUV;\r\nuniform vec2 vBumpInfos;\r\nuniform mat4 bumpMatrix;\r\n#endif\r\n\r\n#ifdef POINTSIZE\r\nuniform float pointSize;\r\n#endif\r\n\r\n// Output\r\nvarying vec3 vPositionW;\r\n#ifdef NORMAL\r\nvarying vec3 vNormalW;\r\n#endif\r\n\r\n#ifdef VERTEXCOLOR\r\nvarying vec4 vColor;\r\n#endif\r\n\r\n#ifdef CLIPPLANE\r\nuniform vec4 vClipPlane;\r\nvarying float fClipDistance;\r\n#endif\r\n\r\n#ifdef FOG\r\nvarying float fFogDistance;\r\n#endif\r\n\r\n#ifdef SHADOWS\r\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\r\nuniform mat4 lightMatrix0;\r\nvarying vec4 vPositionFromLight0;\r\n#endif\r\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\r\nuniform mat4 lightMatrix1;\r\nvarying vec4 vPositionFromLight1;\r\n#endif\r\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\r\nuniform mat4 lightMatrix2;\r\nvarying vec4 vPositionFromLight2;\r\n#endif\r\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\r\nuniform mat4 lightMatrix3;\r\nvarying vec4 vPositionFromLight3;\r\n#endif\r\n#endif\r\n\r\n#ifdef REFLECTIONMAP_SKYBOX\r\nvarying vec3 vPositionUVW;\r\n#endif\r\n\r\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\r\nvarying vec3 vDirectionW;\r\n#endif\r\n\r\n#ifdef LOGARITHMICDEPTH\r\nuniform float logarithmicDepthConstant;\r\nvarying float vFragmentDepth;\r\n#endif\r\n\r\nvoid main(void) {\r\n\r\n#ifdef REFLECTIONMAP_SKYBOX\r\n    vPositionUVW = position;\r\n#endif \r\n\r\n#ifdef INSTANCES\r\n    mat4 finalWorld = mat4(world0, world1, world2, world3);\r\n#else\r\n    mat4 finalWorld = world;\r\n#endif\r\n\r\n#if NUM_BONE_INFLUENCERS > 0\r\n    mat4 influence;\r\n    influence = mBones[int(matricesIndices[0])] * matricesWeights[0];\r\n\r\n#if NUM_BONE_INFLUENCERS > 1\r\n    influence += mBones[int(matricesIndices[1])] * matricesWeights[1];\r\n#endif \r\n#if NUM_BONE_INFLUENCERS > 2\r\n    influence += mBones[int(matricesIndices[2])] * matricesWeights[2];\r\n#endif\t\r\n#if NUM_BONE_INFLUENCERS > 3\r\n    influence += mBones[int(matricesIndices[3])] * matricesWeights[3];\r\n#endif\t\r\n\r\n#if NUM_BONE_INFLUENCERS > 4\r\n    influence += mBones[int(matricesIndicesExtra[0])] * matricesWeightsExtra[0];\r\n#endif\r\n#if NUM_BONE_INFLUENCERS > 5\r\n    influence += mBones[int(matricesIndicesExtra[1])] * matricesWeightsExtra[1];\r\n#endif\t\r\n#if NUM_BONE_INFLUENCERS > 6\r\n    influence += mBones[int(matricesIndicesExtra[2])] * matricesWeightsExtra[2];\r\n#endif\t\r\n#if NUM_BONE_INFLUENCERS > 7\r\n    influence += mBones[int(matricesIndicesExtra[3])] * matricesWeightsExtra[3];\r\n#endif\t\r\n\r\n    finalWorld = finalWorld * influence;\r\n#endif\r\n\r\n    gl_Position = viewProjection * finalWorld * vec4(position, 1.0);\r\n\r\n    vec4 worldPos = finalWorld * vec4(position, 1.0);\r\n    vPositionW = vec3(worldPos);\r\n\r\n#ifdef NORMAL\r\n    vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));\r\n#endif\r\n\r\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\r\n    vDirectionW = normalize(vec3(finalWorld * vec4(position, 0.0)));\r\n#endif\r\n\r\n    // Texture coordinates\r\n#ifndef UV1\r\n    vec2 uv = vec2(0., 0.);\r\n#endif\r\n#ifndef UV2\r\n    vec2 uv2 = vec2(0., 0.);\r\n#endif\r\n\r\n#ifdef DIFFUSE\r\n    if (vDiffuseInfos.x == 0.)\r\n    {\r\n        vDiffuseUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));\r\n    }\r\n    else\r\n    {\r\n        vDiffuseUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));\r\n    }\r\n#endif\r\n\r\n#ifdef AMBIENT\r\n    if (vAmbientInfos.x == 0.)\r\n    {\r\n        vAmbientUV = vec2(ambientMatrix * vec4(uv, 1.0, 0.0));\r\n    }\r\n    else\r\n    {\r\n        vAmbientUV = vec2(ambientMatrix * vec4(uv2, 1.0, 0.0));\r\n    }\r\n#endif\r\n\r\n#ifdef OPACITY\r\n    if (vOpacityInfos.x == 0.)\r\n    {\r\n        vOpacityUV = vec2(opacityMatrix * vec4(uv, 1.0, 0.0));\r\n    }\r\n    else\r\n    {\r\n        vOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));\r\n    }\r\n#endif\r\n\r\n#ifdef EMISSIVE\r\n    if (vEmissiveInfos.x == 0.)\r\n    {\r\n        vEmissiveUV = vec2(emissiveMatrix * vec4(uv, 1.0, 0.0));\r\n    }\r\n    else\r\n    {\r\n        vEmissiveUV = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));\r\n    }\r\n#endif\r\n\r\n#ifdef LIGHTMAP\r\n    if (vLightmapInfos.x == 0.)\r\n    {\r\n        vLightmapUV = vec2(lightmapMatrix * vec4(uv, 1.0, 0.0));\r\n    }\r\n    else\r\n    {\r\n        vLightmapUV = vec2(lightmapMatrix * vec4(uv2, 1.0, 0.0));\r\n    }\r\n#endif\r\n\r\n#if defined(SPECULAR) && defined(SPECULARTERM)\r\n    if (vSpecularInfos.x == 0.)\r\n    {\r\n        vSpecularUV = vec2(specularMatrix * vec4(uv, 1.0, 0.0));\r\n    }\r\n    else\r\n    {\r\n        vSpecularUV = vec2(specularMatrix * vec4(uv2, 1.0, 0.0));\r\n    }\r\n#endif\r\n\r\n#ifdef BUMP\r\n    if (vBumpInfos.x == 0.)\r\n    {\r\n        vBumpUV = vec2(bumpMatrix * vec4(uv, 1.0, 0.0));\r\n    }\r\n    else\r\n    {\r\n        vBumpUV = vec2(bumpMatrix * vec4(uv2, 1.0, 0.0));\r\n    }\r\n#endif\r\n\r\n    // Clip plane\r\n#ifdef CLIPPLANE\r\n    fClipDistance = dot(worldPos, vClipPlane);\r\n#endif\r\n\r\n    // Fog\r\n#ifdef FOG\r\n    fFogDistance = (view * worldPos).z;\r\n#endif\r\n\r\n    // Shadows\r\n#ifdef SHADOWS\r\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\r\n    vPositionFromLight0 = lightMatrix0 * worldPos;\r\n#endif\r\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\r\n    vPositionFromLight1 = lightMatrix1 * worldPos;\r\n#endif\r\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\r\n    vPositionFromLight2 = lightMatrix2 * worldPos;\r\n#endif\r\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\r\n    vPositionFromLight3 = lightMatrix3 * worldPos;\r\n#endif\r\n#endif\r\n\r\n    // Vertex color\r\n#ifdef VERTEXCOLOR\r\n    vColor = color;\r\n#endif\r\n\r\n    // Point size\r\n#ifdef POINTSIZE\r\n    gl_PointSize = pointSize;\r\n#endif\r\n\r\n    // Log. depth\r\n#ifdef LOGARITHMICDEPTH\r\n    vFragmentDepth = 1.0 + gl_Position.w;\r\n    gl_Position.z = log2(max(0.000001, vFragmentDepth)) * logarithmicDepthConstant;\r\n#endif\r\n}";
BABYLON.Effect.ShadersStore['pbrPixelShader'] = "#ifdef BUMP\r\n#extension GL_OES_standard_derivatives : enable\r\n#endif\r\n\r\n#ifdef LOGARITHMICDEPTH\r\n#extension GL_EXT_frag_depth : enable\r\n#endif\r\n\r\nprecision highp float;\r\n\r\n// Constants\r\n#define RECIPROCAL_PI2 0.15915494\r\n#define FRESNEL_MAXIMUM_ON_ROUGH 0.25\r\n\r\nuniform vec3 vEyePosition;\r\nuniform vec3 vAmbientColor;\r\nuniform vec3 vReflectionColor;\r\nuniform vec4 vDiffuseColor;\r\n\r\n// CUSTOM CONTROLS\r\nuniform vec4 vLightingIntensity;\r\nuniform vec4 vCameraInfos;\r\n\r\n#ifdef OVERLOADEDVALUES\r\n    uniform vec4 vOverloadedIntensity;\r\n    uniform vec3 vOverloadedAmbient;\r\n    uniform vec3 vOverloadedDiffuse;\r\n    uniform vec3 vOverloadedSpecular;\r\n    uniform vec3 vOverloadedEmissive;\r\n    uniform vec3 vOverloadedReflection;\r\n    uniform vec3 vOverloadedGlossiness;\r\n#endif\r\n\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    uniform vec4 vOverloadedShadowIntensity;\r\n#endif\r\n\r\n// PBR CUSTOM CONSTANTS\r\nconst float kPi = 3.1415926535897932384626433832795;\r\n\r\n// PBR HELPER METHODS\r\nfloat Square(float value)\r\n{\r\n    return value * value;\r\n}\r\n\r\nfloat getLuminance(vec3 color)\r\n{\r\n    return clamp(dot(color, vec3(0.2126, 0.7152, 0.0722)), 0., 1.);\r\n}\r\n\r\nfloat convertRoughnessToAverageSlope(float roughness)\r\n{\r\n    // Calculate AlphaG as square of roughness; add epsilon to avoid numerical issues\r\n    const float kMinimumVariance = 0.0005;\r\n    float alphaG = Square(roughness) + kMinimumVariance;\r\n    return alphaG;\r\n}\r\n\r\n// From Microfacet Models for Refraction through Rough Surfaces, Walter et al. 2007\r\nfloat smithVisibilityG1_TrowbridgeReitzGGX(float dot, float alphaG)\r\n{\r\n    float tanSquared = (1.0 - dot * dot) / (dot * dot);\r\n    return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));\r\n}\r\n\r\nfloat smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL, float NdotV, float alphaG)\r\n{\r\n    return smithVisibilityG1_TrowbridgeReitzGGX(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGX(NdotV, alphaG);\r\n}\r\n\r\n// Trowbridge-Reitz (GGX)\r\n// Generalised Trowbridge-Reitz with gamma power=2.0\r\nfloat normalDistributionFunction_TrowbridgeReitzGGX(float NdotH, float alphaG)\r\n{\r\n    // Note: alphaG is average slope (gradient) of the normals in slope-space.\r\n    // It is also the (trigonometric) tangent of the median distribution value, i.e. 50% of normals have\r\n    // a tangent (gradient) closer to the macrosurface than this slope.\r\n    float a2 = Square(alphaG);\r\n    float d = NdotH * NdotH * (a2 - 1.0) + 1.0;\r\n    return a2 / (kPi * d * d);\r\n}\r\n\r\nvec3 fresnelSchlickGGX(float VdotH, vec3 reflectance0, vec3 reflectance90)\r\n{\r\n    return reflectance0 + (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotH, 0., 1.), 5.0);\r\n}\r\n\r\nvec3 FresnelSchlickEnvironmentGGX(float VdotN, vec3 reflectance0, vec3 reflectance90, float smoothness)\r\n{\r\n    // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle\r\n    float weight = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);\r\n    return reflectance0 + weight * (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotN, 0., 1.), 5.0);\r\n}\r\n\r\n// Cook Torance Specular computation.\r\nvec3 computeSpecularTerm(float NdotH, float NdotL, float NdotV, float VdotH, float roughness, vec3 specularColor)\r\n{\r\n    float alphaG = convertRoughnessToAverageSlope(roughness);\r\n    float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);\r\n    float visibility = smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL, NdotV, alphaG);\r\n    visibility /= (4.0 * NdotL * NdotV); // Cook Torance Denominator  integated in viibility to avoid issues when visibility function changes.\r\n\r\n    vec3 fresnel = fresnelSchlickGGX(VdotH, specularColor, vec3(1., 1., 1.));\r\n\r\n    float specTerm = max(0., visibility * distribution) * NdotL;\r\n    return fresnel * specTerm * kPi; // TODO: audit pi constants\r\n}\r\n\r\nfloat computeDiffuseTerm(float NdotL, float NdotV, float VdotH, float roughness)\r\n{\r\n    // Diffuse fresnel falloff as per Disney principled BRDF, and in the spirit of\r\n    // of general coupled diffuse/specular models e.g. Ashikhmin Shirley.\r\n    float diffuseFresnelNV = pow(clamp(1.0 - NdotL, 0.000001, 1.), 5.0);\r\n    float diffuseFresnelNL = pow(clamp(1.0 - NdotV, 0.000001, 1.), 5.0);\r\n    float diffuseFresnel90 = 0.5 + 2.0 * VdotH * VdotH * roughness;\r\n    float diffuseFresnelTerm =\r\n        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNL) *\r\n        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNV);\r\n\r\n\r\n    return diffuseFresnelTerm * NdotL;\r\n    // PI Test\r\n    // diffuseFresnelTerm /= kPi;\r\n}\r\n\r\nfloat computeDefaultGlossiness(float glossiness, vec3 specularColor)\r\n{\r\n    float kSpecularNoAlphaWorkflow_SmoothnessMax = 0.95;\r\n\r\n    float specularLuminance = getLuminance(specularColor);\r\n    float specularLuma = sqrt(specularLuminance);\r\n    glossiness = specularLuma * kSpecularNoAlphaWorkflow_SmoothnessMax;\r\n\r\n    return glossiness;\r\n}\r\n\r\nvec3 toLinearSpace(vec3 color)\r\n{\r\n    return vec3(pow(color.r, 2.2), pow(color.g, 2.2), pow(color.b, 2.2));\r\n}\r\n\r\nvec3 toGammaSpace(vec3 color)\r\n{\r\n    return vec3(pow(color.r, 1.0 / 2.2), pow(color.g, 1.0 / 2.2), pow(color.b, 1.0 / 2.2));\r\n}\r\n\r\n#ifdef CAMERATONEMAP\r\n    vec3 toneMaps(vec3 color)\r\n    {\r\n        color = max(color, 0.0);\r\n\r\n        // TONE MAPPING / EXPOSURE\r\n        color.rgb = color.rgb * vCameraInfos.x;\r\n\r\n        float tuning = 1.5; // TODO: sync up so e.g. 18% greys are matched to exposure appropriately\r\n        // PI Test\r\n        // tuning *=  kPi;\r\n        vec3 tonemapped = 1.0 - exp2(-color.rgb * tuning); // simple local photographic tonemapper\r\n        color.rgb = mix(color.rgb, tonemapped, 1.0);\r\n        return color;\r\n    }\r\n#endif\r\n\r\n#ifdef CAMERACONTRAST\r\n    vec4 contrasts(vec4 color)\r\n    {\r\n        color = clamp(color, 0.0, 1.0);\r\n\r\n        vec3 resultHighContrast = color.rgb * color.rgb * (3.0 - 2.0 * color.rgb);\r\n        float contrast = vCameraInfos.y;\r\n        if (contrast < 1.0)\r\n        {\r\n            // Decrease contrast: interpolate towards zero-contrast image (flat grey)\r\n            color.rgb = mix(vec3(0.5, 0.5, 0.5), color.rgb, contrast);\r\n        }\r\n        else\r\n        {\r\n            // Increase contrast: apply simple shoulder-toe high contrast curve\r\n            color.rgb = mix(color.rgb, resultHighContrast, contrast - 1.0);\r\n        }\r\n\r\n        return color;\r\n    }\r\n#endif\r\n// END PBR HELPER METHODS\r\n\r\n#ifdef SPECULARTERM\r\nuniform vec4 vSpecularColor;\r\n#endif\r\nuniform vec3 vEmissiveColor;\r\n\r\n// Input\r\nvarying vec3 vPositionW;\r\n\r\n#ifdef NORMAL\r\nvarying vec3 vNormalW;\r\n#endif\r\n\r\n#ifdef VERTEXCOLOR\r\nvarying vec4 vColor;\r\n#endif\r\n\r\n// Lights\r\n#ifdef LIGHT0\r\nuniform vec4 vLightData0;\r\nuniform vec4 vLightDiffuse0;\r\n#ifdef SPECULARTERM\r\nuniform vec3 vLightSpecular0;\r\n#endif\r\n#ifdef SHADOW0\r\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\r\nvarying vec4 vPositionFromLight0;\r\nuniform sampler2D shadowSampler0;\r\n#else\r\nuniform samplerCube shadowSampler0;\r\n#endif\r\nuniform vec3 shadowsInfo0;\r\n#endif\r\n#ifdef SPOTLIGHT0\r\nuniform vec4 vLightDirection0;\r\n#endif\r\n#ifdef HEMILIGHT0\r\nuniform vec3 vLightGround0;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT1\r\nuniform vec4 vLightData1;\r\nuniform vec4 vLightDiffuse1;\r\n#ifdef SPECULARTERM\r\nuniform vec3 vLightSpecular1;\r\n#endif\r\n#ifdef SHADOW1\r\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\r\nvarying vec4 vPositionFromLight1;\r\nuniform sampler2D shadowSampler1;\r\n#else\r\nuniform samplerCube shadowSampler1;\r\n#endif\r\nuniform vec3 shadowsInfo1;\r\n#endif\r\n#ifdef SPOTLIGHT1\r\nuniform vec4 vLightDirection1;\r\n#endif\r\n#ifdef HEMILIGHT1\r\nuniform vec3 vLightGround1;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT2\r\nuniform vec4 vLightData2;\r\nuniform vec4 vLightDiffuse2;\r\n#ifdef SPECULARTERM\r\nuniform vec3 vLightSpecular2;\r\n#endif\r\n#ifdef SHADOW2\r\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\r\nvarying vec4 vPositionFromLight2;\r\nuniform sampler2D shadowSampler2;\r\n#else\r\nuniform samplerCube shadowSampler2;\r\n#endif\r\nuniform vec3 shadowsInfo2;\r\n#endif\r\n#ifdef SPOTLIGHT2\r\nuniform vec4 vLightDirection2;\r\n#endif\r\n#ifdef HEMILIGHT2\r\nuniform vec3 vLightGround2;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT3\r\nuniform vec4 vLightData3;\r\nuniform vec4 vLightDiffuse3;\r\n#ifdef SPECULARTERM\r\nuniform vec3 vLightSpecular3;\r\n#endif\r\n#ifdef SHADOW3\r\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\r\nvarying vec4 vPositionFromLight3;\r\nuniform sampler2D shadowSampler3;\r\n#else\r\nuniform samplerCube shadowSampler3;\r\n#endif\r\nuniform vec3 shadowsInfo3;\r\n#endif\r\n#ifdef SPOTLIGHT3\r\nuniform vec4 vLightDirection3;\r\n#endif\r\n#ifdef HEMILIGHT3\r\nuniform vec3 vLightGround3;\r\n#endif\r\n#endif\r\n\r\n// Samplers\r\n#ifdef DIFFUSE\r\nvarying vec2 vDiffuseUV;\r\nuniform sampler2D diffuseSampler;\r\nuniform vec2 vDiffuseInfos;\r\n#endif\r\n\r\n#ifdef AMBIENT\r\nvarying vec2 vAmbientUV;\r\nuniform sampler2D ambientSampler;\r\nuniform vec2 vAmbientInfos;\r\n#endif\r\n\r\n#ifdef OPACITY\t\r\nvarying vec2 vOpacityUV;\r\nuniform sampler2D opacitySampler;\r\nuniform vec2 vOpacityInfos;\r\n#endif\r\n\r\n#ifdef EMISSIVE\r\nvarying vec2 vEmissiveUV;\r\nuniform vec2 vEmissiveInfos;\r\nuniform sampler2D emissiveSampler;\r\n#endif\r\n\r\n#ifdef LIGHTMAP\r\nvarying vec2 vLightmapUV;\r\nuniform vec2 vLightmapInfos;\r\nuniform sampler2D lightmapSampler;\r\n#endif\r\n\r\n#if defined(SPECULAR) && defined(SPECULARTERM)\r\nvarying vec2 vSpecularUV;\r\nuniform vec2 vSpecularInfos;\r\nuniform sampler2D specularSampler;\r\n#endif\r\n\r\n// Fresnel\r\n#ifdef FRESNEL\r\nfloat computeFresnelTerm(vec3 viewDirection, vec3 worldNormal, float bias, float power)\r\n{\r\n    float fresnelTerm = pow(bias + abs(dot(viewDirection, worldNormal)), power);\r\n    return clamp(fresnelTerm, 0., 1.);\r\n}\r\n#endif\r\n\r\n#ifdef OPACITYFRESNEL\r\nuniform vec4 opacityParts;\r\n#endif\r\n\r\n#ifdef EMISSIVEFRESNEL\r\nuniform vec4 emissiveLeftColor;\r\nuniform vec4 emissiveRightColor;\r\n#endif\r\n\r\n// Reflection\r\n#ifdef REFLECTION\r\nuniform vec2 vReflectionInfos;\r\n\r\n#ifdef REFLECTIONMAP_3D\r\nuniform samplerCube reflectionCubeSampler;\r\n#else\r\nuniform sampler2D reflection2DSampler;\r\n#endif\r\n\r\n#ifdef REFLECTIONMAP_SKYBOX\r\nvarying vec3 vPositionUVW;\r\n#else\r\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\r\nvarying vec3 vDirectionW;\r\n#endif\r\n\r\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\r\nuniform mat4 reflectionMatrix;\r\n#endif\r\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION)\r\nuniform mat4 view;\r\n#endif\r\n#endif\r\n\r\nvec3 computeReflectionCoords(vec4 worldPos, vec3 worldNormal)\r\n{\r\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\r\n    vec3 direction = normalize(vDirectionW);\r\n\r\n    float t = clamp(direction.y * -0.5 + 0.5, 0., 1.0);\r\n    float s = atan(direction.z, direction.x) * RECIPROCAL_PI2 + 0.5;\r\n\r\n    return vec3(s, t, 0);\r\n#endif\r\n\r\n#ifdef REFLECTIONMAP_SPHERICAL\r\n    vec3 viewDir = normalize(vec3(view * worldPos));\r\n    vec3 viewNormal = normalize(vec3(view * vec4(worldNormal, 0.0)));\r\n\r\n    vec3 r = reflect(viewDir, viewNormal);\r\n    r.z = r.z - 1.0;\r\n\r\n    float m = 2.0 * length(r);\r\n\r\n    return vec3(r.x / m + 0.5, 1.0 - r.y / m - 0.5, 0);\r\n#endif\r\n\r\n#ifdef REFLECTIONMAP_PLANAR\r\n    vec3 viewDir = worldPos.xyz - vEyePosition;\r\n    vec3 coords = normalize(reflect(viewDir, worldNormal));\r\n\r\n    return vec3(reflectionMatrix * vec4(coords, 1));\r\n#endif\r\n\r\n#ifdef REFLECTIONMAP_CUBIC\r\n    vec3 viewDir = worldPos.xyz - vEyePosition;\r\n    vec3 coords = reflect(viewDir, worldNormal);\r\n#ifdef INVERTCUBICMAP\r\n    coords.y = 1.0 - coords.y;\r\n#endif\r\n    return vec3(reflectionMatrix * vec4(coords, 0));\r\n#endif\r\n\r\n#ifdef REFLECTIONMAP_PROJECTION\r\n    return vec3(reflectionMatrix * (view * worldPos));\r\n#endif\r\n\r\n#ifdef REFLECTIONMAP_SKYBOX\r\n    return vPositionUVW;\r\n#endif\r\n\r\n#ifdef REFLECTIONMAP_EXPLICIT\r\n    return vec3(0, 0, 0);\r\n#endif\r\n}\r\n\r\n#endif\r\n\r\n// Shadows\r\n#ifdef SHADOWS\r\n\r\nfloat unpack(vec4 color)\r\n{\r\n    const vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);\r\n    return dot(color, bit_shift);\r\n}\r\n\r\n#if defined(POINTLIGHT0) || defined(POINTLIGHT1) || defined(POINTLIGHT2) || defined(POINTLIGHT3)\r\nfloat computeShadowCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float bias)\r\n{\r\n    vec3 directionToLight = vPositionW - lightPosition;\r\n    float depth = length(directionToLight);\r\n\r\n    depth = clamp(depth, 0., 1.);\r\n\r\n    directionToLight.y = 1.0 - directionToLight.y;\r\n\r\n    float shadow = unpack(textureCube(shadowSampler, directionToLight)) + bias;\r\n\r\n    if (depth > shadow)\r\n    {\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n        return mix(1.0, darkness, vOverloadedShadowIntensity.x);\r\n#else\r\n        return darkness;\r\n#endif\r\n    }\r\n    return 1.0;\r\n}\r\n\r\nfloat computeShadowWithPCFCube(vec3 lightPosition, samplerCube shadowSampler, float mapSize, float bias, float darkness)\r\n{\r\n    vec3 directionToLight = vPositionW - lightPosition;\r\n    float depth = length(directionToLight);\r\n    float diskScale = (1.0 - (1.0 + depth * 3.0)) / mapSize;\r\n\r\n    depth = clamp(depth, 0., 1.);\r\n\r\n    directionToLight.y = 1.0 - directionToLight.y;\r\n\r\n    float visibility = 1.;\r\n\r\n    vec3 poissonDisk[4];\r\n    poissonDisk[0] = vec3(-1.0, 1.0, -1.0);\r\n    poissonDisk[1] = vec3(1.0, -1.0, -1.0);\r\n    poissonDisk[2] = vec3(-1.0, -1.0, -1.0);\r\n    poissonDisk[3] = vec3(1.0, -1.0, 1.0);\r\n\r\n    // Poisson Sampling\r\n    float biasedDepth = depth - bias;\r\n\r\n    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[0] * diskScale)) < biasedDepth) visibility -= 0.25;\r\n    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[1] * diskScale)) < biasedDepth) visibility -= 0.25;\r\n    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[2] * diskScale)) < biasedDepth) visibility -= 0.25;\r\n    if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[3] * diskScale)) < biasedDepth) visibility -= 0.25;\r\n\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    return  min(1.0, mix(1.0, visibility + darkness, vOverloadedShadowIntensity.x));\r\n#else\r\n    return  min(1.0, visibility + darkness);\r\n#endif\r\n}\r\n#endif\r\n\r\n#if defined(SPOTLIGHT0) || defined(SPOTLIGHT1) || defined(SPOTLIGHT2) || defined(SPOTLIGHT3) ||  defined(DIRLIGHT0) || defined(DIRLIGHT1) || defined(DIRLIGHT2) || defined(DIRLIGHT3)\r\nfloat computeShadow(vec4 vPositionFromLight, sampler2D shadowSampler, float darkness, float bias)\r\n{\r\n    vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\r\n    depth = 0.5 * depth + vec3(0.5);\r\n    vec2 uv = depth.xy;\r\n\r\n    if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)\r\n    {\r\n        return 1.0;\r\n    }\r\n\r\n    float shadow = unpack(texture2D(shadowSampler, uv)) + bias;\r\n\r\n    if (depth.z > shadow)\r\n    {\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n        return mix(1.0, darkness, vOverloadedShadowIntensity.x);\r\n#else\r\n        return darkness;\r\n#endif\r\n    }\r\n    return 1.;\r\n}\r\n\r\nfloat computeShadowWithPCF(vec4 vPositionFromLight, sampler2D shadowSampler, float mapSize, float bias, float darkness)\r\n{\r\n    vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\r\n    depth = 0.5 * depth + vec3(0.5);\r\n    vec2 uv = depth.xy;\r\n\r\n    if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)\r\n    {\r\n        return 1.0;\r\n    }\r\n\r\n    float visibility = 1.;\r\n\r\n    vec2 poissonDisk[4];\r\n    poissonDisk[0] = vec2(-0.94201624, -0.39906216);\r\n    poissonDisk[1] = vec2(0.94558609, -0.76890725);\r\n    poissonDisk[2] = vec2(-0.094184101, -0.92938870);\r\n    poissonDisk[3] = vec2(0.34495938, 0.29387760);\r\n\r\n    // Poisson Sampling\r\n    float biasedDepth = depth.z - bias;\r\n\r\n    if (unpack(texture2D(shadowSampler, uv + poissonDisk[0] / mapSize)) < biasedDepth) visibility -= 0.25;\r\n    if (unpack(texture2D(shadowSampler, uv + poissonDisk[1] / mapSize)) < biasedDepth) visibility -= 0.25;\r\n    if (unpack(texture2D(shadowSampler, uv + poissonDisk[2] / mapSize)) < biasedDepth) visibility -= 0.25;\r\n    if (unpack(texture2D(shadowSampler, uv + poissonDisk[3] / mapSize)) < biasedDepth) visibility -= 0.25;\r\n\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    return  min(1.0, mix(1.0, visibility + darkness, vOverloadedShadowIntensity.x));\r\n#else\r\n    return  min(1.0, visibility + darkness);\r\n#endif\r\n}\r\n\r\n// Thanks to http://devmaster.net/\r\nfloat unpackHalf(vec2 color)\r\n{\r\n    return color.x + (color.y / 255.0);\r\n}\r\n\r\nfloat linstep(float low, float high, float v) {\r\n    return clamp((v - low) / (high - low), 0.0, 1.0);\r\n}\r\n\r\nfloat ChebychevInequality(vec2 moments, float compare, float bias)\r\n{\r\n    float p = smoothstep(compare - bias, compare, moments.x);\r\n    float variance = max(moments.y - moments.x * moments.x, 0.02);\r\n    float d = compare - moments.x;\r\n    float p_max = linstep(0.2, 1.0, variance / (variance + d * d));\r\n\r\n    return clamp(max(p, p_max), 0.0, 1.0);\r\n}\r\n\r\nfloat computeShadowWithVSM(vec4 vPositionFromLight, sampler2D shadowSampler, float bias, float darkness)\r\n{\r\n    vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\r\n    depth = 0.5 * depth + vec3(0.5);\r\n    vec2 uv = depth.xy;\r\n\r\n    if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0 || depth.z >= 1.0)\r\n    {\r\n        return 1.0;\r\n    }\r\n\r\n    vec4 texel = texture2D(shadowSampler, uv);\r\n\r\n    vec2 moments = vec2(unpackHalf(texel.xy), unpackHalf(texel.zw));\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    return min(1.0, mix(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness, vOverloadedShadowIntensity.x));\r\n#else\r\n    return min(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness);\r\n#endif\r\n}\r\n#endif\r\n\r\n#endif\r\n\r\n// Bump\r\n#ifdef BUMP\r\nvarying vec2 vBumpUV;\r\nuniform vec2 vBumpInfos;\r\nuniform sampler2D bumpSampler;\r\n\r\n// Thanks to http://www.thetenthplanet.de/archives/1180\r\nmat3 cotangent_frame(vec3 normal, vec3 p, vec2 uv)\r\n{\r\n    // get edge vectors of the pixel triangle\r\n    vec3 dp1 = dFdx(p);\r\n    vec3 dp2 = dFdy(p);\r\n    vec2 duv1 = dFdx(uv);\r\n    vec2 duv2 = dFdy(uv);\r\n\r\n    // solve the linear system\r\n    vec3 dp2perp = cross(dp2, normal);\r\n    vec3 dp1perp = cross(normal, dp1);\r\n    vec3 tangent = dp2perp * duv1.x + dp1perp * duv2.x;\r\n    vec3 binormal = dp2perp * duv1.y + dp1perp * duv2.y;\r\n\r\n    // construct a scale-invariant frame \r\n    float invmax = inversesqrt(max(dot(tangent, tangent), dot(binormal, binormal)));\r\n    return mat3(tangent * invmax, binormal * invmax, normal);\r\n}\r\n\r\nvec3 perturbNormal(vec3 viewDir)\r\n{\r\n    vec3 map = texture2D(bumpSampler, vBumpUV).xyz;\r\n    map = map * 255. / 127. - 128. / 127.;\r\n    mat3 TBN = cotangent_frame(vNormalW * vBumpInfos.y, -viewDir, vBumpUV);\r\n    return normalize(TBN * map);\r\n}\r\n#endif\r\n\r\n#ifdef CLIPPLANE\r\nvarying float fClipDistance;\r\n#endif\r\n\r\n#ifdef LOGARITHMICDEPTH\r\nuniform float logarithmicDepthConstant;\r\nvarying float vFragmentDepth;\r\n#endif\r\n\r\n// Fog\r\n#ifdef FOG\r\n\r\n#define FOGMODE_NONE    0.\r\n#define FOGMODE_EXP     1.\r\n#define FOGMODE_EXP2    2.\r\n#define FOGMODE_LINEAR  3.\r\n#define E 2.71828\r\n\r\nuniform vec4 vFogInfos;\r\nuniform vec3 vFogColor;\r\nvarying float fFogDistance;\r\n\r\nfloat CalcFogFactor()\r\n{\r\n    float fogCoeff = 1.0;\r\n    float fogStart = vFogInfos.y;\r\n    float fogEnd = vFogInfos.z;\r\n    float fogDensity = vFogInfos.w;\r\n\r\n    if (FOGMODE_LINEAR == vFogInfos.x)\r\n    {\r\n        fogCoeff = (fogEnd - fFogDistance) / (fogEnd - fogStart);\r\n    }\r\n    else if (FOGMODE_EXP == vFogInfos.x)\r\n    {\r\n        fogCoeff = 1.0 / pow(E, fFogDistance * fogDensity);\r\n    }\r\n    else if (FOGMODE_EXP2 == vFogInfos.x)\r\n    {\r\n        fogCoeff = 1.0 / pow(E, fFogDistance * fFogDistance * fogDensity * fogDensity);\r\n    }\r\n\r\n    return clamp(fogCoeff, 0.0, 1.0);\r\n}\r\n#endif\r\n\r\n// Light Computing\r\nstruct lightingInfo\r\n{\r\n    vec3 diffuse;\r\n#ifdef SPECULARTERM\r\n    vec3 specular;\r\n#endif\r\n};\r\n\r\nlightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV) {\r\n    lightingInfo result;\r\n\r\n    vec3 lightVectorW;\r\n    float attenuation = 1.0;\r\n    if (lightData.w == 0.)\r\n    {\r\n        vec3 direction = lightData.xyz - vPositionW;\r\n\r\n        attenuation = max(0., 1.0 - length(direction) / range);\r\n        lightVectorW = normalize(direction);\r\n    }\r\n    else\r\n    {\r\n        lightVectorW = normalize(-lightData.xyz);\r\n    }\r\n\r\n    // diffuse\r\n    vec3 H = normalize(viewDirectionW + lightVectorW);\r\n    float NdotL = max(0.00000000001, dot(vNormal, lightVectorW));\r\n    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));\r\n\r\n    float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);\r\n    result.diffuse = diffuseTerm * diffuseColor * attenuation;\r\n\r\n#ifdef SPECULARTERM\r\n    // Specular\r\n    float NdotH = max(0.00000000001, dot(vNormal, H));\r\n\r\n    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\r\n    result.specular = specTerm * attenuation;\r\n#endif\r\n\r\n    return result;\r\n}\r\n\r\nlightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV) {\r\n    lightingInfo result;\r\n\r\n    vec3 direction = lightData.xyz - vPositionW;\r\n    vec3 lightVectorW = normalize(direction);\r\n    float attenuation = max(0., 1.0 - length(direction) / range);\r\n\r\n    // diffuse\r\n    float cosAngle = max(0.0000001, dot(-lightDirection.xyz, lightVectorW));\r\n    float spotAtten = 0.0;\r\n\r\n    if (cosAngle >= lightDirection.w)\r\n    {\r\n        cosAngle = max(0., pow(cosAngle, lightData.w));\r\n        spotAtten = clamp((cosAngle - lightDirection.w) / (1. - cosAngle), 0.0, 1.0);\r\n\r\n        // Diffuse\r\n        vec3 H = normalize(viewDirectionW - lightDirection.xyz);\r\n        float NdotL = max(0.00000000001, dot(vNormal, -lightDirection.xyz));\r\n        float VdotH = clamp(dot(viewDirectionW, H), 0.00000000001, 1.0);\r\n\r\n        float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);\r\n        result.diffuse = diffuseTerm * diffuseColor * attenuation * spotAtten;\r\n\r\n#ifdef SPECULARTERM\r\n        // Specular\r\n        float NdotH = max(0.00000000001, dot(vNormal, H));\r\n\r\n        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\r\n        result.specular = specTerm  * attenuation * spotAtten;\r\n#endif\r\n\r\n        return result;\r\n    }\r\n\r\n    result.diffuse = vec3(0.);\r\n#ifdef SPECULARTERM\r\n    result.specular = vec3(0.);\r\n#endif\r\n\r\n    return result;\r\n}\r\n\r\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float roughness, float NdotV) {\r\n    lightingInfo result;\r\n\r\n    vec3 lightVectorW = normalize(lightData.xyz);\r\n\r\n    // Diffuse\r\n    float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;\r\n    result.diffuse = mix(groundColor, diffuseColor, ndl);\r\n\r\n#ifdef SPECULARTERM\r\n    // Specular\r\n    vec3 H = normalize(viewDirectionW + lightVectorW);\r\n    float NdotH = max(0.00000000001, dot(vNormal, H));\r\n    float NdotL = max(0.00000000001, ndl);\r\n    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));\r\n\r\n    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\r\n    result.specular = specTerm;\r\n#endif\r\n\r\n    return result;\r\n}\r\n\r\nvoid main(void) {\r\n    // Clip plane\r\n#ifdef CLIPPLANE\r\n    if (fClipDistance > 0.0)\r\n        discard;\r\n#endif\r\n\r\n    vec3 viewDirectionW = normalize(vEyePosition - vPositionW);\r\n\r\n    // Base color\r\n    vec4 baseColor = vec4(1., 1., 1., 1.);\r\n    vec3 diffuseColor = vDiffuseColor.rgb;\r\n    \r\n    // Alpha\r\n    float alpha = vDiffuseColor.a;\r\n\r\n#ifdef DIFFUSE\r\n    baseColor = texture2D(diffuseSampler, vDiffuseUV);\r\n    baseColor = vec4(toLinearSpace(baseColor.rgb), baseColor.a);\r\n\r\n#ifdef ALPHATEST\r\n    if (baseColor.a < 0.4)\r\n        discard;\r\n#endif\r\n\r\n#ifdef ALPHAFROMDIFFUSE\r\n    alpha *= baseColor.a;\r\n#endif\r\n\r\n    baseColor.rgb *= vDiffuseInfos.y;\r\n#endif\r\n\r\n#ifdef VERTEXCOLOR\r\n    baseColor.rgb *= vColor.rgb;\r\n#endif\r\n\r\n#ifdef OVERLOADEDVALUES\r\n    baseColor.rgb = mix(baseColor.rgb, vOverloadedDiffuse, vOverloadedIntensity.y);\r\n    diffuseColor.rgb = mix(diffuseColor.rgb, vOverloadedDiffuse, vOverloadedIntensity.y);\r\n#endif\r\n\r\n    // Bump\r\n#ifdef NORMAL\r\n    vec3 normalW = normalize(vNormalW);\r\n#else\r\n    vec3 normalW = vec3(1.0, 1.0, 1.0);\r\n#endif\r\n\r\n\r\n#ifdef BUMP\r\n    normalW = perturbNormal(viewDirectionW);\r\n#endif\r\n\r\n    // Ambient color\r\n    vec3 baseAmbientColor = vec3(1., 1., 1.);\r\n\r\n#ifdef AMBIENT\r\n    baseAmbientColor = texture2D(ambientSampler, vAmbientUV).rgb * vAmbientInfos.y;\r\n    \r\n    #ifdef OVERLOADEDVALUES\r\n        baseAmbientColor.rgb = mix(baseAmbientColor.rgb, vOverloadedAmbient, vOverloadedIntensity.x);\r\n    #endif\r\n#endif\r\n\r\n    // Specular map\r\n#ifdef SPECULARTERM\r\n    float glossiness = vSpecularColor.a;\r\n    vec3 specularColor = vSpecularColor.rgb;\r\n    \r\n    #ifdef OVERLOADEDVALUES\r\n        specularColor.rgb = mix(specularColor.rgb, vOverloadedSpecular, vOverloadedIntensity.z);\r\n    #endif\r\n\r\n    #ifdef SPECULAR\r\n        vec4 specularMapColor = texture2D(specularSampler, vSpecularUV);\r\n        specularColor = toLinearSpace(specularMapColor.rgb);\r\n\r\n        #ifdef OVERLOADEDVALUES\r\n                specularColor.rgb = mix(specularColor.rgb, vOverloadedSpecular, vOverloadedIntensity.z);\r\n        #endif\r\n\r\n        #ifdef GLOSSINESSFROMSPECULARMAP\r\n            glossiness = specularMapColor.a;\r\n        #else\r\n            glossiness = computeDefaultGlossiness(glossiness, specularColor);\r\n        #endif\r\n    #endif\r\n\r\n    #ifdef OVERLOADEDVALUES\r\n        glossiness = mix(glossiness, vOverloadedGlossiness.x, vOverloadedGlossiness.y);\r\n    #endif\r\n#else\r\n    float glossiness = 0.;\r\n    #ifdef OVERLOADEDVALUES\r\n        glossiness = mix(glossiness, vOverloadedGlossiness.x, vOverloadedGlossiness.y);\r\n    #endif\r\n    \r\n    vec3 specularColor = vec3(0., 0., 0);\r\n    #ifdef OVERLOADEDVALUES\r\n        specularColor.rgb = mix(specularColor.rgb, vOverloadedSpecular, vOverloadedIntensity.z);\r\n    #endif\r\n#endif\r\n\r\n    // Apply Energy Conservation taking in account the environment level only if the environment is present.\r\n    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);\r\n    baseColor.rgb = (1. - reflectance) * baseColor.rgb;\r\n\r\n    // Compute Specular Fresnel + Reflectance.\r\n    float NdotV = max(0.00000000001, dot(normalW, viewDirectionW));\r\n\r\n    // Adapt glossiness.\r\n    glossiness = clamp(glossiness, 0., 1.) * 0.98;\r\n\r\n    // Call rough to not conflict with previous one.\r\n    float rough = clamp(1. - glossiness, 0.000001, 1.0);\r\n\r\n    // Lighting\r\n    vec3 diffuseBase = vec3(0., 0., 0.);\r\n    \r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    vec3 shadowedOnlyDiffuseBase = vec3(1., 1., 1.);\r\n#endif\r\n\r\n#ifdef SPECULARTERM\r\n    vec3 specularBase = vec3(0., 0., 0.);\r\n#endif\r\n    float shadow = 1.;\r\n\r\n#ifdef LIGHT0\r\n#ifndef SPECULARTERM\r\n    vec3 vLightSpecular0 = vec3(0.0);\r\n#endif\r\n#ifdef SPOTLIGHT0\r\n    lightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, rough, NdotV);\r\n#endif\r\n#ifdef HEMILIGHT0\r\n    lightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightGround0, rough, NdotV);\r\n#endif\r\n#if defined(POINTLIGHT0) || defined(DIRLIGHT0)\r\n    lightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, rough, NdotV);\r\n#endif\r\n#ifdef SHADOW0\r\n#ifdef SHADOWVSM0\r\n    shadow = computeShadowWithVSM(vPositionFromLight0, shadowSampler0, shadowsInfo0.z, shadowsInfo0.x);\r\n#else\r\n#ifdef SHADOWPCF0\r\n#if defined(POINTLIGHT0)\r\n    shadow = computeShadowWithPCFCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);\r\n#else\r\n    shadow = computeShadowWithPCF(vPositionFromLight0, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);\r\n#endif\r\n#else\r\n#if defined(POINTLIGHT0)\r\n    shadow = computeShadowCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);\r\n#else\r\n    shadow = computeShadow(vPositionFromLight0, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);\r\n#endif\r\n#endif\r\n#endif\r\n#else\r\n    shadow = 1.;\r\n#endif\r\n    diffuseBase += info.diffuse * shadow;\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    shadowedOnlyDiffuseBase *= shadow;\r\n#endif\r\n\r\n#ifdef SPECULARTERM\r\n    specularBase += info.specular * shadow;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT1\r\n#ifndef SPECULARTERM\r\n    vec3 vLightSpecular1 = vec3(0.0);\r\n#endif\r\n#ifdef SPOTLIGHT1\r\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, rough, NdotV);\r\n#endif\r\n#ifdef HEMILIGHT1\r\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightGround1, rough, NdotV);\r\n#endif\r\n#if defined(POINTLIGHT1) || defined(DIRLIGHT1)\r\n    info = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, rough, NdotV);\r\n#endif\r\n#ifdef SHADOW1\r\n#ifdef SHADOWVSM1\r\n    shadow = computeShadowWithVSM(vPositionFromLight1, shadowSampler1, shadowsInfo1.z, shadowsInfo1.x);\r\n#else\r\n#ifdef SHADOWPCF1\r\n#if defined(POINTLIGHT1)\r\n    shadow = computeShadowWithPCFCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);\r\n#else\r\n    shadow = computeShadowWithPCF(vPositionFromLight1, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);\r\n#endif\r\n#else\r\n#if defined(POINTLIGHT1)\r\n    shadow = computeShadowCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);\r\n#else\r\n    shadow = computeShadow(vPositionFromLight1, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);\r\n#endif\r\n#endif\r\n#endif\r\n#else\r\n    shadow = 1.;\r\n#endif\r\n\r\n    diffuseBase += info.diffuse * shadow;\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    shadowedOnlyDiffuseBase *= shadow;\r\n#endif\r\n\r\n#ifdef SPECULARTERM\r\n    specularBase += info.specular * shadow;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT2\r\n#ifndef SPECULARTERM\r\n    vec3 vLightSpecular2 = vec3(0.0);\r\n#endif\r\n#ifdef SPOTLIGHT2\r\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, rough, NdotV);\r\n#endif\r\n#ifdef HEMILIGHT2\r\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightGround2, rough, NdotV);\r\n#endif\r\n#if defined(POINTLIGHT2) || defined(DIRLIGHT2)\r\n    info = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, rough, NdotV);\r\n#endif\r\n#ifdef SHADOW2\r\n#ifdef SHADOWVSM2\r\n    shadow = computeShadowWithVSM(vPositionFromLight2, shadowSampler2, shadowsInfo2.z, shadowsInfo2.x);\r\n#else\r\n#ifdef SHADOWPCF2\r\n#if defined(POINTLIGHT2)\r\n    shadow = computeShadowWithPCFCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);\r\n#else\r\n    shadow = computeShadowWithPCF(vPositionFromLight2, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);\r\n#endif\r\n#else\r\n#if defined(POINTLIGHT2)\r\n    shadow = computeShadowCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);\r\n#else\r\n    shadow = computeShadow(vPositionFromLight2, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);\r\n#endif\r\n#endif\t\r\n#endif\t\r\n#else\r\n    shadow = 1.;\r\n#endif\r\n\r\n    diffuseBase += info.diffuse * shadow;\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    shadowedOnlyDiffuseBase *= shadow;\r\n#endif\r\n\r\n#ifdef SPECULARTERM\r\n    specularBase += info.specular * shadow;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT3\r\n#ifndef SPECULARTERM\r\n    vec3 vLightSpecular3 = vec3(0.0);\r\n#endif\r\n#ifdef SPOTLIGHT3\r\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, rough, NdotV);\r\n#endif\r\n#ifdef HEMILIGHT3\r\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightGround3, rough, NdotV);\r\n#endif\r\n#if defined(POINTLIGHT3) || defined(DIRLIGHT3)\r\n    info = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, rough, NdotV);\r\n#endif\r\n#ifdef SHADOW3\r\n#ifdef SHADOWVSM3\r\n    shadow = computeShadowWithVSM(vPositionFromLight3, shadowSampler3, shadowsInfo3.z, shadowsInfo3.x);\r\n#else\r\n#ifdef SHADOWPCF3\r\n#if defined(POINTLIGHT3)\r\n    shadow = computeShadowWithPCFCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);\r\n#else\r\n    shadow = computeShadowWithPCF(vPositionFromLight3, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);\r\n#endif\r\n#else\r\n#if defined(POINTLIGHT3)\r\n    shadow = computeShadowCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);\r\n#else\r\n    shadow = computeShadow(vPositionFromLight3, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);\r\n#endif\r\n#endif\t\r\n#endif\t\r\n#else\r\n    shadow = 1.;\r\n#endif\r\n\r\n    diffuseBase += info.diffuse * shadow;\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    shadowedOnlyDiffuseBase *= shadow;\r\n#endif\r\n\r\n#ifdef SPECULARTERM\r\n    specularBase += info.specular * shadow;\r\n#endif\r\n#endif\r\n\r\n// Reflection\r\nvec3 reflectionColor = vReflectionColor.rgb;\r\nvec3 ambientReflectionColor = vReflectionColor.rgb;\r\n\r\n#ifdef REFLECTION\r\n    vec3 vReflectionUVW = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);\r\n\r\n    #ifdef REFLECTIONMAP_3D\r\n        float bias = 0.;\r\n\r\n        #ifdef SPECULARTERM\r\n            // Go mat -> blurry reflexion according to glossiness\r\n            bias = 20. * (1.0 - glossiness);\r\n        #endif\r\n\r\n        reflectionColor = textureCube(reflectionCubeSampler, vReflectionUVW, bias).rgb * vReflectionInfos.x;\r\n        reflectionColor = toLinearSpace(reflectionColor.rgb);\r\n\r\n        ambientReflectionColor = textureCube(reflectionCubeSampler, normalW, 20.).rgb * vReflectionInfos.x;\r\n        ambientReflectionColor = toLinearSpace(ambientReflectionColor.rgb);\r\n    #else\r\n        vec2 coords = vReflectionUVW.xy;\r\n\r\n        #ifdef REFLECTIONMAP_PROJECTION\r\n            coords /= vReflectionUVW.z;\r\n        #endif\r\n\r\n        coords.y = 1.0 - coords.y;\r\n\r\n        reflectionColor = texture2D(reflection2DSampler, coords).rgb * vReflectionInfos.x;\r\n        reflectionColor = toLinearSpace(reflectionColor.rgb);\r\n\r\n        ambientReflectionColor = texture2D(reflection2DSampler, coords, 20.).rgb * vReflectionInfos.x;\r\n        ambientReflectionColor = toLinearSpace(ambientReflectionColor.rgb);\r\n    #endif\r\n#endif\r\n\r\n#ifdef OVERLOADEDVALUES\r\n    ambientReflectionColor = mix(ambientReflectionColor, vOverloadedReflection, vOverloadedGlossiness.z);\r\n    reflectionColor = mix(reflectionColor, vOverloadedReflection, vOverloadedGlossiness.z);\r\n#endif\r\n\r\nreflectionColor *= vLightingIntensity.z;\r\nambientReflectionColor *= vLightingIntensity.z;\r\n\r\n// Compute reflection specular fresnel\r\nvec3 specularEnvironmentR0 = specularColor.rgb;\r\nvec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0);\r\nvec3 specularEnvironmentReflectanceViewer = FresnelSchlickEnvironmentGGX(clamp(NdotV, 0., 1.), specularEnvironmentR0, specularEnvironmentR90, sqrt(glossiness));\r\nreflectionColor *= specularEnvironmentReflectanceViewer;\r\n\r\n#ifdef OPACITY\r\n    vec4 opacityMap = texture2D(opacitySampler, vOpacityUV);\r\n\r\n    #ifdef OPACITYRGB\r\n        opacityMap.rgb = opacityMap.rgb * vec3(0.3, 0.59, 0.11);\r\n        alpha *= (opacityMap.x + opacityMap.y + opacityMap.z)* vOpacityInfos.y;\r\n    #else\r\n        alpha *= opacityMap.a * vOpacityInfos.y;\r\n    #endif\r\n\r\n#endif\r\n\r\n#ifdef VERTEXALPHA\r\n    alpha *= vColor.a;\r\n#endif\r\n\r\n#ifdef OPACITYFRESNEL\r\n    float opacityFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, opacityParts.z, opacityParts.w);\r\n\r\n    alpha += opacityParts.x * (1.0 - opacityFresnelTerm) + opacityFresnelTerm * opacityParts.y;\r\n#endif\r\n\r\n    // Emissive\r\n    vec3 emissiveColor = vEmissiveColor;\r\n#ifdef EMISSIVE\r\n    vec3 emissiveColorTex = texture2D(emissiveSampler, vEmissiveUV).rgb;\r\n    emissiveColor = toLinearSpace(emissiveColorTex.rgb) * emissiveColor * vEmissiveInfos.y;\r\n#endif\r\n\r\n#ifdef OVERLOADEDVALUES\r\n    emissiveColor = mix(emissiveColor, vOverloadedEmissive, vOverloadedIntensity.w);\r\n#endif\r\n\r\n#ifdef EMISSIVEFRESNEL\r\n    float emissiveFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, emissiveRightColor.a, emissiveLeftColor.a);\r\n\r\n    emissiveColor *= emissiveLeftColor.rgb * (1.0 - emissiveFresnelTerm) + emissiveFresnelTerm * emissiveRightColor.rgb;\r\n#endif\r\n\r\n    // Composition\r\n#ifdef EMISSIVEASILLUMINATION\r\n    vec3 finalDiffuse = max(diffuseBase * diffuseColor + vAmbientColor, 0.0) * baseColor.rgb;\r\n    \r\n    #ifdef OVERLOADEDSHADOWVALUES\r\n        shadowedOnlyDiffuseBase = max(shadowedOnlyDiffuseBase * diffuseColor + vAmbientColor, 0.0) * baseColor.rgb;\r\n    #endif\r\n#else\r\n    #ifdef LINKEMISSIVEWITHDIFFUSE\r\n        vec3 finalDiffuse = max((diffuseBase + emissiveColor) * diffuseColor + vAmbientColor, 0.0) * baseColor.rgb;\r\n\r\n        #ifdef OVERLOADEDSHADOWVALUES\r\n            shadowedOnlyDiffuseBase = max((shadowedOnlyDiffuseBase + emissiveColor) * diffuseColor + vAmbientColor, 0.0) * baseColor.rgb;\r\n        #endif\r\n    #else\r\n        vec3 finalDiffuse = max(diffuseBase * diffuseColor + emissiveColor + vAmbientColor, 0.0) * baseColor.rgb;\r\n\r\n        #ifdef OVERLOADEDSHADOWVALUES\r\n            shadowedOnlyDiffuseBase = max(shadowedOnlyDiffuseBase * diffuseColor + emissiveColor + vAmbientColor, 0.0) * baseColor.rgb;\r\n        #endif\r\n    #endif\r\n#endif\r\n\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    finalDiffuse = mix(finalDiffuse, shadowedOnlyDiffuseBase, (1.0 - vOverloadedShadowIntensity.y));\r\n#endif\r\n\r\n// diffuse lighting from environment 0.2 replaces Harmonic...\r\n// Ambient Reflection already includes the environment intensity.\r\nfinalDiffuse += baseColor.rgb * ambientReflectionColor * 0.2;\r\n\r\n#ifdef SPECULARTERM\r\n    vec3 finalSpecular = specularBase * specularColor;\r\n#else\r\n    vec3 finalSpecular = vec3(0.0);\r\n#endif\r\n\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    finalSpecular = mix(finalSpecular, vec3(0.0), (1.0 - vOverloadedShadowIntensity.y));\r\n#endif\r\n\r\n#ifdef SPECULAROVERALPHA\r\n    alpha = clamp(alpha + dot(finalSpecular, vec3(0.3, 0.59, 0.11)), 0., 1.);\r\n#endif\r\n\r\n// Composition\r\n// Reflection already includes the environment intensity.\r\n#ifdef EMISSIVEASILLUMINATION\r\n    vec4 color = vec4(finalDiffuse * baseAmbientColor * vLightingIntensity.x + finalSpecular * vLightingIntensity.x + reflectionColor + emissiveColor * vLightingIntensity.y, alpha);\r\n#else\r\n    vec4 color = vec4(finalDiffuse * baseAmbientColor * vLightingIntensity.x + finalSpecular * vLightingIntensity.x + reflectionColor, alpha);\r\n#endif\r\n\r\n#ifdef LIGHTMAP\r\n    vec3 lightmapColor = texture2D(lightmapSampler, vLightmapUV).rgb * vLightmapInfos.y;\r\n\r\n    #ifdef USELIGHTMAPASSHADOWMAP\r\n        color.rgb *= lightmapColor;\r\n    #else\r\n        color.rgb += lightmapColor;\r\n    #endif\r\n#endif\r\n\r\n#ifdef FOG\r\n    float fog = CalcFogFactor();\r\n    color.rgb = fog * color.rgb + (1.0 - fog) * vFogColor;\r\n#endif\r\n\r\n    color = max(color, 0.0);\r\n\r\n#ifdef CAMERATONEMAP\r\n    color.rgb = toneMaps(color.rgb);\r\n#endif\r\n\r\n    color.rgb = toGammaSpace(color.rgb);\r\n\r\n#ifdef CAMERACONTRAST\r\n    color = contrasts(color);\r\n#endif\r\n\r\n    // Normal Display.\r\n    // gl_FragColor = vec4(normalW * 0.5 + 0.5, 1.0);\r\n\r\n    // Ambient reflection color.\r\n    // gl_FragColor = vec4(ambientReflectionColor, 1.0);\r\n\r\n    // Reflection color.\r\n    // gl_FragColor = vec4(reflectionColor, 1.0);\r\n\r\n    // Base color.\r\n    // gl_FragColor = vec4(baseColor.rgb, 1.0);\r\n\r\n    // Specular color.\r\n    // gl_FragColor = vec4(specularColor.rgb, 1.0);\r\n\r\n    // Glossiness color.\r\n    // gl_FragColor = vec4(glossiness, glossiness, glossiness, 1.0);\r\n\r\n    // Specular Map\r\n    // gl_FragColor = vec4(specularMapColor.rgb, 1.0);\r\n\r\n    //// Emissive Color\r\n    //vec2 test = vEmissiveUV * 0.5 + 0.5;\r\n    //gl_FragColor = vec4(test.x, test.y, 1.0, 1.0);\r\n\r\n    gl_FragColor = color;\r\n}";
BABYLON.Effect.ShadersStore['legacypbrVertexShader'] = "precision mediump float;\r\n\r\n// Attributes\r\nattribute vec3 position;\r\nattribute vec3 normal;\r\n#ifdef UV1\r\nattribute vec2 uv;\r\n#endif\r\n#ifdef UV2\r\nattribute vec2 uv2;\r\n#endif\r\n#ifdef VERTEXCOLOR\r\nattribute vec4 color;\r\n#endif\r\n\r\n#if NUM_BONE_INFLUENCERS > 0\r\nuniform mat4 mBones[BonesPerMesh];\r\n\r\nattribute vec4 matricesIndices;\r\nattribute vec4 matricesWeights;\r\n#if NUM_BONE_INFLUENCERS > 4\r\nattribute vec4 matricesIndicesExtra;\r\nattribute vec4 matricesWeightsExtra;\r\n#endif\r\n#endif\r\n\r\n// Uniforms\r\nuniform mat4 world;\r\nuniform mat4 view;\r\nuniform mat4 viewProjection;\r\n\r\n#ifdef DIFFUSE\r\nvarying vec2 vDiffuseUV;\r\nuniform mat4 diffuseMatrix;\r\nuniform vec2 vDiffuseInfos;\r\n#endif\r\n\r\n#ifdef AMBIENT\r\nvarying vec2 vAmbientUV;\r\nuniform mat4 ambientMatrix;\r\nuniform vec2 vAmbientInfos;\r\n#endif\r\n\r\n#ifdef OPACITY\r\nvarying vec2 vOpacityUV;\r\nuniform mat4 opacityMatrix;\r\nuniform vec2 vOpacityInfos;\r\n#endif\r\n\r\n#ifdef EMISSIVE\r\nvarying vec2 vEmissiveUV;\r\nuniform vec2 vEmissiveInfos;\r\nuniform mat4 emissiveMatrix;\r\n#endif\r\n\r\n#if defined(SPECULAR) && defined(SPECULARTERM)\r\nvarying vec2 vSpecularUV;\r\nuniform vec2 vSpecularInfos;\r\nuniform mat4 specularMatrix;\r\n#endif\r\n\r\n// Output\r\nvarying vec3 vPositionW;\r\nvarying vec3 vNormalW;\r\n\r\n#ifdef VERTEXCOLOR\r\nvarying vec4 vColor;\r\n#endif\r\n\r\n#ifdef CLIPPLANE\r\nuniform vec4 vClipPlane;\r\nvarying float fClipDistance;\r\n#endif\r\n\r\nvoid main(void) {\r\n    mat4 finalWorld = world;\r\n\r\n#if NUM_BONE_INFLUENCERS > 0\r\n    mat4 influence;\r\n    influence = mBones[int(matricesIndices[0])] * matricesWeights[0];\r\n\r\n#if NUM_BONE_INFLUENCERS > 1\r\n    influence += mBones[int(matricesIndices[1])] * matricesWeights[1];\r\n#endif \r\n#if NUM_BONE_INFLUENCERS > 2\r\n    influence += mBones[int(matricesIndices[2])] * matricesWeights[2];\r\n#endif\t\r\n#if NUM_BONE_INFLUENCERS > 3\r\n    influence += mBones[int(matricesIndices[3])] * matricesWeights[3];\r\n#endif\t\r\n\r\n#if NUM_BONE_INFLUENCERS > 4\r\n    influence += mBones[int(matricesIndicesExtra[0])] * matricesWeightsExtra[0];\r\n#endif\r\n#if NUM_BONE_INFLUENCERS > 5\r\n    influence += mBones[int(matricesIndicesExtra[1])] * matricesWeightsExtra[1];\r\n#endif\t\r\n#if NUM_BONE_INFLUENCERS > 6\r\n    influence += mBones[int(matricesIndicesExtra[2])] * matricesWeightsExtra[2];\r\n#endif\t\r\n#if NUM_BONE_INFLUENCERS > 7\r\n    influence += mBones[int(matricesIndicesExtra[3])] * matricesWeightsExtra[3];\r\n#endif\t\r\n\r\n    finalWorld = finalWorld * influence;\r\n#endif\r\n\r\n\tgl_Position = viewProjection * finalWorld * vec4(position, 1.0);\r\n\r\n\tvec4 worldPos = finalWorld * vec4(position, 1.0);\r\n\tvPositionW = vec3(worldPos);\r\n\tvNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));\r\n\r\n\t// Texture coordinates\r\n#ifndef UV1\r\n\tvec2 uv = vec2(0., 0.);\r\n#endif\r\n#ifndef UV2\r\n\tvec2 uv2 = vec2(0., 0.);\r\n#endif\r\n\r\n#ifdef DIFFUSE\r\n\tif (vDiffuseInfos.x == 0.)\r\n\t{\r\n\t\tvDiffuseUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));\r\n\t}\r\n\telse\r\n\t{\r\n\t\tvDiffuseUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));\r\n\t}\r\n#endif\r\n\r\n#ifdef AMBIENT\r\n\tif (vAmbientInfos.x == 0.)\r\n\t{\r\n\t\tvAmbientUV = vec2(ambientMatrix * vec4(uv, 1.0, 0.0));\r\n\t}\r\n\telse\r\n\t{\r\n\t\tvAmbientUV = vec2(ambientMatrix * vec4(uv2, 1.0, 0.0));\r\n\t}\r\n#endif\r\n\r\n#ifdef OPACITY\r\n\tif (vOpacityInfos.x == 0.)\r\n\t{\r\n\t\tvOpacityUV = vec2(opacityMatrix * vec4(uv, 1.0, 0.0));\r\n\t}\r\n\telse\r\n\t{\r\n\t\tvOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));\r\n\t}\r\n#endif\r\n\r\n#ifdef EMISSIVE\r\n\tif (vEmissiveInfos.x == 0.)\r\n\t{\r\n\t\tvEmissiveUV = vec2(emissiveMatrix * vec4(uv, 1.0, 0.0));\r\n\t}\r\n\telse\r\n\t{\r\n\t\tvEmissiveUV = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));\r\n\t}\r\n#endif\r\n\r\n#if defined(SPECULAR) && defined(SPECULARTERM)\r\n\tif (vSpecularInfos.x == 0.)\r\n\t{\r\n\t\tvSpecularUV = vec2(specularMatrix * vec4(uv, 1.0, 0.0));\r\n\t}\r\n\telse\r\n\t{\r\n\t\tvSpecularUV = vec2(specularMatrix * vec4(uv2, 1.0, 0.0));\r\n\t}\r\n#endif\r\n\r\n\t// Clip plane\r\n#ifdef CLIPPLANE\r\n\tfClipDistance = dot(worldPos, vClipPlane);\r\n#endif\r\n\r\n\t// Vertex color\r\n#ifdef VERTEXCOLOR\r\n\tvColor = color;\r\n#endif\r\n}";
BABYLON.Effect.ShadersStore['legacypbrPixelShader'] = "precision mediump float;\r\n\r\n// Constants\r\n#define RECIPROCAL_PI2 0.15915494\r\n#define FRESNEL_MAXIMUM_ON_ROUGH 0.25\r\n\r\nuniform vec3 vEyePosition;\r\nuniform vec3 vAmbientColor;\r\nuniform vec4 vDiffuseColor;\r\nuniform vec3 vReflectionColor;\r\n\r\n// CUSTOM CONTROLS\r\nuniform vec4 vLightingIntensity;\r\nuniform vec4 vCameraInfos;\r\n\r\n#ifdef OVERLOADEDVALUES\r\nuniform vec4 vOverloadedIntensity;\r\nuniform vec3 vOverloadedAmbient;\r\nuniform vec3 vOverloadedDiffuse;\r\nuniform vec3 vOverloadedSpecular;\r\nuniform vec3 vOverloadedEmissive;\r\nuniform vec3 vOverloadedReflection;\r\nuniform vec3 vOverloadedGlossiness;\r\n#endif\r\n\r\n#ifdef OVERLOADEDSHADOWVALUES\r\nuniform vec4 vOverloadedShadowIntensity;\r\n#endif\r\n\r\n// PBR CUSTOM CONSTANTS\r\nconst float kPi = 3.1415926535897932384626433832795;\r\n\r\n// PBR HELPER METHODS\r\nfloat Square(float value)\r\n{\r\n    return value * value;\r\n}\r\n\r\nfloat getLuminance(vec3 color)\r\n{\r\n    return clamp(dot(color, vec3(0.2126, 0.7152, 0.0722)), 0., 1.);\r\n}\r\n\r\nfloat convertRoughnessToAverageSlope(float roughness)\r\n{\r\n    // Calculate AlphaG as square of roughness; add epsilon to avoid numerical issues\r\n    const float kMinimumVariance = 0.0005;\r\n    float alphaG = Square(roughness) + kMinimumVariance;\r\n    return alphaG;\r\n}\r\n\r\n// From Microfacet Models for Refraction through Rough Surfaces, Walter et al. 2007\r\nfloat smithVisibilityG1_TrowbridgeReitzGGX(float dot, float alphaG)\r\n{\r\n    float tanSquared = (1.0 - dot * dot) / (dot * dot);\r\n    return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));\r\n}\r\n\r\nfloat smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL, float NdotV, float alphaG)\r\n{\r\n    return smithVisibilityG1_TrowbridgeReitzGGX(NdotL, alphaG) * smithVisibilityG1_TrowbridgeReitzGGX(NdotV, alphaG);\r\n}\r\n\r\n// Trowbridge-Reitz (GGX)\r\n// Generalised Trowbridge-Reitz with gamma power=2.0\r\nfloat normalDistributionFunction_TrowbridgeReitzGGX(float NdotH, float alphaG)\r\n{\r\n    // Note: alphaG is average slope (gradient) of the normals in slope-space.\r\n    // It is also the (trigonometric) tangent of the median distribution value, i.e. 50% of normals have\r\n    // a tangent (gradient) closer to the macrosurface than this slope.\r\n    float a2 = Square(alphaG);\r\n    float d = NdotH * NdotH * (a2 - 1.0) + 1.0;\r\n    return a2 / (kPi * d * d);\r\n}\r\n\r\nvec3 fresnelSchlickGGX(float VdotH, vec3 reflectance0, vec3 reflectance90)\r\n{\r\n    return reflectance0 + (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotH, 0., 1.), 5.0);\r\n}\r\n\r\nvec3 FresnelSchlickEnvironmentGGX(float VdotN, vec3 reflectance0, vec3 reflectance90, float smoothness)\r\n{\r\n    // Schlick fresnel approximation, extended with basic smoothness term so that rough surfaces do not approach reflectance90 at grazing angle\r\n    float weight = mix(FRESNEL_MAXIMUM_ON_ROUGH, 1.0, smoothness);\r\n    return reflectance0 + weight * (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotN, 0., 1.), 5.0);\r\n}\r\n\r\n// Cook Torance Specular computation.\r\nvec3 computeSpecularTerm(float NdotH, float NdotL, float NdotV, float VdotH, float roughness, vec3 specularColor)\r\n{\r\n    float alphaG = convertRoughnessToAverageSlope(roughness);\r\n    float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);\r\n    float visibility = smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL, NdotV, alphaG);\r\n    visibility /= (4.0 * NdotL * NdotV); // Cook Torance Denominator  integated in viibility to avoid issues when visibility function changes.\r\n\r\n    vec3 fresnel = fresnelSchlickGGX(VdotH, specularColor, vec3(1., 1., 1.));\r\n\r\n    float specTerm = max(0., visibility * distribution) * NdotL;\r\n    return fresnel * specTerm;\r\n}\r\n\r\nfloat computeDiffuseTerm(float NdotL, float NdotV, float VdotH, float roughness)\r\n{\r\n    // Diffuse fresnel falloff as per Disney principled BRDF, and in the spirit of\r\n    // of general coupled diffuse/specular models e.g. Ashikhmin Shirley.\r\n    float diffuseFresnelNV = pow(clamp(1.0 - NdotL, 0.000001, 1.), 5.0);\r\n    float diffuseFresnelNL = pow(clamp(1.0 - NdotV, 0.000001, 1.), 5.0);\r\n    float diffuseFresnel90 = 0.5 + 2.0 * VdotH * VdotH * roughness;\r\n    float diffuseFresnelTerm =\r\n        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNL) *\r\n        (1.0 + (diffuseFresnel90 - 1.0) * diffuseFresnelNV);\r\n\r\n    return diffuseFresnelTerm * NdotL;\r\n}\r\n\r\nfloat computeDefaultGlossiness(float glossiness, vec3 specularColor)\r\n{\r\n    if (glossiness == 0.)\r\n    {\r\n        float kSpecularNoAlphaWorkflow_SmoothnessMax = 0.95;\r\n\r\n        float specularLuminance = getLuminance(specularColor);\r\n        float specularLuma = sqrt(specularLuminance);\r\n        glossiness = specularLuma * kSpecularNoAlphaWorkflow_SmoothnessMax;\r\n    }\r\n    return glossiness;\r\n}\r\n\r\nvec3 toLinearSpace(vec3 color)\r\n{\r\n    return vec3(pow(color.r, 2.2), pow(color.g, 2.2), pow(color.b, 2.2));\r\n}\r\n\r\nvec3 toGammaSpace(vec3 color)\r\n{\r\n    return vec3(pow(color.r, 1.0 / 2.2), pow(color.g, 1.0 / 2.2), pow(color.b, 1.0 / 2.2));\r\n}\r\n\r\n#ifdef CAMERATONEMAP\r\n    vec3 toneMaps(vec3 color)\r\n    {\r\n        color = max(color, 0.0);\r\n\r\n        // TONE MAPPING / EXPOSURE\r\n        color.rgb = color.rgb * vCameraInfos.x;\r\n\r\n        float tuning = 1.5; // TODO: sync up so e.g. 18% greys are matched to exposure appropriately\r\n        vec3 tonemapped = 1.0 - exp2(-color.rgb * tuning); // simple local photographic tonemapper\r\n        color.rgb = mix(color.rgb, tonemapped, 1.0);\r\n        return color;\r\n    }\r\n#endif\r\n\r\n#ifdef CAMERACONTRAST\r\n    vec4 contrasts(vec4 color)\r\n    {\r\n        color = clamp(color, 0.0, 1.0);\r\n\r\n        vec3 resultHighContrast = color.rgb * color.rgb * (3.0 - 2.0 * color.rgb);\r\n        float contrast = vCameraInfos.y;\r\n        if (contrast < 1.0)\r\n        {\r\n            // Decrease contrast: interpolate towards zero-contrast image (flat grey)\r\n            color.rgb = mix(vec3(0.5, 0.5, 0.5), color.rgb, contrast);\r\n        }\r\n        else\r\n        {\r\n            // Increase contrast: apply simple shoulder-toe high contrast curve\r\n            color.rgb = mix(color.rgb, resultHighContrast, contrast - 1.0);\r\n        }\r\n\r\n        return color;\r\n    }\r\n#endif\r\n// END PBR HELPER METHODS\r\n\r\n#ifdef SPECULARTERM\r\nuniform vec4 vSpecularColor;\r\n#endif\r\nuniform vec3 vEmissiveColor;\r\n\r\n// Input\r\nvarying vec3 vPositionW;\r\n\r\n#ifdef NORMAL\r\nvarying vec3 vNormalW;\r\n#endif\r\n\r\n#ifdef VERTEXCOLOR\r\nvarying vec4 vColor;\r\n#endif\r\n\r\n// Lights\r\n#ifdef LIGHT0\r\nuniform vec4 vLightData0;\r\nuniform vec4 vLightDiffuse0;\r\n#ifdef SPECULARTERM\r\nuniform vec3 vLightSpecular0;\r\n#endif\r\n#ifdef SHADOW0\r\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\r\nvarying vec4 vPositionFromLight0;\r\nuniform sampler2D shadowSampler0;\r\n#else\r\nuniform samplerCube shadowSampler0;\r\n#endif\r\nuniform vec3 shadowsInfo0;\r\n#endif\r\n#ifdef SPOTLIGHT0\r\nuniform vec4 vLightDirection0;\r\n#endif\r\n#ifdef HEMILIGHT0\r\nuniform vec3 vLightGround0;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT1\r\nuniform vec4 vLightData1;\r\nuniform vec4 vLightDiffuse1;\r\n#ifdef SPECULARTERM\r\nuniform vec3 vLightSpecular1;\r\n#endif\r\n#ifdef SHADOW1\r\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\r\nvarying vec4 vPositionFromLight1;\r\nuniform sampler2D shadowSampler1;\r\n#else\r\nuniform samplerCube shadowSampler1;\r\n#endif\r\nuniform vec3 shadowsInfo1;\r\n#endif\r\n#ifdef SPOTLIGHT1\r\nuniform vec4 vLightDirection1;\r\n#endif\r\n#ifdef HEMILIGHT1\r\nuniform vec3 vLightGround1;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT2\r\nuniform vec4 vLightData2;\r\nuniform vec4 vLightDiffuse2;\r\n#ifdef SPECULARTERM\r\nuniform vec3 vLightSpecular2;\r\n#endif\r\n#ifdef SHADOW2\r\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\r\nvarying vec4 vPositionFromLight2;\r\nuniform sampler2D shadowSampler2;\r\n#else\r\nuniform samplerCube shadowSampler2;\r\n#endif\r\nuniform vec3 shadowsInfo2;\r\n#endif\r\n#ifdef SPOTLIGHT2\r\nuniform vec4 vLightDirection2;\r\n#endif\r\n#ifdef HEMILIGHT2\r\nuniform vec3 vLightGround2;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT3\r\nuniform vec4 vLightData3;\r\nuniform vec4 vLightDiffuse3;\r\n#ifdef SPECULARTERM\r\nuniform vec3 vLightSpecular3;\r\n#endif\r\n#ifdef SHADOW3\r\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\r\nvarying vec4 vPositionFromLight3;\r\nuniform sampler2D shadowSampler3;\r\n#else\r\nuniform samplerCube shadowSampler3;\r\n#endif\r\nuniform vec3 shadowsInfo3;\r\n#endif\r\n#ifdef SPOTLIGHT3\r\nuniform vec4 vLightDirection3;\r\n#endif\r\n#ifdef HEMILIGHT3\r\nuniform vec3 vLightGround3;\r\n#endif\r\n#endif\r\n\r\n// Samplers\r\n#ifdef DIFFUSE\r\nvarying vec2 vDiffuseUV;\r\nuniform sampler2D diffuseSampler;\r\nuniform vec2 vDiffuseInfos;\r\n#endif\r\n\r\n#ifdef AMBIENT\r\nvarying vec2 vAmbientUV;\r\nuniform sampler2D ambientSampler;\r\nuniform vec2 vAmbientInfos;\r\n#endif\r\n\r\n#ifdef OPACITY\t\r\nvarying vec2 vOpacityUV;\r\nuniform sampler2D opacitySampler;\r\nuniform vec2 vOpacityInfos;\r\n#endif\r\n\r\n#ifdef EMISSIVE\r\nvarying vec2 vEmissiveUV;\r\nuniform vec2 vEmissiveInfos;\r\nuniform sampler2D emissiveSampler;\r\n#endif\r\n\r\n#ifdef LIGHTMAP\r\nvarying vec2 vLightmapUV;\r\nuniform vec2 vLightmapInfos;\r\nuniform sampler2D lightmapSampler;\r\n#endif\r\n\r\n#if defined(SPECULAR) && defined(SPECULARTERM)\r\nvarying vec2 vSpecularUV;\r\nuniform vec2 vSpecularInfos;\r\nuniform sampler2D specularSampler;\r\n#endif\r\n\r\n#ifdef CLIPPLANE\r\nvarying float fClipDistance;\r\n#endif\r\n\r\n// Light Computing\r\nstruct lightingInfo\r\n{\r\n    vec3 diffuse;\r\n#ifdef SPECULARTERM\r\n    vec3 specular;\r\n#endif\r\n};\r\n\r\nlightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV) {\r\n    lightingInfo result;\r\n\r\n    vec3 lightVectorW;\r\n    float attenuation = 1.0;\r\n    if (lightData.w == 0.)\r\n    {\r\n        vec3 direction = lightData.xyz - vPositionW;\r\n\r\n        attenuation = max(0., 1.0 - length(direction) / range);\r\n        lightVectorW = normalize(direction);\r\n    }\r\n    else\r\n    {\r\n        lightVectorW = normalize(-lightData.xyz);\r\n    }\r\n\r\n    // diffuse\r\n    vec3 H = normalize(viewDirectionW + lightVectorW);\r\n    float NdotL = max(0.00000000001, dot(vNormal, lightVectorW));\r\n    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));\r\n\r\n    float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);\r\n    result.diffuse = diffuseTerm * diffuseColor * attenuation;\r\n\r\n#ifdef SPECULARTERM\r\n    // Specular\r\n    float NdotH = max(0.00000000001, dot(vNormal, H));\r\n\r\n    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\r\n    result.specular = specTerm * specularColor * attenuation;\r\n#endif\r\n\r\n    return result;\r\n}\r\n\r\nlightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float roughness, float NdotV) {\r\n    lightingInfo result;\r\n\r\n    vec3 direction = lightData.xyz - vPositionW;\r\n    vec3 lightVectorW = normalize(direction);\r\n    float attenuation = max(0., 1.0 - length(direction) / range);\r\n\r\n    // diffuse\r\n    float cosAngle = max(0.0000001, dot(-lightDirection.xyz, lightVectorW));\r\n    float spotAtten = 0.0;\r\n\r\n    if (cosAngle >= lightDirection.w)\r\n    {\r\n        cosAngle = max(0., pow(cosAngle, lightData.w));\r\n        spotAtten = clamp((cosAngle - lightDirection.w) / (1. - cosAngle), 0.0, 1.0);\r\n\r\n        // Diffuse\r\n        vec3 H = normalize(viewDirectionW - lightDirection.xyz);\r\n        float NdotL = max(0.00000000001, dot(vNormal, -lightDirection.xyz));\r\n        float VdotH = clamp(dot(viewDirectionW, H), 0.00000000001, 1.0);\r\n\r\n        float diffuseTerm = computeDiffuseTerm(NdotL, NdotV, VdotH, roughness);\r\n        result.diffuse = diffuseTerm * diffuseColor * attenuation * spotAtten;\r\n\r\n#ifdef SPECULARTERM\r\n        // Specular\r\n        float NdotH = max(0.00000000001, dot(vNormal, H));\r\n\r\n        vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\r\n        result.specular = specTerm * specularColor * attenuation * spotAtten;\r\n#endif\r\n\r\n        return result;\r\n    }\r\n\r\n    result.diffuse = vec3(0.);\r\n#ifdef SPECULARTERM\r\n    result.specular = vec3(0.);\r\n#endif\r\n\r\n    return result;\r\n}\r\n\r\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float roughness, float NdotV) {\r\n    lightingInfo result;\r\n\r\n    vec3 lightVectorW = normalize(lightData.xyz);\r\n\r\n    // Diffuse\r\n    float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;\r\n    result.diffuse = mix(groundColor, diffuseColor, ndl);\r\n\r\n#ifdef SPECULARTERM\r\n    // Specular\r\n    vec3 H = normalize(viewDirectionW + lightVectorW);\r\n    float NdotH = max(0.00000000001, dot(vNormal, H));\r\n    float NdotL = max(0.00000000001, ndl);\r\n    float VdotH = clamp(0.00000000001, 1.0, dot(viewDirectionW, H));\r\n\r\n    vec3 specTerm = computeSpecularTerm(NdotH, NdotL, NdotV, VdotH, roughness, specularColor);\r\n    result.specular = specTerm * specularColor;\r\n#endif\r\n\r\n    return result;\r\n}\r\n\r\nvoid main(void) {\r\n    // Clip plane\r\n#ifdef CLIPPLANE\r\n    if (fClipDistance > 0.0)\r\n        discard;\r\n#endif\r\n\r\n    vec3 viewDirectionW = normalize(vEyePosition - vPositionW);\r\n\r\n    // Base color\r\n    vec4 baseColor = vec4(1., 1., 1., 1.);\r\n    vec3 diffuseColor = vDiffuseColor.rgb;\r\n    \r\n    // Alpha\r\n    float alpha = vDiffuseColor.a;\r\n\r\n#ifdef DIFFUSE\r\n    baseColor = texture2D(diffuseSampler, vDiffuseUV);\r\n    baseColor = vec4(toLinearSpace(baseColor.rgb), baseColor.a);\r\n\r\n#ifdef ALPHATEST\r\n    if (baseColor.a < 0.4)\r\n        discard;\r\n#endif\r\n\r\n#ifdef ALPHAFROMDIFFUSE\r\n    alpha *= baseColor.a;\r\n#endif\r\n\r\n    baseColor.rgb *= vDiffuseInfos.y;\r\n#endif\r\n\r\n#ifdef VERTEXCOLOR\r\n    baseColor.rgb *= vColor.rgb;\r\n#endif\r\n\r\n#ifdef OVERLOADEDVALUES\r\n    baseColor.rgb = mix(baseColor.rgb, vOverloadedDiffuse, vOverloadedIntensity.y);\r\n    diffuseColor.rgb = mix(diffuseColor.rgb, vOverloadedDiffuse, vOverloadedIntensity.y);\r\n#endif\r\n\r\n    // Bump\r\n#ifdef NORMAL\r\n    vec3 normalW = normalize(vNormalW);\r\n#else\r\n    vec3 normalW = vec3(1.0, 1.0, 1.0);\r\n#endif\r\n\r\n    // Ambient color\r\n    vec3 baseAmbientColor = vec3(1., 1., 1.);\r\n\r\n#ifdef AMBIENT\r\n    baseAmbientColor = texture2D(ambientSampler, vAmbientUV).rgb * vAmbientInfos.y;\r\n    #ifdef OVERLOADEDVALUES\r\n        baseAmbientColor.rgb = mix(baseAmbientColor.rgb, vOverloadedAmbient, vOverloadedIntensity.x);\r\n    #endif\r\n#endif\r\n\r\n    // Specular map\r\n#ifdef SPECULARTERM\r\n    float glossiness = vSpecularColor.a;\r\n    vec3 specularColor = vSpecularColor.rgb;\r\n\r\n    #ifdef OVERLOADEDVALUES\r\n        specularColor.rgb = mix(specularColor.rgb, vOverloadedSpecular, vOverloadedIntensity.z);\r\n    #endif\r\n\r\n    #ifdef SPECULAR\r\n            vec4 specularMapColor = texture2D(specularSampler, vSpecularUV);\r\n            specularColor = toLinearSpace(specularMapColor.rgb);\r\n\r\n        #ifdef OVERLOADEDVALUES\r\n                specularColor.rgb = mix(specularColor.rgb, vOverloadedSpecular, vOverloadedIntensity.z);\r\n        #endif\r\n\r\n        #ifdef GLOSSINESSFROMSPECULARMAP\r\n            glossiness = specularMapColor.a;\r\n        #else\r\n            glossiness = computeDefaultGlossiness(glossiness, specularColor);\r\n        #endif\r\n    #endif\r\n\r\n    #ifdef OVERLOADEDVALUES\r\n        glossiness = mix(glossiness, vOverloadedGlossiness.x, vOverloadedGlossiness.y);\r\n    #endif\r\n#else\r\n    float glossiness = 0.;\r\n    #ifdef OVERLOADEDVALUES\r\n        glossiness = mix(glossiness, vOverloadedGlossiness.x, vOverloadedGlossiness.y);\r\n    #endif\r\n\r\n    vec3 specularColor = vec3(0., 0., 0);\r\n    #ifdef OVERLOADEDVALUES\r\n            specularColor.rgb = mix(specularColor.rgb, vOverloadedSpecular, vOverloadedIntensity.z);\r\n    #endif\r\n#endif\r\n\r\n    // Apply Energy Conservation taking in account the environment level only if the environment is present.\r\n    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);\r\n    baseColor.rgb = (1. - reflectance) * baseColor.rgb;\r\n\r\n    // Compute Specular Fresnel + Reflectance.\r\n    float NdotV = max(0.00000000001, dot(normalW, viewDirectionW));\r\n\r\n    // Adapt glossiness.\r\n    glossiness = clamp(glossiness, 0., 1.) * 0.98;\r\n\r\n    // Call rough to not conflict with previous one.\r\n    float rough = clamp(1. - glossiness, 0.000001, 1.0);\r\n\r\n    // Lighting\r\n    vec3 diffuseBase = vec3(0., 0., 0.);\r\n\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    vec3 shadowedOnlyDiffuseBase = vec3(1., 1., 1.);\r\n#endif\r\n\r\n#ifdef SPECULARTERM\r\n    vec3 specularBase = vec3(0., 0., 0.);\r\n#endif\r\n    float shadow = 1.;\r\n\r\n#ifdef LIGHT0\r\n#ifndef SPECULARTERM\r\n    vec3 vLightSpecular0 = vec3(0.0);\r\n#endif\r\n#ifdef SPOTLIGHT0\r\n    lightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, rough, NdotV);\r\n#endif\r\n#ifdef HEMILIGHT0\r\n    lightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightGround0, rough, NdotV);\r\n#endif\r\n#if defined(POINTLIGHT0) || defined(DIRLIGHT0)\r\n    lightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, rough, NdotV);\r\n#endif\r\n\r\n    shadow = 1.;\r\n    diffuseBase += info.diffuse * shadow;\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    shadowedOnlyDiffuseBase *= shadow;\r\n#endif\r\n\r\n#ifdef SPECULARTERM\r\n    specularBase += info.specular * shadow;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT1\r\n#ifndef SPECULARTERM\r\n    vec3 vLightSpecular1 = vec3(0.0);\r\n#endif\r\n#ifdef SPOTLIGHT1\r\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, rough, NdotV);\r\n#endif\r\n#ifdef HEMILIGHT1\r\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightGround1, rough, NdotV);\r\n#endif\r\n#if defined(POINTLIGHT1) || defined(DIRLIGHT1)\r\n    info = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, rough, NdotV);\r\n#endif\r\n\r\n    shadow = 1.;\r\n    diffuseBase += info.diffuse * shadow;\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    shadowedOnlyDiffuseBase *= shadow;\r\n#endif\r\n\r\n#ifdef SPECULARTERM\r\n    specularBase += info.specular * shadow;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT2\r\n#ifndef SPECULARTERM\r\n    vec3 vLightSpecular2 = vec3(0.0);\r\n#endif\r\n#ifdef SPOTLIGHT2\r\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, rough, NdotV);\r\n#endif\r\n#ifdef HEMILIGHT2\r\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightGround2, rough, NdotV);\r\n#endif\r\n#if defined(POINTLIGHT2) || defined(DIRLIGHT2)\r\n    info = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, rough, NdotV);\r\n#endif\r\n\r\n    shadow = 1.;\r\n    diffuseBase += info.diffuse * shadow;\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    shadowedOnlyDiffuseBase *= shadow;\r\n#endif\r\n\r\n#ifdef SPECULARTERM\r\n    specularBase += info.specular * shadow;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT3\r\n#ifndef SPECULARTERM\r\n    vec3 vLightSpecular3 = vec3(0.0);\r\n#endif\r\n#ifdef SPOTLIGHT3\r\n    info = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, rough, NdotV);\r\n#endif\r\n#ifdef HEMILIGHT3\r\n    info = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightGround3, rough, NdotV);\r\n#endif\r\n#if defined(POINTLIGHT3) || defined(DIRLIGHT3)\r\n    info = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, rough, NdotV);\r\n#endif\r\n\r\n    shadow = 1.;\r\n    diffuseBase += info.diffuse * shadow;\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n    shadowedOnlyDiffuseBase *= shadow;\r\n#endif\r\n\r\n#ifdef SPECULARTERM\r\n    specularBase += info.specular * shadow;\r\n#endif\r\n#endif\r\n\r\n// Reflection\r\nvec3 reflectionColor = vReflectionColor.rgb;\r\nvec3 ambientReflectionColor = vReflectionColor.rgb;\r\n\r\nreflectionColor *= vLightingIntensity.z;\r\nambientReflectionColor *= vLightingIntensity.z;\r\n\r\n// Compute reflection specular fresnel\r\nvec3 specularEnvironmentR0 = specularColor.rgb;\r\nvec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0);\r\nvec3 specularEnvironmentReflectanceViewer = FresnelSchlickEnvironmentGGX(clamp(NdotV, 0., 1.), specularEnvironmentR0, specularEnvironmentR90, sqrt(glossiness));\r\nreflectionColor *= specularEnvironmentReflectanceViewer;\r\n\r\n#ifdef OVERLOADEDVALUES\r\n    ambientReflectionColor = mix(ambientReflectionColor, vOverloadedReflection, vOverloadedGlossiness.z);\r\n    reflectionColor = mix(reflectionColor, vOverloadedReflection, vOverloadedGlossiness.z);\r\n#endif\r\n\r\n#ifdef OPACITY\r\n    vec4 opacityMap = texture2D(opacitySampler, vOpacityUV);\r\n\r\n#ifdef OPACITYRGB\r\n    opacityMap.rgb = opacityMap.rgb * vec3(0.3, 0.59, 0.11);\r\n    alpha *= (opacityMap.x + opacityMap.y + opacityMap.z)* vOpacityInfos.y;\r\n#else\r\n    alpha *= opacityMap.a * vOpacityInfos.y;\r\n#endif\r\n\r\n#endif\r\n\r\n#ifdef VERTEXALPHA\r\n    alpha *= vColor.a;\r\n#endif\r\n\r\n    // Emissive\r\n    vec3 emissiveColor = vEmissiveColor;\r\n#ifdef EMISSIVE\r\n    vec3 emissiveColorTex = texture2D(emissiveSampler, vEmissiveUV).rgb;\r\n    emissiveColor = toLinearSpace(emissiveColorTex.rgb) * emissiveColor * vEmissiveInfos.y;\r\n#endif\r\n\r\n#ifdef OVERLOADEDVALUES\r\n    emissiveColor = mix(emissiveColor, vOverloadedEmissive, vOverloadedIntensity.w);\r\n#endif\r\n\r\n    // Composition\r\n#ifdef EMISSIVEASILLUMINATION\r\n    vec3 finalDiffuse = max(diffuseBase * diffuseColor + vAmbientColor, 0.0) * baseColor.rgb;\r\n\r\n    #ifdef OVERLOADEDSHADOWVALUES\r\n        shadowedOnlyDiffuseBase = max(shadowedOnlyDiffuseBase * diffuseColor + vAmbientColor, 0.0) * baseColor.rgb;\r\n    #endif\r\n#else\r\n    #ifdef LINKEMISSIVEWITHDIFFUSE\r\n        vec3 finalDiffuse = max((diffuseBase + emissiveColor) * diffuseColor + vAmbientColor, 0.0) * baseColor.rgb;\r\n        #ifdef OVERLOADEDSHADOWVALUES\r\n                shadowedOnlyDiffuseBase = max((shadowedOnlyDiffuseBase + emissiveColor) * diffuseColor + vAmbientColor, 0.0) * baseColor.rgb;\r\n        #endif\r\n    #else\r\n        vec3 finalDiffuse = max(diffuseBase * diffuseColor + emissiveColor + vAmbientColor, 0.0) * baseColor.rgb;\r\n        #ifdef OVERLOADEDSHADOWVALUES\r\n            shadowedOnlyDiffuseBase = max(shadowedOnlyDiffuseBase * diffuseColor + emissiveColor + vAmbientColor, 0.0) * baseColor.rgb;\r\n        #endif\r\n    #endif\r\n#endif\r\n\r\n#ifdef OVERLOADEDSHADOWVALUES\r\n      finalDiffuse = mix(finalDiffuse, shadowedOnlyDiffuseBase, (1.0 - vOverloadedShadowIntensity.y));\r\n#endif\r\n\r\n// diffuse lighting from environment 0.2 replaces Harmonic...\r\n// Ambient Reflection already includes the environment intensity.\r\nfinalDiffuse += baseColor.rgb * ambientReflectionColor * 0.2;\r\n\r\n#ifdef SPECULARTERM\r\n    vec3 finalSpecular = specularBase * specularColor;\r\n#else\r\n    vec3 finalSpecular = vec3(0.0);\r\n#endif\r\n\r\n#ifdef SPECULAROVERALPHA\r\n    alpha = clamp(alpha + dot(finalSpecular, vec3(0.3, 0.59, 0.11)), 0., 1.);\r\n#endif\r\n\r\n// Composition\r\n// Reflection already includes the environment intensity.\r\n#ifdef EMISSIVEASILLUMINATION\r\n    vec4 color = vec4(finalDiffuse * baseAmbientColor * vLightingIntensity.x + finalSpecular * vLightingIntensity.x + reflectionColor + emissiveColor * vLightingIntensity.y, alpha);\r\n#else\r\n    vec4 color = vec4(finalDiffuse * baseAmbientColor * vLightingIntensity.x + finalSpecular * vLightingIntensity.x + reflectionColor, alpha);\r\n#endif\r\n\r\n    color = max(color, 0.0);\r\n\r\n#ifdef CAMERATONEMAP\r\n    color.rgb = toneMaps(color.rgb);\r\n#endif\r\n\r\n    color.rgb = toGammaSpace(color.rgb);\r\n\r\n#ifdef CAMERACONTRAST\r\n    color = contrasts(color);\r\n#endif\r\n\r\n    gl_FragColor = color;\r\n}";
