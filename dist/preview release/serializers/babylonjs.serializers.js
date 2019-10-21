(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-serializers", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-serializers"] = factory(require("babylonjs"));
	else
		root["SERIALIZERS"] = factory(root["BABYLON"]);
})((typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this), function(__WEBPACK_EXTERNAL_MODULE_babylonjs_Maths_math__) {
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

/***/ "./OBJ/index.ts":
/*!**********************!*\
  !*** ./OBJ/index.ts ***!
  \**********************/
/*! exports provided: OBJExport */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _objSerializer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./objSerializer */ "./OBJ/objSerializer.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "OBJExport", function() { return _objSerializer__WEBPACK_IMPORTED_MODULE_0__["OBJExport"]; });




/***/ }),

/***/ "./OBJ/objSerializer.ts":
/*!******************************!*\
  !*** ./OBJ/objSerializer.ts ***!
  \******************************/
/*! exports provided: OBJExport */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OBJExport", function() { return OBJExport; });
/* harmony import */ var babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math */ "babylonjs/Maths/math");
/* harmony import */ var babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__);


/**
 * Class for generating OBJ data from a Babylon scene.
 */
var OBJExport = /** @class */ (function () {
    function OBJExport() {
    }
    /**
     * Exports the geometry of a Mesh array in .OBJ file format (text)
     * @param mesh defines the list of meshes to serialize
     * @param materials defines if materials should be exported
     * @param matlibname defines the name of the associated mtl file
     * @param globalposition defines if the exported positions are globals or local to the exported mesh
     * @returns the OBJ content
     */
    OBJExport.OBJ = function (mesh, materials, matlibname, globalposition) {
        var output = [];
        var v = 1;
        if (materials) {
            if (!matlibname) {
                matlibname = 'mat';
            }
            output.push("mtllib " + matlibname + ".mtl");
        }
        for (var j = 0; j < mesh.length; j++) {
            output.push("g object" + j);
            output.push("o object_" + j);
            //Uses the position of the item in the scene, to the file (this back to normal in the end)
            var lastMatrix = null;
            if (globalposition) {
                var newMatrix = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Matrix"].Translation(mesh[j].position.x, mesh[j].position.y, mesh[j].position.z);
                lastMatrix = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Matrix"].Translation(-(mesh[j].position.x), -(mesh[j].position.y), -(mesh[j].position.z));
                mesh[j].bakeTransformIntoVertices(newMatrix);
            }
            //TODO: submeshes (groups)
            //TODO: smoothing groups (s 1, s off);
            if (materials) {
                var mat = mesh[j].material;
                if (mat) {
                    output.push("usemtl " + mat.id);
                }
            }
            var g = mesh[j].geometry;
            if (!g) {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].Warn("No geometry is present on the mesh");
                continue;
            }
            var trunkVerts = g.getVerticesData('position');
            var trunkNormals = g.getVerticesData('normal');
            var trunkUV = g.getVerticesData('uv');
            var trunkFaces = g.getIndices();
            var curV = 0;
            if (!trunkVerts || !trunkFaces) {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].Warn("There are no position vertices or indices on the mesh!");
                continue;
            }
            for (var i = 0; i < trunkVerts.length; i += 3) {
                output.push("v " + trunkVerts[i] + " " + trunkVerts[i + 1] + " " + trunkVerts[i + 2]);
                curV++;
            }
            if (trunkNormals != null) {
                for (i = 0; i < trunkNormals.length; i += 3) {
                    output.push("vn " + trunkNormals[i] + " " + trunkNormals[i + 1] + " " + trunkNormals[i + 2]);
                }
            }
            if (trunkUV != null) {
                for (i = 0; i < trunkUV.length; i += 2) {
                    output.push("vt " + trunkUV[i] + " " + trunkUV[i + 1]);
                }
            }
            for (i = 0; i < trunkFaces.length; i += 3) {
                var indices = [String(trunkFaces[i + 2] + v), String(trunkFaces[i + 1] + v), String(trunkFaces[i] + v)];
                var blanks = ["", "", ""];
                var facePositions = indices;
                var faceUVs = trunkUV != null ? indices : blanks;
                var faceNormals = trunkNormals != null ? indices : blanks;
                output.push("f " + facePositions[0] + "/" + faceUVs[0] + "/" + faceNormals[0] +
                    " " + facePositions[1] + "/" + faceUVs[1] + "/" + faceNormals[1] +
                    " " + facePositions[2] + "/" + faceUVs[2] + "/" + faceNormals[2]);
            }
            //back de previous matrix, to not change the original mesh in the scene
            if (globalposition && lastMatrix) {
                mesh[j].bakeTransformIntoVertices(lastMatrix);
            }
            v += curV;
        }
        var text = output.join("\n");
        return (text);
    };
    /**
     * Exports the material(s) of a mesh in .MTL file format (text)
     * @param mesh defines the mesh to extract the material from
     * @returns the mtl content
     */
    //TODO: Export the materials of mesh array
    OBJExport.MTL = function (mesh) {
        var output = [];
        var m = mesh.material;
        output.push("newmtl mat1");
        output.push("  Ns " + m.specularPower.toFixed(4));
        output.push("  Ni 1.5000");
        output.push("  d " + m.alpha.toFixed(4));
        output.push("  Tr 0.0000");
        output.push("  Tf 1.0000 1.0000 1.0000");
        output.push("  illum 2");
        output.push("  Ka " + m.ambientColor.r.toFixed(4) + " " + m.ambientColor.g.toFixed(4) + " " + m.ambientColor.b.toFixed(4));
        output.push("  Kd " + m.diffuseColor.r.toFixed(4) + " " + m.diffuseColor.g.toFixed(4) + " " + m.diffuseColor.b.toFixed(4));
        output.push("  Ks " + m.specularColor.r.toFixed(4) + " " + m.specularColor.g.toFixed(4) + " " + m.specularColor.b.toFixed(4));
        output.push("  Ke " + m.emissiveColor.r.toFixed(4) + " " + m.emissiveColor.g.toFixed(4) + " " + m.emissiveColor.b.toFixed(4));
        //TODO: uv scale, offset, wrap
        //TODO: UV mirrored in Blender? second UV channel? lightMap? reflection textures?
        var uvscale = "";
        if (m.ambientTexture) {
            output.push("  map_Ka " + uvscale + m.ambientTexture.name);
        }
        if (m.diffuseTexture) {
            output.push("  map_Kd " + uvscale + m.diffuseTexture.name);
            //TODO: alpha testing, opacity in diffuse texture alpha channel (diffuseTexture.hasAlpha -> map_d)
        }
        if (m.specularTexture) {
            output.push("  map_Ks " + uvscale + m.specularTexture.name);
            /* TODO: glossiness = specular highlight component is in alpha channel of specularTexture. (???)
            if (m.useGlossinessFromSpecularMapAlpha)  {
                output.push("  map_Ns "+uvscale + m.specularTexture.name);
            }
            */
        }
        /* TODO: emissive texture not in .MAT format (???)
        if (m.emissiveTexture) {
            output.push("  map_d "+uvscale+m.emissiveTexture.name);
        }
        */
        if (m.bumpTexture) {
            output.push("  map_bump -imfchan z " + uvscale + m.bumpTexture.name);
        }
        if (m.opacityTexture) {
            output.push("  map_d " + uvscale + m.opacityTexture.name);
        }
        var text = output.join("\n");
        return (text);
    };
    return OBJExport;
}());



/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_lights_punctual.ts":
/*!****************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_lights_punctual.ts ***!
  \****************************************************/
/*! exports provided: KHR_lights_punctual */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_lights_punctual", function() { return KHR_lights_punctual; });
/* harmony import */ var babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math */ "babylonjs/Maths/math");
/* harmony import */ var babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFExporter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFExporter */ "./glTF/2.0/glTFExporter.ts");
/* harmony import */ var _glTFUtilities__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../glTFUtilities */ "./glTF/2.0/glTFUtilities.ts");






var NAME = "KHR_lights_punctual";
var LightType;
(function (LightType) {
    LightType["DIRECTIONAL"] = "directional";
    LightType["POINT"] = "point";
    LightType["SPOT"] = "spot";
})(LightType || (LightType = {}));
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md)
 */
var KHR_lights_punctual = /** @class */ (function () {
    /** @hidden */
    function KHR_lights_punctual(exporter) {
        /** The name of this extension. */
        this.name = NAME;
        /** Defines whether this extension is enabled. */
        this.enabled = true;
        /** Defines whether this extension is required */
        this.required = false;
        this._exporter = exporter;
    }
    /** @hidden */
    KHR_lights_punctual.prototype.dispose = function () {
        delete this._exporter;
        delete this._lights;
    };
    /** @hidden */
    KHR_lights_punctual.prototype.onExporting = function () {
        if (this._lights) {
            if (this._exporter._glTF.extensionsUsed == null) {
                this._exporter._glTF.extensionsUsed = [];
            }
            if (this._exporter._glTF.extensionsUsed.indexOf(NAME) === -1) {
                this._exporter._glTF.extensionsUsed.push(NAME);
            }
            if (this.required) {
                if (this._exporter._glTF.extensionsRequired == null) {
                    this._exporter._glTF.extensionsRequired = [];
                }
                if (this._exporter._glTF.extensionsRequired.indexOf(NAME) === -1) {
                    this._exporter._glTF.extensionsRequired.push(NAME);
                }
            }
            if (this._exporter._glTF.extensions == null) {
                this._exporter._glTF.extensions = {};
            }
            this._exporter._glTF.extensions[NAME] = this._lights;
        }
    };
    /**
     * Define this method to modify the default behavior when exporting a node
     * @param context The context when exporting the node
     * @param node glTF node
     * @param babylonNode BabylonJS node
     * @returns nullable INode promise
     */
    KHR_lights_punctual.prototype.postExportNodeAsync = function (context, node, babylonNode) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (babylonNode instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["ShadowLight"]) {
                var babylonLight = babylonNode;
                var light = void 0;
                var lightType = (babylonLight.getTypeID() == babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Light"].LIGHTTYPEID_POINTLIGHT ? LightType.POINT : (babylonLight.getTypeID() == babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Light"].LIGHTTYPEID_DIRECTIONALLIGHT ? LightType.DIRECTIONAL : (babylonLight.getTypeID() == babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Light"].LIGHTTYPEID_SPOTLIGHT ? LightType.SPOT : null)));
                if (lightType == null) {
                    babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Logger"].Warn(context + ": Light " + babylonLight.name + " is not supported in " + NAME);
                }
                else {
                    var lightPosition = babylonLight.position.clone();
                    if (!lightPosition.equals(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero())) {
                        if (_this._exporter._convertToRightHandedSystem) {
                            _glTFUtilities__WEBPACK_IMPORTED_MODULE_2__["_GLTFUtilities"]._GetRightHandedPositionVector3FromRef(lightPosition);
                        }
                        node.translation = lightPosition.asArray();
                    }
                    if (lightType !== LightType.POINT) {
                        var localAxis = babylonLight.direction;
                        var yaw = -Math.atan2(localAxis.z, localAxis.x) + Math.PI / 2;
                        var len = Math.sqrt(localAxis.x * localAxis.x + localAxis.z * localAxis.z);
                        var pitch = -Math.atan2(localAxis.y, len);
                        var lightRotationQuaternion = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].RotationYawPitchRoll(yaw, pitch, 0);
                        if (_this._exporter._convertToRightHandedSystem) {
                            _glTFUtilities__WEBPACK_IMPORTED_MODULE_2__["_GLTFUtilities"]._GetRightHandedQuaternionFromRef(lightRotationQuaternion);
                        }
                        if (!lightRotationQuaternion.equals(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].Identity())) {
                            node.rotation = lightRotationQuaternion.asArray();
                        }
                    }
                    if (babylonLight.falloffType !== babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Light"].FALLOFF_GLTF) {
                        babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Logger"].Warn(context + ": Light falloff for " + babylonLight.name + " does not match the " + NAME + " specification!");
                    }
                    light = {
                        type: lightType
                    };
                    if (!babylonLight.diffuse.equals(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].White())) {
                        light.color = babylonLight.diffuse.asArray();
                    }
                    if (babylonLight.intensity !== 1.0) {
                        light.intensity = babylonLight.intensity;
                    }
                    if (babylonLight.range !== Number.MAX_VALUE) {
                        light.range = babylonLight.range;
                    }
                    if (lightType === LightType.SPOT) {
                        var babylonSpotLight = babylonLight;
                        if (babylonSpotLight.angle !== Math.PI / 2.0) {
                            if (light.spot == null) {
                                light.spot = {};
                            }
                            light.spot.outerConeAngle = babylonSpotLight.angle / 2.0;
                        }
                        if (babylonSpotLight.innerAngle !== 0) {
                            if (light.spot == null) {
                                light.spot = {};
                            }
                            light.spot.innerConeAngle = babylonSpotLight.innerAngle / 2.0;
                        }
                    }
                    if (_this._lights == null) {
                        _this._lights = {
                            lights: []
                        };
                    }
                    _this._lights.lights.push(light);
                    if (node.extensions == null) {
                        node.extensions = {};
                    }
                    var lightReference = {
                        light: _this._lights.lights.length - 1
                    };
                    node.extensions[NAME] = lightReference;
                }
            }
            resolve(node);
        });
    };
    return KHR_lights_punctual;
}());

_glTFExporter__WEBPACK_IMPORTED_MODULE_1__["_Exporter"].RegisterExtension(NAME, function (exporter) { return new KHR_lights_punctual(exporter); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_texture_transform.ts":
/*!******************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_texture_transform.ts ***!
  \******************************************************/
/*! exports provided: KHR_texture_transform */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_texture_transform", function() { return KHR_texture_transform; });
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Misc/tools */ "babylonjs/Maths/math");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFExporter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFExporter */ "./glTF/2.0/glTFExporter.ts");
/* harmony import */ var _shaders_textureTransform_fragment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../shaders/textureTransform.fragment */ "./glTF/2.0/shaders/textureTransform.fragment.ts");



var NAME = "KHR_texture_transform";

/**
 * @hidden
 */
var KHR_texture_transform = /** @class */ (function () {
    function KHR_texture_transform(exporter) {
        /** Name of this extension */
        this.name = NAME;
        /** Defines whether this extension is enabled */
        this.enabled = true;
        /** Defines whether this extension is required */
        this.required = false;
        this._exporter = exporter;
    }
    KHR_texture_transform.prototype.dispose = function () {
        delete this._exporter;
    };
    KHR_texture_transform.prototype.preExportTextureAsync = function (context, babylonTexture, mimeType) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var scene = babylonTexture.getScene();
            if (!scene) {
                reject(context + ": \"scene\" is not defined for Babylon texture " + babylonTexture.name + "!");
                return;
            }
            // TODO: this doesn't take into account rotation center values
            var texture_transform_extension = {};
            if (babylonTexture.uOffset !== 0 || babylonTexture.vOffset !== 0) {
                texture_transform_extension.offset = [babylonTexture.uOffset, babylonTexture.vOffset];
            }
            if (babylonTexture.uScale !== 1 || babylonTexture.vScale !== 1) {
                texture_transform_extension.scale = [babylonTexture.uScale, babylonTexture.vScale];
            }
            if (babylonTexture.wAng !== 0) {
                texture_transform_extension.rotation = babylonTexture.wAng;
            }
            if (!Object.keys(texture_transform_extension).length) {
                resolve(babylonTexture);
                return;
            }
            return _this._textureTransformTextureAsync(babylonTexture, scene)
                .then(function (proceduralTexture) {
                resolve(proceduralTexture);
            })
                .catch(function (e) {
                reject(e);
            });
        });
    };
    /**
     * Transform the babylon texture by the offset, rotation and scale parameters using a procedural texture
     * @param babylonTexture
     * @param offset
     * @param rotation
     * @param scale
     * @param scene
     */
    KHR_texture_transform.prototype._textureTransformTextureAsync = function (babylonTexture, scene) {
        return new Promise(function (resolve) {
            var proceduralTexture = new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["ProceduralTexture"]("" + babylonTexture.name, babylonTexture.getSize(), "textureTransform", scene);
            if (!proceduralTexture) {
                babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["Tools"].Log("Cannot create procedural texture for " + babylonTexture.name + "!");
                resolve(babylonTexture);
            }
            proceduralTexture.setTexture("textureSampler", babylonTexture);
            proceduralTexture.setMatrix("textureTransformMat", babylonTexture.getTextureMatrix());
            // isReady trigger creation of effect if it doesnt exist yet
            if (proceduralTexture.isReady()) {
                proceduralTexture.render();
                resolve(proceduralTexture);
            }
            else {
                proceduralTexture.getEffect().executeWhenCompiled(function () {
                    proceduralTexture.render();
                    resolve(proceduralTexture);
                });
            }
        });
    };
    return KHR_texture_transform;
}());

_glTFExporter__WEBPACK_IMPORTED_MODULE_1__["_Exporter"].RegisterExtension(NAME, function (exporter) { return new KHR_texture_transform(exporter); });


/***/ }),

/***/ "./glTF/2.0/Extensions/index.ts":
/*!**************************************!*\
  !*** ./glTF/2.0/Extensions/index.ts ***!
  \**************************************/
/*! exports provided: KHR_texture_transform, KHR_lights_punctual */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _KHR_texture_transform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./KHR_texture_transform */ "./glTF/2.0/Extensions/KHR_texture_transform.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_texture_transform", function() { return _KHR_texture_transform__WEBPACK_IMPORTED_MODULE_0__["KHR_texture_transform"]; });

/* harmony import */ var _KHR_lights_punctual__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./KHR_lights_punctual */ "./glTF/2.0/Extensions/KHR_lights_punctual.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_lights_punctual", function() { return _KHR_lights_punctual__WEBPACK_IMPORTED_MODULE_1__["KHR_lights_punctual"]; });





/***/ }),

/***/ "./glTF/2.0/glTFAnimation.ts":
/*!***********************************!*\
  !*** ./glTF/2.0/glTFAnimation.ts ***!
  \***********************************/
/*! exports provided: _GLTFAnimation */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_GLTFAnimation", function() { return _GLTFAnimation; });
/* harmony import */ var babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math */ "babylonjs/Maths/math");
/* harmony import */ var babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./glTFUtilities */ "./glTF/2.0/glTFUtilities.ts");







/**
 * @hidden
 * Enum for handling in tangent and out tangent.
 */
var _TangentType;
(function (_TangentType) {
    /**
     * Specifies that input tangents are used.
     */
    _TangentType[_TangentType["INTANGENT"] = 0] = "INTANGENT";
    /**
     * Specifies that output tangents are used.
     */
    _TangentType[_TangentType["OUTTANGENT"] = 1] = "OUTTANGENT";
})(_TangentType || (_TangentType = {}));
/**
 * @hidden
 * Utility class for generating glTF animation data from BabylonJS.
 */
var _GLTFAnimation = /** @class */ (function () {
    function _GLTFAnimation() {
    }
    /**
     * @ignore
     *
     * Creates glTF channel animation from BabylonJS animation.
     * @param babylonTransformNode - BabylonJS mesh.
     * @param animation - animation.
     * @param animationChannelTargetPath - The target animation channel.
     * @param convertToRightHandedSystem - Specifies if the values should be converted to right-handed.
     * @param useQuaternion - Specifies if quaternions are used.
     * @returns nullable IAnimationData
     */
    _GLTFAnimation._CreateNodeAnimation = function (babylonTransformNode, animation, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion, animationSampleRate) {
        var inputs = [];
        var outputs = [];
        var keyFrames = animation.getKeys();
        var minMaxKeyFrames = _GLTFAnimation.calculateMinMaxKeyFrames(keyFrames);
        var interpolationOrBake = _GLTFAnimation._DeduceInterpolation(keyFrames, animationChannelTargetPath, useQuaternion);
        var frameDelta = minMaxKeyFrames.max - minMaxKeyFrames.min;
        var interpolation = interpolationOrBake.interpolationType;
        var shouldBakeAnimation = interpolationOrBake.shouldBakeAnimation;
        if (shouldBakeAnimation) {
            _GLTFAnimation._CreateBakedAnimation(babylonTransformNode, animation, animationChannelTargetPath, minMaxKeyFrames.min, minMaxKeyFrames.max, animation.framePerSecond, animationSampleRate, inputs, outputs, minMaxKeyFrames, convertToRightHandedSystem, useQuaternion);
        }
        else {
            if (interpolation === "LINEAR" /* LINEAR */ || interpolation === "STEP" /* STEP */) {
                _GLTFAnimation._CreateLinearOrStepAnimation(babylonTransformNode, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion);
            }
            else if (interpolation === "CUBICSPLINE" /* CUBICSPLINE */) {
                _GLTFAnimation._CreateCubicSplineAnimation(babylonTransformNode, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion);
            }
            else {
                _GLTFAnimation._CreateBakedAnimation(babylonTransformNode, animation, animationChannelTargetPath, minMaxKeyFrames.min, minMaxKeyFrames.max, animation.framePerSecond, animationSampleRate, inputs, outputs, minMaxKeyFrames, convertToRightHandedSystem, useQuaternion);
            }
        }
        if (inputs.length && outputs.length) {
            var result = {
                inputs: inputs,
                outputs: outputs,
                samplerInterpolation: interpolation,
                inputsMin: shouldBakeAnimation ? minMaxKeyFrames.min : babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].FloatRound(minMaxKeyFrames.min / animation.framePerSecond),
                inputsMax: shouldBakeAnimation ? minMaxKeyFrames.max : babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].FloatRound(minMaxKeyFrames.max / animation.framePerSecond)
            };
            return result;
        }
        return null;
    };
    _GLTFAnimation._DeduceAnimationInfo = function (animation) {
        var animationChannelTargetPath = null;
        var dataAccessorType = "VEC3" /* VEC3 */;
        var useQuaternion = false;
        var property = animation.targetProperty.split('.');
        switch (property[0]) {
            case 'scaling': {
                animationChannelTargetPath = "scale" /* SCALE */;
                break;
            }
            case 'position': {
                animationChannelTargetPath = "translation" /* TRANSLATION */;
                break;
            }
            case 'rotation': {
                dataAccessorType = "VEC4" /* VEC4 */;
                animationChannelTargetPath = "rotation" /* ROTATION */;
                break;
            }
            case 'rotationQuaternion': {
                dataAccessorType = "VEC4" /* VEC4 */;
                useQuaternion = true;
                animationChannelTargetPath = "rotation" /* ROTATION */;
                break;
            }
            default: {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].Error("Unsupported animatable property " + property[0]);
            }
        }
        if (animationChannelTargetPath) {
            return { animationChannelTargetPath: animationChannelTargetPath, dataAccessorType: dataAccessorType, useQuaternion: useQuaternion };
        }
        else {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].Error('animation channel target path and data accessor type could be deduced');
        }
        return null;
    };
    /**
     * @ignore
     * Create node animations from the transform node animations
     * @param babylonNode
     * @param runtimeGLTFAnimation
     * @param idleGLTFAnimations
     * @param nodeMap
     * @param nodes
     * @param binaryWriter
     * @param bufferViews
     * @param accessors
     * @param convertToRightHandedSystem
     */
    _GLTFAnimation._CreateNodeAnimationFromNodeAnimations = function (babylonNode, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, nodes, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, animationSampleRate) {
        var glTFAnimation;
        if (babylonNode instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["TransformNode"]) {
            if (babylonNode.animations) {
                for (var _i = 0, _a = babylonNode.animations; _i < _a.length; _i++) {
                    var animation = _a[_i];
                    var animationInfo = _GLTFAnimation._DeduceAnimationInfo(animation);
                    if (animationInfo) {
                        glTFAnimation = {
                            name: animation.name,
                            samplers: [],
                            channels: []
                        };
                        _GLTFAnimation.AddAnimation("" + animation.name, animation.hasRunningRuntimeAnimations ? runtimeGLTFAnimation : glTFAnimation, babylonNode, animation, animationInfo.dataAccessorType, animationInfo.animationChannelTargetPath, nodeMap, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, animationInfo.useQuaternion, animationSampleRate);
                        if (glTFAnimation.samplers.length && glTFAnimation.channels.length) {
                            idleGLTFAnimations.push(glTFAnimation);
                        }
                    }
                }
            }
        }
    };
    /**
     * @ignore
     * Create node animations from the animation groups
     * @param babylonScene
     * @param glTFAnimations
     * @param nodeMap
     * @param nodes
     * @param binaryWriter
     * @param bufferViews
     * @param accessors
     * @param convertToRightHandedSystem
     */
    _GLTFAnimation._CreateNodeAnimationFromAnimationGroups = function (babylonScene, glTFAnimations, nodeMap, nodes, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, animationSampleRate) {
        var glTFAnimation;
        if (babylonScene.animationGroups) {
            var animationGroups = babylonScene.animationGroups;
            for (var _i = 0, animationGroups_1 = animationGroups; _i < animationGroups_1.length; _i++) {
                var animationGroup = animationGroups_1[_i];
                glTFAnimation = {
                    name: animationGroup.name,
                    channels: [],
                    samplers: []
                };
                for (var _a = 0, _b = animationGroup.targetedAnimations; _a < _b.length; _a++) {
                    var targetAnimation = _b[_a];
                    var target = targetAnimation.target;
                    var animation = targetAnimation.animation;
                    if (target instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Mesh"] || target.length === 1 && target[0] instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Mesh"]) { // TODO: Update to support bones
                        var animationInfo = _GLTFAnimation._DeduceAnimationInfo(targetAnimation.animation);
                        if (animationInfo) {
                            var babylonMesh = target instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Mesh"] ? target : target[0];
                            _GLTFAnimation.AddAnimation("" + animation.name, glTFAnimation, babylonMesh, animation, animationInfo.dataAccessorType, animationInfo.animationChannelTargetPath, nodeMap, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, animationInfo.useQuaternion, animationSampleRate);
                        }
                    }
                }
                if (glTFAnimation.channels.length && glTFAnimation.samplers.length) {
                    glTFAnimations.push(glTFAnimation);
                }
            }
        }
    };
    _GLTFAnimation.AddAnimation = function (name, glTFAnimation, babylonTransformNode, animation, dataAccessorType, animationChannelTargetPath, nodeMap, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, useQuaternion, animationSampleRate) {
        var animationData = _GLTFAnimation._CreateNodeAnimation(babylonTransformNode, animation, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion, animationSampleRate);
        var bufferView;
        var accessor;
        var keyframeAccessorIndex;
        var dataAccessorIndex;
        var outputLength;
        var animationSampler;
        var animationChannel;
        if (animationData) {
            var nodeIndex = nodeMap[babylonTransformNode.uniqueId];
            // Creates buffer view and accessor for key frames.
            var byteLength = animationData.inputs.length * 4;
            bufferView = _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, name + "  keyframe data view");
            bufferViews.push(bufferView);
            animationData.inputs.forEach(function (input) {
                binaryWriter.setFloat32(input);
            });
            accessor = _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._CreateAccessor(bufferViews.length - 1, name + "  keyframes", "SCALAR" /* SCALAR */, 5126 /* FLOAT */, animationData.inputs.length, null, [animationData.inputsMin], [animationData.inputsMax]);
            accessors.push(accessor);
            keyframeAccessorIndex = accessors.length - 1;
            // create bufferview and accessor for keyed values.
            outputLength = animationData.outputs.length;
            byteLength = dataAccessorType === "VEC3" /* VEC3 */ ? animationData.outputs.length * 12 : animationData.outputs.length * 16;
            // check for in and out tangents
            bufferView = _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, name + "  data view");
            bufferViews.push(bufferView);
            animationData.outputs.forEach(function (output) {
                output.forEach(function (entry) {
                    binaryWriter.setFloat32(entry);
                });
            });
            accessor = _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._CreateAccessor(bufferViews.length - 1, name + "  data", dataAccessorType, 5126 /* FLOAT */, outputLength, null, null, null);
            accessors.push(accessor);
            dataAccessorIndex = accessors.length - 1;
            // create sampler
            animationSampler = {
                interpolation: animationData.samplerInterpolation,
                input: keyframeAccessorIndex,
                output: dataAccessorIndex
            };
            glTFAnimation.samplers.push(animationSampler);
            // create channel
            animationChannel = {
                sampler: glTFAnimation.samplers.length - 1,
                target: {
                    node: nodeIndex,
                    path: animationChannelTargetPath
                }
            };
            glTFAnimation.channels.push(animationChannel);
        }
    };
    /**
     * Create a baked animation
     * @param babylonTransformNode BabylonJS mesh
     * @param animation BabylonJS animation corresponding to the BabylonJS mesh
     * @param animationChannelTargetPath animation target channel
     * @param minFrame minimum animation frame
     * @param maxFrame maximum animation frame
     * @param fps frames per second of the animation
     * @param inputs input key frames of the animation
     * @param outputs output key frame data of the animation
     * @param convertToRightHandedSystem converts the values to right-handed
     * @param useQuaternion specifies if quaternions should be used
     */
    _GLTFAnimation._CreateBakedAnimation = function (babylonTransformNode, animation, animationChannelTargetPath, minFrame, maxFrame, fps, sampleRate, inputs, outputs, minMaxFrames, convertToRightHandedSystem, useQuaternion) {
        var value;
        var quaternionCache = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].Identity();
        var previousTime = null;
        var time;
        var maxUsedFrame = null;
        var currKeyFrame = null;
        var nextKeyFrame = null;
        var prevKeyFrame = null;
        var endFrame = null;
        minMaxFrames.min = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].FloatRound(minFrame / fps);
        var keyFrames = animation.getKeys();
        for (var i = 0, length_1 = keyFrames.length; i < length_1; ++i) {
            endFrame = null;
            currKeyFrame = keyFrames[i];
            if (i + 1 < length_1) {
                nextKeyFrame = keyFrames[i + 1];
                if (currKeyFrame.value.equals && currKeyFrame.value.equals(nextKeyFrame.value) || currKeyFrame.value === nextKeyFrame.value) {
                    if (i === 0) { // set the first frame to itself
                        endFrame = currKeyFrame.frame;
                    }
                    else {
                        continue;
                    }
                }
                else {
                    endFrame = nextKeyFrame.frame;
                }
            }
            else {
                // at the last key frame
                prevKeyFrame = keyFrames[i - 1];
                if (currKeyFrame.value.equals && currKeyFrame.value.equals(prevKeyFrame.value) || currKeyFrame.value === prevKeyFrame.value) {
                    continue;
                }
                else {
                    endFrame = maxFrame;
                }
            }
            if (endFrame) {
                for (var f = currKeyFrame.frame; f <= endFrame; f += sampleRate) {
                    time = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].FloatRound(f / fps);
                    if (time === previousTime) {
                        continue;
                    }
                    previousTime = time;
                    maxUsedFrame = time;
                    var state = {
                        key: 0,
                        repeatCount: 0,
                        loopMode: animation.loopMode
                    };
                    value = animation._interpolate(f, state);
                    _GLTFAnimation._SetInterpolatedValue(babylonTransformNode, value, time, animation, animationChannelTargetPath, quaternionCache, inputs, outputs, convertToRightHandedSystem, useQuaternion);
                }
            }
        }
        if (maxUsedFrame) {
            minMaxFrames.max = maxUsedFrame;
        }
    };
    _GLTFAnimation._ConvertFactorToVector3OrQuaternion = function (factor, babylonTransformNode, animation, animationType, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion) {
        var property;
        var componentName;
        var value = null;
        var basePositionRotationOrScale = _GLTFAnimation._GetBasePositionRotationOrScale(babylonTransformNode, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
        if (animationType === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Animation"].ANIMATIONTYPE_FLOAT) { // handles single component x, y, z or w component animation by using a base property and animating over a component.
            property = animation.targetProperty.split('.');
            componentName = property ? property[1] : ''; // x, y, or z component
            value = useQuaternion ? babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray(basePositionRotationOrScale).normalize() : babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromArray(basePositionRotationOrScale);
            switch (componentName) {
                case 'x': {
                    value[componentName] = (convertToRightHandedSystem && useQuaternion && (animationChannelTargetPath !== "scale" /* SCALE */)) ? -factor : factor;
                    break;
                }
                case 'y': {
                    value[componentName] = (convertToRightHandedSystem && useQuaternion && (animationChannelTargetPath !== "scale" /* SCALE */)) ? -factor : factor;
                    break;
                }
                case 'z': {
                    value[componentName] = (convertToRightHandedSystem && !useQuaternion && (animationChannelTargetPath !== "scale" /* SCALE */)) ? -factor : factor;
                    break;
                }
                case 'w': {
                    value.w = factor;
                    break;
                }
                default: {
                    babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].Error("glTFAnimation: Unsupported component type \"" + componentName + "\" for scale animation!");
                }
            }
        }
        return value;
    };
    _GLTFAnimation._SetInterpolatedValue = function (babylonTransformNode, value, time, animation, animationChannelTargetPath, quaternionCache, inputs, outputs, convertToRightHandedSystem, useQuaternion) {
        var animationType = animation.dataType;
        var cacheValue;
        inputs.push(time);
        if (typeof value === "number") {
            value = this._ConvertFactorToVector3OrQuaternion(value, babylonTransformNode, animation, animationType, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
        }
        if (value) {
            if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                if (useQuaternion) {
                    quaternionCache = value;
                }
                else {
                    cacheValue = value;
                    babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].RotationYawPitchRollToRef(cacheValue.y, cacheValue.x, cacheValue.z, quaternionCache);
                }
                if (convertToRightHandedSystem) {
                    _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._GetRightHandedQuaternionFromRef(quaternionCache);
                    if (!babylonTransformNode.parent) {
                        quaternionCache = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray([0, 1, 0, 0]).multiply(quaternionCache);
                    }
                }
                outputs.push(quaternionCache.asArray());
            }
            else {
                cacheValue = value;
                if (convertToRightHandedSystem && (animationChannelTargetPath !== "scale" /* SCALE */)) {
                    _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._GetRightHandedPositionVector3FromRef(cacheValue);
                    if (!babylonTransformNode.parent) {
                        cacheValue.x *= -1;
                        cacheValue.z *= -1;
                    }
                }
                outputs.push(cacheValue.asArray());
            }
        }
    };
    /**
     * Creates linear animation from the animation key frames
     * @param babylonTransformNode BabylonJS mesh
     * @param animation BabylonJS animation
     * @param animationChannelTargetPath The target animation channel
     * @param frameDelta The difference between the last and first frame of the animation
     * @param inputs Array to store the key frame times
     * @param outputs Array to store the key frame data
     * @param convertToRightHandedSystem Specifies if the position data should be converted to right handed
     * @param useQuaternion Specifies if quaternions are used in the animation
     */
    _GLTFAnimation._CreateLinearOrStepAnimation = function (babylonTransformNode, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion) {
        for (var _i = 0, _a = animation.getKeys(); _i < _a.length; _i++) {
            var keyFrame = _a[_i];
            inputs.push(keyFrame.frame / animation.framePerSecond); // keyframes in seconds.
            _GLTFAnimation._AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonTransformNode, convertToRightHandedSystem, useQuaternion);
        }
    };
    /**
     * Creates cubic spline animation from the animation key frames
     * @param babylonTransformNode BabylonJS mesh
     * @param animation BabylonJS animation
     * @param animationChannelTargetPath The target animation channel
     * @param frameDelta The difference between the last and first frame of the animation
     * @param inputs Array to store the key frame times
     * @param outputs Array to store the key frame data
     * @param convertToRightHandedSystem Specifies if the position data should be converted to right handed
     * @param useQuaternion Specifies if quaternions are used in the animation
     */
    _GLTFAnimation._CreateCubicSplineAnimation = function (babylonTransformNode, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion) {
        animation.getKeys().forEach(function (keyFrame) {
            inputs.push(keyFrame.frame / animation.framePerSecond); // keyframes in seconds.
            _GLTFAnimation.AddSplineTangent(babylonTransformNode, _TangentType.INTANGENT, outputs, animationChannelTargetPath, "CUBICSPLINE" /* CUBICSPLINE */, keyFrame, frameDelta, useQuaternion, convertToRightHandedSystem);
            _GLTFAnimation._AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonTransformNode, convertToRightHandedSystem, useQuaternion);
            _GLTFAnimation.AddSplineTangent(babylonTransformNode, _TangentType.OUTTANGENT, outputs, animationChannelTargetPath, "CUBICSPLINE" /* CUBICSPLINE */, keyFrame, frameDelta, useQuaternion, convertToRightHandedSystem);
        });
    };
    _GLTFAnimation._GetBasePositionRotationOrScale = function (babylonTransformNode, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion) {
        var basePositionRotationOrScale;
        if (animationChannelTargetPath === "rotation" /* ROTATION */) {
            if (useQuaternion) {
                if (babylonTransformNode.rotationQuaternion) {
                    basePositionRotationOrScale = babylonTransformNode.rotationQuaternion.asArray();
                    if (convertToRightHandedSystem) {
                        _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._GetRightHandedQuaternionArrayFromRef(basePositionRotationOrScale);
                        if (!babylonTransformNode.parent) {
                            basePositionRotationOrScale = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray([0, 1, 0, 0]).multiply(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray(basePositionRotationOrScale)).asArray();
                        }
                    }
                }
                else {
                    basePositionRotationOrScale = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].Identity().asArray();
                }
            }
            else {
                basePositionRotationOrScale = babylonTransformNode.rotation.asArray();
                _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._GetRightHandedNormalArray3FromRef(basePositionRotationOrScale);
            }
        }
        else if (animationChannelTargetPath === "translation" /* TRANSLATION */) {
            basePositionRotationOrScale = babylonTransformNode.position.asArray();
            if (convertToRightHandedSystem) {
                _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._GetRightHandedPositionArray3FromRef(basePositionRotationOrScale);
            }
        }
        else { // scale
            basePositionRotationOrScale = babylonTransformNode.scaling.asArray();
        }
        return basePositionRotationOrScale;
    };
    /**
     * Adds a key frame value
     * @param keyFrame
     * @param animation
     * @param outputs
     * @param animationChannelTargetPath
     * @param basePositionRotationOrScale
     * @param convertToRightHandedSystem
     * @param useQuaternion
     */
    _GLTFAnimation._AddKeyframeValue = function (keyFrame, animation, outputs, animationChannelTargetPath, babylonTransformNode, convertToRightHandedSystem, useQuaternion) {
        var value;
        var newPositionRotationOrScale;
        var animationType = animation.dataType;
        if (animationType === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Animation"].ANIMATIONTYPE_VECTOR3) {
            value = keyFrame.value.asArray();
            if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                var array = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromArray(value);
                var rotationQuaternion = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].RotationYawPitchRoll(array.y, array.x, array.z);
                if (convertToRightHandedSystem) {
                    _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._GetRightHandedQuaternionFromRef(rotationQuaternion);
                    if (!babylonTransformNode.parent) {
                        rotationQuaternion = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray([0, 1, 0, 0]).multiply(rotationQuaternion);
                    }
                }
                value = rotationQuaternion.asArray();
            }
            else if (animationChannelTargetPath === "translation" /* TRANSLATION */) {
                if (convertToRightHandedSystem) {
                    _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._GetRightHandedNormalArray3FromRef(value);
                    if (!babylonTransformNode.parent) {
                        value[0] *= -1;
                        value[2] *= -1;
                    }
                }
            }
            outputs.push(value); // scale  vector.
        }
        else if (animationType === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Animation"].ANIMATIONTYPE_FLOAT) { // handles single component x, y, z or w component animation by using a base property and animating over a component.
            newPositionRotationOrScale = this._ConvertFactorToVector3OrQuaternion(keyFrame.value, babylonTransformNode, animation, animationType, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
            if (newPositionRotationOrScale) {
                if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                    var posRotScale = useQuaternion ? newPositionRotationOrScale : babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].RotationYawPitchRoll(newPositionRotationOrScale.y, newPositionRotationOrScale.x, newPositionRotationOrScale.z).normalize();
                    if (convertToRightHandedSystem) {
                        _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._GetRightHandedQuaternionFromRef(posRotScale);
                        if (!babylonTransformNode.parent) {
                            posRotScale = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray([0, 1, 0, 0]).multiply(posRotScale);
                        }
                    }
                    outputs.push(posRotScale.asArray());
                }
                else if (animationChannelTargetPath === "translation" /* TRANSLATION */) {
                    if (convertToRightHandedSystem) {
                        _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._GetRightHandedNormalVector3FromRef(newPositionRotationOrScale);
                        if (!babylonTransformNode.parent) {
                            newPositionRotationOrScale.x *= -1;
                            newPositionRotationOrScale.z *= -1;
                        }
                    }
                }
                outputs.push(newPositionRotationOrScale.asArray());
            }
        }
        else if (animationType === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Animation"].ANIMATIONTYPE_QUATERNION) {
            value = keyFrame.value.normalize().asArray();
            if (convertToRightHandedSystem) {
                _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._GetRightHandedQuaternionArrayFromRef(value);
                if (!babylonTransformNode.parent) {
                    value = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray([0, 1, 0, 0]).multiply(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray(value)).asArray();
                }
            }
            outputs.push(value);
        }
        else {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].Error('glTFAnimation: Unsupported key frame values for animation!');
        }
    };
    /**
     * Determine the interpolation based on the key frames
     * @param keyFrames
     * @param animationChannelTargetPath
     * @param useQuaternion
     */
    _GLTFAnimation._DeduceInterpolation = function (keyFrames, animationChannelTargetPath, useQuaternion) {
        var interpolationType;
        var shouldBakeAnimation = false;
        var key;
        if (animationChannelTargetPath === "rotation" /* ROTATION */ && !useQuaternion) {
            return { interpolationType: "LINEAR" /* LINEAR */, shouldBakeAnimation: true };
        }
        for (var i = 0, length_2 = keyFrames.length; i < length_2; ++i) {
            key = keyFrames[i];
            if (key.inTangent || key.outTangent) {
                if (interpolationType) {
                    if (interpolationType !== "CUBICSPLINE" /* CUBICSPLINE */) {
                        interpolationType = "LINEAR" /* LINEAR */;
                        shouldBakeAnimation = true;
                        break;
                    }
                }
                else {
                    interpolationType = "CUBICSPLINE" /* CUBICSPLINE */;
                }
            }
            else {
                if (interpolationType) {
                    if (interpolationType === "CUBICSPLINE" /* CUBICSPLINE */ ||
                        (key.interpolation && (key.interpolation === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["AnimationKeyInterpolation"].STEP) && interpolationType !== "STEP" /* STEP */)) {
                        interpolationType = "LINEAR" /* LINEAR */;
                        shouldBakeAnimation = true;
                        break;
                    }
                }
                else {
                    if (key.interpolation && (key.interpolation === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["AnimationKeyInterpolation"].STEP)) {
                        interpolationType = "STEP" /* STEP */;
                    }
                    else {
                        interpolationType = "LINEAR" /* LINEAR */;
                    }
                }
            }
        }
        if (!interpolationType) {
            interpolationType = "LINEAR" /* LINEAR */;
        }
        return { interpolationType: interpolationType, shouldBakeAnimation: shouldBakeAnimation };
    };
    /**
     * Adds an input tangent or output tangent to the output data
     * If an input tangent or output tangent is missing, it uses the zero vector or zero quaternion
     * @param tangentType Specifies which type of tangent to handle (inTangent or outTangent)
     * @param outputs The animation data by keyframe
     * @param animationChannelTargetPath The target animation channel
     * @param interpolation The interpolation type
     * @param keyFrame The key frame with the animation data
     * @param frameDelta Time difference between two frames used to scale the tangent by the frame delta
     * @param useQuaternion Specifies if quaternions are used
     * @param convertToRightHandedSystem Specifies if the values should be converted to right-handed
     */
    _GLTFAnimation.AddSplineTangent = function (babylonTransformNode, tangentType, outputs, animationChannelTargetPath, interpolation, keyFrame, frameDelta, useQuaternion, convertToRightHandedSystem) {
        var tangent;
        var tangentValue = tangentType === _TangentType.INTANGENT ? keyFrame.inTangent : keyFrame.outTangent;
        if (interpolation === "CUBICSPLINE" /* CUBICSPLINE */) {
            if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                if (tangentValue) {
                    if (useQuaternion) {
                        tangent = tangentValue.scale(frameDelta).asArray();
                    }
                    else {
                        var array = tangentValue.scale(frameDelta);
                        tangent = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].RotationYawPitchRoll(array.y, array.x, array.z).asArray();
                    }
                    if (convertToRightHandedSystem) {
                        _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._GetRightHandedQuaternionArrayFromRef(tangent);
                        if (!babylonTransformNode.parent) {
                            tangent = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray([0, 1, 0, 0]).multiply(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray(tangent)).asArray();
                        }
                    }
                }
                else {
                    tangent = [0, 0, 0, 0];
                }
            }
            else {
                if (tangentValue) {
                    tangent = tangentValue.scale(frameDelta).asArray();
                    if (convertToRightHandedSystem) {
                        if (animationChannelTargetPath === "translation" /* TRANSLATION */) {
                            _glTFUtilities__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]._GetRightHandedPositionArray3FromRef(tangent);
                            if (!babylonTransformNode.parent) {
                                tangent[0] *= -1; // x
                                tangent[2] *= -1; // z
                            }
                        }
                    }
                }
                else {
                    tangent = [0, 0, 0];
                }
            }
            outputs.push(tangent);
        }
    };
    /**
     * Get the minimum and maximum key frames' frame values
     * @param keyFrames animation key frames
     * @returns the minimum and maximum key frame value
     */
    _GLTFAnimation.calculateMinMaxKeyFrames = function (keyFrames) {
        var min = Infinity;
        var max = -Infinity;
        keyFrames.forEach(function (keyFrame) {
            min = Math.min(min, keyFrame.frame);
            max = Math.max(max, keyFrame.frame);
        });
        return { min: min, max: max };
    };
    return _GLTFAnimation;
}());



/***/ }),

/***/ "./glTF/2.0/glTFData.ts":
/*!******************************!*\
  !*** ./glTF/2.0/glTFData.ts ***!
  \******************************/
/*! exports provided: GLTFData */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GLTFData", function() { return GLTFData; });
/**
 * Class for holding and downloading glTF file data
 */
var GLTFData = /** @class */ (function () {
    /**
     * Initializes the glTF file object
     */
    function GLTFData() {
        this.glTFFiles = {};
    }
    /**
     * Downloads the glTF data as files based on their names and data
     */
    GLTFData.prototype.downloadFiles = function () {
        /**
        * Checks for a matching suffix at the end of a string (for ES5 and lower)
        * @param str Source string
        * @param suffix Suffix to search for in the source string
        * @returns Boolean indicating whether the suffix was found (true) or not (false)
        */
        function endsWith(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        }
        for (var key in this.glTFFiles) {
            var link = document.createElement('a');
            document.body.appendChild(link);
            link.setAttribute("type", "hidden");
            link.download = key;
            var blob = this.glTFFiles[key];
            var mimeType = void 0;
            if (endsWith(key, ".glb")) {
                mimeType = { type: "model/gltf-binary" };
            }
            else if (endsWith(key, ".bin")) {
                mimeType = { type: "application/octet-stream" };
            }
            else if (endsWith(key, ".gltf")) {
                mimeType = { type: "model/gltf+json" };
            }
            else if (endsWith(key, ".jpeg" || false)) {
                mimeType = { type: "image/jpeg" /* JPEG */ };
            }
            else if (endsWith(key, ".png")) {
                mimeType = { type: "image/png" /* PNG */ };
            }
            link.href = window.URL.createObjectURL(new Blob([blob], mimeType));
            link.click();
        }
    };
    return GLTFData;
}());



/***/ }),

/***/ "./glTF/2.0/glTFExporter.ts":
/*!**********************************!*\
  !*** ./glTF/2.0/glTFExporter.ts ***!
  \**********************************/
/*! exports provided: _Exporter, _BinaryWriter */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_Exporter", function() { return _Exporter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_BinaryWriter", function() { return _BinaryWriter; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "../../node_modules/tslib/tslib.es6.js");
/* harmony import */ var babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Maths/math */ "babylonjs/Maths/math");
/* harmony import */ var babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _glTFMaterialExporter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./glTFMaterialExporter */ "./glTF/2.0/glTFMaterialExporter.ts");
/* harmony import */ var _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./glTFUtilities */ "./glTF/2.0/glTFUtilities.ts");
/* harmony import */ var _glTFData__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./glTFData */ "./glTF/2.0/glTFData.ts");
/* harmony import */ var _glTFAnimation__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./glTFAnimation */ "./glTF/2.0/glTFAnimation.ts");
















/**
 * Converts Babylon Scene into glTF 2.0.
 * @hidden
 */
var _Exporter = /** @class */ (function () {
    /**
     * Creates a glTF Exporter instance, which can accept optional exporter options
     * @param babylonScene Babylon scene object
     * @param options Options to modify the behavior of the exporter
     */
    function _Exporter(babylonScene, options) {
        this._extensions = {};
        this._glTF = {
            asset: { generator: "BabylonJS", version: "2.0" }
        };
        this._babylonScene = babylonScene;
        this._bufferViews = [];
        this._accessors = [];
        this._meshes = [];
        this._scenes = [];
        this._nodes = [];
        this._images = [];
        this._materials = [];
        this._materialMap = [];
        this._textures = [];
        this._samplers = [];
        this._animations = [];
        this._imageData = {};
        this._convertToRightHandedSystem = !this._babylonScene.useRightHandedSystem;
        this._options = options || {};
        this._animationSampleRate = options && options.animationSampleRate ? options.animationSampleRate : 1 / 60;
        this._glTFMaterialExporter = new _glTFMaterialExporter__WEBPACK_IMPORTED_MODULE_2__["_GLTFMaterialExporter"](this);
        this._loadExtensions();
    }
    _Exporter.prototype._applyExtensions = function (property, actionAsync) {
        for (var _i = 0, _a = _Exporter._ExtensionNames; _i < _a.length; _i++) {
            var name_1 = _a[_i];
            var extension = this._extensions[name_1];
            if (extension.enabled) {
                var exporterProperty = property;
                exporterProperty._activeLoaderExtensions = exporterProperty._activeLoaderExtensions || {};
                var activeLoaderExtensions = exporterProperty._activeLoaderExtensions;
                if (!activeLoaderExtensions[name_1]) {
                    activeLoaderExtensions[name_1] = true;
                    try {
                        var result = actionAsync(extension);
                        if (result) {
                            return result;
                        }
                    }
                    finally {
                        delete activeLoaderExtensions[name_1];
                        delete exporterProperty._activeLoaderExtensions;
                    }
                }
            }
        }
        return null;
    };
    _Exporter.prototype._extensionsPreExportTextureAsync = function (context, babylonTexture, mimeType) {
        return this._applyExtensions(babylonTexture, function (extension) { return extension.preExportTextureAsync && extension.preExportTextureAsync(context, babylonTexture, mimeType); });
    };
    _Exporter.prototype._extensionsPostExportMeshPrimitiveAsync = function (context, meshPrimitive, babylonSubMesh, binaryWriter) {
        return this._applyExtensions(meshPrimitive, function (extension) { return extension.postExportMeshPrimitiveAsync && extension.postExportMeshPrimitiveAsync(context, meshPrimitive, babylonSubMesh, binaryWriter); });
    };
    _Exporter.prototype._extensionsPostExportNodeAsync = function (context, node, babylonNode) {
        return this._applyExtensions(node, function (extension) { return extension.postExportNodeAsync && extension.postExportNodeAsync(context, node, babylonNode); });
    };
    _Exporter.prototype._forEachExtensions = function (action) {
        for (var _i = 0, _a = _Exporter._ExtensionNames; _i < _a.length; _i++) {
            var name_2 = _a[_i];
            var extension = this._extensions[name_2];
            if (extension.enabled) {
                action(extension);
            }
        }
    };
    _Exporter.prototype._extensionsOnExporting = function () {
        this._forEachExtensions(function (extension) { return extension.onExporting && extension.onExporting(); });
    };
    /**
     * Load glTF serializer extensions
     */
    _Exporter.prototype._loadExtensions = function () {
        for (var _i = 0, _a = _Exporter._ExtensionNames; _i < _a.length; _i++) {
            var name_3 = _a[_i];
            var extension = _Exporter._ExtensionFactories[name_3](this);
            this._extensions[name_3] = extension;
        }
    };
    /**
     * Registers a glTF exporter extension
     * @param name Name of the extension to export
     * @param factory The factory function that creates the exporter extension
     */
    _Exporter.RegisterExtension = function (name, factory) {
        if (_Exporter.UnregisterExtension(name)) {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Warn("Extension with the name " + name + " already exists");
        }
        _Exporter._ExtensionFactories[name] = factory;
        _Exporter._ExtensionNames.push(name);
    };
    /**
     * Un-registers an exporter extension
     * @param name The name fo the exporter extension
     * @returns A boolean indicating whether the extension has been un-registered
     */
    _Exporter.UnregisterExtension = function (name) {
        if (!_Exporter._ExtensionFactories[name]) {
            return false;
        }
        delete _Exporter._ExtensionFactories[name];
        var index = _Exporter._ExtensionNames.indexOf(name);
        if (index !== -1) {
            _Exporter._ExtensionNames.splice(index, 1);
        }
        return true;
    };
    /**
     * Lazy load a local engine with premultiplied alpha set to false
     */
    _Exporter.prototype._getLocalEngine = function () {
        if (!this._localEngine) {
            var localCanvas = document.createElement('canvas');
            localCanvas.id = "WriteCanvas";
            localCanvas.width = 2048;
            localCanvas.height = 2048;
            this._localEngine = new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Engine"](localCanvas, true, { premultipliedAlpha: false, preserveDrawingBuffer: true });
            this._localEngine.setViewport(new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Viewport"](0, 0, 1, 1));
        }
        return this._localEngine;
    };
    _Exporter.prototype.reorderIndicesBasedOnPrimitiveMode = function (submesh, primitiveMode, babylonIndices, byteOffset, binaryWriter) {
        switch (primitiveMode) {
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].TriangleFillMode: {
                if (!byteOffset) {
                    byteOffset = 0;
                }
                for (var i = submesh.indexStart, length_1 = submesh.indexStart + submesh.indexCount; i < length_1; i = i + 3) {
                    var index = byteOffset + i * 4;
                    // swap the second and third indices
                    var secondIndex = binaryWriter.getUInt32(index + 4);
                    var thirdIndex = binaryWriter.getUInt32(index + 8);
                    binaryWriter.setUInt32(thirdIndex, index + 4);
                    binaryWriter.setUInt32(secondIndex, index + 8);
                }
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].TriangleFanDrawMode: {
                for (var i = submesh.indexStart + submesh.indexCount - 1, start = submesh.indexStart; i >= start; --i) {
                    binaryWriter.setUInt32(babylonIndices[i], byteOffset);
                    byteOffset += 4;
                }
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].TriangleStripDrawMode: {
                if (submesh.indexCount >= 3) {
                    binaryWriter.setUInt32(babylonIndices[submesh.indexStart + 2], byteOffset + 4);
                    binaryWriter.setUInt32(babylonIndices[submesh.indexStart + 1], byteOffset + 8);
                }
                break;
            }
        }
    };
    /**
     * Reorders the vertex attribute data based on the primitive mode.  This is necessary when indices are not available and the winding order is
     * clock-wise during export to glTF
     * @param submesh BabylonJS submesh
     * @param primitiveMode Primitive mode of the mesh
     * @param sideOrientation the winding order of the submesh
     * @param vertexBufferKind The type of vertex attribute
     * @param meshAttributeArray The vertex attribute data
     * @param byteOffset The offset to the binary data
     * @param binaryWriter The binary data for the glTF file
     */
    _Exporter.prototype.reorderVertexAttributeDataBasedOnPrimitiveMode = function (submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter) {
        if (this._convertToRightHandedSystem && sideOrientation === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].ClockWiseSideOrientation) {
            switch (primitiveMode) {
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].TriangleFillMode: {
                    this.reorderTriangleFillMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].TriangleStripDrawMode: {
                    this.reorderTriangleStripDrawMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].TriangleFanDrawMode: {
                    this.reorderTriangleFanMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
                    break;
                }
            }
        }
    };
    /**
     * Reorders the vertex attributes in the correct triangle mode order .  This is necessary when indices are not available and the winding order is
     * clock-wise during export to glTF
     * @param submesh BabylonJS submesh
     * @param primitiveMode Primitive mode of the mesh
     * @param sideOrientation the winding order of the submesh
     * @param vertexBufferKind The type of vertex attribute
     * @param meshAttributeArray The vertex attribute data
     * @param byteOffset The offset to the binary data
     * @param binaryWriter The binary data for the glTF file
     */
    _Exporter.prototype.reorderTriangleFillMode = function (submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter) {
        var vertexBuffer = this.getVertexBufferFromMesh(vertexBufferKind, submesh.getMesh());
        if (vertexBuffer) {
            var stride = vertexBuffer.byteStride / babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].GetTypeByteLength(vertexBuffer.type);
            if (submesh.verticesCount % 3 !== 0) {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error('The submesh vertices for the triangle fill mode is not divisible by 3!');
            }
            else {
                var vertexData = [];
                var index = 0;
                switch (vertexBufferKind) {
                    case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].PositionKind:
                    case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].NormalKind: {
                        for (var x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + 3) {
                            index = x * stride;
                            vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index));
                            vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index + 2 * stride));
                            vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index + stride));
                        }
                        break;
                    }
                    case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].TangentKind: {
                        for (var x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + 3) {
                            index = x * stride;
                            vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index));
                            vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index + 2 * stride));
                            vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index + stride));
                        }
                        break;
                    }
                    case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].ColorKind: {
                        var size = vertexBuffer.getSize();
                        for (var x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + size) {
                            index = x * stride;
                            if (size === 4) {
                                vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index));
                                vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index + 2 * stride));
                                vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index + stride));
                            }
                            else {
                                vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index));
                                vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index + 2 * stride));
                                vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index + stride));
                            }
                        }
                        break;
                    }
                    case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UVKind:
                    case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UV2Kind: {
                        for (var x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + 3) {
                            index = x * stride;
                            vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector2"].FromArray(meshAttributeArray, index));
                            vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector2"].FromArray(meshAttributeArray, index + 2 * stride));
                            vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector2"].FromArray(meshAttributeArray, index + stride));
                        }
                        break;
                    }
                    default: {
                        babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error("Unsupported Vertex Buffer type: " + vertexBufferKind);
                    }
                }
                this.writeVertexAttributeData(vertexData, byteOffset, vertexBufferKind, meshAttributeArray, binaryWriter);
            }
        }
        else {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Warn("reorderTriangleFillMode: Vertex Buffer Kind " + vertexBufferKind + " not present!");
        }
    };
    /**
     * Reorders the vertex attributes in the correct triangle strip order.  This is necessary when indices are not available and the winding order is
     * clock-wise during export to glTF
     * @param submesh BabylonJS submesh
     * @param primitiveMode Primitive mode of the mesh
     * @param sideOrientation the winding order of the submesh
     * @param vertexBufferKind The type of vertex attribute
     * @param meshAttributeArray The vertex attribute data
     * @param byteOffset The offset to the binary data
     * @param binaryWriter The binary data for the glTF file
     */
    _Exporter.prototype.reorderTriangleStripDrawMode = function (submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter) {
        var vertexBuffer = this.getVertexBufferFromMesh(vertexBufferKind, submesh.getMesh());
        if (vertexBuffer) {
            var stride = vertexBuffer.byteStride / babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].GetTypeByteLength(vertexBuffer.type);
            var vertexData = [];
            var index = 0;
            switch (vertexBufferKind) {
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].PositionKind:
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].NormalKind: {
                    index = submesh.verticesStart;
                    vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index + 2 * stride));
                    vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index + stride));
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].TangentKind: {
                    for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].ColorKind: {
                    for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexBuffer.getSize() === 4 ? vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index)) : vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UVKind:
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UV2Kind: {
                    for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector2"].FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                default: {
                    babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error("Unsupported Vertex Buffer type: " + vertexBufferKind);
                }
            }
            this.writeVertexAttributeData(vertexData, byteOffset + 12, vertexBufferKind, meshAttributeArray, binaryWriter);
        }
        else {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Warn("reorderTriangleStripDrawMode: Vertex buffer kind " + vertexBufferKind + " not present!");
        }
    };
    /**
     * Reorders the vertex attributes in the correct triangle fan order.  This is necessary when indices are not available and the winding order is
     * clock-wise during export to glTF
     * @param submesh BabylonJS submesh
     * @param primitiveMode Primitive mode of the mesh
     * @param sideOrientation the winding order of the submesh
     * @param vertexBufferKind The type of vertex attribute
     * @param meshAttributeArray The vertex attribute data
     * @param byteOffset The offset to the binary data
     * @param binaryWriter The binary data for the glTF file
     */
    _Exporter.prototype.reorderTriangleFanMode = function (submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter) {
        var vertexBuffer = this.getVertexBufferFromMesh(vertexBufferKind, submesh.getMesh());
        if (vertexBuffer) {
            var stride = vertexBuffer.byteStride / babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].GetTypeByteLength(vertexBuffer.type);
            var vertexData = [];
            var index = 0;
            switch (vertexBufferKind) {
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].PositionKind:
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].NormalKind: {
                    for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].TangentKind: {
                    for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].ColorKind: {
                    for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index));
                        vertexBuffer.getSize() === 4 ? vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index)) : vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UVKind:
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UV2Kind: {
                    for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexData.push(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector2"].FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                default: {
                    babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error("Unsupported Vertex Buffer type: " + vertexBufferKind);
                }
            }
            this.writeVertexAttributeData(vertexData, byteOffset, vertexBufferKind, meshAttributeArray, binaryWriter);
        }
        else {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Warn("reorderTriangleFanMode: Vertex buffer kind " + vertexBufferKind + " not present!");
        }
    };
    /**
     * Writes the vertex attribute data to binary
     * @param vertices The vertices to write to the binary writer
     * @param byteOffset The offset into the binary writer to overwrite binary data
     * @param vertexAttributeKind The vertex attribute type
     * @param meshAttributeArray The vertex attribute data
     * @param binaryWriter The writer containing the binary data
     */
    _Exporter.prototype.writeVertexAttributeData = function (vertices, byteOffset, vertexAttributeKind, meshAttributeArray, binaryWriter) {
        for (var _i = 0, vertices_1 = vertices; _i < vertices_1.length; _i++) {
            var vertex = vertices_1[_i];
            if (this._convertToRightHandedSystem && !(vertexAttributeKind === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].ColorKind) && !(vertex instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector2"])) {
                if (vertex instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"]) {
                    if (vertexAttributeKind === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].NormalKind) {
                        _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._GetRightHandedNormalVector3FromRef(vertex);
                    }
                    else if (vertexAttributeKind === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].PositionKind) {
                        _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._GetRightHandedPositionVector3FromRef(vertex);
                    }
                    else {
                        babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error('Unsupported vertex attribute kind!');
                    }
                }
                else {
                    _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._GetRightHandedVector4FromRef(vertex);
                }
            }
            if (vertexAttributeKind === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].NormalKind) {
                vertex.normalize();
            }
            else if (vertexAttributeKind === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].TangentKind && vertex instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"]) {
                _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._NormalizeTangentFromRef(vertex);
            }
            for (var _a = 0, _b = vertex.asArray(); _a < _b.length; _a++) {
                var component = _b[_a];
                binaryWriter.setFloat32(component, byteOffset);
                byteOffset += 4;
            }
        }
    };
    /**
     * Writes mesh attribute data to a data buffer
     * Returns the bytelength of the data
     * @param vertexBufferKind Indicates what kind of vertex data is being passed in
     * @param meshAttributeArray Array containing the attribute data
     * @param binaryWriter The buffer to write the binary data to
     * @param indices Used to specify the order of the vertex data
     */
    _Exporter.prototype.writeAttributeData = function (vertexBufferKind, meshAttributeArray, byteStride, binaryWriter) {
        var stride = byteStride / 4;
        var vertexAttributes = [];
        var index;
        switch (vertexBufferKind) {
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].PositionKind: {
                for (var k = 0, length_2 = meshAttributeArray.length / stride; k < length_2; ++k) {
                    index = k * stride;
                    var vertexData = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index);
                    if (this._convertToRightHandedSystem) {
                        _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._GetRightHandedPositionVector3FromRef(vertexData);
                    }
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].NormalKind: {
                for (var k = 0, length_3 = meshAttributeArray.length / stride; k < length_3; ++k) {
                    index = k * stride;
                    var vertexData = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index);
                    if (this._convertToRightHandedSystem) {
                        _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._GetRightHandedNormalVector3FromRef(vertexData);
                    }
                    vertexData.normalize();
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].TangentKind: {
                for (var k = 0, length_4 = meshAttributeArray.length / stride; k < length_4; ++k) {
                    index = k * stride;
                    var vertexData = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index);
                    if (this._convertToRightHandedSystem) {
                        _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._GetRightHandedVector4FromRef(vertexData);
                    }
                    _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._NormalizeTangentFromRef(vertexData);
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].ColorKind: {
                for (var k = 0, length_5 = meshAttributeArray.length / stride; k < length_5; ++k) {
                    index = k * stride;
                    var vertexData = stride === 3 ? babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector3"].FromArray(meshAttributeArray, index) : babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Vector4"].FromArray(meshAttributeArray, index);
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UVKind:
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UV2Kind: {
                for (var k = 0, length_6 = meshAttributeArray.length / stride; k < length_6; ++k) {
                    index = k * stride;
                    vertexAttributes.push(this._convertToRightHandedSystem ? [meshAttributeArray[index], meshAttributeArray[index + 1]] : [meshAttributeArray[index], meshAttributeArray[index + 1]]);
                }
                break;
            }
            default: {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Warn("Unsupported Vertex Buffer Type: " + vertexBufferKind);
                vertexAttributes = [];
            }
        }
        for (var _i = 0, vertexAttributes_1 = vertexAttributes; _i < vertexAttributes_1.length; _i++) {
            var vertexAttribute = vertexAttributes_1[_i];
            for (var _a = 0, vertexAttribute_1 = vertexAttribute; _a < vertexAttribute_1.length; _a++) {
                var component = vertexAttribute_1[_a];
                binaryWriter.setFloat32(component);
            }
        }
    };
    /**
     * Generates glTF json data
     * @param shouldUseGlb Indicates whether the json should be written for a glb file
     * @param glTFPrefix Text to use when prefixing a glTF file
     * @param prettyPrint Indicates whether the json file should be pretty printed (true) or not (false)
     * @returns json data as string
     */
    _Exporter.prototype.generateJSON = function (shouldUseGlb, glTFPrefix, prettyPrint) {
        var _this = this;
        var buffer = { byteLength: this._totalByteLength };
        var imageName;
        var imageData;
        var bufferView;
        var byteOffset = this._totalByteLength;
        if (buffer.byteLength) {
            this._glTF.buffers = [buffer];
        }
        if (this._nodes && this._nodes.length) {
            this._glTF.nodes = this._nodes;
        }
        if (this._meshes && this._meshes.length) {
            this._glTF.meshes = this._meshes;
        }
        if (this._scenes && this._scenes.length) {
            this._glTF.scenes = this._scenes;
            this._glTF.scene = 0;
        }
        if (this._bufferViews && this._bufferViews.length) {
            this._glTF.bufferViews = this._bufferViews;
        }
        if (this._accessors && this._accessors.length) {
            this._glTF.accessors = this._accessors;
        }
        if (this._animations && this._animations.length) {
            this._glTF.animations = this._animations;
        }
        if (this._materials && this._materials.length) {
            this._glTF.materials = this._materials;
        }
        if (this._textures && this._textures.length) {
            this._glTF.textures = this._textures;
        }
        if (this._samplers && this._samplers.length) {
            this._glTF.samplers = this._samplers;
        }
        if (this._images && this._images.length) {
            if (!shouldUseGlb) {
                this._glTF.images = this._images;
            }
            else {
                this._glTF.images = [];
                this._images.forEach(function (image) {
                    if (image.uri) {
                        imageData = _this._imageData[image.uri];
                        imageName = image.uri.split('.')[0] + " image";
                        bufferView = _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._CreateBufferView(0, byteOffset, imageData.data.length, undefined, imageName);
                        byteOffset += imageData.data.buffer.byteLength;
                        _this._bufferViews.push(bufferView);
                        image.bufferView = _this._bufferViews.length - 1;
                        image.name = imageName;
                        image.mimeType = imageData.mimeType;
                        image.uri = undefined;
                        if (!_this._glTF.images) {
                            _this._glTF.images = [];
                        }
                        _this._glTF.images.push(image);
                    }
                });
                // Replace uri with bufferview and mime type for glb
                buffer.byteLength = byteOffset;
            }
        }
        if (!shouldUseGlb) {
            buffer.uri = glTFPrefix + ".bin";
        }
        var jsonText = prettyPrint ? JSON.stringify(this._glTF, null, 2) : JSON.stringify(this._glTF);
        return jsonText;
    };
    /**
     * Generates data for .gltf and .bin files based on the glTF prefix string
     * @param glTFPrefix Text to use when prefixing a glTF file
     * @returns GLTFData with glTF file data
     */
    _Exporter.prototype._generateGLTFAsync = function (glTFPrefix) {
        var _this = this;
        return this._generateBinaryAsync().then(function (binaryBuffer) {
            _this._extensionsOnExporting();
            var jsonText = _this.generateJSON(false, glTFPrefix, true);
            var bin = new Blob([binaryBuffer], { type: 'application/octet-stream' });
            var glTFFileName = glTFPrefix + '.gltf';
            var glTFBinFile = glTFPrefix + '.bin';
            var container = new _glTFData__WEBPACK_IMPORTED_MODULE_4__["GLTFData"]();
            container.glTFFiles[glTFFileName] = jsonText;
            container.glTFFiles[glTFBinFile] = bin;
            if (_this._imageData) {
                for (var image in _this._imageData) {
                    container.glTFFiles[image] = new Blob([_this._imageData[image].data], { type: _this._imageData[image].mimeType });
                }
            }
            return container;
        });
    };
    /**
     * Creates a binary buffer for glTF
     * @returns array buffer for binary data
     */
    _Exporter.prototype._generateBinaryAsync = function () {
        var _this = this;
        var binaryWriter = new _BinaryWriter(4);
        return this.createSceneAsync(this._babylonScene, binaryWriter).then(function () {
            if (_this._localEngine) {
                _this._localEngine.dispose();
            }
            return binaryWriter.getArrayBuffer();
        });
    };
    /**
     * Pads the number to a multiple of 4
     * @param num number to pad
     * @returns padded number
     */
    _Exporter.prototype._getPadding = function (num) {
        var remainder = num % 4;
        var padding = remainder === 0 ? remainder : 4 - remainder;
        return padding;
    };
    /**
     * Generates a glb file from the json and binary data
     * Returns an object with the glb file name as the key and data as the value
     * @param glTFPrefix
     * @returns object with glb filename as key and data as value
     */
    _Exporter.prototype._generateGLBAsync = function (glTFPrefix) {
        var _this = this;
        return this._generateBinaryAsync().then(function (binaryBuffer) {
            _this._extensionsOnExporting();
            var jsonText = _this.generateJSON(true);
            var glbFileName = glTFPrefix + '.glb';
            var headerLength = 12;
            var chunkLengthPrefix = 8;
            var jsonLength = jsonText.length;
            var imageByteLength = 0;
            for (var key in _this._imageData) {
                imageByteLength += _this._imageData[key].data.byteLength;
            }
            var jsonPadding = _this._getPadding(jsonLength);
            var binPadding = _this._getPadding(binaryBuffer.byteLength);
            var imagePadding = _this._getPadding(imageByteLength);
            var byteLength = headerLength + (2 * chunkLengthPrefix) + jsonLength + jsonPadding + binaryBuffer.byteLength + binPadding + imageByteLength + imagePadding;
            //header
            var headerBuffer = new ArrayBuffer(headerLength);
            var headerBufferView = new DataView(headerBuffer);
            headerBufferView.setUint32(0, 0x46546C67, true); //glTF
            headerBufferView.setUint32(4, 2, true); // version
            headerBufferView.setUint32(8, byteLength, true); // total bytes in file
            //json chunk
            var jsonChunkBuffer = new ArrayBuffer(chunkLengthPrefix + jsonLength + jsonPadding);
            var jsonChunkBufferView = new DataView(jsonChunkBuffer);
            jsonChunkBufferView.setUint32(0, jsonLength + jsonPadding, true);
            jsonChunkBufferView.setUint32(4, 0x4E4F534A, true);
            //json chunk bytes
            var jsonData = new Uint8Array(jsonChunkBuffer, chunkLengthPrefix);
            for (var i = 0; i < jsonLength; ++i) {
                jsonData[i] = jsonText.charCodeAt(i);
            }
            //json padding
            var jsonPaddingView = new Uint8Array(jsonChunkBuffer, chunkLengthPrefix + jsonLength);
            for (var i = 0; i < jsonPadding; ++i) {
                jsonPaddingView[i] = 0x20;
            }
            //binary chunk
            var binaryChunkBuffer = new ArrayBuffer(chunkLengthPrefix);
            var binaryChunkBufferView = new DataView(binaryChunkBuffer);
            binaryChunkBufferView.setUint32(0, binaryBuffer.byteLength + imageByteLength + imagePadding, true);
            binaryChunkBufferView.setUint32(4, 0x004E4942, true);
            // binary padding
            var binPaddingBuffer = new ArrayBuffer(binPadding);
            var binPaddingView = new Uint8Array(binPaddingBuffer);
            for (var i = 0; i < binPadding; ++i) {
                binPaddingView[i] = 0;
            }
            var imagePaddingBuffer = new ArrayBuffer(imagePadding);
            var imagePaddingView = new Uint8Array(imagePaddingBuffer);
            for (var i = 0; i < imagePadding; ++i) {
                imagePaddingView[i] = 0;
            }
            var glbData = [headerBuffer, jsonChunkBuffer, binaryChunkBuffer, binaryBuffer];
            // binary data
            for (var key in _this._imageData) {
                glbData.push(_this._imageData[key].data.buffer);
            }
            glbData.push(binPaddingBuffer);
            glbData.push(imagePaddingBuffer);
            var glbFile = new Blob(glbData, { type: 'application/octet-stream' });
            var container = new _glTFData__WEBPACK_IMPORTED_MODULE_4__["GLTFData"]();
            container.glTFFiles[glbFileName] = glbFile;
            if (_this._localEngine != null) {
                _this._localEngine.dispose();
            }
            return container;
        });
    };
    /**
     * Sets the TRS for each node
     * @param node glTF Node for storing the transformation data
     * @param babylonTransformNode Babylon mesh used as the source for the transformation data
     */
    _Exporter.prototype.setNodeTransformation = function (node, babylonTransformNode) {
        if (!babylonTransformNode.getPivotPoint().equalsToFloats(0, 0, 0)) {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Warn("Pivot points are not supported in the glTF serializer");
        }
        if (!babylonTransformNode.position.equalsToFloats(0, 0, 0)) {
            node.translation = this._convertToRightHandedSystem ? _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._GetRightHandedPositionVector3(babylonTransformNode.position).asArray() : babylonTransformNode.position.asArray();
        }
        if (!babylonTransformNode.scaling.equalsToFloats(1, 1, 1)) {
            node.scale = babylonTransformNode.scaling.asArray();
        }
        var rotationQuaternion = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Quaternion"].RotationYawPitchRoll(babylonTransformNode.rotation.y, babylonTransformNode.rotation.x, babylonTransformNode.rotation.z);
        if (babylonTransformNode.rotationQuaternion) {
            rotationQuaternion.multiplyInPlace(babylonTransformNode.rotationQuaternion);
        }
        if (!(rotationQuaternion.x === 0 && rotationQuaternion.y === 0 && rotationQuaternion.z === 0 && rotationQuaternion.w === 1)) {
            if (this._convertToRightHandedSystem) {
                _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._GetRightHandedQuaternionFromRef(rotationQuaternion);
            }
            node.rotation = rotationQuaternion.normalize().asArray();
        }
    };
    _Exporter.prototype.getVertexBufferFromMesh = function (attributeKind, bufferMesh) {
        if (bufferMesh.isVerticesDataPresent(attributeKind)) {
            var vertexBuffer = bufferMesh.getVertexBuffer(attributeKind);
            if (vertexBuffer) {
                return vertexBuffer;
            }
        }
        return null;
    };
    /**
     * Creates a bufferview based on the vertices type for the Babylon mesh
     * @param kind Indicates the type of vertices data
     * @param babylonTransformNode The Babylon mesh to get the vertices data from
     * @param binaryWriter The buffer to write the bufferview data to
     */
    _Exporter.prototype.createBufferViewKind = function (kind, babylonTransformNode, binaryWriter, byteStride) {
        var bufferMesh = babylonTransformNode instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Mesh"] ?
            babylonTransformNode : babylonTransformNode instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["InstancedMesh"] ?
            babylonTransformNode.sourceMesh : null;
        if (bufferMesh) {
            var vertexData = bufferMesh.getVerticesData(kind);
            if (vertexData) {
                var byteLength = vertexData.length * 4;
                var bufferView = _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, byteStride, kind + " - " + bufferMesh.name);
                this._bufferViews.push(bufferView);
                this.writeAttributeData(kind, vertexData, byteStride, binaryWriter);
            }
        }
    };
    /**
     * The primitive mode of the Babylon mesh
     * @param babylonMesh The BabylonJS mesh
     */
    _Exporter.prototype.getMeshPrimitiveMode = function (babylonMesh) {
        if (babylonMesh instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["LinesMesh"]) {
            return babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].LineListDrawMode;
        }
        return babylonMesh.material ? babylonMesh.material.fillMode : babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].TriangleFillMode;
    };
    /**
     * Sets the primitive mode of the glTF mesh primitive
     * @param meshPrimitive glTF mesh primitive
     * @param primitiveMode The primitive mode
     */
    _Exporter.prototype.setPrimitiveMode = function (meshPrimitive, primitiveMode) {
        switch (primitiveMode) {
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].TriangleFillMode: {
                // glTF defaults to using Triangle Mode
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].TriangleStripDrawMode: {
                meshPrimitive.mode = 5 /* TRIANGLE_STRIP */;
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].TriangleFanDrawMode: {
                meshPrimitive.mode = 6 /* TRIANGLE_FAN */;
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].PointListDrawMode: {
                meshPrimitive.mode = 0 /* POINTS */;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].PointFillMode: {
                meshPrimitive.mode = 0 /* POINTS */;
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].LineLoopDrawMode: {
                meshPrimitive.mode = 2 /* LINE_LOOP */;
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].LineListDrawMode: {
                meshPrimitive.mode = 1 /* LINES */;
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].LineStripDrawMode: {
                meshPrimitive.mode = 3 /* LINE_STRIP */;
                break;
            }
        }
    };
    /**
     * Sets the vertex attribute accessor based of the glTF mesh primitive
     * @param meshPrimitive glTF mesh primitive
     * @param attributeKind vertex attribute
     * @returns boolean specifying if uv coordinates are present
     */
    _Exporter.prototype.setAttributeKind = function (meshPrimitive, attributeKind) {
        switch (attributeKind) {
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].PositionKind: {
                meshPrimitive.attributes.POSITION = this._accessors.length - 1;
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].NormalKind: {
                meshPrimitive.attributes.NORMAL = this._accessors.length - 1;
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].ColorKind: {
                meshPrimitive.attributes.COLOR_0 = this._accessors.length - 1;
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].TangentKind: {
                meshPrimitive.attributes.TANGENT = this._accessors.length - 1;
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UVKind: {
                meshPrimitive.attributes.TEXCOORD_0 = this._accessors.length - 1;
                break;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UV2Kind: {
                meshPrimitive.attributes.TEXCOORD_1 = this._accessors.length - 1;
                break;
            }
            default: {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Warn("Unsupported Vertex Buffer Type: " + attributeKind);
            }
        }
    };
    /**
     * Sets data for the primitive attributes of each submesh
     * @param mesh glTF Mesh object to store the primitive attribute information
     * @param babylonTransformNode Babylon mesh to get the primitive attribute data from
     * @param binaryWriter Buffer to write the attribute data to
     */
    _Exporter.prototype.setPrimitiveAttributesAsync = function (mesh, babylonTransformNode, binaryWriter) {
        var promises = [];
        var bufferMesh = null;
        var bufferView;
        var minMax;
        if (babylonTransformNode instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Mesh"]) {
            bufferMesh = babylonTransformNode;
        }
        else if (babylonTransformNode instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["InstancedMesh"]) {
            bufferMesh = babylonTransformNode.sourceMesh;
        }
        var attributeData = [
            { kind: babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].PositionKind, accessorType: "VEC3" /* VEC3 */, byteStride: 12 },
            { kind: babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].NormalKind, accessorType: "VEC3" /* VEC3 */, byteStride: 12 },
            { kind: babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].ColorKind, accessorType: "VEC4" /* VEC4 */, byteStride: 16 },
            { kind: babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].TangentKind, accessorType: "VEC4" /* VEC4 */, byteStride: 16 },
            { kind: babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UVKind, accessorType: "VEC2" /* VEC2 */, byteStride: 8 },
            { kind: babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UV2Kind, accessorType: "VEC2" /* VEC2 */, byteStride: 8 },
        ];
        if (bufferMesh) {
            var indexBufferViewIndex = null;
            var primitiveMode = this.getMeshPrimitiveMode(bufferMesh);
            var vertexAttributeBufferViews = {};
            // For each BabylonMesh, create bufferviews for each 'kind'
            for (var _i = 0, attributeData_1 = attributeData; _i < attributeData_1.length; _i++) {
                var attribute = attributeData_1[_i];
                var attributeKind = attribute.kind;
                if (bufferMesh.isVerticesDataPresent(attributeKind)) {
                    var vertexBuffer = this.getVertexBufferFromMesh(attributeKind, bufferMesh);
                    attribute.byteStride = vertexBuffer ? vertexBuffer.getSize() * 4 : babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].DeduceStride(attributeKind) * 4;
                    if (attribute.byteStride === 12) {
                        attribute.accessorType = "VEC3" /* VEC3 */;
                    }
                    this.createBufferViewKind(attributeKind, babylonTransformNode, binaryWriter, attribute.byteStride);
                    attribute.bufferViewIndex = this._bufferViews.length - 1;
                    vertexAttributeBufferViews[attributeKind] = attribute.bufferViewIndex;
                }
            }
            if (bufferMesh.getTotalIndices()) {
                var indices = bufferMesh.getIndices();
                if (indices) {
                    var byteLength = indices.length * 4;
                    bufferView = _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, "Indices - " + bufferMesh.name);
                    this._bufferViews.push(bufferView);
                    indexBufferViewIndex = this._bufferViews.length - 1;
                    for (var k = 0, length_7 = indices.length; k < length_7; ++k) {
                        binaryWriter.setUInt32(indices[k]);
                    }
                }
            }
            if (bufferMesh.subMeshes) {
                // go through all mesh primitives (submeshes)
                for (var _a = 0, _b = bufferMesh.subMeshes; _a < _b.length; _a++) {
                    var submesh = _b[_a];
                    var babylonMaterial = submesh.getMaterial() || bufferMesh.getScene().defaultMaterial;
                    var materialIndex = null;
                    if (babylonMaterial) {
                        if (bufferMesh instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["LinesMesh"]) {
                            // get the color from the lines mesh and set it in the material
                            var material = {
                                name: bufferMesh.name + ' material'
                            };
                            if (!bufferMesh.color.equals(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Color3"].White()) || bufferMesh.alpha < 1) {
                                material.pbrMetallicRoughness = {
                                    baseColorFactor: bufferMesh.color.asArray().concat([bufferMesh.alpha])
                                };
                            }
                            this._materials.push(material);
                            materialIndex = this._materials.length - 1;
                        }
                        else if (babylonMaterial instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["MultiMaterial"]) {
                            var subMaterial = babylonMaterial.subMaterials[submesh.materialIndex];
                            if (subMaterial) {
                                babylonMaterial = subMaterial;
                                materialIndex = this._materialMap[babylonMaterial.uniqueId];
                            }
                        }
                        else {
                            materialIndex = this._materialMap[babylonMaterial.uniqueId];
                        }
                    }
                    var glTFMaterial = materialIndex != null ? this._materials[materialIndex] : null;
                    var meshPrimitive = { attributes: {} };
                    this.setPrimitiveMode(meshPrimitive, primitiveMode);
                    for (var _c = 0, attributeData_2 = attributeData; _c < attributeData_2.length; _c++) {
                        var attribute = attributeData_2[_c];
                        var attributeKind = attribute.kind;
                        if (attributeKind === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UVKind || attributeKind === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].UV2Kind) {
                            if (glTFMaterial && !this._glTFMaterialExporter._hasTexturesPresent(glTFMaterial)) {
                                continue;
                            }
                        }
                        var vertexData = bufferMesh.getVerticesData(attributeKind);
                        if (vertexData) {
                            var vertexBuffer = this.getVertexBufferFromMesh(attributeKind, bufferMesh);
                            if (vertexBuffer) {
                                var stride = vertexBuffer.getSize();
                                var bufferViewIndex = attribute.bufferViewIndex;
                                if (bufferViewIndex != undefined) { // check to see if bufferviewindex has a numeric value assigned.
                                    minMax = { min: null, max: null };
                                    if (attributeKind == babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["VertexBuffer"].PositionKind) {
                                        minMax = _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._CalculateMinMaxPositions(vertexData, 0, vertexData.length / stride, this._convertToRightHandedSystem);
                                    }
                                    var accessor = _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._CreateAccessor(bufferViewIndex, attributeKind + " - " + babylonTransformNode.name, attribute.accessorType, 5126 /* FLOAT */, vertexData.length / stride, 0, minMax.min, minMax.max);
                                    this._accessors.push(accessor);
                                    this.setAttributeKind(meshPrimitive, attributeKind);
                                }
                            }
                        }
                    }
                    if (indexBufferViewIndex) {
                        // Create accessor
                        var accessor = _glTFUtilities__WEBPACK_IMPORTED_MODULE_3__["_GLTFUtilities"]._CreateAccessor(indexBufferViewIndex, "indices - " + babylonTransformNode.name, "SCALAR" /* SCALAR */, 5125 /* UNSIGNED_INT */, submesh.indexCount, submesh.indexStart * 4, null, null);
                        this._accessors.push(accessor);
                        meshPrimitive.indices = this._accessors.length - 1;
                    }
                    if (materialIndex != null && Object.keys(meshPrimitive.attributes).length > 0) {
                        var sideOrientation = bufferMesh.overrideMaterialSideOrientation !== null ? bufferMesh.overrideMaterialSideOrientation : babylonMaterial.sideOrientation;
                        // Only reverse the winding if we have a clockwise winding
                        if (sideOrientation === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Material"].ClockWiseSideOrientation) {
                            var byteOffset = indexBufferViewIndex != null ? this._bufferViews[indexBufferViewIndex].byteOffset : null;
                            if (byteOffset == null) {
                                byteOffset = 0;
                            }
                            var babylonIndices = null;
                            if (indexBufferViewIndex != null) {
                                babylonIndices = bufferMesh.getIndices();
                            }
                            if (babylonIndices) {
                                this.reorderIndicesBasedOnPrimitiveMode(submesh, primitiveMode, babylonIndices, byteOffset, binaryWriter);
                            }
                            else {
                                for (var _d = 0, attributeData_3 = attributeData; _d < attributeData_3.length; _d++) {
                                    var attribute = attributeData_3[_d];
                                    var vertexData = bufferMesh.getVerticesData(attribute.kind);
                                    if (vertexData) {
                                        var byteOffset_1 = this._bufferViews[vertexAttributeBufferViews[attribute.kind]].byteOffset;
                                        if (!byteOffset_1) {
                                            byteOffset_1 = 0;
                                        }
                                        this.reorderVertexAttributeDataBasedOnPrimitiveMode(submesh, primitiveMode, sideOrientation, attribute.kind, vertexData, byteOffset_1, binaryWriter);
                                    }
                                }
                            }
                        }
                        meshPrimitive.material = materialIndex;
                    }
                    mesh.primitives.push(meshPrimitive);
                    var promise = this._extensionsPostExportMeshPrimitiveAsync("postExport", meshPrimitive, submesh, binaryWriter);
                    if (promise) {
                        promises.push();
                    }
                }
            }
        }
        return Promise.all(promises).then(function () {
            /* do nothing */
        });
    };
    /**
     * Creates a glTF scene based on the array of meshes
     * Returns the the total byte offset
     * @param babylonScene Babylon scene to get the mesh data from
     * @param binaryWriter Buffer to write binary data to
     */
    _Exporter.prototype.createSceneAsync = function (babylonScene, binaryWriter) {
        var _this = this;
        var scene = { nodes: [] };
        var glTFNodeIndex;
        var glTFNode;
        var directDescendents;
        var nodes = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__spreadArrays"])(babylonScene.transformNodes, babylonScene.meshes, babylonScene.lights);
        return this._glTFMaterialExporter._convertMaterialsToGLTFAsync(babylonScene.materials, "image/png" /* PNG */, true).then(function () {
            return _this.createNodeMapAndAnimationsAsync(babylonScene, nodes, binaryWriter).then(function (nodeMap) {
                _this._nodeMap = nodeMap;
                _this._totalByteLength = binaryWriter.getByteOffset();
                if (_this._totalByteLength == undefined) {
                    throw new Error("undefined byte length!");
                }
                // Build Hierarchy with the node map.
                for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                    var babylonNode = nodes_1[_i];
                    glTFNodeIndex = _this._nodeMap[babylonNode.uniqueId];
                    if (glTFNodeIndex !== undefined) {
                        glTFNode = _this._nodes[glTFNodeIndex];
                        if (babylonNode.metadata) {
                            if (_this._options.metadataSelector) {
                                glTFNode.extras = _this._options.metadataSelector(babylonNode.metadata);
                            }
                            else if (babylonNode.metadata.gltf) {
                                glTFNode.extras = babylonNode.metadata.gltf.extras;
                            }
                        }
                        if (!babylonNode.parent) {
                            if (_this._options.shouldExportNode && !_this._options.shouldExportNode(babylonNode)) {
                                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Log("Omitting " + babylonNode.name + " from scene.");
                            }
                            else {
                                if (_this._convertToRightHandedSystem) {
                                    if (glTFNode.translation) {
                                        glTFNode.translation[2] *= -1;
                                        glTFNode.translation[0] *= -1;
                                    }
                                    glTFNode.rotation = glTFNode.rotation ? babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Quaternion"].FromArray([0, 1, 0, 0]).multiply(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Quaternion"].FromArray(glTFNode.rotation)).asArray() : (babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Quaternion"].FromArray([0, 1, 0, 0])).asArray();
                                }
                                scene.nodes.push(glTFNodeIndex);
                            }
                        }
                        directDescendents = babylonNode.getDescendants(true);
                        if (!glTFNode.children && directDescendents && directDescendents.length) {
                            var children = [];
                            for (var _a = 0, directDescendents_1 = directDescendents; _a < directDescendents_1.length; _a++) {
                                var descendent = directDescendents_1[_a];
                                if (_this._nodeMap[descendent.uniqueId] != null) {
                                    children.push(_this._nodeMap[descendent.uniqueId]);
                                }
                            }
                            if (children.length) {
                                glTFNode.children = children;
                            }
                        }
                    }
                }
                if (scene.nodes.length) {
                    _this._scenes.push(scene);
                }
            });
        });
    };
    /**
     * Creates a mapping of Node unique id to node index and handles animations
     * @param babylonScene Babylon Scene
     * @param nodes Babylon transform nodes
     * @param binaryWriter Buffer to write binary data to
     * @returns Node mapping of unique id to index
     */
    _Exporter.prototype.createNodeMapAndAnimationsAsync = function (babylonScene, nodes, binaryWriter) {
        var _this = this;
        var promiseChain = Promise.resolve();
        var nodeMap = {};
        var nodeIndex;
        var runtimeGLTFAnimation = {
            name: 'runtime animations',
            channels: [],
            samplers: []
        };
        var idleGLTFAnimations = [];
        var _loop_1 = function (babylonNode) {
            if (!this_1._options.shouldExportNode || this_1._options.shouldExportNode(babylonNode)) {
                promiseChain = promiseChain.then(function () {
                    return _this.createNodeAsync(babylonNode, binaryWriter).then(function (node) {
                        var promise = _this._extensionsPostExportNodeAsync("createNodeAsync", node, babylonNode);
                        if (promise == null) {
                            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Warn("Not exporting node " + babylonNode.name);
                            return Promise.resolve();
                        }
                        else {
                            return promise.then(function (node) {
                                var directDescendents = babylonNode.getDescendants(true, function (node) { return (node instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Node"]); });
                                if (directDescendents.length || node.mesh != null || (node.extensions)) {
                                    _this._nodes.push(node);
                                    nodeIndex = _this._nodes.length - 1;
                                    nodeMap[babylonNode.uniqueId] = nodeIndex;
                                }
                                if (!babylonScene.animationGroups.length && babylonNode.animations.length) {
                                    _glTFAnimation__WEBPACK_IMPORTED_MODULE_5__["_GLTFAnimation"]._CreateNodeAnimationFromNodeAnimations(babylonNode, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, _this._nodes, binaryWriter, _this._bufferViews, _this._accessors, _this._convertToRightHandedSystem, _this._animationSampleRate);
                                }
                            });
                        }
                    });
                });
            }
            else {
                "Excluding node " + babylonNode.name;
            }
        };
        var this_1 = this;
        for (var _i = 0, nodes_2 = nodes; _i < nodes_2.length; _i++) {
            var babylonNode = nodes_2[_i];
            _loop_1(babylonNode);
        }
        return promiseChain.then(function () {
            if (runtimeGLTFAnimation.channels.length && runtimeGLTFAnimation.samplers.length) {
                _this._animations.push(runtimeGLTFAnimation);
            }
            idleGLTFAnimations.forEach(function (idleGLTFAnimation) {
                if (idleGLTFAnimation.channels.length && idleGLTFAnimation.samplers.length) {
                    _this._animations.push(idleGLTFAnimation);
                }
            });
            if (babylonScene.animationGroups.length) {
                _glTFAnimation__WEBPACK_IMPORTED_MODULE_5__["_GLTFAnimation"]._CreateNodeAnimationFromAnimationGroups(babylonScene, _this._animations, nodeMap, _this._nodes, binaryWriter, _this._bufferViews, _this._accessors, _this._convertToRightHandedSystem, _this._animationSampleRate);
            }
            return nodeMap;
        });
    };
    /**
     * Creates a glTF node from a Babylon mesh
     * @param babylonMesh Source Babylon mesh
     * @param binaryWriter Buffer for storing geometry data
     * @returns glTF node
     */
    _Exporter.prototype.createNodeAsync = function (babylonNode, binaryWriter) {
        var _this = this;
        return Promise.resolve().then(function () {
            // create node to hold translation/rotation/scale and the mesh
            var node = {};
            // create mesh
            var mesh = { primitives: [] };
            if (babylonNode.name) {
                node.name = babylonNode.name;
            }
            if (babylonNode instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["TransformNode"]) {
                // Set transformation
                _this.setNodeTransformation(node, babylonNode);
                return _this.setPrimitiveAttributesAsync(mesh, babylonNode, binaryWriter).then(function () {
                    if (mesh.primitives.length) {
                        _this._meshes.push(mesh);
                        node.mesh = _this._meshes.length - 1;
                    }
                    return node;
                });
            }
            else {
                return node;
            }
        });
    };
    _Exporter._ExtensionNames = new Array();
    _Exporter._ExtensionFactories = {};
    return _Exporter;
}());

/**
 * @hidden
 *
 * Stores glTF binary data.  If the array buffer byte length is exceeded, it doubles in size dynamically
 */
var _BinaryWriter = /** @class */ (function () {
    /**
     * Initialize binary writer with an initial byte length
     * @param byteLength Initial byte length of the array buffer
     */
    function _BinaryWriter(byteLength) {
        this._arrayBuffer = new ArrayBuffer(byteLength);
        this._dataView = new DataView(this._arrayBuffer);
        this._byteOffset = 0;
    }
    /**
     * Resize the array buffer to the specified byte length
     * @param byteLength
     */
    _BinaryWriter.prototype.resizeBuffer = function (byteLength) {
        var newBuffer = new ArrayBuffer(byteLength);
        var oldUint8Array = new Uint8Array(this._arrayBuffer);
        var newUint8Array = new Uint8Array(newBuffer);
        for (var i = 0, length_8 = newUint8Array.byteLength; i < length_8; ++i) {
            newUint8Array[i] = oldUint8Array[i];
        }
        this._arrayBuffer = newBuffer;
        this._dataView = new DataView(this._arrayBuffer);
        return newBuffer;
    };
    /**
     * Get an array buffer with the length of the byte offset
     * @returns ArrayBuffer resized to the byte offset
     */
    _BinaryWriter.prototype.getArrayBuffer = function () {
        return this.resizeBuffer(this.getByteOffset());
    };
    /**
     * Get the byte offset of the array buffer
     * @returns byte offset
     */
    _BinaryWriter.prototype.getByteOffset = function () {
        if (this._byteOffset == undefined) {
            throw new Error("Byte offset is undefined!");
        }
        return this._byteOffset;
    };
    /**
     * Stores an UInt8 in the array buffer
     * @param entry
     * @param byteOffset If defined, specifies where to set the value as an offset.
     */
    _BinaryWriter.prototype.setUInt8 = function (entry, byteOffset) {
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setUint8(byteOffset, entry);
            }
            else {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
            }
        }
        else {
            if (this._byteOffset + 1 > this._arrayBuffer.byteLength) {
                this.resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setUint8(this._byteOffset++, entry);
        }
    };
    /**
     * Gets an UInt32 in the array buffer
     * @param entry
     * @param byteOffset If defined, specifies where to set the value as an offset.
     */
    _BinaryWriter.prototype.getUInt32 = function (byteOffset) {
        if (byteOffset < this._byteOffset) {
            return this._dataView.getUint32(byteOffset, true);
        }
        else {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
            throw new Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
        }
    };
    _BinaryWriter.prototype.getVector3Float32FromRef = function (vector3, byteOffset) {
        if (byteOffset + 8 > this._byteOffset) {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
        }
        else {
            vector3.x = this._dataView.getFloat32(byteOffset, true);
            vector3.y = this._dataView.getFloat32(byteOffset + 4, true);
            vector3.z = this._dataView.getFloat32(byteOffset + 8, true);
        }
    };
    _BinaryWriter.prototype.setVector3Float32FromRef = function (vector3, byteOffset) {
        if (byteOffset + 8 > this._byteOffset) {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
        }
        else {
            this._dataView.setFloat32(byteOffset, vector3.x, true);
            this._dataView.setFloat32(byteOffset + 4, vector3.y, true);
            this._dataView.setFloat32(byteOffset + 8, vector3.z, true);
        }
    };
    _BinaryWriter.prototype.getVector4Float32FromRef = function (vector4, byteOffset) {
        if (byteOffset + 12 > this._byteOffset) {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
        }
        else {
            vector4.x = this._dataView.getFloat32(byteOffset, true);
            vector4.y = this._dataView.getFloat32(byteOffset + 4, true);
            vector4.z = this._dataView.getFloat32(byteOffset + 8, true);
            vector4.w = this._dataView.getFloat32(byteOffset + 12, true);
        }
    };
    _BinaryWriter.prototype.setVector4Float32FromRef = function (vector4, byteOffset) {
        if (byteOffset + 12 > this._byteOffset) {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
        }
        else {
            this._dataView.setFloat32(byteOffset, vector4.x, true);
            this._dataView.setFloat32(byteOffset + 4, vector4.y, true);
            this._dataView.setFloat32(byteOffset + 8, vector4.z, true);
            this._dataView.setFloat32(byteOffset + 12, vector4.w, true);
        }
    };
    /**
     * Stores a Float32 in the array buffer
     * @param entry
     */
    _BinaryWriter.prototype.setFloat32 = function (entry, byteOffset) {
        if (isNaN(entry)) {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error('Invalid data being written!');
        }
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setFloat32(byteOffset, entry, true);
            }
            else {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error('BinaryWriter: byteoffset is greater than the current binary length!');
            }
        }
        if (this._byteOffset + 4 > this._arrayBuffer.byteLength) {
            this.resizeBuffer(this._arrayBuffer.byteLength * 2);
        }
        this._dataView.setFloat32(this._byteOffset, entry, true);
        this._byteOffset += 4;
    };
    /**
     * Stores an UInt32 in the array buffer
     * @param entry
     * @param byteOffset If defined, specifies where to set the value as an offset.
     */
    _BinaryWriter.prototype.setUInt32 = function (entry, byteOffset) {
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setUint32(byteOffset, entry, true);
            }
            else {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_1__["Tools"].Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
            }
        }
        else {
            if (this._byteOffset + 4 > this._arrayBuffer.byteLength) {
                this.resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setUint32(this._byteOffset, entry, true);
            this._byteOffset += 4;
        }
    };
    return _BinaryWriter;
}());



/***/ }),

/***/ "./glTF/2.0/glTFExporterExtension.ts":
/*!*******************************************!*\
  !*** ./glTF/2.0/glTFExporterExtension.ts ***!
  \*******************************************/
/*! exports provided: __IGLTFExporterExtensionV2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__IGLTFExporterExtensionV2", function() { return __IGLTFExporterExtensionV2; });
/** @hidden */
var __IGLTFExporterExtensionV2 = 0; // I am here to allow dts to be created


/***/ }),

/***/ "./glTF/2.0/glTFMaterialExporter.ts":
/*!******************************************!*\
  !*** ./glTF/2.0/glTFMaterialExporter.ts ***!
  \******************************************/
/*! exports provided: _GLTFMaterialExporter */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_GLTFMaterialExporter", function() { return _GLTFMaterialExporter; });
/* harmony import */ var babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math */ "babylonjs/Maths/math");
/* harmony import */ var babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__);












/**
 * Utility methods for working with glTF material conversion properties.  This class should only be used internally
 * @hidden
 */
var _GLTFMaterialExporter = /** @class */ (function () {
    function _GLTFMaterialExporter(exporter) {
        /**
         * Mapping to store textures
         */
        this._textureMap = {};
        this._textureMap = {};
        this._exporter = exporter;
    }
    /**
     * Specifies if two colors are approximately equal in value
     * @param color1 first color to compare to
     * @param color2 second color to compare to
     * @param epsilon threshold value
     */
    _GLTFMaterialExporter.FuzzyEquals = function (color1, color2, epsilon) {
        return babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Scalar"].WithinEpsilon(color1.r, color2.r, epsilon) &&
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Scalar"].WithinEpsilon(color1.g, color2.g, epsilon) &&
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Scalar"].WithinEpsilon(color1.b, color2.b, epsilon);
    };
    /**
     * Gets the materials from a Babylon scene and converts them to glTF materials
     * @param scene babylonjs scene
     * @param mimeType texture mime type
     * @param images array of images
     * @param textures array of textures
     * @param materials array of materials
     * @param imageData mapping of texture names to base64 textures
     * @param hasTextureCoords specifies if texture coordinates are present on the material
     */
    _GLTFMaterialExporter.prototype._convertMaterialsToGLTFAsync = function (babylonMaterials, mimeType, hasTextureCoords) {
        var promises = [];
        for (var _i = 0, babylonMaterials_1 = babylonMaterials; _i < babylonMaterials_1.length; _i++) {
            var babylonMaterial = babylonMaterials_1[_i];
            if (babylonMaterial instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["StandardMaterial"]) {
                promises.push(this._convertStandardMaterialAsync(babylonMaterial, mimeType, hasTextureCoords));
            }
            else if (babylonMaterial instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["PBRMetallicRoughnessMaterial"]) {
                promises.push(this._convertPBRMetallicRoughnessMaterialAsync(babylonMaterial, mimeType, hasTextureCoords));
            }
            else if (babylonMaterial instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"]) {
                promises.push(this._convertPBRMaterialAsync(babylonMaterial, mimeType, hasTextureCoords));
            }
            else {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].Warn("Unsupported material type: " + babylonMaterial.name);
            }
        }
        return Promise.all(promises).then(function () { });
    };
    /**
     * Makes a copy of the glTF material without the texture parameters
     * @param originalMaterial original glTF material
     * @returns glTF material without texture parameters
     */
    _GLTFMaterialExporter.prototype._stripTexturesFromMaterial = function (originalMaterial) {
        var newMaterial = {};
        if (originalMaterial) {
            newMaterial.name = originalMaterial.name;
            newMaterial.doubleSided = originalMaterial.doubleSided;
            newMaterial.alphaMode = originalMaterial.alphaMode;
            newMaterial.alphaCutoff = originalMaterial.alphaCutoff;
            newMaterial.emissiveFactor = originalMaterial.emissiveFactor;
            var originalPBRMetallicRoughness = originalMaterial.pbrMetallicRoughness;
            if (originalPBRMetallicRoughness) {
                newMaterial.pbrMetallicRoughness = {};
                newMaterial.pbrMetallicRoughness.baseColorFactor = originalPBRMetallicRoughness.baseColorFactor;
                newMaterial.pbrMetallicRoughness.metallicFactor = originalPBRMetallicRoughness.metallicFactor;
                newMaterial.pbrMetallicRoughness.roughnessFactor = originalPBRMetallicRoughness.roughnessFactor;
            }
        }
        return newMaterial;
    };
    /**
     * Specifies if the material has any texture parameters present
     * @param material glTF Material
     * @returns boolean specifying if texture parameters are present
     */
    _GLTFMaterialExporter.prototype._hasTexturesPresent = function (material) {
        if (material.emissiveTexture || material.normalTexture || material.occlusionTexture) {
            return true;
        }
        var pbrMat = material.pbrMetallicRoughness;
        if (pbrMat) {
            if (pbrMat.baseColorTexture || pbrMat.metallicRoughnessTexture) {
                return true;
            }
        }
        return false;
    };
    /**
     * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material
     * @param babylonStandardMaterial
     * @returns glTF Metallic Roughness Material representation
     */
    _GLTFMaterialExporter.prototype._convertToGLTFPBRMetallicRoughness = function (babylonStandardMaterial) {
        var P0 = new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 1);
        var P1 = new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0.1);
        var P2 = new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Vector2"](0, 0.1);
        var P3 = new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Vector2"](1300, 0.1);
        /**
         * Given the control points, solve for x based on a given t for a cubic bezier curve
         * @param t a value between 0 and 1
         * @param p0 first control point
         * @param p1 second control point
         * @param p2 third control point
         * @param p3 fourth control point
         * @returns number result of cubic bezier curve at the specified t
         */
        function _cubicBezierCurve(t, p0, p1, p2, p3) {
            return ((1 - t) * (1 - t) * (1 - t) * p0 +
                3 * (1 - t) * (1 - t) * t * p1 +
                3 * (1 - t) * t * t * p2 +
                t * t * t * p3);
        }
        /**
         * Evaluates a specified specular power value to determine the appropriate roughness value,
         * based on a pre-defined cubic bezier curve with specular on the abscissa axis (x-axis)
         * and roughness on the ordinant axis (y-axis)
         * @param specularPower specular power of standard material
         * @returns Number representing the roughness value
         */
        function _solveForRoughness(specularPower) {
            var t = Math.pow(specularPower / P3.x, 0.333333);
            return _cubicBezierCurve(t, P0.y, P1.y, P2.y, P3.y);
        }
        var diffuse = babylonStandardMaterial.diffuseColor.toLinearSpace().scale(0.5);
        var opacity = babylonStandardMaterial.alpha;
        var specularPower = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Scalar"].Clamp(babylonStandardMaterial.specularPower, 0, _GLTFMaterialExporter._MaxSpecularPower);
        var roughness = _solveForRoughness(specularPower);
        var glTFPbrMetallicRoughness = {
            baseColorFactor: [
                diffuse.r,
                diffuse.g,
                diffuse.b,
                opacity
            ],
            metallicFactor: 0,
            roughnessFactor: roughness,
        };
        return glTFPbrMetallicRoughness;
    };
    /**
     * Computes the metallic factor
     * @param diffuse diffused value
     * @param specular specular value
     * @param oneMinusSpecularStrength one minus the specular strength
     * @returns metallic value
     */
    _GLTFMaterialExporter._SolveMetallic = function (diffuse, specular, oneMinusSpecularStrength) {
        if (specular < this._DielectricSpecular.r) {
            this._DielectricSpecular;
            return 0;
        }
        var a = this._DielectricSpecular.r;
        var b = diffuse * oneMinusSpecularStrength / (1.0 - this._DielectricSpecular.r) + specular - 2.0 * this._DielectricSpecular.r;
        var c = this._DielectricSpecular.r - specular;
        var D = b * b - 4.0 * a * c;
        return babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Scalar"].Clamp((-b + Math.sqrt(D)) / (2.0 * a), 0, 1);
    };
    /**
     * Sets the glTF alpha mode to a glTF material from the Babylon Material
     * @param glTFMaterial glTF material
     * @param babylonMaterial Babylon material
     */
    _GLTFMaterialExporter._SetAlphaMode = function (glTFMaterial, babylonMaterial) {
        if (babylonMaterial.needAlphaBlending()) {
            glTFMaterial.alphaMode = "BLEND" /* BLEND */;
        }
        else if (babylonMaterial.needAlphaTesting()) {
            glTFMaterial.alphaMode = "MASK" /* MASK */;
            glTFMaterial.alphaCutoff = babylonMaterial.alphaCutOff;
        }
    };
    /**
     * Converts a Babylon Standard Material to a glTF Material
     * @param babylonStandardMaterial BJS Standard Material
     * @param mimeType mime type to use for the textures
     * @param images array of glTF image interfaces
     * @param textures array of glTF texture interfaces
     * @param materials array of glTF material interfaces
     * @param imageData map of image file name to data
     * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
     */
    _GLTFMaterialExporter.prototype._convertStandardMaterialAsync = function (babylonStandardMaterial, mimeType, hasTextureCoords) {
        var materialMap = this._exporter._materialMap;
        var materials = this._exporter._materials;
        var promises = [];
        var glTFPbrMetallicRoughness = this._convertToGLTFPBRMetallicRoughness(babylonStandardMaterial);
        var glTFMaterial = { name: babylonStandardMaterial.name };
        if (babylonStandardMaterial.backFaceCulling != null && !babylonStandardMaterial.backFaceCulling) {
            if (!babylonStandardMaterial.twoSidedLighting) {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].Warn(babylonStandardMaterial.name + ": Back-face culling enabled and two-sided lighting disabled is not supported in glTF.");
            }
            glTFMaterial.doubleSided = true;
        }
        if (hasTextureCoords) {
            if (babylonStandardMaterial.diffuseTexture) {
                promises.push(this._exportTextureAsync(babylonStandardMaterial.diffuseTexture, mimeType).then(function (glTFTexture) {
                    if (glTFTexture) {
                        glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                    }
                }));
            }
            if (babylonStandardMaterial.bumpTexture) {
                promises.push(this._exportTextureAsync(babylonStandardMaterial.bumpTexture, mimeType).then(function (glTFTexture) {
                    if (glTFTexture) {
                        glTFMaterial.normalTexture = glTFTexture;
                        if (babylonStandardMaterial.bumpTexture != null && babylonStandardMaterial.bumpTexture.level !== 1) {
                            glTFMaterial.normalTexture.scale = babylonStandardMaterial.bumpTexture.level;
                        }
                    }
                }));
            }
            if (babylonStandardMaterial.emissiveTexture) {
                glTFMaterial.emissiveFactor = [1.0, 1.0, 1.0];
                promises.push(this._exportTextureAsync(babylonStandardMaterial.emissiveTexture, mimeType).then(function (glTFEmissiveTexture) {
                    if (glTFEmissiveTexture) {
                        glTFMaterial.emissiveTexture = glTFEmissiveTexture;
                    }
                }));
            }
            if (babylonStandardMaterial.ambientTexture) {
                promises.push(this._exportTextureAsync(babylonStandardMaterial.ambientTexture, mimeType).then(function (glTFTexture) {
                    if (glTFTexture) {
                        var occlusionTexture = {
                            index: glTFTexture.index
                        };
                        glTFMaterial.occlusionTexture = occlusionTexture;
                        occlusionTexture.strength = 1.0;
                    }
                }));
            }
        }
        if (babylonStandardMaterial.alpha < 1.0 || babylonStandardMaterial.opacityTexture) {
            if (babylonStandardMaterial.alphaMode === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Constants"].ALPHA_COMBINE) {
                glTFMaterial.alphaMode = "BLEND" /* BLEND */;
            }
            else {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].Warn(babylonStandardMaterial.name + ": glTF 2.0 does not support alpha mode: " + babylonStandardMaterial.alphaMode.toString());
            }
        }
        if (babylonStandardMaterial.emissiveColor && !_GLTFMaterialExporter.FuzzyEquals(babylonStandardMaterial.emissiveColor, babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].Black(), _GLTFMaterialExporter._Epsilon)) {
            glTFMaterial.emissiveFactor = babylonStandardMaterial.emissiveColor.asArray();
        }
        glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
        _GLTFMaterialExporter._SetAlphaMode(glTFMaterial, babylonStandardMaterial);
        materials.push(glTFMaterial);
        materialMap[babylonStandardMaterial.uniqueId] = materials.length - 1;
        return Promise.all(promises).then(function () { });
    };
    /**
     * Converts a Babylon PBR Metallic Roughness Material to a glTF Material
     * @param babylonPBRMetalRoughMaterial BJS PBR Metallic Roughness Material
     * @param mimeType mime type to use for the textures
     * @param images array of glTF image interfaces
     * @param textures array of glTF texture interfaces
     * @param materials array of glTF material interfaces
     * @param imageData map of image file name to data
     * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
     */
    _GLTFMaterialExporter.prototype._convertPBRMetallicRoughnessMaterialAsync = function (babylonPBRMetalRoughMaterial, mimeType, hasTextureCoords) {
        var materialMap = this._exporter._materialMap;
        var materials = this._exporter._materials;
        var promises = [];
        var glTFPbrMetallicRoughness = {};
        if (babylonPBRMetalRoughMaterial.baseColor) {
            glTFPbrMetallicRoughness.baseColorFactor = [
                babylonPBRMetalRoughMaterial.baseColor.r,
                babylonPBRMetalRoughMaterial.baseColor.g,
                babylonPBRMetalRoughMaterial.baseColor.b,
                babylonPBRMetalRoughMaterial.alpha
            ];
        }
        if (babylonPBRMetalRoughMaterial.metallic != null && babylonPBRMetalRoughMaterial.metallic !== 1) {
            glTFPbrMetallicRoughness.metallicFactor = babylonPBRMetalRoughMaterial.metallic;
        }
        if (babylonPBRMetalRoughMaterial.roughness != null && babylonPBRMetalRoughMaterial.roughness !== 1) {
            glTFPbrMetallicRoughness.roughnessFactor = babylonPBRMetalRoughMaterial.roughness;
        }
        var glTFMaterial = {
            name: babylonPBRMetalRoughMaterial.name
        };
        if (babylonPBRMetalRoughMaterial.doubleSided) {
            glTFMaterial.doubleSided = babylonPBRMetalRoughMaterial.doubleSided;
        }
        _GLTFMaterialExporter._SetAlphaMode(glTFMaterial, babylonPBRMetalRoughMaterial);
        if (hasTextureCoords) {
            if (babylonPBRMetalRoughMaterial.baseTexture != null) {
                promises.push(this._exportTextureAsync(babylonPBRMetalRoughMaterial.baseTexture, mimeType).then(function (glTFTexture) {
                    if (glTFTexture) {
                        glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                    }
                }));
            }
            if (babylonPBRMetalRoughMaterial.normalTexture) {
                promises.push(this._exportTextureAsync(babylonPBRMetalRoughMaterial.normalTexture, mimeType).then(function (glTFTexture) {
                    if (glTFTexture) {
                        glTFMaterial.normalTexture = glTFTexture;
                        if (babylonPBRMetalRoughMaterial.normalTexture.level !== 1) {
                            glTFMaterial.normalTexture.scale = babylonPBRMetalRoughMaterial.normalTexture.level;
                        }
                    }
                }));
            }
            if (babylonPBRMetalRoughMaterial.occlusionTexture) {
                promises.push(this._exportTextureAsync(babylonPBRMetalRoughMaterial.occlusionTexture, mimeType).then(function (glTFTexture) {
                    if (glTFTexture) {
                        glTFMaterial.occlusionTexture = glTFTexture;
                        if (babylonPBRMetalRoughMaterial.occlusionStrength != null) {
                            glTFMaterial.occlusionTexture.strength = babylonPBRMetalRoughMaterial.occlusionStrength;
                        }
                    }
                }));
            }
            if (babylonPBRMetalRoughMaterial.emissiveTexture) {
                promises.push(this._exportTextureAsync(babylonPBRMetalRoughMaterial.emissiveTexture, mimeType).then(function (glTFTexture) {
                    if (glTFTexture) {
                        glTFMaterial.emissiveTexture = glTFTexture;
                    }
                }));
            }
        }
        if (_GLTFMaterialExporter.FuzzyEquals(babylonPBRMetalRoughMaterial.emissiveColor, babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].Black(), _GLTFMaterialExporter._Epsilon)) {
            glTFMaterial.emissiveFactor = babylonPBRMetalRoughMaterial.emissiveColor.asArray();
        }
        glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
        materials.push(glTFMaterial);
        materialMap[babylonPBRMetalRoughMaterial.uniqueId] = materials.length - 1;
        return Promise.all(promises).then(function () { });
    };
    /**
     * Converts an image typed array buffer to a base64 image
     * @param buffer typed array buffer
     * @param width width of the image
     * @param height height of the image
     * @param mimeType mimetype of the image
     * @returns base64 image string
     */
    _GLTFMaterialExporter.prototype._createBase64FromCanvasAsync = function (buffer, width, height, mimeType) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var hostingScene;
            var textureType = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Constants"].TEXTURETYPE_UNSIGNED_INT;
            var engine = _this._exporter._getLocalEngine();
            hostingScene = new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Scene"](engine);
            // Create a temporary texture with the texture buffer data
            var tempTexture = engine.createRawTexture(buffer, width, height, babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Constants"].TEXTUREFORMAT_RGBA, false, true, babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_SAMPLINGMODE, null, textureType);
            var postProcess = new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["PostProcess"]("pass", "pass", null, null, 1, null, babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_SAMPLINGMODE, engine, false, undefined, babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Constants"].TEXTURETYPE_UNSIGNED_INT, undefined, null, false);
            postProcess.getEffect().executeWhenCompiled(function () {
                postProcess.onApply = function (effect) {
                    effect._bindTexture("textureSampler", tempTexture);
                };
                // Set the size of the texture
                engine.setSize(width, height);
                hostingScene.postProcessManager.directRender([postProcess], null);
                postProcess.dispose();
                tempTexture.dispose();
                // Read data from WebGL
                var canvas = engine.getRenderingCanvas();
                if (canvas) {
                    if (!canvas.toBlob) { // fallback for browsers without "canvas.toBlob"
                        var dataURL = canvas.toDataURL();
                        resolve(dataURL);
                    }
                    else {
                        babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].ToBlob(canvas, function (blob) {
                            if (blob) {
                                var fileReader = new FileReader();
                                fileReader.onload = function (event) {
                                    var base64String = event.target.result;
                                    hostingScene.dispose();
                                    resolve(base64String);
                                };
                                fileReader.readAsDataURL(blob);
                            }
                            else {
                                reject("gltfMaterialExporter: Failed to get blob from image canvas!");
                            }
                        });
                    }
                }
                else {
                    reject("Engine is missing a canvas!");
                }
            });
        });
    };
    /**
     * Generates a white texture based on the specified width and height
     * @param width width of the texture in pixels
     * @param height height of the texture in pixels
     * @param scene babylonjs scene
     * @returns white texture
     */
    _GLTFMaterialExporter.prototype._createWhiteTexture = function (width, height, scene) {
        var data = new Uint8Array(width * height * 4);
        for (var i = 0; i < data.length; i = i + 4) {
            data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0xFF;
        }
        var rawTexture = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["RawTexture"].CreateRGBATexture(data, width, height, scene);
        return rawTexture;
    };
    /**
     * Resizes the two source textures to the same dimensions.  If a texture is null, a default white texture is generated.  If both textures are null, returns null
     * @param texture1 first texture to resize
     * @param texture2 second texture to resize
     * @param scene babylonjs scene
     * @returns resized textures or null
     */
    _GLTFMaterialExporter.prototype._resizeTexturesToSameDimensions = function (texture1, texture2, scene) {
        var texture1Size = texture1 ? texture1.getSize() : { width: 0, height: 0 };
        var texture2Size = texture2 ? texture2.getSize() : { width: 0, height: 0 };
        var resizedTexture1;
        var resizedTexture2;
        if (texture1Size.width < texture2Size.width) {
            if (texture1 && texture1 instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"]) {
                resizedTexture1 = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["TextureTools"].CreateResizedCopy(texture1, texture2Size.width, texture2Size.height, true);
            }
            else {
                resizedTexture1 = this._createWhiteTexture(texture2Size.width, texture2Size.height, scene);
            }
            resizedTexture2 = texture2;
        }
        else if (texture1Size.width > texture2Size.width) {
            if (texture2 && texture2 instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"]) {
                resizedTexture2 = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["TextureTools"].CreateResizedCopy(texture2, texture1Size.width, texture1Size.height, true);
            }
            else {
                resizedTexture2 = this._createWhiteTexture(texture1Size.width, texture1Size.height, scene);
            }
            resizedTexture1 = texture1;
        }
        else {
            resizedTexture1 = texture1;
            resizedTexture2 = texture2;
        }
        return {
            "texture1": resizedTexture1,
            "texture2": resizedTexture2
        };
    };
    /**
     * Converts an array of pixels to a Float32Array
     * Throws an error if the pixel format is not supported
     * @param pixels - array buffer containing pixel values
     * @returns Float32 of pixels
     */
    _GLTFMaterialExporter.prototype._convertPixelArrayToFloat32 = function (pixels) {
        if (pixels instanceof Uint8Array) {
            var length_1 = pixels.length;
            var buffer = new Float32Array(pixels.length);
            for (var i = 0; i < length_1; ++i) {
                buffer[i] = pixels[i] / 255;
            }
            return buffer;
        }
        else if (pixels instanceof Float32Array) {
            return pixels;
        }
        else {
            throw new Error('Unsupported pixel format!');
        }
    };
    /**
     * Convert Specular Glossiness Textures to Metallic Roughness
     * See link below for info on the material conversions from PBR Metallic/Roughness and Specular/Glossiness
     * @link https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness/examples/convert-between-workflows-bjs/js/babylon.pbrUtilities.js
     * @param diffuseTexture texture used to store diffuse information
     * @param specularGlossinessTexture texture used to store specular and glossiness information
     * @param factors specular glossiness material factors
     * @param mimeType the mime type to use for the texture
     * @returns pbr metallic roughness interface or null
     */
    _GLTFMaterialExporter.prototype._convertSpecularGlossinessTexturesToMetallicRoughnessAsync = function (diffuseTexture, specularGlossinessTexture, factors, mimeType) {
        var promises = [];
        if (!(diffuseTexture || specularGlossinessTexture)) {
            return Promise.reject('_ConvertSpecularGlosinessTexturesToMetallicRoughness: diffuse and specular glossiness textures are not defined!');
        }
        var scene = diffuseTexture ? diffuseTexture.getScene() : specularGlossinessTexture ? specularGlossinessTexture.getScene() : null;
        if (scene) {
            var resizedTextures = this._resizeTexturesToSameDimensions(diffuseTexture, specularGlossinessTexture, scene);
            var diffuseSize = resizedTextures.texture1.getSize();
            var diffuseBuffer = void 0;
            var specularGlossinessBuffer = void 0;
            var width = diffuseSize.width;
            var height = diffuseSize.height;
            var diffusePixels = resizedTextures.texture1.readPixels();
            var specularPixels = resizedTextures.texture2.readPixels();
            if (diffusePixels) {
                diffuseBuffer = this._convertPixelArrayToFloat32(diffusePixels);
            }
            else {
                return Promise.reject("Failed to retrieve pixels from diffuse texture!");
            }
            if (specularPixels) {
                specularGlossinessBuffer = this._convertPixelArrayToFloat32(specularPixels);
            }
            else {
                return Promise.reject("Failed to retrieve pixels from specular glossiness texture!");
            }
            var byteLength = specularGlossinessBuffer.byteLength;
            var metallicRoughnessBuffer = new Uint8Array(byteLength);
            var baseColorBuffer = new Uint8Array(byteLength);
            var strideSize = 4;
            var maxBaseColor = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].Black();
            var maxMetallic = 0;
            var maxRoughness = 0;
            for (var h = 0; h < height; ++h) {
                for (var w = 0; w < width; ++w) {
                    var offset = (width * h + w) * strideSize;
                    var diffuseColor = new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"](diffuseBuffer[offset], diffuseBuffer[offset + 1], diffuseBuffer[offset + 2]).toLinearSpace().multiply(factors.diffuseColor);
                    var specularColor = new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"](specularGlossinessBuffer[offset], specularGlossinessBuffer[offset + 1], specularGlossinessBuffer[offset + 2]).toLinearSpace().multiply(factors.specularColor);
                    var glossiness = (specularGlossinessBuffer[offset + 3]) * factors.glossiness;
                    var specularGlossiness = {
                        diffuseColor: diffuseColor,
                        specularColor: specularColor,
                        glossiness: glossiness
                    };
                    var metallicRoughness = this._convertSpecularGlossinessToMetallicRoughness(specularGlossiness);
                    maxBaseColor.r = Math.max(maxBaseColor.r, metallicRoughness.baseColor.r);
                    maxBaseColor.g = Math.max(maxBaseColor.g, metallicRoughness.baseColor.g);
                    maxBaseColor.b = Math.max(maxBaseColor.b, metallicRoughness.baseColor.b);
                    maxMetallic = Math.max(maxMetallic, metallicRoughness.metallic);
                    maxRoughness = Math.max(maxRoughness, metallicRoughness.roughness);
                    baseColorBuffer[offset] = metallicRoughness.baseColor.r * 255;
                    baseColorBuffer[offset + 1] = metallicRoughness.baseColor.g * 255;
                    baseColorBuffer[offset + 2] = metallicRoughness.baseColor.b * 255;
                    baseColorBuffer[offset + 3] = resizedTextures.texture1.hasAlpha ? diffuseBuffer[offset + 3] * 255 : 255;
                    metallicRoughnessBuffer[offset] = 0;
                    metallicRoughnessBuffer[offset + 1] = metallicRoughness.roughness * 255;
                    metallicRoughnessBuffer[offset + 2] = metallicRoughness.metallic * 255;
                    metallicRoughnessBuffer[offset + 3] = 255;
                }
            }
            // Retrieves the metallic roughness factors from the maximum texture values.
            var metallicRoughnessFactors_1 = {
                baseColor: maxBaseColor,
                metallic: maxMetallic,
                roughness: maxRoughness
            };
            var writeOutMetallicRoughnessTexture = false;
            var writeOutBaseColorTexture = false;
            for (var h = 0; h < height; ++h) {
                for (var w = 0; w < width; ++w) {
                    var destinationOffset = (width * h + w) * strideSize;
                    baseColorBuffer[destinationOffset] /= metallicRoughnessFactors_1.baseColor.r > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors_1.baseColor.r : 1;
                    baseColorBuffer[destinationOffset + 1] /= metallicRoughnessFactors_1.baseColor.g > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors_1.baseColor.g : 1;
                    baseColorBuffer[destinationOffset + 2] /= metallicRoughnessFactors_1.baseColor.b > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors_1.baseColor.b : 1;
                    var linearBaseColorPixel = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromInts(baseColorBuffer[destinationOffset], baseColorBuffer[destinationOffset + 1], baseColorBuffer[destinationOffset + 2]);
                    var sRGBBaseColorPixel = linearBaseColorPixel.toGammaSpace();
                    baseColorBuffer[destinationOffset] = sRGBBaseColorPixel.r * 255;
                    baseColorBuffer[destinationOffset + 1] = sRGBBaseColorPixel.g * 255;
                    baseColorBuffer[destinationOffset + 2] = sRGBBaseColorPixel.b * 255;
                    if (!_GLTFMaterialExporter.FuzzyEquals(sRGBBaseColorPixel, babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].White(), _GLTFMaterialExporter._Epsilon)) {
                        writeOutBaseColorTexture = true;
                    }
                    metallicRoughnessBuffer[destinationOffset + 1] /= metallicRoughnessFactors_1.roughness > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors_1.roughness : 1;
                    metallicRoughnessBuffer[destinationOffset + 2] /= metallicRoughnessFactors_1.metallic > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors_1.metallic : 1;
                    var metallicRoughnessPixel = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromInts(255, metallicRoughnessBuffer[destinationOffset + 1], metallicRoughnessBuffer[destinationOffset + 2]);
                    if (!_GLTFMaterialExporter.FuzzyEquals(metallicRoughnessPixel, babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].White(), _GLTFMaterialExporter._Epsilon)) {
                        writeOutMetallicRoughnessTexture = true;
                    }
                }
            }
            if (writeOutMetallicRoughnessTexture) {
                var promise = this._createBase64FromCanvasAsync(metallicRoughnessBuffer, width, height, mimeType).then(function (metallicRoughnessBase64) {
                    metallicRoughnessFactors_1.metallicRoughnessTextureBase64 = metallicRoughnessBase64;
                });
                promises.push(promise);
            }
            if (writeOutBaseColorTexture) {
                var promise = this._createBase64FromCanvasAsync(baseColorBuffer, width, height, mimeType).then(function (baseColorBase64) {
                    metallicRoughnessFactors_1.baseColorTextureBase64 = baseColorBase64;
                });
                promises.push(promise);
            }
            return Promise.all(promises).then(function () {
                return metallicRoughnessFactors_1;
            });
        }
        else {
            return Promise.reject("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Scene from textures is missing!");
        }
    };
    /**
     * Converts specular glossiness material properties to metallic roughness
     * @param specularGlossiness interface with specular glossiness material properties
     * @returns interface with metallic roughness material properties
     */
    _GLTFMaterialExporter.prototype._convertSpecularGlossinessToMetallicRoughness = function (specularGlossiness) {
        var diffusePerceivedBrightness = this._getPerceivedBrightness(specularGlossiness.diffuseColor);
        var specularPerceivedBrightness = this._getPerceivedBrightness(specularGlossiness.specularColor);
        var oneMinusSpecularStrength = 1 - this._getMaxComponent(specularGlossiness.specularColor);
        var metallic = _GLTFMaterialExporter._SolveMetallic(diffusePerceivedBrightness, specularPerceivedBrightness, oneMinusSpecularStrength);
        var baseColorFromDiffuse = specularGlossiness.diffuseColor.scale(oneMinusSpecularStrength / (1.0 - _GLTFMaterialExporter._DielectricSpecular.r) / Math.max(1 - metallic, _GLTFMaterialExporter._Epsilon));
        var baseColorFromSpecular = specularGlossiness.specularColor.subtract(_GLTFMaterialExporter._DielectricSpecular.scale(1 - metallic)).scale(1 / Math.max(metallic, _GLTFMaterialExporter._Epsilon));
        var baseColor = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].Lerp(baseColorFromDiffuse, baseColorFromSpecular, metallic * metallic);
        baseColor = baseColor.clampToRef(0, 1, baseColor);
        var metallicRoughness = {
            baseColor: baseColor,
            metallic: metallic,
            roughness: 1 - specularGlossiness.glossiness
        };
        return metallicRoughness;
    };
    /**
     * Calculates the surface reflectance, independent of lighting conditions
     * @param color Color source to calculate brightness from
     * @returns number representing the perceived brightness, or zero if color is undefined
     */
    _GLTFMaterialExporter.prototype._getPerceivedBrightness = function (color) {
        if (color) {
            return Math.sqrt(0.299 * color.r * color.r + 0.587 * color.g * color.g + 0.114 * color.b * color.b);
        }
        return 0;
    };
    /**
     * Returns the maximum color component value
     * @param color
     * @returns maximum color component value, or zero if color is null or undefined
     */
    _GLTFMaterialExporter.prototype._getMaxComponent = function (color) {
        if (color) {
            return Math.max(color.r, Math.max(color.g, color.b));
        }
        return 0;
    };
    /**
     * Convert a PBRMaterial (Metallic/Roughness) to Metallic Roughness factors
     * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
     * @param mimeType mime type to use for the textures
     * @param images array of glTF image interfaces
     * @param textures array of glTF texture interfaces
     * @param glTFPbrMetallicRoughness glTF PBR Metallic Roughness interface
     * @param imageData map of image file name to data
     * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
     * @returns glTF PBR Metallic Roughness factors
     */
    _GLTFMaterialExporter.prototype._convertMetalRoughFactorsToMetallicRoughnessAsync = function (babylonPBRMaterial, mimeType, glTFPbrMetallicRoughness, hasTextureCoords) {
        var promises = [];
        var metallicRoughness = {
            baseColor: babylonPBRMaterial.albedoColor,
            metallic: babylonPBRMaterial.metallic,
            roughness: babylonPBRMaterial.roughness
        };
        if (hasTextureCoords) {
            if (babylonPBRMaterial.albedoTexture) {
                promises.push(this._exportTextureAsync(babylonPBRMaterial.albedoTexture, mimeType).then(function (glTFTexture) {
                    if (glTFTexture) {
                        glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                    }
                }));
            }
            if (babylonPBRMaterial.metallicTexture) {
                promises.push(this._exportTextureAsync(babylonPBRMaterial.metallicTexture, mimeType).then(function (glTFTexture) {
                    if (glTFTexture) {
                        glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFTexture;
                    }
                }));
            }
        }
        return Promise.all(promises).then(function () {
            return metallicRoughness;
        });
    };
    _GLTFMaterialExporter.prototype._getGLTFTextureSampler = function (texture) {
        var sampler = this._getGLTFTextureWrapModesSampler(texture);
        var samplingMode = texture instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"] ? texture.samplingMode : null;
        if (samplingMode != null) {
            switch (samplingMode) {
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_LINEAR: {
                    sampler.magFilter = 9729 /* LINEAR */;
                    sampler.minFilter = 9729 /* LINEAR */;
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_NEAREST: {
                    sampler.magFilter = 9729 /* LINEAR */;
                    sampler.minFilter = 9728 /* NEAREST */;
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_LINEAR: {
                    sampler.magFilter = 9728 /* NEAREST */;
                    sampler.minFilter = 9729 /* LINEAR */;
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_LINEAR_MIPLINEAR: {
                    sampler.magFilter = 9728 /* NEAREST */;
                    sampler.minFilter = 9987 /* LINEAR_MIPMAP_LINEAR */;
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_NEAREST: {
                    sampler.magFilter = 9728 /* NEAREST */;
                    sampler.minFilter = 9728 /* NEAREST */;
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_LINEAR_MIPNEAREST: {
                    sampler.magFilter = 9728 /* NEAREST */;
                    sampler.minFilter = 9985 /* LINEAR_MIPMAP_NEAREST */;
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_NEAREST_MIPNEAREST: {
                    sampler.magFilter = 9729 /* LINEAR */;
                    sampler.minFilter = 9984 /* NEAREST_MIPMAP_NEAREST */;
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_NEAREST_MIPLINEAR: {
                    sampler.magFilter = 9729 /* LINEAR */;
                    sampler.minFilter = 9986 /* NEAREST_MIPMAP_LINEAR */;
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_NEAREST_MIPLINEAR: {
                    sampler.magFilter = 9728 /* NEAREST */;
                    sampler.minFilter = 9986 /* NEAREST_MIPMAP_LINEAR */;
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_LINEAR_MIPLINEAR: {
                    sampler.magFilter = 9729 /* LINEAR */;
                    sampler.minFilter = 9987 /* LINEAR_MIPMAP_LINEAR */;
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_LINEAR_MIPNEAREST: {
                    sampler.magFilter = 9729 /* LINEAR */;
                    sampler.minFilter = 9985 /* LINEAR_MIPMAP_NEAREST */;
                    break;
                }
                case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_NEAREST_MIPNEAREST: {
                    sampler.magFilter = 9728 /* NEAREST */;
                    sampler.minFilter = 9984 /* NEAREST_MIPMAP_NEAREST */;
                    break;
                }
            }
        }
        return sampler;
    };
    _GLTFMaterialExporter.prototype._getGLTFTextureWrapMode = function (wrapMode) {
        switch (wrapMode) {
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].WRAP_ADDRESSMODE: {
                return 10497 /* REPEAT */;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].CLAMP_ADDRESSMODE: {
                return 33071 /* CLAMP_TO_EDGE */;
            }
            case babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].MIRROR_ADDRESSMODE: {
                return 33648 /* MIRRORED_REPEAT */;
            }
            default: {
                babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].Error("Unsupported Texture Wrap Mode " + wrapMode + "!");
                return 10497 /* REPEAT */;
            }
        }
    };
    _GLTFMaterialExporter.prototype._getGLTFTextureWrapModesSampler = function (texture) {
        var wrapS = this._getGLTFTextureWrapMode(texture instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"] ? texture.wrapU : babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].WRAP_ADDRESSMODE);
        var wrapT = this._getGLTFTextureWrapMode(texture instanceof babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"] ? texture.wrapV : babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Texture"].WRAP_ADDRESSMODE);
        if (wrapS === 10497 /* REPEAT */ && wrapT === 10497 /* REPEAT */) { // default wrapping mode in glTF, so omitting
            return {};
        }
        return { wrapS: wrapS, wrapT: wrapT };
    };
    /**
     * Convert a PBRMaterial (Specular/Glossiness) to Metallic Roughness factors
     * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
     * @param mimeType mime type to use for the textures
     * @param images array of glTF image interfaces
     * @param textures array of glTF texture interfaces
     * @param glTFPbrMetallicRoughness glTF PBR Metallic Roughness interface
     * @param imageData map of image file name to data
     * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
     * @returns glTF PBR Metallic Roughness factors
     */
    _GLTFMaterialExporter.prototype._convertSpecGlossFactorsToMetallicRoughnessAsync = function (babylonPBRMaterial, mimeType, glTFPbrMetallicRoughness, hasTextureCoords) {
        var _this = this;
        return Promise.resolve().then(function () {
            var samplers = _this._exporter._samplers;
            var textures = _this._exporter._textures;
            var specGloss = {
                diffuseColor: babylonPBRMaterial.albedoColor || babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].White(),
                specularColor: babylonPBRMaterial.reflectivityColor || babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].White(),
                glossiness: babylonPBRMaterial.microSurface || 1,
            };
            var samplerIndex = null;
            var sampler = _this._getGLTFTextureSampler(babylonPBRMaterial.albedoTexture);
            if (sampler.magFilter != null && sampler.minFilter != null && sampler.wrapS != null && sampler.wrapT != null) {
                samplers.push(sampler);
                samplerIndex = samplers.length - 1;
            }
            if (babylonPBRMaterial.reflectivityTexture && !babylonPBRMaterial.useMicroSurfaceFromReflectivityMapAlpha) {
                return Promise.reject("_ConvertPBRMaterial: Glossiness values not included in the reflectivity texture are currently not supported");
            }
            if ((babylonPBRMaterial.albedoTexture || babylonPBRMaterial.reflectivityTexture) && hasTextureCoords) {
                return _this._convertSpecularGlossinessTexturesToMetallicRoughnessAsync(babylonPBRMaterial.albedoTexture, babylonPBRMaterial.reflectivityTexture, specGloss, mimeType).then(function (metallicRoughnessFactors) {
                    if (metallicRoughnessFactors.baseColorTextureBase64) {
                        var glTFBaseColorTexture = _this._getTextureInfoFromBase64(metallicRoughnessFactors.baseColorTextureBase64, "bjsBaseColorTexture_" + (textures.length) + ".png", mimeType, babylonPBRMaterial.albedoTexture ? babylonPBRMaterial.albedoTexture.coordinatesIndex : null, samplerIndex);
                        if (glTFBaseColorTexture) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFBaseColorTexture;
                        }
                    }
                    if (metallicRoughnessFactors.metallicRoughnessTextureBase64) {
                        var glTFMRColorTexture = _this._getTextureInfoFromBase64(metallicRoughnessFactors.metallicRoughnessTextureBase64, "bjsMetallicRoughnessTexture_" + (textures.length) + ".png", mimeType, babylonPBRMaterial.reflectivityTexture ? babylonPBRMaterial.reflectivityTexture.coordinatesIndex : null, samplerIndex);
                        if (glTFMRColorTexture) {
                            glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFMRColorTexture;
                        }
                    }
                    return metallicRoughnessFactors;
                });
            }
            else {
                return _this._convertSpecularGlossinessToMetallicRoughness(specGloss);
            }
        });
    };
    /**
     * Converts a Babylon PBR Metallic Roughness Material to a glTF Material
     * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
     * @param mimeType mime type to use for the textures
     * @param images array of glTF image interfaces
     * @param textures array of glTF texture interfaces
     * @param materials array of glTF material interfaces
     * @param imageData map of image file name to data
     * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
     */
    _GLTFMaterialExporter.prototype._convertPBRMaterialAsync = function (babylonPBRMaterial, mimeType, hasTextureCoords) {
        var _this = this;
        var glTFPbrMetallicRoughness = {};
        var glTFMaterial = {
            name: babylonPBRMaterial.name
        };
        var useMetallicRoughness = babylonPBRMaterial.isMetallicWorkflow();
        if (useMetallicRoughness) {
            if (babylonPBRMaterial.albedoColor) {
                glTFPbrMetallicRoughness.baseColorFactor = [
                    babylonPBRMaterial.albedoColor.r,
                    babylonPBRMaterial.albedoColor.g,
                    babylonPBRMaterial.albedoColor.b,
                    babylonPBRMaterial.alpha
                ];
            }
            return this._convertMetalRoughFactorsToMetallicRoughnessAsync(babylonPBRMaterial, mimeType, glTFPbrMetallicRoughness, hasTextureCoords).then(function (metallicRoughness) {
                return _this.setMetallicRoughnessPbrMaterial(metallicRoughness, babylonPBRMaterial, glTFMaterial, glTFPbrMetallicRoughness, mimeType, hasTextureCoords);
            });
        }
        else {
            return this._convertSpecGlossFactorsToMetallicRoughnessAsync(babylonPBRMaterial, mimeType, glTFPbrMetallicRoughness, hasTextureCoords).then(function (metallicRoughness) {
                return _this.setMetallicRoughnessPbrMaterial(metallicRoughness, babylonPBRMaterial, glTFMaterial, glTFPbrMetallicRoughness, mimeType, hasTextureCoords);
            });
        }
    };
    _GLTFMaterialExporter.prototype.setMetallicRoughnessPbrMaterial = function (metallicRoughness, babylonPBRMaterial, glTFMaterial, glTFPbrMetallicRoughness, mimeType, hasTextureCoords) {
        var materialMap = this._exporter._materialMap;
        var materials = this._exporter._materials;
        var promises = [];
        if (metallicRoughness) {
            _GLTFMaterialExporter._SetAlphaMode(glTFMaterial, babylonPBRMaterial);
            if (!(_GLTFMaterialExporter.FuzzyEquals(metallicRoughness.baseColor, babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].White(), _GLTFMaterialExporter._Epsilon) && babylonPBRMaterial.alpha >= _GLTFMaterialExporter._Epsilon)) {
                glTFPbrMetallicRoughness.baseColorFactor = [
                    metallicRoughness.baseColor.r,
                    metallicRoughness.baseColor.g,
                    metallicRoughness.baseColor.b,
                    babylonPBRMaterial.alpha
                ];
            }
            if (metallicRoughness.metallic != null && metallicRoughness.metallic !== 1) {
                glTFPbrMetallicRoughness.metallicFactor = metallicRoughness.metallic;
            }
            if (metallicRoughness.roughness != null && metallicRoughness.roughness !== 1) {
                glTFPbrMetallicRoughness.roughnessFactor = metallicRoughness.roughness;
            }
            if (babylonPBRMaterial.backFaceCulling != null && !babylonPBRMaterial.backFaceCulling) {
                if (!babylonPBRMaterial.twoSidedLighting) {
                    babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].Warn(babylonPBRMaterial.name + ": Back-face culling enabled and two-sided lighting disabled is not supported in glTF.");
                }
                glTFMaterial.doubleSided = true;
            }
            if (hasTextureCoords) {
                if (babylonPBRMaterial.bumpTexture) {
                    var promise = this._exportTextureAsync(babylonPBRMaterial.bumpTexture, mimeType).then(function (glTFTexture) {
                        if (glTFTexture) {
                            glTFMaterial.normalTexture = glTFTexture;
                            if (babylonPBRMaterial.bumpTexture.level !== 1) {
                                glTFMaterial.normalTexture.scale = babylonPBRMaterial.bumpTexture.level;
                            }
                        }
                    });
                    promises.push(promise);
                }
                if (babylonPBRMaterial.ambientTexture) {
                    var promise = this._exportTextureAsync(babylonPBRMaterial.ambientTexture, mimeType).then(function (glTFTexture) {
                        if (glTFTexture) {
                            var occlusionTexture = {
                                index: glTFTexture.index
                            };
                            glTFMaterial.occlusionTexture = occlusionTexture;
                            if (babylonPBRMaterial.ambientTextureStrength) {
                                occlusionTexture.strength = babylonPBRMaterial.ambientTextureStrength;
                            }
                        }
                    });
                    promises.push(promise);
                }
                if (babylonPBRMaterial.emissiveTexture) {
                    var promise = this._exportTextureAsync(babylonPBRMaterial.emissiveTexture, mimeType).then(function (glTFTexture) {
                        if (glTFTexture) {
                            glTFMaterial.emissiveTexture = glTFTexture;
                        }
                    });
                    promises.push(promise);
                }
            }
            if (!_GLTFMaterialExporter.FuzzyEquals(babylonPBRMaterial.emissiveColor, babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"].Black(), _GLTFMaterialExporter._Epsilon)) {
                glTFMaterial.emissiveFactor = babylonPBRMaterial.emissiveColor.asArray();
            }
            glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
            materials.push(glTFMaterial);
            materialMap[babylonPBRMaterial.uniqueId] = materials.length - 1;
        }
        return Promise.all(promises).then(function (result) { });
    };
    _GLTFMaterialExporter.prototype.getPixelsFromTexture = function (babylonTexture) {
        var pixels = babylonTexture.textureType === babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Constants"].TEXTURETYPE_UNSIGNED_INT ? babylonTexture.readPixels() : babylonTexture.readPixels();
        return pixels;
    };
    /**
     * Extracts a texture from a Babylon texture into file data and glTF data
     * @param babylonTexture Babylon texture to extract
     * @param mimeType Mime Type of the babylonTexture
     * @return glTF texture info, or null if the texture format is not supported
     */
    _GLTFMaterialExporter.prototype._exportTextureAsync = function (babylonTexture, mimeType) {
        var _this = this;
        var extensionPromise = this._exporter._extensionsPreExportTextureAsync("exporter", babylonTexture, mimeType);
        if (!extensionPromise) {
            return this._exportTextureInfoAsync(babylonTexture, mimeType);
        }
        return extensionPromise.then(function (texture) {
            if (!texture) {
                return _this._exportTextureInfoAsync(babylonTexture, mimeType);
            }
            return _this._exportTextureInfoAsync(texture, mimeType);
        });
    };
    _GLTFMaterialExporter.prototype._exportTextureInfoAsync = function (babylonTexture, mimeType) {
        var _this = this;
        return Promise.resolve().then(function () {
            var textureUid = babylonTexture.uid;
            if (textureUid in _this._textureMap) {
                return _this._textureMap[textureUid];
            }
            else {
                var samplers = _this._exporter._samplers;
                var sampler = _this._getGLTFTextureSampler(babylonTexture);
                var samplerIndex_1 = null;
                //  if a pre-existing sampler with identical parameters exists, then reuse the previous sampler
                var foundSamplerIndex = null;
                for (var i = 0; i < samplers.length; ++i) {
                    var s = samplers[i];
                    if (s.minFilter === sampler.minFilter && s.magFilter === sampler.magFilter &&
                        s.wrapS === sampler.wrapS && s.wrapT === sampler.wrapT) {
                        foundSamplerIndex = i;
                        break;
                    }
                }
                if (foundSamplerIndex == null) {
                    samplers.push(sampler);
                    samplerIndex_1 = samplers.length - 1;
                }
                else {
                    samplerIndex_1 = foundSamplerIndex;
                }
                var pixels = _this.getPixelsFromTexture(babylonTexture);
                var size = babylonTexture.getSize();
                return _this._createBase64FromCanvasAsync(pixels, size.width, size.height, mimeType).then(function (base64Data) {
                    var textureInfo = _this._getTextureInfoFromBase64(base64Data, babylonTexture.name.replace(/\.\/|\/|\.\\|\\/g, "_"), mimeType, babylonTexture.coordinatesIndex, samplerIndex_1);
                    if (textureInfo) {
                        _this._textureMap[textureUid] = textureInfo;
                    }
                    return textureInfo;
                });
            }
        });
    };
    /**
     * Builds a texture from base64 string
     * @param base64Texture base64 texture string
     * @param baseTextureName Name to use for the texture
     * @param mimeType image mime type for the texture
     * @param images array of images
     * @param textures array of textures
     * @param imageData map of image data
     * @returns glTF texture info, or null if the texture format is not supported
     */
    _GLTFMaterialExporter.prototype._getTextureInfoFromBase64 = function (base64Texture, baseTextureName, mimeType, texCoordIndex, samplerIndex) {
        var textures = this._exporter._textures;
        var images = this._exporter._images;
        var imageData = this._exporter._imageData;
        var textureInfo = null;
        var glTFTexture = {
            source: images.length,
            name: baseTextureName
        };
        if (samplerIndex != null) {
            glTFTexture.sampler = samplerIndex;
        }
        var binStr = atob(base64Texture.split(',')[1]);
        var arrBuff = new ArrayBuffer(binStr.length);
        var arr = new Uint8Array(arrBuff);
        for (var i = 0, length_2 = binStr.length; i < length_2; ++i) {
            arr[i] = binStr.charCodeAt(i);
        }
        var imageValues = { data: arr, mimeType: mimeType };
        var extension = mimeType === "image/jpeg" /* JPEG */ ? '.jpeg' : '.png';
        var textureName = baseTextureName + extension;
        var originalTextureName = textureName;
        if (textureName in imageData) {
            textureName = baseTextureName + "_" + babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].RandomId() + extension;
        }
        imageData[textureName] = imageValues;
        if (mimeType === "image/jpeg" /* JPEG */ || mimeType === "image/png" /* PNG */) {
            var glTFImage = {
                name: baseTextureName,
                uri: textureName
            };
            var foundIndex = null;
            for (var i = 0; i < images.length; ++i) {
                if (images[i].uri === originalTextureName) {
                    foundIndex = i;
                    break;
                }
            }
            if (foundIndex == null) {
                images.push(glTFImage);
                glTFTexture.source = images.length - 1;
            }
            else {
                glTFTexture.source = foundIndex;
            }
            textures.push(glTFTexture);
            textureInfo = {
                index: textures.length - 1
            };
            if (texCoordIndex != null) {
                textureInfo.texCoord = texCoordIndex;
            }
        }
        else {
            babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Tools"].Error("Unsupported texture mime type " + mimeType);
        }
        return textureInfo;
    };
    /**
     * Represents the dielectric specular values for R, G and B
     */
    _GLTFMaterialExporter._DielectricSpecular = new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Color3"](0.04, 0.04, 0.04);
    /**
     * Allows the maximum specular power to be defined for material calculations
     */
    _GLTFMaterialExporter._MaxSpecularPower = 1024;
    /**
     * Numeric tolerance value
     */
    _GLTFMaterialExporter._Epsilon = 1e-6;
    return _GLTFMaterialExporter;
}());



/***/ }),

/***/ "./glTF/2.0/glTFSerializer.ts":
/*!************************************!*\
  !*** ./glTF/2.0/glTFSerializer.ts ***!
  \************************************/
/*! exports provided: GLTF2Export */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GLTF2Export", function() { return GLTF2Export; });
/* harmony import */ var _glTFExporter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./glTFExporter */ "./glTF/2.0/glTFExporter.ts");

/**
 * Class for generating glTF data from a Babylon scene.
 */
var GLTF2Export = /** @class */ (function () {
    function GLTF2Export() {
    }
    /**
     * Exports the geometry of the scene to .gltf file format asynchronously
     * @param scene Babylon scene with scene hierarchy information
     * @param filePrefix File prefix to use when generating the glTF file
     * @param options Exporter options
     * @returns Returns an object with a .gltf file and associates texture names
     * as keys and their data and paths as values
     */
    GLTF2Export.GLTFAsync = function (scene, filePrefix, options) {
        return scene.whenReadyAsync().then(function () {
            var glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");
            var gltfGenerator = new _glTFExporter__WEBPACK_IMPORTED_MODULE_0__["_Exporter"](scene, options);
            return gltfGenerator._generateGLTFAsync(glTFPrefix);
        });
    };
    GLTF2Export._PreExportAsync = function (scene, options) {
        return Promise.resolve().then(function () {
            if (options && options.exportWithoutWaitingForScene) {
                return Promise.resolve();
            }
            else {
                return scene.whenReadyAsync();
            }
        });
    };
    GLTF2Export._PostExportAsync = function (scene, glTFData, options) {
        return Promise.resolve().then(function () {
            if (options && options.exportWithoutWaitingForScene) {
                return glTFData;
            }
            else {
                return glTFData;
            }
        });
    };
    /**
     * Exports the geometry of the scene to .glb file format asychronously
     * @param scene Babylon scene with scene hierarchy information
     * @param filePrefix File prefix to use when generating glb file
     * @param options Exporter options
     * @returns Returns an object with a .glb filename as key and data as value
     */
    GLTF2Export.GLBAsync = function (scene, filePrefix, options) {
        var _this = this;
        return this._PreExportAsync(scene, options).then(function () {
            var glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");
            var gltfGenerator = new _glTFExporter__WEBPACK_IMPORTED_MODULE_0__["_Exporter"](scene, options);
            return gltfGenerator._generateGLBAsync(glTFPrefix).then(function (glTFData) {
                return _this._PostExportAsync(scene, glTFData, options);
            });
        });
    };
    return GLTF2Export;
}());



/***/ }),

/***/ "./glTF/2.0/glTFUtilities.ts":
/*!***********************************!*\
  !*** ./glTF/2.0/glTFUtilities.ts ***!
  \***********************************/
/*! exports provided: _GLTFUtilities */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_GLTFUtilities", function() { return _GLTFUtilities; });
/* harmony import */ var babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math */ "babylonjs/Maths/math");
/* harmony import */ var babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__);

/**
 * @hidden
 */
var _GLTFUtilities = /** @class */ (function () {
    function _GLTFUtilities() {
    }
    /**
     * Creates a buffer view based on the supplied arguments
     * @param bufferIndex index value of the specified buffer
     * @param byteOffset byte offset value
     * @param byteLength byte length of the bufferView
     * @param byteStride byte distance between conequential elements
     * @param name name of the buffer view
     * @returns bufferView for glTF
     */
    _GLTFUtilities._CreateBufferView = function (bufferIndex, byteOffset, byteLength, byteStride, name) {
        var bufferview = { buffer: bufferIndex, byteLength: byteLength };
        if (byteOffset) {
            bufferview.byteOffset = byteOffset;
        }
        if (name) {
            bufferview.name = name;
        }
        if (byteStride) {
            bufferview.byteStride = byteStride;
        }
        return bufferview;
    };
    /**
     * Creates an accessor based on the supplied arguments
     * @param bufferviewIndex The index of the bufferview referenced by this accessor
     * @param name The name of the accessor
     * @param type The type of the accessor
     * @param componentType The datatype of components in the attribute
     * @param count The number of attributes referenced by this accessor
     * @param byteOffset The offset relative to the start of the bufferView in bytes
     * @param min Minimum value of each component in this attribute
     * @param max Maximum value of each component in this attribute
     * @returns accessor for glTF
     */
    _GLTFUtilities._CreateAccessor = function (bufferviewIndex, name, type, componentType, count, byteOffset, min, max) {
        var accessor = { name: name, bufferView: bufferviewIndex, componentType: componentType, count: count, type: type };
        if (min != null) {
            accessor.min = min;
        }
        if (max != null) {
            accessor.max = max;
        }
        if (byteOffset != null) {
            accessor.byteOffset = byteOffset;
        }
        return accessor;
    };
    /**
     * Calculates the minimum and maximum values of an array of position floats
     * @param positions Positions array of a mesh
     * @param vertexStart Starting vertex offset to calculate min and max values
     * @param vertexCount Number of vertices to check for min and max values
     * @returns min number array and max number array
     */
    _GLTFUtilities._CalculateMinMaxPositions = function (positions, vertexStart, vertexCount, convertToRightHandedSystem) {
        var min = [Infinity, Infinity, Infinity];
        var max = [-Infinity, -Infinity, -Infinity];
        var positionStrideSize = 3;
        var indexOffset;
        var position;
        var vector;
        if (vertexCount) {
            for (var i = vertexStart, length_1 = vertexStart + vertexCount; i < length_1; ++i) {
                indexOffset = positionStrideSize * i;
                position = babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromArray(positions, indexOffset);
                if (convertToRightHandedSystem) {
                    _GLTFUtilities._GetRightHandedPositionVector3FromRef(position);
                }
                vector = position.asArray();
                for (var j = 0; j < positionStrideSize; ++j) {
                    var num = vector[j];
                    if (num < min[j]) {
                        min[j] = num;
                    }
                    if (num > max[j]) {
                        max[j] = num;
                    }
                    ++indexOffset;
                }
            }
        }
        return { min: min, max: max };
    };
    /**
     * Converts a new right-handed Vector3
     * @param vector vector3 array
     * @returns right-handed Vector3
     */
    _GLTFUtilities._GetRightHandedPositionVector3 = function (vector) {
        return new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Vector3"](vector.x, vector.y, -vector.z);
    };
    /**
     * Converts a Vector3 to right-handed
     * @param vector Vector3 to convert to right-handed
     */
    _GLTFUtilities._GetRightHandedPositionVector3FromRef = function (vector) {
        vector.z *= -1;
    };
    /**
     * Converts a three element number array to right-handed
     * @param vector number array to convert to right-handed
     */
    _GLTFUtilities._GetRightHandedPositionArray3FromRef = function (vector) {
        vector[2] *= -1;
    };
    /**
     * Converts a new right-handed Vector3
     * @param vector vector3 array
     * @returns right-handed Vector3
     */
    _GLTFUtilities._GetRightHandedNormalVector3 = function (vector) {
        return new babylonjs_Maths_math__WEBPACK_IMPORTED_MODULE_0__["Vector3"](vector.x, vector.y, -vector.z);
    };
    /**
     * Converts a Vector3 to right-handed
     * @param vector Vector3 to convert to right-handed
     */
    _GLTFUtilities._GetRightHandedNormalVector3FromRef = function (vector) {
        vector.z *= -1;
    };
    /**
     * Converts a three element number array to right-handed
     * @param vector number array to convert to right-handed
     */
    _GLTFUtilities._GetRightHandedNormalArray3FromRef = function (vector) {
        vector[2] *= -1;
    };
    /**
     * Converts a Vector4 to right-handed
     * @param vector Vector4 to convert to right-handed
     */
    _GLTFUtilities._GetRightHandedVector4FromRef = function (vector) {
        vector.z *= -1;
        vector.w *= -1;
    };
    /**
     * Converts a Vector4 to right-handed
     * @param vector Vector4 to convert to right-handed
     */
    _GLTFUtilities._GetRightHandedArray4FromRef = function (vector) {
        vector[2] *= -1;
        vector[3] *= -1;
    };
    /**
     * Converts a Quaternion to right-handed
     * @param quaternion Source quaternion to convert to right-handed
     */
    _GLTFUtilities._GetRightHandedQuaternionFromRef = function (quaternion) {
        quaternion.x *= -1;
        quaternion.y *= -1;
    };
    /**
     * Converts a Quaternion to right-handed
     * @param quaternion Source quaternion to convert to right-handed
     */
    _GLTFUtilities._GetRightHandedQuaternionArrayFromRef = function (quaternion) {
        quaternion[0] *= -1;
        quaternion[1] *= -1;
    };
    _GLTFUtilities._NormalizeTangentFromRef = function (tangent) {
        var length = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y + tangent.z * tangent.z);
        if (length > 0) {
            tangent.x /= length;
            tangent.y /= length;
            tangent.z /= length;
        }
    };
    return _GLTFUtilities;
}());



/***/ }),

/***/ "./glTF/2.0/index.ts":
/*!***************************!*\
  !*** ./glTF/2.0/index.ts ***!
  \***************************/
/*! exports provided: GLTFData, GLTF2Export, _GLTFAnimation, _Exporter, _BinaryWriter, __IGLTFExporterExtensionV2, _GLTFMaterialExporter, _GLTFUtilities, KHR_texture_transform, KHR_lights_punctual */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _glTFAnimation__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./glTFAnimation */ "./glTF/2.0/glTFAnimation.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFAnimation", function() { return _glTFAnimation__WEBPACK_IMPORTED_MODULE_0__["_GLTFAnimation"]; });

/* harmony import */ var _glTFData__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./glTFData */ "./glTF/2.0/glTFData.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFData", function() { return _glTFData__WEBPACK_IMPORTED_MODULE_1__["GLTFData"]; });

/* harmony import */ var _glTFExporter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./glTFExporter */ "./glTF/2.0/glTFExporter.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_Exporter", function() { return _glTFExporter__WEBPACK_IMPORTED_MODULE_2__["_Exporter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_BinaryWriter", function() { return _glTFExporter__WEBPACK_IMPORTED_MODULE_2__["_BinaryWriter"]; });

/* harmony import */ var _glTFExporterExtension__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./glTFExporterExtension */ "./glTF/2.0/glTFExporterExtension.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "__IGLTFExporterExtensionV2", function() { return _glTFExporterExtension__WEBPACK_IMPORTED_MODULE_3__["__IGLTFExporterExtensionV2"]; });

/* harmony import */ var _glTFMaterialExporter__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./glTFMaterialExporter */ "./glTF/2.0/glTFMaterialExporter.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFMaterialExporter", function() { return _glTFMaterialExporter__WEBPACK_IMPORTED_MODULE_4__["_GLTFMaterialExporter"]; });

/* harmony import */ var _glTFSerializer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./glTFSerializer */ "./glTF/2.0/glTFSerializer.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTF2Export", function() { return _glTFSerializer__WEBPACK_IMPORTED_MODULE_5__["GLTF2Export"]; });

/* harmony import */ var _glTFUtilities__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./glTFUtilities */ "./glTF/2.0/glTFUtilities.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFUtilities", function() { return _glTFUtilities__WEBPACK_IMPORTED_MODULE_6__["_GLTFUtilities"]; });

/* harmony import */ var _Extensions__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./Extensions */ "./glTF/2.0/Extensions/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_texture_transform", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_7__["KHR_texture_transform"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_lights_punctual", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_7__["KHR_lights_punctual"]; });











/***/ }),

/***/ "./glTF/2.0/shaders/textureTransform.fragment.ts":
/*!*******************************************************!*\
  !*** ./glTF/2.0/shaders/textureTransform.fragment.ts ***!
  \*******************************************************/
/*! exports provided: textureTransformPixelShader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "textureTransformPixelShader", function() { return textureTransformPixelShader; });
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/effect */ "babylonjs/Maths/math");
/* harmony import */ var babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__);

var name = 'textureTransformPixelShader';
var shader = "precision highp float;\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform mat4 textureTransformMat;\nvoid main(void) {\nvec2 uvTransformed=(textureTransformMat*vec4(vUV.xy,1,1)).xy;\ngl_FragColor=texture2D(textureSampler,uvTransformed);\n}";
babylonjs_Materials_effect__WEBPACK_IMPORTED_MODULE_0__["Effect"].ShadersStore[name] = shader;
/** @hidden */
var textureTransformPixelShader = { name: name, shader: shader };


/***/ }),

/***/ "./glTF/glTFFileExporter.ts":
/*!**********************************!*\
  !*** ./glTF/glTFFileExporter.ts ***!
  \**********************************/
/*! exports provided: __IGLTFExporterExtension */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__IGLTFExporterExtension", function() { return __IGLTFExporterExtension; });
/** @hidden */
var __IGLTFExporterExtension = 0; // I am here to allow dts to be created


/***/ }),

/***/ "./glTF/index.ts":
/*!***********************!*\
  !*** ./glTF/index.ts ***!
  \***********************/
/*! exports provided: __IGLTFExporterExtension, GLTFData, GLTF2Export, _GLTFAnimation, _Exporter, _BinaryWriter, __IGLTFExporterExtensionV2, _GLTFMaterialExporter, _GLTFUtilities, KHR_texture_transform, KHR_lights_punctual */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _glTFFileExporter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./glTFFileExporter */ "./glTF/glTFFileExporter.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "__IGLTFExporterExtension", function() { return _glTFFileExporter__WEBPACK_IMPORTED_MODULE_0__["__IGLTFExporterExtension"]; });

/* harmony import */ var _2_0__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./2.0 */ "./glTF/2.0/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFData", function() { return _2_0__WEBPACK_IMPORTED_MODULE_1__["GLTFData"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTF2Export", function() { return _2_0__WEBPACK_IMPORTED_MODULE_1__["GLTF2Export"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFAnimation", function() { return _2_0__WEBPACK_IMPORTED_MODULE_1__["_GLTFAnimation"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_Exporter", function() { return _2_0__WEBPACK_IMPORTED_MODULE_1__["_Exporter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_BinaryWriter", function() { return _2_0__WEBPACK_IMPORTED_MODULE_1__["_BinaryWriter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "__IGLTFExporterExtensionV2", function() { return _2_0__WEBPACK_IMPORTED_MODULE_1__["__IGLTFExporterExtensionV2"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFMaterialExporter", function() { return _2_0__WEBPACK_IMPORTED_MODULE_1__["_GLTFMaterialExporter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFUtilities", function() { return _2_0__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_texture_transform", function() { return _2_0__WEBPACK_IMPORTED_MODULE_1__["KHR_texture_transform"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_lights_punctual", function() { return _2_0__WEBPACK_IMPORTED_MODULE_1__["KHR_lights_punctual"]; });





/***/ }),

/***/ "./index.ts":
/*!******************!*\
  !*** ./index.ts ***!
  \******************/
/*! exports provided: __IGLTFExporterExtension, GLTFData, GLTF2Export, OBJExport, _GLTFAnimation, _Exporter, _BinaryWriter, __IGLTFExporterExtensionV2, _GLTFMaterialExporter, _GLTFUtilities, STLExport, KHR_texture_transform, KHR_lights_punctual */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _OBJ__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./OBJ */ "./OBJ/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "OBJExport", function() { return _OBJ__WEBPACK_IMPORTED_MODULE_0__["OBJExport"]; });

/* harmony import */ var _glTF__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./glTF */ "./glTF/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "__IGLTFExporterExtension", function() { return _glTF__WEBPACK_IMPORTED_MODULE_1__["__IGLTFExporterExtension"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFData", function() { return _glTF__WEBPACK_IMPORTED_MODULE_1__["GLTFData"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTF2Export", function() { return _glTF__WEBPACK_IMPORTED_MODULE_1__["GLTF2Export"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFAnimation", function() { return _glTF__WEBPACK_IMPORTED_MODULE_1__["_GLTFAnimation"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_Exporter", function() { return _glTF__WEBPACK_IMPORTED_MODULE_1__["_Exporter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_BinaryWriter", function() { return _glTF__WEBPACK_IMPORTED_MODULE_1__["_BinaryWriter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "__IGLTFExporterExtensionV2", function() { return _glTF__WEBPACK_IMPORTED_MODULE_1__["__IGLTFExporterExtensionV2"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFMaterialExporter", function() { return _glTF__WEBPACK_IMPORTED_MODULE_1__["_GLTFMaterialExporter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFUtilities", function() { return _glTF__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_texture_transform", function() { return _glTF__WEBPACK_IMPORTED_MODULE_1__["KHR_texture_transform"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_lights_punctual", function() { return _glTF__WEBPACK_IMPORTED_MODULE_1__["KHR_lights_punctual"]; });

/* harmony import */ var _stl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stl */ "./stl/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "STLExport", function() { return _stl__WEBPACK_IMPORTED_MODULE_2__["STLExport"]; });






/***/ }),

/***/ "./legacy/legacy-glTF2Serializer.ts":
/*!******************************************!*\
  !*** ./legacy/legacy-glTF2Serializer.ts ***!
  \******************************************/
/*! exports provided: __IGLTFExporterExtension, GLTFData, GLTF2Export, _GLTFAnimation, _Exporter, _BinaryWriter, __IGLTFExporterExtensionV2, _GLTFMaterialExporter, _GLTFUtilities, KHR_texture_transform, KHR_lights_punctual */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _glTF_glTFFileExporter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../glTF/glTFFileExporter */ "./glTF/glTFFileExporter.ts");
/* harmony import */ var _glTF_2_0_glTFData__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTF/2.0/glTFData */ "./glTF/2.0/glTFData.ts");
/* harmony import */ var _glTF_2_0_glTFSerializer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../glTF/2.0/glTFSerializer */ "./glTF/2.0/glTFSerializer.ts");
/* harmony import */ var _glTF_2_0_Extensions__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../glTF/2.0/Extensions */ "./glTF/2.0/Extensions/index.ts");
/* harmony import */ var _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../glTF/2.0 */ "./glTF/2.0/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "__IGLTFExporterExtension", function() { return _glTF_glTFFileExporter__WEBPACK_IMPORTED_MODULE_0__["__IGLTFExporterExtension"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFData", function() { return _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__["GLTFData"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTF2Export", function() { return _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__["GLTF2Export"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFAnimation", function() { return _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__["_GLTFAnimation"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_Exporter", function() { return _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__["_Exporter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_BinaryWriter", function() { return _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__["_BinaryWriter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "__IGLTFExporterExtensionV2", function() { return _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__["__IGLTFExporterExtensionV2"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFMaterialExporter", function() { return _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__["_GLTFMaterialExporter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFUtilities", function() { return _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__["_GLTFUtilities"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_texture_transform", function() { return _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__["KHR_texture_transform"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_lights_punctual", function() { return _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__["KHR_lights_punctual"]; });






/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    globalObject.BABYLON = globalObject.BABYLON || {};
    var BABYLON = globalObject.BABYLON;
    BABYLON.GLTF2 = BABYLON.GLTF2 || {};
    BABYLON.GLTF2.Exporter = BABYLON.GLTF2.Exporter || {};
    BABYLON.GLTF2.Exporter.Extensions = BABYLON.GLTF2.Exporter.Extensions || {};
    var keys = [];
    for (var key in _glTF_glTFFileExporter__WEBPACK_IMPORTED_MODULE_0__) {
        BABYLON[key] = _glTF_glTFFileExporter__WEBPACK_IMPORTED_MODULE_0__[key];
        keys.push(key);
    }
    for (var key in _glTF_2_0_glTFData__WEBPACK_IMPORTED_MODULE_1__) {
        BABYLON[key] = _glTF_2_0_glTFData__WEBPACK_IMPORTED_MODULE_1__[key];
        keys.push(key);
    }
    for (var key in _glTF_2_0_glTFSerializer__WEBPACK_IMPORTED_MODULE_2__) {
        BABYLON[key] = _glTF_2_0_glTFSerializer__WEBPACK_IMPORTED_MODULE_2__[key];
        keys.push(key);
    }
    for (var key in _glTF_2_0_Extensions__WEBPACK_IMPORTED_MODULE_3__) {
        BABYLON.GLTF2.Exporter.Extensions[key] = _glTF_2_0_Extensions__WEBPACK_IMPORTED_MODULE_3__[key];
        keys.push(key);
    }
    for (var key in _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__) {
        // Prevent Reassignment.
        if (keys.indexOf(key) > -1) {
            continue;
        }
        BABYLON.GLTF2.Exporter[key] = _glTF_2_0__WEBPACK_IMPORTED_MODULE_4__[key];
    }
}



/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./legacy/legacy-objSerializer.ts":
/*!****************************************!*\
  !*** ./legacy/legacy-objSerializer.ts ***!
  \****************************************/
/*! exports provided: OBJExport */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _OBJ__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../OBJ */ "./OBJ/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "OBJExport", function() { return _OBJ__WEBPACK_IMPORTED_MODULE_0__["OBJExport"]; });


/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var serializer in _OBJ__WEBPACK_IMPORTED_MODULE_0__) {
        globalObject.BABYLON[serializer] = _OBJ__WEBPACK_IMPORTED_MODULE_0__[serializer];
    }
}


/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./legacy/legacy-stlSerializer.ts":
/*!****************************************!*\
  !*** ./legacy/legacy-stlSerializer.ts ***!
  \****************************************/
/*! exports provided: STLExport */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _stl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../stl */ "./stl/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "STLExport", function() { return _stl__WEBPACK_IMPORTED_MODULE_0__["STLExport"]; });


/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var serializer in _stl__WEBPACK_IMPORTED_MODULE_0__) {
        globalObject.BABYLON[serializer] = _stl__WEBPACK_IMPORTED_MODULE_0__[serializer];
    }
}


/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./legacy/legacy.ts":
/*!**************************!*\
  !*** ./legacy/legacy.ts ***!
  \**************************/
/*! exports provided: __IGLTFExporterExtension, GLTFData, GLTF2Export, _GLTFAnimation, _Exporter, _BinaryWriter, __IGLTFExporterExtensionV2, _GLTFMaterialExporter, _GLTFUtilities, OBJExport, STLExport, KHR_texture_transform, KHR_lights_punctual */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../index */ "./index.ts");
/* harmony import */ var _legacy_glTF2Serializer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./legacy-glTF2Serializer */ "./legacy/legacy-glTF2Serializer.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "__IGLTFExporterExtension", function() { return _legacy_glTF2Serializer__WEBPACK_IMPORTED_MODULE_1__["__IGLTFExporterExtension"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFData", function() { return _legacy_glTF2Serializer__WEBPACK_IMPORTED_MODULE_1__["GLTFData"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTF2Export", function() { return _legacy_glTF2Serializer__WEBPACK_IMPORTED_MODULE_1__["GLTF2Export"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFAnimation", function() { return _legacy_glTF2Serializer__WEBPACK_IMPORTED_MODULE_1__["_GLTFAnimation"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_Exporter", function() { return _legacy_glTF2Serializer__WEBPACK_IMPORTED_MODULE_1__["_Exporter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_BinaryWriter", function() { return _legacy_glTF2Serializer__WEBPACK_IMPORTED_MODULE_1__["_BinaryWriter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "__IGLTFExporterExtensionV2", function() { return _legacy_glTF2Serializer__WEBPACK_IMPORTED_MODULE_1__["__IGLTFExporterExtensionV2"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFMaterialExporter", function() { return _legacy_glTF2Serializer__WEBPACK_IMPORTED_MODULE_1__["_GLTFMaterialExporter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_GLTFUtilities", function() { return _legacy_glTF2Serializer__WEBPACK_IMPORTED_MODULE_1__["_GLTFUtilities"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_texture_transform", function() { return _legacy_glTF2Serializer__WEBPACK_IMPORTED_MODULE_1__["KHR_texture_transform"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_lights_punctual", function() { return _legacy_glTF2Serializer__WEBPACK_IMPORTED_MODULE_1__["KHR_lights_punctual"]; });

/* harmony import */ var _legacy_objSerializer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./legacy-objSerializer */ "./legacy/legacy-objSerializer.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "OBJExport", function() { return _legacy_objSerializer__WEBPACK_IMPORTED_MODULE_2__["OBJExport"]; });

/* harmony import */ var _legacy_stlSerializer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./legacy-stlSerializer */ "./legacy/legacy-stlSerializer.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "STLExport", function() { return _legacy_stlSerializer__WEBPACK_IMPORTED_MODULE_3__["STLExport"]; });







/***/ }),

/***/ "./stl/index.ts":
/*!**********************!*\
  !*** ./stl/index.ts ***!
  \**********************/
/*! exports provided: STLExport */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _stlSerializer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./stlSerializer */ "./stl/stlSerializer.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "STLExport", function() { return _stlSerializer__WEBPACK_IMPORTED_MODULE_0__["STLExport"]; });




/***/ }),

/***/ "./stl/stlSerializer.ts":
/*!******************************!*\
  !*** ./stl/stlSerializer.ts ***!
  \******************************/
/*! exports provided: STLExport */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "STLExport", function() { return STLExport; });
/* harmony import */ var babylonjs_Meshes_buffer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Meshes/buffer */ "babylonjs/Maths/math");
/* harmony import */ var babylonjs_Meshes_buffer__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Meshes_buffer__WEBPACK_IMPORTED_MODULE_0__);


/**
* Class for generating STL data from a Babylon scene.
*/
var STLExport = /** @class */ (function () {
    function STLExport() {
    }
    /**
    * Exports the geometry of a Mesh array in .STL file format (ASCII)
    * @param meshes list defines the mesh to serialize
    * @param download triggers the automatic download of the file.
    * @param fileName changes the downloads fileName.
    * @param binary changes the STL to a binary type.
    * @param isLittleEndian toggle for binary type exporter.
    * @returns the STL as UTF8 string
    */
    STLExport.CreateSTL = function (meshes, download, fileName, binary, isLittleEndian) {
        //Binary support adapted from https://gist.github.com/paulkaplan/6d5f0ab2c7e8fdc68a61
        if (download === void 0) { download = true; }
        if (fileName === void 0) { fileName = 'STL_Mesh'; }
        if (binary === void 0) { binary = false; }
        if (isLittleEndian === void 0) { isLittleEndian = true; }
        var getFaceData = function (indices, vertices, i) {
            var id = [indices[i] * 3, indices[i + 1] * 3, indices[i + 2] * 3];
            var v = [
                new babylonjs_Meshes_buffer__WEBPACK_IMPORTED_MODULE_0__["Vector3"](vertices[id[0]], vertices[id[0] + 1], vertices[id[0] + 2]),
                new babylonjs_Meshes_buffer__WEBPACK_IMPORTED_MODULE_0__["Vector3"](vertices[id[1]], vertices[id[1] + 1], vertices[id[1] + 2]),
                new babylonjs_Meshes_buffer__WEBPACK_IMPORTED_MODULE_0__["Vector3"](vertices[id[2]], vertices[id[2] + 1], vertices[id[2] + 2])
            ];
            var p1p2 = v[0].subtract(v[1]);
            var p3p2 = v[2].subtract(v[1]);
            var n = (babylonjs_Meshes_buffer__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Cross(p1p2, p3p2)).normalize();
            return { v: v, n: n };
        };
        var writeVector = function (dataview, offset, vector, isLittleEndian) {
            offset = writeFloat(dataview, offset, vector.x, isLittleEndian);
            offset = writeFloat(dataview, offset, vector.y, isLittleEndian);
            return writeFloat(dataview, offset, vector.z, isLittleEndian);
        };
        var writeFloat = function (dataview, offset, value, isLittleEndian) {
            dataview.setFloat32(offset, value, isLittleEndian);
            return offset + 4;
        };
        var data;
        var faceCount = 0;
        var offset = 0;
        if (binary) {
            for (var i = 0; i < meshes.length; i++) {
                var mesh = meshes[i];
                var indices = mesh.getIndices();
                faceCount += indices ? indices.length : 0;
            }
            var bufferSize = 84 + (50 * faceCount);
            var buffer = new ArrayBuffer(bufferSize);
            data = new DataView(buffer);
            offset += 80;
            data.setUint32(offset, faceCount, isLittleEndian);
            offset += 4;
        }
        else {
            data = 'solid exportedMesh\r\n';
        }
        for (var i = 0; i < meshes.length; i++) {
            var mesh = meshes[i];
            mesh.bakeCurrentTransformIntoVertices();
            var vertices = mesh.getVerticesData(babylonjs_Meshes_buffer__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].PositionKind) || [];
            var indices = mesh.getIndices() || [];
            for (var i_1 = 0; i_1 < indices.length; i_1 += 3) {
                var fd = getFaceData(indices, vertices, i_1);
                if (binary) {
                    offset = writeVector(data, offset, fd.n, isLittleEndian);
                    offset = writeVector(data, offset, fd.v[0], isLittleEndian);
                    offset = writeVector(data, offset, fd.v[1], isLittleEndian);
                    offset = writeVector(data, offset, fd.v[2], isLittleEndian);
                    offset += 2;
                }
                else {
                    data += 'facet normal ' + fd.n.x + ' ' + fd.n.y + ' ' + fd.n.z + '\r\n';
                    data += '\touter loop\r\n';
                    data += '\t\tvertex ' + fd.v[0].x + ' ' + fd.v[0].y + ' ' + fd.v[0].z + '\r\n';
                    data += '\t\tvertex ' + fd.v[1].x + ' ' + fd.v[1].y + ' ' + fd.v[1].z + '\r\n';
                    data += '\t\tvertex ' + fd.v[2].x + ' ' + fd.v[2].y + ' ' + fd.v[2].z + '\r\n';
                    data += '\tendloop\r\n';
                    data += 'endfacet\r\n';
                }
            }
        }
        if (!binary) {
            data += 'endsolid exportedMesh';
        }
        if (download) {
            var a = document.createElement('a');
            var blob = new Blob([data], { 'type': 'application/octet-stream' });
            a.href = window.URL.createObjectURL(blob);
            if (!fileName) {
                fileName = "STL_Mesh";
            }
            a.download = fileName + ".stl";
            a.click();
        }
        return data;
    };
    return STLExport;
}());



/***/ }),

/***/ "babylonjs/Maths/math":
/*!****************************************************************************************************!*\
  !*** external {"root":"BABYLON","commonjs":"babylonjs","commonjs2":"babylonjs","amd":"babylonjs"} ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_babylonjs_Maths_math__;

/***/ })

/******/ });
});
//# sourceMappingURL=babylonjs.serializers.js.map