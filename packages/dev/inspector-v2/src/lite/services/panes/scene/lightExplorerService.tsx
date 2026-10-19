import { removeFromScene, type LightBase } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { DeleteRegular, LightbulbRegular } from "@fluentui/react-icons";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { EngineExplorerServiceIdentity, type IEngineExplorerService } from "../../../engineExplorerService";
import { EngineContextIdentity, type IEngineContext } from "../../../engineContext";
import { GetLightDisplayName, GetSceneContexts, IsLight, IsSceneNode, IsSceneNodeDescendantOf } from "../../../sceneEntityUtils";
import { ExplorerServiceIdentity, type IExplorerService } from "../../../../services/panes/explorer/explorerService";
import { SelectionServiceIdentity, type ISelectionService } from "../../../../services/selectionService";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";
import { ClearRemovedSelection } from "./sceneSelectionUtils";

const LightIcon = () => <LightbulbRegular color={tokens.colorPaletteYellowForeground2} />;

export const LightExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IExplorerService, ISelectionService, IEngineContext]> = {
    friendlyName: "Babylon Lite Light Explorer",
    consumes: [EngineExplorerServiceIdentity, ExplorerServiceIdentity, SelectionServiceIdentity, EngineContextIdentity],
    factory: (engineExplorerService, explorerService, selectionService, engineContext) => {
        const providerRegistration = engineExplorerService.addRenderingContextNodeProvider({
            order: 20,
            predicate: IsSceneContext,
            getNodes: (scene) => {
                return [CreateSceneExplorerSectionNode("lights", "Lights", scene.lights, (light: LightBase, index) => ({ name: GetLightDisplayName(light, index) }), LightIcon)];
            },
            getSnapshot: (scene) => scene.lights,
        });
        const removeRegistration = explorerService.addItemCommand({
            predicate: (entity): entity is LightBase => IsLight(entity) && GetSceneContexts(engineContext.engine).filter((scene) => scene.lights.includes(entity)).length === 1,
            order: 10000,
            getCommand: (light) => ({
                type: "action",
                mode: "contextMenu",
                displayName: "Remove from Scene",
                icon: DeleteRegular,
                hotKey: { keyCode: "Delete" },
                execute: () => {
                    const owningScenes = GetSceneContexts(engineContext.engine).filter((candidate) => candidate.lights.includes(light));
                    if (owningScenes.length === 1) {
                        const selectedEntity = selectionService.selectedEntity;
                        const selectionWasRemoved =
                            selectedEntity === light || selectedEntity === light.shadowGenerator || (IsSceneNode(selectedEntity) && IsSceneNodeDescendantOf(selectedEntity, light));
                        removeFromScene(owningScenes[0], light);
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
