var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var Canvas2DTab = (function (_super) {
        __extends(Canvas2DTab, _super);
        function Canvas2DTab(tabbar, inspector) {
            _super.call(this, tabbar, 'Canvas2D', inspector);
        }
        /* Overrides */
        Canvas2DTab.prototype._getTree = function () {
            var _this = this;
            var arr = [];
            // get all canvas2D
            var instances = BABYLON.Canvas2D.instances || [];
            // Returns true if the id of the given object starts and ends with '###'
            var shouldExcludeThisPrim = function (obj) {
                return (obj.id && obj.id.indexOf('###') == 0 && obj.id.lastIndexOf('###', 0) === 0);
            };
            // Recursive method building the tree panel
            var createNode = function (obj) {
                if (obj.children && obj.children.length > 0) {
                    var node = new INSPECTOR.TreeItem(_this, new INSPECTOR.Canvas2DAdapter(obj));
                    for (var _i = 0, _a = obj.children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        if (!shouldExcludeThisPrim(child)) {
                            var n = createNode(child);
                            node.add(n);
                        }
                    }
                    node.update();
                    return node;
                }
                else {
                    return new INSPECTOR.TreeItem(_this, new INSPECTOR.Canvas2DAdapter(obj));
                }
            };
            for (var _i = 0, instances_1 = instances; _i < instances_1.length; _i++) {
                var inst = instances_1[_i];
                var c2d = inst;
                var nodes = createNode(c2d);
                arr.push(nodes);
            }
            return arr;
        };
        return Canvas2DTab;
    }(INSPECTOR.PropertyTab));
    INSPECTOR.Canvas2DTab = Canvas2DTab;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=Canvas2DTab.js.map