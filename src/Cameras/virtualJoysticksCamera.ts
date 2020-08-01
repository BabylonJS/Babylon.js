import { FreeCamera } from "./freeCamera";
import { Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";

import "./Inputs/freeCameraVirtualJoystickInput";

Node.AddNodeConstructor("VirtualJoysticksCamera", (name, scene) => {
    return () => new VirtualJoysticksCamera(name, Vector3.Zero(), scene);
});

/**
 * This represents a free type of camera. It can be useful in First Person Shooter game for instance.
 * It is identical to the Free Camera and simply adds by default a virtual joystick.
 * Virtual Joysticks are on-screen 2D graphics that are used to control the camera or other scene items.
 * @see https://doc.babylonjs.com/features/cameras#virtual-joysticks-camera
 */
export class VirtualJoysticksCamera extends FreeCamera {

    /**
     * Intantiates a VirtualJoysticksCamera. It can be useful in First Person Shooter game for instance.
     * It is identical to the Free Camera and simply adds by default a virtual joystick.
     * Virtual Joysticks are on-screen 2D graphics that are used to control the camera or other scene items.
     * @see https://doc.babylonjs.com/features/cameras#virtual-joysticks-camera
     * @param name Define the name of the camera in the scene
     * @param position Define the start position of the camera in the scene
     * @param scene Define the scene the camera belongs to
     */
    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, position, scene);
        this.inputs.addVirtualJoystick();
    }

    /**
     * Gets the current object class name.
     * @return the class name
     */
    public getClassName(): string {
        return "VirtualJoysticksCamera";
    }
}
