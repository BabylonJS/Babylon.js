import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { SceneExplorerServiceIdentity } from "./sceneExplorerService";
import { Skeleton } from "core/Bones/skeleton";
import { Bone } from "core/Bones/bone";

export const SkeletonHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Skeleton Hierarchy",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const sectionRegistration = sceneExplorerService.addSection<Skeleton | Bone>({
            displayName: "Skeletons",
            order: 0,
            getRootEntities: (scene) => scene.skeletons,
            getEntityChildren: (skeletonOrBone) => skeletonOrBone.getChildren(),
            getEntityParent: (skeletonOrBone) => (skeletonOrBone instanceof Skeleton ? null : skeletonOrBone.getParent() || skeletonOrBone.getSkeleton()),
            getEntityDisplayName: (skeletonOrBone) => skeletonOrBone.name,
            getEntityAddedObservables: (scene) => [scene.onNewSkeletonAddedObservable],
            getEntityRemovedObservables: (scene) => [scene.onSkeletonRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
