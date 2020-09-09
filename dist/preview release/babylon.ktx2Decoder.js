(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["KTX2DECODER"] = factory();
	else
		root["KTX2DECODER"] = factory();
})((typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this), function() {
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
/******/ 	__webpack_require__.p = "/dist/";
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

/***/ "./Misc/dataReader.ts":
/*!****************************!*\
  !*** ./Misc/dataReader.ts ***!
  \****************************/
/*! exports provided: DataReader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DataReader", function() { return DataReader; });
/**
 * Utility class for reading from a data buffer
 */
var DataReader = /** @class */ (function () {
    /**
     * Constructor
     * @param buffer The buffer to set
     * @param byteOffset The starting offset in the buffer
     * @param byteLength The byte length of the buffer
     */
    function DataReader(buffer, byteOffset, byteLength) {
        if (buffer.buffer) {
            this._dataView = new DataView(buffer.buffer, buffer.byteOffset + (byteOffset !== null && byteOffset !== void 0 ? byteOffset : 0), byteLength !== null && byteLength !== void 0 ? byteLength : buffer.byteLength);
        }
        else {
            this._dataView = new DataView(buffer, byteOffset !== null && byteOffset !== void 0 ? byteOffset : 0, byteLength !== null && byteLength !== void 0 ? byteLength : buffer.byteLength);
        }
        this._dataByteOffset = 0;
    }
    Object.defineProperty(DataReader.prototype, "byteOffset", {
        /**
         * The current byte offset from the beginning of the data buffer.
         */
        get: function () {
            return this._dataByteOffset;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Read a unsigned 8-bit integer from the currently loaded data range.
     * @returns The 8-bit integer read
     */
    DataReader.prototype.readUint8 = function () {
        var value = this._dataView.getUint8(this._dataByteOffset);
        this._dataByteOffset += 1;
        return value;
    };
    /**
     * Read a signed 8-bit integer from the currently loaded data range.
     * @returns The 8-bit integer read
     */
    DataReader.prototype.readInt8 = function () {
        var value = this._dataView.getInt8(this._dataByteOffset);
        this._dataByteOffset += 1;
        return value;
    };
    /**
     * Read a unsigned 16-bit integer from the currently loaded data range.
     * @returns The 16-bit integer read
     */
    DataReader.prototype.readUint16 = function () {
        var value = this._dataView.getUint16(this._dataByteOffset, true);
        this._dataByteOffset += 2;
        return value;
    };
    /**
     * Read a signed 16-bit integer from the currently loaded data range.
     * @returns The 16-bit integer read
     */
    DataReader.prototype.readInt16 = function () {
        var value = this._dataView.getInt16(this._dataByteOffset, true);
        this._dataByteOffset += 2;
        return value;
    };
    /**
     * Read a unsigned 32-bit integer from the currently loaded data range.
     * @returns The 32-bit integer read
     */
    DataReader.prototype.readUint32 = function () {
        var value = this._dataView.getUint32(this._dataByteOffset, true);
        this._dataByteOffset += 4;
        return value;
    };
    /**
     * Read a signed 32-bit integer from the currently loaded data range.
     * @returns The 32-bit integer read
     */
    DataReader.prototype.readInt32 = function () {
        var value = this._dataView.getInt32(this._dataByteOffset, true);
        this._dataByteOffset += 4;
        return value;
    };
    /**
     * Read a unsigned 32-bit integer from the currently loaded data range.
     * @returns The 32-bit integer read
     */
    DataReader.prototype.readUint64 = function () {
        // split 64-bit number into two 32-bit (4-byte) parts
        var left = this._dataView.getUint32(this._dataByteOffset, true);
        var right = this._dataView.getUint32(this._dataByteOffset + 4, true);
        // combine the two 32-bit values
        var combined = true ? left + (Math.pow(2, 32) * right) : undefined;
        /*if (!Number.isSafeInteger(combined)) {
            console.warn('DataReader: ' + combined + ' exceeds MAX_SAFE_INTEGER. Precision may be lost.');
        }*/
        this._dataByteOffset += 8;
        return combined;
    };
    /**
     * Read a byte array from the currently loaded data range.
     * @param byteLength The byte length to read
     * @returns The byte array read
     */
    DataReader.prototype.readUint8Array = function (byteLength) {
        var value = new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + this._dataByteOffset, byteLength);
        this._dataByteOffset += byteLength;
        return value;
    };
    /**
     * Skips the given byte length the currently loaded data range.
     * @param byteLength The byte length to skip
     * @returns This instance
     */
    DataReader.prototype.skipBytes = function (byteLength) {
        this._dataByteOffset += byteLength;
        return this;
    };
    return DataReader;
}());



/***/ }),

/***/ "./Misc/index.ts":
/*!***********************!*\
  !*** ./Misc/index.ts ***!
  \***********************/
/*! exports provided: DataReader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _dataReader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./dataReader */ "./Misc/dataReader.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DataReader", function() { return _dataReader__WEBPACK_IMPORTED_MODULE_0__["DataReader"]; });




/***/ }),

/***/ "./Transcoders/index.ts":
/*!******************************!*\
  !*** ./Transcoders/index.ts ***!
  \******************************/
/*! exports provided: LiteTranscoder, LiteTranscoder_UASTC_ASTC, LiteTranscoder_UASTC_BC7, MSCTranscoder */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _liteTranscoder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./liteTranscoder */ "./Transcoders/liteTranscoder.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LiteTranscoder", function() { return _liteTranscoder__WEBPACK_IMPORTED_MODULE_0__["LiteTranscoder"]; });

/* harmony import */ var _liteTranscoder_UASTC_ASTC__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./liteTranscoder_UASTC_ASTC */ "./Transcoders/liteTranscoder_UASTC_ASTC.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LiteTranscoder_UASTC_ASTC", function() { return _liteTranscoder_UASTC_ASTC__WEBPACK_IMPORTED_MODULE_1__["LiteTranscoder_UASTC_ASTC"]; });

/* harmony import */ var _liteTranscoder_UASTC_BC7__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./liteTranscoder_UASTC_BC7 */ "./Transcoders/liteTranscoder_UASTC_BC7.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LiteTranscoder_UASTC_BC7", function() { return _liteTranscoder_UASTC_BC7__WEBPACK_IMPORTED_MODULE_2__["LiteTranscoder_UASTC_BC7"]; });

/* harmony import */ var _mscTranscoder__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./mscTranscoder */ "./Transcoders/mscTranscoder.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MSCTranscoder", function() { return _mscTranscoder__WEBPACK_IMPORTED_MODULE_3__["MSCTranscoder"]; });







/***/ }),

/***/ "./Transcoders/liteTranscoder.ts":
/*!***************************************!*\
  !*** ./Transcoders/liteTranscoder.ts ***!
  \***************************************/
/*! exports provided: LiteTranscoder */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LiteTranscoder", function() { return LiteTranscoder; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _transcoder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../transcoder */ "./transcoder.ts");
/* harmony import */ var _wasmMemoryManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../wasmMemoryManager */ "./wasmMemoryManager.ts");



/**
 * @hidden
 */
var LiteTranscoder = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(LiteTranscoder, _super);
    function LiteTranscoder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LiteTranscoder.prototype._loadModule = function () {
        var _this = this;
        if (this._modulePromise) {
            return this._modulePromise;
        }
        this._modulePromise = _wasmMemoryManager__WEBPACK_IMPORTED_MODULE_2__["WASMMemoryManager"].LoadWASM(this._modulePath).then(function (wasmBinary) {
            return new Promise(function (resolve) {
                WebAssembly.instantiate(wasmBinary, { env: { memory: _this._memoryManager.wasmMemory } }).then(function (moduleWrapper) {
                    resolve({ module: moduleWrapper.instance.exports });
                });
            });
        });
        return this._modulePromise;
    };
    Object.defineProperty(LiteTranscoder.prototype, "memoryManager", {
        get: function () {
            return this._memoryManager;
        },
        enumerable: false,
        configurable: true
    });
    LiteTranscoder.prototype.setModulePath = function (modulePath) {
        this._modulePath = modulePath;
    };
    LiteTranscoder.prototype.needMemoryManager = function () {
        return true;
    };
    LiteTranscoder.prototype.setMemoryManager = function (memoryMgr) {
        this._memoryManager = memoryMgr;
    };
    LiteTranscoder.prototype.transcode = function (src, dst, level, width, height, uncompressedByteLength, ktx2Reader, imageDesc, encodedData) {
        var _this = this;
        return this._loadModule().then(function (moduleWrapper) {
            var transcoder = moduleWrapper.module;
            var nBlocks = ((width + 3) >> 2) * ((height + 3) >> 2);
            var texMemoryPages = ((nBlocks * 16 + 65535) >> 16) + 1;
            var textureView = _this.memoryManager.getMemoryView(texMemoryPages, 65536, nBlocks * 16);
            textureView.set(encodedData);
            return transcoder.transcode(nBlocks) === 0 ? textureView.slice() : null;
        });
    };
    return LiteTranscoder;
}(_transcoder__WEBPACK_IMPORTED_MODULE_1__["Transcoder"]));



/***/ }),

/***/ "./Transcoders/liteTranscoder_UASTC_ASTC.ts":
/*!**************************************************!*\
  !*** ./Transcoders/liteTranscoder_UASTC_ASTC.ts ***!
  \**************************************************/
/*! exports provided: LiteTranscoder_UASTC_ASTC */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LiteTranscoder_UASTC_ASTC", function() { return LiteTranscoder_UASTC_ASTC; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _transcoder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../transcoder */ "./transcoder.ts");
/* harmony import */ var _liteTranscoder__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./liteTranscoder */ "./Transcoders/liteTranscoder.ts");



/**
 * @hidden
 */
var LiteTranscoder_UASTC_ASTC = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(LiteTranscoder_UASTC_ASTC, _super);
    function LiteTranscoder_UASTC_ASTC() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LiteTranscoder_UASTC_ASTC.CanTranscode = function (src, dst) {
        return src === _transcoder__WEBPACK_IMPORTED_MODULE_1__["sourceTextureFormat"].UASTC4x4 && dst === _transcoder__WEBPACK_IMPORTED_MODULE_1__["transcodeTarget"].ASTC_4x4_RGBA;
    };
    LiteTranscoder_UASTC_ASTC.prototype.initialize = function () {
        this.setModulePath(LiteTranscoder_UASTC_ASTC.WasmModuleURL);
    };
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    LiteTranscoder_UASTC_ASTC.WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/uastc_astc.wasm";
    return LiteTranscoder_UASTC_ASTC;
}(_liteTranscoder__WEBPACK_IMPORTED_MODULE_2__["LiteTranscoder"]));



/***/ }),

/***/ "./Transcoders/liteTranscoder_UASTC_BC7.ts":
/*!*************************************************!*\
  !*** ./Transcoders/liteTranscoder_UASTC_BC7.ts ***!
  \*************************************************/
/*! exports provided: LiteTranscoder_UASTC_BC7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LiteTranscoder_UASTC_BC7", function() { return LiteTranscoder_UASTC_BC7; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _transcoder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../transcoder */ "./transcoder.ts");
/* harmony import */ var _liteTranscoder__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./liteTranscoder */ "./Transcoders/liteTranscoder.ts");



/**
 * @hidden
 */
var LiteTranscoder_UASTC_BC7 = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(LiteTranscoder_UASTC_BC7, _super);
    function LiteTranscoder_UASTC_BC7() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LiteTranscoder_UASTC_BC7.CanTranscode = function (src, dst) {
        return src === _transcoder__WEBPACK_IMPORTED_MODULE_1__["sourceTextureFormat"].UASTC4x4 && dst === _transcoder__WEBPACK_IMPORTED_MODULE_1__["transcodeTarget"].BC7_RGBA;
    };
    LiteTranscoder_UASTC_BC7.prototype.initialize = function () {
        this.setModulePath(LiteTranscoder_UASTC_BC7.WasmModuleURL);
    };
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    LiteTranscoder_UASTC_BC7.WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/uastc_bc7.wasm";
    return LiteTranscoder_UASTC_BC7;
}(_liteTranscoder__WEBPACK_IMPORTED_MODULE_2__["LiteTranscoder"]));



/***/ }),

/***/ "./Transcoders/mscTranscoder.ts":
/*!**************************************!*\
  !*** ./Transcoders/mscTranscoder.ts ***!
  \**************************************/
/*! exports provided: MSCTranscoder */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MSCTranscoder", function() { return MSCTranscoder; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var _transcoder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../transcoder */ "./transcoder.ts");
/* harmony import */ var _wasmMemoryManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../wasmMemoryManager */ "./wasmMemoryManager.ts");



/**
 * @hidden
 */
var MSCTranscoder = /** @class */ (function (_super) {
    Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__extends"])(MSCTranscoder, _super);
    function MSCTranscoder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MSCTranscoder.prototype._getMSCBasisTranscoder = function () {
        var _this = this;
        if (this._mscBasisTranscoderPromise) {
            return this._mscBasisTranscoderPromise;
        }
        this._mscBasisTranscoderPromise = _wasmMemoryManager__WEBPACK_IMPORTED_MODULE_2__["WASMMemoryManager"].LoadWASM(MSCTranscoder.WasmModuleURL).then(function (wasmBinary) {
            if (MSCTranscoder.UseFromWorkerThread) {
                importScripts(MSCTranscoder.JSModuleURL);
            }
            return new Promise(function (resolve) {
                MSC_TRANSCODER({ wasmBinary: wasmBinary }).then(function (basisModule) {
                    basisModule.initTranscoders();
                    _this._mscBasisModule = basisModule;
                    resolve();
                });
            });
        });
        return this._mscBasisTranscoderPromise;
    };
    MSCTranscoder.CanTranscode = function (src, dst) {
        return true;
    };
    MSCTranscoder.prototype.transcode = function (src, dst, level, width, height, uncompressedByteLength, ktx2Reader, imageDesc, encodedData) {
        var _this = this;
        var isVideo = false;
        return this._getMSCBasisTranscoder().then(function () {
            var basisModule = _this._mscBasisModule;
            var transcoder = src === _transcoder__WEBPACK_IMPORTED_MODULE_1__["sourceTextureFormat"].UASTC4x4 ? new basisModule.UastcImageTranscoder() : new basisModule.BasisLzEtc1sImageTranscoder();
            var texFormat = src === _transcoder__WEBPACK_IMPORTED_MODULE_1__["sourceTextureFormat"].UASTC4x4 ? basisModule.TextureFormat.UASTC4x4 : basisModule.TextureFormat.ETC1S;
            var imageInfo = new basisModule.ImageInfo(texFormat, width, height, level);
            var targetFormat = basisModule.TranscodeTarget[_transcoder__WEBPACK_IMPORTED_MODULE_1__["transcodeTarget"][dst]]; // works because the labels of the sourceTextureFormat enum are the same than the property names used in TranscodeTarget!
            if (!basisModule.isFormatSupported(targetFormat, texFormat)) {
                throw new Error("MSCTranscoder: Transcoding from \"" + _transcoder__WEBPACK_IMPORTED_MODULE_1__["sourceTextureFormat"][src] + "\" to \"" + _transcoder__WEBPACK_IMPORTED_MODULE_1__["transcodeTarget"][dst] + "\" not supported by current transcoder build.");
            }
            var result;
            if (src === _transcoder__WEBPACK_IMPORTED_MODULE_1__["sourceTextureFormat"].ETC1S) {
                var sgd = ktx2Reader.supercompressionGlobalData;
                transcoder.decodePalettes(sgd.endpointCount, sgd.endpointsData, sgd.selectorCount, sgd.selectorsData);
                transcoder.decodeTables(sgd.tablesData);
                imageInfo.flags = imageDesc.imageFlags;
                imageInfo.rgbByteOffset = 0;
                imageInfo.rgbByteLength = imageDesc.rgbSliceByteLength;
                imageInfo.alphaByteOffset = imageDesc.alphaSliceByteOffset > 0 ? imageDesc.rgbSliceByteLength : 0;
                imageInfo.alphaByteLength = imageDesc.alphaSliceByteLength;
                result = transcoder.transcodeImage(targetFormat, encodedData, imageInfo, 0, isVideo);
            }
            else {
                imageInfo.flags = 0;
                imageInfo.rgbByteOffset = 0;
                imageInfo.rgbByteLength = uncompressedByteLength;
                imageInfo.alphaByteOffset = 0;
                imageInfo.alphaByteLength = 0;
                result = transcoder.transcodeImage(targetFormat, encodedData, imageInfo, 0, ktx2Reader.hasAlpha, isVideo);
            }
            if (result && result.transcodedImage !== undefined) {
                var textureData = result.transcodedImage.get_typed_memory_view().slice();
                result.transcodedImage.delete();
                return textureData;
            }
            return null;
        });
    };
    /**
     * URL to use when loading the MSC transcoder
     */
    MSCTranscoder.JSModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/msc_basis_transcoder.js";
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    MSCTranscoder.WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/msc_basis_transcoder.wasm";
    MSCTranscoder.UseFromWorkerThread = true;
    return MSCTranscoder;
}(_transcoder__WEBPACK_IMPORTED_MODULE_1__["Transcoder"]));



/***/ }),

/***/ "./index.ts":
/*!******************!*\
  !*** ./index.ts ***!
  \******************/
/*! exports provided: KTX2Decoder, SupercompressionScheme, KTX2FileReader, sourceTextureFormat, transcodeTarget, Transcoder, TranscoderManager, WASMMemoryManager, ZSTDDecoder, DataReader, LiteTranscoder, LiteTranscoder_UASTC_ASTC, LiteTranscoder_UASTC_BC7, MSCTranscoder */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _ktx2Decoder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ktx2Decoder */ "./ktx2Decoder.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KTX2Decoder", function() { return _ktx2Decoder__WEBPACK_IMPORTED_MODULE_0__["KTX2Decoder"]; });

/* harmony import */ var _ktx2FileReader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ktx2FileReader */ "./ktx2FileReader.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SupercompressionScheme", function() { return _ktx2FileReader__WEBPACK_IMPORTED_MODULE_1__["SupercompressionScheme"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KTX2FileReader", function() { return _ktx2FileReader__WEBPACK_IMPORTED_MODULE_1__["KTX2FileReader"]; });

/* harmony import */ var _transcoder__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./transcoder */ "./transcoder.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "sourceTextureFormat", function() { return _transcoder__WEBPACK_IMPORTED_MODULE_2__["sourceTextureFormat"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "transcodeTarget", function() { return _transcoder__WEBPACK_IMPORTED_MODULE_2__["transcodeTarget"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Transcoder", function() { return _transcoder__WEBPACK_IMPORTED_MODULE_2__["Transcoder"]; });

/* harmony import */ var _transcoderManager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./transcoderManager */ "./transcoderManager.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TranscoderManager", function() { return _transcoderManager__WEBPACK_IMPORTED_MODULE_3__["TranscoderManager"]; });

/* harmony import */ var _wasmMemoryManager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./wasmMemoryManager */ "./wasmMemoryManager.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "WASMMemoryManager", function() { return _wasmMemoryManager__WEBPACK_IMPORTED_MODULE_4__["WASMMemoryManager"]; });

/* harmony import */ var _zstddec__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./zstddec */ "./zstddec.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ZSTDDecoder", function() { return _zstddec__WEBPACK_IMPORTED_MODULE_5__["ZSTDDecoder"]; });

/* harmony import */ var _Misc_index__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./Misc/index */ "./Misc/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DataReader", function() { return _Misc_index__WEBPACK_IMPORTED_MODULE_6__["DataReader"]; });

/* harmony import */ var _Transcoders_index__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./Transcoders/index */ "./Transcoders/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LiteTranscoder", function() { return _Transcoders_index__WEBPACK_IMPORTED_MODULE_7__["LiteTranscoder"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LiteTranscoder_UASTC_ASTC", function() { return _Transcoders_index__WEBPACK_IMPORTED_MODULE_7__["LiteTranscoder_UASTC_ASTC"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LiteTranscoder_UASTC_BC7", function() { return _Transcoders_index__WEBPACK_IMPORTED_MODULE_7__["LiteTranscoder_UASTC_BC7"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MSCTranscoder", function() { return _Transcoders_index__WEBPACK_IMPORTED_MODULE_7__["MSCTranscoder"]; });











/***/ }),

/***/ "./ktx2Decoder.ts":
/*!************************!*\
  !*** ./ktx2Decoder.ts ***!
  \************************/
/*! exports provided: KTX2Decoder */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KTX2Decoder", function() { return KTX2Decoder; });
/* harmony import */ var _ktx2FileReader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ktx2FileReader */ "./ktx2FileReader.ts");
/* harmony import */ var _transcoderManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./transcoderManager */ "./transcoderManager.ts");
/* harmony import */ var _Transcoders_liteTranscoder_UASTC_ASTC__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Transcoders/liteTranscoder_UASTC_ASTC */ "./Transcoders/liteTranscoder_UASTC_ASTC.ts");
/* harmony import */ var _Transcoders_liteTranscoder_UASTC_BC7__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Transcoders/liteTranscoder_UASTC_BC7 */ "./Transcoders/liteTranscoder_UASTC_BC7.ts");
/* harmony import */ var _Transcoders_mscTranscoder__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Transcoders/mscTranscoder */ "./Transcoders/mscTranscoder.ts");
/* harmony import */ var _transcoder__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./transcoder */ "./transcoder.ts");
/* harmony import */ var _zstddec__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./zstddec */ "./zstddec.ts");
/**
 * Resources used for the implementation:
 *  - 3js KTX2 loader: https://github.com/mrdoob/three.js/blob/dfb5c23ce126ec845e4aa240599915fef5375797/examples/jsm/loaders/KTX2Loader.js
 *  - Universal Texture Transcoders: https://github.com/KhronosGroup/Universal-Texture-Transcoders
 *  - KTX2 specification: http://github.khronos.org/KTX-Specification/
 *  - KTX2 binaries to convert files: https://github.com/KhronosGroup/KTX-Software/releases
 *  - KTX specification: https://www.khronos.org/registry/DataFormat/specs/1.3/dataformat.1.3.html
 *  - KTX-Software: https://github.com/KhronosGroup/KTX-Software
 */







var COMPRESSED_RGBA_BPTC_UNORM_EXT = 0x8E8C;
var COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93B0;
var COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
var COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;
var COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
var COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
var COMPRESSED_RGBA8_ETC2_EAC = 0x9278;
var COMPRESSED_RGB8_ETC2 = 0x9274;
var COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;
var RGBA8Format = 0x8058;
var isPowerOfTwo = function (value) {
    return (value & (value - 1)) === 0 && value !== 0;
};
/**
 * Class for decoding KTX2 files
 */
var KTX2Decoder = /** @class */ (function () {
    function KTX2Decoder() {
        this._transcoderMgr = new _transcoderManager__WEBPACK_IMPORTED_MODULE_1__["TranscoderManager"]();
    }
    KTX2Decoder.prototype.decode = function (data, caps) {
        var _this = this;
        return Promise.resolve().then(function () {
            var kfr = new _ktx2FileReader__WEBPACK_IMPORTED_MODULE_0__["KTX2FileReader"](data);
            if (!kfr.isValid()) {
                throw new Error("Invalid KT2 file: wrong signature");
            }
            kfr.parse();
            if (kfr.needZSTDDecoder) {
                if (!_this._zstdDecoder) {
                    _this._zstdDecoder = new _zstddec__WEBPACK_IMPORTED_MODULE_6__["ZSTDDecoder"]();
                }
                return _this._zstdDecoder.init().then(function () {
                    return _this._decodeData(kfr, caps);
                });
            }
            return _this._decodeData(kfr, caps);
        });
    };
    KTX2Decoder.prototype._decodeData = function (kfr, caps) {
        var width = kfr.header.pixelWidth;
        var height = kfr.header.pixelHeight;
        var srcTexFormat = kfr.textureFormat;
        // PVRTC1 transcoders (from both ETC1S and UASTC) only support power of 2 dimensions.
        var pvrtcTranscodable = isPowerOfTwo(width) && isPowerOfTwo(height);
        var targetFormat = -1;
        var transcodedFormat = -1;
        if (caps.astc) {
            targetFormat = _transcoder__WEBPACK_IMPORTED_MODULE_5__["transcodeTarget"].ASTC_4x4_RGBA;
            transcodedFormat = COMPRESSED_RGBA_ASTC_4x4_KHR;
        }
        else if (caps.bptc) {
            targetFormat = _transcoder__WEBPACK_IMPORTED_MODULE_5__["transcodeTarget"].BC7_RGBA;
            transcodedFormat = COMPRESSED_RGBA_BPTC_UNORM_EXT;
        }
        else if (caps.s3tc) {
            targetFormat = kfr.hasAlpha ? _transcoder__WEBPACK_IMPORTED_MODULE_5__["transcodeTarget"].BC3_RGBA : _transcoder__WEBPACK_IMPORTED_MODULE_5__["transcodeTarget"].BC1_RGB;
            transcodedFormat = kfr.hasAlpha ? COMPRESSED_RGBA_S3TC_DXT5_EXT : COMPRESSED_RGB_S3TC_DXT1_EXT;
        }
        else if (caps.pvrtc && pvrtcTranscodable) {
            targetFormat = kfr.hasAlpha ? _transcoder__WEBPACK_IMPORTED_MODULE_5__["transcodeTarget"].PVRTC1_4_RGBA : _transcoder__WEBPACK_IMPORTED_MODULE_5__["transcodeTarget"].PVRTC1_4_RGB;
            transcodedFormat = kfr.hasAlpha ? COMPRESSED_RGBA_PVRTC_4BPPV1_IMG : COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
        }
        else if (caps.etc2) {
            targetFormat = kfr.hasAlpha ? _transcoder__WEBPACK_IMPORTED_MODULE_5__["transcodeTarget"].ETC2_RGBA : _transcoder__WEBPACK_IMPORTED_MODULE_5__["transcodeTarget"].ETC1_RGB /* subset of ETC2 */;
            transcodedFormat = kfr.hasAlpha ? COMPRESSED_RGBA8_ETC2_EAC : COMPRESSED_RGB8_ETC2;
        }
        else if (caps.etc1) {
            targetFormat = _transcoder__WEBPACK_IMPORTED_MODULE_5__["transcodeTarget"].ETC1_RGB;
            transcodedFormat = COMPRESSED_RGB_ETC1_WEBGL;
        }
        else {
            targetFormat = _transcoder__WEBPACK_IMPORTED_MODULE_5__["transcodeTarget"].RGBA32;
            transcodedFormat = RGBA8Format;
        }
        var transcoder = this._transcoderMgr.findTranscoder(srcTexFormat, targetFormat);
        if (transcoder === null) {
            throw new Error("no transcoder found to transcode source texture format \"" + _transcoder__WEBPACK_IMPORTED_MODULE_5__["sourceTextureFormat"][srcTexFormat] + "\" to format \"" + _transcoder__WEBPACK_IMPORTED_MODULE_5__["transcodeTarget"][targetFormat] + "\"");
        }
        var mipmaps = [];
        var dataPromises = [];
        var mipmapBuffers = [];
        var decodedData = { width: 0, height: 0, transcodedFormat: transcodedFormat, mipmaps: mipmaps, isInGammaSpace: kfr.isInGammaSpace };
        var firstImageDescIndex = 0;
        for (var level = 0; level < kfr.header.levelCount; level++) {
            if (level > 0) {
                firstImageDescIndex += Math.max(kfr.header.layerCount, 1) * kfr.header.faceCount * Math.max(kfr.header.pixelDepth >> (level - 1), 1);
            }
            var levelWidth = Math.ceil(width / (1 << level));
            var levelHeight = Math.ceil(height / (1 << level));
            var numImagesInLevel = kfr.header.faceCount; // note that cubemap are not supported yet (see KTX2FileReader), so faceCount == 1
            var levelImageByteLength = ((levelWidth + 3) >> 2) * ((levelHeight + 3) >> 2) * kfr.dfdBlock.bytesPlane[0];
            var levelUncompressedByteLength = kfr.levels[level].uncompressedByteLength;
            var levelDataBuffer = kfr.data.buffer;
            var levelDataOffset = kfr.levels[level].byteOffset + kfr.data.byteOffset;
            var imageOffsetInLevel = 0;
            if (kfr.header.supercompressionScheme === _ktx2FileReader__WEBPACK_IMPORTED_MODULE_0__["SupercompressionScheme"].ZStandard) {
                levelDataBuffer = this._zstdDecoder.decode(new Uint8Array(levelDataBuffer, levelDataOffset, kfr.levels[level].byteLength), levelUncompressedByteLength);
                levelDataOffset = 0;
            }
            if (level === 0) {
                decodedData.width = levelWidth;
                decodedData.height = levelHeight;
            }
            var _loop_1 = function (imageIndex) {
                var encodedData = void 0;
                var imageDesc = null;
                if (kfr.header.supercompressionScheme === _ktx2FileReader__WEBPACK_IMPORTED_MODULE_0__["SupercompressionScheme"].BasisLZ) {
                    imageDesc = kfr.supercompressionGlobalData.imageDescs[firstImageDescIndex + imageIndex];
                    encodedData = new Uint8Array(levelDataBuffer, levelDataOffset + imageDesc.rgbSliceByteOffset, imageDesc.rgbSliceByteLength + imageDesc.alphaSliceByteLength);
                }
                else {
                    encodedData = new Uint8Array(levelDataBuffer, levelDataOffset + imageOffsetInLevel, levelImageByteLength);
                    imageOffsetInLevel += levelImageByteLength;
                }
                var mipmap = {
                    data: null,
                    width: levelWidth,
                    height: levelHeight,
                };
                var transcodedData = transcoder.transcode(srcTexFormat, targetFormat, level, levelWidth, levelHeight, levelUncompressedByteLength, kfr, imageDesc, encodedData)
                    .then(function (data) {
                    mipmap.data = data;
                    if (data) {
                        mipmapBuffers.push(data.buffer);
                    }
                    return data;
                })
                    .catch(function (reason) {
                    var _a;
                    decodedData.errors = (_a = decodedData.errors) !== null && _a !== void 0 ? _a : "";
                    decodedData.errors += reason + "\n";
                    return null;
                });
                dataPromises.push(transcodedData);
                mipmaps.push(mipmap);
            };
            for (var imageIndex = 0; imageIndex < numImagesInLevel; imageIndex++) {
                _loop_1(imageIndex);
            }
        }
        return Promise.all(dataPromises).then(function () {
            return decodedData;
        });
    };
    return KTX2Decoder;
}());

// Put in the order you want the transcoders to be used in priority
_transcoderManager__WEBPACK_IMPORTED_MODULE_1__["TranscoderManager"].RegisterTranscoder(_Transcoders_liteTranscoder_UASTC_ASTC__WEBPACK_IMPORTED_MODULE_2__["LiteTranscoder_UASTC_ASTC"]);
_transcoderManager__WEBPACK_IMPORTED_MODULE_1__["TranscoderManager"].RegisterTranscoder(_Transcoders_liteTranscoder_UASTC_BC7__WEBPACK_IMPORTED_MODULE_3__["LiteTranscoder_UASTC_BC7"]);
_transcoderManager__WEBPACK_IMPORTED_MODULE_1__["TranscoderManager"].RegisterTranscoder(_Transcoders_mscTranscoder__WEBPACK_IMPORTED_MODULE_4__["MSCTranscoder"]); // catch all transcoder - will throw an error if the format can't be transcoded


/***/ }),

/***/ "./ktx2FileReader.ts":
/*!***************************!*\
  !*** ./ktx2FileReader.ts ***!
  \***************************/
/*! exports provided: SupercompressionScheme, KTX2FileReader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SupercompressionScheme", function() { return SupercompressionScheme; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KTX2FileReader", function() { return KTX2FileReader; });
/* harmony import */ var _Misc_dataReader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Misc/dataReader */ "./Misc/dataReader.ts");
/* harmony import */ var _transcoder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./transcoder */ "./transcoder.ts");


/** @hidden */
var SupercompressionScheme;
(function (SupercompressionScheme) {
    SupercompressionScheme[SupercompressionScheme["None"] = 0] = "None";
    SupercompressionScheme[SupercompressionScheme["BasisLZ"] = 1] = "BasisLZ";
    SupercompressionScheme[SupercompressionScheme["ZStandard"] = 2] = "ZStandard";
    SupercompressionScheme[SupercompressionScheme["ZLib"] = 3] = "ZLib";
})(SupercompressionScheme || (SupercompressionScheme = {}));
var KTX2FileReader = /** @class */ (function () {
    /**
     * Will throw an exception if the file can't be parsed
     */
    function KTX2FileReader(data) {
        this._data = data;
    }
    Object.defineProperty(KTX2FileReader.prototype, "data", {
        get: function () {
            return this._data;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(KTX2FileReader.prototype, "header", {
        get: function () {
            return this._header;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(KTX2FileReader.prototype, "levels", {
        get: function () {
            return this._levels;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(KTX2FileReader.prototype, "dfdBlock", {
        get: function () {
            return this._dfdBlock;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(KTX2FileReader.prototype, "supercompressionGlobalData", {
        get: function () {
            return this._supercompressionGlobalData;
        },
        enumerable: false,
        configurable: true
    });
    KTX2FileReader.prototype.isValid = function () {
        return KTX2FileReader.IsValid(this._data);
    };
    KTX2FileReader.prototype.parse = function () {
        var offsetInFile = 12; // skip the header
        /**
         * Get the header
         */
        var hdrReader = new _Misc_dataReader__WEBPACK_IMPORTED_MODULE_0__["DataReader"](this._data, offsetInFile, 17 * 4);
        var header = this._header = {
            vkFormat: hdrReader.readUint32(),
            typeSize: hdrReader.readUint32(),
            pixelWidth: hdrReader.readUint32(),
            pixelHeight: hdrReader.readUint32(),
            pixelDepth: hdrReader.readUint32(),
            layerCount: hdrReader.readUint32(),
            faceCount: hdrReader.readUint32(),
            levelCount: hdrReader.readUint32(),
            supercompressionScheme: hdrReader.readUint32(),
            dfdByteOffset: hdrReader.readUint32(),
            dfdByteLength: hdrReader.readUint32(),
            kvdByteOffset: hdrReader.readUint32(),
            kvdByteLength: hdrReader.readUint32(),
            sgdByteOffset: hdrReader.readUint64(),
            sgdByteLength: hdrReader.readUint64(),
        };
        if (header.pixelDepth > 0) {
            throw new Error("Failed to parse KTX2 file - Only 2D textures are currently supported.");
        }
        if (header.layerCount > 1) {
            throw new Error("Failed to parse KTX2 file - Array textures are not currently supported.");
        }
        if (header.faceCount > 1) {
            throw new Error("Failed to parse KTX2 file - Cube textures are not currently supported.");
        }
        offsetInFile += hdrReader.byteOffset;
        /**
         * Get the levels
         */
        var levelCount = Math.max(1, header.levelCount);
        var levelReader = new _Misc_dataReader__WEBPACK_IMPORTED_MODULE_0__["DataReader"](this._data, offsetInFile, levelCount * 3 * (2 * 4));
        var levels = this._levels = [];
        while (levelCount--) {
            levels.push({
                byteOffset: levelReader.readUint64(),
                byteLength: levelReader.readUint64(),
                uncompressedByteLength: levelReader.readUint64(),
            });
        }
        offsetInFile += levelReader.byteOffset;
        /**
         * Get the data format descriptor (DFD) blocks
         */
        var dfdReader = new _Misc_dataReader__WEBPACK_IMPORTED_MODULE_0__["DataReader"](this._data, header.dfdByteOffset, header.dfdByteLength);
        var dfdBlock = this._dfdBlock = {
            vendorId: dfdReader.skipBytes(4 /* skip totalSize */).readUint16(),
            descriptorType: dfdReader.readUint16(),
            versionNumber: dfdReader.readUint16(),
            descriptorBlockSize: dfdReader.readUint16(),
            colorModel: dfdReader.readUint8(),
            colorPrimaries: dfdReader.readUint8(),
            transferFunction: dfdReader.readUint8(),
            flags: dfdReader.readUint8(),
            texelBlockDimension: {
                x: dfdReader.readUint8() + 1,
                y: dfdReader.readUint8() + 1,
                z: dfdReader.readUint8() + 1,
                w: dfdReader.readUint8() + 1,
            },
            bytesPlane: [
                dfdReader.readUint8(),
                dfdReader.readUint8(),
                dfdReader.readUint8(),
                dfdReader.readUint8(),
                dfdReader.readUint8(),
                dfdReader.readUint8(),
                dfdReader.readUint8(),
                dfdReader.readUint8(),
            ],
            numSamples: 0,
            samples: new Array(),
        };
        dfdBlock.numSamples = (dfdBlock.descriptorBlockSize - 24) / 16;
        for (var i = 0; i < dfdBlock.numSamples; i++) {
            var sample = {
                bitOffset: dfdReader.readUint16(),
                bitLength: dfdReader.readUint8() + 1,
                channelType: dfdReader.readUint8(),
                channelFlags: 0,
                samplePosition: [
                    dfdReader.readUint8(),
                    dfdReader.readUint8(),
                    dfdReader.readUint8(),
                    dfdReader.readUint8(),
                ],
                sampleLower: dfdReader.readUint32(),
                sampleUpper: dfdReader.readUint32(),
            };
            sample.channelFlags = (sample.channelType & 0xF0) >> 4;
            sample.channelType = sample.channelType & 0x0F;
            dfdBlock.samples.push(sample);
        }
        /**
         * Get the Supercompression Global Data (sgd)
         */
        var sgd = this._supercompressionGlobalData = {};
        if (header.sgdByteLength > 0) {
            var sgdReader = new _Misc_dataReader__WEBPACK_IMPORTED_MODULE_0__["DataReader"](this._data, header.sgdByteOffset, header.sgdByteLength);
            sgd.endpointCount = sgdReader.readUint16();
            sgd.selectorCount = sgdReader.readUint16();
            sgd.endpointsByteLength = sgdReader.readUint32();
            sgd.selectorsByteLength = sgdReader.readUint32();
            sgd.tablesByteLength = sgdReader.readUint32();
            sgd.extendedByteLength = sgdReader.readUint32();
            sgd.imageDescs = [];
            var imageCount = this._getImageCount();
            for (var i = 0; i < imageCount; i++) {
                sgd.imageDescs.push({
                    imageFlags: sgdReader.readUint32(),
                    rgbSliceByteOffset: sgdReader.readUint32(),
                    rgbSliceByteLength: sgdReader.readUint32(),
                    alphaSliceByteOffset: sgdReader.readUint32(),
                    alphaSliceByteLength: sgdReader.readUint32(),
                });
            }
            var endpointsByteOffset = header.sgdByteOffset + sgdReader.byteOffset;
            var selectorsByteOffset = endpointsByteOffset + sgd.endpointsByteLength;
            var tablesByteOffset = selectorsByteOffset + sgd.selectorsByteLength;
            var extendedByteOffset = tablesByteOffset + sgd.tablesByteLength;
            sgd.endpointsData = new Uint8Array(this._data.buffer, this._data.byteOffset + endpointsByteOffset, sgd.endpointsByteLength);
            sgd.selectorsData = new Uint8Array(this._data.buffer, this._data.byteOffset + selectorsByteOffset, sgd.selectorsByteLength);
            sgd.tablesData = new Uint8Array(this._data.buffer, this._data.byteOffset + tablesByteOffset, sgd.tablesByteLength);
            sgd.extendedData = new Uint8Array(this._data.buffer, this._data.byteOffset + extendedByteOffset, sgd.extendedByteLength);
        }
    };
    KTX2FileReader.prototype._getImageCount = function () {
        var layerPixelDepth = Math.max(this._header.pixelDepth, 1);
        for (var i = 1; i < this._header.levelCount; i++) {
            layerPixelDepth += Math.max(this._header.pixelDepth >> i, 1);
        }
        return Math.max(this._header.layerCount, 1) * this._header.faceCount * layerPixelDepth;
    };
    Object.defineProperty(KTX2FileReader.prototype, "textureFormat", {
        get: function () {
            return this._dfdBlock.colorModel === 166 /* UASTC */ ? _transcoder__WEBPACK_IMPORTED_MODULE_1__["sourceTextureFormat"].UASTC4x4 : _transcoder__WEBPACK_IMPORTED_MODULE_1__["sourceTextureFormat"].ETC1S;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(KTX2FileReader.prototype, "hasAlpha", {
        get: function () {
            var tformat = this.textureFormat;
            switch (tformat) {
                case _transcoder__WEBPACK_IMPORTED_MODULE_1__["sourceTextureFormat"].ETC1S:
                    return this._dfdBlock.numSamples === 2 && (this._dfdBlock.samples[0].channelType === 15 /* AAA */ || this._dfdBlock.samples[1].channelType === 15 /* AAA */);
                case _transcoder__WEBPACK_IMPORTED_MODULE_1__["sourceTextureFormat"].UASTC4x4:
                    return this._dfdBlock.samples[0].channelType === 3 /* RGBA */;
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(KTX2FileReader.prototype, "needZSTDDecoder", {
        get: function () {
            return this._header.supercompressionScheme === SupercompressionScheme.ZStandard;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(KTX2FileReader.prototype, "isInGammaSpace", {
        get: function () {
            return this._dfdBlock.transferFunction === 2 /* sRGB */;
        },
        enumerable: false,
        configurable: true
    });
    KTX2FileReader.IsValid = function (data) {
        if (data.byteLength >= 12) {
            // '«', 'K', 'T', 'X', ' ', '2', '0', '»', '\r', '\n', '\x1A', '\n'
            var identifier = new Uint8Array(data.buffer, data.byteOffset, 12);
            if (identifier[0] === 0xAB && identifier[1] === 0x4B && identifier[2] === 0x54 && identifier[3] === 0x58 && identifier[4] === 0x20 && identifier[5] === 0x32 &&
                identifier[6] === 0x30 && identifier[7] === 0xBB && identifier[8] === 0x0D && identifier[9] === 0x0A && identifier[10] === 0x1A && identifier[11] === 0x0A) {
                return true;
            }
        }
        return false;
    };
    return KTX2FileReader;
}());



/***/ }),

/***/ "./legacy/legacy.ts":
/*!**************************!*\
  !*** ./legacy/legacy.ts ***!
  \**************************/
/*! exports provided: KTX2Decoder, SupercompressionScheme, KTX2FileReader, sourceTextureFormat, transcodeTarget, Transcoder, TranscoderManager, WASMMemoryManager, ZSTDDecoder, DataReader, LiteTranscoder, LiteTranscoder_UASTC_ASTC, LiteTranscoder_UASTC_BC7, MSCTranscoder */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../index */ "./index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KTX2Decoder", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["KTX2Decoder"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SupercompressionScheme", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["SupercompressionScheme"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KTX2FileReader", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["KTX2FileReader"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "sourceTextureFormat", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["sourceTextureFormat"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "transcodeTarget", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["transcodeTarget"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Transcoder", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["Transcoder"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TranscoderManager", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["TranscoderManager"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "WASMMemoryManager", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["WASMMemoryManager"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ZSTDDecoder", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["ZSTDDecoder"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DataReader", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["DataReader"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LiteTranscoder", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["LiteTranscoder"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LiteTranscoder_UASTC_ASTC", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["LiteTranscoder_UASTC_ASTC"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LiteTranscoder_UASTC_BC7", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["LiteTranscoder_UASTC_BC7"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MSCTranscoder", function() { return _index__WEBPACK_IMPORTED_MODULE_0__["MSCTranscoder"]; });


var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    globalObject.KTX2DECODER = _index__WEBPACK_IMPORTED_MODULE_0__["KTX2Decoder"];
}


/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./transcoder.ts":
/*!***********************!*\
  !*** ./transcoder.ts ***!
  \***********************/
/*! exports provided: sourceTextureFormat, transcodeTarget, Transcoder */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "sourceTextureFormat", function() { return sourceTextureFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "transcodeTarget", function() { return transcodeTarget; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Transcoder", function() { return Transcoder; });
/**
 * @hidden
 */
var sourceTextureFormat;
(function (sourceTextureFormat) {
    sourceTextureFormat[sourceTextureFormat["ETC1S"] = 0] = "ETC1S";
    sourceTextureFormat[sourceTextureFormat["UASTC4x4"] = 1] = "UASTC4x4";
})(sourceTextureFormat || (sourceTextureFormat = {}));
/**
 * @hidden
 */
var transcodeTarget;
(function (transcodeTarget) {
    transcodeTarget[transcodeTarget["ASTC_4x4_RGBA"] = 0] = "ASTC_4x4_RGBA";
    transcodeTarget[transcodeTarget["BC7_RGBA"] = 1] = "BC7_RGBA";
    transcodeTarget[transcodeTarget["BC3_RGBA"] = 2] = "BC3_RGBA";
    transcodeTarget[transcodeTarget["BC1_RGB"] = 3] = "BC1_RGB";
    transcodeTarget[transcodeTarget["PVRTC1_4_RGBA"] = 4] = "PVRTC1_4_RGBA";
    transcodeTarget[transcodeTarget["PVRTC1_4_RGB"] = 5] = "PVRTC1_4_RGB";
    transcodeTarget[transcodeTarget["ETC2_RGBA"] = 6] = "ETC2_RGBA";
    transcodeTarget[transcodeTarget["ETC1_RGB"] = 7] = "ETC1_RGB";
    transcodeTarget[transcodeTarget["RGBA32"] = 8] = "RGBA32";
})(transcodeTarget || (transcodeTarget = {}));
/**
 * @hidden
 */
var Transcoder = /** @class */ (function () {
    function Transcoder() {
    }
    Transcoder.CanTranscode = function (src, dst) {
        return false;
    };
    Transcoder.prototype.initialize = function () {
    };
    Transcoder.prototype.needMemoryManager = function () {
        return false;
    };
    Transcoder.prototype.setMemoryManager = function (memoryMgr) {
    };
    Transcoder.prototype.transcode = function (src, dst, level, width, height, uncompressedByteLength, ktx2Reader, imageDesc, encodedData) {
        return Promise.resolve(null);
    };
    return Transcoder;
}());



/***/ }),

/***/ "./transcoderManager.ts":
/*!******************************!*\
  !*** ./transcoderManager.ts ***!
  \******************************/
/*! exports provided: TranscoderManager */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TranscoderManager", function() { return TranscoderManager; });
/* harmony import */ var _transcoder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./transcoder */ "./transcoder.ts");
/* harmony import */ var _wasmMemoryManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./wasmMemoryManager */ "./wasmMemoryManager.ts");


/**
 * @hidden
 */
var TranscoderManager = /** @class */ (function () {
    function TranscoderManager() {
    }
    TranscoderManager.RegisterTranscoder = function (transcoder) {
        TranscoderManager._Transcoders.push(transcoder);
    };
    TranscoderManager.prototype.findTranscoder = function (src, dst) {
        var transcoder = null;
        for (var i = 0; i < TranscoderManager._Transcoders.length; ++i) {
            if (TranscoderManager._Transcoders[i].CanTranscode(src, dst)) {
                var key = _transcoder__WEBPACK_IMPORTED_MODULE_0__["sourceTextureFormat"][src] + "_" + _transcoder__WEBPACK_IMPORTED_MODULE_0__["transcodeTarget"][dst];
                transcoder = TranscoderManager._transcoderInstances[key];
                if (!transcoder) {
                    transcoder = new TranscoderManager._Transcoders[i]();
                    transcoder.initialize();
                    if (transcoder.needMemoryManager()) {
                        if (!this._wasmMemoryManager) {
                            this._wasmMemoryManager = new _wasmMemoryManager__WEBPACK_IMPORTED_MODULE_1__["WASMMemoryManager"]();
                        }
                        transcoder.setMemoryManager(this._wasmMemoryManager);
                    }
                    TranscoderManager._transcoderInstances[key] = transcoder;
                }
                break;
            }
        }
        return transcoder;
    };
    TranscoderManager._Transcoders = [];
    TranscoderManager._transcoderInstances = {};
    return TranscoderManager;
}());



/***/ }),

/***/ "./wasmMemoryManager.ts":
/*!******************************!*\
  !*** ./wasmMemoryManager.ts ***!
  \******************************/
/*! exports provided: WASMMemoryManager */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WASMMemoryManager", function() { return WASMMemoryManager; });
/**
 * @hidden
 */
var WASMMemoryManager = /** @class */ (function () {
    function WASMMemoryManager(initialMemoryPages) {
        if (initialMemoryPages === void 0) { initialMemoryPages = WASMMemoryManager.InitialMemoryPages; }
        this._numPages = initialMemoryPages;
        this._memory = new WebAssembly.Memory({ initial: this._numPages });
        this._memoryViewByteLength = this._numPages << 16;
        this._memoryViewOffset = 0;
        this._memoryView = new Uint8Array(this._memory.buffer, this._memoryViewOffset, this._memoryViewByteLength);
    }
    WASMMemoryManager.LoadWASM = function (path) {
        if (this.LoadBinariesFromCurrentThread) {
            return new Promise(function (resolve, reject) {
                fetch(path)
                    .then(function (response) {
                    if (response.ok) {
                        return response.arrayBuffer();
                    }
                    throw new Error("Could not fetch the wasm component from \"" + path + "\": " + response.status + " - " + response.statusText);
                })
                    .then(function (wasmBinary) { return resolve(wasmBinary); })
                    .catch(function (reason) {
                    reject(reason);
                });
            });
        }
        var id = this._RequestId++;
        return new Promise(function (resolve) {
            var wasmLoadedHandler = function (msg) {
                if (msg.data.action === "wasmLoaded" && msg.data.id === id) {
                    self.removeEventListener("message", wasmLoadedHandler);
                    resolve(msg.data.wasmBinary);
                }
            };
            self.addEventListener("message", wasmLoadedHandler);
            postMessage({ action: "loadWASM", path: path, id: id });
        });
    };
    Object.defineProperty(WASMMemoryManager.prototype, "wasmMemory", {
        get: function () {
            return this._memory;
        },
        enumerable: false,
        configurable: true
    });
    WASMMemoryManager.prototype.getMemoryView = function (numPages, offset, byteLength) {
        if (offset === void 0) { offset = 0; }
        byteLength = byteLength !== null && byteLength !== void 0 ? byteLength : numPages << 16;
        if (this._numPages < numPages) {
            this._memory.grow(numPages - this._numPages);
            this._numPages = numPages;
            this._memoryView = new Uint8Array(this._memory.buffer, offset, byteLength);
            this._memoryViewByteLength = byteLength;
            this._memoryViewOffset = offset;
        }
        else {
            this._memoryView = new Uint8Array(this._memory.buffer, offset, byteLength);
            this._memoryViewByteLength = byteLength;
            this._memoryViewOffset = offset;
        }
        return this._memoryView;
    };
    WASMMemoryManager.LoadBinariesFromCurrentThread = true;
    WASMMemoryManager.InitialMemoryPages = (1 * 1024 * 1024) >> 16; // 1 Mbytes
    WASMMemoryManager._RequestId = 0;
    return WASMMemoryManager;
}());



/***/ }),

/***/ "./zstddec.ts":
/*!********************!*\
  !*** ./zstddec.ts ***!
  \********************/
/*! exports provided: ZSTDDecoder */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ZSTDDecoder", function() { return ZSTDDecoder; });
var init;
var instance;
var heap;
var IMPORT_OBJECT = {
    env: {
        emscripten_notify_memory_growth: function (index) {
            heap = new Uint8Array(instance.exports.memory.buffer);
        }
    }
};
/**
 * ZSTD (Zstandard) decoder.
 */
var ZSTDDecoder = /** @class */ (function () {
    function ZSTDDecoder() {
    }
    ZSTDDecoder.prototype.init = function () {
        if (init) {
            return init;
        }
        if (typeof fetch !== 'undefined') {
            // Web.
            init = fetch(ZSTDDecoder.WasmModuleURL)
                .then(function (response) {
                if (response.ok) {
                    return response.arrayBuffer();
                }
                throw new Error("Could not fetch the wasm component for the Zstandard decompression lib: " + response.status + " - " + response.statusText);
            })
                .then(function (arrayBuffer) { return WebAssembly.instantiate(arrayBuffer, IMPORT_OBJECT); })
                .then(this._init);
        }
        else {
            // Node.js.
            init = WebAssembly
                .instantiateStreaming(fetch(ZSTDDecoder.WasmModuleURL), IMPORT_OBJECT)
                .then(this._init);
        }
        return init;
    };
    ZSTDDecoder.prototype._init = function (result) {
        instance = result.instance;
        IMPORT_OBJECT.env.emscripten_notify_memory_growth(0); // initialize heap.
    };
    ZSTDDecoder.prototype.decode = function (array, uncompressedSize) {
        if (uncompressedSize === void 0) { uncompressedSize = 0; }
        if (!instance) {
            throw new Error("ZSTDDecoder: Await .init() before decoding.");
        }
        // Write compressed data into WASM memory.
        var compressedSize = array.byteLength;
        var compressedPtr = instance.exports.malloc(compressedSize);
        heap.set(array, compressedPtr);
        // Decompress into WASM memory.
        uncompressedSize = uncompressedSize || Number(instance.exports.ZSTD_findDecompressedSize(compressedPtr, compressedSize));
        var uncompressedPtr = instance.exports.malloc(uncompressedSize);
        var actualSize = instance.exports.ZSTD_decompress(uncompressedPtr, uncompressedSize, compressedPtr, compressedSize);
        // Read decompressed data and free WASM memory.
        var dec = heap.slice(uncompressedPtr, uncompressedPtr + actualSize);
        instance.exports.free(compressedPtr);
        instance.exports.free(uncompressedPtr);
        return dec;
    };
    ZSTDDecoder.WasmModuleURL = "https://preview.babylonjs.com/zstddec.wasm";
    return ZSTDDecoder;
}());

/**
 * BSD License
 *
 * For Zstandard software
 *
 * Copyright (c) 2016-present, Yann Collet, Facebook, Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 *  * Neither the name Facebook nor the names of its contributors may be used to
 *    endorse or promote products derived from this software without specific
 *    prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/***/ })

/******/ });
});
//# sourceMappingURL=babylon.ktx2Decoder.js.map