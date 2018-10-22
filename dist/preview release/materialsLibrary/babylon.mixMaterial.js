/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var MixMaterialDefines = /** @class */ (function (_super) {
        __extends(MixMaterialDefines, _super);
        function MixMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.CLIPPLANE = false;
            _this.CLIPPLANE2 = false;
            _this.CLIPPLANE3 = false;
            _this.CLIPPLANE4 = false;
            _this.ALPHATEST = false;
            _this.DEPTHPREPASS = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.SPECULARTERM = false;
            _this.NORMAL = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.MIXMAP2 = false;
            _this.rebuild();
            return _this;
        }
        return MixMaterialDefines;
    }(BABYLON.MaterialDefines));
    var MixMaterial = /** @class */ (function (_super) {
        __extends(MixMaterial, _super);
        function MixMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            /**
             * Uniforms
             */
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this.specularColor = new BABYLON.Color3(0, 0, 0);
            _this.specularPower = 64;
            _this._disableLighting = false;
            _this._maxSimultaneousLights = 4;
            return _this;
        }
        MixMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        MixMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        MixMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods
        MixMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new MixMaterialDefines();
            }
            var defines = subMesh._materialDefines;
            var scene = this.getScene();
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }
            var engine = scene.getEngine();
            // Textures
            if (scene.texturesEnabled) {
                if (BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    if (this._mixTexture1) {
                        if (!this._mixTexture1.isReady()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.DIFFUSE = true;
                        }
                    }
                    if (this._mixTexture2) {
                        if (!this._mixTexture2.isReady()) {
                            return false;
                        }
                        else {
                            defines.MIXMAP2 = true;
                        }
                    }
                }
            }
            // Misc.
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);
            // Lights
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false);
            // Attribs
            BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);
            // Get correct effect
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                BABYLON.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);
                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (defines.UV2) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
                }
                if (defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, defines);
                // Legacy browser patch
                var shaderName = "mix";
                var join = defines.toString();
                var uniforms = [
                    "world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor", "vSpecularColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vTextureInfos",
                    "mBones",
                    "vClipPlane", "vClipPlane2", "vClipPlane3", "vClipPlane4", "textureMatrix",
                    "diffuse1Infos", "diffuse2Infos", "diffuse3Infos", "diffuse4Infos",
                    "diffuse5Infos", "diffuse6Infos", "diffuse7Infos", "diffuse8Infos"
                ];
                var samplers = [
                    "mixMap1Sampler", "mixMap2Sampler",
                    "diffuse1Sampler", "diffuse2Sampler", "diffuse3Sampler", "diffuse4Sampler",
                    "diffuse5Sampler", "diffuse6Sampler", "diffuse7Sampler", "diffuse8Sampler"
                ];
                var uniformBuffers = new Array();
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList({
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: defines,
                    maxSimultaneousLights: this.maxSimultaneousLights
                });
                subMesh.setEffect(scene.getEngine().createEffect(shaderName, {
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights }
                }, engine), defines);
            }
            if (!subMesh.effect || !subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        MixMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            if (!effect) {
                return;
            }
            this._activeEffect = effect;
            // Matrices
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            if (this._mustRebind(scene, effect)) {
                // Textures
                if (this._mixTexture1) {
                    this._activeEffect.setTexture("mixMap1Sampler", this._mixTexture1);
                    this._activeEffect.setFloat2("vTextureInfos", this._mixTexture1.coordinatesIndex, this._mixTexture1.level);
                    this._activeEffect.setMatrix("textureMatrix", this._mixTexture1.getTextureMatrix());
                    if (BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        if (this._diffuseTexture1) {
                            this._activeEffect.setTexture("diffuse1Sampler", this._diffuseTexture1);
                            this._activeEffect.setFloat2("diffuse1Infos", this._diffuseTexture1.uScale, this._diffuseTexture1.vScale);
                        }
                        if (this._diffuseTexture2) {
                            this._activeEffect.setTexture("diffuse2Sampler", this._diffuseTexture2);
                            this._activeEffect.setFloat2("diffuse2Infos", this._diffuseTexture2.uScale, this._diffuseTexture2.vScale);
                        }
                        if (this._diffuseTexture3) {
                            this._activeEffect.setTexture("diffuse3Sampler", this._diffuseTexture3);
                            this._activeEffect.setFloat2("diffuse3Infos", this._diffuseTexture3.uScale, this._diffuseTexture3.vScale);
                        }
                        if (this._diffuseTexture4) {
                            this._activeEffect.setTexture("diffuse4Sampler", this._diffuseTexture4);
                            this._activeEffect.setFloat2("diffuse4Infos", this._diffuseTexture4.uScale, this._diffuseTexture4.vScale);
                        }
                    }
                }
                if (this._mixTexture2) {
                    this._activeEffect.setTexture("mixMap2Sampler", this._mixTexture2);
                    if (BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        if (this._diffuseTexture5) {
                            this._activeEffect.setTexture("diffuse5Sampler", this._diffuseTexture5);
                            this._activeEffect.setFloat2("diffuse5Infos", this._diffuseTexture5.uScale, this._diffuseTexture5.vScale);
                        }
                        if (this._diffuseTexture6) {
                            this._activeEffect.setTexture("diffuse6Sampler", this._diffuseTexture6);
                            this._activeEffect.setFloat2("diffuse6Infos", this._diffuseTexture6.uScale, this._diffuseTexture6.vScale);
                        }
                        if (this._diffuseTexture7) {
                            this._activeEffect.setTexture("diffuse7Sampler", this._diffuseTexture7);
                            this._activeEffect.setFloat2("diffuse7Infos", this._diffuseTexture7.uScale, this._diffuseTexture7.vScale);
                        }
                        if (this._diffuseTexture8) {
                            this._activeEffect.setTexture("diffuse8Sampler", this._diffuseTexture8);
                            this._activeEffect.setFloat2("diffuse8Infos", this._diffuseTexture8.uScale, this._diffuseTexture8.vScale);
                        }
                    }
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                BABYLON.MaterialHelper.BindEyePosition(effect, scene);
            }
            this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
            if (defines.SPECULARTERM) {
                this._activeEffect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
            }
            if (scene.lightsEnabled && !this.disableLighting) {
                BABYLON.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            this._afterBind(mesh, this._activeEffect);
        };
        MixMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this._mixTexture1 && this._mixTexture1.animations && this._mixTexture1.animations.length > 0) {
                results.push(this._mixTexture1);
            }
            if (this._mixTexture2 && this._mixTexture2.animations && this._mixTexture2.animations.length > 0) {
                results.push(this._mixTexture2);
            }
            return results;
        };
        MixMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            // Mix map 1
            if (this._mixTexture1) {
                activeTextures.push(this._mixTexture1);
            }
            if (this._diffuseTexture1) {
                activeTextures.push(this._diffuseTexture1);
            }
            if (this._diffuseTexture2) {
                activeTextures.push(this._diffuseTexture2);
            }
            if (this._diffuseTexture3) {
                activeTextures.push(this._diffuseTexture3);
            }
            if (this._diffuseTexture4) {
                activeTextures.push(this._diffuseTexture4);
            }
            // Mix map 2
            if (this._mixTexture2) {
                activeTextures.push(this._mixTexture2);
            }
            if (this._diffuseTexture5) {
                activeTextures.push(this._diffuseTexture5);
            }
            if (this._diffuseTexture6) {
                activeTextures.push(this._diffuseTexture6);
            }
            if (this._diffuseTexture7) {
                activeTextures.push(this._diffuseTexture7);
            }
            if (this._diffuseTexture8) {
                activeTextures.push(this._diffuseTexture8);
            }
            return activeTextures;
        };
        MixMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            // Mix map 1
            if (this._mixTexture1 === texture) {
                return true;
            }
            if (this._diffuseTexture1 === texture) {
                return true;
            }
            if (this._diffuseTexture2 === texture) {
                return true;
            }
            if (this._diffuseTexture3 === texture) {
                return true;
            }
            if (this._diffuseTexture4 === texture) {
                return true;
            }
            // Mix map 2
            if (this._mixTexture2 === texture) {
                return true;
            }
            if (this._diffuseTexture5 === texture) {
                return true;
            }
            if (this._diffuseTexture6 === texture) {
                return true;
            }
            if (this._diffuseTexture7 === texture) {
                return true;
            }
            if (this._diffuseTexture8 === texture) {
                return true;
            }
            return false;
        };
        MixMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this._mixTexture1) {
                this._mixTexture1.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        MixMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new MixMaterial(name, _this.getScene()); }, this);
        };
        MixMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.MixMaterial";
            return serializationObject;
        };
        MixMaterial.prototype.getClassName = function () {
            return "MixMaterial";
        };
        // Statics
        MixMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new MixMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsTexture("mixTexture1")
        ], MixMaterial.prototype, "_mixTexture1", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], MixMaterial.prototype, "mixTexture1", void 0);
        __decorate([
            BABYLON.serializeAsTexture("mixTexture2")
        ], MixMaterial.prototype, "_mixTexture2", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], MixMaterial.prototype, "mixTexture2", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture1")
        ], MixMaterial.prototype, "_diffuseTexture1", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], MixMaterial.prototype, "diffuseTexture1", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture2")
        ], MixMaterial.prototype, "_diffuseTexture2", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], MixMaterial.prototype, "diffuseTexture2", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture3")
        ], MixMaterial.prototype, "_diffuseTexture3", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], MixMaterial.prototype, "diffuseTexture3", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture4")
        ], MixMaterial.prototype, "_diffuseTexture4", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], MixMaterial.prototype, "diffuseTexture4", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture1")
        ], MixMaterial.prototype, "_diffuseTexture5", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], MixMaterial.prototype, "diffuseTexture5", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture2")
        ], MixMaterial.prototype, "_diffuseTexture6", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], MixMaterial.prototype, "diffuseTexture6", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture3")
        ], MixMaterial.prototype, "_diffuseTexture7", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], MixMaterial.prototype, "diffuseTexture7", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture4")
        ], MixMaterial.prototype, "_diffuseTexture8", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], MixMaterial.prototype, "diffuseTexture8", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], MixMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], MixMaterial.prototype, "specularColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], MixMaterial.prototype, "specularPower", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], MixMaterial.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], MixMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], MixMaterial.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], MixMaterial.prototype, "maxSimultaneousLights", void 0);
        return MixMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.MixMaterial = MixMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.mixMaterial.js.map

BABYLON.Effect.ShadersStore['mixVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vTextureUV;\nuniform mat4 textureMatrix;\nuniform vec2 vTextureInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef DIFFUSE\nif (vTextureInfos.x == 0.)\n{\nvTextureUV=vec2(textureMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvTextureUV=vec2(textureMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['mixPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\n#ifdef DIFFUSE\nvarying vec2 vTextureUV;\nuniform sampler2D mixMap1Sampler;\nuniform vec2 vTextureInfos;\n#ifdef MIXMAP2\nuniform sampler2D mixMap2Sampler;\n#endif\nuniform sampler2D diffuse1Sampler;\nuniform sampler2D diffuse2Sampler;\nuniform sampler2D diffuse3Sampler;\nuniform sampler2D diffuse4Sampler;\nuniform vec2 diffuse1Infos;\nuniform vec2 diffuse2Infos;\nuniform vec2 diffuse3Infos;\nuniform vec2 diffuse4Infos;\n#ifdef MIXMAP2\nuniform sampler2D diffuse5Sampler;\nuniform sampler2D diffuse6Sampler;\nuniform sampler2D diffuse7Sampler;\nuniform sampler2D diffuse8Sampler;\nuniform vec2 diffuse5Infos;\nuniform vec2 diffuse6Infos;\nuniform vec2 diffuse7Infos;\nuniform vec2 diffuse8Infos;\n#endif\n#endif\n\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 finalMixColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n#ifdef MIXMAP2\nvec4 mixColor2=vec4(1.,1.,1.,1.);\n#endif\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#else\nfloat glossiness=0.;\n#endif\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n#ifdef DIFFUSE\nvec4 mixColor=texture2D(mixMap1Sampler,vTextureUV);\n#include<depthPrePass>\nmixColor.rgb*=vTextureInfos.y;\nvec4 diffuse1Color=texture2D(diffuse1Sampler,vTextureUV*diffuse1Infos);\nvec4 diffuse2Color=texture2D(diffuse2Sampler,vTextureUV*diffuse2Infos);\nvec4 diffuse3Color=texture2D(diffuse3Sampler,vTextureUV*diffuse3Infos);\nvec4 diffuse4Color=texture2D(diffuse4Sampler,vTextureUV*diffuse4Infos);\ndiffuse1Color.rgb*=mixColor.r;\ndiffuse2Color.rgb=mix(diffuse1Color.rgb,diffuse2Color.rgb,mixColor.g);\ndiffuse3Color.rgb=mix(diffuse2Color.rgb,diffuse3Color.rgb,mixColor.b);\nfinalMixColor.rgb=mix(diffuse3Color.rgb,diffuse4Color.rgb,1.0-mixColor.a);\n#ifdef MIXMAP2\nmixColor=texture2D(mixMap2Sampler,vTextureUV);\nmixColor.rgb*=vTextureInfos.y;\nvec4 diffuse5Color=texture2D(diffuse5Sampler,vTextureUV*diffuse5Infos);\nvec4 diffuse6Color=texture2D(diffuse6Sampler,vTextureUV*diffuse6Infos);\nvec4 diffuse7Color=texture2D(diffuse7Sampler,vTextureUV*diffuse7Infos);\nvec4 diffuse8Color=texture2D(diffuse8Sampler,vTextureUV*diffuse8Infos);\ndiffuse5Color.rgb=mix(finalMixColor.rgb,diffuse5Color.rgb,mixColor.r);\ndiffuse6Color.rgb=mix(diffuse5Color.rgb,diffuse6Color.rgb,mixColor.g);\ndiffuse7Color.rgb=mix(diffuse6Color.rgb,diffuse7Color.rgb,mixColor.b);\nfinalMixColor.rgb=mix(diffuse7Color.rgb,diffuse8Color.rgb,1.0-mixColor.a);\n#endif\n#endif\n#ifdef VERTEXCOLOR\nfinalMixColor.rgb*=vColor.rgb;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor*finalMixColor.rgb,0.0,1.0);\n\nvec4 color=vec4(finalDiffuse+finalSpecular,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}\n";
