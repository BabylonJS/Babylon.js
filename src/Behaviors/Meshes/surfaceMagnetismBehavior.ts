import { PickingInfo } from "../../Collisions/pickingInfo";
import { PointerEventTypes, PointerInfo } from "../../Events/pointerEvents";
import { Quaternion, TmpVectors, Vector3 } from "../../Maths/math.vector";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";
import { Observer } from "../../Misc/observable";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { Behavior } from "../behavior";

/**
 * A behavior that allows a transform node to stick to a surface position/orientation
 */
export class SurfaceMagnetismBehavior implements Behavior<Mesh> {
    private _scene: Scene;
    private _attachedMesh: Nullable<Mesh>;
    private _attachPointLocalOffset: Vector3 = new Vector3();
    private _pointerObserver: Nullable<Observer<PointerInfo>>;
    private _workingPosition: Vector3 = new Vector3();
    private _workingQuaternion: Quaternion = new Quaternion();
    private _lastTick: number = -1;
    private _onBeforeRender: Nullable<Observer<Scene>>;
    private _hit = false;

    /**
     * Distance offset from the hit point to place the target at, along the hit normal.
     */
    public hitNormalOffset: number = 0.05;

    /**
     * Name of the behavior
     */
    public get name(): string {
        return "SurfaceMagnetism";
    }

    /**
     * Spatial mapping meshes to collide with
     */
    public meshes: AbstractMesh[] = [];

    /**
     * Function called when the behavior needs to be initialized (after attaching it to a target)
     */
    public init(): void {}

    /**
     * Set to false if the node should strictly follow the camera without any interpolation time
     */
    public interpolatePose = true;

    /**
     * Rate of interpolation of position and rotation of the attached node.
     * Higher values will give a slower interpolation.
     */
    public lerpTime = 250;

    /**
     * If true, pitch and roll are omitted.
     */
    public keepOrientationVertical = true;

    /**
     * Is this behavior reacting to pointer events
     */
    public enabled = true;

    /**
     * Maximum distance for the node to stick to the surface
     */
    public maxStickingDistance = 0.8;

    /**
     * Attaches the behavior to a transform node
     * @param target defines the target where the behavior is attached to
     * @param scene the scene
     */
    public attach(target: Mesh, scene?: Scene): void {
        this._attachedMesh = target;
        this._scene = scene || target.getScene();
        if (!this._attachedMesh.rotationQuaternion) {
            this._attachedMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._attachedMesh.rotation.y, this._attachedMesh.rotation.x, this._attachedMesh.rotation.z);
        }
        this.updateAttachPoint();

        this._workingPosition.copyFrom(this._attachedMesh.position);
        this._workingQuaternion.copyFrom(this._attachedMesh.rotationQuaternion);
        this._addObservables();
    }

    /**
     * Detaches the behavior
     */
    public detach(): void {
        this._attachedMesh = null;
        this._removeObservables();
    }

    private _getTargetPose(pickingInfo: PickingInfo): Nullable<{ position: Vector3; quaternion: Quaternion }> {
        if (!this._attachedMesh) {
            return null;
        }

        if (pickingInfo && pickingInfo.hit) {
            const pickedNormal = pickingInfo.getNormal(true, true);
            const pickedPoint = pickingInfo.pickedPoint;

            if (!pickedNormal || !pickedPoint) {
                return null;
            }
            pickedNormal.normalize();

            const worldTarget = TmpVectors.Vector3[0];
            worldTarget.copyFrom(pickedNormal);
            worldTarget.scaleInPlace(this.hitNormalOffset);
            worldTarget.addInPlace(pickedPoint);

            if (this._attachedMesh.parent) {
                TmpVectors.Matrix[0].copyFrom(this._attachedMesh.parent.getWorldMatrix()).invert();
                Vector3.TransformNormalToRef(worldTarget, TmpVectors.Matrix[0], worldTarget);
            }

            return {
                position: worldTarget,
                quaternion: Quaternion.RotationYawPitchRoll(
                    -Math.atan2(pickedNormal.x, -pickedNormal.z),
                    this.keepOrientationVertical ? 0 : Math.atan2(pickedNormal.y, Math.sqrt(pickedNormal.z * pickedNormal.z + pickedNormal.x * pickedNormal.x)),
                    0
                ),
            };
        }

        return null;
    }

    /**
     * Updates the attach point with the current geometry extents of the attached mesh
     */
    public updateAttachPoint() {
        this._getAttachPointOffsetToRef(this._attachPointLocalOffset);
    }

    /**
     * Finds the intersection point of the given ray onto the meshes and updates the target.
     * Transformation will be interpolated according to `interpolatePose` and `lerpTime` properties.
     * If no mesh of `meshes` are hit, this does nothing.
     * @param pickInfo The input pickingInfo that will be used to intersect the meshes
     * @returns a boolean indicating if we found a hit to stick to
     */
    public findAndUpdateTarget(pickInfo: PickingInfo) : boolean {
        this._hit = false;
        if (!pickInfo.ray) {
            return false;
        }

        const subPicking = pickInfo.ray.intersectsMeshes(this.meshes)[0];

        if (
            this._attachedMesh &&
            subPicking &&
            subPicking.hit &&
            subPicking.pickedMesh
        ) {
            const pose = this._getTargetPose(subPicking);
            if (pose && Vector3.Distance(this._attachedMesh.position, pose.position) < this.maxStickingDistance) {
                this._workingPosition.copyFrom(pose.position);
                this._workingQuaternion.copyFrom(pose.quaternion);
                this._hit = true;
            }
        }

        return this._hit;
    }

    private _getAttachPointOffsetToRef(ref: Vector3) {
        if (!this._attachedMesh) {
            ref.setAll(0);
            return;
        }

        const storedQuat = TmpVectors.Quaternion[0];
        storedQuat.copyFrom(this._attachedMesh.rotationQuaternion!);
        this._attachedMesh.rotationQuaternion!.copyFromFloats(0, 0, 0, 1);
        this._attachedMesh.computeWorldMatrix();
        const boundingMinMax = this._attachedMesh.getHierarchyBoundingVectors();
        const center = TmpVectors.Vector3[0];
        boundingMinMax.max.addToRef(boundingMinMax.min, center);
        center.scaleInPlace(0.5);
        center.z = boundingMinMax.max.z;
        // We max the z coordinate because we want the attach point to be on the back of the mesh
        const invWorld = TmpVectors.Matrix[0];
        this._attachedMesh.getWorldMatrix().invertToRef(invWorld);
        Vector3.TransformCoordinatesToRef(center, invWorld, ref);
        this._attachedMesh.rotationQuaternion!.copyFrom(storedQuat);
    }

    private _updateTransformToGoal(elapsed: number) {
        if (!this._attachedMesh || !this._hit) {
            return;
        }

        const oldParent = this._attachedMesh.parent;
        this._attachedMesh.setParent(null);

        const worldOffset = TmpVectors.Vector3[0];
        Vector3.TransformNormalToRef(this._attachPointLocalOffset, this._attachedMesh.getWorldMatrix(), worldOffset);

        if (!this.interpolatePose) {
            this._attachedMesh.position.copyFrom(this._workingPosition).subtractInPlace(worldOffset);
            this._attachedMesh.rotationQuaternion!.copyFrom(this._workingQuaternion);
            return;
        }

        // position
        const interpolatedPosition = new Vector3();
        Vector3.SmoothToRef(this._attachedMesh.position, this._workingPosition, elapsed, this.lerpTime, interpolatedPosition);
        this._attachedMesh.position.copyFrom(interpolatedPosition);

        // rotation
        const currentRotation = new Quaternion();
        currentRotation.copyFrom(this._attachedMesh.rotationQuaternion!);
        Quaternion.SmoothToRef(currentRotation, this._workingQuaternion, elapsed, this.lerpTime, this._attachedMesh.rotationQuaternion!);

        this._attachedMesh.setParent(oldParent);
    }

    private _addObservables() {
        this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            if (this.enabled && pointerInfo.type == PointerEventTypes.POINTERMOVE && pointerInfo.pickInfo) {
                this.findAndUpdateTarget(pointerInfo.pickInfo);
            }
        });

        this._lastTick = Date.now();
        this._onBeforeRender = this._scene.onBeforeRenderObservable.add(() => {
            const tick = Date.now();
            this._updateTransformToGoal(tick - this._lastTick);
            this._lastTick = tick;
        });
    }

    private _removeObservables() {
        this._scene.onPointerObservable.remove(this._pointerObserver);
        this._scene.onBeforeRenderObservable.remove(this._onBeforeRender);
        this._pointerObserver = null;
        this._onBeforeRender = null;
    }
}
