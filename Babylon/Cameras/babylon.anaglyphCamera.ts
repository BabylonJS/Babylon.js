module BABYLON {
    export class AnaglyphFreeCamera extends FreeCamera {
        constructor(name: string, position: Vector3, eyeSpace: number, scene: Scene) {
            super(name, position, scene);
            this.setSubCameraMode(Camera.SUB_CAMERA_MODE_ANAGLYPH, eyeSpace);
        }
    }

    export class AnaglyphArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target, eyeSpace: number, scene: Scene) {
            super(name, alpha, beta, radius, target, scene);
            this.setSubCameraMode(Camera.SUB_CAMERA_MODE_ANAGLYPH, eyeSpace);
        }
    }

    export class AnaglyphGamepadCamera extends GamepadCamera {
        constructor(name: string, position: Vector3, eyeSpace: number, scene: Scene) {
            super(name, position, scene);
            this.setSubCameraMode(Camera.SUB_CAMERA_MODE_ANAGLYPH, eyeSpace);
        }
    }
} 