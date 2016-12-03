var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    /**
     * Checkbox to display/hide the primitive
     */
    var Info = (function (_super) {
        __extends(Info, _super);
        function Info(obj) {
            _super.call(this);
            this._obj = obj;
            this._elem.classList.add('fa-info-circle');
            this._tooltip = new INSPECTOR.Tooltip(this._elem, this._obj.getInfo());
        }
        // Nothing to do on click
        Info.prototype.action = function () {
            _super.prototype.action.call(this);
        };
        return Info;
    }(INSPECTOR.AbstractTreeTool));
    INSPECTOR.Info = Info;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=Info.js.map