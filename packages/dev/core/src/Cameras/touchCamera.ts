import { FreeCamera } from "./freeCamera";
import type { FreeCameraTouchInput } from "../Cameras/Inputs/freeCameraTouchInput";
import type { FreeCameraMouseInput } from "../Cameras/Inputs/freeCameraMouseInput";
import type { Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import { Node } from "../node";

Node.AddNodeConstructor("TouchCamera", (name, scene) => {
    return () => new TouchCamera(name, Vector3.Zero(), scene);
});

/**
 * This represents a FPS type of camera controlled by touch.
 * This is like a universal camera minus the Gamepad controls.
 * @see https://doc.babylonjs.com/features/cameras#universal-camera
 */
export class TouchCamera extends FreeCamera {
    /**
     * Defines the touch sensibility for rotation.
     * The higher the faster.
     */
    public get touchAngularSensibility(): number {
        const touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
        if (touch) {
            return touch.touchAngularSensibility;
        }

        return 0;
    }

    public set touchAngularSensibility(value: number) {
        const touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
        if (touch) {
            touch.touchAngularSensibility = value;
        }
    }

    /**
     * Defines the touch sensibility for move.
     * The higher the faster.
     */
    public get touchMoveSensibility(): number {
        const touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
        if (touch) {
            return touch.touchMoveSensibility;
        }

        return 0;
    }

    public set touchMoveSensibility(value: number) {
        const touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
        if (touch) {
            touch.touchMoveSensibility = value;
        }
    }

    /**
     * Instantiates a new touch camera.
     * This represents a FPS type of camera controlled by touch.
     * This is like a universal camera minus the Gamepad controls.
     * @see https://doc.babylonjs.com/features/cameras#universal-camera
     * @param name Define the name of the camera in the scene
     * @param position Define the start position of the camera in the scene
     * @param scene Define the scene the camera belongs to
     */
    constructor(name: string, position: Vector3, scene?: Scene) {
        super(name, position, scene);
        this.inputs.addTouch();

        this._setupInputs();
    }

    /**
     * Gets the current object class name.
     * @returns the class name
     */
    public getClassName(): string {
        return "TouchCamera";
    }

    /** @internal */
    public _setupInputs() {
        const touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
        const mouse = <FreeCameraMouseInput>this.inputs.attached["mouse"];
        if (mouse) {
            mouse.touchEnabled = false;
        } else {
            touch.allowMouse = true;
        }
    }
}
