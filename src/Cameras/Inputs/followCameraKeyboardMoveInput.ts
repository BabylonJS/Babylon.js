import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { FollowCamera } from "../../Cameras/followCamera";
import { serialize } from "../../Misc/decorators";
import { Nullable } from "../../types";
import { Observer } from "../../Misc/observable";
import { Engine } from "../../Engines/engine";
import { KeyboardInfo, KeyboardEventTypes } from "../../Events/keyboardEvents";
import { Scene } from "../../scene";

    /**
     * Manage the keyboard inputs to control the movement of an arc rotate camera.
     * @see http://doc.babylonjs.com/how_to/customizing_camera_inputs
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
        public keysUp = [38];

        /**
         * Defines the list of key codes associated with the down action (decrease heightOffset)
         */
        @serialize()
        public keysDown = [40];

        /**
         * Defines the list of key codes associated with the left action (increase rotation)
         */
        @serialize()
        public keysLeft = [37];

        /**
         * Defines the list of key codes associated with the right action (decrease rotation)
         */
        @serialize()
        public keysRight = [39];

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
         * Defines the minimum radius value.
         */
        @serialize()
        public minRadius: number = 0;

        private _keys = new Array<number>();
        // private _ctrlPressed: boolean;
        private _altPressed: boolean;
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
                        // this._ctrlPressed = evt.ctrlKey;
                        this._altPressed = evt.altKey;

                        if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                            this.keysDown.indexOf(evt.keyCode) !== -1 ||
                            this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                            this.keysRight.indexOf(evt.keyCode) !== -1) {
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
                        if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                            this.keysDown.indexOf(evt.keyCode) !== -1 ||
                            this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                            this.keysRight.indexOf(evt.keyCode) !== -1) {
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
                    if (this.keysLeft.indexOf(keyCode) !== -1) {
                      this.camera.rotationOffset += this.rotationSensibility;
                      this.camera.rotationOffset %= 360;
                    } else if (this.keysUp.indexOf(keyCode) !== -1) {
                      if (this._altPressed) {
                        this.camera.radius += this.radiusSensibility;
                      } else {
                        this.camera.heightOffset += this.heightSensibility;
                      }
                    } else if (this.keysRight.indexOf(keyCode) !== -1) {
                      this.camera.rotationOffset -= this.rotationSensibility;
                      this.camera.rotationOffset %= 360;
                    } else if (this.keysDown.indexOf(keyCode) !== -1) {
                      if (this._altPressed) {
                        this.camera.radius -= this.radiusSensibility;
                        this.camera.radius =
                          Math.max(this.minRadius, this.camera.radius);
                      } else {
                        this.camera.heightOffset -= this.heightSensibility;
                        this.camera.heightOffset =
                          Math.max(this.minHeightOffset, this.camera.heightOffset);
                      }
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
    }

    (<any>CameraInputTypes)["FollowCameraKeyboardMoveInput"] = FollowCameraKeyboardMoveInput;
