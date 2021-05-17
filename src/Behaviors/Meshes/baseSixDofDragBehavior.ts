import { Behavior } from "../../Behaviors/behavior";
import { Mesh } from "../../Meshes/mesh";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { PointerInfo, PointerEventTypes } from "../../Events/pointerEvents";
import { Vector3, Quaternion } from "../../Maths/math.vector";
import { Observer, Observable } from "../../Misc/observable";
import { Camera } from "../../Cameras/camera";
import { TransformNode } from "../../Meshes";

/**
 * Base behavior for six degrees of freedom interactions in XR experiences.
 * Creates virtual meshes that are dragged around
 * And observables for position/rotation changes
 */
export class BaseSixDofDragBehavior implements Behavior<Mesh> {
    private static _virtualScene: Scene;
    private _pointerObserver: Nullable<Observer<PointerInfo>>;
    private _attachedToElement: boolean = false;
    private _virtualDragMesh: AbstractMesh;
    private _virtualOriginMesh: AbstractMesh;
    private _virtualDragMeshStartingPosition: Vector3 = new Vector3();
    private _virtualDragMeshStartingOrientation: Quaternion = new Quaternion();
    private _tmpVector: Vector3 = new Vector3();
    private _tmpQuaternion: Quaternion = new Quaternion();

    protected _scene: Scene;
    protected _moving = false;
    protected _ownerNode: Mesh;
    protected _draggedMesh: Nullable<AbstractMesh>;

    // TODO
    protected _draggableMeshes: Nullable<AbstractMesh[]> = null;

    /**
     * Sets an ancestor node to drag instead of the attached node.
     * All dragging induced by this behavior will happen on the ancestor node, while the relative position/orientation/scaling
     * between the ancestor node and child node will be kept the same.
     * This is useful if the attached node is acting as an anchor to move its hierarchy, and you don't want the ancestor node to be the one to receive the pointer inputs.
     * NB : This property must be set to an actual ancestor of the attached node, or else the dragging behavior will have an undefined result.
     */
    public ancestorToDrag: Nullable<TransformNode> = null;

    /**
     * How much faster the object should move when the controller is moving towards it. This is useful to bring objects that are far away from the user to them faster. Set this to 0 to avoid any speed increase. (Default: 3)
     */
    public zDragFactor = 3;
    /**
     * If the behavior is currently in a dragging state
     */
    public dragging = false;
    /**
     * The id of the pointer that is currently interacting with the behavior (-1 when no pointer is active)
     */
    public currentDraggingPointerID = -1;
    /**
     * If camera controls should be detached during the drag
     */
    public detachCameraControls = true;

    /**
     * Fires each time a drag starts
     */
    public onDragStartObservable = new Observable<{}>();
    /**
     * Fires each time a drag happens
     */
    public onDragObservable = new Observable<void>();
    /**
     *  Fires each time a drag ends (eg. mouse release after drag)
     */
    public onDragEndObservable = new Observable<{}>();

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

    /**
     * Attaches the scale behavior the passed in mesh
     * @param ownerNode The mesh that will be scaled around once attached
     */
    public attach(ownerNode: Mesh): void {
        this._ownerNode = ownerNode;
        this._scene = this._ownerNode.getScene();
        if (!BaseSixDofDragBehavior._virtualScene) {
            BaseSixDofDragBehavior._virtualScene = new Scene(this._scene.getEngine(), { virtual: true });
            BaseSixDofDragBehavior._virtualScene.detachControl();
        }

        var lastSixDofOriginPosition = new Vector3(0, 0, 0);

        // Setup virtual meshes to be used for dragging without dirtying the existing scene
        this._virtualOriginMesh = new AbstractMesh("", BaseSixDofDragBehavior._virtualScene);
        this._virtualOriginMesh.rotationQuaternion = new Quaternion();
        this._virtualDragMesh = new AbstractMesh("", BaseSixDofDragBehavior._virtualScene);
        this._virtualDragMesh.rotationQuaternion = new Quaternion();

        var pickPredicate = (m: AbstractMesh) => {
            return this._ownerNode == m || m.isDescendantOf(this._ownerNode);
        };
        this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo, eventState) => {
            if (pointerInfo.type == PointerEventTypes.POINTERDOWN) {
                if (
                    !this.dragging &&
                    pointerInfo.pickInfo &&
                    pointerInfo.pickInfo.hit &&
                    pointerInfo.pickInfo.pickedMesh &&
                    pointerInfo.pickInfo.pickedPoint &&
                    pointerInfo.pickInfo.ray &&
                    pickPredicate(pointerInfo.pickInfo.pickedMesh)
                ) {
                    if (this._pointerCamera && this._pointerCamera.cameraRigMode === Camera.RIG_MODE_NONE) {
                        pointerInfo.pickInfo.ray.origin.copyFrom(this._pointerCamera.globalPosition);
                    }

                    const pickedMesh = this._ownerNode;
                    this._draggedMesh = pickedMesh;
                    lastSixDofOriginPosition.copyFrom(pointerInfo.pickInfo.ray.origin);

                    // Set position and orientation of the controller
                    this._virtualOriginMesh.position.copyFrom(pointerInfo.pickInfo.ray.origin);
                    this._virtualOriginMesh.lookAt(pointerInfo.pickInfo.ray.origin.add(pointerInfo.pickInfo.ray.direction));

                    // Attach the virtual drag mesh to the virtual origin mesh so it can be dragged
                    this._virtualOriginMesh.removeChild(this._virtualDragMesh);
                    this._virtualDragMesh.position.copyFrom(pointerInfo.pickInfo.pickedPoint);
                    this._virtualDragMeshStartingPosition.copyFrom(this._virtualDragMesh.position);
                    this._virtualDragMeshStartingOrientation.copyFrom(this._virtualDragMesh.rotationQuaternion!);
                    this._virtualOriginMesh.addChild(this._virtualDragMesh);

                    // Update state
                    this.dragging = true;
                    this.currentDraggingPointerID = (<PointerEvent>pointerInfo.event).pointerId;

                    // Detach camera controls
                    if (this.detachCameraControls && this._pointerCamera && !this._pointerCamera.leftCamera) {
                        if (this._pointerCamera.inputs && this._pointerCamera.inputs.attachedToElement) {
                            this._pointerCamera.detachControl();
                            this._attachedToElement = true;
                        } else {
                            this._attachedToElement = false;
                        }
                    }

                    this._targetDragStart(this._virtualDragMesh.absolutePosition, this._virtualDragMesh.rotationQuaternion!);
                    this.onDragStartObservable.notifyObservers({});
                }
            } else if (pointerInfo.type == PointerEventTypes.POINTERUP || pointerInfo.type == PointerEventTypes.POINTERDOUBLETAP) {
                if (this.currentDraggingPointerID == (<PointerEvent>pointerInfo.event).pointerId) {
                    this.dragging = false;
                    this._moving = false;
                    this.currentDraggingPointerID = -1;
                    this._draggedMesh = null;
                    this._virtualOriginMesh.removeChild(this._virtualDragMesh);

                    // Reattach camera controls
                    if (this.detachCameraControls && this._attachedToElement && this._pointerCamera && !this._pointerCamera.leftCamera) {
                        this._pointerCamera.attachControl(true);
                        this._attachedToElement = false;
                    }
                    this.onDragEndObservable.notifyObservers({});
                }
            } else if (pointerInfo.type == PointerEventTypes.POINTERMOVE) {
                if (
                    this.currentDraggingPointerID == (<PointerEvent>pointerInfo.event).pointerId &&
                    this.dragging &&
                    pointerInfo.pickInfo &&
                    pointerInfo.pickInfo.ray &&
                    this._draggedMesh
                ) {
                    var zDragFactor = this.zDragFactor;
                    if (this._pointerCamera && this._pointerCamera.cameraRigMode === Camera.RIG_MODE_NONE) {
                        pointerInfo.pickInfo.ray.origin.copyFrom(this._pointerCamera.globalPosition);
                        zDragFactor = 0;
                    }

                    // Calculate controller drag distance in controller space
                    var originDragDifference = pointerInfo.pickInfo.ray.origin.subtract(lastSixDofOriginPosition);
                    lastSixDofOriginPosition.copyFrom(pointerInfo.pickInfo.ray.origin);
                    var localOriginDragDifference = -Vector3.Dot(originDragDifference, pointerInfo.pickInfo.ray.direction);

                    this._virtualOriginMesh.addChild(this._virtualDragMesh);
                    // Determine how much the controller moved to/away towards the dragged object and use this to move the object further when its further away
                    this._virtualDragMesh.position.z -=
                        this._virtualDragMesh.position.z < 1
                            ? localOriginDragDifference * this.zDragFactor
                            : localOriginDragDifference * zDragFactor * this._virtualDragMesh.position.z;
                    if (this._virtualDragMesh.position.z < 0) {
                        this._virtualDragMesh.position.z = 0;
                    }

                    // Update the controller position
                    this._virtualOriginMesh.position.copyFrom(pointerInfo.pickInfo.ray.origin);
                    this._virtualOriginMesh.lookAt(pointerInfo.pickInfo.ray.origin.add(pointerInfo.pickInfo.ray.direction));
                    this._virtualOriginMesh.removeChild(this._virtualDragMesh);

                    // Get change in rotation
                    this._tmpQuaternion.copyFrom(this._virtualDragMeshStartingOrientation);
                    this._tmpQuaternion.x = -this._tmpQuaternion.x;
                    this._tmpQuaternion.y = -this._tmpQuaternion.y;
                    this._tmpQuaternion.z = -this._tmpQuaternion.z;
                    this._virtualDragMesh.rotationQuaternion!.multiplyToRef(this._tmpQuaternion, this._tmpQuaternion);
                    this._virtualDragMesh.position.subtractToRef(this._virtualDragMeshStartingPosition, this._tmpVector);

                    this._targetUpdated(this._tmpVector, this._tmpQuaternion);

                    this._moving = true;
                }
            }
        });
    }

    protected _targetDragStart(worldPosition: Vector3, worldRotation: Quaternion) {
        // Herited classes can override that
    }

    protected _targetUpdated(worldDeltaPosition: Vector3, worldDeltaRotation: Quaternion) {
        // Herited classes can override that
    }

    /**
     *  Detaches the behavior from the mesh
     */
    public detach(): void {
        if (this._scene) {
            if (this.detachCameraControls && this._attachedToElement && this._pointerCamera && !this._pointerCamera.leftCamera) {
                this._pointerCamera.attachControl(true);
                this._attachedToElement = false;
            }
            this._scene.onPointerObservable.remove(this._pointerObserver);
        }

        if (this._virtualOriginMesh) {
            this._virtualOriginMesh.dispose();
        }
        if (this._virtualDragMesh) {
            this._virtualDragMesh.dispose();
        }
        this.onDragEndObservable.clear();
        this.onDragObservable.clear();
        this.onDragStartObservable.clear();
    }
}
