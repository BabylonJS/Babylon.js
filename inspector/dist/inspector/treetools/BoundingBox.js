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
    var BoundingBox = (function (_super) {
        __extends(BoundingBox, _super);
        function BoundingBox(obj) {
            _super.call(this);
            this._obj = obj;
            this._elem.classList.add('fa-square-o');
            this._on = this._obj.isBoxVisible();
            this._check();
        }
        // For a checkbox, set visible/invisible the corresponding prim
        BoundingBox.prototype.action = function () {
            _super.prototype.action.call(this);
            // update object and gui according to the new status
            this._check();
        };
        BoundingBox.prototype._check = function () {
            if (this._on) {
                // set icon eye
                this._elem.classList.add('active');
            }
            else {
                // set icon eye-slash
                this._elem.classList.remove('active');
            }
            this._obj.setBoxVisible(this._on);
        };
        return BoundingBox;
    }(INSPECTOR.AbstractTreeTool));
    INSPECTOR.BoundingBox = BoundingBox;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=BoundingBox.js.map