/** This file must only contain pure code and pure imports */

import { Scene } from "../scene.pure";

import { SceneComponentConstants } from "../sceneComponent";
import type { ISceneComponent } from "../sceneComponent";
import { Mesh } from "./mesh.pure";
import { ISimplificationSettings, SimplificationQueue, SimplificationType } from "./meshSimplification";

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
     * Disposes the component and the associated resources
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

let _Registered = false;
/**
 * Register side effects for meshSimplificationSceneComponent.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterMeshSimplificationSceneComponent(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    Object.defineProperty(Scene.prototype, "simplificationQueue", {
        get: function (this: Scene) {
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
        set: function (this: Scene, value: SimplificationQueue) {
            this._simplificationQueue = value;
        },
        enumerable: true,
        configurable: true,
    });

    Mesh.prototype.simplify = function (
        settings: Array<ISimplificationSettings>,
        parallelProcessing: boolean = true,
        simplificationType: SimplificationType = SimplificationType.QUADRATIC,
        successCallback?: (mesh?: Mesh, submeshIndex?: number) => void
    ): Mesh {
        this.getScene().simplificationQueue.addTask({
            settings: settings,
            parallelProcessing: parallelProcessing,
            mesh: this,
            simplificationType: simplificationType,
            successCallback: successCallback,
        });
        return this;
    };
}
