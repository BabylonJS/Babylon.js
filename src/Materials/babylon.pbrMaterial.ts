module BABYLON {
    class PBRMaterialDefines extends MaterialDefines {
        public ALBEDO = false;
        public AMBIENT = false;
        public OPACITY = false;
        public OPACITYRGB = false;
        public REFLECTION = false;
        public EMISSIVE = false;
        public REFLECTIVITY = false;
        public BUMP = false;
        public PARALLAX = false;
        public PARALLAXOCCLUSION = false;
        public SPECULAROVERALPHA = false;
        public CLIPPLANE = false;
        public ALPHATEST = false;
        public ALPHAFROMALBEDO = false;
        public POINTSIZE = false;
        public FOG = false;
        public SPECULARTERM = false;
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
        public MICROSURFACEAUTOMATIC = false;
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
        public CAMERACOLORGRADING = false;
        public OVERLOADEDVALUES = false;
        public OVERLOADEDSHADOWVALUES = false;
        public USESPHERICALFROMREFLECTIONMAP = false;
        public REFRACTION = false;
        public REFRACTIONMAP_3D = false;
        public LINKREFRACTIONTOTRANSPARENCY = false;
        public REFRACTIONMAPINLINEARSPACE = false;
        public LODBASEDMICROSFURACE = false;
        public USEPHYSICALLIGHTFALLOFF = false;
        public RADIANCEOVERALPHA = false;
        public USEPMREMREFLECTION = false;
        public USEPMREMREFRACTION = false;

        constructor() {
            super();
            this.rebuild();
        }
    }

    /**
     * The Physically based material of BJS.
     * 
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation : 
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    export class PBRMaterial extends BABYLON.Material {

        /**
         * Intensity of the direct lights e.g. the four lights available in your scene.
         * This impacts both the direct diffuse and specular highlights.
         */
        @serialize()
        public directIntensity: number = 1.0;
        
        /**
         * Intensity of the emissive part of the material.
         * This helps controlling the emissive effect without modifying the emissive color.
         */
        @serialize()
        public emissiveIntensity: number = 1.0;
        
        /**
         * Intensity of the environment e.g. how much the environment will light the object
         * either through harmonics for rough material or through the refelction for shiny ones.
         */
        @serialize()
        public environmentIntensity: number = 1.0;
        
        /**
         * This is a special control allowing the reduction of the specular highlights coming from the 
         * four lights of the scene. Those highlights may not be needed in full environment lighting.
         */
        @serialize()
        public specularIntensity: number = 1.0;

        private _lightingInfos: Vector4 = new Vector4(this.directIntensity, this.emissiveIntensity, this.environmentIntensity, this.specularIntensity);
        
        /**
         * Debug Control allowing disabling the bump map on this material.
         */
        @serialize()
        public disableBumpMap: boolean = false;

        /**
         * Debug Control helping enforcing or dropping the darkness of shadows.
         * 1.0 means the shadows have their normal darkness, 0.0 means the shadows are not visible.
         */
        @serialize()
        public overloadedShadowIntensity: number = 1.0;
        
        /**
         * Debug Control helping dropping the shading effect coming from the diffuse lighting.
         * 1.0 means the shade have their normal impact, 0.0 means no shading at all.
         */
        @serialize()
        public overloadedShadeIntensity: number = 1.0;

        private _overloadedShadowInfos: Vector4 = new Vector4(this.overloadedShadowIntensity, this.overloadedShadeIntensity, 0.0, 0.0);

        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        @serialize()
        public cameraExposure: number = 1.0;
        
        /**
         * The camera contrast used on this material.
         * This property is here and not in the camera to allow controlling contrast without full screen post process.
         */
        @serialize()
        public cameraContrast: number = 1.0;
        
        /**
         * Color Grading 2D Lookup Texture.
         * This allows special effects like sepia, black and white to sixties rendering style. 
         */
        @serializeAsTexture()
        public cameraColorGradingTexture: BaseTexture = null;

        private _cameraColorGradingScaleOffset: Vector4 = new Vector4(1.0, 1.0, 0.0, 0.0);
        private _cameraColorGradingInfos: Vector4 = new Vector4(1.0, 1.0, 0.0, 0.0);
         
        private _cameraInfos: Vector4 = new Vector4(1.0, 1.0, 0.0, 0.0);

        private _microsurfaceTextureLods: Vector2 = new Vector2(0.0, 0.0);

        /**
         * Debug Control allowing to overload the ambient color.
         * This as to be use with the overloadedAmbientIntensity parameter.
         */
        @serializeAsColor3()
        public overloadedAmbient: Color3 = BABYLON.Color3.White();

        /**
         * Debug Control indicating how much the overloaded ambient color is used against the default one.
         */
        @serialize()
        public overloadedAmbientIntensity: number = 0.0;
        
        /**
         * Debug Control allowing to overload the albedo color.
         * This as to be use with the overloadedAlbedoIntensity parameter.
         */
        @serializeAsColor3()
        public overloadedAlbedo: Color3 = BABYLON.Color3.White();
        
        /**
         * Debug Control indicating how much the overloaded albedo color is used against the default one.
         */
        @serialize()
        public overloadedAlbedoIntensity: number = 0.0;
        
        /**
         * Debug Control allowing to overload the reflectivity color.
         * This as to be use with the overloadedReflectivityIntensity parameter.
         */
        @serializeAsColor3()
        public overloadedReflectivity: Color3 = new BABYLON.Color3(0.3, 0.3, 0.3);
        
        /**
         * Debug Control indicating how much the overloaded reflectivity color is used against the default one.
         */
        @serialize()
        public overloadedReflectivityIntensity: number = 0.0;
        
        /**
         * Debug Control allowing to overload the emissive color.
         * This as to be use with the overloadedEmissiveIntensity parameter.
         */
        @serializeAsColor3()
        public overloadedEmissive: Color3 = BABYLON.Color3.White();
        
        /**
         * Debug Control indicating how much the overloaded emissive color is used against the default one.
         */
        @serialize()
        public overloadedEmissiveIntensity: number = 0.0;

        private _overloadedIntensity: Vector4 = new Vector4(this.overloadedAmbientIntensity, this.overloadedAlbedoIntensity, this.overloadedReflectivityIntensity, this.overloadedEmissiveIntensity);
        
        /**
         * Debug Control allowing to overload the reflection color.
         * This as to be use with the overloadedReflectionIntensity parameter.
         */
        @serializeAsColor3()
        public overloadedReflection: Color3 = BABYLON.Color3.White();
        
        /**
         * Debug Control indicating how much the overloaded reflection color is used against the default one.
         */
        @serialize()
        public overloadedReflectionIntensity: number = 0.0;

        /**
         * Debug Control allowing to overload the microsurface.
         * This as to be use with the overloadedMicroSurfaceIntensity parameter.
         */
        @serialize()
        public overloadedMicroSurface: number = 0.0;
        
        /**
         * Debug Control indicating how much the overloaded microsurface is used against the default one.
         */
        @serialize()
        public overloadedMicroSurfaceIntensity: number = 0.0;

        private _overloadedMicroSurface: Vector3 = new Vector3(this.overloadedMicroSurface, this.overloadedMicroSurfaceIntensity, this.overloadedReflectionIntensity);

        /**
         * AKA Diffuse Texture in standard nomenclature.
         */
        @serializeAsTexture()
        public albedoTexture: BaseTexture;
        
        /**
         * AKA Occlusion Texture in other nomenclature.
         */
        @serializeAsTexture()
        public ambientTexture: BaseTexture;

        @serializeAsTexture()
        public opacityTexture: BaseTexture;

        @serializeAsTexture()
        public reflectionTexture: BaseTexture;

        @serializeAsTexture()
        public emissiveTexture: BaseTexture;
        
        /**
         * AKA Specular texture in other nomenclature.
         */
        @serializeAsTexture()
        public reflectivityTexture: BaseTexture;

        @serializeAsTexture()
        public bumpTexture: BaseTexture;

        @serializeAsTexture()
        public lightmapTexture: BaseTexture;

        @serializeAsTexture()
        public refractionTexture: BaseTexture;

        @serializeAsColor3("ambient")
        public ambientColor = new Color3(0, 0, 0);
        
        /**
         * AKA Diffuse Color in other nomenclature.
         */
        @serializeAsColor3("albedo")
        public albedoColor = new Color3(1, 1, 1);
        
        /**
         * AKA Specular Color in other nomenclature.
         */
        @serializeAsColor3("reflectivity")
        public reflectivityColor = new Color3(1, 1, 1);

        @serializeAsColor3("reflection")
        public reflectionColor = new Color3(0.5, 0.5, 0.5);

        @serializeAsColor3("emissive")
        public emissiveColor = new Color3(0, 0, 0);
        
        /**

         * AKA Glossiness in other nomenclature.
         */
        @serialize()
        public microSurface = 0.9;
        
        /**
         * source material index of refraction (IOR)' / 'destination material IOR.
         */
        @serialize()
        public indexOfRefraction = 0.66;
        
        /**
         * Controls if refraction needs to be inverted on Y. This could be usefull for procedural texture.
         */
        @serialize()
        public invertRefractionY = false;

        @serializeAsFresnelParameters()
        public opacityFresnelParameters: FresnelParameters;

        @serializeAsFresnelParameters()
        public emissiveFresnelParameters: FresnelParameters;

        /**
         * This parameters will make the material used its opacity to control how much it is refracting aginst not.
         * Materials half opaque for instance using refraction could benefit from this control.
         */
        @serialize()
        public linkRefractionWithTransparency = false;
        
        /**
         * The emissive and albedo are linked to never be more than one (Energy conservation).
         */
        @serialize()
        public linkEmissiveWithAlbedo = false;

        @serialize()
        public useLightmapAsShadowmap = false;
        
        /**
         * In this mode, the emissive informtaion will always be added to the lighting once.
         * A light for instance can be thought as emissive.
         */
        @serialize()
        public useEmissiveAsIllumination = false;
        
        /**
         * Secifies that the alpha is coming form the albedo channel alpha channel.
         */
        @serialize()
        public useAlphaFromAlbedoTexture = false;
        
        /**
         * Specifies that the material will keeps the specular highlights over a transparent surface (only the most limunous ones).
         * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
         */
        @serialize()
        public useSpecularOverAlpha = true;
        
        /**
         * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
         */
        @serialize()
        public useMicroSurfaceFromReflectivityMapAlpha = false;
        
        /**
         * In case the reflectivity map does not contain the microsurface information in its alpha channel,
         * The material will try to infer what glossiness each pixel should be.
         */
        @serialize()
        public useAutoMicroSurfaceFromReflectivityMap = false;
        
        /**
         * Allows to work with scalar in linear mode. This is definitely a matter of preferences and tools used during
         * the creation of the material.
         */
        @serialize()
        public useScalarInLinearSpace = false;
        
        /**
         * BJS is using an harcoded light falloff based on a manually sets up range.
         * In PBR, one way to represents the fallof is to use the inverse squared root algorythm.
         * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
         */
        @serialize()
        public usePhysicalLightFalloff = true;
        
        /**
         * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most limunous ones).
         * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
         */
        @serialize()
        public useRadianceOverAlpha = true;
        
        /**
         * Allows using the bump map in parallax mode.
         */
        @serialize()
        public useParallax = false;

        /**
         * Allows using the bump map in parallax occlusion mode.
         */
        @serialize()
        public useParallaxOcclusion = false;

        /**
         * Controls the scale bias of the parallax mode.
         */
        @serialize()
        public parallaxScaleBias = 0.05;
        
        /**
         * If sets to true, disables all the lights affecting the material.
         */
        @serialize()
        public disableLighting = false;

        /**
         * Number of Simultaneous lights allowed on the material.
         */
        @serialize()
        public maxSimultaneousLights = 4;  

        private _renderTargets = new SmartArray<RenderTargetTexture>(16);
        private _worldViewProjectionMatrix = Matrix.Zero();
        private _globalAmbientColor = new Color3(0, 0, 0);
        private _tempColor = new Color3();
        private _renderId: number;

        private _defines = new PBRMaterialDefines();
        private _cachedDefines = new PBRMaterialDefines();

        private _useLogarithmicDepth: boolean;

        /**
         * Instantiates a new PBRMaterial instance.
         * 
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
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

        @serialize()
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

        private convertColorToLinearSpaceToRef(color: Color3, ref: Color3): void {
            PBRMaterial.convertColorToLinearSpaceToRef(color, ref, this.useScalarInLinearSpace);
        }

        private static convertColorToLinearSpaceToRef(color: Color3, ref: Color3, useScalarInLinear: boolean): void {
            if (!useScalarInLinear) {
                color.toLinearSpaceToRef(ref);
            } else {
                ref.r = color.r;
                ref.g = color.g;
                ref.b = color.b;
            }
        }

        private static _scaledAlbedo = new Color3();
        private static _scaledReflectivity = new Color3();
        private static _scaledEmissive = new Color3();
        private static _scaledReflection = new Color3();

        public static BindLights(scene: Scene, mesh: AbstractMesh, effect: Effect, defines: MaterialDefines, useScalarInLinearSpace: boolean, maxSimultaneousLights: number, usePhysicalLightFalloff: boolean) {
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

                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(light.diffuse, PBRMaterial._scaledAlbedo, useScalarInLinearSpace);

                PBRMaterial._scaledAlbedo.scaleToRef(light.intensity, PBRMaterial._scaledAlbedo);
                effect.setColor4("vLightDiffuse" + lightIndex, PBRMaterial._scaledAlbedo, usePhysicalLightFalloff ? light.radius : light.range);

                if (defines["SPECULARTERM"]) {
                    this.convertColorToLinearSpaceToRef(light.specular, PBRMaterial._scaledReflectivity, useScalarInLinearSpace);

                    PBRMaterial._scaledReflectivity.scaleToRef(light.intensity, PBRMaterial._scaledReflectivity);
                    effect.setColor3("vLightSpecular" + lightIndex, PBRMaterial._scaledReflectivity);
                }

                // Shadows
                if (scene.shadowsEnabled) {
                    depthValuesAlreadySet = MaterialHelper.BindLightShadow(light, scene, mesh, lightIndex, effect, depthValuesAlreadySet);
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

                            if (this.reflectionTexture instanceof HDRCubeTexture && (<HDRCubeTexture>this.reflectionTexture)) {
                                this._defines.USESPHERICALFROMREFLECTIONMAP = true;
                                needNormals = true;

                                if ((<HDRCubeTexture>this.reflectionTexture).isPMREM) {
                                    this._defines.USEPMREMREFLECTION = true;
                                }
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
                            this._defines.MICROSURFACEAUTOMATIC = this.useAutoMicroSurfaceFromReflectivityMap;
                        }
                    }
                }

                if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                    if (!this.bumpTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.BUMP = true;

                        if (this.useParallax) {
                            this._defines.PARALLAX = true;
                            if (this.useParallaxOcclusion) {
                                this._defines.PARALLAXOCCLUSION = true;
                            }
                        }
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

                            if ((<HDRCubeTexture>this.refractionTexture).isPMREM) {
                                this._defines.USEPMREMREFRACTION = true;
                            }
                        }
                    }
                }
            
                if (this.cameraColorGradingTexture) {
                    if (!this.cameraColorGradingTexture.isReady()) {
                        return false;
                    } else {
                        this._defines.CAMERACOLORGRADING = true;
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
                needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines, this.maxSimultaneousLights) || needNormals;
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

            if (this.usePhysicalLightFalloff) {
                this._defines.USEPHYSICALLIGHTFALLOFF = true;
            }

            if (this.useRadianceOverAlpha) {
                this._defines.RADIANCEOVERALPHA = true;
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

                if (this._defines.REFRACTION) {
                    fallbacks.addFallback(0, "REFRACTION");
                }

                if (this._defines.REFLECTIVITY) {
                    fallbacks.addFallback(0, "REFLECTIVITY");
                }

                if (this._defines.BUMP) {
                    fallbacks.addFallback(0, "BUMP");
                }

                if (this._defines.PARALLAX) {
                    fallbacks.addFallback(1, "PARALLAX");
                }

                if (this._defines.PARALLAXOCCLUSION) {
                    fallbacks.addFallback(0, "PARALLAXOCCLUSION");
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

                MaterialHelper.HandleFallbacksForShadows(this._defines, fallbacks, this.maxSimultaneousLights);

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

                MaterialHelper.PrepareAttributesForBones(attribs, mesh, this._defines, fallbacks);
                MaterialHelper.PrepareAttributesForInstances(attribs, this._defines);

                // Legacy browser patch
                var shaderName = "pbr";
                if (!scene.getEngine().getCaps().standardDerivatives) {
                    shaderName = "legacypbr";
                }
                var join = this._defines.toString();
                
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vAlbedoColor", "vReflectivityColor", "vEmissiveColor", "vReflectionColor",
                        "vFogInfos", "vFogColor", "pointSize",
                        "vAlbedoInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vReflectivityInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                        "mBones",
                        "vClipPlane", "albedoMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "reflectivityMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                        "depthValues",
                        "opacityParts", "emissiveLeftColor", "emissiveRightColor",
                        "vLightingIntensity", "vOverloadedShadowIntensity", "vOverloadedIntensity", "vOverloadedAlbedo", "vOverloadedReflection", "vOverloadedReflectivity", "vOverloadedEmissive", "vOverloadedMicroSurface",
                        "logarithmicDepthConstant",
                        "vSphericalX", "vSphericalY", "vSphericalZ",
                        "vSphericalXX", "vSphericalYY", "vSphericalZZ",
                        "vSphericalXY", "vSphericalYZ", "vSphericalZX",
                        "vMicrosurfaceTextureLods",
                        "vCameraInfos", "vCameraColorGradingInfos", "vCameraColorGradingScaleOffset"
                    ];
                
                MaterialHelper.PrepareUniformsListForList(uniforms, this._defines, this.maxSimultaneousLights); 
                
                this._effect = scene.getEngine().createEffect(shaderName,
                    attribs, uniforms,
                    ["albedoSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "reflectivitySampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler",
                        "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3",
                        "cameraColorGrading2DSampler"
                    ],
                    join, fallbacks, this.onCompiled, this.onError, {maxSimultaneousLights: this.maxSimultaneousLights});
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
            MaterialHelper.BindBonesParameters(mesh, this._effect);

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
                        this._microsurfaceTextureLods.x = Math.round(Math.log(this.reflectionTexture.getSize().width) * Math.LOG2E);

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

                        this._effect.setFloat3("vBumpInfos", this.bumpTexture.coordinatesIndex, 1.0 / this.bumpTexture.level, this.parallaxScaleBias);
                        this._effect.setMatrix("bumpMatrix", this.bumpTexture.getTextureMatrix());
                    }

                    if (this.refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        this._microsurfaceTextureLods.y = Math.round(Math.log(this.refractionTexture.getSize().width) * Math.LOG2E);

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

                    if ((this.reflectionTexture || this.refractionTexture)) {
                        this._effect.setFloat2("vMicrosurfaceTextureLods", this._microsurfaceTextureLods.x, this._microsurfaceTextureLods.y);
                    }
                    
                    if (this.cameraColorGradingTexture) {
                        this._effect.setTexture("cameraColorGrading2DSampler", this.cameraColorGradingTexture);
                        
                        this._cameraColorGradingInfos.x = this.cameraColorGradingTexture.level;                     // Texture Level
                        this._cameraColorGradingInfos.y = this.cameraColorGradingTexture.getSize().height;          // Texture Size example with 8
                        this._cameraColorGradingInfos.z = this._cameraColorGradingInfos.y - 1.0;                    // SizeMinusOne 8 - 1
                        this._cameraColorGradingInfos.w = 1 / this._cameraColorGradingInfos.y;                      // Space of 1 slice 1 / 8
                        
                        this._effect.setFloat4("vCameraColorGradingInfos", 
                            this._cameraColorGradingInfos.x,
                            this._cameraColorGradingInfos.y,
                            this._cameraColorGradingInfos.z,
                            this._cameraColorGradingInfos.w);
                        
                        var slicePixelSizeU = this._cameraColorGradingInfos.w / this._cameraColorGradingInfos.y;    // Space of 1 pixel in U direction, e.g. 1/64
                        var slicePixelSizeV = 1.0 / this._cameraColorGradingInfos.y;							    // Space of 1 pixel in V direction, e.g. 1/8
                        this._cameraColorGradingScaleOffset.x = this._cameraColorGradingInfos.z * slicePixelSizeU;  // Extent of lookup range in U for a single slice so that range corresponds to (size-1) texels, for example 7/64
                        this._cameraColorGradingScaleOffset.y = this._cameraColorGradingInfos.z / 
                            this._cameraColorGradingInfos.y;							                            // Extent of lookup range in V for a single slice so that range corresponds to (size-1) texels, for example 7/8
                        this._cameraColorGradingScaleOffset.z = 0.5 * slicePixelSizeU;						        // Offset of lookup range in U to align sample position with texel centre, for example 0.5/64 
                        this._cameraColorGradingScaleOffset.w = 0.5 * slicePixelSizeV;						        // Offset of lookup range in V to align sample position with texel centre, for example 0.5/8
                        
                        this._effect.setFloat4("vCameraColorGradingScaleOffset", 
                            this._cameraColorGradingScaleOffset.x,
                            this._cameraColorGradingScaleOffset.y,
                            this._cameraColorGradingScaleOffset.z,
                            this._cameraColorGradingScaleOffset.w);
                    }
                }

                // Clip plane
                MaterialHelper.BindClipPlane(this._effect, this._myScene);

                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }

                // Colors
                this._myScene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);
                
                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(this.reflectivityColor, PBRMaterial._scaledReflectivity);

                this._effect.setVector3("vEyePosition", this._myScene._mirroredCameraPosition ? this._myScene._mirroredCameraPosition : this._myScene.activeCamera.position);
                this._effect.setColor3("vAmbientColor", this._globalAmbientColor);
                this._effect.setColor4("vReflectivityColor", PBRMaterial._scaledReflectivity, this.microSurface);

                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(this.emissiveColor, PBRMaterial._scaledEmissive);
                this._effect.setColor3("vEmissiveColor", PBRMaterial._scaledEmissive);

                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(this.reflectionColor, PBRMaterial._scaledReflection);
                this._effect.setColor3("vReflectionColor", PBRMaterial._scaledReflection);
            }

            if (this._myScene.getCachedMaterial() !== this || !this.isFrozen) {
                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(this.albedoColor, PBRMaterial._scaledAlbedo);
                this._effect.setColor4("vAlbedoColor", PBRMaterial._scaledAlbedo, this.alpha * mesh.visibility);

                // Lights
                if (this._myScene.lightsEnabled && !this.disableLighting) {
                    PBRMaterial.BindLights(this._myScene, mesh, this._effect, this._defines, this.useScalarInLinearSpace, this.maxSimultaneousLights, this.usePhysicalLightFalloff);
                }

                // View
                if (this._myScene.fogEnabled && mesh.applyFog && this._myScene.fogMode !== Scene.FOGMODE_NONE || this.reflectionTexture) {
                    this._effect.setMatrix("view", this._myScene.getViewMatrix());
                }

                // Fog
                MaterialHelper.BindFogParameters(this._myScene, mesh, this._effect);

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

                this.convertColorToLinearSpaceToRef(this.overloadedAmbient, this._tempColor);
                this._effect.setColor3("vOverloadedAmbient", this._tempColor);
                this.convertColorToLinearSpaceToRef(this.overloadedAlbedo, this._tempColor);
                this._effect.setColor3("vOverloadedAlbedo", this._tempColor);
                this.convertColorToLinearSpaceToRef(this.overloadedReflectivity, this._tempColor);
                this._effect.setColor3("vOverloadedReflectivity", this._tempColor);
                this.convertColorToLinearSpaceToRef(this.overloadedEmissive, this._tempColor);
                this._effect.setColor3("vOverloadedEmissive", this._tempColor);
                this.convertColorToLinearSpaceToRef(this.overloadedReflection, this._tempColor);
                this._effect.setColor3("vOverloadedReflection", this._tempColor);

                this._overloadedMicroSurface.x = this.overloadedMicroSurface;
                this._overloadedMicroSurface.y = this.overloadedMicroSurfaceIntensity;
                this._overloadedMicroSurface.z = this.overloadedReflectionIntensity;
                this._effect.setVector3("vOverloadedMicroSurface", this._overloadedMicroSurface);

                // Log. depth
                MaterialHelper.BindLogDepth(this._defines, this._effect, this._myScene);
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
            
            if (this.cameraColorGradingTexture && this.cameraColorGradingTexture.animations && this.cameraColorGradingTexture.animations.length > 0) {
                results.push(this.cameraColorGradingTexture);
            }

            return results;
        }

        public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void {
            if (forceDisposeTextures) {
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
                
                if (this.cameraColorGradingTexture) {
                    this.cameraColorGradingTexture.dispose();
                }
            }

            super.dispose(forceDisposeEffect, forceDisposeTextures);
        }

        public clone(name: string): PBRMaterial {
            return SerializationHelper.Clone(() => new PBRMaterial(name, this.getScene()), this);
        }

        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.PBRMaterial";
            return serializationObject;
        }

        // Statics
        public static Parse(source: any, scene: Scene, rootUrl: string): PBRMaterial {
            return SerializationHelper.Parse(() => new PBRMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
}