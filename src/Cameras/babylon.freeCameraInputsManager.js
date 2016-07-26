var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var FreeCameraInputsManager = (function (_super) {
        __extends(FreeCameraInputsManager, _super);
        function FreeCameraInputsManager(camera) {
            _super.call(this, camera);
        }
        FreeCameraInputsManager.prototype.addKeyboard = function () {
            this.add(new BABYLON.FreeCameraKeyboardMoveInput());
            return this;
        };
        FreeCameraInputsManager.prototype.addMouse = function (touchEnabled) {
            if (touchEnabled === void 0) { touchEnabled = true; }
            this.add(new BABYLON.FreeCameraMouseInput(touchEnabled));
            return this;
        };
        FreeCameraInputsManager.prototype.addGamepad = function () {
            this.add(new BABYLON.FreeCameraGamepadInput());
            return this;
        };
        FreeCameraInputsManager.prototype.addDeviceOrientation = function () {
            this.add(new BABYLON.FreeCameraDeviceOrientationInput());
            return this;
        };
        FreeCameraInputsManager.prototype.addTouch = function () {
            this.add(new BABYLON.FreeCameraTouchInput());
            return this;
        };
        FreeCameraInputsManager.prototype.addVirtualJoystick = function () {
            this.add(new BABYLON.FreeCameraVirtualJoystickInput());
            return this;
        };
        return FreeCameraInputsManager;
    }(BABYLON.CameraInputsManager));
    BABYLON.FreeCameraInputsManager = FreeCameraInputsManager;
})(BABYLON || (BABYLON = {}));
