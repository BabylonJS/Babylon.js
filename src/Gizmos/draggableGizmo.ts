import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import { PointerInfo } from "../Events/pointerEvents";
import { Color3 } from "../Maths/math.color";
import { Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Observable, Observer } from "../Misc/observable";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Nullable } from "../types";
import { Gizmo } from "./gizmo";
import { GizmoMaterialSwitcher } from "./gizmoMaterialSwitcher";
/**
 * Common base for several draggable gizmos
 */
export class DraggableGizmo extends Gizmo {
    /**
     * Drag behavior responsible for the gizmos dragging interactions
     */
    public dragBehavior: PointerDragBehavior;
    /**
     * Drag distance in babylon units that the gizmo will snap to when dragged (Default: 0)
     */
    public snapDistance = 0;
    /**
     * Event that fires each time the gizmo snaps to a new location.
     * * snapDistance is the the change in distance
     */
    public onSnapObservable = new Observable<{ snapDistance: number }>();

    protected _pointerObserver: Nullable<Observer<PointerInfo>> = null;
    protected _materialSwitcher: GizmoMaterialSwitcher;

    protected _isEnabled: boolean = true;
    protected _parent: Nullable<Gizmo> = null;

    /**
     * Creates an InteractableGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param color The color of the gizmo
     */
    constructor(
        dragOptions: { dragAxis?: Vector3; dragPlaneNormal?: Vector3 },
        color: Color3,
        gizmoLayer: UtilityLayerRenderer,
        parent: Nullable<Gizmo>
    ) {
        super(gizmoLayer);
        this._parent = parent;

        // Add drag behavior to handle events when the gizmo is dragged
        this.dragBehavior = new PointerDragBehavior(dragOptions);
        this.dragBehavior.moveAttached = false;
        this._rootMesh.addBehavior(this.dragBehavior);

        // Create Material Switcher
        this._materialSwitcher = new GizmoMaterialSwitcher(
            color,
            this.dragBehavior,
            gizmoLayer._getSharedGizmoLight(),
            gizmoLayer.utilityLayerScene
        );
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
        } else {
            if (this._parent) {
                this.attachedMesh = this._parent.attachedMesh;
            }
        }
    }
    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    /**
     * Instance of GizmoMaterialSwitcher
     */
    public get materialSwitcher() {
        return this._materialSwitcher;
    }

    /**
     * Disposes of the gizmo
     */
    public dispose() {
        this.onSnapObservable.clear();
        this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(
            this._pointerObserver
        );
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
