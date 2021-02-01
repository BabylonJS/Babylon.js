import { Camera } from "../../Cameras/camera";
import { GamepadCamera } from "../../Cameras/gamepadCamera";
import { Scene } from "../../scene";
import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";

// Side effect import to define the stereoscopic mode.
import "../RigModes/stereoscopicAnaglyphRigMode";

Node.AddNodeConstructor("AnaglyphGamepadCamera", (name, scene, options) => {
    return () => new AnaglyphGamepadCamera(name, Vector3.Zero(), options.interaxial_distance, scene);
});

/**
 * Camera used to simulate anaglyphic rendering (based on GamepadCamera)
 * @see https://doc.babylonjs.com/features/cameras#anaglyph-cameras
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
