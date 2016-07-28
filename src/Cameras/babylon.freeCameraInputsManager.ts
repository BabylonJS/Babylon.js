module BABYLON {
    export class FreeCameraInputsManager extends CameraInputsManager<FreeCamera> {
        constructor(camera: FreeCamera) {
            super(camera);
        }

        addKeyboard(): FreeCameraInputsManager {
            this.add(new FreeCameraKeyboardMoveInput());
            return this;
        }

        addMouse(touchEnabled = true): FreeCameraInputsManager {
            this.add(new FreeCameraMouseInput(touchEnabled));
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