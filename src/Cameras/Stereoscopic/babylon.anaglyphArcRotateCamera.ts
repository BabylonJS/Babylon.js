module BABYLON {
    Node.AddNodeConstructor("AnaglyphArcRotateCamera", (name, scene, options) => {
        return () => new AnaglyphArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), options.interaxial_distance, scene);
    });

    /**
     * Camera used to simulate anaglyphic rendering (based on ArcRotateCamera)
     * @see http://doc.babylonjs.com/features/cameras#anaglyph-cameras
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
}