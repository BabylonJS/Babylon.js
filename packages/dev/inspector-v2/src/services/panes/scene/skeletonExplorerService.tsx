import type { Bone } from "core/index";

import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { DataLineRegular, PersonWalkingRegular } from "@fluentui/react-icons";

import { Skeleton } from "core/Bones/skeleton";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

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
            entityIcon: ({ entity: skeletonOrBone }) => (skeletonOrBone instanceof Skeleton ? <PersonWalkingRegular /> : <DataLineRegular />),
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
