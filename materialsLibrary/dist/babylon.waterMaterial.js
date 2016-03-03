/// <reference path="../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../simple/babylon.simpleMaterial.ts"/>

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
    var WaterMaterialDefines = (function (_super) {
        __extends(WaterMaterialDefines, _super);
        function WaterMaterialDefines() {
            _super.call(this);
            this.BUMP = false;
            this.REFLECTION = false;
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
            this.SPECULARTERM = false;
            this._keys = Object.keys(this);
        }
        return WaterMaterialDefines;
    })(BABYLON.MaterialDefines);
    var WaterMaterial = (function (_super) {
        __extends(WaterMaterial, _super);
        /**
        * Constructor
        */
        function WaterMaterial(name, scene, renderTargetSize) {
            if (renderTargetSize === void 0) { renderTargetSize = new BABYLON.Vector2(512, 512); }
            _super.call(this, name, scene);
            this.renderTargetSize = renderTargetSize;
            this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            this.specularColor = new BABYLON.Color3(0, 0, 0);
            this.specularPower = 64;
            this.disableLighting = false;
            /**
            * @param {number}: Represents the wind force
            */
            this.windForce = 6;
            /**
            * @param {Vector2}: The direction of the wind in the plane (X, Z)
            */
            this.windDirection = new BABYLON.Vector2(0, 1);
            /**
            * @param {number}: Wave height, represents the height of the waves
            */
            this.waveHeight = 0.4;
            /**
            * @param {number}: Bump height, represents the bump height related to the bump map
            */
            this.bumpHeight = 0.4;
            /**
            * @param {number}: The water color blended with the reflection and refraction samplers
            */
            this.waterColor = new BABYLON.Color3(0.1, 0.1, 0.6);
            /**
            * @param {number}: The blend factor related to the water color
            */
            this.colorBlendFactor = 0.2;
            /**
            * @param {number}: Represents the maximum length of a wave
            */
            this.waveLength = 0.1;
            /**
            * @param {number}: Defines the waves speed
            */
            this.waveSpeed = 1.0;
            /*
            * Private members
            */
            this._mesh = null;
            this._reflectionTransform = BABYLON.Matrix.Zero();
            this._lastTime = 0;
            this._scaledDiffuse = new BABYLON.Color3();
            this._scaledSpecular = new BABYLON.Color3();
            this._defines = new WaterMaterialDefines();
            this._cachedDefines = new WaterMaterialDefines();
            // Create render targets
            this._createRenderTargets(scene, renderTargetSize);
        }
        Object.defineProperty(WaterMaterial.prototype, "refractionTexture", {
            // Get / Set
            get: function () {
                return this._refractionRTT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WaterMaterial.prototype, "reflectionTexture", {
            get: function () {
                return this._reflectionRTT;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        WaterMaterial.prototype.addToRenderList = function (node) {
            this._refractionRTT.renderList.push(node);
            this._reflectionRTT.renderList.push(node);
        };
        WaterMaterial.prototype.enableRenderTargets = function (enable) {
            var refreshRate = enable ? 1 : 0;
            this._refractionRTT.refreshRate = refreshRate;
            this._reflectionRTT.refreshRate = refreshRate;
        };
        WaterMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        WaterMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        WaterMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        WaterMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
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
        WaterMaterial.prototype.isReady = function (mesh, useInstances) {
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
                if (this.bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled) {
                    if (!this.bumpTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.BUMP = true;
                    }
                }
                if (BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                    this._defines.REFLECTION = true;
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
            this._mesh = mesh;
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
                var shaderName = "water";
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName, attribs, ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor", "vSpecularColor",
                    "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                    "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                    "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                    "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vNormalInfos",
                    "mBones",
                    "vClipPlane", "normalMatrix",
                    "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3",
                    // Water
                    "worldReflectionViewProjection", "windDirection", "waveLength", "time", "windForce",
                    "cameraPosition", "bumpHeight", "waveHeight", "waterColor", "colorBlendFactor", "waveSpeed"
                ], ["normalSampler",
                    "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3",
                    // Water
                    "refractionSampler", "reflectionSampler"
                ], join, fallbacks, this.onCompiled, this.onError);
            }
            if (!this._effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new WaterMaterialDefines();
                }
                this._defines.cloneTo(mesh._materialDefines);
            }
            return true;
        };
        WaterMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        WaterMaterial.prototype.bind = function (world, mesh) {
            var scene = this.getScene();
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
            }
            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this.bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled) {
                    this._effect.setTexture("normalSampler", this.bumpTexture);
                    this._effect.setFloat2("vNormalInfos", this.bumpTexture.coordinatesIndex, this.bumpTexture.level);
                    this._effect.setMatrix("normalMatrix", this.bumpTexture.getTextureMatrix());
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
            // Water
            if (BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                this._effect.setTexture("refractionSampler", this._refractionRTT);
                this._effect.setTexture("reflectionSampler", this._reflectionRTT);
            }
            var wrvp = this._mesh.getWorldMatrix().multiply(this._reflectionTransform).multiply(scene.getProjectionMatrix());
            this._lastTime += scene.getEngine().getDeltaTime();
            this._effect.setMatrix("worldReflectionViewProjection", wrvp);
            this._effect.setVector2("windDirection", this.windDirection);
            this._effect.setFloat("waveLength", this.waveLength);
            this._effect.setFloat("time", this._lastTime / 100000);
            this._effect.setFloat("windForce", this.windForce);
            this._effect.setFloat("waveHeight", this.waveHeight);
            this._effect.setFloat("bumpHeight", this.bumpHeight);
            this._effect.setColor4("waterColor", this.waterColor, 1.0);
            this._effect.setFloat("colorBlendFactor", this.colorBlendFactor);
            this._effect.setFloat("waveSpeed", this.waveSpeed);
            _super.prototype.bind.call(this, world, mesh);
        };
        WaterMaterial.prototype._createRenderTargets = function (scene, renderTargetSize) {
            var _this = this;
            // Render targets
            this._refractionRTT = new BABYLON.RenderTargetTexture(name + "_refraction", { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
            this._reflectionRTT = new BABYLON.RenderTargetTexture(name + "_reflection", { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
            scene.customRenderTargets.push(this._refractionRTT);
            scene.customRenderTargets.push(this._reflectionRTT);
            var isVisible;
            var clipPlane = null;
            var savedViewMatrix;
            var mirrorMatrix = BABYLON.Matrix.Zero();
            this._refractionRTT.onBeforeRender = function () {
                if (_this._mesh) {
                    isVisible = _this._mesh.isVisible;
                    _this._mesh.isVisible = false;
                }
                // Clip plane
                clipPlane = scene.clipPlane;
                var positiony = _this._mesh ? _this._mesh.position.y : 0.0;
                scene.clipPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, positiony + 0.05, 0), new BABYLON.Vector3(0, 1, 0));
            };
            this._refractionRTT.onAfterRender = function () {
                if (_this._mesh) {
                    _this._mesh.isVisible = isVisible;
                }
                // Clip plane
                scene.clipPlane = clipPlane;
            };
            this._reflectionRTT.onBeforeRender = function () {
                if (_this._mesh) {
                    isVisible = _this._mesh.isVisible;
                    _this._mesh.isVisible = false;
                }
                // Clip plane
                clipPlane = scene.clipPlane;
                var positiony = _this._mesh ? _this._mesh.position.y : 0.0;
                scene.clipPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, positiony - 0.05, 0), new BABYLON.Vector3(0, -1, 0));
                // Transform
                BABYLON.Matrix.ReflectionToRef(scene.clipPlane, mirrorMatrix);
                savedViewMatrix = scene.getViewMatrix();
                mirrorMatrix.multiplyToRef(savedViewMatrix, _this._reflectionTransform);
                scene.setTransformMatrix(_this._reflectionTransform, scene.getProjectionMatrix());
                scene.getEngine().cullBackFaces = false;
                scene._mirroredCameraPosition = BABYLON.Vector3.TransformCoordinates(scene.activeCamera.position, mirrorMatrix);
            };
            this._reflectionRTT.onAfterRender = function () {
                if (_this._mesh) {
                    _this._mesh.isVisible = isVisible;
                }
                // Clip plane
                scene.clipPlane = clipPlane;
                // Transform
                scene.setTransformMatrix(savedViewMatrix, scene.getProjectionMatrix());
                scene.getEngine().cullBackFaces = true;
                scene._mirroredCameraPosition = null;
            };
        };
        WaterMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
                results.push(this.bumpTexture);
            }
            if (this._reflectionRTT && this._reflectionRTT.animations && this._reflectionRTT.animations.length > 0) {
                results.push(this._reflectionRTT);
            }
            if (this._refractionRTT && this._refractionRTT.animations && this._refractionRTT.animations.length > 0) {
                results.push(this._refractionRTT);
            }
            return results;
        };
        WaterMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.bumpTexture) {
                this.bumpTexture.dispose();
            }
            var index = this.getScene().customRenderTargets.indexOf(this._refractionRTT);
            if (index != -1) {
                this.getScene().customRenderTargets.splice(index, 1);
            }
            index = -1;
            index = this.getScene().customRenderTargets.indexOf(this._reflectionRTT);
            if (index != -1) {
                this.getScene().customRenderTargets.splice(index, 1);
            }
            if (this._reflectionRTT) {
                this._reflectionRTT.dispose();
            }
            if (this._refractionRTT) {
                this._refractionRTT.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        WaterMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new WaterMaterial(name, _this.getScene()); }, this);
        };
        WaterMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.WaterMaterial";
            return serializationObject;
        };
        // Statics
        WaterMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new WaterMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        WaterMaterial.CreateDefaultMesh = function (name, scene) {
            var mesh = BABYLON.Mesh.CreateGround(name, 512, 512, 32, scene, false);
            return mesh;
        };
        __decorate([
            BABYLON.serializeAsTexture()
        ], WaterMaterial.prototype, "bumpTexture");
        __decorate([
            BABYLON.serializeAsColor3()
        ], WaterMaterial.prototype, "diffuseColor");
        __decorate([
            BABYLON.serializeAsColor3()
        ], WaterMaterial.prototype, "specularColor");
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "specularPower");
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "disableLighting");
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "windForce");
        __decorate([
            BABYLON.serializeAsVector2()
        ], WaterMaterial.prototype, "windDirection");
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "waveHeight");
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "bumpHeight");
        __decorate([
            BABYLON.serializeAsColor3()
        ], WaterMaterial.prototype, "waterColor");
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "colorBlendFactor");
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "waveLength");
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "waveSpeed");
        return WaterMaterial;
    })(BABYLON.Material);
    BABYLON.WaterMaterial = WaterMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['waterVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#ifdef BONES\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#endif\n\n#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef BUMP\nvarying vec2 vNormalUV;\nuniform mat4 normalMatrix;\nuniform vec2 vNormalInfos;\n#endif\n#ifdef BONES\nuniform mat4 mBones[BonesPerMesh];\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif\n#ifdef FOG\nvarying float fFogDistance;\n#endif\n#ifdef SHADOWS\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\nuniform mat4 lightMatrix0;\nvarying vec4 vPositionFromLight0;\n#endif\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\nuniform mat4 lightMatrix1;\nvarying vec4 vPositionFromLight1;\n#endif\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\nuniform mat4 lightMatrix2;\nvarying vec4 vPositionFromLight2;\n#endif\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\nuniform mat4 lightMatrix3;\nvarying vec4 vPositionFromLight3;\n#endif\n#endif\n\nuniform mat4 worldReflectionViewProjection;\nuniform vec2 windDirection;\nuniform float waveLength;\nuniform float time;\nuniform float windForce;\nuniform float waveHeight;\nuniform float waveSpeed;\n\nvarying vec3 vPosition;\nvarying vec3 vRefractionMapTexCoord;\nvarying vec3 vReflectionMapTexCoord;\nvoid main(void) {\nmat4 finalWorld;\n#ifdef INSTANCES\nfinalWorld=mat4(world0,world1,world2,world3);\n#else\nfinalWorld=world;\n#endif\n#ifdef BONES\nmat4 m0=mBones[int(matricesIndices.x)]*matricesWeights.x;\nmat4 m1=mBones[int(matricesIndices.y)]*matricesWeights.y;\nmat4 m2=mBones[int(matricesIndices.z)]*matricesWeights.z;\n#ifdef BONES4\nmat4 m3=mBones[int(matricesIndices.w)]*matricesWeights.w;\nfinalWorld=finalWorld*(m0+m1+m2+m3);\n#else\nfinalWorld=finalWorld*(m0+m1+m2);\n#endif \n#endif\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef BUMP\nif (vNormalInfos.x == 0.)\n{\nvNormalUV=vec2(normalMatrix*vec4((uv*1.0)/waveLength+time*windForce*windDirection,1.0,0.0));\n}\nelse\n{\nvNormalUV=vec2(normalMatrix*vec4((uv2*1.0)/waveLength+time*windForce*windDirection,1.0,0.0));\n}\n#endif\n\n#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif\n\n#ifdef FOG\nfFogDistance=(view*worldPos).z;\n#endif\n\n#ifdef SHADOWS\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\nvPositionFromLight0=lightMatrix0*worldPos;\n#endif\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\nvPositionFromLight1=lightMatrix1*worldPos;\n#endif\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\nvPositionFromLight2=lightMatrix2*worldPos;\n#endif\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\nvPositionFromLight3=lightMatrix3*worldPos;\n#endif\n#endif\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\nvec3 p=position;\nfloat newY=(sin(((p.x/0.05)+time*waveSpeed))*waveHeight*windDirection.x*5.0)\n+(cos(((p.z/0.05)+time*waveSpeed))*waveHeight*windDirection.y*5.0);\np.y+=abs(newY);\ngl_Position=viewProjection*finalWorld*vec4(p,1.0);\n#ifdef REFLECTION\nworldPos=viewProjection*finalWorld*vec4(p,1.0);\n\nvPosition=position;\nvRefractionMapTexCoord.x=0.5*(worldPos.w+worldPos.x);\nvRefractionMapTexCoord.y=0.5*(worldPos.w+worldPos.y);\nvRefractionMapTexCoord.z=worldPos.w;\nworldPos=worldReflectionViewProjection*vec4(position,1.0);\nvReflectionMapTexCoord.x=0.5*(worldPos.w+worldPos.x);\nvReflectionMapTexCoord.y=0.5*(worldPos.w+worldPos.y);\nvReflectionMapTexCoord.z=worldPos.w;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['waterPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#ifdef LIGHT0\nuniform vec4 vLightData0;\nuniform vec4 vLightDiffuse0;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular0;\n#endif\n#ifdef SHADOW0\n#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)\nvarying vec4 vPositionFromLight0;\nuniform sampler2D shadowSampler0;\n#else\nuniform samplerCube shadowSampler0;\n#endif\nuniform vec3 shadowsInfo0;\n#endif\n#ifdef SPOTLIGHT0\nuniform vec4 vLightDirection0;\n#endif\n#ifdef HEMILIGHT0\nuniform vec3 vLightGround0;\n#endif\n#endif\n#ifdef LIGHT1\nuniform vec4 vLightData1;\nuniform vec4 vLightDiffuse1;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular1;\n#endif\n#ifdef SHADOW1\n#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)\nvarying vec4 vPositionFromLight1;\nuniform sampler2D shadowSampler1;\n#else\nuniform samplerCube shadowSampler1;\n#endif\nuniform vec3 shadowsInfo1;\n#endif\n#ifdef SPOTLIGHT1\nuniform vec4 vLightDirection1;\n#endif\n#ifdef HEMILIGHT1\nuniform vec3 vLightGround1;\n#endif\n#endif\n#ifdef LIGHT2\nuniform vec4 vLightData2;\nuniform vec4 vLightDiffuse2;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular2;\n#endif\n#ifdef SHADOW2\n#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)\nvarying vec4 vPositionFromLight2;\nuniform sampler2D shadowSampler2;\n#else\nuniform samplerCube shadowSampler2;\n#endif\nuniform vec3 shadowsInfo2;\n#endif\n#ifdef SPOTLIGHT2\nuniform vec4 vLightDirection2;\n#endif\n#ifdef HEMILIGHT2\nuniform vec3 vLightGround2;\n#endif\n#endif\n#ifdef LIGHT3\nuniform vec4 vLightData3;\nuniform vec4 vLightDiffuse3;\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular3;\n#endif\n#ifdef SHADOW3\n#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)\nvarying vec4 vPositionFromLight3;\nuniform sampler2D shadowSampler3;\n#else\nuniform samplerCube shadowSampler3;\n#endif\nuniform vec3 shadowsInfo3;\n#endif\n#ifdef SPOTLIGHT3\nuniform vec4 vLightDirection3;\n#endif\n#ifdef HEMILIGHT3\nuniform vec3 vLightGround3;\n#endif\n#endif\n\n#ifdef BUMP\nvarying vec2 vNormalUV;\nuniform sampler2D normalSampler;\nuniform vec2 vNormalInfos;\n#endif\nuniform sampler2D refractionSampler;\nuniform sampler2D reflectionSampler;\n\nconst float LOG2=1.442695;\nuniform vec3 cameraPosition;\nuniform vec4 waterColor;\nuniform float colorBlendFactor;\nuniform float bumpHeight;\n\nvarying vec3 vRefractionMapTexCoord;\nvarying vec3 vReflectionMapTexCoord;\nvarying vec3 vPosition;\n\n#ifdef SHADOWS\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#if defined(POINTLIGHT0) || defined(POINTLIGHT1) || defined(POINTLIGHT2) || defined(POINTLIGHT3)\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float bias)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y =-directionToLight.y;\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight))+bias;\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float bias,float darkness,float mapSize)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=clamp(depth,0.,1.0);\nfloat diskScale=2.0/mapSize;\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-0.094201624,0.04,-0.039906216);\npoissonDisk[1]=vec3(0.094558609,-0.04,-0.076890725);\npoissonDisk[2]=vec3(-0.094184101,0.01,-0.092938870);\npoissonDisk[3]=vec3(0.034495938,-0.01,0.029387760);\n\nfloat biasedDepth=depth-bias;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]))<biasedDepth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]))<biasedDepth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]))<biasedDepth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]))<biasedDepth) visibility-=0.25;\nreturn min(1.0,visibility+darkness);\n}\n#endif\n#if defined(SPOTLIGHT0) || defined(SPOTLIGHT1) || defined(SPOTLIGHT2) || defined(SPOTLIGHT3) || defined(DIRLIGHT0) || defined(DIRLIGHT1) || defined(DIRLIGHT2) || defined(DIRLIGHT3)\nfloat computeShadow(vec4 vPositionFromLight,sampler2D shadowSampler,float darkness,float bias)\n{\nvec3 depth=vPositionFromLight.xyz/vPositionFromLight.w;\ndepth=0.5*depth+vec3(0.5);\nvec2 uv=depth.xy;\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadow=unpack(texture2D(shadowSampler,uv))+bias;\nif (depth.z>shadow)\n{\nreturn darkness;\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,sampler2D shadowSampler,float mapSize,float bias,float darkness)\n{\nvec3 depth=vPositionFromLight.xyz/vPositionFromLight.w;\ndepth=0.5*depth+vec3(0.5);\nvec2 uv=depth.xy;\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\nfloat biasedDepth=depth.z-bias;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]/mapSize))<biasedDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]/mapSize))<biasedDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]/mapSize))<biasedDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]/mapSize))<biasedDepth) visibility-=0.25;\nreturn min(1.0,visibility+darkness);\n}\n\nfloat unpackHalf(vec2 color)\n{\nreturn color.x+(color.y/255.0);\n}\nfloat linstep(float low,float high,float v) {\nreturn clamp((v-low)/(high-low),0.0,1.0);\n}\nfloat ChebychevInequality(vec2 moments,float compare,float bias)\n{\nfloat p=smoothstep(compare-bias,compare,moments.x);\nfloat variance=max(moments.y-moments.x*moments.x,0.02);\nfloat d=compare-moments.x;\nfloat p_max=linstep(0.2,1.0,variance/(variance+d*d));\nreturn clamp(max(p,p_max),0.0,1.0);\n}\nfloat computeShadowWithVSM(vec4 vPositionFromLight,sampler2D shadowSampler,float bias,float darkness)\n{\nvec3 depth=vPositionFromLight.xyz/vPositionFromLight.w;\ndepth=0.5*depth+vec3(0.5);\nvec2 uv=depth.xy;\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0 || depth.z>=1.0)\n{\nreturn 1.0;\n}\nvec4 texel=texture2D(shadowSampler,uv);\nvec2 moments=vec2(unpackHalf(texel.xy),unpackHalf(texel.zw));\nreturn min(1.0,1.0-ChebychevInequality(moments,depth.z,bias)+darkness);\n}\n#endif\n#endif\n#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif\n\n#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying float fFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fFogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fFogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fFogDistance*fFogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif\n\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness,vec3 bumpColor) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\nresult.diffuse=ndl*diffuseColor*attenuation;\n\n#ifdef SPECULARTERM\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nvec3 perturbation=bumpHeight*(bumpColor.rgb-0.5);\nvec3 halfvec=normalize(angleW+lightVectorW+vec3(perturbation.x,perturbation.y,perturbation.z));\nfloat temp=max(0.,dot(vNormal,halfvec));\ntemp=pow(temp,max(1.,glossiness));\nresult.specular=temp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 specularColor,vec3 diffuseColor,float range,float glossiness,vec3 bumpColor) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(-lightDirection.xyz,lightVectorW));\nfloat spotAtten=0.0;\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nspotAtten=clamp((cosAngle-lightDirection.w)/(1.-cosAngle),0.0,1.0);\n\nfloat ndl=max(0.,dot(vNormal,-lightDirection.xyz));\nresult.diffuse=ndl*spotAtten*diffuseColor*attenuation;\n\n#ifdef SPECULARTERM \nvec3 angleW=normalize(viewDirectionW-lightDirection.xyz);\nvec3 perturbation=bumpHeight*(bumpColor.rgb-0.5);\nvec3 halfvec=normalize(angleW+vec3(perturbation.x,perturbation.y,perturbation.z));\nfloat temp=max(0.,dot(vNormal,halfvec));\ntemp=pow(temp,max(1.,glossiness));\nresult.specular=specularColor*temp*spotAtten*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness,vec3 bumpColor) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n\n#ifdef SPECULARTERM\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nvec3 perturbation=bumpHeight*(bumpColor.rgb-0.5);\nvec3 halfvec=normalize(angleW+vec3(perturbation.x,perturbation.y,perturbation.z));\nfloat temp=max(0.0,dot(vNormal,halfvec));\ntemp=pow(temp,max(1.0,glossiness));\nresult.specular=temp*specularColor;\n#endif\nreturn result;\n}\nvoid main(void) {\n\n#ifdef CLIPPLANE\nif (fClipDistance>0.0)\ndiscard;\n#endif\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#else\nfloat glossiness=0.;\n#endif\n\nfloat alpha=vDiffuseColor.a;\n#ifdef BUMP\nbaseColor=texture2D(normalSampler,vNormalUV);\nvec3 bumpColor=baseColor.rgb;\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\nbaseColor.rgb*=vNormalInfos.y;\n#else\nvec3 bumpColor=vec3(1.0);\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\nvec2 perturbation=bumpHeight*(baseColor.rg-0.5);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\nvec2 perturbation=bumpHeight*(vec2(1.0,1.0)-0.5);\n#endif\n#ifdef REFLECTION\n\nvec3 eyeVector=normalize(vEyePosition-vPosition);\nvec2 projectedRefractionTexCoords=clamp(vRefractionMapTexCoord.xy/vRefractionMapTexCoord.z+perturbation,0.0,1.0);\nvec4 refractiveColor=texture2D(refractionSampler,projectedRefractionTexCoords);\nvec2 projectedReflectionTexCoords=clamp(vReflectionMapTexCoord.xy/vReflectionMapTexCoord.z+perturbation,0.0,1.0);\nvec4 reflectiveColor=texture2D(reflectionSampler,projectedReflectionTexCoords);\nvec3 upVector=vec3(0.0,1.0,0.0);\nfloat fresnelTerm=max(dot(eyeVector,upVector),0.0);\nvec4 combinedColor=refractiveColor*fresnelTerm+reflectiveColor*(1.0-fresnelTerm);\nbaseColor=colorBlendFactor*waterColor+(1.0-colorBlendFactor)*combinedColor;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHT0\n#ifndef SPECULARTERM\nvec3 vLightSpecular0=vec3(0.0);\n#endif\n#ifdef SPOTLIGHT0\nlightingInfo info=computeSpotLighting(viewDirectionW,normalW,vLightData0,vLightDirection0,vLightDiffuse0.rgb,vLightSpecular0,vLightDiffuse0.a,glossiness,bumpColor);\n#endif\n#ifdef HEMILIGHT0\nlightingInfo info=computeHemisphericLighting(viewDirectionW,normalW,vLightData0,vLightDiffuse0.rgb,vLightSpecular0,vLightGround0,glossiness,bumpColor);\n#endif\n#if defined(POINTLIGHT0) || defined(DIRLIGHT0)\nlightingInfo info=computeLighting(viewDirectionW,normalW,vLightData0,vLightDiffuse0.rgb,vLightSpecular0,vLightDiffuse0.a,glossiness,bumpColor);\n#endif\n#ifdef SHADOW0\n#ifdef SHADOWVSM0\nshadow=computeShadowWithVSM(vPositionFromLight0,shadowSampler0,shadowsInfo0.z,shadowsInfo0.x);\n#else\n#ifdef SHADOWPCF0\n#if defined(POINTLIGHT0)\nshadow=computeShadowWithPCFCube(vLightData0.xyz,shadowSampler0,shadowsInfo0.z,shadowsInfo0.x,shadowsInfo0.y);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight0,shadowSampler0,shadowsInfo0.y,shadowsInfo0.z,shadowsInfo0.x);\n#endif\n#else\n#if defined(POINTLIGHT0)\nshadow=computeShadowCube(vLightData0.xyz,shadowSampler0,shadowsInfo0.x,shadowsInfo0.z);\n#else\nshadow=computeShadow(vPositionFromLight0,shadowSampler0,shadowsInfo0.x,shadowsInfo0.z);\n#endif\n#endif\n#endif\n#else\nshadow=1.;\n#endif\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#ifdef LIGHT1\n#ifndef SPECULARTERM\nvec3 vLightSpecular1=vec3(0.0);\n#endif\n#ifdef SPOTLIGHT1\ninfo=computeSpotLighting(viewDirectionW,normalW,vLightData1,vLightDirection1,vLightDiffuse1.rgb,vLightSpecular1,vLightDiffuse1.a,glossiness,bumpColor);\n#endif\n#ifdef HEMILIGHT1\ninfo=computeHemisphericLighting(viewDirectionW,normalW,vLightData1,vLightDiffuse1.rgb,vLightSpecular1,vLightGround1.a,glossiness,bumpColor);\n#endif\n#if defined(POINTLIGHT1) || defined(DIRLIGHT1)\ninfo=computeLighting(viewDirectionW,normalW,vLightData1,vLightDiffuse1.rgb,vLightSpecular1,vLightDiffuse1.a,glossiness,bumpColor);\n#endif\n#ifdef SHADOW1\n#ifdef SHADOWVSM1\nshadow=computeShadowWithVSM(vPositionFromLight1,shadowSampler1,shadowsInfo1.z,shadowsInfo1.x);\n#else\n#ifdef SHADOWPCF1\n#if defined(POINTLIGHT1)\nshadow=computeShadowWithPCFCube(vLightData1.xyz,shadowSampler1,shadowsInfo1.z,shadowsInfo1.x,shadowsInfo1.y);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight1,shadowSampler1,shadowsInfo1.y,shadowsInfo1.z,shadowsInfo1.x);\n#endif\n#else\n#if defined(POINTLIGHT1)\nshadow=computeShadowCube(vLightData1.xyz,shadowSampler1,shadowsInfo1.x,shadowsInfo1.z);\n#else\nshadow=computeShadow(vPositionFromLight1,shadowSampler1,shadowsInfo1.x,shadowsInfo1.z);\n#endif\n#endif\n#endif\n#else\nshadow=1.;\n#endif\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#ifdef LIGHT2\n#ifndef SPECULARTERM\nvec3 vLightSpecular2=vec3(0.0);\n#endif\n#ifdef SPOTLIGHT2\ninfo=computeSpotLighting(viewDirectionW,normalW,vLightData2,vLightDirection2,vLightDiffuse2.rgb,vLightSpecular2,vLightDiffuse2.a,glossiness,bumpColor);\n#endif\n#ifdef HEMILIGHT2\ninfo=computeHemisphericLighting(viewDirectionW,normalW,vLightData2,vLightDiffuse2.rgb,vLightSpecular2,vLightGround2,glossiness,bumpColor);\n#endif\n#if defined(POINTLIGHT2) || defined(DIRLIGHT2)\ninfo=computeLighting(viewDirectionW,normalW,vLightData2,vLightDiffuse2.rgb,vLightSpecular2,vLightDiffuse2.a,glossiness,bumpColor);\n#endif\n#ifdef SHADOW2\n#ifdef SHADOWVSM2\nshadow=computeShadowWithVSM(vPositionFromLight2,shadowSampler2,shadowsInfo2.z,shadowsInfo2.x);\n#else\n#ifdef SHADOWPCF2\n#if defined(POINTLIGHT2)\nshadow=computeShadowWithPCFCube(vLightData2.xyz,shadowSampler2,shadowsInfo2.z,shadowsInfo2.x,shadowsInfo2.y);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight2,shadowSampler2,shadowsInfo2.y,shadowsInfo2.z,shadowsInfo2.x);\n#endif\n#else\n#if defined(POINTLIGHT2)\nshadow=computeShadowCube(vLightData2.xyz,shadowSampler2,shadowsInfo2.x,shadowsInfo2.z);\n#else\nshadow=computeShadow(vPositionFromLight2,shadowSampler2,shadowsInfo2.x,shadowsInfo2.z);\n#endif\n#endif \n#endif \n#else\nshadow=1.;\n#endif\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#ifdef LIGHT3\n#ifndef SPECULARTERM\nvec3 vLightSpecular3=vec3(0.0);\n#endif\n#ifdef SPOTLIGHT3\ninfo=computeSpotLighting(viewDirectionW,normalW,vLightData3,vLightDirection3,vLightDiffuse3.rgb,vLightSpecular3,vLightDiffuse3.a,glossiness,bumpColor);\n#endif\n#ifdef HEMILIGHT3\ninfo=computeHemisphericLighting(viewDirectionW,normalW,vLightData3,vLightDiffuse3.rgb,vLightSpecular3,vLightGround3,glossiness,bumpColor);\n#endif\n#if defined(POINTLIGHT3) || defined(DIRLIGHT3)\ninfo=computeLighting(viewDirectionW,normalW,vLightData3,vLightDiffuse3.rgb,vLightSpecular3,vLightDiffuse3.a,glossiness,bumpColor);\n#endif\n#ifdef SHADOW3\n#ifdef SHADOWVSM3\nshadow=computeShadowWithVSM(vPositionFromLight3,shadowSampler3,shadowsInfo3.z,shadowsInfo3.x);\n#else\n#ifdef SHADOWPCF3\n#if defined(POINTLIGHT3)\nshadow=computeShadowWithPCFCube(vLightData3.xyz,shadowSampler3,shadowsInfo3.z,shadowsInfo3.x,shadowsInfo3.y);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight3,shadowSampler3,shadowsInfo3.y,shadowsInfo3.z,shadowsInfo3.x);\n#endif\n#else\n#if defined(POINTLIGHT3)\nshadow=computeShadowCube(vLightData3.xyz,shadowSampler3,shadowsInfo3.x,shadowsInfo3.z);\n#else\nshadow=computeShadow(vPositionFromLight3,shadowSampler3,shadowsInfo3.x,shadowsInfo3.z);\n#endif\n#endif \n#endif \n#else\nshadow=1.;\n#endif\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;\n\nvec4 color=vec4(finalDiffuse+finalSpecular,alpha);\n#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif\ngl_FragColor=color;\n}";
