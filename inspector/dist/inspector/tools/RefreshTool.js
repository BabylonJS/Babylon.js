var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var RefreshTool = (function (_super) {
        __extends(RefreshTool, _super);
        function RefreshTool(parent, inspector) {
            _super.call(this, 'fa-refresh', parent, inspector, 'Refresh the current tab');
        }
        // Action : refresh the whole panel
        RefreshTool.prototype.action = function () {
            this._inspector.refresh();
        };
        return RefreshTool;
    }(INSPECTOR.AbstractTool));
    INSPECTOR.RefreshTool = RefreshTool;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=RefreshTool.js.map