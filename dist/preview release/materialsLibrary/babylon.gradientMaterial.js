(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-materials", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-materials"] = factory(require("babylonjs"));
	else
		root["MATLIB"] = factory(root["BABYLON"]);
})(window, function(__WEBPACK_EXTERNAL_MODULE_babylonjs__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./legacy/legacy-gradient.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../node_modules/webpack/buildin/global.js":
/*!*************************************************!*\
  !*** ../node_modules/webpack/buildin/global.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var GradientMaterialDefines = /** @class */ (function (_super) {
        __extends(GradientMaterialDefines, _super);
        function GradientMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.EMISSIVE = false;
            _this.CLIPPLANE = false;
            _this.CLIPPLANE2 = false;
            _this.CLIPPLANE3 = false;
            _this.CLIPPLANE4 = false;
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
            _this.scale = 1.0;
            _this.smoothness = 1.0;
            _this._disableLighting = false;
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
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false);
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
            // Disable lighting?
            defines.EMISSIVE = this._disableLighting;
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
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType",
                    "vFogInfos", "vFogColor", "pointSize",
                    "mBones",
                    "vClipPlane", "vClipPlane2", "vClipPlane3", "vClipPlane4",
                    "topColor", "bottomColor", "offset", "smoothness", "scale"
                ];
                var samplers = [];
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
            if (!subMesh.effect || !subMesh.effect.isReady()) {
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
            if (!effect) {
                return;
            }
            this._activeEffect = effect;
            // Matrices
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, effect);
            if (this._mustRebind(scene, effect)) {
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(effect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                BABYLON.MaterialHelper.BindEyePosition(effect, scene);
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
            this._activeEffect.setColor4("topColor", this.topColor, this.topColorAlpha);
            this._activeEffect.setColor4("bottomColor", this.bottomColor, this.bottomColorAlpha);
            this._activeEffect.setFloat("offset", this.offset);
            this._activeEffect.setFloat("scale", this.scale);
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
        ], GradientMaterial.prototype, "scale", void 0);
        __decorate([
            BABYLON.serialize()
        ], GradientMaterial.prototype, "smoothness", void 0);
        __decorate([
            BABYLON.serialize("disableLighting")
        ], GradientMaterial.prototype, "_disableLighting", void 0);
        __decorate([
            BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
        ], GradientMaterial.prototype, "disableLighting", void 0);
        return GradientMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.GradientMaterial = GradientMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.gradientMaterial.js.map

BABYLON.Effect.ShadersStore['gradientVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\nvarying vec3 vPosition;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex> \ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\nvPosition=position;\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['gradientPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\n\nuniform vec4 topColor;\nuniform vec4 bottomColor;\nuniform float offset;\nuniform float scale;\nuniform float smoothness;\n\nvarying vec3 vPositionW;\nvarying vec3 vPosition;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0]\n#include<__decl__lightFragment>[1]\n#include<__decl__lightFragment>[2]\n#include<__decl__lightFragment>[3]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\nfloat h=vPosition.y*scale+offset;\nfloat mysmoothness=clamp(smoothness,0.01,max(smoothness,10.));\nvec4 baseColor=mix(bottomColor,topColor,max(pow(max(h,0.0),mysmoothness),0.0));\n\nvec3 diffuseColor=baseColor.rgb;\n\nfloat alpha=baseColor.a;\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n\n#ifdef EMISSIVE\nvec3 diffuseBase=baseColor.rgb;\n#else\nvec3 diffuseBase=vec3(0.,0.,0.);\n#endif\nlightingInfo info;\nfloat shadow=1.;\nfloat glossiness=0.;\n#include<lightFragment>[0..maxSimultaneousLights]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;\n\nvec4 color=vec4(finalDiffuse,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}\n";
