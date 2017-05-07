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
                this._width = 1;
                this._height = 1;
                this._horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                this._verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                this._isDirty = true;
                this._cachedParentMeasure = GUI.Measure.Empty();
                this._marginLeft = 0;
                this._marginRight = 0;
                this._marginTop = 0;
                this._marginBottom = 0;
                this._unitMode = Control.UNITMODE_PERCENTAGE;
                this.fontFamily = "Arial";
            }
            Object.defineProperty(Control.prototype, "unitMode", {
                // Properties
                get: function () {
                    return this._unitMode;
                },
                set: function (value) {
                    if (this._unitMode === value) {
                        return;
                    }
                    this._unitMode = value;
                    this._markAsDirty();
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
                    return this._width;
                },
                set: function (value) {
                    if (value < 0) {
                        value = 0;
                    }
                    if (this._width === value) {
                        return;
                    }
                    this._width = value;
                    this._markAsDirty();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "height", {
                get: function () {
                    return this._height;
                },
                set: function (value) {
                    if (value < 0) {
                        value = 0;
                    }
                    if (this._height === value) {
                        return;
                    }
                    this._height = value;
                    this._markAsDirty();
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
                    return this._marginLeft;
                },
                set: function (value) {
                    if (this._marginLeft === value) {
                        return;
                    }
                    this._marginLeft = value;
                    this._markAsDirty();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "marginRight", {
                get: function () {
                    return this._marginRight;
                },
                set: function (value) {
                    if (this._marginRight === value) {
                        return;
                    }
                    this._marginRight = value;
                    this._markAsDirty();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "marginTop", {
                get: function () {
                    return this._marginTop;
                },
                set: function (value) {
                    if (this._marginTop === value) {
                        return;
                    }
                    this._marginTop = value;
                    this._markAsDirty();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control.prototype, "marginBottom", {
                get: function () {
                    return this._marginBottom;
                },
                set: function (value) {
                    if (this._marginBottom === value) {
                        return;
                    }
                    this._marginBottom = value;
                    this._markAsDirty();
                },
                enumerable: true,
                configurable: true
            });
            Control.prototype._markAsDirty = function () {
                this._isDirty = true;
                if (!this._root) {
                    return; // Not yet connected
                }
                this._root._markAsDirty();
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
                }
                // Clip
                context.beginPath();
                context.rect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                context.clip();
                this._isDirty = false;
                this._cachedParentMeasure.copyFrom(parentMeasure);
            };
            Control.prototype._measure = function (parentMeasure, context) {
                // Width / Height
                if (this._unitMode === Control.UNITMODE_PIXEL) {
                    this._currentMeasure.width = this._width;
                }
                else {
                    this._currentMeasure.width *= this._width;
                }
                if (this._unitMode === Control.UNITMODE_PIXEL) {
                    this._currentMeasure.height = this._height;
                }
                else {
                    this._currentMeasure.height *= this._height;
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
                if (this._unitMode === Control.UNITMODE_PIXEL) {
                    this._currentMeasure.left += this._marginLeft;
                    this._currentMeasure.left -= this._marginRight;
                    this._currentMeasure.top += this._marginTop;
                    this._currentMeasure.top -= this._marginBottom;
                }
                else {
                    this._currentMeasure.left += parentWidth * this._marginLeft;
                    this._currentMeasure.left -= parentWidth * this._marginRight;
                    this._currentMeasure.top += parentHeight * this._marginTop;
                    this._currentMeasure.top -= parentHeight * this._marginBottom;
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
            Object.defineProperty(Control, "UNITMODE_PERCENTAGE", {
                get: function () {
                    return Control._UNITMODE_PERCENTAGE;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Control, "UNITMODE_PIXEL", {
                get: function () {
                    return Control._UNITMODE_PIXEL;
                },
                enumerable: true,
                configurable: true
            });
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
        Control._UNITMODE_PERCENTAGE = 0;
        Control._UNITMODE_PIXEL = 1;
        Control._FontHeightSizes = {};
        GUI.Control = Control;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=control.js.map
