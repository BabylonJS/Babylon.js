/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    class LegacyPBRMaterialDefines extends MaterialDefines {
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
        public REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
        public REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
        public INVERTCUBICMAP = false;
        public LOGARITHMICDEPTH = false;
        public CAMERATONEMAP = false;
        public CAMERACONTRAST = false;
        public CAMERACOLORGRADING = false;
        public CAMERACOLORCURVES = false;
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
        public TWOSIDEDLIGHTING = false;
        public SHADOWFLOAT = false;

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
    export class LegacyPBRMaterial extends BABYLON.Material {

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
        
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT). 
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image; 
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        @serializeAsColorCurves()
        public cameraColorCurves: ColorCurves = null;
         
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
        public overloadedReflectivity: Color3 = new BABYLON.Color3(0.0, 0.0, 0.0);
        
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

        /**
         * AKA Occlusion Texture Intensity in other nomenclature.
         */
        @serialize()
        public ambientTextureStrength: number = 1.0;

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

        /**
         * Used to switch from specular/glossiness to metallic/roughness workflow.
         */
        @serializeAsTexture()
        public metallicTexture: BaseTexture;

        /**
         * Specifies the metallic scalar of the metallic/roughness workflow.
         * Can also be used to scale the metalness values of the metallic texture.
         */
        @serialize()
        public metallic: number;

        /**
         * Specifies the roughness scalar of the metallic/roughness workflow.
         * Can also be used to scale the roughness values of the metallic texture.
         */
        @serialize()
        public roughness: number;

        /**
         * Used to enable roughness/glossiness fetch from a separate chanel depending on the current mode.
         * Gray Scale represents roughness in metallic mode and glossiness in specular mode.
         */
        @serializeAsTexture()
        public microSurfaceTexture: BaseTexture;

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
        public reflectionColor = new Color3(0.0, 0.0, 0.0);

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
         * Specifies if the metallic texture contains the roughness information in its alpha channel.
         */
        @serialize()
        public useRoughnessFromMetallicTextureAlpha = true;

        /**
         * Specifies if the metallic texture contains the roughness information in its green channel.
         */
        @serialize()
        public useRoughnessFromMetallicTextureGreen = false;

        /**
         * Specifies if the metallic texture contains the metallness information in its blue channel.
         */
        @serialize()
        public useMetallnessFromMetallicTextureBlue = false;

        /**
         * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
         */
        @serialize()
        public useAmbientOcclusionFromMetallicTextureRed = false;

        /**
         * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
         */
        @serialize()
        public useAmbientInGrayScale = false;
        
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

        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        @serialize()
        public invertNormalMapX = false;

        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        @serialize()
        public invertNormalMapY = false;

        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        @serialize()
        public twoSidedLighting = false;

        private _renderTargets = new SmartArray<RenderTargetTexture>(16);
        private _globalAmbientColor = new Color3(0, 0, 0);
        private _tempColor = new Color3();
        private _renderId: number;

        private _defines = new LegacyPBRMaterialDefines();
        private _cachedDefines = new LegacyPBRMaterialDefines();

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

                if (StandardMaterial.ReflectionTextureEnabled && this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
                    this._renderTargets.push(<RenderTargetTexture>this.reflectionTexture);
                }

                if (StandardMaterial.RefractionTextureEnabled && this.refractionTexture && this.refractionTexture.isRenderTarget) {
                    this._renderTargets.push(<RenderTargetTexture>this.refractionTexture);
                }

                return this._renderTargets;
            }
        }

        public getClassName(): string {
            return "LegacyPBRMaterial";
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

            return false;
        }

        private convertColorToLinearSpaceToRef(color: Color3, ref: Color3): void {
            LegacyPBRMaterial.convertColorToLinearSpaceToRef(color, ref, this.useScalarInLinearSpace);
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
                var useUbo = light._uniformBuffer.useUbo;

                light._uniformBuffer.bindToEffect(effect, "Light" + lightIndex);
                MaterialHelper.BindLightProperties(light, effect, lightIndex);

                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(light.diffuse, LegacyPBRMaterial._scaledAlbedo, useScalarInLinearSpace);

                LegacyPBRMaterial._scaledAlbedo.scaleToRef(light.intensity, LegacyPBRMaterial._scaledAlbedo);
                light._uniformBuffer.updateColor4(useUbo ? "vLightDiffuse" : "vLightDiffuse" + lightIndex, LegacyPBRMaterial._scaledAlbedo, usePhysicalLightFalloff ? light.radius : light.range);

                if ((<any>defines)["SPECULARTERM"]) {
                    this.convertColorToLinearSpaceToRef(light.specular, LegacyPBRMaterial._scaledReflectivity, useScalarInLinearSpace);

                    LegacyPBRMaterial._scaledReflectivity.scaleToRef(light.intensity, LegacyPBRMaterial._scaledReflectivity);
                    light._uniformBuffer.updateColor3(useUbo ? "vLightSpecular" : "vLightSpecular" + lightIndex, LegacyPBRMaterial._scaledReflectivity);
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

        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }

            var scene = this.getScene();
            var engine = scene.getEngine();
            var needUVs = false;

            this._defines.reset();

            if (scene.lightsEnabled && !this.disableLighting) {
                MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines, true, this.maxSimultaneousLights);
            }

            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                    if (this._checkCache(scene, mesh, useInstances)) {
                        return true;
                    }
                }
            }

            if (scene.texturesEnabled) {
                if (scene.getEngine().getCaps().textureLOD) {
                    this._defines.LODBASEDMICROSFURACE = true;
                }

                if (this.albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.albedoTexture.isReady()) {
                        return false;
                    }

                    needUVs = true;
                    this._defines.ALBEDO = true;
                }

                if (this.ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                    if (!this.ambientTexture.isReady()) {
                        return false;
                    }

                    needUVs = true;
                    this._defines.AMBIENT = true;
                    this._defines.AMBIENTINGRAYSCALE = this.useAmbientInGrayScale;
                }

                if (this.opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                    if (!this.opacityTexture.isReady()) {
                        return false;
                    }
                    
                    needUVs = true;
                    this._defines.OPACITY = true;

                    if (this.opacityTexture.getAlphaFromRGB) {
                        this._defines.OPACITYRGB = true;
                    }
                }

                if (this.reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                    if (!this.reflectionTexture.isReady()) {
                        return false;
                    }
                    
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
                        case Texture.FIXED_EQUIRECTANGULAR_MODE:
                            this._defines.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = true;
                            break;
                        case Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                            this._defines.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = true;
                            break;                                
                    }

                    if (this.reflectionTexture instanceof HDRCubeTexture && (<HDRCubeTexture>this.reflectionTexture)) {
                        this._defines.USESPHERICALFROMREFLECTIONMAP = true;

                        if ((<HDRCubeTexture>this.reflectionTexture).isPMREM) {
                            this._defines.USEPMREMREFLECTION = true;
                        }
                    }
                }

                if (this.lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                    if (!this.lightmapTexture.isReady()) {
                        return false;
                    }

                    needUVs = true;
                    this._defines.LIGHTMAP = true;
                    this._defines.USELIGHTMAPASSHADOWMAP = this.useLightmapAsShadowmap;
                }

                if (this.emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                    if (!this.emissiveTexture.isReady()) {
                        return false;
                    }

                    needUVs = true;
                    this._defines.EMISSIVE = true;
                }

                if (StandardMaterial.SpecularTextureEnabled) {
                    if (this.metallicTexture) {
                        if (!this.metallicTexture.isReady()) {
                            return false;
                        }

                        needUVs = true;
                        this._defines.METALLICWORKFLOW = true;
                        this._defines.METALLICMAP = true;
                        this._defines.ROUGHNESSSTOREINMETALMAPALPHA = this.useRoughnessFromMetallicTextureAlpha;
                        this._defines.ROUGHNESSSTOREINMETALMAPGREEN = !this.useRoughnessFromMetallicTextureAlpha && this.useRoughnessFromMetallicTextureGreen;                            
                        this._defines.METALLNESSSTOREINMETALMAPBLUE = this.useMetallnessFromMetallicTextureBlue;                            
                        this._defines.AOSTOREINMETALMAPRED = this.useAmbientOcclusionFromMetallicTextureRed;
                    }
                    else if (this.reflectivityTexture) {
                        if (!this.reflectivityTexture.isReady()) {
                            return false;
                        }

                        needUVs = true;
                        this._defines.REFLECTIVITY = true;
                        this._defines.MICROSURFACEFROMREFLECTIVITYMAP = this.useMicroSurfaceFromReflectivityMapAlpha;
                        this._defines.MICROSURFACEAUTOMATIC = this.useAutoMicroSurfaceFromReflectivityMap;
                    }

                    if (this.microSurfaceTexture) {
                        if (!this.microSurfaceTexture.isReady()) {
                            return false;
                        }

                        needUVs = true;
                        this._defines.MICROSURFACEMAP = true;
                    }
                }

                if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                    if (!this.bumpTexture.isReady()) {
                        return false;
                    }
                    
                    needUVs = true;
                    this._defines.BUMP = true;

                    if (this.useParallax && this.albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                        this._defines.PARALLAX = true;
                        if (this.useParallaxOcclusion) {
                            this._defines.PARALLAXOCCLUSION = true;
                        }
                    }                     
                }

                if (this.refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                    if (!this.refractionTexture.isReady()) {
                        return false;
                    }
                    
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
            
                if (this.cameraColorGradingTexture && StandardMaterial.ColorGradingTextureEnabled) {
                    if (!this.cameraColorGradingTexture.isReady()) {
                        return false;
                    }
                    
                    this._defines.CAMERACOLORGRADING = true;
                }

                if (!this.backFaceCulling && this.twoSidedLighting) {
                    this._defines.TWOSIDEDLIGHTING = true;
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
            
            if (this.cameraColorCurves) {
                this._defines.CAMERACOLORCURVES = true;
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

            if ((this.metallic !== undefined && this.metallic !== null) || (this.roughness !== undefined && this.roughness !== null)) {
                this._defines.METALLICWORKFLOW = true;
            }

            // Attribs
            if (mesh) {
                if (!scene.getEngine().getCaps().standardDerivatives && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                    mesh.createNormals(true);
                    Tools.Warn("PBRMaterial: Normals have been created for the mesh: " + mesh.name);
                }

                if (mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                    if (mesh.isVerticesDataPresent(VertexBuffer.TangentKind)) {
                        this._defines.TANGENT = true;
                    }
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

               if ((<any>mesh).morphTargetManager) {
                    var manager = (<Mesh>mesh).morphTargetManager;
                    this._defines.MORPHTARGETS_TANGENT = manager.supportsTangents && this._defines.TANGENT;
                    this._defines.MORPHTARGETS_NORMAL = manager.supportsNormals && this._defines.NORMAL;
                    this._defines.MORPHTARGETS = (manager.numInfluencers > 0);
                    this._defines.NUM_MORPH_INFLUENCERS = manager.numInfluencers;
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

                if (this._defines.TANGENT) {
                    attribs.push(VertexBuffer.TangentKind);
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
                MaterialHelper.PrepareAttributesForMorphTargets(attribs, mesh, this._defines);

                // Legacy browser patch
                var join = this._defines.toString();
                
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vAlbedoColor", "vReflectivityColor", "vEmissiveColor", "vReflectionColor",
                        "vFogInfos", "vFogColor", "pointSize",
                        "vAlbedoInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vReflectivityInfos", "vMicroSurfaceSamplerInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                        "mBones",
                        "vClipPlane", "albedoMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "reflectivityMatrix", "microSurfaceSamplerMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                        "opacityParts", "emissiveLeftColor", "emissiveRightColor",
                        "vLightingIntensity", "vOverloadedShadowIntensity", "vOverloadedIntensity", "vOverloadedAlbedo", "vOverloadedReflection", "vOverloadedReflectivity", "vOverloadedEmissive", "vOverloadedMicroSurface",
                        "logarithmicDepthConstant",
                        "vSphericalX", "vSphericalY", "vSphericalZ",
                        "vSphericalXX", "vSphericalYY", "vSphericalZZ",
                        "vSphericalXY", "vSphericalYZ", "vSphericalZX",
                        "vMicrosurfaceTextureLods",
                        "vCameraInfos", "vTangentSpaceParams"
                ];

                var samplers = ["albedoSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "reflectivitySampler", "microSurfaceSampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler"];
                var uniformBuffers = ["Material", "Scene"];

                if (this._defines.CAMERACOLORCURVES) {
                    ColorCurves.PrepareUniforms(uniforms);
                }
                if (this._defines.CAMERACOLORGRADING) {
                    uniforms.push(
                        "vCameraColorGradingInfos", 
                        "vCameraColorGradingScaleOffset"
                    );

                    samplers.push(
                        "cameraColorGrading2DSampler"
                    );
                }
                MaterialHelper.PrepareUniformsAndSamplersList(<EffectCreationOptions>{
                    uniformsNames: uniforms, 
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers, 
                    defines: this._defines, 
                    maxSimultaneousLights: this.maxSimultaneousLights
                });

                var onCompiled = (effect: Effect) => {
                    if (this.onCompiled) {
                        this.onCompiled(effect);
                    }

                    this.bindSceneUniformBuffer(effect, scene.getSceneUniformBuffer());
                };
                
                this._effect = scene.getEngine().createEffect("legacyPbr", <EffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights, maxSimultaneousMorphTargets: this._defines.NUM_MORPH_INFLUENCERS }
                }, engine);
                
                this.buildUniformLayout();
            }
            if (!this._effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
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
            this._uniformBuffer.addUniform("vTangentSpaceParams", 2);
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

            this._uniformBuffer.addUniform("vOverloadedIntensity", 4);
            this._uniformBuffer.addUniform("vOverloadedAmbient", 3);
            this._uniformBuffer.addUniform("vOverloadedAlbedo", 3);
            this._uniformBuffer.addUniform("vOverloadedReflectivity", 3);
            this._uniformBuffer.addUniform("vOverloadedEmissive", 3);
            this._uniformBuffer.addUniform("vOverloadedReflection", 3);
            this._uniformBuffer.addUniform("vOverloadedMicroSurface", 3);
            this._uniformBuffer.addUniform("vOverloadedShadowIntensity", 4);

            this._uniformBuffer.addUniform("pointSize", 1);
            this._uniformBuffer.create();
        }


        public unbind(): void {
            if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("reflection2DSampler", null);
            }

            if (this.refractionTexture && this.refractionTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("refraction2DSampler", null);
            }

            super.unbind();
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
            this._effect.setMatrix("world", world);
        }

        private _myScene: BABYLON.Scene = null;

        public bind(world: Matrix, mesh?: Mesh): void {
            this._myScene = this.getScene();
            var effect = this._effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);

            // Bones
            MaterialHelper.BindBonesParameters(mesh, this._effect);

            if (this._myScene.getCachedMaterial() !== (<BABYLON.Material>this)) {
                this._uniformBuffer.bindToEffect(effect, "Material");

                this.bindViewProjection(effect);

                if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync) {

                    // Fresnel
                    if (StandardMaterial.FresnelEnabled) {
                        if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("opacityParts", new Color3(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power);
                        }

                        if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                            this._uniformBuffer.updateColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                        }
                    }

                    // Texture uniforms      
                    if (this._myScene.texturesEnabled) {
                        if (this.albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vAlbedoInfos", this.albedoTexture.coordinatesIndex, this.albedoTexture.level);
                            this._uniformBuffer.updateMatrix("albedoMatrix", this.albedoTexture.getTextureMatrix());
                        }

                        if (this.ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                            this._uniformBuffer.updateFloat3("vAmbientInfos", this.ambientTexture.coordinatesIndex, this.ambientTexture.level, this.ambientTextureStrength);
                            this._uniformBuffer.updateMatrix("ambientMatrix", this.ambientTexture.getTextureMatrix());
                        }

                        if (this.opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vOpacityInfos", this.opacityTexture.coordinatesIndex, this.opacityTexture.level);
                            this._uniformBuffer.updateMatrix("opacityMatrix", this.opacityTexture.getTextureMatrix());
                        }

                        if (this.reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                            this._microsurfaceTextureLods.x = Math.round(Math.log(this.reflectionTexture.getSize().width) * Math.LOG2E);
                            this._uniformBuffer.updateMatrix("reflectionMatrix", this.reflectionTexture.getReflectionTextureMatrix());
                            this._uniformBuffer.updateFloat2("vReflectionInfos", this.reflectionTexture.level, 0);

                            if (this._defines.USESPHERICALFROMREFLECTIONMAP) {
                                var polynomials = this.reflectionTexture.sphericalPolynomial;
                                this._effect.setFloat3("vSphericalX", polynomials.x.x, polynomials.x.y, polynomials.x.z);
                                this._effect.setFloat3("vSphericalY", polynomials.y.x, polynomials.y.y, polynomials.y.z);
                                this._effect.setFloat3("vSphericalZ", polynomials.z.x, polynomials.z.y, polynomials.z.z);
                                this._effect.setFloat3("vSphericalXX_ZZ", polynomials.xx.x - polynomials.zz.x,
                                    polynomials.xx.y - polynomials.zz.y,
                                    polynomials.xx.z - polynomials.zz.z);
                                this._effect.setFloat3("vSphericalYY_ZZ", polynomials.yy.x - polynomials.zz.x,
                                    polynomials.yy.y - polynomials.zz.y,
                                    polynomials.yy.z - polynomials.zz.z);
                                this._effect.setFloat3("vSphericalZZ", polynomials.zz.x, polynomials.zz.y, polynomials.zz.z);
                                this._effect.setFloat3("vSphericalXY", polynomials.xy.x, polynomials.xy.y, polynomials.xy.z);
                                this._effect.setFloat3("vSphericalYZ", polynomials.yz.x, polynomials.yz.y, polynomials.yz.z);
                                this._effect.setFloat3("vSphericalZX", polynomials.zx.x, polynomials.zx.y, polynomials.zx.z);
                            }
                        }

                        if (this.emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
                            this._uniformBuffer.updateMatrix("emissiveMatrix", this.emissiveTexture.getTextureMatrix());
                        }

                        if (this.lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vLightmapInfos", this.lightmapTexture.coordinatesIndex, this.lightmapTexture.level);
                            this._uniformBuffer.updateMatrix("lightmapMatrix", this.lightmapTexture.getTextureMatrix());
                        }

                        if (StandardMaterial.SpecularTextureEnabled) {
                            if (this.metallicTexture) {
                                this._uniformBuffer.updateFloat3("vReflectivityInfos", this.metallicTexture.coordinatesIndex, this.metallicTexture.level, this.ambientTextureStrength);
                                this._uniformBuffer.updateMatrix("reflectivityMatrix", this.metallicTexture.getTextureMatrix());
                            }
                            else if (this.reflectivityTexture) {
                                this._uniformBuffer.updateFloat3("vReflectivityInfos", this.reflectivityTexture.coordinatesIndex, this.reflectivityTexture.level, 1.0);
                                this._uniformBuffer.updateMatrix("reflectivityMatrix", this.reflectivityTexture.getTextureMatrix());
                            }

                            if (this.microSurfaceTexture) {
                                this._uniformBuffer.updateFloat2("vMicroSurfaceSamplerInfos", this.microSurfaceTexture.coordinatesIndex, this.microSurfaceTexture.level);
                                this._uniformBuffer.updateMatrix("microSurfaceSamplerMatrix", this.microSurfaceTexture.getTextureMatrix());
                            }
                        }

                        if (this.bumpTexture && this._myScene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                            this._uniformBuffer.updateFloat3("vBumpInfos", this.bumpTexture.coordinatesIndex, 1.0 / this.bumpTexture.level, this.parallaxScaleBias);
                            this._uniformBuffer.updateMatrix("bumpMatrix", this.bumpTexture.getTextureMatrix());

                            if (this._myScene._mirroredCameraPosition) {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this.invertNormalMapX ? 1.0 : -1.0, this.invertNormalMapY ? 1.0 : -1.0);
                            } else {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this.invertNormalMapX ? -1.0 : 1.0, this.invertNormalMapY ? -1.0 : 1.0);
                            }
                        }

                        if (this.refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                            this._microsurfaceTextureLods.y = Math.round(Math.log(this.refractionTexture.getSize().width) * Math.LOG2E);

                            var depth = 1.0;
                            if (!this.refractionTexture.isCube) {
                                this._uniformBuffer.updateMatrix("refractionMatrix", this.refractionTexture.getReflectionTextureMatrix());

                                if ((<any>this.refractionTexture).depth) {
                                    depth = (<any>this.refractionTexture).depth;
                                }
                            }
                            this._uniformBuffer.updateFloat4("vRefractionInfos", this.refractionTexture.level, this.indexOfRefraction, depth, this.invertRefractionY ? -1 : 1);
                        }

                        if ((this.reflectionTexture || this.refractionTexture)) {
                            this._uniformBuffer.updateFloat2("vMicrosurfaceTextureLods", this._microsurfaceTextureLods.x, this._microsurfaceTextureLods.y);
                        }
                    }

                    // Point size
                    if (this.pointsCloud) {
                        this._uniformBuffer.updateFloat("pointSize", this.pointSize);
                    }

                    // Colors
                    if (this._defines.METALLICWORKFLOW) {
                        LegacyPBRMaterial._scaledReflectivity.r = (this.metallic === undefined || this.metallic === null) ? 1 : this.metallic;
                        LegacyPBRMaterial._scaledReflectivity.g = (this.roughness === undefined || this.roughness === null) ? 1 : this.roughness;
                        this._uniformBuffer.updateColor4("vReflectivityColor", LegacyPBRMaterial._scaledReflectivity, 0);
                    }
                    else {
                        // GAMMA CORRECTION.
                        this.convertColorToLinearSpaceToRef(this.reflectivityColor, LegacyPBRMaterial._scaledReflectivity);
                        this._uniformBuffer.updateColor4("vReflectivityColor", LegacyPBRMaterial._scaledReflectivity, this.microSurface);
                    }

                    // GAMMA CORRECTION.
                    this.convertColorToLinearSpaceToRef(this.emissiveColor, LegacyPBRMaterial._scaledEmissive);
                    this._uniformBuffer.updateColor3("vEmissiveColor", LegacyPBRMaterial._scaledEmissive);

                    // GAMMA CORRECTION.
                    this.convertColorToLinearSpaceToRef(this.reflectionColor, LegacyPBRMaterial._scaledReflection);
                    this._uniformBuffer.updateColor3("vReflectionColor", LegacyPBRMaterial._scaledReflection);

                    // GAMMA CORRECTION.
                    this.convertColorToLinearSpaceToRef(this.albedoColor, LegacyPBRMaterial._scaledAlbedo);
                    this._uniformBuffer.updateColor4("vAlbedoColor", LegacyPBRMaterial._scaledAlbedo, this.alpha * mesh.visibility);


                    // Misc
                    this._lightingInfos.x = this.directIntensity;
                    this._lightingInfos.y = this.emissiveIntensity;
                    this._lightingInfos.z = this.environmentIntensity;
                    this._lightingInfos.w = this.specularIntensity;

                    this._uniformBuffer.updateVector4("vLightingIntensity", this._lightingInfos);

                    // Overloaded params

                    this._overloadedShadowInfos.x = this.overloadedShadowIntensity;
                    this._overloadedShadowInfos.y = this.overloadedShadeIntensity;
                    this._uniformBuffer.updateVector4("vOverloadedShadowIntensity", this._overloadedShadowInfos);

                    this._overloadedIntensity.x = this.overloadedAmbientIntensity;
                    this._overloadedIntensity.y = this.overloadedAlbedoIntensity;
                    this._overloadedIntensity.z = this.overloadedReflectivityIntensity;
                    this._overloadedIntensity.w = this.overloadedEmissiveIntensity;
                    this._uniformBuffer.updateVector4("vOverloadedIntensity", this._overloadedIntensity);

                    this._uniformBuffer.updateColor3("vOverloadedAmbient", this.overloadedAmbient);
                    this.convertColorToLinearSpaceToRef(this.overloadedAlbedo, this._tempColor);
                    this._uniformBuffer.updateColor3("vOverloadedAlbedo", this._tempColor);
                    this.convertColorToLinearSpaceToRef(this.overloadedReflectivity, this._tempColor);
                    this._uniformBuffer.updateColor3("vOverloadedReflectivity", this._tempColor);
                    this.convertColorToLinearSpaceToRef(this.overloadedEmissive, this._tempColor);
                    this._uniformBuffer.updateColor3("vOverloadedEmissive", this._tempColor);
                    this.convertColorToLinearSpaceToRef(this.overloadedReflection, this._tempColor);
                    this._uniformBuffer.updateColor3("vOverloadedReflection", this._tempColor);

                    this._overloadedMicroSurface.x = this.overloadedMicroSurface;
                    this._overloadedMicroSurface.y = this.overloadedMicroSurfaceIntensity;
                    this._overloadedMicroSurface.z = this.overloadedReflectionIntensity;
                    this._uniformBuffer.updateVector3("vOverloadedMicroSurface", this._overloadedMicroSurface);

                }

                // Textures        
                if (this._myScene.texturesEnabled) {
                    if (this.albedoTexture && StandardMaterial.DiffuseTextureEnabled) {
                        this._uniformBuffer.setTexture("albedoSampler", this.albedoTexture);
                    }

                    if (this.ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                        this._uniformBuffer.setTexture("ambientSampler", this.ambientTexture);
                    }

                    if (this.opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                        this._uniformBuffer.setTexture("opacitySampler", this.opacityTexture);
                    }

                    if (this.reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                        if (this.reflectionTexture.isCube) {
                            this._uniformBuffer.setTexture("reflectionCubeSampler", this.reflectionTexture);
                        } else {
                            this._uniformBuffer.setTexture("reflection2DSampler", this.reflectionTexture);
                        }
                    }

                    if (this.emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                        this._uniformBuffer.setTexture("emissiveSampler", this.emissiveTexture);
                    }

                    if (this.lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                        this._uniformBuffer.setTexture("lightmapSampler", this.lightmapTexture);
                    }

                    if (StandardMaterial.SpecularTextureEnabled) {
                        if (this.metallicTexture) {
                            this._uniformBuffer.setTexture("reflectivitySampler", this.metallicTexture);
                        }
                        else if (this.reflectivityTexture) {
                            this._uniformBuffer.setTexture("reflectivitySampler", this.reflectivityTexture);
                        }

                        if (this.microSurfaceTexture) {
                            this._uniformBuffer.setTexture("microSurfaceSampler", this.microSurfaceTexture);
                        }
                    }

                    if (this.bumpTexture && this._myScene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                        this._uniformBuffer.setTexture("bumpSampler", this.bumpTexture);
                    }

                    if (this.refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        if (this.refractionTexture.isCube) {
                            this._uniformBuffer.setTexture("refractionCubeSampler", this.refractionTexture);
                        } else {
                            this._uniformBuffer.setTexture("refraction2DSampler", this.refractionTexture);
                        }
                    }

                    if (this.cameraColorGradingTexture && StandardMaterial.ColorGradingTextureEnabled) {
                        this._effect.setTexture("cameraColorGrading2DSampler", this.cameraColorGradingTexture);

                        let x = this.cameraColorGradingTexture.level;                 // Texture Level
                        let y = this.cameraColorGradingTexture.getSize().height;      // Texture Size example with 8
                        let z = y - 1.0;                    // SizeMinusOne 8 - 1
                        let w = 1 / y;                      // Space of 1 slice 1 / 8
                        
                        this._effect.setFloat4("vCameraColorGradingInfos", x, y, z, w);
                        
                        let slicePixelSizeU = w / y;    // Space of 1 pixel in U direction, e.g. 1/64
                        let slicePixelSizeV = w;		// Space of 1 pixel in V direction, e.g. 1/8					    // Space of 1 pixel in V direction, e.g. 1/8
                        
                        let x2 = z * slicePixelSizeU;   // Extent of lookup range in U for a single slice so that range corresponds to (size-1) texels, for example 7/64
                        let y2 = z / y;	                // Extent of lookup range in V for a single slice so that range corresponds to (size-1) texels, for example 7/8
                        let z2 = 0.5 * slicePixelSizeU;	// Offset of lookup range in U to align sample position with texel centre, for example 0.5/64 
                        let w2 = 0.5 * slicePixelSizeV;	// Offset of lookup range in V to align sample position with texel centre, for example 0.5/8
                        
                        this._effect.setFloat4("vCameraColorGradingScaleOffset", x2, y2, z2, w2);
                    }
                }

                // Clip plane
                MaterialHelper.BindClipPlane(this._effect, this._myScene);

                // Colors
                this._myScene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);

                effect.setVector3("vEyePosition", this._myScene._mirroredCameraPosition ? this._myScene._mirroredCameraPosition : this._myScene.activeCamera.position);
                effect.setColor3("vAmbientColor", this._globalAmbientColor);
            }

            if (this._myScene.getCachedMaterial() !== this || !this.isFrozen) {

                // Lights
                if (this._myScene.lightsEnabled && !this.disableLighting) {
                    LegacyPBRMaterial.BindLights(this._myScene, mesh, this._effect, this._defines, this.useScalarInLinearSpace, this.maxSimultaneousLights, this.usePhysicalLightFalloff);
                }

                // View
                if (this._myScene.fogEnabled && mesh.applyFog && this._myScene.fogMode !== Scene.FOGMODE_NONE || this.reflectionTexture) {
                    this.bindView(effect);
                }

                // Fog
                MaterialHelper.BindFogParameters(this._myScene, mesh, this._effect);

                // Morph targets
                if (this._defines.NUM_MORPH_INFLUENCERS) {
                    MaterialHelper.BindMorphTargetParameters(mesh, this._effect);                
                }

                this._cameraInfos.x = this.cameraExposure;
                this._cameraInfos.y = this.cameraContrast;
                effect.setVector4("vCameraInfos", this._cameraInfos);
                
                if (this.cameraColorCurves) {
                    ColorCurves.Bind(this.cameraColorCurves, this._effect);
                }

                // Log. depth
                MaterialHelper.BindLogDepth(this._defines, this._effect, this._myScene);
            }

            this._uniformBuffer.update();

            this._afterBind(mesh);

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

            if (this.metallicTexture && this.metallicTexture.animations && this.metallicTexture.animations.length > 0) {
                results.push(this.metallicTexture);
            }
            else if (this.reflectivityTexture && this.reflectivityTexture.animations && this.reflectivityTexture.animations.length > 0) {
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

                if (this.metallicTexture) {
                    this.metallicTexture.dispose();
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

            this._renderTargets.dispose();

            super.dispose(forceDisposeEffect, forceDisposeTextures);
        }

        public clone(name: string): LegacyPBRMaterial {
            return SerializationHelper.Clone(() => new LegacyPBRMaterial(name, this.getScene()), this);
        }

        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.LegacyPBRMaterial";
            return serializationObject;
        }

        // Statics
        public static Parse(source: any, scene: Scene, rootUrl: string): LegacyPBRMaterial {
            return SerializationHelper.Parse(() => new LegacyPBRMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
}