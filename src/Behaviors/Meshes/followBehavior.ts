import { Behavior } from "../behavior";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { Observer } from "../../Misc";
import { Camera } from "../../Cameras/camera";
import { Matrix, Quaternion, Vector3 } from "../../Maths/math.vector";
import { Scalar } from "../../Maths/math.scalar";

const EPSILON = 1e-5;

/**
 * A behavior that when attached to a mesh will allow the mesh to fade in and out
 */
export class FollowBehavior implements Behavior<AbstractMesh> {
    private _scene: Scene;
    private _tmpVector: Vector3 = new Vector3();
    // Memory cache to avoid GC workload
    private _tmpVectors: Vector3[] = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    private _tmpMatrix: Matrix = new Matrix();

    public attachedNode: Nullable<AbstractMesh>;
    public followDistance = 5;
    public lerpTime = 100;

    private _followedCamera: Nullable<Camera>;
    private _onFollowedCameraMatrixChanged: Nullable<Observer<Camera>>;
    private _onBeforeRender: Nullable<Observer<Scene>>;

    private _workingPosition: Vector3 = new Vector3();
    private _workingPivot: Vector3 = new Vector3();
    private _workingQuaternion: Quaternion = new Quaternion();
    private _lastTick: number = -1;

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
    private _simplifyAngle(angle: number) {
        // Todo : better version => mod 2PI then - 2 * PI for > PI, + 2 * PI for < -PI
        while (angle > Math.PI) {
            angle -= 2 * Math.PI;
        }

        while (angle < -Math.PI) {
            angle += 2 * Math.PI;
        }

        return angle;
    }

    private _angleBetweenOnPlane(from: Vector3, to: Vector3, normal: Vector3) {
        // Work on copies
        this._tmpVectors[0].copyFrom(from);
        from = this._tmpVectors[0];
        this._tmpVectors[1].copyFrom(to);
        to = this._tmpVectors[1];
        this._tmpVectors[2].copyFrom(normal);
        normal = this._tmpVectors[2];
        const right = this._tmpVectors[3];
        const forward = this._tmpVectors[4];

        from.normalize();
        to.normalize();
        normal.normalize();

        Vector3.CrossToRef(normal, from, right);
        Vector3.CrossToRef(right, normal, forward);

        const angle = Math.atan2(Vector3.Dot(to, right), Vector3.Dot(to, forward));

        return this._simplifyAngle(angle);
    }

    private _angleBetweenVectorAndPlane(vector: Vector3, normal: Vector3) {
        // Work on copies
        this._tmpVectors[0].copyFrom(vector);
        vector = this._tmpVectors[0];
        this._tmpVectors[1].copyFrom(normal);
        normal = this._tmpVectors[1];

        vector.normalize();
        normal.normalize();

        return Math.PI / 2 - Math.acos(Vector3.Dot(vector, normal));
    }

    private _distanceClamp(mesh: AbstractMesh, camera: Camera, currentToTarget: Vector3, _ignorePitch: boolean = false, _moveToDefault: boolean = false) {
        // Todo : parameters
        const minDistance = 3;
        const maxDistance = 6;
        const defaultDistance = 5;

        const direction = this._tmpVectors[0];
        direction.copyFrom(currentToTarget);
        const currentDistance = direction.length();
        direction.normalizeFromLength(currentDistance);
        let clampedDistance = currentDistance;

        if (_moveToDefault) {
            if (currentDistance < minDistance || currentDistance > maxDistance) {
                clampedDistance = defaultDistance;
            }
        } else {
            clampedDistance = Scalar.Clamp(currentDistance, minDistance, maxDistance);
        }

        currentToTarget.copyFrom(direction).scaleInPlace(clampedDistance);

        return currentDistance !== clampedDistance;
    }

    private _angularClamp(mesh: AbstractMesh, camera: Camera, currentToTarget: Vector3, _ignoreVertical: boolean = false) {
        const verticalFovFixed = camera.fovMode === Camera.FOVMODE_VERTICAL_FIXED;
        const invertView = this._tmpMatrix;
        invertView.copyFrom(camera.getViewMatrix());
        invertView.invert();

        const forward = new Vector3();
        const right = new Vector3();
        Vector3.TransformNormalToRef(new Vector3(0, 0, 1), invertView, forward);
        Vector3.TransformNormalToRef(new Vector3(1, 0, 0), invertView, right);
        const up = new Vector3(0, 1, 0);

        // Todo : angle as parameters
        const horizontalAngularClamp = verticalFovFixed ? (this._scene.getEngine().getAspectRatio(camera) * camera.fov) / 2 : camera.fov / 2;
        const verticalAngularClamp = verticalFovFixed ? camera.fov / 2 : camera.fov / this._scene.getEngine().getAspectRatio(camera) / 2;

        const dist = currentToTarget.length();

        if (dist < EPSILON) {
            return;
        }

        let clamped = false;
        // X-axis leashing
        if (_ignoreVertical) {
            const angle = this._angleBetweenOnPlane(currentToTarget, forward, right);
            const rotationQuat = Quaternion.RotationAxis(right, angle);
            currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
        } else {
            const angle = -this._angleBetweenOnPlane(currentToTarget, forward, right);
            if (angle < -verticalAngularClamp) {
                const rotationQuat = Quaternion.RotationAxis(right, -angle - verticalAngularClamp);
                currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
                clamped = true;
            } else if (angle > verticalAngularClamp) {
                const rotationQuat = Quaternion.RotationAxis(right, -angle + verticalAngularClamp);
                currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
                clamped = true;
            }
        }

        // Y-axis leashing
        const angle = this._angleBetweenVectorAndPlane(currentToTarget, right);
        if (angle < -horizontalAngularClamp) {
            const rotationQuat = Quaternion.RotationAxis(up, -angle - horizontalAngularClamp);
            currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
            clamped = true;
        } else if (angle > horizontalAngularClamp) {
            const rotationQuat = Quaternion.RotationAxis(up, -angle + horizontalAngularClamp);
            currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
            clamped = true;
        }
    }

    private _orientationClamp(mesh: AbstractMesh, camera: Camera, currentToTarget: Vector3, rotationQuaternion: Quaternion) {
        let toFollowed = this._tmpVectors[0];
        // Construct a rotation quat from up vector and target vector
        toFollowed.copyFrom(currentToTarget).scaleInPlace(-1).normalize();
        const invertView = this._tmpMatrix;
        invertView.copyFrom(camera.getViewMatrix());
        invertView.invert();
        const up = new Vector3();
        const right = new Vector3();
        Vector3.TransformNormalToRef(new Vector3(0, 1, 0), Matrix.Identity(), up);
        Vector3.CrossToRef(toFollowed, up, right);
        if (right.length() < EPSILON) {
            return;
        }
        Vector3.CrossToRef(right, toFollowed, up);
        Quaternion.FromLookDirectionLHToRef(toFollowed, up, rotationQuaternion);
        rotationQuaternion.normalize();
    }

    private _vectorSlerpToRef(vector1: Vector3, vector2: Vector3, slerp: number, result: Vector3) {
        slerp = Scalar.Clamp(slerp, 0, 1);
        const vector1Dir = this._tmpVectors[0];
        const vector2Dir = this._tmpVectors[1];
        let vector1Length;
        let vector2Length;

        vector1Dir.copyFrom(vector1);
        vector1Length = vector1Dir.length();
        vector1Dir.normalizeFromLength(vector1Length);

        vector2Dir.copyFrom(vector2);
        vector2Length = vector2Dir.length();
        vector2Dir.normalizeFromLength(vector2Length);

        const dot = Vector3.Dot(vector1Dir, vector2Dir);

        let scale1;
        let scale2;

        if (Math.abs(dot) < 1 - EPSILON) {
            const omega = Math.acos(dot);
            const invSin = 1 / Math.sin(omega);
            scale1 = Math.sin((1 - slerp) * omega) * invSin;
            scale2 = Math.sin(slerp * omega) * invSin;
        } else {
            // Use linear interpolation
            scale1 = 1 - slerp;
            scale2 = slerp;
        }

        vector1Dir.scaleInPlace(scale1);
        vector2Dir.scaleInPlace(scale2);
        result.copyFrom(vector1Dir).addInPlace(vector2Dir);
        result.scaleInPlace(Scalar.Lerp(vector1Length, vector2Length, slerp));
    }

    private _vectorSmoothToRef(source: Vector3, goal: Vector3, deltaTime: number, lerpTime: number, result: Vector3) {
        return this._vectorSlerpToRef(source, goal, lerpTime === 0 ? 1 : deltaTime / lerpTime, result);
    }

    private _quaternionSmoothToRef(source: Quaternion, goal: Quaternion, deltaTime: number, lerpTime: number, result: Quaternion) {
        let slerp = lerpTime === 0 ? 1 : deltaTime / lerpTime;
        slerp = Scalar.Clamp(slerp, 0, 1);

        return Quaternion.SlerpToRef(source, goal, slerp, result);
    }

    private _updateLeashing(camera: Camera) {
        if (this.attachedNode) {
            let oldParent = this.attachedNode.parent;
            this.attachedNode.setParent(null);

            const worldMatrix = this.attachedNode.computeWorldMatrix(true);
            const currentToTarget = this._tmpVector;
            const rotationQuaternion = this._workingQuaternion;
            const pivot = this.attachedNode.getPivotPoint();
            this._workingPivot.copyFrom(pivot);
            Vector3.TransformCoordinatesToRef(pivot, worldMatrix, currentToTarget);
            currentToTarget.subtractInPlace(camera.globalPosition);

            this._angularClamp(this.attachedNode, camera, currentToTarget);
            this._distanceClamp(this.attachedNode, camera, currentToTarget);
            this._orientationClamp(this.attachedNode, camera, currentToTarget, rotationQuaternion);

            this._workingPosition.copyFrom(currentToTarget).subtractInPlace(pivot);

            this.attachedNode.setParent(oldParent);
            this.attachedNode.computeWorldMatrix(true);
        }
    }

    private _updateTransformToGoal(elapsed: number) {
        if (!this.attachedNode || !this.followedCamera) {
            return;
        }

        if (!this.attachedNode.rotationQuaternion) {
            this.attachedNode.rotationQuaternion = Quaternion.Identity();
        }

        const oldParent = this.attachedNode.parent;
        this.attachedNode.setParent(null);

        // position
        const currentDirection = new Vector3();
        currentDirection.copyFrom(this.attachedNode.position).subtractInPlace(this.followedCamera.globalPosition);
        this._vectorSmoothToRef(currentDirection, this._workingPosition, elapsed, this.lerpTime, currentDirection);
        currentDirection.addInPlace(this.followedCamera.globalPosition);
        this.attachedNode.position.copyFrom(currentDirection);

        // rotation
        const currentRotation = new Quaternion();
        currentRotation.copyFrom(this.attachedNode.rotationQuaternion);
        this._quaternionSmoothToRef(currentRotation, this._workingQuaternion, elapsed, this.lerpTime, this.attachedNode.rotationQuaternion);
        this.attachedNode.setParent(oldParent);
    }

    private _addObservables(followedCamera: Camera) {
        this._lastTick = Date.now();
        // this._onFollowedCameraMatrixChanged = followedCamera.onViewMatrixChangedObservable.add((camera: Camera) => this._updateLeashing(camera));
        this._onBeforeRender = this._scene.onBeforeRenderObservable.add(() => {
            if (!this.followedCamera) {
                return;
            }

            const tick = Date.now();
            this._updateLeashing(this.followedCamera);
            this._updateTransformToGoal(tick - this._lastTick);
            this._lastTick = tick;
        });
    }

    private _removeObservables(followedCamera: Camera) {
        if (this._onFollowedCameraMatrixChanged) {
            followedCamera.onViewMatrixChangedObservable.remove(this._onFollowedCameraMatrixChanged);
        }

        if (this._onBeforeRender) {
            this._scene.onBeforeRenderObservable.remove(this._onBeforeRender);
        }
    }
}
