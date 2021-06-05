import { Behavior } from "babylonjs/Behaviors/behavior";
import { FollowBehavior } from "babylonjs/Behaviors/Meshes/followBehavior";
import { SixDofDragBehavior } from "babylonjs/Behaviors/Meshes/sixDofDragBehavior";
import { Scene } from "babylonjs/scene";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Observer } from "babylonjs/Misc/observable";
import { Nullable } from "babylonjs/types";

/**
 * Default behavior for 3D UI elements.
 * Handles a FollowBehavior, SixDofBehavior and MultiPointerScaleBehavior
 */
export class DefaultBehavior implements Behavior<Mesh> {
    private _scene: Scene;
    private _followBehavior: FollowBehavior;
    private _sixDofDragBehavior: SixDofDragBehavior;
    private _onBeforeRender: Nullable<Observer<Scene>>;

    /**
     * Instantiates the default behavior
     */
    constructor() {
        this._followBehavior = new FollowBehavior();
        this._sixDofDragBehavior = new SixDofDragBehavior();
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
     * Enables the follow behavior
     */
    public followBehaviorEnabled: boolean = false;

    /**
     * Enables the six DoF drag behavior
     */
    public sixDofDragBehaviorEnabled: boolean = true;

    /**
     *  Initializes the behavior
     */
    public init() {}

    /**
     * Attaches the default behavior
     * @param ownerMesh The top level mesh
     * @param draggablesMeshes Descendant meshes that can be used for dragging the owner mesh
     */
    public attach(ownerMesh: Mesh, draggablesMeshes?: Mesh[]): void {
        this._scene = ownerMesh.getScene();
        this.attachedNode = ownerMesh;

        this._addObservables();
        // Since our observables are bound before the child behaviors', ours are called first
        this._followBehavior.attach(ownerMesh);
        this._sixDofDragBehavior.attach(ownerMesh);
        this._sixDofDragBehavior.draggableMeshes = draggablesMeshes || null;
        this._sixDofDragBehavior.faceCameraOnDragStart = true;
    }

    /**
     *  Detaches the behavior from the mesh
     */
    public detach(): void {
        this.attachedNode = null;
        this._removeObservables();
        this._followBehavior.detach();
        this._sixDofDragBehavior.detach();
    }

    private _addObservables() {
        this._onBeforeRender = this._scene.onBeforeRenderObservable.add(() => {
            this._followBehavior._enabled = !this._sixDofDragBehavior.isMoving && this.followBehaviorEnabled;
        });
    }

    private _removeObservables() {
        this._scene.onBeforeRenderObservable.remove(this._onBeforeRender);
    }
}
