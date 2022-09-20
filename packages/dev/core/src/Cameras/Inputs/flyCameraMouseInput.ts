import type { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import type { Observer } from "../../Misc/observable";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import type { FlyCamera } from "../../Cameras/flyCamera";
import { PointerEventTypes } from "../../Events/pointerEvents";
import type { Scene } from "../../scene";
import { Quaternion } from "../../Maths/math.vector";
import { Axis } from "../../Maths/math.axis";
import { Tools } from "../../Misc/tools";
import type { IPointerEvent, IWheelEvent } from "../../Events/deviceInputEvents";
import type { DeviceSourceType } from "../../DeviceInput/internalDeviceSourceManager";
import { DeviceType, PointerInput } from "../../DeviceInput/InputDevices/deviceEnums";
/**
 * Listen to mouse events to control the camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FlyCameraMouseInput implements ICameraInput<FlyCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FlyCamera;

    /**
     * Defines if touch is enabled. (Default is true.)
     */
    public touchEnabled: boolean;

    /**
     * Defines the buttons associated with the input to handle camera rotation.
     */
    @serialize()
    public buttons = [0, 1, 2];

    /**
     * Assign buttons for Yaw control.
     */
    public buttonsYaw: number[] = [-1, 0, 1];

    /**
     * Assign buttons for Pitch control.
     */
    public buttonsPitch: number[] = [-1, 0, 1];

    /**
     * Assign buttons for Roll control.
     */
    public buttonsRoll: number[] = [2];

    /**
     * Detect if any button is being pressed while mouse is moved.
     * -1 = Mouse locked.
     * 0 = Left button.
     * 1 = Middle Button.
     * 2 = Right Button.
     */
    public activeButton: number = -1;

    /**
     * Defines the pointer's angular sensibility, to control the camera rotation speed.
     * Higher values reduce its sensitivity.
     */
    @serialize()
    public angularSensibility = 1000.0;

    private _connectedObserver: Nullable<Observer<DeviceSourceType>>;
    private _disconnectedObserver: Nullable<Observer<DeviceSourceType>>;
    private _rollObserver: Nullable<Observer<Scene>>;
    private _mouseObserver: Nullable<Observer<IPointerEvent | IWheelEvent>>;
    private _touchObservers: Array<Nullable<Observer<IPointerEvent>>>;
    private _previousPosition: Nullable<{ x: number; y: number }> = null;
    private _noPreventDefault: boolean | undefined;
    private _element: HTMLElement;

    /**
     * Listen to mouse events to control the camera.
     * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
     */
    constructor() {}

    /**
     * Attach the mouse control to the HTML DOM element.
     * @param noPreventDefault Defines whether events caught by the controls should call preventdefault().
     */
    public attachControl(noPreventDefault?: boolean): void {
        // eslint-disable-next-line prefer-rest-params
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this._noPreventDefault = noPreventDefault;

        this._connectedObserver = this.camera._deviceSourceManager!.onDeviceConnectedObservable.add((deviceSource) => {
            if (deviceSource.deviceType === DeviceType.Mouse) {
                this._mouseObserver = deviceSource.onInputChangedObservable.add((eventData) => {
                    if (!("deltaY" in eventData)) {
                        let type = PointerEventTypes.POINTERMOVE;

                        if (eventData.inputIndex !== PointerInput.Move) {
                            type = deviceSource.getInput(eventData.inputIndex) === 1 ? PointerEventTypes.POINTERDOWN : PointerEventTypes.POINTERUP;
                        }

                        this._pointerInput(eventData, type);
                    }
                });
            } else if (deviceSource.deviceType === DeviceType.Touch) {
                this._touchObservers[deviceSource.deviceSlot] = deviceSource.onInputChangedObservable.add((eventData) => {
                    let type = PointerEventTypes.POINTERMOVE;

                    if (eventData.inputIndex !== PointerInput.Move) {
                        type = deviceSource.getInput(eventData.inputIndex) === 1 ? PointerEventTypes.POINTERDOWN : PointerEventTypes.POINTERUP;
                    }

                    this._pointerInput(eventData, type);
                });
            }
        });

        this._disconnectedObserver = this.camera._deviceSourceManager!.onDeviceDisconnectedObservable.add((deviceSource) => {
            if (deviceSource.deviceType === DeviceType.Mouse) {
                deviceSource.onInputChangedObservable.remove(this._mouseObserver);
                this._mouseObserver = null;
            } else if (deviceSource.deviceType === DeviceType.Touch) {
                deviceSource.onInputChangedObservable.remove(this._touchObservers[deviceSource.deviceSlot]);
                this._touchObservers[deviceSource.deviceSlot] = null;
            }
        });

        // Correct Roll by rate, if enabled.
        this._rollObserver = this.camera.getScene().onBeforeRenderObservable.add(() => {
            if (this.camera.rollCorrect) {
                this.camera.restoreRoll(this.camera.rollCorrect);
            }
        });
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        if (this._connectedObserver || this._disconnectedObserver) {
            this.camera._deviceSourceManager?.onDeviceConnectedObservable.remove(this._connectedObserver);
            this.camera._deviceSourceManager?.onDeviceDisconnectedObservable.remove(this._disconnectedObserver);
            const mouse = this.camera._deviceSourceManager?.getDeviceSource(DeviceType.Mouse);
            const touches = this.camera._deviceSourceManager?.getDeviceSources(DeviceType.Touch);

            mouse?.onInputChangedObservable.remove(this._mouseObserver);
            touches?.forEach((touch) => {
                touch.onInputChangedObservable.remove(this._touchObservers[touch.deviceSlot]);
            });

            this.camera.getScene().onBeforeRenderObservable.remove(this._rollObserver);

            this._rollObserver = null;
            this._previousPosition = null;
            this._noPreventDefault = undefined;
        }
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name.
     */
    public getClassName(): string {
        return "FlyCameraMouseInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input's friendly name.
     */
    public getSimpleName(): string {
        return "mouse";
    }

    // Track mouse movement, when the pointer is not locked.
    private _pointerInput(p: IPointerEvent, t: PointerEventTypes): void {
        const camera = this.camera;
        const engine = camera.getEngine();

        if (engine.isInVRExclusivePointerMode) {
            return;
        }

        if (!this.touchEnabled && p.pointerType === "touch") {
            return;
        }

        // Mouse is moved but an unknown mouse button is pressed.
        if (t !== PointerEventTypes.POINTERMOVE && this.buttons.indexOf(p.button) === -1) {
            return;
        }

        const srcElement = <HTMLElement>p.target;

        // Mouse down.
        if (t === PointerEventTypes.POINTERDOWN) {
            try {
                srcElement?.setPointerCapture(p.pointerId);
            } catch (e) {
                // Nothing to do with the error. Execution continues.
            }

            this._previousPosition = {
                x: p.clientX,
                y: p.clientY,
            };

            this.activeButton = p.button;

            if (!this._noPreventDefault) {
                p.preventDefault();
                this._element.focus();
            }

            // This is required to move while pointer button is down
            if (engine.isPointerLock) {
                this._onMouseMove(p);
            }
        }
        // Mouse up.
        else if (t === PointerEventTypes.POINTERUP) {
            try {
                srcElement?.releasePointerCapture(p.pointerId);
            } catch (e) {
                // Nothing to do with the error. Execution continues.
            }

            this.activeButton = -1;

            this._previousPosition = null;
            if (!this._noPreventDefault) {
                p.preventDefault();
            }
        }
        // Mouse move.
        else if (t === PointerEventTypes.POINTERMOVE) {
            if (!this._previousPosition) {
                if (engine.isPointerLock) {
                    this._onMouseMove(p);
                }

                return;
            }

            const offsetX = p.clientX - this._previousPosition.x;
            const offsetY = p.clientY - this._previousPosition.y;

            this._rotateCamera(offsetX, offsetY);

            this._previousPosition = {
                x: p.clientX,
                y: p.clientY,
            };

            if (!this._noPreventDefault) {
                p.preventDefault();
            }
        }
    }

    // Track mouse movement, when pointer is locked.
    private _onMouseMove(e: IPointerEvent): void {
        const camera = this.camera;
        const engine = camera.getEngine();

        if (!engine.isPointerLock || engine.isInVRExclusivePointerMode) {
            return;
        }

        const offsetX = e.movementX;
        const offsetY = e.movementY;

        this._rotateCamera(offsetX, offsetY);

        this._previousPosition = null;

        if (!this._noPreventDefault) {
            e.preventDefault();
        }
    }

    /**
     * Rotate camera by mouse offset.
     * @param offsetX
     * @param offsetY
     */
    private _rotateCamera(offsetX: number, offsetY: number): void {
        const camera = this.camera;
        const scene = this.camera.getScene();

        if (scene.useRightHandedSystem) {
            offsetX *= -1;
        }

        if (camera.parent && camera.parent._getWorldMatrixDeterminant() < 0) {
            offsetX *= -1;
        }

        const x = offsetX / this.angularSensibility;
        const y = offsetY / this.angularSensibility;

        // Initialize to current rotation.
        const currentRotation = Quaternion.RotationYawPitchRoll(camera.rotation.y, camera.rotation.x, camera.rotation.z);
        let rotationChange: Quaternion;

        // Pitch.
        if (
            this.buttonsPitch.some((v) => {
                return v === this.activeButton;
            })
        ) {
            // Apply change in Radians to vector Angle.
            rotationChange = Quaternion.RotationAxis(Axis.X, y);
            // Apply Pitch to quaternion.
            currentRotation.multiplyInPlace(rotationChange);
        }

        // Yaw.
        if (
            this.buttonsYaw.some((v) => {
                return v === this.activeButton;
            })
        ) {
            // Apply change in Radians to vector Angle.
            rotationChange = Quaternion.RotationAxis(Axis.Y, x);
            // Apply Yaw to quaternion.
            currentRotation.multiplyInPlace(rotationChange);

            // Add Roll, if banked turning is enabled, within Roll limit.
            const limit = camera.bankedTurnLimit + camera._trackRoll; // Defaults to 90° plus manual roll.
            if (camera.bankedTurn && -limit < camera.rotation.z && camera.rotation.z < limit) {
                const bankingDelta = camera.bankedTurnMultiplier * -x;
                // Apply change in Radians to vector Angle.
                rotationChange = Quaternion.RotationAxis(Axis.Z, bankingDelta);
                // Apply Yaw to quaternion.
                currentRotation.multiplyInPlace(rotationChange);
            }
        }

        // Roll.
        if (
            this.buttonsRoll.some((v) => {
                return v === this.activeButton;
            })
        ) {
            // Apply change in Radians to vector Angle.
            rotationChange = Quaternion.RotationAxis(Axis.Z, -x);
            // Track Rolling.
            camera._trackRoll -= x;
            // Apply Pitch to quaternion.
            currentRotation.multiplyInPlace(rotationChange);
        }

        // Apply rotationQuaternion to Euler camera.rotation.
        currentRotation.toEulerAnglesToRef(camera.rotation);
    }
}

(<any>CameraInputTypes)["FlyCameraMouseInput"] = FlyCameraMouseInput;
