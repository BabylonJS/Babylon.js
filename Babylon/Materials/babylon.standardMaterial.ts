﻿module BABYLON {
    var maxSimultaneousLights = 4;

    export class FresnelParameters {
        public isEnabled = true;
        public leftColor = Color3.White();
        public rightColor = Color3.Black();
        public bias = 0;
        public power = 1;
    }

    export class StandardMaterial extends Material {
        public diffuseTexture: BaseTexture;
        public ambientTexture: BaseTexture;
        public opacityTexture: BaseTexture;
        public reflectionTexture: BaseTexture;
        public emissiveTexture: BaseTexture;
        public specularTexture: BaseTexture;
        public bumpTexture: BaseTexture;

        public ambientColor = new Color3(0, 0, 0);
        public diffuseColor = new Color3(1, 1, 1);
        public specularColor = new Color3(1, 1, 1);
        public specularPower = 64;
        public emissiveColor = new Color3(0, 0, 0);
        public useAlphaFromDiffuseTexture = false;
        public useSpecularOverAlpha = true;
		public fogEnabled = true;

        public diffuseFresnelParameters: FresnelParameters;
        public opacityFresnelParameters: FresnelParameters;
        public reflectionFresnelParameters: FresnelParameters;
        public emissiveFresnelParameters: FresnelParameters;

        private _cachedDefines = null;
        private _renderTargets = new SmartArray<RenderTargetTexture>(16);
        private _worldViewProjectionMatrix = Matrix.Zero();
        private _globalAmbientColor = new Color3(0, 0, 0);
        private _scaledDiffuse = new Color3();
        private _scaledSpecular = new Color3();
        private _renderId: number;

        constructor(name: string, scene: Scene) {
            super(name, scene);

            this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
                this._renderTargets.reset();

                if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
                    this._renderTargets.push(this.reflectionTexture);
                }

                return this._renderTargets;
            }
        }

        public needAlphaBlending(): boolean {
            return (this.alpha < 1.0) || (this.opacityTexture != null) || this._shouldUseAlphaFromDiffuseTexture() || this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled;
        }

        public needAlphaTesting(): boolean {
            return this.diffuseTexture != null && this.diffuseTexture.hasAlpha && !this.diffuseTexture.getAlphaFromRGB;
        }

        private _shouldUseAlphaFromDiffuseTexture(): boolean {
            return this.diffuseTexture != null && this.diffuseTexture.hasAlpha && this.useAlphaFromDiffuseTexture;
        }

        public getAlphaTestTexture(): BaseTexture {
            return this.diffuseTexture;
        }

        // Methods   
        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
            if (this.checkReadyOnlyOnce) {
                if (this._wasPreviouslyReady) {
                 //   return true;
                }
            }

            var scene = this.getScene();

            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                  //  return true;
                }
            }

            var engine = scene.getEngine();
            var defines = [];
            var fallbacks = new EffectFallbacks();
            var needNormals = false;
            var needUVs = false;

            // Textures
            if (scene.texturesEnabled) {
                if (this.diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.diffuseTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        defines.push("#define DIFFUSE");
                    }
                }

                if (this.ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                    if (!this.ambientTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        defines.push("#define AMBIENT");
                    }
                }

                if (this.opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                    if (!this.opacityTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        defines.push("#define OPACITY");

                        if (this.opacityTexture.getAlphaFromRGB) {
                            defines.push("#define OPACITYRGB");
                        }
                    }
                }

                if (this.reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                    if (!this.reflectionTexture.isReady()) {
                        return false;
                    } else {
                        needNormals = true;
                        needUVs = true;
                        defines.push("#define REFLECTION");
                        fallbacks.addFallback(0, "REFLECTION");
                    }
                }

                if (this.emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                    if (!this.emissiveTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        defines.push("#define EMISSIVE");
                    }
                }

                if (this.specularTexture && StandardMaterial.SpecularTextureEnabled) {
                    if (!this.specularTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        defines.push("#define SPECULAR");
                        fallbacks.addFallback(0, "SPECULAR");
                    }
                }
            }

            if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && StandardMaterial.BumpTextureEnabled) {
                if (!this.bumpTexture.isReady()) {
                    return false;
                } else {
                    needUVs = true;
                    defines.push("#define BUMP");
                    fallbacks.addFallback(0, "BUMP");
                }
            }

            // Effect
            if (this.useSpecularOverAlpha) {
                defines.push("#define SPECULAROVERALPHA");
                fallbacks.addFallback(0, "SPECULAROVERALPHA");
            }

            if (scene.clipPlane) {
                defines.push("#define CLIPPLANE");
            }

            if (engine.getAlphaTesting()) {
                defines.push("#define ALPHATEST");
            }

            if (this._shouldUseAlphaFromDiffuseTexture()) {
                defines.push("#define ALPHAFROMDIFFUSE");
            }

            // Point size
            if (this.pointsCloud || scene.forcePointsCloud) {
                defines.push("#define POINTSIZE");
            }

            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled) {
                defines.push("#define FOG");
                fallbacks.addFallback(1, "FOG");
            }

            var shadowsActivated = false;
            var lightIndex = 0;
            if (scene.lightsEnabled) {
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
                    defines.push("#define LIGHT" + lightIndex);

                    if (lightIndex > 0) {
                        fallbacks.addFallback(lightIndex, "LIGHT" + lightIndex);
                    }

                    var type;
                    if (light instanceof SpotLight) {
                        type = "#define SPOTLIGHT" + lightIndex;
                    } else if (light instanceof HemisphericLight) {
                        type = "#define HEMILIGHT" + lightIndex;
                    } else {
                        type = "#define POINTDIRLIGHT" + lightIndex;
                    }

                    defines.push(type);
                    if (lightIndex > 0) {
                        fallbacks.addFallback(lightIndex, type.replace("#define ", ""));
                    }

                    // Shadows
                    if (scene.shadowsEnabled) {
                        var shadowGenerator = light.getShadowGenerator();
                        if (mesh && mesh.receiveShadows && shadowGenerator) {
                            defines.push("#define SHADOW" + lightIndex);
                            fallbacks.addFallback(0, "SHADOW" + lightIndex);

                            if (!shadowsActivated) {
                                defines.push("#define SHADOWS");
                                shadowsActivated = true;
                            }

                            if (shadowGenerator.useVarianceShadowMap || shadowGenerator.useBlurVarianceShadowMap) {
                                defines.push("#define SHADOWVSM" + lightIndex);
                                if (lightIndex > 0) {
                                    fallbacks.addFallback(0, "SHADOWVSM" + lightIndex);
                                }
                            }

                            if (shadowGenerator.usePoissonSampling) {
                                defines.push("#define SHADOWPCF" + lightIndex);
                                if (lightIndex > 0) {
                                    fallbacks.addFallback(0, "SHADOWPCF" + lightIndex);
                                }
                            }
                        }
                    }

                    lightIndex++;
                    if (lightIndex === maxSimultaneousLights)
                        break;
                }
            }

            if (StandardMaterial.FresnelEnabled) {
                // Fresnel
                if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled ||
                    this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled ||
                    this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled ||
                    this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {

                    var fresnelRank = 1;

                    if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled) {
                        defines.push("#define DIFFUSEFRESNEL");
                        fallbacks.addFallback(fresnelRank, "DIFFUSEFRESNEL");
                        fresnelRank++;
                    }

                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        defines.push("#define OPACITYFRESNEL");
                        fallbacks.addFallback(fresnelRank, "OPACITYFRESNEL");
                        fresnelRank++;
                    }

                    if (this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
                        defines.push("#define REFLECTIONFRESNEL");
                        fallbacks.addFallback(fresnelRank, "REFLECTIONFRESNEL");
                        fresnelRank++;
                    }

                    if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                        defines.push("#define EMISSIVEFRESNEL");
                        fallbacks.addFallback(fresnelRank, "EMISSIVEFRESNEL");
                        fresnelRank++;
                    }

                    needNormals = true;
                    defines.push("#define FRESNEL");
                    fallbacks.addFallback(fresnelRank - 1, "FRESNEL");
                }
            }


            // Attribs
            var attribs = [VertexBuffer.PositionKind];
            if (mesh) {
                if (needNormals && mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                    attribs.push(VertexBuffer.NormalKind);
                    defines.push("#define NORMAL");
                }
                if (needUVs) {
                    if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                        attribs.push(VertexBuffer.UVKind);
                        defines.push("#define UV1");
                    }
                    if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                        attribs.push(VertexBuffer.UV2Kind);
                        defines.push("#define UV2");
                    }
                }
                if (mesh.useVertexColors && mesh.isVerticesDataPresent(VertexBuffer.ColorKind)) {
                    attribs.push(VertexBuffer.ColorKind);
                    defines.push("#define VERTEXCOLOR");

                    if (mesh.hasVertexAlpha) {
                        defines.push("#define VERTEXALPHA");
                    }
                }
                if (mesh.useBones) {
                    attribs.push(VertexBuffer.MatricesIndicesKind);
                    attribs.push(VertexBuffer.MatricesWeightsKind);
                    defines.push("#define BONES");
                    defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
                    defines.push("#define BONES4");
                    fallbacks.addFallback(0, "BONES4");
                }

                // Instances
                if (useInstances) {
                    defines.push("#define INSTANCES");
                    attribs.push("world0");
                    attribs.push("world1");
                    attribs.push("world2");
                    attribs.push("world3");
                }
            }

            // Get correct effect      
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;

                scene.resetCachedMaterial();

                // Legacy browser patch
                var shaderName = "default";
                if (!scene.getEngine().getCaps().standardDerivatives) {
                    shaderName = "legacydefault";
                }

                this._effect = scene.getEngine().createEffect(shaderName,
                    attribs,
                    ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
                        "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                        "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                        "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                        "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                        "vFogInfos", "vFogColor", "pointSize",
                        "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos",
                        "mBones",
                        "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix",
                        "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3",
                        "diffuseLeftColor", "diffuseRightColor", "opacityParts", "reflectionLeftColor", "reflectionRightColor", "emissiveLeftColor", "emissiveRightColor"
                    ],
                    ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler",
                        "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3"
                    ],
                    join, fallbacks, this.onCompiled, this.onError);
            }
            if (!this._effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        }


        public unbind(): void {
            if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
                this._effect.setTexture("reflection2DSampler", null);
            }
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
            this._effect.setMatrix("world", world);
        }

        public bind(world: Matrix, mesh?: Mesh): void {
            var scene = this.getScene();

            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());

            // Bones
            if (mesh && mesh.useBones) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
            }

            if (scene.getCachedMaterial() !== this) {

                if (StandardMaterial.FresnelEnabled) {
                    // Fresnel
                    if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled) {
                        this._effect.setColor4("diffuseLeftColor", this.diffuseFresnelParameters.leftColor, this.diffuseFresnelParameters.power);
                        this._effect.setColor4("diffuseRightColor", this.diffuseFresnelParameters.rightColor, this.diffuseFresnelParameters.bias);
                    }

                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        this._effect.setColor4("opacityParts", new Color3(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power);
                    }

                    if (this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
                        this._effect.setColor4("reflectionLeftColor", this.reflectionFresnelParameters.leftColor, this.reflectionFresnelParameters.power);
                        this._effect.setColor4("reflectionRightColor", this.reflectionFresnelParameters.rightColor, this.reflectionFresnelParameters.bias);
                    }

                    if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                        this._effect.setColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                        this._effect.setColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                    }
                }

                // Textures        
                if (this.diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    this._effect.setTexture("diffuseSampler", this.diffuseTexture);

                    this._effect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                    this._effect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
                }

                if (this.ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                    this._effect.setTexture("ambientSampler", this.ambientTexture);

                    this._effect.setFloat2("vAmbientInfos", this.ambientTexture.coordinatesIndex, this.ambientTexture.level);
                    this._effect.setMatrix("ambientMatrix", this.ambientTexture.getTextureMatrix());
                }

                if (this.opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                    this._effect.setTexture("opacitySampler", this.opacityTexture);

                    this._effect.setFloat2("vOpacityInfos", this.opacityTexture.coordinatesIndex, this.opacityTexture.level);
                    this._effect.setMatrix("opacityMatrix", this.opacityTexture.getTextureMatrix());
                }

                if (this.reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                    if (this.reflectionTexture.isCube) {
                        this._effect.setTexture("reflectionCubeSampler", this.reflectionTexture);
                    } else {
                        this._effect.setTexture("reflection2DSampler", this.reflectionTexture);
                    }

                    this._effect.setMatrix("reflectionMatrix", this.reflectionTexture.getReflectionTextureMatrix());
                    this._effect.setFloat3("vReflectionInfos", this.reflectionTexture.coordinatesMode, this.reflectionTexture.level, this.reflectionTexture.isCube ? 1 : 0);
                }

                if (this.emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                    this._effect.setTexture("emissiveSampler", this.emissiveTexture);

                    this._effect.setFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
                    this._effect.setMatrix("emissiveMatrix", this.emissiveTexture.getTextureMatrix());
                }

                if (this.specularTexture && StandardMaterial.SpecularTextureEnabled) {
                    this._effect.setTexture("specularSampler", this.specularTexture);

                    this._effect.setFloat2("vSpecularInfos", this.specularTexture.coordinatesIndex, this.specularTexture.level);
                    this._effect.setMatrix("specularMatrix", this.specularTexture.getTextureMatrix());
                }

                if (this.bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled) {
                    this._effect.setTexture("bumpSampler", this.bumpTexture);

                    this._effect.setFloat2("vBumpInfos", this.bumpTexture.coordinatesIndex, 1.0 / this.bumpTexture.level);
                    this._effect.setMatrix("bumpMatrix", this.bumpTexture.getTextureMatrix());
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

                // Colors
                scene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);

                // Scaling down color according to emissive
                this._scaledSpecular.r = this.specularColor.r * Tools.Clamp(1.0 - this.emissiveColor.r);
                this._scaledSpecular.g = this.specularColor.g * Tools.Clamp(1.0 - this.emissiveColor.g);
                this._scaledSpecular.b = this.specularColor.b * Tools.Clamp(1.0 - this.emissiveColor.b);

                this._effect.setVector3("vEyePosition", scene.activeCamera.position);
                this._effect.setColor3("vAmbientColor", this._globalAmbientColor);
                this._effect.setColor4("vSpecularColor", this._scaledSpecular, this.specularPower);
                this._effect.setColor3("vEmissiveColor", this.emissiveColor);
            }

            // Scaling down color according to emissive
            this._scaledDiffuse.r = this.diffuseColor.r * Tools.Clamp(1.0 - this.emissiveColor.r);
            this._scaledDiffuse.g = this.diffuseColor.g * Tools.Clamp(1.0 - this.emissiveColor.g);
            this._scaledDiffuse.b = this.diffuseColor.b * Tools.Clamp(1.0 - this.emissiveColor.b);

            this._effect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);

            if (scene.lightsEnabled) {
                var lightIndex = 0;
                for (var index = 0; index < scene.lights.length; index++) {
                    var light = scene.lights[index];

                    if (!light.isEnabled()) {
                        continue;
                    }

                    if (!light.canAffectMesh(mesh)) {
                        continue;
                    }

                    if (light instanceof PointLight) {
                        // Point Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex);
                    } else if (light instanceof DirectionalLight) {
                        // Directional Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex);
                    } else if (light instanceof SpotLight) {
                        // Spot Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex, "vLightDirection" + lightIndex);
                    } else if (light instanceof HemisphericLight) {
                        // Hemispheric Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex, "vLightGround" + lightIndex);
                    }

                    light.diffuse.scaleToRef(light.intensity, this._scaledDiffuse);
                    light.specular.scaleToRef(light.intensity, this._scaledSpecular);
                    this._effect.setColor4("vLightDiffuse" + lightIndex, this._scaledDiffuse, light.range);
                    this._effect.setColor3("vLightSpecular" + lightIndex, this._scaledSpecular);

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
            if (scene.fogEnabled && mesh.applyFog &&scene.fogMode !== Scene.FOGMODE_NONE || this.reflectionTexture) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }

            // Fog
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
                this._effect.setColor3("vFogColor", scene.fogColor);
            }

            super.bind(world, mesh);
        }

        public getAnimatables(): IAnimatable[] {
            var results = [];

            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }

            if (this.ambientTexture && this.ambientTexture.animations && this.ambientTexture.animations.length > 0) {
                results.push(this.ambientTexture);
            }

            if (this.opacityTexture && this.opacityTexture.animations && this.opacityTexture.animations.length > 0) {
                results.push(this.opacityTexture);
            }

            if (this.reflectionTexture && this.reflectionTexture.animations && this.reflectionTexture.animations.length > 0) {
                results.push(this.reflectionTexture);
            }

            if (this.emissiveTexture && this.emissiveTexture.animations && this.emissiveTexture.animations.length > 0) {
                results.push(this.emissiveTexture);
            }

            if (this.specularTexture && this.specularTexture.animations && this.specularTexture.animations.length > 0) {
                results.push(this.specularTexture);
            }

            if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
                results.push(this.bumpTexture);
            }

            return results;
        }

        public dispose(forceDisposeEffect?: boolean): void {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }

            if (this.ambientTexture) {
                this.ambientTexture.dispose();
            }

            if (this.opacityTexture) {
                this.opacityTexture.dispose();
            }

            if (this.reflectionTexture) {
                this.reflectionTexture.dispose();
            }

            if (this.emissiveTexture) {
                this.emissiveTexture.dispose();
            }

            if (this.specularTexture) {
                this.specularTexture.dispose();
            }

            if (this.bumpTexture) {
                this.bumpTexture.dispose();
            }

            super.dispose(forceDisposeEffect);
        }

        public clone(name: string): StandardMaterial {
            var newStandardMaterial = new StandardMaterial(name, this.getScene());

            // Base material
            newStandardMaterial.checkReadyOnEveryCall = this.checkReadyOnEveryCall;
            newStandardMaterial.alpha = this.alpha;
            newStandardMaterial.fillMode = this.fillMode;
            newStandardMaterial.backFaceCulling = this.backFaceCulling;

            // Standard material
            if (this.diffuseTexture && this.diffuseTexture.clone) {
                newStandardMaterial.diffuseTexture = this.diffuseTexture.clone();
            }
            if (this.ambientTexture && this.ambientTexture.clone) {
                newStandardMaterial.ambientTexture = this.ambientTexture.clone();
            }
            if (this.opacityTexture && this.opacityTexture.clone) {
                newStandardMaterial.opacityTexture = this.opacityTexture.clone();
            }
            if (this.reflectionTexture && this.reflectionTexture.clone) {
                newStandardMaterial.reflectionTexture = this.reflectionTexture.clone();
            }
            if (this.emissiveTexture && this.emissiveTexture.clone) {
                newStandardMaterial.emissiveTexture = this.emissiveTexture.clone();
            }
            if (this.specularTexture && this.specularTexture.clone) {
                newStandardMaterial.specularTexture = this.specularTexture.clone();
            }
            if (this.bumpTexture && this.bumpTexture.clone) {
                newStandardMaterial.bumpTexture = this.bumpTexture.clone();
            }

            newStandardMaterial.ambientColor = this.ambientColor.clone();
            newStandardMaterial.diffuseColor = this.diffuseColor.clone();
            newStandardMaterial.specularColor = this.specularColor.clone();
            newStandardMaterial.specularPower = this.specularPower;
            newStandardMaterial.emissiveColor = this.emissiveColor.clone();

            return newStandardMaterial;
        }

        // Statics
        // Flags used to enable or disable a type of texture for all Standard Materials
        public static DiffuseTextureEnabled = true;
        public static AmbientTextureEnabled = true;
        public static OpacityTextureEnabled = true;
        public static ReflectionTextureEnabled = true;
        public static EmissiveTextureEnabled = true;
        public static SpecularTextureEnabled = true;
        public static BumpTextureEnabled = true;
        public static FresnelEnabled = true;
    }
} 