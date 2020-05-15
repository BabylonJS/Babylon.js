(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-materials", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-materials"] = factory(require("babylonjs"));
	else
		root["MATERIALS"] = factory(root["BABYLON"]);
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./legacy/legacy-custom.ts");
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

/***/ "./custom/customMaterial.ts":
/*!**********************************!*\
  !*** ./custom/customMaterial.ts ***!
  \**********************************/
/*! exports provided: CustomShaderStructure, ShaderSpecialParts, CustomMaterial */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CustomShaderStructure", function() { return CustomShaderStructure; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ShaderSpecialParts", function() { return ShaderSpecialParts; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CustomMaterial", function() { return CustomMaterial; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__);




var CustomShaderStructure = /** @class */ (function () {
    function CustomShaderStructure() {
    }
    return CustomShaderStructure;
}());

var ShaderSpecialParts = /** @class */ (function () {
    function ShaderSpecialParts() {
    }
    return ShaderSpecialParts;
}());

var CustomMaterial = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(CustomMaterial, _super);
    function CustomMaterial(name, scene) {
        var _this = _super.call(this, name, scene) || this;
        _this.CustomParts = new ShaderSpecialParts();
        _this.customShaderNameResolve = _this.Builder;
        _this.FragmentShader = babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore["defaultPixelShader"];
        _this.VertexShader = babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore["defaultVertexShader"];
        return _this;
    }
    CustomMaterial.prototype.AttachAfterBind = function (mesh, effect) {
        if (this._newUniformInstances) {
            for (var el in this._newUniformInstances) {
                var ea = el.toString().split('-');
                if (ea[0] == 'vec2') {
                    effect.setVector2(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == 'vec3') {
                    effect.setVector3(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == 'vec4') {
                    effect.setVector4(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == 'mat4') {
                    effect.setMatrix(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == 'float') {
                    effect.setFloat(ea[1], this._newUniformInstances[el]);
                }
            }
        }
        if (this._newSamplerInstances) {
            for (var el in this._newSamplerInstances) {
                var ea = el.toString().split('-');
                if (ea[0] == 'sampler2D' && this._newSamplerInstances[el].isReady && this._newSamplerInstances[el].isReady()) {
                    effect.setTexture(ea[1], this._newSamplerInstances[el]);
                }
            }
        }
    };
    CustomMaterial.prototype.ReviewUniform = function (name, arr) {
        if (name == "uniform" && this._newUniforms) {
            for (var ind = 0; ind < this._newUniforms.length; ind++) {
                if (this._customUniform[ind].indexOf('sampler') == -1) {
                    arr.push(this._newUniforms[ind]);
                }
            }
        }
        if (name == "sampler" && this._newUniforms) {
            for (var ind = 0; ind < this._newUniforms.length; ind++) {
                if (this._customUniform[ind].indexOf('sampler') != -1) {
                    arr.push(this._newUniforms[ind]);
                }
            }
        }
        return arr;
    };
    CustomMaterial.prototype.Builder = function (shaderName, uniforms, uniformBuffers, samplers, defines, attributes) {
        var _this = this;
        if (attributes && this._customAttributes && this._customAttributes.length > 0) {
            attributes.push.apply(attributes, this._customAttributes);
        }
        this.ReviewUniform("uniform", uniforms);
        this.ReviewUniform("sampler", samplers);
        if (this._isCreatedShader) {
            return this._createdShaderName;
        }
        this._isCreatedShader = false;
        CustomMaterial.ShaderIndexer++;
        var name = "custom_" + CustomMaterial.ShaderIndexer;
        var fn_afterBind = this._afterBind.bind(this);
        this._afterBind = function (m, e) {
            if (!e) {
                return;
            }
            _this.AttachAfterBind(m, e);
            try {
                fn_afterBind(m, e);
            }
            catch (e) { }
        };
        babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore[name + "VertexShader"] = this.VertexShader
            .replace('#define CUSTOM_VERTEX_BEGIN', (this.CustomParts.Vertex_Begin ? this.CustomParts.Vertex_Begin : ""))
            .replace('#define CUSTOM_VERTEX_DEFINITIONS', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Vertex_Definitions ? this.CustomParts.Vertex_Definitions : ""))
            .replace('#define CUSTOM_VERTEX_MAIN_BEGIN', (this.CustomParts.Vertex_MainBegin ? this.CustomParts.Vertex_MainBegin : ""))
            .replace('#define CUSTOM_VERTEX_UPDATE_POSITION', (this.CustomParts.Vertex_Before_PositionUpdated ? this.CustomParts.Vertex_Before_PositionUpdated : ""))
            .replace('#define CUSTOM_VERTEX_UPDATE_NORMAL', (this.CustomParts.Vertex_Before_NormalUpdated ? this.CustomParts.Vertex_Before_NormalUpdated : ""))
            .replace('#define CUSTOM_VERTEX_MAIN_END', (this.CustomParts.Vertex_MainEnd ? this.CustomParts.Vertex_MainEnd : ""));
        if (this.CustomParts.Vertex_After_WorldPosComputed) {
            babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore[name + "VertexShader"] = babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore[name + "VertexShader"].replace('#define CUSTOM_VERTEX_UPDATE_WORLDPOS', this.CustomParts.Vertex_After_WorldPosComputed);
        }
        babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore[name + "PixelShader"] = this.FragmentShader
            .replace('#define CUSTOM_FRAGMENT_BEGIN', (this.CustomParts.Fragment_Begin ? this.CustomParts.Fragment_Begin : ""))
            .replace('#define CUSTOM_FRAGMENT_MAIN_BEGIN', (this.CustomParts.Fragment_MainBegin ? this.CustomParts.Fragment_MainBegin : ""))
            .replace('#define CUSTOM_FRAGMENT_DEFINITIONS', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Fragment_Definitions ? this.CustomParts.Fragment_Definitions : ""))
            .replace('#define CUSTOM_FRAGMENT_UPDATE_DIFFUSE', (this.CustomParts.Fragment_Custom_Diffuse ? this.CustomParts.Fragment_Custom_Diffuse : ""))
            .replace('#define CUSTOM_FRAGMENT_UPDATE_ALPHA', (this.CustomParts.Fragment_Custom_Alpha ? this.CustomParts.Fragment_Custom_Alpha : ""))
            .replace('#define CUSTOM_FRAGMENT_BEFORE_LIGHTS', (this.CustomParts.Fragment_Before_Lights ? this.CustomParts.Fragment_Before_Lights : ""))
            .replace('#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR', (this.CustomParts.Fragment_Before_FragColor ? this.CustomParts.Fragment_Before_FragColor : ""));
        if (this.CustomParts.Fragment_Before_Fog) {
            babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore[name + "PixelShader"] = babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore[name + "PixelShader"].replace('#define CUSTOM_FRAGMENT_BEFORE_FOG', this.CustomParts.Fragment_Before_Fog);
        }
        this._isCreatedShader = true;
        this._createdShaderName = name;
        return name;
    };
    CustomMaterial.prototype.AddUniform = function (name, kind, param) {
        if (!this._customUniform) {
            this._customUniform = new Array();
            this._newUniforms = new Array();
            this._newSamplerInstances = {};
            this._newUniformInstances = {};
        }
        if (param) {
            if (kind.indexOf("sampler") == -1) {
                this._newSamplerInstances[kind + "-" + name] = param;
            }
            else {
                this._newUniformInstances[kind + "-" + name] = param;
            }
        }
        this._customUniform.push("uniform " + kind + " " + name + ";");
        this._newUniforms.push(name);
        return this;
    };
    CustomMaterial.prototype.AddAttribute = function (name) {
        if (!this._customAttributes) {
            this._customAttributes = [];
        }
        this._customAttributes.push(name);
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
    CustomMaterial.prototype.Fragment_Before_Lights = function (shaderPart) {
        this.CustomParts.Fragment_Before_Lights = shaderPart;
        return this;
    };
    CustomMaterial.prototype.Fragment_Before_Fog = function (shaderPart) {
        this.CustomParts.Fragment_Before_Fog = shaderPart;
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
    CustomMaterial.prototype.Vertex_After_WorldPosComputed = function (shaderPart) {
        this.CustomParts.Vertex_After_WorldPosComputed = shaderPart;
        return this;
    };
    CustomMaterial.prototype.Vertex_MainEnd = function (shaderPart) {
        this.CustomParts.Vertex_MainEnd = shaderPart;
        return this;
    };
    CustomMaterial.ShaderIndexer = 1;
    return CustomMaterial;
}(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["StandardMaterial"]));

babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.CustomMaterial"] = CustomMaterial;


/***/ }),

/***/ "./custom/index.ts":
/*!*************************!*\
  !*** ./custom/index.ts ***!
  \*************************/
/*! exports provided: CustomShaderStructure, ShaderSpecialParts, CustomMaterial, ShaderAlebdoParts, PBRCustomMaterial */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _customMaterial__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./customMaterial */ "./custom/customMaterial.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CustomShaderStructure", function() { return _customMaterial__WEBPACK_IMPORTED_MODULE_0__["CustomShaderStructure"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ShaderSpecialParts", function() { return _customMaterial__WEBPACK_IMPORTED_MODULE_0__["ShaderSpecialParts"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CustomMaterial", function() { return _customMaterial__WEBPACK_IMPORTED_MODULE_0__["CustomMaterial"]; });

/* harmony import */ var _pbrCustomMaterial__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./pbrCustomMaterial */ "./custom/pbrCustomMaterial.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ShaderAlebdoParts", function() { return _pbrCustomMaterial__WEBPACK_IMPORTED_MODULE_1__["ShaderAlebdoParts"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "PBRCustomMaterial", function() { return _pbrCustomMaterial__WEBPACK_IMPORTED_MODULE_1__["PBRCustomMaterial"]; });





/***/ }),

/***/ "./custom/pbrCustomMaterial.ts":
/*!*************************************!*\
  !*** ./custom/pbrCustomMaterial.ts ***!
  \*************************************/
/*! exports provided: ShaderAlebdoParts, PBRCustomMaterial */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ShaderAlebdoParts", function() { return ShaderAlebdoParts; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PBRCustomMaterial", function() { return PBRCustomMaterial; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__);




var ShaderAlebdoParts = /** @class */ (function () {
    function ShaderAlebdoParts() {
    }
    return ShaderAlebdoParts;
}());

var PBRCustomMaterial = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(PBRCustomMaterial, _super);
    function PBRCustomMaterial(name, scene) {
        var _this = _super.call(this, name, scene) || this;
        _this.CustomParts = new ShaderAlebdoParts();
        _this.customShaderNameResolve = _this.Builder;
        _this.FragmentShader = babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore["pbrPixelShader"];
        _this.VertexShader = babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore["pbrVertexShader"];
        _this.FragmentShader = _this.FragmentShader.replace(/#include<pbrBlockAlbedoOpacity>/g, babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].IncludesShadersStore["pbrBlockAlbedoOpacity"]);
        _this.FragmentShader = _this.FragmentShader.replace(/#include<pbrBlockReflectivity>/g, babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].IncludesShadersStore["pbrBlockReflectivity"]);
        _this.FragmentShader = _this.FragmentShader.replace(/#include<pbrBlockFinalColorComposition>/g, babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].IncludesShadersStore["pbrBlockFinalColorComposition"]);
        return _this;
    }
    PBRCustomMaterial.prototype.AttachAfterBind = function (mesh, effect) {
        if (this._newUniformInstances) {
            for (var el in this._newUniformInstances) {
                var ea = el.toString().split('-');
                if (ea[0] == 'vec2') {
                    effect.setVector2(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == 'vec3') {
                    effect.setVector3(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == 'vec4') {
                    effect.setVector4(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == 'mat4') {
                    effect.setMatrix(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == 'float') {
                    effect.setFloat(ea[1], this._newUniformInstances[el]);
                }
            }
        }
        if (this._newSamplerInstances) {
            for (var el in this._newSamplerInstances) {
                var ea = el.toString().split('-');
                if (ea[0] == 'sampler2D' && this._newSamplerInstances[el].isReady && this._newSamplerInstances[el].isReady()) {
                    effect.setTexture(ea[1], this._newSamplerInstances[el]);
                }
            }
        }
    };
    PBRCustomMaterial.prototype.ReviewUniform = function (name, arr) {
        if (name == "uniform" && this._newUniforms) {
            for (var ind = 0; ind < this._newUniforms.length; ind++) {
                if (this._customUniform[ind].indexOf('sampler') == -1) {
                    arr.push(this._newUniforms[ind]);
                }
            }
        }
        if (name == "sampler" && this._newUniforms) {
            for (var ind = 0; ind < this._newUniforms.length; ind++) {
                if (this._customUniform[ind].indexOf('sampler') != -1) {
                    arr.push(this._newUniforms[ind]);
                }
            }
        }
        return arr;
    };
    PBRCustomMaterial.prototype.Builder = function (shaderName, uniforms, uniformBuffers, samplers, defines, attributes) {
        var _this = this;
        if (attributes && this._customAttributes && this._customAttributes.length > 0) {
            attributes.push.apply(attributes, this._customAttributes);
        }
        this.ReviewUniform("uniform", uniforms);
        this.ReviewUniform("sampler", samplers);
        if (this._isCreatedShader) {
            return this._createdShaderName;
        }
        this._isCreatedShader = false;
        PBRCustomMaterial.ShaderIndexer++;
        var name = "custom_" + PBRCustomMaterial.ShaderIndexer;
        var fn_afterBind = this._afterBind.bind(this);
        this._afterBind = function (m, e) {
            if (!e) {
                return;
            }
            _this.AttachAfterBind(m, e);
            try {
                fn_afterBind(m, e);
            }
            catch (e) { }
        };
        babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore[name + "VertexShader"] = this.VertexShader
            .replace('#define CUSTOM_VERTEX_BEGIN', (this.CustomParts.Vertex_Begin ? this.CustomParts.Vertex_Begin : ""))
            .replace('#define CUSTOM_VERTEX_DEFINITIONS', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Vertex_Definitions ? this.CustomParts.Vertex_Definitions : ""))
            .replace('#define CUSTOM_VERTEX_MAIN_BEGIN', (this.CustomParts.Vertex_MainBegin ? this.CustomParts.Vertex_MainBegin : ""))
            .replace('#define CUSTOM_VERTEX_UPDATE_POSITION', (this.CustomParts.Vertex_Before_PositionUpdated ? this.CustomParts.Vertex_Before_PositionUpdated : ""))
            .replace('#define CUSTOM_VERTEX_UPDATE_NORMAL', (this.CustomParts.Vertex_Before_NormalUpdated ? this.CustomParts.Vertex_Before_NormalUpdated : ""))
            .replace('#define CUSTOM_VERTEX_MAIN_END', (this.CustomParts.Vertex_MainEnd ? this.CustomParts.Vertex_MainEnd : ""));
        if (this.CustomParts.Vertex_After_WorldPosComputed) {
            babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore[name + "VertexShader"] = babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore[name + "VertexShader"].replace('#define CUSTOM_VERTEX_UPDATE_WORLDPOS', this.CustomParts.Vertex_After_WorldPosComputed);
        }
        babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore[name + "PixelShader"] = this.FragmentShader
            .replace('#define CUSTOM_FRAGMENT_BEGIN', (this.CustomParts.Fragment_Begin ? this.CustomParts.Fragment_Begin : ""))
            .replace('#define CUSTOM_FRAGMENT_MAIN_BEGIN', (this.CustomParts.Fragment_MainBegin ? this.CustomParts.Fragment_MainBegin : ""))
            .replace('#define CUSTOM_FRAGMENT_DEFINITIONS', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Fragment_Definitions ? this.CustomParts.Fragment_Definitions : ""))
            .replace('#define CUSTOM_FRAGMENT_UPDATE_ALBEDO', (this.CustomParts.Fragment_Custom_Albedo ? this.CustomParts.Fragment_Custom_Albedo : ""))
            .replace('#define CUSTOM_FRAGMENT_UPDATE_ALPHA', (this.CustomParts.Fragment_Custom_Alpha ? this.CustomParts.Fragment_Custom_Alpha : ""))
            .replace('#define CUSTOM_FRAGMENT_BEFORE_LIGHTS', (this.CustomParts.Fragment_Before_Lights ? this.CustomParts.Fragment_Before_Lights : ""))
            .replace('#define CUSTOM_FRAGMENT_UPDATE_METALLICROUGHNESS', (this.CustomParts.Fragment_Custom_MetallicRoughness ? this.CustomParts.Fragment_Custom_MetallicRoughness : ""))
            .replace('#define CUSTOM_FRAGMENT_UPDATE_MICROSURFACE', (this.CustomParts.Fragment_Custom_MicroSurface ? this.CustomParts.Fragment_Custom_MicroSurface : ""))
            .replace('#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR', (this.CustomParts.Fragment_Before_FragColor ? this.CustomParts.Fragment_Before_FragColor : ""));
        if (this.CustomParts.Fragment_Before_Fog) {
            babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore[name + "PixelShader"] = babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["Effect"].ShadersStore[name + "PixelShader"].replace('#define CUSTOM_FRAGMENT_BEFORE_FOG', this.CustomParts.Fragment_Before_Fog);
        }
        this._isCreatedShader = true;
        this._createdShaderName = name;
        return name;
    };
    PBRCustomMaterial.prototype.AddUniform = function (name, kind, param) {
        if (!this._customUniform) {
            this._customUniform = new Array();
            this._newUniforms = new Array();
            this._newSamplerInstances = {};
            this._newUniformInstances = {};
        }
        if (param) {
            if (kind.indexOf("sampler") == -1) {
                this._newSamplerInstances[kind + "-" + name] = param;
            }
            else {
                this._newUniformInstances[kind + "-" + name] = param;
            }
        }
        this._customUniform.push("uniform " + kind + " " + name + ";");
        this._newUniforms.push(name);
        return this;
    };
    PBRCustomMaterial.prototype.AddAttribute = function (name) {
        if (!this._customAttributes) {
            this._customAttributes = [];
        }
        this._customAttributes.push(name);
        return this;
    };
    PBRCustomMaterial.prototype.Fragment_Begin = function (shaderPart) {
        this.CustomParts.Fragment_Begin = shaderPart;
        return this;
    };
    PBRCustomMaterial.prototype.Fragment_Definitions = function (shaderPart) {
        this.CustomParts.Fragment_Definitions = shaderPart;
        return this;
    };
    PBRCustomMaterial.prototype.Fragment_MainBegin = function (shaderPart) {
        this.CustomParts.Fragment_MainBegin = shaderPart;
        return this;
    };
    PBRCustomMaterial.prototype.Fragment_Custom_Albedo = function (shaderPart) {
        this.CustomParts.Fragment_Custom_Albedo = shaderPart.replace("result", "surfaceAlbedo");
        return this;
    };
    PBRCustomMaterial.prototype.Fragment_Custom_Alpha = function (shaderPart) {
        this.CustomParts.Fragment_Custom_Alpha = shaderPart.replace("result", "alpha");
        return this;
    };
    PBRCustomMaterial.prototype.Fragment_Before_Lights = function (shaderPart) {
        this.CustomParts.Fragment_Before_Lights = shaderPart;
        return this;
    };
    PBRCustomMaterial.prototype.Fragment_Custom_MetallicRoughness = function (shaderPart) {
        this.CustomParts.Fragment_Custom_MetallicRoughness = shaderPart;
        return this;
    };
    PBRCustomMaterial.prototype.Fragment_Custom_MicroSurface = function (shaderPart) {
        this.CustomParts.Fragment_Custom_MicroSurface = shaderPart;
        return this;
    };
    PBRCustomMaterial.prototype.Fragment_Before_Fog = function (shaderPart) {
        this.CustomParts.Fragment_Before_Fog = shaderPart;
        return this;
    };
    PBRCustomMaterial.prototype.Fragment_Before_FragColor = function (shaderPart) {
        this.CustomParts.Fragment_Before_FragColor = shaderPart.replace("result", "color");
        return this;
    };
    PBRCustomMaterial.prototype.Vertex_Begin = function (shaderPart) {
        this.CustomParts.Vertex_Begin = shaderPart;
        return this;
    };
    PBRCustomMaterial.prototype.Vertex_Definitions = function (shaderPart) {
        this.CustomParts.Vertex_Definitions = shaderPart;
        return this;
    };
    PBRCustomMaterial.prototype.Vertex_MainBegin = function (shaderPart) {
        this.CustomParts.Vertex_MainBegin = shaderPart;
        return this;
    };
    PBRCustomMaterial.prototype.Vertex_Before_PositionUpdated = function (shaderPart) {
        this.CustomParts.Vertex_Before_PositionUpdated = shaderPart.replace("result", "positionUpdated");
        return this;
    };
    PBRCustomMaterial.prototype.Vertex_Before_NormalUpdated = function (shaderPart) {
        this.CustomParts.Vertex_Before_NormalUpdated = shaderPart.replace("result", "normalUpdated");
        return this;
    };
    PBRCustomMaterial.prototype.Vertex_After_WorldPosComputed = function (shaderPart) {
        this.CustomParts.Vertex_After_WorldPosComputed = shaderPart;
        return this;
    };
    PBRCustomMaterial.prototype.Vertex_MainEnd = function (shaderPart) {
        this.CustomParts.Vertex_MainEnd = shaderPart;
        return this;
    };
    PBRCustomMaterial.ShaderIndexer = 1;
    return PBRCustomMaterial;
}(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["PBRMaterial"]));

babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.PBRCustomMaterial"] = PBRCustomMaterial;


/***/ }),

/***/ "./legacy/legacy-custom.ts":
/*!*********************************!*\
  !*** ./legacy/legacy-custom.ts ***!
  \*********************************/
/*! exports provided: CustomShaderStructure, ShaderSpecialParts, CustomMaterial, ShaderAlebdoParts, PBRCustomMaterial */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _custom_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../custom/index */ "./custom/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CustomShaderStructure", function() { return _custom_index__WEBPACK_IMPORTED_MODULE_0__["CustomShaderStructure"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ShaderSpecialParts", function() { return _custom_index__WEBPACK_IMPORTED_MODULE_0__["ShaderSpecialParts"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CustomMaterial", function() { return _custom_index__WEBPACK_IMPORTED_MODULE_0__["CustomMaterial"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ShaderAlebdoParts", function() { return _custom_index__WEBPACK_IMPORTED_MODULE_0__["ShaderAlebdoParts"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "PBRCustomMaterial", function() { return _custom_index__WEBPACK_IMPORTED_MODULE_0__["PBRCustomMaterial"]; });


/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in _custom_index__WEBPACK_IMPORTED_MODULE_0__) {
        globalObject.BABYLON[key] = _custom_index__WEBPACK_IMPORTED_MODULE_0__[key];
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
//# sourceMappingURL=babylon.customMaterial.js.map