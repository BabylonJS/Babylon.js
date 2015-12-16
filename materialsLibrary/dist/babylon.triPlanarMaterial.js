/// <reference path="../../../dist/preview release/babylon.d.ts"/>

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
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
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
            var newMaterial = new TriPlanarMaterial(name, this.getScene());
            // Base material
            this.copyTo(newMaterial);
            // Simple material
            if (this.mixTexture && this.mixTexture.clone) {
                newMaterial.mixTexture = this.mixTexture.clone();
            }
            newMaterial.diffuseColor = this.diffuseColor.clone();
            return newMaterial;
        };
        TriPlanarMaterial.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.customType = "BABYLON.TerrainMaterial";
            serializationObject.diffuseColor = this.diffuseColor.asArray();
            serializationObject.specularColor = this.specularColor.asArray();
            serializationObject.specularPower = this.specularPower;
            serializationObject.disableLighting = this.disableLighting;
            if (this.diffuseTextureX) {
                serializationObject.diffuseTextureX = this.diffuseTextureX.serialize();
            }
            if (this.diffuseTextureY) {
                serializationObject.diffuseTextureY = this.diffuseTextureY.serialize();
            }
            if (this.diffuseTextureZ) {
                serializationObject.diffuseTextureZ = this.diffuseTextureZ.serialize();
            }
            return serializationObject;
        };
        TriPlanarMaterial.Parse = function (source, scene, rootUrl) {
            var material = new TriPlanarMaterial(source.name, scene);
            material.diffuseColor = BABYLON.Color3.FromArray(source.diffuseColor);
            material.specularColor = BABYLON.Color3.FromArray(source.specularColor);
            material.specularPower = source.specularPower;
            material.disableLighting = source.disableLighting;
            material.alpha = source.alpha;
            material.id = source.id;
            BABYLON.Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;
            if (source.diffuseTextureX) {
                material.diffuseTextureX = BABYLON.Texture.Parse(source.diffuseTextureX, scene, rootUrl);
            }
            if (source.diffuseTextureY) {
                material.diffuseTextureY = BABYLON.Texture.Parse(source.diffuseTextureY, scene, rootUrl);
            }
            if (source.diffuseTextureZ) {
                material.diffuseTextureZ = BABYLON.Texture.Parse(source.diffuseTextureZ, scene, rootUrl);
            }
            return material;
        };
        return TriPlanarMaterial;
    })(BABYLON.Material);
    BABYLON.TriPlanarMaterial = TriPlanarMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['triplanarVertexShader'] = "precision highp float;\r\n\r\n// Attributes\r\nattribute vec3 position;\r\n#ifdef NORMAL\r\nattribute vec3 normal;\r\n#endif\r\n#ifdef VERTEXCOLOR\r\nattribute vec4 color;\r\n#endif\r\n#ifdef BONES\r\nattribute vec4 matricesIndices;\r\nattribute vec4 matricesWeights;\r\n#endif\r\n\r\n// Uniforms\r\n\r\n#ifdef INSTANCES\r\nattribute vec4 world0;\r\nattribute vec4 world1;\r\nattribute vec4 world2;\r\nattribute vec4 world3;\r\n#else\r\nuniform mat4 world;\r\n#endif\r\n\r\nuniform mat4 view;\r\nuniform mat4 viewProjection;\r\n\r\n#ifdef DIFFUSEX\r\nvarying vec2 vTextureUVX;\r\n#endif\r\n\r\n#ifdef DIFFUSEY\r\nvarying vec2 vTextureUVY;\r\n#endif\r\n\r\n#ifdef DIFFUSEZ\r\nvarying vec2 vTextureUVZ;\r\n#endif\r\n\r\nuniform float tileSize;\r\n\r\n#ifdef BONES\r\nuniform mat4 mBones[BonesPerMesh];\r\n#endif\r\n\r\n#ifdef POINTSIZE\r\nuniform float pointSize;\r\n#endif\r\n\r\n// Output\r\nvarying vec3 vPositionW;\r\n#ifdef NORMAL\r\nvarying mat3 tangentSpace;\r\n#endif\r\n\r\n#ifdef VERTEXCOLOR\r\nvarying vec4 vColor;\r\n#endif\r\n\r\n#ifdef CLIPPLANE\r\nuniform vec4 vClipPlane;\r\nvarying float fClipDistance;\r\n#endif\r\n\r\n#ifdef FOG\r\nvarying float fFogDistance;\r\n#endif\r\n\r\n#ifdef SHADOWS\r\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\r\nuniform mat4 lightMatrix0;\r\nvarying vec4 vPositionFromLight0;\r\n#endif\r\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\r\nuniform mat4 lightMatrix1;\r\nvarying vec4 vPositionFromLight1;\r\n#endif\r\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\r\nuniform mat4 lightMatrix2;\r\nvarying vec4 vPositionFromLight2;\r\n#endif\r\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\r\nuniform mat4 lightMatrix3;\r\nvarying vec4 vPositionFromLight3;\r\n#endif\r\n#endif\r\n\r\nvoid main(void) {\r\n\tmat4 finalWorld;\r\n\r\n#ifdef INSTANCES\r\n\tfinalWorld = mat4(world0, world1, world2, world3);\r\n#else\r\n\tfinalWorld = world;\r\n#endif\r\n\r\n#ifdef BONES\r\n\tmat4 m0 = mBones[int(matricesIndices.x)] * matricesWeights.x;\r\n\tmat4 m1 = mBones[int(matricesIndices.y)] * matricesWeights.y;\r\n\tmat4 m2 = mBones[int(matricesIndices.z)] * matricesWeights.z;\r\n\r\n#ifdef BONES4\r\n\tmat4 m3 = mBones[int(matricesIndices.w)] * matricesWeights.w;\r\n\tfinalWorld = finalWorld * (m0 + m1 + m2 + m3);\r\n#else\r\n\tfinalWorld = finalWorld * (m0 + m1 + m2);\r\n#endif \r\n\r\n#endif\r\n\tgl_Position = viewProjection * finalWorld * vec4(position, 1.0);\r\n\r\n\tvec4 worldPos = finalWorld * vec4(position, 1.0);\r\n\tvPositionW = vec3(worldPos);\r\n\r\n#ifdef DIFFUSEX\r\n\tvTextureUVX = worldPos.zy / tileSize;\r\n#endif\r\n\r\n#ifdef DIFFUSEY\r\n\tvTextureUVY = worldPos.xz / tileSize;\r\n#endif\r\n\r\n#ifdef DIFFUSEZ\r\n\tvTextureUVZ = worldPos.xy / tileSize;\r\n#endif\r\n\r\n#ifdef NORMAL\r\n\t// Compute tangent space (used for normal mapping + tri planar color mapping)\r\n\tvec3 xtan = vec3(0,0,1);//tangent space for the X aligned plane\r\n   \tvec3 xbin = vec3(0,1,0);\r\n   \r\n   \tvec3 ytan = vec3(1,0,0);//tangent space for the Y aligned plane\r\n   \tvec3 ybin = vec3(0,0,1);\r\n   \r\n   \tvec3 ztan = vec3(1,0,0);//tangent space for the Z aligned plane\r\n   \tvec3 zbin = vec3(0,1,0);\r\n\t   \r\n\tvec3 normalizedNormal = normalize(normal);\r\n   \tnormalizedNormal *= normalizedNormal;\r\n\r\n\tvec3 worldBinormal = normalize(xbin * normalizedNormal.x + ybin * normalizedNormal.y + zbin * normalizedNormal.z);\r\n   \tvec3 worldTangent = normalize(xtan * normalizedNormal.x + ytan * normalizedNormal.y + ztan * normalizedNormal.z);\r\n\t   \r\n\tworldTangent = (world * vec4(worldTangent, 1.0)).xyz;\r\n    worldBinormal = (world * vec4(worldBinormal, 1.0)).xyz;\r\n\tvec3 worldNormal = normalize(cross(worldTangent, worldBinormal));\r\n\r\n\ttangentSpace[0] = worldTangent;\r\n    tangentSpace[1] = worldBinormal;\r\n    tangentSpace[2] = worldNormal;\r\n#endif\r\n\r\n\t// Clip plane\r\n#ifdef CLIPPLANE\r\n\tfClipDistance = dot(worldPos, vClipPlane);\r\n#endif\r\n\r\n\t// Fog\r\n#ifdef FOG\r\n\tfFogDistance = (view * worldPos).z;\r\n#endif\r\n\r\n\t// Shadows\r\n#ifdef SHADOWS\r\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\r\n\tvPositionFromLight0 = lightMatrix0 * worldPos;\r\n#endif\r\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\r\n\tvPositionFromLight1 = lightMatrix1 * worldPos;\r\n#endif\r\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\r\n\tvPositionFromLight2 = lightMatrix2 * worldPos;\r\n#endif\r\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\r\n\tvPositionFromLight3 = lightMatrix3 * worldPos;\r\n#endif\r\n#endif\r\n\r\n\t// Vertex color\r\n#ifdef VERTEXCOLOR\r\n\tvColor = color;\r\n#endif\r\n\r\n\t// Point size\r\n#ifdef POINTSIZE\r\n\tgl_PointSize = pointSize;\r\n#endif\r\n}\r\n";
BABYLON.Effect.ShadersStore['triplanarPixelShader'] = "precision highp float;\r\n\r\n// Constants\r\nuniform vec3 vEyePosition;\r\nuniform vec4 vDiffuseColor;\r\n\r\n#ifdef SPECULARTERM\r\nuniform vec4 vSpecularColor;\r\n#endif\r\n\r\n// Input\r\nvarying vec3 vPositionW;\r\n\r\n#ifdef VERTEXCOLOR\r\nvarying vec4 vColor;\r\n#endif\r\n\r\n// Lights\r\n#ifdef LIGHT0\r\nuniform vec4 vLightData0;\r\nuniform vec4 vLightDiffuse0;\r\n#ifdef SPECULARTERM\r\nuniform vec3 vLightSpecular0;\r\n#endif\r\n#ifdef SHADOW0\r\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\r\nvarying vec4 vPositionFromLight0;\r\nuniform sampler2D shadowSampler0;\r\n#else\r\nuniform samplerCube shadowSampler0;\r\n#endif\r\nuniform vec3 shadowsInfo0;\r\n#endif\r\n#ifdef SPOTLIGHT0\r\nuniform vec4 vLightDirection0;\r\n#endif\r\n#ifdef HEMILIGHT0\r\nuniform vec3 vLightGround0;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT1\r\nuniform vec4 vLightData1;\r\nuniform vec4 vLightDiffuse1;\r\n#ifdef SPECULARTERM\r\nuniform vec3 vLightSpecular1;\r\n#endif\r\n#ifdef SHADOW1\r\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\r\nvarying vec4 vPositionFromLight1;\r\nuniform sampler2D shadowSampler1;\r\n#else\r\nuniform samplerCube shadowSampler1;\r\n#endif\r\nuniform vec3 shadowsInfo1;\r\n#endif\r\n#ifdef SPOTLIGHT1\r\nuniform vec4 vLightDirection1;\r\n#endif\r\n#ifdef HEMILIGHT1\r\nuniform vec3 vLightGround1;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT2\r\nuniform vec4 vLightData2;\r\nuniform vec4 vLightDiffuse2;\r\n#ifdef SPECULARTERM\r\nuniform vec3 vLightSpecular2;\r\n#endif\r\n#ifdef SHADOW2\r\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\r\nvarying vec4 vPositionFromLight2;\r\nuniform sampler2D shadowSampler2;\r\n#else\r\nuniform samplerCube shadowSampler2;\r\n#endif\r\nuniform vec3 shadowsInfo2;\r\n#endif\r\n#ifdef SPOTLIGHT2\r\nuniform vec4 vLightDirection2;\r\n#endif\r\n#ifdef HEMILIGHT2\r\nuniform vec3 vLightGround2;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT3\r\nuniform vec4 vLightData3;\r\nuniform vec4 vLightDiffuse3;\r\n#ifdef SPECULARTERM\r\nuniform vec3 vLightSpecular3;\r\n#endif\r\n#ifdef SHADOW3\r\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\r\nvarying vec4 vPositionFromLight3;\r\nuniform sampler2D shadowSampler3;\r\n#else\r\nuniform samplerCube shadowSampler3;\r\n#endif\r\nuniform vec3 shadowsInfo3;\r\n#endif\r\n#ifdef SPOTLIGHT3\r\nuniform vec4 vLightDirection3;\r\n#endif\r\n#ifdef HEMILIGHT3\r\nuniform vec3 vLightGround3;\r\n#endif\r\n#endif\r\n\r\n// Samplers\r\n#ifdef DIFFUSEX\r\nvarying vec2 vTextureUVX;\r\nuniform sampler2D diffuseSamplerX;\r\n#ifdef BUMPX\r\nuniform sampler2D normalSamplerX;\r\n#endif\r\n#endif\r\n\r\n#ifdef DIFFUSEY\r\nvarying vec2 vTextureUVY;\r\nuniform sampler2D diffuseSamplerY;\r\n#ifdef BUMPY\r\nuniform sampler2D normalSamplerY;\r\n#endif\r\n#endif\r\n\r\n#ifdef DIFFUSEZ\r\nvarying vec2 vTextureUVZ;\r\nuniform sampler2D diffuseSamplerZ;\r\n#ifdef BUMPZ\r\nuniform sampler2D normalSamplerZ;\r\n#endif\r\n#endif\r\n\r\n#ifdef NORMAL\r\nvarying mat3 tangentSpace;\r\n#endif\r\n\r\n// Shadows\r\n#ifdef SHADOWS\r\n\r\nfloat unpack(vec4 color)\r\n{\r\n\tconst vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);\r\n\treturn dot(color, bit_shift);\r\n}\r\n\r\n#if defined(POINTLIGHT0) || defined(POINTLIGHT1) || defined(POINTLIGHT2) || defined(POINTLIGHT3)\r\nfloat computeShadowCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float bias)\r\n{\r\n\tvec3 directionToLight = vPositionW - lightPosition;\r\n\tfloat depth = length(directionToLight);\r\n\tdepth = clamp(depth, 0., 1.0);\r\n\r\n\tdirectionToLight = normalize(directionToLight);\r\n\tdirectionToLight.y = - directionToLight.y;\r\n\r\n\tfloat shadow = unpack(textureCube(shadowSampler, directionToLight)) + bias;\r\n\r\n\tif (depth > shadow)\r\n\t{\r\n\t\treturn darkness;\r\n\t}\r\n\treturn 1.0;\r\n}\r\n\r\nfloat computeShadowWithPCFCube(vec3 lightPosition, samplerCube shadowSampler, float mapSize, float bias, float darkness)\r\n{\r\n\tvec3 directionToLight = vPositionW - lightPosition;\r\n\tfloat depth = length(directionToLight);\r\n\r\n\tdepth = clamp(depth, 0., 1.0);\r\n\tfloat diskScale = 2.0 / mapSize;\r\n\r\n\tdirectionToLight = normalize(directionToLight);\r\n\tdirectionToLight.y = -directionToLight.y;\r\n\r\n\tfloat visibility = 1.;\r\n\r\n\tvec3 poissonDisk[4];\r\n\tpoissonDisk[0] = vec3(-1.0, 1.0, -1.0);\r\n\tpoissonDisk[1] = vec3(1.0, -1.0, -1.0);\r\n\tpoissonDisk[2] = vec3(-1.0, -1.0, -1.0);\r\n\tpoissonDisk[3] = vec3(1.0, -1.0, 1.0);\r\n\r\n\t// Poisson Sampling\r\n\tfloat biasedDepth = depth - bias;\r\n\r\n\tif (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[0] * diskScale)) < biasedDepth) visibility -= 0.25;\r\n\tif (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[1] * diskScale)) < biasedDepth) visibility -= 0.25;\r\n\tif (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[2] * diskScale)) < biasedDepth) visibility -= 0.25;\r\n\tif (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[3] * diskScale)) < biasedDepth) visibility -= 0.25;\r\n\r\n\treturn  min(1.0, visibility + darkness);\r\n}\r\n#endif\r\n\r\n#if defined(SPOTLIGHT0) || defined(SPOTLIGHT1) || defined(SPOTLIGHT2) || defined(SPOTLIGHT3) ||  defined(DIRLIGHT0) || defined(DIRLIGHT1) || defined(DIRLIGHT2) || defined(DIRLIGHT3)\r\nfloat computeShadow(vec4 vPositionFromLight, sampler2D shadowSampler, float darkness, float bias)\r\n{\r\n\tvec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\r\n\tdepth = 0.5 * depth + vec3(0.5);\r\n\tvec2 uv = depth.xy;\r\n\r\n\tif (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)\r\n\t{\r\n\t\treturn 1.0;\r\n\t}\r\n\r\n\tfloat shadow = unpack(texture2D(shadowSampler, uv)) + bias;\r\n\r\n\tif (depth.z > shadow)\r\n\t{\r\n\t\treturn darkness;\r\n\t}\r\n\treturn 1.;\r\n}\r\n\r\nfloat computeShadowWithPCF(vec4 vPositionFromLight, sampler2D shadowSampler, float mapSize, float bias, float darkness)\r\n{\r\n\tvec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\r\n\tdepth = 0.5 * depth + vec3(0.5);\r\n\tvec2 uv = depth.xy;\r\n\r\n\tif (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)\r\n\t{\r\n\t\treturn 1.0;\r\n\t}\r\n\r\n\tfloat visibility = 1.;\r\n\r\n\tvec2 poissonDisk[4];\r\n\tpoissonDisk[0] = vec2(-0.94201624, -0.39906216);\r\n\tpoissonDisk[1] = vec2(0.94558609, -0.76890725);\r\n\tpoissonDisk[2] = vec2(-0.094184101, -0.92938870);\r\n\tpoissonDisk[3] = vec2(0.34495938, 0.29387760);\r\n\r\n\t// Poisson Sampling\r\n\tfloat biasedDepth = depth.z - bias;\r\n\r\n\tif (unpack(texture2D(shadowSampler, uv + poissonDisk[0] / mapSize)) < biasedDepth) visibility -= 0.25;\r\n\tif (unpack(texture2D(shadowSampler, uv + poissonDisk[1] / mapSize)) < biasedDepth) visibility -= 0.25;\r\n\tif (unpack(texture2D(shadowSampler, uv + poissonDisk[2] / mapSize)) < biasedDepth) visibility -= 0.25;\r\n\tif (unpack(texture2D(shadowSampler, uv + poissonDisk[3] / mapSize)) < biasedDepth) visibility -= 0.25;\r\n\r\n\treturn  min(1.0, visibility + darkness);\r\n}\r\n\r\n// Thanks to http://devmaster.net/\r\nfloat unpackHalf(vec2 color)\r\n{\r\n\treturn color.x + (color.y / 255.0);\r\n}\r\n\r\nfloat linstep(float low, float high, float v) {\r\n\treturn clamp((v - low) / (high - low), 0.0, 1.0);\r\n}\r\n\r\nfloat ChebychevInequality(vec2 moments, float compare, float bias)\r\n{\r\n\tfloat p = smoothstep(compare - bias, compare, moments.x);\r\n\tfloat variance = max(moments.y - moments.x * moments.x, 0.02);\r\n\tfloat d = compare - moments.x;\r\n\tfloat p_max = linstep(0.2, 1.0, variance / (variance + d * d));\r\n\r\n\treturn clamp(max(p, p_max), 0.0, 1.0);\r\n}\r\n\r\nfloat computeShadowWithVSM(vec4 vPositionFromLight, sampler2D shadowSampler, float bias, float darkness)\r\n{\r\n\tvec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\r\n\tdepth = 0.5 * depth + vec3(0.5);\r\n\tvec2 uv = depth.xy;\r\n\r\n\tif (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0 || depth.z >= 1.0)\r\n\t{\r\n\t\treturn 1.0;\r\n\t}\r\n\r\n\tvec4 texel = texture2D(shadowSampler, uv);\r\n\r\n\tvec2 moments = vec2(unpackHalf(texel.xy), unpackHalf(texel.zw));\r\n\treturn min(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness);\r\n}\r\n#endif\r\n#endif\r\n\r\n\r\n#ifdef CLIPPLANE\r\nvarying float fClipDistance;\r\n#endif\r\n\r\n// Fog\r\n#ifdef FOG\r\n\r\n#define FOGMODE_NONE    0.\r\n#define FOGMODE_EXP     1.\r\n#define FOGMODE_EXP2    2.\r\n#define FOGMODE_LINEAR  3.\r\n#define E 2.71828\r\n\r\nuniform vec4 vFogInfos;\r\nuniform vec3 vFogColor;\r\nvarying float fFogDistance;\r\n\r\nfloat CalcFogFactor()\r\n{\r\n\tfloat fogCoeff = 1.0;\r\n\tfloat fogStart = vFogInfos.y;\r\n\tfloat fogEnd = vFogInfos.z;\r\n\tfloat fogDensity = vFogInfos.w;\r\n\r\n\tif (FOGMODE_LINEAR == vFogInfos.x)\r\n\t{\r\n\t\tfogCoeff = (fogEnd - fFogDistance) / (fogEnd - fogStart);\r\n\t}\r\n\telse if (FOGMODE_EXP == vFogInfos.x)\r\n\t{\r\n\t\tfogCoeff = 1.0 / pow(E, fFogDistance * fogDensity);\r\n\t}\r\n\telse if (FOGMODE_EXP2 == vFogInfos.x)\r\n\t{\r\n\t\tfogCoeff = 1.0 / pow(E, fFogDistance * fFogDistance * fogDensity * fogDensity);\r\n\t}\r\n\r\n\treturn clamp(fogCoeff, 0.0, 1.0);\r\n}\r\n#endif\r\n\r\n// Light Computing\r\nstruct lightingInfo\r\n{\r\n\tvec3 diffuse;\r\n#ifdef SPECULARTERM\r\n\tvec3 specular;\r\n#endif\r\n};\r\n\r\nlightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, float range, float glossiness) {\r\n\tlightingInfo result;\r\n\r\n\tvec3 lightVectorW;\r\n\tfloat attenuation = 1.0;\r\n\tif (lightData.w == 0.)\r\n\t{\r\n\t\tvec3 direction = lightData.xyz - vPositionW;\r\n\r\n\t\tattenuation = max(0., 1.0 - length(direction) / range);\r\n\t\tlightVectorW = normalize(direction);\r\n\t}\r\n\telse\r\n\t{\r\n\t\tlightVectorW = normalize(-lightData.xyz);\r\n\t}\r\n\r\n\t// diffuse\r\n\tfloat ndl = max(0., dot(vNormal, lightVectorW));\r\n\tresult.diffuse = ndl * diffuseColor * attenuation;\r\n\r\n#ifdef SPECULARTERM\r\n\t// Specular\r\n\tvec3 angleW = normalize(viewDirectionW + lightVectorW);\r\n\tfloat specComp = max(0., dot(vNormal, angleW));\r\n\tspecComp = pow(specComp, max(1., glossiness));\r\n\r\n\tresult.specular = specComp * specularColor * attenuation;\r\n#endif\r\n\treturn result;\r\n}\r\n\r\nlightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, vec3 specularColor, float range, float glossiness) {\r\n\tlightingInfo result;\r\n\r\n\tvec3 direction = lightData.xyz - vPositionW;\r\n\tvec3 lightVectorW = normalize(direction);\r\n\tfloat attenuation = max(0., 1.0 - length(direction) / range);\r\n\r\n\t// diffuse\r\n\tfloat cosAngle = max(0., dot(-lightDirection.xyz, lightVectorW));\r\n\tfloat spotAtten = 0.0;\r\n\r\n\tif (cosAngle >= lightDirection.w)\r\n\t{\r\n\t\tcosAngle = max(0., pow(cosAngle, lightData.w));\r\n\t\tspotAtten = clamp((cosAngle - lightDirection.w) / (1. - cosAngle), 0.0, 1.0);\r\n\r\n\t\t// Diffuse\r\n\t\tfloat ndl = max(0., dot(vNormal, -lightDirection.xyz));\r\n\t\tresult.diffuse = ndl * spotAtten * diffuseColor * attenuation;\r\n\r\n#ifdef SPECULARTERM\r\n\t\t// Specular\r\n\t\tvec3 angleW = normalize(viewDirectionW - lightDirection.xyz);\r\n\t\tfloat specComp = max(0., dot(vNormal, angleW));\r\n\t\tspecComp = pow(specComp, max(1., glossiness));\r\n\r\n\t\tresult.specular = specComp * specularColor * spotAtten * attenuation;\r\n#endif\r\n\r\n\t\treturn result;\r\n\t}\r\n\r\n\tresult.diffuse = vec3(0.);\r\n#ifdef SPECULARTERM\r\n\tresult.specular = vec3(0.);\r\n#endif\r\n\r\n\treturn result;\r\n}\r\n\r\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float glossiness) {\r\n\tlightingInfo result;\r\n\r\n\t// Diffuse\r\n\tfloat ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;\r\n\tresult.diffuse = mix(groundColor, diffuseColor, ndl);\r\n\r\n#ifdef SPECULARTERM\r\n\t// Specular\r\n\tvec3 angleW = normalize(viewDirectionW + lightData.xyz);\r\n\tfloat specComp = max(0., dot(vNormal, angleW));\r\n\tspecComp = pow(specComp, max(1., glossiness));\r\n\r\n\tresult.specular = specComp * specularColor;\r\n#endif\r\n\r\n\treturn result;\r\n}\r\n\r\nvoid main(void) {\r\n\t// Clip plane\r\n#ifdef CLIPPLANE\r\n\tif (fClipDistance > 0.0)\r\n\t\tdiscard;\r\n#endif\r\n\r\n\tvec3 viewDirectionW = normalize(vEyePosition - vPositionW);\r\n\r\n\t// Base color\r\n\tvec4 baseColor = vec4(0., 0., 0., 1.);\r\n\tvec3 diffuseColor = vDiffuseColor.rgb;\r\n\t\r\n#ifdef SPECULARTERM\r\n\tfloat glossiness = vSpecularColor.a;\r\n\tvec3 specularColor = vSpecularColor.rgb;\r\n#else\r\n\tfloat glossiness = 0.;\r\n#endif\r\n\r\n\t// Alpha\r\n\tfloat alpha = vDiffuseColor.a;\r\n\t\r\n\t// Bump\r\n#ifdef NORMAL\r\n\tvec3 normalW = tangentSpace[2];\r\n#else\r\n\tvec3 normalW = vec3(1.0, 1.0, 1.0);\r\n#endif\r\n\r\n\tvec4 baseNormal = vec4(0.0, 0.0, 0.0, 1.0);\r\n\tnormalW *= normalW;\r\n\r\n#ifdef DIFFUSEX\r\n\tbaseColor += texture2D(diffuseSamplerX, vTextureUVX) * normalW.x;\r\n#ifdef BUMPX\r\n\tbaseNormal += texture2D(normalSamplerX, vTextureUVX) * normalW.x;\r\n#endif\r\n#endif\r\n\r\n#ifdef DIFFUSEY\r\n\tbaseColor += texture2D(diffuseSamplerY, vTextureUVY) * normalW.y;\r\n#ifdef BUMPY\r\n\tbaseNormal += texture2D(normalSamplerY, vTextureUVY) * normalW.y;\r\n#endif\r\n#endif\r\n\r\n#ifdef DIFFUSEZ\r\n\tbaseColor += texture2D(diffuseSamplerZ, vTextureUVZ) * normalW.z;\r\n#ifdef BUMPZ\r\n\tbaseNormal += texture2D(normalSamplerZ, vTextureUVZ) * normalW.z;\r\n#endif\r\n#endif\r\n\r\n#ifdef NORMAL\r\n\tnormalW = normalize((2.0 * baseNormal.xyz - 1.0) * tangentSpace);\r\n#endif\r\n\r\n#ifdef ALPHATEST\r\n\tif (baseColor.a < 0.4)\r\n\t\tdiscard;\r\n#endif\r\n\r\n#ifdef VERTEXCOLOR\r\n\tbaseColor.rgb *= vColor.rgb;\r\n#endif\r\n\r\n\t// Lighting\r\n\tvec3 diffuseBase = vec3(0., 0., 0.);\r\n#ifdef SPECULARTERM\r\n\tvec3 specularBase = vec3(0., 0., 0.);\r\n#endif\r\n\tfloat shadow = 1.;\r\n\r\n#ifdef LIGHT0\r\n#ifndef SPECULARTERM\r\n\tvec3 vLightSpecular0 = vec3(0.0);\r\n#endif\r\n#ifdef SPOTLIGHT0\r\n\tlightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, glossiness);\r\n#endif\r\n#ifdef HEMILIGHT0\r\n\tlightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightGround0, glossiness);\r\n#endif\r\n#if defined(POINTLIGHT0) || defined(DIRLIGHT0)\r\n\tlightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightSpecular0, vLightDiffuse0.a, glossiness);\r\n#endif\r\n#ifdef SHADOW0\r\n#ifdef SHADOWVSM0\r\n\tshadow = computeShadowWithVSM(vPositionFromLight0, shadowSampler0, shadowsInfo0.z, shadowsInfo0.x);\r\n#else\r\n#ifdef SHADOWPCF0\r\n#if defined(POINTLIGHT0)\r\n\tshadow = computeShadowWithPCFCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);\r\n#else\r\n\tshadow = computeShadowWithPCF(vPositionFromLight0, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);\r\n#endif\r\n#else\r\n#if defined(POINTLIGHT0)\r\n\tshadow = computeShadowCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);\r\n#else\r\n\tshadow = computeShadow(vPositionFromLight0, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);\r\n#endif\r\n#endif\r\n#endif\r\n#else\r\n\tshadow = 1.;\r\n#endif\r\n\tdiffuseBase += info.diffuse * shadow;\r\n#ifdef SPECULARTERM\r\n\tspecularBase += info.specular * shadow;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT1\r\n#ifndef SPECULARTERM\r\n\tvec3 vLightSpecular1 = vec3(0.0);\r\n#endif\r\n#ifdef SPOTLIGHT1\r\n\tinfo = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, glossiness);\r\n#endif\r\n#ifdef HEMILIGHT1\r\n\tinfo = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightGround1, glossiness);\r\n#endif\r\n#if defined(POINTLIGHT1) || defined(DIRLIGHT1)\r\n\tinfo = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightSpecular1, vLightDiffuse1.a, glossiness);\r\n#endif\r\n#ifdef SHADOW1\r\n#ifdef SHADOWVSM1\r\n\tshadow = computeShadowWithVSM(vPositionFromLight1, shadowSampler1, shadowsInfo1.z, shadowsInfo1.x);\r\n#else\r\n#ifdef SHADOWPCF1\r\n#if defined(POINTLIGHT1)\r\n\tshadow = computeShadowWithPCFCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);\r\n#else\r\n\tshadow = computeShadowWithPCF(vPositionFromLight1, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);\r\n#endif\r\n#else\r\n#if defined(POINTLIGHT1)\r\n\tshadow = computeShadowCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);\r\n#else\r\n\tshadow = computeShadow(vPositionFromLight1, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);\r\n#endif\r\n#endif\r\n#endif\r\n#else\r\n\tshadow = 1.;\r\n#endif\r\n\tdiffuseBase += info.diffuse * shadow;\r\n#ifdef SPECULARTERM\r\n\tspecularBase += info.specular * shadow;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT2\r\n#ifndef SPECULARTERM\r\n\tvec3 vLightSpecular2 = vec3(0.0);\r\n#endif\r\n#ifdef SPOTLIGHT2\r\n\tinfo = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, glossiness);\r\n#endif\r\n#ifdef HEMILIGHT2\r\n\tinfo = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightGround2, glossiness);\r\n#endif\r\n#if defined(POINTLIGHT2) || defined(DIRLIGHT2)\r\n\tinfo = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightSpecular2, vLightDiffuse2.a, glossiness);\r\n#endif\r\n#ifdef SHADOW2\r\n#ifdef SHADOWVSM2\r\n\tshadow = computeShadowWithVSM(vPositionFromLight2, shadowSampler2, shadowsInfo2.z, shadowsInfo2.x);\r\n#else\r\n#ifdef SHADOWPCF2\r\n#if defined(POINTLIGHT2)\r\n\tshadow = computeShadowWithPCFCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);\r\n#else\r\n\tshadow = computeShadowWithPCF(vPositionFromLight2, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);\r\n#endif\r\n#else\r\n#if defined(POINTLIGHT2)\r\n\tshadow = computeShadowCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);\r\n#else\r\n\tshadow = computeShadow(vPositionFromLight2, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);\r\n#endif\r\n#endif\t\r\n#endif\t\r\n#else\r\n\tshadow = 1.;\r\n#endif\r\n\tdiffuseBase += info.diffuse * shadow;\r\n#ifdef SPECULARTERM\r\n\tspecularBase += info.specular * shadow;\r\n#endif\r\n#endif\r\n\r\n#ifdef LIGHT3\r\n#ifndef SPECULARTERM\r\n\tvec3 vLightSpecular3 = vec3(0.0);\r\n#endif\r\n#ifdef SPOTLIGHT3\r\n\tinfo = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, glossiness);\r\n#endif\r\n#ifdef HEMILIGHT3\r\n\tinfo = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightGround3, glossiness);\r\n#endif\r\n#if defined(POINTLIGHT3) || defined(DIRLIGHT3)\r\n\tinfo = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightSpecular3, vLightDiffuse3.a, glossiness);\r\n#endif\r\n#ifdef SHADOW3\r\n#ifdef SHADOWVSM3\r\n\tshadow = computeShadowWithVSM(vPositionFromLight3, shadowSampler3, shadowsInfo3.z, shadowsInfo3.x);\r\n#else\r\n#ifdef SHADOWPCF3\r\n#if defined(POINTLIGHT3)\r\n\tshadow = computeShadowWithPCFCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);\r\n#else\r\n\tshadow = computeShadowWithPCF(vPositionFromLight3, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);\r\n#endif\r\n#else\r\n#if defined(POINTLIGHT3)\r\n\tshadow = computeShadowCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);\r\n#else\r\n\tshadow = computeShadow(vPositionFromLight3, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);\r\n#endif\r\n#endif\t\r\n#endif\t\r\n#else\r\n\tshadow = 1.;\r\n#endif\r\n\tdiffuseBase += info.diffuse * shadow;\r\n#ifdef SPECULARTERM\r\n\tspecularBase += info.specular * shadow;\r\n#endif\r\n#endif\r\n\r\n#ifdef VERTEXALPHA\r\n\talpha *= vColor.a;\r\n#endif\r\n\r\n#ifdef SPECULARTERM\r\n\tvec3 finalSpecular = specularBase * specularColor;\r\n#else\r\n\tvec3 finalSpecular = vec3(0.0);\r\n#endif\r\n\r\n\tvec3 finalDiffuse = clamp(diffuseBase * diffuseColor, 0.0, 1.0) * baseColor.rgb;\r\n\r\n\t// Composition\r\n\tvec4 color = vec4(finalDiffuse + finalSpecular, alpha);\r\n\r\n#ifdef FOG\r\n\tfloat fog = CalcFogFactor();\r\n\tcolor.rgb = fog * color.rgb + (1.0 - fog) * vFogColor;\r\n#endif\r\n\r\n\tgl_FragColor = color;\r\n}\r\n";
