import { type Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { type Observer } from "../../Misc/observable";
import { type Scene } from "../../scene";
import { type ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import { type ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { type KeyboardInfo, KeyboardEventTypes } from "../../Events/keyboardEvents";
import { Tools } from "../../Misc/tools.pure";
import { type AbstractEngine } from "../../Engines/abstractEngine";
import { type KeyboardConditions } from "../inputMapper";
import { Vector2 } from "../../Maths/math.vector.pure";

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
     * If set before the camera is attached, the value is cached and applied during `attachControl`.
     */
    @serialize()
    public get useAltToZoom(): boolean {
        return this._useAltToZoom;
    }

    public set useAltToZoom(value: boolean) {
        this._useAltToZoom = value;
        this._applyUseAltToZoomToInputMap();
    }

    /**
     * Applies the cached `_useAltToZoom` value to the camera's inputMap.
     * Safe to call before the camera is attached: it is a no-op until `this.camera.movement` is available.
     * Idempotent — calling it when the inputMap already matches the cached value is a no-op.
     */
    private _applyUseAltToZoomToInputMap(): void {
        if (!this.camera?.movement) {
            return;
        }
        const input = this.camera.movement.input;
        const entry = input.getEntry("keyboard", "zoom", { modifiers: { alt: true } });
        if (!this._useAltToZoom && entry) {
            input.inputMap.splice(input.inputMap.indexOf(entry), 1);
        } else if (this._useAltToZoom && !entry) {
            input.addEntry({ source: "keyboard", modifiers: { alt: true }, interaction: "zoom" });
        }
    }

    private _keys = new Array<number>();
    private _ctrlPressed: boolean;
    private _altPressed: boolean;
    private _onCanvasBlurObserver: Nullable<Observer<AbstractEngine>>;
    private _onKeyboardObserver: Nullable<Observer<KeyboardInfo>>;
    private _engine: AbstractEngine;
    private _scene: Scene;

    /**
     * Modifier state stored separately from `_keyboardConditions` so it can be typed as a
     * concrete (non-optional) object. This avoids non-null assertions when updating modifier
     * fields each frame, and the conditions object holds the same reference so
     * resolveInteraction sees the live state.
     */
    private _keyboardModifiers: { ctrl: boolean; alt: boolean } = { ctrl: false, alt: false };

    /** Cached conditions object to avoid per-frame allocations in checkInputs */
    private _keyboardConditions: KeyboardConditions = { modifiers: this._keyboardModifiers };

    /** Reused accumulators for the per-frame keyboard rotate/pan directions, to avoid per-frame allocations */
    private _rotateDirection = new Vector2();
    private _panDirection = new Vector2();

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

        this._applyUseAltToZoomToInputMap();

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

            this._keyboardModifiers.ctrl = this._ctrlPressed;
            this._keyboardModifiers.alt = this._altPressed;

            // Rotate and pan directions are accumulated across keys and applied once below (normalized), so
            // holding two directions at once (e.g. up + left) moves along a normalized diagonal at the same
            // speed as a single direction, instead of the ~1.41x boost (sqrt(2)) that results from applying
            // each key independently. Zoom is one-dimensional and is applied per key.
            const rotateDirection = this._rotateDirection.set(0, 0);
            const panDirection = this._panDirection.set(0, 0);
            let rotateSensitivity = 0;
            let panSensitivity = 0;

            for (let index = 0; index < this._keys.length; index++) {
                const keyCode = this._keys[index];

                this._keyboardConditions.key = keyCode;

                // Skip resolveInteraction for the reset key — it has no inputMap entry of its own
                // and would otherwise spuriously match the catch-all keyboard→rotate entry.
                if (this.keysReset.indexOf(keyCode) === -1) {
                    const resolved = input.resolveInteraction("keyboard", this._keyboardConditions);

                    if (resolved) {
                        // Per-frame impulse magnitude. The inputMap entry's `sensitivity` takes precedence
                        // when set so consumers can tune feel declaratively (and so we can phase out the
                        // legacy sensibility/angularSpeed properties over time). When `sensitivity` is
                        // undefined, fall back to the legacy properties for backward compatibility.
                        if (resolved.interaction === "pan") {
                            // Accumulate a unit direction per pan key; the combined vector is normalized after the loop.
                            panSensitivity = resolved.sensitivity ?? 1 / this.panningSensibility;
                            if (this.keysLeft.indexOf(keyCode) !== -1) {
                                panDirection.x -= 1;
                            } else if (this.keysRight.indexOf(keyCode) !== -1) {
                                panDirection.x += 1;
                            } else if (this.keysUp.indexOf(keyCode) !== -1) {
                                panDirection.y += 1;
                            } else if (this.keysDown.indexOf(keyCode) !== -1) {
                                panDirection.y -= 1;
                            }
                        } else if (resolved.interaction === "zoom") {
                            const zoomSens = resolved.sensitivity ?? 1 / this.zoomingSensibility;
                            if (this.keysUp.indexOf(keyCode) !== -1 || this.keysZoomIn.indexOf(keyCode) !== -1) {
                                input.handlers.zoom(zoomSens);
                            } else if (this.keysDown.indexOf(keyCode) !== -1 || this.keysZoomOut.indexOf(keyCode) !== -1) {
                                input.handlers.zoom(-zoomSens);
                            }
                        } else if (resolved.interaction === "rotate") {
                            // Accumulate a unit direction per rotate key; the combined vector is normalized after the loop.
                            rotateSensitivity = resolved.sensitivity ?? this.angularSpeed;
                            if (this.keysLeft.indexOf(keyCode) !== -1) {
                                rotateDirection.x -= 1;
                            } else if (this.keysRight.indexOf(keyCode) !== -1) {
                                rotateDirection.x += 1;
                            } else if (this.keysUp.indexOf(keyCode) !== -1) {
                                rotateDirection.y -= 1;
                            } else if (this.keysDown.indexOf(keyCode) !== -1) {
                                rotateDirection.y += 1;
                            }
                        }
                    }
                }

                if (this.keysReset.indexOf(keyCode) !== -1) {
                    if (camera.useInputToRestoreState) {
                        camera.restoreState();
                    }
                }
            }

            // Apply the accumulated rotate/pan once, normalized so a diagonal isn't faster than an axis-aligned move.
            if (rotateDirection.x !== 0 || rotateDirection.y !== 0) {
                rotateDirection.normalize().scaleInPlace(rotateSensitivity);
                input.handlers.rotate(rotateDirection.x, rotateDirection.y);
            }
            if (panDirection.x !== 0 || panDirection.y !== 0) {
                panDirection.normalize().scaleInPlace(panSensitivity);
                input.handlers.pan(panDirection.x, panDirection.y);
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
