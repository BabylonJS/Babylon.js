import type { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import type { Observer } from "../../Misc/observable";
import type { Scene } from "../../scene";
import type { GeospatialCamera } from "../geospatialCamera";
import type { ICameraInput } from "../cameraInputsManager";
import { CameraInputTypes } from "../cameraInputsManager";
import type { KeyboardInfo } from "../../Events/keyboardEvents";
import { KeyboardEventTypes } from "../../Events/keyboardEvents";
import { Tools } from "../../Misc/tools";
import type { AbstractEngine } from "../../Engines/abstractEngine";

/**
 * Manage the keyboard inputs to control the movement of a geospatial camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class GeospatialCameraKeyboardInput implements ICameraInput<GeospatialCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: GeospatialCamera;

    /**
     * Defines the list of key codes associated with the up action (pan up)
     */
    @serialize()
    public keysUp = [38];

    /**
     * Defines the list of key codes associated with the down action (pan down)
     */
    @serialize()
    public keysDown = [40];

    /**
     * Defines the list of key codes associated with the left action (pan left)
     */
    @serialize()
    public keysLeft = [37];

    /**
     * Defines the list of key codes associated with the right action (pan right)
     */
    @serialize()
    public keysRight = [39];

    /**
     * Defines the list of key codes associated with zoom in (+ or =)
     */
    @serialize()
    public keysZoomIn = [187, 107]; // 187 = + key, 107 = numpad +

    /**
     * Defines the list of key codes associated with zoom out (-)
     */
    @serialize()
    public keysZoomOut = [189, 109]; // 189 = - key, 109 = numpad -

    /**
     * Defines the rotation sensitivity of the inputs.
     * (How many pixels of pointer input to apply per keypress, before rotation speed factor is applied by movement class)
     */
    @serialize()
    public rotationSensitivity = 1.0;

    /**
     * Defines the panning sensitivity of the inputs.
     * (How many pixels of pointer input to apply per keypress, before pan speed factor is applied by movement class)
     */
    @serialize()
    public panSensitivity: number = 1.0;

    /**
     * Defines the zooming sensitivity of the inputs.
     * (How many pixels of pointer input to apply per keypress, before zoom speed factor is applied by movement class)
     */
    @serialize()
    public zoomSensitivity: number = 1.0;

    private _keys = new Array<number>();
    private _ctrlPressed: boolean;
    private _onCanvasBlurObserver: Nullable<Observer<AbstractEngine>>;
    private _onKeyboardObserver: Nullable<Observer<KeyboardInfo>>;
    private _engine: AbstractEngine;
    private _scene: Scene;

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

                    if (
                        this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRight.indexOf(evt.keyCode) !== -1 ||
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
            this._onKeyboardObserver?.remove();
            this._onKeyboardObserver = null;
            this._onCanvasBlurObserver?.remove();
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

            for (let index = 0; index < this._keys.length; index++) {
                const keyCode = this._keys[index];
                if (this._ctrlPressed) {
                    // Rotation
                    if (this.keysLeft.indexOf(keyCode) !== -1) {
                        camera.movement.rotationAccumulatedPixels.y -= this.rotationSensitivity;
                    } else if (this.keysRight.indexOf(keyCode) !== -1) {
                        camera.movement.rotationAccumulatedPixels.y += this.rotationSensitivity;
                    } else if (this.keysUp.indexOf(keyCode) !== -1) {
                        camera.movement.rotationAccumulatedPixels.x -= this.rotationSensitivity;
                    } else if (this.keysDown.indexOf(keyCode) !== -1) {
                        camera.movement.rotationAccumulatedPixels.x += this.rotationSensitivity;
                    }
                } else {
                    // Zoom
                    if (this.keysZoomIn.indexOf(keyCode) !== -1) {
                        camera.movement.handleZoom(this.zoomSensitivity, false);
                    } else if (this.keysZoomOut.indexOf(keyCode) !== -1) {
                        camera.movement.handleZoom(-this.zoomSensitivity, false);
                    } else {
                        // Call into movement class handleDrag so that behavior matches that of pointer input, simulating drag from center of screen.
                        // getRenderWidth/Height return render buffer pixels (scaled by hardwareScalingLevel relative to CSS pixels),
                        // but the picking logic (scene.pick via CreatePickingRayToRef) expects CSS pixels (it divides by hardwareScalingLevel internally).
                        const hardwareScaling = this._engine.getHardwareScalingLevel();
                        const centerX = (this._engine.getRenderWidth() / 2) * hardwareScaling;
                        const centerY = (this._engine.getRenderHeight() / 2) * hardwareScaling;
                        camera.movement.startDrag(centerX, centerY);
                        if (this.keysLeft.indexOf(keyCode) !== -1) {
                            camera.movement.handleDrag(centerX + this.panSensitivity, centerY);
                        } else if (this.keysRight.indexOf(keyCode) !== -1) {
                            camera.movement.handleDrag(centerX - this.panSensitivity, centerY);
                        } else if (this.keysUp.indexOf(keyCode) !== -1) {
                            camera.movement.handleDrag(centerX, centerY + this.panSensitivity);
                        } else if (this.keysDown.indexOf(keyCode) !== -1) {
                            camera.movement.handleDrag(centerX, centerY - this.panSensitivity);
                        }
                        camera.movement.stopDrag();
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
        return "GeospatialCameraKeyboardInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "keyboard";
    }
}

(<any>CameraInputTypes)["GeospatialCameraKeyboardInput"] = GeospatialCameraKeyboardInput;
