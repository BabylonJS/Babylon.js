import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { PointerInfo } from "../Events/pointerEvents";
import { TmpVectors, Vector3 } from "../Maths/math.vector";
import { Color3 } from "../Maths/math.color";
import { TransformNode } from "../Meshes/transformNode";
import type { Node } from "../node";
import type { Mesh } from "../Meshes/mesh";
import { CreatePlane } from "../Meshes/Builders/planeBuilder";
import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import type { GizmoAxisCache, IGizmo } from "./gizmo";
import { Gizmo } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { StandardMaterial } from "../Materials/standardMaterial";
import type { Scene } from "../scene";
import type { PositionGizmo } from "./positionGizmo";

/**
 * Interface for plane drag gizmo
 */
export interface IPlaneDragGizmo extends IGizmo {
    /** Drag behavior responsible for the gizmos dragging interactions */
    dragBehavior: PointerDragBehavior;
    /** Drag distance in babylon units that the gizmo will snap to when dragged */
    snapDistance: number;
    /**
     * Event that fires each time the gizmo snaps to a new location.
     * * snapDistance is the change in distance
     */
    onSnapObservable: Observable<{ snapDistance: number }>;
    /** If the gizmo is enabled */
    isEnabled: boolean;

    /** Default material used to render when gizmo is not disabled or hovered */
    coloredMaterial: StandardMaterial;
    /** Material used to render when gizmo is hovered with mouse */
    hoverMaterial: StandardMaterial;
    /** Material used to render when gizmo is disabled. typically grey. */
    disableMaterial: StandardMaterial;
}

/**
 * Single plane drag gizmo
 */
export class PlaneDragGizmo extends Gizmo implements IPlaneDragGizmo {
    /**
     * Drag behavior responsible for the gizmos dragging interactions
     */
    public dragBehavior: PointerDragBehavior;
    protected _pointerObserver: Nullable<Observer<PointerInfo>> = null;
    /**
     * Drag distance in babylon units that the gizmo will snap to when dragged (Default: 0)
     */
    public snapDistance = 0;
    /**
     * Event that fires each time the gizmo snaps to a new location.
     * * snapDistance is the change in distance
     */
    public onSnapObservable = new Observable<{ snapDistance: number }>();

    protected _gizmoMesh: TransformNode;
    protected _coloredMaterial: StandardMaterial;
    protected _hoverMaterial: StandardMaterial;
    protected _disableMaterial: StandardMaterial;

    protected _isEnabled: boolean = false;
    protected _parent: Nullable<PositionGizmo> = null;
    protected _dragging: boolean = false;

    /** Default material used to render when gizmo is not disabled or hovered */
    public get coloredMaterial() {
        return this._coloredMaterial;
    }

    /** Material used to render when gizmo is hovered with mouse*/
    public get hoverMaterial() {
        return this._hoverMaterial;
    }

    /** Material used to render when gizmo is disabled. typically grey.*/
    public get disableMaterial() {
        return this._disableMaterial;
    }

    /**
     * @internal
     */
    public static _CreatePlane(scene: Scene, material: StandardMaterial): TransformNode {
        const plane = new TransformNode("plane", scene);

        //make sure plane is double sided
        const dragPlane = CreatePlane("dragPlane", { width: 0.1375, height: 0.1375, sideOrientation: 2 }, scene);
        dragPlane.material = material;
        dragPlane.parent = plane;
        return plane;
    }

    /**
     * Creates a PlaneDragGizmo
     * @param dragPlaneNormal The axis normal to which the gizmo will be able to drag on
     * @param color The color of the gizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param parent
     * @param hoverColor The color of the gizmo when hovering over and dragging
     * @param disableColor The Color of the gizmo when its disabled
     */
    constructor(
        dragPlaneNormal: Vector3,
        color: Color3 = Color3.Gray(),
        gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer,
        parent: Nullable<PositionGizmo> = null,
        hoverColor: Color3 = Color3.Yellow(),
        disableColor: Color3 = Color3.Gray()
    ) {
        super(gizmoLayer);
        this._parent = parent;
        // Create Material
        this._coloredMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        this._coloredMaterial.diffuseColor = color;
        this._coloredMaterial.specularColor = color.subtract(new Color3(0.1, 0.1, 0.1));

        this._hoverMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        this._hoverMaterial.diffuseColor = hoverColor;

        this._disableMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        this._disableMaterial.diffuseColor = disableColor;
        this._disableMaterial.alpha = 0.4;

        // Build plane mesh on root node
        this._gizmoMesh = PlaneDragGizmo._CreatePlane(gizmoLayer.utilityLayerScene, this._coloredMaterial);

        this._gizmoMesh.lookAt(this._rootMesh.position.add(dragPlaneNormal));
        this._gizmoMesh.scaling.scaleInPlace(1 / 3);
        this._gizmoMesh.parent = this._rootMesh;

        let currentSnapDragDistance = 0;
        const tmpVector = new Vector3();
        const tmpSnapEvent = { snapDistance: 0 };
        // Add dragPlaneNormal drag behavior to handle events when the gizmo is dragged
        this.dragBehavior = new PointerDragBehavior({ dragPlaneNormal: dragPlaneNormal });
        this.dragBehavior.moveAttached = false;
        this._rootMesh.addBehavior(this.dragBehavior);

        this.dragBehavior.onDragObservable.add((event) => {
            if (this.attachedNode) {
                // Keep world translation and use it to update world transform
                // if the node has parent, the local transform properties (position, rotation, scale)
                // will be recomputed in _matrixChanged function

                // Snapping logic
                if (this.snapDistance == 0) {
                    this.attachedNode.getWorldMatrix().getTranslationToRef(TmpVectors.Vector3[0]);
                    TmpVectors.Vector3[0].addToRef(event.delta, TmpVectors.Vector3[0]);
                    if (this.dragBehavior.validateDrag(TmpVectors.Vector3[0])) {
                        this.attachedNode.getWorldMatrix().addTranslationFromFloats(event.delta.x, event.delta.y, event.delta.z);
                    }
                } else {
                    currentSnapDragDistance += event.dragDistance;
                    if (Math.abs(currentSnapDragDistance) > this.snapDistance) {
                        const dragSteps = Math.floor(Math.abs(currentSnapDragDistance) / this.snapDistance);
                        currentSnapDragDistance = currentSnapDragDistance % this.snapDistance;
                        event.delta.normalizeToRef(tmpVector);
                        tmpVector.scaleInPlace(this.snapDistance * dragSteps);
                        this.attachedNode.getWorldMatrix().getTranslationToRef(TmpVectors.Vector3[0]);
                        TmpVectors.Vector3[0].addToRef(tmpVector, TmpVectors.Vector3[0]);
                        if (this.dragBehavior.validateDrag(TmpVectors.Vector3[0])) {
                            this.attachedNode.getWorldMatrix().addTranslationFromFloats(tmpVector.x, tmpVector.y, tmpVector.z);
                            tmpSnapEvent.snapDistance = this.snapDistance * dragSteps;
                            this.onSnapObservable.notifyObservers(tmpSnapEvent);
                        }
                    }
                }
                this._matrixChanged();
            }
        });
        this.dragBehavior.onDragStartObservable.add(() => {
            this._dragging = true;
        });
        this.dragBehavior.onDragEndObservable.add(() => {
            this._dragging = false;
        });

        const light = gizmoLayer._getSharedGizmoLight();
        light.includedOnlyMeshes = light.includedOnlyMeshes.concat(this._rootMesh.getChildMeshes(false));

        const cache: GizmoAxisCache = {
            gizmoMeshes: this._gizmoMesh.getChildMeshes() as Mesh[],
            colliderMeshes: this._gizmoMesh.getChildMeshes() as Mesh[],
            material: this._coloredMaterial,
            hoverMaterial: this._hoverMaterial,
            disableMaterial: this._disableMaterial,
            active: false,
            dragBehavior: this.dragBehavior,
        };
        this._parent?.addToAxisCache(this._gizmoMesh as Mesh, cache);

        this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo) => {
            if (this._customMeshSet) {
                return;
            }
            this._isHovered = !!(cache.colliderMeshes.indexOf(<Mesh>pointerInfo?.pickInfo?.pickedMesh) != -1);
            if (!this._parent) {
                const material = cache.dragBehavior.enabled ? (this._isHovered || this._dragging ? this._hoverMaterial : this._coloredMaterial) : this._disableMaterial;
                this._setGizmoMeshMaterial(cache.gizmoMeshes, material);
            }
        });

        this.dragBehavior.onEnabledObservable.add((newState) => {
            this._setGizmoMeshMaterial(cache.gizmoMeshes, newState ? this._coloredMaterial : this._disableMaterial);
        });
    }

    protected override _attachedNodeChanged(value: Nullable<Node>) {
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
            this.attachedNode = null;
        } else {
            if (this._parent) {
                this.attachedNode = this._parent.attachedNode;
            }
        }
    }

    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    /**
     * Disposes of the gizmo
     */
    public override dispose() {
        this.onSnapObservable.clear();
        this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
        this.dragBehavior.detach();
        super.dispose();
        if (this._gizmoMesh) {
            this._gizmoMesh.dispose();
        }
        const materials = [this._coloredMaterial, this._hoverMaterial, this._disableMaterial];
        for (const matl of materials) {
            if (matl) {
                matl.dispose();
            }
        }
    }
}
