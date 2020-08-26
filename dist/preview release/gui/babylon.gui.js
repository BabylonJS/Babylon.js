(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-gui", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-gui"] = factory(require("babylonjs"));
	else
		root["BABYLON"] = root["BABYLON"] || {}, root["BABYLON"]["GUI"] = factory(root["BABYLON"]);
})((typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this), function(__WEBPACK_EXTERNAL_MODULE_babylonjs_Misc_perfCounter__) {
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
/*! exports provided: __extends, __assign, __rest, __decorate, __param, __metadata, __awaiter, __generator, __createBinding, __exportStar, __values, __read, __spread, __spreadArrays, __await, __asyncGenerator, __asyncDelegator, __asyncValues, __makeTemplateObject, __importStar, __importDefault, __classPrivateFieldGet, __classPrivateFieldSet */
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
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__createBinding", function() { return __createBinding; });
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
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__classPrivateFieldGet", function() { return __classPrivateFieldGet; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__classPrivateFieldSet", function() { return __classPrivateFieldSet; });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
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
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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

var __createBinding = Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});

function __exportStar(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
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

var __setModuleDefault = Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
}

function __classPrivateFieldSet(receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
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

/***/ "./2D/adtInstrumentation.ts":
/*!**********************************!*\
  !*** ./2D/adtInstrumentation.ts ***!
  \**********************************/
/*! exports provided: AdvancedDynamicTextureInstrumentation */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AdvancedDynamicTextureInstrumentation", function() { return AdvancedDynamicTextureInstrumentation; });
/* harmony import */ var babylonjs_Misc_perfCounter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Misc/perfCounter */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_perfCounter__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_perfCounter__WEBPACK_IMPORTED_MODULE_0__);

/**
 * This class can be used to get instrumentation data from a AdvancedDynamicTexture object
 */
var AdvancedDynamicTextureInstrumentation = /** @class */ (function () {
    /**
     * Instantiates a new advanced dynamic texture instrumentation.
     * This class can be used to get instrumentation data from an AdvancedDynamicTexture object
     * @param texture Defines the AdvancedDynamicTexture to instrument
     */
    function AdvancedDynamicTextureInstrumentation(
    /**
     * Define the instrumented AdvancedDynamicTexture.
     */
    texture) {
        this.texture = texture;
        this._captureRenderTime = false;
        this._renderTime = new babylonjs_Misc_perfCounter__WEBPACK_IMPORTED_MODULE_0__["PerfCounter"]();
        this._captureLayoutTime = false;
        this._layoutTime = new babylonjs_Misc_perfCounter__WEBPACK_IMPORTED_MODULE_0__["PerfCounter"]();
        // Observers
        this._onBeginRenderObserver = null;
        this._onEndRenderObserver = null;
        this._onBeginLayoutObserver = null;
        this._onEndLayoutObserver = null;
    }
    Object.defineProperty(AdvancedDynamicTextureInstrumentation.prototype, "renderTimeCounter", {
        // Properties
        /**
         * Gets the perf counter used to capture render time
         */
        get: function () {
            return this._renderTime;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTextureInstrumentation.prototype, "layoutTimeCounter", {
        /**
         * Gets the perf counter used to capture layout time
         */
        get: function () {
            return this._layoutTime;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTextureInstrumentation.prototype, "captureRenderTime", {
        /**
         * Enable or disable the render time capture
         */
        get: function () {
            return this._captureRenderTime;
        },
        set: function (value) {
            var _this = this;
            if (value === this._captureRenderTime) {
                return;
            }
            this._captureRenderTime = value;
            if (value) {
                this._onBeginRenderObserver = this.texture.onBeginRenderObservable.add(function () {
                    _this._renderTime.beginMonitoring();
                });
                this._onEndRenderObserver = this.texture.onEndRenderObservable.add(function () {
                    _this._renderTime.endMonitoring(true);
                });
            }
            else {
                this.texture.onBeginRenderObservable.remove(this._onBeginRenderObserver);
                this._onBeginRenderObserver = null;
                this.texture.onEndRenderObservable.remove(this._onEndRenderObserver);
                this._onEndRenderObserver = null;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTextureInstrumentation.prototype, "captureLayoutTime", {
        /**
         * Enable or disable the layout time capture
         */
        get: function () {
            return this._captureLayoutTime;
        },
        set: function (value) {
            var _this = this;
            if (value === this._captureLayoutTime) {
                return;
            }
            this._captureLayoutTime = value;
            if (value) {
                this._onBeginLayoutObserver = this.texture.onBeginLayoutObservable.add(function () {
                    _this._layoutTime.beginMonitoring();
                });
                this._onEndLayoutObserver = this.texture.onEndLayoutObservable.add(function () {
                    _this._layoutTime.endMonitoring(true);
                });
            }
            else {
                this.texture.onBeginLayoutObservable.remove(this._onBeginLayoutObserver);
                this._onBeginLayoutObserver = null;
                this.texture.onEndLayoutObservable.remove(this._onEndLayoutObserver);
                this._onEndLayoutObserver = null;
            }
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Dispose and release associated resources.
     */
    AdvancedDynamicTextureInstrumentation.prototype.dispose = function () {
        this.texture.onBeginRenderObservable.remove(this._onBeginRenderObserver);
        this._onBeginRenderObserver = null;
        this.texture.onEndRenderObservable.remove(this._onEndRenderObserver);
        this._onEndRenderObserver = null;
        this.texture.onBeginLayoutObservable.remove(this._onBeginLayoutObserver);
        this._onBeginLayoutObserver = null;
        this.texture.onEndLayoutObservable.remove(this._onEndLayoutObserver);
        this._onEndLayoutObserver = null;
        this.texture = null;
    };
    return AdvancedDynamicTextureInstrumentation;
}());



/***/ }),

/***/ "./2D/advancedDynamicTexture.ts":
/*!**************************************!*\
  !*** ./2D/advancedDynamicTexture.ts ***!
  \**************************************/
/*! exports provided: AdvancedDynamicTexture */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AdvancedDynamicTexture", function() { return AdvancedDynamicTexture; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _controls_container__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./controls/container */ "./2D/controls/container.ts");
/* harmony import */ var _style__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./style */ "./2D/style.ts");
/* harmony import */ var _measure__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./measure */ "./2D/measure.ts");

















/**
* Class used to create texture to support 2D GUI elements
* @see https://doc.babylonjs.com/how_to/gui
*/
var AdvancedDynamicTexture = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(AdvancedDynamicTexture, _super);
    /**
   * Creates a new AdvancedDynamicTexture
   * @param name defines the name of the texture
   * @param width defines the width of the texture
   * @param height defines the height of the texture
   * @param scene defines the hosting scene
   * @param generateMipMaps defines a boolean indicating if mipmaps must be generated (false by default)
   * @param samplingMode defines the texture sampling mode (Texture.NEAREST_SAMPLINGMODE by default)
   */
    function AdvancedDynamicTexture(name, width, height, scene, generateMipMaps, samplingMode) {
        if (width === void 0) { width = 0; }
        if (height === void 0) { height = 0; }
        if (generateMipMaps === void 0) { generateMipMaps = false; }
        if (samplingMode === void 0) { samplingMode = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Texture"].NEAREST_SAMPLINGMODE; }
        var _this = _super.call(this, name, { width: width, height: height }, scene, generateMipMaps, samplingMode, babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Constants"].TEXTUREFORMAT_RGBA) || this;
        _this._isDirty = false;
        /** @hidden */
        _this._rootContainer = new _controls_container__WEBPACK_IMPORTED_MODULE_2__["Container"]("root");
        /** @hidden */
        _this._lastControlOver = {};
        /** @hidden */
        _this._lastControlDown = {};
        /** @hidden */
        _this._capturingControl = {};
        /** @hidden */
        _this._linkedControls = new Array();
        _this._isFullscreen = false;
        _this._fullscreenViewport = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Viewport"](0, 0, 1, 1);
        _this._idealWidth = 0;
        _this._idealHeight = 0;
        _this._useSmallestIdeal = false;
        _this._renderAtIdealSize = false;
        _this._blockNextFocusCheck = false;
        _this._renderScale = 1;
        _this._cursorChanged = false;
        _this._defaultMousePointerId = 0;
        /** @hidden */
        _this._numLayoutCalls = 0;
        /** @hidden */
        _this._numRenderCalls = 0;
        /**
        * Define type to string to ensure compatibility across browsers
        * Safari doesn't support DataTransfer constructor
        */
        _this._clipboardData = "";
        /**
        * Observable event triggered each time an clipboard event is received from the rendering canvas
        */
        _this.onClipboardObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /**
        * Observable event triggered each time a pointer down is intercepted by a control
        */
        _this.onControlPickedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /**
        * Observable event triggered before layout is evaluated
        */
        _this.onBeginLayoutObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /**
        * Observable event triggered after the layout was evaluated
        */
        _this.onEndLayoutObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /**
        * Observable event triggered before the texture is rendered
        */
        _this.onBeginRenderObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /**
        * Observable event triggered after the texture was rendered
        */
        _this.onEndRenderObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /**
        * Gets or sets a boolean defining if alpha is stored as premultiplied
        */
        _this.premulAlpha = false;
        _this._useInvalidateRectOptimization = true;
        // Invalidated rectangle which is the combination of all invalidated controls after they have been rotated into absolute position
        _this._invalidatedRectangle = null;
        _this._clearMeasure = new _measure__WEBPACK_IMPORTED_MODULE_4__["Measure"](0, 0, 0, 0);
        /** @hidden */
        _this.onClipboardCopy = function (rawEvt) {
            var evt = rawEvt;
            var ev = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["ClipboardInfo"](babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["ClipboardEventTypes"].COPY, evt);
            _this.onClipboardObservable.notifyObservers(ev);
            evt.preventDefault();
        };
        /** @hidden */
        _this.onClipboardCut = function (rawEvt) {
            var evt = rawEvt;
            var ev = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["ClipboardInfo"](babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["ClipboardEventTypes"].CUT, evt);
            _this.onClipboardObservable.notifyObservers(ev);
            evt.preventDefault();
        };
        /** @hidden */
        _this.onClipboardPaste = function (rawEvt) {
            var evt = rawEvt;
            var ev = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["ClipboardInfo"](babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["ClipboardEventTypes"].PASTE, evt);
            _this.onClipboardObservable.notifyObservers(ev);
            evt.preventDefault();
        };
        scene = _this.getScene();
        if (!scene || !_this._texture) {
            return _this;
        }
        _this._rootElement = scene.getEngine().getInputElement();
        _this._renderObserver = scene.onBeforeCameraRenderObservable.add(function (camera) { return _this._checkUpdate(camera); });
        _this._preKeyboardObserver = scene.onPreKeyboardObservable.add(function (info) {
            if (!_this._focusedControl) {
                return;
            }
            if (info.type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["KeyboardEventTypes"].KEYDOWN) {
                _this._focusedControl.processKeyboard(info.event);
            }
            info.skipOnPointerObservable = true;
        });
        _this._rootContainer._link(_this);
        _this.hasAlpha = true;
        if (!width || !height) {
            _this._resizeObserver = scene.getEngine().onResizeObservable.add(function () { return _this._onResize(); });
            _this._onResize();
        }
        _this._texture.isReady = true;
        return _this;
    }
    Object.defineProperty(AdvancedDynamicTexture.prototype, "numLayoutCalls", {
        /** Gets the number of layout calls made the last time the ADT has been rendered */
        get: function () {
            return this._numLayoutCalls;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "numRenderCalls", {
        /** Gets the number of render calls made the last time the ADT has been rendered */
        get: function () {
            return this._numRenderCalls;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "renderScale", {
        /**
        * Gets or sets a number used to scale rendering size (2 means that the texture will be twice bigger).
        * Useful when you want more antialiasing
        */
        get: function () {
            return this._renderScale;
        },
        set: function (value) {
            if (value === this._renderScale) {
                return;
            }
            this._renderScale = value;
            this._onResize();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "background", {
        /** Gets or sets the background color */
        get: function () {
            return this._background;
        },
        set: function (value) {
            if (this._background === value) {
                return;
            }
            this._background = value;
            this.markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "idealWidth", {
        /**
        * Gets or sets the ideal width used to design controls.
        * The GUI will then rescale everything accordingly
        * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
        */
        get: function () {
            return this._idealWidth;
        },
        set: function (value) {
            if (this._idealWidth === value) {
                return;
            }
            this._idealWidth = value;
            this.markAsDirty();
            this._rootContainer._markAllAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "idealHeight", {
        /**
        * Gets or sets the ideal height used to design controls.
        * The GUI will then rescale everything accordingly
        * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
        */
        get: function () {
            return this._idealHeight;
        },
        set: function (value) {
            if (this._idealHeight === value) {
                return;
            }
            this._idealHeight = value;
            this.markAsDirty();
            this._rootContainer._markAllAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "useSmallestIdeal", {
        /**
        * Gets or sets a boolean indicating if the smallest ideal value must be used if idealWidth and idealHeight are both set
        * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
        */
        get: function () {
            return this._useSmallestIdeal;
        },
        set: function (value) {
            if (this._useSmallestIdeal === value) {
                return;
            }
            this._useSmallestIdeal = value;
            this.markAsDirty();
            this._rootContainer._markAllAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "renderAtIdealSize", {
        /**
        * Gets or sets a boolean indicating if adaptive scaling must be used
        * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
        */
        get: function () {
            return this._renderAtIdealSize;
        },
        set: function (value) {
            if (this._renderAtIdealSize === value) {
                return;
            }
            this._renderAtIdealSize = value;
            this._onResize();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "idealRatio", {
        /**
         * Gets the ratio used when in "ideal mode"
        * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
         * */
        get: function () {
            var rwidth = 0;
            var rheight = 0;
            if (this._idealWidth) {
                rwidth = (this.getSize().width) / this._idealWidth;
            }
            if (this._idealHeight) {
                rheight = (this.getSize().height) / this._idealHeight;
            }
            if (this._useSmallestIdeal && this._idealWidth && this._idealHeight) {
                return window.innerWidth < window.innerHeight ? rwidth : rheight;
            }
            if (this._idealWidth) { // horizontal
                return rwidth;
            }
            if (this._idealHeight) { // vertical
                return rheight;
            }
            return 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "layer", {
        /**
        * Gets the underlying layer used to render the texture when in fullscreen mode
        */
        get: function () {
            return this._layerToDispose;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "rootContainer", {
        /**
        * Gets the root container control
        */
        get: function () {
            return this._rootContainer;
        },
        enumerable: false,
        configurable: true
    });
    /**
    * Returns an array containing the root container.
    * This is mostly used to let the Inspector introspects the ADT
    * @returns an array containing the rootContainer
    */
    AdvancedDynamicTexture.prototype.getChildren = function () {
        return [this._rootContainer];
    };
    /**
    * Will return all controls that are inside this texture
    * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
    * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
    * @return all child controls
    */
    AdvancedDynamicTexture.prototype.getDescendants = function (directDescendantsOnly, predicate) {
        return this._rootContainer.getDescendants(directDescendantsOnly, predicate);
    };
    Object.defineProperty(AdvancedDynamicTexture.prototype, "focusedControl", {
        /**
        * Gets or sets the current focused control
        */
        get: function () {
            return this._focusedControl;
        },
        set: function (control) {
            if (this._focusedControl == control) {
                return;
            }
            if (this._focusedControl) {
                this._focusedControl.onBlur();
            }
            if (control) {
                control.onFocus();
            }
            this._focusedControl = control;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "isForeground", {
        /**
        * Gets or sets a boolean indicating if the texture must be rendered in background or foreground when in fullscreen mode
        */
        get: function () {
            if (!this.layer) {
                return true;
            }
            return (!this.layer.isBackground);
        },
        set: function (value) {
            if (!this.layer) {
                return;
            }
            if (this.layer.isBackground === !value) {
                return;
            }
            this.layer.isBackground = !value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "clipboardData", {
        /**
        * Gets or set information about clipboardData
        */
        get: function () {
            return this._clipboardData;
        },
        set: function (value) {
            this._clipboardData = value;
        },
        enumerable: false,
        configurable: true
    });
    /**
    * Get the current class name of the texture useful for serialization or dynamic coding.
    * @returns "AdvancedDynamicTexture"
    */
    AdvancedDynamicTexture.prototype.getClassName = function () {
        return "AdvancedDynamicTexture";
    };
    /**
    * Function used to execute a function on all controls
    * @param func defines the function to execute
    * @param container defines the container where controls belong. If null the root container will be used
    */
    AdvancedDynamicTexture.prototype.executeOnAllControls = function (func, container) {
        if (!container) {
            container = this._rootContainer;
        }
        func(container);
        for (var _i = 0, _a = container.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (child.children) {
                this.executeOnAllControls(func, child);
                continue;
            }
            func(child);
        }
    };
    Object.defineProperty(AdvancedDynamicTexture.prototype, "useInvalidateRectOptimization", {
        /**
         * Gets or sets a boolean indicating if the InvalidateRect optimization should be turned on
         */
        get: function () {
            return this._useInvalidateRectOptimization;
        },
        set: function (value) {
            this._useInvalidateRectOptimization = value;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Invalidates a rectangle area on the gui texture
     * @param invalidMinX left most position of the rectangle to invalidate in the texture
     * @param invalidMinY top most position of the rectangle to invalidate in the texture
     * @param invalidMaxX right most position of the rectangle to invalidate in the texture
     * @param invalidMaxY bottom most position of the rectangle to invalidate in the texture
     */
    AdvancedDynamicTexture.prototype.invalidateRect = function (invalidMinX, invalidMinY, invalidMaxX, invalidMaxY) {
        if (!this._useInvalidateRectOptimization) {
            return;
        }
        if (!this._invalidatedRectangle) {
            this._invalidatedRectangle = new _measure__WEBPACK_IMPORTED_MODULE_4__["Measure"](invalidMinX, invalidMinY, invalidMaxX - invalidMinX + 1, invalidMaxY - invalidMinY + 1);
        }
        else {
            // Compute intersection
            var maxX = Math.ceil(Math.max(this._invalidatedRectangle.left + this._invalidatedRectangle.width - 1, invalidMaxX));
            var maxY = Math.ceil(Math.max(this._invalidatedRectangle.top + this._invalidatedRectangle.height - 1, invalidMaxY));
            this._invalidatedRectangle.left = Math.floor(Math.min(this._invalidatedRectangle.left, invalidMinX));
            this._invalidatedRectangle.top = Math.floor(Math.min(this._invalidatedRectangle.top, invalidMinY));
            this._invalidatedRectangle.width = maxX - this._invalidatedRectangle.left + 1;
            this._invalidatedRectangle.height = maxY - this._invalidatedRectangle.top + 1;
        }
    };
    /**
    * Marks the texture as dirty forcing a complete update
    */
    AdvancedDynamicTexture.prototype.markAsDirty = function () {
        this._isDirty = true;
    };
    /**
    * Helper function used to create a new style
    * @returns a new style
    * @see https://doc.babylonjs.com/how_to/gui#styles
    */
    AdvancedDynamicTexture.prototype.createStyle = function () {
        return new _style__WEBPACK_IMPORTED_MODULE_3__["Style"](this);
    };
    /**
    * Adds a new control to the root container
    * @param control defines the control to add
    * @returns the current texture
    */
    AdvancedDynamicTexture.prototype.addControl = function (control) {
        this._rootContainer.addControl(control);
        return this;
    };
    /**
    * Removes a control from the root container
    * @param control defines the control to remove
    * @returns the current texture
    */
    AdvancedDynamicTexture.prototype.removeControl = function (control) {
        this._rootContainer.removeControl(control);
        return this;
    };
    /**
    * Release all resources
    */
    AdvancedDynamicTexture.prototype.dispose = function () {
        var scene = this.getScene();
        if (!scene) {
            return;
        }
        this._rootElement = null;
        scene.onBeforeCameraRenderObservable.remove(this._renderObserver);
        if (this._resizeObserver) {
            scene.getEngine().onResizeObservable.remove(this._resizeObserver);
        }
        if (this._pointerMoveObserver) {
            scene.onPrePointerObservable.remove(this._pointerMoveObserver);
        }
        if (this._pointerObserver) {
            scene.onPointerObservable.remove(this._pointerObserver);
        }
        if (this._preKeyboardObserver) {
            scene.onPreKeyboardObservable.remove(this._preKeyboardObserver);
        }
        if (this._canvasPointerOutObserver) {
            scene.getEngine().onCanvasPointerOutObservable.remove(this._canvasPointerOutObserver);
        }
        if (this._canvasBlurObserver) {
            scene.getEngine().onCanvasBlurObservable.remove(this._canvasBlurObserver);
        }
        if (this._layerToDispose) {
            this._layerToDispose.texture = null;
            this._layerToDispose.dispose();
            this._layerToDispose = null;
        }
        this._rootContainer.dispose();
        this.onClipboardObservable.clear();
        this.onControlPickedObservable.clear();
        this.onBeginRenderObservable.clear();
        this.onEndRenderObservable.clear();
        this.onBeginLayoutObservable.clear();
        this.onEndLayoutObservable.clear();
        _super.prototype.dispose.call(this);
    };
    AdvancedDynamicTexture.prototype._onResize = function () {
        var scene = this.getScene();
        if (!scene) {
            return;
        }
        // Check size
        var engine = scene.getEngine();
        var textureSize = this.getSize();
        var renderWidth = engine.getRenderWidth() * this._renderScale;
        var renderHeight = engine.getRenderHeight() * this._renderScale;
        if (this._renderAtIdealSize) {
            if (this._idealWidth) {
                renderHeight = (renderHeight * this._idealWidth) / renderWidth;
                renderWidth = this._idealWidth;
            }
            else if (this._idealHeight) {
                renderWidth = (renderWidth * this._idealHeight) / renderHeight;
                renderHeight = this._idealHeight;
            }
        }
        if (textureSize.width !== renderWidth || textureSize.height !== renderHeight) {
            this.scaleTo(renderWidth, renderHeight);
            this.markAsDirty();
            if (this._idealWidth || this._idealHeight) {
                this._rootContainer._markAllAsDirty();
            }
        }
        this.invalidateRect(0, 0, textureSize.width - 1, textureSize.height - 1);
    };
    /** @hidden */
    AdvancedDynamicTexture.prototype._getGlobalViewport = function (scene) {
        var engine = scene.getEngine();
        return this._fullscreenViewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    };
    /**
    * Get screen coordinates for a vector3
    * @param position defines the position to project
    * @param worldMatrix defines the world matrix to use
    * @returns the projected position
    */
    AdvancedDynamicTexture.prototype.getProjectedPosition = function (position, worldMatrix) {
        var scene = this.getScene();
        if (!scene) {
            return babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Vector2"].Zero();
        }
        var globalViewport = this._getGlobalViewport(scene);
        var projectedPosition = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Vector3"].Project(position, worldMatrix, scene.getTransformMatrix(), globalViewport);
        projectedPosition.scaleInPlace(this.renderScale);
        return new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Vector2"](projectedPosition.x, projectedPosition.y);
    };
    AdvancedDynamicTexture.prototype._checkUpdate = function (camera) {
        if (this._layerToDispose) {
            if ((camera.layerMask & this._layerToDispose.layerMask) === 0) {
                return;
            }
        }
        if (this._isFullscreen && this._linkedControls.length) {
            var scene = this.getScene();
            if (!scene) {
                return;
            }
            var globalViewport = this._getGlobalViewport(scene);
            var _loop_1 = function (control) {
                if (!control.isVisible) {
                    return "continue";
                }
                var mesh = control._linkedMesh;
                if (!mesh || mesh.isDisposed()) {
                    babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Tools"].SetImmediate(function () {
                        control.linkWithMesh(null);
                    });
                    return "continue";
                }
                var position = mesh.getBoundingInfo ? mesh.getBoundingInfo().boundingSphere.center : babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Vector3"].ZeroReadOnly;
                var projectedPosition = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Vector3"].Project(position, mesh.getWorldMatrix(), scene.getTransformMatrix(), globalViewport);
                if (projectedPosition.z < 0 || projectedPosition.z > 1) {
                    control.notRenderable = true;
                    return "continue";
                }
                control.notRenderable = false;
                // Account for RenderScale.
                projectedPosition.scaleInPlace(this_1.renderScale);
                control._moveToProjectedPosition(projectedPosition);
            };
            var this_1 = this;
            for (var _i = 0, _a = this._linkedControls; _i < _a.length; _i++) {
                var control = _a[_i];
                _loop_1(control);
            }
        }
        if (!this._isDirty && !this._rootContainer.isDirty) {
            return;
        }
        this._isDirty = false;
        this._render();
        this.update(true, this.premulAlpha);
    };
    AdvancedDynamicTexture.prototype._render = function () {
        var textureSize = this.getSize();
        var renderWidth = textureSize.width;
        var renderHeight = textureSize.height;
        var context = this.getContext();
        context.font = "18px Arial";
        context.strokeStyle = "white";
        // Layout
        this.onBeginLayoutObservable.notifyObservers(this);
        var measure = new _measure__WEBPACK_IMPORTED_MODULE_4__["Measure"](0, 0, renderWidth, renderHeight);
        this._numLayoutCalls = 0;
        this._rootContainer._layout(measure, context);
        this.onEndLayoutObservable.notifyObservers(this);
        this._isDirty = false; // Restoring the dirty state that could have been set by controls during layout processing
        // Clear
        if (this._invalidatedRectangle) {
            this._clearMeasure.copyFrom(this._invalidatedRectangle);
        }
        else {
            this._clearMeasure.copyFromFloats(0, 0, renderWidth, renderHeight);
        }
        context.clearRect(this._clearMeasure.left, this._clearMeasure.top, this._clearMeasure.width, this._clearMeasure.height);
        if (this._background) {
            context.save();
            context.fillStyle = this._background;
            context.fillRect(this._clearMeasure.left, this._clearMeasure.top, this._clearMeasure.width, this._clearMeasure.height);
            context.restore();
        }
        // Render
        this.onBeginRenderObservable.notifyObservers(this);
        this._numRenderCalls = 0;
        this._rootContainer._render(context, this._invalidatedRectangle);
        this.onEndRenderObservable.notifyObservers(this);
        this._invalidatedRectangle = null;
    };
    /** @hidden */
    AdvancedDynamicTexture.prototype._changeCursor = function (cursor) {
        if (this._rootElement) {
            this._rootElement.style.cursor = cursor;
            this._cursorChanged = true;
        }
    };
    /** @hidden */
    AdvancedDynamicTexture.prototype._registerLastControlDown = function (control, pointerId) {
        this._lastControlDown[pointerId] = control;
        this.onControlPickedObservable.notifyObservers(control);
    };
    AdvancedDynamicTexture.prototype._doPicking = function (x, y, type, pointerId, buttonIndex, deltaX, deltaY) {
        var scene = this.getScene();
        if (!scene) {
            return;
        }
        var engine = scene.getEngine();
        var textureSize = this.getSize();
        if (this._isFullscreen) {
            var camera = scene.cameraToUseForPointers || scene.activeCamera;
            var viewport = camera.viewport;
            x = x * (textureSize.width / (engine.getRenderWidth() * viewport.width));
            y = y * (textureSize.height / (engine.getRenderHeight() * viewport.height));
        }
        if (this._capturingControl[pointerId]) {
            this._capturingControl[pointerId]._processObservables(type, x, y, pointerId, buttonIndex);
            return;
        }
        this._cursorChanged = false;
        if (!this._rootContainer._processPicking(x, y, type, pointerId, buttonIndex, deltaX, deltaY)) {
            this._changeCursor("");
            if (type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["PointerEventTypes"].POINTERMOVE) {
                if (this._lastControlOver[pointerId]) {
                    this._lastControlOver[pointerId]._onPointerOut(this._lastControlOver[pointerId]);
                    delete this._lastControlOver[pointerId];
                }
            }
        }
        if (!this._cursorChanged) {
            this._changeCursor("");
        }
        this._manageFocus();
    };
    /** @hidden */
    AdvancedDynamicTexture.prototype._cleanControlAfterRemovalFromList = function (list, control) {
        for (var pointerId in list) {
            if (!list.hasOwnProperty(pointerId)) {
                continue;
            }
            var lastControlOver = list[pointerId];
            if (lastControlOver === control) {
                delete list[pointerId];
            }
        }
    };
    /** @hidden */
    AdvancedDynamicTexture.prototype._cleanControlAfterRemoval = function (control) {
        this._cleanControlAfterRemovalFromList(this._lastControlDown, control);
        this._cleanControlAfterRemovalFromList(this._lastControlOver, control);
    };
    /** Attach to all scene events required to support pointer events */
    AdvancedDynamicTexture.prototype.attach = function () {
        var _this = this;
        var scene = this.getScene();
        if (!scene) {
            return;
        }
        var tempViewport = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Viewport"](0, 0, 0, 0);
        this._pointerMoveObserver = scene.onPrePointerObservable.add(function (pi, state) {
            if (scene.isPointerCaptured((pi.event).pointerId)) {
                return;
            }
            if (pi.type !== babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["PointerEventTypes"].POINTERMOVE
                && pi.type !== babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["PointerEventTypes"].POINTERUP
                && pi.type !== babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["PointerEventTypes"].POINTERDOWN
                && pi.type !== babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["PointerEventTypes"].POINTERWHEEL) {
                return;
            }
            if (!scene) {
                return;
            }
            if (pi.type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["PointerEventTypes"].POINTERMOVE && pi.event.pointerId) {
                _this._defaultMousePointerId = pi.event.pointerId; // This is required to make sure we have the correct pointer ID for wheel
            }
            var camera = scene.cameraToUseForPointers || scene.activeCamera;
            var engine = scene.getEngine();
            if (!camera) {
                tempViewport.x = 0;
                tempViewport.y = 0;
                tempViewport.width = engine.getRenderWidth();
                tempViewport.height = engine.getRenderHeight();
            }
            else {
                camera.viewport.toGlobalToRef(engine.getRenderWidth(), engine.getRenderHeight(), tempViewport);
            }
            var x = scene.pointerX / engine.getHardwareScalingLevel() - tempViewport.x;
            var y = scene.pointerY / engine.getHardwareScalingLevel() - (engine.getRenderHeight() - tempViewport.y - tempViewport.height);
            _this._shouldBlockPointer = false;
            // Do picking modifies _shouldBlockPointer
            var pointerId = pi.event.pointerId || _this._defaultMousePointerId;
            _this._doPicking(x, y, pi.type, pointerId, pi.event.button, pi.event.deltaX, pi.event.deltaY);
            // Avoid overwriting a true skipOnPointerObservable to false
            if (_this._shouldBlockPointer) {
                pi.skipOnPointerObservable = _this._shouldBlockPointer;
            }
        });
        this._attachToOnPointerOut(scene);
        this._attachToOnBlur(scene);
    };
    /**
    * Register the clipboard Events onto the canvas
    */
    AdvancedDynamicTexture.prototype.registerClipboardEvents = function () {
        self.addEventListener("copy", this.onClipboardCopy, false);
        self.addEventListener("cut", this.onClipboardCut, false);
        self.addEventListener("paste", this.onClipboardPaste, false);
    };
    /**
     * Unregister the clipboard Events from the canvas
     */
    AdvancedDynamicTexture.prototype.unRegisterClipboardEvents = function () {
        self.removeEventListener("copy", this.onClipboardCopy);
        self.removeEventListener("cut", this.onClipboardCut);
        self.removeEventListener("paste", this.onClipboardPaste);
    };
    /**
    * Connect the texture to a hosting mesh to enable interactions
    * @param mesh defines the mesh to attach to
    * @param supportPointerMove defines a boolean indicating if pointer move events must be catched as well
    */
    AdvancedDynamicTexture.prototype.attachToMesh = function (mesh, supportPointerMove) {
        var _this = this;
        if (supportPointerMove === void 0) { supportPointerMove = true; }
        var scene = this.getScene();
        if (!scene) {
            return;
        }
        this._pointerObserver = scene.onPointerObservable.add(function (pi, state) {
            if (pi.type !== babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["PointerEventTypes"].POINTERMOVE
                && pi.type !== babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["PointerEventTypes"].POINTERUP
                && pi.type !== babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["PointerEventTypes"].POINTERDOWN) {
                return;
            }
            var pointerId = pi.event.pointerId || _this._defaultMousePointerId;
            if (pi.pickInfo && pi.pickInfo.hit && pi.pickInfo.pickedMesh === mesh) {
                var uv = pi.pickInfo.getTextureCoordinates();
                if (uv) {
                    var size = _this.getSize();
                    _this._doPicking(uv.x * size.width, (1.0 - uv.y) * size.height, pi.type, pointerId, pi.event.button);
                }
            }
            else if (pi.type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["PointerEventTypes"].POINTERUP) {
                if (_this._lastControlDown[pointerId]) {
                    _this._lastControlDown[pointerId]._forcePointerUp(pointerId);
                }
                delete _this._lastControlDown[pointerId];
                if (_this.focusedControl) {
                    var friendlyControls = _this.focusedControl.keepsFocusWith();
                    var canMoveFocus = true;
                    if (friendlyControls) {
                        for (var _i = 0, friendlyControls_1 = friendlyControls; _i < friendlyControls_1.length; _i++) {
                            var control = friendlyControls_1[_i];
                            // Same host, no need to keep the focus
                            if (_this === control._host) {
                                continue;
                            }
                            // Different hosts
                            var otherHost = control._host;
                            if (otherHost._lastControlOver[pointerId] && otherHost._lastControlOver[pointerId].isAscendant(control)) {
                                canMoveFocus = false;
                                break;
                            }
                        }
                    }
                    if (canMoveFocus) {
                        _this.focusedControl = null;
                    }
                }
            }
            else if (pi.type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["PointerEventTypes"].POINTERMOVE) {
                if (_this._lastControlOver[pointerId]) {
                    _this._lastControlOver[pointerId]._onPointerOut(_this._lastControlOver[pointerId], true);
                }
                delete _this._lastControlOver[pointerId];
            }
        });
        mesh.enablePointerMoveEvents = supportPointerMove;
        this._attachToOnPointerOut(scene);
        this._attachToOnBlur(scene);
    };
    /**
    * Move the focus to a specific control
    * @param control defines the control which will receive the focus
    */
    AdvancedDynamicTexture.prototype.moveFocusToControl = function (control) {
        this.focusedControl = control;
        this._lastPickedControl = control;
        this._blockNextFocusCheck = true;
    };
    AdvancedDynamicTexture.prototype._manageFocus = function () {
        if (this._blockNextFocusCheck) {
            this._blockNextFocusCheck = false;
            this._lastPickedControl = this._focusedControl;
            return;
        }
        // Focus management
        if (this._focusedControl) {
            if (this._focusedControl !== this._lastPickedControl) {
                if (this._lastPickedControl.isFocusInvisible) {
                    return;
                }
                this.focusedControl = null;
            }
        }
    };
    AdvancedDynamicTexture.prototype._attachToOnPointerOut = function (scene) {
        var _this = this;
        this._canvasPointerOutObserver = scene.getEngine().onCanvasPointerOutObservable.add(function (pointerEvent) {
            if (_this._lastControlOver[pointerEvent.pointerId]) {
                _this._lastControlOver[pointerEvent.pointerId]._onPointerOut(_this._lastControlOver[pointerEvent.pointerId]);
            }
            delete _this._lastControlOver[pointerEvent.pointerId];
            if (_this._lastControlDown[pointerEvent.pointerId] && _this._lastControlDown[pointerEvent.pointerId] !== _this._capturingControl[pointerEvent.pointerId]) {
                _this._lastControlDown[pointerEvent.pointerId]._forcePointerUp();
                delete _this._lastControlDown[pointerEvent.pointerId];
            }
        });
    };
    AdvancedDynamicTexture.prototype._attachToOnBlur = function (scene) {
        var _this = this;
        this._canvasBlurObserver = scene.getEngine().onCanvasBlurObservable.add(function (pointerEvent) {
            Object.entries(_this._lastControlDown).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                value._onCanvasBlur();
            });
            _this._lastControlDown = {};
        });
    };
    // Statics
    /**
     * Creates a new AdvancedDynamicTexture in projected mode (ie. attached to a mesh)
     * @param mesh defines the mesh which will receive the texture
     * @param width defines the texture width (1024 by default)
     * @param height defines the texture height (1024 by default)
     * @param supportPointerMove defines a boolean indicating if the texture must capture move events (true by default)
     * @param onlyAlphaTesting defines a boolean indicating that alpha blending will not be used (only alpha testing) (false by default)
     * @returns a new AdvancedDynamicTexture
     */
    AdvancedDynamicTexture.CreateForMesh = function (mesh, width, height, supportPointerMove, onlyAlphaTesting) {
        if (width === void 0) { width = 1024; }
        if (height === void 0) { height = 1024; }
        if (supportPointerMove === void 0) { supportPointerMove = true; }
        if (onlyAlphaTesting === void 0) { onlyAlphaTesting = false; }
        var result = new AdvancedDynamicTexture(mesh.name + " AdvancedDynamicTexture", width, height, mesh.getScene(), true, babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Texture"].TRILINEAR_SAMPLINGMODE);
        var material = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["StandardMaterial"]("AdvancedDynamicTextureMaterial", mesh.getScene());
        material.backFaceCulling = false;
        material.diffuseColor = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].Black();
        material.specularColor = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].Black();
        if (onlyAlphaTesting) {
            material.diffuseTexture = result;
            material.emissiveTexture = result;
            result.hasAlpha = true;
        }
        else {
            material.emissiveTexture = result;
            material.opacityTexture = result;
        }
        mesh.material = material;
        result.attachToMesh(mesh, supportPointerMove);
        return result;
    };
    /**
    * Creates a new AdvancedDynamicTexture in fullscreen mode.
    * In this mode the texture will rely on a layer for its rendering.
    * This allows it to be treated like any other layer.
    * As such, if you have a multi camera setup, you can set the layerMask on the GUI as well.
    * LayerMask is set through advancedTexture.layer.layerMask
    * @param name defines name for the texture
    * @param foreground defines a boolean indicating if the texture must be rendered in foreground (default is true)
    * @param scene defines the hsoting scene
    * @param sampling defines the texture sampling mode (Texture.BILINEAR_SAMPLINGMODE by default)
    * @returns a new AdvancedDynamicTexture
    */
    AdvancedDynamicTexture.CreateFullscreenUI = function (name, foreground, scene, sampling) {
        if (foreground === void 0) { foreground = true; }
        if (scene === void 0) { scene = null; }
        if (sampling === void 0) { sampling = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Texture"].BILINEAR_SAMPLINGMODE; }
        var result = new AdvancedDynamicTexture(name, 0, 0, scene, false, sampling);
        // Display
        var layer = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Layer"](name + "_layer", null, scene, !foreground);
        layer.texture = result;
        result._layerToDispose = layer;
        result._isFullscreen = true;
        // Attach
        result.attach();
        return result;
    };
    return AdvancedDynamicTexture;
}(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["DynamicTexture"]));



/***/ }),

/***/ "./2D/controls/button.ts":
/*!*******************************!*\
  !*** ./2D/controls/button.ts ***!
  \*******************************/
/*! exports provided: Button */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Button", function() { return Button; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _rectangle__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./rectangle */ "./2D/controls/rectangle.ts");
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var _textBlock__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./textBlock */ "./2D/controls/textBlock.ts");
/* harmony import */ var _image__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./image */ "./2D/controls/image.ts");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! babylonjs/Misc/typeStore */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_5__);






/**
 * Class used to create 2D buttons
 */
var Button = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Button, _super);
    /**
     * Creates a new Button
     * @param name defines the name of the button
     */
    function Button(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        /**
         * Gets or sets a boolean indicating that the button will let internal controls handle picking instead of doing it directly using its bounding info
         */
        _this.delegatePickingToChildren = false;
        _this.thickness = 1;
        _this.isPointerBlocker = true;
        var alphaStore = null;
        _this.pointerEnterAnimation = function () {
            alphaStore = _this.alpha;
            _this.alpha -= 0.1;
        };
        _this.pointerOutAnimation = function () {
            if (alphaStore !== null) {
                _this.alpha = alphaStore;
            }
        };
        _this.pointerDownAnimation = function () {
            _this.scaleX -= 0.05;
            _this.scaleY -= 0.05;
        };
        _this.pointerUpAnimation = function () {
            _this.scaleX += 0.05;
            _this.scaleY += 0.05;
        };
        return _this;
    }
    Object.defineProperty(Button.prototype, "image", {
        /**
         * Returns the image part of the button (if any)
         */
        get: function () {
            return this._image;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Button.prototype, "textBlock", {
        /**
         * Returns the image part of the button (if any)
         */
        get: function () {
            return this._textBlock;
        },
        enumerable: false,
        configurable: true
    });
    Button.prototype._getTypeName = function () {
        return "Button";
    };
    // While being a container, the button behaves like a control.
    /** @hidden */
    Button.prototype._processPicking = function (x, y, type, pointerId, buttonIndex, deltaX, deltaY) {
        if (!this._isEnabled || !this.isHitTestVisible || !this.isVisible || this.notRenderable) {
            return false;
        }
        if (!_super.prototype.contains.call(this, x, y)) {
            return false;
        }
        if (this.delegatePickingToChildren) {
            var contains = false;
            for (var index = this._children.length - 1; index >= 0; index--) {
                var child = this._children[index];
                if (child.isEnabled && child.isHitTestVisible && child.isVisible && !child.notRenderable && child.contains(x, y)) {
                    contains = true;
                    break;
                }
            }
            if (!contains) {
                return false;
            }
        }
        this._processObservables(type, x, y, pointerId, buttonIndex, deltaX, deltaY);
        return true;
    };
    /** @hidden */
    Button.prototype._onPointerEnter = function (target) {
        if (!_super.prototype._onPointerEnter.call(this, target)) {
            return false;
        }
        if (this.pointerEnterAnimation) {
            this.pointerEnterAnimation();
        }
        return true;
    };
    /** @hidden */
    Button.prototype._onPointerOut = function (target, force) {
        if (force === void 0) { force = false; }
        if (this.pointerOutAnimation) {
            this.pointerOutAnimation();
        }
        _super.prototype._onPointerOut.call(this, target, force);
    };
    /** @hidden */
    Button.prototype._onPointerDown = function (target, coordinates, pointerId, buttonIndex) {
        if (!_super.prototype._onPointerDown.call(this, target, coordinates, pointerId, buttonIndex)) {
            return false;
        }
        if (this.pointerDownAnimation) {
            this.pointerDownAnimation();
        }
        return true;
    };
    /** @hidden */
    Button.prototype._onPointerUp = function (target, coordinates, pointerId, buttonIndex, notifyClick) {
        if (this.pointerUpAnimation) {
            this.pointerUpAnimation();
        }
        _super.prototype._onPointerUp.call(this, target, coordinates, pointerId, buttonIndex, notifyClick);
    };
    // Statics
    /**
     * Creates a new button made with an image and a text
     * @param name defines the name of the button
     * @param text defines the text of the button
     * @param imageUrl defines the url of the image
     * @returns a new Button
     */
    Button.CreateImageButton = function (name, text, imageUrl) {
        var result = new Button(name);
        // Adding text
        var textBlock = new _textBlock__WEBPACK_IMPORTED_MODULE_3__["TextBlock"](name + "_button", text);
        textBlock.textWrapping = true;
        textBlock.textHorizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.paddingLeft = "20%";
        result.addControl(textBlock);
        // Adding image
        var iconImage = new _image__WEBPACK_IMPORTED_MODULE_4__["Image"](name + "_icon", imageUrl);
        iconImage.width = "20%";
        iconImage.stretch = _image__WEBPACK_IMPORTED_MODULE_4__["Image"].STRETCH_UNIFORM;
        iconImage.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        result.addControl(iconImage);
        // Store
        result._image = iconImage;
        result._textBlock = textBlock;
        return result;
    };
    /**
     * Creates a new button made with an image
     * @param name defines the name of the button
     * @param imageUrl defines the url of the image
     * @returns a new Button
     */
    Button.CreateImageOnlyButton = function (name, imageUrl) {
        var result = new Button(name);
        // Adding image
        var iconImage = new _image__WEBPACK_IMPORTED_MODULE_4__["Image"](name + "_icon", imageUrl);
        iconImage.stretch = _image__WEBPACK_IMPORTED_MODULE_4__["Image"].STRETCH_FILL;
        iconImage.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        result.addControl(iconImage);
        // Store
        result._image = iconImage;
        return result;
    };
    /**
     * Creates a new button made with a text
     * @param name defines the name of the button
     * @param text defines the text of the button
     * @returns a new Button
     */
    Button.CreateSimpleButton = function (name, text) {
        var result = new Button(name);
        // Adding text
        var textBlock = new _textBlock__WEBPACK_IMPORTED_MODULE_3__["TextBlock"](name + "_button", text);
        textBlock.textWrapping = true;
        textBlock.textHorizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_CENTER;
        result.addControl(textBlock);
        // Store
        result._textBlock = textBlock;
        return result;
    };
    /**
     * Creates a new button made with an image and a centered text
     * @param name defines the name of the button
     * @param text defines the text of the button
     * @param imageUrl defines the url of the image
     * @returns a new Button
     */
    Button.CreateImageWithCenterTextButton = function (name, text, imageUrl) {
        var result = new Button(name);
        // Adding image
        var iconImage = new _image__WEBPACK_IMPORTED_MODULE_4__["Image"](name + "_icon", imageUrl);
        iconImage.stretch = _image__WEBPACK_IMPORTED_MODULE_4__["Image"].STRETCH_FILL;
        result.addControl(iconImage);
        // Adding text
        var textBlock = new _textBlock__WEBPACK_IMPORTED_MODULE_3__["TextBlock"](name + "_button", text);
        textBlock.textWrapping = true;
        textBlock.textHorizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_CENTER;
        result.addControl(textBlock);
        // Store
        result._image = iconImage;
        result._textBlock = textBlock;
        return result;
    };
    return Button;
}(_rectangle__WEBPACK_IMPORTED_MODULE_1__["Rectangle"]));

babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_5__["_TypeStore"].RegisteredTypes["BABYLON.GUI.Button"] = Button;


/***/ }),

/***/ "./2D/controls/checkbox.ts":
/*!*********************************!*\
  !*** ./2D/controls/checkbox.ts ***!
  \*********************************/
/*! exports provided: Checkbox */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Checkbox", function() { return Checkbox; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var _stackPanel__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./stackPanel */ "./2D/controls/stackPanel.ts");
/* harmony import */ var _textBlock__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./textBlock */ "./2D/controls/textBlock.ts");






/**
 * Class used to represent a 2D checkbox
 */
var Checkbox = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Checkbox, _super);
    /**
     * Creates a new CheckBox
     * @param name defines the control name
     */
    function Checkbox(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._isChecked = false;
        _this._background = "black";
        _this._checkSizeRatio = 0.8;
        _this._thickness = 1;
        /**
         * Observable raised when isChecked property changes
         */
        _this.onIsCheckedChangedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        _this.isPointerBlocker = true;
        return _this;
    }
    Object.defineProperty(Checkbox.prototype, "thickness", {
        /** Gets or sets border thickness  */
        get: function () {
            return this._thickness;
        },
        set: function (value) {
            if (this._thickness === value) {
                return;
            }
            this._thickness = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Checkbox.prototype, "checkSizeRatio", {
        /** Gets or sets a value indicating the ratio between overall size and check size */
        get: function () {
            return this._checkSizeRatio;
        },
        set: function (value) {
            value = Math.max(Math.min(1, value), 0);
            if (this._checkSizeRatio === value) {
                return;
            }
            this._checkSizeRatio = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Checkbox.prototype, "background", {
        /** Gets or sets background color */
        get: function () {
            return this._background;
        },
        set: function (value) {
            if (this._background === value) {
                return;
            }
            this._background = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Checkbox.prototype, "isChecked", {
        /** Gets or sets a boolean indicating if the checkbox is checked or not */
        get: function () {
            return this._isChecked;
        },
        set: function (value) {
            if (this._isChecked === value) {
                return;
            }
            this._isChecked = value;
            this._markAsDirty();
            this.onIsCheckedChangedObservable.notifyObservers(value);
        },
        enumerable: false,
        configurable: true
    });
    Checkbox.prototype._getTypeName = function () {
        return "Checkbox";
    };
    /** @hidden */
    Checkbox.prototype._draw = function (context, invalidatedRectangle) {
        context.save();
        this._applyStates(context);
        var actualWidth = this._currentMeasure.width - this._thickness;
        var actualHeight = this._currentMeasure.height - this._thickness;
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }
        context.fillStyle = this._isEnabled ? this._background : this._disabledColor;
        context.fillRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2, actualWidth, actualHeight);
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }
        if (this._isChecked) {
            context.fillStyle = this._isEnabled ? this.color : this._disabledColorItem;
            var offsetWidth = actualWidth * this._checkSizeRatio;
            var offseHeight = actualHeight * this._checkSizeRatio;
            context.fillRect(this._currentMeasure.left + this._thickness / 2 + (actualWidth - offsetWidth) / 2, this._currentMeasure.top + this._thickness / 2 + (actualHeight - offseHeight) / 2, offsetWidth, offseHeight);
        }
        context.strokeStyle = this.color;
        context.lineWidth = this._thickness;
        context.strokeRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2, actualWidth, actualHeight);
        context.restore();
    };
    // Events
    /** @hidden */
    Checkbox.prototype._onPointerDown = function (target, coordinates, pointerId, buttonIndex) {
        if (!_super.prototype._onPointerDown.call(this, target, coordinates, pointerId, buttonIndex)) {
            return false;
        }
        this.isChecked = !this.isChecked;
        return true;
    };
    /**
     * Utility function to easily create a checkbox with a header
     * @param title defines the label to use for the header
     * @param onValueChanged defines the callback to call when value changes
     * @returns a StackPanel containing the checkbox and a textBlock
     */
    Checkbox.AddCheckBoxWithHeader = function (title, onValueChanged) {
        var panel = new _stackPanel__WEBPACK_IMPORTED_MODULE_3__["StackPanel"]();
        panel.isVertical = false;
        panel.height = "30px";
        var checkbox = new Checkbox();
        checkbox.width = "20px";
        checkbox.height = "20px";
        checkbox.isChecked = true;
        checkbox.color = "green";
        checkbox.onIsCheckedChangedObservable.add(onValueChanged);
        panel.addControl(checkbox);
        var header = new _textBlock__WEBPACK_IMPORTED_MODULE_4__["TextBlock"]();
        header.text = title;
        header.width = "180px";
        header.paddingLeft = "5px";
        header.textHorizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        header.color = "white";
        panel.addControl(header);
        return panel;
    };
    return Checkbox;
}(_control__WEBPACK_IMPORTED_MODULE_2__["Control"]));

babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GUI.Checkbox"] = Checkbox;


/***/ }),

/***/ "./2D/controls/colorpicker.ts":
/*!************************************!*\
  !*** ./2D/controls/colorpicker.ts ***!
  \************************************/
/*! exports provided: ColorPicker */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ColorPicker", function() { return ColorPicker; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var _inputText__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./inputText */ "./2D/controls/inputText.ts");
/* harmony import */ var _rectangle__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./rectangle */ "./2D/controls/rectangle.ts");
/* harmony import */ var _button__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./button */ "./2D/controls/button.ts");
/* harmony import */ var _grid__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./grid */ "./2D/controls/grid.ts");
/* harmony import */ var _controls_textBlock__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../controls/textBlock */ "./2D/controls/textBlock.ts");










/** Class used to create color pickers */
var ColorPicker = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(ColorPicker, _super);
    /**
     * Creates a new ColorPicker
     * @param name defines the control name
     */
    function ColorPicker(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._value = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].Red();
        _this._tmpColor = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"]();
        _this._pointerStartedOnSquare = false;
        _this._pointerStartedOnWheel = false;
        _this._squareLeft = 0;
        _this._squareTop = 0;
        _this._squareSize = 0;
        _this._h = 360;
        _this._s = 1;
        _this._v = 1;
        _this._lastPointerDownID = -1;
        /**
         * Observable raised when the value changes
         */
        _this.onValueChangedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        // Events
        _this._pointerIsDown = false;
        _this.value = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"](.88, .1, .1);
        _this.size = "200px";
        _this.isPointerBlocker = true;
        return _this;
    }
    Object.defineProperty(ColorPicker.prototype, "value", {
        /** Gets or sets the color of the color picker */
        get: function () {
            return this._value;
        },
        set: function (value) {
            if (this._value.equals(value)) {
                return;
            }
            this._value.copyFrom(value);
            this._value.toHSVToRef(this._tmpColor);
            this._h = this._tmpColor.r;
            this._s = Math.max(this._tmpColor.g, 0.00001);
            this._v = Math.max(this._tmpColor.b, 0.00001);
            this._markAsDirty();
            if (this._value.r <= ColorPicker._Epsilon) {
                this._value.r = 0;
            }
            if (this._value.g <= ColorPicker._Epsilon) {
                this._value.g = 0;
            }
            if (this._value.b <= ColorPicker._Epsilon) {
                this._value.b = 0;
            }
            if (this._value.r >= 1.0 - ColorPicker._Epsilon) {
                this._value.r = 1.0;
            }
            if (this._value.g >= 1.0 - ColorPicker._Epsilon) {
                this._value.g = 1.0;
            }
            if (this._value.b >= 1.0 - ColorPicker._Epsilon) {
                this._value.b = 1.0;
            }
            this.onValueChangedObservable.notifyObservers(this._value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ColorPicker.prototype, "width", {
        /**
         * Gets or sets control width
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._width.toString(this._host);
        },
        set: function (value) {
            if (this._width.toString(this._host) === value) {
                return;
            }
            if (this._width.fromString(value)) {
                this._height.fromString(value);
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ColorPicker.prototype, "height", {
        /**
         * Gets or sets control height
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._height.toString(this._host);
        },
        /** Gets or sets control height */
        set: function (value) {
            if (this._height.toString(this._host) === value) {
                return;
            }
            if (this._height.fromString(value)) {
                this._width.fromString(value);
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ColorPicker.prototype, "size", {
        /** Gets or sets control size */
        get: function () {
            return this.width;
        },
        set: function (value) {
            this.width = value;
        },
        enumerable: false,
        configurable: true
    });
    ColorPicker.prototype._getTypeName = function () {
        return "ColorPicker";
    };
    /** @hidden */
    ColorPicker.prototype._preMeasure = function (parentMeasure, context) {
        if (parentMeasure.width < parentMeasure.height) {
            this._currentMeasure.height = parentMeasure.width;
        }
        else {
            this._currentMeasure.width = parentMeasure.height;
        }
    };
    ColorPicker.prototype._updateSquareProps = function () {
        var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height) * .5;
        var wheelThickness = radius * .2;
        var innerDiameter = (radius - wheelThickness) * 2;
        var squareSize = innerDiameter / (Math.sqrt(2));
        var offset = radius - squareSize * .5;
        this._squareLeft = this._currentMeasure.left + offset;
        this._squareTop = this._currentMeasure.top + offset;
        this._squareSize = squareSize;
    };
    ColorPicker.prototype._drawGradientSquare = function (hueValue, left, top, width, height, context) {
        var lgh = context.createLinearGradient(left, top, width + left, top);
        lgh.addColorStop(0, '#fff');
        lgh.addColorStop(1, 'hsl(' + hueValue + ', 100%, 50%)');
        context.fillStyle = lgh;
        context.fillRect(left, top, width, height);
        var lgv = context.createLinearGradient(left, top, left, height + top);
        lgv.addColorStop(0, 'rgba(0,0,0,0)');
        lgv.addColorStop(1, '#000');
        context.fillStyle = lgv;
        context.fillRect(left, top, width, height);
    };
    ColorPicker.prototype._drawCircle = function (centerX, centerY, radius, context) {
        context.beginPath();
        context.arc(centerX, centerY, radius + 1, 0, 2 * Math.PI, false);
        context.lineWidth = 3;
        context.strokeStyle = '#333333';
        context.stroke();
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.lineWidth = 3;
        context.strokeStyle = '#ffffff';
        context.stroke();
    };
    ColorPicker.prototype._createColorWheelCanvas = function (radius, thickness) {
        var canvas = document.createElement("canvas");
        canvas.width = radius * 2;
        canvas.height = radius * 2;
        var context = canvas.getContext("2d");
        var image = context.getImageData(0, 0, radius * 2, radius * 2);
        var data = image.data;
        var color = this._tmpColor;
        var maxDistSq = radius * radius;
        var innerRadius = radius - thickness;
        var minDistSq = innerRadius * innerRadius;
        for (var x = -radius; x < radius; x++) {
            for (var y = -radius; y < radius; y++) {
                var distSq = x * x + y * y;
                if (distSq > maxDistSq || distSq < minDistSq) {
                    continue;
                }
                var dist = Math.sqrt(distSq);
                var ang = Math.atan2(y, x);
                babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].HSVtoRGBToRef(ang * 180 / Math.PI + 180, dist / radius, 1, color);
                var index = ((x + radius) + ((y + radius) * 2 * radius)) * 4;
                data[index] = color.r * 255;
                data[index + 1] = color.g * 255;
                data[index + 2] = color.b * 255;
                var alphaRatio = (dist - innerRadius) / (radius - innerRadius);
                //apply less alpha to bigger color pickers
                var alphaAmount = .2;
                var maxAlpha = .2;
                var minAlpha = .04;
                var lowerRadius = 50;
                var upperRadius = 150;
                if (radius < lowerRadius) {
                    alphaAmount = maxAlpha;
                }
                else if (radius > upperRadius) {
                    alphaAmount = minAlpha;
                }
                else {
                    alphaAmount = (minAlpha - maxAlpha) * (radius - lowerRadius) / (upperRadius - lowerRadius) + maxAlpha;
                }
                var alphaRatio = (dist - innerRadius) / (radius - innerRadius);
                if (alphaRatio < alphaAmount) {
                    data[index + 3] = 255 * (alphaRatio / alphaAmount);
                }
                else if (alphaRatio > 1 - alphaAmount) {
                    data[index + 3] = 255 * (1.0 - ((alphaRatio - (1 - alphaAmount)) / alphaAmount));
                }
                else {
                    data[index + 3] = 255;
                }
            }
        }
        context.putImageData(image, 0, 0);
        return canvas;
    };
    /** @hidden */
    ColorPicker.prototype._draw = function (context) {
        context.save();
        this._applyStates(context);
        var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height) * .5;
        var wheelThickness = radius * .2;
        var left = this._currentMeasure.left;
        var top = this._currentMeasure.top;
        if (!this._colorWheelCanvas || this._colorWheelCanvas.width != radius * 2) {
            this._colorWheelCanvas = this._createColorWheelCanvas(radius, wheelThickness);
        }
        this._updateSquareProps();
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
            context.fillRect(this._squareLeft, this._squareTop, this._squareSize, this._squareSize);
        }
        context.drawImage(this._colorWheelCanvas, left, top);
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }
        this._drawGradientSquare(this._h, this._squareLeft, this._squareTop, this._squareSize, this._squareSize, context);
        var cx = this._squareLeft + this._squareSize * this._s;
        var cy = this._squareTop + this._squareSize * (1 - this._v);
        this._drawCircle(cx, cy, radius * .04, context);
        var dist = radius - wheelThickness * .5;
        cx = left + radius + Math.cos((this._h - 180) * Math.PI / 180) * dist;
        cy = top + radius + Math.sin((this._h - 180) * Math.PI / 180) * dist;
        this._drawCircle(cx, cy, wheelThickness * .35, context);
        context.restore();
    };
    ColorPicker.prototype._updateValueFromPointer = function (x, y) {
        if (this._pointerStartedOnWheel) {
            var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height) * .5;
            var centerX = radius + this._currentMeasure.left;
            var centerY = radius + this._currentMeasure.top;
            this._h = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI + 180;
        }
        else if (this._pointerStartedOnSquare) {
            this._updateSquareProps();
            this._s = (x - this._squareLeft) / this._squareSize;
            this._v = 1 - (y - this._squareTop) / this._squareSize;
            this._s = Math.min(this._s, 1);
            this._s = Math.max(this._s, ColorPicker._Epsilon);
            this._v = Math.min(this._v, 1);
            this._v = Math.max(this._v, ColorPicker._Epsilon);
        }
        babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].HSVtoRGBToRef(this._h, this._s, this._v, this._tmpColor);
        this.value = this._tmpColor;
    };
    ColorPicker.prototype._isPointOnSquare = function (x, y) {
        this._updateSquareProps();
        var left = this._squareLeft;
        var top = this._squareTop;
        var size = this._squareSize;
        if (x >= left && x <= left + size &&
            y >= top && y <= top + size) {
            return true;
        }
        return false;
    };
    ColorPicker.prototype._isPointOnWheel = function (x, y) {
        var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height) * .5;
        var centerX = radius + this._currentMeasure.left;
        var centerY = radius + this._currentMeasure.top;
        var wheelThickness = radius * .2;
        var innerRadius = radius - wheelThickness;
        var radiusSq = radius * radius;
        var innerRadiusSq = innerRadius * innerRadius;
        var dx = x - centerX;
        var dy = y - centerY;
        var distSq = dx * dx + dy * dy;
        if (distSq <= radiusSq && distSq >= innerRadiusSq) {
            return true;
        }
        return false;
    };
    ColorPicker.prototype._onPointerDown = function (target, coordinates, pointerId, buttonIndex) {
        if (!_super.prototype._onPointerDown.call(this, target, coordinates, pointerId, buttonIndex)) {
            return false;
        }
        this._pointerIsDown = true;
        this._pointerStartedOnSquare = false;
        this._pointerStartedOnWheel = false;
        // Invert transform
        this._invertTransformMatrix.transformCoordinates(coordinates.x, coordinates.y, this._transformedPosition);
        var x = this._transformedPosition.x;
        var y = this._transformedPosition.y;
        if (this._isPointOnSquare(x, y)) {
            this._pointerStartedOnSquare = true;
        }
        else if (this._isPointOnWheel(x, y)) {
            this._pointerStartedOnWheel = true;
        }
        this._updateValueFromPointer(x, y);
        this._host._capturingControl[pointerId] = this;
        this._lastPointerDownID = pointerId;
        return true;
    };
    ColorPicker.prototype._onPointerMove = function (target, coordinates, pointerId) {
        // Only listen to pointer move events coming from the last pointer to click on the element (To support dual vr controller interaction)
        if (pointerId != this._lastPointerDownID) {
            return;
        }
        // Invert transform
        this._invertTransformMatrix.transformCoordinates(coordinates.x, coordinates.y, this._transformedPosition);
        var x = this._transformedPosition.x;
        var y = this._transformedPosition.y;
        if (this._pointerIsDown) {
            this._updateValueFromPointer(x, y);
        }
        _super.prototype._onPointerMove.call(this, target, coordinates, pointerId);
    };
    ColorPicker.prototype._onPointerUp = function (target, coordinates, pointerId, buttonIndex, notifyClick) {
        this._pointerIsDown = false;
        delete this._host._capturingControl[pointerId];
        _super.prototype._onPointerUp.call(this, target, coordinates, pointerId, buttonIndex, notifyClick);
    };
    ColorPicker.prototype._onCanvasBlur = function () {
        this._forcePointerUp();
        _super.prototype._onCanvasBlur.call(this);
    };
    /**
     * This function expands the color picker by creating a color picker dialog with manual
     * color value input and the ability to save colors into an array to be used later in
     * subsequent launches of the dialogue.
     * @param advancedTexture defines the AdvancedDynamicTexture the dialog is assigned to
     * @param options defines size for dialog and options for saved colors. Also accepts last color picked as hex string and saved colors array as hex strings.
     * @returns picked color as a hex string and the saved colors array as hex strings.
     */
    ColorPicker.ShowPickerDialogAsync = function (advancedTexture, options) {
        return new Promise(function (resolve, reject) {
            // Default options
            options.pickerWidth = options.pickerWidth || "640px";
            options.pickerHeight = options.pickerHeight || "400px";
            options.headerHeight = options.headerHeight || "35px";
            options.lastColor = options.lastColor || "#000000";
            options.swatchLimit = options.swatchLimit || 20;
            options.numSwatchesPerLine = options.numSwatchesPerLine || 10;
            // Window size settings
            var drawerMaxRows = options.swatchLimit / options.numSwatchesPerLine;
            var rawSwatchSize = parseFloat(options.pickerWidth) / options.numSwatchesPerLine;
            var gutterSize = Math.floor(rawSwatchSize * 0.25);
            var colGutters = gutterSize * (options.numSwatchesPerLine + 1);
            var swatchSize = Math.floor((parseFloat(options.pickerWidth) - colGutters) / options.numSwatchesPerLine);
            var drawerMaxSize = (swatchSize * drawerMaxRows) + (gutterSize * (drawerMaxRows + 1));
            var containerSize = (parseInt(options.pickerHeight) + drawerMaxSize + Math.floor(swatchSize * 0.25)).toString() + "px";
            // Button Colors
            var buttonColor = "#c0c0c0";
            var buttonBackgroundColor = "#535353";
            var buttonBackgroundHoverColor = "#414141";
            var buttonBackgroundClickColor = "515151";
            var buttonDisabledColor = "#555555";
            var buttonDisabledBackgroundColor = "#454545";
            var currentSwatchesOutlineColor = "#404040";
            var luminanceLimitColor = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromHexString("#dddddd");
            var luminanceLimit = luminanceLimitColor.r + luminanceLimitColor.g + luminanceLimitColor.b;
            var iconColorDark = "#aaaaaa";
            var iconColorLight = "#ffffff";
            var closeIconColor;
            // Button settings
            var buttonFontSize;
            var butEdit;
            var buttonWidth;
            var buttonHeight;
            // Input Text Colors
            var inputFieldLabels = ["R", "G", "B"];
            var inputTextBackgroundColor = "#454545";
            var inputTextColor = "#f0f0f0";
            // This is the current color as set by either the picker or by entering a value
            var currentColor;
            // This int is used for naming swatches and serves as the index for calling them from the list
            var swatchNumber;
            // Menu Panel options. We need to know if the swatchDrawer exists so we can create it if needed.
            var swatchDrawer;
            var editSwatchMode = false;
            // Color InputText fields that will be updated upon value change
            var picker;
            var rValInt;
            var gValInt;
            var bValInt;
            var rValDec;
            var gValDec;
            var bValDec;
            var hexVal;
            var newSwatch;
            var lastVal;
            var activeField;
            /**
            * Will update all values for InputText and ColorPicker controls based on the BABYLON.Color3 passed to this function.
            * Each InputText control and the ColorPicker control will be tested to see if they are the activeField and if they
            * are will receive no update. This is to prevent the input from the user being overwritten.
            */
            function updateValues(value, inputField) {
                activeField = inputField;
                var pickedColor = value.toHexString();
                newSwatch.background = pickedColor;
                if (rValInt.name != activeField) {
                    rValInt.text = Math.floor(value.r * 255).toString();
                }
                if (gValInt.name != activeField) {
                    gValInt.text = Math.floor(value.g * 255).toString();
                }
                if (bValInt.name != activeField) {
                    bValInt.text = Math.floor(value.b * 255).toString();
                }
                if (rValDec.name != activeField) {
                    rValDec.text = value.r.toString();
                }
                if (gValDec.name != activeField) {
                    gValDec.text = value.g.toString();
                }
                if (bValDec.name != activeField) {
                    bValDec.text = value.b.toString();
                }
                if (hexVal.name != activeField) {
                    var minusPound = pickedColor.split("#");
                    hexVal.text = minusPound[1];
                }
                if (picker.name != activeField) {
                    picker.value = value;
                }
            }
            // When the user enters an integer for R, G, or B we check to make sure it is a valid number and replace if not.
            function updateInt(field, channel) {
                var newValue = field.text;
                var checkVal = /[^0-9]/g.test(newValue);
                if (checkVal) {
                    field.text = lastVal;
                    return;
                }
                else {
                    if (newValue != "") {
                        if (Math.floor(parseInt(newValue)) < 0) {
                            newValue = "0";
                        }
                        else if (Math.floor(parseInt(newValue)) > 255) {
                            newValue = "255";
                        }
                        else if (isNaN(parseInt(newValue))) {
                            newValue = "0";
                        }
                    }
                    if (activeField == field.name) {
                        lastVal = newValue;
                    }
                }
                if (newValue != "") {
                    newValue = parseInt(newValue).toString();
                    field.text = newValue;
                    var newSwatchRGB = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromHexString(newSwatch.background);
                    if (activeField == field.name) {
                        if (channel == "r") {
                            updateValues(new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"]((parseInt(newValue)) / 255, newSwatchRGB.g, newSwatchRGB.b), field.name);
                        }
                        else if (channel == "g") {
                            updateValues(new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"](newSwatchRGB.r, (parseInt(newValue)) / 255, newSwatchRGB.b), field.name);
                        }
                        else {
                            updateValues(new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"](newSwatchRGB.r, newSwatchRGB.g, (parseInt(newValue)) / 255), field.name);
                        }
                    }
                }
            }
            // When the user enters a float for R, G, or B we check to make sure it is a valid number and replace if not.
            function updateFloat(field, channel) {
                var newValue = field.text;
                var checkVal = /[^0-9\.]/g.test(newValue);
                if (checkVal) {
                    field.text = lastVal;
                    return;
                }
                else {
                    if (newValue != "" && newValue != "." && parseFloat(newValue) != 0) {
                        if (parseFloat(newValue) < 0.0) {
                            newValue = "0.0";
                        }
                        else if (parseFloat(newValue) > 1.0) {
                            newValue = "1.0";
                        }
                        else if (isNaN(parseFloat(newValue))) {
                            newValue = "0.0";
                        }
                    }
                    if (activeField == field.name) {
                        lastVal = newValue;
                    }
                }
                if (newValue != "" && newValue != "." && parseFloat(newValue) != 0) {
                    newValue = parseFloat(newValue).toString();
                    field.text = newValue;
                }
                else {
                    newValue = "0.0";
                }
                var newSwatchRGB = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromHexString(newSwatch.background);
                if (activeField == field.name) {
                    if (channel == "r") {
                        updateValues(new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"](parseFloat(newValue), newSwatchRGB.g, newSwatchRGB.b), field.name);
                    }
                    else if (channel == "g") {
                        updateValues(new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"](newSwatchRGB.r, parseFloat(newValue), newSwatchRGB.b), field.name);
                    }
                    else {
                        updateValues(new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"](newSwatchRGB.r, newSwatchRGB.g, parseFloat(newValue)), field.name);
                    }
                }
            }
            // Removes the current index from the savedColors array. Drawer can then be regenerated.
            function deleteSwatch(index) {
                if (options.savedColors) {
                    options.savedColors.splice(index, 1);
                }
                if (options.savedColors && options.savedColors.length == 0) {
                    setEditButtonVisibility(false);
                    editSwatchMode = false;
                }
            }
            // Creates and styles an individual swatch when updateSwatches is called.
            function createSwatch() {
                if (options.savedColors && options.savedColors[swatchNumber]) {
                    if (editSwatchMode) {
                        var icon = "b";
                    }
                    else {
                        var icon = "";
                    }
                    var swatch = _button__WEBPACK_IMPORTED_MODULE_5__["Button"].CreateSimpleButton("Swatch_" + swatchNumber, icon);
                    swatch.fontFamily = "BabylonJSglyphs";
                    var swatchColor = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromHexString(options.savedColors[swatchNumber]);
                    var swatchLuminence = swatchColor.r + swatchColor.g + swatchColor.b;
                    // Set color of outline and textBlock based on luminance of the color swatch so feedback always visible
                    if (swatchLuminence > luminanceLimit) {
                        swatch.color = iconColorDark;
                    }
                    else {
                        swatch.color = iconColorLight;
                    }
                    swatch.fontSize = Math.floor(swatchSize * 0.7);
                    swatch.textBlock.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].VERTICAL_ALIGNMENT_CENTER;
                    swatch.height = swatch.width = (swatchSize).toString() + "px";
                    swatch.background = options.savedColors[swatchNumber];
                    swatch.thickness = 2;
                    var metadata_1 = swatchNumber;
                    swatch.pointerDownAnimation = function () {
                        swatch.thickness = 4;
                    };
                    swatch.pointerUpAnimation = function () {
                        swatch.thickness = 3;
                    };
                    swatch.pointerEnterAnimation = function () {
                        swatch.thickness = 3;
                    };
                    swatch.pointerOutAnimation = function () {
                        swatch.thickness = 2;
                    };
                    swatch.onPointerClickObservable.add(function () {
                        if (!editSwatchMode) {
                            if (options.savedColors) {
                                updateValues(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromHexString(options.savedColors[metadata_1]), swatch.name);
                            }
                        }
                        else {
                            deleteSwatch(metadata_1);
                            updateSwatches("", butSave);
                        }
                    });
                    return swatch;
                }
                else {
                    return null;
                }
            }
            // Mode switch to render button text and close symbols on swatch controls
            function editSwatches(mode) {
                if (mode !== undefined) {
                    editSwatchMode = mode;
                }
                if (editSwatchMode) {
                    for (var i = 0; i < swatchDrawer.children.length; i++) {
                        var thisButton = swatchDrawer.children[i];
                        thisButton.textBlock.text = "b";
                    }
                    if (butEdit !== undefined) {
                        butEdit.textBlock.text = "Done";
                    }
                }
                else {
                    for (var i = 0; i < swatchDrawer.children.length; i++) {
                        var thisButton = swatchDrawer.children[i];
                        thisButton.textBlock.text = "";
                    }
                    if (butEdit !== undefined) {
                        butEdit.textBlock.text = "Edit";
                    }
                }
            }
            /**
             * When Save Color button is pressed this function will first create a swatch drawer if one is not already
             * made. Then all controls are removed from the drawer and we step through the savedColors array and
             * creates one swatch per color. It will also set the height of the drawer control based on how many
             * saved colors there are and how many can be stored per row.
             */
            function updateSwatches(color, button) {
                if (options.savedColors) {
                    if (color != "") {
                        options.savedColors.push(color);
                    }
                    swatchNumber = 0;
                    swatchDrawer.clearControls();
                    var rowCount = Math.ceil(options.savedColors.length / options.numSwatchesPerLine);
                    if (rowCount == 0) {
                        var gutterCount = 0;
                    }
                    else {
                        var gutterCount = rowCount + 1;
                    }
                    if (swatchDrawer.rowCount != rowCount + gutterCount) {
                        var currentRows = swatchDrawer.rowCount;
                        for (var i = 0; i < currentRows; i++) {
                            swatchDrawer.removeRowDefinition(0);
                        }
                        for (var i = 0; i < rowCount + gutterCount; i++) {
                            if (i % 2) {
                                swatchDrawer.addRowDefinition(swatchSize, true);
                            }
                            else {
                                swatchDrawer.addRowDefinition(gutterSize, true);
                            }
                        }
                    }
                    swatchDrawer.height = ((swatchSize * rowCount) + (gutterCount * gutterSize)).toString() + "px";
                    for (var y = 1, thisRow = 1; y < rowCount + gutterCount; y += 2, thisRow++) {
                        // Determine number of buttons to create per row based on the button limit per row and number of saved colors
                        if (options.savedColors.length > thisRow * options.numSwatchesPerLine) {
                            var totalButtonsThisRow = options.numSwatchesPerLine;
                        }
                        else {
                            var totalButtonsThisRow = options.savedColors.length - ((thisRow - 1) * options.numSwatchesPerLine);
                        }
                        var buttonIterations = (Math.min(Math.max(totalButtonsThisRow, 0), options.numSwatchesPerLine));
                        for (var x = 0, w = 1; x < buttonIterations; x++) {
                            if (x > options.numSwatchesPerLine) {
                                continue;
                            }
                            var swatch = createSwatch();
                            if (swatch != null) {
                                swatchDrawer.addControl(swatch, y, w);
                                w += 2;
                                swatchNumber++;
                            }
                            else {
                                continue;
                            }
                        }
                    }
                    if (options.savedColors.length >= options.swatchLimit) {
                        disableButton(button, true);
                    }
                    else {
                        disableButton(button, false);
                    }
                }
            }
            // Shows or hides edit swatches button depending on if there are saved swatches
            function setEditButtonVisibility(enableButton) {
                if (enableButton) {
                    butEdit = _button__WEBPACK_IMPORTED_MODULE_5__["Button"].CreateSimpleButton("butEdit", "Edit");
                    butEdit.width = buttonWidth;
                    butEdit.height = buttonHeight;
                    butEdit.left = (Math.floor(parseInt(buttonWidth) * 0.1)).toString() + "px";
                    butEdit.top = (parseFloat(butEdit.left) * -1).toString() + "px";
                    butEdit.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].VERTICAL_ALIGNMENT_BOTTOM;
                    butEdit.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
                    butEdit.thickness = 2;
                    butEdit.color = buttonColor;
                    butEdit.fontSize = buttonFontSize;
                    butEdit.background = buttonBackgroundColor;
                    butEdit.onPointerEnterObservable.add(function () {
                        butEdit.background = buttonBackgroundHoverColor;
                    });
                    butEdit.onPointerOutObservable.add(function () {
                        butEdit.background = buttonBackgroundColor;
                    });
                    butEdit.pointerDownAnimation = function () {
                        butEdit.background = buttonBackgroundClickColor;
                    };
                    butEdit.pointerUpAnimation = function () {
                        butEdit.background = buttonBackgroundHoverColor;
                    };
                    butEdit.onPointerClickObservable.add(function () {
                        if (editSwatchMode) {
                            editSwatchMode = false;
                        }
                        else {
                            editSwatchMode = true;
                        }
                        editSwatches();
                    });
                    pickerGrid.addControl(butEdit, 1, 0);
                }
                else {
                    pickerGrid.removeControl(butEdit);
                }
            }
            // Called when the user hits the limit of saved colors in the drawer.
            function disableButton(button, disabled) {
                if (disabled) {
                    button.color = buttonDisabledColor;
                    button.background = buttonDisabledBackgroundColor;
                }
                else {
                    button.color = buttonColor;
                    button.background = buttonBackgroundColor;
                }
            }
            // Passes last chosen color back to scene and kills dialog by removing from AdvancedDynamicTexture
            function closePicker(color) {
                if (options.savedColors && options.savedColors.length > 0) {
                    resolve({
                        savedColors: options.savedColors,
                        pickedColor: color
                    });
                }
                else {
                    resolve({
                        pickedColor: color
                    });
                }
                advancedTexture.removeControl(dialogContainer);
            }
            // Dialogue menu container which will contain both the main dialogue window and the swatch drawer which opens once a color is saved.
            var dialogContainer = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
            dialogContainer.name = "Dialog Container";
            dialogContainer.width = options.pickerWidth;
            if (options.savedColors) {
                dialogContainer.height = containerSize;
                var topRow = parseInt(options.pickerHeight) / parseInt(containerSize);
                dialogContainer.addRowDefinition(topRow, false);
                dialogContainer.addRowDefinition(1.0 - topRow, false);
            }
            else {
                dialogContainer.height = options.pickerHeight;
                dialogContainer.addRowDefinition(1.0, false);
            }
            advancedTexture.addControl(dialogContainer);
            // Swatch drawer which contains all saved color buttons
            if (options.savedColors) {
                swatchDrawer = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
                swatchDrawer.name = "Swatch Drawer";
                swatchDrawer.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].VERTICAL_ALIGNMENT_TOP;
                swatchDrawer.background = buttonBackgroundColor;
                swatchDrawer.width = options.pickerWidth;
                var initialRows = options.savedColors.length / options.numSwatchesPerLine;
                if (initialRows == 0) {
                    var gutterCount = 0;
                }
                else {
                    var gutterCount = initialRows + 1;
                }
                swatchDrawer.height = ((swatchSize * initialRows) + (gutterCount * gutterSize)).toString() + "px";
                swatchDrawer.top = Math.floor(swatchSize * 0.25).toString() + "px";
                for (var i = 0; i < (Math.ceil(options.savedColors.length / options.numSwatchesPerLine) * 2) + 1; i++) {
                    if (i % 2 != 0) {
                        swatchDrawer.addRowDefinition(swatchSize, true);
                    }
                    else {
                        swatchDrawer.addRowDefinition(gutterSize, true);
                    }
                }
                for (var i = 0; i < options.numSwatchesPerLine * 2 + 1; i++) {
                    if (i % 2 != 0) {
                        swatchDrawer.addColumnDefinition(swatchSize, true);
                    }
                    else {
                        swatchDrawer.addColumnDefinition(gutterSize, true);
                    }
                }
                dialogContainer.addControl(swatchDrawer, 1, 0);
            }
            // Picker container
            var pickerPanel = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
            pickerPanel.name = "Picker Panel";
            pickerPanel.height = options.pickerHeight;
            var panelHead = parseInt(options.headerHeight) / parseInt(options.pickerHeight);
            var pickerPanelRows = [panelHead, 1.0 - panelHead];
            pickerPanel.addRowDefinition(pickerPanelRows[0], false);
            pickerPanel.addRowDefinition(pickerPanelRows[1], false);
            dialogContainer.addControl(pickerPanel, 0, 0);
            // Picker container header
            var header = new _rectangle__WEBPACK_IMPORTED_MODULE_4__["Rectangle"]();
            header.name = "Dialogue Header Bar";
            header.background = "#cccccc";
            header.thickness = 0;
            pickerPanel.addControl(header, 0, 0);
            // Header close button
            var closeButton = _button__WEBPACK_IMPORTED_MODULE_5__["Button"].CreateSimpleButton("closeButton", "a");
            closeButton.fontFamily = "BabylonJSglyphs";
            var headerColor3 = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromHexString(header.background);
            closeIconColor = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"](1.0 - headerColor3.r, 1.0 - headerColor3.g, 1.0 - headerColor3.b);
            closeButton.color = closeIconColor.toHexString();
            closeButton.fontSize = Math.floor(parseInt(options.headerHeight) * 0.6);
            closeButton.textBlock.textVerticalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].VERTICAL_ALIGNMENT_CENTER;
            closeButton.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_RIGHT;
            closeButton.height = closeButton.width = options.headerHeight;
            closeButton.background = header.background;
            closeButton.thickness = 0;
            closeButton.pointerDownAnimation = function () {
            };
            closeButton.pointerUpAnimation = function () {
                closeButton.background = header.background;
            };
            closeButton.pointerEnterAnimation = function () {
                closeButton.color = header.background;
                closeButton.background = "red";
            };
            closeButton.pointerOutAnimation = function () {
                closeButton.color = closeIconColor.toHexString();
                closeButton.background = header.background;
            };
            closeButton.onPointerClickObservable.add(function () {
                closePicker(currentSwatch.background);
            });
            pickerPanel.addControl(closeButton, 0, 0);
            // Dialog container body
            var dialogBody = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
            dialogBody.name = "Dialogue Body";
            dialogBody.background = buttonBackgroundColor;
            var dialogBodyCols = [0.4375, 0.5625];
            dialogBody.addRowDefinition(1.0, false);
            dialogBody.addColumnDefinition(dialogBodyCols[0], false);
            dialogBody.addColumnDefinition(dialogBodyCols[1], false);
            pickerPanel.addControl(dialogBody, 1, 0);
            // Picker grid
            var pickerGrid = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
            pickerGrid.name = "Picker Grid";
            pickerGrid.addRowDefinition(0.85, false);
            pickerGrid.addRowDefinition(0.15, false);
            dialogBody.addControl(pickerGrid, 0, 0);
            //  Picker control
            picker = new ColorPicker();
            picker.name = "GUI Color Picker";
            if (options.pickerHeight < options.pickerWidth) {
                picker.width = 0.89;
            }
            else {
                picker.height = 0.89;
            }
            picker.value = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromHexString(options.lastColor);
            picker.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_CENTER;
            picker.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].VERTICAL_ALIGNMENT_CENTER;
            picker.onPointerDownObservable.add(function () {
                activeField = picker.name;
                lastVal = "";
                editSwatches(false);
            });
            picker.onValueChangedObservable.add(function (value) {
                if (activeField == picker.name) {
                    updateValues(value, picker.name);
                }
            });
            pickerGrid.addControl(picker, 0, 0);
            // Picker body right quarant
            var pickerBodyRight = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
            pickerBodyRight.name = "Dialogue Right Half";
            pickerBodyRight.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
            var pickerBodyRightRows = [0.514, 0.486];
            pickerBodyRight.addRowDefinition(pickerBodyRightRows[0], false);
            pickerBodyRight.addRowDefinition(pickerBodyRightRows[1], false);
            dialogBody.addControl(pickerBodyRight, 1, 1);
            // Picker container swatches and buttons
            var pickerSwatchesButtons = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
            pickerSwatchesButtons.name = "Swatches and Buttons";
            var pickerButtonsCol = [0.417, 0.583];
            pickerSwatchesButtons.addRowDefinition(1.0, false);
            pickerSwatchesButtons.addColumnDefinition(pickerButtonsCol[0], false);
            pickerSwatchesButtons.addColumnDefinition(pickerButtonsCol[1], false);
            pickerBodyRight.addControl(pickerSwatchesButtons, 0, 0);
            // Picker Swatches quadrant
            var pickerSwatches = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
            pickerSwatches.name = "New and Current Swatches";
            var pickeSwatchesRows = [0.04, 0.16, 0.64, 0.16];
            pickerSwatches.addRowDefinition(pickeSwatchesRows[0], false);
            pickerSwatches.addRowDefinition(pickeSwatchesRows[1], false);
            pickerSwatches.addRowDefinition(pickeSwatchesRows[2], false);
            pickerSwatches.addRowDefinition(pickeSwatchesRows[3], false);
            pickerSwatchesButtons.addControl(pickerSwatches, 0, 0);
            // Active swatches
            var activeSwatches = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
            activeSwatches.name = "Active Swatches";
            activeSwatches.width = 0.67;
            activeSwatches.addRowDefinition(0.5, false);
            activeSwatches.addRowDefinition(0.5, false);
            pickerSwatches.addControl(activeSwatches, 2, 0);
            var labelWidth = (Math.floor(parseInt(options.pickerWidth) * dialogBodyCols[1] * pickerButtonsCol[0] * 0.11));
            var labelHeight = (Math.floor(parseInt(options.pickerHeight) * pickerPanelRows[1] * pickerBodyRightRows[0] * pickeSwatchesRows[1] * 0.5));
            if (options.pickerWidth > options.pickerHeight) {
                var labelTextSize = labelHeight;
            }
            else {
                var labelTextSize = labelWidth;
            }
            // New color swatch and previous color button
            var newText = new _controls_textBlock__WEBPACK_IMPORTED_MODULE_7__["TextBlock"]();
            newText.text = "new";
            newText.name = "New Color Label";
            newText.color = buttonColor;
            newText.fontSize = labelTextSize;
            pickerSwatches.addControl(newText, 1, 0);
            newSwatch = new _rectangle__WEBPACK_IMPORTED_MODULE_4__["Rectangle"]();
            newSwatch.name = "New Color Swatch";
            newSwatch.background = options.lastColor;
            newSwatch.thickness = 0;
            activeSwatches.addControl(newSwatch, 0, 0);
            var currentSwatch = _button__WEBPACK_IMPORTED_MODULE_5__["Button"].CreateSimpleButton("currentSwatch", "");
            currentSwatch.background = options.lastColor;
            currentSwatch.thickness = 0;
            currentSwatch.onPointerClickObservable.add(function () {
                var revertColor = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromHexString(currentSwatch.background);
                updateValues(revertColor, currentSwatch.name);
                editSwatches(false);
            });
            currentSwatch.pointerDownAnimation = function () { };
            currentSwatch.pointerUpAnimation = function () { };
            currentSwatch.pointerEnterAnimation = function () { };
            currentSwatch.pointerOutAnimation = function () { };
            activeSwatches.addControl(currentSwatch, 1, 0);
            var swatchOutline = new _rectangle__WEBPACK_IMPORTED_MODULE_4__["Rectangle"]();
            swatchOutline.name = "Swatch Outline";
            swatchOutline.width = 0.67;
            swatchOutline.thickness = 2;
            swatchOutline.color = currentSwatchesOutlineColor;
            swatchOutline.isHitTestVisible = false;
            pickerSwatches.addControl(swatchOutline, 2, 0);
            var currentText = new _controls_textBlock__WEBPACK_IMPORTED_MODULE_7__["TextBlock"]();
            currentText.name = "Current Color Label";
            currentText.text = "current";
            currentText.color = buttonColor;
            currentText.fontSize = labelTextSize;
            pickerSwatches.addControl(currentText, 3, 0);
            // Buttons grid
            var buttonGrid = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
            buttonGrid.name = "Button Grid";
            buttonGrid.height = 0.8;
            var buttonGridRows = 1 / 3;
            buttonGrid.addRowDefinition(buttonGridRows, false);
            buttonGrid.addRowDefinition(buttonGridRows, false);
            buttonGrid.addRowDefinition(buttonGridRows, false);
            pickerSwatchesButtons.addControl(buttonGrid, 0, 1);
            // Determine pixel width and height for all buttons from overall panel dimensions
            buttonWidth = (Math.floor(parseInt(options.pickerWidth) * dialogBodyCols[1] * pickerButtonsCol[1] * 0.67)).toString() + "px";
            buttonHeight = (Math.floor(parseInt(options.pickerHeight) * pickerPanelRows[1] * pickerBodyRightRows[0] * (parseFloat(buttonGrid.height.toString()) / 100) * buttonGridRows * 0.7)).toString() + "px";
            // Determine button type size
            if (parseFloat(buttonWidth) > parseFloat(buttonHeight)) {
                buttonFontSize = Math.floor(parseFloat(buttonHeight) * 0.45);
            }
            else {
                buttonFontSize = Math.floor(parseFloat(buttonWidth) * 0.11);
            }
            // Panel Buttons
            var butOK = _button__WEBPACK_IMPORTED_MODULE_5__["Button"].CreateSimpleButton("butOK", "OK");
            butOK.width = buttonWidth;
            butOK.height = buttonHeight;
            butOK.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].VERTICAL_ALIGNMENT_CENTER;
            butOK.thickness = 2;
            butOK.color = buttonColor;
            butOK.fontSize = buttonFontSize;
            butOK.background = buttonBackgroundColor;
            butOK.onPointerEnterObservable.add(function () { butOK.background = buttonBackgroundHoverColor; });
            butOK.onPointerOutObservable.add(function () { butOK.background = buttonBackgroundColor; });
            butOK.pointerDownAnimation = function () {
                butOK.background = buttonBackgroundClickColor;
            };
            butOK.pointerUpAnimation = function () {
                butOK.background = buttonBackgroundHoverColor;
            };
            butOK.onPointerClickObservable.add(function () {
                editSwatches(false);
                closePicker(newSwatch.background);
            });
            buttonGrid.addControl(butOK, 0, 0);
            var butCancel = _button__WEBPACK_IMPORTED_MODULE_5__["Button"].CreateSimpleButton("butCancel", "Cancel");
            butCancel.width = buttonWidth;
            butCancel.height = buttonHeight;
            butCancel.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].VERTICAL_ALIGNMENT_CENTER;
            butCancel.thickness = 2;
            butCancel.color = buttonColor;
            butCancel.fontSize = buttonFontSize;
            butCancel.background = buttonBackgroundColor;
            butCancel.onPointerEnterObservable.add(function () { butCancel.background = buttonBackgroundHoverColor; });
            butCancel.onPointerOutObservable.add(function () { butCancel.background = buttonBackgroundColor; });
            butCancel.pointerDownAnimation = function () {
                butCancel.background = buttonBackgroundClickColor;
            };
            butCancel.pointerUpAnimation = function () {
                butCancel.background = buttonBackgroundHoverColor;
            };
            butCancel.onPointerClickObservable.add(function () {
                editSwatches(false);
                closePicker(currentSwatch.background);
            });
            buttonGrid.addControl(butCancel, 1, 0);
            if (options.savedColors) {
                var butSave = _button__WEBPACK_IMPORTED_MODULE_5__["Button"].CreateSimpleButton("butSave", "Save");
                butSave.width = buttonWidth;
                butSave.height = buttonHeight;
                butSave.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].VERTICAL_ALIGNMENT_CENTER;
                butSave.thickness = 2;
                butSave.fontSize = buttonFontSize;
                if (options.savedColors.length < options.swatchLimit) {
                    butSave.color = buttonColor;
                    butSave.background = buttonBackgroundColor;
                }
                else {
                    disableButton(butSave, true);
                }
                butSave.onPointerEnterObservable.add(function () {
                    if (options.savedColors) {
                        if (options.savedColors.length < options.swatchLimit) {
                            butSave.background = buttonBackgroundHoverColor;
                        }
                    }
                });
                butSave.onPointerOutObservable.add(function () {
                    if (options.savedColors) {
                        if (options.savedColors.length < options.swatchLimit) {
                            butSave.background = buttonBackgroundColor;
                        }
                    }
                });
                butSave.pointerDownAnimation = function () {
                    if (options.savedColors) {
                        if (options.savedColors.length < options.swatchLimit) {
                            butSave.background = buttonBackgroundClickColor;
                        }
                    }
                };
                butSave.pointerUpAnimation = function () {
                    if (options.savedColors) {
                        if (options.savedColors.length < options.swatchLimit) {
                            butSave.background = buttonBackgroundHoverColor;
                        }
                    }
                };
                butSave.onPointerClickObservable.add(function () {
                    if (options.savedColors) {
                        if (options.savedColors.length == 0) {
                            setEditButtonVisibility(true);
                        }
                        if (options.savedColors.length < options.swatchLimit) {
                            updateSwatches(newSwatch.background, butSave);
                        }
                        editSwatches(false);
                    }
                });
                if (options.savedColors.length > 0) {
                    setEditButtonVisibility(true);
                }
                buttonGrid.addControl(butSave, 2, 0);
            }
            // Picker color values input
            var pickerColorValues = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
            pickerColorValues.name = "Dialog Lower Right";
            pickerColorValues.addRowDefinition(0.02, false);
            pickerColorValues.addRowDefinition(0.63, false);
            pickerColorValues.addRowDefinition(0.21, false);
            pickerColorValues.addRowDefinition(0.14, false);
            pickerBodyRight.addControl(pickerColorValues, 1, 0);
            // RGB values text boxes
            currentColor = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromHexString(options.lastColor);
            var rgbValuesQuadrant = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
            rgbValuesQuadrant.name = "RGB Values";
            rgbValuesQuadrant.width = 0.82;
            rgbValuesQuadrant.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].VERTICAL_ALIGNMENT_CENTER;
            rgbValuesQuadrant.addRowDefinition(1 / 3, false);
            rgbValuesQuadrant.addRowDefinition(1 / 3, false);
            rgbValuesQuadrant.addRowDefinition(1 / 3, false);
            rgbValuesQuadrant.addColumnDefinition(0.1, false);
            rgbValuesQuadrant.addColumnDefinition(0.2, false);
            rgbValuesQuadrant.addColumnDefinition(0.7, false);
            pickerColorValues.addControl(rgbValuesQuadrant, 1, 0);
            for (var i = 0; i < inputFieldLabels.length; i++) {
                var labelText = new _controls_textBlock__WEBPACK_IMPORTED_MODULE_7__["TextBlock"]();
                labelText.text = inputFieldLabels[i];
                labelText.color = buttonColor;
                labelText.fontSize = buttonFontSize;
                rgbValuesQuadrant.addControl(labelText, i, 0);
            }
            // Input fields for RGB values
            rValInt = new _inputText__WEBPACK_IMPORTED_MODULE_3__["InputText"]();
            rValInt.width = 0.83;
            rValInt.height = 0.72;
            rValInt.name = "rIntField";
            rValInt.fontSize = buttonFontSize;
            rValInt.text = (currentColor.r * 255).toString();
            rValInt.color = inputTextColor;
            rValInt.background = inputTextBackgroundColor;
            rValInt.onFocusObservable.add(function () {
                activeField = rValInt.name;
                lastVal = rValInt.text;
                editSwatches(false);
            });
            rValInt.onBlurObservable.add(function () {
                if (rValInt.text == "") {
                    rValInt.text = "0";
                }
                updateInt(rValInt, "r");
                if (activeField == rValInt.name) {
                    activeField = "";
                }
            });
            rValInt.onTextChangedObservable.add(function () {
                if (activeField == rValInt.name) {
                    updateInt(rValInt, "r");
                }
            });
            rgbValuesQuadrant.addControl(rValInt, 0, 1);
            gValInt = new _inputText__WEBPACK_IMPORTED_MODULE_3__["InputText"]();
            gValInt.width = 0.83;
            gValInt.height = 0.72;
            gValInt.name = "gIntField";
            gValInt.fontSize = buttonFontSize;
            gValInt.text = (currentColor.g * 255).toString();
            gValInt.color = inputTextColor;
            gValInt.background = inputTextBackgroundColor;
            gValInt.onFocusObservable.add(function () {
                activeField = gValInt.name;
                lastVal = gValInt.text;
                editSwatches(false);
            });
            gValInt.onBlurObservable.add(function () {
                if (gValInt.text == "") {
                    gValInt.text = "0";
                }
                updateInt(gValInt, "g");
                if (activeField == gValInt.name) {
                    activeField = "";
                }
            });
            gValInt.onTextChangedObservable.add(function () {
                if (activeField == gValInt.name) {
                    updateInt(gValInt, "g");
                }
            });
            rgbValuesQuadrant.addControl(gValInt, 1, 1);
            bValInt = new _inputText__WEBPACK_IMPORTED_MODULE_3__["InputText"]();
            bValInt.width = 0.83;
            bValInt.height = 0.72;
            bValInt.name = "bIntField";
            bValInt.fontSize = buttonFontSize;
            bValInt.text = (currentColor.b * 255).toString();
            bValInt.color = inputTextColor;
            bValInt.background = inputTextBackgroundColor;
            bValInt.onFocusObservable.add(function () {
                activeField = bValInt.name;
                lastVal = bValInt.text;
                editSwatches(false);
            });
            bValInt.onBlurObservable.add(function () {
                if (bValInt.text == "") {
                    bValInt.text = "0";
                }
                updateInt(bValInt, "b");
                if (activeField == bValInt.name) {
                    activeField = "";
                }
            });
            bValInt.onTextChangedObservable.add(function () {
                if (activeField == bValInt.name) {
                    updateInt(bValInt, "b");
                }
            });
            rgbValuesQuadrant.addControl(bValInt, 2, 1);
            rValDec = new _inputText__WEBPACK_IMPORTED_MODULE_3__["InputText"]();
            rValDec.width = 0.95;
            rValDec.height = 0.72;
            rValDec.name = "rDecField";
            rValDec.fontSize = buttonFontSize;
            rValDec.text = currentColor.r.toString();
            rValDec.color = inputTextColor;
            rValDec.background = inputTextBackgroundColor;
            rValDec.onFocusObservable.add(function () {
                activeField = rValDec.name;
                lastVal = rValDec.text;
                editSwatches(false);
            });
            rValDec.onBlurObservable.add(function () {
                if (parseFloat(rValDec.text) == 0 || rValDec.text == "") {
                    rValDec.text = "0";
                    updateFloat(rValDec, "r");
                }
                if (activeField == rValDec.name) {
                    activeField = "";
                }
            });
            rValDec.onTextChangedObservable.add(function () {
                if (activeField == rValDec.name) {
                    updateFloat(rValDec, "r");
                }
            });
            rgbValuesQuadrant.addControl(rValDec, 0, 2);
            gValDec = new _inputText__WEBPACK_IMPORTED_MODULE_3__["InputText"]();
            gValDec.width = 0.95;
            gValDec.height = 0.72;
            gValDec.name = "gDecField";
            gValDec.fontSize = buttonFontSize;
            gValDec.text = currentColor.g.toString();
            gValDec.color = inputTextColor;
            gValDec.background = inputTextBackgroundColor;
            gValDec.onFocusObservable.add(function () {
                activeField = gValDec.name;
                lastVal = gValDec.text;
                editSwatches(false);
            });
            gValDec.onBlurObservable.add(function () {
                if (parseFloat(gValDec.text) == 0 || gValDec.text == "") {
                    gValDec.text = "0";
                    updateFloat(gValDec, "g");
                }
                if (activeField == gValDec.name) {
                    activeField = "";
                }
            });
            gValDec.onTextChangedObservable.add(function () {
                if (activeField == gValDec.name) {
                    updateFloat(gValDec, "g");
                }
            });
            rgbValuesQuadrant.addControl(gValDec, 1, 2);
            bValDec = new _inputText__WEBPACK_IMPORTED_MODULE_3__["InputText"]();
            bValDec.width = 0.95;
            bValDec.height = 0.72;
            bValDec.name = "bDecField";
            bValDec.fontSize = buttonFontSize;
            bValDec.text = currentColor.b.toString();
            bValDec.color = inputTextColor;
            bValDec.background = inputTextBackgroundColor;
            bValDec.onFocusObservable.add(function () {
                activeField = bValDec.name;
                lastVal = bValDec.text;
                editSwatches(false);
            });
            bValDec.onBlurObservable.add(function () {
                if (parseFloat(bValDec.text) == 0 || bValDec.text == "") {
                    bValDec.text = "0";
                    updateFloat(bValDec, "b");
                }
                if (activeField == bValDec.name) {
                    activeField = "";
                }
            });
            bValDec.onTextChangedObservable.add(function () {
                if (activeField == bValDec.name) {
                    updateFloat(bValDec, "b");
                }
            });
            rgbValuesQuadrant.addControl(bValDec, 2, 2);
            // Hex value input
            var hexValueQuadrant = new _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]();
            hexValueQuadrant.name = "Hex Value";
            hexValueQuadrant.width = 0.82;
            hexValueQuadrant.addRowDefinition(1.0, false);
            hexValueQuadrant.addColumnDefinition(0.1, false);
            hexValueQuadrant.addColumnDefinition(0.9, false);
            pickerColorValues.addControl(hexValueQuadrant, 2, 0);
            var labelText = new _controls_textBlock__WEBPACK_IMPORTED_MODULE_7__["TextBlock"]();
            labelText.text = "#";
            labelText.color = buttonColor;
            labelText.fontSize = buttonFontSize;
            hexValueQuadrant.addControl(labelText, 0, 0);
            hexVal = new _inputText__WEBPACK_IMPORTED_MODULE_3__["InputText"]();
            hexVal.width = 0.96;
            hexVal.height = 0.72;
            hexVal.name = "hexField";
            hexVal.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_CENTER;
            hexVal.fontSize = buttonFontSize;
            var minusPound = options.lastColor.split("#");
            hexVal.text = minusPound[1];
            hexVal.color = inputTextColor;
            hexVal.background = inputTextBackgroundColor;
            hexVal.onFocusObservable.add(function () {
                activeField = hexVal.name;
                lastVal = hexVal.text;
                editSwatches(false);
            });
            hexVal.onBlurObservable.add(function () {
                if (hexVal.text.length == 3) {
                    var val = hexVal.text.split("");
                    hexVal.text = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
                }
                if (hexVal.text == "") {
                    hexVal.text = "000000";
                    updateValues(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromHexString(hexVal.text), "b");
                }
                if (activeField == hexVal.name) {
                    activeField = "";
                }
            });
            hexVal.onTextChangedObservable.add(function () {
                var newHexValue = hexVal.text;
                var checkHex = /[^0-9A-F]/i.test(newHexValue);
                if ((hexVal.text.length > 6 || checkHex) && activeField == hexVal.name) {
                    hexVal.text = lastVal;
                }
                else {
                    if (hexVal.text.length < 6) {
                        var leadingZero = 6 - hexVal.text.length;
                        for (var i = 0; i < leadingZero; i++) {
                            newHexValue = "0" + newHexValue;
                        }
                    }
                    if (hexVal.text.length == 3) {
                        var val = hexVal.text.split("");
                        newHexValue = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
                    }
                    newHexValue = "#" + newHexValue;
                    if (activeField == hexVal.name) {
                        lastVal = hexVal.text;
                        updateValues(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Color3"].FromHexString(newHexValue), hexVal.name);
                    }
                }
            });
            hexValueQuadrant.addControl(hexVal, 0, 1);
            if (options.savedColors && options.savedColors.length > 0) {
                updateSwatches("", butSave);
            }
        });
    };
    ColorPicker._Epsilon = 0.000001;
    return ColorPicker;
}(_control__WEBPACK_IMPORTED_MODULE_2__["Control"]));

babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GUI.ColorPicker"] = ColorPicker;


/***/ }),

/***/ "./2D/controls/container.ts":
/*!**********************************!*\
  !*** ./2D/controls/container.ts ***!
  \**********************************/
/*! exports provided: Container */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Container", function() { return Container; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/logger */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_logger__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_logger__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var _measure__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../measure */ "./2D/measure.ts");





/**
 * Root class for 2D containers
 * @see https://doc.babylonjs.com/how_to/gui#containers
 */
var Container = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Container, _super);
    /**
     * Creates a new Container
     * @param name defines the name of the container
     */
    function Container(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        /** @hidden */
        _this._children = new Array();
        /** @hidden */
        _this._measureForChildren = _measure__WEBPACK_IMPORTED_MODULE_3__["Measure"].Empty();
        /** @hidden */
        _this._background = "";
        /** @hidden */
        _this._adaptWidthToChildren = false;
        /** @hidden */
        _this._adaptHeightToChildren = false;
        /**
         * Gets or sets a boolean indicating that layout cycle errors should be displayed on the console
         */
        _this.logLayoutCycleErrors = false;
        /**
         * Gets or sets the number of layout cycles (a change involved by a control while evaluating the layout) allowed
         */
        _this.maxLayoutCycle = 3;
        return _this;
    }
    Object.defineProperty(Container.prototype, "adaptHeightToChildren", {
        /** Gets or sets a boolean indicating if the container should try to adapt to its children height */
        get: function () {
            return this._adaptHeightToChildren;
        },
        set: function (value) {
            if (this._adaptHeightToChildren === value) {
                return;
            }
            this._adaptHeightToChildren = value;
            if (value) {
                this.height = "100%";
            }
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "adaptWidthToChildren", {
        /** Gets or sets a boolean indicating if the container should try to adapt to its children width */
        get: function () {
            return this._adaptWidthToChildren;
        },
        set: function (value) {
            if (this._adaptWidthToChildren === value) {
                return;
            }
            this._adaptWidthToChildren = value;
            if (value) {
                this.width = "100%";
            }
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "background", {
        /** Gets or sets background color */
        get: function () {
            return this._background;
        },
        set: function (value) {
            if (this._background === value) {
                return;
            }
            this._background = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "children", {
        /** Gets the list of children */
        get: function () {
            return this._children;
        },
        enumerable: false,
        configurable: true
    });
    Container.prototype._getTypeName = function () {
        return "Container";
    };
    Container.prototype._flagDescendantsAsMatrixDirty = function () {
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child._markMatrixAsDirty();
        }
    };
    /**
     * Gets a child using its name
     * @param name defines the child name to look for
     * @returns the child control if found
     */
    Container.prototype.getChildByName = function (name) {
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (child.name === name) {
                return child;
            }
        }
        return null;
    };
    /**
     * Gets a child using its type and its name
     * @param name defines the child name to look for
     * @param type defines the child type to look for
     * @returns the child control if found
     */
    Container.prototype.getChildByType = function (name, type) {
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (child.typeName === type) {
                return child;
            }
        }
        return null;
    };
    /**
     * Search for a specific control in children
     * @param control defines the control to look for
     * @returns true if the control is in child list
     */
    Container.prototype.containsControl = function (control) {
        return this.children.indexOf(control) !== -1;
    };
    /**
     * Adds a new control to the current container
     * @param control defines the control to add
     * @returns the current container
     */
    Container.prototype.addControl = function (control) {
        if (!control) {
            return this;
        }
        var index = this._children.indexOf(control);
        if (index !== -1) {
            return this;
        }
        control._link(this._host);
        control._markAllAsDirty();
        this._reOrderControl(control);
        this._markAsDirty();
        return this;
    };
    /**
     * Removes all controls from the current container
     * @returns the current container
     */
    Container.prototype.clearControls = function () {
        var children = this.children.slice();
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var child = children_1[_i];
            this.removeControl(child);
        }
        return this;
    };
    /**
     * Removes a control from the current container
     * @param control defines the control to remove
     * @returns the current container
     */
    Container.prototype.removeControl = function (control) {
        var index = this._children.indexOf(control);
        if (index !== -1) {
            this._children.splice(index, 1);
            control.parent = null;
        }
        control.linkWithMesh(null);
        if (this._host) {
            this._host._cleanControlAfterRemoval(control);
        }
        this._markAsDirty();
        return this;
    };
    /** @hidden */
    Container.prototype._reOrderControl = function (control) {
        this.removeControl(control);
        var wasAdded = false;
        for (var index = 0; index < this._children.length; index++) {
            if (this._children[index].zIndex > control.zIndex) {
                this._children.splice(index, 0, control);
                wasAdded = true;
                break;
            }
        }
        if (!wasAdded) {
            this._children.push(control);
        }
        control.parent = this;
        this._markAsDirty();
    };
    /** @hidden */
    Container.prototype._offsetLeft = function (offset) {
        _super.prototype._offsetLeft.call(this, offset);
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            child._offsetLeft(offset);
        }
    };
    /** @hidden */
    Container.prototype._offsetTop = function (offset) {
        _super.prototype._offsetTop.call(this, offset);
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            child._offsetTop(offset);
        }
    };
    /** @hidden */
    Container.prototype._markAllAsDirty = function () {
        _super.prototype._markAllAsDirty.call(this);
        for (var index = 0; index < this._children.length; index++) {
            this._children[index]._markAllAsDirty();
        }
    };
    /** @hidden */
    Container.prototype._localDraw = function (context) {
        if (this._background) {
            context.save();
            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }
            context.fillStyle = this._background;
            context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            context.restore();
        }
    };
    /** @hidden */
    Container.prototype._link = function (host) {
        _super.prototype._link.call(this, host);
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            child._link(host);
        }
    };
    /** @hidden */
    Container.prototype._beforeLayout = function () {
        // Do nothing
    };
    /** @hidden */
    Container.prototype._processMeasures = function (parentMeasure, context) {
        if (this._isDirty || !this._cachedParentMeasure.isEqualsTo(parentMeasure)) {
            _super.prototype._processMeasures.call(this, parentMeasure, context);
            this._evaluateClippingState(parentMeasure);
        }
    };
    /** @hidden */
    Container.prototype._layout = function (parentMeasure, context) {
        if (!this.isDirty && (!this.isVisible || this.notRenderable)) {
            return false;
        }
        this.host._numLayoutCalls++;
        if (this._isDirty) {
            this._currentMeasure.transformToRef(this._transformMatrix, this._prevCurrentMeasureTransformedIntoGlobalSpace);
        }
        var rebuildCount = 0;
        context.save();
        this._applyStates(context);
        this._beforeLayout();
        do {
            var computedWidth = -1;
            var computedHeight = -1;
            this._rebuildLayout = false;
            this._processMeasures(parentMeasure, context);
            if (!this._isClipped) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    child._tempParentMeasure.copyFrom(this._measureForChildren);
                    if (child._layout(this._measureForChildren, context)) {
                        if (this.adaptWidthToChildren && child._width.isPixel) {
                            computedWidth = Math.max(computedWidth, child._currentMeasure.width + child.paddingLeftInPixels + child.paddingRightInPixels);
                        }
                        if (this.adaptHeightToChildren && child._height.isPixel) {
                            computedHeight = Math.max(computedHeight, child._currentMeasure.height + child.paddingTopInPixels + child.paddingBottomInPixels);
                        }
                    }
                }
                if (this.adaptWidthToChildren && computedWidth >= 0) {
                    if (this.width !== computedWidth + "px") {
                        this.width = computedWidth + "px";
                        this._rebuildLayout = true;
                    }
                }
                if (this.adaptHeightToChildren && computedHeight >= 0) {
                    if (this.height !== computedHeight + "px") {
                        this.height = computedHeight + "px";
                        this._rebuildLayout = true;
                    }
                }
                this._postMeasure();
            }
            rebuildCount++;
        } while (this._rebuildLayout && rebuildCount < this.maxLayoutCycle);
        if (rebuildCount >= 3 && this.logLayoutCycleErrors) {
            babylonjs_Misc_logger__WEBPACK_IMPORTED_MODULE_1__["Logger"].Error("Layout cycle detected in GUI (Container name=" + this.name + ", uniqueId=" + this.uniqueId + ")");
        }
        context.restore();
        if (this._isDirty) {
            this.invalidateRect();
            this._isDirty = false;
        }
        return true;
    };
    Container.prototype._postMeasure = function () {
        // Do nothing by default
    };
    /** @hidden */
    Container.prototype._draw = function (context, invalidatedRectangle) {
        this._localDraw(context);
        if (this.clipChildren) {
            this._clipForChildren(context);
        }
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            // Only redraw parts of the screen that are invalidated
            if (invalidatedRectangle) {
                if (!child._intersectsRect(invalidatedRectangle)) {
                    continue;
                }
            }
            child._render(context, invalidatedRectangle);
        }
    };
    Container.prototype.getDescendantsToRef = function (results, directDescendantsOnly, predicate) {
        if (directDescendantsOnly === void 0) { directDescendantsOnly = false; }
        if (!this.children) {
            return;
        }
        for (var index = 0; index < this.children.length; index++) {
            var item = this.children[index];
            if (!predicate || predicate(item)) {
                results.push(item);
            }
            if (!directDescendantsOnly) {
                item.getDescendantsToRef(results, false, predicate);
            }
        }
    };
    /** @hidden */
    Container.prototype._processPicking = function (x, y, type, pointerId, buttonIndex, deltaX, deltaY) {
        if (!this._isEnabled || !this.isVisible || this.notRenderable) {
            return false;
        }
        if (!_super.prototype.contains.call(this, x, y)) {
            return false;
        }
        // Checking backwards to pick closest first
        for (var index = this._children.length - 1; index >= 0; index--) {
            var child = this._children[index];
            if (child._processPicking(x, y, type, pointerId, buttonIndex, deltaX, deltaY)) {
                if (child.hoverCursor) {
                    this._host._changeCursor(child.hoverCursor);
                }
                return true;
            }
        }
        if (!this.isHitTestVisible) {
            return false;
        }
        return this._processObservables(type, x, y, pointerId, buttonIndex, deltaX, deltaY);
    };
    /** @hidden */
    Container.prototype._additionalProcessing = function (parentMeasure, context) {
        _super.prototype._additionalProcessing.call(this, parentMeasure, context);
        this._measureForChildren.copyFrom(this._currentMeasure);
    };
    /** Releases associated resources */
    Container.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        for (var index = this.children.length - 1; index >= 0; index--) {
            this.children[index].dispose();
        }
    };
    return Container;
}(_control__WEBPACK_IMPORTED_MODULE_2__["Control"]));

babylonjs_Misc_logger__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GUI.Container"] = Container;


/***/ }),

/***/ "./2D/controls/control.ts":
/*!********************************!*\
  !*** ./2D/controls/control.ts ***!
  \********************************/
/*! exports provided: Control */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Control", function() { return Control; });
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../valueAndUnit */ "./2D/valueAndUnit.ts");
/* harmony import */ var _measure__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../measure */ "./2D/measure.ts");
/* harmony import */ var _math2D__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../math2D */ "./2D/math2D.ts");









/**
 * Root class used for all 2D controls
 * @see https://doc.babylonjs.com/how_to/gui#controls
 */
var Control = /** @class */ (function () {
    // Functions
    /**
     * Creates a new control
     * @param name defines the name of the control
     */
    function Control(
    /** defines the name of the control */
    name) {
        this.name = name;
        this._alpha = 1;
        this._alphaSet = false;
        this._zIndex = 0;
        /** @hidden */
        this._currentMeasure = _measure__WEBPACK_IMPORTED_MODULE_2__["Measure"].Empty();
        this._fontFamily = "Arial";
        this._fontStyle = "";
        this._fontWeight = "";
        this._fontSize = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](18, _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"].UNITMODE_PIXEL, false);
        /** @hidden */
        this._width = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](1, _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"].UNITMODE_PERCENTAGE, false);
        /** @hidden */
        this._height = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](1, _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"].UNITMODE_PERCENTAGE, false);
        this._color = "";
        this._style = null;
        /** @hidden */
        this._horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        /** @hidden */
        this._verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        /** @hidden */
        this._isDirty = true;
        /** @hidden */
        this._wasDirty = false;
        /** @hidden */
        this._tempParentMeasure = _measure__WEBPACK_IMPORTED_MODULE_2__["Measure"].Empty();
        /** @hidden */
        this._prevCurrentMeasureTransformedIntoGlobalSpace = _measure__WEBPACK_IMPORTED_MODULE_2__["Measure"].Empty();
        /** @hidden */
        this._cachedParentMeasure = _measure__WEBPACK_IMPORTED_MODULE_2__["Measure"].Empty();
        this._paddingLeft = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](0);
        this._paddingRight = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](0);
        this._paddingTop = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](0);
        this._paddingBottom = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](0);
        /** @hidden */
        this._left = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](0);
        /** @hidden */
        this._top = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](0);
        this._scaleX = 1.0;
        this._scaleY = 1.0;
        this._rotation = 0;
        this._transformCenterX = 0.5;
        this._transformCenterY = 0.5;
        /** @hidden */
        this._transformMatrix = _math2D__WEBPACK_IMPORTED_MODULE_3__["Matrix2D"].Identity();
        /** @hidden */
        this._invertTransformMatrix = _math2D__WEBPACK_IMPORTED_MODULE_3__["Matrix2D"].Identity();
        /** @hidden */
        this._transformedPosition = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector2"].Zero();
        this._isMatrixDirty = true;
        this._isVisible = true;
        this._isHighlighted = false;
        this._fontSet = false;
        this._dummyVector2 = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector2"].Zero();
        this._downCount = 0;
        this._enterCount = -1;
        this._doNotRender = false;
        this._downPointerIds = {};
        this._isEnabled = true;
        this._disabledColor = "#9a9a9a";
        this._disabledColorItem = "#6a6a6a";
        /** @hidden */
        this._rebuildLayout = false;
        /** @hidden */
        this._customData = {};
        /** @hidden */
        this._isClipped = false;
        /** @hidden */
        this._automaticSize = false;
        /**
         * Gets or sets an object used to store user defined information for the node
         */
        this.metadata = null;
        /** Gets or sets a boolean indicating if the control can be hit with pointer events */
        this.isHitTestVisible = true;
        /** Gets or sets a boolean indicating if the control can block pointer events */
        this.isPointerBlocker = false;
        /** Gets or sets a boolean indicating if the control can be focusable */
        this.isFocusInvisible = false;
        /**
         * Gets or sets a boolean indicating if the children are clipped to the current control bounds.
         * Please note that not clipping children may generate issues with adt.useInvalidateRectOptimization so it is recommended to turn this optimization off if you want to use unclipped children
         */
        this.clipChildren = true;
        /**
         * Gets or sets a boolean indicating that control content must be clipped
         * Please note that not clipping children may generate issues with adt.useInvalidateRectOptimization so it is recommended to turn this optimization off if you want to use unclipped children
         */
        this.clipContent = true;
        /**
         * Gets or sets a boolean indicating that the current control should cache its rendering (useful when the control does not change often)
         */
        this.useBitmapCache = false;
        this._shadowOffsetX = 0;
        this._shadowOffsetY = 0;
        this._shadowBlur = 0;
        this._shadowColor = 'black';
        /** Gets or sets the cursor to use when the control is hovered */
        this.hoverCursor = "";
        /** @hidden */
        this._linkOffsetX = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](0);
        /** @hidden */
        this._linkOffsetY = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](0);
        /**
        * An event triggered when pointer wheel is scrolled
        */
        this.onWheelObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
        * An event triggered when the pointer move over the control.
        */
        this.onPointerMoveObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
        * An event triggered when the pointer move out of the control.
        */
        this.onPointerOutObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
        * An event triggered when the pointer taps the control
        */
        this.onPointerDownObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
        * An event triggered when pointer up
        */
        this.onPointerUpObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
        * An event triggered when a control is clicked on
        */
        this.onPointerClickObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
        * An event triggered when pointer enters the control
        */
        this.onPointerEnterObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
        * An event triggered when the control is marked as dirty
        */
        this.onDirtyObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * An event triggered before drawing the control
         */
        this.onBeforeDrawObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * An event triggered after the control was drawn
         */
        this.onAfterDrawObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
        * An event triggered when the control has been disposed
        */
        this.onDisposeObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * Gets or sets a fixed ratio for this control.
         * When different from 0, the ratio is used to compute the "second" dimension.
         * The first dimension used in the computation is the last one set (by setting width / widthInPixels or height / heightInPixels), and the
         * second dimension is computed as first dimension * fixedRatio
         */
        this.fixedRatio = 0;
        this._fixedRatioMasterIsWidth = true;
        this._tmpMeasureA = new _measure__WEBPACK_IMPORTED_MODULE_2__["Measure"](0, 0, 0, 0);
    }
    Object.defineProperty(Control.prototype, "shadowOffsetX", {
        /** Gets or sets a value indicating the offset to apply on X axis to render the shadow */
        get: function () {
            return this._shadowOffsetX;
        },
        set: function (value) {
            if (this._shadowOffsetX === value) {
                return;
            }
            this._shadowOffsetX = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "shadowOffsetY", {
        /** Gets or sets a value indicating the offset to apply on Y axis to render the shadow */
        get: function () {
            return this._shadowOffsetY;
        },
        set: function (value) {
            if (this._shadowOffsetY === value) {
                return;
            }
            this._shadowOffsetY = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "shadowBlur", {
        /** Gets or sets a value indicating the amount of blur to use to render the shadow */
        get: function () {
            return this._shadowBlur;
        },
        set: function (value) {
            if (this._shadowBlur === value) {
                return;
            }
            this._shadowBlur = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "shadowColor", {
        /** Gets or sets a value indicating the color of the shadow (black by default ie. "#000") */
        get: function () {
            return this._shadowColor;
        },
        set: function (value) {
            if (this._shadowColor === value) {
                return;
            }
            this._shadowColor = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "typeName", {
        // Properties
        /** Gets the control type name */
        get: function () {
            return this._getTypeName();
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Get the current class name of the control.
     * @returns current class name
     */
    Control.prototype.getClassName = function () {
        return this._getTypeName();
    };
    Object.defineProperty(Control.prototype, "host", {
        /**
         * Get the hosting AdvancedDynamicTexture
         */
        get: function () {
            return this._host;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "fontOffset", {
        /** Gets or set information about font offsets (used to render and align text) */
        get: function () {
            return this._fontOffset;
        },
        set: function (offset) {
            this._fontOffset = offset;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "alpha", {
        /** Gets or sets alpha value for the control (1 means opaque and 0 means entirely transparent) */
        get: function () {
            return this._alpha;
        },
        set: function (value) {
            if (this._alpha === value) {
                return;
            }
            this._alphaSet = true;
            this._alpha = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "isHighlighted", {
        /**
         * Gets or sets a boolean indicating that we want to highlight the control (mostly for debugging purpose)
         */
        get: function () {
            return this._isHighlighted;
        },
        set: function (value) {
            if (this._isHighlighted === value) {
                return;
            }
            this._isHighlighted = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "scaleX", {
        /** Gets or sets a value indicating the scale factor on X axis (1 by default)
         * @see https://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        get: function () {
            return this._scaleX;
        },
        set: function (value) {
            if (this._scaleX === value) {
                return;
            }
            this._scaleX = value;
            this._markAsDirty();
            this._markMatrixAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "scaleY", {
        /** Gets or sets a value indicating the scale factor on Y axis (1 by default)
         * @see https://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        get: function () {
            return this._scaleY;
        },
        set: function (value) {
            if (this._scaleY === value) {
                return;
            }
            this._scaleY = value;
            this._markAsDirty();
            this._markMatrixAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "rotation", {
        /** Gets or sets the rotation angle (0 by default)
         * @see https://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        get: function () {
            return this._rotation;
        },
        set: function (value) {
            if (this._rotation === value) {
                return;
            }
            this._rotation = value;
            this._markAsDirty();
            this._markMatrixAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "transformCenterY", {
        /** Gets or sets the transformation center on Y axis (0 by default)
         * @see https://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        get: function () {
            return this._transformCenterY;
        },
        set: function (value) {
            if (this._transformCenterY === value) {
                return;
            }
            this._transformCenterY = value;
            this._markAsDirty();
            this._markMatrixAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "transformCenterX", {
        /** Gets or sets the transformation center on X axis (0 by default)
         * @see https://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        get: function () {
            return this._transformCenterX;
        },
        set: function (value) {
            if (this._transformCenterX === value) {
                return;
            }
            this._transformCenterX = value;
            this._markAsDirty();
            this._markMatrixAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "horizontalAlignment", {
        /**
         * Gets or sets the horizontal alignment
         * @see https://doc.babylonjs.com/how_to/gui#alignments
         */
        get: function () {
            return this._horizontalAlignment;
        },
        set: function (value) {
            if (this._horizontalAlignment === value) {
                return;
            }
            this._horizontalAlignment = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "verticalAlignment", {
        /**
         * Gets or sets the vertical alignment
         * @see https://doc.babylonjs.com/how_to/gui#alignments
         */
        get: function () {
            return this._verticalAlignment;
        },
        set: function (value) {
            if (this._verticalAlignment === value) {
                return;
            }
            this._verticalAlignment = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "width", {
        /**
         * Gets or sets control width
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._width.toString(this._host);
        },
        set: function (value) {
            this._fixedRatioMasterIsWidth = true;
            if (this._width.toString(this._host) === value) {
                return;
            }
            if (this._width.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "widthInPixels", {
        /**
         * Gets or sets the control width in pixel
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._width.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        set: function (value) {
            if (isNaN(value)) {
                return;
            }
            this._fixedRatioMasterIsWidth = true;
            this.width = value + "px";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "height", {
        /**
         * Gets or sets control height
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._height.toString(this._host);
        },
        set: function (value) {
            this._fixedRatioMasterIsWidth = false;
            if (this._height.toString(this._host) === value) {
                return;
            }
            if (this._height.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "heightInPixels", {
        /**
         * Gets or sets control height in pixel
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
        },
        set: function (value) {
            if (isNaN(value)) {
                return;
            }
            this._fixedRatioMasterIsWidth = false;
            this.height = value + "px";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "fontFamily", {
        /** Gets or set font family */
        get: function () {
            if (!this._fontSet) {
                return "";
            }
            return this._fontFamily;
        },
        set: function (value) {
            if (this._fontFamily === value) {
                return;
            }
            this._fontFamily = value;
            this._resetFontCache();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "fontStyle", {
        /** Gets or sets font style */
        get: function () {
            return this._fontStyle;
        },
        set: function (value) {
            if (this._fontStyle === value) {
                return;
            }
            this._fontStyle = value;
            this._resetFontCache();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "fontWeight", {
        /** Gets or sets font weight */
        get: function () {
            return this._fontWeight;
        },
        set: function (value) {
            if (this._fontWeight === value) {
                return;
            }
            this._fontWeight = value;
            this._resetFontCache();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "style", {
        /**
         * Gets or sets style
         * @see https://doc.babylonjs.com/how_to/gui#styles
         */
        get: function () {
            return this._style;
        },
        set: function (value) {
            var _this = this;
            if (this._style) {
                this._style.onChangedObservable.remove(this._styleObserver);
                this._styleObserver = null;
            }
            this._style = value;
            if (this._style) {
                this._styleObserver = this._style.onChangedObservable.add(function () {
                    _this._markAsDirty();
                    _this._resetFontCache();
                });
            }
            this._markAsDirty();
            this._resetFontCache();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "_isFontSizeInPercentage", {
        /** @hidden */
        get: function () {
            return this._fontSize.isPercentage;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "fontSizeInPixels", {
        /** Gets or sets font size in pixels */
        get: function () {
            var fontSizeToUse = this._style ? this._style._fontSize : this._fontSize;
            if (fontSizeToUse.isPixel) {
                return fontSizeToUse.getValue(this._host);
            }
            return fontSizeToUse.getValueInPixel(this._host, this._tempParentMeasure.height || this._cachedParentMeasure.height);
        },
        set: function (value) {
            if (isNaN(value)) {
                return;
            }
            this.fontSize = value + "px";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "fontSize", {
        /** Gets or sets font size */
        get: function () {
            return this._fontSize.toString(this._host);
        },
        set: function (value) {
            if (this._fontSize.toString(this._host) === value) {
                return;
            }
            if (this._fontSize.fromString(value)) {
                this._markAsDirty();
                this._resetFontCache();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "color", {
        /** Gets or sets foreground color */
        get: function () {
            return this._color;
        },
        set: function (value) {
            if (this._color === value) {
                return;
            }
            this._color = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "zIndex", {
        /** Gets or sets z index which is used to reorder controls on the z axis */
        get: function () {
            return this._zIndex;
        },
        set: function (value) {
            if (this.zIndex === value) {
                return;
            }
            this._zIndex = value;
            if (this.parent) {
                this.parent._reOrderControl(this);
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "notRenderable", {
        /** Gets or sets a boolean indicating if the control can be rendered */
        get: function () {
            return this._doNotRender;
        },
        set: function (value) {
            if (this._doNotRender === value) {
                return;
            }
            this._doNotRender = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "isVisible", {
        /** Gets or sets a boolean indicating if the control is visible */
        get: function () {
            return this._isVisible;
        },
        set: function (value) {
            if (this._isVisible === value) {
                return;
            }
            this._isVisible = value;
            this._markAsDirty(true);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "isDirty", {
        /** Gets a boolean indicating that the control needs to update its rendering */
        get: function () {
            return this._isDirty;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "linkedMesh", {
        /**
         * Gets the current linked mesh (or null if none)
         */
        get: function () {
            return this._linkedMesh;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingLeft", {
        /**
         * Gets or sets a value indicating the padding to use on the left of the control
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingLeft.toString(this._host);
        },
        set: function (value) {
            if (this._paddingLeft.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingLeftInPixels", {
        /**
         * Gets or sets a value indicating the padding in pixels to use on the left of the control
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingLeft.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        set: function (value) {
            if (isNaN(value)) {
                return;
            }
            this.paddingLeft = value + "px";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingRight", {
        /**
         * Gets or sets a value indicating the padding to use on the right of the control
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingRight.toString(this._host);
        },
        set: function (value) {
            if (this._paddingRight.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingRightInPixels", {
        /**
         * Gets or sets a value indicating the padding in pixels to use on the right of the control
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingRight.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        set: function (value) {
            if (isNaN(value)) {
                return;
            }
            this.paddingRight = value + "px";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingTop", {
        /**
         * Gets or sets a value indicating the padding to use on the top of the control
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingTop.toString(this._host);
        },
        set: function (value) {
            if (this._paddingTop.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingTopInPixels", {
        /**
         * Gets or sets a value indicating the padding in pixels to use on the top of the control
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingTop.getValueInPixel(this._host, this._cachedParentMeasure.height);
        },
        set: function (value) {
            if (isNaN(value)) {
                return;
            }
            this.paddingTop = value + "px";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingBottom", {
        /**
         * Gets or sets a value indicating the padding to use on the bottom of the control
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingBottom.toString(this._host);
        },
        set: function (value) {
            if (this._paddingBottom.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingBottomInPixels", {
        /**
         * Gets or sets a value indicating the padding in pixels to use on the bottom of the control
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingBottom.getValueInPixel(this._host, this._cachedParentMeasure.height);
        },
        set: function (value) {
            if (isNaN(value)) {
                return;
            }
            this.paddingBottom = value + "px";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "left", {
        /**
         * Gets or sets a value indicating the left coordinate of the control
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._left.toString(this._host);
        },
        set: function (value) {
            if (this._left.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "leftInPixels", {
        /**
         * Gets or sets a value indicating the left coordinate in pixels of the control
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._left.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        set: function (value) {
            if (isNaN(value)) {
                return;
            }
            this.left = value + "px";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "top", {
        /**
         * Gets or sets a value indicating the top coordinate of the control
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._top.toString(this._host);
        },
        set: function (value) {
            if (this._top.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "topInPixels", {
        /**
         * Gets or sets a value indicating the top coordinate in pixels of the control
         * @see https://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._top.getValueInPixel(this._host, this._cachedParentMeasure.height);
        },
        set: function (value) {
            if (isNaN(value)) {
                return;
            }
            this.top = value + "px";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "linkOffsetX", {
        /**
         * Gets or sets a value indicating the offset on X axis to the linked mesh
         * @see https://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        get: function () {
            return this._linkOffsetX.toString(this._host);
        },
        set: function (value) {
            if (this._linkOffsetX.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "linkOffsetXInPixels", {
        /**
         * Gets or sets a value indicating the offset in pixels on X axis to the linked mesh
         * @see https://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        get: function () {
            return this._linkOffsetX.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        set: function (value) {
            if (isNaN(value)) {
                return;
            }
            this.linkOffsetX = value + "px";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "linkOffsetY", {
        /**
         * Gets or sets a value indicating the offset on Y axis to the linked mesh
         * @see https://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        get: function () {
            return this._linkOffsetY.toString(this._host);
        },
        set: function (value) {
            if (this._linkOffsetY.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "linkOffsetYInPixels", {
        /**
         * Gets or sets a value indicating the offset in pixels on Y axis to the linked mesh
         * @see https://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        get: function () {
            return this._linkOffsetY.getValueInPixel(this._host, this._cachedParentMeasure.height);
        },
        set: function (value) {
            if (isNaN(value)) {
                return;
            }
            this.linkOffsetY = value + "px";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "centerX", {
        /** Gets the center coordinate on X axis */
        get: function () {
            return this._currentMeasure.left + this._currentMeasure.width / 2;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "centerY", {
        /** Gets the center coordinate on Y axis */
        get: function () {
            return this._currentMeasure.top + this._currentMeasure.height / 2;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "isEnabled", {
        /** Gets or sets if control is Enabled*/
        get: function () {
            return this._isEnabled;
        },
        set: function (value) {
            if (this._isEnabled === value) {
                return;
            }
            this._isEnabled = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "disabledColor", {
        /** Gets or sets background color of control if it's disabled*/
        get: function () {
            return this._disabledColor;
        },
        set: function (value) {
            if (this._disabledColor === value) {
                return;
            }
            this._disabledColor = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "disabledColorItem", {
        /** Gets or sets front color of control if it's disabled*/
        get: function () {
            return this._disabledColorItem;
        },
        set: function (value) {
            if (this._disabledColorItem === value) {
                return;
            }
            this._disabledColorItem = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    /** @hidden */
    Control.prototype._getTypeName = function () {
        return "Control";
    };
    /**
     * Gets the first ascendant in the hierarchy of the given type
     * @param className defines the required type
     * @returns the ascendant or null if not found
     */
    Control.prototype.getAscendantOfClass = function (className) {
        if (!this.parent) {
            return null;
        }
        if (this.parent.getClassName() === className) {
            return this.parent;
        }
        return this.parent.getAscendantOfClass(className);
    };
    /** @hidden */
    Control.prototype._resetFontCache = function () {
        this._fontSet = true;
        this._markAsDirty();
    };
    /**
     * Determines if a container is an ascendant of the current control
     * @param container defines the container to look for
     * @returns true if the container is one of the ascendant of the control
     */
    Control.prototype.isAscendant = function (container) {
        if (!this.parent) {
            return false;
        }
        if (this.parent === container) {
            return true;
        }
        return this.parent.isAscendant(container);
    };
    /**
     * Gets coordinates in local control space
     * @param globalCoordinates defines the coordinates to transform
     * @returns the new coordinates in local space
     */
    Control.prototype.getLocalCoordinates = function (globalCoordinates) {
        var result = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector2"].Zero();
        this.getLocalCoordinatesToRef(globalCoordinates, result);
        return result;
    };
    /**
     * Gets coordinates in local control space
     * @param globalCoordinates defines the coordinates to transform
     * @param result defines the target vector2 where to store the result
     * @returns the current control
     */
    Control.prototype.getLocalCoordinatesToRef = function (globalCoordinates, result) {
        result.x = globalCoordinates.x - this._currentMeasure.left;
        result.y = globalCoordinates.y - this._currentMeasure.top;
        return this;
    };
    /**
     * Gets coordinates in parent local control space
     * @param globalCoordinates defines the coordinates to transform
     * @returns the new coordinates in parent local space
     */
    Control.prototype.getParentLocalCoordinates = function (globalCoordinates) {
        var result = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector2"].Zero();
        result.x = globalCoordinates.x - this._cachedParentMeasure.left;
        result.y = globalCoordinates.y - this._cachedParentMeasure.top;
        return result;
    };
    /**
     * Move the current control to a vector3 position projected onto the screen.
     * @param position defines the target position
     * @param scene defines the hosting scene
     */
    Control.prototype.moveToVector3 = function (position, scene) {
        if (!this._host || this.parent !== this._host._rootContainer) {
            babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Tools"].Error("Cannot move a control to a vector3 if the control is not at root level");
            return;
        }
        this.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        var globalViewport = this._host._getGlobalViewport(scene);
        var projectedPosition = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Project(position, babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Matrix"].Identity(), scene.getTransformMatrix(), globalViewport);
        this._moveToProjectedPosition(projectedPosition);
        if (projectedPosition.z < 0 || projectedPosition.z > 1) {
            this.notRenderable = true;
            return;
        }
        this.notRenderable = false;
    };
    /**
     * Will store all controls that have this control as ascendant in a given array
     * @param results defines the array where to store the descendants
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     */
    Control.prototype.getDescendantsToRef = function (results, directDescendantsOnly, predicate) {
        if (directDescendantsOnly === void 0) { directDescendantsOnly = false; }
        // Do nothing by default
    };
    /**
     * Will return all controls that have this control as ascendant
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @return all child controls
     */
    Control.prototype.getDescendants = function (directDescendantsOnly, predicate) {
        var results = new Array();
        this.getDescendantsToRef(results, directDescendantsOnly, predicate);
        return results;
    };
    /**
     * Link current control with a target mesh
     * @param mesh defines the mesh to link with
     * @see https://doc.babylonjs.com/how_to/gui#tracking-positions
     */
    Control.prototype.linkWithMesh = function (mesh) {
        if (!this._host || this.parent && this.parent !== this._host._rootContainer) {
            if (mesh) {
                babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Tools"].Error("Cannot link a control to a mesh if the control is not at root level");
            }
            return;
        }
        var index = this._host._linkedControls.indexOf(this);
        if (index !== -1) {
            this._linkedMesh = mesh;
            if (!mesh) {
                this._host._linkedControls.splice(index, 1);
            }
            return;
        }
        else if (!mesh) {
            return;
        }
        this.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._linkedMesh = mesh;
        this._host._linkedControls.push(this);
    };
    /** @hidden */
    Control.prototype._moveToProjectedPosition = function (projectedPosition) {
        var oldLeft = this._left.getValue(this._host);
        var oldTop = this._top.getValue(this._host);
        var newLeft = ((projectedPosition.x + this._linkOffsetX.getValue(this._host)) - this._currentMeasure.width / 2);
        var newTop = ((projectedPosition.y + this._linkOffsetY.getValue(this._host)) - this._currentMeasure.height / 2);
        if (this._left.ignoreAdaptiveScaling && this._top.ignoreAdaptiveScaling) {
            if (Math.abs(newLeft - oldLeft) < 0.5) {
                newLeft = oldLeft;
            }
            if (Math.abs(newTop - oldTop) < 0.5) {
                newTop = oldTop;
            }
        }
        this.left = newLeft + "px";
        this.top = newTop + "px";
        this._left.ignoreAdaptiveScaling = true;
        this._top.ignoreAdaptiveScaling = true;
        this._markAsDirty();
    };
    /** @hidden */
    Control.prototype._offsetLeft = function (offset) {
        this._isDirty = true;
        this._currentMeasure.left += offset;
    };
    /** @hidden */
    Control.prototype._offsetTop = function (offset) {
        this._isDirty = true;
        this._currentMeasure.top += offset;
    };
    /** @hidden */
    Control.prototype._markMatrixAsDirty = function () {
        this._isMatrixDirty = true;
        this._flagDescendantsAsMatrixDirty();
    };
    /** @hidden */
    Control.prototype._flagDescendantsAsMatrixDirty = function () {
        // No child
    };
    /** @hidden */
    Control.prototype._intersectsRect = function (rect) {
        // Rotate the control's current measure into local space and check if it intersects the passed in rectangle
        this._currentMeasure.transformToRef(this._transformMatrix, this._tmpMeasureA);
        if (this._tmpMeasureA.left >= rect.left + rect.width) {
            return false;
        }
        if (this._tmpMeasureA.top >= rect.top + rect.height) {
            return false;
        }
        if (this._tmpMeasureA.left + this._tmpMeasureA.width <= rect.left) {
            return false;
        }
        if (this._tmpMeasureA.top + this._tmpMeasureA.height <= rect.top) {
            return false;
        }
        return true;
    };
    /** @hidden */
    Control.prototype.invalidateRect = function () {
        this._transform();
        if (this.host && this.host.useInvalidateRectOptimization) {
            // Rotate by transform to get the measure transformed to global space
            this._currentMeasure.transformToRef(this._transformMatrix, this._tmpMeasureA);
            // get the boudning box of the current measure and last frames measure in global space and invalidate it
            // the previous measure is used to properly clear a control that is scaled down
            _measure__WEBPACK_IMPORTED_MODULE_2__["Measure"].CombineToRef(this._tmpMeasureA, this._prevCurrentMeasureTransformedIntoGlobalSpace, this._tmpMeasureA);
            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                // Expand rect based on shadows
                var shadowOffsetX = this.shadowOffsetX;
                var shadowOffsetY = this.shadowOffsetY;
                var shadowBlur = this.shadowBlur;
                var leftShadowOffset = Math.min(Math.min(shadowOffsetX, 0) - shadowBlur * 2, 0);
                var rightShadowOffset = Math.max(Math.max(shadowOffsetX, 0) + shadowBlur * 2, 0);
                var topShadowOffset = Math.min(Math.min(shadowOffsetY, 0) - shadowBlur * 2, 0);
                var bottomShadowOffset = Math.max(Math.max(shadowOffsetY, 0) + shadowBlur * 2, 0);
                this.host.invalidateRect(Math.floor(this._tmpMeasureA.left + leftShadowOffset), Math.floor(this._tmpMeasureA.top + topShadowOffset), Math.ceil(this._tmpMeasureA.left + this._tmpMeasureA.width + rightShadowOffset), Math.ceil(this._tmpMeasureA.top + this._tmpMeasureA.height + bottomShadowOffset));
            }
            else {
                this.host.invalidateRect(Math.floor(this._tmpMeasureA.left), Math.floor(this._tmpMeasureA.top), Math.ceil(this._tmpMeasureA.left + this._tmpMeasureA.width), Math.ceil(this._tmpMeasureA.top + this._tmpMeasureA.height));
            }
        }
    };
    /** @hidden */
    Control.prototype._markAsDirty = function (force) {
        if (force === void 0) { force = false; }
        if (!this._isVisible && !force) {
            return;
        }
        this._isDirty = true;
        // Redraw only this rectangle
        if (this._host) {
            this._host.markAsDirty();
        }
    };
    /** @hidden */
    Control.prototype._markAllAsDirty = function () {
        this._markAsDirty();
        if (this._font) {
            this._prepareFont();
        }
    };
    /** @hidden */
    Control.prototype._link = function (host) {
        this._host = host;
        if (this._host) {
            this.uniqueId = this._host.getScene().getUniqueId();
        }
    };
    /** @hidden */
    Control.prototype._transform = function (context) {
        if (!this._isMatrixDirty && this._scaleX === 1 && this._scaleY === 1 && this._rotation === 0) {
            return;
        }
        // postTranslate
        var offsetX = this._currentMeasure.width * this._transformCenterX + this._currentMeasure.left;
        var offsetY = this._currentMeasure.height * this._transformCenterY + this._currentMeasure.top;
        if (context) {
            context.translate(offsetX, offsetY);
            // rotate
            context.rotate(this._rotation);
            // scale
            context.scale(this._scaleX, this._scaleY);
            // preTranslate
            context.translate(-offsetX, -offsetY);
        }
        // Need to update matrices?
        if (this._isMatrixDirty || this._cachedOffsetX !== offsetX || this._cachedOffsetY !== offsetY) {
            this._cachedOffsetX = offsetX;
            this._cachedOffsetY = offsetY;
            this._isMatrixDirty = false;
            this._flagDescendantsAsMatrixDirty();
            _math2D__WEBPACK_IMPORTED_MODULE_3__["Matrix2D"].ComposeToRef(-offsetX, -offsetY, this._rotation, this._scaleX, this._scaleY, this.parent ? this.parent._transformMatrix : null, this._transformMatrix);
            this._transformMatrix.invertToRef(this._invertTransformMatrix);
        }
    };
    /** @hidden */
    Control.prototype._renderHighlight = function (context) {
        if (!this.isHighlighted) {
            return;
        }
        context.save();
        context.strokeStyle = "#4affff";
        context.lineWidth = 2;
        this._renderHighlightSpecific(context);
        context.restore();
    };
    /** @hidden */
    Control.prototype._renderHighlightSpecific = function (context) {
        context.strokeRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
    };
    /** @hidden */
    Control.prototype._applyStates = function (context) {
        if (this._isFontSizeInPercentage) {
            this._fontSet = true;
        }
        if (this._fontSet) {
            this._prepareFont();
            this._fontSet = false;
        }
        if (this._font) {
            context.font = this._font;
        }
        if (this._color) {
            context.fillStyle = this._color;
        }
        if (Control.AllowAlphaInheritance) {
            context.globalAlpha *= this._alpha;
        }
        else if (this._alphaSet) {
            context.globalAlpha = this.parent ? this.parent.alpha * this._alpha : this._alpha;
        }
    };
    /** @hidden */
    Control.prototype._layout = function (parentMeasure, context) {
        if (!this.isDirty && (!this.isVisible || this.notRenderable)) {
            return false;
        }
        if (this._isDirty || !this._cachedParentMeasure.isEqualsTo(parentMeasure)) {
            this.host._numLayoutCalls++;
            this._currentMeasure.addAndTransformToRef(this._transformMatrix, -this.paddingLeftInPixels | 0, -this.paddingTopInPixels | 0, this.paddingRightInPixels | 0, this.paddingBottomInPixels | 0, this._prevCurrentMeasureTransformedIntoGlobalSpace);
            context.save();
            this._applyStates(context);
            var rebuildCount = 0;
            do {
                this._rebuildLayout = false;
                this._processMeasures(parentMeasure, context);
                rebuildCount++;
            } while (this._rebuildLayout && rebuildCount < 3);
            if (rebuildCount >= 3) {
                babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Logger"].Error("Layout cycle detected in GUI (Control name=" + this.name + ", uniqueId=" + this.uniqueId + ")");
            }
            context.restore();
            this.invalidateRect();
            this._evaluateClippingState(parentMeasure);
        }
        this._wasDirty = this._isDirty;
        this._isDirty = false;
        return true;
    };
    /** @hidden */
    Control.prototype._processMeasures = function (parentMeasure, context) {
        this._currentMeasure.copyFrom(parentMeasure);
        // Let children take some pre-measurement actions
        this._preMeasure(parentMeasure, context);
        this._measure();
        this._computeAlignment(parentMeasure, context);
        // Convert to int values
        this._currentMeasure.left = this._currentMeasure.left | 0;
        this._currentMeasure.top = this._currentMeasure.top | 0;
        this._currentMeasure.width = this._currentMeasure.width | 0;
        this._currentMeasure.height = this._currentMeasure.height | 0;
        // Let children add more features
        this._additionalProcessing(parentMeasure, context);
        this._cachedParentMeasure.copyFrom(parentMeasure);
        if (this.onDirtyObservable.hasObservers()) {
            this.onDirtyObservable.notifyObservers(this);
        }
    };
    Control.prototype._evaluateClippingState = function (parentMeasure) {
        if (this.parent && this.parent.clipChildren) {
            // Early clip
            if (this._currentMeasure.left > parentMeasure.left + parentMeasure.width) {
                this._isClipped = true;
                return;
            }
            if (this._currentMeasure.left + this._currentMeasure.width < parentMeasure.left) {
                this._isClipped = true;
                return;
            }
            if (this._currentMeasure.top > parentMeasure.top + parentMeasure.height) {
                this._isClipped = true;
                return;
            }
            if (this._currentMeasure.top + this._currentMeasure.height < parentMeasure.top) {
                this._isClipped = true;
                return;
            }
        }
        this._isClipped = false;
    };
    /** @hidden */
    Control.prototype._measure = function () {
        // Width / Height
        if (this._width.isPixel) {
            this._currentMeasure.width = this._width.getValue(this._host);
        }
        else {
            this._currentMeasure.width *= this._width.getValue(this._host);
        }
        if (this._height.isPixel) {
            this._currentMeasure.height = this._height.getValue(this._host);
        }
        else {
            this._currentMeasure.height *= this._height.getValue(this._host);
        }
        if (this.fixedRatio !== 0) {
            if (this._fixedRatioMasterIsWidth) {
                this._currentMeasure.height = this._currentMeasure.width * this.fixedRatio;
            }
            else {
                this._currentMeasure.width = this._currentMeasure.height * this.fixedRatio;
            }
        }
    };
    /** @hidden */
    Control.prototype._computeAlignment = function (parentMeasure, context) {
        var width = this._currentMeasure.width;
        var height = this._currentMeasure.height;
        var parentWidth = parentMeasure.width;
        var parentHeight = parentMeasure.height;
        // Left / top
        var x = 0;
        var y = 0;
        switch (this.horizontalAlignment) {
            case Control.HORIZONTAL_ALIGNMENT_LEFT:
                x = 0;
                break;
            case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                x = parentWidth - width;
                break;
            case Control.HORIZONTAL_ALIGNMENT_CENTER:
                x = (parentWidth - width) / 2;
                break;
        }
        switch (this.verticalAlignment) {
            case Control.VERTICAL_ALIGNMENT_TOP:
                y = 0;
                break;
            case Control.VERTICAL_ALIGNMENT_BOTTOM:
                y = parentHeight - height;
                break;
            case Control.VERTICAL_ALIGNMENT_CENTER:
                y = (parentHeight - height) / 2;
                break;
        }
        if (this._paddingLeft.isPixel) {
            this._currentMeasure.left += this._paddingLeft.getValue(this._host);
            this._currentMeasure.width -= this._paddingLeft.getValue(this._host);
        }
        else {
            this._currentMeasure.left += parentWidth * this._paddingLeft.getValue(this._host);
            this._currentMeasure.width -= parentWidth * this._paddingLeft.getValue(this._host);
        }
        if (this._paddingRight.isPixel) {
            this._currentMeasure.width -= this._paddingRight.getValue(this._host);
        }
        else {
            this._currentMeasure.width -= parentWidth * this._paddingRight.getValue(this._host);
        }
        if (this._paddingTop.isPixel) {
            this._currentMeasure.top += this._paddingTop.getValue(this._host);
            this._currentMeasure.height -= this._paddingTop.getValue(this._host);
        }
        else {
            this._currentMeasure.top += parentHeight * this._paddingTop.getValue(this._host);
            this._currentMeasure.height -= parentHeight * this._paddingTop.getValue(this._host);
        }
        if (this._paddingBottom.isPixel) {
            this._currentMeasure.height -= this._paddingBottom.getValue(this._host);
        }
        else {
            this._currentMeasure.height -= parentHeight * this._paddingBottom.getValue(this._host);
        }
        if (this._left.isPixel) {
            this._currentMeasure.left += this._left.getValue(this._host);
        }
        else {
            this._currentMeasure.left += parentWidth * this._left.getValue(this._host);
        }
        if (this._top.isPixel) {
            this._currentMeasure.top += this._top.getValue(this._host);
        }
        else {
            this._currentMeasure.top += parentHeight * this._top.getValue(this._host);
        }
        this._currentMeasure.left += x;
        this._currentMeasure.top += y;
    };
    /** @hidden */
    Control.prototype._preMeasure = function (parentMeasure, context) {
        // Do nothing
    };
    /** @hidden */
    Control.prototype._additionalProcessing = function (parentMeasure, context) {
        // Do nothing
    };
    /** @hidden */
    Control.prototype._clipForChildren = function (context) {
        // DO nothing
    };
    Control.prototype._clip = function (context, invalidatedRectangle) {
        context.beginPath();
        Control._ClipMeasure.copyFrom(this._currentMeasure);
        if (invalidatedRectangle) {
            // Rotate the invalidated rect into the control's space
            invalidatedRectangle.transformToRef(this._invertTransformMatrix, this._tmpMeasureA);
            // Get the intersection of the rect in context space and the current context
            var intersection = new _measure__WEBPACK_IMPORTED_MODULE_2__["Measure"](0, 0, 0, 0);
            intersection.left = Math.max(this._tmpMeasureA.left, this._currentMeasure.left);
            intersection.top = Math.max(this._tmpMeasureA.top, this._currentMeasure.top);
            intersection.width = Math.min(this._tmpMeasureA.left + this._tmpMeasureA.width, this._currentMeasure.left + this._currentMeasure.width) - intersection.left;
            intersection.height = Math.min(this._tmpMeasureA.top + this._tmpMeasureA.height, this._currentMeasure.top + this._currentMeasure.height) - intersection.top;
            Control._ClipMeasure.copyFrom(intersection);
        }
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            var shadowOffsetX = this.shadowOffsetX;
            var shadowOffsetY = this.shadowOffsetY;
            var shadowBlur = this.shadowBlur;
            var leftShadowOffset = Math.min(Math.min(shadowOffsetX, 0) - shadowBlur * 2, 0);
            var rightShadowOffset = Math.max(Math.max(shadowOffsetX, 0) + shadowBlur * 2, 0);
            var topShadowOffset = Math.min(Math.min(shadowOffsetY, 0) - shadowBlur * 2, 0);
            var bottomShadowOffset = Math.max(Math.max(shadowOffsetY, 0) + shadowBlur * 2, 0);
            context.rect(Control._ClipMeasure.left + leftShadowOffset, Control._ClipMeasure.top + topShadowOffset, Control._ClipMeasure.width + rightShadowOffset - leftShadowOffset, Control._ClipMeasure.height + bottomShadowOffset - topShadowOffset);
        }
        else {
            context.rect(Control._ClipMeasure.left, Control._ClipMeasure.top, Control._ClipMeasure.width, Control._ClipMeasure.height);
        }
        context.clip();
    };
    /** @hidden */
    Control.prototype._render = function (context, invalidatedRectangle) {
        if (!this.isVisible || this.notRenderable || this._isClipped) {
            this._isDirty = false;
            return false;
        }
        this.host._numRenderCalls++;
        context.save();
        this._applyStates(context);
        // Transform
        this._transform(context);
        // Clip
        if (this.clipContent) {
            this._clip(context, invalidatedRectangle);
        }
        if (this.onBeforeDrawObservable.hasObservers()) {
            this.onBeforeDrawObservable.notifyObservers(this);
        }
        if (this.useBitmapCache && !this._wasDirty && this._cacheData) {
            context.putImageData(this._cacheData, this._currentMeasure.left, this._currentMeasure.top);
        }
        else {
            this._draw(context, invalidatedRectangle);
        }
        if (this.useBitmapCache && this._wasDirty) {
            this._cacheData = context.getImageData(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
        }
        this._renderHighlight(context);
        if (this.onAfterDrawObservable.hasObservers()) {
            this.onAfterDrawObservable.notifyObservers(this);
        }
        context.restore();
        return true;
    };
    /** @hidden */
    Control.prototype._draw = function (context, invalidatedRectangle) {
        // Do nothing
    };
    /**
     * Tests if a given coordinates belong to the current control
     * @param x defines x coordinate to test
     * @param y defines y coordinate to test
     * @returns true if the coordinates are inside the control
     */
    Control.prototype.contains = function (x, y) {
        // Invert transform
        this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);
        x = this._transformedPosition.x;
        y = this._transformedPosition.y;
        // Check
        if (x < this._currentMeasure.left) {
            return false;
        }
        if (x > this._currentMeasure.left + this._currentMeasure.width) {
            return false;
        }
        if (y < this._currentMeasure.top) {
            return false;
        }
        if (y > this._currentMeasure.top + this._currentMeasure.height) {
            return false;
        }
        if (this.isPointerBlocker) {
            this._host._shouldBlockPointer = true;
        }
        return true;
    };
    /** @hidden */
    Control.prototype._processPicking = function (x, y, type, pointerId, buttonIndex, deltaX, deltaY) {
        if (!this._isEnabled) {
            return false;
        }
        if (!this.isHitTestVisible || !this.isVisible || this._doNotRender) {
            return false;
        }
        if (!this.contains(x, y)) {
            return false;
        }
        this._processObservables(type, x, y, pointerId, buttonIndex, deltaX, deltaY);
        return true;
    };
    /** @hidden */
    Control.prototype._onPointerMove = function (target, coordinates, pointerId) {
        var canNotify = this.onPointerMoveObservable.notifyObservers(coordinates, -1, target, this);
        if (canNotify && this.parent != null) {
            this.parent._onPointerMove(target, coordinates, pointerId);
        }
    };
    /** @hidden */
    Control.prototype._onPointerEnter = function (target) {
        if (!this._isEnabled) {
            return false;
        }
        if (this._enterCount > 0) {
            return false;
        }
        if (this._enterCount === -1) { // -1 is for touch input, we are now sure we are with a mouse or pencil
            this._enterCount = 0;
        }
        this._enterCount++;
        var canNotify = this.onPointerEnterObservable.notifyObservers(this, -1, target, this);
        if (canNotify && this.parent != null) {
            this.parent._onPointerEnter(target);
        }
        return true;
    };
    /** @hidden */
    Control.prototype._onPointerOut = function (target, force) {
        if (force === void 0) { force = false; }
        if (!force && (!this._isEnabled || target === this)) {
            return;
        }
        this._enterCount = 0;
        var canNotify = true;
        if (!target.isAscendant(this)) {
            canNotify = this.onPointerOutObservable.notifyObservers(this, -1, target, this);
        }
        if (canNotify && this.parent != null) {
            this.parent._onPointerOut(target, force);
        }
    };
    /** @hidden */
    Control.prototype._onPointerDown = function (target, coordinates, pointerId, buttonIndex) {
        // Prevent pointerout to lose control context.
        // Event redundancy is checked inside the function.
        this._onPointerEnter(this);
        if (this._downCount !== 0) {
            return false;
        }
        this._downCount++;
        this._downPointerIds[pointerId] = true;
        var canNotify = this.onPointerDownObservable.notifyObservers(new _math2D__WEBPACK_IMPORTED_MODULE_3__["Vector2WithInfo"](coordinates, buttonIndex), -1, target, this);
        if (canNotify && this.parent != null) {
            this.parent._onPointerDown(target, coordinates, pointerId, buttonIndex);
        }
        return true;
    };
    /** @hidden */
    Control.prototype._onPointerUp = function (target, coordinates, pointerId, buttonIndex, notifyClick) {
        if (!this._isEnabled) {
            return;
        }
        this._downCount = 0;
        delete this._downPointerIds[pointerId];
        var canNotifyClick = notifyClick;
        if (notifyClick && (this._enterCount > 0 || this._enterCount === -1)) {
            canNotifyClick = this.onPointerClickObservable.notifyObservers(new _math2D__WEBPACK_IMPORTED_MODULE_3__["Vector2WithInfo"](coordinates, buttonIndex), -1, target, this);
        }
        var canNotify = this.onPointerUpObservable.notifyObservers(new _math2D__WEBPACK_IMPORTED_MODULE_3__["Vector2WithInfo"](coordinates, buttonIndex), -1, target, this);
        if (canNotify && this.parent != null) {
            this.parent._onPointerUp(target, coordinates, pointerId, buttonIndex, canNotifyClick);
        }
    };
    /** @hidden */
    Control.prototype._forcePointerUp = function (pointerId) {
        if (pointerId === void 0) { pointerId = null; }
        if (pointerId !== null) {
            this._onPointerUp(this, babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector2"].Zero(), pointerId, 0, true);
        }
        else {
            for (var key in this._downPointerIds) {
                this._onPointerUp(this, babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector2"].Zero(), +key, 0, true);
            }
        }
    };
    /** @hidden */
    Control.prototype._onWheelScroll = function (deltaX, deltaY) {
        if (!this._isEnabled) {
            return;
        }
        var canNotify = this.onWheelObservable.notifyObservers(new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector2"](deltaX, deltaY));
        if (canNotify && this.parent != null) {
            this.parent._onWheelScroll(deltaX, deltaY);
        }
    };
    /** @hidden */
    Control.prototype._onCanvasBlur = function () { };
    /** @hidden */
    Control.prototype._processObservables = function (type, x, y, pointerId, buttonIndex, deltaX, deltaY) {
        if (!this._isEnabled) {
            return false;
        }
        this._dummyVector2.copyFromFloats(x, y);
        if (type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["PointerEventTypes"].POINTERMOVE) {
            this._onPointerMove(this, this._dummyVector2, pointerId);
            var previousControlOver = this._host._lastControlOver[pointerId];
            if (previousControlOver && previousControlOver !== this) {
                previousControlOver._onPointerOut(this);
            }
            if (previousControlOver !== this) {
                this._onPointerEnter(this);
            }
            this._host._lastControlOver[pointerId] = this;
            return true;
        }
        if (type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["PointerEventTypes"].POINTERDOWN) {
            this._onPointerDown(this, this._dummyVector2, pointerId, buttonIndex);
            this._host._registerLastControlDown(this, pointerId);
            this._host._lastPickedControl = this;
            return true;
        }
        if (type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["PointerEventTypes"].POINTERUP) {
            if (this._host._lastControlDown[pointerId]) {
                this._host._lastControlDown[pointerId]._onPointerUp(this, this._dummyVector2, pointerId, buttonIndex, true);
            }
            delete this._host._lastControlDown[pointerId];
            return true;
        }
        if (type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["PointerEventTypes"].POINTERWHEEL) {
            if (this._host._lastControlOver[pointerId]) {
                this._host._lastControlOver[pointerId]._onWheelScroll(deltaX, deltaY);
                return true;
            }
        }
        return false;
    };
    Control.prototype._prepareFont = function () {
        if (!this._font && !this._fontSet) {
            return;
        }
        if (this._style) {
            this._font = this._style.fontStyle + " " + this._style.fontWeight + " " + this.fontSizeInPixels + "px " + this._style.fontFamily;
        }
        else {
            this._font = this._fontStyle + " " + this._fontWeight + " " + this.fontSizeInPixels + "px " + this._fontFamily;
        }
        this._fontOffset = Control._GetFontOffset(this._font);
    };
    /** Releases associated resources */
    Control.prototype.dispose = function () {
        this.onDirtyObservable.clear();
        this.onBeforeDrawObservable.clear();
        this.onAfterDrawObservable.clear();
        this.onPointerDownObservable.clear();
        this.onPointerEnterObservable.clear();
        this.onPointerMoveObservable.clear();
        this.onPointerOutObservable.clear();
        this.onPointerUpObservable.clear();
        this.onPointerClickObservable.clear();
        this.onWheelObservable.clear();
        if (this._styleObserver && this._style) {
            this._style.onChangedObservable.remove(this._styleObserver);
            this._styleObserver = null;
        }
        if (this.parent) {
            this.parent.removeControl(this);
            this.parent = null;
        }
        if (this._host) {
            var index = this._host._linkedControls.indexOf(this);
            if (index > -1) {
                this.linkWithMesh(null);
            }
        }
        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
    };
    Object.defineProperty(Control, "HORIZONTAL_ALIGNMENT_LEFT", {
        /** HORIZONTAL_ALIGNMENT_LEFT */
        get: function () {
            return Control._HORIZONTAL_ALIGNMENT_LEFT;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control, "HORIZONTAL_ALIGNMENT_RIGHT", {
        /** HORIZONTAL_ALIGNMENT_RIGHT */
        get: function () {
            return Control._HORIZONTAL_ALIGNMENT_RIGHT;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control, "HORIZONTAL_ALIGNMENT_CENTER", {
        /** HORIZONTAL_ALIGNMENT_CENTER */
        get: function () {
            return Control._HORIZONTAL_ALIGNMENT_CENTER;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control, "VERTICAL_ALIGNMENT_TOP", {
        /** VERTICAL_ALIGNMENT_TOP */
        get: function () {
            return Control._VERTICAL_ALIGNMENT_TOP;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control, "VERTICAL_ALIGNMENT_BOTTOM", {
        /** VERTICAL_ALIGNMENT_BOTTOM */
        get: function () {
            return Control._VERTICAL_ALIGNMENT_BOTTOM;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control, "VERTICAL_ALIGNMENT_CENTER", {
        /** VERTICAL_ALIGNMENT_CENTER */
        get: function () {
            return Control._VERTICAL_ALIGNMENT_CENTER;
        },
        enumerable: false,
        configurable: true
    });
    /** @hidden */
    Control._GetFontOffset = function (font) {
        if (Control._FontHeightSizes[font]) {
            return Control._FontHeightSizes[font];
        }
        var text = document.createElement("span");
        text.innerHTML = "Hg";
        text.style.font = font;
        var block = document.createElement("div");
        block.style.display = "inline-block";
        block.style.width = "1px";
        block.style.height = "0px";
        block.style.verticalAlign = "bottom";
        var div = document.createElement("div");
        div.appendChild(text);
        div.appendChild(block);
        document.body.appendChild(div);
        var fontAscent = 0;
        var fontHeight = 0;
        try {
            fontHeight = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
            block.style.verticalAlign = "baseline";
            fontAscent = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
        }
        finally {
            document.body.removeChild(div);
        }
        var result = { ascent: fontAscent, height: fontHeight, descent: fontHeight - fontAscent };
        Control._FontHeightSizes[font] = result;
        return result;
    };
    /** @hidden */
    Control.drawEllipse = function (x, y, width, height, context) {
        context.translate(x, y);
        context.scale(width, height);
        context.beginPath();
        context.arc(0, 0, 1, 0, 2 * Math.PI);
        context.closePath();
        context.scale(1 / width, 1 / height);
        context.translate(-x, -y);
    };
    /**
     * Gets or sets a boolean indicating if alpha must be an inherited value (false by default)
     */
    Control.AllowAlphaInheritance = false;
    Control._ClipMeasure = new _measure__WEBPACK_IMPORTED_MODULE_2__["Measure"](0, 0, 0, 0);
    // Statics
    Control._HORIZONTAL_ALIGNMENT_LEFT = 0;
    Control._HORIZONTAL_ALIGNMENT_RIGHT = 1;
    Control._HORIZONTAL_ALIGNMENT_CENTER = 2;
    Control._VERTICAL_ALIGNMENT_TOP = 0;
    Control._VERTICAL_ALIGNMENT_BOTTOM = 1;
    Control._VERTICAL_ALIGNMENT_CENTER = 2;
    Control._FontHeightSizes = {};
    /**
     * Creates a stack panel that can be used to render headers
     * @param control defines the control to associate with the header
     * @param text defines the text of the header
     * @param size defines the size of the header
     * @param options defines options used to configure the header
     * @returns a new StackPanel
     * @ignore
     * @hidden
     */
    Control.AddHeader = function () { };
    return Control;
}());

babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["_TypeStore"].RegisteredTypes["BABYLON.GUI.Control"] = Control;


/***/ }),

/***/ "./2D/controls/displayGrid.ts":
/*!************************************!*\
  !*** ./2D/controls/displayGrid.ts ***!
  \************************************/
/*! exports provided: DisplayGrid */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DisplayGrid", function() { return DisplayGrid; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! babylonjs/Misc/typeStore */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2__);



/** Class used to render a grid  */
var DisplayGrid = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(DisplayGrid, _super);
    /**
     * Creates a new GridDisplayRectangle
     * @param name defines the control name
     */
    function DisplayGrid(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._cellWidth = 20;
        _this._cellHeight = 20;
        _this._minorLineTickness = 1;
        _this._minorLineColor = "DarkGray";
        _this._majorLineTickness = 2;
        _this._majorLineColor = "White";
        _this._majorLineFrequency = 5;
        _this._background = "Black";
        _this._displayMajorLines = true;
        _this._displayMinorLines = true;
        return _this;
    }
    Object.defineProperty(DisplayGrid.prototype, "displayMinorLines", {
        /** Gets or sets a boolean indicating if minor lines must be rendered (true by default)) */
        get: function () {
            return this._displayMinorLines;
        },
        set: function (value) {
            if (this._displayMinorLines === value) {
                return;
            }
            this._displayMinorLines = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DisplayGrid.prototype, "displayMajorLines", {
        /** Gets or sets a boolean indicating if major lines must be rendered (true by default)) */
        get: function () {
            return this._displayMajorLines;
        },
        set: function (value) {
            if (this._displayMajorLines === value) {
                return;
            }
            this._displayMajorLines = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DisplayGrid.prototype, "background", {
        /** Gets or sets background color (Black by default) */
        get: function () {
            return this._background;
        },
        set: function (value) {
            if (this._background === value) {
                return;
            }
            this._background = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DisplayGrid.prototype, "cellWidth", {
        /** Gets or sets the width of each cell (20 by default) */
        get: function () {
            return this._cellWidth;
        },
        set: function (value) {
            this._cellWidth = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DisplayGrid.prototype, "cellHeight", {
        /** Gets or sets the height of each cell (20 by default) */
        get: function () {
            return this._cellHeight;
        },
        set: function (value) {
            this._cellHeight = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DisplayGrid.prototype, "minorLineTickness", {
        /** Gets or sets the tickness of minor lines (1 by default) */
        get: function () {
            return this._minorLineTickness;
        },
        set: function (value) {
            this._minorLineTickness = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DisplayGrid.prototype, "minorLineColor", {
        /** Gets or sets the color of minor lines (DarkGray by default) */
        get: function () {
            return this._minorLineColor;
        },
        set: function (value) {
            this._minorLineColor = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DisplayGrid.prototype, "majorLineTickness", {
        /** Gets or sets the tickness of major lines (2 by default) */
        get: function () {
            return this._majorLineTickness;
        },
        set: function (value) {
            this._majorLineTickness = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DisplayGrid.prototype, "majorLineColor", {
        /** Gets or sets the color of major lines (White by default) */
        get: function () {
            return this._majorLineColor;
        },
        set: function (value) {
            this._majorLineColor = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DisplayGrid.prototype, "majorLineFrequency", {
        /** Gets or sets the frequency of major lines (default is 1 every 5 minor lines)*/
        get: function () {
            return this._majorLineFrequency;
        },
        set: function (value) {
            this._majorLineFrequency = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    DisplayGrid.prototype._draw = function (context, invalidatedRectangle) {
        context.save();
        this._applyStates(context);
        if (this._isEnabled) {
            if (this._background) {
                context.fillStyle = this._background;
                context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            }
            var cellCountX = this._currentMeasure.width / this._cellWidth;
            var cellCountY = this._currentMeasure.height / this._cellHeight;
            // Minor lines
            var left = this._currentMeasure.left + this._currentMeasure.width / 2;
            var top_1 = this._currentMeasure.top + this._currentMeasure.height / 2;
            if (this._displayMinorLines) {
                context.strokeStyle = this._minorLineColor;
                context.lineWidth = this._minorLineTickness;
                for (var x = -cellCountX / 2; x < cellCountX / 2; x++) {
                    var cellX = left + x * this.cellWidth;
                    context.beginPath();
                    context.moveTo(cellX, this._currentMeasure.top);
                    context.lineTo(cellX, this._currentMeasure.top + this._currentMeasure.height);
                    context.stroke();
                }
                for (var y = -cellCountY / 2; y < cellCountY / 2; y++) {
                    var cellY = top_1 + y * this.cellHeight;
                    context.beginPath();
                    context.moveTo(this._currentMeasure.left, cellY);
                    context.lineTo(this._currentMeasure.left + this._currentMeasure.width, cellY);
                    context.stroke();
                }
            }
            // Major lines
            if (this._displayMajorLines) {
                context.strokeStyle = this._majorLineColor;
                context.lineWidth = this._majorLineTickness;
                for (var x = -cellCountX / 2 + this._majorLineFrequency; x < cellCountX / 2; x += this._majorLineFrequency) {
                    var cellX = left + x * this.cellWidth;
                    context.beginPath();
                    context.moveTo(cellX, this._currentMeasure.top);
                    context.lineTo(cellX, this._currentMeasure.top + this._currentMeasure.height);
                    context.stroke();
                }
                for (var y = -cellCountY / 2 + this._majorLineFrequency; y < cellCountY / 2; y += this._majorLineFrequency) {
                    var cellY = top_1 + y * this.cellHeight;
                    context.moveTo(this._currentMeasure.left, cellY);
                    context.lineTo(this._currentMeasure.left + this._currentMeasure.width, cellY);
                    context.closePath();
                    context.stroke();
                }
            }
        }
        context.restore();
    };
    DisplayGrid.prototype._getTypeName = function () {
        return "DisplayGrid";
    };
    return DisplayGrid;
}(_control__WEBPACK_IMPORTED_MODULE_1__["Control"]));

babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2__["_TypeStore"].RegisteredTypes["BABYLON.GUI.DisplayGrid"] = DisplayGrid;


/***/ }),

/***/ "./2D/controls/ellipse.ts":
/*!********************************!*\
  !*** ./2D/controls/ellipse.ts ***!
  \********************************/
/*! exports provided: Ellipse */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Ellipse", function() { return Ellipse; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./container */ "./2D/controls/container.ts");
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! babylonjs/Misc/typeStore */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_3__);




/** Class used to create 2D ellipse containers */
var Ellipse = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Ellipse, _super);
    /**
     * Creates a new Ellipse
     * @param name defines the control name
     */
    function Ellipse(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._thickness = 1;
        return _this;
    }
    Object.defineProperty(Ellipse.prototype, "thickness", {
        /** Gets or sets border thickness */
        get: function () {
            return this._thickness;
        },
        set: function (value) {
            if (this._thickness === value) {
                return;
            }
            this._thickness = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Ellipse.prototype._getTypeName = function () {
        return "Ellipse";
    };
    Ellipse.prototype._localDraw = function (context) {
        context.save();
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }
        _control__WEBPACK_IMPORTED_MODULE_2__["Control"].drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2 - this._thickness / 2, this._currentMeasure.height / 2 - this._thickness / 2, context);
        if (this._background) {
            context.fillStyle = this._background;
            context.fill();
        }
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }
        if (this._thickness) {
            if (this.color) {
                context.strokeStyle = this.color;
            }
            context.lineWidth = this._thickness;
            context.stroke();
        }
        context.restore();
    };
    Ellipse.prototype._additionalProcessing = function (parentMeasure, context) {
        _super.prototype._additionalProcessing.call(this, parentMeasure, context);
        this._measureForChildren.width -= 2 * this._thickness;
        this._measureForChildren.height -= 2 * this._thickness;
        this._measureForChildren.left += this._thickness;
        this._measureForChildren.top += this._thickness;
    };
    Ellipse.prototype._clipForChildren = function (context) {
        _control__WEBPACK_IMPORTED_MODULE_2__["Control"].drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2, this._currentMeasure.height / 2, context);
        context.clip();
    };
    return Ellipse;
}(_container__WEBPACK_IMPORTED_MODULE_1__["Container"]));

babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_3__["_TypeStore"].RegisteredTypes["BABYLON.GUI.Ellipse"] = Ellipse;


/***/ }),

/***/ "./2D/controls/grid.ts":
/*!*****************************!*\
  !*** ./2D/controls/grid.ts ***!
  \*****************************/
/*! exports provided: Grid */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Grid", function() { return Grid; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./container */ "./2D/controls/container.ts");
/* harmony import */ var _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../valueAndUnit */ "./2D/valueAndUnit.ts");
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! babylonjs/Misc/tools */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_4__);






/**
 * Class used to create a 2D grid container
 */
var Grid = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Grid, _super);
    /**
     * Creates a new Grid
     * @param name defines control name
     */
    function Grid(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._rowDefinitions = new Array();
        _this._columnDefinitions = new Array();
        _this._cells = {};
        _this._childControls = new Array();
        return _this;
    }
    Object.defineProperty(Grid.prototype, "columnCount", {
        /**
         * Gets the number of columns
         */
        get: function () {
            return this._columnDefinitions.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "rowCount", {
        /**
         * Gets the number of rows
         */
        get: function () {
            return this._rowDefinitions.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "children", {
        /** Gets the list of children */
        get: function () {
            return this._childControls;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "cells", {
        /** Gets the list of cells (e.g. the containers) */
        get: function () {
            return this._cells;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Gets the definition of a specific row
     * @param index defines the index of the row
     * @returns the row definition
     */
    Grid.prototype.getRowDefinition = function (index) {
        if (index < 0 || index >= this._rowDefinitions.length) {
            return null;
        }
        return this._rowDefinitions[index];
    };
    /**
     * Gets the definition of a specific column
     * @param index defines the index of the column
     * @returns the column definition
     */
    Grid.prototype.getColumnDefinition = function (index) {
        if (index < 0 || index >= this._columnDefinitions.length) {
            return null;
        }
        return this._columnDefinitions[index];
    };
    /**
     * Adds a new row to the grid
     * @param height defines the height of the row (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the height is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    Grid.prototype.addRowDefinition = function (height, isPixel) {
        if (isPixel === void 0) { isPixel = false; }
        this._rowDefinitions.push(new _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"](height, isPixel ? _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"].UNITMODE_PIXEL : _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"].UNITMODE_PERCENTAGE));
        this._markAsDirty();
        return this;
    };
    /**
     * Adds a new column to the grid
     * @param width defines the width of the column (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the width is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    Grid.prototype.addColumnDefinition = function (width, isPixel) {
        if (isPixel === void 0) { isPixel = false; }
        this._columnDefinitions.push(new _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"](width, isPixel ? _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"].UNITMODE_PIXEL : _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"].UNITMODE_PERCENTAGE));
        this._markAsDirty();
        return this;
    };
    /**
     * Update a row definition
     * @param index defines the index of the row to update
     * @param height defines the height of the row (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the weight is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    Grid.prototype.setRowDefinition = function (index, height, isPixel) {
        if (isPixel === void 0) { isPixel = false; }
        if (index < 0 || index >= this._rowDefinitions.length) {
            return this;
        }
        var current = this._rowDefinitions[index];
        if (current && current.isPixel === isPixel && current.internalValue === height) {
            return this;
        }
        this._rowDefinitions[index] = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"](height, isPixel ? _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"].UNITMODE_PIXEL : _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"].UNITMODE_PERCENTAGE);
        this._markAsDirty();
        return this;
    };
    /**
     * Update a column definition
     * @param index defines the index of the column to update
     * @param width defines the width of the column (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the width is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    Grid.prototype.setColumnDefinition = function (index, width, isPixel) {
        if (isPixel === void 0) { isPixel = false; }
        if (index < 0 || index >= this._columnDefinitions.length) {
            return this;
        }
        var current = this._columnDefinitions[index];
        if (current && current.isPixel === isPixel && current.internalValue === width) {
            return this;
        }
        this._columnDefinitions[index] = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"](width, isPixel ? _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"].UNITMODE_PIXEL : _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"].UNITMODE_PERCENTAGE);
        this._markAsDirty();
        return this;
    };
    /**
     * Gets the list of children stored in a specific cell
     * @param row defines the row to check
     * @param column defines the column to check
     * @returns the list of controls
     */
    Grid.prototype.getChildrenAt = function (row, column) {
        var cell = this._cells[row + ":" + column];
        if (!cell) {
            return null;
        }
        return cell.children;
    };
    /**
     * Gets a string representing the child cell info (row x column)
     * @param child defines the control to get info from
     * @returns a string containing the child cell info (row x column)
     */
    Grid.prototype.getChildCellInfo = function (child) {
        return child._tag;
    };
    Grid.prototype._removeCell = function (cell, key) {
        if (!cell) {
            return;
        }
        _super.prototype.removeControl.call(this, cell);
        for (var _i = 0, _a = cell.children; _i < _a.length; _i++) {
            var control = _a[_i];
            var childIndex = this._childControls.indexOf(control);
            if (childIndex !== -1) {
                this._childControls.splice(childIndex, 1);
            }
        }
        delete this._cells[key];
    };
    Grid.prototype._offsetCell = function (previousKey, key) {
        if (!this._cells[key]) {
            return;
        }
        this._cells[previousKey] = this._cells[key];
        for (var _i = 0, _a = this._cells[previousKey].children; _i < _a.length; _i++) {
            var control = _a[_i];
            control._tag = previousKey;
        }
        delete this._cells[key];
    };
    /**
     * Remove a column definition at specified index
     * @param index defines the index of the column to remove
     * @returns the current grid
     */
    Grid.prototype.removeColumnDefinition = function (index) {
        if (index < 0 || index >= this._columnDefinitions.length) {
            return this;
        }
        for (var x = 0; x < this._rowDefinitions.length; x++) {
            var key = x + ":" + index;
            var cell = this._cells[key];
            this._removeCell(cell, key);
        }
        for (var x = 0; x < this._rowDefinitions.length; x++) {
            for (var y = index + 1; y < this._columnDefinitions.length; y++) {
                var previousKey = x + ":" + (y - 1);
                var key = x + ":" + y;
                this._offsetCell(previousKey, key);
            }
        }
        this._columnDefinitions.splice(index, 1);
        this._markAsDirty();
        return this;
    };
    /**
     * Remove a row definition at specified index
     * @param index defines the index of the row to remove
     * @returns the current grid
     */
    Grid.prototype.removeRowDefinition = function (index) {
        if (index < 0 || index >= this._rowDefinitions.length) {
            return this;
        }
        for (var y = 0; y < this._columnDefinitions.length; y++) {
            var key = index + ":" + y;
            var cell = this._cells[key];
            this._removeCell(cell, key);
        }
        for (var y = 0; y < this._columnDefinitions.length; y++) {
            for (var x = index + 1; x < this._rowDefinitions.length; x++) {
                var previousKey = x - 1 + ":" + y;
                var key = x + ":" + y;
                this._offsetCell(previousKey, key);
            }
        }
        this._rowDefinitions.splice(index, 1);
        this._markAsDirty();
        return this;
    };
    /**
     * Adds a new control to the current grid
     * @param control defines the control to add
     * @param row defines the row where to add the control (0 by default)
     * @param column defines the column where to add the control (0 by default)
     * @returns the current grid
     */
    Grid.prototype.addControl = function (control, row, column) {
        if (row === void 0) { row = 0; }
        if (column === void 0) { column = 0; }
        if (this._rowDefinitions.length === 0) {
            // Add default row definition
            this.addRowDefinition(1, false);
        }
        if (this._columnDefinitions.length === 0) {
            // Add default column definition
            this.addColumnDefinition(1, false);
        }
        if (this._childControls.indexOf(control) !== -1) {
            babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_4__["Tools"].Warn("Control (Name:" + control.name + ", UniqueId:" + control.uniqueId + ") is already associated with this grid. You must remove it before reattaching it");
            return this;
        }
        var x = Math.min(row, this._rowDefinitions.length - 1);
        var y = Math.min(column, this._columnDefinitions.length - 1);
        var key = x + ":" + y;
        var goodContainer = this._cells[key];
        if (!goodContainer) {
            goodContainer = new _container__WEBPACK_IMPORTED_MODULE_1__["Container"](key);
            this._cells[key] = goodContainer;
            goodContainer.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
            goodContainer.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_TOP;
            _super.prototype.addControl.call(this, goodContainer);
        }
        goodContainer.addControl(control);
        this._childControls.push(control);
        control._tag = key;
        control.parent = this;
        this._markAsDirty();
        return this;
    };
    /**
     * Removes a control from the current container
     * @param control defines the control to remove
     * @returns the current container
     */
    Grid.prototype.removeControl = function (control) {
        var index = this._childControls.indexOf(control);
        if (index !== -1) {
            this._childControls.splice(index, 1);
        }
        var cell = this._cells[control._tag];
        if (cell) {
            cell.removeControl(control);
            control._tag = null;
        }
        this._markAsDirty();
        return this;
    };
    Grid.prototype._getTypeName = function () {
        return "Grid";
    };
    Grid.prototype._getGridDefinitions = function (definitionCallback) {
        var widths = [];
        var heights = [];
        var lefts = [];
        var tops = [];
        var availableWidth = this._currentMeasure.width;
        var globalWidthPercentage = 0;
        var availableHeight = this._currentMeasure.height;
        var globalHeightPercentage = 0;
        // Heights
        var index = 0;
        for (var _i = 0, _a = this._rowDefinitions; _i < _a.length; _i++) {
            var value = _a[_i];
            if (value.isPixel) {
                var height = value.getValue(this._host);
                availableHeight -= height;
                heights[index] = height;
            }
            else {
                globalHeightPercentage += value.internalValue;
            }
            index++;
        }
        var top = 0;
        index = 0;
        for (var _b = 0, _c = this._rowDefinitions; _b < _c.length; _b++) {
            var value = _c[_b];
            tops.push(top);
            if (!value.isPixel) {
                var height = (value.internalValue / globalHeightPercentage) * availableHeight;
                top += height;
                heights[index] = height;
            }
            else {
                top += value.getValue(this._host);
            }
            index++;
        }
        // Widths
        index = 0;
        for (var _d = 0, _e = this._columnDefinitions; _d < _e.length; _d++) {
            var value = _e[_d];
            if (value.isPixel) {
                var width = value.getValue(this._host);
                availableWidth -= width;
                widths[index] = width;
            }
            else {
                globalWidthPercentage += value.internalValue;
            }
            index++;
        }
        var left = 0;
        index = 0;
        for (var _f = 0, _g = this._columnDefinitions; _f < _g.length; _f++) {
            var value = _g[_f];
            lefts.push(left);
            if (!value.isPixel) {
                var width = (value.internalValue / globalWidthPercentage) * availableWidth;
                left += width;
                widths[index] = width;
            }
            else {
                left += value.getValue(this._host);
            }
            index++;
        }
        definitionCallback(lefts, tops, widths, heights);
    };
    Grid.prototype._additionalProcessing = function (parentMeasure, context) {
        var _this = this;
        this._getGridDefinitions(function (lefts, tops, widths, heights) {
            // Setting child sizes
            for (var key in _this._cells) {
                if (!_this._cells.hasOwnProperty(key)) {
                    continue;
                }
                var split = key.split(":");
                var x = parseInt(split[0]);
                var y = parseInt(split[1]);
                var cell = _this._cells[key];
                cell.left = lefts[y] + "px";
                cell.top = tops[x] + "px";
                cell.width = widths[y] + "px";
                cell.height = heights[x] + "px";
                cell._left.ignoreAdaptiveScaling = true;
                cell._top.ignoreAdaptiveScaling = true;
                cell._width.ignoreAdaptiveScaling = true;
                cell._height.ignoreAdaptiveScaling = true;
            }
        });
        _super.prototype._additionalProcessing.call(this, parentMeasure, context);
    };
    Grid.prototype._flagDescendantsAsMatrixDirty = function () {
        for (var key in this._cells) {
            if (!this._cells.hasOwnProperty(key)) {
                continue;
            }
            var child = this._cells[key];
            child._markMatrixAsDirty();
        }
    };
    Grid.prototype._renderHighlightSpecific = function (context) {
        var _this = this;
        _super.prototype._renderHighlightSpecific.call(this, context);
        this._getGridDefinitions(function (lefts, tops, widths, heights) {
            // Columns
            for (var index = 0; index < lefts.length; index++) {
                var left = _this._currentMeasure.left + lefts[index] + widths[index];
                context.beginPath();
                context.moveTo(left, _this._currentMeasure.top);
                context.lineTo(left, _this._currentMeasure.top + _this._currentMeasure.height);
                context.stroke();
            }
            // Rows
            for (var index = 0; index < tops.length; index++) {
                var top_1 = _this._currentMeasure.top + tops[index] + heights[index];
                context.beginPath();
                context.moveTo(_this._currentMeasure.left, top_1);
                context.lineTo(_this._currentMeasure.left + _this._currentMeasure.width, top_1);
                context.stroke();
            }
        });
        context.restore();
    };
    /** Releases associated resources */
    Grid.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        for (var _i = 0, _a = this._childControls; _i < _a.length; _i++) {
            var control = _a[_i];
            control.dispose();
        }
        this._childControls = [];
    };
    return Grid;
}(_container__WEBPACK_IMPORTED_MODULE_1__["Container"]));

babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_4__["_TypeStore"].RegisteredTypes["BABYLON.GUI.Grid"] = Grid;


/***/ }),

/***/ "./2D/controls/image.ts":
/*!******************************!*\
  !*** ./2D/controls/image.ts ***!
  \******************************/
/*! exports provided: Image */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Image", function() { return Image; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");





/**
 * Class used to create 2D images
 */
var Image = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Image, _super);
    /**
     * Creates a new Image
     * @param name defines the control name
     * @param url defines the image url
     */
    function Image(name, url) {
        if (url === void 0) { url = null; }
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._workingCanvas = null;
        _this._loaded = false;
        _this._stretch = Image.STRETCH_FILL;
        _this._autoScale = false;
        _this._sourceLeft = 0;
        _this._sourceTop = 0;
        _this._sourceWidth = 0;
        _this._sourceHeight = 0;
        _this._svgAttributesComputationCompleted = false;
        _this._isSVG = false;
        _this._cellWidth = 0;
        _this._cellHeight = 0;
        _this._cellId = -1;
        _this._populateNinePatchSlicesFromImage = false;
        _this._imageDataCache = { data: null, key: "" };
        /**
         * Observable notified when the content is loaded
         */
        _this.onImageLoadedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /**
         * Observable notified when _sourceLeft, _sourceTop, _sourceWidth and _sourceHeight are computed
         */
        _this.onSVGAttributesComputedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        _this.source = url;
        return _this;
    }
    Object.defineProperty(Image.prototype, "isLoaded", {
        /**
         * Gets a boolean indicating that the content is loaded
         */
        get: function () {
            return this._loaded;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "populateNinePatchSlicesFromImage", {
        /**
         * Gets or sets a boolean indicating if nine patch slices (left, top, right, bottom) should be read from image data
         */
        get: function () {
            return this._populateNinePatchSlicesFromImage;
        },
        set: function (value) {
            if (this._populateNinePatchSlicesFromImage === value) {
                return;
            }
            this._populateNinePatchSlicesFromImage = value;
            if (this._populateNinePatchSlicesFromImage && this._loaded) {
                this._extractNinePatchSliceDataFromImage();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "detectPointerOnOpaqueOnly", {
        /**
         * Gets or sets a boolean indicating if pointers should only be validated on pixels with alpha > 0.
         * Beware using this as this will comsume more memory as the image has to be stored twice
         */
        get: function () {
            return this._detectPointerOnOpaqueOnly;
        },
        set: function (value) {
            if (this._detectPointerOnOpaqueOnly === value) {
                return;
            }
            this._detectPointerOnOpaqueOnly = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "sliceLeft", {
        /**
         * Gets or sets the left value for slicing (9-patch)
         */
        get: function () {
            return this._sliceLeft;
        },
        set: function (value) {
            if (this._sliceLeft === value) {
                return;
            }
            this._sliceLeft = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "sliceRight", {
        /**
         * Gets or sets the right value for slicing (9-patch)
         */
        get: function () {
            return this._sliceRight;
        },
        set: function (value) {
            if (this._sliceRight === value) {
                return;
            }
            this._sliceRight = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "sliceTop", {
        /**
         * Gets or sets the top value for slicing (9-patch)
         */
        get: function () {
            return this._sliceTop;
        },
        set: function (value) {
            if (this._sliceTop === value) {
                return;
            }
            this._sliceTop = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "sliceBottom", {
        /**
         * Gets or sets the bottom value for slicing (9-patch)
         */
        get: function () {
            return this._sliceBottom;
        },
        set: function (value) {
            if (this._sliceBottom === value) {
                return;
            }
            this._sliceBottom = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "sourceLeft", {
        /**
         * Gets or sets the left coordinate in the source image
         */
        get: function () {
            return this._sourceLeft;
        },
        set: function (value) {
            if (this._sourceLeft === value) {
                return;
            }
            this._sourceLeft = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "sourceTop", {
        /**
         * Gets or sets the top coordinate in the source image
         */
        get: function () {
            return this._sourceTop;
        },
        set: function (value) {
            if (this._sourceTop === value) {
                return;
            }
            this._sourceTop = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "sourceWidth", {
        /**
         * Gets or sets the width to capture in the source image
         */
        get: function () {
            return this._sourceWidth;
        },
        set: function (value) {
            if (this._sourceWidth === value) {
                return;
            }
            this._sourceWidth = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "sourceHeight", {
        /**
         * Gets or sets the height to capture in the source image
         */
        get: function () {
            return this._sourceHeight;
        },
        set: function (value) {
            if (this._sourceHeight === value) {
                return;
            }
            this._sourceHeight = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "isSVG", {
        /** Indicates if the format of the image is SVG */
        get: function () {
            return this._isSVG;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "svgAttributesComputationCompleted", {
        /** Gets the status of the SVG attributes computation (sourceLeft, sourceTop, sourceWidth, sourceHeight) */
        get: function () {
            return this._svgAttributesComputationCompleted;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "autoScale", {
        /**
         * Gets or sets a boolean indicating if the image can force its container to adapt its size
         * @see https://doc.babylonjs.com/how_to/gui#image
         */
        get: function () {
            return this._autoScale;
        },
        set: function (value) {
            if (this._autoScale === value) {
                return;
            }
            this._autoScale = value;
            if (value && this._loaded) {
                this.synchronizeSizeWithContent();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "stretch", {
        /** Gets or sets the streching mode used by the image */
        get: function () {
            return this._stretch;
        },
        set: function (value) {
            if (this._stretch === value) {
                return;
            }
            this._stretch = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    /** @hidden */
    Image.prototype._rotate90 = function (n, preserveProperties) {
        if (preserveProperties === void 0) { preserveProperties = false; }
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var width = this._domImage.width;
        var height = this._domImage.height;
        canvas.width = height;
        canvas.height = width;
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate(n * Math.PI / 2);
        context.drawImage(this._domImage, 0, 0, width, height, -width / 2, -height / 2, width, height);
        var dataUrl = canvas.toDataURL("image/jpg");
        var rotatedImage = new Image(this.name + "rotated", dataUrl);
        if (preserveProperties) {
            rotatedImage._stretch = this._stretch;
            rotatedImage._autoScale = this._autoScale;
            rotatedImage._cellId = this._cellId;
            rotatedImage._cellWidth = n % 1 ? this._cellHeight : this._cellWidth;
            rotatedImage._cellHeight = n % 1 ? this._cellWidth : this._cellHeight;
        }
        this._handleRotationForSVGImage(this, rotatedImage, n);
        this._imageDataCache.data = null;
        return rotatedImage;
    };
    Image.prototype._handleRotationForSVGImage = function (srcImage, dstImage, n) {
        var _this = this;
        if (!srcImage._isSVG) {
            return;
        }
        if (srcImage._svgAttributesComputationCompleted) {
            this._rotate90SourceProperties(srcImage, dstImage, n);
            this._markAsDirty();
        }
        else {
            srcImage.onSVGAttributesComputedObservable.addOnce(function () {
                _this._rotate90SourceProperties(srcImage, dstImage, n);
                _this._markAsDirty();
            });
        }
    };
    Image.prototype._rotate90SourceProperties = function (srcImage, dstImage, n) {
        var _a, _b;
        var srcLeft = srcImage.sourceLeft, srcTop = srcImage.sourceTop, srcWidth = srcImage.domImage.width, srcHeight = srcImage.domImage.height;
        var dstLeft = srcLeft, dstTop = srcTop, dstWidth = srcImage.sourceWidth, dstHeight = srcImage.sourceHeight;
        if (n != 0) {
            var mult = n < 0 ? -1 : 1;
            n = n % 4;
            for (var i = 0; i < Math.abs(n); ++i) {
                dstLeft = -(srcTop - srcHeight / 2) * mult + srcHeight / 2;
                dstTop = (srcLeft - srcWidth / 2) * mult + srcWidth / 2;
                _a = [dstHeight, dstWidth], dstWidth = _a[0], dstHeight = _a[1];
                if (n < 0) {
                    dstTop -= dstHeight;
                }
                else {
                    dstLeft -= dstWidth;
                }
                srcLeft = dstLeft;
                srcTop = dstTop;
                _b = [srcHeight, srcWidth], srcWidth = _b[0], srcHeight = _b[1];
            }
        }
        dstImage.sourceLeft = dstLeft;
        dstImage.sourceTop = dstTop;
        dstImage.sourceWidth = dstWidth;
        dstImage.sourceHeight = dstHeight;
    };
    Object.defineProperty(Image.prototype, "domImage", {
        get: function () {
            return this._domImage;
        },
        /**
         * Gets or sets the internal DOM image used to render the control
         */
        set: function (value) {
            var _this = this;
            this._domImage = value;
            this._loaded = false;
            this._imageDataCache.data = null;
            if (this._domImage.width) {
                this._onImageLoaded();
            }
            else {
                this._domImage.onload = function () {
                    _this._onImageLoaded();
                };
            }
        },
        enumerable: false,
        configurable: true
    });
    Image.prototype._onImageLoaded = function () {
        this._imageDataCache.data = null;
        this._imageWidth = this._domImage.width;
        this._imageHeight = this._domImage.height;
        this._loaded = true;
        if (this._populateNinePatchSlicesFromImage) {
            this._extractNinePatchSliceDataFromImage();
        }
        if (this._autoScale) {
            this.synchronizeSizeWithContent();
        }
        this.onImageLoadedObservable.notifyObservers(this);
        this._markAsDirty();
    };
    Image.prototype._extractNinePatchSliceDataFromImage = function () {
        if (!this._workingCanvas) {
            this._workingCanvas = document.createElement('canvas');
        }
        var canvas = this._workingCanvas;
        var context = canvas.getContext('2d');
        var width = this._domImage.width;
        var height = this._domImage.height;
        canvas.width = width;
        canvas.height = height;
        context.drawImage(this._domImage, 0, 0, width, height);
        var imageData = context.getImageData(0, 0, width, height);
        // Left and right
        this._sliceLeft = -1;
        this._sliceRight = -1;
        for (var x = 0; x < width; x++) {
            var alpha = imageData.data[x * 4 + 3];
            if (alpha > 127 && this._sliceLeft === -1) {
                this._sliceLeft = x;
                continue;
            }
            if (alpha < 127 && this._sliceLeft > -1) {
                this._sliceRight = x;
                break;
            }
        }
        // top and bottom
        this._sliceTop = -1;
        this._sliceBottom = -1;
        for (var y = 0; y < height; y++) {
            var alpha = imageData.data[y * width * 4 + 3];
            if (alpha > 127 && this._sliceTop === -1) {
                this._sliceTop = y;
                continue;
            }
            if (alpha < 127 && this._sliceTop > -1) {
                this._sliceBottom = y;
                break;
            }
        }
    };
    Object.defineProperty(Image.prototype, "source", {
        /**
         * Gets or sets image source url
         */
        set: function (value) {
            var _this = this;
            if (this._source === value) {
                return;
            }
            this._loaded = false;
            this._source = value;
            this._imageDataCache.data = null;
            if (value) {
                value = this._svgCheck(value);
            }
            this._domImage = document.createElement("img");
            this._domImage.onload = function () {
                _this._onImageLoaded();
            };
            if (value) {
                babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Tools"].SetCorsBehavior(value, this._domImage);
                this._domImage.src = value;
            }
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Checks for svg document with icon id present
     */
    Image.prototype._svgCheck = function (value) {
        var _this = this;
        if (window.SVGSVGElement && (value.search(/.svg#/gi) !== -1) && (value.indexOf("#") === value.lastIndexOf("#"))) {
            this._isSVG = true;
            var svgsrc = value.split('#')[0];
            var elemid = value.split('#')[1];
            // check if object alr exist in document
            var svgExist = document.body.querySelector('object[data="' + svgsrc + '"]');
            if (svgExist) {
                var svgDoc = svgExist.contentDocument;
                // get viewbox width and height, get svg document width and height in px
                if (svgDoc && svgDoc.documentElement) {
                    var vb = svgDoc.documentElement.getAttribute("viewBox");
                    var docwidth = Number(svgDoc.documentElement.getAttribute("width"));
                    var docheight = Number(svgDoc.documentElement.getAttribute("height"));
                    var elem = svgDoc.getElementById(elemid);
                    if (elem && vb && docwidth && docheight) {
                        this._getSVGAttribs(svgExist, elemid);
                        return value;
                    }
                }
                // wait for object to load
                svgExist.addEventListener("load", function () {
                    _this._getSVGAttribs(svgExist, elemid);
                });
            }
            else {
                // create document object
                var svgImage = document.createElement("object");
                svgImage.data = svgsrc;
                svgImage.type = "image/svg+xml";
                svgImage.width = "0%";
                svgImage.height = "0%";
                document.body.appendChild(svgImage);
                // when the object has loaded, get the element attribs
                svgImage.onload = function () {
                    var svgobj = document.body.querySelector('object[data="' + svgsrc + '"]');
                    if (svgobj) {
                        _this._getSVGAttribs(svgobj, elemid);
                    }
                };
            }
            return svgsrc;
        }
        else {
            return value;
        }
    };
    /**
     * Sets sourceLeft, sourceTop, sourceWidth, sourceHeight automatically
     * given external svg file and icon id
     */
    Image.prototype._getSVGAttribs = function (svgsrc, elemid) {
        var svgDoc = svgsrc.contentDocument;
        // get viewbox width and height, get svg document width and height in px
        if (svgDoc && svgDoc.documentElement) {
            var vb = svgDoc.documentElement.getAttribute("viewBox");
            var docwidth = Number(svgDoc.documentElement.getAttribute("width"));
            var docheight = Number(svgDoc.documentElement.getAttribute("height"));
            // get element bbox and matrix transform
            var elem = svgDoc.getElementById(elemid);
            if (vb && docwidth && docheight && elem) {
                var vb_width = Number(vb.split(" ")[2]);
                var vb_height = Number(vb.split(" ")[3]);
                var elem_bbox = elem.getBBox();
                var elem_matrix_a = 1;
                var elem_matrix_d = 1;
                var elem_matrix_e = 0;
                var elem_matrix_f = 0;
                if (elem.transform && elem.transform.baseVal.consolidate()) {
                    elem_matrix_a = elem.transform.baseVal.consolidate().matrix.a;
                    elem_matrix_d = elem.transform.baseVal.consolidate().matrix.d;
                    elem_matrix_e = elem.transform.baseVal.consolidate().matrix.e;
                    elem_matrix_f = elem.transform.baseVal.consolidate().matrix.f;
                }
                // compute source coordinates and dimensions
                this.sourceLeft = ((elem_matrix_a * elem_bbox.x + elem_matrix_e) * docwidth) / vb_width;
                this.sourceTop = ((elem_matrix_d * elem_bbox.y + elem_matrix_f) * docheight) / vb_height;
                this.sourceWidth = (elem_bbox.width * elem_matrix_a) * (docwidth / vb_width);
                this.sourceHeight = (elem_bbox.height * elem_matrix_d) * (docheight / vb_height);
                this._svgAttributesComputationCompleted = true;
                this.onSVGAttributesComputedObservable.notifyObservers(this);
            }
        }
    };
    Object.defineProperty(Image.prototype, "cellWidth", {
        /**
         * Gets or sets the cell width to use when animation sheet is enabled
         * @see https://doc.babylonjs.com/how_to/gui#image
         */
        get: function () {
            return this._cellWidth;
        },
        set: function (value) {
            if (this._cellWidth === value) {
                return;
            }
            this._cellWidth = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "cellHeight", {
        /**
         * Gets or sets the cell height to use when animation sheet is enabled
         * @see https://doc.babylonjs.com/how_to/gui#image
         */
        get: function () {
            return this._cellHeight;
        },
        set: function (value) {
            if (this._cellHeight === value) {
                return;
            }
            this._cellHeight = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "cellId", {
        /**
         * Gets or sets the cell id to use (this will turn on the animation sheet mode)
         * @see https://doc.babylonjs.com/how_to/gui#image
         */
        get: function () {
            return this._cellId;
        },
        set: function (value) {
            if (this._cellId === value) {
                return;
            }
            this._cellId = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Tests if a given coordinates belong to the current control
     * @param x defines x coordinate to test
     * @param y defines y coordinate to test
     * @returns true if the coordinates are inside the control
     */
    Image.prototype.contains = function (x, y) {
        if (!_super.prototype.contains.call(this, x, y)) {
            return false;
        }
        if (!this._detectPointerOnOpaqueOnly || !this._workingCanvas) {
            return true;
        }
        var width = this._currentMeasure.width | 0;
        var height = this._currentMeasure.height | 0;
        var key = width + "_" + height;
        var imageData = this._imageDataCache.data;
        if (!imageData || this._imageDataCache.key !== key) {
            var canvas = this._workingCanvas;
            var context_1 = canvas.getContext("2d");
            this._imageDataCache.data = imageData = context_1.getImageData(0, 0, width, height).data;
            this._imageDataCache.key = key;
        }
        x = (x - this._currentMeasure.left) | 0;
        y = (y - this._currentMeasure.top) | 0;
        var pickedPixel = imageData[(x + y * width) * 4 + 3];
        return pickedPixel > 0;
    };
    Image.prototype._getTypeName = function () {
        return "Image";
    };
    /** Force the control to synchronize with its content */
    Image.prototype.synchronizeSizeWithContent = function () {
        if (!this._loaded) {
            return;
        }
        this.width = this._domImage.width + "px";
        this.height = this._domImage.height + "px";
    };
    Image.prototype._processMeasures = function (parentMeasure, context) {
        if (this._loaded) {
            switch (this._stretch) {
                case Image.STRETCH_NONE:
                    break;
                case Image.STRETCH_FILL:
                    break;
                case Image.STRETCH_UNIFORM:
                    break;
                case Image.STRETCH_NINE_PATCH:
                    break;
                case Image.STRETCH_EXTEND:
                    if (this._autoScale) {
                        this.synchronizeSizeWithContent();
                    }
                    if (this.parent && this.parent.parent) { // Will update root size if root is not the top root
                        this.parent.adaptWidthToChildren = true;
                        this.parent.adaptHeightToChildren = true;
                    }
                    break;
            }
        }
        _super.prototype._processMeasures.call(this, parentMeasure, context);
    };
    Image.prototype._prepareWorkingCanvasForOpaqueDetection = function () {
        if (!this._detectPointerOnOpaqueOnly) {
            return;
        }
        if (!this._workingCanvas) {
            this._workingCanvas = document.createElement('canvas');
        }
        var canvas = this._workingCanvas;
        var width = this._currentMeasure.width;
        var height = this._currentMeasure.height;
        var context = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        context.clearRect(0, 0, width, height);
    };
    Image.prototype._drawImage = function (context, sx, sy, sw, sh, tx, ty, tw, th) {
        context.drawImage(this._domImage, sx, sy, sw, sh, tx, ty, tw, th);
        if (!this._detectPointerOnOpaqueOnly) {
            return;
        }
        var canvas = this._workingCanvas;
        context = canvas.getContext("2d");
        context.drawImage(this._domImage, sx, sy, sw, sh, tx - this._currentMeasure.left, ty - this._currentMeasure.top, tw, th);
    };
    Image.prototype._draw = function (context) {
        context.save();
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }
        var x, y, width, height;
        if (this.cellId == -1) {
            x = this._sourceLeft;
            y = this._sourceTop;
            width = this._sourceWidth ? this._sourceWidth : this._imageWidth;
            height = this._sourceHeight ? this._sourceHeight : this._imageHeight;
        }
        else {
            var rowCount = this._domImage.naturalWidth / this.cellWidth;
            var column = (this.cellId / rowCount) >> 0;
            var row = this.cellId % rowCount;
            x = this.cellWidth * row;
            y = this.cellHeight * column;
            width = this.cellWidth;
            height = this.cellHeight;
        }
        this._prepareWorkingCanvasForOpaqueDetection();
        this._applyStates(context);
        if (this._loaded) {
            switch (this._stretch) {
                case Image.STRETCH_NONE:
                    this._drawImage(context, x, y, width, height, this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                    break;
                case Image.STRETCH_FILL:
                    this._drawImage(context, x, y, width, height, this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                    break;
                case Image.STRETCH_UNIFORM:
                    var hRatio = this._currentMeasure.width / width;
                    var vRatio = this._currentMeasure.height / height;
                    var ratio = Math.min(hRatio, vRatio);
                    var centerX = (this._currentMeasure.width - width * ratio) / 2;
                    var centerY = (this._currentMeasure.height - height * ratio) / 2;
                    this._drawImage(context, x, y, width, height, this._currentMeasure.left + centerX, this._currentMeasure.top + centerY, width * ratio, height * ratio);
                    break;
                case Image.STRETCH_EXTEND:
                    this._drawImage(context, x, y, width, height, this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                    break;
                case Image.STRETCH_NINE_PATCH:
                    this._renderNinePatch(context);
                    break;
            }
        }
        context.restore();
    };
    Image.prototype._renderCornerPatch = function (context, x, y, width, height, targetX, targetY) {
        this._drawImage(context, x, y, width, height, this._currentMeasure.left + targetX, this._currentMeasure.top + targetY, width, height);
    };
    Image.prototype._renderNinePatch = function (context) {
        var height = this._imageHeight;
        var leftWidth = this._sliceLeft;
        var topHeight = this._sliceTop;
        var bottomHeight = this._imageHeight - this._sliceBottom;
        var rightWidth = this._imageWidth - this._sliceRight;
        var left = 0;
        var top = 0;
        if (this._populateNinePatchSlicesFromImage) {
            left = 1;
            top = 1;
            height -= 2;
            leftWidth -= 1;
            topHeight -= 1;
            bottomHeight -= 1;
            rightWidth -= 1;
        }
        var centerWidth = this._sliceRight - this._sliceLeft;
        var targetCenterWidth = this._currentMeasure.width - rightWidth - this.sliceLeft;
        var targetTopHeight = this._currentMeasure.height - height + this._sliceBottom;
        // Corners
        this._renderCornerPatch(context, left, top, leftWidth, topHeight, 0, 0);
        this._renderCornerPatch(context, left, this._sliceBottom, leftWidth, height - this._sliceBottom, 0, targetTopHeight);
        this._renderCornerPatch(context, this._sliceRight, top, rightWidth, topHeight, this._currentMeasure.width - rightWidth, 0);
        this._renderCornerPatch(context, this._sliceRight, this._sliceBottom, rightWidth, height - this._sliceBottom, this._currentMeasure.width - rightWidth, targetTopHeight);
        // Center
        this._drawImage(context, this._sliceLeft, this._sliceTop, centerWidth, this._sliceBottom - this._sliceTop, this._currentMeasure.left + leftWidth, this._currentMeasure.top + topHeight, targetCenterWidth, targetTopHeight - topHeight);
        // Borders
        this._drawImage(context, left, this._sliceTop, leftWidth, this._sliceBottom - this._sliceTop, this._currentMeasure.left, this._currentMeasure.top + topHeight, leftWidth, targetTopHeight - topHeight);
        this._drawImage(context, this._sliceRight, this._sliceTop, leftWidth, this._sliceBottom - this._sliceTop, this._currentMeasure.left + this._currentMeasure.width - rightWidth, this._currentMeasure.top + topHeight, leftWidth, targetTopHeight - topHeight);
        this._drawImage(context, this._sliceLeft, top, centerWidth, topHeight, this._currentMeasure.left + leftWidth, this._currentMeasure.top, targetCenterWidth, topHeight);
        this._drawImage(context, this._sliceLeft, this._sliceBottom, centerWidth, bottomHeight, this._currentMeasure.left + leftWidth, this._currentMeasure.top + targetTopHeight, targetCenterWidth, bottomHeight);
    };
    Image.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this.onImageLoadedObservable.clear();
        this.onSVGAttributesComputedObservable.clear();
    };
    // Static
    /** STRETCH_NONE */
    Image.STRETCH_NONE = 0;
    /** STRETCH_FILL */
    Image.STRETCH_FILL = 1;
    /** STRETCH_UNIFORM */
    Image.STRETCH_UNIFORM = 2;
    /** STRETCH_EXTEND */
    Image.STRETCH_EXTEND = 3;
    /** NINE_PATCH */
    Image.STRETCH_NINE_PATCH = 4;
    return Image;
}(_control__WEBPACK_IMPORTED_MODULE_2__["Control"]));

babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GUI.Image"] = Image;


/***/ }),

/***/ "./2D/controls/index.ts":
/*!******************************!*\
  !*** ./2D/controls/index.ts ***!
  \******************************/
/*! exports provided: Button, Checkbox, ColorPicker, Container, Control, Ellipse, Grid, Image, InputText, InputPassword, Line, MultiLine, RadioButton, StackPanel, SelectorGroup, CheckboxGroup, RadioGroup, SliderGroup, SelectionPanel, ScrollViewer, TextWrapping, TextBlock, KeyPropertySet, VirtualKeyboard, Rectangle, DisplayGrid, BaseSlider, Slider, ImageBasedSlider, ScrollBar, ImageScrollBar, name */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _button__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./button */ "./2D/controls/button.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Button", function() { return _button__WEBPACK_IMPORTED_MODULE_0__["Button"]; });

/* harmony import */ var _checkbox__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./checkbox */ "./2D/controls/checkbox.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Checkbox", function() { return _checkbox__WEBPACK_IMPORTED_MODULE_1__["Checkbox"]; });

/* harmony import */ var _colorpicker__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./colorpicker */ "./2D/controls/colorpicker.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ColorPicker", function() { return _colorpicker__WEBPACK_IMPORTED_MODULE_2__["ColorPicker"]; });

/* harmony import */ var _container__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./container */ "./2D/controls/container.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Container", function() { return _container__WEBPACK_IMPORTED_MODULE_3__["Container"]; });

/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Control", function() { return _control__WEBPACK_IMPORTED_MODULE_4__["Control"]; });

/* harmony import */ var _ellipse__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./ellipse */ "./2D/controls/ellipse.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Ellipse", function() { return _ellipse__WEBPACK_IMPORTED_MODULE_5__["Ellipse"]; });

/* harmony import */ var _grid__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./grid */ "./2D/controls/grid.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Grid", function() { return _grid__WEBPACK_IMPORTED_MODULE_6__["Grid"]; });

/* harmony import */ var _image__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./image */ "./2D/controls/image.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Image", function() { return _image__WEBPACK_IMPORTED_MODULE_7__["Image"]; });

/* harmony import */ var _inputText__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./inputText */ "./2D/controls/inputText.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InputText", function() { return _inputText__WEBPACK_IMPORTED_MODULE_8__["InputText"]; });

/* harmony import */ var _inputPassword__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./inputPassword */ "./2D/controls/inputPassword.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InputPassword", function() { return _inputPassword__WEBPACK_IMPORTED_MODULE_9__["InputPassword"]; });

/* harmony import */ var _line__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./line */ "./2D/controls/line.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Line", function() { return _line__WEBPACK_IMPORTED_MODULE_10__["Line"]; });

/* harmony import */ var _multiLine__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./multiLine */ "./2D/controls/multiLine.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MultiLine", function() { return _multiLine__WEBPACK_IMPORTED_MODULE_11__["MultiLine"]; });

/* harmony import */ var _radioButton__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./radioButton */ "./2D/controls/radioButton.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RadioButton", function() { return _radioButton__WEBPACK_IMPORTED_MODULE_12__["RadioButton"]; });

/* harmony import */ var _stackPanel__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./stackPanel */ "./2D/controls/stackPanel.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StackPanel", function() { return _stackPanel__WEBPACK_IMPORTED_MODULE_13__["StackPanel"]; });

/* harmony import */ var _selector__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./selector */ "./2D/controls/selector.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SelectorGroup", function() { return _selector__WEBPACK_IMPORTED_MODULE_14__["SelectorGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CheckboxGroup", function() { return _selector__WEBPACK_IMPORTED_MODULE_14__["CheckboxGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RadioGroup", function() { return _selector__WEBPACK_IMPORTED_MODULE_14__["RadioGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SliderGroup", function() { return _selector__WEBPACK_IMPORTED_MODULE_14__["SliderGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SelectionPanel", function() { return _selector__WEBPACK_IMPORTED_MODULE_14__["SelectionPanel"]; });

/* harmony import */ var _scrollViewers_scrollViewer__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./scrollViewers/scrollViewer */ "./2D/controls/scrollViewers/scrollViewer.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScrollViewer", function() { return _scrollViewers_scrollViewer__WEBPACK_IMPORTED_MODULE_15__["ScrollViewer"]; });

/* harmony import */ var _textBlock__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./textBlock */ "./2D/controls/textBlock.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TextWrapping", function() { return _textBlock__WEBPACK_IMPORTED_MODULE_16__["TextWrapping"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TextBlock", function() { return _textBlock__WEBPACK_IMPORTED_MODULE_16__["TextBlock"]; });

/* harmony import */ var _virtualKeyboard__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./virtualKeyboard */ "./2D/controls/virtualKeyboard.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KeyPropertySet", function() { return _virtualKeyboard__WEBPACK_IMPORTED_MODULE_17__["KeyPropertySet"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "VirtualKeyboard", function() { return _virtualKeyboard__WEBPACK_IMPORTED_MODULE_17__["VirtualKeyboard"]; });

/* harmony import */ var _rectangle__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./rectangle */ "./2D/controls/rectangle.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Rectangle", function() { return _rectangle__WEBPACK_IMPORTED_MODULE_18__["Rectangle"]; });

/* harmony import */ var _displayGrid__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./displayGrid */ "./2D/controls/displayGrid.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DisplayGrid", function() { return _displayGrid__WEBPACK_IMPORTED_MODULE_19__["DisplayGrid"]; });

/* harmony import */ var _sliders_baseSlider__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./sliders/baseSlider */ "./2D/controls/sliders/baseSlider.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BaseSlider", function() { return _sliders_baseSlider__WEBPACK_IMPORTED_MODULE_20__["BaseSlider"]; });

/* harmony import */ var _sliders_slider__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./sliders/slider */ "./2D/controls/sliders/slider.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Slider", function() { return _sliders_slider__WEBPACK_IMPORTED_MODULE_21__["Slider"]; });

/* harmony import */ var _sliders_imageBasedSlider__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./sliders/imageBasedSlider */ "./2D/controls/sliders/imageBasedSlider.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ImageBasedSlider", function() { return _sliders_imageBasedSlider__WEBPACK_IMPORTED_MODULE_22__["ImageBasedSlider"]; });

/* harmony import */ var _sliders_scrollBar__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./sliders/scrollBar */ "./2D/controls/sliders/scrollBar.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScrollBar", function() { return _sliders_scrollBar__WEBPACK_IMPORTED_MODULE_23__["ScrollBar"]; });

/* harmony import */ var _sliders_imageScrollBar__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./sliders/imageScrollBar */ "./2D/controls/sliders/imageScrollBar.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ImageScrollBar", function() { return _sliders_imageScrollBar__WEBPACK_IMPORTED_MODULE_24__["ImageScrollBar"]; });

/* harmony import */ var _statics__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ./statics */ "./2D/controls/statics.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "name", function() { return _statics__WEBPACK_IMPORTED_MODULE_25__["name"]; });





























/***/ }),

/***/ "./2D/controls/inputPassword.ts":
/*!**************************************!*\
  !*** ./2D/controls/inputPassword.ts ***!
  \**************************************/
/*! exports provided: InputPassword */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InputPassword", function() { return InputPassword; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _inputText__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./inputText */ "./2D/controls/inputText.ts");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! babylonjs/Misc/typeStore */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2__);



/**
 * Class used to create a password control
 */
var InputPassword = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(InputPassword, _super);
    function InputPassword() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    InputPassword.prototype._beforeRenderText = function (text) {
        var txt = "";
        for (var i = 0; i < text.length; i++) {
            txt += "\u2022";
        }
        return txt;
    };
    return InputPassword;
}(_inputText__WEBPACK_IMPORTED_MODULE_1__["InputText"]));

babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2__["_TypeStore"].RegisteredTypes["BABYLON.GUI.InputPassword"] = InputPassword;


/***/ }),

/***/ "./2D/controls/inputText.ts":
/*!**********************************!*\
  !*** ./2D/controls/inputText.ts ***!
  \**********************************/
/*! exports provided: InputText */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InputText", function() { return InputText; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../valueAndUnit */ "./2D/valueAndUnit.ts");







/**
 * Class used to create input text control
 */
var InputText = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(InputText, _super);
    /**
     * Creates a new InputText
     * @param name defines the control name
     * @param text defines the text of the control
     */
    function InputText(name, text) {
        if (text === void 0) { text = ""; }
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._text = "";
        _this._placeholderText = "";
        _this._background = "#222222";
        _this._focusedBackground = "#000000";
        _this._focusedColor = "white";
        _this._placeholderColor = "gray";
        _this._thickness = 1;
        _this._margin = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"](10, _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"].UNITMODE_PIXEL);
        _this._autoStretchWidth = true;
        _this._maxWidth = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"](1, _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"].UNITMODE_PERCENTAGE, false);
        _this._isFocused = false;
        _this._blinkIsEven = false;
        _this._cursorOffset = 0;
        _this._deadKey = false;
        _this._addKey = true;
        _this._currentKey = "";
        _this._isTextHighlightOn = false;
        _this._textHighlightColor = "#d5e0ff";
        _this._highligherOpacity = 0.4;
        _this._highlightedText = "";
        _this._startHighlightIndex = 0;
        _this._endHighlightIndex = 0;
        _this._cursorIndex = -1;
        _this._onFocusSelectAll = false;
        _this._isPointerDown = false;
        /** Gets or sets a string representing the message displayed on mobile when the control gets the focus */
        _this.promptMessage = "Please enter text:";
        /** Force disable prompt on mobile device */
        _this.disableMobilePrompt = false;
        /** Observable raised when the text changes */
        _this.onTextChangedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /** Observable raised just before an entered character is to be added */
        _this.onBeforeKeyAddObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /** Observable raised when the control gets the focus */
        _this.onFocusObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /** Observable raised when the control loses the focus */
        _this.onBlurObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /**Observable raised when the text is highlighted */
        _this.onTextHighlightObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /**Observable raised when copy event is triggered */
        _this.onTextCopyObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /** Observable raised when cut event is triggered */
        _this.onTextCutObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /** Observable raised when paste event is triggered */
        _this.onTextPasteObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /** Observable raised when a key event was processed */
        _this.onKeyboardEventProcessedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        _this.text = text;
        _this.isPointerBlocker = true;
        return _this;
    }
    Object.defineProperty(InputText.prototype, "maxWidth", {
        /** Gets or sets the maximum width allowed by the control */
        get: function () {
            return this._maxWidth.toString(this._host);
        },
        set: function (value) {
            if (this._maxWidth.toString(this._host) === value) {
                return;
            }
            if (this._maxWidth.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "maxWidthInPixels", {
        /** Gets the maximum width allowed by the control in pixels */
        get: function () {
            return this._maxWidth.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "highligherOpacity", {
        /** Gets or sets the text highlighter transparency; default: 0.4 */
        get: function () {
            return this._highligherOpacity;
        },
        set: function (value) {
            if (this._highligherOpacity === value) {
                return;
            }
            this._highligherOpacity = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "onFocusSelectAll", {
        /** Gets or sets a boolean indicating whether to select complete text by default on input focus */
        get: function () {
            return this._onFocusSelectAll;
        },
        set: function (value) {
            if (this._onFocusSelectAll === value) {
                return;
            }
            this._onFocusSelectAll = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "textHighlightColor", {
        /** Gets or sets the text hightlight color */
        get: function () {
            return this._textHighlightColor;
        },
        set: function (value) {
            if (this._textHighlightColor === value) {
                return;
            }
            this._textHighlightColor = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "margin", {
        /** Gets or sets control margin */
        get: function () {
            return this._margin.toString(this._host);
        },
        set: function (value) {
            if (this._margin.toString(this._host) === value) {
                return;
            }
            if (this._margin.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "marginInPixels", {
        /** Gets control margin in pixels */
        get: function () {
            return this._margin.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "autoStretchWidth", {
        /** Gets or sets a boolean indicating if the control can auto stretch its width to adapt to the text */
        get: function () {
            return this._autoStretchWidth;
        },
        set: function (value) {
            if (this._autoStretchWidth === value) {
                return;
            }
            this._autoStretchWidth = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "thickness", {
        /** Gets or sets border thickness */
        get: function () {
            return this._thickness;
        },
        set: function (value) {
            if (this._thickness === value) {
                return;
            }
            this._thickness = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "focusedBackground", {
        /** Gets or sets the background color when focused */
        get: function () {
            return this._focusedBackground;
        },
        set: function (value) {
            if (this._focusedBackground === value) {
                return;
            }
            this._focusedBackground = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "focusedColor", {
        /** Gets or sets the background color when focused */
        get: function () {
            return this._focusedColor;
        },
        set: function (value) {
            if (this._focusedColor === value) {
                return;
            }
            this._focusedColor = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "background", {
        /** Gets or sets the background color */
        get: function () {
            return this._background;
        },
        set: function (value) {
            if (this._background === value) {
                return;
            }
            this._background = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "placeholderColor", {
        /** Gets or sets the placeholder color */
        get: function () {
            return this._placeholderColor;
        },
        set: function (value) {
            if (this._placeholderColor === value) {
                return;
            }
            this._placeholderColor = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "placeholderText", {
        /** Gets or sets the text displayed when the control is empty */
        get: function () {
            return this._placeholderText;
        },
        set: function (value) {
            if (this._placeholderText === value) {
                return;
            }
            this._placeholderText = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "deadKey", {
        /** Gets or sets the dead key flag */
        get: function () {
            return this._deadKey;
        },
        set: function (flag) {
            this._deadKey = flag;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "highlightedText", {
        /** Gets or sets the highlight text */
        get: function () {
            return this._highlightedText;
        },
        set: function (text) {
            if (this._highlightedText === text) {
                return;
            }
            this._highlightedText = text;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "addKey", {
        /** Gets or sets if the current key should be added */
        get: function () {
            return this._addKey;
        },
        set: function (flag) {
            this._addKey = flag;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "currentKey", {
        /** Gets or sets the value of the current key being entered */
        get: function () {
            return this._currentKey;
        },
        set: function (key) {
            this._currentKey = key;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "text", {
        /** Gets or sets the text displayed in the control */
        get: function () {
            return this._text;
        },
        set: function (value) {
            var valueAsString = value.toString(); // Forcing convertion
            if (this._text === valueAsString) {
                return;
            }
            this._text = valueAsString;
            this._markAsDirty();
            this.onTextChangedObservable.notifyObservers(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "width", {
        /** Gets or sets control width */
        get: function () {
            return this._width.toString(this._host);
        },
        set: function (value) {
            if (this._width.toString(this._host) === value) {
                return;
            }
            if (this._width.fromString(value)) {
                this._markAsDirty();
            }
            this.autoStretchWidth = false;
        },
        enumerable: false,
        configurable: true
    });
    /** @hidden */
    InputText.prototype.onBlur = function () {
        this._isFocused = false;
        this._scrollLeft = null;
        this._cursorOffset = 0;
        clearTimeout(this._blinkTimeout);
        this._markAsDirty();
        this.onBlurObservable.notifyObservers(this);
        this._host.unRegisterClipboardEvents();
        if (this._onClipboardObserver) {
            this._host.onClipboardObservable.remove(this._onClipboardObserver);
        }
        var scene = this._host.getScene();
        if (this._onPointerDblTapObserver && scene) {
            scene.onPointerObservable.remove(this._onPointerDblTapObserver);
        }
    };
    /** @hidden */
    InputText.prototype.onFocus = function () {
        var _this = this;
        if (!this._isEnabled) {
            return;
        }
        this._scrollLeft = null;
        this._isFocused = true;
        this._blinkIsEven = false;
        this._cursorOffset = 0;
        this._markAsDirty();
        this.onFocusObservable.notifyObservers(this);
        if (navigator.userAgent.indexOf("Mobile") !== -1 && !this.disableMobilePrompt) {
            var value = prompt(this.promptMessage);
            if (value !== null) {
                this.text = value;
            }
            this._host.focusedControl = null;
            return;
        }
        this._host.registerClipboardEvents();
        this._onClipboardObserver = this._host.onClipboardObservable.add(function (clipboardInfo) {
            // process clipboard event, can be configured.
            switch (clipboardInfo.type) {
                case babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["ClipboardEventTypes"].COPY:
                    _this._onCopyText(clipboardInfo.event);
                    _this.onTextCopyObservable.notifyObservers(_this);
                    break;
                case babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["ClipboardEventTypes"].CUT:
                    _this._onCutText(clipboardInfo.event);
                    _this.onTextCutObservable.notifyObservers(_this);
                    break;
                case babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["ClipboardEventTypes"].PASTE:
                    _this._onPasteText(clipboardInfo.event);
                    _this.onTextPasteObservable.notifyObservers(_this);
                    break;
                default: return;
            }
        });
        var scene = this._host.getScene();
        if (scene) {
            //register the pointer double tap event
            this._onPointerDblTapObserver = scene.onPointerObservable.add(function (pointerInfo) {
                if (!_this._isFocused) {
                    return;
                }
                if (pointerInfo.type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["PointerEventTypes"].POINTERDOUBLETAP) {
                    _this._processDblClick(pointerInfo);
                }
            });
        }
        if (this._onFocusSelectAll) {
            this._selectAllText();
        }
    };
    InputText.prototype._getTypeName = function () {
        return "InputText";
    };
    /**
     * Function called to get the list of controls that should not steal the focus from this control
     * @returns an array of controls
     */
    InputText.prototype.keepsFocusWith = function () {
        if (!this._connectedVirtualKeyboard) {
            return null;
        }
        return [this._connectedVirtualKeyboard];
    };
    /** @hidden */
    InputText.prototype.processKey = function (keyCode, key, evt) {
        //return if clipboard event keys (i.e -ctr/cmd + c,v,x)
        if (evt && (evt.ctrlKey || evt.metaKey) && (keyCode === 67 || keyCode === 86 || keyCode === 88)) {
            return;
        }
        //select all
        if (evt && (evt.ctrlKey || evt.metaKey) && keyCode === 65) {
            this._selectAllText();
            evt.preventDefault();
            return;
        }
        // Specific cases
        switch (keyCode) {
            case 32: //SPACE
                key = " "; //ie11 key for space is "Spacebar"
                break;
            case 191: //SLASH
                if (evt) {
                    evt.preventDefault();
                }
                break;
            case 8: // BACKSPACE
                if (this._text && this._text.length > 0) {
                    //delete the highlighted text
                    if (this._isTextHighlightOn) {
                        this.text = this._text.slice(0, this._startHighlightIndex) + this._text.slice(this._endHighlightIndex);
                        this._isTextHighlightOn = false;
                        this._cursorOffset = this.text.length - this._startHighlightIndex;
                        this._blinkIsEven = false;
                        if (evt) {
                            evt.preventDefault();
                        }
                        return;
                    }
                    //delete single character
                    if (this._cursorOffset === 0) {
                        this.text = this._text.substr(0, this._text.length - 1);
                    }
                    else {
                        var deletePosition = this._text.length - this._cursorOffset;
                        if (deletePosition > 0) {
                            this.text = this._text.slice(0, deletePosition - 1) + this._text.slice(deletePosition);
                        }
                    }
                }
                if (evt) {
                    evt.preventDefault();
                }
                return;
            case 46: // DELETE
                if (this._isTextHighlightOn) {
                    this.text = this._text.slice(0, this._startHighlightIndex) + this._text.slice(this._endHighlightIndex);
                    var decrementor = (this._endHighlightIndex - this._startHighlightIndex);
                    while (decrementor > 0 && this._cursorOffset > 0) {
                        this._cursorOffset--;
                    }
                    this._isTextHighlightOn = false;
                    this._cursorOffset = this.text.length - this._startHighlightIndex;
                    if (evt) {
                        evt.preventDefault();
                    }
                    return;
                }
                if (this._text && this._text.length > 0 && this._cursorOffset > 0) {
                    var deletePosition = this._text.length - this._cursorOffset;
                    this.text = this._text.slice(0, deletePosition) + this._text.slice(deletePosition + 1);
                    this._cursorOffset--;
                }
                if (evt) {
                    evt.preventDefault();
                }
                return;
            case 13: // RETURN
                this._host.focusedControl = null;
                this._isTextHighlightOn = false;
                return;
            case 35: // END
                this._cursorOffset = 0;
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._markAsDirty();
                return;
            case 36: // HOME
                this._cursorOffset = this._text.length;
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._markAsDirty();
                return;
            case 37: // LEFT
                this._cursorOffset++;
                if (this._cursorOffset > this._text.length) {
                    this._cursorOffset = this._text.length;
                }
                if (evt && evt.shiftKey) {
                    // update the cursor
                    this._blinkIsEven = false;
                    // shift + ctrl/cmd + <-
                    if (evt.ctrlKey || evt.metaKey) {
                        if (!this._isTextHighlightOn) {
                            if (this._text.length === this._cursorOffset) {
                                return;
                            }
                            else {
                                this._endHighlightIndex = this._text.length - this._cursorOffset + 1;
                            }
                        }
                        this._startHighlightIndex = 0;
                        this._cursorIndex = this._text.length - this._endHighlightIndex;
                        this._cursorOffset = this._text.length;
                        this._isTextHighlightOn = true;
                        this._markAsDirty();
                        return;
                    }
                    //store the starting point
                    if (!this._isTextHighlightOn) {
                        this._isTextHighlightOn = true;
                        this._cursorIndex = (this._cursorOffset >= this._text.length) ? this._text.length : this._cursorOffset - 1;
                    }
                    //if text is already highlighted
                    else if (this._cursorIndex === -1) {
                        this._cursorIndex = this._text.length - this._endHighlightIndex;
                        this._cursorOffset = (this._startHighlightIndex === 0) ? this._text.length : this._text.length - this._startHighlightIndex + 1;
                    }
                    //set the highlight indexes
                    if (this._cursorIndex < this._cursorOffset) {
                        this._endHighlightIndex = this._text.length - this._cursorIndex;
                        this._startHighlightIndex = this._text.length - this._cursorOffset;
                    }
                    else if (this._cursorIndex > this._cursorOffset) {
                        this._endHighlightIndex = this._text.length - this._cursorOffset;
                        this._startHighlightIndex = this._text.length - this._cursorIndex;
                    }
                    else {
                        this._isTextHighlightOn = false;
                    }
                    this._markAsDirty();
                    return;
                }
                if (this._isTextHighlightOn) {
                    this._cursorOffset = this._text.length - this._startHighlightIndex;
                    this._isTextHighlightOn = false;
                }
                if (evt && (evt.ctrlKey || evt.metaKey)) {
                    this._cursorOffset = this.text.length;
                    evt.preventDefault();
                }
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._cursorIndex = -1;
                this._markAsDirty();
                return;
            case 39: // RIGHT
                this._cursorOffset--;
                if (this._cursorOffset < 0) {
                    this._cursorOffset = 0;
                }
                if (evt && evt.shiftKey) {
                    //update the cursor
                    this._blinkIsEven = false;
                    //shift + ctrl/cmd + ->
                    if (evt.ctrlKey || evt.metaKey) {
                        if (!this._isTextHighlightOn) {
                            if (this._cursorOffset === 0) {
                                return;
                            }
                            else {
                                this._startHighlightIndex = this._text.length - this._cursorOffset - 1;
                            }
                        }
                        this._endHighlightIndex = this._text.length;
                        this._isTextHighlightOn = true;
                        this._cursorIndex = this._text.length - this._startHighlightIndex;
                        this._cursorOffset = 0;
                        this._markAsDirty();
                        return;
                    }
                    if (!this._isTextHighlightOn) {
                        this._isTextHighlightOn = true;
                        this._cursorIndex = (this._cursorOffset <= 0) ? 0 : this._cursorOffset + 1;
                    }
                    //if text is already highlighted
                    else if (this._cursorIndex === -1) {
                        this._cursorIndex = this._text.length - this._startHighlightIndex;
                        this._cursorOffset = (this._text.length === this._endHighlightIndex) ? 0 : this._text.length - this._endHighlightIndex - 1;
                    }
                    //set the highlight indexes
                    if (this._cursorIndex < this._cursorOffset) {
                        this._endHighlightIndex = this._text.length - this._cursorIndex;
                        this._startHighlightIndex = this._text.length - this._cursorOffset;
                    }
                    else if (this._cursorIndex > this._cursorOffset) {
                        this._endHighlightIndex = this._text.length - this._cursorOffset;
                        this._startHighlightIndex = this._text.length - this._cursorIndex;
                    }
                    else {
                        this._isTextHighlightOn = false;
                    }
                    this._markAsDirty();
                    return;
                }
                if (this._isTextHighlightOn) {
                    this._cursorOffset = this._text.length - this._endHighlightIndex;
                    this._isTextHighlightOn = false;
                }
                //ctr + ->
                if (evt && (evt.ctrlKey || evt.metaKey)) {
                    this._cursorOffset = 0;
                    evt.preventDefault();
                }
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._cursorIndex = -1;
                this._markAsDirty();
                return;
            case 222: // Dead
                if (evt) {
                    evt.preventDefault();
                }
                this._cursorIndex = -1;
                this.deadKey = true;
                break;
        }
        // Printable characters
        if (key &&
            ((keyCode === -1) || // Direct access
                (keyCode === 32) || // Space
                (keyCode > 47 && keyCode < 64) || // Numbers
                (keyCode > 64 && keyCode < 91) || // Letters
                (keyCode > 159 && keyCode < 193) || // Special characters
                (keyCode > 218 && keyCode < 223) || // Special characters
                (keyCode > 95 && keyCode < 112))) { // Numpad
            this._currentKey = key;
            this.onBeforeKeyAddObservable.notifyObservers(this);
            key = this._currentKey;
            if (this._addKey) {
                if (this._isTextHighlightOn) {
                    this.text = this._text.slice(0, this._startHighlightIndex) + key + this._text.slice(this._endHighlightIndex);
                    this._cursorOffset = this.text.length - (this._startHighlightIndex + 1);
                    this._isTextHighlightOn = false;
                    this._blinkIsEven = false;
                    this._markAsDirty();
                }
                else if (this._cursorOffset === 0) {
                    this.text += key;
                }
                else {
                    var insertPosition = this._text.length - this._cursorOffset;
                    this.text = this._text.slice(0, insertPosition) + key + this._text.slice(insertPosition);
                }
            }
        }
    };
    /** @hidden */
    InputText.prototype._updateValueFromCursorIndex = function (offset) {
        //update the cursor
        this._blinkIsEven = false;
        if (this._cursorIndex === -1) {
            this._cursorIndex = offset;
        }
        else {
            if (this._cursorIndex < this._cursorOffset) {
                this._endHighlightIndex = this._text.length - this._cursorIndex;
                this._startHighlightIndex = this._text.length - this._cursorOffset;
            }
            else if (this._cursorIndex > this._cursorOffset) {
                this._endHighlightIndex = this._text.length - this._cursorOffset;
                this._startHighlightIndex = this._text.length - this._cursorIndex;
            }
            else {
                this._isTextHighlightOn = false;
                this._markAsDirty();
                return;
            }
        }
        this._isTextHighlightOn = true;
        this._markAsDirty();
    };
    /** @hidden */
    InputText.prototype._processDblClick = function (evt) {
        //pre-find the start and end index of the word under cursor, speeds up the rendering
        this._startHighlightIndex = this._text.length - this._cursorOffset;
        this._endHighlightIndex = this._startHighlightIndex;
        var rWord = /\w+/g, moveLeft, moveRight;
        do {
            moveRight = this._endHighlightIndex < this._text.length && (this._text[this._endHighlightIndex].search(rWord) !== -1) ? ++this._endHighlightIndex : 0;
            moveLeft = this._startHighlightIndex > 0 && (this._text[this._startHighlightIndex - 1].search(rWord) !== -1) ? --this._startHighlightIndex : 0;
        } while (moveLeft || moveRight);
        this._cursorOffset = this.text.length - this._startHighlightIndex;
        this.onTextHighlightObservable.notifyObservers(this);
        this._isTextHighlightOn = true;
        this._clickedCoordinate = null;
        this._blinkIsEven = true;
        this._cursorIndex = -1;
        this._markAsDirty();
    };
    /** @hidden */
    InputText.prototype._selectAllText = function () {
        this._blinkIsEven = true;
        this._isTextHighlightOn = true;
        this._startHighlightIndex = 0;
        this._endHighlightIndex = this._text.length;
        this._cursorOffset = this._text.length;
        this._cursorIndex = -1;
        this._markAsDirty();
    };
    /**
     * Handles the keyboard event
     * @param evt Defines the KeyboardEvent
     */
    InputText.prototype.processKeyboard = function (evt) {
        // process pressed key
        this.processKey(evt.keyCode, evt.key, evt);
        this.onKeyboardEventProcessedObservable.notifyObservers(evt);
    };
    /** @hidden */
    InputText.prototype._onCopyText = function (ev) {
        this._isTextHighlightOn = false;
        //when write permission to clipbaord data is denied
        try {
            ev.clipboardData && ev.clipboardData.setData("text/plain", this._highlightedText);
        }
        catch (_a) { } //pass
        this._host.clipboardData = this._highlightedText;
    };
    /** @hidden */
    InputText.prototype._onCutText = function (ev) {
        if (!this._highlightedText) {
            return;
        }
        this.text = this._text.slice(0, this._startHighlightIndex) + this._text.slice(this._endHighlightIndex);
        this._isTextHighlightOn = false;
        this._cursorOffset = this.text.length - this._startHighlightIndex;
        //when write permission to clipbaord data is denied
        try {
            ev.clipboardData && ev.clipboardData.setData("text/plain", this._highlightedText);
        }
        catch (_a) { } //pass
        this._host.clipboardData = this._highlightedText;
        this._highlightedText = "";
    };
    /** @hidden */
    InputText.prototype._onPasteText = function (ev) {
        var data = "";
        if (ev.clipboardData && ev.clipboardData.types.indexOf("text/plain") !== -1) {
            data = ev.clipboardData.getData("text/plain");
        }
        else {
            //get the cached data; returns blank string by default
            data = this._host.clipboardData;
        }
        var insertPosition = this._text.length - this._cursorOffset;
        this.text = this._text.slice(0, insertPosition) + data + this._text.slice(insertPosition);
    };
    InputText.prototype._draw = function (context, invalidatedRectangle) {
        var _this = this;
        context.save();
        this._applyStates(context);
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }
        // Background
        if (this._isFocused) {
            if (this._focusedBackground) {
                context.fillStyle = this._isEnabled ? this._focusedBackground : this._disabledColor;
                context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            }
        }
        else if (this._background) {
            context.fillStyle = this._isEnabled ? this._background : this._disabledColor;
            context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
        }
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }
        if (!this._fontOffset) {
            this._fontOffset = _control__WEBPACK_IMPORTED_MODULE_2__["Control"]._GetFontOffset(context.font);
        }
        // Text
        var clipTextLeft = this._currentMeasure.left + this._margin.getValueInPixel(this._host, this._tempParentMeasure.width);
        if (this.color) {
            context.fillStyle = this.color;
        }
        var text = this._beforeRenderText(this._text);
        if (!this._isFocused && !this._text && this._placeholderText) {
            text = this._placeholderText;
            if (this._placeholderColor) {
                context.fillStyle = this._placeholderColor;
            }
        }
        this._textWidth = context.measureText(text).width;
        var marginWidth = this._margin.getValueInPixel(this._host, this._tempParentMeasure.width) * 2;
        if (this._autoStretchWidth) {
            this.width = Math.min(this._maxWidth.getValueInPixel(this._host, this._tempParentMeasure.width), this._textWidth + marginWidth) + "px";
        }
        var rootY = this._fontOffset.ascent + (this._currentMeasure.height - this._fontOffset.height) / 2;
        var availableWidth = this._width.getValueInPixel(this._host, this._tempParentMeasure.width) - marginWidth;
        context.save();
        context.beginPath();
        context.rect(clipTextLeft, this._currentMeasure.top + (this._currentMeasure.height - this._fontOffset.height) / 2, availableWidth + 2, this._currentMeasure.height);
        context.clip();
        if (this._isFocused && this._textWidth > availableWidth) {
            var textLeft = clipTextLeft - this._textWidth + availableWidth;
            if (!this._scrollLeft) {
                this._scrollLeft = textLeft;
            }
        }
        else {
            this._scrollLeft = clipTextLeft;
        }
        context.fillText(text, this._scrollLeft, this._currentMeasure.top + rootY);
        // Cursor
        if (this._isFocused) {
            // Need to move cursor
            if (this._clickedCoordinate) {
                var rightPosition = this._scrollLeft + this._textWidth;
                var absoluteCursorPosition = rightPosition - this._clickedCoordinate;
                var currentSize = 0;
                this._cursorOffset = 0;
                var previousDist = 0;
                do {
                    if (this._cursorOffset) {
                        previousDist = Math.abs(absoluteCursorPosition - currentSize);
                    }
                    this._cursorOffset++;
                    currentSize = context.measureText(text.substr(text.length - this._cursorOffset, this._cursorOffset)).width;
                } while (currentSize < absoluteCursorPosition && (text.length >= this._cursorOffset));
                // Find closest move
                if (Math.abs(absoluteCursorPosition - currentSize) > previousDist) {
                    this._cursorOffset--;
                }
                this._blinkIsEven = false;
                this._clickedCoordinate = null;
            }
            // Render cursor
            if (!this._blinkIsEven) {
                var cursorOffsetText = this.text.substr(this._text.length - this._cursorOffset);
                var cursorOffsetWidth = context.measureText(cursorOffsetText).width;
                var cursorLeft = this._scrollLeft + this._textWidth - cursorOffsetWidth;
                if (cursorLeft < clipTextLeft) {
                    this._scrollLeft += (clipTextLeft - cursorLeft);
                    cursorLeft = clipTextLeft;
                    this._markAsDirty();
                }
                else if (cursorLeft > clipTextLeft + availableWidth) {
                    this._scrollLeft += (clipTextLeft + availableWidth - cursorLeft);
                    cursorLeft = clipTextLeft + availableWidth;
                    this._markAsDirty();
                }
                if (!this._isTextHighlightOn) {
                    context.fillRect(cursorLeft, this._currentMeasure.top + (this._currentMeasure.height - this._fontOffset.height) / 2, 2, this._fontOffset.height);
                }
            }
            clearTimeout(this._blinkTimeout);
            this._blinkTimeout = setTimeout(function () {
                _this._blinkIsEven = !_this._blinkIsEven;
                _this._markAsDirty();
            }, 500);
            //show the highlighted text
            if (this._isTextHighlightOn) {
                clearTimeout(this._blinkTimeout);
                var highlightCursorOffsetWidth = context.measureText(this.text.substring(this._startHighlightIndex)).width;
                var highlightCursorLeft = this._scrollLeft + this._textWidth - highlightCursorOffsetWidth;
                this._highlightedText = this.text.substring(this._startHighlightIndex, this._endHighlightIndex);
                var width = context.measureText(this.text.substring(this._startHighlightIndex, this._endHighlightIndex)).width;
                if (highlightCursorLeft < clipTextLeft) {
                    width = width - (clipTextLeft - highlightCursorLeft);
                    if (!width) {
                        // when using left arrow on text.length > availableWidth;
                        // assigns the width of the first letter after clipTextLeft
                        width = context.measureText(this.text.charAt(this.text.length - this._cursorOffset)).width;
                    }
                    highlightCursorLeft = clipTextLeft;
                }
                //for transparancy
                context.globalAlpha = this._highligherOpacity;
                context.fillStyle = this._textHighlightColor;
                context.fillRect(highlightCursorLeft, this._currentMeasure.top + (this._currentMeasure.height - this._fontOffset.height) / 2, width, this._fontOffset.height);
                context.globalAlpha = 1.0;
            }
        }
        context.restore();
        // Border
        if (this._thickness) {
            if (this._isFocused) {
                if (this.focusedColor) {
                    context.strokeStyle = this.focusedColor;
                }
            }
            else {
                if (this.color) {
                    context.strokeStyle = this.color;
                }
            }
            context.lineWidth = this._thickness;
            context.strokeRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2, this._currentMeasure.width - this._thickness, this._currentMeasure.height - this._thickness);
        }
        context.restore();
    };
    InputText.prototype._onPointerDown = function (target, coordinates, pointerId, buttonIndex) {
        if (!_super.prototype._onPointerDown.call(this, target, coordinates, pointerId, buttonIndex)) {
            return false;
        }
        this._clickedCoordinate = coordinates.x;
        this._isTextHighlightOn = false;
        this._highlightedText = "";
        this._cursorIndex = -1;
        this._isPointerDown = true;
        this._host._capturingControl[pointerId] = this;
        if (this._host.focusedControl === this) {
            // Move cursor
            clearTimeout(this._blinkTimeout);
            this._markAsDirty();
            return true;
        }
        if (!this._isEnabled) {
            return false;
        }
        this._host.focusedControl = this;
        return true;
    };
    InputText.prototype._onPointerMove = function (target, coordinates, pointerId) {
        if (this._host.focusedControl === this && this._isPointerDown) {
            this._clickedCoordinate = coordinates.x;
            this._markAsDirty();
            this._updateValueFromCursorIndex(this._cursorOffset);
        }
        _super.prototype._onPointerMove.call(this, target, coordinates, pointerId);
    };
    InputText.prototype._onPointerUp = function (target, coordinates, pointerId, buttonIndex, notifyClick) {
        this._isPointerDown = false;
        delete this._host._capturingControl[pointerId];
        _super.prototype._onPointerUp.call(this, target, coordinates, pointerId, buttonIndex, notifyClick);
    };
    InputText.prototype._beforeRenderText = function (text) {
        return text;
    };
    InputText.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this.onBlurObservable.clear();
        this.onFocusObservable.clear();
        this.onTextChangedObservable.clear();
        this.onTextCopyObservable.clear();
        this.onTextCutObservable.clear();
        this.onTextPasteObservable.clear();
        this.onTextHighlightObservable.clear();
        this.onKeyboardEventProcessedObservable.clear();
    };
    return InputText;
}(_control__WEBPACK_IMPORTED_MODULE_2__["Control"]));

babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GUI.InputText"] = InputText;


/***/ }),

/***/ "./2D/controls/line.ts":
/*!*****************************!*\
  !*** ./2D/controls/line.ts ***!
  \*****************************/
/*! exports provided: Line */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Line", function() { return Line; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Maths/math.vector */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../valueAndUnit */ "./2D/valueAndUnit.ts");






/** Class used to render 2D lines */
var Line = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Line, _super);
    /**
     * Creates a new Line
     * @param name defines the control name
     */
    function Line(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._lineWidth = 1;
        _this._x1 = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"](0);
        _this._y1 = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"](0);
        _this._x2 = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"](0);
        _this._y2 = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"](0);
        _this._dash = new Array();
        _this._automaticSize = true;
        _this.isHitTestVisible = false;
        _this._horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        _this._verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].VERTICAL_ALIGNMENT_TOP;
        return _this;
    }
    Object.defineProperty(Line.prototype, "dash", {
        /** Gets or sets the dash pattern */
        get: function () {
            return this._dash;
        },
        set: function (value) {
            if (this._dash === value) {
                return;
            }
            this._dash = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "connectedControl", {
        /** Gets or sets the control connected with the line end */
        get: function () {
            return this._connectedControl;
        },
        set: function (value) {
            var _this = this;
            if (this._connectedControl === value) {
                return;
            }
            if (this._connectedControlDirtyObserver && this._connectedControl) {
                this._connectedControl.onDirtyObservable.remove(this._connectedControlDirtyObserver);
                this._connectedControlDirtyObserver = null;
            }
            if (value) {
                this._connectedControlDirtyObserver = value.onDirtyObservable.add(function () { return _this._markAsDirty(); });
            }
            this._connectedControl = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "x1", {
        /** Gets or sets start coordinates on X axis */
        get: function () {
            return this._x1.toString(this._host);
        },
        set: function (value) {
            if (this._x1.toString(this._host) === value) {
                return;
            }
            if (this._x1.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "y1", {
        /** Gets or sets start coordinates on Y axis */
        get: function () {
            return this._y1.toString(this._host);
        },
        set: function (value) {
            if (this._y1.toString(this._host) === value) {
                return;
            }
            if (this._y1.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "x2", {
        /** Gets or sets end coordinates on X axis */
        get: function () {
            return this._x2.toString(this._host);
        },
        set: function (value) {
            if (this._x2.toString(this._host) === value) {
                return;
            }
            if (this._x2.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "y2", {
        /** Gets or sets end coordinates on Y axis */
        get: function () {
            return this._y2.toString(this._host);
        },
        set: function (value) {
            if (this._y2.toString(this._host) === value) {
                return;
            }
            if (this._y2.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "lineWidth", {
        /** Gets or sets line width */
        get: function () {
            return this._lineWidth;
        },
        set: function (value) {
            if (this._lineWidth === value) {
                return;
            }
            this._lineWidth = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "horizontalAlignment", {
        /** Gets or sets horizontal alignment */
        set: function (value) {
            return;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "verticalAlignment", {
        /** Gets or sets vertical alignment */
        set: function (value) {
            return;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "_effectiveX2", {
        get: function () {
            return (this._connectedControl ? this._connectedControl.centerX : 0) + this._x2.getValue(this._host);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "_effectiveY2", {
        get: function () {
            return (this._connectedControl ? this._connectedControl.centerY : 0) + this._y2.getValue(this._host);
        },
        enumerable: false,
        configurable: true
    });
    Line.prototype._getTypeName = function () {
        return "Line";
    };
    Line.prototype._draw = function (context) {
        context.save();
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }
        this._applyStates(context);
        context.strokeStyle = this.color;
        context.lineWidth = this._lineWidth;
        context.setLineDash(this._dash);
        context.beginPath();
        context.moveTo(this._cachedParentMeasure.left + this._x1.getValue(this._host), this._cachedParentMeasure.top + this._y1.getValue(this._host));
        context.lineTo(this._cachedParentMeasure.left + this._effectiveX2, this._cachedParentMeasure.top + this._effectiveY2);
        context.stroke();
        context.restore();
    };
    Line.prototype._measure = function () {
        // Width / Height
        this._currentMeasure.width = Math.abs(this._x1.getValue(this._host) - this._effectiveX2) + this._lineWidth;
        this._currentMeasure.height = Math.abs(this._y1.getValue(this._host) - this._effectiveY2) + this._lineWidth;
    };
    Line.prototype._computeAlignment = function (parentMeasure, context) {
        this._currentMeasure.left = parentMeasure.left + Math.min(this._x1.getValue(this._host), this._effectiveX2) - this._lineWidth / 2;
        this._currentMeasure.top = parentMeasure.top + Math.min(this._y1.getValue(this._host), this._effectiveY2) - this._lineWidth / 2;
    };
    /**
     * Move one end of the line given 3D cartesian coordinates.
     * @param position Targeted world position
     * @param scene Scene
     * @param end (opt) Set to true to assign x2 and y2 coordinates of the line. Default assign to x1 and y1.
     */
    Line.prototype.moveToVector3 = function (position, scene, end) {
        if (end === void 0) { end = false; }
        if (!this._host || this.parent !== this._host._rootContainer) {
            babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error("Cannot move a control to a vector3 if the control is not at root level");
            return;
        }
        var globalViewport = this._host._getGlobalViewport(scene);
        var projectedPosition = babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Vector3"].Project(position, babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Matrix"].Identity(), scene.getTransformMatrix(), globalViewport);
        this._moveToProjectedPosition(projectedPosition, end);
        if (projectedPosition.z < 0 || projectedPosition.z > 1) {
            this.notRenderable = true;
            return;
        }
        this.notRenderable = false;
    };
    /**
     * Move one end of the line to a position in screen absolute space.
     * @param projectedPosition Position in screen absolute space (X, Y)
     * @param end (opt) Set to true to assign x2 and y2 coordinates of the line. Default assign to x1 and y1.
     */
    Line.prototype._moveToProjectedPosition = function (projectedPosition, end) {
        if (end === void 0) { end = false; }
        var x = (projectedPosition.x + this._linkOffsetX.getValue(this._host)) + "px";
        var y = (projectedPosition.y + this._linkOffsetY.getValue(this._host)) + "px";
        if (end) {
            this.x2 = x;
            this.y2 = y;
            this._x2.ignoreAdaptiveScaling = true;
            this._y2.ignoreAdaptiveScaling = true;
        }
        else {
            this.x1 = x;
            this.y1 = y;
            this._x1.ignoreAdaptiveScaling = true;
            this._y1.ignoreAdaptiveScaling = true;
        }
    };
    return Line;
}(_control__WEBPACK_IMPORTED_MODULE_2__["Control"]));

babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GUI.Line"] = Line;


/***/ }),

/***/ "./2D/controls/multiLine.ts":
/*!**********************************!*\
  !*** ./2D/controls/multiLine.ts ***!
  \**********************************/
/*! exports provided: MultiLine */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MultiLine", function() { return MultiLine; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Meshes_abstractMesh__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Meshes/abstractMesh */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Meshes_abstractMesh__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Meshes_abstractMesh__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var _multiLinePoint__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../multiLinePoint */ "./2D/multiLinePoint.ts");





/**
 * Class used to create multi line control
 */
var MultiLine = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(MultiLine, _super);
    /**
     * Creates a new MultiLine
     * @param name defines the control name
     */
    function MultiLine(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._lineWidth = 1;
        /** Function called when a point is updated */
        _this.onPointUpdate = function () {
            _this._markAsDirty();
        };
        _this._automaticSize = true;
        _this.isHitTestVisible = false;
        _this._horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        _this._verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].VERTICAL_ALIGNMENT_TOP;
        _this._dash = [];
        _this._points = [];
        return _this;
    }
    Object.defineProperty(MultiLine.prototype, "dash", {
        /** Gets or sets dash pattern */
        get: function () {
            return this._dash;
        },
        set: function (value) {
            if (this._dash === value) {
                return;
            }
            this._dash = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Gets point stored at specified index
     * @param index defines the index to look for
     * @returns the requested point if found
     */
    MultiLine.prototype.getAt = function (index) {
        if (!this._points[index]) {
            this._points[index] = new _multiLinePoint__WEBPACK_IMPORTED_MODULE_3__["MultiLinePoint"](this);
        }
        return this._points[index];
    };
    /**
     * Adds new points to the point collection
     * @param items defines the list of items (mesh, control or 2d coordiantes) to add
     * @returns the list of created MultiLinePoint
     */
    MultiLine.prototype.add = function () {
        var _this = this;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        return items.map(function (item) { return _this.push(item); });
    };
    /**
     * Adds a new point to the point collection
     * @param item defines the item (mesh, control or 2d coordiantes) to add
     * @returns the created MultiLinePoint
     */
    MultiLine.prototype.push = function (item) {
        var point = this.getAt(this._points.length);
        if (item == null) {
            return point;
        }
        if (item instanceof babylonjs_Meshes_abstractMesh__WEBPACK_IMPORTED_MODULE_1__["AbstractMesh"]) {
            point.mesh = item;
        }
        else if (item instanceof _control__WEBPACK_IMPORTED_MODULE_2__["Control"]) {
            point.control = item;
        }
        else if (item.x != null && item.y != null) {
            point.x = item.x;
            point.y = item.y;
        }
        return point;
    };
    /**
     * Remove a specific value or point from the active point collection
     * @param value defines the value or point to remove
     */
    MultiLine.prototype.remove = function (value) {
        var index;
        if (value instanceof _multiLinePoint__WEBPACK_IMPORTED_MODULE_3__["MultiLinePoint"]) {
            index = this._points.indexOf(value);
            if (index === -1) {
                return;
            }
        }
        else {
            index = value;
        }
        var point = this._points[index];
        if (!point) {
            return;
        }
        point.dispose();
        this._points.splice(index, 1);
    };
    /**
     * Resets this object to initial state (no point)
     */
    MultiLine.prototype.reset = function () {
        while (this._points.length > 0) {
            this.remove(this._points.length - 1);
        }
    };
    /**
     * Resets all links
     */
    MultiLine.prototype.resetLinks = function () {
        this._points.forEach(function (point) {
            if (point != null) {
                point.resetLinks();
            }
        });
    };
    Object.defineProperty(MultiLine.prototype, "lineWidth", {
        /** Gets or sets line width */
        get: function () {
            return this._lineWidth;
        },
        set: function (value) {
            if (this._lineWidth === value) {
                return;
            }
            this._lineWidth = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MultiLine.prototype, "horizontalAlignment", {
        set: function (value) {
            return;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MultiLine.prototype, "verticalAlignment", {
        set: function (value) {
            return;
        },
        enumerable: false,
        configurable: true
    });
    MultiLine.prototype._getTypeName = function () {
        return "MultiLine";
    };
    MultiLine.prototype._draw = function (context, invalidatedRectangle) {
        context.save();
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }
        this._applyStates(context);
        context.strokeStyle = this.color;
        context.lineWidth = this._lineWidth;
        context.setLineDash(this._dash);
        context.beginPath();
        var first = true; //first index is not necessarily 0
        this._points.forEach(function (point) {
            if (!point) {
                return;
            }
            if (first) {
                context.moveTo(point._point.x, point._point.y);
                first = false;
            }
            else {
                context.lineTo(point._point.x, point._point.y);
            }
        });
        context.stroke();
        context.restore();
    };
    MultiLine.prototype._additionalProcessing = function (parentMeasure, context) {
        var _this = this;
        this._minX = null;
        this._minY = null;
        this._maxX = null;
        this._maxY = null;
        this._points.forEach(function (point, index) {
            if (!point) {
                return;
            }
            point.translate();
            if (_this._minX == null || point._point.x < _this._minX) {
                _this._minX = point._point.x;
            }
            if (_this._minY == null || point._point.y < _this._minY) {
                _this._minY = point._point.y;
            }
            if (_this._maxX == null || point._point.x > _this._maxX) {
                _this._maxX = point._point.x;
            }
            if (_this._maxY == null || point._point.y > _this._maxY) {
                _this._maxY = point._point.y;
            }
        });
        if (this._minX == null) {
            this._minX = 0;
        }
        if (this._minY == null) {
            this._minY = 0;
        }
        if (this._maxX == null) {
            this._maxX = 0;
        }
        if (this._maxY == null) {
            this._maxY = 0;
        }
    };
    MultiLine.prototype._measure = function () {
        if (this._minX == null || this._maxX == null || this._minY == null || this._maxY == null) {
            return;
        }
        this._currentMeasure.width = Math.abs(this._maxX - this._minX) + this._lineWidth;
        this._currentMeasure.height = Math.abs(this._maxY - this._minY) + this._lineWidth;
    };
    MultiLine.prototype._computeAlignment = function (parentMeasure, context) {
        if (this._minX == null || this._minY == null) {
            return;
        }
        this._currentMeasure.left = this._minX - this._lineWidth / 2;
        this._currentMeasure.top = this._minY - this._lineWidth / 2;
    };
    MultiLine.prototype.dispose = function () {
        this.reset();
        _super.prototype.dispose.call(this);
    };
    return MultiLine;
}(_control__WEBPACK_IMPORTED_MODULE_2__["Control"]));

babylonjs_Meshes_abstractMesh__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GUI.MultiLine"] = MultiLine;


/***/ }),

/***/ "./2D/controls/radioButton.ts":
/*!************************************!*\
  !*** ./2D/controls/radioButton.ts ***!
  \************************************/
/*! exports provided: RadioButton */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RadioButton", function() { return RadioButton; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var _stackPanel__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./stackPanel */ "./2D/controls/stackPanel.ts");
/* harmony import */ var _textBlock__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./textBlock */ "./2D/controls/textBlock.ts");






/**
 * Class used to create radio button controls
 */
var RadioButton = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(RadioButton, _super);
    /**
     * Creates a new RadioButton
     * @param name defines the control name
     */
    function RadioButton(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._isChecked = false;
        _this._background = "black";
        _this._checkSizeRatio = 0.8;
        _this._thickness = 1;
        /** Gets or sets group name */
        _this.group = "";
        /** Observable raised when isChecked is changed */
        _this.onIsCheckedChangedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        _this.isPointerBlocker = true;
        return _this;
    }
    Object.defineProperty(RadioButton.prototype, "thickness", {
        /** Gets or sets border thickness */
        get: function () {
            return this._thickness;
        },
        set: function (value) {
            if (this._thickness === value) {
                return;
            }
            this._thickness = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RadioButton.prototype, "checkSizeRatio", {
        /** Gets or sets a value indicating the ratio between overall size and check size */
        get: function () {
            return this._checkSizeRatio;
        },
        set: function (value) {
            value = Math.max(Math.min(1, value), 0);
            if (this._checkSizeRatio === value) {
                return;
            }
            this._checkSizeRatio = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RadioButton.prototype, "background", {
        /** Gets or sets background color */
        get: function () {
            return this._background;
        },
        set: function (value) {
            if (this._background === value) {
                return;
            }
            this._background = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RadioButton.prototype, "isChecked", {
        /** Gets or sets a boolean indicating if the checkbox is checked or not */
        get: function () {
            return this._isChecked;
        },
        set: function (value) {
            var _this = this;
            if (this._isChecked === value) {
                return;
            }
            this._isChecked = value;
            this._markAsDirty();
            this.onIsCheckedChangedObservable.notifyObservers(value);
            if (this._isChecked && this._host) {
                // Update all controls from same group
                this._host.executeOnAllControls(function (control) {
                    if (control === _this) {
                        return;
                    }
                    if (control.group === undefined) {
                        return;
                    }
                    var childRadio = control;
                    if (childRadio.group === _this.group) {
                        childRadio.isChecked = false;
                    }
                });
            }
        },
        enumerable: false,
        configurable: true
    });
    RadioButton.prototype._getTypeName = function () {
        return "RadioButton";
    };
    RadioButton.prototype._draw = function (context) {
        context.save();
        this._applyStates(context);
        var actualWidth = this._currentMeasure.width - this._thickness;
        var actualHeight = this._currentMeasure.height - this._thickness;
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }
        // Outer
        _control__WEBPACK_IMPORTED_MODULE_2__["Control"].drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2 - this._thickness / 2, this._currentMeasure.height / 2 - this._thickness / 2, context);
        context.fillStyle = this._isEnabled ? this._background : this._disabledColor;
        context.fill();
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }
        context.strokeStyle = this.color;
        context.lineWidth = this._thickness;
        context.stroke();
        // Inner
        if (this._isChecked) {
            context.fillStyle = this._isEnabled ? this.color : this._disabledColor;
            var offsetWidth = actualWidth * this._checkSizeRatio;
            var offseHeight = actualHeight * this._checkSizeRatio;
            _control__WEBPACK_IMPORTED_MODULE_2__["Control"].drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, offsetWidth / 2 - this._thickness / 2, offseHeight / 2 - this._thickness / 2, context);
            context.fill();
        }
        context.restore();
    };
    // Events
    RadioButton.prototype._onPointerDown = function (target, coordinates, pointerId, buttonIndex) {
        if (!_super.prototype._onPointerDown.call(this, target, coordinates, pointerId, buttonIndex)) {
            return false;
        }
        if (!this.isChecked) {
            this.isChecked = true;
        }
        return true;
    };
    /**
     * Utility function to easily create a radio button with a header
     * @param title defines the label to use for the header
     * @param group defines the group to use for the radio button
     * @param isChecked defines the initial state of the radio button
     * @param onValueChanged defines the callback to call when value changes
     * @returns a StackPanel containing the radio button and a textBlock
     */
    RadioButton.AddRadioButtonWithHeader = function (title, group, isChecked, onValueChanged) {
        var panel = new _stackPanel__WEBPACK_IMPORTED_MODULE_3__["StackPanel"]();
        panel.isVertical = false;
        panel.height = "30px";
        var radio = new RadioButton();
        radio.width = "20px";
        radio.height = "20px";
        radio.isChecked = isChecked;
        radio.color = "green";
        radio.group = group;
        radio.onIsCheckedChangedObservable.add(function (value) { return onValueChanged(radio, value); });
        panel.addControl(radio);
        var header = new _textBlock__WEBPACK_IMPORTED_MODULE_4__["TextBlock"]();
        header.text = title;
        header.width = "180px";
        header.paddingLeft = "5px";
        header.textHorizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_2__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        header.color = "white";
        panel.addControl(header);
        return panel;
    };
    return RadioButton;
}(_control__WEBPACK_IMPORTED_MODULE_2__["Control"]));

babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GUI.RadioButton"] = RadioButton;


/***/ }),

/***/ "./2D/controls/rectangle.ts":
/*!**********************************!*\
  !*** ./2D/controls/rectangle.ts ***!
  \**********************************/
/*! exports provided: Rectangle */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Rectangle", function() { return Rectangle; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./container */ "./2D/controls/container.ts");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! babylonjs/Misc/typeStore */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2__);



/** Class used to create rectangle container */
var Rectangle = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Rectangle, _super);
    /**
     * Creates a new Rectangle
     * @param name defines the control name
     */
    function Rectangle(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._thickness = 1;
        _this._cornerRadius = 0;
        return _this;
    }
    Object.defineProperty(Rectangle.prototype, "thickness", {
        /** Gets or sets border thickness */
        get: function () {
            return this._thickness;
        },
        set: function (value) {
            if (this._thickness === value) {
                return;
            }
            this._thickness = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rectangle.prototype, "cornerRadius", {
        /** Gets or sets the corner radius angle */
        get: function () {
            return this._cornerRadius;
        },
        set: function (value) {
            if (value < 0) {
                value = 0;
            }
            if (this._cornerRadius === value) {
                return;
            }
            this._cornerRadius = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Rectangle.prototype._getTypeName = function () {
        return "Rectangle";
    };
    Rectangle.prototype._localDraw = function (context) {
        context.save();
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }
        if (this._background) {
            context.fillStyle = this._background;
            if (this._cornerRadius) {
                this._drawRoundedRect(context, this._thickness / 2);
                context.fill();
            }
            else {
                context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            }
        }
        if (this._thickness) {
            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowBlur = 0;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
            }
            if (this.color) {
                context.strokeStyle = this.color;
            }
            context.lineWidth = this._thickness;
            if (this._cornerRadius) {
                this._drawRoundedRect(context, this._thickness / 2);
                context.stroke();
            }
            else {
                context.strokeRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2, this._currentMeasure.width - this._thickness, this._currentMeasure.height - this._thickness);
            }
        }
        context.restore();
    };
    Rectangle.prototype._additionalProcessing = function (parentMeasure, context) {
        _super.prototype._additionalProcessing.call(this, parentMeasure, context);
        this._measureForChildren.width -= 2 * this._thickness;
        this._measureForChildren.height -= 2 * this._thickness;
        this._measureForChildren.left += this._thickness;
        this._measureForChildren.top += this._thickness;
    };
    Rectangle.prototype._drawRoundedRect = function (context, offset) {
        if (offset === void 0) { offset = 0; }
        var x = this._currentMeasure.left + offset;
        var y = this._currentMeasure.top + offset;
        var width = this._currentMeasure.width - offset * 2;
        var height = this._currentMeasure.height - offset * 2;
        var radius = Math.min(height / 2 - 2, Math.min(width / 2 - 2, this._cornerRadius));
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
    };
    Rectangle.prototype._clipForChildren = function (context) {
        if (this._cornerRadius) {
            this._drawRoundedRect(context, this._thickness);
            context.clip();
        }
    };
    return Rectangle;
}(_container__WEBPACK_IMPORTED_MODULE_1__["Container"]));

babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2__["_TypeStore"].RegisteredTypes["BABYLON.GUI.Rectangle"] = Rectangle;


/***/ }),

/***/ "./2D/controls/scrollViewers/scrollViewer.ts":
/*!***************************************************!*\
  !*** ./2D/controls/scrollViewers/scrollViewer.ts ***!
  \***************************************************/
/*! exports provided: ScrollViewer */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ScrollViewer", function() { return ScrollViewer; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _rectangle__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../rectangle */ "./2D/controls/rectangle.ts");
/* harmony import */ var _grid__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../grid */ "./2D/controls/grid.ts");
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../control */ "./2D/controls/control.ts");
/* harmony import */ var _scrollViewerWindow__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./scrollViewerWindow */ "./2D/controls/scrollViewers/scrollViewerWindow.ts");
/* harmony import */ var _sliders_scrollBar__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../sliders/scrollBar */ "./2D/controls/sliders/scrollBar.ts");
/* harmony import */ var _sliders_imageScrollBar__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../sliders/imageScrollBar */ "./2D/controls/sliders/imageScrollBar.ts");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! babylonjs/Misc/typeStore */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_7__);








/**
 * Class used to hold a viewer window and sliders in a grid
*/
var ScrollViewer = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(ScrollViewer, _super);
    /**
    * Creates a new ScrollViewer
    * @param name of ScrollViewer
    */
    function ScrollViewer(name, isImageBased) {
        var _this = _super.call(this, name) || this;
        _this._barSize = 20;
        _this._pointerIsOver = false;
        _this._wheelPrecision = 0.05;
        _this._thumbLength = 0.5;
        _this._thumbHeight = 1;
        _this._barImageHeight = 1;
        _this._horizontalBarImageHeight = 1;
        _this._verticalBarImageHeight = 1;
        _this._oldWindowContentsWidth = 0;
        _this._oldWindowContentsHeight = 0;
        _this._forceHorizontalBar = false;
        _this._forceVerticalBar = false;
        _this._useImageBar = isImageBased ? isImageBased : false;
        _this.onDirtyObservable.add(function () {
            _this._horizontalBarSpace.color = _this.color;
            _this._verticalBarSpace.color = _this.color;
            _this._dragSpace.color = _this.color;
        });
        _this.onPointerEnterObservable.add(function () {
            _this._pointerIsOver = true;
        });
        _this.onPointerOutObservable.add(function () {
            _this._pointerIsOver = false;
        });
        _this._grid = new _grid__WEBPACK_IMPORTED_MODULE_2__["Grid"]();
        if (_this._useImageBar) {
            _this._horizontalBar = new _sliders_imageScrollBar__WEBPACK_IMPORTED_MODULE_6__["ImageScrollBar"]();
            _this._verticalBar = new _sliders_imageScrollBar__WEBPACK_IMPORTED_MODULE_6__["ImageScrollBar"]();
        }
        else {
            _this._horizontalBar = new _sliders_scrollBar__WEBPACK_IMPORTED_MODULE_5__["ScrollBar"]();
            _this._verticalBar = new _sliders_scrollBar__WEBPACK_IMPORTED_MODULE_5__["ScrollBar"]();
        }
        _this._window = new _scrollViewerWindow__WEBPACK_IMPORTED_MODULE_4__["_ScrollViewerWindow"]("scrollViewer_window");
        _this._window.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        _this._window.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_TOP;
        _this._grid.addColumnDefinition(1);
        _this._grid.addColumnDefinition(0, true);
        _this._grid.addRowDefinition(1);
        _this._grid.addRowDefinition(0, true);
        _super.prototype.addControl.call(_this, _this._grid);
        _this._grid.addControl(_this._window, 0, 0);
        _this._verticalBarSpace = new _rectangle__WEBPACK_IMPORTED_MODULE_1__["Rectangle"]();
        _this._verticalBarSpace.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        _this._verticalBarSpace.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_TOP;
        _this._verticalBarSpace.thickness = 1;
        _this._grid.addControl(_this._verticalBarSpace, 0, 1);
        _this._addBar(_this._verticalBar, _this._verticalBarSpace, true, Math.PI);
        _this._horizontalBarSpace = new _rectangle__WEBPACK_IMPORTED_MODULE_1__["Rectangle"]();
        _this._horizontalBarSpace.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        _this._horizontalBarSpace.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_TOP;
        _this._horizontalBarSpace.thickness = 1;
        _this._grid.addControl(_this._horizontalBarSpace, 1, 0);
        _this._addBar(_this._horizontalBar, _this._horizontalBarSpace, false, 0);
        _this._dragSpace = new _rectangle__WEBPACK_IMPORTED_MODULE_1__["Rectangle"]();
        _this._dragSpace.thickness = 1;
        _this._grid.addControl(_this._dragSpace, 1, 1);
        // Colors
        if (!_this._useImageBar) {
            _this.barColor = "grey";
            _this.barBackground = "transparent";
        }
        return _this;
    }
    Object.defineProperty(ScrollViewer.prototype, "horizontalBar", {
        /**
         * Gets the horizontal scrollbar
         */
        get: function () {
            return this._horizontalBar;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "verticalBar", {
        /**
         * Gets the vertical scrollbar
         */
        get: function () {
            return this._verticalBar;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Adds a new control to the current container
     * @param control defines the control to add
     * @returns the current container
     */
    ScrollViewer.prototype.addControl = function (control) {
        if (!control) {
            return this;
        }
        this._window.addControl(control);
        return this;
    };
    /**
     * Removes a control from the current container
     * @param control defines the control to remove
     * @returns the current container
     */
    ScrollViewer.prototype.removeControl = function (control) {
        this._window.removeControl(control);
        return this;
    };
    Object.defineProperty(ScrollViewer.prototype, "children", {
        /** Gets the list of children */
        get: function () {
            return this._window.children;
        },
        enumerable: false,
        configurable: true
    });
    ScrollViewer.prototype._flagDescendantsAsMatrixDirty = function () {
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            child._markMatrixAsDirty();
        }
    };
    Object.defineProperty(ScrollViewer.prototype, "freezeControls", {
        /**
         * Freezes or unfreezes the controls in the window.
         * When controls are frozen, the scroll viewer can render a lot more quickly but updates to positions/sizes of controls
         * are not taken into account. If you want to change positions/sizes, unfreeze, perform the changes then freeze again
         */
        get: function () {
            return this._window.freezeControls;
        },
        set: function (value) {
            this._window.freezeControls = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "bucketWidth", {
        /** Gets the bucket width */
        get: function () {
            return this._window.bucketWidth;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "bucketHeight", {
        /** Gets the bucket height */
        get: function () {
            return this._window.bucketHeight;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Sets the bucket sizes.
     * When freezeControls is true, setting a non-zero bucket size will improve performances by updating only
     * controls that are visible. The bucket sizes is used to subdivide (internally) the window area to smaller areas into which
     * controls are dispatched. So, the size should be roughly equals to the mean size of all the controls of
     * the window. To disable the usage of buckets, sets either width or height (or both) to 0.
     * Please note that using this option will raise the memory usage (the higher the bucket sizes, the less memory
     * used), that's why it is not enabled by default.
     * @param width width of the bucket
     * @param height height of the bucket
     */
    ScrollViewer.prototype.setBucketSizes = function (width, height) {
        this._window.setBucketSizes(width, height);
    };
    Object.defineProperty(ScrollViewer.prototype, "forceHorizontalBar", {
        /**
         * Forces the horizontal scroll bar to be displayed
         */
        get: function () {
            return this._forceHorizontalBar;
        },
        set: function (value) {
            this._grid.setRowDefinition(1, value ? this._barSize : 0, true);
            this._horizontalBar.isVisible = value;
            this._forceHorizontalBar = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "forceVerticalBar", {
        /**
         * Forces the vertical scroll bar to be displayed
         */
        get: function () {
            return this._forceVerticalBar;
        },
        set: function (value) {
            this._grid.setColumnDefinition(1, value ? this._barSize : 0, true);
            this._verticalBar.isVisible = value;
            this._forceVerticalBar = value;
        },
        enumerable: false,
        configurable: true
    });
    /** Reset the scroll viewer window to initial size */
    ScrollViewer.prototype.resetWindow = function () {
        this._window.width = "100%";
        this._window.height = "100%";
    };
    ScrollViewer.prototype._getTypeName = function () {
        return "ScrollViewer";
    };
    ScrollViewer.prototype._buildClientSizes = function () {
        var ratio = this.host.idealRatio;
        this._window.parentClientWidth = this._currentMeasure.width - (this._verticalBar.isVisible || this.forceVerticalBar ? this._barSize * ratio : 0) - 2 * this.thickness;
        this._window.parentClientHeight = this._currentMeasure.height - (this._horizontalBar.isVisible || this.forceHorizontalBar ? this._barSize * ratio : 0) - 2 * this.thickness;
        this._clientWidth = this._window.parentClientWidth;
        this._clientHeight = this._window.parentClientHeight;
    };
    ScrollViewer.prototype._additionalProcessing = function (parentMeasure, context) {
        _super.prototype._additionalProcessing.call(this, parentMeasure, context);
        this._buildClientSizes();
    };
    ScrollViewer.prototype._postMeasure = function () {
        _super.prototype._postMeasure.call(this);
        this._updateScroller();
        this._setWindowPosition(false);
    };
    Object.defineProperty(ScrollViewer.prototype, "wheelPrecision", {
        /**
         * Gets or sets the mouse wheel precision
         * from 0 to 1 with a default value of 0.05
         * */
        get: function () {
            return this._wheelPrecision;
        },
        set: function (value) {
            if (this._wheelPrecision === value) {
                return;
            }
            if (value < 0) {
                value = 0;
            }
            if (value > 1) {
                value = 1;
            }
            this._wheelPrecision = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "scrollBackground", {
        /** Gets or sets the scroll bar container background color */
        get: function () {
            return this._horizontalBarSpace.background;
        },
        set: function (color) {
            if (this._horizontalBarSpace.background === color) {
                return;
            }
            this._horizontalBarSpace.background = color;
            this._verticalBarSpace.background = color;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "barColor", {
        /** Gets or sets the bar color */
        get: function () {
            return this._barColor;
        },
        set: function (color) {
            if (this._barColor === color) {
                return;
            }
            this._barColor = color;
            this._horizontalBar.color = color;
            this._verticalBar.color = color;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "thumbImage", {
        /** Gets or sets the bar image */
        get: function () {
            return this._barImage;
        },
        set: function (value) {
            if (this._barImage === value) {
                return;
            }
            this._barImage = value;
            var hb = this._horizontalBar;
            var vb = this._verticalBar;
            hb.thumbImage = value;
            vb.thumbImage = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "horizontalThumbImage", {
        /** Gets or sets the horizontal bar image */
        get: function () {
            return this._horizontalBarImage;
        },
        set: function (value) {
            if (this._horizontalBarImage === value) {
                return;
            }
            this._horizontalBarImage = value;
            var hb = this._horizontalBar;
            hb.thumbImage = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "verticalThumbImage", {
        /** Gets or sets the vertical bar image */
        get: function () {
            return this._verticalBarImage;
        },
        set: function (value) {
            if (this._verticalBarImage === value) {
                return;
            }
            this._verticalBarImage = value;
            var vb = this._verticalBar;
            vb.thumbImage = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "barSize", {
        /** Gets or sets the size of the bar */
        get: function () {
            return this._barSize;
        },
        set: function (value) {
            if (this._barSize === value) {
                return;
            }
            this._barSize = value;
            this._markAsDirty();
            if (this._horizontalBar.isVisible) {
                this._grid.setRowDefinition(1, this._barSize, true);
            }
            if (this._verticalBar.isVisible) {
                this._grid.setColumnDefinition(1, this._barSize, true);
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "thumbLength", {
        /** Gets or sets the length of the thumb */
        get: function () {
            return this._thumbLength;
        },
        set: function (value) {
            if (this._thumbLength === value) {
                return;
            }
            if (value <= 0) {
                value = 0.1;
            }
            if (value > 1) {
                value = 1;
            }
            this._thumbLength = value;
            var hb = this._horizontalBar;
            var vb = this._verticalBar;
            hb.thumbLength = value;
            vb.thumbLength = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "thumbHeight", {
        /** Gets or sets the height of the thumb */
        get: function () {
            return this._thumbHeight;
        },
        set: function (value) {
            if (this._thumbHeight === value) {
                return;
            }
            if (value <= 0) {
                value = 0.1;
            }
            if (value > 1) {
                value = 1;
            }
            this._thumbHeight = value;
            var hb = this._horizontalBar;
            var vb = this._verticalBar;
            hb.thumbHeight = value;
            vb.thumbHeight = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "barImageHeight", {
        /** Gets or sets the height of the bar image */
        get: function () {
            return this._barImageHeight;
        },
        set: function (value) {
            if (this._barImageHeight === value) {
                return;
            }
            if (value <= 0) {
                value = 0.1;
            }
            if (value > 1) {
                value = 1;
            }
            this._barImageHeight = value;
            var hb = this._horizontalBar;
            var vb = this._verticalBar;
            hb.barImageHeight = value;
            vb.barImageHeight = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "horizontalBarImageHeight", {
        /** Gets or sets the height of the horizontal bar image */
        get: function () {
            return this._horizontalBarImageHeight;
        },
        set: function (value) {
            if (this._horizontalBarImageHeight === value) {
                return;
            }
            if (value <= 0) {
                value = 0.1;
            }
            if (value > 1) {
                value = 1;
            }
            this._horizontalBarImageHeight = value;
            var hb = this._horizontalBar;
            hb.barImageHeight = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "verticalBarImageHeight", {
        /** Gets or sets the height of the vertical bar image */
        get: function () {
            return this._verticalBarImageHeight;
        },
        set: function (value) {
            if (this._verticalBarImageHeight === value) {
                return;
            }
            if (value <= 0) {
                value = 0.1;
            }
            if (value > 1) {
                value = 1;
            }
            this._verticalBarImageHeight = value;
            var vb = this._verticalBar;
            vb.barImageHeight = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "barBackground", {
        /** Gets or sets the bar background */
        get: function () {
            return this._barBackground;
        },
        set: function (color) {
            if (this._barBackground === color) {
                return;
            }
            this._barBackground = color;
            var hb = this._horizontalBar;
            var vb = this._verticalBar;
            hb.background = color;
            vb.background = color;
            this._dragSpace.background = color;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "barImage", {
        /** Gets or sets the bar background image */
        get: function () {
            return this._barBackgroundImage;
        },
        set: function (value) {
            if (this._barBackgroundImage === value) {
            }
            this._barBackgroundImage = value;
            var hb = this._horizontalBar;
            var vb = this._verticalBar;
            hb.backgroundImage = value;
            vb.backgroundImage = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "horizontalBarImage", {
        /** Gets or sets the horizontal bar background image */
        get: function () {
            return this._horizontalBarBackgroundImage;
        },
        set: function (value) {
            if (this._horizontalBarBackgroundImage === value) {
            }
            this._horizontalBarBackgroundImage = value;
            var hb = this._horizontalBar;
            hb.backgroundImage = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollViewer.prototype, "verticalBarImage", {
        /** Gets or sets the vertical bar background image */
        get: function () {
            return this._verticalBarBackgroundImage;
        },
        set: function (value) {
            if (this._verticalBarBackgroundImage === value) {
            }
            this._verticalBarBackgroundImage = value;
            var vb = this._verticalBar;
            vb.backgroundImage = value;
        },
        enumerable: false,
        configurable: true
    });
    ScrollViewer.prototype._setWindowPosition = function (force) {
        if (force === void 0) { force = true; }
        var ratio = this.host.idealRatio;
        var windowContentsWidth = this._window._currentMeasure.width;
        var windowContentsHeight = this._window._currentMeasure.height;
        if (!force && this._oldWindowContentsWidth === windowContentsWidth && this._oldWindowContentsHeight === windowContentsHeight) {
            return;
        }
        this._oldWindowContentsWidth = windowContentsWidth;
        this._oldWindowContentsHeight = windowContentsHeight;
        var _endLeft = this._clientWidth - windowContentsWidth;
        var _endTop = this._clientHeight - windowContentsHeight;
        var newLeft = (this._horizontalBar.value / ratio) * _endLeft + "px";
        var newTop = (this._verticalBar.value / ratio) * _endTop + "px";
        if (newLeft !== this._window.left) {
            this._window.left = newLeft;
            if (!this.freezeControls) {
                this._rebuildLayout = true;
            }
        }
        if (newTop !== this._window.top) {
            this._window.top = newTop;
            if (!this.freezeControls) {
                this._rebuildLayout = true;
            }
        }
    };
    /** @hidden */
    ScrollViewer.prototype._updateScroller = function () {
        var windowContentsWidth = this._window._currentMeasure.width;
        var windowContentsHeight = this._window._currentMeasure.height;
        if (this._horizontalBar.isVisible && windowContentsWidth <= this._clientWidth && !this.forceHorizontalBar) {
            this._grid.setRowDefinition(1, 0, true);
            this._horizontalBar.isVisible = false;
            this._horizontalBar.value = 0;
            this._rebuildLayout = true;
        }
        else if (!this._horizontalBar.isVisible && (windowContentsWidth > this._clientWidth || this.forceHorizontalBar)) {
            this._grid.setRowDefinition(1, this._barSize, true);
            this._horizontalBar.isVisible = true;
            this._rebuildLayout = true;
        }
        if (this._verticalBar.isVisible && windowContentsHeight <= this._clientHeight && !this.forceVerticalBar) {
            this._grid.setColumnDefinition(1, 0, true);
            this._verticalBar.isVisible = false;
            this._verticalBar.value = 0;
            this._rebuildLayout = true;
        }
        else if (!this._verticalBar.isVisible && (windowContentsHeight > this._clientHeight || this.forceVerticalBar)) {
            this._grid.setColumnDefinition(1, this._barSize, true);
            this._verticalBar.isVisible = true;
            this._rebuildLayout = true;
        }
        this._buildClientSizes();
        var ratio = this.host.idealRatio;
        this._horizontalBar.thumbWidth = this._thumbLength * 0.9 * (this._clientWidth / ratio) + "px";
        this._verticalBar.thumbWidth = this._thumbLength * 0.9 * (this._clientHeight / ratio) + "px";
    };
    ScrollViewer.prototype._link = function (host) {
        _super.prototype._link.call(this, host);
        this._attachWheel();
    };
    /** @hidden */
    ScrollViewer.prototype._addBar = function (barControl, barContainer, isVertical, rotation) {
        var _this = this;
        barControl.paddingLeft = 0;
        barControl.width = "100%";
        barControl.height = "100%";
        barControl.barOffset = 0;
        barControl.value = 0;
        barControl.maximum = 1;
        barControl.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_CENTER;
        barControl.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_CENTER;
        barControl.isVertical = isVertical;
        barControl.rotation = rotation;
        barControl.isVisible = false;
        barContainer.addControl(barControl);
        barControl.onValueChangedObservable.add(function (value) {
            _this._setWindowPosition();
        });
    };
    /** @hidden */
    ScrollViewer.prototype._attachWheel = function () {
        var _this = this;
        if (!this._host || this._onWheelObserver) {
            return;
        }
        this._onWheelObserver = this.onWheelObservable.add(function (pi) {
            if (!_this._pointerIsOver) {
                return;
            }
            if (_this._verticalBar.isVisible == true) {
                if (pi.y < 0 && _this._verticalBar.value > 0) {
                    _this._verticalBar.value -= _this._wheelPrecision;
                }
                else if (pi.y > 0 && _this._verticalBar.value < _this._verticalBar.maximum) {
                    _this._verticalBar.value += _this._wheelPrecision;
                }
            }
            if (_this._horizontalBar.isVisible == true) {
                if (pi.x < 0 && _this._horizontalBar.value < _this._horizontalBar.maximum) {
                    _this._horizontalBar.value += _this._wheelPrecision;
                }
                else if (pi.x > 0 && _this._horizontalBar.value > 0) {
                    _this._horizontalBar.value -= _this._wheelPrecision;
                }
            }
        });
    };
    ScrollViewer.prototype._renderHighlightSpecific = function (context) {
        if (!this.isHighlighted) {
            return;
        }
        _super.prototype._renderHighlightSpecific.call(this, context);
        this._grid._renderHighlightSpecific(context);
        context.restore();
    };
    /** Releases associated resources */
    ScrollViewer.prototype.dispose = function () {
        this.onWheelObservable.remove(this._onWheelObserver);
        this._onWheelObserver = null;
        _super.prototype.dispose.call(this);
    };
    return ScrollViewer;
}(_rectangle__WEBPACK_IMPORTED_MODULE_1__["Rectangle"]));

babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_7__["_TypeStore"].RegisteredTypes["BABYLON.GUI.ScrollViewer"] = ScrollViewer;


/***/ }),

/***/ "./2D/controls/scrollViewers/scrollViewerWindow.ts":
/*!*********************************************************!*\
  !*** ./2D/controls/scrollViewers/scrollViewerWindow.ts ***!
  \*********************************************************/
/*! exports provided: _ScrollViewerWindow */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_ScrollViewerWindow", function() { return _ScrollViewerWindow; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _measure__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../measure */ "./2D/measure.ts");
/* harmony import */ var _container__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../container */ "./2D/controls/container.ts");
/* harmony import */ var _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../valueAndUnit */ "./2D/valueAndUnit.ts");
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../control */ "./2D/controls/control.ts");





/**
 * Class used to hold a the container for ScrollViewer
 * @hidden
*/
var _ScrollViewerWindow = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(_ScrollViewerWindow, _super);
    /**
    * Creates a new ScrollViewerWindow
    * @param name of ScrollViewerWindow
    */
    function _ScrollViewerWindow(name) {
        var _this = _super.call(this, name) || this;
        _this._freezeControls = false;
        _this._bucketWidth = 0;
        _this._bucketHeight = 0;
        _this._buckets = {};
        return _this;
    }
    Object.defineProperty(_ScrollViewerWindow.prototype, "freezeControls", {
        get: function () {
            return this._freezeControls;
        },
        set: function (value) {
            if (this._freezeControls === value) {
                return;
            }
            if (!value) {
                this._restoreMeasures();
            }
            // trigger a full normal layout calculation to be sure all children have their measures up to date
            this._freezeControls = false;
            var textureSize = this.host.getSize();
            var renderWidth = textureSize.width;
            var renderHeight = textureSize.height;
            var context = this.host.getContext();
            var measure = new _measure__WEBPACK_IMPORTED_MODULE_1__["Measure"](0, 0, renderWidth, renderHeight);
            this.host._numLayoutCalls = 0;
            this.host._rootContainer._layout(measure, context);
            // in freeze mode, prepare children measures accordingly
            if (value) {
                this._updateMeasures();
                if (this._useBuckets()) {
                    this._makeBuckets();
                }
            }
            this._freezeControls = value;
            this.host.markAsDirty(); // redraw with the (new) current settings
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_ScrollViewerWindow.prototype, "bucketWidth", {
        get: function () {
            return this._bucketWidth;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_ScrollViewerWindow.prototype, "bucketHeight", {
        get: function () {
            return this._bucketHeight;
        },
        enumerable: false,
        configurable: true
    });
    _ScrollViewerWindow.prototype.setBucketSizes = function (width, height) {
        this._bucketWidth = width;
        this._bucketHeight = height;
        if (this._useBuckets()) {
            if (this._freezeControls) {
                this._makeBuckets();
            }
        }
        else {
            this._buckets = {};
        }
    };
    _ScrollViewerWindow.prototype._useBuckets = function () {
        return this._bucketWidth > 0 && this._bucketHeight > 0;
    };
    _ScrollViewerWindow.prototype._makeBuckets = function () {
        this._buckets = {};
        this._bucketLen = Math.ceil(this.widthInPixels / this._bucketWidth);
        this._dispatchInBuckets(this._children);
        this._oldLeft = null;
        this._oldTop = null;
    };
    _ScrollViewerWindow.prototype._dispatchInBuckets = function (children) {
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            var bStartX = Math.max(0, Math.floor((child._customData._origLeft - this._customData.origLeft) / this._bucketWidth)), bEndX = Math.floor((child._customData._origLeft - this._customData.origLeft + child._currentMeasure.width - 1) / this._bucketWidth), bStartY = Math.max(0, Math.floor((child._customData._origTop - this._customData.origTop) / this._bucketHeight)), bEndY = Math.floor((child._customData._origTop - this._customData.origTop + child._currentMeasure.height - 1) / this._bucketHeight);
            while (bStartY <= bEndY) {
                for (var x = bStartX; x <= bEndX; ++x) {
                    var bucket = bStartY * this._bucketLen + x, lstc = this._buckets[bucket];
                    if (!lstc) {
                        lstc = [];
                        this._buckets[bucket] = lstc;
                    }
                    lstc.push(child);
                }
                bStartY++;
            }
            if (child instanceof _container__WEBPACK_IMPORTED_MODULE_2__["Container"] && child._children.length > 0) {
                this._dispatchInBuckets(child._children);
            }
        }
    };
    // reset left and top measures for the window and all its children
    _ScrollViewerWindow.prototype._updateMeasures = function () {
        var left = this.leftInPixels | 0, top = this.topInPixels | 0;
        this._measureForChildren.left -= left;
        this._measureForChildren.top -= top;
        this._currentMeasure.left -= left;
        this._currentMeasure.top -= top;
        this._customData.origLeftForChildren = this._measureForChildren.left;
        this._customData.origTopForChildren = this._measureForChildren.top;
        this._customData.origLeft = this._currentMeasure.left;
        this._customData.origTop = this._currentMeasure.top;
        this._updateChildrenMeasures(this._children, left, top);
    };
    _ScrollViewerWindow.prototype._updateChildrenMeasures = function (children, left, top) {
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            child._currentMeasure.left -= left;
            child._currentMeasure.top -= top;
            child._customData._origLeft = child._currentMeasure.left; // save the original left and top values for each child
            child._customData._origTop = child._currentMeasure.top;
            if (child instanceof _container__WEBPACK_IMPORTED_MODULE_2__["Container"] && child._children.length > 0) {
                this._updateChildrenMeasures(child._children, left, top);
            }
        }
    };
    _ScrollViewerWindow.prototype._restoreMeasures = function () {
        var left = this.leftInPixels | 0, top = this.topInPixels | 0;
        this._measureForChildren.left = this._customData.origLeftForChildren + left;
        this._measureForChildren.top = this._customData.origTopForChildren + top;
        this._currentMeasure.left = this._customData.origLeft + left;
        this._currentMeasure.top = this._customData.origTop + top;
    };
    _ScrollViewerWindow.prototype._getTypeName = function () {
        return "ScrollViewerWindow";
    };
    /** @hidden */
    _ScrollViewerWindow.prototype._additionalProcessing = function (parentMeasure, context) {
        _super.prototype._additionalProcessing.call(this, parentMeasure, context);
        this._parentMeasure = parentMeasure;
        this._measureForChildren.left = this._currentMeasure.left;
        this._measureForChildren.top = this._currentMeasure.top;
        this._measureForChildren.width = parentMeasure.width;
        this._measureForChildren.height = parentMeasure.height;
    };
    /** @hidden */
    _ScrollViewerWindow.prototype._layout = function (parentMeasure, context) {
        if (this._freezeControls) {
            this.invalidateRect(); // will trigger a redraw of the window
            return false;
        }
        return _super.prototype._layout.call(this, parentMeasure, context);
    };
    _ScrollViewerWindow.prototype._scrollChildren = function (children, left, top) {
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            child._currentMeasure.left = child._customData._origLeft + left;
            child._currentMeasure.top = child._customData._origTop + top;
            child._isClipped = false; // clipping will be handled by _draw and the call to _intersectsRect()
            if (child instanceof _container__WEBPACK_IMPORTED_MODULE_2__["Container"] && child._children.length > 0) {
                this._scrollChildren(child._children, left, top);
            }
        }
    };
    _ScrollViewerWindow.prototype._scrollChildrenWithBuckets = function (left, top, scrollLeft, scrollTop) {
        var bStartX = Math.max(0, Math.floor(-left / this._bucketWidth)), bEndX = Math.floor((-left + this._parentMeasure.width - 1) / this._bucketWidth), bStartY = Math.max(0, Math.floor(-top / this._bucketHeight)), bEndY = Math.floor((-top + this._parentMeasure.height - 1) / this._bucketHeight);
        while (bStartY <= bEndY) {
            for (var x = bStartX; x <= bEndX; ++x) {
                var bucket = bStartY * this._bucketLen + x, lstc = this._buckets[bucket];
                if (lstc) {
                    for (var i = 0; i < lstc.length; ++i) {
                        var child = lstc[i];
                        child._currentMeasure.left = child._customData._origLeft + scrollLeft;
                        child._currentMeasure.top = child._customData._origTop + scrollTop;
                        child._isClipped = false; // clipping will be handled by _draw and the call to _intersectsRect()
                    }
                }
            }
            bStartY++;
        }
    };
    /** @hidden */
    _ScrollViewerWindow.prototype._draw = function (context, invalidatedRectangle) {
        if (!this._freezeControls) {
            _super.prototype._draw.call(this, context, invalidatedRectangle);
            return;
        }
        this._localDraw(context);
        if (this.clipChildren) {
            this._clipForChildren(context);
        }
        var left = this.leftInPixels | 0, top = this.topInPixels | 0;
        if (this._useBuckets()) {
            if (this._oldLeft !== null && this._oldTop !== null) {
                this._scrollChildrenWithBuckets(this._oldLeft, this._oldTop, left, top);
                this._scrollChildrenWithBuckets(left, top, left, top);
            }
            else {
                this._scrollChildren(this._children, left, top);
            }
        }
        else {
            this._scrollChildren(this._children, left, top);
        }
        this._oldLeft = left;
        this._oldTop = top;
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (!child._intersectsRect(this._parentMeasure)) {
                continue;
            }
            child._render(context, this._parentMeasure);
        }
    };
    _ScrollViewerWindow.prototype._postMeasure = function () {
        if (this._freezeControls) {
            _super.prototype._postMeasure.call(this);
            return;
        }
        var maxWidth = this.parentClientWidth;
        var maxHeight = this.parentClientHeight;
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (!child.isVisible || child.notRenderable) {
                continue;
            }
            if (child.horizontalAlignment === _control__WEBPACK_IMPORTED_MODULE_4__["Control"].HORIZONTAL_ALIGNMENT_CENTER) {
                child._offsetLeft(this._currentMeasure.left - child._currentMeasure.left);
            }
            if (child.verticalAlignment === _control__WEBPACK_IMPORTED_MODULE_4__["Control"].VERTICAL_ALIGNMENT_CENTER) {
                child._offsetTop(this._currentMeasure.top - child._currentMeasure.top);
            }
            maxWidth = Math.max(maxWidth, child._currentMeasure.left - this._currentMeasure.left + child._currentMeasure.width);
            maxHeight = Math.max(maxHeight, child._currentMeasure.top - this._currentMeasure.top + child._currentMeasure.height);
        }
        if (this._currentMeasure.width !== maxWidth) {
            this._width.updateInPlace(maxWidth, _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"].UNITMODE_PIXEL);
            this._currentMeasure.width = maxWidth;
            this._rebuildLayout = true;
            this._isDirty = true;
        }
        if (this._currentMeasure.height !== maxHeight) {
            this._height.updateInPlace(maxHeight, _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"].UNITMODE_PIXEL);
            this._currentMeasure.height = maxHeight;
            this._rebuildLayout = true;
            this._isDirty = true;
        }
        _super.prototype._postMeasure.call(this);
    };
    return _ScrollViewerWindow;
}(_container__WEBPACK_IMPORTED_MODULE_2__["Container"]));



/***/ }),

/***/ "./2D/controls/selector.ts":
/*!*********************************!*\
  !*** ./2D/controls/selector.ts ***!
  \*********************************/
/*! exports provided: SelectorGroup, CheckboxGroup, RadioGroup, SliderGroup, SelectionPanel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SelectorGroup", function() { return SelectorGroup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CheckboxGroup", function() { return CheckboxGroup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RadioGroup", function() { return RadioGroup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SliderGroup", function() { return SliderGroup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SelectionPanel", function() { return SelectionPanel; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _rectangle__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./rectangle */ "./2D/controls/rectangle.ts");
/* harmony import */ var _stackPanel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stackPanel */ "./2D/controls/stackPanel.ts");
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var _textBlock__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./textBlock */ "./2D/controls/textBlock.ts");
/* harmony import */ var _checkbox__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./checkbox */ "./2D/controls/checkbox.ts");
/* harmony import */ var _radioButton__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./radioButton */ "./2D/controls/radioButton.ts");
/* harmony import */ var _sliders_slider__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./sliders/slider */ "./2D/controls/sliders/slider.ts");
/* harmony import */ var _container__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./container */ "./2D/controls/container.ts");









/** Class used to create a RadioGroup
 * which contains groups of radio buttons
*/
var SelectorGroup = /** @class */ (function () {
    /**
     * Creates a new SelectorGroup
     * @param name of group, used as a group heading
     */
    function SelectorGroup(
    /** name of SelectorGroup */
    name) {
        this.name = name;
        this._groupPanel = new _stackPanel__WEBPACK_IMPORTED_MODULE_2__["StackPanel"]();
        this._selectors = new Array();
        this._groupPanel.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_TOP;
        this._groupPanel.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        this._groupHeader = this._addGroupHeader(name);
    }
    Object.defineProperty(SelectorGroup.prototype, "groupPanel", {
        /** Gets the groupPanel of the SelectorGroup  */
        get: function () {
            return this._groupPanel;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SelectorGroup.prototype, "selectors", {
        /** Gets the selectors array */
        get: function () {
            return this._selectors;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SelectorGroup.prototype, "header", {
        /** Gets and sets the group header */
        get: function () {
            return this._groupHeader.text;
        },
        set: function (label) {
            if (this._groupHeader.text === "label") {
                return;
            }
            this._groupHeader.text = label;
        },
        enumerable: false,
        configurable: true
    });
    /** @hidden */
    SelectorGroup.prototype._addGroupHeader = function (text) {
        var groupHeading = new _textBlock__WEBPACK_IMPORTED_MODULE_4__["TextBlock"]("groupHead", text);
        groupHeading.width = 0.9;
        groupHeading.height = "30px";
        groupHeading.textWrapping = true;
        groupHeading.color = "black";
        groupHeading.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        groupHeading.textHorizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        groupHeading.left = "2px";
        this._groupPanel.addControl(groupHeading);
        return groupHeading;
    };
    /** @hidden*/
    SelectorGroup.prototype._getSelector = function (selectorNb) {
        if (selectorNb < 0 || selectorNb >= this._selectors.length) {
            return;
        }
        return this._selectors[selectorNb];
    };
    /** Removes the selector at the given position
    * @param selectorNb the position of the selector within the group
   */
    SelectorGroup.prototype.removeSelector = function (selectorNb) {
        if (selectorNb < 0 || selectorNb >= this._selectors.length) {
            return;
        }
        this._groupPanel.removeControl(this._selectors[selectorNb]);
        this._selectors.splice(selectorNb, 1);
    };
    return SelectorGroup;
}());

/** Class used to create a CheckboxGroup
 * which contains groups of checkbox buttons
*/
var CheckboxGroup = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(CheckboxGroup, _super);
    function CheckboxGroup() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /** Adds a checkbox as a control
     * @param text is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    CheckboxGroup.prototype.addCheckbox = function (text, func, checked) {
        if (func === void 0) { func = function (s) { }; }
        if (checked === void 0) { checked = false; }
        var checked = checked || false;
        var button = new _checkbox__WEBPACK_IMPORTED_MODULE_5__["Checkbox"]();
        button.width = "20px";
        button.height = "20px";
        button.color = "#364249";
        button.background = "#CCCCCC";
        button.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        button.onIsCheckedChangedObservable.add(function (state) {
            func(state);
        });
        var _selector = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].AddHeader(button, text, "200px", { isHorizontal: true, controlFirst: true });
        _selector.height = "30px";
        _selector.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        _selector.left = "4px";
        this.groupPanel.addControl(_selector);
        this.selectors.push(_selector);
        button.isChecked = checked;
        if (this.groupPanel.parent && this.groupPanel.parent.parent) {
            button.color = this.groupPanel.parent.parent.buttonColor;
            button.background = this.groupPanel.parent.parent.buttonBackground;
        }
    };
    /** @hidden */
    CheckboxGroup.prototype._setSelectorLabel = function (selectorNb, label) {
        this.selectors[selectorNb].children[1].text = label;
    };
    /** @hidden */
    CheckboxGroup.prototype._setSelectorLabelColor = function (selectorNb, color) {
        this.selectors[selectorNb].children[1].color = color;
    };
    /** @hidden */
    CheckboxGroup.prototype._setSelectorButtonColor = function (selectorNb, color) {
        this.selectors[selectorNb].children[0].color = color;
    };
    /** @hidden */
    CheckboxGroup.prototype._setSelectorButtonBackground = function (selectorNb, color) {
        this.selectors[selectorNb].children[0].background = color;
    };
    return CheckboxGroup;
}(SelectorGroup));

/** Class used to create a RadioGroup
 * which contains groups of radio buttons
*/
var RadioGroup = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(RadioGroup, _super);
    function RadioGroup() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._selectNb = 0;
        return _this;
    }
    /** Adds a radio button as a control
     * @param label is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    RadioGroup.prototype.addRadio = function (label, func, checked) {
        if (func === void 0) { func = function (n) { }; }
        if (checked === void 0) { checked = false; }
        var nb = this._selectNb++;
        var button = new _radioButton__WEBPACK_IMPORTED_MODULE_6__["RadioButton"]();
        button.name = label;
        button.width = "20px";
        button.height = "20px";
        button.color = "#364249";
        button.background = "#CCCCCC";
        button.group = this.name;
        button.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        button.onIsCheckedChangedObservable.add(function (state) {
            if (state) {
                func(nb);
            }
        });
        var _selector = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].AddHeader(button, label, "200px", { isHorizontal: true, controlFirst: true });
        _selector.height = "30px";
        _selector.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        _selector.left = "4px";
        this.groupPanel.addControl(_selector);
        this.selectors.push(_selector);
        button.isChecked = checked;
        if (this.groupPanel.parent && this.groupPanel.parent.parent) {
            button.color = this.groupPanel.parent.parent.buttonColor;
            button.background = this.groupPanel.parent.parent.buttonBackground;
        }
    };
    /** @hidden */
    RadioGroup.prototype._setSelectorLabel = function (selectorNb, label) {
        this.selectors[selectorNb].children[1].text = label;
    };
    /** @hidden */
    RadioGroup.prototype._setSelectorLabelColor = function (selectorNb, color) {
        this.selectors[selectorNb].children[1].color = color;
    };
    /** @hidden */
    RadioGroup.prototype._setSelectorButtonColor = function (selectorNb, color) {
        this.selectors[selectorNb].children[0].color = color;
    };
    /** @hidden */
    RadioGroup.prototype._setSelectorButtonBackground = function (selectorNb, color) {
        this.selectors[selectorNb].children[0].background = color;
    };
    return RadioGroup;
}(SelectorGroup));

/** Class used to create a SliderGroup
 * which contains groups of slider buttons
*/
var SliderGroup = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(SliderGroup, _super);
    function SliderGroup() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Adds a slider to the SelectorGroup
     * @param label is the label for the SliderBar
     * @param func is the function called when the Slider moves
     * @param unit is a string describing the units used, eg degrees or metres
     * @param min is the minimum value for the Slider
     * @param max is the maximum value for the Slider
     * @param value is the start value for the Slider between min and max
     * @param onValueChange is the function used to format the value displayed, eg radians to degrees
     */
    SliderGroup.prototype.addSlider = function (label, func, unit, min, max, value, onValueChange) {
        if (func === void 0) { func = function (v) { }; }
        if (unit === void 0) { unit = "Units"; }
        if (min === void 0) { min = 0; }
        if (max === void 0) { max = 0; }
        if (value === void 0) { value = 0; }
        if (onValueChange === void 0) { onValueChange = function (v) { return v | 0; }; }
        var button = new _sliders_slider__WEBPACK_IMPORTED_MODULE_7__["Slider"]();
        button.name = unit;
        button.value = value;
        button.minimum = min;
        button.maximum = max;
        button.width = 0.9;
        button.height = "20px";
        button.color = "#364249";
        button.background = "#CCCCCC";
        button.borderColor = "black";
        button.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        button.left = "4px";
        button.paddingBottom = "4px";
        button.onValueChangedObservable.add(function (value) {
            button.parent.children[0].text = button.parent.children[0].name + ": " + onValueChange(value) + " " + button.name;
            func(value);
        });
        var _selector = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].AddHeader(button, label + ": " + onValueChange(value) + " " + unit, "30px", { isHorizontal: false, controlFirst: false });
        _selector.height = "60px";
        _selector.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        _selector.left = "4px";
        _selector.children[0].name = label;
        this.groupPanel.addControl(_selector);
        this.selectors.push(_selector);
        if (this.groupPanel.parent && this.groupPanel.parent.parent) {
            button.color = this.groupPanel.parent.parent.buttonColor;
            button.background = this.groupPanel.parent.parent.buttonBackground;
        }
    };
    /** @hidden */
    SliderGroup.prototype._setSelectorLabel = function (selectorNb, label) {
        this.selectors[selectorNb].children[0].name = label;
        this.selectors[selectorNb].children[0].text = label + ": " + this.selectors[selectorNb].children[1].value + " " + this.selectors[selectorNb].children[1].name;
    };
    /** @hidden */
    SliderGroup.prototype._setSelectorLabelColor = function (selectorNb, color) {
        this.selectors[selectorNb].children[0].color = color;
    };
    /** @hidden */
    SliderGroup.prototype._setSelectorButtonColor = function (selectorNb, color) {
        this.selectors[selectorNb].children[1].color = color;
    };
    /** @hidden */
    SliderGroup.prototype._setSelectorButtonBackground = function (selectorNb, color) {
        this.selectors[selectorNb].children[1].background = color;
    };
    return SliderGroup;
}(SelectorGroup));

/** Class used to hold the controls for the checkboxes, radio buttons and sliders
 * @see https://doc.babylonjs.com/how_to/selector
*/
var SelectionPanel = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(SelectionPanel, _super);
    /**
    * Creates a new SelectionPanel
    * @param name of SelectionPanel
    * @param groups is an array of SelectionGroups
    */
    function SelectionPanel(
    /** name of SelectionPanel */
    name, 
    /** an array of SelectionGroups */
    groups) {
        if (groups === void 0) { groups = []; }
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this.groups = groups;
        _this._buttonColor = "#364249";
        _this._buttonBackground = "#CCCCCC";
        _this._headerColor = "black";
        _this._barColor = "white";
        _this._barHeight = "2px";
        _this._spacerHeight = "20px";
        _this._bars = new Array();
        _this._groups = groups;
        _this.thickness = 2;
        _this._panel = new _stackPanel__WEBPACK_IMPORTED_MODULE_2__["StackPanel"]();
        _this._panel.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_TOP;
        _this._panel.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        _this._panel.top = 5;
        _this._panel.left = 5;
        _this._panel.width = 0.95;
        if (groups.length > 0) {
            for (var i = 0; i < groups.length - 1; i++) {
                _this._panel.addControl(groups[i].groupPanel);
                _this._addSpacer();
            }
            _this._panel.addControl(groups[groups.length - 1].groupPanel);
        }
        _this.addControl(_this._panel);
        return _this;
    }
    SelectionPanel.prototype._getTypeName = function () {
        return "SelectionPanel";
    };
    Object.defineProperty(SelectionPanel.prototype, "headerColor", {
        /** Gets or sets the headerColor */
        get: function () {
            return this._headerColor;
        },
        set: function (color) {
            if (this._headerColor === color) {
                return;
            }
            this._headerColor = color;
            this._setHeaderColor();
        },
        enumerable: false,
        configurable: true
    });
    SelectionPanel.prototype._setHeaderColor = function () {
        for (var i = 0; i < this._groups.length; i++) {
            this._groups[i].groupPanel.children[0].color = this._headerColor;
        }
    };
    Object.defineProperty(SelectionPanel.prototype, "buttonColor", {
        /** Gets or sets the button color */
        get: function () {
            return this._buttonColor;
        },
        set: function (color) {
            if (this._buttonColor === color) {
                return;
            }
            this._buttonColor = color;
            this._setbuttonColor();
        },
        enumerable: false,
        configurable: true
    });
    SelectionPanel.prototype._setbuttonColor = function () {
        for (var i = 0; i < this._groups.length; i++) {
            for (var j = 0; j < this._groups[i].selectors.length; j++) {
                this._groups[i]._setSelectorButtonColor(j, this._buttonColor);
            }
        }
    };
    Object.defineProperty(SelectionPanel.prototype, "labelColor", {
        /** Gets or sets the label color */
        get: function () {
            return this._labelColor;
        },
        set: function (color) {
            if (this._labelColor === color) {
                return;
            }
            this._labelColor = color;
            this._setLabelColor();
        },
        enumerable: false,
        configurable: true
    });
    SelectionPanel.prototype._setLabelColor = function () {
        for (var i = 0; i < this._groups.length; i++) {
            for (var j = 0; j < this._groups[i].selectors.length; j++) {
                this._groups[i]._setSelectorLabelColor(j, this._labelColor);
            }
        }
    };
    Object.defineProperty(SelectionPanel.prototype, "buttonBackground", {
        /** Gets or sets the button background */
        get: function () {
            return this._buttonBackground;
        },
        set: function (color) {
            if (this._buttonBackground === color) {
                return;
            }
            this._buttonBackground = color;
            this._setButtonBackground();
        },
        enumerable: false,
        configurable: true
    });
    SelectionPanel.prototype._setButtonBackground = function () {
        for (var i = 0; i < this._groups.length; i++) {
            for (var j = 0; j < this._groups[i].selectors.length; j++) {
                this._groups[i]._setSelectorButtonBackground(j, this._buttonBackground);
            }
        }
    };
    Object.defineProperty(SelectionPanel.prototype, "barColor", {
        /** Gets or sets the color of separator bar */
        get: function () {
            return this._barColor;
        },
        set: function (color) {
            if (this._barColor === color) {
                return;
            }
            this._barColor = color;
            this._setBarColor();
        },
        enumerable: false,
        configurable: true
    });
    SelectionPanel.prototype._setBarColor = function () {
        for (var i = 0; i < this._bars.length; i++) {
            this._bars[i].children[0].background = this._barColor;
        }
    };
    Object.defineProperty(SelectionPanel.prototype, "barHeight", {
        /** Gets or sets the height of separator bar */
        get: function () {
            return this._barHeight;
        },
        set: function (value) {
            if (this._barHeight === value) {
                return;
            }
            this._barHeight = value;
            this._setBarHeight();
        },
        enumerable: false,
        configurable: true
    });
    SelectionPanel.prototype._setBarHeight = function () {
        for (var i = 0; i < this._bars.length; i++) {
            this._bars[i].children[0].height = this._barHeight;
        }
    };
    Object.defineProperty(SelectionPanel.prototype, "spacerHeight", {
        /** Gets or sets the height of spacers*/
        get: function () {
            return this._spacerHeight;
        },
        set: function (value) {
            if (this._spacerHeight === value) {
                return;
            }
            this._spacerHeight = value;
            this._setSpacerHeight();
        },
        enumerable: false,
        configurable: true
    });
    SelectionPanel.prototype._setSpacerHeight = function () {
        for (var i = 0; i < this._bars.length; i++) {
            this._bars[i].height = this._spacerHeight;
        }
    };
    /** Adds a bar between groups */
    SelectionPanel.prototype._addSpacer = function () {
        var separator = new _container__WEBPACK_IMPORTED_MODULE_8__["Container"]();
        separator.width = 1;
        separator.height = this._spacerHeight;
        separator.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        var bar = new _rectangle__WEBPACK_IMPORTED_MODULE_1__["Rectangle"]();
        bar.width = 1;
        bar.height = this._barHeight;
        bar.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
        bar.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_CENTER;
        bar.background = this._barColor;
        bar.color = "transparent";
        separator.addControl(bar);
        this._panel.addControl(separator);
        this._bars.push(separator);
    };
    /** Add a group to the selection panel
     * @param group is the selector group to add
     */
    SelectionPanel.prototype.addGroup = function (group) {
        if (this._groups.length > 0) {
            this._addSpacer();
        }
        this._panel.addControl(group.groupPanel);
        this._groups.push(group);
        group.groupPanel.children[0].color = this._headerColor;
        for (var j = 0; j < group.selectors.length; j++) {
            group._setSelectorButtonColor(j, this._buttonColor);
            group._setSelectorButtonBackground(j, this._buttonBackground);
        }
    };
    /** Remove the group from the given position
     * @param groupNb is the position of the group in the list
     */
    SelectionPanel.prototype.removeGroup = function (groupNb) {
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        this._panel.removeControl(group.groupPanel);
        this._groups.splice(groupNb, 1);
        if (groupNb < this._bars.length) {
            this._panel.removeControl(this._bars[groupNb]);
            this._bars.splice(groupNb, 1);
        }
    };
    /** Change a group header label
     * @param label is the new group header label
     * @param groupNb is the number of the group to relabel
     * */
    SelectionPanel.prototype.setHeaderName = function (label, groupNb) {
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        group.groupPanel.children[0].text = label;
    };
    /** Change selector label to the one given
     * @param label is the new selector label
     * @param groupNb is the number of the groupcontaining the selector
     * @param selectorNb is the number of the selector within a group to relabel
     * */
    SelectionPanel.prototype.relabel = function (label, groupNb, selectorNb) {
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        if (selectorNb < 0 || selectorNb >= group.selectors.length) {
            return;
        }
        group._setSelectorLabel(selectorNb, label);
    };
    /** For a given group position remove the selector at the given position
     * @param groupNb is the number of the group to remove the selector from
     * @param selectorNb is the number of the selector within the group
     */
    SelectionPanel.prototype.removeFromGroupSelector = function (groupNb, selectorNb) {
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        if (selectorNb < 0 || selectorNb >= group.selectors.length) {
            return;
        }
        group.removeSelector(selectorNb);
    };
    /** For a given group position of correct type add a checkbox button
     * @param groupNb is the number of the group to remove the selector from
     * @param label is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    SelectionPanel.prototype.addToGroupCheckbox = function (groupNb, label, func, checked) {
        if (func === void 0) { func = function () { }; }
        if (checked === void 0) { checked = false; }
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        group.addCheckbox(label, func, checked);
    };
    /** For a given group position of correct type add a radio button
     * @param groupNb is the number of the group to remove the selector from
     * @param label is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    SelectionPanel.prototype.addToGroupRadio = function (groupNb, label, func, checked) {
        if (func === void 0) { func = function () { }; }
        if (checked === void 0) { checked = false; }
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        group.addRadio(label, func, checked);
    };
    /**
     * For a given slider group add a slider
     * @param groupNb is the number of the group to add the slider to
     * @param label is the label for the Slider
     * @param func is the function called when the Slider moves
     * @param unit is a string describing the units used, eg degrees or metres
     * @param min is the minimum value for the Slider
     * @param max is the maximum value for the Slider
     * @param value is the start value for the Slider between min and max
     * @param onVal is the function used to format the value displayed, eg radians to degrees
     */
    SelectionPanel.prototype.addToGroupSlider = function (groupNb, label, func, unit, min, max, value, onVal) {
        if (func === void 0) { func = function () { }; }
        if (unit === void 0) { unit = "Units"; }
        if (min === void 0) { min = 0; }
        if (max === void 0) { max = 0; }
        if (value === void 0) { value = 0; }
        if (onVal === void 0) { onVal = function (v) { return v | 0; }; }
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        group.addSlider(label, func, unit, min, max, value, onVal);
    };
    return SelectionPanel;
}(_rectangle__WEBPACK_IMPORTED_MODULE_1__["Rectangle"]));



/***/ }),

/***/ "./2D/controls/sliders/baseSlider.ts":
/*!*******************************************!*\
  !*** ./2D/controls/sliders/baseSlider.ts ***!
  \*******************************************/
/*! exports provided: BaseSlider */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BaseSlider", function() { return BaseSlider; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../control */ "./2D/controls/control.ts");
/* harmony import */ var _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../valueAndUnit */ "./2D/valueAndUnit.ts");




/**
 * Class used to create slider controls
 */
var BaseSlider = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(BaseSlider, _super);
    /**
     * Creates a new BaseSlider
     * @param name defines the control name
     */
    function BaseSlider(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._thumbWidth = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"](20, _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"].UNITMODE_PIXEL, false);
        _this._minimum = 0;
        _this._maximum = 100;
        _this._value = 50;
        _this._isVertical = false;
        _this._barOffset = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"](5, _valueAndUnit__WEBPACK_IMPORTED_MODULE_3__["ValueAndUnit"].UNITMODE_PIXEL, false);
        _this._isThumbClamped = false;
        _this._displayThumb = true;
        _this._step = 0;
        _this._lastPointerDownID = -1;
        // Shared rendering info
        _this._effectiveBarOffset = 0;
        /** Observable raised when the sldier value changes */
        _this.onValueChangedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        // Events
        _this._pointerIsDown = false;
        _this.isPointerBlocker = true;
        return _this;
    }
    Object.defineProperty(BaseSlider.prototype, "displayThumb", {
        /** Gets or sets a boolean indicating if the thumb must be rendered */
        get: function () {
            return this._displayThumb;
        },
        set: function (value) {
            if (this._displayThumb === value) {
                return;
            }
            this._displayThumb = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSlider.prototype, "step", {
        /** Gets or sets a step to apply to values (0 by default) */
        get: function () {
            return this._step;
        },
        set: function (value) {
            if (this._step === value) {
                return;
            }
            this._step = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSlider.prototype, "barOffset", {
        /** Gets or sets main bar offset (ie. the margin applied to the value bar) */
        get: function () {
            return this._barOffset.toString(this._host);
        },
        set: function (value) {
            if (this._barOffset.toString(this._host) === value) {
                return;
            }
            if (this._barOffset.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSlider.prototype, "barOffsetInPixels", {
        /** Gets main bar offset in pixels*/
        get: function () {
            return this._barOffset.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSlider.prototype, "thumbWidth", {
        /** Gets or sets thumb width */
        get: function () {
            return this._thumbWidth.toString(this._host);
        },
        set: function (value) {
            if (this._thumbWidth.toString(this._host) === value) {
                return;
            }
            if (this._thumbWidth.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSlider.prototype, "thumbWidthInPixels", {
        /** Gets thumb width in pixels */
        get: function () {
            return this._thumbWidth.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSlider.prototype, "minimum", {
        /** Gets or sets minimum value */
        get: function () {
            return this._minimum;
        },
        set: function (value) {
            if (this._minimum === value) {
                return;
            }
            this._minimum = value;
            this._markAsDirty();
            this.value = Math.max(Math.min(this.value, this._maximum), this._minimum);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSlider.prototype, "maximum", {
        /** Gets or sets maximum value */
        get: function () {
            return this._maximum;
        },
        set: function (value) {
            if (this._maximum === value) {
                return;
            }
            this._maximum = value;
            this._markAsDirty();
            this.value = Math.max(Math.min(this.value, this._maximum), this._minimum);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSlider.prototype, "value", {
        /** Gets or sets current value */
        get: function () {
            return this._value;
        },
        set: function (value) {
            value = Math.max(Math.min(value, this._maximum), this._minimum);
            if (this._value === value) {
                return;
            }
            this._value = value;
            this._markAsDirty();
            this.onValueChangedObservable.notifyObservers(this._value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSlider.prototype, "isVertical", {
        /**Gets or sets a boolean indicating if the slider should be vertical or horizontal */
        get: function () {
            return this._isVertical;
        },
        set: function (value) {
            if (this._isVertical === value) {
                return;
            }
            this._isVertical = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseSlider.prototype, "isThumbClamped", {
        /** Gets or sets a value indicating if the thumb can go over main bar extends */
        get: function () {
            return this._isThumbClamped;
        },
        set: function (value) {
            if (this._isThumbClamped === value) {
                return;
            }
            this._isThumbClamped = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    BaseSlider.prototype._getTypeName = function () {
        return "BaseSlider";
    };
    BaseSlider.prototype._getThumbPosition = function () {
        if (this.isVertical) {
            return ((this.maximum - this.value) / (this.maximum - this.minimum)) * this._backgroundBoxLength;
        }
        return ((this.value - this.minimum) / (this.maximum - this.minimum)) * this._backgroundBoxLength;
    };
    BaseSlider.prototype._getThumbThickness = function (type) {
        var thumbThickness = 0;
        switch (type) {
            case "circle":
                if (this._thumbWidth.isPixel) {
                    thumbThickness = Math.max(this._thumbWidth.getValue(this._host), this._backgroundBoxThickness);
                }
                else {
                    thumbThickness = this._backgroundBoxThickness * this._thumbWidth.getValue(this._host);
                }
                break;
            case "rectangle":
                if (this._thumbWidth.isPixel) {
                    thumbThickness = Math.min(this._thumbWidth.getValue(this._host), this._backgroundBoxThickness);
                }
                else {
                    thumbThickness = this._backgroundBoxThickness * this._thumbWidth.getValue(this._host);
                }
        }
        return thumbThickness;
    };
    BaseSlider.prototype._prepareRenderingData = function (type) {
        // Main bar
        this._effectiveBarOffset = 0;
        this._renderLeft = this._currentMeasure.left;
        this._renderTop = this._currentMeasure.top;
        this._renderWidth = this._currentMeasure.width;
        this._renderHeight = this._currentMeasure.height;
        this._backgroundBoxLength = Math.max(this._currentMeasure.width, this._currentMeasure.height);
        this._backgroundBoxThickness = Math.min(this._currentMeasure.width, this._currentMeasure.height);
        this._effectiveThumbThickness = this._getThumbThickness(type);
        if (this.displayThumb) {
            this._backgroundBoxLength -= this._effectiveThumbThickness;
        }
        //throw error when height is less than width for vertical slider
        if ((this.isVertical && this._currentMeasure.height < this._currentMeasure.width)) {
            console.error("Height should be greater than width");
            return;
        }
        if (this._barOffset.isPixel) {
            this._effectiveBarOffset = Math.min(this._barOffset.getValue(this._host), this._backgroundBoxThickness);
        }
        else {
            this._effectiveBarOffset = this._backgroundBoxThickness * this._barOffset.getValue(this._host);
        }
        this._backgroundBoxThickness -= (this._effectiveBarOffset * 2);
        if (this.isVertical) {
            this._renderLeft += this._effectiveBarOffset;
            if (!this.isThumbClamped && this.displayThumb) {
                this._renderTop += (this._effectiveThumbThickness / 2);
            }
            this._renderHeight = this._backgroundBoxLength;
            this._renderWidth = this._backgroundBoxThickness;
        }
        else {
            this._renderTop += this._effectiveBarOffset;
            if (!this.isThumbClamped && this.displayThumb) {
                this._renderLeft += (this._effectiveThumbThickness / 2);
            }
            this._renderHeight = this._backgroundBoxThickness;
            this._renderWidth = this._backgroundBoxLength;
        }
    };
    /** @hidden */
    BaseSlider.prototype._updateValueFromPointer = function (x, y) {
        if (this.rotation != 0) {
            this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);
            x = this._transformedPosition.x;
            y = this._transformedPosition.y;
        }
        var value;
        if (this._isVertical) {
            value = this._minimum + (1 - ((y - this._currentMeasure.top) / this._currentMeasure.height)) * (this._maximum - this._minimum);
        }
        else {
            value = this._minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this._maximum - this._minimum);
        }
        var mult = (1 / this._step) | 0;
        this.value = this._step ? ((value * mult) | 0) / mult : value;
    };
    BaseSlider.prototype._onPointerDown = function (target, coordinates, pointerId, buttonIndex) {
        if (!_super.prototype._onPointerDown.call(this, target, coordinates, pointerId, buttonIndex)) {
            return false;
        }
        this._pointerIsDown = true;
        this._updateValueFromPointer(coordinates.x, coordinates.y);
        this._host._capturingControl[pointerId] = this;
        this._lastPointerDownID = pointerId;
        return true;
    };
    BaseSlider.prototype._onPointerMove = function (target, coordinates, pointerId) {
        // Only listen to pointer move events coming from the last pointer to click on the element (To support dual vr controller interaction)
        if (pointerId != this._lastPointerDownID) {
            return;
        }
        if (this._pointerIsDown) {
            this._updateValueFromPointer(coordinates.x, coordinates.y);
        }
        _super.prototype._onPointerMove.call(this, target, coordinates, pointerId);
    };
    BaseSlider.prototype._onPointerUp = function (target, coordinates, pointerId, buttonIndex, notifyClick) {
        this._pointerIsDown = false;
        delete this._host._capturingControl[pointerId];
        _super.prototype._onPointerUp.call(this, target, coordinates, pointerId, buttonIndex, notifyClick);
    };
    BaseSlider.prototype._onCanvasBlur = function () {
        this._forcePointerUp();
        _super.prototype._onCanvasBlur.call(this);
    };
    return BaseSlider;
}(_control__WEBPACK_IMPORTED_MODULE_2__["Control"]));



/***/ }),

/***/ "./2D/controls/sliders/imageBasedSlider.ts":
/*!*************************************************!*\
  !*** ./2D/controls/sliders/imageBasedSlider.ts ***!
  \*************************************************/
/*! exports provided: ImageBasedSlider */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ImageBasedSlider", function() { return ImageBasedSlider; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _baseSlider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./baseSlider */ "./2D/controls/sliders/baseSlider.ts");
/* harmony import */ var _measure__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../measure */ "./2D/measure.ts");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! babylonjs/Misc/typeStore */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_3__);




/**
 * Class used to create slider controls based on images
 */
var ImageBasedSlider = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(ImageBasedSlider, _super);
    /**
     * Creates a new ImageBasedSlider
     * @param name defines the control name
     */
    function ImageBasedSlider(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._tempMeasure = new _measure__WEBPACK_IMPORTED_MODULE_2__["Measure"](0, 0, 0, 0);
        return _this;
    }
    Object.defineProperty(ImageBasedSlider.prototype, "displayThumb", {
        get: function () {
            return this._displayThumb && this.thumbImage != null;
        },
        set: function (value) {
            if (this._displayThumb === value) {
                return;
            }
            this._displayThumb = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ImageBasedSlider.prototype, "backgroundImage", {
        /**
         * Gets or sets the image used to render the background
         */
        get: function () {
            return this._backgroundImage;
        },
        set: function (value) {
            var _this = this;
            if (this._backgroundImage === value) {
                return;
            }
            this._backgroundImage = value;
            if (value && !value.isLoaded) {
                value.onImageLoadedObservable.addOnce(function () { return _this._markAsDirty(); });
            }
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ImageBasedSlider.prototype, "valueBarImage", {
        /**
         * Gets or sets the image used to render the value bar
         */
        get: function () {
            return this._valueBarImage;
        },
        set: function (value) {
            var _this = this;
            if (this._valueBarImage === value) {
                return;
            }
            this._valueBarImage = value;
            if (value && !value.isLoaded) {
                value.onImageLoadedObservable.addOnce(function () { return _this._markAsDirty(); });
            }
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ImageBasedSlider.prototype, "thumbImage", {
        /**
         * Gets or sets the image used to render the thumb
         */
        get: function () {
            return this._thumbImage;
        },
        set: function (value) {
            var _this = this;
            if (this._thumbImage === value) {
                return;
            }
            this._thumbImage = value;
            if (value && !value.isLoaded) {
                value.onImageLoadedObservable.addOnce(function () { return _this._markAsDirty(); });
            }
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    ImageBasedSlider.prototype._getTypeName = function () {
        return "ImageBasedSlider";
    };
    ImageBasedSlider.prototype._draw = function (context, invalidatedRectangle) {
        context.save();
        this._applyStates(context);
        this._prepareRenderingData("rectangle");
        var thumbPosition = this._getThumbPosition();
        var left = this._renderLeft;
        var top = this._renderTop;
        var width = this._renderWidth;
        var height = this._renderHeight;
        // Background
        if (this._backgroundImage) {
            this._tempMeasure.copyFromFloats(left, top, width, height);
            if (this.isThumbClamped && this.displayThumb) {
                if (this.isVertical) {
                    this._tempMeasure.height += this._effectiveThumbThickness;
                }
                else {
                    this._tempMeasure.width += this._effectiveThumbThickness;
                }
            }
            this._backgroundImage._currentMeasure.copyFrom(this._tempMeasure);
            this._backgroundImage._draw(context);
        }
        // Bar
        if (this._valueBarImage) {
            if (this.isVertical) {
                if (this.isThumbClamped && this.displayThumb) {
                    this._tempMeasure.copyFromFloats(left, top + thumbPosition, width, height - thumbPosition + this._effectiveThumbThickness);
                }
                else {
                    this._tempMeasure.copyFromFloats(left, top + thumbPosition, width, height - thumbPosition);
                }
            }
            else {
                if (this.isThumbClamped && this.displayThumb) {
                    this._tempMeasure.copyFromFloats(left, top, thumbPosition + this._effectiveThumbThickness / 2, height);
                }
                else {
                    this._tempMeasure.copyFromFloats(left, top, thumbPosition, height);
                }
            }
            this._valueBarImage._currentMeasure.copyFrom(this._tempMeasure);
            this._valueBarImage._draw(context);
        }
        // Thumb
        if (this.displayThumb) {
            if (this.isVertical) {
                this._tempMeasure.copyFromFloats(left - this._effectiveBarOffset, this._currentMeasure.top + thumbPosition, this._currentMeasure.width, this._effectiveThumbThickness);
            }
            else {
                this._tempMeasure.copyFromFloats(this._currentMeasure.left + thumbPosition, this._currentMeasure.top, this._effectiveThumbThickness, this._currentMeasure.height);
            }
            this._thumbImage._currentMeasure.copyFrom(this._tempMeasure);
            this._thumbImage._draw(context);
        }
        context.restore();
    };
    return ImageBasedSlider;
}(_baseSlider__WEBPACK_IMPORTED_MODULE_1__["BaseSlider"]));

babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_3__["_TypeStore"].RegisteredTypes["BABYLON.GUI.ImageBasedSlider"] = ImageBasedSlider;


/***/ }),

/***/ "./2D/controls/sliders/imageScrollBar.ts":
/*!***********************************************!*\
  !*** ./2D/controls/sliders/imageScrollBar.ts ***!
  \***********************************************/
/*! exports provided: ImageScrollBar */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ImageScrollBar", function() { return ImageScrollBar; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _baseSlider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./baseSlider */ "./2D/controls/sliders/baseSlider.ts");
/* harmony import */ var _measure__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../measure */ "./2D/measure.ts");



/**
 * Class used to create slider controls
 */
var ImageScrollBar = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(ImageScrollBar, _super);
    /**
     * Creates a new ImageScrollBar
     * @param name defines the control name
     */
    function ImageScrollBar(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._thumbLength = 0.5;
        _this._thumbHeight = 1;
        _this._barImageHeight = 1;
        _this._tempMeasure = new _measure__WEBPACK_IMPORTED_MODULE_2__["Measure"](0, 0, 0, 0);
        /** Number of 90° rotation to apply on the images when in vertical mode */
        _this.num90RotationInVerticalMode = 1;
        return _this;
    }
    Object.defineProperty(ImageScrollBar.prototype, "backgroundImage", {
        /**
         * Gets or sets the image used to render the background for horizontal bar
         */
        get: function () {
            return this._backgroundBaseImage;
        },
        set: function (value) {
            var _this = this;
            if (this._backgroundBaseImage === value) {
                return;
            }
            this._backgroundBaseImage = value;
            if (this.isVertical && this.num90RotationInVerticalMode !== 0) {
                if (!value.isLoaded) {
                    value.onImageLoadedObservable.addOnce(function () {
                        var rotatedValue = value._rotate90(_this.num90RotationInVerticalMode, true);
                        _this._backgroundImage = rotatedValue;
                        if (!rotatedValue.isLoaded) {
                            rotatedValue.onImageLoadedObservable.addOnce(function () {
                                _this._markAsDirty();
                            });
                        }
                        _this._markAsDirty();
                    });
                }
                else {
                    this._backgroundImage = value._rotate90(this.num90RotationInVerticalMode, true);
                    this._markAsDirty();
                }
            }
            else {
                this._backgroundImage = value;
                if (value && !value.isLoaded) {
                    value.onImageLoadedObservable.addOnce(function () {
                        _this._markAsDirty();
                    });
                }
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ImageScrollBar.prototype, "thumbImage", {
        /**
         * Gets or sets the image used to render the thumb
         */
        get: function () {
            return this._thumbBaseImage;
        },
        set: function (value) {
            var _this = this;
            if (this._thumbBaseImage === value) {
                return;
            }
            this._thumbBaseImage = value;
            if (this.isVertical && this.num90RotationInVerticalMode !== 0) {
                if (!value.isLoaded) {
                    value.onImageLoadedObservable.addOnce(function () {
                        var rotatedValue = value._rotate90(-_this.num90RotationInVerticalMode, true);
                        _this._thumbImage = rotatedValue;
                        if (!rotatedValue.isLoaded) {
                            rotatedValue.onImageLoadedObservable.addOnce(function () {
                                _this._markAsDirty();
                            });
                        }
                        _this._markAsDirty();
                    });
                }
                else {
                    this._thumbImage = value._rotate90(-this.num90RotationInVerticalMode, true);
                    this._markAsDirty();
                }
            }
            else {
                this._thumbImage = value;
                if (value && !value.isLoaded) {
                    value.onImageLoadedObservable.addOnce(function () {
                        _this._markAsDirty();
                    });
                }
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ImageScrollBar.prototype, "thumbLength", {
        /**
         * Gets or sets the length of the thumb
         */
        get: function () {
            return this._thumbLength;
        },
        set: function (value) {
            if (this._thumbLength === value) {
                return;
            }
            this._thumbLength = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ImageScrollBar.prototype, "thumbHeight", {
        /**
         * Gets or sets the height of the thumb
         */
        get: function () {
            return this._thumbHeight;
        },
        set: function (value) {
            if (this._thumbLength === value) {
                return;
            }
            this._thumbHeight = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ImageScrollBar.prototype, "barImageHeight", {
        /**
         * Gets or sets the height of the bar image
         */
        get: function () {
            return this._barImageHeight;
        },
        set: function (value) {
            if (this._barImageHeight === value) {
                return;
            }
            this._barImageHeight = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    ImageScrollBar.prototype._getTypeName = function () {
        return "ImageScrollBar";
    };
    ImageScrollBar.prototype._getThumbThickness = function () {
        var thumbThickness = 0;
        if (this._thumbWidth.isPixel) {
            thumbThickness = this._thumbWidth.getValue(this._host);
        }
        else {
            thumbThickness = this._backgroundBoxThickness * this._thumbWidth.getValue(this._host);
        }
        return thumbThickness;
    };
    ImageScrollBar.prototype._draw = function (context) {
        context.save();
        this._applyStates(context);
        this._prepareRenderingData("rectangle");
        var thumbPosition = this._getThumbPosition();
        var left = this._renderLeft;
        var top = this._renderTop;
        var width = this._renderWidth;
        var height = this._renderHeight;
        // Background
        if (this._backgroundImage) {
            this._tempMeasure.copyFromFloats(left, top, width, height);
            if (this.isVertical) {
                this._tempMeasure.copyFromFloats(left + width * (1 - this._barImageHeight) * 0.5, this._currentMeasure.top, width * this._barImageHeight, height);
                this._tempMeasure.height += this._effectiveThumbThickness;
                this._backgroundImage._currentMeasure.copyFrom(this._tempMeasure);
            }
            else {
                this._tempMeasure.copyFromFloats(this._currentMeasure.left, top + height * (1 - this._barImageHeight) * 0.5, width, height * this._barImageHeight);
                this._tempMeasure.width += this._effectiveThumbThickness;
                this._backgroundImage._currentMeasure.copyFrom(this._tempMeasure);
            }
            this._backgroundImage._draw(context);
        }
        // Thumb
        if (this.isVertical) {
            this._tempMeasure.copyFromFloats(left - this._effectiveBarOffset + this._currentMeasure.width * (1 - this._thumbHeight) * 0.5, this._currentMeasure.top + thumbPosition, this._currentMeasure.width * this._thumbHeight, this._effectiveThumbThickness);
        }
        else {
            this._tempMeasure.copyFromFloats(this._currentMeasure.left + thumbPosition, this._currentMeasure.top + this._currentMeasure.height * (1 - this._thumbHeight) * 0.5, this._effectiveThumbThickness, this._currentMeasure.height * this._thumbHeight);
        }
        if (this._thumbImage) {
            this._thumbImage._currentMeasure.copyFrom(this._tempMeasure);
            this._thumbImage._draw(context);
        }
        context.restore();
    };
    /** @hidden */
    ImageScrollBar.prototype._updateValueFromPointer = function (x, y) {
        if (this.rotation != 0) {
            this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);
            x = this._transformedPosition.x;
            y = this._transformedPosition.y;
        }
        if (this._first) {
            this._first = false;
            this._originX = x;
            this._originY = y;
            // Check if move is required
            if (x < this._tempMeasure.left || x > this._tempMeasure.left + this._tempMeasure.width || y < this._tempMeasure.top || y > this._tempMeasure.top + this._tempMeasure.height) {
                if (this.isVertical) {
                    this.value = this.minimum + (1 - ((y - this._currentMeasure.top) / this._currentMeasure.height)) * (this.maximum - this.minimum);
                }
                else {
                    this.value = this.minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this.maximum - this.minimum);
                }
            }
        }
        // Delta mode
        var delta = 0;
        if (this.isVertical) {
            delta = -((y - this._originY) / (this._currentMeasure.height - this._effectiveThumbThickness));
        }
        else {
            delta = (x - this._originX) / (this._currentMeasure.width - this._effectiveThumbThickness);
        }
        this.value += delta * (this.maximum - this.minimum);
        this._originX = x;
        this._originY = y;
    };
    ImageScrollBar.prototype._onPointerDown = function (target, coordinates, pointerId, buttonIndex) {
        this._first = true;
        return _super.prototype._onPointerDown.call(this, target, coordinates, pointerId, buttonIndex);
    };
    return ImageScrollBar;
}(_baseSlider__WEBPACK_IMPORTED_MODULE_1__["BaseSlider"]));



/***/ }),

/***/ "./2D/controls/sliders/scrollBar.ts":
/*!******************************************!*\
  !*** ./2D/controls/sliders/scrollBar.ts ***!
  \******************************************/
/*! exports provided: ScrollBar */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ScrollBar", function() { return ScrollBar; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _baseSlider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./baseSlider */ "./2D/controls/sliders/baseSlider.ts");
/* harmony import */ var _measure__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../measure */ "./2D/measure.ts");



/**
 * Class used to create slider controls
 */
var ScrollBar = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(ScrollBar, _super);
    /**
     * Creates a new Slider
     * @param name defines the control name
     */
    function ScrollBar(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._background = "black";
        _this._borderColor = "white";
        _this._tempMeasure = new _measure__WEBPACK_IMPORTED_MODULE_2__["Measure"](0, 0, 0, 0);
        return _this;
    }
    Object.defineProperty(ScrollBar.prototype, "borderColor", {
        /** Gets or sets border color */
        get: function () {
            return this._borderColor;
        },
        set: function (value) {
            if (this._borderColor === value) {
                return;
            }
            this._borderColor = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScrollBar.prototype, "background", {
        /** Gets or sets background color */
        get: function () {
            return this._background;
        },
        set: function (value) {
            if (this._background === value) {
                return;
            }
            this._background = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    ScrollBar.prototype._getTypeName = function () {
        return "Scrollbar";
    };
    ScrollBar.prototype._getThumbThickness = function () {
        var thumbThickness = 0;
        if (this._thumbWidth.isPixel) {
            thumbThickness = this._thumbWidth.getValue(this._host);
        }
        else {
            thumbThickness = this._backgroundBoxThickness * this._thumbWidth.getValue(this._host);
        }
        return thumbThickness;
    };
    ScrollBar.prototype._draw = function (context) {
        context.save();
        this._applyStates(context);
        this._prepareRenderingData("rectangle");
        var left = this._renderLeft;
        var thumbPosition = this._getThumbPosition();
        context.fillStyle = this._background;
        context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
        // Value bar
        context.fillStyle = this.color;
        // Thumb
        if (this.isVertical) {
            this._tempMeasure.left = left - this._effectiveBarOffset;
            this._tempMeasure.top = this._currentMeasure.top + thumbPosition;
            this._tempMeasure.width = this._currentMeasure.width;
            this._tempMeasure.height = this._effectiveThumbThickness;
        }
        else {
            this._tempMeasure.left = this._currentMeasure.left + thumbPosition;
            this._tempMeasure.top = this._currentMeasure.top;
            this._tempMeasure.width = this._effectiveThumbThickness;
            this._tempMeasure.height = this._currentMeasure.height;
        }
        context.fillRect(this._tempMeasure.left, this._tempMeasure.top, this._tempMeasure.width, this._tempMeasure.height);
        context.restore();
    };
    /** @hidden */
    ScrollBar.prototype._updateValueFromPointer = function (x, y) {
        if (this.rotation != 0) {
            this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);
            x = this._transformedPosition.x;
            y = this._transformedPosition.y;
        }
        if (this._first) {
            this._first = false;
            this._originX = x;
            this._originY = y;
            // Check if move is required
            if (x < this._tempMeasure.left || x > this._tempMeasure.left + this._tempMeasure.width || y < this._tempMeasure.top || y > this._tempMeasure.top + this._tempMeasure.height) {
                if (this.isVertical) {
                    this.value = this.minimum + (1 - ((y - this._currentMeasure.top) / this._currentMeasure.height)) * (this.maximum - this.minimum);
                }
                else {
                    this.value = this.minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this.maximum - this.minimum);
                }
            }
        }
        // Delta mode
        var delta = 0;
        if (this.isVertical) {
            delta = -((y - this._originY) / (this._currentMeasure.height - this._effectiveThumbThickness));
        }
        else {
            delta = (x - this._originX) / (this._currentMeasure.width - this._effectiveThumbThickness);
        }
        this.value += delta * (this.maximum - this.minimum);
        this._originX = x;
        this._originY = y;
    };
    ScrollBar.prototype._onPointerDown = function (target, coordinates, pointerId, buttonIndex) {
        this._first = true;
        return _super.prototype._onPointerDown.call(this, target, coordinates, pointerId, buttonIndex);
    };
    return ScrollBar;
}(_baseSlider__WEBPACK_IMPORTED_MODULE_1__["BaseSlider"]));



/***/ }),

/***/ "./2D/controls/sliders/slider.ts":
/*!***************************************!*\
  !*** ./2D/controls/sliders/slider.ts ***!
  \***************************************/
/*! exports provided: Slider */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Slider", function() { return Slider; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _baseSlider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./baseSlider */ "./2D/controls/sliders/baseSlider.ts");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! babylonjs/Misc/typeStore */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2__);



/**
 * Class used to create slider controls
 */
var Slider = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Slider, _super);
    /**
     * Creates a new Slider
     * @param name defines the control name
     */
    function Slider(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._background = "black";
        _this._borderColor = "white";
        _this._isThumbCircle = false;
        _this._displayValueBar = true;
        return _this;
    }
    Object.defineProperty(Slider.prototype, "displayValueBar", {
        /** Gets or sets a boolean indicating if the value bar must be rendered */
        get: function () {
            return this._displayValueBar;
        },
        set: function (value) {
            if (this._displayValueBar === value) {
                return;
            }
            this._displayValueBar = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Slider.prototype, "borderColor", {
        /** Gets or sets border color */
        get: function () {
            return this._borderColor;
        },
        set: function (value) {
            if (this._borderColor === value) {
                return;
            }
            this._borderColor = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Slider.prototype, "background", {
        /** Gets or sets background color */
        get: function () {
            return this._background;
        },
        set: function (value) {
            if (this._background === value) {
                return;
            }
            this._background = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Slider.prototype, "isThumbCircle", {
        /** Gets or sets a boolean indicating if the thumb should be round or square */
        get: function () {
            return this._isThumbCircle;
        },
        set: function (value) {
            if (this._isThumbCircle === value) {
                return;
            }
            this._isThumbCircle = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Slider.prototype._getTypeName = function () {
        return "Slider";
    };
    Slider.prototype._draw = function (context, invalidatedRectangle) {
        context.save();
        this._applyStates(context);
        this._prepareRenderingData(this.isThumbCircle ? "circle" : "rectangle");
        var left = this._renderLeft;
        var top = this._renderTop;
        var width = this._renderWidth;
        var height = this._renderHeight;
        var radius = 0;
        if (this.isThumbClamped && this.isThumbCircle) {
            if (this.isVertical) {
                top += (this._effectiveThumbThickness / 2);
            }
            else {
                left += (this._effectiveThumbThickness / 2);
            }
            radius = this._backgroundBoxThickness / 2;
        }
        else {
            radius = (this._effectiveThumbThickness - this._effectiveBarOffset) / 2;
        }
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }
        var thumbPosition = this._getThumbPosition();
        context.fillStyle = this._background;
        if (this.isVertical) {
            if (this.isThumbClamped) {
                if (this.isThumbCircle) {
                    context.beginPath();
                    context.arc(left + this._backgroundBoxThickness / 2, top, radius, Math.PI, 2 * Math.PI);
                    context.fill();
                    context.fillRect(left, top, width, height);
                }
                else {
                    context.fillRect(left, top, width, height + this._effectiveThumbThickness);
                }
            }
            else {
                context.fillRect(left, top, width, height);
            }
        }
        else {
            if (this.isThumbClamped) {
                if (this.isThumbCircle) {
                    context.beginPath();
                    context.arc(left + this._backgroundBoxLength, top + (this._backgroundBoxThickness / 2), radius, 0, 2 * Math.PI);
                    context.fill();
                    context.fillRect(left, top, width, height);
                }
                else {
                    context.fillRect(left, top, width + this._effectiveThumbThickness, height);
                }
            }
            else {
                context.fillRect(left, top, width, height);
            }
        }
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }
        // Value bar
        context.fillStyle = this.color;
        if (this._displayValueBar) {
            if (this.isVertical) {
                if (this.isThumbClamped) {
                    if (this.isThumbCircle) {
                        context.beginPath();
                        context.arc(left + this._backgroundBoxThickness / 2, top + this._backgroundBoxLength, radius, 0, 2 * Math.PI);
                        context.fill();
                        context.fillRect(left, top + thumbPosition, width, height - thumbPosition);
                    }
                    else {
                        context.fillRect(left, top + thumbPosition, width, height - thumbPosition + this._effectiveThumbThickness);
                    }
                }
                else {
                    context.fillRect(left, top + thumbPosition, width, height - thumbPosition);
                }
            }
            else {
                if (this.isThumbClamped) {
                    if (this.isThumbCircle) {
                        context.beginPath();
                        context.arc(left, top + this._backgroundBoxThickness / 2, radius, 0, 2 * Math.PI);
                        context.fill();
                        context.fillRect(left, top, thumbPosition, height);
                    }
                    else {
                        context.fillRect(left, top, thumbPosition, height);
                    }
                }
                else {
                    context.fillRect(left, top, thumbPosition, height);
                }
            }
        }
        // Thumb
        if (this.displayThumb) {
            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }
            if (this._isThumbCircle) {
                context.beginPath();
                if (this.isVertical) {
                    context.arc(left + this._backgroundBoxThickness / 2, top + thumbPosition, radius, 0, 2 * Math.PI);
                }
                else {
                    context.arc(left + thumbPosition, top + (this._backgroundBoxThickness / 2), radius, 0, 2 * Math.PI);
                }
                context.fill();
                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 0;
                    context.shadowOffsetY = 0;
                }
                context.strokeStyle = this._borderColor;
                context.stroke();
            }
            else {
                if (this.isVertical) {
                    context.fillRect(left - this._effectiveBarOffset, this._currentMeasure.top + thumbPosition, this._currentMeasure.width, this._effectiveThumbThickness);
                }
                else {
                    context.fillRect(this._currentMeasure.left + thumbPosition, this._currentMeasure.top, this._effectiveThumbThickness, this._currentMeasure.height);
                }
                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 0;
                    context.shadowOffsetY = 0;
                }
                context.strokeStyle = this._borderColor;
                if (this.isVertical) {
                    context.strokeRect(left - this._effectiveBarOffset, this._currentMeasure.top + thumbPosition, this._currentMeasure.width, this._effectiveThumbThickness);
                }
                else {
                    context.strokeRect(this._currentMeasure.left + thumbPosition, this._currentMeasure.top, this._effectiveThumbThickness, this._currentMeasure.height);
                }
            }
        }
        context.restore();
    };
    return Slider;
}(_baseSlider__WEBPACK_IMPORTED_MODULE_1__["BaseSlider"]));

babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_2__["_TypeStore"].RegisteredTypes["BABYLON.GUI.Slider"] = Slider;


/***/ }),

/***/ "./2D/controls/stackPanel.ts":
/*!***********************************!*\
  !*** ./2D/controls/stackPanel.ts ***!
  \***********************************/
/*! exports provided: StackPanel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "StackPanel", function() { return StackPanel; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/tools */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _container__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./container */ "./2D/controls/container.ts");
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");





/**
 * Class used to create a 2D stack panel container
 */
var StackPanel = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(StackPanel, _super);
    /**
     * Creates a new StackPanel
     * @param name defines control name
     */
    function StackPanel(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._isVertical = true;
        _this._manualWidth = false;
        _this._manualHeight = false;
        _this._doNotTrackManualChanges = false;
        /**
         * Gets or sets a boolean indicating that layou warnings should be ignored
         */
        _this.ignoreLayoutWarnings = false;
        return _this;
    }
    Object.defineProperty(StackPanel.prototype, "isVertical", {
        /** Gets or sets a boolean indicating if the stack panel is vertical or horizontal*/
        get: function () {
            return this._isVertical;
        },
        set: function (value) {
            if (this._isVertical === value) {
                return;
            }
            this._isVertical = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StackPanel.prototype, "width", {
        get: function () {
            return this._width.toString(this._host);
        },
        /**
         * Gets or sets panel width.
         * This value should not be set when in horizontal mode as it will be computed automatically
         */
        set: function (value) {
            if (!this._doNotTrackManualChanges) {
                this._manualWidth = true;
            }
            if (this._width.toString(this._host) === value) {
                return;
            }
            if (this._width.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StackPanel.prototype, "height", {
        get: function () {
            return this._height.toString(this._host);
        },
        /**
         * Gets or sets panel height.
         * This value should not be set when in vertical mode as it will be computed automatically
         */
        set: function (value) {
            if (!this._doNotTrackManualChanges) {
                this._manualHeight = true;
            }
            if (this._height.toString(this._host) === value) {
                return;
            }
            if (this._height.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    StackPanel.prototype._getTypeName = function () {
        return "StackPanel";
    };
    /** @hidden */
    StackPanel.prototype._preMeasure = function (parentMeasure, context) {
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (this._isVertical) {
                child.verticalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_TOP;
            }
            else {
                child.horizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
            }
        }
        _super.prototype._preMeasure.call(this, parentMeasure, context);
    };
    StackPanel.prototype._additionalProcessing = function (parentMeasure, context) {
        _super.prototype._additionalProcessing.call(this, parentMeasure, context);
        this._measureForChildren.copyFrom(parentMeasure);
        this._measureForChildren.left = this._currentMeasure.left;
        this._measureForChildren.top = this._currentMeasure.top;
        if (!this.isVertical || this._manualWidth) {
            this._measureForChildren.width = this._currentMeasure.width;
        }
        if (this.isVertical || this._manualHeight) {
            this._measureForChildren.height = this._currentMeasure.height;
        }
    };
    StackPanel.prototype._postMeasure = function () {
        var stackWidth = 0;
        var stackHeight = 0;
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (!child.isVisible || child.notRenderable) {
                continue;
            }
            if (this._isVertical) {
                if (child.top !== stackHeight + "px") {
                    child.top = stackHeight + "px";
                    this._rebuildLayout = true;
                    child._top.ignoreAdaptiveScaling = true;
                }
                if (child._height.isPercentage && !child._automaticSize) {
                    if (!this.ignoreLayoutWarnings) {
                        babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Tools"].Warn("Control (Name:" + child.name + ", UniqueId:" + child.uniqueId + ") is using height in percentage mode inside a vertical StackPanel");
                    }
                }
                else {
                    stackHeight += child._currentMeasure.height + child.paddingTopInPixels + child.paddingBottomInPixels;
                }
            }
            else {
                if (child.left !== stackWidth + "px") {
                    child.left = stackWidth + "px";
                    this._rebuildLayout = true;
                    child._left.ignoreAdaptiveScaling = true;
                }
                if (child._width.isPercentage && !child._automaticSize) {
                    if (!this.ignoreLayoutWarnings) {
                        babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Tools"].Warn("Control (Name:" + child.name + ", UniqueId:" + child.uniqueId + ") is using width in percentage mode inside a horizontal StackPanel");
                    }
                }
                else {
                    stackWidth += child._currentMeasure.width + child.paddingLeftInPixels + child.paddingRightInPixels;
                }
            }
        }
        this._doNotTrackManualChanges = true;
        // Let stack panel width or height default to stackHeight and stackWidth if dimensions are not specified.
        // User can now define their own height and width for stack panel.
        var panelWidthChanged = false;
        var panelHeightChanged = false;
        if (!this._manualHeight && this._isVertical) { // do not specify height if strictly defined by user
            var previousHeight = this.height;
            this.height = stackHeight + "px";
            panelHeightChanged = previousHeight !== this.height || !this._height.ignoreAdaptiveScaling;
        }
        if (!this._manualWidth && !this._isVertical) { // do not specify width if strictly defined by user
            var previousWidth = this.width;
            this.width = stackWidth + "px";
            panelWidthChanged = previousWidth !== this.width || !this._width.ignoreAdaptiveScaling;
        }
        if (panelHeightChanged) {
            this._height.ignoreAdaptiveScaling = true;
        }
        if (panelWidthChanged) {
            this._width.ignoreAdaptiveScaling = true;
        }
        this._doNotTrackManualChanges = false;
        if (panelWidthChanged || panelHeightChanged) {
            this._rebuildLayout = true;
        }
        _super.prototype._postMeasure.call(this);
    };
    return StackPanel;
}(_container__WEBPACK_IMPORTED_MODULE_2__["Container"]));

babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GUI.StackPanel"] = StackPanel;


/***/ }),

/***/ "./2D/controls/statics.ts":
/*!********************************!*\
  !*** ./2D/controls/statics.ts ***!
  \********************************/
/*! exports provided: name */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "name", function() { return name; });
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");
/* harmony import */ var _stackPanel__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./stackPanel */ "./2D/controls/stackPanel.ts");
/* harmony import */ var _textBlock__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./textBlock */ "./2D/controls/textBlock.ts");



/**
 * Forcing an export so that this code will execute
 * @hidden
 */
var name = "Statics";

/**
 * Creates a stack panel that can be used to render headers
 * @param control defines the control to associate with the header
 * @param text defines the text of the header
 * @param size defines the size of the header
 * @param options defines options used to configure the header
 * @returns a new StackPanel
 */
_control__WEBPACK_IMPORTED_MODULE_0__["Control"].AddHeader = function (control, text, size, options) {
    var panel = new _stackPanel__WEBPACK_IMPORTED_MODULE_1__["StackPanel"]("panel");
    var isHorizontal = options ? options.isHorizontal : true;
    var controlFirst = options ? options.controlFirst : true;
    panel.isVertical = !isHorizontal;
    var header = new _textBlock__WEBPACK_IMPORTED_MODULE_2__["TextBlock"]("header");
    header.text = text;
    header.textHorizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_0__["Control"].HORIZONTAL_ALIGNMENT_LEFT;
    if (isHorizontal) {
        header.width = size;
    }
    else {
        header.height = size;
    }
    if (controlFirst) {
        panel.addControl(control);
        panel.addControl(header);
        header.paddingLeft = "5px";
    }
    else {
        panel.addControl(header);
        panel.addControl(control);
        header.paddingRight = "5px";
    }
    header.shadowBlur = control.shadowBlur;
    header.shadowColor = control.shadowColor;
    header.shadowOffsetX = control.shadowOffsetX;
    header.shadowOffsetY = control.shadowOffsetY;
    return panel;
};


/***/ }),

/***/ "./2D/controls/textBlock.ts":
/*!**********************************!*\
  !*** ./2D/controls/textBlock.ts ***!
  \**********************************/
/*! exports provided: TextWrapping, TextBlock */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TextWrapping", function() { return TextWrapping; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TextBlock", function() { return TextBlock; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../valueAndUnit */ "./2D/valueAndUnit.ts");
/* harmony import */ var _control__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./control */ "./2D/controls/control.ts");





/**
 * Enum that determines the text-wrapping mode to use.
 */
var TextWrapping;
(function (TextWrapping) {
    /**
     * Clip the text when it's larger than Control.width; this is the default mode.
     */
    TextWrapping[TextWrapping["Clip"] = 0] = "Clip";
    /**
     * Wrap the text word-wise, i.e. try to add line-breaks at word boundary to fit within Control.width.
     */
    TextWrapping[TextWrapping["WordWrap"] = 1] = "WordWrap";
    /**
     * Ellipsize the text, i.e. shrink with trailing … when text is larger than Control.width.
     */
    TextWrapping[TextWrapping["Ellipsis"] = 2] = "Ellipsis";
})(TextWrapping || (TextWrapping = {}));
/**
 * Class used to create text block control
 */
var TextBlock = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(TextBlock, _super);
    /**
     * Creates a new TextBlock object
     * @param name defines the name of the control
     * @param text defines the text to display (emptry string by default)
     */
    function TextBlock(
    /**
     * Defines the name of the control
     */
    name, text) {
        if (text === void 0) { text = ""; }
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._text = "";
        _this._textWrapping = TextWrapping.Clip;
        _this._textHorizontalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_CENTER;
        _this._textVerticalAlignment = _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_CENTER;
        _this._resizeToFit = false;
        _this._lineSpacing = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"](0);
        _this._outlineWidth = 0;
        _this._outlineColor = "white";
        _this._underline = false;
        _this._lineThrough = false;
        /**
        * An event triggered after the text is changed
        */
        _this.onTextChangedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /**
        * An event triggered after the text was broken up into lines
        */
        _this.onLinesReadyObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        _this.text = text;
        return _this;
    }
    Object.defineProperty(TextBlock.prototype, "lines", {
        /**
         * Return the line list (you may need to use the onLinesReadyObservable to make sure the list is ready)
         */
        get: function () {
            return this._lines;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TextBlock.prototype, "resizeToFit", {
        /**
         * Gets or sets an boolean indicating that the TextBlock will be resized to fit container
         */
        get: function () {
            return this._resizeToFit;
        },
        /**
         * Gets or sets an boolean indicating that the TextBlock will be resized to fit container
         */
        set: function (value) {
            if (this._resizeToFit === value) {
                return;
            }
            this._resizeToFit = value;
            if (this._resizeToFit) {
                this._width.ignoreAdaptiveScaling = true;
                this._height.ignoreAdaptiveScaling = true;
            }
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TextBlock.prototype, "textWrapping", {
        /**
         * Gets or sets a boolean indicating if text must be wrapped
         */
        get: function () {
            return this._textWrapping;
        },
        /**
         * Gets or sets a boolean indicating if text must be wrapped
         */
        set: function (value) {
            if (this._textWrapping === value) {
                return;
            }
            this._textWrapping = +value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TextBlock.prototype, "text", {
        /**
         * Gets or sets text to display
         */
        get: function () {
            return this._text;
        },
        /**
         * Gets or sets text to display
         */
        set: function (value) {
            if (this._text === value) {
                return;
            }
            this._text = value;
            this._markAsDirty();
            this.onTextChangedObservable.notifyObservers(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TextBlock.prototype, "textHorizontalAlignment", {
        /**
         * Gets or sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default)
         */
        get: function () {
            return this._textHorizontalAlignment;
        },
        /**
         * Gets or sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default)
         */
        set: function (value) {
            if (this._textHorizontalAlignment === value) {
                return;
            }
            this._textHorizontalAlignment = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TextBlock.prototype, "textVerticalAlignment", {
        /**
         * Gets or sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default)
         */
        get: function () {
            return this._textVerticalAlignment;
        },
        /**
         * Gets or sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default)
         */
        set: function (value) {
            if (this._textVerticalAlignment === value) {
                return;
            }
            this._textVerticalAlignment = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TextBlock.prototype, "lineSpacing", {
        /**
         * Gets or sets line spacing value
         */
        get: function () {
            return this._lineSpacing.toString(this._host);
        },
        /**
         * Gets or sets line spacing value
         */
        set: function (value) {
            if (this._lineSpacing.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TextBlock.prototype, "outlineWidth", {
        /**
         * Gets or sets outlineWidth of the text to display
         */
        get: function () {
            return this._outlineWidth;
        },
        /**
         * Gets or sets outlineWidth of the text to display
         */
        set: function (value) {
            if (this._outlineWidth === value) {
                return;
            }
            this._outlineWidth = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TextBlock.prototype, "underline", {
        /**
         * Gets or sets a boolean indicating that text must have underline
         */
        get: function () {
            return this._underline;
        },
        /**
         * Gets or sets a boolean indicating that text must have underline
         */
        set: function (value) {
            if (this._underline === value) {
                return;
            }
            this._underline = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TextBlock.prototype, "lineThrough", {
        /**
         * Gets or sets an boolean indicating that text must be crossed out
         */
        get: function () {
            return this._lineThrough;
        },
        /**
         * Gets or sets an boolean indicating that text must be crossed out
         */
        set: function (value) {
            if (this._lineThrough === value) {
                return;
            }
            this._lineThrough = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TextBlock.prototype, "outlineColor", {
        /**
         * Gets or sets outlineColor of the text to display
         */
        get: function () {
            return this._outlineColor;
        },
        /**
         * Gets or sets outlineColor of the text to display
         */
        set: function (value) {
            if (this._outlineColor === value) {
                return;
            }
            this._outlineColor = value;
            this._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    TextBlock.prototype._getTypeName = function () {
        return "TextBlock";
    };
    TextBlock.prototype._processMeasures = function (parentMeasure, context) {
        if (!this._fontOffset) {
            this._fontOffset = _control__WEBPACK_IMPORTED_MODULE_3__["Control"]._GetFontOffset(context.font);
        }
        _super.prototype._processMeasures.call(this, parentMeasure, context);
        // Prepare lines
        this._lines = this._breakLines(this._currentMeasure.width, context);
        this.onLinesReadyObservable.notifyObservers(this);
        var maxLineWidth = 0;
        for (var i = 0; i < this._lines.length; i++) {
            var line = this._lines[i];
            if (line.width > maxLineWidth) {
                maxLineWidth = line.width;
            }
        }
        if (this._resizeToFit) {
            if (this._textWrapping === TextWrapping.Clip) {
                var newWidth = (this.paddingLeftInPixels + this.paddingRightInPixels + maxLineWidth) | 0;
                if (newWidth !== this._width.internalValue) {
                    this._width.updateInPlace(newWidth, _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"].UNITMODE_PIXEL);
                    this._rebuildLayout = true;
                }
            }
            var newHeight = (this.paddingTopInPixels + this.paddingBottomInPixels + this._fontOffset.height * this._lines.length) | 0;
            if (this._lines.length > 0 && this._lineSpacing.internalValue !== 0) {
                var lineSpacing = 0;
                if (this._lineSpacing.isPixel) {
                    lineSpacing = this._lineSpacing.getValue(this._host);
                }
                else {
                    lineSpacing = (this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height));
                }
                newHeight += (this._lines.length - 1) * lineSpacing;
            }
            if (newHeight !== this._height.internalValue) {
                this._height.updateInPlace(newHeight, _valueAndUnit__WEBPACK_IMPORTED_MODULE_2__["ValueAndUnit"].UNITMODE_PIXEL);
                this._rebuildLayout = true;
            }
        }
    };
    TextBlock.prototype._drawText = function (text, textWidth, y, context) {
        var width = this._currentMeasure.width;
        var x = 0;
        switch (this._textHorizontalAlignment) {
            case _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_LEFT:
                x = 0;
                break;
            case _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_RIGHT:
                x = width - textWidth;
                break;
            case _control__WEBPACK_IMPORTED_MODULE_3__["Control"].HORIZONTAL_ALIGNMENT_CENTER:
                x = (width - textWidth) / 2;
                break;
        }
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }
        if (this.outlineWidth) {
            context.strokeText(text, this._currentMeasure.left + x, y);
        }
        context.fillText(text, this._currentMeasure.left + x, y);
        if (this._underline) {
            context.beginPath();
            context.lineWidth = Math.round(this.fontSizeInPixels * 0.05);
            context.moveTo(this._currentMeasure.left + x, y + 3);
            context.lineTo(this._currentMeasure.left + x + textWidth, y + 3);
            context.stroke();
            context.closePath();
        }
        if (this._lineThrough) {
            context.beginPath();
            context.lineWidth = Math.round(this.fontSizeInPixels * 0.05);
            context.moveTo(this._currentMeasure.left + x, y - this.fontSizeInPixels / 3);
            context.lineTo(this._currentMeasure.left + x + textWidth, y - this.fontSizeInPixels / 3);
            context.stroke();
            context.closePath();
        }
    };
    /** @hidden */
    TextBlock.prototype._draw = function (context, invalidatedRectangle) {
        context.save();
        this._applyStates(context);
        // Render lines
        this._renderLines(context);
        context.restore();
    };
    TextBlock.prototype._applyStates = function (context) {
        _super.prototype._applyStates.call(this, context);
        if (this.outlineWidth) {
            context.lineWidth = this.outlineWidth;
            context.strokeStyle = this.outlineColor;
        }
    };
    TextBlock.prototype._breakLines = function (refWidth, context) {
        var lines = [];
        var _lines = this.text.split("\n");
        if (this._textWrapping === TextWrapping.Ellipsis) {
            for (var _i = 0, _lines_1 = _lines; _i < _lines_1.length; _i++) {
                var _line = _lines_1[_i];
                lines.push(this._parseLineEllipsis(_line, refWidth, context));
            }
        }
        else if (this._textWrapping === TextWrapping.WordWrap) {
            for (var _a = 0, _lines_2 = _lines; _a < _lines_2.length; _a++) {
                var _line = _lines_2[_a];
                lines.push.apply(lines, this._parseLineWordWrap(_line, refWidth, context));
            }
        }
        else {
            for (var _b = 0, _lines_3 = _lines; _b < _lines_3.length; _b++) {
                var _line = _lines_3[_b];
                lines.push(this._parseLine(_line, context));
            }
        }
        return lines;
    };
    TextBlock.prototype._parseLine = function (line, context) {
        if (line === void 0) { line = ''; }
        return { text: line, width: context.measureText(line).width };
    };
    TextBlock.prototype._parseLineEllipsis = function (line, width, context) {
        if (line === void 0) { line = ''; }
        var lineWidth = context.measureText(line).width;
        if (lineWidth > width) {
            line += '…';
        }
        while (line.length > 2 && lineWidth > width) {
            line = line.slice(0, -2) + '…';
            lineWidth = context.measureText(line).width;
        }
        return { text: line, width: lineWidth };
    };
    TextBlock.prototype._parseLineWordWrap = function (line, width, context) {
        if (line === void 0) { line = ''; }
        var lines = [];
        var words = this.wordSplittingFunction ? this.wordSplittingFunction(line) : line.split(' ');
        var lineWidth = 0;
        for (var n = 0; n < words.length; n++) {
            var testLine = n > 0 ? line + " " + words[n] : words[0];
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > width && n > 0) {
                lines.push({ text: line, width: lineWidth });
                line = words[n];
                lineWidth = context.measureText(line).width;
            }
            else {
                lineWidth = testWidth;
                line = testLine;
            }
        }
        lines.push({ text: line, width: lineWidth });
        return lines;
    };
    TextBlock.prototype._renderLines = function (context) {
        var height = this._currentMeasure.height;
        var rootY = 0;
        switch (this._textVerticalAlignment) {
            case _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_TOP:
                rootY = this._fontOffset.ascent;
                break;
            case _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_BOTTOM:
                rootY = height - this._fontOffset.height * (this._lines.length - 1) - this._fontOffset.descent;
                break;
            case _control__WEBPACK_IMPORTED_MODULE_3__["Control"].VERTICAL_ALIGNMENT_CENTER:
                rootY = this._fontOffset.ascent + (height - this._fontOffset.height * this._lines.length) / 2;
                break;
        }
        rootY += this._currentMeasure.top;
        for (var i = 0; i < this._lines.length; i++) {
            var line = this._lines[i];
            if (i !== 0 && this._lineSpacing.internalValue !== 0) {
                if (this._lineSpacing.isPixel) {
                    rootY += this._lineSpacing.getValue(this._host);
                }
                else {
                    rootY = rootY + (this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height));
                }
            }
            this._drawText(line.text, line.width, rootY, context);
            rootY += this._fontOffset.height;
        }
    };
    /**
     * Given a width constraint applied on the text block, find the expected height
     * @returns expected height
     */
    TextBlock.prototype.computeExpectedHeight = function () {
        if (this.text && this.widthInPixels) {
            var context_1 = document.createElement('canvas').getContext('2d');
            if (context_1) {
                this._applyStates(context_1);
                if (!this._fontOffset) {
                    this._fontOffset = _control__WEBPACK_IMPORTED_MODULE_3__["Control"]._GetFontOffset(context_1.font);
                }
                var lines = this._lines ? this._lines : this._breakLines(this.widthInPixels - this.paddingLeftInPixels - this.paddingRightInPixels, context_1);
                var newHeight = this.paddingTopInPixels + this.paddingBottomInPixels + this._fontOffset.height * lines.length;
                if (lines.length > 0 && this._lineSpacing.internalValue !== 0) {
                    var lineSpacing = 0;
                    if (this._lineSpacing.isPixel) {
                        lineSpacing = this._lineSpacing.getValue(this._host);
                    }
                    else {
                        lineSpacing = (this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height));
                    }
                    newHeight += (lines.length - 1) * lineSpacing;
                }
                return newHeight;
            }
        }
        return 0;
    };
    TextBlock.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this.onTextChangedObservable.clear();
    };
    return TextBlock;
}(_control__WEBPACK_IMPORTED_MODULE_3__["Control"]));

babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GUI.TextBlock"] = TextBlock;


/***/ }),

/***/ "./2D/controls/virtualKeyboard.ts":
/*!****************************************!*\
  !*** ./2D/controls/virtualKeyboard.ts ***!
  \****************************************/
/*! exports provided: KeyPropertySet, VirtualKeyboard */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KeyPropertySet", function() { return KeyPropertySet; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "VirtualKeyboard", function() { return VirtualKeyboard; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _stackPanel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stackPanel */ "./2D/controls/stackPanel.ts");
/* harmony import */ var _button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./button */ "./2D/controls/button.ts");





/**
 * Class used to store key control properties
 */
var KeyPropertySet = /** @class */ (function () {
    function KeyPropertySet() {
    }
    return KeyPropertySet;
}());

/**
 * Class used to create virtual keyboard
 */
var VirtualKeyboard = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(VirtualKeyboard, _super);
    function VirtualKeyboard() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /** Observable raised when a key is pressed */
        _this.onKeyPressObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["Observable"]();
        /** Gets or sets default key button width */
        _this.defaultButtonWidth = "40px";
        /** Gets or sets default key button height */
        _this.defaultButtonHeight = "40px";
        /** Gets or sets default key button left padding */
        _this.defaultButtonPaddingLeft = "2px";
        /** Gets or sets default key button right padding */
        _this.defaultButtonPaddingRight = "2px";
        /** Gets or sets default key button top padding */
        _this.defaultButtonPaddingTop = "2px";
        /** Gets or sets default key button bottom padding */
        _this.defaultButtonPaddingBottom = "2px";
        /** Gets or sets default key button foreground color */
        _this.defaultButtonColor = "#DDD";
        /** Gets or sets default key button background color */
        _this.defaultButtonBackground = "#070707";
        /** Gets or sets shift button foreground color */
        _this.shiftButtonColor = "#7799FF";
        /** Gets or sets shift button thickness*/
        _this.selectedShiftThickness = 1;
        /** Gets shift key state */
        _this.shiftState = 0;
        _this._currentlyConnectedInputText = null;
        _this._connectedInputTexts = [];
        _this._onKeyPressObserver = null;
        return _this;
    }
    VirtualKeyboard.prototype._getTypeName = function () {
        return "VirtualKeyboard";
    };
    VirtualKeyboard.prototype._createKey = function (key, propertySet) {
        var _this = this;
        var button = _button__WEBPACK_IMPORTED_MODULE_3__["Button"].CreateSimpleButton(key, key);
        button.width = propertySet && propertySet.width ? propertySet.width : this.defaultButtonWidth;
        button.height = propertySet && propertySet.height ? propertySet.height : this.defaultButtonHeight;
        button.color = propertySet && propertySet.color ? propertySet.color : this.defaultButtonColor;
        button.background = propertySet && propertySet.background ? propertySet.background : this.defaultButtonBackground;
        button.paddingLeft = propertySet && propertySet.paddingLeft ? propertySet.paddingLeft : this.defaultButtonPaddingLeft;
        button.paddingRight = propertySet && propertySet.paddingRight ? propertySet.paddingRight : this.defaultButtonPaddingRight;
        button.paddingTop = propertySet && propertySet.paddingTop ? propertySet.paddingTop : this.defaultButtonPaddingTop;
        button.paddingBottom = propertySet && propertySet.paddingBottom ? propertySet.paddingBottom : this.defaultButtonPaddingBottom;
        button.thickness = 0;
        button.isFocusInvisible = true;
        button.shadowColor = this.shadowColor;
        button.shadowBlur = this.shadowBlur;
        button.shadowOffsetX = this.shadowOffsetX;
        button.shadowOffsetY = this.shadowOffsetY;
        button.onPointerUpObservable.add(function () {
            _this.onKeyPressObservable.notifyObservers(key);
        });
        return button;
    };
    /**
     * Adds a new row of keys
     * @param keys defines the list of keys to add
     * @param propertySets defines the associated property sets
     */
    VirtualKeyboard.prototype.addKeysRow = function (keys, propertySets) {
        var panel = new _stackPanel__WEBPACK_IMPORTED_MODULE_2__["StackPanel"]();
        panel.isVertical = false;
        panel.isFocusInvisible = true;
        var maxKey = null;
        for (var i = 0; i < keys.length; i++) {
            var properties = null;
            if (propertySets && propertySets.length === keys.length) {
                properties = propertySets[i];
            }
            var key = this._createKey(keys[i], properties);
            if (!maxKey || key.heightInPixels > maxKey.heightInPixels) {
                maxKey = key;
            }
            panel.addControl(key);
        }
        panel.height = maxKey ? maxKey.height : this.defaultButtonHeight;
        this.addControl(panel);
    };
    /**
     * Set the shift key to a specific state
     * @param shiftState defines the new shift state
     */
    VirtualKeyboard.prototype.applyShiftState = function (shiftState) {
        if (!this.children) {
            return;
        }
        for (var i = 0; i < this.children.length; i++) {
            var row = this.children[i];
            if (!row || !row.children) {
                continue;
            }
            var rowContainer = row;
            for (var j = 0; j < rowContainer.children.length; j++) {
                var button = rowContainer.children[j];
                if (!button || !button.children[0]) {
                    continue;
                }
                var button_tblock = button.children[0];
                if (button_tblock.text === "\u21E7") {
                    button.color = (shiftState ? this.shiftButtonColor : this.defaultButtonColor);
                    button.thickness = (shiftState > 1 ? this.selectedShiftThickness : 0);
                }
                button_tblock.text = (shiftState > 0 ? button_tblock.text.toUpperCase() : button_tblock.text.toLowerCase());
            }
        }
    };
    Object.defineProperty(VirtualKeyboard.prototype, "connectedInputText", {
        /** Gets the input text control currently attached to the keyboard */
        get: function () {
            return this._currentlyConnectedInputText;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Connects the keyboard with an input text control
     *
     * @param input defines the target control
     */
    VirtualKeyboard.prototype.connect = function (input) {
        var _this = this;
        var inputTextAlreadyConnected = this._connectedInputTexts.some(function (a) { return a.input === input; });
        if (inputTextAlreadyConnected) {
            return;
        }
        if (this._onKeyPressObserver === null) {
            this._onKeyPressObserver = this.onKeyPressObservable.add(function (key) {
                if (!_this._currentlyConnectedInputText) {
                    return;
                }
                _this._currentlyConnectedInputText._host.focusedControl = _this._currentlyConnectedInputText;
                switch (key) {
                    case "\u21E7":
                        _this.shiftState++;
                        if (_this.shiftState > 2) {
                            _this.shiftState = 0;
                        }
                        _this.applyShiftState(_this.shiftState);
                        return;
                    case "\u2190":
                        _this._currentlyConnectedInputText.processKey(8);
                        return;
                    case "\u21B5":
                        _this._currentlyConnectedInputText.processKey(13);
                        return;
                }
                _this._currentlyConnectedInputText.processKey(-1, (_this.shiftState ? key.toUpperCase() : key));
                if (_this.shiftState === 1) {
                    _this.shiftState = 0;
                    _this.applyShiftState(_this.shiftState);
                }
            });
        }
        this.isVisible = false;
        this._currentlyConnectedInputText = input;
        input._connectedVirtualKeyboard = this;
        // Events hooking
        var onFocusObserver = input.onFocusObservable.add(function () {
            _this._currentlyConnectedInputText = input;
            input._connectedVirtualKeyboard = _this;
            _this.isVisible = true;
        });
        var onBlurObserver = input.onBlurObservable.add(function () {
            input._connectedVirtualKeyboard = null;
            _this._currentlyConnectedInputText = null;
            _this.isVisible = false;
        });
        this._connectedInputTexts.push({
            input: input,
            onBlurObserver: onBlurObserver,
            onFocusObserver: onFocusObserver
        });
    };
    /**
     * Disconnects the keyboard from connected InputText controls
     *
     * @param input optionally defines a target control, otherwise all are disconnected
     */
    VirtualKeyboard.prototype.disconnect = function (input) {
        var _this = this;
        if (input) {
            // .find not available on IE
            var filtered = this._connectedInputTexts.filter(function (a) { return a.input === input; });
            if (filtered.length === 1) {
                this._removeConnectedInputObservables(filtered[0]);
                this._connectedInputTexts = this._connectedInputTexts.filter(function (a) { return a.input !== input; });
                if (this._currentlyConnectedInputText === input) {
                    this._currentlyConnectedInputText = null;
                }
            }
        }
        else {
            this._connectedInputTexts.forEach(function (connectedInputText) {
                _this._removeConnectedInputObservables(connectedInputText);
            });
            this._connectedInputTexts = [];
        }
        if (this._connectedInputTexts.length === 0) {
            this._currentlyConnectedInputText = null;
            this.onKeyPressObservable.remove(this._onKeyPressObserver);
            this._onKeyPressObserver = null;
        }
    };
    VirtualKeyboard.prototype._removeConnectedInputObservables = function (connectedInputText) {
        connectedInputText.input._connectedVirtualKeyboard = null;
        connectedInputText.input.onFocusObservable.remove(connectedInputText.onFocusObserver);
        connectedInputText.input.onBlurObservable.remove(connectedInputText.onBlurObserver);
    };
    /**
     * Release all resources
     */
    VirtualKeyboard.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this.disconnect();
    };
    // Statics
    /**
     * Creates a new keyboard using a default layout
     *
     * @param name defines control name
     * @returns a new VirtualKeyboard
     */
    VirtualKeyboard.CreateDefaultLayout = function (name) {
        var returnValue = new VirtualKeyboard(name);
        returnValue.addKeysRow(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "\u2190"]);
        returnValue.addKeysRow(["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]);
        returnValue.addKeysRow(["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "\u21B5"]);
        returnValue.addKeysRow(["\u21E7", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/"]);
        returnValue.addKeysRow([" "], [{ width: "200px" }]);
        return returnValue;
    };
    return VirtualKeyboard;
}(_stackPanel__WEBPACK_IMPORTED_MODULE_2__["StackPanel"]));

babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GUI.VirtualKeyboard"] = VirtualKeyboard;


/***/ }),

/***/ "./2D/index.ts":
/*!*********************!*\
  !*** ./2D/index.ts ***!
  \*********************/
/*! exports provided: Button, Checkbox, ColorPicker, Container, Control, Ellipse, Grid, Image, InputText, InputPassword, Line, MultiLine, RadioButton, StackPanel, SelectorGroup, CheckboxGroup, RadioGroup, SliderGroup, SelectionPanel, ScrollViewer, TextWrapping, TextBlock, KeyPropertySet, VirtualKeyboard, Rectangle, DisplayGrid, BaseSlider, Slider, ImageBasedSlider, ScrollBar, ImageScrollBar, name, AdvancedDynamicTexture, AdvancedDynamicTextureInstrumentation, Vector2WithInfo, Matrix2D, Measure, MultiLinePoint, Style, ValueAndUnit, XmlLoader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _controls__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./controls */ "./2D/controls/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Button", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Button"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Checkbox", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Checkbox"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ColorPicker", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["ColorPicker"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Container", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Container"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Control", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Control"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Ellipse", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Ellipse"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Grid", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Grid"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Image", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Image"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InputText", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["InputText"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InputPassword", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["InputPassword"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Line", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Line"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MultiLine", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["MultiLine"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RadioButton", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["RadioButton"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StackPanel", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["StackPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SelectorGroup", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["SelectorGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CheckboxGroup", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["CheckboxGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RadioGroup", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["RadioGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SliderGroup", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["SliderGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SelectionPanel", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["SelectionPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScrollViewer", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["ScrollViewer"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TextWrapping", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["TextWrapping"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TextBlock", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["TextBlock"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KeyPropertySet", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["KeyPropertySet"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "VirtualKeyboard", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["VirtualKeyboard"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Rectangle", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Rectangle"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DisplayGrid", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["DisplayGrid"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BaseSlider", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["BaseSlider"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Slider", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Slider"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ImageBasedSlider", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["ImageBasedSlider"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScrollBar", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["ScrollBar"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ImageScrollBar", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["ImageScrollBar"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "name", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["name"]; });

/* harmony import */ var _advancedDynamicTexture__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./advancedDynamicTexture */ "./2D/advancedDynamicTexture.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AdvancedDynamicTexture", function() { return _advancedDynamicTexture__WEBPACK_IMPORTED_MODULE_1__["AdvancedDynamicTexture"]; });

/* harmony import */ var _adtInstrumentation__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./adtInstrumentation */ "./2D/adtInstrumentation.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AdvancedDynamicTextureInstrumentation", function() { return _adtInstrumentation__WEBPACK_IMPORTED_MODULE_2__["AdvancedDynamicTextureInstrumentation"]; });

/* harmony import */ var _math2D__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./math2D */ "./2D/math2D.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Vector2WithInfo", function() { return _math2D__WEBPACK_IMPORTED_MODULE_3__["Vector2WithInfo"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Matrix2D", function() { return _math2D__WEBPACK_IMPORTED_MODULE_3__["Matrix2D"]; });

/* harmony import */ var _measure__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./measure */ "./2D/measure.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Measure", function() { return _measure__WEBPACK_IMPORTED_MODULE_4__["Measure"]; });

/* harmony import */ var _multiLinePoint__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./multiLinePoint */ "./2D/multiLinePoint.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MultiLinePoint", function() { return _multiLinePoint__WEBPACK_IMPORTED_MODULE_5__["MultiLinePoint"]; });

/* harmony import */ var _style__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./style */ "./2D/style.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Style", function() { return _style__WEBPACK_IMPORTED_MODULE_6__["Style"]; });

/* harmony import */ var _valueAndUnit__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./valueAndUnit */ "./2D/valueAndUnit.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ValueAndUnit", function() { return _valueAndUnit__WEBPACK_IMPORTED_MODULE_7__["ValueAndUnit"]; });

/* harmony import */ var _xmlLoader__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./xmlLoader */ "./2D/xmlLoader.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "XmlLoader", function() { return _xmlLoader__WEBPACK_IMPORTED_MODULE_8__["XmlLoader"]; });












/***/ }),

/***/ "./2D/math2D.ts":
/*!**********************!*\
  !*** ./2D/math2D.ts ***!
  \**********************/
/*! exports provided: Vector2WithInfo, Matrix2D */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Vector2WithInfo", function() { return Vector2WithInfo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Matrix2D", function() { return Matrix2D; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Maths/math.vector */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__);



/**
 * Class used to transport Vector2 information for pointer events
 */
var Vector2WithInfo = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Vector2WithInfo, _super);
    /**
     * Creates a new Vector2WithInfo
     * @param source defines the vector2 data to transport
     * @param buttonIndex defines the current mouse button index
     */
    function Vector2WithInfo(source, 
    /** defines the current mouse button index */
    buttonIndex) {
        if (buttonIndex === void 0) { buttonIndex = 0; }
        var _this = _super.call(this, source.x, source.y) || this;
        _this.buttonIndex = buttonIndex;
        return _this;
    }
    return Vector2WithInfo;
}(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Vector2"]));

/** Class used to provide 2D matrix features */
var Matrix2D = /** @class */ (function () {
    /**
     * Creates a new matrix
     * @param m00 defines value for (0, 0)
     * @param m01 defines value for (0, 1)
     * @param m10 defines value for (1, 0)
     * @param m11 defines value for (1, 1)
     * @param m20 defines value for (2, 0)
     * @param m21 defines value for (2, 1)
     */
    function Matrix2D(m00, m01, m10, m11, m20, m21) {
        /** Gets the internal array of 6 floats used to store matrix data */
        this.m = new Float32Array(6);
        this.fromValues(m00, m01, m10, m11, m20, m21);
    }
    /**
     * Fills the matrix from direct values
     * @param m00 defines value for (0, 0)
     * @param m01 defines value for (0, 1)
     * @param m10 defines value for (1, 0)
     * @param m11 defines value for (1, 1)
     * @param m20 defines value for (2, 0)
     * @param m21 defines value for (2, 1)
     * @returns the current modified matrix
     */
    Matrix2D.prototype.fromValues = function (m00, m01, m10, m11, m20, m21) {
        this.m[0] = m00;
        this.m[1] = m01;
        this.m[2] = m10;
        this.m[3] = m11;
        this.m[4] = m20;
        this.m[5] = m21;
        return this;
    };
    /**
     * Gets matrix determinant
     * @returns the determinant
     */
    Matrix2D.prototype.determinant = function () {
        return this.m[0] * this.m[3] - this.m[1] * this.m[2];
    };
    /**
     * Inverses the matrix and stores it in a target matrix
     * @param result defines the target matrix
     * @returns the current matrix
     */
    Matrix2D.prototype.invertToRef = function (result) {
        var l0 = this.m[0];
        var l1 = this.m[1];
        var l2 = this.m[2];
        var l3 = this.m[3];
        var l4 = this.m[4];
        var l5 = this.m[5];
        var det = this.determinant();
        if (det < (babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Epsilon"] * babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Epsilon"])) {
            result.m[0] = 0;
            result.m[1] = 0;
            result.m[2] = 0;
            result.m[3] = 0;
            result.m[4] = 0;
            result.m[5] = 0;
            return this;
        }
        var detDiv = 1 / det;
        var det4 = l2 * l5 - l3 * l4;
        var det5 = l1 * l4 - l0 * l5;
        result.m[0] = l3 * detDiv;
        result.m[1] = -l1 * detDiv;
        result.m[2] = -l2 * detDiv;
        result.m[3] = l0 * detDiv;
        result.m[4] = det4 * detDiv;
        result.m[5] = det5 * detDiv;
        return this;
    };
    /**
     * Multiplies the current matrix with another one
     * @param other defines the second operand
     * @param result defines the target matrix
     * @returns the current matrix
     */
    Matrix2D.prototype.multiplyToRef = function (other, result) {
        var l0 = this.m[0];
        var l1 = this.m[1];
        var l2 = this.m[2];
        var l3 = this.m[3];
        var l4 = this.m[4];
        var l5 = this.m[5];
        var r0 = other.m[0];
        var r1 = other.m[1];
        var r2 = other.m[2];
        var r3 = other.m[3];
        var r4 = other.m[4];
        var r5 = other.m[5];
        result.m[0] = l0 * r0 + l1 * r2;
        result.m[1] = l0 * r1 + l1 * r3;
        result.m[2] = l2 * r0 + l3 * r2;
        result.m[3] = l2 * r1 + l3 * r3;
        result.m[4] = l4 * r0 + l5 * r2 + r4;
        result.m[5] = l4 * r1 + l5 * r3 + r5;
        return this;
    };
    /**
     * Applies the current matrix to a set of 2 floats and stores the result in a vector2
     * @param x defines the x coordinate to transform
     * @param y defines the x coordinate to transform
     * @param result defines the target vector2
     * @returns the current matrix
     */
    Matrix2D.prototype.transformCoordinates = function (x, y, result) {
        result.x = x * this.m[0] + y * this.m[2] + this.m[4];
        result.y = x * this.m[1] + y * this.m[3] + this.m[5];
        return this;
    };
    // Statics
    /**
     * Creates an identity matrix
     * @returns a new matrix
     */
    Matrix2D.Identity = function () {
        return new Matrix2D(1, 0, 0, 1, 0, 0);
    };
    /**
     * Creates a translation matrix and stores it in a target matrix
     * @param x defines the x coordinate of the translation
     * @param y defines the y coordinate of the translation
     * @param result defines the target matrix
     */
    Matrix2D.TranslationToRef = function (x, y, result) {
        result.fromValues(1, 0, 0, 1, x, y);
    };
    /**
     * Creates a scaling matrix and stores it in a target matrix
     * @param x defines the x coordinate of the scaling
     * @param y defines the y coordinate of the scaling
     * @param result defines the target matrix
     */
    Matrix2D.ScalingToRef = function (x, y, result) {
        result.fromValues(x, 0, 0, y, 0, 0);
    };
    /**
     * Creates a rotation matrix and stores it in a target matrix
     * @param angle defines the rotation angle
     * @param result defines the target matrix
     */
    Matrix2D.RotationToRef = function (angle, result) {
        var s = Math.sin(angle);
        var c = Math.cos(angle);
        result.fromValues(c, s, -s, c, 0, 0);
    };
    /**
     * Composes a matrix from translation, rotation, scaling and parent matrix and stores it in a target matrix
     * @param tx defines the x coordinate of the translation
     * @param ty defines the y coordinate of the translation
     * @param angle defines the rotation angle
     * @param scaleX defines the x coordinate of the scaling
     * @param scaleY defines the y coordinate of the scaling
     * @param parentMatrix defines the parent matrix to multiply by (can be null)
     * @param result defines the target matrix
     */
    Matrix2D.ComposeToRef = function (tx, ty, angle, scaleX, scaleY, parentMatrix, result) {
        Matrix2D.TranslationToRef(tx, ty, Matrix2D._TempPreTranslationMatrix);
        Matrix2D.ScalingToRef(scaleX, scaleY, Matrix2D._TempScalingMatrix);
        Matrix2D.RotationToRef(angle, Matrix2D._TempRotationMatrix);
        Matrix2D.TranslationToRef(-tx, -ty, Matrix2D._TempPostTranslationMatrix);
        Matrix2D._TempPreTranslationMatrix.multiplyToRef(Matrix2D._TempScalingMatrix, Matrix2D._TempCompose0);
        Matrix2D._TempCompose0.multiplyToRef(Matrix2D._TempRotationMatrix, Matrix2D._TempCompose1);
        if (parentMatrix) {
            Matrix2D._TempCompose1.multiplyToRef(Matrix2D._TempPostTranslationMatrix, Matrix2D._TempCompose2);
            Matrix2D._TempCompose2.multiplyToRef(parentMatrix, result);
        }
        else {
            Matrix2D._TempCompose1.multiplyToRef(Matrix2D._TempPostTranslationMatrix, result);
        }
    };
    Matrix2D._TempPreTranslationMatrix = Matrix2D.Identity();
    Matrix2D._TempPostTranslationMatrix = Matrix2D.Identity();
    Matrix2D._TempRotationMatrix = Matrix2D.Identity();
    Matrix2D._TempScalingMatrix = Matrix2D.Identity();
    Matrix2D._TempCompose0 = Matrix2D.Identity();
    Matrix2D._TempCompose1 = Matrix2D.Identity();
    Matrix2D._TempCompose2 = Matrix2D.Identity();
    return Matrix2D;
}());



/***/ }),

/***/ "./2D/measure.ts":
/*!***********************!*\
  !*** ./2D/measure.ts ***!
  \***********************/
/*! exports provided: Measure */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Measure", function() { return Measure; });
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math.vector */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__);

var tmpRect = [
    new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0),
    new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0),
    new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0),
    new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0),
];
var tmpRect2 = [
    new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0),
    new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0),
    new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0),
    new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0),
];
var tmpV1 = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0);
var tmpV2 = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0);
/**
 * Class used to store 2D control sizes
 */
var Measure = /** @class */ (function () {
    /**
     * Creates a new measure
     * @param left defines left coordinate
     * @param top defines top coordinate
     * @param width defines width dimension
     * @param height defines height dimension
     */
    function Measure(
    /** defines left coordinate */
    left, 
    /** defines top coordinate  */
    top, 
    /** defines width dimension  */
    width, 
    /** defines height dimension */
    height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
    /**
     * Copy from another measure
     * @param other defines the other measure to copy from
     */
    Measure.prototype.copyFrom = function (other) {
        this.left = other.left;
        this.top = other.top;
        this.width = other.width;
        this.height = other.height;
    };
    /**
     * Copy from a group of 4 floats
     * @param left defines left coordinate
     * @param top defines top coordinate
     * @param width defines width dimension
     * @param height defines height dimension
     */
    Measure.prototype.copyFromFloats = function (left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    };
    /**
     * Computes the axis aligned bounding box measure for two given measures
     * @param a Input measure
     * @param b Input measure
     * @param result the resulting bounding measure
     */
    Measure.CombineToRef = function (a, b, result) {
        var left = Math.min(a.left, b.left);
        var top = Math.min(a.top, b.top);
        var right = Math.max(a.left + a.width, b.left + b.width);
        var bottom = Math.max(a.top + a.height, b.top + b.height);
        result.left = left;
        result.top = top;
        result.width = right - left;
        result.height = bottom - top;
    };
    /**
     * Computes the axis aligned bounding box of the measure after it is modified by a given transform
     * @param transform the matrix to transform the measure before computing the AABB
     * @param addX number to add to left
     * @param addY number to add to top
     * @param addWidth number to add to width
     * @param addHeight number to add to height
     * @param result the resulting AABB
     */
    Measure.prototype.addAndTransformToRef = function (transform, addX, addY, addWidth, addHeight, result) {
        var left = this.left + addX;
        var top = this.top + addY;
        var width = this.width + addWidth;
        var height = this.height + addHeight;
        tmpRect[0].copyFromFloats(left, top);
        tmpRect[1].copyFromFloats(left + width, top);
        tmpRect[2].copyFromFloats(left + width, top + height);
        tmpRect[3].copyFromFloats(left, top + height);
        tmpV1.copyFromFloats(Number.MAX_VALUE, Number.MAX_VALUE);
        tmpV2.copyFromFloats(0, 0);
        for (var i = 0; i < 4; i++) {
            transform.transformCoordinates(tmpRect[i].x, tmpRect[i].y, tmpRect2[i]);
            tmpV1.x = Math.floor(Math.min(tmpV1.x, tmpRect2[i].x));
            tmpV1.y = Math.floor(Math.min(tmpV1.y, tmpRect2[i].y));
            tmpV2.x = Math.ceil(Math.max(tmpV2.x, tmpRect2[i].x));
            tmpV2.y = Math.ceil(Math.max(tmpV2.y, tmpRect2[i].y));
        }
        result.left = tmpV1.x;
        result.top = tmpV1.y;
        result.width = tmpV2.x - tmpV1.x;
        result.height = tmpV2.y - tmpV1.y;
    };
    /**
     * Computes the axis aligned bounding box of the measure after it is modified by a given transform
     * @param transform the matrix to transform the measure before computing the AABB
     * @param result the resulting AABB
     */
    Measure.prototype.transformToRef = function (transform, result) {
        this.addAndTransformToRef(transform, 0, 0, 0, 0, result);
    };
    /**
 * Check equality between this measure and another one
 * @param other defines the other measures
 * @returns true if both measures are equals
 */
    Measure.prototype.isEqualsTo = function (other) {
        if (this.left !== other.left) {
            return false;
        }
        if (this.top !== other.top) {
            return false;
        }
        if (this.width !== other.width) {
            return false;
        }
        if (this.height !== other.height) {
            return false;
        }
        return true;
    };
    /**
     * Creates an empty measure
     * @returns a new measure
     */
    Measure.Empty = function () {
        return new Measure(0, 0, 0, 0);
    };
    return Measure;
}());



/***/ }),

/***/ "./2D/multiLinePoint.ts":
/*!******************************!*\
  !*** ./2D/multiLinePoint.ts ***!
  \******************************/
/*! exports provided: MultiLinePoint */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MultiLinePoint", function() { return MultiLinePoint; });
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math.vector */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./valueAndUnit */ "./2D/valueAndUnit.ts");


/**
 * Class used to store a point for a MultiLine object.
 * The point can be pure 2D coordinates, a mesh or a control
 */
var MultiLinePoint = /** @class */ (function () {
    /**
     * Creates a new MultiLinePoint
     * @param multiLine defines the source MultiLine object
     */
    function MultiLinePoint(multiLine) {
        this._multiLine = multiLine;
        this._x = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](0);
        this._y = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](0);
        this._point = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0);
    }
    Object.defineProperty(MultiLinePoint.prototype, "x", {
        /** Gets or sets x coordinate */
        get: function () {
            return this._x.toString(this._multiLine._host);
        },
        set: function (value) {
            if (this._x.toString(this._multiLine._host) === value) {
                return;
            }
            if (this._x.fromString(value)) {
                this._multiLine._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MultiLinePoint.prototype, "y", {
        /** Gets or sets y coordinate */
        get: function () {
            return this._y.toString(this._multiLine._host);
        },
        set: function (value) {
            if (this._y.toString(this._multiLine._host) === value) {
                return;
            }
            if (this._y.fromString(value)) {
                this._multiLine._markAsDirty();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MultiLinePoint.prototype, "control", {
        /** Gets or sets the control associated with this point */
        get: function () {
            return this._control;
        },
        set: function (value) {
            if (this._control === value) {
                return;
            }
            if (this._control && this._controlObserver) {
                this._control.onDirtyObservable.remove(this._controlObserver);
                this._controlObserver = null;
            }
            this._control = value;
            if (this._control) {
                this._controlObserver = this._control.onDirtyObservable.add(this._multiLine.onPointUpdate);
            }
            this._multiLine._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MultiLinePoint.prototype, "mesh", {
        /** Gets or sets the mesh associated with this point */
        get: function () {
            return this._mesh;
        },
        set: function (value) {
            if (this._mesh === value) {
                return;
            }
            if (this._mesh && this._meshObserver) {
                this._mesh.getScene().onAfterCameraRenderObservable.remove(this._meshObserver);
            }
            this._mesh = value;
            if (this._mesh) {
                this._meshObserver = this._mesh.getScene().onAfterCameraRenderObservable.add(this._multiLine.onPointUpdate);
            }
            this._multiLine._markAsDirty();
        },
        enumerable: false,
        configurable: true
    });
    /** Resets links */
    MultiLinePoint.prototype.resetLinks = function () {
        this.control = null;
        this.mesh = null;
    };
    /**
     * Gets a translation vector
     * @returns the translation vector
     */
    MultiLinePoint.prototype.translate = function () {
        this._point = this._translatePoint();
        return this._point;
    };
    MultiLinePoint.prototype._translatePoint = function () {
        if (this._mesh != null) {
            return this._multiLine._host.getProjectedPosition(this._mesh.getBoundingInfo().boundingSphere.center, this._mesh.getWorldMatrix());
        }
        else if (this._control != null) {
            return new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](this._control.centerX, this._control.centerY);
        }
        else {
            var host = this._multiLine._host;
            var xValue = this._x.getValueInPixel(host, Number(host._canvas.width));
            var yValue = this._y.getValueInPixel(host, Number(host._canvas.height));
            return new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](xValue, yValue);
        }
    };
    /** Release associated resources */
    MultiLinePoint.prototype.dispose = function () {
        this.resetLinks();
    };
    return MultiLinePoint;
}());



/***/ }),

/***/ "./2D/style.ts":
/*!*********************!*\
  !*** ./2D/style.ts ***!
  \*********************/
/*! exports provided: Style */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Style", function() { return Style; });
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./valueAndUnit */ "./2D/valueAndUnit.ts");


/**
 * Define a style used by control to automatically setup properties based on a template.
 * Only support font related properties so far
 */
var Style = /** @class */ (function () {
    /**
     * Creates a new style object
     * @param host defines the AdvancedDynamicTexture which hosts this style
     */
    function Style(host) {
        this._fontFamily = "Arial";
        this._fontStyle = "";
        this._fontWeight = "";
        /** @hidden */
        this._fontSize = new _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"](18, _valueAndUnit__WEBPACK_IMPORTED_MODULE_1__["ValueAndUnit"].UNITMODE_PIXEL, false);
        /**
         * Observable raised when the style values are changed
         */
        this.onChangedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        this._host = host;
    }
    Object.defineProperty(Style.prototype, "fontSize", {
        /**
         * Gets or sets the font size
         */
        get: function () {
            return this._fontSize.toString(this._host);
        },
        set: function (value) {
            if (this._fontSize.toString(this._host) === value) {
                return;
            }
            if (this._fontSize.fromString(value)) {
                this.onChangedObservable.notifyObservers(this);
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Style.prototype, "fontFamily", {
        /**
         * Gets or sets the font family
         */
        get: function () {
            return this._fontFamily;
        },
        set: function (value) {
            if (this._fontFamily === value) {
                return;
            }
            this._fontFamily = value;
            this.onChangedObservable.notifyObservers(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Style.prototype, "fontStyle", {
        /**
         * Gets or sets the font style
         */
        get: function () {
            return this._fontStyle;
        },
        set: function (value) {
            if (this._fontStyle === value) {
                return;
            }
            this._fontStyle = value;
            this.onChangedObservable.notifyObservers(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Style.prototype, "fontWeight", {
        /** Gets or sets font weight */
        get: function () {
            return this._fontWeight;
        },
        set: function (value) {
            if (this._fontWeight === value) {
                return;
            }
            this._fontWeight = value;
            this.onChangedObservable.notifyObservers(this);
        },
        enumerable: false,
        configurable: true
    });
    /** Dispose all associated resources */
    Style.prototype.dispose = function () {
        this.onChangedObservable.clear();
    };
    return Style;
}());



/***/ }),

/***/ "./2D/valueAndUnit.ts":
/*!****************************!*\
  !*** ./2D/valueAndUnit.ts ***!
  \****************************/
/*! exports provided: ValueAndUnit */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ValueAndUnit", function() { return ValueAndUnit; });
/**
 * Class used to specific a value and its associated unit
 */
var ValueAndUnit = /** @class */ (function () {
    /**
     * Creates a new ValueAndUnit
     * @param value defines the value to store
     * @param unit defines the unit to store
     * @param negativeValueAllowed defines a boolean indicating if the value can be negative
     */
    function ValueAndUnit(value, 
    /** defines the unit to store */
    unit, 
    /** defines a boolean indicating if the value can be negative */
    negativeValueAllowed) {
        if (unit === void 0) { unit = ValueAndUnit.UNITMODE_PIXEL; }
        if (negativeValueAllowed === void 0) { negativeValueAllowed = true; }
        this.unit = unit;
        this.negativeValueAllowed = negativeValueAllowed;
        this._value = 1;
        /**
         * Gets or sets a value indicating that this value will not scale accordingly with adaptive scaling property
         * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
         */
        this.ignoreAdaptiveScaling = false;
        this._value = value;
        this._originalUnit = unit;
    }
    Object.defineProperty(ValueAndUnit.prototype, "isPercentage", {
        /** Gets a boolean indicating if the value is a percentage */
        get: function () {
            return this.unit === ValueAndUnit.UNITMODE_PERCENTAGE;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ValueAndUnit.prototype, "isPixel", {
        /** Gets a boolean indicating if the value is store as pixel */
        get: function () {
            return this.unit === ValueAndUnit.UNITMODE_PIXEL;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ValueAndUnit.prototype, "internalValue", {
        /** Gets direct internal value */
        get: function () {
            return this._value;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Gets value as pixel
     * @param host defines the root host
     * @param refValue defines the reference value for percentages
     * @returns the value as pixel
     */
    ValueAndUnit.prototype.getValueInPixel = function (host, refValue) {
        if (this.isPixel) {
            return this.getValue(host);
        }
        return this.getValue(host) * refValue;
    };
    /**
     * Update the current value and unit. This should be done cautiously as the GUi won't be marked as dirty with this function.
     * @param value defines the value to store
     * @param unit defines the unit to store
     * @returns the current ValueAndUnit
     */
    ValueAndUnit.prototype.updateInPlace = function (value, unit) {
        if (unit === void 0) { unit = ValueAndUnit.UNITMODE_PIXEL; }
        this._value = value;
        this.unit = unit;
        return this;
    };
    /**
     * Gets the value accordingly to its unit
     * @param host  defines the root host
     * @returns the value
     */
    ValueAndUnit.prototype.getValue = function (host) {
        if (host && !this.ignoreAdaptiveScaling && this.unit !== ValueAndUnit.UNITMODE_PERCENTAGE) {
            var width = 0;
            var height = 0;
            if (host.idealWidth) {
                width = (this._value * host.getSize().width) / host.idealWidth;
            }
            if (host.idealHeight) {
                height = (this._value * host.getSize().height) / host.idealHeight;
            }
            if (host.useSmallestIdeal && host.idealWidth && host.idealHeight) {
                return window.innerWidth < window.innerHeight ? width : height;
            }
            if (host.idealWidth) { // horizontal
                return width;
            }
            if (host.idealHeight) { // vertical
                return height;
            }
        }
        return this._value;
    };
    /**
     * Gets a string representation of the value
     * @param host defines the root host
     * @param decimals defines an optional number of decimals to display
     * @returns a string
     */
    ValueAndUnit.prototype.toString = function (host, decimals) {
        switch (this.unit) {
            case ValueAndUnit.UNITMODE_PERCENTAGE:
                var percentage = this.getValue(host) * 100;
                return (decimals ? percentage.toFixed(decimals) : percentage) + "%";
            case ValueAndUnit.UNITMODE_PIXEL:
                var pixels = this.getValue(host);
                return (decimals ? pixels.toFixed(decimals) : pixels) + "px";
        }
        return this.unit.toString();
    };
    /**
     * Store a value parsed from a string
     * @param source defines the source string
     * @returns true if the value was successfully parsed
     */
    ValueAndUnit.prototype.fromString = function (source) {
        var match = ValueAndUnit._Regex.exec(source.toString());
        if (!match || match.length === 0) {
            return false;
        }
        var sourceValue = parseFloat(match[1]);
        var sourceUnit = this._originalUnit;
        if (!this.negativeValueAllowed) {
            if (sourceValue < 0) {
                sourceValue = 0;
            }
        }
        if (match.length === 4) {
            switch (match[3]) {
                case "px":
                    sourceUnit = ValueAndUnit.UNITMODE_PIXEL;
                    break;
                case "%":
                    sourceUnit = ValueAndUnit.UNITMODE_PERCENTAGE;
                    sourceValue /= 100.0;
                    break;
            }
        }
        if (sourceValue === this._value && sourceUnit === this.unit) {
            return false;
        }
        this._value = sourceValue;
        this.unit = sourceUnit;
        return true;
    };
    Object.defineProperty(ValueAndUnit, "UNITMODE_PERCENTAGE", {
        /** UNITMODE_PERCENTAGE */
        get: function () {
            return ValueAndUnit._UNITMODE_PERCENTAGE;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ValueAndUnit, "UNITMODE_PIXEL", {
        /** UNITMODE_PIXEL */
        get: function () {
            return ValueAndUnit._UNITMODE_PIXEL;
        },
        enumerable: false,
        configurable: true
    });
    // Static
    ValueAndUnit._Regex = /(^-?\d*(\.\d+)?)(%|px)?/;
    ValueAndUnit._UNITMODE_PERCENTAGE = 0;
    ValueAndUnit._UNITMODE_PIXEL = 1;
    return ValueAndUnit;
}());



/***/ }),

/***/ "./2D/xmlLoader.ts":
/*!*************************!*\
  !*** ./2D/xmlLoader.ts ***!
  \*************************/
/*! exports provided: XmlLoader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "XmlLoader", function() { return XmlLoader; });
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Misc/typeStore */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_0__);

/**
* Class used to load GUI via XML.
*/
var XmlLoader = /** @class */ (function () {
    /**
    * Create a new xml loader
    * @param parentClass Sets the class context. Used when the loader is instanced inside a class and not in a global context
    */
    function XmlLoader(parentClass) {
        if (parentClass === void 0) { parentClass = null; }
        this._nodes = {};
        this._nodeTypes = {
            element: 1,
            attribute: 2,
            text: 3
        };
        this._isLoaded = false;
        this._objectAttributes = {
            "textHorizontalAlignment": 1,
            "textVerticalAlignment": 2,
            "horizontalAlignment": 3,
            "verticalAlignment": 4,
            "stretch": 5,
        };
        if (parentClass) {
            this._parentClass = parentClass;
        }
    }
    XmlLoader.prototype._getChainElement = function (attributeValue) {
        var element = window;
        if (this._parentClass) {
            element = this._parentClass;
        }
        var value = attributeValue;
        value = value.split(".");
        for (var i = 0; i < value.length; i++) {
            element = element[value[i]];
        }
        return element;
    };
    XmlLoader.prototype._getClassAttribute = function (attributeName) {
        var attribute = attributeName.split(".");
        var className = babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_0__["_TypeStore"].GetClass("BABYLON.GUI." + attribute[0]);
        return className[attribute[1]];
    };
    XmlLoader.prototype._createGuiElement = function (node, parent, linkParent) {
        if (linkParent === void 0) { linkParent = true; }
        try {
            var className = babylonjs_Misc_typeStore__WEBPACK_IMPORTED_MODULE_0__["_TypeStore"].GetClass("BABYLON.GUI." + node.nodeName);
            var guiNode = new className();
            if (parent && linkParent) {
                parent.addControl(guiNode);
            }
            for (var i = 0; i < node.attributes.length; i++) {
                if (node.attributes[i].name.toLowerCase().includes("datasource")) {
                    continue;
                }
                if (node.attributes[i].name.toLowerCase().includes("observable")) {
                    var element = this._getChainElement(node.attributes[i].value);
                    guiNode[node.attributes[i].name].add(element);
                    continue;
                }
                else if (node.attributes[i].name == "linkWithMesh") {
                    if (this._parentClass) {
                        guiNode.linkWithMesh(this._parentClass[node.attributes[i].value]);
                    }
                    else {
                        guiNode.linkWithMesh(window[node.attributes[i].value]);
                    }
                }
                else if (node.attributes[i].value.startsWith("{{") && node.attributes[i].value.endsWith("}}")) {
                    var element = this._getChainElement(node.attributes[i].value.substring(2, node.attributes[i].value.length - 2));
                    guiNode[node.attributes[i].name] = element;
                }
                else if (!this._objectAttributes[node.attributes[i].name]) {
                    if (node.attributes[i].value == "true" || node.attributes[i].value == "false") {
                        guiNode[node.attributes[i].name] = (node.attributes[i].value == 'true');
                    }
                    else {
                        guiNode[node.attributes[i].name] = !isNaN(Number(node.attributes[i].value)) ? Number(node.attributes[i].value) : node.attributes[i].value;
                    }
                }
                else {
                    guiNode[node.attributes[i].name] = this._getClassAttribute(node.attributes[i].value);
                }
            }
            if (!node.attributes.getNamedItem("id")) {
                this._nodes[node.nodeName + Object.keys(this._nodes).length + "_gen"] = guiNode;
                return guiNode;
            }
            var id = node.attributes.getNamedItem("id").value;
            if (id.startsWith("{{") && id.endsWith("}}")) {
                id = this._getChainElement(id.substring(2, id.length - 2));
            }
            if (!this._nodes[id]) {
                this._nodes[id] = guiNode;
            }
            else {
                throw "XmlLoader Exception : Duplicate ID, every element should have an unique ID attribute";
            }
            return guiNode;
        }
        catch (e) {
            throw "XmlLoader Exception : Error parsing Control " + node.nodeName + "," + e + ".";
        }
    };
    XmlLoader.prototype._parseGrid = function (node, guiNode, parent) {
        var width;
        var height;
        var columns;
        var rows = node.children;
        var cells;
        var isPixel = false;
        var cellNode;
        var rowNumber = -1;
        var columnNumber = -1;
        var totalColumnsNumber = 0;
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].nodeType != this._nodeTypes.element) {
                continue;
            }
            if (rows[i].nodeName != "Row") {
                throw "XmlLoader Exception : Expecting Row node, received " + rows[i].nodeName;
            }
            rowNumber += 1;
            columns = rows[i].children;
            if (!rows[i].attributes.getNamedItem("height")) {
                throw "XmlLoader Exception : Height must be defined for grid rows";
            }
            height = Number(rows[i].attributes.getNamedItem("height").nodeValue);
            isPixel = rows[i].attributes.getNamedItem("isPixel") ? JSON.parse(rows[i].attributes.getNamedItem("isPixel").nodeValue) : false;
            guiNode.addRowDefinition(height, isPixel);
            for (var j = 0; j < columns.length; j++) {
                if (columns[j].nodeType != this._nodeTypes.element) {
                    continue;
                }
                if (columns[j].nodeName != "Column") {
                    throw "XmlLoader Exception : Expecting Column node, received " + columns[j].nodeName;
                }
                columnNumber += 1;
                if (rowNumber > 0 && columnNumber > totalColumnsNumber) {
                    throw "XmlLoader Exception : In the Grid element, the number of columns is defined in the first row, do not add more columns in the subsequent rows.";
                }
                if (rowNumber == 0) {
                    if (!columns[j].attributes.getNamedItem("width")) {
                        throw "XmlLoader Exception : Width must be defined for all the grid columns in the first row";
                    }
                    width = Number(columns[j].attributes.getNamedItem("width").nodeValue);
                    isPixel = columns[j].attributes.getNamedItem("isPixel") ? JSON.parse(columns[j].attributes.getNamedItem("isPixel").nodeValue) : false;
                    guiNode.addColumnDefinition(width, isPixel);
                }
                cells = columns[j].children;
                for (var k = 0; k < cells.length; k++) {
                    if (cells[k].nodeType != this._nodeTypes.element) {
                        continue;
                    }
                    cellNode = this._createGuiElement(cells[k], guiNode, false);
                    guiNode.addControl(cellNode, rowNumber, columnNumber);
                    if (cells[k].firstChild) {
                        this._parseXml(cells[k].firstChild, cellNode);
                    }
                }
            }
            if (rowNumber == 0) {
                totalColumnsNumber = columnNumber;
            }
            columnNumber = -1;
        }
        if (node.nextSibling) {
            this._parseXml(node.nextSibling, parent);
        }
    };
    XmlLoader.prototype._parseElement = function (node, guiNode, parent) {
        if (node.firstChild) {
            this._parseXml(node.firstChild, guiNode);
        }
        if (node.nextSibling) {
            this._parseXml(node.nextSibling, parent);
        }
    };
    XmlLoader.prototype._prepareSourceElement = function (node, guiNode, variable, source, iterator) {
        if (this._parentClass) {
            this._parentClass[variable] = source[iterator];
        }
        else {
            window[variable] = source[iterator];
        }
        if (node.firstChild) {
            this._parseXml(node.firstChild, guiNode, true);
        }
    };
    XmlLoader.prototype._parseElementsFromSource = function (node, guiNode, parent) {
        var dataSource = node.attributes.getNamedItem("dataSource").value;
        if (!dataSource.includes(" in ")) {
            throw "XmlLoader Exception : Malformed XML, Data Source must include an in";
        }
        else {
            var isArray = true;
            var splittedSource = dataSource.split(" in ");
            if (splittedSource.length < 2) {
                throw "XmlLoader Exception : Malformed XML, Data Source must an iterator and a source";
            }
            var source = splittedSource[1];
            if (source.startsWith("{") && source.endsWith("}")) {
                isArray = false;
            }
            if (!isArray || (source.startsWith("[") && source.endsWith("]"))) {
                source = source.substring(1, source.length - 1);
            }
            if (this._parentClass) {
                source = this._parentClass[source];
            }
            else {
                source = window[source];
            }
            if (isArray) {
                for (var i = 0; i < source.length; i++) {
                    this._prepareSourceElement(node, guiNode, splittedSource[0], source, i);
                }
            }
            else {
                for (var i in source) {
                    this._prepareSourceElement(node, guiNode, splittedSource[0], source, i);
                }
            }
            if (node.nextSibling) {
                this._parseXml(node.nextSibling, parent);
            }
        }
    };
    XmlLoader.prototype._parseXml = function (node, parent, generated) {
        if (generated === void 0) { generated = false; }
        if (node.nodeType != this._nodeTypes.element) {
            if (node.nextSibling) {
                this._parseXml(node.nextSibling, parent, generated);
            }
            return;
        }
        if (generated) {
            node.setAttribute("id", parent.id + (parent._children.length + 1));
        }
        var guiNode = this._createGuiElement(node, parent);
        if (node.nodeName == "Grid") {
            this._parseGrid(node, guiNode, parent);
        }
        else if (!node.attributes.getNamedItem("dataSource")) {
            this._parseElement(node, guiNode, parent);
        }
        else {
            this._parseElementsFromSource(node, guiNode, parent);
        }
    };
    /**
     * Gets if the loading has finished.
     * @returns whether the loading has finished or not
    */
    XmlLoader.prototype.isLoaded = function () {
        return this._isLoaded;
    };
    /**
     * Gets a loaded node / control by id.
     * @param id the Controls id set in the xml
     * @returns element of type Control
    */
    XmlLoader.prototype.getNodeById = function (id) {
        return this._nodes[id];
    };
    /**
     * Gets all loaded nodes / controls
     * @returns Array of controls
    */
    XmlLoader.prototype.getNodes = function () {
        return this._nodes;
    };
    /**
     * Initiates the xml layout loading
     * @param xmlFile defines the xml layout to load
     * @param rootNode defines the node / control to use as a parent for the loaded layout controls.
     * @param callback defines the callback called on layout load.
     */
    XmlLoader.prototype.loadLayout = function (xmlFile, rootNode, callback) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                if (!xhttp.responseXML) {
                    throw "XmlLoader Exception : XML file is malformed or corrupted.";
                }
                var xmlDoc = xhttp.responseXML.documentElement;
                this._parseXml(xmlDoc.firstChild, rootNode);
                this._isLoaded = true;
                if (callback) {
                    callback();
                }
            }
        }.bind(this);
        xhttp.open("GET", xmlFile, true);
        xhttp.send();
    };
    return XmlLoader;
}());



/***/ }),

/***/ "./3D/controls/abstractButton3D.ts":
/*!*****************************************!*\
  !*** ./3D/controls/abstractButton3D.ts ***!
  \*****************************************/
/*! exports provided: AbstractButton3D */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AbstractButton3D", function() { return AbstractButton3D; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Meshes_transformNode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Meshes/transformNode */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Meshes_transformNode__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Meshes_transformNode__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _control3D__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./control3D */ "./3D/controls/control3D.ts");



/**
 * Class used as a root to all buttons
 */
var AbstractButton3D = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(AbstractButton3D, _super);
    /**
     * Creates a new button
     * @param name defines the control name
     */
    function AbstractButton3D(name) {
        return _super.call(this, name) || this;
    }
    AbstractButton3D.prototype._getTypeName = function () {
        return "AbstractButton3D";
    };
    // Mesh association
    AbstractButton3D.prototype._createNode = function (scene) {
        return new babylonjs_Meshes_transformNode__WEBPACK_IMPORTED_MODULE_1__["TransformNode"]("button" + this.name);
    };
    return AbstractButton3D;
}(_control3D__WEBPACK_IMPORTED_MODULE_2__["Control3D"]));



/***/ }),

/***/ "./3D/controls/button3D.ts":
/*!*********************************!*\
  !*** ./3D/controls/button3D.ts ***!
  \*********************************/
/*! exports provided: Button3D */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Button3D", function() { return Button3D; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Maths/math.vector */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _abstractButton3D__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./abstractButton3D */ "./3D/controls/abstractButton3D.ts");
/* harmony import */ var _2D_advancedDynamicTexture__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../2D/advancedDynamicTexture */ "./2D/advancedDynamicTexture.ts");








/**
 * Class used to create a button in 3D
 */
var Button3D = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Button3D, _super);
    /**
     * Creates a new button
     * @param name defines the control name
     */
    function Button3D(name) {
        var _this = _super.call(this, name) || this;
        _this._contentResolution = 512;
        _this._contentScaleRatio = 2;
        // Default animations
        _this.pointerEnterAnimation = function () {
            if (!_this.mesh) {
                return;
            }
            _this._currentMaterial.emissiveColor = babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Color3"].Red();
        };
        _this.pointerOutAnimation = function () {
            _this._currentMaterial.emissiveColor = babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Color3"].Black();
        };
        _this.pointerDownAnimation = function () {
            if (!_this.mesh) {
                return;
            }
            _this.mesh.scaling.scaleInPlace(0.95);
        };
        _this.pointerUpAnimation = function () {
            if (!_this.mesh) {
                return;
            }
            _this.mesh.scaling.scaleInPlace(1.0 / 0.95);
        };
        return _this;
    }
    Object.defineProperty(Button3D.prototype, "contentResolution", {
        /**
         * Gets or sets the texture resolution used to render content (512 by default)
         */
        get: function () {
            return this._contentResolution;
        },
        set: function (value) {
            if (this._contentResolution === value) {
                return;
            }
            this._contentResolution = value;
            this._resetContent();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Button3D.prototype, "contentScaleRatio", {
        /**
         * Gets or sets the texture scale ratio used to render content (2 by default)
         */
        get: function () {
            return this._contentScaleRatio;
        },
        set: function (value) {
            if (this._contentScaleRatio === value) {
                return;
            }
            this._contentScaleRatio = value;
            this._resetContent();
        },
        enumerable: false,
        configurable: true
    });
    Button3D.prototype._disposeFacadeTexture = function () {
        if (this._facadeTexture) {
            this._facadeTexture.dispose();
            this._facadeTexture = null;
        }
    };
    Button3D.prototype._resetContent = function () {
        this._disposeFacadeTexture();
        this.content = this._content;
    };
    Object.defineProperty(Button3D.prototype, "content", {
        /**
         * Gets or sets the GUI 2D content used to display the button's facade
         */
        get: function () {
            return this._content;
        },
        set: function (value) {
            this._content = value;
            if (!this._host || !this._host.utilityLayer) {
                return;
            }
            if (!this._facadeTexture) {
                this._facadeTexture = new _2D_advancedDynamicTexture__WEBPACK_IMPORTED_MODULE_3__["AdvancedDynamicTexture"]("Facade", this._contentResolution, this._contentResolution, this._host.utilityLayer.utilityLayerScene, true, babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Texture"].TRILINEAR_SAMPLINGMODE);
                this._facadeTexture.rootContainer.scaleX = this._contentScaleRatio;
                this._facadeTexture.rootContainer.scaleY = this._contentScaleRatio;
                this._facadeTexture.premulAlpha = true;
            }
            else {
                this._facadeTexture.rootContainer.clearControls();
            }
            this._facadeTexture.addControl(value);
            this._applyFacade(this._facadeTexture);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Apply the facade texture (created from the content property).
     * This function can be overloaded by child classes
     * @param facadeTexture defines the AdvancedDynamicTexture to use
     */
    Button3D.prototype._applyFacade = function (facadeTexture) {
        this._currentMaterial.emissiveTexture = facadeTexture;
    };
    Button3D.prototype._getTypeName = function () {
        return "Button3D";
    };
    // Mesh association
    Button3D.prototype._createNode = function (scene) {
        var faceUV = new Array(6);
        for (var i = 0; i < 6; i++) {
            faceUV[i] = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Vector4"](0, 0, 0, 0);
        }
        faceUV[1] = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Vector4"](0, 0, 1, 1);
        var mesh = babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["BoxBuilder"].CreateBox(this.name + "_rootMesh", {
            width: 1.0,
            height: 1.0,
            depth: 0.08,
            faceUV: faceUV
        }, scene);
        return mesh;
    };
    Button3D.prototype._affectMaterial = function (mesh) {
        var material = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["StandardMaterial"](this.name + "Material", mesh.getScene());
        material.specularColor = babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Color3"].Black();
        mesh.material = material;
        this._currentMaterial = material;
        this._resetContent();
    };
    /**
     * Releases all associated resources
     */
    Button3D.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this._disposeFacadeTexture();
        if (this._currentMaterial) {
            this._currentMaterial.dispose();
        }
    };
    return Button3D;
}(_abstractButton3D__WEBPACK_IMPORTED_MODULE_2__["AbstractButton3D"]));



/***/ }),

/***/ "./3D/controls/container3D.ts":
/*!************************************!*\
  !*** ./3D/controls/container3D.ts ***!
  \************************************/
/*! exports provided: Container3D */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Container3D", function() { return Container3D; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Meshes_transformNode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Meshes/transformNode */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Meshes_transformNode__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Meshes_transformNode__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _control3D__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./control3D */ "./3D/controls/control3D.ts");



/**
 * Class used to create containers for controls
 */
var Container3D = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Container3D, _super);
    /**
     * Creates a new container
     * @param name defines the container name
     */
    function Container3D(name) {
        var _this = _super.call(this, name) || this;
        _this._blockLayout = false;
        /**
         * Gets the list of child controls
         */
        _this._children = new Array();
        return _this;
    }
    Object.defineProperty(Container3D.prototype, "children", {
        /**
         * Gets the list of child controls
         */
        get: function () {
            return this._children;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Container3D.prototype, "blockLayout", {
        /**
         * Gets or sets a boolean indicating if the layout must be blocked (default is false).
         * This is helpful to optimize layout operation when adding multiple children in a row
         */
        get: function () {
            return this._blockLayout;
        },
        set: function (value) {
            if (this._blockLayout === value) {
                return;
            }
            this._blockLayout = value;
            if (!this._blockLayout) {
                this._arrangeChildren();
            }
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Force the container to update the layout. Please note that it will not take blockLayout property in account
     * @returns the current container
     */
    Container3D.prototype.updateLayout = function () {
        this._arrangeChildren();
        return this;
    };
    /**
     * Gets a boolean indicating if the given control is in the children of this control
     * @param control defines the control to check
     * @returns true if the control is in the child list
     */
    Container3D.prototype.containsControl = function (control) {
        return this._children.indexOf(control) !== -1;
    };
    /**
     * Adds a control to the children of this control
     * @param control defines the control to add
     * @returns the current container
     */
    Container3D.prototype.addControl = function (control) {
        var index = this._children.indexOf(control);
        if (index !== -1) {
            return this;
        }
        control.parent = this;
        control._host = this._host;
        this._children.push(control);
        if (this._host.utilityLayer) {
            control._prepareNode(this._host.utilityLayer.utilityLayerScene);
            if (control.node) {
                control.node.parent = this.node;
            }
            if (!this.blockLayout) {
                this._arrangeChildren();
            }
        }
        return this;
    };
    /**
     * This function will be called everytime a new control is added
     */
    Container3D.prototype._arrangeChildren = function () {
    };
    Container3D.prototype._createNode = function (scene) {
        return new babylonjs_Meshes_transformNode__WEBPACK_IMPORTED_MODULE_1__["TransformNode"]("ContainerNode", scene);
    };
    /**
     * Removes a control from the children of this control
     * @param control defines the control to remove
     * @returns the current container
     */
    Container3D.prototype.removeControl = function (control) {
        var index = this._children.indexOf(control);
        if (index !== -1) {
            this._children.splice(index, 1);
            control.parent = null;
            control._disposeNode();
        }
        return this;
    };
    Container3D.prototype._getTypeName = function () {
        return "Container3D";
    };
    /**
     * Releases all associated resources
     */
    Container3D.prototype.dispose = function () {
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var control = _a[_i];
            control.dispose();
        }
        this._children = [];
        _super.prototype.dispose.call(this);
    };
    /** Control rotation will remain unchanged  */
    Container3D.UNSET_ORIENTATION = 0;
    /** Control will rotate to make it look at sphere central axis */
    Container3D.FACEORIGIN_ORIENTATION = 1;
    /** Control will rotate to make it look back at sphere central axis */
    Container3D.FACEORIGINREVERSED_ORIENTATION = 2;
    /** Control will rotate to look at z axis (0, 0, 1) */
    Container3D.FACEFORWARD_ORIENTATION = 3;
    /** Control will rotate to look at negative z axis (0, 0, -1) */
    Container3D.FACEFORWARDREVERSED_ORIENTATION = 4;
    return Container3D;
}(_control3D__WEBPACK_IMPORTED_MODULE_2__["Control3D"]));



/***/ }),

/***/ "./3D/controls/control3D.ts":
/*!**********************************!*\
  !*** ./3D/controls/control3D.ts ***!
  \**********************************/
/*! exports provided: Control3D */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Control3D", function() { return Control3D; });
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _vector3WithInfo__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../vector3WithInfo */ "./3D/vector3WithInfo.ts");





/**
 * Class used as base class for controls
 */
var Control3D = /** @class */ (function () {
    /**
     * Creates a new control
     * @param name defines the control name
     */
    function Control3D(
    /** Defines the control name */
    name) {
        this.name = name;
        this._downCount = 0;
        this._enterCount = -1;
        this._downPointerIds = {};
        this._isVisible = true;
        /**
        * An event triggered when the pointer move over the control
        */
        this.onPointerMoveObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * An event triggered when the pointer move out of the control
         */
        this.onPointerOutObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * An event triggered when the pointer taps the control
         */
        this.onPointerDownObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * An event triggered when pointer is up
         */
        this.onPointerUpObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * An event triggered when a control is clicked on (with a mouse)
         */
        this.onPointerClickObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * An event triggered when pointer enters the control
         */
        this.onPointerEnterObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        // Behaviors
        this._behaviors = new Array();
    }
    Object.defineProperty(Control3D.prototype, "position", {
        /** Gets or sets the control position  in world space */
        get: function () {
            if (!this._node) {
                return babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero();
            }
            return this._node.position;
        },
        set: function (value) {
            if (!this._node) {
                return;
            }
            this._node.position = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control3D.prototype, "scaling", {
        /** Gets or sets the control scaling  in world space */
        get: function () {
            if (!this._node) {
                return new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector3"](1, 1, 1);
            }
            return this._node.scaling;
        },
        set: function (value) {
            if (!this._node) {
                return;
            }
            this._node.scaling = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control3D.prototype, "behaviors", {
        /**
         * Gets the list of attached behaviors
         * @see https://doc.babylonjs.com/features/behaviour
         */
        get: function () {
            return this._behaviors;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Attach a behavior to the control
     * @see https://doc.babylonjs.com/features/behaviour
     * @param behavior defines the behavior to attach
     * @returns the current control
     */
    Control3D.prototype.addBehavior = function (behavior) {
        var _this = this;
        var index = this._behaviors.indexOf(behavior);
        if (index !== -1) {
            return this;
        }
        behavior.init();
        var scene = this._host.scene;
        if (scene.isLoading) {
            // We defer the attach when the scene will be loaded
            scene.onDataLoadedObservable.addOnce(function () {
                behavior.attach(_this);
            });
        }
        else {
            behavior.attach(this);
        }
        this._behaviors.push(behavior);
        return this;
    };
    /**
     * Remove an attached behavior
     * @see https://doc.babylonjs.com/features/behaviour
     * @param behavior defines the behavior to attach
     * @returns the current control
     */
    Control3D.prototype.removeBehavior = function (behavior) {
        var index = this._behaviors.indexOf(behavior);
        if (index === -1) {
            return this;
        }
        this._behaviors[index].detach();
        this._behaviors.splice(index, 1);
        return this;
    };
    /**
     * Gets an attached behavior by name
     * @param name defines the name of the behavior to look for
     * @see https://doc.babylonjs.com/features/behaviour
     * @returns null if behavior was not found else the requested behavior
     */
    Control3D.prototype.getBehaviorByName = function (name) {
        for (var _i = 0, _a = this._behaviors; _i < _a.length; _i++) {
            var behavior = _a[_i];
            if (behavior.name === name) {
                return behavior;
            }
        }
        return null;
    };
    Object.defineProperty(Control3D.prototype, "isVisible", {
        /** Gets or sets a boolean indicating if the control is visible */
        get: function () {
            return this._isVisible;
        },
        set: function (value) {
            if (this._isVisible === value) {
                return;
            }
            this._isVisible = value;
            var mesh = this.mesh;
            if (mesh) {
                mesh.setEnabled(value);
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control3D.prototype, "typeName", {
        /**
         * Gets a string representing the class name
         */
        get: function () {
            return this._getTypeName();
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Get the current class name of the control.
     * @returns current class name
     */
    Control3D.prototype.getClassName = function () {
        return this._getTypeName();
    };
    Control3D.prototype._getTypeName = function () {
        return "Control3D";
    };
    Object.defineProperty(Control3D.prototype, "node", {
        /**
         * Gets the transform node used by this control
         */
        get: function () {
            return this._node;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Control3D.prototype, "mesh", {
        /**
         * Gets the mesh used to render this control
         */
        get: function () {
            if (this._node instanceof babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["AbstractMesh"]) {
                return this._node;
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Link the control as child of the given node
     * @param node defines the node to link to. Use null to unlink the control
     * @returns the current control
     */
    Control3D.prototype.linkToTransformNode = function (node) {
        if (this._node) {
            this._node.parent = node;
        }
        return this;
    };
    /** @hidden **/
    Control3D.prototype._prepareNode = function (scene) {
        if (!this._node) {
            this._node = this._createNode(scene);
            if (!this.node) {
                return;
            }
            this._node.metadata = this; // Store the control on the metadata field in order to get it when picking
            this._node.position = this.position;
            this._node.scaling = this.scaling;
            var mesh = this.mesh;
            if (mesh) {
                mesh.isPickable = true;
                this._affectMaterial(mesh);
            }
        }
    };
    /**
     * Node creation.
     * Can be overriden by children
     * @param scene defines the scene where the node must be attached
     * @returns the attached node or null if none. Must return a Mesh or AbstractMesh if there is an atttached visible object
     */
    Control3D.prototype._createNode = function (scene) {
        // Do nothing by default
        return null;
    };
    /**
     * Affect a material to the given mesh
     * @param mesh defines the mesh which will represent the control
     */
    Control3D.prototype._affectMaterial = function (mesh) {
        mesh.material = null;
    };
    // Pointers
    /** @hidden */
    Control3D.prototype._onPointerMove = function (target, coordinates) {
        this.onPointerMoveObservable.notifyObservers(coordinates, -1, target, this);
    };
    /** @hidden */
    Control3D.prototype._onPointerEnter = function (target) {
        if (this._enterCount > 0) {
            return false;
        }
        if (this._enterCount === -1) { // -1 is for touch input, we are now sure we are with a mouse or pencil
            this._enterCount = 0;
        }
        this._enterCount++;
        this.onPointerEnterObservable.notifyObservers(this, -1, target, this);
        if (this.pointerEnterAnimation) {
            this.pointerEnterAnimation();
        }
        return true;
    };
    /** @hidden */
    Control3D.prototype._onPointerOut = function (target) {
        this._enterCount = 0;
        this.onPointerOutObservable.notifyObservers(this, -1, target, this);
        if (this.pointerOutAnimation) {
            this.pointerOutAnimation();
        }
    };
    /** @hidden */
    Control3D.prototype._onPointerDown = function (target, coordinates, pointerId, buttonIndex) {
        if (this._downCount !== 0) {
            this._downCount++;
            return false;
        }
        this._downCount++;
        this._downPointerIds[pointerId] = true;
        this.onPointerDownObservable.notifyObservers(new _vector3WithInfo__WEBPACK_IMPORTED_MODULE_1__["Vector3WithInfo"](coordinates, buttonIndex), -1, target, this);
        if (this.pointerDownAnimation) {
            this.pointerDownAnimation();
        }
        return true;
    };
    /** @hidden */
    Control3D.prototype._onPointerUp = function (target, coordinates, pointerId, buttonIndex, notifyClick) {
        this._downCount--;
        delete this._downPointerIds[pointerId];
        if (this._downCount < 0) {
            // Handle if forcePointerUp was called prior to this
            this._downCount = 0;
            return;
        }
        if (this._downCount == 0) {
            if (notifyClick && (this._enterCount > 0 || this._enterCount === -1)) {
                this.onPointerClickObservable.notifyObservers(new _vector3WithInfo__WEBPACK_IMPORTED_MODULE_1__["Vector3WithInfo"](coordinates, buttonIndex), -1, target, this);
            }
            this.onPointerUpObservable.notifyObservers(new _vector3WithInfo__WEBPACK_IMPORTED_MODULE_1__["Vector3WithInfo"](coordinates, buttonIndex), -1, target, this);
            if (this.pointerUpAnimation) {
                this.pointerUpAnimation();
            }
        }
    };
    /** @hidden */
    Control3D.prototype.forcePointerUp = function (pointerId) {
        if (pointerId === void 0) { pointerId = null; }
        if (pointerId !== null) {
            this._onPointerUp(this, babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero(), pointerId, 0, true);
        }
        else {
            for (var key in this._downPointerIds) {
                this._onPointerUp(this, babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero(), +key, 0, true);
            }
            if (this._downCount > 0) {
                this._downCount = 1;
                this._onPointerUp(this, babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero(), 0, 0, true);
            }
        }
    };
    /** @hidden */
    Control3D.prototype._processObservables = function (type, pickedPoint, pointerId, buttonIndex) {
        if (type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["PointerEventTypes"].POINTERMOVE) {
            this._onPointerMove(this, pickedPoint);
            var previousControlOver = this._host._lastControlOver[pointerId];
            if (previousControlOver && previousControlOver !== this) {
                previousControlOver._onPointerOut(this);
            }
            if (previousControlOver !== this) {
                this._onPointerEnter(this);
            }
            this._host._lastControlOver[pointerId] = this;
            return true;
        }
        if (type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["PointerEventTypes"].POINTERDOWN) {
            this._onPointerDown(this, pickedPoint, pointerId, buttonIndex);
            this._host._lastControlDown[pointerId] = this;
            this._host._lastPickedControl = this;
            return true;
        }
        if (type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["PointerEventTypes"].POINTERUP || type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["PointerEventTypes"].POINTERDOUBLETAP) {
            if (this._host._lastControlDown[pointerId]) {
                this._host._lastControlDown[pointerId]._onPointerUp(this, pickedPoint, pointerId, buttonIndex, true);
            }
            delete this._host._lastControlDown[pointerId];
            return true;
        }
        return false;
    };
    /** @hidden */
    Control3D.prototype._disposeNode = function () {
        if (this._node) {
            this._node.dispose();
            this._node = null;
        }
    };
    /**
     * Releases all associated resources
     */
    Control3D.prototype.dispose = function () {
        this.onPointerDownObservable.clear();
        this.onPointerEnterObservable.clear();
        this.onPointerMoveObservable.clear();
        this.onPointerOutObservable.clear();
        this.onPointerUpObservable.clear();
        this.onPointerClickObservable.clear();
        this._disposeNode();
        // Behaviors
        for (var _i = 0, _a = this._behaviors; _i < _a.length; _i++) {
            var behavior = _a[_i];
            behavior.detach();
        }
    };
    return Control3D;
}());



/***/ }),

/***/ "./3D/controls/cylinderPanel.ts":
/*!**************************************!*\
  !*** ./3D/controls/cylinderPanel.ts ***!
  \**************************************/
/*! exports provided: CylinderPanel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CylinderPanel", function() { return CylinderPanel; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/tools */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _volumeBasedPanel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./volumeBasedPanel */ "./3D/controls/volumeBasedPanel.ts");
/* harmony import */ var _container3D__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./container3D */ "./3D/controls/container3D.ts");






/**
 * Class used to create a container panel deployed on the surface of a cylinder
 */
var CylinderPanel = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(CylinderPanel, _super);
    function CylinderPanel() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._radius = 5.0;
        return _this;
    }
    Object.defineProperty(CylinderPanel.prototype, "radius", {
        /**
         * Gets or sets the radius of the cylinder where to project controls (5 by default)
         */
        get: function () {
            return this._radius;
        },
        set: function (value) {
            var _this = this;
            if (this._radius === value) {
                return;
            }
            this._radius = value;
            babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Tools"].SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: false,
        configurable: true
    });
    CylinderPanel.prototype._mapGridNode = function (control, nodePosition) {
        var mesh = control.mesh;
        if (!mesh) {
            return;
        }
        var newPos = this._cylindricalMapping(nodePosition);
        control.position = newPos;
        switch (this.orientation) {
            case _container3D__WEBPACK_IMPORTED_MODULE_3__["Container3D"].FACEORIGIN_ORIENTATION:
                mesh.lookAt(new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"](2 * newPos.x, newPos.y, 2 * newPos.z));
                break;
            case _container3D__WEBPACK_IMPORTED_MODULE_3__["Container3D"].FACEORIGINREVERSED_ORIENTATION:
                mesh.lookAt(new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"](-newPos.x, newPos.y, -newPos.z));
                break;
            case _container3D__WEBPACK_IMPORTED_MODULE_3__["Container3D"].FACEFORWARD_ORIENTATION:
                break;
            case _container3D__WEBPACK_IMPORTED_MODULE_3__["Container3D"].FACEFORWARDREVERSED_ORIENTATION:
                mesh.rotate(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Axis"].Y, Math.PI, babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Space"].LOCAL);
                break;
        }
    };
    CylinderPanel.prototype._cylindricalMapping = function (source) {
        var newPos = new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"](0, source.y, this._radius);
        var yAngle = (source.x / this._radius);
        babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Matrix"].RotationYawPitchRollToRef(yAngle, 0, 0, babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Matrix[0]);
        return babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"].TransformNormal(newPos, babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Matrix[0]);
    };
    return CylinderPanel;
}(_volumeBasedPanel__WEBPACK_IMPORTED_MODULE_2__["VolumeBasedPanel"]));



/***/ }),

/***/ "./3D/controls/holographicButton.ts":
/*!******************************************!*\
  !*** ./3D/controls/holographicButton.ts ***!
  \******************************************/
/*! exports provided: HolographicButton */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HolographicButton", function() { return HolographicButton; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _button3D__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./button3D */ "./3D/controls/button3D.ts");
/* harmony import */ var babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! babylonjs/Materials/standardMaterial */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _materials_fluentMaterial__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../materials/fluentMaterial */ "./3D/materials/fluentMaterial.ts");
/* harmony import */ var _2D_controls_stackPanel__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../2D/controls/stackPanel */ "./2D/controls/stackPanel.ts");
/* harmony import */ var _2D_controls_image__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../2D/controls/image */ "./2D/controls/image.ts");
/* harmony import */ var _2D_controls_textBlock__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../2D/controls/textBlock */ "./2D/controls/textBlock.ts");
/* harmony import */ var _2D_advancedDynamicTexture__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../2D/advancedDynamicTexture */ "./2D/advancedDynamicTexture.ts");













/**
 * Class used to create a holographic button in 3D
 */
var HolographicButton = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(HolographicButton, _super);
    /**
     * Creates a new button
     * @param name defines the control name
     */
    function HolographicButton(name, shareMaterials) {
        if (shareMaterials === void 0) { shareMaterials = true; }
        var _this = _super.call(this, name) || this;
        _this._shareMaterials = true;
        _this._shareMaterials = shareMaterials;
        // Default animations
        _this.pointerEnterAnimation = function () {
            if (!_this.mesh) {
                return;
            }
            _this._frontPlate.setEnabled(true);
        };
        _this.pointerOutAnimation = function () {
            if (!_this.mesh) {
                return;
            }
            _this._frontPlate.setEnabled(false);
        };
        return _this;
    }
    HolographicButton.prototype._disposeTooltip = function () {
        this._tooltipFade = null;
        if (this._tooltipTextBlock) {
            this._tooltipTextBlock.dispose();
        }
        if (this._tooltipTexture) {
            this._tooltipTexture.dispose();
        }
        if (this._tooltipMesh) {
            this._tooltipMesh.dispose();
        }
        this.onPointerEnterObservable.remove(this._tooltipHoverObserver);
        this.onPointerOutObservable.remove(this._tooltipOutObserver);
    };
    Object.defineProperty(HolographicButton.prototype, "renderingGroupId", {
        get: function () {
            return this._backPlate.renderingGroupId;
        },
        /**
         * Rendering ground id of all the mesh in the button
         */
        set: function (id) {
            this._backPlate.renderingGroupId = id;
            this._textPlate.renderingGroupId = id;
            this._frontPlate.renderingGroupId = id;
            if (this._tooltipMesh) {
                this._tooltipMesh.renderingGroupId = id;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HolographicButton.prototype, "tooltipText", {
        get: function () {
            if (this._tooltipTextBlock) {
                return this._tooltipTextBlock.text;
            }
            return null;
        },
        /**
         * Text to be displayed on the tooltip shown when hovering on the button. When set to null tooltip is disabled. (Default: null)
         */
        set: function (text) {
            var _this = this;
            if (!text) {
                this._disposeTooltip();
                return;
            }
            if (!this._tooltipFade) {
                // Create tooltip with mesh and text
                this._tooltipMesh = babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2__["PlaneBuilder"].CreatePlane("", { size: 1 }, this._backPlate._scene);
                var tooltipBackground = babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2__["PlaneBuilder"].CreatePlane("", { size: 1, sideOrientation: babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2__["Mesh"].DOUBLESIDE }, this._backPlate._scene);
                var mat = new babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2__["StandardMaterial"]("", this._backPlate._scene);
                mat.diffuseColor = babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2__["Color3"].FromHexString("#212121");
                tooltipBackground.material = mat;
                tooltipBackground.isPickable = false;
                this._tooltipMesh.addChild(tooltipBackground);
                tooltipBackground.position.z = 0.05;
                this._tooltipMesh.scaling.y = 1 / 3;
                this._tooltipMesh.position.y = 0.7;
                this._tooltipMesh.position.z = -0.15;
                this._tooltipMesh.isPickable = false;
                this._tooltipMesh.parent = this._backPlate;
                // Create text texture for the tooltip
                this._tooltipTexture = _2D_advancedDynamicTexture__WEBPACK_IMPORTED_MODULE_7__["AdvancedDynamicTexture"].CreateForMesh(this._tooltipMesh);
                this._tooltipTextBlock = new _2D_controls_textBlock__WEBPACK_IMPORTED_MODULE_6__["TextBlock"]();
                this._tooltipTextBlock.scaleY = 3;
                this._tooltipTextBlock.color = "white";
                this._tooltipTextBlock.fontSize = 130;
                this._tooltipTexture.addControl(this._tooltipTextBlock);
                // Add hover action to tooltip
                this._tooltipFade = new babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2__["FadeInOutBehavior"]();
                this._tooltipFade.delay = 500;
                this._tooltipMesh.addBehavior(this._tooltipFade);
                this._tooltipHoverObserver = this.onPointerEnterObservable.add(function () {
                    if (_this._tooltipFade) {
                        _this._tooltipFade.fadeIn(true);
                    }
                });
                this._tooltipOutObserver = this.onPointerOutObservable.add(function () {
                    if (_this._tooltipFade) {
                        _this._tooltipFade.fadeIn(false);
                    }
                });
            }
            if (this._tooltipTextBlock) {
                this._tooltipTextBlock.text = text;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HolographicButton.prototype, "text", {
        /**
         * Gets or sets text for the button
         */
        get: function () {
            return this._text;
        },
        set: function (value) {
            if (this._text === value) {
                return;
            }
            this._text = value;
            this._rebuildContent();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HolographicButton.prototype, "imageUrl", {
        /**
         * Gets or sets the image url for the button
         */
        get: function () {
            return this._imageUrl;
        },
        set: function (value) {
            if (this._imageUrl === value) {
                return;
            }
            this._imageUrl = value;
            this._rebuildContent();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HolographicButton.prototype, "backMaterial", {
        /**
         * Gets the back material used by this button
         */
        get: function () {
            return this._backMaterial;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HolographicButton.prototype, "frontMaterial", {
        /**
         * Gets the front material used by this button
         */
        get: function () {
            return this._frontMaterial;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HolographicButton.prototype, "plateMaterial", {
        /**
         * Gets the plate material used by this button
         */
        get: function () {
            return this._plateMaterial;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HolographicButton.prototype, "shareMaterials", {
        /**
         * Gets a boolean indicating if this button shares its material with other HolographicButtons
         */
        get: function () {
            return this._shareMaterials;
        },
        enumerable: false,
        configurable: true
    });
    HolographicButton.prototype._getTypeName = function () {
        return "HolographicButton";
    };
    HolographicButton.prototype._rebuildContent = function () {
        this._disposeFacadeTexture();
        var panel = new _2D_controls_stackPanel__WEBPACK_IMPORTED_MODULE_4__["StackPanel"]();
        panel.isVertical = true;
        if (this._imageUrl) {
            var image = new _2D_controls_image__WEBPACK_IMPORTED_MODULE_5__["Image"]();
            image.source = this._imageUrl;
            image.paddingTop = "40px";
            image.height = "180px";
            image.width = "100px";
            image.paddingBottom = "40px";
            panel.addControl(image);
        }
        if (this._text) {
            var text = new _2D_controls_textBlock__WEBPACK_IMPORTED_MODULE_6__["TextBlock"]();
            text.text = this._text;
            text.color = "white";
            text.height = "30px";
            text.fontSize = 24;
            panel.addControl(text);
        }
        if (this._frontPlate) {
            this.content = panel;
        }
    };
    // Mesh association
    HolographicButton.prototype._createNode = function (scene) {
        this._backPlate = babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2__["BoxBuilder"].CreateBox(this.name + "BackMesh", {
            width: 1.0,
            height: 1.0,
            depth: 0.08
        }, scene);
        this._frontPlate = babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2__["BoxBuilder"].CreateBox(this.name + "FrontMesh", {
            width: 1.0,
            height: 1.0,
            depth: 0.08
        }, scene);
        this._frontPlate.parent = this._backPlate;
        this._frontPlate.position.z = -0.08;
        this._frontPlate.isPickable = false;
        this._frontPlate.setEnabled(false);
        this._textPlate = _super.prototype._createNode.call(this, scene);
        this._textPlate.parent = this._backPlate;
        this._textPlate.position.z = -0.08;
        this._textPlate.isPickable = false;
        return this._backPlate;
    };
    HolographicButton.prototype._applyFacade = function (facadeTexture) {
        this._plateMaterial.emissiveTexture = facadeTexture;
        this._plateMaterial.opacityTexture = facadeTexture;
    };
    HolographicButton.prototype._createBackMaterial = function (mesh) {
        var _this = this;
        this._backMaterial = new _materials_fluentMaterial__WEBPACK_IMPORTED_MODULE_3__["FluentMaterial"](this.name + "Back Material", mesh.getScene());
        this._backMaterial.renderHoverLight = true;
        this._pickedPointObserver = this._host.onPickedPointChangedObservable.add(function (pickedPoint) {
            if (pickedPoint) {
                _this._backMaterial.hoverPosition = pickedPoint;
                _this._backMaterial.hoverColor.a = 1.0;
            }
            else {
                _this._backMaterial.hoverColor.a = 0;
            }
        });
    };
    HolographicButton.prototype._createFrontMaterial = function (mesh) {
        this._frontMaterial = new _materials_fluentMaterial__WEBPACK_IMPORTED_MODULE_3__["FluentMaterial"](this.name + "Front Material", mesh.getScene());
        this._frontMaterial.innerGlowColorIntensity = 0; // No inner glow
        this._frontMaterial.alpha = 0.5; // Additive
        this._frontMaterial.renderBorders = true;
    };
    HolographicButton.prototype._createPlateMaterial = function (mesh) {
        this._plateMaterial = new babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2__["StandardMaterial"](this.name + "Plate Material", mesh.getScene());
        this._plateMaterial.specularColor = babylonjs_Materials_standardMaterial__WEBPACK_IMPORTED_MODULE_2__["Color3"].Black();
    };
    HolographicButton.prototype._affectMaterial = function (mesh) {
        // Back
        if (this._shareMaterials) {
            if (!this._host._sharedMaterials["backFluentMaterial"]) {
                this._createBackMaterial(mesh);
                this._host._sharedMaterials["backFluentMaterial"] = this._backMaterial;
            }
            else {
                this._backMaterial = this._host._sharedMaterials["backFluentMaterial"];
            }
            // Front
            if (!this._host._sharedMaterials["frontFluentMaterial"]) {
                this._createFrontMaterial(mesh);
                this._host._sharedMaterials["frontFluentMaterial"] = this._frontMaterial;
            }
            else {
                this._frontMaterial = this._host._sharedMaterials["frontFluentMaterial"];
            }
        }
        else {
            this._createBackMaterial(mesh);
            this._createFrontMaterial(mesh);
        }
        this._createPlateMaterial(mesh);
        this._backPlate.material = this._backMaterial;
        this._frontPlate.material = this._frontMaterial;
        this._textPlate.material = this._plateMaterial;
        this._rebuildContent();
    };
    /**
     * Releases all associated resources
     */
    HolographicButton.prototype.dispose = function () {
        _super.prototype.dispose.call(this); // will dispose main mesh ie. back plate
        this._disposeTooltip();
        if (!this.shareMaterials) {
            this._backMaterial.dispose();
            this._frontMaterial.dispose();
            this._plateMaterial.dispose();
            if (this._pickedPointObserver) {
                this._host.onPickedPointChangedObservable.remove(this._pickedPointObserver);
                this._pickedPointObserver = null;
            }
        }
    };
    return HolographicButton;
}(_button3D__WEBPACK_IMPORTED_MODULE_1__["Button3D"]));



/***/ }),

/***/ "./3D/controls/index.ts":
/*!******************************!*\
  !*** ./3D/controls/index.ts ***!
  \******************************/
/*! exports provided: AbstractButton3D, Button3D, Container3D, Control3D, CylinderPanel, HolographicButton, MeshButton3D, PlanePanel, ScatterPanel, SpherePanel, StackPanel3D, VolumeBasedPanel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _abstractButton3D__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstractButton3D */ "./3D/controls/abstractButton3D.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AbstractButton3D", function() { return _abstractButton3D__WEBPACK_IMPORTED_MODULE_0__["AbstractButton3D"]; });

/* harmony import */ var _button3D__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./button3D */ "./3D/controls/button3D.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Button3D", function() { return _button3D__WEBPACK_IMPORTED_MODULE_1__["Button3D"]; });

/* harmony import */ var _container3D__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./container3D */ "./3D/controls/container3D.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Container3D", function() { return _container3D__WEBPACK_IMPORTED_MODULE_2__["Container3D"]; });

/* harmony import */ var _control3D__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./control3D */ "./3D/controls/control3D.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Control3D", function() { return _control3D__WEBPACK_IMPORTED_MODULE_3__["Control3D"]; });

/* harmony import */ var _cylinderPanel__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./cylinderPanel */ "./3D/controls/cylinderPanel.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CylinderPanel", function() { return _cylinderPanel__WEBPACK_IMPORTED_MODULE_4__["CylinderPanel"]; });

/* harmony import */ var _holographicButton__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./holographicButton */ "./3D/controls/holographicButton.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "HolographicButton", function() { return _holographicButton__WEBPACK_IMPORTED_MODULE_5__["HolographicButton"]; });

/* harmony import */ var _meshButton3D__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./meshButton3D */ "./3D/controls/meshButton3D.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MeshButton3D", function() { return _meshButton3D__WEBPACK_IMPORTED_MODULE_6__["MeshButton3D"]; });

/* harmony import */ var _planePanel__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./planePanel */ "./3D/controls/planePanel.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "PlanePanel", function() { return _planePanel__WEBPACK_IMPORTED_MODULE_7__["PlanePanel"]; });

/* harmony import */ var _scatterPanel__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./scatterPanel */ "./3D/controls/scatterPanel.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScatterPanel", function() { return _scatterPanel__WEBPACK_IMPORTED_MODULE_8__["ScatterPanel"]; });

/* harmony import */ var _spherePanel__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./spherePanel */ "./3D/controls/spherePanel.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SpherePanel", function() { return _spherePanel__WEBPACK_IMPORTED_MODULE_9__["SpherePanel"]; });

/* harmony import */ var _stackPanel3D__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./stackPanel3D */ "./3D/controls/stackPanel3D.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StackPanel3D", function() { return _stackPanel3D__WEBPACK_IMPORTED_MODULE_10__["StackPanel3D"]; });

/* harmony import */ var _volumeBasedPanel__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./volumeBasedPanel */ "./3D/controls/volumeBasedPanel.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "VolumeBasedPanel", function() { return _volumeBasedPanel__WEBPACK_IMPORTED_MODULE_11__["VolumeBasedPanel"]; });















/***/ }),

/***/ "./3D/controls/meshButton3D.ts":
/*!*************************************!*\
  !*** ./3D/controls/meshButton3D.ts ***!
  \*************************************/
/*! exports provided: MeshButton3D */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MeshButton3D", function() { return MeshButton3D; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _button3D__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./button3D */ "./3D/controls/button3D.ts");


/**
 * Class used to create an interactable object. It's a 3D button using a mesh coming from the current scene
 */
var MeshButton3D = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(MeshButton3D, _super);
    /**
     * Creates a new 3D button based on a mesh
     * @param mesh mesh to become a 3D button
     * @param name defines the control name
     */
    function MeshButton3D(mesh, name) {
        var _this = _super.call(this, name) || this;
        _this._currentMesh = mesh;
        /**
         * Provides a default behavior on hover/out & up/down
         * Override those function to create your own desired behavior specific to your mesh
         */
        _this.pointerEnterAnimation = function () {
            if (!_this.mesh) {
                return;
            }
            _this.mesh.scaling.scaleInPlace(1.1);
        };
        _this.pointerOutAnimation = function () {
            if (!_this.mesh) {
                return;
            }
            _this.mesh.scaling.scaleInPlace(1.0 / 1.1);
        };
        _this.pointerDownAnimation = function () {
            if (!_this.mesh) {
                return;
            }
            _this.mesh.scaling.scaleInPlace(0.95);
        };
        _this.pointerUpAnimation = function () {
            if (!_this.mesh) {
                return;
            }
            _this.mesh.scaling.scaleInPlace(1.0 / 0.95);
        };
        return _this;
    }
    MeshButton3D.prototype._getTypeName = function () {
        return "MeshButton3D";
    };
    // Mesh association
    MeshButton3D.prototype._createNode = function (scene) {
        var _this = this;
        this._currentMesh.getChildMeshes().forEach(function (mesh) {
            mesh.metadata = _this;
        });
        return this._currentMesh;
    };
    MeshButton3D.prototype._affectMaterial = function (mesh) {
    };
    return MeshButton3D;
}(_button3D__WEBPACK_IMPORTED_MODULE_1__["Button3D"]));



/***/ }),

/***/ "./3D/controls/planePanel.ts":
/*!***********************************!*\
  !*** ./3D/controls/planePanel.ts ***!
  \***********************************/
/*! exports provided: PlanePanel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PlanePanel", function() { return PlanePanel; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Maths/math.vector */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _container3D__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./container3D */ "./3D/controls/container3D.ts");
/* harmony import */ var _volumeBasedPanel__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./volumeBasedPanel */ "./3D/controls/volumeBasedPanel.ts");




/**
 * Class used to create a container panel deployed on the surface of a plane
 */
var PlanePanel = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(PlanePanel, _super);
    function PlanePanel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PlanePanel.prototype._mapGridNode = function (control, nodePosition) {
        var mesh = control.mesh;
        if (!mesh) {
            return;
        }
        control.position = nodePosition.clone();
        var target = babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Vector3[0];
        target.copyFrom(nodePosition);
        switch (this.orientation) {
            case _container3D__WEBPACK_IMPORTED_MODULE_2__["Container3D"].FACEORIGIN_ORIENTATION:
            case _container3D__WEBPACK_IMPORTED_MODULE_2__["Container3D"].FACEFORWARD_ORIENTATION:
                target.addInPlace(new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Vector3"](0, 0, 1));
                mesh.lookAt(target);
                break;
            case _container3D__WEBPACK_IMPORTED_MODULE_2__["Container3D"].FACEFORWARDREVERSED_ORIENTATION:
            case _container3D__WEBPACK_IMPORTED_MODULE_2__["Container3D"].FACEORIGINREVERSED_ORIENTATION:
                target.addInPlace(new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Vector3"](0, 0, -1));
                mesh.lookAt(target);
                break;
        }
    };
    return PlanePanel;
}(_volumeBasedPanel__WEBPACK_IMPORTED_MODULE_3__["VolumeBasedPanel"]));



/***/ }),

/***/ "./3D/controls/scatterPanel.ts":
/*!*************************************!*\
  !*** ./3D/controls/scatterPanel.ts ***!
  \*************************************/
/*! exports provided: ScatterPanel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ScatterPanel", function() { return ScatterPanel; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/tools */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _volumeBasedPanel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./volumeBasedPanel */ "./3D/controls/volumeBasedPanel.ts");
/* harmony import */ var _container3D__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./container3D */ "./3D/controls/container3D.ts");





/**
 * Class used to create a container panel where items get randomized planar mapping
 */
var ScatterPanel = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(ScatterPanel, _super);
    function ScatterPanel() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._iteration = 100.0;
        return _this;
    }
    Object.defineProperty(ScatterPanel.prototype, "iteration", {
        /**
         * Gets or sets the number of iteration to use to scatter the controls (100 by default)
         */
        get: function () {
            return this._iteration;
        },
        set: function (value) {
            var _this = this;
            if (this._iteration === value) {
                return;
            }
            this._iteration = value;
            babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Tools"].SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: false,
        configurable: true
    });
    ScatterPanel.prototype._mapGridNode = function (control, nodePosition) {
        var mesh = control.mesh;
        var newPos = this._scatterMapping(nodePosition);
        if (!mesh) {
            return;
        }
        switch (this.orientation) {
            case _container3D__WEBPACK_IMPORTED_MODULE_3__["Container3D"].FACEORIGIN_ORIENTATION:
            case _container3D__WEBPACK_IMPORTED_MODULE_3__["Container3D"].FACEFORWARD_ORIENTATION:
                mesh.lookAt(new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"](0, 0, 1));
                break;
            case _container3D__WEBPACK_IMPORTED_MODULE_3__["Container3D"].FACEFORWARDREVERSED_ORIENTATION:
            case _container3D__WEBPACK_IMPORTED_MODULE_3__["Container3D"].FACEORIGINREVERSED_ORIENTATION:
                mesh.lookAt(new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"](0, 0, -1));
                break;
        }
        control.position = newPos;
    };
    ScatterPanel.prototype._scatterMapping = function (source) {
        source.x = (1.0 - Math.random() * 2.0) * this._cellWidth;
        source.y = (1.0 - Math.random() * 2.0) * this._cellHeight;
        return source;
    };
    ScatterPanel.prototype._finalProcessing = function () {
        var meshes = [];
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (!child.mesh) {
                continue;
            }
            meshes.push(child.mesh);
        }
        for (var count = 0; count < this._iteration; count++) {
            meshes.sort(function (a, b) {
                var distance1 = a.position.lengthSquared();
                var distance2 = b.position.lengthSquared();
                if (distance1 < distance2) {
                    return 1;
                }
                else if (distance1 > distance2) {
                    return -1;
                }
                return 0;
            });
            var radiusPaddingSquared = Math.pow(this.margin, 2.0);
            var cellSize = Math.max(this._cellWidth, this._cellHeight);
            var difference2D = babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Vector2[0];
            var difference = babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Vector3[0];
            for (var i = 0; i < meshes.length - 1; i++) {
                for (var j = i + 1; j < meshes.length; j++) {
                    if (i != j) {
                        meshes[j].position.subtractToRef(meshes[i].position, difference);
                        // Ignore Z axis
                        difference2D.x = difference.x;
                        difference2D.y = difference.y;
                        var combinedRadius = cellSize;
                        var distance = difference2D.lengthSquared() - radiusPaddingSquared;
                        var minSeparation = Math.min(distance, radiusPaddingSquared);
                        distance -= minSeparation;
                        if (distance < (Math.pow(combinedRadius, 2.0))) {
                            difference2D.normalize();
                            difference.scaleInPlace((combinedRadius - Math.sqrt(distance)) * 0.5);
                            meshes[j].position.addInPlace(difference);
                            meshes[i].position.subtractInPlace(difference);
                        }
                    }
                }
            }
        }
    };
    return ScatterPanel;
}(_volumeBasedPanel__WEBPACK_IMPORTED_MODULE_2__["VolumeBasedPanel"]));



/***/ }),

/***/ "./3D/controls/spherePanel.ts":
/*!************************************!*\
  !*** ./3D/controls/spherePanel.ts ***!
  \************************************/
/*! exports provided: SpherePanel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SpherePanel", function() { return SpherePanel; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/tools */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _volumeBasedPanel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./volumeBasedPanel */ "./3D/controls/volumeBasedPanel.ts");
/* harmony import */ var _container3D__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./container3D */ "./3D/controls/container3D.ts");






/**
 * Class used to create a container panel deployed on the surface of a sphere
 */
var SpherePanel = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(SpherePanel, _super);
    function SpherePanel() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._radius = 5.0;
        return _this;
    }
    Object.defineProperty(SpherePanel.prototype, "radius", {
        /**
         * Gets or sets the radius of the sphere where to project controls (5 by default)
         */
        get: function () {
            return this._radius;
        },
        set: function (value) {
            var _this = this;
            if (this._radius === value) {
                return;
            }
            this._radius = value;
            babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Tools"].SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: false,
        configurable: true
    });
    SpherePanel.prototype._mapGridNode = function (control, nodePosition) {
        var mesh = control.mesh;
        if (!mesh) {
            return;
        }
        var newPos = this._sphericalMapping(nodePosition);
        control.position = newPos;
        switch (this.orientation) {
            case _container3D__WEBPACK_IMPORTED_MODULE_3__["Container3D"].FACEORIGIN_ORIENTATION:
                mesh.lookAt(new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"](2 * newPos.x, 2 * newPos.y, 2 * newPos.z));
                break;
            case _container3D__WEBPACK_IMPORTED_MODULE_3__["Container3D"].FACEORIGINREVERSED_ORIENTATION:
                mesh.lookAt(new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"](-newPos.x, -newPos.y, -newPos.z));
                break;
            case _container3D__WEBPACK_IMPORTED_MODULE_3__["Container3D"].FACEFORWARD_ORIENTATION:
                break;
            case _container3D__WEBPACK_IMPORTED_MODULE_3__["Container3D"].FACEFORWARDREVERSED_ORIENTATION:
                mesh.rotate(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Axis"].Y, Math.PI, babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Space"].LOCAL);
                break;
        }
    };
    SpherePanel.prototype._sphericalMapping = function (source) {
        var newPos = new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"](0, 0, this._radius);
        var xAngle = (source.y / this._radius);
        var yAngle = -(source.x / this._radius);
        babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Matrix"].RotationYawPitchRollToRef(yAngle, xAngle, 0, babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Matrix[0]);
        return babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"].TransformNormal(newPos, babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Matrix[0]);
    };
    return SpherePanel;
}(_volumeBasedPanel__WEBPACK_IMPORTED_MODULE_2__["VolumeBasedPanel"]));



/***/ }),

/***/ "./3D/controls/stackPanel3D.ts":
/*!*************************************!*\
  !*** ./3D/controls/stackPanel3D.ts ***!
  \*************************************/
/*! exports provided: StackPanel3D */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "StackPanel3D", function() { return StackPanel3D; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/tools */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _container3D__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./container3D */ "./3D/controls/container3D.ts");




/**
 * Class used to create a stack panel in 3D on XY plane
 */
var StackPanel3D = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(StackPanel3D, _super);
    /**
     * Creates new StackPanel
     * @param isVertical
     */
    function StackPanel3D(isVertical) {
        if (isVertical === void 0) { isVertical = false; }
        var _this = _super.call(this) || this;
        _this._isVertical = false;
        /**
         * Gets or sets the distance between elements
         */
        _this.margin = 0.1;
        _this._isVertical = isVertical;
        return _this;
    }
    Object.defineProperty(StackPanel3D.prototype, "isVertical", {
        /**
         * Gets or sets a boolean indicating if the stack panel is vertical or horizontal (horizontal by default)
         */
        get: function () {
            return this._isVertical;
        },
        set: function (value) {
            var _this = this;
            if (this._isVertical === value) {
                return;
            }
            this._isVertical = value;
            babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Tools"].SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: false,
        configurable: true
    });
    StackPanel3D.prototype._arrangeChildren = function () {
        var width = 0;
        var height = 0;
        var controlCount = 0;
        var extendSizes = [];
        var currentInverseWorld = babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Matrix"].Invert(this.node.computeWorldMatrix(true));
        // Measure
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (!child.mesh) {
                continue;
            }
            controlCount++;
            child.mesh.computeWorldMatrix(true);
            child.mesh.getWorldMatrix().multiplyToRef(currentInverseWorld, babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Matrix[0]);
            var boundingBox = child.mesh.getBoundingInfo().boundingBox;
            var extendSize = babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"].TransformNormal(boundingBox.extendSize, babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Matrix[0]);
            extendSizes.push(extendSize);
            if (this._isVertical) {
                height += extendSize.y;
            }
            else {
                width += extendSize.x;
            }
        }
        if (this._isVertical) {
            height += (controlCount - 1) * this.margin / 2;
        }
        else {
            width += (controlCount - 1) * this.margin / 2;
        }
        // Arrange
        var offset;
        if (this._isVertical) {
            offset = -height;
        }
        else {
            offset = -width;
        }
        var index = 0;
        for (var _b = 0, _c = this._children; _b < _c.length; _b++) {
            var child = _c[_b];
            if (!child.mesh) {
                continue;
            }
            controlCount--;
            var extendSize = extendSizes[index++];
            if (this._isVertical) {
                child.position.y = offset + extendSize.y;
                child.position.x = 0;
                offset += extendSize.y * 2;
            }
            else {
                child.position.x = offset + extendSize.x;
                child.position.y = 0;
                offset += extendSize.x * 2;
            }
            offset += (controlCount > 0 ? this.margin : 0);
        }
    };
    return StackPanel3D;
}(_container3D__WEBPACK_IMPORTED_MODULE_2__["Container3D"]));



/***/ }),

/***/ "./3D/controls/volumeBasedPanel.ts":
/*!*****************************************!*\
  !*** ./3D/controls/volumeBasedPanel.ts ***!
  \*****************************************/
/*! exports provided: VolumeBasedPanel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "VolumeBasedPanel", function() { return VolumeBasedPanel; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/tools */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _container3D__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./container3D */ "./3D/controls/container3D.ts");




/**
 * Abstract class used to create a container panel deployed on the surface of a volume
 */
var VolumeBasedPanel = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(VolumeBasedPanel, _super);
    /**
     * Creates new VolumeBasedPanel
     */
    function VolumeBasedPanel() {
        var _this = _super.call(this) || this;
        _this._columns = 10;
        _this._rows = 0;
        _this._rowThenColum = true;
        _this._orientation = _container3D__WEBPACK_IMPORTED_MODULE_2__["Container3D"].FACEORIGIN_ORIENTATION;
        /**
         * Gets or sets the distance between elements
         */
        _this.margin = 0;
        return _this;
    }
    Object.defineProperty(VolumeBasedPanel.prototype, "orientation", {
        /**
         * Gets or sets the orientation to apply to all controls (BABYLON.Container3D.FaceOriginReversedOrientation by default)
        * | Value | Type                                | Description |
        * | ----- | ----------------------------------- | ----------- |
        * | 0     | UNSET_ORIENTATION                   |  Control rotation will remain unchanged |
        * | 1     | FACEORIGIN_ORIENTATION              |  Control will rotate to make it look at sphere central axis |
        * | 2     | FACEORIGINREVERSED_ORIENTATION      |  Control will rotate to make it look back at sphere central axis |
        * | 3     | FACEFORWARD_ORIENTATION             |  Control will rotate to look at z axis (0, 0, 1) |
        * | 4     | FACEFORWARDREVERSED_ORIENTATION     |  Control will rotate to look at negative z axis (0, 0, -1) |
         */
        get: function () {
            return this._orientation;
        },
        set: function (value) {
            var _this = this;
            if (this._orientation === value) {
                return;
            }
            this._orientation = value;
            babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Tools"].SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VolumeBasedPanel.prototype, "columns", {
        /**
         * Gets or sets the number of columns requested (10 by default).
         * The panel will automatically compute the number of rows based on number of child controls.
         */
        get: function () {
            return this._columns;
        },
        set: function (value) {
            var _this = this;
            if (this._columns === value) {
                return;
            }
            this._columns = value;
            this._rowThenColum = true;
            babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Tools"].SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VolumeBasedPanel.prototype, "rows", {
        /**
         * Gets or sets a the number of rows requested.
         * The panel will automatically compute the number of columns based on number of child controls.
         */
        get: function () {
            return this._rows;
        },
        set: function (value) {
            var _this = this;
            if (this._rows === value) {
                return;
            }
            this._rows = value;
            this._rowThenColum = false;
            babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Tools"].SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: false,
        configurable: true
    });
    VolumeBasedPanel.prototype._arrangeChildren = function () {
        this._cellWidth = 0;
        this._cellHeight = 0;
        var rows = 0;
        var columns = 0;
        var controlCount = 0;
        var currentInverseWorld = babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Matrix"].Invert(this.node.computeWorldMatrix(true));
        // Measure
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (!child.mesh) {
                continue;
            }
            controlCount++;
            child.mesh.computeWorldMatrix(true);
            //   child.mesh.getWorldMatrix().multiplyToRef(currentInverseWorld, Tmp.Matrix[0]);
            var boundingBox = child.mesh.getHierarchyBoundingVectors();
            var extendSize = babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Vector3[0];
            var diff = babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Vector3[1];
            boundingBox.max.subtractToRef(boundingBox.min, diff);
            diff.scaleInPlace(0.5);
            babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"].TransformNormalToRef(diff, currentInverseWorld, extendSize);
            this._cellWidth = Math.max(this._cellWidth, extendSize.x * 2);
            this._cellHeight = Math.max(this._cellHeight, extendSize.y * 2);
        }
        this._cellWidth += this.margin * 2;
        this._cellHeight += this.margin * 2;
        // Arrange
        if (this._rowThenColum) {
            columns = this._columns;
            rows = Math.ceil(controlCount / this._columns);
        }
        else {
            rows = this._rows;
            columns = Math.ceil(controlCount / this._rows);
        }
        var startOffsetX = (columns * 0.5) * this._cellWidth;
        var startOffsetY = (rows * 0.5) * this._cellHeight;
        var nodeGrid = [];
        var cellCounter = 0;
        if (this._rowThenColum) {
            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < columns; c++) {
                    nodeGrid.push(new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"]((c * this._cellWidth) - startOffsetX + this._cellWidth / 2, (r * this._cellHeight) - startOffsetY + this._cellHeight / 2, 0));
                    cellCounter++;
                    if (cellCounter > controlCount) {
                        break;
                    }
                }
            }
        }
        else {
            for (var c = 0; c < columns; c++) {
                for (var r = 0; r < rows; r++) {
                    nodeGrid.push(new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_1__["Vector3"]((c * this._cellWidth) - startOffsetX + this._cellWidth / 2, (r * this._cellHeight) - startOffsetY + this._cellHeight / 2, 0));
                    cellCounter++;
                    if (cellCounter > controlCount) {
                        break;
                    }
                }
            }
        }
        cellCounter = 0;
        for (var _b = 0, _c = this._children; _b < _c.length; _b++) {
            var child = _c[_b];
            if (!child.mesh) {
                continue;
            }
            this._mapGridNode(child, nodeGrid[cellCounter]);
            cellCounter++;
        }
        this._finalProcessing();
    };
    /** Child classes can implement this function to provide additional processing */
    VolumeBasedPanel.prototype._finalProcessing = function () {
    };
    return VolumeBasedPanel;
}(_container3D__WEBPACK_IMPORTED_MODULE_2__["Container3D"]));



/***/ }),

/***/ "./3D/gui3DManager.ts":
/*!****************************!*\
  !*** ./3D/gui3DManager.ts ***!
  \****************************/
/*! exports provided: GUI3DManager */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GUI3DManager", function() { return GUI3DManager; });
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _controls_container3D__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./controls/container3D */ "./3D/controls/container3D.ts");







/**
 * Class used to manage 3D user interface
 * @see https://doc.babylonjs.com/how_to/gui3d
 */
var GUI3DManager = /** @class */ (function () {
    /**
     * Creates a new GUI3DManager
     * @param scene
     */
    function GUI3DManager(scene) {
        var _this = this;
        /** @hidden */
        this._lastControlOver = {};
        /** @hidden */
        this._lastControlDown = {};
        /**
         * Observable raised when the point picked by the pointer events changed
         */
        this.onPickedPointChangedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        // Shared resources
        /** @hidden */
        this._sharedMaterials = {};
        this._scene = scene || babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["EngineStore"].LastCreatedScene;
        this._sceneDisposeObserver = this._scene.onDisposeObservable.add(function () {
            _this._sceneDisposeObserver = null;
            _this._utilityLayer = null;
            _this.dispose();
        });
        this._utilityLayer = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["UtilityLayerRenderer"](this._scene);
        this._utilityLayer.onlyCheckPointerDownEvents = false;
        this._utilityLayer.pickUtilitySceneFirst = false;
        this._utilityLayer.mainSceneTrackerPredicate = function (mesh) {
            return mesh && mesh.metadata && mesh.metadata._node;
        };
        // Root
        this._rootContainer = new _controls_container3D__WEBPACK_IMPORTED_MODULE_1__["Container3D"]("RootContainer");
        this._rootContainer._host = this;
        var utilityLayerScene = this._utilityLayer.utilityLayerScene;
        // Events
        this._pointerOutObserver = this._utilityLayer.onPointerOutObservable.add(function (pointerId) {
            _this._handlePointerOut(pointerId, true);
        });
        this._pointerObserver = utilityLayerScene.onPointerObservable.add(function (pi, state) {
            _this._doPicking(pi);
        });
        // Scene
        this._utilityLayer.utilityLayerScene.autoClear = false;
        this._utilityLayer.utilityLayerScene.autoClearDepthAndStencil = false;
        new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["HemisphericLight"]("hemi", babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Up(), this._utilityLayer.utilityLayerScene);
    }
    Object.defineProperty(GUI3DManager.prototype, "scene", {
        /** Gets the hosting scene */
        get: function () {
            return this._scene;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GUI3DManager.prototype, "utilityLayer", {
        /** Gets associated utility layer */
        get: function () {
            return this._utilityLayer;
        },
        enumerable: false,
        configurable: true
    });
    GUI3DManager.prototype._handlePointerOut = function (pointerId, isPointerUp) {
        var previousControlOver = this._lastControlOver[pointerId];
        if (previousControlOver) {
            previousControlOver._onPointerOut(previousControlOver);
            delete this._lastControlOver[pointerId];
        }
        if (isPointerUp) {
            if (this._lastControlDown[pointerId]) {
                this._lastControlDown[pointerId].forcePointerUp();
                delete this._lastControlDown[pointerId];
            }
        }
        this.onPickedPointChangedObservable.notifyObservers(null);
    };
    GUI3DManager.prototype._doPicking = function (pi) {
        if (!this._utilityLayer || !this._utilityLayer.shouldRender || !this._utilityLayer.utilityLayerScene.activeCamera) {
            return false;
        }
        var pointerEvent = (pi.event);
        var pointerId = pointerEvent.pointerId || 0;
        var buttonIndex = pointerEvent.button;
        var pickingInfo = pi.pickInfo;
        if (!pickingInfo || !pickingInfo.hit) {
            this._handlePointerOut(pointerId, pi.type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["PointerEventTypes"].POINTERUP);
            return false;
        }
        var control = (pickingInfo.pickedMesh.metadata);
        if (pickingInfo.pickedPoint) {
            this.onPickedPointChangedObservable.notifyObservers(pickingInfo.pickedPoint);
        }
        if (!control._processObservables(pi.type, pickingInfo.pickedPoint, pointerId, buttonIndex)) {
            if (pi.type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["PointerEventTypes"].POINTERMOVE) {
                if (this._lastControlOver[pointerId]) {
                    this._lastControlOver[pointerId]._onPointerOut(this._lastControlOver[pointerId]);
                }
                delete this._lastControlOver[pointerId];
            }
        }
        if (pi.type === babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["PointerEventTypes"].POINTERUP) {
            if (this._lastControlDown[pointerEvent.pointerId]) {
                this._lastControlDown[pointerEvent.pointerId].forcePointerUp();
                delete this._lastControlDown[pointerEvent.pointerId];
            }
            if (pointerEvent.pointerType === "touch") {
                this._handlePointerOut(pointerId, false);
            }
        }
        return true;
    };
    Object.defineProperty(GUI3DManager.prototype, "rootContainer", {
        /**
         * Gets the root container
         */
        get: function () {
            return this._rootContainer;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Gets a boolean indicating if the given control is in the root child list
     * @param control defines the control to check
     * @returns true if the control is in the root child list
     */
    GUI3DManager.prototype.containsControl = function (control) {
        return this._rootContainer.containsControl(control);
    };
    /**
     * Adds a control to the root child list
     * @param control defines the control to add
     * @returns the current manager
     */
    GUI3DManager.prototype.addControl = function (control) {
        this._rootContainer.addControl(control);
        return this;
    };
    /**
     * Removes a control from the root child list
     * @param control defines the control to remove
     * @returns the current container
     */
    GUI3DManager.prototype.removeControl = function (control) {
        this._rootContainer.removeControl(control);
        return this;
    };
    /**
     * Releases all associated resources
     */
    GUI3DManager.prototype.dispose = function () {
        this._rootContainer.dispose();
        for (var materialName in this._sharedMaterials) {
            if (!this._sharedMaterials.hasOwnProperty(materialName)) {
                continue;
            }
            this._sharedMaterials[materialName].dispose();
        }
        this._sharedMaterials = {};
        if (this._pointerOutObserver && this._utilityLayer) {
            this._utilityLayer.onPointerOutObservable.remove(this._pointerOutObserver);
            this._pointerOutObserver = null;
        }
        this.onPickedPointChangedObservable.clear();
        var utilityLayerScene = this._utilityLayer ? this._utilityLayer.utilityLayerScene : null;
        if (utilityLayerScene) {
            if (this._pointerObserver) {
                utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
                this._pointerObserver = null;
            }
        }
        if (this._scene) {
            if (this._sceneDisposeObserver) {
                this._scene.onDisposeObservable.remove(this._sceneDisposeObserver);
                this._sceneDisposeObserver = null;
            }
        }
        if (this._utilityLayer) {
            this._utilityLayer.dispose();
        }
    };
    return GUI3DManager;
}());



/***/ }),

/***/ "./3D/index.ts":
/*!*********************!*\
  !*** ./3D/index.ts ***!
  \*********************/
/*! exports provided: AbstractButton3D, Button3D, Container3D, Control3D, CylinderPanel, HolographicButton, MeshButton3D, PlanePanel, ScatterPanel, SpherePanel, StackPanel3D, VolumeBasedPanel, FluentMaterialDefines, FluentMaterial, GUI3DManager, Vector3WithInfo */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _controls__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./controls */ "./3D/controls/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AbstractButton3D", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["AbstractButton3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Button3D", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Button3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Container3D", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Container3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Control3D", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["Control3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CylinderPanel", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["CylinderPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "HolographicButton", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["HolographicButton"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MeshButton3D", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["MeshButton3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "PlanePanel", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["PlanePanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScatterPanel", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["ScatterPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SpherePanel", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["SpherePanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StackPanel3D", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["StackPanel3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "VolumeBasedPanel", function() { return _controls__WEBPACK_IMPORTED_MODULE_0__["VolumeBasedPanel"]; });

/* harmony import */ var _materials__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./materials */ "./3D/materials/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FluentMaterialDefines", function() { return _materials__WEBPACK_IMPORTED_MODULE_1__["FluentMaterialDefines"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FluentMaterial", function() { return _materials__WEBPACK_IMPORTED_MODULE_1__["FluentMaterial"]; });

/* harmony import */ var _gui3DManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./gui3DManager */ "./3D/gui3DManager.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GUI3DManager", function() { return _gui3DManager__WEBPACK_IMPORTED_MODULE_2__["GUI3DManager"]; });

/* harmony import */ var _vector3WithInfo__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./vector3WithInfo */ "./3D/vector3WithInfo.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Vector3WithInfo", function() { return _vector3WithInfo__WEBPACK_IMPORTED_MODULE_3__["Vector3WithInfo"]; });







/***/ }),

/***/ "./3D/materials/fluentMaterial.ts":
/*!****************************************!*\
  !*** ./3D/materials/fluentMaterial.ts ***!
  \****************************************/
/*! exports provided: FluentMaterialDefines, FluentMaterial */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FluentMaterialDefines", function() { return FluentMaterialDefines; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FluentMaterial", function() { return FluentMaterial; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Misc/decorators */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _shaders_fluent_vertex__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./shaders/fluent.vertex */ "./3D/materials/shaders/fluent.vertex.ts");
/* harmony import */ var _shaders_fluent_fragment__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./shaders/fluent.fragment */ "./3D/materials/shaders/fluent.fragment.ts");











/** @hidden */
var FluentMaterialDefines = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(FluentMaterialDefines, _super);
    function FluentMaterialDefines() {
        var _this = _super.call(this) || this;
        _this.INNERGLOW = false;
        _this.BORDER = false;
        _this.HOVERLIGHT = false;
        _this.TEXTURE = false;
        _this.rebuild();
        return _this;
    }
    return FluentMaterialDefines;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialDefines"]));

/**
 * Class used to render controls with fluent desgin
 */
var FluentMaterial = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(FluentMaterial, _super);
    /**
     * Creates a new Fluent material
     * @param name defines the name of the material
     * @param scene defines the hosting scene
     */
    function FluentMaterial(name, scene) {
        var _this = _super.call(this, name, scene) || this;
        /**
         * Gets or sets inner glow intensity. A value of 0 means no glow (default is 0.5)
         */
        _this.innerGlowColorIntensity = 0.5;
        /**
         * Gets or sets the inner glow color (white by default)
         */
        _this.innerGlowColor = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](1.0, 1.0, 1.0);
        /**
         * Gets or sets the albedo color (Default is Color3(0.3, 0.35, 0.4))
         */
        _this.albedoColor = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color3"](0.3, 0.35, 0.4);
        /**
         * Gets or sets a boolean indicating if borders must be rendered (default is false)
         */
        _this.renderBorders = false;
        /**
         * Gets or sets border width (default is 0.5)
         */
        _this.borderWidth = 0.5;
        /**
         * Gets or sets a value indicating the smoothing value applied to border edges (0.02 by default)
         */
        _this.edgeSmoothingValue = 0.02;
        /**
         * Gets or sets the minimum value that can be applied to border width (default is 0.1)
         */
        _this.borderMinValue = 0.1;
        /**
         * Gets or sets a boolean indicating if hover light must be rendered (default is false)
         */
        _this.renderHoverLight = false;
        /**
         * Gets or sets the radius used to render the hover light (default is 1.0)
         */
        _this.hoverRadius = 1.0;
        /**
         * Gets or sets the color used to render the hover light (default is Color4(0.3, 0.3, 0.3, 1.0))
         */
        _this.hoverColor = new babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Color4"](0.3, 0.3, 0.3, 1.0);
        /**
         * Gets or sets the hover light position in world space (default is Vector3.Zero())
         */
        _this.hoverPosition = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["Vector3"].Zero();
        return _this;
    }
    FluentMaterial.prototype.needAlphaBlending = function () {
        return this.alpha !== 1.0;
    };
    FluentMaterial.prototype.needAlphaTesting = function () {
        return false;
    };
    FluentMaterial.prototype.getAlphaTestTexture = function () {
        return null;
    };
    FluentMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
        if (this.isFrozen) {
            if (subMesh.effect && subMesh.effect._wasPreviouslyReady) {
                return true;
            }
        }
        if (!subMesh._materialDefines) {
            subMesh._materialDefines = new FluentMaterialDefines();
        }
        var scene = this.getScene();
        var defines = subMesh._materialDefines;
        if (!this.checkReadyOnEveryCall && subMesh.effect) {
            if (defines._renderId === scene.getRenderId()) {
                return true;
            }
        }
        if (defines._areTexturesDirty) {
            defines.INNERGLOW = this.innerGlowColorIntensity > 0;
            defines.BORDER = this.renderBorders;
            defines.HOVERLIGHT = this.renderHoverLight;
            if (this._albedoTexture) {
                if (!this._albedoTexture.isReadyOrNotBlocking()) {
                    return false;
                }
                else {
                    defines.TEXTURE = true;
                }
            }
            else {
                defines.TEXTURE = false;
            }
        }
        var engine = scene.getEngine();
        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();
            //Attributes
            var attribs = [babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].PositionKind];
            attribs.push(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].NormalKind);
            attribs.push(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UVKind);
            var shaderName = "fluent";
            var uniforms = ["world", "viewProjection", "innerGlowColor", "albedoColor", "borderWidth", "edgeSmoothingValue", "scaleFactor", "borderMinValue",
                "hoverColor", "hoverPosition", "hoverRadius"
            ];
            var samplers = ["albedoSampler"];
            var uniformBuffers = new Array();
            babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["MaterialHelper"].PrepareUniformsAndSamplersList({
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: 4
            });
            var join = defines.toString();
            subMesh.setEffect(scene.getEngine().createEffect(shaderName, {
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: join,
                fallbacks: null,
                onCompiled: this.onCompiled,
                onError: this.onError,
                indexParameters: { maxSimultaneousLights: 4 }
            }, engine));
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }
        defines._renderId = scene.getRenderId();
        subMesh.effect._wasPreviouslyReady = true;
        return true;
    };
    FluentMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
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
        if (this._mustRebind(scene, effect)) {
            this._activeEffect.setColor4("albedoColor", this.albedoColor, this.alpha);
            if (defines.INNERGLOW) {
                this._activeEffect.setColor4("innerGlowColor", this.innerGlowColor, this.innerGlowColorIntensity);
            }
            if (defines.BORDER) {
                this._activeEffect.setFloat("borderWidth", this.borderWidth);
                this._activeEffect.setFloat("edgeSmoothingValue", this.edgeSmoothingValue);
                this._activeEffect.setFloat("borderMinValue", this.borderMinValue);
                mesh.getBoundingInfo().boundingBox.extendSize.multiplyToRef(mesh.scaling, babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Vector3[0]);
                this._activeEffect.setVector3("scaleFactor", babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["TmpVectors"].Vector3[0]);
            }
            if (defines.HOVERLIGHT) {
                this._activeEffect.setDirectColor4("hoverColor", this.hoverColor);
                this._activeEffect.setFloat("hoverRadius", this.hoverRadius);
                this._activeEffect.setVector3("hoverPosition", this.hoverPosition);
            }
            if (defines.TEXTURE) {
                this._activeEffect.setTexture("albedoSampler", this._albedoTexture);
            }
        }
        this._afterBind(mesh, this._activeEffect);
    };
    FluentMaterial.prototype.getActiveTextures = function () {
        var activeTextures = _super.prototype.getActiveTextures.call(this);
        return activeTextures;
    };
    FluentMaterial.prototype.hasTexture = function (texture) {
        if (_super.prototype.hasTexture.call(this, texture)) {
            return true;
        }
        return false;
    };
    FluentMaterial.prototype.dispose = function (forceDisposeEffect) {
        _super.prototype.dispose.call(this, forceDisposeEffect);
    };
    FluentMaterial.prototype.clone = function (name) {
        var _this = this;
        return babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Clone(function () { return new FluentMaterial(name, _this.getScene()); }, this);
    };
    FluentMaterial.prototype.serialize = function () {
        var serializationObject = babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Serialize(this);
        serializationObject.customType = "BABYLON.GUI.FluentMaterial";
        return serializationObject;
    };
    FluentMaterial.prototype.getClassName = function () {
        return "FluentMaterial";
    };
    // Statics
    FluentMaterial.Parse = function (source, scene, rootUrl) {
        return babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["SerializationHelper"].Parse(function () { return new FluentMaterial(source.name, scene); }, source, scene, rootUrl);
    };
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])(),
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["expandToProperty"])("_markAllSubMeshesAsTexturesDirty")
    ], FluentMaterial.prototype, "innerGlowColorIntensity", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsColor3"])()
    ], FluentMaterial.prototype, "innerGlowColor", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsColor3"])()
    ], FluentMaterial.prototype, "albedoColor", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])(),
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["expandToProperty"])("_markAllSubMeshesAsTexturesDirty")
    ], FluentMaterial.prototype, "renderBorders", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], FluentMaterial.prototype, "borderWidth", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], FluentMaterial.prototype, "edgeSmoothingValue", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], FluentMaterial.prototype, "borderMinValue", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])(),
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["expandToProperty"])("_markAllSubMeshesAsTexturesDirty")
    ], FluentMaterial.prototype, "renderHoverLight", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serialize"])()
    ], FluentMaterial.prototype, "hoverRadius", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsColor4"])()
    ], FluentMaterial.prototype, "hoverColor", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsVector3"])()
    ], FluentMaterial.prototype, "hoverPosition", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["serializeAsTexture"])("albedoTexture")
    ], FluentMaterial.prototype, "_albedoTexture", void 0);
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["expandToProperty"])("_markAllSubMeshesAsTexturesAndMiscDirty")
    ], FluentMaterial.prototype, "albedoTexture", void 0);
    return FluentMaterial;
}(babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["PushMaterial"]));

babylonjs_Misc_decorators__WEBPACK_IMPORTED_MODULE_1__["_TypeStore"].RegisteredTypes["BABYLON.GUI.FluentMaterial"] = FluentMaterial;


/***/ }),

/***/ "./3D/materials/index.ts":
/*!*******************************!*\
  !*** ./3D/materials/index.ts ***!
  \*******************************/
/*! exports provided: FluentMaterialDefines, FluentMaterial */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _fluentMaterial__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./fluentMaterial */ "./3D/materials/fluentMaterial.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FluentMaterialDefines", function() { return _fluentMaterial__WEBPACK_IMPORTED_MODULE_0__["FluentMaterialDefines"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FluentMaterial", function() { return _fluentMaterial__WEBPACK_IMPORTED_MODULE_0__["FluentMaterial"]; });




/***/ }),

/***/ "./3D/materials/shaders/fluent.fragment.ts":
/*!*************************************************!*\
  !*** ./3D/materials/shaders/fluent.fragment.ts ***!
  \*************************************************/
/*! exports provided: fluentPixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "fluentPixelShader", function() { return fluentPixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'fluentPixelShader';
var shader = "precision highp float;\nvarying vec2 vUV;\nuniform vec4 albedoColor;\n#ifdef INNERGLOW\nuniform vec4 innerGlowColor;\n#endif\n#ifdef BORDER\nvarying vec2 scaleInfo;\nuniform float edgeSmoothingValue;\nuniform float borderMinValue;\n#endif\n#ifdef HOVERLIGHT\nvarying vec3 worldPosition;\nuniform vec3 hoverPosition;\nuniform vec4 hoverColor;\nuniform float hoverRadius;\n#endif\n#ifdef TEXTURE\nuniform sampler2D albedoSampler;\n#endif\nvoid main(void) {\nvec3 albedo=albedoColor.rgb;\nfloat alpha=albedoColor.a;\n#ifdef TEXTURE\nalbedo=texture2D(albedoSampler,vUV).rgb;\n#endif\n#ifdef HOVERLIGHT\nfloat pointToHover=(1.0-clamp(length(hoverPosition-worldPosition)/hoverRadius,0.,1.))*hoverColor.a;\nalbedo=clamp(albedo+hoverColor.rgb*pointToHover,0.,1.);\n#else\nfloat pointToHover=1.0;\n#endif\n#ifdef BORDER\nfloat borderPower=10.0;\nfloat inverseBorderPower=1.0/borderPower;\nvec3 borderColor=albedo*borderPower;\nvec2 distanceToEdge;\ndistanceToEdge.x=abs(vUV.x-0.5)*2.0;\ndistanceToEdge.y=abs(vUV.y-0.5)*2.0;\nfloat borderValue=max(smoothstep(scaleInfo.x-edgeSmoothingValue,scaleInfo.x+edgeSmoothingValue,distanceToEdge.x),\nsmoothstep(scaleInfo.y-edgeSmoothingValue,scaleInfo.y+edgeSmoothingValue,distanceToEdge.y));\nborderColor=borderColor*borderValue*max(borderMinValue*inverseBorderPower,pointToHover);\nalbedo+=borderColor;\nalpha=max(alpha,borderValue);\n#endif\n#ifdef INNERGLOW\n\nvec2 uvGlow=(vUV-vec2(0.5,0.5))*(innerGlowColor.a*2.0);\nuvGlow=uvGlow*uvGlow;\nuvGlow=uvGlow*uvGlow;\nalbedo+=mix(vec3(0.0,0.0,0.0),innerGlowColor.rgb,uvGlow.x+uvGlow.y);\n#endif\ngl_FragColor=vec4(albedo,alpha);\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var fluentPixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./3D/materials/shaders/fluent.vertex.ts":
/*!***********************************************!*\
  !*** ./3D/materials/shaders/fluent.vertex.ts ***!
  \***********************************************/
/*! exports provided: fluentVertexShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "fluentVertexShader", function() { return fluentVertexShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'fluentVertexShader';
var shader = "precision highp float;\n\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec2 uv;\n\nuniform mat4 world;\nuniform mat4 viewProjection;\nvarying vec2 vUV;\n#ifdef BORDER\nvarying vec2 scaleInfo;\nuniform float borderWidth;\nuniform vec3 scaleFactor;\n#endif\n#ifdef HOVERLIGHT\nvarying vec3 worldPosition;\n#endif\nvoid main(void) {\nvUV=uv;\n#ifdef BORDER\nvec3 scale=scaleFactor;\nfloat minScale=min(min(scale.x,scale.y),scale.z);\nfloat maxScale=max(max(scale.x,scale.y),scale.z);\nfloat minOverMiddleScale=minScale/(scale.x+scale.y+scale.z-minScale-maxScale);\nfloat areaYZ=scale.y*scale.z;\nfloat areaXZ=scale.x*scale.z;\nfloat areaXY=scale.x*scale.y;\nfloat scaledBorderWidth=borderWidth;\nif (abs(normal.x) == 1.0)\n{\nscale.x=scale.y;\nscale.y=scale.z;\nif (areaYZ>areaXZ && areaYZ>areaXY)\n{\nscaledBorderWidth*=minOverMiddleScale;\n}\n}\nelse if (abs(normal.y) == 1.0)\n{\nscale.x=scale.z;\nif (areaXZ>areaXY && areaXZ>areaYZ)\n{\nscaledBorderWidth*=minOverMiddleScale;\n}\n}\nelse\n{\nif (areaXY>areaYZ && areaXY>areaXZ)\n{\nscaledBorderWidth*=minOverMiddleScale;\n}\n}\nfloat scaleRatio=min(scale.x,scale.y)/max(scale.x,scale.y);\nif (scale.x>scale.y)\n{\nscaleInfo.x=1.0-(scaledBorderWidth*scaleRatio);\nscaleInfo.y=1.0-scaledBorderWidth;\n}\nelse\n{\nscaleInfo.x=1.0-scaledBorderWidth;\nscaleInfo.y=1.0-(scaledBorderWidth*scaleRatio);\n}\n#endif\nvec4 worldPos=world*vec4(position,1.0);\n#ifdef HOVERLIGHT\nworldPosition=worldPos.xyz;\n#endif\ngl_Position=viewProjection*worldPos;\n}\n";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var fluentVertexShader = { name: name, shader: shader };


/***/ }),

/***/ "./3D/vector3WithInfo.ts":
/*!*******************************!*\
  !*** ./3D/vector3WithInfo.ts ***!
  \*******************************/
/*! exports provided: Vector3WithInfo */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Vector3WithInfo", function() { return Vector3WithInfo; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Maths/math.vector */ "babylonjs/Misc/perfCounter");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Class used to transport Vector3 information for pointer events
 */
var Vector3WithInfo = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(Vector3WithInfo, _super);
    /**
     * Creates a new Vector3WithInfo
     * @param source defines the vector3 data to transport
     * @param buttonIndex defines the current mouse button index
     */
    function Vector3WithInfo(source, 
    /** defines the current mouse button index */
    buttonIndex) {
        if (buttonIndex === void 0) { buttonIndex = 0; }
        var _this = _super.call(this, source.x, source.y, source.z) || this;
        _this.buttonIndex = buttonIndex;
        return _this;
    }
    return Vector3WithInfo;
}(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_1__["Vector3"]));



/***/ }),

/***/ "./index.ts":
/*!******************!*\
  !*** ./index.ts ***!
  \******************/
/*! exports provided: Button, Checkbox, ColorPicker, Container, Control, Ellipse, Grid, Image, InputText, InputPassword, Line, MultiLine, RadioButton, StackPanel, SelectorGroup, CheckboxGroup, RadioGroup, SliderGroup, SelectionPanel, ScrollViewer, TextWrapping, TextBlock, KeyPropertySet, VirtualKeyboard, Rectangle, DisplayGrid, BaseSlider, Slider, ImageBasedSlider, ScrollBar, ImageScrollBar, name, AdvancedDynamicTexture, AdvancedDynamicTextureInstrumentation, Vector2WithInfo, Matrix2D, Measure, MultiLinePoint, Style, ValueAndUnit, XmlLoader, AbstractButton3D, Button3D, Container3D, Control3D, CylinderPanel, HolographicButton, MeshButton3D, PlanePanel, ScatterPanel, SpherePanel, StackPanel3D, VolumeBasedPanel, FluentMaterialDefines, FluentMaterial, GUI3DManager, Vector3WithInfo */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _2D__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./2D */ "./2D/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Button", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Button"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Checkbox", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Checkbox"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ColorPicker", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["ColorPicker"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Container", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Container"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Control", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Control"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Ellipse", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Ellipse"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Grid", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Grid"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Image", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Image"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InputText", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["InputText"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InputPassword", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["InputPassword"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Line", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Line"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MultiLine", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["MultiLine"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RadioButton", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["RadioButton"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StackPanel", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["StackPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SelectorGroup", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["SelectorGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CheckboxGroup", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["CheckboxGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RadioGroup", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["RadioGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SliderGroup", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["SliderGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SelectionPanel", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["SelectionPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScrollViewer", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["ScrollViewer"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TextWrapping", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["TextWrapping"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TextBlock", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["TextBlock"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KeyPropertySet", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["KeyPropertySet"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "VirtualKeyboard", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["VirtualKeyboard"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Rectangle", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Rectangle"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DisplayGrid", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["DisplayGrid"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BaseSlider", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["BaseSlider"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Slider", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Slider"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ImageBasedSlider", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["ImageBasedSlider"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScrollBar", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["ScrollBar"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ImageScrollBar", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["ImageScrollBar"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "name", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["name"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AdvancedDynamicTexture", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["AdvancedDynamicTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AdvancedDynamicTextureInstrumentation", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["AdvancedDynamicTextureInstrumentation"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Vector2WithInfo", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Vector2WithInfo"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Matrix2D", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Matrix2D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Measure", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Measure"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MultiLinePoint", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["MultiLinePoint"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Style", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["Style"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ValueAndUnit", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["ValueAndUnit"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "XmlLoader", function() { return _2D__WEBPACK_IMPORTED_MODULE_0__["XmlLoader"]; });

/* harmony import */ var _3D__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./3D */ "./3D/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AbstractButton3D", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["AbstractButton3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Button3D", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["Button3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Container3D", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["Container3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Control3D", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["Control3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CylinderPanel", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["CylinderPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "HolographicButton", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["HolographicButton"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MeshButton3D", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["MeshButton3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "PlanePanel", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["PlanePanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScatterPanel", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["ScatterPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SpherePanel", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["SpherePanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StackPanel3D", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["StackPanel3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "VolumeBasedPanel", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["VolumeBasedPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FluentMaterialDefines", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["FluentMaterialDefines"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FluentMaterial", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["FluentMaterial"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GUI3DManager", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["GUI3DManager"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Vector3WithInfo", function() { return _3D__WEBPACK_IMPORTED_MODULE_1__["Vector3WithInfo"]; });





/***/ }),

/***/ "./legacy/legacy.ts":
/*!**************************!*\
  !*** ./legacy/legacy.ts ***!
  \**************************/
/*! exports provided: Button, Checkbox, ColorPicker, Container, Control, Ellipse, Grid, Image, InputText, InputPassword, Line, MultiLine, RadioButton, StackPanel, SelectorGroup, CheckboxGroup, RadioGroup, SliderGroup, SelectionPanel, ScrollViewer, TextWrapping, TextBlock, KeyPropertySet, VirtualKeyboard, Rectangle, DisplayGrid, BaseSlider, Slider, ImageBasedSlider, ScrollBar, ImageScrollBar, name, AdvancedDynamicTexture, AdvancedDynamicTextureInstrumentation, Vector2WithInfo, Matrix2D, Measure, MultiLinePoint, Style, ValueAndUnit, XmlLoader, AbstractButton3D, Button3D, Container3D, Control3D, CylinderPanel, HolographicButton, MeshButton3D, PlanePanel, ScatterPanel, SpherePanel, StackPanel3D, VolumeBasedPanel, FluentMaterialDefines, FluentMaterial, GUI3DManager, Vector3WithInfo */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../index */ "./index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Button", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Button"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Checkbox", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Checkbox"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ColorPicker", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["ColorPicker"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Container", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Container"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Control", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Control"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Ellipse", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Ellipse"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Grid", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Grid"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Image", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Image"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InputText", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["InputText"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InputPassword", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["InputPassword"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Line", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Line"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MultiLine", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["MultiLine"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RadioButton", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["RadioButton"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StackPanel", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["StackPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SelectorGroup", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["SelectorGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CheckboxGroup", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["CheckboxGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "RadioGroup", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["RadioGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SliderGroup", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["SliderGroup"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SelectionPanel", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["SelectionPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScrollViewer", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["ScrollViewer"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TextWrapping", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["TextWrapping"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TextBlock", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["TextBlock"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KeyPropertySet", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["KeyPropertySet"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "VirtualKeyboard", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["VirtualKeyboard"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Rectangle", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Rectangle"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DisplayGrid", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["DisplayGrid"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BaseSlider", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["BaseSlider"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Slider", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Slider"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ImageBasedSlider", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["ImageBasedSlider"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScrollBar", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["ScrollBar"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ImageScrollBar", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["ImageScrollBar"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "name", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["name"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AdvancedDynamicTexture", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["AdvancedDynamicTexture"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AdvancedDynamicTextureInstrumentation", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["AdvancedDynamicTextureInstrumentation"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Vector2WithInfo", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Vector2WithInfo"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Matrix2D", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Matrix2D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Measure", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Measure"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MultiLinePoint", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["MultiLinePoint"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Style", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Style"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ValueAndUnit", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["ValueAndUnit"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "XmlLoader", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["XmlLoader"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AbstractButton3D", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["AbstractButton3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Button3D", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Button3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Container3D", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Container3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Control3D", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Control3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "CylinderPanel", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["CylinderPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "HolographicButton", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["HolographicButton"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MeshButton3D", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["MeshButton3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "PlanePanel", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["PlanePanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScatterPanel", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["ScatterPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SpherePanel", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["SpherePanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StackPanel3D", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["StackPanel3D"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "VolumeBasedPanel", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["VolumeBasedPanel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FluentMaterialDefines", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["FluentMaterialDefines"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FluentMaterial", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["FluentMaterial"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GUI3DManager", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["GUI3DManager"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Vector3WithInfo", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Vector3WithInfo"]; });


/**
 * Legacy support, defining window.BABYLON.GUI (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    globalObject.BABYLON = globalObject.BABYLON || {};
    globalObject.BABYLON.GUI = _index__WEBPACK_IMPORTED_MODULE_0__;
}


/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "babylonjs/Misc/perfCounter":
/*!****************************************************************************************************!*\
  !*** external {"root":"BABYLON","commonjs":"babylonjs","commonjs2":"babylonjs","amd":"babylonjs"} ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_babylonjs_Misc_perfCounter__;

/***/ })

/******/ });
});
//# sourceMappingURL=babylon.gui.js.map