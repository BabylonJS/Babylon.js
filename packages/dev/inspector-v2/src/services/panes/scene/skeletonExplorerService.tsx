import type { Bone } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { IWatcherService } from "../../watcherService";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { tokens } from "@fluentui/react-components";
import { DataLineRegular, PersonWalkingRegular } from "@fluentui/react-icons";

import { Skeleton } from "core/Bones/skeleton";
import { Observable } from "core/Misc/observable";
import { SceneContextIdentity } from "../../sceneContext";
import { WatcherServiceIdentity } from "../../watcherService";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const SkeletonExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IWatcherService]> = {
    friendlyName: "Skeleton Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, WatcherServiceIdentity],
    factory: (sceneExplorerService, sceneContext, watcherService) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const boneMovedObservable = new Observable<Bone>();

        const sectionRegistration = sceneExplorerService.addSection<Skeleton | Bone>({
            displayName: "Skeletons",
            order: DefaultSectionsOrder.Skeletons,
            getRootEntities: () => scene.skeletons,
            getEntityChildren: (skeletonOrBone) => skeletonOrBone.getChildren(),
            getEntityDisplayInfo: (skeletonOrBone) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = watcherService.watchProperty(skeletonOrBone, "name", () => onChangeObservable.notifyObservers());

                const parentHookToken =
                    skeletonOrBone instanceof Skeleton ? null : watcherService.watchProperty(skeletonOrBone, "parent", () => boneMovedObservable.notifyObservers(skeletonOrBone));

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
            entityIcon: ({ entity: skeletonOrBone }) =>
                skeletonOrBone instanceof Skeleton ? (
                    <PersonWalkingRegular color={tokens.colorPaletteAnchorForeground2} />
                ) : (
                    <DataLineRegular color={tokens.colorPaletteBeigeForeground2} />
                ),
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
