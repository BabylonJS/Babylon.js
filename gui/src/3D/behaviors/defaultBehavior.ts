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
 *
 */
export class DefaultBehavior implements Behavior<Mesh> {
    private _scene: Scene;
    private _followBehavior: FollowBehavior;
    private _sixDofDragBehavior: SixDofDragBehavior;
    private _onBeforeRender: Nullable<Observer<Scene>>;

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
    public followBehaviorEnabled: boolean = true;

    /**
     * Enables the six DoF drag behavior
     */
    public sixDofDragBehaviorEnabled: boolean = true;

    /**
     *  Initializes the behavior
     */
    public init() {}

    /**
     * Attaches the follow behavior
     * @param ownerNode The mesh that will be following once attached
     * @param followedCamera The camera that should be followed by the node
     */
    public attach(ownerNode: Mesh, sixDofAnchorMesh?: Mesh): void {
        this._scene = ownerNode.getScene();
        this.attachedNode = ownerNode;

        this._addObservables();
        // Since our observables are bound before the child behaviors', ours are called first
        this._followBehavior.attach(ownerNode);
        this._sixDofDragBehavior.attach(sixDofAnchorMesh || ownerNode);
        this._sixDofDragBehavior.ancestorToDrag = sixDofAnchorMesh ? ownerNode : null;
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
