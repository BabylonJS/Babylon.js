import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { DataLineRegular, PersonWalkingRegular } from "@fluentui/react-icons";

import { Bone } from "core/Bones/bone";
import { Skeleton } from "core/Bones/skeleton";
import { Observable } from "core/Misc/observable";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const SkeletonHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Skeleton Hierarchy",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const boneMovedObservable = new Observable<Bone>();

        const sectionRegistration = sceneExplorerService.addSection<Skeleton | Bone>({
            displayName: "Skeletons",
            order: 200,
            predicate: (entity) => entity instanceof Skeleton || entity instanceof Bone,
            getRootEntities: () => scene.skeletons,
            getEntityChildren: (skeletonOrBone) => skeletonOrBone.getChildren(),
            getEntityParent: (skeletonOrBone) => (skeletonOrBone instanceof Skeleton ? null : skeletonOrBone.getParent() || skeletonOrBone.getSkeleton()),
            getEntityDisplayInfo: (skeletonOrBone) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = InterceptProperty(skeletonOrBone, "name", {
                    afterSet: () => onChangeObservable.notifyObservers(),
                });

                const parentHookToken =
                    skeletonOrBone instanceof Skeleton
                        ? null
                        : InterceptProperty(skeletonOrBone, "parent", {
                              afterSet: () => {
                                  boneMovedObservable.notifyObservers(skeletonOrBone);
                              },
                          });

                return {
                    get name() {
                        return skeletonOrBone.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        parentHookToken?.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: ({ entity: skeletonOrBone }) => (skeletonOrBone instanceof Skeleton ? <PersonWalkingRegular /> : <DataLineRegular />),
            getEntityAddedObservables: () => [scene.onNewSkeletonAddedObservable],
            getEntityRemovedObservables: () => [scene.onSkeletonRemovedObservable],
            getEntityMovedObservables: () => [boneMovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
