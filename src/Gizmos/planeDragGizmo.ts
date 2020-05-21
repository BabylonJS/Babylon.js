import { Color3 } from "../Maths/math.color";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { PlaneBuilder } from "../Meshes/Builders/planeBuilder";
import { TransformNode } from "../Meshes/transformNode";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Scene } from "../scene";
import { Nullable } from "../types";
import { DraggableGizmo } from "./draggableGizmo";
import { PositionGizmo } from "./positionGizmo";
/**
 * Single plane drag gizmo
 */
export class PlaneDragGizmo extends DraggableGizmo {
    private _plane: TransformNode;

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
        super({ dragPlaneNormal }, color, gizmoLayer, parent);
        this.isEnabled = false;

        // Build plane mesh on root node
        this._plane = PlaneDragGizmo._CreatePlane(gizmoLayer.utilityLayerScene);

        this._plane.lookAt(this._rootMesh.position.add(dragPlaneNormal));
        this._plane.scaling.scaleInPlace(1 / 3);
        this._plane.parent = this._rootMesh;

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
}
