var BABYLON;
(function (BABYLON) {
    var maxSimultaneousLights = 4;
    var MaterialHelper = (function () {
        function MaterialHelper() {
        }
        MaterialHelper.PrepareDefinesForLights = function (scene, mesh, defines) {
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
                if (!light.specular.equalsFloats(0, 0, 0) && defines["SPECULARTERM"] !== undefined) {
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
        MaterialHelper.HandleFallbacksForShadows = function (defines, fallbacks) {
            for (var lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
                if (!defines["LIGHT" + lightIndex]) {
                    continue;
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
        MaterialHelper.BindLights = function (scene, mesh, effect, defines) {
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
        return MaterialHelper;
    })();
    BABYLON.MaterialHelper = MaterialHelper;
})(BABYLON || (BABYLON = {}));
