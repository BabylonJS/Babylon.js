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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var ShadowOnlyMaterialDefines = (function (_super) {
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
            _this.USERIGHTHANDEDSYSTEM = false;
            _this.rebuild();
            return _this;
        }
        return ShadowOnlyMaterialDefines;
    }(BABYLON.MaterialDefines));
    var ShadowOnlyMaterial = (function (_super) {
        __extends(ShadowOnlyMaterial, _super);
        function ShadowOnlyMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
            _this._scaledDiffuse = new BABYLON.Color3();
            return _this;
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
                    "vFogInfos", "vFogColor", "pointSize",
                    "mBones",
                    "vClipPlane"
                ];
                var samplers = [];
                var uniformBuffers = [];
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
        // Statics
        ShadowOnlyMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new ShadowOnlyMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        return ShadowOnlyMaterial;
    }(BABYLON.PushMaterial));
    __decorate([
        BABYLON.serialize()
    ], ShadowOnlyMaterial.prototype, "_worldViewProjectionMatrix", void 0);
    BABYLON.ShadowOnlyMaterial = ShadowOnlyMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.shadowOnlyMaterial.js.map

BABYLON.Effect.ShadersStore['shadowOnlyVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['shadowOnlyPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\nfloat glossiness=0.;\n#include<lightFragment>[0..1]\n\nvec4 color=vec4(0.,0.,0.,1.0-clamp(shadow,0.,1.));\n#include<fogFragment>\ngl_FragColor=color;\n}";
