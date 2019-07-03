import { Nullable } from "../../types";
import { Observable } from "../../Misc/observable";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Matrix, Quaternion, Vector3 } from '../../Maths/math';
import { Ray } from '../../Culling/ray';
import { Scene } from '../../scene';
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

    public onDisposeObservable = new Observable<{}>();

    private _tmpMatrix = new Matrix();
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
        public inputSource: XRInputSource,
        private parentContainer: Nullable<AbstractMesh> = null)
    {
        this.pointer = new AbstractMesh("controllerPointer", scene);
        if (parentContainer) {
            parentContainer.addChild(this.pointer);
        }

        if (this.inputSource.gripSpace) {
            this.grip = new AbstractMesh("controllerGrip", this.scene);
            if (this.parentContainer) {
                this.parentContainer.addChild(this.grip);
            }
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
            Matrix.FromFloat32ArrayToRefScaled(pose.transform.matrix, 0, 1, this._tmpMatrix);
            if (!this.pointer.getScene().useRightHandedSystem) {
                this._tmpMatrix.toggleModelMatrixHandInPlace();
            }
            if (!this.pointer.rotationQuaternion) {
                this.pointer.rotationQuaternion = new Quaternion();
            }
            this._tmpMatrix.decompose(this.pointer.scaling, this.pointer.rotationQuaternion!, this.pointer.position);
        }

        // Update the grip mesh if it exists
        if (this.inputSource.gripSpace && this.grip) {
            let pose = xrFrame.getPose(this.inputSource.gripSpace, referenceSpace);
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
     * Gets a world space ray coming from the controller
     * @param result the resulting ray
     */
    public getWorldPointerRayToRef(result:Ray){
        // Force update to ensure picked point is synced with ray
        let worldMatrix = this.pointer.computeWorldMatrix(true)
        worldMatrix.decompose(undefined, this._tmpQuaternion, undefined)
        this._tmpVector.set(0,0,1)
        this._tmpVector.rotateByQuaternionToRef(this._tmpQuaternion, this._tmpVector)
        result.origin = this.pointer.absolutePosition
        result.direction.copyFrom(this._tmpVector)
        result.length = 1000;
        return result;
    }

    /**
     * Disposes of the object
     */
    dispose() {
        if (this.grip) {
            this.grip.dispose();
        }
        this.pointer.dispose();
        this.onDisposeObservable.notifyObservers({});
    }
}