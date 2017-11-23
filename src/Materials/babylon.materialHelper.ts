module BABYLON {
    export class MaterialHelper {

        public static BindEyePosition(effect: Effect, scene: Scene): void {
            if (scene._forcedViewPosition) {
                effect.setVector3("vEyePosition", scene._forcedViewPosition);            
                return;
            }
            effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera!.globalPosition);            
        }

        public static PrepareDefinesForMergedUV(texture: BaseTexture, defines: any, key: string): void {
            defines._needUVs = true;
            defines[key] = true;
            if (texture.getTextureMatrix().isIdentity(true)) {
                defines[key + "DIRECTUV"] = texture.coordinatesIndex + 1;
                if (texture.coordinatesIndex === 0) {
                    defines["MAINUV1"] = true;
                } else {
                    defines["MAINUV2"] = true;
                }
            } else {
                defines[key + "DIRECTUV"] = 0;
            }
        }

        public static BindTextureMatrix(texture: BaseTexture, uniformBuffer: UniformBuffer, key: string): void {
            var matrix = texture.getTextureMatrix();

            if (!matrix.isIdentity(true)) {
                uniformBuffer.updateMatrix(key + "Matrix", matrix);
            }
        }

        public static PrepareDefinesForMisc(mesh: AbstractMesh, scene: Scene, useLogarithmicDepth: boolean, pointsCloud: boolean, fogEnabled: boolean, defines: any): void {
            if (defines._areMiscDirty) {
                defines["LOGARITHMICDEPTH"] = useLogarithmicDepth;
                defines["POINTSIZE"] = (pointsCloud || scene.forcePointsCloud);
                defines["FOG"] = (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE && fogEnabled);
                defines["NONUNIFORMSCALING"] = mesh.nonUniformScaling;
            }
        }

        public static PrepareDefinesForFrameBoundValues(scene: Scene, engine: Engine, defines: any, useInstances: boolean, forceAlphaTest = false): void {
            var changed = false;

            if (defines["CLIPPLANE"] !== (scene.clipPlane !== undefined && scene.clipPlane !== null)) {
                defines["CLIPPLANE"] = !defines["CLIPPLANE"];
                changed = true;
            }

            if (defines["ALPHATEST"] !== (engine.getAlphaTesting() || forceAlphaTest)) {
                defines["ALPHATEST"] = !defines["ALPHATEST"];
                changed = true;
            }

            if (defines["DEPTHPREPASS"] !== !engine.getColorWrite()) {
                defines["DEPTHPREPASS"] = !defines["DEPTHPREPASS"];
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

        public static PrepareDefinesForAttributes(mesh: AbstractMesh, defines: any, useVertexColor: boolean, useBones: boolean, useMorphTargets = false, useVertexAlpha = true): boolean {
            if (!defines._areAttributesDirty && defines._needNormals === defines._normals && defines._needUVs === defines._uvs) {
                return false;
            }

            defines._normals = defines._needNormals;
            defines._uvs = defines._needUVs;
            
            defines["NORMAL"] = (defines._needNormals && mesh.isVerticesDataPresent(VertexBuffer.NormalKind));

            if (defines._needNormals && mesh.isVerticesDataPresent(VertexBuffer.TangentKind)) {
                defines["TANGENT"] = true;
            }

            if (defines._needUVs) {
                defines["UV1"] = mesh.isVerticesDataPresent(VertexBuffer.UVKind);
                defines["UV2"] = mesh.isVerticesDataPresent(VertexBuffer.UV2Kind);
            } else {
                defines["UV1"] = false;
                defines["UV2"] = false;
            }

            if (useVertexColor) {
                var hasVertexColors = mesh.useVertexColors && mesh.isVerticesDataPresent(VertexBuffer.ColorKind);
                defines["VERTEXCOLOR"] = hasVertexColors;
                defines["VERTEXALPHA"] = mesh.hasVertexAlpha && hasVertexColors && useVertexAlpha;
            }

            if (useBones) {
                if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                    defines["NUM_BONE_INFLUENCERS"] = mesh.numBoneInfluencers;
                    defines["BonesPerMesh"] = (mesh.skeleton.bones.length + 1);
                } else {
                    defines["NUM_BONE_INFLUENCERS"] = 0;
                    defines["BonesPerMesh"] = 0;
                }
            }

            if (useMorphTargets) {
                var manager = (<Mesh>mesh).morphTargetManager;
                if (manager) {
                    defines["MORPHTARGETS_TANGENT"] = manager.supportsTangents && defines["TANGENT"];
                    defines["MORPHTARGETS_NORMAL"] = manager.supportsNormals && defines["NORMAL"] ;
                    defines["MORPHTARGETS"] = (manager.numInfluencers > 0);
                    defines["NUM_MORPH_INFLUENCERS"] = manager.numInfluencers;
                } else {
                    defines["MORPHTARGETS_TANGENT"] = false;
                    defines["MORPHTARGETS_NORMAL"] = false;
                    defines["MORPHTARGETS"] = false;
                    defines["NUM_MORPH_INFLUENCERS"] = 0;
                }
            }

            return true;
        }

        public static PrepareDefinesForLights(scene: Scene, mesh: AbstractMesh, defines: any, specularSupported: boolean, maxSimultaneousLights = 4, disableLighting = false): boolean {
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
                    if (light.getTypeID() === Light.LIGHTTYPEID_SPOTLIGHT) {
                        type = "SPOTLIGHT" + lightIndex;
                    } else if (light.getTypeID() === Light.LIGHTTYPEID_HEMISPHERICLIGHT) {
                        type = "HEMILIGHT" + lightIndex;
                    } else if (light.getTypeID() === Light.LIGHTTYPEID_POINTLIGHT) {
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
                    defines["SHADOWPCF" + lightIndex] = false;
                    defines["SHADOWESM" + lightIndex] = false;
                    defines["SHADOWCUBE" + lightIndex] = false;

                    if (mesh && mesh.receiveShadows && scene.shadowsEnabled && light.shadowEnabled) {
                        var shadowGenerator = light.getShadowGenerator();
                        if (shadowGenerator) {
                            shadowEnabled = true;
                            shadowGenerator.prepareDefines(defines, lightIndex);
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
                    defines["HEMILIGHT" + lightIndex] = false;
                    defines["POINTLIGHT" + lightIndex] = false;
                    defines["DIRLIGHT" + lightIndex] = false;                    
                    defines["SPOTLIGHT" + lightIndex] = false;
                    defines["SHADOW" + lightIndex] = false;
                }
            }

            let caps = scene.getEngine().getCaps();

            if (defines["SHADOWFLOAT"] === undefined) {
                needRebuild = true;
            }

            defines["SHADOWFLOAT"] = shadowEnabled && 
                                    ((caps.textureFloatRender && caps.textureFloatLinearFiltering) ||
                                         (caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering));
            defines["LIGHTMAPEXCLUDED"] = lightmapMode;

            if (needRebuild) {
                defines.rebuild();
            }

            return needNormals;
        }

        public static PrepareUniformsAndSamplersList(uniformsListOrOptions: string[] | EffectCreationOptions, samplersList?: string[], defines?: any, maxSimultaneousLights = 4): void {
            let uniformsList: string[];
            let uniformBuffersList: Nullable<string[]> = null;

            if ((<EffectCreationOptions>uniformsListOrOptions).uniformsNames) {
                var options = <EffectCreationOptions>uniformsListOrOptions;
                uniformsList = options.uniformsNames;
                uniformBuffersList = options.uniformBuffersNames;
                samplersList = options.samplers;
                defines = options.defines;
                maxSimultaneousLights = options.maxSimultaneousLights;
            } else {
                uniformsList = <string[]>uniformsListOrOptions;
                if (!samplersList) {
                    samplersList = [];
                }
            }

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
                    "shadowsInfo" + lightIndex,
                    "depthValues" + lightIndex,
                );

                if (uniformBuffersList) {
                    uniformBuffersList.push("Light" + lightIndex);
                }

                samplersList.push("shadowSampler" + lightIndex);
            }

            if (defines["NUM_MORPH_INFLUENCERS"]) {
                uniformsList.push("morphTargetInfluences");
            }
        }

        public static HandleFallbacksForShadows(defines: any, fallbacks: EffectFallbacks, maxSimultaneousLights = 4, rank = 0): number {
            let lightFallbackRank = 0;
            for (var lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
                if (!defines["LIGHT" + lightIndex]) {
                    break;
                }

                if (lightIndex > 0) {
                    lightFallbackRank = rank + lightIndex;
                    fallbacks.addFallback(lightFallbackRank, "LIGHT" + lightIndex);
                }

                if (!defines["SHADOWS"]) {
                    if (defines["SHADOW" + lightIndex]) {
                        fallbacks.addFallback(rank, "SHADOW" + lightIndex);
                    }

                    if (defines["SHADOWPCF" + lightIndex]) {
                        fallbacks.addFallback(rank, "SHADOWPCF" + lightIndex);
                    }

                    if (defines["SHADOWESM" + lightIndex]) {
                        fallbacks.addFallback(rank, "SHADOWESM" + lightIndex);
                    }
                }
            }
            return lightFallbackRank++;
        }

        public static PrepareAttributesForMorphTargets(attribs: string[], mesh: AbstractMesh, defines: any): void {
            var influencers = defines["NUM_MORPH_INFLUENCERS"];

            if (influencers > 0 && Engine.LastCreatedEngine) {
                var maxAttributesCount = Engine.LastCreatedEngine.getCaps().maxVertexAttribs;
                var manager = (<Mesh>mesh).morphTargetManager;
                var normal = manager && manager.supportsNormals && defines["NORMAL"];
                var tangent = manager && manager.supportsTangents && defines["TANGENT"];
                for (var index = 0; index < influencers; index++) {
                    attribs.push(VertexBuffer.PositionKind + index);

                    if (normal) {
                        attribs.push(VertexBuffer.NormalKind + index);
                    }

                    if (tangent) {
                        attribs.push(VertexBuffer.TangentKind + index);
                    }

                    if (attribs.length > maxAttributesCount) {
                        Tools.Error("Cannot add more vertex attributes for mesh " + mesh.name);
                    }
                }
            }
        }

        public static PrepareAttributesForBones(attribs: string[], mesh: AbstractMesh, defines: any, fallbacks: EffectFallbacks): void {
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

        public static PrepareAttributesForInstances(attribs: string[], defines: any): void {
            if (defines["INSTANCES"]) {
                attribs.push("world0");
                attribs.push("world1");
                attribs.push("world2");
                attribs.push("world3");
            }
        }

        // Bindings
        public static BindLightShadow(light: Light, scene: Scene, mesh: AbstractMesh, lightIndex: string, effect: Effect): void {
            if (light.shadowEnabled && mesh.receiveShadows) {
                var shadowGenerator = light.getShadowGenerator();
                if (shadowGenerator) {
                    shadowGenerator.bindShadowLight(lightIndex, effect);
                }
            }
        }

        public static BindLightProperties(light: Light, effect: Effect, lightIndex: number): void {
            light.transferToEffect(effect, lightIndex + "");
        }

        public static BindLights(scene: Scene, mesh: AbstractMesh, effect: Effect, defines: any, maxSimultaneousLights = 4, usePhysicalLightFalloff = false) {
            var lightIndex = 0;
            for (var light of mesh._lightSources) {
                let scaledIntensity = light.getScaledIntensity();
                light._uniformBuffer.bindToEffect(effect, "Light" + lightIndex);

                MaterialHelper.BindLightProperties(light, effect, lightIndex);

                light.diffuse.scaleToRef(scaledIntensity, Tmp.Color3[0]);
                light._uniformBuffer.updateColor4("vLightDiffuse", Tmp.Color3[0], usePhysicalLightFalloff ? light.radius : light.range, lightIndex + "");
                if (defines["SPECULARTERM"]) {
                    light.specular.scaleToRef(scaledIntensity, Tmp.Color3[1]);
                    light._uniformBuffer.updateColor3("vLightSpecular", Tmp.Color3[1], lightIndex + "");
                }

                // Shadows
                if (scene.shadowsEnabled) {
                    this.BindLightShadow(light, scene, mesh, lightIndex + "", effect);
                }
                light._uniformBuffer.update();
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

        public static BindBonesParameters(mesh?: AbstractMesh, effect?: Effect): void {
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                var matrices = mesh.skeleton.getTransformMatrices(mesh);

                if (matrices && effect) {
                    effect.setMatrices("mBones", matrices);
                }
            }
        }

        public static BindMorphTargetParameters(abstractMesh: AbstractMesh, effect: Effect): void {
            let manager = (<Mesh>abstractMesh).morphTargetManager;
            if (!abstractMesh || !manager) {
                return;
            }

            effect.setFloatArray("morphTargetInfluences", manager.influences);
        }

        public static BindLogDepth(defines: any, effect: Effect, scene: Scene): void {
            if (defines["LOGARITHMICDEPTH"]) {
                effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log((<Camera>scene.activeCamera).maxZ + 1.0) / Math.LN2));
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