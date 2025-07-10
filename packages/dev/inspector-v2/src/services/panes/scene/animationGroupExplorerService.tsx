import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { FilmstripRegular, StackRegular } from "@fluentui/react-icons";

import { AnimationGroup, TargetedAnimation } from "core/Animations/animationGroup";
import { Observable } from "core/Misc";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const AnimationGroupExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Animation Group Hierarchy",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Animation Groups",
            order: 800,
            predicate: (entity) => entity instanceof AnimationGroup || entity instanceof TargetedAnimation,
            getRootEntities: () => scene.animationGroups,
            getEntityChildren: (entity) => (entity instanceof AnimationGroup ? entity.targetedAnimations : []),
            getEntityParent: (entity) => (entity instanceof TargetedAnimation ? entity.parent : null),
            getEntityDisplayInfo: (entity) => {
                const namedEntity = entity instanceof AnimationGroup ? entity : entity.animation;

                const onChangeObservable = new Observable<void>();

                const nameHookToken = InterceptProperty(namedEntity, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

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

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
