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
                _this._textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                _this._textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                _this.text = text;
                return _this;
            }
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
                _super.prototype._processMeasures.call(this, parentMeasure, context);
                this.applyStates(context);
                this._computeTextAlignment(context);
                var words = this.text.split(' ');
                var line = '';
                var width = this._currentMeasure.width;
                var y = this._textY;
                var lineWidth = 0;
                for (var n = 0; n < words.length; n++) {
                    var testLine = line + words[n] + ' ';
                    var metrics = context.measureText(testLine);
                    var testWidth = metrics.width;
                    if (testWidth > width && n > 0) {
                        this._drawText(line, lineWidth, y, context);
                        line = words[n] + ' ';
                        lineWidth = context.measureText(line).width;
                        y += this._lineHeight;
                    }
                    else {
                        lineWidth = testWidth;
                        line = testLine;
                    }
                }
                this._drawText(line, lineWidth, y, context);
                context.restore();
            };
            TextBlock.prototype._computeTextAlignment = function (context) {
                var width = this._currentMeasure.width;
                var height = this._currentMeasure.height;
                var y = 0;
                if (!this._fontOffset) {
                    this._fontOffset = GUI.Control._GetFontOffset(context.font);
                }
                switch (this._textVerticalAlignment) {
                    case GUI.Control.VERTICAL_ALIGNMENT_TOP:
                        y = this._fontOffset.ascent;
                        break;
                    case GUI.Control.VERTICAL_ALIGNMENT_BOTTOM:
                        y = height - this._fontOffset.descent;
                        break;
                    case GUI.Control.VERTICAL_ALIGNMENT_CENTER:
                        y = (height / 2) + (this._fontOffset.ascent - this._fontOffset.height / 2);
                        break;
                }
                this._lineHeight = this._fontOffset.height;
                this._textY = this._currentMeasure.top + y;
            };
            return TextBlock;
        }(GUI.Control));
        GUI.TextBlock = TextBlock;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=textBlock.js.map
