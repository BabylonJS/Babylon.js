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
                _this._renderObserver = _this.getScene().onBeforeRenderObservable.add(function () { return _this._checkUpdate(); });
                _this._rootContainer._link(null, _this);
                _this.hasAlpha = true;
                if (!width || !height) {
                    _this._resizeObserver = _this.getScene().getEngine().onResizeObservable.add(function () { return _this._onResize(); });
                    _this._onResize();
                }
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
                this.getScene().onBeforeRenderObservable.remove(this._renderObserver);
                if (this._resizeObserver) {
                    this.getScene().getEngine().onResizeObservable.remove(this._resizeObserver);
                }
                if (this._pointerMoveObserver) {
                    this.getScene().onPrePointerObservable.remove(this._pointerMoveObserver);
                }
                if (this._toDispose) {
                    this._toDispose.dispose();
                    this._toDispose = null;
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
                }
            };
            AdvancedDynamicTexture.prototype._checkUpdate = function () {
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
                var measure = new GUI.Measure(0, 0, renderWidth, renderHeight);
                this._rootContainer._draw(measure, context);
            };
            AdvancedDynamicTexture.prototype._doPicking = function (x, y, type) {
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
                    pi.skipOnPointerObservable = _this._shouldBlockPointer;
                });
            };
            // Statics
            AdvancedDynamicTexture.CreateForMesh = function (mesh, width, height) {
                if (width === void 0) { width = 1024; }
                if (height === void 0) { height = 1024; }
                var result = new AdvancedDynamicTexture(mesh.name + " AdvancedDynamicTexture", width, height, mesh.getScene(), true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
                var material = new BABYLON.StandardMaterial("AdvancedDynamicTextureMaterial", mesh.getScene());
                material.backFaceCulling = false;
                material.emissiveTexture = result;
                material.opacityTexture = result;
                mesh.material = material;
                return result;
            };
            AdvancedDynamicTexture.CreateFullscreenUI = function (name, foreground, scene) {
                if (foreground === void 0) { foreground = true; }
                var result = new AdvancedDynamicTexture(name, 0, 0, scene);
                // Display
                var layer = new BABYLON.Layer(name + "_layer", null, scene, !foreground);
                layer.texture = result;
                result._toDispose = layer;
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
            };
            return Matrix2D;
        }());
        Matrix2D._TempPreTranslationMatrix = Matrix2D.Identity();
        Matrix2D._TempPostTranslationMatrix = Matrix2D.Identity();
        Matrix2D._TempRotationMatrix = Matrix2D.Identity();
        Matrix2D._TempScalingMatrix = Matrix2D.Identity();
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
                if (value === void 0) { value = 1; }
                if (unit === void 0) { unit = ValueAndUnit.UNITMODE_PERCENTAGE; }
                if (negativeValueAllowed === void 0) { negativeValueAllowed = true; }
                this.value = value;
                this.unit = unit;
                this.negativeValueAllowed = negativeValueAllowed;
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
            ValueAndUnit.prototype.toString = function () {
                switch (this.unit) {
                    case ValueAndUnit.UNITMODE_PERCENTAGE:
                        return this.unit + "%";
                    case ValueAndUnit.UNITMODE_PIXEL:
                        return this.unit + "px";
                }
                return this.unit.toString();
            };
            ValueAndUnit.prototype.fromString = function (source) {
                var match = ValueAndUnit._Regex.exec(source);
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
                if (sourceValue === this.value && sourceUnit === this.unit) {
                    return false;
                }
                this.value = sourceValue;
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
                this._zIndex = 0;
                this._currentMeasure = GUI.Measure.Empty();
                this._fontSize = 18;
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
                this._isMatrixDirty = true;
                this.isHitTestVisible = true;
                this.isPointerBlocker = false;
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
                this.fontFamily = "Arial";
            }
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
                    this._isMatrixDirty = true;
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
                    this._isMatrixDirty = true;
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
                    this._isMatrixDirty = true;
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
                    this._isMatrixDirty = true;
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
                    this._isMatrixDirty = true;
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
                    return this._width.toString();
                },
                set: function (value) {
                    if (this._width.toString() === value) {
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
                    return this._height.toString();
                },
                set: function (value) {
                    if (this._height.toString() === value) {
                        return;
                    }
                    if (this._height.fromString(value)) {
                        this._markAsDirty();
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
                    this._prepareFont();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "fontSize", {
                get: function () {
                    return this._fontSize;
                },
                set: function (value) {
                    if (this._fontSize === value) {
                        return;
                    }
                    this._fontSize = value;
                    this._prepareFont();
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
                    this._root._reOrderControl(this);
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
                    return this._marginLeft.toString();
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
                    return this._marginRight.toString();
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
                    return this._marginTop.toString();
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
                    return this._marginBottom.toString();
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
                    return this._left.toString();
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
                    return this._top.toString();
                },
                set: function (value) {
                    if (this._top.fromString(value)) {
                        this._markAsDirty();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Control.prototype._markAsDirty = function () {
                this._isDirty = true;
                if (!this._host) {
                    return; // Not yet connected
                }
                this._host.markAsDirty();
            };
            Control.prototype._link = function (root, host) {
                this._root = root;
                this._host = host;
            };
            Control.prototype._transform = function (context) {
                if (this._scaleX === 1 && this._scaleY === 1 && this._rotation === 0) {
                    return;
                }
                // preTranslate
                var offsetX = this._currentMeasure.width * this._transformCenterX + this._currentMeasure.left;
                var offsetY = this._currentMeasure.height * this._transformCenterY + this._currentMeasure.top;
                context.translate(offsetX, offsetY);
                // scale
                context.scale(this._scaleX, this._scaleY);
                // rotate
                context.rotate(this._rotation);
                // postTranslate
                context.translate(-offsetX, -offsetY);
                // Need to update matrices?
                if (this._isMatrixDirty || this._cachedOffsetX !== offsetX || this._cachedOffsetY !== offsetY) {
                    this._cachedOffsetX = offsetX;
                    this._cachedOffsetY = offsetY;
                    this._isMatrixDirty = false;
                    GUI.Matrix2D.ComposeToRef(offsetX, offsetY, this._rotation, this._scaleX, this._scaleY, this._root ? this._root._transformMatrix : null, this._transformMatrix);
                    this._transformMatrix.invertToRef(this._invertTransformMatrix);
                }
            };
            Control.prototype._applyStates = function (context) {
                if (this._font) {
                    context.font = this._font;
                }
                if (this._color) {
                    context.fillStyle = this._color;
                }
            };
            Control.prototype._processMeasures = function (parentMeasure, context) {
                if (this._isDirty || !this._cachedParentMeasure.isEqualsTo(parentMeasure)) {
                    this._currentMeasure.copyFrom(parentMeasure);
                    this._measure(parentMeasure, context);
                    this._computeAlignment(parentMeasure, context);
                    // Convert to int values
                    this._currentMeasure.left = this._currentMeasure.left | 0;
                    this._currentMeasure.top = this._currentMeasure.top | 0;
                    this._currentMeasure.width = this._currentMeasure.width | 0;
                    this._currentMeasure.height = this._currentMeasure.height | 0;
                    // Let children add more features
                    this._additionalProcessing(parentMeasure, context);
                    this._isDirty = false;
                    this._cachedParentMeasure.copyFrom(parentMeasure);
                }
                // Transform
                this._transform(context);
                // Clip
                this._clip(context);
                context.clip();
            };
            Control.prototype._clip = function (context) {
                context.beginPath();
                context.rect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            };
            Control.prototype._measure = function (parentMeasure, context) {
                // Width / Height
                if (this._width.isPixel) {
                    this._currentMeasure.width = this._width.value;
                }
                else {
                    this._currentMeasure.width *= this._width.value;
                }
                if (this._height.isPixel) {
                    this._currentMeasure.height = this._height.value;
                }
                else {
                    this._currentMeasure.height *= this._height.value;
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
                    this._currentMeasure.left += this._marginLeft.value;
                    this._currentMeasure.width -= this._marginRight.value;
                }
                else {
                    this._currentMeasure.left += parentWidth * this._marginLeft.value;
                    this._currentMeasure.width -= parentWidth * this._marginLeft.value;
                }
                if (this._marginRight.isPixel) {
                    this._currentMeasure.width -= this._marginRight.value;
                }
                else {
                    this._currentMeasure.width -= parentWidth * this._marginRight.value;
                }
                if (this._marginTop.isPixel) {
                    this._currentMeasure.top += this._marginTop.value;
                    this._currentMeasure.height -= this._marginTop.value;
                }
                else {
                    this._currentMeasure.top += parentHeight * this._marginTop.value;
                    this._currentMeasure.height -= parentHeight * this._marginTop.value;
                }
                if (this._marginBottom.isPixel) {
                    this._currentMeasure.height -= this._marginBottom.value;
                }
                else {
                    this._currentMeasure.height -= parentHeight * this._marginBottom.value;
                }
                if (this._left.isPixel) {
                    this._currentMeasure.left += this._left.value;
                }
                else {
                    this._currentMeasure.left += parentWidth * this._left.value;
                }
                if (this._top.isPixel) {
                    this._currentMeasure.top += this._top.value;
                }
                else {
                    this._currentMeasure.top += parentHeight * this._top.value;
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
                if (this._scaleX !== 1 || this._scaleY !== 1 || this.rotation !== 0) {
                }
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
                if (!this.contains(x, y)) {
                    return false;
                }
                this._processObservables(type);
                return true;
            };
            Control.prototype._onPointerMove = function () {
                if (this.onPointerMoveObservable.hasObservers()) {
                    this.onPointerMoveObservable.notifyObservers(this);
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
            Control.prototype._onPointerDown = function () {
                if (this.onPointerDownObservable.hasObservers()) {
                    this.onPointerDownObservable.notifyObservers(this);
                }
            };
            Control.prototype._onPointerUp = function () {
                if (this.onPointerUpObservable.hasObservers()) {
                    this.onPointerUpObservable.notifyObservers(this);
                }
            };
            Control.prototype._processObservables = function (type) {
                if (!this.isHitTestVisible) {
                    return false;
                }
                if (type === BABYLON.PointerEventTypes.POINTERMOVE) {
                    this._onPointerMove();
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
                    this._onPointerDown();
                    this._host._lastControlDown = this;
                    return true;
                }
                if (type === BABYLON.PointerEventTypes.POINTERUP) {
                    this._onPointerUp();
                    if (this._host._lastControlDown !== this) {
                        this._host._lastControlDown._onPointerUp();
                        this._host._lastControlDown = null;
                    }
                    return true;
                }
                return false;
            };
            Control.prototype._prepareFont = function () {
                if (!this._fontFamily) {
                    return;
                }
                this._font = this._fontSize + "px " + this._fontFamily;
                this._fontOffset = Control._GetFontOffset(this._font);
                this._markAsDirty();
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
            Container.prototype._localDraw = function (context) {
                // Implemented by child to be injected inside main draw
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
                _super.prototype._processMeasures.call(this, parentMeasure, context);
                this._applyStates(context);
                this._localDraw(context);
                this._clipForChildren(context);
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    child._draw(this._measureForChildren, context);
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
                return this._processObservables(type);
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
            Object.defineProperty(Rectangle.prototype, "background", {
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
        var TextBlock = (function (_super) {
            __extends(TextBlock, _super);
            function TextBlock(name, text) {
                var _this = _super.call(this, name) || this;
                _this.name = name;
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
                _super.prototype._processMeasures.call(this, parentMeasure, context);
                // Render lines
                this._renderLines(context);
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
                _this._domImage = new DOMImage();
                _this._domImage.onload = function () {
                    _this._imageWidth = _this._domImage.width;
                    _this._imageHeight = _this._domImage.height;
                    _this._loaded = true;
                    _this._markAsDirty();
                };
                _this._domImage.src = url;
                return _this;
            }
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
            Image.prototype._draw = function (parentMeasure, context) {
                context.save();
                this._applyStates(context);
                _super.prototype._processMeasures.call(this, parentMeasure, context);
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
            return Image;
        }(GUI.Control));
        // Static
        Image._STRETCH_NONE = 0;
        Image._STRETCH_FILL = 1;
        Image._STRETCH_UNIFORM = 2;
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
                return _this;
            }
            // While being a container, the button behaves like a control.
            Button.prototype._processPicking = function (x, y, type) {
                if (!this.contains(x, y)) {
                    return false;
                }
                this._processObservables(type);
                return true;
            };
            Button.prototype._onPointerEnter = function () {
                this.scaleX += 0.01;
                this.scaleY += 0.01;
                _super.prototype._onPointerEnter.call(this);
            };
            Button.prototype._onPointerOut = function () {
                this.scaleX -= 0.01;
                this.scaleY -= 0.01;
                _super.prototype._onPointerOut.call(this);
            };
            Button.prototype._onPointerDown = function () {
                this.scaleX -= 0.05;
                this.scaleY -= 0.05;
                _super.prototype._onPointerDown.call(this);
            };
            Button.prototype._onPointerUp = function () {
                this.scaleX += 0.05;
                this.scaleY += 0.05;
                _super.prototype._onPointerUp.call(this);
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
