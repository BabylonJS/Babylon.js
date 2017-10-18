/// <reference path="babylon.freeCamera.ts" />
/// <reference path="babylon.arcRotateCamera.ts" />
/// <reference path="babylon.gamepadCamera.ts" />
/// <reference path="babylon.universalCamera.ts" />

module BABYLON {
    export class AnaglyphFreeCamera extends FreeCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene) {
            super(name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }

        public getClassName(): string {
            return "AnaglyphFreeCamera";
        }
    }

    export class AnaglyphArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, interaxialDistance: number, scene: Scene) {
            super(name, alpha, beta, radius, target, scene);
            this.interaxialDistance = interaxialDistance;
            this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }

        public getClassName(): string {
            return "AnaglyphArcRotateCamera";
        }
    }

    export class AnaglyphGamepadCamera extends GamepadCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene) {
            super(name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }

        public getClassName(): string {
            return "AnaglyphGamepadCamera";
        }
    }

    export class AnaglyphUniversalCamera extends UniversalCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene) {
            super(name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }

        public getClassName(): string {
            return "AnaglyphUniversalCamera";
        }
    }
    
    export class StereoscopicFreeCamera extends FreeCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene) {
            super(name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            this.setCameraRigMode(isStereoscopicSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }

        public getClassName(): string {
            return "StereoscopicFreeCamera";
        }
    }

    export class StereoscopicArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene:Scene) {
            super(name, alpha, beta, radius, target, scene);
            this.interaxialDistance = interaxialDistance;
            this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            this.setCameraRigMode(isStereoscopicSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }

        public getClassName(): string {
            return "StereoscopicArcRotateCamera";
        }
    }

    export class StereoscopicGamepadCamera extends GamepadCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene) {
            super(name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            this.setCameraRigMode(isStereoscopicSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }

        public getClassName(): string {
            return "StereoscopicGamepadCamera";
        }
    }

    export class StereoscopicUniversalCamera extends UniversalCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene) {
            super(name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            this.setCameraRigMode(isStereoscopicSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }

        public getClassName(): string {
            return "StereoscopicUniversalCamera";
        }
    }
} 