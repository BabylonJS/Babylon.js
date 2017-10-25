var babylonDependency; try { babylonDependency = BABYLON || (typeof require !== 'undefined' && require("../babylon.max")); } catch (e) { babylonDependency = BABYLON || (typeof require !== 'undefined' && require("babylonjs")); } 
var BABYLON = babylonDependency;
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
    var ShadowOnlyMaterialDefines = /** @class */ (function (_super) {
        __extends(ShadowOnlyMaterialDefines, _super);
        function ShadowOnlyMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.CLIPPLANE = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.NORMAL = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.rebuild();
            return _this;
        }
        return ShadowOnlyMaterialDefines;
    }(BABYLON.MaterialDefines));
    var ShadowOnlyMaterial = /** @class */ (function (_super) {
        __extends(ShadowOnlyMaterial, _super);
        function ShadowOnlyMaterial(name, scene) {
            return _super.call(this, name, scene) || this;
        }
        ShadowOnlyMaterial.prototype.needAlphaBlending = function () {
            return true;
        };
        ShadowOnlyMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        ShadowOnlyMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        Object.defineProperty(ShadowOnlyMaterial.prototype, "activeLight", {
            get: function () {
                return this._activeLight;
            },
            set: function (light) {
                this._activeLight = light;
            },
            enumerable: true,
            configurable: true
        });
        // Methods   
        ShadowOnlyMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new ShadowOnlyMaterialDefines();
            }
            var defines = subMesh._materialDefines;
            var scene = this.getScene();
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }
            var engine = scene.getEngine();
            // Ensure that active light is the first shadow light
            if (this._activeLight) {
                for (var _i = 0, _a = mesh._lightSources; _i < _a.length; _i++) {
                    var light = _a[_i];
                    if (light.shadowEnabled) {
                        if (this._activeLight === light) {
                            break; // We are good
                        }
                        var lightPosition = mesh._lightSources.indexOf(this._activeLight);
                        if (lightPosition !== -1) {
                            mesh._lightSources.splice(lightPosition, 1);
                            mesh._lightSources.splice(0, 0, this._activeLight);
                        }
                        break;
                    }
                }
            }
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, 1);
            // Attribs
            BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, true);
            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                BABYLON.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, 1);
                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, defines);
                var shaderName = "shadowOnly";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType",
                    "vFogInfos", "vFogColor", "pointSize", "alpha",
                    "mBones",
                    "vClipPlane"
                ];
                var samplers = new Array();
                var uniformBuffers = new Array();
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList({
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: defines,
                    maxSimultaneousLights: 1
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
                    indexParameters: { maxSimultaneousLights: 1 }
                }, engine), defines);
            }
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        ShadowOnlyMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            if (this._mustRebind(scene, effect)) {
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setFloat("alpha", this.alpha);
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            // Lights
            if (scene.lightsEnabled) {
                BABYLON.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, 1);
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            this._afterBind(mesh, this._activeEffect);
        };
        ShadowOnlyMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new ShadowOnlyMaterial(name, _this.getScene()); }, this);
        };
        ShadowOnlyMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.ShadowOnlyMaterial";
            return serializationObject;
        };
        ShadowOnlyMaterial.prototype.getClassName = function () {
            return "ShadowOnlyMaterial";
        };
        // Statics
        ShadowOnlyMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new ShadowOnlyMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        return ShadowOnlyMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.ShadowOnlyMaterial = ShadowOnlyMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.shadowOnlyMaterial.js.map

BABYLON.Effect.ShadersStore['shadowOnlyVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['shadowOnlyPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform float alpha;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\nfloat glossiness=0.;\n#include<lightFragment>[0..1]\n\nvec4 color=vec4(0.,0.,0.,(1.0-clamp(shadow,0.,1.))*alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}";




var BABYLON;
(function (BABYLON) {
    var GradientMaterialDefines = /** @class */ (function (_super) {
        __extends(GradientMaterialDefines, _super);
        function GradientMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.DEPTHPREPASS = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.LIGHT0 = false;
            _this.LIGHT1 = false;
            _this.LIGHT2 = false;
            _this.LIGHT3 = false;
            _this.SPOTLIGHT0 = false;
            _this.SPOTLIGHT1 = false;
            _this.SPOTLIGHT2 = false;
            _this.SPOTLIGHT3 = false;
            _this.HEMILIGHT0 = false;
            _this.HEMILIGHT1 = false;
            _this.HEMILIGHT2 = false;
            _this.HEMILIGHT3 = false;
            _this.DIRLIGHT0 = false;
            _this.DIRLIGHT1 = false;
            _this.DIRLIGHT2 = false;
            _this.DIRLIGHT3 = false;
            _this.POINTLIGHT0 = false;
            _this.POINTLIGHT1 = false;
            _this.POINTLIGHT2 = false;
            _this.POINTLIGHT3 = false;
            _this.SHADOW0 = false;
            _this.SHADOW1 = false;
            _this.SHADOW2 = false;
            _this.SHADOW3 = false;
            _this.SHADOWS = false;
            _this.SHADOWESM0 = false;
            _this.SHADOWESM1 = false;
            _this.SHADOWESM2 = false;
            _this.SHADOWESM3 = false;
            _this.SHADOWPCF0 = false;
            _this.SHADOWPCF1 = false;
            _this.SHADOWPCF2 = false;
            _this.SHADOWPCF3 = false;
            _this.NORMAL = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.rebuild();
            return _this;
        }
        return GradientMaterialDefines;
    }(BABYLON.MaterialDefines));
    var GradientMaterial = /** @class */ (function (_super) {
        __extends(GradientMaterial, _super);
        function GradientMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this._maxSimultaneousLights = 4;
            // The gradient top color, red by default
            _this.topColor = new BABYLON.Color3(1, 0, 0);
            _this.topColorAlpha = 1.0;
            // The gradient top color, blue by default
            _this.bottomColor = new BABYLON.Color3(0, 0, 1);
            _this.bottomColorAlpha = 1.0;
            // Gradient offset
            _this.offset = 0;
            _this.smoothness = 1.0;
            _this.disableLighting = false;
            _this._scaledDiffuse = new BABYLON.Color3();
            return _this;
        }
        GradientMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0 || this.topColorAlpha < 1.0 || this.bottomColorAlpha < 1.0);
        };
        GradientMaterial.prototype.needAlphaTesting = function () {
            return true;
        };
        GradientMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        GradientMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new GradientMaterialDefines();
            }
            var defines = subMesh._materialDefines;
            var scene = this.getScene();
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }
            var engine = scene.getEngine();
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights);
            // Attribs
            BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, true);
            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                BABYLON.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks);
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
                var shaderName = "gradient";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix",
                    "topColor", "bottomColor", "offset", "smoothness"
                ];
                var samplers = ["diffuseSampler"];
                var uniformBuffers = new Array();
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList({
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: defines,
                    maxSimultaneousLights: 4
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
                    indexParameters: { maxSimultaneousLights: 4 }
                }, engine), defines);
            }
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        GradientMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._effect);
            if (this._mustRebind(scene, effect)) {
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._effect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._activeEffect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);
            if (scene.lightsEnabled && !this.disableLighting) {
                BABYLON.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines);
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            this._activeEffect.setColor4("topColor", this.topColor, this.topColorAlpha);
            this._activeEffect.setColor4("bottomColor", this.bottomColor, this.bottomColorAlpha);
            this._activeEffect.setFloat("offset", this.offset);
            this._activeEffect.setFloat("smoothness", this.smoothness);
            this._afterBind(mesh, this._activeEffect);
        };
        GradientMaterial.prototype.getAnimatables = function () {
            return [];
        };
        GradientMaterial.prototype.dispose = function (forceDisposeEffect) {
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        GradientMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new GradientMaterial(name, _this.getScene()); }, this);
        };
        GradientMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.GradientMaterial";
            return serializationObject;
        };
        GradientMaterial.prototype.getClassName = function () {
            return "GradientMaterial";
        };
        // Statics
        GradientMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new GradientMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], GradientMaterial.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], GradientMaterial.prototype, "maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], GradientMaterial.prototype, "topColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], GradientMaterial.prototype, "topColorAlpha", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], GradientMaterial.prototype, "bottomColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], GradientMaterial.prototype, "bottomColorAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], GradientMaterial.prototype, "offset", void 0);
        __decorate([
            BABYLON.serialize()
        ], GradientMaterial.prototype, "smoothness", void 0);
        __decorate([
            BABYLON.serialize()
        ], GradientMaterial.prototype, "disableLighting", void 0);
        return GradientMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.GradientMaterial = GradientMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.gradientMaterial.js.map

BABYLON.Effect.ShadersStore['gradientVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex> \ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef DIFFUSE\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['gradientPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n\nuniform vec4 topColor;\nuniform vec4 bottomColor;\nuniform float offset;\nuniform float smoothness;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0]\n#include<__decl__lightFragment>[1]\n#include<__decl__lightFragment>[2]\n#include<__decl__lightFragment>[3]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\nfloat h=normalize(vPositionW).y+offset;\nfloat mysmoothness=clamp(smoothness,0.01,max(smoothness,10.));\nvec4 baseColor=mix(bottomColor,topColor,max(pow(max(h,0.0),mysmoothness),0.0));\n\nvec3 diffuseColor=baseColor.rgb;\n\nfloat alpha=baseColor.a;\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\nfloat glossiness=0.;\n#include<lightFragment>[0]\n#include<lightFragment>[1]\n#include<lightFragment>[2]\n#include<lightFragment>[3]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;\n\nvec4 color=vec4(finalDiffuse,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}\n";




var BABYLON;
(function (BABYLON) {
    var NormalMaterialDefines = /** @class */ (function (_super) {
        __extends(NormalMaterialDefines, _super);
        function NormalMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.DEPTHPREPASS = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.LIGHT0 = false;
            _this.LIGHT1 = false;
            _this.LIGHT2 = false;
            _this.LIGHT3 = false;
            _this.SPOTLIGHT0 = false;
            _this.SPOTLIGHT1 = false;
            _this.SPOTLIGHT2 = false;
            _this.SPOTLIGHT3 = false;
            _this.HEMILIGHT0 = false;
            _this.HEMILIGHT1 = false;
            _this.HEMILIGHT2 = false;
            _this.HEMILIGHT3 = false;
            _this.DIRLIGHT0 = false;
            _this.DIRLIGHT1 = false;
            _this.DIRLIGHT2 = false;
            _this.DIRLIGHT3 = false;
            _this.POINTLIGHT0 = false;
            _this.POINTLIGHT1 = false;
            _this.POINTLIGHT2 = false;
            _this.POINTLIGHT3 = false;
            _this.SHADOW0 = false;
            _this.SHADOW1 = false;
            _this.SHADOW2 = false;
            _this.SHADOW3 = false;
            _this.SHADOWS = false;
            _this.SHADOWESM0 = false;
            _this.SHADOWESM1 = false;
            _this.SHADOWESM2 = false;
            _this.SHADOWESM3 = false;
            _this.SHADOWPCF0 = false;
            _this.SHADOWPCF1 = false;
            _this.SHADOWPCF2 = false;
            _this.SHADOWPCF3 = false;
            _this.NORMAL = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.rebuild();
            return _this;
        }
        return NormalMaterialDefines;
    }(BABYLON.MaterialDefines));
    var NormalMaterial = /** @class */ (function (_super) {
        __extends(NormalMaterial, _super);
        function NormalMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this._disableLighting = false;
            _this._maxSimultaneousLights = 4;
            return _this;
        }
        NormalMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        NormalMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        NormalMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        NormalMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new NormalMaterialDefines();
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
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        if (!this._diffuseTexture.isReady()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.DIFFUSE = true;
                        }
                    }
                }
            }
            // Misc.
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            // Lights
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
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
                BABYLON.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks);
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
                var shaderName = "normal";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix"
                ];
                var samplers = ["diffuseSampler"];
                var uniformBuffers = new Array();
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList({
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: defines,
                    maxSimultaneousLights: 4
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
                    indexParameters: { maxSimultaneousLights: 4 }
                }, engine), defines);
            }
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        NormalMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._activeEffect.setTexture("diffuseSampler", this.diffuseTexture);
                    this._activeEffect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                    this._activeEffect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
            // Lights
            if (scene.lightsEnabled && !this.disableLighting) {
                BABYLON.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines);
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            this._afterBind(mesh, this._activeEffect);
        };
        NormalMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }
            return results;
        };
        NormalMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._diffuseTexture) {
                activeTextures.push(this._diffuseTexture);
            }
            return activeTextures;
        };
        NormalMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this.diffuseTexture === texture) {
                return true;
            }
            return false;
        };
        NormalMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        NormalMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new NormalMaterial(name, _this.getScene()); }, this);
        };
        NormalMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.NormalMaterial";
            return serializationObject;
        };
        NormalMaterial.prototype.getClassName = function () {
            return "NormalMaterial";
        };
        // Statics
        NormalMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new NormalMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture")
        ], NormalMaterial.prototype, "_diffuseTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], NormalMaterial.prototype, "diffuseTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], NormalMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], NormalMaterial.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], NormalMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], NormalMaterial.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], NormalMaterial.prototype, "maxSimultaneousLights", void 0);
        return NormalMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.NormalMaterial = NormalMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.normalMaterial.js.map

BABYLON.Effect.ShadersStore['normalVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef DIFFUSE\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['normalPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0]\n#include<__decl__lightFragment>[1]\n#include<__decl__lightFragment>[2]\n#include<__decl__lightFragment>[3]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#include<depthPrePass>\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#ifdef NORMAL\nbaseColor=mix(baseColor,vec4(vNormalW,1.0),0.5);\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\nfloat glossiness=0.;\n#include<lightFragment>[0]\n#include<lightFragment>[1]\n#include<lightFragment>[2]\n#include<lightFragment>[3]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;\n\nvec4 color=vec4(finalDiffuse,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}";




var BABYLON;
(function (BABYLON) {
    var LavaMaterialDefines = /** @class */ (function (_super) {
        __extends(LavaMaterialDefines, _super);
        function LavaMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.DEPTHPREPASS = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.LIGHT0 = false;
            _this.LIGHT1 = false;
            _this.LIGHT2 = false;
            _this.LIGHT3 = false;
            _this.SPOTLIGHT0 = false;
            _this.SPOTLIGHT1 = false;
            _this.SPOTLIGHT2 = false;
            _this.SPOTLIGHT3 = false;
            _this.HEMILIGHT0 = false;
            _this.HEMILIGHT1 = false;
            _this.HEMILIGHT2 = false;
            _this.HEMILIGHT3 = false;
            _this.DIRLIGHT0 = false;
            _this.DIRLIGHT1 = false;
            _this.DIRLIGHT2 = false;
            _this.DIRLIGHT3 = false;
            _this.POINTLIGHT0 = false;
            _this.POINTLIGHT1 = false;
            _this.POINTLIGHT2 = false;
            _this.POINTLIGHT3 = false;
            _this.SHADOW0 = false;
            _this.SHADOW1 = false;
            _this.SHADOW2 = false;
            _this.SHADOW3 = false;
            _this.SHADOWS = false;
            _this.SHADOWESM0 = false;
            _this.SHADOWESM1 = false;
            _this.SHADOWESM2 = false;
            _this.SHADOWESM3 = false;
            _this.SHADOWPCF0 = false;
            _this.SHADOWPCF1 = false;
            _this.SHADOWPCF2 = false;
            _this.SHADOWPCF3 = false;
            _this.NORMAL = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.rebuild();
            return _this;
        }
        return LavaMaterialDefines;
    }(BABYLON.MaterialDefines));
    var LavaMaterial = /** @class */ (function (_super) {
        __extends(LavaMaterial, _super);
        function LavaMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.speed = 1;
            _this.movingSpeed = 1;
            _this.lowFrequencySpeed = 1;
            _this.fogDensity = 0.15;
            _this._lastTime = 0;
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this._disableLighting = false;
            _this._maxSimultaneousLights = 4;
            _this._scaledDiffuse = new BABYLON.Color3();
            return _this;
        }
        LavaMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        LavaMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        LavaMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        LavaMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new LavaMaterialDefines();
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
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        if (!this._diffuseTexture.isReady()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.DIFFUSE = true;
                        }
                    }
                }
            }
            // Misc.
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            // Lights
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
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
                BABYLON.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks);
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
                var shaderName = "lava";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix",
                    "time", "speed", "movingSpeed",
                    "fogColor", "fogDensity", "lowFrequencySpeed"
                ];
                var samplers = ["diffuseSampler",
                    "noiseTexture"
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
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        LavaMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._activeEffect.setTexture("diffuseSampler", this.diffuseTexture);
                    this._activeEffect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                    this._activeEffect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
                }
                if (this.noiseTexture) {
                    this._activeEffect.setTexture("noiseTexture", this.noiseTexture);
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._activeEffect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);
            if (scene.lightsEnabled && !this.disableLighting) {
                BABYLON.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines);
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            this._lastTime += scene.getEngine().getDeltaTime();
            this._activeEffect.setFloat("time", this._lastTime * this.speed / 1000);
            if (!this.fogColor) {
                this.fogColor = BABYLON.Color3.Black();
            }
            this._activeEffect.setColor3("fogColor", this.fogColor);
            this._activeEffect.setFloat("fogDensity", this.fogDensity);
            this._activeEffect.setFloat("lowFrequencySpeed", this.lowFrequencySpeed);
            this._activeEffect.setFloat("movingSpeed", this.movingSpeed);
            this._afterBind(mesh, this._activeEffect);
        };
        LavaMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }
            if (this.noiseTexture && this.noiseTexture.animations && this.noiseTexture.animations.length > 0) {
                results.push(this.noiseTexture);
            }
            return results;
        };
        LavaMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._diffuseTexture) {
                activeTextures.push(this._diffuseTexture);
            }
            return activeTextures;
        };
        LavaMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this.diffuseTexture === texture) {
                return true;
            }
            return false;
        };
        LavaMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }
            if (this.noiseTexture) {
                this.noiseTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        LavaMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new LavaMaterial(name, _this.getScene()); }, this);
        };
        LavaMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.LavaMaterial";
            return serializationObject;
        };
        LavaMaterial.prototype.getClassName = function () {
            return "LavaMaterial";
        };
        // Statics
        LavaMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new LavaMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture")
        ], LavaMaterial.prototype, "_diffuseTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], LavaMaterial.prototype, "diffuseTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LavaMaterial.prototype, "noiseTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], LavaMaterial.prototype, "fogColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], LavaMaterial.prototype, "speed", void 0);
        __decorate([
            BABYLON.serialize()
        ], LavaMaterial.prototype, "movingSpeed", void 0);
        __decorate([
            BABYLON.serialize()
        ], LavaMaterial.prototype, "lowFrequencySpeed", void 0);
        __decorate([
            BABYLON.serialize()
        ], LavaMaterial.prototype, "fogDensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], LavaMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], LavaMaterial.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], LavaMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], LavaMaterial.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], LavaMaterial.prototype, "maxSimultaneousLights", void 0);
        return LavaMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.LavaMaterial = LavaMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.lavaMaterial.js.map

BABYLON.Effect.ShadersStore['lavaVertexShader'] = "precision highp float;\n\nuniform float time;\nuniform float lowFrequencySpeed;\n\nvarying float noise;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\n\n\nvec3 mod289(vec3 x)\n{\nreturn x-floor(x*(1.0/289.0))*289.0;\n}\nvec4 mod289(vec4 x)\n{\nreturn x-floor(x*(1.0/289.0))*289.0;\n}\nvec4 permute(vec4 x)\n{\nreturn mod289(((x*34.0)+1.0)*x);\n}\nvec4 taylorInvSqrt(vec4 r)\n{\nreturn 1.79284291400159-0.85373472095314*r;\n}\nvec3 fade(vec3 t) {\nreturn t*t*t*(t*(t*6.0-15.0)+10.0);\n}\n\nfloat pnoise(vec3 P,vec3 rep)\n{\nvec3 Pi0=mod(floor(P),rep); \nvec3 Pi1=mod(Pi0+vec3(1.0),rep); \nPi0=mod289(Pi0);\nPi1=mod289(Pi1);\nvec3 Pf0=fract(P); \nvec3 Pf1=Pf0-vec3(1.0); \nvec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);\nvec4 iy=vec4(Pi0.yy,Pi1.yy);\nvec4 iz0=Pi0.zzzz;\nvec4 iz1=Pi1.zzzz;\nvec4 ixy=permute(permute(ix)+iy);\nvec4 ixy0=permute(ixy+iz0);\nvec4 ixy1=permute(ixy+iz1);\nvec4 gx0=ixy0*(1.0/7.0);\nvec4 gy0=fract(floor(gx0)*(1.0/7.0))-0.5;\ngx0=fract(gx0);\nvec4 gz0=vec4(0.5)-abs(gx0)-abs(gy0);\nvec4 sz0=step(gz0,vec4(0.0));\ngx0-=sz0*(step(0.0,gx0)-0.5);\ngy0-=sz0*(step(0.0,gy0)-0.5);\nvec4 gx1=ixy1*(1.0/7.0);\nvec4 gy1=fract(floor(gx1)*(1.0/7.0))-0.5;\ngx1=fract(gx1);\nvec4 gz1=vec4(0.5)-abs(gx1)-abs(gy1);\nvec4 sz1=step(gz1,vec4(0.0));\ngx1-=sz1*(step(0.0,gx1)-0.5);\ngy1-=sz1*(step(0.0,gy1)-0.5);\nvec3 g000=vec3(gx0.x,gy0.x,gz0.x);\nvec3 g100=vec3(gx0.y,gy0.y,gz0.y);\nvec3 g010=vec3(gx0.z,gy0.z,gz0.z);\nvec3 g110=vec3(gx0.w,gy0.w,gz0.w);\nvec3 g001=vec3(gx1.x,gy1.x,gz1.x);\nvec3 g101=vec3(gx1.y,gy1.y,gz1.y);\nvec3 g011=vec3(gx1.z,gy1.z,gz1.z);\nvec3 g111=vec3(gx1.w,gy1.w,gz1.w);\nvec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));\ng000*=norm0.x;\ng010*=norm0.y;\ng100*=norm0.z;\ng110*=norm0.w;\nvec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));\ng001*=norm1.x;\ng011*=norm1.y;\ng101*=norm1.z;\ng111*=norm1.w;\nfloat n000=dot(g000,Pf0);\nfloat n100=dot(g100,vec3(Pf1.x,Pf0.yz));\nfloat n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z));\nfloat n110=dot(g110,vec3(Pf1.xy,Pf0.z));\nfloat n001=dot(g001,vec3(Pf0.xy,Pf1.z));\nfloat n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));\nfloat n011=dot(g011,vec3(Pf0.x,Pf1.yz));\nfloat n111=dot(g111,Pf1);\nvec3 fade_xyz=fade(Pf0);\nvec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);\nvec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);\nfloat n_xyz=mix(n_yz.x,n_yz.y,fade_xyz.x);\nreturn 2.2*n_xyz;\n}\n\nfloat turbulence( vec3 p ) {\nfloat w=100.0;\nfloat t=-.5;\nfor (float f=1.0 ; f<=10.0 ; f++ ){\nfloat power=pow( 2.0,f );\nt+=abs( pnoise( vec3( power*p ),vec3( 10.0,10.0,10.0 ) )/power );\n}\nreturn t;\n}\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\n#ifdef NORMAL\n\nnoise=10.0*-.10*turbulence( .5*normal+time*1.15 );\n\nfloat b=lowFrequencySpeed*5.0*pnoise( 0.05*position +vec3(time*1.025),vec3( 100.0 ) );\n\nfloat displacement =-1.5*noise+b;\n\nvec3 newPosition=position+normal*displacement;\ngl_Position=viewProjection*finalWorld*vec4( newPosition,1.0 );\nvec4 worldPos=finalWorld*vec4(newPosition,1.0);\nvPositionW=vec3(worldPos);\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef DIFFUSE\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}";
BABYLON.Effect.ShadersStore['lavaPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n\nvarying vec3 vPositionW;\n\nuniform float time;\nuniform float speed;\nuniform float movingSpeed;\nuniform vec3 fogColor;\nuniform sampler2D noiseTexture;\nuniform float fogDensity;\n\nvarying float noise;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0]\n#include<__decl__lightFragment>[1]\n#include<__decl__lightFragment>[2]\n#include<__decl__lightFragment>[3]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nfloat random( vec3 scale,float seed ){\nreturn fract( sin( dot( gl_FragCoord.xyz+seed,scale ) )*43758.5453+seed ) ;\n}\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n#ifdef DIFFUSE\n\nvec4 noiseTex=texture2D( noiseTexture,vDiffuseUV );\nvec2 T1=vDiffuseUV+vec2( 1.5,-1.5 )*time*0.02;\nvec2 T2=vDiffuseUV+vec2( -0.5,2.0 )*time*0.01*speed;\nT1.x+=noiseTex.x*2.0;\nT1.y+=noiseTex.y*2.0;\nT2.x-=noiseTex.y*0.2+time*0.001*movingSpeed;\nT2.y+=noiseTex.z*0.2+time*0.002*movingSpeed;\nfloat p=texture2D( noiseTexture,T1*3.0 ).a;\nvec4 lavaColor=texture2D( diffuseSampler,T2*4.0);\nvec4 temp=lavaColor*( vec4( p,p,p,p )*2. )+( lavaColor*lavaColor-0.1 );\nbaseColor=temp;\nfloat depth=gl_FragCoord.z*4.0;\nconst float LOG2=1.442695;\nfloat fogFactor=exp2(-fogDensity*fogDensity*depth*depth*LOG2 );\nfogFactor=1.0-clamp( fogFactor,0.0,1.0 );\nbaseColor=mix( baseColor,vec4( fogColor,baseColor.w ),fogFactor );\ndiffuseColor=baseColor.rgb;\n\n\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#include<depthPrePass>\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\nfloat glossiness=0.;\n#include<lightFragment>[0]\n#include<lightFragment>[1]\n#include<lightFragment>[2]\n#include<lightFragment>[3]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;\n\nvec4 color=vec4(finalDiffuse,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}";




var BABYLON;
(function (BABYLON) {
    var SimpleMaterialDefines = /** @class */ (function (_super) {
        __extends(SimpleMaterialDefines, _super);
        function SimpleMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.DEPTHPREPASS = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.NORMAL = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.rebuild();
            return _this;
        }
        return SimpleMaterialDefines;
    }(BABYLON.MaterialDefines));
    var SimpleMaterial = /** @class */ (function (_super) {
        __extends(SimpleMaterial, _super);
        function SimpleMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this._disableLighting = false;
            _this._maxSimultaneousLights = 4;
            return _this;
        }
        SimpleMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        SimpleMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        SimpleMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        SimpleMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new SimpleMaterialDefines();
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
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        if (!this._diffuseTexture.isReady()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.DIFFUSE = true;
                        }
                    }
                }
            }
            // Misc.
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            // Lights
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
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
                var shaderName = "simple";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix"
                ];
                var samplers = ["diffuseSampler"];
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
                    indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights - 1 }
                }, engine), defines);
            }
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        SimpleMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._activeEffect.setTexture("diffuseSampler", this._diffuseTexture);
                    this._activeEffect.setFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                    this._activeEffect.setMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
            // Lights
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
        SimpleMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this._diffuseTexture && this._diffuseTexture.animations && this._diffuseTexture.animations.length > 0) {
                results.push(this._diffuseTexture);
            }
            return results;
        };
        SimpleMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._diffuseTexture) {
                activeTextures.push(this._diffuseTexture);
            }
            return activeTextures;
        };
        SimpleMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this.diffuseTexture === texture) {
                return true;
            }
            return false;
        };
        SimpleMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this._diffuseTexture) {
                this._diffuseTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        SimpleMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new SimpleMaterial(name, _this.getScene()); }, this);
        };
        SimpleMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.SimpleMaterial";
            return serializationObject;
        };
        SimpleMaterial.prototype.getClassName = function () {
            return "SimpleMaterial";
        };
        // Statics
        SimpleMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new SimpleMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture")
        ], SimpleMaterial.prototype, "_diffuseTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], SimpleMaterial.prototype, "diffuseTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3("diffuseColor")
        ], SimpleMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], SimpleMaterial.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], SimpleMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], SimpleMaterial.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], SimpleMaterial.prototype, "maxSimultaneousLights", void 0);
        return SimpleMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.SimpleMaterial = SimpleMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.simpleMaterial.js.map

BABYLON.Effect.ShadersStore['simpleVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef DIFFUSE\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['simplePixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#include<depthPrePass>\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\nfloat glossiness=0.;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif \n#include<lightFragment>[0..maxSimultaneousLights]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;\n\nvec4 color=vec4(finalDiffuse,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}";




var BABYLON;
(function (BABYLON) {
    var WaterMaterialDefines = /** @class */ (function (_super) {
        __extends(WaterMaterialDefines, _super);
        function WaterMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.BUMP = false;
            _this.REFLECTION = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.DEPTHPREPASS = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.NORMAL = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.SPECULARTERM = false;
            _this.LOGARITHMICDEPTH = false;
            _this.FRESNELSEPARATE = false;
            _this.BUMPSUPERIMPOSE = false;
            _this.BUMPAFFECTSREFLECTION = false;
            _this.rebuild();
            return _this;
        }
        return WaterMaterialDefines;
    }(BABYLON.MaterialDefines));
    var WaterMaterial = /** @class */ (function (_super) {
        __extends(WaterMaterial, _super);
        /**
        * Constructor
        */
        function WaterMaterial(name, scene, renderTargetSize) {
            if (renderTargetSize === void 0) { renderTargetSize = new BABYLON.Vector2(512, 512); }
            var _this = _super.call(this, name, scene) || this;
            _this.renderTargetSize = renderTargetSize;
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this.specularColor = new BABYLON.Color3(0, 0, 0);
            _this.specularPower = 64;
            _this._disableLighting = false;
            _this._maxSimultaneousLights = 4;
            /**
            * @param {number}: Represents the wind force
            */
            _this.windForce = 6;
            /**
            * @param {Vector2}: The direction of the wind in the plane (X, Z)
            */
            _this.windDirection = new BABYLON.Vector2(0, 1);
            /**
            * @param {number}: Wave height, represents the height of the waves
            */
            _this.waveHeight = 0.4;
            /**
            * @param {number}: Bump height, represents the bump height related to the bump map
            */
            _this.bumpHeight = 0.4;
            /**
             * @param {boolean}: Add a smaller moving bump to less steady waves.
             */
            _this._bumpSuperimpose = false;
            /**
             * @param {boolean}: Color refraction and reflection differently with .waterColor2 and .colorBlendFactor2. Non-linear (physically correct) fresnel.
             */
            _this._fresnelSeparate = false;
            /**
             * @param {boolean}: bump Waves modify the reflection.
             */
            _this._bumpAffectsReflection = false;
            /**
            * @param {number}: The water color blended with the refraction (near)
            */
            _this.waterColor = new BABYLON.Color3(0.1, 0.1, 0.6);
            /**
            * @param {number}: The blend factor related to the water color
            */
            _this.colorBlendFactor = 0.2;
            /**
             * @param {number}: The water color blended with the reflection (far)
             */
            _this.waterColor2 = new BABYLON.Color3(0.1, 0.1, 0.6);
            /**
             * @param {number}: The blend factor related to the water color (reflection, far)
             */
            _this.colorBlendFactor2 = 0.2;
            /**
            * @param {number}: Represents the maximum length of a wave
            */
            _this.waveLength = 0.1;
            /**
            * @param {number}: Defines the waves speed
            */
            _this.waveSpeed = 1.0;
            _this._renderTargets = new BABYLON.SmartArray(16);
            /*
            * Private members
            */
            _this._mesh = null;
            _this._reflectionTransform = BABYLON.Matrix.Zero();
            _this._lastTime = 0;
            _this._lastDeltaTime = 0;
            _this._createRenderTargets(scene, renderTargetSize);
            // Create render targets
            _this.getRenderTargetTextures = function () {
                _this._renderTargets.reset();
                _this._renderTargets.push(_this._reflectionRTT);
                _this._renderTargets.push(_this._refractionRTT);
                return _this._renderTargets;
            };
            return _this;
        }
        Object.defineProperty(WaterMaterial.prototype, "useLogarithmicDepth", {
            get: function () {
                return this._useLogarithmicDepth;
            },
            set: function (value) {
                this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
                this._markAllSubMeshesAsMiscDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WaterMaterial.prototype, "refractionTexture", {
            // Get / Set
            get: function () {
                return this._refractionRTT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WaterMaterial.prototype, "reflectionTexture", {
            get: function () {
                return this._reflectionRTT;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        WaterMaterial.prototype.addToRenderList = function (node) {
            this._refractionRTT.renderList.push(node);
            this._reflectionRTT.renderList.push(node);
        };
        WaterMaterial.prototype.enableRenderTargets = function (enable) {
            var refreshRate = enable ? 1 : 0;
            this._refractionRTT.refreshRate = refreshRate;
            this._reflectionRTT.refreshRate = refreshRate;
        };
        WaterMaterial.prototype.getRenderList = function () {
            return this._refractionRTT.renderList;
        };
        Object.defineProperty(WaterMaterial.prototype, "renderTargetsEnabled", {
            get: function () {
                return !(this._refractionRTT.refreshRate === 0);
            },
            enumerable: true,
            configurable: true
        });
        WaterMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        WaterMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        WaterMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        WaterMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new WaterMaterialDefines();
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
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (this.bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled) {
                        if (!this.bumpTexture.isReady()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.BUMP = true;
                        }
                    }
                    if (BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                        defines.REFLECTION = true;
                    }
                }
            }
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, defines);
            if (defines._areMiscDirty) {
                if (this._fresnelSeparate) {
                    defines.FRESNELSEPARATE = true;
                }
                if (this._bumpSuperimpose) {
                    defines.BUMPSUPERIMPOSE = true;
                }
                if (this._bumpAffectsReflection) {
                    defines.BUMPAFFECTSREFLECTION = true;
                }
            }
            // Lights
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
            // Attribs
            BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);
            this._mesh = mesh;
            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                if (defines.LOGARITHMICDEPTH) {
                    fallbacks.addFallback(0, "LOGARITHMICDEPTH");
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
                var shaderName = "water";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor", "vSpecularColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vNormalInfos",
                    "mBones",
                    "vClipPlane", "normalMatrix",
                    "logarithmicDepthConstant",
                    // Water
                    "worldReflectionViewProjection", "windDirection", "waveLength", "time", "windForce",
                    "cameraPosition", "bumpHeight", "waveHeight", "waterColor", "waterColor2", "colorBlendFactor", "colorBlendFactor2", "waveSpeed"
                ];
                var samplers = ["normalSampler",
                    // Water
                    "refractionSampler", "reflectionSampler"
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
                    indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights }
                }, engine), defines);
            }
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        WaterMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this.bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled) {
                    this._activeEffect.setTexture("normalSampler", this.bumpTexture);
                    this._activeEffect.setFloat2("vNormalInfos", this.bumpTexture.coordinatesIndex, this.bumpTexture.level);
                    this._activeEffect.setMatrix("normalMatrix", this.bumpTexture.getTextureMatrix());
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
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
            // Log. depth
            BABYLON.MaterialHelper.BindLogDepth(defines, this._activeEffect, scene);
            // Water
            if (BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                this._activeEffect.setTexture("refractionSampler", this._refractionRTT);
                this._activeEffect.setTexture("reflectionSampler", this._reflectionRTT);
            }
            var wrvp = this._mesh.getWorldMatrix().multiply(this._reflectionTransform).multiply(scene.getProjectionMatrix());
            // Add delta time. Prevent adding delta time if it hasn't changed.
            var deltaTime = scene.getEngine().getDeltaTime();
            if (deltaTime !== this._lastDeltaTime) {
                this._lastDeltaTime = deltaTime;
                this._lastTime += this._lastDeltaTime;
            }
            this._activeEffect.setMatrix("worldReflectionViewProjection", wrvp);
            this._activeEffect.setVector2("windDirection", this.windDirection);
            this._activeEffect.setFloat("waveLength", this.waveLength);
            this._activeEffect.setFloat("time", this._lastTime / 100000);
            this._activeEffect.setFloat("windForce", this.windForce);
            this._activeEffect.setFloat("waveHeight", this.waveHeight);
            this._activeEffect.setFloat("bumpHeight", this.bumpHeight);
            this._activeEffect.setColor4("waterColor", this.waterColor, 1.0);
            this._activeEffect.setFloat("colorBlendFactor", this.colorBlendFactor);
            this._activeEffect.setColor4("waterColor2", this.waterColor2, 1.0);
            this._activeEffect.setFloat("colorBlendFactor2", this.colorBlendFactor2);
            this._activeEffect.setFloat("waveSpeed", this.waveSpeed);
            this._afterBind(mesh, this._activeEffect);
        };
        WaterMaterial.prototype._createRenderTargets = function (scene, renderTargetSize) {
            var _this = this;
            // Render targets
            this._refractionRTT = new BABYLON.RenderTargetTexture(name + "_refraction", { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
            this._refractionRTT.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
            this._refractionRTT.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
            this._refractionRTT.ignoreCameraViewport = true;
            this._reflectionRTT = new BABYLON.RenderTargetTexture(name + "_reflection", { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
            this._reflectionRTT.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
            this._reflectionRTT.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
            this._reflectionRTT.ignoreCameraViewport = true;
            var isVisible;
            var clipPlane = null;
            var savedViewMatrix;
            var mirrorMatrix = BABYLON.Matrix.Zero();
            this._refractionRTT.onBeforeRender = function () {
                if (_this._mesh) {
                    isVisible = _this._mesh.isVisible;
                    _this._mesh.isVisible = false;
                }
                // Clip plane
                clipPlane = scene.clipPlane;
                var positiony = _this._mesh ? _this._mesh.position.y : 0.0;
                scene.clipPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, positiony + 0.05, 0), new BABYLON.Vector3(0, 1, 0));
            };
            this._refractionRTT.onAfterRender = function () {
                if (_this._mesh) {
                    _this._mesh.isVisible = isVisible;
                }
                // Clip plane 
                scene.clipPlane = clipPlane;
            };
            this._reflectionRTT.onBeforeRender = function () {
                if (_this._mesh) {
                    isVisible = _this._mesh.isVisible;
                    _this._mesh.isVisible = false;
                }
                // Clip plane
                clipPlane = scene.clipPlane;
                var positiony = _this._mesh ? _this._mesh.position.y : 0.0;
                scene.clipPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, positiony - 0.05, 0), new BABYLON.Vector3(0, -1, 0));
                // Transform
                BABYLON.Matrix.ReflectionToRef(scene.clipPlane, mirrorMatrix);
                savedViewMatrix = scene.getViewMatrix();
                mirrorMatrix.multiplyToRef(savedViewMatrix, _this._reflectionTransform);
                scene.setTransformMatrix(_this._reflectionTransform, scene.getProjectionMatrix());
                scene.getEngine().cullBackFaces = false;
                scene._mirroredCameraPosition = BABYLON.Vector3.TransformCoordinates(scene.activeCamera.position, mirrorMatrix);
            };
            this._reflectionRTT.onAfterRender = function () {
                if (_this._mesh) {
                    _this._mesh.isVisible = isVisible;
                }
                // Clip plane
                scene.clipPlane = clipPlane;
                // Transform
                scene.setTransformMatrix(savedViewMatrix, scene.getProjectionMatrix());
                scene.getEngine().cullBackFaces = true;
                scene._mirroredCameraPosition = null;
            };
        };
        WaterMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
                results.push(this.bumpTexture);
            }
            if (this._reflectionRTT && this._reflectionRTT.animations && this._reflectionRTT.animations.length > 0) {
                results.push(this._reflectionRTT);
            }
            if (this._refractionRTT && this._refractionRTT.animations && this._refractionRTT.animations.length > 0) {
                results.push(this._refractionRTT);
            }
            return results;
        };
        WaterMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._bumpTexture) {
                activeTextures.push(this._bumpTexture);
            }
            return activeTextures;
        };
        WaterMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this._bumpTexture === texture) {
                return true;
            }
            return false;
        };
        WaterMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.bumpTexture) {
                this.bumpTexture.dispose();
            }
            var index = this.getScene().customRenderTargets.indexOf(this._refractionRTT);
            if (index != -1) {
                this.getScene().customRenderTargets.splice(index, 1);
            }
            index = -1;
            index = this.getScene().customRenderTargets.indexOf(this._reflectionRTT);
            if (index != -1) {
                this.getScene().customRenderTargets.splice(index, 1);
            }
            if (this._reflectionRTT) {
                this._reflectionRTT.dispose();
            }
            if (this._refractionRTT) {
                this._refractionRTT.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        WaterMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new WaterMaterial(name, _this.getScene()); }, this);
        };
        WaterMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.WaterMaterial";
            serializationObject.reflectionTexture.isRenderTarget = true;
            serializationObject.refractionTexture.isRenderTarget = true;
            return serializationObject;
        };
        WaterMaterial.prototype.getClassName = function () {
            return "WaterMaterial";
        };
        // Statics
        WaterMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new WaterMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        WaterMaterial.CreateDefaultMesh = function (name, scene) {
            var mesh = BABYLON.Mesh.CreateGround(name, 512, 512, 32, scene, false);
            return mesh;
        };
        __decorate([
            BABYLON.serializeAsTexture("bumpTexture")
        ], WaterMaterial.prototype, "_bumpTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], WaterMaterial.prototype, "bumpTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], WaterMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], WaterMaterial.prototype, "specularColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "specularPower", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], WaterMaterial.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], WaterMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], WaterMaterial.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], WaterMaterial.prototype, "maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "windForce", void 0);
        __decorate([
            BABYLON.serializeAsVector2()
        ], WaterMaterial.prototype, "windDirection", void 0);
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "waveHeight", void 0);
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "bumpHeight", void 0);
        __decorate([
            BABYLON.serialize("bumpSuperimpose")
        ], WaterMaterial.prototype, "_bumpSuperimpose", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsMiscDirty")
        ], WaterMaterial.prototype, "bumpSuperimpose", void 0);
        __decorate([
            BABYLON.serialize("fresnelSeparate")
        ], WaterMaterial.prototype, "_fresnelSeparate", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsMiscDirty")
        ], WaterMaterial.prototype, "fresnelSeparate", void 0);
        __decorate([
            BABYLON.serialize("bumpAffectsReflection")
        ], WaterMaterial.prototype, "_bumpAffectsReflection", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsMiscDirty")
        ], WaterMaterial.prototype, "bumpAffectsReflection", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], WaterMaterial.prototype, "waterColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "colorBlendFactor", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], WaterMaterial.prototype, "waterColor2", void 0);
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "colorBlendFactor2", void 0);
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "waveLength", void 0);
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "waveSpeed", void 0);
        __decorate([
            BABYLON.serialize()
        ], WaterMaterial.prototype, "useLogarithmicDepth", null);
        return WaterMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.WaterMaterial = WaterMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.waterMaterial.js.map

BABYLON.Effect.ShadersStore['waterVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef BUMP\nvarying vec2 vNormalUV;\n#ifdef BUMPSUPERIMPOSE\nvarying vec2 vNormalUV2;\n#endif\nuniform mat4 normalMatrix;\nuniform vec2 vNormalInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<logDepthDeclaration>\n\nuniform mat4 worldReflectionViewProjection;\nuniform vec2 windDirection;\nuniform float waveLength;\nuniform float time;\nuniform float windForce;\nuniform float waveHeight;\nuniform float waveSpeed;\n\nvarying vec3 vPosition;\nvarying vec3 vRefractionMapTexCoord;\nvarying vec3 vReflectionMapTexCoord;\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef BUMP\nif (vNormalInfos.x == 0.)\n{\nvNormalUV=vec2(normalMatrix*vec4((uv*1.0)/waveLength+time*windForce*windDirection,1.0,0.0));\n#ifdef BUMPSUPERIMPOSE\nvNormalUV2=vec2(normalMatrix*vec4((uv*0.721)/waveLength+time*1.2*windForce*windDirection,1.0,0.0));\n#endif\n}\nelse\n{\nvNormalUV=vec2(normalMatrix*vec4((uv2*1.0)/waveLength+time*windForce*windDirection ,1.0,0.0));\n#ifdef BUMPSUPERIMPOSE\nvNormalUV2=vec2(normalMatrix*vec4((uv2*0.721)/waveLength+time*1.2*windForce*windDirection ,1.0,0.0));\n#endif\n}\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\nvec3 p=position;\nfloat newY=(sin(((p.x/0.05)+time*waveSpeed))*waveHeight*windDirection.x*5.0)\n+(cos(((p.z/0.05)+time*waveSpeed))*waveHeight*windDirection.y*5.0);\np.y+=abs(newY);\ngl_Position=viewProjection*finalWorld*vec4(p,1.0);\n#ifdef REFLECTION\nworldPos=viewProjection*finalWorld*vec4(p,1.0);\n\nvPosition=position;\nvRefractionMapTexCoord.x=0.5*(worldPos.w+worldPos.x);\nvRefractionMapTexCoord.y=0.5*(worldPos.w+worldPos.y);\nvRefractionMapTexCoord.z=worldPos.w;\nworldPos=worldReflectionViewProjection*vec4(position,1.0);\nvReflectionMapTexCoord.x=0.5*(worldPos.w+worldPos.x);\nvReflectionMapTexCoord.y=0.5*(worldPos.w+worldPos.y);\nvReflectionMapTexCoord.z=worldPos.w;\n#endif\n#include<logDepthVertex>\n}\n";
BABYLON.Effect.ShadersStore['waterPixelShader'] = "#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\nprecision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef BUMP\nvarying vec2 vNormalUV;\nvarying vec2 vNormalUV2;\nuniform sampler2D normalSampler;\nuniform vec2 vNormalInfos;\n#endif\nuniform sampler2D refractionSampler;\nuniform sampler2D reflectionSampler;\n\nconst float LOG2=1.442695;\nuniform vec3 cameraPosition;\nuniform vec4 waterColor;\nuniform float colorBlendFactor;\nuniform vec4 waterColor2;\nuniform float colorBlendFactor2;\nuniform float bumpHeight;\nuniform float time;\n\nvarying vec3 vRefractionMapTexCoord;\nvarying vec3 vReflectionMapTexCoord;\nvarying vec3 vPosition;\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n#ifdef BUMP\n#ifdef BUMPSUPERIMPOSE\nbaseColor=0.6*texture2D(normalSampler,vNormalUV)+0.4*texture2D(normalSampler,vec2(vNormalUV2.x,vNormalUV2.y));\n#else\nbaseColor=texture2D(normalSampler,vNormalUV);\n#endif\nvec3 bumpColor=baseColor.rgb;\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\nbaseColor.rgb*=vNormalInfos.y;\n#else\nvec3 bumpColor=vec3(1.0);\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\n#ifdef NORMAL\nvec2 perturbation=bumpHeight*(baseColor.rg-0.5);\n#ifdef BUMPAFFECTSREFLECTION\nvec3 normalW=normalize(vNormalW+vec3(perturbation.x*8.0,0.0,perturbation.y*8.0));\nif (normalW.y<0.0) {\nnormalW.y=-normalW.y;\n}\n#else\nvec3 normalW=normalize(vNormalW);\n#endif\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\nvec2 perturbation=bumpHeight*(vec2(1.0,1.0)-0.5);\n#endif\n#ifdef FRESNELSEPARATE\n#ifdef REFLECTION\n\nvec3 eyeVector=normalize(vEyePosition-vPosition);\nvec2 projectedRefractionTexCoords=clamp(vRefractionMapTexCoord.xy/vRefractionMapTexCoord.z+perturbation*0.5,0.0,1.0);\nvec4 refractiveColor=texture2D(refractionSampler,projectedRefractionTexCoords);\nvec2 projectedReflectionTexCoords=clamp(vec2(\nvReflectionMapTexCoord.x/vReflectionMapTexCoord.z+perturbation.x*0.3,\nvReflectionMapTexCoord.y/vReflectionMapTexCoord.z+perturbation.y\n),0.0,1.0);\nvec4 reflectiveColor=texture2D(reflectionSampler,projectedReflectionTexCoords);\nvec3 upVector=vec3(0.0,1.0,0.0);\nfloat fresnelTerm=clamp(abs(pow(dot(eyeVector,upVector),3.0)),0.05,0.65);\nfloat IfresnelTerm=1.0-fresnelTerm;\nrefractiveColor=colorBlendFactor*waterColor+(1.0-colorBlendFactor)*refractiveColor;\nreflectiveColor=IfresnelTerm*colorBlendFactor2*waterColor+(1.0-colorBlendFactor2*IfresnelTerm)*reflectiveColor;\nvec4 combinedColor=refractiveColor*fresnelTerm+reflectiveColor*IfresnelTerm;\nbaseColor=combinedColor;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularBase=vec3(0.,0.,0.);\nvec3 specularColor=vSpecularColor.rgb;\n#else\nfloat glossiness=0.;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\nvec3 finalDiffuse=clamp(baseColor.rgb,0.0,1.0);\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#else \n#ifdef REFLECTION\n\nvec3 eyeVector=normalize(vEyePosition-vPosition);\nvec2 projectedRefractionTexCoords=clamp(vRefractionMapTexCoord.xy/vRefractionMapTexCoord.z+perturbation,0.0,1.0);\nvec4 refractiveColor=texture2D(refractionSampler,projectedRefractionTexCoords);\nvec2 projectedReflectionTexCoords=clamp(vReflectionMapTexCoord.xy/vReflectionMapTexCoord.z+perturbation,0.0,1.0);\nvec4 reflectiveColor=texture2D(reflectionSampler,projectedReflectionTexCoords);\nvec3 upVector=vec3(0.0,1.0,0.0);\nfloat fresnelTerm=max(dot(eyeVector,upVector),0.0);\nvec4 combinedColor=refractiveColor*fresnelTerm+reflectiveColor*(1.0-fresnelTerm);\nbaseColor=colorBlendFactor*waterColor+(1.0-colorBlendFactor)*combinedColor;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularBase=vec3(0.,0.,0.);\nvec3 specularColor=vSpecularColor.rgb;\n#else\nfloat glossiness=0.;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\nvec3 finalDiffuse=clamp(baseColor.rgb,0.0,1.0);\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#endif\n\nvec4 color=vec4(finalDiffuse+finalSpecular,alpha);\n#include<logDepthFragment>\n#include<fogFragment>\ngl_FragColor=color;\n}\n";




var BABYLON;
(function (BABYLON) {
    var FireMaterialDefines = /** @class */ (function (_super) {
        __extends(FireMaterialDefines, _super);
        function FireMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.DEPTHPREPASS = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.UV1 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.BonesPerMesh = 0;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.INSTANCES = false;
            _this.rebuild();
            return _this;
        }
        return FireMaterialDefines;
    }(BABYLON.MaterialDefines));
    var FireMaterial = /** @class */ (function (_super) {
        __extends(FireMaterial, _super);
        function FireMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this.speed = 1.0;
            _this._scaledDiffuse = new BABYLON.Color3();
            _this._lastTime = 0;
            return _this;
        }
        FireMaterial.prototype.needAlphaBlending = function () {
            return false;
        };
        FireMaterial.prototype.needAlphaTesting = function () {
            return true;
        };
        FireMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        FireMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new FireMaterialDefines();
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
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    if (!this._diffuseTexture.isReady()) {
                        return false;
                    }
                    else {
                        defines._needUVs = true;
                        defines.DIFFUSE = true;
                    }
                }
            }
            // Misc.
            if (defines._areMiscDirty) {
                defines.POINTSIZE = (this.pointsCloud || scene.forcePointsCloud);
                defines.FOG = (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled);
            }
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
            // Attribs
            BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, true);
            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, defines);
                // Legacy browser patch
                var shaderName = "fire";
                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect(shaderName, {
                    attributes: attribs,
                    uniformsNames: ["world", "view", "viewProjection", "vEyePosition",
                        "vFogInfos", "vFogColor", "pointSize",
                        "vDiffuseInfos",
                        "mBones",
                        "vClipPlane", "diffuseMatrix",
                        // Fire
                        "time", "speed"
                    ],
                    uniformBuffersNames: [],
                    samplers: ["diffuseSampler",
                        // Fire
                        "distortionSampler", "opacitySampler"
                    ],
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
                    onError: this.onError
                }, engine), defines);
            }
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        FireMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._activeEffect.setTexture("diffuseSampler", this._diffuseTexture);
                    this._activeEffect.setFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                    this._activeEffect.setMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
                    this._activeEffect.setTexture("distortionSampler", this._distortionTexture);
                    this._activeEffect.setTexture("opacitySampler", this._opacityTexture);
                }
                // Clip plane
                if (scene.clipPlane) {
                    var clipPlane = scene.clipPlane;
                    this._activeEffect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
                }
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._activeEffect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            // Time
            this._lastTime += scene.getEngine().getDeltaTime();
            this._activeEffect.setFloat("time", this._lastTime);
            // Speed
            this._activeEffect.setFloat("speed", this.speed);
            this._afterBind(mesh, this._activeEffect);
        };
        FireMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this._diffuseTexture && this._diffuseTexture.animations && this._diffuseTexture.animations.length > 0) {
                results.push(this._diffuseTexture);
            }
            if (this._distortionTexture && this._distortionTexture.animations && this._distortionTexture.animations.length > 0) {
                results.push(this._distortionTexture);
            }
            if (this._opacityTexture && this._opacityTexture.animations && this._opacityTexture.animations.length > 0) {
                results.push(this._opacityTexture);
            }
            return results;
        };
        FireMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._diffuseTexture) {
                activeTextures.push(this._diffuseTexture);
            }
            if (this._distortionTexture) {
                activeTextures.push(this._distortionTexture);
            }
            if (this._opacityTexture) {
                activeTextures.push(this._opacityTexture);
            }
            return activeTextures;
        };
        FireMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this._diffuseTexture === texture) {
                return true;
            }
            if (this._distortionTexture === texture) {
                return true;
            }
            if (this._opacityTexture === texture) {
                return true;
            }
            return false;
        };
        FireMaterial.prototype.getClassName = function () {
            return "FireMaterial";
        };
        FireMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this._diffuseTexture) {
                this._diffuseTexture.dispose();
            }
            if (this._distortionTexture) {
                this._distortionTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        FireMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new FireMaterial(name, _this.getScene()); }, this);
        };
        FireMaterial.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.customType = "BABYLON.FireMaterial";
            serializationObject.diffuseColor = this.diffuseColor.asArray();
            serializationObject.speed = this.speed;
            if (this._diffuseTexture) {
                serializationObject._diffuseTexture = this._diffuseTexture.serialize();
            }
            if (this._distortionTexture) {
                serializationObject._distortionTexture = this._distortionTexture.serialize();
            }
            if (this._opacityTexture) {
                serializationObject._opacityTexture = this._opacityTexture.serialize();
            }
            return serializationObject;
        };
        FireMaterial.Parse = function (source, scene, rootUrl) {
            var material = new FireMaterial(source.name, scene);
            material.diffuseColor = BABYLON.Color3.FromArray(source.diffuseColor);
            material.speed = source.speed;
            material.alpha = source.alpha;
            material.id = source.id;
            BABYLON.Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;
            if (source._diffuseTexture) {
                material._diffuseTexture = BABYLON.Texture.Parse(source._diffuseTexture, scene, rootUrl);
            }
            if (source._distortionTexture) {
                material._distortionTexture = BABYLON.Texture.Parse(source._distortionTexture, scene, rootUrl);
            }
            if (source._opacityTexture) {
                material._opacityTexture = BABYLON.Texture.Parse(source._opacityTexture, scene, rootUrl);
            }
            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }
            return material;
        };
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture")
        ], FireMaterial.prototype, "_diffuseTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], FireMaterial.prototype, "diffuseTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("distortionTexture")
        ], FireMaterial.prototype, "_distortionTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], FireMaterial.prototype, "distortionTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("opacityTexture")
        ], FireMaterial.prototype, "_opacityTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], FireMaterial.prototype, "opacityTexture", void 0);
        __decorate([
            BABYLON.serialize("diffuseColor")
        ], FireMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], FireMaterial.prototype, "speed", void 0);
        return FireMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.FireMaterial = FireMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.fireMaterial.js.map

BABYLON.Effect.ShadersStore['fireVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n\nuniform float time;\nuniform float speed;\n#ifdef DIFFUSE\nvarying vec2 vDistortionCoords1;\nvarying vec2 vDistortionCoords2;\nvarying vec2 vDistortionCoords3;\n#endif\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n\n#ifdef DIFFUSE\nvDiffuseUV=uv;\nvDiffuseUV.y-=0.2;\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n#ifdef DIFFUSE\n\nvec3 layerSpeed=vec3(-0.2,-0.52,-0.1)*speed;\nvDistortionCoords1.x=uv.x;\nvDistortionCoords1.y=uv.y+layerSpeed.x*time/1000.0;\nvDistortionCoords2.x=uv.x;\nvDistortionCoords2.y=uv.y+layerSpeed.y*time/1000.0;\nvDistortionCoords3.x=uv.x;\nvDistortionCoords3.y=uv.y+layerSpeed.z*time/1000.0;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['firePixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\n\nvarying vec3 vPositionW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n\nuniform sampler2D distortionSampler;\nuniform sampler2D opacitySampler;\n#ifdef DIFFUSE\nvarying vec2 vDistortionCoords1;\nvarying vec2 vDistortionCoords2;\nvarying vec2 vDistortionCoords3;\n#endif\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nvec4 bx2(vec4 x)\n{\nreturn vec4(2.0)*x-vec4(1.0);\n}\nvoid main(void) {\n\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\n\nfloat alpha=1.0;\n#ifdef DIFFUSE\n\nconst float distortionAmount0=0.092;\nconst float distortionAmount1=0.092;\nconst float distortionAmount2=0.092;\nvec2 heightAttenuation=vec2(0.3,0.39);\nvec4 noise0=texture2D(distortionSampler,vDistortionCoords1);\nvec4 noise1=texture2D(distortionSampler,vDistortionCoords2);\nvec4 noise2=texture2D(distortionSampler,vDistortionCoords3);\nvec4 noiseSum=bx2(noise0)*distortionAmount0+bx2(noise1)*distortionAmount1+bx2(noise2)*distortionAmount2;\nvec4 perturbedBaseCoords=vec4(vDiffuseUV,0.0,1.0)+noiseSum*(vDiffuseUV.y*heightAttenuation.x+heightAttenuation.y);\nvec4 opacityColor=texture2D(opacitySampler,perturbedBaseCoords.xy);\n#ifdef ALPHATEST\nif (opacityColor.r<0.1)\ndiscard;\n#endif\n#include<depthPrePass>\nbaseColor=texture2D(diffuseSampler,perturbedBaseCoords.xy)*2.0;\nbaseColor*=opacityColor;\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 diffuseBase=vec3(1.0,1.0,1.0);\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n\nvec4 color=vec4(baseColor.rgb,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}";




var BABYLON;
(function (BABYLON) {
    var FurMaterialDefines = /** @class */ (function (_super) {
        __extends(FurMaterialDefines, _super);
        function FurMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.HEIGHTMAP = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.DEPTHPREPASS = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.NORMAL = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.HIGHLEVEL = false;
            _this.rebuild();
            return _this;
        }
        return FurMaterialDefines;
    }(BABYLON.MaterialDefines));
    var FurMaterial = /** @class */ (function (_super) {
        __extends(FurMaterial, _super);
        function FurMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this.furLength = 1;
            _this.furAngle = 0;
            _this.furColor = new BABYLON.Color3(0.44, 0.21, 0.02);
            _this.furOffset = 0.0;
            _this.furSpacing = 12;
            _this.furGravity = new BABYLON.Vector3(0, 0, 0);
            _this.furSpeed = 100;
            _this.furDensity = 20;
            _this._disableLighting = false;
            _this._maxSimultaneousLights = 4;
            _this.highLevelFur = true;
            _this._furTime = 0;
            return _this;
        }
        Object.defineProperty(FurMaterial.prototype, "furTime", {
            get: function () {
                return this._furTime;
            },
            set: function (furTime) {
                this._furTime = furTime;
            },
            enumerable: true,
            configurable: true
        });
        FurMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        FurMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        FurMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        FurMaterial.prototype.updateFur = function () {
            for (var i = 1; i < this._meshes.length; i++) {
                var offsetFur = this._meshes[i].material;
                offsetFur.furLength = this.furLength;
                offsetFur.furAngle = this.furAngle;
                offsetFur.furGravity = this.furGravity;
                offsetFur.furSpacing = this.furSpacing;
                offsetFur.furSpeed = this.furSpeed;
                offsetFur.furColor = this.furColor;
                offsetFur.diffuseTexture = this.diffuseTexture;
                offsetFur.furTexture = this.furTexture;
                offsetFur.highLevelFur = this.highLevelFur;
                offsetFur.furTime = this.furTime;
                offsetFur.furDensity = this.furDensity;
            }
        };
        // Methods   
        FurMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new FurMaterialDefines();
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
            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        if (!this.diffuseTexture.isReady()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.DIFFUSE = true;
                        }
                    }
                    if (this.heightTexture && engine.getCaps().maxVertexTextureImageUnits) {
                        if (!this.heightTexture.isReady()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.HEIGHTMAP = true;
                        }
                    }
                }
            }
            // High level
            if (this.highLevelFur !== defines.HIGHLEVEL) {
                defines.HIGHLEVEL = true;
                defines.markAsUnprocessed();
            }
            // Misc.   
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            // Lights
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
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
                var shaderName = "fur";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix",
                    "furLength", "furAngle", "furColor", "furOffset", "furGravity", "furTime", "furSpacing", "furDensity"
                ];
                var samplers = ["diffuseSampler",
                    "heightTexture", "furTexture"
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
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        FurMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._activeEffect.setTexture("diffuseSampler", this._diffuseTexture);
                    this._activeEffect.setFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                    this._activeEffect.setMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
                }
                if (this._heightTexture) {
                    this._activeEffect.setTexture("heightTexture", this._heightTexture);
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
            if (scene.lightsEnabled && !this.disableLighting) {
                BABYLON.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            this._activeEffect.setFloat("furLength", this.furLength);
            this._activeEffect.setFloat("furAngle", this.furAngle);
            this._activeEffect.setColor4("furColor", this.furColor, 1.0);
            if (this.highLevelFur) {
                this._activeEffect.setVector3("furGravity", this.furGravity);
                this._activeEffect.setFloat("furOffset", this.furOffset);
                this._activeEffect.setFloat("furSpacing", this.furSpacing);
                this._activeEffect.setFloat("furDensity", this.furDensity);
                this._furTime += this.getScene().getEngine().getDeltaTime() / this.furSpeed;
                this._activeEffect.setFloat("furTime", this._furTime);
                this._activeEffect.setTexture("furTexture", this.furTexture);
            }
            this._afterBind(mesh, this._activeEffect);
        };
        FurMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }
            if (this.heightTexture && this.heightTexture.animations && this.heightTexture.animations.length > 0) {
                results.push(this.heightTexture);
            }
            return results;
        };
        FurMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._diffuseTexture) {
                activeTextures.push(this._diffuseTexture);
            }
            if (this._heightTexture) {
                activeTextures.push(this._heightTexture);
            }
            return activeTextures;
        };
        FurMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this.diffuseTexture === texture) {
                return true;
            }
            if (this._heightTexture === texture) {
                return true;
            }
            return false;
        };
        FurMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }
            if (this._meshes) {
                for (var i = 1; i < this._meshes.length; i++) {
                    this._meshes[i].material.dispose(forceDisposeEffect);
                    this._meshes[i].dispose();
                }
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        FurMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new FurMaterial(name, _this.getScene()); }, this);
        };
        FurMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.FurMaterial";
            if (this._meshes) {
                serializationObject.sourceMeshName = this._meshes[0].name;
                serializationObject.quality = this._meshes.length;
            }
            return serializationObject;
        };
        FurMaterial.prototype.getClassName = function () {
            return "FurMaterial";
        };
        // Statics
        FurMaterial.Parse = function (source, scene, rootUrl) {
            var material = BABYLON.SerializationHelper.Parse(function () { return new FurMaterial(source.name, scene); }, source, scene, rootUrl);
            if (source.sourceMeshName && material.highLevelFur) {
                scene.executeWhenReady(function () {
                    var sourceMesh = scene.getMeshByName(source.sourceMeshName);
                    if (sourceMesh) {
                        var furTexture = FurMaterial.GenerateTexture("Fur Texture", scene);
                        material.furTexture = furTexture;
                        FurMaterial.FurifyMesh(sourceMesh, source.quality);
                    }
                });
            }
            return material;
        };
        FurMaterial.GenerateTexture = function (name, scene) {
            // Generate fur textures
            var texture = new BABYLON.DynamicTexture("FurTexture " + name, 256, scene, true);
            var context = texture.getContext();
            for (var i = 0; i < 20000; ++i) {
                context.fillStyle = "rgba(255, " + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ", 1)";
                context.fillRect((Math.random() * texture.getSize().width), (Math.random() * texture.getSize().height), 2, 2);
            }
            texture.update(false);
            texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            return texture;
        };
        // Creates and returns an array of meshes used as shells for the Fur Material
        // that can be disposed later in your code
        // The quality is in interval [0, 100]
        FurMaterial.FurifyMesh = function (sourceMesh, quality) {
            var meshes = [sourceMesh];
            var mat = sourceMesh.material;
            var i;
            if (!(mat instanceof FurMaterial)) {
                throw "The material of the source mesh must be a Fur Material";
            }
            for (i = 1; i < quality; i++) {
                var offsetFur = new BABYLON.FurMaterial(mat.name + i, sourceMesh.getScene());
                sourceMesh.getScene().materials.pop();
                BABYLON.Tags.EnableFor(offsetFur);
                BABYLON.Tags.AddTagsTo(offsetFur, "furShellMaterial");
                offsetFur.furLength = mat.furLength;
                offsetFur.furAngle = mat.furAngle;
                offsetFur.furGravity = mat.furGravity;
                offsetFur.furSpacing = mat.furSpacing;
                offsetFur.furSpeed = mat.furSpeed;
                offsetFur.furColor = mat.furColor;
                offsetFur.diffuseTexture = mat.diffuseTexture;
                offsetFur.furOffset = i / quality;
                offsetFur.furTexture = mat.furTexture;
                offsetFur.highLevelFur = mat.highLevelFur;
                offsetFur.furTime = mat.furTime;
                offsetFur.furDensity = mat.furDensity;
                var offsetMesh = sourceMesh.clone(sourceMesh.name + i);
                offsetMesh.material = offsetFur;
                offsetMesh.skeleton = sourceMesh.skeleton;
                offsetMesh.position = BABYLON.Vector3.Zero();
                meshes.push(offsetMesh);
            }
            for (i = 1; i < meshes.length; i++) {
                meshes[i].parent = sourceMesh;
            }
            sourceMesh.material._meshes = meshes;
            return meshes;
        };
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture")
        ], FurMaterial.prototype, "_diffuseTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], FurMaterial.prototype, "diffuseTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("heightTexture")
        ], FurMaterial.prototype, "_heightTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], FurMaterial.prototype, "heightTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], FurMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furLength", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furAngle", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], FurMaterial.prototype, "furColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furOffset", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furSpacing", void 0);
        __decorate([
            BABYLON.serializeAsVector3()
        ], FurMaterial.prototype, "furGravity", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furSpeed", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furDensity", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], FurMaterial.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], FurMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], FurMaterial.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], FurMaterial.prototype, "maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "highLevelFur", void 0);
        __decorate([
            BABYLON.serialize()
        ], FurMaterial.prototype, "furTime", null);
        return FurMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.FurMaterial = FurMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.furMaterial.js.map

BABYLON.Effect.ShadersStore['furVertexShader'] = "precision highp float;\n\nattribute vec3 position;\nattribute vec3 normal;\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\nuniform float furLength;\nuniform float furAngle;\n#ifdef HIGHLEVEL\nuniform float furOffset;\nuniform vec3 furGravity;\nuniform float furTime;\nuniform float furSpacing;\nuniform float furDensity;\n#endif\n#ifdef HEIGHTMAP\nuniform sampler2D heightTexture;\n#endif\n#ifdef HIGHLEVEL\nvarying vec2 vFurUV;\n#endif\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\nvarying float vfur_length;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nfloat Rand(vec3 rv) {\nfloat x=dot(rv,vec3(12.9898,78.233,24.65487));\nreturn fract(sin(x)*43758.5453);\n}\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\n\nfloat r=Rand(position);\n#ifdef HEIGHTMAP\n#if __VERSION__>100\nvfur_length=furLength*texture(heightTexture,uv).x;\n#else\nvfur_length=furLength*texture2D(heightTexture,uv).r;\n#endif\n#else \nvfur_length=(furLength*r);\n#endif\nvec3 tangent1=vec3(normal.y,-normal.x,0);\nvec3 tangent2=vec3(-normal.z,0,normal.x);\nr=Rand(tangent1*r);\nfloat J=(2.0+4.0*r);\nr=Rand(tangent2*r);\nfloat K=(2.0+2.0*r);\ntangent1=tangent1*J+tangent2*K;\ntangent1=normalize(tangent1);\nvec3 newPosition=position+normal*vfur_length*cos(furAngle)+tangent1*vfur_length*sin(furAngle);\n#ifdef HIGHLEVEL\n\nvec3 forceDirection=vec3(0.0,0.0,0.0);\nforceDirection.x=sin(furTime+position.x*0.05)*0.2;\nforceDirection.y=cos(furTime*0.7+position.y*0.04)*0.2;\nforceDirection.z=sin(furTime*0.7+position.z*0.04)*0.2;\nvec3 displacement=vec3(0.0,0.0,0.0);\ndisplacement=furGravity+forceDirection;\nfloat displacementFactor=pow(furOffset,3.0);\nvec3 aNormal=normal;\naNormal.xyz+=displacement*displacementFactor;\nnewPosition=vec3(newPosition.x,newPosition.y,newPosition.z)+(normalize(aNormal)*furOffset*furSpacing);\n#endif\n#ifdef NORMAL\n#ifdef HIGHLEVEL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0))*aNormal);\n#else\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n#endif\n\ngl_Position=viewProjection*finalWorld*vec4(newPosition,1.0);\nvec4 worldPos=finalWorld*vec4(newPosition,1.0);\nvPositionW=vec3(worldPos);\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef DIFFUSE\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#ifdef HIGHLEVEL\nvFurUV=vDiffuseUV*furDensity;\n#endif\n#else\n#ifdef HIGHLEVEL\nvFurUV=uv*furDensity;\n#endif\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['furPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n\nuniform vec4 furColor;\nuniform float furLength;\nvarying vec3 vPositionW;\nvarying float vfur_length;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n\n#ifdef HIGHLEVEL\nuniform float furOffset;\nuniform sampler2D furTexture;\nvarying vec2 vFurUV;\n#endif\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n#include<fogFragmentDeclaration>\n#include<clipPlaneFragmentDeclaration>\nfloat Rand(vec3 rv) {\nfloat x=dot(rv,vec3(12.9898,78.233,24.65487));\nreturn fract(sin(x)*43758.5453);\n}\nvoid main(void) {\n\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=furColor;\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n#ifdef DIFFUSE\nbaseColor*=texture2D(diffuseSampler,vDiffuseUV);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#include<depthPrePass>\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n#ifdef HIGHLEVEL\n\nvec4 furTextureColor=texture2D(furTexture,vec2(vFurUV.x,vFurUV.y));\nif (furTextureColor.a<=0.0 || furTextureColor.g<furOffset) {\ndiscard;\n}\nfloat occlusion=mix(0.0,furTextureColor.b*1.2,furOffset);\nbaseColor=vec4(baseColor.xyz*occlusion,1.1-furOffset);\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\nfloat glossiness=0.;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\nvec3 finalDiffuse=clamp(diffuseBase.rgb*baseColor.rgb,0.0,1.0);\n\n#ifdef HIGHLEVEL\nvec4 color=vec4(finalDiffuse,alpha);\n#else\nfloat r=vfur_length/furLength*0.5;\nvec4 color=vec4(finalDiffuse*(0.5+r),alpha);\n#endif\n#include<fogFragment>\ngl_FragColor=color;\n}";




var BABYLON;
(function (BABYLON) {
    var TerrainMaterialDefines = /** @class */ (function (_super) {
        __extends(TerrainMaterialDefines, _super);
        function TerrainMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.BUMP = false;
            _this.CLIPPLANE = false;
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
            _this.rebuild();
            return _this;
        }
        return TerrainMaterialDefines;
    }(BABYLON.MaterialDefines));
    var TerrainMaterial = /** @class */ (function (_super) {
        __extends(TerrainMaterial, _super);
        function TerrainMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this.specularColor = new BABYLON.Color3(0, 0, 0);
            _this.specularPower = 64;
            _this._disableLighting = false;
            _this._maxSimultaneousLights = 4;
            return _this;
        }
        TerrainMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        TerrainMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        TerrainMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        TerrainMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new TerrainMaterialDefines();
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
                if (this.mixTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.mixTexture.isReady()) {
                        return false;
                    }
                    else {
                        defines._needUVs = true;
                        defines.DIFFUSE = true;
                    }
                }
                if ((this.bumpTexture1 || this.bumpTexture2 || this.bumpTexture3) && BABYLON.StandardMaterial.BumpTextureEnabled) {
                    defines._needUVs = true;
                    defines._needNormals = true;
                    defines.BUMP = true;
                }
            }
            // Misc.
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            // Lights
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
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
                var shaderName = "terrain";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor", "vSpecularColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vTextureInfos",
                    "mBones",
                    "vClipPlane", "textureMatrix",
                    "diffuse1Infos", "diffuse2Infos", "diffuse3Infos"
                ];
                var samplers = ["textureSampler", "diffuse1Sampler", "diffuse2Sampler", "diffuse3Sampler",
                    "bump1Sampler", "bump2Sampler", "bump3Sampler"
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
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        TerrainMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this.mixTexture) {
                    this._activeEffect.setTexture("textureSampler", this._mixTexture);
                    this._activeEffect.setFloat2("vTextureInfos", this._mixTexture.coordinatesIndex, this._mixTexture.level);
                    this._activeEffect.setMatrix("textureMatrix", this._mixTexture.getTextureMatrix());
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
                    }
                    if (BABYLON.StandardMaterial.BumpTextureEnabled && scene.getEngine().getCaps().standardDerivatives) {
                        if (this._bumpTexture1) {
                            this._activeEffect.setTexture("bump1Sampler", this._bumpTexture1);
                        }
                        if (this._bumpTexture2) {
                            this._activeEffect.setTexture("bump2Sampler", this._bumpTexture2);
                        }
                        if (this._bumpTexture3) {
                            this._activeEffect.setTexture("bump3Sampler", this._bumpTexture3);
                        }
                    }
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
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
        TerrainMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.mixTexture && this.mixTexture.animations && this.mixTexture.animations.length > 0) {
                results.push(this.mixTexture);
            }
            return results;
        };
        TerrainMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._mixTexture) {
                activeTextures.push(this._mixTexture);
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
            if (this._bumpTexture1) {
                activeTextures.push(this._bumpTexture1);
            }
            if (this._bumpTexture2) {
                activeTextures.push(this._bumpTexture2);
            }
            if (this._bumpTexture3) {
                activeTextures.push(this._bumpTexture3);
            }
            return activeTextures;
        };
        TerrainMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this._mixTexture === texture) {
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
            if (this._bumpTexture1 === texture) {
                return true;
            }
            if (this._bumpTexture2 === texture) {
                return true;
            }
            if (this._bumpTexture3 === texture) {
                return true;
            }
            return false;
        };
        TerrainMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.mixTexture) {
                this.mixTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        TerrainMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new TerrainMaterial(name, _this.getScene()); }, this);
        };
        TerrainMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.TerrainMaterial";
            return serializationObject;
        };
        TerrainMaterial.prototype.getClassName = function () {
            return "TerrainMaterial";
        };
        // Statics
        TerrainMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new TerrainMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsTexture("mixTexture")
        ], TerrainMaterial.prototype, "_mixTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "mixTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture1")
        ], TerrainMaterial.prototype, "_diffuseTexture1", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "diffuseTexture1", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture2")
        ], TerrainMaterial.prototype, "_diffuseTexture2", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "diffuseTexture2", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture3")
        ], TerrainMaterial.prototype, "_diffuseTexture3", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "diffuseTexture3", void 0);
        __decorate([
            BABYLON.serializeAsTexture("bumpTexture1")
        ], TerrainMaterial.prototype, "_bumpTexture1", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "bumpTexture1", void 0);
        __decorate([
            BABYLON.serializeAsTexture("bumpTexture2")
        ], TerrainMaterial.prototype, "_bumpTexture2", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "bumpTexture2", void 0);
        __decorate([
            BABYLON.serializeAsTexture("bumpTexture3")
        ], TerrainMaterial.prototype, "_bumpTexture3", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TerrainMaterial.prototype, "bumpTexture3", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], TerrainMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], TerrainMaterial.prototype, "specularColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], TerrainMaterial.prototype, "specularPower", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], TerrainMaterial.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], TerrainMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], TerrainMaterial.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], TerrainMaterial.prototype, "maxSimultaneousLights", void 0);
        return TerrainMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.TerrainMaterial = TerrainMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.terrainMaterial.js.map

BABYLON.Effect.ShadersStore['terrainVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vTextureUV;\nuniform mat4 textureMatrix;\nuniform vec2 vTextureInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef DIFFUSE\nif (vTextureInfos.x == 0.)\n{\nvTextureUV=vec2(textureMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvTextureUV=vec2(textureMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif\n\n#include<fogVertex>\n\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['terrainPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\n#ifdef DIFFUSE\nvarying vec2 vTextureUV;\nuniform sampler2D textureSampler;\nuniform vec2 vTextureInfos;\nuniform sampler2D diffuse1Sampler;\nuniform sampler2D diffuse2Sampler;\nuniform sampler2D diffuse3Sampler;\nuniform vec2 diffuse1Infos;\nuniform vec2 diffuse2Infos;\nuniform vec2 diffuse3Infos;\n#endif\n#ifdef BUMP\nuniform sampler2D bump1Sampler;\nuniform sampler2D bump2Sampler;\nuniform sampler2D bump3Sampler;\n#endif\n\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\n\n#ifdef BUMP\n#extension GL_OES_standard_derivatives : enable\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 binormal=dp2perp*duv1.y+dp1perp*duv2.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(binormal,binormal)));\nreturn mat3(tangent*invmax,binormal*invmax,normal);\n}\nvec3 perturbNormal(vec3 viewDir,vec3 mixColor)\n{ \nvec3 bump1Color=texture2D(bump1Sampler,vTextureUV*diffuse1Infos).xyz;\nvec3 bump2Color=texture2D(bump2Sampler,vTextureUV*diffuse2Infos).xyz;\nvec3 bump3Color=texture2D(bump3Sampler,vTextureUV*diffuse3Infos).xyz;\nbump1Color.rgb*=mixColor.r;\nbump2Color.rgb=mix(bump1Color.rgb,bump2Color.rgb,mixColor.g);\nvec3 map=mix(bump2Color.rgb,bump3Color.rgb,mixColor.b);\nmap=map*255./127.-128./127.;\nmat3 TBN=cotangent_frame(vNormalW*vTextureInfos.y,-viewDir,vTextureUV);\nreturn normalize(TBN*map);\n}\n#endif\nvoid main(void) {\n\n#ifdef CLIPPLANE\nif (fClipDistance>0.0)\ndiscard;\n#endif\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#else\nfloat glossiness=0.;\n#endif\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(textureSampler,vTextureUV);\n#if defined(BUMP) && defined(DIFFUSE)\nnormalW=perturbNormal(viewDirectionW,baseColor.rgb);\n#endif\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#include<depthPrePass>\nbaseColor.rgb*=vTextureInfos.y;\nvec4 diffuse1Color=texture2D(diffuse1Sampler,vTextureUV*diffuse1Infos);\nvec4 diffuse2Color=texture2D(diffuse2Sampler,vTextureUV*diffuse2Infos);\nvec4 diffuse3Color=texture2D(diffuse3Sampler,vTextureUV*diffuse3Infos);\ndiffuse1Color.rgb*=baseColor.r;\ndiffuse2Color.rgb=mix(diffuse1Color.rgb,diffuse2Color.rgb,baseColor.g);\nbaseColor.rgb=mix(diffuse2Color.rgb,diffuse3Color.rgb,baseColor.b);\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor*baseColor.rgb,0.0,1.0);\n\nvec4 color=vec4(finalDiffuse+finalSpecular,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}\n";




var BABYLON;
(function (BABYLON) {
    var TriPlanarMaterialDefines = /** @class */ (function (_super) {
        __extends(TriPlanarMaterialDefines, _super);
        function TriPlanarMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSEX = false;
            _this.DIFFUSEY = false;
            _this.DIFFUSEZ = false;
            _this.BUMPX = false;
            _this.BUMPY = false;
            _this.BUMPZ = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.DEPTHPREPASS = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.SPECULARTERM = false;
            _this.NORMAL = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.rebuild();
            return _this;
        }
        return TriPlanarMaterialDefines;
    }(BABYLON.MaterialDefines));
    var TriPlanarMaterial = /** @class */ (function (_super) {
        __extends(TriPlanarMaterial, _super);
        function TriPlanarMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.tileSize = 1;
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            _this.specularPower = 64;
            _this._disableLighting = false;
            _this._maxSimultaneousLights = 4;
            return _this;
        }
        TriPlanarMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        TriPlanarMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        TriPlanarMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        TriPlanarMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new TriPlanarMaterialDefines();
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
            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        var textures = [this.diffuseTextureX, this.diffuseTextureY, this.diffuseTextureZ];
                        var textureDefines = ["DIFFUSEX", "DIFFUSEY", "DIFFUSEZ"];
                        for (var i = 0; i < textures.length; i++) {
                            if (textures[i]) {
                                if (!textures[i].isReady()) {
                                    return false;
                                }
                                else {
                                    defines[textureDefines[i]] = true;
                                }
                            }
                        }
                    }
                    if (BABYLON.StandardMaterial.BumpTextureEnabled) {
                        var textures = [this.normalTextureX, this.normalTextureY, this.normalTextureZ];
                        var textureDefines = ["BUMPX", "BUMPY", "BUMPZ"];
                        for (var i = 0; i < textures.length; i++) {
                            if (textures[i]) {
                                if (!textures[i].isReady()) {
                                    return false;
                                }
                                else {
                                    defines[textureDefines[i]] = true;
                                }
                            }
                        }
                    }
                }
            }
            // Misc.
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            // Lights
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
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
                if (defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, defines);
                // Legacy browser patch
                var shaderName = "triplanar";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor", "vSpecularColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "mBones",
                    "vClipPlane",
                    "tileSize"
                ];
                var samplers = ["diffuseSamplerX", "diffuseSamplerY", "diffuseSamplerZ",
                    "normalSamplerX", "normalSamplerY", "normalSamplerZ"
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
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        TriPlanarMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            this._activeEffect.setFloat("tileSize", this.tileSize);
            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this.diffuseTextureX) {
                    this._activeEffect.setTexture("diffuseSamplerX", this.diffuseTextureX);
                }
                if (this.diffuseTextureY) {
                    this._activeEffect.setTexture("diffuseSamplerY", this.diffuseTextureY);
                }
                if (this.diffuseTextureZ) {
                    this._activeEffect.setTexture("diffuseSamplerZ", this.diffuseTextureZ);
                }
                if (this.normalTextureX) {
                    this._activeEffect.setTexture("normalSamplerX", this.normalTextureX);
                }
                if (this.normalTextureY) {
                    this._activeEffect.setTexture("normalSamplerY", this.normalTextureY);
                }
                if (this.normalTextureZ) {
                    this._activeEffect.setTexture("normalSamplerZ", this.normalTextureZ);
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
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
        TriPlanarMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.mixTexture && this.mixTexture.animations && this.mixTexture.animations.length > 0) {
                results.push(this.mixTexture);
            }
            return results;
        };
        TriPlanarMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._diffuseTextureX) {
                activeTextures.push(this._diffuseTextureX);
            }
            if (this._diffuseTextureY) {
                activeTextures.push(this._diffuseTextureY);
            }
            if (this._diffuseTextureZ) {
                activeTextures.push(this._diffuseTextureZ);
            }
            if (this._normalTextureX) {
                activeTextures.push(this._normalTextureX);
            }
            if (this._normalTextureY) {
                activeTextures.push(this._normalTextureY);
            }
            if (this._normalTextureZ) {
                activeTextures.push(this._normalTextureZ);
            }
            return activeTextures;
        };
        TriPlanarMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this._diffuseTextureX === texture) {
                return true;
            }
            if (this._diffuseTextureY === texture) {
                return true;
            }
            if (this._diffuseTextureZ === texture) {
                return true;
            }
            if (this._normalTextureX === texture) {
                return true;
            }
            if (this._normalTextureY === texture) {
                return true;
            }
            if (this._normalTextureZ === texture) {
                return true;
            }
            return false;
        };
        TriPlanarMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.mixTexture) {
                this.mixTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        TriPlanarMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new TriPlanarMaterial(name, _this.getScene()); }, this);
        };
        TriPlanarMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.TriPlanarMaterial";
            return serializationObject;
        };
        TriPlanarMaterial.prototype.getClassName = function () {
            return "TriPlanarMaterial";
        };
        // Statics
        TriPlanarMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new TriPlanarMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsTexture()
        ], TriPlanarMaterial.prototype, "mixTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTextureX")
        ], TriPlanarMaterial.prototype, "_diffuseTextureX", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TriPlanarMaterial.prototype, "diffuseTextureX", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexturY")
        ], TriPlanarMaterial.prototype, "_diffuseTextureY", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TriPlanarMaterial.prototype, "diffuseTextureY", void 0);
        __decorate([
            BABYLON.serializeAsTexture("diffuseTextureZ")
        ], TriPlanarMaterial.prototype, "_diffuseTextureZ", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TriPlanarMaterial.prototype, "diffuseTextureZ", void 0);
        __decorate([
            BABYLON.serializeAsTexture("normalTextureX")
        ], TriPlanarMaterial.prototype, "_normalTextureX", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TriPlanarMaterial.prototype, "normalTextureX", void 0);
        __decorate([
            BABYLON.serializeAsTexture("normalTextureY")
        ], TriPlanarMaterial.prototype, "_normalTextureY", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TriPlanarMaterial.prototype, "normalTextureY", void 0);
        __decorate([
            BABYLON.serializeAsTexture("normalTextureZ")
        ], TriPlanarMaterial.prototype, "_normalTextureZ", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], TriPlanarMaterial.prototype, "normalTextureZ", void 0);
        __decorate([
            BABYLON.serialize()
        ], TriPlanarMaterial.prototype, "tileSize", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], TriPlanarMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], TriPlanarMaterial.prototype, "specularColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], TriPlanarMaterial.prototype, "specularPower", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], TriPlanarMaterial.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], TriPlanarMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], TriPlanarMaterial.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], TriPlanarMaterial.prototype, "maxSimultaneousLights", void 0);
        return TriPlanarMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.TriPlanarMaterial = TriPlanarMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.triPlanarMaterial.js.map

BABYLON.Effect.ShadersStore['triplanarVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSEX\nvarying vec2 vTextureUVX;\n#endif\n#ifdef DIFFUSEY\nvarying vec2 vTextureUVY;\n#endif\n#ifdef DIFFUSEZ\nvarying vec2 vTextureUVZ;\n#endif\nuniform float tileSize;\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying mat3 tangentSpace;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void)\n{\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef DIFFUSEX\nvTextureUVX=worldPos.zy/tileSize;\n#endif\n#ifdef DIFFUSEY\nvTextureUVY=worldPos.xz/tileSize;\n#endif\n#ifdef DIFFUSEZ\nvTextureUVZ=worldPos.xy/tileSize;\n#endif\n#ifdef NORMAL\n\nvec3 xtan=vec3(0,0,1);\nvec3 xbin=vec3(0,1,0);\nvec3 ytan=vec3(1,0,0);\nvec3 ybin=vec3(0,0,1);\nvec3 ztan=vec3(1,0,0);\nvec3 zbin=vec3(0,1,0);\nvec3 normalizedNormal=normalize(normal);\nnormalizedNormal*=normalizedNormal;\nvec3 worldBinormal=normalize(xbin*normalizedNormal.x+ybin*normalizedNormal.y+zbin*normalizedNormal.z);\nvec3 worldTangent=normalize(xtan*normalizedNormal.x+ytan*normalizedNormal.y+ztan*normalizedNormal.z);\nworldTangent=(world*vec4(worldTangent,1.0)).xyz;\nworldBinormal=(world*vec4(worldBinormal,1.0)).xyz;\nvec3 worldNormal=normalize(cross(worldTangent,worldBinormal));\ntangentSpace[0]=worldTangent;\ntangentSpace[1]=worldBinormal;\ntangentSpace[2]=worldNormal;\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['triplanarPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\n#ifdef DIFFUSEX\nvarying vec2 vTextureUVX;\nuniform sampler2D diffuseSamplerX;\n#ifdef BUMPX\nuniform sampler2D normalSamplerX;\n#endif\n#endif\n#ifdef DIFFUSEY\nvarying vec2 vTextureUVY;\nuniform sampler2D diffuseSamplerY;\n#ifdef BUMPY\nuniform sampler2D normalSamplerY;\n#endif\n#endif\n#ifdef DIFFUSEZ\nvarying vec2 vTextureUVZ;\nuniform sampler2D diffuseSamplerZ;\n#ifdef BUMPZ\nuniform sampler2D normalSamplerZ;\n#endif\n#endif\n#ifdef NORMAL\nvarying mat3 tangentSpace;\n#endif\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(0.,0.,0.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=tangentSpace[2];\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\nvec4 baseNormal=vec4(0.0,0.0,0.0,1.0);\nnormalW*=normalW;\n#ifdef DIFFUSEX\nbaseColor+=texture2D(diffuseSamplerX,vTextureUVX)*normalW.x;\n#ifdef BUMPX\nbaseNormal+=texture2D(normalSamplerX,vTextureUVX)*normalW.x;\n#endif\n#endif\n#ifdef DIFFUSEY\nbaseColor+=texture2D(diffuseSamplerY,vTextureUVY)*normalW.y;\n#ifdef BUMPY\nbaseNormal+=texture2D(normalSamplerY,vTextureUVY)*normalW.y;\n#endif\n#endif\n#ifdef DIFFUSEZ\nbaseColor+=texture2D(diffuseSamplerZ,vTextureUVZ)*normalW.z;\n#ifdef BUMPZ\nbaseNormal+=texture2D(normalSamplerZ,vTextureUVZ)*normalW.z;\n#endif\n#endif\n#ifdef NORMAL\nnormalW=normalize((2.0*baseNormal.xyz-1.0)*tangentSpace);\n#endif\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularBase=vec3(0.,0.,0.);\nvec3 specularColor=vSpecularColor.rgb;\n#else\nfloat glossiness=0.;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;\n\nvec4 color=vec4(finalDiffuse+finalSpecular,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}\n";




var BABYLON;
(function (BABYLON) {
    var SkyMaterialDefines = /** @class */ (function (_super) {
        __extends(SkyMaterialDefines, _super);
        function SkyMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.CLIPPLANE = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.rebuild();
            return _this;
        }
        return SkyMaterialDefines;
    }(BABYLON.MaterialDefines));
    var SkyMaterial = /** @class */ (function (_super) {
        __extends(SkyMaterial, _super);
        function SkyMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            // Public members
            _this.luminance = 1.0;
            _this.turbidity = 10.0;
            _this.rayleigh = 2.0;
            _this.mieCoefficient = 0.005;
            _this.mieDirectionalG = 0.8;
            _this.distance = 500;
            _this.inclination = 0.49;
            _this.azimuth = 0.25;
            _this.sunPosition = new BABYLON.Vector3(0, 100, 0);
            _this.useSunPosition = false;
            // Private members
            _this._cameraPosition = BABYLON.Vector3.Zero();
            return _this;
        }
        SkyMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        SkyMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        SkyMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        SkyMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new SkyMaterialDefines();
            }
            var defines = subMesh._materialDefines;
            var scene = this.getScene();
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            // Attribs
            BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, false);
            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                var shaderName = "sky";
                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect(shaderName, attribs, ["world", "viewProjection", "view",
                    "vFogInfos", "vFogColor", "pointSize", "vClipPlane",
                    "luminance", "turbidity", "rayleigh", "mieCoefficient", "mieDirectionalG", "sunPosition",
                    "cameraPosition"
                ], [], join, fallbacks, this.onCompiled, this.onError), defines);
            }
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        SkyMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            if (this._mustRebind(scene, effect)) {
                // Clip plane
                if (scene.clipPlane) {
                    var clipPlane = scene.clipPlane;
                    this._activeEffect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
                }
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            // Sky
            var camera = scene.activeCamera;
            if (camera) {
                var cameraWorldMatrix = camera.getWorldMatrix();
                this._cameraPosition.x = cameraWorldMatrix.m[12];
                this._cameraPosition.y = cameraWorldMatrix.m[13];
                this._cameraPosition.z = cameraWorldMatrix.m[14];
                this._activeEffect.setVector3("cameraPosition", this._cameraPosition);
            }
            if (this.luminance > 0) {
                this._activeEffect.setFloat("luminance", this.luminance);
            }
            this._activeEffect.setFloat("turbidity", this.turbidity);
            this._activeEffect.setFloat("rayleigh", this.rayleigh);
            this._activeEffect.setFloat("mieCoefficient", this.mieCoefficient);
            this._activeEffect.setFloat("mieDirectionalG", this.mieDirectionalG);
            if (!this.useSunPosition) {
                var theta = Math.PI * (this.inclination - 0.5);
                var phi = 2 * Math.PI * (this.azimuth - 0.5);
                this.sunPosition.x = this.distance * Math.cos(phi);
                this.sunPosition.y = this.distance * Math.sin(phi) * Math.sin(theta);
                this.sunPosition.z = this.distance * Math.sin(phi) * Math.cos(theta);
            }
            this._activeEffect.setVector3("sunPosition", this.sunPosition);
            this._afterBind(mesh, this._activeEffect);
        };
        SkyMaterial.prototype.getAnimatables = function () {
            return [];
        };
        SkyMaterial.prototype.dispose = function (forceDisposeEffect) {
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        SkyMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new SkyMaterial(name, _this.getScene()); }, this);
        };
        SkyMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.SkyMaterial";
            return serializationObject;
        };
        SkyMaterial.prototype.getClassName = function () {
            return "SkyMaterial";
        };
        // Statics
        SkyMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new SkyMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "luminance", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "turbidity", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "rayleigh", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "mieCoefficient", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "mieDirectionalG", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "distance", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "inclination", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "azimuth", void 0);
        __decorate([
            BABYLON.serializeAsVector3()
        ], SkyMaterial.prototype, "sunPosition", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "useSunPosition", void 0);
        return SkyMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.SkyMaterial = SkyMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.skyMaterial.js.map

BABYLON.Effect.ShadersStore['skyVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n\nuniform mat4 world;\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\nvoid main(void) {\ngl_Position=viewProjection*world*vec4(position,1.0);\nvec4 worldPos=world*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['skyPixelShader'] = "precision highp float;\n\nvarying vec3 vPositionW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneFragmentDeclaration>\n\nuniform vec3 cameraPosition;\nuniform float luminance;\nuniform float turbidity;\nuniform float rayleigh;\nuniform float mieCoefficient;\nuniform float mieDirectionalG;\nuniform vec3 sunPosition;\n\n#include<fogFragmentDeclaration>\n\nconst float e=2.71828182845904523536028747135266249775724709369995957;\nconst float pi=3.141592653589793238462643383279502884197169;\nconst float n=1.0003;\nconst float N=2.545E25;\nconst float pn=0.035;\nconst vec3 lambda=vec3(680E-9,550E-9,450E-9);\nconst vec3 K=vec3(0.686,0.678,0.666);\nconst float v=4.0;\nconst float rayleighZenithLength=8.4E3;\nconst float mieZenithLength=1.25E3;\nconst vec3 up=vec3(0.0,1.0,0.0);\nconst float EE=1000.0;\nconst float sunAngularDiameterCos=0.999956676946448443553574619906976478926848692873900859324;\nconst float cutoffAngle=pi/1.95;\nconst float steepness=1.5;\nvec3 totalRayleigh(vec3 lambda)\n{\nreturn (8.0*pow(pi,3.0)*pow(pow(n,2.0)-1.0,2.0)*(6.0+3.0*pn))/(3.0*N*pow(lambda,vec3(4.0))*(6.0-7.0*pn));\n}\nvec3 simplifiedRayleigh()\n{\nreturn 0.0005/vec3(94,40,18);\n}\nfloat rayleighPhase(float cosTheta)\n{ \nreturn (3.0/(16.0*pi))*(1.0+pow(cosTheta,2.0));\n}\nvec3 totalMie(vec3 lambda,vec3 K,float T)\n{\nfloat c=(0.2*T )*10E-18;\nreturn 0.434*c*pi*pow((2.0*pi)/lambda,vec3(v-2.0))*K;\n}\nfloat hgPhase(float cosTheta,float g)\n{\nreturn (1.0/(4.0*pi))*((1.0-pow(g,2.0))/pow(1.0-2.0*g*cosTheta+pow(g,2.0),1.5));\n}\nfloat sunIntensity(float zenithAngleCos)\n{\nreturn EE*max(0.0,1.0-exp(-((cutoffAngle-acos(zenithAngleCos))/steepness)));\n}\nfloat A=0.15;\nfloat B=0.50;\nfloat C=0.10;\nfloat D=0.20;\nfloat EEE=0.02;\nfloat F=0.30;\nfloat W=1000.0;\nvec3 Uncharted2Tonemap(vec3 x)\n{\nreturn ((x*(A*x+C*B)+D*EEE)/(x*(A*x+B)+D*F))-EEE/F;\n}\nvoid main(void) {\n\n#include<clipPlaneFragment>\n\nfloat sunfade=1.0-clamp(1.0-exp((sunPosition.y/450000.0)),0.0,1.0);\nfloat rayleighCoefficient=rayleigh-(1.0*(1.0-sunfade));\nvec3 sunDirection=normalize(sunPosition);\nfloat sunE=sunIntensity(dot(sunDirection,up));\nvec3 betaR=simplifiedRayleigh()*rayleighCoefficient;\nvec3 betaM=totalMie(lambda,K,turbidity)*mieCoefficient;\nfloat zenithAngle=acos(max(0.0,dot(up,normalize(vPositionW-cameraPosition))));\nfloat sR=rayleighZenithLength/(cos(zenithAngle)+0.15*pow(93.885-((zenithAngle*180.0)/pi),-1.253));\nfloat sM=mieZenithLength/(cos(zenithAngle)+0.15*pow(93.885-((zenithAngle*180.0)/pi),-1.253));\nvec3 Fex=exp(-(betaR*sR+betaM*sM));\nfloat cosTheta=dot(normalize(vPositionW-cameraPosition),sunDirection);\nfloat rPhase=rayleighPhase(cosTheta*0.5+0.5);\nvec3 betaRTheta=betaR*rPhase;\nfloat mPhase=hgPhase(cosTheta,mieDirectionalG);\nvec3 betaMTheta=betaM*mPhase;\nvec3 Lin=pow(sunE*((betaRTheta+betaMTheta)/(betaR+betaM))*(1.0-Fex),vec3(1.5));\nLin*=mix(vec3(1.0),pow(sunE*((betaRTheta+betaMTheta)/(betaR+betaM))*Fex,vec3(1.0/2.0)),clamp(pow(1.0-dot(up,sunDirection),5.0),0.0,1.0));\nvec3 direction=normalize(vPositionW-cameraPosition);\nfloat theta=acos(direction.y);\nfloat phi=atan(direction.z,direction.x);\nvec2 uv=vec2(phi,theta)/vec2(2.0*pi,pi)+vec2(0.5,0.0);\nvec3 L0=vec3(0.1)*Fex;\nfloat sundisk=smoothstep(sunAngularDiameterCos,sunAngularDiameterCos+0.00002,cosTheta);\nL0+=(sunE*19000.0*Fex)*sundisk;\nvec3 whiteScale=1.0/Uncharted2Tonemap(vec3(W));\nvec3 texColor=(Lin+L0); \ntexColor*=0.04 ;\ntexColor+=vec3(0.0,0.001,0.0025)*0.3;\nfloat g_fMaxLuminance=1.0;\nfloat fLumScaled=0.1/luminance; \nfloat fLumCompressed=(fLumScaled*(1.0+(fLumScaled/(g_fMaxLuminance*g_fMaxLuminance))))/(1.0+fLumScaled); \nfloat ExposureBias=fLumCompressed;\nvec3 curr=Uncharted2Tonemap((log2(2.0/pow(luminance,4.0)))*texColor);\n\n\n\nvec3 retColor=curr*whiteScale;\n\n\nfloat alpha=1.0;\n#ifdef VERTEXCOLOR\nretColor.rgb*=vColor.rgb;\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n\nvec4 color=clamp(vec4(retColor.rgb,alpha),0.0,1.0);\n\n#include<fogFragment>\ngl_FragColor=color;\n}";




var BABYLON;
(function (BABYLON) {
    var GridMaterialDefines = /** @class */ (function (_super) {
        __extends(GridMaterialDefines, _super);
        function GridMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.TRANSPARENT = false;
            _this.FOG = false;
            _this.PREMULTIPLYALPHA = false;
            _this.rebuild();
            return _this;
        }
        return GridMaterialDefines;
    }(BABYLON.MaterialDefines));
    /**
     * The grid materials allows you to wrap any shape with a grid.
     * Colors are customizable.
     */
    var GridMaterial = /** @class */ (function (_super) {
        __extends(GridMaterial, _super);
        /**
         * constructor
         * @param name The name given to the material in order to identify it afterwards.
         * @param scene The scene the material is used in.
         */
        function GridMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            /**
             * Main color of the grid (e.g. between lines)
             */
            _this.mainColor = BABYLON.Color3.Black();
            /**
             * Color of the grid lines.
             */
            _this.lineColor = BABYLON.Color3.Teal();
            /**
             * The scale of the grid compared to unit.
             */
            _this.gridRatio = 1.0;
            /**
             * Allows setting an offset for the grid lines.
             */
            _this.gridOffset = BABYLON.Vector3.Zero();
            /**
             * The frequency of thicker lines.
             */
            _this.majorUnitFrequency = 10;
            /**
             * The visibility of minor units in the grid.
             */
            _this.minorUnitVisibility = 0.33;
            /**
             * The grid opacity outside of the lines.
             */
            _this.opacity = 1.0;
            /**
             * Determine RBG output is premultiplied by alpha value.
             */
            _this.preMultiplyAlpha = false;
            _this._gridControl = new BABYLON.Vector4(_this.gridRatio, _this.majorUnitFrequency, _this.minorUnitVisibility, _this.opacity);
            return _this;
        }
        /**
         * Returns wehter or not the grid requires alpha blending.
         */
        GridMaterial.prototype.needAlphaBlending = function () {
            return this.opacity < 1.0;
        };
        GridMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new GridMaterialDefines();
            }
            var defines = subMesh._materialDefines;
            var scene = this.getScene();
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }
            if (defines.TRANSPARENT !== (this.opacity < 1.0)) {
                defines.TRANSPARENT = !defines.TRANSPARENT;
                defines.markAsUnprocessed();
            }
            if (defines.PREMULTIPLYALPHA != this.preMultiplyAlpha) {
                defines.PREMULTIPLYALPHA = !defines.PREMULTIPLYALPHA;
                defines.markAsUnprocessed();
            }
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, false, this.fogEnabled, defines);
            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind, BABYLON.VertexBuffer.NormalKind];
                // Defines
                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect("grid", attribs, ["projection", "worldView", "mainColor", "lineColor", "gridControl", "gridOffset", "vFogInfos", "vFogColor", "world", "view"], [], join, null, this.onCompiled, this.onError), defines);
            }
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        GridMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("worldView", world.multiply(scene.getViewMatrix()));
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
            this._activeEffect.setMatrix("projection", scene.getProjectionMatrix());
            // Uniforms
            if (this._mustRebind(scene, effect)) {
                this._activeEffect.setColor3("mainColor", this.mainColor);
                this._activeEffect.setColor3("lineColor", this.lineColor);
                this._activeEffect.setVector3("gridOffset", this.gridOffset);
                this._gridControl.x = this.gridRatio;
                this._gridControl.y = Math.round(this.majorUnitFrequency);
                this._gridControl.z = this.minorUnitVisibility;
                this._gridControl.w = this.opacity;
                this._activeEffect.setVector4("gridControl", this._gridControl);
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            this._afterBind(mesh, this._activeEffect);
        };
        GridMaterial.prototype.dispose = function (forceDisposeEffect) {
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        GridMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new GridMaterial(name, _this.getScene()); }, this);
        };
        GridMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.GridMaterial";
            return serializationObject;
        };
        GridMaterial.prototype.getClassName = function () {
            return "GridMaterial";
        };
        GridMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new GridMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsColor3()
        ], GridMaterial.prototype, "mainColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], GridMaterial.prototype, "lineColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], GridMaterial.prototype, "gridRatio", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], GridMaterial.prototype, "gridOffset", void 0);
        __decorate([
            BABYLON.serialize()
        ], GridMaterial.prototype, "majorUnitFrequency", void 0);
        __decorate([
            BABYLON.serialize()
        ], GridMaterial.prototype, "minorUnitVisibility", void 0);
        __decorate([
            BABYLON.serialize()
        ], GridMaterial.prototype, "opacity", void 0);
        __decorate([
            BABYLON.serialize()
        ], GridMaterial.prototype, "preMultiplyAlpha", void 0);
        return GridMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.GridMaterial = GridMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.gridmaterial.js.map

BABYLON.Effect.ShadersStore['gridVertexShader'] = "precision highp float;\n\nattribute vec3 position;\nattribute vec3 normal;\n\nuniform mat4 projection;\nuniform mat4 world;\nuniform mat4 view;\nuniform mat4 worldView;\n\n#ifdef TRANSPARENT\nvarying vec4 vCameraSpacePosition;\n#endif\nvarying vec3 vPosition;\nvarying vec3 vNormal;\n#include<fogVertexDeclaration>\nvoid main(void) {\n#ifdef FOG\nvec4 worldPos=world*vec4(position,1.0);\n#endif\n#include<fogVertex>\nvec4 cameraSpacePosition=worldView*vec4(position,1.0);\ngl_Position=projection*cameraSpacePosition;\n#ifdef TRANSPARENT\nvCameraSpacePosition=cameraSpacePosition;\n#endif\nvPosition=position;\nvNormal=normal;\n}";
BABYLON.Effect.ShadersStore['gridPixelShader'] = "#extension GL_OES_standard_derivatives : enable\n#define SQRT2 1.41421356\n#define PI 3.14159\nprecision highp float;\nuniform vec3 mainColor;\nuniform vec3 lineColor;\nuniform vec4 gridControl;\nuniform vec3 gridOffset;\n\n#ifdef TRANSPARENT\nvarying vec4 vCameraSpacePosition;\n#endif\nvarying vec3 vPosition;\nvarying vec3 vNormal;\n#include<fogFragmentDeclaration>\nfloat getVisibility(float position) {\n\nfloat majorGridFrequency=gridControl.y;\nif (floor(position+0.5) == floor(position/majorGridFrequency+0.5)*majorGridFrequency)\n{\nreturn 1.0;\n} \nreturn gridControl.z;\n}\nfloat getAnisotropicAttenuation(float differentialLength) {\nconst float maxNumberOfLines=10.0;\nreturn clamp(1.0/(differentialLength+1.0)-1.0/maxNumberOfLines,0.0,1.0);\n}\nfloat isPointOnLine(float position,float differentialLength) {\nfloat fractionPartOfPosition=position-floor(position+0.5); \nfractionPartOfPosition/=differentialLength; \nfractionPartOfPosition=clamp(fractionPartOfPosition,-1.,1.);\nfloat result=0.5+0.5*cos(fractionPartOfPosition*PI); \nreturn result; \n}\nfloat contributionOnAxis(float position) {\nfloat differentialLength=length(vec2(dFdx(position),dFdy(position)));\ndifferentialLength*=SQRT2; \n\nfloat result=isPointOnLine(position,differentialLength);\n\nfloat visibility=getVisibility(position);\nresult*=visibility;\n\nfloat anisotropicAttenuation=getAnisotropicAttenuation(differentialLength);\nresult*=anisotropicAttenuation;\nreturn result;\n}\nfloat normalImpactOnAxis(float x) {\nfloat normalImpact=clamp(1.0-3.0*abs(x*x*x),0.0,1.0);\nreturn normalImpact;\n}\nvoid main(void) {\n\nfloat gridRatio=gridControl.x;\nvec3 gridPos=(vPosition+gridOffset)/gridRatio;\n\nfloat x=contributionOnAxis(gridPos.x);\nfloat y=contributionOnAxis(gridPos.y);\nfloat z=contributionOnAxis(gridPos.z);\n\nvec3 normal=normalize(vNormal);\nx*=normalImpactOnAxis(normal.x);\ny*=normalImpactOnAxis(normal.y);\nz*=normalImpactOnAxis(normal.z);\n\nfloat grid=clamp(x+y+z,0.,1.);\n\nvec3 color=mix(mainColor,lineColor,grid);\n#ifdef FOG\n#include<fogFragment>\n#endif\n#ifdef TRANSPARENT\nfloat distanceToFragment=length(vCameraSpacePosition.xyz);\nfloat cameraPassThrough=clamp(distanceToFragment-0.25,0.0,1.0);\nfloat opacity=clamp(grid,0.08,cameraPassThrough*gridControl.w*grid);\ngl_FragColor=vec4(color.rgb,opacity);\n#ifdef PREMULTIPLYALPHA\ngl_FragColor.rgb*=opacity;\n#endif\n#else\n\ngl_FragColor=vec4(color.rgb,1.0);\n#endif\n}";




var BABYLON;
(function (BABYLON) {
    // old version of standard material updated every 3 months
    var StandardMaterialDefines_OldVer = /** @class */ (function (_super) {
        __extends(StandardMaterialDefines_OldVer, _super);
        function StandardMaterialDefines_OldVer() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.AMBIENT = false;
            _this.OPACITY = false;
            _this.OPACITYRGB = false;
            _this.REFLECTION = false;
            _this.EMISSIVE = false;
            _this.SPECULAR = false;
            _this.BUMP = false;
            _this.PARALLAX = false;
            _this.PARALLAXOCCLUSION = false;
            _this.SPECULAROVERALPHA = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.ALPHAFROMDIFFUSE = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.SPECULARTERM = false;
            _this.DIFFUSEFRESNEL = false;
            _this.OPACITYFRESNEL = false;
            _this.REFLECTIONFRESNEL = false;
            _this.REFRACTIONFRESNEL = false;
            _this.EMISSIVEFRESNEL = false;
            _this.FRESNEL = false;
            _this.NORMAL = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.GLOSSINESS = false;
            _this.ROUGHNESS = false;
            _this.EMISSIVEASILLUMINATION = false;
            _this.LINKEMISSIVEWITHDIFFUSE = false;
            _this.REFLECTIONFRESNELFROMSPECULAR = false;
            _this.LIGHTMAP = false;
            _this.USELIGHTMAPASSHADOWMAP = false;
            _this.REFLECTIONMAP_3D = false;
            _this.REFLECTIONMAP_SPHERICAL = false;
            _this.REFLECTIONMAP_PLANAR = false;
            _this.REFLECTIONMAP_CUBIC = false;
            _this.REFLECTIONMAP_PROJECTION = false;
            _this.REFLECTIONMAP_SKYBOX = false;
            _this.REFLECTIONMAP_EXPLICIT = false;
            _this.REFLECTIONMAP_EQUIRECTANGULAR = false;
            _this.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
            _this.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
            _this.INVERTCUBICMAP = false;
            _this.LOGARITHMICDEPTH = false;
            _this.REFRACTION = false;
            _this.REFRACTIONMAP_3D = false;
            _this.REFLECTIONOVERALPHA = false;
            _this.TWOSIDEDLIGHTING = false;
            _this.SHADOWFLOAT = false;
            _this.MORPHTARGETS = false;
            _this.MORPHTARGETS_NORMAL = false;
            _this.MORPHTARGETS_TANGENT = false;
            _this.NUM_MORPH_INFLUENCERS = 0;
            _this.IMAGEPROCESSING = false;
            _this.VIGNETTE = false;
            _this.VIGNETTEBLENDMODEMULTIPLY = false;
            _this.VIGNETTEBLENDMODEOPAQUE = false;
            _this.TONEMAPPING = false;
            _this.CONTRAST = false;
            _this.COLORCURVES = false;
            _this.COLORGRADING = false;
            _this.COLORGRADING3D = false;
            _this.SAMPLER3DGREENDEPTH = false;
            _this.SAMPLER3DBGRMAP = false;
            _this.IMAGEPROCESSINGPOSTPROCESS = false;
            _this.EXPOSURE = false;
            _this.rebuild();
            return _this;
        }
        StandardMaterialDefines_OldVer.prototype.setReflectionMode = function (modeToEnable) {
            var modes = [
                "REFLECTIONMAP_CUBIC", "REFLECTIONMAP_EXPLICIT", "REFLECTIONMAP_PLANAR",
                "REFLECTIONMAP_PROJECTION", "REFLECTIONMAP_PROJECTION", "REFLECTIONMAP_SKYBOX",
                "REFLECTIONMAP_SPHERICAL", "REFLECTIONMAP_EQUIRECTANGULAR", "REFLECTIONMAP_EQUIRECTANGULAR_FIXED",
                "REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED"
            ];
            for (var _i = 0, modes_1 = modes; _i < modes_1.length; _i++) {
                var mode = modes_1[_i];
                this[mode] = (mode === modeToEnable);
            }
        };
        return StandardMaterialDefines_OldVer;
    }(BABYLON.MaterialDefines));
    BABYLON.StandardMaterialDefines_OldVer = StandardMaterialDefines_OldVer;
    var StandardMaterial_OldVer = /** @class */ (function (_super) {
        __extends(StandardMaterial_OldVer, _super);
        function StandardMaterial_OldVer(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.ambientColor = new BABYLON.Color3(0, 0, 0);
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this.specularColor = new BABYLON.Color3(1, 1, 1);
            _this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            _this.specularPower = 64;
            _this._useAlphaFromDiffuseTexture = false;
            _this._useEmissiveAsIllumination = false;
            _this._linkEmissiveWithDiffuse = false;
            _this._useSpecularOverAlpha = false;
            _this._useReflectionOverAlpha = false;
            _this._disableLighting = false;
            _this._useParallax = false;
            _this._useParallaxOcclusion = false;
            _this.parallaxScaleBias = 0.05;
            _this._roughness = 0;
            _this.indexOfRefraction = 0.98;
            _this.invertRefractionY = true;
            _this._useLightmapAsShadowmap = false;
            _this._useReflectionFresnelFromSpecular = false;
            _this._useGlossinessFromSpecularMapAlpha = false;
            _this._maxSimultaneousLights = 4;
            /**
             * If sets to true, x component of normal map value will invert (x = 1.0 - x).
             */
            _this._invertNormalMapX = false;
            /**
             * If sets to true, y component of normal map value will invert (y = 1.0 - y).
             */
            _this._invertNormalMapY = false;
            /**
             * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
             */
            _this._twoSidedLighting = false;
            _this._renderTargets = new BABYLON.SmartArray(16);
            _this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
            _this._globalAmbientColor = new BABYLON.Color3(0, 0, 0);
            // Setup the default processing configuration to the scene.
            _this._attachImageProcessingConfiguration(null);
            _this.getRenderTargetTextures = function () {
                _this._renderTargets.reset();
                if (StandardMaterial_OldVer.ReflectionTextureEnabled && _this._reflectionTexture && _this._reflectionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this._reflectionTexture);
                }
                if (StandardMaterial_OldVer.RefractionTextureEnabled && _this._refractionTexture && _this._refractionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this._refractionTexture);
                }
                return _this._renderTargets;
            };
            return _this;
        }
        Object.defineProperty(StandardMaterial_OldVer.prototype, "imageProcessingConfiguration", {
            /**
             * Gets the image processing configuration used either in this material.
             */
            get: function () {
                return this._imageProcessingConfiguration;
            },
            /**
             * Sets the Default image processing configuration used either in the this material.
             *
             * If sets to null, the scene one is in use.
             */
            set: function (value) {
                this._attachImageProcessingConfiguration(value);
                // Ensure the effect will be rebuilt.
                this._markAllSubMeshesAsTexturesDirty();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Attaches a new image processing configuration to the Standard Material.
         * @param configuration
         */
        StandardMaterial_OldVer.prototype._attachImageProcessingConfiguration = function (configuration) {
            var _this = this;
            if (configuration === this._imageProcessingConfiguration) {
                return;
            }
            // Detaches observer.
            if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
                this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
            }
            // Pick the scene configuration if needed.
            if (!configuration) {
                this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration;
            }
            else {
                this._imageProcessingConfiguration = configuration;
            }
            // Attaches observer.
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(function (conf) {
                _this._markAllSubMeshesAsImageProcessingDirty();
            });
        };
        Object.defineProperty(StandardMaterial_OldVer.prototype, "cameraColorCurvesEnabled", {
            /**
             * Gets wether the color curves effect is enabled.
             */
            get: function () {
                return this.imageProcessingConfiguration.colorCurvesEnabled;
            },
            /**
             * Sets wether the color curves effect is enabled.
             */
            set: function (value) {
                this.imageProcessingConfiguration.colorCurvesEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer.prototype, "cameraColorGradingEnabled", {
            /**
             * Gets wether the color grading effect is enabled.
             */
            get: function () {
                return this.imageProcessingConfiguration.colorGradingEnabled;
            },
            /**
             * Gets wether the color grading effect is enabled.
             */
            set: function (value) {
                this.imageProcessingConfiguration.colorGradingEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer.prototype, "cameraToneMappingEnabled", {
            /**
             * Gets wether tonemapping is enabled or not.
             */
            get: function () {
                return this._imageProcessingConfiguration.toneMappingEnabled;
            },
            /**
             * Sets wether tonemapping is enabled or not
             */
            set: function (value) {
                this._imageProcessingConfiguration.toneMappingEnabled = value;
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(StandardMaterial_OldVer.prototype, "cameraExposure", {
            /**
             * The camera exposure used on this material.
             * This property is here and not in the camera to allow controlling exposure without full screen post process.
             * This corresponds to a photographic exposure.
             */
            get: function () {
                return this._imageProcessingConfiguration.exposure;
            },
            /**
             * The camera exposure used on this material.
             * This property is here and not in the camera to allow controlling exposure without full screen post process.
             * This corresponds to a photographic exposure.
             */
            set: function (value) {
                this._imageProcessingConfiguration.exposure = value;
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(StandardMaterial_OldVer.prototype, "cameraContrast", {
            /**
             * Gets The camera contrast used on this material.
             */
            get: function () {
                return this._imageProcessingConfiguration.contrast;
            },
            /**
             * Sets The camera contrast used on this material.
             */
            set: function (value) {
                this._imageProcessingConfiguration.contrast = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer.prototype, "cameraColorGradingTexture", {
            /**
             * Gets the Color Grading 2D Lookup Texture.
             */
            get: function () {
                return this._imageProcessingConfiguration.colorGradingTexture;
            },
            /**
             * Sets the Color Grading 2D Lookup Texture.
             */
            set: function (value) {
                this._imageProcessingConfiguration.colorGradingTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        StandardMaterial_OldVer.prototype.getClassName = function () {
            return "StandardMaterial_OldVer";
        };
        Object.defineProperty(StandardMaterial_OldVer.prototype, "useLogarithmicDepth", {
            get: function () {
                return this._useLogarithmicDepth;
            },
            set: function (value) {
                this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
                this._markAllSubMeshesAsMiscDirty();
            },
            enumerable: true,
            configurable: true
        });
        StandardMaterial_OldVer.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0) || (this._opacityTexture != null) || this._shouldUseAlphaFromDiffuseTexture() || this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled;
        };
        StandardMaterial_OldVer.prototype.needAlphaTesting = function () {
            return this._diffuseTexture != null && this._diffuseTexture.hasAlpha;
        };
        StandardMaterial_OldVer.prototype._shouldUseAlphaFromDiffuseTexture = function () {
            return this._diffuseTexture != null && this._diffuseTexture.hasAlpha && this._useAlphaFromDiffuseTexture;
        };
        StandardMaterial_OldVer.prototype.getAlphaTestTexture = function () {
            return this._diffuseTexture;
        };
        /**
         * Child classes can use it to update shaders
         */
        StandardMaterial_OldVer.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new StandardMaterialDefines_OldVer();
            }
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (defines._renderId === scene.getRenderId()) {
                    return true;
                }
            }
            var engine = scene.getEngine();
            // Lights
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && StandardMaterial_OldVer.DiffuseTextureEnabled) {
                        if (!this._diffuseTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.DIFFUSE = true;
                        }
                    }
                    else {
                        defines.DIFFUSE = false;
                    }
                    if (this._ambientTexture && StandardMaterial_OldVer.AmbientTextureEnabled) {
                        if (!this._ambientTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.AMBIENT = true;
                        }
                    }
                    else {
                        defines.AMBIENT = false;
                    }
                    if (this._opacityTexture && StandardMaterial_OldVer.OpacityTextureEnabled) {
                        if (!this._opacityTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.OPACITY = true;
                            defines.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
                        }
                    }
                    else {
                        defines.OPACITY = false;
                    }
                    if (this._reflectionTexture && StandardMaterial_OldVer.ReflectionTextureEnabled) {
                        if (!this._reflectionTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needNormals = true;
                            defines.REFLECTION = true;
                            defines.ROUGHNESS = (this._roughness > 0);
                            defines.REFLECTIONOVERALPHA = this._useReflectionOverAlpha;
                            defines.INVERTCUBICMAP = (this._reflectionTexture.coordinatesMode === BABYLON.Texture.INVCUBIC_MODE);
                            defines.REFLECTIONMAP_3D = this._reflectionTexture.isCube;
                            switch (this._reflectionTexture.coordinatesMode) {
                                case BABYLON.Texture.CUBIC_MODE:
                                case BABYLON.Texture.INVCUBIC_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_CUBIC");
                                    break;
                                case BABYLON.Texture.EXPLICIT_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_EXPLICIT");
                                    break;
                                case BABYLON.Texture.PLANAR_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_PLANAR");
                                    break;
                                case BABYLON.Texture.PROJECTION_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_PROJECTION");
                                    break;
                                case BABYLON.Texture.SKYBOX_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_SKYBOX");
                                    break;
                                case BABYLON.Texture.SPHERICAL_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_SPHERICAL");
                                    break;
                                case BABYLON.Texture.EQUIRECTANGULAR_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR");
                                    break;
                                case BABYLON.Texture.FIXED_EQUIRECTANGULAR_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR_FIXED");
                                    break;
                                case BABYLON.Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                                    defines.setReflectionMode("REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED");
                                    break;
                            }
                        }
                    }
                    else {
                        defines.REFLECTION = false;
                    }
                    if (this._emissiveTexture && StandardMaterial_OldVer.EmissiveTextureEnabled) {
                        if (!this._emissiveTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.EMISSIVE = true;
                        }
                    }
                    else {
                        defines.EMISSIVE = false;
                    }
                    if (this._lightmapTexture && StandardMaterial_OldVer.LightmapTextureEnabled) {
                        if (!this._lightmapTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.LIGHTMAP = true;
                            defines.USELIGHTMAPASSHADOWMAP = this._useLightmapAsShadowmap;
                        }
                    }
                    else {
                        defines.LIGHTMAP = false;
                    }
                    if (this._specularTexture && StandardMaterial_OldVer.SpecularTextureEnabled) {
                        if (!this._specularTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.SPECULAR = true;
                            defines.GLOSSINESS = this._useGlossinessFromSpecularMapAlpha;
                        }
                    }
                    else {
                        defines.SPECULAR = false;
                    }
                    if (scene.getEngine().getCaps().standardDerivatives && this._bumpTexture && StandardMaterial_OldVer.BumpTextureEnabled) {
                        // Bump texure can not be not blocking.
                        if (!this._bumpTexture.isReady()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.BUMP = true;
                            defines.PARALLAX = this._useParallax;
                            defines.PARALLAXOCCLUSION = this._useParallaxOcclusion;
                        }
                    }
                    else {
                        defines.BUMP = false;
                    }
                    if (this._refractionTexture && StandardMaterial_OldVer.RefractionTextureEnabled) {
                        if (!this._refractionTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.REFRACTION = true;
                            defines.REFRACTIONMAP_3D = this._refractionTexture.isCube;
                        }
                    }
                    else {
                        defines.REFRACTION = false;
                    }
                    defines.TWOSIDEDLIGHTING = !this._backFaceCulling && this._twoSidedLighting;
                }
                else {
                    defines.DIFFUSE = false;
                    defines.AMBIENT = false;
                    defines.OPACITY = false;
                    defines.REFLECTION = false;
                    defines.EMISSIVE = false;
                    defines.LIGHTMAP = false;
                    defines.BUMP = false;
                    defines.REFRACTION = false;
                }
                defines.ALPHAFROMDIFFUSE = this._shouldUseAlphaFromDiffuseTexture();
                defines.EMISSIVEASILLUMINATION = this._useEmissiveAsIllumination;
                defines.LINKEMISSIVEWITHDIFFUSE = this._linkEmissiveWithDiffuse;
                defines.SPECULAROVERALPHA = this._useSpecularOverAlpha;
            }
            if (defines._areImageProcessingDirty) {
                if (!this._imageProcessingConfiguration.isReady()) {
                    return false;
                }
                this._imageProcessingConfiguration.prepareDefines(defines);
            }
            if (defines._areFresnelDirty) {
                if (StandardMaterial_OldVer.FresnelEnabled) {
                    // Fresnel
                    if (this._diffuseFresnelParameters || this._opacityFresnelParameters ||
                        this._emissiveFresnelParameters || this._refractionFresnelParameters ||
                        this._reflectionFresnelParameters) {
                        defines.DIFFUSEFRESNEL = (this._diffuseFresnelParameters && this._diffuseFresnelParameters.isEnabled);
                        defines.OPACITYFRESNEL = (this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled);
                        defines.REFLECTIONFRESNEL = (this._reflectionFresnelParameters && this._reflectionFresnelParameters.isEnabled);
                        defines.REFLECTIONFRESNELFROMSPECULAR = this._useReflectionFresnelFromSpecular;
                        defines.REFRACTIONFRESNEL = (this._refractionFresnelParameters && this._refractionFresnelParameters.isEnabled);
                        defines.EMISSIVEFRESNEL = (this._emissiveFresnelParameters && this._emissiveFresnelParameters.isEnabled);
                        defines._needNormals = true;
                        defines.FRESNEL = true;
                    }
                }
                else {
                    defines.FRESNEL = false;
                }
            }
            // Misc.
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, defines);
            // Attribs
            BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true, true);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (defines.REFLECTION) {
                    fallbacks.addFallback(0, "REFLECTION");
                }
                if (defines.SPECULAR) {
                    fallbacks.addFallback(0, "SPECULAR");
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
                BABYLON.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this._maxSimultaneousLights);
                if (defines.SPECULARTERM) {
                    fallbacks.addFallback(0, "SPECULARTERM");
                }
                if (defines.DIFFUSEFRESNEL) {
                    fallbacks.addFallback(1, "DIFFUSEFRESNEL");
                }
                if (defines.OPACITYFRESNEL) {
                    fallbacks.addFallback(2, "OPACITYFRESNEL");
                }
                if (defines.REFLECTIONFRESNEL) {
                    fallbacks.addFallback(3, "REFLECTIONFRESNEL");
                }
                if (defines.EMISSIVEFRESNEL) {
                    fallbacks.addFallback(4, "EMISSIVEFRESNEL");
                }
                if (defines.FRESNEL) {
                    fallbacks.addFallback(4, "FRESNEL");
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
                BABYLON.MaterialHelper.PrepareAttributesForMorphTargets(attribs, mesh, defines);
                var shaderName = "default";
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos", "vLightmapInfos", "vRefractionInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix", "lightmapMatrix", "refractionMatrix",
                    "diffuseLeftColor", "diffuseRightColor", "opacityParts", "reflectionLeftColor", "reflectionRightColor", "emissiveLeftColor", "emissiveRightColor", "refractionLeftColor", "refractionRightColor",
                    "logarithmicDepthConstant", "vTangentSpaceParams"
                ];
                var samplers = ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler", "lightmapSampler", "refractionCubeSampler", "refraction2DSampler"];
                var uniformBuffers = ["Material", "Scene"];
                BABYLON.ImageProcessingConfiguration.PrepareUniforms(uniforms, defines);
                BABYLON.ImageProcessingConfiguration.PrepareSamplers(samplers, defines);
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList({
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: defines,
                    maxSimultaneousLights: this._maxSimultaneousLights
                });
                if (this.customShaderNameResolve) {
                    shaderName = this.customShaderNameResolve(shaderName, uniforms, uniformBuffers, samplers, defines);
                }
                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect(shaderName, {
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
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
        };
        StandardMaterial_OldVer.prototype.buildUniformLayout = function () {
            // Order is important !
            this._uniformBuffer.addUniform("diffuseLeftColor", 4);
            this._uniformBuffer.addUniform("diffuseRightColor", 4);
            this._uniformBuffer.addUniform("opacityParts", 4);
            this._uniformBuffer.addUniform("reflectionLeftColor", 4);
            this._uniformBuffer.addUniform("reflectionRightColor", 4);
            this._uniformBuffer.addUniform("refractionLeftColor", 4);
            this._uniformBuffer.addUniform("refractionRightColor", 4);
            this._uniformBuffer.addUniform("emissiveLeftColor", 4);
            this._uniformBuffer.addUniform("emissiveRightColor", 4);
            this._uniformBuffer.addUniform("vDiffuseInfos", 2);
            this._uniformBuffer.addUniform("vAmbientInfos", 2);
            this._uniformBuffer.addUniform("vOpacityInfos", 2);
            this._uniformBuffer.addUniform("vReflectionInfos", 2);
            this._uniformBuffer.addUniform("vEmissiveInfos", 2);
            this._uniformBuffer.addUniform("vLightmapInfos", 2);
            this._uniformBuffer.addUniform("vSpecularInfos", 2);
            this._uniformBuffer.addUniform("vBumpInfos", 3);
            this._uniformBuffer.addUniform("diffuseMatrix", 16);
            this._uniformBuffer.addUniform("ambientMatrix", 16);
            this._uniformBuffer.addUniform("opacityMatrix", 16);
            this._uniformBuffer.addUniform("reflectionMatrix", 16);
            this._uniformBuffer.addUniform("emissiveMatrix", 16);
            this._uniformBuffer.addUniform("lightmapMatrix", 16);
            this._uniformBuffer.addUniform("specularMatrix", 16);
            this._uniformBuffer.addUniform("bumpMatrix", 16);
            this._uniformBuffer.addUniform("vTangentSpaceParams", 2);
            this._uniformBuffer.addUniform("refractionMatrix", 16);
            this._uniformBuffer.addUniform("vRefractionInfos", 4);
            this._uniformBuffer.addUniform("vSpecularColor", 4);
            this._uniformBuffer.addUniform("vEmissiveColor", 3);
            this._uniformBuffer.addUniform("vDiffuseColor", 4);
            this._uniformBuffer.addUniform("pointSize", 1);
            this._uniformBuffer.create();
        };
        StandardMaterial_OldVer.prototype.unbind = function () {
            if (this._activeEffect) {
                if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                    this._activeEffect.setTexture("reflection2DSampler", null);
                }
                if (this._refractionTexture && this._refractionTexture.isRenderTarget) {
                    this._activeEffect.setTexture("refraction2DSampler", null);
                }
            }
            _super.prototype.unbind.call(this);
        };
        StandardMaterial_OldVer.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, effect);
            if (this._mustRebind(scene, effect, mesh.visibility)) {
                this._uniformBuffer.bindToEffect(effect, "Material");
                this.bindViewProjection(effect);
                if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync) {
                    if (StandardMaterial_OldVer.FresnelEnabled && defines.FRESNEL) {
                        // Fresnel
                        if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("diffuseLeftColor", this.diffuseFresnelParameters.leftColor, this.diffuseFresnelParameters.power);
                            this._uniformBuffer.updateColor4("diffuseRightColor", this.diffuseFresnelParameters.rightColor, this.diffuseFresnelParameters.bias);
                        }
                        if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("opacityParts", new BABYLON.Color3(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power);
                        }
                        if (this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("reflectionLeftColor", this.reflectionFresnelParameters.leftColor, this.reflectionFresnelParameters.power);
                            this._uniformBuffer.updateColor4("reflectionRightColor", this.reflectionFresnelParameters.rightColor, this.reflectionFresnelParameters.bias);
                        }
                        if (this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("refractionLeftColor", this.refractionFresnelParameters.leftColor, this.refractionFresnelParameters.power);
                            this._uniformBuffer.updateColor4("refractionRightColor", this.refractionFresnelParameters.rightColor, this.refractionFresnelParameters.bias);
                        }
                        if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                            this._uniformBuffer.updateColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                        }
                    }
                    // Textures     
                    if (scene.texturesEnabled) {
                        if (this._diffuseTexture && StandardMaterial_OldVer.DiffuseTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                            this._uniformBuffer.updateMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
                        }
                        if (this._ambientTexture && StandardMaterial_OldVer.AmbientTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vAmbientInfos", this._ambientTexture.coordinatesIndex, this._ambientTexture.level);
                            this._uniformBuffer.updateMatrix("ambientMatrix", this._ambientTexture.getTextureMatrix());
                        }
                        if (this._opacityTexture && StandardMaterial_OldVer.OpacityTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                            this._uniformBuffer.updateMatrix("opacityMatrix", this._opacityTexture.getTextureMatrix());
                        }
                        if (this._reflectionTexture && StandardMaterial_OldVer.ReflectionTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vReflectionInfos", this._reflectionTexture.level, this.roughness);
                            this._uniformBuffer.updateMatrix("reflectionMatrix", this._reflectionTexture.getReflectionTextureMatrix());
                        }
                        if (this._emissiveTexture && StandardMaterial_OldVer.EmissiveTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vEmissiveInfos", this._emissiveTexture.coordinatesIndex, this._emissiveTexture.level);
                            this._uniformBuffer.updateMatrix("emissiveMatrix", this._emissiveTexture.getTextureMatrix());
                        }
                        if (this._lightmapTexture && StandardMaterial_OldVer.LightmapTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vLightmapInfos", this._lightmapTexture.coordinatesIndex, this._lightmapTexture.level);
                            this._uniformBuffer.updateMatrix("lightmapMatrix", this._lightmapTexture.getTextureMatrix());
                        }
                        if (this._specularTexture && StandardMaterial_OldVer.SpecularTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vSpecularInfos", this._specularTexture.coordinatesIndex, this._specularTexture.level);
                            this._uniformBuffer.updateMatrix("specularMatrix", this._specularTexture.getTextureMatrix());
                        }
                        if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial_OldVer.BumpTextureEnabled) {
                            this._uniformBuffer.updateFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, 1.0 / this._bumpTexture.level, this.parallaxScaleBias);
                            this._uniformBuffer.updateMatrix("bumpMatrix", this._bumpTexture.getTextureMatrix());
                            if (scene._mirroredCameraPosition) {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? 1.0 : -1.0, this._invertNormalMapY ? 1.0 : -1.0);
                            }
                            else {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? -1.0 : 1.0, this._invertNormalMapY ? -1.0 : 1.0);
                            }
                        }
                        if (this._refractionTexture && StandardMaterial_OldVer.RefractionTextureEnabled) {
                            var depth = 1.0;
                            if (!this._refractionTexture.isCube) {
                                this._uniformBuffer.updateMatrix("refractionMatrix", this._refractionTexture.getReflectionTextureMatrix());
                                if (this._refractionTexture.depth) {
                                    depth = this._refractionTexture.depth;
                                }
                            }
                            this._uniformBuffer.updateFloat4("vRefractionInfos", this._refractionTexture.level, this.indexOfRefraction, depth, this.invertRefractionY ? -1 : 1);
                        }
                    }
                    // Point size
                    if (this.pointsCloud) {
                        this._uniformBuffer.updateFloat("pointSize", this.pointSize);
                    }
                    if (defines.SPECULARTERM) {
                        this._uniformBuffer.updateColor4("vSpecularColor", this.specularColor, this.specularPower);
                    }
                    this._uniformBuffer.updateColor3("vEmissiveColor", this.emissiveColor);
                    // Diffuse
                    this._uniformBuffer.updateColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
                }
                // Textures     
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && StandardMaterial_OldVer.DiffuseTextureEnabled) {
                        effect.setTexture("diffuseSampler", this._diffuseTexture);
                    }
                    if (this._ambientTexture && StandardMaterial_OldVer.AmbientTextureEnabled) {
                        effect.setTexture("ambientSampler", this._ambientTexture);
                    }
                    if (this._opacityTexture && StandardMaterial_OldVer.OpacityTextureEnabled) {
                        effect.setTexture("opacitySampler", this._opacityTexture);
                    }
                    if (this._reflectionTexture && StandardMaterial_OldVer.ReflectionTextureEnabled) {
                        if (this._reflectionTexture.isCube) {
                            effect.setTexture("reflectionCubeSampler", this._reflectionTexture);
                        }
                        else {
                            effect.setTexture("reflection2DSampler", this._reflectionTexture);
                        }
                    }
                    if (this._emissiveTexture && StandardMaterial_OldVer.EmissiveTextureEnabled) {
                        effect.setTexture("emissiveSampler", this._emissiveTexture);
                    }
                    if (this._lightmapTexture && StandardMaterial_OldVer.LightmapTextureEnabled) {
                        effect.setTexture("lightmapSampler", this._lightmapTexture);
                    }
                    if (this._specularTexture && StandardMaterial_OldVer.SpecularTextureEnabled) {
                        effect.setTexture("specularSampler", this._specularTexture);
                    }
                    if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial_OldVer.BumpTextureEnabled) {
                        effect.setTexture("bumpSampler", this._bumpTexture);
                    }
                    if (this._refractionTexture && StandardMaterial_OldVer.RefractionTextureEnabled) {
                        var depth = 1.0;
                        if (this._refractionTexture.isCube) {
                            effect.setTexture("refractionCubeSampler", this._refractionTexture);
                        }
                        else {
                            effect.setTexture("refraction2DSampler", this._refractionTexture);
                        }
                    }
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(effect, scene);
                // Colors
                scene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);
                effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
                effect.setColor3("vAmbientColor", this._globalAmbientColor);
            }
            if (this._mustRebind(scene, effect) || !this.isFrozen) {
                // Lights
                if (scene.lightsEnabled && !this._disableLighting) {
                    BABYLON.MaterialHelper.BindLights(scene, mesh, effect, defines, this._maxSimultaneousLights);
                }
                // View
                if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE || this._reflectionTexture || this._refractionTexture) {
                    this.bindView(effect);
                }
                // Fog
                BABYLON.MaterialHelper.BindFogParameters(scene, mesh, effect);
                // Morph targets
                if (defines.NUM_MORPH_INFLUENCERS) {
                    BABYLON.MaterialHelper.BindMorphTargetParameters(mesh, effect);
                }
                // Log. depth
                BABYLON.MaterialHelper.BindLogDepth(defines, effect, scene);
                // image processing
                this._imageProcessingConfiguration.bind(this._activeEffect);
            }
            this._uniformBuffer.update();
            this._afterBind(mesh, this._activeEffect);
        };
        StandardMaterial_OldVer.prototype.getAnimatables = function () {
            var results = [];
            if (this._diffuseTexture && this._diffuseTexture.animations && this._diffuseTexture.animations.length > 0) {
                results.push(this._diffuseTexture);
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
            if (this._specularTexture && this._specularTexture.animations && this._specularTexture.animations.length > 0) {
                results.push(this._specularTexture);
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
            return results;
        };
        StandardMaterial_OldVer.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._diffuseTexture) {
                activeTextures.push(this._diffuseTexture);
            }
            if (this._ambientTexture) {
                activeTextures.push(this._ambientTexture);
            }
            if (this._opacityTexture) {
                activeTextures.push(this._opacityTexture);
            }
            if (this._reflectionTexture) {
                activeTextures.push(this._reflectionTexture);
            }
            if (this._emissiveTexture) {
                activeTextures.push(this._emissiveTexture);
            }
            if (this._specularTexture) {
                activeTextures.push(this._specularTexture);
            }
            if (this._bumpTexture) {
                activeTextures.push(this._bumpTexture);
            }
            if (this._lightmapTexture) {
                activeTextures.push(this._lightmapTexture);
            }
            if (this._refractionTexture) {
                activeTextures.push(this._refractionTexture);
            }
            return activeTextures;
        };
        StandardMaterial_OldVer.prototype.dispose = function (forceDisposeEffect, forceDisposeTextures) {
            if (forceDisposeTextures) {
                if (this._diffuseTexture) {
                    this._diffuseTexture.dispose();
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
                if (this._specularTexture) {
                    this._specularTexture.dispose();
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
            }
            if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
                this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
            }
            _super.prototype.dispose.call(this, forceDisposeEffect, forceDisposeTextures);
        };
        StandardMaterial_OldVer.prototype.clone = function (name) {
            var _this = this;
            var result = BABYLON.SerializationHelper.Clone(function () { return new StandardMaterial_OldVer(name, _this.getScene()); }, this);
            result.name = name;
            result.id = name;
            return result;
        };
        StandardMaterial_OldVer.prototype.serialize = function () {
            return BABYLON.SerializationHelper.Serialize(this);
        };
        // Statics
        StandardMaterial_OldVer.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new StandardMaterial_OldVer(source.name, scene); }, source, scene, rootUrl);
        };
        Object.defineProperty(StandardMaterial_OldVer, "DiffuseTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._DiffuseTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._DiffuseTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._DiffuseTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "AmbientTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._AmbientTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._AmbientTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._AmbientTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "OpacityTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._OpacityTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._OpacityTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._OpacityTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "ReflectionTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._ReflectionTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._ReflectionTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._ReflectionTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "EmissiveTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._EmissiveTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._EmissiveTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._EmissiveTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "SpecularTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._SpecularTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._SpecularTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._SpecularTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "BumpTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._BumpTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._BumpTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._BumpTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "LightmapTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._LightmapTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._LightmapTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._LightmapTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "RefractionTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._RefractionTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._RefractionTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._RefractionTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "ColorGradingTextureEnabled", {
            get: function () {
                return StandardMaterial_OldVer._ColorGradingTextureEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._ColorGradingTextureEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._ColorGradingTextureEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.TextureDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial_OldVer, "FresnelEnabled", {
            get: function () {
                return StandardMaterial_OldVer._FresnelEnabled;
            },
            set: function (value) {
                if (StandardMaterial_OldVer._FresnelEnabled === value) {
                    return;
                }
                StandardMaterial_OldVer._FresnelEnabled = value;
                BABYLON.Engine.MarkAllMaterialsAsDirty(BABYLON.Material.FresnelDirtyFlag);
            },
            enumerable: true,
            configurable: true
        });
        // Flags used to enable or disable a type of texture for all Standard Materials
        StandardMaterial_OldVer._DiffuseTextureEnabled = true;
        StandardMaterial_OldVer._AmbientTextureEnabled = true;
        StandardMaterial_OldVer._OpacityTextureEnabled = true;
        StandardMaterial_OldVer._ReflectionTextureEnabled = true;
        StandardMaterial_OldVer._EmissiveTextureEnabled = true;
        StandardMaterial_OldVer._SpecularTextureEnabled = true;
        StandardMaterial_OldVer._BumpTextureEnabled = true;
        StandardMaterial_OldVer._LightmapTextureEnabled = true;
        StandardMaterial_OldVer._RefractionTextureEnabled = true;
        StandardMaterial_OldVer._ColorGradingTextureEnabled = true;
        StandardMaterial_OldVer._FresnelEnabled = true;
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture")
        ], StandardMaterial_OldVer.prototype, "_diffuseTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "diffuseTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("ambientTexture")
        ], StandardMaterial_OldVer.prototype, "_ambientTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "ambientTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("opacityTexture")
        ], StandardMaterial_OldVer.prototype, "_opacityTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "opacityTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("reflectionTexture")
        ], StandardMaterial_OldVer.prototype, "_reflectionTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "reflectionTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("emissiveTexture")
        ], StandardMaterial_OldVer.prototype, "_emissiveTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "emissiveTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("specularTexture")
        ], StandardMaterial_OldVer.prototype, "_specularTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "specularTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("bumpTexture")
        ], StandardMaterial_OldVer.prototype, "_bumpTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "bumpTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("lightmapTexture")
        ], StandardMaterial_OldVer.prototype, "_lightmapTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "lightmapTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("refractionTexture")
        ], StandardMaterial_OldVer.prototype, "_refractionTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "refractionTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3("ambient")
        ], StandardMaterial_OldVer.prototype, "ambientColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("diffuse")
        ], StandardMaterial_OldVer.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("specular")
        ], StandardMaterial_OldVer.prototype, "specularColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("emissive")
        ], StandardMaterial_OldVer.prototype, "emissiveColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial_OldVer.prototype, "specularPower", void 0);
        __decorate([
            BABYLON.serialize("useAlphaFromDiffuseTexture")
        ], StandardMaterial_OldVer.prototype, "_useAlphaFromDiffuseTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useAlphaFromDiffuseTexture", void 0);
        __decorate([
            BABYLON.serialize("useEmissiveAsIllumination")
        ], StandardMaterial_OldVer.prototype, "_useEmissiveAsIllumination", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useEmissiveAsIllumination", void 0);
        __decorate([
            BABYLON.serialize("linkEmissiveWithDiffuse")
        ], StandardMaterial_OldVer.prototype, "_linkEmissiveWithDiffuse", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "linkEmissiveWithDiffuse", void 0);
        __decorate([
            BABYLON.serialize("useSpecularOverAlpha")
        ], StandardMaterial_OldVer.prototype, "_useSpecularOverAlpha", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useSpecularOverAlpha", void 0);
        __decorate([
            BABYLON.serialize("useReflectionOverAlpha")
        ], StandardMaterial_OldVer.prototype, "_useReflectionOverAlpha", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useReflectionOverAlpha", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], StandardMaterial_OldVer.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], StandardMaterial_OldVer.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize("useParallax")
        ], StandardMaterial_OldVer.prototype, "_useParallax", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useParallax", void 0);
        __decorate([
            BABYLON.serialize("useParallaxOcclusion")
        ], StandardMaterial_OldVer.prototype, "_useParallaxOcclusion", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useParallaxOcclusion", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial_OldVer.prototype, "parallaxScaleBias", void 0);
        __decorate([
            BABYLON.serialize("roughness")
        ], StandardMaterial_OldVer.prototype, "_roughness", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "roughness", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial_OldVer.prototype, "indexOfRefraction", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial_OldVer.prototype, "invertRefractionY", void 0);
        __decorate([
            BABYLON.serialize("useLightmapAsShadowmap")
        ], StandardMaterial_OldVer.prototype, "_useLightmapAsShadowmap", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useLightmapAsShadowmap", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters("diffuseFresnelParameters")
        ], StandardMaterial_OldVer.prototype, "_diffuseFresnelParameters", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsFresnelDirty")
        ], StandardMaterial_OldVer.prototype, "diffuseFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters("opacityFresnelParameters")
        ], StandardMaterial_OldVer.prototype, "_opacityFresnelParameters", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsFresnelDirty")
        ], StandardMaterial_OldVer.prototype, "opacityFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters("reflectionFresnelParameters")
        ], StandardMaterial_OldVer.prototype, "_reflectionFresnelParameters", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsFresnelDirty")
        ], StandardMaterial_OldVer.prototype, "reflectionFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters("refractionFresnelParameters")
        ], StandardMaterial_OldVer.prototype, "_refractionFresnelParameters", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsFresnelDirty")
        ], StandardMaterial_OldVer.prototype, "refractionFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters("emissiveFresnelParameters")
        ], StandardMaterial_OldVer.prototype, "_emissiveFresnelParameters", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsFresnelDirty")
        ], StandardMaterial_OldVer.prototype, "emissiveFresnelParameters", void 0);
        __decorate([
            BABYLON.serialize("useReflectionFresnelFromSpecular")
        ], StandardMaterial_OldVer.prototype, "_useReflectionFresnelFromSpecular", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsFresnelDirty")
        ], StandardMaterial_OldVer.prototype, "useReflectionFresnelFromSpecular", void 0);
        __decorate([
            BABYLON.serialize("useGlossinessFromSpecularMapAlpha")
        ], StandardMaterial_OldVer.prototype, "_useGlossinessFromSpecularMapAlpha", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "useGlossinessFromSpecularMapAlpha", void 0);
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], StandardMaterial_OldVer.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], StandardMaterial_OldVer.prototype, "maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.serialize("invertNormalMapX")
        ], StandardMaterial_OldVer.prototype, "_invertNormalMapX", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "invertNormalMapX", void 0);
        __decorate([
            BABYLON.serialize("invertNormalMapY")
        ], StandardMaterial_OldVer.prototype, "_invertNormalMapY", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "invertNormalMapY", void 0);
        __decorate([
            BABYLON.serialize("twoSidedLighting")
        ], StandardMaterial_OldVer.prototype, "_twoSidedLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], StandardMaterial_OldVer.prototype, "twoSidedLighting", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardMaterial_OldVer.prototype, "useLogarithmicDepth", null);
        return StandardMaterial_OldVer;
    }(BABYLON.PushMaterial));
    BABYLON.StandardMaterial_OldVer = StandardMaterial_OldVer;
    var CustomShaderStructure = /** @class */ (function () {
        function CustomShaderStructure() {
        }
        return CustomShaderStructure;
    }());
    BABYLON.CustomShaderStructure = CustomShaderStructure;
    var ShaderSpecialParts = /** @class */ (function () {
        function ShaderSpecialParts() {
        }
        return ShaderSpecialParts;
    }());
    BABYLON.ShaderSpecialParts = ShaderSpecialParts;
    var ShaderForVer3_0 = /** @class */ (function (_super) {
        __extends(ShaderForVer3_0, _super);
        function ShaderForVer3_0() {
            var _this = _super.call(this) || this;
            _this.VertexStore = "";
            _this.FragmentStore = "#include<__decl__defaultFragment>\n\
#[Fragment_Begin]\n\
#extension GL_OES_standard_derivatives : enable\n\
#ifdef LOGARITHMICDEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define RECIPROCAL_PI2 0.15915494\n\
uniform vec3 vEyePosition;\n\
uniform vec3 vAmbientColor;\n\
\n\
varying vec3 vPositionW;\n\
#ifdef NORMAL\n\
varying vec3 vNormalW_helper;\n\
varying vec3 localNormal;\n\
varying vec3 localPosition;\n\
vec3 vNormalW;\n\
#endif\n\
#ifdef VERTEXCOLOR\n\
varying vec4 vColor;\n\
#endif\n\
\n\
#include<helperFunctions>\n\
\n\
#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\
#include<lightsFragmentFunctions>\n\
#include<shadowsFragmentFunctions>\n\
\n\
#ifdef DIFFUSE\n\
varying vec2 vDiffuseUV;\n\
uniform sampler2D diffuseSampler;\n\
#endif\n\
#ifdef AMBIENT\n\
varying vec2 vAmbientUV;\n\
uniform sampler2D ambientSampler;\n\
#endif\n\
#ifdef OPACITY\n\
varying vec2 vOpacityUV;\n\
uniform sampler2D opacitySampler;\n\
#endif\n\
#ifdef EMISSIVE\n\
varying vec2 vEmissiveUV;\n\
uniform sampler2D emissiveSampler;\n\
#endif\n\
#ifdef LIGHTMAP\n\
varying vec2 vLightmapUV;\n\
uniform sampler2D lightmapSampler;\n\
#endif\n\
#ifdef REFRACTION\n\
#ifdef REFRACTIONMAP_3D\n\
uniform samplerCube refractionCubeSampler;\n\
#else\n\
uniform sampler2D refraction2DSampler;\n\
#endif\n\
#endif\n\
#if defined(SPECULAR) && defined(SPECULARTERM)\n\
varying vec2 vSpecularUV;\n\
uniform sampler2D specularSampler;\n\
#endif\n\
\n\
#include<fresnelFunction>\n\
\n\
#ifdef REFLECTION\n\
#ifdef REFLECTIONMAP_3D\n\
uniform samplerCube reflectionCubeSampler;\n\
#else\n\
uniform sampler2D reflection2DSampler;\n\
#endif\n\
#ifdef REFLECTIONMAP_SKYBOX\n\
varying vec3 vPositionUVW;\n\
#else\n\
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\n\
varying vec3 vDirectionW;\n\
#endif\n\
#endif\n\
#include<reflectionFunction>\n\
#endif\n\
#include<imageProcessingDeclaration>\n\
#include<imageProcessingFunctions>\n\
\n\
#include<bumpFragmentFunctions>\n\
#include<clipPlaneFragmentDeclaration>\n\
#include<logDepthDeclaration>\n\
#include<fogFragmentDeclaration>\n\
\n\
#[Fragment_Definitions]\n\
\n\
void main(void) {\n\
\n\
vNormalW = vNormalW_helper;\n\
#[Fragment_MainBegin]\n\
\n\
#include<clipPlaneFragment>\n\
vec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\
\n\
vec4 baseColor=vec4(1.,1.,1.,1.);\n\
vec3 diffuseColor=vDiffuseColor.rgb;\n\
#[Fragment_Custom_Diffuse]\n\
\n\
float alpha=vDiffuseColor.a;\n\
#[Fragment_Custom_Alpha]\n\
\n\
#ifdef NORMAL\n\
vec3 normalW=normalize(vNormalW);\n\
#else\n\
vec3 normalW=vec3(1.0,1.0,1.0);\n\
#endif\n\
#include<bumpFragment>\n\
#ifdef TWOSIDEDLIGHTING\n\
normalW=gl_FrontFacing ? normalW : -normalW;\n\
#endif\n\
#ifdef DIFFUSE\n\
baseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n\
#ifdef ALPHATEST\n\
if (baseColor.a<0.4)\n\
discard;\n\
#endif\n\
#ifdef ALPHAFROMDIFFUSE\n\
alpha*=baseColor.a;\n\
#endif\n\
baseColor.rgb*=vDiffuseInfos.y;\n\
#endif\n\
#ifdef VERTEXCOLOR\n\
baseColor.rgb*=vColor.rgb;\n\
#endif\n\
\n\
vec3 baseAmbientColor=vec3(1.,1.,1.);\n\
#ifdef AMBIENT\n\
baseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n\
#endif\n\
\n\
#ifdef SPECULARTERM\n\
float glossiness=vSpecularColor.a;\n\
vec3 specularColor=vSpecularColor.rgb;\n\
#ifdef SPECULAR\n\
vec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\n\
specularColor=specularMapColor.rgb;\n\
#ifdef GLOSSINESS\n\
glossiness=glossiness*specularMapColor.a;\n\
#endif\n\
#endif\n\
#else\n\
float glossiness=0.;\n\
#endif\n\
\n\
vec3 diffuseBase=vec3(0.,0.,0.);\n\
lightingInfo info;\n\
#ifdef SPECULARTERM\n\
vec3 specularBase=vec3(0.,0.,0.);\n\
#endif\n\
float shadow=1.;\n\
#ifdef LIGHTMAP\n\
vec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n\
#endif\n\
#include<lightFragment>[0..maxSimultaneousLights]\n\
\n\
vec3 refractionColor=vec3(0.,0.,0.);\n\
#ifdef REFRACTION\n\
vec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n\
#ifdef REFRACTIONMAP_3D\n\
refractionVector.y=refractionVector.y*vRefractionInfos.w;\n\
if (dot(refractionVector,viewDirectionW)<1.0)\n\
{\n\
refractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n\
}\n\
#else\n\
vec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\n\
vec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\n\
refractionCoords.y=1.0-refractionCoords.y;\n\
refractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n\
#endif\n\
#endif\n\
\n\
vec3 reflectionColor=vec3(0.,0.,0.);\n\
#ifdef REFLECTION\n\
vec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n\
#ifdef REFLECTIONMAP_3D\n\
#ifdef ROUGHNESS\n\
float bias=vReflectionInfos.y;\n\
#ifdef SPECULARTERM\n\
#ifdef SPECULAR\n\
#ifdef GLOSSINESS\n\
bias*=(1.0-specularMapColor.a);\n\
#endif\n\
#endif\n\
#endif\n\
reflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n\
#else\n\
reflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n\
#endif\n\
#else\n\
vec2 coords=vReflectionUVW.xy;\n\
#ifdef REFLECTIONMAP_PROJECTION\n\
coords/=vReflectionUVW.z;\n\
#endif\n\
coords.y=1.0-coords.y;\n\
reflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n\
#endif\n\
#ifdef REFLECTIONFRESNEL\n\
float reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n\
#ifdef REFLECTIONFRESNELFROMSPECULAR\n\
#ifdef SPECULARTERM\n\
reflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n\
#else\n\
reflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n\
#endif\n\
#else\n\
reflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n\
#endif\n\
#endif\n\
#endif\n\
#ifdef REFRACTIONFRESNEL\n\
float refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\n\
refractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n\
#endif\n\
#ifdef OPACITY\n\
vec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n\
#ifdef OPACITYRGB\n\
opacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\n\
alpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n\
#else\n\
alpha*=opacityMap.a*vOpacityInfos.y;\n\
#endif\n\
#endif\n\
#ifdef VERTEXALPHA\n\
alpha*=vColor.a;\n\
#endif\n\
#ifdef OPACITYFRESNEL\n\
float opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\n\
alpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n\
#endif\n\
\n\
vec3 emissiveColor=vEmissiveColor;\n\
#ifdef EMISSIVE\n\
emissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n\
#endif\n\
#ifdef EMISSIVEFRESNEL\n\
float emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\n\
emissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n\
#endif\n\
\n\
#ifdef DIFFUSEFRESNEL\n\
float diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\n\
diffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n\
#endif\n\
\n\
#ifdef EMISSIVEASILLUMINATION\n\
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n\
#else\n\
#ifdef LINKEMISSIVEWITHDIFFUSE\n\
vec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n\
#else\n\
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n\
#endif\n\
#endif\n\
#ifdef SPECULARTERM\n\
vec3 finalSpecular=specularBase*specularColor;\n\
#ifdef SPECULAROVERALPHA\n\
alpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n\
#endif\n\
#else\n\
vec3 finalSpecular=vec3(0.0);\n\
#endif\n\
#ifdef REFLECTIONOVERALPHA\n\
alpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n\
#endif\n\
\n\
#ifdef EMISSIVEASILLUMINATION\n\
vec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n\
#else\n\
vec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n\
#endif\n\
\n\
#ifdef LIGHTMAP\n\
#ifndef LIGHTMAPEXCLUDED\n\
#ifdef USELIGHTMAPASSHADOWMAP\n\
color.rgb*=lightmapColor;\n\
#else\n\
color.rgb+=lightmapColor;\n\
#endif\n\
#endif\n\
#endif\n\
#include<logDepthFragment>\n\
#include<fogFragment>\n\
\n\
// Apply image processing if relevant. As this applies in linear space, \n\
// We first move from gamma to linear.\n\
#ifdef IMAGEPROCESSINGPOSTPROCESS\n\
	color.rgb = toLinearSpace(color.rgb);\n\
#else\n\
	#ifdef IMAGEPROCESSING\n\
		color.rgb = toLinearSpace(color.rgb);\n\
		color = applyImageProcessing(color);\n\
	#endif\n\
#endif\n\
\n\
#[Fragment_Before_FragColor]\n\
gl_FragColor=color;\n\
}";
            _this.VertexStore = "#include<__decl__defaultVertex>\n\
\n\
#[Vertex_Begin]\n\
\n\
attribute vec3 position;\n\
#ifdef NORMAL\n\
attribute vec3 normal;\n\
#endif\n\
#ifdef TANGENT\n\
attribute vec4 tangent;\n\
#endif\n\
#ifdef UV1\n\
attribute vec2 uv;\n\
#endif\n\
#ifdef UV2\n\
attribute vec2 uv2;\n\
#endif\n\
#ifdef VERTEXCOLOR\n\
attribute vec4 color;\n\
#endif\n\
#include<bonesDeclaration>\n\
\n\
#include<instancesDeclaration>\n\
#ifdef DIFFUSE\n\
varying vec2 vDiffuseUV;\n\
#endif\n\
#ifdef AMBIENT\n\
varying vec2 vAmbientUV;\n\
#endif\n\
#ifdef OPACITY\n\
varying vec2 vOpacityUV;\n\
#endif\n\
#ifdef EMISSIVE\n\
varying vec2 vEmissiveUV;\n\
#endif\n\
#ifdef LIGHTMAP\n\
varying vec2 vLightmapUV;\n\
#endif\n\
#if defined(SPECULAR) && defined(SPECULARTERM)\n\
varying vec2 vSpecularUV;\n\
#endif\n\
#ifdef BUMP\n\
varying vec2 vBumpUV;\n\
#endif\n\
\n\
varying vec3 localPosition;\n\
varying vec3 vPositionW;\n\
#ifdef NORMAL\n\
varying vec3 vNormalW_helper;\n\
varying vec3 localNormal;\n\
#endif\n\
#ifdef VERTEXCOLOR\n\
varying vec4 vColor;\n\
#endif\n\
#include<bumpVertexDeclaration>\n\
#include<clipPlaneVertexDeclaration>\n\
#include<fogVertexDeclaration>\n\
#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\
#include<morphTargetsVertexGlobalDeclaration>\n\
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n\
#ifdef REFLECTIONMAP_SKYBOX\n\
varying vec3 vPositionUVW;\n\
#endif\n\
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\n\
varying vec3 vDirectionW;\n\
#endif\n\
#include<logDepthDeclaration>\n\
\n\
#[Vertex_Definitions]\n\
\n\
void main(void) {\n\
    \n\
    #[Vertex_MainBegin]\n\
    \n\
vec3 positionUpdated=position;\n\
#ifdef NORMAL \n\
vec3 normalUpdated=normal;\n\
#endif\n\
#ifdef TANGENT\n\
vec4 tangentUpdated=tangent;\n\
#endif\n\
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n\
#ifdef REFLECTIONMAP_SKYBOX\n\
vPositionUVW=positionUpdated;\n\
#endif \n\
#include<instancesVertex>\n\
#include<bonesVertex>\n\
\n\
localPosition = positionUpdated;\n\
#[Vertex_Before_PositionUpdated]\n\
\n\
gl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\n\
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\n\
vPositionW=vec3(worldPos);\n\
#ifdef NORMAL\n\
\n\
#[Vertex_Before_NormalUpdated]\n\
\n\
localNormal = normalUpdated;\n\
vNormalW_helper=normalize(vec3(finalWorld*vec4(normalUpdated,0.0)));\n\
#endif\n\
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\n\
vDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n\
#endif\n\
\n\
#ifndef UV1\n\
vec2 uv=vec2(0.,0.);\n\
#endif\n\
#ifndef UV2\n\
vec2 uv2=vec2(0.,0.);\n\
#endif\n\
#ifdef DIFFUSE\n\
if (vDiffuseInfos.x == 0.)\n\
{\n\
vDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef AMBIENT\n\
if (vAmbientInfos.x == 0.)\n\
{\n\
vAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef OPACITY\n\
if (vOpacityInfos.x == 0.)\n\
{\n\
vOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef EMISSIVE\n\
if (vEmissiveInfos.x == 0.)\n\
{\n\
vEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef LIGHTMAP\n\
if (vLightmapInfos.x == 0.)\n\
{\n\
vLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#if defined(SPECULAR) && defined(SPECULARTERM)\n\
if (vSpecularInfos.x == 0.)\n\
{\n\
vSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#ifdef BUMP\n\
if (vBumpInfos.x == 0.)\n\
{\n\
vBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n\
}\n\
else\n\
{\n\
vBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n\
}\n\
#endif\n\
#include<bumpVertex>\n\
#include<clipPlaneVertex>\n\
#include<fogVertex>\n\
#include<shadowsVertex>[0..maxSimultaneousLights]\n\
#ifdef VERTEXCOLOR\n\
\n\
vColor=color;\n\
#endif\n\
#include<pointCloudVertex>\n\
#include<logDepthVertex>\n\
}";
            return _this;
        }
        return ShaderForVer3_0;
    }(CustomShaderStructure));
    BABYLON.ShaderForVer3_0 = ShaderForVer3_0;
    var StandardShaderVersions = /** @class */ (function () {
        function StandardShaderVersions() {
        }
        StandardShaderVersions.Ver3_0 = "3.0.0";
        return StandardShaderVersions;
    }());
    BABYLON.StandardShaderVersions = StandardShaderVersions;
    var CustomMaterial = /** @class */ (function (_super) {
        __extends(CustomMaterial, _super);
        function CustomMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.CustomParts = new ShaderSpecialParts();
            _this.customShaderNameResolve = _this.Builder;
            _this.SelectVersion("3.0.0");
            return _this;
        }
        CustomMaterial.prototype.AttachAfterBind = function (mesh, effect) {
            for (var el in this._newUniformInstances) {
                var ea = el.toString().split('-');
                if (ea[0] == 'vec2')
                    effect.setVector2(ea[1], this._newUniformInstances[el]);
                else if (ea[0] == 'vec3')
                    effect.setVector3(ea[1], this._newUniformInstances[el]);
                else if (ea[0] == 'vec4')
                    effect.setVector4(ea[1], this._newUniformInstances[el]);
                else if (ea[0] == 'mat4')
                    effect.setMatrix(ea[1], this._newUniformInstances[el]);
                else if (ea[0] == 'float')
                    effect.setFloat(ea[1], this._newUniformInstances[el]);
            }
            for (var el in this._newSamplerInstances) {
                var ea = el.toString().split('-');
                if (ea[0] == 'sampler2D' && this._newSamplerInstances[el].isReady && this._newSamplerInstances[el].isReady())
                    effect.setTexture(ea[1], this._newSamplerInstances[el]);
            }
        };
        CustomMaterial.prototype.ReviewUniform = function (name, arr) {
            if (name == "uniform") {
                for (var ind in this._newUniforms)
                    if (this._customUniform[ind].indexOf('sampler') == -1)
                        arr.push(this._newUniforms[ind]);
            }
            if (name == "sampler") {
                for (var ind in this._newUniforms)
                    if (this._customUniform[ind].indexOf('sampler') != -1)
                        arr.push(this._newUniforms[ind]);
            }
            return arr;
        };
        CustomMaterial.prototype.Builder = function (shaderName, uniforms, uniformBuffers, samplers, defines) {
            var _this = this;
            if (this._isCreatedShader)
                return this._createdShaderName;
            this._isCreatedShader = false;
            CustomMaterial.ShaderIndexer++;
            var name = name + "custom_" + CustomMaterial.ShaderIndexer;
            this.ReviewUniform("uniform", uniforms);
            this.ReviewUniform("sampler", samplers);
            var fn_afterBind = this._afterBind;
            this._afterBind = function (m, e) {
                _this.AttachAfterBind(m, e);
                try {
                    fn_afterBind(m, e);
                }
                catch (e) { }
                ;
            };
            BABYLON.Effect.ShadersStore[name + "VertexShader"] = this.ShaderVersion.VertexStore
                .replace('#[Vertex_Begin]', (this.CustomParts.Vertex_Begin ? this.CustomParts.Vertex_Begin : ""))
                .replace('#[Vertex_Definitions]', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Vertex_Definitions ? this.CustomParts.Vertex_Definitions : ""))
                .replace('#[Vertex_MainBegin]', (this.CustomParts.Vertex_MainBegin ? this.CustomParts.Vertex_MainBegin : ""))
                .replace('#[Vertex_Before_PositionUpdated]', (this.CustomParts.Vertex_Before_PositionUpdated ? this.CustomParts.Vertex_Before_PositionUpdated : ""))
                .replace('#[Vertex_Before_NormalUpdated]', (this.CustomParts.Vertex_Before_NormalUpdated ? this.CustomParts.Vertex_Before_NormalUpdated : ""));
            BABYLON.Effect.ShadersStore[name + "PixelShader"] = this.ShaderVersion.FragmentStore
                .replace('#[Fragment_Begin]', (this.CustomParts.Fragment_Begin ? this.CustomParts.Fragment_Begin : ""))
                .replace('#[Fragment_MainBegin]', (this.CustomParts.Fragment_MainBegin ? this.CustomParts.Fragment_MainBegin : ""))
                .replace('#[Fragment_Definitions]', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Fragment_Definitions ? this.CustomParts.Fragment_Definitions : ""))
                .replace('#[Fragment_Custom_Diffuse]', (this.CustomParts.Fragment_Custom_Diffuse ? this.CustomParts.Fragment_Custom_Diffuse : ""))
                .replace('#[Fragment_Custom_Alpha]', (this.CustomParts.Fragment_Custom_Alpha ? this.CustomParts.Fragment_Custom_Alpha : ""))
                .replace('#[Fragment_Before_FragColor]', (this.CustomParts.Fragment_Before_FragColor ? this.CustomParts.Fragment_Before_FragColor : ""));
            this._isCreatedShader = true;
            this._createdShaderName = name;
            return name;
        };
        CustomMaterial.prototype.SelectVersion = function (ver) {
            switch (ver) {
                case "3.0.0":
                    this.ShaderVersion = new ShaderForVer3_0();
                    break;
            }
        };
        CustomMaterial.prototype.AddUniform = function (name, kind, param) {
            if (!this._customUniform) {
                this._customUniform = new Array();
                this._newUniforms = new Array();
                this._newSamplerInstances = new Array();
                this._newUniformInstances = new Array();
            }
            if (param) {
                if (kind.indexOf("sampler") == -1) {
                    this._newUniformInstances[kind + "-" + name] = param;
                }
                else {
                    this._newUniformInstances[kind + "-" + name] = param;
                }
            }
            this._customUniform.push("uniform " + kind + " " + name + ";");
            this._newUniforms.push(name);
            return this;
        };
        CustomMaterial.prototype.Fragment_Begin = function (shaderPart) {
            this.CustomParts.Fragment_Begin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_Definitions = function (shaderPart) {
            this.CustomParts.Fragment_Definitions = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_MainBegin = function (shaderPart) {
            this.CustomParts.Fragment_MainBegin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_Custom_Diffuse = function (shaderPart) {
            this.CustomParts.Fragment_Custom_Diffuse = shaderPart.replace("result", "diffuseColor");
            return this;
        };
        CustomMaterial.prototype.Fragment_Custom_Alpha = function (shaderPart) {
            this.CustomParts.Fragment_Custom_Alpha = shaderPart.replace("result", "alpha");
            return this;
        };
        CustomMaterial.prototype.Fragment_Before_FragColor = function (shaderPart) {
            this.CustomParts.Fragment_Before_FragColor = shaderPart.replace("result", "color");
            return this;
        };
        CustomMaterial.prototype.Vertex_Begin = function (shaderPart) {
            this.CustomParts.Vertex_Begin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_Definitions = function (shaderPart) {
            this.CustomParts.Vertex_Definitions = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_MainBegin = function (shaderPart) {
            this.CustomParts.Vertex_MainBegin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_Before_PositionUpdated = function (shaderPart) {
            this.CustomParts.Vertex_Before_PositionUpdated = shaderPart.replace("result", "positionUpdated");
            return this;
        };
        CustomMaterial.prototype.Vertex_Before_NormalUpdated = function (shaderPart) {
            this.CustomParts.Vertex_Before_NormalUpdated = shaderPart.replace("result", "normalUpdated");
            return this;
        };
        CustomMaterial.ShaderIndexer = 1;
        return CustomMaterial;
    }(StandardMaterial_OldVer));
    BABYLON.CustomMaterial = CustomMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.customMaterial.js.map




var BABYLON;
(function (BABYLON) {
    var CellMaterialDefines = /** @class */ (function (_super) {
        __extends(CellMaterialDefines, _super);
        function CellMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.NORMAL = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.NDOTL = true;
            _this.CUSTOMUSERLIGHTING = true;
            _this.CELLBASIC = true;
            _this.DEPTHPREPASS = false;
            _this.rebuild();
            return _this;
        }
        return CellMaterialDefines;
    }(BABYLON.MaterialDefines));
    var CellMaterial = /** @class */ (function (_super) {
        __extends(CellMaterial, _super);
        function CellMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            _this._computeHighLevel = false;
            _this._disableLighting = false;
            _this._maxSimultaneousLights = 4;
            return _this;
        }
        CellMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        CellMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        CellMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        CellMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new CellMaterialDefines();
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
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        if (!this._diffuseTexture.isReady()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.DIFFUSE = true;
                        }
                    }
                }
            }
            // High level
            defines.CELLBASIC = !this.computeHighLevel;
            // Misc.
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            // Lights
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
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
                var shaderName = "cell";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix"
                ];
                var samplers = ["diffuseSampler"];
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
                    indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights - 1 }
                }, engine), defines);
            }
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        CellMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._activeEffect.setTexture("diffuseSampler", this._diffuseTexture);
                    this._activeEffect.setFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                    this._activeEffect.setMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
            // Lights
            if (scene.lightsEnabled && !this.disableLighting) {
                BABYLON.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this._maxSimultaneousLights);
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            this._afterBind(mesh, this._activeEffect);
        };
        CellMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this._diffuseTexture && this._diffuseTexture.animations && this._diffuseTexture.animations.length > 0) {
                results.push(this._diffuseTexture);
            }
            return results;
        };
        CellMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._diffuseTexture) {
                activeTextures.push(this._diffuseTexture);
            }
            return activeTextures;
        };
        CellMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            return this._diffuseTexture === texture;
        };
        CellMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this._diffuseTexture) {
                this._diffuseTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        CellMaterial.prototype.getClassName = function () {
            return "CellMaterial";
        };
        CellMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new CellMaterial(name, _this.getScene()); }, this);
        };
        CellMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.CellMaterial";
            return serializationObject;
        };
        // Statics
        CellMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new CellMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsTexture("diffuseTexture")
        ], CellMaterial.prototype, "_diffuseTexture", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], CellMaterial.prototype, "diffuseTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3("diffuseColor")
        ], CellMaterial.prototype, "diffuseColor", void 0);
        __decorate([
            BABYLON.serialize("computeHighLevel")
        ], CellMaterial.prototype, "_computeHighLevel", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
        ], CellMaterial.prototype, "computeHighLevel", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], CellMaterial.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], CellMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize("maxSimultaneousLights")
        ], CellMaterial.prototype, "_maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], CellMaterial.prototype, "maxSimultaneousLights", void 0);
        return CellMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.CellMaterial = CellMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.cellMaterial.js.map

BABYLON.Effect.ShadersStore['cellVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef DIFFUSE\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['cellPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\n\nvec3 computeCustomDiffuseLighting(lightingInfo info,vec3 diffuseBase,float shadow)\n{\ndiffuseBase=info.diffuse*shadow;\n#ifdef CELLBASIC\nfloat level=1.0;\nif (info.ndl<0.5)\nlevel=0.5;\ndiffuseBase.rgb*vec3(level,level,level);\n#else\nfloat ToonThresholds[4];\nToonThresholds[0]=0.95;\nToonThresholds[1]=0.5;\nToonThresholds[2]=0.2;\nToonThresholds[3]=0.03;\nfloat ToonBrightnessLevels[5];\nToonBrightnessLevels[0]=1.0;\nToonBrightnessLevels[1]=0.8;\nToonBrightnessLevels[2]=0.6;\nToonBrightnessLevels[3]=0.35;\nToonBrightnessLevels[4]=0.2;\nif (info.ndl>ToonThresholds[0])\n{\ndiffuseBase.rgb*=ToonBrightnessLevels[0];\n}\nelse if (info.ndl>ToonThresholds[1])\n{\ndiffuseBase.rgb*=ToonBrightnessLevels[1];\n}\nelse if (info.ndl>ToonThresholds[2])\n{\ndiffuseBase.rgb*=ToonBrightnessLevels[2];\n}\nelse if (info.ndl>ToonThresholds[3])\n{\ndiffuseBase.rgb*=ToonBrightnessLevels[3];\n}\nelse\n{\ndiffuseBase.rgb*=ToonBrightnessLevels[4];\n}\n#endif\nreturn max(diffuseBase,vec3(0.2));\n}\nvoid main(void)\n{\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#include<depthPrePass>\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n\nlightingInfo info;\nvec3 diffuseBase=vec3(0.,0.,0.);\nfloat shadow=1.;\nfloat glossiness=0.;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif \n#include<lightFragment>[0..maxSimultaneousLights]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;;\n\nvec4 color=vec4(finalDiffuse,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}";




var BABYLON;
(function (BABYLON) {
    var LegacyPBRMaterialDefines = /** @class */ (function (_super) {
        __extends(LegacyPBRMaterialDefines, _super);
        function LegacyPBRMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.ALBEDO = false;
            _this.AMBIENT = false;
            _this.AMBIENTINGRAYSCALE = false;
            _this.OPACITY = false;
            _this.OPACITYRGB = false;
            _this.REFLECTION = false;
            _this.EMISSIVE = false;
            _this.REFLECTIVITY = false;
            _this.BUMP = false;
            _this.PARALLAX = false;
            _this.PARALLAXOCCLUSION = false;
            _this.SPECULAROVERALPHA = false;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.ALPHAFROMALBEDO = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.SPECULARTERM = false;
            _this.OPACITYFRESNEL = false;
            _this.EMISSIVEFRESNEL = false;
            _this.FRESNEL = false;
            _this.NORMAL = false;
            _this.TANGENT = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.MICROSURFACEFROMREFLECTIVITYMAP = false;
            _this.MICROSURFACEAUTOMATIC = false;
            _this.EMISSIVEASILLUMINATION = false;
            _this.LINKEMISSIVEWITHALBEDO = false;
            _this.LIGHTMAP = false;
            _this.USELIGHTMAPASSHADOWMAP = false;
            _this.REFLECTIONMAP_3D = false;
            _this.REFLECTIONMAP_SPHERICAL = false;
            _this.REFLECTIONMAP_PLANAR = false;
            _this.REFLECTIONMAP_CUBIC = false;
            _this.REFLECTIONMAP_PROJECTION = false;
            _this.REFLECTIONMAP_SKYBOX = false;
            _this.REFLECTIONMAP_EXPLICIT = false;
            _this.REFLECTIONMAP_EQUIRECTANGULAR = false;
            _this.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
            _this.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
            _this.INVERTCUBICMAP = false;
            _this.LOGARITHMICDEPTH = false;
            _this.CAMERATONEMAP = false;
            _this.CAMERACONTRAST = false;
            _this.CAMERACOLORGRADING = false;
            _this.CAMERACOLORCURVES = false;
            _this.OVERLOADEDVALUES = false;
            _this.OVERLOADEDSHADOWVALUES = false;
            _this.USESPHERICALFROMREFLECTIONMAP = false;
            _this.REFRACTION = false;
            _this.REFRACTIONMAP_3D = false;
            _this.LINKREFRACTIONTOTRANSPARENCY = false;
            _this.REFRACTIONMAPINLINEARSPACE = false;
            _this.LODBASEDMICROSFURACE = false;
            _this.USEPHYSICALLIGHTFALLOFF = false;
            _this.RADIANCEOVERALPHA = false;
            _this.USEPMREMREFLECTION = false;
            _this.USEPMREMREFRACTION = false;
            _this.TWOSIDEDLIGHTING = false;
            _this.SHADOWFLOAT = false;
            _this.METALLICWORKFLOW = false;
            _this.METALLICMAP = false;
            _this.ROUGHNESSSTOREINMETALMAPALPHA = false;
            _this.ROUGHNESSSTOREINMETALMAPGREEN = false;
            _this.METALLNESSSTOREINMETALMAPBLUE = false;
            _this.AOSTOREINMETALMAPRED = false;
            _this.MICROSURFACEMAP = false;
            _this.MORPHTARGETS = false;
            _this.MORPHTARGETS_NORMAL = false;
            _this.MORPHTARGETS_TANGENT = false;
            _this.NUM_MORPH_INFLUENCERS = 0;
            _this.rebuild();
            return _this;
        }
        return LegacyPBRMaterialDefines;
    }(BABYLON.MaterialDefines));
    /**
     * The Physically based material of BJS.
     *
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation :
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    var LegacyPBRMaterial = /** @class */ (function (_super) {
        __extends(LegacyPBRMaterial, _super);
        /**
         * Instantiates a new PBRMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        function LegacyPBRMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            /**
             * Intensity of the direct lights e.g. the four lights available in your scene.
             * This impacts both the direct diffuse and specular highlights.
             */
            _this.directIntensity = 1.0;
            /**
             * Intensity of the emissive part of the material.
             * This helps controlling the emissive effect without modifying the emissive color.
             */
            _this.emissiveIntensity = 1.0;
            /**
             * Intensity of the environment e.g. how much the environment will light the object
             * either through harmonics for rough material or through the refelction for shiny ones.
             */
            _this.environmentIntensity = 1.0;
            /**
             * This is a special control allowing the reduction of the specular highlights coming from the
             * four lights of the scene. Those highlights may not be needed in full environment lighting.
             */
            _this.specularIntensity = 1.0;
            _this._lightingInfos = new BABYLON.Vector4(_this.directIntensity, _this.emissiveIntensity, _this.environmentIntensity, _this.specularIntensity);
            /**
             * Debug Control allowing disabling the bump map on this material.
             */
            _this.disableBumpMap = false;
            /**
             * Debug Control helping enforcing or dropping the darkness of shadows.
             * 1.0 means the shadows have their normal darkness, 0.0 means the shadows are not visible.
             */
            _this.overloadedShadowIntensity = 1.0;
            /**
             * Debug Control helping dropping the shading effect coming from the diffuse lighting.
             * 1.0 means the shade have their normal impact, 0.0 means no shading at all.
             */
            _this.overloadedShadeIntensity = 1.0;
            _this._overloadedShadowInfos = new BABYLON.Vector4(_this.overloadedShadowIntensity, _this.overloadedShadeIntensity, 0.0, 0.0);
            /**
             * The camera exposure used on this material.
             * This property is here and not in the camera to allow controlling exposure without full screen post process.
             * This corresponds to a photographic exposure.
             */
            _this.cameraExposure = 1.0;
            /**
             * The camera contrast used on this material.
             * This property is here and not in the camera to allow controlling contrast without full screen post process.
             */
            _this.cameraContrast = 1.0;
            /**
             * Color Grading 2D Lookup Texture.
             * This allows special effects like sepia, black and white to sixties rendering style.
             */
            _this.cameraColorGradingTexture = null;
            /**
             * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
             * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
             * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
             * corresponding to low luminance, medium luminance, and high luminance areas respectively.
             */
            _this.cameraColorCurves = null;
            _this._cameraInfos = new BABYLON.Vector4(1.0, 1.0, 0.0, 0.0);
            _this._microsurfaceTextureLods = new BABYLON.Vector2(0.0, 0.0);
            /**
             * Debug Control allowing to overload the ambient color.
             * This as to be use with the overloadedAmbientIntensity parameter.
             */
            _this.overloadedAmbient = BABYLON.Color3.White();
            /**
             * Debug Control indicating how much the overloaded ambient color is used against the default one.
             */
            _this.overloadedAmbientIntensity = 0.0;
            /**
             * Debug Control allowing to overload the albedo color.
             * This as to be use with the overloadedAlbedoIntensity parameter.
             */
            _this.overloadedAlbedo = BABYLON.Color3.White();
            /**
             * Debug Control indicating how much the overloaded albedo color is used against the default one.
             */
            _this.overloadedAlbedoIntensity = 0.0;
            /**
             * Debug Control allowing to overload the reflectivity color.
             * This as to be use with the overloadedReflectivityIntensity parameter.
             */
            _this.overloadedReflectivity = new BABYLON.Color3(0.0, 0.0, 0.0);
            /**
             * Debug Control indicating how much the overloaded reflectivity color is used against the default one.
             */
            _this.overloadedReflectivityIntensity = 0.0;
            /**
             * Debug Control allowing to overload the emissive color.
             * This as to be use with the overloadedEmissiveIntensity parameter.
             */
            _this.overloadedEmissive = BABYLON.Color3.White();
            /**
             * Debug Control indicating how much the overloaded emissive color is used against the default one.
             */
            _this.overloadedEmissiveIntensity = 0.0;
            _this._overloadedIntensity = new BABYLON.Vector4(_this.overloadedAmbientIntensity, _this.overloadedAlbedoIntensity, _this.overloadedReflectivityIntensity, _this.overloadedEmissiveIntensity);
            /**
             * Debug Control allowing to overload the reflection color.
             * This as to be use with the overloadedReflectionIntensity parameter.
             */
            _this.overloadedReflection = BABYLON.Color3.White();
            /**
             * Debug Control indicating how much the overloaded reflection color is used against the default one.
             */
            _this.overloadedReflectionIntensity = 0.0;
            /**
             * Debug Control allowing to overload the microsurface.
             * This as to be use with the overloadedMicroSurfaceIntensity parameter.
             */
            _this.overloadedMicroSurface = 0.0;
            /**
             * Debug Control indicating how much the overloaded microsurface is used against the default one.
             */
            _this.overloadedMicroSurfaceIntensity = 0.0;
            _this._overloadedMicroSurface = new BABYLON.Vector3(_this.overloadedMicroSurface, _this.overloadedMicroSurfaceIntensity, _this.overloadedReflectionIntensity);
            /**
             * AKA Occlusion Texture Intensity in other nomenclature.
             */
            _this.ambientTextureStrength = 1.0;
            _this.ambientColor = new BABYLON.Color3(0, 0, 0);
            /**
             * AKA Diffuse Color in other nomenclature.
             */
            _this.albedoColor = new BABYLON.Color3(1, 1, 1);
            /**
             * AKA Specular Color in other nomenclature.
             */
            _this.reflectivityColor = new BABYLON.Color3(1, 1, 1);
            _this.reflectionColor = new BABYLON.Color3(0.0, 0.0, 0.0);
            _this.emissiveColor = new BABYLON.Color3(0, 0, 0);
            /**
             * AKA Glossiness in other nomenclature.
             */
            _this.microSurface = 0.9;
            /**
             * source material index of refraction (IOR)' / 'destination material IOR.
             */
            _this.indexOfRefraction = 0.66;
            /**
             * Controls if refraction needs to be inverted on Y. This could be usefull for procedural texture.
             */
            _this.invertRefractionY = false;
            /**
             * This parameters will make the material used its opacity to control how much it is refracting aginst not.
             * Materials half opaque for instance using refraction could benefit from this control.
             */
            _this.linkRefractionWithTransparency = false;
            /**
             * The emissive and albedo are linked to never be more than one (Energy conservation).
             */
            _this.linkEmissiveWithAlbedo = false;
            _this.useLightmapAsShadowmap = false;
            /**
             * In this mode, the emissive informtaion will always be added to the lighting once.
             * A light for instance can be thought as emissive.
             */
            _this.useEmissiveAsIllumination = false;
            /**
             * Secifies that the alpha is coming form the albedo channel alpha channel.
             */
            _this.useAlphaFromAlbedoTexture = false;
            /**
             * Specifies that the material will keeps the specular highlights over a transparent surface (only the most limunous ones).
             * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
             */
            _this.useSpecularOverAlpha = true;
            /**
             * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
             */
            _this.useMicroSurfaceFromReflectivityMapAlpha = false;
            /**
             * Specifies if the metallic texture contains the roughness information in its alpha channel.
             */
            _this.useRoughnessFromMetallicTextureAlpha = true;
            /**
             * Specifies if the metallic texture contains the roughness information in its green channel.
             */
            _this.useRoughnessFromMetallicTextureGreen = false;
            /**
             * Specifies if the metallic texture contains the metallness information in its blue channel.
             */
            _this.useMetallnessFromMetallicTextureBlue = false;
            /**
             * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
             */
            _this.useAmbientOcclusionFromMetallicTextureRed = false;
            /**
             * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
             */
            _this.useAmbientInGrayScale = false;
            /**
             * In case the reflectivity map does not contain the microsurface information in its alpha channel,
             * The material will try to infer what glossiness each pixel should be.
             */
            _this.useAutoMicroSurfaceFromReflectivityMap = false;
            /**
             * Allows to work with scalar in linear mode. This is definitely a matter of preferences and tools used during
             * the creation of the material.
             */
            _this.useScalarInLinearSpace = false;
            /**
             * BJS is using an harcoded light falloff based on a manually sets up range.
             * In PBR, one way to represents the fallof is to use the inverse squared root algorythm.
             * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
             */
            _this.usePhysicalLightFalloff = true;
            /**
             * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most limunous ones).
             * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
             */
            _this.useRadianceOverAlpha = true;
            /**
             * Allows using the bump map in parallax mode.
             */
            _this.useParallax = false;
            /**
             * Allows using the bump map in parallax occlusion mode.
             */
            _this.useParallaxOcclusion = false;
            /**
             * Controls the scale bias of the parallax mode.
             */
            _this.parallaxScaleBias = 0.05;
            /**
             * If sets to true, disables all the lights affecting the material.
             */
            _this.disableLighting = false;
            /**
             * Number of Simultaneous lights allowed on the material.
             */
            _this.maxSimultaneousLights = 4;
            /**
             * If sets to true, x component of normal map value will invert (x = 1.0 - x).
             */
            _this.invertNormalMapX = false;
            /**
             * If sets to true, y component of normal map value will invert (y = 1.0 - y).
             */
            _this.invertNormalMapY = false;
            /**
             * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
             */
            _this.twoSidedLighting = false;
            _this._renderTargets = new BABYLON.SmartArray(16);
            _this._globalAmbientColor = new BABYLON.Color3(0, 0, 0);
            _this._tempColor = new BABYLON.Color3();
            _this._defines = new LegacyPBRMaterialDefines();
            _this._cachedDefines = new LegacyPBRMaterialDefines();
            _this._myScene = null;
            _this._cachedDefines.BonesPerMesh = -1;
            _this.getRenderTargetTextures = function () {
                _this._renderTargets.reset();
                if (BABYLON.StandardMaterial.ReflectionTextureEnabled && _this.reflectionTexture && _this.reflectionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this.reflectionTexture);
                }
                if (BABYLON.StandardMaterial.RefractionTextureEnabled && _this.refractionTexture && _this.refractionTexture.isRenderTarget) {
                    _this._renderTargets.push(_this.refractionTexture);
                }
                return _this._renderTargets;
            };
            return _this;
        }
        LegacyPBRMaterial.prototype.getClassName = function () {
            return "LegacyPBRMaterial";
        };
        Object.defineProperty(LegacyPBRMaterial.prototype, "useLogarithmicDepth", {
            get: function () {
                return this._useLogarithmicDepth;
            },
            set: function (value) {
                this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
            },
            enumerable: true,
            configurable: true
        });
        LegacyPBRMaterial.prototype.needAlphaBlending = function () {
            if (this.linkRefractionWithTransparency) {
                return false;
            }
            return (this.alpha < 1.0) || (this.opacityTexture != null) || this._shouldUseAlphaFromAlbedoTexture() || this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled;
        };
        LegacyPBRMaterial.prototype.needAlphaTesting = function () {
            if (this.linkRefractionWithTransparency) {
                return false;
            }
            return this.albedoTexture != null && this.albedoTexture.hasAlpha;
        };
        LegacyPBRMaterial.prototype._shouldUseAlphaFromAlbedoTexture = function () {
            return this.albedoTexture != null && this.albedoTexture.hasAlpha && this.useAlphaFromAlbedoTexture;
        };
        LegacyPBRMaterial.prototype.getAlphaTestTexture = function () {
            return this.albedoTexture;
        };
        LegacyPBRMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
            if (!mesh) {
                return true;
            }
            if (this._defines.INSTANCES !== useInstances) {
                return false;
            }
            return false;
        };
        LegacyPBRMaterial.prototype.convertColorToLinearSpaceToRef = function (color, ref) {
            LegacyPBRMaterial.convertColorToLinearSpaceToRef(color, ref, this.useScalarInLinearSpace);
        };
        LegacyPBRMaterial.convertColorToLinearSpaceToRef = function (color, ref, useScalarInLinear) {
            if (!useScalarInLinear) {
                color.toLinearSpaceToRef(ref);
            }
            else {
                ref.r = color.r;
                ref.g = color.g;
                ref.b = color.b;
            }
        };
        LegacyPBRMaterial.BindLights = function (scene, mesh, effect, defines, useScalarInLinearSpace, maxSimultaneousLights, usePhysicalLightFalloff) {
            var lightIndex = 0;
            for (var _i = 0, _a = mesh._lightSources; _i < _a.length; _i++) {
                var light = _a[_i];
                var useUbo = light._uniformBuffer.useUbo;
                light._uniformBuffer.bindToEffect(effect, "Light" + lightIndex);
                BABYLON.MaterialHelper.BindLightProperties(light, effect, lightIndex);
                // GAMMA CORRECTION.
                this.convertColorToLinearSpaceToRef(light.diffuse, LegacyPBRMaterial._scaledAlbedo, useScalarInLinearSpace);
                LegacyPBRMaterial._scaledAlbedo.scaleToRef(light.intensity, LegacyPBRMaterial._scaledAlbedo);
                light._uniformBuffer.updateColor4(useUbo ? "vLightDiffuse" : "vLightDiffuse" + lightIndex, LegacyPBRMaterial._scaledAlbedo, usePhysicalLightFalloff ? light.radius : light.range);
                if (defines["SPECULARTERM"]) {
                    this.convertColorToLinearSpaceToRef(light.specular, LegacyPBRMaterial._scaledReflectivity, useScalarInLinearSpace);
                    LegacyPBRMaterial._scaledReflectivity.scaleToRef(light.intensity, LegacyPBRMaterial._scaledReflectivity);
                    light._uniformBuffer.updateColor3(useUbo ? "vLightSpecular" : "vLightSpecular" + lightIndex, LegacyPBRMaterial._scaledReflectivity);
                }
                // Shadows
                if (scene.shadowsEnabled) {
                    BABYLON.MaterialHelper.BindLightShadow(light, scene, mesh, lightIndex + "", effect);
                }
                light._uniformBuffer.update();
                lightIndex++;
                if (lightIndex === maxSimultaneousLights)
                    break;
            }
        };
        LegacyPBRMaterial.prototype.isReady = function (mesh, useInstances) {
            var _this = this;
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
                BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines, true, this.maxSimultaneousLights);
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
                if (this.albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.albedoTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.ALBEDO = true;
                }
                if (this.ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                    if (!this.ambientTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.AMBIENT = true;
                    this._defines.AMBIENTINGRAYSCALE = this.useAmbientInGrayScale;
                }
                if (this.opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                    if (!this.opacityTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.OPACITY = true;
                    if (this.opacityTexture.getAlphaFromRGB) {
                        this._defines.OPACITYRGB = true;
                    }
                }
                if (this.reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                    if (!this.reflectionTexture.isReady()) {
                        return false;
                    }
                    this._defines.REFLECTION = true;
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
                        case BABYLON.Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                            this._defines.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = true;
                            break;
                    }
                    if (this.reflectionTexture instanceof BABYLON.HDRCubeTexture && this.reflectionTexture) {
                        this._defines.USESPHERICALFROMREFLECTIONMAP = true;
                        if (this.reflectionTexture.isPMREM) {
                            this._defines.USEPMREMREFLECTION = true;
                        }
                    }
                }
                if (this.lightmapTexture && BABYLON.StandardMaterial.LightmapTextureEnabled) {
                    if (!this.lightmapTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.LIGHTMAP = true;
                    this._defines.USELIGHTMAPASSHADOWMAP = this.useLightmapAsShadowmap;
                }
                if (this.emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                    if (!this.emissiveTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.EMISSIVE = true;
                }
                if (BABYLON.StandardMaterial.SpecularTextureEnabled) {
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
                if (scene.getEngine().getCaps().standardDerivatives && this.bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                    if (!this.bumpTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.BUMP = true;
                    if (this.useParallax && this.albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        this._defines.PARALLAX = true;
                        if (this.useParallaxOcclusion) {
                            this._defines.PARALLAXOCCLUSION = true;
                        }
                    }
                }
                if (this.refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                    if (!this.refractionTexture.isReady()) {
                        return false;
                    }
                    needUVs = true;
                    this._defines.REFRACTION = true;
                    this._defines.REFRACTIONMAP_3D = this.refractionTexture.isCube;
                    if (this.linkRefractionWithTransparency) {
                        this._defines.LINKREFRACTIONTOTRANSPARENCY = true;
                    }
                    if (this.refractionTexture instanceof BABYLON.HDRCubeTexture) {
                        this._defines.REFRACTIONMAPINLINEARSPACE = true;
                        if (this.refractionTexture.isPMREM) {
                            this._defines.USEPMREMREFRACTION = true;
                        }
                    }
                }
                if (this.cameraColorGradingTexture && BABYLON.StandardMaterial.ColorGradingTextureEnabled) {
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
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }
            if (BABYLON.StandardMaterial.FresnelEnabled) {
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
                if (!scene.getEngine().getCaps().standardDerivatives && !mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                    mesh.createNormals(true);
                    BABYLON.Tools.Warn("PBRMaterial: Normals have been created for the mesh: " + mesh.name);
                }
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.TangentKind)) {
                        this._defines.TANGENT = true;
                    }
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
                if (mesh.morphTargetManager) {
                    var manager = mesh.morphTargetManager;
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
                var fallbacks = new BABYLON.EffectFallbacks();
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
                BABYLON.MaterialHelper.HandleFallbacksForShadows(this._defines, fallbacks, this.maxSimultaneousLights);
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
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (this._defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (this._defines.TANGENT) {
                    attribs.push(BABYLON.VertexBuffer.TangentKind);
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
                BABYLON.MaterialHelper.PrepareAttributesForMorphTargets(attribs, mesh, this._defines);
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
                    BABYLON.ColorCurves.PrepareUniforms(uniforms);
                }
                if (this._defines.CAMERACOLORGRADING) {
                    uniforms.push("vCameraColorGradingInfos", "vCameraColorGradingScaleOffset");
                    samplers.push("cameraColorGrading2DSampler");
                }
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList({
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: this._defines,
                    maxSimultaneousLights: this.maxSimultaneousLights
                });
                var onCompiled = function (effect) {
                    if (_this.onCompiled) {
                        _this.onCompiled(effect);
                    }
                    _this.bindSceneUniformBuffer(effect, scene.getSceneUniformBuffer());
                };
                this._effect = scene.getEngine().createEffect("legacyPbr", {
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
        };
        LegacyPBRMaterial.prototype.buildUniformLayout = function () {
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
        };
        LegacyPBRMaterial.prototype.unbind = function () {
            if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("reflection2DSampler", null);
            }
            if (this.refractionTexture && this.refractionTexture.isRenderTarget) {
                this._uniformBuffer.setTexture("refraction2DSampler", null);
            }
            _super.prototype.unbind.call(this);
        };
        LegacyPBRMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        LegacyPBRMaterial.prototype.bind = function (world, mesh) {
            this._myScene = this.getScene();
            var effect = this._effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._effect);
            if (this._myScene.getCachedMaterial() !== this) {
                this._uniformBuffer.bindToEffect(effect, "Material");
                this.bindViewProjection(effect);
                if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync) {
                    // Fresnel
                    if (BABYLON.StandardMaterial.FresnelEnabled) {
                        if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("opacityParts", new BABYLON.Color3(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power);
                        }
                        if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                            this._uniformBuffer.updateColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                            this._uniformBuffer.updateColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                        }
                    }
                    // Texture uniforms      
                    if (this._myScene.texturesEnabled) {
                        if (this.albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vAlbedoInfos", this.albedoTexture.coordinatesIndex, this.albedoTexture.level);
                            this._uniformBuffer.updateMatrix("albedoMatrix", this.albedoTexture.getTextureMatrix());
                        }
                        if (this.ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                            this._uniformBuffer.updateFloat3("vAmbientInfos", this.ambientTexture.coordinatesIndex, this.ambientTexture.level, this.ambientTextureStrength);
                            this._uniformBuffer.updateMatrix("ambientMatrix", this.ambientTexture.getTextureMatrix());
                        }
                        if (this.opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vOpacityInfos", this.opacityTexture.coordinatesIndex, this.opacityTexture.level);
                            this._uniformBuffer.updateMatrix("opacityMatrix", this.opacityTexture.getTextureMatrix());
                        }
                        if (this.reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                            this._microsurfaceTextureLods.x = Math.round(Math.log(this.reflectionTexture.getSize().width) * Math.LOG2E);
                            this._uniformBuffer.updateMatrix("reflectionMatrix", this.reflectionTexture.getReflectionTextureMatrix());
                            this._uniformBuffer.updateFloat2("vReflectionInfos", this.reflectionTexture.level, 0);
                            if (this._defines.USESPHERICALFROMREFLECTIONMAP) {
                                var polynomials = this.reflectionTexture.sphericalPolynomial;
                                this._effect.setFloat3("vSphericalX", polynomials.x.x, polynomials.x.y, polynomials.x.z);
                                this._effect.setFloat3("vSphericalY", polynomials.y.x, polynomials.y.y, polynomials.y.z);
                                this._effect.setFloat3("vSphericalZ", polynomials.z.x, polynomials.z.y, polynomials.z.z);
                                this._effect.setFloat3("vSphericalXX_ZZ", polynomials.xx.x - polynomials.zz.x, polynomials.xx.y - polynomials.zz.y, polynomials.xx.z - polynomials.zz.z);
                                this._effect.setFloat3("vSphericalYY_ZZ", polynomials.yy.x - polynomials.zz.x, polynomials.yy.y - polynomials.zz.y, polynomials.yy.z - polynomials.zz.z);
                                this._effect.setFloat3("vSphericalZZ", polynomials.zz.x, polynomials.zz.y, polynomials.zz.z);
                                this._effect.setFloat3("vSphericalXY", polynomials.xy.x, polynomials.xy.y, polynomials.xy.z);
                                this._effect.setFloat3("vSphericalYZ", polynomials.yz.x, polynomials.yz.y, polynomials.yz.z);
                                this._effect.setFloat3("vSphericalZX", polynomials.zx.x, polynomials.zx.y, polynomials.zx.z);
                            }
                        }
                        if (this.emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
                            this._uniformBuffer.updateMatrix("emissiveMatrix", this.emissiveTexture.getTextureMatrix());
                        }
                        if (this.lightmapTexture && BABYLON.StandardMaterial.LightmapTextureEnabled) {
                            this._uniformBuffer.updateFloat2("vLightmapInfos", this.lightmapTexture.coordinatesIndex, this.lightmapTexture.level);
                            this._uniformBuffer.updateMatrix("lightmapMatrix", this.lightmapTexture.getTextureMatrix());
                        }
                        if (BABYLON.StandardMaterial.SpecularTextureEnabled) {
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
                        if (this.bumpTexture && this._myScene.getEngine().getCaps().standardDerivatives && BABYLON.StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                            this._uniformBuffer.updateFloat3("vBumpInfos", this.bumpTexture.coordinatesIndex, 1.0 / this.bumpTexture.level, this.parallaxScaleBias);
                            this._uniformBuffer.updateMatrix("bumpMatrix", this.bumpTexture.getTextureMatrix());
                            if (this._myScene._mirroredCameraPosition) {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this.invertNormalMapX ? 1.0 : -1.0, this.invertNormalMapY ? 1.0 : -1.0);
                            }
                            else {
                                this._uniformBuffer.updateFloat2("vTangentSpaceParams", this.invertNormalMapX ? -1.0 : 1.0, this.invertNormalMapY ? -1.0 : 1.0);
                            }
                        }
                        if (this.refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                            this._microsurfaceTextureLods.y = Math.round(Math.log(this.refractionTexture.getSize().width) * Math.LOG2E);
                            var depth = 1.0;
                            if (!this.refractionTexture.isCube) {
                                this._uniformBuffer.updateMatrix("refractionMatrix", this.refractionTexture.getReflectionTextureMatrix());
                                if (this.refractionTexture.depth) {
                                    depth = this.refractionTexture.depth;
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
                    if (this.albedoTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        this._uniformBuffer.setTexture("albedoSampler", this.albedoTexture);
                    }
                    if (this.ambientTexture && BABYLON.StandardMaterial.AmbientTextureEnabled) {
                        this._uniformBuffer.setTexture("ambientSampler", this.ambientTexture);
                    }
                    if (this.opacityTexture && BABYLON.StandardMaterial.OpacityTextureEnabled) {
                        this._uniformBuffer.setTexture("opacitySampler", this.opacityTexture);
                    }
                    if (this.reflectionTexture && BABYLON.StandardMaterial.ReflectionTextureEnabled) {
                        if (this.reflectionTexture.isCube) {
                            this._uniformBuffer.setTexture("reflectionCubeSampler", this.reflectionTexture);
                        }
                        else {
                            this._uniformBuffer.setTexture("reflection2DSampler", this.reflectionTexture);
                        }
                    }
                    if (this.emissiveTexture && BABYLON.StandardMaterial.EmissiveTextureEnabled) {
                        this._uniformBuffer.setTexture("emissiveSampler", this.emissiveTexture);
                    }
                    if (this.lightmapTexture && BABYLON.StandardMaterial.LightmapTextureEnabled) {
                        this._uniformBuffer.setTexture("lightmapSampler", this.lightmapTexture);
                    }
                    if (BABYLON.StandardMaterial.SpecularTextureEnabled) {
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
                    if (this.bumpTexture && this._myScene.getEngine().getCaps().standardDerivatives && BABYLON.StandardMaterial.BumpTextureEnabled && !this.disableBumpMap) {
                        this._uniformBuffer.setTexture("bumpSampler", this.bumpTexture);
                    }
                    if (this.refractionTexture && BABYLON.StandardMaterial.RefractionTextureEnabled) {
                        if (this.refractionTexture.isCube) {
                            this._uniformBuffer.setTexture("refractionCubeSampler", this.refractionTexture);
                        }
                        else {
                            this._uniformBuffer.setTexture("refraction2DSampler", this.refractionTexture);
                        }
                    }
                    if (this.cameraColorGradingTexture && BABYLON.StandardMaterial.ColorGradingTextureEnabled) {
                        this._effect.setTexture("cameraColorGrading2DSampler", this.cameraColorGradingTexture);
                        var x = this.cameraColorGradingTexture.level; // Texture Level
                        var y = this.cameraColorGradingTexture.getSize().height; // Texture Size example with 8
                        var z = y - 1.0; // SizeMinusOne 8 - 1
                        var w = 1 / y; // Space of 1 slice 1 / 8
                        this._effect.setFloat4("vCameraColorGradingInfos", x, y, z, w);
                        var slicePixelSizeU = w / y; // Space of 1 pixel in U direction, e.g. 1/64
                        var slicePixelSizeV = w; // Space of 1 pixel in V direction, e.g. 1/8					    // Space of 1 pixel in V direction, e.g. 1/8
                        var x2 = z * slicePixelSizeU; // Extent of lookup range in U for a single slice so that range corresponds to (size-1) texels, for example 7/64
                        var y2 = z / y; // Extent of lookup range in V for a single slice so that range corresponds to (size-1) texels, for example 7/8
                        var z2 = 0.5 * slicePixelSizeU; // Offset of lookup range in U to align sample position with texel centre, for example 0.5/64 
                        var w2 = 0.5 * slicePixelSizeV; // Offset of lookup range in V to align sample position with texel centre, for example 0.5/8
                        this._effect.setFloat4("vCameraColorGradingScaleOffset", x2, y2, z2, w2);
                    }
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._effect, this._myScene);
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
                if (this._myScene.fogEnabled && mesh.applyFog && this._myScene.fogMode !== BABYLON.Scene.FOGMODE_NONE || this.reflectionTexture) {
                    this.bindView(effect);
                }
                // Fog
                BABYLON.MaterialHelper.BindFogParameters(this._myScene, mesh, this._effect);
                // Morph targets
                if (this._defines.NUM_MORPH_INFLUENCERS) {
                    BABYLON.MaterialHelper.BindMorphTargetParameters(mesh, this._effect);
                }
                this._cameraInfos.x = this.cameraExposure;
                this._cameraInfos.y = this.cameraContrast;
                effect.setVector4("vCameraInfos", this._cameraInfos);
                if (this.cameraColorCurves) {
                    BABYLON.ColorCurves.Bind(this.cameraColorCurves, this._effect);
                }
                // Log. depth
                BABYLON.MaterialHelper.BindLogDepth(this._defines, this._effect, this._myScene);
            }
            this._uniformBuffer.update();
            this._afterBind(mesh);
            this._myScene = null;
        };
        LegacyPBRMaterial.prototype.getAnimatables = function () {
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
        };
        LegacyPBRMaterial.prototype.dispose = function (forceDisposeEffect, forceDisposeTextures) {
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
            _super.prototype.dispose.call(this, forceDisposeEffect, forceDisposeTextures);
        };
        LegacyPBRMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new LegacyPBRMaterial(name, _this.getScene()); }, this);
        };
        LegacyPBRMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.LegacyPBRMaterial";
            return serializationObject;
        };
        // Statics
        LegacyPBRMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new LegacyPBRMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        LegacyPBRMaterial._scaledAlbedo = new BABYLON.Color3();
        LegacyPBRMaterial._scaledReflectivity = new BABYLON.Color3();
        LegacyPBRMaterial._scaledEmissive = new BABYLON.Color3();
        LegacyPBRMaterial._scaledReflection = new BABYLON.Color3();
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "directIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "emissiveIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "environmentIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "specularIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "disableBumpMap", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedShadowIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedShadeIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "cameraExposure", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "cameraContrast", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "cameraColorGradingTexture", void 0);
        __decorate([
            BABYLON.serializeAsColorCurves()
        ], LegacyPBRMaterial.prototype, "cameraColorCurves", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], LegacyPBRMaterial.prototype, "overloadedAmbient", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedAmbientIntensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], LegacyPBRMaterial.prototype, "overloadedAlbedo", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedAlbedoIntensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], LegacyPBRMaterial.prototype, "overloadedReflectivity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedReflectivityIntensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], LegacyPBRMaterial.prototype, "overloadedEmissive", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedEmissiveIntensity", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], LegacyPBRMaterial.prototype, "overloadedReflection", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedReflectionIntensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedMicroSurface", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "overloadedMicroSurfaceIntensity", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "albedoTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "ambientTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "ambientTextureStrength", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "opacityTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "reflectionTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "emissiveTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "reflectivityTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "metallicTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "metallic", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "roughness", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "microSurfaceTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "bumpTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "lightmapTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture()
        ], LegacyPBRMaterial.prototype, "refractionTexture", void 0);
        __decorate([
            BABYLON.serializeAsColor3("ambient")
        ], LegacyPBRMaterial.prototype, "ambientColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("albedo")
        ], LegacyPBRMaterial.prototype, "albedoColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("reflectivity")
        ], LegacyPBRMaterial.prototype, "reflectivityColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("reflection")
        ], LegacyPBRMaterial.prototype, "reflectionColor", void 0);
        __decorate([
            BABYLON.serializeAsColor3("emissive")
        ], LegacyPBRMaterial.prototype, "emissiveColor", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "microSurface", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "indexOfRefraction", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "invertRefractionY", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], LegacyPBRMaterial.prototype, "opacityFresnelParameters", void 0);
        __decorate([
            BABYLON.serializeAsFresnelParameters()
        ], LegacyPBRMaterial.prototype, "emissiveFresnelParameters", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "linkRefractionWithTransparency", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "linkEmissiveWithAlbedo", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useLightmapAsShadowmap", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useEmissiveAsIllumination", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useAlphaFromAlbedoTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useSpecularOverAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useMicroSurfaceFromReflectivityMapAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useRoughnessFromMetallicTextureAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useRoughnessFromMetallicTextureGreen", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useMetallnessFromMetallicTextureBlue", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useAmbientOcclusionFromMetallicTextureRed", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useAmbientInGrayScale", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useAutoMicroSurfaceFromReflectivityMap", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useScalarInLinearSpace", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "usePhysicalLightFalloff", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useRadianceOverAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useParallax", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useParallaxOcclusion", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "parallaxScaleBias", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "disableLighting", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "maxSimultaneousLights", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "invertNormalMapX", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "invertNormalMapY", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "twoSidedLighting", void 0);
        __decorate([
            BABYLON.serialize()
        ], LegacyPBRMaterial.prototype, "useLogarithmicDepth", null);
        return LegacyPBRMaterial;
    }(BABYLON.Material));
    BABYLON.LegacyPBRMaterial = LegacyPBRMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.legacyPBRMaterial.js.map

BABYLON.Effect.ShadersStore['legacyPbrVertexShader'] = "precision highp float;\n#include<__decl__legacyPbrVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\n#endif\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\n#endif\n#ifdef OPACITY\nvarying vec2 vOpacityUV;\n#endif\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\n#endif\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\n#endif\n#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) \nvarying vec2 vReflectivityUV;\n#endif\n#ifdef MICROSURFACEMAP\nvarying vec2 vMicroSurfaceSamplerUV;\n#endif\n#ifdef BUMP\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL\nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normalUpdated,0.0)));\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef ALBEDO\nif (vAlbedoInfos.x == 0.)\n{\nvAlbedoUV=vec2(albedoMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAlbedoUV=vec2(albedoMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef AMBIENT\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef OPACITY\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef EMISSIVE\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef LIGHTMAP\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) \nif (vReflectivityInfos.x == 0.)\n{\nvReflectivityUV=vec2(reflectivityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvReflectivityUV=vec2(reflectivityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef MICROSURFACEMAP\nif (vMicroSurfaceSamplerInfos.x == 0.)\n{\nvMicroSurfaceSamplerUV=vec2(microSurfaceSamplerMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvMicroSurfaceSamplerUV=vec2(microSurfaceSamplerMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#ifdef BUMP\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#include<bumpVertex>\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['legacyPbrPixelShader'] = "#if defined(BUMP)|| !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LODBASEDMICROSFURACE\n#extension GL_EXT_shader_texture_lod : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\nprecision highp float;\n#include<__decl__legacyPbrFragment>\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\nuniform vec4 vCameraInfos;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\n#ifdef ALBEDO\nvarying vec2 vAlbedoUV;\nuniform sampler2D albedoSampler;\n#endif\n#ifdef AMBIENT\nvarying vec2 vAmbientUV;\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \nvarying vec2 vOpacityUV;\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\nvarying vec2 vEmissiveUV;\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\nvarying vec2 vLightmapUV;\nuniform sampler2D lightmapSampler;\n#endif\n#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) \nvarying vec2 vReflectivityUV;\nuniform sampler2D reflectivitySampler;\n#endif\n#ifdef MICROSURFACEMAP\nvarying vec2 vMicroSurfaceSamplerUV;\nuniform sampler2D microSurfaceSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#ifdef CAMERACOLORGRADING\n#include<legacyColorGradingDefinition>\n#endif\n#ifdef CAMERACOLORCURVES\n#include<legacyColorCurvesDefinition>\n#endif\n\n#include<shadowsFragmentFunctions>\n#include<legacyPbrFunctions>\n#ifdef CAMERACOLORGRADING\n#include<legacyColorGrading>\n#endif\n#ifdef CAMERACOLORCURVES\n#include<legacyColorCurves>\n#endif\n#include<legacyPbrLightFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n\nvec4 surfaceAlbedo=vec4(1.,1.,1.,1.);\nvec3 surfaceAlbedoContribution=vAlbedoColor.rgb;\n\nfloat alpha=vAlbedoColor.a;\n#ifdef ALBEDO\nsurfaceAlbedo=texture2D(albedoSampler,vAlbedoUV+uvOffset);\nsurfaceAlbedo=vec4(toLinearSpace(surfaceAlbedo.rgb),surfaceAlbedo.a);\n#ifndef LINKREFRACTIONTOTRANSPARENCY\n#ifdef ALPHATEST\nif (surfaceAlbedo.a<0.4)\ndiscard;\n#endif\n#endif\n#ifdef ALPHAFROMALBEDO\nalpha*=surfaceAlbedo.a;\n#endif\nsurfaceAlbedo.rgb*=vAlbedoInfos.y;\n#else\n\nsurfaceAlbedo.rgb=surfaceAlbedoContribution;\nsurfaceAlbedoContribution=vec3(1.,1.,1.);\n#endif\n#ifdef VERTEXCOLOR\nsurfaceAlbedo.rgb*=vColor.rgb;\n#endif\n#ifdef OVERLOADEDVALUES\nsurfaceAlbedo.rgb=mix(surfaceAlbedo.rgb,vOverloadedAlbedo,vOverloadedIntensity.y);\n#endif\n\nvec3 ambientOcclusionColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nvec3 ambientOcclusionColorMap=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#ifdef AMBIENTINGRAYSCALE \nambientOcclusionColorMap=vec3(ambientOcclusionColorMap.r,ambientOcclusionColorMap.r,ambientOcclusionColorMap.r);\n#endif\nambientOcclusionColor=mix(ambientOcclusionColor,ambientOcclusionColorMap,vAmbientInfos.z);\n#ifdef OVERLOADEDVALUES\nambientOcclusionColor.rgb=mix(ambientOcclusionColor.rgb,vOverloadedAmbient,vOverloadedIntensity.x);\n#endif\n#endif\n\nfloat microSurface=vReflectivityColor.a;\nvec3 surfaceReflectivityColor=vReflectivityColor.rgb;\n#ifdef REFLECTIVITY\nvec4 surfaceReflectivityColorMap=texture2D(reflectivitySampler,vReflectivityUV+uvOffset);\nsurfaceReflectivityColor=surfaceReflectivityColorMap.rgb;\nsurfaceReflectivityColor=toLinearSpace(surfaceReflectivityColor);\nsurfaceReflectivityColor*=vReflectivityInfos.y;\n#ifdef OVERLOADEDVALUES\nsurfaceReflectivityColor=mix(surfaceReflectivityColor,vOverloadedReflectivity,vOverloadedIntensity.z);\n#endif\n#ifdef MICROSURFACEFROMREFLECTIVITYMAP\nmicroSurface=surfaceReflectivityColorMap.a*vReflectivityInfos.z;\n#else\n#ifdef MICROSURFACEAUTOMATIC\nmicroSurface=computeDefaultMicroSurface(microSurface,surfaceReflectivityColor);\n#endif\n#endif\n#else\n#ifdef OVERLOADEDVALUES\nsurfaceReflectivityColor=mix(surfaceReflectivityColor,vOverloadedReflectivity,vOverloadedIntensity.z);\n#endif\n#endif\n#ifdef METALLICWORKFLOW\nvec2 metallicRoughness=surfaceReflectivityColor.rg;\n#ifdef METALLICMAP\nvec4 surfaceMetallicColorMap=texture2D(reflectivitySampler,vReflectivityUV+uvOffset);\n#ifdef AOSTOREINMETALMAPRED \nvec3 aoStoreInMetalMap=vec3(surfaceMetallicColorMap.r,surfaceMetallicColorMap.r,surfaceMetallicColorMap.r);\nambientOcclusionColor=mix(ambientOcclusionColor,aoStoreInMetalMap,vReflectivityInfos.z);\n#endif\n#ifdef METALLNESSSTOREINMETALMAPBLUE\nmetallicRoughness.r*=surfaceMetallicColorMap.b;\n#else\nmetallicRoughness.r*=surfaceMetallicColorMap.r;\n#endif\n#ifdef ROUGHNESSSTOREINMETALMAPALPHA\nmetallicRoughness.g*=surfaceMetallicColorMap.a;\n#else\n#ifdef ROUGHNESSSTOREINMETALMAPGREEN\nmetallicRoughness.g*=surfaceMetallicColorMap.g;\n#endif\n#endif\n#endif\n#ifdef MICROSURFACEMAP\nvec4 microSurfaceTexel=texture2D(microSurfaceSampler,vMicroSurfaceSamplerUV+uvOffset)*vMicroSurfaceSamplerInfos.y;\nmetallicRoughness.g*=microSurfaceTexel.r;\n#endif\n\nmicroSurface=1.0-metallicRoughness.g;\n\nvec3 baseColor=surfaceAlbedo.rgb;\n\n\nconst vec3 DefaultSpecularReflectanceDielectric=vec3(0.04,0.04,0.04);\n\nsurfaceAlbedo.rgb=mix(baseColor.rgb*(1.0-DefaultSpecularReflectanceDielectric.r),vec3(0.,0.,0.),metallicRoughness.r);\n\nsurfaceReflectivityColor=mix(DefaultSpecularReflectanceDielectric,baseColor,metallicRoughness.r);\n#ifdef OVERLOADEDVALUES\nsurfaceReflectivityColor=mix(surfaceReflectivityColor,vOverloadedReflectivity,vOverloadedIntensity.z);\n#endif\n#else\n#ifdef MICROSURFACEMAP\nvec4 microSurfaceTexel=texture2D(microSurfaceSampler,vMicroSurfaceSamplerUV+uvOffset)*vMicroSurfaceSamplerInfos.y;\nmicroSurface=microSurfaceTexel.r;\n#endif\n#endif\n#ifdef OVERLOADEDVALUES\nmicroSurface=mix(microSurface,vOverloadedMicroSurface.x,vOverloadedMicroSurface.y);\n#endif\n\nfloat NdotV=max(0.00000000001,dot(normalW,viewDirectionW));\n\nmicroSurface=clamp(microSurface,0.,1.)*0.98;\n\nfloat roughness=clamp(1.-microSurface,0.000001,1.0);\n\nvec3 lightDiffuseContribution=vec3(0.,0.,0.);\n#ifdef OVERLOADEDSHADOWVALUES\nvec3 shadowedOnlyLightDiffuseContribution=vec3(1.,1.,1.);\n#endif\n#ifdef SPECULARTERM\nvec3 lightSpecularContribution=vec3(0.,0.,0.);\n#endif\nfloat notShadowLevel=1.; \n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\nfloat NdotL=-1.;\nlightingInfo info;\n\nfloat reflectance=max(max(surfaceReflectivityColor.r,surfaceReflectivityColor.g),surfaceReflectivityColor.b);\n\n\nfloat reflectance90=clamp(reflectance*25.0,0.0,1.0);\nvec3 specularEnvironmentR0=surfaceReflectivityColor.rgb;\nvec3 specularEnvironmentR90=vec3(1.0,1.0,1.0)*reflectance90;\n#include<legacyPbrLightFunctionsCall>[0..maxSimultaneousLights]\n#ifdef SPECULARTERM\nlightSpecularContribution*=vLightingIntensity.w;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 surfaceRefractionColor=vec3(0.,0.,0.);\n\n#ifdef LODBASEDMICROSFURACE\nfloat alphaG=convertRoughnessToAverageSlope(roughness);\n#endif\n#ifdef REFRACTION\nvec3 refractionVector=refract(-viewDirectionW,normalW,vRefractionInfos.y);\n#ifdef LODBASEDMICROSFURACE\n#ifdef USEPMREMREFRACTION\nfloat lodRefraction=getMipMapIndexFromAverageSlopeWithPMREM(vMicrosurfaceTextureLods.y,alphaG);\n#else\nfloat lodRefraction=getMipMapIndexFromAverageSlope(vMicrosurfaceTextureLods.y,alphaG);\n#endif\n#else\nfloat biasRefraction=(vMicrosurfaceTextureLods.y+2.)*(1.0-microSurface);\n#endif\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\n#ifdef LODBASEDMICROSFURACE\n#ifdef USEPMREMREFRACTION\n\nif ((vMicrosurfaceTextureLods.y-lodRefraction)>4.0)\n{\n\nfloat scaleRefraction=1.-exp2(lodRefraction)/exp2(vMicrosurfaceTextureLods.y); \nfloat maxRefraction=max(max(abs(refractionVector.x),abs(refractionVector.y)),abs(refractionVector.z));\nif (abs(refractionVector.x) != maxRefraction) refractionVector.x*=scaleRefraction;\nif (abs(refractionVector.y) != maxRefraction) refractionVector.y*=scaleRefraction;\nif (abs(refractionVector.z) != maxRefraction) refractionVector.z*=scaleRefraction;\n}\n#endif\nsurfaceRefractionColor=textureCubeLodEXT(refractionCubeSampler,refractionVector,lodRefraction).rgb*vRefractionInfos.x;\n#else\nsurfaceRefractionColor=textureCube(refractionCubeSampler,refractionVector,biasRefraction).rgb*vRefractionInfos.x;\n#endif\n}\n#ifndef REFRACTIONMAPINLINEARSPACE\nsurfaceRefractionColor=toLinearSpace(surfaceRefractionColor.rgb);\n#endif\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\n#ifdef LODBASEDMICROSFURACE\nsurfaceRefractionColor=texture2DLodEXT(refraction2DSampler,refractionCoords,lodRefraction).rgb*vRefractionInfos.x;\n#else\nsurfaceRefractionColor=texture2D(refraction2DSampler,refractionCoords,biasRefraction).rgb*vRefractionInfos.x;\n#endif \nsurfaceRefractionColor=toLinearSpace(surfaceRefractionColor.rgb);\n#endif\n#endif\n\nvec3 environmentRadiance=vReflectionColor.rgb;\nvec3 environmentIrradiance=vReflectionColor.rgb;\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef LODBASEDMICROSFURACE\n#ifdef USEPMREMREFLECTION\nfloat lodReflection=getMipMapIndexFromAverageSlopeWithPMREM(vMicrosurfaceTextureLods.x,alphaG);\n#else\nfloat lodReflection=getMipMapIndexFromAverageSlope(vMicrosurfaceTextureLods.x,alphaG);\n#endif\n#else\nfloat biasReflection=(vMicrosurfaceTextureLods.x+2.)*(1.0-microSurface);\n#endif\n#ifdef REFLECTIONMAP_3D\n#ifdef LODBASEDMICROSFURACE\n#ifdef USEPMREMREFLECTION\n\nif ((vMicrosurfaceTextureLods.y-lodReflection)>4.0)\n{\n\nfloat scaleReflection=1.-exp2(lodReflection)/exp2(vMicrosurfaceTextureLods.x); \nfloat maxReflection=max(max(abs(vReflectionUVW.x),abs(vReflectionUVW.y)),abs(vReflectionUVW.z));\nif (abs(vReflectionUVW.x) != maxReflection) vReflectionUVW.x*=scaleReflection;\nif (abs(vReflectionUVW.y) != maxReflection) vReflectionUVW.y*=scaleReflection;\nif (abs(vReflectionUVW.z) != maxReflection) vReflectionUVW.z*=scaleReflection;\n}\n#endif\nenvironmentRadiance=textureCubeLodEXT(reflectionCubeSampler,vReflectionUVW,lodReflection).rgb*vReflectionInfos.x;\n#else\nenvironmentRadiance=textureCube(reflectionCubeSampler,vReflectionUVW,biasReflection).rgb*vReflectionInfos.x;\n#endif\n#ifdef USESPHERICALFROMREFLECTIONMAP\n#ifndef REFLECTIONMAP_SKYBOX\nvec3 normalEnvironmentSpace=(reflectionMatrix*vec4(normalW,1)).xyz;\nenvironmentIrradiance=EnvironmentIrradiance(normalEnvironmentSpace);\n#endif\n#else\nenvironmentRadiance=toLinearSpace(environmentRadiance.rgb);\nenvironmentIrradiance=textureCube(reflectionCubeSampler,normalW,20.).rgb*vReflectionInfos.x;\nenvironmentIrradiance=toLinearSpace(environmentIrradiance.rgb);\nenvironmentIrradiance*=0.2; \n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\n#ifdef LODBASEDMICROSFURACE\nenvironmentRadiance=texture2DLodEXT(reflection2DSampler,coords,lodReflection).rgb*vReflectionInfos.x;\n#else\nenvironmentRadiance=texture2D(reflection2DSampler,coords,biasReflection).rgb*vReflectionInfos.x;\n#endif\nenvironmentRadiance=toLinearSpace(environmentRadiance.rgb);\nenvironmentIrradiance=texture2D(reflection2DSampler,coords,20.).rgb*vReflectionInfos.x;\nenvironmentIrradiance=toLinearSpace(environmentIrradiance.rgb);\n#endif\n#endif\n#ifdef OVERLOADEDVALUES\nenvironmentIrradiance=mix(environmentIrradiance,vOverloadedReflection,vOverloadedMicroSurface.z);\nenvironmentRadiance=mix(environmentRadiance,vOverloadedReflection,vOverloadedMicroSurface.z);\n#endif\nenvironmentRadiance*=vLightingIntensity.z;\nenvironmentIrradiance*=vLightingIntensity.z;\n\nvec3 specularEnvironmentReflectance=FresnelSchlickEnvironmentGGX(clamp(NdotV,0.,1.),specularEnvironmentR0,specularEnvironmentR90,sqrt(microSurface));\n\nvec3 refractance=vec3(0.0,0.0,0.0);\n#ifdef REFRACTION\nvec3 transmission=vec3(1.0,1.0,1.0);\n#ifdef LINKREFRACTIONTOTRANSPARENCY\n\ntransmission*=(1.0-alpha);\n\n\nvec3 mixedAlbedo=surfaceAlbedoContribution.rgb*surfaceAlbedo.rgb;\nfloat maxChannel=max(max(mixedAlbedo.r,mixedAlbedo.g),mixedAlbedo.b);\nvec3 tint=clamp(maxChannel*mixedAlbedo,0.0,1.0);\n\nsurfaceAlbedoContribution*=alpha;\n\nenvironmentIrradiance*=alpha;\n\nsurfaceRefractionColor*=tint;\n\nalpha=1.0;\n#endif\n\nvec3 bounceSpecularEnvironmentReflectance=(2.0*specularEnvironmentReflectance)/(1.0+specularEnvironmentReflectance);\nspecularEnvironmentReflectance=mix(bounceSpecularEnvironmentReflectance,specularEnvironmentReflectance,alpha);\n\ntransmission*=1.0-specularEnvironmentReflectance;\n\nrefractance=surfaceRefractionColor*transmission;\n#endif\n\nsurfaceAlbedo.rgb=(1.-reflectance)*surfaceAlbedo.rgb;\nrefractance*=vLightingIntensity.z;\nenvironmentRadiance*=specularEnvironmentReflectance;\n\nvec3 surfaceEmissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nvec3 emissiveColorTex=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb;\nsurfaceEmissiveColor=toLinearSpace(emissiveColorTex.rgb)*surfaceEmissiveColor*vEmissiveInfos.y;\n#endif\n#ifdef OVERLOADEDVALUES\nsurfaceEmissiveColor=mix(surfaceEmissiveColor,vOverloadedEmissive,vOverloadedIntensity.w);\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nsurfaceEmissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=lightDiffuseContribution*surfaceAlbedoContribution;\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution=shadowedOnlyLightDiffuseContribution*surfaceAlbedoContribution;\n#endif\n#else\n#ifdef LINKEMISSIVEWITHALBEDO\nvec3 finalDiffuse=(lightDiffuseContribution+surfaceEmissiveColor)*surfaceAlbedoContribution;\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution=(shadowedOnlyLightDiffuseContribution+surfaceEmissiveColor)*surfaceAlbedoContribution;\n#endif\n#else\nvec3 finalDiffuse=lightDiffuseContribution*surfaceAlbedoContribution+surfaceEmissiveColor;\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution=shadowedOnlyLightDiffuseContribution*surfaceAlbedoContribution+surfaceEmissiveColor;\n#endif\n#endif\n#endif\nfinalDiffuse.rgb+=vAmbientColor;\nfinalDiffuse*=surfaceAlbedo.rgb;\nfinalDiffuse=max(finalDiffuse,0.0);\n#ifdef OVERLOADEDSHADOWVALUES\nshadowedOnlyLightDiffuseContribution+=vAmbientColor;\nshadowedOnlyLightDiffuseContribution*=surfaceAlbedo.rgb;\nshadowedOnlyLightDiffuseContribution=max(shadowedOnlyLightDiffuseContribution,0.0);\nfinalDiffuse=mix(finalDiffuse,shadowedOnlyLightDiffuseContribution,(1.0-vOverloadedShadowIntensity.y));\n#endif\nfinalDiffuse=(finalDiffuse*vLightingIntensity.x+surfaceAlbedo.rgb*environmentIrradiance)*ambientOcclusionColor;\n#ifdef SPECULARTERM\nvec3 finalSpecular=lightSpecularContribution*surfaceReflectivityColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+getLuminance(finalSpecular),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef RADIANCEOVERALPHA\nalpha=clamp(alpha+getLuminance(environmentRadiance),0.,1.);\n#endif\n\n\nvec4 finalColor=vec4(finalDiffuse+finalSpecular*vLightingIntensity.x+environmentRadiance+refractance,alpha);\n#ifdef EMISSIVEASILLUMINATION\nfinalColor.rgb+=(surfaceEmissiveColor*vLightingIntensity.y);\n#endif\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\nfinalColor.rgb*=lightmapColor;\n#else\nfinalColor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\nfinalColor=max(finalColor,0.0);\n#ifdef CAMERATONEMAP\nfinalColor.rgb=toneMaps(finalColor.rgb);\n#endif\nfinalColor.rgb=toGammaSpace(finalColor.rgb);\n#include<logDepthFragment>\n#include<fogFragment>(color,finalColor)\n#ifdef CAMERACONTRAST\nfinalColor=contrasts(finalColor);\n#endif\nfinalColor.rgb=clamp(finalColor.rgb,0.,1.);\n#ifdef CAMERACOLORGRADING\nfinalColor=colorGrades(finalColor);\n#endif\n#ifdef CAMERACOLORCURVES\nfinalColor.rgb=applyColorCurves(finalColor.rgb);\n#endif\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\ngl_FragColor=finalColor;\n}";

BABYLON.Effect.IncludesShadersStore['legacyPbrFragmentDeclaration'] = "uniform vec3 vReflectionColor;\nuniform vec4 vAlbedoColor;\n\nuniform vec4 vLightingIntensity;\n#ifdef OVERLOADEDVALUES\nuniform vec4 vOverloadedIntensity;\nuniform vec3 vOverloadedAmbient;\nuniform vec3 vOverloadedAlbedo;\nuniform vec3 vOverloadedReflectivity;\nuniform vec3 vOverloadedEmissive;\nuniform vec3 vOverloadedReflection;\nuniform vec3 vOverloadedMicroSurface;\n#endif\n#ifdef OVERLOADEDSHADOWVALUES\nuniform vec4 vOverloadedShadowIntensity;\n#endif\n#if defined(REFLECTION) || defined(REFRACTION)\nuniform vec2 vMicrosurfaceTextureLods;\n#endif\nuniform vec4 vReflectivityColor;\nuniform vec3 vEmissiveColor;\n\n#ifdef ALBEDO\nuniform vec2 vAlbedoInfos;\n#endif\n#ifdef AMBIENT\nuniform vec3 vAmbientInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) \nuniform vec3 vReflectivityInfos;\n#endif\n#ifdef MICROSURFACEMAP\nuniform vec2 vMicroSurfaceSamplerInfos;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifdef REFRACTIONMAP_3D\n#else\nuniform mat4 refractionMatrix;\n#endif\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['legacyPbrFunctions'] = "\n#define RECIPROCAL_PI2 0.15915494\n#define FRESNEL_MAXIMUM_ON_ROUGH 0.25\n\nconst float kPi=3.1415926535897932384626433832795;\nconst float kRougnhessToAlphaScale=0.1;\nconst float kRougnhessToAlphaOffset=0.29248125;\nfloat Square(float value)\n{\nreturn value*value;\n}\nfloat convertRoughnessToAverageSlope(float roughness)\n{\n\nconst float kMinimumVariance=0.0005;\nfloat alphaG=Square(roughness)+kMinimumVariance;\nreturn alphaG;\n}\n\nfloat getMipMapIndexFromAverageSlope(float maxMipLevel,float alpha)\n{\n\n\n\n\n\n\n\nfloat mip=kRougnhessToAlphaOffset+maxMipLevel+(maxMipLevel*kRougnhessToAlphaScale*log2(alpha));\nreturn clamp(mip,0.,maxMipLevel);\n}\nfloat getMipMapIndexFromAverageSlopeWithPMREM(float maxMipLevel,float alphaG)\n{\nfloat specularPower=clamp(2./alphaG-2.,0.000001,2048.);\n\nreturn clamp(- 0.5*log2(specularPower)+5.5,0.,maxMipLevel);\n}\n\nfloat smithVisibilityG1_TrowbridgeReitzGGX(float dot,float alphaG)\n{\nfloat tanSquared=(1.0-dot*dot)/(dot*dot);\nreturn 2.0/(1.0+sqrt(1.0+alphaG*alphaG*tanSquared));\n}\nfloat smithVisibilityG_TrowbridgeReitzGGX_Walter(float NdotL,float NdotV,float alphaG)\n{\nreturn smithVisibilityG1_TrowbridgeReitzGGX(NdotL,alphaG)*smithVisibilityG1_TrowbridgeReitzGGX(NdotV,alphaG);\n}\n\n\nfloat normalDistributionFunction_TrowbridgeReitzGGX(float NdotH,float alphaG)\n{\n\n\n\nfloat a2=Square(alphaG);\nfloat d=NdotH*NdotH*(a2-1.0)+1.0;\nreturn a2/(kPi*d*d);\n}\nvec3 fresnelSchlickGGX(float VdotH,vec3 reflectance0,vec3 reflectance90)\n{\nreturn reflectance0+(reflectance90-reflectance0)*pow(clamp(1.0-VdotH,0.,1.),5.0);\n}\nvec3 FresnelSchlickEnvironmentGGX(float VdotN,vec3 reflectance0,vec3 reflectance90,float smoothness)\n{\n\nfloat weight=mix(FRESNEL_MAXIMUM_ON_ROUGH,1.0,smoothness);\nreturn reflectance0+weight*(reflectance90-reflectance0)*pow(clamp(1.0-VdotN,0.,1.),5.0);\n}\n\nvec3 computeSpecularTerm(float NdotH,float NdotL,float NdotV,float VdotH,float roughness,vec3 specularColor,vec3 reflectance90)\n{\nfloat alphaG=convertRoughnessToAverageSlope(roughness);\nfloat distribution=normalDistributionFunction_TrowbridgeReitzGGX(NdotH,alphaG);\nfloat visibility=smithVisibilityG_TrowbridgeReitzGGX_Walter(NdotL,NdotV,alphaG);\nvisibility/=(4.0*NdotL*NdotV); \nvec3 fresnel=fresnelSchlickGGX(VdotH,specularColor,reflectance90);\nfloat specTerm=max(0.,visibility*distribution)*NdotL;\nreturn fresnel*specTerm*kPi; \n}\nfloat computeDiffuseTerm(float NdotL,float NdotV,float VdotH,float roughness)\n{\n\n\nfloat diffuseFresnelNV=pow(clamp(1.0-NdotL,0.000001,1.),5.0);\nfloat diffuseFresnelNL=pow(clamp(1.0-NdotV,0.000001,1.),5.0);\nfloat diffuseFresnel90=0.5+2.0*VdotH*VdotH*roughness;\nfloat diffuseFresnelTerm =\n(1.0+(diffuseFresnel90-1.0)*diffuseFresnelNL) *\n(1.0+(diffuseFresnel90-1.0)*diffuseFresnelNV);\nreturn diffuseFresnelTerm*NdotL;\n\n\n}\nfloat adjustRoughnessFromLightProperties(float roughness,float lightRadius,float lightDistance)\n{\n#ifdef USEPHYSICALLIGHTFALLOFF\n\nfloat lightRoughness=lightRadius/lightDistance;\n\nfloat totalRoughness=clamp(lightRoughness+roughness,0.,1.);\nreturn totalRoughness;\n#else\nreturn roughness;\n#endif\n}\nfloat computeDefaultMicroSurface(float microSurface,vec3 reflectivityColor)\n{\nfloat kReflectivityNoAlphaWorkflow_SmoothnessMax=0.95;\nfloat reflectivityLuminance=getLuminance(reflectivityColor);\nfloat reflectivityLuma=sqrt(reflectivityLuminance);\nmicroSurface=reflectivityLuma*kReflectivityNoAlphaWorkflow_SmoothnessMax;\nreturn microSurface;\n}\n#ifdef CAMERATONEMAP\nvec3 toneMaps(vec3 color)\n{\ncolor=max(color,0.0);\n\ncolor.rgb=color.rgb*vCameraInfos.x;\nfloat tuning=1.5; \n\n\nvec3 tonemapped=1.0-exp2(-color.rgb*tuning); \ncolor.rgb=mix(color.rgb,tonemapped,1.0);\nreturn color;\n}\n#endif\n#ifdef CAMERACONTRAST\nvec4 contrasts(vec4 color)\n{\ncolor=clamp(color,0.0,1.0);\nvec3 resultHighContrast=color.rgb*color.rgb*(3.0-2.0*color.rgb);\nfloat contrast=vCameraInfos.y;\nif (contrast<1.0)\n{\n\ncolor.rgb=mix(vec3(0.5,0.5,0.5),color.rgb,contrast);\n}\nelse\n{\n\ncolor.rgb=mix(color.rgb,resultHighContrast,contrast-1.0);\n}\nreturn color;\n}\n#endif\n#ifdef USESPHERICALFROMREFLECTIONMAP\nuniform vec3 vSphericalX;\nuniform vec3 vSphericalY;\nuniform vec3 vSphericalZ;\nuniform vec3 vSphericalXX;\nuniform vec3 vSphericalYY;\nuniform vec3 vSphericalZZ;\nuniform vec3 vSphericalXY;\nuniform vec3 vSphericalYZ;\nuniform vec3 vSphericalZX;\nvec3 EnvironmentIrradiance(vec3 normal)\n{\n\n\n\nvec3 result =\nvSphericalX*normal.x +\nvSphericalY*normal.y +\nvSphericalZ*normal.z +\nvSphericalXX*normal.x*normal.x +\nvSphericalYY*normal.y*normal.y +\nvSphericalZZ*normal.z*normal.z +\nvSphericalYZ*normal.y*normal.z +\nvSphericalZX*normal.z*normal.x +\nvSphericalXY*normal.x*normal.y;\nreturn result.rgb;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['legacyPbrLightFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n};\nfloat computeDistanceLightFalloff(vec3 lightOffset,float lightDistanceSquared,float range)\n{ \n#ifdef USEPHYSICALLIGHTFALLOFF\nfloat lightDistanceFalloff=1.0/((lightDistanceSquared+0.0001));\n#else\nfloat lightDistanceFalloff=max(0.,1.0-length(lightOffset)/range);\n#endif\nreturn lightDistanceFalloff;\n}\nfloat computeDirectionalLightFalloff(vec3 lightDirection,vec3 directionToLightCenterW,float lightAngle,float exponent)\n{\nfloat falloff=0.0;\n#ifdef USEPHYSICALLIGHTFALLOFF\nfloat cosHalfAngle=cos(lightAngle*0.5);\nconst float kMinusLog2ConeAngleIntensityRatio=6.64385618977; \n\n\n\n\n\nfloat concentrationKappa=kMinusLog2ConeAngleIntensityRatio/(1.0-cosHalfAngle);\n\n\nvec4 lightDirectionSpreadSG=vec4(-lightDirection*concentrationKappa,-concentrationKappa);\nfalloff=exp2(dot(vec4(directionToLightCenterW,1.0),lightDirectionSpreadSG));\n#else\nfloat cosAngle=max(0.000000000000001,dot(-lightDirection,directionToLightCenterW));\nif (cosAngle>=lightAngle)\n{\nfalloff=max(0.,pow(cosAngle,exponent));\n}\n#endif\nreturn falloff;\n}\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float rangeRadius,float roughness,float NdotV,vec3 reflectance90,out float NdotL) {\nlightingInfo result;\nvec3 lightDirection;\nfloat attenuation=1.0;\nfloat lightDistance;\n\nif (lightData.w == 0.)\n{\nvec3 lightOffset=lightData.xyz-vPositionW;\nfloat lightDistanceSquared=dot(lightOffset,lightOffset);\nattenuation=computeDistanceLightFalloff(lightOffset,lightDistanceSquared,rangeRadius);\nlightDistance=sqrt(lightDistanceSquared);\nlightDirection=normalize(lightOffset);\n}\n\nelse\n{\nlightDistance=length(-lightData.xyz);\nlightDirection=normalize(-lightData.xyz);\n}\n\nroughness=adjustRoughnessFromLightProperties(roughness,rangeRadius,lightDistance);\n\nvec3 H=normalize(viewDirectionW+lightDirection);\nNdotL=max(0.00000000001,dot(vNormal,lightDirection));\nfloat VdotH=clamp(0.00000000001,1.0,dot(viewDirectionW,H));\nfloat diffuseTerm=computeDiffuseTerm(NdotL,NdotV,VdotH,roughness);\nresult.diffuse=diffuseTerm*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nfloat NdotH=max(0.00000000001,dot(vNormal,H));\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,specularColor,reflectance90);\nresult.specular=specTerm*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float rangeRadius,float roughness,float NdotV,vec3 reflectance90,out float NdotL) {\nlightingInfo result;\nvec3 lightOffset=lightData.xyz-vPositionW;\nvec3 directionToLightCenterW=normalize(lightOffset);\n\nfloat lightDistanceSquared=dot(lightOffset,lightOffset);\nfloat attenuation=computeDistanceLightFalloff(lightOffset,lightDistanceSquared,rangeRadius);\n\nfloat directionalAttenuation=computeDirectionalLightFalloff(lightDirection.xyz,directionToLightCenterW,lightDirection.w,lightData.w);\nattenuation*=directionalAttenuation;\n\nfloat lightDistance=sqrt(lightDistanceSquared);\nroughness=adjustRoughnessFromLightProperties(roughness,rangeRadius,lightDistance);\n\nvec3 H=normalize(viewDirectionW+directionToLightCenterW);\nNdotL=max(0.00000000001,dot(vNormal,directionToLightCenterW));\nfloat VdotH=clamp(dot(viewDirectionW,H),0.00000000001,1.0);\nfloat diffuseTerm=computeDiffuseTerm(NdotL,NdotV,VdotH,roughness);\nresult.diffuse=diffuseTerm*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nfloat NdotH=max(0.00000000001,dot(vNormal,H));\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,specularColor,reflectance90);\nresult.specular=specTerm*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float roughness,float NdotV,vec3 reflectance90,out float NdotL) {\nlightingInfo result;\n\n\n\nNdotL=dot(vNormal,lightData.xyz)*0.5+0.5;\nresult.diffuse=mix(groundColor,diffuseColor,NdotL);\n#ifdef SPECULARTERM\n\nvec3 lightVectorW=normalize(lightData.xyz);\nvec3 H=normalize(viewDirectionW+lightVectorW);\nfloat NdotH=max(0.00000000001,dot(vNormal,H));\nNdotL=max(0.00000000001,NdotL);\nfloat VdotH=clamp(0.00000000001,1.0,dot(viewDirectionW,H));\nvec3 specTerm=computeSpecularTerm(NdotH,NdotL,NdotV,VdotH,roughness,specularColor,reflectance90);\nresult.specular=specTerm;\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['legacyPbrLightFunctionsCall'] = "#ifdef LIGHT{X}\n#if defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X})\n\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR90,NdotL);\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nnotShadowLevel=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nnotShadowLevel=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,0.0);\n#endif\n#else\n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nnotShadowLevel=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nnotShadowLevel=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,0.0);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nnotShadowLevel=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nnotShadowLevel=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,0.0);\n#endif\n#endif\n#endif\n#else\nnotShadowLevel=1.;\n#endif\n#if defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\nlightDiffuseContribution+=lightmapColor*notShadowLevel;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nlightSpecularContribution+=info.specular*notShadowLevel*lightmapColor;\n#endif\n#endif\n#else\nlightDiffuseContribution+=info.diffuse*notShadowLevel;\n#ifdef OVERLOADEDSHADOWVALUES\nif (NdotL<0.000000000011)\n{\nnotShadowLevel=1.;\n}\nshadowedOnlyLightDiffuseContribution*=notShadowLevel;\n#endif\n#ifdef SPECULARTERM\nlightSpecularContribution+=info.specular*notShadowLevel;\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['legacyPbrUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nuniform vec2 vAlbedoInfos;\nuniform vec3 vAmbientInfos;\nuniform vec2 vOpacityInfos;\nuniform vec2 vEmissiveInfos;\nuniform vec2 vLightmapInfos;\nuniform vec3 vReflectivityInfos;\nuniform vec2 vMicroSurfaceSamplerInfos;\nuniform vec4 vRefractionInfos;\nuniform vec2 vReflectionInfos;\nuniform vec3 vBumpInfos;\nuniform mat4 albedoMatrix;\nuniform mat4 ambientMatrix;\nuniform mat4 opacityMatrix;\nuniform mat4 emissiveMatrix;\nuniform mat4 lightmapMatrix;\nuniform mat4 reflectivityMatrix;\nuniform mat4 microSurfaceSamplerMatrix;\nuniform mat4 bumpMatrix;\nuniform vec2 vTangentSpaceParams;\nuniform mat4 refractionMatrix;\nuniform mat4 reflectionMatrix;\nuniform vec3 vReflectionColor;\nuniform vec4 vAlbedoColor;\nuniform vec4 vLightingIntensity;\nuniform vec2 vMicrosurfaceTextureLods;\nuniform vec4 vReflectivityColor;\nuniform vec3 vEmissiveColor;\nuniform vec4 opacityParts;\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\nuniform vec4 vOverloadedIntensity;\nuniform vec3 vOverloadedAmbient;\nuniform vec3 vOverloadedAlbedo;\nuniform vec3 vOverloadedReflectivity;\nuniform vec3 vOverloadedEmissive;\nuniform vec3 vOverloadedReflection;\nuniform vec3 vOverloadedMicroSurface;\nuniform vec4 vOverloadedShadowIntensity;\nuniform float pointSize;\n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['legacyPbrVertexDeclaration'] = "uniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef ALBEDO\nuniform mat4 albedoMatrix;\nuniform vec2 vAlbedoInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec3 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(REFLECTIVITY) || defined(METALLICWORKFLOW) \nuniform vec3 vReflectivityInfos;\nuniform mat4 reflectivityMatrix;\n#endif\n#ifdef MICROSURFACEMAP\nuniform vec2 vMicroSurfaceSamplerInfos;\nuniform mat4 microSurfaceSamplerMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['legacyColorCurves'] = "const vec3 HDTVRec709_RGBLuminanceCoefficients=vec3(0.2126,0.7152,0.0722);\nvec3 applyColorCurves(vec3 original) {\nvec3 result=original;\n\n\n\nfloat luma=dot(result.rgb,HDTVRec709_RGBLuminanceCoefficients);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0,0.0),vec2(1.0,1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma,luma,luma),result.rgb,colorCurve.a);\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['legacyColorCurvesDefinition'] = "uniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\nuniform vec4 vCameraColorCurveNegative;";
BABYLON.Effect.IncludesShadersStore['legacyColorGrading'] = "vec4 colorGrades(vec4 color) \n{ \n\nfloat sliceContinuous=color.z*vCameraColorGradingInfos.z;\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger; \n\nvec2 sliceUV=color.xy*vCameraColorGradingScaleOffset.xy+vCameraColorGradingScaleOffset.zw;\n\n\nsliceUV.x+=sliceInteger*vCameraColorGradingInfos.w;\nvec4 slice0Color=texture2D(cameraColorGrading2DSampler,sliceUV);\nsliceUV.x+=vCameraColorGradingInfos.w;\nvec4 slice1Color=texture2D(cameraColorGrading2DSampler,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\ncolor.rgb=mix(color.rgb,result,vCameraColorGradingInfos.x);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['legacyColorGradingDefinition'] = "uniform sampler2D cameraColorGrading2DSampler;\nuniform vec4 vCameraColorGradingInfos;\nuniform vec4 vCameraColorGradingScaleOffset;";


(function universalModuleDefinition(root, factory) {
                if (root && root["BABYLON"]) {
                    return;
                }
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if(typeof define === 'function' && define.amd)
        define([], factory);
    else if(typeof exports === 'object')
        exports["BJSMaterials"] = factory();
    else {
        root["BABYLON"] = factory();
    }
})(this, function() {
    return BABYLON;
});
