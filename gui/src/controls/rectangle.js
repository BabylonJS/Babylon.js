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
            return Rectangle;
        }(GUI.ContentControl));
        GUI.Rectangle = Rectangle;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=rectangle.js.map
