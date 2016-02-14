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
        public USESPHERICALFROMREFLECTIONMAP = false;
        public REFRACTION = false;
        public REFRACTIONMAP_3D = false;
        public LINKREFRACTIONTOTRANSPARENCY = false;
        public REFRACTIONMAPINLINEARSPACE = false;
        public LODBASEDMICROSFURACE = false;

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

        private _microsurfaceTextureLods: Vector2 = new Vector2(0.0, 0.0);

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
        public refractionTexture: BaseTexture;

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
        
        public indexOfRefraction = 0.66;
        public invertRefractionY = false;
        public linkRefractionWithTransparency = false;

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

                if (this.refractionTexture && this.refractionTexture.isRenderTarget) {
                    this._renderTargets.push(this.refractionTexture);
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
            if (this.linkRefractionWithTransparency) {
                return false;
            }
            return (this.alpha < 1.0) || (this.opacityTexture != null) || this._shouldUseAlphaFromAlbedoTexture() || this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled;
        }

        public needAlphaTesting(): boolean {
            if (this.linkRefractionWithTransparency) {
                return false;
            }
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
      
        private static _scaledAlbedo = new Color3();
        private static _scaledReflectivity = new Color3();
        private static _scaledEmissive = new Color3();
        private static _scaledReflection = new Color3();
        private static _lightRadiuses = [1, 1, 1, 1];

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
                
                this._lightRadiuses[lightIndex] = light.radius;

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
                effect.setColor4("vLightDiffuse" + lightIndex, PBRMaterial._scaledAlbedo, light.range);
                
                if (defines["SPECULARTERM"]) {
                    light.specular.toLinearSpaceToRef(PBRMaterial._scaledReflectivity);
                    
                    PBRMaterial._scaledReflectivity.scaleToRef(light.intensity, PBRMaterial._scaledReflectivity);
                    effect.setColor3("vLightSpecular" + lightIndex, PBRMaterial._scaledReflectivity);
                }

                // Shadows
                if (scene.shadowsEnabled) {
                    depthValuesAlreadySet = StandardMaterial.BindLightShadow(light, scene, mesh, lightIndex, effect, depthValuesAlreadySet);
                }

                lightIndex++;

                if (lightIndex === maxSimultaneousLights)
                    break;
            }
            
            effect.setFloat4("vLightRadiuses", this._lightRadiuses[0],
                this._lightRadiuses[1],
                this._lightRadiuses[2],
                this._lightRadiuses[3]);
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

            if (scene.texturesEnabled) {
                // Textures
                if (scene.texturesEnabled) {
                    if (scene.getEngine().getCaps().textureLOD) {
                        this._defines.LODBASEDMICROSFURACE = true;
                    }

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

                            if (this.reflectionTexture instanceof HDRCubeTexture) {
                                this._defines.USESPHERICALFROMREFLECTIONMAP = true;
                                needNormals = true;
                            }
                        }
                    }

                    if (this.lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
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

                if (this.refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                    if (!this.refractionTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.REFRACTION = true;
                        this._defines.REFRACTIONMAP_3D = this.refractionTexture.isCube;

                        if (this.linkRefractionWithTransparency) {
                            this._defines.LINKREFRACTIONTOTRANSPARENCY = true;
                        }
                        if (this.refractionTexture instanceof HDRCubeTexture) {
                            this._defines.REFRACTIONMAPINLINEARSPACE = true;
                        }
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
                needNormals = StandardMaterial.PrepareDefinesForLights(scene, mesh, this._defines) || needNormals;
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

                StandardMaterial.HandleFallbacksForShadows(this._defines, fallbacks);

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

                StandardMaterial.PrepareAttributesForBones(attribs, mesh, this._defines, fallbacks);
                StandardMaterial.PrepareAttributesForInstances(attribs, this._defines);

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
                        "vAlbedoInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vReflectivityInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                        "mBones",
                        "vClipPlane", "albedoMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "reflectivityMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                        "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3", "depthValues",
                        "opacityParts", "emissiveLeftColor", "emissiveRightColor",
                        "vLightingIntensity", "vOverloadedShadowIntensity", "vOverloadedIntensity", "vCameraInfos", "vOverloadedAlbedo", "vOverloadedReflection", "vOverloadedReflectivity", "vOverloadedEmissive", "vOverloadedMicroSurface",
                        "logarithmicDepthConstant",
                        "vSphericalX", "vSphericalY", "vSphericalZ",
                        "vSphericalXX", "vSphericalYY", "vSphericalZZ",
                        "vSphericalXY", "vSphericalYZ", "vSphericalZX",
                        "vMicrosurfaceTextureLods", "vLightRadiuses"
                    ],
                    ["albedoSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "reflectivitySampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler",
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

            if (this.refractionTexture && this.refractionTexture.isRenderTarget) {
                this._effect.setTexture("refraction2DSampler", null);
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

            // Bones
            StandardMaterial.ApplyBonesParameters(mesh, this._effect);

            if (this._myScene.getCachedMaterial() !== (<BABYLON.Material>this)) {
                this._effect.setMatrix("viewProjection", this._myScene.getTransformMatrix());

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
                if (this._myScene.texturesEnabled) {
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
                        this._microsurfaceTextureLods.x = Math.log(this.reflectionTexture.getSize().width) * Math.LOG2E;
                        
                        if (this.reflectionTexture.isCube) {
                            this._effect.setTexture("reflectionCubeSampler", this.reflectionTexture);
                        } else {
                            this._effect.setTexture("reflection2DSampler", this.reflectionTexture);
                        }

                        this._effect.setMatrix("reflectionMatrix", this.reflectionTexture.getReflectionTextureMatrix());
                        this._effect.setFloat2("vReflectionInfos", this.reflectionTexture.level, 0);

                        if (this._defines.USESPHERICALFROMREFLECTIONMAP) {
                            this._effect.setFloat3("vSphericalX", (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.x.x,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.x.y,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.x.z);
                            this._effect.setFloat3("vSphericalY", (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.y.x,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.y.y,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.y.z);
                            this._effect.setFloat3("vSphericalZ", (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.z.x,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.z.y,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.z.z);
                            this._effect.setFloat3("vSphericalXX", (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.xx.x,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.xx.y,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.xx.z);
                            this._effect.setFloat3("vSphericalYY", (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.yy.x,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.yy.y,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.yy.z);
                            this._effect.setFloat3("vSphericalZZ", (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.zz.x,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.zz.y,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.zz.z);
                            this._effect.setFloat3("vSphericalXY", (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.xy.x,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.xy.y,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.xy.z);
                            this._effect.setFloat3("vSphericalYZ", (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.yz.x,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.yz.y,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.yz.z);
                            this._effect.setFloat3("vSphericalZX", (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.zx.x,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.zx.y,
                                (<HDRCubeTexture>this.reflectionTexture).sphericalPolynomial.zx.z);
                        }
                    }

                    if (this.emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                        this._effect.setTexture("emissiveSampler", this.emissiveTexture);

                        this._effect.setFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
                        this._effect.setMatrix("emissiveMatrix", this.emissiveTexture.getTextureMatrix());
                    }

                    if (this.lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
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

                    if (this.refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        this._microsurfaceTextureLods.y = Math.log(this.refractionTexture.getSize().width) * Math.LOG2E;
                        
                        var depth = 1.0;
                        if (this.refractionTexture.isCube) {
                            this._effect.setTexture("refractionCubeSampler", this.refractionTexture);
                        } else {
                            this._effect.setTexture("refraction2DSampler", this.refractionTexture);
                            this._effect.setMatrix("refractionMatrix", this.refractionTexture.getReflectionTextureMatrix());

                            if ((<any>this.refractionTexture).depth) {
                                depth = (<any>this.refractionTexture).depth;
                            }
                        }
                        this._effect.setFloat4("vRefractionInfos", this.refractionTexture.level, this.indexOfRefraction, depth, this.invertRefractionY ? -1 : 1);
                    }
                    
                    if ((this.reflectionTexture || this.refractionTexture) && this._myScene.getEngine().getCaps().textureLOD) {
                        this._effect.setFloat2("vMicrosurfaceTextureLods", this._microsurfaceTextureLods.x, this._microsurfaceTextureLods.y);
                    }
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

            if (this._myScene.getCachedMaterial() !== this || !this.isFrozen) {
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

            if (this.lightmapTexture && this.lightmapTexture.animations && this.lightmapTexture.animations.length > 0) {
                results.push(this.lightmapTexture);
            }

            if (this.refractionTexture && this.refractionTexture.animations && this.refractionTexture.animations.length > 0) {
                results.push(this.refractionTexture);
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

            if (this.lightmapTexture) {
                this.lightmapTexture.dispose();
            }

            if (this.refractionTexture) {
                this.refractionTexture.dispose();
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
            if (this.refractionTexture && this.refractionTexture.clone) {
                newPBRMaterial.refractionTexture = this.refractionTexture.clone();
                newPBRMaterial.linkRefractionWithTransparency = this.linkRefractionWithTransparency;
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
            newPBRMaterial.indexOfRefraction = this.indexOfRefraction;
            newPBRMaterial.invertRefractionY = this.invertRefractionY;

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
            if (this.refractionTexture) {
                serializationObject.refractionTexture = this.refractionTexture;
                serializationObject.linkRefractionWithTransparency = this.linkRefractionWithTransparency;
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
            serializationObject.indexOfRefraction = this.indexOfRefraction;
            serializationObject.invertRefractionY = this.invertRefractionY;

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
            if (source.refractionTexture) {
                material.refractionTexture = Texture.Parse(source.refractionTexture, scene, rootUrl);
                material.linkRefractionWithTransparency = source.linkRefractionWithTransparency;
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
            material.indexOfRefraction = source.indexOfRefraction;
            material.invertRefractionY = source.invertRefractionY;

            material.emissiveFresnelParameters = FresnelParameters.Parse(source.emissiveFresnelParameters);
            material.opacityFresnelParameters = FresnelParameters.Parse(source.opacityFresnelParameters);

            return material;
        }
    }
}