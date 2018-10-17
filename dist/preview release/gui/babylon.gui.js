<<<<<<< HEAD
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babylonjs"));
	else if(typeof define === 'function' && define.amd)
		define("babylonjs-gui", ["babylonjs"], factory);
	else if(typeof exports === 'object')
		exports["babylonjs-gui"] = factory(require("babylonjs"));
	else
		root["BABYLON"] = root["BABYLON"] || {}, root["BABYLON"]["GUI"] = factory(root["BABYLON"]);
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/legacy.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../node_modules/webpack/buildin/global.js":
/*!*************************************************!*\
  !*** ../node_modules/webpack/buildin/global.js ***!
  \*************************************************/
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

/***/ "./src/2D/advancedDynamicTexture.ts":
/*!******************************************!*\
  !*** ./src/2D/advancedDynamicTexture.ts ***!
  \******************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var container_1 = __webpack_require__(/*! ./controls/container */ "./src/2D/controls/container.ts");
var style_1 = __webpack_require__(/*! ./style */ "./src/2D/style.ts");
var measure_1 = __webpack_require__(/*! ./measure */ "./src/2D/measure.ts");
/**
 * Class used to create texture to support 2D GUI elements
 * @see http://doc.babylonjs.com/how_to/gui
 */
var AdvancedDynamicTexture = /** @class */ (function (_super) {
    __extends(AdvancedDynamicTexture, _super);
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
        if (samplingMode === void 0) { samplingMode = babylonjs_1.Texture.NEAREST_SAMPLINGMODE; }
        var _this = _super.call(this, name, { width: width, height: height }, scene, generateMipMaps, samplingMode, babylonjs_1.Engine.TEXTUREFORMAT_RGBA) || this;
        _this._isDirty = false;
        /** @hidden */
        _this._rootContainer = new container_1.Container("root");
        /** @hidden */
        _this._lastControlOver = {};
        /** @hidden */
        _this._lastControlDown = {};
        /** @hidden */
        _this._capturingControl = {};
        /** @hidden */
        _this._linkedControls = new Array();
        _this._isFullscreen = false;
        _this._fullscreenViewport = new babylonjs_1.Viewport(0, 0, 1, 1);
        _this._idealWidth = 0;
        _this._idealHeight = 0;
        _this._useSmallestIdeal = false;
        _this._renderAtIdealSize = false;
        _this._blockNextFocusCheck = false;
        _this._renderScale = 1;
        /**
         * Gets or sets a boolean defining if alpha is stored as premultiplied
         */
        _this.premulAlpha = false;
        scene = _this.getScene();
        if (!scene || !_this._texture) {
            return _this;
        }
        _this._rootCanvas = scene.getEngine().getRenderingCanvas();
        _this._renderObserver = scene.onBeforeCameraRenderObservable.add(function (camera) { return _this._checkUpdate(camera); });
        _this._preKeyboardObserver = scene.onPreKeyboardObservable.add(function (info) {
            if (!_this._focusedControl) {
                return;
            }
            if (info.type === babylonjs_1.KeyboardEventTypes.KEYDOWN) {
                _this._focusedControl.processKeyboard(info.event);
            }
            info.skipOnPointerObservable = true;
        });
        _this._rootContainer._link(null, _this);
        _this.hasAlpha = true;
        if (!width || !height) {
            _this._resizeObserver = scene.getEngine().onResizeObservable.add(function () { return _this._onResize(); });
            _this._onResize();
        }
        _this._texture.isReady = true;
        return _this;
    }
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "idealWidth", {
        /**
         * Gets or sets the ideal width used to design controls.
         * The GUI will then rescale everything accordingly
         * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "idealHeight", {
        /**
         * Gets or sets the ideal height used to design controls.
         * The GUI will then rescale everything accordingly
         * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "useSmallestIdeal", {
        /**
         * Gets or sets a boolean indicating if the smallest ideal value must be used if idealWidth and idealHeight are both set
         * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "renderAtIdealSize", {
        /**
         * Gets or sets a boolean indicating if adaptive scaling must be used
         * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "layer", {
        /**
         * Gets the underlying layer used to render the texture when in fullscreen mode
         */
        get: function () {
            return this._layerToDispose;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AdvancedDynamicTexture.prototype, "rootContainer", {
        /**
         * Gets the root container control
         */
        get: function () {
            return this._rootContainer;
        },
        enumerable: true,
        configurable: true
    });
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
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
    /**
     * Marks the texture as dirty forcing a complete update
     */
    AdvancedDynamicTexture.prototype.markAsDirty = function () {
        this._isDirty = true;
    };
    /**
     * Helper function used to create a new style
     * @returns a new style
     * @see http://doc.babylonjs.com/how_to/gui#styles
     */
    AdvancedDynamicTexture.prototype.createStyle = function () {
        return new style_1.Style(this);
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
        this._rootCanvas = null;
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
        if (this._layerToDispose) {
            this._layerToDispose.texture = null;
            this._layerToDispose.dispose();
            this._layerToDispose = null;
        }
        this._rootContainer.dispose();
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
            return babylonjs_1.Vector2.Zero();
        }
        var globalViewport = this._getGlobalViewport(scene);
        var projectedPosition = babylonjs_1.Vector3.Project(position, worldMatrix, scene.getTransformMatrix(), globalViewport);
        projectedPosition.scaleInPlace(this.renderScale);
        return new babylonjs_1.Vector2(projectedPosition.x, projectedPosition.y);
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
            for (var _i = 0, _a = this._linkedControls; _i < _a.length; _i++) {
                var control = _a[_i];
                if (!control.isVisible) {
                    continue;
                }
                var mesh = control._linkedMesh;
                if (!mesh || mesh.isDisposed()) {
                    babylonjs_1.Tools.SetImmediate(function () {
                        control.linkWithMesh(null);
                    });
                    continue;
                }
                var position = mesh.getBoundingInfo().boundingSphere.center;
                var projectedPosition = babylonjs_1.Vector3.Project(position, mesh.getWorldMatrix(), scene.getTransformMatrix(), globalViewport);
                if (projectedPosition.z < 0 || projectedPosition.z > 1) {
                    control.notRenderable = true;
                    continue;
                }
                control.notRenderable = false;
                // Account for RenderScale.
                projectedPosition.scaleInPlace(this.renderScale);
                control._moveToProjectedPosition(projectedPosition);
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
        // Clear
        var context = this.getContext();
        context.clearRect(0, 0, renderWidth, renderHeight);
        if (this._background) {
            context.save();
            context.fillStyle = this._background;
            context.fillRect(0, 0, renderWidth, renderHeight);
            context.restore();
        }
        // Render
        context.font = "18px Arial";
        context.strokeStyle = "white";
        var measure = new measure_1.Measure(0, 0, renderWidth, renderHeight);
        this._rootContainer._draw(measure, context);
    };
    /** @hidden */
    AdvancedDynamicTexture.prototype._changeCursor = function (cursor) {
        if (this._rootCanvas) {
            this._rootCanvas.style.cursor = cursor;
        }
    };
    AdvancedDynamicTexture.prototype._doPicking = function (x, y, type, pointerId, buttonIndex) {
        var scene = this.getScene();
        if (!scene) {
            return;
        }
        var engine = scene.getEngine();
        var textureSize = this.getSize();
        if (this._isFullscreen) {
            x = x * (textureSize.width / engine.getRenderWidth());
            y = y * (textureSize.height / engine.getRenderHeight());
        }
        if (this._capturingControl[pointerId]) {
            this._capturingControl[pointerId]._processObservables(type, x, y, pointerId, buttonIndex);
            return;
        }
        if (!this._rootContainer._processPicking(x, y, type, pointerId, buttonIndex)) {
            this._changeCursor("");
            if (type === babylonjs_1.PointerEventTypes.POINTERMOVE) {
                if (this._lastControlOver[pointerId]) {
                    this._lastControlOver[pointerId]._onPointerOut(this._lastControlOver[pointerId]);
                }
                delete this._lastControlOver[pointerId];
            }
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
        this._pointerMoveObserver = scene.onPrePointerObservable.add(function (pi, state) {
            if (scene.isPointerCaptured((pi.event).pointerId)) {
                return;
            }
            if (pi.type !== babylonjs_1.PointerEventTypes.POINTERMOVE
                && pi.type !== babylonjs_1.PointerEventTypes.POINTERUP
                && pi.type !== babylonjs_1.PointerEventTypes.POINTERDOWN) {
                return;
            }
            if (!scene) {
                return;
            }
            var camera = scene.cameraToUseForPointers || scene.activeCamera;
            if (!camera) {
                return;
            }
            var engine = scene.getEngine();
            var viewport = camera.viewport;
            var x = (scene.pointerX / engine.getHardwareScalingLevel() - viewport.x * engine.getRenderWidth()) / viewport.width;
            var y = (scene.pointerY / engine.getHardwareScalingLevel() - viewport.y * engine.getRenderHeight()) / viewport.height;
            _this._shouldBlockPointer = false;
            // Do picking modifies _shouldBlockPointer
            _this._doPicking(x, y, pi.type, pi.event.pointerId || 0, pi.event.button);
            // Avoid overwriting a true skipOnPointerObservable to false
            if (_this._shouldBlockPointer) {
                pi.skipOnPointerObservable = _this._shouldBlockPointer;
            }
        });
        this._attachToOnPointerOut(scene);
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
            if (pi.type !== babylonjs_1.PointerEventTypes.POINTERMOVE
                && pi.type !== babylonjs_1.PointerEventTypes.POINTERUP
                && pi.type !== babylonjs_1.PointerEventTypes.POINTERDOWN) {
                return;
            }
            var pointerId = pi.event.pointerId || 0;
            if (pi.pickInfo && pi.pickInfo.hit && pi.pickInfo.pickedMesh === mesh) {
                var uv = pi.pickInfo.getTextureCoordinates();
                if (uv) {
                    var size = _this.getSize();
                    _this._doPicking(uv.x * size.width, (1.0 - uv.y) * size.height, pi.type, pointerId, pi.event.button);
                }
            }
            else if (pi.type === babylonjs_1.PointerEventTypes.POINTERUP) {
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
            else if (pi.type === babylonjs_1.PointerEventTypes.POINTERMOVE) {
                if (_this._lastControlOver[pointerId]) {
                    _this._lastControlOver[pointerId]._onPointerOut(_this._lastControlOver[pointerId]);
                }
                delete _this._lastControlOver[pointerId];
            }
        });
        mesh.enablePointerMoveEvents = supportPointerMove;
        this._attachToOnPointerOut(scene);
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
            if (_this._lastControlDown[pointerEvent.pointerId]) {
                _this._lastControlDown[pointerEvent.pointerId]._forcePointerUp();
            }
            delete _this._lastControlDown[pointerEvent.pointerId];
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
        var result = new AdvancedDynamicTexture(mesh.name + " AdvancedDynamicTexture", width, height, mesh.getScene(), true, babylonjs_1.Texture.TRILINEAR_SAMPLINGMODE);
        var material = new babylonjs_1.StandardMaterial("AdvancedDynamicTextureMaterial", mesh.getScene());
        material.backFaceCulling = false;
        material.diffuseColor = babylonjs_1.Color3.Black();
        material.specularColor = babylonjs_1.Color3.Black();
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
        if (sampling === void 0) { sampling = babylonjs_1.Texture.BILINEAR_SAMPLINGMODE; }
        var result = new AdvancedDynamicTexture(name, 0, 0, scene, false, sampling);
        // Display
        var layer = new babylonjs_1.Layer(name + "_layer", null, scene, !foreground);
        layer.texture = result;
        result._layerToDispose = layer;
        result._isFullscreen = true;
        // Attach
        result.attach();
        return result;
    };
    return AdvancedDynamicTexture;
}(babylonjs_1.DynamicTexture));
exports.AdvancedDynamicTexture = AdvancedDynamicTexture;


/***/ }),

/***/ "./src/2D/controls/baseSlider.ts":
/*!***************************************!*\
  !*** ./src/2D/controls/baseSlider.ts ***!
  \***************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
var valueAndUnit_1 = __webpack_require__(/*! ../valueAndUnit */ "./src/2D/valueAndUnit.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
/**
 * Class used to create slider controls
 */
var BaseSlider = /** @class */ (function (_super) {
    __extends(BaseSlider, _super);
    /**
     * Creates a new BaseSlider
     * @param name defines the control name
     */
    function BaseSlider(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._thumbWidth = new valueAndUnit_1.ValueAndUnit(20, valueAndUnit_1.ValueAndUnit.UNITMODE_PIXEL, false);
        _this._minimum = 0;
        _this._maximum = 100;
        _this._value = 50;
        _this._isVertical = false;
        _this._barOffset = new valueAndUnit_1.ValueAndUnit(5, valueAndUnit_1.ValueAndUnit.UNITMODE_PIXEL, false);
        _this._isThumbClamped = false;
        _this._displayThumb = true;
        // Shared rendering info
        _this._effectiveBarOffset = 0;
        /** Observable raised when the sldier value changes */
        _this.onValueChangedObservable = new babylonjs_1.Observable();
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BaseSlider.prototype, "barOffsetInPixels", {
        /** Gets main bar offset in pixels*/
        get: function () {
            return this._barOffset.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BaseSlider.prototype, "thumbWidthInPixels", {
        /** Gets thumb width in pixels */
        get: function () {
            return this._thumbWidth.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
    BaseSlider.prototype._updateValueFromPointer = function (x, y) {
        if (this.rotation != 0) {
            this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);
            x = this._transformedPosition.x;
            y = this._transformedPosition.y;
        }
        if (this._isVertical) {
            this.value = this._minimum + (1 - ((y - this._currentMeasure.top) / this._currentMeasure.height)) * (this._maximum - this._minimum);
        }
        else {
            this.value = this._minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this._maximum - this._minimum);
        }
    };
    BaseSlider.prototype._onPointerDown = function (target, coordinates, pointerId, buttonIndex) {
        if (!_super.prototype._onPointerDown.call(this, target, coordinates, pointerId, buttonIndex)) {
            return false;
        }
        this._pointerIsDown = true;
        this._updateValueFromPointer(coordinates.x, coordinates.y);
        this._host._capturingControl[pointerId] = this;
        return true;
    };
    BaseSlider.prototype._onPointerMove = function (target, coordinates) {
        if (this._pointerIsDown) {
            this._updateValueFromPointer(coordinates.x, coordinates.y);
        }
        _super.prototype._onPointerMove.call(this, target, coordinates);
    };
    BaseSlider.prototype._onPointerUp = function (target, coordinates, pointerId, buttonIndex, notifyClick) {
        this._pointerIsDown = false;
        delete this._host._capturingControl[pointerId];
        _super.prototype._onPointerUp.call(this, target, coordinates, pointerId, buttonIndex, notifyClick);
    };
    return BaseSlider;
}(control_1.Control));
exports.BaseSlider = BaseSlider;


/***/ }),

/***/ "./src/2D/controls/button.ts":
/*!***********************************!*\
  !*** ./src/2D/controls/button.ts ***!
  \***********************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var rectangle_1 = __webpack_require__(/*! ./rectangle */ "./src/2D/controls/rectangle.ts");
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
var textBlock_1 = __webpack_require__(/*! ./textBlock */ "./src/2D/controls/textBlock.ts");
var image_1 = __webpack_require__(/*! ./image */ "./src/2D/controls/image.ts");
/**
 * Class used to create 2D buttons
 */
var Button = /** @class */ (function (_super) {
    __extends(Button, _super);
    /**
     * Creates a new Button
     * @param name defines the name of the button
     */
    function Button(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this.thickness = 1;
        _this.isPointerBlocker = true;
        _this.pointerEnterAnimation = function () {
            _this.alpha -= 0.1;
        };
        _this.pointerOutAnimation = function () {
            _this.alpha += 0.1;
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Button.prototype, "textBlock", {
        /**
         * Returns the image part of the button (if any)
         */
        get: function () {
            return this._textBlock;
        },
        enumerable: true,
        configurable: true
    });
    Button.prototype._getTypeName = function () {
        return "Button";
    };
    // While being a container, the button behaves like a control.
    /** @hidden */
    Button.prototype._processPicking = function (x, y, type, pointerId, buttonIndex) {
        if (!this.isHitTestVisible || !this.isVisible || this.notRenderable) {
            return false;
        }
        if (!_super.prototype.contains.call(this, x, y)) {
            return false;
        }
        this._processObservables(type, x, y, pointerId, buttonIndex);
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
    Button.prototype._onPointerOut = function (target) {
        if (this.pointerOutAnimation) {
            this.pointerOutAnimation();
        }
        _super.prototype._onPointerOut.call(this, target);
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
        var textBlock = new textBlock_1.TextBlock(name + "_button", text);
        textBlock.textWrapping = true;
        textBlock.textHorizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.paddingLeft = "20%";
        result.addControl(textBlock);
        // Adding image
        var iconImage = new image_1.Image(name + "_icon", imageUrl);
        iconImage.width = "20%";
        iconImage.stretch = image_1.Image.STRETCH_UNIFORM;
        iconImage.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
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
        var iconImage = new image_1.Image(name + "_icon", imageUrl);
        iconImage.stretch = image_1.Image.STRETCH_FILL;
        iconImage.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
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
        var textBlock = new textBlock_1.TextBlock(name + "_button", text);
        textBlock.textWrapping = true;
        textBlock.textHorizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_CENTER;
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
        var iconImage = new image_1.Image(name + "_icon", imageUrl);
        iconImage.stretch = image_1.Image.STRETCH_FILL;
        result.addControl(iconImage);
        // Adding text
        var textBlock = new textBlock_1.TextBlock(name + "_button", text);
        textBlock.textWrapping = true;
        textBlock.textHorizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_CENTER;
        result.addControl(textBlock);
        // Store
        result._image = iconImage;
        result._textBlock = textBlock;
        return result;
    };
    return Button;
}(rectangle_1.Rectangle));
exports.Button = Button;


/***/ }),

/***/ "./src/2D/controls/checkbox.ts":
/*!*************************************!*\
  !*** ./src/2D/controls/checkbox.ts ***!
  \*************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var stackPanel_1 = __webpack_require__(/*! ./stackPanel */ "./src/2D/controls/stackPanel.ts");
var textBlock_1 = __webpack_require__(/*! ./textBlock */ "./src/2D/controls/textBlock.ts");
/**
 * Class used to represent a 2D checkbox
 */
var Checkbox = /** @class */ (function (_super) {
    __extends(Checkbox, _super);
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
        _this.onIsCheckedChangedObservable = new babylonjs_1.Observable();
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Checkbox.prototype._getTypeName = function () {
        return "CheckBox";
    };
    /** @hidden */
    Checkbox.prototype._draw = function (parentMeasure, context) {
        context.save();
        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
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
                context.fillStyle = this._isEnabled ? this.color : this._disabledColor;
                var offsetWidth = actualWidth * this._checkSizeRatio;
                var offseHeight = actualHeight * this._checkSizeRatio;
                context.fillRect(this._currentMeasure.left + this._thickness / 2 + (actualWidth - offsetWidth) / 2, this._currentMeasure.top + this._thickness / 2 + (actualHeight - offseHeight) / 2, offsetWidth, offseHeight);
            }
            context.strokeStyle = this.color;
            context.lineWidth = this._thickness;
            context.strokeRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2, actualWidth, actualHeight);
        }
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
        var panel = new stackPanel_1.StackPanel();
        panel.isVertical = false;
        panel.height = "30px";
        var checkbox = new Checkbox();
        checkbox.width = "20px";
        checkbox.height = "20px";
        checkbox.isChecked = true;
        checkbox.color = "green";
        checkbox.onIsCheckedChangedObservable.add(onValueChanged);
        panel.addControl(checkbox);
        var header = new textBlock_1.TextBlock();
        header.text = title;
        header.width = "180px";
        header.paddingLeft = "5px";
        header.textHorizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.color = "white";
        panel.addControl(header);
        return panel;
    };
    return Checkbox;
}(control_1.Control));
exports.Checkbox = Checkbox;


/***/ }),

/***/ "./src/2D/controls/colorpicker.ts":
/*!****************************************!*\
  !*** ./src/2D/controls/colorpicker.ts ***!
  \****************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
/** Class used to create color pickers */
var ColorPicker = /** @class */ (function (_super) {
    __extends(ColorPicker, _super);
    /**
     * Creates a new ColorPicker
     * @param name defines the control name
     */
    function ColorPicker(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._value = babylonjs_1.Color3.Red();
        _this._tmpColor = new babylonjs_1.Color3();
        _this._pointerStartedOnSquare = false;
        _this._pointerStartedOnWheel = false;
        _this._squareLeft = 0;
        _this._squareTop = 0;
        _this._squareSize = 0;
        _this._h = 360;
        _this._s = 1;
        _this._v = 1;
        /**
         * Observable raised when the value changes
         */
        _this.onValueChangedObservable = new babylonjs_1.Observable();
        // Events
        _this._pointerIsDown = false;
        _this.value = new babylonjs_1.Color3(.88, .1, .1);
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
            this._RGBtoHSV(this._value, this._tmpColor);
            this._h = this._tmpColor.r;
            this._s = Math.max(this._tmpColor.g, 0.00001);
            this._v = Math.max(this._tmpColor.b, 0.00001);
            this._markAsDirty();
            this.onValueChangedObservable.notifyObservers(this._value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ColorPicker.prototype, "width", {
        /** Gets or sets control width */
        set: function (value) {
            if (this._width.toString(this._host) === value) {
                return;
            }
            if (this._width.fromString(value)) {
                this._height.fromString(value);
                this._markAsDirty();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ColorPicker.prototype, "height", {
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    ColorPicker.prototype._getTypeName = function () {
        return "ColorPicker";
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
                this._HSVtoRGB(ang * 180 / Math.PI + 180, dist / radius, 1, color);
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
    ColorPicker.prototype._RGBtoHSV = function (color, result) {
        var r = color.r;
        var g = color.g;
        var b = color.b;
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var h = 0;
        var s = 0;
        var v = max;
        var dm = max - min;
        if (max !== 0) {
            s = dm / max;
        }
        if (max != min) {
            if (max == r) {
                h = (g - b) / dm;
                if (g < b) {
                    h += 6;
                }
            }
            else if (max == g) {
                h = (b - r) / dm + 2;
            }
            else if (max == b) {
                h = (r - g) / dm + 4;
            }
            h *= 60;
        }
        result.r = h;
        result.g = s;
        result.b = v;
    };
    ColorPicker.prototype._HSVtoRGB = function (hue, saturation, value, result) {
        var chroma = value * saturation;
        var h = hue / 60;
        var x = chroma * (1 - Math.abs((h % 2) - 1));
        var r = 0;
        var g = 0;
        var b = 0;
        if (h >= 0 && h <= 1) {
            r = chroma;
            g = x;
        }
        else if (h >= 1 && h <= 2) {
            r = x;
            g = chroma;
        }
        else if (h >= 2 && h <= 3) {
            g = chroma;
            b = x;
        }
        else if (h >= 3 && h <= 4) {
            g = x;
            b = chroma;
        }
        else if (h >= 4 && h <= 5) {
            r = x;
            b = chroma;
        }
        else if (h >= 5 && h <= 6) {
            r = chroma;
            b = x;
        }
        var m = value - chroma;
        result.set((r + m), (g + m), (b + m));
    };
    /** @hidden */
    ColorPicker.prototype._draw = function (parentMeasure, context) {
        context.save();
        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
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
        }
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
            this._s = Math.max(this._s, 0.00001);
            this._v = Math.min(this._v, 1);
            this._v = Math.max(this._v, 0.00001);
        }
        this._HSVtoRGB(this._h, this._s, this._v, this._tmpColor);
        this.value = this._tmpColor;
    };
    ColorPicker.prototype._isPointOnSquare = function (coordinates) {
        this._updateSquareProps();
        var left = this._squareLeft;
        var top = this._squareTop;
        var size = this._squareSize;
        if (coordinates.x >= left && coordinates.x <= left + size &&
            coordinates.y >= top && coordinates.y <= top + size) {
            return true;
        }
        return false;
    };
    ColorPicker.prototype._isPointOnWheel = function (coordinates) {
        var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height) * .5;
        var centerX = radius + this._currentMeasure.left;
        var centerY = radius + this._currentMeasure.top;
        var wheelThickness = radius * .2;
        var innerRadius = radius - wheelThickness;
        var radiusSq = radius * radius;
        var innerRadiusSq = innerRadius * innerRadius;
        var dx = coordinates.x - centerX;
        var dy = coordinates.y - centerY;
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
        if (this._isPointOnSquare(coordinates)) {
            this._pointerStartedOnSquare = true;
        }
        else if (this._isPointOnWheel(coordinates)) {
            this._pointerStartedOnWheel = true;
        }
        this._updateValueFromPointer(coordinates.x, coordinates.y);
        this._host._capturingControl[pointerId] = this;
        return true;
    };
    ColorPicker.prototype._onPointerMove = function (target, coordinates) {
        if (this._pointerIsDown) {
            this._updateValueFromPointer(coordinates.x, coordinates.y);
        }
        _super.prototype._onPointerMove.call(this, target, coordinates);
    };
    ColorPicker.prototype._onPointerUp = function (target, coordinates, pointerId, buttonIndex, notifyClick) {
        this._pointerIsDown = false;
        delete this._host._capturingControl[pointerId];
        _super.prototype._onPointerUp.call(this, target, coordinates, pointerId, buttonIndex, notifyClick);
    };
    return ColorPicker;
}(control_1.Control));
exports.ColorPicker = ColorPicker;


/***/ }),

/***/ "./src/2D/controls/container.ts":
/*!**************************************!*\
  !*** ./src/2D/controls/container.ts ***!
  \**************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
var measure_1 = __webpack_require__(/*! ../measure */ "./src/2D/measure.ts");
/**
 * Root class for 2D containers
 * @see http://doc.babylonjs.com/how_to/gui#containers
 */
var Container = /** @class */ (function (_super) {
    __extends(Container, _super);
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
        _this._measureForChildren = measure_1.Measure.Empty();
        /** @hidden */
        _this._adaptWidthToChildren = false;
        /** @hidden */
        _this._adaptHeightToChildren = false;
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Container.prototype, "children", {
        /** Gets the list of children */
        get: function () {
            return this._children;
        },
        enumerable: true,
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
        control._link(this, this._host);
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
        var children = this._children.slice();
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
        for (var index = 0; index < this._children.length; index++) {
            if (this._children[index].zIndex > control.zIndex) {
                this._children.splice(index, 0, control);
                return;
            }
        }
        this._children.push(control);
        control.parent = this;
        this._markAsDirty();
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
            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }
            context.fillStyle = this._background;
            context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowBlur = 0;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
            }
        }
    };
    /** @hidden */
    Container.prototype._link = function (root, host) {
        _super.prototype._link.call(this, root, host);
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            child._link(this, host);
        }
    };
    /** @hidden */
    Container.prototype._draw = function (parentMeasure, context) {
        if (!this.isVisible || this.notRenderable) {
            return;
        }
        context.save();
        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
            this._localDraw(context);
            if (this.clipChildren) {
                this._clipForChildren(context);
            }
            var computedWidth = -1;
            var computedHeight = -1;
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                if (child.isVisible && !child.notRenderable) {
                    child._tempParentMeasure.copyFrom(this._measureForChildren);
                    child._draw(this._measureForChildren, context);
                    if (child.onAfterDrawObservable.hasObservers()) {
                        child.onAfterDrawObservable.notifyObservers(child);
                    }
                    if (this.adaptWidthToChildren && child._width.isPixel) {
                        computedWidth = Math.max(computedWidth, child._currentMeasure.width);
                    }
                    if (this.adaptHeightToChildren && child._height.isPixel) {
                        computedHeight = Math.max(computedHeight, child._currentMeasure.height);
                    }
                }
            }
            if (this.adaptWidthToChildren && computedWidth >= 0) {
                this.width = computedWidth + "px";
            }
            if (this.adaptHeightToChildren && computedHeight >= 0) {
                this.height = computedHeight + "px";
            }
        }
        context.restore();
        if (this.onAfterDrawObservable.hasObservers()) {
            this.onAfterDrawObservable.notifyObservers(this);
        }
    };
    /** @hidden */
    Container.prototype._processPicking = function (x, y, type, pointerId, buttonIndex) {
        if (!this.isVisible || this.notRenderable) {
            return false;
        }
        if (!_super.prototype.contains.call(this, x, y)) {
            return false;
        }
        // Checking backwards to pick closest first
        for (var index = this._children.length - 1; index >= 0; index--) {
            var child = this._children[index];
            if (child._processPicking(x, y, type, pointerId, buttonIndex)) {
                if (child.hoverCursor) {
                    this._host._changeCursor(child.hoverCursor);
                }
                return true;
            }
        }
        if (!this.isHitTestVisible) {
            return false;
        }
        return this._processObservables(type, x, y, pointerId, buttonIndex);
    };
    /** @hidden */
    Container.prototype._clipForChildren = function (context) {
        // DO nothing
    };
    /** @hidden */
    Container.prototype._additionalProcessing = function (parentMeasure, context) {
        _super.prototype._additionalProcessing.call(this, parentMeasure, context);
        this._measureForChildren.copyFrom(this._currentMeasure);
    };
    /** Releases associated resources */
    Container.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var control = _a[_i];
            control.dispose();
        }
    };
    return Container;
}(control_1.Control));
exports.Container = Container;


/***/ }),

/***/ "./src/2D/controls/control.ts":
/*!************************************!*\
  !*** ./src/2D/controls/control.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var valueAndUnit_1 = __webpack_require__(/*! ../valueAndUnit */ "./src/2D/valueAndUnit.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var measure_1 = __webpack_require__(/*! ../measure */ "./src/2D/measure.ts");
var math2D_1 = __webpack_require__(/*! ../math2D */ "./src/2D/math2D.ts");
/**
 * Root class used for all 2D controls
 * @see http://doc.babylonjs.com/how_to/gui#controls
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
        this._currentMeasure = measure_1.Measure.Empty();
        this._fontFamily = "Arial";
        this._fontStyle = "";
        this._fontWeight = "";
        this._fontSize = new valueAndUnit_1.ValueAndUnit(18, valueAndUnit_1.ValueAndUnit.UNITMODE_PIXEL, false);
        /** @hidden */
        this._width = new valueAndUnit_1.ValueAndUnit(1, valueAndUnit_1.ValueAndUnit.UNITMODE_PERCENTAGE, false);
        /** @hidden */
        this._height = new valueAndUnit_1.ValueAndUnit(1, valueAndUnit_1.ValueAndUnit.UNITMODE_PERCENTAGE, false);
        this._color = "";
        this._style = null;
        /** @hidden */
        this._horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        /** @hidden */
        this._verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this._isDirty = true;
        /** @hidden */
        this._tempParentMeasure = measure_1.Measure.Empty();
        /** @hidden */
        this._cachedParentMeasure = measure_1.Measure.Empty();
        this._paddingLeft = new valueAndUnit_1.ValueAndUnit(0);
        this._paddingRight = new valueAndUnit_1.ValueAndUnit(0);
        this._paddingTop = new valueAndUnit_1.ValueAndUnit(0);
        this._paddingBottom = new valueAndUnit_1.ValueAndUnit(0);
        /** @hidden */
        this._left = new valueAndUnit_1.ValueAndUnit(0);
        /** @hidden */
        this._top = new valueAndUnit_1.ValueAndUnit(0);
        this._scaleX = 1.0;
        this._scaleY = 1.0;
        this._rotation = 0;
        this._transformCenterX = 0.5;
        this._transformCenterY = 0.5;
        this._transformMatrix = math2D_1.Matrix2D.Identity();
        /** @hidden */
        this._invertTransformMatrix = math2D_1.Matrix2D.Identity();
        /** @hidden */
        this._transformedPosition = babylonjs_1.Vector2.Zero();
        this._onlyMeasureMode = false;
        this._isMatrixDirty = true;
        this._isVisible = true;
        this._fontSet = false;
        this._dummyVector2 = babylonjs_1.Vector2.Zero();
        this._downCount = 0;
        this._enterCount = -1;
        this._doNotRender = false;
        this._downPointerIds = {};
        this._isEnabled = true;
        this._disabledColor = "#9a9a9a";
        /** Gets or sets a boolean indicating if the control can be hit with pointer events */
        this.isHitTestVisible = true;
        /** Gets or sets a boolean indicating if the control can block pointer events */
        this.isPointerBlocker = false;
        /** Gets or sets a boolean indicating if the control can be focusable */
        this.isFocusInvisible = false;
        /** Gets or sets a boolean indicating if the children are clipped to the current control bounds */
        this.clipChildren = true;
        /** Gets or sets a value indicating the offset to apply on X axis to render the shadow */
        this.shadowOffsetX = 0;
        /** Gets or sets a value indicating the offset to apply on Y axis to render the shadow */
        this.shadowOffsetY = 0;
        /** Gets or sets a value indicating the amount of blur to use to render the shadow */
        this.shadowBlur = 0;
        /** Gets or sets a value indicating the color of the shadow (black by default ie. "#000") */
        this.shadowColor = '#000';
        /** Gets or sets the cursor to use when the control is hovered */
        this.hoverCursor = "";
        /** @hidden */
        this._linkOffsetX = new valueAndUnit_1.ValueAndUnit(0);
        /** @hidden */
        this._linkOffsetY = new valueAndUnit_1.ValueAndUnit(0);
        /**
        * An event triggered when the pointer move over the control.
        */
        this.onPointerMoveObservable = new babylonjs_1.Observable();
        /**
        * An event triggered when the pointer move out of the control.
        */
        this.onPointerOutObservable = new babylonjs_1.Observable();
        /**
        * An event triggered when the pointer taps the control
        */
        this.onPointerDownObservable = new babylonjs_1.Observable();
        /**
        * An event triggered when pointer up
        */
        this.onPointerUpObservable = new babylonjs_1.Observable();
        /**
        * An event triggered when a control is clicked on
        */
        this.onPointerClickObservable = new babylonjs_1.Observable();
        /**
        * An event triggered when pointer enters the control
        */
        this.onPointerEnterObservable = new babylonjs_1.Observable();
        /**
        * An event triggered when the control is marked as dirty
        */
        this.onDirtyObservable = new babylonjs_1.Observable();
        /**
       * An event triggered after the control is drawn
       */
        this.onAfterDrawObservable = new babylonjs_1.Observable();
    }
    Object.defineProperty(Control.prototype, "typeName", {
        // Properties
        /** Gets the control type name */
        get: function () {
            return this._getTypeName();
        },
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "scaleX", {
        /** Gets or sets a value indicating the scale factor on X axis (1 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "scaleY", {
        /** Gets or sets a value indicating the scale factor on Y axis (1 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "rotation", {
        /** Gets or sets the rotation angle (0 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "transformCenterY", {
        /** Gets or sets the transformation center on Y axis (0 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "transformCenterX", {
        /** Gets or sets the transformation center on X axis (0 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "horizontalAlignment", {
        /**
         * Gets or sets the horizontal alignment
         * @see http://doc.babylonjs.com/how_to/gui#alignments
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "verticalAlignment", {
        /**
         * Gets or sets the vertical alignment
         * @see http://doc.babylonjs.com/how_to/gui#alignments
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "width", {
        /**
         * Gets or sets control width
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
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
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "widthInPixels", {
        /**
         * Gets control width in pixel
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._width.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "height", {
        /**
         * Gets or sets control height
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._height.toString(this._host);
        },
        set: function (value) {
            if (this._height.toString(this._host) === value) {
                return;
            }
            if (this._height.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "heightInPixels", {
        /**
         * Gets control height in pixel
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "fontFamily", {
        /** Gets or set font family */
        get: function () {
            return this._fontFamily;
        },
        set: function (value) {
            if (this._fontFamily === value) {
                return;
            }
            this._fontFamily = value;
            this._resetFontCache();
        },
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "style", {
        /**
         * Gets or sets style
         * @see http://doc.babylonjs.com/how_to/gui#styles
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "_isFontSizeInPercentage", {
        /** @hidden */
        get: function () {
            return this._fontSize.isPercentage;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "fontSizeInPixels", {
        /** Gets font size in pixels */
        get: function () {
            var fontSizeToUse = this._style ? this._style._fontSize : this._fontSize;
            if (fontSizeToUse.isPixel) {
                return fontSizeToUse.getValue(this._host);
            }
            return fontSizeToUse.getValueInPixel(this._host, this._tempParentMeasure.height || this._cachedParentMeasure.height);
        },
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
            if (this._root) {
                this._root._reOrderControl(this);
            }
        },
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "isDirty", {
        /** Gets a boolean indicating that the control needs to update its rendering */
        get: function () {
            return this._isDirty;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "linkedMesh", {
        /**
         * Gets the current linked mesh (or null if none)
         */
        get: function () {
            return this._linkedMesh;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingLeft", {
        /**
         * Gets or sets a value indicating the padding to use on the left of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingLeft.toString(this._host);
        },
        set: function (value) {
            if (this._paddingLeft.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingLeftInPixels", {
        /**
         * Gets a value indicating the padding in pixels to use on the left of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingLeft.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingRight", {
        /**
         * Gets or sets a value indicating the padding to use on the right of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingRight.toString(this._host);
        },
        set: function (value) {
            if (this._paddingRight.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingRightInPixels", {
        /**
         * Gets a value indicating the padding in pixels to use on the right of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingRight.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingTop", {
        /**
         * Gets or sets a value indicating the padding to use on the top of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingTop.toString(this._host);
        },
        set: function (value) {
            if (this._paddingTop.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingTopInPixels", {
        /**
         * Gets a value indicating the padding in pixels to use on the top of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingTop.getValueInPixel(this._host, this._cachedParentMeasure.height);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingBottom", {
        /**
         * Gets or sets a value indicating the padding to use on the bottom of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingBottom.toString(this._host);
        },
        set: function (value) {
            if (this._paddingBottom.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "paddingBottomInPixels", {
        /**
         * Gets a value indicating the padding in pixels to use on the bottom of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._paddingBottom.getValueInPixel(this._host, this._cachedParentMeasure.height);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "left", {
        /**
         * Gets or sets a value indicating the left coordinate of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._left.toString(this._host);
        },
        set: function (value) {
            if (this._left.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "leftInPixels", {
        /**
         * Gets a value indicating the left coordinate in pixels of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._left.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "top", {
        /**
         * Gets or sets a value indicating the top coordinate of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._top.toString(this._host);
        },
        set: function (value) {
            if (this._top.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "topInPixels", {
        /**
         * Gets a value indicating the top coordinate in pixels of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        get: function () {
            return this._top.getValueInPixel(this._host, this._cachedParentMeasure.height);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "linkOffsetX", {
        /**
         * Gets or sets a value indicating the offset on X axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        get: function () {
            return this._linkOffsetX.toString(this._host);
        },
        set: function (value) {
            if (this._linkOffsetX.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "linkOffsetXInPixels", {
        /**
         * Gets a value indicating the offset in pixels on X axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        get: function () {
            return this._linkOffsetX.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "linkOffsetY", {
        /**
         * Gets or sets a value indicating the offset on Y axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        get: function () {
            return this._linkOffsetY.toString(this._host);
        },
        set: function (value) {
            if (this._linkOffsetY.fromString(value)) {
                this._markAsDirty();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "linkOffsetYInPixels", {
        /**
         * Gets a value indicating the offset in pixels on Y axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        get: function () {
            return this._linkOffsetY.getValueInPixel(this._host, this._cachedParentMeasure.height);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "centerX", {
        /** Gets the center coordinate on X axis */
        get: function () {
            return this._currentMeasure.left + this._currentMeasure.width / 2;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control.prototype, "centerY", {
        /** Gets the center coordinate on Y axis */
        get: function () {
            return this._currentMeasure.top + this._currentMeasure.height / 2;
        },
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    /** @hidden */
    Control.prototype._getTypeName = function () {
        return "Control";
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
        var result = babylonjs_1.Vector2.Zero();
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
        var result = babylonjs_1.Vector2.Zero();
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
        if (!this._host || this._root !== this._host._rootContainer) {
            babylonjs_1.Tools.Error("Cannot move a control to a vector3 if the control is not at root level");
            return;
        }
        this.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        var globalViewport = this._host._getGlobalViewport(scene);
        var projectedPosition = babylonjs_1.Vector3.Project(position, babylonjs_1.Matrix.Identity(), scene.getTransformMatrix(), globalViewport);
        this._moveToProjectedPosition(projectedPosition);
        if (projectedPosition.z < 0 || projectedPosition.z > 1) {
            this.notRenderable = true;
            return;
        }
        this.notRenderable = false;
    };
    /**
     * Link current control with a target mesh
     * @param mesh defines the mesh to link with
     * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
     */
    Control.prototype.linkWithMesh = function (mesh) {
        if (!this._host || this._root && this._root !== this._host._rootContainer) {
            if (mesh) {
                babylonjs_1.Tools.Error("Cannot link a control to a mesh if the control is not at root level");
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
        this._onlyMeasureMode = this._currentMeasure.width === 0 || this._currentMeasure.height === 0;
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
    Control.prototype._markAsDirty = function (force) {
        if (force === void 0) { force = false; }
        if (!this._isVisible && !force) {
            return;
        }
        this._isDirty = true;
        if (!this._host) {
            return; // Not yet connected
        }
        this._host.markAsDirty();
    };
    /** @hidden */
    Control.prototype._markAllAsDirty = function () {
        this._markAsDirty();
        if (this._font) {
            this._prepareFont();
        }
    };
    /** @hidden */
    Control.prototype._link = function (root, host) {
        this._root = root;
        this._host = host;
    };
    /** @hidden */
    Control.prototype._transform = function (context) {
        if (!this._isMatrixDirty && this._scaleX === 1 && this._scaleY === 1 && this._rotation === 0) {
            return;
        }
        // postTranslate
        var offsetX = this._currentMeasure.width * this._transformCenterX + this._currentMeasure.left;
        var offsetY = this._currentMeasure.height * this._transformCenterY + this._currentMeasure.top;
        context.translate(offsetX, offsetY);
        // rotate
        context.rotate(this._rotation);
        // scale
        context.scale(this._scaleX, this._scaleY);
        // preTranslate
        context.translate(-offsetX, -offsetY);
        // Need to update matrices?
        if (this._isMatrixDirty || this._cachedOffsetX !== offsetX || this._cachedOffsetY !== offsetY) {
            this._cachedOffsetX = offsetX;
            this._cachedOffsetY = offsetY;
            this._isMatrixDirty = false;
            this._flagDescendantsAsMatrixDirty();
            math2D_1.Matrix2D.ComposeToRef(-offsetX, -offsetY, this._rotation, this._scaleX, this._scaleY, this._root ? this._root._transformMatrix : null, this._transformMatrix);
            this._transformMatrix.invertToRef(this._invertTransformMatrix);
        }
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
        if (this._alphaSet) {
            context.globalAlpha = this.parent ? this.parent.alpha * this._alpha : this._alpha;
        }
    };
    /** @hidden */
    Control.prototype._processMeasures = function (parentMeasure, context) {
        if (this._isDirty || !this._cachedParentMeasure.isEqualsTo(parentMeasure)) {
            this._isDirty = false;
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
        }
        if (this._currentMeasure.left > parentMeasure.left + parentMeasure.width) {
            return false;
        }
        if (this._currentMeasure.left + this._currentMeasure.width < parentMeasure.left) {
            return false;
        }
        if (this._currentMeasure.top > parentMeasure.top + parentMeasure.height) {
            return false;
        }
        if (this._currentMeasure.top + this._currentMeasure.height < parentMeasure.top) {
            return false;
        }
        // Transform
        this._transform(context);
        if (this._onlyMeasureMode) {
            this._onlyMeasureMode = false;
            return false; // We do not want rendering for this frame as they are measure dependant information that need to be gathered
        }
        // Clip
        if (this.clipChildren) {
            this._clip(context);
            context.clip();
        }
        return true;
    };
    /** @hidden */
    Control.prototype._clip = function (context) {
        context.beginPath();
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            var shadowOffsetX = this.shadowOffsetX;
            var shadowOffsetY = this.shadowOffsetY;
            var shadowBlur = this.shadowBlur;
            var leftShadowOffset = Math.min(Math.min(shadowOffsetX, 0) - shadowBlur * 2, 0);
            var rightShadowOffset = Math.max(Math.max(shadowOffsetX, 0) + shadowBlur * 2, 0);
            var topShadowOffset = Math.min(Math.min(shadowOffsetY, 0) - shadowBlur * 2, 0);
            var bottomShadowOffset = Math.max(Math.max(shadowOffsetY, 0) + shadowBlur * 2, 0);
            context.rect(this._currentMeasure.left + leftShadowOffset, this._currentMeasure.top + topShadowOffset, this._currentMeasure.width + rightShadowOffset - leftShadowOffset, this._currentMeasure.height + bottomShadowOffset - topShadowOffset);
        }
        else {
            context.rect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
        }
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
    Control.prototype._draw = function (parentMeasure, context) {
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
    Control.prototype._processPicking = function (x, y, type, pointerId, buttonIndex) {
        if (!this._isEnabled) {
            return false;
        }
        if (!this.isHitTestVisible || !this.isVisible || this._doNotRender) {
            return false;
        }
        if (!this.contains(x, y)) {
            return false;
        }
        this._processObservables(type, x, y, pointerId, buttonIndex);
        return true;
    };
    /** @hidden */
    Control.prototype._onPointerMove = function (target, coordinates) {
        var canNotify = this.onPointerMoveObservable.notifyObservers(coordinates, -1, target, this);
        if (canNotify && this.parent != null) {
            this.parent._onPointerMove(target, coordinates);
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
    Control.prototype._onPointerOut = function (target) {
        if (!this._isEnabled) {
            return;
        }
        this._enterCount = 0;
        var canNotify = this.onPointerOutObservable.notifyObservers(this, -1, target, this);
        if (canNotify && this.parent != null) {
            this.parent._onPointerOut(target);
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
        var canNotify = this.onPointerDownObservable.notifyObservers(new math2D_1.Vector2WithInfo(coordinates, buttonIndex), -1, target, this);
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
            canNotifyClick = this.onPointerClickObservable.notifyObservers(new math2D_1.Vector2WithInfo(coordinates, buttonIndex), -1, target, this);
        }
        var canNotify = this.onPointerUpObservable.notifyObservers(new math2D_1.Vector2WithInfo(coordinates, buttonIndex), -1, target, this);
        if (canNotify && this.parent != null) {
            this.parent._onPointerUp(target, coordinates, pointerId, buttonIndex, canNotifyClick);
        }
    };
    /** @hidden */
    Control.prototype._forcePointerUp = function (pointerId) {
        if (pointerId === void 0) { pointerId = null; }
        if (pointerId !== null) {
            this._onPointerUp(this, babylonjs_1.Vector2.Zero(), pointerId, 0, true);
        }
        else {
            for (var key in this._downPointerIds) {
                this._onPointerUp(this, babylonjs_1.Vector2.Zero(), +key, 0, true);
            }
        }
    };
    /** @hidden */
    Control.prototype._processObservables = function (type, x, y, pointerId, buttonIndex) {
        if (!this._isEnabled) {
            return false;
        }
        this._dummyVector2.copyFromFloats(x, y);
        if (type === babylonjs_1.PointerEventTypes.POINTERMOVE) {
            this._onPointerMove(this, this._dummyVector2);
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
        if (type === babylonjs_1.PointerEventTypes.POINTERDOWN) {
            this._onPointerDown(this, this._dummyVector2, pointerId, buttonIndex);
            this._host._lastControlDown[pointerId] = this;
            this._host._lastPickedControl = this;
            return true;
        }
        if (type === babylonjs_1.PointerEventTypes.POINTERUP) {
            if (this._host._lastControlDown[pointerId]) {
                this._host._lastControlDown[pointerId]._onPointerUp(this, this._dummyVector2, pointerId, buttonIndex, true);
            }
            delete this._host._lastControlDown[pointerId];
            return true;
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
        this.onAfterDrawObservable.clear();
        this.onPointerDownObservable.clear();
        this.onPointerEnterObservable.clear();
        this.onPointerMoveObservable.clear();
        this.onPointerOutObservable.clear();
        this.onPointerUpObservable.clear();
        this.onPointerClickObservable.clear();
        if (this._styleObserver && this._style) {
            this._style.onChangedObservable.remove(this._styleObserver);
            this._styleObserver = null;
        }
        if (this._root) {
            this._root.removeControl(this);
            this._root = null;
        }
        if (this._host) {
            var index = this._host._linkedControls.indexOf(this);
            if (index > -1) {
                this.linkWithMesh(null);
            }
        }
    };
    Object.defineProperty(Control, "HORIZONTAL_ALIGNMENT_LEFT", {
        /** HORIZONTAL_ALIGNMENT_LEFT */
        get: function () {
            return Control._HORIZONTAL_ALIGNMENT_LEFT;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control, "HORIZONTAL_ALIGNMENT_RIGHT", {
        /** HORIZONTAL_ALIGNMENT_RIGHT */
        get: function () {
            return Control._HORIZONTAL_ALIGNMENT_RIGHT;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control, "HORIZONTAL_ALIGNMENT_CENTER", {
        /** HORIZONTAL_ALIGNMENT_CENTER */
        get: function () {
            return Control._HORIZONTAL_ALIGNMENT_CENTER;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control, "VERTICAL_ALIGNMENT_TOP", {
        /** VERTICAL_ALIGNMENT_TOP */
        get: function () {
            return Control._VERTICAL_ALIGNMENT_TOP;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control, "VERTICAL_ALIGNMENT_BOTTOM", {
        /** VERTICAL_ALIGNMENT_BOTTOM */
        get: function () {
            return Control._VERTICAL_ALIGNMENT_BOTTOM;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control, "VERTICAL_ALIGNMENT_CENTER", {
        /** VERTICAL_ALIGNMENT_CENTER */
        get: function () {
            return Control._VERTICAL_ALIGNMENT_CENTER;
        },
        enumerable: true,
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
exports.Control = Control;


/***/ }),

/***/ "./src/2D/controls/displayGrid.ts":
/*!****************************************!*\
  !*** ./src/2D/controls/displayGrid.ts ***!
  \****************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = __webpack_require__(/*! . */ "./src/2D/controls/index.ts");
/** Class used to render a grid  */
var DisplayGrid = /** @class */ (function (_super) {
    __extends(DisplayGrid, _super);
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    DisplayGrid.prototype._draw = function (parentMeasure, context) {
        context.save();
        this._applyStates(context);
        if (this._isEnabled && this._processMeasures(parentMeasure, context)) {
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
}(_1.Control));
exports.DisplayGrid = DisplayGrid;


/***/ }),

/***/ "./src/2D/controls/ellipse.ts":
/*!************************************!*\
  !*** ./src/2D/controls/ellipse.ts ***!
  \************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = __webpack_require__(/*! ./container */ "./src/2D/controls/container.ts");
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
/** Class used to create 2D ellipse containers */
var Ellipse = /** @class */ (function (_super) {
    __extends(Ellipse, _super);
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
        enumerable: true,
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
        control_1.Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2 - this._thickness / 2, this._currentMeasure.height / 2 - this._thickness / 2, context);
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
        control_1.Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2, this._currentMeasure.height / 2, context);
        context.clip();
    };
    return Ellipse;
}(container_1.Container));
exports.Ellipse = Ellipse;


/***/ }),

/***/ "./src/2D/controls/grid.ts":
/*!*********************************!*\
  !*** ./src/2D/controls/grid.ts ***!
  \*********************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = __webpack_require__(/*! ./container */ "./src/2D/controls/container.ts");
var valueAndUnit_1 = __webpack_require__(/*! ../valueAndUnit */ "./src/2D/valueAndUnit.ts");
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
/**
 * Class used to create a 2D grid container
 */
var Grid = /** @class */ (function (_super) {
    __extends(Grid, _super);
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
    Object.defineProperty(Grid.prototype, "children", {
        /** Gets the list of children */
        get: function () {
            return this._childControls;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Adds a new row to the grid
     * @param height defines the height of the row (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the height is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    Grid.prototype.addRowDefinition = function (height, isPixel) {
        if (isPixel === void 0) { isPixel = false; }
        this._rowDefinitions.push(new valueAndUnit_1.ValueAndUnit(height, isPixel ? valueAndUnit_1.ValueAndUnit.UNITMODE_PIXEL : valueAndUnit_1.ValueAndUnit.UNITMODE_PERCENTAGE));
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
        this._columnDefinitions.push(new valueAndUnit_1.ValueAndUnit(width, isPixel ? valueAndUnit_1.ValueAndUnit.UNITMODE_PIXEL : valueAndUnit_1.ValueAndUnit.UNITMODE_PERCENTAGE));
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
        this._rowDefinitions[index] = new valueAndUnit_1.ValueAndUnit(height, isPixel ? valueAndUnit_1.ValueAndUnit.UNITMODE_PIXEL : valueAndUnit_1.ValueAndUnit.UNITMODE_PERCENTAGE);
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
        this._columnDefinitions[index] = new valueAndUnit_1.ValueAndUnit(width, isPixel ? valueAndUnit_1.ValueAndUnit.UNITMODE_PIXEL : valueAndUnit_1.ValueAndUnit.UNITMODE_PERCENTAGE);
        this._markAsDirty();
        return this;
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
        var x = Math.min(row, this._rowDefinitions.length - 1);
        var y = Math.min(column, this._columnDefinitions.length - 1);
        var key = x + ":" + y;
        var goodContainer = this._cells[key];
        if (!goodContainer) {
            goodContainer = new container_1.Container(key);
            this._cells[key] = goodContainer;
            goodContainer.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
            goodContainer.verticalAlignment = control_1.Control.VERTICAL_ALIGNMENT_TOP;
            _super.prototype.addControl.call(this, goodContainer);
        }
        goodContainer.addControl(control);
        this._childControls.push(control);
        control._tag = key;
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
        }
        this._markAsDirty();
        return this;
    };
    Grid.prototype._getTypeName = function () {
        return "Grid";
    };
    Grid.prototype._additionalProcessing = function (parentMeasure, context) {
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
        // Setting child sizes
        for (var key in this._cells) {
            if (!this._cells.hasOwnProperty(key)) {
                continue;
            }
            var split = key.split(":");
            var x = parseInt(split[0]);
            var y = parseInt(split[1]);
            var cell = this._cells[key];
            cell.left = lefts[y] + "px";
            cell.top = tops[x] + "px";
            cell.width = widths[y] + "px";
            cell.height = heights[x] + "px";
        }
        _super.prototype._additionalProcessing.call(this, parentMeasure, context);
    };
    /** Releases associated resources */
    Grid.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        for (var _i = 0, _a = this._childControls; _i < _a.length; _i++) {
            var control = _a[_i];
            control.dispose();
        }
    };
    return Grid;
}(container_1.Container));
exports.Grid = Grid;


/***/ }),

/***/ "./src/2D/controls/image.ts":
/*!**********************************!*\
  !*** ./src/2D/controls/image.ts ***!
  \**********************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
/**
 * Class used to create 2D images
 */
var Image = /** @class */ (function (_super) {
    __extends(Image, _super);
    /**
     * Creates a new Image
     * @param name defines the control name
     * @param url defines the image url
     */
    function Image(name, url) {
        if (url === void 0) { url = null; }
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._loaded = false;
        _this._stretch = Image.STRETCH_FILL;
        _this._autoScale = false;
        _this._sourceLeft = 0;
        _this._sourceTop = 0;
        _this._sourceWidth = 0;
        _this._sourceHeight = 0;
        _this._cellWidth = 0;
        _this._cellHeight = 0;
        _this._cellId = -1;
        /**
         * Observable notified when the content is loaded
         */
        _this.onImageLoadedObservable = new babylonjs_1.Observable();
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "autoScale", {
        /**
         * Gets or sets a boolean indicating if the image can force its container to adapt its size
         * @see http://doc.babylonjs.com/how_to/gui#image
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
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
            if (this._domImage.width) {
                this._onImageLoaded();
            }
            else {
                this._domImage.onload = function () {
                    _this._onImageLoaded();
                };
            }
        },
        enumerable: true,
        configurable: true
    });
    Image.prototype._onImageLoaded = function () {
        this._imageWidth = this._domImage.width;
        this._imageHeight = this._domImage.height;
        this._loaded = true;
        if (this._autoScale) {
            this.synchronizeSizeWithContent();
        }
        this.onImageLoadedObservable.notifyObservers(this);
        this._markAsDirty();
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
            this._domImage = document.createElement("img");
            this._domImage.onload = function () {
                _this._onImageLoaded();
            };
            if (value) {
                babylonjs_1.Tools.SetCorsBehavior(value, this._domImage);
                this._domImage.src = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "cellWidth", {
        /**
         * Gets or sets the cell width to use when animation sheet is enabled
         * @see http://doc.babylonjs.com/how_to/gui#image
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "cellHeight", {
        /**
         * Gets or sets the cell height to use when animation sheet is enabled
         * @see http://doc.babylonjs.com/how_to/gui#image
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Image.prototype, "cellId", {
        /**
         * Gets or sets the cell id to use (this will turn on the animation sheet mode)
         * @see http://doc.babylonjs.com/how_to/gui#image
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
        enumerable: true,
        configurable: true
    });
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
    Image.prototype._draw = function (parentMeasure, context) {
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
        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
            if (this._loaded) {
                switch (this._stretch) {
                    case Image.STRETCH_NONE:
                        context.drawImage(this._domImage, x, y, width, height, this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                        break;
                    case Image.STRETCH_FILL:
                        context.drawImage(this._domImage, x, y, width, height, this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                        break;
                    case Image.STRETCH_UNIFORM:
                        var hRatio = this._currentMeasure.width / width;
                        var vRatio = this._currentMeasure.height / height;
                        var ratio = Math.min(hRatio, vRatio);
                        var centerX = (this._currentMeasure.width - width * ratio) / 2;
                        var centerY = (this._currentMeasure.height - height * ratio) / 2;
                        context.drawImage(this._domImage, x, y, width, height, this._currentMeasure.left + centerX, this._currentMeasure.top + centerY, width * ratio, height * ratio);
                        break;
                    case Image.STRETCH_EXTEND:
                        context.drawImage(this._domImage, x, y, width, height, this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                        if (this._autoScale) {
                            this.synchronizeSizeWithContent();
                        }
                        if (this._root && this._root.parent) { // Will update root size if root is not the top root
                            this._root.width = this.width;
                            this._root.height = this.height;
                        }
                        break;
                }
            }
        }
        context.restore();
    };
    Image.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this.onImageLoadedObservable.clear();
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
    return Image;
}(control_1.Control));
exports.Image = Image;


/***/ }),

/***/ "./src/2D/controls/imageBasedSlider.ts":
/*!*********************************************!*\
  !*** ./src/2D/controls/imageBasedSlider.ts ***!
  \*********************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var baseSlider_1 = __webpack_require__(/*! ./baseSlider */ "./src/2D/controls/baseSlider.ts");
var measure_1 = __webpack_require__(/*! ../measure */ "./src/2D/measure.ts");
/**
 * Class used to create slider controls based on images
 */
var ImageBasedSlider = /** @class */ (function (_super) {
    __extends(ImageBasedSlider, _super);
    /**
     * Creates a new ImageBasedSlider
     * @param name defines the control name
     */
    function ImageBasedSlider(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._tempMeasure = new measure_1.Measure(0, 0, 0, 0);
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    ImageBasedSlider.prototype._getTypeName = function () {
        return "ImageBasedSlider";
    };
    ImageBasedSlider.prototype._draw = function (parentMeasure, context) {
        context.save();
        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
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
                this._backgroundImage._draw(this._tempMeasure, context);
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
                this._valueBarImage._draw(this._tempMeasure, context);
            }
            // Thumb
            if (this.displayThumb) {
                if (this.isVertical) {
                    this._tempMeasure.copyFromFloats(left - this._effectiveBarOffset, this._currentMeasure.top + thumbPosition, this._currentMeasure.width, this._effectiveThumbThickness);
                }
                else {
                    this._tempMeasure.copyFromFloats(this._currentMeasure.left + thumbPosition, this._currentMeasure.top, this._effectiveThumbThickness, this._currentMeasure.height);
                }
                this._thumbImage._draw(this._tempMeasure, context);
            }
        }
        context.restore();
    };
    return ImageBasedSlider;
}(baseSlider_1.BaseSlider));
exports.ImageBasedSlider = ImageBasedSlider;


/***/ }),

/***/ "./src/2D/controls/index.ts":
/*!**********************************!*\
  !*** ./src/2D/controls/index.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./button */ "./src/2D/controls/button.ts"));
__export(__webpack_require__(/*! ./checkbox */ "./src/2D/controls/checkbox.ts"));
__export(__webpack_require__(/*! ./colorpicker */ "./src/2D/controls/colorpicker.ts"));
__export(__webpack_require__(/*! ./container */ "./src/2D/controls/container.ts"));
__export(__webpack_require__(/*! ./control */ "./src/2D/controls/control.ts"));
__export(__webpack_require__(/*! ./ellipse */ "./src/2D/controls/ellipse.ts"));
__export(__webpack_require__(/*! ./grid */ "./src/2D/controls/grid.ts"));
__export(__webpack_require__(/*! ./image */ "./src/2D/controls/image.ts"));
__export(__webpack_require__(/*! ./inputText */ "./src/2D/controls/inputText.ts"));
__export(__webpack_require__(/*! ./inputPassword */ "./src/2D/controls/inputPassword.ts"));
__export(__webpack_require__(/*! ./line */ "./src/2D/controls/line.ts"));
__export(__webpack_require__(/*! ./multiLine */ "./src/2D/controls/multiLine.ts"));
__export(__webpack_require__(/*! ./radioButton */ "./src/2D/controls/radioButton.ts"));
__export(__webpack_require__(/*! ./stackPanel */ "./src/2D/controls/stackPanel.ts"));
__export(__webpack_require__(/*! ./selector */ "./src/2D/controls/selector.ts"));
__export(__webpack_require__(/*! ./textBlock */ "./src/2D/controls/textBlock.ts"));
__export(__webpack_require__(/*! ./virtualKeyboard */ "./src/2D/controls/virtualKeyboard.ts"));
__export(__webpack_require__(/*! ./rectangle */ "./src/2D/controls/rectangle.ts"));
__export(__webpack_require__(/*! ./displayGrid */ "./src/2D/controls/displayGrid.ts"));
__export(__webpack_require__(/*! ./baseSlider */ "./src/2D/controls/baseSlider.ts"));
__export(__webpack_require__(/*! ./slider */ "./src/2D/controls/slider.ts"));
__export(__webpack_require__(/*! ./imageBasedSlider */ "./src/2D/controls/imageBasedSlider.ts"));
__export(__webpack_require__(/*! ./statics */ "./src/2D/controls/statics.ts"));


/***/ }),

/***/ "./src/2D/controls/inputPassword.ts":
/*!******************************************!*\
  !*** ./src/2D/controls/inputPassword.ts ***!
  \******************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var inputText_1 = __webpack_require__(/*! ./inputText */ "./src/2D/controls/inputText.ts");
/**
 * Class used to create a password control
 */
var InputPassword = /** @class */ (function (_super) {
    __extends(InputPassword, _super);
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
}(inputText_1.InputText));
exports.InputPassword = InputPassword;


/***/ }),

/***/ "./src/2D/controls/inputText.ts":
/*!**************************************!*\
  !*** ./src/2D/controls/inputText.ts ***!
  \**************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
var valueAndUnit_1 = __webpack_require__(/*! ../valueAndUnit */ "./src/2D/valueAndUnit.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
/**
 * Class used to create input text control
 */
var InputText = /** @class */ (function (_super) {
    __extends(InputText, _super);
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
        _this._placeholderColor = "gray";
        _this._thickness = 1;
        _this._margin = new valueAndUnit_1.ValueAndUnit(10, valueAndUnit_1.ValueAndUnit.UNITMODE_PIXEL);
        _this._autoStretchWidth = true;
        _this._maxWidth = new valueAndUnit_1.ValueAndUnit(1, valueAndUnit_1.ValueAndUnit.UNITMODE_PERCENTAGE, false);
        _this._isFocused = false;
        _this._blinkIsEven = false;
        _this._cursorOffset = 0;
        _this._deadKey = false;
        _this._addKey = true;
        _this._currentKey = "";
        /** Gets or sets a string representing the message displayed on mobile when the control gets the focus */
        _this.promptMessage = "Please enter text:";
        /** Observable raised when the text changes */
        _this.onTextChangedObservable = new babylonjs_1.Observable();
        /** Observable raised just before an entered character is to be added */
        _this.onBeforeKeyAddObservable = new babylonjs_1.Observable();
        /** Observable raised when the control gets the focus */
        _this.onFocusObservable = new babylonjs_1.Observable();
        /** Observable raised when the control loses the focus */
        _this.onBlurObservable = new babylonjs_1.Observable();
        _this.text = text;
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "maxWidthInPixels", {
        /** Gets the maximum width allowed by the control in pixels */
        get: function () {
            return this._maxWidth.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "marginInPixels", {
        /** Gets control margin in pixels */
        get: function () {
            return this._margin.getValueInPixel(this._host, this._cachedParentMeasure.width);
        },
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InputText.prototype, "text", {
        /** Gets or sets the text displayed in the control */
        get: function () {
            return this._text;
        },
        set: function (value) {
            if (this._text === value) {
                return;
            }
            this._text = value;
            this._markAsDirty();
            this.onTextChangedObservable.notifyObservers(this);
        },
        enumerable: true,
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
        enumerable: true,
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
    };
    /** @hidden */
    InputText.prototype.onFocus = function () {
        if (!this._isEnabled) {
            return;
        }
        this._scrollLeft = null;
        this._isFocused = true;
        this._blinkIsEven = false;
        this._cursorOffset = 0;
        this._markAsDirty();
        this.onFocusObservable.notifyObservers(this);
        if (navigator.userAgent.indexOf("Mobile") !== -1) {
            var value = prompt(this.promptMessage);
            if (value !== null) {
                this.text = value;
            }
            this._host.focusedControl = null;
            return;
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
    InputText.prototype.processKey = function (keyCode, key) {
        // Specific cases
        switch (keyCode) {
            case 32: //SPACE
                key = " "; //ie11 key for space is "Spacebar"
                break;
            case 8: // BACKSPACE
                if (this._text && this._text.length > 0) {
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
                return;
            case 46: // DELETE
                if (this._text && this._text.length > 0) {
                    var deletePosition = this._text.length - this._cursorOffset;
                    this.text = this._text.slice(0, deletePosition) + this._text.slice(deletePosition + 1);
                    this._cursorOffset--;
                }
                return;
            case 13: // RETURN
                this._host.focusedControl = null;
                return;
            case 35: // END
                this._cursorOffset = 0;
                this._blinkIsEven = false;
                this._markAsDirty();
                return;
            case 36: // HOME
                this._cursorOffset = this._text.length;
                this._blinkIsEven = false;
                this._markAsDirty();
                return;
            case 37: // LEFT
                this._cursorOffset++;
                if (this._cursorOffset > this._text.length) {
                    this._cursorOffset = this._text.length;
                }
                this._blinkIsEven = false;
                this._markAsDirty();
                return;
            case 39: // RIGHT
                this._cursorOffset--;
                if (this._cursorOffset < 0) {
                    this._cursorOffset = 0;
                }
                this._blinkIsEven = false;
                this._markAsDirty();
                return;
            case 222: // Dead
                this.deadKey = true;
                return;
        }
        // Printable characters
        if (key &&
            ((keyCode === -1) || // Direct access
                (keyCode === 32) || // Space
                (keyCode > 47 && keyCode < 58) || // Numbers
                (keyCode > 64 && keyCode < 91) || // Letters
                (keyCode > 185 && keyCode < 193) || // Special characters
                (keyCode > 218 && keyCode < 223) || // Special characters
                (keyCode > 95 && keyCode < 112))) { // Numpad
            this._currentKey = key;
            this.onBeforeKeyAddObservable.notifyObservers(this);
            key = this._currentKey;
            if (this._addKey) {
                if (this._cursorOffset === 0) {
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
    InputText.prototype.processKeyboard = function (evt) {
        this.processKey(evt.keyCode, evt.key);
    };
    InputText.prototype._draw = function (parentMeasure, context) {
        var _this = this;
        context.save();
        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
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
                this._fontOffset = control_1.Control._GetFontOffset(context.font);
            }
            // Text
            var clipTextLeft = this._currentMeasure.left + this._margin.getValueInPixel(this._host, parentMeasure.width);
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
            var marginWidth = this._margin.getValueInPixel(this._host, parentMeasure.width) * 2;
            if (this._autoStretchWidth) {
                this.width = Math.min(this._maxWidth.getValueInPixel(this._host, parentMeasure.width), this._textWidth + marginWidth) + "px";
            }
            var rootY = this._fontOffset.ascent + (this._currentMeasure.height - this._fontOffset.height) / 2;
            var availableWidth = this._width.getValueInPixel(this._host, parentMeasure.width) - marginWidth;
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
                    context.fillRect(cursorLeft, this._currentMeasure.top + (this._currentMeasure.height - this._fontOffset.height) / 2, 2, this._fontOffset.height);
                }
                clearTimeout(this._blinkTimeout);
                this._blinkTimeout = setTimeout(function () {
                    _this._blinkIsEven = !_this._blinkIsEven;
                    _this._markAsDirty();
                }, 500);
            }
            context.restore();
            // Border
            if (this._thickness) {
                if (this.color) {
                    context.strokeStyle = this.color;
                }
                context.lineWidth = this._thickness;
                context.strokeRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2, this._currentMeasure.width - this._thickness, this._currentMeasure.height - this._thickness);
            }
        }
        context.restore();
    };
    InputText.prototype._onPointerDown = function (target, coordinates, pointerId, buttonIndex) {
        if (!_super.prototype._onPointerDown.call(this, target, coordinates, pointerId, buttonIndex)) {
            return false;
        }
        this._clickedCoordinate = coordinates.x;
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
    InputText.prototype._onPointerUp = function (target, coordinates, pointerId, buttonIndex, notifyClick) {
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
    };
    return InputText;
}(control_1.Control));
exports.InputText = InputText;


/***/ }),

/***/ "./src/2D/controls/line.ts":
/*!*********************************!*\
  !*** ./src/2D/controls/line.ts ***!
  \*********************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
var valueAndUnit_1 = __webpack_require__(/*! ../valueAndUnit */ "./src/2D/valueAndUnit.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
/** Class used to render 2D lines */
var Line = /** @class */ (function (_super) {
    __extends(Line, _super);
    /**
     * Creates a new Line
     * @param name defines the control name
     */
    function Line(name) {
        var _this = _super.call(this, name) || this;
        _this.name = name;
        _this._lineWidth = 1;
        _this._x1 = new valueAndUnit_1.ValueAndUnit(0);
        _this._y1 = new valueAndUnit_1.ValueAndUnit(0);
        _this._x2 = new valueAndUnit_1.ValueAndUnit(0);
        _this._y2 = new valueAndUnit_1.ValueAndUnit(0);
        _this._dash = new Array();
        _this.isHitTestVisible = false;
        _this._horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
        _this._verticalAlignment = control_1.Control.VERTICAL_ALIGNMENT_TOP;
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "horizontalAlignment", {
        /** Gets or sets horizontal alignment */
        set: function (value) {
            return;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "verticalAlignment", {
        /** Gets or sets vertical alignment */
        set: function (value) {
            return;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "_effectiveX2", {
        get: function () {
            return (this._connectedControl ? this._connectedControl.centerX : 0) + this._x2.getValue(this._host);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "_effectiveY2", {
        get: function () {
            return (this._connectedControl ? this._connectedControl.centerY : 0) + this._y2.getValue(this._host);
        },
        enumerable: true,
        configurable: true
    });
    Line.prototype._getTypeName = function () {
        return "Line";
    };
    Line.prototype._draw = function (parentMeasure, context) {
        context.save();
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }
        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
            context.strokeStyle = this.color;
            context.lineWidth = this._lineWidth;
            context.setLineDash(this._dash);
            context.beginPath();
            context.moveTo(this._x1.getValue(this._host), this._y1.getValue(this._host));
            context.lineTo(this._effectiveX2, this._effectiveY2);
            context.stroke();
        }
        context.restore();
    };
    Line.prototype._measure = function () {
        // Width / Height
        this._currentMeasure.width = Math.abs(this._x1.getValue(this._host) - this._effectiveX2) + this._lineWidth;
        this._currentMeasure.height = Math.abs(this._y1.getValue(this._host) - this._effectiveY2) + this._lineWidth;
    };
    Line.prototype._computeAlignment = function (parentMeasure, context) {
        this._currentMeasure.left = Math.min(this._x1.getValue(this._host), this._effectiveX2) - this._lineWidth / 2;
        this._currentMeasure.top = Math.min(this._y1.getValue(this._host), this._effectiveY2) - this._lineWidth / 2;
    };
    /**
     * Move one end of the line given 3D cartesian coordinates.
     * @param position Targeted world position
     * @param scene Scene
     * @param end (opt) Set to true to assign x2 and y2 coordinates of the line. Default assign to x1 and y1.
     */
    Line.prototype.moveToVector3 = function (position, scene, end) {
        if (end === void 0) { end = false; }
        if (!this._host || this._root !== this._host._rootContainer) {
            babylonjs_1.Tools.Error("Cannot move a control to a vector3 if the control is not at root level");
            return;
        }
        var globalViewport = this._host._getGlobalViewport(scene);
        var projectedPosition = babylonjs_1.Vector3.Project(position, babylonjs_1.Matrix.Identity(), scene.getTransformMatrix(), globalViewport);
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
}(control_1.Control));
exports.Line = Line;


/***/ }),

/***/ "./src/2D/controls/multiLine.ts":
/*!**************************************!*\
  !*** ./src/2D/controls/multiLine.ts ***!
  \**************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
var multiLinePoint_1 = __webpack_require__(/*! ../multiLinePoint */ "./src/2D/multiLinePoint.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
/**
 * Class used to create multi line control
 */
var MultiLine = /** @class */ (function (_super) {
    __extends(MultiLine, _super);
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
        _this.isHitTestVisible = false;
        _this._horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
        _this._verticalAlignment = control_1.Control.VERTICAL_ALIGNMENT_TOP;
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
        enumerable: true,
        configurable: true
    });
    /**
     * Gets point stored at specified index
     * @param index defines the index to look for
     * @returns the requested point if found
     */
    MultiLine.prototype.getAt = function (index) {
        if (!this._points[index]) {
            this._points[index] = new multiLinePoint_1.MultiLinePoint(this);
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
        if (item instanceof babylonjs_1.AbstractMesh) {
            point.mesh = item;
        }
        else if (item instanceof control_1.Control) {
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
        if (value instanceof multiLinePoint_1.MultiLinePoint) {
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MultiLine.prototype, "horizontalAlignment", {
        set: function (value) {
            return;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MultiLine.prototype, "verticalAlignment", {
        set: function (value) {
            return;
        },
        enumerable: true,
        configurable: true
    });
    MultiLine.prototype._getTypeName = function () {
        return "MultiLine";
    };
    MultiLine.prototype._draw = function (parentMeasure, context) {
        context.save();
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }
        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
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
        }
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
}(control_1.Control));
exports.MultiLine = MultiLine;


/***/ }),

/***/ "./src/2D/controls/radioButton.ts":
/*!****************************************!*\
  !*** ./src/2D/controls/radioButton.ts ***!
  \****************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var _1 = __webpack_require__(/*! . */ "./src/2D/controls/index.ts");
/**
 * Class used to create radio button controls
 */
var RadioButton = /** @class */ (function (_super) {
    __extends(RadioButton, _super);
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
        _this.onIsCheckedChangedObservable = new babylonjs_1.Observable();
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    RadioButton.prototype._getTypeName = function () {
        return "RadioButton";
    };
    RadioButton.prototype._draw = function (parentMeasure, context) {
        context.save();
        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
            var actualWidth = this._currentMeasure.width - this._thickness;
            var actualHeight = this._currentMeasure.height - this._thickness;
            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }
            // Outer
            control_1.Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2 - this._thickness / 2, this._currentMeasure.height / 2 - this._thickness / 2, context);
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
                control_1.Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, offsetWidth / 2 - this._thickness / 2, offseHeight / 2 - this._thickness / 2, context);
                context.fill();
            }
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
        var panel = new _1.StackPanel();
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
        var header = new _1.TextBlock();
        header.text = title;
        header.width = "180px";
        header.paddingLeft = "5px";
        header.textHorizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.color = "white";
        panel.addControl(header);
        return panel;
    };
    return RadioButton;
}(control_1.Control));
exports.RadioButton = RadioButton;


/***/ }),

/***/ "./src/2D/controls/rectangle.ts":
/*!**************************************!*\
  !*** ./src/2D/controls/rectangle.ts ***!
  \**************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = __webpack_require__(/*! ./container */ "./src/2D/controls/container.ts");
/** Class used to create rectangle container */
var Rectangle = /** @class */ (function (_super) {
    __extends(Rectangle, _super);
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
        enumerable: true,
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
        enumerable: true,
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
}(container_1.Container));
exports.Rectangle = Rectangle;


/***/ }),

/***/ "./src/2D/controls/selector.ts":
/*!*************************************!*\
  !*** ./src/2D/controls/selector.ts ***!
  \*************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var rectangle_1 = __webpack_require__(/*! ./rectangle */ "./src/2D/controls/rectangle.ts");
var stackPanel_1 = __webpack_require__(/*! ./stackPanel */ "./src/2D/controls/stackPanel.ts");
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
var textBlock_1 = __webpack_require__(/*! ./textBlock */ "./src/2D/controls/textBlock.ts");
var checkbox_1 = __webpack_require__(/*! ./checkbox */ "./src/2D/controls/checkbox.ts");
var radioButton_1 = __webpack_require__(/*! ./radioButton */ "./src/2D/controls/radioButton.ts");
var slider_1 = __webpack_require__(/*! ./slider */ "./src/2D/controls/slider.ts");
var container_1 = __webpack_require__(/*! ./container */ "./src/2D/controls/container.ts");
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
        this._groupPanel = new stackPanel_1.StackPanel();
        this._selectors = new Array();
        this._groupPanel.verticalAlignment = control_1.Control.VERTICAL_ALIGNMENT_TOP;
        this._groupPanel.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._groupHeader = this._addGroupHeader(name);
    }
    Object.defineProperty(SelectorGroup.prototype, "groupPanel", {
        /** Gets the groupPanel of the SelectorGroup  */
        get: function () {
            return this._groupPanel;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SelectorGroup.prototype, "selectors", {
        /** Gets the selectors array */
        get: function () {
            return this._selectors;
        },
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    /** @hidden */
    SelectorGroup.prototype._addGroupHeader = function (text) {
        var groupHeading = new textBlock_1.TextBlock("groupHead", text);
        groupHeading.width = 0.9;
        groupHeading.height = "30px";
        groupHeading.textWrapping = true;
        groupHeading.color = "black";
        groupHeading.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
        groupHeading.textHorizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
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
exports.SelectorGroup = SelectorGroup;
/** Class used to create a CheckboxGroup
 * which contains groups of checkbox buttons
*/
var CheckboxGroup = /** @class */ (function (_super) {
    __extends(CheckboxGroup, _super);
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
        var button = new checkbox_1.Checkbox();
        button.width = "20px";
        button.height = "20px";
        button.color = "#364249";
        button.background = "#CCCCCC";
        button.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
        button.onIsCheckedChangedObservable.add(function (state) {
            func(state);
        });
        var _selector = control_1.Control.AddHeader(button, text, "200px", { isHorizontal: true, controlFirst: true });
        _selector.height = "30px";
        _selector.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
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
exports.CheckboxGroup = CheckboxGroup;
/** Class used to create a RadioGroup
 * which contains groups of radio buttons
*/
var RadioGroup = /** @class */ (function (_super) {
    __extends(RadioGroup, _super);
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
        var button = new radioButton_1.RadioButton();
        button.name = label;
        button.width = "20px";
        button.height = "20px";
        button.color = "#364249";
        button.background = "#CCCCCC";
        button.group = this.name;
        button.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
        button.onIsCheckedChangedObservable.add(function (state) {
            if (state) {
                func(nb);
            }
        });
        var _selector = control_1.Control.AddHeader(button, label, "200px", { isHorizontal: true, controlFirst: true });
        _selector.height = "30px";
        _selector.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
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
exports.RadioGroup = RadioGroup;
/** Class used to create a SliderGroup
 * which contains groups of slider buttons
*/
var SliderGroup = /** @class */ (function (_super) {
    __extends(SliderGroup, _super);
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
        var button = new slider_1.Slider();
        button.name = unit;
        button.value = value;
        button.minimum = min;
        button.maximum = max;
        button.width = 0.9;
        button.height = "20px";
        button.color = "#364249";
        button.background = "#CCCCCC";
        button.borderColor = "black";
        button.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
        button.left = "4px";
        button.paddingBottom = "4px";
        button.onValueChangedObservable.add(function (value) {
            button.parent.children[0].text = button.parent.children[0].name + ": " + onValueChange(value) + " " + button.name;
            func(value);
        });
        var _selector = control_1.Control.AddHeader(button, label + ": " + onValueChange(value) + " " + unit, "30px", { isHorizontal: false, controlFirst: false });
        _selector.height = "60px";
        _selector.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
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
exports.SliderGroup = SliderGroup;
/** Class used to hold the controls for the checkboxes, radio buttons and sliders
 * @see http://doc.babylonjs.com/how_to/selector
*/
var SelectionPanel = /** @class */ (function (_super) {
    __extends(SelectionPanel, _super);
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
        _this._panel = new stackPanel_1.StackPanel();
        _this._panel.verticalAlignment = control_1.Control.VERTICAL_ALIGNMENT_TOP;
        _this._panel.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    SelectionPanel.prototype._setSpacerHeight = function () {
        for (var i = 0; i < this._bars.length; i++) {
            this._bars[i].height = this._spacerHeight;
        }
    };
    /** Adds a bar between groups */
    SelectionPanel.prototype._addSpacer = function () {
        var separator = new container_1.Container();
        separator.width = 1;
        separator.height = this._spacerHeight;
        separator.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
        var bar = new rectangle_1.Rectangle();
        bar.width = 1;
        bar.height = this._barHeight;
        bar.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
        bar.verticalAlignment = control_1.Control.VERTICAL_ALIGNMENT_CENTER;
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
}(rectangle_1.Rectangle));
exports.SelectionPanel = SelectionPanel;


/***/ }),

/***/ "./src/2D/controls/slider.ts":
/*!***********************************!*\
  !*** ./src/2D/controls/slider.ts ***!
  \***********************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var baseSlider_1 = __webpack_require__(/*! ./baseSlider */ "./src/2D/controls/baseSlider.ts");
/**
 * Class used to create slider controls
 */
var Slider = /** @class */ (function (_super) {
    __extends(Slider, _super);
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
        return _this;
    }
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Slider.prototype._getTypeName = function () {
        return "Slider";
    };
    Slider.prototype._draw = function (parentMeasure, context) {
        context.save();
        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
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
        }
        context.restore();
    };
    return Slider;
}(baseSlider_1.BaseSlider));
exports.Slider = Slider;


/***/ }),

/***/ "./src/2D/controls/stackPanel.ts":
/*!***************************************!*\
  !*** ./src/2D/controls/stackPanel.ts ***!
  \***************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = __webpack_require__(/*! ./container */ "./src/2D/controls/container.ts");
var measure_1 = __webpack_require__(/*! ../measure */ "./src/2D/measure.ts");
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
/**
 * Class used to create a 2D stack panel container
 */
var StackPanel = /** @class */ (function (_super) {
    __extends(StackPanel, _super);
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
        _this._tempMeasureStore = measure_1.Measure.Empty();
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    StackPanel.prototype._getTypeName = function () {
        return "StackPanel";
    };
    StackPanel.prototype._preMeasure = function (parentMeasure, context) {
        var stackWidth = 0;
        var stackHeight = 0;
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            this._tempMeasureStore.copyFrom(child._currentMeasure);
            child._currentMeasure.copyFrom(parentMeasure);
            child._measure();
            if (this._isVertical) {
                child.top = stackHeight + "px";
                if (!child._top.ignoreAdaptiveScaling) {
                    child._markAsDirty();
                }
                child._top.ignoreAdaptiveScaling = true;
                stackHeight += child._currentMeasure.height;
                if (child._currentMeasure.width > stackWidth) {
                    stackWidth = child._currentMeasure.width;
                }
                child.verticalAlignment = control_1.Control.VERTICAL_ALIGNMENT_TOP;
            }
            else {
                child.left = stackWidth + "px";
                if (!child._left.ignoreAdaptiveScaling) {
                    child._markAsDirty();
                }
                child._left.ignoreAdaptiveScaling = true;
                stackWidth += child._currentMeasure.width;
                if (child._currentMeasure.height > stackHeight) {
                    stackHeight = child._currentMeasure.height;
                }
                child.horizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
            }
            child._currentMeasure.copyFrom(this._tempMeasureStore);
        }
        this._doNotTrackManualChanges = true;
        // Let stack panel width and height default to stackHeight and stackWidth if dimensions are not specified.
        // User can now define their own height and width for stack panel.
        var panelWidthChanged = false;
        var panelHeightChanged = false;
        var previousHeight = this.height;
        var previousWidth = this.width;
        if (!this._manualHeight) {
            // do not specify height if strictly defined by user
            this.height = stackHeight + "px";
        }
        if (!this._manualWidth) {
            // do not specify width if strictly defined by user
            this.width = stackWidth + "px";
        }
        panelWidthChanged = previousWidth !== this.width || !this._width.ignoreAdaptiveScaling;
        panelHeightChanged = previousHeight !== this.height || !this._height.ignoreAdaptiveScaling;
        if (panelHeightChanged) {
            this._height.ignoreAdaptiveScaling = true;
        }
        if (panelWidthChanged) {
            this._width.ignoreAdaptiveScaling = true;
        }
        this._doNotTrackManualChanges = false;
        if (panelWidthChanged || panelHeightChanged) {
            this._markAllAsDirty();
        }
        _super.prototype._preMeasure.call(this, parentMeasure, context);
    };
    return StackPanel;
}(container_1.Container));
exports.StackPanel = StackPanel;


/***/ }),

/***/ "./src/2D/controls/statics.ts":
/*!************************************!*\
  !*** ./src/2D/controls/statics.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
var stackPanel_1 = __webpack_require__(/*! ./stackPanel */ "./src/2D/controls/stackPanel.ts");
var textBlock_1 = __webpack_require__(/*! ./textBlock */ "./src/2D/controls/textBlock.ts");
/**
 * Forcing an export so that this code will execute
 * @hidden
 */
var name = "Statics";
exports.name = name;
/**
 * Creates a stack panel that can be used to render headers
 * @param control defines the control to associate with the header
 * @param text defines the text of the header
 * @param size defines the size of the header
 * @param options defines options used to configure the header
 * @returns a new StackPanel
 */
control_1.Control.AddHeader = function (control, text, size, options) {
    var panel = new stackPanel_1.StackPanel("panel");
    var isHorizontal = options ? options.isHorizontal : true;
    var controlFirst = options ? options.controlFirst : true;
    panel.isVertical = !isHorizontal;
    var header = new textBlock_1.TextBlock("header");
    header.text = text;
    header.textHorizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_LEFT;
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

/***/ "./src/2D/controls/textBlock.ts":
/*!**************************************!*\
  !*** ./src/2D/controls/textBlock.ts ***!
  \**************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var valueAndUnit_1 = __webpack_require__(/*! ../valueAndUnit */ "./src/2D/valueAndUnit.ts");
var control_1 = __webpack_require__(/*! ./control */ "./src/2D/controls/control.ts");
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
})(TextWrapping = exports.TextWrapping || (exports.TextWrapping = {}));
/**
 * Class used to create text block control
 */
var TextBlock = /** @class */ (function (_super) {
    __extends(TextBlock, _super);
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
        _this._textHorizontalAlignment = control_1.Control.HORIZONTAL_ALIGNMENT_CENTER;
        _this._textVerticalAlignment = control_1.Control.VERTICAL_ALIGNMENT_CENTER;
        _this._resizeToFit = false;
        _this._lineSpacing = new valueAndUnit_1.ValueAndUnit(0);
        _this._outlineWidth = 0;
        _this._outlineColor = "white";
        /**
        * An event triggered after the text is changed
        */
        _this.onTextChangedObservable = new babylonjs_1.Observable();
        /**
        * An event triggered after the text was broken up into lines
        */
        _this.onLinesReadyObservable = new babylonjs_1.Observable();
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
        enumerable: true,
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
            this._resizeToFit = value;
            if (this._resizeToFit) {
                this._width.ignoreAdaptiveScaling = true;
                this._height.ignoreAdaptiveScaling = true;
            }
        },
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    TextBlock.prototype._getTypeName = function () {
        return "TextBlock";
    };
    TextBlock.prototype._drawText = function (text, textWidth, y, context) {
        var width = this._currentMeasure.width;
        var x = 0;
        switch (this._textHorizontalAlignment) {
            case control_1.Control.HORIZONTAL_ALIGNMENT_LEFT:
                x = 0;
                break;
            case control_1.Control.HORIZONTAL_ALIGNMENT_RIGHT:
                x = width - textWidth;
                break;
            case control_1.Control.HORIZONTAL_ALIGNMENT_CENTER:
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
    };
    /** @hidden */
    TextBlock.prototype._draw = function (parentMeasure, context) {
        context.save();
        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
            // Render lines
            this._renderLines(context);
        }
        context.restore();
    };
    TextBlock.prototype._applyStates = function (context) {
        _super.prototype._applyStates.call(this, context);
        if (this.outlineWidth) {
            context.lineWidth = this.outlineWidth;
            context.strokeStyle = this.outlineColor;
        }
    };
    TextBlock.prototype._additionalProcessing = function (parentMeasure, context) {
        this._lines = this._breakLines(this._currentMeasure.width, context);
        this.onLinesReadyObservable.notifyObservers(this);
    };
    TextBlock.prototype._breakLines = function (refWidth, context) {
        var lines = [];
        var _lines = this.text.split("\n");
        if (this._textWrapping === TextWrapping.Ellipsis && !this._resizeToFit) {
            for (var _i = 0, _lines_1 = _lines; _i < _lines_1.length; _i++) {
                var _line = _lines_1[_i];
                lines.push(this._parseLineEllipsis(_line, refWidth, context));
            }
        }
        else if (this._textWrapping === TextWrapping.WordWrap && !this._resizeToFit) {
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
        var words = line.split(' ');
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
        if (!this._fontOffset) {
            this._fontOffset = control_1.Control._GetFontOffset(context.font);
        }
        var rootY = 0;
        switch (this._textVerticalAlignment) {
            case control_1.Control.VERTICAL_ALIGNMENT_TOP:
                rootY = this._fontOffset.ascent;
                break;
            case control_1.Control.VERTICAL_ALIGNMENT_BOTTOM:
                rootY = height - this._fontOffset.height * (this._lines.length - 1) - this._fontOffset.descent;
                break;
            case control_1.Control.VERTICAL_ALIGNMENT_CENTER:
                rootY = this._fontOffset.ascent + (height - this._fontOffset.height * this._lines.length) / 2;
                break;
        }
        rootY += this._currentMeasure.top;
        var maxLineWidth = 0;
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
            if (line.width > maxLineWidth) {
                maxLineWidth = line.width;
            }
        }
        if (this._resizeToFit) {
            this.width = this.paddingLeftInPixels + this.paddingRightInPixels + maxLineWidth + 'px';
            this.height = this.paddingTopInPixels + this.paddingBottomInPixels + this._fontOffset.height * this._lines.length + 'px';
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
                    this._fontOffset = control_1.Control._GetFontOffset(context_1.font);
                }
                var lines = this._lines ? this._lines : this._breakLines(this.widthInPixels - this.paddingLeftInPixels - this.paddingRightInPixels, context_1);
                return this.paddingTopInPixels + this.paddingBottomInPixels + this._fontOffset.height * lines.length;
            }
        }
        return 0;
    };
    TextBlock.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this.onTextChangedObservable.clear();
    };
    return TextBlock;
}(control_1.Control));
exports.TextBlock = TextBlock;


/***/ }),

/***/ "./src/2D/controls/virtualKeyboard.ts":
/*!********************************************!*\
  !*** ./src/2D/controls/virtualKeyboard.ts ***!
  \********************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var stackPanel_1 = __webpack_require__(/*! ./stackPanel */ "./src/2D/controls/stackPanel.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var button_1 = __webpack_require__(/*! ./button */ "./src/2D/controls/button.ts");
/**
 * Class used to store key control properties
 */
var KeyPropertySet = /** @class */ (function () {
    function KeyPropertySet() {
    }
    return KeyPropertySet;
}());
exports.KeyPropertySet = KeyPropertySet;
/**
 * Class used to create virtual keyboard
 */
var VirtualKeyboard = /** @class */ (function (_super) {
    __extends(VirtualKeyboard, _super);
    function VirtualKeyboard() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /** Observable raised when a key is pressed */
        _this.onKeyPressObservable = new babylonjs_1.Observable();
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
        var button = button_1.Button.CreateSimpleButton(key, key);
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
        var panel = new stackPanel_1.StackPanel();
        panel.isVertical = false;
        panel.isFocusInvisible = true;
        for (var i = 0; i < keys.length; i++) {
            var properties = null;
            if (propertySets && propertySets.length === keys.length) {
                properties = propertySets[i];
            }
            panel.addControl(this._createKey(keys[i], properties));
        }
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
        enumerable: true,
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
}(stackPanel_1.StackPanel));
exports.VirtualKeyboard = VirtualKeyboard;


/***/ }),

/***/ "./src/2D/index.ts":
/*!*************************!*\
  !*** ./src/2D/index.ts ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./controls */ "./src/2D/controls/index.ts"));
__export(__webpack_require__(/*! ./advancedDynamicTexture */ "./src/2D/advancedDynamicTexture.ts"));
__export(__webpack_require__(/*! ./math2D */ "./src/2D/math2D.ts"));
__export(__webpack_require__(/*! ./measure */ "./src/2D/measure.ts"));
__export(__webpack_require__(/*! ./multiLinePoint */ "./src/2D/multiLinePoint.ts"));
__export(__webpack_require__(/*! ./style */ "./src/2D/style.ts"));
__export(__webpack_require__(/*! ./valueAndUnit */ "./src/2D/valueAndUnit.ts"));


/***/ }),

/***/ "./src/2D/math2D.ts":
/*!**************************!*\
  !*** ./src/2D/math2D.ts ***!
  \**************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
/**
 * Class used to transport Vector2 information for pointer events
 */
var Vector2WithInfo = /** @class */ (function (_super) {
    __extends(Vector2WithInfo, _super);
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
}(babylonjs_1.Vector2));
exports.Vector2WithInfo = Vector2WithInfo;
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
        if (det < (babylonjs_1.Epsilon * babylonjs_1.Epsilon)) {
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
exports.Matrix2D = Matrix2D;


/***/ }),

/***/ "./src/2D/measure.ts":
/*!***************************!*\
  !*** ./src/2D/measure.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
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
exports.Measure = Measure;


/***/ }),

/***/ "./src/2D/multiLinePoint.ts":
/*!**********************************!*\
  !*** ./src/2D/multiLinePoint.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var valueAndUnit_1 = __webpack_require__(/*! ./valueAndUnit */ "./src/2D/valueAndUnit.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
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
        this._x = new valueAndUnit_1.ValueAndUnit(0);
        this._y = new valueAndUnit_1.ValueAndUnit(0);
        this._point = new babylonjs_1.Vector2(0, 0);
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
            return new babylonjs_1.Vector2(this._control.centerX, this._control.centerY);
        }
        else {
            var host = this._multiLine._host;
            var xValue = this._x.getValueInPixel(host, Number(host._canvas.width));
            var yValue = this._y.getValueInPixel(host, Number(host._canvas.height));
            return new babylonjs_1.Vector2(xValue, yValue);
        }
    };
    /** Release associated resources */
    MultiLinePoint.prototype.dispose = function () {
        this.resetLinks();
    };
    return MultiLinePoint;
}());
exports.MultiLinePoint = MultiLinePoint;


/***/ }),

/***/ "./src/2D/style.ts":
/*!*************************!*\
  !*** ./src/2D/style.ts ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var valueAndUnit_1 = __webpack_require__(/*! ./valueAndUnit */ "./src/2D/valueAndUnit.ts");
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
        this._fontSize = new valueAndUnit_1.ValueAndUnit(18, valueAndUnit_1.ValueAndUnit.UNITMODE_PIXEL, false);
        /**
         * Observable raised when the style values are changed
         */
        this.onChangedObservable = new babylonjs_1.Observable();
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    /** Dispose all associated resources */
    Style.prototype.dispose = function () {
        this.onChangedObservable.clear();
    };
    return Style;
}());
exports.Style = Style;


/***/ }),

/***/ "./src/2D/valueAndUnit.ts":
/*!********************************!*\
  !*** ./src/2D/valueAndUnit.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
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
         * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
         */
        this.ignoreAdaptiveScaling = false;
        this._value = value;
    }
    Object.defineProperty(ValueAndUnit.prototype, "isPercentage", {
        /** Gets a boolean indicating if the value is a percentage */
        get: function () {
            return this.unit === ValueAndUnit.UNITMODE_PERCENTAGE;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ValueAndUnit.prototype, "isPixel", {
        /** Gets a boolean indicating if the value is store as pixel */
        get: function () {
            return this.unit === ValueAndUnit.UNITMODE_PIXEL;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ValueAndUnit.prototype, "internalValue", {
        /** Gets direct internal value */
        get: function () {
            return this._value;
        },
        enumerable: true,
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
     * @returns a string
     */
    ValueAndUnit.prototype.toString = function (host) {
        switch (this.unit) {
            case ValueAndUnit.UNITMODE_PERCENTAGE:
                return (this.getValue(host) * 100) + "%";
            case ValueAndUnit.UNITMODE_PIXEL:
                return this.getValue(host) + "px";
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
        var sourceUnit = this.unit;
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ValueAndUnit, "UNITMODE_PIXEL", {
        /** UNITMODE_PIXEL */
        get: function () {
            return ValueAndUnit._UNITMODE_PIXEL;
        },
        enumerable: true,
        configurable: true
    });
    // Static
    ValueAndUnit._Regex = /(^-?\d*(\.\d+)?)(%|px)?/;
    ValueAndUnit._UNITMODE_PERCENTAGE = 0;
    ValueAndUnit._UNITMODE_PIXEL = 1;
    return ValueAndUnit;
}());
exports.ValueAndUnit = ValueAndUnit;


/***/ }),

/***/ "./src/3D/controls/abstractButton3D.ts":
/*!*********************************************!*\
  !*** ./src/3D/controls/abstractButton3D.ts ***!
  \*********************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var control3D_1 = __webpack_require__(/*! ./control3D */ "./src/3D/controls/control3D.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
/**
 * Class used as a root to all buttons
 */
var AbstractButton3D = /** @class */ (function (_super) {
    __extends(AbstractButton3D, _super);
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
        return new babylonjs_1.TransformNode("button" + this.name);
    };
    return AbstractButton3D;
}(control3D_1.Control3D));
exports.AbstractButton3D = AbstractButton3D;


/***/ }),

/***/ "./src/3D/controls/button3D.ts":
/*!*************************************!*\
  !*** ./src/3D/controls/button3D.ts ***!
  \*************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var abstractButton3D_1 = __webpack_require__(/*! ./abstractButton3D */ "./src/3D/controls/abstractButton3D.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var advancedDynamicTexture_1 = __webpack_require__(/*! ../../2D/advancedDynamicTexture */ "./src/2D/advancedDynamicTexture.ts");
/**
 * Class used to create a button in 3D
 */
var Button3D = /** @class */ (function (_super) {
    __extends(Button3D, _super);
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
            _this._currentMaterial.emissiveColor = babylonjs_1.Color3.Red();
        };
        _this.pointerOutAnimation = function () {
            _this._currentMaterial.emissiveColor = babylonjs_1.Color3.Black();
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
        enumerable: true,
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
        enumerable: true,
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
                this._facadeTexture = new advancedDynamicTexture_1.AdvancedDynamicTexture("Facade", this._contentResolution, this._contentResolution, this._host.utilityLayer.utilityLayerScene, true, babylonjs_1.Texture.TRILINEAR_SAMPLINGMODE);
                this._facadeTexture.rootContainer.scaleX = this._contentScaleRatio;
                this._facadeTexture.rootContainer.scaleY = this._contentScaleRatio;
                this._facadeTexture.premulAlpha = true;
            }
            this._facadeTexture.addControl(value);
            this._applyFacade(this._facadeTexture);
        },
        enumerable: true,
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
            faceUV[i] = new babylonjs_1.Vector4(0, 0, 0, 0);
        }
        faceUV[1] = new babylonjs_1.Vector4(0, 0, 1, 1);
        var mesh = babylonjs_1.MeshBuilder.CreateBox(this.name + "_rootMesh", {
            width: 1.0,
            height: 1.0,
            depth: 0.08,
            faceUV: faceUV
        }, scene);
        return mesh;
    };
    Button3D.prototype._affectMaterial = function (mesh) {
        var material = new babylonjs_1.StandardMaterial(this.name + "Material", mesh.getScene());
        material.specularColor = babylonjs_1.Color3.Black();
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
}(abstractButton3D_1.AbstractButton3D));
exports.Button3D = Button3D;


/***/ }),

/***/ "./src/3D/controls/container3D.ts":
/*!****************************************!*\
  !*** ./src/3D/controls/container3D.ts ***!
  \****************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var control3D_1 = __webpack_require__(/*! ./control3D */ "./src/3D/controls/control3D.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
/**
 * Class used to create containers for controls
 */
var Container3D = /** @class */ (function (_super) {
    __extends(Container3D, _super);
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
        enumerable: true,
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
        enumerable: true,
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
        return new babylonjs_1.TransformNode("ContainerNode", scene);
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
}(control3D_1.Control3D));
exports.Container3D = Container3D;


/***/ }),

/***/ "./src/3D/controls/control3D.ts":
/*!**************************************!*\
  !*** ./src/3D/controls/control3D.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var vector3WithInfo_1 = __webpack_require__(/*! ../vector3WithInfo */ "./src/3D/vector3WithInfo.ts");
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
        this.onPointerMoveObservable = new babylonjs_1.Observable();
        /**
         * An event triggered when the pointer move out of the control
         */
        this.onPointerOutObservable = new babylonjs_1.Observable();
        /**
         * An event triggered when the pointer taps the control
         */
        this.onPointerDownObservable = new babylonjs_1.Observable();
        /**
         * An event triggered when pointer is up
         */
        this.onPointerUpObservable = new babylonjs_1.Observable();
        /**
         * An event triggered when a control is clicked on (with a mouse)
         */
        this.onPointerClickObservable = new babylonjs_1.Observable();
        /**
         * An event triggered when pointer enters the control
         */
        this.onPointerEnterObservable = new babylonjs_1.Observable();
        // Behaviors
        this._behaviors = new Array();
    }
    Object.defineProperty(Control3D.prototype, "position", {
        /** Gets or sets the control position  in world space */
        get: function () {
            if (!this._node) {
                return babylonjs_1.Vector3.Zero();
            }
            return this._node.position;
        },
        set: function (value) {
            if (!this._node) {
                return;
            }
            this._node.position = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control3D.prototype, "scaling", {
        /** Gets or sets the control scaling  in world space */
        get: function () {
            if (!this._node) {
                return new babylonjs_1.Vector3(1, 1, 1);
            }
            return this._node.scaling;
        },
        set: function (value) {
            if (!this._node) {
                return;
            }
            this._node.scaling = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control3D.prototype, "behaviors", {
        /**
         * Gets the list of attached behaviors
         * @see http://doc.babylonjs.com/features/behaviour
         */
        get: function () {
            return this._behaviors;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Attach a behavior to the control
     * @see http://doc.babylonjs.com/features/behaviour
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
     * @see http://doc.babylonjs.com/features/behaviour
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
     * @see http://doc.babylonjs.com/features/behaviour
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control3D.prototype, "typeName", {
        /**
         * Gets a string representing the class name
         */
        get: function () {
            return this._getTypeName();
        },
        enumerable: true,
        configurable: true
    });
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Control3D.prototype, "mesh", {
        /**
         * Gets the mesh used to render this control
         */
        get: function () {
            if (this._node instanceof babylonjs_1.AbstractMesh) {
                return this._node;
            }
            return null;
        },
        enumerable: true,
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
            return false;
        }
        this._downCount++;
        this._downPointerIds[pointerId] = true;
        this.onPointerDownObservable.notifyObservers(new vector3WithInfo_1.Vector3WithInfo(coordinates, buttonIndex), -1, target, this);
        if (this.pointerDownAnimation) {
            this.pointerDownAnimation();
        }
        return true;
    };
    /** @hidden */
    Control3D.prototype._onPointerUp = function (target, coordinates, pointerId, buttonIndex, notifyClick) {
        this._downCount = 0;
        delete this._downPointerIds[pointerId];
        if (notifyClick && (this._enterCount > 0 || this._enterCount === -1)) {
            this.onPointerClickObservable.notifyObservers(new vector3WithInfo_1.Vector3WithInfo(coordinates, buttonIndex), -1, target, this);
        }
        this.onPointerUpObservable.notifyObservers(new vector3WithInfo_1.Vector3WithInfo(coordinates, buttonIndex), -1, target, this);
        if (this.pointerUpAnimation) {
            this.pointerUpAnimation();
        }
    };
    /** @hidden */
    Control3D.prototype.forcePointerUp = function (pointerId) {
        if (pointerId === void 0) { pointerId = null; }
        if (pointerId !== null) {
            this._onPointerUp(this, babylonjs_1.Vector3.Zero(), pointerId, 0, true);
        }
        else {
            for (var key in this._downPointerIds) {
                this._onPointerUp(this, babylonjs_1.Vector3.Zero(), +key, 0, true);
            }
        }
    };
    /** @hidden */
    Control3D.prototype._processObservables = function (type, pickedPoint, pointerId, buttonIndex) {
        if (type === babylonjs_1.PointerEventTypes.POINTERMOVE) {
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
        if (type === babylonjs_1.PointerEventTypes.POINTERDOWN) {
            this._onPointerDown(this, pickedPoint, pointerId, buttonIndex);
            this._host._lastControlDown[pointerId] = this;
            this._host._lastPickedControl = this;
            return true;
        }
        if (type === babylonjs_1.PointerEventTypes.POINTERUP) {
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
exports.Control3D = Control3D;


/***/ }),

/***/ "./src/3D/controls/cylinderPanel.ts":
/*!******************************************!*\
  !*** ./src/3D/controls/cylinderPanel.ts ***!
  \******************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var volumeBasedPanel_1 = __webpack_require__(/*! ./volumeBasedPanel */ "./src/3D/controls/volumeBasedPanel.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var container3D_1 = __webpack_require__(/*! ./container3D */ "./src/3D/controls/container3D.ts");
/**
 * Class used to create a container panel deployed on the surface of a cylinder
 */
var CylinderPanel = /** @class */ (function (_super) {
    __extends(CylinderPanel, _super);
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
            babylonjs_1.Tools.SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: true,
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
            case container3D_1.Container3D.FACEORIGIN_ORIENTATION:
                mesh.lookAt(new BABYLON.Vector3(-newPos.x, newPos.y, -newPos.z));
                break;
            case container3D_1.Container3D.FACEORIGINREVERSED_ORIENTATION:
                mesh.lookAt(new BABYLON.Vector3(2 * newPos.x, newPos.y, 2 * newPos.z));
                break;
            case container3D_1.Container3D.FACEFORWARD_ORIENTATION:
                break;
            case container3D_1.Container3D.FACEFORWARDREVERSED_ORIENTATION:
                mesh.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
                break;
        }
    };
    CylinderPanel.prototype._cylindricalMapping = function (source) {
        var newPos = new babylonjs_1.Vector3(0, source.y, this._radius);
        var yAngle = (source.x / this._radius);
        babylonjs_1.Matrix.RotationYawPitchRollToRef(yAngle, 0, 0, babylonjs_1.Tmp.Matrix[0]);
        return babylonjs_1.Vector3.TransformNormal(newPos, babylonjs_1.Tmp.Matrix[0]);
    };
    return CylinderPanel;
}(volumeBasedPanel_1.VolumeBasedPanel));
exports.CylinderPanel = CylinderPanel;


/***/ }),

/***/ "./src/3D/controls/holographicButton.ts":
/*!**********************************************!*\
  !*** ./src/3D/controls/holographicButton.ts ***!
  \**********************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var button3D_1 = __webpack_require__(/*! ./button3D */ "./src/3D/controls/button3D.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var fluentMaterial_1 = __webpack_require__(/*! ../materials/fluentMaterial */ "./src/3D/materials/fluentMaterial.ts");
var stackPanel_1 = __webpack_require__(/*! ../../2D/controls/stackPanel */ "./src/2D/controls/stackPanel.ts");
var image_1 = __webpack_require__(/*! ../../2D/controls/image */ "./src/2D/controls/image.ts");
var textBlock_1 = __webpack_require__(/*! ../../2D/controls/textBlock */ "./src/2D/controls/textBlock.ts");
var advancedDynamicTexture_1 = __webpack_require__(/*! ../../2D/advancedDynamicTexture */ "./src/2D/advancedDynamicTexture.ts");
/**
 * Class used to create a holographic button in 3D
 */
var HolographicButton = /** @class */ (function (_super) {
    __extends(HolographicButton, _super);
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
                this._tooltipMesh = BABYLON.MeshBuilder.CreatePlane("", { size: 1 }, this._backPlate._scene);
                var tooltipBackground = BABYLON.MeshBuilder.CreatePlane("", { size: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this._backPlate._scene);
                var mat = new babylonjs_1.StandardMaterial("", this._backPlate._scene);
                mat.diffuseColor = BABYLON.Color3.FromHexString("#212121");
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
                this._tooltipTexture = advancedDynamicTexture_1.AdvancedDynamicTexture.CreateForMesh(this._tooltipMesh);
                this._tooltipTextBlock = new textBlock_1.TextBlock();
                this._tooltipTextBlock.scaleY = 3;
                this._tooltipTextBlock.color = "white";
                this._tooltipTextBlock.fontSize = 130;
                this._tooltipTexture.addControl(this._tooltipTextBlock);
                // Add hover action to tooltip
                this._tooltipFade = new BABYLON.FadeInOutBehavior();
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HolographicButton.prototype, "backMaterial", {
        /**
         * Gets the back material used by this button
         */
        get: function () {
            return this._backMaterial;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HolographicButton.prototype, "frontMaterial", {
        /**
         * Gets the front material used by this button
         */
        get: function () {
            return this._frontMaterial;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HolographicButton.prototype, "plateMaterial", {
        /**
         * Gets the plate material used by this button
         */
        get: function () {
            return this._plateMaterial;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HolographicButton.prototype, "shareMaterials", {
        /**
         * Gets a boolean indicating if this button shares its material with other HolographicButtons
         */
        get: function () {
            return this._shareMaterials;
        },
        enumerable: true,
        configurable: true
    });
    HolographicButton.prototype._getTypeName = function () {
        return "HolographicButton";
    };
    HolographicButton.prototype._rebuildContent = function () {
        this._disposeFacadeTexture();
        var panel = new stackPanel_1.StackPanel();
        panel.isVertical = true;
        if (this._imageUrl) {
            var image = new image_1.Image();
            image.source = this._imageUrl;
            image.paddingTop = "40px";
            image.height = "180px";
            image.width = "100px";
            image.paddingBottom = "40px";
            panel.addControl(image);
        }
        if (this._text) {
            var text = new textBlock_1.TextBlock();
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
        this._backPlate = babylonjs_1.MeshBuilder.CreateBox(this.name + "BackMesh", {
            width: 1.0,
            height: 1.0,
            depth: 0.08
        }, scene);
        this._frontPlate = babylonjs_1.MeshBuilder.CreateBox(this.name + "FrontMesh", {
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
        this._backMaterial = new fluentMaterial_1.FluentMaterial(this.name + "Back Material", mesh.getScene());
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
        this._frontMaterial = new fluentMaterial_1.FluentMaterial(this.name + "Front Material", mesh.getScene());
        this._frontMaterial.innerGlowColorIntensity = 0; // No inner glow
        this._frontMaterial.alpha = 0.5; // Additive
        this._frontMaterial.renderBorders = true;
    };
    HolographicButton.prototype._createPlateMaterial = function (mesh) {
        this._plateMaterial = new babylonjs_1.StandardMaterial(this.name + "Plate Material", mesh.getScene());
        this._plateMaterial.specularColor = babylonjs_1.Color3.Black();
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
}(button3D_1.Button3D));
exports.HolographicButton = HolographicButton;


/***/ }),

/***/ "./src/3D/controls/index.ts":
/*!**********************************!*\
  !*** ./src/3D/controls/index.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./abstractButton3D */ "./src/3D/controls/abstractButton3D.ts"));
__export(__webpack_require__(/*! ./button3D */ "./src/3D/controls/button3D.ts"));
__export(__webpack_require__(/*! ./container3D */ "./src/3D/controls/container3D.ts"));
__export(__webpack_require__(/*! ./control3D */ "./src/3D/controls/control3D.ts"));
__export(__webpack_require__(/*! ./cylinderPanel */ "./src/3D/controls/cylinderPanel.ts"));
__export(__webpack_require__(/*! ./holographicButton */ "./src/3D/controls/holographicButton.ts"));
__export(__webpack_require__(/*! ./meshButton3D */ "./src/3D/controls/meshButton3D.ts"));
__export(__webpack_require__(/*! ./planePanel */ "./src/3D/controls/planePanel.ts"));
__export(__webpack_require__(/*! ./scatterPanel */ "./src/3D/controls/scatterPanel.ts"));
__export(__webpack_require__(/*! ./spherePanel */ "./src/3D/controls/spherePanel.ts"));
__export(__webpack_require__(/*! ./stackPanel3D */ "./src/3D/controls/stackPanel3D.ts"));
__export(__webpack_require__(/*! ./volumeBasedPanel */ "./src/3D/controls/volumeBasedPanel.ts"));


/***/ }),

/***/ "./src/3D/controls/meshButton3D.ts":
/*!*****************************************!*\
  !*** ./src/3D/controls/meshButton3D.ts ***!
  \*****************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var button3D_1 = __webpack_require__(/*! ./button3D */ "./src/3D/controls/button3D.ts");
/**
 * Class used to create an interactable object. It's a 3D button using a mesh coming from the current scene
 */
var MeshButton3D = /** @class */ (function (_super) {
    __extends(MeshButton3D, _super);
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
}(button3D_1.Button3D));
exports.MeshButton3D = MeshButton3D;


/***/ }),

/***/ "./src/3D/controls/planePanel.ts":
/*!***************************************!*\
  !*** ./src/3D/controls/planePanel.ts ***!
  \***************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var container3D_1 = __webpack_require__(/*! ./container3D */ "./src/3D/controls/container3D.ts");
var volumeBasedPanel_1 = __webpack_require__(/*! ./volumeBasedPanel */ "./src/3D/controls/volumeBasedPanel.ts");
/**
 * Class used to create a container panel deployed on the surface of a plane
 */
var PlanePanel = /** @class */ (function (_super) {
    __extends(PlanePanel, _super);
    function PlanePanel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PlanePanel.prototype._mapGridNode = function (control, nodePosition) {
        var mesh = control.mesh;
        if (!mesh) {
            return;
        }
        control.position = nodePosition.clone();
        var target = babylonjs_1.Tmp.Vector3[0];
        target.copyFrom(nodePosition);
        switch (this.orientation) {
            case container3D_1.Container3D.FACEORIGIN_ORIENTATION:
            case container3D_1.Container3D.FACEFORWARD_ORIENTATION:
                target.addInPlace(new BABYLON.Vector3(0, 0, -1));
                mesh.lookAt(target);
                break;
            case container3D_1.Container3D.FACEFORWARDREVERSED_ORIENTATION:
            case container3D_1.Container3D.FACEORIGINREVERSED_ORIENTATION:
                target.addInPlace(new BABYLON.Vector3(0, 0, 1));
                mesh.lookAt(target);
                break;
        }
    };
    return PlanePanel;
}(volumeBasedPanel_1.VolumeBasedPanel));
exports.PlanePanel = PlanePanel;


/***/ }),

/***/ "./src/3D/controls/scatterPanel.ts":
/*!*****************************************!*\
  !*** ./src/3D/controls/scatterPanel.ts ***!
  \*****************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var volumeBasedPanel_1 = __webpack_require__(/*! ./volumeBasedPanel */ "./src/3D/controls/volumeBasedPanel.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var container3D_1 = __webpack_require__(/*! ./container3D */ "./src/3D/controls/container3D.ts");
/**
 * Class used to create a container panel where items get randomized planar mapping
 */
var ScatterPanel = /** @class */ (function (_super) {
    __extends(ScatterPanel, _super);
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
            babylonjs_1.Tools.SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: true,
        configurable: true
    });
    ScatterPanel.prototype._mapGridNode = function (control, nodePosition) {
        var mesh = control.mesh;
        var newPos = this._scatterMapping(nodePosition);
        if (!mesh) {
            return;
        }
        switch (this.orientation) {
            case container3D_1.Container3D.FACEORIGIN_ORIENTATION:
            case container3D_1.Container3D.FACEFORWARD_ORIENTATION:
                mesh.lookAt(new babylonjs_1.Vector3(0, 0, -1));
                break;
            case container3D_1.Container3D.FACEFORWARDREVERSED_ORIENTATION:
            case container3D_1.Container3D.FACEORIGINREVERSED_ORIENTATION:
                mesh.lookAt(new babylonjs_1.Vector3(0, 0, 1));
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
            var difference2D = babylonjs_1.Tmp.Vector2[0];
            var difference = babylonjs_1.Tmp.Vector3[0];
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
}(volumeBasedPanel_1.VolumeBasedPanel));
exports.ScatterPanel = ScatterPanel;


/***/ }),

/***/ "./src/3D/controls/spherePanel.ts":
/*!****************************************!*\
  !*** ./src/3D/controls/spherePanel.ts ***!
  \****************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var volumeBasedPanel_1 = __webpack_require__(/*! ./volumeBasedPanel */ "./src/3D/controls/volumeBasedPanel.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var container3D_1 = __webpack_require__(/*! ./container3D */ "./src/3D/controls/container3D.ts");
/**
 * Class used to create a container panel deployed on the surface of a sphere
 */
var SpherePanel = /** @class */ (function (_super) {
    __extends(SpherePanel, _super);
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
            babylonjs_1.Tools.SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: true,
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
            case container3D_1.Container3D.FACEORIGIN_ORIENTATION:
                mesh.lookAt(new BABYLON.Vector3(-newPos.x, -newPos.y, -newPos.z));
                break;
            case container3D_1.Container3D.FACEORIGINREVERSED_ORIENTATION:
                mesh.lookAt(new BABYLON.Vector3(2 * newPos.x, 2 * newPos.y, 2 * newPos.z));
                break;
            case container3D_1.Container3D.FACEFORWARD_ORIENTATION:
                break;
            case container3D_1.Container3D.FACEFORWARDREVERSED_ORIENTATION:
                mesh.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
                break;
        }
    };
    SpherePanel.prototype._sphericalMapping = function (source) {
        var newPos = new babylonjs_1.Vector3(0, 0, this._radius);
        var xAngle = (source.y / this._radius);
        var yAngle = -(source.x / this._radius);
        babylonjs_1.Matrix.RotationYawPitchRollToRef(yAngle, xAngle, 0, babylonjs_1.Tmp.Matrix[0]);
        return babylonjs_1.Vector3.TransformNormal(newPos, babylonjs_1.Tmp.Matrix[0]);
    };
    return SpherePanel;
}(volumeBasedPanel_1.VolumeBasedPanel));
exports.SpherePanel = SpherePanel;


/***/ }),

/***/ "./src/3D/controls/stackPanel3D.ts":
/*!*****************************************!*\
  !*** ./src/3D/controls/stackPanel3D.ts ***!
  \*****************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var container3D_1 = __webpack_require__(/*! ./container3D */ "./src/3D/controls/container3D.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
/**
 * Class used to create a stack panel in 3D on XY plane
 */
var StackPanel3D = /** @class */ (function (_super) {
    __extends(StackPanel3D, _super);
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
            babylonjs_1.Tools.SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: true,
        configurable: true
    });
    StackPanel3D.prototype._arrangeChildren = function () {
        var width = 0;
        var height = 0;
        var controlCount = 0;
        var extendSizes = [];
        var currentInverseWorld = babylonjs_1.Matrix.Invert(this.node.computeWorldMatrix(true));
        // Measure
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (!child.mesh) {
                continue;
            }
            controlCount++;
            child.mesh.computeWorldMatrix(true);
            child.mesh.getWorldMatrix().multiplyToRef(currentInverseWorld, babylonjs_1.Tmp.Matrix[0]);
            var boundingBox = child.mesh.getBoundingInfo().boundingBox;
            var extendSize = babylonjs_1.Vector3.TransformNormal(boundingBox.extendSize, babylonjs_1.Tmp.Matrix[0]);
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
}(container3D_1.Container3D));
exports.StackPanel3D = StackPanel3D;


/***/ }),

/***/ "./src/3D/controls/volumeBasedPanel.ts":
/*!*********************************************!*\
  !*** ./src/3D/controls/volumeBasedPanel.ts ***!
  \*********************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var container3D_1 = __webpack_require__(/*! ./container3D */ "./src/3D/controls/container3D.ts");
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
/**
 * Abstract class used to create a container panel deployed on the surface of a volume
 */
var VolumeBasedPanel = /** @class */ (function (_super) {
    __extends(VolumeBasedPanel, _super);
    /**
     * Creates new VolumeBasedPanel
     */
    function VolumeBasedPanel() {
        var _this = _super.call(this) || this;
        _this._columns = 10;
        _this._rows = 0;
        _this._rowThenColum = true;
        _this._orientation = container3D_1.Container3D.FACEORIGIN_ORIENTATION;
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
            babylonjs_1.Tools.SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: true,
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
            babylonjs_1.Tools.SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: true,
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
            babylonjs_1.Tools.SetImmediate(function () {
                _this._arrangeChildren();
            });
        },
        enumerable: true,
        configurable: true
    });
    VolumeBasedPanel.prototype._arrangeChildren = function () {
        this._cellWidth = 0;
        this._cellHeight = 0;
        var rows = 0;
        var columns = 0;
        var controlCount = 0;
        var currentInverseWorld = babylonjs_1.Matrix.Invert(this.node.computeWorldMatrix(true));
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
            var extendSize = babylonjs_1.Tmp.Vector3[0];
            var diff = babylonjs_1.Tmp.Vector3[1];
            boundingBox.max.subtractToRef(boundingBox.min, diff);
            diff.scaleInPlace(0.5);
            babylonjs_1.Vector3.TransformNormalToRef(diff, currentInverseWorld, extendSize);
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
                    nodeGrid.push(new babylonjs_1.Vector3((c * this._cellWidth) - startOffsetX + this._cellWidth / 2, (r * this._cellHeight) - startOffsetY + this._cellHeight / 2, 0));
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
                    nodeGrid.push(new babylonjs_1.Vector3((c * this._cellWidth) - startOffsetX + this._cellWidth / 2, (r * this._cellHeight) - startOffsetY + this._cellHeight / 2, 0));
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
}(container3D_1.Container3D));
exports.VolumeBasedPanel = VolumeBasedPanel;


/***/ }),

/***/ "./src/3D/gui3DManager.ts":
/*!********************************!*\
  !*** ./src/3D/gui3DManager.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var container3D_1 = __webpack_require__(/*! ./controls/container3D */ "./src/3D/controls/container3D.ts");
/**
 * Class used to manage 3D user interface
 * @see http://doc.babylonjs.com/how_to/gui3d
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
        this.onPickedPointChangedObservable = new babylonjs_1.Observable();
        // Shared resources
        /** @hidden */
        this._sharedMaterials = {};
        this._scene = scene || babylonjs_1.Engine.LastCreatedScene;
        this._sceneDisposeObserver = this._scene.onDisposeObservable.add(function () {
            _this._sceneDisposeObserver = null;
            _this._utilityLayer = null;
            _this.dispose();
        });
        this._utilityLayer = new babylonjs_1.UtilityLayerRenderer(this._scene);
        this._utilityLayer.onlyCheckPointerDownEvents = false;
        this._utilityLayer.mainSceneTrackerPredicate = function (mesh) {
            return mesh && mesh.metadata && mesh.metadata._node;
        };
        // Root
        this._rootContainer = new container3D_1.Container3D("RootContainer");
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
        new babylonjs_1.HemisphericLight("hemi", babylonjs_1.Vector3.Up(), this._utilityLayer.utilityLayerScene);
    }
    Object.defineProperty(GUI3DManager.prototype, "scene", {
        /** Gets the hosting scene */
        get: function () {
            return this._scene;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GUI3DManager.prototype, "utilityLayer", {
        /** Gets associated utility layer */
        get: function () {
            return this._utilityLayer;
        },
        enumerable: true,
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
        if (!this._utilityLayer || !this._utilityLayer.utilityLayerScene.activeCamera) {
            return false;
        }
        var pointerEvent = (pi.event);
        var pointerId = pointerEvent.pointerId || 0;
        var buttonIndex = pointerEvent.button;
        var pickingInfo = pi.pickInfo;
        if (!pickingInfo || !pickingInfo.hit) {
            this._handlePointerOut(pointerId, pi.type === babylonjs_1.PointerEventTypes.POINTERUP);
            return false;
        }
        var control = (pickingInfo.pickedMesh.metadata);
        if (pickingInfo.pickedPoint) {
            this.onPickedPointChangedObservable.notifyObservers(pickingInfo.pickedPoint);
        }
        if (!control._processObservables(pi.type, pickingInfo.pickedPoint, pointerId, buttonIndex)) {
            if (pi.type === babylonjs_1.PointerEventTypes.POINTERMOVE) {
                if (this._lastControlOver[pointerId]) {
                    this._lastControlOver[pointerId]._onPointerOut(this._lastControlOver[pointerId]);
                }
                delete this._lastControlOver[pointerId];
            }
        }
        if (pi.type === babylonjs_1.PointerEventTypes.POINTERUP) {
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
        enumerable: true,
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
exports.GUI3DManager = GUI3DManager;


/***/ }),

/***/ "./src/3D/index.ts":
/*!*************************!*\
  !*** ./src/3D/index.ts ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./controls */ "./src/3D/controls/index.ts"));
__export(__webpack_require__(/*! ./materials */ "./src/3D/materials/index.ts"));
__export(__webpack_require__(/*! ./gui3DManager */ "./src/3D/gui3DManager.ts"));
__export(__webpack_require__(/*! ./vector3WithInfo */ "./src/3D/vector3WithInfo.ts"));


/***/ }),

/***/ "./src/3D/materials/fluentMaterial.ts":
/*!********************************************!*\
  !*** ./src/3D/materials/fluentMaterial.ts ***!
  \********************************************/
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
var fluent_1 = __webpack_require__(/*! ./shaders/fluent */ "./src/3D/materials/shaders/fluent.ts");
// register shaders
fluent_1.registerShader();
/** @hidden */
var FluentMaterialDefines = /** @class */ (function (_super) {
    __extends(FluentMaterialDefines, _super);
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
}(babylonjs_1.MaterialDefines));
exports.FluentMaterialDefines = FluentMaterialDefines;
/**
 * Class used to render controls with fluent desgin
 */
var FluentMaterial = /** @class */ (function (_super) {
    __extends(FluentMaterial, _super);
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
        _this.innerGlowColor = new babylonjs_1.Color3(1.0, 1.0, 1.0);
        /**
         * Gets or sets alpha value (default is 1.0)
         */
        _this.alpha = 1.0;
        /**
         * Gets or sets the albedo color (Default is Color3(0.3, 0.35, 0.4))
         */
        _this.albedoColor = new babylonjs_1.Color3(0.3, 0.35, 0.4);
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
        _this.hoverColor = new babylonjs_1.Color4(0.3, 0.3, 0.3, 1.0);
        /**
         * Gets or sets the hover light position in world space (default is Vector3.Zero())
         */
        _this.hoverPosition = babylonjs_1.Vector3.Zero();
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
            if (this._wasPreviouslyReady && subMesh.effect) {
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
            var attribs = [babylonjs_1.VertexBuffer.PositionKind];
            attribs.push(babylonjs_1.VertexBuffer.NormalKind);
            attribs.push(babylonjs_1.VertexBuffer.UVKind);
            var shaderName = "fluent";
            var uniforms = ["world", "viewProjection", "innerGlowColor", "albedoColor", "borderWidth", "edgeSmoothingValue", "scaleFactor", "borderMinValue",
                "hoverColor", "hoverPosition", "hoverRadius"
            ];
            var samplers = ["albedoSampler"];
            var uniformBuffers = new Array();
            babylonjs_1.MaterialHelper.PrepareUniformsAndSamplersList({
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
        this._wasPreviouslyReady = true;
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
                mesh.getBoundingInfo().boundingBox.extendSize.multiplyToRef(mesh.scaling, babylonjs_1.Tmp.Vector3[0]);
                this._activeEffect.setVector3("scaleFactor", babylonjs_1.Tmp.Vector3[0]);
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
        return babylonjs_1.SerializationHelper.Clone(function () { return new FluentMaterial(name, _this.getScene()); }, this);
    };
    FluentMaterial.prototype.serialize = function () {
        var serializationObject = babylonjs_1.SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.GUI.FluentMaterial";
        return serializationObject;
    };
    FluentMaterial.prototype.getClassName = function () {
        return "FluentMaterial";
    };
    // Statics
    FluentMaterial.Parse = function (source, scene, rootUrl) {
        return babylonjs_1.SerializationHelper.Parse(function () { return new FluentMaterial(source.name, scene); }, source, scene, rootUrl);
    };
    __decorate([
        babylonjs_1.serialize(),
        babylonjs_1.expandToProperty("_markAllSubMeshesAsTexturesDirty")
    ], FluentMaterial.prototype, "innerGlowColorIntensity", void 0);
    __decorate([
        babylonjs_1.serializeAsColor3()
    ], FluentMaterial.prototype, "innerGlowColor", void 0);
    __decorate([
        babylonjs_1.serialize()
    ], FluentMaterial.prototype, "alpha", void 0);
    __decorate([
        babylonjs_1.serializeAsColor3()
    ], FluentMaterial.prototype, "albedoColor", void 0);
    __decorate([
        babylonjs_1.serialize(),
        babylonjs_1.expandToProperty("_markAllSubMeshesAsTexturesDirty")
    ], FluentMaterial.prototype, "renderBorders", void 0);
    __decorate([
        babylonjs_1.serialize()
    ], FluentMaterial.prototype, "borderWidth", void 0);
    __decorate([
        babylonjs_1.serialize()
    ], FluentMaterial.prototype, "edgeSmoothingValue", void 0);
    __decorate([
        babylonjs_1.serialize()
    ], FluentMaterial.prototype, "borderMinValue", void 0);
    __decorate([
        babylonjs_1.serialize(),
        babylonjs_1.expandToProperty("_markAllSubMeshesAsTexturesDirty")
    ], FluentMaterial.prototype, "renderHoverLight", void 0);
    __decorate([
        babylonjs_1.serialize()
    ], FluentMaterial.prototype, "hoverRadius", void 0);
    __decorate([
        babylonjs_1.serializeAsColor4()
    ], FluentMaterial.prototype, "hoverColor", void 0);
    __decorate([
        babylonjs_1.serializeAsVector3()
    ], FluentMaterial.prototype, "hoverPosition", void 0);
    __decorate([
        babylonjs_1.serializeAsTexture("albedoTexture")
    ], FluentMaterial.prototype, "_albedoTexture", void 0);
    __decorate([
        babylonjs_1.expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
    ], FluentMaterial.prototype, "albedoTexture", void 0);
    return FluentMaterial;
}(babylonjs_1.PushMaterial));
exports.FluentMaterial = FluentMaterial;


/***/ }),

/***/ "./src/3D/materials/index.ts":
/*!***********************************!*\
  !*** ./src/3D/materials/index.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./fluentMaterial */ "./src/3D/materials/fluentMaterial.ts"));


/***/ }),

/***/ "./src/3D/materials/shaders/fluent.fragment.fx":
/*!*****************************************************!*\
  !*** ./src/3D/materials/shaders/fluent.fragment.fx ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "precision highp float;\nvarying vec2 vUV;\nuniform vec4 albedoColor;\n#ifdef INNERGLOW\nuniform vec4 innerGlowColor;\n#endif\n#ifdef BORDER\nvarying vec2 scaleInfo;\nuniform float edgeSmoothingValue;\nuniform float borderMinValue;\n#endif\n#ifdef HOVERLIGHT\nvarying vec3 worldPosition;\nuniform vec3 hoverPosition;\nuniform vec4 hoverColor;\nuniform float hoverRadius;\n#endif\n#ifdef TEXTURE\nuniform sampler2D albedoSampler;\n#endif\nvoid main(void) {\nvec3 albedo=albedoColor.rgb;\nfloat alpha=albedoColor.a;\n#ifdef TEXTURE\nalbedo=texture2D(albedoSampler,vUV).rgb;\n#endif\n#ifdef HOVERLIGHT\nfloat pointToHover=(1.0-clamp(length(hoverPosition-worldPosition)/hoverRadius,0.,1.))*hoverColor.a;\nalbedo=clamp(albedo+hoverColor.rgb*pointToHover,0.,1.);\n#else\nfloat pointToHover=1.0;\n#endif\n#ifdef BORDER \nfloat borderPower=10.0;\nfloat inverseBorderPower=1.0/borderPower;\nvec3 borderColor=albedo*borderPower;\nvec2 distanceToEdge;\ndistanceToEdge.x=abs(vUV.x-0.5)*2.0;\ndistanceToEdge.y=abs(vUV.y-0.5)*2.0;\nfloat borderValue=max(smoothstep(scaleInfo.x-edgeSmoothingValue,scaleInfo.x+edgeSmoothingValue,distanceToEdge.x),\nsmoothstep(scaleInfo.y-edgeSmoothingValue,scaleInfo.y+edgeSmoothingValue,distanceToEdge.y));\nborderColor=borderColor*borderValue*max(borderMinValue*inverseBorderPower,pointToHover); \nalbedo+=borderColor;\nalpha=max(alpha,borderValue);\n#endif\n#ifdef INNERGLOW\n\nvec2 uvGlow=(vUV-vec2(0.5,0.5))*(innerGlowColor.a*2.0);\nuvGlow=uvGlow*uvGlow;\nuvGlow=uvGlow*uvGlow;\nalbedo+=mix(vec3(0.0,0.0,0.0),innerGlowColor.rgb,uvGlow.x+uvGlow.y); \n#endif\ngl_FragColor=vec4(albedo,alpha);\n}"

/***/ }),

/***/ "./src/3D/materials/shaders/fluent.ts":
/*!********************************************!*\
  !*** ./src/3D/materials/shaders/fluent.ts ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
var fShader = __webpack_require__(/*! ./fluent.fragment.fx */ "./src/3D/materials/shaders/fluent.fragment.fx");
exports.fShader = fShader;
var vShader = __webpack_require__(/*! ./fluent.vertex.fx */ "./src/3D/materials/shaders/fluent.vertex.fx");
exports.vShader = vShader;
function registerShader() {
    // register shaders
    babylonjs_1.Effect.ShadersStore["fluentVertexShader"] = vShader;
    babylonjs_1.Effect.ShadersStore["fluentPixelShader"] = fShader;
}
exports.registerShader = registerShader;


/***/ }),

/***/ "./src/3D/materials/shaders/fluent.vertex.fx":
/*!***************************************************!*\
  !*** ./src/3D/materials/shaders/fluent.vertex.fx ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "precision highp float;\n\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec2 uv;\n\nuniform mat4 world;\nuniform mat4 viewProjection;\nvarying vec2 vUV;\n#ifdef BORDER\nvarying vec2 scaleInfo;\nuniform float borderWidth;\nuniform vec3 scaleFactor;\n#endif\n#ifdef HOVERLIGHT\nvarying vec3 worldPosition;\n#endif\nvoid main(void) {\nvUV=uv;\n#ifdef BORDER\nvec3 scale=scaleFactor;\nfloat minScale=min(min(scale.x,scale.y),scale.z);\nfloat maxScale=max(max(scale.x,scale.y),scale.z);\nfloat minOverMiddleScale=minScale/(scale.x+scale.y+scale.z-minScale-maxScale);\nfloat areaYZ=scale.y*scale.z;\nfloat areaXZ=scale.x*scale.z;\nfloat areaXY=scale.x*scale.y;\nfloat scaledBorderWidth=borderWidth; \nif (abs(normal.x) == 1.0) \n{\nscale.x=scale.y;\nscale.y=scale.z;\nif (areaYZ>areaXZ && areaYZ>areaXY)\n{\nscaledBorderWidth*=minOverMiddleScale;\n}\n}\nelse if (abs(normal.y) == 1.0) \n{\nscale.x=scale.z;\nif (areaXZ>areaXY && areaXZ>areaYZ)\n{\nscaledBorderWidth*=minOverMiddleScale;\n}\n}\nelse \n{\nif (areaXY>areaYZ && areaXY>areaXZ)\n{\nscaledBorderWidth*=minOverMiddleScale;\n}\n}\nfloat scaleRatio=min(scale.x,scale.y)/max(scale.x,scale.y);\nif (scale.x>scale.y)\n{\nscaleInfo.x=1.0-(scaledBorderWidth*scaleRatio);\nscaleInfo.y=1.0-scaledBorderWidth;\n}\nelse\n{\nscaleInfo.x=1.0-scaledBorderWidth;\nscaleInfo.y=1.0-(scaledBorderWidth*scaleRatio);\n} \n#endif \nvec4 worldPos=world*vec4(position,1.0);\n#ifdef HOVERLIGHT\nworldPosition=worldPos.xyz;\n#endif\ngl_Position=viewProjection*worldPos;\n}\n"

/***/ }),

/***/ "./src/3D/vector3WithInfo.ts":
/*!***********************************!*\
  !*** ./src/3D/vector3WithInfo.ts ***!
  \***********************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
var babylonjs_1 = __webpack_require__(/*! babylonjs */ "babylonjs");
/**
 * Class used to transport Vector3 information for pointer events
 */
var Vector3WithInfo = /** @class */ (function (_super) {
    __extends(Vector3WithInfo, _super);
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
}(babylonjs_1.Vector3));
exports.Vector3WithInfo = Vector3WithInfo;


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./2D */ "./src/2D/index.ts"));
__export(__webpack_require__(/*! ./3D */ "./src/3D/index.ts"));


/***/ }),

/***/ "./src/legacy.ts":
/*!***********************!*\
  !*** ./src/legacy.ts ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var GUI = __webpack_require__(/*! ./index */ "./src/index.ts");
/**
 * Legacy support, defining window.BABYLON.GUI (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    globalObject.BABYLON = globalObject.BABYLON || {};
    globalObject.BABYLON.GUI = GUI;
}
__export(__webpack_require__(/*! ./index */ "./src/index.ts"));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../node_modules/webpack/buildin/global.js */ "../node_modules/webpack/buildin/global.js")))

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
//# sourceMappingURL=babylon.gui.js.map
=======
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e(require("babylonjs")):"function"==typeof define&&define.amd?define("babylonjs-gui",["babylonjs"],e):"object"==typeof exports?exports["babylonjs-gui"]=e(require("babylonjs")):(t.BABYLON=t.BABYLON||{},t.BABYLON.GUI=e(t.BABYLON))}(window,function(t){return function(t){var e={};function i(r){if(e[r])return e[r].exports;var o=e[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,i),o.l=!0,o.exports}return i.m=t,i.c=e,i.d=function(t,e,r){i.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},i.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},i.t=function(t,e){if(1&e&&(t=i(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(i.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)i.d(r,o,function(e){return t[e]}.bind(null,o));return r},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="",i(i.s=28)}([function(e,i){e.exports=t},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=i(2),o=i(0),n=i(5),s=i(18),a=function(){function t(e){this.name=e,this._alpha=1,this._alphaSet=!1,this._zIndex=0,this._currentMeasure=n.Measure.Empty(),this._fontFamily="Arial",this._fontStyle="",this._fontWeight="",this._fontSize=new r.ValueAndUnit(18,r.ValueAndUnit.UNITMODE_PIXEL,!1),this._width=new r.ValueAndUnit(1,r.ValueAndUnit.UNITMODE_PERCENTAGE,!1),this._height=new r.ValueAndUnit(1,r.ValueAndUnit.UNITMODE_PERCENTAGE,!1),this._color="",this._style=null,this._horizontalAlignment=t.HORIZONTAL_ALIGNMENT_CENTER,this._verticalAlignment=t.VERTICAL_ALIGNMENT_CENTER,this._isDirty=!0,this._tempParentMeasure=n.Measure.Empty(),this._cachedParentMeasure=n.Measure.Empty(),this._paddingLeft=new r.ValueAndUnit(0),this._paddingRight=new r.ValueAndUnit(0),this._paddingTop=new r.ValueAndUnit(0),this._paddingBottom=new r.ValueAndUnit(0),this._left=new r.ValueAndUnit(0),this._top=new r.ValueAndUnit(0),this._scaleX=1,this._scaleY=1,this._rotation=0,this._transformCenterX=.5,this._transformCenterY=.5,this._transformMatrix=s.Matrix2D.Identity(),this._invertTransformMatrix=s.Matrix2D.Identity(),this._transformedPosition=o.Vector2.Zero(),this._onlyMeasureMode=!1,this._isMatrixDirty=!0,this._isVisible=!0,this._fontSet=!1,this._dummyVector2=o.Vector2.Zero(),this._downCount=0,this._enterCount=-1,this._doNotRender=!1,this._downPointerIds={},this._isEnabled=!0,this._disabledColor="#9a9a9a",this.isHitTestVisible=!0,this.isPointerBlocker=!1,this.isFocusInvisible=!1,this.clipChildren=!0,this.shadowOffsetX=0,this.shadowOffsetY=0,this.shadowBlur=0,this.shadowColor="#000",this.hoverCursor="",this._linkOffsetX=new r.ValueAndUnit(0),this._linkOffsetY=new r.ValueAndUnit(0),this.onPointerMoveObservable=new o.Observable,this.onPointerOutObservable=new o.Observable,this.onPointerDownObservable=new o.Observable,this.onPointerUpObservable=new o.Observable,this.onPointerClickObservable=new o.Observable,this.onPointerEnterObservable=new o.Observable,this.onDirtyObservable=new o.Observable,this.onAfterDrawObservable=new o.Observable}return Object.defineProperty(t.prototype,"typeName",{get:function(){return this._getTypeName()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"fontOffset",{get:function(){return this._fontOffset},set:function(t){this._fontOffset=t},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"alpha",{get:function(){return this._alpha},set:function(t){this._alpha!==t&&(this._alphaSet=!0,this._alpha=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"scaleX",{get:function(){return this._scaleX},set:function(t){this._scaleX!==t&&(this._scaleX=t,this._markAsDirty(),this._markMatrixAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"scaleY",{get:function(){return this._scaleY},set:function(t){this._scaleY!==t&&(this._scaleY=t,this._markAsDirty(),this._markMatrixAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"rotation",{get:function(){return this._rotation},set:function(t){this._rotation!==t&&(this._rotation=t,this._markAsDirty(),this._markMatrixAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"transformCenterY",{get:function(){return this._transformCenterY},set:function(t){this._transformCenterY!==t&&(this._transformCenterY=t,this._markAsDirty(),this._markMatrixAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"transformCenterX",{get:function(){return this._transformCenterX},set:function(t){this._transformCenterX!==t&&(this._transformCenterX=t,this._markAsDirty(),this._markMatrixAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"horizontalAlignment",{get:function(){return this._horizontalAlignment},set:function(t){this._horizontalAlignment!==t&&(this._horizontalAlignment=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"verticalAlignment",{get:function(){return this._verticalAlignment},set:function(t){this._verticalAlignment!==t&&(this._verticalAlignment=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"width",{get:function(){return this._width.toString(this._host)},set:function(t){this._width.toString(this._host)!==t&&this._width.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"widthInPixels",{get:function(){return this._width.getValueInPixel(this._host,this._cachedParentMeasure.width)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"height",{get:function(){return this._height.toString(this._host)},set:function(t){this._height.toString(this._host)!==t&&this._height.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"heightInPixels",{get:function(){return this._height.getValueInPixel(this._host,this._cachedParentMeasure.height)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"fontFamily",{get:function(){return this._fontFamily},set:function(t){this._fontFamily!==t&&(this._fontFamily=t,this._resetFontCache())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"fontStyle",{get:function(){return this._fontStyle},set:function(t){this._fontStyle!==t&&(this._fontStyle=t,this._resetFontCache())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"fontWeight",{get:function(){return this._fontWeight},set:function(t){this._fontWeight!==t&&(this._fontWeight=t,this._resetFontCache())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"style",{get:function(){return this._style},set:function(t){var e=this;this._style&&(this._style.onChangedObservable.remove(this._styleObserver),this._styleObserver=null),this._style=t,this._style&&(this._styleObserver=this._style.onChangedObservable.add(function(){e._markAsDirty(),e._resetFontCache()})),this._markAsDirty(),this._resetFontCache()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"_isFontSizeInPercentage",{get:function(){return this._fontSize.isPercentage},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"fontSizeInPixels",{get:function(){var t=this._style?this._style._fontSize:this._fontSize;return t.isPixel?t.getValue(this._host):t.getValueInPixel(this._host,this._tempParentMeasure.height||this._cachedParentMeasure.height)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"fontSize",{get:function(){return this._fontSize.toString(this._host)},set:function(t){this._fontSize.toString(this._host)!==t&&this._fontSize.fromString(t)&&(this._markAsDirty(),this._resetFontCache())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"color",{get:function(){return this._color},set:function(t){this._color!==t&&(this._color=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"zIndex",{get:function(){return this._zIndex},set:function(t){this.zIndex!==t&&(this._zIndex=t,this._root&&this._root._reOrderControl(this))},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"notRenderable",{get:function(){return this._doNotRender},set:function(t){this._doNotRender!==t&&(this._doNotRender=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"isVisible",{get:function(){return this._isVisible},set:function(t){this._isVisible!==t&&(this._isVisible=t,this._markAsDirty(!0))},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"isDirty",{get:function(){return this._isDirty},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"linkedMesh",{get:function(){return this._linkedMesh},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"paddingLeft",{get:function(){return this._paddingLeft.toString(this._host)},set:function(t){this._paddingLeft.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"paddingLeftInPixels",{get:function(){return this._paddingLeft.getValueInPixel(this._host,this._cachedParentMeasure.width)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"paddingRight",{get:function(){return this._paddingRight.toString(this._host)},set:function(t){this._paddingRight.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"paddingRightInPixels",{get:function(){return this._paddingRight.getValueInPixel(this._host,this._cachedParentMeasure.width)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"paddingTop",{get:function(){return this._paddingTop.toString(this._host)},set:function(t){this._paddingTop.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"paddingTopInPixels",{get:function(){return this._paddingTop.getValueInPixel(this._host,this._cachedParentMeasure.height)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"paddingBottom",{get:function(){return this._paddingBottom.toString(this._host)},set:function(t){this._paddingBottom.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"paddingBottomInPixels",{get:function(){return this._paddingBottom.getValueInPixel(this._host,this._cachedParentMeasure.height)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"left",{get:function(){return this._left.toString(this._host)},set:function(t){this._left.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"leftInPixels",{get:function(){return this._left.getValueInPixel(this._host,this._cachedParentMeasure.width)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"top",{get:function(){return this._top.toString(this._host)},set:function(t){this._top.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"topInPixels",{get:function(){return this._top.getValueInPixel(this._host,this._cachedParentMeasure.height)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"linkOffsetX",{get:function(){return this._linkOffsetX.toString(this._host)},set:function(t){this._linkOffsetX.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"linkOffsetXInPixels",{get:function(){return this._linkOffsetX.getValueInPixel(this._host,this._cachedParentMeasure.width)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"linkOffsetY",{get:function(){return this._linkOffsetY.toString(this._host)},set:function(t){this._linkOffsetY.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"linkOffsetYInPixels",{get:function(){return this._linkOffsetY.getValueInPixel(this._host,this._cachedParentMeasure.height)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"centerX",{get:function(){return this._currentMeasure.left+this._currentMeasure.width/2},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"centerY",{get:function(){return this._currentMeasure.top+this._currentMeasure.height/2},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"isEnabled",{get:function(){return this._isEnabled},set:function(t){this._isEnabled!==t&&(this._isEnabled=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"disabledColor",{get:function(){return this._disabledColor},set:function(t){this._disabledColor!==t&&(this._disabledColor=t,this._markAsDirty())},enumerable:!0,configurable:!0}),t.prototype._getTypeName=function(){return"Control"},t.prototype._resetFontCache=function(){this._fontSet=!0,this._markAsDirty()},t.prototype.isAscendant=function(t){return!!this.parent&&(this.parent===t||this.parent.isAscendant(t))},t.prototype.getLocalCoordinates=function(t){var e=o.Vector2.Zero();return this.getLocalCoordinatesToRef(t,e),e},t.prototype.getLocalCoordinatesToRef=function(t,e){return e.x=t.x-this._currentMeasure.left,e.y=t.y-this._currentMeasure.top,this},t.prototype.getParentLocalCoordinates=function(t){var e=o.Vector2.Zero();return e.x=t.x-this._cachedParentMeasure.left,e.y=t.y-this._cachedParentMeasure.top,e},t.prototype.moveToVector3=function(e,i){if(this._host&&this._root===this._host._rootContainer){this.horizontalAlignment=t.HORIZONTAL_ALIGNMENT_LEFT,this.verticalAlignment=t.VERTICAL_ALIGNMENT_TOP;var r=this._host._getGlobalViewport(i),n=o.Vector3.Project(e,o.Matrix.Identity(),i.getTransformMatrix(),r);this._moveToProjectedPosition(n),n.z<0||n.z>1?this.notRenderable=!0:this.notRenderable=!1}else o.Tools.Error("Cannot move a control to a vector3 if the control is not at root level")},t.prototype.linkWithMesh=function(e){if(!this._host||this._root&&this._root!==this._host._rootContainer)e&&o.Tools.Error("Cannot link a control to a mesh if the control is not at root level");else{var i=this._host._linkedControls.indexOf(this);if(-1!==i)return this._linkedMesh=e,void(e||this._host._linkedControls.splice(i,1));e&&(this.horizontalAlignment=t.HORIZONTAL_ALIGNMENT_LEFT,this.verticalAlignment=t.VERTICAL_ALIGNMENT_TOP,this._linkedMesh=e,this._onlyMeasureMode=0===this._currentMeasure.width||0===this._currentMeasure.height,this._host._linkedControls.push(this))}},t.prototype._moveToProjectedPosition=function(t){var e=this._left.getValue(this._host),i=this._top.getValue(this._host),r=t.x+this._linkOffsetX.getValue(this._host)-this._currentMeasure.width/2,o=t.y+this._linkOffsetY.getValue(this._host)-this._currentMeasure.height/2;this._left.ignoreAdaptiveScaling&&this._top.ignoreAdaptiveScaling&&(Math.abs(r-e)<.5&&(r=e),Math.abs(o-i)<.5&&(o=i)),this.left=r+"px",this.top=o+"px",this._left.ignoreAdaptiveScaling=!0,this._top.ignoreAdaptiveScaling=!0},t.prototype._markMatrixAsDirty=function(){this._isMatrixDirty=!0,this._flagDescendantsAsMatrixDirty()},t.prototype._flagDescendantsAsMatrixDirty=function(){},t.prototype._markAsDirty=function(t){void 0===t&&(t=!1),(this._isVisible||t)&&(this._isDirty=!0,this._host&&this._host.markAsDirty())},t.prototype._markAllAsDirty=function(){this._markAsDirty(),this._font&&this._prepareFont()},t.prototype._link=function(t,e){this._root=t,this._host=e},t.prototype._transform=function(t){if(this._isMatrixDirty||1!==this._scaleX||1!==this._scaleY||0!==this._rotation){var e=this._currentMeasure.width*this._transformCenterX+this._currentMeasure.left,i=this._currentMeasure.height*this._transformCenterY+this._currentMeasure.top;t.translate(e,i),t.rotate(this._rotation),t.scale(this._scaleX,this._scaleY),t.translate(-e,-i),(this._isMatrixDirty||this._cachedOffsetX!==e||this._cachedOffsetY!==i)&&(this._cachedOffsetX=e,this._cachedOffsetY=i,this._isMatrixDirty=!1,this._flagDescendantsAsMatrixDirty(),s.Matrix2D.ComposeToRef(-e,-i,this._rotation,this._scaleX,this._scaleY,this._root?this._root._transformMatrix:null,this._transformMatrix),this._transformMatrix.invertToRef(this._invertTransformMatrix))}},t.prototype._applyStates=function(t){this._isFontSizeInPercentage&&(this._fontSet=!0),this._fontSet&&(this._prepareFont(),this._fontSet=!1),this._font&&(t.font=this._font),this._color&&(t.fillStyle=this._color),this._alphaSet&&(t.globalAlpha=this.parent?this.parent.alpha*this._alpha:this._alpha)},t.prototype._processMeasures=function(t,e){return!this._isDirty&&this._cachedParentMeasure.isEqualsTo(t)||(this._isDirty=!1,this._currentMeasure.copyFrom(t),this._preMeasure(t,e),this._measure(),this._computeAlignment(t,e),this._currentMeasure.left=0|this._currentMeasure.left,this._currentMeasure.top=0|this._currentMeasure.top,this._currentMeasure.width=0|this._currentMeasure.width,this._currentMeasure.height=0|this._currentMeasure.height,this._additionalProcessing(t,e),this._cachedParentMeasure.copyFrom(t),this.onDirtyObservable.hasObservers()&&this.onDirtyObservable.notifyObservers(this)),!(this._currentMeasure.left>t.left+t.width)&&(!(this._currentMeasure.left+this._currentMeasure.width<t.left)&&(!(this._currentMeasure.top>t.top+t.height)&&(!(this._currentMeasure.top+this._currentMeasure.height<t.top)&&(this._transform(e),this._onlyMeasureMode?(this._onlyMeasureMode=!1,!1):(this.clipChildren&&(this._clip(e),e.clip()),!0)))))},t.prototype._clip=function(t){if(t.beginPath(),this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY){var e=this.shadowOffsetX,i=this.shadowOffsetY,r=this.shadowBlur,o=Math.min(Math.min(e,0)-2*r,0),n=Math.max(Math.max(e,0)+2*r,0),s=Math.min(Math.min(i,0)-2*r,0),a=Math.max(Math.max(i,0)+2*r,0);t.rect(this._currentMeasure.left+o,this._currentMeasure.top+s,this._currentMeasure.width+n-o,this._currentMeasure.height+a-s)}else t.rect(this._currentMeasure.left,this._currentMeasure.top,this._currentMeasure.width,this._currentMeasure.height)},t.prototype._measure=function(){this._width.isPixel?this._currentMeasure.width=this._width.getValue(this._host):this._currentMeasure.width*=this._width.getValue(this._host),this._height.isPixel?this._currentMeasure.height=this._height.getValue(this._host):this._currentMeasure.height*=this._height.getValue(this._host)},t.prototype._computeAlignment=function(e,i){var r=this._currentMeasure.width,o=this._currentMeasure.height,n=e.width,s=e.height,a=0,h=0;switch(this.horizontalAlignment){case t.HORIZONTAL_ALIGNMENT_LEFT:a=0;break;case t.HORIZONTAL_ALIGNMENT_RIGHT:a=n-r;break;case t.HORIZONTAL_ALIGNMENT_CENTER:a=(n-r)/2}switch(this.verticalAlignment){case t.VERTICAL_ALIGNMENT_TOP:h=0;break;case t.VERTICAL_ALIGNMENT_BOTTOM:h=s-o;break;case t.VERTICAL_ALIGNMENT_CENTER:h=(s-o)/2}this._paddingLeft.isPixel?(this._currentMeasure.left+=this._paddingLeft.getValue(this._host),this._currentMeasure.width-=this._paddingLeft.getValue(this._host)):(this._currentMeasure.left+=n*this._paddingLeft.getValue(this._host),this._currentMeasure.width-=n*this._paddingLeft.getValue(this._host)),this._paddingRight.isPixel?this._currentMeasure.width-=this._paddingRight.getValue(this._host):this._currentMeasure.width-=n*this._paddingRight.getValue(this._host),this._paddingTop.isPixel?(this._currentMeasure.top+=this._paddingTop.getValue(this._host),this._currentMeasure.height-=this._paddingTop.getValue(this._host)):(this._currentMeasure.top+=s*this._paddingTop.getValue(this._host),this._currentMeasure.height-=s*this._paddingTop.getValue(this._host)),this._paddingBottom.isPixel?this._currentMeasure.height-=this._paddingBottom.getValue(this._host):this._currentMeasure.height-=s*this._paddingBottom.getValue(this._host),this._left.isPixel?this._currentMeasure.left+=this._left.getValue(this._host):this._currentMeasure.left+=n*this._left.getValue(this._host),this._top.isPixel?this._currentMeasure.top+=this._top.getValue(this._host):this._currentMeasure.top+=s*this._top.getValue(this._host),this._currentMeasure.left+=a,this._currentMeasure.top+=h},t.prototype._preMeasure=function(t,e){},t.prototype._additionalProcessing=function(t,e){},t.prototype._draw=function(t,e){},t.prototype.contains=function(t,e){return this._invertTransformMatrix.transformCoordinates(t,e,this._transformedPosition),t=this._transformedPosition.x,e=this._transformedPosition.y,!(t<this._currentMeasure.left)&&(!(t>this._currentMeasure.left+this._currentMeasure.width)&&(!(e<this._currentMeasure.top)&&(!(e>this._currentMeasure.top+this._currentMeasure.height)&&(this.isPointerBlocker&&(this._host._shouldBlockPointer=!0),!0))))},t.prototype._processPicking=function(t,e,i,r,o){return!!this._isEnabled&&(!(!this.isHitTestVisible||!this.isVisible||this._doNotRender)&&(!!this.contains(t,e)&&(this._processObservables(i,t,e,r,o),!0)))},t.prototype._onPointerMove=function(t,e){this.onPointerMoveObservable.notifyObservers(e,-1,t,this)&&null!=this.parent&&this.parent._onPointerMove(t,e)},t.prototype._onPointerEnter=function(t){return!!this._isEnabled&&(!(this._enterCount>0)&&(-1===this._enterCount&&(this._enterCount=0),this._enterCount++,this.onPointerEnterObservable.notifyObservers(this,-1,t,this)&&null!=this.parent&&this.parent._onPointerEnter(t),!0))},t.prototype._onPointerOut=function(t){this._isEnabled&&(this._enterCount=0,this.onPointerOutObservable.notifyObservers(this,-1,t,this)&&null!=this.parent&&this.parent._onPointerOut(t))},t.prototype._onPointerDown=function(t,e,i,r){return this._onPointerEnter(this),0===this._downCount&&(this._downCount++,this._downPointerIds[i]=!0,this.onPointerDownObservable.notifyObservers(new s.Vector2WithInfo(e,r),-1,t,this)&&null!=this.parent&&this.parent._onPointerDown(t,e,i,r),!0)},t.prototype._onPointerUp=function(t,e,i,r,o){if(this._isEnabled){this._downCount=0,delete this._downPointerIds[i];var n=o;o&&(this._enterCount>0||-1===this._enterCount)&&(n=this.onPointerClickObservable.notifyObservers(new s.Vector2WithInfo(e,r),-1,t,this)),this.onPointerUpObservable.notifyObservers(new s.Vector2WithInfo(e,r),-1,t,this)&&null!=this.parent&&this.parent._onPointerUp(t,e,i,r,n)}},t.prototype._forcePointerUp=function(t){if(void 0===t&&(t=null),null!==t)this._onPointerUp(this,o.Vector2.Zero(),t,0,!0);else for(var e in this._downPointerIds)this._onPointerUp(this,o.Vector2.Zero(),+e,0,!0)},t.prototype._processObservables=function(t,e,i,r,n){if(!this._isEnabled)return!1;if(this._dummyVector2.copyFromFloats(e,i),t===o.PointerEventTypes.POINTERMOVE){this._onPointerMove(this,this._dummyVector2);var s=this._host._lastControlOver[r];return s&&s!==this&&s._onPointerOut(this),s!==this&&this._onPointerEnter(this),this._host._lastControlOver[r]=this,!0}return t===o.PointerEventTypes.POINTERDOWN?(this._onPointerDown(this,this._dummyVector2,r,n),this._host._lastControlDown[r]=this,this._host._lastPickedControl=this,!0):t===o.PointerEventTypes.POINTERUP&&(this._host._lastControlDown[r]&&this._host._lastControlDown[r]._onPointerUp(this,this._dummyVector2,r,n,!0),delete this._host._lastControlDown[r],!0)},t.prototype._prepareFont=function(){(this._font||this._fontSet)&&(this._style?this._font=this._style.fontStyle+" "+this._style.fontWeight+" "+this.fontSizeInPixels+"px "+this._style.fontFamily:this._font=this._fontStyle+" "+this._fontWeight+" "+this.fontSizeInPixels+"px "+this._fontFamily,this._fontOffset=t._GetFontOffset(this._font))},t.prototype.dispose=function(){(this.onDirtyObservable.clear(),this.onAfterDrawObservable.clear(),this.onPointerDownObservable.clear(),this.onPointerEnterObservable.clear(),this.onPointerMoveObservable.clear(),this.onPointerOutObservable.clear(),this.onPointerUpObservable.clear(),this.onPointerClickObservable.clear(),this._styleObserver&&this._style&&(this._style.onChangedObservable.remove(this._styleObserver),this._styleObserver=null),this._root&&(this._root.removeControl(this),this._root=null),this._host)&&(this._host._linkedControls.indexOf(this)>-1&&this.linkWithMesh(null))},Object.defineProperty(t,"HORIZONTAL_ALIGNMENT_LEFT",{get:function(){return t._HORIZONTAL_ALIGNMENT_LEFT},enumerable:!0,configurable:!0}),Object.defineProperty(t,"HORIZONTAL_ALIGNMENT_RIGHT",{get:function(){return t._HORIZONTAL_ALIGNMENT_RIGHT},enumerable:!0,configurable:!0}),Object.defineProperty(t,"HORIZONTAL_ALIGNMENT_CENTER",{get:function(){return t._HORIZONTAL_ALIGNMENT_CENTER},enumerable:!0,configurable:!0}),Object.defineProperty(t,"VERTICAL_ALIGNMENT_TOP",{get:function(){return t._VERTICAL_ALIGNMENT_TOP},enumerable:!0,configurable:!0}),Object.defineProperty(t,"VERTICAL_ALIGNMENT_BOTTOM",{get:function(){return t._VERTICAL_ALIGNMENT_BOTTOM},enumerable:!0,configurable:!0}),Object.defineProperty(t,"VERTICAL_ALIGNMENT_CENTER",{get:function(){return t._VERTICAL_ALIGNMENT_CENTER},enumerable:!0,configurable:!0}),t._GetFontOffset=function(e){if(t._FontHeightSizes[e])return t._FontHeightSizes[e];var i=document.createElement("span");i.innerHTML="Hg",i.style.font=e;var r=document.createElement("div");r.style.display="inline-block",r.style.width="1px",r.style.height="0px",r.style.verticalAlign="bottom";var o=document.createElement("div");o.appendChild(i),o.appendChild(r),document.body.appendChild(o);var n=0,s=0;try{s=r.getBoundingClientRect().top-i.getBoundingClientRect().top,r.style.verticalAlign="baseline",n=r.getBoundingClientRect().top-i.getBoundingClientRect().top}finally{document.body.removeChild(o)}var a={ascent:n,height:s,descent:s-n};return t._FontHeightSizes[e]=a,a},t.drawEllipse=function(t,e,i,r,o){o.translate(t,e),o.scale(i,r),o.beginPath(),o.arc(0,0,1,0,2*Math.PI),o.closePath(),o.scale(1/i,1/r),o.translate(-t,-e)},t._HORIZONTAL_ALIGNMENT_LEFT=0,t._HORIZONTAL_ALIGNMENT_RIGHT=1,t._HORIZONTAL_ALIGNMENT_CENTER=2,t._VERTICAL_ALIGNMENT_TOP=0,t._VERTICAL_ALIGNMENT_BOTTOM=1,t._VERTICAL_ALIGNMENT_CENTER=2,t._FontHeightSizes={},t.AddHeader=function(){},t}();e.Control=a},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(e,i,r){void 0===i&&(i=t.UNITMODE_PIXEL),void 0===r&&(r=!0),this.unit=i,this.negativeValueAllowed=r,this._value=1,this.ignoreAdaptiveScaling=!1,this._value=e}return Object.defineProperty(t.prototype,"isPercentage",{get:function(){return this.unit===t.UNITMODE_PERCENTAGE},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"isPixel",{get:function(){return this.unit===t.UNITMODE_PIXEL},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"internalValue",{get:function(){return this._value},enumerable:!0,configurable:!0}),t.prototype.getValueInPixel=function(t,e){return this.isPixel?this.getValue(t):this.getValue(t)*e},t.prototype.getValue=function(e){if(e&&!this.ignoreAdaptiveScaling&&this.unit!==t.UNITMODE_PERCENTAGE){var i=0,r=0;if(e.idealWidth&&(i=this._value*e.getSize().width/e.idealWidth),e.idealHeight&&(r=this._value*e.getSize().height/e.idealHeight),e.useSmallestIdeal&&e.idealWidth&&e.idealHeight)return window.innerWidth<window.innerHeight?i:r;if(e.idealWidth)return i;if(e.idealHeight)return r}return this._value},t.prototype.toString=function(e){switch(this.unit){case t.UNITMODE_PERCENTAGE:return 100*this.getValue(e)+"%";case t.UNITMODE_PIXEL:return this.getValue(e)+"px"}return this.unit.toString()},t.prototype.fromString=function(e){var i=t._Regex.exec(e.toString());if(!i||0===i.length)return!1;var r=parseFloat(i[1]),o=this.unit;if(this.negativeValueAllowed||r<0&&(r=0),4===i.length)switch(i[3]){case"px":o=t.UNITMODE_PIXEL;break;case"%":o=t.UNITMODE_PERCENTAGE,r/=100}return(r!==this._value||o!==this.unit)&&(this._value=r,this.unit=o,!0)},Object.defineProperty(t,"UNITMODE_PERCENTAGE",{get:function(){return t._UNITMODE_PERCENTAGE},enumerable:!0,configurable:!0}),Object.defineProperty(t,"UNITMODE_PIXEL",{get:function(){return t._UNITMODE_PIXEL},enumerable:!0,configurable:!0}),t._Regex=/(^-?\d*(\.\d+)?)(%|px)?/,t._UNITMODE_PERCENTAGE=0,t._UNITMODE_PIXEL=1,t}();e.ValueAndUnit=r},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(14),n=i(0),s=function(t){function e(e){var i=t.call(this,e)||this;return i._blockLayout=!1,i._children=new Array,i}return r(e,t),Object.defineProperty(e.prototype,"children",{get:function(){return this._children},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"blockLayout",{get:function(){return this._blockLayout},set:function(t){this._blockLayout!==t&&(this._blockLayout=t,this._blockLayout||this._arrangeChildren())},enumerable:!0,configurable:!0}),e.prototype.updateLayout=function(){return this._arrangeChildren(),this},e.prototype.containsControl=function(t){return-1!==this._children.indexOf(t)},e.prototype.addControl=function(t){return-1!==this._children.indexOf(t)?this:(t.parent=this,t._host=this._host,this._children.push(t),this._host.utilityLayer&&(t._prepareNode(this._host.utilityLayer.utilityLayerScene),t.node&&(t.node.parent=this.node),this.blockLayout||this._arrangeChildren()),this)},e.prototype._arrangeChildren=function(){},e.prototype._createNode=function(t){return new n.TransformNode("ContainerNode",t)},e.prototype.removeControl=function(t){var e=this._children.indexOf(t);return-1!==e&&(this._children.splice(e,1),t.parent=null,t._disposeNode()),this},e.prototype._getTypeName=function(){return"Container3D"},e.prototype.dispose=function(){for(var e=0,i=this._children;e<i.length;e++){i[e].dispose()}this._children=[],t.prototype.dispose.call(this)},e.UNSET_ORIENTATION=0,e.FACEORIGIN_ORIENTATION=1,e.FACEORIGINREVERSED_ORIENTATION=2,e.FACEFORWARD_ORIENTATION=3,e.FACEFORWARDREVERSED_ORIENTATION=4,e}(o.Control3D);e.Container3D=s},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(1),n=i(5),s=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._children=new Array,i._measureForChildren=n.Measure.Empty(),i._adaptWidthToChildren=!1,i._adaptHeightToChildren=!1,i}return r(e,t),Object.defineProperty(e.prototype,"adaptHeightToChildren",{get:function(){return this._adaptHeightToChildren},set:function(t){this._adaptHeightToChildren!==t&&(this._adaptHeightToChildren=t,t&&(this.height="100%"),this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"adaptWidthToChildren",{get:function(){return this._adaptWidthToChildren},set:function(t){this._adaptWidthToChildren!==t&&(this._adaptWidthToChildren=t,t&&(this.width="100%"),this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"background",{get:function(){return this._background},set:function(t){this._background!==t&&(this._background=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"children",{get:function(){return this._children},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"Container"},e.prototype._flagDescendantsAsMatrixDirty=function(){for(var t=0,e=this.children;t<e.length;t++){e[t]._markMatrixAsDirty()}},e.prototype.getChildByName=function(t){for(var e=0,i=this.children;e<i.length;e++){var r=i[e];if(r.name===t)return r}return null},e.prototype.getChildByType=function(t,e){for(var i=0,r=this.children;i<r.length;i++){var o=r[i];if(o.typeName===e)return o}return null},e.prototype.containsControl=function(t){return-1!==this.children.indexOf(t)},e.prototype.addControl=function(t){return t?-1!==this._children.indexOf(t)?this:(t._link(this,this._host),t._markAllAsDirty(),this._reOrderControl(t),this._markAsDirty(),this):this},e.prototype.clearControls=function(){for(var t=0,e=this._children.slice();t<e.length;t++){var i=e[t];this.removeControl(i)}return this},e.prototype.removeControl=function(t){var e=this._children.indexOf(t);return-1!==e&&(this._children.splice(e,1),t.parent=null),t.linkWithMesh(null),this._host&&this._host._cleanControlAfterRemoval(t),this._markAsDirty(),this},e.prototype._reOrderControl=function(t){this.removeControl(t);for(var e=0;e<this._children.length;e++)if(this._children[e].zIndex>t.zIndex)return void this._children.splice(e,0,t);this._children.push(t),t.parent=this,this._markAsDirty()},e.prototype._markAllAsDirty=function(){t.prototype._markAllAsDirty.call(this);for(var e=0;e<this._children.length;e++)this._children[e]._markAllAsDirty()},e.prototype._localDraw=function(t){this._background&&((this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(t.shadowColor=this.shadowColor,t.shadowBlur=this.shadowBlur,t.shadowOffsetX=this.shadowOffsetX,t.shadowOffsetY=this.shadowOffsetY),t.fillStyle=this._background,t.fillRect(this._currentMeasure.left,this._currentMeasure.top,this._currentMeasure.width,this._currentMeasure.height),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(t.shadowBlur=0,t.shadowOffsetX=0,t.shadowOffsetY=0))},e.prototype._link=function(e,i){t.prototype._link.call(this,e,i);for(var r=0,o=this._children;r<o.length;r++){o[r]._link(this,i)}},e.prototype._draw=function(t,e){if(this.isVisible&&!this.notRenderable){if(e.save(),this._applyStates(e),this._processMeasures(t,e)){this._localDraw(e),this.clipChildren&&this._clipForChildren(e);for(var i=-1,r=-1,o=0,n=this._children;o<n.length;o++){var s=n[o];s.isVisible&&!s.notRenderable&&(s._tempParentMeasure.copyFrom(this._measureForChildren),s._draw(this._measureForChildren,e),s.onAfterDrawObservable.hasObservers()&&s.onAfterDrawObservable.notifyObservers(s),this.adaptWidthToChildren&&s._width.isPixel&&(i=Math.max(i,s._currentMeasure.width)),this.adaptHeightToChildren&&s._height.isPixel&&(r=Math.max(r,s._currentMeasure.height)))}this.adaptWidthToChildren&&i>=0&&(this.width=i+"px"),this.adaptHeightToChildren&&r>=0&&(this.height=r+"px")}e.restore(),this.onAfterDrawObservable.hasObservers()&&this.onAfterDrawObservable.notifyObservers(this)}},e.prototype._processPicking=function(e,i,r,o,n){if(!this.isVisible||this.notRenderable)return!1;if(!t.prototype.contains.call(this,e,i))return!1;for(var s=this._children.length-1;s>=0;s--){var a=this._children[s];if(a._processPicking(e,i,r,o,n))return a.hoverCursor&&this._host._changeCursor(a.hoverCursor),!0}return!!this.isHitTestVisible&&this._processObservables(r,e,i,o,n)},e.prototype._clipForChildren=function(t){},e.prototype._additionalProcessing=function(e,i){t.prototype._additionalProcessing.call(this,e,i),this._measureForChildren.copyFrom(this._currentMeasure)},e.prototype.dispose=function(){t.prototype.dispose.call(this);for(var e=0,i=this._children;e<i.length;e++){i[e].dispose()}},e}(o.Control);e.Container=s},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(t,e,i,r){this.left=t,this.top=e,this.width=i,this.height=r}return t.prototype.copyFrom=function(t){this.left=t.left,this.top=t.top,this.width=t.width,this.height=t.height},t.prototype.copyFromFloats=function(t,e,i,r){this.left=t,this.top=e,this.width=i,this.height=r},t.prototype.isEqualsTo=function(t){return this.left===t.left&&(this.top===t.top&&(this.width===t.width&&this.height===t.height))},t.Empty=function(){return new t(0,0,0,0)},t}();e.Measure=r},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o,n=i(0),s=i(2),a=i(1);!function(t){t[t.Clip=0]="Clip",t[t.WordWrap=1]="WordWrap",t[t.Ellipsis=2]="Ellipsis"}(o=e.TextWrapping||(e.TextWrapping={}));var h=function(t){function e(e,i){void 0===i&&(i="");var r=t.call(this,e)||this;return r.name=e,r._text="",r._textWrapping=o.Clip,r._textHorizontalAlignment=a.Control.HORIZONTAL_ALIGNMENT_CENTER,r._textVerticalAlignment=a.Control.VERTICAL_ALIGNMENT_CENTER,r._resizeToFit=!1,r._lineSpacing=new s.ValueAndUnit(0),r._outlineWidth=0,r._outlineColor="white",r.onTextChangedObservable=new n.Observable,r.onLinesReadyObservable=new n.Observable,r.text=i,r}return r(e,t),Object.defineProperty(e.prototype,"lines",{get:function(){return this._lines},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"resizeToFit",{get:function(){return this._resizeToFit},set:function(t){this._resizeToFit=t,this._resizeToFit&&(this._width.ignoreAdaptiveScaling=!0,this._height.ignoreAdaptiveScaling=!0)},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"textWrapping",{get:function(){return this._textWrapping},set:function(t){this._textWrapping!==t&&(this._textWrapping=+t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"text",{get:function(){return this._text},set:function(t){this._text!==t&&(this._text=t,this._markAsDirty(),this.onTextChangedObservable.notifyObservers(this))},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"textHorizontalAlignment",{get:function(){return this._textHorizontalAlignment},set:function(t){this._textHorizontalAlignment!==t&&(this._textHorizontalAlignment=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"textVerticalAlignment",{get:function(){return this._textVerticalAlignment},set:function(t){this._textVerticalAlignment!==t&&(this._textVerticalAlignment=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"lineSpacing",{get:function(){return this._lineSpacing.toString(this._host)},set:function(t){this._lineSpacing.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"outlineWidth",{get:function(){return this._outlineWidth},set:function(t){this._outlineWidth!==t&&(this._outlineWidth=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"outlineColor",{get:function(){return this._outlineColor},set:function(t){this._outlineColor!==t&&(this._outlineColor=t,this._markAsDirty())},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"TextBlock"},e.prototype._drawText=function(t,e,i,r){var o=this._currentMeasure.width,n=0;switch(this._textHorizontalAlignment){case a.Control.HORIZONTAL_ALIGNMENT_LEFT:n=0;break;case a.Control.HORIZONTAL_ALIGNMENT_RIGHT:n=o-e;break;case a.Control.HORIZONTAL_ALIGNMENT_CENTER:n=(o-e)/2}(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(r.shadowColor=this.shadowColor,r.shadowBlur=this.shadowBlur,r.shadowOffsetX=this.shadowOffsetX,r.shadowOffsetY=this.shadowOffsetY),this.outlineWidth&&r.strokeText(t,this._currentMeasure.left+n,i),r.fillText(t,this._currentMeasure.left+n,i)},e.prototype._draw=function(t,e){e.save(),this._applyStates(e),this._processMeasures(t,e)&&this._renderLines(e),e.restore()},e.prototype._applyStates=function(e){t.prototype._applyStates.call(this,e),this.outlineWidth&&(e.lineWidth=this.outlineWidth,e.strokeStyle=this.outlineColor)},e.prototype._additionalProcessing=function(t,e){this._lines=this._breakLines(this._currentMeasure.width,e),this.onLinesReadyObservable.notifyObservers(this)},e.prototype._breakLines=function(t,e){var i=[],r=this.text.split("\n");if(this._textWrapping!==o.Ellipsis||this._resizeToFit)if(this._textWrapping!==o.WordWrap||this._resizeToFit)for(var n=0,s=r;n<s.length;n++){l=s[n];i.push(this._parseLine(l,e))}else for(var a=0,h=r;a<h.length;a++){var l=h[a];i.push.apply(i,this._parseLineWordWrap(l,t,e))}else for(var u=0,c=r;u<c.length;u++){var l=c[u];i.push(this._parseLineEllipsis(l,t,e))}return i},e.prototype._parseLine=function(t,e){return void 0===t&&(t=""),{text:t,width:e.measureText(t).width}},e.prototype._parseLineEllipsis=function(t,e,i){void 0===t&&(t="");var r=i.measureText(t).width;for(r>e&&(t+="…");t.length>2&&r>e;)t=t.slice(0,-2)+"…",r=i.measureText(t).width;return{text:t,width:r}},e.prototype._parseLineWordWrap=function(t,e,i){void 0===t&&(t="");for(var r=[],o=t.split(" "),n=0,s=0;s<o.length;s++){var a=s>0?t+" "+o[s]:o[0],h=i.measureText(a).width;h>e&&s>0?(r.push({text:t,width:n}),t=o[s],n=i.measureText(t).width):(n=h,t=a)}return r.push({text:t,width:n}),r},e.prototype._renderLines=function(t){var e=this._currentMeasure.height;this._fontOffset||(this._fontOffset=a.Control._GetFontOffset(t.font));var i=0;switch(this._textVerticalAlignment){case a.Control.VERTICAL_ALIGNMENT_TOP:i=this._fontOffset.ascent;break;case a.Control.VERTICAL_ALIGNMENT_BOTTOM:i=e-this._fontOffset.height*(this._lines.length-1)-this._fontOffset.descent;break;case a.Control.VERTICAL_ALIGNMENT_CENTER:i=this._fontOffset.ascent+(e-this._fontOffset.height*this._lines.length)/2}i+=this._currentMeasure.top;for(var r=0,o=0;o<this._lines.length;o++){var n=this._lines[o];0!==o&&0!==this._lineSpacing.internalValue&&(this._lineSpacing.isPixel?i+=this._lineSpacing.getValue(this._host):i+=this._lineSpacing.getValue(this._host)*this._height.getValueInPixel(this._host,this._cachedParentMeasure.height)),this._drawText(n.text,n.width,i,t),i+=this._fontOffset.height,n.width>r&&(r=n.width)}this._resizeToFit&&(this.width=this.paddingLeftInPixels+this.paddingRightInPixels+r+"px",this.height=this.paddingTopInPixels+this.paddingBottomInPixels+this._fontOffset.height*this._lines.length+"px")},e.prototype.computeExpectedHeight=function(){if(this.text&&this.widthInPixels){var t=document.createElement("canvas").getContext("2d");if(t){this._applyStates(t),this._fontOffset||(this._fontOffset=a.Control._GetFontOffset(t.font));var e=this._lines?this._lines:this._breakLines(this.widthInPixels-this.paddingLeftInPixels-this.paddingRightInPixels,t);return this.paddingTopInPixels+this.paddingBottomInPixels+this._fontOffset.height*e.length}}return 0},e.prototype.dispose=function(){t.prototype.dispose.call(this),this.onTextChangedObservable.clear()},e}(a.Control);e.TextBlock=h},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(4),n=i(5),s=i(1),a=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._isVertical=!0,i._manualWidth=!1,i._manualHeight=!1,i._doNotTrackManualChanges=!1,i._tempMeasureStore=n.Measure.Empty(),i}return r(e,t),Object.defineProperty(e.prototype,"isVertical",{get:function(){return this._isVertical},set:function(t){this._isVertical!==t&&(this._isVertical=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"width",{get:function(){return this._width.toString(this._host)},set:function(t){this._doNotTrackManualChanges||(this._manualWidth=!0),this._width.toString(this._host)!==t&&this._width.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"height",{get:function(){return this._height.toString(this._host)},set:function(t){this._doNotTrackManualChanges||(this._manualHeight=!0),this._height.toString(this._host)!==t&&this._height.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"StackPanel"},e.prototype._preMeasure=function(e,i){for(var r=0,o=0,n=0,a=this._children;n<a.length;n++){var h=a[n];this._tempMeasureStore.copyFrom(h._currentMeasure),h._currentMeasure.copyFrom(e),h._measure(),this._isVertical?(h.top=o+"px",h._top.ignoreAdaptiveScaling||h._markAsDirty(),h._top.ignoreAdaptiveScaling=!0,o+=h._currentMeasure.height,h._currentMeasure.width>r&&(r=h._currentMeasure.width),h.verticalAlignment=s.Control.VERTICAL_ALIGNMENT_TOP):(h.left=r+"px",h._left.ignoreAdaptiveScaling||h._markAsDirty(),h._left.ignoreAdaptiveScaling=!0,r+=h._currentMeasure.width,h._currentMeasure.height>o&&(o=h._currentMeasure.height),h.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT),h._currentMeasure.copyFrom(this._tempMeasureStore)}this._doNotTrackManualChanges=!0;var l,u,c=this.height,_=this.width;this._manualHeight||(this.height=o+"px"),this._manualWidth||(this.width=r+"px"),l=_!==this.width||!this._width.ignoreAdaptiveScaling,(u=c!==this.height||!this._height.ignoreAdaptiveScaling)&&(this._height.ignoreAdaptiveScaling=!0),l&&(this._width.ignoreAdaptiveScaling=!0),this._doNotTrackManualChanges=!1,(l||u)&&this._markAllAsDirty(),t.prototype._preMeasure.call(this,e,i)},e}(o.Container);e.StackPanel=a},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(3),n=i(0),s=function(t){function e(){var e=t.call(this)||this;return e._columns=10,e._rows=0,e._rowThenColum=!0,e._orientation=o.Container3D.FACEORIGIN_ORIENTATION,e.margin=0,e}return r(e,t),Object.defineProperty(e.prototype,"orientation",{get:function(){return this._orientation},set:function(t){var e=this;this._orientation!==t&&(this._orientation=t,n.Tools.SetImmediate(function(){e._arrangeChildren()}))},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"columns",{get:function(){return this._columns},set:function(t){var e=this;this._columns!==t&&(this._columns=t,this._rowThenColum=!0,n.Tools.SetImmediate(function(){e._arrangeChildren()}))},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"rows",{get:function(){return this._rows},set:function(t){var e=this;this._rows!==t&&(this._rows=t,this._rowThenColum=!1,n.Tools.SetImmediate(function(){e._arrangeChildren()}))},enumerable:!0,configurable:!0}),e.prototype._arrangeChildren=function(){this._cellWidth=0,this._cellHeight=0;for(var t=0,e=0,i=0,r=n.Matrix.Invert(this.node.computeWorldMatrix(!0)),o=0,s=this._children;o<s.length;o++){if((b=s[o]).mesh){i++,b.mesh.computeWorldMatrix(!0);var a=b.mesh.getHierarchyBoundingVectors(),h=n.Tmp.Vector3[0],l=n.Tmp.Vector3[1];a.max.subtractToRef(a.min,l),l.scaleInPlace(.5),n.Vector3.TransformNormalToRef(l,r,h),this._cellWidth=Math.max(this._cellWidth,2*h.x),this._cellHeight=Math.max(this._cellHeight,2*h.y)}}this._cellWidth+=2*this.margin,this._cellHeight+=2*this.margin,this._rowThenColum?(e=this._columns,t=Math.ceil(i/this._columns)):(t=this._rows,e=Math.ceil(i/this._rows));var u=.5*e*this._cellWidth,c=.5*t*this._cellHeight,_=[],f=0;if(this._rowThenColum)for(var p=0;p<t;p++)for(var d=0;d<e&&(_.push(new n.Vector3(d*this._cellWidth-u+this._cellWidth/2,p*this._cellHeight-c+this._cellHeight/2,0)),!(++f>i));d++);else for(d=0;d<e;d++)for(p=0;p<t&&(_.push(new n.Vector3(d*this._cellWidth-u+this._cellWidth/2,p*this._cellHeight-c+this._cellHeight/2,0)),!(++f>i));p++);f=0;for(var y=0,g=this._children;y<g.length;y++){var b;(b=g[y]).mesh&&(this._mapGridNode(b,_[f]),f++)}this._finalProcessing()},e.prototype._finalProcessing=function(){},e}(o.Container3D);e.VolumeBasedPanel=s},function(t,e,i){"use strict";function r(t){for(var i in t)e.hasOwnProperty(i)||(e[i]=t[i])}Object.defineProperty(e,"__esModule",{value:!0}),r(i(17)),r(i(19)),r(i(31)),r(i(4)),r(i(1)),r(i(32)),r(i(33)),r(i(11)),r(i(20)),r(i(34)),r(i(35)),r(i(36)),r(i(22)),r(i(7)),r(i(37)),r(i(6)),r(i(38)),r(i(10)),r(i(39)),r(i(12)),r(i(23)),r(i(40)),r(i(41))},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._thickness=1,i._cornerRadius=0,i}return r(e,t),Object.defineProperty(e.prototype,"thickness",{get:function(){return this._thickness},set:function(t){this._thickness!==t&&(this._thickness=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"cornerRadius",{get:function(){return this._cornerRadius},set:function(t){t<0&&(t=0),this._cornerRadius!==t&&(this._cornerRadius=t,this._markAsDirty())},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"Rectangle"},e.prototype._localDraw=function(t){t.save(),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(t.shadowColor=this.shadowColor,t.shadowBlur=this.shadowBlur,t.shadowOffsetX=this.shadowOffsetX,t.shadowOffsetY=this.shadowOffsetY),this._background&&(t.fillStyle=this._background,this._cornerRadius?(this._drawRoundedRect(t,this._thickness/2),t.fill()):t.fillRect(this._currentMeasure.left,this._currentMeasure.top,this._currentMeasure.width,this._currentMeasure.height)),this._thickness&&((this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(t.shadowBlur=0,t.shadowOffsetX=0,t.shadowOffsetY=0),this.color&&(t.strokeStyle=this.color),t.lineWidth=this._thickness,this._cornerRadius?(this._drawRoundedRect(t,this._thickness/2),t.stroke()):t.strokeRect(this._currentMeasure.left+this._thickness/2,this._currentMeasure.top+this._thickness/2,this._currentMeasure.width-this._thickness,this._currentMeasure.height-this._thickness)),t.restore()},e.prototype._additionalProcessing=function(e,i){t.prototype._additionalProcessing.call(this,e,i),this._measureForChildren.width-=2*this._thickness,this._measureForChildren.height-=2*this._thickness,this._measureForChildren.left+=this._thickness,this._measureForChildren.top+=this._thickness},e.prototype._drawRoundedRect=function(t,e){void 0===e&&(e=0);var i=this._currentMeasure.left+e,r=this._currentMeasure.top+e,o=this._currentMeasure.width-2*e,n=this._currentMeasure.height-2*e,s=Math.min(n/2-2,Math.min(o/2-2,this._cornerRadius));t.beginPath(),t.moveTo(i+s,r),t.lineTo(i+o-s,r),t.quadraticCurveTo(i+o,r,i+o,r+s),t.lineTo(i+o,r+n-s),t.quadraticCurveTo(i+o,r+n,i+o-s,r+n),t.lineTo(i+s,r+n),t.quadraticCurveTo(i,r+n,i,r+n-s),t.lineTo(i,r+s),t.quadraticCurveTo(i,r,i+s,r),t.closePath()},e.prototype._clipForChildren=function(t){this._cornerRadius&&(this._drawRoundedRect(t,this._thickness),t.clip())},e}(i(4).Container);e.Rectangle=o},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(1),n=i(0),s=function(t){function e(i,r){void 0===r&&(r=null);var o=t.call(this,i)||this;return o.name=i,o._loaded=!1,o._stretch=e.STRETCH_FILL,o._autoScale=!1,o._sourceLeft=0,o._sourceTop=0,o._sourceWidth=0,o._sourceHeight=0,o._cellWidth=0,o._cellHeight=0,o._cellId=-1,o.onImageLoadedObservable=new n.Observable,o.source=r,o}return r(e,t),Object.defineProperty(e.prototype,"isLoaded",{get:function(){return this._loaded},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"sourceLeft",{get:function(){return this._sourceLeft},set:function(t){this._sourceLeft!==t&&(this._sourceLeft=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"sourceTop",{get:function(){return this._sourceTop},set:function(t){this._sourceTop!==t&&(this._sourceTop=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"sourceWidth",{get:function(){return this._sourceWidth},set:function(t){this._sourceWidth!==t&&(this._sourceWidth=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"sourceHeight",{get:function(){return this._sourceHeight},set:function(t){this._sourceHeight!==t&&(this._sourceHeight=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"autoScale",{get:function(){return this._autoScale},set:function(t){this._autoScale!==t&&(this._autoScale=t,t&&this._loaded&&this.synchronizeSizeWithContent())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"stretch",{get:function(){return this._stretch},set:function(t){this._stretch!==t&&(this._stretch=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"domImage",{get:function(){return this._domImage},set:function(t){var e=this;this._domImage=t,this._loaded=!1,this._domImage.width?this._onImageLoaded():this._domImage.onload=function(){e._onImageLoaded()}},enumerable:!0,configurable:!0}),e.prototype._onImageLoaded=function(){this._imageWidth=this._domImage.width,this._imageHeight=this._domImage.height,this._loaded=!0,this._autoScale&&this.synchronizeSizeWithContent(),this.onImageLoadedObservable.notifyObservers(this),this._markAsDirty()},Object.defineProperty(e.prototype,"source",{set:function(t){var e=this;this._source!==t&&(this._loaded=!1,this._source=t,this._domImage=document.createElement("img"),this._domImage.onload=function(){e._onImageLoaded()},t&&(n.Tools.SetCorsBehavior(t,this._domImage),this._domImage.src=t))},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"cellWidth",{get:function(){return this._cellWidth},set:function(t){this._cellWidth!==t&&(this._cellWidth=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"cellHeight",{get:function(){return this._cellHeight},set:function(t){this._cellHeight!==t&&(this._cellHeight=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"cellId",{get:function(){return this._cellId},set:function(t){this._cellId!==t&&(this._cellId=t,this._markAsDirty())},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"Image"},e.prototype.synchronizeSizeWithContent=function(){this._loaded&&(this.width=this._domImage.width+"px",this.height=this._domImage.height+"px")},e.prototype._draw=function(t,i){var r,o,n,s;if(i.save(),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(i.shadowColor=this.shadowColor,i.shadowBlur=this.shadowBlur,i.shadowOffsetX=this.shadowOffsetX,i.shadowOffsetY=this.shadowOffsetY),-1==this.cellId)r=this._sourceLeft,o=this._sourceTop,n=this._sourceWidth?this._sourceWidth:this._imageWidth,s=this._sourceHeight?this._sourceHeight:this._imageHeight;else{var a=this._domImage.naturalWidth/this.cellWidth,h=this.cellId/a>>0,l=this.cellId%a;r=this.cellWidth*l,o=this.cellHeight*h,n=this.cellWidth,s=this.cellHeight}if(this._applyStates(i),this._processMeasures(t,i)&&this._loaded)switch(this._stretch){case e.STRETCH_NONE:case e.STRETCH_FILL:i.drawImage(this._domImage,r,o,n,s,this._currentMeasure.left,this._currentMeasure.top,this._currentMeasure.width,this._currentMeasure.height);break;case e.STRETCH_UNIFORM:var u=this._currentMeasure.width/n,c=this._currentMeasure.height/s,_=Math.min(u,c),f=(this._currentMeasure.width-n*_)/2,p=(this._currentMeasure.height-s*_)/2;i.drawImage(this._domImage,r,o,n,s,this._currentMeasure.left+f,this._currentMeasure.top+p,n*_,s*_);break;case e.STRETCH_EXTEND:i.drawImage(this._domImage,r,o,n,s,this._currentMeasure.left,this._currentMeasure.top,this._currentMeasure.width,this._currentMeasure.height),this._autoScale&&this.synchronizeSizeWithContent(),this._root&&this._root.parent&&(this._root.width=this.width,this._root.height=this.height)}i.restore()},e.prototype.dispose=function(){t.prototype.dispose.call(this),this.onImageLoadedObservable.clear()},e.STRETCH_NONE=0,e.STRETCH_FILL=1,e.STRETCH_UNIFORM=2,e.STRETCH_EXTEND=3,e}(o.Control);e.Image=s},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(1),n=i(2),s=i(0),a=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._thumbWidth=new n.ValueAndUnit(20,n.ValueAndUnit.UNITMODE_PIXEL,!1),i._minimum=0,i._maximum=100,i._value=50,i._isVertical=!1,i._barOffset=new n.ValueAndUnit(5,n.ValueAndUnit.UNITMODE_PIXEL,!1),i._isThumbClamped=!1,i._displayThumb=!0,i._effectiveBarOffset=0,i.onValueChangedObservable=new s.Observable,i._pointerIsDown=!1,i.isPointerBlocker=!0,i}return r(e,t),Object.defineProperty(e.prototype,"displayThumb",{get:function(){return this._displayThumb},set:function(t){this._displayThumb!==t&&(this._displayThumb=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"barOffset",{get:function(){return this._barOffset.toString(this._host)},set:function(t){this._barOffset.toString(this._host)!==t&&this._barOffset.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"barOffsetInPixels",{get:function(){return this._barOffset.getValueInPixel(this._host,this._cachedParentMeasure.width)},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"thumbWidth",{get:function(){return this._thumbWidth.toString(this._host)},set:function(t){this._thumbWidth.toString(this._host)!==t&&this._thumbWidth.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"thumbWidthInPixels",{get:function(){return this._thumbWidth.getValueInPixel(this._host,this._cachedParentMeasure.width)},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"minimum",{get:function(){return this._minimum},set:function(t){this._minimum!==t&&(this._minimum=t,this._markAsDirty(),this.value=Math.max(Math.min(this.value,this._maximum),this._minimum))},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"maximum",{get:function(){return this._maximum},set:function(t){this._maximum!==t&&(this._maximum=t,this._markAsDirty(),this.value=Math.max(Math.min(this.value,this._maximum),this._minimum))},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"value",{get:function(){return this._value},set:function(t){t=Math.max(Math.min(t,this._maximum),this._minimum),this._value!==t&&(this._value=t,this._markAsDirty(),this.onValueChangedObservable.notifyObservers(this._value))},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"isVertical",{get:function(){return this._isVertical},set:function(t){this._isVertical!==t&&(this._isVertical=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"isThumbClamped",{get:function(){return this._isThumbClamped},set:function(t){this._isThumbClamped!==t&&(this._isThumbClamped=t,this._markAsDirty())},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"BaseSlider"},e.prototype._getThumbPosition=function(){return this.isVertical?(this.maximum-this.value)/(this.maximum-this.minimum)*this._backgroundBoxLength:(this.value-this.minimum)/(this.maximum-this.minimum)*this._backgroundBoxLength},e.prototype._getThumbThickness=function(t){var e=0;switch(t){case"circle":e=this._thumbWidth.isPixel?Math.max(this._thumbWidth.getValue(this._host),this._backgroundBoxThickness):this._backgroundBoxThickness*this._thumbWidth.getValue(this._host);break;case"rectangle":e=this._thumbWidth.isPixel?Math.min(this._thumbWidth.getValue(this._host),this._backgroundBoxThickness):this._backgroundBoxThickness*this._thumbWidth.getValue(this._host)}return e},e.prototype._prepareRenderingData=function(t){this._effectiveBarOffset=0,this._renderLeft=this._currentMeasure.left,this._renderTop=this._currentMeasure.top,this._renderWidth=this._currentMeasure.width,this._renderHeight=this._currentMeasure.height,this._backgroundBoxLength=Math.max(this._currentMeasure.width,this._currentMeasure.height),this._backgroundBoxThickness=Math.min(this._currentMeasure.width,this._currentMeasure.height),this._effectiveThumbThickness=this._getThumbThickness(t),this.displayThumb&&(this._backgroundBoxLength-=this._effectiveThumbThickness),this.isVertical&&this._currentMeasure.height<this._currentMeasure.width?console.error("Height should be greater than width"):(this._barOffset.isPixel?this._effectiveBarOffset=Math.min(this._barOffset.getValue(this._host),this._backgroundBoxThickness):this._effectiveBarOffset=this._backgroundBoxThickness*this._barOffset.getValue(this._host),this._backgroundBoxThickness-=2*this._effectiveBarOffset,this.isVertical?(this._renderLeft+=this._effectiveBarOffset,!this.isThumbClamped&&this.displayThumb&&(this._renderTop+=this._effectiveThumbThickness/2),this._renderHeight=this._backgroundBoxLength,this._renderWidth=this._backgroundBoxThickness):(this._renderTop+=this._effectiveBarOffset,!this.isThumbClamped&&this.displayThumb&&(this._renderLeft+=this._effectiveThumbThickness/2),this._renderHeight=this._backgroundBoxThickness,this._renderWidth=this._backgroundBoxLength))},e.prototype._updateValueFromPointer=function(t,e){0!=this.rotation&&(this._invertTransformMatrix.transformCoordinates(t,e,this._transformedPosition),t=this._transformedPosition.x,e=this._transformedPosition.y),this._isVertical?this.value=this._minimum+(1-(e-this._currentMeasure.top)/this._currentMeasure.height)*(this._maximum-this._minimum):this.value=this._minimum+(t-this._currentMeasure.left)/this._currentMeasure.width*(this._maximum-this._minimum)},e.prototype._onPointerDown=function(e,i,r,o){return!!t.prototype._onPointerDown.call(this,e,i,r,o)&&(this._pointerIsDown=!0,this._updateValueFromPointer(i.x,i.y),this._host._capturingControl[r]=this,!0)},e.prototype._onPointerMove=function(e,i){this._pointerIsDown&&this._updateValueFromPointer(i.x,i.y),t.prototype._onPointerMove.call(this,e,i)},e.prototype._onPointerUp=function(e,i,r,o,n){this._pointerIsDown=!1,delete this._host._capturingControl[r],t.prototype._onPointerUp.call(this,e,i,r,o,n)},e}(o.Control);e.BaseSlider=a},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(0),n=i(4),s=i(24),a=i(5),h=function(t){function e(e,i,r,s,a,h){void 0===i&&(i=0),void 0===r&&(r=0),void 0===a&&(a=!1),void 0===h&&(h=o.Texture.NEAREST_SAMPLINGMODE);var l=t.call(this,e,{width:i,height:r},s,a,h,o.Engine.TEXTUREFORMAT_RGBA)||this;return l._isDirty=!1,l._rootContainer=new n.Container("root"),l._lastControlOver={},l._lastControlDown={},l._capturingControl={},l._linkedControls=new Array,l._isFullscreen=!1,l._fullscreenViewport=new o.Viewport(0,0,1,1),l._idealWidth=0,l._idealHeight=0,l._useSmallestIdeal=!1,l._renderAtIdealSize=!1,l._blockNextFocusCheck=!1,l._renderScale=1,l.premulAlpha=!1,(s=l.getScene())&&l._texture?(l._rootCanvas=s.getEngine().getRenderingCanvas(),l._renderObserver=s.onBeforeCameraRenderObservable.add(function(t){return l._checkUpdate(t)}),l._preKeyboardObserver=s.onPreKeyboardObservable.add(function(t){l._focusedControl&&(t.type===o.KeyboardEventTypes.KEYDOWN&&l._focusedControl.processKeyboard(t.event),t.skipOnPointerObservable=!0)}),l._rootContainer._link(null,l),l.hasAlpha=!0,i&&r||(l._resizeObserver=s.getEngine().onResizeObservable.add(function(){return l._onResize()}),l._onResize()),l._texture.isReady=!0,l):l}return r(e,t),Object.defineProperty(e.prototype,"renderScale",{get:function(){return this._renderScale},set:function(t){t!==this._renderScale&&(this._renderScale=t,this._onResize())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"background",{get:function(){return this._background},set:function(t){this._background!==t&&(this._background=t,this.markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"idealWidth",{get:function(){return this._idealWidth},set:function(t){this._idealWidth!==t&&(this._idealWidth=t,this.markAsDirty(),this._rootContainer._markAllAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"idealHeight",{get:function(){return this._idealHeight},set:function(t){this._idealHeight!==t&&(this._idealHeight=t,this.markAsDirty(),this._rootContainer._markAllAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"useSmallestIdeal",{get:function(){return this._useSmallestIdeal},set:function(t){this._useSmallestIdeal!==t&&(this._useSmallestIdeal=t,this.markAsDirty(),this._rootContainer._markAllAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"renderAtIdealSize",{get:function(){return this._renderAtIdealSize},set:function(t){this._renderAtIdealSize!==t&&(this._renderAtIdealSize=t,this._onResize())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"layer",{get:function(){return this._layerToDispose},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"rootContainer",{get:function(){return this._rootContainer},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"focusedControl",{get:function(){return this._focusedControl},set:function(t){this._focusedControl!=t&&(this._focusedControl&&this._focusedControl.onBlur(),t&&t.onFocus(),this._focusedControl=t)},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"isForeground",{get:function(){return!this.layer||!this.layer.isBackground},set:function(t){this.layer&&this.layer.isBackground!==!t&&(this.layer.isBackground=!t)},enumerable:!0,configurable:!0}),e.prototype.executeOnAllControls=function(t,e){e||(e=this._rootContainer),t(e);for(var i=0,r=e.children;i<r.length;i++){var o=r[i];o.children?this.executeOnAllControls(t,o):t(o)}},e.prototype.markAsDirty=function(){this._isDirty=!0},e.prototype.createStyle=function(){return new s.Style(this)},e.prototype.addControl=function(t){return this._rootContainer.addControl(t),this},e.prototype.removeControl=function(t){return this._rootContainer.removeControl(t),this},e.prototype.dispose=function(){var e=this.getScene();e&&(this._rootCanvas=null,e.onBeforeCameraRenderObservable.remove(this._renderObserver),this._resizeObserver&&e.getEngine().onResizeObservable.remove(this._resizeObserver),this._pointerMoveObserver&&e.onPrePointerObservable.remove(this._pointerMoveObserver),this._pointerObserver&&e.onPointerObservable.remove(this._pointerObserver),this._preKeyboardObserver&&e.onPreKeyboardObservable.remove(this._preKeyboardObserver),this._canvasPointerOutObserver&&e.getEngine().onCanvasPointerOutObservable.remove(this._canvasPointerOutObserver),this._layerToDispose&&(this._layerToDispose.texture=null,this._layerToDispose.dispose(),this._layerToDispose=null),this._rootContainer.dispose(),t.prototype.dispose.call(this))},e.prototype._onResize=function(){var t=this.getScene();if(t){var e=t.getEngine(),i=this.getSize(),r=e.getRenderWidth()*this._renderScale,o=e.getRenderHeight()*this._renderScale;this._renderAtIdealSize&&(this._idealWidth?(o=o*this._idealWidth/r,r=this._idealWidth):this._idealHeight&&(r=r*this._idealHeight/o,o=this._idealHeight)),i.width===r&&i.height===o||(this.scaleTo(r,o),this.markAsDirty(),(this._idealWidth||this._idealHeight)&&this._rootContainer._markAllAsDirty())}},e.prototype._getGlobalViewport=function(t){var e=t.getEngine();return this._fullscreenViewport.toGlobal(e.getRenderWidth(),e.getRenderHeight())},e.prototype.getProjectedPosition=function(t,e){var i=this.getScene();if(!i)return o.Vector2.Zero();var r=this._getGlobalViewport(i),n=o.Vector3.Project(t,e,i.getTransformMatrix(),r);return n.scaleInPlace(this.renderScale),new o.Vector2(n.x,n.y)},e.prototype._checkUpdate=function(t){if(!this._layerToDispose||0!=(t.layerMask&this._layerToDispose.layerMask)){if(this._isFullscreen&&this._linkedControls.length){var e=this.getScene();if(!e)return;for(var i=this._getGlobalViewport(e),r=0,n=this._linkedControls;r<n.length;r++){var s=n[r];if(s.isVisible){var a=s._linkedMesh;if(a&&!a.isDisposed()){var h=a.getBoundingInfo().boundingSphere.center,l=o.Vector3.Project(h,a.getWorldMatrix(),e.getTransformMatrix(),i);l.z<0||l.z>1?s.notRenderable=!0:(s.notRenderable=!1,l.scaleInPlace(this.renderScale),s._moveToProjectedPosition(l))}else o.Tools.SetImmediate(function(){s.linkWithMesh(null)})}}}(this._isDirty||this._rootContainer.isDirty)&&(this._isDirty=!1,this._render(),this.update(!0,this.premulAlpha))}},e.prototype._render=function(){var t=this.getSize(),e=t.width,i=t.height,r=this.getContext();r.clearRect(0,0,e,i),this._background&&(r.save(),r.fillStyle=this._background,r.fillRect(0,0,e,i),r.restore()),r.font="18px Arial",r.strokeStyle="white";var o=new a.Measure(0,0,e,i);this._rootContainer._draw(o,r)},e.prototype._changeCursor=function(t){this._rootCanvas&&(this._rootCanvas.style.cursor=t)},e.prototype._doPicking=function(t,e,i,r,n){var s=this.getScene();if(s){var a=s.getEngine(),h=this.getSize();this._isFullscreen&&(t*=h.width/a.getRenderWidth(),e*=h.height/a.getRenderHeight()),this._capturingControl[r]?this._capturingControl[r]._processObservables(i,t,e,r,n):(this._rootContainer._processPicking(t,e,i,r,n)||(this._changeCursor(""),i===o.PointerEventTypes.POINTERMOVE&&(this._lastControlOver[r]&&this._lastControlOver[r]._onPointerOut(this._lastControlOver[r]),delete this._lastControlOver[r])),this._manageFocus())}},e.prototype._cleanControlAfterRemovalFromList=function(t,e){for(var i in t){if(t.hasOwnProperty(i))t[i]===e&&delete t[i]}},e.prototype._cleanControlAfterRemoval=function(t){this._cleanControlAfterRemovalFromList(this._lastControlDown,t),this._cleanControlAfterRemovalFromList(this._lastControlOver,t)},e.prototype.attach=function(){var t=this,e=this.getScene();e&&(this._pointerMoveObserver=e.onPrePointerObservable.add(function(i,r){if(!e.isPointerCaptured(i.event.pointerId)&&(i.type===o.PointerEventTypes.POINTERMOVE||i.type===o.PointerEventTypes.POINTERUP||i.type===o.PointerEventTypes.POINTERDOWN)&&e){var n=e.cameraToUseForPointers||e.activeCamera;if(n){var s=e.getEngine(),a=n.viewport,h=(e.pointerX/s.getHardwareScalingLevel()-a.x*s.getRenderWidth())/a.width,l=(e.pointerY/s.getHardwareScalingLevel()-a.y*s.getRenderHeight())/a.height;t._shouldBlockPointer=!1,t._doPicking(h,l,i.type,i.event.pointerId||0,i.event.button),t._shouldBlockPointer&&(i.skipOnPointerObservable=t._shouldBlockPointer)}}}),this._attachToOnPointerOut(e))},e.prototype.attachToMesh=function(t,e){var i=this;void 0===e&&(e=!0);var r=this.getScene();r&&(this._pointerObserver=r.onPointerObservable.add(function(e,r){if(e.type===o.PointerEventTypes.POINTERMOVE||e.type===o.PointerEventTypes.POINTERUP||e.type===o.PointerEventTypes.POINTERDOWN){var n=e.event.pointerId||0;if(e.pickInfo&&e.pickInfo.hit&&e.pickInfo.pickedMesh===t){var s=e.pickInfo.getTextureCoordinates();if(s){var a=i.getSize();i._doPicking(s.x*a.width,(1-s.y)*a.height,e.type,n,e.event.button)}}else if(e.type===o.PointerEventTypes.POINTERUP){if(i._lastControlDown[n]&&i._lastControlDown[n]._forcePointerUp(n),delete i._lastControlDown[n],i.focusedControl){var h=i.focusedControl.keepsFocusWith(),l=!0;if(h)for(var u=0,c=h;u<c.length;u++){var _=c[u];if(i!==_._host){var f=_._host;if(f._lastControlOver[n]&&f._lastControlOver[n].isAscendant(_)){l=!1;break}}}l&&(i.focusedControl=null)}}else e.type===o.PointerEventTypes.POINTERMOVE&&(i._lastControlOver[n]&&i._lastControlOver[n]._onPointerOut(i._lastControlOver[n]),delete i._lastControlOver[n])}}),t.enablePointerMoveEvents=e,this._attachToOnPointerOut(r))},e.prototype.moveFocusToControl=function(t){this.focusedControl=t,this._lastPickedControl=t,this._blockNextFocusCheck=!0},e.prototype._manageFocus=function(){if(this._blockNextFocusCheck)return this._blockNextFocusCheck=!1,void(this._lastPickedControl=this._focusedControl);if(this._focusedControl&&this._focusedControl!==this._lastPickedControl){if(this._lastPickedControl.isFocusInvisible)return;this.focusedControl=null}},e.prototype._attachToOnPointerOut=function(t){var e=this;this._canvasPointerOutObserver=t.getEngine().onCanvasPointerOutObservable.add(function(t){e._lastControlOver[t.pointerId]&&e._lastControlOver[t.pointerId]._onPointerOut(e._lastControlOver[t.pointerId]),delete e._lastControlOver[t.pointerId],e._lastControlDown[t.pointerId]&&e._lastControlDown[t.pointerId]._forcePointerUp(),delete e._lastControlDown[t.pointerId]})},e.CreateForMesh=function(t,i,r,n,s){void 0===i&&(i=1024),void 0===r&&(r=1024),void 0===n&&(n=!0),void 0===s&&(s=!1);var a=new e(t.name+" AdvancedDynamicTexture",i,r,t.getScene(),!0,o.Texture.TRILINEAR_SAMPLINGMODE),h=new o.StandardMaterial("AdvancedDynamicTextureMaterial",t.getScene());return h.backFaceCulling=!1,h.diffuseColor=o.Color3.Black(),h.specularColor=o.Color3.Black(),s?(h.diffuseTexture=a,h.emissiveTexture=a,a.hasAlpha=!0):(h.emissiveTexture=a,h.opacityTexture=a),t.material=h,a.attachToMesh(t,n),a},e.CreateFullscreenUI=function(t,i,r,n){void 0===i&&(i=!0),void 0===r&&(r=null),void 0===n&&(n=o.Texture.BILINEAR_SAMPLINGMODE);var s=new e(t,0,0,r,!1,n),a=new o.Layer(t+"_layer",null,r,!i);return a.texture=s,s._layerToDispose=a,s._isFullscreen=!0,s.attach(),s},e}(o.DynamicTexture);e.AdvancedDynamicTexture=h},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=i(0),o=i(26),n=function(){function t(t){this.name=t,this._downCount=0,this._enterCount=-1,this._downPointerIds={},this._isVisible=!0,this.onPointerMoveObservable=new r.Observable,this.onPointerOutObservable=new r.Observable,this.onPointerDownObservable=new r.Observable,this.onPointerUpObservable=new r.Observable,this.onPointerClickObservable=new r.Observable,this.onPointerEnterObservable=new r.Observable,this._behaviors=new Array}return Object.defineProperty(t.prototype,"position",{get:function(){return this._node?this._node.position:r.Vector3.Zero()},set:function(t){this._node&&(this._node.position=t)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"scaling",{get:function(){return this._node?this._node.scaling:new r.Vector3(1,1,1)},set:function(t){this._node&&(this._node.scaling=t)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"behaviors",{get:function(){return this._behaviors},enumerable:!0,configurable:!0}),t.prototype.addBehavior=function(t){var e=this;if(-1!==this._behaviors.indexOf(t))return this;t.init();var i=this._host.scene;return i.isLoading?i.onDataLoadedObservable.addOnce(function(){t.attach(e)}):t.attach(this),this._behaviors.push(t),this},t.prototype.removeBehavior=function(t){var e=this._behaviors.indexOf(t);return-1===e?this:(this._behaviors[e].detach(),this._behaviors.splice(e,1),this)},t.prototype.getBehaviorByName=function(t){for(var e=0,i=this._behaviors;e<i.length;e++){var r=i[e];if(r.name===t)return r}return null},Object.defineProperty(t.prototype,"isVisible",{get:function(){return this._isVisible},set:function(t){if(this._isVisible!==t){this._isVisible=t;var e=this.mesh;e&&e.setEnabled(t)}},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"typeName",{get:function(){return this._getTypeName()},enumerable:!0,configurable:!0}),t.prototype._getTypeName=function(){return"Control3D"},Object.defineProperty(t.prototype,"node",{get:function(){return this._node},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"mesh",{get:function(){return this._node instanceof r.AbstractMesh?this._node:null},enumerable:!0,configurable:!0}),t.prototype.linkToTransformNode=function(t){return this._node&&(this._node.parent=t),this},t.prototype._prepareNode=function(t){if(!this._node){if(this._node=this._createNode(t),!this.node)return;this._node.metadata=this,this._node.position=this.position,this._node.scaling=this.scaling;var e=this.mesh;e&&(e.isPickable=!0,this._affectMaterial(e))}},t.prototype._createNode=function(t){return null},t.prototype._affectMaterial=function(t){t.material=null},t.prototype._onPointerMove=function(t,e){this.onPointerMoveObservable.notifyObservers(e,-1,t,this)},t.prototype._onPointerEnter=function(t){return!(this._enterCount>0)&&(-1===this._enterCount&&(this._enterCount=0),this._enterCount++,this.onPointerEnterObservable.notifyObservers(this,-1,t,this),this.pointerEnterAnimation&&this.pointerEnterAnimation(),!0)},t.prototype._onPointerOut=function(t){this._enterCount=0,this.onPointerOutObservable.notifyObservers(this,-1,t,this),this.pointerOutAnimation&&this.pointerOutAnimation()},t.prototype._onPointerDown=function(t,e,i,r){return 0===this._downCount&&(this._downCount++,this._downPointerIds[i]=!0,this.onPointerDownObservable.notifyObservers(new o.Vector3WithInfo(e,r),-1,t,this),this.pointerDownAnimation&&this.pointerDownAnimation(),!0)},t.prototype._onPointerUp=function(t,e,i,r,n){this._downCount=0,delete this._downPointerIds[i],n&&(this._enterCount>0||-1===this._enterCount)&&this.onPointerClickObservable.notifyObservers(new o.Vector3WithInfo(e,r),-1,t,this),this.onPointerUpObservable.notifyObservers(new o.Vector3WithInfo(e,r),-1,t,this),this.pointerUpAnimation&&this.pointerUpAnimation()},t.prototype.forcePointerUp=function(t){if(void 0===t&&(t=null),null!==t)this._onPointerUp(this,r.Vector3.Zero(),t,0,!0);else for(var e in this._downPointerIds)this._onPointerUp(this,r.Vector3.Zero(),+e,0,!0)},t.prototype._processObservables=function(t,e,i,o){if(t===r.PointerEventTypes.POINTERMOVE){this._onPointerMove(this,e);var n=this._host._lastControlOver[i];return n&&n!==this&&n._onPointerOut(this),n!==this&&this._onPointerEnter(this),this._host._lastControlOver[i]=this,!0}return t===r.PointerEventTypes.POINTERDOWN?(this._onPointerDown(this,e,i,o),this._host._lastControlDown[i]=this,this._host._lastPickedControl=this,!0):t===r.PointerEventTypes.POINTERUP&&(this._host._lastControlDown[i]&&this._host._lastControlDown[i]._onPointerUp(this,e,i,o,!0),delete this._host._lastControlDown[i],!0)},t.prototype._disposeNode=function(){this._node&&(this._node.dispose(),this._node=null)},t.prototype.dispose=function(){this.onPointerDownObservable.clear(),this.onPointerEnterObservable.clear(),this.onPointerMoveObservable.clear(),this.onPointerOutObservable.clear(),this.onPointerUpObservable.clear(),this.onPointerClickObservable.clear(),this._disposeNode();for(var t=0,e=this._behaviors;t<e.length;t++){e[t].detach()}},t}();e.Control3D=n},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(25),n=i(0),s=i(13),a=function(t){function e(e){var i=t.call(this,e)||this;return i._contentResolution=512,i._contentScaleRatio=2,i.pointerEnterAnimation=function(){i.mesh&&(i._currentMaterial.emissiveColor=n.Color3.Red())},i.pointerOutAnimation=function(){i._currentMaterial.emissiveColor=n.Color3.Black()},i.pointerDownAnimation=function(){i.mesh&&i.mesh.scaling.scaleInPlace(.95)},i.pointerUpAnimation=function(){i.mesh&&i.mesh.scaling.scaleInPlace(1/.95)},i}return r(e,t),Object.defineProperty(e.prototype,"contentResolution",{get:function(){return this._contentResolution},set:function(t){this._contentResolution!==t&&(this._contentResolution=t,this._resetContent())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"contentScaleRatio",{get:function(){return this._contentScaleRatio},set:function(t){this._contentScaleRatio!==t&&(this._contentScaleRatio=t,this._resetContent())},enumerable:!0,configurable:!0}),e.prototype._disposeFacadeTexture=function(){this._facadeTexture&&(this._facadeTexture.dispose(),this._facadeTexture=null)},e.prototype._resetContent=function(){this._disposeFacadeTexture(),this.content=this._content},Object.defineProperty(e.prototype,"content",{get:function(){return this._content},set:function(t){this._content=t,this._host&&this._host.utilityLayer&&(this._facadeTexture||(this._facadeTexture=new s.AdvancedDynamicTexture("Facade",this._contentResolution,this._contentResolution,this._host.utilityLayer.utilityLayerScene,!0,n.Texture.TRILINEAR_SAMPLINGMODE),this._facadeTexture.rootContainer.scaleX=this._contentScaleRatio,this._facadeTexture.rootContainer.scaleY=this._contentScaleRatio,this._facadeTexture.premulAlpha=!0),this._facadeTexture.addControl(t),this._applyFacade(this._facadeTexture))},enumerable:!0,configurable:!0}),e.prototype._applyFacade=function(t){this._currentMaterial.emissiveTexture=t},e.prototype._getTypeName=function(){return"Button3D"},e.prototype._createNode=function(t){for(var e=new Array(6),i=0;i<6;i++)e[i]=new n.Vector4(0,0,0,0);return e[1]=new n.Vector4(0,0,1,1),n.MeshBuilder.CreateBox(this.name+"_rootMesh",{width:1,height:1,depth:.08,faceUV:e},t)},e.prototype._affectMaterial=function(t){var e=new n.StandardMaterial(this.name+"Material",t.getScene());e.specularColor=n.Color3.Black(),t.material=e,this._currentMaterial=e,this._resetContent()},e.prototype.dispose=function(){t.prototype.dispose.call(this),this._disposeFacadeTexture(),this._currentMaterial&&this._currentMaterial.dispose()},e}(o.AbstractButton3D);e.Button3D=a},function(t,e,i){"use strict";function r(t){for(var i in t)e.hasOwnProperty(i)||(e[i]=t[i])}Object.defineProperty(e,"__esModule",{value:!0}),r(i(30)),r(i(42))},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(10),n=i(1),s=i(6),a=i(11),h=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i.thickness=1,i.isPointerBlocker=!0,i.pointerEnterAnimation=function(){i.alpha-=.1},i.pointerOutAnimation=function(){i.alpha+=.1},i.pointerDownAnimation=function(){i.scaleX-=.05,i.scaleY-=.05},i.pointerUpAnimation=function(){i.scaleX+=.05,i.scaleY+=.05},i}return r(e,t),Object.defineProperty(e.prototype,"image",{get:function(){return this._image},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"textBlock",{get:function(){return this._textBlock},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"Button"},e.prototype._processPicking=function(e,i,r,o,n){return!(!this.isHitTestVisible||!this.isVisible||this.notRenderable)&&(!!t.prototype.contains.call(this,e,i)&&(this._processObservables(r,e,i,o,n),!0))},e.prototype._onPointerEnter=function(e){return!!t.prototype._onPointerEnter.call(this,e)&&(this.pointerEnterAnimation&&this.pointerEnterAnimation(),!0)},e.prototype._onPointerOut=function(e){this.pointerOutAnimation&&this.pointerOutAnimation(),t.prototype._onPointerOut.call(this,e)},e.prototype._onPointerDown=function(e,i,r,o){return!!t.prototype._onPointerDown.call(this,e,i,r,o)&&(this.pointerDownAnimation&&this.pointerDownAnimation(),!0)},e.prototype._onPointerUp=function(e,i,r,o,n){this.pointerUpAnimation&&this.pointerUpAnimation(),t.prototype._onPointerUp.call(this,e,i,r,o,n)},e.CreateImageButton=function(t,i,r){var o=new e(t),h=new s.TextBlock(t+"_button",i);h.textWrapping=!0,h.textHorizontalAlignment=n.Control.HORIZONTAL_ALIGNMENT_CENTER,h.paddingLeft="20%",o.addControl(h);var l=new a.Image(t+"_icon",r);return l.width="20%",l.stretch=a.Image.STRETCH_UNIFORM,l.horizontalAlignment=n.Control.HORIZONTAL_ALIGNMENT_LEFT,o.addControl(l),o._image=l,o._textBlock=h,o},e.CreateImageOnlyButton=function(t,i){var r=new e(t),o=new a.Image(t+"_icon",i);return o.stretch=a.Image.STRETCH_FILL,o.horizontalAlignment=n.Control.HORIZONTAL_ALIGNMENT_LEFT,r.addControl(o),r._image=o,r},e.CreateSimpleButton=function(t,i){var r=new e(t),o=new s.TextBlock(t+"_button",i);return o.textWrapping=!0,o.textHorizontalAlignment=n.Control.HORIZONTAL_ALIGNMENT_CENTER,r.addControl(o),r._textBlock=o,r},e.CreateImageWithCenterTextButton=function(t,i,r){var o=new e(t),h=new a.Image(t+"_icon",r);h.stretch=a.Image.STRETCH_FILL,o.addControl(h);var l=new s.TextBlock(t+"_button",i);return l.textWrapping=!0,l.textHorizontalAlignment=n.Control.HORIZONTAL_ALIGNMENT_CENTER,o.addControl(l),o._image=h,o._textBlock=l,o},e}(o.Rectangle);e.Button=h},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(0),n=function(t){function e(e,i){void 0===i&&(i=0);var r=t.call(this,e.x,e.y)||this;return r.buttonIndex=i,r}return r(e,t),e}(o.Vector2);e.Vector2WithInfo=n;var s=function(){function t(t,e,i,r,o,n){this.m=new Float32Array(6),this.fromValues(t,e,i,r,o,n)}return t.prototype.fromValues=function(t,e,i,r,o,n){return this.m[0]=t,this.m[1]=e,this.m[2]=i,this.m[3]=r,this.m[4]=o,this.m[5]=n,this},t.prototype.determinant=function(){return this.m[0]*this.m[3]-this.m[1]*this.m[2]},t.prototype.invertToRef=function(t){var e=this.m[0],i=this.m[1],r=this.m[2],n=this.m[3],s=this.m[4],a=this.m[5],h=this.determinant();if(h<o.Epsilon*o.Epsilon)return t.m[0]=0,t.m[1]=0,t.m[2]=0,t.m[3]=0,t.m[4]=0,t.m[5]=0,this;var l=1/h,u=r*a-n*s,c=i*s-e*a;return t.m[0]=n*l,t.m[1]=-i*l,t.m[2]=-r*l,t.m[3]=e*l,t.m[4]=u*l,t.m[5]=c*l,this},t.prototype.multiplyToRef=function(t,e){var i=this.m[0],r=this.m[1],o=this.m[2],n=this.m[3],s=this.m[4],a=this.m[5],h=t.m[0],l=t.m[1],u=t.m[2],c=t.m[3],_=t.m[4],f=t.m[5];return e.m[0]=i*h+r*u,e.m[1]=i*l+r*c,e.m[2]=o*h+n*u,e.m[3]=o*l+n*c,e.m[4]=s*h+a*u+_,e.m[5]=s*l+a*c+f,this},t.prototype.transformCoordinates=function(t,e,i){return i.x=t*this.m[0]+e*this.m[2]+this.m[4],i.y=t*this.m[1]+e*this.m[3]+this.m[5],this},t.Identity=function(){return new t(1,0,0,1,0,0)},t.TranslationToRef=function(t,e,i){i.fromValues(1,0,0,1,t,e)},t.ScalingToRef=function(t,e,i){i.fromValues(t,0,0,e,0,0)},t.RotationToRef=function(t,e){var i=Math.sin(t),r=Math.cos(t);e.fromValues(r,i,-i,r,0,0)},t.ComposeToRef=function(e,i,r,o,n,s,a){t.TranslationToRef(e,i,t._TempPreTranslationMatrix),t.ScalingToRef(o,n,t._TempScalingMatrix),t.RotationToRef(r,t._TempRotationMatrix),t.TranslationToRef(-e,-i,t._TempPostTranslationMatrix),t._TempPreTranslationMatrix.multiplyToRef(t._TempScalingMatrix,t._TempCompose0),t._TempCompose0.multiplyToRef(t._TempRotationMatrix,t._TempCompose1),s?(t._TempCompose1.multiplyToRef(t._TempPostTranslationMatrix,t._TempCompose2),t._TempCompose2.multiplyToRef(s,a)):t._TempCompose1.multiplyToRef(t._TempPostTranslationMatrix,a)},t._TempPreTranslationMatrix=t.Identity(),t._TempPostTranslationMatrix=t.Identity(),t._TempRotationMatrix=t.Identity(),t._TempScalingMatrix=t.Identity(),t._TempCompose0=t.Identity(),t._TempCompose1=t.Identity(),t._TempCompose2=t.Identity(),t}();e.Matrix2D=s},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(1),n=i(0),s=i(7),a=i(6),h=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._isChecked=!1,i._background="black",i._checkSizeRatio=.8,i._thickness=1,i.onIsCheckedChangedObservable=new n.Observable,i.isPointerBlocker=!0,i}return r(e,t),Object.defineProperty(e.prototype,"thickness",{get:function(){return this._thickness},set:function(t){this._thickness!==t&&(this._thickness=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"checkSizeRatio",{get:function(){return this._checkSizeRatio},set:function(t){t=Math.max(Math.min(1,t),0),this._checkSizeRatio!==t&&(this._checkSizeRatio=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"background",{get:function(){return this._background},set:function(t){this._background!==t&&(this._background=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"isChecked",{get:function(){return this._isChecked},set:function(t){this._isChecked!==t&&(this._isChecked=t,this._markAsDirty(),this.onIsCheckedChangedObservable.notifyObservers(t))},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"CheckBox"},e.prototype._draw=function(t,e){if(e.save(),this._applyStates(e),this._processMeasures(t,e)){var i=this._currentMeasure.width-this._thickness,r=this._currentMeasure.height-this._thickness;if((this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowColor=this.shadowColor,e.shadowBlur=this.shadowBlur,e.shadowOffsetX=this.shadowOffsetX,e.shadowOffsetY=this.shadowOffsetY),e.fillStyle=this._isEnabled?this._background:this._disabledColor,e.fillRect(this._currentMeasure.left+this._thickness/2,this._currentMeasure.top+this._thickness/2,i,r),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0),this._isChecked){e.fillStyle=this._isEnabled?this.color:this._disabledColor;var o=i*this._checkSizeRatio,n=r*this._checkSizeRatio;e.fillRect(this._currentMeasure.left+this._thickness/2+(i-o)/2,this._currentMeasure.top+this._thickness/2+(r-n)/2,o,n)}e.strokeStyle=this.color,e.lineWidth=this._thickness,e.strokeRect(this._currentMeasure.left+this._thickness/2,this._currentMeasure.top+this._thickness/2,i,r)}e.restore()},e.prototype._onPointerDown=function(e,i,r,o){return!!t.prototype._onPointerDown.call(this,e,i,r,o)&&(this.isChecked=!this.isChecked,!0)},e.AddCheckBoxWithHeader=function(t,i){var r=new s.StackPanel;r.isVertical=!1,r.height="30px";var n=new e;n.width="20px",n.height="20px",n.isChecked=!0,n.color="green",n.onIsCheckedChangedObservable.add(i),r.addControl(n);var h=new a.TextBlock;return h.text=t,h.width="180px",h.paddingLeft="5px",h.textHorizontalAlignment=o.Control.HORIZONTAL_ALIGNMENT_LEFT,h.color="white",r.addControl(h),r},e}(o.Control);e.Checkbox=h},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(1),n=i(2),s=i(0),a=function(t){function e(e,i){void 0===i&&(i="");var r=t.call(this,e)||this;return r.name=e,r._text="",r._placeholderText="",r._background="#222222",r._focusedBackground="#000000",r._placeholderColor="gray",r._thickness=1,r._margin=new n.ValueAndUnit(10,n.ValueAndUnit.UNITMODE_PIXEL),r._autoStretchWidth=!0,r._maxWidth=new n.ValueAndUnit(1,n.ValueAndUnit.UNITMODE_PERCENTAGE,!1),r._isFocused=!1,r._blinkIsEven=!1,r._cursorOffset=0,r._deadKey=!1,r._addKey=!0,r._currentKey="",r.promptMessage="Please enter text:",r.onTextChangedObservable=new s.Observable,r.onBeforeKeyAddObservable=new s.Observable,r.onFocusObservable=new s.Observable,r.onBlurObservable=new s.Observable,r.text=i,r}return r(e,t),Object.defineProperty(e.prototype,"maxWidth",{get:function(){return this._maxWidth.toString(this._host)},set:function(t){this._maxWidth.toString(this._host)!==t&&this._maxWidth.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"maxWidthInPixels",{get:function(){return this._maxWidth.getValueInPixel(this._host,this._cachedParentMeasure.width)},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"margin",{get:function(){return this._margin.toString(this._host)},set:function(t){this._margin.toString(this._host)!==t&&this._margin.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"marginInPixels",{get:function(){return this._margin.getValueInPixel(this._host,this._cachedParentMeasure.width)},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"autoStretchWidth",{get:function(){return this._autoStretchWidth},set:function(t){this._autoStretchWidth!==t&&(this._autoStretchWidth=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"thickness",{get:function(){return this._thickness},set:function(t){this._thickness!==t&&(this._thickness=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"focusedBackground",{get:function(){return this._focusedBackground},set:function(t){this._focusedBackground!==t&&(this._focusedBackground=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"background",{get:function(){return this._background},set:function(t){this._background!==t&&(this._background=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"placeholderColor",{get:function(){return this._placeholderColor},set:function(t){this._placeholderColor!==t&&(this._placeholderColor=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"placeholderText",{get:function(){return this._placeholderText},set:function(t){this._placeholderText!==t&&(this._placeholderText=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"deadKey",{get:function(){return this._deadKey},set:function(t){this._deadKey=t},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"addKey",{get:function(){return this._addKey},set:function(t){this._addKey=t},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"currentKey",{get:function(){return this._currentKey},set:function(t){this._currentKey=t},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"text",{get:function(){return this._text},set:function(t){this._text!==t&&(this._text=t,this._markAsDirty(),this.onTextChangedObservable.notifyObservers(this))},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"width",{get:function(){return this._width.toString(this._host)},set:function(t){this._width.toString(this._host)!==t&&(this._width.fromString(t)&&this._markAsDirty(),this.autoStretchWidth=!1)},enumerable:!0,configurable:!0}),e.prototype.onBlur=function(){this._isFocused=!1,this._scrollLeft=null,this._cursorOffset=0,clearTimeout(this._blinkTimeout),this._markAsDirty(),this.onBlurObservable.notifyObservers(this)},e.prototype.onFocus=function(){if(this._isEnabled&&(this._scrollLeft=null,this._isFocused=!0,this._blinkIsEven=!1,this._cursorOffset=0,this._markAsDirty(),this.onFocusObservable.notifyObservers(this),-1!==navigator.userAgent.indexOf("Mobile"))){var t=prompt(this.promptMessage);return null!==t&&(this.text=t),void(this._host.focusedControl=null)}},e.prototype._getTypeName=function(){return"InputText"},e.prototype.keepsFocusWith=function(){return this._connectedVirtualKeyboard?[this._connectedVirtualKeyboard]:null},e.prototype.processKey=function(t,e){switch(t){case 32:e=" ";break;case 8:if(this._text&&this._text.length>0)if(0===this._cursorOffset)this.text=this._text.substr(0,this._text.length-1);else(i=this._text.length-this._cursorOffset)>0&&(this.text=this._text.slice(0,i-1)+this._text.slice(i));return;case 46:if(this._text&&this._text.length>0){var i=this._text.length-this._cursorOffset;this.text=this._text.slice(0,i)+this._text.slice(i+1),this._cursorOffset--}return;case 13:return void(this._host.focusedControl=null);case 35:return this._cursorOffset=0,this._blinkIsEven=!1,void this._markAsDirty();case 36:return this._cursorOffset=this._text.length,this._blinkIsEven=!1,void this._markAsDirty();case 37:return this._cursorOffset++,this._cursorOffset>this._text.length&&(this._cursorOffset=this._text.length),this._blinkIsEven=!1,void this._markAsDirty();case 39:return this._cursorOffset--,this._cursorOffset<0&&(this._cursorOffset=0),this._blinkIsEven=!1,void this._markAsDirty();case 222:return void(this.deadKey=!0)}if(e&&(-1===t||32===t||t>47&&t<58||t>64&&t<91||t>185&&t<193||t>218&&t<223||t>95&&t<112)&&(this._currentKey=e,this.onBeforeKeyAddObservable.notifyObservers(this),e=this._currentKey,this._addKey))if(0===this._cursorOffset)this.text+=e;else{var r=this._text.length-this._cursorOffset;this.text=this._text.slice(0,r)+e+this._text.slice(r)}},e.prototype.processKeyboard=function(t){this.processKey(t.keyCode,t.key)},e.prototype._draw=function(t,e){var i=this;if(e.save(),this._applyStates(e),this._processMeasures(t,e)){(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowColor=this.shadowColor,e.shadowBlur=this.shadowBlur,e.shadowOffsetX=this.shadowOffsetX,e.shadowOffsetY=this.shadowOffsetY),this._isFocused?this._focusedBackground&&(e.fillStyle=this._isEnabled?this._focusedBackground:this._disabledColor,e.fillRect(this._currentMeasure.left,this._currentMeasure.top,this._currentMeasure.width,this._currentMeasure.height)):this._background&&(e.fillStyle=this._isEnabled?this._background:this._disabledColor,e.fillRect(this._currentMeasure.left,this._currentMeasure.top,this._currentMeasure.width,this._currentMeasure.height)),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0),this._fontOffset||(this._fontOffset=o.Control._GetFontOffset(e.font));var r=this._currentMeasure.left+this._margin.getValueInPixel(this._host,t.width);this.color&&(e.fillStyle=this.color);var n=this._beforeRenderText(this._text);this._isFocused||this._text||!this._placeholderText||(n=this._placeholderText,this._placeholderColor&&(e.fillStyle=this._placeholderColor)),this._textWidth=e.measureText(n).width;var s=2*this._margin.getValueInPixel(this._host,t.width);this._autoStretchWidth&&(this.width=Math.min(this._maxWidth.getValueInPixel(this._host,t.width),this._textWidth+s)+"px");var a=this._fontOffset.ascent+(this._currentMeasure.height-this._fontOffset.height)/2,h=this._width.getValueInPixel(this._host,t.width)-s;if(e.save(),e.beginPath(),e.rect(r,this._currentMeasure.top+(this._currentMeasure.height-this._fontOffset.height)/2,h+2,this._currentMeasure.height),e.clip(),this._isFocused&&this._textWidth>h){var l=r-this._textWidth+h;this._scrollLeft||(this._scrollLeft=l)}else this._scrollLeft=r;if(e.fillText(n,this._scrollLeft,this._currentMeasure.top+a),this._isFocused){if(this._clickedCoordinate){var u=this._scrollLeft+this._textWidth-this._clickedCoordinate,c=0;this._cursorOffset=0;var _=0;do{this._cursorOffset&&(_=Math.abs(u-c)),this._cursorOffset++,c=e.measureText(n.substr(n.length-this._cursorOffset,this._cursorOffset)).width}while(c<u&&n.length>=this._cursorOffset);Math.abs(u-c)>_&&this._cursorOffset--,this._blinkIsEven=!1,this._clickedCoordinate=null}if(!this._blinkIsEven){var f=this.text.substr(this._text.length-this._cursorOffset),p=e.measureText(f).width,d=this._scrollLeft+this._textWidth-p;d<r?(this._scrollLeft+=r-d,d=r,this._markAsDirty()):d>r+h&&(this._scrollLeft+=r+h-d,d=r+h,this._markAsDirty()),e.fillRect(d,this._currentMeasure.top+(this._currentMeasure.height-this._fontOffset.height)/2,2,this._fontOffset.height)}clearTimeout(this._blinkTimeout),this._blinkTimeout=setTimeout(function(){i._blinkIsEven=!i._blinkIsEven,i._markAsDirty()},500)}e.restore(),this._thickness&&(this.color&&(e.strokeStyle=this.color),e.lineWidth=this._thickness,e.strokeRect(this._currentMeasure.left+this._thickness/2,this._currentMeasure.top+this._thickness/2,this._currentMeasure.width-this._thickness,this._currentMeasure.height-this._thickness))}e.restore()},e.prototype._onPointerDown=function(e,i,r,o){return!!t.prototype._onPointerDown.call(this,e,i,r,o)&&(this._clickedCoordinate=i.x,this._host.focusedControl===this?(clearTimeout(this._blinkTimeout),this._markAsDirty(),!0):!!this._isEnabled&&(this._host.focusedControl=this,!0))},e.prototype._onPointerUp=function(e,i,r,o,n){t.prototype._onPointerUp.call(this,e,i,r,o,n)},e.prototype._beforeRenderText=function(t){return t},e.prototype.dispose=function(){t.prototype.dispose.call(this),this.onBlurObservable.clear(),this.onFocusObservable.clear(),this.onTextChangedObservable.clear()},e}(o.Control);e.InputText=a},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=i(2),o=i(0),n=function(){function t(t){this._multiLine=t,this._x=new r.ValueAndUnit(0),this._y=new r.ValueAndUnit(0),this._point=new o.Vector2(0,0)}return Object.defineProperty(t.prototype,"x",{get:function(){return this._x.toString(this._multiLine._host)},set:function(t){this._x.toString(this._multiLine._host)!==t&&this._x.fromString(t)&&this._multiLine._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"y",{get:function(){return this._y.toString(this._multiLine._host)},set:function(t){this._y.toString(this._multiLine._host)!==t&&this._y.fromString(t)&&this._multiLine._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"control",{get:function(){return this._control},set:function(t){this._control!==t&&(this._control&&this._controlObserver&&(this._control.onDirtyObservable.remove(this._controlObserver),this._controlObserver=null),this._control=t,this._control&&(this._controlObserver=this._control.onDirtyObservable.add(this._multiLine.onPointUpdate)),this._multiLine._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"mesh",{get:function(){return this._mesh},set:function(t){this._mesh!==t&&(this._mesh&&this._meshObserver&&this._mesh.getScene().onAfterCameraRenderObservable.remove(this._meshObserver),this._mesh=t,this._mesh&&(this._meshObserver=this._mesh.getScene().onAfterCameraRenderObservable.add(this._multiLine.onPointUpdate)),this._multiLine._markAsDirty())},enumerable:!0,configurable:!0}),t.prototype.resetLinks=function(){this.control=null,this.mesh=null},t.prototype.translate=function(){return this._point=this._translatePoint(),this._point},t.prototype._translatePoint=function(){if(null!=this._mesh)return this._multiLine._host.getProjectedPosition(this._mesh.getBoundingInfo().boundingSphere.center,this._mesh.getWorldMatrix());if(null!=this._control)return new o.Vector2(this._control.centerX,this._control.centerY);var t=this._multiLine._host,e=this._x.getValueInPixel(t,Number(t._canvas.width)),i=this._y.getValueInPixel(t,Number(t._canvas.height));return new o.Vector2(e,i)},t.prototype.dispose=function(){this.resetLinks()},t}();e.MultiLinePoint=n},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(1),n=i(0),s=i(9),a=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._isChecked=!1,i._background="black",i._checkSizeRatio=.8,i._thickness=1,i.group="",i.onIsCheckedChangedObservable=new n.Observable,i.isPointerBlocker=!0,i}return r(e,t),Object.defineProperty(e.prototype,"thickness",{get:function(){return this._thickness},set:function(t){this._thickness!==t&&(this._thickness=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"checkSizeRatio",{get:function(){return this._checkSizeRatio},set:function(t){t=Math.max(Math.min(1,t),0),this._checkSizeRatio!==t&&(this._checkSizeRatio=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"background",{get:function(){return this._background},set:function(t){this._background!==t&&(this._background=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"isChecked",{get:function(){return this._isChecked},set:function(t){var e=this;this._isChecked!==t&&(this._isChecked=t,this._markAsDirty(),this.onIsCheckedChangedObservable.notifyObservers(t),this._isChecked&&this._host&&this._host.executeOnAllControls(function(t){if(t!==e&&void 0!==t.group){var i=t;i.group===e.group&&(i.isChecked=!1)}}))},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"RadioButton"},e.prototype._draw=function(t,e){if(e.save(),this._applyStates(e),this._processMeasures(t,e)){var i=this._currentMeasure.width-this._thickness,r=this._currentMeasure.height-this._thickness;if((this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowColor=this.shadowColor,e.shadowBlur=this.shadowBlur,e.shadowOffsetX=this.shadowOffsetX,e.shadowOffsetY=this.shadowOffsetY),o.Control.drawEllipse(this._currentMeasure.left+this._currentMeasure.width/2,this._currentMeasure.top+this._currentMeasure.height/2,this._currentMeasure.width/2-this._thickness/2,this._currentMeasure.height/2-this._thickness/2,e),e.fillStyle=this._isEnabled?this._background:this._disabledColor,e.fill(),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0),e.strokeStyle=this.color,e.lineWidth=this._thickness,e.stroke(),this._isChecked){e.fillStyle=this._isEnabled?this.color:this._disabledColor;var n=i*this._checkSizeRatio,s=r*this._checkSizeRatio;o.Control.drawEllipse(this._currentMeasure.left+this._currentMeasure.width/2,this._currentMeasure.top+this._currentMeasure.height/2,n/2-this._thickness/2,s/2-this._thickness/2,e),e.fill()}}e.restore()},e.prototype._onPointerDown=function(e,i,r,o){return!!t.prototype._onPointerDown.call(this,e,i,r,o)&&(this.isChecked||(this.isChecked=!0),!0)},e.AddRadioButtonWithHeader=function(t,i,r,n){var a=new s.StackPanel;a.isVertical=!1,a.height="30px";var h=new e;h.width="20px",h.height="20px",h.isChecked=r,h.color="green",h.group=i,h.onIsCheckedChangedObservable.add(function(t){return n(h,t)}),a.addControl(h);var l=new s.TextBlock;return l.text=t,l.width="180px",l.paddingLeft="5px",l.textHorizontalAlignment=o.Control.HORIZONTAL_ALIGNMENT_LEFT,l.color="white",a.addControl(l),a},e}(o.Control);e.RadioButton=a},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._background="black",i._borderColor="white",i._isThumbCircle=!1,i}return r(e,t),Object.defineProperty(e.prototype,"borderColor",{get:function(){return this._borderColor},set:function(t){this._borderColor!==t&&(this._borderColor=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"background",{get:function(){return this._background},set:function(t){this._background!==t&&(this._background=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"isThumbCircle",{get:function(){return this._isThumbCircle},set:function(t){this._isThumbCircle!==t&&(this._isThumbCircle=t,this._markAsDirty())},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"Slider"},e.prototype._draw=function(t,e){if(e.save(),this._applyStates(e),this._processMeasures(t,e)){this._prepareRenderingData(this.isThumbCircle?"circle":"rectangle");var i=this._renderLeft,r=this._renderTop,o=this._renderWidth,n=this._renderHeight,s=0;this.isThumbClamped&&this.isThumbCircle?(this.isVertical?r+=this._effectiveThumbThickness/2:i+=this._effectiveThumbThickness/2,s=this._backgroundBoxThickness/2):s=(this._effectiveThumbThickness-this._effectiveBarOffset)/2,(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowColor=this.shadowColor,e.shadowBlur=this.shadowBlur,e.shadowOffsetX=this.shadowOffsetX,e.shadowOffsetY=this.shadowOffsetY);var a=this._getThumbPosition();e.fillStyle=this._background,this.isVertical?this.isThumbClamped?this.isThumbCircle?(e.beginPath(),e.arc(i+this._backgroundBoxThickness/2,r,s,Math.PI,2*Math.PI),e.fill(),e.fillRect(i,r,o,n)):e.fillRect(i,r,o,n+this._effectiveThumbThickness):e.fillRect(i,r,o,n):this.isThumbClamped?this.isThumbCircle?(e.beginPath(),e.arc(i+this._backgroundBoxLength,r+this._backgroundBoxThickness/2,s,0,2*Math.PI),e.fill(),e.fillRect(i,r,o,n)):e.fillRect(i,r,o+this._effectiveThumbThickness,n):e.fillRect(i,r,o,n),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0),e.fillStyle=this.color,this.isVertical?this.isThumbClamped?this.isThumbCircle?(e.beginPath(),e.arc(i+this._backgroundBoxThickness/2,r+this._backgroundBoxLength,s,0,2*Math.PI),e.fill(),e.fillRect(i,r+a,o,n-a)):e.fillRect(i,r+a,o,n-a+this._effectiveThumbThickness):e.fillRect(i,r+a,o,n-a):this.isThumbClamped&&this.isThumbCircle?(e.beginPath(),e.arc(i,r+this._backgroundBoxThickness/2,s,0,2*Math.PI),e.fill(),e.fillRect(i,r,a,n)):e.fillRect(i,r,a,n),this.displayThumb&&((this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowColor=this.shadowColor,e.shadowBlur=this.shadowBlur,e.shadowOffsetX=this.shadowOffsetX,e.shadowOffsetY=this.shadowOffsetY),this._isThumbCircle?(e.beginPath(),this.isVertical?e.arc(i+this._backgroundBoxThickness/2,r+a,s,0,2*Math.PI):e.arc(i+a,r+this._backgroundBoxThickness/2,s,0,2*Math.PI),e.fill(),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0),e.strokeStyle=this._borderColor,e.stroke()):(this.isVertical?e.fillRect(i-this._effectiveBarOffset,this._currentMeasure.top+a,this._currentMeasure.width,this._effectiveThumbThickness):e.fillRect(this._currentMeasure.left+a,this._currentMeasure.top,this._effectiveThumbThickness,this._currentMeasure.height),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0),e.strokeStyle=this._borderColor,this.isVertical?e.strokeRect(i-this._effectiveBarOffset,this._currentMeasure.top+a,this._currentMeasure.width,this._effectiveThumbThickness):e.strokeRect(this._currentMeasure.left+a,this._currentMeasure.top,this._effectiveThumbThickness,this._currentMeasure.height)))}e.restore()},e}(i(12).BaseSlider);e.Slider=o},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=i(0),o=i(2),n=function(){function t(t){this._fontFamily="Arial",this._fontStyle="",this._fontWeight="",this._fontSize=new o.ValueAndUnit(18,o.ValueAndUnit.UNITMODE_PIXEL,!1),this.onChangedObservable=new r.Observable,this._host=t}return Object.defineProperty(t.prototype,"fontSize",{get:function(){return this._fontSize.toString(this._host)},set:function(t){this._fontSize.toString(this._host)!==t&&this._fontSize.fromString(t)&&this.onChangedObservable.notifyObservers(this)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"fontFamily",{get:function(){return this._fontFamily},set:function(t){this._fontFamily!==t&&(this._fontFamily=t,this.onChangedObservable.notifyObservers(this))},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"fontStyle",{get:function(){return this._fontStyle},set:function(t){this._fontStyle!==t&&(this._fontStyle=t,this.onChangedObservable.notifyObservers(this))},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"fontWeight",{get:function(){return this._fontWeight},set:function(t){this._fontWeight!==t&&(this._fontWeight=t,this.onChangedObservable.notifyObservers(this))},enumerable:!0,configurable:!0}),t.prototype.dispose=function(){this.onChangedObservable.clear()},t}();e.Style=n},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(14),n=i(0),s=function(t){function e(e){return t.call(this,e)||this}return r(e,t),e.prototype._getTypeName=function(){return"AbstractButton3D"},e.prototype._createNode=function(t){return new n.TransformNode("button"+this.name)},e}(o.Control3D);e.AbstractButton3D=s},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=function(t){function e(e,i){void 0===i&&(i=0);var r=t.call(this,e.x,e.y,e.z)||this;return r.buttonIndex=i,r}return r(e,t),e}(i(0).Vector3);e.Vector3WithInfo=o},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}(),o=this&&this.__decorate||function(t,e,i,r){var o,n=arguments.length,s=n<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(t,e,i,r);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(s=(n<3?o(s):n>3?o(e,i,s):o(e,i))||s);return n>3&&s&&Object.defineProperty(e,i,s),s};Object.defineProperty(e,"__esModule",{value:!0});var n=i(0);i(46).registerShader();var s=function(t){function e(){var e=t.call(this)||this;return e.INNERGLOW=!1,e.BORDER=!1,e.HOVERLIGHT=!1,e.TEXTURE=!1,e.rebuild(),e}return r(e,t),e}(n.MaterialDefines);e.FluentMaterialDefines=s;var a=function(t){function e(e,i){var r=t.call(this,e,i)||this;return r.innerGlowColorIntensity=.5,r.innerGlowColor=new n.Color3(1,1,1),r.alpha=1,r.albedoColor=new n.Color3(.3,.35,.4),r.renderBorders=!1,r.borderWidth=.5,r.edgeSmoothingValue=.02,r.borderMinValue=.1,r.renderHoverLight=!1,r.hoverRadius=1,r.hoverColor=new n.Color4(.3,.3,.3,1),r.hoverPosition=n.Vector3.Zero(),r}return r(e,t),e.prototype.needAlphaBlending=function(){return 1!==this.alpha},e.prototype.needAlphaTesting=function(){return!1},e.prototype.getAlphaTestTexture=function(){return null},e.prototype.isReadyForSubMesh=function(t,e,i){if(this.isFrozen&&this._wasPreviouslyReady&&e.effect)return!0;e._materialDefines||(e._materialDefines=new s);var r=this.getScene(),o=e._materialDefines;if(!this.checkReadyOnEveryCall&&e.effect&&o._renderId===r.getRenderId())return!0;if(o._areTexturesDirty)if(o.INNERGLOW=this.innerGlowColorIntensity>0,o.BORDER=this.renderBorders,o.HOVERLIGHT=this.renderHoverLight,this._albedoTexture){if(!this._albedoTexture.isReadyOrNotBlocking())return!1;o.TEXTURE=!0}else o.TEXTURE=!1;var a=r.getEngine();if(o.isDirty){o.markAsProcessed(),r.resetCachedMaterial();var h=[n.VertexBuffer.PositionKind];h.push(n.VertexBuffer.NormalKind),h.push(n.VertexBuffer.UVKind);var l=["world","viewProjection","innerGlowColor","albedoColor","borderWidth","edgeSmoothingValue","scaleFactor","borderMinValue","hoverColor","hoverPosition","hoverRadius"],u=["albedoSampler"],c=new Array;n.MaterialHelper.PrepareUniformsAndSamplersList({uniformsNames:l,uniformBuffersNames:c,samplers:u,defines:o,maxSimultaneousLights:4});var _=o.toString();e.setEffect(r.getEngine().createEffect("fluent",{attributes:h,uniformsNames:l,uniformBuffersNames:c,samplers:u,defines:_,fallbacks:null,onCompiled:this.onCompiled,onError:this.onError,indexParameters:{maxSimultaneousLights:4}},a))}return!(!e.effect||!e.effect.isReady())&&(o._renderId=r.getRenderId(),this._wasPreviouslyReady=!0,!0)},e.prototype.bindForSubMesh=function(t,e,i){var r=this.getScene(),o=i._materialDefines;if(o){var s=i.effect;s&&(this._activeEffect=s,this.bindOnlyWorldMatrix(t),this._activeEffect.setMatrix("viewProjection",r.getTransformMatrix()),this._mustRebind(r,s)&&(this._activeEffect.setColor4("albedoColor",this.albedoColor,this.alpha),o.INNERGLOW&&this._activeEffect.setColor4("innerGlowColor",this.innerGlowColor,this.innerGlowColorIntensity),o.BORDER&&(this._activeEffect.setFloat("borderWidth",this.borderWidth),this._activeEffect.setFloat("edgeSmoothingValue",this.edgeSmoothingValue),this._activeEffect.setFloat("borderMinValue",this.borderMinValue),e.getBoundingInfo().boundingBox.extendSize.multiplyToRef(e.scaling,n.Tmp.Vector3[0]),this._activeEffect.setVector3("scaleFactor",n.Tmp.Vector3[0])),o.HOVERLIGHT&&(this._activeEffect.setDirectColor4("hoverColor",this.hoverColor),this._activeEffect.setFloat("hoverRadius",this.hoverRadius),this._activeEffect.setVector3("hoverPosition",this.hoverPosition)),o.TEXTURE&&this._activeEffect.setTexture("albedoSampler",this._albedoTexture)),this._afterBind(e,this._activeEffect))}},e.prototype.getActiveTextures=function(){return t.prototype.getActiveTextures.call(this)},e.prototype.hasTexture=function(e){return!!t.prototype.hasTexture.call(this,e)},e.prototype.dispose=function(e){t.prototype.dispose.call(this,e)},e.prototype.clone=function(t){var i=this;return n.SerializationHelper.Clone(function(){return new e(t,i.getScene())},this)},e.prototype.serialize=function(){var t=n.SerializationHelper.Serialize(this);return t.customType="BABYLON.GUI.FluentMaterial",t},e.prototype.getClassName=function(){return"FluentMaterial"},e.Parse=function(t,i,r){return n.SerializationHelper.Parse(function(){return new e(t.name,i)},t,i,r)},o([n.serialize(),n.expandToProperty("_markAllSubMeshesAsTexturesDirty")],e.prototype,"innerGlowColorIntensity",void 0),o([n.serializeAsColor3()],e.prototype,"innerGlowColor",void 0),o([n.serialize()],e.prototype,"alpha",void 0),o([n.serializeAsColor3()],e.prototype,"albedoColor",void 0),o([n.serialize(),n.expandToProperty("_markAllSubMeshesAsTexturesDirty")],e.prototype,"renderBorders",void 0),o([n.serialize()],e.prototype,"borderWidth",void 0),o([n.serialize()],e.prototype,"edgeSmoothingValue",void 0),o([n.serialize()],e.prototype,"borderMinValue",void 0),o([n.serialize(),n.expandToProperty("_markAllSubMeshesAsTexturesDirty")],e.prototype,"renderHoverLight",void 0),o([n.serialize()],e.prototype,"hoverRadius",void 0),o([n.serializeAsColor4()],e.prototype,"hoverColor",void 0),o([n.serializeAsVector3()],e.prototype,"hoverPosition",void 0),o([n.serializeAsTexture("albedoTexture")],e.prototype,"_albedoTexture",void 0),o([n.expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")],e.prototype,"albedoTexture",void 0),e}(n.PushMaterial);e.FluentMaterial=a},function(t,e,i){"use strict";(function(t){Object.defineProperty(e,"__esModule",{value:!0});var r=i(16),o=void 0!==t?t:"undefined"!=typeof window?window:void 0;void 0!==o&&(o.BABYLON=o.BABYLON||{},o.BABYLON.GUI=r),function(t){for(var i in t)e.hasOwnProperty(i)||(e[i]=t[i])}(i(16))}).call(this,i(29))},function(t,e){var i;i=function(){return this}();try{i=i||Function("return this")()||(0,eval)("this")}catch(t){"object"==typeof window&&(i=window)}t.exports=i},function(t,e,i){"use strict";function r(t){for(var i in t)e.hasOwnProperty(i)||(e[i]=t[i])}Object.defineProperty(e,"__esModule",{value:!0}),r(i(9)),r(i(13)),r(i(18)),r(i(5)),r(i(21)),r(i(24)),r(i(2))},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(1),n=i(0),s=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._value=n.Color3.Red(),i._tmpColor=new n.Color3,i._pointerStartedOnSquare=!1,i._pointerStartedOnWheel=!1,i._squareLeft=0,i._squareTop=0,i._squareSize=0,i._h=360,i._s=1,i._v=1,i.onValueChangedObservable=new n.Observable,i._pointerIsDown=!1,i.value=new n.Color3(.88,.1,.1),i.size="200px",i.isPointerBlocker=!0,i}return r(e,t),Object.defineProperty(e.prototype,"value",{get:function(){return this._value},set:function(t){this._value.equals(t)||(this._value.copyFrom(t),this._RGBtoHSV(this._value,this._tmpColor),this._h=this._tmpColor.r,this._s=Math.max(this._tmpColor.g,1e-5),this._v=Math.max(this._tmpColor.b,1e-5),this._markAsDirty(),this.onValueChangedObservable.notifyObservers(this._value))},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"width",{set:function(t){this._width.toString(this._host)!==t&&this._width.fromString(t)&&(this._height.fromString(t),this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"height",{set:function(t){this._height.toString(this._host)!==t&&this._height.fromString(t)&&(this._width.fromString(t),this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"size",{get:function(){return this.width},set:function(t){this.width=t},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"ColorPicker"},e.prototype._updateSquareProps=function(){var t=.5*Math.min(this._currentMeasure.width,this._currentMeasure.height),e=2*(t-.2*t)/Math.sqrt(2),i=t-.5*e;this._squareLeft=this._currentMeasure.left+i,this._squareTop=this._currentMeasure.top+i,this._squareSize=e},e.prototype._drawGradientSquare=function(t,e,i,r,o,n){var s=n.createLinearGradient(e,i,r+e,i);s.addColorStop(0,"#fff"),s.addColorStop(1,"hsl("+t+", 100%, 50%)"),n.fillStyle=s,n.fillRect(e,i,r,o);var a=n.createLinearGradient(e,i,e,o+i);a.addColorStop(0,"rgba(0,0,0,0)"),a.addColorStop(1,"#000"),n.fillStyle=a,n.fillRect(e,i,r,o)},e.prototype._drawCircle=function(t,e,i,r){r.beginPath(),r.arc(t,e,i+1,0,2*Math.PI,!1),r.lineWidth=3,r.strokeStyle="#333333",r.stroke(),r.beginPath(),r.arc(t,e,i,0,2*Math.PI,!1),r.lineWidth=3,r.strokeStyle="#ffffff",r.stroke()},e.prototype._createColorWheelCanvas=function(t,e){var i=document.createElement("canvas");i.width=2*t,i.height=2*t;for(var r=i.getContext("2d"),o=r.getImageData(0,0,2*t,2*t),n=o.data,s=this._tmpColor,a=t*t,h=t-e,l=h*h,u=-t;u<t;u++)for(var c=-t;c<t;c++){var _=u*u+c*c;if(!(_>a||_<l)){var f=Math.sqrt(_),p=Math.atan2(c,u);this._HSVtoRGB(180*p/Math.PI+180,f/t,1,s);var d=4*(u+t+2*(c+t)*t);n[d]=255*s.r,n[d+1]=255*s.g,n[d+2]=255*s.b;var y=.2;y=t<50?.2:t>150?.04:-.16*(t-50)/100+.2;var g=(f-h)/(t-h);n[d+3]=g<y?g/y*255:g>1-y?255*(1-(g-(1-y))/y):255}}return r.putImageData(o,0,0),i},e.prototype._RGBtoHSV=function(t,e){var i=t.r,r=t.g,o=t.b,n=Math.max(i,r,o),s=Math.min(i,r,o),a=0,h=0,l=n,u=n-s;0!==n&&(h=u/n),n!=s&&(n==i?(a=(r-o)/u,r<o&&(a+=6)):n==r?a=(o-i)/u+2:n==o&&(a=(i-r)/u+4),a*=60),e.r=a,e.g=h,e.b=l},e.prototype._HSVtoRGB=function(t,e,i,r){var o=i*e,n=t/60,s=o*(1-Math.abs(n%2-1)),a=0,h=0,l=0;n>=0&&n<=1?(a=o,h=s):n>=1&&n<=2?(a=s,h=o):n>=2&&n<=3?(h=o,l=s):n>=3&&n<=4?(h=s,l=o):n>=4&&n<=5?(a=s,l=o):n>=5&&n<=6&&(a=o,l=s);var u=i-o;r.set(a+u,h+u,l+u)},e.prototype._draw=function(t,e){if(e.save(),this._applyStates(e),this._processMeasures(t,e)){var i=.5*Math.min(this._currentMeasure.width,this._currentMeasure.height),r=.2*i,o=this._currentMeasure.left,n=this._currentMeasure.top;this._colorWheelCanvas&&this._colorWheelCanvas.width==2*i||(this._colorWheelCanvas=this._createColorWheelCanvas(i,r)),this._updateSquareProps(),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowColor=this.shadowColor,e.shadowBlur=this.shadowBlur,e.shadowOffsetX=this.shadowOffsetX,e.shadowOffsetY=this.shadowOffsetY,e.fillRect(this._squareLeft,this._squareTop,this._squareSize,this._squareSize)),e.drawImage(this._colorWheelCanvas,o,n),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0),this._drawGradientSquare(this._h,this._squareLeft,this._squareTop,this._squareSize,this._squareSize,e);var s=this._squareLeft+this._squareSize*this._s,a=this._squareTop+this._squareSize*(1-this._v);this._drawCircle(s,a,.04*i,e);var h=i-.5*r;s=o+i+Math.cos((this._h-180)*Math.PI/180)*h,a=n+i+Math.sin((this._h-180)*Math.PI/180)*h,this._drawCircle(s,a,.35*r,e)}e.restore()},e.prototype._updateValueFromPointer=function(t,e){if(this._pointerStartedOnWheel){var i=.5*Math.min(this._currentMeasure.width,this._currentMeasure.height),r=i+this._currentMeasure.left,o=i+this._currentMeasure.top;this._h=180*Math.atan2(e-o,t-r)/Math.PI+180}else this._pointerStartedOnSquare&&(this._updateSquareProps(),this._s=(t-this._squareLeft)/this._squareSize,this._v=1-(e-this._squareTop)/this._squareSize,this._s=Math.min(this._s,1),this._s=Math.max(this._s,1e-5),this._v=Math.min(this._v,1),this._v=Math.max(this._v,1e-5));this._HSVtoRGB(this._h,this._s,this._v,this._tmpColor),this.value=this._tmpColor},e.prototype._isPointOnSquare=function(t){this._updateSquareProps();var e=this._squareLeft,i=this._squareTop,r=this._squareSize;return t.x>=e&&t.x<=e+r&&t.y>=i&&t.y<=i+r},e.prototype._isPointOnWheel=function(t){var e=.5*Math.min(this._currentMeasure.width,this._currentMeasure.height),i=e+this._currentMeasure.left,r=e+this._currentMeasure.top,o=e-.2*e,n=e*e,s=o*o,a=t.x-i,h=t.y-r,l=a*a+h*h;return l<=n&&l>=s},e.prototype._onPointerDown=function(e,i,r,o){return!!t.prototype._onPointerDown.call(this,e,i,r,o)&&(this._pointerIsDown=!0,this._pointerStartedOnSquare=!1,this._pointerStartedOnWheel=!1,this._isPointOnSquare(i)?this._pointerStartedOnSquare=!0:this._isPointOnWheel(i)&&(this._pointerStartedOnWheel=!0),this._updateValueFromPointer(i.x,i.y),this._host._capturingControl[r]=this,!0)},e.prototype._onPointerMove=function(e,i){this._pointerIsDown&&this._updateValueFromPointer(i.x,i.y),t.prototype._onPointerMove.call(this,e,i)},e.prototype._onPointerUp=function(e,i,r,o,n){this._pointerIsDown=!1,delete this._host._capturingControl[r],t.prototype._onPointerUp.call(this,e,i,r,o,n)},e}(o.Control);e.ColorPicker=s},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(4),n=i(1),s=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._thickness=1,i}return r(e,t),Object.defineProperty(e.prototype,"thickness",{get:function(){return this._thickness},set:function(t){this._thickness!==t&&(this._thickness=t,this._markAsDirty())},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"Ellipse"},e.prototype._localDraw=function(t){t.save(),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(t.shadowColor=this.shadowColor,t.shadowBlur=this.shadowBlur,t.shadowOffsetX=this.shadowOffsetX,t.shadowOffsetY=this.shadowOffsetY),n.Control.drawEllipse(this._currentMeasure.left+this._currentMeasure.width/2,this._currentMeasure.top+this._currentMeasure.height/2,this._currentMeasure.width/2-this._thickness/2,this._currentMeasure.height/2-this._thickness/2,t),this._background&&(t.fillStyle=this._background,t.fill()),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(t.shadowBlur=0,t.shadowOffsetX=0,t.shadowOffsetY=0),this._thickness&&(this.color&&(t.strokeStyle=this.color),t.lineWidth=this._thickness,t.stroke()),t.restore()},e.prototype._additionalProcessing=function(e,i){t.prototype._additionalProcessing.call(this,e,i),this._measureForChildren.width-=2*this._thickness,this._measureForChildren.height-=2*this._thickness,this._measureForChildren.left+=this._thickness,this._measureForChildren.top+=this._thickness},e.prototype._clipForChildren=function(t){n.Control.drawEllipse(this._currentMeasure.left+this._currentMeasure.width/2,this._currentMeasure.top+this._currentMeasure.height/2,this._currentMeasure.width/2,this._currentMeasure.height/2,t),t.clip()},e}(o.Container);e.Ellipse=s},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(4),n=i(2),s=i(1),a=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._rowDefinitions=new Array,i._columnDefinitions=new Array,i._cells={},i._childControls=new Array,i}return r(e,t),Object.defineProperty(e.prototype,"columnCount",{get:function(){return this._columnDefinitions.length},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"rowCount",{get:function(){return this._rowDefinitions.length},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"children",{get:function(){return this._childControls},enumerable:!0,configurable:!0}),e.prototype.addRowDefinition=function(t,e){return void 0===e&&(e=!1),this._rowDefinitions.push(new n.ValueAndUnit(t,e?n.ValueAndUnit.UNITMODE_PIXEL:n.ValueAndUnit.UNITMODE_PERCENTAGE)),this._markAsDirty(),this},e.prototype.addColumnDefinition=function(t,e){return void 0===e&&(e=!1),this._columnDefinitions.push(new n.ValueAndUnit(t,e?n.ValueAndUnit.UNITMODE_PIXEL:n.ValueAndUnit.UNITMODE_PERCENTAGE)),this._markAsDirty(),this},e.prototype.setRowDefinition=function(t,e,i){return void 0===i&&(i=!1),t<0||t>=this._rowDefinitions.length?this:(this._rowDefinitions[t]=new n.ValueAndUnit(e,i?n.ValueAndUnit.UNITMODE_PIXEL:n.ValueAndUnit.UNITMODE_PERCENTAGE),this._markAsDirty(),this)},e.prototype.setColumnDefinition=function(t,e,i){return void 0===i&&(i=!1),t<0||t>=this._columnDefinitions.length?this:(this._columnDefinitions[t]=new n.ValueAndUnit(e,i?n.ValueAndUnit.UNITMODE_PIXEL:n.ValueAndUnit.UNITMODE_PERCENTAGE),this._markAsDirty(),this)},e.prototype.getChildrenAt=function(t,e){var i=this._cells[t+":"+e];return i?i.children:null},e.prototype._removeCell=function(e,i){if(e){t.prototype.removeControl.call(this,e);for(var r=0,o=e.children;r<o.length;r++){var n=o[r],s=this._childControls.indexOf(n);-1!==s&&this._childControls.splice(s,1)}delete this._cells[i]}},e.prototype._offsetCell=function(t,e){if(this._cells[e]){this._cells[t]=this._cells[e];for(var i=0,r=this._cells[t].children;i<r.length;i++){r[i]._tag=t}delete this._cells[e]}},e.prototype.removeColumnDefinition=function(t){if(t<0||t>=this._columnDefinitions.length)return this;for(var e=0;e<this._rowDefinitions.length;e++){var i=e+":"+t,r=this._cells[i];this._removeCell(r,i)}for(e=0;e<this._rowDefinitions.length;e++)for(var o=t+1;o<this._columnDefinitions.length;o++){var n=e+":"+(o-1);i=e+":"+o;this._offsetCell(n,i)}return this._columnDefinitions.splice(t,1),this._markAsDirty(),this},e.prototype.removeRowDefinition=function(t){if(t<0||t>=this._rowDefinitions.length)return this;for(var e=0;e<this._columnDefinitions.length;e++){var i=t+":"+e,r=this._cells[i];this._removeCell(r,i)}for(e=0;e<this._columnDefinitions.length;e++)for(var o=t+1;o<this._rowDefinitions.length;o++){var n=o-1+":"+e;i=o+":"+e;this._offsetCell(n,i)}return this._rowDefinitions.splice(t,1),this._markAsDirty(),this},e.prototype.addControl=function(e,i,r){void 0===i&&(i=0),void 0===r&&(r=0),0===this._rowDefinitions.length&&this.addRowDefinition(1,!1),0===this._columnDefinitions.length&&this.addColumnDefinition(1,!1);var n=Math.min(i,this._rowDefinitions.length-1)+":"+Math.min(r,this._columnDefinitions.length-1),a=this._cells[n];return a||(a=new o.Container(n),this._cells[n]=a,a.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT,a.verticalAlignment=s.Control.VERTICAL_ALIGNMENT_TOP,t.prototype.addControl.call(this,a)),a.addControl(e),this._childControls.push(e),e._tag=n,this._markAsDirty(),this},e.prototype.removeControl=function(t){var e=this._childControls.indexOf(t);-1!==e&&this._childControls.splice(e,1);var i=this._cells[t._tag];return i&&i.removeControl(t),this._markAsDirty(),this},e.prototype._getTypeName=function(){return"Grid"},e.prototype._additionalProcessing=function(e,i){for(var r=[],o=[],n=[],s=[],a=this._currentMeasure.width,h=0,l=this._currentMeasure.height,u=0,c=0,_=0,f=this._rowDefinitions;_<f.length;_++){if((b=f[_]).isPixel)l-=g=b.getValue(this._host),o[c]=g;else u+=b.internalValue;c++}var p=0;c=0;for(var d=0,y=this._rowDefinitions;d<y.length;d++){var g,b=y[d];if(s.push(p),b.isPixel)p+=b.getValue(this._host);else p+=g=b.internalValue/u*l,o[c]=g;c++}c=0;for(var m=0,v=this._columnDefinitions;m<v.length;m++){if((b=v[m]).isPixel)a-=T=b.getValue(this._host),r[c]=T;else h+=b.internalValue;c++}var O=0;c=0;for(var P=0,C=this._columnDefinitions;P<C.length;P++){var T;b=C[P];if(n.push(O),b.isPixel)O+=b.getValue(this._host);else O+=T=b.internalValue/h*a,r[c]=T;c++}for(var w in this._cells)if(this._cells.hasOwnProperty(w)){var M=w.split(":"),k=parseInt(M[0]),x=parseInt(M[1]),A=this._cells[w];A.left=n[x]+"px",A.top=s[k]+"px",A.width=r[x]+"px",A.height=o[k]+"px"}t.prototype._additionalProcessing.call(this,e,i)},e.prototype.dispose=function(){t.prototype.dispose.call(this);for(var e=0,i=this._childControls;e<i.length;e++){i[e].dispose()}},e}(o.Container);e.Grid=a},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r(e,t),e.prototype._beforeRenderText=function(t){for(var e="",i=0;i<t.length;i++)e+="•";return e},e}(i(20).InputText);e.InputPassword=o},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(1),n=i(2),s=i(0),a=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._lineWidth=1,i._x1=new n.ValueAndUnit(0),i._y1=new n.ValueAndUnit(0),i._x2=new n.ValueAndUnit(0),i._y2=new n.ValueAndUnit(0),i._dash=new Array,i.isHitTestVisible=!1,i._horizontalAlignment=o.Control.HORIZONTAL_ALIGNMENT_LEFT,i._verticalAlignment=o.Control.VERTICAL_ALIGNMENT_TOP,i}return r(e,t),Object.defineProperty(e.prototype,"dash",{get:function(){return this._dash},set:function(t){this._dash!==t&&(this._dash=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"connectedControl",{get:function(){return this._connectedControl},set:function(t){var e=this;this._connectedControl!==t&&(this._connectedControlDirtyObserver&&this._connectedControl&&(this._connectedControl.onDirtyObservable.remove(this._connectedControlDirtyObserver),this._connectedControlDirtyObserver=null),t&&(this._connectedControlDirtyObserver=t.onDirtyObservable.add(function(){return e._markAsDirty()})),this._connectedControl=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"x1",{get:function(){return this._x1.toString(this._host)},set:function(t){this._x1.toString(this._host)!==t&&this._x1.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"y1",{get:function(){return this._y1.toString(this._host)},set:function(t){this._y1.toString(this._host)!==t&&this._y1.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"x2",{get:function(){return this._x2.toString(this._host)},set:function(t){this._x2.toString(this._host)!==t&&this._x2.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"y2",{get:function(){return this._y2.toString(this._host)},set:function(t){this._y2.toString(this._host)!==t&&this._y2.fromString(t)&&this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"lineWidth",{get:function(){return this._lineWidth},set:function(t){this._lineWidth!==t&&(this._lineWidth=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"horizontalAlignment",{set:function(t){},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"verticalAlignment",{set:function(t){},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"_effectiveX2",{get:function(){return(this._connectedControl?this._connectedControl.centerX:0)+this._x2.getValue(this._host)},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"_effectiveY2",{get:function(){return(this._connectedControl?this._connectedControl.centerY:0)+this._y2.getValue(this._host)},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"Line"},e.prototype._draw=function(t,e){e.save(),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowColor=this.shadowColor,e.shadowBlur=this.shadowBlur,e.shadowOffsetX=this.shadowOffsetX,e.shadowOffsetY=this.shadowOffsetY),this._applyStates(e),this._processMeasures(t,e)&&(e.strokeStyle=this.color,e.lineWidth=this._lineWidth,e.setLineDash(this._dash),e.beginPath(),e.moveTo(this._x1.getValue(this._host),this._y1.getValue(this._host)),e.lineTo(this._effectiveX2,this._effectiveY2),e.stroke()),e.restore()},e.prototype._measure=function(){this._currentMeasure.width=Math.abs(this._x1.getValue(this._host)-this._effectiveX2)+this._lineWidth,this._currentMeasure.height=Math.abs(this._y1.getValue(this._host)-this._effectiveY2)+this._lineWidth},e.prototype._computeAlignment=function(t,e){this._currentMeasure.left=Math.min(this._x1.getValue(this._host),this._effectiveX2)-this._lineWidth/2,this._currentMeasure.top=Math.min(this._y1.getValue(this._host),this._effectiveY2)-this._lineWidth/2},e.prototype.moveToVector3=function(t,e,i){if(void 0===i&&(i=!1),this._host&&this._root===this._host._rootContainer){var r=this._host._getGlobalViewport(e),o=s.Vector3.Project(t,s.Matrix.Identity(),e.getTransformMatrix(),r);this._moveToProjectedPosition(o,i),o.z<0||o.z>1?this.notRenderable=!0:this.notRenderable=!1}else s.Tools.Error("Cannot move a control to a vector3 if the control is not at root level")},e.prototype._moveToProjectedPosition=function(t,e){void 0===e&&(e=!1);var i=t.x+this._linkOffsetX.getValue(this._host)+"px",r=t.y+this._linkOffsetY.getValue(this._host)+"px";e?(this.x2=i,this.y2=r,this._x2.ignoreAdaptiveScaling=!0,this._y2.ignoreAdaptiveScaling=!0):(this.x1=i,this.y1=r,this._x1.ignoreAdaptiveScaling=!0,this._y1.ignoreAdaptiveScaling=!0)},e}(o.Control);e.Line=a},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(1),n=i(21),s=i(0),a=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._lineWidth=1,i.onPointUpdate=function(){i._markAsDirty()},i.isHitTestVisible=!1,i._horizontalAlignment=o.Control.HORIZONTAL_ALIGNMENT_LEFT,i._verticalAlignment=o.Control.VERTICAL_ALIGNMENT_TOP,i._dash=[],i._points=[],i}return r(e,t),Object.defineProperty(e.prototype,"dash",{get:function(){return this._dash},set:function(t){this._dash!==t&&(this._dash=t,this._markAsDirty())},enumerable:!0,configurable:!0}),e.prototype.getAt=function(t){return this._points[t]||(this._points[t]=new n.MultiLinePoint(this)),this._points[t]},e.prototype.add=function(){for(var t=this,e=[],i=0;i<arguments.length;i++)e[i]=arguments[i];return e.map(function(e){return t.push(e)})},e.prototype.push=function(t){var e=this.getAt(this._points.length);return null==t?e:(t instanceof s.AbstractMesh?e.mesh=t:t instanceof o.Control?e.control=t:null!=t.x&&null!=t.y&&(e.x=t.x,e.y=t.y),e)},e.prototype.remove=function(t){var e;if(t instanceof n.MultiLinePoint){if(-1===(e=this._points.indexOf(t)))return}else e=t;var i=this._points[e];i&&(i.dispose(),this._points.splice(e,1))},e.prototype.reset=function(){for(;this._points.length>0;)this.remove(this._points.length-1)},e.prototype.resetLinks=function(){this._points.forEach(function(t){null!=t&&t.resetLinks()})},Object.defineProperty(e.prototype,"lineWidth",{get:function(){return this._lineWidth},set:function(t){this._lineWidth!==t&&(this._lineWidth=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"horizontalAlignment",{set:function(t){},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"verticalAlignment",{set:function(t){},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"MultiLine"},e.prototype._draw=function(t,e){if(e.save(),(this.shadowBlur||this.shadowOffsetX||this.shadowOffsetY)&&(e.shadowColor=this.shadowColor,e.shadowBlur=this.shadowBlur,e.shadowOffsetX=this.shadowOffsetX,e.shadowOffsetY=this.shadowOffsetY),this._applyStates(e),this._processMeasures(t,e)){e.strokeStyle=this.color,e.lineWidth=this._lineWidth,e.setLineDash(this._dash),e.beginPath();var i=!0;this._points.forEach(function(t){t&&(i?(e.moveTo(t._point.x,t._point.y),i=!1):e.lineTo(t._point.x,t._point.y))}),e.stroke()}e.restore()},e.prototype._additionalProcessing=function(t,e){var i=this;this._minX=null,this._minY=null,this._maxX=null,this._maxY=null,this._points.forEach(function(t,e){t&&(t.translate(),(null==i._minX||t._point.x<i._minX)&&(i._minX=t._point.x),(null==i._minY||t._point.y<i._minY)&&(i._minY=t._point.y),(null==i._maxX||t._point.x>i._maxX)&&(i._maxX=t._point.x),(null==i._maxY||t._point.y>i._maxY)&&(i._maxY=t._point.y))}),null==this._minX&&(this._minX=0),null==this._minY&&(this._minY=0),null==this._maxX&&(this._maxX=0),null==this._maxY&&(this._maxY=0)},e.prototype._measure=function(){null!=this._minX&&null!=this._maxX&&null!=this._minY&&null!=this._maxY&&(this._currentMeasure.width=Math.abs(this._maxX-this._minX)+this._lineWidth,this._currentMeasure.height=Math.abs(this._maxY-this._minY)+this._lineWidth)},e.prototype._computeAlignment=function(t,e){null!=this._minX&&null!=this._minY&&(this._currentMeasure.left=this._minX-this._lineWidth/2,this._currentMeasure.top=this._minY-this._lineWidth/2)},e.prototype.dispose=function(){this.reset(),t.prototype.dispose.call(this)},e}(o.Control);e.MultiLine=a},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(10),n=i(7),s=i(1),a=i(6),h=i(19),l=i(22),u=i(23),c=i(4),_=function(){function t(t){this.name=t,this._groupPanel=new n.StackPanel,this._selectors=new Array,this._groupPanel.verticalAlignment=s.Control.VERTICAL_ALIGNMENT_TOP,this._groupPanel.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT,this._groupHeader=this._addGroupHeader(t)}return Object.defineProperty(t.prototype,"groupPanel",{get:function(){return this._groupPanel},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"selectors",{get:function(){return this._selectors},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"header",{get:function(){return this._groupHeader.text},set:function(t){"label"!==this._groupHeader.text&&(this._groupHeader.text=t)},enumerable:!0,configurable:!0}),t.prototype._addGroupHeader=function(t){var e=new a.TextBlock("groupHead",t);return e.width=.9,e.height="30px",e.textWrapping=!0,e.color="black",e.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT,e.textHorizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT,e.left="2px",this._groupPanel.addControl(e),e},t.prototype._getSelector=function(t){if(!(t<0||t>=this._selectors.length))return this._selectors[t]},t.prototype.removeSelector=function(t){t<0||t>=this._selectors.length||(this._groupPanel.removeControl(this._selectors[t]),this._selectors.splice(t,1))},t}();e.SelectorGroup=_;var f=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r(e,t),e.prototype.addCheckbox=function(t,e,i){void 0===e&&(e=function(t){}),void 0===i&&(i=!1);i=i||!1;var r=new h.Checkbox;r.width="20px",r.height="20px",r.color="#364249",r.background="#CCCCCC",r.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT,r.onIsCheckedChangedObservable.add(function(t){e(t)});var o=s.Control.AddHeader(r,t,"200px",{isHorizontal:!0,controlFirst:!0});o.height="30px",o.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT,o.left="4px",this.groupPanel.addControl(o),this.selectors.push(o),r.isChecked=i,this.groupPanel.parent&&this.groupPanel.parent.parent&&(r.color=this.groupPanel.parent.parent.buttonColor,r.background=this.groupPanel.parent.parent.buttonBackground)},e.prototype._setSelectorLabel=function(t,e){this.selectors[t].children[1].text=e},e.prototype._setSelectorLabelColor=function(t,e){this.selectors[t].children[1].color=e},e.prototype._setSelectorButtonColor=function(t,e){this.selectors[t].children[0].color=e},e.prototype._setSelectorButtonBackground=function(t,e){this.selectors[t].children[0].background=e},e}(_);e.CheckboxGroup=f;var p=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e._selectNb=0,e}return r(e,t),e.prototype.addRadio=function(t,e,i){void 0===e&&(e=function(t){}),void 0===i&&(i=!1);var r=this._selectNb++,o=new l.RadioButton;o.name=t,o.width="20px",o.height="20px",o.color="#364249",o.background="#CCCCCC",o.group=this.name,o.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT,o.onIsCheckedChangedObservable.add(function(t){t&&e(r)});var n=s.Control.AddHeader(o,t,"200px",{isHorizontal:!0,controlFirst:!0});n.height="30px",n.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT,n.left="4px",this.groupPanel.addControl(n),this.selectors.push(n),o.isChecked=i,this.groupPanel.parent&&this.groupPanel.parent.parent&&(o.color=this.groupPanel.parent.parent.buttonColor,o.background=this.groupPanel.parent.parent.buttonBackground)},e.prototype._setSelectorLabel=function(t,e){this.selectors[t].children[1].text=e},e.prototype._setSelectorLabelColor=function(t,e){this.selectors[t].children[1].color=e},e.prototype._setSelectorButtonColor=function(t,e){this.selectors[t].children[0].color=e},e.prototype._setSelectorButtonBackground=function(t,e){this.selectors[t].children[0].background=e},e}(_);e.RadioGroup=p;var d=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r(e,t),e.prototype.addSlider=function(t,e,i,r,o,n,a){void 0===e&&(e=function(t){}),void 0===i&&(i="Units"),void 0===r&&(r=0),void 0===o&&(o=0),void 0===n&&(n=0),void 0===a&&(a=function(t){return 0|t});var h=new u.Slider;h.name=i,h.value=n,h.minimum=r,h.maximum=o,h.width=.9,h.height="20px",h.color="#364249",h.background="#CCCCCC",h.borderColor="black",h.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT,h.left="4px",h.paddingBottom="4px",h.onValueChangedObservable.add(function(t){h.parent.children[0].text=h.parent.children[0].name+": "+a(t)+" "+h.name,e(t)});var l=s.Control.AddHeader(h,t+": "+a(n)+" "+i,"30px",{isHorizontal:!1,controlFirst:!1});l.height="60px",l.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT,l.left="4px",l.children[0].name=t,this.groupPanel.addControl(l),this.selectors.push(l),this.groupPanel.parent&&this.groupPanel.parent.parent&&(h.color=this.groupPanel.parent.parent.buttonColor,h.background=this.groupPanel.parent.parent.buttonBackground)},e.prototype._setSelectorLabel=function(t,e){this.selectors[t].children[0].name=e,this.selectors[t].children[0].text=e+": "+this.selectors[t].children[1].value+" "+this.selectors[t].children[1].name},e.prototype._setSelectorLabelColor=function(t,e){this.selectors[t].children[0].color=e},e.prototype._setSelectorButtonColor=function(t,e){this.selectors[t].children[1].color=e},e.prototype._setSelectorButtonBackground=function(t,e){this.selectors[t].children[1].background=e},e}(_);e.SliderGroup=d;var y=function(t){function e(e,i){void 0===i&&(i=[]);var r=t.call(this,e)||this;if(r.name=e,r.groups=i,r._buttonColor="#364249",r._buttonBackground="#CCCCCC",r._headerColor="black",r._barColor="white",r._barHeight="2px",r._spacerHeight="20px",r._bars=new Array,r._groups=i,r.thickness=2,r._panel=new n.StackPanel,r._panel.verticalAlignment=s.Control.VERTICAL_ALIGNMENT_TOP,r._panel.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT,r._panel.top=5,r._panel.left=5,r._panel.width=.95,i.length>0){for(var o=0;o<i.length-1;o++)r._panel.addControl(i[o].groupPanel),r._addSpacer();r._panel.addControl(i[i.length-1].groupPanel)}return r.addControl(r._panel),r}return r(e,t),e.prototype._getTypeName=function(){return"SelectionPanel"},Object.defineProperty(e.prototype,"headerColor",{get:function(){return this._headerColor},set:function(t){this._headerColor!==t&&(this._headerColor=t,this._setHeaderColor())},enumerable:!0,configurable:!0}),e.prototype._setHeaderColor=function(){for(var t=0;t<this._groups.length;t++)this._groups[t].groupPanel.children[0].color=this._headerColor},Object.defineProperty(e.prototype,"buttonColor",{get:function(){return this._buttonColor},set:function(t){this._buttonColor!==t&&(this._buttonColor=t,this._setbuttonColor())},enumerable:!0,configurable:!0}),e.prototype._setbuttonColor=function(){for(var t=0;t<this._groups.length;t++)for(var e=0;e<this._groups[t].selectors.length;e++)this._groups[t]._setSelectorButtonColor(e,this._buttonColor)},Object.defineProperty(e.prototype,"labelColor",{get:function(){return this._labelColor},set:function(t){this._labelColor!==t&&(this._labelColor=t,this._setLabelColor())},enumerable:!0,configurable:!0}),e.prototype._setLabelColor=function(){for(var t=0;t<this._groups.length;t++)for(var e=0;e<this._groups[t].selectors.length;e++)this._groups[t]._setSelectorLabelColor(e,this._labelColor)},Object.defineProperty(e.prototype,"buttonBackground",{get:function(){return this._buttonBackground},set:function(t){this._buttonBackground!==t&&(this._buttonBackground=t,this._setButtonBackground())},enumerable:!0,configurable:!0}),e.prototype._setButtonBackground=function(){for(var t=0;t<this._groups.length;t++)for(var e=0;e<this._groups[t].selectors.length;e++)this._groups[t]._setSelectorButtonBackground(e,this._buttonBackground)},Object.defineProperty(e.prototype,"barColor",{get:function(){return this._barColor},set:function(t){this._barColor!==t&&(this._barColor=t,this._setBarColor())},enumerable:!0,configurable:!0}),e.prototype._setBarColor=function(){for(var t=0;t<this._bars.length;t++)this._bars[t].children[0].background=this._barColor},Object.defineProperty(e.prototype,"barHeight",{get:function(){return this._barHeight},set:function(t){this._barHeight!==t&&(this._barHeight=t,this._setBarHeight())},enumerable:!0,configurable:!0}),e.prototype._setBarHeight=function(){for(var t=0;t<this._bars.length;t++)this._bars[t].children[0].height=this._barHeight},Object.defineProperty(e.prototype,"spacerHeight",{get:function(){return this._spacerHeight},set:function(t){this._spacerHeight!==t&&(this._spacerHeight=t,this._setSpacerHeight())},enumerable:!0,configurable:!0}),e.prototype._setSpacerHeight=function(){for(var t=0;t<this._bars.length;t++)this._bars[t].height=this._spacerHeight},e.prototype._addSpacer=function(){var t=new c.Container;t.width=1,t.height=this._spacerHeight,t.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT;var e=new o.Rectangle;e.width=1,e.height=this._barHeight,e.horizontalAlignment=s.Control.HORIZONTAL_ALIGNMENT_LEFT,e.verticalAlignment=s.Control.VERTICAL_ALIGNMENT_CENTER,e.background=this._barColor,e.color="transparent",t.addControl(e),this._panel.addControl(t),this._bars.push(t)},e.prototype.addGroup=function(t){this._groups.length>0&&this._addSpacer(),this._panel.addControl(t.groupPanel),this._groups.push(t),t.groupPanel.children[0].color=this._headerColor;for(var e=0;e<t.selectors.length;e++)t._setSelectorButtonColor(e,this._buttonColor),t._setSelectorButtonBackground(e,this._buttonBackground)},e.prototype.removeGroup=function(t){if(!(t<0||t>=this._groups.length)){var e=this._groups[t];this._panel.removeControl(e.groupPanel),this._groups.splice(t,1),t<this._bars.length&&(this._panel.removeControl(this._bars[t]),this._bars.splice(t,1))}},e.prototype.setHeaderName=function(t,e){e<0||e>=this._groups.length||(this._groups[e].groupPanel.children[0].text=t)},e.prototype.relabel=function(t,e,i){if(!(e<0||e>=this._groups.length)){var r=this._groups[e];i<0||i>=r.selectors.length||r._setSelectorLabel(i,t)}},e.prototype.removeFromGroupSelector=function(t,e){if(!(t<0||t>=this._groups.length)){var i=this._groups[t];e<0||e>=i.selectors.length||i.removeSelector(e)}},e.prototype.addToGroupCheckbox=function(t,e,i,r){(void 0===i&&(i=function(){}),void 0===r&&(r=!1),t<0||t>=this._groups.length)||this._groups[t].addCheckbox(e,i,r)},e.prototype.addToGroupRadio=function(t,e,i,r){(void 0===i&&(i=function(){}),void 0===r&&(r=!1),t<0||t>=this._groups.length)||this._groups[t].addRadio(e,i,r)},e.prototype.addToGroupSlider=function(t,e,i,r,o,n,s,a){(void 0===i&&(i=function(){}),void 0===r&&(r="Units"),void 0===o&&(o=0),void 0===n&&(n=0),void 0===s&&(s=0),void 0===a&&(a=function(t){return 0|t}),t<0||t>=this._groups.length)||this._groups[t].addSlider(e,i,r,o,n,s,a)},e}(o.Rectangle);e.SelectionPanel=y},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(7),n=i(0),s=i(17),a=function(){return function(){}}();e.KeyPropertySet=a;var h=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e.onKeyPressObservable=new n.Observable,e.defaultButtonWidth="40px",e.defaultButtonHeight="40px",e.defaultButtonPaddingLeft="2px",e.defaultButtonPaddingRight="2px",e.defaultButtonPaddingTop="2px",e.defaultButtonPaddingBottom="2px",e.defaultButtonColor="#DDD",e.defaultButtonBackground="#070707",e.shiftButtonColor="#7799FF",e.selectedShiftThickness=1,e.shiftState=0,e._currentlyConnectedInputText=null,e._connectedInputTexts=[],e._onKeyPressObserver=null,e}return r(e,t),e.prototype._getTypeName=function(){return"VirtualKeyboard"},e.prototype._createKey=function(t,e){var i=this,r=s.Button.CreateSimpleButton(t,t);return r.width=e&&e.width?e.width:this.defaultButtonWidth,r.height=e&&e.height?e.height:this.defaultButtonHeight,r.color=e&&e.color?e.color:this.defaultButtonColor,r.background=e&&e.background?e.background:this.defaultButtonBackground,r.paddingLeft=e&&e.paddingLeft?e.paddingLeft:this.defaultButtonPaddingLeft,r.paddingRight=e&&e.paddingRight?e.paddingRight:this.defaultButtonPaddingRight,r.paddingTop=e&&e.paddingTop?e.paddingTop:this.defaultButtonPaddingTop,r.paddingBottom=e&&e.paddingBottom?e.paddingBottom:this.defaultButtonPaddingBottom,r.thickness=0,r.isFocusInvisible=!0,r.shadowColor=this.shadowColor,r.shadowBlur=this.shadowBlur,r.shadowOffsetX=this.shadowOffsetX,r.shadowOffsetY=this.shadowOffsetY,r.onPointerUpObservable.add(function(){i.onKeyPressObservable.notifyObservers(t)}),r},e.prototype.addKeysRow=function(t,e){var i=new o.StackPanel;i.isVertical=!1,i.isFocusInvisible=!0;for(var r=0;r<t.length;r++){var n=null;e&&e.length===t.length&&(n=e[r]),i.addControl(this._createKey(t[r],n))}this.addControl(i)},e.prototype.applyShiftState=function(t){if(this.children)for(var e=0;e<this.children.length;e++){var i=this.children[e];if(i&&i.children)for(var r=i,o=0;o<r.children.length;o++){var n=r.children[o];if(n&&n.children[0]){var s=n.children[0];"⇧"===s.text&&(n.color=t?this.shiftButtonColor:this.defaultButtonColor,n.thickness=t>1?this.selectedShiftThickness:0),s.text=t>0?s.text.toUpperCase():s.text.toLowerCase()}}}},Object.defineProperty(e.prototype,"connectedInputText",{get:function(){return this._currentlyConnectedInputText},enumerable:!0,configurable:!0}),e.prototype.connect=function(t){var e=this;if(!this._connectedInputTexts.some(function(e){return e.input===t})){null===this._onKeyPressObserver&&(this._onKeyPressObserver=this.onKeyPressObservable.add(function(t){if(e._currentlyConnectedInputText){switch(e._currentlyConnectedInputText._host.focusedControl=e._currentlyConnectedInputText,t){case"⇧":return e.shiftState++,e.shiftState>2&&(e.shiftState=0),void e.applyShiftState(e.shiftState);case"←":return void e._currentlyConnectedInputText.processKey(8);case"↵":return void e._currentlyConnectedInputText.processKey(13)}e._currentlyConnectedInputText.processKey(-1,e.shiftState?t.toUpperCase():t),1===e.shiftState&&(e.shiftState=0,e.applyShiftState(e.shiftState))}})),this.isVisible=!1,this._currentlyConnectedInputText=t,t._connectedVirtualKeyboard=this;var i=t.onFocusObservable.add(function(){e._currentlyConnectedInputText=t,t._connectedVirtualKeyboard=e,e.isVisible=!0}),r=t.onBlurObservable.add(function(){t._connectedVirtualKeyboard=null,e._currentlyConnectedInputText=null,e.isVisible=!1});this._connectedInputTexts.push({input:t,onBlurObserver:r,onFocusObserver:i})}},e.prototype.disconnect=function(t){var e=this;if(t){var i=this._connectedInputTexts.filter(function(e){return e.input===t});1===i.length&&(this._removeConnectedInputObservables(i[0]),this._connectedInputTexts=this._connectedInputTexts.filter(function(e){return e.input!==t}),this._currentlyConnectedInputText===t&&(this._currentlyConnectedInputText=null))}else this._connectedInputTexts.forEach(function(t){e._removeConnectedInputObservables(t)}),this._connectedInputTexts=[];0===this._connectedInputTexts.length&&(this._currentlyConnectedInputText=null,this.onKeyPressObservable.remove(this._onKeyPressObserver),this._onKeyPressObserver=null)},e.prototype._removeConnectedInputObservables=function(t){t.input._connectedVirtualKeyboard=null,t.input.onFocusObservable.remove(t.onFocusObserver),t.input.onBlurObservable.remove(t.onBlurObserver)},e.prototype.dispose=function(){t.prototype.dispose.call(this),this.disconnect()},e.CreateDefaultLayout=function(t){var i=new e(t);return i.addKeysRow(["1","2","3","4","5","6","7","8","9","0","←"]),i.addKeysRow(["q","w","e","r","t","y","u","i","o","p"]),i.addKeysRow(["a","s","d","f","g","h","j","k","l",";","'","↵"]),i.addKeysRow(["⇧","z","x","c","v","b","n","m",",",".","/"]),i.addKeysRow([" "],[{width:"200px"}]),i},e}(o.StackPanel);e.VirtualKeyboard=h},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._cellWidth=20,i._cellHeight=20,i._minorLineTickness=1,i._minorLineColor="DarkGray",i._majorLineTickness=2,i._majorLineColor="White",i._majorLineFrequency=5,i._background="Black",i._displayMajorLines=!0,i._displayMinorLines=!0,i}return r(e,t),Object.defineProperty(e.prototype,"displayMinorLines",{get:function(){return this._displayMinorLines},set:function(t){this._displayMinorLines!==t&&(this._displayMinorLines=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"displayMajorLines",{get:function(){return this._displayMajorLines},set:function(t){this._displayMajorLines!==t&&(this._displayMajorLines=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"background",{get:function(){return this._background},set:function(t){this._background!==t&&(this._background=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"cellWidth",{get:function(){return this._cellWidth},set:function(t){this._cellWidth=t,this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"cellHeight",{get:function(){return this._cellHeight},set:function(t){this._cellHeight=t,this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"minorLineTickness",{get:function(){return this._minorLineTickness},set:function(t){this._minorLineTickness=t,this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"minorLineColor",{get:function(){return this._minorLineColor},set:function(t){this._minorLineColor=t,this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"majorLineTickness",{get:function(){return this._majorLineTickness},set:function(t){this._majorLineTickness=t,this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"majorLineColor",{get:function(){return this._majorLineColor},set:function(t){this._majorLineColor=t,this._markAsDirty()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"majorLineFrequency",{get:function(){return this._majorLineFrequency},set:function(t){this._majorLineFrequency=t,this._markAsDirty()},enumerable:!0,configurable:!0}),e.prototype._draw=function(t,e){if(e.save(),this._applyStates(e),this._isEnabled&&this._processMeasures(t,e)){this._background&&(e.fillStyle=this._background,e.fillRect(this._currentMeasure.left,this._currentMeasure.top,this._currentMeasure.width,this._currentMeasure.height));var i=this._currentMeasure.width/this._cellWidth,r=this._currentMeasure.height/this._cellHeight,o=this._currentMeasure.left+this._currentMeasure.width/2,n=this._currentMeasure.top+this._currentMeasure.height/2;if(this._displayMinorLines){e.strokeStyle=this._minorLineColor,e.lineWidth=this._minorLineTickness;for(var s=-i/2;s<i/2;s++){var a=o+s*this.cellWidth;e.beginPath(),e.moveTo(a,this._currentMeasure.top),e.lineTo(a,this._currentMeasure.top+this._currentMeasure.height),e.stroke()}for(var h=-r/2;h<r/2;h++){var l=n+h*this.cellHeight;e.beginPath(),e.moveTo(this._currentMeasure.left,l),e.lineTo(this._currentMeasure.left+this._currentMeasure.width,l),e.stroke()}}if(this._displayMajorLines){e.strokeStyle=this._majorLineColor,e.lineWidth=this._majorLineTickness;for(s=-i/2+this._majorLineFrequency;s<i/2;s+=this._majorLineFrequency){a=o+s*this.cellWidth;e.beginPath(),e.moveTo(a,this._currentMeasure.top),e.lineTo(a,this._currentMeasure.top+this._currentMeasure.height),e.stroke()}for(h=-r/2+this._majorLineFrequency;h<r/2;h+=this._majorLineFrequency){l=n+h*this.cellHeight;e.moveTo(this._currentMeasure.left,l),e.lineTo(this._currentMeasure.left+this._currentMeasure.width,l),e.closePath(),e.stroke()}}}e.restore()},e.prototype._getTypeName=function(){return"DisplayGrid"},e}(i(9).Control);e.DisplayGrid=o},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(12),n=i(5),s=function(t){function e(e){var i=t.call(this,e)||this;return i.name=e,i._tempMeasure=new n.Measure(0,0,0,0),i}return r(e,t),Object.defineProperty(e.prototype,"displayThumb",{get:function(){return this._displayThumb&&null!=this.thumbImage},set:function(t){this._displayThumb!==t&&(this._displayThumb=t,this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"backgroundImage",{get:function(){return this._backgroundImage},set:function(t){var e=this;this._backgroundImage!==t&&(this._backgroundImage=t,t&&!t.isLoaded&&t.onImageLoadedObservable.addOnce(function(){return e._markAsDirty()}),this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"valueBarImage",{get:function(){return this._valueBarImage},set:function(t){var e=this;this._valueBarImage!==t&&(this._valueBarImage=t,t&&!t.isLoaded&&t.onImageLoadedObservable.addOnce(function(){return e._markAsDirty()}),this._markAsDirty())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"thumbImage",{get:function(){return this._thumbImage},set:function(t){var e=this;this._thumbImage!==t&&(this._thumbImage=t,t&&!t.isLoaded&&t.onImageLoadedObservable.addOnce(function(){return e._markAsDirty()}),this._markAsDirty())},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"ImageBasedSlider"},e.prototype._draw=function(t,e){if(e.save(),this._applyStates(e),this._processMeasures(t,e)){this._prepareRenderingData("rectangle");var i=this._getThumbPosition(),r=this._renderLeft,o=this._renderTop,n=this._renderWidth,s=this._renderHeight;this._backgroundImage&&(this._tempMeasure.copyFromFloats(r,o,n,s),this.isThumbClamped&&this.displayThumb&&(this.isVertical?this._tempMeasure.height+=this._effectiveThumbThickness:this._tempMeasure.width+=this._effectiveThumbThickness),this._backgroundImage._draw(this._tempMeasure,e)),this._valueBarImage&&(this.isVertical?this.isThumbClamped&&this.displayThumb?this._tempMeasure.copyFromFloats(r,o+i,n,s-i+this._effectiveThumbThickness):this._tempMeasure.copyFromFloats(r,o+i,n,s-i):this.isThumbClamped&&this.displayThumb?this._tempMeasure.copyFromFloats(r,o,i+this._effectiveThumbThickness/2,s):this._tempMeasure.copyFromFloats(r,o,i,s),this._valueBarImage._draw(this._tempMeasure,e)),this.displayThumb&&(this.isVertical?this._tempMeasure.copyFromFloats(r-this._effectiveBarOffset,this._currentMeasure.top+i,this._currentMeasure.width,this._effectiveThumbThickness):this._tempMeasure.copyFromFloats(this._currentMeasure.left+i,this._currentMeasure.top,this._effectiveThumbThickness,this._currentMeasure.height),this._thumbImage._draw(this._tempMeasure,e))}e.restore()},e}(o.BaseSlider);e.ImageBasedSlider=s},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=i(1),o=i(7),n=i(6);e.name="Statics",r.Control.AddHeader=function(t,e,i,s){var a=new o.StackPanel("panel"),h=!s||s.isHorizontal,l=!s||s.controlFirst;a.isVertical=!h;var u=new n.TextBlock("header");return u.text=e,u.textHorizontalAlignment=r.Control.HORIZONTAL_ALIGNMENT_LEFT,h?u.width=i:u.height=i,l?(a.addControl(t),a.addControl(u),u.paddingLeft="5px"):(a.addControl(u),a.addControl(t),u.paddingRight="5px"),u.shadowBlur=t.shadowBlur,u.shadowColor=t.shadowColor,u.shadowOffsetX=t.shadowOffsetX,u.shadowOffsetY=t.shadowOffsetY,a}},function(t,e,i){"use strict";function r(t){for(var i in t)e.hasOwnProperty(i)||(e[i]=t[i])}Object.defineProperty(e,"__esModule",{value:!0}),r(i(43)),r(i(54)),r(i(55)),r(i(26))},function(t,e,i){"use strict";function r(t){for(var i in t)e.hasOwnProperty(i)||(e[i]=t[i])}Object.defineProperty(e,"__esModule",{value:!0}),r(i(25)),r(i(15)),r(i(3)),r(i(14)),r(i(44)),r(i(45)),r(i(49)),r(i(50)),r(i(51)),r(i(52)),r(i(53)),r(i(8))},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(8),n=i(0),s=i(3),a=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e._radius=5,e}return r(e,t),Object.defineProperty(e.prototype,"radius",{get:function(){return this._radius},set:function(t){var e=this;this._radius!==t&&(this._radius=t,n.Tools.SetImmediate(function(){e._arrangeChildren()}))},enumerable:!0,configurable:!0}),e.prototype._mapGridNode=function(t,e){var i=t.mesh;if(i){var r=this._cylindricalMapping(e);switch(t.position=r,this.orientation){case s.Container3D.FACEORIGIN_ORIENTATION:i.lookAt(new BABYLON.Vector3(-r.x,r.y,-r.z));break;case s.Container3D.FACEORIGINREVERSED_ORIENTATION:i.lookAt(new BABYLON.Vector3(2*r.x,r.y,2*r.z));break;case s.Container3D.FACEFORWARD_ORIENTATION:break;case s.Container3D.FACEFORWARDREVERSED_ORIENTATION:i.rotate(BABYLON.Axis.Y,Math.PI,BABYLON.Space.LOCAL)}}},e.prototype._cylindricalMapping=function(t){var e=new n.Vector3(0,t.y,this._radius),i=t.x/this._radius;return n.Matrix.RotationYawPitchRollToRef(i,0,0,n.Tmp.Matrix[0]),n.Vector3.TransformNormal(e,n.Tmp.Matrix[0])},e}(o.VolumeBasedPanel);e.CylinderPanel=a},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(15),n=i(0),s=i(27),a=i(7),h=i(11),l=i(6),u=i(13),c=function(t){function e(e,i){void 0===i&&(i=!0);var r=t.call(this,e)||this;return r._shareMaterials=!0,r._shareMaterials=i,r.pointerEnterAnimation=function(){r.mesh&&r._frontPlate.setEnabled(!0)},r.pointerOutAnimation=function(){r.mesh&&r._frontPlate.setEnabled(!1)},r}return r(e,t),e.prototype._disposeTooltip=function(){this._tooltipFade=null,this._tooltipTextBlock&&this._tooltipTextBlock.dispose(),this._tooltipTexture&&this._tooltipTexture.dispose(),this._tooltipMesh&&this._tooltipMesh.dispose(),this.onPointerEnterObservable.remove(this._tooltipHoverObserver),this.onPointerOutObservable.remove(this._tooltipOutObserver)},Object.defineProperty(e.prototype,"tooltipText",{get:function(){return this._tooltipTextBlock?this._tooltipTextBlock.text:null},set:function(t){var e=this;if(t){if(!this._tooltipFade){this._tooltipMesh=BABYLON.MeshBuilder.CreatePlane("",{size:1},this._backPlate._scene);var i=BABYLON.MeshBuilder.CreatePlane("",{size:1,sideOrientation:BABYLON.Mesh.DOUBLESIDE},this._backPlate._scene),r=new n.StandardMaterial("",this._backPlate._scene);r.diffuseColor=BABYLON.Color3.FromHexString("#212121"),i.material=r,i.isPickable=!1,this._tooltipMesh.addChild(i),i.position.z=.05,this._tooltipMesh.scaling.y=1/3,this._tooltipMesh.position.y=.7,this._tooltipMesh.position.z=-.15,this._tooltipMesh.isPickable=!1,this._tooltipMesh.parent=this._backPlate,this._tooltipTexture=u.AdvancedDynamicTexture.CreateForMesh(this._tooltipMesh),this._tooltipTextBlock=new l.TextBlock,this._tooltipTextBlock.scaleY=3,this._tooltipTextBlock.color="white",this._tooltipTextBlock.fontSize=130,this._tooltipTexture.addControl(this._tooltipTextBlock),this._tooltipFade=new BABYLON.FadeInOutBehavior,this._tooltipFade.delay=500,this._tooltipMesh.addBehavior(this._tooltipFade),this._tooltipHoverObserver=this.onPointerEnterObservable.add(function(){e._tooltipFade&&e._tooltipFade.fadeIn(!0)}),this._tooltipOutObserver=this.onPointerOutObservable.add(function(){e._tooltipFade&&e._tooltipFade.fadeIn(!1)})}this._tooltipTextBlock&&(this._tooltipTextBlock.text=t)}else this._disposeTooltip()},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"text",{get:function(){return this._text},set:function(t){this._text!==t&&(this._text=t,this._rebuildContent())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"imageUrl",{get:function(){return this._imageUrl},set:function(t){this._imageUrl!==t&&(this._imageUrl=t,this._rebuildContent())},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"backMaterial",{get:function(){return this._backMaterial},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"frontMaterial",{get:function(){return this._frontMaterial},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"plateMaterial",{get:function(){return this._plateMaterial},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"shareMaterials",{get:function(){return this._shareMaterials},enumerable:!0,configurable:!0}),e.prototype._getTypeName=function(){return"HolographicButton"},e.prototype._rebuildContent=function(){this._disposeFacadeTexture();var t=new a.StackPanel;if(t.isVertical=!0,this._imageUrl){var e=new h.Image;e.source=this._imageUrl,e.paddingTop="40px",e.height="180px",e.width="100px",e.paddingBottom="40px",t.addControl(e)}if(this._text){var i=new l.TextBlock;i.text=this._text,i.color="white",i.height="30px",i.fontSize=24,t.addControl(i)}this._frontPlate&&(this.content=t)},e.prototype._createNode=function(e){return this._backPlate=n.MeshBuilder.CreateBox(this.name+"BackMesh",{width:1,height:1,depth:.08},e),this._frontPlate=n.MeshBuilder.CreateBox(this.name+"FrontMesh",{width:1,height:1,depth:.08},e),this._frontPlate.parent=this._backPlate,this._frontPlate.position.z=-.08,this._frontPlate.isPickable=!1,this._frontPlate.setEnabled(!1),this._textPlate=t.prototype._createNode.call(this,e),this._textPlate.parent=this._backPlate,this._textPlate.position.z=-.08,this._textPlate.isPickable=!1,this._backPlate},e.prototype._applyFacade=function(t){this._plateMaterial.emissiveTexture=t,this._plateMaterial.opacityTexture=t},e.prototype._createBackMaterial=function(t){var e=this;this._backMaterial=new s.FluentMaterial(this.name+"Back Material",t.getScene()),this._backMaterial.renderHoverLight=!0,this._pickedPointObserver=this._host.onPickedPointChangedObservable.add(function(t){t?(e._backMaterial.hoverPosition=t,e._backMaterial.hoverColor.a=1):e._backMaterial.hoverColor.a=0})},e.prototype._createFrontMaterial=function(t){this._frontMaterial=new s.FluentMaterial(this.name+"Front Material",t.getScene()),this._frontMaterial.innerGlowColorIntensity=0,this._frontMaterial.alpha=.5,this._frontMaterial.renderBorders=!0},e.prototype._createPlateMaterial=function(t){this._plateMaterial=new n.StandardMaterial(this.name+"Plate Material",t.getScene()),this._plateMaterial.specularColor=n.Color3.Black()},e.prototype._affectMaterial=function(t){this._shareMaterials?(this._host._sharedMaterials.backFluentMaterial?this._backMaterial=this._host._sharedMaterials.backFluentMaterial:(this._createBackMaterial(t),this._host._sharedMaterials.backFluentMaterial=this._backMaterial),this._host._sharedMaterials.frontFluentMaterial?this._frontMaterial=this._host._sharedMaterials.frontFluentMaterial:(this._createFrontMaterial(t),this._host._sharedMaterials.frontFluentMaterial=this._frontMaterial)):(this._createBackMaterial(t),this._createFrontMaterial(t)),this._createPlateMaterial(t),this._backPlate.material=this._backMaterial,this._frontPlate.material=this._frontMaterial,this._textPlate.material=this._plateMaterial,this._rebuildContent()},e.prototype.dispose=function(){t.prototype.dispose.call(this),this._disposeTooltip(),this.shareMaterials||(this._backMaterial.dispose(),this._frontMaterial.dispose(),this._plateMaterial.dispose(),this._pickedPointObserver&&(this._host.onPickedPointChangedObservable.remove(this._pickedPointObserver),this._pickedPointObserver=null))},e}(o.Button3D);e.HolographicButton=c},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=i(0),o=i(47);e.fShader=o;var n=i(48);e.vShader=n,e.registerShader=function(){r.Effect.ShadersStore.fluentVertexShader=n,r.Effect.ShadersStore.fluentPixelShader=o}},function(t,e){t.exports="precision highp float;\nvarying vec2 vUV;\nuniform vec4 albedoColor;\n#ifdef INNERGLOW\nuniform vec4 innerGlowColor;\n#endif\n#ifdef BORDER\nvarying vec2 scaleInfo;\nuniform float edgeSmoothingValue;\nuniform float borderMinValue;\n#endif\n#ifdef HOVERLIGHT\nvarying vec3 worldPosition;\nuniform vec3 hoverPosition;\nuniform vec4 hoverColor;\nuniform float hoverRadius;\n#endif\n#ifdef TEXTURE\nuniform sampler2D albedoSampler;\n#endif\nvoid main(void) {\nvec3 albedo=albedoColor.rgb;\nfloat alpha=albedoColor.a;\n#ifdef TEXTURE\nalbedo=texture2D(albedoSampler,vUV).rgb;\n#endif\n#ifdef HOVERLIGHT\nfloat pointToHover=(1.0-clamp(length(hoverPosition-worldPosition)/hoverRadius,0.,1.))*hoverColor.a;\nalbedo=clamp(albedo+hoverColor.rgb*pointToHover,0.,1.);\n#else\nfloat pointToHover=1.0;\n#endif\n#ifdef BORDER \nfloat borderPower=10.0;\nfloat inverseBorderPower=1.0/borderPower;\nvec3 borderColor=albedo*borderPower;\nvec2 distanceToEdge;\ndistanceToEdge.x=abs(vUV.x-0.5)*2.0;\ndistanceToEdge.y=abs(vUV.y-0.5)*2.0;\nfloat borderValue=max(smoothstep(scaleInfo.x-edgeSmoothingValue,scaleInfo.x+edgeSmoothingValue,distanceToEdge.x),\nsmoothstep(scaleInfo.y-edgeSmoothingValue,scaleInfo.y+edgeSmoothingValue,distanceToEdge.y));\nborderColor=borderColor*borderValue*max(borderMinValue*inverseBorderPower,pointToHover); \nalbedo+=borderColor;\nalpha=max(alpha,borderValue);\n#endif\n#ifdef INNERGLOW\n\nvec2 uvGlow=(vUV-vec2(0.5,0.5))*(innerGlowColor.a*2.0);\nuvGlow=uvGlow*uvGlow;\nuvGlow=uvGlow*uvGlow;\nalbedo+=mix(vec3(0.0,0.0,0.0),innerGlowColor.rgb,uvGlow.x+uvGlow.y); \n#endif\ngl_FragColor=vec4(albedo,alpha);\n}"},function(t,e){t.exports="precision highp float;\n\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec2 uv;\n\nuniform mat4 world;\nuniform mat4 viewProjection;\nvarying vec2 vUV;\n#ifdef BORDER\nvarying vec2 scaleInfo;\nuniform float borderWidth;\nuniform vec3 scaleFactor;\n#endif\n#ifdef HOVERLIGHT\nvarying vec3 worldPosition;\n#endif\nvoid main(void) {\nvUV=uv;\n#ifdef BORDER\nvec3 scale=scaleFactor;\nfloat minScale=min(min(scale.x,scale.y),scale.z);\nfloat maxScale=max(max(scale.x,scale.y),scale.z);\nfloat minOverMiddleScale=minScale/(scale.x+scale.y+scale.z-minScale-maxScale);\nfloat areaYZ=scale.y*scale.z;\nfloat areaXZ=scale.x*scale.z;\nfloat areaXY=scale.x*scale.y;\nfloat scaledBorderWidth=borderWidth; \nif (abs(normal.x) == 1.0) \n{\nscale.x=scale.y;\nscale.y=scale.z;\nif (areaYZ>areaXZ && areaYZ>areaXY)\n{\nscaledBorderWidth*=minOverMiddleScale;\n}\n}\nelse if (abs(normal.y) == 1.0) \n{\nscale.x=scale.z;\nif (areaXZ>areaXY && areaXZ>areaYZ)\n{\nscaledBorderWidth*=minOverMiddleScale;\n}\n}\nelse \n{\nif (areaXY>areaYZ && areaXY>areaXZ)\n{\nscaledBorderWidth*=minOverMiddleScale;\n}\n}\nfloat scaleRatio=min(scale.x,scale.y)/max(scale.x,scale.y);\nif (scale.x>scale.y)\n{\nscaleInfo.x=1.0-(scaledBorderWidth*scaleRatio);\nscaleInfo.y=1.0-scaledBorderWidth;\n}\nelse\n{\nscaleInfo.x=1.0-scaledBorderWidth;\nscaleInfo.y=1.0-(scaledBorderWidth*scaleRatio);\n} \n#endif \nvec4 worldPos=world*vec4(position,1.0);\n#ifdef HOVERLIGHT\nworldPosition=worldPos.xyz;\n#endif\ngl_Position=viewProjection*worldPos;\n}\n"},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=function(t){function e(e,i){var r=t.call(this,i)||this;return r._currentMesh=e,r.pointerEnterAnimation=function(){r.mesh&&r.mesh.scaling.scaleInPlace(1.1)},r.pointerOutAnimation=function(){r.mesh&&r.mesh.scaling.scaleInPlace(1/1.1)},r.pointerDownAnimation=function(){r.mesh&&r.mesh.scaling.scaleInPlace(.95)},r.pointerUpAnimation=function(){r.mesh&&r.mesh.scaling.scaleInPlace(1/.95)},r}return r(e,t),e.prototype._getTypeName=function(){return"MeshButton3D"},e.prototype._createNode=function(t){var e=this;return this._currentMesh.getChildMeshes().forEach(function(t){t.metadata=e}),this._currentMesh},e.prototype._affectMaterial=function(t){},e}(i(15).Button3D);e.MeshButton3D=o},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(0),n=i(3),s=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r(e,t),e.prototype._mapGridNode=function(t,e){var i=t.mesh;if(i){t.position=e.clone();var r=o.Tmp.Vector3[0];switch(r.copyFrom(e),this.orientation){case n.Container3D.FACEORIGIN_ORIENTATION:case n.Container3D.FACEFORWARD_ORIENTATION:r.addInPlace(new BABYLON.Vector3(0,0,-1)),i.lookAt(r);break;case n.Container3D.FACEFORWARDREVERSED_ORIENTATION:case n.Container3D.FACEORIGINREVERSED_ORIENTATION:r.addInPlace(new BABYLON.Vector3(0,0,1)),i.lookAt(r)}}},e}(i(8).VolumeBasedPanel);e.PlanePanel=s},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(8),n=i(0),s=i(3),a=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e._iteration=100,e}return r(e,t),Object.defineProperty(e.prototype,"iteration",{get:function(){return this._iteration},set:function(t){var e=this;this._iteration!==t&&(this._iteration=t,n.Tools.SetImmediate(function(){e._arrangeChildren()}))},enumerable:!0,configurable:!0}),e.prototype._mapGridNode=function(t,e){var i=t.mesh,r=this._scatterMapping(e);if(i){switch(this.orientation){case s.Container3D.FACEORIGIN_ORIENTATION:case s.Container3D.FACEFORWARD_ORIENTATION:i.lookAt(new n.Vector3(0,0,-1));break;case s.Container3D.FACEFORWARDREVERSED_ORIENTATION:case s.Container3D.FACEORIGINREVERSED_ORIENTATION:i.lookAt(new n.Vector3(0,0,1))}t.position=r}},e.prototype._scatterMapping=function(t){return t.x=(1-2*Math.random())*this._cellWidth,t.y=(1-2*Math.random())*this._cellHeight,t},e.prototype._finalProcessing=function(){for(var t=[],e=0,i=this._children;e<i.length;e++){var r=i[e];r.mesh&&t.push(r.mesh)}for(var o=0;o<this._iteration;o++){t.sort(function(t,e){var i=t.position.lengthSquared(),r=e.position.lengthSquared();return i<r?1:i>r?-1:0});for(var s=Math.pow(this.margin,2),a=Math.max(this._cellWidth,this._cellHeight),h=n.Tmp.Vector2[0],l=n.Tmp.Vector3[0],u=0;u<t.length-1;u++)for(var c=u+1;c<t.length;c++)if(u!=c){t[c].position.subtractToRef(t[u].position,l),h.x=l.x,h.y=l.y;var _=a,f=h.lengthSquared()-s;(f-=Math.min(f,s))<Math.pow(_,2)&&(h.normalize(),l.scaleInPlace(.5*(_-Math.sqrt(f))),t[c].position.addInPlace(l),t[u].position.subtractInPlace(l))}}},e}(o.VolumeBasedPanel);e.ScatterPanel=a},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(8),n=i(0),s=i(3),a=function(t){function e(){var e=null!==t&&t.apply(this,arguments)||this;return e._radius=5,e}return r(e,t),Object.defineProperty(e.prototype,"radius",{get:function(){return this._radius},set:function(t){var e=this;this._radius!==t&&(this._radius=t,n.Tools.SetImmediate(function(){e._arrangeChildren()}))},enumerable:!0,configurable:!0}),e.prototype._mapGridNode=function(t,e){var i=t.mesh;if(i){var r=this._sphericalMapping(e);switch(t.position=r,this.orientation){case s.Container3D.FACEORIGIN_ORIENTATION:i.lookAt(new BABYLON.Vector3(-r.x,-r.y,-r.z));break;case s.Container3D.FACEORIGINREVERSED_ORIENTATION:i.lookAt(new BABYLON.Vector3(2*r.x,2*r.y,2*r.z));break;case s.Container3D.FACEFORWARD_ORIENTATION:break;case s.Container3D.FACEFORWARDREVERSED_ORIENTATION:i.rotate(BABYLON.Axis.Y,Math.PI,BABYLON.Space.LOCAL)}}},e.prototype._sphericalMapping=function(t){var e=new n.Vector3(0,0,this._radius),i=t.y/this._radius,r=-t.x/this._radius;return n.Matrix.RotationYawPitchRollToRef(r,i,0,n.Tmp.Matrix[0]),n.Vector3.TransformNormal(e,n.Tmp.Matrix[0])},e}(o.VolumeBasedPanel);e.SpherePanel=a},function(t,e,i){"use strict";var r=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=i(3),n=i(0),s=function(t){function e(e){void 0===e&&(e=!1);var i=t.call(this)||this;return i._isVertical=!1,i.margin=.1,i._isVertical=e,i}return r(e,t),Object.defineProperty(e.prototype,"isVertical",{get:function(){return this._isVertical},set:function(t){var e=this;this._isVertical!==t&&(this._isVertical=t,n.Tools.SetImmediate(function(){e._arrangeChildren()}))},enumerable:!0,configurable:!0}),e.prototype._arrangeChildren=function(){for(var t,e=0,i=0,r=0,o=[],s=n.Matrix.Invert(this.node.computeWorldMatrix(!0)),a=0,h=this._children;a<h.length;a++){if((p=h[a]).mesh){r++,p.mesh.computeWorldMatrix(!0),p.mesh.getWorldMatrix().multiplyToRef(s,n.Tmp.Matrix[0]);var l=p.mesh.getBoundingInfo().boundingBox,u=n.Vector3.TransformNormal(l.extendSize,n.Tmp.Matrix[0]);o.push(u),this._isVertical?i+=u.y:e+=u.x}}this._isVertical?i+=(r-1)*this.margin/2:e+=(r-1)*this.margin/2,t=this._isVertical?-i:-e;for(var c=0,_=0,f=this._children;_<f.length;_++){var p;if((p=f[_]).mesh){r--;u=o[c++];this._isVertical?(p.position.y=t+u.y,p.position.x=0,t+=2*u.y):(p.position.x=t+u.x,p.position.y=0,t+=2*u.x),t+=r>0?this.margin:0}}},e}(o.Container3D);e.StackPanel3D=s},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),function(t){for(var i in t)e.hasOwnProperty(i)||(e[i]=t[i])}(i(27))},function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=i(0),o=i(3),n=function(){function t(t){var e=this;this._lastControlOver={},this._lastControlDown={},this.onPickedPointChangedObservable=new r.Observable,this._sharedMaterials={},this._scene=t||r.Engine.LastCreatedScene,this._sceneDisposeObserver=this._scene.onDisposeObservable.add(function(){e._sceneDisposeObserver=null,e._utilityLayer=null,e.dispose()}),this._utilityLayer=new r.UtilityLayerRenderer(this._scene),this._utilityLayer.onlyCheckPointerDownEvents=!1,this._utilityLayer.mainSceneTrackerPredicate=function(t){return t&&t.metadata&&t.metadata._node},this._rootContainer=new o.Container3D("RootContainer"),this._rootContainer._host=this;var i=this._utilityLayer.utilityLayerScene;this._pointerOutObserver=this._utilityLayer.onPointerOutObservable.add(function(t){e._handlePointerOut(t,!0)}),this._pointerObserver=i.onPointerObservable.add(function(t,i){e._doPicking(t)}),this._utilityLayer.utilityLayerScene.autoClear=!1,this._utilityLayer.utilityLayerScene.autoClearDepthAndStencil=!1,new r.HemisphericLight("hemi",r.Vector3.Up(),this._utilityLayer.utilityLayerScene)}return Object.defineProperty(t.prototype,"scene",{get:function(){return this._scene},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"utilityLayer",{get:function(){return this._utilityLayer},enumerable:!0,configurable:!0}),t.prototype._handlePointerOut=function(t,e){var i=this._lastControlOver[t];i&&(i._onPointerOut(i),delete this._lastControlOver[t]),e&&this._lastControlDown[t]&&(this._lastControlDown[t].forcePointerUp(),delete this._lastControlDown[t]),this.onPickedPointChangedObservable.notifyObservers(null)},t.prototype._doPicking=function(t){if(!this._utilityLayer||!this._utilityLayer.utilityLayerScene.activeCamera)return!1;var e=t.event,i=e.pointerId||0,o=e.button,n=t.pickInfo;if(!n||!n.hit)return this._handlePointerOut(i,t.type===r.PointerEventTypes.POINTERUP),!1;var s=n.pickedMesh.metadata;return n.pickedPoint&&this.onPickedPointChangedObservable.notifyObservers(n.pickedPoint),s._processObservables(t.type,n.pickedPoint,i,o)||t.type===r.PointerEventTypes.POINTERMOVE&&(this._lastControlOver[i]&&this._lastControlOver[i]._onPointerOut(this._lastControlOver[i]),delete this._lastControlOver[i]),t.type===r.PointerEventTypes.POINTERUP&&(this._lastControlDown[e.pointerId]&&(this._lastControlDown[e.pointerId].forcePointerUp(),delete this._lastControlDown[e.pointerId]),"touch"===e.pointerType&&this._handlePointerOut(i,!1)),!0},Object.defineProperty(t.prototype,"rootContainer",{get:function(){return this._rootContainer},enumerable:!0,configurable:!0}),t.prototype.containsControl=function(t){return this._rootContainer.containsControl(t)},t.prototype.addControl=function(t){return this._rootContainer.addControl(t),this},t.prototype.removeControl=function(t){return this._rootContainer.removeControl(t),this},t.prototype.dispose=function(){for(var t in this._rootContainer.dispose(),this._sharedMaterials)this._sharedMaterials.hasOwnProperty(t)&&this._sharedMaterials[t].dispose();this._sharedMaterials={},this._pointerOutObserver&&this._utilityLayer&&(this._utilityLayer.onPointerOutObservable.remove(this._pointerOutObserver),this._pointerOutObserver=null),this.onPickedPointChangedObservable.clear();var e=this._utilityLayer?this._utilityLayer.utilityLayerScene:null;e&&this._pointerObserver&&(e.onPointerObservable.remove(this._pointerObserver),this._pointerObserver=null),this._scene&&this._sceneDisposeObserver&&(this._scene.onDisposeObservable.remove(this._sceneDisposeObserver),this._sceneDisposeObserver=null),this._utilityLayer&&this._utilityLayer.dispose()},t}();e.GUI3DManager=n}])});
//# sourceMappingURL=babylon.gui.min.js.map
>>>>>>> upstream/master
