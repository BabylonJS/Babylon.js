/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    var maxSimultaneousLights = 4;

    class PBRMaterialDefines extends MaterialDefines {
        public ALBEDO = false;
        public AMBIENT = false;
        public OPACITY = false;
        public OPACITYRGB = false;
        public REFLECTION = false;
        public EMISSIVE = false;
        public REFLECTIVITY = false;
        public BUMP = false;
        public SPECULAROVERALPHA = false;
        public CLIPPLANE = false;
        public ALPHATEST = false;
        public ALPHAFROMALBEDO = false;
        public POINTSIZE = false;
        public FOG = false;
        public LIGHT0 = false;
        public LIGHT1 = false;
        public LIGHT2 = false;
        public LIGHT3 = false;
        public SPOTLIGHT0 = false;
        public SPOTLIGHT1 = false;
        public SPOTLIGHT2 = false;
        public SPOTLIGHT3 = false;
        public HEMILIGHT0 = false;
        public HEMILIGHT1 = false;
        public HEMILIGHT2 = false;
        public HEMILIGHT3 = false;
        public POINTLIGHT0 = false;
        public POINTLIGHT1 = false;
        public POINTLIGHT2 = false;
        public POINTLIGHT3 = false;
        public DIRLIGHT0 = false;
        public DIRLIGHT1 = false;
        public DIRLIGHT2 = false;
        public DIRLIGHT3 = false;
        public SPECULARTERM = false;
        public SHADOW0 = false;
        public SHADOW1 = false;
        public SHADOW2 = false;
        public SHADOW3 = false;
        public SHADOWS = false;
        public SHADOWVSM0 = false;
        public SHADOWVSM1 = false;
        public SHADOWVSM2 = false;
        public SHADOWVSM3 = false;
        public SHADOWPCF0 = false;
        public SHADOWPCF1 = false;
        public SHADOWPCF2 = false;
        public SHADOWPCF3 = false;
        public OPACITYFRESNEL = false;
        public EMISSIVEFRESNEL = false;
        public FRESNEL = false;
        public NORMAL = false;
        public UV1 = false;
        public UV2 = false;
        public VERTEXCOLOR = false;
        public VERTEXALPHA = false;
        public NUM_BONE_INFLUENCERS = 0;
        public BonesPerMesh = 0;
        public INSTANCES = false;
        public MICROSURFACEFROMREFLECTIVITYMAP = false;
        public EMISSIVEASILLUMINATION = false;
        public LINKEMISSIVEWITHALBEDO = false;
        public LIGHTMAP = false;
        public USELIGHTMAPASSHADOWMAP = false;
        public REFLECTIONMAP_3D = false;
        public REFLECTIONMAP_SPHERICAL = false;
        public REFLECTIONMAP_PLANAR = false;
        public REFLECTIONMAP_CUBIC = false;
        public REFLECTIONMAP_PROJECTION = false;
        public REFLECTIONMAP_SKYBOX = false;
        public REFLECTIONMAP_EXPLICIT = false;
        public REFLECTIONMAP_EQUIRECTANGULAR = false;
        public INVERTCUBICMAP = false;
        public LOGARITHMICDEPTH = false;
        public CAMERATONEMAP = false;
        public CAMERACONTRAST = false;
        public OVERLOADEDVALUES = false;
        public OVERLOADEDSHADOWVALUES = false;

        constructor() {
            super();
            this._keys = Object.keys(this);
        }
    }

    export class PBRMaterial extends BABYLON.Material {

        public directIntensity: number = 1.0;
        public emissiveIntensity: number = 1.0;
        public environmentIntensity: number = 1.0;
        public specularIntensity: number = 1.0;

        private _lightingInfos: Vector4 = new Vector4(this.directIntensity, this.emissiveIntensity, this.environmentIntensity, this.specularIntensity);

        public overloadedShadowIntensity: number = 1.0;
        public overloadedShadeIntensity: number = 1.0;
        private _overloadedShadowInfos: Vector4 = new Vector4(this.overloadedShadowIntensity, this.overloadedShadeIntensity, 0.0, 0.0);

        public cameraExposure: number = 1.0;
        public cameraContrast: number = 1.0;
        private _cameraInfos: Vector4 = new Vector4(1.0, 1.0, 0.0, 0.0);

        public overloadedAmbientIntensity: number = 0.0;
        public overloadedAlbedoIntensity: number = 0.0;
        public overloadedReflectivityIntensity: number = 0.0;
        public overloadedEmissiveIntensity: number = 0.0;
        private _overloadedIntensity: Vector4 = new Vector4(this.overloadedAmbientIntensity, this.overloadedAlbedoIntensity, this.overloadedReflectivityIntensity, this.overloadedEmissiveIntensity);

        public overloadedAmbient: Color3 = BABYLON.Color3.White();
        public overloadedAlbedo: Color3 = BABYLON.Color3.White();
        public overloadedReflectivity: Color3 = BABYLON.Color3.White();
        public overloadedEmissive: Color3 = BABYLON.Color3.White();
        public overloadedReflection: Color3 = BABYLON.Color3.White();

        public overloadedMicroSurface: number = 0.0;
        public overloadedMicroSurfaceIntensity: number = 0.0;
        public overloadedReflectionIntensity: number = 0.0;
        private _overloadedMicroSurface: Vector3 = new Vector3(this.overloadedMicroSurface, this.overloadedMicroSurfaceIntensity, this.overloadedReflectionIntensity);
       
        public disableBumpMap: boolean = false;

        public albedoTexture: BaseTexture;
        public ambientTexture: BaseTexture;
        public opacityTexture: BaseTexture;
        public reflectionTexture: BaseTexture;
        public emissiveTexture: BaseTexture;
        public reflectivityTexture: BaseTexture;
        public bumpTexture: BaseTexture;
        public lightmapTexture: BaseTexture;

        public ambientColor = new Color3(0, 0, 0);
        public albedoColor = new Color3(1, 1, 1);
        public reflectivityColor = new Color3(1, 1, 1);
        public reflectionColor = new Color3(0.5, 0.5, 0.5);
        public microSurface = 0.5;
        public emissiveColor = new Color3(0, 0, 0);
        public useAlphaFromAlbedoTexture = false;
        public useEmissiveAsIllumination = false;
        public linkEmissiveWithAlbedo = false;
        public useSpecularOverAlpha = true;
        public disableLighting = false;

        public useLightmapAsShadowmap = false;
        
        public opacityFresnelParameters: FresnelParameters;
        public emissiveFresnelParameters: FresnelParameters;

        public useMicroSurfaceFromReflectivityMapAlpha = false;

        private _renderTargets = new SmartArray<RenderTargetTexture>(16);
        private _worldViewProjectionMatrix = Matrix.Zero();
        private _globalAmbientColor = new Color3(0, 0, 0);
        private _tempColor = new Color3();

        private _renderId: number;

        private _defines = new PBRMaterialDefines();
        private _cachedDefines = new PBRMaterialDefines();

        private _useLogarithmicDepth: boolean;

        constructor(name: string, scene: Scene) {
            super(name, scene);

            this._cachedDefines.BonesPerMesh = -1;

            this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
                this._renderTargets.reset();

                if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
                    this._renderTargets.push(this.reflectionTexture);
                }

                return this._renderTargets;
            }
        }

        public get useLogarithmicDepth(): boolean {
            return this._useLogarithmicDepth;
        }

        public set useLogarithmicDepth(value: boolean) {
            this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
        }

        public needAlphaBlending(): boolean {
            return (this.alpha < 1.0) || (this.opacityTexture != null) || this._shouldUseAlphaFromAlbedoTexture() || this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled;
        }

        public needAlphaTesting(): boolean {
            return this.albedoTexture != null && this.albedoTexture.hasAlpha;
        }

        private _shouldUseAlphaFromAlbedoTexture(): boolean {
            return this.albedoTexture != null && this.albedoTexture.hasAlpha && this.useAlphaFromAlbedoTexture;
        }

        public getAlphaTestTexture(): BaseTexture {
            return this.albedoTexture;
        }

        private _checkCache(scene: Scene, mesh?: AbstractMesh, useInstances?: boolean): boolean {
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
        }

        public static PrepareDefinesForLights(scene: Scene, mesh: AbstractMesh, defines: MaterialDefines): boolean {
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
                if (!light.specular.equalsFloats(0, 0, 0)) {
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
        }

        private static _scaledAlbedo = new Color3();
        private static _scaledReflectivity = new Color3();
        private static _scaledEmissive = new Color3();
        private static _scaledReflection = new Color3();

        public static BindLights(scene: Scene, mesh: AbstractMesh, effect: Effect, defines: MaterialDefines) {
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

                // GAMMA CORRECTION.
                light.diffuse.toLinearSpaceToRef(PBRMaterial._scaledAlbedo);
                PBRMaterial._scaledAlbedo.scaleToRef(light.intensity, PBRMaterial._scaledAlbedo);

                light.diffuse.scaleToRef(light.intensity, PBRMaterial._scaledAlbedo);
                effect.setColor4("vLightDiffuse" + lightIndex, PBRMaterial._scaledAlbedo, light.range);
                if (defines["SPECULARTERM"]) {
                    light.specular.toLinearSpaceToRef(PBRMaterial._scaledReflectivity);
                    PBRMaterial._scaledReflectivity.scaleToRef(light.intensity, PBRMaterial._scaledReflectivity);
                    effect.setColor3("vLightSpecular" + lightIndex, PBRMaterial._scaledReflectivity);
                }

                // Shadows
                if (scene.shadowsEnabled) {
                    var shadowGenerator = light.getShadowGenerator();
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
                        effect.setFloat3("shadowsInfo" + lightIndex, shadowGenerator.getDarkness(), shadowGenerator.getShadowMap().getSize().width, shadowGenerator.bias);
                    }
                }

                lightIndex++;

                if (lightIndex === maxSimultaneousLights)
                    break;
            }
        }

        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {

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
                if (this.albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.albedoTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.ALBEDO = true;
                    }
                }

                if (this.ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                    if (!this.ambientTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.AMBIENT = true;
                    }
                }

                if (this.opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                    if (!this.opacityTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.OPACITY = true;

                        if (this.opacityTexture.getAlphaFromRGB) {
                            this._defines.OPACITYRGB = true;
                        }
                    }
                }

                if (this.reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                    if (!this.reflectionTexture.isReady()) {
                        return false;
                    } else {
                        needNormals = true;
                        this._defines.REFLECTION = true;

                        if (this.reflectionTexture.coordinatesMode === Texture.INVCUBIC_MODE) {
                            this._defines.INVERTCUBICMAP = true;
                        }

                        this._defines.REFLECTIONMAP_3D = this.reflectionTexture.isCube;

                        switch (this.reflectionTexture.coordinatesMode) {
                            case Texture.CUBIC_MODE:
                            case Texture.INVCUBIC_MODE:
                                this._defines.REFLECTIONMAP_CUBIC = true;
                                break;
                            case Texture.EXPLICIT_MODE:
                                this._defines.REFLECTIONMAP_EXPLICIT = true;
                                break;
                            case Texture.PLANAR_MODE:
                                this._defines.REFLECTIONMAP_PLANAR = true;
                                break;
                            case Texture.PROJECTION_MODE:
                                this._defines.REFLECTIONMAP_PROJECTION = true;
                                break;
                            case Texture.SKYBOX_MODE:
                                this._defines.REFLECTIONMAP_SKYBOX = true;
                                break;
                            case Texture.SPHERICAL_MODE:
                                this._defines.REFLECTIONMAP_SPHERICAL = true;
                                break;
                            case Texture.EQUIRECTANGULAR_MODE:
                                this._defines.REFLECTIONMAP_EQUIRECTANGULAR = true;
                                break;
                        }
                    }
                }

                if (this.lightmapTexture && StandardMaterial.LightmapEnabled) {
                    if (!this.lightmapTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.LIGHTMAP = true;
                        this._defines.USELIGHTMAPASSHADOWMAP = this.useLightmapAsShadowmap;
                    }
                }

                if (this.emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                    if (!this.emissiveTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.EMISSIVE = true;
                    }
                }

                if (this.reflectivityTexture && StandardMaterial.SpecularTextureEnabled) {
                    if (!this.reflectivityTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.REFLECTIVITY = true;
                        this._defines.MICROSURFACEFROMREFLECTIVITYMAP = this.useMicroSurfaceFromReflectivityMapAlpha;
                    }
                }
            }

            if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                if (!this.bumpTexture.isReady()) {
                    return false;
                } else {
                    needUVs = true;
                    this._defines.BUMP = true;
                }
            }

            // Effect
            if (scene.clipPlane) {
                this._defines.CLIPPLANE = true;
            }

            if (engine.getAlphaTesting()) {
                this._defines.ALPHATEST = true;
            }

            if (this._shouldUseAlphaFromAlbedoTexture()) {
                this._defines.ALPHAFROMALBEDO = true;
            }

            if (this.useEmissiveAsIllumination) {
                this._defines.EMISSIVEASILLUMINATION = true;
            }

            if (this.linkEmissiveWithAlbedo) {
                this._defines.LINKEMISSIVEWITHALBEDO = true;
            }

            if (this.useLogarithmicDepth) {
                this._defines.LOGARITHMICDEPTH = true;
            }

            if (this.cameraContrast != 1) {
                this._defines.CAMERACONTRAST = true;
            }

            if (this.cameraExposure != 1) {
                this._defines.CAMERATONEMAP = true;
            }

            if (this.overloadedShadeIntensity != 1 ||
                this.overloadedShadowIntensity != 1) {
                this._defines.OVERLOADEDSHADOWVALUES = true;
            }

            if (this.overloadedMicroSurfaceIntensity > 0 ||
                this.overloadedEmissiveIntensity > 0 ||
                this.overloadedReflectivityIntensity > 0 ||
                this.overloadedAlbedoIntensity > 0 ||
                this.overloadedAmbientIntensity > 0 ||
                this.overloadedReflectionIntensity > 0) {
                this._defines.OVERLOADEDVALUES = true;
            }

            // Point size
            if (this.pointsCloud || scene.forcePointsCloud) {
                this._defines.POINTSIZE = true;
            }

            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }

            if (scene.lightsEnabled && !this.disableLighting) {
                needNormals = PBRMaterial.PrepareDefinesForLights(scene, mesh, this._defines);
            }

            if (StandardMaterial.FresnelEnabled) {
                // Fresnel
                if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled ||
                    this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {

                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        this._defines.OPACITYFRESNEL = true;
                    }

                    if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                        this._defines.EMISSIVEFRESNEL = true;
                    }

                    needNormals = true;
                    this._defines.FRESNEL = true;
                }
            }

            if (this._defines.SPECULARTERM && this.useSpecularOverAlpha) {
                this._defines.SPECULAROVERALPHA = true;
            }

            // Attribs
            if (mesh) {
                if (needNormals && mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                }
                if (needUVs) {
                    if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                        this._defines.UV1 = true;
                    }
                    if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                        this._defines.UV2 = true;
                    }
                }
                if (mesh.useVertexColors && mesh.isVerticesDataPresent(VertexBuffer.ColorKind)) {
                    this._defines.VERTEXCOLOR = true;

                    if (mesh.hasVertexAlpha) {
                        this._defines.VERTEXALPHA = true;
                    }
                }
                if (mesh.useBones && mesh.computeBonesUsingShaders) {
                    this._defines.NUM_BONE_INFLUENCERS = mesh.numBoneInfluencers;
                    this._defines.BonesPerMesh = (mesh.skeleton.bones.length + 1);
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
                var fallbacks = new EffectFallbacks();
                if (this._defines.REFLECTION) {
                    fallbacks.addFallback(0, "REFLECTION");
                }

                if (this._defines.REFLECTIVITY) {
                    fallbacks.addFallback(0, "REFLECTIVITY");
                }

                if (this._defines.BUMP) {
                    fallbacks.addFallback(0, "BUMP");
                }

                if (this._defines.SPECULAROVERALPHA) {
                    fallbacks.addFallback(0, "SPECULAROVERALPHA");
                }

                if (this._defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }

                if (this._defines.POINTSIZE) {
                    fallbacks.addFallback(0, "POINTSIZE");
                }

                if (this._defines.LOGARITHMICDEPTH) {
                    fallbacks.addFallback(0, "LOGARITHMICDEPTH");
                }

                for (let lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
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

                if (this._defines.SPECULARTERM) {
                    fallbacks.addFallback(0, "SPECULARTERM");
                }

                if (this._defines.OPACITYFRESNEL) {
                    fallbacks.addFallback(1, "OPACITYFRESNEL");
                }

                if (this._defines.EMISSIVEFRESNEL) {
                    fallbacks.addFallback(2, "EMISSIVEFRESNEL");
                }

                if (this._defines.FRESNEL) {
                    fallbacks.addFallback(3, "FRESNEL");
                }

                if (this._defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }

                //Attributes
                var attribs = [VertexBuffer.PositionKind];

                if (this._defines.NORMAL) {
                    attribs.push(VertexBuffer.NormalKind);
                }

                if (this._defines.UV1) {
                    attribs.push(VertexBuffer.UVKind);
                }

                if (this._defines.UV2) {
                    attribs.push(VertexBuffer.UV2Kind);
                }

                if (this._defines.VERTEXCOLOR) {
                    attribs.push(VertexBuffer.ColorKind);
                }

                if (this._defines.NUM_BONE_INFLUENCERS > 0) {
                    attribs.push(VertexBuffer.MatricesIndicesKind);
                    attribs.push(VertexBuffer.MatricesWeightsKind);
                    if (this._defines.NUM_BONE_INFLUENCERS > 4) {
                        attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                        attribs.push(VertexBuffer.MatricesWeightsExtraKind);
                    }
                }

                if (this._defines.INSTANCES) {
                    attribs.push("world0");
                    attribs.push("world1");
                    attribs.push("world2");
                    attribs.push("world3");
                }

                // Legacy browser patch
                var shaderName = "pbr";
                if (!scene.getEngine().getCaps().standardDerivatives) {
                    shaderName = "legacypbr";
                }
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName,
                    attribs,
                    ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vAlbedoColor", "vReflectivityColor", "vEmissiveColor", "vReflectionColor",
                        "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                        "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                        "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                        "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                        "vFogInfos", "vFogColor", "pointSize",
                        "vAlbedoInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vReflectivityInfos", "vBumpInfos", "vLightmapInfos",
                        "mBones",
                        "vClipPlane", "albedoMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "reflectivityMatrix", "bumpMatrix", "lightmapMatrix",
                        "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3", "depthValues",
                        "opacityParts", "emissiveLeftColor", "emissiveRightColor",
                        "vLightingIntensity", "vOverloadedShadowIntensity", "vOverloadedIntensity", "vCameraInfos", "vOverloadedAlbedo", "vOverloadedReflection", "vOverloadedReflectivity", "vOverloadedEmissive", "vOverloadedMicroSurface",
                        "logarithmicDepthConstant"
                    ],
                    ["albedoSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "reflectivitySampler", "bumpSampler", "lightmapSampler",
                        "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3"
                    ],
                    join, fallbacks, this.onCompiled, this.onError);
            }
            if (!this._effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new PBRMaterialDefines();
                }

                this._defines.cloneTo(mesh._materialDefines);
            }

            return true;
        }


        public unbind(): void {
            if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
                this._effect.setTexture("reflection2DSampler", null);
            }

            super.unbind();
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
            this._effect.setMatrix("world", world);
        }

        private _myScene: BABYLON.Scene = null;
        private _myShadowGenerator: BABYLON.ShadowGenerator = null;

        public bind(world: Matrix, mesh?: Mesh): void {
            this._myScene = this.getScene();

            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", this._myScene.getTransformMatrix());

            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
            }

            if (this._myScene.getCachedMaterial() !== (<BABYLON.Material>this)) {

                if (StandardMaterial.FresnelEnabled) {
                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        this._effect.setColor4("opacityParts", new Color3(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power);
                    }

                    if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                        this._effect.setColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                        this._effect.setColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                    }
                }

                // Textures        
                if (this.albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                    this._effect.setTexture("albedoSampler", this.albedoTexture);

                    this._effect.setFloat2("vAlbedoInfos", this.albedoTexture.coordinatesIndex, this.albedoTexture.level);
                    this._effect.setMatrix("albedoMatrix", this.albedoTexture.getTextureMatrix());
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
                    this._effect.setFloat2("vReflectionInfos", this.reflectionTexture.level, 0);
                }

                if (this.emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                    this._effect.setTexture("emissiveSampler", this.emissiveTexture);

                    this._effect.setFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
                    this._effect.setMatrix("emissiveMatrix", this.emissiveTexture.getTextureMatrix());
                }

                if (this.lightmapTexture && StandardMaterial.LightmapEnabled) {
                    this._effect.setTexture("lightmapSampler", this.lightmapTexture);

                    this._effect.setFloat2("vLightmapInfos", this.lightmapTexture.coordinatesIndex, this.lightmapTexture.level);
                    this._effect.setMatrix("lightmapMatrix", this.lightmapTexture.getTextureMatrix());
                }

                if (this.reflectivityTexture && StandardMaterial.SpecularTextureEnabled) {
                    this._effect.setTexture("reflectivitySampler", this.reflectivityTexture);

                    this._effect.setFloat2("vReflectivityInfos", this.reflectivityTexture.coordinatesIndex, this.reflectivityTexture.level);
                    this._effect.setMatrix("reflectivityMatrix", this.reflectivityTexture.getTextureMatrix());
                }

                if (this.bumpTexture && this._myScene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                    this._effect.setTexture("bumpSampler", this.bumpTexture);

                    this._effect.setFloat2("vBumpInfos", this.bumpTexture.coordinatesIndex, 1.0 / this.bumpTexture.level);
                    this._effect.setMatrix("bumpMatrix", this.bumpTexture.getTextureMatrix());
                }

                // Clip plane
                if (this._myScene.clipPlane) {
                    this._effect.setFloat4("vClipPlane", this._myScene.clipPlane.normal.x,
                        this._myScene.clipPlane.normal.y,
                        this._myScene.clipPlane.normal.z,
                        this._myScene.clipPlane.d);
                }

                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }

                // Colors
                this._myScene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);
                
                // GAMMA CORRECTION.
                this.reflectivityColor.toLinearSpaceToRef(PBRMaterial._scaledReflectivity);

                this._effect.setVector3("vEyePosition", this._myScene._mirroredCameraPosition ? this._myScene._mirroredCameraPosition : this._myScene.activeCamera.position);
                this._effect.setColor3("vAmbientColor", this._globalAmbientColor);
                this._effect.setColor4("vReflectivityColor", PBRMaterial._scaledReflectivity, this.microSurface);

                // GAMMA CORRECTION.
                this.emissiveColor.toLinearSpaceToRef(PBRMaterial._scaledEmissive); 
                this._effect.setColor3("vEmissiveColor", PBRMaterial._scaledEmissive);

                // GAMMA CORRECTION.
                this.reflectionColor.toLinearSpaceToRef(PBRMaterial._scaledReflection);
                this._effect.setColor3("vReflectionColor", PBRMaterial._scaledReflection);
            }

            // GAMMA CORRECTION.
            this.albedoColor.toLinearSpaceToRef(PBRMaterial._scaledAlbedo);
            this._effect.setColor4("vAlbedoColor", PBRMaterial._scaledAlbedo, this.alpha * mesh.visibility);

            // Lights
            if (this._myScene.lightsEnabled && !this.disableLighting) {
                PBRMaterial.BindLights(this._myScene, mesh, this._effect, this._defines);
            }

            // View
            if (this._myScene.fogEnabled && mesh.applyFog && this._myScene.fogMode !== Scene.FOGMODE_NONE || this.reflectionTexture) {
                this._effect.setMatrix("view", this._myScene.getViewMatrix());
            }

            // Fog
            if (this._myScene.fogEnabled && mesh.applyFog && this._myScene.fogMode !== Scene.FOGMODE_NONE) {
                this._effect.setFloat4("vFogInfos", this._myScene.fogMode, this._myScene.fogStart, this._myScene.fogEnd, this._myScene.fogDensity);
                this._effect.setColor3("vFogColor", this._myScene.fogColor);
            }

            this._lightingInfos.x = this.directIntensity;
            this._lightingInfos.y = this.emissiveIntensity;
            this._lightingInfos.z = this.environmentIntensity;
            this._lightingInfos.w = this.specularIntensity;

            this._effect.setVector4("vLightingIntensity", this._lightingInfos);

            this._overloadedShadowInfos.x = this.overloadedShadowIntensity;
            this._overloadedShadowInfos.y = this.overloadedShadeIntensity;
            this._effect.setVector4("vOverloadedShadowIntensity", this._overloadedShadowInfos);

            this._cameraInfos.x = this.cameraExposure;
            this._cameraInfos.y = this.cameraContrast;
            this._effect.setVector4("vCameraInfos", this._cameraInfos);

            this._overloadedIntensity.x = this.overloadedAmbientIntensity;
            this._overloadedIntensity.y = this.overloadedAlbedoIntensity;
            this._overloadedIntensity.z = this.overloadedReflectivityIntensity;
            this._overloadedIntensity.w = this.overloadedEmissiveIntensity;
            this._effect.setVector4("vOverloadedIntensity", this._overloadedIntensity);

            this.overloadedAmbient.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedAmbient", this._tempColor);
            this.overloadedAlbedo.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedAlbedo", this._tempColor);
            this.overloadedReflectivity.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedReflectivity", this._tempColor);
            this.overloadedEmissive.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedEmissive", this._tempColor);
            this.overloadedReflection.toLinearSpaceToRef(this._tempColor);
            this._effect.setColor3("vOverloadedReflection", this._tempColor);

            this._overloadedMicroSurface.x = this.overloadedMicroSurface;
            this._overloadedMicroSurface.y = this.overloadedMicroSurfaceIntensity;
            this._overloadedMicroSurface.z = this.overloadedReflectionIntensity;
            this._effect.setVector3("vOverloadedMicroSurface", this._overloadedMicroSurface);

            // Log. depth
            if (this._defines.LOGARITHMICDEPTH) {
                this._effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(this._myScene.activeCamera.maxZ + 1.0) / Math.LN2));
            }

            super.bind(world, mesh);

            this._myScene = null;
        }

        public getAnimatables(): IAnimatable[] {
            var results = [];

            if (this.albedoTexture && this.albedoTexture.animations && this.albedoTexture.animations.length > 0) {
                results.push(this.albedoTexture);
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

            if (this.reflectivityTexture && this.reflectivityTexture.animations && this.reflectivityTexture.animations.length > 0) {
                results.push(this.reflectivityTexture);
            }

            if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
                results.push(this.bumpTexture);
            }

            return results;
        }

        public dispose(forceDisposeEffect?: boolean): void {
            if (this.albedoTexture) {
                this.albedoTexture.dispose();
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

            if (this.reflectivityTexture) {
                this.reflectivityTexture.dispose();
            }

            if (this.bumpTexture) {
                this.bumpTexture.dispose();
            }

            super.dispose(forceDisposeEffect);
        }

        public clone(name: string): PBRMaterial {
            var newPBRMaterial = new PBRMaterial(name, this.getScene());

            // Base material
            this.copyTo(newPBRMaterial);

            newPBRMaterial.directIntensity = this.directIntensity;
            newPBRMaterial.emissiveIntensity = this.emissiveIntensity;
            newPBRMaterial.environmentIntensity = this.environmentIntensity;
            newPBRMaterial.specularIntensity = this.specularIntensity;
        
            newPBRMaterial.cameraExposure = this.cameraExposure;
            newPBRMaterial.cameraContrast = this.cameraContrast;

            newPBRMaterial.overloadedShadowIntensity = this.overloadedShadowIntensity;
            newPBRMaterial.overloadedShadeIntensity = this.overloadedShadeIntensity;
        
            newPBRMaterial.overloadedAmbientIntensity = this.overloadedAmbientIntensity;
            newPBRMaterial.overloadedAlbedoIntensity = this.overloadedAlbedoIntensity;
            newPBRMaterial.overloadedReflectivityIntensity = this.overloadedReflectivityIntensity;
            newPBRMaterial.overloadedEmissiveIntensity = this.overloadedEmissiveIntensity;
            newPBRMaterial.overloadedAmbient = this.overloadedAmbient;
            newPBRMaterial.overloadedAlbedo = this.overloadedAlbedo;
            newPBRMaterial.overloadedReflectivity = this.overloadedReflectivity;
            newPBRMaterial.overloadedEmissive = this.overloadedEmissive;
            newPBRMaterial.overloadedReflection = this.overloadedReflection;

            newPBRMaterial.overloadedMicroSurface = this.overloadedMicroSurface;
            newPBRMaterial.overloadedMicroSurfaceIntensity = this.overloadedMicroSurfaceIntensity;
            newPBRMaterial.overloadedReflectionIntensity = this.overloadedReflectionIntensity;
        
            newPBRMaterial.disableBumpMap = this.disableBumpMap;

            // Standard material
            if (this.albedoTexture && this.albedoTexture.clone) {
                newPBRMaterial.albedoTexture = this.albedoTexture.clone();
            }
            if (this.ambientTexture && this.ambientTexture.clone) {
                newPBRMaterial.ambientTexture = this.ambientTexture.clone();
            }
            if (this.opacityTexture && this.opacityTexture.clone) {
                newPBRMaterial.opacityTexture = this.opacityTexture.clone();
            }
            if (this.reflectionTexture && this.reflectionTexture.clone) {
                newPBRMaterial.reflectionTexture = this.reflectionTexture.clone();
            }
            if (this.emissiveTexture && this.emissiveTexture.clone) {
                newPBRMaterial.emissiveTexture = this.emissiveTexture.clone();
            }
            if (this.reflectivityTexture && this.reflectivityTexture.clone) {
                newPBRMaterial.reflectivityTexture = this.reflectivityTexture.clone();
            }
            if (this.bumpTexture && this.bumpTexture.clone) {
                newPBRMaterial.bumpTexture = this.bumpTexture.clone();
            }
            if (this.lightmapTexture && this.lightmapTexture.clone) {
                newPBRMaterial.lightmapTexture = this.lightmapTexture.clone();
                newPBRMaterial.useLightmapAsShadowmap = this.useLightmapAsShadowmap;
            }

            newPBRMaterial.ambientColor = this.ambientColor.clone();
            newPBRMaterial.albedoColor = this.albedoColor.clone();
            newPBRMaterial.reflectivityColor = this.reflectivityColor.clone();
            newPBRMaterial.reflectionColor = this.reflectionColor.clone();
            newPBRMaterial.microSurface = this.microSurface;
            newPBRMaterial.emissiveColor = this.emissiveColor.clone();
            newPBRMaterial.useAlphaFromAlbedoTexture = this.useAlphaFromAlbedoTexture;
            newPBRMaterial.useEmissiveAsIllumination = this.useEmissiveAsIllumination;
            newPBRMaterial.useMicroSurfaceFromReflectivityMapAlpha = this.useMicroSurfaceFromReflectivityMapAlpha;
            newPBRMaterial.useSpecularOverAlpha = this.useSpecularOverAlpha;
            
            newPBRMaterial.emissiveFresnelParameters = this.emissiveFresnelParameters.clone();
            newPBRMaterial.opacityFresnelParameters = this.opacityFresnelParameters.clone();

            return newPBRMaterial;
        }
        
        public serialize(): any {
            var serializationObject = super.serialize();
                        
            serializationObject.customType = "BABYLON.PBRMaterial";

            serializationObject.directIntensity = this.directIntensity;
            serializationObject.emissiveIntensity = this.emissiveIntensity;
            serializationObject.environmentIntensity = this.environmentIntensity;
            serializationObject.specularIntensity = this.specularIntensity;
        
            serializationObject.cameraExposure = this.cameraExposure;
            serializationObject.cameraContrast = this.cameraContrast;

            serializationObject.overloadedShadowIntensity = this.overloadedShadowIntensity;
            serializationObject.overloadedShadeIntensity = this.overloadedShadeIntensity;
        
            serializationObject.overloadedAmbientIntensity = this.overloadedAmbientIntensity;
            serializationObject.overloadedAlbedoIntensity = this.overloadedAlbedoIntensity;
            serializationObject.overloadedReflectivityIntensity = this.overloadedReflectivityIntensity;
            serializationObject.overloadedEmissiveIntensity = this.overloadedEmissiveIntensity;
            serializationObject.overloadedAmbient = this.overloadedAmbient.asArray();
            serializationObject.overloadedAlbedo = this.overloadedAlbedo.asArray();
            serializationObject.overloadedReflectivity = this.overloadedReflectivity.asArray();
            serializationObject.overloadedEmissive = this.overloadedEmissive.asArray();
            serializationObject.overloadedReflection = this.overloadedReflection.asArray();

            serializationObject.overloadedMicroSurface = this.overloadedMicroSurface;
            serializationObject.overloadedMicroSurfaceIntensity = this.overloadedMicroSurfaceIntensity;
            serializationObject.overloadedReflectionIntensity = this.overloadedReflectionIntensity;
        
            serializationObject.disableBumpMap = this.disableBumpMap;

            // Standard material
            if (this.albedoTexture) {
                serializationObject.albedoTexture = this.albedoTexture.serialize();
            }
            if (this.ambientTexture) {
                serializationObject.ambientTexture = this.ambientTexture.serialize();
            }
            if (this.opacityTexture) {
                serializationObject.opacityTexture = this.opacityTexture.serialize();
            }
            if (this.reflectionTexture) {
                serializationObject.reflectionTexture = this.reflectionTexture.serialize();
            }
            if (this.emissiveTexture) {
                serializationObject.emissiveTexture = this.emissiveTexture.serialize();
            }
            if (this.reflectivityTexture) {
                serializationObject.reflectivityTexture = this.reflectivityTexture.serialize();
            }
            if (this.bumpTexture) {
                serializationObject.bumpTexture = this.bumpTexture.serialize();
            }
            if (this.lightmapTexture) {
                serializationObject.lightmapTexture = this.lightmapTexture.serialize();
                serializationObject.useLightmapAsShadowmap = this.useLightmapAsShadowmap;
            }

            serializationObject.ambientColor = this.ambientColor.asArray();
            serializationObject.albedoColor = this.albedoColor.asArray();
            serializationObject.reflectivityColor = this.reflectivityColor.asArray();
            serializationObject.reflectionColor = this.reflectionColor.asArray();
            serializationObject.microSurface = this.microSurface;
            serializationObject.emissiveColor = this.emissiveColor.asArray();
            serializationObject.useAlphaFromAlbedoTexture = this.useAlphaFromAlbedoTexture;
            serializationObject.useEmissiveAsIllumination = this.useEmissiveAsIllumination;
            serializationObject.useMicroSurfaceFromReflectivityMapAlpha = this.useMicroSurfaceFromReflectivityMapAlpha;
            serializationObject.useSpecularOverAlpha = this.useSpecularOverAlpha;
            
            serializationObject.emissiveFresnelParameters = this.emissiveFresnelParameters.serialize();
            serializationObject.opacityFresnelParameters = this.opacityFresnelParameters.serialize();

            return serializationObject;
        }
                
        public static Parse(source: any, scene: Scene, rootUrl: string): PBRMaterial {
            var material = new PBRMaterial(source.name, scene);
            
            material.alpha = source.alpha;
            material.id = source.id;
            
            if (source.disableDepthWrite) {
                material.disableDepthWrite = source.disableDepthWrite;
            }
            
           if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }

            Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;
            
            material.directIntensity = source.directIntensity;
            material.emissiveIntensity = source.emissiveIntensity;
            material.environmentIntensity = source.environmentIntensity;
            material.specularIntensity = source.specularIntensity;
        
            material.cameraExposure = source.cameraExposure;
            material.cameraContrast = source.cameraContrast;

            material.overloadedShadowIntensity = source.overloadedShadowIntensity;
            material.overloadedShadeIntensity = source.overloadedShadeIntensity;
        
            material.overloadedAmbientIntensity = source.overloadedAmbientIntensity;
            material.overloadedAlbedoIntensity = source.overloadedAlbedoIntensity;
            material.overloadedReflectivityIntensity = source.overloadedReflectivityIntensity;
            material.overloadedEmissiveIntensity = source.overloadedEmissiveIntensity;
            material.overloadedAmbient = Color3.FromArray(source.overloadedAmbient);
            material.overloadedAlbedo = Color3.FromArray(source.overloadedAlbedo);
            material.overloadedReflectivity = Color3.FromArray(source.overloadedReflectivity);
            material.overloadedEmissive = Color3.FromArray(source.overloadedEmissive);
            material.overloadedReflection = Color3.FromArray(source.overloadedReflection);

            material.overloadedMicroSurface = source.overloadedMicroSurface;
            material.overloadedMicroSurfaceIntensity = source.overloadedMicroSurfaceIntensity;
            material.overloadedReflectionIntensity = source.overloadedReflectionIntensity;
        
            material.disableBumpMap = source.disableBumpMap;

            // Standard material
            if (source.albedoTexture) {
                material.albedoTexture = Texture.Parse(source.albedoTexture, scene, rootUrl);
            }
            if (source.ambientTexture) {
                material.ambientTexture = Texture.Parse(source.ambientTexture, scene, rootUrl);
            }
            if (source.opacityTexture) {
                material.opacityTexture = Texture.Parse(source.opacityTexture, scene, rootUrl);
            }
            if (source.reflectionTexture) {
                material.reflectionTexture = Texture.Parse(source.reflectionTexture, scene, rootUrl);
            }
            if (source.emissiveTexture) {
                material.emissiveTexture = Texture.Parse(source.emissiveTexture, scene, rootUrl);
            }
            if (source.reflectivityTexture) {
                material.reflectivityTexture = Texture.Parse(source.reflectivityTexture, scene, rootUrl);
            }
            if (source.bumpTexture) {
                material.bumpTexture = Texture.Parse(source.bumpTexture, scene, rootUrl);
            }
            if (source.lightmapTexture) {
                material.lightmapTexture = Texture.Parse(source.lightmapTexture, scene, rootUrl);
                material.useLightmapAsShadowmap = source.useLightmapAsShadowmap;
            }

            material.ambientColor = Color3.FromArray(source.ambient);
            material.albedoColor = Color3.FromArray(source.albedo);
            material.reflectivityColor = Color3.FromArray(source.reflectivity);
            material.reflectionColor = Color3.FromArray(source.reflectionColor);
            material.microSurface = source.microSurface;
            material.emissiveColor = Color3.FromArray(source.emissive);
            material.useAlphaFromAlbedoTexture = source.useAlphaFromAlbedoTexture;
            material.useEmissiveAsIllumination = source.useEmissiveAsIllumination;
            material.useMicroSurfaceFromReflectivityMapAlpha = source.useMicroSurfaceFromReflectivityMapAlpha;
            material.useSpecularOverAlpha = source.useSpecularOverAlpha;
            
            material.emissiveFresnelParameters = FresnelParameters.Parse(source.emissiveFresnelParameters);
            material.opacityFresnelParameters = FresnelParameters.Parse(source.opacityFresnelParameters);
       
            return material;
        }
    }
}