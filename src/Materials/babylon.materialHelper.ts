module BABYLON {
    export class MaterialHelper {

        public static PrepareDefinesForMisc(mesh: AbstractMesh, scene: Scene, useLogarithmicDepth: boolean, pointsCloud, fogEnabled: boolean, defines: MaterialDefines): void {
            if (defines._areMiscDirty) {
                defines["LOGARITHMICDEPTH"] = useLogarithmicDepth;
                defines["POINTSIZE"] = (pointsCloud || scene.forcePointsCloud);
                defines["FOG"] = (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE && fogEnabled);
            }
        }

        public static PrepareDefinesForFrameBoundValues(scene: Scene, engine: Engine, defines: MaterialDefines, useInstances: boolean): void {
            var changed = false;

            if (defines["CLIPPLANE"] !== (scene.clipPlane !== undefined && scene.clipPlane !== null)) {
                defines["CLIPPLANE"] = !defines["CLIPPLANE"];
                changed = true;
            }

            if (defines["ALPHATEST"] !== engine.getAlphaTesting()) {
                defines["ALPHATEST"] = !defines["ALPHATEST"];
                changed = true;
            }

            if (defines["INSTANCES"] !== useInstances) {
                defines["INSTANCES"] = useInstances;
                changed = true;
            }
            
            if (changed) {
                defines.markAsUnprocessed();
            }
        }

        public static PrepareDefinesForAttributes(mesh: AbstractMesh, defines: MaterialDefines, useVertexColor: boolean, useBones: boolean): void {
            if (!defines._areAttributesDirty) {
                return;
            }

            defines["NORMAL"] = (defines._needNormals && mesh.isVerticesDataPresent(VertexBuffer.NormalKind));

            if (defines._needUVs) {
                defines["UV1"] = mesh.isVerticesDataPresent(VertexBuffer.UVKind);
                defines["UV2"] = mesh.isVerticesDataPresent(VertexBuffer.UV2Kind);
            } else {
                defines["UV1"] = false;
                defines["UV2"] = false;
            }

            if (useVertexColor) {
                defines["VERTEXCOLOR"] = mesh.useVertexColors && mesh.isVerticesDataPresent(VertexBuffer.ColorKind);
                defines["VERTEXALPHA"] = mesh.hasVertexAlpha;
            }

            if (useBones) {
                if (mesh.useBones && mesh.computeBonesUsingShaders) {
                    defines["NUM_BONE_INFLUENCERS"] = mesh.numBoneInfluencers;
                    defines["BonesPerMesh"] = (mesh.skeleton.bones.length + 1);
                } else {
                    defines["NUM_BONE_INFLUENCERS"] = 0;
                    defines["BonesPerMesh"] = 0;
                }           
            }
        }

        public static PrepareDefinesForLights(scene: Scene, mesh: AbstractMesh, defines: MaterialDefines, specularSupported: boolean, maxSimultaneousLights = 4, disableLighting = false): boolean {
            if (!defines._areLightsDirty) {
                return defines._needNormals;
            }

            var lightIndex = 0;
            var needNormals = false;
            var needRebuild = false;
            var lightmapMode = false;
            var shadowEnabled = false;
            var specularEnabled = false;

            if (scene.lightsEnabled && !disableLighting) {
                for (var light of mesh._lightSources) {
                    needNormals = true;

                    if (defines["LIGHT" + lightIndex] === undefined) {
                        needRebuild = true;
                    }

                    defines["LIGHT" + lightIndex] = true;
                    
                    defines["SPOTLIGHT" + lightIndex] = false;
                    defines["HEMILIGHT" + lightIndex] = false;
                    defines["POINTLIGHT" + lightIndex] = false;
                    defines["DIRLIGHT" + lightIndex] = false;

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

                    defines[type] = true;

                    // Specular
                    if (specularSupported && !light.specular.equalsFloats(0, 0, 0)) {
                        specularEnabled = true;
                    }

                    // Shadows
                    defines["SHADOW" + lightIndex] = false;
                    if (scene.shadowsEnabled) {
                        var shadowGenerator = <ShadowGenerator>light.getShadowGenerator();
                        if (mesh && mesh.receiveShadows && shadowGenerator) {
                            defines["SHADOW" + lightIndex] = true;

                            shadowEnabled = true;

                            defines["SHADOWPCF" + lightIndex] = false;
                            defines["SHADOWESM" + lightIndex] = false;

                            if (shadowGenerator.usePoissonSampling) {
                                defines["SHADOWPCF" + lightIndex] = true;
                            } 
                            else if (shadowGenerator.useExponentialShadowMap || shadowGenerator.useBlurExponentialShadowMap) {
                                defines["SHADOWESM" + lightIndex] = true;
                            }
                        }
                    }

                    if (light.lightmapMode != Light.LIGHTMAP_DEFAULT ) {
                        lightmapMode = true;
                        defines["LIGHTMAPEXCLUDED" + lightIndex] = true;
                        defines["LIGHTMAPNOSPECULAR" + lightIndex] = (light.lightmapMode == Light.LIGHTMAP_SHADOWSONLY);
                    } else {
                        defines["LIGHTMAPEXCLUDED" + lightIndex] = false;
                        defines["LIGHTMAPNOSPECULAR" + lightIndex] = false;
                    }

                    lightIndex++;
                    if (lightIndex === maxSimultaneousLights)
                        break;
                }
            }

            defines["SPECULARTERM"] = specularEnabled;
            defines["SHADOWS"] = shadowEnabled;

            // Resetting all other lights if any
            for (var index = lightIndex; index < maxSimultaneousLights; index++) {
                if (defines["LIGHT" + index] !== undefined) {
                    defines["LIGHT" + index] = false;
                }
            }

            let caps = scene.getEngine().getCaps();

            if (defines["SHADOWFULLFLOAT"] === undefined) {
                needRebuild = true;
            }

            defines["SHADOWFULLFLOAT"] = (shadowEnabled && caps.textureFloat && caps.textureFloatLinearFiltering && caps.textureFloatRender);
            defines["LIGHTMAPEXCLUDED"] = lightmapMode;

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
            if (!defines["SHADOWS"]) {
                return;
            }

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

                if (defines["SHADOWESM" + lightIndex]) {
                    fallbacks.addFallback(0, "SHADOWESM" + lightIndex);
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
                effect.setFloat3("shadowsInfo" + lightIndex, shadowGenerator.getDarkness(), shadowGenerator.blurScale / shadowGenerator.getShadowMap().getSize().width, shadowGenerator.depthScale);
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

            for (var light of mesh._lightSources) {

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