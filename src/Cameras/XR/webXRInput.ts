import { Nullable } from "../../types";
import { Observer, Observable } from "../../Misc/observable";
import { IDisposable, Scene } from "../../scene";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { WebXRExperienceHelper } from "./webXRExperienceHelper";
import { Matrix, Quaternion } from '../../Maths/math';
/**
 * Represents an XR input
 */
export class WebXRController {
    /**
     * Represents the part of the controller that is held. This may not exist if the controller is the head mounted display itself, if thats the case only the pointer from the head will be availible
     */
    public grip?: AbstractMesh;
    /**
     * Pointer which can be used to select objects or attach a visible laser to
     */
    public pointer: AbstractMesh;

    private _tmpMatrix = new Matrix();

    /**
     * Creates the controller
     * @see https://doc.babylonjs.com/how_to/webxr
     * @param scene the scene which the controller should be associated to
     * @param inputSource the underlying input source for the controller
     * @param parentContainer parent that the controller meshes should be children of
     */
    constructor(
        private scene: Scene,
        /** The underlying input source for the controller  */
        public inputSource: XRInputSource,
        private parentContainer: Nullable<AbstractMesh> = null)
    {
        this.pointer = new AbstractMesh("controllerPointer", scene);
        if (parentContainer) {
            parentContainer.addChild(this.pointer);

        }
    }

    /**
     * Updates the controller pose based on the given XRFrame
     * @param xrFrame xr frame to update the pose with
     * @param referenceSpace reference space to use
     */
    public updateFromXRFrame(xrFrame: XRFrame, referenceSpace: XRReferenceSpace) {
        var pose = xrFrame.getPose(this.inputSource.targetRaySpace, referenceSpace);
        if (pose) {
            Matrix.FromFloat32ArrayToRefScaled(pose.transform.matrix, 0, 1, this._tmpMatrix);
            if (!this.pointer.getScene().useRightHandedSystem) {
                this._tmpMatrix.toggleModelMatrixHandInPlace();
            }
            if (!this.pointer.rotationQuaternion) {
                this.pointer.rotationQuaternion = new Quaternion();
            }
            this._tmpMatrix.decompose(this.pointer.scaling, this.pointer.rotationQuaternion!, this.pointer.position);
        }

        if (this.inputSource.gripSpace) {
            if (!this.grip) {
                this.grip = new AbstractMesh("controllerGrip", this.scene);
                if (this.parentContainer) {
                    this.parentContainer.addChild(this.grip);
                }
            }

            var pose = xrFrame.getPose(this.inputSource.gripSpace, referenceSpace);
            if (pose) {
                Matrix.FromFloat32ArrayToRefScaled(pose.transform.matrix, 0, 1, this._tmpMatrix);
                if (!this.grip.getScene().useRightHandedSystem) {
                    this._tmpMatrix.toggleModelMatrixHandInPlace();
                }
                if (!this.grip.rotationQuaternion) {
                    this.grip.rotationQuaternion = new Quaternion();
                }
                this._tmpMatrix.decompose(this.grip.scaling, this.grip.rotationQuaternion!, this.grip.position);
            }
        }

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
    private _frameObserver: Nullable<Observer<any>>;
    /**
     * Event when a controller has been connected/added
     */
    public onControllerAddedObservable = new Observable<WebXRController>();
    /**
     * Event when a controller has been removed/disconnected
     */
    public onControllerRemovedObservable = new Observable<WebXRController>();

    /**
     * Initializes the WebXRInput
     * @param helper experience helper which the input should be created for
     */
    public constructor(private helper: WebXRExperienceHelper) {
        this._frameObserver = helper.sessionManager.onXRFrameObservable.add(() => {
            if (!helper.sessionManager.currentFrame) {
                return;
            }

            // Start listing to input add/remove event
            if (this.controllers.length == 0 && helper.sessionManager.session.inputSources) {
                this._addAndRemoveControllers(helper.sessionManager.session.inputSources, []);
                helper.sessionManager.session.addEventListener("inputsourceschange", this._onInputSourcesChange);
            }

            // Update controller pose info
            this.controllers.forEach((controller) => {
                controller.updateFromXRFrame(helper.sessionManager.currentFrame!, helper.sessionManager.referenceSpace);
            });

        });
    }

    private _onInputSourcesChange = (event: XRInputSourceChangeEvent) => {
        this._addAndRemoveControllers(event.added, event.removed);
    }

    private _addAndRemoveControllers(addInputs: Array<XRInputSource>, removeInputs: Array<XRInputSource>) {
        // Add controllers if they don't already exist
        var sources = this.controllers.map((c) => {return c.inputSource; });
        addInputs.forEach((input) => {
            if (sources.indexOf(input) === -1) {
                var controller = new WebXRController(this.helper.camera._scene, input, this.helper.container);
                this.controllers.push(controller);
                this.onControllerAddedObservable.notifyObservers(controller);
            }
        });

        // Remove and dispose of controllers to be disposed
        var keepControllers: Array<WebXRController> = [];
        var removedControllers: Array<WebXRController> = [];
        this.controllers.forEach((c) => {
            if (removeInputs.indexOf(c.inputSource) === -1) {
                keepControllers.push(c);
            }else {
                removedControllers.push(c);
            }
        });
        this.controllers = keepControllers;
        removedControllers.forEach((c) => {
            this.onControllerRemovedObservable.notifyObservers(c);
            c.dispose();
        });

    }

    /**
     * Disposes of the object
     */
    public dispose() {
        this.controllers.forEach((c) => {
            c.dispose();
        });
        this.helper.sessionManager.onXRFrameObservable.remove(this._frameObserver);
    }
}