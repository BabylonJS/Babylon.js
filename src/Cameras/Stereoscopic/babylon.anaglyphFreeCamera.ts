module BABYLON {
    Node.AddNodeConstructor("AnaglyphFreeCamera", (name, scene, options) => {
        return () => new AnaglyphFreeCamera(name, Vector3.Zero(), options.interaxial_distance, scene);
    });

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
}