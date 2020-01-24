import { Observable } from "../../Misc/observable";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Quaternion, Vector3 } from '../../Maths/math.vector';
import { Ray } from '../../Culling/ray';
import { Scene } from '../../scene';
import { WebXRAbstractMotionController } from './motionController/webXRAbstractController';
import { WebXRMotionControllerManager } from './motionController/webXRMotionControllerManager';

let idCount = 0;

/**
 * Configuration options for the WebXR controller creation
 */
export interface IWebXRControllerOptions {
    /**
     * Force a specific controller type for this controller.
     * This can be used when creating your own profile or when testing different controllers
     */
    forceControllerProfile?: string;

    /**
     * Do not load the controller mesh, in case a different mesh needs to be loaded.
     */
    doNotLoadControllerMesh?: boolean;

    /**
     * Should the controller mesh be animated when a user interacts with it
     * The pressed buttons / thumbstick and touchpad animations will be disabled
     */
    disableMotionControllerAnimation?: boolean;
}

/**
 * Represents an XR controller
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
    /**
     * If available, this is the gamepad object related to this controller.
     * Using this object it is possible to get click events and trackpad changes of the
     * webxr controller that is currently being used.
     */
    public motionController?: WebXRAbstractMotionController;

    /**
     * Observers registered here will trigger when a motion controller profile was assigned to this xr controller
     */
    public onMotionControllerProfileLoaded = new Observable<WebXRAbstractMotionController>();

    /**
     * Event that fires when the controller is removed/disposed
     */
    public onDisposeObservable = new Observable<{}>();

    private _tmpQuaternion = new Quaternion();
    private _tmpVector = new Vector3();

    private _uniqueId: string;
    /**
     * Creates the controller
     * @see https://doc.babylonjs.com/how_to/webxr
     * @param _scene the scene which the controller should be associated to
     * @param inputSource the underlying input source for the controller
     * @param _options options for this controller creation
     */
    constructor(
        private _scene: Scene,
        /** The underlying input source for the controller  */
        public inputSource: XRInputSource,
        private _options: IWebXRControllerOptions = {}) {
        this._uniqueId = `controller-${idCount++}-${inputSource.targetRayMode}-${inputSource.handedness}`;

        this.pointer = new AbstractMesh(`${this._uniqueId}-pointer`, _scene);
        this.pointer.rotationQuaternion = new Quaternion();

        if (this.inputSource.gripSpace) {
            this.grip = new AbstractMesh(`${this._uniqueId}-grip`, this._scene);
            this.grip.rotationQuaternion = new Quaternion();
        }

        // for now only load motion controllers if gamepad available
        if (this.inputSource.gamepad) {
            WebXRMotionControllerManager.GetMotionControllerWithXRInput(inputSource, _scene, this._options.forceControllerProfile).then((motionController) => {
                this.motionController = motionController;
                this.onMotionControllerProfileLoaded.notifyObservers(motionController);
                // should the model be loaded?
                if (!this._options.doNotLoadControllerMesh) {
                    this.motionController.loadModel().then((success) => {
                        if (success) {
                            this.motionController!.rootMesh!.parent = this.grip || this.pointer;
                            this.motionController!.disableAnimation = !!this._options.disableMotionControllerAnimation;
                        }
                    });
                }
            });
        }
    }

    /**
     * Get this controllers unique id
     */
    public get uniqueId() {
        return this._uniqueId;
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
            if (!this._scene.useRightHandedSystem) {
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
                if (!this._scene.useRightHandedSystem) {
                    this.grip.position.z *= -1;
                    this.grip.rotationQuaternion!.z *= -1;
                    this.grip.rotationQuaternion!.w *= -1;
                }
            }
        }
        if (this.motionController) {
            // either update buttons only or also position, if in gamepad mode
            this.motionController.updateFromXRFrame(xrFrame);
        }
    }

    /**
     * Gets a world space ray coming from the controller
     * @param result the resulting ray
     */
    public getWorldPointerRayToRef(result: Ray) {
        let worldMatrix = this.pointer.computeWorldMatrix();
        worldMatrix.decompose(undefined, this._tmpQuaternion, undefined);
        this._tmpVector.set(0, 0, 1);
        this._tmpVector.rotateByQuaternionToRef(this._tmpQuaternion, this._tmpVector);
        result.origin.copyFrom(this.pointer.absolutePosition);
        result.direction.copyFrom(this._tmpVector);
        result.length = 1000;
    }

    /**
     * Disposes of the object
     */
    dispose() {
        if (this.grip) {
            this.grip.dispose();
        }
        if (this.motionController) {
            this.motionController.dispose();
        }
        this.onMotionControllerProfileLoaded.clear();
        this.pointer.dispose();
        this.onDisposeObservable.notifyObservers({});
    }
}