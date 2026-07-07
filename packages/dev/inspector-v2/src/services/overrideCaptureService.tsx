import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ISceneContext, SceneContextIdentity } from "./sceneContext";
import { type IPropertiesService, PropertiesServiceIdentity } from "./panes/properties/propertiesService";

import { type CaptureState, CreateCaptureState, HandleCapturedPropertyChange } from "./overrideCapture";
import { type Scene } from "core/scene";
import { type IObserver } from "core/Misc/observable";

/**
 * Inspector service that captures property edits made through Inspector and
 * feeds them to the OverrideManager as persistent overrides.
 *
 * Works on any scene object — overrides have no concept of "which asset"
 * owns an object. When multiple objects share a name, an entity's position
 * among same-named siblings (`targetIndex`) is captured so the override
 * re-applies to the same object after reload.
 *
 * The service re-attaches to the current scene whenever it changes, so
 * overrides are captured against the active scene even after loads/swaps.
 *
 * The capture logic itself lives in the React-free `overrideCapture`
 * module so it can be reused by non-Inspector edit paths (e.g. scene-explorer
 * commands) and unit-tested without a DOM.
 */
export const OverrideCaptureServiceDefinition: ServiceDefinition<[], [ISceneContext, IPropertiesService]> = {
    friendlyName: "Override Capture",
    consumes: [SceneContextIdentity, PropertiesServiceIdentity],
    factory: (sceneContext, propertiesService) => {
        // Per-scene identity tracking, re-created on each scene attach so
        // identities don't leak across scenes.
        let captureState: CaptureState = CreateCaptureState();
        let changeObserver: IObserver | null = null;

        function attachToScene(scene: Scene | null): void {
            if (changeObserver) {
                changeObserver.remove();
                changeObserver = null;
            }
            captureState = CreateCaptureState();
            if (!scene) {
                return;
            }

            changeObserver = propertiesService.onPropertyChanged.add((changeInfo) => {
                HandleCapturedPropertyChange(scene, captureState, changeInfo);
            });
        }

        attachToScene(sceneContext.currentScene);
        const sceneSubObserver = sceneContext.currentSceneObservable.add((scene) => attachToScene(scene));

        return {
            dispose: () => {
                sceneSubObserver.remove();
                if (changeObserver) {
                    changeObserver.remove();
                    changeObserver = null;
                }
            },
        };
    },
};
