﻿module BABYLON {
    
    interface ICustomMaterialBuilder {
        (name: string ,FragVertexMainParam: string , FragParam:string ,VertexParam:string ): string;
     }

         
    class StandardMaterialDefines extends MaterialDefines {
        public DIFFUSE = false;
        public AMBIENT = false;
        public OPACITY = false;
        public OPACITYRGB = false;
        public REFLECTION = false;
        public EMISSIVE = false;
        public SPECULAR = false;
        public BUMP = false;
        public PARALLAX = false;
        public PARALLAXOCCLUSION = false;
        public SPECULAROVERALPHA = false;
        public CLIPPLANE = false;
        public ALPHATEST = false;
        public ALPHAFROMDIFFUSE = false;
        public POINTSIZE = false;
        public FOG = false;
        public SPECULARTERM = false;
        public DIFFUSEFRESNEL = false;
        public OPACITYFRESNEL = false;
        public REFLECTIONFRESNEL = false;
        public REFRACTIONFRESNEL = false;
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
        public GLOSSINESS = false;
        public ROUGHNESS = false;
        public EMISSIVEASILLUMINATION = false;
        public LINKEMISSIVEWITHDIFFUSE = false;
        public REFLECTIONFRESNELFROMSPECULAR = false;
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
        public INVERTCUBICMAP = false;
        public LOGARITHMICDEPTH = false;
        public REFRACTION = false;
        public REFRACTIONMAP_3D = false;
        public REFLECTIONOVERALPHA = false;
        public INVERTNORMALMAPX = false;
        public INVERTNORMALMAPY = false;
        public SHADOWFULLFLOAT = false;
        public CAMERACOLORGRADING = false;
        public CAMERACOLORCURVES = false;

        constructor() {
            super();
            this.rebuild();
        }
    }

    export class StandardMaterial extends Material {
        
        public customMaterialBuilder: ICustomMaterialBuilder;
        
        @serializeAsTexture()
        public diffuseTexture: BaseTexture;

        @serializeAsTexture()
        public ambientTexture: BaseTexture;

        @serializeAsTexture()
        public opacityTexture: BaseTexture;

        @serializeAsTexture()
        public reflectionTexture: BaseTexture;

        @serializeAsTexture()
        public emissiveTexture: BaseTexture;

        @serializeAsTexture()
        public specularTexture: BaseTexture;

        @serializeAsTexture()
        public bumpTexture: BaseTexture;

        @serializeAsTexture()
        public lightmapTexture: BaseTexture;

        @serializeAsTexture()
        public refractionTexture: BaseTexture;

        @serializeAsColor3("ambient")
        public ambientColor = new Color3(0, 0, 0);

        @serializeAsColor3("diffuse")
        public diffuseColor = new Color3(1, 1, 1);

        @serializeAsColor3("specular")
        public specularColor = new Color3(1, 1, 1);

        @serializeAsColor3("emissive")
        public emissiveColor = new Color3(0, 0, 0);

        @serialize()
        public specularPower = 64;

        @serialize()
        public useAlphaFromDiffuseTexture = false;

        @serialize()
        public useEmissiveAsIllumination = false;

        @serialize()
        public linkEmissiveWithDiffuse = false;

        @serialize()
        public useReflectionFresnelFromSpecular = false;

        @serialize()
        public useSpecularOverAlpha = false;

        @serialize()
        public useReflectionOverAlpha = false;

        @serialize()
        public disableLighting = false;

        @serialize()
        public useParallax = false;

        @serialize()
        public useParallaxOcclusion = false;

        @serialize()
        public parallaxScaleBias = 0.05;

        @serialize()
        public roughness = 0;

        @serialize()
        public indexOfRefraction = 0.98;

        @serialize()
        public invertRefractionY = true;

        @serialize()
        public useLightmapAsShadowmap = false;

        @serializeAsFresnelParameters()
        public diffuseFresnelParameters: FresnelParameters;

        @serializeAsFresnelParameters()
        public opacityFresnelParameters: FresnelParameters;

        @serializeAsFresnelParameters()
        public reflectionFresnelParameters: FresnelParameters;

        @serializeAsFresnelParameters()
        public refractionFresnelParameters: FresnelParameters;

        @serializeAsFresnelParameters()
        public emissiveFresnelParameters: FresnelParameters;

        @serialize()
        public useGlossinessFromSpecularMapAlpha = false;

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

        private _renderTargets = new SmartArray<RenderTargetTexture>(16);
        private _worldViewProjectionMatrix = Matrix.Zero();
        private _globalAmbientColor = new Color3(0, 0, 0);
        private _renderId: number;

        private _defines = new StandardMaterialDefines();
        private _cachedDefines = new StandardMaterialDefines();

        private _useLogarithmicDepth: boolean;

        constructor(name: string, scene: Scene, customMaterial  : ICustomMaterialBuilder) {
            super(name, scene);
            
            this.customMaterialBuilder = customMaterial;
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

        public getClassName(): string {
            return "StandardMaterial";
        }        

        @serialize()
        public get useLogarithmicDepth(): boolean {
            return this._useLogarithmicDepth;
        }

        public set useLogarithmicDepth(value: boolean) {
            this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
        }

        public needAlphaBlending(): boolean {
            return (this.alpha < 1.0) || (this.opacityTexture != null) || this._shouldUseAlphaFromDiffuseTexture() || this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled;
        }

        public needAlphaTesting(): boolean {
            return this.diffuseTexture != null && this.diffuseTexture.hasAlpha;
        }

        private _shouldUseAlphaFromDiffuseTexture(): boolean {
            return this.diffuseTexture != null && this.diffuseTexture.hasAlpha && this.useAlphaFromDiffuseTexture;
        }

        public getAlphaTestTexture(): BaseTexture {
            return this.diffuseTexture;
        }

        // Methods   
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

        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }

            var scene = this.getScene();
            var engine = scene.getEngine();
            var needUVs = false;
            var needNormals = false;

            this._defines.reset();

            // Lights
            if (scene.lightsEnabled && !this.disableLighting) {
                needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines, this.maxSimultaneousLights);
            }

            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                    if (this._checkCache(scene, mesh, useInstances)) {
                        return true;
                    }
                }
            }

            // Textures
            if (scene.texturesEnabled) {
                if (this.diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.diffuseTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.DIFFUSE = true;
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

                        if (this.roughness > 0) {
                            this._defines.ROUGHNESS = true;
                        }

                        if (this.useReflectionOverAlpha) {
                            this._defines.REFLECTIONOVERALPHA = true;
                        }

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
                        }
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

                if (this.lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                    if (!this.lightmapTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.LIGHTMAP = true;
                        this._defines.USELIGHTMAPASSHADOWMAP = this.useLightmapAsShadowmap;
                    }
                }

                if (this.specularTexture && StandardMaterial.SpecularTextureEnabled) {
                    if (!this.specularTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.SPECULAR = true;
                        this._defines.GLOSSINESS = this.useGlossinessFromSpecularMapAlpha;
                    }
                }

                if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && StandardMaterial.BumpTextureEnabled) {
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

                        if (this.invertNormalMapX) {
                            this._defines.INVERTNORMALMAPX = true;
                        }

                        if (this.invertNormalMapY) {
                            this._defines.INVERTNORMALMAPY = true;
                        }

                        if (scene._mirroredCameraPosition) {
                            this._defines.INVERTNORMALMAPX = !this._defines.INVERTNORMALMAPX;
                            this._defines.INVERTNORMALMAPY = !this._defines.INVERTNORMALMAPY;
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
                    }
                }

                if (this.cameraColorGradingTexture && StandardMaterial.ColorGradingTextureEnabled) {
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

            if (this._shouldUseAlphaFromDiffuseTexture()) {
                this._defines.ALPHAFROMDIFFUSE = true;
            }

            if (this.useEmissiveAsIllumination) {
                this._defines.EMISSIVEASILLUMINATION = true;
            }

            if (this.linkEmissiveWithDiffuse) {
                this._defines.LINKEMISSIVEWITHDIFFUSE = true;
            }

            if (this.useLogarithmicDepth) {
                this._defines.LOGARITHMICDEPTH = true;
            }
            
            if (this.cameraColorCurves) {
                this._defines.CAMERACOLORCURVES = true;
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
                if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled ||
                    this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled ||
                    this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled ||
                    this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled ||
                    this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {

                    if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled) {
                        this._defines.DIFFUSEFRESNEL = true;
                    }

                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        this._defines.OPACITYFRESNEL = true;
                    }

                    if (this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
                        this._defines.REFLECTIONFRESNEL = true;

                        if (this.useReflectionFresnelFromSpecular) {
                            this._defines.REFLECTIONFRESNELFROMSPECULAR = true;
                        }
                    }

                    if (this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled) {
                        this._defines.REFRACTIONFRESNEL = true;
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

                if (this._defines.SPECULAR) {
                    fallbacks.addFallback(0, "SPECULAR");
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

                if (this._defines.DIFFUSEFRESNEL) {
                    fallbacks.addFallback(1, "DIFFUSEFRESNEL");
                }

                if (this._defines.OPACITYFRESNEL) {
                    fallbacks.addFallback(2, "OPACITYFRESNEL");
                }

                if (this._defines.REFLECTIONFRESNEL) {
                    fallbacks.addFallback(3, "REFLECTIONFRESNEL");
                }

                if (this._defines.EMISSIVEFRESNEL) {
                    fallbacks.addFallback(4, "EMISSIVEFRESNEL");
                }

                if (this._defines.FRESNEL) {
                    fallbacks.addFallback(4, "FRESNEL");
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
                
                var shaderName = "default";
                
                // for test make Custom Shader Use From StandardMaterial
                if (this.customMaterialBuilder) {

                    shaderName = this.customMaterialBuilder(
                        shaderName, 
                        'void main(void) {' /* used in Fragment and Vertex Shader Most Replaced by new content and have this part again */,
                        'vec3 diffuseColor = vDiffuseColor.rgb;' /* manage diffuseColor in new Way */,
                        'gl_Position = viewProjection * finalWorld * vec4(position, 1.0);' /* manage vertex position in new Way*/
                        ); 
                }

                var join = this._defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                    "depthValues",
                    "diffuseLeftColor", "diffuseRightColor", "opacityParts", "reflectionLeftColor", "reflectionRightColor", "emissiveLeftColor", "emissiveRightColor", "refractionLeftColor", "refractionRightColor",
                    "logarithmicDepthConstant"
                ];

                var samplers = ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler"]

                if (this._defines.CAMERACOLORCURVES) {
                    ColorCurves.PrepareUniforms(uniforms);
                }
                if (this._defines.CAMERACOLORGRADING) {
                    ColorGradingTexture.PrepareUniformsAndSamplers(uniforms, samplers);
                }
                MaterialHelper.PrepareUniformsAndSamplersList(uniforms, samplers, this._defines, this.maxSimultaneousLights);

                this._effect = scene.getEngine().createEffect(shaderName,
                    attribs, uniforms, samplers,
                    join, fallbacks, this.onCompiled, this.onError, { maxSimultaneousLights: this.maxSimultaneousLights - 1 });
            }
            if (!this._effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new StandardMaterialDefines();
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

        public bind(world: Matrix, mesh?: Mesh): void {
            var scene = this.getScene();

            // Matrices        
            this.bindOnlyWorldMatrix(world);

            // Bones
            MaterialHelper.BindBonesParameters(mesh, this._effect);

            if (scene.getCachedMaterial() !== this) {
                this._effect.setMatrix("viewProjection", scene.getTransformMatrix());

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

                    if (this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled) {
                        this._effect.setColor4("refractionLeftColor", this.refractionFresnelParameters.leftColor, this.refractionFresnelParameters.power);
                        this._effect.setColor4("refractionRightColor", this.refractionFresnelParameters.rightColor, this.refractionFresnelParameters.bias);
                    }

                    if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                        this._effect.setColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                        this._effect.setColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                    }
                }

                // Textures     
                if (scene.texturesEnabled) {
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
                        this._effect.setFloat2("vReflectionInfos", this.reflectionTexture.level, this.roughness);
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

                    if (this.specularTexture && StandardMaterial.SpecularTextureEnabled) {
                        this._effect.setTexture("specularSampler", this.specularTexture);

                        this._effect.setFloat2("vSpecularInfos", this.specularTexture.coordinatesIndex, this.specularTexture.level);
                        this._effect.setMatrix("specularMatrix", this.specularTexture.getTextureMatrix());
                    }

                    if (this.bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled) {
                        this._effect.setTexture("bumpSampler", this.bumpTexture);

                        this._effect.setFloat3("vBumpInfos", this.bumpTexture.coordinatesIndex, 1.0 / this.bumpTexture.level, this.parallaxScaleBias);
                        this._effect.setMatrix("bumpMatrix", this.bumpTexture.getTextureMatrix());
                    }

                    if (this.refractionTexture && StandardMaterial.RefractionTextureEnabled) {
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
                    
                    if (this.cameraColorGradingTexture && StandardMaterial.ColorGradingTextureEnabled) {
                        ColorGradingTexture.Bind(this.cameraColorGradingTexture, this._effect);
                    }
                }

                // Clip plane
                MaterialHelper.BindClipPlane(this._effect, scene);

                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }

                // Colors
                scene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);

                this._effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
                this._effect.setColor3("vAmbientColor", this._globalAmbientColor);

                if (this._defines.SPECULARTERM) {
                    this._effect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
                }
                this._effect.setColor3("vEmissiveColor", this.emissiveColor);
            }

            if (scene.getCachedMaterial() !== this || !this.isFrozen) {
                // Diffuse
                this._effect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);

                // Lights
                if (scene.lightsEnabled && !this.disableLighting) {
                    MaterialHelper.BindLights(scene, mesh, this._effect, this._defines, this.maxSimultaneousLights);
                }

                // View
                if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE || this.reflectionTexture || this.refractionTexture) {
                    this._effect.setMatrix("view", scene.getViewMatrix());
                }

                // Fog
                MaterialHelper.BindFogParameters(scene, mesh, this._effect);

                // Log. depth
                MaterialHelper.BindLogDepth(this._defines, this._effect, scene);

                // Color Curves
                if (this.cameraColorCurves) {
                    ColorCurves.Bind(this.cameraColorCurves, this._effect);
                }
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

        public clone(name: string): StandardMaterial {
            return SerializationHelper.Clone(() => new StandardMaterial(name, this.getScene()), this);
        }

        public serialize(): any {
            return SerializationHelper.Serialize(this);
        }

        // Statics
        public static Parse(source: any, scene: Scene, rootUrl: string): StandardMaterial {
            return SerializationHelper.Parse(() => new StandardMaterial(source.name, scene), source, scene, rootUrl);
        }

        // Flags used to enable or disable a type of texture for all Standard Materials
        public static DiffuseTextureEnabled = true;
        public static AmbientTextureEnabled = true;
        public static OpacityTextureEnabled = true;
        public static ReflectionTextureEnabled = true;
        public static EmissiveTextureEnabled = true;
        public static SpecularTextureEnabled = true;
        public static BumpTextureEnabled = true;
        public static FresnelEnabled = true;
        public static LightmapTextureEnabled = true;
        public static RefractionTextureEnabled = true;        
        public static ColorGradingTextureEnabled = true;
    }
} 
