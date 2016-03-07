module BABYLON.CameraInputs {
    export class FreeCameraVirtualJoystickInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;

        private _leftjoystick: VirtualJoystick;
        private _rightjoystick: VirtualJoystick;
        
        public getLeftJoystick(): VirtualJoystick {
            return this._leftjoystick;
        }

        public getRightJoystick(): VirtualJoystick {
            return this._rightjoystick;
        }

        public checkInputs() {
            var camera = this.camera;
            var speed = camera._computeLocalCameraSpeed() * 50;
            var cameraTransform = Matrix.RotationYawPitchRoll(camera.rotation.y, camera.rotation.x, 0);
            var deltaTransform = Vector3.TransformCoordinates(new Vector3(this._leftjoystick.deltaPosition.x * speed, this._leftjoystick.deltaPosition.y * speed, this._leftjoystick.deltaPosition.z * speed), cameraTransform);
            camera.cameraDirection = camera.cameraDirection.add(deltaTransform);
            camera.cameraRotation = camera.cameraRotation.addVector3(this._rightjoystick.deltaPosition);
            
            if (!this._leftjoystick.pressed) {
                this._leftjoystick.deltaPosition = this._leftjoystick.deltaPosition.scale(0.9);
            }
            if (!this._rightjoystick.pressed) {
                this._rightjoystick.deltaPosition = this._rightjoystick.deltaPosition.scale(0.9);
            }
        }
        
        attachCamera(camera: FreeCamera) {
            this.camera = camera;
            
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

        detach() {
            this._leftjoystick.releaseCanvas();
        }

        getTypeName(): string {
            return "freecamera.virtualjoystick";
        }
    }
    InputTypes["freecamera.virtualjoystick"] = FreeCameraVirtualJoystickInput;
}