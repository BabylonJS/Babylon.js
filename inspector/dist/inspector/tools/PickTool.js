var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var PickTool = (function (_super) {
        __extends(PickTool, _super);
        function PickTool(parent, inspector) {
            _super.call(this, 'fa-mouse-pointer', parent, inspector, 'Pick a mesh in the scene to display its details');
            this._isActive = false;
            // Create handler
            this._pickHandler = this._pickMesh.bind(this);
        }
        // Action : find the corresponding tree item in the correct tab and display it
        PickTool.prototype.action = function () {
            if (this._isActive) {
                this._deactivate();
            }
            else {
                this.toHtml().classList.add('active');
                // Add event handler : pick on a mesh in the scene
                this._inspector.scene.getEngine().getRenderingCanvas().addEventListener('click', this._pickHandler);
                this._isActive = true;
            }
        };
        /** Deactivate this tool */
        PickTool.prototype._deactivate = function () {
            this.toHtml().classList.remove('active');
            // Remove event handler
            this._inspector.scene.getEngine().getRenderingCanvas().removeEventListener('click', this._pickHandler);
            this._isActive = false;
        };
        /** Pick a mesh in the scene */
        PickTool.prototype._pickMesh = function (evt) {
            var pos = this._updatePointerPosition(evt);
            var pi = this._inspector.scene.pick(pos.x, pos.y, function (mesh) { return true; });
            if (pi.pickedMesh) {
                console.log(pi.pickedMesh.name);
                this._inspector.displayObjectDetails(pi.pickedMesh);
            }
            this._deactivate();
        };
        PickTool.prototype._updatePointerPosition = function (evt) {
            var canvasRect = this._inspector.scene.getEngine().getRenderingCanvasClientRect();
            var pointerX = evt.clientX - canvasRect.left;
            var pointerY = evt.clientY - canvasRect.top;
            return { x: pointerX, y: pointerY };
        };
        ;
        return PickTool;
    }(INSPECTOR.AbstractTool));
    INSPECTOR.PickTool = PickTool;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=PickTool.js.map