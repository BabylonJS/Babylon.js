import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { FollowCamera } from "../../Cameras/followCamera";
import { serialize } from "../../Misc/decorators";
import { Nullable } from "../../types";
import { Observer } from "../../Misc/observable";
import { Engine } from "../../Engines/engine";
import { KeyboardInfo, KeyboardEventTypes } from "../../Events/keyboardEvents";
import { Scene } from "../../scene";

/**
 * Manage the keyboard inputs to control the movement of a follow camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FollowCameraKeyboardMoveInput implements ICameraInput<FollowCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FollowCamera;

    /**
     * Defines the list of key codes associated with the up action (increase heightOffset)
     */
    @serialize()
    public keysHeightOffsetIncr = [38];

    /**
     * Defines the list of key codes associated with the down action (decrease heightOffset)
     */
    @serialize()
    public keysHeightOffsetDecr = [40];

    /**
     * Defines whether the Alt modifier key is required to move up/down (alter heightOffset)
     */
    @serialize()
    public keysHeightOffsetModifierAlt: boolean = false;

    /**
     * Defines whether the Ctrl modifier key is required to move up/down (alter heightOffset)
     */
    @serialize()
    public keysHeightOffsetModifierCtrl: boolean = false;

    /**
     * Defines whether the Shift modifier key is required to move up/down (alter heightOffset)
     */
    @serialize()
    public keysHeightOffsetModifierShift: boolean = false;

    /**
     * Defines the list of key codes associated with the left action (increase rotationOffset)
     */
    @serialize()
    public keysRotationOffsetIncr = [37];

    /**
     * Defines the list of key codes associated with the right action (decrease rotationOffset)
     */
    @serialize()
    public keysRotationOffsetDecr = [39];

    /**
     * Defines whether the Alt modifier key is required to move left/right (alter rotationOffset)
     */
    @serialize()
    public keysRotationOffsetModifierAlt: boolean = false;

    /**
     * Defines whether the Ctrl modifier key is required to move left/right (alter rotationOffset)
     */
    @serialize()
    public keysRotationOffsetModifierCtrl: boolean = false;

    /**
     * Defines whether the Shift modifier key is required to move left/right (alter rotationOffset)
     */
    @serialize()
    public keysRotationOffsetModifierShift: boolean = false;

    /**
     * Defines the list of key codes associated with the zoom-in action (decrease radius)
     */
    @serialize()
    public keysRadiusIncr = [40];

    /**
     * Defines the list of key codes associated with the zoom-out action (increase radius)
     */
    @serialize()
    public keysRadiusDecr = [38];

    /**
     * Defines whether the Alt modifier key is required to zoom in/out (alter radius value)
     */
    @serialize()
    public keysRadiusModifierAlt: boolean = true;

    /**
     * Defines whether the Ctrl modifier key is required to zoom in/out (alter radius value)
     */
    @serialize()
    public keysRadiusModifierCtrl: boolean = false;

    /**
     * Defines whether the Shift modifier key is required to zoom in/out (alter radius value)
     */
    @serialize()
    public keysRadiusModifierShift: boolean = false;

    /**
     * Defines the rate of change of heightOffset.
     */
    @serialize()
    public heightSensibility: number = 1;

    /**
     * Defines the rate of change of rotationOffset.
     */
    @serialize()
    public rotationSensibility: number = 1;

    /**
     * Defines the rate of change of radius.
     */
    @serialize()
    public radiusSensibility: number = 1;

    private _keys = new Array<number>();
    private _ctrlPressed: boolean;
    private _altPressed: boolean;
    private _shiftPressed: boolean;
    private _onCanvasBlurObserver: Nullable<Observer<Engine>>;
    private _onKeyboardObserver: Nullable<Observer<KeyboardInfo>>;
    private _engine: Engine;
    private _scene: Scene;

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
        if (this._onCanvasBlurObserver) {
            return;
        }

        this._scene = this.camera.getScene();
        this._engine = this._scene.getEngine();

        this._onCanvasBlurObserver = this._engine.onCanvasBlurObservable.add(() => {
            this._keys = [];
        });

        this._onKeyboardObserver = this._scene.onKeyboardObservable.add((info) => {
            let evt = info.event;
            if (!evt.metaKey) {
                if (info.type === KeyboardEventTypes.KEYDOWN) {
                    this._ctrlPressed = evt.ctrlKey;
                    this._altPressed = evt.altKey;
                    this._shiftPressed = evt.shiftKey;

                    if (this.keysHeightOffsetIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysHeightOffsetDecr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotationOffsetIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotationOffsetDecr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRadiusIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRadiusDecr.indexOf(evt.keyCode) !== -1) {
                        var index = this._keys.indexOf(evt.keyCode);

                        if (index === -1) {
                            this._keys.push(evt.keyCode);
                        }

                        if (evt.preventDefault) {
                            if (!noPreventDefault) {
                                evt.preventDefault();
                            }
                        }
                    }
                } else {
                    if (this.keysHeightOffsetIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysHeightOffsetDecr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotationOffsetIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotationOffsetDecr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRadiusIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRadiusDecr.indexOf(evt.keyCode) !== -1) {
                        var index = this._keys.indexOf(evt.keyCode);

                        if (index >= 0) {
                            this._keys.splice(index, 1);
                        }

                        if (evt.preventDefault) {
                            if (!noPreventDefault) {
                                evt.preventDefault();
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: Nullable<HTMLElement>) {
        if (this._scene) {
            if (this._onKeyboardObserver) {
                this._scene.onKeyboardObservable.remove(this._onKeyboardObserver);
            }
            if (this._onCanvasBlurObserver) {
                this._engine.onCanvasBlurObservable.remove(this._onCanvasBlurObserver);
            }
            this._onKeyboardObserver = null;
            this._onCanvasBlurObserver = null;
        }

        this._keys = [];
    }

    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    public checkInputs(): void {
        if (this._onKeyboardObserver) {
            this._keys.forEach((keyCode) => {
                if (this.keysHeightOffsetIncr.indexOf(keyCode) !== -1 &&
                           this._modifierHeightOffset()) {
                    this.camera.heightOffset += this.heightSensibility;
                } else if (this.keysHeightOffsetDecr.indexOf(keyCode) !== -1 &&
                           this._modifierHeightOffset()) {
                    this.camera.heightOffset -= this.heightSensibility;
                } else if (this.keysRotationOffsetIncr.indexOf(keyCode) !== -1 &&
                           this._modifierRotationOffset()) {
                    this.camera.rotationOffset += this.rotationSensibility;
                    this.camera.rotationOffset %= 360;
                } else if (this.keysRotationOffsetDecr.indexOf(keyCode) !== -1 &&
                           this._modifierRotationOffset()) {
                    this.camera.rotationOffset -= this.rotationSensibility;
                    this.camera.rotationOffset %= 360;
                } else if (this.keysRadiusIncr.indexOf(keyCode) !== -1 &&
                           this._modifierRadius()) {
                    this.camera.radius += this.radiusSensibility;
                } else if (this.keysRadiusDecr.indexOf(keyCode) !== -1 &&
                           this._modifierRadius()) {
                    this.camera.radius -= this.radiusSensibility;
                }
            });
        }
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "FollowCameraKeyboardMoveInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "keyboard";
    }

    /**
     * Check if the pressed modifier keys (Alt/Ctrl/Shift) match those configured to
     * allow modification of the heightOffset value.
     */
    private _modifierHeightOffset(): boolean {
        return (this.keysHeightOffsetModifierAlt === this._altPressed &&
                this.keysHeightOffsetModifierCtrl === this._ctrlPressed &&
                this.keysHeightOffsetModifierShift === this._shiftPressed);
    }

    /**
     * Check if the pressed modifier keys (Alt/Ctrl/Shift) match those configured to
     * allow modification of the rotationOffset value.
     */
    private _modifierRotationOffset(): boolean {
        return (this.keysRotationOffsetModifierAlt === this._altPressed &&
                this.keysRotationOffsetModifierCtrl === this._ctrlPressed &&
                this.keysRotationOffsetModifierShift === this._shiftPressed);
    }

    /**
     * Check if the pressed modifier keys (Alt/Ctrl/Shift) match those configured to
     * allow modification of the radius value.
     */
    private _modifierRadius(): boolean {
        return (this.keysRadiusModifierAlt === this._altPressed &&
                this.keysRadiusModifierCtrl === this._ctrlPressed &&
                this.keysRadiusModifierShift === this._shiftPressed);
    }
}

(<any>CameraInputTypes)["FollowCameraKeyboardMoveInput"] = FollowCameraKeyboardMoveInput;
