import type { Scene } from "core/scene";
import type { RenderTargetsStageAction, ISceneComponent } from "core/sceneComponent";
import { SceneComponentConstants } from "core/sceneComponent";

import { ClusteredLightContainer } from "./clusteredLightContainer";
import { LightConstants } from "../lightConstants";

/**
 * A scene component required for running the clustering step in clustered lights
 */
export class ClusteredLightingSceneComponent implements ISceneComponent {
    /**
     * The name of the component. Each component must have a unique name.
     */
    public name = SceneComponentConstants.NAME_CLUSTEREDLIGHTING;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Creates a new scene component.
     * @param scene The scene the component belongs to
     */
    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Disposes the component and the associated resources.
     */
    public dispose(): void {}

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {}

    /**
     * Register the component to one instance of a scene.
     */
    public register(): void {
        this.scene._gatherActiveCameraRenderTargetsStage.registerStep(
            SceneComponentConstants.STEP_GATHERACTIVECAMERARENDERTARGETS_CLUSTEREDLIGHTING,
            this,
            this._gatherActiveCameraRenderTargets
        );
    }

    private _gatherActiveCameraRenderTargets: RenderTargetsStageAction = (renderTargets) => {
        for (const light of this.scene.lights) {
            if (light.getTypeID() === LightConstants.LIGHTTYPEID_CLUSTERED_CONTAINER && (<ClusteredLightContainer>light).isSupported) {
                renderTargets.push((<ClusteredLightContainer>light)._updateBatches());
            }
        }
    };
}

ClusteredLightContainer._SceneComponentInitialization = (scene) => {
    if (!scene._getComponent(SceneComponentConstants.NAME_CLUSTEREDLIGHTING)) {
        scene._addComponent(new ClusteredLightingSceneComponent(scene));
    }
};
