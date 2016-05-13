var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var WorldSpaceCanvas2d = (function (_super) {
        __extends(WorldSpaceCanvas2d, _super);
        function WorldSpaceCanvas2d(name, scene, canvas) {
            _super.call(this, name, scene);
            this._canvas = canvas;
        }
        WorldSpaceCanvas2d.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            if (this._canvas) {
                this._canvas.dispose();
                this._canvas = null;
            }
        };
        return WorldSpaceCanvas2d;
    })(BABYLON.Mesh);
    BABYLON.WorldSpaceCanvas2d = WorldSpaceCanvas2d;
})(BABYLON || (BABYLON = {}));
