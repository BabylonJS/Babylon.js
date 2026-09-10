import { removeFromScene, type ShadowGenerator } from "@babylonjs/lite";
import { DeleteRegular, WeatherMoonRegular } from "@fluentui/react-icons";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { EngineExplorerServiceIdentity, type IEngineExplorerService } from "../../../engineExplorerService";
import { EngineContextIdentity, type IEngineContext } from "../../../engineContext";
import { GetSceneContexts, GetShadowGeneratorDisplayName } from "../../../sceneEntityUtils";
import { ExplorerServiceIdentity, type IExplorerService } from "../../../../services/panes/explorer/explorerService";
import { SelectionServiceIdentity, type ISelectionService } from "../../../../services/selectionService";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";

const ShadowGeneratorIcon = () => <WeatherMoonRegular />;

export const ShadowGeneratorExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IExplorerService, ISelectionService, IEngineContext]> = {
    friendlyName: "Babylon Lite Shadow Generator Explorer",
    consumes: [EngineExplorerServiceIdentity, ExplorerServiceIdentity, SelectionServiceIdentity, EngineContextIdentity],
    factory: (engineExplorerService, explorerService, selectionService, engineContext) => {
        const providerRegistration = engineExplorerService.addRenderingContextNodeProvider({
            order: 30,
            predicate: IsSceneContext,
            getNodes: (scene) => {
                return [
                    CreateSceneExplorerSectionNode(
                        "shadow-generators",
                        "Shadow Generators",
                        scene.shadowGenerators,
                        (shadowGenerator: ShadowGenerator) => ({ name: GetShadowGeneratorDisplayName(scene, shadowGenerator) }),
                        ShadowGeneratorIcon
                    ),
                ];
            },
            getSnapshot: (scene) => scene.shadowGenerators,
        });
        const removeRegistration = explorerService.addItemCommand({
            predicate: (entity): entity is ShadowGenerator =>
                typeof entity === "object" &&
                entity !== null &&
                GetSceneContexts(engineContext.engine).filter((scene) => scene.shadowGenerators.some((shadowGenerator) => shadowGenerator === entity)).length === 1,
            order: 10000,
            getCommand: (shadowGenerator) => ({
                type: "action",
                mode: "contextMenu",
                displayName: "Remove from Scene",
                icon: DeleteRegular,
                hotKey: { keyCode: "Delete" },
                execute: () => {
                    const owningScenes = GetSceneContexts(engineContext.engine).filter((candidate) => candidate.shadowGenerators.includes(shadowGenerator));
                    if (owningScenes.length === 1) {
                        if (selectionService.selectedEntity === shadowGenerator) {
                            selectionService.selectedEntity = null;
                        }
                        removeFromScene(owningScenes[0], shadowGenerator);
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
