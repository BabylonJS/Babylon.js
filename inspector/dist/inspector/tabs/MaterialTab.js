var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var MaterialTab = (function (_super) {
        __extends(MaterialTab, _super);
        function MaterialTab(tabbar, inspector) {
            _super.call(this, tabbar, 'Material', inspector);
        }
        /* Overrides super */
        MaterialTab.prototype._getTree = function () {
            var arr = [];
            // get all meshes from the first scene
            var instances = this._inspector.scene;
            for (var _i = 0, _a = instances.materials; _i < _a.length; _i++) {
                var mat = _a[_i];
                arr.push(new INSPECTOR.TreeItem(this, new INSPECTOR.MaterialAdapter(mat)));
            }
            return arr;
        };
        return MaterialTab;
    }(INSPECTOR.PropertyTab));
    INSPECTOR.MaterialTab = MaterialTab;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=MaterialTab.js.map