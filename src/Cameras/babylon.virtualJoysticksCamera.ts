module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class VirtualJoysticksCamera extends FreeCamera {
        private _leftjoystick: VirtualJoystick;
        private _rightjoystick: VirtualJoystick;

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this._leftjoystick = new VirtualJoystick(true);
            this._leftjoystick.setAxisForUpDown(JoystickAxis.Z);
            this._leftjoystick.setAxisForLeftRight(JoystickAxis.X);
            this._leftjoystick.setJoystickSensibility(0.15);
            this._rightjoystick = new VirtualJoystick(false);
            this._rightjoystick.setAxisForUpDown(JoystickAxis.X);
            this._rightjoystick.setAxisForLeftRight(JoystickAxis.Y);
            this._rightjoystick.reverseUpDown = true;
            this._rightjoystick.setJoystickSensibility(0.05);
            this._rightjoystick.setJoystickColor("yellow");
        }

        public getLeftJoystick(): VirtualJoystick {
            return this._leftjoystick;
        }

        public getRightJoystick(): VirtualJoystick {
            return this._rightjoystick;
        }

        public _checkInputs(): void {
            var speed = this._computeLocalCameraSpeed() * 50;
            var cameraTransform = Matrix.RotationYawPitchRoll(this.rotation.y, this.rotation.x, 0);
            var deltaTransform = Vector3.TransformCoordinates(new Vector3(this._leftjoystick.deltaPosition.x * speed, this._leftjoystick.deltaPosition.y * speed, this._leftjoystick.deltaPosition.z * speed), cameraTransform);
            this.cameraDirection = this.cameraDirection.add(deltaTransform);
            this.cameraRotation = this.cameraRotation.addVector3(this._rightjoystick.deltaPosition);
            if (!this._leftjoystick.pressed) {
                this._leftjoystick.deltaPosition = this._leftjoystick.deltaPosition.scale(0.9);
            }
            if (!this._rightjoystick.pressed) {
                this._rightjoystick.deltaPosition = this._rightjoystick.deltaPosition.scale(0.9);
            }

            super._checkInputs();
        }

        public dispose(): void {
            this._leftjoystick.releaseCanvas();
            super.dispose();
        }

        public getTypeName(): string {
            return "VirtualJoysticksCamera";
        }
    }
}