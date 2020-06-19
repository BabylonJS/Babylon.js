import { ISceneComponent, SceneComponentConstants } from "../../sceneComponent";
import { PostProcessRenderPipelineManager } from "./postProcessRenderPipelineManager";
import { Scene } from "../../scene";

declare module "../../scene" {
    export interface Scene {
        /** @hidden (Backing field) */
        _postProcessRenderPipelineManager: PostProcessRenderPipelineManager;

        /**
         * Gets the postprocess render pipeline manager
         * @see https://doc.babylonjs.com/how_to/how_to_use_postprocessrenderpipeline
         * @see https://doc.babylonjs.com/how_to/using_default_rendering_pipeline
         */
        readonly postProcessRenderPipelineManager: PostProcessRenderPipelineManager;
    }
}

Object.defineProperty(Scene.prototype, "postProcessRenderPipelineManager", {
    get: function(this: Scene) {
        if (!this._postProcessRenderPipelineManager) {
            // Register the G Buffer component to the scene.
            let component = this._getComponent(SceneComponentConstants.NAME_POSTPROCESSRENDERPIPELINEMANAGER) as PostProcessRenderPipelineManagerSceneComponent;
            if (!component) {
                component = new PostProcessRenderPipelineManagerSceneComponent(this);
                this._addComponent(component);
            }
            this._postProcessRenderPipelineManager = new PostProcessRenderPipelineManager();
        }

        return this._postProcessRenderPipelineManager;
    },
    enumerable: true,
    configurable: true
});

/**
 * Defines the Render Pipeline scene component responsible to rendering pipelines
 */
export class PostProcessRenderPipelineManagerSceneComponent implements ISceneComponent {
    /**
     * The component name helpfull to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_POSTPROCESSRENDERPIPELINEMANAGER;

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
        this.scene._gatherRenderTargetsStage.registerStep(SceneComponentConstants.STEP_GATHERRENDERTARGETS_POSTPROCESSRENDERPIPELINEMANAGER, this, this._gatherRenderTargets);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        if (this.scene._postProcessRenderPipelineManager) {
            this.scene._postProcessRenderPipelineManager._rebuild();
        }
    }

    /**
     * Disposes the component and the associated ressources
     */
    public dispose(): void {
        if (this.scene._postProcessRenderPipelineManager) {
            this.scene._postProcessRenderPipelineManager.dispose();
        }
    }

    private _gatherRenderTargets(): void {
        if (this.scene._postProcessRenderPipelineManager) {
            this.scene._postProcessRenderPipelineManager.update();
        }
    }
}
