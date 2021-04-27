import { Behavior } from "../behavior";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { Observer } from "../../Misc";
import { Camera } from "../../Cameras/camera";
import { Matrix, Vector3 } from "../../Maths/math.vector";

/**
 * A behavior that when attached to a mesh will allow the mesh to fade in and out
 */
export class FollowBehavior implements Behavior<AbstractMesh> {
    private _scene: Scene;
    private _tmpVector: Vector3 = new Vector3();
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
        this._tmpVector.scaleInPlace(this.followDistance / norm);
        this._tmpVector.addInPlace(cameraPosition);

        this._tmpMatrix.invert();
        Vector3.TransformCoordinatesToRef(this._tmpVector, this._tmpMatrix, this._tmpVector);
        mesh.position.addInPlace(this._tmpVector);
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

        if (dist < 1e-7) {
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
        // To object
        this._tmpMatrix.copyFrom(mesh.getWorldMatrix());
        this._tmpMatrix.invert();
        Vector3.TransformCoordinatesToRef(localPosition, this._tmpMatrix, localPosition);
        mesh.position.addInPlace(localPosition);
    }

    private _orientationClamp(mesh: AbstractMesh, camera: Camera) {}

    private _addObservables(followedCamera: Camera) {
        this._onFollowedCameraMatrixChanged = followedCamera.onViewMatrixChangedObservable.add((camera: Camera) => {
            if (this.attachedNode) {
                this._distanceClamp(this.attachedNode, camera);
                this._angularClamp(this.attachedNode, camera);
                this._orientationClamp(this.attachedNode, camera);
            }
        });
    }

    private _removeObservables(followedCamera: Camera) {
        if (this._onFollowedCameraMatrixChanged) {
            followedCamera.onViewMatrixChangedObservable.remove(this._onFollowedCameraMatrixChanged);
        }
    }
}
