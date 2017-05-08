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
                this.fontFamily = "Arial";
            }
            Object.defineProperty(Control.prototype, "horizontalAlignment", {
                // Properties
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
            Control.prototype.applyStates = function (context) {
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
                    this._additionalProcessing(parentMeasure, context);
                    this._isDirty = false;
                    this._cachedParentMeasure.copyFrom(parentMeasure);
                }
                // Clip
                context.beginPath();
                context.rect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                context.clip();
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
            Container.prototype._draw = function (parentMeasure, context) {
                context.save();
                _super.prototype._processMeasures.call(this, parentMeasure, context);
                this.applyStates(context);
                this._localDraw(context);
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    child._draw(this._measureForChildren, context);
                }
                context.restore();
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
                    context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                }
                if (this._thickness) {
                    if (this.color) {
                        context.strokeStyle = this.color;
                    }
                    context.lineWidth = this._thickness;
                    context.strokeRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
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
                this.applyStates(context);
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
                this.applyStates(context);
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
