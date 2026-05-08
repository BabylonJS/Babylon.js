/** This file must only contain pure code and pure imports */

import { Camera } from "../../Cameras/camera";
import { FreeCamera } from "../../Cameras/freeCamera.pure";
import { type Scene } from "../../scene.pure";
import { Vector3 } from "../../Maths/math.vector.pure";
import { _SetStereoscopicAnaglyphRigMode } from "../RigModes/stereoscopicAnaglyphRigMode";
import { Node } from "../../node";

/**
 * Camera used to simulate anaglyphic rendering (based on FreeCamera)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#anaglyph-cameras
 */
export class AnaglyphFreeCamera extends FreeCamera {
    /**
     * Creates a new AnaglyphFreeCamera
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
     * @returns AnaglyphFreeCamera
     */
    public override getClassName(): string {
        return "AnaglyphFreeCamera";
    }

    protected override _setRigMode = () => _SetStereoscopicAnaglyphRigMode(this);
}


let _registered = false;
export function registerAnaglyphFreeCamera(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    Node.AddNodeConstructor("AnaglyphFreeCamera", (name, scene, options) => {
        return () => new AnaglyphFreeCamera(name, Vector3.Zero(), options.interaxial_distance, scene);
    });
}
