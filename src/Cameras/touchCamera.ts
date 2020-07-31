import { FreeCamera } from "./freeCamera";
import { FreeCameraTouchInput } from "../Cameras/Inputs/freeCameraTouchInput";
import { FreeCameraMouseInput } from "../Cameras/Inputs/freeCameraMouseInput";
import { Scene } from "../scene";
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
        var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
        if (touch) {
            return touch.touchAngularSensibility;
        }

        return 0;
    }

    public set touchAngularSensibility(value: number) {
        var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
        if (touch) {
            touch.touchAngularSensibility = value;
        }
    }

    /**
     * Defines the touch sensibility for move.
     * The higher the faster.
     */
    public get touchMoveSensibility(): number {
        var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
        if (touch) {
            return touch.touchMoveSensibility;
        }

        return 0;
    }

    public set touchMoveSensibility(value: number) {
        var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
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
    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, position, scene);
        this.inputs.addTouch();

        this._setupInputs();
    }

    /**
     * Gets the current object class name.
     * @return the class name
     */
    public getClassName(): string {
        return "TouchCamera";
    }

    /** @hidden */
    public _setupInputs() {
        var mouse = <FreeCameraMouseInput>this.inputs.attached["mouse"];
        if (mouse) {
            mouse.touchEnabled = false;
        }
    }
}
