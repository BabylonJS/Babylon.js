import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import { PointerInfo } from "../Events/pointerEvents";
import { Color3 } from "../Maths/math.color";
import { Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { BoxBuilder } from "../Meshes/Builders/boxBuilder";
import { CylinderBuilder } from "../Meshes/Builders/cylinderBuilder";
import { Mesh } from "../Meshes/mesh";
import { Observable, Observer } from "../Misc/observable";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Nullable } from "../types";
import { Gizmo } from "./gizmo";
import { GizmoMaterialSwitcher } from "./gizmoMaterialSwitcher";
import { ScaleGizmo } from "./scaleGizmo";

/**
 * Single axis scale gizmo
 */
export class AxisScaleGizmo extends Gizmo {
    /**
     * Drag behavior responsible for the gizmos dragging interactions
     */
    public dragBehavior: PointerDragBehavior;
    private _pointerObserver: Nullable<Observer<PointerInfo>> = null;
    /**
     * Scale distance in babylon units that the gizmo will snap to when dragged (Default: 0)
     */
    public snapDistance = 0;
    /**
     * Event that fires each time the gizmo snaps to a new location.
     * * snapDistance is the the change in distance
     */
    public onSnapObservable = new Observable<{ snapDistance: number }>();
    /**
     * If the scaling operation should be done on all axis (default: false)
     */
    public uniformScaling = false;
    /**
     * Custom sensitivity value for the drag strength
     */
    public sensitivity = 1;

    private _isEnabled: boolean = true;
    private _parent: Nullable<ScaleGizmo> = null;

    private _arrow: AbstractMesh;
    private _materialSwitcher: GizmoMaterialSwitcher;

    /**
     * Creates an AxisScaleGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param dragAxis The axis which the gizmo will be able to scale on
     * @param color The color of the gizmo
     */
    constructor(dragAxis: Vector3, color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, parent: Nullable<ScaleGizmo> = null) {
        super(gizmoLayer);
        this._parent = parent;

        // Build mesh on root node
        this._arrow = new AbstractMesh("", gizmoLayer.utilityLayerScene);
        var arrowMesh = BoxBuilder.CreateBox("yPosMesh", { size: 0.4 }, gizmoLayer.utilityLayerScene);
        var arrowTail = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0.005, height: 0.275, diameterBottom: 0.005, tessellation: 96 }, gizmoLayer.utilityLayerScene);
        this._arrow.addChild(arrowMesh);
        this._arrow.addChild(arrowTail);

        // Position arrow pointing in its drag axis
        arrowMesh.scaling.scaleInPlace(0.1);
        arrowMesh.rotation.x = Math.PI / 2;
        arrowMesh.position.z += 0.3;
        arrowTail.position.z += 0.275 / 2;
        arrowTail.rotation.x = Math.PI / 2;
        this._arrow.lookAt(this._rootMesh.position.add(dragAxis));
        this._rootMesh.addChild(this._arrow);
        this._arrow.scaling.scaleInPlace(1 / 3);

        // Add drag behavior to handle events when the gizmo is dragged
        this.dragBehavior = new PointerDragBehavior({ dragAxis: dragAxis });
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
        this.dragBehavior.onDragObservable.add((event) => {
            if (this.attachedMesh) {
                // Drag strength is modified by the scale of the gizmo (eg. for small objects like boombox the strength will be increased to match the behavior of larger objects)
                var dragStrength = this.sensitivity * event.dragDistance * ((this.scaleRatio * 3) / this._rootMesh.scaling.length());

                // Snapping logic
                var snapped = false;
                var dragSteps = 0;
                if (this.uniformScaling) {
                    this.attachedMesh.scaling.normalizeToRef(tmpVector);
                    if (tmpVector.y < 0) {
                        tmpVector.scaleInPlace(-1);
                    }
                } else {
                    tmpVector.copyFrom(dragAxis);
                }
                if (this.snapDistance == 0) {
                    tmpVector.scaleToRef(dragStrength, tmpVector);
                } else {
                    currentSnapDragDistance += dragStrength;
                    if (Math.abs(currentSnapDragDistance) > this.snapDistance) {
                        dragSteps = Math.floor(Math.abs(currentSnapDragDistance) / this.snapDistance);
                        if (currentSnapDragDistance < 0) {
                            dragSteps *= -1;
                        }
                        currentSnapDragDistance = currentSnapDragDistance % this.snapDistance;
                        tmpVector.scaleToRef(this.snapDistance * dragSteps, tmpVector);
                        snapped = true;
                    } else {
                        tmpVector.scaleInPlace(0);
                    }
                }

                this.attachedMesh.scaling.addInPlace(tmpVector);

                if (snapped) {
                    tmpSnapEvent.snapDistance = this.snapDistance * dragSteps;
                    this.onSnapObservable.notifyObservers(tmpSnapEvent);
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
