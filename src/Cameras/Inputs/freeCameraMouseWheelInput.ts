import { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { FreeCamera } from "../../Cameras/freeCamera";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { BaseCameraMouseWheelInput } from "../../Cameras/Inputs/BaseCameraMouseWheelInput";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { Coordinate } from "../../Maths/math.axis";

enum _CameraProperty {
    MoveRelative,
    RotateRelative,
    MoveScene
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

    /**
     * Set which movement axis (relative to camera's orientation) the mouse
     * wheel's X axis controls.
     * @param axis The axis to be moved. Set null to clear.
     */
    @serialize()
    public set wheelXMoveRelative(axis: Nullable<Coordinate>) {
        if (axis === null && this._wheelXAction !== _CameraProperty.MoveRelative) {
            // Attempting to clear different _wheelXAction.
            return;
        }
        this._wheelXAction = _CameraProperty.MoveRelative;
        this._wheelXActionCoordinate = axis;
    }

    /**
     * Get the configured movement axis (relative to camera's orientation) the
     * mouse wheel's X axis controls.
     * @returns The configured axis or null if none.
     */
    public get wheelXMoveRelative(): Nullable<Coordinate> {
        if (this._wheelXAction !== _CameraProperty.MoveRelative) {
            return null;
        }
        return this._wheelXActionCoordinate;
    }

    /**
     * Set which movement axis (relative to camera's orientation) the mouse
     * wheel's Y axis controls.
     * @param axis The axis to be moved. Set null to clear.
     */
    @serialize()
    public set wheelYMoveRelative(axis: Nullable<Coordinate>) {
        if (axis === null && this._wheelYAction !== _CameraProperty.MoveRelative) {
            // Attempting to clear different _wheelYAction.
            return;
        }
        this._wheelYAction = _CameraProperty.MoveRelative;
        this._wheelYActionCoordinate = axis;
    }

    /**
     * Get the configured movement axis (relative to camera's orientation) the
     * mouse wheel's Y axis controls.
     * @returns The configured axis or null if none.
     */
    public get wheelYMoveRelative(): Nullable<Coordinate> {
        if (this._wheelYAction !== _CameraProperty.MoveRelative) {
            return null;
        }
        return this._wheelYActionCoordinate;
    }

    /**
     * Set which movement axis (relative to camera's orientation) the mouse
     * wheel's Z axis controls.
     * @param axis The axis to be moved. Set null to clear.
     */
    @serialize()
    public set wheelZMoveRelative(axis: Nullable<Coordinate>) {
        if (axis === null && this._wheelZAction !== _CameraProperty.MoveRelative) {
            // Attempting to clear different _wheelZAction.
            return;
        }
        this._wheelZAction = _CameraProperty.MoveRelative;
        this._wheelZActionCoordinate = axis;
    }

    /**
     * Get the configured movement axis (relative to camera's orientation) the
     * mouse wheel's Z axis controls.
     * @returns The configured axis or null if none.
     */
    public get wheelZMoveRelative(): Nullable<Coordinate> {
        if (this._wheelZAction !== _CameraProperty.MoveRelative) {
            return null;
        }
        return this._wheelZActionCoordinate;
    }

    /**
     * Set which rotation axis (relative to camera's orientation) the mouse
     * wheel's X axis controls.
     * @param axis The axis to be moved. Set null to clear.
     */
    @serialize()
    public set wheelXRotateRelative(axis: Nullable<Coordinate>) {
        if (axis === null && this._wheelXAction !== _CameraProperty.RotateRelative) {
            // Attempting to clear different _wheelXAction.
            return;
        }
        this._wheelXAction = _CameraProperty.RotateRelative;
        this._wheelXActionCoordinate = axis;
    }

    /**
     * Get the configured rotation axis (relative to camera's orientation) the
     * mouse wheel's X axis controls.
     * @returns The configured axis or null if none.
     */
    public get wheelXRotateRelative(): Nullable<Coordinate> {
        if (this._wheelXAction !== _CameraProperty.RotateRelative) {
            return null;
        }
        return this._wheelXActionCoordinate;
    }

    /**
     * Set which rotation axis (relative to camera's orientation) the mouse
     * wheel's Y axis controls.
     * @param axis The axis to be moved. Set null to clear.
     */
    @serialize()
    public set wheelYRotateRelative(axis: Nullable<Coordinate>) {
        if (axis === null && this._wheelYAction !== _CameraProperty.RotateRelative) {
            // Attempting to clear different _wheelYAction.
            return;
        }
        this._wheelYAction = _CameraProperty.RotateRelative;
        this._wheelYActionCoordinate = axis;
    }

    /**
     * Get the configured rotation axis (relative to camera's orientation) the
     * mouse wheel's Y axis controls.
     * @returns The configured axis or null if none.
     */
    public get wheelYRotateRelative(): Nullable<Coordinate> {
        if (this._wheelYAction !== _CameraProperty.RotateRelative) {
            return null;
        }
        return this._wheelYActionCoordinate;
    }

    /**
     * Set which rotation axis (relative to camera's orientation) the mouse
     * wheel's Z axis controls.
     * @param axis The axis to be moved. Set null to clear.
     */
    @serialize()
    public set wheelZRotateRelative(axis: Nullable<Coordinate>) {
        if (axis === null && this._wheelZAction !== _CameraProperty.RotateRelative) {
            // Attempting to clear different _wheelZAction.
            return;
        }
        this._wheelZAction = _CameraProperty.RotateRelative;
        this._wheelZActionCoordinate = axis;
    }

    /**
     * Get the configured rotation axis (relative to camera's orientation) the
     * mouse wheel's Z axis controls.
     * @returns The configured axis or null if none.
     */
    public get wheelZRotateRelative(): Nullable<Coordinate> {
        if (this._wheelZAction !== _CameraProperty.RotateRelative) {
            return null;
        }
        return this._wheelZActionCoordinate;
    }

    /**
     * Set which movement axis (relative to the scene) the mouse wheel's X axis
     * controls.
     * @param axis The axis to be moved. Set null to clear.
     */
    @serialize()
    public set wheelXMoveScene(axis: Nullable<Coordinate>) {
        if (axis === null && this._wheelXAction !== _CameraProperty.MoveScene) {
            // Attempting to clear different _wheelXAction.
            return;
        }
        this._wheelXAction = _CameraProperty.MoveScene;
        this._wheelXActionCoordinate = axis;
    }

    /**
     * Get the configured movement axis (relative to the scene) the mouse wheel's
     * X axis controls.
     * @returns The configured axis or null if none.
     */
    public get wheelXMoveScene(): Nullable<Coordinate> {
        if (this._wheelXAction !== _CameraProperty.MoveScene) {
            return null;
        }
        return this._wheelXActionCoordinate;
    }

    /**
     * Set which movement axis (relative to the scene) the mouse wheel's Y axis
     * controls.
     * @param axis The axis to be moved. Set null to clear.
     */
    @serialize()
    public set wheelYMoveScene(axis: Nullable<Coordinate>) {
        if (axis === null && this._wheelYAction !== _CameraProperty.MoveScene) {
            // Attempting to clear different _wheelYAction.
            return;
        }
        this._wheelYAction = _CameraProperty.MoveScene;
        this._wheelYActionCoordinate = axis;
    }

    /**
     * Get the configured movement axis (relative to the scene) the mouse wheel's
     * Y axis controls.
     * @returns The configured axis or null if none.
     */
    public get wheelYMoveScene(): Nullable<Coordinate> {
        if (this._wheelYAction !== _CameraProperty.MoveScene) {
            return null;
        }
        return this._wheelYActionCoordinate;
    }

    /**
     * Set which movement axis (relative to the scene) the mouse wheel's Z axis
     * controls.
     * @param axis The axis to be moved. Set null to clear.
     */
    @serialize()
    public set wheelZMoveScene(axis: Nullable<Coordinate>) {
        if (axis === null && this._wheelZAction !== _CameraProperty.MoveScene) {
            // Attempting to clear different _wheelZAction.
            return;
        }
        this._wheelZAction = _CameraProperty.MoveScene;
        this._wheelZActionCoordinate = axis;
    }

    /**
     * Get the configured movement axis (relative to the scene) the mouse wheel's
     * Z axis controls.
     * @returns The configured axis or null if none.
     */
    public get wheelZMoveScene(): Nullable<Coordinate> {
        if (this._wheelZAction !== _CameraProperty.MoveScene) {
            return null;
        }
        return this._wheelZActionCoordinate;
    }

    /**
     * Called for each rendered frame.
     */
    public checkInputs(): void {
        if (this._wheelDeltaX === 0 &&
                this._wheelDeltaY === 0 &&
                this._wheelDeltaZ == 0) {
            return;
        }

        // Clear the camera properties that we might be updating.
        this._moveRelative.setAll(0);
        this._rotateRelative.setAll(0);
        this._moveScene.setAll(0);

        // Set the camera properties that are to be updated.
        this._updateCamera();

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

        // Call the base class implementation to handle observers and do cleanup.
        super.checkInputs();
    }

    private _moveRelative = Vector3.Zero();
    private _rotateRelative = Vector3.Zero();
    private _moveScene = Vector3.Zero();

    /**
     * These are set to the desired default behaviour.
     */
    private _wheelXAction: Nullable<_CameraProperty> = _CameraProperty.MoveRelative;
    private _wheelXActionCoordinate: Nullable<Coordinate> = Coordinate.X;
    private _wheelYAction: Nullable<_CameraProperty> = _CameraProperty.MoveRelative;
    private _wheelYActionCoordinate: Nullable<Coordinate> = Coordinate.Z;
    private _wheelZAction: Nullable<_CameraProperty> = null;
    private _wheelZActionCoordinate: Nullable<Coordinate> = null;

    /**
     * Update the camera according to any configured properties for the 3
     * mouse-wheel axis.
     */
    private _updateCamera(): void {
        // Do the camera updates for each of the 3 touch-wheel axis.
        this._updateCameraProperty(
            this._wheelDeltaX, this._wheelXAction, this._wheelXActionCoordinate);
        this._updateCameraProperty(
            this._wheelDeltaY, this._wheelYAction, this._wheelYActionCoordinate);
        this._updateCameraProperty(
            this._wheelDeltaZ, this._wheelZAction, this._wheelZActionCoordinate);
    }

    /**
     * Update one property of the camera.
     */
    private _updateCameraProperty(
        /* Mouse-wheel delta. */
        value: number,
        /* Camera property to be changed. */
        cameraProperty: Nullable<_CameraProperty>,
        /* Axis of Camera property to be changed. */
        coordinate: Nullable<Coordinate>
    ): void {
        if (value === 0) {
            // Mouse wheel has not moved.
            return;
        }
        if (cameraProperty === null || coordinate === null) {
            // Mouse wheel axis not configured.
            return;
        }

        let action = null;
        switch (cameraProperty) {
            case _CameraProperty.MoveRelative:
                action = this._moveRelative;
                break;
            case _CameraProperty.RotateRelative:
                action = this._rotateRelative;
                break;
            case _CameraProperty.MoveScene:
                action = this._moveScene;
                break;
        }

        switch (coordinate) {
            case Coordinate.X:
                action.set(value, 0, 0);
                break;
            case Coordinate.Y:
                action.set(0, value, 0);
                break;
            case Coordinate.Z:
                action.set(0, 0, value);
                break;
        }
    }
}

(<any>CameraInputTypes)["FreeCameraMouseWheelInput"] = FreeCameraMouseWheelInput;
