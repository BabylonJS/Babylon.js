import type { ISpriteManager } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { IWatcherService } from "../../watcherService";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { tokens } from "@fluentui/react-components";
import { LayerDiagonalPersonRegular, PersonSquareRegular, PlayFilled, StopFilled } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { Sprite } from "core/Sprites/sprite";
import { InterceptFunction } from "../../../instrumentation/functionInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { WatcherServiceIdentity } from "../../watcherService";
import { DefaultCommandsOrder, DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

import "core/Sprites/spriteSceneComponent";

export const SpriteManagerExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IWatcherService]> = {
    friendlyName: "Sprite Manager Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, WatcherServiceIdentity],
    factory: (sceneExplorerService, sceneContext, watcherService) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection<Sprite | ISpriteManager>({
            displayName: "Sprite Managers",
            order: DefaultSectionsOrder.SpriteManagers,
            getRootEntities: () => scene.spriteManagers ?? [],
            getEntityChildren: (spriteEntity) => (spriteEntity instanceof Sprite ? [] : spriteEntity.sprites),
            getEntityDisplayInfo: (spriteEntity) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = watcherService.watchProperty(spriteEntity, "name", () => onChangeObservable.notifyObservers());

                return {
                    get name() {
                        return spriteEntity.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: ({ entity: spriteEntity }) =>
                spriteEntity instanceof Sprite ? (
                    <PersonSquareRegular color={tokens.colorPalettePeachForeground2} />
                ) : (
                    <LayerDiagonalPersonRegular color={tokens.colorPalettePeachForeground2} />
                ),
            getEntityAddedObservables: () => [scene.onNewSpriteManagerAddedObservable],
            getEntityRemovedObservables: () => [scene.onSpriteManagerRemovedObservable],
        });

        const spritePlayStopCommandRegistration = sceneExplorerService.addEntityCommand({
            predicate: (entity: unknown) => entity instanceof Sprite,
            order: DefaultCommandsOrder.SpritePlay,
            getCommand: (sprite) => {
                const onChangeObservable = new Observable<void>();
                const playHook = InterceptFunction(sprite, "playAnimation", {
                    afterCall: () => onChangeObservable.notifyObservers(),
                });
                const stopHook = InterceptFunction(sprite, "stopAnimation", {
                    afterCall: () => onChangeObservable.notifyObservers(),
                });
                const animateHook = InterceptFunction(sprite, "_animate", {
                    afterCall: () => onChangeObservable.notifyObservers(),
                });

                return {
                    type: "action",
                    get displayName() {
                        return `${sprite.animationStarted ? "Stop" : "Play"} Animation`;
                    },
                    icon: () => (sprite.animationStarted ? <StopFilled /> : <PlayFilled />),
                    execute: () => (sprite.animationStarted ? sprite.stopAnimation() : sprite.playAnimation(sprite.fromIndex, sprite.toIndex, sprite.loopAnimation, sprite.delay)),
                    onChange: onChangeObservable,
                    dispose: () => {
                        playHook.dispose();
                        stopHook.dispose();
                        animateHook.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
                spritePlayStopCommandRegistration.dispose();
            },
        };
    },
};
