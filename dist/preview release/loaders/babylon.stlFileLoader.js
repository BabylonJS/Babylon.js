(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-loaders", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-loaders"] = factory(require("babylonjs"));
	else
		root["LOADERS"] = factory(root["BABYLON"]);
})((typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this), function(__WEBPACK_EXTERNAL_MODULE_babylonjs_Misc_observable__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./legacy/legacy-stlFileLoader.ts");
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

/***/ "./STL/index.ts":
/*!**********************!*\
  !*** ./STL/index.ts ***!
  \**********************/
/*! exports provided: STLFileLoader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _stlFileLoader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./stlFileLoader */ "./STL/stlFileLoader.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "STLFileLoader", function() { return _stlFileLoader__WEBPACK_IMPORTED_MODULE_0__["STLFileLoader"]; });




/***/ }),

/***/ "./STL/stlFileLoader.ts":
/*!******************************!*\
  !*** ./STL/stlFileLoader.ts ***!
  \******************************/
/*! exports provided: STLFileLoader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "STLFileLoader", function() { return STLFileLoader; });
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Misc/tools */ "babylonjs/Misc/observable");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__);





/**
 * STL file type loader.
 * This is a babylon scene loader plugin.
 */
var STLFileLoader = /** @class */ (function () {
    function STLFileLoader() {
        /** @hidden */
        this.solidPattern = /solid (\S*)([\S\s]*)endsolid[ ]*(\S*)/g;
        /** @hidden */
        this.facetsPattern = /facet([\s\S]*?)endfacet/g;
        /** @hidden */
        this.normalPattern = /normal[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;
        /** @hidden */
        this.vertexPattern = /vertex[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;
        /**
         * Defines the name of the plugin.
         */
        this.name = "stl";
        /**
         * Defines the extensions the stl loader is able to load.
         * force data to come in as an ArrayBuffer
         * we'll convert to string if it looks like it's an ASCII .stl
         */
        this.extensions = {
            ".stl": { isBinary: true },
        };
    }
    /**
     * Import meshes into a scene.
     * @param meshesNames An array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
     * @param scene The scene to import into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param meshes The meshes array to import into
     * @param particleSystems The particle systems array to import into
     * @param skeletons The skeletons array to import into
     * @param onError The callback when import fails
     * @returns True if successful or false otherwise
     */
    STLFileLoader.prototype.importMesh = function (meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons) {
        var matches;
        if (typeof data !== "string") {
            if (this._isBinary(data)) {
                // binary .stl
                var babylonMesh = new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["Mesh"]("stlmesh", scene);
                this._parseBinary(babylonMesh, data);
                if (meshes) {
                    meshes.push(babylonMesh);
                }
                return true;
            }
            // ASCII .stl
            // convert to string
            var array_buffer = new Uint8Array(data);
            var str = '';
            for (var i = 0; i < data.byteLength; i++) {
                str += String.fromCharCode(array_buffer[i]); // implicitly assumes little-endian
            }
            data = str;
        }
        //if arrived here, data is a string, containing the STLA data.
        while (matches = this.solidPattern.exec(data)) {
            var meshName = matches[1];
            var meshNameFromEnd = matches[3];
            if (meshName != meshNameFromEnd) {
                babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["Tools"].Error("Error in STL, solid name != endsolid name");
                return false;
            }
            // check meshesNames
            if (meshesNames && meshName) {
                if (meshesNames instanceof Array) {
                    if (!meshesNames.indexOf(meshName)) {
                        continue;
                    }
                }
                else {
                    if (meshName !== meshesNames) {
                        continue;
                    }
                }
            }
            // stl mesh name can be empty as well
            meshName = meshName || "stlmesh";
            var babylonMesh = new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["Mesh"](meshName, scene);
            this._parseASCII(babylonMesh, matches[2]);
            if (meshes) {
                meshes.push(babylonMesh);
            }
        }
        return true;
    };
    /**
     * Load into a scene.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param onError The callback when import fails
     * @returns true if successful or false otherwise
     */
    STLFileLoader.prototype.load = function (scene, data, rootUrl) {
        var result = this.importMesh(null, scene, data, rootUrl, null, null, null);
        return result;
    };
    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param onError The callback when import fails
     * @returns The loaded asset container
     */
    STLFileLoader.prototype.loadAssetContainer = function (scene, data, rootUrl, onError) {
        var container = new babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["AssetContainer"](scene);
        scene._blockEntityCollection = true;
        this.importMesh(null, scene, data, rootUrl, container.meshes, null, null);
        scene._blockEntityCollection = false;
        return container;
    };
    STLFileLoader.prototype._isBinary = function (data) {
        // check if file size is correct for binary stl
        var faceSize, nFaces, reader;
        reader = new DataView(data);
        faceSize = (32 / 8 * 3) + ((32 / 8 * 3) * 3) + (16 / 8);
        nFaces = reader.getUint32(80, true);
        if (80 + (32 / 8) + (nFaces * faceSize) === reader.byteLength) {
            return true;
        }
        // check characters higher than ASCII to confirm binary
        var fileLength = reader.byteLength;
        for (var index = 0; index < fileLength; index++) {
            if (reader.getUint8(index) > 127) {
                return true;
            }
        }
        return false;
    };
    STLFileLoader.prototype._parseBinary = function (mesh, data) {
        var reader = new DataView(data);
        var faces = reader.getUint32(80, true);
        var dataOffset = 84;
        var faceLength = 12 * 4 + 2;
        var offset = 0;
        var positions = new Float32Array(faces * 3 * 3);
        var normals = new Float32Array(faces * 3 * 3);
        var indices = new Uint32Array(faces * 3);
        var indicesCount = 0;
        for (var face = 0; face < faces; face++) {
            var start = dataOffset + face * faceLength;
            var normalX = reader.getFloat32(start, true);
            var normalY = reader.getFloat32(start + 4, true);
            var normalZ = reader.getFloat32(start + 8, true);
            for (var i = 1; i <= 3; i++) {
                var vertexstart = start + i * 12;
                // ordering is intentional to match ascii import
                positions[offset] = reader.getFloat32(vertexstart, true);
                positions[offset + 2] = reader.getFloat32(vertexstart + 4, true);
                positions[offset + 1] = reader.getFloat32(vertexstart + 8, true);
                normals[offset] = normalX;
                normals[offset + 2] = normalY;
                normals[offset + 1] = normalZ;
                offset += 3;
            }
            indices[indicesCount] = indicesCount++;
            indices[indicesCount] = indicesCount++;
            indices[indicesCount] = indicesCount++;
        }
        mesh.setVerticesData(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].PositionKind, positions);
        mesh.setVerticesData(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].NormalKind, normals);
        mesh.setIndices(indices);
        mesh.computeWorldMatrix(true);
    };
    STLFileLoader.prototype._parseASCII = function (mesh, solidData) {
        var positions = [];
        var normals = [];
        var indices = [];
        var indicesCount = 0;
        //load facets, ignoring loop as the standard doesn't define it can contain more than vertices
        var matches;
        while (matches = this.facetsPattern.exec(solidData)) {
            var facet = matches[1];
            //one normal per face
            var normalMatches = this.normalPattern.exec(facet);
            this.normalPattern.lastIndex = 0;
            if (!normalMatches) {
                continue;
            }
            var normal = [Number(normalMatches[1]), Number(normalMatches[5]), Number(normalMatches[3])];
            var vertexMatch;
            while (vertexMatch = this.vertexPattern.exec(facet)) {
                positions.push(Number(vertexMatch[1]), Number(vertexMatch[5]), Number(vertexMatch[3]));
                normals.push(normal[0], normal[1], normal[2]);
            }
            indices.push(indicesCount++, indicesCount++, indicesCount++);
            this.vertexPattern.lastIndex = 0;
        }
        this.facetsPattern.lastIndex = 0;
        mesh.setVerticesData(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].PositionKind, positions);
        mesh.setVerticesData(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].NormalKind, normals);
        mesh.setIndices(indices);
        mesh.computeWorldMatrix(true);
    };
    return STLFileLoader;
}());

if (babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["SceneLoader"]) {
    babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["SceneLoader"].RegisterPlugin(new STLFileLoader());
}


/***/ }),

/***/ "./legacy/legacy-stlFileLoader.ts":
/*!****************************************!*\
  !*** ./legacy/legacy-stlFileLoader.ts ***!
  \****************************************/
/*! exports provided: STLFileLoader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _STL__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../STL */ "./STL/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "STLFileLoader", function() { return _STL__WEBPACK_IMPORTED_MODULE_0__["STLFileLoader"]; });


/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in _STL__WEBPACK_IMPORTED_MODULE_0__) {
        globalObject.BABYLON[key] = _STL__WEBPACK_IMPORTED_MODULE_0__[key];
    }
}


/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "babylonjs/Misc/observable":
/*!****************************************************************************************************!*\
  !*** external {"root":"BABYLON","commonjs":"babylonjs","commonjs2":"babylonjs","amd":"babylonjs"} ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_babylonjs_Misc_observable__;

/***/ })

/******/ });
});
//# sourceMappingURL=babylon.stlFileLoader.js.map