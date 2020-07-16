import { Logger } from "../Misc/logger";
import { Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { Vector3 } from "../Maths/math.vector";
import { Color3 } from '../Maths/math.color';
import { AbstractMesh } from "../Meshes/abstractMesh";
import { PolyhedronBuilder } from "../Meshes/Builders/polyhedronBuilder";
import { Gizmo } from "./gizmo";
import { AxisScaleGizmo } from "./axisScaleGizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Mesh } from "../Meshes/mesh";
import { Node } from "../node";
/**
 * Gizmo that enables scaling a mesh along 3 axis
 */
export class ScaleGizmo extends Gizmo {
    /**
     * Internal gizmo used for interactions on the x axis
     */
    public xGizmo: AxisScaleGizmo;
    /**
     * Internal gizmo used for interactions on the y axis
     */
    public yGizmo: AxisScaleGizmo;
    /**
     * Internal gizmo used for interactions on the z axis
     */
    public zGizmo: AxisScaleGizmo;

    /**
     * Internal gizmo used to scale all axis equally
     */
    public uniformScaleGizmo: AxisScaleGizmo;

    private _meshAttached: Nullable<AbstractMesh> = null;
    private _nodeAttached: Nullable<Node> = null;
    private _updateGizmoRotationToMatchAttachedMesh: boolean;
    private _snapDistance: number;
    private _scaleRatio: number;
    private _uniformScalingMesh: Mesh;
    private _octahedron: Mesh;
    private _sensitivity: number = 1;

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
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo.isEnabled) {
                gizmo.attachedNode = node;
            }
            else {
                gizmo.attachedNode = null;
            }
        });
    }

    /**
     * Creates a ScaleGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     */
    constructor(gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer) {
        super(gizmoLayer);
        this.xGizmo = new AxisScaleGizmo(new Vector3(1, 0, 0), Color3.Red().scale(0.5), gizmoLayer, this);
        this.yGizmo = new AxisScaleGizmo(new Vector3(0, 1, 0), Color3.Green().scale(0.5), gizmoLayer, this);
        this.zGizmo = new AxisScaleGizmo(new Vector3(0, 0, 1), Color3.Blue().scale(0.5), gizmoLayer, this);

        // Create uniform scale gizmo
        this.uniformScaleGizmo = new AxisScaleGizmo(new Vector3(0, 1, 0), Color3.Yellow().scale(0.5), gizmoLayer, this);
        this.uniformScaleGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        this.uniformScaleGizmo.uniformScaling = true;
        this._uniformScalingMesh = PolyhedronBuilder.CreatePolyhedron("", { type: 1 }, this.uniformScaleGizmo.gizmoLayer.utilityLayerScene);
        this._uniformScalingMesh.scaling.scaleInPlace(0.02);
        this._uniformScalingMesh.visibility = 0;
        this._octahedron = PolyhedronBuilder.CreatePolyhedron("", { type: 1 }, this.uniformScaleGizmo.gizmoLayer.utilityLayerScene);
        this._octahedron.scaling.scaleInPlace(0.007);
        this._uniformScalingMesh.addChild(this._octahedron);
        this.uniformScaleGizmo.setCustomMesh(this._uniformScalingMesh, true);
        var light = gizmoLayer._getSharedGizmoLight();
        light.includedOnlyMeshes = light.includedOnlyMeshes.concat(this._octahedron);

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
    }

    public set updateGizmoRotationToMatchAttachedMesh(value: boolean) {
        if (!value) {
            Logger.Warn("Setting updateGizmoRotationToMatchAttachedMesh = false on scaling gizmo is not supported.");
        }
        else {
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
     * Disposes of the gizmo
     */
    public dispose() {
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.dispose();
            }
        });
        this.onDragStartObservable.clear();
        this.onDragEndObservable.clear();

        [this._uniformScalingMesh, this._octahedron].forEach((msh) => {
            if (msh) {
                msh.dispose();
            }
        });
    }
}
