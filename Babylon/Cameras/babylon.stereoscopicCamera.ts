module BABYLON {
    export class StereoscopicFreeCamera extends FreeCamera {
        constructor(name: string, position: Vector3, eyeSpace: number, isVertical: boolean, scene: Scene) {
            super(name, position, scene);

            this.setSubCameraMode(isVertical ? Camera.SUB_CAMERA_MODE_VERTICAL_STEREOSCOPIC : Camera.SUB_CAMERA_MODE_HORIZONTAL_STEREOSCOPIC, eyeSpace);
        }
    }

    export class StereoscopicArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target, eyeSpace: number, isVertical: boolean, scene:Scene) {
            super(name, alpha, beta, radius, target, scene);
            this.setSubCameraMode(isVertical ? Camera.SUB_CAMERA_MODE_VERTICAL_STEREOSCOPIC : Camera.SUB_CAMERA_MODE_HORIZONTAL_STEREOSCOPIC, eyeSpace);
        }
    }

    export class StereoscopicGamepadCamera extends GamepadCamera {
        constructor(name: string, position: Vector3, eyeSpace: number, isVertical: boolean, scene: Scene) {
            super(name, position, scene);
            this.setSubCameraMode(isVertical ? Camera.SUB_CAMERA_MODE_VERTICAL_STEREOSCOPIC : Camera.SUB_CAMERA_MODE_HORIZONTAL_STEREOSCOPIC, eyeSpace);
        }
    }
} 