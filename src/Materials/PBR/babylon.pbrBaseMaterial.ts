module BABYLON {
    class PBRMaterialDefines extends MaterialDefines {
        public PBR = true;
        public ALBEDO = false;
        public AMBIENT = false;
        public AMBIENTINGRAYSCALE = false;
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
        public TANGENT = false;
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
        public REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
        public REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
        public INVERTCUBICMAP = false;
        public LOGARITHMICDEPTH = false;
        public CAMERATONEMAP = false;
        public CAMERACONTRAST = false;
        public CAMERACOLORGRADING = false;
        public CAMERACOLORCURVES = false;
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
        public INVERTNORMALMAPX = false;
        public INVERTNORMALMAPY = false;
        public TWOSIDEDLIGHTING = false;
        public SHADOWFLOAT = false;
        public NORMALXYSCALE = true;
        public USERIGHTHANDEDSYSTEM = false;

        public METALLICWORKFLOW = false;
        public METALLICMAP = false;
        public ROUGHNESSSTOREINMETALMAPALPHA = false;
        public ROUGHNESSSTOREINMETALMAPGREEN = false;
        public METALLNESSSTOREINMETALMAPBLUE = false;
        public AOSTOREINMETALMAPRED = false;
        public MICROSURFACEMAP = false;

        public MORPHTARGETS = false;
        public MORPHTARGETS_NORMAL = false;
        public MORPHTARGETS_TANGENT = false;
        public NUM_MORPH_INFLUENCERS = 0;
        
        public ALPHATESTVALUE = 0.4;
        public LDROUTPUT = true;

        constructor() {
            super();
            this.rebuild();
        }

        public reset(): void {
            super.reset();
            this.ALPHATESTVALUE = 0.4;
            this.PBR = true;
        }
    }

    /**
     * The Physically based material base class of BJS.
     * 
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation : 
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    export abstract class PBRBaseMaterial extends BABYLON.PushMaterial {

        /**
         * Intensity of the direct lights e.g. the four lights available in your scene.
         * This impacts both the direct diffuse and specular highlights.
         */
        protected _directIntensity: number = 1.0;
        
        /**
         * Intensity of the emissive part of the material.
         * This helps controlling the emissive effect without modifying the emissive color.
         */
        protected _emissiveIntensity: number = 1.0;
        
        /**
         * Intensity of the environment e.g. how much the environment will light the object
         * either through harmonics for rough material or through the refelction for shiny ones.
         */
        protected _environmentIntensity: number = 1.0;
        
        /**
         * This is a special control allowing the reduction of the specular highlights coming from the 
         * four lights of the scene. Those highlights may not be needed in full environment lighting.
         */
        protected _specularIntensity: number = 1.0;

        private _lightingInfos: Vector4 = new Vector4(this._directIntensity, this._emissiveIntensity, this._environmentIntensity, this._specularIntensity);
        
        /**
         * Debug Control allowing disabling the bump map on this material.
         */
        protected _disableBumpMap: boolean = false;

        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        protected _cameraExposure: number = 1.0;
        
        /**
         * The camera contrast used on this material.
         * This property is here and not in the camera to allow controlling contrast without full screen post process.
         */
        protected _cameraContrast: number = 1.0;
        
        /**
         * Color Grading 2D Lookup Texture.
         * This allows special effects like sepia, black and white to sixties rendering style. 
         */
        protected _cameraColorGradingTexture: BaseTexture = null;
        
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT). 
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image; 
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        protected _cameraColorCurves: ColorCurves = null;
         
        private _cameraInfos: Vector4 = new Vector4(1.0, 1.0, 0.0, 0.0);

        private _microsurfaceTextureLods: Vector2 = new Vector2(0.0, 0.0);

        /**
         * AKA Diffuse Texture in standard nomenclature.
         */
        protected _albedoTexture: BaseTexture;
        
        /**
         * AKA Occlusion Texture in other nomenclature.
         */
        protected _ambientTexture: BaseTexture;

        /**
         * AKA Occlusion Texture Intensity in other nomenclature.
         */
        protected _ambientTextureStrength: number = 1.0;

        protected _opacityTexture: BaseTexture;

        protected _reflectionTexture: BaseTexture;

        protected _emissiveTexture: BaseTexture;
        
        /**
         * AKA Specular texture in other nomenclature.
         */
        protected _reflectivityTexture: BaseTexture;

        /**
         * Used to switch from specular/glossiness to metallic/roughness workflow.
         */
        protected _metallicTexture: BaseTexture;

        /**
         * Specifies the metallic scalar of the metallic/roughness workflow.
         * Can also be used to scale the metalness values of the metallic texture.
         */
        protected _metallic: number;

        /**
         * Specifies the roughness scalar of the metallic/roughness workflow.
         * Can also be used to scale the roughness values of the metallic texture.
         */
        protected _roughness: number;

        /**
         * Used to enable roughness/glossiness fetch from a separate chanel depending on the current mode.
         * Gray Scale represents roughness in metallic mode and glossiness in specular mode.
         */
        protected _microSurfaceTexture: BaseTexture;

        protected _bumpTexture: BaseTexture;

        protected _lightmapTexture: BaseTexture;

        protected _refractionTexture: BaseTexture;

        protected _ambientColor = new Color3(0, 0, 0);

        /**
         * AKA Diffuse Color in other nomenclature.
         */
        protected _albedoColor = new Color3(1, 1, 1);
        
        /**
         * AKA Specular Color in other nomenclature.
         */
        protected _reflectivityColor = new Color3(1, 1, 1);

        protected _reflectionColor = new Color3(0.0, 0.0, 0.0);

        protected _emissiveColor = new Color3(0, 0, 0);
        
        /**
         * AKA Glossiness in other nomenclature.
         */
        protected _microSurface = 0.9;

        /**
         * source material index of refraction (IOR)' / 'destination material IOR.
         */
        protected _indexOfRefraction = 0.66;
        
        /**
         * Controls if refraction needs to be inverted on Y. This could be usefull for procedural texture.
         */
        protected _invertRefractionY = false;

        protected _opacityFresnelParameters: FresnelParameters;

        protected _emissiveFresnelParameters: FresnelParameters;

        /**
         * This parameters will make the material used its opacity to control how much it is refracting aginst not.
         * Materials half opaque for instance using refraction could benefit from this control.
         */
        protected _linkRefractionWithTransparency = false;

        protected _useLightmapAsShadowmap = false;
        
        /**
         * In this mode, the emissive informtaion will always be added to the lighting once.
         * A light for instance can be thought as emissive.
         */
        protected _useEmissiveAsIllumination = false;
        
        /**
         * Secifies that the alpha is coming form the albedo channel alpha channel.
         */
        protected _useAlphaFromAlbedoTexture = false;
        
        /**
         * Specifies that the material will keeps the specular highlights over a transparent surface (only the most limunous ones).
         * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
         */
        protected _useSpecularOverAlpha = true;
        
        /**
         * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
         */
        protected _useMicroSurfaceFromReflectivityMapAlpha = false;

        /**
         * Specifies if the metallic texture contains the roughness information in its alpha channel.
         */
        protected _useRoughnessFromMetallicTextureAlpha = true;

        /**
         * Specifies if the metallic texture contains the roughness information in its green channel.
         */
        protected _useRoughnessFromMetallicTextureGreen = false;

        /**
         * Specifies if the metallic texture contains the metallness information in its blue channel.
         */
        protected _useMetallnessFromMetallicTextureBlue = false;

        /**
         * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
         */
        protected _useAmbientOcclusionFromMetallicTextureRed = false;

        /**
         * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
         */
        protected _useAmbientInGrayScale = false;
        
        /**
         * In case the reflectivity map does not contain the microsurface information in its alpha channel,
         * The material will try to infer what glossiness each pixel should be.
         */
        protected _useAutoMicroSurfaceFromReflectivityMap = false;
        
        /**
         * Allows to work with scalar in linear mode. This is definitely a matter of preferences and tools used during
         * the creation of the material.
         */
        protected _useScalarInLinearSpace = false;
        
        /**
         * BJS is using an harcoded light falloff based on a manually sets up range.
         * In PBR, one way to represents the fallof is to use the inverse squared root algorythm.
         * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
         */
        protected _usePhysicalLightFalloff = true;
        
        /**
         * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most limunous ones).
         * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
         */
        protected _useRadianceOverAlpha = true;
        
        /**
         * Allows using the bump map in parallax mode.
         */
        protected _useParallax = false;

        /**
         * Allows using the bump map in parallax occlusion mode.
         */
        protected _useParallaxOcclusion = false;

        /**
         * Controls the scale bias of the parallax mode.
         */
        protected _parallaxScaleBias = 0.05;
        
        /**
         * If sets to true, disables all the lights affecting the material.
         */
        protected _disableLighting = false;

        /**
         * Number of Simultaneous lights allowed on the material.
         */
        protected _maxSimultaneousLights = 4;  

        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        protected _invertNormalMapX = false;

        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        protected _invertNormalMapY = false;

        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        protected _twoSidedLighting = false;

        /**
         * Defines the alpha limits in alpha test mode.
         */
        protected _alphaCutOff = 0.4;

        /**
         * Enforces alpha test in opaque or blend mode in order to improve the performances of some situations.
         */
        protected _forceAlphaTest = false;

        /**
         * If false, it allows the output of the shader to be in hdr space (e.g. more than one) which is useful
         * in combination of post process in float or half float mode.
         */
        protected _ldrOutput = true;

        private _renderTargets = new SmartArray<RenderTargetTexture>(16);
        private _worldViewProjectionMatrix = Matrix.Zero();
        private _globalAmbientColor = new Color3(0, 0, 0);
        private _tempColor = new Color3();
        private _renderId: number;
        private _useLogarithmicDepth: boolean;

        /**
         * Instantiates a new PBRMaterial instance.
         * 
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        constructor(name: string, scene: Scene) {
            super(name, scene);

            this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
                this._renderTargets.reset();

                if (StandardMaterial.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                    this._renderTargets.push(this._reflectionTexture);
                }

                if (StandardMaterial.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget) {
                    this._renderTargets.push(this._refractionTexture);
                }

                return this._renderTargets;
            }
        }

        public abstract getClassName(): string;

        @serialize()
        public get useLogarithmicDepth(): boolean {
            return this._useLogarithmicDepth;
        }

        public set useLogarithmicDepth(value: boolean) {
            this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
        }

        public needAlphaBlending(): boolean {
            if (this._linkRefractionWithTransparency) {
                return false;
            }
            return (this.alpha < 1.0) || (this._opacityTexture != null) || this._shouldUseAlphaFromAlbedoTexture() || this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled;
        }

        public needAlphaTesting(): boolean {
            if (this._linkRefractionWithTransparency) {
                return false;
            }
            return this._albedoTexture != null && this._albedoTexture.hasAlpha;
        }

        protected _shouldUseAlphaFromAlbedoTexture(): boolean {
            return this._albedoTexture != null && this._albedoTexture.hasAlpha && this._useAlphaFromAlbedoTexture;
        }

        public getAlphaTestTexture(): BaseTexture {
            return this._albedoTexture;
        }

        private convertColorToLinearSpaceToRef(color: Color3, ref: Color3): void {
            PBRMaterial.convertColorToLinearSpaceToRef(color, ref, this._useScalarInLinearSpace);
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
            for (var light of mesh._lightSources) {
                let useUbo = light._uniformBuffer.useUbo;
                let scaledIntensity = light.getScaledIntensity();

                light._uniformBuffer.bindToEffect(effect, "Light" + lightIndex);
                MaterialHelper.BindLightProperties(light, effect, lightIndex);

                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(light.diffuse, PBRMaterial._scaledAlbedo, useScalarInLinearSpace);

                PBRMaterial._scaledAlbedo.scaleToRef(scaledIntensity, PBRMaterial._scaledAlbedo);
                light._uniformBuffer.updateColor4(useUbo ? "vLightDiffuse" : "vLightDiffuse" + lightIndex, PBRMaterial._scaledAlbedo, usePhysicalLightFalloff ? light.radius : light.range);

                if (defines["SPECULARTERM"]) {
                    this.convertColorToLinearSpaceToRef(light.specular, PBRMaterial._scaledReflectivity, useScalarInLinearSpace);

                    PBRMaterial._scaledReflectivity.scaleToRef(scaledIntensity, PBRMaterial._scaledReflectivity);
                    light._uniformBuffer.updateColor3(useUbo ? "vLightSpecular" : "vLightSpecular" + lightIndex, PBRMaterial._scaledReflectivity);
                }

                // Shadows
                if (scene.shadowsEnabled) {
                    MaterialHelper.BindLightShadow(light, scene, mesh, lightIndex + "", effect);
                }

                light._uniformBuffer.update();

                lightIndex++;

                if (lightIndex === maxSimultaneousLights)
                    break;
            }
        }

        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean { 
            if (this.isFrozen) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }

            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new PBRMaterialDefines();
            }

            var scene = this.getScene();
            var defines = <PBRMaterialDefines>subMesh._materialDefines;
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (defines._renderId === scene.getRenderId()) {
                    return true;
                }
            }

            var engine = scene.getEngine();
            
            // Lights
            MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
            defines._needNormals = true;

            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (scene.getEngine().getCaps().textureLOD) {
                        defines.LODBASEDMICROSFURACE = true;
                    }

                    defines.LDROUTPUT = this._ldrOutput;

                    if (this._albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                        if (!this._albedoTexture.isReadyOrNotBlocking()) {
                            return false;
                        }

                        defines._needUVs = true;
                        defines.ALBEDO = true;
                    }

                    if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                        if (!this._ambientTexture.isReadyOrNotBlocking()) {
                            return false;
                        }

                        defines._needUVs = true;
                        defines.AMBIENT = true;
                        defines.AMBIENTINGRAYSCALE = this._useAmbientInGrayScale;
                    }

                    if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                        if (!this._opacityTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        
                        defines._needUVs = true;
                        defines.OPACITY = true;

                        if (this._opacityTexture.getAlphaFromRGB) {
                            defines.OPACITYRGB = true;
                        }
                    }

                    var reflectionTexture = this._reflectionTexture || scene.environmentTexture;
                    if (reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                        if (!reflectionTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        
                        defines.REFLECTION = true;

                        if (reflectionTexture.coordinatesMode === Texture.INVCUBIC_MODE) {
                            defines.INVERTCUBICMAP = true;
                        }

                        defines.REFLECTIONMAP_3D = reflectionTexture.isCube;

                        switch (reflectionTexture.coordinatesMode) {
                            case Texture.CUBIC_MODE:
                            case Texture.INVCUBIC_MODE:
                                defines.REFLECTIONMAP_CUBIC = true;
                                break;
                            case Texture.EXPLICIT_MODE:
                                defines.REFLECTIONMAP_EXPLICIT = true;
                                break;
                            case Texture.PLANAR_MODE:
                                defines.REFLECTIONMAP_PLANAR = true;
                                break;
                            case Texture.PROJECTION_MODE:
                                defines.REFLECTIONMAP_PROJECTION = true;
                                break;
                            case Texture.SKYBOX_MODE:
                                defines.REFLECTIONMAP_SKYBOX = true;
                                break;
                            case Texture.SPHERICAL_MODE:
                                defines.REFLECTIONMAP_SPHERICAL = true;
                                break;
                            case Texture.EQUIRECTANGULAR_MODE:
                                defines.REFLECTIONMAP_EQUIRECTANGULAR = true;
                                break;
                            case Texture.FIXED_EQUIRECTANGULAR_MODE:
                                defines.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = true;
                                break;
                            case Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                                defines.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = true;
                                break;                                
                        }

                        if (reflectionTexture instanceof HDRCubeTexture && (<HDRCubeTexture>reflectionTexture)) {
                            defines.USESPHERICALFROMREFLECTIONMAP = true;

                            if ((<HDRCubeTexture>reflectionTexture).isPMREM) {
                                defines.USEPMREMREFLECTION = true;
                            }
                        }
                    }

                    if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                        if (!this._lightmapTexture.isReadyOrNotBlocking()) {
                            return false;
                        }

                        defines._needUVs = true;
                        defines.LIGHTMAP = true;
                        defines.USELIGHTMAPASSHADOWMAP = this._useLightmapAsShadowmap;
                    }

                    if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                        if (!this._emissiveTexture.isReadyOrNotBlocking()) {
                            return false;
                        }

                        defines._needUVs = true;
                        defines.EMISSIVE = true;
                    }

                    if (StandardMaterial.SpecularTextureEnabled) {
                        if (this._metallicTexture) {
                            if (!this._metallicTexture.isReadyOrNotBlocking()) {
                                return false;
                            }

                            defines._needUVs = true;
                            defines.METALLICWORKFLOW = true;
                            defines.METALLICMAP = true;
                            defines.ROUGHNESSSTOREINMETALMAPALPHA = this._useRoughnessFromMetallicTextureAlpha;
                            defines.ROUGHNESSSTOREINMETALMAPGREEN = !this._useRoughnessFromMetallicTextureAlpha && this._useRoughnessFromMetallicTextureGreen;
                            defines.METALLNESSSTOREINMETALMAPBLUE = this._useMetallnessFromMetallicTextureBlue;
                            defines.AOSTOREINMETALMAPRED = this._useAmbientOcclusionFromMetallicTextureRed;
                        }
                        else if (this._reflectivityTexture) {
                            if (!this._reflectivityTexture.isReadyOrNotBlocking()) {
                                return false;
                            }

                            defines._needUVs = true;
                            defines.REFLECTIVITY = true;
                            defines.MICROSURFACEFROMREFLECTIVITYMAP = this._useMicroSurfaceFromReflectivityMapAlpha;
                            defines.MICROSURFACEAUTOMATIC = this._useAutoMicroSurfaceFromReflectivityMap;
                        }

                        if (this._microSurfaceTexture) {
                            if (!this._microSurfaceTexture.isReadyOrNotBlocking()) {
                                return false;
                            }

                            defines._needUVs = true;
                            defines.MICROSURFACEMAP = true;
                        }
                    }

                    if (scene.getEngine().getCaps().standardDerivatives && this._bumpTexture && StandardMaterial.BumpTextureEnabled && !this._disableBumpMap) {
                        // Bump texure can not be none blocking.
                        if (!this._bumpTexture.isReady()) {
                            return false;
                        }
                        
                        defines._needUVs = true;
                        defines.BUMP = true;

                        if (this._useParallax && this._albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                            defines.PARALLAX = true;
                            if (this._useParallaxOcclusion) {
                                defines.PARALLAXOCCLUSION = true;
                            }
                        }

                        if (this._invertNormalMapX) {
                            defines.INVERTNORMALMAPX = true;
                        }

                        if (this._invertNormalMapY) {
                            defines.INVERTNORMALMAPY = true;
                        }

                        if (scene._mirroredCameraPosition) {
                            defines.INVERTNORMALMAPX = !defines.INVERTNORMALMAPX;
                            defines.INVERTNORMALMAPY = !defines.INVERTNORMALMAPY;
                        }

                        defines.USERIGHTHANDEDSYSTEM = scene.useRightHandedSystem;
                    }

                    if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        if (!this._refractionTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        
                        defines._needUVs = true;
                        defines.REFRACTION = true;
                        defines.REFRACTIONMAP_3D = this._refractionTexture.isCube;

                        if (this._linkRefractionWithTransparency) {
                            defines.LINKREFRACTIONTOTRANSPARENCY = true;
                        }
                        if (this._refractionTexture instanceof HDRCubeTexture) {
                            defines.REFRACTIONMAPINLINEARSPACE = true;

                            if ((<HDRCubeTexture>this._refractionTexture).isPMREM) {
                                defines.USEPMREMREFRACTION = true;
                            }
                        }
                    }
                
                    if (this._cameraColorGradingTexture && StandardMaterial.ColorGradingTextureEnabled) {
                        // Color Grading texure can not be none blocking.
                        if (!this._cameraColorGradingTexture.isReady()) {
                            return false;
                        }
                        
                        defines.CAMERACOLORGRADING = true;
                    }

                    if (!this.backFaceCulling && this._twoSidedLighting) {
                        defines.TWOSIDEDLIGHTING = true;
                    }

                    if (this._shouldUseAlphaFromAlbedoTexture()) {
                        defines.ALPHAFROMALBEDO = true;
                    }

                    if (this._useEmissiveAsIllumination) {
                        defines.EMISSIVEASILLUMINATION = true;
                    }

                    if (this._cameraContrast != 1) {
                        defines.CAMERACONTRAST = true;
                    }

                    if (this._cameraExposure != 1) {
                        defines.CAMERATONEMAP = true;
                    }
                    
                    if (this._cameraColorCurves) {
                        defines.CAMERACOLORCURVES = true;
                    }

                    if (this._useSpecularOverAlpha) {
                        defines.SPECULAROVERALPHA = true;
                    }

                    if (this._usePhysicalLightFalloff) {
                        defines.USEPHYSICALLIGHTFALLOFF = true;
                    }

                    if (this._useRadianceOverAlpha) {
                        defines.RADIANCEOVERALPHA = true;
                    }

                    if ((this._metallic !== undefined && this._metallic !== null) || (this._roughness !== undefined && this._roughness !== null)) {
                        defines.METALLICWORKFLOW = true;
                    }   

                    defines.ALPHATESTVALUE = this._alphaCutOff;                 
                }
            }

            if (defines._areFresnelDirty) {
                if (StandardMaterial.FresnelEnabled) {
                    // Fresnel
                    if (this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled ||
                        this._emissiveFresnelParameters && this._emissiveFresnelParameters.isEnabled) {

                        if (this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled) {
                            defines.OPACITYFRESNEL = true;
                        }

                        if (this._emissiveFresnelParameters && this._emissiveFresnelParameters.isEnabled) {
                            defines.EMISSIVEFRESNEL = true;
                        }

                        defines.FRESNEL = true;
                    }
                }
            }            

            // Misc.
            MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, defines);

            // Values that need to be evaluated on every frame
            MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances, this._forceAlphaTest);

             // Attribs
            if (MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true, true)) {
                if (mesh) {
                    if (!scene.getEngine().getCaps().standardDerivatives && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                        mesh.createNormals(true);
                        Tools.Warn("PBRMaterial: Normals have been created for the mesh: " + mesh.name);
                    }
                }
            }

            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();

                // Fallbacks
                var fallbacks = new EffectFallbacks();
                if (defines.REFLECTION) {
                    fallbacks.addFallback(0, "REFLECTION");
                }

                if (defines.REFRACTION) {
                    fallbacks.addFallback(0, "REFRACTION");
                }

                if (defines.REFLECTIVITY) {
                    fallbacks.addFallback(0, "REFLECTIVITY");
                }

                if (defines.BUMP) {
                    fallbacks.addFallback(0, "BUMP");
                }

                if (defines.PARALLAX) {
                    fallbacks.addFallback(1, "PARALLAX");
                }

                if (defines.PARALLAXOCCLUSION) {
                    fallbacks.addFallback(0, "PARALLAXOCCLUSION");
                }

                if (defines.SPECULAROVERALPHA) {
                    fallbacks.addFallback(0, "SPECULAROVERALPHA");
                }

                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }

                if (defines.POINTSIZE) {
                    fallbacks.addFallback(0, "POINTSIZE");
                }

                if (defines.LOGARITHMICDEPTH) {
                    fallbacks.addFallback(0, "LOGARITHMICDEPTH");
                }

                MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this._maxSimultaneousLights);

                if (defines.SPECULARTERM) {
                    fallbacks.addFallback(0, "SPECULARTERM");
                }

                if (defines.OPACITYFRESNEL) {
                    fallbacks.addFallback(1, "OPACITYFRESNEL");
                }

                if (defines.EMISSIVEFRESNEL) {
                    fallbacks.addFallback(2, "EMISSIVEFRESNEL");
                }

                if (defines.FRESNEL) {
                    fallbacks.addFallback(3, "FRESNEL");
                }

                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }

                //Attributes
                var attribs = [VertexBuffer.PositionKind];

                if (defines.NORMAL) {
                    attribs.push(VertexBuffer.NormalKind);
                }

                if (defines.TANGENT) {
                    attribs.push(VertexBuffer.TangentKind);
                }

                if (defines.UV1) {
                    attribs.push(VertexBuffer.UVKind);
                }

                if (defines.UV2) {
                    attribs.push(VertexBuffer.UV2Kind);
                }

                if (defines.VERTEXCOLOR) {
                    attribs.push(VertexBuffer.ColorKind);
                }

                MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                MaterialHelper.PrepareAttributesForInstances(attribs, defines);
                MaterialHelper.PrepareAttributesForMorphTargets(attribs, mesh, defines);

                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vAlbedoColor", "vReflectivityColor", "vEmissiveColor", "vReflectionColor",
                        "vFogInfos", "vFogColor", "pointSize",
                        "vAlbedoInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vReflectivityInfos", "vMicroSurfaceSamplerInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                        "mBones",
                        "vClipPlane", "albedoMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "reflectivityMatrix", "microSurfaceSamplerMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                        "opacityParts", "emissiveLeftColor", "emissiveRightColor",
                        "vLightingIntensity",
                        "logarithmicDepthConstant",
                        "vSphericalX", "vSphericalY", "vSphericalZ",
                        "vSphericalXX", "vSphericalYY", "vSphericalZZ",
                        "vSphericalXY", "vSphericalYZ", "vSphericalZX",
                        "vMicrosurfaceTextureLods",
                        "vCameraInfos"
                ];

                var samplers = ["albedoSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "reflectivitySampler", "microSurfaceSampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler"];
                var uniformBuffers = ["Material", "Scene"];

                if (defines.CAMERACOLORCURVES) {
                    ColorCurves.PrepareUniforms(uniforms);
                }
                if (defines.CAMERACOLORGRADING) {
                    ColorGradingTexture.PrepareUniformsAndSamplers(uniforms, samplers);
                }
                MaterialHelper.PrepareUniformsAndSamplersList(<EffectCreationOptions>{
                    uniformsNames: uniforms, 
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers, 
                    defines: defines, 
                    maxSimultaneousLights: this._maxSimultaneousLights
                });

                var onCompiled = function(effect) {
                    if (this.onCompiled) {
                        this.onCompiled(effect);
                    }

                    this.bindSceneUniformBuffer(effect, scene.getSceneUniformBuffer());
                }.bind(this);


                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect("pbr", <EffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights, maxSimultaneousMorphTargets: defines.NUM_MORPH_INFLUENCERS }
                }, engine), defines);
                
                this.buildUniformLayout();
            }

            if (!subMesh.effect.isReady()) {
                return false;
            }

            defines._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }

        public buildUniformLayout(): void {
            // Order is important !
            this._uniformBuffer.addUniform("vAlbedoInfos", 2);
            this._uniformBuffer.addUniform("vAmbientInfos", 3);
            this._uniformBuffer.addUniform("vOpacityInfos", 2);
            this._uniformBuffer.addUniform("vEmissiveInfos", 2);
            this._uniformBuffer.addUniform("vLightmapInfos", 2);
            this._uniformBuffer.addUniform("vReflectivityInfos", 3);
            this._uniformBuffer.addUniform("vMicroSurfaceSamplerInfos", 2);
            this._uniformBuffer.addUniform("vRefractionInfos", 4);
            this._uniformBuffer.addUniform("vReflectionInfos", 2);
            this._uniformBuffer.addUniform("vBumpInfos", 3);
            this._uniformBuffer.addUniform("albedoMatrix", 16);
            this._uniformBuffer.addUniform("ambientMatrix", 16);
            this._uniformBuffer.addUniform("opacityMatrix", 16);
            this._uniformBuffer.addUniform("emissiveMatrix", 16);
            this._uniformBuffer.addUniform("lightmapMatrix", 16);
            this._uniformBuffer.addUniform("reflectivityMatrix", 16);
            this._uniformBuffer.addUniform("microSurfaceSamplerMatrix", 16);
            this._uniformBuffer.addUniform("bumpMatrix", 16);
            this._uniformBuffer.addUniform("refractionMatrix", 16);
            this._uniformBuffer.addUniform("reflectionMatrix", 16);

            this._uniformBuffer.addUniform("vReflectionColor", 3);
            this._uniformBuffer.addUniform("vAlbedoColor", 4);
            this._uniformBuffer.addUniform("vLightingIntensity", 4);

            this._uniformBuffer.addUniform("vMicrosurfaceTextureLods", 2);
            this._uniformBuffer.addUniform("vReflectivityColor", 4);
            this._uniformBuffer.addUniform("vEmissiveColor", 3);
            this._uniformBuffer.addUniform("opacityParts", 4);
            this._uniformBuffer.addUniform("emissiveLeftColor", 4);
            this._uniformBuffer.addUniform("emissiveRightColor", 4);

            this._uniformBuffer.addUniform("pointSize", 1);
            this._uniformBuffer.create();
        }


        public unbind(): void {
            if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("reflection2DSampler", null);
            }

            if (this._refractionTexture && this._refractionTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("refraction2DSampler", null);
            }

            super.unbind();
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
            this._activeEffect.setMatrix("world", world);
        }

        public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
            var scene = this.getScene();

            var defines = <PBRMaterialDefines>subMesh._materialDefines;
            if (!defines) {
                return;
            }

            var effect = subMesh.effect;
            this._activeEffect = effect;

            // Matrices        
            this.bindOnlyWorldMatrix(world);

            // Bones
            MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

            if (this._mustRebind(scene, effect, mesh.visibility)) {
                this._uniformBuffer.bindToEffect(effect, "Material");

                this.bindViewProjection(effect);

                if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync) {

                    // Fresnel
                    if (StandardMaterial.FresnelEnabled) {
                        if (this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("opacityParts", new Color3(this._opacityFresnelParameters.leftColor.toLuminance(), this._opacityFresnelParameters.rightColor.toLuminance(), this._opacityFresnelParameters.bias), this._opacityFresnelParameters.power);
                        }

                        if (this._emissiveFresnelParameters && this._emissiveFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("emissiveLeftColor", this._emissiveFresnelParameters.leftColor, this._emissiveFresnelParameters.power);
                            this._uniformBuffer.updateColor4("emissiveRightColor", this._emissiveFresnelParameters.rightColor, this._emissiveFresnelParameters.bias);
                        }
                    }

                    // Texture uniforms      
                    if (scene.texturesEnabled) {
                        if (this._albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vAlbedoInfos", this._albedoTexture.coordinatesIndex, this._albedoTexture.level);
                            this._uniformBuffer.updateMatrix("albedoMatrix", this._albedoTexture.getTextureMatrix());
                        }

                        if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                            this._uniformBuffer.updateFloat3("vAmbientInfos", this._ambientTexture.coordinatesIndex, this._ambientTexture.level, this._ambientTextureStrength);
                            this._uniformBuffer.updateMatrix("ambientMatrix", this._ambientTexture.getTextureMatrix());
                        }

                        if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                            this._uniformBuffer.updateMatrix("opacityMatrix", this._opacityTexture.getTextureMatrix());
                        }

                        var reflectionTexture = this._reflectionTexture || scene.environmentTexture;;
                        if (reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                            this._microsurfaceTextureLods.x = Math.round(Math.log(reflectionTexture.getSize().width) * Math.LOG2E);
                            this._uniformBuffer.updateMatrix("reflectionMatrix", reflectionTexture.getReflectionTextureMatrix());
                            this._uniformBuffer.updateFloat2("vReflectionInfos", reflectionTexture.level, 0);

                            if (defines.USESPHERICALFROMREFLECTIONMAP) {
                                this._activeEffect.setFloat3("vSphericalX", (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.x.x,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.x.y,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.x.z);
                                this._activeEffect.setFloat3("vSphericalY", (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.y.x,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.y.y,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.y.z);
                                this._activeEffect.setFloat3("vSphericalZ", (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.z.x,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.z.y,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.z.z);
                                this._activeEffect.setFloat3("vSphericalXX", (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.xx.x,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.xx.y,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.xx.z);
                                this._activeEffect.setFloat3("vSphericalYY", (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.yy.x,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.yy.y,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.yy.z);
                                this._activeEffect.setFloat3("vSphericalZZ", (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.zz.x,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.zz.y,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.zz.z);
                                this._activeEffect.setFloat3("vSphericalXY", (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.xy.x,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.xy.y,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.xy.z);
                                this._activeEffect.setFloat3("vSphericalYZ", (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.yz.x,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.yz.y,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.yz.z);
                                this._activeEffect.setFloat3("vSphericalZX", (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.zx.x,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.zx.y,
                                    (<HDRCubeTexture>reflectionTexture).sphericalPolynomial.zx.z);
                            }
                        }

                        if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vEmissiveInfos", this._emissiveTexture.coordinatesIndex, this._emissiveTexture.level);
                            this._uniformBuffer.updateMatrix("emissiveMatrix", this._emissiveTexture.getTextureMatrix());
                        }

                        if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vLightmapInfos", this._lightmapTexture.coordinatesIndex, this._lightmapTexture.level);
                            this._uniformBuffer.updateMatrix("lightmapMatrix", this._lightmapTexture.getTextureMatrix());
                        }

                        if (StandardMaterial.SpecularTextureEnabled) {
                            if (this._metallicTexture) {
                                this._uniformBuffer.updateFloat3("vReflectivityInfos", this._metallicTexture.coordinatesIndex, this._metallicTexture.level, this._ambientTextureStrength);
                                this._uniformBuffer.updateMatrix("reflectivityMatrix", this._metallicTexture.getTextureMatrix());
                            }
                            else if (this._reflectivityTexture) {
                                this._uniformBuffer.updateFloat3("vReflectivityInfos", this._reflectivityTexture.coordinatesIndex, this._reflectivityTexture.level, 1.0);
                                this._uniformBuffer.updateMatrix("reflectivityMatrix", this._reflectivityTexture.getTextureMatrix());
                            }

                            if (this._microSurfaceTexture) {
                                this._uniformBuffer.updateFloat2("vMicroSurfaceSamplerInfos", this._microSurfaceTexture.coordinatesIndex, this._microSurfaceTexture.level);
                                this._uniformBuffer.updateMatrix("microSurfaceSamplerMatrix", this._microSurfaceTexture.getTextureMatrix());
                            }
                        }

                        if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled && !this._disableBumpMap) {
                            this._uniformBuffer.updateFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, this._bumpTexture.level, this._parallaxScaleBias);
                            this._uniformBuffer.updateMatrix("bumpMatrix", this._bumpTexture.getTextureMatrix());
                        }

                        if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                            this._microsurfaceTextureLods.y = Math.round(Math.log(this._refractionTexture.getSize().width) * Math.LOG2E);

                            var depth = 1.0;
                            if (!this._refractionTexture.isCube) {
                                this._uniformBuffer.updateMatrix("refractionMatrix", this._refractionTexture.getReflectionTextureMatrix());

                                if ((<any>this._refractionTexture).depth) {
                                    depth = (<any>this._refractionTexture).depth;
                                }
                            }
                            this._uniformBuffer.updateFloat4("vRefractionInfos", this._refractionTexture.level, this._indexOfRefraction, depth, this._invertRefractionY ? -1 : 1);
                        }

                        if ((reflectionTexture || this._refractionTexture)) {
                            this._uniformBuffer.updateFloat2("vMicrosurfaceTextureLods", this._microsurfaceTextureLods.x, this._microsurfaceTextureLods.y);
                        }
                    }

                    // Point size
                    if (this.pointsCloud) {
                        this._uniformBuffer.updateFloat("pointSize", this.pointSize);
                    }

                    // Colors
                    if (defines.METALLICWORKFLOW) {
                        PBRMaterial._scaledReflectivity.r = (this._metallic === undefined || this._metallic === null) ? 1 : this._metallic;
                        PBRMaterial._scaledReflectivity.g = (this._roughness === undefined || this._roughness === null) ? 1 : this._roughness;
                        this._uniformBuffer.updateColor4("vReflectivityColor", PBRMaterial._scaledReflectivity, 0);
                    }
                    else {
                        // GAMMA CORRECTION.
                        this.convertColorToLinearSpaceToRef(this._reflectivityColor, PBRMaterial._scaledReflectivity);
                        this._uniformBuffer.updateColor4("vReflectivityColor", PBRMaterial._scaledReflectivity, this._microSurface);
                    }

                    // GAMMA CORRECTION.
                    this.convertColorToLinearSpaceToRef(this._emissiveColor, PBRMaterial._scaledEmissive);
                    this._uniformBuffer.updateColor3("vEmissiveColor", PBRMaterial._scaledEmissive);

                    // GAMMA CORRECTION.
                    this.convertColorToLinearSpaceToRef(this._reflectionColor, PBRMaterial._scaledReflection);
                    this._uniformBuffer.updateColor3("vReflectionColor", PBRMaterial._scaledReflection);

                    // GAMMA CORRECTION.
                    this.convertColorToLinearSpaceToRef(this._albedoColor, PBRMaterial._scaledAlbedo);
                    this._uniformBuffer.updateColor4("vAlbedoColor", PBRMaterial._scaledAlbedo, this.alpha * mesh.visibility);


                    // Misc
                    this._lightingInfos.x = this._directIntensity;
                    this._lightingInfos.y = this._emissiveIntensity;
                    this._lightingInfos.z = this._environmentIntensity;
                    this._lightingInfos.w = this._specularIntensity;

                    this._uniformBuffer.updateVector4("vLightingIntensity", this._lightingInfos);
                }

                // Textures        
                if (scene.texturesEnabled) {
                    if (this._albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                        this._uniformBuffer.setTexture("albedoSampler", this._albedoTexture);
                    }

                    if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                        this._uniformBuffer.setTexture("ambientSampler", this._ambientTexture);
                    }

                    if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                        this._uniformBuffer.setTexture("opacitySampler", this._opacityTexture);
                    }

                    if (reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                        if (reflectionTexture.isCube) {
                            this._uniformBuffer.setTexture("reflectionCubeSampler", reflectionTexture);
                        } else {
                            this._uniformBuffer.setTexture("reflection2DSampler", reflectionTexture);
                        }
                    }

                    if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                        this._uniformBuffer.setTexture("emissiveSampler", this._emissiveTexture);
                    }

                    if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                        this._uniformBuffer.setTexture("lightmapSampler", this._lightmapTexture);
                    }

                    if (StandardMaterial.SpecularTextureEnabled) {
                        if (this._metallicTexture) {
                            this._uniformBuffer.setTexture("reflectivitySampler", this._metallicTexture);
                        }
                        else if (this._reflectivityTexture) {
                            this._uniformBuffer.setTexture("reflectivitySampler", this._reflectivityTexture);
                        }

                        if (this._microSurfaceTexture) {
                            this._uniformBuffer.setTexture("microSurfaceSampler", this._microSurfaceTexture);
                        }
                    }

                    if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled && !this._disableBumpMap) {
                        this._uniformBuffer.setTexture("bumpSampler", this._bumpTexture);
                    }

                    if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        if (this._refractionTexture.isCube) {
                            this._uniformBuffer.setTexture("refractionCubeSampler", this._refractionTexture);
                        } else {
                            this._uniformBuffer.setTexture("refraction2DSampler", this._refractionTexture);
                        }
                    }

                    if (this._cameraColorGradingTexture && StandardMaterial.ColorGradingTextureEnabled) {
                        ColorGradingTexture.Bind(this._cameraColorGradingTexture, this._activeEffect);
                    }
                }

                // Clip plane
                MaterialHelper.BindClipPlane(this._activeEffect, scene);

                // Colors
                scene.ambientColor.multiplyToRef(this._ambientColor, this._globalAmbientColor);

                effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
                effect.setColor3("vAmbientColor", this._globalAmbientColor);
            }

            if (this._mustRebind(scene, effect) || !this.isFrozen) {
                // Lights
                if (scene.lightsEnabled && !this._disableLighting) {
                    PBRMaterial.BindLights(scene, mesh, this._activeEffect, defines, this._useScalarInLinearSpace, this._maxSimultaneousLights, this._usePhysicalLightFalloff);
                }

                // View
                if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE || reflectionTexture) {
                    this.bindView(effect);
                }

                // Fog
                MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

                // Morph targets
                if (defines.NUM_MORPH_INFLUENCERS) {
                    MaterialHelper.BindMorphTargetParameters(mesh, this._activeEffect);
                }

                this._cameraInfos.x = this._cameraExposure;
                this._cameraInfos.y = this._cameraContrast;
                effect.setVector4("vCameraInfos", this._cameraInfos);
                
                if (this._cameraColorCurves) {
                    ColorCurves.Bind(this._cameraColorCurves, this._activeEffect);
                }

                // Log. depth
                MaterialHelper.BindLogDepth(defines, this._activeEffect, scene);
            }

            this._uniformBuffer.update();

            this._afterBind(mesh);

            scene = null;
        }

        public getAnimatables(): IAnimatable[] {
            var results = [];

            if (this._albedoTexture && this._albedoTexture.animations && this._albedoTexture.animations.length > 0) {
                results.push(this._albedoTexture);
            }

            if (this._ambientTexture && this._ambientTexture.animations && this._ambientTexture.animations.length > 0) {
                results.push(this._ambientTexture);
            }

            if (this._opacityTexture && this._opacityTexture.animations && this._opacityTexture.animations.length > 0) {
                results.push(this._opacityTexture);
            }

            if (this._reflectionTexture && this._reflectionTexture.animations && this._reflectionTexture.animations.length > 0) {
                results.push(this._reflectionTexture);
            }

            if (this._emissiveTexture && this._emissiveTexture.animations && this._emissiveTexture.animations.length > 0) {
                results.push(this._emissiveTexture);
            }

            if (this._metallicTexture && this._metallicTexture.animations && this._metallicTexture.animations.length > 0) {
                results.push(this._metallicTexture);
            }
            else if (this._reflectivityTexture && this._reflectivityTexture.animations && this._reflectivityTexture.animations.length > 0) {
                results.push(this._reflectivityTexture);
            }

            if (this._bumpTexture && this._bumpTexture.animations && this._bumpTexture.animations.length > 0) {
                results.push(this._bumpTexture);
            }

            if (this._lightmapTexture && this._lightmapTexture.animations && this._lightmapTexture.animations.length > 0) {
                results.push(this._lightmapTexture);
            }

            if (this._refractionTexture && this._refractionTexture.animations && this._refractionTexture.animations.length > 0) {
                results.push(this._refractionTexture);
            }
            
            if (this._cameraColorGradingTexture && this._cameraColorGradingTexture.animations && this._cameraColorGradingTexture.animations.length > 0) {
                results.push(this._cameraColorGradingTexture);
            }

            return results;
        }

        public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void {
            if (forceDisposeTextures) {
                if (this._albedoTexture) {
                    this._albedoTexture.dispose();
                }

                if (this._ambientTexture) {
                    this._ambientTexture.dispose();
                }

                if (this._opacityTexture) {
                    this._opacityTexture.dispose();
                }

                if (this._reflectionTexture) {
                    this._reflectionTexture.dispose();
                }

                if (this._emissiveTexture) {
                    this._emissiveTexture.dispose();
                }

                if (this._metallicTexture) {
                    this._metallicTexture.dispose();
                }

                if (this._reflectivityTexture) {
                    this._reflectivityTexture.dispose();
                }

                if (this._bumpTexture) {
                    this._bumpTexture.dispose();
                }

                if (this._lightmapTexture) {
                    this._lightmapTexture.dispose();
                }

                if (this._refractionTexture) {
                    this._refractionTexture.dispose();
                }
                
                if (this._cameraColorGradingTexture) {
                    this._cameraColorGradingTexture.dispose();
                }
            }

            this._renderTargets.dispose();

            super.dispose(forceDisposeEffect, forceDisposeTextures);
        }
    }
}