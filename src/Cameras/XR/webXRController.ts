import { Observable } from "../../Misc/observable";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Quaternion, Vector3 } from '../../Maths/math.vector';
import { Ray } from '../../Culling/ray';
import { Scene } from '../../scene';
import { WebXRAbstractMotionController } from './motionController/webXRAbstractController';
import { WebXRMotionControllerManager } from './motionController/webXRMotionControllerManager';
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

    private _gamepadMode = false;
    /**
     * If available, this is the gamepad object related to this controller.
     * Using this object it is possible to get click events and trackpad changes of the
     * webxr controller that is currently being used.
     */
    public gamepadController?: WebXRAbstractMotionController;

    /**
     * Event that fires when the controller is removed/disposed
     */
    public onDisposeObservable = new Observable<{}>();

    private _tmpQuaternion = new Quaternion();
    private _tmpVector = new Vector3();

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
        public inputSource: XRInputSource) {
        this.pointer = new AbstractMesh("controllerPointer", scene);
        this.pointer.rotationQuaternion = new Quaternion();

        if (this.inputSource.gripSpace) {
            this.grip = new AbstractMesh("controllerGrip", this.scene);
            this.grip.rotationQuaternion = new Quaternion();
        }

        // for now only load motion controllers if gamepad available
        if (this.inputSource.gamepad) {
            this.gamepadController = WebXRMotionControllerManager.GetMotionControllerWithXRInput(inputSource, scene);
            // if the model is loaded, do your thing
            this.gamepadController.onModelLoadedObservable.addOnce(() => {
                this.gamepadController!.rootMesh!.parent = this.pointer;
            });
        }
    }

    /**
     * Updates the controller pose based on the given XRFrame
     * @param xrFrame xr frame to update the pose with
     * @param referenceSpace reference space to use
     */
    public updateFromXRFrame(xrFrame: XRFrame, referenceSpace: XRReferenceSpace) {
        let pose = xrFrame.getPose(this.inputSource.targetRaySpace, referenceSpace);

        // Update the pointer mesh
        if (pose) {
            this.pointer.position.copyFrom(<any>(pose.transform.position));
            this.pointer.rotationQuaternion!.copyFrom(<any>(pose.transform.orientation));
            if (!this.scene.useRightHandedSystem) {
                this.pointer.position.z *= -1;
                this.pointer.rotationQuaternion!.z *= -1;
                this.pointer.rotationQuaternion!.w *= -1;
            }
        }

        // Update the grip mesh if it exists
        if (this.inputSource.gripSpace && this.grip) {
            let pose = xrFrame.getPose(this.inputSource.gripSpace, referenceSpace);
            if (pose) {
                this.grip.position.copyFrom(<any>(pose.transform.position));
                this.grip.rotationQuaternion!.copyFrom(<any>(pose.transform.orientation));
                if (!this.scene.useRightHandedSystem) {
                    this.grip.position.z *= -1;
                    this.grip.rotationQuaternion!.z *= -1;
                    this.grip.rotationQuaternion!.w *= -1;
                }
            }
        }
        if (this.gamepadController) {
            // either update buttons only or also position, if in gamepad mode
            this.gamepadController.update(xrFrame);
        }
    }

    /**
     * Gets a world space ray coming from the controller
     * @param result the resulting ray
     */
    public getWorldPointerRayToRef(result: Ray) {
        // Force update to ensure picked point is synced with ray
        let worldMatrix = this.pointer.computeWorldMatrix(true);
        worldMatrix.decompose(undefined, this._tmpQuaternion, undefined);
        this._tmpVector.set(0, 0, 1);
        this._tmpVector.rotateByQuaternionToRef(this._tmpQuaternion, this._tmpVector);
        result.origin = this.pointer.absolutePosition;
        result.direction.copyFrom(this._tmpVector);
        result.length = 1000;
    }

    /**
     * Get the scene associated with this controller
     * @returns the scene object
     */
    public getScene() {
        return this.scene;
    }

    /**
     * Disposes of the object
     */
    dispose() {
        if (this.grip) {
            this.grip.dispose();
        }
        if (this.gamepadController && this._gamepadMode) {
            this.gamepadController.dispose();
        }
        this.pointer.dispose();
        this.onDisposeObservable.notifyObservers({});
    }
}