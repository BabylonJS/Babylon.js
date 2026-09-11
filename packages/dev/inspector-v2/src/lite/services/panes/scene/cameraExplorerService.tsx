import { removeFromScene, type Camera } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { CameraRegular, DeleteRegular } from "@fluentui/react-icons";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { EngineExplorerServiceIdentity, type IEngineExplorerService } from "../../../engineExplorerService";
import { EngineContextIdentity, type IEngineContext } from "../../../engineContext";
import { CreateWatchedNameDisplayInfo } from "../../../explorerDisplayInfo";
import { GetSceneContexts, IsCamera, IsSceneNode, IsSceneNodeDescendantOf } from "../../../sceneEntityUtils";
import { ExplorerServiceIdentity, type IExplorerService } from "../../../../services/panes/explorer/explorerService";
import { SelectionServiceIdentity, type ISelectionService } from "../../../../services/selectionService";
import { WatcherServiceIdentity, type IWatcherService } from "../../../../services/watcherService";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";
import { ClearRemovedSelection } from "./sceneSelectionUtils";

const CameraIcon = () => <CameraRegular color={tokens.colorPaletteGreenForeground2} />;

export const CameraExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IExplorerService, IWatcherService, ISelectionService, IEngineContext]> = {
    friendlyName: "Babylon Lite Camera Explorer",
    consumes: [EngineExplorerServiceIdentity, ExplorerServiceIdentity, WatcherServiceIdentity, SelectionServiceIdentity, EngineContextIdentity],
    factory: (engineExplorerService, explorerService, watcherService, selectionService, engineContext) => {
        const providerRegistration = engineExplorerService.addRenderingContextNodeProvider({
            order: 10,
            predicate: IsSceneContext,
            getNodes: (scene) => {
                return [
                    CreateSceneExplorerSectionNode(
                        "cameras",
                        "Cameras",
                        scene.camera ? [scene.camera] : [],
                        (camera: Camera) => CreateWatchedNameDisplayInfo(watcherService, camera, () => camera.name || "Camera"),
                        CameraIcon
                    ),
                ];
            },
            getSnapshot: (scene) => (scene.camera ? [scene.camera] : []),
        });
        const removeRegistration = explorerService.addItemCommand({
            predicate: (entity): entity is Camera => IsCamera(entity) && GetSceneContexts(engineContext.engine).filter((scene) => scene.camera === entity).length === 1,
            order: 10000,
            getCommand: (camera) => ({
                type: "action",
                mode: "contextMenu",
                displayName: "Remove from Scene",
                icon: DeleteRegular,
                hotKey: { keyCode: "Delete" },
                execute: () => {
                    const owningScenes = GetSceneContexts(engineContext.engine).filter((candidate) => candidate.camera === camera);
                    if (owningScenes.length === 1) {
                        const selectedEntity = selectionService.selectedEntity;
                        const selectionWasRemoved = selectedEntity === camera || (IsSceneNode(selectedEntity) && IsSceneNodeDescendantOf(selectedEntity, camera));
                        removeFromScene(owningScenes[0], camera);
                        ClearRemovedSelection(selectionService, engineContext, selectionWasRemoved);
                    }
                },
            }),
        });

        return {
            dispose: () => {
                removeRegistration.dispose();
                providerRegistration.dispose();
            },
        };
    },
};
