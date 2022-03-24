import { Camera } from "../../Cameras/camera";
import { UniversalCamera } from "../../Cameras/universalCamera";
import type { Scene } from "../../scene";
import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";

import { setStereoscopicAnaglyphRigMode } from "../RigModes/stereoscopicAnaglyphRigMode";

Node.AddNodeConstructor("AnaglyphUniversalCamera", (name, scene, options) => {
    return () => new AnaglyphUniversalCamera(name, Vector3.Zero(), options.interaxial_distance, scene);
});

/**
 * Camera used to simulate anaglyphic rendering (based on UniversalCamera)
 * @see https://doc.babylonjs.com/features/cameras#anaglyph-cameras
 */
export class AnaglyphUniversalCamera extends UniversalCamera {
    /**
     * Creates a new AnaglyphUniversalCamera
     * @param name defines camera name
     * @param position defines initial position
     * @param interaxialDistance defines distance between each color axis
     * @param scene defines the hosting scene
     */
    constructor(name: string, position: Vector3, interaxialDistance: number, scene?: Scene) {
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

    protected _setRigMode = setStereoscopicAnaglyphRigMode.bind(null, this);
}
