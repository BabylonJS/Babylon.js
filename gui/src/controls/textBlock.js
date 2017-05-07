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
            TextBlock.prototype._measure = function (parentMeasure, context) {
                _super.prototype._measure;
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
