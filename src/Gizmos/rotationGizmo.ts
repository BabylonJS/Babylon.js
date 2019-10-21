import { Logger } from "../Misc/logger";
import { Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { Vector3 } from "../Maths/math.vector";
import { Color3 } from '../Maths/math.color';
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { _TimeToken } from "../Instrumentation/timeToken";
import { Gizmo } from "./gizmo";
import { PlaneRotationGizmo } from "./planeRotationGizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
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

    public get attachedMesh() {
        return this._meshAttached;
    }
    public set attachedMesh(mesh: Nullable<AbstractMesh>) {
        this._meshAttached = mesh;

        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            if (gizmo.isEnabled) {
                gizmo.attachedMesh = mesh;
            }
            else {
                gizmo.attachedMesh = null;
            }
        });
    }
    /**
     * Creates a RotationGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param tessellation Amount of tessellation to be used when creating rotation circles
     * @param useEulerRotation Use and update Euler angle instead of quaternion
     */
    constructor(gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, tessellation = 32, useEulerRotation = false) {
        super(gizmoLayer);
        this.xGizmo = new PlaneRotationGizmo(new Vector3(1, 0, 0), Color3.Red().scale(0.5), gizmoLayer, tessellation, this, useEulerRotation);
        this.yGizmo = new PlaneRotationGizmo(new Vector3(0, 1, 0), Color3.Green().scale(0.5), gizmoLayer, tessellation, this, useEulerRotation);
        this.zGizmo = new PlaneRotationGizmo(new Vector3(0, 0, 1), Color3.Blue().scale(0.5), gizmoLayer, tessellation, this, useEulerRotation);

        // Relay drag events
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            gizmo.dragBehavior.onDragStartObservable.add(() => {
                this.onDragStartObservable.notifyObservers({});
            });
            gizmo.dragBehavior.onDragEndObservable.add(() => {
                this.onDragEndObservable.notifyObservers({});
            });
        });

        this.attachedMesh = null;
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
     * Disposes of the gizmo
     */
    public dispose() {
        this.xGizmo.dispose();
        this.yGizmo.dispose();
        this.zGizmo.dispose();
        this.onDragStartObservable.clear();
        this.onDragEndObservable.clear();
    }

    /**
     * CustomMeshes are not supported by this gizmo
     * @param mesh The mesh to replace the default mesh of the gizmo
     */
    public setCustomMesh(mesh: Mesh) {
        Logger.Error("Custom meshes are not supported on this gizmo, please set the custom meshes on the gizmos contained within this one (gizmo.xGizmo, gizmo.yGizmo, gizmo.zGizmo)");
    }
}
