/// <reference path="..\Cameras\babylon.cameraInputsManager.ts" />

module BABYLON {
    export class ArcRotateCameraInputsManager extends CameraInputsManager<ArcRotateCamera> {
        constructor(camera: ArcRotateCamera) {
            super(camera);
        }

        public addMouseWheel(): ArcRotateCameraInputsManager {
            this.add(new ArcRotateCameraMouseWheelInput());
            return this;
        }

        public addPointers(): ArcRotateCameraInputsManager {
            this.add(new ArcRotateCameraPointersInput());
            return this;
        }

        public addKeyboard(): ArcRotateCameraInputsManager {
            this.add(new ArcRotateCameraKeyboardMoveInput());
            return this;
        }

        public addGamepad(): ArcRotateCameraInputsManager {
            this.add(new ArcRotateCameraGamepadInput());
            return this;
        }

        public addVRDeviceOrientation(): ArcRotateCameraInputsManager {
            this.add(new ArcRotateCameraVRDeviceOrientationInput());
            return this;
        }
    }
}
