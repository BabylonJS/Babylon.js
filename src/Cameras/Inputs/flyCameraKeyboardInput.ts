import { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { Observer } from "../../Misc/observable";
import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { FlyCamera } from "../../Cameras/flyCamera";
import { Engine } from "../../Engines/engine";
import { KeyboardInfo, KeyboardEventTypes } from "../../Events/keyboardEvents";
import { Scene } from "../../scene";
import { Vector3 } from "../../Maths/math.vector";

/**
 * Listen to keyboard events to control the camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FlyCameraKeyboardInput implements ICameraInput<FlyCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FlyCamera;

    /**
     * The list of keyboard keys used to control the forward move of the camera.
     */
    @serialize()
    public keysForward = [87];

    /**
     * The list of keyboard keys used to control the backward move of the camera.
     */
    @serialize()
    public keysBackward = [83];

    /**
     * The list of keyboard keys used to control the forward move of the camera.
     */
    @serialize()
    public keysUp = [69];

    /**
     * The list of keyboard keys used to control the backward move of the camera.
     */
    @serialize()
    public keysDown = [81];

    /**
     * The list of keyboard keys used to control the right strafe move of the camera.
     */
    @serialize()
    public keysRight = [68];

    /**
     * The list of keyboard keys used to control the left strafe move of the camera.
     */
    @serialize()
    public keysLeft = [65];

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

            if (info.type === KeyboardEventTypes.KEYDOWN) {
                if (this.keysForward.indexOf(evt.keyCode) !== -1 ||
                    this.keysBackward.indexOf(evt.keyCode) !== -1 ||
                    this.keysUp.indexOf(evt.keyCode) !== -1 ||
                    this.keysDown.indexOf(evt.keyCode) !== -1 ||
                    this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    this.keysRight.indexOf(evt.keyCode) !== -1) {
                    var index = this._keys.indexOf(evt.keyCode);

                    if (index === -1) {
                        this._keys.push(evt.keyCode);
                    }
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
            } else {
                if (this.keysForward.indexOf(evt.keyCode) !== -1 ||
                    this.keysBackward.indexOf(evt.keyCode) !== -1 ||
                    this.keysUp.indexOf(evt.keyCode) !== -1 ||
                    this.keysDown.indexOf(evt.keyCode) !== -1 ||
                    this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    this.keysRight.indexOf(evt.keyCode) !== -1) {
                    var index = this._keys.indexOf(evt.keyCode);

                    if (index >= 0) {
                        this._keys.splice(index, 1);
                    }
                    if (!noPreventDefault) {
                        evt.preventDefault();
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
     * Gets the class name of the current intput.
     * @returns the class name
     */
    public getClassName(): string {
        return "FlyCameraKeyboardInput";
    }

    /** @hidden */
    public _onLostFocus(e: FocusEvent): void {
        this._keys = [];
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "keyboard";
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

                if (this.keysForward.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, 0, speed);
                } else
                    if (this.keysBackward.indexOf(keyCode) !== -1) {
                        camera._localDirection.copyFromFloats(0, 0, -speed);
                    } else
                        if (this.keysUp.indexOf(keyCode) !== -1) {
                            camera._localDirection.copyFromFloats(0, speed, 0);
                        } else
                            if (this.keysDown.indexOf(keyCode) !== -1) {
                                camera._localDirection.copyFromFloats(0, -speed, 0);
                            } else
                                if (this.keysRight.indexOf(keyCode) !== -1) {
                                    camera._localDirection.copyFromFloats(speed, 0, 0);
                                } else
                                    if (this.keysLeft.indexOf(keyCode) !== -1) {
                                        camera._localDirection.copyFromFloats(-speed, 0, 0);
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
}

(<any>CameraInputTypes)["FlyCameraKeyboardInput"] = FlyCameraKeyboardInput;
