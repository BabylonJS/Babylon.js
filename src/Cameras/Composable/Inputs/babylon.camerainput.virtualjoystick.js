var BABYLON;
(function (BABYLON) {
    var ComposableCameraVirtualJoystickInput = (function () {
        function ComposableCameraVirtualJoystickInput() {
        }
        ComposableCameraVirtualJoystickInput.prototype.getLeftJoystick = function () {
            return this._leftjoystick;
        };
        ComposableCameraVirtualJoystickInput.prototype.getRightJoystick = function () {
            return this._rightjoystick;
        };
        ComposableCameraVirtualJoystickInput.prototype.checkInputs = function () {
            var camera = this.camera;
            var speed = camera._computeLocalCameraSpeed() * 50;
            var cameraTransform = BABYLON.Matrix.RotationYawPitchRoll(camera.rotation.y, camera.rotation.x, 0);
            var deltaTransform = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(this._leftjoystick.deltaPosition.x * speed, this._leftjoystick.deltaPosition.y * speed, this._leftjoystick.deltaPosition.z * speed), cameraTransform);
            camera.cameraDirection = camera.cameraDirection.add(deltaTransform);
            camera.cameraRotation = camera.cameraRotation.addVector3(this._rightjoystick.deltaPosition);
            if (!this._leftjoystick.pressed) {
                this._leftjoystick.deltaPosition = this._leftjoystick.deltaPosition.scale(0.9);
            }
            if (!this._rightjoystick.pressed) {
                this._rightjoystick.deltaPosition = this._rightjoystick.deltaPosition.scale(0.9);
            }
        };
        ComposableCameraVirtualJoystickInput.prototype.attachCamera = function (camera) {
            this.camera = camera;
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
        };
        ComposableCameraVirtualJoystickInput.prototype.detach = function () {
            this._leftjoystick.releaseCanvas();
        };
        ComposableCameraVirtualJoystickInput.prototype.getTypeName = function () {
            return "touch";
        };
        return ComposableCameraVirtualJoystickInput;
    }());
    BABYLON.ComposableCameraVirtualJoystickInput = ComposableCameraVirtualJoystickInput;
})(BABYLON || (BABYLON = {}));
