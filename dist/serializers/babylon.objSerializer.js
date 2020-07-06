(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-serializers", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-serializers"] = factory(require("babylonjs"));
	else
		root["SERIALIZERS"] = factory(root["BABYLON"]);
})((typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this), function(__WEBPACK_EXTERNAL_MODULE_babylonjs_Maths_math_vector__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./legacy/legacy-objSerializer.ts");
/******/ })
/************************************************************************/
/******/ ({

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
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math.vector */ "babylonjs/Maths/math.vector");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__);


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
                var newMatrix = babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Matrix"].Translation(mesh[j].position.x, mesh[j].position.y, mesh[j].position.z);
                lastMatrix = babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Matrix"].Translation(-(mesh[j].position.x), -(mesh[j].position.y), -(mesh[j].position.z));
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
                babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Tools"].Warn("No geometry is present on the mesh");
                continue;
            }
            var trunkVerts = g.getVerticesData('position');
            var trunkNormals = g.getVerticesData('normal');
            var trunkUV = g.getVerticesData('uv');
            var trunkFaces = g.getIndices();
            var curV = 0;
            if (!trunkVerts || !trunkFaces) {
                babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Tools"].Warn("There are no position vertices or indices on the mesh!");
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

/***/ "babylonjs/Maths/math.vector":
/*!****************************************************************************************************!*\
  !*** external {"root":"BABYLON","commonjs":"babylonjs","commonjs2":"babylonjs","amd":"babylonjs"} ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_babylonjs_Maths_math_vector__;

/***/ })

/******/ });
});
//# sourceMappingURL=babylon.objSerializer.js.map