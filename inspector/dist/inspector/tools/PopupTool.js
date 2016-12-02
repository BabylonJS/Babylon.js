var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var PopupTool = (function (_super) {
        __extends(PopupTool, _super);
        function PopupTool(parent, inspector) {
            _super.call(this, 'fa-external-link', parent, inspector, 'Creates the inspector in an external popup');
        }
        // Action : refresh the whole panel
        PopupTool.prototype.action = function () {
            this._inspector.openPopup();
        };
        return PopupTool;
    }(INSPECTOR.AbstractTool));
    INSPECTOR.PopupTool = PopupTool;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=PopupTool.js.map