var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var MeshTab = (function (_super) {
        __extends(MeshTab, _super);
        function MeshTab(tabbar, inspector) {
            _super.call(this, tabbar, 'Mesh', inspector);
        }
        /* Overrides super */
        MeshTab.prototype._getTree = function () {
            var arr = [];
            // Returns true if the id of the given object starts and ends with '###'
            var shouldExcludeThisMesh = function (obj) {
                return (obj.name && obj.name.indexOf('###') == 0 && obj.name.lastIndexOf('###', 0) === 0);
            };
            // get all meshes from the first scene
            var instances = this._inspector.scene;
            for (var _i = 0, _a = instances.meshes; _i < _a.length; _i++) {
                var mesh = _a[_i];
                if (!shouldExcludeThisMesh(mesh)) {
                    arr.push(new INSPECTOR.TreeItem(this, new INSPECTOR.MeshAdapter(mesh)));
                }
            }
            return arr;
        };
        return MeshTab;
    }(INSPECTOR.PropertyTab));
    INSPECTOR.MeshTab = MeshTab;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=MeshTab.js.map