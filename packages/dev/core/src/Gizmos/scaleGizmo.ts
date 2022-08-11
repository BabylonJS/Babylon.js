import { Logger } from "../Misc/logger";
import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import { Vector3 } from "../Maths/math.vector";
import { Color3 } from "../Maths/math.color";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { CreatePolyhedron } from "../Meshes/Builders/polyhedronBuilder";
import type { GizmoAxisCache, IGizmo } from "./gizmo";
import { Gizmo } from "./gizmo";
import type { IAxisScaleGizmo } from "./axisScaleGizmo";
import { AxisScaleGizmo } from "./axisScaleGizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import type { Mesh } from "../Meshes/mesh";
import type { Node } from "../node";
import type { PointerInfo } from "../Events/pointerEvents";
import { StandardMaterial } from "../Materials/standardMaterial";
import type { GizmoManager } from "./gizmoManager";

/**
 * Interface for scale gizmo
 */
export interface IScaleGizmo extends IGizmo {
    /** Internal gizmo used for interactions on the x axis */
    xGizmo: IAxisScaleGizmo;
    /** Internal gizmo used for interactions on the y axis */
    yGizmo: IAxisScaleGizmo;
    /** Internal gizmo used for interactions on the z axis */
    zGizmo: IAxisScaleGizmo;
    /** Internal gizmo used to scale all axis equally*/
    uniformScaleGizmo: IAxisScaleGizmo;
    /** Fires an event when any of it's sub gizmos are dragged */
    onDragStartObservable: Observable<unknown>;
    /** Fires an event when any of it's sub gizmos are released from dragging */
    onDragEndObservable: Observable<unknown>;
    /** Drag distance in babylon units that the gizmo will snap to when dragged */
    snapDistance: number;
    /** Sensitivity factor for dragging */
    sensitivity: number;
    /**
     * Builds Gizmo Axis Cache to enable features such as hover state preservation and graying out other axis during manipulation
     * @param mesh Axis gizmo mesh
     * @param cache Gizmo axis definition used for reactive gizmo UI
     */
    addToAxisCache(mesh: Mesh, cache: GizmoAxisCache): void;
}

/**
 * Gizmo that enables scaling a mesh along 3 axis
 */
export class ScaleGizmo extends Gizmo implements IScaleGizmo {
    /**
     * Internal gizmo used for interactions on the x axis
     */
    public xGizmo: IAxisScaleGizmo;
    /**
     * Internal gizmo used for interactions on the y axis
     */
    public yGizmo: IAxisScaleGizmo;
    /**
     * Internal gizmo used for interactions on the z axis
     */
    public zGizmo: IAxisScaleGizmo;

    /**
     * Internal gizmo used to scale all axis equally
     */
    public uniformScaleGizmo: IAxisScaleGizmo;

    protected _meshAttached: Nullable<AbstractMesh> = null;
    protected _nodeAttached: Nullable<Node> = null;
    protected _snapDistance: number;
    protected _uniformScalingMesh: Mesh;
    protected _octahedron: Mesh;
    protected _sensitivity: number = 1;
    protected _coloredMaterial: StandardMaterial;
    protected _hoverMaterial: StandardMaterial;
    protected _disableMaterial: StandardMaterial;
    protected _observables: Observer<PointerInfo>[] = [];

    /** Node Caching for quick lookup */
    protected _gizmoAxisCache: Map<Mesh, GizmoAxisCache> = new Map();

    /** Fires an event when any of it's sub gizmos are dragged */
    public onDragStartObservable = new Observable();
    /** Fires an event when any of it's sub gizmos are released from dragging */
    public onDragEndObservable = new Observable();

    public get attachedMesh() {
        return this._meshAttached;
    }
    public set attachedMesh(mesh: Nullable<AbstractMesh>) {
        this._meshAttached = mesh;
        this._nodeAttached = mesh;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo.isEnabled) {
                gizmo.attachedMesh = mesh;
            } else {
                gizmo.attachedMesh = null;
            }
        });
    }

    public get attachedNode() {
        return this._nodeAttached;
    }
    public set attachedNode(node: Nullable<Node>) {
        this._meshAttached = null;
        this._nodeAttached = node;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo.isEnabled) {
                gizmo.attachedNode = node;
            } else {
                gizmo.attachedNode = null;
            }
        });
    }

    /**
     * True when the mouse pointer is hovering a gizmo mesh
     */
    public get isHovered() {
        let hovered = false;
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            hovered = hovered || gizmo.isHovered;
        });
        return hovered;
    }

    /**
     * Creates a ScaleGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param thickness display gizmo axis thickness
     * @param gizmoManager
     */
    constructor(gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, thickness: number = 1, gizmoManager?: GizmoManager) {
        super(gizmoLayer);
        this.uniformScaleGizmo = this._createUniformScaleMesh();
        this.xGizmo = new AxisScaleGizmo(new Vector3(1, 0, 0), Color3.Red().scale(0.5), gizmoLayer, this, thickness);
        this.yGizmo = new AxisScaleGizmo(new Vector3(0, 1, 0), Color3.Green().scale(0.5), gizmoLayer, this, thickness);
        this.zGizmo = new AxisScaleGizmo(new Vector3(0, 0, 1), Color3.Blue().scale(0.5), gizmoLayer, this, thickness);

        // Relay drag events
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            gizmo.dragBehavior.onDragStartObservable.add(() => {
                this.onDragStartObservable.notifyObservers({});
            });
            gizmo.dragBehavior.onDragEndObservable.add(() => {
                this.onDragEndObservable.notifyObservers({});
            });
        });

        this.attachedMesh = null;
        this.attachedNode = null;

        if (gizmoManager) {
            gizmoManager.addToAxisCache(this._gizmoAxisCache);
        } else {
            // Only subscribe to pointer event if gizmoManager isnt
            Gizmo.GizmoAxisPointerObserver(gizmoLayer, this._gizmoAxisCache);
        }
    }

    /** Create Geometry for Gizmo */
    protected _createUniformScaleMesh(): AxisScaleGizmo {
        this._coloredMaterial = new StandardMaterial("", this.gizmoLayer.utilityLayerScene);
        this._coloredMaterial.diffuseColor = Color3.Gray();

        this._hoverMaterial = new StandardMaterial("", this.gizmoLayer.utilityLayerScene);
        this._hoverMaterial.diffuseColor = Color3.Yellow();

        this._disableMaterial = new StandardMaterial("", this.gizmoLayer.utilityLayerScene);
        this._disableMaterial.diffuseColor = Color3.Gray();
        this._disableMaterial.alpha = 0.4;

        const uniformScaleGizmo = new AxisScaleGizmo(new Vector3(0, 1, 0), Color3.Gray().scale(0.5), this.gizmoLayer, this);
        uniformScaleGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        uniformScaleGizmo.uniformScaling = true;
        this._uniformScalingMesh = CreatePolyhedron("uniform", { type: 1 }, uniformScaleGizmo.gizmoLayer.utilityLayerScene);
        this._uniformScalingMesh.scaling.scaleInPlace(0.01);
        this._uniformScalingMesh.visibility = 0;
        this._octahedron = CreatePolyhedron("", { type: 1 }, uniformScaleGizmo.gizmoLayer.utilityLayerScene);
        this._octahedron.scaling.scaleInPlace(0.007);
        this._uniformScalingMesh.addChild(this._octahedron);
        uniformScaleGizmo.setCustomMesh(this._uniformScalingMesh, true);
        const light = this.gizmoLayer._getSharedGizmoLight();
        light.includedOnlyMeshes = light.includedOnlyMeshes.concat(this._octahedron);

        const cache: GizmoAxisCache = {
            gizmoMeshes: [this._octahedron, this._uniformScalingMesh],
            colliderMeshes: [this._uniformScalingMesh],
            material: this._coloredMaterial,
            hoverMaterial: this._hoverMaterial,
            disableMaterial: this._disableMaterial,
            active: false,
            dragBehavior: uniformScaleGizmo.dragBehavior,
        };

        this.addToAxisCache(uniformScaleGizmo._rootMesh, cache);

        return uniformScaleGizmo;
    }

    public set updateGizmoRotationToMatchAttachedMesh(value: boolean) {
        if (!value) {
            Logger.Warn("Setting updateGizmoRotationToMatchAttachedMesh = false on scaling gizmo is not supported.");
        } else {
            this._updateGizmoRotationToMatchAttachedMesh = value;
            [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
                if (gizmo) {
                    gizmo.updateGizmoRotationToMatchAttachedMesh = value;
                }
            });
        }
    }
    public get updateGizmoRotationToMatchAttachedMesh() {
        return this._updateGizmoRotationToMatchAttachedMesh;
    }

    /**
     * Drag distance in babylon units that the gizmo will snap to when dragged (Default: 0)
     */
    public set snapDistance(value: number) {
        this._snapDistance = value;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.snapDistance = value;
            }
        });
    }
    public get snapDistance() {
        return this._snapDistance;
    }

    /**
     * Ratio for the scale of the gizmo (Default: 1)
     */
    public set scaleRatio(value: number) {
        this._scaleRatio = value;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.scaleRatio = value;
            }
        });
    }
    public get scaleRatio() {
        return this._scaleRatio;
    }

    /**
     * Sensitivity factor for dragging (Default: 1)
     */
    public set sensitivity(value: number) {
        this._sensitivity = value;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.sensitivity = value;
            }
        });
    }
    public get sensitivity() {
        return this._sensitivity;
    }

    /**
     * Builds Gizmo Axis Cache to enable features such as hover state preservation and graying out other axis during manipulation
     * @param mesh Axis gizmo mesh
     * @param cache Gizmo axis definition used for reactive gizmo UI
     */
    public addToAxisCache(mesh: Mesh, cache: GizmoAxisCache) {
        this._gizmoAxisCache.set(mesh, cache);
    }

    /**
     * Disposes of the gizmo
     */
    public dispose() {
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.dispose();
            }
        });
        this._observables.forEach((obs) => {
            this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(obs);
        });
        this.onDragStartObservable.clear();
        this.onDragEndObservable.clear();
        [this._uniformScalingMesh, this._octahedron].forEach((msh) => {
            if (msh) {
                msh.dispose();
            }
        });
        [this._coloredMaterial, this._hoverMaterial, this._disableMaterial].forEach((matl) => {
            if (matl) {
                matl.dispose();
            }
        });
    }
}
