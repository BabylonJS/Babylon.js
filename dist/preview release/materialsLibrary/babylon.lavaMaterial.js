(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-materials", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-materials"] = factory(require("babylonjs"));
	else
		root["MATERIALS"] = factory(root["BABYLON"]);
})((typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this), function(__WEBPACK_EXTERNAL_MODULE_babylonjs_Materials_effect__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./legacy/legacy-lava.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../../node_modules/tslib/tslib.es6.js":
/*!*****************************************************************!*\
  !*** C:/Dev/Babylon/Babylon.js/node_modules/tslib/tslib.es6.js ***!
  \*****************************************************************/
/*! exports provided: __extends, __assign, __rest, __decorate, __param, __metadata, __awaiter, __generator, __exportStar, __values, __read, __spread, __spreadArrays, __await, __asyncGenerator, __asyncDelegator, __asyncValues, __makeTemplateObject, __importStar, __importDefault */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__extends", function() { return __extends; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__assign", function() { return __assign; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__rest", function() { return __rest; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__decorate", function() { return __decorate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__param", function() { return __param; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__metadata", function() { return __metadata; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__awaiter", function() { return __awaiter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__generator", function() { return __generator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__exportStar", function() { return __exportStar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__values", function() { return __values; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__read", function() { return __read; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__spread", function() { return __spread; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__spreadArrays", function() { return __spreadArrays; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__await", function() { return __await; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncGenerator", function() { return __asyncGenerator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncDelegator", function() { return __asyncDelegator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncValues", function() { return __asyncValues; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__makeTemplateObject", function() { return __makeTemplateObject; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__importStar", function() { return __importStar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__importDefault", function() { return __importDefault; });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __exportStar(m, exports) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}


/***/ }),

/***/ "../../node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "./lava/index.ts":
/*!***********************!*\
  !*** ./lava/index.ts ***!
  \***********************/
/*! exports provided: LavaMaterial */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _lavaMaterial__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lavaMaterial */ "./lava/lavaMaterial.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LavaMaterial", function() { return _lavaMaterial__WEBPACK_IMPORTED_MODULE_0__["LavaMaterial"]; });




/***/ }),

/***/ "./lava/lava.fragment.ts":
/*!*******************************!*\
  !*** ./lava/lava.fragment.ts ***!
  \*******************************/
/*! exports provided: lavaPixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "lavaPixelShader", function() { return lavaPixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Materials/effect");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);












var name = 'lavaPixelShader';
var shader = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n\nvarying vec3 vPositionW;\n\nuniform float time;\nuniform float speed;\nuniform float movingSpeed;\nuniform vec3 fogColor;\nuniform sampler2D noiseTexture;\nuniform float fogDensity;\n\nvarying float noise;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0]\n#include<__decl__lightFragment>[1]\n#include<__decl__lightFragment>[2]\n#include<__decl__lightFragment>[3]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nfloat random( vec3 scale,float seed ){\nreturn fract( sin( dot( gl_FragCoord.xyz+seed,scale ) )*43758.5453+seed ) ;\n}\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n#ifdef DIFFUSE\n\nvec4 noiseTex=texture2D( noiseTexture,vDiffuseUV );\nvec2 T1=vDiffuseUV+vec2( 1.5,-1.5 )*time*0.02;\nvec2 T2=vDiffuseUV+vec2( -0.5,2.0 )*time*0.01*speed;\nT1.x+=noiseTex.x*2.0;\nT1.y+=noiseTex.y*2.0;\nT2.x-=noiseTex.y*0.2+time*0.001*movingSpeed;\nT2.y+=noiseTex.z*0.2+time*0.002*movingSpeed;\nfloat p=texture2D( noiseTexture,T1*3.0 ).a;\nvec4 lavaColor=texture2D( diffuseSampler,T2*4.0);\nvec4 temp=lavaColor*( vec4( p,p,p,p )*2. )+( lavaColor*lavaColor-0.1 );\nbaseColor=temp;\nfloat depth=gl_FragCoord.z*4.0;\nconst float LOG2=1.442695;\nfloat fogFactor=exp2(-fogDensity*fogDensity*depth*depth*LOG2 );\nfogFactor=1.0-clamp( fogFactor,0.0,1.0 );\nbaseColor=mix( baseColor,vec4( fogColor,baseColor.w ),fogFactor );\ndiffuseColor=baseColor.rgb;\n\n\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#include<depthPrePass>\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=vec3(1.0,1.0,1.0);\n#endif\n#ifdef UNLIT\nvec3 diffuseBase=vec3(1.,1.,1.);\n#else\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\nfloat shadow=1.;\nfloat glossiness=0.;\n#include<lightFragment>[0]\n#include<lightFragment>[1]\n#include<lightFragment>[2]\n#include<lightFragment>[3]\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;\n\nvec4 color=vec4(finalDiffuse,alpha);\n#include<fogFragment>\ngl_FragColor=color;\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var lavaPixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./lava/lava.vertex.ts":
/*!*****************************!*\
  !*** ./lava/lava.vertex.ts ***!
  \*****************************/
/*! exports provided: lavaVertexShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "lavaVertexShader", function() { return lavaVertexShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Materials/effect");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);












var name = 'lavaVertexShader';
var shader = "precision highp float;\n\nuniform float time;\nuniform float lowFrequencySpeed;\n\nvarying float noise;\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n\n\n\nvec3 mod289(vec3 x)\n{\nreturn x-floor(x*(1.0/289.0))*289.0;\n}\nvec4 mod289(vec4 x)\n{\nreturn x-floor(x*(1.0/289.0))*289.0;\n}\nvec4 permute(vec4 x)\n{\nreturn mod289(((x*34.0)+1.0)*x);\n}\nvec4 taylorInvSqrt(vec4 r)\n{\nreturn 1.79284291400159-0.85373472095314*r;\n}\nvec3 fade(vec3 t) {\nreturn t*t*t*(t*(t*6.0-15.0)+10.0);\n}\n\nfloat pnoise(vec3 P,vec3 rep)\n{\nvec3 Pi0=mod(floor(P),rep);\nvec3 Pi1=mod(Pi0+vec3(1.0),rep);\nPi0=mod289(Pi0);\nPi1=mod289(Pi1);\nvec3 Pf0=fract(P);\nvec3 Pf1=Pf0-vec3(1.0);\nvec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);\nvec4 iy=vec4(Pi0.yy,Pi1.yy);\nvec4 iz0=Pi0.zzzz;\nvec4 iz1=Pi1.zzzz;\nvec4 ixy=permute(permute(ix)+iy);\nvec4 ixy0=permute(ixy+iz0);\nvec4 ixy1=permute(ixy+iz1);\nvec4 gx0=ixy0*(1.0/7.0);\nvec4 gy0=fract(floor(gx0)*(1.0/7.0))-0.5;\ngx0=fract(gx0);\nvec4 gz0=vec4(0.5)-abs(gx0)-abs(gy0);\nvec4 sz0=step(gz0,vec4(0.0));\ngx0-=sz0*(step(0.0,gx0)-0.5);\ngy0-=sz0*(step(0.0,gy0)-0.5);\nvec4 gx1=ixy1*(1.0/7.0);\nvec4 gy1=fract(floor(gx1)*(1.0/7.0))-0.5;\ngx1=fract(gx1);\nvec4 gz1=vec4(0.5)-abs(gx1)-abs(gy1);\nvec4 sz1=step(gz1,vec4(0.0));\ngx1-=sz1*(step(0.0,gx1)-0.5);\ngy1-=sz1*(step(0.0,gy1)-0.5);\nvec3 g000=vec3(gx0.x,gy0.x,gz0.x);\nvec3 g100=vec3(gx0.y,gy0.y,gz0.y);\nvec3 g010=vec3(gx0.z,gy0.z,gz0.z);\nvec3 g110=vec3(gx0.w,gy0.w,gz0.w);\nvec3 g001=vec3(gx1.x,gy1.x,gz1.x);\nvec3 g101=vec3(gx1.y,gy1.y,gz1.y);\nvec3 g011=vec3(gx1.z,gy1.z,gz1.z);\nvec3 g111=vec3(gx1.w,gy1.w,gz1.w);\nvec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));\ng000*=norm0.x;\ng010*=norm0.y;\ng100*=norm0.z;\ng110*=norm0.w;\nvec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));\ng001*=norm1.x;\ng011*=norm1.y;\ng101*=norm1.z;\ng111*=norm1.w;\nfloat n000=dot(g000,Pf0);\nfloat n100=dot(g100,vec3(Pf1.x,Pf0.yz));\nfloat n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z));\nfloat n110=dot(g110,vec3(Pf1.xy,Pf0.z));\nfloat n001=dot(g001,vec3(Pf0.xy,Pf1.z));\nfloat n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));\nfloat n011=dot(g011,vec3(Pf0.x,Pf1.yz));\nfloat n111=dot(g111,Pf1);\nvec3 fade_xyz=fade(Pf0);\nvec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);\nvec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);\nfloat n_xyz=mix(n_yz.x,n_yz.y,fade_xyz.x);\nreturn 2.2*n_xyz;\n}\n\nfloat turbulence( vec3 p ) {\nfloat w=100.0;\nfloat t=-.5;\nfor (float f=1.0 ; f<=10.0 ; f++ ){\nfloat power=pow( 2.0,f );\nt+=abs( pnoise( vec3( power*p ),vec3( 10.0,10.0,10.0 ) )/power );\n}\nreturn t;\n}\nvoid main(void) {\n#include<instancesVertex>\n#include<bonesVertex>\n#ifdef NORMAL\n\nnoise=10.0*-.10*turbulence( .5*normal+time*1.15 );\n\nfloat b=lowFrequencySpeed*5.0*pnoise( 0.05*position +vec3(time*1.025),vec3( 100.0 ) );\n\nfloat displacement =-1.5*noise+b;\n\nvec3 newPosition=position+normal*displacement;\ngl_Position=viewProjection*finalWorld*vec4( newPosition,1.0 );\nvec4 worldPos=finalWorld*vec4(newPosition,1.0);\nvPositionW=vec3(worldPos);\nvNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef DIFFUSE\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var lavaVertexShader = { name: name, shader: shader };


/***/ }),

/***/ "./lava/lavaMaterial.ts":
/*!******************************!*\
  !*** ./lava/lavaMaterial.ts ***!
  \******************************/
/*! exports provided: LavaMaterial */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LavaMaterial", function() { return LavaMaterial; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Materials/effect");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lava_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./lava.fragment */ "./lava/lava.fragment.ts");
/* harmony import */ var _lava_vertex__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./lava.vertex */ "./lava/lava.vertex.ts");













var LavaMaterialDefines = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(LavaMaterialDefines, _super);
    function LavaMaterialDefines() {
        var _this = _super.call(this) || this;
        _this.DIFFUSE = false;
        _this.CLIPPLANE = false;
        _this.CLIPPLANE2 = false;
        _this.CLIPPLANE3 = false;
        _this.CLIPPLANE4 = false;
        _this.CLIPPLANE5 = false;
        _this.CLIPPLANE6 = false;
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
        _this.SHADOWPOISSON0 = false;
        _this.SHADOWPOISSON1 = false;
        _this.SHADOWPOISSON2 = false;
        _this.SHADOWPOISSON3 = false;
        _this.SHADOWPCF0 = false;
        _this.SHADOWPCF1 = false;
        _this.SHADOWPCF2 = false;
        _this.SHADOWPCF3 = false;
        _this.SHADOWPCSS0 = false;
        _this.SHADOWPCSS1 = false;
        _this.SHADOWPCSS2 = false;
        _this.SHADOWPCSS3 = false;
        _this.NORMAL = false;
        _this.UV1 = false;
        _this.UV2 = false;
        _this.VERTEXCOLOR = false;
        _this.VERTEXALPHA = false;
        _this.NUM_BONE_INFLUENCERS = 0;
        _this.BonesPerMesh = 0;
        _this.INSTANCES = false;
        _this.UNLIT = false;
        _this.rebuild();
        return _this;
    }
    return LavaMaterialDefines;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialDefines"]));
var LavaMaterial = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(LavaMaterial, _super);
    function LavaMaterial(name, scene) {
        var _this = _super.call(this, name, scene) || this;
        _this.speed = 1;
        _this.movingSpeed = 1;
        _this.lowFrequencySpeed = 1;
        _this.fogDensity = 0.15;
        _this._lastTime = 0;
        _this.diffuseColor = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](1, 1, 1);
        _this._disableLighting = false;
        _this._unlit = false;
        _this._maxSimultaneousLights = 4;
        _this._scaledDiffuse = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"]();
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
            if (subMesh.effect && subMesh.effect._wasPreviouslyReady) {
                return true;
            }
        }
        if (!subMesh._materialDefines) {
            subMesh._materialDefines = new LavaMaterialDefines();
        }
        var defines = subMesh._materialDefines;
        var scene = this.getScene();
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }
        var engine = scene.getEngine();
        // Textures
        if (defines._areTexturesDirty) {
            defines._needUVs = false;
            if (scene.texturesEnabled) {
                if (this._diffuseTexture && babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialFlags"].DiffuseTextureEnabled) {
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
        babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);
        // Lights
        defines._needNormals = true;
        babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
        // Values that need to be evaluated on every frame
        babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false);
        // Attribs
        babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].PrepareDefinesForAttributes(mesh, defines, true, true);
        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();
            // Fallbacks
            var fallbacks = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["EffectFallbacks"]();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }
            babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].HandleFallbacksForShadows(defines, fallbacks);
            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }
            //Attributes
            var attribs = [babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].PositionKind];
            if (defines.NORMAL) {
                attribs.push(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].NormalKind);
            }
            if (defines.UV1) {
                attribs.push(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UVKind);
            }
            if (defines.UV2) {
                attribs.push(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UV2Kind);
            }
            if (defines.VERTEXCOLOR) {
                attribs.push(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].ColorKind);
            }
            babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].PrepareAttributesForInstances(attribs, defines);
            // Legacy browser patch
            var shaderName = "lava";
            var join = defines.toString();
            var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                "vFogInfos", "vFogColor", "pointSize",
                "vDiffuseInfos",
                "mBones",
                "vClipPlane", "vClipPlane2", "vClipPlane3", "vClipPlane4", "vClipPlane5", "vClipPlane6", "diffuseMatrix",
                "time", "speed", "movingSpeed",
                "fogColor", "fogDensity", "lowFrequencySpeed"
            ];
            var samplers = ["diffuseSampler",
                "noiseTexture"
            ];
            var uniformBuffers = new Array();
            babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].PrepareUniformsAndSamplersList({
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
        defines._renderId = scene.getRenderId();
        subMesh.effect._wasPreviouslyReady = true;
        return true;
    };
    LavaMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
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
        defines.UNLIT = this._unlit;
        // Matrices
        this.bindOnlyWorldMatrix(world);
        this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
        // Bones
        babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].BindBonesParameters(mesh, this._activeEffect);
        if (this._mustRebind(scene, effect)) {
            // Textures
            if (this.diffuseTexture && babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialFlags"].DiffuseTextureEnabled) {
                this._activeEffect.setTexture("diffuseSampler", this.diffuseTexture);
                this._activeEffect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                this._activeEffect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
            }
            if (this.noiseTexture) {
                this._activeEffect.setTexture("noiseTexture", this.noiseTexture);
            }
            // Clip plane
            babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].BindClipPlane(this._activeEffect, scene);
            // Point size
            if (this.pointsCloud) {
                this._activeEffect.setFloat("pointSize", this.pointSize);
            }
            babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].BindEyePosition(effect, scene);
        }
        this._activeEffect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);
        if (scene.lightsEnabled && !this.disableLighting) {
            babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].BindLights(scene, mesh, this._activeEffect, defines);
        }
        // View
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Scene"].FOGMODE_NONE) {
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }
        // Fog
        babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].BindFogParameters(scene, mesh, this._activeEffect);
        this._lastTime += scene.getEngine().getDeltaTime();
        this._activeEffect.setFloat("time", this._lastTime * this.speed / 1000);
        if (!this.fogColor) {
            this.fogColor = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"].Black();
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
        return babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Clone(function () { return new LavaMaterial(name, _this.getScene()); }, this);
    };
    LavaMaterial.prototype.serialize = function () {
        var serializationObject = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Serialize(this);
        serializationObject.customType = "BABYLON.LavaMaterial";
        return serializationObject;
    };
    LavaMaterial.prototype.getClassName = function () {
        return "LavaMaterial";
    };
    // Statics
    LavaMaterial.Parse = function (source, scene, rootUrl) {
        return babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new LavaMaterial(source.name, scene); }, source, scene, rootUrl);
    };
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsTexture"])("diffuseTexture")
    ], LavaMaterial.prototype, "_diffuseTexture", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["expandToProperty"])("_markAllSubMeshesAsTexturesDirty")
    ], LavaMaterial.prototype, "diffuseTexture", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsTexture"])()
    ], LavaMaterial.prototype, "noiseTexture", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsColor3"])()
    ], LavaMaterial.prototype, "fogColor", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], LavaMaterial.prototype, "speed", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], LavaMaterial.prototype, "movingSpeed", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], LavaMaterial.prototype, "lowFrequencySpeed", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], LavaMaterial.prototype, "fogDensity", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsColor3"])()
    ], LavaMaterial.prototype, "diffuseColor", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])("disableLighting")
    ], LavaMaterial.prototype, "_disableLighting", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["expandToProperty"])("_markAllSubMeshesAsLightsDirty")
    ], LavaMaterial.prototype, "disableLighting", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])("unlit")
    ], LavaMaterial.prototype, "_unlit", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["expandToProperty"])("_markAllSubMeshesAsLightsDirty")
    ], LavaMaterial.prototype, "unlit", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])("maxSimultaneousLights")
    ], LavaMaterial.prototype, "_maxSimultaneousLights", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["expandToProperty"])("_markAllSubMeshesAsLightsDirty")
    ], LavaMaterial.prototype, "maxSimultaneousLights", void 0);
    return LavaMaterial;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["PushMaterial"]));

babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.LavaMaterial"] = LavaMaterial;


/***/ }),

/***/ "./legacy/legacy-lava.ts":
/*!*******************************!*\
  !*** ./legacy/legacy-lava.ts ***!
  \*******************************/
/*! exports provided: LavaMaterial */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _lava_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lava/index */ "./lava/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LavaMaterial", function() { return _lava_index__WEBPACK_IMPORTED_MODULE_0__["LavaMaterial"]; });


/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in _lava_index__WEBPACK_IMPORTED_MODULE_0__) {
        globalObject.BABYLON[key] = _lava_index__WEBPACK_IMPORTED_MODULE_0__[key];
    }
}


/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "babylonjs/Materials/effect":
/*!****************************************************************************************************!*\
  !*** external {"root":"BABYLON","commonjs":"babylonjs","commonjs2":"babylonjs","amd":"babylonjs"} ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_babylonjs_Materials_effect__;

/***/ })

/******/ });
});
//# sourceMappingURL=babylon.lavaMaterial.js.map