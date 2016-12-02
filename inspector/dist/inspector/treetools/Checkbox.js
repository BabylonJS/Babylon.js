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
    var Checkbox = (function (_super) {
        __extends(Checkbox, _super);
        function Checkbox(obj) {
            _super.call(this);
            this._obj = obj;
            this._elem.classList.add('fa-eye');
            this._on = this._obj.isVisible();
            this._check();
        }
        // For a checkbox, set visible/invisible the corresponding prim
        Checkbox.prototype.action = function () {
            _super.prototype.action.call(this);
            // update object and gui according to the new status
            this._check();
        };
        Checkbox.prototype._check = function () {
            if (this._on) {
                // set icon eye
                this._elem.classList.add('fa-eye');
                this._elem.classList.add('active');
                this._elem.classList.remove('fa-eye-slash');
            }
            else {
                // set icon eye-slash
                this._elem.classList.remove('fa-eye');
                this._elem.classList.remove('active');
                this._elem.classList.add('fa-eye-slash');
            }
            this._obj.setVisible(this._on);
        };
        return Checkbox;
    }(INSPECTOR.AbstractTreeTool));
    INSPECTOR.Checkbox = Checkbox;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=Checkbox.js.map