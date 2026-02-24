import type { TargetedAnimation } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { IWatcherService } from "../../watcherService";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { FilmstripRegular, PauseFilled, PlayFilled, StackRegular } from "@fluentui/react-icons";

import { AnimationGroup } from "core/Animations/animationGroup";
import { Observable } from "core/Misc/observable";
import { SceneContextIdentity } from "../../sceneContext";
import { WatcherServiceIdentity } from "../../watcherService";
import { DefaultCommandsOrder, DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const AnimationGroupExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IWatcherService]> = {
    friendlyName: "Animation Group Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, WatcherServiceIdentity],
    factory: (sceneExplorerService, sceneContext, watcherService) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection<AnimationGroup | TargetedAnimation>({
            displayName: "Animation Groups",
            order: DefaultSectionsOrder.AnimationGroups,
            getRootEntities: () => scene.animationGroups,
            getEntityChildren: (entity) => (entity instanceof AnimationGroup ? entity.targetedAnimations : []),
            getEntityDisplayInfo: (entity) => {
                const namedEntity = entity instanceof AnimationGroup ? entity : entity.animation;

                const onChangeObservable = new Observable<void>();

                const nameHookToken = watcherService.watchProperty(namedEntity, "name", () => onChangeObservable.notifyObservers());

                return {
                    get name() {
                        return namedEntity.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: ({ entity }) => (entity instanceof AnimationGroup ? <StackRegular /> : <FilmstripRegular />),
            getEntityAddedObservables: () => [scene.onNewAnimationGroupAddedObservable],
            getEntityRemovedObservables: () => [scene.onAnimationGroupRemovedObservable],
        });

        const animationPlayPauseCommandRegistration = sceneExplorerService.addEntityCommand({
            predicate: (entity: unknown) => entity instanceof AnimationGroup,
            order: DefaultCommandsOrder.AnimationGroupPlay,
            getCommand: (animationGroup) => {
                const onChangeObservable = new Observable<void>();
                const playObserver = animationGroup.onAnimationGroupPlayObservable.add(() => onChangeObservable.notifyObservers());
                const pauseObserver = animationGroup.onAnimationGroupPauseObservable.add(() => onChangeObservable.notifyObservers());
                const endObserver = animationGroup.onAnimationGroupEndObservable.add(() => onChangeObservable.notifyObservers());

                return {
                    type: "toggle",
                    get displayName() {
                        return `${animationGroup.isPlaying ? "Pause" : "Play"} Animation`;
                    },
                    icon: () => (animationGroup.isPlaying ? <PauseFilled /> : <PlayFilled />),
                    hotKey: {
                        keyCode: "Space",
                        control: true,
                    },
                    get isEnabled() {
                        return animationGroup.isPlaying;
                    },
                    set isEnabled(enabled: boolean) {
                        if (enabled) {
                            animationGroup.play(true);
                        } else {
                            animationGroup.pause();
                        }
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        playObserver.remove();
                        pauseObserver.remove();
                        endObserver.remove();
                        onChangeObservable.clear();
                    },
                };
            },
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
                animationPlayPauseCommandRegistration.dispose();
            },
        };
    },
};
