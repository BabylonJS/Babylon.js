(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-procedural-textures", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-procedural-textures"] = factory(require("babylonjs"));
	else
		root["PROCEDURALTEXTURESLIB"] = factory(root["BABYLON"]);
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./legacy/legacy-marble.ts");
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

/***/ "./legacy/legacy-marble.ts":
/*!*********************************!*\
  !*** ./legacy/legacy-marble.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var proceduralTexture = __webpack_require__(/*! ../src/marble */ "./src/marble/index.ts");
/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in proceduralTexture) {
        globalObject.BABYLON[key] = proceduralTexture[key];
    }
}
__export(__webpack_require__(/*! ../src/marble */ "./src/marble/index.ts"));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../Tools/Gulp/node_modules/webpack/buildin/global.js */ "../Tools/Gulp/node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./src/marble/index.ts":
/*!*****************************!*\
  !*** ./src/marble/index.ts ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./marbleProceduralTexture */ "./src/marble/marbleProceduralTexture.ts"));


/***/ }),

/***/ "./src/marble/marbleProceduralTexture.fragment.fx":
/*!********************************************************!*\
  !*** ./src/marble/marbleProceduralTexture.fragment.fx ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "precision highp float;\nvarying vec2 vPosition;\nvarying vec2 vUV;\nuniform float numberOfTilesHeight;\nuniform float numberOfTilesWidth;\nuniform float amplitude;\nuniform vec3 marbleColor;\nuniform vec3 jointColor;\nconst vec3 tileSize=vec3(1.1,1.0,1.1);\nconst vec3 tilePct=vec3(0.98,1.0,0.98);\nfloat rand(vec2 n) {\nreturn fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);\n}\nfloat noise(vec2 n) {\nconst vec2 d=vec2(0.0,1.0);\nvec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));\nreturn mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);\n}\nfloat turbulence(vec2 P)\n{\nfloat val=0.0;\nfloat freq=1.0;\nfor (int i=0; i<4; i++)\n{\nval+=abs(noise(P*freq)/freq);\nfreq*=2.07;\n}\nreturn val;\n}\nfloat roundF(float number){\nreturn sign(number)*floor(abs(number)+0.5);\n}\nvec3 marble_color(float x)\n{\nvec3 col;\nx=0.5*(x+1.);\nx=sqrt(x); \nx=sqrt(x);\nx=sqrt(x);\ncol=vec3(.2+.75*x); \ncol.b*=0.95; \nreturn col;\n}\nvoid main()\n{\nfloat brickW=1.0/numberOfTilesWidth;\nfloat brickH=1.0/numberOfTilesHeight;\nfloat jointWPercentage=0.01;\nfloat jointHPercentage=0.01;\nvec3 color=marbleColor;\nfloat yi=vUV.y/brickH;\nfloat nyi=roundF(yi);\nfloat xi=vUV.x/brickW;\nif (mod(floor(yi),2.0) == 0.0){\nxi=xi-0.5;\n}\nfloat nxi=roundF(xi);\nvec2 brickvUV=vec2((xi-floor(xi))/brickH,(yi-floor(yi))/brickW);\nif (yi<nyi+jointHPercentage && yi>nyi-jointHPercentage){\ncolor=mix(jointColor,vec3(0.37,0.25,0.25),(yi-nyi)/jointHPercentage+0.2);\n}\nelse if (xi<nxi+jointWPercentage && xi>nxi-jointWPercentage){\ncolor=mix(jointColor,vec3(0.44,0.44,0.44),(xi-nxi)/jointWPercentage+0.2);\n}\nelse {\nfloat t=6.28*brickvUV.x/(tileSize.x+noise(vec2(vUV)*6.0));\nt+=amplitude*turbulence(brickvUV.xy);\nt=sin(t);\ncolor=marble_color(t);\n}\ngl_FragColor=vec4(color,0.0);\n}"

/***/ }),

/***/ "./src/marble/marbleProceduralTexture.ts":
/*!***********************************************!*\
  !*** ./src/marble/marbleProceduralTexture.ts ***!
  \***********************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
babylonjs_1.Effect.ShadersStore["marbleProceduralTexturePixelShader"] = __webpack_require__(/*! ./marbleProceduralTexture.fragment.fx */ "./src/marble/marbleProceduralTexture.fragment.fx");
var MarbleProceduralTexture = /** @class */ (function (_super) {
    __extends(MarbleProceduralTexture, _super);
    function MarbleProceduralTexture(name, size, scene, fallbackTexture, generateMipMaps) {
        var _this = _super.call(this, name, size, "marbleProceduralTexture", scene, fallbackTexture, generateMipMaps) || this;
        _this._numberOfTilesHeight = 3;
        _this._numberOfTilesWidth = 3;
        _this._amplitude = 9.0;
        _this._jointColor = new babylonjs_1.Color3(0.72, 0.72, 0.72);
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
        var serializationObject = babylonjs_1.SerializationHelper.Serialize(this, _super.prototype.serialize.call(this));
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
        var texture = babylonjs_1.SerializationHelper.Parse(function () { return new MarbleProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps); }, parsedTexture, scene, rootUrl);
        return texture;
    };
    __decorate([
        babylonjs_1.serialize()
    ], MarbleProceduralTexture.prototype, "numberOfTilesHeight", null);
    __decorate([
        babylonjs_1.serialize()
    ], MarbleProceduralTexture.prototype, "amplitude", null);
    __decorate([
        babylonjs_1.serialize()
    ], MarbleProceduralTexture.prototype, "numberOfTilesWidth", null);
    __decorate([
        babylonjs_1.serialize()
    ], MarbleProceduralTexture.prototype, "jointColor", null);
    return MarbleProceduralTexture;
}(babylonjs_1.ProceduralTexture));
exports.MarbleProceduralTexture = MarbleProceduralTexture;


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
//# sourceMappingURL=babylon.marbleProceduralTexture.js.map