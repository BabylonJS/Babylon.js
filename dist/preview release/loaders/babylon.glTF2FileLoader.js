(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-loaders", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-loaders"] = factory(require("babylonjs"));
	else
		root["LOADERS"] = factory(root["BABYLON"]);
})((typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this), function(__WEBPACK_EXTERNAL_MODULE_babylonjs_Misc_tools__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./legacy/legacy-glTF2FileLoader.ts");
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

/***/ "./glTF/2.0/Extensions/EXT_lights_image_based.ts":
/*!*******************************************************!*\
  !*** ./glTF/2.0/Extensions/EXT_lights_image_based.ts ***!
  \*******************************************************/
/*! exports provided: EXT_lights_image_based */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EXT_lights_image_based", function() { return EXT_lights_image_based; });
/* harmony import */ var babylonjs_Maths_math_scalar__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math.scalar */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Maths_math_scalar__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_scalar__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");





var NAME = "EXT_lights_image_based";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Vendor/EXT_lights_image_based/README.md)
 */
var EXT_lights_image_based = /** @class */ (function () {
    /** @hidden */
    function EXT_lights_image_based(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    EXT_lights_image_based.prototype.dispose = function () {
        delete this._loader;
        delete this._lights;
    };
    /** @hidden */
    EXT_lights_image_based.prototype.onLoading = function () {
        var extensions = this._loader.gltf.extensions;
        if (extensions && extensions[this.name]) {
            var extension = extensions[this.name];
            this._lights = extension.lights;
        }
    };
    /** @hidden */
    EXT_lights_image_based.prototype.loadSceneAsync = function (context, scene) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, scene, this.name, function (extensionContext, extension) {
            var promises = new Array();
            promises.push(_this._loader.loadSceneAsync(context, scene));
            _this._loader.logOpen("" + extensionContext);
            var light = _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Get(extensionContext + "/light", _this._lights, extension.light);
            promises.push(_this._loadLightAsync("/extensions/" + _this.name + "/lights/" + extension.light, light).then(function (texture) {
                _this._loader.babylonScene.environmentTexture = texture;
            }));
            _this._loader.logClose();
            return Promise.all(promises).then(function () { });
        });
    };
    EXT_lights_image_based.prototype._loadLightAsync = function (context, light) {
        var _this = this;
        if (!light._loaded) {
            var promises = new Array();
            this._loader.logOpen("" + context);
            var imageData_1 = new Array(light.specularImages.length);
            var _loop_1 = function (mipmap) {
                var faces = light.specularImages[mipmap];
                imageData_1[mipmap] = new Array(faces.length);
                var _loop_2 = function (face) {
                    var specularImageContext = context + "/specularImages/" + mipmap + "/" + face;
                    this_1._loader.logOpen("" + specularImageContext);
                    var index = faces[face];
                    var image = _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Get(specularImageContext, this_1._loader.gltf.images, index);
                    promises.push(this_1._loader.loadImageAsync("/images/" + index, image).then(function (data) {
                        imageData_1[mipmap][face] = data;
                    }));
                    this_1._loader.logClose();
                };
                for (var face = 0; face < faces.length; face++) {
                    _loop_2(face);
                }
            };
            var this_1 = this;
            for (var mipmap = 0; mipmap < light.specularImages.length; mipmap++) {
                _loop_1(mipmap);
            }
            this._loader.logClose();
            light._loaded = Promise.all(promises).then(function () {
                var babylonTexture = new babylonjs_Maths_math_scalar__WEBPACK_IMPORTED_MODULE_0__["RawCubeTexture"](_this._loader.babylonScene, null, light.specularImageSize);
                babylonTexture.name = light.name || "environment";
                light._babylonTexture = babylonTexture;
                if (light.intensity != undefined) {
                    babylonTexture.level = light.intensity;
                }
                if (light.rotation) {
                    var rotation = babylonjs_Maths_math_scalar__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray(light.rotation);
                    // Invert the rotation so that positive rotation is counter-clockwise.
                    if (!_this._loader.babylonScene.useRightHandedSystem) {
                        rotation = babylonjs_Maths_math_scalar__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].Inverse(rotation);
                    }
                    babylonjs_Maths_math_scalar__WEBPACK_IMPORTED_MODULE_0__["Matrix"].FromQuaternionToRef(rotation, babylonTexture.getReflectionTextureMatrix());
                }
                var sphericalHarmonics = babylonjs_Maths_math_scalar__WEBPACK_IMPORTED_MODULE_0__["SphericalHarmonics"].FromArray(light.irradianceCoefficients);
                sphericalHarmonics.scaleInPlace(light.intensity);
                sphericalHarmonics.convertIrradianceToLambertianRadiance();
                var sphericalPolynomial = babylonjs_Maths_math_scalar__WEBPACK_IMPORTED_MODULE_0__["SphericalPolynomial"].FromHarmonics(sphericalHarmonics);
                // Compute the lod generation scale to fit exactly to the number of levels available.
                var lodGenerationScale = (imageData_1.length - 1) / babylonjs_Maths_math_scalar__WEBPACK_IMPORTED_MODULE_0__["Scalar"].Log2(light.specularImageSize);
                return babylonTexture.updateRGBDAsync(imageData_1, sphericalPolynomial, lodGenerationScale);
            });
        }
        return light._loaded.then(function () {
            return light._babylonTexture;
        });
    };
    return EXT_lights_image_based;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new EXT_lights_image_based(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/EXT_mesh_gpu_instancing.ts":
/*!********************************************************!*\
  !*** ./glTF/2.0/Extensions/EXT_mesh_gpu_instancing.ts ***!
  \********************************************************/
/*! exports provided: EXT_mesh_gpu_instancing */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EXT_mesh_gpu_instancing", function() { return EXT_mesh_gpu_instancing; });
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math.vector */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");



var NAME = "EXT_mesh_gpu_instancing";
/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1691)
 * [Playground Sample](https://playground.babylonjs.com/#QFIGLW#9)
 * !!! Experimental Extension Subject to Changes !!!
 */
var EXT_mesh_gpu_instancing = /** @class */ (function () {
    /** @hidden */
    function EXT_mesh_gpu_instancing(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    EXT_mesh_gpu_instancing.prototype.dispose = function () {
        delete this._loader;
    };
    /** @hidden */
    EXT_mesh_gpu_instancing.prototype.loadNodeAsync = function (context, node, assign) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, node, this.name, function (extensionContext, extension) {
            _this._loader._disableInstancedMesh++;
            var promise = _this._loader.loadNodeAsync("/nodes/" + node.index, node, assign);
            _this._loader._disableInstancedMesh--;
            if (!node._primitiveBabylonMeshes) {
                return promise;
            }
            var promises = new Array();
            var instanceCount = 0;
            var loadAttribute = function (attribute) {
                if (extension.attributes[attribute] == undefined) {
                    promises.push(Promise.resolve(null));
                    return;
                }
                var accessor = _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Get(extensionContext + "/attributes/" + attribute, _this._loader.gltf.accessors, extension.attributes[attribute]);
                promises.push(_this._loader._loadFloatAccessorAsync("/accessors/" + accessor.bufferView, accessor));
                if (instanceCount === 0) {
                    instanceCount = accessor.count;
                }
                else if (instanceCount !== accessor.count) {
                    throw new Error(extensionContext + "/attributes: Instance buffer accessors do not have the same count.");
                }
            };
            loadAttribute("TRANSLATION");
            loadAttribute("ROTATION");
            loadAttribute("SCALE");
            return promise.then(function (babylonTransformNode) {
                return Promise.all(promises).then(function (_a) {
                    var translationBuffer = _a[0], rotationBuffer = _a[1], scaleBuffer = _a[2];
                    var matrices = new Float32Array(instanceCount * 16);
                    babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Vector3[0].copyFromFloats(0, 0, 0); // translation
                    babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Quaternion[0].copyFromFloats(0, 0, 0, 1); // rotation
                    babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Vector3[1].copyFromFloats(1, 1, 1); // scale
                    for (var i = 0; i < instanceCount; ++i) {
                        translationBuffer && babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromArrayToRef(translationBuffer, i * 3, babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Vector3[0]);
                        rotationBuffer && babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArrayToRef(rotationBuffer, i * 4, babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Quaternion[0]);
                        scaleBuffer && babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromArrayToRef(scaleBuffer, i * 3, babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Vector3[1]);
                        babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Matrix"].ComposeToRef(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Vector3[1], babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Quaternion[0], babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Vector3[0], babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Matrix[0]);
                        babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Matrix[0].copyToArray(matrices, i * 16);
                    }
                    for (var _i = 0, _b = node._primitiveBabylonMeshes; _i < _b.length; _i++) {
                        var babylonMesh = _b[_i];
                        babylonMesh.thinInstanceSetBuffer("matrix", matrices, 16, true);
                    }
                    return babylonTransformNode;
                });
            });
        });
    };
    return EXT_mesh_gpu_instancing;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new EXT_mesh_gpu_instancing(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/ExtrasAsMetadata.ts":
/*!*************************************************!*\
  !*** ./glTF/2.0/Extensions/ExtrasAsMetadata.ts ***!
  \*************************************************/
/*! exports provided: ExtrasAsMetadata */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ExtrasAsMetadata", function() { return ExtrasAsMetadata; });
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");

var NAME = "ExtrasAsMetadata";
/**
 * Store glTF extras (if present) in BJS objects' metadata
 */
var ExtrasAsMetadata = /** @class */ (function () {
    /** @hidden */
    function ExtrasAsMetadata(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines whether this extension is enabled.
         */
        this.enabled = true;
        this._loader = loader;
    }
    ExtrasAsMetadata.prototype._assignExtras = function (babylonObject, gltfProp) {
        if (gltfProp.extras && Object.keys(gltfProp.extras).length > 0) {
            var metadata = (babylonObject.metadata = babylonObject.metadata || {});
            var gltf = (metadata.gltf = metadata.gltf || {});
            gltf.extras = gltfProp.extras;
        }
    };
    /** @hidden */
    ExtrasAsMetadata.prototype.dispose = function () {
        delete this._loader;
    };
    /** @hidden */
    ExtrasAsMetadata.prototype.loadNodeAsync = function (context, node, assign) {
        var _this = this;
        return this._loader.loadNodeAsync(context, node, function (babylonTransformNode) {
            _this._assignExtras(babylonTransformNode, node);
            assign(babylonTransformNode);
        });
    };
    /** @hidden */
    ExtrasAsMetadata.prototype.loadCameraAsync = function (context, camera, assign) {
        var _this = this;
        return this._loader.loadCameraAsync(context, camera, function (babylonCamera) {
            _this._assignExtras(babylonCamera, camera);
            assign(babylonCamera);
        });
    };
    /** @hidden */
    ExtrasAsMetadata.prototype.createMaterial = function (context, material, babylonDrawMode) {
        var babylonMaterial = this._loader.createMaterial(context, material, babylonDrawMode);
        this._assignExtras(babylonMaterial, material);
        return babylonMaterial;
    };
    return ExtrasAsMetadata;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new ExtrasAsMetadata(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_draco_mesh_compression.ts":
/*!***********************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_draco_mesh_compression.ts ***!
  \***********************************************************/
/*! exports provided: KHR_draco_mesh_compression */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_draco_mesh_compression", function() { return KHR_draco_mesh_compression; });
/* harmony import */ var babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Meshes/Compression/dracoCompression */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");




var NAME = "KHR_draco_mesh_compression";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression)
 */
var KHR_draco_mesh_compression = /** @class */ (function () {
    /** @hidden */
    function KHR_draco_mesh_compression(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this._loader = loader;
        this.enabled = babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__["DracoCompression"].DecoderAvailable && this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_draco_mesh_compression.prototype.dispose = function () {
        delete this.dracoCompression;
        delete this._loader;
    };
    /** @hidden */
    KHR_draco_mesh_compression.prototype._loadVertexDataAsync = function (context, primitive, babylonMesh) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, primitive, this.name, function (extensionContext, extension) {
            if (primitive.mode != undefined) {
                if (primitive.mode !== 5 /* TRIANGLE_STRIP */ &&
                    primitive.mode !== 4 /* TRIANGLES */) {
                    throw new Error(context + ": Unsupported mode " + primitive.mode);
                }
                // TODO: handle triangle strips
                if (primitive.mode === 5 /* TRIANGLE_STRIP */) {
                    throw new Error(context + ": Mode " + primitive.mode + " is not currently supported");
                }
            }
            var attributes = {};
            var loadAttribute = function (name, kind) {
                var uniqueId = extension.attributes[name];
                if (uniqueId == undefined) {
                    return;
                }
                babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                    babylonMesh._delayInfo.push(kind);
                }
                attributes[kind] = uniqueId;
            };
            loadAttribute("POSITION", babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].PositionKind);
            loadAttribute("NORMAL", babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].NormalKind);
            loadAttribute("TANGENT", babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].TangentKind);
            loadAttribute("TEXCOORD_0", babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].UVKind);
            loadAttribute("TEXCOORD_1", babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].UV2Kind);
            loadAttribute("JOINTS_0", babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].MatricesIndicesKind);
            loadAttribute("WEIGHTS_0", babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].MatricesWeightsKind);
            loadAttribute("COLOR_0", babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].ColorKind);
            var bufferView = _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Get(extensionContext, _this._loader.gltf.bufferViews, extension.bufferView);
            if (!bufferView._dracoBabylonGeometry) {
                bufferView._dracoBabylonGeometry = _this._loader.loadBufferViewAsync("/bufferViews/" + bufferView.index, bufferView).then(function (data) {
                    var dracoCompression = _this.dracoCompression || babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__["DracoCompression"].Default;
                    return dracoCompression.decodeMeshAsync(data, attributes).then(function (babylonVertexData) {
                        var babylonGeometry = new babylonjs_Meshes_Compression_dracoCompression__WEBPACK_IMPORTED_MODULE_0__["Geometry"](babylonMesh.name, _this._loader.babylonScene);
                        babylonVertexData.applyToGeometry(babylonGeometry);
                        return babylonGeometry;
                    }).catch(function (error) {
                        throw new Error(context + ": " + error.message);
                    });
                });
            }
            return bufferView._dracoBabylonGeometry;
        });
    };
    return KHR_draco_mesh_compression;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_draco_mesh_compression(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_lights_punctual.ts":
/*!****************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_lights_punctual.ts ***!
  \****************************************************/
/*! exports provided: KHR_lights */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_lights", function() { return KHR_lights; });
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math.vector */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");







var NAME = "KHR_lights_punctual";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual)
 */
var KHR_lights = /** @class */ (function () {
    /** @hidden */
    function KHR_lights(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_lights.prototype.dispose = function () {
        delete this._loader;
        delete this._lights;
    };
    /** @hidden */
    KHR_lights.prototype.onLoading = function () {
        var extensions = this._loader.gltf.extensions;
        if (extensions && extensions[this.name]) {
            var extension = extensions[this.name];
            this._lights = extension.lights;
        }
    };
    /** @hidden */
    KHR_lights.prototype.loadNodeAsync = function (context, node, assign) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, node, this.name, function (extensionContext, extension) {
            return _this._loader.loadNodeAsync(context, node, function (babylonMesh) {
                var babylonLight;
                var light = _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Get(extensionContext, _this._lights, extension.light);
                var name = light.name || babylonMesh.name;
                _this._loader.babylonScene._blockEntityCollection = _this._loader._forAssetContainer;
                switch (light.type) {
                    case "directional" /* DIRECTIONAL */: {
                        babylonLight = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["DirectionalLight"](name, babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Backward(), _this._loader.babylonScene);
                        break;
                    }
                    case "point" /* POINT */: {
                        babylonLight = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["PointLight"](name, babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero(), _this._loader.babylonScene);
                        break;
                    }
                    case "spot" /* SPOT */: {
                        var babylonSpotLight = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["SpotLight"](name, babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero(), babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Backward(), 0, 1, _this._loader.babylonScene);
                        babylonSpotLight.angle = ((light.spot && light.spot.outerConeAngle) || Math.PI / 4) * 2;
                        babylonSpotLight.innerAngle = ((light.spot && light.spot.innerConeAngle) || 0) * 2;
                        babylonLight = babylonSpotLight;
                        break;
                    }
                    default: {
                        _this._loader.babylonScene._blockEntityCollection = false;
                        throw new Error(extensionContext + ": Invalid light type (" + light.type + ")");
                    }
                }
                _this._loader.babylonScene._blockEntityCollection = false;
                babylonLight.falloffType = babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Light"].FALLOFF_GLTF;
                babylonLight.diffuse = light.color ? babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromArray(light.color) : babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Color3"].White();
                babylonLight.intensity = light.intensity == undefined ? 1 : light.intensity;
                babylonLight.range = light.range == undefined ? Number.MAX_VALUE : light.range;
                babylonLight.parent = babylonMesh;
                _this._loader._babylonLights.push(babylonLight);
                _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].AddPointerMetadata(babylonLight, extensionContext);
                assign(babylonMesh);
            });
        });
    };
    return KHR_lights;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_lights(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_materials_clearcoat.ts":
/*!********************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_materials_clearcoat.ts ***!
  \********************************************************/
/*! exports provided: KHR_materials_clearcoat */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_clearcoat", function() { return KHR_materials_clearcoat; });
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/PBR/pbrMaterial */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");


var NAME = "KHR_materials_clearcoat";
/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1677)
 * [Playground Sample](https://www.babylonjs-playground.com/frame.html#7F7PN6#8)
 * !!! Experimental Extension Subject to Changes !!!
 */
var KHR_materials_clearcoat = /** @class */ (function () {
    /** @hidden */
    function KHR_materials_clearcoat(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines a number that determines the order the extensions are applied.
         */
        this.order = 190;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_materials_clearcoat.prototype.dispose = function () {
        delete this._loader;
    };
    /** @hidden */
    KHR_materials_clearcoat.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, material, this.name, function (extensionContext, extension) {
            var promises = new Array();
            promises.push(_this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(_this._loadClearCoatPropertiesAsync(extensionContext, extension, babylonMaterial));
            return Promise.all(promises).then(function () { });
        });
    };
    KHR_materials_clearcoat.prototype._loadClearCoatPropertiesAsync = function (context, properties, babylonMaterial) {
        if (!(babylonMaterial instanceof babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"])) {
            throw new Error(context + ": Material type not supported");
        }
        var promises = new Array();
        babylonMaterial.clearCoat.isEnabled = true;
        if (properties.clearcoatFactor != undefined) {
            babylonMaterial.clearCoat.intensity = properties.clearcoatFactor;
        }
        else {
            babylonMaterial.clearCoat.intensity = 0;
        }
        if (properties.clearcoatTexture) {
            promises.push(this._loader.loadTextureInfoAsync(context + "/clearcoatTexture", properties.clearcoatTexture, function (texture) {
                texture.name = babylonMaterial.name + " (ClearCoat Intensity)";
                babylonMaterial.clearCoat.texture = texture;
            }));
        }
        if (properties.clearcoatRoughnessFactor != undefined) {
            babylonMaterial.clearCoat.roughness = properties.clearcoatRoughnessFactor;
        }
        else {
            babylonMaterial.clearCoat.roughness = 0;
        }
        if (properties.clearcoatRoughnessTexture) {
            promises.push(this._loader.loadTextureInfoAsync(context + "/clearcoatRoughnessTexture", properties.clearcoatRoughnessTexture, function (texture) {
                texture.name = babylonMaterial.name + " (ClearCoat Roughness)";
                babylonMaterial.clearCoat.texture = texture;
            }));
        }
        if (properties.clearcoatNormalTexture) {
            promises.push(this._loader.loadTextureInfoAsync(context + "/clearcoatNormalTexture", properties.clearcoatNormalTexture, function (texture) {
                texture.name = babylonMaterial.name + " (ClearCoat Normal)";
                babylonMaterial.clearCoat.bumpTexture = texture;
            }));
            babylonMaterial.invertNormalMapX = !babylonMaterial.getScene().useRightHandedSystem;
            babylonMaterial.invertNormalMapY = babylonMaterial.getScene().useRightHandedSystem;
            if (properties.clearcoatNormalTexture.scale != undefined) {
                babylonMaterial.clearCoat.bumpTexture.level = properties.clearcoatNormalTexture.scale;
            }
        }
        return Promise.all(promises).then(function () { });
    };
    return KHR_materials_clearcoat;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_materials_clearcoat(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_materials_ior.ts":
/*!**************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_materials_ior.ts ***!
  \**************************************************/
/*! exports provided: KHR_materials_ior */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_ior", function() { return KHR_materials_ior; });
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/PBR/pbrMaterial */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");


var NAME = "KHR_materials_ior";
/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1718)
 * !!! Experimental Extension Subject to Changes !!!
 */
var KHR_materials_ior = /** @class */ (function () {
    /** @hidden */
    function KHR_materials_ior(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines a number that determines the order the extensions are applied.
         */
        this.order = 180;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_materials_ior.prototype.dispose = function () {
        delete this._loader;
    };
    /** @hidden */
    KHR_materials_ior.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, material, this.name, function (extensionContext, extension) {
            var promises = new Array();
            promises.push(_this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(_this._loadIorPropertiesAsync(extensionContext, extension, babylonMaterial));
            return Promise.all(promises).then(function () { });
        });
    };
    KHR_materials_ior.prototype._loadIorPropertiesAsync = function (context, properties, babylonMaterial) {
        if (!(babylonMaterial instanceof babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"])) {
            throw new Error(context + ": Material type not supported");
        }
        if (properties.ior !== undefined) {
            babylonMaterial.indexOfRefraction = properties.ior;
        }
        else {
            babylonMaterial.indexOfRefraction = KHR_materials_ior._DEFAULT_IOR;
        }
        return Promise.resolve();
    };
    /**
     * Default ior Value from the spec.
     */
    KHR_materials_ior._DEFAULT_IOR = 1.5;
    return KHR_materials_ior;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_materials_ior(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_materials_pbrSpecularGlossiness.ts":
/*!********************************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_materials_pbrSpecularGlossiness.ts ***!
  \********************************************************************/
/*! exports provided: KHR_materials_pbrSpecularGlossiness */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_pbrSpecularGlossiness", function() { return KHR_materials_pbrSpecularGlossiness; });
/* harmony import */ var babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math.color */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");



var NAME = "KHR_materials_pbrSpecularGlossiness";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness)
 */
var KHR_materials_pbrSpecularGlossiness = /** @class */ (function () {
    /** @hidden */
    function KHR_materials_pbrSpecularGlossiness(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines a number that determines the order the extensions are applied.
         */
        this.order = 200;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_materials_pbrSpecularGlossiness.prototype.dispose = function () {
        delete this._loader;
    };
    /** @hidden */
    KHR_materials_pbrSpecularGlossiness.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, material, this.name, function (extensionContext, extension) {
            var promises = new Array();
            promises.push(_this._loader.loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
            promises.push(_this._loadSpecularGlossinessPropertiesAsync(extensionContext, material, extension, babylonMaterial));
            _this._loader.loadMaterialAlphaProperties(context, material, babylonMaterial);
            return Promise.all(promises).then(function () { });
        });
    };
    KHR_materials_pbrSpecularGlossiness.prototype._loadSpecularGlossinessPropertiesAsync = function (context, material, properties, babylonMaterial) {
        if (!(babylonMaterial instanceof babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"])) {
            throw new Error(context + ": Material type not supported");
        }
        var promises = new Array();
        babylonMaterial.metallic = null;
        babylonMaterial.roughness = null;
        if (properties.diffuseFactor) {
            babylonMaterial.albedoColor = babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromArray(properties.diffuseFactor);
            babylonMaterial.alpha = properties.diffuseFactor[3];
        }
        else {
            babylonMaterial.albedoColor = babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["Color3"].White();
        }
        babylonMaterial.reflectivityColor = properties.specularFactor ? babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromArray(properties.specularFactor) : babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["Color3"].White();
        babylonMaterial.microSurface = properties.glossinessFactor == undefined ? 1 : properties.glossinessFactor;
        if (properties.diffuseTexture) {
            promises.push(this._loader.loadTextureInfoAsync(context + "/diffuseTexture", properties.diffuseTexture, function (texture) {
                texture.name = babylonMaterial.name + " (Diffuse)";
                babylonMaterial.albedoTexture = texture;
            }));
        }
        if (properties.specularGlossinessTexture) {
            promises.push(this._loader.loadTextureInfoAsync(context + "/specularGlossinessTexture", properties.specularGlossinessTexture, function (texture) {
                texture.name = babylonMaterial.name + " (Specular Glossiness)";
                babylonMaterial.reflectivityTexture = texture;
            }));
            babylonMaterial.reflectivityTexture.hasAlpha = true;
            babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
        }
        return Promise.all(promises).then(function () { });
    };
    return KHR_materials_pbrSpecularGlossiness;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_materials_pbrSpecularGlossiness(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_materials_sheen.ts":
/*!****************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_materials_sheen.ts ***!
  \****************************************************/
/*! exports provided: KHR_materials_sheen */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_sheen", function() { return KHR_materials_sheen; });
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/PBR/pbrMaterial */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");



var NAME = "KHR_materials_sheen";
/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1688)
 * [Playground Sample](https://www.babylonjs-playground.com/frame.html#BNIZX6#4)
 * !!! Experimental Extension Subject to Changes !!!
 */
var KHR_materials_sheen = /** @class */ (function () {
    /** @hidden */
    function KHR_materials_sheen(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines a number that determines the order the extensions are applied.
         */
        this.order = 190;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_materials_sheen.prototype.dispose = function () {
        delete this._loader;
    };
    /** @hidden */
    KHR_materials_sheen.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, material, this.name, function (extensionContext, extension) {
            var promises = new Array();
            promises.push(_this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(_this._loadSheenPropertiesAsync(extensionContext, extension, babylonMaterial));
            return Promise.all(promises).then(function () { });
        });
    };
    KHR_materials_sheen.prototype._loadSheenPropertiesAsync = function (context, properties, babylonMaterial) {
        if (!(babylonMaterial instanceof babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"])) {
            throw new Error(context + ": Material type not supported");
        }
        var promises = new Array();
        babylonMaterial.sheen.isEnabled = true;
        babylonMaterial.sheen.intensity = 1;
        if (properties.sheenColorFactor != undefined) {
            babylonMaterial.sheen.color = babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromArray(properties.sheenColorFactor);
        }
        else {
            babylonMaterial.sheen.color = babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__["Color3"].Black();
        }
        if (properties.sheenTexture) {
            promises.push(this._loader.loadTextureInfoAsync(context + "/sheenTexture", properties.sheenTexture, function (texture) {
                texture.name = babylonMaterial.name + " (Sheen Color)";
                babylonMaterial.sheen.texture = texture;
            }));
        }
        if (properties.sheenRoughnessFactor !== undefined) {
            babylonMaterial.sheen.roughness = properties.sheenRoughnessFactor;
        }
        else {
            babylonMaterial.sheen.roughness = 0;
        }
        babylonMaterial.sheen.albedoScaling = true;
        return Promise.all(promises).then(function () { });
    };
    return KHR_materials_sheen;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_materials_sheen(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_materials_specular.ts":
/*!*******************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_materials_specular.ts ***!
  \*******************************************************/
/*! exports provided: KHR_materials_specular */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_specular", function() { return KHR_materials_specular; });
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/PBR/pbrMaterial */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");



var NAME = "KHR_materials_specular";
/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1719)
 * !!! Experimental Extension Subject to Changes !!!
 */
var KHR_materials_specular = /** @class */ (function () {
    /** @hidden */
    function KHR_materials_specular(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines a number that determines the order the extensions are applied.
         */
        this.order = 190;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_materials_specular.prototype.dispose = function () {
        delete this._loader;
    };
    /** @hidden */
    KHR_materials_specular.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, material, this.name, function (extensionContext, extension) {
            var promises = new Array();
            promises.push(_this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(_this._loadSpecularPropertiesAsync(extensionContext, extension, babylonMaterial));
            return Promise.all(promises).then(function () { });
        });
    };
    KHR_materials_specular.prototype._loadSpecularPropertiesAsync = function (context, properties, babylonMaterial) {
        if (!(babylonMaterial instanceof babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"])) {
            throw new Error(context + ": Material type not supported");
        }
        var promises = new Array();
        if (properties.specularFactor !== undefined) {
            babylonMaterial.metallicF0Factor = properties.specularFactor;
        }
        if (properties.specularColorFactor !== undefined) {
            babylonMaterial.metallicReflectanceColor = babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromArray(properties.specularColorFactor);
        }
        if (properties.specularTexture) {
            promises.push(this._loader.loadTextureInfoAsync(context + "/specularTexture", properties.specularTexture, function (texture) {
                texture.name = babylonMaterial.name + " (Specular F0 Color)";
                babylonMaterial.metallicReflectanceTexture = texture;
            }));
        }
        return Promise.all(promises).then(function () { });
    };
    return KHR_materials_specular;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_materials_specular(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_materials_transmission.ts":
/*!***********************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_materials_transmission.ts ***!
  \***********************************************************/
/*! exports provided: KHR_materials_transmission */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_transmission", function() { return KHR_materials_transmission; });
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/PBR/pbrMaterial */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");


var NAME = "KHR_materials_transmission";
/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1698)
 * !!! Experimental Extension Subject to Changes !!!
 */
var KHR_materials_transmission = /** @class */ (function () {
    /** @hidden */
    function KHR_materials_transmission(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines a number that determines the order the extensions are applied.
         */
        this.order = 175;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
        if (this.enabled) {
            loader._parent.transparencyAsCoverage = true;
        }
    }
    /** @hidden */
    KHR_materials_transmission.prototype.dispose = function () {
        delete this._loader;
    };
    /** @hidden */
    KHR_materials_transmission.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, material, this.name, function (extensionContext, extension) {
            var promises = new Array();
            promises.push(_this._loader.loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
            promises.push(_this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(_this._loadTransparentPropertiesAsync(extensionContext, material, babylonMaterial, extension));
            return Promise.all(promises).then(function () { });
        });
    };
    KHR_materials_transmission.prototype._loadTransparentPropertiesAsync = function (context, material, babylonMaterial, extension) {
        if (!(babylonMaterial instanceof babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"])) {
            throw new Error(context + ": Material type not supported");
        }
        var pbrMaterial = babylonMaterial;
        // Enables "refraction" texture which represents transmitted light.
        pbrMaterial.subSurface.isRefractionEnabled = true;
        // Since this extension models thin-surface transmission only, we must make IOR = 1.0
        pbrMaterial.subSurface.volumeIndexOfRefraction = 1.0;
        // Albedo colour will tint transmission.
        pbrMaterial.subSurface.useAlbedoToTintRefraction = true;
        if (extension.transmissionFactor !== undefined) {
            pbrMaterial.subSurface.refractionIntensity = extension.transmissionFactor;
        }
        else {
            pbrMaterial.subSurface.refractionIntensity = 0.0;
            pbrMaterial.subSurface.isRefractionEnabled = false;
            return Promise.resolve();
        }
        if (extension.transmissionTexture) {
            return this._loader.loadTextureInfoAsync(context + "/transmissionTexture", extension.transmissionTexture)
                .then(function (texture) {
                pbrMaterial.subSurface.thicknessTexture = texture;
                pbrMaterial.subSurface.useMaskFromThicknessTexture = true;
            });
        }
        else {
            return Promise.resolve();
        }
    };
    return KHR_materials_transmission;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_materials_transmission(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_materials_unlit.ts":
/*!****************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_materials_unlit.ts ***!
  \****************************************************/
/*! exports provided: KHR_materials_unlit */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_unlit", function() { return KHR_materials_unlit; });
/* harmony import */ var babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math.color */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");



var NAME = "KHR_materials_unlit";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit)
 */
var KHR_materials_unlit = /** @class */ (function () {
    /** @hidden */
    function KHR_materials_unlit(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines a number that determines the order the extensions are applied.
         */
        this.order = 210;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_materials_unlit.prototype.dispose = function () {
        delete this._loader;
    };
    /** @hidden */
    KHR_materials_unlit.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, material, this.name, function () {
            return _this._loadUnlitPropertiesAsync(context, material, babylonMaterial);
        });
    };
    KHR_materials_unlit.prototype._loadUnlitPropertiesAsync = function (context, material, babylonMaterial) {
        if (!(babylonMaterial instanceof babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"])) {
            throw new Error(context + ": Material type not supported");
        }
        var promises = new Array();
        babylonMaterial.unlit = true;
        var properties = material.pbrMetallicRoughness;
        if (properties) {
            if (properties.baseColorFactor) {
                babylonMaterial.albedoColor = babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromArray(properties.baseColorFactor);
                babylonMaterial.alpha = properties.baseColorFactor[3];
            }
            else {
                babylonMaterial.albedoColor = babylonjs_Maths_math_color__WEBPACK_IMPORTED_MODULE_0__["Color3"].White();
            }
            if (properties.baseColorTexture) {
                promises.push(this._loader.loadTextureInfoAsync(context + "/baseColorTexture", properties.baseColorTexture, function (texture) {
                    texture.name = babylonMaterial.name + " (Base Color)";
                    babylonMaterial.albedoTexture = texture;
                }));
            }
        }
        if (material.doubleSided) {
            babylonMaterial.backFaceCulling = false;
            babylonMaterial.twoSidedLighting = true;
        }
        this._loader.loadMaterialAlphaProperties(context, material, babylonMaterial);
        return Promise.all(promises).then(function () { });
    };
    return KHR_materials_unlit;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_materials_unlit(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_materials_variants.ts":
/*!*******************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_materials_variants.ts ***!
  \*******************************************************/
/*! exports provided: KHR_materials_variants */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_variants", function() { return KHR_materials_variants; });
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");
/* harmony import */ var babylonjs_Meshes_mesh__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! babylonjs/Meshes/mesh */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Meshes_mesh__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Meshes_mesh__WEBPACK_IMPORTED_MODULE_1__);


var NAME = "KHR_materials_variants";
/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1681)
 * !!! Experimental Extension Subject to Changes !!!
 */
var KHR_materials_variants = /** @class */ (function () {
    /** @hidden */
    function KHR_materials_variants(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_materials_variants.prototype.dispose = function () {
        delete this._loader;
    };
    /**
     * Gets the list of available variant names for this asset.
     * @param rootMesh The glTF root mesh
     * @returns the list of all the variant names for this model
     */
    KHR_materials_variants.GetAvailableVariants = function (rootMesh) {
        var extensionMetadata = this._GetExtensionMetadata(rootMesh);
        if (!extensionMetadata) {
            return [];
        }
        return Object.keys(extensionMetadata.variants);
    };
    /**
     * Gets the list of available variant names for this asset.
     * @param rootMesh The glTF root mesh
     * @returns the list of all the variant names for this model
     */
    KHR_materials_variants.prototype.getAvailableVariants = function (rootMesh) {
        return KHR_materials_variants.GetAvailableVariants(rootMesh);
    };
    /**
     * Select a variant given a variant name or a list of variant names.
     * @param rootMesh The glTF root mesh
     * @param variantName The variant name(s) to select.
     */
    KHR_materials_variants.SelectVariant = function (rootMesh, variantName) {
        var extensionMetadata = this._GetExtensionMetadata(rootMesh);
        if (!extensionMetadata) {
            throw new Error("Cannot select variant on a glTF mesh that does not have the " + NAME + " extension");
        }
        var select = function (variantName) {
            var entries = extensionMetadata.variants[variantName];
            if (entries) {
                for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                    var entry = entries_1[_i];
                    entry.mesh.material = entry.material;
                }
            }
        };
        if (variantName instanceof Array) {
            for (var _i = 0, variantName_1 = variantName; _i < variantName_1.length; _i++) {
                var name_1 = variantName_1[_i];
                select(name_1);
            }
        }
        else {
            select(variantName);
        }
        extensionMetadata.lastSelected = variantName;
    };
    /**
     * Select a variant given a variant name or a list of variant names.
     * @param rootMesh The glTF root mesh
     * @param variantName The variant name(s) to select.
     */
    KHR_materials_variants.prototype.selectVariant = function (rootMesh, variantName) {
        return KHR_materials_variants.SelectVariant(rootMesh, variantName);
    };
    /**
     * Reset back to the original before selecting a variant.
     * @param rootMesh The glTF root mesh
     */
    KHR_materials_variants.Reset = function (rootMesh) {
        var extensionMetadata = this._GetExtensionMetadata(rootMesh);
        if (!extensionMetadata) {
            throw new Error("Cannot reset on a glTF mesh that does not have the " + NAME + " extension");
        }
        for (var _i = 0, _a = extensionMetadata.original; _i < _a.length; _i++) {
            var entry = _a[_i];
            entry.mesh.material = entry.material;
        }
        extensionMetadata.lastSelected = null;
    };
    /**
     * Reset back to the original before selecting a variant.
     * @param rootMesh The glTF root mesh
     */
    KHR_materials_variants.prototype.reset = function (rootMesh) {
        return KHR_materials_variants.Reset(rootMesh);
    };
    /**
     * Gets the last selected variant name(s) or null if original.
     * @param rootMesh The glTF root mesh
     * @returns The selected variant name(s).
     */
    KHR_materials_variants.GetLastSelectedVariant = function (rootMesh) {
        var extensionMetadata = this._GetExtensionMetadata(rootMesh);
        if (!extensionMetadata) {
            throw new Error("Cannot get the last selected variant on a glTF mesh that does not have the " + NAME + " extension");
        }
        return extensionMetadata.lastSelected;
    };
    /**
     * Gets the last selected variant name(s) or null if original.
     * @param rootMesh The glTF root mesh
     * @returns The selected variant name(s).
     */
    KHR_materials_variants.prototype.getLastSelectedVariant = function (rootMesh) {
        return KHR_materials_variants.GetLastSelectedVariant(rootMesh);
    };
    KHR_materials_variants._GetExtensionMetadata = function (rootMesh) {
        var _a, _b;
        return ((_b = (_a = rootMesh === null || rootMesh === void 0 ? void 0 : rootMesh.metadata) === null || _a === void 0 ? void 0 : _a.gltf) === null || _b === void 0 ? void 0 : _b[NAME]) || null;
    };
    /** @hidden */
    KHR_materials_variants.prototype._loadMeshPrimitiveAsync = function (context, name, node, mesh, primitive, assign) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoader"].LoadExtensionAsync(context, primitive, this.name, function (extensionContext, extension) {
            var promises = new Array();
            promises.push(_this._loader._loadMeshPrimitiveAsync(context, name, node, mesh, primitive, function (babylonMesh) {
                assign(babylonMesh);
                if (babylonMesh instanceof babylonjs_Meshes_mesh__WEBPACK_IMPORTED_MODULE_1__["Mesh"]) {
                    var babylonDrawMode = _glTFLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoader"]._GetDrawMode(context, primitive.mode);
                    var root = _this._loader.rootBabylonMesh;
                    var metadata = (root.metadata = root.metadata || {});
                    var gltf = (metadata.gltf = metadata.gltf || {});
                    var extensionMetadata = (gltf[NAME] = gltf[NAME] || { lastSelected: null, original: [], variants: {} });
                    // Store the original material.
                    extensionMetadata.original.push({ mesh: babylonMesh, material: babylonMesh.material });
                    // For each mapping, look at the variants and make a new entry for them.
                    var variants_1 = extensionMetadata.variants;
                    for (var _i = 0, _a = extension.mapping; _i < _a.length; _i++) {
                        var mapping = _a[_i];
                        var _loop_1 = function (variant) {
                            var material = _glTFLoader__WEBPACK_IMPORTED_MODULE_0__["ArrayItem"].Get("#/materials/", _this._loader.gltf.materials, mapping.material);
                            promises.push(_this._loader._loadMaterialAsync("#/materials/" + mapping.material, material, babylonMesh, babylonDrawMode, function (babylonMaterial) {
                                variants_1[variant] = variants_1[variant] || [];
                                variants_1[variant].push({
                                    mesh: babylonMesh,
                                    material: babylonMaterial
                                });
                            }));
                        };
                        for (var _b = 0, _c = mapping.variants; _b < _c.length; _b++) {
                            var variant = _c[_b];
                            _loop_1(variant);
                        }
                    }
                }
            }));
            return Promise.all(promises).then(function (_a) {
                var babylonMesh = _a[0];
                return babylonMesh;
            });
        });
    };
    return KHR_materials_variants;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_materials_variants(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_mesh_quantization.ts":
/*!******************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_mesh_quantization.ts ***!
  \******************************************************/
/*! exports provided: KHR_mesh_quantization */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_mesh_quantization", function() { return KHR_mesh_quantization; });
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");

var NAME = "KHR_mesh_quantization";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization)
 */
var KHR_mesh_quantization = /** @class */ (function () {
    /** @hidden */
    function KHR_mesh_quantization(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this.enabled = loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_mesh_quantization.prototype.dispose = function () {
    };
    return KHR_mesh_quantization;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_mesh_quantization(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_texture_basisu.ts":
/*!***************************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_texture_basisu.ts ***!
  \***************************************************/
/*! exports provided: KHR_texture_basisu */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_texture_basisu", function() { return KHR_texture_basisu; });
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");

var NAME = "KHR_texture_basisu";
/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1751)
 * !!! Experimental Extension Subject to Changes !!!
 */
var KHR_texture_basisu = /** @class */ (function () {
    /** @hidden */
    function KHR_texture_basisu(loader) {
        /** The name of this extension. */
        this.name = NAME;
        this._loader = loader;
        this.enabled = loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_texture_basisu.prototype.dispose = function () {
        delete this._loader;
    };
    /** @hidden */
    KHR_texture_basisu.prototype._loadTextureAsync = function (context, texture, assign) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoader"].LoadExtensionAsync(context, texture, this.name, function (extensionContext, extension) {
            var sampler = (texture.sampler == undefined ? _glTFLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoader"].DefaultSampler : _glTFLoader__WEBPACK_IMPORTED_MODULE_0__["ArrayItem"].Get(context + "/sampler", _this._loader.gltf.samplers, texture.sampler));
            var image = _glTFLoader__WEBPACK_IMPORTED_MODULE_0__["ArrayItem"].Get(extensionContext + "/source", _this._loader.gltf.images, extension.source);
            return _this._loader._createTextureAsync(context, sampler, image, function (babylonTexture) {
                babylonTexture.gammaSpace = false;
                assign(babylonTexture);
            });
        });
    };
    return KHR_texture_basisu;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_texture_basisu(loader); });


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
/* harmony import */ var babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/Textures/texture */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");


var NAME = "KHR_texture_transform";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_texture_transform)
 */
var KHR_texture_transform = /** @class */ (function () {
    /** @hidden */
    function KHR_texture_transform(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_texture_transform.prototype.dispose = function () {
        delete this._loader;
    };
    /** @hidden */
    KHR_texture_transform.prototype.loadTextureInfoAsync = function (context, textureInfo, assign) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, textureInfo, this.name, function (extensionContext, extension) {
            return _this._loader.loadTextureInfoAsync(context, textureInfo, function (babylonTexture) {
                if (!(babylonTexture instanceof babylonjs_Materials_Textures_texture__WEBPACK_IMPORTED_MODULE_0__["Texture"])) {
                    throw new Error(extensionContext + ": Texture type not supported");
                }
                if (extension.offset) {
                    babylonTexture.uOffset = extension.offset[0];
                    babylonTexture.vOffset = extension.offset[1];
                }
                // Always rotate around the origin.
                babylonTexture.uRotationCenter = 0;
                babylonTexture.vRotationCenter = 0;
                if (extension.rotation) {
                    babylonTexture.wAng = -extension.rotation;
                }
                if (extension.scale) {
                    babylonTexture.uScale = extension.scale[0];
                    babylonTexture.vScale = extension.scale[1];
                }
                if (extension.texCoord != undefined) {
                    babylonTexture.coordinatesIndex = extension.texCoord;
                }
                assign(babylonTexture);
            });
        });
    };
    return KHR_texture_transform;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_texture_transform(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/KHR_xmp.ts":
/*!****************************************!*\
  !*** ./glTF/2.0/Extensions/KHR_xmp.ts ***!
  \****************************************/
/*! exports provided: KHR_xmp */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "KHR_xmp", function() { return KHR_xmp; });
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");

var NAME = "KHR_xmp";
/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1553)
 * !!! Experimental Extension Subject to Changes !!!
 */
var KHR_xmp = /** @class */ (function () {
    /** @hidden */
    function KHR_xmp(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines a number that determines the order the extensions are applied.
         */
        this.order = 100;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    KHR_xmp.prototype.dispose = function () {
        delete this._loader;
    };
    /**
     * Called after the loader state changes to LOADING.
     */
    KHR_xmp.prototype.onLoading = function () {
        var _a, _b, _c;
        var xmp_gltf = (_a = this._loader.gltf.extensions) === null || _a === void 0 ? void 0 : _a.KHR_xmp;
        var xmp_node = (_c = (_b = this._loader.gltf.asset) === null || _b === void 0 ? void 0 : _b.extensions) === null || _c === void 0 ? void 0 : _c.KHR_xmp;
        if (xmp_gltf && xmp_node) {
            var packet = +xmp_node.packet;
            if (xmp_gltf.packets && packet < xmp_gltf.packets.length) {
                this._loader.rootBabylonMesh.metadata = this._loader.rootBabylonMesh.metadata || {};
                this._loader.rootBabylonMesh.metadata.xmp = xmp_gltf.packets[packet];
            }
        }
    };
    return KHR_xmp;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new KHR_xmp(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/MSFT_audio_emitter.ts":
/*!***************************************************!*\
  !*** ./glTF/2.0/Extensions/MSFT_audio_emitter.ts ***!
  \***************************************************/
/*! exports provided: MSFT_audio_emitter */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MSFT_audio_emitter", function() { return MSFT_audio_emitter; });
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Maths/math.vector */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");






var NAME = "MSFT_audio_emitter";
/**
 * [Specification](https://github.com/najadojo/glTF/tree/MSFT_audio_emitter/extensions/2.0/Vendor/MSFT_audio_emitter)
 */
var MSFT_audio_emitter = /** @class */ (function () {
    /** @hidden */
    function MSFT_audio_emitter(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    MSFT_audio_emitter.prototype.dispose = function () {
        delete this._loader;
        delete this._clips;
        delete this._emitters;
    };
    /** @hidden */
    MSFT_audio_emitter.prototype.onLoading = function () {
        var extensions = this._loader.gltf.extensions;
        if (extensions && extensions[this.name]) {
            var extension = extensions[this.name];
            this._clips = extension.clips;
            this._emitters = extension.emitters;
            _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Assign(this._clips);
            _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Assign(this._emitters);
        }
    };
    /** @hidden */
    MSFT_audio_emitter.prototype.loadSceneAsync = function (context, scene) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, scene, this.name, function (extensionContext, extension) {
            var promises = new Array();
            promises.push(_this._loader.loadSceneAsync(context, scene));
            for (var _i = 0, _a = extension.emitters; _i < _a.length; _i++) {
                var emitterIndex = _a[_i];
                var emitter = _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Get(extensionContext + "/emitters", _this._emitters, emitterIndex);
                if (emitter.refDistance != undefined || emitter.maxDistance != undefined || emitter.rolloffFactor != undefined ||
                    emitter.distanceModel != undefined || emitter.innerAngle != undefined || emitter.outerAngle != undefined) {
                    throw new Error(extensionContext + ": Direction or Distance properties are not allowed on emitters attached to a scene");
                }
                promises.push(_this._loadEmitterAsync(extensionContext + "/emitters/" + emitter.index, emitter));
            }
            return Promise.all(promises).then(function () { });
        });
    };
    /** @hidden */
    MSFT_audio_emitter.prototype.loadNodeAsync = function (context, node, assign) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, node, this.name, function (extensionContext, extension) {
            var promises = new Array();
            return _this._loader.loadNodeAsync(extensionContext, node, function (babylonMesh) {
                var _loop_1 = function (emitterIndex) {
                    var emitter = _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Get(extensionContext + "/emitters", _this._emitters, emitterIndex);
                    promises.push(_this._loadEmitterAsync(extensionContext + "/emitters/" + emitter.index, emitter).then(function () {
                        for (var _i = 0, _a = emitter._babylonSounds; _i < _a.length; _i++) {
                            var sound = _a[_i];
                            sound.attachToMesh(babylonMesh);
                            if (emitter.innerAngle != undefined || emitter.outerAngle != undefined) {
                                sound.setLocalDirectionToMesh(babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Forward());
                                sound.setDirectionalCone(2 * babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Tools"].ToDegrees(emitter.innerAngle == undefined ? Math.PI : emitter.innerAngle), 2 * babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Tools"].ToDegrees(emitter.outerAngle == undefined ? Math.PI : emitter.outerAngle), 0);
                            }
                        }
                    }));
                };
                for (var _i = 0, _a = extension.emitters; _i < _a.length; _i++) {
                    var emitterIndex = _a[_i];
                    _loop_1(emitterIndex);
                }
                assign(babylonMesh);
            }).then(function (babylonMesh) {
                return Promise.all(promises).then(function () {
                    return babylonMesh;
                });
            });
        });
    };
    /** @hidden */
    MSFT_audio_emitter.prototype.loadAnimationAsync = function (context, animation) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, animation, this.name, function (extensionContext, extension) {
            return _this._loader.loadAnimationAsync(context, animation).then(function (babylonAnimationGroup) {
                var promises = new Array();
                _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Assign(extension.events);
                for (var _i = 0, _a = extension.events; _i < _a.length; _i++) {
                    var event_1 = _a[_i];
                    promises.push(_this._loadAnimationEventAsync(extensionContext + "/events/" + event_1.index, context, animation, event_1, babylonAnimationGroup));
                }
                return Promise.all(promises).then(function () {
                    return babylonAnimationGroup;
                });
            });
        });
    };
    MSFT_audio_emitter.prototype._loadClipAsync = function (context, clip) {
        if (clip._objectURL) {
            return clip._objectURL;
        }
        var promise;
        if (clip.uri) {
            promise = this._loader.loadUriAsync(context, clip, clip.uri);
        }
        else {
            var bufferView = _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Get(context + "/bufferView", this._loader.gltf.bufferViews, clip.bufferView);
            promise = this._loader.loadBufferViewAsync("/bufferViews/" + bufferView.index, bufferView);
        }
        clip._objectURL = promise.then(function (data) {
            return URL.createObjectURL(new Blob([data], { type: clip.mimeType }));
        });
        return clip._objectURL;
    };
    MSFT_audio_emitter.prototype._loadEmitterAsync = function (context, emitter) {
        var _this = this;
        emitter._babylonSounds = emitter._babylonSounds || [];
        if (!emitter._babylonData) {
            var clipPromises = new Array();
            var name_1 = emitter.name || "emitter" + emitter.index;
            var options_1 = {
                loop: false,
                autoplay: false,
                volume: emitter.volume == undefined ? 1 : emitter.volume,
            };
            var _loop_2 = function (i) {
                var clipContext = "/extensions/" + this_1.name + "/clips";
                var clip = _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Get(clipContext, this_1._clips, emitter.clips[i].clip);
                clipPromises.push(this_1._loadClipAsync(clipContext + "/" + emitter.clips[i].clip, clip).then(function (objectURL) {
                    var sound = emitter._babylonSounds[i] = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Sound"](name_1, objectURL, _this._loader.babylonScene, null, options_1);
                    sound.refDistance = emitter.refDistance || 1;
                    sound.maxDistance = emitter.maxDistance || 256;
                    sound.rolloffFactor = emitter.rolloffFactor || 1;
                    sound.distanceModel = emitter.distanceModel || 'exponential';
                    sound._positionInEmitterSpace = true;
                }));
            };
            var this_1 = this;
            for (var i = 0; i < emitter.clips.length; i++) {
                _loop_2(i);
            }
            var promise = Promise.all(clipPromises).then(function () {
                var weights = emitter.clips.map(function (clip) { return clip.weight || 1; });
                var weightedSound = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["WeightedSound"](emitter.loop || false, emitter._babylonSounds, weights);
                if (emitter.innerAngle) {
                    weightedSound.directionalConeInnerAngle = 2 * babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Tools"].ToDegrees(emitter.innerAngle);
                }
                if (emitter.outerAngle) {
                    weightedSound.directionalConeOuterAngle = 2 * babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["Tools"].ToDegrees(emitter.outerAngle);
                }
                if (emitter.volume) {
                    weightedSound.volume = emitter.volume;
                }
                emitter._babylonData.sound = weightedSound;
            });
            emitter._babylonData = {
                loaded: promise
            };
        }
        return emitter._babylonData.loaded;
    };
    MSFT_audio_emitter.prototype._getEventAction = function (context, sound, action, time, startOffset) {
        switch (action) {
            case "play" /* play */: {
                return function (currentFrame) {
                    var frameOffset = (startOffset || 0) + (currentFrame - time);
                    sound.play(frameOffset);
                };
            }
            case "stop" /* stop */: {
                return function (currentFrame) {
                    sound.stop();
                };
            }
            case "pause" /* pause */: {
                return function (currentFrame) {
                    sound.pause();
                };
            }
            default: {
                throw new Error(context + ": Unsupported action " + action);
            }
        }
    };
    MSFT_audio_emitter.prototype._loadAnimationEventAsync = function (context, animationContext, animation, event, babylonAnimationGroup) {
        var _this = this;
        if (babylonAnimationGroup.targetedAnimations.length == 0) {
            return Promise.resolve();
        }
        var babylonAnimation = babylonAnimationGroup.targetedAnimations[0];
        var emitterIndex = event.emitter;
        var emitter = _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Get("/extensions/" + this.name + "/emitters", this._emitters, emitterIndex);
        return this._loadEmitterAsync(context, emitter).then(function () {
            var sound = emitter._babylonData.sound;
            if (sound) {
                var babylonAnimationEvent = new babylonjs_Maths_math_vector__WEBPACK_IMPORTED_MODULE_0__["AnimationEvent"](event.time, _this._getEventAction(context, sound, event.action, event.time, event.startOffset));
                babylonAnimation.animation.addEvent(babylonAnimationEvent);
                // Make sure all started audio stops when this animation is terminated.
                babylonAnimationGroup.onAnimationGroupEndObservable.add(function () {
                    sound.stop();
                });
                babylonAnimationGroup.onAnimationGroupPauseObservable.add(function () {
                    sound.pause();
                });
            }
        });
    };
    return MSFT_audio_emitter;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new MSFT_audio_emitter(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/MSFT_lod.ts":
/*!*****************************************!*\
  !*** ./glTF/2.0/Extensions/MSFT_lod.ts ***!
  \*****************************************/
/*! exports provided: MSFT_lod */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MSFT_lod", function() { return MSFT_lod; });
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");



var NAME = "MSFT_lod";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod)
 */
var MSFT_lod = /** @class */ (function () {
    /** @hidden */
    function MSFT_lod(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines a number that determines the order the extensions are applied.
         */
        this.order = 100;
        /**
         * Maximum number of LODs to load, starting from the lowest LOD.
         */
        this.maxLODsToLoad = 10;
        /**
         * Observable raised when all node LODs of one level are loaded.
         * The event data is the index of the loaded LOD starting from zero.
         * Dispose the loader to cancel the loading of the next level of LODs.
         */
        this.onNodeLODsLoadedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * Observable raised when all material LODs of one level are loaded.
         * The event data is the index of the loaded LOD starting from zero.
         * Dispose the loader to cancel the loading of the next level of LODs.
         */
        this.onMaterialLODsLoadedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        this._bufferLODs = new Array();
        this._nodeIndexLOD = null;
        this._nodeSignalLODs = new Array();
        this._nodePromiseLODs = new Array();
        this._nodeBufferLODs = new Array();
        this._materialIndexLOD = null;
        this._materialSignalLODs = new Array();
        this._materialPromiseLODs = new Array();
        this._materialBufferLODs = new Array();
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @hidden */
    MSFT_lod.prototype.dispose = function () {
        delete this._loader;
        this._nodeIndexLOD = null;
        this._nodeSignalLODs.length = 0;
        this._nodePromiseLODs.length = 0;
        this._nodeBufferLODs.length = 0;
        this._materialIndexLOD = null;
        this._materialSignalLODs.length = 0;
        this._materialPromiseLODs.length = 0;
        this._materialBufferLODs.length = 0;
        this.onMaterialLODsLoadedObservable.clear();
        this.onNodeLODsLoadedObservable.clear();
    };
    /** @hidden */
    MSFT_lod.prototype.onReady = function () {
        var _this = this;
        var _loop_1 = function (indexLOD) {
            var promise = Promise.all(this_1._nodePromiseLODs[indexLOD]).then(function () {
                if (indexLOD !== 0) {
                    _this._loader.endPerformanceCounter("Node LOD " + indexLOD);
                    _this._loader.log("Loaded node LOD " + indexLOD);
                }
                _this.onNodeLODsLoadedObservable.notifyObservers(indexLOD);
                if (indexLOD !== _this._nodePromiseLODs.length - 1) {
                    _this._loader.startPerformanceCounter("Node LOD " + (indexLOD + 1));
                    _this._loadBufferLOD(_this._nodeBufferLODs, indexLOD + 1);
                    if (_this._nodeSignalLODs[indexLOD]) {
                        _this._nodeSignalLODs[indexLOD].resolve();
                    }
                }
            });
            this_1._loader._completePromises.push(promise);
        };
        var this_1 = this;
        for (var indexLOD = 0; indexLOD < this._nodePromiseLODs.length; indexLOD++) {
            _loop_1(indexLOD);
        }
        var _loop_2 = function (indexLOD) {
            var promise = Promise.all(this_2._materialPromiseLODs[indexLOD]).then(function () {
                if (indexLOD !== 0) {
                    _this._loader.endPerformanceCounter("Material LOD " + indexLOD);
                    _this._loader.log("Loaded material LOD " + indexLOD);
                }
                _this.onMaterialLODsLoadedObservable.notifyObservers(indexLOD);
                if (indexLOD !== _this._materialPromiseLODs.length - 1) {
                    _this._loader.startPerformanceCounter("Material LOD " + (indexLOD + 1));
                    _this._loadBufferLOD(_this._materialBufferLODs, indexLOD + 1);
                    if (_this._materialSignalLODs[indexLOD]) {
                        _this._materialSignalLODs[indexLOD].resolve();
                    }
                }
            });
            this_2._loader._completePromises.push(promise);
        };
        var this_2 = this;
        for (var indexLOD = 0; indexLOD < this._materialPromiseLODs.length; indexLOD++) {
            _loop_2(indexLOD);
        }
    };
    /** @hidden */
    MSFT_lod.prototype.loadSceneAsync = function (context, scene) {
        var promise = this._loader.loadSceneAsync(context, scene);
        this._loadBufferLOD(this._bufferLODs, 0);
        return promise;
    };
    /** @hidden */
    MSFT_lod.prototype.loadNodeAsync = function (context, node, assign) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, node, this.name, function (extensionContext, extension) {
            var firstPromise;
            var nodeLODs = _this._getLODs(extensionContext, node, _this._loader.gltf.nodes, extension.ids);
            _this._loader.logOpen("" + extensionContext);
            var _loop_3 = function (indexLOD) {
                var nodeLOD = nodeLODs[indexLOD];
                if (indexLOD !== 0) {
                    _this._nodeIndexLOD = indexLOD;
                    _this._nodeSignalLODs[indexLOD] = _this._nodeSignalLODs[indexLOD] || new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Deferred"]();
                }
                var assign_1 = function (babylonTransformNode) { babylonTransformNode.setEnabled(false); };
                var promise = _this._loader.loadNodeAsync("/nodes/" + nodeLOD.index, nodeLOD, assign_1).then(function (babylonMesh) {
                    if (indexLOD !== 0) {
                        // TODO: should not rely on _babylonTransformNode
                        var previousNodeLOD = nodeLODs[indexLOD - 1];
                        if (previousNodeLOD._babylonTransformNode) {
                            _this._disposeTransformNode(previousNodeLOD._babylonTransformNode);
                            delete previousNodeLOD._babylonTransformNode;
                        }
                    }
                    babylonMesh.setEnabled(true);
                    return babylonMesh;
                });
                _this._nodePromiseLODs[indexLOD] = _this._nodePromiseLODs[indexLOD] || [];
                if (indexLOD === 0) {
                    firstPromise = promise;
                }
                else {
                    _this._nodeIndexLOD = null;
                    _this._nodePromiseLODs[indexLOD].push(promise);
                }
            };
            for (var indexLOD = 0; indexLOD < nodeLODs.length; indexLOD++) {
                _loop_3(indexLOD);
            }
            _this._loader.logClose();
            return firstPromise;
        });
    };
    /** @hidden */
    MSFT_lod.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
        var _this = this;
        // Don't load material LODs if already loading a node LOD.
        if (this._nodeIndexLOD) {
            return null;
        }
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtensionAsync(context, material, this.name, function (extensionContext, extension) {
            var firstPromise;
            var materialLODs = _this._getLODs(extensionContext, material, _this._loader.gltf.materials, extension.ids);
            _this._loader.logOpen("" + extensionContext);
            var _loop_4 = function (indexLOD) {
                var materialLOD = materialLODs[indexLOD];
                if (indexLOD !== 0) {
                    _this._materialIndexLOD = indexLOD;
                }
                var promise = _this._loader._loadMaterialAsync("/materials/" + materialLOD.index, materialLOD, babylonMesh, babylonDrawMode, function (babylonMaterial) {
                    if (indexLOD === 0) {
                        assign(babylonMaterial);
                    }
                }).then(function (babylonMaterial) {
                    if (indexLOD !== 0) {
                        assign(babylonMaterial);
                        // TODO: should not rely on _data
                        var previousDataLOD = materialLODs[indexLOD - 1]._data;
                        if (previousDataLOD[babylonDrawMode]) {
                            _this._disposeMaterials([previousDataLOD[babylonDrawMode].babylonMaterial]);
                            delete previousDataLOD[babylonDrawMode];
                        }
                    }
                    return babylonMaterial;
                });
                _this._materialPromiseLODs[indexLOD] = _this._materialPromiseLODs[indexLOD] || [];
                if (indexLOD === 0) {
                    firstPromise = promise;
                }
                else {
                    _this._materialIndexLOD = null;
                    _this._materialPromiseLODs[indexLOD].push(promise);
                }
            };
            for (var indexLOD = 0; indexLOD < materialLODs.length; indexLOD++) {
                _loop_4(indexLOD);
            }
            _this._loader.logClose();
            return firstPromise;
        });
    };
    /** @hidden */
    MSFT_lod.prototype._loadUriAsync = function (context, property, uri) {
        var _this = this;
        // Defer the loading of uris if loading a node or material LOD.
        if (this._nodeIndexLOD !== null) {
            this._loader.log("deferred");
            var previousIndexLOD = this._nodeIndexLOD - 1;
            this._nodeSignalLODs[previousIndexLOD] = this._nodeSignalLODs[previousIndexLOD] || new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Deferred"]();
            return this._nodeSignalLODs[this._nodeIndexLOD - 1].promise.then(function () {
                return _this._loader.loadUriAsync(context, property, uri);
            });
        }
        else if (this._materialIndexLOD !== null) {
            this._loader.log("deferred");
            var previousIndexLOD = this._materialIndexLOD - 1;
            this._materialSignalLODs[previousIndexLOD] = this._materialSignalLODs[previousIndexLOD] || new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Deferred"]();
            return this._materialSignalLODs[previousIndexLOD].promise.then(function () {
                return _this._loader.loadUriAsync(context, property, uri);
            });
        }
        return null;
    };
    /** @hidden */
    MSFT_lod.prototype.loadBufferAsync = function (context, buffer, byteOffset, byteLength) {
        if (this._loader.parent.useRangeRequests && !buffer.uri) {
            if (!this._loader.bin) {
                throw new Error(context + ": Uri is missing or the binary glTF is missing its binary chunk");
            }
            var loadAsync = function (bufferLODs, indexLOD) {
                var start = byteOffset;
                var end = start + byteLength - 1;
                var bufferLOD = bufferLODs[indexLOD];
                if (bufferLOD) {
                    bufferLOD.start = Math.min(bufferLOD.start, start);
                    bufferLOD.end = Math.max(bufferLOD.end, end);
                }
                else {
                    bufferLOD = { start: start, end: end, loaded: new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Deferred"]() };
                    bufferLODs[indexLOD] = bufferLOD;
                }
                return bufferLOD.loaded.promise.then(function (data) {
                    return new Uint8Array(data.buffer, data.byteOffset + byteOffset - bufferLOD.start, byteLength);
                });
            };
            this._loader.log("deferred");
            if (this._nodeIndexLOD !== null) {
                return loadAsync(this._nodeBufferLODs, this._nodeIndexLOD);
            }
            else if (this._materialIndexLOD !== null) {
                return loadAsync(this._materialBufferLODs, this._materialIndexLOD);
            }
            else {
                return loadAsync(this._bufferLODs, 0);
            }
        }
        return null;
    };
    MSFT_lod.prototype._loadBufferLOD = function (bufferLODs, indexLOD) {
        var bufferLOD = bufferLODs[indexLOD];
        if (bufferLOD) {
            this._loader.log("Loading buffer range [" + bufferLOD.start + "-" + bufferLOD.end + "]");
            this._loader.bin.readAsync(bufferLOD.start, bufferLOD.end - bufferLOD.start + 1).then(function (data) {
                bufferLOD.loaded.resolve(data);
            }, function (error) {
                bufferLOD.loaded.reject(error);
            });
        }
    };
    /**
     * Gets an array of LOD properties from lowest to highest.
     */
    MSFT_lod.prototype._getLODs = function (context, property, array, ids) {
        if (this.maxLODsToLoad <= 0) {
            throw new Error("maxLODsToLoad must be greater than zero");
        }
        var properties = new Array();
        for (var i = ids.length - 1; i >= 0; i--) {
            properties.push(_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["ArrayItem"].Get(context + "/ids/" + ids[i], array, ids[i]));
            if (properties.length === this.maxLODsToLoad) {
                return properties;
            }
        }
        properties.push(property);
        return properties;
    };
    MSFT_lod.prototype._disposeTransformNode = function (babylonTransformNode) {
        var _this = this;
        var babylonMaterials = new Array();
        var babylonMaterial = babylonTransformNode.material;
        if (babylonMaterial) {
            babylonMaterials.push(babylonMaterial);
        }
        for (var _i = 0, _a = babylonTransformNode.getChildMeshes(); _i < _a.length; _i++) {
            var babylonMesh = _a[_i];
            if (babylonMesh.material) {
                babylonMaterials.push(babylonMesh.material);
            }
        }
        babylonTransformNode.dispose();
        var babylonMaterialsToDispose = babylonMaterials.filter(function (babylonMaterial) { return _this._loader.babylonScene.meshes.every(function (mesh) { return mesh.material != babylonMaterial; }); });
        this._disposeMaterials(babylonMaterialsToDispose);
    };
    MSFT_lod.prototype._disposeMaterials = function (babylonMaterials) {
        var babylonTextures = {};
        for (var _i = 0, babylonMaterials_1 = babylonMaterials; _i < babylonMaterials_1.length; _i++) {
            var babylonMaterial = babylonMaterials_1[_i];
            for (var _a = 0, _b = babylonMaterial.getActiveTextures(); _a < _b.length; _a++) {
                var babylonTexture = _b[_a];
                babylonTextures[babylonTexture.uniqueId] = babylonTexture;
            }
            babylonMaterial.dispose();
        }
        for (var uniqueId in babylonTextures) {
            for (var _c = 0, _d = this._loader.babylonScene.materials; _c < _d.length; _c++) {
                var babylonMaterial = _d[_c];
                if (babylonMaterial.hasTexture(babylonTextures[uniqueId])) {
                    delete babylonTextures[uniqueId];
                }
            }
        }
        for (var uniqueId in babylonTextures) {
            babylonTextures[uniqueId].dispose();
        }
    };
    return MSFT_lod;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new MSFT_lod(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/MSFT_minecraftMesh.ts":
/*!***************************************************!*\
  !*** ./glTF/2.0/Extensions/MSFT_minecraftMesh.ts ***!
  \***************************************************/
/*! exports provided: MSFT_minecraftMesh */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MSFT_minecraftMesh", function() { return MSFT_minecraftMesh; });
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/PBR/pbrMaterial */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");


var NAME = "MSFT_minecraftMesh";
/** @hidden */
var MSFT_minecraftMesh = /** @class */ (function () {
    function MSFT_minecraftMesh(loader) {
        this.name = NAME;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    MSFT_minecraftMesh.prototype.dispose = function () {
        delete this._loader;
    };
    MSFT_minecraftMesh.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtraAsync(context, material, this.name, function (extraContext, extra) {
            if (extra) {
                if (!(babylonMaterial instanceof babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"])) {
                    throw new Error(extraContext + ": Material type not supported");
                }
                var promise = _this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);
                if (babylonMaterial.needAlphaBlending()) {
                    babylonMaterial.forceDepthWrite = true;
                    babylonMaterial.separateCullingPass = true;
                }
                babylonMaterial.backFaceCulling = babylonMaterial.forceDepthWrite;
                babylonMaterial.twoSidedLighting = true;
                return promise;
            }
            return null;
        });
    };
    return MSFT_minecraftMesh;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new MSFT_minecraftMesh(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/MSFT_sRGBFactors.ts":
/*!*************************************************!*\
  !*** ./glTF/2.0/Extensions/MSFT_sRGBFactors.ts ***!
  \*************************************************/
/*! exports provided: MSFT_sRGBFactors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MSFT_sRGBFactors", function() { return MSFT_sRGBFactors; });
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Materials/PBR/pbrMaterial */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFLoader */ "./glTF/2.0/glTFLoader.ts");


var NAME = "MSFT_sRGBFactors";
/** @hidden */
var MSFT_sRGBFactors = /** @class */ (function () {
    function MSFT_sRGBFactors(loader) {
        this.name = NAME;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    MSFT_sRGBFactors.prototype.dispose = function () {
        delete this._loader;
    };
    MSFT_sRGBFactors.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
        var _this = this;
        return _glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].LoadExtraAsync(context, material, this.name, function (extraContext, extra) {
            if (extra) {
                if (!(babylonMaterial instanceof babylonjs_Materials_PBR_pbrMaterial__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"])) {
                    throw new Error(extraContext + ": Material type not supported");
                }
                var promise = _this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);
                if (!babylonMaterial.albedoTexture) {
                    babylonMaterial.albedoColor.toLinearSpaceToRef(babylonMaterial.albedoColor);
                }
                if (!babylonMaterial.reflectivityTexture) {
                    babylonMaterial.reflectivityColor.toLinearSpaceToRef(babylonMaterial.reflectivityColor);
                }
                return promise;
            }
            return null;
        });
    };
    return MSFT_sRGBFactors;
}());

_glTFLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoader"].RegisterExtension(NAME, function (loader) { return new MSFT_sRGBFactors(loader); });


/***/ }),

/***/ "./glTF/2.0/Extensions/index.ts":
/*!**************************************!*\
  !*** ./glTF/2.0/Extensions/index.ts ***!
  \**************************************/
/*! exports provided: EXT_lights_image_based, EXT_mesh_gpu_instancing, KHR_draco_mesh_compression, KHR_lights, KHR_materials_pbrSpecularGlossiness, KHR_materials_unlit, KHR_materials_clearcoat, KHR_materials_sheen, KHR_materials_specular, KHR_materials_ior, KHR_materials_variants, KHR_materials_transmission, KHR_mesh_quantization, KHR_texture_basisu, KHR_texture_transform, KHR_xmp, MSFT_audio_emitter, MSFT_lod, MSFT_minecraftMesh, MSFT_sRGBFactors, ExtrasAsMetadata */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _EXT_lights_image_based__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./EXT_lights_image_based */ "./glTF/2.0/Extensions/EXT_lights_image_based.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "EXT_lights_image_based", function() { return _EXT_lights_image_based__WEBPACK_IMPORTED_MODULE_0__["EXT_lights_image_based"]; });

/* harmony import */ var _EXT_mesh_gpu_instancing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./EXT_mesh_gpu_instancing */ "./glTF/2.0/Extensions/EXT_mesh_gpu_instancing.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "EXT_mesh_gpu_instancing", function() { return _EXT_mesh_gpu_instancing__WEBPACK_IMPORTED_MODULE_1__["EXT_mesh_gpu_instancing"]; });

/* harmony import */ var _KHR_draco_mesh_compression__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./KHR_draco_mesh_compression */ "./glTF/2.0/Extensions/KHR_draco_mesh_compression.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_draco_mesh_compression", function() { return _KHR_draco_mesh_compression__WEBPACK_IMPORTED_MODULE_2__["KHR_draco_mesh_compression"]; });

/* harmony import */ var _KHR_lights_punctual__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./KHR_lights_punctual */ "./glTF/2.0/Extensions/KHR_lights_punctual.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_lights", function() { return _KHR_lights_punctual__WEBPACK_IMPORTED_MODULE_3__["KHR_lights"]; });

/* harmony import */ var _KHR_materials_pbrSpecularGlossiness__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./KHR_materials_pbrSpecularGlossiness */ "./glTF/2.0/Extensions/KHR_materials_pbrSpecularGlossiness.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_pbrSpecularGlossiness", function() { return _KHR_materials_pbrSpecularGlossiness__WEBPACK_IMPORTED_MODULE_4__["KHR_materials_pbrSpecularGlossiness"]; });

/* harmony import */ var _KHR_materials_unlit__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./KHR_materials_unlit */ "./glTF/2.0/Extensions/KHR_materials_unlit.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_unlit", function() { return _KHR_materials_unlit__WEBPACK_IMPORTED_MODULE_5__["KHR_materials_unlit"]; });

/* harmony import */ var _KHR_materials_clearcoat__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./KHR_materials_clearcoat */ "./glTF/2.0/Extensions/KHR_materials_clearcoat.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_clearcoat", function() { return _KHR_materials_clearcoat__WEBPACK_IMPORTED_MODULE_6__["KHR_materials_clearcoat"]; });

/* harmony import */ var _KHR_materials_sheen__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./KHR_materials_sheen */ "./glTF/2.0/Extensions/KHR_materials_sheen.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_sheen", function() { return _KHR_materials_sheen__WEBPACK_IMPORTED_MODULE_7__["KHR_materials_sheen"]; });

/* harmony import */ var _KHR_materials_specular__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./KHR_materials_specular */ "./glTF/2.0/Extensions/KHR_materials_specular.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_specular", function() { return _KHR_materials_specular__WEBPACK_IMPORTED_MODULE_8__["KHR_materials_specular"]; });

/* harmony import */ var _KHR_materials_ior__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./KHR_materials_ior */ "./glTF/2.0/Extensions/KHR_materials_ior.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_ior", function() { return _KHR_materials_ior__WEBPACK_IMPORTED_MODULE_9__["KHR_materials_ior"]; });

/* harmony import */ var _KHR_materials_variants__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./KHR_materials_variants */ "./glTF/2.0/Extensions/KHR_materials_variants.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_variants", function() { return _KHR_materials_variants__WEBPACK_IMPORTED_MODULE_10__["KHR_materials_variants"]; });

/* harmony import */ var _KHR_materials_transmission__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./KHR_materials_transmission */ "./glTF/2.0/Extensions/KHR_materials_transmission.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_transmission", function() { return _KHR_materials_transmission__WEBPACK_IMPORTED_MODULE_11__["KHR_materials_transmission"]; });

/* harmony import */ var _KHR_mesh_quantization__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./KHR_mesh_quantization */ "./glTF/2.0/Extensions/KHR_mesh_quantization.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_mesh_quantization", function() { return _KHR_mesh_quantization__WEBPACK_IMPORTED_MODULE_12__["KHR_mesh_quantization"]; });

/* harmony import */ var _KHR_texture_basisu__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./KHR_texture_basisu */ "./glTF/2.0/Extensions/KHR_texture_basisu.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_texture_basisu", function() { return _KHR_texture_basisu__WEBPACK_IMPORTED_MODULE_13__["KHR_texture_basisu"]; });

/* harmony import */ var _KHR_texture_transform__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./KHR_texture_transform */ "./glTF/2.0/Extensions/KHR_texture_transform.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_texture_transform", function() { return _KHR_texture_transform__WEBPACK_IMPORTED_MODULE_14__["KHR_texture_transform"]; });

/* harmony import */ var _KHR_xmp__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./KHR_xmp */ "./glTF/2.0/Extensions/KHR_xmp.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_xmp", function() { return _KHR_xmp__WEBPACK_IMPORTED_MODULE_15__["KHR_xmp"]; });

/* harmony import */ var _MSFT_audio_emitter__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./MSFT_audio_emitter */ "./glTF/2.0/Extensions/MSFT_audio_emitter.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MSFT_audio_emitter", function() { return _MSFT_audio_emitter__WEBPACK_IMPORTED_MODULE_16__["MSFT_audio_emitter"]; });

/* harmony import */ var _MSFT_lod__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./MSFT_lod */ "./glTF/2.0/Extensions/MSFT_lod.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MSFT_lod", function() { return _MSFT_lod__WEBPACK_IMPORTED_MODULE_17__["MSFT_lod"]; });

/* harmony import */ var _MSFT_minecraftMesh__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./MSFT_minecraftMesh */ "./glTF/2.0/Extensions/MSFT_minecraftMesh.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MSFT_minecraftMesh", function() { return _MSFT_minecraftMesh__WEBPACK_IMPORTED_MODULE_18__["MSFT_minecraftMesh"]; });

/* harmony import */ var _MSFT_sRGBFactors__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./MSFT_sRGBFactors */ "./glTF/2.0/Extensions/MSFT_sRGBFactors.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MSFT_sRGBFactors", function() { return _MSFT_sRGBFactors__WEBPACK_IMPORTED_MODULE_19__["MSFT_sRGBFactors"]; });

/* harmony import */ var _ExtrasAsMetadata__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./ExtrasAsMetadata */ "./glTF/2.0/Extensions/ExtrasAsMetadata.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ExtrasAsMetadata", function() { return _ExtrasAsMetadata__WEBPACK_IMPORTED_MODULE_20__["ExtrasAsMetadata"]; });
























/***/ }),

/***/ "./glTF/2.0/glTFLoader.ts":
/*!********************************!*\
  !*** ./glTF/2.0/glTFLoader.ts ***!
  \********************************/
/*! exports provided: ArrayItem, GLTFLoader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ArrayItem", function() { return ArrayItem; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GLTFLoader", function() { return GLTFLoader; });
/* harmony import */ var babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Misc/deferred */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTFFileLoader */ "./glTF/glTFFileLoader.ts");

























/**
 * Helper class for working with arrays when loading the glTF asset
 */
var ArrayItem = /** @class */ (function () {
    function ArrayItem() {
    }
    /**
     * Gets an item from the given array.
     * @param context The context when loading the asset
     * @param array The array to get the item from
     * @param index The index to the array
     * @returns The array item
     */
    ArrayItem.Get = function (context, array, index) {
        if (!array || index == undefined || !array[index]) {
            throw new Error(context + ": Failed to find index (" + index + ")");
        }
        return array[index];
    };
    /**
     * Assign an `index` field to each item of the given array.
     * @param array The array of items
     */
    ArrayItem.Assign = function (array) {
        if (array) {
            for (var index = 0; index < array.length; index++) {
                array[index].index = index;
            }
        }
    };
    return ArrayItem;
}());

/**
 * The glTF 2.0 loader
 */
var GLTFLoader = /** @class */ (function () {
    /** @hidden */
    function GLTFLoader(parent) {
        /** @hidden */
        this._completePromises = new Array();
        /** @hidden */
        this._forAssetContainer = false;
        /** Storage */
        this._babylonLights = [];
        /** @hidden */
        this._disableInstancedMesh = 0;
        this._disposed = false;
        this._state = null;
        this._extensions = new Array();
        this._defaultBabylonMaterialData = {};
        this._parent = parent;
    }
    /**
     * Registers a loader extension.
     * @param name The name of the loader extension.
     * @param factory The factory function that creates the loader extension.
     */
    GLTFLoader.RegisterExtension = function (name, factory) {
        if (GLTFLoader.UnregisterExtension(name)) {
            babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Logger"].Warn("Extension with the name '" + name + "' already exists");
        }
        GLTFLoader._RegisteredExtensions[name] = {
            factory: factory
        };
    };
    /**
     * Unregisters a loader extension.
     * @param name The name of the loader extension.
     * @returns A boolean indicating whether the extension has been unregistered
     */
    GLTFLoader.UnregisterExtension = function (name) {
        if (!GLTFLoader._RegisteredExtensions[name]) {
            return false;
        }
        delete GLTFLoader._RegisteredExtensions[name];
        return true;
    };
    Object.defineProperty(GLTFLoader.prototype, "state", {
        /**
         * The loader state.
         */
        get: function () {
            return this._state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFLoader.prototype, "gltf", {
        /**
         * The object that represents the glTF JSON.
         */
        get: function () {
            return this._gltf;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFLoader.prototype, "bin", {
        /**
         * The BIN chunk of a binary glTF.
         */
        get: function () {
            return this._bin;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFLoader.prototype, "parent", {
        /**
         * The parent file loader.
         */
        get: function () {
            return this._parent;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFLoader.prototype, "babylonScene", {
        /**
         * The Babylon scene when loading the asset.
         */
        get: function () {
            return this._babylonScene;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFLoader.prototype, "rootBabylonMesh", {
        /**
         * The root Babylon mesh when loading the asset.
         */
        get: function () {
            return this._rootBabylonMesh;
        },
        enumerable: false,
        configurable: true
    });
    /** @hidden */
    GLTFLoader.prototype.dispose = function () {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._completePromises.length = 0;
        for (var name_1 in this._extensions) {
            var extension = this._extensions[name_1];
            extension.dispose && extension.dispose();
            delete this._extensions[name_1];
        }
        delete this._gltf;
        delete this._babylonScene;
        delete this._rootBabylonMesh;
        this._parent.dispose();
    };
    /** @hidden */
    GLTFLoader.prototype.importMeshAsync = function (meshesNames, scene, forAssetContainer, data, rootUrl, onProgress, fileName) {
        var _this = this;
        return Promise.resolve().then(function () {
            _this._babylonScene = scene;
            _this._rootUrl = rootUrl;
            _this._fileName = fileName || "scene";
            _this._forAssetContainer = forAssetContainer;
            _this._loadData(data);
            var nodes = null;
            if (meshesNames) {
                var nodeMap_1 = {};
                if (_this._gltf.nodes) {
                    for (var _i = 0, _a = _this._gltf.nodes; _i < _a.length; _i++) {
                        var node = _a[_i];
                        if (node.name) {
                            nodeMap_1[node.name] = node.index;
                        }
                    }
                }
                var names = (meshesNames instanceof Array) ? meshesNames : [meshesNames];
                nodes = names.map(function (name) {
                    var node = nodeMap_1[name];
                    if (node === undefined) {
                        throw new Error("Failed to find node '" + name + "'");
                    }
                    return node;
                });
            }
            return _this._loadAsync(nodes, function () {
                return {
                    meshes: _this._getMeshes(),
                    particleSystems: [],
                    skeletons: _this._getSkeletons(),
                    animationGroups: _this._getAnimationGroups(),
                    lights: _this._babylonLights,
                    transformNodes: _this._getTransformNodes()
                };
            });
        });
    };
    /** @hidden */
    GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress, fileName) {
        var _this = this;
        return Promise.resolve().then(function () {
            _this._babylonScene = scene;
            _this._rootUrl = rootUrl;
            _this._fileName = fileName || "scene";
            _this._loadData(data);
            return _this._loadAsync(null, function () { return undefined; });
        });
    };
    GLTFLoader.prototype._loadAsync = function (nodes, resultFunc) {
        var _this = this;
        return Promise.resolve().then(function () {
            _this._uniqueRootUrl = (_this._rootUrl.indexOf("file:") === -1 && _this._fileName) ? _this._rootUrl : "" + _this._rootUrl + Date.now() + "/";
            _this._loadExtensions();
            _this._checkExtensions();
            var loadingToReadyCounterName = _glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderState"][_glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderState"].LOADING] + " => " + _glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderState"][_glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderState"].READY];
            var loadingToCompleteCounterName = _glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderState"][_glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderState"].LOADING] + " => " + _glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderState"][_glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderState"].COMPLETE];
            _this._parent._startPerformanceCounter(loadingToReadyCounterName);
            _this._parent._startPerformanceCounter(loadingToCompleteCounterName);
            _this._setState(_glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderState"].LOADING);
            _this._extensionsOnLoading();
            var promises = new Array();
            // Block the marking of materials dirty until the scene is loaded.
            var oldBlockMaterialDirtyMechanism = _this._babylonScene.blockMaterialDirtyMechanism;
            _this._babylonScene.blockMaterialDirtyMechanism = true;
            if (nodes) {
                promises.push(_this.loadSceneAsync("/nodes", { nodes: nodes, index: -1 }));
            }
            else if (_this._gltf.scene != undefined || (_this._gltf.scenes && _this._gltf.scenes[0])) {
                var scene = ArrayItem.Get("/scene", _this._gltf.scenes, _this._gltf.scene || 0);
                promises.push(_this.loadSceneAsync("/scenes/" + scene.index, scene));
            }
            // Restore the blocking of material dirty.
            _this._babylonScene.blockMaterialDirtyMechanism = oldBlockMaterialDirtyMechanism;
            if (_this._parent.compileMaterials) {
                promises.push(_this._compileMaterialsAsync());
            }
            if (_this._parent.compileShadowGenerators) {
                promises.push(_this._compileShadowGeneratorsAsync());
            }
            var resultPromise = Promise.all(promises).then(function () {
                if (_this._rootBabylonMesh) {
                    _this._rootBabylonMesh.setEnabled(true);
                }
                _this._extensionsOnReady();
                _this._setState(_glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderState"].READY);
                _this._startAnimations();
                return resultFunc();
            });
            resultPromise.then(function () {
                _this._parent._endPerformanceCounter(loadingToReadyCounterName);
                babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Tools"].SetImmediate(function () {
                    if (!_this._disposed) {
                        Promise.all(_this._completePromises).then(function () {
                            _this._parent._endPerformanceCounter(loadingToCompleteCounterName);
                            _this._setState(_glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderState"].COMPLETE);
                            _this._parent.onCompleteObservable.notifyObservers(undefined);
                            _this._parent.onCompleteObservable.clear();
                            _this.dispose();
                        }, function (error) {
                            _this._parent.onErrorObservable.notifyObservers(error);
                            _this._parent.onErrorObservable.clear();
                            _this.dispose();
                        });
                    }
                });
            });
            return resultPromise;
        }).catch(function (error) {
            if (!_this._disposed) {
                _this._parent.onErrorObservable.notifyObservers(error);
                _this._parent.onErrorObservable.clear();
                _this.dispose();
            }
            throw error;
        });
    };
    GLTFLoader.prototype._loadData = function (data) {
        this._gltf = data.json;
        this._setupData();
        if (data.bin) {
            var buffers = this._gltf.buffers;
            if (buffers && buffers[0] && !buffers[0].uri) {
                var binaryBuffer = buffers[0];
                if (binaryBuffer.byteLength < data.bin.byteLength - 3 || binaryBuffer.byteLength > data.bin.byteLength) {
                    babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Logger"].Warn("Binary buffer length (" + binaryBuffer.byteLength + ") from JSON does not match chunk length (" + data.bin.byteLength + ")");
                }
                this._bin = data.bin;
            }
            else {
                babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Logger"].Warn("Unexpected BIN chunk");
            }
        }
    };
    GLTFLoader.prototype._setupData = function () {
        ArrayItem.Assign(this._gltf.accessors);
        ArrayItem.Assign(this._gltf.animations);
        ArrayItem.Assign(this._gltf.buffers);
        ArrayItem.Assign(this._gltf.bufferViews);
        ArrayItem.Assign(this._gltf.cameras);
        ArrayItem.Assign(this._gltf.images);
        ArrayItem.Assign(this._gltf.materials);
        ArrayItem.Assign(this._gltf.meshes);
        ArrayItem.Assign(this._gltf.nodes);
        ArrayItem.Assign(this._gltf.samplers);
        ArrayItem.Assign(this._gltf.scenes);
        ArrayItem.Assign(this._gltf.skins);
        ArrayItem.Assign(this._gltf.textures);
        if (this._gltf.nodes) {
            var nodeParents = {};
            for (var _i = 0, _a = this._gltf.nodes; _i < _a.length; _i++) {
                var node = _a[_i];
                if (node.children) {
                    for (var _b = 0, _c = node.children; _b < _c.length; _b++) {
                        var index = _c[_b];
                        nodeParents[index] = node.index;
                    }
                }
            }
            var rootNode = this._createRootNode();
            for (var _d = 0, _e = this._gltf.nodes; _d < _e.length; _d++) {
                var node = _e[_d];
                var parentIndex = nodeParents[node.index];
                node.parent = parentIndex === undefined ? rootNode : this._gltf.nodes[parentIndex];
            }
        }
    };
    GLTFLoader.prototype._loadExtensions = function () {
        for (var name_2 in GLTFLoader._RegisteredExtensions) {
            var extension = GLTFLoader._RegisteredExtensions[name_2].factory(this);
            if (extension.name !== name_2) {
                babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Logger"].Warn("The name of the glTF loader extension instance does not match the registered name: " + extension.name + " !== " + name_2);
            }
            this._extensions.push(extension);
            this._parent.onExtensionLoadedObservable.notifyObservers(extension);
        }
        this._extensions.sort(function (a, b) { return (a.order || Number.MAX_VALUE) - (b.order || Number.MAX_VALUE); });
        this._parent.onExtensionLoadedObservable.clear();
    };
    GLTFLoader.prototype._checkExtensions = function () {
        if (this._gltf.extensionsRequired) {
            var _loop_1 = function (name_3) {
                var available = this_1._extensions.some(function (extension) { return extension.name === name_3 && extension.enabled; });
                if (!available) {
                    throw new Error("Require extension " + name_3 + " is not available");
                }
            };
            var this_1 = this;
            for (var _i = 0, _a = this._gltf.extensionsRequired; _i < _a.length; _i++) {
                var name_3 = _a[_i];
                _loop_1(name_3);
            }
        }
    };
    GLTFLoader.prototype._setState = function (state) {
        this._state = state;
        this.log(_glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderState"][this._state]);
    };
    GLTFLoader.prototype._createRootNode = function () {
        this._babylonScene._blockEntityCollection = this._forAssetContainer;
        this._rootBabylonMesh = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Mesh"]("__root__", this._babylonScene);
        this._babylonScene._blockEntityCollection = false;
        this._rootBabylonMesh.setEnabled(false);
        var rootNode = {
            _babylonTransformNode: this._rootBabylonMesh,
            index: -1
        };
        switch (this._parent.coordinateSystemMode) {
            case _glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderCoordinateSystemMode"].AUTO: {
                if (!this._babylonScene.useRightHandedSystem) {
                    rootNode.rotation = [0, 1, 0, 0];
                    rootNode.scale = [1, 1, -1];
                    GLTFLoader._LoadTransform(rootNode, this._rootBabylonMesh);
                }
                break;
            }
            case _glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderCoordinateSystemMode"].FORCE_RIGHT_HANDED: {
                this._babylonScene.useRightHandedSystem = true;
                break;
            }
            default: {
                throw new Error("Invalid coordinate system mode (" + this._parent.coordinateSystemMode + ")");
            }
        }
        this._parent.onMeshLoadedObservable.notifyObservers(this._rootBabylonMesh);
        return rootNode;
    };
    /**
     * Loads a glTF scene.
     * @param context The context when loading the asset
     * @param scene The glTF scene property
     * @returns A promise that resolves when the load is complete
     */
    GLTFLoader.prototype.loadSceneAsync = function (context, scene) {
        var _this = this;
        var extensionPromise = this._extensionsLoadSceneAsync(context, scene);
        if (extensionPromise) {
            return extensionPromise;
        }
        var promises = new Array();
        this.logOpen(context + " " + (scene.name || ""));
        if (scene.nodes) {
            for (var _i = 0, _a = scene.nodes; _i < _a.length; _i++) {
                var index = _a[_i];
                var node = ArrayItem.Get(context + "/nodes/" + index, this._gltf.nodes, index);
                promises.push(this.loadNodeAsync("/nodes/" + node.index, node, function (babylonMesh) {
                    babylonMesh.parent = _this._rootBabylonMesh;
                }));
            }
        }
        // Link all Babylon bones for each glTF node with the corresponding Babylon transform node.
        // A glTF joint is a pointer to a glTF node in the glTF node hierarchy similar to Unity3D.
        if (this._gltf.nodes) {
            for (var _b = 0, _c = this._gltf.nodes; _b < _c.length; _b++) {
                var node = _c[_b];
                if (node._babylonTransformNode && node._babylonBones) {
                    for (var _d = 0, _e = node._babylonBones; _d < _e.length; _d++) {
                        var babylonBone = _e[_d];
                        babylonBone.linkTransformNode(node._babylonTransformNode);
                    }
                }
            }
        }
        promises.push(this._loadAnimationsAsync());
        this.logClose();
        return Promise.all(promises).then(function () { });
    };
    GLTFLoader.prototype._forEachPrimitive = function (node, callback) {
        if (node._primitiveBabylonMeshes) {
            for (var _i = 0, _a = node._primitiveBabylonMeshes; _i < _a.length; _i++) {
                var babylonMesh = _a[_i];
                callback(babylonMesh);
            }
        }
    };
    GLTFLoader.prototype._getMeshes = function () {
        var meshes = new Array();
        // Root mesh is always first.
        meshes.push(this._rootBabylonMesh);
        var nodes = this._gltf.nodes;
        if (nodes) {
            for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                var node = nodes_1[_i];
                this._forEachPrimitive(node, function (babylonMesh) {
                    meshes.push(babylonMesh);
                });
            }
        }
        return meshes;
    };
    GLTFLoader.prototype._getTransformNodes = function () {
        var transformNodes = new Array();
        var nodes = this._gltf.nodes;
        if (nodes) {
            for (var _i = 0, nodes_2 = nodes; _i < nodes_2.length; _i++) {
                var node = nodes_2[_i];
                if (node._babylonTransformNode && node._babylonTransformNode.getClassName() === "TransformNode") {
                    transformNodes.push(node._babylonTransformNode);
                }
            }
        }
        return transformNodes;
    };
    GLTFLoader.prototype._getSkeletons = function () {
        var skeletons = new Array();
        var skins = this._gltf.skins;
        if (skins) {
            for (var _i = 0, skins_1 = skins; _i < skins_1.length; _i++) {
                var skin = skins_1[_i];
                if (skin._data) {
                    skeletons.push(skin._data.babylonSkeleton);
                }
            }
        }
        return skeletons;
    };
    GLTFLoader.prototype._getAnimationGroups = function () {
        var animationGroups = new Array();
        var animations = this._gltf.animations;
        if (animations) {
            for (var _i = 0, animations_1 = animations; _i < animations_1.length; _i++) {
                var animation = animations_1[_i];
                if (animation._babylonAnimationGroup) {
                    animationGroups.push(animation._babylonAnimationGroup);
                }
            }
        }
        return animationGroups;
    };
    GLTFLoader.prototype._startAnimations = function () {
        switch (this._parent.animationStartMode) {
            case _glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderAnimationStartMode"].NONE: {
                // do nothing
                break;
            }
            case _glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderAnimationStartMode"].FIRST: {
                var babylonAnimationGroups = this._getAnimationGroups();
                if (babylonAnimationGroups.length !== 0) {
                    babylonAnimationGroups[0].start(true);
                }
                break;
            }
            case _glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFLoaderAnimationStartMode"].ALL: {
                var babylonAnimationGroups = this._getAnimationGroups();
                for (var _i = 0, babylonAnimationGroups_1 = babylonAnimationGroups; _i < babylonAnimationGroups_1.length; _i++) {
                    var babylonAnimationGroup = babylonAnimationGroups_1[_i];
                    babylonAnimationGroup.start(true);
                }
                break;
            }
            default: {
                babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Logger"].Error("Invalid animation start mode (" + this._parent.animationStartMode + ")");
                return;
            }
        }
    };
    /**
     * Loads a glTF node.
     * @param context The context when loading the asset
     * @param node The glTF node property
     * @param assign A function called synchronously after parsing the glTF properties
     * @returns A promise that resolves with the loaded Babylon mesh when the load is complete
     */
    GLTFLoader.prototype.loadNodeAsync = function (context, node, assign) {
        var _this = this;
        if (assign === void 0) { assign = function () { }; }
        var extensionPromise = this._extensionsLoadNodeAsync(context, node, assign);
        if (extensionPromise) {
            return extensionPromise;
        }
        if (node._babylonTransformNode) {
            throw new Error(context + ": Invalid recursive node hierarchy");
        }
        var promises = new Array();
        this.logOpen(context + " " + (node.name || ""));
        var loadNode = function (babylonTransformNode) {
            GLTFLoader.AddPointerMetadata(babylonTransformNode, context);
            GLTFLoader._LoadTransform(node, babylonTransformNode);
            if (node.camera != undefined) {
                var camera = ArrayItem.Get(context + "/camera", _this._gltf.cameras, node.camera);
                promises.push(_this.loadCameraAsync("/cameras/" + camera.index, camera, function (babylonCamera) {
                    babylonCamera.parent = babylonTransformNode;
                }));
            }
            if (node.children) {
                for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                    var index = _a[_i];
                    var childNode = ArrayItem.Get(context + "/children/" + index, _this._gltf.nodes, index);
                    promises.push(_this.loadNodeAsync("/nodes/" + childNode.index, childNode, function (childBabylonMesh) {
                        childBabylonMesh.parent = babylonTransformNode;
                    }));
                }
            }
            assign(babylonTransformNode);
        };
        if (node.mesh == undefined) {
            var nodeName = node.name || "node" + node.index;
            this._babylonScene._blockEntityCollection = this._forAssetContainer;
            node._babylonTransformNode = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["TransformNode"](nodeName, this._babylonScene);
            this._babylonScene._blockEntityCollection = false;
            loadNode(node._babylonTransformNode);
        }
        else {
            var mesh = ArrayItem.Get(context + "/mesh", this._gltf.meshes, node.mesh);
            promises.push(this._loadMeshAsync("/meshes/" + mesh.index, node, mesh, loadNode));
        }
        this.logClose();
        return Promise.all(promises).then(function () {
            _this._forEachPrimitive(node, function (babylonMesh) {
                if (babylonMesh.geometry && babylonMesh.geometry.useBoundingInfoFromGeometry) {
                    // simply apply the world matrices to the bounding info - the extends are already ok
                    babylonMesh._updateBoundingInfo();
                }
                else {
                    babylonMesh.refreshBoundingInfo(true);
                }
            });
            return node._babylonTransformNode;
        });
    };
    GLTFLoader.prototype._loadMeshAsync = function (context, node, mesh, assign) {
        var primitives = mesh.primitives;
        if (!primitives || !primitives.length) {
            throw new Error(context + ": Primitives are missing");
        }
        if (primitives[0].index == undefined) {
            ArrayItem.Assign(primitives);
        }
        var promises = new Array();
        this.logOpen(context + " " + (mesh.name || ""));
        var name = node.name || "node" + node.index;
        if (primitives.length === 1) {
            var primitive = mesh.primitives[0];
            promises.push(this._loadMeshPrimitiveAsync(context + "/primitives/" + primitive.index, name, node, mesh, primitive, function (babylonMesh) {
                node._babylonTransformNode = babylonMesh;
                node._primitiveBabylonMeshes = [babylonMesh];
            }));
        }
        else {
            this._babylonScene._blockEntityCollection = this._forAssetContainer;
            node._babylonTransformNode = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["TransformNode"](name, this._babylonScene);
            this._babylonScene._blockEntityCollection = false;
            node._primitiveBabylonMeshes = [];
            for (var _i = 0, primitives_1 = primitives; _i < primitives_1.length; _i++) {
                var primitive = primitives_1[_i];
                promises.push(this._loadMeshPrimitiveAsync(context + "/primitives/" + primitive.index, name + "_primitive" + primitive.index, node, mesh, primitive, function (babylonMesh) {
                    babylonMesh.parent = node._babylonTransformNode;
                    node._primitiveBabylonMeshes.push(babylonMesh);
                }));
            }
        }
        if (node.skin != undefined) {
            var skin = ArrayItem.Get(context + "/skin", this._gltf.skins, node.skin);
            promises.push(this._loadSkinAsync("/skins/" + skin.index, node, skin));
        }
        assign(node._babylonTransformNode);
        this.logClose();
        return Promise.all(promises).then(function () {
            return node._babylonTransformNode;
        });
    };
    /**
     * @hidden Define this method to modify the default behavior when loading data for mesh primitives.
     * @param context The context when loading the asset
     * @param name The mesh name when loading the asset
     * @param node The glTF node when loading the asset
     * @param mesh The glTF mesh when loading the asset
     * @param primitive The glTF mesh primitive property
     * @param assign A function called synchronously after parsing the glTF properties
     * @returns A promise that resolves with the loaded mesh when the load is complete or null if not handled
     */
    GLTFLoader.prototype._loadMeshPrimitiveAsync = function (context, name, node, mesh, primitive, assign) {
        var _this = this;
        var extensionPromise = this._extensionsLoadMeshPrimitiveAsync(context, name, node, mesh, primitive, assign);
        if (extensionPromise) {
            return extensionPromise;
        }
        this.logOpen("" + context);
        var shouldInstance = (this._disableInstancedMesh === 0) && this._parent.createInstances && (node.skin == undefined && !mesh.primitives[0].targets);
        var babylonAbstractMesh;
        var promise;
        if (shouldInstance && primitive._instanceData) {
            babylonAbstractMesh = primitive._instanceData.babylonSourceMesh.createInstance(name);
            promise = primitive._instanceData.promise;
        }
        else {
            var promises = new Array();
            this._babylonScene._blockEntityCollection = this._forAssetContainer;
            var babylonMesh_1 = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Mesh"](name, this._babylonScene);
            this._babylonScene._blockEntityCollection = false;
            babylonMesh_1.overrideMaterialSideOrientation = this._babylonScene.useRightHandedSystem ? babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Material"].CounterClockWiseSideOrientation : babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Material"].ClockWiseSideOrientation;
            this._createMorphTargets(context, node, mesh, primitive, babylonMesh_1);
            promises.push(this._loadVertexDataAsync(context, primitive, babylonMesh_1).then(function (babylonGeometry) {
                return _this._loadMorphTargetsAsync(context, primitive, babylonMesh_1, babylonGeometry).then(function () {
                    babylonGeometry.applyToMesh(babylonMesh_1);
                });
            }));
            var babylonDrawMode = GLTFLoader._GetDrawMode(context, primitive.mode);
            if (primitive.material == undefined) {
                var babylonMaterial = this._defaultBabylonMaterialData[babylonDrawMode];
                if (!babylonMaterial) {
                    babylonMaterial = this._createDefaultMaterial("__GLTFLoader._default", babylonDrawMode);
                    this._parent.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                    this._defaultBabylonMaterialData[babylonDrawMode] = babylonMaterial;
                }
                babylonMesh_1.material = babylonMaterial;
            }
            else {
                var material = ArrayItem.Get(context + "/material", this._gltf.materials, primitive.material);
                promises.push(this._loadMaterialAsync("/materials/" + material.index, material, babylonMesh_1, babylonDrawMode, function (babylonMaterial) {
                    babylonMesh_1.material = babylonMaterial;
                }));
            }
            promise = Promise.all(promises);
            if (shouldInstance) {
                primitive._instanceData = {
                    babylonSourceMesh: babylonMesh_1,
                    promise: promise
                };
            }
            babylonAbstractMesh = babylonMesh_1;
        }
        GLTFLoader.AddPointerMetadata(babylonAbstractMesh, context);
        this._parent.onMeshLoadedObservable.notifyObservers(babylonAbstractMesh);
        assign(babylonAbstractMesh);
        this.logClose();
        return promise.then(function () {
            return babylonAbstractMesh;
        });
    };
    GLTFLoader.prototype._loadVertexDataAsync = function (context, primitive, babylonMesh) {
        var _this = this;
        var extensionPromise = this._extensionsLoadVertexDataAsync(context, primitive, babylonMesh);
        if (extensionPromise) {
            return extensionPromise;
        }
        var attributes = primitive.attributes;
        if (!attributes) {
            throw new Error(context + ": Attributes are missing");
        }
        var promises = new Array();
        var babylonGeometry = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Geometry"](babylonMesh.name, this._babylonScene);
        if (primitive.indices == undefined) {
            babylonMesh.isUnIndexed = true;
        }
        else {
            var accessor = ArrayItem.Get(context + "/indices", this._gltf.accessors, primitive.indices);
            promises.push(this._loadIndicesAccessorAsync("/accessors/" + accessor.index, accessor).then(function (data) {
                babylonGeometry.setIndices(data);
            }));
        }
        var loadAttribute = function (attribute, kind, callback) {
            if (attributes[attribute] == undefined) {
                return;
            }
            babylonMesh._delayInfo = babylonMesh._delayInfo || [];
            if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                babylonMesh._delayInfo.push(kind);
            }
            var accessor = ArrayItem.Get(context + "/attributes/" + attribute, _this._gltf.accessors, attributes[attribute]);
            promises.push(_this._loadVertexAccessorAsync("/accessors/" + accessor.index, accessor, kind).then(function (babylonVertexBuffer) {
                if (babylonVertexBuffer.getKind() === babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].PositionKind && !_this.parent.alwaysComputeBoundingBox && !babylonMesh.skeleton) {
                    var mmin = accessor.min, mmax = accessor.max;
                    if (mmin !== undefined && mmax !== undefined) {
                        var min = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Vector3[0], max = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["TmpVectors"].Vector3[1];
                        min.copyFromFloats.apply(min, mmin);
                        max.copyFromFloats.apply(max, mmax);
                        babylonGeometry._boundingInfo = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["BoundingInfo"](min, max);
                        babylonGeometry.useBoundingInfoFromGeometry = true;
                    }
                }
                babylonGeometry.setVerticesBuffer(babylonVertexBuffer, accessor.count);
            }));
            if (kind == babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].MatricesIndicesExtraKind) {
                babylonMesh.numBoneInfluencers = 8;
            }
            if (callback) {
                callback(accessor);
            }
        };
        loadAttribute("POSITION", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].PositionKind);
        loadAttribute("NORMAL", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].NormalKind);
        loadAttribute("TANGENT", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].TangentKind);
        loadAttribute("TEXCOORD_0", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].UVKind);
        loadAttribute("TEXCOORD_1", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].UV2Kind);
        loadAttribute("JOINTS_0", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].MatricesIndicesKind);
        loadAttribute("WEIGHTS_0", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].MatricesWeightsKind);
        loadAttribute("JOINTS_1", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].MatricesIndicesExtraKind);
        loadAttribute("WEIGHTS_1", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].MatricesWeightsExtraKind);
        loadAttribute("COLOR_0", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].ColorKind, function (accessor) {
            if (accessor.type === "VEC4" /* VEC4 */) {
                babylonMesh.hasVertexAlpha = true;
            }
        });
        return Promise.all(promises).then(function () {
            return babylonGeometry;
        });
    };
    GLTFLoader.prototype._createMorphTargets = function (context, node, mesh, primitive, babylonMesh) {
        if (!primitive.targets) {
            return;
        }
        if (node._numMorphTargets == undefined) {
            node._numMorphTargets = primitive.targets.length;
        }
        else if (primitive.targets.length !== node._numMorphTargets) {
            throw new Error(context + ": Primitives do not have the same number of targets");
        }
        var targetNames = mesh.extras ? mesh.extras.targetNames : null;
        babylonMesh.morphTargetManager = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["MorphTargetManager"](babylonMesh.getScene());
        for (var index = 0; index < primitive.targets.length; index++) {
            var weight = node.weights ? node.weights[index] : mesh.weights ? mesh.weights[index] : 0;
            var name_4 = targetNames ? targetNames[index] : "morphTarget" + index;
            babylonMesh.morphTargetManager.addTarget(new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["MorphTarget"](name_4, weight, babylonMesh.getScene()));
            // TODO: tell the target whether it has positions, normals, tangents
        }
    };
    GLTFLoader.prototype._loadMorphTargetsAsync = function (context, primitive, babylonMesh, babylonGeometry) {
        if (!primitive.targets) {
            return Promise.resolve();
        }
        var promises = new Array();
        var morphTargetManager = babylonMesh.morphTargetManager;
        for (var index = 0; index < morphTargetManager.numTargets; index++) {
            var babylonMorphTarget = morphTargetManager.getTarget(index);
            promises.push(this._loadMorphTargetVertexDataAsync(context + "/targets/" + index, babylonGeometry, primitive.targets[index], babylonMorphTarget));
        }
        return Promise.all(promises).then(function () { });
    };
    GLTFLoader.prototype._loadMorphTargetVertexDataAsync = function (context, babylonGeometry, attributes, babylonMorphTarget) {
        var _this = this;
        var promises = new Array();
        var loadAttribute = function (attribute, kind, setData) {
            if (attributes[attribute] == undefined) {
                return;
            }
            var babylonVertexBuffer = babylonGeometry.getVertexBuffer(kind);
            if (!babylonVertexBuffer) {
                return;
            }
            var accessor = ArrayItem.Get(context + "/" + attribute, _this._gltf.accessors, attributes[attribute]);
            promises.push(_this._loadFloatAccessorAsync("/accessors/" + accessor.index, accessor).then(function (data) {
                setData(babylonVertexBuffer, data);
            }));
        };
        loadAttribute("POSITION", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].PositionKind, function (babylonVertexBuffer, data) {
            var positions = new Float32Array(data.length);
            babylonVertexBuffer.forEach(data.length, function (value, index) {
                positions[index] = data[index] + value;
            });
            babylonMorphTarget.setPositions(positions);
        });
        loadAttribute("NORMAL", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].NormalKind, function (babylonVertexBuffer, data) {
            var normals = new Float32Array(data.length);
            babylonVertexBuffer.forEach(normals.length, function (value, index) {
                normals[index] = data[index] + value;
            });
            babylonMorphTarget.setNormals(normals);
        });
        loadAttribute("TANGENT", babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].TangentKind, function (babylonVertexBuffer, data) {
            var tangents = new Float32Array(data.length / 3 * 4);
            var dataIndex = 0;
            babylonVertexBuffer.forEach(data.length / 3 * 4, function (value, index) {
                // Tangent data for morph targets is stored as xyz delta.
                // The vertexData.tangent is stored as xyzw.
                // So we need to skip every fourth vertexData.tangent.
                if (((index + 1) % 4) !== 0) {
                    tangents[dataIndex] = data[dataIndex] + value;
                    dataIndex++;
                }
            });
            babylonMorphTarget.setTangents(tangents);
        });
        return Promise.all(promises).then(function () { });
    };
    GLTFLoader._LoadTransform = function (node, babylonNode) {
        // Ignore the TRS of skinned nodes.
        // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
        if (node.skin != undefined) {
            return;
        }
        var position = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero();
        var rotation = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].Identity();
        var scaling = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Vector3"].One();
        if (node.matrix) {
            var matrix = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Matrix"].FromArray(node.matrix);
            matrix.decompose(scaling, rotation, position);
        }
        else {
            if (node.translation) {
                position = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromArray(node.translation);
            }
            if (node.rotation) {
                rotation = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray(node.rotation);
            }
            if (node.scale) {
                scaling = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromArray(node.scale);
            }
        }
        babylonNode.position = position;
        babylonNode.rotationQuaternion = rotation;
        babylonNode.scaling = scaling;
    };
    GLTFLoader.prototype._loadSkinAsync = function (context, node, skin) {
        var _this = this;
        var extensionPromise = this._extensionsLoadSkinAsync(context, node, skin);
        if (extensionPromise) {
            return extensionPromise;
        }
        var assignSkeleton = function (skeleton) {
            _this._forEachPrimitive(node, function (babylonMesh) {
                babylonMesh.skeleton = skeleton;
            });
        };
        if (skin._data) {
            assignSkeleton(skin._data.babylonSkeleton);
            return skin._data.promise;
        }
        var skeletonId = "skeleton" + skin.index;
        this._babylonScene._blockEntityCollection = this._forAssetContainer;
        var babylonSkeleton = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Skeleton"](skin.name || skeletonId, skeletonId, this._babylonScene);
        this._babylonScene._blockEntityCollection = false;
        // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
        babylonSkeleton.overrideMesh = this._rootBabylonMesh;
        this._loadBones(context, skin, babylonSkeleton);
        assignSkeleton(babylonSkeleton);
        var promise = this._loadSkinInverseBindMatricesDataAsync(context, skin).then(function (inverseBindMatricesData) {
            _this._updateBoneMatrices(babylonSkeleton, inverseBindMatricesData);
        });
        skin._data = {
            babylonSkeleton: babylonSkeleton,
            promise: promise
        };
        return promise;
    };
    GLTFLoader.prototype._loadBones = function (context, skin, babylonSkeleton) {
        var babylonBones = {};
        for (var _i = 0, _a = skin.joints; _i < _a.length; _i++) {
            var index = _a[_i];
            var node = ArrayItem.Get(context + "/joints/" + index, this._gltf.nodes, index);
            this._loadBone(node, skin, babylonSkeleton, babylonBones);
        }
    };
    GLTFLoader.prototype._loadBone = function (node, skin, babylonSkeleton, babylonBones) {
        var babylonBone = babylonBones[node.index];
        if (babylonBone) {
            return babylonBone;
        }
        var babylonParentBone = null;
        if (node.parent && node.parent._babylonTransformNode !== this._rootBabylonMesh) {
            babylonParentBone = this._loadBone(node.parent, skin, babylonSkeleton, babylonBones);
        }
        var boneIndex = skin.joints.indexOf(node.index);
        babylonBone = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Bone"](node.name || "joint" + node.index, babylonSkeleton, babylonParentBone, this._getNodeMatrix(node), null, null, boneIndex);
        babylonBones[node.index] = babylonBone;
        node._babylonBones = node._babylonBones || [];
        node._babylonBones.push(babylonBone);
        return babylonBone;
    };
    GLTFLoader.prototype._loadSkinInverseBindMatricesDataAsync = function (context, skin) {
        if (skin.inverseBindMatrices == undefined) {
            return Promise.resolve(null);
        }
        var accessor = ArrayItem.Get(context + "/inverseBindMatrices", this._gltf.accessors, skin.inverseBindMatrices);
        return this._loadFloatAccessorAsync("/accessors/" + accessor.index, accessor);
    };
    GLTFLoader.prototype._updateBoneMatrices = function (babylonSkeleton, inverseBindMatricesData) {
        for (var _i = 0, _a = babylonSkeleton.bones; _i < _a.length; _i++) {
            var babylonBone = _a[_i];
            var baseMatrix = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Matrix"].Identity();
            var boneIndex = babylonBone._index;
            if (inverseBindMatricesData && boneIndex !== -1) {
                babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Matrix"].FromArrayToRef(inverseBindMatricesData, boneIndex * 16, baseMatrix);
                baseMatrix.invertToRef(baseMatrix);
            }
            var babylonParentBone = babylonBone.getParent();
            if (babylonParentBone) {
                baseMatrix.multiplyToRef(babylonParentBone.getInvertedAbsoluteTransform(), baseMatrix);
            }
            babylonBone.setRestPose(baseMatrix);
            babylonBone.updateMatrix(baseMatrix, false, false);
            babylonBone._updateDifferenceMatrix(undefined, false);
        }
    };
    GLTFLoader.prototype._getNodeMatrix = function (node) {
        return node.matrix ?
            babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Matrix"].FromArray(node.matrix) :
            babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Matrix"].Compose(node.scale ? babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromArray(node.scale) : babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Vector3"].One(), node.rotation ? babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray(node.rotation) : babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].Identity(), node.translation ? babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromArray(node.translation) : babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero());
    };
    /**
     * Loads a glTF camera.
     * @param context The context when loading the asset
     * @param camera The glTF camera property
     * @param assign A function called synchronously after parsing the glTF properties
     * @returns A promise that resolves with the loaded Babylon camera when the load is complete
     */
    GLTFLoader.prototype.loadCameraAsync = function (context, camera, assign) {
        if (assign === void 0) { assign = function () { }; }
        var extensionPromise = this._extensionsLoadCameraAsync(context, camera, assign);
        if (extensionPromise) {
            return extensionPromise;
        }
        var promises = new Array();
        this.logOpen(context + " " + (camera.name || ""));
        this._babylonScene._blockEntityCollection = this._forAssetContainer;
        var babylonCamera = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["FreeCamera"](camera.name || "camera" + camera.index, babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Vector3"].Zero(), this._babylonScene, false);
        this._babylonScene._blockEntityCollection = false;
        babylonCamera.ignoreParentScaling = true;
        babylonCamera.rotation = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Vector3"](0, Math.PI, 0);
        switch (camera.type) {
            case "perspective" /* PERSPECTIVE */: {
                var perspective = camera.perspective;
                if (!perspective) {
                    throw new Error(context + ": Camera perspective properties are missing");
                }
                babylonCamera.fov = perspective.yfov;
                babylonCamera.minZ = perspective.znear;
                babylonCamera.maxZ = perspective.zfar || Number.MAX_VALUE;
                break;
            }
            case "orthographic" /* ORTHOGRAPHIC */: {
                if (!camera.orthographic) {
                    throw new Error(context + ": Camera orthographic properties are missing");
                }
                babylonCamera.mode = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Camera"].ORTHOGRAPHIC_CAMERA;
                babylonCamera.orthoLeft = -camera.orthographic.xmag;
                babylonCamera.orthoRight = camera.orthographic.xmag;
                babylonCamera.orthoBottom = -camera.orthographic.ymag;
                babylonCamera.orthoTop = camera.orthographic.ymag;
                babylonCamera.minZ = camera.orthographic.znear;
                babylonCamera.maxZ = camera.orthographic.zfar;
                break;
            }
            default: {
                throw new Error(context + ": Invalid camera type (" + camera.type + ")");
            }
        }
        GLTFLoader.AddPointerMetadata(babylonCamera, context);
        this._parent.onCameraLoadedObservable.notifyObservers(babylonCamera);
        assign(babylonCamera);
        this.logClose();
        return Promise.all(promises).then(function () {
            return babylonCamera;
        });
    };
    GLTFLoader.prototype._loadAnimationsAsync = function () {
        var animations = this._gltf.animations;
        if (!animations) {
            return Promise.resolve();
        }
        var promises = new Array();
        for (var index = 0; index < animations.length; index++) {
            var animation = animations[index];
            promises.push(this.loadAnimationAsync("/animations/" + animation.index, animation));
        }
        return Promise.all(promises).then(function () { });
    };
    /**
     * Loads a glTF animation.
     * @param context The context when loading the asset
     * @param animation The glTF animation property
     * @returns A promise that resolves with the loaded Babylon animation group when the load is complete
     */
    GLTFLoader.prototype.loadAnimationAsync = function (context, animation) {
        var promise = this._extensionsLoadAnimationAsync(context, animation);
        if (promise) {
            return promise;
        }
        this._babylonScene._blockEntityCollection = this._forAssetContainer;
        var babylonAnimationGroup = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["AnimationGroup"](animation.name || "animation" + animation.index, this._babylonScene);
        this._babylonScene._blockEntityCollection = false;
        animation._babylonAnimationGroup = babylonAnimationGroup;
        var promises = new Array();
        ArrayItem.Assign(animation.channels);
        ArrayItem.Assign(animation.samplers);
        for (var _i = 0, _a = animation.channels; _i < _a.length; _i++) {
            var channel = _a[_i];
            promises.push(this._loadAnimationChannelAsync(context + "/channels/" + channel.index, context, animation, channel, babylonAnimationGroup));
        }
        return Promise.all(promises).then(function () {
            babylonAnimationGroup.normalize(0);
            return babylonAnimationGroup;
        });
    };
    /**
     * @hidden Loads a glTF animation channel.
     * @param context The context when loading the asset
     * @param animationContext The context of the animation when loading the asset
     * @param animation The glTF animation property
     * @param channel The glTF animation channel property
     * @param babylonAnimationGroup The babylon animation group property
     * @param animationTargetOverride The babylon animation channel target override property. My be null.
     * @returns A void promise when the channel load is complete
     */
    GLTFLoader.prototype._loadAnimationChannelAsync = function (context, animationContext, animation, channel, babylonAnimationGroup, animationTargetOverride) {
        var _this = this;
        if (animationTargetOverride === void 0) { animationTargetOverride = null; }
        if (channel.target.node == undefined) {
            return Promise.resolve();
        }
        var targetNode = ArrayItem.Get(context + "/target/node", this._gltf.nodes, channel.target.node);
        // Ignore animations that have no animation targets.
        if ((channel.target.path === "weights" /* WEIGHTS */ && !targetNode._numMorphTargets) ||
            (channel.target.path !== "weights" /* WEIGHTS */ && !targetNode._babylonTransformNode)) {
            return Promise.resolve();
        }
        var sampler = ArrayItem.Get(context + "/sampler", animation.samplers, channel.sampler);
        return this._loadAnimationSamplerAsync(animationContext + "/samplers/" + channel.sampler, sampler).then(function (data) {
            var targetPath;
            var animationType;
            switch (channel.target.path) {
                case "translation" /* TRANSLATION */: {
                    targetPath = "position";
                    animationType = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Animation"].ANIMATIONTYPE_VECTOR3;
                    break;
                }
                case "rotation" /* ROTATION */: {
                    targetPath = "rotationQuaternion";
                    animationType = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Animation"].ANIMATIONTYPE_QUATERNION;
                    break;
                }
                case "scale" /* SCALE */: {
                    targetPath = "scaling";
                    animationType = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Animation"].ANIMATIONTYPE_VECTOR3;
                    break;
                }
                case "weights" /* WEIGHTS */: {
                    targetPath = "influence";
                    animationType = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Animation"].ANIMATIONTYPE_FLOAT;
                    break;
                }
                default: {
                    throw new Error(context + "/target/path: Invalid value (" + channel.target.path + ")");
                }
            }
            var outputBufferOffset = 0;
            var getNextOutputValue;
            switch (targetPath) {
                case "position": {
                    getNextOutputValue = function () {
                        var value = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromArray(data.output, outputBufferOffset);
                        outputBufferOffset += 3;
                        return value;
                    };
                    break;
                }
                case "rotationQuaternion": {
                    getNextOutputValue = function () {
                        var value = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Quaternion"].FromArray(data.output, outputBufferOffset);
                        outputBufferOffset += 4;
                        return value;
                    };
                    break;
                }
                case "scaling": {
                    getNextOutputValue = function () {
                        var value = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Vector3"].FromArray(data.output, outputBufferOffset);
                        outputBufferOffset += 3;
                        return value;
                    };
                    break;
                }
                case "influence": {
                    getNextOutputValue = function () {
                        var value = new Array(targetNode._numMorphTargets);
                        for (var i = 0; i < targetNode._numMorphTargets; i++) {
                            value[i] = data.output[outputBufferOffset++];
                        }
                        return value;
                    };
                    break;
                }
            }
            var getNextKey;
            switch (data.interpolation) {
                case "STEP" /* STEP */: {
                    getNextKey = function (frameIndex) { return ({
                        frame: data.input[frameIndex],
                        value: getNextOutputValue(),
                        interpolation: babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["AnimationKeyInterpolation"].STEP
                    }); };
                    break;
                }
                case "LINEAR" /* LINEAR */: {
                    getNextKey = function (frameIndex) { return ({
                        frame: data.input[frameIndex],
                        value: getNextOutputValue()
                    }); };
                    break;
                }
                case "CUBICSPLINE" /* CUBICSPLINE */: {
                    getNextKey = function (frameIndex) { return ({
                        frame: data.input[frameIndex],
                        inTangent: getNextOutputValue(),
                        value: getNextOutputValue(),
                        outTangent: getNextOutputValue()
                    }); };
                    break;
                }
            }
            var keys = new Array(data.input.length);
            for (var frameIndex = 0; frameIndex < data.input.length; frameIndex++) {
                keys[frameIndex] = getNextKey(frameIndex);
            }
            if (targetPath === "influence") {
                var _loop_2 = function (targetIndex) {
                    var animationName = babylonAnimationGroup.name + "_channel" + babylonAnimationGroup.targetedAnimations.length;
                    var babylonAnimation = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Animation"](animationName, targetPath, 1, animationType);
                    babylonAnimation.setKeys(keys.map(function (key) { return ({
                        frame: key.frame,
                        inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                        value: key.value[targetIndex],
                        outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined
                    }); }));
                    _this._forEachPrimitive(targetNode, function (babylonAbstractMesh) {
                        var babylonMesh = babylonAbstractMesh;
                        var morphTarget = babylonMesh.morphTargetManager.getTarget(targetIndex);
                        var babylonAnimationClone = babylonAnimation.clone();
                        morphTarget.animations.push(babylonAnimationClone);
                        babylonAnimationGroup.addTargetedAnimation(babylonAnimationClone, morphTarget);
                    });
                };
                for (var targetIndex = 0; targetIndex < targetNode._numMorphTargets; targetIndex++) {
                    _loop_2(targetIndex);
                }
            }
            else {
                var animationName = babylonAnimationGroup.name + "_channel" + babylonAnimationGroup.targetedAnimations.length;
                var babylonAnimation = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Animation"](animationName, targetPath, 1, animationType);
                babylonAnimation.setKeys(keys);
                if (animationTargetOverride != null && animationTargetOverride.animations != null) {
                    animationTargetOverride.animations.push(babylonAnimation);
                    babylonAnimationGroup.addTargetedAnimation(babylonAnimation, animationTargetOverride);
                }
                else {
                    targetNode._babylonTransformNode.animations.push(babylonAnimation);
                    babylonAnimationGroup.addTargetedAnimation(babylonAnimation, targetNode._babylonTransformNode);
                }
            }
        });
    };
    GLTFLoader.prototype._loadAnimationSamplerAsync = function (context, sampler) {
        if (sampler._data) {
            return sampler._data;
        }
        var interpolation = sampler.interpolation || "LINEAR" /* LINEAR */;
        switch (interpolation) {
            case "STEP" /* STEP */:
            case "LINEAR" /* LINEAR */:
            case "CUBICSPLINE" /* CUBICSPLINE */: {
                break;
            }
            default: {
                throw new Error(context + "/interpolation: Invalid value (" + sampler.interpolation + ")");
            }
        }
        var inputAccessor = ArrayItem.Get(context + "/input", this._gltf.accessors, sampler.input);
        var outputAccessor = ArrayItem.Get(context + "/output", this._gltf.accessors, sampler.output);
        sampler._data = Promise.all([
            this._loadFloatAccessorAsync("/accessors/" + inputAccessor.index, inputAccessor),
            this._loadFloatAccessorAsync("/accessors/" + outputAccessor.index, outputAccessor)
        ]).then(function (_a) {
            var inputData = _a[0], outputData = _a[1];
            return {
                input: inputData,
                interpolation: interpolation,
                output: outputData,
            };
        });
        return sampler._data;
    };
    GLTFLoader.prototype._loadBufferAsync = function (context, buffer, byteOffset, byteLength) {
        var extensionPromise = this._extensionsLoadBufferAsync(context, buffer, byteOffset, byteLength);
        if (extensionPromise) {
            return extensionPromise;
        }
        if (!buffer._data) {
            if (buffer.uri) {
                buffer._data = this.loadUriAsync(context + "/uri", buffer, buffer.uri);
            }
            else {
                if (!this._bin) {
                    throw new Error(context + ": Uri is missing or the binary glTF is missing its binary chunk");
                }
                buffer._data = this._bin.readAsync(0, buffer.byteLength);
            }
        }
        return buffer._data.then(function (data) {
            try {
                return new Uint8Array(data.buffer, data.byteOffset + byteOffset, byteLength);
            }
            catch (e) {
                throw new Error(context + ": " + e.message);
            }
        });
    };
    /**
     * Loads a glTF buffer view.
     * @param context The context when loading the asset
     * @param bufferView The glTF buffer view property
     * @returns A promise that resolves with the loaded data when the load is complete
     */
    GLTFLoader.prototype.loadBufferViewAsync = function (context, bufferView) {
        var extensionPromise = this._extensionsLoadBufferViewAsync(context, bufferView);
        if (extensionPromise) {
            return extensionPromise;
        }
        if (bufferView._data) {
            return bufferView._data;
        }
        var buffer = ArrayItem.Get(context + "/buffer", this._gltf.buffers, bufferView.buffer);
        bufferView._data = this._loadBufferAsync("/buffers/" + buffer.index, buffer, (bufferView.byteOffset || 0), bufferView.byteLength);
        return bufferView._data;
    };
    GLTFLoader.prototype._loadAccessorAsync = function (context, accessor, constructor) {
        var _this = this;
        if (accessor._data) {
            return accessor._data;
        }
        var numComponents = GLTFLoader._GetNumComponents(context, accessor.type);
        var byteStride = numComponents * babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].GetTypeByteLength(accessor.componentType);
        var length = numComponents * accessor.count;
        if (accessor.bufferView == undefined) {
            accessor._data = Promise.resolve(new constructor(length));
        }
        else {
            var bufferView_1 = ArrayItem.Get(context + "/bufferView", this._gltf.bufferViews, accessor.bufferView);
            accessor._data = this.loadBufferViewAsync("/bufferViews/" + bufferView_1.index, bufferView_1).then(function (data) {
                if (accessor.componentType === 5126 /* FLOAT */ && !accessor.normalized) {
                    return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, length);
                }
                else {
                    var typedArray_1 = new constructor(length);
                    babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].ForEach(data, accessor.byteOffset || 0, bufferView_1.byteStride || byteStride, numComponents, accessor.componentType, typedArray_1.length, accessor.normalized || false, function (value, index) {
                        typedArray_1[index] = value;
                    });
                    return typedArray_1;
                }
            });
        }
        if (accessor.sparse) {
            var sparse_1 = accessor.sparse;
            accessor._data = accessor._data.then(function (data) {
                var typedArray = data;
                var indicesBufferView = ArrayItem.Get(context + "/sparse/indices/bufferView", _this._gltf.bufferViews, sparse_1.indices.bufferView);
                var valuesBufferView = ArrayItem.Get(context + "/sparse/values/bufferView", _this._gltf.bufferViews, sparse_1.values.bufferView);
                return Promise.all([
                    _this.loadBufferViewAsync("/bufferViews/" + indicesBufferView.index, indicesBufferView),
                    _this.loadBufferViewAsync("/bufferViews/" + valuesBufferView.index, valuesBufferView)
                ]).then(function (_a) {
                    var indicesData = _a[0], valuesData = _a[1];
                    var indices = GLTFLoader._GetTypedArray(context + "/sparse/indices", sparse_1.indices.componentType, indicesData, sparse_1.indices.byteOffset, sparse_1.count);
                    var sparseLength = numComponents * sparse_1.count;
                    var values;
                    if (accessor.componentType === 5126 /* FLOAT */ && !accessor.normalized) {
                        values = GLTFLoader._GetTypedArray(context + "/sparse/values", accessor.componentType, valuesData, sparse_1.values.byteOffset, sparseLength);
                    }
                    else {
                        var sparseData = GLTFLoader._GetTypedArray(context + "/sparse/values", accessor.componentType, valuesData, sparse_1.values.byteOffset, sparseLength);
                        values = new constructor(sparseLength);
                        babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].ForEach(sparseData, 0, byteStride, numComponents, accessor.componentType, values.length, accessor.normalized || false, function (value, index) {
                            values[index] = value;
                        });
                    }
                    var valuesIndex = 0;
                    for (var indicesIndex = 0; indicesIndex < indices.length; indicesIndex++) {
                        var dataIndex = indices[indicesIndex] * numComponents;
                        for (var componentIndex = 0; componentIndex < numComponents; componentIndex++) {
                            typedArray[dataIndex++] = values[valuesIndex++];
                        }
                    }
                    return typedArray;
                });
            });
        }
        return accessor._data;
    };
    /** @hidden */
    GLTFLoader.prototype._loadFloatAccessorAsync = function (context, accessor) {
        return this._loadAccessorAsync(context, accessor, Float32Array);
    };
    GLTFLoader.prototype._loadIndicesAccessorAsync = function (context, accessor) {
        if (accessor.type !== "SCALAR" /* SCALAR */) {
            throw new Error(context + "/type: Invalid value " + accessor.type);
        }
        if (accessor.componentType !== 5121 /* UNSIGNED_BYTE */ &&
            accessor.componentType !== 5123 /* UNSIGNED_SHORT */ &&
            accessor.componentType !== 5125 /* UNSIGNED_INT */) {
            throw new Error(context + "/componentType: Invalid value " + accessor.componentType);
        }
        if (accessor._data) {
            return accessor._data;
        }
        if (accessor.sparse) {
            var constructor = GLTFLoader._GetTypedArrayConstructor(context + "/componentType", accessor.componentType);
            accessor._data = this._loadAccessorAsync(context, accessor, constructor);
        }
        else {
            var bufferView = ArrayItem.Get(context + "/bufferView", this._gltf.bufferViews, accessor.bufferView);
            accessor._data = this.loadBufferViewAsync("/bufferViews/" + bufferView.index, bufferView).then(function (data) {
                return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, accessor.count);
            });
        }
        return accessor._data;
    };
    GLTFLoader.prototype._loadVertexBufferViewAsync = function (bufferView, kind) {
        var _this = this;
        if (bufferView._babylonBuffer) {
            return bufferView._babylonBuffer;
        }
        bufferView._babylonBuffer = this.loadBufferViewAsync("/bufferViews/" + bufferView.index, bufferView).then(function (data) {
            return new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Buffer"](_this._babylonScene.getEngine(), data, false);
        });
        return bufferView._babylonBuffer;
    };
    GLTFLoader.prototype._loadVertexAccessorAsync = function (context, accessor, kind) {
        var _this = this;
        if (accessor._babylonVertexBuffer) {
            return accessor._babylonVertexBuffer;
        }
        if (accessor.sparse) {
            accessor._babylonVertexBuffer = this._loadFloatAccessorAsync("/accessors/" + accessor.index, accessor).then(function (data) {
                return new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"](_this._babylonScene.getEngine(), data, kind, false);
            });
        }
        // HACK: If byte offset is not a multiple of component type byte length then load as a float array instead of using Babylon buffers.
        else if (accessor.byteOffset && accessor.byteOffset % babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].GetTypeByteLength(accessor.componentType) !== 0) {
            babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Logger"].Warn("Accessor byte offset is not a multiple of component type byte length");
            accessor._babylonVertexBuffer = this._loadFloatAccessorAsync("/accessors/" + accessor.index, accessor).then(function (data) {
                return new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"](_this._babylonScene.getEngine(), data, kind, false);
            });
        }
        // Load joint indices as a float array since the shaders expect float data but glTF uses unsigned byte/short.
        // This prevents certain platforms (e.g. D3D) from having to convert the data to float on the fly.
        else if (kind === babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].MatricesIndicesKind || kind === babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"].MatricesIndicesExtraKind) {
            accessor._babylonVertexBuffer = this._loadFloatAccessorAsync("/accessors/" + accessor.index, accessor).then(function (data) {
                return new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"](_this._babylonScene.getEngine(), data, kind, false);
            });
        }
        else {
            var bufferView_2 = ArrayItem.Get(context + "/bufferView", this._gltf.bufferViews, accessor.bufferView);
            accessor._babylonVertexBuffer = this._loadVertexBufferViewAsync(bufferView_2, kind).then(function (babylonBuffer) {
                var size = GLTFLoader._GetNumComponents(context, accessor.type);
                return new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["VertexBuffer"](_this._babylonScene.getEngine(), babylonBuffer, kind, false, false, bufferView_2.byteStride, false, accessor.byteOffset, size, accessor.componentType, accessor.normalized, true);
            });
        }
        return accessor._babylonVertexBuffer;
    };
    GLTFLoader.prototype._loadMaterialMetallicRoughnessPropertiesAsync = function (context, properties, babylonMaterial) {
        if (!(babylonMaterial instanceof babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"])) {
            throw new Error(context + ": Material type not supported");
        }
        var promises = new Array();
        if (properties) {
            if (properties.baseColorFactor) {
                babylonMaterial.albedoColor = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromArray(properties.baseColorFactor);
                babylonMaterial.alpha = properties.baseColorFactor[3];
            }
            else {
                babylonMaterial.albedoColor = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Color3"].White();
            }
            babylonMaterial.metallic = properties.metallicFactor == undefined ? 1 : properties.metallicFactor;
            babylonMaterial.roughness = properties.roughnessFactor == undefined ? 1 : properties.roughnessFactor;
            if (properties.baseColorTexture) {
                promises.push(this.loadTextureInfoAsync(context + "/baseColorTexture", properties.baseColorTexture, function (texture) {
                    texture.name = babylonMaterial.name + " (Base Color)";
                    babylonMaterial.albedoTexture = texture;
                }));
            }
            if (properties.metallicRoughnessTexture) {
                promises.push(this.loadTextureInfoAsync(context + "/metallicRoughnessTexture", properties.metallicRoughnessTexture, function (texture) {
                    texture.name = babylonMaterial.name + " (Metallic Roughness)";
                    babylonMaterial.metallicTexture = texture;
                }));
                babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
            }
        }
        return Promise.all(promises).then(function () { });
    };
    /** @hidden */
    GLTFLoader.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
        if (assign === void 0) { assign = function () { }; }
        var extensionPromise = this._extensionsLoadMaterialAsync(context, material, babylonMesh, babylonDrawMode, assign);
        if (extensionPromise) {
            return extensionPromise;
        }
        material._data = material._data || {};
        var babylonData = material._data[babylonDrawMode];
        if (!babylonData) {
            this.logOpen(context + " " + (material.name || ""));
            var babylonMaterial = this.createMaterial(context, material, babylonDrawMode);
            babylonData = {
                babylonMaterial: babylonMaterial,
                babylonMeshes: [],
                promise: this.loadMaterialPropertiesAsync(context, material, babylonMaterial)
            };
            material._data[babylonDrawMode] = babylonData;
            GLTFLoader.AddPointerMetadata(babylonMaterial, context);
            this._parent.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
            this.logClose();
        }
        babylonData.babylonMeshes.push(babylonMesh);
        babylonMesh.onDisposeObservable.addOnce(function () {
            var index = babylonData.babylonMeshes.indexOf(babylonMesh);
            if (index !== -1) {
                babylonData.babylonMeshes.splice(index, 1);
            }
        });
        assign(babylonData.babylonMaterial);
        return babylonData.promise.then(function () {
            return babylonData.babylonMaterial;
        });
    };
    GLTFLoader.prototype._createDefaultMaterial = function (name, babylonDrawMode) {
        this._babylonScene._blockEntityCollection = this._forAssetContainer;
        var babylonMaterial = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"](name, this._babylonScene);
        this._babylonScene._blockEntityCollection = false;
        // Moved to mesh so user can change materials on gltf meshes: babylonMaterial.sideOrientation = this._babylonScene.useRightHandedSystem ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
        babylonMaterial.fillMode = babylonDrawMode;
        babylonMaterial.enableSpecularAntiAliasing = true;
        babylonMaterial.useRadianceOverAlpha = !this._parent.transparencyAsCoverage;
        babylonMaterial.useSpecularOverAlpha = !this._parent.transparencyAsCoverage;
        babylonMaterial.transparencyMode = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"].PBRMATERIAL_OPAQUE;
        babylonMaterial.metallic = 1;
        babylonMaterial.roughness = 1;
        return babylonMaterial;
    };
    /**
     * Creates a Babylon material from a glTF material.
     * @param context The context when loading the asset
     * @param material The glTF material property
     * @param babylonDrawMode The draw mode for the Babylon material
     * @returns The Babylon material
     */
    GLTFLoader.prototype.createMaterial = function (context, material, babylonDrawMode) {
        var extensionPromise = this._extensionsCreateMaterial(context, material, babylonDrawMode);
        if (extensionPromise) {
            return extensionPromise;
        }
        var name = material.name || "material" + material.index;
        var babylonMaterial = this._createDefaultMaterial(name, babylonDrawMode);
        return babylonMaterial;
    };
    /**
     * Loads properties from a glTF material into a Babylon material.
     * @param context The context when loading the asset
     * @param material The glTF material property
     * @param babylonMaterial The Babylon material
     * @returns A promise that resolves when the load is complete
     */
    GLTFLoader.prototype.loadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
        var extensionPromise = this._extensionsLoadMaterialPropertiesAsync(context, material, babylonMaterial);
        if (extensionPromise) {
            return extensionPromise;
        }
        var promises = new Array();
        promises.push(this.loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
        if (material.pbrMetallicRoughness) {
            promises.push(this._loadMaterialMetallicRoughnessPropertiesAsync(context + "/pbrMetallicRoughness", material.pbrMetallicRoughness, babylonMaterial));
        }
        this.loadMaterialAlphaProperties(context, material, babylonMaterial);
        return Promise.all(promises).then(function () { });
    };
    /**
     * Loads the normal, occlusion, and emissive properties from a glTF material into a Babylon material.
     * @param context The context when loading the asset
     * @param material The glTF material property
     * @param babylonMaterial The Babylon material
     * @returns A promise that resolves when the load is complete
     */
    GLTFLoader.prototype.loadMaterialBasePropertiesAsync = function (context, material, babylonMaterial) {
        if (!(babylonMaterial instanceof babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"])) {
            throw new Error(context + ": Material type not supported");
        }
        var promises = new Array();
        babylonMaterial.emissiveColor = material.emissiveFactor ? babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Color3"].FromArray(material.emissiveFactor) : new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Color3"](0, 0, 0);
        if (material.doubleSided) {
            babylonMaterial.backFaceCulling = false;
            babylonMaterial.twoSidedLighting = true;
        }
        if (material.normalTexture) {
            promises.push(this.loadTextureInfoAsync(context + "/normalTexture", material.normalTexture, function (texture) {
                texture.name = babylonMaterial.name + " (Normal)";
                babylonMaterial.bumpTexture = texture;
            }));
            babylonMaterial.invertNormalMapX = !this._babylonScene.useRightHandedSystem;
            babylonMaterial.invertNormalMapY = this._babylonScene.useRightHandedSystem;
            if (material.normalTexture.scale != undefined) {
                babylonMaterial.bumpTexture.level = material.normalTexture.scale;
            }
            babylonMaterial.forceIrradianceInFragment = true;
        }
        if (material.occlusionTexture) {
            promises.push(this.loadTextureInfoAsync(context + "/occlusionTexture", material.occlusionTexture, function (texture) {
                texture.name = babylonMaterial.name + " (Occlusion)";
                babylonMaterial.ambientTexture = texture;
            }));
            babylonMaterial.useAmbientInGrayScale = true;
            if (material.occlusionTexture.strength != undefined) {
                babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
            }
        }
        if (material.emissiveTexture) {
            promises.push(this.loadTextureInfoAsync(context + "/emissiveTexture", material.emissiveTexture, function (texture) {
                texture.name = babylonMaterial.name + " (Emissive)";
                babylonMaterial.emissiveTexture = texture;
            }));
        }
        return Promise.all(promises).then(function () { });
    };
    /**
     * Loads the alpha properties from a glTF material into a Babylon material.
     * Must be called after the setting the albedo texture of the Babylon material when the material has an albedo texture.
     * @param context The context when loading the asset
     * @param material The glTF material property
     * @param babylonMaterial The Babylon material
     */
    GLTFLoader.prototype.loadMaterialAlphaProperties = function (context, material, babylonMaterial) {
        if (!(babylonMaterial instanceof babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"])) {
            throw new Error(context + ": Material type not supported");
        }
        var alphaMode = material.alphaMode || "OPAQUE" /* OPAQUE */;
        switch (alphaMode) {
            case "OPAQUE" /* OPAQUE */: {
                babylonMaterial.transparencyMode = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"].PBRMATERIAL_OPAQUE;
                break;
            }
            case "MASK" /* MASK */: {
                babylonMaterial.transparencyMode = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"].PBRMATERIAL_ALPHATEST;
                babylonMaterial.alphaCutOff = (material.alphaCutoff == undefined ? 0.5 : material.alphaCutoff);
                if (babylonMaterial.albedoTexture) {
                    babylonMaterial.albedoTexture.hasAlpha = true;
                }
                break;
            }
            case "BLEND" /* BLEND */: {
                babylonMaterial.transparencyMode = babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["PBRMaterial"].PBRMATERIAL_ALPHABLEND;
                if (babylonMaterial.albedoTexture) {
                    babylonMaterial.albedoTexture.hasAlpha = true;
                    babylonMaterial.useAlphaFromAlbedoTexture = true;
                }
                break;
            }
            default: {
                throw new Error(context + "/alphaMode: Invalid value (" + material.alphaMode + ")");
            }
        }
    };
    /**
     * Loads a glTF texture info.
     * @param context The context when loading the asset
     * @param textureInfo The glTF texture info property
     * @param assign A function called synchronously after parsing the glTF properties
     * @returns A promise that resolves with the loaded Babylon texture when the load is complete
     */
    GLTFLoader.prototype.loadTextureInfoAsync = function (context, textureInfo, assign) {
        var _this = this;
        if (assign === void 0) { assign = function () { }; }
        var extensionPromise = this._extensionsLoadTextureInfoAsync(context, textureInfo, assign);
        if (extensionPromise) {
            return extensionPromise;
        }
        this.logOpen("" + context);
        if (textureInfo.texCoord >= 2) {
            throw new Error(context + "/texCoord: Invalid value (" + textureInfo.texCoord + ")");
        }
        var texture = ArrayItem.Get(context + "/index", this._gltf.textures, textureInfo.index);
        var promise = this._loadTextureAsync("/textures/" + textureInfo.index, texture, function (babylonTexture) {
            babylonTexture.coordinatesIndex = textureInfo.texCoord || 0;
            GLTFLoader.AddPointerMetadata(babylonTexture, context);
            _this._parent.onTextureLoadedObservable.notifyObservers(babylonTexture);
            assign(babylonTexture);
        });
        this.logClose();
        return promise;
    };
    /** @hidden */
    GLTFLoader.prototype._loadTextureAsync = function (context, texture, assign) {
        if (assign === void 0) { assign = function () { }; }
        var extensionPromise = this._extensionsLoadTextureAsync(context, texture, assign);
        if (extensionPromise) {
            return extensionPromise;
        }
        this.logOpen(context + " " + (texture.name || ""));
        var sampler = (texture.sampler == undefined ? GLTFLoader.DefaultSampler : ArrayItem.Get(context + "/sampler", this._gltf.samplers, texture.sampler));
        var image = ArrayItem.Get(context + "/source", this._gltf.images, texture.source);
        var promise = this._createTextureAsync(context, sampler, image, assign);
        this.logClose();
        return promise;
    };
    /** @hidden */
    GLTFLoader.prototype._createTextureAsync = function (context, sampler, image, assign) {
        var _this = this;
        if (assign === void 0) { assign = function () { }; }
        var samplerData = this._loadSampler("/samplers/" + sampler.index, sampler);
        var promises = new Array();
        var deferred = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Deferred"]();
        this._babylonScene._blockEntityCollection = this._forAssetContainer;
        var babylonTexture = new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"](null, this._babylonScene, samplerData.noMipMaps, false, samplerData.samplingMode, function () {
            if (!_this._disposed) {
                deferred.resolve();
            }
        }, function (message, exception) {
            if (!_this._disposed) {
                deferred.reject(new Error(context + ": " + ((exception && exception.message) ? exception.message : message || "Failed to load texture")));
            }
        }, undefined, undefined, undefined, image.mimeType);
        this._babylonScene._blockEntityCollection = false;
        promises.push(deferred.promise);
        promises.push(this.loadImageAsync("/images/" + image.index, image).then(function (data) {
            var name = image.uri || _this._fileName + "#image" + image.index;
            var dataUrl = "data:" + _this._uniqueRootUrl + name;
            babylonTexture.updateURL(dataUrl, data);
        }));
        babylonTexture.wrapU = samplerData.wrapU;
        babylonTexture.wrapV = samplerData.wrapV;
        assign(babylonTexture);
        return Promise.all(promises).then(function () {
            return babylonTexture;
        });
    };
    GLTFLoader.prototype._loadSampler = function (context, sampler) {
        if (!sampler._data) {
            sampler._data = {
                noMipMaps: (sampler.minFilter === 9728 /* NEAREST */ || sampler.minFilter === 9729 /* LINEAR */),
                samplingMode: GLTFLoader._GetTextureSamplingMode(context, sampler),
                wrapU: GLTFLoader._GetTextureWrapMode(context + "/wrapS", sampler.wrapS),
                wrapV: GLTFLoader._GetTextureWrapMode(context + "/wrapT", sampler.wrapT)
            };
        }
        return sampler._data;
    };
    /**
     * Loads a glTF image.
     * @param context The context when loading the asset
     * @param image The glTF image property
     * @returns A promise that resolves with the loaded data when the load is complete
     */
    GLTFLoader.prototype.loadImageAsync = function (context, image) {
        if (!image._data) {
            this.logOpen(context + " " + (image.name || ""));
            if (image.uri) {
                image._data = this.loadUriAsync(context + "/uri", image, image.uri);
            }
            else {
                var bufferView = ArrayItem.Get(context + "/bufferView", this._gltf.bufferViews, image.bufferView);
                image._data = this.loadBufferViewAsync("/bufferViews/" + bufferView.index, bufferView);
            }
            this.logClose();
        }
        return image._data;
    };
    /**
     * Loads a glTF uri.
     * @param context The context when loading the asset
     * @param property The glTF property associated with the uri
     * @param uri The base64 or relative uri
     * @returns A promise that resolves with the loaded data when the load is complete
     */
    GLTFLoader.prototype.loadUriAsync = function (context, property, uri) {
        var _this = this;
        var extensionPromise = this._extensionsLoadUriAsync(context, property, uri);
        if (extensionPromise) {
            return extensionPromise;
        }
        if (!GLTFLoader._ValidateUri(uri)) {
            throw new Error(context + ": '" + uri + "' is invalid");
        }
        if (babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Tools"].IsBase64(uri)) {
            var data = new Uint8Array(babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Tools"].DecodeBase64(uri));
            this.log("Decoded " + uri.substr(0, 64) + "... (" + data.length + " bytes)");
            return Promise.resolve(data);
        }
        this.log("Loading " + uri);
        return this._parent.preprocessUrlAsync(this._rootUrl + uri).then(function (url) {
            return new Promise(function (resolve, reject) {
                _this._parent._loadFile(url, _this._babylonScene, function (data) {
                    if (!_this._disposed) {
                        _this.log("Loaded " + uri + " (" + data.byteLength + " bytes)");
                        resolve(new Uint8Array(data));
                    }
                }, true, function (request) {
                    reject(new babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["LoadFileError"](context + ": Failed to load '" + uri + "'" + (request ? ": " + request.status + " " + request.statusText : ""), request));
                });
            });
        });
    };
    /**
     * Adds a JSON pointer to the metadata of the Babylon object at `<object>.metadata.gltf.pointers`.
     * @param babylonObject the Babylon object with metadata
     * @param pointer the JSON pointer
     */
    GLTFLoader.AddPointerMetadata = function (babylonObject, pointer) {
        var metadata = (babylonObject.metadata = babylonObject.metadata || {});
        var gltf = (metadata.gltf = metadata.gltf || {});
        var pointers = (gltf.pointers = gltf.pointers || []);
        pointers.push(pointer);
    };
    GLTFLoader._GetTextureWrapMode = function (context, mode) {
        // Set defaults if undefined
        mode = mode == undefined ? 10497 /* REPEAT */ : mode;
        switch (mode) {
            case 33071 /* CLAMP_TO_EDGE */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].CLAMP_ADDRESSMODE;
            case 33648 /* MIRRORED_REPEAT */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].MIRROR_ADDRESSMODE;
            case 10497 /* REPEAT */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].WRAP_ADDRESSMODE;
            default:
                babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Logger"].Warn(context + ": Invalid value (" + mode + ")");
                return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].WRAP_ADDRESSMODE;
        }
    };
    GLTFLoader._GetTextureSamplingMode = function (context, sampler) {
        // Set defaults if undefined
        var magFilter = sampler.magFilter == undefined ? 9729 /* LINEAR */ : sampler.magFilter;
        var minFilter = sampler.minFilter == undefined ? 9987 /* LINEAR_MIPMAP_LINEAR */ : sampler.minFilter;
        if (magFilter === 9729 /* LINEAR */) {
            switch (minFilter) {
                case 9728 /* NEAREST */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_NEAREST;
                case 9729 /* LINEAR */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_LINEAR;
                case 9984 /* NEAREST_MIPMAP_NEAREST */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_NEAREST_MIPNEAREST;
                case 9985 /* LINEAR_MIPMAP_NEAREST */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_LINEAR_MIPNEAREST;
                case 9986 /* NEAREST_MIPMAP_LINEAR */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_NEAREST_MIPLINEAR;
                case 9987 /* LINEAR_MIPMAP_LINEAR */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_LINEAR_MIPLINEAR;
                default:
                    babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Logger"].Warn(context + "/minFilter: Invalid value (" + minFilter + ")");
                    return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].LINEAR_LINEAR_MIPLINEAR;
            }
        }
        else {
            if (magFilter !== 9728 /* NEAREST */) {
                babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Logger"].Warn(context + "/magFilter: Invalid value (" + magFilter + ")");
            }
            switch (minFilter) {
                case 9728 /* NEAREST */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_NEAREST;
                case 9729 /* LINEAR */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_LINEAR;
                case 9984 /* NEAREST_MIPMAP_NEAREST */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_NEAREST_MIPNEAREST;
                case 9985 /* LINEAR_MIPMAP_NEAREST */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_LINEAR_MIPNEAREST;
                case 9986 /* NEAREST_MIPMAP_LINEAR */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_NEAREST_MIPLINEAR;
                case 9987 /* LINEAR_MIPMAP_LINEAR */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_LINEAR_MIPLINEAR;
                default:
                    babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Logger"].Warn(context + "/minFilter: Invalid value (" + minFilter + ")");
                    return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Texture"].NEAREST_NEAREST_MIPNEAREST;
            }
        }
    };
    GLTFLoader._GetTypedArrayConstructor = function (context, componentType) {
        switch (componentType) {
            case 5120 /* BYTE */: return Int8Array;
            case 5121 /* UNSIGNED_BYTE */: return Uint8Array;
            case 5122 /* SHORT */: return Int16Array;
            case 5123 /* UNSIGNED_SHORT */: return Uint16Array;
            case 5125 /* UNSIGNED_INT */: return Uint32Array;
            case 5126 /* FLOAT */: return Float32Array;
            default: throw new Error(context + ": Invalid component type " + componentType);
        }
    };
    GLTFLoader._GetTypedArray = function (context, componentType, bufferView, byteOffset, length) {
        var buffer = bufferView.buffer;
        byteOffset = bufferView.byteOffset + (byteOffset || 0);
        var constructor = GLTFLoader._GetTypedArrayConstructor(context + "/componentType", componentType);
        try {
            return new constructor(buffer, byteOffset, length);
        }
        catch (e) {
            throw new Error(context + ": " + e);
        }
    };
    GLTFLoader._GetNumComponents = function (context, type) {
        switch (type) {
            case "SCALAR": return 1;
            case "VEC2": return 2;
            case "VEC3": return 3;
            case "VEC4": return 4;
            case "MAT2": return 4;
            case "MAT3": return 9;
            case "MAT4": return 16;
        }
        throw new Error(context + ": Invalid type (" + type + ")");
    };
    GLTFLoader._ValidateUri = function (uri) {
        return (babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Tools"].IsBase64(uri) || uri.indexOf("..") === -1);
    };
    /** @hidden */
    GLTFLoader._GetDrawMode = function (context, mode) {
        if (mode == undefined) {
            mode = 4 /* TRIANGLES */;
        }
        switch (mode) {
            case 0 /* POINTS */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Material"].PointListDrawMode;
            case 1 /* LINES */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Material"].LineListDrawMode;
            case 2 /* LINE_LOOP */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Material"].LineLoopDrawMode;
            case 3 /* LINE_STRIP */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Material"].LineStripDrawMode;
            case 4 /* TRIANGLES */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Material"].TriangleFillMode;
            case 5 /* TRIANGLE_STRIP */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Material"].TriangleStripDrawMode;
            case 6 /* TRIANGLE_FAN */: return babylonjs_Misc_deferred__WEBPACK_IMPORTED_MODULE_0__["Material"].TriangleFanDrawMode;
        }
        throw new Error(context + ": Invalid mesh primitive mode (" + mode + ")");
    };
    GLTFLoader.prototype._compileMaterialsAsync = function () {
        var _this = this;
        this._parent._startPerformanceCounter("Compile materials");
        var promises = new Array();
        if (this._gltf.materials) {
            for (var _i = 0, _a = this._gltf.materials; _i < _a.length; _i++) {
                var material = _a[_i];
                if (material._data) {
                    for (var babylonDrawMode in material._data) {
                        var babylonData = material._data[babylonDrawMode];
                        for (var _b = 0, _c = babylonData.babylonMeshes; _b < _c.length; _b++) {
                            var babylonMesh = _c[_b];
                            // Ensure nonUniformScaling is set if necessary.
                            babylonMesh.computeWorldMatrix(true);
                            var babylonMaterial = babylonData.babylonMaterial;
                            promises.push(babylonMaterial.forceCompilationAsync(babylonMesh));
                            promises.push(babylonMaterial.forceCompilationAsync(babylonMesh, { useInstances: true }));
                            if (this._parent.useClipPlane) {
                                promises.push(babylonMaterial.forceCompilationAsync(babylonMesh, { clipPlane: true }));
                                promises.push(babylonMaterial.forceCompilationAsync(babylonMesh, { clipPlane: true, useInstances: true }));
                            }
                        }
                    }
                }
            }
        }
        return Promise.all(promises).then(function () {
            _this._parent._endPerformanceCounter("Compile materials");
        });
    };
    GLTFLoader.prototype._compileShadowGeneratorsAsync = function () {
        var _this = this;
        this._parent._startPerformanceCounter("Compile shadow generators");
        var promises = new Array();
        var lights = this._babylonScene.lights;
        for (var _i = 0, lights_1 = lights; _i < lights_1.length; _i++) {
            var light = lights_1[_i];
            var generator = light.getShadowGenerator();
            if (generator) {
                promises.push(generator.forceCompilationAsync());
            }
        }
        return Promise.all(promises).then(function () {
            _this._parent._endPerformanceCounter("Compile shadow generators");
        });
    };
    GLTFLoader.prototype._forEachExtensions = function (action) {
        for (var _i = 0, _a = this._extensions; _i < _a.length; _i++) {
            var extension = _a[_i];
            if (extension.enabled) {
                action(extension);
            }
        }
    };
    GLTFLoader.prototype._applyExtensions = function (property, functionName, actionAsync) {
        for (var _i = 0, _a = this._extensions; _i < _a.length; _i++) {
            var extension = _a[_i];
            if (extension.enabled) {
                var id = extension.name + "." + functionName;
                var loaderProperty = property;
                loaderProperty._activeLoaderExtensionFunctions = loaderProperty._activeLoaderExtensionFunctions || {};
                var activeLoaderExtensionFunctions = loaderProperty._activeLoaderExtensionFunctions;
                if (!activeLoaderExtensionFunctions[id]) {
                    activeLoaderExtensionFunctions[id] = true;
                    try {
                        var result = actionAsync(extension);
                        if (result) {
                            return result;
                        }
                    }
                    finally {
                        delete activeLoaderExtensionFunctions[id];
                    }
                }
            }
        }
        return null;
    };
    GLTFLoader.prototype._extensionsOnLoading = function () {
        this._forEachExtensions(function (extension) { return extension.onLoading && extension.onLoading(); });
    };
    GLTFLoader.prototype._extensionsOnReady = function () {
        this._forEachExtensions(function (extension) { return extension.onReady && extension.onReady(); });
    };
    GLTFLoader.prototype._extensionsLoadSceneAsync = function (context, scene) {
        return this._applyExtensions(scene, "loadScene", function (extension) { return extension.loadSceneAsync && extension.loadSceneAsync(context, scene); });
    };
    GLTFLoader.prototype._extensionsLoadNodeAsync = function (context, node, assign) {
        return this._applyExtensions(node, "loadNode", function (extension) { return extension.loadNodeAsync && extension.loadNodeAsync(context, node, assign); });
    };
    GLTFLoader.prototype._extensionsLoadCameraAsync = function (context, camera, assign) {
        return this._applyExtensions(camera, "loadCamera", function (extension) { return extension.loadCameraAsync && extension.loadCameraAsync(context, camera, assign); });
    };
    GLTFLoader.prototype._extensionsLoadVertexDataAsync = function (context, primitive, babylonMesh) {
        return this._applyExtensions(primitive, "loadVertexData", function (extension) { return extension._loadVertexDataAsync && extension._loadVertexDataAsync(context, primitive, babylonMesh); });
    };
    GLTFLoader.prototype._extensionsLoadMeshPrimitiveAsync = function (context, name, node, mesh, primitive, assign) {
        return this._applyExtensions(primitive, "loadMeshPrimitive", function (extension) { return extension._loadMeshPrimitiveAsync && extension._loadMeshPrimitiveAsync(context, name, node, mesh, primitive, assign); });
    };
    GLTFLoader.prototype._extensionsLoadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
        return this._applyExtensions(material, "loadMaterial", function (extension) { return extension._loadMaterialAsync && extension._loadMaterialAsync(context, material, babylonMesh, babylonDrawMode, assign); });
    };
    GLTFLoader.prototype._extensionsCreateMaterial = function (context, material, babylonDrawMode) {
        return this._applyExtensions(material, "createMaterial", function (extension) { return extension.createMaterial && extension.createMaterial(context, material, babylonDrawMode); });
    };
    GLTFLoader.prototype._extensionsLoadMaterialPropertiesAsync = function (context, material, babylonMaterial) {
        return this._applyExtensions(material, "loadMaterialProperties", function (extension) { return extension.loadMaterialPropertiesAsync && extension.loadMaterialPropertiesAsync(context, material, babylonMaterial); });
    };
    GLTFLoader.prototype._extensionsLoadTextureInfoAsync = function (context, textureInfo, assign) {
        return this._applyExtensions(textureInfo, "loadTextureInfo", function (extension) { return extension.loadTextureInfoAsync && extension.loadTextureInfoAsync(context, textureInfo, assign); });
    };
    GLTFLoader.prototype._extensionsLoadTextureAsync = function (context, texture, assign) {
        return this._applyExtensions(texture, "loadTexture", function (extension) { return extension._loadTextureAsync && extension._loadTextureAsync(context, texture, assign); });
    };
    GLTFLoader.prototype._extensionsLoadAnimationAsync = function (context, animation) {
        return this._applyExtensions(animation, "loadAnimation", function (extension) { return extension.loadAnimationAsync && extension.loadAnimationAsync(context, animation); });
    };
    GLTFLoader.prototype._extensionsLoadSkinAsync = function (context, node, skin) {
        return this._applyExtensions(skin, "loadSkin", function (extension) { return extension._loadSkinAsync && extension._loadSkinAsync(context, node, skin); });
    };
    GLTFLoader.prototype._extensionsLoadUriAsync = function (context, property, uri) {
        return this._applyExtensions(property, "loadUri", function (extension) { return extension._loadUriAsync && extension._loadUriAsync(context, property, uri); });
    };
    GLTFLoader.prototype._extensionsLoadBufferViewAsync = function (context, bufferView) {
        return this._applyExtensions(bufferView, "loadBufferView", function (extension) { return extension.loadBufferViewAsync && extension.loadBufferViewAsync(context, bufferView); });
    };
    GLTFLoader.prototype._extensionsLoadBufferAsync = function (context, buffer, byteOffset, byteLength) {
        return this._applyExtensions(buffer, "loadBuffer", function (extension) { return extension.loadBufferAsync && extension.loadBufferAsync(context, buffer, byteOffset, byteLength); });
    };
    /**
     * Helper method called by a loader extension to load an glTF extension.
     * @param context The context when loading the asset
     * @param property The glTF property to load the extension from
     * @param extensionName The name of the extension to load
     * @param actionAsync The action to run
     * @returns The promise returned by actionAsync or null if the extension does not exist
     */
    GLTFLoader.LoadExtensionAsync = function (context, property, extensionName, actionAsync) {
        if (!property.extensions) {
            return null;
        }
        var extensions = property.extensions;
        var extension = extensions[extensionName];
        if (!extension) {
            return null;
        }
        return actionAsync(context + "/extensions/" + extensionName, extension);
    };
    /**
     * Helper method called by a loader extension to load a glTF extra.
     * @param context The context when loading the asset
     * @param property The glTF property to load the extra from
     * @param extensionName The name of the extension to load
     * @param actionAsync The action to run
     * @returns The promise returned by actionAsync or null if the extra does not exist
     */
    GLTFLoader.LoadExtraAsync = function (context, property, extensionName, actionAsync) {
        if (!property.extras) {
            return null;
        }
        var extras = property.extras;
        var extra = extras[extensionName];
        if (!extra) {
            return null;
        }
        return actionAsync(context + "/extras/" + extensionName, extra);
    };
    /**
     * Checks for presence of an extension.
     * @param name The name of the extension to check
     * @returns A boolean indicating the presence of the given extension name in `extensionsUsed`
     */
    GLTFLoader.prototype.isExtensionUsed = function (name) {
        return !!this._gltf.extensionsUsed && this._gltf.extensionsUsed.indexOf(name) !== -1;
    };
    /**
     * Increments the indentation level and logs a message.
     * @param message The message to log
     */
    GLTFLoader.prototype.logOpen = function (message) {
        this._parent._logOpen(message);
    };
    /**
     * Decrements the indentation level.
     */
    GLTFLoader.prototype.logClose = function () {
        this._parent._logClose();
    };
    /**
     * Logs a message
     * @param message The message to log
     */
    GLTFLoader.prototype.log = function (message) {
        this._parent._log(message);
    };
    /**
     * Starts a performance counter.
     * @param counterName The name of the performance counter
     */
    GLTFLoader.prototype.startPerformanceCounter = function (counterName) {
        this._parent._startPerformanceCounter(counterName);
    };
    /**
     * Ends a performance counter.
     * @param counterName The name of the performance counter
     */
    GLTFLoader.prototype.endPerformanceCounter = function (counterName) {
        this._parent._endPerformanceCounter(counterName);
    };
    GLTFLoader._RegisteredExtensions = {};
    /**
     * The default glTF sampler.
     */
    GLTFLoader.DefaultSampler = { index: -1 };
    return GLTFLoader;
}());

_glTFFileLoader__WEBPACK_IMPORTED_MODULE_1__["GLTFFileLoader"]._CreateGLTF2Loader = function (parent) { return new GLTFLoader(parent); };


/***/ }),

/***/ "./glTF/2.0/glTFLoaderExtension.ts":
/*!*****************************************!*\
  !*** ./glTF/2.0/glTFLoaderExtension.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {



/***/ }),

/***/ "./glTF/2.0/glTFLoaderInterfaces.ts":
/*!******************************************!*\
  !*** ./glTF/2.0/glTFLoaderInterfaces.ts ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {



/***/ }),

/***/ "./glTF/2.0/index.ts":
/*!***************************!*\
  !*** ./glTF/2.0/index.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _glTFLoader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./glTFLoader */ "./glTF/2.0/glTFLoader.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ArrayItem", function() { return _glTFLoader__WEBPACK_IMPORTED_MODULE_0__["ArrayItem"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFLoader", function() { return _glTFLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoader"]; });

/* harmony import */ var _glTFLoaderExtension__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./glTFLoaderExtension */ "./glTF/2.0/glTFLoaderExtension.ts");
/* harmony import */ var _glTFLoaderExtension__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_glTFLoaderExtension__WEBPACK_IMPORTED_MODULE_1__);
/* harmony reexport (unknown) */ for(var __WEBPACK_IMPORT_KEY__ in _glTFLoaderExtension__WEBPACK_IMPORTED_MODULE_1__) if(["ArrayItem","GLTFLoader","default"].indexOf(__WEBPACK_IMPORT_KEY__) < 0) (function(key) { __webpack_require__.d(__webpack_exports__, key, function() { return _glTFLoaderExtension__WEBPACK_IMPORTED_MODULE_1__[key]; }) }(__WEBPACK_IMPORT_KEY__));
/* harmony import */ var _glTFLoaderInterfaces__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./glTFLoaderInterfaces */ "./glTF/2.0/glTFLoaderInterfaces.ts");
/* harmony import */ var _glTFLoaderInterfaces__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_glTFLoaderInterfaces__WEBPACK_IMPORTED_MODULE_2__);
/* harmony reexport (unknown) */ for(var __WEBPACK_IMPORT_KEY__ in _glTFLoaderInterfaces__WEBPACK_IMPORTED_MODULE_2__) if(["ArrayItem","GLTFLoader","default"].indexOf(__WEBPACK_IMPORT_KEY__) < 0) (function(key) { __webpack_require__.d(__webpack_exports__, key, function() { return _glTFLoaderInterfaces__WEBPACK_IMPORTED_MODULE_2__[key]; }) }(__WEBPACK_IMPORT_KEY__));
/* harmony import */ var _Extensions__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Extensions */ "./glTF/2.0/Extensions/index.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "EXT_lights_image_based", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["EXT_lights_image_based"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "EXT_mesh_gpu_instancing", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["EXT_mesh_gpu_instancing"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_draco_mesh_compression", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_draco_mesh_compression"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_lights", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_lights"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_pbrSpecularGlossiness", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_materials_pbrSpecularGlossiness"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_unlit", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_materials_unlit"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_clearcoat", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_materials_clearcoat"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_sheen", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_materials_sheen"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_specular", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_materials_specular"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_ior", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_materials_ior"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_variants", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_materials_variants"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_materials_transmission", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_materials_transmission"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_mesh_quantization", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_mesh_quantization"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_texture_basisu", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_texture_basisu"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_texture_transform", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_texture_transform"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "KHR_xmp", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["KHR_xmp"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MSFT_audio_emitter", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["MSFT_audio_emitter"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MSFT_lod", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["MSFT_lod"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MSFT_minecraftMesh", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["MSFT_minecraftMesh"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MSFT_sRGBFactors", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["MSFT_sRGBFactors"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ExtrasAsMetadata", function() { return _Extensions__WEBPACK_IMPORTED_MODULE_3__["ExtrasAsMetadata"]; });







/***/ }),

/***/ "./glTF/glTFFileLoader.ts":
/*!********************************!*\
  !*** ./glTF/glTFFileLoader.ts ***!
  \********************************/
/*! exports provided: GLTFLoaderCoordinateSystemMode, GLTFLoaderAnimationStartMode, GLTFLoaderState, GLTFFileLoader */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GLTFLoaderCoordinateSystemMode", function() { return GLTFLoaderCoordinateSystemMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GLTFLoaderAnimationStartMode", function() { return GLTFLoaderAnimationStartMode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GLTFLoaderState", function() { return GLTFLoaderState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GLTFFileLoader", function() { return GLTFFileLoader; });
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Misc/observable */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _glTFValidation__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./glTFValidation */ "./glTF/glTFValidation.ts");








/**
 * Mode that determines the coordinate system to use.
 */
var GLTFLoaderCoordinateSystemMode;
(function (GLTFLoaderCoordinateSystemMode) {
    /**
     * Automatically convert the glTF right-handed data to the appropriate system based on the current coordinate system mode of the scene.
     */
    GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["AUTO"] = 0] = "AUTO";
    /**
     * Sets the useRightHandedSystem flag on the scene.
     */
    GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["FORCE_RIGHT_HANDED"] = 1] = "FORCE_RIGHT_HANDED";
})(GLTFLoaderCoordinateSystemMode || (GLTFLoaderCoordinateSystemMode = {}));
/**
 * Mode that determines what animations will start.
 */
var GLTFLoaderAnimationStartMode;
(function (GLTFLoaderAnimationStartMode) {
    /**
     * No animation will start.
     */
    GLTFLoaderAnimationStartMode[GLTFLoaderAnimationStartMode["NONE"] = 0] = "NONE";
    /**
     * The first animation will start.
     */
    GLTFLoaderAnimationStartMode[GLTFLoaderAnimationStartMode["FIRST"] = 1] = "FIRST";
    /**
     * All animations will start.
     */
    GLTFLoaderAnimationStartMode[GLTFLoaderAnimationStartMode["ALL"] = 2] = "ALL";
})(GLTFLoaderAnimationStartMode || (GLTFLoaderAnimationStartMode = {}));
/**
 * Loader state.
 */
var GLTFLoaderState;
(function (GLTFLoaderState) {
    /**
     * The asset is loading.
     */
    GLTFLoaderState[GLTFLoaderState["LOADING"] = 0] = "LOADING";
    /**
     * The asset is ready for rendering.
     */
    GLTFLoaderState[GLTFLoaderState["READY"] = 1] = "READY";
    /**
     * The asset is completely loaded.
     */
    GLTFLoaderState[GLTFLoaderState["COMPLETE"] = 2] = "COMPLETE";
})(GLTFLoaderState || (GLTFLoaderState = {}));
/**
 * File loader for loading glTF files into a scene.
 */
var GLTFFileLoader = /** @class */ (function () {
    function GLTFFileLoader() {
        // --------------
        // Common options
        // --------------
        /**
         * Raised when the asset has been parsed
         */
        this.onParsedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        // ----------
        // V2 options
        // ----------
        /**
         * The coordinate system mode. Defaults to AUTO.
         */
        this.coordinateSystemMode = GLTFLoaderCoordinateSystemMode.AUTO;
        /**
        * The animation start mode. Defaults to FIRST.
        */
        this.animationStartMode = GLTFLoaderAnimationStartMode.FIRST;
        /**
         * Defines if the loader should compile materials before raising the success callback. Defaults to false.
         */
        this.compileMaterials = false;
        /**
         * Defines if the loader should also compile materials with clip planes. Defaults to false.
         */
        this.useClipPlane = false;
        /**
         * Defines if the loader should compile shadow generators before raising the success callback. Defaults to false.
         */
        this.compileShadowGenerators = false;
        /**
         * Defines if the Alpha blended materials are only applied as coverage.
         * If false, (default) The luminance of each pixel will reduce its opacity to simulate the behaviour of most physical materials.
         * If true, no extra effects are applied to transparent pixels.
         */
        this.transparencyAsCoverage = false;
        /**
         * Defines if the loader should use range requests when load binary glTF files from HTTP.
         * Enabling will disable offline support and glTF validator.
         * Defaults to false.
         */
        this.useRangeRequests = false;
        /**
         * Defines if the loader should create instances when multiple glTF nodes point to the same glTF mesh. Defaults to true.
         */
        this.createInstances = true;
        /**
         * Defines if the loader should always compute the bounding boxes of meshes and not use the min/max values from the position accessor. Defaults to false.
         */
        this.alwaysComputeBoundingBox = false;
        /**
         * Function called before loading a url referenced by the asset.
         */
        this.preprocessUrlAsync = function (url) { return Promise.resolve(url); };
        /**
         * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
         */
        this.onMeshLoadedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * Observable raised when the loader creates a texture after parsing the glTF properties of the texture.
         */
        this.onTextureLoadedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * Observable raised when the loader creates a material after parsing the glTF properties of the material.
         */
        this.onMaterialLoadedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * Observable raised when the loader creates a camera after parsing the glTF properties of the camera.
         */
        this.onCameraLoadedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * Observable raised when the asset is completely loaded, immediately before the loader is disposed.
         * For assets with LODs, raised when all of the LODs are complete.
         * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
         */
        this.onCompleteObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * Observable raised when an error occurs.
         */
        this.onErrorObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * Observable raised after the loader is disposed.
         */
        this.onDisposeObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * Observable raised after a loader extension is created.
         * Set additional options for a loader extension in this event.
         */
        this.onExtensionLoadedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        /**
         * Defines if the loader should validate the asset.
         */
        this.validate = false;
        /**
         * Observable raised after validation when validate is set to true. The event data is the result of the validation.
         */
        this.onValidatedObservable = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]();
        this._loader = null;
        this._requests = new Array();
        /**
         * Name of the loader ("gltf")
         */
        this.name = "gltf";
        /** @hidden */
        this.extensions = {
            ".gltf": { isBinary: false },
            ".glb": { isBinary: true }
        };
        this._logIndentLevel = 0;
        this._loggingEnabled = false;
        /** @hidden */
        this._log = this._logDisabled;
        this._capturePerformanceCounters = false;
        /** @hidden */
        this._startPerformanceCounter = this._startPerformanceCounterDisabled;
        /** @hidden */
        this._endPerformanceCounter = this._endPerformanceCounterDisabled;
    }
    Object.defineProperty(GLTFFileLoader.prototype, "onParsed", {
        /**
         * Raised when the asset has been parsed
         */
        set: function (callback) {
            if (this._onParsedObserver) {
                this.onParsedObservable.remove(this._onParsedObserver);
            }
            this._onParsedObserver = this.onParsedObservable.add(callback);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFFileLoader.prototype, "onMeshLoaded", {
        /**
         * Callback raised when the loader creates a mesh after parsing the glTF properties of the mesh.
         */
        set: function (callback) {
            if (this._onMeshLoadedObserver) {
                this.onMeshLoadedObservable.remove(this._onMeshLoadedObserver);
            }
            this._onMeshLoadedObserver = this.onMeshLoadedObservable.add(callback);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFFileLoader.prototype, "onTextureLoaded", {
        /**
         * Callback raised when the loader creates a texture after parsing the glTF properties of the texture.
         */
        set: function (callback) {
            if (this._onTextureLoadedObserver) {
                this.onTextureLoadedObservable.remove(this._onTextureLoadedObserver);
            }
            this._onTextureLoadedObserver = this.onTextureLoadedObservable.add(callback);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFFileLoader.prototype, "onMaterialLoaded", {
        /**
         * Callback raised when the loader creates a material after parsing the glTF properties of the material.
         */
        set: function (callback) {
            if (this._onMaterialLoadedObserver) {
                this.onMaterialLoadedObservable.remove(this._onMaterialLoadedObserver);
            }
            this._onMaterialLoadedObserver = this.onMaterialLoadedObservable.add(callback);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFFileLoader.prototype, "onCameraLoaded", {
        /**
         * Callback raised when the loader creates a camera after parsing the glTF properties of the camera.
         */
        set: function (callback) {
            if (this._onCameraLoadedObserver) {
                this.onCameraLoadedObservable.remove(this._onCameraLoadedObserver);
            }
            this._onCameraLoadedObserver = this.onCameraLoadedObservable.add(callback);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFFileLoader.prototype, "onComplete", {
        /**
         * Callback raised when the asset is completely loaded, immediately before the loader is disposed.
         * For assets with LODs, raised when all of the LODs are complete.
         * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
         */
        set: function (callback) {
            if (this._onCompleteObserver) {
                this.onCompleteObservable.remove(this._onCompleteObserver);
            }
            this._onCompleteObserver = this.onCompleteObservable.add(callback);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFFileLoader.prototype, "onError", {
        /**
         * Callback raised when an error occurs.
         */
        set: function (callback) {
            if (this._onErrorObserver) {
                this.onErrorObservable.remove(this._onErrorObserver);
            }
            this._onErrorObserver = this.onErrorObservable.add(callback);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFFileLoader.prototype, "onDispose", {
        /**
         * Callback raised after the loader is disposed.
         */
        set: function (callback) {
            if (this._onDisposeObserver) {
                this.onDisposeObservable.remove(this._onDisposeObserver);
            }
            this._onDisposeObserver = this.onDisposeObservable.add(callback);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFFileLoader.prototype, "onExtensionLoaded", {
        /**
         * Callback raised after a loader extension is created.
         */
        set: function (callback) {
            if (this._onExtensionLoadedObserver) {
                this.onExtensionLoadedObservable.remove(this._onExtensionLoadedObserver);
            }
            this._onExtensionLoadedObserver = this.onExtensionLoadedObservable.add(callback);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFFileLoader.prototype, "loggingEnabled", {
        /**
         * Defines if the loader logging is enabled.
         */
        get: function () {
            return this._loggingEnabled;
        },
        set: function (value) {
            if (this._loggingEnabled === value) {
                return;
            }
            this._loggingEnabled = value;
            if (this._loggingEnabled) {
                this._log = this._logEnabled;
            }
            else {
                this._log = this._logDisabled;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFFileLoader.prototype, "capturePerformanceCounters", {
        /**
         * Defines if the loader should capture performance counters.
         */
        get: function () {
            return this._capturePerformanceCounters;
        },
        set: function (value) {
            if (this._capturePerformanceCounters === value) {
                return;
            }
            this._capturePerformanceCounters = value;
            if (this._capturePerformanceCounters) {
                this._startPerformanceCounter = this._startPerformanceCounterEnabled;
                this._endPerformanceCounter = this._endPerformanceCounterEnabled;
            }
            else {
                this._startPerformanceCounter = this._startPerformanceCounterDisabled;
                this._endPerformanceCounter = this._endPerformanceCounterDisabled;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GLTFFileLoader.prototype, "onValidated", {
        /**
         * Callback raised after a loader extension is created.
         */
        set: function (callback) {
            if (this._onValidatedObserver) {
                this.onValidatedObservable.remove(this._onValidatedObserver);
            }
            this._onValidatedObserver = this.onValidatedObservable.add(callback);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Disposes the loader, releases resources during load, and cancels any outstanding requests.
     */
    GLTFFileLoader.prototype.dispose = function () {
        if (this._loader) {
            this._loader.dispose();
            this._loader = null;
        }
        for (var _i = 0, _a = this._requests; _i < _a.length; _i++) {
            var request = _a[_i];
            request.abort();
        }
        this._requests.length = 0;
        delete this._progressCallback;
        this.preprocessUrlAsync = function (url) { return Promise.resolve(url); };
        this.onMeshLoadedObservable.clear();
        this.onTextureLoadedObservable.clear();
        this.onMaterialLoadedObservable.clear();
        this.onCameraLoadedObservable.clear();
        this.onCompleteObservable.clear();
        this.onExtensionLoadedObservable.clear();
        this.onDisposeObservable.notifyObservers(undefined);
        this.onDisposeObservable.clear();
    };
    /** @hidden */
    GLTFFileLoader.prototype.requestFile = function (scene, url, onSuccess, onProgress, useArrayBuffer, onError) {
        var _this = this;
        this._progressCallback = onProgress;
        if (useArrayBuffer) {
            if (this.useRangeRequests) {
                if (this.validate) {
                    babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Logger"].Warn("glTF validation is not supported when range requests are enabled");
                }
                var fileRequest_1 = {
                    abort: function () { },
                    onCompleteObservable: new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]()
                };
                var dataBuffer = {
                    readAsync: function (byteOffset, byteLength) {
                        return new Promise(function (resolve, reject) {
                            _this._requestFile(url, scene, function (data) {
                                resolve(new Uint8Array(data));
                            }, true, function (error) {
                                reject(error);
                            }, function (webRequest) {
                                webRequest.setRequestHeader("Range", "bytes=" + byteOffset + "-" + (byteOffset + byteLength - 1));
                            });
                        });
                    },
                    byteLength: 0
                };
                this._unpackBinaryAsync(new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["DataReader"](dataBuffer)).then(function (loaderData) {
                    fileRequest_1.onCompleteObservable.notifyObservers(fileRequest_1);
                    onSuccess(loaderData);
                }, onError);
                return fileRequest_1;
            }
            return this._requestFile(url, scene, function (data, request) {
                var arrayBuffer = data;
                _this._unpackBinaryAsync(new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["DataReader"]({
                    readAsync: function (byteOffset, byteLength) { return Promise.resolve(new Uint8Array(arrayBuffer, byteOffset, byteLength)); },
                    byteLength: arrayBuffer.byteLength
                })).then(function (loaderData) {
                    onSuccess(loaderData, request);
                }, onError);
            }, true, onError);
        }
        return this._requestFile(url, scene, function (data, request) {
            _this._validate(scene, data, babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Tools"].GetFolderPath(url), babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Tools"].GetFilename(url));
            onSuccess({ json: _this._parseJson(data) }, request);
        }, useArrayBuffer, onError);
    };
    /** @hidden */
    GLTFFileLoader.prototype.readFile = function (scene, file, onSuccess, onProgress, useArrayBuffer, onError) {
        var _this = this;
        return scene._readFile(file, function (data) {
            _this._validate(scene, data, "file:", file.name);
            if (useArrayBuffer) {
                var arrayBuffer_1 = data;
                _this._unpackBinaryAsync(new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["DataReader"]({
                    readAsync: function (byteOffset, byteLength) { return Promise.resolve(new Uint8Array(arrayBuffer_1, byteOffset, byteLength)); },
                    byteLength: arrayBuffer_1.byteLength
                })).then(onSuccess, onError);
            }
            else {
                onSuccess({ json: _this._parseJson(data) });
            }
        }, onProgress, useArrayBuffer, onError);
    };
    /** @hidden */
    GLTFFileLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onProgress, fileName) {
        var _this = this;
        return Promise.resolve().then(function () {
            _this.onParsedObservable.notifyObservers(data);
            _this.onParsedObservable.clear();
            _this._log("Loading " + (fileName || ""));
            _this._loader = _this._getLoader(data);
            return _this._loader.importMeshAsync(meshesNames, scene, false, data, rootUrl, onProgress, fileName);
        });
    };
    /** @hidden */
    GLTFFileLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress, fileName) {
        var _this = this;
        return Promise.resolve().then(function () {
            _this.onParsedObservable.notifyObservers(data);
            _this.onParsedObservable.clear();
            _this._log("Loading " + (fileName || ""));
            _this._loader = _this._getLoader(data);
            return _this._loader.loadAsync(scene, data, rootUrl, onProgress, fileName);
        });
    };
    /** @hidden */
    GLTFFileLoader.prototype.loadAssetContainerAsync = function (scene, data, rootUrl, onProgress, fileName) {
        var _this = this;
        return Promise.resolve().then(function () {
            _this.onParsedObservable.notifyObservers(data);
            _this.onParsedObservable.clear();
            _this._log("Loading " + (fileName || ""));
            _this._loader = _this._getLoader(data);
            // Prepare the asset container.
            var container = new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["AssetContainer"](scene);
            // Get materials/textures when loading to add to container
            var materials = [];
            _this.onMaterialLoadedObservable.add(function (material) {
                materials.push(material);
                material.onDisposeObservable.addOnce(function () {
                    var index = container.materials.indexOf(material);
                    if (index > -1) {
                        container.materials.splice(index, 1);
                    }
                    index = materials.indexOf(material);
                    if (index > -1) {
                        materials.splice(index, 1);
                    }
                });
            });
            var textures = [];
            _this.onTextureLoadedObservable.add(function (texture) {
                textures.push(texture);
                texture.onDisposeObservable.addOnce(function () {
                    var index = container.textures.indexOf(texture);
                    if (index > -1) {
                        container.textures.splice(index, 1);
                    }
                    index = textures.indexOf(texture);
                    if (index > -1) {
                        textures.splice(index, 1);
                    }
                });
            });
            var cameras = [];
            _this.onCameraLoadedObservable.add(function (camera) {
                cameras.push(camera);
            });
            return _this._loader.importMeshAsync(null, scene, true, data, rootUrl, onProgress, fileName).then(function (result) {
                Array.prototype.push.apply(container.meshes, result.meshes);
                Array.prototype.push.apply(container.particleSystems, result.particleSystems);
                Array.prototype.push.apply(container.skeletons, result.skeletons);
                Array.prototype.push.apply(container.animationGroups, result.animationGroups);
                Array.prototype.push.apply(container.materials, materials);
                Array.prototype.push.apply(container.textures, textures);
                Array.prototype.push.apply(container.lights, result.lights);
                Array.prototype.push.apply(container.transformNodes, result.transformNodes);
                Array.prototype.push.apply(container.cameras, cameras);
                return container;
            });
        });
    };
    /** @hidden */
    GLTFFileLoader.prototype.canDirectLoad = function (data) {
        return (data.indexOf("asset") !== -1 && data.indexOf("version") !== -1)
            || babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["StringTools"].StartsWith(data, "data:base64," + GLTFFileLoader.magicBase64Encoded)
            || babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["StringTools"].StartsWith(data, "data:application/octet-stream;base64," + GLTFFileLoader.magicBase64Encoded)
            || babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["StringTools"].StartsWith(data, "data:model/gltf-binary;base64," + GLTFFileLoader.magicBase64Encoded);
    };
    /** @hidden */
    GLTFFileLoader.prototype.directLoad = function (scene, data) {
        if (babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["StringTools"].StartsWith(data, "base64," + GLTFFileLoader.magicBase64Encoded) ||
            babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["StringTools"].StartsWith(data, "application/octet-stream;base64," + GLTFFileLoader.magicBase64Encoded) ||
            babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["StringTools"].StartsWith(data, "model/gltf-binary;base64," + GLTFFileLoader.magicBase64Encoded)) {
            var arrayBuffer_2 = babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Tools"].DecodeBase64(data);
            this._validate(scene, arrayBuffer_2);
            return this._unpackBinaryAsync(new babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["DataReader"]({
                readAsync: function (byteOffset, byteLength) { return Promise.resolve(new Uint8Array(arrayBuffer_2, byteOffset, byteLength)); },
                byteLength: arrayBuffer_2.byteLength
            }));
        }
        this._validate(scene, data);
        return Promise.resolve({ json: this._parseJson(data) });
    };
    /** @hidden */
    GLTFFileLoader.prototype.createPlugin = function () {
        return new GLTFFileLoader();
    };
    Object.defineProperty(GLTFFileLoader.prototype, "loaderState", {
        /**
         * The loader state or null if the loader is not active.
         */
        get: function () {
            return this._loader ? this._loader.state : null;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Returns a promise that resolves when the asset is completely loaded.
     * @returns a promise that resolves when the asset is completely loaded.
     */
    GLTFFileLoader.prototype.whenCompleteAsync = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.onCompleteObservable.addOnce(function () {
                resolve();
            });
            _this.onErrorObservable.addOnce(function (reason) {
                reject(reason);
            });
        });
    };
    /** @hidden */
    GLTFFileLoader.prototype._loadFile = function (url, scene, onSuccess, useArrayBuffer, onError) {
        var _this = this;
        var request = scene._loadFile(url, onSuccess, function (event) {
            _this._onProgress(event, request);
        }, undefined, useArrayBuffer, onError);
        request.onCompleteObservable.add(function (request) {
            _this._requests.splice(_this._requests.indexOf(request), 1);
        });
        this._requests.push(request);
        return request;
    };
    /** @hidden */
    GLTFFileLoader.prototype._requestFile = function (url, scene, onSuccess, useArrayBuffer, onError, onOpened) {
        var _this = this;
        var request = scene._requestFile(url, onSuccess, function (event) {
            _this._onProgress(event, request);
        }, undefined, useArrayBuffer, onError, onOpened);
        request.onCompleteObservable.add(function (request) {
            _this._requests.splice(_this._requests.indexOf(request), 1);
        });
        this._requests.push(request);
        return request;
    };
    GLTFFileLoader.prototype._onProgress = function (event, request) {
        if (!this._progressCallback) {
            return;
        }
        request._lengthComputable = event.lengthComputable;
        request._loaded = event.loaded;
        request._total = event.total;
        var lengthComputable = true;
        var loaded = 0;
        var total = 0;
        for (var _i = 0, _a = this._requests; _i < _a.length; _i++) {
            var request_1 = _a[_i];
            if (request_1._lengthComputable === undefined || request_1._loaded === undefined || request_1._total === undefined) {
                return;
            }
            lengthComputable = lengthComputable && request_1._lengthComputable;
            loaded += request_1._loaded;
            total += request_1._total;
        }
        this._progressCallback({
            lengthComputable: lengthComputable,
            loaded: loaded,
            total: lengthComputable ? total : 0
        });
    };
    GLTFFileLoader.prototype._validate = function (scene, data, rootUrl, fileName) {
        var _this = this;
        if (rootUrl === void 0) { rootUrl = ""; }
        if (fileName === void 0) { fileName = ""; }
        if (!this.validate) {
            return;
        }
        this._startPerformanceCounter("Validate JSON");
        _glTFValidation__WEBPACK_IMPORTED_MODULE_1__["GLTFValidation"].ValidateAsync(data, rootUrl, fileName, function (uri) {
            return _this.preprocessUrlAsync(rootUrl + uri).then(function (url) { return scene._loadFileAsync(url, undefined, true, true); });
        }).then(function (result) {
            _this._endPerformanceCounter("Validate JSON");
            _this.onValidatedObservable.notifyObservers(result);
            _this.onValidatedObservable.clear();
        }, function (reason) {
            _this._endPerformanceCounter("Validate JSON");
            babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Tools"].Warn("Failed to validate: " + reason.message);
            _this.onValidatedObservable.clear();
        });
    };
    GLTFFileLoader.prototype._getLoader = function (loaderData) {
        var asset = loaderData.json.asset || {};
        this._log("Asset version: " + asset.version);
        asset.minVersion && this._log("Asset minimum version: " + asset.minVersion);
        asset.generator && this._log("Asset generator: " + asset.generator);
        var version = GLTFFileLoader._parseVersion(asset.version);
        if (!version) {
            throw new Error("Invalid version: " + asset.version);
        }
        if (asset.minVersion !== undefined) {
            var minVersion = GLTFFileLoader._parseVersion(asset.minVersion);
            if (!minVersion) {
                throw new Error("Invalid minimum version: " + asset.minVersion);
            }
            if (GLTFFileLoader._compareVersion(minVersion, { major: 2, minor: 0 }) > 0) {
                throw new Error("Incompatible minimum version: " + asset.minVersion);
            }
        }
        var createLoaders = {
            1: GLTFFileLoader._CreateGLTF1Loader,
            2: GLTFFileLoader._CreateGLTF2Loader
        };
        var createLoader = createLoaders[version.major];
        if (!createLoader) {
            throw new Error("Unsupported version: " + asset.version);
        }
        return createLoader(this);
    };
    GLTFFileLoader.prototype._parseJson = function (json) {
        this._startPerformanceCounter("Parse JSON");
        this._log("JSON length: " + json.length);
        var parsed = JSON.parse(json);
        this._endPerformanceCounter("Parse JSON");
        return parsed;
    };
    GLTFFileLoader.prototype._unpackBinaryAsync = function (dataReader) {
        var _this = this;
        this._startPerformanceCounter("Unpack Binary");
        // Read magic + version + length + json length + json format
        return dataReader.loadAsync(20).then(function () {
            var Binary = {
                Magic: 0x46546C67
            };
            var magic = dataReader.readUint32();
            if (magic !== Binary.Magic) {
                throw new Error("Unexpected magic: " + magic);
            }
            var version = dataReader.readUint32();
            if (_this.loggingEnabled) {
                _this._log("Binary version: " + version);
            }
            var length = dataReader.readUint32();
            if (dataReader.buffer.byteLength !== 0 && length !== dataReader.buffer.byteLength) {
                throw new Error("Length in header does not match actual data length: " + length + " != " + dataReader.buffer.byteLength);
            }
            var unpacked;
            switch (version) {
                case 1: {
                    unpacked = _this._unpackBinaryV1Async(dataReader, length);
                    break;
                }
                case 2: {
                    unpacked = _this._unpackBinaryV2Async(dataReader, length);
                    break;
                }
                default: {
                    throw new Error("Unsupported version: " + version);
                }
            }
            _this._endPerformanceCounter("Unpack Binary");
            return unpacked;
        });
    };
    GLTFFileLoader.prototype._unpackBinaryV1Async = function (dataReader, length) {
        var ContentFormat = {
            JSON: 0
        };
        var contentLength = dataReader.readUint32();
        var contentFormat = dataReader.readUint32();
        if (contentFormat !== ContentFormat.JSON) {
            throw new Error("Unexpected content format: " + contentFormat);
        }
        var bodyLength = length - dataReader.byteOffset;
        var data = { json: this._parseJson(dataReader.readString(contentLength)), bin: null };
        if (bodyLength !== 0) {
            var startByteOffset_1 = dataReader.byteOffset;
            data.bin = {
                readAsync: function (byteOffset, byteLength) { return dataReader.buffer.readAsync(startByteOffset_1 + byteOffset, byteLength); },
                byteLength: bodyLength
            };
        }
        return Promise.resolve(data);
    };
    GLTFFileLoader.prototype._unpackBinaryV2Async = function (dataReader, length) {
        var _this = this;
        var ChunkFormat = {
            JSON: 0x4E4F534A,
            BIN: 0x004E4942
        };
        // Read the JSON chunk header.
        var chunkLength = dataReader.readUint32();
        var chunkFormat = dataReader.readUint32();
        if (chunkFormat !== ChunkFormat.JSON) {
            throw new Error("First chunk format is not JSON");
        }
        // Bail if there are no other chunks.
        if (dataReader.byteOffset + chunkLength === length) {
            return dataReader.loadAsync(chunkLength).then(function () {
                return { json: _this._parseJson(dataReader.readString(chunkLength)), bin: null };
            });
        }
        // Read the JSON chunk and the length and type of the next chunk.
        return dataReader.loadAsync(chunkLength + 8).then(function () {
            var data = { json: _this._parseJson(dataReader.readString(chunkLength)), bin: null };
            var readAsync = function () {
                var chunkLength = dataReader.readUint32();
                var chunkFormat = dataReader.readUint32();
                switch (chunkFormat) {
                    case ChunkFormat.JSON: {
                        throw new Error("Unexpected JSON chunk");
                    }
                    case ChunkFormat.BIN: {
                        var startByteOffset_2 = dataReader.byteOffset;
                        data.bin = {
                            readAsync: function (byteOffset, byteLength) { return dataReader.buffer.readAsync(startByteOffset_2 + byteOffset, byteLength); },
                            byteLength: chunkLength
                        };
                        dataReader.skipBytes(chunkLength);
                        break;
                    }
                    default: {
                        // ignore unrecognized chunkFormat
                        dataReader.skipBytes(chunkLength);
                        break;
                    }
                }
                if (dataReader.byteOffset !== length) {
                    return dataReader.loadAsync(8).then(readAsync);
                }
                return Promise.resolve(data);
            };
            return readAsync();
        });
    };
    GLTFFileLoader._parseVersion = function (version) {
        if (version === "1.0" || version === "1.0.1") {
            return {
                major: 1,
                minor: 0
            };
        }
        var match = (version + "").match(/^(\d+)\.(\d+)/);
        if (!match) {
            return null;
        }
        return {
            major: parseInt(match[1]),
            minor: parseInt(match[2])
        };
    };
    GLTFFileLoader._compareVersion = function (a, b) {
        if (a.major > b.major) {
            return 1;
        }
        if (a.major < b.major) {
            return -1;
        }
        if (a.minor > b.minor) {
            return 1;
        }
        if (a.minor < b.minor) {
            return -1;
        }
        return 0;
    };
    /** @hidden */
    GLTFFileLoader.prototype._logOpen = function (message) {
        this._log(message);
        this._logIndentLevel++;
    };
    /** @hidden */
    GLTFFileLoader.prototype._logClose = function () {
        --this._logIndentLevel;
    };
    GLTFFileLoader.prototype._logEnabled = function (message) {
        var spaces = GLTFFileLoader._logSpaces.substr(0, this._logIndentLevel * 2);
        babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Logger"].Log("" + spaces + message);
    };
    GLTFFileLoader.prototype._logDisabled = function (message) {
    };
    GLTFFileLoader.prototype._startPerformanceCounterEnabled = function (counterName) {
        babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Tools"].StartPerformanceCounter(counterName);
    };
    GLTFFileLoader.prototype._startPerformanceCounterDisabled = function (counterName) {
    };
    GLTFFileLoader.prototype._endPerformanceCounterEnabled = function (counterName) {
        babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["Tools"].EndPerformanceCounter(counterName);
    };
    GLTFFileLoader.prototype._endPerformanceCounterDisabled = function (counterName) {
    };
    // ----------
    // V1 options
    // ----------
    /**
     * Set this property to false to disable incremental loading which delays the loader from calling the success callback until after loading the meshes and shaders.
     * Textures always loads asynchronously. For example, the success callback can compute the bounding information of the loaded meshes when incremental loading is disabled.
     * Defaults to true.
     * @hidden
     */
    GLTFFileLoader.IncrementalLoading = true;
    /**
     * Set this property to true in order to work with homogeneous coordinates, available with some converters and exporters.
     * Defaults to false. See https://en.wikipedia.org/wiki/Homogeneous_coordinates.
     * @hidden
     */
    GLTFFileLoader.HomogeneousCoordinates = false;
    GLTFFileLoader.magicBase64Encoded = "Z2xURg"; // "glTF" base64 encoded (without the quotes!)
    GLTFFileLoader._logSpaces = "                                ";
    return GLTFFileLoader;
}());

if (babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["SceneLoader"]) {
    babylonjs_Misc_observable__WEBPACK_IMPORTED_MODULE_0__["SceneLoader"].RegisterPlugin(new GLTFFileLoader());
}


/***/ }),

/***/ "./glTF/glTFValidation.ts":
/*!********************************!*\
  !*** ./glTF/glTFValidation.ts ***!
  \********************************/
/*! exports provided: GLTFValidation */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GLTFValidation", function() { return GLTFValidation; });
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! babylonjs/Misc/tools */ "babylonjs/Misc/tools");
/* harmony import */ var babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__);

function validateAsync(data, rootUrl, fileName, getExternalResource) {
    var options = {
        externalResourceFunction: function (uri) { return getExternalResource(uri).then(function (value) { return new Uint8Array(value); }); }
    };
    if (fileName) {
        options.uri = (rootUrl === "file:" ? fileName : rootUrl + fileName);
    }
    return (data instanceof ArrayBuffer)
        ? GLTFValidator.validateBytes(new Uint8Array(data), options)
        : GLTFValidator.validateString(data, options);
}
/**
 * The worker function that gets converted to a blob url to pass into a worker.
 */
function workerFunc() {
    var pendingExternalResources = [];
    onmessage = function (message) {
        var data = message.data;
        switch (data.id) {
            case "init": {
                importScripts(data.url);
                break;
            }
            case "validate": {
                validateAsync(data.data, data.rootUrl, data.fileName, function (uri) { return new Promise(function (resolve, reject) {
                    var index = pendingExternalResources.length;
                    pendingExternalResources.push({ resolve: resolve, reject: reject });
                    postMessage({ id: "getExternalResource", index: index, uri: uri });
                }); }).then(function (value) {
                    postMessage({ id: "validate.resolve", value: value });
                }, function (reason) {
                    postMessage({ id: "validate.reject", reason: reason });
                });
                break;
            }
            case "getExternalResource.resolve": {
                pendingExternalResources[data.index].resolve(data.value);
                break;
            }
            case "getExternalResource.reject": {
                pendingExternalResources[data.index].reject(data.reason);
                break;
            }
        }
    };
}
/**
 * glTF validation
 */
var GLTFValidation = /** @class */ (function () {
    function GLTFValidation() {
    }
    /**
     * Validate a glTF asset using the glTF-Validator.
     * @param data The JSON of a glTF or the array buffer of a binary glTF
     * @param rootUrl The root url for the glTF
     * @param fileName The file name for the glTF
     * @param getExternalResource The callback to get external resources for the glTF validator
     * @returns A promise that resolves with the glTF validation results once complete
     */
    GLTFValidation.ValidateAsync = function (data, rootUrl, fileName, getExternalResource) {
        var _this = this;
        if (typeof Worker === "function") {
            return new Promise(function (resolve, reject) {
                var workerContent = validateAsync + "(" + workerFunc + ")()";
                var workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));
                var worker = new Worker(workerBlobUrl);
                var onError = function (error) {
                    worker.removeEventListener("error", onError);
                    worker.removeEventListener("message", onMessage);
                    reject(error);
                };
                var onMessage = function (message) {
                    var data = message.data;
                    switch (data.id) {
                        case "getExternalResource": {
                            getExternalResource(data.uri).then(function (value) {
                                worker.postMessage({ id: "getExternalResource.resolve", index: data.index, value: value }, [value]);
                            }, function (reason) {
                                worker.postMessage({ id: "getExternalResource.reject", index: data.index, reason: reason });
                            });
                            break;
                        }
                        case "validate.resolve": {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            resolve(data.value);
                            break;
                        }
                        case "validate.reject": {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            reject(data.reason);
                        }
                    }
                };
                worker.addEventListener("error", onError);
                worker.addEventListener("message", onMessage);
                worker.postMessage({ id: "init", url: babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["Tools"].GetAbsoluteUrl(_this.Configuration.url) });
                worker.postMessage({ id: "validate", data: data, rootUrl: rootUrl, fileName: fileName });
            });
        }
        else {
            if (!this._LoadScriptPromise) {
                this._LoadScriptPromise = babylonjs_Misc_tools__WEBPACK_IMPORTED_MODULE_0__["Tools"].LoadScriptAsync(this.Configuration.url);
            }
            return this._LoadScriptPromise.then(function () {
                return validateAsync(data, rootUrl, fileName, getExternalResource);
            });
        }
    };
    /**
     * The configuration. Defaults to `{ url: "https://preview.babylonjs.com/gltf_validator.js" }`.
     */
    GLTFValidation.Configuration = {
        url: "https://preview.babylonjs.com/gltf_validator.js"
    };
    return GLTFValidation;
}());



/***/ }),

/***/ "./legacy/legacy-glTF.ts":
/*!*******************************!*\
  !*** ./legacy/legacy-glTF.ts ***!
  \*******************************/
/*! exports provided: GLTFLoaderCoordinateSystemMode, GLTFLoaderAnimationStartMode, GLTFLoaderState, GLTFFileLoader, GLTFValidation */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _glTF_glTFFileLoader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../glTF/glTFFileLoader */ "./glTF/glTFFileLoader.ts");
/* harmony import */ var _glTF_glTFValidation__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTF/glTFValidation */ "./glTF/glTFValidation.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFLoaderCoordinateSystemMode", function() { return _glTF_glTFFileLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoaderCoordinateSystemMode"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFLoaderAnimationStartMode", function() { return _glTF_glTFFileLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoaderAnimationStartMode"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFLoaderState", function() { return _glTF_glTFFileLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFLoaderState"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFFileLoader", function() { return _glTF_glTFFileLoader__WEBPACK_IMPORTED_MODULE_0__["GLTFFileLoader"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFValidation", function() { return _glTF_glTFValidation__WEBPACK_IMPORTED_MODULE_1__["GLTFValidation"]; });



/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    globalObject.BABYLON = globalObject.BABYLON || {};
    for (var key in _glTF_glTFFileLoader__WEBPACK_IMPORTED_MODULE_0__) {
        globalObject.BABYLON[key] = _glTF_glTFFileLoader__WEBPACK_IMPORTED_MODULE_0__[key];
    }
    for (var key in _glTF_glTFValidation__WEBPACK_IMPORTED_MODULE_1__) {
        globalObject.BABYLON[key] = _glTF_glTFValidation__WEBPACK_IMPORTED_MODULE_1__[key];
    }
}



/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./legacy/legacy-glTF2.ts":
/*!********************************!*\
  !*** ./legacy/legacy-glTF2.ts ***!
  \********************************/
/*! exports provided: GLTF2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var _glTF_2_0_Extensions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../glTF/2.0/Extensions */ "./glTF/2.0/Extensions/index.ts");
/* harmony import */ var _glTF_2_0_glTFLoaderInterfaces__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../glTF/2.0/glTFLoaderInterfaces */ "./glTF/2.0/glTFLoaderInterfaces.ts");
/* harmony import */ var _glTF_2_0_glTFLoaderInterfaces__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_glTF_2_0_glTFLoaderInterfaces__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _glTF_2_0__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../glTF/2.0 */ "./glTF/2.0/index.ts");
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "GLTF2", function() { return _glTF_2_0__WEBPACK_IMPORTED_MODULE_2__; });



/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    globalObject.BABYLON = globalObject.BABYLON || {};
    var BABYLON = globalObject.BABYLON;
    BABYLON.GLTF2 = BABYLON.GLTF2 || {};
    BABYLON.GLTF2.Loader = BABYLON.GLTF2.Loader || {};
    BABYLON.GLTF2.Loader.Extensions = BABYLON.GLTF2.Loader.Extensions || {};
    var keys = [];
    for (var key in _glTF_2_0_Extensions__WEBPACK_IMPORTED_MODULE_0__) {
        BABYLON.GLTF2.Loader.Extensions[key] = _glTF_2_0_Extensions__WEBPACK_IMPORTED_MODULE_0__[key];
        keys.push(key);
    }
    for (var key in _glTF_2_0_glTFLoaderInterfaces__WEBPACK_IMPORTED_MODULE_1__) {
        BABYLON.GLTF2.Loader[key] = _glTF_2_0_glTFLoaderInterfaces__WEBPACK_IMPORTED_MODULE_1__[key];
        keys.push(key);
    }
    for (var key in _glTF_2_0__WEBPACK_IMPORTED_MODULE_2__) {
        // Prevent Reassignment.
        if (keys.indexOf(key) > -1) {
            continue;
        }
        BABYLON.GLTF2[key] = _glTF_2_0__WEBPACK_IMPORTED_MODULE_2__[key];
    }
}


/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "../../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./legacy/legacy-glTF2FileLoader.ts":
/*!******************************************!*\
  !*** ./legacy/legacy-glTF2FileLoader.ts ***!
  \******************************************/
/*! exports provided: GLTFLoaderCoordinateSystemMode, GLTFLoaderAnimationStartMode, GLTFLoaderState, GLTFFileLoader, GLTFValidation, GLTF2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _legacy_glTF__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./legacy-glTF */ "./legacy/legacy-glTF.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFLoaderCoordinateSystemMode", function() { return _legacy_glTF__WEBPACK_IMPORTED_MODULE_0__["GLTFLoaderCoordinateSystemMode"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFLoaderAnimationStartMode", function() { return _legacy_glTF__WEBPACK_IMPORTED_MODULE_0__["GLTFLoaderAnimationStartMode"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFLoaderState", function() { return _legacy_glTF__WEBPACK_IMPORTED_MODULE_0__["GLTFLoaderState"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFFileLoader", function() { return _legacy_glTF__WEBPACK_IMPORTED_MODULE_0__["GLTFFileLoader"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTFValidation", function() { return _legacy_glTF__WEBPACK_IMPORTED_MODULE_0__["GLTFValidation"]; });

/* harmony import */ var _legacy_glTF2__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./legacy-glTF2 */ "./legacy/legacy-glTF2.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GLTF2", function() { return _legacy_glTF2__WEBPACK_IMPORTED_MODULE_1__["GLTF2"]; });





/***/ }),

/***/ "babylonjs/Misc/tools":
/*!****************************************************************************************************!*\
  !*** external {"root":"BABYLON","commonjs":"babylonjs","commonjs2":"babylonjs","amd":"babylonjs"} ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_babylonjs_Misc_tools__;

/***/ })

/******/ });
});
//# sourceMappingURL=babylon.glTF2FileLoader.js.map