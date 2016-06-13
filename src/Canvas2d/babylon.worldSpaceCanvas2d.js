var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
     * This is the class that is used to display a World Space Canvas into a scene
     */
    var WorldSpaceCanvas2D = (function (_super) {
        __extends(WorldSpaceCanvas2D, _super);
        function WorldSpaceCanvas2D(name, scene, canvas) {
            _super.call(this, name, scene);
            this._canvas = canvas;
        }
        WorldSpaceCanvas2D.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            if (this._canvas) {
                this._canvas.dispose();
                this._canvas = null;
            }
        };
        return WorldSpaceCanvas2D;
    }(BABYLON.Mesh));
    BABYLON.WorldSpaceCanvas2D = WorldSpaceCanvas2D;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.worldSpaceCanvas2d.js.map