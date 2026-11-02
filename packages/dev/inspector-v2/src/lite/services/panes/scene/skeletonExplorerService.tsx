import { type Bone, type Skeleton } from "@babylonjs/lite";
import { DataLineRegular, PersonWalkingRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type ExplorerNodeDescription, GetEntityId } from "../../../../components/explorer/explorerModel";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { CreateWatchedDisplayInfo } from "../../../explorerDisplayInfo";
import { GetBoneChildren, GetBoneDisplayName, GetSceneSkeletons, GetSkeletonDisplayName } from "../../../skeletonUtils";
import { GetSceneContexts } from "../../../sceneEntityUtils";
import { IsSceneContext } from "./sceneExplorerSection";

const SkeletonIcon: FunctionComponent = () => <PersonWalkingRegular />;
const BoneIcon: FunctionComponent = () => <DataLineRegular />;

/** Contributes reachable skeletons and their read-only bone hierarchy. */
export const SkeletonExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IWatcherService, IEngineContext, ISelectionService]> = {
    friendlyName: "Babylon Lite Skeleton Explorer",
    consumes: [EngineExplorerServiceIdentity, WatcherServiceIdentity, EngineContextIdentity, SelectionServiceIdentity],
    factory: (engineExplorerService, watcherService, engineContext, selectionService) => {
        const getBoneNode = (skeleton: Skeleton, bone: Bone): ExplorerNodeDescription => ({
            id: GetEntityId(bone).toString(),
            kind: "item",
            entity: bone,
            icon: BoneIcon,
            getDisplayInfo: () => ({ name: GetBoneDisplayName(skeleton, bone) }),
            getChildren: () => GetBoneChildren(skeleton, bone).map((child) => getBoneNode(skeleton, child)),
        });
        const providerRegistration = engineExplorerService.addRenderingContextNodeProvider({
            order: 320,
            predicate: IsSceneContext,
            getNodes: (scene) => {
                const skeletons = GetSceneSkeletons(scene);
                return skeletons.length
                    ? [
                          {
                              id: "skeletons",
                              kind: "group",
                              getDisplayInfo: () => ({ name: "Skeletons" }),
                              getChildren: () =>
                                  skeletons.map((skeleton) => ({
                                      id: GetEntityId(skeleton).toString(),
                                      kind: "item",
                                      entity: skeleton,
                                      icon: SkeletonIcon,
                                      getDisplayInfo: () => CreateWatchedDisplayInfo(watcherService, () => GetSkeletonDisplayName(scene, skeleton)),
                                      getChildren: () => GetBoneChildren(skeleton, null).map((bone) => getBoneNode(skeleton, bone)),
                                  })),
                          },
                      ]
                    : [];
            },
            getSnapshot: (scene) => GetSceneSkeletons(scene).flatMap((skeleton) => [skeleton, ...skeleton.bones]),
        });
        const getEntities = (): readonly object[] =>
            GetSceneContexts(engineContext.engine).flatMap((scene) => GetSceneSkeletons(scene).flatMap((skeleton) => [skeleton, ...skeleton.bones]));
        let previousEntities = getEntities();
        const selectionWatcher = watcherService.watchValue(
            getEntities,
            (entities) => {
                const selected = selectionService.selectedEntity;
                if (selected && previousEntities.includes(selected) && !entities.includes(selected)) {
                    selectionService.selectedEntity = null;
                }
                previousEntities = entities;
            },
            (left, right) => left.length === right.length && left.every((entity, index) => entity === right[index])
        );
        return {
            dispose: () => {
                selectionWatcher.dispose();
                providerRegistration.dispose();
            },
        };
    },
};
