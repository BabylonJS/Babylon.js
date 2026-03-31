import { type ServiceDefinition } from "../../../modularity/serviceDefinition";
import { type ISceneContext, SceneContextIdentity } from "../../sceneContext";
import { type IWatcherService, WatcherServiceIdentity } from "../../watcherService";
import { type ISceneExplorerService, SceneExplorerServiceIdentity } from "./sceneExplorerService";

import { tokens } from "@fluentui/react-components";
import { LayerRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";

export const EffectLayerExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IWatcherService]> = {
    friendlyName: "Effect Layer Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, WatcherServiceIdentity],
    factory: (sceneExplorerService, sceneContext, watcherService) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Effect Layers",
            order: DefaultSectionsOrder.EffectLayers,
            getRootEntities: () => scene.effectLayers,
            getEntityDisplayInfo: (effectLayer) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = watcherService.watchProperty(effectLayer, "name", () => onChangeObservable.notifyObservers());

                return {
                    get name() {
                        return effectLayer.name || `Unnamed ${effectLayer.getClassName()}`;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: () => <LayerRegular color={tokens.colorPaletteRedForeground2} />,
            getEntityAddedObservables: () => [scene.onNewEffectLayerAddedObservable],
            getEntityRemovedObservables: () => [scene.onEffectLayerRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
