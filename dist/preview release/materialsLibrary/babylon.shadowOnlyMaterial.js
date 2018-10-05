(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-materials", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-materials"] = factory(require("babylonjs"));
	else
		root["BABYLON"] = factory(root["BABYLON"]);
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./legacy/legacy-shadowOnly.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../Tools/Gulp/node_modules/webpack/buildin/global.js":
/*!************************************************************!*\
  !*** ../Tools/Gulp/node_modules/webpack/buildin/global.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1, eval)("this");
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "./legacy/legacy-shadowOnly.ts":
/*!*************************************!*\
  !*** ./legacy/legacy-shadowOnly.ts ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var MatLib = __webpack_require__(/*! ../src/shadowOnly/index */ "./src/shadowOnly/index.ts");
/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in MatLib) {
        globalObject.BABYLON[key] = MatLib[key];
    }
}
__export(__webpack_require__(/*! ../src/shadowOnly/index */ "./src/shadowOnly/index.ts"));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../Tools/Gulp/node_modules/webpack/buildin/global.js */ "../Tools/Gulp/node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./src/shadowOnly/index.ts":
/*!*********************************!*\
  !*** ./src/shadowOnly/index.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./shadowOnlyMaterial */ "./src/shadowOnly/shadowOnlyMaterial.ts"));


/***/ }),

/***/ "./src/shadowOnly/shadowOnly.fragment.fx":
/*!***********************************************!*\
  !*** ./src/shadowOnly/shadowOnly.fragment.fx ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform float alpha;\nuniform vec3 shadowColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\nfloat glossiness=0.;\n#include<lightFragment>[0..1]\n\nvec4 color=vec4(shadowColor,(1.0-clamp(shadow,0.,1.))*alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}"

/***/ }),

/***/ "./src/shadowOnly/shadowOnly.vertex.fx":
/*!*********************************************!*\
  !*** ./src/shadowOnly/shadowOnly.vertex.fx ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "precision highp float;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvec4 worldPos=finalWorld*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n"

/***/ }),

/***/ "./src/shadowOnly/shadowOnlyMaterial.ts":
/*!**********************************************!*\
  !*** ./src/shadowOnly/shadowOnlyMaterial.ts ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

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
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
babylonjs_1.Effect.ShadersStore["shadowOnlyPixelShader"] = __webpack_require__(/*! ./shadowOnly.fragment.fx */ "./src/shadowOnly/shadowOnly.fragment.fx");
babylonjs_1.Effect.ShadersStore["shadowOnlyVertexShader"] = __webpack_require__(/*! ./shadowOnly.vertex.fx */ "./src/shadowOnly/shadowOnly.vertex.fx");
var ShadowOnlyMaterialDefines = /** @class */ (function (_super) {
    __extends(ShadowOnlyMaterialDefines, _super);
    function ShadowOnlyMaterialDefines() {
        var _this = _super.call(this) || this;
        _this.CLIPPLANE = false;
        _this.CLIPPLANE2 = false;
        _this.CLIPPLANE3 = false;
        _this.CLIPPLANE4 = false;
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
}(babylonjs_1.MaterialDefines));
var ShadowOnlyMaterial = /** @class */ (function (_super) {
    __extends(ShadowOnlyMaterial, _super);
    function ShadowOnlyMaterial(name, scene) {
        var _this = _super.call(this, name, scene) || this;
        _this.shadowColor = BABYLON.Color3.Black();
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
        babylonjs_1.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false);
        babylonjs_1.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);
        defines._needNormals = babylonjs_1.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, 1);
        // Attribs
        babylonjs_1.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, true);
        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();
            // Fallbacks
            var fallbacks = new babylonjs_1.EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }
            babylonjs_1.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, 1);
            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }
            //Attributes
            var attribs = [babylonjs_1.VertexBuffer.PositionKind];
            if (defines.NORMAL) {
                attribs.push(babylonjs_1.VertexBuffer.NormalKind);
            }
            babylonjs_1.MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            babylonjs_1.MaterialHelper.PrepareAttributesForInstances(attribs, defines);
            var shaderName = "shadowOnly";
            var join = defines.toString();
            var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType",
                "vFogInfos", "vFogColor", "pointSize", "alpha", "shadowColor",
                "mBones",
                "vClipPlane", "vClipPlane2", "vClipPlane3", "vClipPlane4"
            ];
            var samplers = new Array();
            var uniformBuffers = new Array();
            babylonjs_1.MaterialHelper.PrepareUniformsAndSamplersList({
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
        if (!subMesh.effect || !subMesh.effect.isReady()) {
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
        if (!effect) {
            return;
        }
        this._activeEffect = effect;
        // Matrices
        this.bindOnlyWorldMatrix(world);
        this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
        // Bones
        babylonjs_1.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
        if (this._mustRebind(scene, effect)) {
            // Clip plane
            babylonjs_1.MaterialHelper.BindClipPlane(this._activeEffect, scene);
            // Point size
            if (this.pointsCloud) {
                this._activeEffect.setFloat("pointSize", this.pointSize);
            }
            this._activeEffect.setFloat("alpha", this.alpha);
            this._activeEffect.setColor3("shadowColor", this.shadowColor);
            babylonjs_1.MaterialHelper.BindEyePosition(effect, scene);
        }
        // Lights
        if (scene.lightsEnabled) {
            babylonjs_1.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, 1);
        }
        // View
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== babylonjs_1.Scene.FOGMODE_NONE) {
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }
        // Fog
        babylonjs_1.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
        this._afterBind(mesh, this._activeEffect);
    };
    ShadowOnlyMaterial.prototype.clone = function (name) {
        var _this = this;
        return babylonjs_1.SerializationHelper.Clone(function () { return new ShadowOnlyMaterial(name, _this.getScene()); }, this);
    };
    ShadowOnlyMaterial.prototype.serialize = function () {
        var serializationObject = babylonjs_1.SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.ShadowOnlyMaterial";
        return serializationObject;
    };
    ShadowOnlyMaterial.prototype.getClassName = function () {
        return "ShadowOnlyMaterial";
    };
    // Statics
    ShadowOnlyMaterial.Parse = function (source, scene, rootUrl) {
        return babylonjs_1.SerializationHelper.Parse(function () { return new ShadowOnlyMaterial(source.name, scene); }, source, scene, rootUrl);
    };
    return ShadowOnlyMaterial;
}(babylonjs_1.PushMaterial));
exports.ShadowOnlyMaterial = ShadowOnlyMaterial;


/***/ }),

/***/ "babylonjs":
/*!****************************************************************************************************!*\
  !*** external {"root":"BABYLON","commonjs":"babylonjs","commonjs2":"babylonjs","amd":"babylonjs"} ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_babylonjs__;

/***/ })

/******/ });
});
//# sourceMappingURL=babylon.shadowOnlyMaterial.js.map