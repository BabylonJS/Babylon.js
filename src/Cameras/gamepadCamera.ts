import { UniversalCamera } from "./universalCamera";
import { Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
Node.AddNodeConstructor("GamepadCamera", (name, scene) => {
    return () => new GamepadCamera(name, Vector3.Zero(), scene);
});

/**
 * This represents a FPS type of camera. This is only here for back compat purpose.
 * Please use the UniversalCamera instead as both are identical.
 * @see https://doc.babylonjs.com/features/cameras#universal-camera
 */
export class GamepadCamera extends UniversalCamera {
    /**
     * Instantiates a new Gamepad Camera
     * This represents a FPS type of camera. This is only here for back compat purpose.
     * Please use the UniversalCamera instead as both are identical.
     * @see https://doc.babylonjs.com/features/cameras#universal-camera
     * @param name Define the name of the camera in the scene
     * @param position Define the start position of the camera in the scene
     * @param scene Define the scene the camera belongs to
     */
    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, position, scene);
    }

    /**
     * Gets the current object class name.
     * @return the class name
     */
    public getClassName(): string {
        return "GamepadCamera";
    }
}
