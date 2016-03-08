var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var TouchCamera = (function (_super) {
        __extends(TouchCamera, _super);
        function TouchCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this.inputs.addTouch();
        }
        TouchCamera.prototype.getTypeName = function () {
            return "TouchCamera";
        };
        return TouchCamera;
    }(BABYLON.FreeCamera));
    BABYLON.TouchCamera = TouchCamera;
})(BABYLON || (BABYLON = {}));
