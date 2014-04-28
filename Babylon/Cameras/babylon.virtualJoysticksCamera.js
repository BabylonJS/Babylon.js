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
            this.leftjoystick = new BABYLON.VirtualJoystick(true);
            this.leftjoystick.setAxisForUD(2 /* Z */);
            this.leftjoystick.setAxisForLR(0 /* X */);
            this.leftjoystick.setJoystickSensibility(0.15);
            this.rightjoystick = new BABYLON.VirtualJoystick(false);
            this.rightjoystick.setAxisForUD(0 /* X */);
            this.rightjoystick.setAxisForLR(1 /* Y */);
            this.rightjoystick.reverseUpDown = true;
            this.rightjoystick.setJoystickSensibility(0.05);
            this.rightjoystick.setJoystickColor("yellow");
        }
        VirtualJoysticksCamera.prototype._checkInputs = function () {
            var cameraTransform = BABYLON.Matrix.RotationYawPitchRoll(this.rotation.y, this.rotation.x, 0);
            var deltaTransform = BABYLON.Vector3.TransformCoordinates(this.leftjoystick.deltaPosition, cameraTransform);
            this.cameraDirection = this.cameraDirection.add(deltaTransform);
            this.cameraRotation = this.cameraRotation.add(this.rightjoystick.deltaPosition);
            if (!this.leftjoystick.pressed) {
                this.leftjoystick.deltaPosition = this.leftjoystick.deltaPosition.scale(0.9);
            }
            if (!this.rightjoystick.pressed) {
                this.rightjoystick.deltaPosition = this.rightjoystick.deltaPosition.scale(0.9);
            }
        };

        VirtualJoysticksCamera.prototype.dispose = function () {
            this.leftjoystick.releaseCanvas();
        };
        return VirtualJoysticksCamera;
    })(BABYLON.FreeCamera);
    BABYLON.VirtualJoysticksCamera = VirtualJoysticksCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.virtualJoysticksCamera.js.map
