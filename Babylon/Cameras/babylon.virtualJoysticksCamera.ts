module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class VirtualJoysticksCamera extends FreeCamera {
        private _leftjoystick: BABYLON.VirtualJoystick;
        private _rightjoystick: BABYLON.VirtualJoystick;

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
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

        public _checkInputs(): void {
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
        }

        public dispose(): void {
            this._leftjoystick.releaseCanvas();
            super.dispose();
        }
    }
}