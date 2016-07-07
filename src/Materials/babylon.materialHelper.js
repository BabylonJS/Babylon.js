var BABYLON;
(function (BABYLON) {
    var MaterialHelper = (function () {
        function MaterialHelper() {
        }
        MaterialHelper.PrepareDefinesForLights = function (scene, mesh, defines, maxSimultaneousLights) {
            if (maxSimultaneousLights === void 0) { maxSimultaneousLights = 4; }
            var lightIndex = 0;
            var needNormals = false;
            var needRebuild = false;
            var needShadows = false;
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
                if (defines["LIGHT" + lightIndex] === undefined) {
                    needRebuild = true;
                }
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
                if (defines[type] === undefined) {
                    needRebuild = true;
                }
                defines[type] = true;
                // Specular
                if (!light.specular.equalsFloats(0, 0, 0) && defines["SPECULARTERM"] !== undefined) {
                    defines["SPECULARTERM"] = true;
                }
                // Shadows
                if (scene.shadowsEnabled) {
                    var shadowGenerator = light.getShadowGenerator();
                    if (mesh && mesh.receiveShadows && shadowGenerator) {
                        if (defines["SHADOW" + lightIndex] === undefined) {
                            needRebuild = true;
                        }
                        defines["SHADOW" + lightIndex] = true;
                        defines["SHADOWS"] = true;
                        if (shadowGenerator.useVarianceShadowMap || shadowGenerator.useBlurVarianceShadowMap) {
                            if (defines["SHADOWVSM" + lightIndex] === undefined) {
                                needRebuild = true;
                            }
                            defines["SHADOWVSM" + lightIndex] = true;
                        }
                        if (shadowGenerator.usePoissonSampling) {
                            if (defines["SHADOWPCF" + lightIndex] === undefined) {
                                needRebuild = true;
                            }
                            defines["SHADOWPCF" + lightIndex] = true;
                        }
                        needShadows = true;
                    }
                }
                lightIndex++;
                if (lightIndex === maxSimultaneousLights)
                    break;
            }
            var caps = scene.getEngine().getCaps();
            if (needShadows && caps.textureFloat && caps.textureFloatLinearFiltering && caps.textureFloatRender) {
                if (defines["SHADOWFULLFLOAT"] === undefined) {
                    needRebuild = true;
                }
                defines["SHADOWFULLFLOAT"] = true;
            }
            if (needRebuild) {
                defines.rebuild();
            }
            return needNormals;
        };
        MaterialHelper.PrepareUniformsAndSamplersList = function (uniformsList, samplersList, defines, maxSimultaneousLights) {
            if (maxSimultaneousLights === void 0) { maxSimultaneousLights = 4; }
            for (var lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
                if (!defines["LIGHT" + lightIndex]) {
                    break;
                }
                uniformsList.push("vLightData" + lightIndex, "vLightDiffuse" + lightIndex, "vLightSpecular" + lightIndex, "vLightDirection" + lightIndex, "vLightGround" + lightIndex, "lightMatrix" + lightIndex, "shadowsInfo" + lightIndex);
                samplersList.push("shadowSampler" + lightIndex);
            }
        };
        MaterialHelper.HandleFallbacksForShadows = function (defines, fallbacks, maxSimultaneousLights) {
            if (maxSimultaneousLights === void 0) { maxSimultaneousLights = 4; }
            for (var lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
                if (!defines["LIGHT" + lightIndex]) {
                    break;
                }
                if (lightIndex > 0) {
                    fallbacks.addFallback(lightIndex, "LIGHT" + lightIndex);
                }
                if (defines["SHADOW" + lightIndex]) {
                    fallbacks.addFallback(0, "SHADOW" + lightIndex);
                }
                if (defines["SHADOWPCF" + lightIndex]) {
                    fallbacks.addFallback(0, "SHADOWPCF" + lightIndex);
                }
                if (defines["SHADOWVSM" + lightIndex]) {
                    fallbacks.addFallback(0, "SHADOWVSM" + lightIndex);
                }
            }
        };
        MaterialHelper.PrepareAttributesForBones = function (attribs, mesh, defines, fallbacks) {
            if (defines["NUM_BONE_INFLUENCERS"] > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
                attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                if (defines["NUM_BONE_INFLUENCERS"] > 4) {
                    attribs.push(BABYLON.VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(BABYLON.VertexBuffer.MatricesWeightsExtraKind);
                }
            }
        };
        MaterialHelper.PrepareAttributesForInstances = function (attribs, defines) {
            if (defines["INSTANCES"]) {
                attribs.push("world0");
                attribs.push("world1");
                attribs.push("world2");
                attribs.push("world3");
            }
        };
        // Bindings
        MaterialHelper.BindLightShadow = function (light, scene, mesh, lightIndex, effect, depthValuesAlreadySet) {
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
                effect.setFloat3("shadowsInfo" + lightIndex, shadowGenerator.getDarkness(), shadowGenerator.blurScale / shadowGenerator.getShadowMap().getSize().width, shadowGenerator.bias);
            }
            return depthValuesAlreadySet;
        };
        MaterialHelper.BindLightProperties = function (light, effect, lightIndex) {
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
        };
        MaterialHelper.BindLights = function (scene, mesh, effect, defines, maxSimultaneousLights) {
            if (maxSimultaneousLights === void 0) { maxSimultaneousLights = 4; }
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
                MaterialHelper.BindLightProperties(light, effect, lightIndex);
                light.diffuse.scaleToRef(light.intensity, BABYLON.Tmp.Color3[0]);
                effect.setColor4("vLightDiffuse" + lightIndex, BABYLON.Tmp.Color3[0], light.range);
                if (defines["SPECULARTERM"]) {
                    light.specular.scaleToRef(light.intensity, BABYLON.Tmp.Color3[1]);
                    effect.setColor3("vLightSpecular" + lightIndex, BABYLON.Tmp.Color3[1]);
                }
                // Shadows
                if (scene.shadowsEnabled) {
                    depthValuesAlreadySet = this.BindLightShadow(light, scene, mesh, lightIndex, effect, depthValuesAlreadySet);
                }
                lightIndex++;
                if (lightIndex === maxSimultaneousLights)
                    break;
            }
        };
        MaterialHelper.BindFogParameters = function (scene, mesh, effect) {
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
                effect.setColor3("vFogColor", scene.fogColor);
            }
        };
        MaterialHelper.BindBonesParameters = function (mesh, effect) {
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders) {
                effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
            }
        };
        MaterialHelper.BindLogDepth = function (defines, effect, scene) {
            if (defines["LOGARITHMICDEPTH"]) {
                effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(scene.activeCamera.maxZ + 1.0) / Math.LN2));
            }
        };
        MaterialHelper.BindClipPlane = function (effect, scene) {
            if (scene.clipPlane) {
                var clipPlane = scene.clipPlane;
                effect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
            }
        };
        return MaterialHelper;
    }());
    BABYLON.MaterialHelper = MaterialHelper;
})(BABYLON || (BABYLON = {}));
