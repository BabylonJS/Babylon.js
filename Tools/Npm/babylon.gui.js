/// <reference path="../../dist/preview release/babylon.d.ts"/>
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
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var AdvancedDynamicTexture = (function (_super) {
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
                _this._renderObserver = _this.getScene().onBeforeCameraRenderObservable.add(function (camera) { return _this._checkUpdate(camera); });
                _this._rootContainer._link(null, _this);
                _this.hasAlpha = true;
                if (!width || !height) {
                    _this._resizeObserver = _this.getScene().getEngine().onResizeObservable.add(function () { return _this._onResize(); });
                    _this._onResize();
                }
                _this._texture.isReady = true;
                return _this;
            }
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
            Object.defineProperty(AdvancedDynamicTexture.prototype, "layer", {
                get: function () {
                    return this._layerToDispose;
                },
                enumerable: true,
                configurable: true
            });
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
                this.getScene().onBeforeCameraRenderObservable.remove(this._renderObserver);
                if (this._resizeObserver) {
                    this.getScene().getEngine().onResizeObservable.remove(this._resizeObserver);
                }
                if (this._pointerMoveObserver) {
                    this.getScene().onPrePointerObservable.remove(this._pointerMoveObserver);
                }
                if (this._pointerObserver) {
                    this.getScene().onPointerObservable.remove(this._pointerObserver);
                }
                if (this._canvasBlurObserver) {
                    this.getScene().getEngine().onCanvasBlurObservable.remove(this._canvasBlurObserver);
                }
                if (this._layerToDispose) {
                    this._layerToDispose.texture = null;
                    this._layerToDispose.dispose();
                    this._layerToDispose = null;
                }
                _super.prototype.dispose.call(this);
            };
            AdvancedDynamicTexture.prototype._onResize = function () {
                // Check size
                var engine = this.getScene().getEngine();
                var textureSize = this.getSize();
                var renderWidth = engine.getRenderWidth();
                var renderHeight = engine.getRenderHeight();
                if (textureSize.width !== renderWidth || textureSize.height !== renderHeight) {
                    this.scaleTo(renderWidth, renderHeight);
                    this.markAsDirty();
                    if (this._idealWidth || this._idealHeight) {
                        this._rootContainer._markAllAsDirty();
                    }
                }
            };
            AdvancedDynamicTexture.prototype._checkUpdate = function (camera) {
                if (this._layerToDispose) {
                    if ((camera.layerMask & this._layerToDispose.layerMask) === 0) {
                        return;
                    }
                }
                if (this._isFullscreen && this._linkedControls.length) {
                    var scene = this.getScene();
                    var engine = scene.getEngine();
                    var globalViewport = this._fullscreenViewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
                    for (var _i = 0, _a = this._linkedControls; _i < _a.length; _i++) {
                        var control = _a[_i];
                        var mesh = control._linkedMesh;
                        var position = mesh.getBoundingInfo().boundingSphere.center;
                        var projectedPosition = BABYLON.Vector3.Project(position, mesh.getWorldMatrix(), scene.getTransformMatrix(), globalViewport);
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
                var measure = new GUI.Measure(0, 0, renderWidth, renderHeight);
                this._rootContainer._draw(measure, context);
            };
            AdvancedDynamicTexture.prototype._doPicking = function (x, y, type) {
                if (this._capturingControl) {
                    this._capturingControl._processObservables(type, x, y);
                    return;
                }
                if (!this._rootContainer._processPicking(x, y, type)) {
                    if (type === BABYLON.PointerEventTypes.POINTERMOVE) {
                        if (this._lastControlOver && this._lastControlOver.onPointerOutObservable.hasObservers()) {
                            this._lastControlOver.onPointerOutObservable.notifyObservers(this._lastControlOver);
                        }
                        this._lastControlOver = null;
                    }
                }
            };
            AdvancedDynamicTexture.prototype.attach = function () {
                var _this = this;
                var scene = this.getScene();
                this._pointerMoveObserver = scene.onPrePointerObservable.add(function (pi, state) {
                    if (pi.type !== BABYLON.PointerEventTypes.POINTERMOVE
                        && pi.type !== BABYLON.PointerEventTypes.POINTERUP
                        && pi.type !== BABYLON.PointerEventTypes.POINTERDOWN) {
                        return;
                    }
                    _this._shouldBlockPointer = false;
                    _this._doPicking(scene.pointerX, scene.pointerY, pi.type);
                    pi.skipOnPointerObservable = _this._shouldBlockPointer && pi.type !== BABYLON.PointerEventTypes.POINTERUP;
                });
                this._canvasBlurObserver = scene.getEngine().onCanvasBlurObservable.add(function () {
                    if (_this._lastControlOver && _this._lastControlOver.onPointerOutObservable.hasObservers()) {
                        _this._lastControlOver.onPointerOutObservable.notifyObservers(_this._lastControlOver);
                    }
                    _this._lastControlOver = null;
                    if (_this._lastControlDown) {
                        _this._lastControlDown.forcePointerUp();
                    }
                    _this._lastControlDown = null;
                });
            };
            AdvancedDynamicTexture.prototype.attachToMesh = function (mesh) {
                var _this = this;
                var scene = this.getScene();
                this._pointerObserver = scene.onPointerObservable.add(function (pi, state) {
                    if (pi.type !== BABYLON.PointerEventTypes.POINTERUP && pi.type !== BABYLON.PointerEventTypes.POINTERDOWN) {
                        return;
                    }
                    if (pi.pickInfo.hit && pi.pickInfo.pickedMesh === mesh) {
                        var uv = pi.pickInfo.getTextureCoordinates();
                        var size = _this.getSize();
                        _this._doPicking(uv.x * size.width, (1.0 - uv.y) * size.height, pi.type);
                    }
                });
            };
            // Statics
            AdvancedDynamicTexture.CreateForMesh = function (mesh, width, height) {
                if (width === void 0) { width = 1024; }
                if (height === void 0) { height = 1024; }
                var result = new AdvancedDynamicTexture(mesh.name + " AdvancedDynamicTexture", width, height, mesh.getScene(), true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
                var material = new BABYLON.StandardMaterial("AdvancedDynamicTextureMaterial", mesh.getScene());
                material.backFaceCulling = false;
                material.diffuseColor = BABYLON.Color3.Black();
                material.specularColor = BABYLON.Color3.Black();
                material.emissiveTexture = result;
                material.opacityTexture = result;
                mesh.material = material;
                result.attachToMesh(mesh);
                return result;
            };
            AdvancedDynamicTexture.CreateFullscreenUI = function (name, foreground, scene) {
                if (foreground === void 0) { foreground = true; }
                if (scene === void 0) { scene = null; }
                var result = new AdvancedDynamicTexture(name, 0, 0, scene);
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
        var Measure = (function () {
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
        var Matrix2D = (function () {
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
                    throw new Error("Can't invert matrix, near null determinant");
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
            return Matrix2D;
        }());
        Matrix2D._TempPreTranslationMatrix = Matrix2D.Identity();
        Matrix2D._TempPostTranslationMatrix = Matrix2D.Identity();
        Matrix2D._TempRotationMatrix = Matrix2D.Identity();
        Matrix2D._TempScalingMatrix = Matrix2D.Identity();
        Matrix2D._TempCompose0 = Matrix2D.Identity();
        Matrix2D._TempCompose1 = Matrix2D.Identity();
        Matrix2D._TempCompose2 = Matrix2D.Identity();
        GUI.Matrix2D = Matrix2D;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=math2D.js.map

/// <reference path="../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var ValueAndUnit = (function () {
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
                        return this.getValue(host) + "%";
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
            return ValueAndUnit;
        }());
        // Static
        ValueAndUnit._Regex = /(^-?\d*(\.\d+)?)(%|px)?/;
        ValueAndUnit._UNITMODE_PERCENTAGE = 0;
        ValueAndUnit._UNITMODE_PIXEL = 1;
        GUI.ValueAndUnit = ValueAndUnit;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=valueAndUnit.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Control = (function () {
            // Functions
            function Control(name) {
                this.name = name;
                this._alpha = 1;
                this._zIndex = 0;
                this._currentMeasure = GUI.Measure.Empty();
                this._fontFamily = "Arial";
                this._fontSize = new GUI.ValueAndUnit(18, GUI.ValueAndUnit.UNITMODE_PIXEL, false);
                this._width = new GUI.ValueAndUnit(1, GUI.ValueAndUnit.UNITMODE_PERCENTAGE, false);
                this._height = new GUI.ValueAndUnit(1, GUI.ValueAndUnit.UNITMODE_PERCENTAGE, false);
                this._horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                this._verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                this._isDirty = true;
                this._cachedParentMeasure = GUI.Measure.Empty();
                this._marginLeft = new GUI.ValueAndUnit(0);
                this._marginRight = new GUI.ValueAndUnit(0);
                this._marginTop = new GUI.ValueAndUnit(0);
                this._marginBottom = new GUI.ValueAndUnit(0);
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
                this.isHitTestVisible = true;
                this.isPointerBlocker = false;
                this._linkOffsetX = new GUI.ValueAndUnit(0);
                this._linkOffsetY = new GUI.ValueAndUnit(0);
                // Properties
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
            }
            Object.defineProperty(Control.prototype, "alpha", {
                get: function () {
                    return this._alpha;
                },
                set: function (value) {
                    if (this._alpha === value) {
                        return;
                    }
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
                        this._fontSet = true;
                    }
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
            Object.defineProperty(Control.prototype, "marginLeft", {
                get: function () {
                    return this._marginLeft.toString(this._host);
                },
                set: function (value) {
                    if (this._marginLeft.fromString(value)) {
                        this._markAsDirty();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "marginRight", {
                get: function () {
                    return this._marginRight.toString(this._host);
                },
                set: function (value) {
                    if (this._marginRight.fromString(value)) {
                        this._markAsDirty();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "marginTop", {
                get: function () {
                    return this._marginTop.toString(this._host);
                },
                set: function (value) {
                    if (this._marginTop.fromString(value)) {
                        this._markAsDirty();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "marginBottom", {
                get: function () {
                    return this._marginBottom.toString(this._host);
                },
                set: function (value) {
                    if (this._marginBottom.fromString(value)) {
                        this._markAsDirty();
                    }
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
            Control.prototype.linkWithMesh = function (mesh) {
                if (!this._host || this._root !== this._host._rootContainer) {
                    BABYLON.Tools.Error("Cannot link a control to a mesh if the control is not at root level");
                    return;
                }
                if (this._host._linkedControls.indexOf(this) !== -1) {
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
                    this._fontSet = false;
                    this._prepareFont();
                }
                if (this._font) {
                    context.font = this._font;
                }
                if (this._color) {
                    context.fillStyle = this._color;
                }
                context.globalAlpha = this._alpha;
            };
            Control.prototype._processMeasures = function (parentMeasure, context) {
                if (this._isDirty || !this._cachedParentMeasure.isEqualsTo(parentMeasure)) {
                    this._isDirty = false;
                    this._currentMeasure.copyFrom(parentMeasure);
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
                context.rect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
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
                if (this._marginLeft.isPixel) {
                    this._currentMeasure.left += this._marginLeft.getValue(this._host);
                    this._currentMeasure.width -= this._marginRight.getValue(this._host);
                }
                else {
                    this._currentMeasure.left += parentWidth * this._marginLeft.getValue(this._host);
                    this._currentMeasure.width -= parentWidth * this._marginLeft.getValue(this._host);
                }
                if (this._marginRight.isPixel) {
                    this._currentMeasure.width -= this._marginRight.getValue(this._host);
                }
                else {
                    this._currentMeasure.width -= parentWidth * this._marginRight.getValue(this._host);
                }
                if (this._marginTop.isPixel) {
                    this._currentMeasure.top += this._marginTop.getValue(this._host);
                    this._currentMeasure.height -= this._marginTop.getValue(this._host);
                }
                else {
                    this._currentMeasure.top += parentHeight * this._marginTop.getValue(this._host);
                    this._currentMeasure.height -= parentHeight * this._marginTop.getValue(this._host);
                }
                if (this._marginBottom.isPixel) {
                    this._currentMeasure.height -= this._marginBottom.getValue(this._host);
                }
                else {
                    this._currentMeasure.height -= parentHeight * this._marginBottom.getValue(this._host);
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
            Control.prototype._processPicking = function (x, y, type) {
                if (!this.isHitTestVisible) {
                    return false;
                }
                if (!this.contains(x, y)) {
                    return false;
                }
                this._processObservables(type, x, y);
                return true;
            };
            Control.prototype._onPointerMove = function (coordinates) {
                if (this.onPointerMoveObservable.hasObservers()) {
                    this.onPointerMoveObservable.notifyObservers(coordinates);
                }
            };
            Control.prototype._onPointerEnter = function () {
                if (this.onPointerEnterObservable.hasObservers()) {
                    this.onPointerEnterObservable.notifyObservers(this);
                }
            };
            Control.prototype._onPointerOut = function () {
                if (this.onPointerOutObservable.hasObservers()) {
                    this.onPointerOutObservable.notifyObservers(this);
                }
            };
            Control.prototype._onPointerDown = function (coordinates) {
                if (this.onPointerDownObservable.hasObservers()) {
                    this.onPointerDownObservable.notifyObservers(coordinates);
                }
            };
            Control.prototype._onPointerUp = function (coordinates) {
                if (this.onPointerUpObservable.hasObservers()) {
                    this.onPointerUpObservable.notifyObservers(coordinates);
                }
            };
            Control.prototype.forcePointerUp = function () {
                this._onPointerUp(BABYLON.Vector2.Zero());
            };
            Control.prototype._processObservables = function (type, x, y) {
                this._dummyVector2.copyFromFloats(x, y);
                if (type === BABYLON.PointerEventTypes.POINTERMOVE) {
                    this._onPointerMove(this._dummyVector2);
                    var previousControlOver = this._host._lastControlOver;
                    if (previousControlOver && previousControlOver !== this) {
                        previousControlOver._onPointerOut();
                    }
                    if (previousControlOver !== this) {
                        this._onPointerEnter();
                    }
                    this._host._lastControlOver = this;
                    return true;
                }
                if (type === BABYLON.PointerEventTypes.POINTERDOWN) {
                    this._onPointerDown(this._dummyVector2);
                    this._host._lastControlDown = this;
                    return true;
                }
                if (type === BABYLON.PointerEventTypes.POINTERUP) {
                    if (this._host._lastControlDown) {
                        this._host._lastControlDown._onPointerUp(this._dummyVector2);
                    }
                    this._host._lastControlDown = null;
                    return true;
                }
                return false;
            };
            Control.prototype._prepareFont = function () {
                if (!this._fontFamily) {
                    return;
                }
                this._font = this._fontSize.getValue(this._host) + "px " + this._fontFamily;
                this._fontOffset = Control._GetFontOffset(this._font);
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
                    div.remove();
                }
                var result = { ascent: fontAscent, height: fontHeight, descent: fontHeight - fontAscent };
                Control._FontHeightSizes[font] = result;
                return result;
            };
            ;
            return Control;
        }());
        // Statics
        Control._HORIZONTAL_ALIGNMENT_LEFT = 0;
        Control._HORIZONTAL_ALIGNMENT_RIGHT = 1;
        Control._HORIZONTAL_ALIGNMENT_CENTER = 2;
        Control._VERTICAL_ALIGNMENT_TOP = 0;
        Control._VERTICAL_ALIGNMENT_BOTTOM = 1;
        Control._VERTICAL_ALIGNMENT_CENTER = 2;
        Control._FontHeightSizes = {};
        GUI.Control = Control;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=control.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>
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
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Container = (function (_super) {
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
            Container.prototype.containsControl = function (control) {
                return this._children.indexOf(control) !== -1;
            };
            Container.prototype.addControl = function (control) {
                var index = this._children.indexOf(control);
                if (index !== -1) {
                    return this;
                }
                control._link(this, this._host);
                this._reOrderControl(control);
                this._markAsDirty();
                return this;
            };
            Container.prototype.removeControl = function (control) {
                var index = this._children.indexOf(control);
                if (index !== -1) {
                    this._children.splice(index, 1);
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
                    context.fillStyle = this._background;
                    context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
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
                context.save();
                this._applyStates(context);
                if (this._processMeasures(parentMeasure, context)) {
                    this._localDraw(context);
                    this._clipForChildren(context);
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        if (child.isVisible) {
                            child._draw(this._measureForChildren, context);
                        }
                    }
                }
                context.restore();
            };
            Container.prototype._processPicking = function (x, y, type) {
                if (!_super.prototype.contains.call(this, x, y)) {
                    return false;
                }
                // Checking backwards to pick closest first
                for (var index = this._children.length - 1; index >= 0; index--) {
                    var child = this._children[index];
                    if (child._processPicking(x, y, type)) {
                        return true;
                    }
                }
                return this._processObservables(type, x, y);
            };
            Container.prototype._clipForChildren = function (context) {
                // DO nothing
            };
            Container.prototype._additionalProcessing = function (parentMeasure, context) {
                _super.prototype._additionalProcessing.call(this, parentMeasure, context);
                this._measureForChildren.copyFrom(this._currentMeasure);
            };
            return Container;
        }(GUI.Control));
        GUI.Container = Container;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=container.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>
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
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var StackPanel = (function (_super) {
            __extends(StackPanel, _super);
            function StackPanel(name) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._isVertical = true;
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
            StackPanel.prototype._additionalProcessing = function (parentMeasure, context) {
                var stack = 0;
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    child._currentMeasure.copyFrom(parentMeasure);
                    child._measure();
                    if (this._isVertical) {
                        child.top = stack + "px";
                        stack += child._currentMeasure.height;
                        child.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                    }
                    else {
                        child.left = stack + "px";
                        stack += child._currentMeasure.width;
                        child.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                    }
                }
                if (this._isVertical) {
                    this.height = stack + "px";
                    this._height.ignoreAdaptiveScaling = true;
                }
                else {
                    this.width = stack + "px";
                    this._width.ignoreAdaptiveScaling = true;
                }
                _super.prototype._additionalProcessing.call(this, parentMeasure, context);
            };
            return StackPanel;
        }(GUI.Container));
        GUI.StackPanel = StackPanel;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=stackPanel.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>
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
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Rectangle = (function (_super) {
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
            Rectangle.prototype._localDraw = function (context) {
                context.save();
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
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Ellipse = (function (_super) {
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
            Ellipse.prototype._localDraw = function (context) {
                context.save();
                context.beginPath();
                context.ellipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2 - this._thickness / 2, this._currentMeasure.height / 2 - this._thickness / 2, 0, 0, 2 * Math.PI);
                context.closePath();
                if (this._background) {
                    context.fillStyle = this._background;
                    context.fill();
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
                context.beginPath();
                context.ellipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2, this._currentMeasure.height / 2, 0, 0, 2 * Math.PI);
                context.clip();
            };
            return Ellipse;
        }(GUI.Container));
        GUI.Ellipse = Ellipse;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=ellipse.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>
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
var DOMImage = Image;
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Line = (function (_super) {
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
            Line.prototype._draw = function (parentMeasure, context) {
                context.save();
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
var DOMImage = Image;
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Slider = (function (_super) {
            __extends(Slider, _super);
            function Slider(name) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._thumbWidth = new GUI.ValueAndUnit(30, GUI.ValueAndUnit.UNITMODE_PIXEL, false);
                _this._minimum = 0;
                _this._maximum = 100;
                _this._value = 50;
                _this._background = "black";
                _this._foreground = "green";
                _this._borderColor = "white";
                _this._barOffset = new GUI.ValueAndUnit(5, GUI.ValueAndUnit.UNITMODE_PIXEL, false);
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
            Object.defineProperty(Slider.prototype, "foreground", {
                get: function () {
                    return this._foreground;
                },
                set: function (value) {
                    if (this._foreground === value) {
                        return;
                    }
                    this._foreground = value;
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
            Slider.prototype._draw = function (parentMeasure, context) {
                context.save();
                this._applyStates(context);
                if (this._processMeasures(parentMeasure, context)) {
                    // Main bar
                    var effectiveThumbWidth;
                    var effectiveBarOffset;
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
                    context.fillStyle = this._foreground;
                    context.fillRect(left, this._currentMeasure.top + effectiveBarOffset, thumbPosition, this._currentMeasure.height - effectiveBarOffset * 2);
                    // Thumb
                    context.fillRect(left + thumbPosition - effectiveThumbWidth / 2, this._currentMeasure.top, effectiveThumbWidth, this._currentMeasure.height);
                    context.strokeStyle = this._borderColor;
                    context.strokeRect(left + thumbPosition - effectiveThumbWidth / 2, this._currentMeasure.top, effectiveThumbWidth, this._currentMeasure.height);
                }
                context.restore();
            };
            Slider.prototype._updateValueFromPointer = function (x) {
                this.value = this._minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this._maximum - this._minimum);
            };
            Slider.prototype._onPointerDown = function (coordinates) {
                this._pointerIsDown = true;
                this._updateValueFromPointer(coordinates.x);
                this._host._capturingControl = this;
                _super.prototype._onPointerDown.call(this, coordinates);
            };
            Slider.prototype._onPointerMove = function (coordinates) {
                if (this._pointerIsDown) {
                    this._updateValueFromPointer(coordinates.x);
                }
            };
            Slider.prototype._onPointerUp = function (coordinates) {
                this._pointerIsDown = false;
                this._host._capturingControl = null;
                _super.prototype._onPointerUp.call(this, coordinates);
            };
            return Slider;
        }(GUI.Control));
        GUI.Slider = Slider;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=slider.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>
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
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var TextBlock = (function (_super) {
            __extends(TextBlock, _super);
            function TextBlock(name, text) {
                if (text === void 0) { text = ""; }
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._text = "";
                _this._textWrapping = false;
                _this._textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                _this._textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                _this.text = text;
                return _this;
            }
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
                if (this._textWrapping) {
                    var words = this.text.split(' ');
                    var line = '';
                    var width = this._currentMeasure.width;
                    var lineWidth = 0;
                    for (var n = 0; n < words.length; n++) {
                        var testLine = line + words[n] + ' ';
                        var metrics = context.measureText(testLine);
                        var testWidth = metrics.width;
                        if (testWidth > width && n > 0) {
                            this._lines.push({ text: line, width: lineWidth });
                            line = words[n] + ' ';
                            lineWidth = context.measureText(line).width;
                        }
                        else {
                            lineWidth = testWidth;
                            line = testLine;
                        }
                    }
                    this._lines.push({ text: line, width: lineWidth });
                }
                else {
                    this._lines.push({ text: this.text, width: context.measureText(this.text).width });
                }
            };
            TextBlock.prototype._renderLines = function (context) {
                var width = this._currentMeasure.width;
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
                for (var _i = 0, _a = this._lines; _i < _a.length; _i++) {
                    var line = _a[_i];
                    this._drawText(line.text, line.width, rootY, context);
                    rootY += this._fontOffset.height;
                }
            };
            return TextBlock;
        }(GUI.Control));
        GUI.TextBlock = TextBlock;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=textBlock.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>
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
var DOMImage = Image;
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Image = (function (_super) {
            __extends(Image, _super);
            function Image(name, url) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
                _this._loaded = false;
                _this._stretch = Image.STRETCH_FILL;
                _this._autoScale = false;
                _this.source = url;
                return _this;
            }
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
                    this._domImage.src = value;
                },
                enumerable: true,
                configurable: true
            });
            Image.prototype.synchronizeSizeWithContent = function () {
                if (!this._loaded) {
                    return;
                }
                this.width = this._domImage.width + "px";
                this.height = this._domImage.height + "px";
            };
            Image.prototype._draw = function (parentMeasure, context) {
                context.save();
                this._applyStates(context);
                if (this._processMeasures(parentMeasure, context)) {
                    if (this._loaded) {
                        switch (this._stretch) {
                            case Image.STRETCH_NONE:
                                context.drawImage(this._domImage, this._currentMeasure.left, this._currentMeasure.top);
                                break;
                            case Image.STRETCH_FILL:
                                context.drawImage(this._domImage, 0, 0, this._imageWidth, this._imageHeight, this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                                break;
                            case Image.STRETCH_UNIFORM:
                                var hRatio = this._currentMeasure.width / this._imageWidth;
                                var vRatio = this._currentMeasure.height / this._imageHeight;
                                var ratio = Math.min(hRatio, vRatio);
                                var centerX = (this._currentMeasure.width - this._imageWidth * ratio) / 2;
                                var centerY = (this._currentMeasure.height - this._imageHeight * ratio) / 2;
                                context.drawImage(this._domImage, 0, 0, this._imageWidth, this._imageHeight, this._currentMeasure.left + centerX, this._currentMeasure.top + centerY, this._imageWidth * ratio, this._imageHeight * ratio);
                                break;
                            case Image.STRETCH_EXTEND:
                                context.drawImage(this._domImage, this._currentMeasure.left, this._currentMeasure.top);
                                if (this._autoScale) {
                                    this.synchronizeSizeWithContent();
                                }
                                this._root.width = this.width;
                                this._root.height = this.height;
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
            return Image;
        }(GUI.Control));
        // Static
        Image._STRETCH_NONE = 0;
        Image._STRETCH_FILL = 1;
        Image._STRETCH_UNIFORM = 2;
        Image._STRETCH_EXTEND = 3;
        GUI.Image = Image;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=image.js.map

/// <reference path="../../../dist/preview release/babylon.d.ts"/>
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
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var Button = (function (_super) {
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
            // While being a container, the button behaves like a control.
            Button.prototype._processPicking = function (x, y, type) {
                if (!this.contains(x, y)) {
                    return false;
                }
                this._processObservables(type, x, y);
                return true;
            };
            Button.prototype._onPointerEnter = function () {
                if (this.pointerEnterAnimation) {
                    this.pointerEnterAnimation();
                }
                _super.prototype._onPointerEnter.call(this);
            };
            Button.prototype._onPointerOut = function () {
                if (this.pointerOutAnimation) {
                    this.pointerOutAnimation();
                }
                _super.prototype._onPointerOut.call(this);
            };
            Button.prototype._onPointerDown = function (coordinates) {
                if (this.pointerDownAnimation) {
                    this.pointerDownAnimation();
                }
                _super.prototype._onPointerDown.call(this, coordinates);
            };
            Button.prototype._onPointerUp = function (coordinates) {
                if (this.pointerUpAnimation) {
                    this.pointerUpAnimation();
                }
                _super.prototype._onPointerUp.call(this, coordinates);
            };
            // Statics
            Button.CreateImageButton = function (name, text, imageUrl) {
                var result = new Button(name);
                // Adding text
                var textBlock = new BABYLON.GUI.TextBlock(name + "_button", text);
                textBlock.textWrapping = true;
                textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                textBlock.marginLeft = "20%";
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
            return Button;
        }(GUI.Rectangle));
        GUI.Button = Button;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=button.js.map
