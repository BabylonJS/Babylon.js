import { serialize } from "../../Misc/decorators";
import { Observer } from "../../Misc/observable";
import { Nullable } from "../../types";
import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { FreeCamera } from "../../Cameras/freeCamera";
import { KeyboardInfo, KeyboardEventTypes } from "../../Events/keyboardEvents";
import { Scene } from "../../scene";
import { Vector3 } from "../../Maths/math.vector";
import { Engine } from "../../Engines/engine";
/**
 * Manage the keyboard inputs to control the movement of a free camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FreeCameraKeyboardMoveInput implements ICameraInput<FreeCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FreeCamera;

    /**
     * Gets or Set the list of keyboard keys used to control the forward move of the camera.
     */
    @serialize()
    public keysUp = [38];

    /**
     * Gets or Set the list of keyboard keys used to control the upward move of the camera.
     */
    @serialize()
    public keysUpward = [33];

    /**
     * Gets or Set the list of keyboard keys used to control the backward move of the camera.
     */
    @serialize()
    public keysDown = [40];

    /**
     * Gets or Set the list of keyboard keys used to control the downward move of the camera.
     */
    @serialize()
    public keysDownward = [34];

    /**
     * Gets or Set the list of keyboard keys used to control the left strafe move of the camera.
     */
    @serialize()
    public keysLeft = [37];

    /**
     * Gets or Set the list of keyboard keys used to control the right strafe move of the camera.
     */
    @serialize()
    public keysRight = [39];

    private _keys = new Array<number>();
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
                    if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRight.indexOf(evt.keyCode) !== -1 ||
                        this.keysUpward.indexOf(evt.keyCode) !== -1 ||
                        this.keysDownward.indexOf(evt.keyCode) !== -1) {
                        var index = this._keys.indexOf(evt.keyCode);

                        if (index === -1) {
                            this._keys.push(evt.keyCode);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                } else {
                    if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRight.indexOf(evt.keyCode) !== -1 ||
                        this.keysUpward.indexOf(evt.keyCode) !== -1 ||
                        this.keysDownward.indexOf(evt.keyCode) !== -1) {
                        var index = this._keys.indexOf(evt.keyCode);

                        if (index >= 0) {
                            this._keys.splice(index, 1);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
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
    public detachControl(element: Nullable<HTMLElement>): void {
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
            var camera = this.camera;
            // Keyboard
            for (var index = 0; index < this._keys.length; index++) {
                var keyCode = this._keys[index];
                var speed = camera._computeLocalCameraSpeed();

                if (this.keysLeft.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(-speed, 0, 0);
                } else if (this.keysUp.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, 0, speed);
                } else if (this.keysRight.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(speed, 0, 0);
                } else if (this.keysDown.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, 0, -speed);
                } else if (this.keysUpward.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, speed, 0);
                } else if (this.keysDownward.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, -speed, 0);
                }

                if (camera.getScene().useRightHandedSystem) {
                    camera._localDirection.z *= -1;
                }

                camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
                Vector3.TransformNormalToRef(camera._localDirection, camera._cameraTransformMatrix, camera._transformedDirection);
                camera.cameraDirection.addInPlace(camera._transformedDirection);
            }
        }
    }

    /**
     * Gets the class name of the current intput.
     * @returns the class name
     */
    public getClassName(): string {
        return "FreeCameraKeyboardMoveInput";
    }

    /** @hidden */
    public _onLostFocus(): void {
        this._keys = [];
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "keyboard";
    }
}

(<any>CameraInputTypes)["FreeCameraKeyboardMoveInput"] = FreeCameraKeyboardMoveInput;
