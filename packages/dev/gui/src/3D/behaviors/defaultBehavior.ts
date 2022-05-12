import type { Behavior } from "core/Behaviors/behavior";
import { FollowBehavior } from "core/Behaviors/Meshes/followBehavior";
import { SixDofDragBehavior } from "core/Behaviors/Meshes/sixDofDragBehavior";
import type { Scene } from "core/scene";
import type { Mesh } from "core/Meshes/mesh";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { SurfaceMagnetismBehavior } from "core/Behaviors/Meshes/surfaceMagnetismBehavior";
import type { Vector3 } from "core/Maths/math.vector";
import type { PickingInfo } from "core/Collisions/pickingInfo";
import type { AbstractMesh } from "core/Meshes/abstractMesh";

/**
 * Default behavior for 3D UI elements.
 * Handles a FollowBehavior, SixDofBehavior and SurfaceMagnetismBehavior
 * @since 5.0.0
 */
export class DefaultBehavior implements Behavior<Mesh> {
    private _scene: Scene;
    private _followBehavior: FollowBehavior;
    private _sixDofDragBehavior: SixDofDragBehavior;
    private _surfaceMagnetismBehavior: SurfaceMagnetismBehavior;
    private _onBeforeRenderObserver: Nullable<Observer<Scene>>;
    private _onDragObserver: Nullable<Observer<{ delta: Vector3; position: Vector3; pickInfo: PickingInfo }>>;

    /**
     * Instantiates the default behavior
     */
    constructor() {
        this._followBehavior = new FollowBehavior();
        this._sixDofDragBehavior = new SixDofDragBehavior();
        this._surfaceMagnetismBehavior = new SurfaceMagnetismBehavior();
    }

    /**
     * Attached node of this behavior
     */
    public attachedNode: Nullable<Mesh>;

    /**
     *  The name of the behavior
     */
    public get name(): string {
        return "Default";
    }

    /**
     *  The follow behavior
     */
    public get followBehavior(): FollowBehavior {
        return this._followBehavior;
    }

    /**
     *  The six DoF drag behavior
     */
    public get sixDofDragBehavior(): SixDofDragBehavior {
        return this._sixDofDragBehavior;
    }

    /**
     * The surface magnetism behavior
     */
    public get surfaceMagnetismBehavior(): SurfaceMagnetismBehavior {
        return this._surfaceMagnetismBehavior;
    }

    /**
     * Enables the follow behavior
     */
    public followBehaviorEnabled: boolean = false;

    /**
     * Enables the six DoF drag behavior
     */
    public sixDofDragBehaviorEnabled: boolean = true;

    /**
     * Enables the surface magnetism behavior
     */
    public surfaceMagnetismBehaviorEnabled: boolean = true;

    /**
     *  Initializes the behavior
     */
    public init() {}

    /**
     * Attaches the default behavior
     * @param ownerMesh The top level mesh
     * @param draggablesMeshes Descendant meshes that can be used for dragging the owner mesh
     * @param sceneUnderstandingMeshes Meshes from the scene understanding that will be used for surface magnetism
     */
    public attach(ownerMesh: Mesh, draggablesMeshes?: Mesh[], sceneUnderstandingMeshes?: AbstractMesh[]): void {
        this._scene = ownerMesh.getScene();
        this.attachedNode = ownerMesh;

        this._addObservables();
        // Since our observables are bound before the child behaviors', ours are called first
        this._followBehavior.attach(ownerMesh);
        this._sixDofDragBehavior.attach(ownerMesh);
        this._sixDofDragBehavior.draggableMeshes = draggablesMeshes || null;
        this._sixDofDragBehavior.faceCameraOnDragStart = true;
        this._surfaceMagnetismBehavior.attach(ownerMesh, this._scene);
        if (sceneUnderstandingMeshes) {
            this._surfaceMagnetismBehavior.meshes = sceneUnderstandingMeshes;
        }

        // We disable this behavior because we will handle pose changing event manually with sixDofDragBehavior
        this._surfaceMagnetismBehavior.enabled = false;
    }

    /**
     *  Detaches the behavior from the mesh
     */
    public detach(): void {
        this.attachedNode = null;
        this._removeObservables();
        this._followBehavior.detach();
        this._sixDofDragBehavior.detach();
        this._surfaceMagnetismBehavior.detach();
    }

    private _addObservables() {
        this._onBeforeRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
            this._followBehavior._enabled = !this._sixDofDragBehavior.isMoving && this.followBehaviorEnabled;
        });
        this._onDragObserver = this._sixDofDragBehavior.onDragObservable.add((event: { pickInfo: PickingInfo }) => {
            this._sixDofDragBehavior.disableMovement = this._surfaceMagnetismBehavior.findAndUpdateTarget(event.pickInfo);
        });
    }

    private _removeObservables() {
        this._scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
        this._sixDofDragBehavior.onDragObservable.remove(this._onDragObserver);
    }
}
