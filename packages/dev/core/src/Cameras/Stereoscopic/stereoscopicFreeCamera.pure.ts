/** This file must only contain pure code and pure imports */

import { Camera } from "../../Cameras/camera.pure";
import { FreeCamera } from "../../Cameras/freeCamera.pure";
import { type Scene } from "../../scene.pure";
import { Vector3 } from "../../Maths/math.vector.pure";
import { _SetStereoscopicRigMode } from "../RigModes/stereoscopicRigMode";
import { Node } from "../../node";

/**
 * Camera used to simulate stereoscopic rendering (based on FreeCamera)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
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
    constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene?: Scene) {
        super(name, position, scene);
        this.interaxialDistance = interaxialDistance;
        this.isStereoscopicSideBySide = isStereoscopicSideBySide;
        this.setCameraRigMode(isStereoscopicSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, {
            interaxialDistance: interaxialDistance,
        });
    }

    /**
     * Gets camera class name
     * @returns StereoscopicFreeCamera
     */
    public override getClassName(): string {
        return "StereoscopicFreeCamera";
    }

    protected override _setRigMode = () => _SetStereoscopicRigMode(this);
}

let _Registered = false;
/**
 * Register side effects for stereoscopicFreeCamera.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterStereoscopicFreeCamera(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    Node.AddNodeConstructor("StereoscopicFreeCamera", (name, scene, options) => {
        return () => new StereoscopicFreeCamera(name, Vector3.Zero(), options.interaxial_distance, options.isStereoscopicSideBySide, scene);
    });
}
