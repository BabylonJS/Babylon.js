import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { FollowCamera } from "../../Cameras/followCamera";
import { serialize } from "../../Misc/decorators";
import { Nullable } from "../../types";
import { Observer } from "../../Misc/observable";
import { Engine } from "../../Engines/engine";
import { KeyboardInfo, KeyboardEventTypes } from "../../Events/keyboardEvents";
import { Scene } from "../../scene";

/**
 * Track which combination of modifier keys are pressed.
 */
export enum ModifierKey {
    None,
    Alt,
    Ctrl,
    Shift,
    AltCtrl,
    AltCtrlShift,
    AltShift,
    CtrlShift
}

/**
 * Manage the keyboard inputs to control the movement of an arc rotate camera.
 * @see http://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FollowCameraKeyboardMoveInput implements ICameraInput<FollowCamera> {
    /**
     * Possible combinations of modifierKeys.
     * Used to assign values to keysHeightOffsetModifier, keysRotateOffsetModifier
     * and keysRadiusModifier.
     */
    public readonly modifierKey = ModifierKey;

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
     * Defines whether any modifier key is required to move up/down (alter heightOffset)
     */
    @serialize()
    public keysHeightOffsetModifier: ModifierKey = this.modifierKey.None;

    /**
     * Defines the list of key codes associated with the left action (increase rotationOffset)
     */
    @serialize()
    public keysRotateOffsetIncr = [37];

    /**
     * Defines the list of key codes associated with the right action (decrease rotationOffset)
     */
    @serialize()
    public keysRotateOffsetDecr = [39];

    /**
     * Defines whether any modifier key is required to move up/down (alter heightOffset)
     */
    @serialize()
    public keysRotateOffsetModifier: ModifierKey = this.modifierKey.None;

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
     * Defines whether any modifier key is required to zoom in/out (alter radius value)
     */
    @serialize()
    public keysRadiusModifier: ModifierKey = this.modifierKey.Alt;

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

    /**
     * Defines the minimum heightOffset value.
     */
    @serialize()
    public minHeightOffset: number = 0;

    /**
     * Defines the maximum heightOffset value.
     */
    @serialize()
    public maxHeightOffset: number = 1000;

    /**
     * Defines the minimum radius value.
     */
    @serialize()
    public minRadius: number = 0;

    /**
     * Defines the maximum radius value.
     */
    @serialize()
    public maxRadius: number = 1000;

    /**
     * Defines the minimum rotationOffset value.
     */
    @serialize()
    public minRotationOffset: number = -360;

    /**
     * Defines the maximum rotationOffset value.
     */
    @serialize()
    public maxRotationOffset: number = 360;

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
                        this.keysRotateOffsetIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotateOffsetDecr.indexOf(evt.keyCode) !== -1 ||
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
                }
                else {
                    if (this.keysHeightOffsetIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysHeightOffsetDecr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotateOffsetIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotateOffsetDecr.indexOf(evt.keyCode) !== -1 ||
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
            for (var index = 0; index < this._keys.length; index++) {
                var keyCode = this._keys[index];
                var modifierHeightOffset = this._checkModifierKey(this.keysHeightOffsetModifier);
                var modifierRotationOffset = this._checkModifierKey(this.keysRotateOffsetModifier);
                var modifierRaduis = this._checkModifierKey(this.keysRadiusModifier);

                if (this.keysHeightOffsetIncr.indexOf(keyCode) !== -1 && modifierHeightOffset) {
                    this.camera.heightOffset += this.heightSensibility;
                    this.camera.heightOffset =
                        Math.min(this.maxHeightOffset, this.camera.heightOffset);
                } else if (this.keysHeightOffsetDecr.indexOf(keyCode) !== -1 && modifierHeightOffset) {
                    this.camera.heightOffset -= this.heightSensibility;
                    this.camera.heightOffset =
                        Math.max(this.minHeightOffset, this.camera.heightOffset);
                } else if (this.keysRotateOffsetIncr.indexOf(keyCode) !== -1 && modifierRotationOffset) {
                    this.camera.rotationOffset += this.rotationSensibility;
                    this.camera.rotationOffset %= 360;
                    this.camera.rotationOffset =
                        Math.min(this.maxRotationOffset, this.camera.rotationOffset);
                } else if (this.keysRotateOffsetDecr.indexOf(keyCode) !== -1 && modifierRotationOffset) {
                    this.camera.rotationOffset -= this.rotationSensibility;
                    this.camera.rotationOffset %= 360;
                    this.camera.rotationOffset =
                        Math.max(this.minRotationOffset, this.camera.rotationOffset);
                } else if (this.keysRadiusIncr.indexOf(keyCode) !== -1 && modifierRaduis) {
                    this.camera.radius += this.radiusSensibility;
                    this.camera.radius =
                        Math.min(this.maxRadius, this.camera.radius);
                } else if (this.keysRadiusDecr.indexOf(keyCode) !== -1 && modifierRaduis) {
                    this.camera.radius -= this.radiusSensibility;
                    this.camera.radius =
                        Math.max(this.minRadius, this.camera.radius);
                }
            }
        }
    }

    /**
     * Gets the class name of the current intput.
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

    private _checkModifierKey(expected: ModifierKey) : boolean {
        let returnVal = false;
        switch(expected) {
            case ModifierKey.None:
              returnVal = !this._altPressed && !this._ctrlPressed && !this._shiftPressed;
              break;
            case ModifierKey.Alt:
              returnVal = this._altPressed && !this._ctrlPressed && !this._shiftPressed;
              break;
            case ModifierKey.Ctrl:
              returnVal = !this._altPressed && this._ctrlPressed && !this._shiftPressed;
              break;
            case ModifierKey.Shift:
              returnVal = !this._altPressed && !this._ctrlPressed && this._shiftPressed;
              break;
            case ModifierKey.AltCtrl:
              returnVal = this._altPressed && this._ctrlPressed && !this._shiftPressed;
              break;
            case ModifierKey.AltShift:
              returnVal = this._altPressed && !this._ctrlPressed && this._shiftPressed;
              break;
            case ModifierKey.CtrlShift:
              returnVal = !this._altPressed && this._ctrlPressed && this._shiftPressed;
              break;
            case ModifierKey.AltCtrlShift:
              returnVal = this._altPressed && this._ctrlPressed && this._shiftPressed;
              break;
        }
        return returnVal;
    }
}

(<any>CameraInputTypes)["FollowCameraKeyboardMoveInput"] = FollowCameraKeyboardMoveInput;
