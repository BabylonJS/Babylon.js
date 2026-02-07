import type { Nullable, Observer, Scene } from "core/index";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISceneContext } from "./sceneContext";
import type { ISelectionService } from "./selectionService";
import type { ISettingsContext } from "./settingsContext";

import { SelectionOutlineLayer } from "core/Layers/selectionOutlineLayer";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { SceneContextIdentity } from "./sceneContext";
import { SelectionServiceIdentity } from "./selectionService";
import { SettingsContextIdentity } from "./settingsContext";

export const HighlightServiceDefinition: ServiceDefinition<[], [ISelectionService, ISceneContext, ISettingsContext]> = {
    friendlyName: "Highlight Service",
    consumes: [SelectionServiceIdentity, SceneContextIdentity, SettingsContextIdentity],
    factory: (selectionService, sceneContext, settingsContext) => {
        let outlineLayer: Nullable<SelectionOutlineLayer> = null;
        let currentScene: Nullable<Scene> = null;
        let activeCameraObserver: Nullable<Observer<Scene>> = null;

        function getOrCreateOutlineLayer(scene: Scene): SelectionOutlineLayer {
            if (!outlineLayer || currentScene !== scene) {
                outlineLayer?.dispose();
                outlineLayer = new SelectionOutlineLayer("InspectorSelectionOutline", scene);
                currentScene = scene;
            }
            return outlineLayer;
        }

        function updateHighlight() {
            const scene = sceneContext.currentScene;
            const entity = selectionService.selectedEntity;

            if (!settingsContext.highlightSelectedEntity || !scene || !scene.activeCamera) {
                outlineLayer?.clearSelection();
                return;
            }

            const layer = getOrCreateOutlineLayer(scene);
            layer.clearSelection();

            if (entity instanceof AbstractMesh && !(entity instanceof GaussianSplattingMesh)) {
                layer.addSelection(entity);
            }
        }

        function watchActiveCamera(scene: Nullable<Scene>) {
            activeCameraObserver?.remove();
            activeCameraObserver = null;

            if (scene) {
                activeCameraObserver = scene.onActiveCameraChanged.add(updateHighlight);
            }
        }

        // React to selection changes.
        const selectionObserver = selectionService.onSelectedEntityChanged.add(updateHighlight);

        // React to scene changes.
        const sceneObserver = sceneContext.currentSceneObservable.add(() => {
            // Dispose the old layer when the scene changes.
            outlineLayer?.dispose();
            outlineLayer = null;
            currentScene = null;
            watchActiveCamera(sceneContext.currentScene);
            updateHighlight();
        });

        // React to settings changes.
        const settingsObserver = settingsContext.settingsChangedObservable.add(updateHighlight);

        // Watch active camera on the initial scene.
        watchActiveCamera(sceneContext.currentScene);

        // Initial update.
        updateHighlight();

        return {
            dispose: () => {
                selectionObserver.remove();
                sceneObserver.remove();
                settingsObserver.remove();
                activeCameraObserver?.remove();
                activeCameraObserver = null;
                outlineLayer?.dispose();
                outlineLayer = null;
                currentScene = null;
            },
        };
    },
};
