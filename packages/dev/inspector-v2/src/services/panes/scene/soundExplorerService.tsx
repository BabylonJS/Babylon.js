import type { IDisposable, Sound, SoundTrack } from "core/index";
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

        let addSoundHook: IDisposable | undefined;
        let removeSoundHook: IDisposable | undefined;

        const hookMainSoundTrack = (mainSoundTrack: SoundTrack | undefined) => {
            addSoundHook?.dispose();
            addSoundHook = undefined;
            removeSoundHook?.dispose();
            removeSoundHook = undefined;

            if (mainSoundTrack) {
                addSoundHook = InterceptFunction(mainSoundTrack, "addSound", {
                    afterCall: (sound) => soundAddedObservable.notifyObservers(sound),
                });

                removeSoundHook = InterceptFunction(mainSoundTrack, "removeSound", {
                    afterCall: (sound) => soundRemovedObservable.notifyObservers(sound),
                });
            }
        };

        // If _mainSoundTrack is already defined, set up hooks immediately.
        hookMainSoundTrack(scene.mainSoundTrack);

        // Watch for _mainSoundTrack being set (it is lazily created by the mainSoundTrack getter in audioSceneComponent.ts).
        const mainSoundTrackHook = InterceptProperty(scene, "_mainSoundTrack", {
            afterSet: () => hookMainSoundTrack(scene._mainSoundTrack),
        });

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Sounds",
            order: DefaultSectionsOrder.Sounds,
            getRootEntities: () => scene.mainSoundTrack?.soundCollection ?? [],
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
                mainSoundTrackHook.dispose();
                addSoundHook?.dispose();
                removeSoundHook?.dispose();
                soundAddedObservable.clear();
                soundRemovedObservable.clear();
                sectionRegistration.dispose();
            },
        };
    },
};
