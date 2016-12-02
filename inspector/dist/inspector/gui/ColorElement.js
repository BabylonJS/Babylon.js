var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    /**
    * Display a very small div corresponding to the given color
    */
    var ColorElement = (function (_super) {
        __extends(ColorElement, _super);
        // The color as hexadecimal string
        function ColorElement(color) {
            _super.call(this);
            this._div.className = 'color-element';
            this._div.style.backgroundColor = this._toRgba(color);
        }
        ColorElement.prototype.update = function (color) {
            if (color) {
                this._div.style.backgroundColor = this._toRgba(color);
            }
        };
        ColorElement.prototype._toRgba = function (color) {
            if (color) {
                var r = (color.r * 255) | 0;
                var g = (color.g * 255) | 0;
                var b = (color.b * 255) | 0;
                var a = 1;
                if (color instanceof BABYLON.Color4) {
                    var a_1 = color.a;
                }
                return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
            }
            else {
                return '';
            }
        };
        return ColorElement;
    }(INSPECTOR.BasicElement));
    INSPECTOR.ColorElement = ColorElement;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=ColorElement.js.map