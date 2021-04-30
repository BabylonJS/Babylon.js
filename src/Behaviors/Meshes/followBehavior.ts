import { Behavior } from "../behavior";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { Observer } from "../../Misc";
import { Camera } from "../../Cameras/camera";
import { Matrix, Quaternion, Vector3 } from "../../Maths/math.vector";
import { Scalar } from "../../Maths/math.scalar";
import { TransformNode } from "../../Meshes/transformNode";

const EPSILON = 1e-5;

/**
 * A behavior that when attached to a mesh will follow a camera
 */
export class FollowBehavior implements Behavior<TransformNode> {
    private _scene: Scene;

    // Memory cache to avoid GC usage
    private _tmpQuaternion: Quaternion = new Quaternion();
    private _tmpVectors: Vector3[] = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    private _tmpMatrix: Matrix = new Matrix();
    private _tmpInvertView: Matrix = new Matrix();
    private _tmpForward: Vector3 = new Vector3();
    private _tmpNodeForward: Vector3 = new Vector3();

    private _followedCamera: Nullable<Camera>;
    private _onBeforeRender: Nullable<Observer<Scene>>;

    private _workingPosition: Vector3 = new Vector3();
    private _workingQuaternion: Quaternion = new Quaternion();
    private _lastTick: number = -1;

    /**
     * Attached node of this behavior
     */
    public attachedNode: Nullable<TransformNode>;

    /**
     * Set to false if the node should strictly follow the camera without any interpolation time
     */
    public interpolatePose = true;

    /**
     * Rate of interpolation of position and rotation of the attached node.
     * Higher values will give a slower interpolation.
     */
    public lerpTime = 500;

    /**
     * If the behavior should ignore the pitch and roll of the camera.
     */
    public ignoreCameraPitchAndRoll = true;

    /**
     * Pitch offset from camera (relative to Max Distance)
     * Is only effective if `ignoreCameraPitchAndRoll` is set to `true`.
     */
    public pitchOffset = 45;

    public maxViewVerticalDegrees = 30;
    public maxViewHorizontalDegrees = 30;
    public orientToCameraDeadzoneDegrees = 60;
    public ignoreDistanceClamp = false;
    public ignoreAngleClamp = false;
    public fixedVerticalOffset = 0.5;
    public useFixedVerticalOffset = true;
    public verticalMaxDistance = 0;
    public defaultDistance = 7.5;
    public maximumDistance = 10;
    public minimumDistance = 5;
    public recenterNextUpdate = true;

    /**
     * The camera that should be followed by this behavior
     */
    public get followedCamera(): Nullable<Camera> {
        return this._followedCamera;
    }

    public set followedCamera(camera: Nullable<Camera>) {
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
     * @param followedCamera The camera that should be followed by the node
     */
    public attach(ownerNode: TransformNode, followedCamera?: Camera): void {
        this._scene = ownerNode.getScene();
        this.attachedNode = ownerNode;

        if (followedCamera) {
            this.followedCamera = followedCamera;
        }
        if (!this.followedCamera) {
            this.followedCamera = this._scene.activeCamera;
        }

        this._addObservables();
    }

    /**
     *  Detaches the behavior from the mesh
     */
    public detach(): void {
        this.attachedNode = null;
        this._removeObservables();
    }

    /**
     * Recenters the attached node in front of the camera on the next update
     */
    public recenter() {
        this.recenterNextUpdate = true;
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

        return Scalar.NormalizeRadians(angle);
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

    private _length2D(vector: Vector3) {
        return Math.sqrt(vector.x * vector.x + vector.z * vector.z);
    }

    private _distanceClamp(currentToTarget: Vector3, moveToDefault: boolean = false) {
        let minDistance = this.minimumDistance;
        let maxDistance = this.maximumDistance;
        const defaultDistance = this.defaultDistance;

        const direction = this._tmpVectors[0];
        direction.copyFrom(currentToTarget);
        let currentDistance = direction.length();
        direction.normalizeFromLength(currentDistance);

        if (this.ignoreCameraPitchAndRoll) {
            // If we don't account for pitch offset, the casted object will float up/down as the reference
            // gets closer to it because we will still be casting in the direction of the pitched offset.
            // To fix this, only modify the YZ position of the object.
            minDistance = this._length2D(direction) * minDistance;
            maxDistance = this._length2D(direction) * maxDistance;

            const currentDistance2D = this._length2D(currentToTarget);
            direction.scaleInPlace(currentDistance / currentDistance2D);
            currentDistance = currentDistance2D;
        }

        let clampedDistance = currentDistance;

        if (moveToDefault) {
            // moveToDefault seems to induce glitches when angle clamped
            if (currentDistance < minDistance || currentDistance > maxDistance) {
                clampedDistance = defaultDistance;
            }
        } else {
            clampedDistance = Scalar.Clamp(currentDistance, minDistance, maxDistance);
        }

        currentToTarget.copyFrom(direction).scaleInPlace(clampedDistance);

        return currentDistance !== clampedDistance;
    }

    private _applyVerticalClamp(currentToTarget: Vector3) {
        if (this.verticalMaxDistance !== 0) {
            currentToTarget.y = Scalar.Clamp(currentToTarget.y, -this.verticalMaxDistance, this.verticalMaxDistance);
        }
    }

    private _toOrientationQuatToRef(vector: Vector3, quaternion: Quaternion) {
        Quaternion.RotationYawPitchRollToRef(Math.atan2(vector.x, vector.z), Math.atan2(vector.y, Math.sqrt(vector.z*vector.z + vector.y*vector.y)), 0, quaternion);
    }

    private _applyPitchOffset(invertView: Matrix) {
        const forward = this._tmpVectors[0];
        const right = this._tmpVectors[1];
        forward.copyFromFloats(0, 0, 1);
        right.copyFromFloats(1, 0, 0);
        Vector3.TransformNormalToRef(forward, invertView, forward);
        forward.y = 0;
        Vector3.TransformNormalToRef(right, invertView, right);

        Quaternion.RotationAxisToRef(right, this.pitchOffset * Math.PI / 180, this._tmpQuaternion);
        forward.rotateByQuaternionToRef(this._tmpQuaternion, forward);
        this._toOrientationQuatToRef(forward, this._tmpQuaternion);
        this._tmpQuaternion.toRotationMatrix(this._tmpMatrix);

        // Since we already extracted position from the invert view matrix, we can
        // disregard the position part of the matrix in the copy
        invertView.copyFrom(this._tmpMatrix);
    }

    private _angularClamp(invertView: Matrix, currentToTarget: Vector3): boolean {
        const forward = this._tmpVectors[5];
        forward.copyFromFloats(0, 0, 1);
        const right = this._tmpVectors[6];
        right.copyFromFloats(1, 0, 0);

        // forward and right are related to camera frame of reference
        Vector3.TransformNormalToRef(forward, invertView, forward);
        Vector3.TransformNormalToRef(right, invertView, right);

        // Up is global Z
        const up = Vector3.UpReadOnly;

        const dist = currentToTarget.length();

        if (dist < EPSILON) {
            return false;
        }

        let angularClamped = false;
        const rotationQuat = this._tmpQuaternion;

        // X-axis leashing
        if (this.ignoreCameraPitchAndRoll) {
            const angle = this._angleBetweenOnPlane(currentToTarget, forward, right);
            Quaternion.RotationAxisToRef(right, angle, rotationQuat);
            // currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
        } else {
            const angle = -this._angleBetweenOnPlane(currentToTarget, forward, right);
            const minMaxAngle = ((this.maxViewVerticalDegrees * Math.PI) / 180) * 0.5;
            if (angle < -minMaxAngle) {
                Quaternion.RotationAxisToRef(right, -angle - minMaxAngle, rotationQuat);
                currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
                angularClamped = true;
            } else if (angle > minMaxAngle) {
                Quaternion.RotationAxisToRef(right, -angle + minMaxAngle, rotationQuat);
                currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
                angularClamped = true;
            }
        }

        // Y-axis leashing
        const angle = this._angleBetweenVectorAndPlane(currentToTarget, right);
        const minMaxAngle = ((this.maxViewHorizontalDegrees * Math.PI) / 180) * 0.5;
        if (angle < -minMaxAngle) {
            Quaternion.RotationAxisToRef(up, -angle - minMaxAngle, rotationQuat);
            currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
            angularClamped = true;
        } else if (angle > minMaxAngle) {
            Quaternion.RotationAxisToRef(up, -angle + minMaxAngle, rotationQuat);
            currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
            angularClamped = true;
        }

        return angularClamped;
    }

    private _orientationClamp(currentToTarget: Vector3, rotationQuaternion: Quaternion) {
        // Construct a rotation quat from up vector and target vector
        const toFollowed = this._tmpVectors[0];
        toFollowed.copyFrom(currentToTarget).scaleInPlace(-1).normalize();

        const up = this._tmpVectors[1];
        const right = this._tmpVectors[2];
        // We use global up vector to orient the following node (global +Y)
        up.copyFromFloats(0, 1, 0);

        // Gram-Schmidt to create an orthonormal frame
        Vector3.CrossToRef(toFollowed, up, right);
        const length = right.length();

        if (length < EPSILON) {
            return;
        }

        right.normalizeFromLength(length);

        Vector3.CrossToRef(right, toFollowed, up);
        Quaternion.FromLookDirectionLHToRef(toFollowed, up, rotationQuaternion);
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

    private _passedOrientationDeadzone(currentToTarget: Vector3, forward: Vector3) {
        const leashToFollow = this._tmpVectors[5];
        leashToFollow.copyFrom(currentToTarget);
        leashToFollow.normalize();

        const angle = Math.abs(this._angleBetweenOnPlane(forward, leashToFollow, Vector3.UpReadOnly));
        return angle * 180 / Math.PI > this.orientToCameraDeadzoneDegrees;
    }

    private _updateLeashing(camera: Camera) {
        if (this.attachedNode) {
            let oldParent = this.attachedNode.parent;
            this.attachedNode.setParent(null);

            const worldMatrix = this.attachedNode.computeWorldMatrix(true);
            const currentToTarget = this._workingPosition;
            const rotationQuaternion = this._workingQuaternion;
            const pivot = this.attachedNode.getPivotPoint();
            const invertView = this._tmpInvertView;
            invertView.copyFrom(camera.getViewMatrix());
            invertView.invert();

            Vector3.TransformCoordinatesToRef(pivot, worldMatrix, currentToTarget);
            currentToTarget.subtractInPlace(camera.globalPosition);

            if (this.ignoreCameraPitchAndRoll && !this.useFixedVerticalOffset) {
                this._applyPitchOffset(invertView);
            }

            let angularClamped = false;
            const forward = this._tmpForward;
            forward.copyFromFloats(0, 0, 1);
            Vector3.TransformNormalToRef(forward, invertView, forward);
            
            const nodeForward = this._tmpNodeForward;
            nodeForward.copyFromFloats(0, 0, 1);
            Vector3.TransformNormalToRef(nodeForward, worldMatrix, nodeForward);

            if (this.recenterNextUpdate) {
                currentToTarget.copyFrom(forward).scaleInPlace(this.defaultDistance);
                this.recenterNextUpdate = false;
            } else {
                if (this.ignoreAngleClamp) {
                    const currentDistance = currentToTarget.length();
                    currentToTarget.copyFrom(forward).scaleInPlace(currentDistance);
                } else {
                    angularClamped = this._angularClamp(invertView, currentToTarget);
                }
            }
            
            let distanceClamped = false;
            if (!this.ignoreDistanceClamp) {
                distanceClamped = this._distanceClamp(currentToTarget, angularClamped);
                this._applyVerticalClamp(currentToTarget);
            }

            if (this.useFixedVerticalOffset) {
                // currentToTarget.y = this.fixedVerticalOffset;
            }

            if (angularClamped || distanceClamped || this._passedOrientationDeadzone(currentToTarget, nodeForward)) {
                this._orientationClamp(currentToTarget, rotationQuaternion);
            }

            this._workingPosition.subtractInPlace(pivot);

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

        if (!this.interpolatePose) {
            this.attachedNode.position.copyFrom(this.followedCamera.globalPosition).addInPlace(this._workingPosition);
            this.attachedNode.rotationQuaternion.copyFrom(this._workingQuaternion);
            return;
        }

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

    private _addObservables() {
        this._lastTick = Date.now();
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

    private _removeObservables() {
        if (this._onBeforeRender) {
            this._scene.onBeforeRenderObservable.remove(this._onBeforeRender);
        }
    }
}
