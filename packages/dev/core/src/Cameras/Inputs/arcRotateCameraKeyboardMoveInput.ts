import { type Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { type Observer } from "../../Misc/observable";
import { type Scene } from "../../scene";
import { type ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import { type ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { type KeyboardInfo, KeyboardEventTypes } from "../../Events/keyboardEvents";
import { Tools } from "../../Misc/tools";
import { type AbstractEngine } from "../../Engines/abstractEngine";
import { type KeyboardConditions } from "../cameraInteractions";

/**
 * Manage the keyboard inputs to control the movement of an arc rotate camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class ArcRotateCameraKeyboardMoveInput implements ICameraInput<ArcRotateCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: ArcRotateCamera;

    /**
     * Defines the list of key codes associated with the up action (increase alpha)
     */
    @serialize()
    public keysUp = [38];

    /**
     * Defines the list of key codes associated with the down action (decrease alpha)
     */
    @serialize()
    public keysDown = [40];

    /**
     * Defines the list of key codes associated with the left action (increase beta)
     */
    @serialize()
    public keysLeft = [37];

    /**
     * Defines the list of key codes associated with the right action (decrease beta)
     */
    @serialize()
    public keysRight = [39];

    /**
     * Defines the list of key codes associated with the reset action.
     * Those keys reset the camera to its last stored state (with the method camera.storeState())
     */
    @serialize()
    public keysReset = [220];

    /**
     * Defines the list of key codes associated with the zoom in action.
     * Only used when CameraMovement is active — these keys always trigger zoom regardless of modifiers.
     */
    @serialize()
    public keysZoomIn: number[] = [187, 107]; // 187 = +/= key, 107 = numpad +

    /**
     * Defines the list of key codes associated with the zoom out action.
     * Only used when CameraMovement is active — these keys always trigger zoom regardless of modifiers.
     */
    @serialize()
    public keysZoomOut: number[] = [189, 109]; // 189 = -/_ key, 109 = numpad -

    /**
     * Defines the panning sensibility of the inputs.
     * (How fast is the camera panning)
     */
    @serialize()
    public panningSensibility: number = 50.0;

    /**
     * Defines the zooming sensibility of the inputs.
     * (How fast is the camera zooming)
     */
    @serialize()
    public zoomingSensibility: number = 25.0;

    /**
     * Rotation speed of the camera
     */
    @serialize()
    public angularSpeed = 0.01;

    private _useAltToZoom: boolean = true;

    /**
     * Defines whether alt+arrows/wasd triggers zoom instead of rotation/pan.
     * When disabled, alt+keyboard events are ignored by the zoom inputMap entry.
     * Setting this updates the corresponding inputMap entry on the camera's movement system.
     */
    @serialize()
    public get useAltToZoom(): boolean {
        return this._useAltToZoom;
    }

    public set useAltToZoom(value: boolean) {
        this._useAltToZoom = value;
        if (this.camera?.movement) {
            const inputMap = this.camera.movement.input.inputMap;
            const idx = inputMap.findIndex((e) => e.source === "keyboard" && "modifiers" in e && e.modifiers?.alt === true && e.interaction === "zoom");
            if (!value && idx !== -1) {
                inputMap.splice(idx, 1);
            } else if (value && idx === -1) {
                this.camera.movement.input.addEntry({ source: "keyboard", modifiers: { alt: true }, interaction: "zoom" });
            }
        }
    }

    private _keys = new Array<number>();
    private _ctrlPressed: boolean;
    private _altPressed: boolean;
    private _onCanvasBlurObserver: Nullable<Observer<AbstractEngine>>;
    private _onKeyboardObserver: Nullable<Observer<KeyboardInfo>>;
    private _engine: AbstractEngine;
    private _scene: Scene;

    /** Cached conditions object to avoid per-frame allocations in checkInputs */
    private _keyboardConditions: KeyboardConditions = { modifiers: { ctrl: false, alt: false } };

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(noPreventDefault?: boolean): void {
        // was there a second variable defined?
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);

        if (this._onCanvasBlurObserver) {
            return;
        }

        this._scene = this.camera.getScene();
        this._engine = this._scene.getEngine();

        this._onCanvasBlurObserver = this._engine.onCanvasBlurObservable.add(() => {
            this._keys.length = 0;
        });

        this._onKeyboardObserver = this._scene.onKeyboardObservable.add((info) => {
            const evt = info.event;
            if (!evt.metaKey) {
                if (info.type === KeyboardEventTypes.KEYDOWN) {
                    this._ctrlPressed = evt.ctrlKey;
                    this._altPressed = evt.altKey;

                    if (
                        this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRight.indexOf(evt.keyCode) !== -1 ||
                        this.keysReset.indexOf(evt.keyCode) !== -1 ||
                        this.keysZoomIn.indexOf(evt.keyCode) !== -1 ||
                        this.keysZoomOut.indexOf(evt.keyCode) !== -1
                    ) {
                        const index = this._keys.indexOf(evt.keyCode);

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
                    if (
                        this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRight.indexOf(evt.keyCode) !== -1 ||
                        this.keysReset.indexOf(evt.keyCode) !== -1 ||
                        this.keysZoomIn.indexOf(evt.keyCode) !== -1 ||
                        this.keysZoomOut.indexOf(evt.keyCode) !== -1
                    ) {
                        const index = this._keys.indexOf(evt.keyCode);

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
     */
    public detachControl(): void {
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

        this._keys.length = 0;
    }

    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    public checkInputs(): void {
        if (this._onKeyboardObserver) {
            const camera = this.camera;
            const input = camera.movement.input;

            this._keyboardConditions.modifiers!.ctrl = this._ctrlPressed;
            this._keyboardConditions.modifiers!.alt = this._altPressed;

            for (let index = 0; index < this._keys.length; index++) {
                const keyCode = this._keys[index];

                this._keyboardConditions.key = keyCode;
                const resolved = input.resolveInteraction("keyboard", this._keyboardConditions);

                if (resolved) {
                    // Per-frame impulse magnitude. The inputMap entry's `sensitivity` takes precedence
                    // when set so consumers can tune feel declaratively (and so we can phase out the
                    // legacy sensibility/angularSpeed properties over time). When `sensitivity` is
                    // undefined, fall back to the legacy properties for backward compatibility.
                    if (resolved.interaction === "pan") {
                        const panSens = resolved.sensitivity ?? 1 / this.panningSensibility;
                        if (this.keysLeft.indexOf(keyCode) !== -1) {
                            input.handlers.pan(-panSens, 0);
                        } else if (this.keysRight.indexOf(keyCode) !== -1) {
                            input.handlers.pan(panSens, 0);
                        } else if (this.keysUp.indexOf(keyCode) !== -1) {
                            input.handlers.pan(0, panSens);
                        } else if (this.keysDown.indexOf(keyCode) !== -1) {
                            input.handlers.pan(0, -panSens);
                        }
                    } else if (resolved.interaction === "zoom") {
                        const zoomSens = resolved.sensitivity ?? 1 / this.zoomingSensibility;
                        if (this.keysUp.indexOf(keyCode) !== -1 || this.keysZoomIn.indexOf(keyCode) !== -1) {
                            input.handlers.zoom(zoomSens);
                        } else if (this.keysDown.indexOf(keyCode) !== -1 || this.keysZoomOut.indexOf(keyCode) !== -1) {
                            input.handlers.zoom(-zoomSens);
                        }
                    } else if (resolved.interaction === "rotate") {
                        const rotateSens = resolved.sensitivity ?? this.angularSpeed;
                        if (this.keysLeft.indexOf(keyCode) !== -1) {
                            input.handlers.rotate(-rotateSens, 0);
                        } else if (this.keysRight.indexOf(keyCode) !== -1) {
                            input.handlers.rotate(rotateSens, 0);
                        } else if (this.keysUp.indexOf(keyCode) !== -1) {
                            input.handlers.rotate(0, -rotateSens);
                        } else if (this.keysDown.indexOf(keyCode) !== -1) {
                            input.handlers.rotate(0, rotateSens);
                        }
                    }
                }

                if (this.keysReset.indexOf(keyCode) !== -1) {
                    if (camera.useInputToRestoreState) {
                        camera.restoreState();
                    }
                }
            }
        }
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "ArcRotateCameraKeyboardMoveInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "keyboard";
    }
}

(<any>CameraInputTypes)["ArcRotateCameraKeyboardMoveInput"] = ArcRotateCameraKeyboardMoveInput;
