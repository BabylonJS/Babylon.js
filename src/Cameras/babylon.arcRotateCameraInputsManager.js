var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var ArcRotateCameraInputsManager = (function (_super) {
        __extends(ArcRotateCameraInputsManager, _super);
        function ArcRotateCameraInputsManager(camera) {
            _super.call(this, camera);
        }
        ArcRotateCameraInputsManager.prototype.addMouseWheel = function () {
            this.add(new BABYLON.ArcRotateCameraMouseWheelInput());
            return this;
        };
        ArcRotateCameraInputsManager.prototype.addPointers = function () {
            this.add(new BABYLON.ArcRotateCameraPointersInput());
            return this;
        };
        ArcRotateCameraInputsManager.prototype.addKeyboard = function () {
            this.add(new BABYLON.ArcRotateCameraKeyboardMoveInput());
            return this;
        };
        ArcRotateCameraInputsManager.prototype.addGamepad = function () {
            this.add(new BABYLON.ArcRotateCameraGamepadInput());
            return this;
        };
        return ArcRotateCameraInputsManager;
    })(BABYLON.CameraInputsManager);
    BABYLON.ArcRotateCameraInputsManager = ArcRotateCameraInputsManager;
})(BABYLON || (BABYLON = {}));
