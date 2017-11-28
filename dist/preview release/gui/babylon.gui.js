var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
var babylonDependency = (globalObject && globalObject.BABYLON) || BABYLON || (typeof require !== 'undefined' && require("babylonjs"));
var BABYLON = babylonDependency;
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __extends = (this && this.__extends) || (function () {
            var extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return function (d, b) {
                extendStatics(d, b);
                function __() { this.constructor = d; }
                d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
            };
        })();
        /// <reference path="../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var AdvancedDynamicTexture = /** @class */ (function (_super) {
            __extends(AdvancedDynamicTexture, _super);
            function AdvancedDynamicTexture(name, width, height, scene, generateMipMaps, samplingMode) {
                if (width === void 0) { width = 0; }
                if (height === void 0) { height = 0; }
                if (generateMipMaps === void 0) { generateMipMaps = false; }
                if (samplingMode === void 0) { samplingMode = BABYLON.Texture.NEAREST_SAMPLINGMODE; }
                var _this = _super.call(this, name, { width: width, height: height }, scene, generateMipMaps, samplingMode, BABYLON.Engine.TEXTUREFORMAT_RGBA) || this;
                _this._isDirty = false;
                _this._rootContainer = new GUI.Container("root");
                _this._linkedControls = new Array();
                _this._isFullscreen = false;
                _this._fullscreenViewport = new BABYLON.Viewport(0, 0, 1, 1);
                _this._idealWidth = 0;
                _this._idealHeight = 0;
                _this._renderAtIdealSize = false;
                _this._blockNextFocusCheck = false;
                _this._renderScale = 1;
                scene = _this.getScene();
                if (!scene || !_this._texture) {
                    return _this;
                }
                _this._renderObserver = scene.onBeforeCameraRenderObservable.add(function (camera) { return _this._checkUpdate(camera); });
                _this._preKeyboardObserver = scene.onPreKeyboardObservable.add(function (info) {
                    if (!_this._focusedControl) {
                        return;
                    }
                    if (info.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
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
            Object.defineProperty(AdvancedDynamicTexture.prototype, "renderAtIdealSize", {
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
                get: function () {
                    return this._layerToDispose;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AdvancedDynamicTexture.prototype, "rootContainer", {
                get: function () {
                    return this._rootContainer;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AdvancedDynamicTexture.prototype, "focusedControl", {
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
            AdvancedDynamicTexture.prototype.executeOnAllControls = function (func, container) {
                if (!container) {
                    container = this._rootContainer;
                }
                for (var _i = 0, _a = container.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    if (child.children) {
                        this.executeOnAllControls(func, child);
                        continue;
                    }
                    func(child);
                }
            };
            AdvancedDynamicTexture.prototype.markAsDirty = function () {
                this._isDirty = true;
            };
            AdvancedDynamicTexture.prototype.addControl = function (control) {
                this._rootContainer.addControl(control);
                return this;
            };
            AdvancedDynamicTexture.prototype.removeControl = function (control) {
                this._rootContainer.removeControl(control);
                return this;
            };
            AdvancedDynamicTexture.prototype.dispose = function () {
                var scene = this.getScene();
                if (!scene) {
                    return;
                }
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
            AdvancedDynamicTexture.prototype._getGlobalViewport = function (scene) {
                var engine = scene.getEngine();
                return this._fullscreenViewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
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
                            BABYLON.Tools.SetImmediate(function () {
                                control.linkWithMesh(null);
                            });
                            continue;
                        }
                        var position = mesh.getBoundingInfo().boundingSphere.center;
                        var projectedPosition = BABYLON.Vector3.Project(position, mesh.getWorldMatrix(), scene.getTransformMatrix(), globalViewport);
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
                this.update();
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
                var measure = new GUI.Measure(0, 0, renderWidth, renderHeight);
                this._rootContainer._draw(measure, context);
            };
            AdvancedDynamicTexture.prototype._doPicking = function (x, y, type, buttonIndex) {
                var scene = this.getScene();
                if (!scene) {
                    return;
                }
                var engine = scene.getEngine();
                var textureSize = this.getSize();
                if (this._isFullscreen) {
                    x = x * ((textureSize.width / this._renderScale) / engine.getRenderWidth());
                    y = y * ((textureSize.height / this._renderScale) / engine.getRenderHeight());
                }
                if (this._capturingControl) {
                    this._capturingControl._processObservables(type, x, y, buttonIndex);
                    return;
                }
                if (!this._rootContainer._processPicking(x, y, type, buttonIndex)) {
                    if (type === BABYLON.PointerEventTypes.POINTERMOVE) {
                        if (this._lastControlOver) {
                            this._lastControlOver._onPointerOut(this._lastControlOver);
                        }
                        this._lastControlOver = null;
                    }
                }
                this._manageFocus();
            };
            AdvancedDynamicTexture.prototype.attach = function () {
                var _this = this;
                var scene = this.getScene();
                if (!scene) {
                    return;
                }
                this._pointerMoveObserver = scene.onPrePointerObservable.add(function (pi, state) {
                    if (pi.type !== BABYLON.PointerEventTypes.POINTERMOVE
                        && pi.type !== BABYLON.PointerEventTypes.POINTERUP
                        && pi.type !== BABYLON.PointerEventTypes.POINTERDOWN) {
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
                    _this._doPicking(x, y, pi.type, pi.event.button);
                    pi.skipOnPointerObservable = _this._shouldBlockPointer;
                });
                this._attachToOnPointerOut(scene);
            };
            AdvancedDynamicTexture.prototype.attachToMesh = function (mesh, supportPointerMove) {
                var _this = this;
                if (supportPointerMove === void 0) { supportPointerMove = true; }
                var scene = this.getScene();
                if (!scene) {
                    return;
                }
                this._pointerObserver = scene.onPointerObservable.add(function (pi, state) {
                    if (pi.type !== BABYLON.PointerEventTypes.POINTERMOVE
                        && pi.type !== BABYLON.PointerEventTypes.POINTERUP
                        && pi.type !== BABYLON.PointerEventTypes.POINTERDOWN) {
                        return;
                    }
                    if (pi.pickInfo && pi.pickInfo.hit && pi.pickInfo.pickedMesh === mesh) {
                        var uv = pi.pickInfo.getTextureCoordinates();
                        if (uv) {
                            var size = _this.getSize();
                            _this._doPicking(uv.x * size.width, (1.0 - uv.y) * size.height, pi.type, pi.event.button);
                        }
                    }
                    else if (pi.type === BABYLON.PointerEventTypes.POINTERUP) {
                        if (_this._lastControlDown) {
                            _this._lastControlDown.forcePointerUp();
                        }
                        _this._lastControlDown = null;
                        _this.focusedControl = null;
                    }
                    else if (pi.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                        if (_this._lastControlOver) {
                            _this._lastControlOver._onPointerOut(_this._lastControlOver);
                        }
                        _this._lastControlOver = null;
                    }
                });
                mesh.enablePointerMoveEvents = supportPointerMove;
                this._attachToOnPointerOut(scene);
            };
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
                this._canvasPointerOutObserver = scene.getEngine().onCanvasPointerOutObservable.add(function () {
                    if (_this._lastControlOver) {
                        _this._lastControlOver._onPointerOut(_this._lastControlOver);
                    }
                    _this._lastControlOver = null;
                    if (_this._lastControlDown) {
                        _this._lastControlDown.forcePointerUp();
                    }
                    _this._lastControlDown = null;
                });
            };
            // Statics
            AdvancedDynamicTexture.CreateForMesh = function (mesh, width, height, supportPointerMove) {
                if (width === void 0) { width = 1024; }
                if (height === void 0) { height = 1024; }
                if (supportPointerMove === void 0) { supportPointerMove = true; }
                var result = new AdvancedDynamicTexture(mesh.name + " AdvancedDynamicTexture", width, height, mesh.getScene(), true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
                var material = new BABYLON.StandardMaterial("AdvancedDynamicTextureMaterial", mesh.getScene());
                material.backFaceCulling = false;
                material.diffuseColor = BABYLON.Color3.Black();
                material.specularColor = BABYLON.Color3.Black();
                material.emissiveTexture = result;
                material.opacityTexture = result;
                mesh.material = material;
                result.attachToMesh(mesh, supportPointerMove);
                return result;
            };
            AdvancedDynamicTexture.CreateFullscreenUI = function (name, foreground, scene, sampling) {
                if (foreground === void 0) { foreground = true; }
                if (scene === void 0) { scene = null; }
                if (sampling === void 0) { sampling = BABYLON.Texture.BILINEAR_SAMPLINGMODE; }
                var result = new AdvancedDynamicTexture(name, 0, 0, scene, false, sampling);
                // Display
                var layer = new BABYLON.Layer(name + "_layer", null, scene, !foreground);
                layer.texture = result;
                result._layerToDispose = layer;
                result._isFullscreen = true;
                // Attach
                result.attach();
                return result;
            };
            return AdvancedDynamicTexture;
        }(BABYLON.DynamicTexture));
        GUI.AdvancedDynamicTexture = AdvancedDynamicTexture;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=advancedDynamicTexture.js.map

/// <reference path="../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Measure = /** @class */ (function () {
            function Measure(left, top, width, height) {
                this.left = left;
                this.top = top;
                this.width = width;
                this.height = height;
            }
            Measure.prototype.copyFrom = function (other) {
                this.left = other.left;
                this.top = other.top;
                this.width = other.width;
                this.height = other.height;
            };
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
            Measure.Empty = function () {
                return new Measure(0, 0, 0, 0);
            };
            return Measure;
        }());
        GUI.Measure = Measure;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=measure.js.map

/// <reference path="../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Vector2WithInfo = /** @class */ (function (_super) {
            __extends(Vector2WithInfo, _super);
            function Vector2WithInfo(source, buttonIndex) {
                if (buttonIndex === void 0) { buttonIndex = 0; }
                var _this = _super.call(this, source.x, source.y) || this;
                _this.buttonIndex = buttonIndex;
                return _this;
            }
            return Vector2WithInfo;
        }(BABYLON.Vector2));
        GUI.Vector2WithInfo = Vector2WithInfo;
        var Matrix2D = /** @class */ (function () {
            function Matrix2D(m00, m01, m10, m11, m20, m21) {
                this.m = new Float32Array(6);
                this.fromValues(m00, m01, m10, m11, m20, m21);
            }
            Matrix2D.prototype.fromValues = function (m00, m01, m10, m11, m20, m21) {
                this.m[0] = m00;
                this.m[1] = m01;
                this.m[2] = m10;
                this.m[3] = m11;
                this.m[4] = m20;
                this.m[5] = m21;
                return this;
            };
            Matrix2D.prototype.determinant = function () {
                return this.m[0] * this.m[3] - this.m[1] * this.m[2];
            };
            Matrix2D.prototype.invertToRef = function (result) {
                var l0 = this.m[0];
                var l1 = this.m[1];
                var l2 = this.m[2];
                var l3 = this.m[3];
                var l4 = this.m[4];
                var l5 = this.m[5];
                var det = this.determinant();
                if (det < (BABYLON.Epsilon * BABYLON.Epsilon)) {
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
            Matrix2D.prototype.transformCoordinates = function (x, y, result) {
                result.x = x * this.m[0] + y * this.m[2] + this.m[4];
                result.y = x * this.m[1] + y * this.m[3] + this.m[5];
                return this;
            };
            // Statics
            Matrix2D.Identity = function () {
                return new Matrix2D(1, 0, 0, 1, 0, 0);
            };
            Matrix2D.TranslationToRef = function (x, y, result) {
                result.fromValues(1, 0, 0, 1, x, y);
            };
            Matrix2D.ScalingToRef = function (x, y, result) {
                result.fromValues(x, 0, 0, y, 0, 0);
            };
            Matrix2D.RotationToRef = function (angle, result) {
                var s = Math.sin(angle);
                var c = Math.cos(angle);
                result.fromValues(c, s, -s, c, 0, 0);
            };
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
        GUI.Matrix2D = Matrix2D;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=math2D.js.map

/// <reference path="../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var ValueAndUnit = /** @class */ (function () {
            function ValueAndUnit(value, unit, negativeValueAllowed) {
                if (unit === void 0) { unit = ValueAndUnit.UNITMODE_PIXEL; }
                if (negativeValueAllowed === void 0) { negativeValueAllowed = true; }
                this.unit = unit;
                this.negativeValueAllowed = negativeValueAllowed;
                this._value = 1;
                this.ignoreAdaptiveScaling = false;
                this._value = value;
            }
            Object.defineProperty(ValueAndUnit.prototype, "isPercentage", {
                get: function () {
                    return this.unit === ValueAndUnit.UNITMODE_PERCENTAGE;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ValueAndUnit.prototype, "isPixel", {
                get: function () {
                    return this.unit === ValueAndUnit.UNITMODE_PIXEL;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ValueAndUnit.prototype, "internalValue", {
                get: function () {
                    return this._value;
                },
                enumerable: true,
                configurable: true
            });
            ValueAndUnit.prototype.getValueInPixel = function (host, refValue) {
                if (this.isPixel) {
                    return this.getValue(host);
                }
                return this.getValue(host) * refValue;
            };
            ValueAndUnit.prototype.getValue = function (host) {
                if (host && !this.ignoreAdaptiveScaling && this.unit !== ValueAndUnit.UNITMODE_PERCENTAGE) {
                    if (host.idealWidth) {
                        return (this._value * host.getSize().width) / host.idealWidth;
                    }
                    if (host.idealHeight) {
                        return (this._value * host.getSize().height) / host.idealHeight;
                    }
                }
                return this._value;
            };
            ValueAndUnit.prototype.toString = function (host) {
                switch (this.unit) {
                    case ValueAndUnit.UNITMODE_PERCENTAGE:
                        return (this.getValue(host) * 100) + "%";
                    case ValueAndUnit.UNITMODE_PIXEL:
                        return this.getValue(host) + "px";
                }
                return this.unit.toString();
            };
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
                get: function () {
                    return ValueAndUnit._UNITMODE_PERCENTAGE;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ValueAndUnit, "UNITMODE_PIXEL", {
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
        GUI.ValueAndUnit = ValueAndUnit;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=valueAndUnit.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Control = /** @class */ (function () {
            // Functions
            function Control(name) {
                this.name = name;
                this._alpha = 1;
                this._alphaSet = false;
                this._zIndex = 0;
                this._currentMeasure = GUI.Measure.Empty();
                this._fontFamily = "Arial";
                this._fontStyle = "";
                this._fontSize = new GUI.ValueAndUnit(18, GUI.ValueAndUnit.UNITMODE_PIXEL, false);
                this._width = new GUI.ValueAndUnit(1, GUI.ValueAndUnit.UNITMODE_PERCENTAGE, false);
                this._height = new GUI.ValueAndUnit(1, GUI.ValueAndUnit.UNITMODE_PERCENTAGE, false);
                this._color = "";
                this._horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                this._verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                this._isDirty = true;
                this._cachedParentMeasure = GUI.Measure.Empty();
                this._paddingLeft = new GUI.ValueAndUnit(0);
                this._paddingRight = new GUI.ValueAndUnit(0);
                this._paddingTop = new GUI.ValueAndUnit(0);
                this._paddingBottom = new GUI.ValueAndUnit(0);
                this._left = new GUI.ValueAndUnit(0);
                this._top = new GUI.ValueAndUnit(0);
                this._scaleX = 1.0;
                this._scaleY = 1.0;
                this._rotation = 0;
                this._transformCenterX = 0.5;
                this._transformCenterY = 0.5;
                this._transformMatrix = GUI.Matrix2D.Identity();
                this._invertTransformMatrix = GUI.Matrix2D.Identity();
                this._transformedPosition = BABYLON.Vector2.Zero();
                this._isMatrixDirty = true;
                this._isVisible = true;
                this._fontSet = false;
                this._dummyVector2 = BABYLON.Vector2.Zero();
                this._downCount = 0;
                this._enterCount = 0;
                this._doNotRender = false;
                this.isHitTestVisible = true;
                this.isPointerBlocker = false;
                this.isFocusInvisible = false;
                this.shadowOffsetX = 0;
                this.shadowOffsetY = 0;
                this.shadowBlur = 0;
                this.shadowColor = '#000';
                this._linkOffsetX = new GUI.ValueAndUnit(0);
                this._linkOffsetY = new GUI.ValueAndUnit(0);
                /**
                * An event triggered when the pointer move over the control.
                * @type {BABYLON.Observable}
                */
                this.onPointerMoveObservable = new BABYLON.Observable();
                /**
                * An event triggered when the pointer move out of the control.
                * @type {BABYLON.Observable}
                */
                this.onPointerOutObservable = new BABYLON.Observable();
                /**
                * An event triggered when the pointer taps the control
                * @type {BABYLON.Observable}
                */
                this.onPointerDownObservable = new BABYLON.Observable();
                /**
                * An event triggered when pointer up
                * @type {BABYLON.Observable}
                */
                this.onPointerUpObservable = new BABYLON.Observable();
                /**
                * An event triggered when pointer enters the control
                * @type {BABYLON.Observable}
                */
                this.onPointerEnterObservable = new BABYLON.Observable();
                /**
                * An event triggered when the control is marked as dirty
                * @type {BABYLON.Observable}
                */
                this.onDirtyObservable = new BABYLON.Observable();
                /**
               * An event triggered after the control is drawn
               * @type {BABYLON.Observable}
               */
                this.onAfterDrawObservable = new BABYLON.Observable();
            }
            Object.defineProperty(Control.prototype, "typeName", {
                // Properties
                get: function () {
                    return this._getTypeName();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "alpha", {
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
                get: function () {
                    return this._width.getValueInPixel(this._host, this._cachedParentMeasure.width);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "height", {
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
                get: function () {
                    return this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "fontFamily", {
                get: function () {
                    return this._fontFamily;
                },
                set: function (value) {
                    if (this._fontFamily === value) {
                        return;
                    }
                    this._fontFamily = value;
                    this._fontSet = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "fontStyle", {
                get: function () {
                    return this._fontStyle;
                },
                set: function (value) {
                    if (this._fontStyle === value) {
                        return;
                    }
                    this._fontStyle = value;
                    this._fontSet = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "fontSizeInPixels", {
                get: function () {
                    return this._fontSize.getValueInPixel(this._host, 100);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "fontSize", {
                get: function () {
                    return this._fontSize.toString(this._host);
                },
                set: function (value) {
                    if (this._fontSize.toString(this._host) === value) {
                        return;
                    }
                    if (this._fontSize.fromString(value)) {
                        this._markAsDirty();
                        this._fontSet = true;
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "color", {
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
                get: function () {
                    return this._isVisible;
                },
                set: function (value) {
                    if (this._isVisible === value) {
                        return;
                    }
                    this._isVisible = value;
                    this._markAsDirty();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "isDirty", {
                get: function () {
                    return this._isDirty;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "paddingLeft", {
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
                get: function () {
                    return this._paddingLeft.getValueInPixel(this._host, this._cachedParentMeasure.width);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "paddingRight", {
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
                get: function () {
                    return this._paddingRight.getValueInPixel(this._host, this._cachedParentMeasure.width);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "paddingTop", {
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
                get: function () {
                    return this._paddingTop.getValueInPixel(this._host, this._cachedParentMeasure.height);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "paddingBottom", {
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
                get: function () {
                    return this._paddingBottom.getValueInPixel(this._host, this._cachedParentMeasure.height);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "left", {
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
                get: function () {
                    return this._left.getValueInPixel(this._host, this._cachedParentMeasure.width);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "top", {
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
                get: function () {
                    return this._top.getValueInPixel(this._host, this._cachedParentMeasure.height);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "linkOffsetX", {
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
                get: function () {
                    return this._linkOffsetX.getValueInPixel(this._host, this._cachedParentMeasure.width);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "linkOffsetY", {
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
                get: function () {
                    return this._linkOffsetY.getValueInPixel(this._host, this._cachedParentMeasure.height);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "centerX", {
                get: function () {
                    return this._currentMeasure.left + this._currentMeasure.width / 2;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "centerY", {
                get: function () {
                    return this._currentMeasure.top + this._currentMeasure.height / 2;
                },
                enumerable: true,
                configurable: true
            });
            Control.prototype._getTypeName = function () {
                return "Control";
            };
            Control.prototype.getLocalCoordinates = function (globalCoordinates) {
                var result = BABYLON.Vector2.Zero();
                this.getLocalCoordinatesToRef(globalCoordinates, result);
                return result;
            };
            Control.prototype.getLocalCoordinatesToRef = function (globalCoordinates, result) {
                result.x = globalCoordinates.x - this._currentMeasure.left;
                result.y = globalCoordinates.y - this._currentMeasure.top;
                return this;
            };
            Control.prototype.getParentLocalCoordinates = function (globalCoordinates) {
                var result = BABYLON.Vector2.Zero();
                result.x = globalCoordinates.x - this._cachedParentMeasure.left;
                result.y = globalCoordinates.y - this._cachedParentMeasure.top;
                return result;
            };
            Control.prototype.moveToVector3 = function (position, scene) {
                if (!this._host || this._root !== this._host._rootContainer) {
                    BABYLON.Tools.Error("Cannot move a control to a vector3 if the control is not at root level");
                    return;
                }
                this.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                this.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                var globalViewport = this._host._getGlobalViewport(scene);
                var projectedPosition = BABYLON.Vector3.Project(position, BABYLON.Matrix.Identity(), scene.getTransformMatrix(), globalViewport);
                this._moveToProjectedPosition(projectedPosition);
                if (projectedPosition.z < 0 || projectedPosition.z > 1) {
                    this.notRenderable = true;
                    return;
                }
                this.notRenderable = false;
            };
            Control.prototype.linkWithMesh = function (mesh) {
                if (!this._host || this._root !== this._host._rootContainer) {
                    BABYLON.Tools.Error("Cannot link a control to a mesh if the control is not at root level");
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
                this.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                this.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                this._linkedMesh = mesh;
                this._host._linkedControls.push(this);
            };
            Control.prototype._moveToProjectedPosition = function (projectedPosition) {
                this.left = ((projectedPosition.x + this._linkOffsetX.getValue(this._host)) - this._currentMeasure.width / 2) + "px";
                this.top = ((projectedPosition.y + this._linkOffsetY.getValue(this._host)) - this._currentMeasure.height / 2) + "px";
                this._left.ignoreAdaptiveScaling = true;
                this._top.ignoreAdaptiveScaling = true;
            };
            Control.prototype._markMatrixAsDirty = function () {
                this._isMatrixDirty = true;
                this._markAsDirty();
            };
            Control.prototype._markAsDirty = function () {
                this._isDirty = true;
                if (!this._host) {
                    return; // Not yet connected
                }
                this._host.markAsDirty();
            };
            Control.prototype._markAllAsDirty = function () {
                this._markAsDirty();
                if (this._font) {
                    this._prepareFont();
                }
            };
            Control.prototype._link = function (root, host) {
                this._root = root;
                this._host = host;
            };
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
                    GUI.Matrix2D.ComposeToRef(-offsetX, -offsetY, this._rotation, this._scaleX, this._scaleY, this._root ? this._root._transformMatrix : null, this._transformMatrix);
                    this._transformMatrix.invertToRef(this._invertTransformMatrix);
                }
            };
            Control.prototype._applyStates = function (context) {
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
                    context.globalAlpha = this._alpha;
                }
            };
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
                // Clip
                this._clip(context);
                context.clip();
                return true;
            };
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
            Control.prototype._preMeasure = function (parentMeasure, context) {
                // Do nothing
            };
            Control.prototype._additionalProcessing = function (parentMeasure, context) {
                // Do nothing
            };
            Control.prototype._draw = function (parentMeasure, context) {
                // Do nothing
            };
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
            Control.prototype._processPicking = function (x, y, type, buttonIndex) {
                if (!this.isHitTestVisible || !this.isVisible || this._doNotRender) {
                    return false;
                }
                if (!this.contains(x, y)) {
                    return false;
                }
                this._processObservables(type, x, y, buttonIndex);
                return true;
            };
            Control.prototype._onPointerMove = function (target, coordinates) {
                var canNotify = this.onPointerMoveObservable.notifyObservers(coordinates, -1, target, this);
                if (canNotify && this.parent != null)
                    this.parent._onPointerMove(target, coordinates);
            };
            Control.prototype._onPointerEnter = function (target) {
                if (this._enterCount !== 0) {
                    return false;
                }
                this._enterCount++;
                var canNotify = this.onPointerEnterObservable.notifyObservers(this, -1, target, this);
                if (canNotify && this.parent != null)
                    this.parent._onPointerEnter(target);
                return true;
            };
            Control.prototype._onPointerOut = function (target) {
                this._enterCount = 0;
                var canNotify = this.onPointerOutObservable.notifyObservers(this, -1, target, this);
                if (canNotify && this.parent != null)
                    this.parent._onPointerOut(target);
            };
            Control.prototype._onPointerDown = function (target, coordinates, buttonIndex) {
                if (this._downCount !== 0) {
                    return false;
                }
                this._downCount++;
                var canNotify = this.onPointerDownObservable.notifyObservers(new GUI.Vector2WithInfo(coordinates, buttonIndex), -1, target, this);
                if (canNotify && this.parent != null)
                    this.parent._onPointerDown(target, coordinates, buttonIndex);
                return true;
            };
            Control.prototype._onPointerUp = function (target, coordinates, buttonIndex) {
                this._downCount = 0;
                var canNotify = this.onPointerUpObservable.notifyObservers(new GUI.Vector2WithInfo(coordinates, buttonIndex), -1, target, this);
                if (canNotify && this.parent != null)
                    this.parent._onPointerUp(target, coordinates, buttonIndex);
            };
            Control.prototype.forcePointerUp = function () {
                this._onPointerUp(this, BABYLON.Vector2.Zero(), 0);
            };
            Control.prototype._processObservables = function (type, x, y, buttonIndex) {
                this._dummyVector2.copyFromFloats(x, y);
                if (type === BABYLON.PointerEventTypes.POINTERMOVE) {
                    this._onPointerMove(this, this._dummyVector2);
                    var previousControlOver = this._host._lastControlOver;
                    if (previousControlOver && previousControlOver !== this) {
                        previousControlOver._onPointerOut(this);
                    }
                    if (previousControlOver !== this) {
                        this._onPointerEnter(this);
                    }
                    this._host._lastControlOver = this;
                    return true;
                }
                if (type === BABYLON.PointerEventTypes.POINTERDOWN) {
                    this._onPointerDown(this, this._dummyVector2, buttonIndex);
                    this._host._lastControlDown = this;
                    this._host._lastPickedControl = this;
                    return true;
                }
                if (type === BABYLON.PointerEventTypes.POINTERUP) {
                    if (this._host._lastControlDown) {
                        this._host._lastControlDown._onPointerUp(this, this._dummyVector2, buttonIndex);
                    }
                    this._host._lastControlDown = null;
                    return true;
                }
                return false;
            };
            Control.prototype._prepareFont = function () {
                if (!this._font && !this._fontSet) {
                    return;
                }
                this._font = this._fontStyle + " " + this._fontSize.getValue(this._host) + "px " + this._fontFamily;
                this._fontOffset = Control._GetFontOffset(this._font);
            };
            Control.prototype.dispose = function () {
                this.onDirtyObservable.clear();
                this.onAfterDrawObservable.clear();
                this.onPointerDownObservable.clear();
                this.onPointerEnterObservable.clear();
                this.onPointerMoveObservable.clear();
                this.onPointerOutObservable.clear();
                this.onPointerUpObservable.clear();
                if (this._root) {
                    this._root.removeControl(this);
                    this._root = null;
                }
                var index = this._host._linkedControls.indexOf(this);
                if (index > -1) {
                    this.linkWithMesh(null);
                }
            };
            Object.defineProperty(Control, "HORIZONTAL_ALIGNMENT_LEFT", {
                get: function () {
                    return Control._HORIZONTAL_ALIGNMENT_LEFT;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control, "HORIZONTAL_ALIGNMENT_RIGHT", {
                get: function () {
                    return Control._HORIZONTAL_ALIGNMENT_RIGHT;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control, "HORIZONTAL_ALIGNMENT_CENTER", {
                get: function () {
                    return Control._HORIZONTAL_ALIGNMENT_CENTER;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control, "VERTICAL_ALIGNMENT_TOP", {
                get: function () {
                    return Control._VERTICAL_ALIGNMENT_TOP;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control, "VERTICAL_ALIGNMENT_BOTTOM", {
                get: function () {
                    return Control._VERTICAL_ALIGNMENT_BOTTOM;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control, "VERTICAL_ALIGNMENT_CENTER", {
                get: function () {
                    return Control._VERTICAL_ALIGNMENT_CENTER;
                },
                enumerable: true,
                configurable: true
            });
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
            ;
            Control.AddHeader = function (control, text, size, options) {
                var panel = new BABYLON.GUI.StackPanel("panel");
                var isHorizontal = options ? options.isHorizontal : true;
                var controlFirst = options ? options.controlFirst : true;
                panel.isVertical = !isHorizontal;
                var header = new BABYLON.GUI.TextBlock("header");
                header.text = text;
                header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
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
            return Control;
        }());
        GUI.Control = Control;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=control.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Container = /** @class */ (function (_super) {
            __extends(Container, _super);
            function Container(name) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._children = new Array();
                _this._measureForChildren = GUI.Measure.Empty();
                return _this;
            }
            Object.defineProperty(Container.prototype, "background", {
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
                get: function () {
                    return this._children;
                },
                enumerable: true,
                configurable: true
            });
            Container.prototype._getTypeName = function () {
                return "Container";
            };
            Container.prototype.getChildByName = function (name) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    if (child.name === name) {
                        return child;
                    }
                }
                return null;
            };
            Container.prototype.getChildByType = function (name, type) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    if (child.typeName === type) {
                        return child;
                    }
                }
                return null;
            };
            Container.prototype.containsControl = function (control) {
                return this._children.indexOf(control) !== -1;
            };
            Container.prototype.addControl = function (control) {
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
            Container.prototype.removeControl = function (control) {
                var index = this._children.indexOf(control);
                if (index !== -1) {
                    this._children.splice(index, 1);
                    control.parent = null;
                }
                this._markAsDirty();
                return this;
            };
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
            Container.prototype._markMatrixAsDirty = function () {
                _super.prototype._markMatrixAsDirty.call(this);
                for (var index = 0; index < this._children.length; index++) {
                    this._children[index]._markMatrixAsDirty();
                }
            };
            Container.prototype._markAllAsDirty = function () {
                _super.prototype._markAllAsDirty.call(this);
                for (var index = 0; index < this._children.length; index++) {
                    this._children[index]._markAllAsDirty();
                }
            };
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
            Container.prototype._link = function (root, host) {
                _super.prototype._link.call(this, root, host);
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    child._link(root, host);
                }
            };
            Container.prototype._draw = function (parentMeasure, context) {
                if (!this.isVisible || this.notRenderable) {
                    return;
                }
                context.save();
                this._applyStates(context);
                if (this._processMeasures(parentMeasure, context)) {
                    this._localDraw(context);
                    this._clipForChildren(context);
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        if (child.isVisible && !child.notRenderable) {
                            child._draw(this._measureForChildren, context);
                            if (child.onAfterDrawObservable.hasObservers()) {
                                child.onAfterDrawObservable.notifyObservers(child);
                            }
                        }
                    }
                }
                context.restore();
                if (this.onAfterDrawObservable.hasObservers()) {
                    this.onAfterDrawObservable.notifyObservers(this);
                }
            };
            Container.prototype._processPicking = function (x, y, type, buttonIndex) {
                if (!this.isVisible || this.notRenderable) {
                    return false;
                }
                if (!_super.prototype.contains.call(this, x, y)) {
                    return false;
                }
                // Checking backwards to pick closest first
                for (var index = this._children.length - 1; index >= 0; index--) {
                    var child = this._children[index];
                    if (child._processPicking(x, y, type, buttonIndex)) {
                        return true;
                    }
                }
                if (!this.isHitTestVisible) {
                    return false;
                }
                return this._processObservables(type, x, y, buttonIndex);
            };
            Container.prototype._clipForChildren = function (context) {
                // DO nothing
            };
            Container.prototype._additionalProcessing = function (parentMeasure, context) {
                _super.prototype._additionalProcessing.call(this, parentMeasure, context);
                this._measureForChildren.copyFrom(this._currentMeasure);
            };
            Container.prototype.dispose = function () {
                _super.prototype.dispose.call(this);
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var control = _a[_i];
                    control.dispose();
                }
            };
            return Container;
        }(GUI.Control));
        GUI.Container = Container;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=container.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var StackPanel = /** @class */ (function (_super) {
            __extends(StackPanel, _super);
            function StackPanel(name) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._isVertical = true;
                _this._manualWidth = false;
                _this._manualHeight = false;
                _this._doNotTrackManualChanges = false;
                _this._tempMeasureStore = GUI.Measure.Empty();
                return _this;
            }
            Object.defineProperty(StackPanel.prototype, "isVertical", {
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
                        child.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
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
                        child.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
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
        }(GUI.Container));
        GUI.StackPanel = StackPanel;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=stackPanel.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Rectangle = /** @class */ (function (_super) {
            __extends(Rectangle, _super);
            function Rectangle(name) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._thickness = 1;
                _this._cornerRadius = 0;
                return _this;
            }
            Object.defineProperty(Rectangle.prototype, "thickness", {
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
        }(GUI.Container));
        GUI.Rectangle = Rectangle;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=rectangle.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Ellipse = /** @class */ (function (_super) {
            __extends(Ellipse, _super);
            function Ellipse(name) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._thickness = 1;
                return _this;
            }
            Object.defineProperty(Ellipse.prototype, "thickness", {
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
                GUI.Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2 - this._thickness / 2, this._currentMeasure.height / 2 - this._thickness / 2, context);
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
                GUI.Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2, this._currentMeasure.height / 2, context);
                context.clip();
            };
            return Ellipse;
        }(GUI.Container));
        GUI.Ellipse = Ellipse;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=ellipse.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Line = /** @class */ (function (_super) {
            __extends(Line, _super);
            function Line(name) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._lineWidth = 1;
                _this._x1 = new GUI.ValueAndUnit(0);
                _this._y1 = new GUI.ValueAndUnit(0);
                _this._x2 = new GUI.ValueAndUnit(0);
                _this._y2 = new GUI.ValueAndUnit(0);
                _this._dash = new Array();
                _this.isHitTestVisible = false;
                _this._horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                _this._verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
                return _this;
            }
            Object.defineProperty(Line.prototype, "dash", {
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
                set: function (value) {
                    return;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Line.prototype, "verticalAlignment", {
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
            Line.prototype._moveToProjectedPosition = function (projectedPosition) {
                this.x1 = (projectedPosition.x + this._linkOffsetX.getValue(this._host)) + "px";
                this.y1 = (projectedPosition.y + this._linkOffsetY.getValue(this._host)) + "px";
                this._x1.ignoreAdaptiveScaling = true;
                this._y1.ignoreAdaptiveScaling = true;
            };
            return Line;
        }(GUI.Control));
        GUI.Line = Line;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=line.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Slider = /** @class */ (function (_super) {
            __extends(Slider, _super);
            function Slider(name) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._thumbWidth = new GUI.ValueAndUnit(30, GUI.ValueAndUnit.UNITMODE_PIXEL, false);
                _this._minimum = 0;
                _this._maximum = 100;
                _this._value = 50;
                _this._background = "black";
                _this._borderColor = "white";
                _this._barOffset = new GUI.ValueAndUnit(5, GUI.ValueAndUnit.UNITMODE_PIXEL, false);
                _this._isThumbCircle = false;
                _this.onValueChangedObservable = new BABYLON.Observable();
                // Events
                _this._pointerIsDown = false;
                _this.isPointerBlocker = true;
                return _this;
            }
            Object.defineProperty(Slider.prototype, "borderColor", {
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
            Object.defineProperty(Slider.prototype, "barOffset", {
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
            Object.defineProperty(Slider.prototype, "barOffsetInPixels", {
                get: function () {
                    return this._barOffset.getValueInPixel(this._host, this._cachedParentMeasure.width);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Slider.prototype, "thumbWidth", {
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
            Object.defineProperty(Slider.prototype, "thumbWidthInPixels", {
                get: function () {
                    return this._thumbWidth.getValueInPixel(this._host, this._cachedParentMeasure.width);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Slider.prototype, "minimum", {
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
            Object.defineProperty(Slider.prototype, "maximum", {
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
            Object.defineProperty(Slider.prototype, "value", {
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
            Object.defineProperty(Slider.prototype, "isThumbCircle", {
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
                    // Main bar
                    var effectiveThumbWidth;
                    var effectiveBarOffset;
                    if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                        context.shadowColor = this.shadowColor;
                        context.shadowBlur = this.shadowBlur;
                        context.shadowOffsetX = this.shadowOffsetX;
                        context.shadowOffsetY = this.shadowOffsetY;
                    }
                    if (this._thumbWidth.isPixel) {
                        effectiveThumbWidth = Math.min(this._thumbWidth.getValue(this._host), this._currentMeasure.height);
                    }
                    else {
                        effectiveThumbWidth = this._currentMeasure.height * this._thumbWidth.getValue(this._host);
                    }
                    if (this._barOffset.isPixel) {
                        effectiveBarOffset = Math.min(this._barOffset.getValue(this._host), this._currentMeasure.height);
                    }
                    else {
                        effectiveBarOffset = this._currentMeasure.height * this._barOffset.getValue(this._host);
                    }
                    var left = this._currentMeasure.left + effectiveThumbWidth / 2;
                    var width = this._currentMeasure.width - effectiveThumbWidth;
                    var thumbPosition = (this._value - this._minimum) / (this._maximum - this._minimum) * width;
                    // Bar
                    context.fillStyle = this._background;
                    context.fillRect(left, this._currentMeasure.top + effectiveBarOffset, width, this._currentMeasure.height - effectiveBarOffset * 2);
                    if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                        context.shadowBlur = 0;
                        context.shadowOffsetX = 0;
                        context.shadowOffsetY = 0;
                    }
                    context.fillStyle = this.color;
                    context.fillRect(left, this._currentMeasure.top + effectiveBarOffset, thumbPosition, this._currentMeasure.height - effectiveBarOffset * 2);
                    if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                        context.shadowColor = this.shadowColor;
                        context.shadowBlur = this.shadowBlur;
                        context.shadowOffsetX = this.shadowOffsetX;
                        context.shadowOffsetY = this.shadowOffsetY;
                    }
                    // Thumb
                    if (this._isThumbCircle) {
                        context.beginPath();
                        context.arc(left + thumbPosition, this._currentMeasure.top + this._currentMeasure.height / 2, effectiveThumbWidth / 2, 0, 2 * Math.PI);
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
                        context.fillRect(left + thumbPosition - effectiveThumbWidth / 2, this._currentMeasure.top, effectiveThumbWidth, this._currentMeasure.height);
                        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                            context.shadowBlur = 0;
                            context.shadowOffsetX = 0;
                            context.shadowOffsetY = 0;
                        }
                        context.strokeStyle = this._borderColor;
                        context.strokeRect(left + thumbPosition - effectiveThumbWidth / 2, this._currentMeasure.top, effectiveThumbWidth, this._currentMeasure.height);
                    }
                }
                context.restore();
            };
            Slider.prototype._updateValueFromPointer = function (x) {
                this.value = this._minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this._maximum - this._minimum);
            };
            Slider.prototype._onPointerDown = function (target, coordinates, buttonIndex) {
                if (!_super.prototype._onPointerDown.call(this, target, coordinates, buttonIndex)) {
                    return false;
                }
                this._pointerIsDown = true;
                this._updateValueFromPointer(coordinates.x);
                this._host._capturingControl = this;
                return true;
            };
            Slider.prototype._onPointerMove = function (target, coordinates) {
                if (this._pointerIsDown) {
                    this._updateValueFromPointer(coordinates.x);
                }
                _super.prototype._onPointerMove.call(this, target, coordinates);
            };
            Slider.prototype._onPointerUp = function (target, coordinates, buttonIndex) {
                this._pointerIsDown = false;
                this._host._capturingControl = null;
                _super.prototype._onPointerUp.call(this, target, coordinates, buttonIndex);
            };
            return Slider;
        }(GUI.Control));
        GUI.Slider = Slider;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=slider.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Checkbox = /** @class */ (function (_super) {
            __extends(Checkbox, _super);
            function Checkbox(name) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._isChecked = false;
                _this._background = "black";
                _this._checkSizeRatio = 0.8;
                _this._thickness = 1;
                _this.onIsCheckedChangedObservable = new BABYLON.Observable();
                _this.isPointerBlocker = true;
                return _this;
            }
            Object.defineProperty(Checkbox.prototype, "thickness", {
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
                    context.fillStyle = this._background;
                    context.fillRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2, actualWidth, actualHeight);
                    if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                        context.shadowBlur = 0;
                        context.shadowOffsetX = 0;
                        context.shadowOffsetY = 0;
                    }
                    if (this._isChecked) {
                        context.fillStyle = this.color;
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
            Checkbox.prototype._onPointerDown = function (target, coordinates, buttonIndex) {
                if (!_super.prototype._onPointerDown.call(this, target, coordinates, buttonIndex)) {
                    return false;
                }
                this.isChecked = !this.isChecked;
                return true;
            };
            return Checkbox;
        }(GUI.Control));
        GUI.Checkbox = Checkbox;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=checkbox.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var RadioButton = /** @class */ (function (_super) {
            __extends(RadioButton, _super);
            function RadioButton(name) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._isChecked = false;
                _this._background = "black";
                _this._checkSizeRatio = 0.8;
                _this._thickness = 1;
                _this.group = "";
                _this.onIsCheckedChangedObservable = new BABYLON.Observable();
                _this.isPointerBlocker = true;
                return _this;
            }
            Object.defineProperty(RadioButton.prototype, "thickness", {
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
                    if (this._isChecked) {
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
                    GUI.Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2 - this._thickness / 2, this._currentMeasure.height / 2 - this._thickness / 2, context);
                    context.fillStyle = this._background;
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
                        context.fillStyle = this.color;
                        var offsetWidth = actualWidth * this._checkSizeRatio;
                        var offseHeight = actualHeight * this._checkSizeRatio;
                        GUI.Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, offsetWidth / 2 - this._thickness / 2, offseHeight / 2 - this._thickness / 2, context);
                        context.fill();
                    }
                }
                context.restore();
            };
            // Events
            RadioButton.prototype._onPointerDown = function (target, coordinates, buttonIndex) {
                if (!_super.prototype._onPointerDown.call(this, target, coordinates, buttonIndex)) {
                    return false;
                }
                this.isChecked = !this.isChecked;
                return true;
            };
            return RadioButton;
        }(GUI.Control));
        GUI.RadioButton = RadioButton;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=radioButton.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var TextBlock = /** @class */ (function (_super) {
            __extends(TextBlock, _super);
            function TextBlock(name, text) {
                if (text === void 0) { text = ""; }
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._text = "";
                _this._textWrapping = false;
                _this._textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                _this._textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                _this._resizeToFit = false;
                /**
                * An event triggered after the text is changed
                * @type {BABYLON.Observable}
                */
                _this.onTextChangedObservable = new BABYLON.Observable();
                _this.text = text;
                return _this;
            }
            Object.defineProperty(TextBlock.prototype, "resizeToFit", {
                get: function () {
                    return this._resizeToFit;
                },
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
                get: function () {
                    return this._textWrapping;
                },
                set: function (value) {
                    if (this._textWrapping === value) {
                        return;
                    }
                    this._textWrapping = value;
                    this._markAsDirty();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextBlock.prototype, "text", {
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
            Object.defineProperty(TextBlock.prototype, "textHorizontalAlignment", {
                get: function () {
                    return this._textHorizontalAlignment;
                },
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
                get: function () {
                    return this._textVerticalAlignment;
                },
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
            TextBlock.prototype._getTypeName = function () {
                return "TextBlock";
            };
            TextBlock.prototype._drawText = function (text, textWidth, y, context) {
                var width = this._currentMeasure.width;
                var x = 0;
                switch (this._textHorizontalAlignment) {
                    case GUI.Control.HORIZONTAL_ALIGNMENT_LEFT:
                        x = 0;
                        break;
                    case GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT:
                        x = width - textWidth;
                        break;
                    case GUI.Control.HORIZONTAL_ALIGNMENT_CENTER:
                        x = (width - textWidth) / 2;
                        break;
                }
                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowColor = this.shadowColor;
                    context.shadowBlur = this.shadowBlur;
                    context.shadowOffsetX = this.shadowOffsetX;
                    context.shadowOffsetY = this.shadowOffsetY;
                }
                context.fillText(text, this._currentMeasure.left + x, y);
            };
            TextBlock.prototype._draw = function (parentMeasure, context) {
                context.save();
                this._applyStates(context);
                if (this._processMeasures(parentMeasure, context)) {
                    // Render lines
                    this._renderLines(context);
                }
                context.restore();
            };
            TextBlock.prototype._additionalProcessing = function (parentMeasure, context) {
                this._lines = [];
                var _lines = this.text.split("\n");
                if (this._textWrapping && !this._resizeToFit) {
                    for (var _i = 0, _lines_1 = _lines; _i < _lines_1.length; _i++) {
                        var _line = _lines_1[_i];
                        this._lines.push(this._parseLineWithTextWrapping(_line, context));
                    }
                }
                else {
                    for (var _a = 0, _lines_2 = _lines; _a < _lines_2.length; _a++) {
                        var _line = _lines_2[_a];
                        this._lines.push(this._parseLine(_line, context));
                    }
                }
            };
            TextBlock.prototype._parseLine = function (line, context) {
                if (line === void 0) { line = ''; }
                return { text: line, width: context.measureText(line).width };
            };
            TextBlock.prototype._parseLineWithTextWrapping = function (line, context) {
                if (line === void 0) { line = ''; }
                var words = line.split(' ');
                var width = this._currentMeasure.width;
                var lineWidth = 0;
                for (var n = 0; n < words.length; n++) {
                    var testLine = n > 0 ? line + " " + words[n] : words[0];
                    var metrics = context.measureText(testLine);
                    var testWidth = metrics.width;
                    if (testWidth > width && n > 0) {
                        this._lines.push({ text: line, width: lineWidth });
                        line = words[n];
                        lineWidth = context.measureText(line).width;
                    }
                    else {
                        lineWidth = testWidth;
                        line = testLine;
                    }
                }
                return { text: line, width: lineWidth };
            };
            TextBlock.prototype._renderLines = function (context) {
                var height = this._currentMeasure.height;
                if (!this._fontOffset) {
                    this._fontOffset = GUI.Control._GetFontOffset(context.font);
                }
                var rootY = 0;
                switch (this._textVerticalAlignment) {
                    case GUI.Control.VERTICAL_ALIGNMENT_TOP:
                        rootY = this._fontOffset.ascent;
                        break;
                    case GUI.Control.VERTICAL_ALIGNMENT_BOTTOM:
                        rootY = height - this._fontOffset.height * (this._lines.length - 1) - this._fontOffset.descent;
                        break;
                    case GUI.Control.VERTICAL_ALIGNMENT_CENTER:
                        rootY = this._fontOffset.ascent + (height - this._fontOffset.height * this._lines.length) / 2;
                        break;
                }
                rootY += this._currentMeasure.top;
                var maxLineWidth = 0;
                for (var _i = 0, _a = this._lines; _i < _a.length; _i++) {
                    var line = _a[_i];
                    this._drawText(line.text, line.width, rootY, context);
                    rootY += this._fontOffset.height;
                    if (line.width > maxLineWidth)
                        maxLineWidth = line.width;
                }
                if (this._resizeToFit) {
                    this.width = this.paddingLeftInPixels + this.paddingRightInPixels + maxLineWidth + 'px';
                    this.height = this.paddingTopInPixels + this.paddingBottomInPixels + this._fontOffset.height * this._lines.length + 'px';
                }
            };
            TextBlock.prototype.dispose = function () {
                _super.prototype.dispose.call(this);
                this.onTextChangedObservable.clear();
            };
            return TextBlock;
        }(GUI.Control));
        GUI.TextBlock = TextBlock;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=textBlock.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var DOMImage = Image;
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Image = /** @class */ (function (_super) {
            __extends(Image, _super);
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
                _this.source = url;
                return _this;
            }
            Object.defineProperty(Image.prototype, "sourceLeft", {
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
                this._markAsDirty();
            };
            Object.defineProperty(Image.prototype, "source", {
                set: function (value) {
                    var _this = this;
                    if (this._source === value) {
                        return;
                    }
                    this._loaded = false;
                    this._source = value;
                    this._domImage = new DOMImage();
                    this._domImage.onload = function () {
                        _this._onImageLoaded();
                    };
                    if (value) {
                        this._domImage.crossOrigin = "anonymous";
                        this._domImage.src = value;
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Image.prototype, "cellWidth", {
                get: function () {
                    return this._cellWidth;
                },
                set: function (value) {
                    this._cellWidth = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Image.prototype, "cellHeight", {
                get: function () {
                    return this._cellHeight;
                },
                set: function (value) {
                    this._cellHeight = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Image.prototype, "cellId", {
                get: function () {
                    return this._cellId;
                },
                set: function (value) {
                    this._cellId = value;
                },
                enumerable: true,
                configurable: true
            });
            Image.prototype._getTypeName = function () {
                return "Image";
            };
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
                                if (this._root && this._root.parent) {
                                    this._root.width = this.width;
                                    this._root.height = this.height;
                                }
                                break;
                        }
                    }
                }
                context.restore();
            };
            Object.defineProperty(Image, "STRETCH_NONE", {
                get: function () {
                    return Image._STRETCH_NONE;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Image, "STRETCH_FILL", {
                get: function () {
                    return Image._STRETCH_FILL;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Image, "STRETCH_UNIFORM", {
                get: function () {
                    return Image._STRETCH_UNIFORM;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Image, "STRETCH_EXTEND", {
                get: function () {
                    return Image._STRETCH_EXTEND;
                },
                enumerable: true,
                configurable: true
            });
            // Static
            Image._STRETCH_NONE = 0;
            Image._STRETCH_FILL = 1;
            Image._STRETCH_UNIFORM = 2;
            Image._STRETCH_EXTEND = 3;
            return Image;
        }(GUI.Control));
        GUI.Image = Image;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=image.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Button = /** @class */ (function (_super) {
            __extends(Button, _super);
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
            Button.prototype._getTypeName = function () {
                return "Button";
            };
            // While being a container, the button behaves like a control.
            Button.prototype._processPicking = function (x, y, type, buttonIndex) {
                if (!this.isHitTestVisible || !this.isVisible || this.notRenderable) {
                    return false;
                }
                if (!_super.prototype.contains.call(this, x, y)) {
                    return false;
                }
                this._processObservables(type, x, y, buttonIndex);
                return true;
            };
            Button.prototype._onPointerEnter = function (target) {
                if (!_super.prototype._onPointerEnter.call(this, target)) {
                    return false;
                }
                if (this.pointerEnterAnimation) {
                    this.pointerEnterAnimation();
                }
                return true;
            };
            Button.prototype._onPointerOut = function (target) {
                if (this.pointerOutAnimation) {
                    this.pointerOutAnimation();
                }
                _super.prototype._onPointerOut.call(this, target);
            };
            Button.prototype._onPointerDown = function (target, coordinates, buttonIndex) {
                if (!_super.prototype._onPointerDown.call(this, target, coordinates, buttonIndex)) {
                    return false;
                }
                if (this.pointerDownAnimation) {
                    this.pointerDownAnimation();
                }
                return true;
            };
            Button.prototype._onPointerUp = function (target, coordinates, buttonIndex) {
                if (this.pointerUpAnimation) {
                    this.pointerUpAnimation();
                }
                _super.prototype._onPointerUp.call(this, target, coordinates, buttonIndex);
            };
            // Statics
            Button.CreateImageButton = function (name, text, imageUrl) {
                var result = new Button(name);
                // Adding text
                var textBlock = new BABYLON.GUI.TextBlock(name + "_button", text);
                textBlock.textWrapping = true;
                textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                textBlock.paddingLeft = "20%";
                result.addControl(textBlock);
                // Adding image
                var iconImage = new BABYLON.GUI.Image(name + "_icon", imageUrl);
                iconImage.width = "20%";
                iconImage.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
                iconImage.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                result.addControl(iconImage);
                return result;
            };
            Button.CreateImageOnlyButton = function (name, imageUrl) {
                var result = new Button(name);
                // Adding image
                var iconImage = new BABYLON.GUI.Image(name + "_icon", imageUrl);
                iconImage.stretch = BABYLON.GUI.Image.STRETCH_FILL;
                iconImage.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                result.addControl(iconImage);
                return result;
            };
            Button.CreateSimpleButton = function (name, text) {
                var result = new Button(name);
                // Adding text
                var textBlock = new BABYLON.GUI.TextBlock(name + "_button", text);
                textBlock.textWrapping = true;
                textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                result.addControl(textBlock);
                return result;
            };
            Button.CreateImageWithCenterTextButton = function (name, text, imageUrl) {
                var result = new Button(name);
                // Adding image
                var iconImage = new BABYLON.GUI.Image(name + "_icon", imageUrl);
                iconImage.stretch = BABYLON.GUI.Image.STRETCH_FILL;
                result.addControl(iconImage);
                // Adding text
                var textBlock = new BABYLON.GUI.TextBlock(name + "_button", text);
                textBlock.textWrapping = true;
                textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                result.addControl(textBlock);
                return result;
            };
            return Button;
        }(GUI.Rectangle));
        GUI.Button = Button;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=button.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var ColorPicker = /** @class */ (function (_super) {
            __extends(ColorPicker, _super);
            function ColorPicker(name) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._value = BABYLON.Color3.Red();
                _this._tmpColor = new BABYLON.Color3();
                _this._pointerStartedOnSquare = false;
                _this._pointerStartedOnWheel = false;
                _this._squareLeft = 0;
                _this._squareTop = 0;
                _this._squareSize = 0;
                _this._h = 360;
                _this._s = 1;
                _this._v = 1;
                _this.onValueChangedObservable = new BABYLON.Observable();
                // Events
                _this._pointerIsDown = false;
                _this.value = new BABYLON.Color3(.88, .1, .1);
                _this.size = "200px";
                _this.isPointerBlocker = true;
                return _this;
            }
            Object.defineProperty(ColorPicker.prototype, "value", {
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
            ColorPicker.prototype._onPointerDown = function (target, coordinates, buttonIndex) {
                if (!_super.prototype._onPointerDown.call(this, target, coordinates, buttonIndex)) {
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
                this._host._capturingControl = this;
                return true;
            };
            ColorPicker.prototype._onPointerMove = function (target, coordinates) {
                if (this._pointerIsDown) {
                    this._updateValueFromPointer(coordinates.x, coordinates.y);
                }
                _super.prototype._onPointerMove.call(this, target, coordinates);
            };
            ColorPicker.prototype._onPointerUp = function (target, coordinates, buttonIndex) {
                this._pointerIsDown = false;
                this._host._capturingControl = null;
                _super.prototype._onPointerUp.call(this, target, coordinates, buttonIndex);
            };
            return ColorPicker;
        }(GUI.Control));
        GUI.ColorPicker = ColorPicker;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var InputText = /** @class */ (function (_super) {
            __extends(InputText, _super);
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
                _this._margin = new GUI.ValueAndUnit(10, GUI.ValueAndUnit.UNITMODE_PIXEL);
                _this._autoStretchWidth = true;
                _this._maxWidth = new GUI.ValueAndUnit(1, GUI.ValueAndUnit.UNITMODE_PERCENTAGE, false);
                _this._isFocused = false;
                _this._blinkIsEven = false;
                _this._cursorOffset = 0;
                _this.promptMessage = "Please enter text:";
                _this.onTextChangedObservable = new BABYLON.Observable();
                _this.onFocusObservable = new BABYLON.Observable();
                _this.onBlurObservable = new BABYLON.Observable();
                _this.text = text;
                return _this;
            }
            Object.defineProperty(InputText.prototype, "maxWidth", {
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
                get: function () {
                    return this._maxWidth.getValueInPixel(this._host, this._cachedParentMeasure.width);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(InputText.prototype, "margin", {
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
                get: function () {
                    return this._margin.getValueInPixel(this._host, this._cachedParentMeasure.width);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(InputText.prototype, "autoStretchWidth", {
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
            Object.defineProperty(InputText.prototype, "text", {
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
            InputText.prototype.onBlur = function () {
                this._isFocused = false;
                this._scrollLeft = null;
                this._cursorOffset = 0;
                clearTimeout(this._blinkTimeout);
                this._markAsDirty();
                this.onBlurObservable.notifyObservers(this);
            };
            InputText.prototype.onFocus = function () {
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
            InputText.prototype.processKey = function (keyCode, key) {
                // Specific cases
                switch (keyCode) {
                    case 8:// BACKSPACE
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
                    case 46:// DELETE
                        if (this._text && this._text.length > 0) {
                            var deletePosition = this._text.length - this._cursorOffset;
                            this.text = this._text.slice(0, deletePosition) + this._text.slice(deletePosition + 1);
                            this._cursorOffset--;
                        }
                        return;
                    case 13:// RETURN
                        this._host.focusedControl = null;
                        return;
                    case 35:// END
                        this._cursorOffset = 0;
                        this._blinkIsEven = false;
                        this._markAsDirty();
                        return;
                    case 36:// HOME
                        this._cursorOffset = this._text.length;
                        this._blinkIsEven = false;
                        this._markAsDirty();
                        return;
                    case 37:// LEFT
                        this._cursorOffset++;
                        if (this._cursorOffset > this._text.length) {
                            this._cursorOffset = this._text.length;
                        }
                        this._blinkIsEven = false;
                        this._markAsDirty();
                        return;
                    case 39:// RIGHT
                        this._cursorOffset--;
                        if (this._cursorOffset < 0) {
                            this._cursorOffset = 0;
                        }
                        this._blinkIsEven = false;
                        this._markAsDirty();
                        return;
                }
                // Printable characters
                if ((keyCode === -1) || // Direct access
                    (keyCode === 32) || // Space
                    (keyCode > 47 && keyCode < 58) || // Numbers
                    (keyCode > 64 && keyCode < 91) || // Letters
                    (keyCode > 185 && keyCode < 193) || // Special characters
                    (keyCode > 218 && keyCode < 223) || // Special characters
                    (keyCode > 95 && keyCode < 112)) {
                    if (this._cursorOffset === 0) {
                        this.text += key;
                    }
                    else {
                        var insertPosition = this._text.length - this._cursorOffset;
                        this.text = this._text.slice(0, insertPosition) + key + this._text.slice(insertPosition);
                    }
                }
            };
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
                            context.fillStyle = this._focusedBackground;
                            context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                        }
                    }
                    else if (this._background) {
                        context.fillStyle = this._background;
                        context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                    }
                    if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                        context.shadowBlur = 0;
                        context.shadowOffsetX = 0;
                        context.shadowOffsetY = 0;
                    }
                    if (!this._fontOffset) {
                        this._fontOffset = GUI.Control._GetFontOffset(context.font);
                    }
                    // Text
                    var clipTextLeft = this._currentMeasure.left + this._margin.getValueInPixel(this._host, parentMeasure.width);
                    if (this.color) {
                        context.fillStyle = this.color;
                    }
                    var text = this._text;
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
                            } while (currentSize < absoluteCursorPosition);
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
            InputText.prototype._onPointerDown = function (target, coordinates, buttonIndex) {
                if (!_super.prototype._onPointerDown.call(this, target, coordinates, buttonIndex)) {
                    return false;
                }
                this._clickedCoordinate = coordinates.x;
                if (this._host.focusedControl === this) {
                    // Move cursor
                    clearTimeout(this._blinkTimeout);
                    this._markAsDirty();
                    return true;
                }
                this._host.focusedControl = this;
                return true;
            };
            InputText.prototype._onPointerUp = function (target, coordinates, buttonIndex) {
                _super.prototype._onPointerUp.call(this, target, coordinates, buttonIndex);
            };
            InputText.prototype.dispose = function () {
                _super.prototype.dispose.call(this);
                this.onBlurObservable.clear();
                this.onFocusObservable.clear();
                this.onTextChangedObservable.clear();
            };
            return InputText;
        }(GUI.Control));
        GUI.InputText = InputText;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var KeyPropertySet = /** @class */ (function () {
            function KeyPropertySet() {
            }
            return KeyPropertySet;
        }());
        GUI.KeyPropertySet = KeyPropertySet;
        var VirtualKeyboard = /** @class */ (function (_super) {
            __extends(VirtualKeyboard, _super);
            function VirtualKeyboard() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.onKeyPressObservable = new BABYLON.Observable();
                _this.defaultButtonWidth = "40px";
                _this.defaultButtonHeight = "40px";
                _this.defaultButtonPaddingLeft = "2px";
                _this.defaultButtonPaddingRight = "2px";
                _this.defaultButtonPaddingTop = "2px";
                _this.defaultButtonPaddingBottom = "2px";
                _this.defaultButtonColor = "#DDD";
                _this.defaultButtonBackground = "#070707";
                return _this;
            }
            VirtualKeyboard.prototype._getTypeName = function () {
                return "VirtualKeyboard";
            };
            VirtualKeyboard.prototype._createKey = function (key, propertySet) {
                var _this = this;
                var button = GUI.Button.CreateSimpleButton(key, key);
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
            VirtualKeyboard.prototype.addKeysRow = function (keys, propertySets) {
                var panel = new GUI.StackPanel();
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
            Object.defineProperty(VirtualKeyboard.prototype, "connectedInputText", {
                get: function () {
                    return this._connectedInputText;
                },
                enumerable: true,
                configurable: true
            });
            VirtualKeyboard.prototype.connect = function (input) {
                var _this = this;
                this.isVisible = false;
                this._connectedInputText = input;
                // Events hooking
                this._onFocusObserver = input.onFocusObservable.add(function () {
                    _this.isVisible = true;
                });
                this._onBlurObserver = input.onBlurObservable.add(function () {
                    _this.isVisible = false;
                });
                this._onKeyPressObserver = this.onKeyPressObservable.add(function (key) {
                    if (!_this._connectedInputText) {
                        return;
                    }
                    switch (key) {
                        case "\u2190":
                            _this._connectedInputText.processKey(8);
                            return;
                        case "\u21B5":
                            _this._connectedInputText.processKey(13);
                            return;
                    }
                    _this._connectedInputText.processKey(-1, key);
                });
            };
            VirtualKeyboard.prototype.disconnect = function () {
                if (!this._connectedInputText) {
                    return;
                }
                this._connectedInputText.onFocusObservable.remove(this._onFocusObserver);
                this._connectedInputText.onBlurObservable.remove(this._onBlurObserver);
                this.onKeyPressObservable.remove(this._onKeyPressObserver);
                this._connectedInputText = null;
            };
            // Statics
            VirtualKeyboard.CreateDefaultLayout = function () {
                var returnValue = new VirtualKeyboard();
                returnValue.addKeysRow(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "\u2190"]);
                returnValue.addKeysRow(["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]);
                returnValue.addKeysRow(["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "\u21B5"]);
                returnValue.addKeysRow(["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"]);
                returnValue.addKeysRow([" "], [{ width: "200px" }]);
                return returnValue;
            };
            return VirtualKeyboard;
        }(GUI.StackPanel));
        GUI.VirtualKeyboard = VirtualKeyboard;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));


(function universalModuleDefinition(root, factory) {
                var f = factory();
                if (root && root["BABYLON"]) {
                    return;
                }
                
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = f;
    else if(typeof define === 'function' && define.amd)
        define(["GUI"], factory);
    else if(typeof exports === 'object')
        exports["GUI"] = f;
    else {
        root["BABYLON"]["GUI"] = f;
    }
})(this, function() {
    return BABYLON.GUI;
});
