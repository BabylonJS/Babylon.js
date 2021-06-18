import { Behavior } from "../../Behaviors/behavior";
import { Mesh } from "../../Meshes/mesh";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { PointerInfo, PointerEventTypes } from "../../Events/pointerEvents";
import { Vector3, Quaternion, TmpVectors } from "../../Maths/math.vector";
import { Observer, Observable } from "../../Misc/observable";
import { TransformNode } from "../../Meshes/transformNode";
import { PickingInfo } from "../../Collisions/pickingInfo";
import { Camera } from "../../Cameras/camera";

/**
 * Data store to track virtual pointers movement
 */
type VirtualMeshInfo = {
    dragging: boolean;
    moving: boolean;
    dragMesh: AbstractMesh;
    originMesh: AbstractMesh;
    pivotMesh: AbstractMesh;
    startingPivotPosition: Vector3;
    startingPivotOrientation: Quaternion;
    startingPosition: Vector3;
    startingOrientation: Quaternion;
    lastOriginPosition: Vector3;
    lastDragPosition: Vector3;
};

/**
 * Base behavior for six degrees of freedom interactions in XR experiences.
 * Creates virtual meshes that are dragged around
 * And observables for position/rotation changes
 */
export class BaseSixDofDragBehavior implements Behavior<Mesh> {
    protected static _virtualScene: Scene;
    private _pointerObserver: Nullable<Observer<PointerInfo>>;
    private _attachedToElement: boolean = false;
    protected _virtualMeshesInfo: {
        [id: number]: VirtualMeshInfo;
    } = {};

    private _tmpVector: Vector3 = new Vector3();
    private _tmpQuaternion: Quaternion = new Quaternion();

    protected _scene: Scene;
    protected _moving = false;
    protected _ownerNode: TransformNode;
    protected _dragging: boolean = false;

    /**
     * The list of child meshes that can receive drag events
     * If `null`, all child meshes will receive drag event
     */
    public draggableMeshes: Nullable<AbstractMesh[]> = null;

    /**
     * How much faster the object should move when the controller is moving towards it. This is useful to bring objects that are far away from the user to them faster. Set this to 0 to avoid any speed increase. (Default: 3)
     */
    public zDragFactor = 3;
    /**
     * The id of the pointer that is currently interacting with the behavior (-1 when no pointer is active)
     */
    public get currentDraggingPointerId() {
        if (this.currentDraggingPointerIds[0] !== undefined) {
            return this.currentDraggingPointerIds[0];
        }
        return -1;
    }

    public set currentDraggingPointerId(value: number) {
        this.currentDraggingPointerIds[0] = value;
    }

    /**
     * In case of multipointer interaction, all pointer ids currently active are stored here
     */
    public currentDraggingPointerIds: number[] = [];

    /**
     * Get or set the currentDraggingPointerId
     * @deprecated Please use currentDraggingPointerId instead
     */
    public get currentDraggingPointerID(): number {
        return this.currentDraggingPointerId;
    }
    public set currentDraggingPointerID(currentDraggingPointerID: number) {
        this.currentDraggingPointerId = currentDraggingPointerID;
    }
    /**
    /**
     * If camera controls should be detached during the drag
     */
    public detachCameraControls = true;

    /**
     * Fires each time a drag starts
     */
    public onDragStartObservable = new Observable<{ position: Vector3 }>();
    /**
     * Fires each time a drag happens
     */
    public onDragObservable = new Observable<{ delta: Vector3; position: Vector3; pickInfo: PickingInfo }>();
    /**
     *  Fires each time a drag ends (eg. mouse release after drag)
     */
    public onDragEndObservable = new Observable<{}>();

    /**
     * Should the behavior allow simultaneous pointers to interact with the owner node.
     */
    public allowMultiPointer: boolean = true;

    /**
     *  The name of the behavior
     */
    public get name(): string {
        return "BaseSixDofDrag";
    }

    /**
     *  Returns true if the attached mesh is currently moving with this behavior
     */
    public get isMoving(): boolean {
        return this._moving;
    }

    /**
     *  Initializes the behavior
     */
    public init() {}

    /**
     * In the case of multiple active cameras, the cameraToUseForPointers should be used if set instead of active camera
     */
    private get _pointerCamera() {
        if (this._scene.cameraToUseForPointers) {
            return this._scene.cameraToUseForPointers;
        } else {
            return this._scene.activeCamera;
        }
    }

    private _createVirtualMeshInfo() {
        // Setup virtual meshes to be used for dragging without dirtying the existing scene

        const dragMesh = new AbstractMesh("", BaseSixDofDragBehavior._virtualScene);
        dragMesh.rotationQuaternion = new Quaternion();
        const originMesh = new AbstractMesh("", BaseSixDofDragBehavior._virtualScene);
        originMesh.rotationQuaternion = new Quaternion();
        const pivotMesh = new AbstractMesh("", BaseSixDofDragBehavior._virtualScene);
        pivotMesh.rotationQuaternion = new Quaternion();

        return {
            dragging: false,
            moving: false,
            dragMesh,
            originMesh,
            pivotMesh,
            startingPivotPosition: new Vector3(),
            startingPivotOrientation: new Quaternion(),
            startingPosition: new Vector3(),
            startingOrientation: new Quaternion(),
            lastOriginPosition: new Vector3(),
            lastDragPosition: new Vector3(),
        };
    }

    protected _resetVirtualMeshesPosition() {
        for (let i = 0; i < this.currentDraggingPointerIds.length; i++) {
            this._virtualMeshesInfo[this.currentDraggingPointerIds[i]].pivotMesh.position.copyFrom(this._ownerNode.getAbsolutePivotPoint());
            this._virtualMeshesInfo[this.currentDraggingPointerIds[i]].pivotMesh.rotationQuaternion!.copyFrom(this._ownerNode.rotationQuaternion!);
            this._virtualMeshesInfo[this.currentDraggingPointerIds[i]].startingPivotPosition.copyFrom(
                this._virtualMeshesInfo[this.currentDraggingPointerIds[i]].pivotMesh.position
            );
            this._virtualMeshesInfo[this.currentDraggingPointerIds[i]].startingPivotOrientation.copyFrom(
                this._virtualMeshesInfo[this.currentDraggingPointerIds[i]].pivotMesh.rotationQuaternion!
            );
            this._virtualMeshesInfo[this.currentDraggingPointerIds[i]].startingPosition.copyFrom(this._virtualMeshesInfo[this.currentDraggingPointerIds[i]].dragMesh.position);
            this._virtualMeshesInfo[this.currentDraggingPointerIds[i]].startingOrientation.copyFrom(
                this._virtualMeshesInfo[this.currentDraggingPointerIds[i]].dragMesh.rotationQuaternion!
            );
        }
    }

    /**
     * Attaches the scale behavior the passed in mesh
     * @param ownerNode The mesh that will be scaled around once attached
     */
    public attach(ownerNode: TransformNode): void {
        this._ownerNode = ownerNode;
        this._scene = this._ownerNode.getScene();
        if (!BaseSixDofDragBehavior._virtualScene) {
            BaseSixDofDragBehavior._virtualScene = new Scene(this._scene.getEngine(), { virtual: true });
            BaseSixDofDragBehavior._virtualScene.detachControl();
        }

        const pickPredicate = (m: AbstractMesh) => {
            return this._ownerNode === m || (m.isDescendantOf(this._ownerNode) && (!this.draggableMeshes || this.draggableMeshes.indexOf(m) !== -1));
        };

        this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo, eventState) => {
            const pointerId = (<PointerEvent>pointerInfo.event).pointerId;
            if (!this._virtualMeshesInfo[pointerId]) {
                this._virtualMeshesInfo[pointerId] = this._createVirtualMeshInfo();
            }
            const virtualMeshesInfo = this._virtualMeshesInfo[pointerId];

            if (pointerInfo.type == PointerEventTypes.POINTERDOWN) {
                if (
                    !virtualMeshesInfo.dragging &&
                    pointerInfo.pickInfo &&
                    pointerInfo.pickInfo.hit &&
                    pointerInfo.pickInfo.pickedMesh &&
                    pointerInfo.pickInfo.pickedPoint &&
                    pointerInfo.pickInfo.ray &&
                    pickPredicate(pointerInfo.pickInfo.pickedMesh)
                ) {
                    if (!this.allowMultiPointer && this.currentDraggingPointerIds.length > 0) {
                        return;
                    }
                    if (
                        this._pointerCamera &&
                        this._pointerCamera.cameraRigMode === Camera.RIG_MODE_NONE &&
                        !this._pointerCamera._isLeftCamera &&
                        !this._pointerCamera._isRightCamera
                    ) {
                        pointerInfo.pickInfo.ray.origin.copyFrom(this._pointerCamera!.globalPosition);
                    }
                    this._dragging = true;

                    virtualMeshesInfo.lastOriginPosition.copyFrom(pointerInfo.pickInfo.ray.origin);

                    // Set position and orientation of the controller
                    virtualMeshesInfo.originMesh.position.copyFrom(pointerInfo.pickInfo.ray.origin);
                    if (pointerInfo.pickInfo.originMesh) {
                        // Near interaction
                        virtualMeshesInfo.originMesh.lookAt(this._pointerCamera!.globalPosition);
                    } else {
                        virtualMeshesInfo.originMesh.lookAt(pointerInfo.pickInfo.ray.origin.add(pointerInfo.pickInfo.ray.direction));
                    }

                    // Attach the virtual drag mesh and pivot mesh to the virtual origin mesh so it can be dragged
                    // Drag mesh is the actual hit point position
                    // Pivot mesh is the position of the pivot of the dragged mesh
                    if (pointerInfo.pickInfo.originMesh) {
                        virtualMeshesInfo.dragMesh.position.copyFrom(pointerInfo.pickInfo.ray.origin);
                        virtualMeshesInfo.lastDragPosition.copyFrom(pointerInfo.pickInfo.ray.origin);
                    } else {
                        virtualMeshesInfo.dragMesh.position.copyFrom(pointerInfo.pickInfo.pickedPoint);
                        virtualMeshesInfo.lastDragPosition.copyFrom(pointerInfo.pickInfo.pickedPoint);
                    }
                    virtualMeshesInfo.pivotMesh.position.copyFrom(this._ownerNode.getAbsolutePivotPoint());

                    virtualMeshesInfo.startingPosition.copyFrom(virtualMeshesInfo.dragMesh.position);
                    virtualMeshesInfo.startingPivotPosition.copyFrom(virtualMeshesInfo.pivotMesh.position);
                    virtualMeshesInfo.startingOrientation.copyFrom(virtualMeshesInfo.dragMesh.rotationQuaternion!);
                    virtualMeshesInfo.startingPivotOrientation.copyFrom(virtualMeshesInfo.pivotMesh.rotationQuaternion!);

                    // Update state
                    virtualMeshesInfo.dragging = true;

                    if (this.currentDraggingPointerIds.indexOf(pointerId) === -1) {
                        this.currentDraggingPointerIds.push(pointerId);
                    }

                    // Detach camera controls
                    if (this.detachCameraControls && this._pointerCamera && !this._pointerCamera.leftCamera) {
                        if (this._pointerCamera.inputs && this._pointerCamera.inputs.attachedToElement) {
                            this._pointerCamera.detachControl();
                            this._attachedToElement = true;
                        } else {
                            this._attachedToElement = false;
                        }
                    }

                    this._targetDragStart(virtualMeshesInfo.pivotMesh.position, virtualMeshesInfo.pivotMesh.rotationQuaternion!, pointerId);
                    this.onDragStartObservable.notifyObservers({ position: virtualMeshesInfo.pivotMesh.position });
                }
            } else if (pointerInfo.type == PointerEventTypes.POINTERUP || pointerInfo.type == PointerEventTypes.POINTERDOUBLETAP) {
                const registeredPointerIndex = this.currentDraggingPointerIds.indexOf(pointerId);

                // Update state
                virtualMeshesInfo.dragging = false;

                if (registeredPointerIndex !== -1) {
                    this.currentDraggingPointerIds.splice(registeredPointerIndex, 1);
                    if (this.currentDraggingPointerIds.length === 0) {
                        this._moving = false;
                        this._dragging = false;

                        // Reattach camera controls
                        if (this.detachCameraControls && this._attachedToElement && this._pointerCamera && !this._pointerCamera.leftCamera) {
                            this._pointerCamera.attachControl(true);
                            this._attachedToElement = false;
                        }
                    }

                    virtualMeshesInfo.originMesh.removeChild(virtualMeshesInfo.dragMesh);
                    virtualMeshesInfo.originMesh.removeChild(virtualMeshesInfo.pivotMesh);
                    this._targetDragEnd(pointerId);
                    this.onDragEndObservable.notifyObservers({});
                }
            } else if (pointerInfo.type == PointerEventTypes.POINTERMOVE) {
                const registeredPointerIndex = this.currentDraggingPointerIds.indexOf(pointerId);

                if (registeredPointerIndex !== -1 && virtualMeshesInfo.dragging && pointerInfo.pickInfo && pointerInfo.pickInfo.ray) {
                    let zDragFactor = this.zDragFactor;

                    // 2 pointer interaction should not have a z axis drag factor
                    // as well as near interaction
                    if (this.currentDraggingPointerIds.length > 1 || pointerInfo.pickInfo.originMesh) {
                        zDragFactor = 0;
                    }

                    if (
                        this._pointerCamera &&
                        this._pointerCamera.cameraRigMode == Camera.RIG_MODE_NONE &&
                        !this._pointerCamera._isLeftCamera &&
                        !this._pointerCamera._isRightCamera
                    ) {
                        pointerInfo.pickInfo.ray.origin.copyFrom(this._pointerCamera!.globalPosition);
                        zDragFactor = 0;
                    }

                    // Calculate controller drag distance in controller space
                    const originDragDifference = TmpVectors.Vector3[0];
                    pointerInfo.pickInfo.ray.origin.subtractToRef(virtualMeshesInfo.lastOriginPosition, originDragDifference);
                    virtualMeshesInfo.lastOriginPosition.copyFrom(pointerInfo.pickInfo.ray.origin);
                    const localOriginDragDifference = -Vector3.Dot(originDragDifference, pointerInfo.pickInfo.ray.direction);

                    virtualMeshesInfo.originMesh.addChild(virtualMeshesInfo.dragMesh);
                    virtualMeshesInfo.originMesh.addChild(virtualMeshesInfo.pivotMesh);

                    this._applyZOffset(virtualMeshesInfo.dragMesh, localOriginDragDifference, zDragFactor);
                    this._applyZOffset(virtualMeshesInfo.pivotMesh, localOriginDragDifference, zDragFactor);

                    // Update the controller position
                    // In case of near interaction, ray origin is finger tip
                    virtualMeshesInfo.originMesh.position.copyFrom(pointerInfo.pickInfo.ray.origin);
                    const lookAt = TmpVectors.Vector3[0];
                    if (pointerInfo.pickInfo.originMesh) {
                        // Near interaction
                        lookAt.copyFrom(this._pointerCamera!.globalPosition);
                    } else {
                        pointerInfo.pickInfo.ray.origin.addToRef(pointerInfo.pickInfo.ray.direction, lookAt);
                    }
                    virtualMeshesInfo.originMesh.lookAt(lookAt);

                    virtualMeshesInfo.originMesh.removeChild(virtualMeshesInfo.dragMesh);
                    virtualMeshesInfo.originMesh.removeChild(virtualMeshesInfo.pivotMesh);

                    // Get change in rotation
                    this._tmpQuaternion.copyFrom(virtualMeshesInfo.startingPivotOrientation);
                    this._tmpQuaternion.x = -this._tmpQuaternion.x;
                    this._tmpQuaternion.y = -this._tmpQuaternion.y;
                    this._tmpQuaternion.z = -this._tmpQuaternion.z;
                    virtualMeshesInfo.pivotMesh.rotationQuaternion!.multiplyToRef(this._tmpQuaternion, this._tmpQuaternion);
                    virtualMeshesInfo.pivotMesh.position.subtractToRef(virtualMeshesInfo.startingPivotPosition, this._tmpVector);
                    this.onDragObservable.notifyObservers({ delta: this._tmpVector, position: virtualMeshesInfo.pivotMesh.position, pickInfo: pointerInfo.pickInfo });

                    // Notify herited methods and observables
                    this._targetDrag(this._tmpVector, this._tmpQuaternion, pointerId);
                    virtualMeshesInfo.lastDragPosition.copyFrom(virtualMeshesInfo.dragMesh.absolutePosition);

                    this._moving = true;
                }
            }
        });
    }

    private _applyZOffset(node: TransformNode, localOriginDragDifference: number, zDragFactor: number) {
        // Determine how much the controller moved to/away towards the dragged object and use this to move the object further when its further away
        node.position.z -= node.position.z < 1 ? localOriginDragDifference * zDragFactor : localOriginDragDifference * zDragFactor * node.position.z;
        if (node.position.z < 0) {
            node.position.z = 0;
        }
    }

    protected _targetDragStart(worldPosition: Vector3, worldRotation: Quaternion, pointerId: number) {
        // Herited classes can override that
    }

    protected _targetDrag(worldDeltaPosition: Vector3, worldDeltaRotation: Quaternion, pointerId: number) {
        // Herited classes can override that
    }

    protected _targetDragEnd(pointerId: number) {
        // Herited classes can override that
    }

    /**
     * Detaches the behavior from the mesh
     */
    public detach(): void {
        if (this._scene) {
            if (this.detachCameraControls && this._attachedToElement && this._pointerCamera && !this._pointerCamera.leftCamera) {
                this._pointerCamera.attachControl(true);
                this._attachedToElement = false;
            }
            this._scene.onPointerObservable.remove(this._pointerObserver);
        }

        for (let pointerId in this._virtualMeshesInfo) {
            this._virtualMeshesInfo[pointerId].originMesh.dispose();
            this._virtualMeshesInfo[pointerId].dragMesh.dispose();
        }

        this.onDragEndObservable.clear();
        this.onDragObservable.clear();
        this.onDragStartObservable.clear();
    }
}
