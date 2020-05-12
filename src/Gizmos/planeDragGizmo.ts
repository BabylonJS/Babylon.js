import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import { PointerInfo } from "../Events/pointerEvents";
import { Color3 } from "../Maths/math.color";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { PlaneBuilder } from "../Meshes/Builders/planeBuilder";
import { Mesh } from "../Meshes/mesh";
import { TransformNode } from "../Meshes/transformNode";
import { Observable, Observer } from "../Misc/observable";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Scene } from "../scene";
import { Nullable } from "../types";
import { Gizmo } from "./gizmo";
import { GizmoMaterialSwitcher } from "./gizmoMaterialSwitcher";
import { PositionGizmo } from "./positionGizmo";
/**
 * Single plane drag gizmo
 */
export class PlaneDragGizmo extends Gizmo {
    /**
     * Drag behavior responsible for the gizmos dragging interactions
     */
    public dragBehavior: PointerDragBehavior;
    private _pointerObserver: Nullable<Observer<PointerInfo>> = null;
    /**
     * Drag distance in babylon units that the gizmo will snap to when dragged (Default: 0)
     */
    public snapDistance = 0;
    /**
     * Event that fires each time the gizmo snaps to a new location.
     * * snapDistance is the the change in distance
     */
    public onSnapObservable = new Observable<{ snapDistance: number }>();

    private _plane: TransformNode;
    private _materialSwitcher: GizmoMaterialSwitcher;

    private _isEnabled: boolean = false;
    private _parent: Nullable<PositionGizmo> = null;

    /** @hidden */
    public static _CreatePlane(scene: Scene): TransformNode {
        var plane = new TransformNode("plane", scene);

        //make sure plane is double sided
        var dragPlane = PlaneBuilder.CreatePlane("dragPlane", { width: .1375, height: .1375, sideOrientation: 2 }, scene);
        dragPlane.parent = plane;
        return plane;
    }

    /**
     * Creates a PlaneDragGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param dragPlaneNormal The axis normal to which the gizmo will be able to drag on
     * @param color The color of the gizmo
     */
    constructor(dragPlaneNormal: Vector3, color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, parent: Nullable<PositionGizmo> = null) {
        super(gizmoLayer);
        this._parent = parent;

        // Build plane mesh on root node
        this._plane = PlaneDragGizmo._CreatePlane(gizmoLayer.utilityLayerScene);

        this._plane.lookAt(this._rootMesh.position.add(dragPlaneNormal));
        this._plane.scaling.scaleInPlace(1 / 3);
        this._plane.parent = this._rootMesh;

        // Add dragPlaneNormal drag behavior to handle events when the gizmo is dragged
        this.dragBehavior = new PointerDragBehavior({ dragPlaneNormal: dragPlaneNormal });
        this.dragBehavior.moveAttached = false;
        this._rootMesh.addBehavior(this.dragBehavior);

        // Create Material Switcher
        this._materialSwitcher = new GizmoMaterialSwitcher(
            color,
            this.dragBehavior,
            gizmoLayer._getSharedGizmoLight(),
            gizmoLayer.utilityLayerScene
        );
        this._materialSwitcher.registerMeshes(
            this._rootMesh.getChildMeshes(false)
        );

        var currentSnapDragDistance = 0;
        var tmpVector = new Vector3();
        var tmpSnapEvent = { snapDistance: 0 };

        var localDelta = new Vector3();
        var tmpMatrix = new Matrix();
        this.dragBehavior.onDragObservable.add((event) => {
            if (this.attachedMesh) {
                // Convert delta to local translation if it has a parent
                if (this.attachedMesh.parent) {
                    this.attachedMesh.parent.computeWorldMatrix().invertToRef(tmpMatrix);
                    tmpMatrix.setTranslationFromFloats(0, 0, 0);
                    Vector3.TransformCoordinatesToRef(event.delta, tmpMatrix, localDelta);
                } else {
                    localDelta.copyFrom(event.delta);
                }
                // Snapping logic
                if (this.snapDistance == 0) {
                    this.attachedMesh.position.addInPlace(localDelta);
                } else {
                    currentSnapDragDistance += event.dragDistance;
                    if (Math.abs(currentSnapDragDistance) > this.snapDistance) {
                        var dragSteps = Math.floor(Math.abs(currentSnapDragDistance) / this.snapDistance);
                        currentSnapDragDistance = currentSnapDragDistance % this.snapDistance;
                        localDelta.normalizeToRef(tmpVector);
                        tmpVector.scaleInPlace(this.snapDistance * dragSteps);
                        this.attachedMesh.position.addInPlace(tmpVector);
                        tmpSnapEvent.snapDistance = this.snapDistance * dragSteps;
                        this.onSnapObservable.notifyObservers(tmpSnapEvent);
                    }
                }
            }
        });
    }

    protected _attachedMeshChanged(value: Nullable<AbstractMesh>) {
        if (this.dragBehavior) {
            this.dragBehavior.enabled = value ? true : false;
        }
    }

    /**
     * If the gizmo is enabled
     */
    public set isEnabled(value: boolean) {
        this._isEnabled = value;
        if (!value) {
            this.attachedMesh = null;
        }
        else {
            if (this._parent) {
                this.attachedMesh = this._parent.attachedMesh;
            }
        }
    }
    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    public get materialSwitcher() {
        return this._materialSwitcher;
    }

    /**
     * Disposes of the gizmo
     */
    public dispose() {
        this.onSnapObservable.clear();
        this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
        this.dragBehavior.detach();
        this._materialSwitcher.dispose();
        super.dispose();
    }

    /**
     * Disposes and replaces the current meshes in the gizmo with the specified mesh
     * @param mesh The mesh to replace the default mesh of the gizmo
     * @param useGizmoMaterials If the gizmo's default materials should be used (default: false)
     */
    public setCustomMesh(mesh: Mesh, useGizmoMaterials: boolean = false) {
        this._materialSwitcher.unregisterMeshes(
            this._rootMesh.getChildMeshes()
        );

        super.setCustomMesh(mesh);

        if (useGizmoMaterials) {
            this._materialSwitcher.registerMeshes(
                this._rootMesh.getChildMeshes()
            );
        }
    }
}
