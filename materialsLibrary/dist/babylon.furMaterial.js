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
            this.furLength = 0.5;
            this.furAngle = 0;
            this.diffuseColor = new BABYLON.Color3(0.44, 0.21, 0.02);
            this.disableLighting = false;
            this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
            this._scaledDiffuse = new BABYLON.Color3();
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
                var shaderName = "simple";
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
                    "furLength", "furAngle"
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

BABYLON.Effect.ShadersStore['furVertexShader'] = "precision highp float;\n\n// Attributes\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec2 uv;\n\n// Uniforms\nuniform mat4 worldViewProjection;\nuniform float time;\n\n// Varying\nvarying vec3 vPosition;\nvarying vec3 vNormal;\nvarying vec2 vUV;\nvarying float vfl;\n\t\t\t\t\nfloat Random_Final(vec3 rv)\n{\n\tfloat x = dot(rv, vec3(12.9898,78.233, 24.65487));\n\treturn fract(sin(x) * 43758.5453);\n}\n\nvoid main(void) {\n    float r = Random_Final(position);\n    float fur_length = (2.5 * r);\n    vec3 tangent1 = vec3(normal.y, -normal.x, 0);\n    vec3 tangent2 = vec3(-normal.z, 0, normal.x);\n    r = Random_Final(tangent1);\n\t float J = (4.0 + 2.0*r);\n    r = Random_Final(tangent2);\n\t float K = (2.0 + 2.0* r);\n\t tangent1 = tangent1*J + tangent2*K;\n\t tangent1 = normalize(tangent1);\n    vec3 v = position;\n    v = v + 0.2*normal * fur_length + tangent1*0.1;\n    \n    gl_Position = worldViewProjection * vec4(v, 1.0);\n    \n    vPosition = position;\n    vNormal = normal;\n    vUV = uv;\n    vfl = fur_length;\n};\n";
BABYLON.Effect.ShadersStore['furPixelShader'] = "precision highp float;\n\n// Varying\nvarying vec3 vPosition;\nvarying vec3 vNormal;\nvarying vec2 vUV;\nvarying float vfl;\n\n// Uniforms\nuniform mat4 world;\n\n// Refs\nuniform vec3 cameraPosition;\n\t\t\t\t\nvoid main(void) {\n    vec3 vLightPosition = vec3(0,200,100);\n    \n    // World values\n    vec3 vPositionW = vec3(world * vec4(vPosition, 1.0));\n    vec3 vNormalW = normalize(vec3(world * vec4(vNormal, 0.0)));\n    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);\n    \n    // Light variation depends on fur length gives shadow effect on a plane\n    vec3 lightVectorW = (0.1 + vfl/4.0)*normalize(vLightPosition - vPositionW);\n    vec3 color = vec3(0.44,0.21,0.02).rgb;\n    \n    // diffuse\n    float ndl = abs(dot(vNormalW, lightVectorW));\n    \n    // Specular\n    vec3 angleW = normalize(viewDirectionW + (0.1 + vfl)*lightVectorW);\n    float specComp = max(0., dot(vNormalW, angleW));\n    specComp = pow(specComp, max(1., 64.)) * 2.;\n    \n    gl_FragColor = vec4(color * ndl , 1.0);\n};";
