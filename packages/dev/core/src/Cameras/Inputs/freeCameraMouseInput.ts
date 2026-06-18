import { type Observer, type EventState, Observable } from "../../Misc/observable";
import { serialize } from "../../Misc/decorators";
import { type Nullable } from "../../types";
import { type ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { type FreeCamera } from "../../Cameras/freeCamera";
import { type PointerInfo, PointerEventTypes } from "../../Events/pointerEvents";
import { Tools } from "../../Misc/tools.pure";
import { type IMouseEvent, type IPointerEvent } from "../../Events/deviceInputEvents";
import { type InputConditions } from "../inputMapper";
/**
 * Manage the mouse inputs to control the movement of a free camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FreeCameraMouseInput implements ICameraInput<FreeCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FreeCamera;

    /**
     * Defines the buttons associated with the input to handle camera move.
     */
    @serialize()
    public buttons = [0, 1, 2];

    /**
     * Defines the pointer angular sensibility  along the X and Y axis or how fast is the camera rotating.
     */
    @serialize()
    public angularSensibility = 2000.0;

    private _pointerInput: (p: PointerInfo, s: EventState) => void;
    private _onMouseMove: Nullable<(e: IMouseEvent) => any>;
    private _observer: Nullable<Observer<PointerInfo>>;
    private _previousPosition: Nullable<{ x: number; y: number }> = null;

    /**
     * Observable for when a pointer move event occurs containing the move offset
     */
    public onPointerMovedObservable = new Observable<{ offsetX: number; offsetY: number }>();
    /**
     * @internal
     * If the camera should be rotated automatically based on pointer movement
     */
    public _allowCameraRotation = true;

    private _currentActiveButton: number = -1;
    private _activePointerId: number = -1;
    private _contextMenuBind: (evt: MouseEvent) => void;

    /** Reused conditions object for `resolveInteraction` to avoid per-move allocations. */
    private readonly _pointerConditions: InputConditions = {};

    /**
     * Applies a pointer-drag delta as camera rotation, but only if the camera's configurable
     * input map resolves the current pointer interaction to "rotate". The map is consulted with
     * the currently active mouse button so consumers can remap or disable pointer-driven rotation.
     * The applied scale comes from the resolved entry's `sensitivity`/`sensitivityX`/`sensitivityY`,
     * falling back to the legacy `angularSensibility` for backward compatibility. The rotation is
     * still written to `camera.cameraRotation` (not the movement accumulators) so existing code that
     * reads `cameraRotation` immediately after a pointer event keeps working.
     * @param offsetX Horizontal pointer delta (already handedness-adjusted).
     * @param offsetY Vertical pointer delta (already handedness-adjusted).
     */
    private _applyPointerRotation(offsetX: number, offsetY: number): void {
        this._pointerConditions.button = this._currentActiveButton;
        const entry = this.camera.movement.input.resolveInteraction("pointer", this._pointerConditions);
        if (!entry || entry.interaction !== "rotate") {
            return;
        }
        const sensitivityX = entry.sensitivityX ?? entry.sensitivity ?? 1 / this.angularSensibility;
        const sensitivityY = entry.sensitivityY ?? entry.sensitivity ?? 1 / this.angularSensibility;
        this.camera.cameraRotation.y += offsetX * sensitivityX;
        this.camera.cameraRotation.x += offsetY * sensitivityY;
    }

    /**
     * Manage the mouse inputs to control the movement of a free camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
     * @param touchEnabled Defines if touch is enabled or not
     */
    constructor(
        /**
         * [true] Define if touch is enabled in the mouse input
         */
        public touchEnabled = true
    ) {}

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(noPreventDefault?: boolean): void {
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        const engine = this.camera.getEngine();
        const element = engine.getInputElement();

        if (!this._pointerInput) {
            this._pointerInput = (p) => {
                const evt = <IPointerEvent>p.event;
                const isTouch = evt.pointerType === "touch";

                if (!this.touchEnabled && isTouch) {
                    return;
                }

                if (p.type !== PointerEventTypes.POINTERMOVE && this.buttons.indexOf(evt.button) === -1) {
                    return;
                }

                const srcElement = <HTMLElement>evt.target;

                if (p.type === PointerEventTypes.POINTERDOWN) {
                    // If the input is touch with more than one touch OR if the input is mouse and there is already an active button, return
                    if ((isTouch && this._activePointerId !== -1) || (!isTouch && this._currentActiveButton !== -1)) {
                        return;
                    }

                    this._activePointerId = evt.pointerId;
                    try {
                        srcElement?.setPointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error. Execution will continue.
                    }

                    if (this._currentActiveButton === -1) {
                        this._currentActiveButton = evt.button;
                    }

                    this._previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY,
                    };

                    if (!noPreventDefault) {
                        evt.preventDefault();
                        if (element) {
                            element.focus();
                        }
                    }

                    // This is required to move while pointer button is down
                    if (engine.isPointerLock && this._onMouseMove) {
                        this._onMouseMove(p.event);
                    }
                } else if (p.type === PointerEventTypes.POINTERUP) {
                    // If input is touch with a different touch id OR if input is mouse with a different button, return
                    if ((isTouch && this._activePointerId !== evt.pointerId) || (!isTouch && this._currentActiveButton !== evt.button)) {
                        return;
                    }

                    try {
                        srcElement?.releasePointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error.
                    }
                    this._currentActiveButton = -1;

                    this._previousPosition = null;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    this._activePointerId = -1;
                } else if (p.type === PointerEventTypes.POINTERMOVE && (this._activePointerId === evt.pointerId || !isTouch)) {
                    if (engine.isPointerLock && this._onMouseMove) {
                        this._onMouseMove(p.event);
                    } else if (this._previousPosition) {
                        const handednessMultiplier = this.camera._calculateHandednessMultiplier();
                        const offsetX = (evt.clientX - this._previousPosition.x) * handednessMultiplier;
                        const offsetY = (evt.clientY - this._previousPosition.y) * handednessMultiplier;

                        if (this._allowCameraRotation) {
                            this._applyPointerRotation(offsetX, offsetY);
                        }
                        this.onPointerMovedObservable.notifyObservers({ offsetX: offsetX, offsetY: offsetY });

                        this._previousPosition = {
                            x: evt.clientX,
                            y: evt.clientY,
                        };

                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                }
            };
        }

        this._onMouseMove = (evt) => {
            if (!engine.isPointerLock) {
                return;
            }

            const handednessMultiplier = this.camera._calculateHandednessMultiplier();
            this._applyPointerRotation(evt.movementX * handednessMultiplier, evt.movementY * handednessMultiplier);

            this._previousPosition = null;

            if (!noPreventDefault) {
                evt.preventDefault();
            }
        };

        this._observer = this.camera
            .getScene()
            ._inputManager._addCameraPointerObserver(this._pointerInput, PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE);

        if (element) {
            this._contextMenuBind = (evt: MouseEvent) => this.onContextMenu(evt as PointerEvent);
            element.addEventListener("contextmenu", this._contextMenuBind, false); // TODO: We need to figure out how to handle this for Native
        }
    }

    /**
     * Called on JS contextmenu event.
     * Override this method to provide functionality.
     * @param evt the context menu event
     */
    public onContextMenu(evt: PointerEvent): void {
        evt.preventDefault();
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        if (this._observer) {
            this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer);

            if (this._contextMenuBind) {
                const engine = this.camera.getEngine();
                const element = engine.getInputElement();
                if (element) {
                    element.removeEventListener("contextmenu", this._contextMenuBind);
                }
            }

            if (this.onPointerMovedObservable) {
                this.onPointerMovedObservable.clear();
            }

            this._observer = null;
            this._onMouseMove = null;
            this._previousPosition = null;
        }

        this._activePointerId = -1;
        this._currentActiveButton = -1;
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "FreeCameraMouseInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "mouse";
    }
}

(<any>CameraInputTypes)["FreeCameraMouseInput"] = FreeCameraMouseInput;
