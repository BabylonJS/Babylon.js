var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var VirtualJoysticksCamera = (function (_super) {
        __extends(VirtualJoysticksCamera, _super);
        function VirtualJoysticksCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this._leftjoystick = new BABYLON.VirtualJoystick(true);
            this._leftjoystick.setAxisForUpDown(BABYLON.JoystickAxis.Z);
            this._leftjoystick.setAxisForLeftRight(BABYLON.JoystickAxis.X);
            this._leftjoystick.setJoystickSensibility(0.15);
            this._rightjoystick = new BABYLON.VirtualJoystick(false);
            this._rightjoystick.setAxisForUpDown(BABYLON.JoystickAxis.X);
            this._rightjoystick.setAxisForLeftRight(BABYLON.JoystickAxis.Y);
            this._rightjoystick.reverseUpDown = true;
            this._rightjoystick.setJoystickSensibility(0.05);
            this._rightjoystick.setJoystickColor("yellow");
        }
        VirtualJoysticksCamera.prototype._checkInputs = function () {
            var cameraTransform = BABYLON.Matrix.RotationYawPitchRoll(this.rotation.y, this.rotation.x, 0);
            var deltaTransform = BABYLON.Vector3.TransformCoordinates(this._leftjoystick.deltaPosition, cameraTransform);
            this.cameraDirection = this.cameraDirection.add(deltaTransform);
            this.cameraRotation = this.cameraRotation.addVector3(this._rightjoystick.deltaPosition);
            if (!this._leftjoystick.pressed) {
                this._leftjoystick.deltaPosition = this._leftjoystick.deltaPosition.scale(0.9);
            }
            if (!this._rightjoystick.pressed) {
                this._rightjoystick.deltaPosition = this._rightjoystick.deltaPosition.scale(0.9);
            }
            _super.prototype._checkInputs.call(this);
        };
        VirtualJoysticksCamera.prototype.dispose = function () {
            this._leftjoystick.releaseCanvas();
            _super.prototype.dispose.call(this);
        };
        return VirtualJoysticksCamera;
    })(BABYLON.FreeCamera);
    BABYLON.VirtualJoysticksCamera = VirtualJoysticksCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.virtualJoysticksCamera.js.map