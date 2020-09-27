import { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { FreeCamera } from "../../Cameras/freeCamera";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { BaseCameraMouseWheelInput } from "../../Cameras/Inputs/BaseCameraMouseWheelInput";
import { Matrix, Vector3 } from "../../Maths/math.vector";

/**
 * Defines Mouse wheel axis. A typical laptop trackpad emulates a mouse wheel in
 * X and Y axis. Many modern browsers permit X, Y and Z.
 */
export enum FreeCameraMouseWheelAxis {
    /**
     * No mouse wheel set.
     */
    NONE,
    /**
     * Mouse wheel X axis is set.
     */
    X,
    /**
     * Mouse wheel Y axis is set.
     */
    Y,
    /**
     * Mouse wheel Z axis is set.
     */
    Z
}

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
     * Manage the mouse scroll wheel input to control the movement of a free camera.
     * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
     */
    constructor() {
        super();
        this._setAllAxis();
    }

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
     * Log error messages if basic misconfiguration has occurred.
     */
    public warningEnable: boolean = true;

    private _cameraMoveX: FreeCameraMouseWheelAxis = FreeCameraMouseWheelAxis.X;

    /**
     * Get which mouse wheel axis moves along camera's X axis (if any).
     * @returns the currently configured mouse wheel axis.
     */
    @serialize()
    public get cameraMoveX(): FreeCameraMouseWheelAxis {
        return this._cameraMoveX;
    }

    /**
     * Set which mouse wheel axis moves along camera's X axis (if any).
     * @param axis is the desired mouse wheel axis.
     */
    public set cameraMoveX(axis: FreeCameraMouseWheelAxis) {
        this._cameraMoveX = axis;
        this._setAllAxis();
        this._sanityCheck();
    }

    private _cameraMoveY: FreeCameraMouseWheelAxis = FreeCameraMouseWheelAxis.NONE;

    /**
     * Get which mouse wheel axis moves along camera's Y axis (if any).
     * @returns the currently configured mouse wheel axis.
     */
    @serialize()
    public get cameraMoveY(): FreeCameraMouseWheelAxis {
        return this._cameraMoveY;
    }

    /**
     * Set which mouse wheel axis moves along camera's Y axis (if any).
     * @param axis is the desired mouse wheel axis.
     */
    public set cameraMoveY(axis: FreeCameraMouseWheelAxis) {
        this._cameraMoveY = axis;
        this._setAllAxis();
        this._sanityCheck();
    }

    private _cameraMoveZ: FreeCameraMouseWheelAxis = FreeCameraMouseWheelAxis.Y;

    /**
     * Get which mouse wheel axis moves along camera's X axis (if any).
     * @returns the currently configured mouse wheel axis.
     */
    @serialize()
    public get cameraMoveZ(): FreeCameraMouseWheelAxis {
        return this._cameraMoveZ;
    }

    /**
     * Set which mouse wheel axis moves along camera's Z axis (if any).
     * @param axis is the desired mouse wheel axis.
     */
    public set cameraMoveZ(axis: FreeCameraMouseWheelAxis) {
        this._cameraMoveZ = axis;
        this._setAllAxis();
        this._sanityCheck();
    }

    private _cameraWorldPosX: FreeCameraMouseWheelAxis = FreeCameraMouseWheelAxis.NONE;

    /**
     * Get which mouse wheel axis moves the camera along the scene's X axis (if any).
     * @returns the currently configured mouse wheel axis.
     */
    @serialize()
    public get cameraWorldPosX(): FreeCameraMouseWheelAxis {
        return this._cameraWorldPosX;
    }

    /**
     * Set which mouse wheel axis moves the camera along the scene's X axis (if any).
     * @param axis is the desired mouse wheel axis.
     */
    public set cameraWorldPosX(axis: FreeCameraMouseWheelAxis) {
        this._cameraWorldPosX = axis;
        this._setAllAxis();
        this._sanityCheck();
    }

    private _cameraWorldPosY: FreeCameraMouseWheelAxis = FreeCameraMouseWheelAxis.NONE;

    /**
     * Get which mouse wheel axis moves the camera along the scene's Y axis (if any).
     * @returns the currently configured mouse wheel axis.
     */
    @serialize()
    public get cameraWorldPosY(): FreeCameraMouseWheelAxis {
        return this._cameraWorldPosY;
    }

    /**
     * Set which mouse wheel axis moves the camera along the scene's Y axis (if any).
     * @param axis is the desired mouse wheel axis.
     */
    public set cameraWorldPosY(axis: FreeCameraMouseWheelAxis) {
        this._cameraWorldPosY = axis;
        this._setAllAxis();
        this._sanityCheck();
    }


    private _cameraWorldPosZ: FreeCameraMouseWheelAxis = FreeCameraMouseWheelAxis.NONE;

    /**
     * Get which mouse wheel axis moves the camera along the scene's Z axis (if any).
     * @returns the currently configured mouse wheel axis.
     */
    @serialize()
    public get cameraWorldPosZ(): FreeCameraMouseWheelAxis {
        return this._cameraWorldPosZ;
    }

    /**
     * Set which mouse wheel axis moves the camera along the scene's Z axis (if any).
     * @param axis is the desired mouse wheel axis.
     */
    public set cameraWorldPosZ(axis: FreeCameraMouseWheelAxis) {
        this._cameraWorldPosZ = axis;
        this._setAllAxis();
        this._sanityCheck();
    }

    /**
     * Set user configurable callback to be called on mouse wheel movement
     * to be used whenever the default functionality of this class does not
     * change the required camera parameter by default.
     * @param customCallback is a callback function which if set will get called
     * whenever the mouse wheel value(s) change.
     */
    @serialize()
    public customCallback: Nullable<FreeCameraMouseWheelCustomCallback> = null;

    private _cameraUpdate = Vector3.Zero();
    private _worldUpdate = Vector3.Zero();

    /**
     * Called for each rendered frame.
     */
    public checkInputs(): void {
        if(this._wheelDeltaX === 0 &&
                this._wheelDeltaY === 0 &&
                this._wheelDeltaZ == 0) {
            return;
        }

        this._cameraUpdate.setAll(0);
        this._worldUpdate.setAll(0);

        // Iterate over all camera properties we might want to update.
        this._allAxis.forEach((axis) => {
            const [wheelAxis, updater, component] = axis;

            if(this._wheelDeltaX !== 0 && wheelAxis === FreeCameraMouseWheelAxis.X) {
                updater.set(component == "x" ? this._wheelDeltaX/100 : 0,
                            component == "y" ? this._wheelDeltaX/100 : 0,
                            component == "z" ? this._wheelDeltaX/100 : 0);
            }
            if(this._wheelDeltaY !== 0 && wheelAxis === FreeCameraMouseWheelAxis.Y) {
                updater.set(component == "x" ? this._wheelDeltaY/100 : 0,
                            component == "y" ? this._wheelDeltaY/100 : 0,
                            component == "z" ? this._wheelDeltaY/100 : 0);
            }
            if(this._wheelDeltaZ !== 0 && wheelAxis === FreeCameraMouseWheelAxis.Z) {
                updater.set(component == "x" ? this._wheelDeltaZ/100 : 0,
                            component == "y" ? this._wheelDeltaZ/100 : 0,
                            component == "z" ? this._wheelDeltaZ/100 : 0);
            }
        });

        if (this.camera.getScene().useRightHandedSystem) {
            // TODO: Does this need done for worldUpdate too?
            this._cameraUpdate.z *= -1;
        }

        // Convert updates relative to camera to world position update.
        const cameraTransformMatrix = Matrix.Zero();
        this.camera.getViewMatrix().invertToRef(cameraTransformMatrix);
        
        const transformedDirection = Vector3.Zero();
        Vector3.TransformNormalToRef(
            this._cameraUpdate, cameraTransformMatrix, transformedDirection);

        // Apply updates to camera position.
        this.camera.cameraDirection.addInPlace(transformedDirection);
        this.camera.cameraDirection.addInPlace(this._worldUpdate);

        // Do the user defined customCallback if set.
        if(this.customCallback !== null) {
            this.customCallback(
                this.camera, this._wheelDeltaX, this._wheelDeltaY, this._wheelDeltaZ);
        }

        // Clear deltas.
        this._wheelDeltaX = 0;
        this._wheelDeltaY = 0;
        this._wheelDeltaZ = 0;
    }
    
    /**
     * Gather all user configurable axis into one collection so we can itterate
     * over them later.
     */
    private _allAxis: [FreeCameraMouseWheelAxis, Vector3, string][];
    private _setAllAxis(): void {
        this._allAxis = [
            [this._cameraMoveX, this._cameraUpdate, "x"],
            [this._cameraMoveY, this._cameraUpdate, "y"],
            [this._cameraMoveZ, this._cameraUpdate, "z"],
            [this._cameraWorldPosX, this._worldUpdate, "x"],
            [this._cameraWorldPosY, this._worldUpdate, "y"],
            [this._cameraWorldPosZ, this._worldUpdate, "z"] ];
    }

    /**
     * Display a warning on console if there are obvious misconfiguration.
     * Eg: A single mouse wheel axis controlling multiple camera attributes.
     */
    private _sanityCheck(): void {
        if(!this.warningEnable) {
            return;
        }
        const labels: {[id: number]: string} = {1: "X", 2: "Y", 3: "Z"};
        
        const configuredCount: [number, number, number, number] = [0, 0, 0, 0];
        this._allAxis.forEach((axis) => {
            const wheelAxis = axis[0];

            configuredCount[wheelAxis] += 1;
        });

        // Warn of misconfiguration.
        for(let axis = FreeCameraMouseWheelAxis.X;
            axis <= FreeCameraMouseWheelAxis.Z; 
            axis += 1) {
                if(configuredCount[axis] > 1) {
                    console.warn(
                        `Touch pad ${labels[axis]} axis assigned to ` +
                        `${configuredCount[axis]} tasks. (Only 1 will have any effect.)`);
                }
        }
    }
}

(<any>CameraInputTypes)["FreeCameraMouseWheelInput"] = FreeCameraMouseWheelInput;
