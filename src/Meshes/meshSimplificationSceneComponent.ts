import { Scene } from "../scene";
import { Mesh } from "./mesh";
import { SimplificationQueue, ISimplificationSettings, SimplificationType } from "./meshSimplification";
import { SceneComponentConstants, ISceneComponent } from "../sceneComponent";

declare module "../scene" {
    export interface Scene {
        /** @hidden (Backing field) */
        _simplificationQueue: SimplificationQueue;

        /**
         * Gets or sets the simplification queue attached to the scene
         * @see https://doc.babylonjs.com/how_to/in-browser_mesh_simplification
         */
        simplificationQueue: SimplificationQueue;
    }
}
Object.defineProperty(Scene.prototype, "simplificationQueue", {
    get: function(this: Scene) {
        if (!this._simplificationQueue) {
            this._simplificationQueue = new SimplificationQueue();
            let component = this._getComponent(SceneComponentConstants.NAME_SIMPLIFICATIONQUEUE) as SimplicationQueueSceneComponent;
            if (!component) {
                component = new SimplicationQueueSceneComponent(this);
                this._addComponent(component);
            }
        }
        return this._simplificationQueue;
    },
    set: function(this: Scene, value: SimplificationQueue) {
        this._simplificationQueue = value;
    },
    enumerable: true,
    configurable: true
});

declare module "../Meshes/mesh" {
    export interface Mesh {
        /**
         * Simplify the mesh according to the given array of settings.
         * Function will return immediately and will simplify async
         * @param settings a collection of simplification settings
         * @param parallelProcessing should all levels calculate parallel or one after the other
         * @param simplificationType the type of simplification to run
         * @param successCallback optional success callback to be called after the simplification finished processing all settings
         * @returns the current mesh
         */
        simplify(settings: Array<ISimplificationSettings>, parallelProcessing?: boolean, simplificationType?: SimplificationType, successCallback?: (mesh?: Mesh, submeshIndex?: number) => void): Mesh;
    }
}

Mesh.prototype.simplify = function(settings: Array<ISimplificationSettings>, parallelProcessing: boolean = true, simplificationType: SimplificationType = SimplificationType.QUADRATIC, successCallback?: (mesh?: Mesh, submeshIndex?: number) => void): Mesh {
    this.getScene().simplificationQueue.addTask({
        settings: settings,
        parallelProcessing: parallelProcessing,
        mesh: this,
        simplificationType: simplificationType,
        successCallback: successCallback
    });
    return this;
};

/**
 * Defines the simplification queue scene component responsible to help scheduling the various simplification task
 * created in a scene
 */
export class SimplicationQueueSceneComponent implements ISceneComponent {
    /**
     * The component name helpfull to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_SIMPLIFICATIONQUEUE;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
        this.scene._beforeCameraUpdateStage.registerStep(SceneComponentConstants.STEP_BEFORECAMERAUPDATE_SIMPLIFICATIONQUEUE, this, this._beforeCameraUpdate);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do for this component
    }

    /**
     * Disposes the component and the associated ressources
     */
    public dispose(): void {
        // Nothing to do for this component
    }

    private _beforeCameraUpdate(): void {
        if (this.scene._simplificationQueue && !this.scene._simplificationQueue.running) {
            this.scene._simplificationQueue.executeNext();
        }
    }
}
