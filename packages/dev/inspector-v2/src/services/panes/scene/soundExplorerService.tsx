import type { IDisposable, Sound, SoundTrack } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";
import type { IWatcherService } from "../../watcherService";

import { tokens } from "@fluentui/react-components";
import { SoundWaveCircleRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { InterceptFunction } from "../../../instrumentation/functionInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";
import { WatcherServiceIdentity } from "../../watcherService";

export const SoundExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IWatcherService]> = {
    friendlyName: "Sound Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, WatcherServiceIdentity],
    factory: (sceneExplorerService, sceneContext, watcherService) => {
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
        const mainSoundTrackHook = watcherService.watchProperty(scene, "_mainSoundTrack", () => hookMainSoundTrack(scene._mainSoundTrack));

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Sounds",
            order: DefaultSectionsOrder.Sounds,
            getRootEntities: () => scene.mainSoundTrack?.soundCollection ?? [],
            getEntityDisplayInfo: (sound) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = watcherService.watchProperty(sound, "name", () => onChangeObservable.notifyObservers());

                return {
                    get name() {
                        return sound.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: () => <SoundWaveCircleRegular color={tokens.colorPaletteForestForeground2} />,
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
