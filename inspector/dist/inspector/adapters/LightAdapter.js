var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var LightAdapter = (function (_super) {
        __extends(LightAdapter, _super);
        function LightAdapter(obj) {
            _super.call(this, obj);
        }
        /** Returns the name displayed in the tree */
        LightAdapter.prototype.id = function () {
            var str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        };
        /** Returns the type of this object - displayed in the tree */
        LightAdapter.prototype.type = function () {
            return INSPECTOR.Helpers.GET_TYPE(this._obj);
        };
        /** Returns the list of properties to be displayed for this adapter */
        LightAdapter.prototype.getProperties = function () {
            var propertiesLines = [];
            for (var _i = 0, _a = LightAdapter._PROPERTIES; _i < _a.length; _i++) {
                var dirty = _a[_i];
                var infos = new INSPECTOR.Property(dirty, this._obj);
                propertiesLines.push(new INSPECTOR.PropertyLine(infos));
            }
            return propertiesLines;
        };
        LightAdapter.prototype.getTools = function () {
            var tools = [];
            tools.push(new INSPECTOR.Checkbox(this));
            return tools;
        };
        LightAdapter.prototype.setVisible = function (b) {
            this._obj.setEnabled(b);
        };
        LightAdapter.prototype.isVisible = function () {
            return this._obj.isEnabled();
        };
        /** Returns some information about this mesh */
        // public getInfo() : string {
        //     return `${(this._obj as BABYLON.AbstractMesh).getTotalVertices()} vertices`;
        // }
        /** Overrides super.highlight */
        LightAdapter.prototype.highlight = function (b) {
            this.actualObject.renderOutline = b;
            this.actualObject.outlineWidth = 0.25;
            this.actualObject.outlineColor = BABYLON.Color3.Yellow();
        };
        LightAdapter._PROPERTIES = [
            'position',
            'diffuse',
            'intensity',
            'radius',
            'range',
            'specular'
        ];
        return LightAdapter;
    }(INSPECTOR.Adapter));
    INSPECTOR.LightAdapter = LightAdapter;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=LightAdapter.js.map