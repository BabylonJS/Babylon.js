import { Observer, Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { PointerInfo } from "../Events/pointerEvents";
import { Vector3, Color3, Matrix } from "../Maths/math";
import { TransformNode } from "../Meshes/transformNode";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { LinesMesh } from "../Meshes/linesMesh";
import { CylinderBuilder } from "../Meshes/Builders/cylinderBuilder";
import { LinesBuilder } from "../Meshes/Builders/linesBuilder";
import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import { _TimeToken } from "../Instrumentation/timeToken";
import { _DepthCullingState, _StencilState, _AlphaState } from "../States/index";
import { Gizmo } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { StandardMaterial } from "../Materials/standardMaterial";
import { Scene } from "../scene";
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

    /** @hidden */
    public static _CreateArrow(scene: Scene, material: StandardMaterial): TransformNode {
        var arrow = new TransformNode("arrow", scene);
        var cylinder = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0, height: 1.5, diameterBottom: 0.75, tessellation: 96 }, scene);
        var line = LinesBuilder.CreateLines("line", { points: [new Vector3(0, 0, 0), new Vector3(0, 1.1, 0)] }, scene);
        line.color = material.emissiveColor;
        cylinder.parent = arrow;
        line.parent = arrow;

        // Position arrow pointing in its drag axis
        cylinder.scaling.scaleInPlace(0.05);
        cylinder.material = material;
        cylinder.rotation.x = Math.PI / 2;
        cylinder.position.z += 0.3;
        line.scaling.scaleInPlace(0.26);
        line.rotation.x = Math.PI / 2;
        line.material = material;
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
    constructor(dragAxis: Vector3, color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer) {
        super(gizmoLayer);

        // Create Material
        var coloredMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        coloredMaterial.disableLighting = true;
        coloredMaterial.emissiveColor = color;

        var hoverMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        hoverMaterial.disableLighting = true;
        hoverMaterial.emissiveColor = color.add(new Color3(0.3, 0.3, 0.3));

        // Build mesh on root node
        var arrow = AxisDragGizmo._CreateArrow(gizmoLayer.utilityLayerScene, coloredMaterial);

        arrow.lookAt(this._rootMesh.position.add(dragAxis));
        arrow.scaling.scaleInPlace(1 / 3);
        arrow.parent = this._rootMesh;

        var currentSnapDragDistance = 0;
        var tmpVector = new Vector3();
        var tmpSnapEvent = { snapDistance: 0 };
        // Add drag behavior to handle events when the gizmo is dragged
        this.dragBehavior = new PointerDragBehavior({ dragAxis: dragAxis });
        this.dragBehavior.moveAttached = false;
        this._rootMesh.addBehavior(this.dragBehavior);

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

        this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo) => {
            if (this._customMeshSet) {
                return;
            }
            var isHovered = pointerInfo.pickInfo && (this._rootMesh.getChildMeshes().indexOf(<Mesh>pointerInfo.pickInfo.pickedMesh) != -1);
            var material = isHovered ? hoverMaterial : coloredMaterial;
            this._rootMesh.getChildMeshes().forEach((m) => {
                m.material = material;
                if ((<LinesMesh>m).color) {
                    (<LinesMesh>m).color = material.emissiveColor;
                }
            });
        });
    }
    protected _attachedMeshChanged(value: Nullable<AbstractMesh>) {
        if (this.dragBehavior) {
            this.dragBehavior.enabled = value ? true : false;
        }
    }
    /**
     * Disposes of the gizmo
     */
    public dispose() {
        this.onSnapObservable.clear();
        this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
        this.dragBehavior.detach();
        super.dispose();
    }
}
