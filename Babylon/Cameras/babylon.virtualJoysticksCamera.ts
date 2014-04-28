module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class VirtualJoysticksCamera extends FreeCamera {
        private leftjoystick: BABYLON.VirtualJoystick;
        private rightjoystick: BABYLON.VirtualJoystick;

        constructor(name, position, scene) {
            super(name, position, scene);
            this.leftjoystick = new BABYLON.VirtualJoystick(true);
            this.leftjoystick.setAxisForUD(BABYLON.JoystickAxis.Z);
            this.leftjoystick.setAxisForLR(BABYLON.JoystickAxis.X);
            this.leftjoystick.setJoystickSensibility(0.15);
            this.rightjoystick = new BABYLON.VirtualJoystick(false);
            this.rightjoystick.setAxisForUD(BABYLON.JoystickAxis.X);
            this.rightjoystick.setAxisForLR(BABYLON.JoystickAxis.Y);
            this.rightjoystick.reverseUpDown = true;
            this.rightjoystick.setJoystickSensibility(0.05);
            this.rightjoystick.setJoystickColor("yellow");
        }

        public _checkInputs() {
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
        }

        public dispose() {
            this.leftjoystick.releaseCanvas();
        }
    }
}