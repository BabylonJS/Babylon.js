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
/******/ 	return __webpack_require__(__webpack_require__.s = "./legacy/legacy-objFileLoader.ts");
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
/*! exports provided: MTLFileLoader, OBJFileLoader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _mtlFileLoader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./mtlFileLoader */ "./OBJ/mtlFileLoader.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MTLFileLoader", function() { return _mtlFileLoader__WEBPACK_IMPORTED_MODULE_0__["MTLFileLoader"]; });

/* harmony import */ var _objFileLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./objFileLoader */ "./OBJ/objFileLoader.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "OBJFileLoader", function() { return _objFileLoader__WEBPACK_IMPORTED_MODULE_1__["OBJFileLoader"]; });





/***/ }),

/***/ "./OBJ/mtlFileLoader.ts":
/*!******************************!*\
  !*** ./OBJ/mtlFileLoader.ts ***!
  \******************************/
/*! exports provided: MTLFileLoader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MTLFileLoader", function() { return MTLFileLoader; });
/* harmony import */ var babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math.color */ "babylonjs/Misc/observable");
/* harmony import */ var babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__);



/**
 * Class reading and parsing the MTL file bundled with the obj file.
 */
var MTLFileLoader = /** @class */ (function () {
    function MTLFileLoader() {
        /**
         * All material loaded from the mtl will be set here
         */
        this.materials = [];
    }
    /**
     * This function will read the mtl file and create each material described inside
     * This function could be improve by adding :
     * -some component missing (Ni, Tf...)
     * -including the specific options available
     *
     * @param scene defines the scene the material will be created in
     * @param data defines the mtl data to parse
     * @param rootUrl defines the rooturl to use in order to load relative dependencies
     * @param forAssetContainer defines if the material should be registered in the scene
     */
    MTLFileLoader.prototype.parseMTL = function (scene, data, rootUrl, forAssetContainer) {
        if (data instanceof ArrayBuffer) {
            return;
        }
        //Split the lines from the file
        var lines = data.split('\n');
        //Space char
        var delimiter_pattern = /\s+/;
        //Array with RGB colors
        var color;
        //New material
        var material = null;
        //Look at each line
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            // Blank line or comment
            if (line.length === 0 || line.charAt(0) === '#') {
                continue;
            }
            //Get the first parameter (keyword)
            var pos = line.indexOf(' ');
            var key = (pos >= 0) ? line.substring(0, pos) : line;
            key = key.toLowerCase();
            //Get the data following the key
            var value = (pos >= 0) ? line.substring(pos + 1).trim() : "";
            //This mtl keyword will create the new material
            if (key === "newmtl") {
                //Check if it is the first material.
                // Materials specifications are described after this keyword.
                if (material) {
                    //Add the previous material in the material array.
                    this.materials.push(material);
                }
                //Create a new material.
                // value is the name of the material read in the mtl file
                scene._blockEntityCollection = forAssetContainer;
                material = new babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["StandardMaterial"](value, scene);
                scene._blockEntityCollection = false;
            }
            else if (key === "kd" && material) {
                // Diffuse color (color under white light) using RGB values
                //value  = "r g b"
                color = value.split(delimiter_pattern, 3).map(parseFloat);
                //color = [r,g,b]
                //Set tghe color into the material
                material.diffuseColor = babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromArray(color);
            }
            else if (key === "ka" && material) {
                // Ambient color (color under shadow) using RGB values
                //value = "r g b"
                color = value.split(delimiter_pattern, 3).map(parseFloat);
                //color = [r,g,b]
                //Set tghe color into the material
                material.ambientColor = babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromArray(color);
            }
            else if (key === "ks" && material) {
                // Specular color (color when light is reflected from shiny surface) using RGB values
                //value = "r g b"
                color = value.split(delimiter_pattern, 3).map(parseFloat);
                //color = [r,g,b]
                //Set the color into the material
                material.specularColor = babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromArray(color);
            }
            else if (key === "ke" && material) {
                // Emissive color using RGB values
                color = value.split(delimiter_pattern, 3).map(parseFloat);
                material.emissiveColor = babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromArray(color);
            }
            else if (key === "ns" && material) {
                //value = "Integer"
                material.specularPower = parseFloat(value);
            }
            else if (key === "d" && material) {
                //d is dissolve for current material. It mean alpha for BABYLON
                material.alpha = parseFloat(value);
                //Texture
                //This part can be improved by adding the possible options of texture
            }
            else if (key === "map_ka" && material) {
                // ambient texture map with a loaded image
                //We must first get the folder of the image
                material.ambientTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
            }
            else if (key === "map_kd" && material) {
                // Diffuse texture map with a loaded image
                material.diffuseTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
            }
            else if (key === "map_ks" && material) {
                // Specular texture map with a loaded image
                //We must first get the folder of the image
                material.specularTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
            }
            else if (key === "map_ns") {
                //Specular
                //Specular highlight component
                //We must first get the folder of the image
                //
                //Not supported by BABYLON
                //
                //    continue;
            }
            else if (key === "map_bump" && material) {
                //The bump texture
                material.bumpTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
            }
            else if (key === "map_d" && material) {
                // The dissolve of the material
                material.opacityTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
                //Options for illumination
            }
            else if (key === "illum") {
                //Illumination
                if (value === "0") {
                    //That mean Kd == Kd
                }
                else if (value === "1") {
                    //Color on and Ambient on
                }
                else if (value === "2") {
                    //Highlight on
                }
                else if (value === "3") {
                    //Reflection on and Ray trace on
                }
                else if (value === "4") {
                    //Transparency: Glass on, Reflection: Ray trace on
                }
                else if (value === "5") {
                    //Reflection: Fresnel on and Ray trace on
                }
                else if (value === "6") {
                    //Transparency: Refraction on, Reflection: Fresnel off and Ray trace on
                }
                else if (value === "7") {
                    //Transparency: Refraction on, Reflection: Fresnel on and Ray trace on
                }
                else if (value === "8") {
                    //Reflection on and Ray trace off
                }
                else if (value === "9") {
                    //Transparency: Glass on, Reflection: Ray trace off
                }
                else if (value === "10") {
                    //Casts shadows onto invisible surfaces
                }
            }
            else {
                // console.log("Unhandled expression at line : " + i +'\n' + "with value : " + line);
            }
        }
        //At the end of the file, add the last material
        if (material) {
            this.materials.push(material);
        }
    };
    /**
     * Gets the texture for the material.
     *
     * If the material is imported from input file,
     * We sanitize the url to ensure it takes the textre from aside the material.
     *
     * @param rootUrl The root url to load from
     * @param value The value stored in the mtl
     * @return The Texture
     */
    MTLFileLoader._getTexture = function (rootUrl, value, scene) {
        if (!value) {
            return null;
        }
        var url = rootUrl;
        // Load from input file.
        if (rootUrl === "file:") {
            var lastDelimiter = value.lastIndexOf("\\");
            if (lastDelimiter === -1) {
                lastDelimiter = value.lastIndexOf("/");
            }
            if (lastDelimiter > -1) {
                url += value.substr(lastDelimiter + 1);
            }
            else {
                url += value;
            }
        }
        // Not from input file.
        else {
            url += value;
        }
        return new babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["Texture"](url, scene, false, MTLFileLoader.INVERT_TEXTURE_Y);
    };
    /**
     * Invert Y-Axis of referenced textures on load
     */
    MTLFileLoader.INVERT_TEXTURE_Y = true;
    return MTLFileLoader;
}());



/***/ }),

/***/ "./OBJ/objFileLoader.ts":
/*!******************************!*\
  !*** ./OBJ/objFileLoader.ts ***!
  \******************************/
/*! exports provided: OBJFileLoader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OBJFileLoader", function() { return OBJFileLoader; });
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math.vector */ "babylonjs/Misc/observable");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mtlFileLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./mtlFileLoader */ "./OBJ/mtlFileLoader.ts");









/**
 * OBJ file type loader.
 * This is a babylon scene loader plugin.
 */
var OBJFileLoader = /** @class */ (function () {
    /**
     * Creates loader for .OBJ files
     *
     * @param meshLoadOptions options for loading and parsing OBJ/MTL files.
     */
    function OBJFileLoader(meshLoadOptions) {
        /**
         * Defines the name of the plugin.
         */
        this.name = "obj";
        /**
         * Defines the extension the plugin is able to load.
         */
        this.extensions = ".obj";
        /** @hidden */
        this.obj = /^o/;
        /** @hidden */
        this.group = /^g/;
        /** @hidden */
        this.mtllib = /^mtllib /;
        /** @hidden */
        this.usemtl = /^usemtl /;
        /** @hidden */
        this.smooth = /^s /;
        /** @hidden */
        this.vertexPattern = /v( +[\d|\.|\+|\-|e|E]+){3,7}/;
        // vn float float float
        /** @hidden */
        this.normalPattern = /vn( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
        // vt float float
        /** @hidden */
        this.uvPattern = /vt( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
        // f vertex vertex vertex ...
        /** @hidden */
        this.facePattern1 = /f\s+(([\d]{1,}[\s]?){3,})+/;
        // f vertex/uvs vertex/uvs vertex/uvs ...
        /** @hidden */
        this.facePattern2 = /f\s+((([\d]{1,}\/[\d]{1,}[\s]?){3,})+)/;
        // f vertex/uvs/normal vertex/uvs/normal vertex/uvs/normal ...
        /** @hidden */
        this.facePattern3 = /f\s+((([\d]{1,}\/[\d]{1,}\/[\d]{1,}[\s]?){3,})+)/;
        // f vertex//normal vertex//normal vertex//normal ...
        /** @hidden */
        this.facePattern4 = /f\s+((([\d]{1,}\/\/[\d]{1,}[\s]?){3,})+)/;
        // f -vertex/-uvs/-normal -vertex/-uvs/-normal -vertex/-uvs/-normal ...
        /** @hidden */
        this.facePattern5 = /f\s+(((-[\d]{1,}\/-[\d]{1,}\/-[\d]{1,}[\s]?){3,})+)/;
        this._forAssetContainer = false;
        this._meshLoadOptions = meshLoadOptions || OBJFileLoader.currentMeshLoadOptions;
    }
    Object.defineProperty(OBJFileLoader, "INVERT_TEXTURE_Y", {
        /**
         * Invert Y-Axis of referenced textures on load
         */
        get: function () {
            return _mtlFileLoader__WEBPACK_IMPORTED_MODULE_1__["MTLFileLoader"].INVERT_TEXTURE_Y;
        },
        set: function (value) {
            _mtlFileLoader__WEBPACK_IMPORTED_MODULE_1__["MTLFileLoader"].INVERT_TEXTURE_Y = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OBJFileLoader, "currentMeshLoadOptions", {
        get: function () {
            return {
                ComputeNormals: OBJFileLoader.COMPUTE_NORMALS,
                ImportVertexColors: OBJFileLoader.IMPORT_VERTEX_COLORS,
                InvertY: OBJFileLoader.INVERT_Y,
                InvertTextureY: OBJFileLoader.INVERT_TEXTURE_Y,
                UVScaling: OBJFileLoader.UV_SCALING,
                MaterialLoadingFailsSilently: OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY,
                OptimizeWithUV: OBJFileLoader.OPTIMIZE_WITH_UV,
                SkipMaterials: OBJFileLoader.SKIP_MATERIALS
            };
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Calls synchronously the MTL file attached to this obj.
     * Load function or importMesh function don't enable to load 2 files in the same time asynchronously.
     * Without this function materials are not displayed in the first frame (but displayed after).
     * In consequence it is impossible to get material information in your HTML file
     *
     * @param url The URL of the MTL file
     * @param rootUrl
     * @param onSuccess Callback function to be called when the MTL file is loaded
     * @private
     */
    OBJFileLoader.prototype._loadMTL = function (url, rootUrl, onSuccess, onFailure) {
        //The complete path to the mtl file
        var pathOfFile = babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Tools"].BaseUrl + rootUrl + url;
        // Loads through the babylon tools to allow fileInput search.
        babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Tools"].LoadFile(pathOfFile, onSuccess, undefined, undefined, false, function (request, exception) {
            onFailure(pathOfFile, exception);
        });
    };
    /**
     * Instantiates a OBJ file loader plugin.
     * @returns the created plugin
     */
    OBJFileLoader.prototype.createPlugin = function () {
        return new OBJFileLoader(OBJFileLoader.currentMeshLoadOptions);
    };
    /**
     * If the data string can be loaded directly.
     *
     * @param data string containing the file data
     * @returns if the data can be loaded directly
     */
    OBJFileLoader.prototype.canDirectLoad = function (data) {
        return false;
    };
    /**
     * Imports one or more meshes from the loaded OBJ data and adds them to the scene
     * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
     * @param scene the scene the meshes should be added to
     * @param data the OBJ data to load
     * @param rootUrl root url to load from
     * @param onProgress event that fires when loading progress has occured
     * @param fileName Defines the name of the file to load
     * @returns a promise containg the loaded meshes, particles, skeletons and animations
     */
    OBJFileLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onProgress, fileName) {
        //get the meshes from OBJ file
        return this._parseSolid(meshesNames, scene, data, rootUrl).then(function (meshes) {
            return {
                meshes: meshes,
                particleSystems: [],
                skeletons: [],
                animationGroups: []
            };
        });
    };
    /**
     * Imports all objects from the loaded OBJ data and adds them to the scene
     * @param scene the scene the objects should be added to
     * @param data the OBJ data to load
     * @param rootUrl root url to load from
     * @param onProgress event that fires when loading progress has occured
     * @param fileName Defines the name of the file to load
     * @returns a promise which completes when objects have been loaded to the scene
     */
    OBJFileLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress, fileName) {
        //Get the 3D model
        return this.importMeshAsync(null, scene, data, rootUrl, onProgress).then(function () {
            // return void
        });
    };
    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param onProgress The callback when the load progresses
     * @param fileName Defines the name of the file to load
     * @returns The loaded asset container
     */
    OBJFileLoader.prototype.loadAssetContainerAsync = function (scene, data, rootUrl, onProgress, fileName) {
        var _this = this;
        this._forAssetContainer = true;
        return this.importMeshAsync(null, scene, data, rootUrl).then(function (result) {
            var container = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["AssetContainer"](scene);
            result.meshes.forEach(function (mesh) { return container.meshes.push(mesh); });
            result.meshes.forEach(function (mesh) {
                var material = mesh.material;
                if (material) {
                    // Materials
                    if (container.materials.indexOf(material) == -1) {
                        container.materials.push(material);
                        // Textures
                        var textures = material.getActiveTextures();
                        textures.forEach(function (t) {
                            if (container.textures.indexOf(t) == -1) {
                                container.textures.push(t);
                            }
                        });
                    }
                }
            });
            _this._forAssetContainer = false;
            return container;
        }).catch(function (ex) {
            _this._forAssetContainer = false;
            throw ex;
        });
    };
    /**
     * Read the OBJ file and create an Array of meshes.
     * Each mesh contains all information given by the OBJ and the MTL file.
     * i.e. vertices positions and indices, optional normals values, optional UV values, optional material
     *
     * @param meshesNames
     * @param scene Scene The scene where are displayed the data
     * @param data String The content of the obj file
     * @param rootUrl String The path to the folder
     * @returns Array<AbstractMesh>
     * @private
     */
    OBJFileLoader.prototype._parseSolid = function (meshesNames, scene, data, rootUrl) {
        var _this = this;
        var positions = []; //values for the positions of vertices
        var normals = []; //Values for the normals
        var uvs = []; //Values for the textures
        var colors = [];
        var meshesFromObj = []; //[mesh] Contains all the obj meshes
        var handledMesh; //The current mesh of meshes array
        var indicesForBabylon = []; //The list of indices for VertexData
        var wrappedPositionForBabylon = []; //The list of position in vectors
        var wrappedUvsForBabylon = []; //Array with all value of uvs to match with the indices
        var wrappedColorsForBabylon = []; // Array with all color values to match with the indices
        var wrappedNormalsForBabylon = []; //Array with all value of normals to match with the indices
        var tuplePosNorm = []; //Create a tuple with indice of Position, Normal, UV  [pos, norm, uvs]
        var curPositionInIndices = 0;
        var hasMeshes = false; //Meshes are defined in the file
        var unwrappedPositionsForBabylon = []; //Value of positionForBabylon w/o Vector3() [x,y,z]
        var unwrappedColorsForBabylon = []; // Value of colorForBabylon w/o Color4() [r,g,b,a]
        var unwrappedNormalsForBabylon = []; //Value of normalsForBabylon w/o Vector3()  [x,y,z]
        var unwrappedUVForBabylon = []; //Value of uvsForBabylon w/o Vector3()      [x,y,z]
        var triangles = []; //Indices from new triangles coming from polygons
        var materialNameFromObj = ""; //The name of the current material
        var fileToLoad = ""; //The name of the mtlFile to load
        var materialsFromMTLFile = new _mtlFileLoader__WEBPACK_IMPORTED_MODULE_1__["MTLFileLoader"]();
        var objMeshName = ""; //The name of the current obj mesh
        var increment = 1; //Id for meshes created by the multimaterial
        var isFirstMaterial = true;
        var grayColor = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Color4"](0.5, 0.5, 0.5, 1);
        /**
         * Search for obj in the given array.
         * This function is called to check if a couple of data already exists in an array.
         *
         * If found, returns the index of the founded tuple index. Returns -1 if not found
         * @param arr Array<{ normals: Array<number>, idx: Array<number> }>
         * @param obj Array<number>
         * @returns {boolean}
         */
        var isInArray = function (arr, obj) {
            if (!arr[obj[0]]) {
                arr[obj[0]] = { normals: [], idx: [] };
            }
            var idx = arr[obj[0]].normals.indexOf(obj[1]);
            return idx === -1 ? -1 : arr[obj[0]].idx[idx];
        };
        var isInArrayUV = function (arr, obj) {
            if (!arr[obj[0]]) {
                arr[obj[0]] = { normals: [], idx: [], uv: [] };
            }
            var idx = arr[obj[0]].normals.indexOf(obj[1]);
            if (idx != 1 && (obj[2] === arr[obj[0]].uv[idx])) {
                return arr[obj[0]].idx[idx];
            }
            return -1;
        };
        /**
         * This function set the data for each triangle.
         * Data are position, normals and uvs
         * If a tuple of (position, normal) is not set, add the data into the corresponding array
         * If the tuple already exist, add only their indice
         *
         * @param indicePositionFromObj Integer The index in positions array
         * @param indiceUvsFromObj Integer The index in uvs array
         * @param indiceNormalFromObj Integer The index in normals array
         * @param positionVectorFromOBJ Vector3 The value of position at index objIndice
         * @param textureVectorFromOBJ Vector3 The value of uvs
         * @param normalsVectorFromOBJ Vector3 The value of normals at index objNormale
         */
        var setData = function (indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj, positionVectorFromOBJ, textureVectorFromOBJ, normalsVectorFromOBJ, positionColorsFromOBJ) {
            //Check if this tuple already exists in the list of tuples
            var _index;
            if (_this._meshLoadOptions.OptimizeWithUV) {
                _index = isInArrayUV(tuplePosNorm, [
                    indicePositionFromObj,
                    indiceNormalFromObj,
                    indiceUvsFromObj
                ]);
            }
            else {
                _index = isInArray(tuplePosNorm, [
                    indicePositionFromObj,
                    indiceNormalFromObj
                ]);
            }
            //If it not exists
            if (_index === -1) {
                //Add an new indice.
                //The array of indices is only an array with his length equal to the number of triangles - 1.
                //We add vertices data in this order
                indicesForBabylon.push(wrappedPositionForBabylon.length);
                //Push the position of vertice for Babylon
                //Each element is a Vector3(x,y,z)
                wrappedPositionForBabylon.push(positionVectorFromOBJ);
                //Push the uvs for Babylon
                //Each element is a Vector3(u,v)
                wrappedUvsForBabylon.push(textureVectorFromOBJ);
                //Push the normals for Babylon
                //Each element is a Vector3(x,y,z)
                wrappedNormalsForBabylon.push(normalsVectorFromOBJ);
                if (positionColorsFromOBJ !== undefined) {
                    //Push the colors for Babylon
                    //Each element is a BABYLON.Color4(r,g,b,a)
                    wrappedColorsForBabylon.push(positionColorsFromOBJ);
                }
                //Add the tuple in the comparison list
                tuplePosNorm[indicePositionFromObj].normals.push(indiceNormalFromObj);
                tuplePosNorm[indicePositionFromObj].idx.push(curPositionInIndices++);
                if (_this._meshLoadOptions.OptimizeWithUV) {
                    tuplePosNorm[indicePositionFromObj].uv.push(indiceUvsFromObj);
                }
            }
            else {
                //The tuple already exists
                //Add the index of the already existing tuple
                //At this index we can get the value of position, normal, color and uvs of vertex
                indicesForBabylon.push(_index);
            }
        };
        /**
         * Transform Vector() and BABYLON.Color() objects into numbers in an array
         */
        var unwrapData = function () {
            //Every array has the same length
            for (var l = 0; l < wrappedPositionForBabylon.length; l++) {
                //Push the x, y, z values of each element in the unwrapped array
                unwrappedPositionsForBabylon.push(wrappedPositionForBabylon[l].x, wrappedPositionForBabylon[l].y, wrappedPositionForBabylon[l].z);
                unwrappedNormalsForBabylon.push(wrappedNormalsForBabylon[l].x, wrappedNormalsForBabylon[l].y, wrappedNormalsForBabylon[l].z);
                unwrappedUVForBabylon.push(wrappedUvsForBabylon[l].x, wrappedUvsForBabylon[l].y); //z is an optional value not supported by BABYLON
            }
            if (_this._meshLoadOptions.ImportVertexColors === true) {
                //Push the r, g, b, a values of each element in the unwrapped array
                unwrappedColorsForBabylon.push(wrappedColorsForBabylon[l].r, wrappedColorsForBabylon[l].g, wrappedColorsForBabylon[l].b, wrappedColorsForBabylon[l].a);
            }
            // Reset arrays for the next new meshes
            wrappedPositionForBabylon = [];
            wrappedNormalsForBabylon = [];
            wrappedUvsForBabylon = [];
            wrappedColorsForBabylon = [];
            tuplePosNorm = [];
            curPositionInIndices = 0;
        };
        /**
         * Create triangles from polygons
         * It is important to notice that a triangle is a polygon
         * We get 5 patterns of face defined in OBJ File :
         * facePattern1 = ["1","2","3","4","5","6"]
         * facePattern2 = ["1/1","2/2","3/3","4/4","5/5","6/6"]
         * facePattern3 = ["1/1/1","2/2/2","3/3/3","4/4/4","5/5/5","6/6/6"]
         * facePattern4 = ["1//1","2//2","3//3","4//4","5//5","6//6"]
         * facePattern5 = ["-1/-1/-1","-2/-2/-2","-3/-3/-3","-4/-4/-4","-5/-5/-5","-6/-6/-6"]
         * Each pattern is divided by the same method
         * @param face Array[String] The indices of elements
         * @param v Integer The variable to increment
         */
        var getTriangles = function (faces, v) {
            //Work for each element of the array
            for (var faceIndex = v; faceIndex < faces.length - 1; faceIndex++) {
                //Add on the triangle variable the indexes to obtain triangles
                triangles.push(faces[0], faces[faceIndex], faces[faceIndex + 1]);
            }
            //Result obtained after 2 iterations:
            //Pattern1 => triangle = ["1","2","3","1","3","4"];
            //Pattern2 => triangle = ["1/1","2/2","3/3","1/1","3/3","4/4"];
            //Pattern3 => triangle = ["1/1/1","2/2/2","3/3/3","1/1/1","3/3/3","4/4/4"];
            //Pattern4 => triangle = ["1//1","2//2","3//3","1//1","3//3","4//4"];
            //Pattern5 => triangle = ["-1/-1/-1","-2/-2/-2","-3/-3/-3","-1/-1/-1","-3/-3/-3","-4/-4/-4"];
        };
        /**
         * Create triangles and push the data for each polygon for the pattern 1
         * In this pattern we get vertice positions
         * @param face
         * @param v
         */
        var setDataForCurrentFaceWithPattern1 = function (face, v) {
            //Get the indices of triangles for each polygon
            getTriangles(face, v);
            //For each element in the triangles array.
            //This var could contains 1 to an infinity of triangles
            for (var k = 0; k < triangles.length; k++) {
                // Set position indice
                var indicePositionFromObj = parseInt(triangles[k]) - 1;
                setData(indicePositionFromObj, 0, 0, //In the pattern 1, normals and uvs are not defined
                positions[indicePositionFromObj], //Get the vectors data
                babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"].Zero(), babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Up(), //Create default vectors
                _this._meshLoadOptions.ImportVertexColors === true ? colors[indicePositionFromObj] : undefined);
            }
            //Reset variable for the next line
            triangles = [];
        };
        /**
         * Create triangles and push the data for each polygon for the pattern 2
         * In this pattern we get vertice positions and uvsu
         * @param face
         * @param v
         */
        var setDataForCurrentFaceWithPattern2 = function (face, v) {
            //Get the indices of triangles for each polygon
            getTriangles(face, v);
            for (var k = 0; k < triangles.length; k++) {
                //triangle[k] = "1/1"
                //Split the data for getting position and uv
                var point = triangles[k].split("/"); // ["1", "1"]
                //Set position indice
                var indicePositionFromObj = parseInt(point[0]) - 1;
                //Set uv indice
                var indiceUvsFromObj = parseInt(point[1]) - 1;
                setData(indicePositionFromObj, indiceUvsFromObj, 0, //Default value for normals
                positions[indicePositionFromObj], //Get the values for each element
                uvs[indiceUvsFromObj], babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Up(), //Default value for normals
                _this._meshLoadOptions.ImportVertexColors === true ? colors[indicePositionFromObj] : undefined);
            }
            //Reset variable for the next line
            triangles = [];
        };
        /**
         * Create triangles and push the data for each polygon for the pattern 3
         * In this pattern we get vertice positions, uvs and normals
         * @param face
         * @param v
         */
        var setDataForCurrentFaceWithPattern3 = function (face, v) {
            //Get the indices of triangles for each polygon
            getTriangles(face, v);
            for (var k = 0; k < triangles.length; k++) {
                //triangle[k] = "1/1/1"
                //Split the data for getting position, uv, and normals
                var point = triangles[k].split("/"); // ["1", "1", "1"]
                // Set position indice
                var indicePositionFromObj = parseInt(point[0]) - 1;
                // Set uv indice
                var indiceUvsFromObj = parseInt(point[1]) - 1;
                // Set normal indice
                var indiceNormalFromObj = parseInt(point[2]) - 1;
                setData(indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj, positions[indicePositionFromObj], uvs[indiceUvsFromObj], normals[indiceNormalFromObj] //Set the vector for each component
                );
            }
            //Reset variable for the next line
            triangles = [];
        };
        /**
         * Create triangles and push the data for each polygon for the pattern 4
         * In this pattern we get vertice positions and normals
         * @param face
         * @param v
         */
        var setDataForCurrentFaceWithPattern4 = function (face, v) {
            getTriangles(face, v);
            for (var k = 0; k < triangles.length; k++) {
                //triangle[k] = "1//1"
                //Split the data for getting position and normals
                var point = triangles[k].split("//"); // ["1", "1"]
                // We check indices, and normals
                var indicePositionFromObj = parseInt(point[0]) - 1;
                var indiceNormalFromObj = parseInt(point[1]) - 1;
                setData(indicePositionFromObj, 1, //Default value for uv
                indiceNormalFromObj, positions[indicePositionFromObj], //Get each vector of data
                babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"].Zero(), normals[indiceNormalFromObj], _this._meshLoadOptions.ImportVertexColors === true ? colors[indicePositionFromObj] : undefined);
            }
            //Reset variable for the next line
            triangles = [];
        };
        /**
         * Create triangles and push the data for each polygon for the pattern 3
         * In this pattern we get vertice positions, uvs and normals
         * @param face
         * @param v
         */
        var setDataForCurrentFaceWithPattern5 = function (face, v) {
            //Get the indices of triangles for each polygon
            getTriangles(face, v);
            for (var k = 0; k < triangles.length; k++) {
                //triangle[k] = "-1/-1/-1"
                //Split the data for getting position, uv, and normals
                var point = triangles[k].split("/"); // ["-1", "-1", "-1"]
                // Set position indice
                var indicePositionFromObj = positions.length + parseInt(point[0]);
                // Set uv indice
                var indiceUvsFromObj = uvs.length + parseInt(point[1]);
                // Set normal indice
                var indiceNormalFromObj = normals.length + parseInt(point[2]);
                setData(indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj, positions[indicePositionFromObj], uvs[indiceUvsFromObj], normals[indiceNormalFromObj], //Set the vector for each component
                _this._meshLoadOptions.ImportVertexColors === true ? colors[indicePositionFromObj] : undefined);
            }
            //Reset variable for the next line
            triangles = [];
        };
        var addPreviousObjMesh = function () {
            //Check if it is not the first mesh. Otherwise we don't have data.
            if (meshesFromObj.length > 0) {
                //Get the previous mesh for applying the data about the faces
                //=> in obj file, faces definition append after the name of the mesh
                handledMesh = meshesFromObj[meshesFromObj.length - 1];
                //Set the data into Array for the mesh
                unwrapData();
                // Reverse tab. Otherwise face are displayed in the wrong sens
                indicesForBabylon.reverse();
                //Set the information for the mesh
                //Slice the array to avoid rewriting because of the fact this is the same var which be rewrited
                handledMesh.indices = indicesForBabylon.slice();
                handledMesh.positions = unwrappedPositionsForBabylon.slice();
                handledMesh.normals = unwrappedNormalsForBabylon.slice();
                handledMesh.uvs = unwrappedUVForBabylon.slice();
                if (_this._meshLoadOptions.ImportVertexColors === true) {
                    handledMesh.colors = unwrappedColorsForBabylon.slice();
                }
                //Reset the array for the next mesh
                indicesForBabylon = [];
                unwrappedPositionsForBabylon = [];
                unwrappedColorsForBabylon = [];
                unwrappedNormalsForBabylon = [];
                unwrappedUVForBabylon = [];
            }
        };
        //Main function
        //Split the file into lines
        var lines = data.split('\n');
        //Look at each line
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim().replace(/\s\s/g, " ");
            var result;
            //Comment or newLine
            if (line.length === 0 || line.charAt(0) === '#') {
                continue;
                //Get information about one position possible for the vertices
            }
            else if (this.vertexPattern.test(line)) {
                result = line.match(/[^ ]+/g); // match will return non-null due to passing regex pattern
                // Value of result with line: "v 1.0 2.0 3.0"
                // ["v", "1.0", "2.0", "3.0"]
                // Create a Vector3 with the position x, y, z
                positions.push(new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector3"](parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])));
                if (this._meshLoadOptions.ImportVertexColors === true) {
                    if (result.length >= 7) {
                        // TODO: if these numbers are > 1 we can use Color4.FromInts(r,g,b,a)
                        colors.push(new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Color4"](parseFloat(result[4]), parseFloat(result[5]), parseFloat(result[6]), (result.length === 7 || result[7] === undefined) ? 1 : parseFloat(result[7])));
                    }
                    else {
                        // TODO: maybe push NULL and if all are NULL to skip (and remove grayColor var).
                        colors.push(grayColor);
                    }
                }
            }
            else if ((result = this.normalPattern.exec(line)) !== null) {
                //Create a Vector3 with the normals x, y, z
                //Value of result
                // ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
                //Add the Vector in the list of normals
                normals.push(new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector3"](parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])));
            }
            else if ((result = this.uvPattern.exec(line)) !== null) {
                //Create a Vector2 with the normals u, v
                //Value of result
                // ["vt 0.1 0.2 0.3", "0.1", "0.2"]
                //Add the Vector in the list of uvs
                uvs.push(new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](parseFloat(result[1]) * OBJFileLoader.UV_SCALING.x, parseFloat(result[2]) * OBJFileLoader.UV_SCALING.y));
                //Identify patterns of faces
                //Face could be defined in different type of pattern
            }
            else if ((result = this.facePattern3.exec(line)) !== null) {
                //Value of result:
                //["f 1/1/1 2/2/2 3/3/3", "1/1/1 2/2/2 3/3/3"...]
                //Set the data for this face
                setDataForCurrentFaceWithPattern3(result[1].trim().split(" "), // ["1/1/1", "2/2/2", "3/3/3"]
                1);
            }
            else if ((result = this.facePattern4.exec(line)) !== null) {
                //Value of result:
                //["f 1//1 2//2 3//3", "1//1 2//2 3//3"...]
                //Set the data for this face
                setDataForCurrentFaceWithPattern4(result[1].trim().split(" "), // ["1//1", "2//2", "3//3"]
                1);
            }
            else if ((result = this.facePattern5.exec(line)) !== null) {
                //Value of result:
                //["f -1/-1/-1 -2/-2/-2 -3/-3/-3", "-1/-1/-1 -2/-2/-2 -3/-3/-3"...]
                //Set the data for this face
                setDataForCurrentFaceWithPattern5(result[1].trim().split(" "), // ["-1/-1/-1", "-2/-2/-2", "-3/-3/-3"]
                1);
            }
            else if ((result = this.facePattern2.exec(line)) !== null) {
                //Value of result:
                //["f 1/1 2/2 3/3", "1/1 2/2 3/3"...]
                //Set the data for this face
                setDataForCurrentFaceWithPattern2(result[1].trim().split(" "), // ["1/1", "2/2", "3/3"]
                1);
            }
            else if ((result = this.facePattern1.exec(line)) !== null) {
                //Value of result
                //["f 1 2 3", "1 2 3"...]
                //Set the data for this face
                setDataForCurrentFaceWithPattern1(result[1].trim().split(" "), // ["1", "2", "3"]
                1);
                //Define a mesh or an object
                //Each time this keyword is analysed, create a new Object with all data for creating a babylonMesh
            }
            else if (this.group.test(line) || this.obj.test(line)) {
                //Create a new mesh corresponding to the name of the group.
                //Definition of the mesh
                var objMesh = {
                    name: line.substring(2).trim(),
                    indices: undefined,
                    positions: undefined,
                    normals: undefined,
                    uvs: undefined,
                    colors: undefined,
                    materialName: ""
                };
                addPreviousObjMesh();
                //Push the last mesh created with only the name
                meshesFromObj.push(objMesh);
                //Set this variable to indicate that now meshesFromObj has objects defined inside
                hasMeshes = true;
                isFirstMaterial = true;
                increment = 1;
                //Keyword for applying a material
            }
            else if (this.usemtl.test(line)) {
                //Get the name of the material
                materialNameFromObj = line.substring(7).trim();
                //If this new material is in the same mesh
                if (!isFirstMaterial || !hasMeshes) {
                    //Set the data for the previous mesh
                    addPreviousObjMesh();
                    //Create a new mesh
                    var objMesh = 
                    //Set the name of the current obj mesh
                    {
                        name: (objMeshName || "mesh") + "_mm" + increment.toString(),
                        indices: undefined,
                        positions: undefined,
                        normals: undefined,
                        uvs: undefined,
                        colors: undefined,
                        materialName: materialNameFromObj
                    };
                    increment++;
                    //If meshes are already defined
                    meshesFromObj.push(objMesh);
                    hasMeshes = true;
                }
                //Set the material name if the previous line define a mesh
                if (hasMeshes && isFirstMaterial) {
                    //Set the material name to the previous mesh (1 material per mesh)
                    meshesFromObj[meshesFromObj.length - 1].materialName = materialNameFromObj;
                    isFirstMaterial = false;
                }
                //Keyword for loading the mtl file
            }
            else if (this.mtllib.test(line)) {
                //Get the name of mtl file
                fileToLoad = line.substring(7).trim();
                //Apply smoothing
            }
            else if (this.smooth.test(line)) {
                // smooth shading => apply smoothing
                //Today I don't know it work with babylon and with obj.
                //With the obj file  an integer is set
            }
            else {
                //If there is another possibility
                console.log("Unhandled expression at line : " + line);
            }
        }
        //At the end of the file, add the last mesh into the meshesFromObj array
        if (hasMeshes) {
            //Set the data for the last mesh
            handledMesh = meshesFromObj[meshesFromObj.length - 1];
            //Reverse indices for displaying faces in the good sense
            indicesForBabylon.reverse();
            //Get the good array
            unwrapData();
            //Set array
            handledMesh.indices = indicesForBabylon;
            handledMesh.positions = unwrappedPositionsForBabylon;
            handledMesh.normals = unwrappedNormalsForBabylon;
            handledMesh.uvs = unwrappedUVForBabylon;
            if (this._meshLoadOptions.ImportVertexColors === true) {
                handledMesh.colors = unwrappedColorsForBabylon;
            }
        }
        //If any o or g keyword found, create a mesh with a random id
        if (!hasMeshes) {
            // reverse tab of indices
            indicesForBabylon.reverse();
            //Get positions normals uvs
            unwrapData();
            //Set data for one mesh
            meshesFromObj.push({
                name: babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Geometry"].RandomId(),
                indices: indicesForBabylon,
                positions: unwrappedPositionsForBabylon,
                colors: unwrappedColorsForBabylon,
                normals: unwrappedNormalsForBabylon,
                uvs: unwrappedUVForBabylon,
                materialName: materialNameFromObj
            });
        }
        //Create a Mesh list
        var babylonMeshesArray = []; //The mesh for babylon
        var materialToUse = new Array();
        //Set data for each mesh
        for (var j = 0; j < meshesFromObj.length; j++) {
            //check meshesNames (stlFileLoader)
            if (meshesNames && meshesFromObj[j].name) {
                if (meshesNames instanceof Array) {
                    if (meshesNames.indexOf(meshesFromObj[j].name) === -1) {
                        continue;
                    }
                }
                else {
                    if (meshesFromObj[j].name !== meshesNames) {
                        continue;
                    }
                }
            }
            //Get the current mesh
            //Set the data with VertexBuffer for each mesh
            handledMesh = meshesFromObj[j];
            //Create a Mesh with the name of the obj mesh
            scene._blockEntityCollection = this._forAssetContainer;
            var babylonMesh = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Mesh"](meshesFromObj[j].name, scene);
            scene._blockEntityCollection = false;
            //Push the name of the material to an array
            //This is indispensable for the importMesh function
            materialToUse.push(meshesFromObj[j].materialName);
            var vertexData = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["VertexData"](); //The container for the values
            //Set the data for the babylonMesh
            vertexData.uvs = handledMesh.uvs;
            vertexData.indices = handledMesh.indices;
            vertexData.positions = handledMesh.positions;
            if (this._meshLoadOptions.ComputeNormals === true) {
                var normals_1 = new Array();
                babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["VertexData"].ComputeNormals(handledMesh.positions, handledMesh.indices, normals_1);
                vertexData.normals = normals_1;
            }
            else {
                vertexData.normals = handledMesh.normals;
            }
            if (this._meshLoadOptions.ImportVertexColors === true) {
                vertexData.colors = handledMesh.colors;
            }
            //Set the data from the VertexBuffer to the current Mesh
            vertexData.applyToMesh(babylonMesh);
            if (this._meshLoadOptions.InvertY) {
                babylonMesh.scaling.y *= -1;
            }
            //Push the mesh into an array
            babylonMeshesArray.push(babylonMesh);
        }
        var mtlPromises = [];
        //load the materials
        //Check if we have a file to load
        if (fileToLoad !== "" && this._meshLoadOptions.SkipMaterials === false) {
            //Load the file synchronously
            mtlPromises.push(new Promise(function (resolve, reject) {
                _this._loadMTL(fileToLoad, rootUrl, function (dataLoaded) {
                    try {
                        //Create materials thanks MTLLoader function
                        materialsFromMTLFile.parseMTL(scene, dataLoaded, rootUrl, _this._forAssetContainer);
                        //Look at each material loaded in the mtl file
                        for (var n = 0; n < materialsFromMTLFile.materials.length; n++) {
                            //Three variables to get all meshes with the same material
                            var startIndex = 0;
                            var _indices = [];
                            var _index;
                            //The material from MTL file is used in the meshes loaded
                            //Push the indice in an array
                            //Check if the material is not used for another mesh
                            while ((_index = materialToUse.indexOf(materialsFromMTLFile.materials[n].name, startIndex)) > -1) {
                                _indices.push(_index);
                                startIndex = _index + 1;
                            }
                            //If the material is not used dispose it
                            if (_index === -1 && _indices.length === 0) {
                                //If the material is not needed, remove it
                                materialsFromMTLFile.materials[n].dispose();
                            }
                            else {
                                for (var o = 0; o < _indices.length; o++) {
                                    //Apply the material to the Mesh for each mesh with the material
                                    babylonMeshesArray[_indices[o]].material = materialsFromMTLFile.materials[n];
                                }
                            }
                        }
                        resolve();
                    }
                    catch (e) {
                        babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Tools"].Warn("Error processing MTL file: '" + fileToLoad + "'");
                        if (_this._meshLoadOptions.MaterialLoadingFailsSilently) {
                            resolve();
                        }
                        else {
                            reject(e);
                        }
                    }
                }, function (pathOfFile, exception) {
                    babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Tools"].Warn("Error downloading MTL file: '" + fileToLoad + "'");
                    if (_this._meshLoadOptions.MaterialLoadingFailsSilently) {
                        resolve();
                    }
                    else {
                        reject(exception);
                    }
                });
            }));
        }
        //Return an array with all Mesh
        return Promise.all(mtlPromises).then(function () {
            return babylonMeshesArray;
        });
    };
    /**
     * Defines if UVs are optimized by default during load.
     */
    OBJFileLoader.OPTIMIZE_WITH_UV = true;
    /**
     * Invert model on y-axis (does a model scaling inversion)
     */
    OBJFileLoader.INVERT_Y = false;
    /**
     * Include in meshes the vertex colors available in some OBJ files.  This is not part of OBJ standard.
     */
    OBJFileLoader.IMPORT_VERTEX_COLORS = false;
    /**
     * Compute the normals for the model, even if normals are present in the file.
     */
    OBJFileLoader.COMPUTE_NORMALS = false;
    /**
     * Defines custom scaling of UV coordinates of loaded meshes.
     */
    OBJFileLoader.UV_SCALING = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector2"](1, 1);
    /**
     * Skip loading the materials even if defined in the OBJ file (materials are ignored).
     */
    OBJFileLoader.SKIP_MATERIALS = false;
    /**
     * When a material fails to load OBJ loader will silently fail and onSuccess() callback will be triggered.
     *
     * Defaults to true for backwards compatibility.
     */
    OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY = true;
    return OBJFileLoader;
}());

if (babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["SceneLoader"]) {
    //Add this loader into the register plugin
    babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["SceneLoader"].RegisterPlugin(new OBJFileLoader());
}


/***/ }),

/***/ "./legacy/legacy-objFileLoader.ts":
/*!****************************************!*\
  !*** ./legacy/legacy-objFileLoader.ts ***!
  \****************************************/
/*! exports provided: MTLFileLoader, OBJFileLoader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _OBJ__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../OBJ */ "./OBJ/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MTLFileLoader", function() { return _OBJ__WEBPACK_IMPORTED_MODULE_0__["MTLFileLoader"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "OBJFileLoader", function() { return _OBJ__WEBPACK_IMPORTED_MODULE_0__["OBJFileLoader"]; });


/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in _OBJ__WEBPACK_IMPORTED_MODULE_0__) {
        globalObject.BABYLON[key] = _OBJ__WEBPACK_IMPORTED_MODULE_0__[key];
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
//# sourceMappingURL=babylon.objFileLoader.js.map