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
/******/ 	return __webpack_require__(__webpack_require__.s = "./legacy/legacy.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../../node_modules/tslib/tslib.es6.js":
/*!***********************************************************!*\
  !*** D:/Repos/Babylon.js/node_modules/tslib/tslib.es6.js ***!
  \***********************************************************/
/*! exports provided: __extends, __assign, __rest, __decorate, __param, __metadata, __awaiter, __generator, __exportStar, __values, __read, __spread, __await, __asyncGenerator, __asyncDelegator, __asyncValues, __makeTemplateObject, __importStar, __importDefault */
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
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
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

/***/ "./brick/brickProceduralTexture.fragment.ts":
/*!**************************************************!*\
  !*** ./brick/brickProceduralTexture.fragment.ts ***!
  \**************************************************/
/*! exports provided: brickProceduralTexturePixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "brickProceduralTexturePixelShader", function() { return brickProceduralTexturePixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'brickProceduralTexturePixelShader';
var shader = "precision highp float;\nvarying vec2 vPosition;\nvarying vec2 vUV;\nuniform float numberOfBricksHeight;\nuniform float numberOfBricksWidth;\nuniform vec3 brickColor;\nuniform vec3 jointColor;\nfloat rand(vec2 n) {\nreturn fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);\n}\nfloat noise(vec2 n) {\nconst vec2 d=vec2(0.0,1.0);\nvec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));\nreturn mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);\n}\nfloat fbm(vec2 n) {\nfloat total=0.0,amplitude=1.0;\nfor (int i=0; i<4; i++) {\ntotal+=noise(n)*amplitude;\nn+=n;\namplitude*=0.5;\n}\nreturn total;\n}\nfloat roundF(float number){\nreturn sign(number)*floor(abs(number)+0.5);\n}\nvoid main(void)\n{\nfloat brickW=1.0/numberOfBricksWidth;\nfloat brickH=1.0/numberOfBricksHeight;\nfloat jointWPercentage=0.01;\nfloat jointHPercentage=0.05;\nvec3 color=brickColor;\nfloat yi=vUV.y/brickH;\nfloat nyi=roundF(yi);\nfloat xi=vUV.x/brickW;\nif (mod(floor(yi),2.0) == 0.0){\nxi=xi-0.5;\n}\nfloat nxi=roundF(xi);\nvec2 brickvUV=vec2((xi-floor(xi))/brickH,(yi-floor(yi))/brickW);\nif (yi<nyi+jointHPercentage && yi>nyi-jointHPercentage){\ncolor=mix(jointColor,vec3(0.37,0.25,0.25),(yi-nyi)/jointHPercentage+0.2);\n}\nelse if (xi<nxi+jointWPercentage && xi>nxi-jointWPercentage){\ncolor=mix(jointColor,vec3(0.44,0.44,0.44),(xi-nxi)/jointWPercentage+0.2);\n}\nelse {\nfloat brickColorSwitch=mod(floor(yi)+floor(xi),3.0);\nif (brickColorSwitch == 0.0)\ncolor=mix(color,vec3(0.33,0.33,0.33),0.3);\nelse if (brickColorSwitch == 2.0)\ncolor=mix(color,vec3(0.11,0.11,0.11),0.3);\n}\ngl_FragColor=vec4(color,1.0);\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var brickProceduralTexturePixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./brick/brickProceduralTexture.ts":
/*!*****************************************!*\
  !*** ./brick/brickProceduralTexture.ts ***!
  \*****************************************/
/*! exports provided: BrickProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BrickProceduralTexture", function() { return BrickProceduralTexture; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _brickProceduralTexture_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./brickProceduralTexture.fragment */ "./brick/brickProceduralTexture.fragment.ts");






var BrickProceduralTexture = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](BrickProceduralTexture, _super);
    function BrickProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
        var _this = _super.call(this, name, size, "brickProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
        _this._numberOfBricksHeight = 15;
        _this._numberOfBricksWidth = 5;
        _this._jointColor = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.72, 0.72, 0.72);
        _this._brickColor = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.77, 0.47, 0.40);
        _this.updateShaderUniforms();
        return _this;
    }
    BrickProceduralTexture.prototype.updateShaderUniforms = function () {
        this.setFloat("numberOfBricksHeight", this._numberOfBricksHeight);
        this.setFloat("numberOfBricksWidth", this._numberOfBricksWidth);
        this.setColor3("brickColor", this._brickColor);
        this.setColor3("jointColor", this._jointColor);
    };
    Object.defineProperty(BrickProceduralTexture.prototype, "numberOfBricksHeight", {
        get: function () {
            return this._numberOfBricksHeight;
        },
        set: function (value) {
            this._numberOfBricksHeight = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BrickProceduralTexture.prototype, "numberOfBricksWidth", {
        get: function () {
            return this._numberOfBricksWidth;
        },
        set: function (value) {
            this._numberOfBricksWidth = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BrickProceduralTexture.prototype, "jointColor", {
        get: function () {
            return this._jointColor;
        },
        set: function (value) {
            this._jointColor = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BrickProceduralTexture.prototype, "brickColor", {
        get: function () {
            return this._brickColor;
        },
        set: function (value) {
            this._brickColor = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Serializes this brick procedural texture
     * @returns a serialized brick procedural texture object
     */
    BrickProceduralTexture.prototype.serialize = function () {
        var serializationObject = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Serialize(this, _super.prototype.serialize.call(this));
        serializationObject.customType = "BABYLON.BrickProceduralTexture";
        return serializationObject;
    };
    /**
     * Creates a Brick Procedural Texture from parsed brick procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing brick procedural texture information
     * @returns a parsed Brick Procedural Texture
     */
    BrickProceduralTexture.Parse = function (parsedTexture, scene, rootUrl) {
        var texture = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new BrickProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps); }, parsedTexture, scene, rootUrl);
        return texture;
    };
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], BrickProceduralTexture.prototype, "numberOfBricksHeight", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], BrickProceduralTexture.prototype, "numberOfBricksWidth", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsColor3"])()
    ], BrickProceduralTexture.prototype, "jointColor", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsColor3"])()
    ], BrickProceduralTexture.prototype, "brickColor", null);
    return BrickProceduralTexture;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["ProceduralTexture"]));

babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.BrickProceduralTexture"] = BrickProceduralTexture;


/***/ }),

/***/ "./brick/index.ts":
/*!************************!*\
  !*** ./brick/index.ts ***!
  \************************/
/*! exports provided: BrickProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _brickProceduralTexture__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./brickProceduralTexture */ "./brick/brickProceduralTexture.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BrickProceduralTexture", function() { return _brickProceduralTexture__WEBPACK_IMPORTED_MODULE_0__["BrickProceduralTexture"]; });




/***/ }),

/***/ "./cloud/cloudProceduralTexture.fragment.ts":
/*!**************************************************!*\
  !*** ./cloud/cloudProceduralTexture.fragment.ts ***!
  \**************************************************/
/*! exports provided: cloudProceduralTexturePixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "cloudProceduralTexturePixelShader", function() { return cloudProceduralTexturePixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'cloudProceduralTexturePixelShader';
var shader = "precision highp float;\nvarying vec2 vUV;\nuniform vec4 skyColor;\nuniform vec4 cloudColor;\nfloat rand(vec2 n) {\nreturn fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);\n}\nfloat noise(vec2 n) {\nconst vec2 d=vec2(0.0,1.0);\nvec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));\nreturn mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);\n}\nfloat fbm(vec2 n) {\nfloat total=0.0,amplitude=1.0;\nfor (int i=0; i<4; i++) {\ntotal+=noise(n)*amplitude;\nn+=n;\namplitude*=0.5;\n}\nreturn total;\n}\nvoid main() {\nvec2 p=vUV*12.0;\nvec4 c=mix(skyColor,cloudColor,fbm(p));\ngl_FragColor=c;\n}\n";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var cloudProceduralTexturePixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./cloud/cloudProceduralTexture.ts":
/*!*****************************************!*\
  !*** ./cloud/cloudProceduralTexture.ts ***!
  \*****************************************/
/*! exports provided: CloudProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CloudProceduralTexture", function() { return CloudProceduralTexture; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _cloudProceduralTexture_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./cloudProceduralTexture.fragment */ "./cloud/cloudProceduralTexture.fragment.ts");






var CloudProceduralTexture = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](CloudProceduralTexture, _super);
    function CloudProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
        var _this = _super.call(this, name, size, "cloudProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
        _this._skyColor = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color4"](0.15, 0.68, 1.0, 1.0);
        _this._cloudColor = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color4"](1, 1, 1, 1.0);
        _this.updateShaderUniforms();
        return _this;
    }
    CloudProceduralTexture.prototype.updateShaderUniforms = function () {
        this.setColor4("skyColor", this._skyColor);
        this.setColor4("cloudColor", this._cloudColor);
    };
    Object.defineProperty(CloudProceduralTexture.prototype, "skyColor", {
        get: function () {
            return this._skyColor;
        },
        set: function (value) {
            this._skyColor = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CloudProceduralTexture.prototype, "cloudColor", {
        get: function () {
            return this._cloudColor;
        },
        set: function (value) {
            this._cloudColor = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Serializes this cloud procedural texture
     * @returns a serialized cloud procedural texture object
     */
    CloudProceduralTexture.prototype.serialize = function () {
        var serializationObject = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Serialize(this, _super.prototype.serialize.call(this));
        serializationObject.customType = "BABYLON.CloudProceduralTexture";
        return serializationObject;
    };
    /**
     * Creates a Cloud Procedural Texture from parsed cloud procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing cloud procedural texture information
     * @returns a parsed Cloud Procedural Texture
     */
    CloudProceduralTexture.Parse = function (parsedTexture, scene, rootUrl) {
        var texture = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new CloudProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps); }, parsedTexture, scene, rootUrl);
        return texture;
    };
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsColor4"])()
    ], CloudProceduralTexture.prototype, "skyColor", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsColor4"])()
    ], CloudProceduralTexture.prototype, "cloudColor", null);
    return CloudProceduralTexture;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["ProceduralTexture"]));

babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.CloudProceduralTexture"] = CloudProceduralTexture;


/***/ }),

/***/ "./cloud/index.ts":
/*!************************!*\
  !*** ./cloud/index.ts ***!
  \************************/
/*! exports provided: CloudProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _cloudProceduralTexture__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./cloudProceduralTexture */ "./cloud/cloudProceduralTexture.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CloudProceduralTexture", function() { return _cloudProceduralTexture__WEBPACK_IMPORTED_MODULE_0__["CloudProceduralTexture"]; });




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
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](FireProceduralTexture, _super);
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
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], FireProceduralTexture.prototype, "autoGenerateTime", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], FireProceduralTexture.prototype, "time", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsVector2"])()
    ], FireProceduralTexture.prototype, "speed", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
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

/***/ "./grass/grassProceduralTexture.fragment.ts":
/*!**************************************************!*\
  !*** ./grass/grassProceduralTexture.fragment.ts ***!
  \**************************************************/
/*! exports provided: grassProceduralTexturePixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "grassProceduralTexturePixelShader", function() { return grassProceduralTexturePixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'grassProceduralTexturePixelShader';
var shader = "precision highp float;\nvarying vec2 vPosition;\nvarying vec2 vUV;\nuniform vec3 herb1Color;\nuniform vec3 herb2Color;\nuniform vec3 herb3Color;\nuniform vec3 groundColor;\nfloat rand(vec2 n) {\nreturn fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);\n}\nfloat noise(vec2 n) {\nconst vec2 d=vec2(0.0,1.0);\nvec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));\nreturn mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);\n}\nfloat fbm(vec2 n) {\nfloat total=0.0,amplitude=1.0;\nfor (int i=0; i<4; i++) {\ntotal+=noise(n)*amplitude;\nn+=n;\namplitude*=0.5;\n}\nreturn total;\n}\nvoid main(void) {\nvec3 color=mix(groundColor,herb1Color,rand(gl_FragCoord.xy*4.0));\ncolor=mix(color,herb2Color,rand(gl_FragCoord.xy*8.0));\ncolor=mix(color,herb3Color,rand(gl_FragCoord.xy));\ncolor=mix(color,herb1Color,fbm(gl_FragCoord.xy*16.0));\ngl_FragColor=vec4(color,1.0);\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var grassProceduralTexturePixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./grass/grassProceduralTexture.ts":
/*!*****************************************!*\
  !*** ./grass/grassProceduralTexture.ts ***!
  \*****************************************/
/*! exports provided: GrassProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GrassProceduralTexture", function() { return GrassProceduralTexture; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _grassProceduralTexture_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./grassProceduralTexture.fragment */ "./grass/grassProceduralTexture.fragment.ts");






var GrassProceduralTexture = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](GrassProceduralTexture, _super);
    function GrassProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
        var _this = _super.call(this, name, size, "grassProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
        _this._groundColor = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](1, 1, 1);
        _this._grassColors = [
            new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.29, 0.38, 0.02),
            new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.36, 0.49, 0.09),
            new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.51, 0.6, 0.28)
        ];
        _this.updateShaderUniforms();
        return _this;
    }
    GrassProceduralTexture.prototype.updateShaderUniforms = function () {
        this.setColor3("herb1Color", this._grassColors[0]);
        this.setColor3("herb2Color", this._grassColors[1]);
        this.setColor3("herb3Color", this._grassColors[2]);
        this.setColor3("groundColor", this._groundColor);
    };
    Object.defineProperty(GrassProceduralTexture.prototype, "grassColors", {
        get: function () {
            return this._grassColors;
        },
        set: function (value) {
            this._grassColors = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GrassProceduralTexture.prototype, "groundColor", {
        get: function () {
            return this._groundColor;
        },
        set: function (value) {
            this._groundColor = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Serializes this grass procedural texture
     * @returns a serialized grass procedural texture object
     */
    GrassProceduralTexture.prototype.serialize = function () {
        var serializationObject = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Serialize(this, _super.prototype.serialize.call(this));
        serializationObject.customType = "BABYLON.GrassProceduralTexture";
        serializationObject.grassColors = [];
        for (var i = 0; i < this._grassColors.length; i++) {
            serializationObject.grassColors.push(this._grassColors[i].asArray());
        }
        return serializationObject;
    };
    /**
     * Creates a Grass Procedural Texture from parsed grass procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing grass procedural texture information
     * @returns a parsed Grass Procedural Texture
     */
    GrassProceduralTexture.Parse = function (parsedTexture, scene, rootUrl) {
        var texture = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new GrassProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps); }, parsedTexture, scene, rootUrl);
        var colors = [];
        for (var i = 0; i < parsedTexture.grassColors.length; i++) {
            colors.push(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromArray(parsedTexture.grassColors[i]));
        }
        texture.grassColors = colors;
        return texture;
    };
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsColor3"])()
    ], GrassProceduralTexture.prototype, "groundColor", null);
    return GrassProceduralTexture;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["ProceduralTexture"]));

babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GrassProceduralTexture"] = GrassProceduralTexture;


/***/ }),

/***/ "./grass/index.ts":
/*!************************!*\
  !*** ./grass/index.ts ***!
  \************************/
/*! exports provided: GrassProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _grassProceduralTexture__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./grassProceduralTexture */ "./grass/grassProceduralTexture.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GrassProceduralTexture", function() { return _grassProceduralTexture__WEBPACK_IMPORTED_MODULE_0__["GrassProceduralTexture"]; });




/***/ }),

/***/ "./index.ts":
/*!******************!*\
  !*** ./index.ts ***!
  \******************/
/*! exports provided: BrickProceduralTexture, CloudProceduralTexture, FireProceduralTexture, GrassProceduralTexture, MarbleProceduralTexture, NormalMapProceduralTexture, PerlinNoiseProceduralTexture, RoadProceduralTexture, StarfieldProceduralTexture, WoodProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _brick__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./brick */ "./brick/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BrickProceduralTexture", function() { return _brick__WEBPACK_IMPORTED_MODULE_0__["BrickProceduralTexture"]; });

/* harmony import */ var _cloud__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./cloud */ "./cloud/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CloudProceduralTexture", function() { return _cloud__WEBPACK_IMPORTED_MODULE_1__["CloudProceduralTexture"]; });

/* harmony import */ var _fire__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./fire */ "./fire/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FireProceduralTexture", function() { return _fire__WEBPACK_IMPORTED_MODULE_2__["FireProceduralTexture"]; });

/* harmony import */ var _grass__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./grass */ "./grass/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GrassProceduralTexture", function() { return _grass__WEBPACK_IMPORTED_MODULE_3__["GrassProceduralTexture"]; });

/* harmony import */ var _marble__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./marble */ "./marble/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MarbleProceduralTexture", function() { return _marble__WEBPACK_IMPORTED_MODULE_4__["MarbleProceduralTexture"]; });

/* harmony import */ var _normalMap__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./normalMap */ "./normalMap/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "NormalMapProceduralTexture", function() { return _normalMap__WEBPACK_IMPORTED_MODULE_5__["NormalMapProceduralTexture"]; });

/* harmony import */ var _perlinNoise__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./perlinNoise */ "./perlinNoise/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "PerlinNoiseProceduralTexture", function() { return _perlinNoise__WEBPACK_IMPORTED_MODULE_6__["PerlinNoiseProceduralTexture"]; });

/* harmony import */ var _road__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./road */ "./road/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RoadProceduralTexture", function() { return _road__WEBPACK_IMPORTED_MODULE_7__["RoadProceduralTexture"]; });

/* harmony import */ var _starfield__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./starfield */ "./starfield/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StarfieldProceduralTexture", function() { return _starfield__WEBPACK_IMPORTED_MODULE_8__["StarfieldProceduralTexture"]; });

/* harmony import */ var _wood__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./wood */ "./wood/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "WoodProceduralTexture", function() { return _wood__WEBPACK_IMPORTED_MODULE_9__["WoodProceduralTexture"]; });













/***/ }),

/***/ "./legacy/legacy.ts":
/*!**************************!*\
  !*** ./legacy/legacy.ts ***!
  \**************************/
/*! exports provided: BrickProceduralTexture, CloudProceduralTexture, FireProceduralTexture, GrassProceduralTexture, MarbleProceduralTexture, NormalMapProceduralTexture, PerlinNoiseProceduralTexture, RoadProceduralTexture, StarfieldProceduralTexture, WoodProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../index */ "./index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BrickProceduralTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["BrickProceduralTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CloudProceduralTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["CloudProceduralTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FireProceduralTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["FireProceduralTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GrassProceduralTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["GrassProceduralTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MarbleProceduralTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["MarbleProceduralTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "NormalMapProceduralTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["NormalMapProceduralTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "PerlinNoiseProceduralTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["PerlinNoiseProceduralTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RoadProceduralTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["RoadProceduralTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StarfieldProceduralTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["StarfieldProceduralTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "WoodProceduralTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["WoodProceduralTexture"]; });


/**
 * Legacy support, defining window.BABYLON.GridMaterial... (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    globalObject.BABYLON = globalObject.BABYLON || {};
    for (var mat in _index__WEBPACK_IMPORTED_MODULE_0__) {
        globalObject.BABYLON[mat] = _index__WEBPACK_IMPORTED_MODULE_0__[mat];
    }
}


/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./marble/index.ts":
/*!*************************!*\
  !*** ./marble/index.ts ***!
  \*************************/
/*! exports provided: MarbleProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _marbleProceduralTexture__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./marbleProceduralTexture */ "./marble/marbleProceduralTexture.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MarbleProceduralTexture", function() { return _marbleProceduralTexture__WEBPACK_IMPORTED_MODULE_0__["MarbleProceduralTexture"]; });




/***/ }),

/***/ "./marble/marbleProceduralTexture.fragment.ts":
/*!****************************************************!*\
  !*** ./marble/marbleProceduralTexture.fragment.ts ***!
  \****************************************************/
/*! exports provided: marbleProceduralTexturePixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "marbleProceduralTexturePixelShader", function() { return marbleProceduralTexturePixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'marbleProceduralTexturePixelShader';
var shader = "precision highp float;\nvarying vec2 vPosition;\nvarying vec2 vUV;\nuniform float numberOfTilesHeight;\nuniform float numberOfTilesWidth;\nuniform float amplitude;\nuniform vec3 marbleColor;\nuniform vec3 jointColor;\nconst vec3 tileSize=vec3(1.1,1.0,1.1);\nconst vec3 tilePct=vec3(0.98,1.0,0.98);\nfloat rand(vec2 n) {\nreturn fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);\n}\nfloat noise(vec2 n) {\nconst vec2 d=vec2(0.0,1.0);\nvec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));\nreturn mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);\n}\nfloat turbulence(vec2 P)\n{\nfloat val=0.0;\nfloat freq=1.0;\nfor (int i=0; i<4; i++)\n{\nval+=abs(noise(P*freq)/freq);\nfreq*=2.07;\n}\nreturn val;\n}\nfloat roundF(float number){\nreturn sign(number)*floor(abs(number)+0.5);\n}\nvec3 marble_color(float x)\n{\nvec3 col;\nx=0.5*(x+1.);\nx=sqrt(x);\nx=sqrt(x);\nx=sqrt(x);\ncol=vec3(.2+.75*x);\ncol.b*=0.95;\nreturn col;\n}\nvoid main()\n{\nfloat brickW=1.0/numberOfTilesWidth;\nfloat brickH=1.0/numberOfTilesHeight;\nfloat jointWPercentage=0.01;\nfloat jointHPercentage=0.01;\nvec3 color=marbleColor;\nfloat yi=vUV.y/brickH;\nfloat nyi=roundF(yi);\nfloat xi=vUV.x/brickW;\nif (mod(floor(yi),2.0) == 0.0){\nxi=xi-0.5;\n}\nfloat nxi=roundF(xi);\nvec2 brickvUV=vec2((xi-floor(xi))/brickH,(yi-floor(yi))/brickW);\nif (yi<nyi+jointHPercentage && yi>nyi-jointHPercentage){\ncolor=mix(jointColor,vec3(0.37,0.25,0.25),(yi-nyi)/jointHPercentage+0.2);\n}\nelse if (xi<nxi+jointWPercentage && xi>nxi-jointWPercentage){\ncolor=mix(jointColor,vec3(0.44,0.44,0.44),(xi-nxi)/jointWPercentage+0.2);\n}\nelse {\nfloat t=6.28*brickvUV.x/(tileSize.x+noise(vec2(vUV)*6.0));\nt+=amplitude*turbulence(brickvUV.xy);\nt=sin(t);\ncolor=marble_color(t);\n}\ngl_FragColor=vec4(color,0.0);\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var marbleProceduralTexturePixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./marble/marbleProceduralTexture.ts":
/*!*******************************************!*\
  !*** ./marble/marbleProceduralTexture.ts ***!
  \*******************************************/
/*! exports provided: MarbleProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MarbleProceduralTexture", function() { return MarbleProceduralTexture; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _marbleProceduralTexture_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./marbleProceduralTexture.fragment */ "./marble/marbleProceduralTexture.fragment.ts");






var MarbleProceduralTexture = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](MarbleProceduralTexture, _super);
    function MarbleProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
        var _this = _super.call(this, name, size, "marbleProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
        _this._numberOfTilesHeight = 3;
        _this._numberOfTilesWidth = 3;
        _this._amplitude = 9.0;
        _this._jointColor = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.72, 0.72, 0.72);
        _this.updateShaderUniforms();
        return _this;
    }
    MarbleProceduralTexture.prototype.updateShaderUniforms = function () {
        this.setFloat("numberOfTilesHeight", this._numberOfTilesHeight);
        this.setFloat("numberOfTilesWidth", this._numberOfTilesWidth);
        this.setFloat("amplitude", this._amplitude);
        this.setColor3("jointColor", this._jointColor);
    };
    Object.defineProperty(MarbleProceduralTexture.prototype, "numberOfTilesHeight", {
        get: function () {
            return this._numberOfTilesHeight;
        },
        set: function (value) {
            this._numberOfTilesHeight = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MarbleProceduralTexture.prototype, "amplitude", {
        get: function () {
            return this._amplitude;
        },
        set: function (value) {
            this._amplitude = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MarbleProceduralTexture.prototype, "numberOfTilesWidth", {
        get: function () {
            return this._numberOfTilesWidth;
        },
        set: function (value) {
            this._numberOfTilesWidth = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MarbleProceduralTexture.prototype, "jointColor", {
        get: function () {
            return this._jointColor;
        },
        set: function (value) {
            this._jointColor = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Serializes this marble procedural texture
     * @returns a serialized marble procedural texture object
     */
    MarbleProceduralTexture.prototype.serialize = function () {
        var serializationObject = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Serialize(this, _super.prototype.serialize.call(this));
        serializationObject.customType = "BABYLON.MarbleProceduralTexture";
        return serializationObject;
    };
    /**
     * Creates a Marble Procedural Texture from parsed marble procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing marble procedural texture information
     * @returns a parsed Marble Procedural Texture
     */
    MarbleProceduralTexture.Parse = function (parsedTexture, scene, rootUrl) {
        var texture = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new MarbleProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps); }, parsedTexture, scene, rootUrl);
        return texture;
    };
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], MarbleProceduralTexture.prototype, "numberOfTilesHeight", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], MarbleProceduralTexture.prototype, "amplitude", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], MarbleProceduralTexture.prototype, "numberOfTilesWidth", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], MarbleProceduralTexture.prototype, "jointColor", null);
    return MarbleProceduralTexture;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["ProceduralTexture"]));

babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.MarbleProceduralTexture"] = MarbleProceduralTexture;


/***/ }),

/***/ "./normalMap/index.ts":
/*!****************************!*\
  !*** ./normalMap/index.ts ***!
  \****************************/
/*! exports provided: NormalMapProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _normalMapProceduralTexture__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./normalMapProceduralTexture */ "./normalMap/normalMapProceduralTexture.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "NormalMapProceduralTexture", function() { return _normalMapProceduralTexture__WEBPACK_IMPORTED_MODULE_0__["NormalMapProceduralTexture"]; });




/***/ }),

/***/ "./normalMap/normalMapProceduralTexture.fragment.ts":
/*!**********************************************************!*\
  !*** ./normalMap/normalMapProceduralTexture.fragment.ts ***!
  \**********************************************************/
/*! exports provided: normalMapProceduralTexturePixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "normalMapProceduralTexturePixelShader", function() { return normalMapProceduralTexturePixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'normalMapProceduralTexturePixelShader';
var shader = "precision highp float;\n\nuniform sampler2D baseSampler;\nuniform float size;\n\nvarying vec2 vUV;\n\nconst vec3 LUMA_COEFFICIENT=vec3(0.2126,0.7152,0.0722);\nfloat lumaAtCoord(vec2 coord)\n{\nvec3 pixel=texture2D(baseSampler,coord).rgb;\nfloat luma=dot(pixel,LUMA_COEFFICIENT);\nreturn luma;\n}\nvoid main()\n{\nfloat lumaU0=lumaAtCoord(vUV+vec2(-1.0,0.0)/size);\nfloat lumaU1=lumaAtCoord(vUV+vec2( 1.0,0.0)/size);\nfloat lumaV0=lumaAtCoord(vUV+vec2( 0.0,-1.0)/size);\nfloat lumaV1=lumaAtCoord(vUV+vec2( 0.0,1.0)/size);\nvec2 slope=(vec2(lumaU0-lumaU1,lumaV0-lumaV1)+1.0)*0.5;\ngl_FragColor=vec4(slope,1.0,1.0);\n}\n";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var normalMapProceduralTexturePixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./normalMap/normalMapProceduralTexture.ts":
/*!*************************************************!*\
  !*** ./normalMap/normalMapProceduralTexture.ts ***!
  \*************************************************/
/*! exports provided: NormalMapProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NormalMapProceduralTexture", function() { return NormalMapProceduralTexture; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _normalMapProceduralTexture_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./normalMapProceduralTexture.fragment */ "./normalMap/normalMapProceduralTexture.fragment.ts");





var NormalMapProceduralTexture = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](NormalMapProceduralTexture, _super);
    function NormalMapProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
        var _this = _super.call(this, name, size, "normalMapProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
        _this.updateShaderUniforms();
        return _this;
    }
    NormalMapProceduralTexture.prototype.updateShaderUniforms = function () {
        this.setTexture("baseSampler", this._baseTexture);
        this.setFloat("size", this.getRenderSize());
    };
    NormalMapProceduralTexture.prototype.render = function (useCameraPostProcess) {
        _super.prototype.render.call(this, useCameraPostProcess);
    };
    NormalMapProceduralTexture.prototype.resize = function (size, generateMipMaps) {
        _super.prototype.resize.call(this, size, generateMipMaps);
        // We need to update the "size" uniform
        this.updateShaderUniforms();
    };
    Object.defineProperty(NormalMapProceduralTexture.prototype, "baseTexture", {
        get: function () {
            return this._baseTexture;
        },
        set: function (texture) {
            this._baseTexture = texture;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Serializes this normal map procedural texture
     * @returns a serialized normal map procedural texture object
     */
    NormalMapProceduralTexture.prototype.serialize = function () {
        var serializationObject = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Serialize(this, _super.prototype.serialize.call(this));
        serializationObject.customType = "BABYLON.NormalMapProceduralTexture";
        return serializationObject;
    };
    /**
     * Creates a Normal Map Procedural Texture from parsed normal map procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing normal map procedural texture information
     * @returns a parsed Normal Map Procedural Texture
     */
    NormalMapProceduralTexture.Parse = function (parsedTexture, scene, rootUrl) {
        var texture = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new NormalMapProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps); }, parsedTexture, scene, rootUrl);
        return texture;
    };
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsTexture"])()
    ], NormalMapProceduralTexture.prototype, "baseTexture", null);
    return NormalMapProceduralTexture;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["ProceduralTexture"]));

babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.NormalMapProceduralTexture"] = NormalMapProceduralTexture;


/***/ }),

/***/ "./perlinNoise/index.ts":
/*!******************************!*\
  !*** ./perlinNoise/index.ts ***!
  \******************************/
/*! exports provided: PerlinNoiseProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _perlinNoiseProceduralTexture__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./perlinNoiseProceduralTexture */ "./perlinNoise/perlinNoiseProceduralTexture.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "PerlinNoiseProceduralTexture", function() { return _perlinNoiseProceduralTexture__WEBPACK_IMPORTED_MODULE_0__["PerlinNoiseProceduralTexture"]; });




/***/ }),

/***/ "./perlinNoise/perlinNoiseProceduralTexture.fragment.ts":
/*!**************************************************************!*\
  !*** ./perlinNoise/perlinNoiseProceduralTexture.fragment.ts ***!
  \**************************************************************/
/*! exports provided: perlinNoiseProceduralTexturePixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "perlinNoiseProceduralTexturePixelShader", function() { return perlinNoiseProceduralTexturePixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'perlinNoiseProceduralTexturePixelShader';
var shader = "\nprecision highp float;\n\nuniform float size;\nuniform float time;\nuniform float translationSpeed;\n\nvarying vec2 vUV;\n\nfloat r(float n)\n{\nreturn fract(cos(n*89.42)*343.42);\n}\nvec2 r(vec2 n)\n{\nreturn vec2(r(n.x*23.62-300.0+n.y*34.35),r(n.x*45.13+256.0+n.y*38.89));\n}\nfloat worley(vec2 n,float s)\n{\nfloat dis=1.0;\nfor(int x=-1; x<=1; x++)\n{\nfor(int y=-1; y<=1; y++)\n{\nvec2 p=floor(n/s)+vec2(x,y);\nfloat d=length(r(p)+vec2(x,y)-fract(n/s));\nif (dis>d)\ndis=d;\n}\n}\nreturn 1.0-dis;\n}\nvec3 hash33(vec3 p3)\n{\np3=fract(p3*vec3(0.1031,0.11369,0.13787));\np3+=dot(p3,p3.yxz+19.19);\nreturn -1.0+2.0*fract(vec3((p3.x+p3.y)*p3.z,(p3.x+p3.z)*p3.y,(p3.y+p3.z)*p3.x));\n}\nfloat perlinNoise(vec3 p)\n{\nvec3 pi=floor(p);\nvec3 pf=p-pi;\nvec3 w=pf*pf*(3.0-2.0*pf);\nreturn mix(\nmix(\nmix(\ndot(pf-vec3(0,0,0),hash33(pi+vec3(0,0,0))),\ndot(pf-vec3(1,0,0),hash33(pi+vec3(1,0,0))),\nw.x\n),\nmix(\ndot(pf-vec3(0,0,1),hash33(pi+vec3(0,0,1))),\ndot(pf-vec3(1,0,1),hash33(pi+vec3(1,0,1))),\nw.x\n),\nw.z\n),\nmix(\nmix(\ndot(pf-vec3(0,1,0),hash33(pi+vec3(0,1,0))),\ndot(pf-vec3(1,1,0),hash33(pi+vec3(1,1,0))),\nw.x\n),\nmix(\ndot(pf-vec3(0,1,1),hash33(pi+vec3(0,1,1))),\ndot(pf-vec3(1,1,1),hash33(pi+vec3(1,1,1))),\nw.x\n),\nw.z\n),\nw.y\n);\n}\n\nvoid main(void)\n{\nvec2 uv=gl_FragCoord.xy+translationSpeed;\nfloat dis=(\n1.0+perlinNoise(vec3(uv/vec2(size,size),time*0.05)*8.0))\n*(1.0+(worley(uv,32.0)+ 0.5*worley(2.0*uv,32.0)+0.25*worley(4.0*uv,32.0))\n);\ngl_FragColor=vec4(vec3(dis/4.0),1.0);\n}\n";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var perlinNoiseProceduralTexturePixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./perlinNoise/perlinNoiseProceduralTexture.ts":
/*!*****************************************************!*\
  !*** ./perlinNoise/perlinNoiseProceduralTexture.ts ***!
  \*****************************************************/
/*! exports provided: PerlinNoiseProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PerlinNoiseProceduralTexture", function() { return PerlinNoiseProceduralTexture; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _perlinNoiseProceduralTexture_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./perlinNoiseProceduralTexture.fragment */ "./perlinNoise/perlinNoiseProceduralTexture.fragment.ts");





var PerlinNoiseProceduralTexture = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](PerlinNoiseProceduralTexture, _super);
    function PerlinNoiseProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
        var _this = _super.call(this, name, size, "perlinNoiseProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
        _this.time = 0.0;
        _this.timeScale = 1.0;
        _this.translationSpeed = 1.0;
        _this._currentTranslation = 0;
        _this.updateShaderUniforms();
        return _this;
    }
    PerlinNoiseProceduralTexture.prototype.updateShaderUniforms = function () {
        this.setFloat("size", this.getRenderSize());
        var scene = this.getScene();
        if (!scene) {
            return;
        }
        var deltaTime = scene.getEngine().getDeltaTime();
        this.time += deltaTime;
        this.setFloat("time", this.time * this.timeScale / 1000);
        this._currentTranslation += deltaTime * this.translationSpeed / 1000.0;
        this.setFloat("translationSpeed", this._currentTranslation);
    };
    PerlinNoiseProceduralTexture.prototype.render = function (useCameraPostProcess) {
        this.updateShaderUniforms();
        _super.prototype.render.call(this, useCameraPostProcess);
    };
    PerlinNoiseProceduralTexture.prototype.resize = function (size, generateMipMaps) {
        _super.prototype.resize.call(this, size, generateMipMaps);
    };
    /**
     * Serializes this perlin noise procedural texture
     * @returns a serialized perlin noise procedural texture object
     */
    PerlinNoiseProceduralTexture.prototype.serialize = function () {
        var serializationObject = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Serialize(this, _super.prototype.serialize.call(this));
        serializationObject.customType = "BABYLON.PerlinNoiseProceduralTexture";
        return serializationObject;
    };
    /**
     * Creates a Perlin Noise Procedural Texture from parsed perlin noise procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing perlin noise procedural texture information
     * @returns a parsed Perlin Noise Procedural Texture
     */
    PerlinNoiseProceduralTexture.Parse = function (parsedTexture, scene, rootUrl) {
        var texture = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new PerlinNoiseProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps); }, parsedTexture, scene, rootUrl);
        return texture;
    };
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], PerlinNoiseProceduralTexture.prototype, "time", void 0);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], PerlinNoiseProceduralTexture.prototype, "timeScale", void 0);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], PerlinNoiseProceduralTexture.prototype, "translationSpeed", void 0);
    return PerlinNoiseProceduralTexture;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["ProceduralTexture"]));

babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.PerlinNoiseProceduralTexture"] = PerlinNoiseProceduralTexture;


/***/ }),

/***/ "./road/index.ts":
/*!***********************!*\
  !*** ./road/index.ts ***!
  \***********************/
/*! exports provided: RoadProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _roadProceduralTexture__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./roadProceduralTexture */ "./road/roadProceduralTexture.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RoadProceduralTexture", function() { return _roadProceduralTexture__WEBPACK_IMPORTED_MODULE_0__["RoadProceduralTexture"]; });




/***/ }),

/***/ "./road/roadProceduralTexture.fragment.ts":
/*!************************************************!*\
  !*** ./road/roadProceduralTexture.fragment.ts ***!
  \************************************************/
/*! exports provided: roadProceduralTexturePixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "roadProceduralTexturePixelShader", function() { return roadProceduralTexturePixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'roadProceduralTexturePixelShader';
var shader = "precision highp float;\nvarying vec2 vUV;\nuniform vec3 roadColor;\nfloat rand(vec2 n) {\nreturn fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);\n}\nfloat noise(vec2 n) {\nconst vec2 d=vec2(0.0,1.0);\nvec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));\nreturn mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);\n}\nfloat fbm(vec2 n) {\nfloat total=0.0,amplitude=1.0;\nfor (int i=0; i<4; i++) {\ntotal+=noise(n)*amplitude;\nn+=n;\namplitude*=0.5;\n}\nreturn total;\n}\nvoid main(void) {\nfloat ratioy=mod(gl_FragCoord.y*100.0 ,fbm(vUV*2.0));\nvec3 color=roadColor*ratioy;\ngl_FragColor=vec4(color,1.0);\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var roadProceduralTexturePixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./road/roadProceduralTexture.ts":
/*!***************************************!*\
  !*** ./road/roadProceduralTexture.ts ***!
  \***************************************/
/*! exports provided: RoadProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RoadProceduralTexture", function() { return RoadProceduralTexture; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _roadProceduralTexture_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./roadProceduralTexture.fragment */ "./road/roadProceduralTexture.fragment.ts");






var RoadProceduralTexture = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](RoadProceduralTexture, _super);
    function RoadProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
        var _this = _super.call(this, name, size, "roadProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
        _this._roadColor = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.53, 0.53, 0.53);
        _this.updateShaderUniforms();
        return _this;
    }
    RoadProceduralTexture.prototype.updateShaderUniforms = function () {
        this.setColor3("roadColor", this._roadColor);
    };
    Object.defineProperty(RoadProceduralTexture.prototype, "roadColor", {
        get: function () {
            return this._roadColor;
        },
        set: function (value) {
            this._roadColor = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Serializes this road procedural texture
     * @returns a serialized road procedural texture object
     */
    RoadProceduralTexture.prototype.serialize = function () {
        var serializationObject = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Serialize(this, _super.prototype.serialize.call(this));
        serializationObject.customType = "BABYLON.RoadProceduralTexture";
        return serializationObject;
    };
    /**
     * Creates a Road Procedural Texture from parsed road procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing road procedural texture information
     * @returns a parsed Road Procedural Texture
     */
    RoadProceduralTexture.Parse = function (parsedTexture, scene, rootUrl) {
        var texture = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new RoadProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps); }, parsedTexture, scene, rootUrl);
        return texture;
    };
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsColor3"])()
    ], RoadProceduralTexture.prototype, "roadColor", null);
    return RoadProceduralTexture;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["ProceduralTexture"]));

babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.RoadProceduralTexture"] = RoadProceduralTexture;


/***/ }),

/***/ "./starfield/index.ts":
/*!****************************!*\
  !*** ./starfield/index.ts ***!
  \****************************/
/*! exports provided: StarfieldProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _starfieldProceduralTexture__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./starfieldProceduralTexture */ "./starfield/starfieldProceduralTexture.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StarfieldProceduralTexture", function() { return _starfieldProceduralTexture__WEBPACK_IMPORTED_MODULE_0__["StarfieldProceduralTexture"]; });




/***/ }),

/***/ "./starfield/starfieldProceduralTexture.fragment.ts":
/*!**********************************************************!*\
  !*** ./starfield/starfieldProceduralTexture.fragment.ts ***!
  \**********************************************************/
/*! exports provided: starfieldProceduralTexturePixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "starfieldProceduralTexturePixelShader", function() { return starfieldProceduralTexturePixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'starfieldProceduralTexturePixelShader';
var shader = "precision highp float;\n\n#define volsteps 20\n#define iterations 15\nvarying vec2 vPosition;\nvarying vec2 vUV;\nuniform float time;\nuniform float alpha;\nuniform float beta;\nuniform float zoom;\nuniform float formuparam;\nuniform float stepsize;\nuniform float tile;\nuniform float brightness;\nuniform float darkmatter;\nuniform float distfading;\nuniform float saturation;\nvoid main()\n{\nvec3 dir=vec3(vUV*zoom,1.);\nfloat localTime=time*0.0001;\n\nmat2 rot1=mat2(cos(alpha),sin(alpha),-sin(alpha),cos(alpha));\nmat2 rot2=mat2(cos(beta),sin(beta),-sin(beta),cos(beta));\ndir.xz*=rot1;\ndir.xy*=rot2;\nvec3 from=vec3(1.,.5,0.5);\nfrom+=vec3(-2.,localTime*2.,localTime);\nfrom.xz*=rot1;\nfrom.xy*=rot2;\n\nfloat s=0.1,fade=1.;\nvec3 v=vec3(0.);\nfor (int r=0; r<volsteps; r++) {\nvec3 p=from+s*dir*.5;\np=abs(vec3(tile)-mod(p,vec3(tile*2.)));\nfloat pa,a=pa=0.;\nfor (int i=0; i<iterations; i++) {\np=abs(p)/dot(p,p)-formuparam;\na+=abs(length(p)-pa);\npa=length(p);\n}\nfloat dm=max(0.,darkmatter-a*a*.001);\na*=a*a;\nif (r>6) fade*=1.-dm;\n\nv+=fade;\nv+=vec3(s,s*s,s*s*s*s)*a*brightness*fade;\nfade*=distfading;\ns+=stepsize;\n}\nv=mix(vec3(length(v)),v,saturation);\ngl_FragColor=vec4(v*.01,1.);\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var starfieldProceduralTexturePixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./starfield/starfieldProceduralTexture.ts":
/*!*************************************************!*\
  !*** ./starfield/starfieldProceduralTexture.ts ***!
  \*************************************************/
/*! exports provided: StarfieldProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "StarfieldProceduralTexture", function() { return StarfieldProceduralTexture; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _starfieldProceduralTexture_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./starfieldProceduralTexture.fragment */ "./starfield/starfieldProceduralTexture.fragment.ts");





var StarfieldProceduralTexture = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](StarfieldProceduralTexture, _super);
    function StarfieldProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
        var _this = _super.call(this, name, size, "starfieldProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
        _this._time = 1;
        _this._alpha = 0.5;
        _this._beta = 0.8;
        _this._zoom = 0.8;
        _this._formuparam = 0.53;
        _this._stepsize = 0.1;
        _this._tile = 0.850;
        _this._brightness = 0.0015;
        _this._darkmatter = 0.400;
        _this._distfading = 0.730;
        _this._saturation = 0.850;
        _this.updateShaderUniforms();
        return _this;
    }
    StarfieldProceduralTexture.prototype.updateShaderUniforms = function () {
        this.setFloat("time", this._time);
        this.setFloat("alpha", this._alpha);
        this.setFloat("beta", this._beta);
        this.setFloat("zoom", this._zoom);
        this.setFloat("formuparam", this._formuparam);
        this.setFloat("stepsize", this._stepsize);
        this.setFloat("tile", this._tile);
        this.setFloat("brightness", this._brightness);
        this.setFloat("darkmatter", this._darkmatter);
        this.setFloat("distfading", this._distfading);
        this.setFloat("saturation", this._saturation);
    };
    Object.defineProperty(StarfieldProceduralTexture.prototype, "time", {
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
    Object.defineProperty(StarfieldProceduralTexture.prototype, "alpha", {
        get: function () {
            return this._alpha;
        },
        set: function (value) {
            this._alpha = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StarfieldProceduralTexture.prototype, "beta", {
        get: function () {
            return this._beta;
        },
        set: function (value) {
            this._beta = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StarfieldProceduralTexture.prototype, "formuparam", {
        get: function () {
            return this._formuparam;
        },
        set: function (value) {
            this._formuparam = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StarfieldProceduralTexture.prototype, "stepsize", {
        get: function () {
            return this._stepsize;
        },
        set: function (value) {
            this._stepsize = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StarfieldProceduralTexture.prototype, "zoom", {
        get: function () {
            return this._zoom;
        },
        set: function (value) {
            this._zoom = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StarfieldProceduralTexture.prototype, "tile", {
        get: function () {
            return this._tile;
        },
        set: function (value) {
            this._tile = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StarfieldProceduralTexture.prototype, "brightness", {
        get: function () {
            return this._brightness;
        },
        set: function (value) {
            this._brightness = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StarfieldProceduralTexture.prototype, "darkmatter", {
        get: function () {
            return this._darkmatter;
        },
        set: function (value) {
            this._darkmatter = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StarfieldProceduralTexture.prototype, "distfading", {
        get: function () {
            return this._distfading;
        },
        set: function (value) {
            this._distfading = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StarfieldProceduralTexture.prototype, "saturation", {
        get: function () {
            return this._saturation;
        },
        set: function (value) {
            this._saturation = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Serializes this starfield procedural texture
     * @returns a serialized starfield procedural texture object
     */
    StarfieldProceduralTexture.prototype.serialize = function () {
        var serializationObject = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Serialize(this, _super.prototype.serialize.call(this));
        serializationObject.customType = "BABYLON.StarfieldProceduralTexture";
        return serializationObject;
    };
    /**
     * Creates a Starfield Procedural Texture from parsed startfield procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing startfield procedural texture information
     * @returns a parsed Starfield Procedural Texture
     */
    StarfieldProceduralTexture.Parse = function (parsedTexture, scene, rootUrl) {
        var texture = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new StarfieldProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps); }, parsedTexture, scene, rootUrl);
        return texture;
    };
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], StarfieldProceduralTexture.prototype, "time", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], StarfieldProceduralTexture.prototype, "alpha", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], StarfieldProceduralTexture.prototype, "beta", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], StarfieldProceduralTexture.prototype, "formuparam", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], StarfieldProceduralTexture.prototype, "stepsize", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], StarfieldProceduralTexture.prototype, "zoom", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], StarfieldProceduralTexture.prototype, "tile", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], StarfieldProceduralTexture.prototype, "brightness", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], StarfieldProceduralTexture.prototype, "darkmatter", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], StarfieldProceduralTexture.prototype, "distfading", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], StarfieldProceduralTexture.prototype, "saturation", null);
    return StarfieldProceduralTexture;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["ProceduralTexture"]));

babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.StarfieldProceduralTexture"] = StarfieldProceduralTexture;


/***/ }),

/***/ "./wood/index.ts":
/*!***********************!*\
  !*** ./wood/index.ts ***!
  \***********************/
/*! exports provided: WoodProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _woodProceduralTexture__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./woodProceduralTexture */ "./wood/woodProceduralTexture.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "WoodProceduralTexture", function() { return _woodProceduralTexture__WEBPACK_IMPORTED_MODULE_0__["WoodProceduralTexture"]; });




/***/ }),

/***/ "./wood/woodProceduralTexture.fragment.ts":
/*!************************************************!*\
  !*** ./wood/woodProceduralTexture.fragment.ts ***!
  \************************************************/
/*! exports provided: woodProceduralTexturePixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "woodProceduralTexturePixelShader", function() { return woodProceduralTexturePixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'woodProceduralTexturePixelShader';
var shader = "precision highp float;\nvarying vec2 vPosition;\nvarying vec2 vUV;\nuniform float ampScale;\nuniform vec3 woodColor;\nfloat rand(vec2 n) {\nreturn fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);\n}\nfloat noise(vec2 n) {\nconst vec2 d=vec2(0.0,1.0);\nvec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));\nreturn mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);\n}\nfloat fbm(vec2 n) {\nfloat total=0.0,amplitude=1.0;\nfor (int i=0; i<4; i++) {\ntotal+=noise(n)*amplitude;\nn+=n;\namplitude*=0.5;\n}\nreturn total;\n}\nvoid main(void) {\nfloat ratioy=mod(vUV.x*ampScale,2.0+fbm(vUV*0.8));\nvec3 wood=woodColor*ratioy;\ngl_FragColor=vec4(wood,1.0);\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var woodProceduralTexturePixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./wood/woodProceduralTexture.ts":
/*!***************************************!*\
  !*** ./wood/woodProceduralTexture.ts ***!
  \***************************************/
/*! exports provided: WoodProceduralTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WoodProceduralTexture", function() { return WoodProceduralTexture; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _woodProceduralTexture_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./woodProceduralTexture.fragment */ "./wood/woodProceduralTexture.fragment.ts");






var WoodProceduralTexture = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](WoodProceduralTexture, _super);
    function WoodProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
        var _this = _super.call(this, name, size, "woodProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
        _this._ampScale = 100.0;
        _this._woodColor = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.32, 0.17, 0.09);
        _this.updateShaderUniforms();
        return _this;
    }
    WoodProceduralTexture.prototype.updateShaderUniforms = function () {
        this.setFloat("ampScale", this._ampScale);
        this.setColor3("woodColor", this._woodColor);
    };
    Object.defineProperty(WoodProceduralTexture.prototype, "ampScale", {
        get: function () {
            return this._ampScale;
        },
        set: function (value) {
            this._ampScale = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WoodProceduralTexture.prototype, "woodColor", {
        get: function () {
            return this._woodColor;
        },
        set: function (value) {
            this._woodColor = value;
            this.updateShaderUniforms();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Serializes this wood procedural texture
     * @returns a serialized wood procedural texture object
     */
    WoodProceduralTexture.prototype.serialize = function () {
        var serializationObject = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Serialize(this, _super.prototype.serialize.call(this));
        serializationObject.customType = "BABYLON.WoodProceduralTexture";
        return serializationObject;
    };
    /**
     * Creates a Wood Procedural Texture from parsed wood procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing wood procedural texture information
     * @returns a parsed Wood Procedural Texture
     */
    WoodProceduralTexture.Parse = function (parsedTexture, scene, rootUrl) {
        var texture = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new WoodProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps); }, parsedTexture, scene, rootUrl);
        return texture;
    };
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], WoodProceduralTexture.prototype, "ampScale", null);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsColor3"])()
    ], WoodProceduralTexture.prototype, "woodColor", null);
    return WoodProceduralTexture;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["ProceduralTexture"]));

babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.WoodProceduralTexture"] = WoodProceduralTexture;


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
//# sourceMappingURL=babylonjs.proceduralTextures.js.map