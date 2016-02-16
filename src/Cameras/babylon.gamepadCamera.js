var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var GamepadCamera = (function (_super) {
        __extends(GamepadCamera, _super);
        function GamepadCamera(name, position, scene) {
            BABYLON.Tools.Warn("Deprecated. Please use Universal Camera instead.");
            _super.call(this, name, position, scene);
        }
        return GamepadCamera;
    })(BABYLON.UniversalCamera);
    BABYLON.GamepadCamera = GamepadCamera;
})(BABYLON || (BABYLON = {}));
