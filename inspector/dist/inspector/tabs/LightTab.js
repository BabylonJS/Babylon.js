var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var LightTab = (function (_super) {
        __extends(LightTab, _super);
        function LightTab(tabbar, inspector) {
            _super.call(this, tabbar, 'Light', inspector);
        }
        /* Overrides super */
        LightTab.prototype._getTree = function () {
            var arr = [];
            // get all lights from the first scene
            var instances = this._inspector.scene;
            for (var _i = 0, _a = instances.lights; _i < _a.length; _i++) {
                var light = _a[_i];
                arr.push(new INSPECTOR.TreeItem(this, new INSPECTOR.LightAdapter(light)));
            }
            return arr;
        };
        return LightTab;
    }(INSPECTOR.PropertyTab));
    INSPECTOR.LightTab = LightTab;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=LightTab.js.map