import type { Scene } from "core/scene";
import { type RenderTargetsStageAction, SceneComponentConstants, type ISceneComponent } from "core/sceneComponent";

import { ClusteredLight } from "./clusteredLight";

class ClusteredLightSceneComponent implements ISceneComponent {
    public name = SceneComponentConstants.NAME_CLUSTEREDLIGHT;

    public scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public dispose(): void {}

    public rebuild(): void {}

    public register(): void {
        this.scene._gatherActiveCameraRenderTargetsStage.registerStep(
            SceneComponentConstants.STEP_GATHERACTIVECAMERARENDERTARGETS_CLUSTEREDLIGHT,
            this,
            this._gatherActiveCameraRenderTargets
        );
    }

    private _gatherActiveCameraRenderTargets: RenderTargetsStageAction = (renderTargets) => {
        for (const light of this.scene.lights) {
            if (light instanceof ClusteredLight && light.isSupported) {
                renderTargets.push(light._createTileMask());
            }
        }
    };
}

ClusteredLight._SceneComponentInitialization = (scene) => {
    if (!scene._getComponent(SceneComponentConstants.NAME_CLUSTEREDLIGHT)) {
        scene._addComponent(new ClusteredLightSceneComponent(scene));
    }
};
