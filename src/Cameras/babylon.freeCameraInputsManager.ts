module BABYLON {
    export class FreeCameraInputsManager extends CameraInputsManager<FreeCamera> {
        constructor(camera: FreeCamera) {
            super(camera);
        }

        addKeyboard(): FreeCameraInputsManager {
            this.add(new FreeCameraKeyboardMoveInput());
            return this;
        }

        addMouse(): FreeCameraInputsManager {
            this.add(new FreeCameraMouseInput());
            return this;
        }

        addGamepad(): FreeCameraInputsManager {
            this.add(new FreeCameraGamepadInput());
            return this;
        }

        addDeviceOrientation(): FreeCameraInputsManager {
            this.add(new FreeCameraDeviceOrientationInput());
            return this;
        }

        addVRDeviceOrientation(): FreeCameraInputsManager {
            this.add(new FreeCameraVRDeviceOrientationInput());
            return this;
        }

        addTouch(): FreeCameraInputsManager {
            this.add(new FreeCameraTouchInput());
            return this;
        }

        addVirtualJoystick(): FreeCameraInputsManager {
            this.add(new FreeCameraVirtualJoystickInput());
            return this;
        }
    }
}