import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { IWatcherService } from "../../watcherService";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { BlurRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { SceneContextIdentity } from "../../sceneContext";
import { WatcherServiceIdentity } from "../../watcherService";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const PostProcessExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IWatcherService]> = {
    friendlyName: "Post Process Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, WatcherServiceIdentity],
    factory: (sceneExplorerService, sceneContext, watcherService) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Post Processes",
            order: DefaultSectionsOrder.PostProcesses,
            getRootEntities: () => scene.postProcesses,
            getEntityDisplayInfo: (postProcess) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = watcherService.watchProperty(postProcess, "name", () => onChangeObservable.notifyObservers());

                return {
                    get name() {
                        return postProcess.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: () => <BlurRegular />,
            getEntityAddedObservables: () => [scene.onNewPostProcessAddedObservable],
            getEntityRemovedObservables: () => [scene.onPostProcessRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
