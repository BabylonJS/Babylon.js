/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var CustomShaderHelper = (function () {
        function CustomShaderHelper() {
        }
        return CustomShaderHelper;
    }());
    BABYLON.CustomShaderHelper = CustomShaderHelper;
    var CustomMaterial = (function (_super) {
        __extends(CustomMaterial, _super);
        function CustomMaterial(name, builder, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this._mainPart = 'void main(void) {';
            _this._diffusePart = 'vec3 diffuseColor=vDiffuseColor.rgb;';
            _this._vertexPositionPart = 'gl_Position=viewProjection*finalWorld*vec4(position,1.0);';
            _this.builder = builder;
            return _this;
        }
        CustomMaterial.prototype.isReady = function (mesh, useInstances) {
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
                needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines, this.maxSimultaneousLights);
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
                if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.diffuseTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.DIFFUSE = true;
                    }
                }
                if (this.ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                    if (!this.ambientTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.AMBIENT = true;
                    }
                }
                if (this.opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                    if (!this.opacityTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.OPACITY = true;
                        if (this.opacityTexture.getAlphaFromRGB) {
                            this._defines.OPACITYRGB = true;
                        }
                    }
                }
                if (this.reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                    if (!this.reflectionTexture.isReady()) {
                        return false;
                    }
                    else {
                        needNormals = true;
                        this._defines.REFLECTION = true;
                        if (this.roughness > 0) {
                            this._defines.ROUGHNESS = true;
                        }
                        if (this.useReflectionOverAlpha) {
                            this._defines.REFLECTIONOVERALPHA = true;
                        }
                        if (this.reflectionTexture.coordinatesMode === BABYLON.Texture.INVCUBIC_MODE) {
                            this._defines.INVERTCUBICMAP = true;
                        }
                        this._defines.REFLECTIONMAP_3D = this.reflectionTexture.isCube;
                        switch (this.reflectionTexture.coordinatesMode) {
                            case BABYLON.Texture.CUBIC_MODE:
                            case BABYLON.Texture.INVCUBIC_MODE:
                                this._defines.REFLECTIONMAP_CUBIC = true;
                                break;
                            case BABYLON.Texture.EXPLICIT_MODE:
                                this._defines.REFLECTIONMAP_EXPLICIT = true;
                                break;
                            case BABYLON.Texture.PLANAR_MODE:
                                this._defines.REFLECTIONMAP_PLANAR = true;
                                break;
                            case BABYLON.Texture.PROJECTION_MODE:
                                this._defines.REFLECTIONMAP_PROJECTION = true;
                                break;
                            case BABYLON.Texture.SKYBOX_MODE:
                                this._defines.REFLECTIONMAP_SKYBOX = true;
                                break;
                            case BABYLON.Texture.SPHERICAL_MODE:
                                this._defines.REFLECTIONMAP_SPHERICAL = true;
                                break;
                            case BABYLON.Texture.EQUIRECTANGULAR_MODE:
                                this._defines.REFLECTIONMAP_EQUIRECTANGULAR = true;
                                break;
                            case BABYLON.Texture.FIXED_EQUIRECTANGULAR_MODE:
                                this._defines.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = true;
                                break;
                        }
                    }
                }
                if (this.emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                    if (!this.emissiveTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.EMISSIVE = true;
                    }
                }
                if (this.lightmapTexture && BABYLON.StandardMaterial.LightmapTextureEnabled) {
                    if (!this.lightmapTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.LIGHTMAP = true;
                        this._defines.USELIGHTMAPASSHADOWMAP = this.useLightmapAsShadowmap;
                    }
                }
                if (this.specularTexture && BABYLON.StandardMaterial.SpecularTextureEnabled) {
                    if (!this.specularTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.SPECULAR = true;
                        this._defines.GLOSSINESS = this.useGlossinessFromSpecularMapAlpha;
                    }
                }
                if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled) {
                    if (!this.bumpTexture.isReady()) {
                        return false;
                    }
                    else {
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
                if (this.refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                    if (!this.refractionTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.REFRACTION = true;
                        this._defines.REFRACTIONMAP_3D = this.refractionTexture.isCube;
                    }
                }
                if (this.cameraColorGradingTexture && BABYLON.StandardMaterial.ColorGradingTextureEnabled) {
                    if (!this.cameraColorGradingTexture.isReady()) {
                        return false;
                    }
                    else {
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
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }
            if (BABYLON.StandardMaterial.FresnelEnabled) {
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
                if (needNormals && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                }
                if (needUVs) {
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                        this._defines.UV1 = true;
                    }
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                        this._defines.UV2 = true;
                    }
                }
                if (mesh.useVertexColors && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
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
                var fallbacks = new BABYLON.EffectFallbacks();
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
                BABYLON.MaterialHelper.HandleFallbacksForShadows(this._defines, fallbacks, this.maxSimultaneousLights);
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
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (this._defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (this._defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (this._defines.UV2) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
                }
                if (this._defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, this._defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, this._defines);
                var shaderName = "default";
                if (this.builder) {
                    shaderName = this.builder(new CustomShaderHelper(), shaderName, this._mainPart, this._diffusePart, this._vertexPositionPart);
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
                var samplers = ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler"];
                if (this._defines.CAMERACOLORCURVES) {
                    BABYLON.ColorCurves.PrepareUniforms(uniforms);
                }
                if (this._defines.CAMERACOLORGRADING) {
                    BABYLON.ColorGradingTexture.PrepareUniformsAndSamplers(uniforms, samplers);
                }
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList(uniforms, samplers, this._defines, this.maxSimultaneousLights);
                this._effect = scene.getEngine().createEffect(shaderName, attribs, uniforms, samplers, join, fallbacks, this.onCompiled, this.onError, { maxSimultaneousLights: this.maxSimultaneousLights - 1 });
            }
            if (!this._effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new BABYLON.StandardMaterialDefines();
                }
                this._defines.cloneTo(mesh._materialDefines);
            }
            return true;
        };
        return CustomMaterial;
    }(BABYLON.StandardMaterial));
    BABYLON.CustomMaterial = CustomMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.customMaterial.js.map
