var BABYLON = BABYLON || {};

(function () {
    BABYLON.VirtualJoysticksCamera = function (name, position, scene) {
        BABYLON.FreeCamera.call(this, name, position, scene);
        this.leftjoystick = new BABYLON.VirtualJoystick(true);
        this.leftjoystick.setAxisForUD("Z");
        this.leftjoystick.setAxisForLR("X");
        this.leftjoystick.setJoystickSensibility(0.15);
        this.rightjoystick = new BABYLON.VirtualJoystick(false);
        this.rightjoystick.setAxisForUD("X");
        this.rightjoystick.setAxisForLR("Y");
        this.rightjoystick.reverseUpDown = true;
        this.rightjoystick.setJoystickSensibility(0.05);
        this.rightjoystick.setJoystickColor("yellow");
    };

    // We're mainly based on the logic defined into the FreeCamera code
    BABYLON.VirtualJoysticksCamera.prototype = Object.create(BABYLON.FreeCamera.prototype);
    BABYLON.VirtualJoysticksCamera.prototype._checkInputs = function () {
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

    BABYLON.VirtualJoysticksCamera.prototype.dispose = function () {
        this.leftjoystick.releaseCanvas();
    };
})();