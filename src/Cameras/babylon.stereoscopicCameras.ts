module BABYLON {
    /**
     * Camera used to simulate anaglyphic rendering (based on FreeCamera)
     */
    export class AnaglyphFreeCamera extends FreeCamera {
        /**
         * Creates a new AnaglyphFreeCamera
         * @param name defines camera name
         * @param position defines initial position
         * @param interaxialDistance defines distance between each color axis
         * @param scene defines the hosting scene
         */
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene) {
            super(name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }

        /**
         * Gets camera class name
         * @returns AnaglyphFreeCamera
         */
        public getClassName(): string {
            return "AnaglyphFreeCamera";
        }
    }

    /**
     * Camera used to simulate anaglyphic rendering (based on ArcRotateCamera)
     */    
    export class AnaglyphArcRotateCamera extends ArcRotateCamera {

        /**
         * Creates a new AnaglyphArcRotateCamera
         * @param name defines camera name
         * @param alpha defines alpha angle (in radians)
         * @param beta defines beta angle (in radians)
         * @param radius defines radius
         * @param target defines camera target 
         * @param interaxialDistance defines distance between each color axis
         * @param scene defines the hosting scene
         */
        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, interaxialDistance: number, scene: Scene) {
            super(name, alpha, beta, radius, target, scene);
            this.interaxialDistance = interaxialDistance;
            this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }

        /**
         * Gets camera class name
         * @returns AnaglyphArcRotateCamera
         */        
        public getClassName(): string {
            return "AnaglyphArcRotateCamera";
        }
    }

    /**
     * Camera used to simulate anaglyphic rendering (based on GamepadCamera)
     */       
    export class AnaglyphGamepadCamera extends GamepadCamera {
        /**
         * Creates a new AnaglyphGamepadCamera
         * @param name defines camera name
         * @param position defines initial position
         * @param interaxialDistance defines distance between each color axis
         * @param scene defines the hosting scene
         */
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene) {
            super(name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }

        /**
         * Gets camera class name
         * @returns AnaglyphGamepadCamera
         */   
        public getClassName(): string {
            return "AnaglyphGamepadCamera";
        }
    }

    /**
     * Camera used to simulate anaglyphic rendering (based on UniversalCamera)
     */        
    export class AnaglyphUniversalCamera extends UniversalCamera {
        /**
         * Creates a new AnaglyphUniversalCamera
         * @param name defines camera name
         * @param position defines initial position
         * @param interaxialDistance defines distance between each color axis
         * @param scene defines the hosting scene
         */
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene) {
            super(name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }

        /**
         * Gets camera class name
         * @returns AnaglyphUniversalCamera
         */           
        public getClassName(): string {
            return "AnaglyphUniversalCamera";
        }
    }

    /**
     * Camera used to simulate stereoscopic rendering (based on FreeCamera)
     */    
    export class StereoscopicFreeCamera extends FreeCamera {
        /**
         * Creates a new StereoscopicFreeCamera
         * @param name defines camera name
         * @param position defines initial position
         * @param interaxialDistance defines distance between each color axis
         * @param isStereoscopicSideBySide defines is stereoscopic is done side by side or over under
         * @param scene defines the hosting scene
         */
        constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene) {
            super(name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            this.setCameraRigMode(isStereoscopicSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }

        /**
         * Gets camera class name
         * @returns StereoscopicFreeCamera
         */            
        public getClassName(): string {
            return "StereoscopicFreeCamera";
        }
    }

    /**
     * Camera used to simulate stereoscopic rendering (based on ArcRotateCamera)
     */      
    export class StereoscopicArcRotateCamera extends ArcRotateCamera {
        /**
         * Creates a new StereoscopicArcRotateCamera
         * @param name defines camera name
         * @param alpha defines alpha angle (in radians)
         * @param beta defines beta angle (in radians)
         * @param radius defines radius
         * @param target defines camera target 
         * @param interaxialDistance defines distance between each color axis
         * @param isStereoscopicSideBySide defines is stereoscopic is done side by side or over under
         * @param scene defines the hosting scene
         */        
        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene) {
            super(name, alpha, beta, radius, target, scene);
            this.interaxialDistance = interaxialDistance;
            this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            this.setCameraRigMode(isStereoscopicSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }

        /**
         * Gets camera class name
         * @returns StereoscopicArcRotateCamera
         */              
        public getClassName(): string {
            return "StereoscopicArcRotateCamera";
        }
    }

    /**
     * Camera used to simulate stereoscopic rendering (based on GamepadCamera)
     */      
    export class StereoscopicGamepadCamera extends GamepadCamera {
        /**
         * Creates a new StereoscopicGamepadCamera
         * @param name defines camera name
         * @param position defines initial position
         * @param interaxialDistance defines distance between each color axis
         * @param isStereoscopicSideBySide defines is stereoscopic is done side by side or over under
         * @param scene defines the hosting scene
         */        
        constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene) {
            super(name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            this.setCameraRigMode(isStereoscopicSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }

        /**
         * Gets camera class name
         * @returns StereoscopicGamepadCamera
         */              
        public getClassName(): string {
            return "StereoscopicGamepadCamera";
        }
    }

    /**
     * Camera used to simulate stereoscopic rendering (based on UniversalCamera)
     */      
    export class StereoscopicUniversalCamera extends UniversalCamera {
        /**
         * Creates a new StereoscopicUniversalCamera
         * @param name defines camera name
         * @param position defines initial position
         * @param interaxialDistance defines distance between each color axis
         * @param isStereoscopicSideBySide defines is stereoscopic is done side by side or over under
         * @param scene defines the hosting scene
         */        
        constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene) {
            super(name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            this.setCameraRigMode(isStereoscopicSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }

        /**
         * Gets camera class name
         * @returns StereoscopicUniversalCamera
         */              
        public getClassName(): string {
            return "StereoscopicUniversalCamera";
        }
    }
} 