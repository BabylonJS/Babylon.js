import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { IWatcher } from "../../watcherService";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { WeatherSunnyLowFilled } from "@fluentui/react-icons";

import type { Atmosphere } from "addons/atmosphere/atmosphere";
import { Observable } from "core/Misc/observable";
import { SceneContextIdentity } from "../../sceneContext";
import { WatcherServiceIdentity } from "../../watcherService";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const AtmosphereExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IWatcher]> = {
    friendlyName: "Atmosphere Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, WatcherServiceIdentity],
    factory: (sceneExplorerService, sceneContext, watcher) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }
        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Atmosphere",
            order: DefaultSectionsOrder.Atmosphere,
            getRootEntities: () => (scene.getExternalData("atmosphere") ? [scene.getExternalData("atmosphere") as Atmosphere] : []),
            getEntityDisplayInfo: (atmosphere) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = watcher.watchProperty(atmosphere, "name", () => onChangeObservable.notifyObservers());

                return {
                    get name() {
                        return atmosphere.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: () => <WeatherSunnyLowFilled />,
            // TODO in order for inspector UX to display atmosphere created after inspector is created
            getEntityAddedObservables: () => [],
            getEntityRemovedObservables: () => [],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
