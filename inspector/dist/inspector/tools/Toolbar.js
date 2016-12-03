var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var Toolbar = (function (_super) {
        __extends(Toolbar, _super);
        function Toolbar(inspector) {
            _super.call(this);
            this._tools = [];
            this._inspector = inspector;
            this._build();
            this._addTools();
        }
        // A toolbar cannot be updated
        Toolbar.prototype.update = function () { };
        ;
        Toolbar.prototype._build = function () {
            this._div.className = 'toolbar';
        };
        ;
        Toolbar.prototype._addTools = function () {
            // Refresh
            this._tools.push(new INSPECTOR.RefreshTool(this._div, this._inspector));
            // Pick object
            this._tools.push(new INSPECTOR.PickTool(this._div, this._inspector));
            // Add the popup mode only if the inspector is not in popup mode
            if (!this._inspector.popupMode) {
                this._tools.push(new INSPECTOR.PopupTool(this._div, this._inspector));
            }
            // Pause schedule
            this._tools.push(new INSPECTOR.PauseScheduleTool(this._div, this._inspector));
        };
        /**
         * Returns the total width in pixel of the tabbar,
         * that corresponds to the sum of the width of each tab + toolbar width
        */
        Toolbar.prototype.getPixelWidth = function () {
            var sum = 0;
            for (var _i = 0, _a = this._tools; _i < _a.length; _i++) {
                var tool = _a[_i];
                sum += tool.getPixelWidth();
            }
            return sum;
        };
        return Toolbar;
    }(INSPECTOR.BasicElement));
    INSPECTOR.Toolbar = Toolbar;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=Toolbar.js.map