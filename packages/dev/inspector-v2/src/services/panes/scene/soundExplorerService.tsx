import type { Sound } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { SoundWaveCircleRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { InterceptFunction } from "../../../instrumentation/functionInstrumentation";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const SoundExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Sound Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const soundAddedObservable = new Observable<Sound>();
        const soundRemovedObservable = new Observable<Sound>();

        const addSoundHook = InterceptFunction(scene.mainSoundTrack, "addSound", {
            afterCall: (sound) => soundAddedObservable.notifyObservers(sound),
        });

        const removeSoundHook = InterceptFunction(scene.mainSoundTrack, "removeSound", {
            afterCall: (sound) => soundRemovedObservable.notifyObservers(sound),
        });

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Sounds",
            order: DefaultSectionsOrder.Sounds,
            getRootEntities: () => scene.mainSoundTrack.soundCollection,
            getEntityDisplayInfo: (sound) => {
                const onChangeObservable = new Observable<void>();

                const displayNameHookToken = InterceptProperty(sound, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

                const nameHookToken = InterceptProperty(sound, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

                return {
                    get name() {
                        return sound.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        displayNameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: () => <SoundWaveCircleRegular />,
            getEntityAddedObservables: () => [soundAddedObservable],
            getEntityRemovedObservables: () => [soundRemovedObservable],
        });

        return {
            dispose: () => {
                addSoundHook.dispose();
                removeSoundHook.dispose();
                soundAddedObservable.clear();
                soundRemovedObservable.clear();
                sectionRegistration.dispose();
            },
        };
    },
};
