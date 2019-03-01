(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-post-process", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-post-process"] = factory(require("babylonjs"));
	else
		root["POSTPROCESSES"] = factory(root["BABYLON"]);
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

/***/ "./asciiArt/asciiArtPostProcess.ts":
/*!*****************************************!*\
  !*** ./asciiArt/asciiArtPostProcess.ts ***!
  \*****************************************/
/*! exports provided: AsciiArtFontTexture, AsciiArtPostProcess */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AsciiArtFontTexture", function() { return AsciiArtFontTexture; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AsciiArtPostProcess", function() { return AsciiArtPostProcess; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _asciiart_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./asciiart.fragment */ "./asciiArt/asciiart.fragment.ts");






/**
 * AsciiArtFontTexture is the helper class used to easily create your ascii art font texture.
 *
 * It basically takes care rendering the font front the given font size to a texture.
 * This is used later on in the postprocess.
 */
var AsciiArtFontTexture = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](AsciiArtFontTexture, _super);
    /**
     * Create a new instance of the Ascii Art FontTexture class
     * @param name the name of the texture
     * @param font the font to use, use the W3C CSS notation
     * @param text the caracter set to use in the rendering.
     * @param scene the scene that owns the texture
     */
    function AsciiArtFontTexture(name, font, text, scene) {
        if (scene === void 0) { scene = null; }
        var _this = _super.call(this, scene) || this;
        scene = _this.getScene();
        if (!scene) {
            return _this;
        }
        _this.name = name;
        _this._text == text;
        _this._font == font;
        _this.wrapU = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Texture"].CLAMP_ADDRESSMODE;
        _this.wrapV = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Texture"].CLAMP_ADDRESSMODE;
        //this.anisotropicFilteringLevel = 1;
        // Get the font specific info.
        var maxCharHeight = _this.getFontHeight(font);
        var maxCharWidth = _this.getFontWidth(font);
        _this._charSize = Math.max(maxCharHeight.height, maxCharWidth);
        // This is an approximate size, but should always be able to fit at least the maxCharCount.
        var textureWidth = Math.ceil(_this._charSize * text.length);
        var textureHeight = _this._charSize;
        // Create the texture that will store the font characters.
        _this._texture = scene.getEngine().createDynamicTexture(textureWidth, textureHeight, false, babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Texture"].NEAREST_SAMPLINGMODE);
        //scene.getEngine().setclamp
        var textureSize = _this.getSize();
        // Create a canvas with the final size: the one matching the texture.
        var canvas = document.createElement("canvas");
        canvas.width = textureSize.width;
        canvas.height = textureSize.height;
        var context = canvas.getContext("2d");
        context.textBaseline = "top";
        context.font = font;
        context.fillStyle = "white";
        context.imageSmoothingEnabled = false;
        // Sets the text in the texture.
        for (var i = 0; i < text.length; i++) {
            context.fillText(text[i], i * _this._charSize, -maxCharHeight.offset);
        }
        // Flush the text in the dynamic texture.
        scene.getEngine().updateDynamicTexture(_this._texture, canvas, false, true);
        return _this;
    }
    Object.defineProperty(AsciiArtFontTexture.prototype, "charSize", {
        /**
         * Gets the size of one char in the texture (each char fits in size * size space in the texture).
         */
        get: function () {
            return this._charSize;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Gets the max char width of a font.
     * @param font the font to use, use the W3C CSS notation
     * @return the max char width
     */
    AsciiArtFontTexture.prototype.getFontWidth = function (font) {
        var fontDraw = document.createElement("canvas");
        var ctx = fontDraw.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.font = font;
        return ctx.measureText("W").width;
    };
    // More info here: https://videlais.com/2014/03/16/the-many-and-varied-problems-with-measuring-font-height-for-html5-canvas/
    /**
     * Gets the max char height of a font.
     * @param font the font to use, use the W3C CSS notation
     * @return the max char height
     */
    AsciiArtFontTexture.prototype.getFontHeight = function (font) {
        var fontDraw = document.createElement("canvas");
        var ctx = fontDraw.getContext('2d');
        ctx.fillRect(0, 0, fontDraw.width, fontDraw.height);
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'white';
        ctx.font = font;
        ctx.fillText('jH|', 0, 0);
        var pixels = ctx.getImageData(0, 0, fontDraw.width, fontDraw.height).data;
        var start = -1;
        var end = -1;
        for (var row = 0; row < fontDraw.height; row++) {
            for (var column = 0; column < fontDraw.width; column++) {
                var index = (row * fontDraw.width + column) * 4;
                if (pixels[index] === 0) {
                    if (column === fontDraw.width - 1 && start !== -1) {
                        end = row;
                        row = fontDraw.height;
                        break;
                    }
                    continue;
                }
                else {
                    if (start === -1) {
                        start = row;
                    }
                    break;
                }
            }
        }
        return { height: (end - start) + 1, offset: start - 1 };
    };
    /**
     * Clones the current AsciiArtTexture.
     * @return the clone of the texture.
     */
    AsciiArtFontTexture.prototype.clone = function () {
        return new AsciiArtFontTexture(this.name, this._font, this._text, this.getScene());
    };
    /**
     * Parses a json object representing the texture and returns an instance of it.
     * @param source the source JSON representation
     * @param scene the scene to create the texture for
     * @return the parsed texture
     */
    AsciiArtFontTexture.Parse = function (source, scene) {
        var texture = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new AsciiArtFontTexture(source.name, source.font, source.text, scene); }, source, scene, null);
        return texture;
    };
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])("font")
    ], AsciiArtFontTexture.prototype, "_font", void 0);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])("text")
    ], AsciiArtFontTexture.prototype, "_text", void 0);
    return AsciiArtFontTexture;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["BaseTexture"]));

/**
 * AsciiArtPostProcess helps rendering everithing in Ascii Art.
 *
 * Simmply add it to your scene and let the nerd that lives in you have fun.
 * Example usage: var pp = new AsciiArtPostProcess("myAscii", "20px Monospace", camera);
 */
var AsciiArtPostProcess = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](AsciiArtPostProcess, _super);
    /**
     * Instantiates a new Ascii Art Post Process.
     * @param name the name to give to the postprocess
     * @camera the camera to apply the post process to.
     * @param options can either be the font name or an option object following the IAsciiArtPostProcessOptions format
     */
    function AsciiArtPostProcess(name, camera, options) {
        var _this = _super.call(this, name, 'asciiart', ['asciiArtFontInfos', 'asciiArtOptions'], ['asciiArtFont'], {
            width: camera.getEngine().getRenderWidth(),
            height: camera.getEngine().getRenderHeight()
        }, camera, babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Texture"].TRILINEAR_SAMPLINGMODE, camera.getEngine(), true) || this;
        /**
         * This defines the amount you want to mix the "tile" or caracter space colored in the ascii art.
         * This number is defined between 0 and 1;
         */
        _this.mixToTile = 0;
        /**
         * This defines the amount you want to mix the normal rendering pass in the ascii art.
         * This number is defined between 0 and 1;
         */
        _this.mixToNormal = 0;
        // Default values.
        var font = "40px Monospace";
        var characterSet = " `-.'_:,\"=^;<+!*?/cL\\zrs7TivJtC{3F)Il(xZfY5S2eajo14[nuyE]P6V9kXpKwGhqAUbOd8#HRDB0$mgMW&Q%N@";
        // Use options.
        if (options) {
            if (typeof (options) === "string") {
                font = options;
            }
            else {
                font = options.font || font;
                characterSet = options.characterSet || characterSet;
                _this.mixToTile = options.mixToTile || _this.mixToTile;
                _this.mixToNormal = options.mixToNormal || _this.mixToNormal;
            }
        }
        _this._asciiArtFontTexture = new AsciiArtFontTexture(name, font, characterSet, camera.getScene());
        var textureSize = _this._asciiArtFontTexture.getSize();
        _this.onApply = function (effect) {
            effect.setTexture("asciiArtFont", _this._asciiArtFontTexture);
            effect.setFloat4("asciiArtFontInfos", _this._asciiArtFontTexture.charSize, characterSet.length, textureSize.width, textureSize.height);
            effect.setFloat4("asciiArtOptions", _this.width, _this.height, _this.mixToNormal, _this.mixToTile);
        };
        return _this;
    }
    return AsciiArtPostProcess;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["PostProcess"]));



/***/ }),

/***/ "./asciiArt/asciiart.fragment.ts":
/*!***************************************!*\
  !*** ./asciiArt/asciiart.fragment.ts ***!
  \***************************************/
/*! exports provided: asciiartPixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "asciiartPixelShader", function() { return asciiartPixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'asciiartPixelShader';
var shader = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform sampler2D asciiArtFont;\n\nuniform vec4 asciiArtFontInfos;\nuniform vec4 asciiArtOptions;\n\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,vec3(0.2126,0.7152,0.0722)),0.,1.);\n}\n\nvoid main(void)\n{\nfloat caracterSize=asciiArtFontInfos.x;\nfloat numChar=asciiArtFontInfos.y-1.0;\nfloat fontx=asciiArtFontInfos.z;\nfloat fonty=asciiArtFontInfos.w;\nfloat screenx=asciiArtOptions.x;\nfloat screeny=asciiArtOptions.y;\nfloat tileX=float(floor((gl_FragCoord.x)/caracterSize))*caracterSize/screenx;\nfloat tileY=float(floor((gl_FragCoord.y)/caracterSize))*caracterSize/screeny;\nvec2 tileUV=vec2(tileX,tileY);\nvec4 tileColor=texture2D(textureSampler,tileUV);\nvec4 baseColor=texture2D(textureSampler,vUV);\nfloat tileLuminance=getLuminance(tileColor.rgb);\nfloat offsetx=(float(floor(tileLuminance*numChar)))*caracterSize/fontx;\nfloat offsety=0.0;\nfloat x=float(mod(gl_FragCoord.x,caracterSize))/fontx;\nfloat y=float(mod(gl_FragCoord.y,caracterSize))/fonty;\nvec4 finalColor=texture2D(asciiArtFont,vec2(offsetx+x,offsety+(caracterSize/fonty-y)));\nfinalColor.rgb*=tileColor.rgb;\nfinalColor.a=1.0;\nfinalColor=mix(finalColor,tileColor,asciiArtOptions.w);\nfinalColor=mix(finalColor,baseColor,asciiArtOptions.z);\ngl_FragColor=finalColor;\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var asciiartPixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./asciiArt/index.ts":
/*!***************************!*\
  !*** ./asciiArt/index.ts ***!
  \***************************/
/*! exports provided: AsciiArtFontTexture, AsciiArtPostProcess */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _asciiArtPostProcess__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./asciiArtPostProcess */ "./asciiArt/asciiArtPostProcess.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AsciiArtFontTexture", function() { return _asciiArtPostProcess__WEBPACK_IMPORTED_MODULE_0__["AsciiArtFontTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AsciiArtPostProcess", function() { return _asciiArtPostProcess__WEBPACK_IMPORTED_MODULE_0__["AsciiArtPostProcess"]; });




/***/ }),

/***/ "./digitalRain/digitalRainPostProcess.ts":
/*!***********************************************!*\
  !*** ./digitalRain/digitalRainPostProcess.ts ***!
  \***********************************************/
/*! exports provided: DigitalRainFontTexture, DigitalRainPostProcess */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DigitalRainFontTexture", function() { return DigitalRainFontTexture; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DigitalRainPostProcess", function() { return DigitalRainPostProcess; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _digitalrain_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./digitalrain.fragment */ "./digitalRain/digitalrain.fragment.ts");







/**
 * DigitalRainFontTexture is the helper class used to easily create your digital rain font texture.
 *
 * It basically takes care rendering the font front the given font size to a texture.
 * This is used later on in the postprocess.
 */
var DigitalRainFontTexture = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](DigitalRainFontTexture, _super);
    /**
     * Create a new instance of the Digital Rain FontTexture class
     * @param name the name of the texture
     * @param font the font to use, use the W3C CSS notation
     * @param text the caracter set to use in the rendering.
     * @param scene the scene that owns the texture
     */
    function DigitalRainFontTexture(name, font, text, scene) {
        if (scene === void 0) { scene = null; }
        var _this = _super.call(this, scene) || this;
        scene = _this.getScene();
        if (!scene) {
            return _this;
        }
        _this.name = name;
        _this._text == text;
        _this._font == font;
        _this.wrapU = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Texture"].CLAMP_ADDRESSMODE;
        _this.wrapV = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Texture"].CLAMP_ADDRESSMODE;
        // Get the font specific info.
        var maxCharHeight = _this.getFontHeight(font);
        var maxCharWidth = _this.getFontWidth(font);
        _this._charSize = Math.max(maxCharHeight.height, maxCharWidth);
        // This is an approximate size, but should always be able to fit at least the maxCharCount.
        var textureWidth = _this._charSize;
        var textureHeight = Math.ceil(_this._charSize * text.length);
        // Create the texture that will store the font characters.
        _this._texture = scene.getEngine().createDynamicTexture(textureWidth, textureHeight, false, babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Texture"].NEAREST_SAMPLINGMODE);
        //scene.getEngine().setclamp
        var textureSize = _this.getSize();
        // Create a canvas with the final size: the one matching the texture.
        var canvas = document.createElement("canvas");
        canvas.width = textureSize.width;
        canvas.height = textureSize.height;
        var context = canvas.getContext("2d");
        context.textBaseline = "top";
        context.font = font;
        context.fillStyle = "white";
        context.imageSmoothingEnabled = false;
        // Sets the text in the texture.
        for (var i = 0; i < text.length; i++) {
            context.fillText(text[i], 0, i * _this._charSize - maxCharHeight.offset);
        }
        // Flush the text in the dynamic texture.
        scene.getEngine().updateDynamicTexture(_this._texture, canvas, false, true);
        return _this;
    }
    Object.defineProperty(DigitalRainFontTexture.prototype, "charSize", {
        /**
         * Gets the size of one char in the texture (each char fits in size * size space in the texture).
         */
        get: function () {
            return this._charSize;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Gets the max char width of a font.
     * @param font the font to use, use the W3C CSS notation
     * @return the max char width
     */
    DigitalRainFontTexture.prototype.getFontWidth = function (font) {
        var fontDraw = document.createElement("canvas");
        var ctx = fontDraw.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.font = font;
        return ctx.measureText("W").width;
    };
    // More info here: https://videlais.com/2014/03/16/the-many-and-varied-problems-with-measuring-font-height-for-html5-canvas/
    /**
     * Gets the max char height of a font.
     * @param font the font to use, use the W3C CSS notation
     * @return the max char height
     */
    DigitalRainFontTexture.prototype.getFontHeight = function (font) {
        var fontDraw = document.createElement("canvas");
        var ctx = fontDraw.getContext('2d');
        ctx.fillRect(0, 0, fontDraw.width, fontDraw.height);
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'white';
        ctx.font = font;
        ctx.fillText('jH|', 0, 0);
        var pixels = ctx.getImageData(0, 0, fontDraw.width, fontDraw.height).data;
        var start = -1;
        var end = -1;
        for (var row = 0; row < fontDraw.height; row++) {
            for (var column = 0; column < fontDraw.width; column++) {
                var index = (row * fontDraw.width + column) * 4;
                if (pixels[index] === 0) {
                    if (column === fontDraw.width - 1 && start !== -1) {
                        end = row;
                        row = fontDraw.height;
                        break;
                    }
                    continue;
                }
                else {
                    if (start === -1) {
                        start = row;
                    }
                    break;
                }
            }
        }
        return { height: (end - start) + 1, offset: start - 1 };
    };
    /**
     * Clones the current DigitalRainFontTexture.
     * @return the clone of the texture.
     */
    DigitalRainFontTexture.prototype.clone = function () {
        return new DigitalRainFontTexture(this.name, this._font, this._text, this.getScene());
    };
    /**
     * Parses a json object representing the texture and returns an instance of it.
     * @param source the source JSON representation
     * @param scene the scene to create the texture for
     * @return the parsed texture
     */
    DigitalRainFontTexture.Parse = function (source, scene) {
        var texture = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new DigitalRainFontTexture(source.name, source.font, source.text, scene); }, source, scene, null);
        return texture;
    };
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])("font")
    ], DigitalRainFontTexture.prototype, "_font", void 0);
    tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])("text")
    ], DigitalRainFontTexture.prototype, "_text", void 0);
    return DigitalRainFontTexture;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["BaseTexture"]));

/**
 * DigitalRainPostProcess helps rendering everithing in digital rain.
 *
 * Simmply add it to your scene and let the nerd that lives in you have fun.
 * Example usage: var pp = new DigitalRainPostProcess("digitalRain", "20px Monospace", camera);
 */
var DigitalRainPostProcess = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](DigitalRainPostProcess, _super);
    /**
     * Instantiates a new Digital Rain Post Process.
     * @param name the name to give to the postprocess
     * @camera the camera to apply the post process to.
     * @param options can either be the font name or an option object following the IDigitalRainPostProcessOptions format
     */
    function DigitalRainPostProcess(name, camera, options) {
        var _this = _super.call(this, name, 'digitalrain', ['digitalRainFontInfos', 'digitalRainOptions', 'cosTimeZeroOne', 'matrixSpeed'], ['digitalRainFont'], {
            width: camera.getEngine().getRenderWidth(),
            height: camera.getEngine().getRenderHeight()
        }, camera, babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Texture"].TRILINEAR_SAMPLINGMODE, camera.getEngine(), true) || this;
        /**
         * This defines the amount you want to mix the "tile" or caracter space colored in the digital rain.
         * This number is defined between 0 and 1;
         */
        _this.mixToTile = 0;
        /**
         * This defines the amount you want to mix the normal rendering pass in the digital rain.
         * This number is defined between 0 and 1;
         */
        _this.mixToNormal = 0;
        // Default values.
        var font = "15px Monospace";
        var characterSet = "古池や蛙飛び込む水の音ふるいけやかわずとびこむみずのおと初しぐれ猿も小蓑をほしげ也はつしぐれさるもこみのをほしげなり江戸の雨何石呑んだ時鳥えどのあめなんごくのんだほととぎす";
        // Use options.
        if (options) {
            if (typeof (options) === "string") {
                font = options;
            }
            else {
                font = options.font || font;
                _this.mixToTile = options.mixToTile || _this.mixToTile;
                _this.mixToNormal = options.mixToNormal || _this.mixToNormal;
            }
        }
        _this._digitalRainFontTexture = new DigitalRainFontTexture(name, font, characterSet, camera.getScene());
        var textureSize = _this._digitalRainFontTexture.getSize();
        var alpha = 0.0;
        var cosTimeZeroOne = 0.0;
        var matrix = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Matrix"].FromValues(Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random());
        _this.onApply = function (effect) {
            effect.setTexture("digitalRainFont", _this._digitalRainFontTexture);
            effect.setFloat4("digitalRainFontInfos", _this._digitalRainFontTexture.charSize, characterSet.length, textureSize.width, textureSize.height);
            effect.setFloat4("digitalRainOptions", _this.width, _this.height, _this.mixToNormal, _this.mixToTile);
            effect.setMatrix("matrixSpeed", matrix);
            alpha += 0.003;
            cosTimeZeroOne = alpha;
            effect.setFloat('cosTimeZeroOne', cosTimeZeroOne);
        };
        return _this;
    }
    return DigitalRainPostProcess;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["PostProcess"]));



/***/ }),

/***/ "./digitalRain/digitalrain.fragment.ts":
/*!*********************************************!*\
  !*** ./digitalRain/digitalrain.fragment.ts ***!
  \*********************************************/
/*! exports provided: digitalrainPixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "digitalrainPixelShader", function() { return digitalrainPixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'digitalrainPixelShader';
var shader = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform sampler2D digitalRainFont;\n\nuniform vec4 digitalRainFontInfos;\nuniform vec4 digitalRainOptions;\nuniform mat4 matrixSpeed;\nuniform float cosTimeZeroOne;\n\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,vec3(0.2126,0.7152,0.0722)),0.,1.);\n}\n\nvoid main(void)\n{\nfloat caracterSize=digitalRainFontInfos.x;\nfloat numChar=digitalRainFontInfos.y-1.0;\nfloat fontx=digitalRainFontInfos.z;\nfloat fonty=digitalRainFontInfos.w;\nfloat screenx=digitalRainOptions.x;\nfloat screeny=digitalRainOptions.y;\nfloat ratio=screeny/fonty;\nfloat columnx=float(floor((gl_FragCoord.x)/caracterSize));\nfloat tileX=float(floor((gl_FragCoord.x)/caracterSize))*caracterSize/screenx;\nfloat tileY=float(floor((gl_FragCoord.y)/caracterSize))*caracterSize/screeny;\nvec2 tileUV=vec2(tileX,tileY);\nvec4 tileColor=texture2D(textureSampler,tileUV);\nvec4 baseColor=texture2D(textureSampler,vUV);\nfloat tileLuminance=getLuminance(tileColor.rgb);\nint st=int(mod(columnx,4.0));\nfloat speed=cosTimeZeroOne*(sin(tileX*314.5)*0.5+0.6);\nfloat x=float(mod(gl_FragCoord.x,caracterSize))/fontx;\nfloat y=float(mod(speed+gl_FragCoord.y/screeny,1.0));\ny*=ratio;\nvec4 finalColor=texture2D(digitalRainFont,vec2(x,1.0-y));\nvec3 high=finalColor.rgb*(vec3(1.2,1.2,1.2)*pow(1.0-y,30.0));\nfinalColor.rgb*=vec3(pow(tileLuminance,5.0),pow(tileLuminance,1.5),pow(tileLuminance,3.0));\nfinalColor.rgb+=high;\nfinalColor.rgb=clamp(finalColor.rgb,0.,1.);\nfinalColor.a=1.0;\nfinalColor=mix(finalColor,tileColor,digitalRainOptions.w);\nfinalColor=mix(finalColor,baseColor,digitalRainOptions.z);\ngl_FragColor=finalColor;\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var digitalrainPixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./digitalRain/index.ts":
/*!******************************!*\
  !*** ./digitalRain/index.ts ***!
  \******************************/
/*! exports provided: DigitalRainFontTexture, DigitalRainPostProcess */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _digitalRainPostProcess__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./digitalRainPostProcess */ "./digitalRain/digitalRainPostProcess.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DigitalRainFontTexture", function() { return _digitalRainPostProcess__WEBPACK_IMPORTED_MODULE_0__["DigitalRainFontTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DigitalRainPostProcess", function() { return _digitalRainPostProcess__WEBPACK_IMPORTED_MODULE_0__["DigitalRainPostProcess"]; });




/***/ }),

/***/ "./index.ts":
/*!******************!*\
  !*** ./index.ts ***!
  \******************/
/*! exports provided: AsciiArtFontTexture, AsciiArtPostProcess, DigitalRainFontTexture, DigitalRainPostProcess, OceanPostProcess */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _asciiArt__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./asciiArt */ "./asciiArt/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AsciiArtFontTexture", function() { return _asciiArt__WEBPACK_IMPORTED_MODULE_0__["AsciiArtFontTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AsciiArtPostProcess", function() { return _asciiArt__WEBPACK_IMPORTED_MODULE_0__["AsciiArtPostProcess"]; });

/* harmony import */ var _digitalRain__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./digitalRain */ "./digitalRain/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DigitalRainFontTexture", function() { return _digitalRain__WEBPACK_IMPORTED_MODULE_1__["DigitalRainFontTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DigitalRainPostProcess", function() { return _digitalRain__WEBPACK_IMPORTED_MODULE_1__["DigitalRainPostProcess"]; });

/* harmony import */ var _ocean__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ocean */ "./ocean/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "OceanPostProcess", function() { return _ocean__WEBPACK_IMPORTED_MODULE_2__["OceanPostProcess"]; });






/***/ }),

/***/ "./legacy/legacy.ts":
/*!**************************!*\
  !*** ./legacy/legacy.ts ***!
  \**************************/
/*! exports provided: AsciiArtFontTexture, AsciiArtPostProcess, DigitalRainFontTexture, DigitalRainPostProcess, OceanPostProcess */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../index */ "./index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AsciiArtFontTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["AsciiArtFontTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AsciiArtPostProcess", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["AsciiArtPostProcess"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DigitalRainFontTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["DigitalRainFontTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DigitalRainPostProcess", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["DigitalRainPostProcess"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "OceanPostProcess", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["OceanPostProcess"]; });


/**
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in _index__WEBPACK_IMPORTED_MODULE_0__) {
        globalObject.BABYLON[key] = _index__WEBPACK_IMPORTED_MODULE_0__[key];
    }
}


/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./ocean/index.ts":
/*!************************!*\
  !*** ./ocean/index.ts ***!
  \************************/
/*! exports provided: OceanPostProcess */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _oceanPostProcess__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./oceanPostProcess */ "./ocean/oceanPostProcess.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "OceanPostProcess", function() { return _oceanPostProcess__WEBPACK_IMPORTED_MODULE_0__["OceanPostProcess"]; });




/***/ }),

/***/ "./ocean/oceanPostProcess.fragment.ts":
/*!********************************************!*\
  !*** ./ocean/oceanPostProcess.fragment.ts ***!
  \********************************************/
/*! exports provided: oceanPostProcessPixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "oceanPostProcessPixelShader", function() { return oceanPostProcessPixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'oceanPostProcessPixelShader';
var shader = "\n\nuniform sampler2D textureSampler;\nuniform sampler2D positionSampler;\n#ifdef REFLECTION_ENABLED\nuniform sampler2D reflectionSampler;\n#endif\n#ifdef REFRACTION_ENABLED\nuniform sampler2D refractionSampler;\n#endif\nuniform float time;\nuniform vec2 resolution;\nuniform vec3 cameraRotation;\nuniform vec3 cameraPosition;\n\nvarying vec2 vUV;\n\nconst int NUM_STEPS=8;\nconst float PI=3.141592;\nconst float EPSILON=1e-3;\n#define EPSILON_NRM (0.1/resolution.x)\n\nconst int ITER_GEOMETRY=8;\nconst int ITER_FRAGMENT=5;\nconst float SEA_HEIGHT=0.6;\nconst float SEA_CHOPPY=4.0;\nconst float SEA_SPEED=0.8;\nconst float SEA_FREQ=0.16;\nconst vec3 SEA_BASE=vec3(0.1,0.19,0.22);\nconst vec3 SEA_WATER_COLOR=vec3(0.8,0.9,0.6);\n#define SEA_TIME (1.0+time*SEA_SPEED)\nconst mat2 octave_m=mat2(1.6,1.2,-1.2,1.6);\n\nmat3 fromEuler(vec3 ang)\n{\nvec2 a1=vec2(sin(ang.x),cos(ang.x));\nvec2 a2=vec2(sin(ang.y),cos(ang.y));\nvec2 a3=vec2(sin(ang.z),cos(ang.z));\nmat3 m;\nm[0]=vec3(a1.y*a3.y+a1.x*a2.x*a3.x,a1.y*a2.x*a3.x+a3.y*a1.x,-a2.y*a3.x);\nm[1]=vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);\nm[2]=vec3(a3.y*a1.x*a2.x+a1.y*a3.x,a1.x*a3.x-a1.y*a3.y*a2.x,a2.y*a3.y);\nreturn m;\n}\nfloat hash( vec2 p )\n{\nfloat h=dot(p,vec2(127.1,311.7));\nreturn fract(sin(h)*43758.5453123);\n}\nfloat noise( in vec2 p )\n{\nvec2 i=floor( p );\nvec2 f=fract( p );\nvec2 u=f*f*(3.0-2.0*f);\nreturn -1.0+2.0*mix( mix( hash( i+vec2(0.0,0.0) ),\nhash( i+vec2(1.0,0.0) ),u.x),\nmix( hash( i+vec2(0.0,1.0) ),\nhash( i+vec2(1.0,1.0) ),u.x),u.y);\n}\n\nfloat diffuse(vec3 n,vec3 l,float p)\n{\nreturn pow(dot(n,l)*0.4+0.6,p);\n}\nfloat specular(vec3 n,vec3 l,vec3 e,float s)\n{\nfloat nrm=(s+8.0)/(PI*8.0);\nreturn pow(max(dot(reflect(e,n),l),0.0),s)*nrm;\n}\n\nfloat sea_octave(vec2 uv,float choppy)\n{\nuv+=noise(uv);\nvec2 wv=1.0-abs(sin(uv));\nvec2 swv=abs(cos(uv));\nwv=mix(wv,swv,wv);\nreturn pow(1.0-pow(wv.x*wv.y,0.65),choppy);\n}\nfloat map(vec3 p)\n{\nfloat freq=SEA_FREQ;\nfloat amp=SEA_HEIGHT;\nfloat choppy=SEA_CHOPPY;\nvec2 uv=p.xz; uv.x*=0.75;\nfloat d,h=0.0;\nfor(int i=0; i<ITER_GEOMETRY; i++)\n{\nd=sea_octave((uv+SEA_TIME)*freq,choppy);\nd+=sea_octave((uv-SEA_TIME)*freq,choppy);\nh+=d*amp;\nuv*=octave_m; freq*=1.9; amp*=0.22;\nchoppy=mix(choppy,1.0,0.2);\n}\nreturn p.y-h;\n}\nfloat map_detailed(vec3 p)\n{\nfloat freq=SEA_FREQ;\nfloat amp=SEA_HEIGHT;\nfloat choppy=SEA_CHOPPY;\nvec2 uv=p.xz; uv.x*=0.75;\nfloat d,h=0.0;\nfor(int i=0; i<ITER_FRAGMENT; i++)\n{\nd=sea_octave((uv+SEA_TIME)*freq,choppy);\nd+=sea_octave((uv-SEA_TIME)*freq,choppy);\nh+=d*amp;\nuv*=octave_m; freq*=1.9; amp*=0.22;\nchoppy=mix(choppy,1.0,0.2);\n}\nreturn p.y-h;\n}\nvec3 getSeaColor(vec3 p,vec3 n,vec3 l,vec3 eye,vec3 dist)\n{\nfloat fresnel=clamp(1.0-dot(n,-eye),0.0,1.0);\nfresnel=pow(fresnel,3.0)*0.65;\n#if defined(REFLECTION_ENABLED) || defined(REFRACTION_ENABLED)\nvec2 reflectionUv=vec2(vUV.x,vUV.y+normalize(n).y);\n#endif\n#ifdef REFLECTION_ENABLED\nvec3 reflected=texture2D(reflectionSampler,reflectionUv).rgb*(1.0-fresnel);\n#else\nvec3 eyeNormal=reflect(eye,n);\neyeNormal.y=max(eyeNormal.y,0.0);\nvec3 reflected=vec3(pow(1.0-eyeNormal.y,2.0),1.0-eyeNormal.y,0.6+(1.0-eyeNormal.y)*0.4);\n#endif\n#ifdef REFRACTION_ENABLED\nvec3 refracted=SEA_BASE+diffuse(n,l,80.0)*SEA_WATER_COLOR*0.12;\nrefracted+=(texture2D(refractionSampler,reflectionUv).rgb*fresnel);\n#else\nvec3 refracted=SEA_BASE+diffuse(n,l,80.0)*SEA_WATER_COLOR*0.12;\n#endif\nvec3 color=mix(refracted,reflected,fresnel);\nfloat atten=max(1.0-dot(dist,dist)*0.001,0.0);\ncolor+=SEA_WATER_COLOR*(p.y-SEA_HEIGHT)*0.18*atten;\ncolor+=vec3(specular(n,l,eye,60.0));\nreturn color;\n}\n\nvec3 getNormal(vec3 p,float eps)\n{\nvec3 n;\nn.y=map_detailed(p);\nn.x=map_detailed(vec3(p.x+eps,p.y,p.z))-n.y;\nn.z=map_detailed(vec3(p.x,p.y,p.z+eps))-n.y;\nn.y=eps;\nreturn normalize(n);\n}\nfloat heightMapTracing(vec3 ori,vec3 dir,out vec3 p)\n{\nfloat tm=0.0;\nfloat tx=1000.0;\nfloat hx=map(ori+dir*tx);\nif(hx>0.0) return tx;\nfloat hm=map(ori+dir*tm);\nfloat tmid=0.0;\nfor(int i=0; i<NUM_STEPS; i++)\n{\ntmid=mix(tm,tx,hm/(hm-hx));\np=ori+dir*tmid;\nfloat hmid=map(p);\nif(hmid<0.0)\n{\ntx=tmid;\nhx=hmid;\n}\nelse\n{\ntm=tmid;\nhm=hmid;\n}\n}\nreturn tmid;\n}\n\nvoid main()\n{\n#ifdef NOT_SUPPORTED\n\ngl_FragColor=texture2D(textureSampler,vUV);\n#else\nvec2 uv=vUV;\nuv=uv*2.0-1.0;\nuv.x*=resolution.x/resolution.y;\n\nvec3 ang=vec3(cameraRotation.z,cameraRotation.x,cameraRotation.y);\nvec3 ori=vec3(cameraPosition.x,cameraPosition.y,-cameraPosition.z);\nvec3 dir=normalize(vec3(uv.xy,-3.0));\ndir=normalize(dir)*fromEuler(ang);\n\nvec3 p;\nheightMapTracing(ori,dir,p);\nvec3 dist=p-ori;\nvec3 n=getNormal(p,dot(dist,dist)*EPSILON_NRM);\nvec3 light=normalize(vec3(0.0,1.0,0.8));\n\nfloat seaFact=clamp(max(ori.y,0.0),0.0,1.0);\nvec3 position=texture2D(positionSampler,vUV).rgb;\nvec3 baseColor=texture2D(textureSampler,vUV).rgb;\nvec3 color=baseColor;\nif (max(position.y,0.0)<p.y)\n{\n\ncolor=mix(\nbaseColor,\ngetSeaColor(p,n,light,dir,dist),\npow(smoothstep(0.0,-0.05,dir.y),0.3)\n)*seaFact;\n}\ncolor=mix(\ncolor,\nbaseColor*SEA_BASE+diffuse(n,n,80.0)*SEA_WATER_COLOR*0.12,\n1.0-seaFact\n);\n\ngl_FragColor=vec4(pow(color,vec3(0.75)),1.0);\n#endif\n}\n";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var oceanPostProcessPixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./ocean/oceanPostProcess.ts":
/*!***********************************!*\
  !*** ./ocean/oceanPostProcess.ts ***!
  \***********************************/
/*! exports provided: OceanPostProcess */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OceanPostProcess", function() { return OceanPostProcess; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Materials/Textures/texture */ "babylonjs/Misc/decorators");
/* harmony import */ var babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _oceanPostProcess_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./oceanPostProcess.fragment */ "./ocean/oceanPostProcess.fragment.ts");







/**
 * OceanPostProcess helps rendering an infinite ocean surface that can reflect and refract environment.
 *
 * Simmply add it to your scene and let the nerd that lives in you have fun.
 * Example usage:
 *  var pp = new OceanPostProcess("myOcean", camera);
 *  pp.reflectionEnabled = true;
 *  pp.refractionEnabled = true;
 */
var OceanPostProcess = /** @class */ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"](OceanPostProcess, _super);
    /**
     * Instantiates a new Ocean Post Process.
     * @param name the name to give to the postprocess.
     * @camera the camera to apply the post process to.
     * @param options optional object following the IOceanPostProcessOptions format used to customize reflection and refraction render targets sizes.
     */
    function OceanPostProcess(name, camera, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, name, "oceanPostProcess", ["time", "resolution", "cameraPosition", "cameraRotation"], ["positionSampler", "reflectionSampler", "refractionSampler"], {
            width: camera.getEngine().getRenderWidth(),
            height: camera.getEngine().getRenderHeight()
        }, camera, babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__["Texture"].TRILINEAR_SAMPLINGMODE, camera.getEngine(), true) || this;
        _this._time = 0;
        _this._cameraRotation = babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__["Vector3"].Zero();
        _this._cameraViewMatrix = babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__["Matrix"].Identity();
        _this._reflectionEnabled = false;
        _this._refractionEnabled = false;
        // Get geometry shader
        _this._geometryRenderer = camera.getScene().enableGeometryBufferRenderer(1.0);
        if (_this._geometryRenderer && _this._geometryRenderer.isSupported) {
            // Eanble position buffer
            _this._geometryRenderer.enablePosition = true;
            // Create mirror textures
            _this.reflectionTexture = new babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__["MirrorTexture"]("oceanPostProcessReflection", options.reflectionSize || { width: 512, height: 512 }, camera.getScene());
            _this.reflectionTexture.mirrorPlane = babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__["Plane"].FromPositionAndNormal(babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__["Vector3"].Zero(), new babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__["Vector3"](0, -1, 0));
            _this.refractionTexture = new babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__["RenderTargetTexture"]("oceanPostProcessRefraction", options.refractionSize || { width: 512, height: 512 }, camera.getScene());
        }
        else {
            _this.updateEffect("#define NOT_SUPPORTED\n");
        }
        // On apply the post-process
        _this.onApply = function (effect) {
            if (!_this._geometryRenderer || !_this._geometryRenderer.isSupported) {
                return;
            }
            var engine = camera.getEngine();
            var scene = camera.getScene();
            _this._time += engine.getDeltaTime() * 0.001;
            effect.setFloat("time", _this._time);
            effect.setVector2("resolution", new babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__["Vector2"](engine.getRenderWidth(), engine.getRenderHeight()));
            if (scene) {
                // Position
                effect.setVector3("cameraPosition", camera.globalPosition);
                // Rotation
                _this._computeCameraRotation(camera);
                effect.setVector3("cameraRotation", _this._cameraRotation);
                // Samplers
                effect.setTexture("positionSampler", _this._geometryRenderer.getGBuffer().textures[2]);
                if (_this._reflectionEnabled) {
                    effect.setTexture("reflectionSampler", _this.reflectionTexture);
                }
                if (_this._refractionEnabled) {
                    effect.setTexture("refractionSampler", _this.refractionTexture);
                }
            }
        };
        return _this;
    }
    Object.defineProperty(OceanPostProcess.prototype, "reflectionEnabled", {
        /**
         * Gets a boolean indicating if the real-time reflection is enabled on the ocean.
         */
        get: function () {
            return this._reflectionEnabled;
        },
        /**
         * Sets weither or not the real-time reflection is enabled on the ocean.
         * Is set to true, the reflection mirror texture will be used as reflection texture.
         */
        set: function (enabled) {
            if (this._reflectionEnabled === enabled) {
                return;
            }
            this._reflectionEnabled = enabled;
            this.updateEffect(this._getDefines());
            // Remove or add custom render target
            var customRenderTargets = this.getCamera().getScene().customRenderTargets;
            if (!enabled) {
                var index = customRenderTargets.indexOf(this.reflectionTexture);
                if (index !== -1) {
                    customRenderTargets.splice(index, 1);
                }
            }
            else {
                customRenderTargets.push(this.reflectionTexture);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OceanPostProcess.prototype, "refractionEnabled", {
        /**
         * Gets a boolean indicating if the real-time refraction is enabled on the ocean.
         */
        get: function () {
            return this._refractionEnabled;
        },
        /**
         * Sets weither or not the real-time refraction is enabled on the ocean.
         * Is set to true, the refraction render target texture will be used as refraction texture.
         */
        set: function (enabled) {
            if (this._refractionEnabled === enabled) {
                return;
            }
            this._refractionEnabled = enabled;
            this.updateEffect(this._getDefines());
            // Remove or add custom render target
            var customRenderTargets = this.getCamera().getScene().customRenderTargets;
            if (!enabled) {
                var index = customRenderTargets.indexOf(this.refractionTexture);
                if (index !== -1) {
                    customRenderTargets.splice(index, 1);
                }
            }
            else {
                customRenderTargets.push(this.refractionTexture);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OceanPostProcess.prototype, "isSupported", {
        /**
         * Gets wether or not the post-processes is supported by the running hardware.
         * This requires draw buffer supports.
         */
        get: function () {
            return this._geometryRenderer !== null && this._geometryRenderer.isSupported;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns the appropriate defines according to the current configuration.
     */
    OceanPostProcess.prototype._getDefines = function () {
        var defines = [];
        if (this._reflectionEnabled) {
            defines.push("#define REFLECTION_ENABLED");
        }
        if (this._refractionEnabled) {
            defines.push("#define REFRACTION_ENABLED");
        }
        return defines.join("\n");
    };
    /**
     * Computes the current camera rotation as the shader requires a camera rotation.
     */
    OceanPostProcess.prototype._computeCameraRotation = function (camera) {
        camera.upVector.normalize();
        var target = camera.getTarget();
        camera._initialFocalDistance = target.subtract(camera.position).length();
        if (camera.position.z === target.z) {
            camera.position.z += babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__["Epsilon"];
        }
        var direction = target.subtract(camera.position);
        camera._viewMatrix.invertToRef(this._cameraViewMatrix);
        this._cameraRotation.x = Math.atan(this._cameraViewMatrix.m[6] / this._cameraViewMatrix.m[10]);
        if (direction.x >= 0.0) {
            this._cameraRotation.y = (-Math.atan(direction.z / direction.x) + Math.PI / 2.0);
        }
        else {
            this._cameraRotation.y = (-Math.atan(direction.z / direction.x) - Math.PI / 2.0);
        }
        this._cameraRotation.z = 0;
        if (isNaN(this._cameraRotation.x)) {
            this._cameraRotation.x = 0;
        }
        if (isNaN(this._cameraRotation.y)) {
            this._cameraRotation.y = 0;
        }
        if (isNaN(this._cameraRotation.z)) {
            this._cameraRotation.z = 0;
        }
    };
    return OceanPostProcess;
}(babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_1__["PostProcess"]));



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
//# sourceMappingURL=babylonjs.postProcess.js.map