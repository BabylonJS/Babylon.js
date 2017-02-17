module BABYLON {
    export class MaterialHelper {
        public static PrepareDefinesForLights(scene: Scene, mesh: AbstractMesh, defines: MaterialDefines, maxSimultaneousLights = 4): boolean {
            var lightIndex = 0;
            var needNormals = false;
            var needRebuild = false;
            var needShadows = false;
            var lightmapMode = false;

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
                if (light instanceof SpotLight) {
                    type = "SPOTLIGHT" + lightIndex;
                } else if (light instanceof HemisphericLight) {
                    type = "HEMILIGHT" + lightIndex;
                } else if (light instanceof PointLight) {
                    type = "POINTLIGHT" + lightIndex;
                } else {
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
                    var shadowGenerator = <ShadowGenerator>light.getShadowGenerator();
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

                if (light.lightmapMode != Light.LIGHTMAP_DEFAULT ) {
                    lightmapMode = true;
                    if (defines["LIGHTMAPEXCLUDED" + lightIndex] === undefined) {
                        needRebuild = true;
                    }
                    if (defines["LIGHTMAPNOSPECULAR" + lightIndex] === undefined) {
                        needRebuild = true;
                    }
                    defines["LIGHTMAPEXCLUDED" + lightIndex] = true;
                    if (light.lightmapMode == Light.LIGHTMAP_SHADOWSONLY) {
                        defines["LIGHTMAPNOSPECULAR" + lightIndex] = true;
                    }
                }

                lightIndex++;
                if (lightIndex === maxSimultaneousLights)
                    break;
            }

            let caps = scene.getEngine().getCaps();
            if (needShadows && caps.textureFloat && caps.textureFloatLinearFiltering && caps.textureFloatRender) {
                if (defines["SHADOWFULLFLOAT"] === undefined) {
                    needRebuild = true;
                }

                defines["SHADOWFULLFLOAT"] = true;
            }

            if (defines["LIGHTMAPEXCLUDED"] === undefined) {
                needRebuild = true;
            }
            if (lightmapMode) {
                defines["LIGHTMAPEXCLUDED"] = true;
            }

            if (needRebuild) {
                defines.rebuild();
            }

            return needNormals;
        }

        public static PrepareUniformsAndSamplersList(uniformsList: string[], samplersList: string[], defines: MaterialDefines, maxSimultaneousLights = 4): void {
            for (var lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
                if (!defines["LIGHT" + lightIndex]) {
                    break;
                }

                uniformsList.push(
                    "vLightData" + lightIndex,
                    "vLightDiffuse" + lightIndex,
                    "vLightSpecular" + lightIndex,
                    "vLightDirection" + lightIndex,
                    "vLightGround" + lightIndex,
                    "lightMatrix" + lightIndex,
                    "shadowsInfo" + lightIndex
                );

                samplersList.push("shadowSampler" + lightIndex);
            }
        }

        public static HandleFallbacksForShadows(defines: MaterialDefines, fallbacks: EffectFallbacks, maxSimultaneousLights = 4): void {
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
        }

        public static PrepareAttributesForBones(attribs: string[], mesh: AbstractMesh, defines: MaterialDefines, fallbacks: EffectFallbacks): void {
            if (defines["NUM_BONE_INFLUENCERS"] > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);

                attribs.push(VertexBuffer.MatricesIndicesKind);
                attribs.push(VertexBuffer.MatricesWeightsKind);
                if (defines["NUM_BONE_INFLUENCERS"] > 4) {
                    attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(VertexBuffer.MatricesWeightsExtraKind);
                }
            }
        }

        public static PrepareAttributesForInstances(attribs: string[], defines: MaterialDefines): void {
            if (defines["INSTANCES"]) {
                attribs.push("world0");
                attribs.push("world1");
                attribs.push("world2");
                attribs.push("world3");
            }
        }

        // Bindings
        public static BindLightShadow(light: Light, scene: Scene, mesh: AbstractMesh, lightIndex: number, effect: Effect, depthValuesAlreadySet: boolean): boolean {
            var shadowGenerator = <ShadowGenerator>light.getShadowGenerator();
            if (mesh.receiveShadows && shadowGenerator) {
                if (!(<any>light).needCube()) {
                    effect.setMatrix("lightMatrix" + lightIndex, shadowGenerator.getTransformMatrix());
                } else {
                    if (!depthValuesAlreadySet) {
                        depthValuesAlreadySet = true;
                        effect.setFloat2("depthValues", scene.activeCamera.minZ, scene.activeCamera.maxZ);
                    }
                }
                effect.setTexture("shadowSampler" + lightIndex, shadowGenerator.getShadowMapForRendering());
                effect.setFloat3("shadowsInfo" + lightIndex, shadowGenerator.getDarkness(), shadowGenerator.blurScale / shadowGenerator.getShadowMap().getSize().width, shadowGenerator.bias);
            }

            return depthValuesAlreadySet;
        }

        public static BindLightProperties(light: Light, effect: Effect, lightIndex: number): void {
            if (light instanceof PointLight) {
                // Point Light
                light.transferToEffect(effect, "vLightData" + lightIndex);
            } else if (light instanceof DirectionalLight) {
                // Directional Light
                light.transferToEffect(effect, "vLightData" + lightIndex);
            } else if (light instanceof SpotLight) {
                // Spot Light
                light.transferToEffect(effect, "vLightData" + lightIndex, "vLightDirection" + lightIndex);
            } else if (light instanceof HemisphericLight) {
                // Hemispheric Light
                light.transferToEffect(effect, "vLightData" + lightIndex, "vLightGround" + lightIndex);
            }
        }

        public static BindLights(scene: Scene, mesh: AbstractMesh, effect: Effect, defines: MaterialDefines, maxSimultaneousLights = 4) {
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

                light.diffuse.scaleToRef(light.intensity, Tmp.Color3[0]);
                effect.setColor4("vLightDiffuse" + lightIndex, Tmp.Color3[0], light.range);
                if (defines["SPECULARTERM"]) {
                    light.specular.scaleToRef(light.intensity, Tmp.Color3[1]);
                    effect.setColor3("vLightSpecular" + lightIndex, Tmp.Color3[1]);
                }

                // Shadows
                if (scene.shadowsEnabled) {
                    depthValuesAlreadySet = this.BindLightShadow(light, scene, mesh, lightIndex, effect, depthValuesAlreadySet);
                }

                lightIndex++;

                if (lightIndex === maxSimultaneousLights)
                    break;
            }
        }

        public static BindFogParameters(scene: Scene, mesh: AbstractMesh, effect: Effect): void {
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
                effect.setColor3("vFogColor", scene.fogColor);
            }
        }

        public static BindBonesParameters(mesh: AbstractMesh, effect: Effect): void {
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders) {
                var matrices = mesh.skeleton.getTransformMatrices(mesh);

                if (matrices) {
                    effect.setMatrices("mBones", matrices);
                }
            }
        }

        public static BindLogDepth(defines: MaterialDefines, effect: Effect, scene: Scene): void {
            if (defines["LOGARITHMICDEPTH"]) {
                effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(scene.activeCamera.maxZ + 1.0) / Math.LN2));
            }
        }

        public static BindClipPlane(effect: Effect, scene: Scene): void {
            if (scene.clipPlane) {
                var clipPlane = scene.clipPlane;
                effect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
            }
        }
    }
}