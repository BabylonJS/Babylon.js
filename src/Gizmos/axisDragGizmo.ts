import { Observer, Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { PointerInfo } from "../Events/pointerEvents";
import { Vector3 } from "../Maths/math.vector";
import { TransformNode } from "../Meshes/transformNode";
import { Node } from "../node";
import { Mesh } from "../Meshes/mesh";
import { CylinderBuilder } from "../Meshes/Builders/cylinderBuilder";
import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import { Gizmo, GizmoAxisCache } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { StandardMaterial } from "../Materials/standardMaterial";
import { Scene } from "../scene";
import { PositionGizmo } from "./positionGizmo";
import { Color3 } from '../Maths/math.color';
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

    private _gizmoMesh: Mesh;
    private _coloredMaterial: StandardMaterial;
    private _hoverMaterial: StandardMaterial;
    private _disableMaterial: StandardMaterial;
    private _dragging: boolean = false;

    /** @hidden */
    public static _CreateArrow(scene: Scene, material: StandardMaterial, thickness: number = 1, isCollider = false): TransformNode {
        var arrow = new TransformNode("arrow", scene);
        var cylinder = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0, height: 0.075, diameterBottom: 0.0375 * (1 + (thickness - 1) / 4), tessellation: 96 }, scene);
        var line = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0.005 * thickness, height: 0.275, diameterBottom: 0.005 * thickness, tessellation: 96 }, scene);

        // Position arrow pointing in its drag axis
        cylinder.parent = arrow;
        cylinder.material = material;
        cylinder.rotation.x = Math.PI / 2;
        cylinder.position.z += 0.3;

        line.parent = arrow;
        line.material = material;
        line.position.z += 0.275 / 2;
        line.rotation.x = Math.PI / 2;

        if (isCollider) {
            line.visibility = 0;
            cylinder.visibility = 0;
        }
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
     * @param thickness display gizmo axis thickness
     */
    constructor(dragAxis: Vector3, color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, parent: Nullable<PositionGizmo> = null, thickness: number = 1) {
        super(gizmoLayer);
        this._parent = parent;

        // Create Material
        this._coloredMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        this._coloredMaterial.diffuseColor = color;
        this._coloredMaterial.specularColor = color.subtract(new Color3(0.1, 0.1, 0.1));

        this._hoverMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        this._hoverMaterial.diffuseColor = Color3.Yellow();

        this._disableMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        this._disableMaterial.diffuseColor = Color3.Gray();
        this._disableMaterial.alpha = 0.4;

        // Build Mesh + Collider
        const arrow = AxisDragGizmo._CreateArrow(gizmoLayer.utilityLayerScene, this._coloredMaterial, thickness);
        const collider = AxisDragGizmo._CreateArrow(gizmoLayer.utilityLayerScene, this._coloredMaterial, thickness + 4, true);

        // Add to Root Node
        this._gizmoMesh = new Mesh("", gizmoLayer.utilityLayerScene);
        this._gizmoMesh.addChild((arrow as Mesh));
        this._gizmoMesh.addChild((collider as Mesh));

        this._gizmoMesh.lookAt(this._rootMesh.position.add(dragAxis));
        this._gizmoMesh.scaling.scaleInPlace(1 / 3);
        this._gizmoMesh.parent = this._rootMesh;

        var currentSnapDragDistance = 0;
        var tmpVector = new Vector3();
        var tmpSnapEvent = { snapDistance: 0 };
        // Add drag behavior to handle events when the gizmo is dragged
        this.dragBehavior = new PointerDragBehavior({ dragAxis: dragAxis });
        this.dragBehavior.moveAttached = false;
        this._rootMesh.addBehavior(this.dragBehavior);

        this.dragBehavior.onDragObservable.add((event) => {
            if (this.attachedNode) {
                // Keep world translation and use it to update world transform
                // if the node has parent, the local transform properties (position, rotation, scale)
                // will be recomputed in _matrixChanged function

                // Snapping logic
                if (this.snapDistance == 0) {
                    if ((this.attachedNode as any).position) { // Required for nodes like lights
                        (this.attachedNode as any).position.addInPlaceFromFloats(event.delta.x, event.delta.y, event.delta.z);
                    }

                    // use _worldMatrix to not force a matrix update when calling GetWorldMatrix especially with Cameras
                    this.attachedNode.getWorldMatrix().addTranslationFromFloats(event.delta.x, event.delta.y, event.delta.z);
                    this.attachedNode.updateCache();
                } else {
                    currentSnapDragDistance += event.dragDistance;
                    if (Math.abs(currentSnapDragDistance) > this.snapDistance) {
                        var dragSteps = Math.floor(Math.abs(currentSnapDragDistance) / this.snapDistance);
                        currentSnapDragDistance = currentSnapDragDistance % this.snapDistance;
                        event.delta.normalizeToRef(tmpVector);
                        tmpVector.scaleInPlace(this.snapDistance * dragSteps);
                        this.attachedNode.getWorldMatrix().addTranslationFromFloats(tmpVector.x, tmpVector.y, tmpVector.z);
                        this.attachedNode.updateCache();
                        tmpSnapEvent.snapDistance = this.snapDistance * dragSteps;
                        this.onSnapObservable.notifyObservers(tmpSnapEvent);
                    }
                }
                this._matrixChanged();
            }
        });
        this.dragBehavior.onDragStartObservable.add(() => { this._dragging = true; });
        this.dragBehavior.onDragEndObservable.add(() => { this._dragging = false; });

        var light = gizmoLayer._getSharedGizmoLight();
        light.includedOnlyMeshes = light.includedOnlyMeshes.concat(this._rootMesh.getChildMeshes(false));

        const cache: GizmoAxisCache = {
            gizmoMeshes: arrow.getChildMeshes() as Mesh[],
            colliderMeshes: collider.getChildMeshes() as Mesh[],
            material: this._coloredMaterial,
            hoverMaterial: this._hoverMaterial,
            disableMaterial: this._disableMaterial,
            active: false,
            dragBehavior: this.dragBehavior
        };
        this._parent?.addToAxisCache(collider as Mesh, cache);

        this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo) => {
            if (this._customMeshSet) {
                return;
            }
            this._isHovered = !!(cache.colliderMeshes.indexOf(<Mesh>pointerInfo?.pickInfo?.pickedMesh) != -1);
            if (!this._parent) {
                const material = this.dragBehavior.enabled ? (this._isHovered || this._dragging ? this._hoverMaterial : this._coloredMaterial) : this._disableMaterial;
                this._setGizmoMeshMaterial(cache.gizmoMeshes, material);
            }
        });

        this.dragBehavior.onEnabledObservable.add((newState) => {
            this._setGizmoMeshMaterial(cache.gizmoMeshes, newState ? cache.material : cache.disableMaterial);
        });
    }
    protected _attachedNodeChanged(value: Nullable<Node>) {
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
            this.attachedNode = null;
        }
        else {
            if (this._parent) {
                this.attachedMesh = this._parent.attachedMesh;
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
    public dispose() {
        this.onSnapObservable.clear();
        this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
        this.dragBehavior.detach();
        if (this._gizmoMesh) {
            this._gizmoMesh.dispose();
        }
        [this._coloredMaterial, this._hoverMaterial, this._disableMaterial].forEach((matl) => {
            if (matl) {
                matl.dispose();
            }
        });
        super.dispose();
    }
}
