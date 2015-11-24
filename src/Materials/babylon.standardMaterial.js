var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var maxSimultaneousLights = 4;
    var FresnelParameters = (function () {
        function FresnelParameters() {
            this.isEnabled = true;
            this.leftColor = BABYLON.Color3.White();
            this.rightColor = BABYLON.Color3.Black();
            this.bias = 0;
            this.power = 1;
        }
        FresnelParameters.prototype.clone = function () {
            var newFresnelParameters = new FresnelParameters();
            BABYLON.Tools.DeepCopy(this, newFresnelParameters);
            return new FresnelParameters;
        };
        return FresnelParameters;
    })();
    BABYLON.FresnelParameters = FresnelParameters;
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
            this.DIFFUSEFRESNEL = false;
            this.OPACITYFRESNEL = false;
            this.REFLECTIONFRESNEL = false;
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
            this._keys = Object.keys(this);
        }
        return StandardMaterialDefines;
    })(BABYLON.MaterialDefines);
    var StandardMaterial = (function (_super) {
        __extends(StandardMaterial, _super);
        function StandardMaterial(name, scene) {
            var _this = this;
            _super.call(this, name, scene);
            this.ambientColor = new BABYLON.Color3(0, 0, 0);
            this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            this.specularColor = new BABYLON.Color3(1, 1, 1);
            this.specularPower = 64;
            this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            this.useAlphaFromDiffuseTexture = false;
            this.useEmissiveAsIllumination = false;
            this.linkEmissiveWithDiffuse = false;
            this.useReflectionFresnelFromSpecular = false;
            this.useSpecularOverAlpha = true;
            this.disableLighting = false;
            this.roughness = 0;
            this.useLightmapAsShadowmap = false;
            this.useGlossinessFromSpecularMapAlpha = false;
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
        StandardMaterial.PrepareDefinesForLights = function (scene, mesh, defines) {
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
        StandardMaterial.BindLights = function (scene, mesh, effect, defines) {
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
                light.diffuse.scaleToRef(light.intensity, StandardMaterial._scaledDiffuse);
                effect.setColor4("vLightDiffuse" + lightIndex, StandardMaterial._scaledDiffuse, light.range);
                if (defines["SPECULARTERM"]) {
                    light.specular.scaleToRef(light.intensity, StandardMaterial._scaledSpecular);
                    effect.setColor3("vLightSpecular" + lightIndex, StandardMaterial._scaledSpecular);
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
        StandardMaterial.prototype.isReady = function (mesh, useInstances) {
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
                if (this.lightmapTexture && StandardMaterial.LightmapEnabled) {
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
            }
            if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && StandardMaterial.BumpTextureEnabled) {
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
            if (this.useReflectionFresnelFromSpecular) {
                this._defines.REFLECTIONFRESNELFROMSPECULAR = true;
            }
            if (this.useLogarithmicDepth) {
                this._defines.LOGARITHMICDEPTH = true;
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
                needNormals = StandardMaterial.PrepareDefinesForLights(scene, mesh, this._defines);
            }
            if (StandardMaterial.FresnelEnabled) {
                // Fresnel
                if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled ||
                    this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled ||
                    this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled ||
                    this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
                    if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled) {
                        this._defines.DIFFUSEFRESNEL = true;
                    }
                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        this._defines.OPACITYFRESNEL = true;
                    }
                    if (this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
                        this._defines.REFLECTIONFRESNEL = true;
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
                var shaderName = "default";
                if (!scene.getEngine().getCaps().standardDerivatives) {
                    shaderName = "legacydefault";
                }
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName, attribs, ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
                    "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                    "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                    "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                    "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos", "vLightmapInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix", "lightmapMatrix",
                    "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3",
                    "diffuseLeftColor", "diffuseRightColor", "opacityParts", "reflectionLeftColor", "reflectionRightColor", "emissiveLeftColor", "emissiveRightColor",
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
            _super.prototype.unbind.call(this);
        };
        StandardMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        StandardMaterial.prototype.bind = function (world, mesh) {
            var scene = this.getScene();
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
            }
            if (scene.getCachedMaterial() !== this) {
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
                    if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                        this._effect.setColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                        this._effect.setColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                    }
                }
                // Textures        
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
                if (this.lightmapTexture && StandardMaterial.LightmapEnabled) {
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
                    this._effect.setFloat2("vBumpInfos", this.bumpTexture.coordinatesIndex, 1.0 / this.bumpTexture.level);
                    this._effect.setMatrix("bumpMatrix", this.bumpTexture.getTextureMatrix());
                }
                // Clip plane
                if (scene.clipPlane) {
                    var clipPlane = scene.clipPlane;
                    this._effect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
                }
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
            // Diffuse
            this._effect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
            // Lights
            if (scene.lightsEnabled && !this.disableLighting) {
                StandardMaterial.BindLights(scene, mesh, this._effect, this._defines);
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE || this.reflectionTexture) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
                this._effect.setColor3("vFogColor", scene.fogColor);
            }
            // Log. depth
            if (this._defines.LOGARITHMICDEPTH) {
                this._effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(scene.activeCamera.maxZ + 1.0) / Math.LN2));
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
            return results;
        };
        StandardMaterial.prototype.dispose = function (forceDisposeEffect) {
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
        StandardMaterial.prototype.clone = function (name) {
            var newStandardMaterial = new StandardMaterial(name, this.getScene());
            // Base material
            this.copyTo(newStandardMaterial);
            // Standard material
            if (this.diffuseTexture && this.diffuseTexture.clone) {
                newStandardMaterial.diffuseTexture = this.diffuseTexture.clone();
            }
            if (this.ambientTexture && this.ambientTexture.clone) {
                newStandardMaterial.ambientTexture = this.ambientTexture.clone();
            }
            if (this.opacityTexture && this.opacityTexture.clone) {
                newStandardMaterial.opacityTexture = this.opacityTexture.clone();
            }
            if (this.reflectionTexture && this.reflectionTexture.clone) {
                newStandardMaterial.reflectionTexture = this.reflectionTexture.clone();
            }
            if (this.emissiveTexture && this.emissiveTexture.clone) {
                newStandardMaterial.emissiveTexture = this.emissiveTexture.clone();
            }
            if (this.specularTexture && this.specularTexture.clone) {
                newStandardMaterial.specularTexture = this.specularTexture.clone();
            }
            if (this.bumpTexture && this.bumpTexture.clone) {
                newStandardMaterial.bumpTexture = this.bumpTexture.clone();
            }
            if (this.lightmapTexture && this.lightmapTexture.clone) {
                newStandardMaterial.lightmapTexture = this.lightmapTexture.clone();
                newStandardMaterial.useLightmapAsShadowmap = this.useLightmapAsShadowmap;
            }
            newStandardMaterial.ambientColor = this.ambientColor.clone();
            newStandardMaterial.diffuseColor = this.diffuseColor.clone();
            newStandardMaterial.specularColor = this.specularColor.clone();
            newStandardMaterial.specularPower = this.specularPower;
            newStandardMaterial.emissiveColor = this.emissiveColor.clone();
            newStandardMaterial.useAlphaFromDiffuseTexture = this.useAlphaFromDiffuseTexture;
            newStandardMaterial.useEmissiveAsIllumination = this.useEmissiveAsIllumination;
            newStandardMaterial.useGlossinessFromSpecularMapAlpha = this.useGlossinessFromSpecularMapAlpha;
            newStandardMaterial.useReflectionFresnelFromSpecular = this.useReflectionFresnelFromSpecular;
            newStandardMaterial.useSpecularOverAlpha = this.useSpecularOverAlpha;
            newStandardMaterial.roughness = this.roughness;
            if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.clone) {
                newStandardMaterial.diffuseFresnelParameters = this.diffuseFresnelParameters.clone();
            }
            if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.clone) {
                newStandardMaterial.emissiveFresnelParameters = this.emissiveFresnelParameters.clone();
            }
            if (this.reflectionFresnelParameters && this.reflectionFresnelParameters.clone) {
                newStandardMaterial.reflectionFresnelParameters = this.reflectionFresnelParameters.clone();
            }
            if (this.opacityFresnelParameters && this.opacityFresnelParameters.clone) {
                newStandardMaterial.opacityFresnelParameters = this.opacityFresnelParameters.clone();
            }
            return newStandardMaterial;
        };
        StandardMaterial.ParseFresnelParameters = function (parsedFresnelParameters) {
            var fresnelParameters = new FresnelParameters();
            fresnelParameters.isEnabled = parsedFresnelParameters.isEnabled;
            fresnelParameters.leftColor = BABYLON.Color3.FromArray(parsedFresnelParameters.leftColor);
            fresnelParameters.rightColor = BABYLON.Color3.FromArray(parsedFresnelParameters.rightColor);
            fresnelParameters.bias = parsedFresnelParameters.bias;
            fresnelParameters.power = parsedFresnelParameters.power || 1.0;
            return fresnelParameters;
        };
        StandardMaterial.Parse = function (source, scene, rootUrl) {
            var material = new StandardMaterial(source.name, scene);
            material.ambientColor = BABYLON.Color3.FromArray(source.ambient);
            material.diffuseColor = BABYLON.Color3.FromArray(source.diffuse);
            material.specularColor = BABYLON.Color3.FromArray(source.specular);
            material.specularPower = source.specularPower;
            material.emissiveColor = BABYLON.Color3.FromArray(source.emissive);
            material.useReflectionFresnelFromSpecular = source.useReflectionFresnelFromSpecular;
            material.useEmissiveAsIllumination = source.useEmissiveAsIllumination;
            material.alpha = source.alpha;
            material.id = source.id;
            if (source.disableDepthWrite) {
                material.disableDepthWrite = source.disableDepthWrite;
            }
            BABYLON.Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;
            if (source.diffuseTexture) {
                material.diffuseTexture = BABYLON.BaseTexture.ParseTexture(source.diffuseTexture, scene, rootUrl);
            }
            if (source.diffuseFresnelParameters) {
                material.diffuseFresnelParameters = StandardMaterial.ParseFresnelParameters(source.diffuseFresnelParameters);
            }
            if (source.ambientTexture) {
                material.ambientTexture = BABYLON.BaseTexture.ParseTexture(source.ambientTexture, scene, rootUrl);
            }
            if (source.opacityTexture) {
                material.opacityTexture = BABYLON.BaseTexture.ParseTexture(source.opacityTexture, scene, rootUrl);
            }
            if (source.opacityFresnelParameters) {
                material.opacityFresnelParameters = StandardMaterial.ParseFresnelParameters(source.opacityFresnelParameters);
            }
            if (source.reflectionTexture) {
                material.reflectionTexture = BABYLON.BaseTexture.ParseTexture(source.reflectionTexture, scene, rootUrl);
            }
            if (source.reflectionFresnelParameters) {
                material.reflectionFresnelParameters = StandardMaterial.ParseFresnelParameters(source.reflectionFresnelParameters);
            }
            if (source.emissiveTexture) {
                material.emissiveTexture = BABYLON.BaseTexture.ParseTexture(source.emissiveTexture, scene, rootUrl);
            }
            if (source.lightmapTexture) {
                material.lightmapTexture = BABYLON.BaseTexture.ParseTexture(source.lightmapTexture, scene, rootUrl);
                material.useLightmapAsShadowmap = source.useLightmapAsShadowmap;
            }
            if (source.emissiveFresnelParameters) {
                material.emissiveFresnelParameters = StandardMaterial.ParseFresnelParameters(source.emissiveFresnelParameters);
            }
            if (source.specularTexture) {
                material.specularTexture = BABYLON.BaseTexture.ParseTexture(source.specularTexture, scene, rootUrl);
            }
            if (source.bumpTexture) {
                material.bumpTexture = BABYLON.BaseTexture.ParseTexture(source.bumpTexture, scene, rootUrl);
            }
            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }
            return material;
        };
        StandardMaterial._scaledDiffuse = new BABYLON.Color3();
        StandardMaterial._scaledSpecular = new BABYLON.Color3();
        // Statics
        // Flags used to enable or disable a type of texture for all Standard Materials
        StandardMaterial.DiffuseTextureEnabled = true;
        StandardMaterial.AmbientTextureEnabled = true;
        StandardMaterial.OpacityTextureEnabled = true;
        StandardMaterial.ReflectionTextureEnabled = true;
        StandardMaterial.EmissiveTextureEnabled = true;
        StandardMaterial.SpecularTextureEnabled = true;
        StandardMaterial.BumpTextureEnabled = true;
        StandardMaterial.FresnelEnabled = true;
        StandardMaterial.LightmapEnabled = true;
        return StandardMaterial;
    })(BABYLON.Material);
    BABYLON.StandardMaterial = StandardMaterial;
})(BABYLON || (BABYLON = {}));
