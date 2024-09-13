import type { AnimationGroup } from "core/Animations/animationGroup";
import type { Animation } from "core/Animations/animation";
import type { Scene } from "core/scene";
import type { AbstractMesh } from "core/Meshes/abstractMesh";

/**
 * The context for the flow graph assets.
 * This is the context that will be used to store the assets of the flow graph.
 *
 * The flow graph requires a set of assets to correspond to - a list of animations, animation groups, meshes, lights/cameras and so on.
 * An assets context can belong to N flow graph contexts, so it is possible to share assets between multiple flow graphs.
 *
 * The assets context can be synchronized with a scene, so that the assets are automatically updated when the scene is updated.
 * To do that you can call the `synchronizeWithScene` method.
 * However, as opposed to the scene, the flow group cannot have two assets with the same name. The name is unique. If more than one are found, the last one will be used.
 * Note that if the scene has a lot of assets, the constant sync might take some time. It is therefore better to carefully manage assets yourself.
 */
export class FlowGraphAssetsContext {
    /**
     * The list of animations associated with the scene
     */
    public animations: Map<string, Animation> = new Map();

    /**
     * The list of animation groups associated with the scene
     */
    public animationGroups: Map<string, AnimationGroup> = new Map();

    // Further assets maps will be added here when needed.

    private _scene: Scene;

    private _syncScene(): void {
        if (!this._scene) {
            return;
        }

        for (let i = 0; i < this._scene.animations.length; i++) {
            const animation = this._scene.animations[i];
            this.animations.set(animation.name, animation);
        }

        for (let i = 0; i < this._scene.animationGroups.length; i++) {
            const animationGroup = this._scene.animationGroups[i];
            this.animationGroups.set(animationGroup.name, animationGroup);
        }
    }

    public synchronizeWithScene(scene: Scene) {
        this._scene = scene;
        const obs = scene.onBeforeRenderObservable.add(() => {
            this._syncScene();
        });
        scene.onDisposeObservable.add(() => {
            this.animations.clear();
            this.animationGroups.clear();
            scene.onBeforeRenderObservable.remove(obs);
        });
    }
}
