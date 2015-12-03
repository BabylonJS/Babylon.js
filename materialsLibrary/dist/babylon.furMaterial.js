/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var maxSimultaneousLights = 4;
    var FurMaterialDefines = (function (_super) {
        __extends(FurMaterialDefines, _super);
        function FurMaterialDefines() {
            _super.call(this);
            this.DIFFUSE = false;
            this.HEIGHTMAP = false;
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
            this.NORMAL = false;
            this.UV1 = false;
            this.UV2 = false;
            this.VERTEXCOLOR = false;
            this.VERTEXALPHA = false;
            this.BONES = false;
            this.BONES4 = false;
            this.BonesPerMesh = 0;
            this.INSTANCES = false;
            this._keys = Object.keys(this);
        }
        return FurMaterialDefines;
    })(BABYLON.MaterialDefines);
    var FurMaterial = (function (_super) {
        __extends(FurMaterial, _super);
        function FurMaterial(name, scene) {
            _super.call(this, name, scene);
            this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            this.furLength = 1;
            this.furAngle = 0;
            this.furColor = new BABYLON.Color3(0.44, 0.21, 0.02);
            this.disableLighting = false;
            this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
            this._scaledDiffuse = new BABYLON.Color3(1., 1., 1.);
            this._defines = new FurMaterialDefines();
            this._cachedDefines = new FurMaterialDefines();
            this._cachedDefines.BonesPerMesh = -1;
        }
        FurMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        FurMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        FurMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        FurMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
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
        FurMaterial.prototype.isReady = function (mesh, useInstances) {
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
                if (this.heightTexture) {
                    if (!this.heightTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.HEIGHTMAP = true;
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
                if (this._defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (this._defines.UV2) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
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
                var shaderName = "fur";
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName, attribs, ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                    "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                    "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                    "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                    "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix",
                    "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3",
                    "furLength", "furAngle", "furColor"
                ], ["diffuseSampler",
                    "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3",
                    "heightTexture"
                ], join, fallbacks, this.onCompiled, this.onError);
            }
            if (!this._effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new FurMaterialDefines();
                }
                this._defines.cloneTo(mesh._materialDefines);
            }
            return true;
        };
        FurMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        FurMaterial.prototype.bind = function (world, mesh) {
            var scene = this.getScene();
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
            }
            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._effect.setTexture("diffuseSampler", this.diffuseTexture);
                    this._effect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                    this._effect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
                }
                if (this.heightTexture) {
                    this._effect.setTexture("heightTexture", this.heightTexture);
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
            this._effect.setFloat("furLength", this.furLength);
            this._effect.setFloat("furAngle", this.furAngle);
            this._effect.setColor4("furColor", this.furColor, 1.0);
            _super.prototype.bind.call(this, world, mesh);
        };
        FurMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }
            if (this.heightTexture && this.heightTexture.animations && this.heightTexture.animations.length > 0) {
                results.push(this.heightTexture);
            }
            return results;
        };
        FurMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        FurMaterial.prototype.clone = function (name) {
            var newMaterial = new FurMaterial(name, this.getScene());
            // Base material
            this.copyTo(newMaterial);
            // Fur material
            if (this.diffuseTexture && this.diffuseTexture.clone) {
                newMaterial.diffuseTexture = this.diffuseTexture.clone();
            }
            if (this.heightTexture && this.heightTexture.clone) {
                newMaterial.heightTexture = this.heightTexture.clone();
            }
            if (this.diffuseColor && this.diffuseColor.clone) {
                newMaterial.diffuseColor = this.diffuseColor.clone();
            }
            return newMaterial;
        };
        FurMaterial.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.customType = "BABYLON.FurMaterial";
            serializationObject.diffuseColor = this.diffuseColor.asArray();
            serializationObject.disableLighting = this.disableLighting;
            serializationObject.furLength = this.furLength;
            serializationObject.furAngle = this.furAngle;
            serializationObject.furColor = this.furColor.asArray();
            if (this.diffuseTexture) {
                serializationObject.diffuseTexture = this.diffuseTexture.serialize();
            }
            if (this.heightTexture) {
                serializationObject.heightTexture = this.heightTexture.serialize();
            }
            return serializationObject;
        };
        FurMaterial.Parse = function (source, scene, rootUrl) {
            var material = new FurMaterial(source.name, scene);
            material.diffuseColor = BABYLON.Color3.FromArray(source.diffuseColor);
            material.furLength = source.furLength;
            material.furAngle = source.furAngle;
            material.furColor = BABYLON.Color3.FromArray(source.furColor);
            material.disableLighting = source.disableLighting;
            material.alpha = source.alpha;
            material.id = source.id;
            BABYLON.Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;
            if (source.diffuseTexture) {
                material.diffuseTexture = BABYLON.Texture.Parse(source.diffuseTexture, scene, rootUrl);
            }
            if (source.heightTexture) {
                material.heightTexture = BABYLON.Texture.Parse(source.heightTexture, scene, rootUrl);
            }
            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }
            return material;
        };
        return FurMaterial;
    })(BABYLON.Material);
    BABYLON.FurMaterial = FurMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['furVertexShader'] = "precision highp float;\n\n// Attributes\nattribute vec3 position;\nattribute vec3 normal;\n\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#ifdef BONES\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#endif\n\n\n// Uniforms\nuniform float furLength;\nuniform float furAngle;\n#ifdef HEIGHTMAP\nuniform sampler2D heightTexture;\n#endif\n\n#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif\n\nuniform mat4 view;\nuniform mat4 viewProjection;\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n\n#ifdef BONES\nuniform mat4 mBones[BonesPerMesh];\n#endif\n\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\n// Output\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\nvarying float vfur_length;\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif\n\n#ifdef FOG\nvarying float fFogDistance;\n#endif\n\n#ifdef SHADOWS\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\nuniform mat4 lightMatrix0;\nvarying vec4 vPositionFromLight0;\n#endif\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\nuniform mat4 lightMatrix1;\nvarying vec4 vPositionFromLight1;\n#endif\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\nuniform mat4 lightMatrix2;\nvarying vec4 vPositionFromLight2;\n#endif\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\nuniform mat4 lightMatrix3;\nvarying vec4 vPositionFromLight3;\n#endif\n#endif\n\nfloat Rand(vec3 rv) {\n\tfloat x = dot(rv, vec3(12.9898,78.233, 24.65487));\n\treturn fract(sin(x) * 43758.5453);\n}\n\nvoid main(void) {\n\tmat4 finalWorld;\n\n#ifdef INSTANCES\n\tfinalWorld = mat4(world0, world1, world2, world3);\n#else\n\tfinalWorld = world;\n#endif\n\n#ifdef BONES\n\tmat4 m0 = mBones[int(matricesIndices.x)] * matricesWeights.x;\n\tmat4 m1 = mBones[int(matricesIndices.y)] * matricesWeights.y;\n\tmat4 m2 = mBones[int(matricesIndices.z)] * matricesWeights.z;\n\n#ifdef BONES4\n\tmat4 m3 = mBones[int(matricesIndices.w)] * matricesWeights.w;\n\tfinalWorld = finalWorld * (m0 + m1 + m2 + m3);\n#else\n\tfinalWorld = finalWorld * (m0 + m1 + m2);\n#endif \n\n#endif\n//FUR\nfloat r = Rand(position);\n#ifdef HEIGHTMAP\t\n\tvfur_length = furLength * texture2D(heightTexture, uv).rgb.x;\n#else\t\n\tvfur_length = (furLength * r);\n#endif\n\tvec3 tangent1 = vec3(normal.y, -normal.x, 0);\n\tvec3 tangent2 = vec3(-normal.z, 0, normal.x);\n\tr = Rand(tangent1*r);\n\tfloat J = (2.0 + 4.0* r);\n\tr = Rand(tangent2*r);\n\tfloat K = (2.0 + 2.0* r);\n\ttangent1 = tangent1*J + tangent2*K;\n\ttangent1 = normalize(tangent1);\n    vec3 newPosition = position + normal * vfur_length*cos(furAngle) + tangent1*vfur_length*sin(furAngle);\n\t\n//END FUR\n\tgl_Position = viewProjection * finalWorld * vec4(newPosition, 1.0);\n\n\tvec4 worldPos = finalWorld * vec4(newPosition, 1.0);\n\tvPositionW = vec3(worldPos);\n\n#ifdef NORMAL\n\tvNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));\n#endif\n\n\t// Texture coordinates\n#ifndef UV1\n\tvec2 uv = vec2(0., 0.);\n#endif\n#ifndef UV2\n\tvec2 uv2 = vec2(0., 0.);\n#endif\n\n#ifdef DIFFUSE\n\tif (vDiffuseInfos.x == 0.)\n\t{\n\t\tvDiffuseUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));\n\t}\n\telse\n\t{\n\t\tvDiffuseUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));\n\t}\n#endif\n\n\t// Clip plane\n#ifdef CLIPPLANE\n\tfClipDistance = dot(worldPos, vClipPlane);\n#endif\n\n\t// Fog\n#ifdef FOG\n\tfFogDistance = (view * worldPos).z;\n#endif\n\n\t// Shadows\n#ifdef SHADOWS\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\n\tvPositionFromLight0 = lightMatrix0 * worldPos;\n#endif\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\n\tvPositionFromLight1 = lightMatrix1 * worldPos;\n#endif\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\n\tvPositionFromLight2 = lightMatrix2 * worldPos;\n#endif\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\n\tvPositionFromLight3 = lightMatrix3 * worldPos;\n#endif\n#endif\n\n\t// Vertex color\n#ifdef VERTEXCOLOR\n\tvColor = color;\n#endif\n\n\t// Point size\n#ifdef POINTSIZE\n\tgl_PointSize = pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['furPixelShader'] = "precision highp float;\n\n// Constants\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n\n// Input\nuniform vec4 furColor;\nvarying vec3 vPositionW;\nvarying float vfur_length;\n\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n// Lights\n#ifdef LIGHT0\nuniform vec4 vLightData0;\nuniform vec4 vLightDiffuse0;\n#ifdef SHADOW0\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\nvarying vec4 vPositionFromLight0;\nuniform sampler2D shadowSampler0;\n#else\nuniform samplerCube shadowSampler0;\n#endif\nuniform vec3 shadowsInfo0;\n#endif\n#ifdef SPOTLIGHT0\nuniform vec4 vLightDirection0;\n#endif\n#ifdef HEMILIGHT0\nuniform vec3 vLightGround0;\n#endif\n#endif\n\n#ifdef LIGHT1\nuniform vec4 vLightData1;\nuniform vec4 vLightDiffuse1;\n#ifdef SHADOW1\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\nvarying vec4 vPositionFromLight1;\nuniform sampler2D shadowSampler1;\n#else\nuniform samplerCube shadowSampler1;\n#endif\nuniform vec3 shadowsInfo1;\n#endif\n#ifdef SPOTLIGHT1\nuniform vec4 vLightDirection1;\n#endif\n#ifdef HEMILIGHT1\nuniform vec3 vLightGround1;\n#endif\n#endif\n\n#ifdef LIGHT2\nuniform vec4 vLightData2;\nuniform vec4 vLightDiffuse2;\n#ifdef SHADOW2\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\nvarying vec4 vPositionFromLight2;\nuniform sampler2D shadowSampler2;\n#else\nuniform samplerCube shadowSampler2;\n#endif\nuniform vec3 shadowsInfo2;\n#endif\n#ifdef SPOTLIGHT2\nuniform vec4 vLightDirection2;\n#endif\n#ifdef HEMILIGHT2\nuniform vec3 vLightGround2;\n#endif\n#endif\n\n#ifdef LIGHT3\nuniform vec4 vLightData3;\nuniform vec4 vLightDiffuse3;\n#ifdef SHADOW3\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\nvarying vec4 vPositionFromLight3;\nuniform sampler2D shadowSampler3;\n#else\nuniform samplerCube shadowSampler3;\n#endif\nuniform vec3 shadowsInfo3;\n#endif\n#ifdef SPOTLIGHT3\nuniform vec4 vLightDirection3;\n#endif\n#ifdef HEMILIGHT3\nuniform vec3 vLightGround3;\n#endif\n#endif\n\n// Samplers\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n\n// Shadows\n#ifdef SHADOWS\n\nfloat unpack(vec4 color)\n{\n\tconst vec4 bit_shift = vec4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);\n\treturn dot(color, bit_shift);\n}\n\n#if defined(POINTLIGHT0) || defined(POINTLIGHT1) || defined(POINTLIGHT2) || defined(POINTLIGHT3)\nfloat computeShadowCube(vec3 lightPosition, samplerCube shadowSampler, float darkness, float bias)\n{\n\tvec3 directionToLight = vPositionW - lightPosition;\n\tfloat depth = length(directionToLight);\n\n\tdepth = clamp(depth, 0., 1.);\n\n\tdirectionToLight.y = 1.0 - directionToLight.y;\n\n\tfloat shadow = unpack(textureCube(shadowSampler, directionToLight)) + bias;\n\n\tif (depth > shadow)\n\t{\n\t\treturn darkness;\n\t}\n\treturn 1.0;\n}\n\nfloat computeShadowWithPCFCube(vec3 lightPosition, samplerCube shadowSampler, float bias, float darkness)\n{\n\tvec3 directionToLight = vPositionW - lightPosition;\n\tfloat depth = length(directionToLight);\n\n\tdepth = clamp(depth, 0., 1.);\n\n\tdirectionToLight.y = 1.0 - directionToLight.y;\n\n\tfloat visibility = 1.;\n\n\tvec3 poissonDisk[4];\n\tpoissonDisk[0] = vec3(-0.094201624, 0.04, -0.039906216);\n\tpoissonDisk[1] = vec3(0.094558609, -0.04, -0.076890725);\n\tpoissonDisk[2] = vec3(-0.094184101, 0.01, -0.092938870);\n\tpoissonDisk[3] = vec3(0.034495938, -0.01, 0.029387760);\n\n\t// Poisson Sampling\n\tfloat biasedDepth = depth - bias;\n\n\tif (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[0])) < biasedDepth) visibility -= 0.25;\n\tif (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[1])) < biasedDepth) visibility -= 0.25;\n\tif (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[2])) < biasedDepth) visibility -= 0.25;\n\tif (unpack(textureCube(shadowSampler, directionToLight + poissonDisk[3])) < biasedDepth) visibility -= 0.25;\n\n\treturn  min(1.0, visibility + darkness);\n}\n#endif\n\n#if defined(SPOTLIGHT0) || defined(SPOTLIGHT1) || defined(SPOTLIGHT2) || defined(SPOTLIGHT3) ||  defined(DIRLIGHT0) || defined(DIRLIGHT1) || defined(DIRLIGHT2) || defined(DIRLIGHT3)\nfloat computeShadow(vec4 vPositionFromLight, sampler2D shadowSampler, float darkness, float bias)\n{\n\tvec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\n\tdepth = 0.5 * depth + vec3(0.5);\n\tvec2 uv = depth.xy;\n\n\tif (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)\n\t{\n\t\treturn 1.0;\n\t}\n\n\tfloat shadow = unpack(texture2D(shadowSampler, uv)) + bias;\n\n\tif (depth.z > shadow)\n\t{\n\t\treturn darkness;\n\t}\n\treturn 1.;\n}\n\nfloat computeShadowWithPCF(vec4 vPositionFromLight, sampler2D shadowSampler, float mapSize, float bias, float darkness)\n{\n\tvec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\n\tdepth = 0.5 * depth + vec3(0.5);\n\tvec2 uv = depth.xy;\n\n\tif (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0)\n\t{\n\t\treturn 1.0;\n\t}\n\n\tfloat visibility = 1.;\n\n\tvec2 poissonDisk[4];\n\tpoissonDisk[0] = vec2(-0.94201624, -0.39906216);\n\tpoissonDisk[1] = vec2(0.94558609, -0.76890725);\n\tpoissonDisk[2] = vec2(-0.094184101, -0.92938870);\n\tpoissonDisk[3] = vec2(0.34495938, 0.29387760);\n\n\t// Poisson Sampling\n\tfloat biasedDepth = depth.z - bias;\n\n\tif (unpack(texture2D(shadowSampler, uv + poissonDisk[0] / mapSize)) < biasedDepth) visibility -= 0.25;\n\tif (unpack(texture2D(shadowSampler, uv + poissonDisk[1] / mapSize)) < biasedDepth) visibility -= 0.25;\n\tif (unpack(texture2D(shadowSampler, uv + poissonDisk[2] / mapSize)) < biasedDepth) visibility -= 0.25;\n\tif (unpack(texture2D(shadowSampler, uv + poissonDisk[3] / mapSize)) < biasedDepth) visibility -= 0.25;\n\n\treturn  min(1.0, visibility + darkness);\n}\n\n// Thanks to http://devmaster.net/\nfloat unpackHalf(vec2 color)\n{\n\treturn color.x + (color.y / 255.0);\n}\n\nfloat linstep(float low, float high, float v) {\n\treturn clamp((v - low) / (high - low), 0.0, 1.0);\n}\n\nfloat ChebychevInequality(vec2 moments, float compare, float bias)\n{\n\tfloat p = smoothstep(compare - bias, compare, moments.x);\n\tfloat variance = max(moments.y - moments.x * moments.x, 0.02);\n\tfloat d = compare - moments.x;\n\tfloat p_max = linstep(0.2, 1.0, variance / (variance + d * d));\n\n\treturn clamp(max(p, p_max), 0.0, 1.0);\n}\n\nfloat computeShadowWithVSM(vec4 vPositionFromLight, sampler2D shadowSampler, float bias, float darkness)\n{\n\tvec3 depth = vPositionFromLight.xyz / vPositionFromLight.w;\n\tdepth = 0.5 * depth + vec3(0.5);\n\tvec2 uv = depth.xy;\n\n\tif (uv.x < 0. || uv.x > 1.0 || uv.y < 0. || uv.y > 1.0 || depth.z >= 1.0)\n\t{\n\t\treturn 1.0;\n\t}\n\n\tvec4 texel = texture2D(shadowSampler, uv);\n\n\tvec2 moments = vec2(unpackHalf(texel.xy), unpackHalf(texel.zw));\n\treturn min(1.0, 1.0 - ChebychevInequality(moments, depth.z, bias) + darkness);\n}\n#endif\n#endif\n\n\n#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif\n\n// Fog\n#ifdef FOG\n\n#define FOGMODE_NONE    0.\n#define FOGMODE_EXP     1.\n#define FOGMODE_EXP2    2.\n#define FOGMODE_LINEAR  3.\n#define E 2.71828\n\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying float fFogDistance;\n\nfloat CalcFogFactor()\n{\n\tfloat fogCoeff = 1.0;\n\tfloat fogStart = vFogInfos.y;\n\tfloat fogEnd = vFogInfos.z;\n\tfloat fogDensity = vFogInfos.w;\n\n\tif (FOGMODE_LINEAR == vFogInfos.x)\n\t{\n\t\tfogCoeff = (fogEnd - fFogDistance) / (fogEnd - fogStart);\n\t}\n\telse if (FOGMODE_EXP == vFogInfos.x)\n\t{\n\t\tfogCoeff = 1.0 / pow(E, fFogDistance * fogDensity);\n\t}\n\telse if (FOGMODE_EXP2 == vFogInfos.x)\n\t{\n\t\tfogCoeff = 1.0 / pow(E, fFogDistance * fFogDistance * fogDensity * fogDensity);\n\t}\n\n\treturn clamp(fogCoeff, 0.0, 1.0);\n}\n#endif\n\n// Light Computing\nstruct lightingInfo\n{\n\tvec3 diffuse;\n};\n\nlightingInfo computeLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, float range) {\n\tlightingInfo result;\n\n\tvec3 lightVectorW;\n\tfloat attenuation = 1.0;\n\tif (lightData.w == 0.)\n\t{\n\t\tvec3 direction = lightData.xyz - vPositionW;\n\n\t\tattenuation = max(0., 1.0 - length(direction) / range);\n\t\tlightVectorW = normalize(direction);\n\t}\n\telse\n\t{\n\t\tlightVectorW = normalize(-lightData.xyz);\n\t}\n\n\t// diffuse\n\tfloat ndl = max(0., dot(vNormal, lightVectorW));\n\tresult.diffuse = ndl * diffuseColor * attenuation;\n\n\treturn result;\n}\n\nlightingInfo computeSpotLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec4 lightDirection, vec3 diffuseColor, float range) {\n\tlightingInfo result;\n\n\tvec3 direction = lightData.xyz - vPositionW;\n\tvec3 lightVectorW = normalize(direction);\n\tfloat attenuation = max(0., 1.0 - length(direction) / range);\n\n\t// diffuse\n\tfloat cosAngle = max(0., dot(-lightDirection.xyz, lightVectorW));\n\tfloat spotAtten = 0.0;\n\n\tif (cosAngle >= lightDirection.w)\n\t{\n\t\tcosAngle = max(0., pow(cosAngle, lightData.w));\n\t\tspotAtten = clamp((cosAngle - lightDirection.w) / (1. - cosAngle), 0.0, 1.0);\n\n\t\t// Diffuse\n\t\tfloat ndl = max(0., dot(vNormal, -lightDirection.xyz));\n\t\tresult.diffuse = ndl * spotAtten * diffuseColor * attenuation;\n\n\t\treturn result;\n\t}\n\n\tresult.diffuse = vec3(0.);\n\n\treturn result;\n}\n\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 groundColor) {\n\tlightingInfo result;\n\n\t// Diffuse\n\tfloat ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;\n\tresult.diffuse = mix(groundColor, diffuseColor, ndl);\n\n\treturn result;\n}\n\nfloat Rand(vec3 rv) {\n\tfloat x = dot(rv, vec3(12.9898,78.233, 24.65487));\n\treturn fract(sin(x) * 43758.5453);\n}\n\nvoid main(void) {\n\t// Clip plane\n#ifdef CLIPPLANE\n\tif (fClipDistance > 0.0)\n\t\tdiscard;\n#endif\n\n\tvec3 viewDirectionW = normalize(vEyePosition - vPositionW);\n\n\t// Base color\n\tvec4 baseColor = furColor;\n\tvec3 diffuseColor = vDiffuseColor.rgb;\n\n\t// Alpha\n\tfloat alpha = vDiffuseColor.a;\n\n#ifdef DIFFUSE\n\tbaseColor = texture2D(diffuseSampler, vDiffuseUV);\n\n#ifdef ALPHATEST\n\tif (baseColor.a < 0.4)\n\t\tdiscard;\n#endif\n\n\tbaseColor.rgb *= vDiffuseInfos.y;\n#endif\n\n#ifdef VERTEXCOLOR\n\tbaseColor.rgb *= vColor.rgb;\n#endif\n\n\t// Bump\n#ifdef NORMAL\n\tvec3 normalW = normalize(vNormalW);\n#else\n\tvec3 normalW = vec3(1.0, 1.0, 1.0);\n#endif\n\n\t// Lighting\n\tvec3 diffuseBase = vec3(0., 0., 0.);\n\tfloat shadow = 1.;\n\n#ifdef LIGHT0\n#ifdef SPOTLIGHT0\n\tlightingInfo info = computeSpotLighting(viewDirectionW, normalW, vLightData0, vLightDirection0, vLightDiffuse0.rgb, vLightDiffuse0.a);\n#endif\n#ifdef HEMILIGHT0\n\tlightingInfo info = computeHemisphericLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightGround0);\n#endif\n#if defined(POINTLIGHT0) || defined(DIRLIGHT0)\n\tlightingInfo info = computeLighting(viewDirectionW, normalW, vLightData0, vLightDiffuse0.rgb, vLightDiffuse0.a);\n#endif\n#ifdef SHADOW0\n#ifdef SHADOWVSM0\n\tshadow = computeShadowWithVSM(vPositionFromLight0, shadowSampler0, shadowsInfo0.z, shadowsInfo0.x);\n#else\n#ifdef SHADOWPCF0\n\t#if defined(POINTLIGHT0)\n\tshadow = computeShadowWithPCFCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.z, shadowsInfo0.x);\n\t#else\n\tshadow = computeShadowWithPCF(vPositionFromLight0, shadowSampler0, shadowsInfo0.y, shadowsInfo0.z, shadowsInfo0.x);\n\t#endif\n#else\n\t#if defined(POINTLIGHT0)\n\tshadow = computeShadowCube(vLightData0.xyz, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);\n\t#else\n\tshadow = computeShadow(vPositionFromLight0, shadowSampler0, shadowsInfo0.x, shadowsInfo0.z);\n\t#endif\n#endif\n#endif\n#else\n\tshadow = 1.;\n#endif\n\tdiffuseBase += info.diffuse * shadow;\n#endif\n\n#ifdef LIGHT1\n#ifdef SPOTLIGHT1\n\tinfo = computeSpotLighting(viewDirectionW, normalW, vLightData1, vLightDirection1, vLightDiffuse1.rgb, vLightDiffuse1.a);\n#endif\n#ifdef HEMILIGHT1\n\tinfo = computeHemisphericLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightGround1.a);\n#endif\n#if defined(POINTLIGHT1) || defined(DIRLIGHT1)\n\tinfo = computeLighting(viewDirectionW, normalW, vLightData1, vLightDiffuse1.rgb, vLightDiffuse1.a);\n#endif\n#ifdef SHADOW1\n#ifdef SHADOWVSM1\n\tshadow = computeShadowWithVSM(vPositionFromLight1, shadowSampler1, shadowsInfo1.z, shadowsInfo1.x);\n#else\n#ifdef SHADOWPCF1\n#if defined(POINTLIGHT1)\n\tshadow = computeShadowWithPCFCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.z, shadowsInfo1.x);\n#else\n\tshadow = computeShadowWithPCF(vPositionFromLight1, shadowSampler1, shadowsInfo1.y, shadowsInfo1.z, shadowsInfo1.x);\n#endif\n#else\n\t#if defined(POINTLIGHT1)\n\tshadow = computeShadowCube(vLightData1.xyz, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);\n\t#else\n\tshadow = computeShadow(vPositionFromLight1, shadowSampler1, shadowsInfo1.x, shadowsInfo1.z);\n\t#endif\n#endif\n#endif\n#else\n\tshadow = 1.;\n#endif\n\tdiffuseBase += info.diffuse * shadow;\n#endif\n\n#ifdef LIGHT2\n#ifdef SPOTLIGHT2\n\tinfo = computeSpotLighting(viewDirectionW, normalW, vLightData2, vLightDirection2, vLightDiffuse2.rgb, vLightDiffuse2.a);\n#endif\n#ifdef HEMILIGHT2\n\tinfo = computeHemisphericLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightGround2);\n#endif\n#if defined(POINTLIGHT2) || defined(DIRLIGHT2)\n\tinfo = computeLighting(viewDirectionW, normalW, vLightData2, vLightDiffuse2.rgb, vLightDiffuse2.a);\n#endif\n#ifdef SHADOW2\n#ifdef SHADOWVSM2\n\tshadow = computeShadowWithVSM(vPositionFromLight2, shadowSampler2, shadowsInfo2.z, shadowsInfo2.x);\n#else\n#ifdef SHADOWPCF2\n#if defined(POINTLIGHT2)\n\tshadow = computeShadowWithPCFCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.z, shadowsInfo2.x);\n#else\n\tshadow = computeShadowWithPCF(vPositionFromLight2, shadowSampler2, shadowsInfo2.y, shadowsInfo2.z, shadowsInfo2.x);\n#endif\n#else\n\t#if defined(POINTLIGHT2)\n\tshadow = computeShadowCube(vLightData2.xyz, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);\n\t#else\n\tshadow = computeShadow(vPositionFromLight2, shadowSampler2, shadowsInfo2.x, shadowsInfo2.z);\n\t#endif\n#endif\t\n#endif\t\n#else\n\tshadow = 1.;\n#endif\n\tdiffuseBase += info.diffuse * shadow;\n#endif\n\n#ifdef LIGHT3\n#ifdef SPOTLIGHT3\n\tinfo = computeSpotLighting(viewDirectionW, normalW, vLightData3, vLightDirection3, vLightDiffuse3.rgb, vLightDiffuse3.a);\n#endif\n#ifdef HEMILIGHT3\n\tinfo = computeHemisphericLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightGround3);\n#endif\n#if defined(POINTLIGHT3) || defined(DIRLIGHT3)\n\tinfo = computeLighting(viewDirectionW, normalW, vLightData3, vLightDiffuse3.rgb, vLightDiffuse3.a);\n#endif\n#ifdef SHADOW3\n#ifdef SHADOWVSM3\n\t\tshadow = computeShadowWithVSM(vPositionFromLight3, shadowSampler3, shadowsInfo3.z, shadowsInfo3.x);\n#else\n#ifdef SHADOWPCF3\n#if defined(POINTLIGHT3)\n\tshadow = computeShadowWithPCFCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.z, shadowsInfo3.x);\n#else\n\tshadow = computeShadowWithPCF(vPositionFromLight3, shadowSampler3, shadowsInfo3.y, shadowsInfo3.z, shadowsInfo3.x);\n#endif\n#else\n\t#if defined(POINTLIGHT3)\n\tshadow = computeShadowCube(vLightData3.xyz, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);\n\t#else\n\tshadow = computeShadow(vPositionFromLight3, shadowSampler3, shadowsInfo3.x, shadowsInfo3.z);\n\t#endif\n#endif\t\n#endif\t\n#else\n\tshadow = 1.;\n#endif\n\tdiffuseBase += info.diffuse * shadow;\n#endif\n\n#ifdef VERTEXALPHA\n\talpha *= vColor.a;\n#endif\n\n\tvec3 finalDiffuse = clamp(diffuseBase * diffuseColor, 0.0, 1.0) * baseColor.rgb;\n\n\t// Composition\n\t//float r = Rand(vPositionW) * 0.5;\n\tfloat r = vfur_length * 0.5;\n\tvec4 color = vec4(finalDiffuse * (0.5 + r), alpha);\n\n#ifdef FOG\n\tfloat fog = CalcFogFactor();\n\tcolor.rgb = fog * color.rgb + (1.0 - fog) * vFogColor;\n#endif\n\n\tgl_FragColor = color;\n}";
