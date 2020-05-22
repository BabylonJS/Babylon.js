import { Color3 } from "../Maths/math.color";
import { Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { BoxBuilder } from "../Meshes/Builders/boxBuilder";
import { CylinderBuilder } from "../Meshes/Builders/cylinderBuilder";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Nullable } from "../types";
import { DraggableGizmo } from "./draggableGizmo";
import { ScaleGizmo } from "./scaleGizmo";

/**
 * Single axis scale gizmo
 */
export class AxisScaleGizmo extends DraggableGizmo {
    /**
     * Scale proportionally
     */
    public uniformScaling = false;
    /**
     * Custom sensitivity value for the drag strength
     */
    public sensitivity = 1;

    private _arrow: AbstractMesh;

    /**
     * Creates an AxisScaleGizmo
     * @param dragAxis The axis which the gizmo will be able to scale on
     * @param color The color of the gizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     */
    constructor(dragAxis: Vector3, color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, parent: Nullable<ScaleGizmo> = null) {
        super({ dragAxis }, color, gizmoLayer, parent);

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
}
