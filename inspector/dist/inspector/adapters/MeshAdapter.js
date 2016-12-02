var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var MeshAdapter = (function (_super) {
        __extends(MeshAdapter, _super);
        function MeshAdapter(obj) {
            _super.call(this, obj);
            /** Keep track of the axis of the actual object */
            this._axis = [];
        }
        /** Returns the name displayed in the tree */
        MeshAdapter.prototype.id = function () {
            var str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        };
        /** Returns the type of this object - displayed in the tree */
        MeshAdapter.prototype.type = function () {
            return INSPECTOR.Helpers.GET_TYPE(this._obj);
        };
        /** Returns the list of properties to be displayed for this adapter */
        MeshAdapter.prototype.getProperties = function () {
            var propertiesLines = [];
            for (var _i = 0, _a = INSPECTOR.PROPERTIES['Mesh'].properties; _i < _a.length; _i++) {
                var dirty = _a[_i];
                var infos = new INSPECTOR.Property(dirty, this._obj);
                propertiesLines.push(new INSPECTOR.PropertyLine(infos));
            }
            return propertiesLines;
        };
        MeshAdapter.prototype.getTools = function () {
            var tools = [];
            tools.push(new INSPECTOR.Checkbox(this));
            tools.push(new INSPECTOR.DebugArea(this));
            tools.push(new INSPECTOR.BoundingBox(this));
            tools.push(new INSPECTOR.Info(this));
            return tools;
        };
        MeshAdapter.prototype.setVisible = function (b) {
            this._obj.setEnabled(b);
            this._obj.isVisible = b;
        };
        MeshAdapter.prototype.isVisible = function () {
            return this._obj.isEnabled() && this._obj.isVisible;
        };
        MeshAdapter.prototype.isBoxVisible = function () {
            return this._obj.showBoundingBox;
        };
        MeshAdapter.prototype.setBoxVisible = function (b) {
            return this._obj.showBoundingBox = b;
        };
        MeshAdapter.prototype.debug = function (b) {
            // Draw axis the first time
            if (this._axis.length == 0) {
                this._drawAxis();
            }
            // Display or hide axis
            for (var _i = 0, _a = this._axis; _i < _a.length; _i++) {
                var ax = _a[_i];
                ax.setEnabled(b);
            }
        };
        /** Returns some information about this mesh */
        MeshAdapter.prototype.getInfo = function () {
            return this._obj.getTotalVertices() + " vertices";
        };
        /** Overrides super.highlight */
        MeshAdapter.prototype.highlight = function (b) {
            this.actualObject.renderOutline = b;
            this.actualObject.outlineWidth = 0.25;
            this.actualObject.outlineColor = BABYLON.Color3.Yellow();
        };
        /** Draw X, Y and Z axis for the actual object if this adapter.
         * Should be called only one time as it will fill this._axis
         */
        MeshAdapter.prototype._drawAxis = function () {
            var _this = this;
            this._obj.computeWorldMatrix();
            var m = this._obj.getWorldMatrix();
            // Axis
            var x = new BABYLON.Vector3(8, 0, 0);
            var y = new BABYLON.Vector3(0, 8, 0);
            var z = new BABYLON.Vector3(0, 0, 8);
            // Draw an axis of the given color
            var _drawAxis = function (color, start, end) {
                var axis = BABYLON.Mesh.CreateLines("###axis###", [
                    start,
                    end
                ], _this._obj.getScene());
                axis.color = color;
                axis.renderingGroupId = 1;
                return axis;
            };
            // X axis
            var xAxis = _drawAxis(BABYLON.Color3.Red(), this._obj.getAbsolutePosition(), BABYLON.Vector3.TransformCoordinates(x, m));
            xAxis.position.subtractInPlace(this._obj.position);
            xAxis.parent = this._obj;
            this._axis.push(xAxis);
            // Y axis        
            var yAxis = _drawAxis(BABYLON.Color3.Green(), this._obj.getAbsolutePosition(), BABYLON.Vector3.TransformCoordinates(y, m));
            yAxis.parent = this._obj;
            yAxis.position.subtractInPlace(this._obj.position);
            this._axis.push(yAxis);
            // Z axis
            var zAxis = _drawAxis(BABYLON.Color3.Blue(), this._obj.getAbsolutePosition(), BABYLON.Vector3.TransformCoordinates(z, m));
            zAxis.parent = this._obj;
            zAxis.position.subtractInPlace(this._obj.position);
            this._axis.push(zAxis);
        };
        return MeshAdapter;
    }(INSPECTOR.Adapter));
    INSPECTOR.MeshAdapter = MeshAdapter;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=MeshAdapter.js.map