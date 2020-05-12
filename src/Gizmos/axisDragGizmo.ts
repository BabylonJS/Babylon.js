import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import { PointerInfo } from "../Events/pointerEvents";
import { Color3 } from "../Maths/math.color";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { CylinderBuilder } from "../Meshes/Builders/cylinderBuilder";
import { Mesh } from "../Meshes/mesh";
import { TransformNode } from "../Meshes/transformNode";
import { Observable, Observer } from "../Misc/observable";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Scene } from "../scene";
import { Nullable } from "../types";
import { Gizmo } from "./gizmo";
import { GizmoMaterialSwitcher } from "./gizmoMaterialSwitcher";
import { PositionGizmo } from "./positionGizmo";
import { StandardMaterial } from "../Materials/standardMaterial";
/**
 * Single axis drag gizmo
 */
export class AxisDragGizmo extends Gizmo {
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

    private _isEnabled: boolean = true;
    private _parent: Nullable<PositionGizmo> = null;

    private _arrow: TransformNode;
    private _materialSwitcher: GizmoMaterialSwitcher;

    /** @hidden */
    public static _CreateArrow(scene: Scene, material?: StandardMaterial): TransformNode {
        var arrow = new TransformNode("arrow", scene);
        var cylinder = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0, height: 0.075, diameterBottom: 0.0375, tessellation: 96 }, scene);
        var line = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0.005, height: 0.275, diameterBottom: 0.005, tessellation: 96 }, scene);
        cylinder.parent = arrow;
        line.parent = arrow;

        // Position arrow pointing in its drag axis
        cylinder.material = material ?? null;
        cylinder.rotation.x = Math.PI / 2;
        cylinder.position.z += 0.3;
        line.position.z += 0.275 / 2;
        line.rotation.x = Math.PI / 2;
        return arrow;
    }

    /** @hidden */
    public static _CreateArrowInstance(scene: Scene, arrow: TransformNode): TransformNode {
        const instance = new TransformNode("arrow", scene);
        for (const mesh of arrow.getChildMeshes()) {
            const childInstance = (mesh as Mesh).createInstance(mesh.name);
            childInstance.parent = instance;
        }
        return instance;
    }

    /**
     * Creates an AxisDragGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param dragAxis The axis which the gizmo will be able to drag on
     * @param color The color of the gizmo
     */
    constructor(dragAxis: Vector3, color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, parent: Nullable<PositionGizmo> = null) {
        super(gizmoLayer);
        this._parent = parent;

        // Build mesh on root node
        this._arrow = AxisDragGizmo._CreateArrow(gizmoLayer.utilityLayerScene);

        this._arrow.lookAt(this._rootMesh.position.add(dragAxis));
        this._arrow.scaling.scaleInPlace(1 / 3);
        this._arrow.parent = this._rootMesh;

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
