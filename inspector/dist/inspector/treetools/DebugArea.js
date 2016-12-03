var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var DebugArea = (function (_super) {
        __extends(DebugArea, _super);
        function DebugArea(obj) {
            _super.call(this);
            this._obj = obj;
            this._elem.classList.add('fa-wrench');
        }
        DebugArea.prototype.action = function () {
            _super.prototype.action.call(this);
            if (this._on) {
                // set icon activated
                this._elem.classList.add('active');
            }
            else {
                // set icon deactivated
                this._elem.classList.remove('active');
            }
            this._obj.debug(this._on);
        };
        return DebugArea;
    }(INSPECTOR.AbstractTreeTool));
    INSPECTOR.DebugArea = DebugArea;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=DebugArea.js.map