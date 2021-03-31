import { Logger } from "../Misc/logger";
import { Observable, Observer } from "../Misc/observable";
import { Nullable } from "../types";
import { Vector3 } from "../Maths/math.vector";
import { Color3 } from '../Maths/math.color';
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Gizmo, GizmoAxisCache } from "./gizmo";
import { PlaneRotationGizmo } from "./planeRotationGizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Node } from "../node";
import { PointerInfo } from "../Events/pointerEvents";
import { TransformNode } from "../Meshes/transformNode";
import { GizmoManager } from './gizmoManager';

/**
 * Options for each individual plane rotation gizmo contained within RotationGizmo
 */
export interface PlaneRotationGizmoOptions {
    /**
     * Color to use for the plane rotation gizmo
     */
    color?: Color3;
}

/**
 * Additional options for each rotation gizmo
 */
export interface RotationGizmoOptions {
    /**
     * When set, the gizmo will always appear the same size no matter where the camera is (default: true)
     */
    updateScale?: boolean;

    /**
     * Specific options for xGizmo
     */
    xOptions?: PlaneRotationGizmoOptions;

    /**
     * Specific options for yGizmo
     */
    yOptions?: PlaneRotationGizmoOptions;

    /**
     * Specific options for zGizmo
     */
    zOptions?: PlaneRotationGizmoOptions;
}

/**
 * Gizmo that enables rotating a mesh along 3 axis
 */
export class RotationGizmo extends Gizmo {
    /**
     * Internal gizmo used for interactions on the x axis
     */
    public xGizmo: PlaneRotationGizmo;
    /**
     * Internal gizmo used for interactions on the y axis
     */
    public yGizmo: PlaneRotationGizmo;
    /**
     * Internal gizmo used for interactions on the z axis
     */
    public zGizmo: PlaneRotationGizmo;

    /** Fires an event when any of it's sub gizmos are dragged */
    public onDragStartObservable = new Observable();
    /** Fires an event when any of it's sub gizmos are released from dragging */
    public onDragEndObservable = new Observable();

    private _meshAttached: Nullable<AbstractMesh>;
    private _nodeAttached: Nullable<Node>;
    private _observables: Observer<PointerInfo>[] = [];

    /** Node Caching for quick lookup */
    private _gizmoAxisCache: Map<Mesh, GizmoAxisCache> = new Map();

    public get attachedMesh() {
        return this._meshAttached;
    }
    public set attachedMesh(mesh: Nullable<AbstractMesh>) {
        this._meshAttached = mesh;
        this._nodeAttached = mesh;
        this._checkBillboardTransform();
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            if (gizmo.isEnabled) {
                gizmo.attachedMesh = mesh;
            }
            else {
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
        this._checkBillboardTransform();
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            if (gizmo.isEnabled) {
                gizmo.attachedNode = node;
            }
            else {
                gizmo.attachedNode = null;
            }
        });
    }

    protected _checkBillboardTransform() {
        if (this._nodeAttached && (<TransformNode>this._nodeAttached).billboardMode) {
            console.log("Rotation Gizmo will not work with transforms in billboard mode.");
        }
    }

    /**
     * True when the mouse pointer is hovering a gizmo mesh
     */
    public get isHovered() {
        var hovered = false;
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            hovered = hovered || gizmo.isHovered;
        });
        return hovered;
    }

    /**
     * Creates a RotationGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param tessellation Amount of tessellation to be used when creating rotation circles
     * @param useEulerRotation Use and update Euler angle instead of quaternion
     * @param thickness display gizmo axis thickness
     * @param gizmoManager Gizmo manager
     * @param options More options
     */
    constructor(gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, tessellation = 32, useEulerRotation = false, thickness: number = 1, gizmoManager?: GizmoManager, options?: RotationGizmoOptions) {
        super(gizmoLayer);
        const xColor = options && options.xOptions && options.xOptions.color ? options.xOptions.color : Color3.Red().scale(0.5);
        const yColor = options && options.yOptions && options.yOptions.color ? options.yOptions.color : Color3.Green().scale(0.5);
        const zColor = options && options.zOptions && options.zOptions.color ? options.zOptions.color : Color3.Blue().scale(0.5);
        this.xGizmo = new PlaneRotationGizmo(new Vector3(1, 0, 0), xColor, gizmoLayer, tessellation, this, useEulerRotation, thickness);
        this.yGizmo = new PlaneRotationGizmo(new Vector3(0, 1, 0), yColor, gizmoLayer, tessellation, this, useEulerRotation, thickness);
        this.zGizmo = new PlaneRotationGizmo(new Vector3(0, 0, 1), zColor, gizmoLayer, tessellation, this, useEulerRotation, thickness);
        // Relay drag events and set update scale
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            //must set updateScale on each gizmo, as setting it on root RotationGizmo doesnt prevent individual gizmos from updating
            //currently updateScale is a property with no getter/setter, so no good way to override behavior at runtime, so we will at least set it on startup
            if (options && options.updateScale != undefined) {
                gizmo.updateScale = options.updateScale;
            }
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

    public set updateGizmoRotationToMatchAttachedMesh(value: boolean) {
        if (this.xGizmo) {
            this.xGizmo.updateGizmoRotationToMatchAttachedMesh = value;
            this.yGizmo.updateGizmoRotationToMatchAttachedMesh = value;
            this.zGizmo.updateGizmoRotationToMatchAttachedMesh = value;
        }
    }
    public get updateGizmoRotationToMatchAttachedMesh() {
        return this.xGizmo.updateGizmoRotationToMatchAttachedMesh;
    }

    /**
     * Drag distance in babylon units that the gizmo will snap to when dragged (Default: 0)
     */
    public set snapDistance(value: number) {
        if (this.xGizmo) {
            this.xGizmo.snapDistance = value;
            this.yGizmo.snapDistance = value;
            this.zGizmo.snapDistance = value;
        }
    }
    public get snapDistance() {
        return this.xGizmo.snapDistance;
    }

    /**
     * Ratio for the scale of the gizmo (Default: 1)
     */
    public set scaleRatio(value: number) {
        if (this.xGizmo) {
            this.xGizmo.scaleRatio = value;
            this.yGizmo.scaleRatio = value;
            this.zGizmo.scaleRatio = value;
        }
    }
    public get scaleRatio() {
        return this.xGizmo.scaleRatio;
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
        this.xGizmo.dispose();
        this.yGizmo.dispose();
        this.zGizmo.dispose();
        this.onDragStartObservable.clear();
        this.onDragEndObservable.clear();
        this._observables.forEach((obs) => {
            this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(obs);
        });
    }

    /**
     * CustomMeshes are not supported by this gizmo
     * @param mesh The mesh to replace the default mesh of the gizmo
     */
    public setCustomMesh(mesh: Mesh) {
        Logger.Error("Custom meshes are not supported on this gizmo, please set the custom meshes on the gizmos contained within this one (gizmo.xGizmo, gizmo.yGizmo, gizmo.zGizmo)");
    }
}
