(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-procedural-textures", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-procedural-textures"] = factory(require("babylonjs"));
	else
		root["PROCEDURALTEXTURES"] = factory(root["BABYLON"]);
})((typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this), function(__WEBPACK_EXTERNAL_MODULE_babylonjs_Misc_decorators__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./legacy/legacy-fire.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../../node_modules/tslib/tslib.es6.js":
/*!***********************************************************!*\
  !*** C:/Repos/Babylon.js/node_modules/tslib/tslib.es6.js ***!
  \***********************************************************/
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

/***/ "./fire/fireProceduralTexture.fragment.ts":
/*!************************************************!*\
  !*** ./fire/fireProceduralTexture.fragment.ts ***!
  \************************************************/
/*! exports provided: fireProceduralTexturePixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "fireProceduralTexturePixelShader", function() { return fireProceduralTexturePixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'fireProceduralTexturePixelShader';
var shader = "precision highp float;\nuniform float time;\nuniform vec3 c1;\nuniform vec3 c2;\nuniform vec3 c3;\nuniform vec3 c4;\nuniform vec3 c5;\nuniform vec3 c6;\nuniform vec2 speed;\nuniform float shift;\nuniform float alphaThreshold;\nvarying vec2 vUV;\nfloat rand(vec2 n) {\nreturn fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);\n}\nfloat noise(vec2 n) {\nconst vec2 d=vec2(0.0,1.0);\nvec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));\nreturn mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);\n}\nfloat fbm(vec2 n) {\nfloat total=0.0,amplitude=1.0;\nfor (int i=0; i<4; i++) {\ntotal+=noise(n)*amplitude;\nn+=n;\namplitude*=0.5;\n}\nreturn total;\n}\nvoid main() {\nvec2 p=vUV*8.0;\nfloat q=fbm(p-time*0.1);\nvec2 r=vec2(fbm(p+q+time*speed.x-p.x-p.y),fbm(p+q-time*speed.y));\nvec3 c=mix(c1,c2,fbm(p+r))+mix(c3,c4,r.x)-mix(c5,c6,r.y);\nvec3 color=c*cos(shift*vUV.y);\nfloat luminance=dot(color.rgb,vec3(0.3,0.59,0.11));\ngl_FragColor=vec4(color,luminance*alphaThreshold+(1.0-alphaThreshold));\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var fireProceduralTexturePixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./fire/fireProceduralTexture.ts":
/*!***************************************!*\
  !*** ./fire/fireProceduralTexture.ts ***!
  \***************************************/
/*! exports provided: FireProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FireProceduralTexture", function() { return FireProceduralTexture; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _fireProceduralTexture_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./fireProceduralTexture.fragment */ "./fire/fireProceduralTexture.fragment.ts");







var FireProceduralTexture = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(FireProceduralTexture, _super);
    function FireProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
        var _this = _super.call(this, name, size, "fireProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
        _this._time = 0.0;
        _this._speed = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Vector2"](0.5, 0.3);
        _this._autoGenerateTime = true;
        _this._alphaThreshold = 0.5;
        _this._fireColors = FireProceduralTexture.RedFireColors;
        _this.updateShaderUniforms();
        return _this;
    }
    FireProceduralTexture.prototype.updateShaderUniforms = function () {
        this.setFloat("time", this._time);
        this.setVector2("speed", this._speed);
        this.setColor3("c1", this._fireColors[0]);
        this.setColor3("c2", this._fireColors[1]);
        this.setColor3("c3", this._fireColors[2]);
        this.setColor3("c4", this._fireColors[3]);
        this.setColor3("c5", this._fireColors[4]);
        this.setColor3("c6", this._fireColors[5]);
        this.setFloat("alphaThreshold", this._alphaThreshold);
    };
    FireProceduralTexture.prototype.render = function (useCameraPostProcess) {
        var scene = this.getScene();
        if (this._autoGenerateTime && scene) {
            this._time += scene.getAnimationRatio() * 0.03;
            this.updateShaderUniforms();
        }
        _super.prototype.render.call(this, useCameraPostProcess);
    };
    Object.defineProperty(FireProceduralTexture, "PurpleFireColors", {
        get: function () {
            return [
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.5, 0.0, 1.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.9, 0.0, 1.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.2, 0.0, 1.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](1.0, 0.9, 1.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.1, 0.1, 1.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.9, 0.9, 1.0)
            ];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FireProceduralTexture, "GreenFireColors", {
        get: function () {
            return [
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.5, 1.0, 0.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.5, 1.0, 0.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.3, 0.4, 0.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.5, 1.0, 0.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.2, 0.0, 0.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.5, 1.0, 0.0)
            ];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FireProceduralTexture, "RedFireColors", {
        get: function () {
            return [
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.5, 0.0, 0.1),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.9, 0.0, 0.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.2, 0.0, 0.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](1.0, 0.9, 0.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.1, 0.1, 0.1),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.9, 0.9, 0.9)
            ];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FireProceduralTexture, "BlueFireColors", {
        get: function () {
            return [
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.1, 0.0, 0.5),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.0, 0.0, 0.5),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.1, 0.0, 0.2),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.0, 0.0, 1.0),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.1, 0.2, 0.3),
                new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.0, 0.2, 0.9)
            ];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FireProceduralTexture.prototype, "autoGenerateTime", {
        get: function () {
            return this._autoGenerateTime;
        },
        set: function (value) {
            this._autoGenerateTime = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FireProceduralTexture.prototype, "fireColors", {
        get: function () {
            return this._fireColors;
        },
        set: function (value) {
            this._fireColors = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FireProceduralTexture.prototype, "time", {
        get: function () {
            return this._time;
        },
        set: function (value) {
            this._time = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FireProceduralTexture.prototype, "speed", {
        get: function () {
            return this._speed;
        },
        set: function (value) {
            this._speed = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FireProceduralTexture.prototype, "alphaThreshold", {
        get: function () {
            return this._alphaThreshold;
        },
        set: function (value) {
            this._alphaThreshold = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Serializes this fire procedural texture
     * @returns a serialized fire procedural texture object
     */
    FireProceduralTexture.prototype.serialize = function () {
        var serializationObject = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Serialize(this, _super.prototype.serialize.call(this));
        serializationObject.customType = "BABYLON.FireProceduralTexture";
        serializationObject.fireColors = [];
        for (var i = 0; i < this._fireColors.length; i++) {
            serializationObject.fireColors.push(this._fireColors[i].asArray());
        }
        return serializationObject;
    };
    /**
     * Creates a Fire Procedural Texture from parsed fire procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing fire procedural texture information
     * @returns a parsed Fire Procedural Texture
     */
    FireProceduralTexture.Parse = function (parsedTexture, scene, rootUrl) {
        var texture = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new FireProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps); }, parsedTexture, scene, rootUrl);
        var colors = [];
        for (var i = 0; i < parsedTexture.fireColors.length; i++) {
            colors.push(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromArray(parsedTexture.fireColors[i]));
        }
        texture.fireColors = colors;
        return texture;
    };
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], FireProceduralTexture.prototype, "autoGenerateTime", null);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], FireProceduralTexture.prototype, "time", null);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsVector2"])()
    ], FireProceduralTexture.prototype, "speed", null);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], FireProceduralTexture.prototype, "alphaThreshold", null);
    return FireProceduralTexture;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["ProceduralTexture"]));

babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.FireProceduralTexture"] = FireProceduralTexture;


/***/ }),

/***/ "./fire/index.ts":
/*!***********************!*\
  !*** ./fire/index.ts ***!
  \***********************/
/*! exports provided: FireProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _fireProceduralTexture__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./fireProceduralTexture */ "./fire/fireProceduralTexture.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FireProceduralTexture", function() { return _fireProceduralTexture__WEBPACK_IMPORTED_MODULE_0__["FireProceduralTexture"]; });




/***/ }),

/***/ "./legacy/legacy-fire.ts":
/*!*******************************!*\
  !*** ./legacy/legacy-fire.ts ***!
  \*******************************/
/*! exports provided: FireProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _fire__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../fire */ "./fire/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FireProceduralTexture", function() { return _fire__WEBPACK_IMPORTED_MODULE_0__["FireProceduralTexture"]; });


/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in _fire__WEBPACK_IMPORTED_MODULE_0__) {
        globalObject.BABYLON[key] = _fire__WEBPACK_IMPORTED_MODULE_0__[key];
    }
}


/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "babylonjs/Misc/decorators":
/*!****************************************************************************************************!*\
  !*** external {"root":"BABYLON","commonjs":"babylonjs","commonjs2":"babylonjs","amd":"babylonjs"} ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_babylonjs_Misc_decorators__;

/***/ })

/******/ });
});
//# sourceMappingURL=babylon.fireProceduralTexture.js.map