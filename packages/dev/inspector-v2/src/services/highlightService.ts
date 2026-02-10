import type { Nullable, Observer, Scene } from "core/index";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISceneContext } from "./sceneContext";
import type { ISelectionService } from "./selectionService";
import type { ISettingsContext } from "./settingsContext";
import type { IThemeService } from "./themeService";

import { SelectionOutlineLayer } from "core/Layers/selectionOutlineLayer";
import { Color3 } from "core/Maths/math.color";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { SceneContextIdentity } from "./sceneContext";
import { SelectionServiceIdentity } from "./selectionService";
import { SettingsContextIdentity } from "./settingsContext";
import { ThemeServiceIdentity } from "./themeService";

export const HighlightServiceDefinition: ServiceDefinition<[], [ISelectionService, ISceneContext, ISettingsContext, IThemeService]> = {
    friendlyName: "Highlight Service",
    consumes: [SelectionServiceIdentity, SceneContextIdentity, SettingsContextIdentity, ThemeServiceIdentity],
    factory: (selectionService, sceneContext, settingsContext, themeService) => {
        let outlineLayer: Nullable<SelectionOutlineLayer> = null;
        let currentScene: Nullable<Scene> = null;
        let activeCameraObserver: Nullable<Observer<Scene>> = null;

        function disposeOutlineLayer() {
            outlineLayer?.dispose();
            outlineLayer = null;
            currentScene = null;
        }

        function getOrCreateOutlineLayer(scene: Scene): SelectionOutlineLayer {
            if (!outlineLayer || currentScene !== scene) {
                disposeOutlineLayer();
                outlineLayer = new SelectionOutlineLayer("InspectorSelectionOutline", scene);
                updateColor(outlineLayer);
                currentScene = scene;
            }
            return outlineLayer;
        }

        function updateColor(outlineLayer: SelectionOutlineLayer) {
            outlineLayer.outlineColor = Color3.FromHexString(themeService.theme.colorBrandForeground1);
        }

        function updateHighlight() {
            const scene = sceneContext.currentScene;
            const entity =
                selectionService.selectedEntity instanceof AbstractMesh && !(selectionService.selectedEntity instanceof GaussianSplattingMesh)
                    ? selectionService.selectedEntity
                    : null;

            if (!entity || !settingsContext.highlightSelectedEntity || !scene || !scene.activeCamera) {
                disposeOutlineLayer();
                return;
            }

            const layer = getOrCreateOutlineLayer(scene);
            layer.clearSelection();
            layer.addSelection(entity);
        }

        function watchActiveCamera(scene: Nullable<Scene>) {
            activeCameraObserver?.remove();
            activeCameraObserver = null;

            if (scene) {
                activeCameraObserver = scene.onActiveCameraChanged.add(updateHighlight);
            }
        }

        // React to theme changes.
        const themeObserver = themeService.onChanged.add(() => {
            if (outlineLayer) {
                updateColor(outlineLayer);
            }
        });

        // React to selection changes.
        const selectionObserver = selectionService.onSelectedEntityChanged.add(updateHighlight);

        // React to scene changes.
        const sceneObserver = sceneContext.currentSceneObservable.add(() => {
            // Dispose the old layer when the scene changes.
            disposeOutlineLayer();
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
                themeObserver.remove();
                selectionObserver.remove();
                sceneObserver.remove();
                settingsObserver.remove();
                activeCameraObserver?.remove();
                activeCameraObserver = null;
                disposeOutlineLayer();
            },
        };
    },
};
