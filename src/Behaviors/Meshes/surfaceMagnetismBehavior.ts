import { PickingInfo } from "../../Collisions/pickingInfo";
import { PointerEventTypes, PointerInfo } from "../../Events/pointerEvents";
import { Matrix, Quaternion, TmpVectors, Vector3 } from "../../Maths/math.vector";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";
import { SmoothingTools } from "../../Misc/smoothingTools";
import { Observer } from "../../Misc/observable";
import { UtilityLayerRenderer } from "../../Rendering/utilityLayerRenderer";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { Behavior } from "../behavior";

/**
 * A behavior that allows a transform node to stick to a surface position/orientation
 */
export class SurfaceMagnetismBehavior implements Behavior<Mesh> {
    private _scene: Scene;
    private _attachedMesh: Nullable<Mesh>;
    private _attachPointLocalOffset: Vector3;
    private _pointerObserver: Nullable<Observer<PointerInfo>>;
    private _utilityLayer: UtilityLayerRenderer;
    private _workingPosition: Vector3 = new Vector3();
    private _workingQuaternion: Quaternion = new Quaternion();
    private _lastTick: number = -1;
    private _onBeforeRender: Nullable<Observer<Scene>>;

    /**
     * Distance offset from the hit point to place the target at, along the hit normal.
     */
    public hitNormalOffset: number = 0.2;

    /**
     * Name of the behavior
     */
    public get name(): string {
        return "SurfaceMagnetism";
    }

    /**
     * Spatial mapping meshes to collide with
     */
    public meshes: AbstractMesh[];

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
    public keepOrientationVertical = false;

    /**
     * Attaches the behavior to a transform node
     * @param target defines the target where the behavior is attached to
     */
    public attach(target: Mesh, scene?: Scene, utilityLayer?: UtilityLayerRenderer): void {
        this._attachedMesh = target;
        this._scene = scene || target.getScene();
        this.updateAttachPoint();
        if (!this._attachedMesh.rotationQuaternion) {
            this._attachedMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._attachedMesh.rotation.y, this._attachedMesh.rotation.x, this._attachedMesh.rotation.z);
        }

        if (utilityLayer) {
            this._utilityLayer = utilityLayer;
            utilityLayer.pickingEnabled = false;
        }
        this._addObservables();
    }

    /**
     * Detaches the behavior
     */
    public detach(): void {
        this._attachedMesh = null;
        this._removeObservables();
        this._utilityLayer.pickingEnabled = true;
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

            const worldOffset = TmpVectors.Vector3[1];
            Vector3.TransformNormalToRef(this._attachPointLocalOffset, this._attachedMesh.getWorldMatrix(), worldOffset);

            if (this._attachedMesh.parent) {
                TmpVectors.Matrix[0].copyFrom(this._attachedMesh.parent.getWorldMatrix()).invert();
                Vector3.TransformNormalToRef(worldOffset, TmpVectors.Matrix[0], worldOffset);
            }

            return {
                position: worldTarget.subtractInPlace(worldOffset),
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
        this._attachPointLocalOffset = this._getAttachPointOffset();
    }

    private _getAttachPointOffset(): Vector3 {
        if (!this._attachedMesh) {
            return Vector3.Zero();
        }

        const storedQuat = TmpVectors.Quaternion[0];
        storedQuat.copyFrom(this._attachedMesh.rotationQuaternion!);
        this._attachedMesh.rotationQuaternion!.copyFromFloats(0, 0, 0, 1);
        this._attachedMesh.computeWorldMatrix();
        const boundingMinMax = this._attachedMesh.getHierarchyBoundingVectors();
        const center = boundingMinMax.max.add(boundingMinMax.min).scaleInPlace(0.5);
        center.z = boundingMinMax.max.z;
        // We max the z coordinate because we want the attach point to be on the back of the mesh
        const invWorld = Matrix.Invert(this._attachedMesh.getWorldMatrix());
        const centerOffset = Vector3.TransformCoordinates(center, invWorld);
        this._attachedMesh.rotationQuaternion!.copyFrom(storedQuat);
        return centerOffset;
    }

    private _updateTransformToGoal(elapsed: number) {
        if (!this._attachedMesh) {
            return;
        }

        const oldParent = this._attachedMesh.parent;
        this._attachedMesh.setParent(null);

        if (!this.interpolatePose) {
            this._attachedMesh.position.copyFrom(this._workingPosition);
            this._attachedMesh.rotationQuaternion!.copyFrom(this._workingQuaternion);
            return;
        }

        // position
        const interpolatedPosition = new Vector3();
        SmoothingTools.SmoothToRefVec3(this._attachedMesh.position, this._workingPosition, elapsed, this.lerpTime, interpolatedPosition);
        this._attachedMesh.position.copyFrom(interpolatedPosition);

        // rotation
        const currentRotation = new Quaternion();
        currentRotation.copyFrom(this._attachedMesh.rotationQuaternion!);
        SmoothingTools.SmoothToRefQuaternion(currentRotation, this._workingQuaternion, elapsed, this.lerpTime, this._attachedMesh.rotationQuaternion!);

        this._attachedMesh.setParent(oldParent);
    }

    private _addObservables() {
        const pickPredicate = (mesh: AbstractMesh) => {
            return this.meshes.indexOf(mesh) !== -1;
        };

        this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type == PointerEventTypes.POINTERMOVE) {
                if (
                    this._attachedMesh &&
                    pointerInfo.pickInfo &&
                    pointerInfo.pickInfo.hit &&
                    pointerInfo.pickInfo.pickedMesh &&
                    pointerInfo.pickInfo.ray &&
                    pickPredicate(pointerInfo.pickInfo.pickedMesh)
                ) {
                    const pose = this._getTargetPose(pointerInfo.pickInfo);
                    if (pose) {
                        this._workingPosition.copyFrom(pose.position);
                        this._workingQuaternion.copyFrom(pose.quaternion);
                    }
                }
            }

            if (pointerInfo.type == PointerEventTypes.POINTERDOWN) {
                // Release the mesh
                this.detach();
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
    }
}
