module BABYLON {
    Node.AddNodeConstructor("StereoscopicGamepadCamera", (name, scene, options) => {
        return () => new StereoscopicGamepadCamera(name, Vector3.Zero(), options.interaxial_distance, options.isStereoscopicSideBySide, scene);
    });

    /**
     * Camera used to simulate stereoscopic rendering (based on GamepadCamera)
     * @see http://doc.babylonjs.com/features/cameras
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
}