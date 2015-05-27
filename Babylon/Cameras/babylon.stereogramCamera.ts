module BABYLON {
    export class StereogramFreeCamera extends FreeCamera {
        constructor(name: string, position: Vector3, eyeSpace: number, isVertical: boolean, scene: Scene) {
            super(name, position, scene);

            this.setSubCameraMode(isVertical ? Camera.SUB_CAMERA_MODE_VERTICAL_STEREOGRAM : Camera.SUB_CAMERA_MODE_HORIZONTAL_STEREOGRAM, eyeSpace);
        }
    }

    export class StereogramArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target, eyeSpace: number, isVertical: boolean, scene:Scene) {
            super(name, alpha, beta, radius, target, scene);
            this.setSubCameraMode(isVertical ? Camera.SUB_CAMERA_MODE_VERTICAL_STEREOGRAM : Camera.SUB_CAMERA_MODE_HORIZONTAL_STEREOGRAM, eyeSpace);
        }
    }

    export class StereogramGamepadCamera extends GamepadCamera {
        constructor(name: string, position: Vector3, eyeSpace: number, isVertical: boolean, scene: Scene) {
            super(name, position, scene);
            this.setSubCameraMode(isVertical ? Camera.SUB_CAMERA_MODE_VERTICAL_STEREOGRAM : Camera.SUB_CAMERA_MODE_HORIZONTAL_STEREOGRAM, eyeSpace);
        }
    }
} 