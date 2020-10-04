import { Observer, Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { PointerInfo } from "../Events/pointerEvents";
import { Vector3, Matrix } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Node } from "../node";
import { Mesh } from "../Meshes/mesh";
import { LinesMesh } from "../Meshes/linesMesh";
import { BoxBuilder } from "../Meshes/Builders/boxBuilder";
import { CylinderBuilder } from "../Meshes/Builders/cylinderBuilder";
import { StandardMaterial } from "../Materials/standardMaterial";
import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import { Gizmo } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { ScaleGizmo } from "./scaleGizmo";
import { Color3 } from '../Maths/math.color';

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

    private _gizmoMesh: Mesh;
    private _coloredMaterial: StandardMaterial;
    private _hoverMaterial: StandardMaterial;
    private _disableMaterial: StandardMaterial;
    private _eventListeners: any[] = [];

    /**
     * Creates an AxisScaleGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param dragAxis The axis which the gizmo will be able to scale on
     * @param color The color of the gizmo
     * @param thickness display gizmo axis thickness
     */
    constructor(dragAxis: Vector3, color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, parent: Nullable<ScaleGizmo> = null, thickness: number = 1) {
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

        // Build mesh + Collider
        this._gizmoMesh = new Mesh("axis", gizmoLayer.utilityLayerScene);
        const { arrowMesh, arrowTail } = this._createGizmoMesh(this._gizmoMesh, thickness);
        this._createGizmoMesh(this._gizmoMesh, thickness * 4, true);

        this._gizmoMesh.lookAt(this._rootMesh.position.add(dragAxis));
        this._rootMesh.addChild(this._gizmoMesh);
        this._gizmoMesh.scaling.scaleInPlace(1 / 3);

        // Closure of inital prop values for resetting
        const nodePosition = arrowMesh.position.clone();
        const linePosition = arrowTail.position.clone();
        const lineScale = arrowTail.scaling.clone();

        const increaseGizmoMesh = (dragDistance: number) => {
            const dragStrength = this.sensitivity * dragDistance * ((this.scaleRatio * 3) / this._rootMesh.scaling.length());
            const scalar = 1; // This will increase the rate of gizmo size on drag
            const originalScale = arrowTail.scaling.y;
            const newScale = originalScale + dragStrength * scalar;
            const newMeshPosition = arrowMesh.position.z + ((newScale - originalScale) / 4);
            if (newMeshPosition >= 0) {
                arrowMesh.position.z = newMeshPosition;
                arrowTail.scaling.y = newScale;
                arrowTail.position.z = arrowMesh.position.z / 2;
            }
        };

        const resetGizmoMesh = () => {
            arrowMesh.position = new Vector3(nodePosition.x, nodePosition.y, nodePosition.z);
            arrowTail.position = new Vector3(linePosition.x, linePosition.y, linePosition.z);
            arrowTail.scaling = new Vector3(lineScale.x, lineScale.y, lineScale.z);
        };

        // Add drag behavior to handle events when the gizmo is dragged
        this.dragBehavior = new PointerDragBehavior({ dragAxis: dragAxis });
        this.dragBehavior.moveAttached = false;
        this._rootMesh.addBehavior(this.dragBehavior);

        var currentSnapDragDistance = 0;
        var tmpVector = new Vector3();
        var tmpSnapEvent = { snapDistance: 0 };
        this.dragBehavior.onDragObservable.add((event) => {
            if (this.attachedNode) {
                // Drag strength is modified by the scale of the gizmo (eg. for small objects like boombox the strength will be increased to match the behavior of larger objects)
                var dragStrength = this.sensitivity * event.dragDistance * ((this.scaleRatio * 3) / this._rootMesh.scaling.length());

                // Snapping logic
                var snapped = false;
                var dragSteps = 0;
                if (this.uniformScaling) {
                    this.attachedNode.getWorldMatrix().decompose(tmpVector);
                    tmpVector.normalize();
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

                const scalingMatrix = new Matrix();
                Matrix.ScalingToRef(1 + tmpVector.x, 1 + tmpVector.y, 1 + tmpVector.z, scalingMatrix);
                this.attachedNode.getWorldMatrix().copyFrom(scalingMatrix.multiply(this.attachedNode.getWorldMatrix()));

                if (snapped) {
                    tmpSnapEvent.snapDistance = this.snapDistance * dragSteps;
                    this.onSnapObservable.notifyObservers(tmpSnapEvent);
                }
                this._matrixChanged();
            }
        });
        // On Drag Listener: to move gizmo mesh with user action
        this.dragBehavior.onDragObservable.add((e) => increaseGizmoMesh(e.dragDistance));
        this.dragBehavior.onDragEndObservable.add(resetGizmoMesh);

        // Listeners for Universal Scalar
        document.addEventListener('universalGizmoDrag', (e) => increaseGizmoMesh((e as any).detail));
        document.addEventListener('universalGizmoEnd', resetGizmoMesh);
        this._eventListeners.push({listener: 'universalGizmoDrag', fn: increaseGizmoMesh });
        this._eventListeners.push({listener: 'universalGizmoEnd', fn: resetGizmoMesh });

        const cache: any = {
            material: this._coloredMaterial,
            hoverMaterial: this._hoverMaterial,
            disableMaterial: this._disableMaterial,
            active: false
        };
        this._parent?.addToAxisCache(this._gizmoMesh, cache);

        this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo) => {
            if (this._customMeshSet) {
                return;
            }
            this._isHovered = !!(pointerInfo.pickInfo && (this._rootMesh.getChildMeshes().indexOf(<Mesh>pointerInfo.pickInfo.pickedMesh) != -1));
            if (!this._parent) {
                var material = this._isHovered ? this._hoverMaterial : this._coloredMaterial;
                this._rootMesh.getChildMeshes().forEach((m) => {
                    m.material = material;
                    if ((<LinesMesh>m).color) {
                        (<LinesMesh>m).color = material.diffuseColor;
                    }
                });
            }
        });

        var light = gizmoLayer._getSharedGizmoLight();
        light.includedOnlyMeshes = light.includedOnlyMeshes.concat(this._rootMesh.getChildMeshes());
    }

    /** Create Geometry for Gizmo */
    private _createGizmoMesh(parentMesh: AbstractMesh, thickness: number, isCollider = false) {
        var arrowMesh = BoxBuilder.CreateBox("yPosMesh", { size: 0.4 * (1 + (thickness - 1) / 4) }, this.gizmoLayer.utilityLayerScene);
        var arrowTail = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0.005 * thickness, height: 0.275, diameterBottom: 0.005 * thickness, tessellation: 96 }, this.gizmoLayer.utilityLayerScene);

        // Position arrow pointing in its drag axis
        arrowMesh.scaling.scaleInPlace(0.1);
        arrowMesh.material = this._coloredMaterial;
        arrowMesh.rotation.x = Math.PI / 2;
        arrowMesh.position.z += 0.3;

        arrowTail.material = this._coloredMaterial;
        arrowTail.position.z += 0.275 / 2;
        arrowTail.rotation.x = Math.PI / 2;

        if (isCollider) {
            arrowMesh.name = 'ignore';
            arrowMesh.visibility = 0;
            arrowTail.name = 'ignore';
            arrowTail.visibility = 0;
        }

        parentMesh.addChild(arrowMesh);
        parentMesh.addChild(arrowTail);

        return { arrowMesh, arrowTail };
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
        this._eventListeners.forEach((e) => {
            document.addEventListener(e.listener, e.fn, false);
        });
        super.dispose();
    }

    /**
     * Disposes and replaces the current meshes in the gizmo with the specified mesh
     * @param mesh The mesh to replace the default mesh of the gizmo
     * @param useGizmoMaterial If the gizmo's default material should be used (default: false)
     */
    public setCustomMesh(mesh: Mesh, useGizmoMaterial: boolean = false) {
        super.setCustomMesh(mesh);
        if (useGizmoMaterial) {
            this._rootMesh.getChildMeshes().forEach((m) => {
                m.material = this._coloredMaterial;
                if ((<LinesMesh>m).color) {
                    (<LinesMesh>m).color = this._coloredMaterial.diffuseColor;
                }
            });
            this._customMeshSet = false;
        }
    }
}
