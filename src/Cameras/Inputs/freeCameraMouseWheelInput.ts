import { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { FreeCamera } from "../../Cameras/freeCamera";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { BaseCameraMouseWheelInput } from "../../Cameras/Inputs/BaseCameraMouseWheelInput";
import { Matrix, Vector3 } from "../../Maths/math.vector";

/**
 * A user configurable callback to be called on mouse wheel movement.
 */
export interface FreeCameraMouseWheelCustomCallback {
    /**
     * @param camera The camera instance the mouse wheel is attached to.
     * @param wheelDeltaX The change in value of the mouse wheel's X axis since last called.
     * @param wheelDeltaY The change in value of the mouse wheel's X axis since last called.
     * @param wheelDeltaZ The change in value of the mouse wheel's X axis since last called.
     */
    (camera: FreeCamera, wheelDeltaX: number, wheelDeltaY: number, wheelDeltaZ: number): void;
}

/**
 * Manage the mouse wheel inputs to control a free camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FreeCameraMouseWheelInput extends BaseCameraMouseWheelInput {
    
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FreeCamera;

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "FreeCameraMouseWheelInput";
    }

    private _moveRelative = Vector3.Zero();
    private _rotateRelative = Vector3.Zero();
    private _moveScene = Vector3.Zero();

    private _wheelXAction: Nullable<Vector3> = this._moveRelative;
    private _wheelXActionProperty: Nullable<number> = 0;
    private _wheelYAction: Nullable<Vector3> = this._moveRelative;
    private _wheelYActionProperty: Nullable<number> = 2;
    private _wheelZAction: Nullable<Vector3> = null;
    private _wheelZActionProperty: Nullable<number> = null;

    private _updateCamera(
        value: number, action: Nullable<Vector3>, property: Nullable<number>): void {
            if(value === 0) {
                // Wheel has not moved.
                return;
            }
            if(action === null || property === null) {
                // Wheel axis not configured.
                return;
            }

            switch(property) {
                case 0:
                    action.set(value, 0, 0);
                    break;
                case 1:
                    action.set(0, value, 0);
                    break;
                case 2:
                    action.set(0, 0, value);
                    break;
                default:
                    console.warn("Invalid value");
            }
    }

    /**
     * A user configurable callback to be called on mouse wheel movement.
     * To be used whenever the default functionality of this class does not
     * change the required camera parameter by default.
     */
    @serialize()
    public customCallback: Nullable<FreeCameraMouseWheelCustomCallback> = null;

    /**
     * Called for each rendered frame.
     */
    public checkInputs(): void {
        if (this._wheelDeltaX === 0 &&
                this._wheelDeltaY === 0 &&
                this._wheelDeltaZ == 0) {
            return;
        }

        this._moveRelative.setAll(0);
        this._rotateRelative.setAll(0);
        this._moveScene.setAll(0);

        this._updateCamera(this._wheelDeltaX, this._wheelXAction, this._wheelXActionProperty);
        this._updateCamera(this._wheelDeltaY, this._wheelYAction, this._wheelYActionProperty);
        this._updateCamera(this._wheelDeltaZ, this._wheelZAction, this._wheelZActionProperty);

        if (this.camera.getScene().useRightHandedSystem) {
            // TODO: Does this need done for worldUpdate too?
            this._moveRelative.z *= -1;
        }

        // Convert updates relative to camera to world position update.
        const cameraTransformMatrix = Matrix.Zero();
        this.camera.getViewMatrix().invertToRef(cameraTransformMatrix);

        const transformedDirection = Vector3.Zero();
        Vector3.TransformNormalToRef(
            this._moveRelative, cameraTransformMatrix, transformedDirection);

        // Apply updates to camera position.
        this.camera.cameraRotation.x += this._rotateRelative.x / 200;
        this.camera.cameraRotation.y += this._rotateRelative.y / 200;
        this.camera.cameraDirection.addInPlace(transformedDirection);
        this.camera.cameraDirection.addInPlace(this._moveScene);

        // Do the user defined customCallback if set.
        if (this.customCallback !== null) {
            this.customCallback(
                this.camera, this._wheelDeltaX, this._wheelDeltaY, this._wheelDeltaZ);
        }

        // Clear deltas.
        this._wheelDeltaX = 0;
        this._wheelDeltaY = 0;
        this._wheelDeltaZ = 0;
    }
}

(<any>CameraInputTypes)["FreeCameraMouseWheelInput"] = FreeCameraMouseWheelInput;
