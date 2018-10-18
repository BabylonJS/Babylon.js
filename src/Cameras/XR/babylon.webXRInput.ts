module BABYLON {
    /**
     * Represents an XR input
     */
    export class WebXRController {
        /**
         * Represents the part of the controller that is held. This may not exist if the controller is the head mounted display itself, if thats the case only the pointer from the head will be availible
         */
        public grip?: BABYLON.AbstractMesh;
        /**
         * Pointer which can be used to select objects or attach a visible laser to
         */
        public pointer: BABYLON.AbstractMesh;

        /**
         * Creates the controller
         * @see https://doc.babylonjs.com/how_to/webxr
         * @param scene the scene which the controller should be associated to
         */
        constructor(scene: BABYLON.Scene) {
            this.pointer = new BABYLON.AbstractMesh("controllerPointer", scene);
        }
        /**
         * Disposes of the object
         */
        dispose() {
            if (this.grip) {
                this.grip.dispose();
            }
            this.pointer.dispose();
        }
    }

    /**
     * XR input used to track XR inputs such as controllers/rays
     */
    export class WebXRInput implements IDisposable {
        /**
         * XR controllers being tracked
         */
        public controllers: Array<WebXRController> = [];
        private _tmpMatrix = new BABYLON.Matrix();
        private _frameObserver: Nullable<Observer<any>>;

        /**
         * Initializes the WebXRInput
         * @param helper experience helper which the input should be created for
         */
        public constructor(private helper: WebXRExperienceHelper) {
            this._frameObserver = helper._sessionManager.onXRFrameObservable.add(() => {
                if (!helper._sessionManager._currentXRFrame || !helper._sessionManager._currentXRFrame.getDevicePose) {
                    return;
                }

                var xrFrame = helper._sessionManager._currentXRFrame;
                var inputSources = helper._sessionManager._xrSession.getInputSources();

                inputSources.forEach((input, i) => {
                    let inputPose = xrFrame.getInputPose(input, helper._sessionManager._frameOfReference);
                    if (inputPose) {
                        if (this.controllers.length <= i) {
                            this.controllers.push(new WebXRController(helper.container.getScene()));
                        }
                        var controller = this.controllers[i];

                        // Manage the grip if it exists
                        if (inputPose.gripMatrix) {
                            if (!controller.grip) {
                                controller.grip = new BABYLON.AbstractMesh("controllerGrip", helper.container.getScene());
                            }
                            BABYLON.Matrix.FromFloat32ArrayToRefScaled(inputPose.gripMatrix, 0, 1, this._tmpMatrix);
                            if (!controller.grip.getScene().useRightHandedSystem) {
                                this._tmpMatrix.toggleModelMatrixHandInPlace();
                            }
                            if (!controller.grip.rotationQuaternion) {
                                controller.grip.rotationQuaternion = new BABYLON.Quaternion();
                            }
                            this._tmpMatrix.decompose(controller.grip.scaling, controller.grip.rotationQuaternion, controller.grip.position);
                        }

                        // Manager pointer of controller
                        BABYLON.Matrix.FromFloat32ArrayToRefScaled(inputPose.targetRay.transformMatrix, 0, 1, this._tmpMatrix);
                        if (!controller.pointer.getScene().useRightHandedSystem) {
                            this._tmpMatrix.toggleModelMatrixHandInPlace();
                        }
                        if (!controller.pointer.rotationQuaternion) {
                            controller.pointer.rotationQuaternion = new BABYLON.Quaternion();
                        }
                        this._tmpMatrix.decompose(controller.pointer.scaling, controller.pointer.rotationQuaternion, controller.pointer.position);
                    }
                });
            });
        }
        /**
         * Disposes of the object
         */
        public dispose() {
            this.controllers.forEach((c) => {
                c.dispose();
            });
            this.helper._sessionManager.onXRFrameObservable.remove(this._frameObserver);
        }
    }
}