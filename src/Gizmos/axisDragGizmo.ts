import { Color3 } from "../Maths/math.color";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { CylinderBuilder } from "../Meshes/Builders/cylinderBuilder";
import { Mesh } from "../Meshes/mesh";
import { TransformNode } from "../Meshes/transformNode";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Scene } from "../scene";
import { Nullable } from "../types";
import { DraggableGizmo } from "./draggableGizmo";
import { PositionGizmo } from "./positionGizmo";
import { StandardMaterial } from "../Materials/standardMaterial";
/**
 * Single axis drag gizmo
 */
export class AxisDragGizmo extends DraggableGizmo {
    private _arrow: TransformNode;

    /** @hidden */
    public static _CreateArrow(scene: Scene, material: Nullable<StandardMaterial> = null): TransformNode {
        var arrow = new TransformNode("arrow", scene);
        var cylinder = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0, height: 0.075, diameterBottom: 0.0375, tessellation: 96 }, scene);
        var line = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0.005, height: 0.275, diameterBottom: 0.005, tessellation: 96 }, scene);
        cylinder.parent = arrow;
        line.parent = arrow;

        // Position arrow pointing in its drag axis
        cylinder.material = material;
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
     * @param dragAxis The axis which the gizmo will be able to drag on
     * @param color The color of the gizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     */
    constructor(dragAxis: Vector3, color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, parent: Nullable<PositionGizmo> = null) {
        super({ dragAxis }, color, gizmoLayer, parent);

        // Build mesh on root node
        this._arrow = AxisDragGizmo._CreateArrow(gizmoLayer.utilityLayerScene);

        this._arrow.lookAt(this._rootMesh.position.add(dragAxis));
        this._arrow.scaling.scaleInPlace(1 / 3);
        this._arrow.parent = this._rootMesh;

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
