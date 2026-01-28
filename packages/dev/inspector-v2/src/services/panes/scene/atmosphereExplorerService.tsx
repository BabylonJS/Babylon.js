import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { WeatherSunnyLowFilled } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";
import type { Atmosphere } from "addons/atmosphere/atmosphere";

export const AtmosphereExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Atmosphere Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
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

                const nameHookToken = InterceptProperty(atmosphere, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

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
