import { Behavior } from "../behavior";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { Observer } from "../../Misc";
import { Camera } from "../../Cameras/camera";
import { Matrix, Quaternion, Vector3 } from "../../Maths/math.vector";

/**
 * A behavior that when attached to a mesh will allow the mesh to fade in and out
 */
export class FollowBehavior implements Behavior<AbstractMesh> {
    private _scene: Scene;
    private _tmpVector: Vector3 = new Vector3();
    private _tmpQuaternion: Quaternion = new Quaternion();
    private _tmpMatrix: Matrix = new Matrix();

    public attachedNode: Nullable<AbstractMesh>;
    public followDistance = 5;

    private _followedCamera: Nullable<Camera>;
    private _onFollowedCameraMatrixChanged: Nullable<Observer<Camera>>;

    public get followedCamera(): Nullable<Camera> {
        return this._followedCamera;
    }

    public set followedCamera(camera: Nullable<Camera>) {
        if (this._followedCamera) {
            this._removeObservables(this._followedCamera);
        }
        if (camera) {
            this._addObservables(camera);
        }

        this._followedCamera = camera;
    }

    /**
     *  The name of the behavior
     */
    public get name(): string {
        return "Follow";
    }

    /**
     *  Initializes the behavior
     */
    public init() {}

    /**
     * Attaches the follow behavior
     * @param ownerNode The mesh that will be following once attached
     */
    public attach(ownerNode: AbstractMesh, followedCamera?: Camera): void {
        this._scene = ownerNode.getScene();
        this.attachedNode = ownerNode;

        this.followedCamera = followedCamera || this._scene.activeCamera;
    }
    /**
     *  Detaches the behavior from the mesh
     */
    public detach(): void {
        this.attachedNode = null;
    }

    // Constraints
    private _distanceClamp(mesh: AbstractMesh, camera: Camera) {
        const cameraPosition = camera.globalPosition;
        this._tmpMatrix.copyFrom(mesh.computeWorldMatrix(true));
        this._tmpVector.copyFromFloats(0, 0, 0);

        Vector3.TransformCoordinatesToRef(this._tmpVector, this._tmpMatrix, this._tmpVector);

        this._tmpVector.subtractInPlace(cameraPosition);
        const norm = this._tmpVector.length();
        if (norm < 1e-5) {
            return;
        }

        this._tmpVector.scaleInPlace(this.followDistance / norm);
        this._tmpVector.addInPlace(cameraPosition);

        mesh.position.copyFrom(this._tmpVector);
        // todo : handle parent if mesh is parented
    }

    private _correctAngles(vector: Vector3, horizontal: number, vertical: number, radius: number) {
        vector.copyFromFloats(radius * Math.cos(horizontal) * Math.sin(vertical), radius * Math.cos(vertical), radius * Math.sin(horizontal) * Math.sin(vertical));
    }

    private _angularClamp(mesh: AbstractMesh, camera: Camera) {
        const verticalFovFixed = camera.fovMode === Camera.FOVMODE_VERTICAL_FIXED;
        const horizontalAngularClamp = verticalFovFixed ? (this._scene.getEngine().getAspectRatio(camera) * camera.fov) / 2 : camera.fov / 2;
        const verticalAngularClamp = verticalFovFixed ? camera.fov / 2 : camera.fov / this._scene.getEngine().getAspectRatio(camera) / 2;

        const localPosition = new Vector3(0, 0, 0);
        Vector3.TransformCoordinatesToRef(localPosition, mesh.computeWorldMatrix(true), localPosition);
        Vector3.TransformCoordinatesToRef(localPosition, camera.getViewMatrix(), localPosition);
        const dist = localPosition.length();

        if (dist < 1e-5) {
            return;
        }

        const horizontalRotation = Math.atan2(localPosition.x, localPosition.z);
        const verticalRotation = Math.atan2(localPosition.y, Math.sqrt(localPosition.x * localPosition.x + localPosition.z * localPosition.z));

        let deltaVerticalRotation = 0;
        let deltaHorizontalRotation = 0;
        if (verticalRotation > verticalAngularClamp) {
            deltaVerticalRotation = verticalRotation - verticalAngularClamp;
        } else if (verticalRotation < -verticalAngularClamp) {
            deltaVerticalRotation = verticalRotation + verticalAngularClamp;
        }

        if (horizontalRotation > horizontalAngularClamp) {
            deltaHorizontalRotation = horizontalRotation - horizontalAngularClamp;
        } else if (horizontalRotation < -horizontalAngularClamp) {
            deltaHorizontalRotation = horizontalRotation + horizontalAngularClamp;
        }

        this._correctAngles(localPosition, Math.PI / 2 - horizontalRotation + deltaHorizontalRotation, Math.PI / 2 - verticalRotation + deltaVerticalRotation, dist);
        this._tmpMatrix.copyFrom(camera.getViewMatrix());
        this._tmpMatrix.invert();
        // To world
        Vector3.TransformCoordinatesToRef(localPosition, this._tmpMatrix, localPosition);
        mesh.position.copyFrom(localPosition);
        // Todo : handle parent if mesh is parented
    }

    private _orientationClamp(mesh: AbstractMesh, camera: Camera) {
        this._tmpMatrix.copyFrom(mesh.computeWorldMatrix(true));
        let toTarget = this._tmpVector;
        // Construct a rotation matrix from up vector and target vector
        toTarget.copyFrom(camera.position).subtractInPlace(mesh.position);

        // Todo : handle parent if parented
        // const mat = mesh.computeWorldMatrix(true).clone().invert();
        // toTarget = Vector3.TransformNormal(toTarget, mat);
        toTarget.normalize();
        let upVector = new Vector3(0, 1, 0);

        if (Vector3.Cross(toTarget, upVector).length() < 1e-5) {
            // todo : generates random jumps, maybe find something a bit closer
            upVector.copyFromFloats(1, 0, 0);
        }
        Matrix.LookDirectionLHToRef(toTarget, upVector, this._tmpMatrix);
        Quaternion.FromRotationMatrixToRef(this._tmpMatrix, this._tmpQuaternion);

        if (!mesh.rotationQuaternion) {
            mesh.rotationQuaternion = new Quaternion();
        }

        mesh.rotationQuaternion.copyFrom(this._tmpQuaternion);
    }

    private _addObservables(followedCamera: Camera) {
        this._onFollowedCameraMatrixChanged = followedCamera.onViewMatrixChangedObservable.add((camera: Camera) => {
            if (this.attachedNode) {
                this._angularClamp(this.attachedNode, camera);
                this._distanceClamp(this.attachedNode, camera);
                this._orientationClamp(this.attachedNode, camera);
                this.attachedNode.computeWorldMatrix(true);
            }
        });
    }

    private _removeObservables(followedCamera: Camera) {
        if (this._onFollowedCameraMatrixChanged) {
            followedCamera.onViewMatrixChangedObservable.remove(this._onFollowedCameraMatrixChanged);
        }
    }
}
