var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var Canvas2DAdapter = (function (_super) {
        __extends(Canvas2DAdapter, _super);
        function Canvas2DAdapter(obj) {
            _super.call(this, obj);
        }
        /** Returns the name displayed in the tree */
        Canvas2DAdapter.prototype.id = function () {
            var str = '';
            if (this._obj.id) {
                str = this._obj.id;
            } // otherwise nothing displayed        
            return str;
        };
        /** Returns the type of this object - displayed in the tree */
        Canvas2DAdapter.prototype.type = function () {
            return INSPECTOR.Helpers.GET_TYPE(this._obj);
        };
        /** Returns the list of properties to be displayed for this adapter */
        Canvas2DAdapter.prototype.getProperties = function () {
            var _this = this;
            var propertiesLines = [];
            if (this._obj.propDic) {
                var dico = this._obj.propDic;
                dico.forEach(function (name, propInfo) {
                    var property = new INSPECTOR.Property(name, _this.actualObject);
                    propertiesLines.push(new INSPECTOR.PropertyLine(property));
                });
            }
            // TODO REMOVE THIS WHEN PROPERTIES WILL BE DECORATED
            var toAddDirty = [
                'actualZOffset', 'isSizeAuto', 'layoutArea', 'layoutAreaPos', 'contentArea',
                'marginOffset', 'paddingOffset', 'isPickable', 'isContainer', 'boundingInfo',
                'levelBoundingInfo', 'isSizedByContent', 'isPositionAuto', 'actualScale', 'layoutBoundingInfo'];
            for (var _i = 0, toAddDirty_1 = toAddDirty; _i < toAddDirty_1.length; _i++) {
                var dirty = toAddDirty_1[_i];
                var infos = new INSPECTOR.Property(dirty, this.actualObject);
                propertiesLines.push(new INSPECTOR.PropertyLine(infos));
            }
            return propertiesLines;
        };
        Canvas2DAdapter.prototype.getTools = function () {
            var tools = [];
            tools.push(new INSPECTOR.Checkbox(this));
            tools.push(new INSPECTOR.DebugArea(this));
            return tools;
        };
        /// TOOLS ///
        Canvas2DAdapter.prototype.setVisible = function (b) {
            this._obj.levelVisible = b;
        };
        Canvas2DAdapter.prototype.isVisible = function () {
            return this._obj.levelVisible;
        };
        /** Overrides super */
        Canvas2DAdapter.prototype.debug = function (b) {
            this._obj["displayDebugAreas"] = b;
        };
        /** Overrides super.highlight */
        Canvas2DAdapter.prototype.highlight = function (b) {
        };
        return Canvas2DAdapter;
    }(INSPECTOR.Adapter));
    INSPECTOR.Canvas2DAdapter = Canvas2DAdapter;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=Canvas2DAdapter.js.map