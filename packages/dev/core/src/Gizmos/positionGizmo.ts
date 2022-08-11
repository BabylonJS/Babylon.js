import { Logger } from "../Misc/logger";
import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import { Vector3 } from "../Maths/math.vector";
import { Color3 } from "../Maths/math.color";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Node } from "../node";
import type { Mesh } from "../Meshes/mesh";
import type { GizmoAxisCache, IGizmo } from "./gizmo";
import { Gizmo } from "./gizmo";
import type { IAxisDragGizmo } from "./axisDragGizmo";
import { AxisDragGizmo } from "./axisDragGizmo";
import type { IPlaneDragGizmo } from "./planeDragGizmo";
import { PlaneDragGizmo } from "./planeDragGizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import type { PointerInfo } from "../Events/pointerEvents";
import type { GizmoManager } from "./gizmoManager";

/**
 * Interface for position gizmo
 */
export interface IPositionGizmo extends IGizmo {
    /** Internal gizmo used for interactions on the x axis */
    xGizmo: IAxisDragGizmo;
    /** Internal gizmo used for interactions on the y axis */
    yGizmo: IAxisDragGizmo;
    /** Internal gizmo used for interactions on the z axis */
    zGizmo: IAxisDragGizmo;
    /** Internal gizmo used for interactions on the yz plane */
    xPlaneGizmo: IPlaneDragGizmo;
    /** Internal gizmo used for interactions on the xz plane */
    yPlaneGizmo: IPlaneDragGizmo;
    /** Internal gizmo used for interactions on the xy plane */
    zPlaneGizmo: IPlaneDragGizmo;
    /** Fires an event when any of it's sub gizmos are dragged */
    onDragStartObservable: Observable<unknown>;
    /** Fires an event when any of it's sub gizmos are released from dragging */
    onDragEndObservable: Observable<unknown>;
    /**
     * If the planar drag gizmo is enabled
     * setting this will enable/disable XY, XZ and YZ planes regardless of individual gizmo settings.
     */
    planarGizmoEnabled: boolean;
    /** Drag distance in babylon units that the gizmo will snap to when dragged */
    snapDistance: number;
    /**
     * Builds Gizmo Axis Cache to enable features such as hover state preservation and graying out other axis during manipulation
     * @param mesh Axis gizmo mesh
     * @param cache Gizmo axis definition used for reactive gizmo UI
     */
    addToAxisCache(mesh: Mesh, cache: GizmoAxisCache): void;
}

/**
 * Gizmo that enables dragging a mesh along 3 axis
 */
export class PositionGizmo extends Gizmo implements IPositionGizmo {
    /**
     * Internal gizmo used for interactions on the x axis
     */
    public xGizmo: IAxisDragGizmo;
    /**
     * Internal gizmo used for interactions on the y axis
     */
    public yGizmo: IAxisDragGizmo;
    /**
     * Internal gizmo used for interactions on the z axis
     */
    public zGizmo: IAxisDragGizmo;
    /**
     * Internal gizmo used for interactions on the yz plane
     */
    public xPlaneGizmo: IPlaneDragGizmo;
    /**
     * Internal gizmo used for interactions on the xz plane
     */
    public yPlaneGizmo: IPlaneDragGizmo;
    /**
     * Internal gizmo used for interactions on the xy plane
     */
    public zPlaneGizmo: IPlaneDragGizmo;

    /**
     * protected variables
     */
    protected _meshAttached: Nullable<AbstractMesh> = null;
    protected _nodeAttached: Nullable<Node> = null;
    protected _snapDistance: number;
    protected _observables: Observer<PointerInfo>[] = [];

    /** Node Caching for quick lookup */
    protected _gizmoAxisCache: Map<Mesh, GizmoAxisCache> = new Map();

    /** Fires an event when any of it's sub gizmos are dragged */
    public onDragStartObservable = new Observable();
    /** Fires an event when any of it's sub gizmos are released from dragging */
    public onDragEndObservable = new Observable();

    /**
     * If set to true, planar drag is enabled
     */
    protected _planarGizmoEnabled = false;

    public get attachedMesh() {
        return this._meshAttached;
    }
    public set attachedMesh(mesh: Nullable<AbstractMesh>) {
        this._meshAttached = mesh;
        this._nodeAttached = mesh;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.xPlaneGizmo, this.yPlaneGizmo, this.zPlaneGizmo].forEach((gizmo) => {
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
        [this.xGizmo, this.yGizmo, this.zGizmo, this.xPlaneGizmo, this.yPlaneGizmo, this.zPlaneGizmo].forEach((gizmo) => {
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
        [this.xGizmo, this.yGizmo, this.zGizmo, this.xPlaneGizmo, this.yPlaneGizmo, this.zPlaneGizmo].forEach((gizmo) => {
            hovered = hovered || gizmo.isHovered;
        });
        return hovered;
    }

    /**
     * Creates a PositionGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
      @param thickness display gizmo axis thickness
     * @param gizmoManager
     */
    constructor(gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, thickness: number = 1, gizmoManager?: GizmoManager) {
        super(gizmoLayer);
        this.xGizmo = new AxisDragGizmo(new Vector3(1, 0, 0), Color3.Red().scale(0.5), gizmoLayer, this, thickness);
        this.yGizmo = new AxisDragGizmo(new Vector3(0, 1, 0), Color3.Green().scale(0.5), gizmoLayer, this, thickness);
        this.zGizmo = new AxisDragGizmo(new Vector3(0, 0, 1), Color3.Blue().scale(0.5), gizmoLayer, this, thickness);

        this.xPlaneGizmo = new PlaneDragGizmo(new Vector3(1, 0, 0), Color3.Red().scale(0.5), this.gizmoLayer, this);
        this.yPlaneGizmo = new PlaneDragGizmo(new Vector3(0, 1, 0), Color3.Green().scale(0.5), this.gizmoLayer, this);
        this.zPlaneGizmo = new PlaneDragGizmo(new Vector3(0, 0, 1), Color3.Blue().scale(0.5), this.gizmoLayer, this);
        // Relay drag events
        [this.xGizmo, this.yGizmo, this.zGizmo, this.xPlaneGizmo, this.yPlaneGizmo, this.zPlaneGizmo].forEach((gizmo) => {
            gizmo.dragBehavior.onDragStartObservable.add(() => {
                this.onDragStartObservable.notifyObservers({});
            });
            gizmo.dragBehavior.onDragEndObservable.add(() => {
                this.onDragEndObservable.notifyObservers({});
            });
        });

        this.attachedMesh = null;

        if (gizmoManager) {
            gizmoManager.addToAxisCache(this._gizmoAxisCache);
        } else {
            // Only subscribe to pointer event if gizmoManager isnt
            Gizmo.GizmoAxisPointerObserver(gizmoLayer, this._gizmoAxisCache);
        }
    }

    /**
     * If the planar drag gizmo is enabled
     * setting this will enable/disable XY, XZ and YZ planes regardless of individual gizmo settings.
     */
    public set planarGizmoEnabled(value: boolean) {
        this._planarGizmoEnabled = value;
        [this.xPlaneGizmo, this.yPlaneGizmo, this.zPlaneGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.isEnabled = value;
                if (value) {
                    if (gizmo.attachedMesh) {
                        gizmo.attachedMesh = this.attachedMesh;
                    } else {
                        gizmo.attachedNode = this.attachedNode;
                    }
                }
            }
        }, this);
    }
    public get planarGizmoEnabled(): boolean {
        return this._planarGizmoEnabled;
    }

    public set updateGizmoRotationToMatchAttachedMesh(value: boolean) {
        this._updateGizmoRotationToMatchAttachedMesh = value;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.xPlaneGizmo, this.yPlaneGizmo, this.zPlaneGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.updateGizmoRotationToMatchAttachedMesh = value;
            }
        });
    }
    public get updateGizmoRotationToMatchAttachedMesh() {
        return this._updateGizmoRotationToMatchAttachedMesh;
    }

    /**
     * Drag distance in babylon units that the gizmo will snap to when dragged (Default: 0)
     */
    public set snapDistance(value: number) {
        this._snapDistance = value;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.xPlaneGizmo, this.yPlaneGizmo, this.zPlaneGizmo].forEach((gizmo) => {
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
        [this.xGizmo, this.yGizmo, this.zGizmo, this.xPlaneGizmo, this.yPlaneGizmo, this.zPlaneGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.scaleRatio = value;
            }
        });
    }
    public get scaleRatio() {
        return this._scaleRatio;
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
        [this.xGizmo, this.yGizmo, this.zGizmo, this.xPlaneGizmo, this.yPlaneGizmo, this.zPlaneGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.dispose();
            }
        });
        this._observables.forEach((obs) => {
            this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(obs);
        });
        this.onDragStartObservable.clear();
        this.onDragEndObservable.clear();
    }

    /**
     * CustomMeshes are not supported by this gizmo
     */
    public setCustomMesh() {
        Logger.Error(
            "Custom meshes are not supported on this gizmo, please set the custom meshes on the gizmos contained within this one (gizmo.xGizmo, gizmo.yGizmo, gizmo.zGizmo,gizmo.xPlaneGizmo, gizmo.yPlaneGizmo, gizmo.zPlaneGizmo)"
        );
    }
}
