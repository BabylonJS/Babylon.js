var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var MaterialAdapter = (function (_super) {
        __extends(MaterialAdapter, _super);
        function MaterialAdapter(obj) {
            _super.call(this, obj);
        }
        /** Returns the name displayed in the tree */
        MaterialAdapter.prototype.id = function () {
            var str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        };
        /** Returns the type of this object - displayed in the tree */
        MaterialAdapter.prototype.type = function () {
            return INSPECTOR.Helpers.GET_TYPE(this._obj);
        };
        /** Returns the list of properties to be displayed for this adapter */
        MaterialAdapter.prototype.getProperties = function () {
            var propertiesLines = [];
            var propToDisplay = INSPECTOR.PROPERTIES[this.type()].properties;
            for (var _i = 0, propToDisplay_1 = propToDisplay; _i < propToDisplay_1.length; _i++) {
                var dirty = propToDisplay_1[_i];
                var infos = new INSPECTOR.Property(dirty, this._obj);
                propertiesLines.push(new INSPECTOR.PropertyLine(infos));
            }
            return propertiesLines;
        };
        /** No tools for a material adapter */
        MaterialAdapter.prototype.getTools = function () {
            return [];
        };
        /** Overrides super.highlight.
         * Highlighting a material outlines all meshes linked to this material
         */
        MaterialAdapter.prototype.highlight = function (b) {
            var material = this.actualObject;
            var meshes = material.getBindedMeshes();
            for (var _i = 0, meshes_1 = meshes; _i < meshes_1.length; _i++) {
                var mesh = meshes_1[_i];
                mesh.renderOutline = b;
                mesh.outlineWidth = 0.25;
                mesh.outlineColor = BABYLON.Color3.Yellow();
            }
        };
        return MaterialAdapter;
    }(INSPECTOR.Adapter));
    INSPECTOR.MaterialAdapter = MaterialAdapter;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=MaterialAdapter.js.map