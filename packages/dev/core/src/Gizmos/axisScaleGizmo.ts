import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { PointerInfo } from "../Events/pointerEvents";
import { Vector3, Matrix, TmpVectors } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Node } from "../node";
import { Mesh } from "../Meshes/mesh";
import type { LinesMesh } from "../Meshes/linesMesh";
import { CreateBox } from "../Meshes/Builders/boxBuilder";
import { CreateCylinder } from "../Meshes/Builders/cylinderBuilder";
import { StandardMaterial } from "../Materials/standardMaterial";
import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import type { GizmoAxisCache, IGizmo } from "./gizmo";
import { Gizmo } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import type { ScaleGizmo } from "./scaleGizmo";
import { Color3 } from "../Maths/math.color";
import type { TransformNode } from "../Meshes/transformNode";
import { Epsilon } from "../Maths/math.constants";

/**
 * Interface for axis scale gizmo
 */
export interface IAxisScaleGizmo extends IGizmo {
    /** Drag behavior responsible for the gizmos dragging interactions */
    dragBehavior: PointerDragBehavior;
    /** Drag distance in babylon units that the gizmo will snap to when dragged */
    snapDistance: number;
    /** Incremental snap scaling. When true, with a snapDistance of 0.1, scaling will be 1.1,1.2,1.3 instead of, when false: 1.1,1.21,1.33,... */
    incrementalSnap: boolean;
    /**
     * Event that fires each time the gizmo snaps to a new location.
     * * snapDistance is the change in distance
     */
    onSnapObservable: Observable<{ snapDistance: number }>;
    /** If the scaling operation should be done on all axis */
    uniformScaling: boolean;
    /** Custom sensitivity value for the drag strength */
    sensitivity: number;
    /** The magnitude of the drag strength (scaling factor) */
    dragScale: number;
    /** If the gizmo is enabled */
    isEnabled: boolean;

    /** Default material used to render when gizmo is not disabled or hovered */
    coloredMaterial: StandardMaterial;
    /** Material used to render when gizmo is hovered with mouse*/
    hoverMaterial: StandardMaterial;
    /** Material used to render when gizmo is disabled. typically grey.*/
    disableMaterial: StandardMaterial;
}

/**
 * Single axis scale gizmo
 */
export class AxisScaleGizmo extends Gizmo implements IAxisScaleGizmo {
    /**
     * Drag behavior responsible for the gizmos dragging interactions
     */
    public dragBehavior: PointerDragBehavior;
    protected _pointerObserver: Nullable<Observer<PointerInfo>> = null;
    /**
     * Scale distance in babylon units that the gizmo will snap to when dragged (Default: 0)
     */
    public snapDistance = 0;
    /**
     * Event that fires each time the gizmo snaps to a new location.
     * * snapDistance is the change in distance
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
    /**
     * The magnitude of the drag strength (scaling factor)
     */
    public dragScale = 1;

    /**
     * The minimal absolute scale per component. can be positive or negative but never smaller.
     */
    public static MinimumAbsoluteScale = Epsilon;

    /**
     * Incremental snap scaling (default is false). When true, with a snapDistance of 0.1, scaling will be 1.1,1.2,1.3 instead of, when false: 1.1,1.21,1.33,...
     */
    public incrementalSnap = false;

    protected _isEnabled: boolean = true;
    protected _parent: Nullable<ScaleGizmo> = null;

    protected _gizmoMesh: Mesh;
    protected _coloredMaterial: StandardMaterial;
    protected _hoverMaterial: StandardMaterial;
    protected _disableMaterial: StandardMaterial;
    protected _dragging: boolean = false;
    private _tmpVector = new Vector3(0, 0, 0);
    private _incrementalStartupValue = Vector3.Zero();

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
     * Creates an AxisScaleGizmo
     * @param dragAxis The axis which the gizmo will be able to scale on
     * @param color The color of the gizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param parent
     * @param thickness display gizmo axis thickness
     * @param hoverColor The color of the gizmo when hovering over and dragging
     * @param disableColor The Color of the gizmo when its disabled
     */
    constructor(
        dragAxis: Vector3,
        color: Color3 = Color3.Gray(),
        gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer,
        parent: Nullable<ScaleGizmo> = null,
        thickness: number = 1,
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

        // Build mesh + Collider
        this._gizmoMesh = new Mesh("axis", gizmoLayer.utilityLayerScene);
        const { arrowMesh, arrowTail } = this._createGizmoMesh(this._gizmoMesh, thickness);
        const collider = this._createGizmoMesh(this._gizmoMesh, thickness + 4, true);

        this._gizmoMesh.lookAt(this._rootMesh.position.add(dragAxis));
        this._rootMesh.addChild(this._gizmoMesh, Gizmo.PreserveScaling);
        this._gizmoMesh.scaling.scaleInPlace(1 / 3);

        // Closure of initial prop values for resetting
        const nodePosition = arrowMesh.position.clone();
        const linePosition = arrowTail.position.clone();
        const lineScale = arrowTail.scaling.clone();

        const increaseGizmoMesh = (dragDistance: number) => {
            const dragStrength = dragDistance * (3 / this._rootMesh.scaling.length()) * 6;

            arrowMesh.position.z += dragStrength / 3.5;
            arrowTail.scaling.y += dragStrength;
            this.dragScale = arrowTail.scaling.y;
            arrowTail.position.z = arrowMesh.position.z / 2;
        };

        const resetGizmoMesh = () => {
            arrowMesh.position.set(nodePosition.x, nodePosition.y, nodePosition.z);
            arrowTail.position.set(linePosition.x, linePosition.y, linePosition.z);
            arrowTail.scaling.set(lineScale.x, lineScale.y, lineScale.z);
            this.dragScale = arrowTail.scaling.y;
            this._dragging = false;
        };

        // Add drag behavior to handle events when the gizmo is dragged
        this.dragBehavior = new PointerDragBehavior({ dragAxis: dragAxis });
        this.dragBehavior.moveAttached = false;
        this.dragBehavior.updateDragPlane = false;
        this._rootMesh.addBehavior(this.dragBehavior);

        let currentSnapDragDistance = 0;
        let currentSnapDragDistanceIncremental = 0;

        const tmpSnapEvent = { snapDistance: 0 };
        this.dragBehavior.onDragObservable.add((event) => {
            if (this.attachedNode) {
                // Drag strength is modified by the scale of the gizmo (eg. for small objects like boombox the strength will be increased to match the behavior of larger objects)
                const dragStrength = this.sensitivity * event.dragDistance * ((this.scaleRatio * 3) / this._rootMesh.scaling.length());
                const tmpVector = this._tmpVector;
                // Snapping logic
                let snapped = false;
                let dragSteps = 0;
                if (this.uniformScaling) {
                    tmpVector.setAll(0.57735); // 1 / sqrt(3)
                } else {
                    tmpVector.copyFrom(dragAxis);
                }
                if (this.snapDistance == 0) {
                    tmpVector.scaleToRef(dragStrength, tmpVector);
                } else {
                    currentSnapDragDistance += dragStrength;
                    currentSnapDragDistanceIncremental += dragStrength;
                    const currentSnap = this.incrementalSnap ? currentSnapDragDistanceIncremental : currentSnapDragDistance;
                    if (Math.abs(currentSnap) > this.snapDistance) {
                        dragSteps = Math.floor(Math.abs(currentSnap) / this.snapDistance);

                        if (currentSnap < 0) {
                            dragSteps *= -1;
                        }
                        currentSnapDragDistance = currentSnapDragDistance % this.snapDistance;
                        tmpVector.scaleToRef(this.snapDistance * dragSteps, tmpVector);
                        snapped = true;
                    } else {
                        tmpVector.scaleInPlace(0);
                    }
                }

                tmpVector.addInPlaceFromFloats(1, 1, 1);
                // can't use Math.sign here because Math.sign(0) is 0 and it needs to be positive
                tmpVector.x = Math.abs(tmpVector.x) < AxisScaleGizmo.MinimumAbsoluteScale ? AxisScaleGizmo.MinimumAbsoluteScale * (tmpVector.x < 0 ? -1 : 1) : tmpVector.x;
                tmpVector.y = Math.abs(tmpVector.y) < AxisScaleGizmo.MinimumAbsoluteScale ? AxisScaleGizmo.MinimumAbsoluteScale * (tmpVector.y < 0 ? -1 : 1) : tmpVector.y;
                tmpVector.z = Math.abs(tmpVector.z) < AxisScaleGizmo.MinimumAbsoluteScale ? AxisScaleGizmo.MinimumAbsoluteScale * (tmpVector.z < 0 ? -1 : 1) : tmpVector.z;

                const transformNode = (<Mesh>this.attachedNode)._isMesh ? (this.attachedNode as TransformNode) : undefined;
                if (Math.abs(this.snapDistance) > 0 && this.incrementalSnap) {
                    // get current scaling
                    this.attachedNode.getWorldMatrix().decompose(undefined, TmpVectors.Quaternion[0], TmpVectors.Vector3[2], Gizmo.PreserveScaling ? transformNode : undefined);
                    // apply incrementaly, without taking care of current scaling value
                    tmpVector.addInPlace(this._incrementalStartupValue);
                    tmpVector.addInPlaceFromFloats(-1, -1, -1);
                    // keep same sign or stretching close to 0 will change orientation at each drag and scaling will oscilate around 0
                    tmpVector.x = Math.abs(tmpVector.x) * (this._incrementalStartupValue.x > 0 ? 1 : -1);
                    tmpVector.y = Math.abs(tmpVector.y) * (this._incrementalStartupValue.y > 0 ? 1 : -1);
                    tmpVector.z = Math.abs(tmpVector.z) * (this._incrementalStartupValue.z > 0 ? 1 : -1);
                    Matrix.ComposeToRef(tmpVector, TmpVectors.Quaternion[0], TmpVectors.Vector3[2], TmpVectors.Matrix[1]);
                } else {
                    Matrix.ScalingToRef(tmpVector.x, tmpVector.y, tmpVector.z, TmpVectors.Matrix[2]);
                    TmpVectors.Matrix[2].multiplyToRef(this.attachedNode.getWorldMatrix(), TmpVectors.Matrix[1]);
                }

                // check scaling are not out of bounds. If not, copy resulting temp matrix to node world matrix
                TmpVectors.Matrix[1].decompose(TmpVectors.Vector3[1], undefined, undefined, Gizmo.PreserveScaling ? transformNode : undefined);

                const maxScale = 100000;
                if (Math.abs(TmpVectors.Vector3[1].x) < maxScale && Math.abs(TmpVectors.Vector3[1].y) < maxScale && Math.abs(TmpVectors.Vector3[1].z) < maxScale) {
                    this.attachedNode.getWorldMatrix().copyFrom(TmpVectors.Matrix[1]);
                }

                // notify observers
                if (snapped) {
                    tmpSnapEvent.snapDistance = this.snapDistance * dragSteps;
                    this.onSnapObservable.notifyObservers(tmpSnapEvent);
                }
                this._matrixChanged();
            }
        });
        // On Drag Listener: to move gizmo mesh with user action
        this.dragBehavior.onDragStartObservable.add(() => {
            this._dragging = true;
            const transformNode = (<Mesh>this.attachedNode)._isMesh ? (this.attachedNode as TransformNode) : undefined;
            this.attachedNode?.getWorldMatrix().decompose(this._incrementalStartupValue, undefined, undefined, Gizmo.PreserveScaling ? transformNode : undefined);
            currentSnapDragDistance = 0;
            currentSnapDragDistanceIncremental = 0;
        });
        this.dragBehavior.onDragObservable.add((e) => increaseGizmoMesh(e.dragDistance));
        this.dragBehavior.onDragEndObservable.add(resetGizmoMesh);

        // Listeners for Universal Scalar
        parent?.uniformScaleGizmo?.dragBehavior?.onDragObservable?.add((e) => increaseGizmoMesh(e.delta.y));
        parent?.uniformScaleGizmo?.dragBehavior?.onDragEndObservable?.add(resetGizmoMesh);

        const cache: GizmoAxisCache = {
            gizmoMeshes: [arrowMesh, arrowTail],
            colliderMeshes: [collider.arrowMesh, collider.arrowTail],
            material: this._coloredMaterial,
            hoverMaterial: this._hoverMaterial,
            disableMaterial: this._disableMaterial,
            active: false,
            dragBehavior: this.dragBehavior,
        };
        this._parent?.addToAxisCache(this._gizmoMesh, cache);

        this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo) => {
            if (this._customMeshSet) {
                return;
            }
            // axis mesh cache
            let meshCache = this._parent?.getAxisCache(this._gizmoMesh);
            this._isHovered = !!meshCache && !!(meshCache.colliderMeshes.indexOf(<Mesh>pointerInfo?.pickInfo?.pickedMesh) != -1);
            // uniform mesh cache
            meshCache = this._parent?.getAxisCache(this._rootMesh);
            this._isHovered ||= !!meshCache && !!(meshCache.colliderMeshes.indexOf(<Mesh>pointerInfo?.pickInfo?.pickedMesh) != -1);
            if (!this._parent) {
                const material = this.dragBehavior.enabled ? (this._isHovered || this._dragging ? this._hoverMaterial : this._coloredMaterial) : this._disableMaterial;
                this._setGizmoMeshMaterial(cache.gizmoMeshes, material);
            }
        });

        this.dragBehavior.onEnabledObservable.add((newState) => {
            this._setGizmoMeshMaterial(cache.gizmoMeshes, newState ? this._coloredMaterial : this._disableMaterial);
        });

        const light = gizmoLayer._getSharedGizmoLight();
        light.includedOnlyMeshes = light.includedOnlyMeshes.concat(this._rootMesh.getChildMeshes());
    }

    /**
     * @internal
     * Create Geometry for Gizmo
     * @param parentMesh
     * @param thickness
     * @param isCollider
     * @returns the gizmo mesh
     */
    protected _createGizmoMesh(parentMesh: AbstractMesh, thickness: number, isCollider = false) {
        const arrowMesh = CreateBox("yPosMesh", { size: 0.4 * (1 + (thickness - 1) / 4) }, this.gizmoLayer.utilityLayerScene);
        const arrowTail = CreateCylinder(
            "cylinder",
            { diameterTop: 0.005 * thickness, height: 0.275, diameterBottom: 0.005 * thickness, tessellation: 96 },
            this.gizmoLayer.utilityLayerScene
        );

        // Position arrow pointing in its drag axis
        arrowMesh.scaling.scaleInPlace(0.1);
        arrowMesh.material = this._coloredMaterial;
        arrowMesh.rotation.x = Math.PI / 2;
        arrowMesh.position.z += 0.3;

        arrowTail.material = this._coloredMaterial;
        arrowTail.position.z += 0.275 / 2;
        arrowTail.rotation.x = Math.PI / 2;

        if (isCollider) {
            arrowMesh.visibility = 0;
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
        } else {
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
