module BABYLON {
    export class AnaglyphFreeCamera extends FreeCamera {
        constructor(name: string, position: Vector3, public interaxialDistance: number, scene: Scene) {
            super(name, position, scene);
            this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }
    }

    export class AnaglyphArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target, interaxialDistance: number, scene: Scene) {
            super(name, alpha, beta, radius, target, scene);
            this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }
    }

    export class AnaglyphGamepadCamera extends GamepadCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene) {
            super(name, position, scene);
            this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }
    }
    
    export class StereoscopicFreeCamera extends FreeCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, isSideBySide: boolean, scene: Scene) {
            super(name, position, scene);

            this.setCameraRigMode(isSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }
    }

    export class StereoscopicArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target, interaxialDistance: number, isSideBySide: boolean, scene:Scene) {
            super(name, alpha, beta, radius, target, scene);
            this.setCameraRigMode(isSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }
    }

    export class StereoscopicGamepadCamera extends GamepadCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, isSideBySide: boolean, scene: Scene) {
            super(name, position, scene);
            this.setCameraRigMode(isSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }
    }
} 