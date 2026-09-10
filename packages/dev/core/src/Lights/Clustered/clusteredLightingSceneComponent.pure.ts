/** This file must only contain pure code and pure imports */

import { type Scene } from "core/scene.pure";
import { SceneComponentConstants, type RenderTargetsStageAction, type ISceneComponent } from "core/sceneComponent";
import { type ClusteredLightContainer } from "./clusteredLightContainer.pure";
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
    public dispose(): void {
        this.scene.removeIsReadyCheck(this);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {}

    /**
     * Register the component to one instance of a scene.
     */
    public register(): void {
        this.scene.addIsReadyCheck(this);
        this.scene._gatherActiveCameraRenderTargetsStage.registerStep(
            SceneComponentConstants.STEP_GATHERACTIVECAMERARENDERTARGETS_CLUSTEREDLIGHTING,
            this,
            this._gatherActiveCameraRenderTargets
        );
    }

    /**
     * Checks that enabled clustered lights have prepared their proxy shaders.
     * @returns true when every supported, enabled container is ready
     */
    public isReady(): boolean {
        if (!this.scene.lightsEnabled) {
            return true;
        }

        // Proxy meshes are outside scene.meshes, and cached material readiness can skip their checks.
        let ready = true;
        for (const light of this.scene.lights) {
            if (light.getTypeID() === LightConstants.LIGHTTYPEID_CLUSTERED_CONTAINER && (<ClusteredLightContainer>light).isSupported && light.isEnabled() && !light._isReady()) {
                ready = false;
            }
        }
        return ready;
    }

    private _gatherActiveCameraRenderTargets: RenderTargetsStageAction = (renderTargets) => {
        for (const light of this.scene.lights) {
            if (light.getTypeID() === LightConstants.LIGHTTYPEID_CLUSTERED_CONTAINER && (<ClusteredLightContainer>light).isSupported) {
                renderTargets.push((<ClusteredLightContainer>light)._updateBatches());
            }
        }
    };
}

let _Registered = false;
/**
 * Register side effects for clusteredLightingSceneComponent.
 * Safe to call multiple times; only the first call has an effect.
 * @param clusteredLightContainerClass The ClusteredLightContainer class to register the component for
 */
export function RegisterClusteredLightingSceneComponent(clusteredLightContainerClass: typeof ClusteredLightContainer): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    clusteredLightContainerClass._SceneComponentInitialization = (scene) => {
        if (!scene._getComponent(SceneComponentConstants.NAME_CLUSTEREDLIGHTING)) {
            scene._addComponent(new ClusteredLightingSceneComponent(scene));
        }
    };
}
