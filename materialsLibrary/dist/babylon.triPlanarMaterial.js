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
    var TriPlanarMaterialDefines = (function (_super) {
        __extends(TriPlanarMaterialDefines, _super);
        function TriPlanarMaterialDefines() {
            _super.call(this);
            this.DIFFUSEX = false;
            this.DIFFUSEY = false;
            this.DIFFUSEZ = false;
            this.BUMPX = false;
            this.BUMPY = false;
            this.BUMPZ = false;
            this.CLIPPLANE = false;
            this.ALPHATEST = false;
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
            this.DIRLIGHT0 = false;
            this.DIRLIGHT1 = false;
            this.DIRLIGHT2 = false;
            this.DIRLIGHT3 = false;
            this.POINTLIGHT0 = false;
            this.POINTLIGHT1 = false;
            this.POINTLIGHT2 = false;
            this.POINTLIGHT3 = false;
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
            this.SPECULARTERM = false;
            this.NORMAL = false;
            this.VERTEXCOLOR = false;
            this.VERTEXALPHA = false;
            this.BONES = false;
            this.BONES4 = false;
            this.BonesPerMesh = 0;
            this.INSTANCES = false;
            this._keys = Object.keys(this);
        }
        return TriPlanarMaterialDefines;
    })(BABYLON.MaterialDefines);
    var TriPlanarMaterial = (function (_super) {
        __extends(TriPlanarMaterial, _super);
        function TriPlanarMaterial(name, scene) {
            _super.call(this, name, scene);
            this.tileSize = 1;
            this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            this.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            this.specularPower = 64;
            this.disableLighting = false;
            this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
            this._scaledDiffuse = new BABYLON.Color3();
            this._scaledSpecular = new BABYLON.Color3();
            this._defines = new TriPlanarMaterialDefines();
            this._cachedDefines = new TriPlanarMaterialDefines();
            this._cachedDefines.BonesPerMesh = -1;
        }
        TriPlanarMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        TriPlanarMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        TriPlanarMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        TriPlanarMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
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
        TriPlanarMaterial.prototype.isReady = function (mesh, useInstances) {
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
            this._defines.reset();
            // Textures
            if (scene.texturesEnabled) {
                if (BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    var textures = [this.diffuseTextureX, this.diffuseTextureY, this.diffuseTextureZ];
                    var textureDefines = ["DIFFUSEX", "DIFFUSEY", "DIFFUSEZ"];
                    for (var i = 0; i < textures.length; i++) {
                        if (textures[i]) {
                            if (!textures[i].isReady()) {
                                return false;
                            }
                            else {
                                this._defines[textureDefines[i]] = true;
                            }
                        }
                    }
                }
                if (BABYLON.StandardMaterial.BumpTextureEnabled) {
                    var textures = [this.normalTextureX, this.normalTextureY, this.normalTextureZ];
                    var textureDefines = ["BUMPX", "BUMPY", "BUMPZ"];
                    for (var i = 0; i < textures.length; i++) {
                        if (textures[i]) {
                            if (!textures[i].isReady()) {
                                return false;
                            }
                            else {
                                this._defines[textureDefines[i]] = true;
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
            // Point size
            if (this.pointsCloud || scene.forcePointsCloud) {
                this._defines.POINTSIZE = true;
            }
            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }
            var lightIndex = 0;
            if (scene.lightsEnabled && !this.disableLighting) {
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
                    this._defines["LIGHT" + lightIndex] = true;
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
                    this._defines[type] = true;
                    // Specular
                    if (!light.specular.equalsFloats(0, 0, 0)) {
                        this._defines.SPECULARTERM = true;
                    }
                    // Shadows
                    if (scene.shadowsEnabled) {
                        var shadowGenerator = light.getShadowGenerator();
                        if (mesh && mesh.receiveShadows && shadowGenerator) {
                            this._defines["SHADOW" + lightIndex] = true;
                            this._defines.SHADOWS = true;
                            if (shadowGenerator.useVarianceShadowMap || shadowGenerator.useBlurVarianceShadowMap) {
                                this._defines["SHADOWVSM" + lightIndex] = true;
                            }
                            if (shadowGenerator.usePoissonSampling) {
                                this._defines["SHADOWPCF" + lightIndex] = true;
                            }
                        }
                    }
                    lightIndex++;
                    if (lightIndex === maxSimultaneousLights)
                        break;
                }
            }
            // Attribs
            if (mesh) {
                if (needNormals && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                }
                if (mesh.useVertexColors && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                    this._defines.VERTEXCOLOR = true;
                    if (mesh.hasVertexAlpha) {
                        this._defines.VERTEXALPHA = true;
                    }
                }
                if (mesh.useBones && mesh.computeBonesUsingShaders) {
                    this._defines.BONES = true;
                    this._defines.BonesPerMesh = (mesh.skeleton.bones.length + 1);
                    this._defines.BONES4 = true;
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
                if (this._defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                for (lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
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
                if (this._defines.BONES4) {
                    fallbacks.addFallback(0, "BONES4");
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (this._defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (this._defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                if (this._defines.BONES) {
                    attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                    attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                }
                if (this._defines.INSTANCES) {
                    attribs.push("world0");
                    attribs.push("world1");
                    attribs.push("world2");
                    attribs.push("world3");
                }
                // Legacy browser patch
                var shaderName = "triplanar";
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName, attribs, ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor", "vSpecularColor",
                    "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                    "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                    "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                    "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                    "vFogInfos", "vFogColor", "pointSize",
                    "mBones",
                    "vClipPlane",
                    "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3",
                    "tileSize"
                ], ["diffuseSamplerX", "diffuseSamplerY", "diffuseSamplerZ",
                    "normalSamplerX", "normalSamplerY", "normalSamplerZ",
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
                    mesh._materialDefines = new TriPlanarMaterialDefines();
                }
                this._defines.cloneTo(mesh._materialDefines);
            }
            return true;
        };
        TriPlanarMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        TriPlanarMaterial.prototype.bind = function (world, mesh) {
            var scene = this.getScene();
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
            }
            this._effect.setFloat("tileSize", this.tileSize);
            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this.diffuseTextureX) {
                    this._effect.setTexture("diffuseSamplerX", this.diffuseTextureX);
                }
                if (this.diffuseTextureY) {
                    this._effect.setTexture("diffuseSamplerY", this.diffuseTextureY);
                }
                if (this.diffuseTextureZ) {
                    this._effect.setTexture("diffuseSamplerZ", this.diffuseTextureZ);
                }
                if (this.normalTextureX) {
                    this._effect.setTexture("normalSamplerX", this.normalTextureX);
                }
                if (this.normalTextureY) {
                    this._effect.setTexture("normalSamplerY", this.normalTextureY);
                }
                if (this.normalTextureZ) {
                    this._effect.setTexture("normalSamplerZ", this.normalTextureZ);
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
                this._effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._effect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);
            if (this._defines.SPECULARTERM) {
                this._effect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
            }
            if (scene.lightsEnabled && !this.disableLighting) {
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
                        light.transferToEffect(this._effect, "vLightData" + lightIndex);
                    }
                    else if (light instanceof BABYLON.DirectionalLight) {
                        // Directional Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex);
                    }
                    else if (light instanceof BABYLON.SpotLight) {
                        // Spot Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex, "vLightDirection" + lightIndex);
                    }
                    else if (light instanceof BABYLON.HemisphericLight) {
                        // Hemispheric Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex, "vLightGround" + lightIndex);
                    }
                    light.diffuse.scaleToRef(light.intensity, this._scaledDiffuse);
                    this._effect.setColor4("vLightDiffuse" + lightIndex, this._scaledDiffuse, light.range);
                    if (this._defines.SPECULARTERM) {
                        light.specular.scaleToRef(light.intensity, this._scaledSpecular);
                        this._effect.setColor3("vLightSpecular" + lightIndex, this._scaledSpecular);
                    }
                    // Shadows
                    if (scene.shadowsEnabled) {
                        var shadowGenerator = light.getShadowGenerator();
                        if (mesh.receiveShadows && shadowGenerator) {
                            this._effect.setMatrix("lightMatrix" + lightIndex, shadowGenerator.getTransformMatrix());
                            this._effect.setTexture("shadowSampler" + lightIndex, shadowGenerator.getShadowMapForRendering());
                            this._effect.setFloat3("shadowsInfo" + lightIndex, shadowGenerator.getDarkness(), shadowGenerator.getShadowMap().getSize().width, shadowGenerator.bias);
                        }
                    }
                    lightIndex++;
                    if (lightIndex === maxSimultaneousLights)
                        break;
                }
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
                this._effect.setColor3("vFogColor", scene.fogColor);
            }
            _super.prototype.bind.call(this, world, mesh);
        };
        TriPlanarMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.mixTexture && this.mixTexture.animations && this.mixTexture.animations.length > 0) {
                results.push(this.mixTexture);
            }
            return results;
        };
        TriPlanarMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.mixTexture) {
                this.mixTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        TriPlanarMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new TriPlanarMaterial(name, _this.getScene()); }, this);
        };
        TriPlanarMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.TriPlanarMaterial";
            return serializationObject;
        };
        // Statics
        TriPlanarMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new TriPlanarMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsTexture()
        ], TriPlanarMaterial.prototype, "mixTexture");
        __decorate([
            BABYLON.serializeAsTexture()
        ], TriPlanarMaterial.prototype, "diffuseTextureX");
        __decorate([
            BABYLON.serializeAsTexture()
        ], TriPlanarMaterial.prototype, "diffuseTextureY");
        __decorate([
            BABYLON.serializeAsTexture()
        ], TriPlanarMaterial.prototype, "diffuseTextureZ");
        __decorate([
            BABYLON.serializeAsTexture()
        ], TriPlanarMaterial.prototype, "normalTextureX");
        __decorate([
            BABYLON.serializeAsTexture()
        ], TriPlanarMaterial.prototype, "normalTextureY");
        __decorate([
            BABYLON.serializeAsTexture()
        ], TriPlanarMaterial.prototype, "normalTextureZ");
        __decorate([
            BABYLON.serialize()
        ], TriPlanarMaterial.prototype, "tileSize");
        __decorate([
            BABYLON.serializeAsColor3()
        ], TriPlanarMaterial.prototype, "diffuseColor");
        __decorate([
            BABYLON.serializeAsColor3()
        ], TriPlanarMaterial.prototype, "specularColor");
        __decorate([
            BABYLON.serialize()
        ], TriPlanarMaterial.prototype, "specularPower");
        __decorate([
            BABYLON.serialize()
        ], TriPlanarMaterial.prototype, "disableLighting");
        return TriPlanarMaterial;
    })(BABYLON.Material);
    BABYLON.TriPlanarMaterial = TriPlanarMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['triplanarVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#ifdef BONES\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#endif\n\n#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSEX\nvarying vec2 vTextureUVX;\n#endif\n#ifdef DIFFUSEY\nvarying vec2 vTextureUVY;\n#endif\n#ifdef DIFFUSEZ\nvarying vec2 vTextureUVZ;\n#endif\nuniform float tileSize;\n#ifdef BONES\nuniform mat4 mBones[BonesPerMesh];\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying mat3 tangentSpace;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif\n#ifdef FOG\nvarying float fFogDistance;\n#endif\n#ifdef SHADOWS\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\nuniform mat4 lightMatrix0;\nvarying vec4 vPositionFromLight0;\n#endif\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\nuniform mat4 lightMatrix1;\nvarying vec4 vPositionFromLight1;\n#endif\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\nuniform mat4 lightMatrix2;\nvarying vec4 vPositionFromLight2;\n#endif\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\nuniform mat4 lightMatrix3;\nvarying vec4 vPositionFromLight3;\n#endif\n#endif\nvoid main(void) {\n mat4 finalWorld;\n#ifdef INSTANCES\n finalWorld = mat4(world0, world1, world2, world3);\n#else\n finalWorld = world;\n#endif\n#ifdef BONES\n mat4 m0 = mBones[int(matricesIndices.x)] * matricesWeights.x;\n mat4 m1 = mBones[int(matricesIndices.y)] * matricesWeights.y;\n mat4 m2 = mBones[int(matricesIndices.z)] * matricesWeights.z;\n#ifdef BONES4\n mat4 m3 = mBones[int(matricesIndices.w)] * matricesWeights.w;\n finalWorld = finalWorld * (m0 + m1 + m2 + m3);\n#else\n finalWorld = finalWorld * (m0 + m1 + m2);\n#endif \n#endif\n gl_Position = viewProjection * finalWorld * vec4(position, 1.0);\n vec4 worldPos = finalWorld * vec4(position, 1.0);\n vPositionW = vec3(worldPos);\n#ifdef DIFFUSEX\n vTextureUVX = worldPos.zy / tileSize;\n#endif\n#ifdef DIFFUSEY\n vTextureUVY = worldPos.xz / tileSize;\n#endif\n#ifdef DIFFUSEZ\n vTextureUVZ = worldPos.xy / tileSize;\n#endif\n#ifdef NORMAL\n \n vec3 xtan = vec3(0,0,1);\n vec3 xbin = vec3(0,1,0);\n vec3 ytan = vec3(1,0,0);\n vec3 ybin = vec3(0,0,1);\n vec3 ztan = vec3(1,0,0);\n vec3 zbin = vec3(0,1,0);\n vec3 normalizedNormal = normalize(normal);\n normalizedNormal *= normalizedNormal;\n vec3 worldBinormal = normalize(xbin * normalizedNormal.x + ybin * normalizedNormal.y + zbin * normalizedNormal.z);\n vec3 worldTangent = normalize(xtan * normalizedNormal.x + ytan * normalizedNormal.y + ztan * normalizedNormal.z);\n worldTangent = (world * vec4(worldTangent, 1.0)).xyz;\n worldBinormal = (world * vec4(worldBinormal, 1.0)).xyz;\n vec3 worldNormal = normalize(cross(worldTangent, worldBinormal));\n tangentSpace[0] = worldTangent;\n tangentSpace[1] = worldBinormal;\n tangentSpace[2] = worldNormal;\n#endif\n \n#ifdef CLIPPLANE\n fClipDistance = dot(worldPos, vClipPlane);\n#endif\n \n#ifdef FOG\n fFogDistance = (view * worldPos).z;\n#endif\n \n#ifdef SHADOWS\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\n vPositionFromLight0 = lightMatrix0 * worldPos;\n#endif\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\n vPositionFromLight1 = lightMatrix1 * worldPos;\n#endif\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\n vPositionFromLight2 = lightMatrix2 * worldPos;\n#endif\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\n vPositionFromLight3 = lightMatrix3 * worldPos;\n#endif\n#endif\n \n#ifdef VERTEXCOLOR\n vColor = color;\n#endif\n \n#ifdef POINTSIZE\n gl_PointSize = pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['triplanarPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#ifdef LIGHT0\nuniform vec4 vLightData0;\nuniform vec4 vLightDiffuse0;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular0;\n#endif\n#ifdef SHADOW0\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\nvarying vec4 vPositionFromLight0;\nuniform sampler2D shadowSampler0;\n#else\nuniform samplerCube shadowSampler0;\n#endif\nuniform vec3 shadowsInfo0;\n#endif\n#ifdef SPOTLIGHT0\nuniform vec4 vLightDirection0;\n#endif\n#ifdef HEMILIGHT0\nuniform vec3 vLightGround0;\n#endif\n#endif\n#ifdef LIGHT1\nuniform vec4 vLightData1;\nuniform vec4 vLightDiffuse1;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular1;\n#endif\n#ifdef SHADOW1\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\nvarying vec4 vPositionFromLight1;\nuniform sampler2D shadowSampler1;\n#else\nuniform samplerCube shadowSampler1;\n#endif\nuniform vec3 shadowsInfo1;\n#endif\n#ifdef SPOTLIGHT1\nuniform vec4 vLightDirection1;\n#endif\n#ifdef HEMILIGHT1\nuniform vec3 vLightGround1;\n#endif\n#endif\n#ifdef LIGHT2\nuniform vec4 vLightData2;\nuniform vec4 vLightDiffuse2;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular2;\n#endif\n#ifdef SHADOW2\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\nvarying vec4 vPositionFromLight2;\nuniform sampler2D shadowSampler2;\n#else\nuniform samplerCube shadowSampler2;\n#endif\nuniform vec3 shadowsInfo2;\n#endif\n#ifdef SPOTLIGHT2\nuniform vec4 vLightDirection2;\n#endif\n#ifdef HEMILIGHT2\nuniform vec3 vLightGround2;\n#endif\n#endif\n#ifdef LIGHT3\nuniform vec4 vLightData3;\nuniform vec4 vLightDiffuse3;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular3;\n#endif\n#ifdef SHADOW3\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\nvarying vec4 vPositionFromLight3;\nuniform sampler2D shadowSampler3;\n#else\nuniform samplerCube shadowSampler3;\n#endif\nuniform vec3 shadowsInfo3;\n#endif\n#ifdef SPOTLIGHT3\nuniform vec4 vLightDirection3;\n#endif\n#ifdef HEMILIGHT3\nuniform vec3 vLightGround3;\n#endif\n#endif\n\n#ifdef DIFFUSEX\nvarying vec2 vTextureUVX;\nuniform sampler2D diffuseSamplerX;\n#ifdef BUMPX\nuniform sampler2D normalSamplerX;\n#endif\n#endif\n#ifdef DIFFUSEY\nvarying vec2 vTextureUVY;\nuniform sampler2D diffuseSamplerY;\n#ifdef BUMPY\nuniform sampler2D normalSamplerY;\n#endif\n#endif\n#ifdef DIFFUSEZ\nvarying vec2 vTextureUVZ;\nuniform sampler2D diffuseSamplerZ;\n#ifdef BUMPZ\nuniform sampler2D normalSamplerZ;\n#endif\n#endif\n#ifdef NORMAL\nvarying mat3 tangentSpace;\n#endif\n\n#ifdef SHADOWS\nfloat unpack(vec4 color)\n{\n const vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);\n return dot(color, bit_shift);\n}\n#if defined(POINTLIGHT0) || defined(POINTLIGHT1) || defined(POINTLIGHT2) || defined(POINTLIGHT3)\nfloat computeShadowCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float bias)\n{\n vec3 directionToLight = vPositionW - lightPosition;\n float depth = length(directionToLight);\n depth = clamp(depth, 0., 1.0);\n directionToLight = normalize(directionToLight);\n directionToLight.y = - directionToLight.y;\n float shadow = unpack(textureCube(shadowSampler, directionToLight)) + bias;\n if (depth > shadow)\n {\n return darkness;\n }\n return 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition, samplerCube shadowSampler, float mapSize, float bias, float darkness)\n{\n vec3 directionToLight = vPositionW - lightPosition;\n float depth = length(directionToLight);\n depth = clamp(depth, 0., 1.0);\n float diskScale = 2.0 / mapSize;\n directionToLight = normalize(directionToLight);\n directionToLight.y = -directionToLight.y;\n float visibility = 1.;\n vec3 poissonDisk[4];\n poissonDisk[0] = vec3(-1.0, 1.0, -1.0);\n poissonDisk[1] = vec3(1.0, -1.0, -1.0);\n poissonDisk[2] = vec3(-1.0, -1.0, -1.0);\n poissonDisk[3] = vec3(1.0, -1.0, 1.0);\n \n float biasedDepth = depth - bias;\n if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[0] * diskScale)) < biasedDepth) visibility -= 0.25;\n if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[1] * diskScale)) < biasedDepth) visibility -= 0.25;\n if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[2] * diskScale)) < biasedDepth) visibility -= 0.25;\n if (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[3] * diskScale)) < biasedDepth) visibility -= 0.25;\n return min(1.0, visibility + darkness);\n}\n#endif\n#if defined(SPOTLIGHT0) || defined(SPOTLIGHT1) || defined(SPOTLIGHT2) || defined(SPOTLIGHT3) || defined(DIRLIGHT0) || defined(DIRLIGHT1) || defined(DIRLIGHT2) || defined(DIRLIGHT3)\nfloat computeShadow(vec4 vPositionFromLight, sampler2D shadowSampler, float darkness, float bias)\n{\n vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\n depth = 0.5 * depth + vec3(0.5);\n vec2 uv = depth.xy;\n if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)\n {\n return 1.0;\n }\n float shadow = unpack(texture2D(shadowSampler, uv)) + bias;\n if (depth.z > shadow)\n {\n return darkness;\n }\n return 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight, sampler2D shadowSampler, float mapSize, float bias, float darkness)\n{\n vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\n depth = 0.5 * depth + vec3(0.5);\n vec2 uv = depth.xy;\n if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)\n {\n return 1.0;\n }\n float visibility = 1.;\n vec2 poissonDisk[4];\n poissonDisk[0] = vec2(-0.94201624, -0.39906216);\n poissonDisk[1] = vec2(0.94558609, -0.76890725);\n poissonDisk[2] = vec2(-0.094184101, -0.92938870);\n poissonDisk[3] = vec2(0.34495938, 0.29387760);\n \n float biasedDepth = depth.z - bias;\n if (unpack(texture2D(shadowSampler, uv + poissonDisk[0] / mapSize)) < biasedDepth) visibility -= 0.25;\n if (unpack(texture2D(shadowSampler, uv + poissonDisk[1] / mapSize)) < biasedDepth) visibility -= 0.25;\n if (unpack(texture2D(shadowSampler, uv + poissonDisk[2] / mapSize)) < biasedDepth) visibility -= 0.25;\n if (unpack(texture2D(shadowSampler, uv + poissonDisk[3] / mapSize)) < biasedDepth) visibility -= 0.25;\n return min(1.0, visibility + darkness);\n}\n\nfloat unpackHalf(vec2 color)\n{\n return color.x + (color.y / 255.0);\n}\nfloat linstep(float low, float high, float v) {\n return clamp((v - low) / (high - low), 0.0, 1.0);\n}\nfloat ChebychevInequality(vec2 moments, float compare, float bias)\n{\n float p = smoothstep(compare - bias, compare, moments.x);\n float variance = max(moments.y - moments.x * moments.x, 0.02);\n float d = compare - moments.x;\n float p_max = linstep(0.2, 1.0, variance / (variance + d * d));\n return clamp(max(p, p_max), 0.0, 1.0);\n}\nfloat computeShadowWithVSM(vec4 vPositionFromLight, sampler2D shadowSampler, float bias, float darkness)\n{\n vec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\n depth = 0.5 * depth + vec3(0.5);\n vec2 uv = depth.xy;\n if (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0 || depth.z >= 1.0)\n {\n return 1.0;\n }\n vec4 texel = texture2D(shadowSampler, uv);\n vec2 moments = vec2(unpackHalf(texel.xy), unpackHalf(texel.zw));\n return min(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness);\n}\n#endif\n#endif\n#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif\n\n#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying float fFogDistance;\nfloat CalcFogFactor()\n{\n float fogCoeff = 1.0;\n float fogStart = vFogInfos.y;\n float fogEnd = vFogInfos.z;\n float fogDensity = vFogInfos.w;\n if (FOGMODE_LINEAR == vFogInfos.x)\n {\n fogCoeff = (fogEnd - fFogDistance) / (fogEnd - fogStart);\n }\n else if (FOGMODE_EXP == vFogInfos.x)\n {\n fogCoeff = 1.0 / pow(E, fFogDistance * fogDensity);\n }\n else if (FOGMODE_EXP2 == vFogInfos.x)\n {\n fogCoeff = 1.0 / pow(E, fFogDistance * fFogDistance * fogDensity * fogDensity);\n }\n return clamp(fogCoeff, 0.0, 1.0);\n}\n#endif\n\nstruct lightingInfo\n{\n vec3 diffuse;\n#ifdef SPECULARTERM\n vec3 specular;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float glossiness) {\n lightingInfo result;\n vec3 lightVectorW;\n float attenuation = 1.0;\n if (lightData.w == 0.)\n {\n vec3 direction = lightData.xyz - vPositionW;\n attenuation = max(0., 1.0 - length(direction) / range);\n lightVectorW = normalize(direction);\n }\n else\n {\n lightVectorW = normalize(-lightData.xyz);\n }\n \n float ndl = max(0., dot(vNormal, lightVectorW));\n result.diffuse = ndl * diffuseColor * attenuation;\n#ifdef SPECULARTERM\n \n vec3 angleW = normalize(viewDirectionW + lightVectorW);\n float specComp = max(0., dot(vNormal, angleW));\n specComp = pow(specComp, max(1., glossiness));\n result.specular = specComp * specularColor * attenuation;\n#endif\n return result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float glossiness) {\n lightingInfo result;\n vec3 direction = lightData.xyz - vPositionW;\n vec3 lightVectorW = normalize(direction);\n float attenuation = max(0., 1.0 - length(direction) / range);\n \n float cosAngle = max(0., dot(-lightDirection.xyz, lightVectorW));\n float spotAtten = 0.0;\n if (cosAngle >= lightDirection.w)\n {\n cosAngle = max(0., pow(cosAngle, lightData.w));\n spotAtten = clamp((cosAngle - lightDirection.w) / (1. - cosAngle), 0.0, 1.0);\n \n float ndl = max(0., dot(vNormal, -lightDirection.xyz));\n result.diffuse = ndl * spotAtten * diffuseColor * attenuation;\n#ifdef SPECULARTERM\n \n vec3 angleW = normalize(viewDirectionW - lightDirection.xyz);\n float specComp = max(0., dot(vNormal, angleW));\n specComp = pow(specComp, max(1., glossiness));\n result.specular = specComp * specularColor * spotAtten * attenuation;\n#endif\n return result;\n }\n result.diffuse = vec3(0.);\n#ifdef SPECULARTERM\n result.specular = vec3(0.);\n#endif\n return result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float glossiness) {\n lightingInfo result;\n \n float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;\n result.diffuse = mix(groundColor, diffuseColor, ndl);\n#ifdef SPECULARTERM\n \n vec3 angleW = normalize(viewDirectionW + lightData.xyz);\n float specComp = max(0., dot(vNormal, angleW));\n specComp = pow(specComp, max(1., glossiness));\n result.specular = specComp * specularColor;\n#endif\n return result;\n}\nvoid main(void) {\n \n#ifdef CLIPPLANE\n if (fClipDistance > 0.0)\n discard;\n#endif\n vec3 viewDirectionW = normalize(vEyePosition - vPositionW);\n \n vec4 baseColor = vec4(0., 0., 0., 1.);\n vec3 diffuseColor = vDiffuseColor.rgb;\n#ifdef SPECULARTERM\n float glossiness = vSpecularColor.a;\n vec3 specularColor = vSpecularColor.rgb;\n#else\n float glossiness = 0.;\n#endif\n \n float alpha = vDiffuseColor.a;\n \n#ifdef NORMAL\n vec3 normalW = tangentSpace[2];\n#else\n vec3 normalW = vec3(1.0, 1.0, 1.0);\n#endif\n vec4 baseNormal = vec4(0.0, 0.0, 0.0, 1.0);\n normalW *= normalW;\n#ifdef DIFFUSEX\n baseColor += texture2D(diffuseSamplerX, vTextureUVX) * normalW.x;\n#ifdef BUMPX\n baseNormal += texture2D(normalSamplerX, vTextureUVX) * normalW.x;\n#endif\n#endif\n#ifdef DIFFUSEY\n baseColor += texture2D(diffuseSamplerY, vTextureUVY) * normalW.y;\n#ifdef BUMPY\n baseNormal += texture2D(normalSamplerY, vTextureUVY) * normalW.y;\n#endif\n#endif\n#ifdef DIFFUSEZ\n baseColor += texture2D(diffuseSamplerZ, vTextureUVZ) * normalW.z;\n#ifdef BUMPZ\n baseNormal += texture2D(normalSamplerZ, vTextureUVZ) * normalW.z;\n#endif\n#endif\n#ifdef NORMAL\n normalW = normalize((2.0 * baseNormal.xyz - 1.0) * tangentSpace);\n#endif\n#ifdef ALPHATEST\n if (baseColor.a < 0.4)\n discard;\n#endif\n#ifdef VERTEXCOLOR\n baseColor.rgb *= vColor.rgb;\n#endif\n \n vec3 diffuseBase = vec3(0., 0., 0.);\n#ifdef SPECULARTERM\n vec3 specularBase = vec3(0., 0., 0.);\n#endif\n float shadow = 1.;\n#ifdef LIGHT0\n#ifndef SPECULARTERM\n vec3 vLightSpecular0 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT0\n lightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, glossiness);\n#endif\n#ifdef HEMILIGHT0\n lightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightGround0, glossiness);\n#endif\n#if defined(POINTLIGHT0) || defined(DIRLIGHT0)\n lightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, glossiness);\n#endif\n#ifdef SHADOW0\n#ifdef SHADOWVSM0\n shadow = computeShadowWithVSM(vPositionFromLight0, shadowSampler0, shadowsInfo0.z, shadowsInfo0.x);\n#else\n#ifdef SHADOWPCF0\n#if defined(POINTLIGHT0)\n shadow = computeShadowWithPCFCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);\n#else\n shadow = computeShadowWithPCF(vPositionFromLight0, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);\n#endif\n#else\n#if defined(POINTLIGHT0)\n shadow = computeShadowCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);\n#else\n shadow = computeShadow(vPositionFromLight0, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);\n#endif\n#endif\n#endif\n#else\n shadow = 1.;\n#endif\n diffuseBase += info.diffuse * shadow;\n#ifdef SPECULARTERM\n specularBase += info.specular * shadow;\n#endif\n#endif\n#ifdef LIGHT1\n#ifndef SPECULARTERM\n vec3 vLightSpecular1 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT1\n info = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, glossiness);\n#endif\n#ifdef HEMILIGHT1\n info = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightGround1, glossiness);\n#endif\n#if defined(POINTLIGHT1) || defined(DIRLIGHT1)\n info = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, glossiness);\n#endif\n#ifdef SHADOW1\n#ifdef SHADOWVSM1\n shadow = computeShadowWithVSM(vPositionFromLight1, shadowSampler1, shadowsInfo1.z, shadowsInfo1.x);\n#else\n#ifdef SHADOWPCF1\n#if defined(POINTLIGHT1)\n shadow = computeShadowWithPCFCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);\n#else\n shadow = computeShadowWithPCF(vPositionFromLight1, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);\n#endif\n#else\n#if defined(POINTLIGHT1)\n shadow = computeShadowCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);\n#else\n shadow = computeShadow(vPositionFromLight1, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);\n#endif\n#endif\n#endif\n#else\n shadow = 1.;\n#endif\n diffuseBase += info.diffuse * shadow;\n#ifdef SPECULARTERM\n specularBase += info.specular * shadow;\n#endif\n#endif\n#ifdef LIGHT2\n#ifndef SPECULARTERM\n vec3 vLightSpecular2 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT2\n info = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, glossiness);\n#endif\n#ifdef HEMILIGHT2\n info = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightGround2, glossiness);\n#endif\n#if defined(POINTLIGHT2) || defined(DIRLIGHT2)\n info = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, glossiness);\n#endif\n#ifdef SHADOW2\n#ifdef SHADOWVSM2\n shadow = computeShadowWithVSM(vPositionFromLight2, shadowSampler2, shadowsInfo2.z, shadowsInfo2.x);\n#else\n#ifdef SHADOWPCF2\n#if defined(POINTLIGHT2)\n shadow = computeShadowWithPCFCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);\n#else\n shadow = computeShadowWithPCF(vPositionFromLight2, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);\n#endif\n#else\n#if defined(POINTLIGHT2)\n shadow = computeShadowCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);\n#else\n shadow = computeShadow(vPositionFromLight2, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);\n#endif\n#endif \n#endif \n#else\n shadow = 1.;\n#endif\n diffuseBase += info.diffuse * shadow;\n#ifdef SPECULARTERM\n specularBase += info.specular * shadow;\n#endif\n#endif\n#ifdef LIGHT3\n#ifndef SPECULARTERM\n vec3 vLightSpecular3 = vec3(0.0);\n#endif\n#ifdef SPOTLIGHT3\n info = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, glossiness);\n#endif\n#ifdef HEMILIGHT3\n info = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightGround3, glossiness);\n#endif\n#if defined(POINTLIGHT3) || defined(DIRLIGHT3)\n info = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, glossiness);\n#endif\n#ifdef SHADOW3\n#ifdef SHADOWVSM3\n shadow = computeShadowWithVSM(vPositionFromLight3, shadowSampler3, shadowsInfo3.z, shadowsInfo3.x);\n#else\n#ifdef SHADOWPCF3\n#if defined(POINTLIGHT3)\n shadow = computeShadowWithPCFCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);\n#else\n shadow = computeShadowWithPCF(vPositionFromLight3, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);\n#endif\n#else\n#if defined(POINTLIGHT3)\n shadow = computeShadowCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);\n#else\n shadow = computeShadow(vPositionFromLight3, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);\n#endif\n#endif \n#endif \n#else\n shadow = 1.;\n#endif\n diffuseBase += info.diffuse * shadow;\n#ifdef SPECULARTERM\n specularBase += info.specular * shadow;\n#endif\n#endif\n#ifdef VERTEXALPHA\n alpha *= vColor.a;\n#endif\n#ifdef SPECULARTERM\n vec3 finalSpecular = specularBase * specularColor;\n#else\n vec3 finalSpecular = vec3(0.0);\n#endif\n vec3 finalDiffuse = clamp(diffuseBase * diffuseColor, 0.0, 1.0) * baseColor.rgb;\n \n vec4 color = vec4(finalDiffuse + finalSpecular, alpha);\n#ifdef FOG\n float fog = CalcFogFactor();\n color.rgb = fog * color.rgb + (1.0 - fog) * vFogColor;\n#endif\n gl_FragColor = color;\n}\n";
